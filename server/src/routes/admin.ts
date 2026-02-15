import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authentication.js';
import { getReadDb } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('admin');

export const adminRouter = Router();

adminRouter.use(authenticateToken);
adminRouter.use(requireRole('admin'));

// --- User Management ---
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 200);
    const role = req.query['role'] as string;

    const db = getReadDb();
    let query = db('users')
      .select('id', 'username', 'name', 'email', 'role', 'region',
        'is_active', 'is_locked', 'mfa_enabled', 'last_login', 'created_at');

    if (role) query = query.where({ role });

    const [users, countResult] = await Promise.all([
      query.clone().orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit),
      query.clone().count('* as total').first(),
    ]);

    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total: Number((countResult as { total: string })?.total ?? 0),
      },
    });
  } catch (err) {
    log.error({ err }, 'Error listing users');
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// --- System Stats ---
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const db = getReadDb();

    const [userStats, patientStats, missionStats, carePlanStats] = await Promise.all([
      db('users').select('role').count('* as count').groupBy('role'),
      db('patients').where({ is_active: true }).count('* as count').first(),
      db('missions').select('status').count('* as count').groupBy('status'),
      db('care_plans').where({ status: 'active' }).count('* as count').first(),
    ]);

    res.json({
      data: {
        users: userStats,
        activePatients: Number((patientStats as { count: string })?.count ?? 0),
        missions: missionStats,
        activeCarePlans: Number((carePlanStats as { count: string })?.count ?? 0),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    });
  } catch (err) {
    log.error({ err }, 'Error fetching stats');
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// --- Audit Logs ---
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 200);
    const eventType = req.query['eventType'] as string;
    const userId = req.query['userId'] as string;

    const db = getReadDb();
    let query = db('audit_logs').orderBy('timestamp', 'desc');

    if (eventType) query = query.where({ event_type: eventType });
    if (userId) query = query.where({ user_id: userId });

    const logs = await query.limit(limit).offset((page - 1) * limit);

    res.json({ data: logs });
  } catch (err) {
    log.error({ err }, 'Error fetching audit logs');
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});
