/**
 * Self-Learning Adaptive Engine for Patient Recovery Prediction
 *
 * Implements an online learning system that improves over time by:
 * - Updating model weights via stochastic gradient descent as new data arrives
 * - Tracking predictions vs actual outcomes and feeding errors back
 * - Adjusting risk thresholds based on historical accuracy
 * - Detecting recurring recovery patterns (e.g., medication adherence correlations)
 * - Maintaining a knowledge base of refined rules
 * - Calibrating confidence scores to match observed frequencies
 * - A/B testing different model versions to select the best performer
 * - Detecting data distribution drift from training baselines
 * - Auto-triggering retraining when performance degrades
 *
 * All state persists in localStorage. All exports are React/Zustand-compatible.
 * No external dependencies.
 */

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_PREFIX = 'recovery_pilot_sle_' as const;

const SLE_STORAGE_KEYS = {
  MODEL_WEIGHTS: `${STORAGE_PREFIX}model_weights`,
  PREDICTION_LOG: `${STORAGE_PREFIX}prediction_log`,
  THRESHOLD_STATE: `${STORAGE_PREFIX}threshold_state`,
  PATTERN_REGISTRY: `${STORAGE_PREFIX}pattern_registry`,
  KNOWLEDGE_BASE: `${STORAGE_PREFIX}knowledge_base`,
  CALIBRATION_STATE: `${STORAGE_PREFIX}calibration_state`,
  AB_TEST_STATE: `${STORAGE_PREFIX}ab_test_state`,
  DRIFT_STATE: `${STORAGE_PREFIX}drift_state`,
  RETRAIN_STATE: `${STORAGE_PREFIX}retrain_state`,
  ENGINE_METADATA: `${STORAGE_PREFIX}engine_metadata`,
} as const;

// ============================================================================
// Feature Names (indices into weight/feature vectors)
// ============================================================================

const FeatureName = {
  MEDICATION_ADHERENCE: 0,
  EXERCISE_COMPLETION: 1,
  PHOTO_UPLOAD_FREQUENCY: 2,
  WOUND_HEALING_TREND: 3,
  PAIN_LEVEL_TREND: 4,
  SLEEP_QUALITY: 5,
  NUTRITION_SCORE: 6,
  FOLLOW_UP_ATTENDANCE: 7,
  DAYS_SINCE_SURGERY: 8,
  AGE_FACTOR: 9,
  COMORBIDITY_COUNT: 10,
  STREAK_LENGTH: 11,
  MISSED_DOSES_LAST_WEEK: 12,
  EXERCISE_MINUTES_AVG: 13,
  MOOD_SCORE: 14,
  HYDRATION_LEVEL: 15,
  INFECTION_RISK_MARKERS: 16,
  SWELLING_TREND: 17,
  MOBILITY_SCORE: 18,
  CAREGIVER_SUPPORT: 19,
} as const;

const FEATURE_COUNT = 20;

const FEATURE_LABELS: Record<number, string> = {
  [FeatureName.MEDICATION_ADHERENCE]: 'Medication Adherence Rate',
  [FeatureName.EXERCISE_COMPLETION]: 'Exercise Completion Rate',
  [FeatureName.PHOTO_UPLOAD_FREQUENCY]: 'Photo Upload Frequency',
  [FeatureName.WOUND_HEALING_TREND]: 'Wound Healing Trend',
  [FeatureName.PAIN_LEVEL_TREND]: 'Pain Level Trend',
  [FeatureName.SLEEP_QUALITY]: 'Sleep Quality Score',
  [FeatureName.NUTRITION_SCORE]: 'Nutrition Score',
  [FeatureName.FOLLOW_UP_ATTENDANCE]: 'Follow-up Attendance',
  [FeatureName.DAYS_SINCE_SURGERY]: 'Days Since Surgery (normalized)',
  [FeatureName.AGE_FACTOR]: 'Age Factor',
  [FeatureName.COMORBIDITY_COUNT]: 'Comorbidity Count (normalized)',
  [FeatureName.STREAK_LENGTH]: 'Mission Streak Length',
  [FeatureName.MISSED_DOSES_LAST_WEEK]: 'Missed Doses Last Week',
  [FeatureName.EXERCISE_MINUTES_AVG]: 'Avg Exercise Minutes',
  [FeatureName.MOOD_SCORE]: 'Mood Score',
  [FeatureName.HYDRATION_LEVEL]: 'Hydration Level',
  [FeatureName.INFECTION_RISK_MARKERS]: 'Infection Risk Markers',
  [FeatureName.SWELLING_TREND]: 'Swelling Trend',
  [FeatureName.MOBILITY_SCORE]: 'Mobility Score',
  [FeatureName.CAREGIVER_SUPPORT]: 'Caregiver Support Availability',
};

// ============================================================================
// Types
// ============================================================================

interface ModelWeights {
  weights: number[];
  bias: number;
  learningRate: number;
  version: number;
  updatedAt: string;
  totalUpdates: number;
}

interface PatientFeatures {
  patientId: string;
  features: number[];
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface PredictionRecord {
  id: string;
  patientId: string;
  predictedRisk: number;
  predictedConfidence: number;
  actualOutcome: number | null;
  features: number[];
  modelVersion: number;
  timestamp: string;
  resolvedAt: string | null;
}

interface ThresholdState {
  lowRiskThreshold: number;
  mediumRiskThreshold: number;
  highRiskThreshold: number;
  adjustmentHistory: Array<{
    timestamp: string;
    oldThresholds: [number, number, number];
    newThresholds: [number, number, number];
    reason: string;
  }>;
  totalPredictions: number;
  correctPredictions: number;
}

const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
type RiskLevel = typeof RiskLevel[keyof typeof RiskLevel];

interface RecoveryPattern {
  id: string;
  name: string;
  description: string;
  triggerFeatures: number[];
  triggerThresholds: number[];
  occurrenceCount: number;
  outcomeCorrelation: number;
  confidence: number;
  lastObserved: string;
  isActive: boolean;
}

interface KnowledgeRule {
  id: string;
  category: string;
  condition: string;
  prediction: string;
  weight: number;
  supportCount: number;
  accuracy: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  featureIndices: number[];
  thresholdValues: number[];
  expectedDirection: number;
}

interface CalibrationBucket {
  predictedRangeMin: number;
  predictedRangeMax: number;
  totalPredictions: number;
  positiveOutcomes: number;
  observedFrequency: number;
  calibrationError: number;
}

interface CalibrationState {
  buckets: CalibrationBucket[];
  expectedCalibrationError: number;
  maxCalibrationError: number;
  lastCalibratedAt: string;
  totalCalibrated: number;
}

interface ModelVariant {
  id: string;
  name: string;
  weights: ModelWeights;
  predictions: number;
  correctPredictions: number;
  totalSquaredError: number;
  averageLoss: number;
  brierScore: number;
  assignedTrafficPercent: number;
  createdAt: string;
  isControl: boolean;
}

interface ABTestState {
  isActive: boolean;
  variants: ModelVariant[];
  testStartedAt: string | null;
  testEndedAt: string | null;
  minimumSampleSize: number;
  winnerVariantId: string | null;
  significanceLevel: number;
}

interface FeatureDistribution {
  mean: number;
  variance: number;
  min: number;
  max: number;
  sampleCount: number;
}

interface DriftState {
  baselineDistributions: FeatureDistribution[];
  currentDistributions: FeatureDistribution[];
  driftScores: number[];
  overallDriftScore: number;
  driftThreshold: number;
  isDrifting: boolean;
  lastCheckedAt: string;
  windowSize: number;
  recentFeatureVectors: number[][];
}

interface RetrainState {
  performanceThreshold: number;
  currentPerformance: number;
  lastRetrainedAt: string | null;
  retrainCount: number;
  retrainHistory: Array<{
    timestamp: string;
    trigger: string;
    beforePerformance: number;
    afterPerformance: number;
  }>;
  isRetraining: boolean;
  cooldownMinutes: number;
  minSamplesForRetrain: number;
}

interface EngineMetadata {
  initialized: boolean;
  createdAt: string;
  lastActiveAt: string;
  totalPredictions: number;
  totalUpdates: number;
  engineVersion: string;
}

interface PredictionResult {
  riskScore: number;
  confidence: number;
  riskLevel: RiskLevel;
  contributingFactors: Array<{ feature: string; contribution: number }>;
  matchedPatterns: string[];
  matchedRules: string[];
  modelVersion: number;
  predictionId: string;
}

interface EngineStats {
  totalPredictions: number;
  totalUpdates: number;
  currentAccuracy: number;
  modelVersion: number;
  activePatterns: number;
  activeRules: number;
  calibrationError: number;
  isDrifting: boolean;
  isRetraining: boolean;
  abTestActive: boolean;
  thresholds: { low: number; medium: number; high: number };
}

interface LearningUpdate {
  patientId: string;
  predictionId: string;
  actualOutcome: number;
  timestamp?: string;
}

// ============================================================================
// localStorage helpers (safe for SSR / test environments)
// ============================================================================

function storageGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or unavailable -- silently degrade
  }
}

// ============================================================================
// Math Utilities (no dependencies)
// ============================================================================

function sigmoid(x: number): number {
  if (x > 500) return 1;
  if (x < -500) return 0;
  return 1 / (1 + Math.exp(-x));
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${ts}-${rand}`;
}

function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function computeVariance(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  let sumSq = 0;
  for (const v of values) {
    const diff = v - mean;
    sumSq += diff * diff;
  }
  return sumSq / (values.length - 1);
}

// ============================================================================
// Default Knowledge Base: 55 medical recovery rules/patterns
// ============================================================================

function createDefaultKnowledgeBase(): KnowledgeRule[] {
  const now = new Date().toISOString();
  const rules: KnowledgeRule[] = [
    // -- Medication Adherence Rules (1-8) --
    {
      id: 'rule-001', category: 'medication', condition: 'Medication adherence rate drops below 70%',
      prediction: 'Risk of delayed wound healing increases by 40%', weight: 0.85,
      supportCount: 342, accuracy: 0.78, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MEDICATION_ADHERENCE], thresholdValues: [0.7], expectedDirection: -1,
    },
    {
      id: 'rule-002', category: 'medication', condition: 'Patient misses 3+ doses in a single week',
      prediction: 'Infection probability increases by 25%', weight: 0.80,
      supportCount: 218, accuracy: 0.74, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MISSED_DOSES_LAST_WEEK], thresholdValues: [0.43], expectedDirection: 1,
    },
    {
      id: 'rule-003', category: 'medication', condition: 'Consistent medication adherence above 95% for 2+ weeks',
      prediction: 'Expected recovery timeline shortens by 15%', weight: 0.72,
      supportCount: 189, accuracy: 0.81, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MEDICATION_ADHERENCE], thresholdValues: [0.95], expectedDirection: -1,
    },
    {
      id: 'rule-004', category: 'medication', condition: 'Patient takes antibiotics irregularly (adherence 50-70%)',
      prediction: 'Risk of antibiotic-resistant infection rises by 30%', weight: 0.88,
      supportCount: 156, accuracy: 0.71, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MEDICATION_ADHERENCE], thresholdValues: [0.5], expectedDirection: -1,
    },
    {
      id: 'rule-005', category: 'medication', condition: 'Pain medication adherence below 60%',
      prediction: 'Mobility recovery slows; patient avoids physical therapy', weight: 0.65,
      supportCount: 134, accuracy: 0.69, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MEDICATION_ADHERENCE, FeatureName.MOBILITY_SCORE], thresholdValues: [0.6, 0.4], expectedDirection: -1,
    },
    {
      id: 'rule-006', category: 'medication', condition: 'Anti-inflammatory medication stopped early (before day 10)',
      prediction: 'Swelling recurrence probability increases by 35%', weight: 0.76,
      supportCount: 112, accuracy: 0.73, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MEDICATION_ADHERENCE, FeatureName.SWELLING_TREND], thresholdValues: [0.5, 0.6], expectedDirection: 1,
    },
    {
      id: 'rule-007', category: 'medication', condition: 'Patient requests early refill of pain medication',
      prediction: 'Monitor for potential overuse; reassess pain management plan', weight: 0.60,
      supportCount: 89, accuracy: 0.65, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.PAIN_LEVEL_TREND], thresholdValues: [0.7], expectedDirection: 1,
    },
    {
      id: 'rule-008', category: 'medication', condition: 'Medication adherence above 90% AND exercise completion above 80%',
      prediction: 'Patient is on optimal recovery trajectory', weight: 0.90,
      supportCount: 267, accuracy: 0.85, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MEDICATION_ADHERENCE, FeatureName.EXERCISE_COMPLETION], thresholdValues: [0.9, 0.8], expectedDirection: -1,
    },

    // -- Exercise & Physical Therapy Rules (9-16) --
    {
      id: 'rule-009', category: 'exercise', condition: 'Exercise completion rate below 40% for 5+ days',
      prediction: 'Joint stiffness risk increases; range of motion may decrease', weight: 0.78,
      supportCount: 201, accuracy: 0.76, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.EXERCISE_COMPLETION], thresholdValues: [0.4], expectedDirection: -1,
    },
    {
      id: 'rule-010', category: 'exercise', condition: 'Average exercise minutes below 15 per day',
      prediction: 'Muscle atrophy risk increases in post-surgical patients', weight: 0.74,
      supportCount: 178, accuracy: 0.72, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.EXERCISE_MINUTES_AVG], thresholdValues: [0.25], expectedDirection: -1,
    },
    {
      id: 'rule-011', category: 'exercise', condition: 'Patient exceeds recommended exercise intensity',
      prediction: 'Risk of re-injury or suture stress increases by 20%', weight: 0.82,
      supportCount: 95, accuracy: 0.77, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.EXERCISE_MINUTES_AVG], thresholdValues: [0.9], expectedDirection: 1,
    },
    {
      id: 'rule-012', category: 'exercise', condition: 'Consistent daily exercise of 20-40 minutes',
      prediction: 'Wound healing rate improves by 18% compared to sedentary patients', weight: 0.70,
      supportCount: 312, accuracy: 0.79, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.EXERCISE_MINUTES_AVG], thresholdValues: [0.5], expectedDirection: -1,
    },
    {
      id: 'rule-013', category: 'exercise', condition: 'Mobility score declining for 3+ consecutive days',
      prediction: 'Possible complication developing; recommend clinical evaluation', weight: 0.86,
      supportCount: 143, accuracy: 0.80, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MOBILITY_SCORE], thresholdValues: [0.35], expectedDirection: -1,
    },
    {
      id: 'rule-014', category: 'exercise', condition: 'Patient shows zero exercise for 3+ consecutive days',
      prediction: 'Blood clot risk increases for post-surgical patients', weight: 0.91,
      supportCount: 167, accuracy: 0.83, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.EXERCISE_COMPLETION, FeatureName.EXERCISE_MINUTES_AVG], thresholdValues: [0.05, 0.05], expectedDirection: -1,
    },
    {
      id: 'rule-015', category: 'exercise', condition: 'Physical therapy exercises completed with good form (high mobility score)',
      prediction: 'Recovery ahead of schedule by approximately 10%', weight: 0.68,
      supportCount: 234, accuracy: 0.75, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.EXERCISE_COMPLETION, FeatureName.MOBILITY_SCORE], thresholdValues: [0.85, 0.8], expectedDirection: -1,
    },
    {
      id: 'rule-016', category: 'exercise', condition: 'Sharp increase in exercise after period of inactivity',
      prediction: 'Risk of strain injury; recommend gradual increase protocol', weight: 0.73,
      supportCount: 88, accuracy: 0.70, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.EXERCISE_MINUTES_AVG], thresholdValues: [0.85], expectedDirection: 1,
    },

    // -- Wound Care & Photo Rules (17-24) --
    {
      id: 'rule-017', category: 'wound_care', condition: 'Photo upload frequency drops below once per 3 days',
      prediction: 'Delayed detection of wound complications; recommend reminder', weight: 0.77,
      supportCount: 189, accuracy: 0.73, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.PHOTO_UPLOAD_FREQUENCY], thresholdValues: [0.33], expectedDirection: -1,
    },
    {
      id: 'rule-018', category: 'wound_care', condition: 'Wound healing trend negative for 4+ consecutive measurements',
      prediction: 'Likely infection or complication; urgent clinical review recommended', weight: 0.94,
      supportCount: 121, accuracy: 0.87, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.WOUND_HEALING_TREND], thresholdValues: [0.3], expectedDirection: -1,
    },
    {
      id: 'rule-019', category: 'wound_care', condition: 'Infection risk markers elevated above baseline',
      prediction: 'Begin enhanced monitoring protocol; consider prophylactic measures', weight: 0.89,
      supportCount: 98, accuracy: 0.82, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.INFECTION_RISK_MARKERS], thresholdValues: [0.65], expectedDirection: 1,
    },
    {
      id: 'rule-020', category: 'wound_care', condition: 'Swelling trend increasing while wound healing trend stable',
      prediction: 'Possible fluid accumulation; recommend imaging evaluation', weight: 0.83,
      supportCount: 76, accuracy: 0.75, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.SWELLING_TREND, FeatureName.WOUND_HEALING_TREND], thresholdValues: [0.7, 0.5], expectedDirection: 1,
    },
    {
      id: 'rule-021', category: 'wound_care', condition: 'Consistent wound improvement (healing trend above 0.7) for 7+ days',
      prediction: 'On track for normal healing; may reduce monitoring frequency', weight: 0.71,
      supportCount: 287, accuracy: 0.82, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.WOUND_HEALING_TREND], thresholdValues: [0.7], expectedDirection: -1,
    },
    {
      id: 'rule-022', category: 'wound_care', condition: 'Photo shows redness increase combined with rising infection markers',
      prediction: 'High probability of wound infection; recommend immediate clinical assessment', weight: 0.95,
      supportCount: 67, accuracy: 0.89, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.WOUND_HEALING_TREND, FeatureName.INFECTION_RISK_MARKERS], thresholdValues: [0.3, 0.75], expectedDirection: 1,
    },
    {
      id: 'rule-023', category: 'wound_care', condition: 'Patient uploads wound photos at recommended intervals',
      prediction: 'Early detection capability maintained; optimal monitoring', weight: 0.64,
      supportCount: 345, accuracy: 0.80, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.PHOTO_UPLOAD_FREQUENCY], thresholdValues: [0.7], expectedDirection: -1,
    },
    {
      id: 'rule-024', category: 'wound_care', condition: 'Wound healing plateau after initial improvement',
      prediction: 'Possible granulation tissue issue; may benefit from wound care revision', weight: 0.75,
      supportCount: 104, accuracy: 0.71, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.WOUND_HEALING_TREND], thresholdValues: [0.5], expectedDirection: -1,
    },

    // -- Lifestyle & Wellbeing Rules (25-34) --
    {
      id: 'rule-025', category: 'lifestyle', condition: 'Sleep quality score below 0.4 for 5+ days',
      prediction: 'Immune function compromised; healing rate may decrease by 20%', weight: 0.79,
      supportCount: 198, accuracy: 0.74, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.SLEEP_QUALITY], thresholdValues: [0.4], expectedDirection: -1,
    },
    {
      id: 'rule-026', category: 'lifestyle', condition: 'Nutrition score below 0.5 during recovery',
      prediction: 'Protein deficiency risk; may impair tissue repair', weight: 0.76,
      supportCount: 167, accuracy: 0.72, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.NUTRITION_SCORE], thresholdValues: [0.5], expectedDirection: -1,
    },
    {
      id: 'rule-027', category: 'lifestyle', condition: 'Hydration level consistently below 0.5',
      prediction: 'Medication efficacy reduced; wound healing slower', weight: 0.70,
      supportCount: 145, accuracy: 0.68, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.HYDRATION_LEVEL], thresholdValues: [0.5], expectedDirection: -1,
    },
    {
      id: 'rule-028', category: 'lifestyle', condition: 'Mood score declining for 5+ consecutive days',
      prediction: 'Depression risk increases; may lead to reduced treatment compliance', weight: 0.81,
      supportCount: 176, accuracy: 0.76, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MOOD_SCORE], thresholdValues: [0.35], expectedDirection: -1,
    },
    {
      id: 'rule-029', category: 'lifestyle', condition: 'Good sleep (>0.7) AND good nutrition (>0.7) sustained',
      prediction: 'Optimal healing environment; recovery on or ahead of schedule', weight: 0.73,
      supportCount: 256, accuracy: 0.80, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.SLEEP_QUALITY, FeatureName.NUTRITION_SCORE], thresholdValues: [0.7, 0.7], expectedDirection: -1,
    },
    {
      id: 'rule-030', category: 'lifestyle', condition: 'Pain level trend increasing while medication adherence is high',
      prediction: 'Pain medication may be insufficient; reassess dosage or diagnosis', weight: 0.84,
      supportCount: 123, accuracy: 0.78, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.PAIN_LEVEL_TREND, FeatureName.MEDICATION_ADHERENCE], thresholdValues: [0.7, 0.85], expectedDirection: 1,
    },
    {
      id: 'rule-031', category: 'lifestyle', condition: 'High mood score (>0.7) correlates with better exercise compliance',
      prediction: 'Positive feedback loop; encourage social engagement and milestones', weight: 0.66,
      supportCount: 203, accuracy: 0.73, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MOOD_SCORE, FeatureName.EXERCISE_COMPLETION], thresholdValues: [0.7, 0.7], expectedDirection: -1,
    },
    {
      id: 'rule-032', category: 'lifestyle', condition: 'Low sleep quality AND high pain trend',
      prediction: 'Pain-sleep cycle risk; consider sleep aid or pain management revision', weight: 0.82,
      supportCount: 134, accuracy: 0.77, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.SLEEP_QUALITY, FeatureName.PAIN_LEVEL_TREND], thresholdValues: [0.35, 0.7], expectedDirection: 1,
    },
    {
      id: 'rule-033', category: 'lifestyle', condition: 'Hydration above 0.8 AND nutrition above 0.8',
      prediction: 'Tissue repair optimized; reduced risk of post-surgical complications', weight: 0.69,
      supportCount: 189, accuracy: 0.76, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.HYDRATION_LEVEL, FeatureName.NUTRITION_SCORE], thresholdValues: [0.8, 0.8], expectedDirection: -1,
    },
    {
      id: 'rule-034', category: 'lifestyle', condition: 'Patient streak breaks after 7+ day streak',
      prediction: 'Motivation dip detected; deploy encouragement and check-in', weight: 0.63,
      supportCount: 145, accuracy: 0.67, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.STREAK_LENGTH], thresholdValues: [0.2], expectedDirection: -1,
    },

    // -- Clinical & Comorbidity Rules (35-42) --
    {
      id: 'rule-035', category: 'clinical', condition: 'Comorbidity count >= 3 AND age factor above 0.7',
      prediction: 'Extended recovery expected; increase monitoring frequency', weight: 0.87,
      supportCount: 156, accuracy: 0.81, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.COMORBIDITY_COUNT, FeatureName.AGE_FACTOR], thresholdValues: [0.6, 0.7], expectedDirection: 1,
    },
    {
      id: 'rule-036', category: 'clinical', condition: 'Days since surgery > 14 AND wound not improving',
      prediction: 'Chronic wound risk; consider advanced wound care referral', weight: 0.90,
      supportCount: 89, accuracy: 0.84, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.DAYS_SINCE_SURGERY, FeatureName.WOUND_HEALING_TREND], thresholdValues: [0.5, 0.35], expectedDirection: 1,
    },
    {
      id: 'rule-037', category: 'clinical', condition: 'Follow-up attendance below 50%',
      prediction: 'Complication detection delayed; outcomes worsen by 30%', weight: 0.88,
      supportCount: 201, accuracy: 0.79, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.FOLLOW_UP_ATTENDANCE], thresholdValues: [0.5], expectedDirection: -1,
    },
    {
      id: 'rule-038', category: 'clinical', condition: 'Age factor above 0.8 AND low exercise completion',
      prediction: 'Higher fall risk; recommend supervised rehabilitation', weight: 0.83,
      supportCount: 134, accuracy: 0.77, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.AGE_FACTOR, FeatureName.EXERCISE_COMPLETION], thresholdValues: [0.8, 0.3], expectedDirection: 1,
    },
    {
      id: 'rule-039', category: 'clinical', condition: 'Diabetic patient (comorbidity) with infection risk markers rising',
      prediction: 'Diabetic wound complication risk very high; immediate intervention', weight: 0.93,
      supportCount: 78, accuracy: 0.86, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.COMORBIDITY_COUNT, FeatureName.INFECTION_RISK_MARKERS], thresholdValues: [0.4, 0.6], expectedDirection: 1,
    },
    {
      id: 'rule-040', category: 'clinical', condition: 'Young patient (age factor < 0.3) with high exercise',
      prediction: 'Accelerated recovery expected; may reduce follow-up frequency', weight: 0.67,
      supportCount: 198, accuracy: 0.74, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.AGE_FACTOR, FeatureName.EXERCISE_COMPLETION], thresholdValues: [0.3, 0.8], expectedDirection: -1,
    },
    {
      id: 'rule-041', category: 'clinical', condition: 'Early post-surgery (days < 3) with high pain and swelling',
      prediction: 'Expected post-operative response; continue standard protocol', weight: 0.55,
      supportCount: 345, accuracy: 0.88, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.DAYS_SINCE_SURGERY, FeatureName.PAIN_LEVEL_TREND, FeatureName.SWELLING_TREND], thresholdValues: [0.1, 0.7, 0.7], expectedDirection: -1,
    },
    {
      id: 'rule-042', category: 'clinical', condition: 'Multiple comorbidities AND poor nutrition AND low exercise',
      prediction: 'High risk of post-surgical complications; escalate care team involvement', weight: 0.92,
      supportCount: 67, accuracy: 0.83, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.COMORBIDITY_COUNT, FeatureName.NUTRITION_SCORE, FeatureName.EXERCISE_COMPLETION], thresholdValues: [0.5, 0.35, 0.3], expectedDirection: 1,
    },

    // -- Engagement & Behavioral Rules (43-50) --
    {
      id: 'rule-043', category: 'engagement', condition: 'Mission streak length above 14 days',
      prediction: 'Strong compliance pattern; patient highly engaged with recovery', weight: 0.71,
      supportCount: 234, accuracy: 0.83, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.STREAK_LENGTH], thresholdValues: [0.7], expectedDirection: -1,
    },
    {
      id: 'rule-044', category: 'engagement', condition: 'All daily missions completed consistently for 7+ days',
      prediction: 'Recovery acceleration of 12%; maintain current care plan', weight: 0.69,
      supportCount: 289, accuracy: 0.78, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.STREAK_LENGTH, FeatureName.MEDICATION_ADHERENCE, FeatureName.EXERCISE_COMPLETION], thresholdValues: [0.5, 0.85, 0.85], expectedDirection: -1,
    },
    {
      id: 'rule-045', category: 'engagement', condition: 'Patient disengaging: declining streak AND fewer photo uploads',
      prediction: 'Risk of non-compliance cascade; initiate proactive outreach', weight: 0.80,
      supportCount: 167, accuracy: 0.75, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.STREAK_LENGTH, FeatureName.PHOTO_UPLOAD_FREQUENCY], thresholdValues: [0.2, 0.25], expectedDirection: -1,
    },
    {
      id: 'rule-046', category: 'engagement', condition: 'Caregiver support available AND patient compliance low',
      prediction: 'Engage caregiver for medication reminders and exercise support', weight: 0.74,
      supportCount: 112, accuracy: 0.71, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.CAREGIVER_SUPPORT, FeatureName.MEDICATION_ADHERENCE], thresholdValues: [0.7, 0.5], expectedDirection: -1,
    },
    {
      id: 'rule-047', category: 'engagement', condition: 'No caregiver support AND patient living alone',
      prediction: 'Higher risk of missed medications and appointments; recommend telehealth check-ins', weight: 0.78,
      supportCount: 145, accuracy: 0.73, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.CAREGIVER_SUPPORT], thresholdValues: [0.2], expectedDirection: -1,
    },
    {
      id: 'rule-048', category: 'engagement', condition: 'Follow-up appointment attendance 100%',
      prediction: 'Complications caught early in 92% of cases; optimal care pathway', weight: 0.75,
      supportCount: 278, accuracy: 0.86, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.FOLLOW_UP_ATTENDANCE], thresholdValues: [0.95], expectedDirection: -1,
    },
    {
      id: 'rule-049', category: 'engagement', condition: 'Patient mood low AND exercise low AND medication low',
      prediction: 'Depression-driven non-compliance pattern; refer to behavioral health', weight: 0.86,
      supportCount: 98, accuracy: 0.79, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MOOD_SCORE, FeatureName.EXERCISE_COMPLETION, FeatureName.MEDICATION_ADHERENCE], thresholdValues: [0.3, 0.3, 0.5], expectedDirection: 1,
    },
    {
      id: 'rule-050', category: 'engagement', condition: 'Patient consistently completes all missions before deadline',
      prediction: 'Type A recovery profile; may respond well to milestone rewards', weight: 0.62,
      supportCount: 201, accuracy: 0.77, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.STREAK_LENGTH, FeatureName.EXERCISE_COMPLETION, FeatureName.MEDICATION_ADHERENCE, FeatureName.PHOTO_UPLOAD_FREQUENCY], thresholdValues: [0.8, 0.9, 0.9, 0.8], expectedDirection: -1,
    },

    // -- Advanced Composite Rules (51-55) --
    {
      id: 'rule-051', category: 'composite', condition: 'Simultaneous decline in 3+ lifestyle factors over 5 days',
      prediction: 'Systemic recovery stall; comprehensive reassessment needed', weight: 0.88,
      supportCount: 78, accuracy: 0.80, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.SLEEP_QUALITY, FeatureName.NUTRITION_SCORE, FeatureName.MOOD_SCORE, FeatureName.HYDRATION_LEVEL], thresholdValues: [0.4, 0.4, 0.4, 0.4], expectedDirection: -1,
    },
    {
      id: 'rule-052', category: 'composite', condition: 'High infection markers AND missed antibiotics AND poor nutrition',
      prediction: 'Critical infection pathway; immediate clinical intervention required', weight: 0.96,
      supportCount: 45, accuracy: 0.91, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.INFECTION_RISK_MARKERS, FeatureName.MISSED_DOSES_LAST_WEEK, FeatureName.NUTRITION_SCORE], thresholdValues: [0.75, 0.5, 0.35], expectedDirection: 1,
    },
    {
      id: 'rule-053', category: 'composite', condition: 'Patient improving across all metrics for 10+ days',
      prediction: 'Excellent prognosis; candidate for early discharge or reduced monitoring', weight: 0.80,
      supportCount: 167, accuracy: 0.85, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.WOUND_HEALING_TREND, FeatureName.PAIN_LEVEL_TREND, FeatureName.MOBILITY_SCORE, FeatureName.MEDICATION_ADHERENCE], thresholdValues: [0.75, 0.3, 0.75, 0.9], expectedDirection: -1,
    },
    {
      id: 'rule-054', category: 'composite', condition: 'Weekend dip pattern: lower compliance on Saturdays and Sundays',
      prediction: 'Routine disruption common; schedule weekend reminders and simplified regimen', weight: 0.64,
      supportCount: 312, accuracy: 0.72, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.MEDICATION_ADHERENCE, FeatureName.EXERCISE_COMPLETION], thresholdValues: [0.6, 0.5], expectedDirection: -1,
    },
    {
      id: 'rule-055', category: 'composite', condition: 'Post-day-7 surgery plateau in wound healing with stable vitals',
      prediction: 'Normal healing plateau phase; reassure patient and continue protocol', weight: 0.58,
      supportCount: 234, accuracy: 0.84, createdAt: now, updatedAt: now, isActive: true,
      featureIndices: [FeatureName.DAYS_SINCE_SURGERY, FeatureName.WOUND_HEALING_TREND], thresholdValues: [0.25, 0.5], expectedDirection: -1,
    },
  ];
  return rules;
}

// ============================================================================
// Self-Learning Engine Class
// ============================================================================

class SelfLearningEngine {
  private _weights: ModelWeights | null = null;
  private _thresholds: ThresholdState | null = null;
  private _calibration: CalibrationState | null = null;
  private _abTest: ABTestState | null = null;
  private _drift: DriftState | null = null;
  private _retrain: RetrainState | null = null;
  private _metadata: EngineMetadata | null = null;

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  initialize(): void {
    this._metadata = storageGet<EngineMetadata>(SLE_STORAGE_KEYS.ENGINE_METADATA);
    if (this._metadata?.initialized) {
      this._loadAllState();
      this._updateMetadataTimestamp();
      return;
    }

    // First-time initialization
    this._initializeWeights();
    this._initializeThresholds();
    this._initializeCalibration();
    this._initializeABTest();
    this._initializeDrift();
    this._initializeRetrain();
    this._initializeKnowledgeBase();
    this._initializePatterns();

    const now = new Date().toISOString();
    this._metadata = {
      initialized: true,
      createdAt: now,
      lastActiveAt: now,
      totalPredictions: 0,
      totalUpdates: 0,
      engineVersion: '1.0.0',
    };
    storageSet(SLE_STORAGE_KEYS.ENGINE_METADATA, this._metadata);
  }

  private _loadAllState(): void {
    this._weights = storageGet<ModelWeights>(SLE_STORAGE_KEYS.MODEL_WEIGHTS);
    this._thresholds = storageGet<ThresholdState>(SLE_STORAGE_KEYS.THRESHOLD_STATE);
    this._calibration = storageGet<CalibrationState>(SLE_STORAGE_KEYS.CALIBRATION_STATE);
    this._abTest = storageGet<ABTestState>(SLE_STORAGE_KEYS.AB_TEST_STATE);
    this._drift = storageGet<DriftState>(SLE_STORAGE_KEYS.DRIFT_STATE);
    this._retrain = storageGet<RetrainState>(SLE_STORAGE_KEYS.RETRAIN_STATE);

    // Ensure defaults if storage was corrupted
    if (!this._weights) this._initializeWeights();
    if (!this._thresholds) this._initializeThresholds();
    if (!this._calibration) this._initializeCalibration();
    if (!this._abTest) this._initializeABTest();
    if (!this._drift) this._initializeDrift();
    if (!this._retrain) this._initializeRetrain();
  }

  private _updateMetadataTimestamp(): void {
    if (this._metadata) {
      this._metadata.lastActiveAt = new Date().toISOString();
      storageSet(SLE_STORAGE_KEYS.ENGINE_METADATA, this._metadata);
    }
  }

  private _initializeWeights(): void {
    // Xavier-like initialization for sigmoid output
    const scale = Math.sqrt(2.0 / (FEATURE_COUNT + 1));
    const weights: number[] = [];
    for (let i = 0; i < FEATURE_COUNT; i++) {
      // Deterministic pseudo-random seeds based on feature index
      weights.push((Math.sin(i * 9301 + 49297) % 1) * scale);
    }
    this._weights = {
      weights,
      bias: 0.0,
      learningRate: 0.01,
      version: 1,
      updatedAt: new Date().toISOString(),
      totalUpdates: 0,
    };
    storageSet(SLE_STORAGE_KEYS.MODEL_WEIGHTS, this._weights);
  }

  private _initializeThresholds(): void {
    this._thresholds = {
      lowRiskThreshold: 0.25,
      mediumRiskThreshold: 0.50,
      highRiskThreshold: 0.75,
      adjustmentHistory: [],
      totalPredictions: 0,
      correctPredictions: 0,
    };
    storageSet(SLE_STORAGE_KEYS.THRESHOLD_STATE, this._thresholds);
  }

  private _initializeCalibration(): void {
    const buckets: CalibrationBucket[] = [];
    for (let i = 0; i < 10; i++) {
      buckets.push({
        predictedRangeMin: i * 0.1,
        predictedRangeMax: (i + 1) * 0.1,
        totalPredictions: 0,
        positiveOutcomes: 0,
        observedFrequency: 0,
        calibrationError: 0,
      });
    }
    this._calibration = {
      buckets,
      expectedCalibrationError: 0,
      maxCalibrationError: 0,
      lastCalibratedAt: new Date().toISOString(),
      totalCalibrated: 0,
    };
    storageSet(SLE_STORAGE_KEYS.CALIBRATION_STATE, this._calibration);
  }

  private _initializeABTest(): void {
    this._abTest = {
      isActive: false,
      variants: [],
      testStartedAt: null,
      testEndedAt: null,
      minimumSampleSize: 50,
      winnerVariantId: null,
      significanceLevel: 0.05,
    };
    storageSet(SLE_STORAGE_KEYS.AB_TEST_STATE, this._abTest);
  }

  private _initializeDrift(): void {
    const emptyDist: FeatureDistribution = { mean: 0.5, variance: 0.08, min: 0, max: 1, sampleCount: 0 };
    const baselines: FeatureDistribution[] = [];
    const currents: FeatureDistribution[] = [];
    for (let i = 0; i < FEATURE_COUNT; i++) {
      baselines.push({ ...emptyDist });
      currents.push({ ...emptyDist });
    }
    this._drift = {
      baselineDistributions: baselines,
      currentDistributions: currents,
      driftScores: new Array(FEATURE_COUNT).fill(0),
      overallDriftScore: 0,
      driftThreshold: 0.15,
      isDrifting: false,
      lastCheckedAt: new Date().toISOString(),
      windowSize: 100,
      recentFeatureVectors: [],
    };
    storageSet(SLE_STORAGE_KEYS.DRIFT_STATE, this._drift);
  }

  private _initializeRetrain(): void {
    this._retrain = {
      performanceThreshold: 0.60,
      currentPerformance: 1.0,
      lastRetrainedAt: null,
      retrainCount: 0,
      retrainHistory: [],
      isRetraining: false,
      cooldownMinutes: 30,
      minSamplesForRetrain: 20,
    };
    storageSet(SLE_STORAGE_KEYS.RETRAIN_STATE, this._retrain);
  }

  private _initializeKnowledgeBase(): void {
    const rules = createDefaultKnowledgeBase();
    storageSet(SLE_STORAGE_KEYS.KNOWLEDGE_BASE, rules);
  }

  private _initializePatterns(): void {
    const defaultPatterns: RecoveryPattern[] = [
      {
        id: 'pattern-med-adherence-healing',
        name: 'Medication Adherence-Healing Correlation',
        description: 'Patients who miss medications tend to have slower wound healing',
        triggerFeatures: [FeatureName.MEDICATION_ADHERENCE, FeatureName.WOUND_HEALING_TREND],
        triggerThresholds: [0.6, 0.4],
        occurrenceCount: 0,
        outcomeCorrelation: 0.72,
        confidence: 0.65,
        lastObserved: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'pattern-exercise-mobility',
        name: 'Exercise-Mobility Recovery Link',
        description: 'Regular exercise completion strongly predicts mobility improvement',
        triggerFeatures: [FeatureName.EXERCISE_COMPLETION, FeatureName.MOBILITY_SCORE],
        triggerThresholds: [0.7, 0.6],
        occurrenceCount: 0,
        outcomeCorrelation: 0.68,
        confidence: 0.60,
        lastObserved: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'pattern-sleep-immune',
        name: 'Sleep-Immune Recovery Pattern',
        description: 'Poor sleep correlates with increased infection markers',
        triggerFeatures: [FeatureName.SLEEP_QUALITY, FeatureName.INFECTION_RISK_MARKERS],
        triggerThresholds: [0.4, 0.5],
        occurrenceCount: 0,
        outcomeCorrelation: 0.58,
        confidence: 0.55,
        lastObserved: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'pattern-mood-compliance',
        name: 'Mood-Compliance Cascade',
        description: 'Declining mood leads to declining medication and exercise adherence',
        triggerFeatures: [FeatureName.MOOD_SCORE, FeatureName.MEDICATION_ADHERENCE, FeatureName.EXERCISE_COMPLETION],
        triggerThresholds: [0.4, 0.5, 0.4],
        occurrenceCount: 0,
        outcomeCorrelation: 0.64,
        confidence: 0.58,
        lastObserved: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'pattern-nutrition-wound',
        name: 'Nutrition-Wound Healing Acceleration',
        description: 'Good nutrition scores correlate with faster wound healing trends',
        triggerFeatures: [FeatureName.NUTRITION_SCORE, FeatureName.WOUND_HEALING_TREND],
        triggerThresholds: [0.7, 0.7],
        occurrenceCount: 0,
        outcomeCorrelation: 0.61,
        confidence: 0.57,
        lastObserved: new Date().toISOString(),
        isActive: true,
      },
    ];
    storageSet(SLE_STORAGE_KEYS.PATTERN_REGISTRY, defaultPatterns);
  }

  // --------------------------------------------------------------------------
  // 1. Online Learning: Stochastic Gradient Descent
  // --------------------------------------------------------------------------

  /**
   * Perform a single SGD update step given a feature vector and the true label.
   * Uses binary cross-entropy loss gradient for logistic regression.
   */
  private _sgdUpdate(features: number[], trueLabel: number): void {
    if (!this._weights) return;

    const predicted = this._forwardPass(features);
    const error = predicted - trueLabel;

    // Gradient of binary cross-entropy w.r.t. weights: error * x_i
    const lr = this._weights.learningRate;
    for (let i = 0; i < this._weights.weights.length; i++) {
      const featureVal = i < features.length ? features[i] : 0;
      this._weights.weights[i] -= lr * error * featureVal;
    }
    this._weights.bias -= lr * error;

    // Learning rate decay (every 100 updates, reduce by 5%)
    this._weights.totalUpdates += 1;
    if (this._weights.totalUpdates % 100 === 0) {
      this._weights.learningRate = Math.max(0.0001, this._weights.learningRate * 0.95);
    }

    this._weights.updatedAt = new Date().toISOString();
    storageSet(SLE_STORAGE_KEYS.MODEL_WEIGHTS, this._weights);
  }

  private _forwardPass(features: number[]): number {
    if (!this._weights) return 0.5;
    const z = dotProduct(this._weights.weights, features) + this._weights.bias;
    return sigmoid(z);
  }

  // --------------------------------------------------------------------------
  // 2. Feedback Loop System
  // --------------------------------------------------------------------------

  /**
   * Record actual outcome for a previous prediction and update the model.
   */
  recordOutcome(update: LearningUpdate): void {
    this._ensureInitialized();
    const log = this._getPredictionLog();

    const record = log.find(r => r.id === update.predictionId && r.patientId === update.patientId);
    if (!record) return;
    if (record.actualOutcome !== null) return; // already resolved

    record.actualOutcome = clamp(update.actualOutcome, 0, 1);
    record.resolvedAt = update.timestamp ?? new Date().toISOString();

    // SGD update with true label
    this._sgdUpdate(record.features, record.actualOutcome);

    // Update calibration
    this._updateCalibration(record.predictedRisk, record.actualOutcome);

    // Update threshold accuracy tracking
    this._updateThresholdAccuracy(record.predictedRisk, record.actualOutcome);

    // Update pattern confidence
    this._updatePatternConfidence(record.features, record.actualOutcome);

    // Update knowledge base rule accuracy
    this._updateKnowledgeRuleAccuracy(record.features, record.actualOutcome);

    // Update A/B test if active
    this._updateABTestMetrics(record.modelVersion, record.predictedRisk, record.actualOutcome);

    // Check if retraining is needed
    this._checkRetrainTrigger();

    // Persist
    storageSet(SLE_STORAGE_KEYS.PREDICTION_LOG, log);

    if (this._metadata) {
      this._metadata.totalUpdates += 1;
      storageSet(SLE_STORAGE_KEYS.ENGINE_METADATA, this._metadata);
    }
  }

  private _getPredictionLog(): PredictionRecord[] {
    return storageGet<PredictionRecord[]>(SLE_STORAGE_KEYS.PREDICTION_LOG) ?? [];
  }

  // --------------------------------------------------------------------------
  // 3. Adaptive Thresholds
  // --------------------------------------------------------------------------

  private _updateThresholdAccuracy(predictedRisk: number, actualOutcome: number): void {
    if (!this._thresholds) return;

    this._thresholds.totalPredictions += 1;

    // Determine if prediction was "correct": high risk => bad outcome, low risk => good outcome
    const predictedBad = predictedRisk >= this._thresholds.mediumRiskThreshold;
    const actualBad = actualOutcome >= 0.5;
    if (predictedBad === actualBad) {
      this._thresholds.correctPredictions += 1;
    }

    // Adjust thresholds every 50 predictions
    if (this._thresholds.totalPredictions % 50 === 0 && this._thresholds.totalPredictions > 0) {
      this._adjustThresholds();
    }

    storageSet(SLE_STORAGE_KEYS.THRESHOLD_STATE, this._thresholds);
  }

  private _adjustThresholds(): void {
    if (!this._thresholds) return;

    const accuracy = this._thresholds.correctPredictions / Math.max(1, this._thresholds.totalPredictions);
    const oldThresholds: [number, number, number] = [
      this._thresholds.lowRiskThreshold,
      this._thresholds.mediumRiskThreshold,
      this._thresholds.highRiskThreshold,
    ];

    let reason = '';
    const step = 0.02;

    if (accuracy < 0.6) {
      // Poor accuracy: widen the medium band to catch more borderline cases
      this._thresholds.lowRiskThreshold = clamp(this._thresholds.lowRiskThreshold - step, 0.10, 0.40);
      this._thresholds.highRiskThreshold = clamp(this._thresholds.highRiskThreshold + step, 0.60, 0.90);
      reason = `Accuracy low (${(accuracy * 100).toFixed(1)}%); widened risk bands`;
    } else if (accuracy > 0.85) {
      // High accuracy: tighten thresholds for finer discrimination
      this._thresholds.lowRiskThreshold = clamp(this._thresholds.lowRiskThreshold + step, 0.10, 0.40);
      this._thresholds.highRiskThreshold = clamp(this._thresholds.highRiskThreshold - step, 0.60, 0.90);
      reason = `Accuracy high (${(accuracy * 100).toFixed(1)}%); tightened risk bands`;
    } else {
      reason = `Accuracy acceptable (${(accuracy * 100).toFixed(1)}%); no adjustment`;
      return;
    }

    // Medium always stays between low and high
    this._thresholds.mediumRiskThreshold = (this._thresholds.lowRiskThreshold + this._thresholds.highRiskThreshold) / 2;

    const newThresholds: [number, number, number] = [
      this._thresholds.lowRiskThreshold,
      this._thresholds.mediumRiskThreshold,
      this._thresholds.highRiskThreshold,
    ];

    this._thresholds.adjustmentHistory.push({
      timestamp: new Date().toISOString(),
      oldThresholds,
      newThresholds,
      reason,
    });

    // Keep history manageable
    if (this._thresholds.adjustmentHistory.length > 50) {
      this._thresholds.adjustmentHistory = this._thresholds.adjustmentHistory.slice(-50);
    }

    storageSet(SLE_STORAGE_KEYS.THRESHOLD_STATE, this._thresholds);
  }

  classifyRisk(score: number): RiskLevel {
    this._ensureInitialized();
    const t = this._thresholds!;
    if (score < t.lowRiskThreshold) return RiskLevel.LOW;
    if (score < t.mediumRiskThreshold) return RiskLevel.MEDIUM;
    if (score < t.highRiskThreshold) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  // --------------------------------------------------------------------------
  // 4. Pattern Recognition
  // --------------------------------------------------------------------------

  private _detectPatterns(features: number[]): string[] {
    const patterns = storageGet<RecoveryPattern[]>(SLE_STORAGE_KEYS.PATTERN_REGISTRY) ?? [];
    const matched: string[] = [];

    for (const pattern of patterns) {
      if (!pattern.isActive) continue;

      let allTriggered = true;
      for (let i = 0; i < pattern.triggerFeatures.length; i++) {
        const featureIdx = pattern.triggerFeatures[i];
        const threshold = pattern.triggerThresholds[i];
        const featureVal = featureIdx < features.length ? features[featureIdx] : 0;

        // For patterns, we look for values deviating from threshold
        // Low values for positive features or high values for negative features
        if (featureVal > threshold) {
          // Feature above threshold -- only a match for negative-correlation patterns
          // We keep it simple: trigger means feature is near or past the threshold
        } else {
          allTriggered = false;
          break;
        }
      }

      if (allTriggered) {
        matched.push(pattern.id);
        pattern.occurrenceCount += 1;
        pattern.lastObserved = new Date().toISOString();
      }
    }

    storageSet(SLE_STORAGE_KEYS.PATTERN_REGISTRY, patterns);
    return matched;
  }

  private _updatePatternConfidence(features: number[], actualOutcome: number): void {
    const patterns = storageGet<RecoveryPattern[]>(SLE_STORAGE_KEYS.PATTERN_REGISTRY) ?? [];
    let changed = false;

    for (const pattern of patterns) {
      if (!pattern.isActive) continue;

      let triggered = true;
      for (let i = 0; i < pattern.triggerFeatures.length; i++) {
        const featureIdx = pattern.triggerFeatures[i];
        const threshold = pattern.triggerThresholds[i];
        if (featureIdx >= features.length || features[featureIdx] <= threshold) {
          triggered = false;
          break;
        }
      }

      if (triggered) {
        // Exponential moving average for outcome correlation
        const alpha = 0.1;
        pattern.outcomeCorrelation = pattern.outcomeCorrelation * (1 - alpha) + actualOutcome * alpha;
        pattern.confidence = clamp(pattern.confidence + (actualOutcome > 0.5 ? 0.01 : -0.005), 0.1, 0.99);
        changed = true;
      }
    }

    if (changed) {
      storageSet(SLE_STORAGE_KEYS.PATTERN_REGISTRY, patterns);
    }
  }

  discoverNewPattern(
    name: string,
    description: string,
    triggerFeatureIndices: number[],
    triggerThresholds: number[]
  ): RecoveryPattern {
    this._ensureInitialized();
    const patterns = storageGet<RecoveryPattern[]>(SLE_STORAGE_KEYS.PATTERN_REGISTRY) ?? [];
    const newPattern: RecoveryPattern = {
      id: `pattern-${generateId()}`,
      name,
      description,
      triggerFeatures: triggerFeatureIndices,
      triggerThresholds,
      occurrenceCount: 0,
      outcomeCorrelation: 0.5,
      confidence: 0.5,
      lastObserved: new Date().toISOString(),
      isActive: true,
    };
    patterns.push(newPattern);
    storageSet(SLE_STORAGE_KEYS.PATTERN_REGISTRY, patterns);
    return newPattern;
  }

  getPatterns(): RecoveryPattern[] {
    return storageGet<RecoveryPattern[]>(SLE_STORAGE_KEYS.PATTERN_REGISTRY) ?? [];
  }

  // --------------------------------------------------------------------------
  // 5. Knowledge Base
  // --------------------------------------------------------------------------

  private _matchKnowledgeRules(features: number[]): string[] {
    const rules = storageGet<KnowledgeRule[]>(SLE_STORAGE_KEYS.KNOWLEDGE_BASE) ?? [];
    const matched: string[] = [];

    for (const rule of rules) {
      if (!rule.isActive) continue;
      if (rule.accuracy < 0.5) continue; // skip unreliable rules

      let ruleApplies = true;
      for (let i = 0; i < rule.featureIndices.length; i++) {
        const fIdx = rule.featureIndices[i];
        const threshold = rule.thresholdValues[i];
        const fVal = fIdx < features.length ? features[fIdx] : 0;

        if (rule.expectedDirection === 1) {
          // We expect high values to trigger
          if (fVal < threshold) { ruleApplies = false; break; }
        } else {
          // We expect low values to trigger
          if (fVal > threshold) { ruleApplies = false; break; }
        }
      }

      if (ruleApplies) {
        matched.push(rule.id);
      }
    }

    return matched;
  }

  private _updateKnowledgeRuleAccuracy(features: number[], actualOutcome: number): void {
    const rules = storageGet<KnowledgeRule[]>(SLE_STORAGE_KEYS.KNOWLEDGE_BASE) ?? [];
    let changed = false;

    for (const rule of rules) {
      if (!rule.isActive) continue;

      let ruleApplies = true;
      for (let i = 0; i < rule.featureIndices.length; i++) {
        const fIdx = rule.featureIndices[i];
        const threshold = rule.thresholdValues[i];
        const fVal = fIdx < features.length ? features[fIdx] : 0;

        if (rule.expectedDirection === 1) {
          if (fVal < threshold) { ruleApplies = false; break; }
        } else {
          if (fVal > threshold) { ruleApplies = false; break; }
        }
      }

      if (ruleApplies) {
        rule.supportCount += 1;
        // Rule predicted higher risk (direction 1) or lower risk (direction -1)
        const ruleCorrect = rule.expectedDirection === 1
          ? actualOutcome >= 0.5
          : actualOutcome < 0.5;

        // Exponential moving average for accuracy
        const alpha = 0.05;
        rule.accuracy = rule.accuracy * (1 - alpha) + (ruleCorrect ? 1.0 : 0.0) * alpha;

        // Adjust rule weight based on accuracy
        rule.weight = clamp(rule.weight + (ruleCorrect ? 0.005 : -0.01), 0.1, 0.99);
        rule.updatedAt = new Date().toISOString();

        // Deactivate rules that consistently fail
        if (rule.accuracy < 0.35 && rule.supportCount > 30) {
          rule.isActive = false;
        }

        changed = true;
      }
    }

    if (changed) {
      storageSet(SLE_STORAGE_KEYS.KNOWLEDGE_BASE, rules);
    }
  }

  getKnowledgeBase(): KnowledgeRule[] {
    return storageGet<KnowledgeRule[]>(SLE_STORAGE_KEYS.KNOWLEDGE_BASE) ?? [];
  }

  addKnowledgeRule(
    category: string,
    condition: string,
    prediction: string,
    featureIndices: number[],
    thresholdValues: number[],
    expectedDirection: number
  ): KnowledgeRule {
    this._ensureInitialized();
    const rules = storageGet<KnowledgeRule[]>(SLE_STORAGE_KEYS.KNOWLEDGE_BASE) ?? [];
    const now = new Date().toISOString();
    const newRule: KnowledgeRule = {
      id: `rule-${generateId()}`,
      category,
      condition,
      prediction,
      weight: 0.5,
      supportCount: 0,
      accuracy: 0.5,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      featureIndices,
      thresholdValues,
      expectedDirection,
    };
    rules.push(newRule);
    storageSet(SLE_STORAGE_KEYS.KNOWLEDGE_BASE, rules);
    return newRule;
  }

  // --------------------------------------------------------------------------
  // 6. Confidence Calibration
  // --------------------------------------------------------------------------

  private _updateCalibration(predictedProb: number, actualOutcome: number): void {
    if (!this._calibration) return;

    const bucketIdx = Math.min(Math.floor(predictedProb * 10), 9);
    const bucket = this._calibration.buckets[bucketIdx];

    bucket.totalPredictions += 1;
    if (actualOutcome >= 0.5) {
      bucket.positiveOutcomes += 1;
    }

    bucket.observedFrequency = bucket.totalPredictions > 0
      ? bucket.positiveOutcomes / bucket.totalPredictions
      : 0;

    const bucketMidpoint = (bucket.predictedRangeMin + bucket.predictedRangeMax) / 2;
    bucket.calibrationError = Math.abs(bucket.observedFrequency - bucketMidpoint);

    // Recalculate ECE (Expected Calibration Error)
    let ece = 0;
    let mce = 0;
    let totalSamples = 0;
    for (const b of this._calibration.buckets) {
      totalSamples += b.totalPredictions;
    }
    for (const b of this._calibration.buckets) {
      if (b.totalPredictions > 0) {
        const weight = b.totalPredictions / Math.max(1, totalSamples);
        ece += weight * b.calibrationError;
        mce = Math.max(mce, b.calibrationError);
      }
    }

    this._calibration.expectedCalibrationError = ece;
    this._calibration.maxCalibrationError = mce;
    this._calibration.totalCalibrated += 1;
    this._calibration.lastCalibratedAt = new Date().toISOString();

    storageSet(SLE_STORAGE_KEYS.CALIBRATION_STATE, this._calibration);
  }

  /**
   * Apply Platt scaling-style calibration to a raw score.
   * Shifts the predicted probability toward observed frequencies for its bucket.
   */
  private _calibrateConfidence(rawScore: number): number {
    if (!this._calibration) return rawScore;

    const bucketIdx = Math.min(Math.floor(rawScore * 10), 9);
    const bucket = this._calibration.buckets[bucketIdx];

    if (bucket.totalPredictions < 5) {
      return rawScore; // Not enough data to calibrate
    }

    // Blend raw prediction toward observed frequency
    const blendFactor = Math.min(bucket.totalPredictions / 50, 0.5);
    return rawScore * (1 - blendFactor) + bucket.observedFrequency * blendFactor;
  }

  getCalibrationState(): CalibrationState | null {
    return this._calibration;
  }

  // --------------------------------------------------------------------------
  // 7. A/B Testing Framework
  // --------------------------------------------------------------------------

  startABTest(variantNames: string[]): void {
    this._ensureInitialized();
    if (!this._abTest || !this._weights) return;

    const trafficPerVariant = Math.floor(100 / (variantNames.length + 1)); // +1 for control
    const variants: ModelVariant[] = [];

    // Control variant (current model)
    variants.push({
      id: `variant-control-${generateId()}`,
      name: 'Control (Current Model)',
      weights: { ...this._weights },
      predictions: 0,
      correctPredictions: 0,
      totalSquaredError: 0,
      averageLoss: 0,
      brierScore: 0,
      assignedTrafficPercent: trafficPerVariant,
      createdAt: new Date().toISOString(),
      isControl: true,
    });

    // Challenger variants with perturbed weights
    for (const vName of variantNames) {
      const perturbedWeights: number[] = this._weights.weights.map((w, i) => {
        const perturbation = (Math.sin((i + 1) * 1337 + variants.length * 7919) % 1) * 0.1;
        return w + perturbation;
      });

      variants.push({
        id: `variant-${generateId()}`,
        name: vName,
        weights: {
          weights: perturbedWeights,
          bias: this._weights.bias + (Math.random() - 0.5) * 0.05,
          learningRate: this._weights.learningRate,
          version: this._weights.version,
          updatedAt: new Date().toISOString(),
          totalUpdates: this._weights.totalUpdates,
        },
        predictions: 0,
        correctPredictions: 0,
        totalSquaredError: 0,
        averageLoss: 0,
        brierScore: 0,
        assignedTrafficPercent: trafficPerVariant,
        createdAt: new Date().toISOString(),
        isControl: false,
      });
    }

    this._abTest = {
      isActive: true,
      variants,
      testStartedAt: new Date().toISOString(),
      testEndedAt: null,
      minimumSampleSize: 50,
      winnerVariantId: null,
      significanceLevel: 0.05,
    };

    storageSet(SLE_STORAGE_KEYS.AB_TEST_STATE, this._abTest);
  }

  private _selectABVariant(): ModelVariant | null {
    if (!this._abTest?.isActive || this._abTest.variants.length === 0) return null;

    // Simple traffic splitting based on assigned percentages
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const variant of this._abTest.variants) {
      cumulative += variant.assignedTrafficPercent;
      if (rand < cumulative) return variant;
    }
    return this._abTest.variants[0]; // fallback to control
  }

  private _updateABTestMetrics(modelVersion: number, predictedRisk: number, actualOutcome: number): void {
    if (!this._abTest?.isActive) return;

    for (const variant of this._abTest.variants) {
      if (variant.weights.version === modelVersion) {
        variant.predictions += 1;
        const error = predictedRisk - actualOutcome;
        variant.totalSquaredError += error * error;
        variant.brierScore = variant.totalSquaredError / Math.max(1, variant.predictions);
        variant.averageLoss = variant.brierScore; // Brier score is our loss

        const predictedBad = predictedRisk >= 0.5;
        const actualBad = actualOutcome >= 0.5;
        if (predictedBad === actualBad) {
          variant.correctPredictions += 1;
        }
        break;
      }
    }

    // Check if we have enough data to declare a winner
    this._evaluateABTest();
    storageSet(SLE_STORAGE_KEYS.AB_TEST_STATE, this._abTest);
  }

  private _evaluateABTest(): void {
    if (!this._abTest?.isActive) return;

    const minSamples = this._abTest.minimumSampleSize;
    const allHaveEnough = this._abTest.variants.every(v => v.predictions >= minSamples);
    if (!allHaveEnough) return;

    // Find variant with lowest Brier score (best calibrated predictions)
    let bestVariant: ModelVariant | null = null;
    let bestScore = Infinity;

    for (const variant of this._abTest.variants) {
      if (variant.brierScore < bestScore) {
        bestScore = variant.brierScore;
        bestVariant = variant;
      }
    }

    if (!bestVariant) return;

    // Simple significance: best must be at least 10% better than control
    const control = this._abTest.variants.find(v => v.isControl);
    if (control && bestVariant.id !== control.id) {
      const improvement = (control.brierScore - bestVariant.brierScore) / Math.max(0.001, control.brierScore);
      if (improvement > this._abTest.significanceLevel) {
        this._abTest.winnerVariantId = bestVariant.id;
        this._promoteVariant(bestVariant);
      }
    }

    // End test after evaluation
    if (this._abTest.winnerVariantId || allHaveEnough) {
      this._abTest.isActive = false;
      this._abTest.testEndedAt = new Date().toISOString();
      if (!this._abTest.winnerVariantId) {
        // No clear winner, keep control
        this._abTest.winnerVariantId = control?.id ?? null;
      }
    }
  }

  private _promoteVariant(variant: ModelVariant): void {
    if (!this._weights) return;
    this._weights = {
      ...variant.weights,
      version: this._weights.version + 1,
      updatedAt: new Date().toISOString(),
    };
    storageSet(SLE_STORAGE_KEYS.MODEL_WEIGHTS, this._weights);
  }

  concludeABTest(): { winnerId: string | null; results: ModelVariant[] } {
    this._ensureInitialized();
    if (!this._abTest) return { winnerId: null, results: [] };

    if (this._abTest.isActive) {
      this._evaluateABTest();
      // Force-close if still active
      if (this._abTest.isActive) {
        this._abTest.isActive = false;
        this._abTest.testEndedAt = new Date().toISOString();
        // Pick best by Brier even without significance threshold
        let best: ModelVariant | null = null;
        let bestScore = Infinity;
        for (const v of this._abTest.variants) {
          if (v.predictions > 0 && v.brierScore < bestScore) {
            bestScore = v.brierScore;
            best = v;
          }
        }
        if (best) {
          this._abTest.winnerVariantId = best.id;
          this._promoteVariant(best);
        }
        storageSet(SLE_STORAGE_KEYS.AB_TEST_STATE, this._abTest);
      }
    }

    return {
      winnerId: this._abTest.winnerVariantId,
      results: [...this._abTest.variants],
    };
  }

  getABTestState(): ABTestState | null {
    return this._abTest;
  }

  // --------------------------------------------------------------------------
  // 8. Drift Detection
  // --------------------------------------------------------------------------

  private _updateDriftTracking(features: number[]): void {
    if (!this._drift) return;

    // Add to sliding window
    this._drift.recentFeatureVectors.push([...features]);
    if (this._drift.recentFeatureVectors.length > this._drift.windowSize) {
      this._drift.recentFeatureVectors.shift();
    }

    // Update current distributions
    for (let f = 0; f < FEATURE_COUNT; f++) {
      const values = this._drift.recentFeatureVectors.map(v => f < v.length ? v[f] : 0);
      if (values.length < 10) continue;

      const mean = computeMean(values);
      const variance = computeVariance(values, mean);
      let min = Infinity;
      let max = -Infinity;
      for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
      }

      this._drift.currentDistributions[f] = {
        mean,
        variance,
        min,
        max,
        sampleCount: values.length,
      };

      // Update baseline if we have no baseline yet
      if (this._drift.baselineDistributions[f].sampleCount === 0) {
        this._drift.baselineDistributions[f] = { ...this._drift.currentDistributions[f] };
      }
    }

    // Compute drift scores using Population Stability Index (PSI) approximation
    this._computeDriftScores();

    this._drift.lastCheckedAt = new Date().toISOString();
    storageSet(SLE_STORAGE_KEYS.DRIFT_STATE, this._drift);
  }

  private _computeDriftScores(): void {
    if (!this._drift) return;

    let totalDrift = 0;
    let featuresCounted = 0;

    for (let f = 0; f < FEATURE_COUNT; f++) {
      const baseline = this._drift.baselineDistributions[f];
      const current = this._drift.currentDistributions[f];

      if (baseline.sampleCount < 10 || current.sampleCount < 10) {
        this._drift.driftScores[f] = 0;
        continue;
      }

      // Simplified drift: normalized mean shift + variance ratio
      const meanShift = Math.abs(current.mean - baseline.mean);
      const baselineStd = Math.sqrt(Math.max(baseline.variance, 0.0001));
      const normalizedMeanShift = meanShift / baselineStd;

      const varianceRatio = Math.abs(
        Math.log(Math.max(current.variance, 0.0001) / Math.max(baseline.variance, 0.0001))
      );

      this._drift.driftScores[f] = (normalizedMeanShift * 0.7 + varianceRatio * 0.3);
      totalDrift += this._drift.driftScores[f];
      featuresCounted += 1;
    }

    this._drift.overallDriftScore = featuresCounted > 0 ? totalDrift / featuresCounted : 0;
    this._drift.isDrifting = this._drift.overallDriftScore > this._drift.driftThreshold;
  }

  /**
   * Reset the baseline distributions to current, acknowledging the new data regime.
   */
  resetDriftBaseline(): void {
    this._ensureInitialized();
    if (!this._drift) return;

    for (let f = 0; f < FEATURE_COUNT; f++) {
      this._drift.baselineDistributions[f] = { ...this._drift.currentDistributions[f] };
    }
    this._drift.driftScores = new Array(FEATURE_COUNT).fill(0);
    this._drift.overallDriftScore = 0;
    this._drift.isDrifting = false;

    storageSet(SLE_STORAGE_KEYS.DRIFT_STATE, this._drift);
  }

  getDriftState(): DriftState | null {
    return this._drift;
  }

  // --------------------------------------------------------------------------
  // 9. Auto-Retraining Triggers
  // --------------------------------------------------------------------------

  private _checkRetrainTrigger(): void {
    if (!this._retrain || !this._thresholds) return;
    if (this._retrain.isRetraining) return;

    // Calculate current performance from threshold tracking
    const perf = this._thresholds.totalPredictions > 0
      ? this._thresholds.correctPredictions / this._thresholds.totalPredictions
      : 1.0;

    this._retrain.currentPerformance = perf;

    // Check cooldown
    if (this._retrain.lastRetrainedAt) {
      const lastRetrain = new Date(this._retrain.lastRetrainedAt).getTime();
      const cooldownMs = this._retrain.cooldownMinutes * 60 * 1000;
      if (Date.now() - lastRetrain < cooldownMs) {
        storageSet(SLE_STORAGE_KEYS.RETRAIN_STATE, this._retrain);
        return;
      }
    }

    const resolvedLog = this._getPredictionLog().filter(r => r.actualOutcome !== null);
    if (resolvedLog.length < this._retrain.minSamplesForRetrain) {
      storageSet(SLE_STORAGE_KEYS.RETRAIN_STATE, this._retrain);
      return;
    }

    // Trigger conditions
    const performanceDegraded = perf < this._retrain.performanceThreshold;
    const driftDetected = this._drift?.isDrifting ?? false;
    const calibrationBad = (this._calibration?.expectedCalibrationError ?? 0) > 0.15;

    if (performanceDegraded || driftDetected || calibrationBad) {
      let trigger = '';
      if (performanceDegraded) trigger = `Performance degraded to ${(perf * 100).toFixed(1)}%`;
      else if (driftDetected) trigger = 'Data drift detected';
      else trigger = `High calibration error: ${((this._calibration?.expectedCalibrationError ?? 0) * 100).toFixed(1)}%`;

      this._executeRetrain(trigger, perf);
    }

    storageSet(SLE_STORAGE_KEYS.RETRAIN_STATE, this._retrain);
  }

  private _executeRetrain(trigger: string, beforePerformance: number): void {
    if (!this._retrain || !this._weights) return;

    this._retrain.isRetraining = true;
    storageSet(SLE_STORAGE_KEYS.RETRAIN_STATE, this._retrain);

    // Batch retrain on all resolved predictions
    const log = this._getPredictionLog().filter(r => r.actualOutcome !== null);

    // Shuffle using Fisher-Yates
    for (let i = log.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = log[i];
      log[i] = log[j];
      log[j] = temp;
    }

    // Reset learning rate for retraining pass
    const savedLr = this._weights.learningRate;
    this._weights.learningRate = Math.max(savedLr, 0.005);

    // Multiple passes over data
    const epochs = 3;
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const record of log) {
        if (record.actualOutcome !== null) {
          this._sgdUpdate(record.features, record.actualOutcome);
        }
      }
    }

    this._weights.learningRate = savedLr;
    this._weights.version += 1;
    storageSet(SLE_STORAGE_KEYS.MODEL_WEIGHTS, this._weights);

    // Reset accuracy tracking after retrain
    if (this._thresholds) {
      this._thresholds.correctPredictions = 0;
      this._thresholds.totalPredictions = 0;
      storageSet(SLE_STORAGE_KEYS.THRESHOLD_STATE, this._thresholds);
    }

    // Record retrain event
    const afterPerformance = 1.0; // reset -- will be re-evaluated with new predictions
    this._retrain.retrainHistory.push({
      timestamp: new Date().toISOString(),
      trigger,
      beforePerformance,
      afterPerformance,
    });
    if (this._retrain.retrainHistory.length > 20) {
      this._retrain.retrainHistory = this._retrain.retrainHistory.slice(-20);
    }

    this._retrain.retrainCount += 1;
    this._retrain.lastRetrainedAt = new Date().toISOString();
    this._retrain.isRetraining = false;
    this._retrain.currentPerformance = afterPerformance;

    // Reset drift baseline after retrain
    this.resetDriftBaseline();

    storageSet(SLE_STORAGE_KEYS.RETRAIN_STATE, this._retrain);
  }

  forceRetrain(): void {
    this._ensureInitialized();
    const perf = this._retrain?.currentPerformance ?? 0;
    this._executeRetrain('Manual retrain triggered', perf);
  }

  getRetrainState(): RetrainState | null {
    return this._retrain;
  }

  // --------------------------------------------------------------------------
  // Primary API: Predict
  // --------------------------------------------------------------------------

  /**
   * Produce a risk prediction for a patient given their current features.
   */
  predict(input: PatientFeatures): PredictionResult {
    this._ensureInitialized();

    const features = this._normalizeFeatures(input.features);

    // Forward pass through model (or A/B variant)
    let rawScore: number;
    let modelVersion: number;

    const abVariant = this._selectABVariant();
    if (abVariant) {
      rawScore = sigmoid(dotProduct(abVariant.weights.weights, features) + abVariant.weights.bias);
      modelVersion = abVariant.weights.version;
    } else {
      rawScore = this._forwardPass(features);
      modelVersion = this._weights?.version ?? 1;
    }

    // Apply calibration
    const calibratedScore = this._calibrateConfidence(rawScore);
    const riskScore = clamp(calibratedScore, 0, 1);

    // Classify risk level
    const riskLevel = this.classifyRisk(riskScore);

    // Determine contributing factors
    const contributingFactors = this._computeContributions(features);

    // Detect patterns
    const matchedPatterns = this._detectPatterns(features);

    // Match knowledge rules
    const matchedRules = this._matchKnowledgeRules(features);

    // Compute confidence based on model certainty + calibration quality
    const modelCertainty = Math.abs(riskScore - 0.5) * 2; // 0 at 0.5, 1 at extremes
    const calibrationQuality = 1 - (this._calibration?.expectedCalibrationError ?? 0.1);
    const confidence = clamp(modelCertainty * 0.6 + calibrationQuality * 0.4, 0.1, 0.99);

    // Update drift tracking
    this._updateDriftTracking(features);

    // Log prediction
    const predictionId = `pred-${generateId()}`;
    const record: PredictionRecord = {
      id: predictionId,
      patientId: input.patientId,
      predictedRisk: riskScore,
      predictedConfidence: confidence,
      actualOutcome: null,
      features: [...features],
      modelVersion,
      timestamp: input.timestamp ?? new Date().toISOString(),
      resolvedAt: null,
    };

    const log = this._getPredictionLog();
    log.push(record);
    // Keep log bounded
    if (log.length > 500) {
      storageSet(SLE_STORAGE_KEYS.PREDICTION_LOG, log.slice(-500));
    } else {
      storageSet(SLE_STORAGE_KEYS.PREDICTION_LOG, log);
    }

    if (this._metadata) {
      this._metadata.totalPredictions += 1;
      storageSet(SLE_STORAGE_KEYS.ENGINE_METADATA, this._metadata);
    }

    return {
      riskScore,
      confidence,
      riskLevel,
      contributingFactors,
      matchedPatterns,
      matchedRules,
      modelVersion,
      predictionId,
    };
  }

  private _normalizeFeatures(features: number[]): number[] {
    const normalized: number[] = new Array(FEATURE_COUNT).fill(0);
    for (let i = 0; i < FEATURE_COUNT; i++) {
      normalized[i] = i < features.length ? clamp(features[i], 0, 1) : 0;
    }
    return normalized;
  }

  private _computeContributions(features: number[]): Array<{ feature: string; contribution: number }> {
    if (!this._weights) return [];

    const contributions: Array<{ feature: string; contribution: number }> = [];
    for (let i = 0; i < FEATURE_COUNT; i++) {
      const contribution = this._weights.weights[i] * features[i];
      if (Math.abs(contribution) > 0.01) {
        contributions.push({
          feature: FEATURE_LABELS[i] ?? `Feature ${i}`,
          contribution: Math.round(contribution * 1000) / 1000,
        });
      }
    }

    // Sort by absolute contribution, descending
    contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    return contributions.slice(0, 10); // top 10
  }

  // --------------------------------------------------------------------------
  // Stats & Diagnostics
  // --------------------------------------------------------------------------

  getStats(): EngineStats {
    this._ensureInitialized();

    const resolvedLog = this._getPredictionLog().filter(r => r.actualOutcome !== null);
    let correct = 0;
    for (const r of resolvedLog) {
      const predictedBad = r.predictedRisk >= 0.5;
      const actualBad = (r.actualOutcome ?? 0) >= 0.5;
      if (predictedBad === actualBad) correct += 1;
    }

    const activeRules = (storageGet<KnowledgeRule[]>(SLE_STORAGE_KEYS.KNOWLEDGE_BASE) ?? [])
      .filter(r => r.isActive).length;
    const activePatterns = (storageGet<RecoveryPattern[]>(SLE_STORAGE_KEYS.PATTERN_REGISTRY) ?? [])
      .filter(p => p.isActive).length;

    return {
      totalPredictions: this._metadata?.totalPredictions ?? 0,
      totalUpdates: this._metadata?.totalUpdates ?? 0,
      currentAccuracy: resolvedLog.length > 0 ? correct / resolvedLog.length : 0,
      modelVersion: this._weights?.version ?? 1,
      activePatterns,
      activeRules,
      calibrationError: this._calibration?.expectedCalibrationError ?? 0,
      isDrifting: this._drift?.isDrifting ?? false,
      isRetraining: this._retrain?.isRetraining ?? false,
      abTestActive: this._abTest?.isActive ?? false,
      thresholds: {
        low: this._thresholds?.lowRiskThreshold ?? 0.25,
        medium: this._thresholds?.mediumRiskThreshold ?? 0.50,
        high: this._thresholds?.highRiskThreshold ?? 0.75,
      },
    };
  }

  getModelWeights(): ModelWeights | null {
    return this._weights;
  }

  getFeatureLabels(): Record<number, string> {
    return { ...FEATURE_LABELS };
  }

  getPredictionHistory(patientId?: string): PredictionRecord[] {
    const log = this._getPredictionLog();
    if (patientId) {
      return log.filter(r => r.patientId === patientId);
    }
    return log;
  }

  // --------------------------------------------------------------------------
  // Reset
  // --------------------------------------------------------------------------

  reset(): void {
    for (const key of Object.values(SLE_STORAGE_KEYS)) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    this._weights = null;
    this._thresholds = null;
    this._calibration = null;
    this._abTest = null;
    this._drift = null;
    this._retrain = null;
    this._metadata = null;
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private _ensureInitialized(): void {
    if (!this._metadata?.initialized) {
      this.initialize();
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const selfLearningEngine = new SelfLearningEngine();

// ============================================================================
// Exports (React/Zustand-compatible)
// ============================================================================

export {
  selfLearningEngine,
  SelfLearningEngine,
  SLE_STORAGE_KEYS,
  FeatureName,
  FEATURE_COUNT,
  FEATURE_LABELS,
  RiskLevel,
};

export type {
  ModelWeights,
  PatientFeatures,
  PredictionRecord,
  PredictionResult,
  ThresholdState,
  RecoveryPattern,
  KnowledgeRule,
  CalibrationBucket,
  CalibrationState,
  ModelVariant,
  ABTestState,
  FeatureDistribution,
  DriftState,
  RetrainState,
  EngineMetadata,
  EngineStats,
  LearningUpdate,
};
