import { Router, Request, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authentication.js';
import { processErasureRequest, processPortabilityRequest } from '../middleware/compliance.js';
import { createLogger } from '../utils/logger.js';
import { env, COMPLIANCE_CONFIG } from '../config/environment.js';

const log = createLogger('compliance');

export const complianceRouter = Router();

complianceRouter.use(authenticateToken);

// --- Get Active Compliance Regime ---
complianceRouter.get('/regime', (_req: Request, res: Response) => {
  res.json({
    data: {
      regime: env.COMPLIANCE_REGIME,
      region: env.DEPLOYMENT_REGION,
      config: COMPLIANCE_CONFIG[env.COMPLIANCE_REGIME],
    },
  });
});

// --- Right to Erasure (DPDPA / UK GDPR) ---
complianceRouter.post('/erasure-request', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (authReq.userRole !== 'patient') {
      res.status(403).json({ error: 'Only patients can request data erasure' });
      return;
    }

    const result = await processErasureRequest(
      authReq.userId,
      req.body?.reason ?? 'No reason provided'
    );

    res.json({ data: result });
  } catch (err) {
    log.error({ err }, 'Erasure request failed');
    res.status(500).json({ error: 'Failed to process erasure request' });
  }
});

// --- Right to Portability (DPDPA / UK GDPR) ---
complianceRouter.post('/portability-request', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (authReq.userRole !== 'patient') {
      res.status(403).json({ error: 'Only patients can request data portability' });
      return;
    }

    const result = await processPortabilityRequest(authReq.userId);

    res.json({
      data: {
        ...result,
        message: 'Your data export is being prepared in FHIR R4 JSON format. You will be notified when it is ready.',
      },
    });
  } catch (err) {
    log.error({ err }, 'Portability request failed');
    res.status(500).json({ error: 'Failed to process portability request' });
  }
});

// --- Consent Management ---
complianceRouter.get('/consents', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { getReadDb } = await import('../config/database.js');
    const db = getReadDb();

    const consents = await db('patient_consents')
      .where({ patient_id: authReq.userId })
      .orderBy('granted_at', 'desc');

    res.json({ data: consents });
  } catch (err) {
    log.error({ err }, 'Error fetching consents');
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

complianceRouter.post('/consents/:consentType/grant', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { consentType } = req.params;
    const { getWriteDb } = await import('../config/database.js');
    const db = getWriteDb();

    await db('patient_consents').insert({
      patient_id: authReq.userId,
      consent_type: consentType,
      is_active: true,
      granted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      purpose: req.body?.purpose ?? 'General data processing',
      data_categories: JSON.stringify(req.body?.dataCategories ?? ['health_records']),
      version: '1.0',
    });

    res.json({ message: 'Consent granted successfully' });
  } catch (err) {
    log.error({ err }, 'Error granting consent');
    res.status(500).json({ error: 'Failed to grant consent' });
  }
});

complianceRouter.post('/consents/:consentType/withdraw', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { consentType } = req.params;
    const { getWriteDb } = await import('../config/database.js');
    const db = getWriteDb();

    await db('patient_consents')
      .where({
        patient_id: authReq.userId,
        consent_type: consentType,
        is_active: true,
      })
      .update({
        is_active: false,
        withdrawn_at: new Date().toISOString(),
      });

    res.json({ message: 'Consent withdrawn successfully' });
  } catch (err) {
    log.error({ err }, 'Error withdrawing consent');
    res.status(500).json({ error: 'Failed to withdraw consent' });
  }
});
