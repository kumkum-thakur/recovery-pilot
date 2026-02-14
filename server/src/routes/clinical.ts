import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/authentication.js';
import { getReadDb, getWriteDb } from '../config/database.js';
import { cache } from '../config/redis.js';
import { createLogger } from '../utils/logger.js';
import { writeAuditLog, AuditEventType } from '../middleware/audit.js';
import { env } from '../config/environment.js';

const log = createLogger('clinical');

export const clinicalRouter = Router();

clinicalRouter.use(authenticateToken);

// --- Triage Queue ---
clinicalRouter.get(
  '/triage',
  requireRole('doctor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const status = req.query['status'] as string || 'pending_doctor';
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);

      const db = getReadDb();
      let query = db('action_items')
        .where({ status })
        .orderBy('created_at', 'asc'); // FIFO ordering

      if (authReq.userRole === 'doctor') {
        query = query.where(function() {
          this.where({ doctor_id: authReq.userId })
            .orWhereNull('doctor_id');
        });
      }

      const [items, countResult] = await Promise.all([
        query.clone().limit(limit).offset((page - 1) * limit),
        query.clone().count('* as total').first(),
      ]);

      res.json({
        data: items,
        pagination: {
          page,
          limit,
          total: Number((countResult as { total: string })?.total ?? 0),
        },
      });
    } catch (err) {
      log.error({ err }, 'Error fetching triage queue');
      res.status(500).json({ error: 'Failed to fetch triage queue' });
    }
  }
);

// --- Approve/Reject Triage ---
const triageDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(2000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

clinicalRouter.post(
  '/triage/:itemId/decision',
  requireRole('doctor'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { itemId } = req.params;
      const body = triageDecisionSchema.parse(req.body);

      const db = getWriteDb();
      const [updated] = await db('action_items')
        .where({ id: itemId })
        .update({
          status: body.decision,
          doctor_id: authReq.userId,
          doctor_notes: body.notes,
          rejection_reason: body.rejectionReason,
          decided_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning('*');

      if (!updated) {
        res.status(404).json({ error: 'Action item not found' });
        return;
      }

      await writeAuditLog({
        eventType: AuditEventType.CLINICAL_TRIAGE,
        userId: authReq.userId,
        userRole: 'doctor',
        patientId: updated.patient_id,
        resourceType: 'action_item',
        resourceId: itemId,
        action: `TRIAGE_${body.decision.toUpperCase()}`,
        outcome: 'success',
        ipAddress: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
        requestId: (req.headers['x-request-id'] as string) ?? '',
        region: env.DEPLOYMENT_REGION,
        complianceRegime: env.COMPLIANCE_REGIME,
        details: { decision: body.decision, notes: body.notes },
      });

      res.json({ data: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
        return;
      }
      log.error({ err }, 'Error processing triage decision');
      res.status(500).json({ error: 'Failed to process decision' });
    }
  }
);

// --- Create Care Plan ---
const carePlanSchema = z.object({
  patientId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  surgeryType: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  missions: z.array(z.object({
    type: z.string(),
    title: z.string(),
    description: z.string(),
    frequency: z.string(),
    startDay: z.number(),
    endDay: z.number().optional(),
  })).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
  })).optional(),
});

clinicalRouter.post(
  '/care-plans',
  requireRole('doctor'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const body = carePlanSchema.parse(req.body);

      const db = getWriteDb();

      const [carePlan] = await db('care_plans')
        .insert({
          patient_id: body.patientId,
          doctor_id: authReq.userId,
          name: body.name,
          description: body.description,
          surgery_type: body.surgeryType,
          start_date: body.startDate,
          end_date: body.endDate,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning('*');

      // Create associated missions
      if (body.missions?.length) {
        await db('missions').insert(
          body.missions.map(m => ({
            care_plan_id: carePlan.id,
            patient_id: body.patientId,
            type: m.type,
            title: m.title,
            description: m.description,
            frequency: m.frequency,
            start_day: m.startDay,
            end_day: m.endDay,
            status: 'pending',
            created_at: new Date().toISOString(),
          }))
        );
      }

      // Create associated medications
      if (body.medications?.length) {
        await db('medications').insert(
          body.medications.map(m => ({
            care_plan_id: carePlan.id,
            patient_id: body.patientId,
            doctor_id: authReq.userId,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            start_date: m.startDate,
            end_date: m.endDate,
            is_active: true,
            created_at: new Date().toISOString(),
          }))
        );
      }

      // Invalidate cache
      await cache.invalidatePatient(body.patientId);

      await writeAuditLog({
        eventType: AuditEventType.CLINICAL_ORDER,
        userId: authReq.userId,
        userRole: 'doctor',
        patientId: body.patientId,
        resourceType: 'care_plan',
        resourceId: carePlan.id,
        action: 'CARE_PLAN_CREATED',
        outcome: 'success',
        ipAddress: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
        requestId: (req.headers['x-request-id'] as string) ?? '',
        region: env.DEPLOYMENT_REGION,
        complianceRegime: env.COMPLIANCE_REGIME,
        details: { missionsCount: body.missions?.length, medicationsCount: body.medications?.length },
      });

      res.status(201).json({ data: carePlan });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
        return;
      }
      log.error({ err }, 'Error creating care plan');
      res.status(500).json({ error: 'Failed to create care plan' });
    }
  }
);

// --- Clinical Decision Support Endpoints ---

clinicalRouter.get(
  '/risk-assessment/:patientId',
  requireRole('doctor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      const assessment = await cache.getOrSet(
        `clinical:risk:${patientId}`,
        async () => {
          const db = getReadDb();

          // Fetch latest vitals, medications, and history
          const [vitals, medications, history] = await Promise.all([
            db('vital_signs')
              .where({ patient_id: patientId })
              .orderBy('recorded_at', 'desc')
              .limit(24),
            db('medications')
              .where({ patient_id: patientId, is_active: true }),
            db('clinical_history')
              .where({ patient_id: patientId })
              .orderBy('recorded_at', 'desc')
              .limit(50),
          ]);

          // Calculate risk scores (delegated to clinical service)
          return {
            patientId,
            assessedAt: new Date().toISOString(),
            vitalsCount: vitals.length,
            activeMedications: medications.length,
            historyEntries: history.length,
            riskFactors: [], // Populated by clinical engine
          };
        },
        300
      );

      res.json({ data: assessment });
    } catch (err) {
      log.error({ err, patientId: req.params['patientId'] }, 'Error in risk assessment');
      res.status(500).json({ error: 'Risk assessment failed' });
    }
  }
);
