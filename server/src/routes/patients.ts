import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, requireDataAccess, AuthenticatedRequest } from '../middleware/authentication.js';
import { patientDataRateLimitMiddleware } from '../middleware/security.js';
import { getReadDb, getWriteDb } from '../config/database.js';
import { cache } from '../config/redis.js';
import { decryptPHI } from '../utils/encryption.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('patients');

export const patientRouter = Router();

// All patient routes require authentication
patientRouter.use(authenticateToken);
patientRouter.use(patientDataRateLimitMiddleware);

// --- Get Patient Profile ---
patientRouter.get(
  '/:patientId',
  requireDataAccess('patientId'),
  async (req: Request, res: Response) => {
    try {
      const patientId = req.params['patientId'] as string;

      // Try cache first
      const cached = await cache.getOrSet(
        `patient:${patientId}:profile`,
        async () => {
          const db = getReadDb();
          const patient = await db('patients')
            .select(
              'id', 'user_id', 'name', 'date_of_birth', 'gender',
              'blood_group', 'emergency_contact', 'primary_doctor_id',
              'region', 'created_at', 'updated_at'
            )
            .where({ id: patientId, is_active: true })
            .first();

          if (!patient) return null;
          return decryptPHI(patient);
        },
        300 // 5 min cache
      );

      if (!cached) {
        res.status(404).json({ error: 'Patient not found' });
        return;
      }

      res.json({ data: cached });
    } catch (err) {
      log.error({ err, patientId: req.params['patientId'] }, 'Error fetching patient');
      res.status(500).json({ error: 'Failed to fetch patient data' });
    }
  }
);

// --- List Patients (Doctor/Admin only) ---
patientRouter.get(
  '/',
  requireRole('doctor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);
      const offset = (page - 1) * limit;
      const search = req.query['search'] as string;

      const db = getReadDb();
      let query = db('patients')
        .select('id', 'name', 'date_of_birth', 'gender', 'primary_doctor_id', 'region', 'created_at')
        .where({ is_active: true });

      // For doctors, only show their patients
      const authReq = req as AuthenticatedRequest;
      if (authReq.userRole === 'doctor') {
        query = query.where({ primary_doctor_id: authReq.userId });
      }

      if (search) {
        query = query.where(function() {
          this.whereILike('name', `%${search}%`)
            .orWhereILike('id', `%${search}%`);
        });
      }

      const [patients, countResult] = await Promise.all([
        query.clone().orderBy('created_at', 'desc').limit(limit).offset(offset),
        query.clone().count('* as total').first(),
      ]);

      const total = (countResult as { total: string })?.total ?? 0;

      res.json({
        data: patients.map(p => decryptPHI(p)),
        pagination: {
          page,
          limit,
          total: Number(total),
          totalPages: Math.ceil(Number(total) / limit),
        },
      });
    } catch (err) {
      log.error({ err }, 'Error listing patients');
      res.status(500).json({ error: 'Failed to list patients' });
    }
  }
);

// --- Get Patient Vitals ---
patientRouter.get(
  '/:patientId/vitals',
  requireDataAccess('patientId'),
  async (req: Request, res: Response) => {
    try {
      const patientId = req.params['patientId'] as string;
      const days = parseInt(req.query['days'] as string) || 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const vitals = await cache.getOrSet(
        `patient:${patientId}:vitals:${days}d`,
        async () => {
          const db = getReadDb();
          return db('vital_signs')
            .where({ patient_id: patientId })
            .where('recorded_at', '>=', since)
            .orderBy('recorded_at', 'desc')
            .limit(1000);
        },
        60 // 1 min cache for vitals
      );

      res.json({ data: vitals });
    } catch (err) {
      log.error({ err, patientId: req.params['patientId'] }, 'Error fetching vitals');
      res.status(500).json({ error: 'Failed to fetch vitals' });
    }
  }
);

// --- Record Vitals ---
const vitalSchema = z.object({
  heartRate: z.number().min(20).max(300).optional(),
  bloodPressureSystolic: z.number().min(40).max(300).optional(),
  bloodPressureDiastolic: z.number().min(20).max(200).optional(),
  temperature: z.number().min(30).max(45).optional(),
  respiratoryRate: z.number().min(4).max(60).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  bloodGlucose: z.number().min(20).max(600).optional(),
  painLevel: z.number().min(0).max(10).optional(),
  weight: z.number().min(0.5).max(500).optional(),
});

patientRouter.post(
  '/:patientId/vitals',
  requireDataAccess('patientId'),
  async (req: Request, res: Response) => {
    try {
      const patientId = req.params['patientId'] as string;
      const body = vitalSchema.parse(req.body);

      const db = getWriteDb();
      const [vital] = await db('vital_signs')
        .insert({
          patient_id: patientId,
          heart_rate: body.heartRate,
          blood_pressure_systolic: body.bloodPressureSystolic,
          blood_pressure_diastolic: body.bloodPressureDiastolic,
          temperature: body.temperature,
          respiratory_rate: body.respiratoryRate,
          oxygen_saturation: body.oxygenSaturation,
          blood_glucose: body.bloodGlucose,
          pain_level: body.painLevel,
          weight: body.weight,
          recorded_at: new Date().toISOString(),
          recorded_by: (req as AuthenticatedRequest).userId,
        })
        .returning('*');

      // Invalidate cache
      await cache.invalidatePatient(patientId);

      res.status(201).json({ data: vital });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: err.errors });
        return;
      }
      log.error({ err, patientId: req.params['patientId'] }, 'Error recording vitals');
      res.status(500).json({ error: 'Failed to record vitals' });
    }
  }
);

// --- Get Patient Missions ---
patientRouter.get(
  '/:patientId/missions',
  requireDataAccess('patientId'),
  async (req: Request, res: Response) => {
    try {
      const patientId = req.params['patientId'] as string;
      const status = req.query['status'] as string;

      const db = getReadDb();
      let query = db('missions')
        .where({ patient_id: patientId })
        .orderBy('due_date', 'asc');

      if (status) {
        query = query.where({ status });
      }

      const missions = await query;

      res.json({ data: missions });
    } catch (err) {
      log.error({ err, patientId: req.params['patientId'] }, 'Error fetching missions');
      res.status(500).json({ error: 'Failed to fetch missions' });
    }
  }
);

// --- Get Patient Care Plans ---
patientRouter.get(
  '/:patientId/care-plans',
  requireDataAccess('patientId'),
  async (req: Request, res: Response) => {
    try {
      const patientId = req.params['patientId'] as string;

      const carePlans = await cache.getOrSet(
        `patient:${patientId}:care-plans`,
        async () => {
          const db = getReadDb();
          return db('care_plans')
            .where({ patient_id: patientId, status: 'active' })
            .orderBy('updated_at', 'desc');
        },
        120 // 2 min cache
      );

      res.json({ data: carePlans });
    } catch (err) {
      log.error({ err, patientId: req.params['patientId'] }, 'Error fetching care plans');
      res.status(500).json({ error: 'Failed to fetch care plans' });
    }
  }
);

// --- Get Patient Medications ---
patientRouter.get(
  '/:patientId/medications',
  requireDataAccess('patientId'),
  async (req: Request, res: Response) => {
    try {
      const patientId = req.params['patientId'] as string;

      const medications = await getReadDb()('medications')
        .where({ patient_id: patientId, is_active: true })
        .orderBy('created_at', 'desc');

      res.json({ data: medications });
    } catch (err) {
      log.error({ err, patientId: req.params['patientId'] }, 'Error fetching medications');
      res.status(500).json({ error: 'Failed to fetch medications' });
    }
  }
);

// --- Get Patient Audit Trail (for patient data access requests) ---
patientRouter.get(
  '/:patientId/access-log',
  requireDataAccess('patientId'),
  async (req: Request, res: Response) => {
    try {
      const patientId = req.params['patientId'] as string;
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 100);

      const db = getReadDb();
      const logs = await db('audit_logs')
        .where({ patient_id: patientId })
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      res.json({
        data: logs.map(l => ({
          timestamp: l.timestamp,
          action: l.action,
          accessedBy: l.user_role,
          outcome: l.outcome,
        })),
      });
    } catch (err) {
      log.error({ err, patientId: req.params['patientId'] }, 'Error fetching access log');
      res.status(500).json({ error: 'Failed to fetch access log' });
    }
  }
);
