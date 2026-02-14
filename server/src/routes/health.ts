import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database.js';
import { checkRedisHealth } from '../config/redis.js';
import { env } from '../config/environment.js';

/**
 * Health check endpoints for Kubernetes probes and load balancer health checks.
 *
 * /health  - Liveness probe: Is the process alive?
 * /ready   - Readiness probe: Can the process serve traffic?
 * /metrics - Prometheus metrics endpoint
 */

export const healthRouter = Router();

// Liveness probe - lightweight, no dependency checks
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] ?? '1.0.0',
    region: env.DEPLOYMENT_REGION,
    uptime: process.uptime(),
  });
});

// Readiness probe - checks all dependencies
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  try {
    const [dbHealth, redisHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const isReady =
      dbHealth.primary &&
      redisHealth.session &&
      redisHealth.cache;

    const status = isReady ? 200 : 503;

    res.status(status).json({
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          primary: dbHealth.primary,
          replicas: dbHealth.replicas,
          latencyMs: dbHealth.latencyMs,
        },
        redis: {
          session: redisHealth.session,
          cache: redisHealth.cache,
          rateLimit: redisHealth.rateLimit,
          queue: redisHealth.queue,
          latencyMs: redisHealth.latencyMs,
        },
      },
    });
  } catch (_err) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});

// Startup probe - for slow-starting containers
healthRouter.get('/startup', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'started' });
});
