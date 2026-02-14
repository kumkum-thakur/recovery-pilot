import { Queue, Worker, Job } from 'bullmq';
import { queueRedis as _queueRedis } from '../config/redis.js';
import { createLogger } from '../utils/logger.js';
import { env } from '../config/environment.js';

const log = createLogger('job-queue');

/**
 * BullMQ job queue for async processing at scale.
 *
 * Jobs processed asynchronously:
 * - Medical image analysis (AI triage)
 * - FHIR resource export (data portability)
 * - Audit log archival to S3
 * - Breach notification dispatch
 * - Data erasure processing
 * - Scheduled mission reminders (SMS/email)
 * - Clinical risk score recalculation
 * - Backup verification
 *
 * At 2M patients/day, async processing prevents request blocking:
 * - Image analysis: ~500ms → offloaded to queue
 * - FHIR export: ~2-10s → queued job
 * - Notification dispatch: ~200ms → fire-and-forget
 *
 * Concurrency: 50 workers per pod × 5 pods = 250 parallel jobs
 */

const CONNECTION = {
  host: env.QUEUE_REDIS_HOST || env.REDIS_PRIMARY_HOST,
  port: env.QUEUE_REDIS_PORT || env.REDIS_PRIMARY_PORT,
  password: env.REDIS_PRIMARY_PASSWORD || undefined,
  tls: env.REDIS_PRIMARY_TLS ? { rejectUnauthorized: true } : undefined,
};

// --- Queue Definitions ---

export const imageAnalysisQueue = new Queue('image-analysis', {
  connection: CONNECTION,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400, count: 5000 },
  },
});

export const notificationQueue = new Queue('notifications', {
  connection: CONNECTION,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export const dataExportQueue = new Queue('data-export', {
  connection: CONNECTION,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 }, // Keep failures for 7 days
  },
});

export const complianceQueue = new Queue('compliance', {
  connection: CONNECTION,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 604800 },
    removeOnFail: { age: 2592000 }, // 30 days for compliance jobs
  },
});

export const clinicalQueue = new Queue('clinical', {
  connection: CONNECTION,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600 },
  },
});

// --- Job Types ---

export interface ImageAnalysisJob {
  patientId: string;
  imageUrl: string;
  actionItemId: string;
  uploadedBy: string;
}

export interface NotificationJob {
  type: 'sms' | 'email' | 'push';
  recipientId: string;
  template: string;
  data: Record<string, string>;
  region: string;
}

export interface DataExportJob {
  patientId: string;
  format: 'FHIR_R4' | 'CSV' | 'PDF';
  requestId: string;
  region: string;
}

export interface ComplianceJob {
  type: 'erasure' | 'breach_notification' | 'audit_archival' | 'consent_expiry';
  data: Record<string, unknown>;
  region: string;
  complianceRegime: string;
}

export interface ClinicalJob {
  type: 'risk_recalculation' | 'sepsis_screening' | 'fall_risk' | 'mission_reminder';
  patientId: string;
  data: Record<string, unknown>;
}

// --- Enqueue Helpers ---

export async function enqueueImageAnalysis(job: ImageAnalysisJob): Promise<void> {
  await imageAnalysisQueue.add('analyze', job, { priority: 1 });
  log.info({ patientId: job.patientId, actionItemId: job.actionItemId }, 'Image analysis job enqueued');
}

export async function enqueueNotification(job: NotificationJob): Promise<void> {
  await notificationQueue.add('send', job, { priority: 2 });
}

export async function enqueueDataExport(job: DataExportJob): Promise<void> {
  await dataExportQueue.add('export', job, { priority: 3 });
  log.info({ patientId: job.patientId, format: job.format, requestId: job.requestId }, 'Data export job enqueued');
}

export async function enqueueComplianceJob(job: ComplianceJob): Promise<void> {
  await complianceQueue.add(job.type, job, { priority: 1 });
  log.info({ type: job.type, region: job.region }, 'Compliance job enqueued');
}

export async function enqueueClinicalJob(job: ClinicalJob): Promise<void> {
  await clinicalQueue.add(job.type, job, { priority: 2 });
}

// --- Worker Initialization ---

export function startWorkers(): void {
  const concurrency = env.QUEUE_CONCURRENCY;

  // Image Analysis Worker
  new Worker('image-analysis', async (job: Job<ImageAnalysisJob>) => {
    log.info({ jobId: job.id, patientId: job.data.patientId }, 'Processing image analysis');
    // Delegate to AI service (Gemini Vision API)
    // Implementation in services/agentService.ts
  }, { connection: CONNECTION, concurrency: Math.ceil(concurrency * 0.2) });

  // Notification Worker
  new Worker('notifications', async (job: Job<NotificationJob>) => {
    log.info({ jobId: job.id, type: job.data.type, recipientId: job.data.recipientId }, 'Sending notification');
    // SMS: MSG91 (India), Twilio (US), SNS (UK)
    // Email: SMTP/SES
    // Push: FCM
  }, { connection: CONNECTION, concurrency: Math.ceil(concurrency * 0.3) });

  // Data Export Worker
  new Worker('data-export', async (job: Job<DataExportJob>) => {
    log.info({ jobId: job.id, patientId: job.data.patientId, format: job.data.format }, 'Processing data export');
    // Generate FHIR R4 bundle / CSV / PDF
    // Upload to S3 with pre-signed URL
    // Notify patient when ready
  }, { connection: CONNECTION, concurrency: Math.ceil(concurrency * 0.1) });

  // Compliance Worker
  new Worker('compliance', async (job: Job<ComplianceJob>) => {
    log.info({ jobId: job.id, type: job.data.type }, 'Processing compliance job');
    // Handle erasure requests, breach notifications, audit archival
  }, { connection: CONNECTION, concurrency: Math.ceil(concurrency * 0.2) });

  // Clinical Worker
  new Worker('clinical', async (job: Job<ClinicalJob>) => {
    log.info({ jobId: job.id, type: job.data.type, patientId: job.data.patientId }, 'Processing clinical job');
    // Risk recalculation, screening, reminders
  }, { connection: CONNECTION, concurrency: Math.ceil(concurrency * 0.2) });

  log.info({ concurrency }, 'All job workers started');
}

// --- Queue Health Check ---

export async function checkQueueHealth(): Promise<Record<string, { waiting: number; active: number; failed: number }>> {
  const queues = [
    { name: 'image-analysis', queue: imageAnalysisQueue },
    { name: 'notifications', queue: notificationQueue },
    { name: 'data-export', queue: dataExportQueue },
    { name: 'compliance', queue: complianceQueue },
    { name: 'clinical', queue: clinicalQueue },
  ];

  const results: Record<string, { waiting: number; active: number; failed: number }> = {};

  for (const { name, queue } of queues) {
    const [waiting, active, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
    ]);
    results[name] = { waiting, active, failed };
  }

  return results;
}
