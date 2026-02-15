/**
 * Treatment Response Predictor for Post-Operative Recovery
 *
 * Predicts effectiveness of treatments for individual patients using
 * a simplified gradient boosted trees implementation.
 *
 * Features:
 * - Treatment categories: pain management, antibiotics, physical therapy, wound care
 * - Gradient boosted trees (simplified) with multiple weak learners
 * - Patient demographics, genetics proxy, prior responses, comorbidities
 * - Response prediction: excellent, good, moderate, poor
 * - Confidence intervals with calibration
 * - Self-learning: updates based on actual treatment outcomes
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const TreatmentCategory = {
  PAIN_MANAGEMENT: 'pain_management',
  ANTIBIOTICS: 'antibiotics',
  PHYSICAL_THERAPY: 'physical_therapy',
  WOUND_CARE: 'wound_care',
} as const;
export type TreatmentCategory = typeof TreatmentCategory[keyof typeof TreatmentCategory];

export const ResponseLevel = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  MODERATE: 'moderate',
  POOR: 'poor',
} as const;
export type ResponseLevel = typeof ResponseLevel[keyof typeof ResponseLevel];

export const PainTreatmentType = {
  OPIOID: 'opioid',
  NSAID: 'nsaid',
  ACETAMINOPHEN: 'acetaminophen',
  NERVE_BLOCK: 'nerve_block',
  MULTIMODAL: 'multimodal',
  GABAPENTINOID: 'gabapentinoid',
} as const;
export type PainTreatmentType = typeof PainTreatmentType[keyof typeof PainTreatmentType];

export const AntibioticType = {
  PENICILLIN: 'penicillin',
  CEPHALOSPORIN: 'cephalosporin',
  FLUOROQUINOLONE: 'fluoroquinolone',
  GLYCOPEPTIDE: 'glycopeptide',
  MACROLIDE: 'macrolide',
  COMBINATION: 'combination',
} as const;
export type AntibioticType = typeof AntibioticType[keyof typeof AntibioticType];

export const PTIntensity = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  INTENSIVE: 'intensive',
} as const;
export type PTIntensity = typeof PTIntensity[keyof typeof PTIntensity];

export const WoundCareType = {
  STANDARD_DRESSING: 'standard_dressing',
  NEGATIVE_PRESSURE: 'negative_pressure',
  ADVANCED_BIOLOGICS: 'advanced_biologics',
  DEBRIDEMENT: 'debridement',
  HYPERBARIC: 'hyperbaric',
} as const;
export type WoundCareType = typeof WoundCareType[keyof typeof WoundCareType];

export type TreatmentInput = {
  category: TreatmentCategory;
  specificType: string;
  dosage?: string;
  duration?: string;
};

export type PatientTreatmentProfile = {
  patientId: string;
  age: number;
  gender: 'male' | 'female';
  bmi: number;
  comorbidities: string[];
  geneticsProxy: {
    cyp2d6Metabolizer: 'poor' | 'intermediate' | 'normal' | 'rapid';
    opioidSensitivity: 'low' | 'normal' | 'high';
    inflammatoryProfile: 'low' | 'moderate' | 'high';
    healingCapacity: 'poor' | 'normal' | 'enhanced';
  };
  priorResponses: Array<{
    category: TreatmentCategory;
    specificType: string;
    responseLevel: ResponseLevel;
    sideEffects: boolean;
  }>;
  currentPainLevel: number; // 0-10
  currentWoundStatus: number; // 0-10 (10=healed)
  currentMobilityScore: number; // 0-10
  infectionPresent: boolean;
  daysSinceSurgery: number;
  renalFunction: number; // eGFR mL/min
  hepaticFunction: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  isSmoker: boolean;
  hasDiabetes: boolean;
  isImmunosuppressed: boolean;
  nutritionStatus: 'adequate' | 'marginal' | 'poor';
};

export type TreatmentPrediction = {
  treatment: TreatmentInput;
  predictedResponse: ResponseLevel;
  responseScore: number; // 0-1 continuous
  confidence: number;
  confidenceInterval: { lower: number; upper: number };
  expectedTimeToEffect: string;
  riskOfSideEffects: number; // 0-1
  explanation: string;
  alternativeTreatments: Array<{
    treatment: string;
    predictedResponse: ResponseLevel;
    responseScore: number;
  }>;
};

export type OutcomeRecord = {
  patientId: string;
  treatment: TreatmentInput;
  predictedScore: number;
  actualResponseLevel: ResponseLevel;
  actualScore: number;
  sideEffectsOccurred: boolean;
  timestamp: number;
};

// ============================================================================
// Gradient Boosted Trees (Simplified)
// ============================================================================

type WeakLearner = {
  featureIndex: number;
  threshold: number;
  leftValue: number;
  rightValue: number;
};

type GBTModel = {
  basePrediction: number;
  trees: WeakLearner[];
  learningRate: number;
};

function extractTreatmentFeatures(
  patient: PatientTreatmentProfile,
  treatment: TreatmentInput
): number[] {
  // Patient features
  const age = patient.age / 100;
  const bmi = patient.bmi / 50;
  const comorbidityCount = Math.min(patient.comorbidities.length, 10) / 10;
  const isMale = patient.gender === 'male' ? 1 : 0;
  const renalFunction = Math.min(patient.renalFunction, 120) / 120;
  const hepaticImpairment = patient.hepaticFunction === 'normal' ? 0 :
    patient.hepaticFunction === 'mild_impairment' ? 0.33 :
    patient.hepaticFunction === 'moderate_impairment' ? 0.67 : 1;
  const isSmoker = patient.isSmoker ? 1 : 0;
  const hasDiabetes = patient.hasDiabetes ? 1 : 0;
  const isImmunosuppressed = patient.isImmunosuppressed ? 1 : 0;
  const nutritionScore = patient.nutritionStatus === 'adequate' ? 1 :
    patient.nutritionStatus === 'marginal' ? 0.5 : 0;

  // Genetics proxy features
  const metabolizer = patient.geneticsProxy.cyp2d6Metabolizer === 'poor' ? 0 :
    patient.geneticsProxy.cyp2d6Metabolizer === 'intermediate' ? 0.33 :
    patient.geneticsProxy.cyp2d6Metabolizer === 'normal' ? 0.67 : 1;
  const opioidSensitivity = patient.geneticsProxy.opioidSensitivity === 'low' ? 0 :
    patient.geneticsProxy.opioidSensitivity === 'normal' ? 0.5 : 1;
  const inflammatoryProfile = patient.geneticsProxy.inflammatoryProfile === 'low' ? 0 :
    patient.geneticsProxy.inflammatoryProfile === 'moderate' ? 0.5 : 1;
  const healingCapacity = patient.geneticsProxy.healingCapacity === 'poor' ? 0 :
    patient.geneticsProxy.healingCapacity === 'normal' ? 0.5 : 1;

  // Clinical state features
  const currentPain = patient.currentPainLevel / 10;
  const woundStatus = patient.currentWoundStatus / 10;
  const mobility = patient.currentMobilityScore / 10;
  const hasInfection = patient.infectionPresent ? 1 : 0;
  const daysSinceSurgery = Math.min(patient.daysSinceSurgery, 60) / 60;

  // Prior response features
  const priorGoodResponses = patient.priorResponses.filter(
    r => r.category === treatment.category && (r.responseLevel === ResponseLevel.EXCELLENT || r.responseLevel === ResponseLevel.GOOD)
  ).length / Math.max(patient.priorResponses.filter(r => r.category === treatment.category).length, 1);
  const priorSideEffects = patient.priorResponses.filter(r => r.sideEffects).length / Math.max(patient.priorResponses.length, 1);

  // Treatment category one-hot
  const isPain = treatment.category === TreatmentCategory.PAIN_MANAGEMENT ? 1 : 0;
  const isAntibiotics = treatment.category === TreatmentCategory.ANTIBIOTICS ? 1 : 0;
  const isPT = treatment.category === TreatmentCategory.PHYSICAL_THERAPY ? 1 : 0;
  const isWoundCare = treatment.category === TreatmentCategory.WOUND_CARE ? 1 : 0;

  return [
    age, bmi, comorbidityCount, isMale, renalFunction, hepaticImpairment,
    isSmoker, hasDiabetes, isImmunosuppressed, nutritionScore,
    metabolizer, opioidSensitivity, inflammatoryProfile, healingCapacity,
    currentPain, woundStatus, mobility, hasInfection, daysSinceSurgery,
    priorGoodResponses, priorSideEffects,
    isPain, isAntibiotics, isPT, isWoundCare,
  ];
}

const FEATURE_NAMES = [
  'age', 'bmi', 'comorbidity_count', 'is_male', 'renal_function',
  'hepatic_impairment', 'smoker', 'diabetes', 'immunosuppressed',
  'nutrition', 'cyp2d6_metabolizer', 'opioid_sensitivity',
  'inflammatory_profile', 'healing_capacity', 'current_pain',
  'wound_status', 'mobility', 'infection', 'days_since_surgery',
  'prior_good_responses', 'prior_side_effects',
  'is_pain_mgmt', 'is_antibiotics', 'is_pt', 'is_wound_care',
];

// Pre-trained weak learners for each treatment category
function buildPainManagementModel(): GBTModel {
  return {
    basePrediction: 0.6,
    learningRate: 0.1,
    trees: [
      { featureIndex: 11, threshold: 0.6, leftValue: -0.15, rightValue: 0.1 },  // opioid sensitivity
      { featureIndex: 10, threshold: 0.4, leftValue: -0.1, rightValue: 0.05 },  // CYP2D6 metabolizer
      { featureIndex: 14, threshold: 0.7, leftValue: 0.05, rightValue: -0.1 },  // current pain level
      { featureIndex: 0, threshold: 0.7, leftValue: 0.05, rightValue: -0.08 },  // age
      { featureIndex: 4, threshold: 0.5, leftValue: -0.08, rightValue: 0.05 },  // renal function
      { featureIndex: 19, threshold: 0.5, leftValue: -0.05, rightValue: 0.1 },  // prior good responses
      { featureIndex: 6, threshold: 0.5, leftValue: 0.03, rightValue: -0.05 },  // smoker
      { featureIndex: 8, threshold: 0.5, leftValue: 0.03, rightValue: -0.07 },  // immunosuppressed
    ],
  };
}

function buildAntibioticsModel(): GBTModel {
  return {
    basePrediction: 0.65,
    learningRate: 0.1,
    trees: [
      { featureIndex: 17, threshold: 0.5, leftValue: 0.1, rightValue: 0.15 },   // infection present
      { featureIndex: 4, threshold: 0.5, leftValue: -0.12, rightValue: 0.05 },  // renal function
      { featureIndex: 5, threshold: 0.5, leftValue: 0.05, rightValue: -0.1 },   // hepatic impairment
      { featureIndex: 8, threshold: 0.5, leftValue: 0.05, rightValue: -0.15 },  // immunosuppressed
      { featureIndex: 7, threshold: 0.5, leftValue: 0.05, rightValue: -0.05 },  // diabetes
      { featureIndex: 12, threshold: 0.6, leftValue: 0.05, rightValue: -0.05 }, // inflammatory profile
      { featureIndex: 9, threshold: 0.3, leftValue: -0.08, rightValue: 0.03 },  // nutrition
    ],
  };
}

function buildPhysicalTherapyModel(): GBTModel {
  return {
    basePrediction: 0.6,
    learningRate: 0.1,
    trees: [
      { featureIndex: 16, threshold: 0.3, leftValue: -0.15, rightValue: 0.1 },  // mobility
      { featureIndex: 14, threshold: 0.6, leftValue: 0.05, rightValue: -0.12 }, // current pain
      { featureIndex: 0, threshold: 0.7, leftValue: 0.05, rightValue: -0.1 },   // age
      { featureIndex: 9, threshold: 0.5, leftValue: -0.08, rightValue: 0.05 },  // nutrition
      { featureIndex: 2, threshold: 0.4, leftValue: 0.05, rightValue: -0.08 },  // comorbidities
      { featureIndex: 19, threshold: 0.5, leftValue: -0.05, rightValue: 0.1 },  // prior responses
      { featureIndex: 1, threshold: 0.7, leftValue: 0.03, rightValue: -0.06 },  // BMI
      { featureIndex: 18, threshold: 0.3, leftValue: 0.05, rightValue: 0.02 },  // days since surgery
    ],
  };
}

function buildWoundCareModel(): GBTModel {
  return {
    basePrediction: 0.55,
    learningRate: 0.1,
    trees: [
      { featureIndex: 15, threshold: 0.5, leftValue: -0.1, rightValue: 0.1 },   // wound status
      { featureIndex: 13, threshold: 0.5, leftValue: -0.12, rightValue: 0.08 }, // healing capacity
      { featureIndex: 7, threshold: 0.5, leftValue: 0.05, rightValue: -0.1 },   // diabetes
      { featureIndex: 9, threshold: 0.5, leftValue: -0.1, rightValue: 0.05 },   // nutrition
      { featureIndex: 6, threshold: 0.5, leftValue: 0.05, rightValue: -0.08 },  // smoker
      { featureIndex: 8, threshold: 0.5, leftValue: 0.03, rightValue: -0.1 },   // immunosuppressed
      { featureIndex: 0, threshold: 0.75, leftValue: 0.03, rightValue: -0.05 }, // age
      { featureIndex: 12, threshold: 0.6, leftValue: 0.03, rightValue: -0.05 }, // inflammatory profile
    ],
  };
}

function predictWithGBT(model: GBTModel, features: number[]): number {
  let prediction = model.basePrediction;

  for (const tree of model.trees) {
    const featureValue = features[tree.featureIndex] ?? 0;
    const leafValue = featureValue < tree.threshold ? tree.leftValue : tree.rightValue;
    prediction += model.learningRate * leafValue;
  }

  return Math.max(0, Math.min(1, prediction));
}

// ============================================================================
// Response Level Classification
// ============================================================================

function classifyResponse(score: number): ResponseLevel {
  if (score >= 0.75) return ResponseLevel.EXCELLENT;
  if (score >= 0.55) return ResponseLevel.GOOD;
  if (score >= 0.35) return ResponseLevel.MODERATE;
  return ResponseLevel.POOR;
}

function responseToScore(level: ResponseLevel): number {
  switch (level) {
    case ResponseLevel.EXCELLENT: return 0.9;
    case ResponseLevel.GOOD: return 0.7;
    case ResponseLevel.MODERATE: return 0.45;
    case ResponseLevel.POOR: return 0.2;
  }
}

// ============================================================================
// Side Effect Risk Estimation
// ============================================================================

function estimateSideEffectRisk(
  patient: PatientTreatmentProfile,
  treatment: TreatmentInput
): number {
  let risk = 0.1; // baseline

  // Age increases risk
  if (patient.age > 70) risk += 0.1;
  else if (patient.age > 60) risk += 0.05;

  // Renal impairment
  if (patient.renalFunction < 60) risk += 0.15;
  else if (patient.renalFunction < 90) risk += 0.05;

  // Hepatic impairment
  if (patient.hepaticFunction === 'severe_impairment') risk += 0.2;
  else if (patient.hepaticFunction === 'moderate_impairment') risk += 0.1;

  // Polypharmacy proxy
  if (patient.comorbidities.length > 5) risk += 0.1;

  // Treatment-specific risks
  if (treatment.category === TreatmentCategory.PAIN_MANAGEMENT) {
    if (treatment.specificType === PainTreatmentType.OPIOID) {
      risk += 0.15;
      if (patient.geneticsProxy.opioidSensitivity === 'high') risk += 0.1;
      if (patient.geneticsProxy.cyp2d6Metabolizer === 'poor') risk += 0.1;
    }
  }
  if (treatment.category === TreatmentCategory.ANTIBIOTICS) {
    if (treatment.specificType === AntibioticType.FLUOROQUINOLONE) risk += 0.1;
    if (treatment.specificType === AntibioticType.GLYCOPEPTIDE) risk += 0.15;
  }

  // Prior side effects
  const priorSE = patient.priorResponses.filter(r => r.sideEffects).length;
  risk += priorSE * 0.05;

  return Math.min(0.9, risk);
}

// ============================================================================
// Time to Effect Estimation
// ============================================================================

function estimateTimeToEffect(treatment: TreatmentInput): string {
  switch (treatment.category) {
    case TreatmentCategory.PAIN_MANAGEMENT:
      if (treatment.specificType === PainTreatmentType.NERVE_BLOCK) return '15-30 minutes';
      if (treatment.specificType === PainTreatmentType.OPIOID) return '30-60 minutes (oral), 5-15 minutes (IV)';
      if (treatment.specificType === PainTreatmentType.NSAID) return '30-60 minutes';
      if (treatment.specificType === PainTreatmentType.GABAPENTINOID) return '1-2 weeks for full effect';
      return '30-60 minutes';

    case TreatmentCategory.ANTIBIOTICS:
      return '48-72 hours for clinical improvement';

    case TreatmentCategory.PHYSICAL_THERAPY:
      if (treatment.specificType === PTIntensity.INTENSIVE) return '1-2 weeks for measurable improvement';
      return '2-4 weeks for functional gains';

    case TreatmentCategory.WOUND_CARE:
      if (treatment.specificType === WoundCareType.NEGATIVE_PRESSURE) return '3-7 days for visible changes';
      if (treatment.specificType === WoundCareType.ADVANCED_BIOLOGICS) return '1-2 weeks';
      return '1-3 weeks for measurable healing';
  }
}

// ============================================================================
// Alternative Treatment Generation
// ============================================================================

function generateAlternatives(
  patient: PatientTreatmentProfile,
  treatment: TreatmentInput,
  models: Map<TreatmentCategory, GBTModel>
): Array<{ treatment: string; predictedResponse: ResponseLevel; responseScore: number }> {
  const alternatives: Array<{ treatment: string; predictedResponse: ResponseLevel; responseScore: number }> = [];

  const categoryAlternatives: Record<TreatmentCategory, Array<{ name: string; type: string }>> = {
    [TreatmentCategory.PAIN_MANAGEMENT]: [
      { name: 'Multimodal analgesia', type: PainTreatmentType.MULTIMODAL },
      { name: 'NSAID therapy', type: PainTreatmentType.NSAID },
      { name: 'Nerve block', type: PainTreatmentType.NERVE_BLOCK },
      { name: 'Gabapentinoid', type: PainTreatmentType.GABAPENTINOID },
      { name: 'Opioid', type: PainTreatmentType.OPIOID },
    ],
    [TreatmentCategory.ANTIBIOTICS]: [
      { name: 'Cephalosporin', type: AntibioticType.CEPHALOSPORIN },
      { name: 'Fluoroquinolone', type: AntibioticType.FLUOROQUINOLONE },
      { name: 'Combination therapy', type: AntibioticType.COMBINATION },
    ],
    [TreatmentCategory.PHYSICAL_THERAPY]: [
      { name: 'Low intensity PT', type: PTIntensity.LOW },
      { name: 'Moderate intensity PT', type: PTIntensity.MODERATE },
      { name: 'High intensity PT', type: PTIntensity.HIGH },
      { name: 'Intensive PT program', type: PTIntensity.INTENSIVE },
    ],
    [TreatmentCategory.WOUND_CARE]: [
      { name: 'Standard dressing changes', type: WoundCareType.STANDARD_DRESSING },
      { name: 'Negative pressure wound therapy', type: WoundCareType.NEGATIVE_PRESSURE },
      { name: 'Advanced biologics', type: WoundCareType.ADVANCED_BIOLOGICS },
    ],
  };

  const alts = categoryAlternatives[treatment.category] ?? [];
  const model = models.get(treatment.category);

  for (const alt of alts) {
    if (alt.type === treatment.specificType) continue;

    const altTreatment: TreatmentInput = { category: treatment.category, specificType: alt.type };
    const features = extractTreatmentFeatures(patient, altTreatment);
    const score = model ? predictWithGBT(model, features) : 0.5;

    alternatives.push({
      treatment: alt.name,
      predictedResponse: classifyResponse(score),
      responseScore: score,
    });
  }

  alternatives.sort((a, b) => b.responseScore - a.responseScore);
  return alternatives.slice(0, 3);
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_PREFIX = 'recovery_pilot_trp_';
const STORAGE_KEYS = {
  OUTCOME_LOG: `${STORAGE_PREFIX}outcome_log`,
  MODEL_ADJUSTMENTS: `${STORAGE_PREFIX}model_adj`,
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// ============================================================================
// TreatmentResponsePredictor Class
// ============================================================================

export class TreatmentResponsePredictor {
  private models: Map<TreatmentCategory, GBTModel>;
  private outcomeLog: OutcomeRecord[];
  private modelAdjustments: Map<string, number>; // category:specificType -> adjustment

  constructor() {
    this.models = new Map();
    this.models.set(TreatmentCategory.PAIN_MANAGEMENT, buildPainManagementModel());
    this.models.set(TreatmentCategory.ANTIBIOTICS, buildAntibioticsModel());
    this.models.set(TreatmentCategory.PHYSICAL_THERAPY, buildPhysicalTherapyModel());
    this.models.set(TreatmentCategory.WOUND_CARE, buildWoundCareModel());

    this.outcomeLog = loadFromStorage<OutcomeRecord[]>(STORAGE_KEYS.OUTCOME_LOG, []);
    const adjEntries = loadFromStorage<Array<[string, number]>>(STORAGE_KEYS.MODEL_ADJUSTMENTS, []);
    this.modelAdjustments = new Map(adjEntries);
  }

  /**
   * Predict treatment response for a patient
   */
  predict(patient: PatientTreatmentProfile, treatment: TreatmentInput): TreatmentPrediction {
    const model = this.models.get(treatment.category);
    if (!model) {
      return this.createDefaultPrediction(treatment);
    }

    const features = extractTreatmentFeatures(patient, treatment);
    let score = predictWithGBT(model, features);

    // Apply learned adjustments
    const adjustmentKey = `${treatment.category}:${treatment.specificType}`;
    const adjustment = this.modelAdjustments.get(adjustmentKey) ?? 0;
    score = Math.max(0, Math.min(1, score + adjustment));

    const predictedResponse = classifyResponse(score);

    // Compute confidence based on outcome log and feature certainty
    const categoryOutcomes = this.outcomeLog.filter(o => o.treatment.category === treatment.category);
    const baseConfidence = 0.6;
    const dataBoost = Math.min(0.3, categoryOutcomes.length * 0.01);
    const confidence = Math.min(0.95, baseConfidence + dataBoost);

    // Confidence interval
    const halfWidth = (1 - confidence) * 0.5;
    const confidenceInterval = {
      lower: Math.max(0, score - halfWidth),
      upper: Math.min(1, score + halfWidth),
    };

    const sideEffectRisk = estimateSideEffectRisk(patient, treatment);
    const timeToEffect = estimateTimeToEffect(treatment);
    const explanation = this.generateExplanation(patient, treatment, features, model, score);
    const alternativeTreatments = generateAlternatives(patient, treatment, this.models);

    return {
      treatment,
      predictedResponse,
      responseScore: score,
      confidence,
      confidenceInterval,
      expectedTimeToEffect: timeToEffect,
      riskOfSideEffects: sideEffectRisk,
      explanation,
      alternativeTreatments,
    };
  }

  /**
   * Record actual treatment outcome for self-learning
   */
  recordOutcome(
    patientId: string,
    treatment: TreatmentInput,
    predictedScore: number,
    actualResponseLevel: ResponseLevel,
    sideEffectsOccurred: boolean
  ): void {
    const actualScore = responseToScore(actualResponseLevel);
    const record: OutcomeRecord = {
      patientId,
      treatment,
      predictedScore,
      actualResponseLevel,
      actualScore,
      sideEffectsOccurred,
      timestamp: Date.now(),
    };
    this.outcomeLog.push(record);

    // Update model adjustments
    const error = actualScore - predictedScore;
    const adjustmentKey = `${treatment.category}:${treatment.specificType}`;
    const currentAdj = this.modelAdjustments.get(adjustmentKey) ?? 0;
    const learningRate = 0.05;
    this.modelAdjustments.set(adjustmentKey, Math.max(-0.2, Math.min(0.2, currentAdj + learningRate * error)));

    this.persistState();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    totalPredictions: number;
    meanAbsoluteError: number;
    accuracyByCategory: Record<string, { predictions: number; meanError: number }>;
    calibrationScore: number;
  } {
    if (this.outcomeLog.length === 0) {
      return { totalPredictions: 0, meanAbsoluteError: 0, accuracyByCategory: {}, calibrationScore: 1 };
    }

    let totalError = 0;
    const categoryStats: Record<string, { errors: number[]; count: number }> = {};

    for (const record of this.outcomeLog) {
      const error = Math.abs(record.predictedScore - record.actualScore);
      totalError += error;

      if (!categoryStats[record.treatment.category]) {
        categoryStats[record.treatment.category] = { errors: [], count: 0 };
      }
      categoryStats[record.treatment.category].errors.push(error);
      categoryStats[record.treatment.category].count++;
    }

    const accuracyByCategory: Record<string, { predictions: number; meanError: number }> = {};
    for (const [cat, stats] of Object.entries(categoryStats)) {
      accuracyByCategory[cat] = {
        predictions: stats.count,
        meanError: stats.errors.reduce((a, b) => a + b, 0) / stats.count,
      };
    }

    // Calibration: for each bin of predicted probabilities, check actual rates
    const bins = [0, 0.25, 0.5, 0.75, 1.0];
    let calibrationError = 0;
    let calibrationBins = 0;

    for (let b = 0; b < bins.length - 1; b++) {
      const binRecords = this.outcomeLog.filter(
        r => r.predictedScore >= bins[b] && r.predictedScore < bins[b + 1]
      );
      if (binRecords.length > 0) {
        const avgPredicted = binRecords.reduce((s, r) => s + r.predictedScore, 0) / binRecords.length;
        const avgActual = binRecords.reduce((s, r) => s + r.actualScore, 0) / binRecords.length;
        calibrationError += Math.abs(avgPredicted - avgActual);
        calibrationBins++;
      }
    }

    return {
      totalPredictions: this.outcomeLog.length,
      meanAbsoluteError: totalError / this.outcomeLog.length,
      accuracyByCategory,
      calibrationScore: calibrationBins > 0 ? 1 - (calibrationError / calibrationBins) : 1,
    };
  }

  /**
   * Get outcome log
   */
  getOutcomeLog(): OutcomeRecord[] {
    return [...this.outcomeLog];
  }

  /**
   * Get model adjustments (learned biases)
   */
  getModelAdjustments(): Map<string, number> {
    return new Map(this.modelAdjustments);
  }

  /**
   * Reset learned state
   */
  resetLearning(): void {
    this.outcomeLog = [];
    this.modelAdjustments.clear();
    this.persistState();
  }

  private createDefaultPrediction(treatment: TreatmentInput): TreatmentPrediction {
    return {
      treatment,
      predictedResponse: ResponseLevel.MODERATE,
      responseScore: 0.5,
      confidence: 0.3,
      confidenceInterval: { lower: 0.3, upper: 0.7 },
      expectedTimeToEffect: 'Unknown',
      riskOfSideEffects: 0.2,
      explanation: 'Insufficient data for this treatment category.',
      alternativeTreatments: [],
    };
  }

  private generateExplanation(
    _patient: PatientTreatmentProfile,
    treatment: TreatmentInput,
    features: number[],
    model: GBTModel,
    score: number
  ): string {
    // Identify top contributing features
    const contributions: Array<{ name: string; contribution: number; direction: string }> = [];

    for (const tree of model.trees) {
      const featureValue = features[tree.featureIndex] ?? 0;
      const leafValue = featureValue < tree.threshold ? tree.leftValue : tree.rightValue;
      const contribution = model.learningRate * leafValue;

      contributions.push({
        name: FEATURE_NAMES[tree.featureIndex] ?? `feature_${tree.featureIndex}`,
        contribution: Math.abs(contribution),
        direction: contribution > 0 ? 'positive' : 'negative',
      });
    }

    contributions.sort((a, b) => b.contribution - a.contribution);
    const topFactors = contributions.slice(0, 3);

    const positiveFactors = topFactors.filter(f => f.direction === 'positive').map(f => f.name);
    const negativeFactors = topFactors.filter(f => f.direction === 'negative').map(f => f.name);

    let explanation = `Predicted ${classifyResponse(score)} response to ${treatment.specificType} ${treatment.category}.`;
    if (positiveFactors.length > 0) {
      explanation += ` Favorable factors: ${positiveFactors.join(', ')}.`;
    }
    if (negativeFactors.length > 0) {
      explanation += ` Risk factors: ${negativeFactors.join(', ')}.`;
    }

    return explanation;
  }

  private persistState(): void {
    saveToStorage(STORAGE_KEYS.OUTCOME_LOG, this.outcomeLog);
    saveToStorage(STORAGE_KEYS.MODEL_ADJUSTMENTS, [...this.modelAdjustments.entries()]);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createTreatmentResponsePredictor(): TreatmentResponsePredictor {
  return new TreatmentResponsePredictor();
}
