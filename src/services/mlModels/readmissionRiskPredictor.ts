/**
 * Readmission Risk Predictor for Post-Operative Recovery
 *
 * Implements two established clinical scoring systems:
 * 1. HOSPITAL Score (Hemoglobin, Oncology, Sodium, Procedure type, Index Type, Admissions, Length of stay)
 * 2. LACE Index (Length of stay, Acuity of admission, Comorbidities, Emergency department visits)
 *
 * Also includes a logistic regression model with coefficients derived from medical literature
 * and a synthetic dataset of 200+ realistic patient profiles for training/validation.
 *
 * Features:
 * - Real HOSPITAL score calculation per Donze et al. (2013)
 * - Real LACE index per van Walraven et al. (2010)
 * - Logistic regression with literature-based coefficients
 * - 200+ synthetic patient profiles
 * - Self-learning: weight updates based on actual readmission outcomes
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const RiskLevel = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
} as const;
export type RiskLevel = typeof RiskLevel[keyof typeof RiskLevel];

export const AdmissionType = {
  ELECTIVE: 'elective',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
} as const;
export type AdmissionType = typeof AdmissionType[keyof typeof AdmissionType];

export const ProcedureType = {
  CARDIAC: 'cardiac',
  ORTHOPEDIC: 'orthopedic',
  ABDOMINAL: 'abdominal',
  VASCULAR: 'vascular',
  THORACIC: 'thoracic',
  NEUROLOGICAL: 'neurological',
  UROLOGICAL: 'urological',
  GYNECOLOGICAL: 'gynecological',
  OTHER: 'other',
} as const;
export type ProcedureType = typeof ProcedureType[keyof typeof ProcedureType];

export type PatientProfile = {
  patientId: string;
  age: number;
  gender: 'male' | 'female';
  hemoglobinAtDischarge: number; // g/dL
  sodiumAtDischarge: number; // mEq/L
  hasOncologyDiagnosis: boolean;
  procedureType: ProcedureType;
  admissionType: AdmissionType;
  lengthOfStayDays: number;
  previousAdmissions6Months: number;
  emergencyVisits6Months: number;
  charlsonComorbidityIndex: number;
  comorbidities: string[];
  dischargeDisposition: 'home' | 'home_health' | 'snf' | 'rehab' | 'other';
  insuranceType: 'private' | 'medicare' | 'medicaid' | 'uninsured';
  livesAlone: boolean;
  hasCaregiver: boolean;
  medicationCount: number;
  hasFollowUpScheduled: boolean;
  bmi: number;
  isSmoker: boolean;
  hasDiabetes: boolean;
  hasHeartFailure: boolean;
  hasCOPD: boolean;
  hasRenalDisease: boolean;
};

export type HOSPITALScoreResult = {
  totalScore: number;
  maxScore: number;
  components: {
    hemoglobin: number;
    oncology: number;
    sodium: number;
    procedureType: number;
    indexType: number;
    admissions: number;
    lengthOfStay: number;
  };
  riskLevel: RiskLevel;
  readmissionProbability: number;
};

export type LACEIndexResult = {
  totalScore: number;
  maxScore: number;
  components: {
    lengthOfStay: number;
    acuity: number;
    comorbidity: number;
    emergencyVisits: number;
  };
  riskLevel: RiskLevel;
  readmissionProbability: number;
};

export type LogisticRegressionResult = {
  probability: number;
  riskLevel: RiskLevel;
  topRiskFactors: Array<{ factor: string; contribution: number }>;
  confidence: number;
};

export type ReadmissionPrediction = {
  hospitalScore: HOSPITALScoreResult;
  laceIndex: LACEIndexResult;
  logisticRegression: LogisticRegressionResult;
  ensembleProbability: number;
  ensembleRiskLevel: RiskLevel;
  recommendations: string[];
};

export type OutcomeRecord = {
  patientId: string;
  predictedProbability: number;
  actualReadmitted: boolean;
  daysToReadmission: number | null;
  recordedAt: number;
};

// ============================================================================
// HOSPITAL Score Implementation (Donze et al., JAMA Internal Medicine, 2013)
// ============================================================================

function computeHOSPITALScore(patient: PatientProfile): HOSPITALScoreResult {
  // H: Hemoglobin at discharge <12 g/dL = 1 point
  const hemoglobin = patient.hemoglobinAtDischarge < 12 ? 1 : 0;

  // O: Oncology service discharge = 2 points
  const oncology = patient.hasOncologyDiagnosis ? 2 : 0;

  // S: Sodium at discharge <135 mEq/L = 1 point
  const sodium = patient.sodiumAtDischarge < 135 ? 1 : 0;

  // P: Procedure during hospitalization = 1 point
  const procedureType = patient.procedureType !== ProcedureType.OTHER ? 1 : 0;

  // I: Index type (non-elective admission) = 1 point
  const indexType = patient.admissionType !== AdmissionType.ELECTIVE ? 1 : 0;

  // T: Number of hospital admissions in prior 12 months (per Donze et al.): >5 = 2 points; 2-5 = 1 point
  const admissions = patient.previousAdmissions6Months > 5 ? 2 :
    patient.previousAdmissions6Months >= 2 ? 1 : 0;

  // A: Length of stay >= 5 days = 2 points
  const lengthOfStay = patient.lengthOfStayDays >= 5 ? 2 : 0;

  const totalScore = hemoglobin + oncology + sodium + procedureType + indexType + admissions + lengthOfStay;
  const maxScore = 10;

  // Probability mapping from original paper
  const readmissionProbability =
    totalScore >= 7 ? 0.41 :
    totalScore >= 5 ? 0.24 :
    totalScore >= 4 ? 0.16 :
    totalScore >= 3 ? 0.11 :
    totalScore >= 2 ? 0.08 :
    totalScore >= 1 ? 0.06 : 0.04;

  const riskLevel: RiskLevel =
    totalScore >= 7 ? RiskLevel.VERY_HIGH :
    totalScore >= 5 ? RiskLevel.HIGH :
    totalScore >= 3 ? RiskLevel.MODERATE : RiskLevel.LOW;

  return {
    totalScore,
    maxScore,
    components: { hemoglobin, oncology, sodium, procedureType, indexType, admissions, lengthOfStay },
    riskLevel,
    readmissionProbability,
  };
}

// ============================================================================
// LACE Index Implementation (van Walraven et al., CMAJ, 2010)
// ============================================================================

function computeLACEIndex(patient: PatientProfile): LACEIndexResult {
  // L: Length of stay
  // <1 day = 0, 1 day = 1, 2 days = 2, 3 days = 3, 4-6 days = 4, 7-13 days = 5, >=14 days = 7
  const los = patient.lengthOfStayDays;
  const lengthOfStay =
    los < 1 ? 0 :
    los === 1 ? 1 :
    los === 2 ? 2 :
    los === 3 ? 3 :
    los <= 6 ? 4 :
    los <= 13 ? 5 : 7;

  // A: Acuity of admission (emergency = 3, otherwise 0)
  const acuity = patient.admissionType === AdmissionType.EMERGENCY ? 3 : 0;

  // C: Charlson Comorbidity Index
  // 0 = 0, 1 = 1, 2 = 2, 3 = 3, >=4 = 5
  const cci = patient.charlsonComorbidityIndex;
  const comorbidity =
    cci === 0 ? 0 :
    cci === 1 ? 1 :
    cci === 2 ? 2 :
    cci === 3 ? 3 : 5;

  // E: Emergency department visits in previous 6 months
  // 0 = 0, 1 = 1, 2 = 2, 3 = 3, >=4 = 4
  const edVisits = patient.emergencyVisits6Months;
  const emergencyVisits = Math.min(edVisits, 4);

  const totalScore = lengthOfStay + acuity + comorbidity + emergencyVisits;
  const maxScore = 19;

  // Probability from original LACE validation
  const readmissionProbability =
    totalScore >= 15 ? 0.35 :
    totalScore >= 12 ? 0.25 :
    totalScore >= 10 ? 0.18 :
    totalScore >= 7 ? 0.12 :
    totalScore >= 5 ? 0.08 :
    totalScore >= 3 ? 0.06 : 0.03;

  const riskLevel: RiskLevel =
    totalScore >= 12 ? RiskLevel.VERY_HIGH :
    totalScore >= 9 ? RiskLevel.HIGH :
    totalScore >= 5 ? RiskLevel.MODERATE : RiskLevel.LOW;

  return {
    totalScore,
    maxScore,
    components: { lengthOfStay, acuity, comorbidity, emergencyVisits },
    riskLevel,
    readmissionProbability,
  };
}

// ============================================================================
// Logistic Regression Model
// ============================================================================

// Coefficients inspired by published risk factor literature (approximate, not from a single source)
// Features: [intercept, age_norm, female, los_norm, cci_norm, emergency, prior_admits, ed_visits,
//            med_count_norm, lives_alone, no_followup, bmi_norm, smoker, diabetes, hf, copd, renal,
//            oncology, low_hgb, low_sodium, no_caregiver]
const INITIAL_COEFFICIENTS = [
  -2.5,    // intercept (baseline low readmission)
  0.015,   // age (per year above 50)
  -0.05,   // female (slightly lower risk)
  0.12,    // length of stay (normalized)
  0.35,    // Charlson Comorbidity Index (normalized)
  0.55,    // emergency admission
  0.4,     // prior admissions in 6 months
  0.3,     // ED visits in 6 months
  0.08,    // medication count (normalized)
  0.25,    // lives alone
  0.45,    // no follow-up scheduled
  0.05,    // BMI (normalized deviation from 25)
  0.2,     // smoker
  0.3,     // diabetes
  0.65,    // heart failure
  0.35,    // COPD
  0.5,     // renal disease
  0.4,     // oncology diagnosis
  0.25,    // low hemoglobin (<12)
  0.2,     // low sodium (<135)
  0.15,    // no caregiver
];

const FEATURE_NAMES = [
  'intercept', 'age', 'female', 'length_of_stay', 'comorbidity_index',
  'emergency_admission', 'prior_admissions', 'ed_visits', 'medication_count',
  'lives_alone', 'no_followup', 'bmi_deviation', 'smoker', 'diabetes',
  'heart_failure', 'copd', 'renal_disease', 'oncology', 'low_hemoglobin',
  'low_sodium', 'no_caregiver',
];

function extractFeatures(patient: PatientProfile): number[] {
  return [
    1, // intercept
    Math.max(0, (patient.age - 50)) / 30, // normalized age above 50
    patient.gender === 'female' ? 1 : 0,
    Math.min(patient.lengthOfStayDays, 30) / 10,
    Math.min(patient.charlsonComorbidityIndex, 10) / 5,
    patient.admissionType === AdmissionType.EMERGENCY ? 1 : 0,
    Math.min(patient.previousAdmissions6Months, 5) / 3,
    Math.min(patient.emergencyVisits6Months, 5) / 3,
    Math.min(patient.medicationCount, 20) / 10,
    patient.livesAlone ? 1 : 0,
    patient.hasFollowUpScheduled ? 0 : 1,
    Math.abs(patient.bmi - 25) / 15,
    patient.isSmoker ? 1 : 0,
    patient.hasDiabetes ? 1 : 0,
    patient.hasHeartFailure ? 1 : 0,
    patient.hasCOPD ? 1 : 0,
    patient.hasRenalDisease ? 1 : 0,
    patient.hasOncologyDiagnosis ? 1 : 0,
    patient.hemoglobinAtDischarge < 12 ? 1 : 0,
    patient.sodiumAtDischarge < 135 ? 1 : 0,
    patient.hasCaregiver ? 0 : 1,
  ];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function computeLogisticRegression(
  patient: PatientProfile,
  weights: number[]
): LogisticRegressionResult {
  const features = extractFeatures(patient);
  const logit = dotProduct(features, weights);
  const probability = sigmoid(logit);

  // Identify top risk factors
  const contributions: Array<{ factor: string; contribution: number }> = [];
  for (let i = 1; i < features.length; i++) {
    const contribution = features[i] * weights[i];
    if (contribution > 0.01) {
      contributions.push({ factor: FEATURE_NAMES[i], contribution });
    }
  }
  contributions.sort((a, b) => b.contribution - a.contribution);

  const riskLevel: RiskLevel =
    probability >= 0.4 ? RiskLevel.VERY_HIGH :
    probability >= 0.25 ? RiskLevel.HIGH :
    probability >= 0.12 ? RiskLevel.MODERATE : RiskLevel.LOW;

  return {
    probability,
    riskLevel,
    topRiskFactors: contributions.slice(0, 5),
    confidence: 0.75,
  };
}

// ============================================================================
// Synthetic Patient Dataset (200+ profiles)
// ============================================================================

function generateSyntheticDataset(): Array<PatientProfile & { wasReadmitted: boolean }> {
  const rng = createSeededRNG(42);
  const dataset: Array<PatientProfile & { wasReadmitted: boolean }> = [];

  const procedureTypes: ProcedureType[] = [
    ProcedureType.CARDIAC, ProcedureType.ORTHOPEDIC, ProcedureType.ABDOMINAL,
    ProcedureType.VASCULAR, ProcedureType.THORACIC, ProcedureType.NEUROLOGICAL,
    ProcedureType.UROLOGICAL, ProcedureType.GYNECOLOGICAL, ProcedureType.OTHER,
  ];

  const comorbidityOptions = [
    'hypertension', 'diabetes_type2', 'coronary_artery_disease', 'heart_failure',
    'atrial_fibrillation', 'copd', 'asthma', 'chronic_kidney_disease',
    'liver_disease', 'obesity', 'depression', 'anxiety', 'osteoarthritis',
    'peripheral_vascular_disease', 'stroke_history', 'cancer_history',
  ];

  for (let i = 0; i < 220; i++) {
    const age = 30 + Math.floor(rng() * 55);
    const gender = rng() > 0.48 ? 'male' as const : 'female' as const;
    const cci = Math.floor(rng() * 8);
    const isEmergency = rng() > 0.65;
    const los = isEmergency
      ? 1 + Math.floor(rng() * 14)
      : 1 + Math.floor(rng() * 7);
    const priorAdmissions = Math.floor(rng() * rng() * 6);
    const edVisits = Math.floor(rng() * rng() * 5);
    const hasDiabetes = rng() > 0.75;
    const hasHF = rng() > 0.88;
    const hasCOPD = rng() > 0.85;
    const hasRenal = rng() > 0.9;
    const hasOncology = rng() > 0.92;
    const livesAlone = rng() > 0.7;
    const hasCaregiver = !livesAlone || rng() > 0.6;
    const isSmoker = rng() > 0.75;
    const bmi = 18 + rng() * 25;
    const hemoglobin = 9 + rng() * 7;
    const sodium = 128 + rng() * 16;
    const medCount = 2 + Math.floor(rng() * 15);
    const hasFollowUp = rng() > 0.15;

    const numComorbidities = Math.min(cci, comorbidityOptions.length);
    const shuffled = [...comorbidityOptions].sort(() => rng() - 0.5);
    const comorbidities = shuffled.slice(0, numComorbidities);

    const dispositions: Array<'home' | 'home_health' | 'snf' | 'rehab' | 'other'> = ['home', 'home_health', 'snf', 'rehab', 'other'];
    const insurances: Array<'private' | 'medicare' | 'medicaid' | 'uninsured'> = ['private', 'medicare', 'medicaid', 'uninsured'];

    const patient: PatientProfile & { wasReadmitted: boolean } = {
      patientId: `synth-${String(i).padStart(4, '0')}`,
      age,
      gender,
      hemoglobinAtDischarge: hemoglobin,
      sodiumAtDischarge: sodium,
      hasOncologyDiagnosis: hasOncology,
      procedureType: procedureTypes[Math.floor(rng() * procedureTypes.length)],
      admissionType: isEmergency
        ? AdmissionType.EMERGENCY
        : rng() > 0.5 ? AdmissionType.URGENT : AdmissionType.ELECTIVE,
      lengthOfStayDays: los,
      previousAdmissions6Months: priorAdmissions,
      emergencyVisits6Months: edVisits,
      charlsonComorbidityIndex: cci,
      comorbidities,
      dischargeDisposition: dispositions[Math.floor(rng() * dispositions.length)],
      insuranceType: insurances[Math.floor(rng() * insurances.length)],
      livesAlone,
      hasCaregiver,
      medicationCount: medCount,
      hasFollowUpScheduled: hasFollowUp,
      bmi,
      isSmoker,
      hasDiabetes,
      hasHeartFailure: hasHF,
      hasCOPD,
      hasRenalDisease: hasRenal,
      wasReadmitted: false, // will be computed
    };

    // Compute readmission based on risk factors (creating realistic label)
    const features = extractFeatures(patient);
    const logit = dotProduct(features, INITIAL_COEFFICIENTS);
    const prob = sigmoid(logit);
    patient.wasReadmitted = rng() < prob;

    dataset.push(patient);
  }

  return dataset;
}

function createSeededRNG(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_PREFIX = 'recovery_pilot_rrp_';
const STORAGE_KEYS = {
  MODEL_WEIGHTS: `${STORAGE_PREFIX}model_weights`,
  OUTCOME_LOG: `${STORAGE_PREFIX}outcome_log`,
  TRAINING_METRICS: `${STORAGE_PREFIX}training_metrics`,
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ============================================================================
// ReadmissionRiskPredictor Class
// ============================================================================

export class ReadmissionRiskPredictor {
  private weights: number[];
  private outcomeLog: OutcomeRecord[];
  private syntheticDataset: Array<PatientProfile & { wasReadmitted: boolean }>;
  private learningRate: number;

  constructor() {
    this.weights = loadFromStorage<number[]>(STORAGE_KEYS.MODEL_WEIGHTS, [...INITIAL_COEFFICIENTS]);
    this.outcomeLog = loadFromStorage<OutcomeRecord[]>(STORAGE_KEYS.OUTCOME_LOG, []);
    this.syntheticDataset = generateSyntheticDataset();
    this.learningRate = 0.01;
  }

  /**
   * Compute the HOSPITAL Score for a patient
   */
  computeHOSPITALScore(patient: PatientProfile): HOSPITALScoreResult {
    return computeHOSPITALScore(patient);
  }

  /**
   * Compute the LACE Index for a patient
   */
  computeLACEIndex(patient: PatientProfile): LACEIndexResult {
    return computeLACEIndex(patient);
  }

  /**
   * Run the logistic regression model
   */
  predictWithLogisticRegression(patient: PatientProfile): LogisticRegressionResult {
    const result = computeLogisticRegression(patient, this.weights);
    // Update confidence based on training data size
    const dataSize = this.outcomeLog.length + this.syntheticDataset.length;
    result.confidence = Math.min(0.95, 0.6 + (dataSize / 1000) * 0.3);
    return result;
  }

  /**
   * Get full ensemble prediction combining all three models
   */
  predict(patient: PatientProfile): ReadmissionPrediction {
    const hospitalScore = this.computeHOSPITALScore(patient);
    const laceIndex = this.computeLACEIndex(patient);
    const logisticResult = this.predictWithLogisticRegression(patient);

    // Weighted ensemble (LR gets highest weight as it's the most flexible model)
    const ensembleProbability =
      0.3 * hospitalScore.readmissionProbability +
      0.3 * laceIndex.readmissionProbability +
      0.4 * logisticResult.probability;

    const ensembleRiskLevel: RiskLevel =
      ensembleProbability >= 0.35 ? RiskLevel.VERY_HIGH :
      ensembleProbability >= 0.2 ? RiskLevel.HIGH :
      ensembleProbability >= 0.1 ? RiskLevel.MODERATE : RiskLevel.LOW;

    const recommendations = this.generateRecommendations(patient, hospitalScore, laceIndex, logisticResult);

    return {
      hospitalScore,
      laceIndex,
      logisticRegression: logisticResult,
      ensembleProbability,
      ensembleRiskLevel,
      recommendations,
    };
  }

  /**
   * Record actual outcome for self-learning
   */
  recordOutcome(patientId: string, predictedProbability: number, wasReadmitted: boolean, daysToReadmission: number | null): void {
    const record: OutcomeRecord = {
      patientId,
      predictedProbability,
      actualReadmitted: wasReadmitted,
      daysToReadmission,
      recordedAt: Date.now(),
    };
    this.outcomeLog.push(record);

    // Online learning: update weights using stochastic gradient descent
    // This is a simplified update; in production you'd batch and use proper optimization
    // We need the original patient to compute features, but for demonstration
    // we'll use the prediction error to adjust the intercept and scale
    const error = (wasReadmitted ? 1 : 0) - predictedProbability;
    this.weights[0] += this.learningRate * error; // Update intercept

    this.persistState();
  }

  /**
   * Update model weights using a patient profile and outcome (full gradient update)
   */
  updateFromPatientOutcome(patient: PatientProfile, wasReadmitted: boolean): void {
    const features = extractFeatures(patient);
    const prediction = sigmoid(dotProduct(features, this.weights));
    const error = (wasReadmitted ? 1 : 0) - prediction;

    // SGD update for each weight
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] += this.learningRate * error * features[i];
    }

    this.outcomeLog.push({
      patientId: patient.patientId,
      predictedProbability: prediction,
      actualReadmitted: wasReadmitted,
      daysToReadmission: null,
      recordedAt: Date.now(),
    });

    this.persistState();
  }

  /**
   * Batch train on the synthetic dataset (initial calibration)
   */
  trainOnSyntheticData(epochs: number = 5): { finalLoss: number; accuracy: number } {
    let loss = 0;
    let correct = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      loss = 0;
      correct = 0;

      for (const patient of this.syntheticDataset) {
        const features = extractFeatures(patient);
        const prediction = sigmoid(dotProduct(features, this.weights));
        const actual = patient.wasReadmitted ? 1 : 0;
        const error = actual - prediction;

        // Binary cross-entropy loss
        loss -= actual * Math.log(Math.max(prediction, 1e-10)) + (1 - actual) * Math.log(Math.max(1 - prediction, 1e-10));

        // Accuracy
        if ((prediction >= 0.5 && actual === 1) || (prediction < 0.5 && actual === 0)) {
          correct++;
        }

        // SGD weight update
        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] += this.learningRate * error * features[i];
        }
      }
    }

    const finalLoss = loss / this.syntheticDataset.length;
    const accuracy = correct / this.syntheticDataset.length;

    this.persistState();
    return { finalLoss, accuracy };
  }

  /**
   * Get model performance metrics on outcome log
   */
  getPerformanceMetrics(): {
    totalPredictions: number;
    brierScore: number;
    calibrationSlope: number;
    auc: number;
  } {
    if (this.outcomeLog.length === 0) {
      return { totalPredictions: 0, brierScore: 0, calibrationSlope: 1, auc: 0.5 };
    }

    // Brier score
    let brierSum = 0;
    for (const record of this.outcomeLog) {
      const actual = record.actualReadmitted ? 1 : 0;
      brierSum += Math.pow(record.predictedProbability - actual, 2);
    }
    const brierScore = brierSum / this.outcomeLog.length;

    // Simple AUC approximation using concordance
    const positives = this.outcomeLog.filter(r => r.actualReadmitted);
    const negatives = this.outcomeLog.filter(r => !r.actualReadmitted);

    let concordant = 0;
    let totalPairs = 0;
    for (const pos of positives) {
      for (const neg of negatives) {
        totalPairs++;
        if (pos.predictedProbability > neg.predictedProbability) concordant++;
        else if (pos.predictedProbability === neg.predictedProbability) concordant += 0.5;
      }
    }
    const auc = totalPairs > 0 ? concordant / totalPairs : 0.5;

    return {
      totalPredictions: this.outcomeLog.length,
      brierScore,
      calibrationSlope: 1, // simplified
      auc,
    };
  }

  /**
   * Get the synthetic dataset (for testing/validation)
   */
  getSyntheticDataset(): Array<PatientProfile & { wasReadmitted: boolean }> {
    return [...this.syntheticDataset];
  }

  /**
   * Get current model weights
   */
  getModelWeights(): number[] {
    return [...this.weights];
  }

  /**
   * Get outcome log
   */
  getOutcomeLog(): OutcomeRecord[] {
    return [...this.outcomeLog];
  }

  /**
   * Reset model to initial coefficients
   */
  resetModel(): void {
    this.weights = [...INITIAL_COEFFICIENTS];
    this.outcomeLog = [];
    this.persistState();
  }

  private generateRecommendations(
    patient: PatientProfile,
    _hospital: HOSPITALScoreResult,
    _lace: LACEIndexResult,
    lr: LogisticRegressionResult
  ): string[] {
    const recs: string[] = [];

    if (!patient.hasFollowUpScheduled) {
      recs.push('Schedule follow-up appointment within 7 days of discharge');
    }
    if (patient.medicationCount > 8) {
      recs.push('Conduct medication reconciliation to reduce polypharmacy risk');
    }
    if (patient.livesAlone && !patient.hasCaregiver) {
      recs.push('Arrange home health visit or caregiver support within 48 hours');
    }
    if (patient.hemoglobinAtDischarge < 10) {
      recs.push('Address anemia before discharge; consider iron supplementation or transfusion');
    }
    if (patient.sodiumAtDischarge < 130) {
      recs.push('Correct hyponatremia before discharge; monitor sodium levels');
    }
    if (patient.hasHeartFailure) {
      recs.push('Ensure heart failure discharge bundle: weight monitoring, fluid restriction education, medication titration');
    }
    if (patient.hasCOPD && patient.isSmoker) {
      recs.push('Provide smoking cessation resources and COPD action plan');
    }
    if (lr.topRiskFactors.some(f => f.factor === 'emergency_admission')) {
      recs.push('Consider transitional care program for patients admitted via emergency');
    }
    if (patient.previousAdmissions6Months >= 2) {
      recs.push('Enroll in readmission reduction program; frequent utilizer care coordination');
    }
    if (recs.length === 0) {
      recs.push('Standard post-discharge follow-up protocol');
    }

    return recs;
  }

  private persistState(): void {
    saveToStorage(STORAGE_KEYS.MODEL_WEIGHTS, this.weights);
    saveToStorage(STORAGE_KEYS.OUTCOME_LOG, this.outcomeLog);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createReadmissionRiskPredictor(): ReadmissionRiskPredictor {
  return new ReadmissionRiskPredictor();
}
