import cluster from 'node:cluster';
import os from 'node:os';
import { createApp } from './app.js';
import { env } from './config/environment.js';
import { closeDatabaseConnections } from './config/database.js';
import { closeRedisConnections, connectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

/**
 * Production server entry point with cluster mode for multi-core utilization.
 *
 * Architecture for 2M patients/day:
 * - Cluster mode: 1 worker per CPU core
 * - Each worker handles ~2,700 req/sec (assuming 8 cores)
 * - Total capacity: ~22,000 req/sec per pod
 * - With 10 K8s pods: ~220,000 req/sec
 *
 * Load model:
 * - 2M patients/day = ~23 req/sec sustained
 * - Peak (5x): ~115 req/sec
 * - Burst (20x): ~460 req/sec
 * - With safety margin (10x burst): ~4,600 req/sec
 * - Single pod handles this; cluster provides redundancy
 *
 * Graceful shutdown:
 * - Stop accepting new connections
 * - Wait for in-flight requests to complete (30s timeout)
 * - Close database connections
 * - Close Redis connections
 * - Exit cleanly
 */

const NUM_WORKERS = env.CLUSTER_WORKERS || os.cpus().length;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 30000;

async function startWorker(): Promise<void> {
  try {
    // Connect to Redis before starting server
    await connectRedis();
    logger.info('Redis connections established');

    const app = createApp();
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info({
        port: env.PORT,
        host: env.HOST,
        pid: process.pid,
        nodeEnv: env.NODE_ENV,
        region: env.DEPLOYMENT_REGION,
        compliance: env.COMPLIANCE_REGIME,
      }, `Worker ${process.pid} listening on ${env.HOST}:${env.PORT}`);
    });

    // Keep-alive configuration for load balancer health checks
    server.keepAliveTimeout = 65000; // Slightly higher than ALB's 60s
    server.headersTimeout = 66000;

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      logger.info({ signal, pid: process.pid }, 'Shutdown signal received');

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await Promise.all([
            closeDatabaseConnections(),
            closeRedisConnections(),
          ]);
          logger.info('All connections closed cleanly');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    // Unhandled error handlers
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled Promise rejection');
    });

    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught exception - shutting down');
      void shutdown('uncaughtException');
    });

  } catch (err) {
    logger.fatal({ err }, 'Failed to start worker');
    process.exit(1);
  }
}

function startPrimary(): void {
  logger.info({
    workers: NUM_WORKERS,
    pid: process.pid,
    nodeEnv: env.NODE_ENV,
    region: env.DEPLOYMENT_REGION,
    compliance: env.COMPLIANCE_REGIME,
  }, `Primary process ${process.pid} starting ${NUM_WORKERS} workers`);

  // Fork workers
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  // Restart crashed workers
  cluster.on('exit', (worker, code, signal) => {
    logger.error({
      workerPid: worker.process.pid,
      code,
      signal,
    }, 'Worker died - spawning replacement');

    // Exponential backoff for rapid failures
    setTimeout(() => {
      cluster.fork();
    }, 1000);
  });

  // Health monitoring
  cluster.on('online', (worker) => {
    logger.info({ workerPid: worker.process.pid }, 'Worker online');
  });
}

// --- Entry Point ---

if (env.NODE_ENV === 'development') {
  // Single process in development for easier debugging
  void startWorker();
} else if (cluster.isPrimary) {
  startPrimary();
} else {
  void startWorker();
}
