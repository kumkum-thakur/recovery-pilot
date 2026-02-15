import { Redis, type RedisOptions, type ClusterNode } from 'ioredis';
import { env } from './environment.js';
import { logger } from '../utils/logger.js';

/**
 * Redis configuration for caching, sessions, rate limiting, and job queues.
 *
 * Performance targets at 2M patients/day:
 * - Session lookups: <1ms p99
 * - Cache hit ratio: >95%
 * - Rate limit checks: <0.5ms
 *
 * Redis usage breakdown:
 * - DB 0: Sessions + Auth tokens
 * - DB 1: Application cache (patient data, care plans)
 * - DB 2: Rate limiting counters
 * - DB 3: BullMQ job queues
 */

function createRedisOptions(db: number): RedisOptions {
  return {
    host: env.REDIS_PRIMARY_HOST,
    port: env.REDIS_PRIMARY_PORT,
    password: env.REDIS_PRIMARY_PASSWORD || undefined,
    db,
    tls: env.REDIS_PRIMARY_TLS ? { rejectUnauthorized: true } : undefined,
    keyPrefix: env.REDIS_KEY_PREFIX,
    maxRetriesPerRequest: env.REDIS_MAX_RETRIES,
    retryStrategy: (times: number) => {
      if (times > 10) return null; // Stop retrying
      return Math.min(times * 200, 5000); // Exponential backoff, max 5s
    },
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some(e => err.message.includes(e));
    },
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    lazyConnect: true,
  };
}

export function createClusterOptions(): ClusterNode[] {
  return env.REDIS_CLUSTER_NODES
    .split(',')
    .map(node => {
      const [host, port] = node.trim().split(':');
      return { host: host!, port: parseInt(port ?? '6379') };
    });
}

// Session Redis (DB 0)
export const sessionRedis = new Redis(createRedisOptions(0));

// Cache Redis (DB 1)
export const cacheRedis = new Redis(createRedisOptions(1));

// Rate Limit Redis (DB 2)
export const rateLimitRedis = new Redis(createRedisOptions(2));

// Queue Redis (DB 3) - for BullMQ
export const queueRedis = new Redis(createRedisOptions(3));

// Attach event handlers for monitoring
function attachHandlers(client: Redis, name: string): void {
  client.on('connect', () => logger.info({ component: 'redis', name }, 'Redis connecting'));
  client.on('ready', () => logger.info({ component: 'redis', name }, 'Redis ready'));
  client.on('error', (err: Error) => logger.error({ component: 'redis', name, err }, 'Redis error'));
  client.on('close', () => logger.warn({ component: 'redis', name }, 'Redis connection closed'));
  client.on('reconnecting', () => logger.info({ component: 'redis', name }, 'Redis reconnecting'));
}

attachHandlers(sessionRedis, 'session');
attachHandlers(cacheRedis, 'cache');
attachHandlers(rateLimitRedis, 'rateLimit');
attachHandlers(queueRedis, 'queue');

/**
 * Cache wrapper with automatic serialization, TTL, and stampede protection.
 */
export class CacheManager {
  constructor(
    private redis: Redis = cacheRedis,
    private defaultTtlSeconds: number = 300 // 5 minutes
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    // Stampede protection with SETNX lock
    const lockKey = `${key}:lock`;
    const lockAcquired = await this.redis.set(lockKey, '1', 'EX', 30, 'NX');

    if (!lockAcquired) {
      // Another request is populating, wait and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryResult = await this.get<T>(key);
      if (retryResult !== null) return retryResult;
    }

    try {
      const value = await factory();
      await this.set(key, value, ttlSeconds);
      return value;
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async invalidate(pattern: string): Promise<number> {
    const keys = await this.redis.keys(`${env.REDIS_KEY_PREFIX}${pattern}`);
    if (keys.length === 0) return 0;
    // Remove prefix before deleting (ioredis adds it back)
    const cleanKeys = keys.map((k: string) => k.replace(env.REDIS_KEY_PREFIX, ''));
    return this.redis.del(...cleanKeys);
  }

  async invalidatePatient(patientId: string): Promise<void> {
    await this.invalidate(`patient:${patientId}:*`);
  }
}

export const cache = new CacheManager();

/**
 * Redis health check.
 */
export async function checkRedisHealth(): Promise<{
  session: boolean;
  cache: boolean;
  rateLimit: boolean;
  queue: boolean;
  latencyMs: number;
}> {
  const start = Date.now();

  const checks = await Promise.all([
    sessionRedis.ping().then(() => true).catch(() => false),
    cacheRedis.ping().then(() => true).catch(() => false),
    rateLimitRedis.ping().then(() => true).catch(() => false),
    queueRedis.ping().then(() => true).catch(() => false),
  ]);

  return {
    session: checks[0]!,
    cache: checks[1]!,
    rateLimit: checks[2]!,
    queue: checks[3]!,
    latencyMs: Date.now() - start,
  };
}

/**
 * Connect all Redis clients.
 */
export async function connectRedis(): Promise<void> {
  await Promise.all([
    sessionRedis.connect(),
    cacheRedis.connect(),
    rateLimitRedis.connect(),
    queueRedis.connect(),
  ]);
}

/**
 * Graceful shutdown.
 */
export async function closeRedisConnections(): Promise<void> {
  logger.info('Closing Redis connections...');
  await Promise.all([
    sessionRedis.quit(),
    cacheRedis.quit(),
    rateLimitRedis.quit(),
    queueRedis.quit(),
  ]);
  logger.info('All Redis connections closed');
}
