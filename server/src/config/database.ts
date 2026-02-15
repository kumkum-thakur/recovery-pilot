import knex, { Knex } from 'knex';
import { env } from './environment.js';
import { logger } from '../utils/logger.js';

/**
 * PostgreSQL connection configuration optimized for 2M patients/day.
 *
 * Architecture:
 * - Primary (write): Single master with connection pooling (max 100 connections)
 * - Replicas (read): Multiple read replicas with pool (max 200 connections each)
 * - Statement timeout: 30s to prevent long-running queries from blocking
 * - Idle timeout: 30s to recycle connections efficiently
 *
 * At 2M patients/day ≈ ~23 req/sec sustained, ~115 req/sec peak (5x):
 * - Each request ~2-3 queries → ~350 queries/sec peak
 * - Pool of 100 write + 200 read handles this with headroom
 */

function buildConnectionConfig(host: string, isReplica = false): Knex.PgConnectionConfig {
  return {
    host,
    port: env.DB_PRIMARY_PORT,
    database: env.DB_PRIMARY_NAME,
    user: env.DB_PRIMARY_USER,
    password: env.DB_PRIMARY_PASSWORD,
    ssl: env.DB_PRIMARY_SSL ? { rejectUnauthorized: true } : false,
    application_name: `recovery-pilot-${isReplica ? 'replica' : 'primary'}`,
    statement_timeout: env.DB_PRIMARY_STATEMENT_TIMEOUT_MS,
  };
}

function createKnexConfig(host: string, poolMax: number, isReplica = false): Knex.Config {
  return {
    client: 'pg',
    connection: buildConnectionConfig(host, isReplica),
    pool: {
      min: isReplica ? 5 : env.DB_PRIMARY_POOL_MIN,
      max: poolMax,
      idleTimeoutMillis: env.DB_PRIMARY_IDLE_TIMEOUT_MS,
      acquireTimeoutMillis: env.DB_PRIMARY_ACQUIRE_TIMEOUT_MS,
      reapIntervalMillis: 1000,
      propagateCreateError: false,
    },
    acquireConnectionTimeout: env.DB_PRIMARY_ACQUIRE_TIMEOUT_MS,
    debug: env.NODE_ENV === 'development',
    log: {
      warn: (msg: string) => logger.warn({ component: 'knex' }, msg),
      error: (msg: string) => logger.error({ component: 'knex' }, msg),
      deprecate: (msg: string) => logger.warn({ component: 'knex', type: 'deprecation' }, msg),
      debug: (msg: string) => logger.debug({ component: 'knex' }, msg),
    },
  };
}

// Primary (write) connection
export const primaryDb = knex(
  createKnexConfig(env.DB_PRIMARY_HOST, env.DB_PRIMARY_POOL_MAX)
);

// Read replica connections with round-robin load balancing
const replicaHosts = env.DB_REPLICA_HOSTS
  ? env.DB_REPLICA_HOSTS.split(',').map(h => h.trim()).filter(Boolean)
  : [];

const replicaPools: Knex[] = replicaHosts.map(host =>
  knex(createKnexConfig(host, env.DB_REPLICA_POOL_MAX, true))
);

let replicaIndex = 0;

/**
 * Get a read-optimized database connection.
 * Uses round-robin across read replicas. Falls back to primary if no replicas.
 */
export function getReadDb(): Knex {
  if (replicaPools.length === 0) return primaryDb;
  const pool = replicaPools[replicaIndex % replicaPools.length]!;
  replicaIndex = (replicaIndex + 1) % replicaPools.length;
  return pool;
}

/**
 * Get the primary (write) database connection.
 */
export function getWriteDb(): Knex {
  return primaryDb;
}

/**
 * Health check for all database connections.
 */
export async function checkDatabaseHealth(): Promise<{
  primary: boolean;
  replicas: boolean[];
  latencyMs: number;
}> {
  const start = Date.now();
  let primaryOk = false;

  try {
    await primaryDb.raw('SELECT 1');
    primaryOk = true;
  } catch (err) {
    logger.error({ err, component: 'db-health' }, 'Primary database health check failed');
  }

  const replicaResults = await Promise.all(
    replicaPools.map(async (pool, i) => {
      try {
        await pool.raw('SELECT 1');
        return true;
      } catch (err) {
        logger.error({ err, component: 'db-health', replicaIndex: i }, 'Replica health check failed');
        return false;
      }
    })
  );

  return {
    primary: primaryOk,
    replicas: replicaResults,
    latencyMs: Date.now() - start,
  };
}

/**
 * Graceful shutdown - close all pools.
 */
export async function closeDatabaseConnections(): Promise<void> {
  logger.info('Closing database connections...');
  await primaryDb.destroy();
  await Promise.all(replicaPools.map(pool => pool.destroy()));
  logger.info('All database connections closed');
}
