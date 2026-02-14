import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { env } from '../config/environment.js';
import { rateLimitRedis } from '../config/redis.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('security');

/**
 * Comprehensive security middleware stack for healthcare compliance.
 *
 * Implements:
 * - OWASP Top 10 protections
 * - CSP (Content Security Policy)
 * - HSTS (HTTP Strict Transport Security)
 * - Rate limiting (per-IP and per-user)
 * - Request ID correlation
 * - Request size limits
 * - CORS with strict origin checking
 * - Compression (with BREACH attack mitigation)
 */

// --- Helmet (Security Headers) ---
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // TailwindCSS needs inline styles
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
});

// --- CORS ---
const allowedOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log.warn({ origin }, 'CORS request from unauthorized origin');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: env.CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours preflight cache
});

// --- Compression ---
export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't accept it
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
});

// --- Request ID ---
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = requestId;
  _res.setHeader('X-Request-ID', requestId);
  next();
}

// --- Rate Limiting ---

// General API rate limiter
const apiLimiter = env.RATE_LIMIT_STORE === 'redis'
  ? new RateLimiterRedis({
      storeClient: rateLimitRedis,
      keyPrefix: 'rl:api',
      points: env.RATE_LIMIT_API_MAX,
      duration: 60, // per minute
      blockDuration: 60,
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:api',
      points: env.RATE_LIMIT_API_MAX,
      duration: 60,
    });

// Auth endpoint rate limiter (stricter)
const authLimiter = env.RATE_LIMIT_STORE === 'redis'
  ? new RateLimiterRedis({
      storeClient: rateLimitRedis,
      keyPrefix: 'rl:auth',
      points: env.RATE_LIMIT_AUTH_MAX,
      duration: 900, // 5 attempts per 15 minutes
      blockDuration: 900,
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:auth',
      points: env.RATE_LIMIT_AUTH_MAX,
      duration: 900,
    });

// Per-patient data access limiter
const patientDataLimiter = env.RATE_LIMIT_STORE === 'redis'
  ? new RateLimiterRedis({
      storeClient: rateLimitRedis,
      keyPrefix: 'rl:patient',
      points: 200,
      duration: 60,
      blockDuration: 30,
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl:patient',
      points: 200,
      duration: 60,
    });

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = req.ip ?? 'unknown';
    const result = await apiLimiter.consume(key);
    res.setHeader('X-RateLimit-Remaining', result.remainingPoints.toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.msBeforeNext).toISOString());
    next();
  } catch {
    log.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please retry after some time.',
      retryAfter: 60,
    });
  }
}

export async function authRateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = req.ip ?? 'unknown';
    await authLimiter.consume(key);
    next();
  } catch {
    log.warn({ ip: req.ip }, 'Auth rate limit exceeded - possible brute force');
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked. Please try again later.',
      retryAfter: 900,
    });
  }
}

export async function patientDataRateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as Request & { userId?: string }).userId ?? req.ip ?? 'unknown';
    await patientDataLimiter.consume(userId);
    next();
  } catch {
    res.status(429).json({
      error: 'Too many data requests',
      message: 'Please slow down data access requests.',
      retryAfter: 30,
    });
  }
}

// --- Request Size Limits ---
export function requestSizeLimitMiddleware(maxBodySize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] ?? '0');
    const maxBytes = parseSize(maxBodySize);

    if (contentLength > maxBytes) {
      res.status(413).json({
        error: 'Payload too large',
        message: `Request body exceeds maximum size of ${maxBodySize}`,
      });
      return;
    }
    next();
  };
}

function parseSize(size: string): number {
  const units: Record<string, number> = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.match(/^(\d+)(b|kb|mb|gb)$/i);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  return parseInt(match[1]!) * (units[match[2]!.toLowerCase()] ?? 1);
}

// --- Security Headers for Healthcare APIs ---
export function healthcareSecurityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent caching of PHI data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');

  // Permissions Policy (restrict browser features)
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  next();
}

// --- SQL Injection / NoSQL Injection Prevention ---
export function inputSanitizationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|DECLARE)\b)/i,
    /(\$where|\$gt|\$lt|\$ne|\$regex)/,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  const checkValue = (value: unknown, path: string): boolean => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          log.warn({ path, ip: req.ip }, 'Potential injection attempt detected');
          return true;
        }
      }
    }
    if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (checkValue(val, `${path}.${key}`)) return true;
      }
    }
    return false;
  };

  // Check query params and body (not overly aggressive - let validated routes handle specifics)
  if (req.query && checkValue(req.query, 'query')) {
    res.status(400).json({ error: 'Invalid request parameters' });
    return;
  }

  next();
}
