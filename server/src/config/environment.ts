import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Production environment configuration with strict validation.
 * All secrets must come from environment variables or AWS Secrets Manager.
 * Never hardcode credentials.
 */

const DeploymentRegion = z.enum(['ap-south-1', 'us-east-1', 'eu-west-2']);
const ComplianceRegime = z.enum(['DPDPA', 'HIPAA', 'UK_GDPR']);

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  CLUSTER_WORKERS: z.coerce.number().default(0), // 0 = auto (use all CPUs)
  TRUST_PROXY: z.coerce.number().default(1),

  // Deployment region and compliance
  DEPLOYMENT_REGION: DeploymentRegion.default('ap-south-1'),
  COMPLIANCE_REGIME: ComplianceRegime.default('DPDPA'),
  DATA_RESIDENCY_REGION: DeploymentRegion.default('ap-south-1'),

  // PostgreSQL - Primary (Write)
  DB_PRIMARY_HOST: z.string().default('localhost'),
  DB_PRIMARY_PORT: z.coerce.number().default(5432),
  DB_PRIMARY_NAME: z.string().default('recovery_pilot'),
  DB_PRIMARY_USER: z.string().default('rp_app'),
  DB_PRIMARY_PASSWORD: z.string().default(''),
  DB_PRIMARY_SSL: z.coerce.boolean().default(true),
  DB_PRIMARY_POOL_MIN: z.coerce.number().default(20),
  DB_PRIMARY_POOL_MAX: z.coerce.number().default(100),
  DB_PRIMARY_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  DB_PRIMARY_ACQUIRE_TIMEOUT_MS: z.coerce.number().default(60000),
  DB_PRIMARY_STATEMENT_TIMEOUT_MS: z.coerce.number().default(30000),

  // PostgreSQL - Read Replicas
  DB_REPLICA_HOSTS: z.string().default(''), // comma-separated
  DB_REPLICA_POOL_MAX: z.coerce.number().default(200),

  // Redis - Primary (Sessions + Cache)
  REDIS_PRIMARY_HOST: z.string().default('localhost'),
  REDIS_PRIMARY_PORT: z.coerce.number().default(6379),
  REDIS_PRIMARY_PASSWORD: z.string().default(''),
  REDIS_PRIMARY_TLS: z.coerce.boolean().default(true),
  REDIS_PRIMARY_DB: z.coerce.number().default(0),
  REDIS_MAX_RETRIES: z.coerce.number().default(3),
  REDIS_KEY_PREFIX: z.string().default('rp:'),

  // Redis Cluster (for production)
  REDIS_CLUSTER_ENABLED: z.coerce.boolean().default(false),
  REDIS_CLUSTER_NODES: z.string().default(''), // comma-separated host:port

  // Authentication
  JWT_SECRET: z.string().min(32).default('CHANGE_ME_IN_PRODUCTION_32_CHARS_MINIMUM'),
  JWT_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  JWT_ISSUER: z.string().default('recovery-pilot'),
  // Argon2id password hashing (modern replacement for bcrypt)
  ARGON2_MEMORY_COST: z.coerce.number().default(65536), // 64 MB
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(4),
  // Legacy bcrypt support for migrating existing hashes
  BCRYPT_ROUNDS: z.coerce.number().min(12).default(14),
  MFA_ENABLED: z.coerce.boolean().default(true),
  SESSION_SECRET: z.string().min(32).default('CHANGE_ME_IN_PRODUCTION_32_CHARS_MINIMUM'),

  // Encryption (AES-256-GCM for PHI at rest)
  ENCRYPTION_MASTER_KEY: z.string().default(''),
  AWS_KMS_KEY_ARN: z.string().default(''),
  ENCRYPTION_ALGORITHM: z.string().default('aes-256-gcm'),
  FIELD_LEVEL_ENCRYPTION: z.coerce.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),
  RATE_LIMIT_API_MAX: z.coerce.number().default(1000),
  RATE_LIMIT_STORE: z.enum(['memory', 'redis']).default('redis'),

  // AWS Services
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  S3_BUCKET_MEDICAL_IMAGES: z.string().default(''),
  S3_BUCKET_AUDIT_LOGS: z.string().default(''),
  S3_BUCKET_BACKUPS: z.string().default(''),
  S3_ENCRYPTION: z.enum(['AES256', 'aws:kms']).default('aws:kms'),

  // BullMQ (Job Queue)
  QUEUE_REDIS_HOST: z.string().default(''),
  QUEUE_REDIS_PORT: z.coerce.number().default(6379),
  QUEUE_CONCURRENCY: z.coerce.number().default(50),

  // Monitoring & Observability
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  METRICS_ENABLED: z.coerce.boolean().default(true),
  METRICS_PORT: z.coerce.number().default(9090),
  TRACING_ENABLED: z.coerce.boolean().default(true),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default(''),
  SENTRY_DSN: z.string().default(''),

  // External Services
  GEMINI_API_KEY: z.string().default(''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMS_PROVIDER: z.enum(['twilio', 'sns', 'msg91']).default('msg91'), // msg91 for India
  SMS_API_KEY: z.string().default(''),

  // CORS
  CORS_ORIGINS: z.string().default(''),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // Audit
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().default(2555), // 7 years for HIPAA
  AUDIT_LOG_IMMUTABLE: z.coerce.boolean().default(true),
  AUDIT_LOG_DESTINATION: z.enum(['database', 's3', 'both']).default('both'),
});

export type Environment = z.infer<typeof envSchema>;

function validateEnvironment(): Environment {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const env = result.data;

  // Production-specific validations
  if (env.NODE_ENV === 'production') {
    const criticalChecks = [
      { key: 'JWT_SECRET', valid: !env.JWT_SECRET.includes('CHANGE_ME') },
      { key: 'SESSION_SECRET', valid: !env.SESSION_SECRET.includes('CHANGE_ME') },
      { key: 'DB_PRIMARY_PASSWORD', valid: env.DB_PRIMARY_PASSWORD.length > 0 },
      { key: 'DB_PRIMARY_SSL', valid: env.DB_PRIMARY_SSL },
      { key: 'REDIS_PRIMARY_TLS', valid: env.REDIS_PRIMARY_TLS },
      { key: 'ENCRYPTION_MASTER_KEY or AWS_KMS_KEY_ARN', valid: env.ENCRYPTION_MASTER_KEY.length > 0 || env.AWS_KMS_KEY_ARN.length > 0 },
      { key: 'ARGON2_MEMORY_COST >= 65536', valid: env.ARGON2_MEMORY_COST >= 65536 },
      { key: 'MFA_ENABLED', valid: env.MFA_ENABLED },
      { key: 'AUDIT_LOG_IMMUTABLE', valid: env.AUDIT_LOG_IMMUTABLE },
    ];

    const failures = criticalChecks.filter(c => !c.valid);
    if (failures.length > 0) {
      console.error('FATAL: Production security checks failed:');
      for (const f of failures) {
        console.error(`  ✗ ${f.key}`);
      }
      process.exit(1);
    }
  }

  return env;
}

export const env = validateEnvironment();

// Compliance configuration per region
export const COMPLIANCE_CONFIG = {
  DPDPA: {
    region: 'India',
    dataResidency: 'ap-south-1',
    retentionYears: 5,
    consentRequired: true,
    dataPortabilityRequired: true,
    rightToErasure: true,
    dataPrincipalAge: 18,
    childDataAge: 18,
    crossBorderTransfer: 'restricted',
    breachNotificationHours: 72,
    dpoBoardRequired: true,
    significantDataFiduciary: true,
    grievanceOfficerRequired: true,
    auditFrequency: 'annual',
    applicableLaws: ['DPDPA 2023', 'IT Act 2000', 'IT Rules 2011', 'ABDM Health Data Management Policy'],
  },
  HIPAA: {
    region: 'United States',
    dataResidency: 'us-east-1',
    retentionYears: 7,
    consentRequired: true,
    minimumNecessaryRule: true,
    deIdentificationStandard: 'Safe Harbor',
    breachNotificationDays: 60,
    businessAssociateAgreement: true,
    phiEncryptionRequired: true,
    auditTrailRequired: true,
    accessControlRequired: true,
    emergencyAccessProcedure: true,
    applicableLaws: ['HIPAA Privacy Rule', 'HIPAA Security Rule', 'HITECH Act', '21st Century Cures Act', '42 CFR Part 2'],
  },
  UK_GDPR: {
    region: 'United Kingdom',
    dataResidency: 'eu-west-2',
    retentionYears: 7,
    consentRequired: true,
    lawfulBasis: ['consent', 'vital_interests', 'public_interest'],
    dataProtectionOfficerRequired: true,
    dpiaRequired: true,
    rightToErasure: true,
    rightToPortability: true,
    breachNotificationHours: 72,
    internationalTransfer: 'adequacy_decision_or_safeguards',
    caldicottPrinciples: true,
    nhsDigitalStandards: true,
    applicableLaws: ['UK GDPR', 'Data Protection Act 2018', 'NHS Act 2006', 'Caldicott Principles', 'Common Law Duty of Confidentiality'],
  },
} as const;
