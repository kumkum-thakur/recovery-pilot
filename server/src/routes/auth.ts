import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  generateAccessToken,
  generateRefreshToken,
  createSession,
  revokeSession,
  revokeAllUserSessions,
  storeRefreshToken,
  validateRefreshToken,
  blacklistToken,
  verifyToken,
  authenticateToken,
  generateMFASecret,
  verifyMFAToken,
  generateMFAUri,
  AuthenticatedRequest,
} from '../middleware/authentication.js';
import { authRateLimitMiddleware } from '../middleware/security.js';
import { writeAuditLog, AuditEventType } from '../middleware/audit.js';
import { getReadDb, getWriteDb } from '../config/database.js';
import { env } from '../config/environment.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('auth-routes');

export const authRouter = Router();

// --- Validation Schemas ---

const loginSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(8).max(128),
  mfaToken: z.string().length(6).optional(),
});

const registerSchema = z.object({
  username: z.string().min(3).max(100).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(['patient', 'doctor']),
  region: z.string().default('ap-south-1'),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const mfaSetupSchema = z.object({
  token: z.string().length(6),
});

// --- Login ---

authRouter.post('/login', authRateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const db = getReadDb();

    // Find user by username
    const user = await db('users')
      .where({ username: body.username, is_active: true })
      .first();

    if (!user) {
      await writeAuditLog({
        eventType: AuditEventType.AUTH_FAILED,
        userId: 'unknown',
        userRole: 'unknown',
        resourceType: 'auth',
        action: 'LOGIN_FAILED',
        outcome: 'failure',
        ipAddress: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
        requestId: (req.headers['x-request-id'] as string) ?? '',
        region: env.DEPLOYMENT_REGION,
        complianceRegime: env.COMPLIANCE_REGIME,
        details: { reason: 'user_not_found', username: body.username },
      });

      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const validPassword = await verifyPassword(body.password, user.password_hash);
    if (!validPassword) {
      // Increment failed login attempts
      await getWriteDb()('users')
        .where({ id: user.id })
        .increment('failed_login_attempts', 1)
        .update({ last_failed_login: new Date().toISOString() });

      // Lock account after 5 failed attempts
      if (user.failed_login_attempts >= 4) {
        await getWriteDb()('users')
          .where({ id: user.id })
          .update({ is_locked: true, locked_at: new Date().toISOString() });

        log.warn({ userId: user.id }, 'Account locked due to failed login attempts');
      }

      await writeAuditLog({
        eventType: AuditEventType.AUTH_FAILED,
        userId: user.id,
        userRole: user.role,
        resourceType: 'auth',
        action: 'LOGIN_FAILED',
        outcome: 'failure',
        ipAddress: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
        requestId: (req.headers['x-request-id'] as string) ?? '',
        region: env.DEPLOYMENT_REGION,
        complianceRegime: env.COMPLIANCE_REGIME,
        details: { reason: 'invalid_password', attempts: user.failed_login_attempts + 1 },
      });

      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if account is locked
    if (user.is_locked) {
      res.status(423).json({
        error: 'Account locked',
        message: 'Your account has been locked due to too many failed login attempts. Please contact support.',
      });
      return;
    }

    // Verify MFA if enabled
    if (user.mfa_enabled) {
      if (!body.mfaToken) {
        res.status(200).json({
          requiresMFA: true,
          message: 'Please provide your MFA token.',
        });
        return;
      }

      if (!verifyMFAToken(user.mfa_secret, body.mfaToken)) {
        res.status(401).json({ error: 'Invalid MFA token' });
        return;
      }
    }

    // Create session
    const sessionId = await createSession(user.id, {
      ip: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      region: user.region ?? env.DEPLOYMENT_REGION,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      role: user.role,
      region: user.region ?? env.DEPLOYMENT_REGION,
      sessionId,
    });

    const refreshToken = generateRefreshToken({
      sub: user.id,
      sessionId,
    });

    await storeRefreshToken(sessionId, refreshToken);

    // Transparent hash migration: rehash legacy bcrypt → argon2id on successful login
    if (needsRehash(user.password_hash)) {
      const newHash = await hashPassword(body.password);
      await getWriteDb()('users')
        .where({ id: user.id })
        .update({ password_hash: newHash });
      log.info({ userId: user.id }, 'Password hash migrated from bcrypt to argon2id');
    }

    // Reset failed attempts on successful login
    await getWriteDb()('users')
      .where({ id: user.id })
      .update({
        failed_login_attempts: 0,
        last_login: new Date().toISOString(),
      });

    await writeAuditLog({
      eventType: AuditEventType.AUTH_LOGIN,
      userId: user.id,
      userRole: user.role,
      resourceType: 'auth',
      action: 'LOGIN_SUCCESS',
      outcome: 'success',
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      requestId: (req.headers['x-request-id'] as string) ?? '',
      region: env.DEPLOYMENT_REGION,
      complianceRegime: env.COMPLIANCE_REGIME,
      details: { mfaUsed: user.mfa_enabled },
    });

    res.status(200).json({
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRY,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        region: user.region,
        mfaEnabled: user.mfa_enabled,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    log.error({ err }, 'Login error');
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// --- Register ---

authRouter.post('/register', authRateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);
    const db = getWriteDb();

    // Check for existing user
    const existing = await getReadDb()('users')
      .where({ username: body.username })
      .orWhere({ email: body.email })
      .first();

    if (existing) {
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const [user] = await db('users')
      .insert({
        username: body.username,
        email: body.email,
        password_hash: passwordHash,
        name: body.name,
        role: body.role,
        region: body.region,
        is_active: true,
        mfa_enabled: false,
        failed_login_attempts: 0,
        created_at: new Date().toISOString(),
      })
      .returning(['id', 'username', 'name', 'role', 'region']);

    await writeAuditLog({
      eventType: AuditEventType.DATA_CREATE,
      userId: user.id,
      userRole: user.role,
      resourceType: 'user',
      resourceId: user.id,
      action: 'USER_REGISTERED',
      outcome: 'success',
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      requestId: (req.headers['x-request-id'] as string) ?? '',
      region: env.DEPLOYMENT_REGION,
      complianceRegime: env.COMPLIANCE_REGIME,
      details: { role: body.role },
    });

    res.status(201).json({
      message: 'Registration successful. MFA setup is required.',
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    log.error({ err }, 'Registration error');
    res.status(500).json({ error: 'Registration failed' });
  }
});

// --- Token Refresh ---

authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const body = refreshSchema.parse(req.body);
    const payload = verifyToken(body.refreshToken);

    // Validate refresh token
    if (!await validateRefreshToken(payload.sessionId, body.refreshToken)) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Generate new token pair
    const newAccessToken = generateAccessToken({
      sub: payload.sub,
      role: payload.role,
      region: payload.region ?? env.DEPLOYMENT_REGION,
      sessionId: payload.sessionId,
    });

    const newRefreshToken = generateRefreshToken({
      sub: payload.sub,
      sessionId: payload.sessionId,
    });

    // Rotate refresh token
    await storeRefreshToken(payload.sessionId, newRefreshToken);

    // Blacklist old refresh token
    const remainingTime = payload.exp - Math.floor(Date.now() / 1000);
    if (remainingTime > 0) {
      await blacklistToken(body.refreshToken, remainingTime);
    }

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: env.JWT_EXPIRY,
    });
  } catch (_err) {
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// --- Logout ---

authRouter.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Revoke session
    await revokeSession(authReq.sessionId, authReq.userId);

    // Blacklist current access token
    const token = req.headers.authorization?.slice(7);
    if (token) {
      await blacklistToken(token, 900); // 15 min TTL
    }

    await writeAuditLog({
      eventType: AuditEventType.AUTH_LOGOUT,
      userId: authReq.userId,
      userRole: authReq.userRole,
      resourceType: 'auth',
      action: 'LOGOUT',
      outcome: 'success',
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      requestId: (req.headers['x-request-id'] as string) ?? '',
      region: env.DEPLOYMENT_REGION,
      complianceRegime: env.COMPLIANCE_REGIME,
      details: {},
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    log.error({ err }, 'Logout error');
    res.status(500).json({ error: 'Logout failed' });
  }
});

// --- MFA Setup ---

authRouter.post('/mfa/setup', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const secret = generateMFASecret();
    const uri = generateMFAUri(secret, authReq.userId);

    // Store secret temporarily (unverified)
    await getWriteDb()('users')
      .where({ id: authReq.userId })
      .update({ mfa_secret_pending: secret });

    res.status(200).json({
      secret,
      uri,
      message: 'Scan the QR code with your authenticator app, then verify with a token.',
    });
  } catch (err) {
    log.error({ err }, 'MFA setup error');
    res.status(500).json({ error: 'MFA setup failed' });
  }
});

authRouter.post('/mfa/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = mfaSetupSchema.parse(req.body);

    const user = await getReadDb()('users')
      .where({ id: authReq.userId })
      .first();

    if (!user?.mfa_secret_pending) {
      res.status(400).json({ error: 'MFA setup not initiated' });
      return;
    }

    if (!verifyMFAToken(user.mfa_secret_pending, body.token)) {
      res.status(400).json({ error: 'Invalid MFA token' });
      return;
    }

    // Activate MFA
    await getWriteDb()('users')
      .where({ id: authReq.userId })
      .update({
        mfa_enabled: true,
        mfa_secret: user.mfa_secret_pending,
        mfa_secret_pending: null,
      });

    await writeAuditLog({
      eventType: AuditEventType.AUTH_MFA_SETUP,
      userId: authReq.userId,
      userRole: authReq.userRole,
      resourceType: 'auth',
      action: 'MFA_ENABLED',
      outcome: 'success',
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      requestId: (req.headers['x-request-id'] as string) ?? '',
      region: env.DEPLOYMENT_REGION,
      complianceRegime: env.COMPLIANCE_REGIME,
      details: {},
    });

    res.status(200).json({ message: 'MFA enabled successfully' });
  } catch (err) {
    log.error({ err }, 'MFA verify error');
    res.status(500).json({ error: 'MFA verification failed' });
  }
});

// --- Logout all sessions ---

authRouter.post('/logout-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await revokeAllUserSessions(authReq.userId);

    res.status(200).json({ message: 'All sessions revoked' });
  } catch (err) {
    log.error({ err }, 'Logout all error');
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});
