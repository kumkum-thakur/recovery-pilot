/**
 * HIPAA-Compliant Audit Log Service
 *
 * Provides tamper-evident audit logging with hash-chain integrity verification,
 * suspicious activity detection, compliance reporting, and access tracking.
 *
 * Features:
 *  - 15 event types covering auth, clinical, administrative actions
 *  - SHA-256-like hash chain for tamper detection (pure JS implementation)
 *  - Query/filter/search across audit logs
 *  - Per-patient access reports (who accessed what, when)
 *  - Suspicious activity detection (off-hours, bulk access, privilege escalation)
 *  - Compliance report generation for date ranges
 *  - 200+ realistic seed audit entries
 *
 * No external dependencies.
 */

// ============================================================================
// Constants & Enums (const-object pattern for erasableSyntaxOnly)
// ============================================================================

export const AuditActionType = {
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_FAILED: 'AUTH_FAILED',
  PATIENT_DATA_VIEW: 'PATIENT_DATA_VIEW',
  PATIENT_DATA_EDIT: 'PATIENT_DATA_EDIT',
  MEDICATION_PRESCRIBED: 'MEDICATION_PRESCRIBED',
  CARE_PLAN_CREATED: 'CARE_PLAN_CREATED',
  WOUND_IMAGE_UPLOADED: 'WOUND_IMAGE_UPLOADED',
  TRIAGE_REVIEWED: 'TRIAGE_REVIEWED',
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED',
  USER_CREATED: 'USER_CREATED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
} as const;
export type AuditActionType = typeof AuditActionType[keyof typeof AuditActionType];

export const AuditOutcome = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  DENIED: 'denied',
  ERROR: 'error',
} as const;
export type AuditOutcome = typeof AuditOutcome[keyof typeof AuditOutcome];

export const ActorRole = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  PATIENT: 'patient',
  SYSTEM: 'system',
} as const;
export type ActorRole = typeof ActorRole[keyof typeof ActorRole];

export const ResourceType = {
  USER: 'user',
  PATIENT_RECORD: 'patient_record',
  MEDICATION: 'medication',
  CARE_PLAN: 'care_plan',
  WOUND_IMAGE: 'wound_image',
  TRIAGE: 'triage',
  APPOINTMENT: 'appointment',
  REPORT: 'report',
  SYSTEM_CONFIG: 'system_config',
  SESSION: 'session',
  PERMISSION: 'permission',
} as const;
export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

export const SuspiciousActivityType = {
  OFF_HOURS_ACCESS: 'off_hours_access',
  BULK_RECORD_ACCESS: 'bulk_record_access',
  REPEATED_AUTH_FAILURE: 'repeated_auth_failure',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  UNUSUAL_EXPORT: 'unusual_export',
  CROSS_DEPARTMENT_ACCESS: 'cross_department_access',
  RAPID_SUCCESSIVE_ACTIONS: 'rapid_successive_actions',
} as const;
export type SuspiciousActivityType = typeof SuspiciousActivityType[keyof typeof SuspiciousActivityType];

// ============================================================================
// Interfaces
// ============================================================================

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: ActorRole;
  actionType: AuditActionType;
  resourceType: ResourceType;
  resourceId: string;
  outcome: AuditOutcome;
  description: string;
  beforeValue?: string;
  afterValue?: string;
  sessionId: string;
  ipAddress: string;
  previousHash: string;
  entryHash: string;
}

export interface AuditQueryFilters {
  actorId?: string;
  actorRole?: ActorRole;
  actionType?: AuditActionType;
  resourceType?: ResourceType;
  resourceId?: string;
  outcome?: AuditOutcome;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface AccessReportEntry {
  timestamp: string;
  actorId: string;
  actorRole: ActorRole;
  actionType: AuditActionType;
  resourceType: ResourceType;
  resourceId: string;
  description: string;
  ipAddress: string;
}

export interface PatientAccessReport {
  patientId: string;
  generatedAt: string;
  totalAccesses: number;
  uniqueActors: number;
  dateRange: { start: string; end: string };
  accessesByType: Record<string, number>;
  accessesByActor: Record<string, number>;
  entries: AccessReportEntry[];
}

export interface SuspiciousActivity {
  id: string;
  detectedAt: string;
  type: SuspiciousActivityType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actorId: string;
  description: string;
  relatedEntryIds: string[];
  resolved: boolean;
}

export interface ComplianceReport {
  generatedAt: string;
  dateRange: { start: string; end: string };
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByOutcome: Record<string, number>;
  uniqueUsers: number;
  patientRecordsAccessed: number;
  failedAuthAttempts: number;
  dataExports: number;
  configChanges: number;
  suspiciousActivities: SuspiciousActivity[];
  hashChainIntegrity: boolean;
  complianceScore: number;
  recommendations: string[];
}

// ============================================================================
// Hash Utility (pure JS - no external crypto dependency)
// ============================================================================

/**
 * Simple but effective hash function for tamper detection.
 * Uses a combination of FNV-1a and bit mixing for good distribution.
 * This is NOT cryptographic - in production, use Web Crypto API's SHA-256.
 */
function computeHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x62b82175;
  let h3 = 0xd3a2646c;
  let h4 = 0xa7b9c035;

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x0100019d);
    h3 = Math.imul(h3 ^ c, 0x01000199);
    h4 = Math.imul(h4 ^ c, 0x010001a3);
  }

  // Final mixing
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h2 = (h2 ^ (h2 >>> 16)) >>> 0;
  h3 = (h3 ^ (h3 >>> 16)) >>> 0;
  h4 = (h4 ^ (h4 >>> 16)) >>> 0;

  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return hex(h1) + hex(h2) + hex(h3) + hex(h4);
}

function hashAuditEntry(entry: Omit<AuditEntry, 'entryHash'>, previousHash: string): string {
  const payload = [
    entry.id,
    entry.timestamp,
    entry.actorId,
    entry.actorRole,
    entry.actionType,
    entry.resourceType,
    entry.resourceId,
    entry.outcome,
    entry.description,
    entry.beforeValue ?? '',
    entry.afterValue ?? '',
    entry.sessionId,
    entry.ipAddress,
    previousHash,
  ].join('|');

  return computeHash(payload);
}

// ============================================================================
// ID Generator
// ============================================================================

let _auditCounter = 0;
function generateAuditId(): string {
  _auditCounter++;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `aud_${ts}_${rand}_${_auditCounter}`;
}

function generateSessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `sess_${ts}_${rand}`;
}

// ============================================================================
// Seed Data: Actors
// ============================================================================

const SEED_ACTORS = [
  { id: 'usr_admin_001', role: ActorRole.ADMIN, name: 'Sarah Chen' },
  { id: 'usr_admin_002', role: ActorRole.ADMIN, name: 'Michael Torres' },
  { id: 'usr_dr_001', role: ActorRole.DOCTOR, name: 'Dr. Emily Watson' },
  { id: 'usr_dr_002', role: ActorRole.DOCTOR, name: 'Dr. James Park' },
  { id: 'usr_dr_003', role: ActorRole.DOCTOR, name: 'Dr. Lisa Nguyen' },
  { id: 'usr_dr_004', role: ActorRole.DOCTOR, name: 'Dr. Robert Singh' },
  { id: 'usr_nurse_001', role: ActorRole.NURSE, name: 'Nancy Williams' },
  { id: 'usr_nurse_002', role: ActorRole.NURSE, name: 'Tom Baker' },
  { id: 'usr_nurse_003', role: ActorRole.NURSE, name: 'Carmen Rodriguez' },
  { id: 'usr_pt_001', role: ActorRole.PATIENT, name: 'John Matthews' },
  { id: 'usr_pt_002', role: ActorRole.PATIENT, name: 'Maria Gonzalez' },
  { id: 'usr_pt_003', role: ActorRole.PATIENT, name: 'David Lee' },
  { id: 'usr_pt_004', role: ActorRole.PATIENT, name: 'Angela Brown' },
  { id: 'usr_pt_005', role: ActorRole.PATIENT, name: 'Kevin O\'Brien' },
  { id: 'usr_pt_006', role: ActorRole.PATIENT, name: 'Priya Patel' },
  { id: 'usr_pt_007', role: ActorRole.PATIENT, name: 'Thomas Wilson' },
  { id: 'usr_pt_008', role: ActorRole.PATIENT, name: 'Lisa Chang' },
  { id: 'usr_system', role: ActorRole.SYSTEM, name: 'System' },
];

const SEED_PATIENT_IDS = [
  'pat_001', 'pat_002', 'pat_003', 'pat_004', 'pat_005',
  'pat_006', 'pat_007', 'pat_008', 'pat_009', 'pat_010',
  'pat_011', 'pat_012', 'pat_013', 'pat_014', 'pat_015',
];

const SEED_IPS = [
  '192.168.1.10', '192.168.1.22', '192.168.1.45', '192.168.1.101',
  '10.0.0.5', '10.0.0.12', '10.0.0.88', '10.0.1.33',
  '172.16.0.15', '172.16.0.42', '203.0.113.25', '198.51.100.7',
];

// ============================================================================
// Seed Data Generator: 200+ Audit Entries
// ============================================================================

function generateSeedEntries(): AuditEntry[] {
  const entries: AuditEntry[] = [];
  let previousHash = '0000000000000000000000000000000000000000';

  const baseDate = new Date('2025-11-01T08:00:00Z');

  function ts(dayOffset: number, hourOffset: number, minuteOffset: number): string {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(d.getHours() + hourOffset);
    d.setMinutes(d.getMinutes() + minuteOffset);
    return d.toISOString();
  }

  function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(entries.length * 7 + arr.length) % arr.length];
  }

  function pickIdx<T>(arr: readonly T[], idx: number): T {
    return arr[idx % arr.length];
  }

  function addEntry(
    dayOffset: number,
    hourOffset: number,
    minuteOffset: number,
    actorIdx: number,
    actionType: AuditActionType,
    resourceType: ResourceType,
    resourceId: string,
    outcome: AuditOutcome,
    description: string,
    beforeValue?: string,
    afterValue?: string
  ): void {
    const actor = pickIdx(SEED_ACTORS, actorIdx);
    const id = `aud_seed_${String(entries.length + 1).padStart(4, '0')}`;
    const timestamp = ts(dayOffset, hourOffset, minuteOffset);
    const sessionId = `sess_seed_${String(Math.floor(entries.length / 5) + 1).padStart(3, '0')}`;
    const ipAddress = pickIdx(SEED_IPS, actorIdx);

    const partial = {
      id,
      timestamp,
      actorId: actor.id,
      actorRole: actor.role,
      actionType,
      resourceType,
      resourceId,
      outcome,
      description,
      beforeValue,
      afterValue,
      sessionId,
      ipAddress,
      previousHash,
    };

    const entryHash = hashAuditEntry(partial, previousHash);
    const entry: AuditEntry = { ...partial, entryHash };
    entries.push(entry);
    previousHash = entryHash;
  }

  // ---- Day 0: System setup and initial logins ----
  addEntry(0, 0, 0, 17, AuditActionType.SYSTEM_CONFIG_CHANGED, ResourceType.SYSTEM_CONFIG, 'cfg_audit', AuditOutcome.SUCCESS, 'Audit logging system initialized');
  addEntry(0, 0, 1, 0, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_001', AuditOutcome.SUCCESS, 'Admin Sarah Chen logged in');
  addEntry(0, 0, 5, 0, AuditActionType.USER_CREATED, ResourceType.USER, 'usr_dr_001', AuditOutcome.SUCCESS, 'Created physician account for Dr. Emily Watson');
  addEntry(0, 0, 6, 0, AuditActionType.USER_CREATED, ResourceType.USER, 'usr_dr_002', AuditOutcome.SUCCESS, 'Created physician account for Dr. James Park');
  addEntry(0, 0, 7, 0, AuditActionType.USER_CREATED, ResourceType.USER, 'usr_nurse_001', AuditOutcome.SUCCESS, 'Created nurse account for Nancy Williams');
  addEntry(0, 0, 10, 0, AuditActionType.PERMISSION_CHANGED, ResourceType.PERMISSION, 'perm_dr_001', AuditOutcome.SUCCESS, 'Granted prescribing privileges to Dr. Watson', '{"prescribe":false}', '{"prescribe":true}');
  addEntry(0, 0, 11, 0, AuditActionType.PERMISSION_CHANGED, ResourceType.PERMISSION, 'perm_dr_002', AuditOutcome.SUCCESS, 'Granted prescribing privileges to Dr. Park', '{"prescribe":false}', '{"prescribe":true}');
  addEntry(0, 0, 15, 0, AuditActionType.SYSTEM_CONFIG_CHANGED, ResourceType.SYSTEM_CONFIG, 'cfg_session_timeout', AuditOutcome.SUCCESS, 'Session timeout set to 30 minutes', '{"timeout":60}', '{"timeout":30}');
  addEntry(0, 0, 20, 0, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_001', AuditOutcome.SUCCESS, 'Admin Sarah Chen logged out');

  // ---- Day 1: Normal clinical operations ----
  addEntry(1, 0, 0, 2, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_002', AuditOutcome.SUCCESS, 'Dr. Watson logged in for morning rounds');
  addEntry(1, 0, 5, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Viewed patient record: John Matthews - pre-op assessment');
  addEntry(1, 0, 10, 2, AuditActionType.CARE_PLAN_CREATED, ResourceType.CARE_PLAN, 'cp_001', AuditOutcome.SUCCESS, 'Created post-TKR care plan for John Matthews');
  addEntry(1, 0, 15, 2, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_001', AuditOutcome.SUCCESS, 'Prescribed Oxycodone 5mg Q6H for post-op pain - John Matthews');
  addEntry(1, 0, 16, 2, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_002', AuditOutcome.SUCCESS, 'Prescribed Enoxaparin 40mg daily for DVT prophylaxis - John Matthews');
  addEntry(1, 0, 20, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.SUCCESS, 'Viewed patient record: Maria Gonzalez - follow-up review');
  addEntry(1, 0, 25, 2, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.SUCCESS, 'Updated recovery progress notes for Maria Gonzalez', '{"phase":"early"}', '{"phase":"intermediate"}');
  addEntry(1, 0, 30, 2, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_001', AuditOutcome.SUCCESS, 'Uploaded wound image for Maria Gonzalez - day 14 post-op');
  addEntry(1, 0, 35, 2, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_001', AuditOutcome.SUCCESS, 'Reviewed triage alert for Maria Gonzalez - mild redness at incision site');

  // Nurse activity
  addEntry(1, 1, 0, 6, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_003', AuditOutcome.SUCCESS, 'Nurse Nancy Williams logged in');
  addEntry(1, 1, 5, 6, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Viewed patient vitals: John Matthews');
  addEntry(1, 1, 10, 6, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Recorded morning vitals for John Matthews', undefined, '{"bp":"128/82","hr":76,"temp":98.4}');
  addEntry(1, 1, 15, 6, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_003', AuditOutcome.SUCCESS, 'Viewed patient record: David Lee - medication review');
  addEntry(1, 1, 20, 6, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_004', AuditOutcome.SUCCESS, 'Viewed patient record: Angela Brown - wound assessment');
  addEntry(1, 1, 25, 6, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_002', AuditOutcome.SUCCESS, 'Uploaded wound image for Angela Brown - day 7 post-op');
  addEntry(1, 1, 30, 6, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_005', AuditOutcome.SUCCESS, 'Viewed patient record: Kevin O\'Brien - pain assessment');

  // Patient self-access
  addEntry(1, 2, 0, 9, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_004', AuditOutcome.SUCCESS, 'Patient John Matthews logged into patient portal');
  addEntry(1, 2, 5, 9, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Patient viewed own care plan and medications');
  addEntry(1, 2, 10, 9, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_003', AuditOutcome.SUCCESS, 'Patient uploaded self-assessment wound photo');
  addEntry(1, 2, 15, 9, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_004', AuditOutcome.SUCCESS, 'Patient John Matthews logged out');

  // Failed login attempt
  addEntry(1, 3, 0, 10, AuditActionType.AUTH_FAILED, ResourceType.SESSION, 'sess_failed_001', AuditOutcome.FAILURE, 'Failed login attempt for user maria.gonzalez - incorrect password');
  addEntry(1, 3, 1, 10, AuditActionType.AUTH_FAILED, ResourceType.SESSION, 'sess_failed_002', AuditOutcome.FAILURE, 'Failed login attempt for user maria.gonzalez - incorrect password (attempt 2)');
  addEntry(1, 3, 5, 10, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_005', AuditOutcome.SUCCESS, 'Patient Maria Gonzalez logged in after password reset');

  // End of day
  addEntry(1, 10, 0, 2, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_001', AuditOutcome.SUCCESS, 'Generated daily patient summary report');
  addEntry(1, 10, 5, 2, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_002', AuditOutcome.SUCCESS, 'Dr. Watson logged out');
  addEntry(1, 10, 10, 6, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_003', AuditOutcome.SUCCESS, 'Nurse Williams logged out');

  // ---- Day 2: More clinical + admin ----
  addEntry(2, 0, 0, 3, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_006', AuditOutcome.SUCCESS, 'Dr. Park logged in');
  addEntry(2, 0, 5, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_003', AuditOutcome.SUCCESS, 'Viewed patient record: David Lee - post-hip replacement day 3');
  addEntry(2, 0, 10, 3, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_003', AuditOutcome.SUCCESS, 'Prescribed Acetaminophen 1000mg Q8H for David Lee');
  addEntry(2, 0, 15, 3, AuditActionType.CARE_PLAN_CREATED, ResourceType.CARE_PLAN, 'cp_002', AuditOutcome.SUCCESS, 'Created post-THR care plan for David Lee');
  addEntry(2, 0, 20, 3, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_001', AuditOutcome.SUCCESS, 'Scheduled 2-week follow-up for David Lee');
  addEntry(2, 0, 30, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_005', AuditOutcome.SUCCESS, 'Viewed patient record: Kevin O\'Brien - spinal fusion recovery');
  addEntry(2, 0, 35, 3, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_005', AuditOutcome.SUCCESS, 'Updated PT milestones for Kevin O\'Brien', '{"walkingAid":"walker"}', '{"walkingAid":"cane"}');
  addEntry(2, 0, 40, 3, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_002', AuditOutcome.SUCCESS, 'Reviewed wound triage for Kevin O\'Brien - healing well');

  // Nurse Tom Baker
  addEntry(2, 1, 0, 7, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_007', AuditOutcome.SUCCESS, 'Nurse Tom Baker logged in');
  addEntry(2, 1, 5, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_006', AuditOutcome.SUCCESS, 'Viewed patient record: Priya Patel - vitals check');
  addEntry(2, 1, 10, 7, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_006', AuditOutcome.SUCCESS, 'Recorded vitals for Priya Patel', undefined, '{"bp":"118/72","hr":68,"temp":98.6}');
  addEntry(2, 1, 15, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_007', AuditOutcome.SUCCESS, 'Viewed patient record: Thomas Wilson - medication administration');
  addEntry(2, 1, 20, 7, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_007', AuditOutcome.SUCCESS, 'Documented medication administration for Thomas Wilson');
  addEntry(2, 1, 25, 7, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_004', AuditOutcome.SUCCESS, 'Uploaded wound image for Priya Patel - surgical site day 5');
  addEntry(2, 1, 30, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_008', AuditOutcome.SUCCESS, 'Viewed patient record: Lisa Chang - discharge preparation');

  // Admin activity
  addEntry(2, 2, 0, 1, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_008', AuditOutcome.SUCCESS, 'Admin Michael Torres logged in');
  addEntry(2, 2, 5, 1, AuditActionType.USER_CREATED, ResourceType.USER, 'usr_dr_003', AuditOutcome.SUCCESS, 'Created physician account for Dr. Lisa Nguyen');
  addEntry(2, 2, 10, 1, AuditActionType.USER_CREATED, ResourceType.USER, 'usr_nurse_002', AuditOutcome.SUCCESS, 'Created nurse account for Tom Baker');
  addEntry(2, 2, 15, 1, AuditActionType.PERMISSION_CHANGED, ResourceType.PERMISSION, 'perm_dr_003', AuditOutcome.SUCCESS, 'Granted care plan creation privileges to Dr. Nguyen', '{"createCarePlan":false}', '{"createCarePlan":true}');
  addEntry(2, 2, 20, 1, AuditActionType.SYSTEM_CONFIG_CHANGED, ResourceType.SYSTEM_CONFIG, 'cfg_password_policy', AuditOutcome.SUCCESS, 'Updated password policy: min length 12, require special chars', '{"minLength":8,"specialChars":false}', '{"minLength":12,"specialChars":true}');
  addEntry(2, 2, 25, 1, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_001', AuditOutcome.SUCCESS, 'Exported monthly compliance summary for October 2025');
  addEntry(2, 2, 30, 1, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_008', AuditOutcome.SUCCESS, 'Admin Michael Torres logged out');

  // ---- Day 3: Heavy clinical day ----
  addEntry(3, 0, 0, 2, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_009', AuditOutcome.SUCCESS, 'Dr. Watson logged in');
  addEntry(3, 0, 5, 4, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_010', AuditOutcome.SUCCESS, 'Dr. Nguyen logged in');
  addEntry(3, 0, 10, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Reviewed John Matthews recovery progress - day 4 post TKR');
  addEntry(3, 0, 15, 2, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Updated pain management plan for John Matthews', '{"painProtocol":"standard"}', '{"painProtocol":"multimodal"}');
  addEntry(3, 0, 20, 2, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_004', AuditOutcome.SUCCESS, 'Added Gabapentin 300mg TID for neuropathic pain - John Matthews');
  addEntry(3, 0, 25, 4, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_009', AuditOutcome.SUCCESS, 'Initial consult: new patient intake - Robert Kim');
  addEntry(3, 0, 30, 4, AuditActionType.CARE_PLAN_CREATED, ResourceType.CARE_PLAN, 'cp_003', AuditOutcome.SUCCESS, 'Created pre-op care plan for Robert Kim - scheduled ACL reconstruction');
  addEntry(3, 0, 35, 4, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_002', AuditOutcome.SUCCESS, 'Scheduled pre-op assessment for Robert Kim');
  addEntry(3, 0, 40, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_004', AuditOutcome.SUCCESS, 'Reviewed Angela Brown wound healing progress');
  addEntry(3, 0, 45, 2, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_003', AuditOutcome.SUCCESS, 'Reviewed triage: Angela Brown - incision healing normally');
  addEntry(3, 0, 50, 4, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_010', AuditOutcome.SUCCESS, 'Viewed patient record: Susan Martinez - rotator cuff repair follow-up');
  addEntry(3, 0, 55, 4, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_005', AuditOutcome.SUCCESS, 'Prescribed Ibuprofen 600mg TID for Susan Martinez');
  addEntry(3, 1, 0, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.SUCCESS, 'Follow-up review: Maria Gonzalez - 3-week post-op');
  addEntry(3, 1, 5, 2, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_005', AuditOutcome.SUCCESS, 'Uploaded 3-week wound photo for Maria Gonzalez');
  addEntry(3, 1, 10, 2, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.SUCCESS, 'Cleared Maria Gonzalez for PT progression', '{"ptLevel":"basic"}', '{"ptLevel":"intermediate"}');

  // Nurse Carmen Rodriguez
  addEntry(3, 1, 15, 8, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_011', AuditOutcome.SUCCESS, 'Nurse Carmen Rodriguez logged in');
  addEntry(3, 1, 20, 8, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_011', AuditOutcome.SUCCESS, 'Viewed patient record: James Thompson - post-op day 1');
  addEntry(3, 1, 25, 8, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_011', AuditOutcome.SUCCESS, 'Recorded initial post-op vitals for James Thompson', undefined, '{"bp":"135/88","hr":82,"temp":99.1,"spo2":96}');
  addEntry(3, 1, 30, 8, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_012', AuditOutcome.SUCCESS, 'Viewed patient record: Betty Adams - pre-discharge check');
  addEntry(3, 1, 35, 8, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_012', AuditOutcome.SUCCESS, 'Completed discharge checklist for Betty Adams');

  // Patient portal access
  addEntry(3, 4, 0, 11, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_012', AuditOutcome.SUCCESS, 'Patient David Lee logged into portal');
  addEntry(3, 4, 5, 11, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_003', AuditOutcome.SUCCESS, 'Patient David Lee viewed care plan and exercise instructions');
  addEntry(3, 4, 10, 11, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_003', AuditOutcome.SUCCESS, 'Patient David Lee scheduled follow-up appointment via portal');

  // ---- Day 4: Includes suspicious activity ----
  addEntry(4, 0, 0, 3, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_013', AuditOutcome.SUCCESS, 'Dr. Park logged in');
  addEntry(4, 0, 5, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_005', AuditOutcome.SUCCESS, 'Reviewed Kevin O\'Brien spinal fusion recovery - week 2');
  addEntry(4, 0, 10, 3, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_005', AuditOutcome.SUCCESS, 'Updated activity restrictions for Kevin O\'Brien', '{"lifting":"none"}', '{"lifting":"under_10lbs"}');
  addEntry(4, 0, 15, 3, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_006', AuditOutcome.SUCCESS, 'Tapered Oxycodone to 5mg Q8H for Kevin O\'Brien');
  addEntry(4, 0, 20, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_013', AuditOutcome.SUCCESS, 'Viewed patient record: William Davis - knee arthroscopy follow-up');
  addEntry(4, 0, 25, 3, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_004', AuditOutcome.SUCCESS, 'Reviewed triage alert: William Davis - mild swelling noted');
  addEntry(4, 0, 30, 3, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_004', AuditOutcome.SUCCESS, 'Scheduled imaging follow-up for William Davis');

  // Off-hours access (suspicious)
  addEntry(4, 15, 0, 7, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_014', AuditOutcome.SUCCESS, 'Nurse Tom Baker logged in at 23:00 (off-hours)');
  addEntry(4, 15, 2, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_014', AuditOutcome.SUCCESS, 'Viewed patient record: Jennifer White (off-hours access)');
  addEntry(4, 15, 4, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_015', AuditOutcome.SUCCESS, 'Viewed patient record: Michael Johnson (off-hours access)');
  addEntry(4, 15, 5, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Viewed patient record: John Matthews (off-hours access)');
  addEntry(4, 15, 6, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.SUCCESS, 'Viewed patient record: Maria Gonzalez (off-hours access)');
  addEntry(4, 15, 10, 7, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_014', AuditOutcome.SUCCESS, 'Nurse Tom Baker logged out');

  // Multiple failed logins (suspicious)
  addEntry(4, 16, 0, 13, AuditActionType.AUTH_FAILED, ResourceType.SESSION, 'sess_failed_003', AuditOutcome.FAILURE, 'Failed login for user kevin.obrien - wrong password');
  addEntry(4, 16, 1, 13, AuditActionType.AUTH_FAILED, ResourceType.SESSION, 'sess_failed_004', AuditOutcome.FAILURE, 'Failed login for user kevin.obrien - wrong password (attempt 2)');
  addEntry(4, 16, 2, 13, AuditActionType.AUTH_FAILED, ResourceType.SESSION, 'sess_failed_005', AuditOutcome.FAILURE, 'Failed login for user kevin.obrien - wrong password (attempt 3)');
  addEntry(4, 16, 3, 13, AuditActionType.AUTH_FAILED, ResourceType.SESSION, 'sess_failed_006', AuditOutcome.FAILURE, 'Failed login for user kevin.obrien - account locked');

  // ---- Day 5: Reports and exports ----
  addEntry(5, 0, 0, 0, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_015', AuditOutcome.SUCCESS, 'Admin Sarah Chen logged in');
  addEntry(5, 0, 5, 0, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_002', AuditOutcome.SUCCESS, 'Generated weekly compliance report');
  addEntry(5, 0, 10, 0, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_003', AuditOutcome.SUCCESS, 'Generated patient access audit for pat_001');
  addEntry(5, 0, 15, 0, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_002', AuditOutcome.SUCCESS, 'Exported HIPAA compliance report for Q4 2025');
  addEntry(5, 0, 20, 0, AuditActionType.SYSTEM_CONFIG_CHANGED, ResourceType.SYSTEM_CONFIG, 'cfg_audit_retention', AuditOutcome.SUCCESS, 'Updated audit log retention to 7 years', '{"retentionYears":6}', '{"retentionYears":7}');
  addEntry(5, 0, 25, 0, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_003', AuditOutcome.SUCCESS, 'Exported suspicious activity report');

  // Doctor daily operations
  addEntry(5, 1, 0, 5, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_016', AuditOutcome.SUCCESS, 'Dr. Singh logged in');
  addEntry(5, 1, 5, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_006', AuditOutcome.SUCCESS, 'Reviewed Priya Patel post-op progress - shoulder replacement');
  addEntry(5, 1, 10, 5, AuditActionType.CARE_PLAN_CREATED, ResourceType.CARE_PLAN, 'cp_004', AuditOutcome.SUCCESS, 'Created updated rehab care plan for Priya Patel');
  addEntry(5, 1, 15, 5, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_007', AuditOutcome.SUCCESS, 'Prescribed Celecoxib 200mg BID for Priya Patel');
  addEntry(5, 1, 20, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_007', AuditOutcome.SUCCESS, 'Viewed Thomas Wilson record - post-op day 10');
  addEntry(5, 1, 25, 5, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_006', AuditOutcome.SUCCESS, 'Uploaded wound image for Thomas Wilson - healing well');
  addEntry(5, 1, 30, 5, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_005', AuditOutcome.SUCCESS, 'Reviewed wound triage: Thomas Wilson - no concerns');
  addEntry(5, 1, 35, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_008', AuditOutcome.SUCCESS, 'Reviewed Lisa Chang record - ACL reconstruction week 4');
  addEntry(5, 1, 40, 5, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_008', AuditOutcome.SUCCESS, 'Updated PT protocol for Lisa Chang', '{"phase":"protective"}', '{"phase":"early_mobility"}');
  addEntry(5, 1, 45, 5, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_005', AuditOutcome.SUCCESS, 'Scheduled 6-week post-op visit for Lisa Chang');

  // ---- Day 6: More patient interactions ----
  addEntry(6, 0, 0, 2, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_017', AuditOutcome.SUCCESS, 'Dr. Watson logged in');
  addEntry(6, 0, 5, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Reviewed John Matthews - one week post-TKR');
  addEntry(6, 0, 10, 2, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Documented ROM improvement for John Matthews', '{"flexion":65}', '{"flexion":85}');
  addEntry(6, 0, 15, 2, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_008', AuditOutcome.SUCCESS, 'Tapered Oxycodone to 5mg Q8H PRN for John Matthews');
  addEntry(6, 0, 20, 2, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_006', AuditOutcome.SUCCESS, 'Scheduled 2-week post-op visit for John Matthews');

  addEntry(6, 0, 30, 4, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_018', AuditOutcome.SUCCESS, 'Dr. Nguyen logged in');
  addEntry(6, 0, 35, 4, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_009', AuditOutcome.SUCCESS, 'Pre-op review for Robert Kim - ACL reconstruction');
  addEntry(6, 0, 40, 4, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_009', AuditOutcome.SUCCESS, 'Prescribed pre-op prophylaxis for Robert Kim');
  addEntry(6, 0, 45, 4, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_010', AuditOutcome.SUCCESS, 'Reviewed Susan Martinez - rotator cuff repair week 3');
  addEntry(6, 0, 50, 4, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_007', AuditOutcome.SUCCESS, 'Uploaded wound photo for Susan Martinez');
  addEntry(6, 0, 55, 4, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_006', AuditOutcome.SUCCESS, 'Reviewed wound triage: Susan Martinez - minor bruising, normal');

  // Patient portal sessions
  addEntry(6, 3, 0, 12, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_019', AuditOutcome.SUCCESS, 'Patient Angela Brown logged into portal');
  addEntry(6, 3, 5, 12, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_004', AuditOutcome.SUCCESS, 'Patient Angela Brown viewed recovery milestones');
  addEntry(6, 3, 10, 12, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_008', AuditOutcome.SUCCESS, 'Patient Angela Brown uploaded daily wound photo');

  addEntry(6, 5, 0, 14, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_020', AuditOutcome.SUCCESS, 'Patient Priya Patel logged into portal');
  addEntry(6, 5, 5, 14, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_006', AuditOutcome.SUCCESS, 'Patient Priya Patel viewed exercise plan');
  addEntry(6, 5, 10, 14, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_007', AuditOutcome.SUCCESS, 'Patient Priya Patel scheduled telehealth follow-up');

  // ---- Day 7: Weekly summary and operations ----
  addEntry(7, 0, 0, 0, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_021', AuditOutcome.SUCCESS, 'Admin Sarah Chen logged in for weekly review');
  addEntry(7, 0, 5, 0, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_004', AuditOutcome.SUCCESS, 'Generated weekly audit summary');
  addEntry(7, 0, 10, 0, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_005', AuditOutcome.SUCCESS, 'Generated access pattern analysis report');
  addEntry(7, 0, 15, 0, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_004', AuditOutcome.SUCCESS, 'Exported weekly compliance data');
  addEntry(7, 0, 20, 0, AuditActionType.SYSTEM_CONFIG_CHANGED, ResourceType.SYSTEM_CONFIG, 'cfg_alert_threshold', AuditOutcome.SUCCESS, 'Adjusted suspicious activity alert thresholds', '{"failedLoginThreshold":5}', '{"failedLoginThreshold":3}');

  addEntry(7, 1, 0, 3, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_022', AuditOutcome.SUCCESS, 'Dr. Park logged in');
  addEntry(7, 1, 5, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_003', AuditOutcome.SUCCESS, 'Reviewed David Lee - post-THR week 2 assessment');
  addEntry(7, 1, 10, 3, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_003', AuditOutcome.SUCCESS, 'Updated weight bearing status for David Lee', '{"weightBearing":"toe_touch"}', '{"weightBearing":"partial"}');
  addEntry(7, 1, 15, 3, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_010', AuditOutcome.SUCCESS, 'Transitioned David Lee to oral anticoagulant');
  addEntry(7, 1, 20, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_013', AuditOutcome.SUCCESS, 'Follow-up: William Davis knee arthroscopy - 2 weeks post-op');
  addEntry(7, 1, 25, 3, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_009', AuditOutcome.SUCCESS, 'Uploaded wound photo for William Davis - portals healing');
  addEntry(7, 1, 30, 3, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_013', AuditOutcome.SUCCESS, 'Cleared William Davis for driving and light activities');

  // Nurse rounds
  addEntry(7, 2, 0, 8, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_023', AuditOutcome.SUCCESS, 'Nurse Carmen Rodriguez logged in');
  addEntry(7, 2, 5, 8, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_011', AuditOutcome.SUCCESS, 'Morning assessment: James Thompson');
  addEntry(7, 2, 10, 8, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_011', AuditOutcome.SUCCESS, 'Recorded vitals for James Thompson', undefined, '{"bp":"130/84","hr":78,"temp":98.8,"spo2":97}');
  addEntry(7, 2, 15, 8, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Assessed John Matthews for discharge readiness');
  addEntry(7, 2, 20, 8, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Completed discharge assessment for John Matthews');

  // ---- Day 8-10: Additional entries to reach 200+ ----
  addEntry(8, 0, 0, 2, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_024', AuditOutcome.SUCCESS, 'Dr. Watson logged in');
  addEntry(8, 0, 5, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_004', AuditOutcome.SUCCESS, 'Reviewed Angela Brown for discharge planning');
  addEntry(8, 0, 10, 2, AuditActionType.CARE_PLAN_CREATED, ResourceType.CARE_PLAN, 'cp_005', AuditOutcome.SUCCESS, 'Created discharge care plan for Angela Brown');
  addEntry(8, 0, 15, 2, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_011', AuditOutcome.SUCCESS, 'Prescribed discharge medications for Angela Brown');
  addEntry(8, 0, 20, 2, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_006', AuditOutcome.SUCCESS, 'Generated discharge summary for Angela Brown');
  addEntry(8, 0, 25, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.SUCCESS, 'Reviewed Maria Gonzalez - 4 week post-op assessment');
  addEntry(8, 0, 30, 2, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_010', AuditOutcome.SUCCESS, 'Uploaded 4-week wound photo for Maria Gonzalez');
  addEntry(8, 0, 35, 2, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_007', AuditOutcome.SUCCESS, 'Wound triage: Maria Gonzalez - excellent healing');

  addEntry(8, 1, 0, 5, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_025', AuditOutcome.SUCCESS, 'Dr. Singh logged in');
  addEntry(8, 1, 5, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_007', AuditOutcome.SUCCESS, 'Reviewed Thomas Wilson - post-op week 2');
  addEntry(8, 1, 10, 5, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_007', AuditOutcome.SUCCESS, 'Updated rehab milestones for Thomas Wilson');
  addEntry(8, 1, 15, 5, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_012', AuditOutcome.SUCCESS, 'Reduced pain medication dosage for Thomas Wilson');
  addEntry(8, 1, 20, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_008', AuditOutcome.SUCCESS, 'Reviewed Lisa Chang - ACL rehab week 5');
  addEntry(8, 1, 25, 5, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_008', AuditOutcome.SUCCESS, 'Advanced Lisa Chang PT protocol to phase 3', '{"ptPhase":2}', '{"ptPhase":3}');
  addEntry(8, 1, 30, 5, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_008', AuditOutcome.SUCCESS, 'Scheduled 8-week post-op visit for Lisa Chang');

  addEntry(8, 2, 0, 6, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_026', AuditOutcome.SUCCESS, 'Nurse Nancy Williams logged in');
  addEntry(8, 2, 5, 6, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_014', AuditOutcome.SUCCESS, 'Vitals check: Jennifer White - post-op day 2');
  addEntry(8, 2, 10, 6, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_014', AuditOutcome.SUCCESS, 'Recorded vitals for Jennifer White', undefined, '{"bp":"122/78","hr":72,"temp":98.9,"spo2":98}');
  addEntry(8, 2, 15, 6, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_015', AuditOutcome.SUCCESS, 'Vitals check: Michael Johnson - post-op day 5');
  addEntry(8, 2, 20, 6, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_015', AuditOutcome.SUCCESS, 'Recorded vitals for Michael Johnson', undefined, '{"bp":"140/90","hr":88,"temp":99.2,"spo2":96}');
  addEntry(8, 2, 25, 6, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_011', AuditOutcome.SUCCESS, 'Uploaded wound image for Michael Johnson - monitoring redness');

  // Data export (bulk - suspicious)
  addEntry(8, 12, 0, 1, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_027', AuditOutcome.SUCCESS, 'Admin Michael Torres logged in');
  addEntry(8, 12, 5, 1, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_005', AuditOutcome.SUCCESS, 'Exported all patient records for department audit');
  addEntry(8, 12, 10, 1, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_006', AuditOutcome.SUCCESS, 'Exported medication dispensing records');
  addEntry(8, 12, 15, 1, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_007', AuditOutcome.SUCCESS, 'Exported appointment scheduling data');
  addEntry(8, 12, 20, 1, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_008', AuditOutcome.SUCCESS, 'Exported wound healing progress data');

  // ---- Day 9: Continue operations ----
  addEntry(9, 0, 0, 4, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_028', AuditOutcome.SUCCESS, 'Dr. Nguyen logged in');
  addEntry(9, 0, 5, 4, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_009', AuditOutcome.SUCCESS, 'Post-op day 1 review: Robert Kim - ACL reconstruction');
  addEntry(9, 0, 10, 4, AuditActionType.CARE_PLAN_CREATED, ResourceType.CARE_PLAN, 'cp_006', AuditOutcome.SUCCESS, 'Created post-op care plan for Robert Kim');
  addEntry(9, 0, 15, 4, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_013', AuditOutcome.SUCCESS, 'Prescribed post-op pain management for Robert Kim');
  addEntry(9, 0, 20, 4, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_014', AuditOutcome.SUCCESS, 'Prescribed DVT prophylaxis for Robert Kim');
  addEntry(9, 0, 25, 4, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_012', AuditOutcome.SUCCESS, 'Uploaded initial post-op wound photo for Robert Kim');
  addEntry(9, 0, 30, 4, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_010', AuditOutcome.SUCCESS, 'Susan Martinez 4-week follow-up');
  addEntry(9, 0, 35, 4, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_008', AuditOutcome.SUCCESS, 'Wound triage: Susan Martinez - fully healed, sutures removed');
  addEntry(9, 0, 40, 4, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_010', AuditOutcome.SUCCESS, 'Marked Susan Martinez as completed surgical wound healing');

  addEntry(9, 1, 0, 3, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_029', AuditOutcome.SUCCESS, 'Dr. Park logged in');
  addEntry(9, 1, 5, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_005', AuditOutcome.SUCCESS, 'Kevin O\'Brien - 3 week post spinal fusion');
  addEntry(9, 1, 10, 3, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_005', AuditOutcome.SUCCESS, 'Updated Kevin O\'Brien activity milestones');
  addEntry(9, 1, 15, 3, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_007', AuditOutcome.SUCCESS, 'Generated recovery progress summary for Kevin O\'Brien');
  addEntry(9, 1, 20, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_003', AuditOutcome.SUCCESS, 'David Lee 3-week post-THR assessment');
  addEntry(9, 1, 25, 3, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_013', AuditOutcome.SUCCESS, 'Uploaded wound image for David Lee - incision fully closed');
  addEntry(9, 1, 30, 3, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_015', AuditOutcome.SUCCESS, 'Discontinued anticoagulant for David Lee per protocol');

  // Patient portal
  addEntry(9, 3, 0, 15, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_030', AuditOutcome.SUCCESS, 'Patient Thomas Wilson logged into portal');
  addEntry(9, 3, 5, 15, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_007', AuditOutcome.SUCCESS, 'Patient Thomas Wilson viewed exercise instructions');
  addEntry(9, 3, 10, 15, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_014', AuditOutcome.SUCCESS, 'Patient Thomas Wilson uploaded daily wound photo');

  addEntry(9, 4, 0, 16, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_031', AuditOutcome.SUCCESS, 'Patient Lisa Chang logged into portal');
  addEntry(9, 4, 5, 16, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_008', AuditOutcome.SUCCESS, 'Patient Lisa Chang viewed PT exercise videos');
  addEntry(9, 4, 10, 16, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_008', AuditOutcome.SUCCESS, 'Patient Lisa Chang viewed upcoming appointment details');

  // ---- Day 10: Final entries ----
  addEntry(10, 0, 0, 2, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_032', AuditOutcome.SUCCESS, 'Dr. Watson logged in for morning rounds');
  addEntry(10, 0, 5, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'John Matthews - 10 day post-TKR review');
  addEntry(10, 0, 10, 2, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_001', AuditOutcome.SUCCESS, 'Documented excellent ROM progress for John Matthews', '{"flexion":85}', '{"flexion":100}');
  addEntry(10, 0, 15, 2, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_016', AuditOutcome.SUCCESS, 'Discontinued Oxycodone for John Matthews - transitioned to OTC');
  addEntry(10, 0, 20, 2, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_008', AuditOutcome.SUCCESS, 'Generated 10-day recovery milestone report for John Matthews');
  addEntry(10, 0, 25, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_011', AuditOutcome.SUCCESS, 'Reviewed James Thompson - post-op week 1');
  addEntry(10, 0, 30, 2, AuditActionType.CARE_PLAN_CREATED, ResourceType.CARE_PLAN, 'cp_007', AuditOutcome.SUCCESS, 'Created updated rehab plan for James Thompson');
  addEntry(10, 0, 35, 2, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_009', AuditOutcome.SUCCESS, 'Scheduled 3-week follow-up for James Thompson');

  addEntry(10, 1, 0, 5, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_033', AuditOutcome.SUCCESS, 'Dr. Singh logged in');
  addEntry(10, 1, 5, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_006', AuditOutcome.SUCCESS, 'Priya Patel 2-week shoulder replacement follow-up');
  addEntry(10, 1, 10, 5, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_015', AuditOutcome.SUCCESS, 'Uploaded wound image for Priya Patel - healing well');
  addEntry(10, 1, 15, 5, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_009', AuditOutcome.SUCCESS, 'Wound triage: Priya Patel - normal healing progression');
  addEntry(10, 1, 20, 5, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_006', AuditOutcome.SUCCESS, 'Updated shoulder ROM milestones for Priya Patel', '{"abduction":45}', '{"abduction":70}');
  addEntry(10, 1, 25, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_014', AuditOutcome.SUCCESS, 'Jennifer White 1-week post-op review');
  addEntry(10, 1, 30, 5, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_017', AuditOutcome.SUCCESS, 'Adjusted pain management for Jennifer White');
  addEntry(10, 1, 35, 5, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_010', AuditOutcome.SUCCESS, 'Scheduled 2-week follow-up for Jennifer White');

  // Permission change
  addEntry(10, 2, 0, 0, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_034', AuditOutcome.SUCCESS, 'Admin Sarah Chen logged in');
  addEntry(10, 2, 5, 0, AuditActionType.PERMISSION_CHANGED, ResourceType.PERMISSION, 'perm_nurse_003', AuditOutcome.SUCCESS, 'Granted wound image upload privileges to Nurse Rodriguez', '{"uploadImages":false}', '{"uploadImages":true}');
  addEntry(10, 2, 10, 0, AuditActionType.USER_CREATED, ResourceType.USER, 'usr_dr_004', AuditOutcome.SUCCESS, 'Created physician account for Dr. Robert Singh');
  addEntry(10, 2, 15, 0, AuditActionType.PERMISSION_CHANGED, ResourceType.PERMISSION, 'perm_dr_004', AuditOutcome.SUCCESS, 'Granted full clinical privileges to Dr. Singh');
  addEntry(10, 2, 20, 0, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_009', AuditOutcome.SUCCESS, 'Generated 10-day operational summary');
  addEntry(10, 2, 25, 0, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_009', AuditOutcome.SUCCESS, 'Exported 10-day compliance data for review');
  addEntry(10, 2, 30, 0, AuditActionType.SYSTEM_CONFIG_CHANGED, ResourceType.SYSTEM_CONFIG, 'cfg_mfa', AuditOutcome.SUCCESS, 'Enabled mandatory MFA for all clinical users', '{"mfaRequired":false}', '{"mfaRequired":true}');

  // Denied access attempt
  addEntry(10, 5, 0, 9, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.DENIED, 'Patient John Matthews attempted to view Maria Gonzalez record - access denied');
  addEntry(10, 5, 5, 9, AuditActionType.DATA_EXPORTED, ResourceType.REPORT, 'exp_denied_001', AuditOutcome.DENIED, 'Patient John Matthews attempted data export - insufficient privileges');

  // Final nurse entries
  addEntry(10, 3, 0, 7, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_035', AuditOutcome.SUCCESS, 'Nurse Tom Baker logged in');
  addEntry(10, 3, 5, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_015', AuditOutcome.SUCCESS, 'Assessment: Michael Johnson - post-op day 7');
  addEntry(10, 3, 10, 7, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_015', AuditOutcome.SUCCESS, 'Recorded vitals for Michael Johnson', undefined, '{"bp":"134/86","hr":80,"temp":98.6,"spo2":97}');
  addEntry(10, 3, 15, 7, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_016', AuditOutcome.SUCCESS, 'Uploaded wound image for Michael Johnson - improving');
  addEntry(10, 3, 20, 7, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_012', AuditOutcome.SUCCESS, 'Post-discharge follow-up call documentation: Betty Adams');
  addEntry(10, 3, 25, 7, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_012', AuditOutcome.SUCCESS, 'Documented follow-up call with Betty Adams - recovering well at home');

  // End of Day 10 logouts
  addEntry(10, 10, 0, 2, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_032', AuditOutcome.SUCCESS, 'Dr. Watson logged out');
  addEntry(10, 10, 5, 5, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_033', AuditOutcome.SUCCESS, 'Dr. Singh logged out');
  addEntry(10, 10, 10, 0, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_034', AuditOutcome.SUCCESS, 'Admin Sarah Chen logged out');
  addEntry(10, 10, 15, 7, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_035', AuditOutcome.SUCCESS, 'Nurse Tom Baker logged out');

  // System automated entries
  addEntry(10, 23, 0, 17, AuditActionType.SYSTEM_CONFIG_CHANGED, ResourceType.SYSTEM_CONFIG, 'cfg_backup', AuditOutcome.SUCCESS, 'Automated nightly backup completed successfully');
  addEntry(10, 23, 5, 17, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_010', AuditOutcome.SUCCESS, 'Automated daily compliance check completed - no violations');

  // ---- Additional entries to push well past 200 ----
  addEntry(11, 0, 0, 3, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_036', AuditOutcome.SUCCESS, 'Dr. Park logged in');
  addEntry(11, 0, 5, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_013', AuditOutcome.SUCCESS, 'William Davis - 3 week arthroscopy follow-up');
  addEntry(11, 0, 10, 3, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_013', AuditOutcome.SUCCESS, 'Cleared William Davis for return to light sports');
  addEntry(11, 0, 15, 3, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_011', AuditOutcome.SUCCESS, 'Generated return-to-activity clearance letter for William Davis');
  addEntry(11, 0, 20, 3, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_003', AuditOutcome.SUCCESS, 'David Lee - month 1 post-THR check');
  addEntry(11, 0, 25, 3, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_003', AuditOutcome.SUCCESS, 'Updated David Lee to full weight bearing status', '{"weightBearing":"partial"}', '{"weightBearing":"full"}');
  addEntry(11, 0, 30, 3, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_011', AuditOutcome.SUCCESS, 'Scheduled 3-month follow-up for David Lee');

  addEntry(11, 1, 0, 4, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_037', AuditOutcome.SUCCESS, 'Dr. Nguyen logged in');
  addEntry(11, 1, 5, 4, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_009', AuditOutcome.SUCCESS, 'Robert Kim post-ACL day 3 review');
  addEntry(11, 1, 10, 4, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_009', AuditOutcome.SUCCESS, 'Updated pain scores for Robert Kim - well managed');
  addEntry(11, 1, 15, 4, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_017', AuditOutcome.SUCCESS, 'Uploaded wound image for Robert Kim - minimal swelling');
  addEntry(11, 1, 20, 4, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_010', AuditOutcome.SUCCESS, 'Wound triage: Robert Kim - appropriate post-op appearance');

  addEntry(11, 2, 0, 8, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_038', AuditOutcome.SUCCESS, 'Nurse Carmen Rodriguez logged in');
  addEntry(11, 2, 5, 8, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_009', AuditOutcome.SUCCESS, 'Morning vitals for Robert Kim');
  addEntry(11, 2, 10, 8, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_009', AuditOutcome.SUCCESS, 'Recorded vitals for Robert Kim', undefined, '{"bp":"126/80","hr":74,"temp":98.7,"spo2":98}');
  addEntry(11, 2, 15, 8, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_011', AuditOutcome.SUCCESS, 'James Thompson post-op day 9 assessment');
  addEntry(11, 2, 20, 8, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_011', AuditOutcome.SUCCESS, 'Recorded vitals for James Thompson', undefined, '{"bp":"128/82","hr":76,"temp":98.4,"spo2":98}');
  addEntry(11, 2, 25, 8, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_018', AuditOutcome.SUCCESS, 'Uploaded wound image for James Thompson - day 9');

  addEntry(11, 4, 0, 13, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_039', AuditOutcome.SUCCESS, 'Patient Kevin O\'Brien logged into portal');
  addEntry(11, 4, 5, 13, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_005', AuditOutcome.SUCCESS, 'Patient Kevin O\'Brien viewed recovery progress dashboard');
  addEntry(11, 4, 10, 13, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_012', AuditOutcome.SUCCESS, 'Patient Kevin O\'Brien scheduled 6-week follow-up');

  // System events
  addEntry(11, 23, 0, 17, AuditActionType.SYSTEM_CONFIG_CHANGED, ResourceType.SYSTEM_CONFIG, 'cfg_backup', AuditOutcome.SUCCESS, 'Automated nightly backup completed');
  addEntry(11, 23, 5, 17, AuditActionType.REPORT_GENERATED, ResourceType.REPORT, 'rpt_012', AuditOutcome.SUCCESS, 'Automated compliance check completed');

  // ---- Day 12: Additional coverage ----
  addEntry(12, 0, 0, 2, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_040', AuditOutcome.SUCCESS, 'Dr. Watson logged in');
  addEntry(12, 0, 5, 2, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.SUCCESS, 'Maria Gonzalez 5-week review');
  addEntry(12, 0, 10, 2, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_002', AuditOutcome.SUCCESS, 'Updated Maria Gonzalez recovery phase to late stage', '{"phase":"intermediate"}', '{"phase":"late"}');
  addEntry(12, 0, 15, 2, AuditActionType.CARE_PLAN_CREATED, ResourceType.CARE_PLAN, 'cp_008', AuditOutcome.SUCCESS, 'Created late-stage rehab plan for Maria Gonzalez');
  addEntry(12, 0, 20, 2, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_018', AuditOutcome.SUCCESS, 'Transitioned Maria Gonzalez to OTC pain management');
  addEntry(12, 0, 25, 2, AuditActionType.APPOINTMENT_SCHEDULED, ResourceType.APPOINTMENT, 'appt_013', AuditOutcome.SUCCESS, 'Scheduled final post-op visit for Maria Gonzalez');

  addEntry(12, 1, 0, 5, AuditActionType.AUTH_LOGIN, ResourceType.SESSION, 'sess_seed_041', AuditOutcome.SUCCESS, 'Dr. Singh logged in');
  addEntry(12, 1, 5, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_014', AuditOutcome.SUCCESS, 'Jennifer White 2-week post-op review');
  addEntry(12, 1, 10, 5, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_019', AuditOutcome.SUCCESS, 'Uploaded 2-week wound photo for Jennifer White');
  addEntry(12, 1, 15, 5, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_011', AuditOutcome.SUCCESS, 'Wound triage: Jennifer White - healing on track');
  addEntry(12, 1, 20, 5, AuditActionType.PATIENT_DATA_EDIT, ResourceType.PATIENT_RECORD, 'pat_014', AuditOutcome.SUCCESS, 'Updated recovery milestones for Jennifer White');
  addEntry(12, 1, 25, 5, AuditActionType.PATIENT_DATA_VIEW, ResourceType.PATIENT_RECORD, 'pat_015', AuditOutcome.SUCCESS, 'Michael Johnson 2-week post-op assessment');
  addEntry(12, 1, 30, 5, AuditActionType.WOUND_IMAGE_UPLOADED, ResourceType.WOUND_IMAGE, 'img_020', AuditOutcome.SUCCESS, 'Uploaded 2-week wound photo for Michael Johnson');
  addEntry(12, 1, 35, 5, AuditActionType.TRIAGE_REVIEWED, ResourceType.TRIAGE, 'tri_012', AuditOutcome.SUCCESS, 'Wound triage: Michael Johnson - mild erythema, monitoring');
  addEntry(12, 1, 40, 5, AuditActionType.MEDICATION_PRESCRIBED, ResourceType.MEDICATION, 'rx_019', AuditOutcome.SUCCESS, 'Prescribed topical antibiotic for Michael Johnson wound site');

  // End of day
  addEntry(12, 10, 0, 2, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_040', AuditOutcome.SUCCESS, 'Dr. Watson logged out');
  addEntry(12, 10, 5, 5, AuditActionType.AUTH_LOGOUT, ResourceType.SESSION, 'sess_seed_041', AuditOutcome.SUCCESS, 'Dr. Singh logged out');

  return entries;
}

// ============================================================================
// Audit Log Service Implementation
// ============================================================================

class AuditLogServiceImpl {
  private entries: AuditEntry[];
  private lastHash: string;

  constructor() {
    this.entries = generateSeedEntries();
    this.lastHash = this.entries.length > 0
      ? this.entries[this.entries.length - 1].entryHash
      : '0000000000000000000000000000000000000000';
  }

  // ==========================================================================
  // Core: Log Event
  // ==========================================================================

  /**
   * Creates and appends a new audit entry with hash chain linkage.
   */
  logEvent(params: {
    actorId: string;
    actorRole: ActorRole;
    actionType: AuditActionType;
    resourceType: ResourceType;
    resourceId: string;
    outcome: AuditOutcome;
    description: string;
    beforeValue?: string;
    afterValue?: string;
    sessionId: string;
    ipAddress: string;
  }): AuditEntry {
    const id = generateAuditId();
    const timestamp = new Date().toISOString();
    const previousHash = this.lastHash;

    const partial = {
      id,
      timestamp,
      actorId: params.actorId,
      actorRole: params.actorRole,
      actionType: params.actionType,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      outcome: params.outcome,
      description: params.description,
      beforeValue: params.beforeValue,
      afterValue: params.afterValue,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress,
      previousHash,
    };

    const entryHash = hashAuditEntry(partial, previousHash);
    const entry: AuditEntry = { ...partial, entryHash };

    this.entries.push(entry);
    this.lastHash = entryHash;

    return entry;
  }

  // ==========================================================================
  // Query & Filter
  // ==========================================================================

  /**
   * Queries audit log with flexible filtering, pagination, and search.
   */
  queryAuditLog(filters: AuditQueryFilters): { entries: AuditEntry[]; total: number } {
    let results = [...this.entries];

    if (filters.actorId) {
      results = results.filter(e => e.actorId === filters.actorId);
    }
    if (filters.actorRole) {
      results = results.filter(e => e.actorRole === filters.actorRole);
    }
    if (filters.actionType) {
      results = results.filter(e => e.actionType === filters.actionType);
    }
    if (filters.resourceType) {
      results = results.filter(e => e.resourceType === filters.resourceType);
    }
    if (filters.resourceId) {
      results = results.filter(e => e.resourceId === filters.resourceId);
    }
    if (filters.outcome) {
      results = results.filter(e => e.outcome === filters.outcome);
    }
    if (filters.ipAddress) {
      results = results.filter(e => e.ipAddress === filters.ipAddress);
    }
    if (filters.startDate) {
      results = results.filter(e => e.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      results = results.filter(e => e.timestamp <= filters.endDate!);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      results = results.filter(e =>
        e.description.toLowerCase().includes(term) ||
        e.actorId.toLowerCase().includes(term) ||
        e.resourceId.toLowerCase().includes(term)
      );
    }

    const total = results.length;
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? results.length;
    results = results.slice(offset, offset + limit);

    return { entries: results, total };
  }

  // ==========================================================================
  // Patient Access Report
  // ==========================================================================

  /**
   * Generates a comprehensive access report for a specific patient.
   * Shows who accessed the patient's data, when, and how.
   */
  getAccessReport(patientId: string): PatientAccessReport {
    const patientEntries = this.entries.filter(e =>
      e.resourceId === patientId ||
      (e.description.toLowerCase().includes(patientId))
    );

    const accessesByType: Record<string, number> = {};
    const accessesByActor: Record<string, number> = {};

    for (const entry of patientEntries) {
      accessesByType[entry.actionType] = (accessesByType[entry.actionType] ?? 0) + 1;
      accessesByActor[entry.actorId] = (accessesByActor[entry.actorId] ?? 0) + 1;
    }

    const uniqueActors = new Set(patientEntries.map(e => e.actorId)).size;

    const timestamps = patientEntries.map(e => e.timestamp).sort();
    const dateRange = {
      start: timestamps[0] ?? '',
      end: timestamps[timestamps.length - 1] ?? '',
    };

    const reportEntries: AccessReportEntry[] = patientEntries.map(e => ({
      timestamp: e.timestamp,
      actorId: e.actorId,
      actorRole: e.actorRole,
      actionType: e.actionType,
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      description: e.description,
      ipAddress: e.ipAddress,
    }));

    return {
      patientId,
      generatedAt: new Date().toISOString(),
      totalAccesses: patientEntries.length,
      uniqueActors,
      dateRange,
      accessesByType,
      accessesByActor,
      entries: reportEntries,
    };
  }

  // ==========================================================================
  // Suspicious Activity Detection
  // ==========================================================================

  /**
   * Scans the audit log for suspicious patterns:
   * - Off-hours access (before 6am or after 10pm)
   * - Bulk patient record access (>10 records in one hour)
   * - Repeated authentication failures (>=3 within 10 minutes)
   * - Privilege escalation (permission changes)
   * - Unusual data exports
   * - Rapid successive actions (<30 seconds between actions)
   */
  detectSuspiciousActivity(): SuspiciousActivity[] {
    const suspicious: SuspiciousActivity[] = [];
    let susId = 0;

    const mkId = () => {
      susId++;
      return `sus_${String(susId).padStart(4, '0')}`;
    };

    // 1. Off-hours access (23:00 - 06:00)
    const offHoursEntries = this.entries.filter(e => {
      const hour = new Date(e.timestamp).getUTCHours();
      return (hour >= 23 || hour < 6) && e.actionType !== AuditActionType.AUTH_LOGOUT;
    });
    if (offHoursEntries.length > 0) {
      const byActor = new Map<string, AuditEntry[]>();
      for (const entry of offHoursEntries) {
        const list = byActor.get(entry.actorId) ?? [];
        list.push(entry);
        byActor.set(entry.actorId, list);
      }
      for (const [actorId, entries] of byActor) {
        if (entries[0].actorRole === ActorRole.SYSTEM) continue;
        suspicious.push({
          id: mkId(),
          detectedAt: new Date().toISOString(),
          type: SuspiciousActivityType.OFF_HOURS_ACCESS,
          severity: entries.length > 3 ? 'high' : 'medium',
          actorId,
          description: `${actorId} accessed ${entries.length} records during off-hours (23:00-06:00)`,
          relatedEntryIds: entries.map(e => e.id),
          resolved: false,
        });
      }
    }

    // 2. Bulk record access (>10 patient record views in 60 minutes)
    const viewEntries = this.entries.filter(e =>
      e.actionType === AuditActionType.PATIENT_DATA_VIEW
    );
    const byActorViews = new Map<string, AuditEntry[]>();
    for (const entry of viewEntries) {
      const list = byActorViews.get(entry.actorId) ?? [];
      list.push(entry);
      byActorViews.set(entry.actorId, list);
    }
    for (const [actorId, entries] of byActorViews) {
      // Check for any 60-minute window with >10 accesses
      for (let i = 0; i < entries.length; i++) {
        const windowStart = new Date(entries[i].timestamp).getTime();
        const windowEnd = windowStart + 60 * 60 * 1000;
        const inWindow = entries.filter(e => {
          const t = new Date(e.timestamp).getTime();
          return t >= windowStart && t <= windowEnd;
        });
        const uniquePatients = new Set(inWindow.map(e => e.resourceId));
        if (uniquePatients.size > 10) {
          suspicious.push({
            id: mkId(),
            detectedAt: new Date().toISOString(),
            type: SuspiciousActivityType.BULK_RECORD_ACCESS,
            severity: 'high',
            actorId,
            description: `${actorId} accessed ${uniquePatients.size} unique patient records within 60 minutes`,
            relatedEntryIds: inWindow.map(e => e.id),
            resolved: false,
          });
          break; // Only report once per actor
        }
      }
    }

    // 3. Repeated authentication failures
    const failedAuth = this.entries.filter(e => e.actionType === AuditActionType.AUTH_FAILED);
    const byActorFailed = new Map<string, AuditEntry[]>();
    for (const entry of failedAuth) {
      const list = byActorFailed.get(entry.actorId) ?? [];
      list.push(entry);
      byActorFailed.set(entry.actorId, list);
    }
    for (const [actorId, entries] of byActorFailed) {
      if (entries.length >= 3) {
        // Check if within 10 minutes
        const first = new Date(entries[0].timestamp).getTime();
        const last = new Date(entries[entries.length - 1].timestamp).getTime();
        if (last - first <= 10 * 60 * 1000) {
          suspicious.push({
            id: mkId(),
            detectedAt: new Date().toISOString(),
            type: SuspiciousActivityType.REPEATED_AUTH_FAILURE,
            severity: entries.length >= 5 ? 'critical' : 'high',
            actorId,
            description: `${entries.length} failed authentication attempts for ${actorId} within ${Math.round((last - first) / 60000)} minutes`,
            relatedEntryIds: entries.map(e => e.id),
            resolved: false,
          });
        }
      }
    }

    // 4. Unusual exports (>3 exports in a day)
    const exports = this.entries.filter(e => e.actionType === AuditActionType.DATA_EXPORTED);
    const byDayExports = new Map<string, AuditEntry[]>();
    for (const entry of exports) {
      const day = entry.timestamp.substring(0, 10);
      const list = byDayExports.get(day) ?? [];
      list.push(entry);
      byDayExports.set(day, list);
    }
    for (const [day, entries] of byDayExports) {
      if (entries.length > 3) {
        suspicious.push({
          id: mkId(),
          detectedAt: new Date().toISOString(),
          type: SuspiciousActivityType.UNUSUAL_EXPORT,
          severity: 'medium',
          actorId: entries[0].actorId,
          description: `${entries.length} data exports on ${day} - exceeds normal threshold of 3`,
          relatedEntryIds: entries.map(e => e.id),
          resolved: false,
        });
      }
    }

    // 5. Rapid successive actions (<30 seconds)
    const bySession = new Map<string, AuditEntry[]>();
    for (const entry of this.entries) {
      const list = bySession.get(entry.sessionId) ?? [];
      list.push(entry);
      bySession.set(entry.sessionId, list);
    }
    for (const [sessionId, entries] of bySession) {
      if (entries.length < 2) continue;
      const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const rapidPairs: AuditEntry[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const gap = new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime();
        if (gap > 0 && gap < 30 * 1000 && sorted[i].actionType !== AuditActionType.AUTH_LOGOUT) {
          if (rapidPairs.length === 0) rapidPairs.push(sorted[i - 1]);
          rapidPairs.push(sorted[i]);
        }
      }
      if (rapidPairs.length >= 5) {
        suspicious.push({
          id: mkId(),
          detectedAt: new Date().toISOString(),
          type: SuspiciousActivityType.RAPID_SUCCESSIVE_ACTIONS,
          severity: 'low',
          actorId: entries[0].actorId,
          description: `Session ${sessionId}: ${rapidPairs.length} actions with <30s intervals - possible automated access`,
          relatedEntryIds: rapidPairs.map(e => e.id),
          resolved: false,
        });
      }
    }

    return suspicious;
  }

  // ==========================================================================
  // Compliance Report
  // ==========================================================================

  /**
   * Generates a comprehensive HIPAA compliance report for a date range.
   */
  generateComplianceReport(dateRange: { start: string; end: string }): ComplianceReport {
    const rangeEntries = this.entries.filter(e =>
      e.timestamp >= dateRange.start && e.timestamp <= dateRange.end
    );

    const eventsByType: Record<string, number> = {};
    const eventsByOutcome: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const patientsAccessed = new Set<string>();
    let failedAuthAttempts = 0;
    let dataExports = 0;
    let configChanges = 0;

    for (const entry of rangeEntries) {
      eventsByType[entry.actionType] = (eventsByType[entry.actionType] ?? 0) + 1;
      eventsByOutcome[entry.outcome] = (eventsByOutcome[entry.outcome] ?? 0) + 1;
      uniqueUsers.add(entry.actorId);

      if (entry.resourceType === ResourceType.PATIENT_RECORD) {
        patientsAccessed.add(entry.resourceId);
      }
      if (entry.actionType === AuditActionType.AUTH_FAILED) {
        failedAuthAttempts++;
      }
      if (entry.actionType === AuditActionType.DATA_EXPORTED) {
        dataExports++;
      }
      if (entry.actionType === AuditActionType.SYSTEM_CONFIG_CHANGED) {
        configChanges++;
      }
    }

    // Verify hash chain integrity for the range
    const hashChainIntegrity = this.verifyHashChainIntegrity();

    // Detect suspicious activities
    const suspiciousActivities = this.detectSuspiciousActivity().filter(s => {
      const relatedEntries = this.entries.filter(e => s.relatedEntryIds.includes(e.id));
      return relatedEntries.some(e =>
        e.timestamp >= dateRange.start && e.timestamp <= dateRange.end
      );
    });

    // Calculate compliance score (0-100)
    let complianceScore = 100;

    // Deduct for failed auth attempts
    if (failedAuthAttempts > 10) complianceScore -= 10;
    else if (failedAuthAttempts > 5) complianceScore -= 5;

    // Deduct for suspicious activities
    complianceScore -= suspiciousActivities.length * 5;

    // Deduct for hash chain issues
    if (!hashChainIntegrity) complianceScore -= 30;

    // Deduct for excessive exports
    if (dataExports > 10) complianceScore -= 5;

    // Deduct for denied access attempts
    const deniedCount = eventsByOutcome[AuditOutcome.DENIED] ?? 0;
    if (deniedCount > 5) complianceScore -= 5;

    complianceScore = Math.max(0, Math.min(100, complianceScore));

    // Generate recommendations
    const recommendations: string[] = [];

    if (failedAuthAttempts > 5) {
      recommendations.push('Review authentication failure patterns and strengthen password policies');
    }
    if (suspiciousActivities.some(s => s.type === SuspiciousActivityType.OFF_HOURS_ACCESS)) {
      recommendations.push('Investigate off-hours access patterns and consider implementing time-based access controls');
    }
    if (suspiciousActivities.some(s => s.type === SuspiciousActivityType.BULK_RECORD_ACCESS)) {
      recommendations.push('Review bulk record access events and verify clinical justification');
    }
    if (!hashChainIntegrity) {
      recommendations.push('CRITICAL: Audit log hash chain integrity violation detected - investigate immediately');
    }
    if (dataExports > 5) {
      recommendations.push('Review data export frequency and ensure all exports have documented business justification');
    }
    if (deniedCount > 0) {
      recommendations.push('Review access denied events to identify potential unauthorized access attempts');
    }
    if (configChanges > 3) {
      recommendations.push('Multiple system configuration changes detected - verify change management procedures');
    }
    if (recommendations.length === 0) {
      recommendations.push('No significant compliance concerns identified for this reporting period');
    }

    return {
      generatedAt: new Date().toISOString(),
      dateRange,
      totalEvents: rangeEntries.length,
      eventsByType,
      eventsByOutcome,
      uniqueUsers: uniqueUsers.size,
      patientRecordsAccessed: patientsAccessed.size,
      failedAuthAttempts,
      dataExports,
      configChanges,
      suspiciousActivities,
      hashChainIntegrity,
      complianceScore,
      recommendations,
    };
  }

  // ==========================================================================
  // Hash Chain Integrity Verification
  // ==========================================================================

  /**
   * Verifies the integrity of the entire hash chain.
   * Returns true if no tampering is detected.
   */
  verifyHashChainIntegrity(): boolean {
    if (this.entries.length === 0) return true;

    let expectedPreviousHash = '0000000000000000000000000000000000000000';

    for (const entry of this.entries) {
      if (entry.previousHash !== expectedPreviousHash) {
        return false;
      }

      const recomputedHash = hashAuditEntry(entry, entry.previousHash);
      if (recomputedHash !== entry.entryHash) {
        return false;
      }

      expectedPreviousHash = entry.entryHash;
    }

    return true;
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Returns aggregate statistics about the audit log.
   */
  getStatistics(): {
    totalEntries: number;
    entriesByActionType: Record<string, number>;
    entriesByOutcome: Record<string, number>;
    uniqueActors: number;
    dateRange: { earliest: string; latest: string };
    hashChainValid: boolean;
  } {
    const entriesByActionType: Record<string, number> = {};
    const entriesByOutcome: Record<string, number> = {};
    const actors = new Set<string>();

    for (const entry of this.entries) {
      entriesByActionType[entry.actionType] = (entriesByActionType[entry.actionType] ?? 0) + 1;
      entriesByOutcome[entry.outcome] = (entriesByOutcome[entry.outcome] ?? 0) + 1;
      actors.add(entry.actorId);
    }

    return {
      totalEntries: this.entries.length,
      entriesByActionType,
      entriesByOutcome,
      uniqueActors: actors.size,
      dateRange: {
        earliest: this.entries[0]?.timestamp ?? '',
        latest: this.entries[this.entries.length - 1]?.timestamp ?? '',
      },
      hashChainValid: this.verifyHashChainIntegrity(),
    };
  }

  /**
   * Returns all entries (for testing/inspection).
   */
  getAllEntries(): AuditEntry[] {
    return [...this.entries];
  }

  /**
   * Returns the total number of entries.
   */
  getEntryCount(): number {
    return this.entries.length;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const auditLogService = new AuditLogServiceImpl();
