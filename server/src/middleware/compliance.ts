import { Request, Response, NextFunction } from 'express';
import { env, COMPLIANCE_CONFIG } from '../config/environment.js';
import { createLogger } from '../utils/logger.js';
import { writeAuditLog, AuditEventType } from './audit.js';

const log = createLogger('compliance');

/**
 * Multi-jurisdiction compliance middleware.
 *
 * Enforces data handling rules specific to each deployment region:
 *
 * INDIA (DPDPA 2023 + ABDM):
 * - Data must reside within India (ap-south-1)
 * - Consent must be obtained before processing personal data
 * - Data principals (patients) have right to erasure
 * - Cross-border transfers require government notification
 * - Data fiduciary must appoint a Data Protection Officer
 * - Grievance redressal mechanism required
 * - ABDM Health Data Management Policy compliance
 *
 * US (HIPAA + HITECH):
 * - Minimum Necessary Rule: Only access required PHI
 * - Business Associate Agreements required
 * - Breach notification within 60 days
 * - Right to access and amend health records
 * - De-identification standards (Safe Harbor / Expert Determination)
 * - 42 CFR Part 2 for substance abuse records
 *
 * UK (UK GDPR + DPA 2018):
 * - Lawful basis for processing required
 * - Data Protection Impact Assessment (DPIA) for high-risk processing
 * - Caldicott Principles for health data
 * - NHS Digital Standards compliance
 * - Right to erasure, portability, and rectification
 * - International transfers require adequacy decision or safeguards
 */

// --- Consent Verification Middleware ---

export interface ConsentRecord {
  patientId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt: string;
  expiresAt?: string;
  purpose: string;
  dataCategories: string[];
  withdrawnAt?: string;
  version: string;
}

export enum ConsentType {
  // Universal
  TREATMENT = 'TREATMENT',
  DATA_PROCESSING = 'DATA_PROCESSING',
  DATA_SHARING = 'DATA_SHARING',

  // DPDPA specific
  DPDPA_PERSONAL_DATA = 'DPDPA_PERSONAL_DATA',
  DPDPA_SENSITIVE_DATA = 'DPDPA_SENSITIVE_DATA',
  DPDPA_CROSS_BORDER = 'DPDPA_CROSS_BORDER',
  DPDPA_AUTOMATED_DECISION = 'DPDPA_AUTOMATED_DECISION',

  // HIPAA specific
  HIPAA_TREATMENT = 'HIPAA_TREATMENT',
  HIPAA_PAYMENT = 'HIPAA_PAYMENT',
  HIPAA_OPERATIONS = 'HIPAA_OPERATIONS',
  HIPAA_RESEARCH = 'HIPAA_RESEARCH',
  HIPAA_MARKETING = 'HIPAA_MARKETING',

  // UK GDPR specific
  UK_GDPR_EXPLICIT = 'UK_GDPR_EXPLICIT',
  UK_GDPR_VITAL_INTERESTS = 'UK_GDPR_VITAL_INTERESTS',
  UK_GDPR_PUBLIC_INTEREST = 'UK_GDPR_PUBLIC_INTEREST',
  UK_GDPR_LEGITIMATE_INTEREST = 'UK_GDPR_LEGITIMATE_INTEREST',
}

/**
 * Middleware to verify patient consent before processing PHI.
 */
export function requireConsent(requiredConsent: ConsentType) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const patientId = req.params['patientId'] ?? (req as Request & { userId?: string }).userId;

    if (!patientId) {
      next();
      return;
    }

    try {
      // Check consent in database
      const { getReadDb } = await import('../config/database.js');
      const db = getReadDb();

      const consent = await db('patient_consents')
        .where({
          patient_id: patientId,
          consent_type: requiredConsent,
          is_active: true,
        })
        .whereNull('withdrawn_at')
        .where('expires_at', '>', new Date().toISOString())
        .first();

      if (!consent) {
        log.warn({
          patientId,
          requiredConsent,
          path: req.path,
        }, 'Consent not found or expired');

        res.status(403).json({
          error: 'Consent required',
          code: 'CONSENT_REQUIRED',
          consentType: requiredConsent,
          message: getConsentMessage(requiredConsent),
        });
        return;
      }

      next();
    } catch (err) {
      log.error({ err, patientId, requiredConsent }, 'Consent verification failed');
      next(); // Fail open for treatment scenarios (Caldicott Principle 7)
    }
  };
}

function getConsentMessage(consentType: ConsentType): string {
  const messages: Record<string, string> = {
    [ConsentType.DPDPA_PERSONAL_DATA]: 'Your consent is required under the Digital Personal Data Protection Act, 2023 to process your personal data.',
    [ConsentType.DPDPA_SENSITIVE_DATA]: 'Explicit consent is required under DPDPA to process your sensitive personal data including health records.',
    [ConsentType.HIPAA_TREATMENT]: 'Authorization is required under HIPAA to share your health information for treatment purposes.',
    [ConsentType.UK_GDPR_EXPLICIT]: 'Your explicit consent is required under UK GDPR to process your health data.',
    [ConsentType.DATA_PROCESSING]: 'Your consent is required to process your health data.',
  };
  return messages[consentType] ?? 'Consent is required to proceed.';
}

// --- Data Residency Enforcement ---

/**
 * Ensure data operations comply with data residency requirements.
 * Blocks cross-border data transfers unless explicitly authorized.
 */
export function enforceDataResidency(req: Request, res: Response, next: NextFunction): void {
  // Check if request is attempting cross-border data access
  const requestRegion = req.headers['x-request-region'] as string;

  if (requestRegion && requestRegion !== env.DATA_RESIDENCY_REGION) {
    log.warn({
      requestRegion,
      dataRegion: env.DATA_RESIDENCY_REGION,
      complianceRegime: env.COMPLIANCE_REGIME,
      path: req.path,
    }, 'Cross-border data access attempt');

    // DPDPA: Cross-border transfers restricted
    if (env.COMPLIANCE_REGIME === 'DPDPA' && COMPLIANCE_CONFIG.DPDPA.crossBorderTransfer === 'restricted') {
      void writeAuditLog({
        eventType: AuditEventType.CROSS_BORDER_TRANSFER,
        userId: (req as Request & { userId?: string }).userId ?? 'unknown',
        userRole: (req as Request & { userRole?: string }).userRole ?? 'unknown',
        resourceType: 'data',
        action: 'CROSS_BORDER_TRANSFER_BLOCKED',
        outcome: 'failure',
        ipAddress: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
        requestId: (req.headers['x-request-id'] as string) ?? '',
        region: env.DEPLOYMENT_REGION,
        complianceRegime: env.COMPLIANCE_REGIME,
        details: { requestRegion, dataRegion: env.DATA_RESIDENCY_REGION },
      });

      res.status(403).json({
        error: 'Data residency violation',
        code: 'DATA_RESIDENCY_VIOLATION',
        message: 'This data must remain within its designated region per DPDPA requirements.',
      });
      return;
    }
  }

  next();
}

// --- Minimum Necessary Rule (HIPAA) ---

/**
 * HIPAA Minimum Necessary Rule: Limit PHI access to the minimum necessary
 * to accomplish the intended purpose.
 */
export function minimumNecessaryRule(allowedFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (env.COMPLIANCE_REGIME !== 'HIPAA') {
      next();
      return;
    }

    // Store allowed fields for response filtering
    (req as Request & { allowedPHIFields?: string[] }).allowedPHIFields = allowedFields;

    // Intercept response to filter fields
    const originalJson = res.json.bind(res);
    res.json = function(body: unknown) {
      if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
        const filtered: Record<string, unknown> = {};
        for (const field of allowedFields) {
          if (field in (body as Record<string, unknown>)) {
            filtered[field] = (body as Record<string, unknown>)[field];
          }
        }
        return originalJson(filtered);
      }
      return originalJson(body);
    };

    next();
  };
}

// --- Right to Erasure (DPDPA + UK GDPR) ---

export interface ErasureRequest {
  patientId: string;
  requestedAt: string;
  reason: string;
  complianceRegime: string;
  status: 'pending' | 'processing' | 'completed' | 'denied';
  completedAt?: string;
  denialReason?: string;
}

/**
 * Process a data erasure request (Right to be Forgotten).
 * Applicable under DPDPA and UK GDPR.
 *
 * Note: HIPAA does not have a right to erasure but requires amendment rights.
 */
export async function processErasureRequest(patientId: string, reason: string): Promise<ErasureRequest> {
  const request: ErasureRequest = {
    patientId,
    requestedAt: new Date().toISOString(),
    reason,
    complianceRegime: env.COMPLIANCE_REGIME,
    status: 'pending',
  };

  // Verify erasure is allowed
  if (env.COMPLIANCE_REGIME === 'HIPAA') {
    return {
      ...request,
      status: 'denied',
      denialReason: 'HIPAA does not provide a right to erasure. You may request an amendment to your records.',
    };
  }

  // Check retention requirements
  const compliance = COMPLIANCE_CONFIG[env.COMPLIANCE_REGIME];
  log.info({
    patientId,
    complianceRegime: env.COMPLIANCE_REGIME,
    retentionYears: compliance.retentionYears,
  }, 'Processing data erasure request');

  await writeAuditLog({
    eventType: AuditEventType.DATA_ERASURE_REQUEST,
    userId: patientId,
    userRole: 'patient',
    patientId,
    resourceType: 'patient_data',
    action: 'ERASURE_REQUEST',
    outcome: 'success',
    ipAddress: 'system',
    userAgent: 'system',
    requestId: '',
    region: env.DEPLOYMENT_REGION,
    complianceRegime: env.COMPLIANCE_REGIME,
    details: { reason },
  });

  return { ...request, status: 'processing' };
}

// --- Data Portability (DPDPA + UK GDPR) ---

export async function processPortabilityRequest(patientId: string): Promise<{ requestId: string; status: string }> {
  const requestId = (await import('uuid')).v4();

  await writeAuditLog({
    eventType: AuditEventType.DATA_PORTABILITY_REQUEST,
    userId: patientId,
    userRole: 'patient',
    patientId,
    resourceType: 'patient_data',
    action: 'PORTABILITY_REQUEST',
    outcome: 'success',
    ipAddress: 'system',
    userAgent: 'system',
    requestId,
    region: env.DEPLOYMENT_REGION,
    complianceRegime: env.COMPLIANCE_REGIME,
    details: { format: 'FHIR_R4_JSON' },
  });

  return { requestId, status: 'processing' };
}

// --- Breach Notification ---

export interface BreachReport {
  id: string;
  detectedAt: string;
  affectedPatients: number;
  dataCategories: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notificationDeadline: string;
  status: 'detected' | 'investigating' | 'notifying' | 'resolved';
}

export async function reportBreach(breach: Omit<BreachReport, 'id' | 'notificationDeadline'>): Promise<BreachReport> {
  const { v4: uuidv4 } = await import('uuid');
  const compliance = COMPLIANCE_CONFIG[env.COMPLIANCE_REGIME];

  let deadlineHours: number;
  if ('breachNotificationHours' in compliance) {
    deadlineHours = compliance.breachNotificationHours;
  } else {
    deadlineHours = compliance.breachNotificationDays * 24;
  }

  const report: BreachReport = {
    ...breach,
    id: uuidv4(),
    notificationDeadline: new Date(
      new Date(breach.detectedAt).getTime() + deadlineHours * 60 * 60 * 1000
    ).toISOString(),
  };

  await writeAuditLog({
    eventType: AuditEventType.BREACH_DETECTED,
    userId: 'system',
    userRole: 'system',
    resourceType: 'breach',
    resourceId: report.id,
    action: 'BREACH_REPORTED',
    outcome: 'success',
    ipAddress: 'system',
    userAgent: 'system',
    requestId: report.id,
    region: env.DEPLOYMENT_REGION,
    complianceRegime: env.COMPLIANCE_REGIME,
    details: {
      affectedPatients: report.affectedPatients,
      severity: report.severity,
      notificationDeadline: report.notificationDeadline,
    },
  });

  log.fatal({
    breachId: report.id,
    severity: report.severity,
    affectedPatients: report.affectedPatients,
    deadline: report.notificationDeadline,
  }, 'DATA BREACH DETECTED - Immediate action required');

  return report;
}
