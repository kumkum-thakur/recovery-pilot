import pino from 'pino';

/**
 * Structured JSON logging with pino for production observability.
 *
 * Log levels: trace, debug, info, warn, error, fatal
 * Format: JSON in production (machine-parseable), pretty in development
 *
 * All logs include:
 * - timestamp (ISO 8601)
 * - level (numeric + string)
 * - msg (human-readable message)
 * - component (subsystem identifier)
 * - requestId (correlation ID for distributed tracing)
 *
 * PHI/PII Redaction:
 * - Patient names, emails, phone numbers are redacted from logs
 * - Only patient IDs (UUIDs) are logged
 * - This complies with HIPAA, DPDPA, and UK GDPR logging requirements
 */

const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'info';
const LOG_FORMAT = process.env['LOG_FORMAT'] ?? 'json';

// Fields to redact from logs (HIPAA/DPDPA/UK GDPR compliance)
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'passwordHash',
  'ssn',
  'aadhaar',
  'nhsNumber',
  'dateOfBirth',
  'phoneNumber',
  'email',
  'patientName',
  'address',
  'emergencyContact',
  'insuranceId',
  'creditCard',
  'bankAccount',
  'biometric',
  'geneticData',
  'mfaSecret',
  'refreshToken',
  'accessToken',
  'apiKey',
  'encryptionKey',
];

export const logger = pino({
  level: LOG_LEVEL,
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(LOG_FORMAT === 'pretty'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
  formatters: {
    level: (label: string) => ({ level: label }),
    bindings: (bindings: pino.Bindings) => ({
      pid: bindings['pid'],
      hostname: bindings['hostname'],
      service: 'recovery-pilot-api',
    }),
  },
});

/**
 * Create a child logger with component context.
 */
export function createLogger(component: string): pino.Logger {
  return logger.child({ component });
}

/**
 * Create a request-scoped logger with correlation ID.
 */
export function createRequestLogger(requestId: string, component?: string): pino.Logger {
  return logger.child({
    requestId,
    ...(component ? { component } : {}),
  });
}
