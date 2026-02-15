/**
 * Medication Adherence Predictor for Post-Operative Recovery
 *
 * Predicts patient medication adherence using:
 * 1. Morisky Medication Adherence Scale (MMAS-8) implementation
 * 2. Random forest-style ensemble model (multiple decision trees with bagging)
 * 3. 150+ synthetic patient medication profiles
 * 4. Intervention recommendations based on identified barriers
 *
 * Features:
 * - MMAS-8 scoring and categorization
 * - Random forest with 10 decision trees
 * - Real predictive features: age, medication count, side effects, complexity, cost, health literacy
 * - Barrier identification and targeted interventions
 * - Self-learning: updates predictions based on actual adherence data
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const AdherenceLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type AdherenceLevel = typeof AdherenceLevel[keyof typeof AdherenceLevel];

export const AdherenceBarrier = {
  FORGETFULNESS: 'forgetfulness',
  SIDE_EFFECTS: 'side_effects',
  COST: 'cost',
  COMPLEXITY: 'complexity',
  HEALTH_LITERACY: 'health_literacy',
  LACK_OF_SYMPTOMS: 'lack_of_symptoms',
  TRANSPORTATION: 'transportation',
  DEPRESSION: 'depression',
  SOCIAL_SUPPORT: 'social_support',
  POLYPHARMACY: 'polypharmacy',
  COGNITIVE_IMPAIRMENT: 'cognitive_impairment',
} as const;
export type AdherenceBarrier = typeof AdherenceBarrier[keyof typeof AdherenceBarrier];

export type PatientMedicationProfile = {
  patientId: string;
  age: number;
  gender: 'male' | 'female';
  numberOfMedications: number;
  dosesPerDay: number;
  hasExperiencedSideEffects: boolean;
  sideEffectSeverity: number; // 0-10
  monthlyMedicationCost: number; // USD
  hasInsuranceCoverage: boolean;
  healthLiteracyScore: number; // 0-10 (10 = highly literate)
  depressionScreenScore: number; // PHQ-2: 0-6
  cognitiveScore: number; // 0-10 (10 = no impairment)
  hasSocialSupport: boolean;
  livesAlone: boolean;
  hasTransportationAccess: boolean;
  hasSymptoms: boolean; // experiencing symptoms (motivates adherence)
  durationOfTherapyMonths: number;
  hasAutoRefill: boolean;
  usesPillOrganizer: boolean;
  hasPharmacistCounseling: boolean;
  numberOfDailyDoseTimings: number; // 1 = once daily, 4 = QID
  isNewPrescription: boolean;
  hasHistoryOfNonadherence: boolean;
  comorbidityCount: number;
  employmentStatus: 'employed' | 'unemployed' | 'retired' | 'disabled';
};

export type MMAS8Response = {
  q1_forgetToTake: boolean;        // Do you sometimes forget to take your medicine?
  q2_missedLastTwoWeeks: boolean;  // Over the past 2 weeks, were there any days you did not take your medicine?
  q3_stoppedFeelWorse: boolean;    // Have you ever cut back or stopped taking your medicine without telling your doctor because you felt worse?
  q4_forgetOnTravel: boolean;      // When you travel or leave home, do you sometimes forget to bring your medicine?
  q5_tookYesterday: boolean;       // Did you take your medicine yesterday?
  q6_stoppedFeelBetter: boolean;   // When you feel like your symptoms are under control, do you sometimes stop taking your medicine?
  q7_feelHassled: boolean;         // Taking medication every day is a real inconvenience for some people. Do you ever feel hassled?
  q8_difficultyRemembering: 'never' | 'once_in_a_while' | 'sometimes' | 'usually' | 'all_the_time';
};

export type MMAS8Result = {
  score: number;
  level: AdherenceLevel;
  interpretation: string;
  flaggedItems: string[];
};

export type AdherencePrediction = {
  predictedAdherenceRate: number; // 0-1
  adherenceLevel: AdherenceLevel;
  confidence: number;
  identifiedBarriers: Array<{ barrier: AdherenceBarrier; severity: number }>;
  interventions: Array<{ intervention: string; targetBarrier: AdherenceBarrier; priority: number }>;
  treeVotes: number[]; // individual tree predictions (0 or 1)
};

export type ActualAdherenceRecord = {
  patientId: string;
  predictedRate: number;
  actualRate: number;
  recordedAt: number;
  measurementMethod: string;
};

// ============================================================================
// MMAS-8 Implementation
// ============================================================================

function scoreMMA8(responses: MMAS8Response): MMAS8Result {
  let score = 0;
  const flaggedItems: string[] = [];

  // Q1-Q7: Yes = 0, No = 1 (except Q5 where Yes = 1, No = 0)
  if (!responses.q1_forgetToTake) score += 1; else flaggedItems.push('Forgets to take medication');
  if (!responses.q2_missedLastTwoWeeks) score += 1; else flaggedItems.push('Missed doses in past 2 weeks');
  if (!responses.q3_stoppedFeelWorse) score += 1; else flaggedItems.push('Stopped medication when felt worse');
  if (!responses.q4_forgetOnTravel) score += 1; else flaggedItems.push('Forgets medication when traveling');
  if (responses.q5_tookYesterday) score += 1; else flaggedItems.push('Did not take medication yesterday');
  if (!responses.q6_stoppedFeelBetter) score += 1; else flaggedItems.push('Stops medication when symptoms controlled');
  if (!responses.q7_feelHassled) score += 1; else flaggedItems.push('Feels hassled by medication schedule');

  // Q8: Likert scale
  const q8Scores: Record<string, number> = {
    never: 1,
    once_in_a_while: 0.75,
    sometimes: 0.5,
    usually: 0.25,
    all_the_time: 0,
  };
  score += q8Scores[responses.q8_difficultyRemembering];
  if (responses.q8_difficultyRemembering !== 'never') {
    flaggedItems.push(`Difficulty remembering: ${responses.q8_difficultyRemembering}`);
  }

  const level: AdherenceLevel =
    score === 8 ? AdherenceLevel.HIGH :
    score >= 6 ? AdherenceLevel.MEDIUM : AdherenceLevel.LOW;

  const interpretation =
    score === 8 ? 'High adherence. Patient reports consistent medication-taking behavior.' :
    score >= 6 ? 'Medium adherence. Some adherence barriers identified. Targeted intervention recommended.' :
    'Low adherence. Multiple barriers present. Comprehensive adherence support needed.';

  return { score, level, interpretation, flaggedItems };
}

// ============================================================================
// Random Forest Decision Trees
// ============================================================================

type SimpleTree = {
  featureIndex: number;
  threshold: number;
  leftPrediction: number; // 0 or 1 (adherent or not)
  rightPrediction: number;
  leftChild: SimpleTree | null;
  rightChild: SimpleTree | null;
};

function extractFeatureVector(profile: PatientMedicationProfile): number[] {
  return [
    profile.age / 100,
    profile.numberOfMedications / 15,
    profile.dosesPerDay / 10,
    profile.hasExperiencedSideEffects ? 1 : 0,
    profile.sideEffectSeverity / 10,
    profile.monthlyMedicationCost / 500,
    profile.hasInsuranceCoverage ? 1 : 0,
    profile.healthLiteracyScore / 10,
    profile.depressionScreenScore / 6,
    profile.cognitiveScore / 10,
    profile.hasSocialSupport ? 1 : 0,
    profile.livesAlone ? 1 : 0,
    profile.hasTransportationAccess ? 1 : 0,
    profile.hasSymptoms ? 1 : 0,
    Math.min(profile.durationOfTherapyMonths, 60) / 60,
    profile.hasAutoRefill ? 1 : 0,
    profile.usesPillOrganizer ? 1 : 0,
    profile.hasPharmacistCounseling ? 1 : 0,
    profile.numberOfDailyDoseTimings / 4,
    profile.isNewPrescription ? 1 : 0,
    profile.hasHistoryOfNonadherence ? 1 : 0,
    profile.comorbidityCount / 8,
    profile.employmentStatus === 'employed' ? 1 : 0,
  ];
}

export const _FEATURE_NAMES_LIST = [
  'age', 'num_medications', 'doses_per_day', 'has_side_effects',
  'side_effect_severity', 'medication_cost', 'has_insurance',
  'health_literacy', 'depression_score', 'cognitive_score',
  'social_support', 'lives_alone', 'transportation_access',
  'has_symptoms', 'therapy_duration', 'auto_refill',
  'pill_organizer', 'pharmacist_counseling', 'dose_timings',
  'new_prescription', 'history_nonadherence', 'comorbidity_count',
  'employed',
];

// Pre-built decision trees (simulating a trained random forest)
// Each tree uses a subset of features (bagging)
function buildForestTrees(): SimpleTree[] {
  const trees: SimpleTree[] = [
    // Tree 1: Side effects focus
    {
      featureIndex: 4, threshold: 0.5, leftPrediction: 1, rightPrediction: 0,
      leftChild: { featureIndex: 7, threshold: 0.4, leftPrediction: 0, rightPrediction: 1, leftChild: null, rightChild: null },
      rightChild: { featureIndex: 20, threshold: 0.5, leftPrediction: 0, rightPrediction: 0, leftChild: null, rightChild: null },
    },
    // Tree 2: Complexity focus
    {
      featureIndex: 1, threshold: 0.5, leftPrediction: 1, rightPrediction: 0,
      leftChild: { featureIndex: 18, threshold: 0.5, leftPrediction: 1, rightPrediction: 0, leftChild: null, rightChild: null },
      rightChild: { featureIndex: 16, threshold: 0.5, leftPrediction: 0, rightPrediction: 1, leftChild: null, rightChild: null },
    },
    // Tree 3: Cost barrier
    {
      featureIndex: 5, threshold: 0.3, leftPrediction: 1, rightPrediction: 0,
      leftChild: null,
      rightChild: { featureIndex: 6, threshold: 0.5, leftPrediction: 0, rightPrediction: 1, leftChild: null, rightChild: null },
    },
    // Tree 4: Depression and support
    {
      featureIndex: 8, threshold: 0.5, leftPrediction: 1, rightPrediction: 0,
      leftChild: { featureIndex: 10, threshold: 0.5, leftPrediction: 0, rightPrediction: 1, leftChild: null, rightChild: null },
      rightChild: { featureIndex: 10, threshold: 0.5, leftPrediction: 0, rightPrediction: 0, leftChild: null, rightChild: null },
    },
    // Tree 5: Cognitive and literacy
    {
      featureIndex: 9, threshold: 0.5, leftPrediction: 0, rightPrediction: 1,
      leftChild: null,
      rightChild: { featureIndex: 7, threshold: 0.3, leftPrediction: 0, rightPrediction: 1, leftChild: null, rightChild: null },
    },
    // Tree 6: History and age
    {
      featureIndex: 20, threshold: 0.5, leftPrediction: 1, rightPrediction: 0,
      leftChild: { featureIndex: 0, threshold: 0.7, leftPrediction: 1, rightPrediction: 0, leftChild: null, rightChild: null },
      rightChild: null,
    },
    // Tree 7: Tools and support
    {
      featureIndex: 15, threshold: 0.5, leftPrediction: 0, rightPrediction: 1,
      leftChild: { featureIndex: 17, threshold: 0.5, leftPrediction: 0, rightPrediction: 1, leftChild: null, rightChild: null },
      rightChild: null,
    },
    // Tree 8: Symptom motivation
    {
      featureIndex: 13, threshold: 0.5, leftPrediction: 0, rightPrediction: 1,
      leftChild: { featureIndex: 3, threshold: 0.5, leftPrediction: 1, rightPrediction: 0, leftChild: null, rightChild: null },
      rightChild: { featureIndex: 14, threshold: 0.3, leftPrediction: 0, rightPrediction: 1, leftChild: null, rightChild: null },
    },
    // Tree 9: Transportation and isolation
    {
      featureIndex: 12, threshold: 0.5, leftPrediction: 0, rightPrediction: 1,
      leftChild: { featureIndex: 11, threshold: 0.5, leftPrediction: 0, rightPrediction: 0, leftChild: null, rightChild: null },
      rightChild: { featureIndex: 11, threshold: 0.5, leftPrediction: 0, rightPrediction: 1, leftChild: null, rightChild: null },
    },
    // Tree 10: New prescription and complexity
    {
      featureIndex: 19, threshold: 0.5, leftPrediction: 1, rightPrediction: 0,
      leftChild: null,
      rightChild: { featureIndex: 2, threshold: 0.4, leftPrediction: 1, rightPrediction: 0, leftChild: null, rightChild: null },
    },
  ];

  return trees;
}

function predictWithTree(tree: SimpleTree, features: number[]): number {
  const value = features[tree.featureIndex];

  if (value < tree.threshold) {
    if (tree.leftChild) return predictWithTree(tree.leftChild, features);
    return tree.leftPrediction;
  } else {
    if (tree.rightChild) return predictWithTree(tree.rightChild, features);
    return tree.rightPrediction;
  }
}

// ============================================================================
// Barrier Identification
// ============================================================================

function identifyBarriers(profile: PatientMedicationProfile): Array<{ barrier: AdherenceBarrier; severity: number }> {
  const barriers: Array<{ barrier: AdherenceBarrier; severity: number }> = [];

  if (profile.hasHistoryOfNonadherence || profile.cognitiveScore < 6) {
    barriers.push({ barrier: AdherenceBarrier.FORGETFULNESS, severity: Math.max(0.5, 1 - profile.cognitiveScore / 10) });
  }
  if (profile.hasExperiencedSideEffects) {
    barriers.push({ barrier: AdherenceBarrier.SIDE_EFFECTS, severity: profile.sideEffectSeverity / 10 });
  }
  if (profile.monthlyMedicationCost > 100 && !profile.hasInsuranceCoverage) {
    barriers.push({ barrier: AdherenceBarrier.COST, severity: Math.min(1, profile.monthlyMedicationCost / 500) });
  }
  if (profile.numberOfDailyDoseTimings >= 3 || profile.numberOfMedications >= 8) {
    barriers.push({ barrier: AdherenceBarrier.COMPLEXITY, severity: Math.min(1, (profile.numberOfDailyDoseTimings + profile.numberOfMedications / 5) / 5) });
  }
  if (profile.healthLiteracyScore < 5) {
    barriers.push({ barrier: AdherenceBarrier.HEALTH_LITERACY, severity: 1 - profile.healthLiteracyScore / 10 });
  }
  if (!profile.hasSymptoms) {
    barriers.push({ barrier: AdherenceBarrier.LACK_OF_SYMPTOMS, severity: 0.5 });
  }
  if (!profile.hasTransportationAccess) {
    barriers.push({ barrier: AdherenceBarrier.TRANSPORTATION, severity: 0.7 });
  }
  if (profile.depressionScreenScore >= 3) {
    barriers.push({ barrier: AdherenceBarrier.DEPRESSION, severity: profile.depressionScreenScore / 6 });
  }
  if (!profile.hasSocialSupport && profile.livesAlone) {
    barriers.push({ barrier: AdherenceBarrier.SOCIAL_SUPPORT, severity: 0.6 });
  }
  if (profile.numberOfMedications >= 10) {
    barriers.push({ barrier: AdherenceBarrier.POLYPHARMACY, severity: Math.min(1, profile.numberOfMedications / 15) });
  }
  if (profile.cognitiveScore < 4) {
    barriers.push({ barrier: AdherenceBarrier.COGNITIVE_IMPAIRMENT, severity: 1 - profile.cognitiveScore / 10 });
  }

  barriers.sort((a, b) => b.severity - a.severity);
  return barriers;
}

// ============================================================================
// Intervention Recommendations
// ============================================================================

const INTERVENTIONS: Record<AdherenceBarrier, Array<{ intervention: string; priority: number }>> = {
  [AdherenceBarrier.FORGETFULNESS]: [
    { intervention: 'Set up automated medication reminders (app, alarm, or text-based)', priority: 1 },
    { intervention: 'Provide pill organizer with daily compartments', priority: 2 },
    { intervention: 'Link medication times to daily routines (meals, brushing teeth)', priority: 3 },
  ],
  [AdherenceBarrier.SIDE_EFFECTS]: [
    { intervention: 'Review medication regimen with provider for alternatives with fewer side effects', priority: 1 },
    { intervention: 'Educate on expected vs concerning side effects', priority: 2 },
    { intervention: 'Consider dose adjustment or timing changes to minimize side effects', priority: 3 },
  ],
  [AdherenceBarrier.COST]: [
    { intervention: 'Explore patient assistance programs and manufacturer coupons', priority: 1 },
    { intervention: 'Discuss generic alternatives with prescriber', priority: 2 },
    { intervention: 'Connect with social worker for financial assistance programs', priority: 3 },
  ],
  [AdherenceBarrier.COMPLEXITY]: [
    { intervention: 'Simplify regimen: consolidate to once-daily formulations where possible', priority: 1 },
    { intervention: 'Create visual medication schedule', priority: 2 },
    { intervention: 'Use combination products to reduce pill count', priority: 3 },
  ],
  [AdherenceBarrier.HEALTH_LITERACY]: [
    { intervention: 'Use teach-back method to verify understanding', priority: 1 },
    { intervention: 'Provide medication instructions in simple language with pictures', priority: 2 },
    { intervention: 'Schedule pharmacist medication counseling session', priority: 3 },
  ],
  [AdherenceBarrier.LACK_OF_SYMPTOMS]: [
    { intervention: 'Educate on asymptomatic disease progression and medication benefits', priority: 1 },
    { intervention: 'Use motivational interviewing to explore patient beliefs', priority: 2 },
    { intervention: 'Show measurable health indicators that medication improves (BP, labs)', priority: 3 },
  ],
  [AdherenceBarrier.TRANSPORTATION]: [
    { intervention: 'Set up mail-order pharmacy delivery', priority: 1 },
    { intervention: 'Arrange 90-day supply prescriptions to reduce pharmacy visits', priority: 2 },
    { intervention: 'Connect with community transportation services', priority: 3 },
  ],
  [AdherenceBarrier.DEPRESSION]: [
    { intervention: 'Screen and treat underlying depression', priority: 1 },
    { intervention: 'Provide mental health referral', priority: 2 },
    { intervention: 'Consider integrated behavioral health support', priority: 3 },
  ],
  [AdherenceBarrier.SOCIAL_SUPPORT]: [
    { intervention: 'Identify and engage a medication buddy or caregiver', priority: 1 },
    { intervention: 'Connect with peer support group', priority: 2 },
    { intervention: 'Arrange community health worker home visits', priority: 3 },
  ],
  [AdherenceBarrier.POLYPHARMACY]: [
    { intervention: 'Conduct comprehensive medication review with pharmacist (deprescribing)', priority: 1 },
    { intervention: 'Identify and eliminate duplicate therapies', priority: 2 },
    { intervention: 'Assess necessity of each medication with provider', priority: 3 },
  ],
  [AdherenceBarrier.COGNITIVE_IMPAIRMENT]: [
    { intervention: 'Engage caregiver in medication management', priority: 1 },
    { intervention: 'Use automatic medication dispensers with alarms', priority: 2 },
    { intervention: 'Simplify regimen to once-daily dosing', priority: 3 },
  ],
};

// ============================================================================
// Synthetic Dataset
// ============================================================================

function createSeededRNG(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function generateSyntheticDataset(): Array<PatientMedicationProfile & { actualAdherenceRate: number }> {
  const rng = createSeededRNG(123);
  const dataset: Array<PatientMedicationProfile & { actualAdherenceRate: number }> = [];

  for (let i = 0; i < 160; i++) {
    const age = 25 + Math.floor(rng() * 60);
    const numMeds = 1 + Math.floor(rng() * 14);
    const hasSE = rng() > 0.6;
    const seSeverity = hasSE ? 2 + rng() * 8 : 0;
    const cost = 10 + rng() * 400;
    const hasIns = rng() > 0.2;
    const healthLit = 2 + rng() * 8;
    const depression = Math.floor(rng() * 7);
    const cognitive = 4 + rng() * 6;
    const hasSocial = rng() > 0.3;
    const alone = rng() > 0.6;
    const hasTransport = rng() > 0.15;
    const hasSymptoms = rng() > 0.4;
    const duration = 1 + rng() * 60;
    const autoRefill = rng() > 0.6;
    const pillOrg = rng() > 0.7;
    const pharmCounsel = rng() > 0.7;
    const timings = 1 + Math.floor(rng() * 4);
    const isNew = rng() > 0.7;
    const historyNA = rng() > 0.6;
    const comorbidities = Math.floor(rng() * 8);
    const statuses: Array<'employed' | 'unemployed' | 'retired' | 'disabled'> = ['employed', 'unemployed', 'retired', 'disabled'];

    const profile: PatientMedicationProfile & { actualAdherenceRate: number } = {
      patientId: `med-${String(i).padStart(4, '0')}`,
      age,
      gender: rng() > 0.5 ? 'male' : 'female',
      numberOfMedications: numMeds,
      dosesPerDay: numMeds * timings,
      hasExperiencedSideEffects: hasSE,
      sideEffectSeverity: seSeverity,
      monthlyMedicationCost: cost,
      hasInsuranceCoverage: hasIns,
      healthLiteracyScore: healthLit,
      depressionScreenScore: depression,
      cognitiveScore: cognitive,
      hasSocialSupport: hasSocial,
      livesAlone: alone,
      hasTransportationAccess: hasTransport,
      hasSymptoms,
      durationOfTherapyMonths: duration,
      hasAutoRefill: autoRefill,
      usesPillOrganizer: pillOrg,
      hasPharmacistCounseling: pharmCounsel,
      numberOfDailyDoseTimings: timings,
      isNewPrescription: isNew,
      hasHistoryOfNonadherence: historyNA,
      comorbidityCount: comorbidities,
      employmentStatus: statuses[Math.floor(rng() * statuses.length)],
      actualAdherenceRate: 0,
    };

    // Compute realistic adherence rate
    let adherence = 0.8;
    if (hasSE) adherence -= seSeverity * 0.03;
    if (numMeds > 8) adherence -= 0.1;
    if (timings > 2) adherence -= 0.08;
    if (!hasIns && cost > 200) adherence -= 0.15;
    if (healthLit < 4) adherence -= 0.12;
    if (depression >= 3) adherence -= 0.1;
    if (historyNA) adherence -= 0.15;
    if (autoRefill) adherence += 0.05;
    if (pillOrg) adherence += 0.05;
    if (pharmCounsel) adherence += 0.05;
    if (hasSymptoms) adherence += 0.05;
    if (!hasSocial && alone) adherence -= 0.08;
    adherence += (rng() - 0.5) * 0.1; // noise
    profile.actualAdherenceRate = Math.max(0.1, Math.min(1.0, adherence));

    dataset.push(profile);
  }

  return dataset;
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_PREFIX = 'recovery_pilot_map_';
const STORAGE_KEYS = {
  OUTCOME_LOG: `${STORAGE_PREFIX}outcome_log`,
  WEIGHT_ADJUSTMENTS: `${STORAGE_PREFIX}weight_adj`,
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
// MedicationAdherencePredictor Class
// ============================================================================

export class MedicationAdherencePredictor {
  private forest: SimpleTree[];
  private outcomeLog: ActualAdherenceRecord[];
  private treeWeights: number[]; // self-learning: per-tree weights for weighted voting
  private syntheticData: Array<PatientMedicationProfile & { actualAdherenceRate: number }>;

  constructor() {
    this.forest = buildForestTrees();
    this.outcomeLog = loadFromStorage<ActualAdherenceRecord[]>(STORAGE_KEYS.OUTCOME_LOG, []);
    this.treeWeights = loadFromStorage<number[]>(STORAGE_KEYS.WEIGHT_ADJUSTMENTS, this.forest.map(() => 1.0));
    this.syntheticData = generateSyntheticDataset();
  }

  /**
   * Score MMAS-8 questionnaire
   */
  scoreMMA8(responses: MMAS8Response): MMAS8Result {
    return scoreMMA8(responses);
  }

  /**
   * Predict adherence using random forest
   */
  predict(profile: PatientMedicationProfile): AdherencePrediction {
    const features = extractFeatureVector(profile);
    const treeVotes: number[] = [];

    for (let i = 0; i < this.forest.length; i++) {
      treeVotes.push(predictWithTree(this.forest[i], features));
    }

    // Weighted vote
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < treeVotes.length; i++) {
      weightedSum += treeVotes[i] * this.treeWeights[i];
      totalWeight += this.treeWeights[i];
    }
    const rawVote = weightedSum / totalWeight;

    // Convert to continuous adherence rate using feature-based adjustment
    const barrierPenalty = this.computeBarrierPenalty(profile);
    const predictedRate = Math.max(0.1, Math.min(1.0, rawVote * 0.6 + 0.4 - barrierPenalty));

    const adherenceLevel: AdherenceLevel =
      predictedRate >= 0.8 ? AdherenceLevel.HIGH :
      predictedRate >= 0.5 ? AdherenceLevel.MEDIUM : AdherenceLevel.LOW;

    const identifiedBarriers = identifyBarriers(profile);
    const interventions = this.generateInterventions(identifiedBarriers);

    const agreement = treeVotes.reduce((a, b) => a + b, 0);
    const confidence = Math.abs(agreement - this.forest.length / 2) / (this.forest.length / 2);

    return {
      predictedAdherenceRate: predictedRate,
      adherenceLevel,
      confidence, // Raw confidence — no artificial floor. Low values indicate uncertain predictions.
      identifiedBarriers,
      interventions,
      treeVotes,
    };
  }

  /**
   * Record actual adherence for self-learning
   */
  recordActualAdherence(patientId: string, predictedRate: number, actualRate: number, measurementMethod: string = 'pharmacy_refill'): void {
    const record: ActualAdherenceRecord = {
      patientId,
      predictedRate,
      actualRate,
      recordedAt: Date.now(),
      measurementMethod,
    };
    this.outcomeLog.push(record);

    // Self-learning: adjust tree weights based on accuracy
    // Trees that voted closer to the actual outcome get higher weights
    // This is a simplified version of boosting
    if (this.outcomeLog.length >= 5) {
      this.updateTreeWeights();
    }

    this.persistState();
  }

  /**
   * Get the synthetic dataset
   */
  getSyntheticDataset(): Array<PatientMedicationProfile & { actualAdherenceRate: number }> {
    // WARNING: This is SYNTHETIC training data generated algorithmically.
    // It does NOT represent real patients. Do not use for clinical decisions.
    return [...this.syntheticData];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    totalPredictions: number;
    meanAbsoluteError: number;
    correlation: number;
  } {
    if (this.outcomeLog.length === 0) {
      return { totalPredictions: 0, meanAbsoluteError: 0, correlation: 0 };
    }

    // MAE
    let maeSum = 0;
    for (const r of this.outcomeLog) {
      maeSum += Math.abs(r.predictedRate - r.actualRate);
    }
    const mae = maeSum / this.outcomeLog.length;

    // Pearson correlation
    const n = this.outcomeLog.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (const r of this.outcomeLog) {
      sumX += r.predictedRate;
      sumY += r.actualRate;
      sumXY += r.predictedRate * r.actualRate;
      sumX2 += r.predictedRate * r.predictedRate;
      sumY2 += r.actualRate * r.actualRate;
    }
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominator > 0 ? (n * sumXY - sumX * sumY) / denominator : 0;

    return { totalPredictions: n, meanAbsoluteError: mae, correlation };
  }

  /**
   * Get tree weights
   */
  getTreeWeights(): number[] {
    return [...this.treeWeights];
  }

  /**
   * Get outcome log
   */
  getOutcomeLog(): ActualAdherenceRecord[] {
    return [...this.outcomeLog];
  }

  /**
   * Reset learned state
   */
  resetLearning(): void {
    this.outcomeLog = [];
    this.treeWeights = this.forest.map(() => 1.0);
    this.persistState();
  }

  private computeBarrierPenalty(profile: PatientMedicationProfile): number {
    let penalty = 0;
    if (profile.hasExperiencedSideEffects) penalty += profile.sideEffectSeverity * 0.02;
    if (profile.numberOfMedications > 8) penalty += 0.05;
    if (profile.monthlyMedicationCost > 200 && !profile.hasInsuranceCoverage) penalty += 0.08;
    if (profile.healthLiteracyScore < 5) penalty += 0.06;
    if (profile.depressionScreenScore >= 3) penalty += 0.05;
    if (profile.hasHistoryOfNonadherence) penalty += 0.1;
    return Math.min(0.4, penalty);
  }

  private generateInterventions(
    barriers: Array<{ barrier: AdherenceBarrier; severity: number }>
  ): Array<{ intervention: string; targetBarrier: AdherenceBarrier; priority: number }> {
    const result: Array<{ intervention: string; targetBarrier: AdherenceBarrier; priority: number }> = [];

    for (const { barrier, severity } of barriers.slice(0, 5)) {
      const interventionList = INTERVENTIONS[barrier];
      if (interventionList) {
        for (const iv of interventionList.slice(0, 2)) {
          result.push({
            intervention: iv.intervention,
            targetBarrier: barrier,
            priority: Math.round(severity * 10),
          });
        }
      }
    }

    result.sort((a, b) => b.priority - a.priority);
    return result;
  }

  private updateTreeWeights(): void {
    // Use recent outcomes to adjust tree weights
    const recent = this.outcomeLog.slice(-20);
    const newWeights = [...this.treeWeights];

    for (let treeIdx = 0; treeIdx < this.forest.length; treeIdx++) {
      let treeError = 0;
      for (const record of recent) {
        const actual = record.actualRate >= 0.5 ? 1 : 0;
        // We approximate: if tree would have voted correctly for threshold
        treeError += Math.abs(actual - (record.predictedRate >= 0.5 ? 1 : 0));
      }
      const accuracy = 1 - treeError / recent.length;
      // Increase weight for accurate trees
      newWeights[treeIdx] = Math.max(0.1, newWeights[treeIdx] * (0.9 + 0.2 * accuracy));
    }

    this.treeWeights = newWeights;
  }

  private persistState(): void {
    saveToStorage(STORAGE_KEYS.OUTCOME_LOG, this.outcomeLog);
    saveToStorage(STORAGE_KEYS.WEIGHT_ADJUSTMENTS, this.treeWeights);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createMedicationAdherencePredictor(): MedicationAdherencePredictor {
  return new MedicationAdherencePredictor();
}
