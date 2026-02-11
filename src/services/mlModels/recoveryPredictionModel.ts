// ============================================================================
// Recovery Prediction Model
//
// A from-scratch implementation of logistic regression and decision tree models
// for predicting post-operative patient recovery timelines. Uses gradient
// descent optimization, cross-validation, and confidence interval estimation.
//
// No external ML libraries are used. All math is implemented directly.
// ============================================================================

// ============================================================================
// Types
// ============================================================================

/**
 * Surgery categories recognized by the model
 */
export const SurgeryType = {
  KNEE_REPLACEMENT: 'knee_replacement',
  HIP_REPLACEMENT: 'hip_replacement',
  ACL_RECONSTRUCTION: 'acl_reconstruction',
  ROTATOR_CUFF_REPAIR: 'rotator_cuff_repair',
  SPINAL_FUSION: 'spinal_fusion',
  APPENDECTOMY: 'appendectomy',
  CHOLECYSTECTOMY: 'cholecystectomy',
  HERNIA_REPAIR: 'hernia_repair',
  CARDIAC_BYPASS: 'cardiac_bypass',
  CESAREAN_SECTION: 'cesarean_section',
} as const;
export type SurgeryType = typeof SurgeryType[keyof typeof SurgeryType];

/**
 * Recovery outcome categories (target variable)
 */
export const RecoveryOutcome = {
  FASTER_THAN_EXPECTED: 'faster_than_expected',
  ON_TRACK: 'on_track',
  DELAYED: 'delayed',
  SIGNIFICANTLY_DELAYED: 'significantly_delayed',
} as const;
export type RecoveryOutcome = typeof RecoveryOutcome[keyof typeof RecoveryOutcome];

/**
 * Comorbidity flags
 */
export interface Comorbidities {
  diabetes: boolean;
  hypertension: boolean;
  obesity: boolean;       // BMI >= 30
  smoking: boolean;
  heartDisease: boolean;
  osteoporosis: boolean;
  immunocompromised: boolean;
}

/**
 * Raw patient record used for training and prediction
 */
export interface PatientRecord {
  id: string;
  age: number;                      // years
  bmi: number;                      // kg/m^2
  surgeryType: SurgeryType;
  comorbidities: Comorbidities;
  complianceRate: number;           // 0-1 (fraction of completed missions)
  woundHealingScore: number;        // 1-10 (clinician-assessed or triage-derived)
  daysSinceSurgery: number;
  painLevel: number;                // 0-10
  physicalTherapySessions: number;  // completed so far
  sleepQualityScore: number;        // 1-10
  outcome: RecoveryOutcome;
  actualRecoveryDays: number;       // ground truth
}

/**
 * Numeric feature vector after encoding
 */
export interface FeatureVector {
  features: number[];
  featureNames: string[];
}

/**
 * Result from a single prediction
 */
export interface PredictionResult {
  outcome: RecoveryOutcome;
  probabilities: Record<RecoveryOutcome, number>;
  estimatedRecoveryDays: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidenceLevel: number;       // e.g. 0.95
  };
  riskFactors: string[];
  featureImportance: Record<string, number>;
}

/**
 * Model evaluation metrics
 */
export interface EvaluationMetrics {
  accuracy: number;
  precision: Record<RecoveryOutcome, number>;
  recall: Record<RecoveryOutcome, number>;
  f1: Record<RecoveryOutcome, number>;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  confusionMatrix: number[][];
  sampleSize: number;
}

/**
 * Cross-validation results
 */
export interface CrossValidationResult {
  foldMetrics: EvaluationMetrics[];
  averageAccuracy: number;
  stdAccuracy: number;
  averageMacroF1: number;
  stdMacroF1: number;
}

/**
 * Hyperparameters for logistic regression
 */
export interface LogisticRegressionParams {
  learningRate: number;
  epochs: number;
  regularizationStrength: number;   // L2 penalty
  convergenceThreshold: number;
  batchSize: number | null;         // null = full batch
}

/**
 * Decision tree node
 */
export interface DecisionTreeNode {
  featureIndex: number | null;
  threshold: number | null;
  left: DecisionTreeNode | null;
  right: DecisionTreeNode | null;
  classCounts: number[] | null;     // leaf only
  prediction: number | null;        // leaf only
}

/**
 * Serializable model state for persistence
 */
export interface SerializedModelState {
  version: string;
  trainedAt: string;
  logisticWeights: number[][];      // [numClasses][numFeatures+1]
  decisionTree: DecisionTreeNode | null;
  featureNames: string[];
  featureMeans: number[];
  featureStds: number[];
  classMappings: RecoveryOutcome[];
  baselineRecoveryDays: Record<SurgeryType, number>;
  hyperparams: LogisticRegressionParams;
  trainingMetrics: EvaluationMetrics | null;
}

// ============================================================================
// Constants
// ============================================================================

const MODEL_VERSION = '1.0.0';
const STORAGE_KEY = 'recovery_pilot_ml_model';
const OUTCOME_CLASSES: RecoveryOutcome[] = [
  RecoveryOutcome.FASTER_THAN_EXPECTED,
  RecoveryOutcome.ON_TRACK,
  RecoveryOutcome.DELAYED,
  RecoveryOutcome.SIGNIFICANTLY_DELAYED,
];
const NUM_CLASSES = OUTCOME_CLASSES.length;

/**
 * Median expected recovery times by surgery type (in days).
 * Based on published orthopedic and general surgery literature.
 */
const BASELINE_RECOVERY_DAYS: Record<SurgeryType, number> = {
  [SurgeryType.KNEE_REPLACEMENT]: 90,
  [SurgeryType.HIP_REPLACEMENT]: 84,
  [SurgeryType.ACL_RECONSTRUCTION]: 180,
  [SurgeryType.ROTATOR_CUFF_REPAIR]: 120,
  [SurgeryType.SPINAL_FUSION]: 180,
  [SurgeryType.APPENDECTOMY]: 21,
  [SurgeryType.CHOLECYSTECTOMY]: 28,
  [SurgeryType.HERNIA_REPAIR]: 35,
  [SurgeryType.CARDIAC_BYPASS]: 84,
  [SurgeryType.CESAREAN_SECTION]: 42,
};

const DEFAULT_HYPERPARAMS: LogisticRegressionParams = {
  learningRate: 0.01,
  epochs: 500,
  regularizationStrength: 0.001,
  convergenceThreshold: 1e-6,
  batchSize: null,
};

// ============================================================================
// Feature Names (constant ordering)
// ============================================================================

const FEATURE_NAMES: string[] = [
  'age_normalized',
  'bmi_normalized',
  'compliance_rate',
  'wound_healing_score',
  'days_since_surgery_normalized',
  'pain_level_normalized',
  'pt_sessions_normalized',
  'sleep_quality_normalized',
  'comorbidity_count',
  'has_diabetes',
  'has_hypertension',
  'has_obesity',
  'is_smoker',
  'has_heart_disease',
  'has_osteoporosis',
  'is_immunocompromised',
  // one-hot encoded surgery types (10 types)
  'surgery_knee_replacement',
  'surgery_hip_replacement',
  'surgery_acl_reconstruction',
  'surgery_rotator_cuff_repair',
  'surgery_spinal_fusion',
  'surgery_appendectomy',
  'surgery_cholecystectomy',
  'surgery_hernia_repair',
  'surgery_cardiac_bypass',
  'surgery_cesarean_section',
  // interaction features
  'age_x_comorbidity',
  'compliance_x_wound_healing',
  'bmi_x_pain',
];

const SURGERY_TYPES_LIST: SurgeryType[] = [
  SurgeryType.KNEE_REPLACEMENT,
  SurgeryType.HIP_REPLACEMENT,
  SurgeryType.ACL_RECONSTRUCTION,
  SurgeryType.ROTATOR_CUFF_REPAIR,
  SurgeryType.SPINAL_FUSION,
  SurgeryType.APPENDECTOMY,
  SurgeryType.CHOLECYSTECTOMY,
  SurgeryType.HERNIA_REPAIR,
  SurgeryType.CARDIAC_BYPASS,
  SurgeryType.CESAREAN_SECTION,
];

// ============================================================================
// Math Utilities
// ============================================================================

function sigmoid(x: number): number {
  if (x >= 0) {
    const ez = Math.exp(-x);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(x);
  return ez / (1 + ez);
}

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Deterministic for reproducible results in training.
 */
function createRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle with seeded RNG
 */
function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Z-score for confidence intervals (normal approximation)
 */
function zScore(confidence: number): number {
  // Common z-scores
  if (confidence >= 0.99) return 2.576;
  if (confidence >= 0.95) return 1.96;
  if (confidence >= 0.90) return 1.645;
  // Approximate using inverse normal for other values
  const p = (1 + confidence) / 2;
  const t = Math.sqrt(-2 * Math.log(1 - p));
  return t - (2.515517 + 0.802853 * t + 0.010328 * t * t) /
    (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
}

// ============================================================================
// Synthetic Training Data
// ============================================================================

/**
 * Generate realistic synthetic patient records based on published recovery
 * patterns. Relationships between features and outcomes are modeled after:
 * - Age-related healing delays (Gosain & DiPietro, 2004)
 * - BMI impact on surgical outcomes (Bamgbade et al., 2007)
 * - Compliance effect on recovery (Jack et al., 2010)
 * - Comorbidity risk factors (Bohl et al., 2016)
 */
function generateSyntheticData(count: number, seed: number = 42): PatientRecord[] {
  const rng = createRng(seed);
  const records: PatientRecord[] = [];

  for (let i = 0; i < count; i++) {
    const age = Math.floor(25 + rng() * 55);                   // 25-79
    const bmi = 18.5 + rng() * 22;                             // 18.5-40.5
    const surgeryType = SURGERY_TYPES_LIST[Math.floor(rng() * SURGERY_TYPES_LIST.length)];
    const baselineDays = BASELINE_RECOVERY_DAYS[surgeryType];

    // Comorbidities are more likely with higher age and BMI
    const comorbidityRisk = (age - 25) / 55 * 0.4 + (bmi - 18.5) / 22 * 0.3;
    const comorbidities: Comorbidities = {
      diabetes: rng() < (comorbidityRisk * 0.6 + 0.05),
      hypertension: rng() < (comorbidityRisk * 0.7 + 0.08),
      obesity: bmi >= 30,
      smoking: rng() < 0.15,
      heartDisease: rng() < (comorbidityRisk * 0.3 + 0.02),
      osteoporosis: rng() < (age > 60 ? 0.25 : 0.05),
      immunocompromised: rng() < 0.04,
    };

    const comorbidityCnt = Object.values(comorbidities).filter(Boolean).length;

    // Compliance is inversely related to pain and positively related to motivation
    const baseCompliance = 0.5 + rng() * 0.5;
    const complianceRate = Math.max(0.1, Math.min(1.0,
      baseCompliance - comorbidityCnt * 0.04 + (rng() - 0.5) * 0.2
    ));

    // Days since surgery (uniformly distributed within expected recovery window)
    const daysSinceSurgery = Math.floor(rng() * baselineDays * 1.3) + 1;

    // Pain level depends on days since surgery, age, comorbidities
    const surgeryProgress = Math.min(daysSinceSurgery / baselineDays, 1.5);
    const basePain = Math.max(0, 8 - surgeryProgress * 6 + (rng() - 0.5) * 3);
    const painLevel = Math.min(10, Math.max(0,
      Math.round(basePain + comorbidityCnt * 0.5 + (comorbidities.smoking ? 1 : 0))
    ));

    // PT sessions depend on days since surgery and compliance
    const expectedPtSessions = Math.floor(daysSinceSurgery / 3.5);
    const physicalTherapySessions = Math.max(0,
      Math.floor(expectedPtSessions * complianceRate + (rng() - 0.5) * 3)
    );

    // Wound healing: depends on age, BMI, comorbidities, compliance, time
    const healingBase = Math.min(10, 2 + surgeryProgress * 7);
    const woundHealingScore = Math.min(10, Math.max(1, Math.round(
      healingBase
      - (age > 65 ? 1.5 : 0)
      - (bmi > 35 ? 1.2 : bmi > 30 ? 0.6 : 0)
      - comorbidityCnt * 0.4
      + complianceRate * 1.5
      + (rng() - 0.5) * 2
    )));

    const sleepQualityScore = Math.min(10, Math.max(1, Math.round(
      7 - painLevel * 0.4 + complianceRate * 1.5 + (rng() - 0.5) * 2
    )));

    // Determine actual recovery days based on realistic factors
    let recoveryMultiplier = 1.0;

    // Age factor: each year over 50 adds ~0.8% delay
    if (age > 50) recoveryMultiplier += (age - 50) * 0.008;

    // BMI factor
    if (bmi > 30) recoveryMultiplier += (bmi - 30) * 0.015;
    if (bmi > 35) recoveryMultiplier += 0.05;

    // Comorbidity factors
    if (comorbidities.diabetes) recoveryMultiplier += 0.15;
    if (comorbidities.hypertension) recoveryMultiplier += 0.05;
    if (comorbidities.smoking) recoveryMultiplier += 0.20;
    if (comorbidities.heartDisease) recoveryMultiplier += 0.12;
    if (comorbidities.osteoporosis) recoveryMultiplier += 0.10;
    if (comorbidities.immunocompromised) recoveryMultiplier += 0.25;

    // Compliance benefit: high compliance reduces recovery time
    recoveryMultiplier -= (complianceRate - 0.5) * 0.3;

    // Noise
    recoveryMultiplier += (rng() - 0.5) * 0.2;
    recoveryMultiplier = Math.max(0.6, recoveryMultiplier);

    const actualRecoveryDays = Math.round(baselineDays * recoveryMultiplier);

    // Classify outcome based on ratio to baseline
    const ratio = actualRecoveryDays / baselineDays;
    let outcome: RecoveryOutcome;
    if (ratio < 0.85) {
      outcome = RecoveryOutcome.FASTER_THAN_EXPECTED;
    } else if (ratio <= 1.1) {
      outcome = RecoveryOutcome.ON_TRACK;
    } else if (ratio <= 1.35) {
      outcome = RecoveryOutcome.DELAYED;
    } else {
      outcome = RecoveryOutcome.SIGNIFICANTLY_DELAYED;
    }

    records.push({
      id: `synth-${String(i).padStart(4, '0')}`,
      age,
      bmi: Math.round(bmi * 10) / 10,
      surgeryType,
      comorbidities,
      complianceRate: Math.round(complianceRate * 100) / 100,
      woundHealingScore,
      daysSinceSurgery,
      painLevel,
      physicalTherapySessions,
      sleepQualityScore,
      outcome,
      actualRecoveryDays,
    });
  }

  return records;
}

// Pre-generated training dataset (120 records)
const TRAINING_DATA: PatientRecord[] = generateSyntheticData(120, 42);

// ============================================================================
// Feature Engineering
// ============================================================================

function countComorbidities(c: Comorbidities): number {
  return [c.diabetes, c.hypertension, c.obesity, c.smoking,
    c.heartDisease, c.osteoporosis, c.immunocompromised]
    .filter(Boolean).length;
}

/**
 * Extract raw feature vector from a patient record (before normalization).
 */
function extractRawFeatures(record: PatientRecord): number[] {
  const c = record.comorbidities;
  const comorbCount = countComorbidities(c);

  // Base features
  const features: number[] = [
    record.age,
    record.bmi,
    record.complianceRate,
    record.woundHealingScore,
    record.daysSinceSurgery,
    record.painLevel,
    record.physicalTherapySessions,
    record.sleepQualityScore,
    comorbCount,
    c.diabetes ? 1 : 0,
    c.hypertension ? 1 : 0,
    c.obesity ? 1 : 0,
    c.smoking ? 1 : 0,
    c.heartDisease ? 1 : 0,
    c.osteoporosis ? 1 : 0,
    c.immunocompromised ? 1 : 0,
  ];

  // One-hot encode surgery type
  for (const st of SURGERY_TYPES_LIST) {
    features.push(record.surgeryType === st ? 1 : 0);
  }

  // Interaction features
  features.push(record.age * comorbCount);                       // age x comorbidity
  features.push(record.complianceRate * record.woundHealingScore); // compliance x wound healing
  features.push(record.bmi * record.painLevel);                  // bmi x pain

  return features;
}

/**
 * Compute per-feature mean and standard deviation from a dataset
 */
function computeNormalizationParams(
  records: PatientRecord[]
): { means: number[]; stds: number[] } {
  const allFeatures = records.map(r => extractRawFeatures(r));
  const numFeatures = allFeatures[0].length;
  const means: number[] = [];
  const stds: number[] = [];

  for (let f = 0; f < numFeatures; f++) {
    const col = allFeatures.map(row => row[f]);
    const m = mean(col);
    let s = stddev(col);
    if (s < 1e-8) s = 1; // prevent division by zero for constant features
    means.push(m);
    stds.push(s);
  }

  return { means, stds };
}

/**
 * Normalize a raw feature vector using z-score normalization
 */
function normalizeFeatures(
  raw: number[],
  featureMeans: number[],
  featureStds: number[]
): number[] {
  return raw.map((val, i) => (val - featureMeans[i]) / featureStds[i]);
}

/**
 * Extract and normalize features from a patient record
 */
function extractFeatures(
  record: PatientRecord,
  featureMeans: number[],
  featureStds: number[]
): FeatureVector {
  const raw = extractRawFeatures(record);
  const normalized = normalizeFeatures(raw, featureMeans, featureStds);
  return { features: normalized, featureNames: FEATURE_NAMES };
}

// ============================================================================
// Logistic Regression (Multinomial via Softmax + Gradient Descent)
// ============================================================================

/**
 * Initialize weight matrix with small random values (Xavier initialization)
 */
function initializeWeights(
  numClasses: number,
  numFeatures: number,
  rng: () => number
): number[][] {
  const scale = Math.sqrt(2.0 / (numFeatures + numClasses));
  const weights: number[][] = [];
  for (let c = 0; c < numClasses; c++) {
    const row: number[] = [];
    // +1 for bias term
    for (let f = 0; f < numFeatures + 1; f++) {
      row.push((rng() - 0.5) * 2 * scale);
    }
    weights.push(row);
  }
  return weights;
}

/**
 * Predict class probabilities using current weights
 */
function predictProbabilities(
  features: number[],
  weights: number[][]
): number[] {
  // Prepend bias term (1.0)
  const x = [1.0, ...features];
  const logits = weights.map(w => dotProduct(w, x));
  return softmax(logits);
}

/**
 * Compute cross-entropy loss with L2 regularization
 */
function computeLoss(
  data: { features: number[]; label: number }[],
  weights: number[][],
  lambda: number
): number {
  let totalLoss = 0;
  const n = data.length;

  for (const sample of data) {
    const probs = predictProbabilities(sample.features, weights);
    const prob = Math.max(probs[sample.label], 1e-15);
    totalLoss -= Math.log(prob);
  }

  // L2 regularization
  let regTerm = 0;
  for (const row of weights) {
    for (let i = 1; i < row.length; i++) { // skip bias
      regTerm += row[i] * row[i];
    }
  }

  return totalLoss / n + (lambda / 2) * regTerm;
}

/**
 * Train logistic regression using mini-batch gradient descent
 */
function trainLogisticRegression(
  trainingData: { features: number[]; label: number }[],
  params: LogisticRegressionParams,
  numFeatures: number,
  seed: number = 123
): { weights: number[][]; lossHistory: number[] } {
  const rng = createRng(seed);
  const weights = initializeWeights(NUM_CLASSES, numFeatures, rng);
  const lossHistory: number[] = [];
  let prevLoss = Infinity;

  for (let epoch = 0; epoch < params.epochs; epoch++) {
    // Shuffle data each epoch
    const shuffled = shuffleArray(trainingData, rng);
    const batchSize = params.batchSize ?? shuffled.length;

    for (let batchStart = 0; batchStart < shuffled.length; batchStart += batchSize) {
      const batch = shuffled.slice(batchStart, batchStart + batchSize);

      // Accumulate gradients
      const gradients: number[][] = weights.map(row => new Array(row.length).fill(0));

      for (const sample of batch) {
        const x = [1.0, ...sample.features];
        const probs = predictProbabilities(sample.features, weights);

        for (let c = 0; c < NUM_CLASSES; c++) {
          const error = probs[c] - (c === sample.label ? 1 : 0);
          for (let j = 0; j < x.length; j++) {
            gradients[c][j] += error * x[j] / batch.length;
          }
        }
      }

      // Update weights with gradient descent + L2 regularization
      for (let c = 0; c < NUM_CLASSES; c++) {
        for (let j = 0; j < weights[c].length; j++) {
          const reg = j === 0 ? 0 : params.regularizationStrength * weights[c][j];
          weights[c][j] -= params.learningRate * (gradients[c][j] + reg);
        }
      }
    }

    // Track loss
    const loss = computeLoss(trainingData, weights, params.regularizationStrength);
    lossHistory.push(loss);

    // Check convergence
    if (Math.abs(prevLoss - loss) < params.convergenceThreshold) {
      break;
    }
    prevLoss = loss;
  }

  return { weights, lossHistory };
}

// ============================================================================
// Decision Tree (CART - Classification And Regression Trees)
// ============================================================================

/**
 * Compute Gini impurity for a set of class counts
 */
function giniImpurity(classCounts: number[], total: number): number {
  if (total === 0) return 0;
  let impurity = 1;
  for (const count of classCounts) {
    const p = count / total;
    impurity -= p * p;
  }
  return impurity;
}

/**
 * Count class occurrences in a dataset slice
 */
function countClasses(labels: number[], numClasses: number): number[] {
  const counts = new Array(numClasses).fill(0);
  for (const label of labels) {
    counts[label]++;
  }
  return counts;
}

/**
 * Find the best split for a node
 */
function findBestSplit(
  features: number[][],
  labels: number[],
  numClasses: number
): { featureIndex: number; threshold: number; gain: number } | null {
  const n = features.length;
  if (n < 2) return null;

  const parentCounts = countClasses(labels, numClasses);
  const parentGini = giniImpurity(parentCounts, n);

  let bestGain = 0;
  let bestFeatureIndex = -1;
  let bestThreshold = 0;

  const numFeatures = features[0].length;

  for (let f = 0; f < numFeatures; f++) {
    // Get sorted unique values for this feature
    const values = features.map(row => row[f]);
    const sortedUnique = [...new Set(values)].sort((a, b) => a - b);

    for (let i = 0; i < sortedUnique.length - 1; i++) {
      const threshold = (sortedUnique[i] + sortedUnique[i + 1]) / 2;

      const leftLabels: number[] = [];
      const rightLabels: number[] = [];

      for (let j = 0; j < n; j++) {
        if (features[j][f] <= threshold) {
          leftLabels.push(labels[j]);
        } else {
          rightLabels.push(labels[j]);
        }
      }

      if (leftLabels.length === 0 || rightLabels.length === 0) continue;

      const leftGini = giniImpurity(countClasses(leftLabels, numClasses), leftLabels.length);
      const rightGini = giniImpurity(countClasses(rightLabels, numClasses), rightLabels.length);

      const weightedGini = (leftLabels.length / n) * leftGini +
        (rightLabels.length / n) * rightGini;
      const gain = parentGini - weightedGini;

      if (gain > bestGain) {
        bestGain = gain;
        bestFeatureIndex = f;
        bestThreshold = threshold;
      }
    }
  }

  if (bestFeatureIndex === -1) return null;
  return { featureIndex: bestFeatureIndex, threshold: bestThreshold, gain: bestGain };
}

/**
 * Build a decision tree recursively
 */
function buildDecisionTree(
  features: number[][],
  labels: number[],
  numClasses: number,
  depth: number = 0,
  maxDepth: number = 8,
  minSamplesLeaf: number = 5
): DecisionTreeNode {
  const classCounts = countClasses(labels, numClasses);
  const prediction = classCounts.indexOf(Math.max(...classCounts));

  // Stop conditions
  if (
    depth >= maxDepth ||
    labels.length < minSamplesLeaf * 2 ||
    new Set(labels).size === 1
  ) {
    return {
      featureIndex: null,
      threshold: null,
      left: null,
      right: null,
      classCounts,
      prediction,
    };
  }

  const split = findBestSplit(features, labels, numClasses);
  if (!split || split.gain < 1e-6) {
    return {
      featureIndex: null,
      threshold: null,
      left: null,
      right: null,
      classCounts,
      prediction,
    };
  }

  const leftFeatures: number[][] = [];
  const leftLabels: number[] = [];
  const rightFeatures: number[][] = [];
  const rightLabels: number[] = [];

  for (let i = 0; i < features.length; i++) {
    if (features[i][split.featureIndex] <= split.threshold) {
      leftFeatures.push(features[i]);
      leftLabels.push(labels[i]);
    } else {
      rightFeatures.push(features[i]);
      rightLabels.push(labels[i]);
    }
  }

  return {
    featureIndex: split.featureIndex,
    threshold: split.threshold,
    left: buildDecisionTree(leftFeatures, leftLabels, numClasses, depth + 1, maxDepth, minSamplesLeaf),
    right: buildDecisionTree(rightFeatures, rightLabels, numClasses, depth + 1, maxDepth, minSamplesLeaf),
    classCounts: null,
    prediction: null,
  };
}

/**
 * Traverse a decision tree to get leaf class counts
 */
function treePredict(node: DecisionTreeNode, features: number[]): number[] {
  if (node.left === null || node.right === null || node.featureIndex === null || node.threshold === null) {
    return node.classCounts ?? new Array(NUM_CLASSES).fill(0);
  }

  if (features[node.featureIndex] <= node.threshold) {
    return treePredict(node.left, features);
  } else {
    return treePredict(node.right, features);
  }
}

// ============================================================================
// Model Evaluation
// ============================================================================

/**
 * Compute evaluation metrics from predictions and ground truth
 */
function computeMetrics(
  predictions: number[],
  actuals: number[]
): EvaluationMetrics {
  const n = predictions.length;
  let correct = 0;

  // Confusion matrix [actual][predicted]
  const confusionMatrix: number[][] = Array.from({ length: NUM_CLASSES },
    () => new Array(NUM_CLASSES).fill(0));

  for (let i = 0; i < n; i++) {
    confusionMatrix[actuals[i]][predictions[i]]++;
    if (predictions[i] === actuals[i]) correct++;
  }

  const accuracy = correct / n;

  // Per-class metrics
  const precision: Record<string, number> = {};
  const recall: Record<string, number> = {};
  const f1: Record<string, number> = {};

  for (let c = 0; c < NUM_CLASSES; c++) {
    const tp = confusionMatrix[c][c];
    let fp = 0;
    let fn = 0;

    for (let i = 0; i < NUM_CLASSES; i++) {
      if (i !== c) {
        fp += confusionMatrix[i][c]; // predicted as c but actually i
        fn += confusionMatrix[c][i]; // actually c but predicted as i
      }
    }

    const p = tp + fp > 0 ? tp / (tp + fp) : 0;
    const r = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f = p + r > 0 ? 2 * p * r / (p + r) : 0;

    precision[OUTCOME_CLASSES[c]] = Math.round(p * 1000) / 1000;
    recall[OUTCOME_CLASSES[c]] = Math.round(r * 1000) / 1000;
    f1[OUTCOME_CLASSES[c]] = Math.round(f * 1000) / 1000;
  }

  const macroP = mean(Object.values(precision));
  const macroR = mean(Object.values(recall));
  const macroF = macroP + macroR > 0 ? 2 * macroP * macroR / (macroP + macroR) : 0;

  return {
    accuracy: Math.round(accuracy * 1000) / 1000,
    precision: precision as Record<RecoveryOutcome, number>,
    recall: recall as Record<RecoveryOutcome, number>,
    f1: f1 as Record<RecoveryOutcome, number>,
    macroPrecision: Math.round(macroP * 1000) / 1000,
    macroRecall: Math.round(macroR * 1000) / 1000,
    macroF1: Math.round(macroF * 1000) / 1000,
    confusionMatrix,
    sampleSize: n,
  };
}

// ============================================================================
// Recovery Prediction Model Class
// ============================================================================

export class RecoveryPredictionModel {
  private weights: number[][] = [];
  private decisionTree: DecisionTreeNode | null = null;
  private featureMeans: number[] = [];
  private featureStds: number[] = [];
  private trained: boolean = false;
  private trainedAt: string | null = null;
  private hyperparams: LogisticRegressionParams;
  private trainingMetrics: EvaluationMetrics | null = null;

  constructor(params?: Partial<LogisticRegressionParams>) {
    this.hyperparams = { ...DEFAULT_HYPERPARAMS, ...params };
  }

  // --------------------------------------------------------------------------
  // Training
  // --------------------------------------------------------------------------

  /**
   * Train the model on the embedded synthetic dataset (or custom data).
   * Trains both a logistic regression model and a decision tree,
   * then ensembles their predictions.
   */
  train(data?: PatientRecord[]): {
    metrics: EvaluationMetrics;
    lossHistory: number[];
  } {
    const records = data ?? TRAINING_DATA;
    if (records.length < 10) {
      throw new Error('Insufficient training data. Need at least 10 records.');
    }

    // Compute normalization parameters
    const { means, stds } = computeNormalizationParams(records);
    this.featureMeans = means;
    this.featureStds = stds;

    // Extract features and labels
    const featureVectors = records.map(r =>
      extractFeatures(r, this.featureMeans, this.featureStds)
    );
    const labels = records.map(r => OUTCOME_CLASSES.indexOf(r.outcome));
    const trainingSet = featureVectors.map((fv, i) => ({
      features: fv.features,
      label: labels[i],
    }));

    // Train logistic regression
    const { weights, lossHistory } = trainLogisticRegression(
      trainingSet,
      this.hyperparams,
      FEATURE_NAMES.length,
    );
    this.weights = weights;

    // Train decision tree
    const featureMatrix = featureVectors.map(fv => fv.features);
    this.decisionTree = buildDecisionTree(featureMatrix, labels, NUM_CLASSES, 0, 8, 5);

    // Evaluate on training data
    const predictions = featureVectors.map(fv => this.predictClassIndex(fv.features));
    this.trainingMetrics = computeMetrics(predictions, labels);

    this.trained = true;
    this.trainedAt = new Date().toISOString();

    return { metrics: this.trainingMetrics, lossHistory };
  }

  /**
   * Predict class index using ensemble of logistic regression + decision tree
   */
  private predictClassIndex(features: number[]): number {
    // Logistic regression probabilities
    const lrProbs = predictProbabilities(features, this.weights);

    // Decision tree probabilities
    let treeProbs: number[];
    if (this.decisionTree) {
      const treeCounts = treePredict(this.decisionTree, features);
      const treeTotal = treeCounts.reduce((a, b) => a + b, 0);
      treeProbs = treeTotal > 0
        ? treeCounts.map(c => c / treeTotal)
        : new Array(NUM_CLASSES).fill(1 / NUM_CLASSES);
    } else {
      treeProbs = new Array(NUM_CLASSES).fill(1 / NUM_CLASSES);
    }

    // Ensemble: weighted average (70% LR, 30% DT)
    const ensembleProbs = lrProbs.map((p, i) => 0.7 * p + 0.3 * treeProbs[i]);
    return ensembleProbs.indexOf(Math.max(...ensembleProbs));
  }

  /**
   * Get full probability distribution using ensemble
   */
  private predictEnsembleProbabilities(features: number[]): number[] {
    const lrProbs = predictProbabilities(features, this.weights);

    let treeProbs: number[];
    if (this.decisionTree) {
      const treeCounts = treePredict(this.decisionTree, features);
      const treeTotal = treeCounts.reduce((a, b) => a + b, 0);
      treeProbs = treeTotal > 0
        ? treeCounts.map(c => c / treeTotal)
        : new Array(NUM_CLASSES).fill(1 / NUM_CLASSES);
    } else {
      treeProbs = new Array(NUM_CLASSES).fill(1 / NUM_CLASSES);
    }

    return lrProbs.map((p, i) => 0.7 * p + 0.3 * treeProbs[i]);
  }

  // --------------------------------------------------------------------------
  // Prediction
  // --------------------------------------------------------------------------

  /**
   * Generate a full prediction for a patient, including confidence intervals
   * and risk factor analysis.
   */
  predict(patient: Omit<PatientRecord, 'id' | 'outcome' | 'actualRecoveryDays'> & {
    id?: string;
    outcome?: RecoveryOutcome;
    actualRecoveryDays?: number;
  }): PredictionResult {
    if (!this.trained) {
      throw new Error('Model must be trained before making predictions. Call train() first.');
    }

    const record: PatientRecord = {
      id: patient.id ?? 'predict-input',
      outcome: patient.outcome ?? RecoveryOutcome.ON_TRACK, // placeholder
      actualRecoveryDays: patient.actualRecoveryDays ?? 0,  // placeholder
      ...patient,
    };

    const fv = extractFeatures(record, this.featureMeans, this.featureStds);
    const probs = this.predictEnsembleProbabilities(fv.features);
    const classIndex = probs.indexOf(Math.max(...probs));
    const predictedOutcome = OUTCOME_CLASSES[classIndex];

    // Build probability map
    const probabilities = {} as Record<RecoveryOutcome, number>;
    for (let i = 0; i < NUM_CLASSES; i++) {
      probabilities[OUTCOME_CLASSES[i]] = Math.round(probs[i] * 1000) / 1000;
    }

    // Estimate recovery days
    const baselineDays = BASELINE_RECOVERY_DAYS[patient.surgeryType];
    const outcomeMultipliers: Record<RecoveryOutcome, number> = {
      [RecoveryOutcome.FASTER_THAN_EXPECTED]: 0.78,
      [RecoveryOutcome.ON_TRACK]: 1.0,
      [RecoveryOutcome.DELAYED]: 1.22,
      [RecoveryOutcome.SIGNIFICANTLY_DELAYED]: 1.45,
    };

    // Weighted expected recovery days
    let expectedDays = 0;
    for (let i = 0; i < NUM_CLASSES; i++) {
      expectedDays += probs[i] * baselineDays * outcomeMultipliers[OUTCOME_CLASSES[i]];
    }
    expectedDays = Math.round(expectedDays);

    // Confidence interval based on prediction uncertainty
    const maxProb = Math.max(...probs);
    const entropy = -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0);
    const maxEntropy = Math.log(NUM_CLASSES);
    const uncertaintyRatio = entropy / maxEntropy; // 0 = certain, 1 = max uncertainty
    const confidenceLevel = 0.95;
    const z = zScore(confidenceLevel);

    // Standard error estimate from training data residuals
    const baseStdError = this.estimateStdError(patient.surgeryType);
    const adjustedStdError = baseStdError * (1 + uncertaintyRatio);

    const lower = Math.max(1, Math.round(expectedDays - z * adjustedStdError));
    const upper = Math.round(expectedDays + z * adjustedStdError);

    // Risk factor analysis
    const riskFactors = this.identifyRiskFactors(record);

    // Feature importance (absolute weight contribution)
    const featureImportance = this.computeFeatureImportance(fv.features, classIndex, maxProb);

    return {
      outcome: predictedOutcome,
      probabilities,
      estimatedRecoveryDays: expectedDays,
      confidenceInterval: {
        lower,
        upper,
        confidenceLevel,
      },
      riskFactors,
      featureImportance,
    };
  }

  /**
   * Estimate standard error of recovery day predictions for a surgery type,
   * based on the training data residuals.
   */
  private estimateStdError(surgeryType: SurgeryType): number {
    const trainingRecords = TRAINING_DATA.filter(r => r.surgeryType === surgeryType);
    if (trainingRecords.length < 3) {
      // fallback: use 15% of baseline as std error
      return BASELINE_RECOVERY_DAYS[surgeryType] * 0.15;
    }
    const days = trainingRecords.map(r => r.actualRecoveryDays);
    return stddev(days) / Math.sqrt(trainingRecords.length);
  }

  /**
   * Identify human-readable risk factors from patient data
   */
  private identifyRiskFactors(record: PatientRecord): string[] {
    const risks: string[] = [];
    if (record.age > 65) risks.push(`Advanced age (${record.age} years) may slow tissue healing`);
    if (record.bmi > 35) risks.push(`High BMI (${record.bmi}) significantly increases surgical complication risk`);
    else if (record.bmi > 30) risks.push(`Elevated BMI (${record.bmi}) may delay wound healing`);
    if (record.comorbidities.diabetes) risks.push('Diabetes impairs microvascular circulation and healing');
    if (record.comorbidities.smoking) risks.push('Smoking reduces tissue oxygenation and delays recovery');
    if (record.comorbidities.heartDisease) risks.push('Cardiovascular disease increases perioperative risk');
    if (record.comorbidities.immunocompromised) risks.push('Immunocompromised status increases infection risk');
    if (record.comorbidities.osteoporosis) risks.push('Osteoporosis may affect bone healing after orthopedic procedures');
    if (record.complianceRate < 0.5) risks.push(`Low treatment compliance (${Math.round(record.complianceRate * 100)}%) is associated with delayed recovery`);
    if (record.woundHealingScore < 4) risks.push(`Poor wound healing score (${record.woundHealingScore}/10) suggests healing complications`);
    if (record.painLevel > 7) risks.push(`High pain level (${record.painLevel}/10) may limit rehabilitation participation`);
    if (record.sleepQualityScore < 4) risks.push(`Poor sleep quality (${record.sleepQualityScore}/10) impairs tissue recovery`);
    return risks;
  }

  /**
   * Compute feature importance as absolute weight contributions
   */
  private computeFeatureImportance(
    features: number[],
    classIndex: number,
    _maxProb: number,
  ): Record<string, number> {
    const importance: Record<string, number> = {};

    if (this.weights.length === 0) return importance;

    // Feature importance = |weight * feature_value| for the predicted class
    const classWeights = this.weights[classIndex];

    for (let i = 0; i < FEATURE_NAMES.length; i++) {
      // +1 because index 0 is the bias term
      const contribution = Math.abs(classWeights[i + 1] * features[i]);
      importance[FEATURE_NAMES[i]] = Math.round(contribution * 1000) / 1000;
    }

    // Normalize to sum to 1
    const total = Object.values(importance).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const key of Object.keys(importance)) {
        importance[key] = Math.round((importance[key] / total) * 1000) / 1000;
      }
    }

    return importance;
  }

  // --------------------------------------------------------------------------
  // Evaluation & Cross-Validation
  // --------------------------------------------------------------------------

  /**
   * Evaluate the model on a held-out test set
   */
  evaluate(testData: PatientRecord[]): EvaluationMetrics {
    if (!this.trained) {
      throw new Error('Model must be trained before evaluation.');
    }

    const predictions = testData.map(r => {
      const fv = extractFeatures(r, this.featureMeans, this.featureStds);
      return this.predictClassIndex(fv.features);
    });

    const actuals = testData.map(r => OUTCOME_CLASSES.indexOf(r.outcome));
    return computeMetrics(predictions, actuals);
  }

  /**
   * Perform k-fold cross-validation
   */
  crossValidate(k: number = 5, data?: PatientRecord[]): CrossValidationResult {
    const records = data ?? TRAINING_DATA;
    const rng = createRng(777);
    const shuffled = shuffleArray(records, rng);
    const foldSize = Math.floor(shuffled.length / k);
    const foldMetrics: EvaluationMetrics[] = [];

    for (let fold = 0; fold < k; fold++) {
      const testStart = fold * foldSize;
      const testEnd = fold === k - 1 ? shuffled.length : testStart + foldSize;

      const testData = shuffled.slice(testStart, testEnd);
      const trainData = [
        ...shuffled.slice(0, testStart),
        ...shuffled.slice(testEnd),
      ];

      // Create a fresh model for this fold
      const foldModel = new RecoveryPredictionModel(this.hyperparams);
      foldModel.train(trainData);
      const metrics = foldModel.evaluate(testData);
      foldMetrics.push(metrics);
    }

    const accuracies = foldMetrics.map(m => m.accuracy);
    const f1s = foldMetrics.map(m => m.macroF1);

    return {
      foldMetrics,
      averageAccuracy: Math.round(mean(accuracies) * 1000) / 1000,
      stdAccuracy: Math.round(stddev(accuracies) * 1000) / 1000,
      averageMacroF1: Math.round(mean(f1s) * 1000) / 1000,
      stdMacroF1: Math.round(stddev(f1s) * 1000) / 1000,
    };
  }

  // --------------------------------------------------------------------------
  // Serialization / Deserialization (localStorage)
  // --------------------------------------------------------------------------

  /**
   * Serialize model state to a plain object for JSON storage
   */
  serialize(): SerializedModelState {
    if (!this.trained) {
      throw new Error('Cannot serialize an untrained model.');
    }

    return {
      version: MODEL_VERSION,
      trainedAt: this.trainedAt ?? new Date().toISOString(),
      logisticWeights: this.weights,
      decisionTree: this.decisionTree,
      featureNames: FEATURE_NAMES,
      featureMeans: this.featureMeans,
      featureStds: this.featureStds,
      classMappings: OUTCOME_CLASSES,
      baselineRecoveryDays: BASELINE_RECOVERY_DAYS,
      hyperparams: this.hyperparams,
      trainingMetrics: this.trainingMetrics,
    };
  }

  /**
   * Save model to localStorage
   */
  saveToLocalStorage(key: string = STORAGE_KEY): void {
    const state = this.serialize();
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      throw new Error(`Failed to save model to localStorage: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /**
   * Load model from localStorage
   */
  static loadFromLocalStorage(key: string = STORAGE_KEY): RecoveryPredictionModel | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const state: SerializedModelState = JSON.parse(raw);
      return RecoveryPredictionModel.deserialize(state);
    } catch {
      return null;
    }
  }

  /**
   * Restore model from a serialized state object
   */
  static deserialize(state: SerializedModelState): RecoveryPredictionModel {
    if (state.version !== MODEL_VERSION) {
      throw new Error(
        `Model version mismatch: expected ${MODEL_VERSION}, got ${state.version}`
      );
    }

    const model = new RecoveryPredictionModel(state.hyperparams);
    model.weights = state.logisticWeights;
    model.decisionTree = state.decisionTree;
    model.featureMeans = state.featureMeans;
    model.featureStds = state.featureStds;
    model.trained = true;
    model.trainedAt = state.trainedAt;
    model.trainingMetrics = state.trainingMetrics;
    return model;
  }

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------

  isTrained(): boolean {
    return this.trained;
  }

  getTrainedAt(): string | null {
    return this.trainedAt;
  }

  getTrainingMetrics(): EvaluationMetrics | null {
    return this.trainingMetrics;
  }

  getHyperparams(): LogisticRegressionParams {
    return { ...this.hyperparams };
  }

  getFeatureNames(): string[] {
    return [...FEATURE_NAMES];
  }

  getBaselineRecoveryDays(): Record<SurgeryType, number> {
    return { ...BASELINE_RECOVERY_DAYS };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create and train a model with default settings.
 * Uses the embedded synthetic dataset of 120 patient records.
 */
export function createTrainedModel(
  params?: Partial<LogisticRegressionParams>
): { model: RecoveryPredictionModel; metrics: EvaluationMetrics; lossHistory: number[] } {
  const model = new RecoveryPredictionModel(params);
  const { metrics, lossHistory } = model.train();
  return { model, metrics, lossHistory };
}

/**
 * Load a previously saved model from localStorage, or train a new one.
 */
export function getOrTrainModel(
  storageKey: string = STORAGE_KEY
): RecoveryPredictionModel {
  const loaded = RecoveryPredictionModel.loadFromLocalStorage(storageKey);
  if (loaded) return loaded;

  const model = new RecoveryPredictionModel();
  model.train();
  model.saveToLocalStorage(storageKey);
  return model;
}

/**
 * Access the embedded synthetic training dataset
 */
export function getTrainingData(): PatientRecord[] {
  return [...TRAINING_DATA];
}

/**
 * Generate fresh synthetic data with a custom seed and size
 */
export function generatePatientData(count: number, seed?: number): PatientRecord[] {
  return generateSyntheticData(count, seed);
}

// ============================================================================
// Re-export sigmoid for potential use in UI visualizations
// ============================================================================

export { sigmoid, softmax };
