import { describe, it, expect, beforeEach } from 'vitest';
import {
  alertFatigueManager,
  AlertPriority,
  AlertCategory,
  AlertResponse,
  SuppressionReason,
  type ClinicalAlert,
} from '../alertFatigueManager';

function createAlert(overrides?: Partial<ClinicalAlert>): ClinicalAlert {
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: AlertCategory.MEDICATION,
    priority: AlertPriority.MEDIUM,
    title: 'Test Alert',
    message: 'Test alert message',
    patientId: 'pt-001',
    source: 'test',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('AlertFatigueManager', () => {
  beforeEach(() => {
    alertFatigueManager.resetState();
  });

  describe('alert priority classification', () => {
    it('should classify allergy alerts as CRITICAL', () => {
      const alert = createAlert({ category: AlertCategory.ALLERGY });
      const priority = alertFatigueManager.classifyPriority(alert);
      expect(priority).toBe(AlertPriority.CRITICAL);
    });

    it('should classify safety alerts as CRITICAL', () => {
      const alert = createAlert({ category: AlertCategory.SAFETY });
      const priority = alertFatigueManager.classifyPriority(alert);
      expect(priority).toBe(AlertPriority.CRITICAL);
    });

    it('should classify vital sign alerts as HIGH', () => {
      const alert = createAlert({ category: AlertCategory.VITAL_SIGN });
      const priority = alertFatigueManager.classifyPriority(alert);
      expect(priority).toBe(AlertPriority.HIGH);
    });

    it('should classify critical vital sign alerts as CRITICAL', () => {
      const alert = createAlert({ category: AlertCategory.VITAL_SIGN, title: 'CRITICAL: HR > 150' });
      const priority = alertFatigueManager.classifyPriority(alert);
      expect(priority).toBe(AlertPriority.CRITICAL);
    });

    it('should classify interaction alerts by severity', () => {
      const contraindicated = createAlert({
        category: AlertCategory.INTERACTION,
        metadata: { severity: 'contraindicated' },
      });
      expect(alertFatigueManager.classifyPriority(contraindicated)).toBe(AlertPriority.CRITICAL);

      const severe = createAlert({
        category: AlertCategory.INTERACTION,
        metadata: { severity: 'severe' },
      });
      expect(alertFatigueManager.classifyPriority(severe)).toBe(AlertPriority.HIGH);
    });

    it('should classify administrative alerts as LOW', () => {
      const alert = createAlert({ category: AlertCategory.ADMINISTRATIVE });
      expect(alertFatigueManager.classifyPriority(alert)).toBe(AlertPriority.LOW);
    });
  });

  describe('alert suppression', () => {
    it('should never suppress CRITICAL alerts', () => {
      const alert = createAlert({ priority: AlertPriority.CRITICAL });
      const result = alertFatigueManager.shouldSuppress(alert);
      expect(result.suppress).toBe(false);
    });

    it('should suppress duplicate alerts within 1 hour', () => {
      const alert1 = createAlert({ patientId: 'pt-dup', title: 'Duplicate alert test' });
      alertFatigueManager.processAlert(alert1);

      const alert2 = createAlert({ patientId: 'pt-dup', title: 'Duplicate alert test', category: alert1.category });
      const record = alertFatigueManager.processAlert(alert2);

      expect(record.suppressed).toBe(true);
      expect(record.suppressionReason).toBe(SuppressionReason.DUPLICATE);
    });

    it('should suppress low-priority alerts during nighttime', () => {
      // Create an alert with nighttime timestamp
      const nightHour = 23;
      const nightDate = new Date();
      nightDate.setHours(nightHour, 0, 0, 0);

      const alert = createAlert({
        category: AlertCategory.ADMINISTRATIVE,
        priority: AlertPriority.LOW,
        createdAt: nightDate.toISOString(),
      });

      const result = alertFatigueManager.shouldSuppress(alert);
      expect(result.suppress).toBe(true);
      expect(result.reason).toBe(SuppressionReason.TIME_SUPPRESSED);
    });

    it('should apply custom suppression rules', () => {
      alertFatigueManager.addSuppressionRule({
        id: 'rule-test-01',
        category: AlertCategory.DUPLICATE_ORDER,
        reason: SuppressionReason.LOW_VALUE,
        active: true,
        condition: 'Low value duplicate',
      });

      const alert = createAlert({
        category: AlertCategory.DUPLICATE_ORDER,
        priority: AlertPriority.LOW,
      });

      const result = alertFatigueManager.shouldSuppress(alert);
      expect(result.suppress).toBe(true);
      expect(result.reason).toBe(SuppressionReason.LOW_VALUE);
    });

    it('should allow removing suppression rules', () => {
      alertFatigueManager.addSuppressionRule({
        id: 'rule-remove-01',
        category: AlertCategory.CLINICAL_DECISION,
        reason: SuppressionReason.REDUNDANT,
        active: true,
        condition: 'Redundant',
      });

      const removed = alertFatigueManager.removeSuppressionRule('rule-remove-01');
      expect(removed).toBe(true);

      // Should no longer suppress
      const alert = createAlert({ category: AlertCategory.CLINICAL_DECISION, priority: AlertPriority.MEDIUM });
      const result = alertFatigueManager.shouldSuppress(alert);
      expect(result.reason).not.toBe(SuppressionReason.REDUNDANT);
    });
  });

  describe('response tracking', () => {
    it('should record alert response with timing', () => {
      const alert = createAlert({ id: 'alert-response-001' });
      alertFatigueManager.processAlert(alert);

      const record = alertFatigueManager.recordResponse(
        'alert-response-001', AlertResponse.ACTED_UPON, 'nurse-001', undefined, 'Adjusted dose'
      );

      expect(record).not.toBeNull();
      expect(record!.response).toBe(AlertResponse.ACTED_UPON);
      expect(record!.respondedBy).toBe('nurse-001');
      expect(record!.actionTaken).toBe('Adjusted dose');
      expect(record!.responseTimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should record override with reason', () => {
      const alert = createAlert({ id: 'alert-override-001' });
      alertFatigueManager.processAlert(alert);

      const record = alertFatigueManager.recordResponse(
        'alert-override-001', AlertResponse.OVERRIDDEN, 'doc-001', 'Clinically appropriate'
      );

      expect(record!.response).toBe(AlertResponse.OVERRIDDEN);
      expect(record!.overrideReason).toBe('Clinically appropriate');
    });
  });

  describe('override rate monitoring', () => {
    it('should calculate override rates by category', () => {
      // Create and respond to multiple alerts
      for (let i = 0; i < 10; i++) {
        const alert = createAlert({
          id: `alert-or-${i}`,
          category: AlertCategory.DOSE_RANGE,
        });
        alertFatigueManager.processAlert(alert);
        const response = i < 8 ? AlertResponse.OVERRIDDEN : AlertResponse.ACTED_UPON;
        alertFatigueManager.recordResponse(`alert-or-${i}`, response, 'doc-001');
      }

      const reports = alertFatigueManager.calculateOverrideRates();
      const doseRangeReport = reports.find(r => r.category === AlertCategory.DOSE_RANGE);

      expect(doseRangeReport).toBeDefined();
      expect(doseRangeReport!.overrideRate).toBe(0.8); // 8/10
      expect(doseRangeReport!.totalAlerts).toBe(10);
      expect(doseRangeReport!.recommendation).toContain('75%');
    });
  });

  describe('alert-to-action ratio', () => {
    it('should calculate overall and per-category ratios', () => {
      // Create 20 alerts with unique titles to avoid duplicate suppression, 4 acted upon
      for (let i = 0; i < 20; i++) {
        const alert = createAlert({
          id: `alert-ratio-${i}`,
          title: `Unique Alert ${i}`,
          patientId: `pt-ratio-${i}`,
          category: i < 10 ? AlertCategory.MEDICATION : AlertCategory.LAB_RESULT,
        });
        alertFatigueManager.processAlert(alert);
        const response = i < 4 ? AlertResponse.ACTED_UPON : AlertResponse.OVERRIDDEN;
        alertFatigueManager.recordResponse(`alert-ratio-${i}`, response, 'doc-001');
      }

      const ratio = alertFatigueManager.calculateAlertToActionRatio();
      expect(ratio.totalAlerts).toBe(20);
      expect(ratio.totalActions).toBe(4);
      expect(ratio.ratio).toBe(0.2);
      expect(ratio.interpretation).toContain('Low');
    });
  });

  describe('smart alert bundling', () => {
    it('should bundle related alerts for same patient and category', () => {
      const alerts: ClinicalAlert[] = [
        createAlert({ id: 'b1', patientId: 'pt-bundle', category: AlertCategory.LAB_RESULT, title: 'High K' }),
        createAlert({ id: 'b2', patientId: 'pt-bundle', category: AlertCategory.LAB_RESULT, title: 'Low Na' }),
        createAlert({ id: 'b3', patientId: 'pt-bundle', category: AlertCategory.LAB_RESULT, title: 'High Cr' }),
        createAlert({ id: 'b4', patientId: 'pt-other', category: AlertCategory.MEDICATION, title: 'Dose check' }),
      ];

      const bundles = alertFatigueManager.bundleAlerts(alerts);
      expect(bundles.length).toBeGreaterThanOrEqual(1);

      const labBundle = bundles.find(b => b.patientId === 'pt-bundle');
      expect(labBundle).toBeDefined();
      expect(labBundle!.alerts).toHaveLength(3);
    });

    it('should use highest priority in bundle as bundle priority', () => {
      const alerts: ClinicalAlert[] = [
        createAlert({ patientId: 'pt-bp', category: AlertCategory.LAB_RESULT, priority: AlertPriority.LOW }),
        createAlert({ patientId: 'pt-bp', category: AlertCategory.LAB_RESULT, priority: AlertPriority.CRITICAL }),
        createAlert({ patientId: 'pt-bp', category: AlertCategory.LAB_RESULT, priority: AlertPriority.MEDIUM }),
      ];

      const bundles = alertFatigueManager.bundleAlerts(alerts);
      expect(bundles[0].bundlePriority).toBe(AlertPriority.CRITICAL);
    });
  });

  describe('alert effectiveness scoring', () => {
    it('should calculate effectiveness scores per alert type', () => {
      for (let i = 0; i < 15; i++) {
        const alert = createAlert({
          id: `eff-${i}`,
          category: AlertCategory.MEDICATION,
          priority: AlertPriority.HIGH,
        });
        alertFatigueManager.processAlert(alert);
        const response = i < 5 ? AlertResponse.ACTED_UPON : i < 10 ? AlertResponse.OVERRIDDEN : AlertResponse.IGNORED;
        alertFatigueManager.recordResponse(`eff-${i}`, response, 'doc-001');
      }

      const effectiveness = alertFatigueManager.calculateAlertEffectiveness();
      expect(effectiveness.length).toBeGreaterThan(0);

      const medEffect = effectiveness.find(e => e.category === AlertCategory.MEDICATION);
      expect(medEffect).toBeDefined();
      expect(medEffect!.ppv).toBeCloseTo(5 / 15, 1);
      expect(medEffect!.effectivenessScore).toBeGreaterThan(0);
      expect(medEffect!.recommendation).toBeTruthy();
    });
  });

  describe('self-learning', () => {
    it('should learn to suppress high-override alerts', () => {
      // Create 30 alerts with unique titles/patients and 90%+ override rate
      // Use CLINICAL_DECISION category which classifies as MEDIUM priority
      // and MEDIUM priority alerts can be suppressed by learned rules
      for (let i = 0; i < 30; i++) {
        const alert = createAlert({
          id: `learn-${i}`,
          title: `Learn Alert ${i}`,
          patientId: `pt-learn-${i}`,
          category: AlertCategory.CLINICAL_DECISION,
          priority: AlertPriority.MEDIUM,
        });
        alertFatigueManager.processAlert(alert);
        const response = i < 27 ? AlertResponse.OVERRIDDEN : AlertResponse.ACTED_UPON;
        alertFatigueManager.recordResponse(`learn-${i}`, response, 'doc-001');
      }

      alertFatigueManager.updateLearnedSuppressions();

      // New alert of same type/priority should be suppressed by learned rule
      // processAlert will classify CLINICAL_DECISION as MEDIUM, matching the learned key
      const newAlert = createAlert({
        category: AlertCategory.CLINICAL_DECISION,
        priority: AlertPriority.MEDIUM,
        patientId: 'pt-learn-new',
        title: 'New Learn Alert',
      });
      const record = alertFatigueManager.processAlert(newAlert);
      expect(record.suppressed).toBe(true);
      expect(record.suppressionReason).toBe(SuppressionReason.HIGH_OVERRIDE_RATE);
    });

    it('should generate learning insights from alert data', () => {
      for (let i = 0; i < 15; i++) {
        const alert = createAlert({
          id: `insight-${i}`,
          category: AlertCategory.DOSE_RANGE,
          priority: AlertPriority.HIGH,
        });
        alertFatigueManager.processAlert(alert);
        alertFatigueManager.recordResponse(`insight-${i}`, AlertResponse.OVERRIDDEN, 'doc-001');
      }

      const insights = alertFatigueManager.generateLearningInsights();
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].insight).toContain('override rate');
      expect(insights[0].confidence).toBeGreaterThan(0);
    });

    it('should identify high-value actionable alerts', () => {
      for (let i = 0; i < 10; i++) {
        const alert = createAlert({
          id: `action-${i}`,
          category: AlertCategory.ALLERGY,
          priority: AlertPriority.CRITICAL,
        });
        alertFatigueManager.processAlert(alert);
        alertFatigueManager.recordResponse(`action-${i}`, AlertResponse.ACTED_UPON, 'doc-001');
      }

      const insights = alertFatigueManager.generateLearningInsights();
      const allergyInsight = insights.find(i => i.alertType === AlertCategory.ALLERGY);
      expect(allergyInsight).toBeDefined();
      expect(allergyInsight!.insight).toContain('high action rate');
    });
  });

  describe('time-of-day configuration', () => {
    it('should allow customizing night hours', () => {
      alertFatigueManager.setTimeConfig({ nightStartHour: 20, nightEndHour: 7 });

      const nightDate = new Date();
      nightDate.setHours(21, 0, 0, 0);

      const alert = createAlert({
        category: AlertCategory.ADMINISTRATIVE,
        priority: AlertPriority.INFORMATIONAL,
        createdAt: nightDate.toISOString(),
      });

      const result = alertFatigueManager.shouldSuppress(alert);
      expect(result.suppress).toBe(true);
    });
  });
});
