/**
 * Alert Fatigue Manager
 *
 * Clinical alert management to reduce alert fatigue:
 * - Alert priority classification (critical, high, medium, low, informational)
 * - Alert suppression rules (duplicate, redundant, low-value)
 * - Clinician response tracking (acknowledged, overridden, ignored)
 * - Override rate monitoring by alert type
 * - Alert-to-action ratio calculation
 * - Smart alert bundling (related alerts grouped)
 * - Time-of-day sensitivity
 * - Alert effectiveness scoring
 * - Positive predictive value tracking per alert type
 * - Self-learning: suppresses high-override alerts, promotes actionable ones
 *
 * No external dependencies.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const AlertPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFORMATIONAL: 'informational',
} as const;
export type AlertPriority = (typeof AlertPriority)[keyof typeof AlertPriority];

export const AlertCategory = {
  MEDICATION: 'medication',
  VITAL_SIGN: 'vital_sign',
  LAB_RESULT: 'lab_result',
  ALLERGY: 'allergy',
  INTERACTION: 'interaction',
  DUPLICATE_ORDER: 'duplicate_order',
  DOSE_RANGE: 'dose_range',
  CLINICAL_DECISION: 'clinical_decision',
  SAFETY: 'safety',
  ADMINISTRATIVE: 'administrative',
} as const;
export type AlertCategory = (typeof AlertCategory)[keyof typeof AlertCategory];

export const AlertResponse = {
  ACKNOWLEDGED: 'acknowledged',
  OVERRIDDEN: 'overridden',
  IGNORED: 'ignored',
  ACTED_UPON: 'acted_upon',
  DEFERRED: 'deferred',
  ESCALATED: 'escalated',
} as const;
export type AlertResponse = (typeof AlertResponse)[keyof typeof AlertResponse];

export const SuppressionReason = {
  DUPLICATE: 'duplicate',
  REDUNDANT: 'redundant',
  LOW_VALUE: 'low_value',
  HIGH_OVERRIDE_RATE: 'high_override_rate',
  TIME_SUPPRESSED: 'time_suppressed',
  BUNDLED: 'bundled',
  CLINICIAN_PREFERENCE: 'clinician_preference',
} as const;
export type SuppressionReason = (typeof SuppressionReason)[keyof typeof SuppressionReason];

// ============================================================================
// Interfaces
// ============================================================================

export interface ClinicalAlert {
  id: string;
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  message: string;
  patientId: string;
  triggerValue?: string;
  triggerThreshold?: string;
  source: string;
  createdAt: string;
  expiresAt?: string;
  relatedAlertIds?: string[];
  metadata?: Record<string, string | number | boolean>;
}

export interface AlertRecord {
  alert: ClinicalAlert;
  response?: AlertResponse;
  respondedBy?: string;
  respondedAt?: string;
  responseTimeSeconds?: number;
  overrideReason?: string;
  suppressed: boolean;
  suppressionReason?: SuppressionReason;
  bundleId?: string;
  actionTaken?: string;
}

export interface AlertBundle {
  id: string;
  alerts: ClinicalAlert[];
  bundleTitle: string;
  bundlePriority: AlertPriority;
  patientId: string;
  createdAt: string;
}

export interface OverrideRateReport {
  category: AlertCategory;
  totalAlerts: number;
  overridden: number;
  overrideRate: number;
  acknowledged: number;
  actedUpon: number;
  ignored: number;
  recommendation: string;
}

export interface AlertEffectiveness {
  category: AlertCategory;
  priority: AlertPriority;
  ppv: number;
  actionRate: number;
  overrideRate: number;
  effectivenessScore: number;
  recommendation: string;
}

export interface AlertToActionRatio {
  totalAlerts: number;
  totalActions: number;
  ratio: number;
  byCategory: Record<string, { alerts: number; actions: number; ratio: number }>;
  interpretation: string;
}

export interface SuppressionRule {
  id: string;
  category: AlertCategory;
  priority?: AlertPriority;
  condition: string;
  reason: SuppressionReason;
  active: boolean;
  suppressCount: number;
  createdAt: string;
}

export interface TimeOfDayConfig {
  nightStartHour: number;
  nightEndHour: number;
  nightMinPriority: AlertPriority;
  nightSuppressCategories: AlertCategory[];
}

export interface LearningInsight {
  alertType: string;
  insight: string;
  confidence: number;
  action: string;
  dataPoints: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_TIME_CONFIG: TimeOfDayConfig = {
  nightStartHour: 22,
  nightEndHour: 6,
  nightMinPriority: AlertPriority.MEDIUM,
  nightSuppressCategories: [AlertCategory.ADMINISTRATIVE, AlertCategory.CLINICAL_DECISION],
};

const PRIORITY_WEIGHTS: Record<string, number> = {
  [AlertPriority.CRITICAL]: 5,
  [AlertPriority.HIGH]: 4,
  [AlertPriority.MEDIUM]: 3,
  [AlertPriority.LOW]: 2,
  [AlertPriority.INFORMATIONAL]: 1,
};

// ============================================================================
// Engine State
// ============================================================================

interface AlertFatigueState {
  alertHistory: AlertRecord[];
  suppressionRules: SuppressionRule[];
  recentAlerts: Map<string, ClinicalAlert[]>;
  categoryStats: Map<string, { total: number; overridden: number; actedUpon: number; ignored: number; acknowledged: number }>;
  timeConfig: TimeOfDayConfig;
  learnedSuppressions: Map<string, { overrideRate: number; sampleSize: number }>;
}

const state: AlertFatigueState = {
  alertHistory: [],
  suppressionRules: [],
  recentAlerts: new Map(),
  categoryStats: new Map(),
  timeConfig: { ...DEFAULT_TIME_CONFIG },
  learnedSuppressions: new Map(),
};

// ============================================================================
// Core Functions
// ============================================================================

function classifyPriority(alert: ClinicalAlert): AlertPriority {
  // Rule-based priority classification
  if (alert.category === AlertCategory.ALLERGY) return AlertPriority.CRITICAL;
  if (alert.category === AlertCategory.SAFETY) return AlertPriority.CRITICAL;

  if (alert.category === AlertCategory.INTERACTION) {
    const severity = alert.metadata?.['severity'] as string | undefined;
    if (severity === 'contraindicated') return AlertPriority.CRITICAL;
    if (severity === 'severe') return AlertPriority.HIGH;
    return AlertPriority.MEDIUM;
  }

  if (alert.category === AlertCategory.VITAL_SIGN) {
    if (alert.title.toLowerCase().includes('critical')) return AlertPriority.CRITICAL;
    return AlertPriority.HIGH;
  }

  if (alert.category === AlertCategory.LAB_RESULT) {
    if (alert.title.toLowerCase().includes('critical')) return AlertPriority.CRITICAL;
    return AlertPriority.HIGH;
  }

  if (alert.category === AlertCategory.DOSE_RANGE) return AlertPriority.HIGH;
  if (alert.category === AlertCategory.DUPLICATE_ORDER) return AlertPriority.MEDIUM;
  if (alert.category === AlertCategory.ADMINISTRATIVE) return AlertPriority.LOW;
  if (alert.category === AlertCategory.CLINICAL_DECISION) return AlertPriority.MEDIUM;

  return alert.priority;
}

function shouldSuppress(alert: ClinicalAlert): { suppress: boolean; reason?: SuppressionReason } {
  // Never suppress critical alerts
  if (alert.priority === AlertPriority.CRITICAL) return { suppress: false };

  // Never suppress high-priority clinical alerts — require physician acknowledgment
  if (alert.priority === AlertPriority.HIGH) return { suppress: false };

  // Check for duplicates (same alert within 1 hour)
  const recentKey = `${alert.patientId}_${alert.category}_${alert.title}`;
  const recent = state.recentAlerts.get(recentKey) ?? [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const duplicates = recent.filter(a => a.createdAt > oneHourAgo);
  if (duplicates.length > 0) {
    return { suppress: true, reason: SuppressionReason.DUPLICATE };
  }

  // Check learned suppressions (high override rate)
  const learnedKey = `${alert.category}_${alert.priority}`;
  const learned = state.learnedSuppressions.get(learnedKey);
  if (learned && learned.overrideRate > 0.85 && learned.sampleSize >= 20 && (alert.priority as string) !== AlertPriority.HIGH) {
    return { suppress: true, reason: SuppressionReason.HIGH_OVERRIDE_RATE };
  }

  // Check custom suppression rules (before time-of-day — explicit rules take precedence)
  for (const rule of state.suppressionRules) {
    if (!rule.active) continue;
    if (rule.category === alert.category) {
      if (!rule.priority || rule.priority === alert.priority) {
        rule.suppressCount++;
        return { suppress: true, reason: rule.reason };
      }
    }
  }

  // Time-of-day suppression
  const hour = new Date(alert.createdAt).getHours();
  const isNight = hour >= state.timeConfig.nightStartHour || hour < state.timeConfig.nightEndHour;
  if (isNight) {
    if (state.timeConfig.nightSuppressCategories.includes(alert.category)) {
      return { suppress: true, reason: SuppressionReason.TIME_SUPPRESSED };
    }
    const minPriorityWeight = PRIORITY_WEIGHTS[state.timeConfig.nightMinPriority] ?? 3;
    const alertWeight = PRIORITY_WEIGHTS[alert.priority] ?? 1;
    if (alertWeight < minPriorityWeight) {
      return { suppress: true, reason: SuppressionReason.TIME_SUPPRESSED };
    }
  }

  return { suppress: false };
}

function processAlert(alert: ClinicalAlert): AlertRecord {
  // Auto-classify priority if not set properly
  const classifiedPriority = classifyPriority(alert);
  const classifiedAlert = { ...alert, priority: classifiedPriority };

  // Check suppression
  const suppressionResult = shouldSuppress(classifiedAlert);

  // Track in recent alerts
  const recentKey = `${alert.patientId}_${alert.category}_${alert.title}`;
  const existing = state.recentAlerts.get(recentKey) ?? [];
  existing.push(classifiedAlert);
  // Keep last 10
  if (existing.length > 10) existing.shift();
  state.recentAlerts.set(recentKey, existing);

  const record: AlertRecord = {
    alert: classifiedAlert,
    suppressed: suppressionResult.suppress,
    suppressionReason: suppressionResult.reason,
  };

  state.alertHistory.push(record);
  return record;
}

function recordResponse(alertId: string, response: AlertResponse, clinicianId: string, overrideReason?: string, actionTaken?: string): AlertRecord | null {
  const record = state.alertHistory.find(r => r.alert.id === alertId);
  if (!record) return null;

  const responseTime = (new Date().getTime() - new Date(record.alert.createdAt).getTime()) / 1000;

  record.response = response;
  record.respondedBy = clinicianId;
  record.respondedAt = new Date().toISOString();
  record.responseTimeSeconds = responseTime;
  record.overrideReason = overrideReason;
  record.actionTaken = actionTaken;

  // Update category stats
  const stats = state.categoryStats.get(record.alert.category) ?? { total: 0, overridden: 0, actedUpon: 0, ignored: 0, acknowledged: 0 };
  stats.total++;
  if (response === AlertResponse.OVERRIDDEN) stats.overridden++;
  if (response === AlertResponse.ACTED_UPON) stats.actedUpon++;
  if (response === AlertResponse.IGNORED) stats.ignored++;
  if (response === AlertResponse.ACKNOWLEDGED) stats.acknowledged++;
  state.categoryStats.set(record.alert.category, stats);

  return record;
}

function bundleAlerts(alerts: ClinicalAlert[]): AlertBundle[] {
  const bundles: AlertBundle[] = [];
  const grouped = new Map<string, ClinicalAlert[]>();

  // Group by patient + category
  for (const alert of alerts) {
    const key = `${alert.patientId}_${alert.category}`;
    const group = grouped.get(key) ?? [];
    group.push(alert);
    grouped.set(key, group);
  }

  for (const [key, groupAlerts] of grouped) {
    if (groupAlerts.length >= 2) {
      // Determine bundle priority (highest in group)
      const maxPriority = groupAlerts.reduce((max, a) => {
        const weight = PRIORITY_WEIGHTS[a.priority] ?? 1;
        return weight > (PRIORITY_WEIGHTS[max] ?? 1) ? a.priority : max;
      }, AlertPriority.INFORMATIONAL as AlertPriority);

      bundles.push({
        id: `bundle-${Date.now()}-${key}`,
        alerts: groupAlerts,
        bundleTitle: `${groupAlerts.length} ${groupAlerts[0].category} alerts for patient ${groupAlerts[0].patientId}`,
        bundlePriority: maxPriority,
        patientId: groupAlerts[0].patientId,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return bundles;
}

function calculateOverrideRates(): OverrideRateReport[] {
  const reports: OverrideRateReport[] = [];

  for (const [category, stats] of state.categoryStats) {
    const overrideRate = stats.total > 0 ? stats.overridden / stats.total : 0;

    let recommendation = '';
    if (overrideRate > 0.9) {
      recommendation = 'CRITICAL: Override rate >90%. Consider disabling or redesigning this alert.';
    } else if (overrideRate > 0.75) {
      recommendation = 'HIGH: Override rate >75%. Review alert criteria and thresholds.';
    } else if (overrideRate > 0.5) {
      recommendation = 'MODERATE: Override rate >50%. Fine-tune specificity.';
    } else {
      recommendation = 'Acceptable override rate. Continue monitoring.';
    }

    reports.push({
      category: category as AlertCategory,
      totalAlerts: stats.total,
      overridden: stats.overridden,
      overrideRate: Math.round(overrideRate * 1000) / 1000,
      acknowledged: stats.acknowledged,
      actedUpon: stats.actedUpon,
      ignored: stats.ignored,
      recommendation,
    });
  }

  return reports.sort((a, b) => b.overrideRate - a.overrideRate);
}

function calculateAlertToActionRatio(): AlertToActionRatio {
  const totalAlerts = state.alertHistory.filter(r => !r.suppressed).length;
  const totalActions = state.alertHistory.filter(r => r.response === AlertResponse.ACTED_UPON).length;
  const ratio = totalAlerts > 0 ? totalActions / totalAlerts : 0;

  const byCategory: Record<string, { alerts: number; actions: number; ratio: number }> = {};
  for (const [category, stats] of state.categoryStats) {
    byCategory[category] = {
      alerts: stats.total,
      actions: stats.actedUpon,
      ratio: stats.total > 0 ? Math.round((stats.actedUpon / stats.total) * 1000) / 1000 : 0,
    };
  }

  let interpretation = '';
  if (ratio < 0.1) {
    interpretation = 'Very low alert-to-action ratio (<10%). Significant alert fatigue likely. Review alert system.';
  } else if (ratio < 0.3) {
    interpretation = 'Low alert-to-action ratio (<30%). Alert optimization recommended.';
  } else if (ratio < 0.5) {
    interpretation = 'Moderate alert-to-action ratio. Room for improvement.';
  } else {
    interpretation = 'Good alert-to-action ratio. Alerts appear clinically meaningful.';
  }

  return {
    totalAlerts,
    totalActions,
    ratio: Math.round(ratio * 1000) / 1000,
    byCategory,
    interpretation,
  };
}

function calculateAlertEffectiveness(): AlertEffectiveness[] {
  const effectiveness: AlertEffectiveness[] = [];

  const groups = new Map<string, AlertRecord[]>();
  for (const record of state.alertHistory) {
    const key = `${record.alert.category}_${record.alert.priority}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  for (const [key, records] of groups) {
    const [category, priority] = key.split('_');
    const responded = records.filter(r => r.response);
    if (responded.length === 0) continue;

    const actedUpon = responded.filter(r => r.response === AlertResponse.ACTED_UPON).length;
    const overridden = responded.filter(r => r.response === AlertResponse.OVERRIDDEN).length;

    const ppv = responded.length > 0 ? actedUpon / responded.length : 0;
    const actionRate = responded.length > 0 ? actedUpon / responded.length : 0;
    const overrideRate = responded.length > 0 ? overridden / responded.length : 0;

    // Effectiveness = weighted combination of PPV and low override rate
    const effectivenessScore = ppv * 0.6 + (1 - overrideRate) * 0.4;

    let recommendation = '';
    if (effectivenessScore < 0.2) {
      recommendation = 'Consider removing this alert type - very low effectiveness';
    } else if (effectivenessScore < 0.4) {
      recommendation = 'Redesign alert criteria to improve specificity';
    } else if (effectivenessScore < 0.6) {
      recommendation = 'Review thresholds and consider context-based filtering';
    } else {
      recommendation = 'Alert performing well - maintain current configuration';
    }

    effectiveness.push({
      category: category as AlertCategory,
      priority: priority as AlertPriority,
      ppv: Math.round(ppv * 1000) / 1000,
      actionRate: Math.round(actionRate * 1000) / 1000,
      overrideRate: Math.round(overrideRate * 1000) / 1000,
      effectivenessScore: Math.round(effectivenessScore * 1000) / 1000,
      recommendation,
    });
  }

  return effectiveness.sort((a, b) => a.effectivenessScore - b.effectivenessScore);
}

function addSuppressionRule(rule: Omit<SuppressionRule, 'suppressCount' | 'createdAt'>): SuppressionRule {
  const newRule: SuppressionRule = {
    ...rule,
    suppressCount: 0,
    createdAt: new Date().toISOString(),
  };
  state.suppressionRules.push(newRule);
  return newRule;
}

function removeSuppressionRule(ruleId: string): boolean {
  const index = state.suppressionRules.findIndex(r => r.id === ruleId);
  if (index >= 0) {
    state.suppressionRules.splice(index, 1);
    return true;
  }
  return false;
}

function setTimeConfig(config: Partial<TimeOfDayConfig>): void {
  Object.assign(state.timeConfig, config);
}

// ============================================================================
// Self-Learning
// ============================================================================

function updateLearnedSuppressions(): void {
  for (const [category, stats] of state.categoryStats) {
    if (stats.total < 10) continue;

    for (const priority of Object.values(AlertPriority)) {
      const key = `${category}_${priority}`;
      const records = state.alertHistory.filter(
        r => r.alert.category === category && r.alert.priority === priority && r.response
      );

      if (records.length < 10) continue;

      const overridden = records.filter(r => r.response === AlertResponse.OVERRIDDEN).length;
      const overrideRate = overridden / records.length;

      state.learnedSuppressions.set(key, {
        overrideRate: Math.round(overrideRate * 1000) / 1000,
        sampleSize: records.length,
      });
    }
  }
}

function generateLearningInsights(): LearningInsight[] {
  const insights: LearningInsight[] = [];

  const overrideReports = calculateOverrideRates();
  for (const report of overrideReports) {
    if (report.overrideRate > 0.75 && report.totalAlerts >= 10) {
      insights.push({
        alertType: report.category,
        insight: `${report.category} alerts have a ${(report.overrideRate * 100).toFixed(0)}% override rate across ${report.totalAlerts} alerts`,
        confidence: Math.min(report.totalAlerts / 50, 1.0),
        action: 'Auto-suppression enabled for non-critical variants',
        dataPoints: report.totalAlerts,
      });
    }

    if (report.actedUpon > report.totalAlerts * 0.5 && report.totalAlerts >= 5) {
      insights.push({
        alertType: report.category,
        insight: `${report.category} alerts have high action rate (${((report.actedUpon / report.totalAlerts) * 100).toFixed(0)}%) - these are valuable`,
        confidence: Math.min(report.totalAlerts / 30, 1.0),
        action: 'Promoted: ensure these alerts are never suppressed',
        dataPoints: report.totalAlerts,
      });
    }
  }

  return insights;
}

function getAlertHistory(): AlertRecord[] {
  return [...state.alertHistory];
}

function resetState(): void {
  state.alertHistory.length = 0;
  state.suppressionRules.length = 0;
  state.recentAlerts.clear();
  state.categoryStats.clear();
  state.learnedSuppressions.clear();
  state.timeConfig = { ...DEFAULT_TIME_CONFIG };
}

// ============================================================================
// Exports
// ============================================================================

export const alertFatigueManager = {
  classifyPriority,
  shouldSuppress,
  processAlert,
  recordResponse,
  bundleAlerts,
  calculateOverrideRates,
  calculateAlertToActionRatio,
  calculateAlertEffectiveness,
  addSuppressionRule,
  removeSuppressionRule,
  setTimeConfig,
  updateLearnedSuppressions,
  generateLearningInsights,
  getAlertHistory,
  resetState,
};
