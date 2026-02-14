import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getWriteDb } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { env, COMPLIANCE_CONFIG } from '../config/environment.js';

const log = createLogger('audit');

/**
 * Immutable audit logging middleware for healthcare compliance.
 *
 * Requirements:
 * - HIPAA §164.312(b): Audit controls - record and examine activity
 * - HIPAA §164.530(j): Retain documentation for 6 years
 * - DPDPA: Maintain records of processing activities
 * - UK GDPR Art. 30: Records of processing activities
 * - Caldicott Principle 7: Duty to share is as important as duty to protect
 *
 * Features:
 * - Immutable append-only audit trail (no UPDATE/DELETE on audit tables)
 * - Tamper detection via hash chain (each entry hashes the previous)
 * - Minimum 7-year retention (HIPAA requirement)
 * - PHI access tracking (who accessed what, when, why)
 * - Emergency access ("break the glass") logging
 * - Cross-border data transfer logging
 */

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  userId: string;
  userRole: string;
  patientId?: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  outcome: 'success' | 'failure' | 'error';
  ipAddress: string;
  userAgent: string;
  requestId: string;
  region: string;
  complianceRegime: string;
  details: Record<string, unknown>;
  previousHash?: string;
  entryHash?: string;
}

export enum AuditEventType {
  // Authentication events
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_MFA_SETUP = 'AUTH_MFA_SETUP',
  AUTH_MFA_VERIFY = 'AUTH_MFA_VERIFY',
  AUTH_TOKEN_REFRESH = 'AUTH_TOKEN_REFRESH',
  AUTH_SESSION_REVOKED = 'AUTH_SESSION_REVOKED',
  AUTH_PASSWORD_CHANGE = 'AUTH_PASSWORD_CHANGE',

  // Data access events
  DATA_READ = 'DATA_READ',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',

  // PHI-specific events
  PHI_ACCESS = 'PHI_ACCESS',
  PHI_DISCLOSURE = 'PHI_DISCLOSURE',
  PHI_AMENDMENT = 'PHI_AMENDMENT',
  PHI_EMERGENCY_ACCESS = 'PHI_EMERGENCY_ACCESS',

  // Clinical events
  CLINICAL_DECISION = 'CLINICAL_DECISION',
  CLINICAL_TRIAGE = 'CLINICAL_TRIAGE',
  CLINICAL_PRESCRIPTION = 'CLINICAL_PRESCRIPTION',
  CLINICAL_ORDER = 'CLINICAL_ORDER',

  // Consent events
  CONSENT_GRANTED = 'CONSENT_GRANTED',
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  CONSENT_UPDATED = 'CONSENT_UPDATED',

  // System events
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_RESTORE = 'SYSTEM_RESTORE',

  // Compliance events
  BREACH_DETECTED = 'BREACH_DETECTED',
  CROSS_BORDER_TRANSFER = 'CROSS_BORDER_TRANSFER',
  DATA_ERASURE_REQUEST = 'DATA_ERASURE_REQUEST',
  DATA_PORTABILITY_REQUEST = 'DATA_PORTABILITY_REQUEST',
  DPIA_CONDUCTED = 'DPIA_CONDUCTED',
}

// In-memory buffer for batch inserts (performance optimization)
const auditBuffer: AuditEntry[] = [];
const FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
const MAX_BUFFER_SIZE = 100;

let lastHash = '';

/**
 * Write audit entry with hash chain for tamper detection.
 */
export async function writeAuditLog(entry: Omit<AuditEntry, 'id' | 'timestamp' | 'previousHash' | 'entryHash'>): Promise<void> {
  const crypto = await import('node:crypto');

  const fullEntry: AuditEntry = {
    ...entry,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    previousHash: lastHash,
  };

  // Create hash chain
  const hashContent = JSON.stringify({
    id: fullEntry.id,
    timestamp: fullEntry.timestamp,
    eventType: fullEntry.eventType,
    userId: fullEntry.userId,
    action: fullEntry.action,
    previousHash: fullEntry.previousHash,
  });
  fullEntry.entryHash = crypto.createHash('sha256').update(hashContent).digest('hex');
  lastHash = fullEntry.entryHash;

  // Add to buffer
  auditBuffer.push(fullEntry);

  // Flush if buffer is full
  if (auditBuffer.length >= MAX_BUFFER_SIZE) {
    await flushAuditBuffer();
  }

  // Also log to structured logger for real-time monitoring
  log.info({
    auditId: fullEntry.id,
    eventType: fullEntry.eventType,
    userId: fullEntry.userId,
    action: fullEntry.action,
    outcome: fullEntry.outcome,
    resourceType: fullEntry.resourceType,
    resourceId: fullEntry.resourceId,
  }, `Audit: ${fullEntry.eventType}`);
}

/**
 * Flush audit buffer to database.
 */
async function flushAuditBuffer(): Promise<void> {
  if (auditBuffer.length === 0) return;

  const entries = auditBuffer.splice(0, auditBuffer.length);

  try {
    const db = getWriteDb();
    await db('audit_logs').insert(
      entries.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        event_type: entry.eventType,
        user_id: entry.userId,
        user_role: entry.userRole,
        patient_id: entry.patientId,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        action: entry.action,
        outcome: entry.outcome,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        request_id: entry.requestId,
        region: entry.region,
        compliance_regime: entry.complianceRegime,
        details: JSON.stringify(entry.details),
        previous_hash: entry.previousHash,
        entry_hash: entry.entryHash,
      }))
    );
  } catch (err) {
    log.error({ err, count: entries.length }, 'Failed to flush audit buffer to database');
    // Re-add entries to buffer for retry
    auditBuffer.unshift(...entries);
  }
}

// Periodic flush
setInterval(() => {
  void flushAuditBuffer();
}, FLUSH_INTERVAL_MS);

/**
 * Express middleware that automatically logs API requests.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture response
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: Parameters<Response['end']>) {
    const duration = Date.now() - startTime;
    const authReq = req as Request & { userId?: string; userRole?: string; sessionId?: string };

    // Determine event type from method
    let eventType: AuditEventType;
    switch (req.method) {
      case 'GET': eventType = AuditEventType.DATA_READ; break;
      case 'POST': eventType = AuditEventType.DATA_CREATE; break;
      case 'PUT':
      case 'PATCH': eventType = AuditEventType.DATA_UPDATE; break;
      case 'DELETE': eventType = AuditEventType.DATA_DELETE; break;
      default: eventType = AuditEventType.DATA_READ;
    }

    // Check if this is a PHI access
    const phiPaths = ['/patients', '/care-plans', '/vitals', '/medications', '/missions'];
    const isPHIAccess = phiPaths.some(p => req.path.includes(p));
    if (isPHIAccess) {
      eventType = AuditEventType.PHI_ACCESS;
    }

    // Don't await - fire and forget for performance
    void writeAuditLog({
      eventType,
      userId: authReq.userId ?? 'anonymous',
      userRole: authReq.userRole ?? 'unknown',
      patientId: req.params['patientId'],
      resourceType: req.path.split('/')[2] ?? 'unknown',
      resourceId: req.params['id'],
      action: `${req.method} ${req.path}`,
      outcome: res.statusCode < 400 ? 'success' : (res.statusCode < 500 ? 'failure' : 'error'),
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      requestId: (req.headers['x-request-id'] as string) ?? '',
      region: env.DEPLOYMENT_REGION,
      complianceRegime: env.COMPLIANCE_REGIME,
      details: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
        contentLength: res.getHeader('content-length'),
      },
    });

    return originalEnd.apply(this, args);
  } as Response['end'];

  next();
}

/**
 * Log emergency access ("break the glass") - when a user accesses data
 * outside their normal authorization scope.
 */
export async function logEmergencyAccess(
  userId: string,
  patientId: string,
  reason: string,
  requestId: string
): Promise<void> {
  await writeAuditLog({
    eventType: AuditEventType.PHI_EMERGENCY_ACCESS,
    userId,
    userRole: 'doctor',
    patientId,
    resourceType: 'patient',
    resourceId: patientId,
    action: 'EMERGENCY_ACCESS',
    outcome: 'success',
    ipAddress: 'system',
    userAgent: 'system',
    requestId,
    region: env.DEPLOYMENT_REGION,
    complianceRegime: env.COMPLIANCE_REGIME,
    details: { reason, emergencyAccess: true },
  });

  log.warn({ userId, patientId, reason }, 'EMERGENCY ACCESS - Break the glass activated');
}

// Ensure buffer is flushed on shutdown
process.on('beforeExit', () => {
  void flushAuditBuffer();
});
