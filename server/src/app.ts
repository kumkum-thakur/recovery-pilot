import express, { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { env } from './config/environment.js';
import {
  helmetMiddleware,
  corsMiddleware,
  compressionMiddleware,
  requestIdMiddleware,
  rateLimitMiddleware,
  healthcareSecurityHeaders,
  inputSanitizationMiddleware,
} from './middleware/security.js';
import { auditMiddleware } from './middleware/audit.js';
import { enforceDataResidency } from './middleware/compliance.js';
import { authRouter } from './routes/auth.js';
import { patientRouter } from './routes/patients.js';
import { clinicalRouter } from './routes/clinical.js';
import { adminRouter } from './routes/admin.js';
import { healthRouter } from './routes/health.js';
import { complianceRouter } from './routes/compliance.js';

/**
 * Express application factory.
 *
 * Middleware stack (order matters):
 * 1. Request ID assignment (correlation)
 * 2. Structured logging (every request)
 * 3. Security headers (helmet)
 * 4. CORS (origin validation)
 * 5. Compression (response optimization)
 * 6. Body parsing (JSON with size limits)
 * 7. Input sanitization (injection prevention)
 * 8. Rate limiting (DDoS protection)
 * 9. Data residency enforcement (compliance)
 * 10. Healthcare security headers (PHI protection)
 * 11. Audit logging (compliance trail)
 * 12. Route handlers
 * 13. Error handler (catch-all)
 */

export function createApp(): express.Application {
  const app = express();

  // Trust proxy (required behind load balancer/reverse proxy)
  app.set('trust proxy', env.TRUST_PROXY);

  // Disable fingerprinting
  app.disable('x-powered-by');

  // --- Global Middleware Stack ---

  // 1. Request ID
  app.use(requestIdMiddleware);

  // 2. Structured HTTP logging
  app.use(pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => {
        // Don't log health checks to reduce noise
        return req.url === '/health' || req.url === '/ready';
      },
    },
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  }));

  // 3. Security headers
  app.use(helmetMiddleware);

  // 4. CORS
  app.use(corsMiddleware);

  // 5. Compression
  app.use(compressionMiddleware);

  // 6. Body parsing with strict limits
  app.use(express.json({
    limit: '10mb', // Allow medical image uploads
    strict: true,
  }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // 7. Input sanitization
  app.use(inputSanitizationMiddleware);

  // 8. Rate limiting
  app.use(rateLimitMiddleware);

  // 9. Data residency
  app.use(enforceDataResidency);

  // 10. Healthcare security headers
  app.use('/api', healthcareSecurityHeaders);

  // 11. Audit logging (only for API routes)
  app.use('/api', auditMiddleware);

  // --- Routes ---

  // Health checks (no auth required)
  app.use('/', healthRouter);

  // Authentication
  app.use('/api/v1/auth', authRouter);

  // Patient data
  app.use('/api/v1/patients', patientRouter);

  // Clinical operations
  app.use('/api/v1/clinical', clinicalRouter);

  // Admin operations
  app.use('/api/v1/admin', adminRouter);

  // Compliance operations
  app.use('/api/v1/compliance', complianceRouter);

  // --- Error Handling ---

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested resource does not exist.',
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string;

    logger.error({
      err,
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    }, 'Unhandled error');

    // Don't leak error details in production
    const message = env.NODE_ENV === 'production'
      ? 'An internal error occurred. Please try again later.'
      : err.message;

    res.status(500).json({
      error: 'Internal server error',
      message,
      requestId,
    });
  });

  return app;
}
