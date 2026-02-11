/**
 * Patient Outcome Tracking and Quality Measurement Service
 *
 * Comprehensive service for tracking patient-reported outcome measures (PROMs),
 * auto-scoring validated questionnaires, generating outcome dashboards,
 * computing population-level quality metrics, scheduling assessments, and
 * producing accreditation/research reports.
 *
 * Instruments implemented:
 *   - PROMIS Global Health (10-item short form)
 *   - VAS Pain Scale
 *   - EQ-5D-5L Quality of Life
 *   - PHQ-9 Depression Screening
 *   - GAD-7 Anxiety Screening
 *   - Surgical-Specific: KOOS (Knee), Harris Hip Score
 *   - Patient Satisfaction (HCAHPS-inspired)
 *
 * All scoring algorithms follow published validation references.
 * Seed dataset: 50 patients, 5 surgery types, 6 months of data.
 *
 * Zero external dependencies.
 */

// ============================================================================
// Deterministic seeded PRNG (xorshift32)
// ============================================================================

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0 || 1;
  }

  next(): number {
    let s = this.state;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    this.state = s;
    return (s >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  normal(mean: number, stddev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stddev;
  }

  /** Clamp a normally distributed value. */
  clampedNormal(mean: number, stddev: number, min: number, max: number): number {
    return clamp(Math.round(this.normal(mean, stddev) * 100) / 100, min, max);
  }
}

// ============================================================================
// Utility helpers
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

let _idCounter = 0;
function generateId(prefix: string): string {
  _idCounter++;
  return `${prefix}-${Date.now().toString(36)}-${_idCounter.toString(36)}`;
}

// ============================================================================
// Const-object enums (erasableSyntaxOnly compatible)
// ============================================================================

export const InstrumentType = {
  PROMIS_GLOBAL_HEALTH: 'promis_global_health',
  VAS_PAIN: 'vas_pain',
  EQ5D5L: 'eq5d5l',
  PHQ9: 'phq9',
  GAD7: 'gad7',
  KOOS: 'koos',
  HARRIS_HIP: 'harris_hip',
  PATIENT_SATISFACTION: 'patient_satisfaction',
} as const;
export type InstrumentType = typeof InstrumentType[keyof typeof InstrumentType];

export const SeverityLevel = {
  NONE: 'none',
  MINIMAL: 'minimal',
  MILD: 'mild',
  MODERATE: 'moderate',
  MODERATELY_SEVERE: 'moderately_severe',
  SEVERE: 'severe',
} as const;
export type SeverityLevel = typeof SeverityLevel[keyof typeof SeverityLevel];

export const SurgeryType = {
  TOTAL_KNEE_REPLACEMENT: 'total_knee_replacement',
  TOTAL_HIP_REPLACEMENT: 'total_hip_replacement',
  ACL_RECONSTRUCTION: 'acl_reconstruction',
  ROTATOR_CUFF_REPAIR: 'rotator_cuff_repair',
  LUMBAR_SPINAL_FUSION: 'lumbar_spinal_fusion',
} as const;
export type SurgeryType = typeof SurgeryType[keyof typeof SurgeryType];

export const AssessmentTrigger = {
  SCHEDULED: 'scheduled',
  COMPLICATION: 'complication',
  READMISSION: 'readmission',
  PROVIDER_REQUESTED: 'provider_requested',
  PATIENT_INITIATED: 'patient_initiated',
} as const;
export type AssessmentTrigger = typeof AssessmentTrigger[keyof typeof AssessmentTrigger];

export const AssessmentStatus = {
  SCHEDULED: 'scheduled',
  PENDING: 'pending',
  COMPLETED: 'completed',
  MISSED: 'missed',
  CANCELLED: 'cancelled',
} as const;
export type AssessmentStatus = typeof AssessmentStatus[keyof typeof AssessmentStatus];

export const MilestoneType = {
  RETURN_TO_WORK: 'return_to_work',
  RETURN_TO_DRIVING: 'return_to_driving',
  RETURN_TO_SPORTS: 'return_to_sports',
  INDEPENDENT_ADL: 'independent_adl',
  PAIN_FREE: 'pain_free',
  FULL_ROM: 'full_rom',
  WEIGHT_BEARING: 'weight_bearing',
  DISCONTINUED_NARCOTICS: 'discontinued_narcotics',
} as const;
export type MilestoneType = typeof MilestoneType[keyof typeof MilestoneType];

export const GoalStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  ACHIEVED: 'achieved',
  PARTIALLY_ACHIEVED: 'partially_achieved',
  NOT_ACHIEVED: 'not_achieved',
} as const;
export type GoalStatus = typeof GoalStatus[keyof typeof GoalStatus];

export const ComplicationType = {
  INFECTION: 'infection',
  DVT: 'dvt',
  PULMONARY_EMBOLISM: 'pulmonary_embolism',
  WOUND_DEHISCENCE: 'wound_dehiscence',
  IMPLANT_FAILURE: 'implant_failure',
  NERVE_DAMAGE: 'nerve_damage',
  READMISSION: 'readmission',
  REVISION_SURGERY: 'revision_surgery',
  NONE: 'none',
} as const;
export type ComplicationType = typeof ComplicationType[keyof typeof ComplicationType];

// ============================================================================
// Data models
// ============================================================================

/** Individual question response within a questionnaire. */
export interface QuestionResponse {
  questionId: string;
  questionText: string;
  value: number;
  label: string;
}

/** A completed assessment with responses and computed scores. */
export interface Assessment {
  id: string;
  patientId: string;
  instrumentType: InstrumentType;
  timestamp: string;
  responses: QuestionResponse[];
  totalScore: number;
  subscores: Record<string, number>;
  severity: SeverityLevel;
  percentileRank: number | null;
  trigger: AssessmentTrigger;
}

/** Scheduled assessment that has not yet been completed. */
export interface ScheduledAssessment {
  id: string;
  patientId: string;
  instrumentType: InstrumentType;
  scheduledDate: string;
  status: AssessmentStatus;
  trigger: AssessmentTrigger;
  completedAssessmentId: string | null;
}

/** Patient demographic and surgical information. */
export interface OutcomePatient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  surgeryType: SurgeryType;
  surgeryDate: string;
  surgeonId: string;
  complications: ComplicationType[];
  milestones: RecoveryMilestone[];
  goals: GoalAttainment[];
}

/** A recovery milestone achieved by a patient. */
export interface RecoveryMilestone {
  type: MilestoneType;
  targetDays: number;
  achievedDate: string | null;
  achievedDays: number | null;
}

/** Goal attainment scaling entry. */
export interface GoalAttainment {
  id: string;
  description: string;
  expectedLevel: number;
  achievedLevel: number;
  status: GoalStatus;
  weight: number;
}

/** Change score from baseline with MCID evaluation. */
export interface ChangeScore {
  instrumentType: InstrumentType;
  baselineScore: number;
  currentScore: number;
  absoluteChange: number;
  percentChange: number;
  mcid: number;
  exceedsMCID: boolean;
  direction: 'improved' | 'unchanged' | 'worsened';
}

/** A single data point in a trajectory. */
export interface TrajectoryPoint {
  date: string;
  score: number;
  daysSinceSurgery: number;
  label: string;
}

/** Individual patient outcome dashboard data. */
export interface PatientDashboard {
  patientId: string;
  patientName: string;
  surgeryType: SurgeryType;
  surgeryDate: string;
  trajectories: Record<InstrumentType, TrajectoryPoint[]>;
  preOpScores: Record<InstrumentType, number>;
  latestScores: Record<InstrumentType, number>;
  changeScores: ChangeScore[];
  milestones: RecoveryMilestone[];
  goals: GoalAttainment[];
  goalAttainmentTScore: number;
}

/** Aggregate outcome statistics for a surgery type or provider. */
export interface AggregateOutcome {
  groupLabel: string;
  patientCount: number;
  meanScores: Record<InstrumentType, number>;
  medianScores: Record<InstrumentType, number>;
  mcidAchievementRates: Record<InstrumentType, number>;
  complicationRate: number;
  complicationBreakdown: Record<string, number>;
  averageMilestoneDays: Record<string, number>;
  readmissionRate: number;
}

/** Risk-adjusted outcome for a provider. */
export interface RiskAdjustedOutcome {
  providerId: string;
  patientCount: number;
  observedMeanImprovement: number;
  expectedMeanImprovement: number;
  riskAdjustedScore: number;
  percentileAmongProviders: number;
}

/** Quality report structure. */
export interface QualityReport {
  reportId: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  totalPatients: number;
  bySurgeryType: AggregateOutcome[];
  byProvider: AggregateOutcome[];
  riskAdjusted: RiskAdjustedOutcome[];
  overallComplicationRate: number;
  overallReadmissionRate: number;
  overallMCIDAchievementRate: number;
  overallPatientSatisfactionMean: number;
  summary: string;
}

// ============================================================================
// Instrument definitions and scoring algorithms
// ============================================================================

/** PROMIS Global Health 10-item Short Form */
const PROMIS_QUESTIONS = [
  { id: 'gh1', text: 'In general, would you say your health is...', minVal: 1, maxVal: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
  { id: 'gh2', text: 'In general, would you say your quality of life is...', minVal: 1, maxVal: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
  { id: 'gh3', text: 'In general, how would you rate your physical health?', minVal: 1, maxVal: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
  { id: 'gh4', text: 'In general, how would you rate your mental health?', minVal: 1, maxVal: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
  { id: 'gh5', text: 'In general, how would you rate your satisfaction with social activities?', minVal: 1, maxVal: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
  { id: 'gh6', text: 'To what extent are you able to carry out your everyday physical activities?', minVal: 1, maxVal: 5, labels: ['Not at all', 'A little', 'Moderately', 'Mostly', 'Completely'] },
  { id: 'gh7', text: 'How would you rate your pain on average (0=no pain, 10=worst)?', minVal: 0, maxVal: 10, labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
  { id: 'gh8', text: 'How would you rate your fatigue on average?', minVal: 1, maxVal: 5, labels: ['None', 'Mild', 'Moderate', 'Severe', 'Very Severe'] },
  { id: 'gh9', text: 'In general, please rate how well you carry out your usual social activities.', minVal: 1, maxVal: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
  { id: 'gh10', text: 'How often have you been bothered by emotional problems (anxiety, depression)?', minVal: 1, maxVal: 5, labels: ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'] },
] as const;

/** PHQ-9 Depression Screening */
const PHQ9_QUESTIONS = [
  { id: 'phq1', text: 'Little interest or pleasure in doing things' },
  { id: 'phq2', text: 'Feeling down, depressed, or hopeless' },
  { id: 'phq3', text: 'Trouble falling or staying asleep, or sleeping too much' },
  { id: 'phq4', text: 'Feeling tired or having little energy' },
  { id: 'phq5', text: 'Poor appetite or overeating' },
  { id: 'phq6', text: 'Feeling bad about yourself or that you are a failure' },
  { id: 'phq7', text: 'Trouble concentrating on things, such as reading' },
  { id: 'phq8', text: 'Moving or speaking so slowly that other people noticed, or being fidgety' },
  { id: 'phq9', text: 'Thoughts that you would be better off dead or of hurting yourself' },
] as const;

/** GAD-7 Anxiety Screening */
const GAD7_QUESTIONS = [
  { id: 'gad1', text: 'Feeling nervous, anxious, or on edge' },
  { id: 'gad2', text: 'Not being able to stop or control worrying' },
  { id: 'gad3', text: 'Worrying too much about different things' },
  { id: 'gad4', text: 'Trouble relaxing' },
  { id: 'gad5', text: 'Being so restless that it is hard to sit still' },
  { id: 'gad6', text: 'Becoming easily annoyed or irritable' },
  { id: 'gad7', text: 'Feeling afraid as if something awful might happen' },
] as const;

/** EQ-5D-5L dimensions */
const EQ5D_DIMENSIONS = [
  { id: 'eq_mobility', text: 'Mobility', labels: ['No problems', 'Slight problems', 'Moderate problems', 'Severe problems', 'Unable to walk'] },
  { id: 'eq_selfcare', text: 'Self-Care', labels: ['No problems', 'Slight problems', 'Moderate problems', 'Severe problems', 'Unable to'] },
  { id: 'eq_activity', text: 'Usual Activities', labels: ['No problems', 'Slight problems', 'Moderate problems', 'Severe problems', 'Unable to'] },
  { id: 'eq_pain', text: 'Pain / Discomfort', labels: ['None', 'Slight', 'Moderate', 'Severe', 'Extreme'] },
  { id: 'eq_anxiety', text: 'Anxiety / Depression', labels: ['None', 'Slight', 'Moderate', 'Severe', 'Extreme'] },
] as const;

/** HCAHPS-inspired Patient Satisfaction domains */
const SATISFACTION_QUESTIONS = [
  { id: 'sat1', text: 'Communication with doctors' },
  { id: 'sat2', text: 'Communication with nurses' },
  { id: 'sat3', text: 'Responsiveness of hospital staff' },
  { id: 'sat4', text: 'Pain management' },
  { id: 'sat5', text: 'Communication about medicines' },
  { id: 'sat6', text: 'Cleanliness of hospital environment' },
  { id: 'sat7', text: 'Quietness of hospital environment' },
  { id: 'sat8', text: 'Discharge information' },
  { id: 'sat9', text: 'Care transition' },
  { id: 'sat10', text: 'Overall hospital rating (0-10)' },
] as const;

/** KOOS subscale items */
const KOOS_SUBSCALES = ['symptoms', 'pain', 'adl', 'sport', 'qol'] as const;

/** Harris Hip Score domains */
const HARRIS_DOMAINS = ['pain', 'function', 'deformity', 'range_of_motion'] as const;

// ============================================================================
// MCID values by instrument (published thresholds)
// ============================================================================

const MCID_VALUES: Record<InstrumentType, number> = {
  [InstrumentType.PROMIS_GLOBAL_HEALTH]: 3.0,
  [InstrumentType.VAS_PAIN]: 1.5,
  [InstrumentType.EQ5D5L]: 0.08,
  [InstrumentType.PHQ9]: 5.0,
  [InstrumentType.GAD7]: 4.0,
  [InstrumentType.KOOS]: 10.0,
  [InstrumentType.HARRIS_HIP]: 10.0,
  [InstrumentType.PATIENT_SATISFACTION]: 5.0,
};

// ============================================================================
// Population norm T-score lookup (simplified)
// ============================================================================

/** Population norm means and SDs for percentile ranking. */
const POPULATION_NORMS: Record<InstrumentType, { mean: number; sd: number; higherIsBetter: boolean }> = {
  [InstrumentType.PROMIS_GLOBAL_HEALTH]: { mean: 50, sd: 10, higherIsBetter: true },
  [InstrumentType.VAS_PAIN]: { mean: 35, sd: 20, higherIsBetter: false },
  [InstrumentType.EQ5D5L]: { mean: 0.85, sd: 0.15, higherIsBetter: true },
  [InstrumentType.PHQ9]: { mean: 5, sd: 5, higherIsBetter: false },
  [InstrumentType.GAD7]: { mean: 4, sd: 4, higherIsBetter: false },
  [InstrumentType.KOOS]: { mean: 70, sd: 18, higherIsBetter: true },
  [InstrumentType.HARRIS_HIP]: { mean: 75, sd: 15, higherIsBetter: true },
  [InstrumentType.PATIENT_SATISFACTION]: { mean: 75, sd: 12, higherIsBetter: true },
};

// ============================================================================
// Scoring functions
// ============================================================================

function scorePROMIS(responses: QuestionResponse[]): { total: number; physical: number; mental: number; severity: SeverityLevel } {
  // Physical health items: gh1, gh3, gh6, gh7, gh8 (pain reversed)
  // Mental health items: gh2, gh4, gh5, gh9, gh10
  const physicalIds = new Set(['gh1', 'gh3', 'gh6', 'gh7', 'gh8']);
  const mentalIds = new Set(['gh2', 'gh4', 'gh5', 'gh9', 'gh10']);

  let physicalRaw = 0;
  let mentalRaw = 0;

  for (const r of responses) {
    if (physicalIds.has(r.questionId)) {
      // gh7 is pain 0-10 (reversed), remap to 1-5 reversed
      if (r.questionId === 'gh7') {
        physicalRaw += 5 - Math.round((r.value / 10) * 4);
      } else if (r.questionId === 'gh8') {
        // Fatigue reversed: 1=None(5pts) to 5=Very Severe(1pt)
        physicalRaw += 6 - r.value;
      } else {
        physicalRaw += r.value;
      }
    }
    if (mentalIds.has(r.questionId)) {
      mentalRaw += r.value;
    }
  }

  // Convert raw sums to T-scores (mean=50, SD=10)
  // Raw range per subscale: 5-25; midpoint=15, SD~=4
  const physicalT = round2(50 + 10 * ((physicalRaw - 15) / 4));
  const mentalT = round2(50 + 10 * ((mentalRaw - 15) / 4));
  const total = round2((physicalT + mentalT) / 2);

  let severity: SeverityLevel;
  if (total >= 55) severity = SeverityLevel.NONE;
  else if (total >= 45) severity = SeverityLevel.MILD;
  else if (total >= 35) severity = SeverityLevel.MODERATE;
  else severity = SeverityLevel.SEVERE;

  return { total, physical: physicalT, mental: mentalT, severity };
}

function scorePHQ9(responses: QuestionResponse[]): { total: number; severity: SeverityLevel } {
  const total = responses.reduce((s, r) => s + r.value, 0);
  let severity: SeverityLevel;
  if (total <= 4) severity = SeverityLevel.MINIMAL;
  else if (total <= 9) severity = SeverityLevel.MILD;
  else if (total <= 14) severity = SeverityLevel.MODERATE;
  else if (total <= 19) severity = SeverityLevel.MODERATELY_SEVERE;
  else severity = SeverityLevel.SEVERE;
  return { total, severity };
}

function scoreGAD7(responses: QuestionResponse[]): { total: number; severity: SeverityLevel } {
  const total = responses.reduce((s, r) => s + r.value, 0);
  let severity: SeverityLevel;
  if (total <= 4) severity = SeverityLevel.MINIMAL;
  else if (total <= 9) severity = SeverityLevel.MILD;
  else if (total <= 14) severity = SeverityLevel.MODERATE;
  else severity = SeverityLevel.SEVERE;
  return { total, severity };
}

function scoreEQ5D5L(responses: QuestionResponse[]): { utilityIndex: number; vasScore: number; severity: SeverityLevel } {
  // Simplified EQ-5D-5L crosswalk scoring
  // Each dimension 1-5: 1=no problems, 5=extreme
  // Utility = 1 - sum of decrements
  const decrements = [0, 0, 0.058, 0.112, 0.192, 0.321]; // level -> decrement
  let totalDecrement = 0;
  let vasScore = 0;

  for (const r of responses) {
    if (r.questionId === 'eq_vas') {
      vasScore = r.value;
    } else {
      const level = clamp(Math.round(r.value), 1, 5);
      totalDecrement += decrements[level];
    }
  }

  // N3 term: extra decrement if any dimension is level 3+
  const hasLevel3Plus = responses.some(
    (r) => r.questionId !== 'eq_vas' && r.value >= 3
  );
  if (hasLevel3Plus) {
    totalDecrement += 0.069;
  }

  const utilityIndex = round2(clamp(1 - totalDecrement, -0.594, 1.0));

  let severity: SeverityLevel;
  if (utilityIndex >= 0.85) severity = SeverityLevel.NONE;
  else if (utilityIndex >= 0.70) severity = SeverityLevel.MILD;
  else if (utilityIndex >= 0.50) severity = SeverityLevel.MODERATE;
  else severity = SeverityLevel.SEVERE;

  return { utilityIndex, vasScore, severity };
}

function scoreKOOS(responses: QuestionResponse[]): { total: number; subscales: Record<string, number>; severity: SeverityLevel } {
  // KOOS: each subscale 0-100 (100 = best)
  const subscaleScores: Record<string, number[]> = {};
  for (const sub of KOOS_SUBSCALES) {
    subscaleScores[sub] = [];
  }
  for (const r of responses) {
    const sub = r.questionId.split('_')[1];
    if (sub && sub in subscaleScores) {
      subscaleScores[sub].push(r.value);
    }
  }

  const subscales: Record<string, number> = {};
  for (const sub of KOOS_SUBSCALES) {
    const vals = subscaleScores[sub];
    subscales[sub] = vals.length > 0 ? round2(mean(vals)) : 0;
  }

  const total = round2(mean(Object.values(subscales)));

  let severity: SeverityLevel;
  if (total >= 80) severity = SeverityLevel.NONE;
  else if (total >= 60) severity = SeverityLevel.MILD;
  else if (total >= 40) severity = SeverityLevel.MODERATE;
  else severity = SeverityLevel.SEVERE;

  return { total, subscales, severity };
}

function scoreHarrisHip(responses: QuestionResponse[]): { total: number; domains: Record<string, number>; severity: SeverityLevel } {
  // Harris Hip Score: max 100 (pain=44, function=47, deformity=4, ROM=5)
  const domainScores: Record<string, number[]> = {};
  for (const d of HARRIS_DOMAINS) {
    domainScores[d] = [];
  }
  for (const r of responses) {
    const domain = r.questionId.split('_').slice(1).join('_');
    if (domain && domain in domainScores) {
      domainScores[domain].push(r.value);
    }
  }

  const domains: Record<string, number> = {};
  for (const d of HARRIS_DOMAINS) {
    const vals = domainScores[d];
    domains[d] = vals.length > 0 ? round2(mean(vals)) : 0;
  }

  const total = round2(
    Object.entries(domains).reduce((s, [_k, v]) => s + v, 0)
  );

  let severity: SeverityLevel;
  if (total >= 90) severity = SeverityLevel.NONE;
  else if (total >= 80) severity = SeverityLevel.MILD;
  else if (total >= 70) severity = SeverityLevel.MODERATE;
  else severity = SeverityLevel.SEVERE;

  return { total, domains, severity };
}

function scoreSatisfaction(responses: QuestionResponse[]): { total: number; domains: Record<string, number>; severity: SeverityLevel } {
  // Each item 1-4 (never/sometimes/usually/always) except item 10 which is 0-10
  // Normalize to 0-100 scale
  let sum = 0;
  let count = 0;
  const domains: Record<string, number> = {};

  for (const r of responses) {
    let normalized: number;
    if (r.questionId === 'sat10') {
      normalized = r.value * 10; // 0-10 -> 0-100
    } else {
      normalized = ((r.value - 1) / 3) * 100; // 1-4 -> 0-100
    }
    domains[r.questionId] = round2(normalized);
    sum += normalized;
    count++;
  }

  const total = count > 0 ? round2(sum / count) : 0;

  let severity: SeverityLevel;
  if (total >= 80) severity = SeverityLevel.NONE;
  else if (total >= 60) severity = SeverityLevel.MILD;
  else if (total >= 40) severity = SeverityLevel.MODERATE;
  else severity = SeverityLevel.SEVERE;

  return { total, domains, severity };
}

function scoreVASPain(responses: QuestionResponse[]): { total: number; severity: SeverityLevel } {
  const total = responses.length > 0 ? responses[0].value : 0;
  let severity: SeverityLevel;
  if (total <= 10) severity = SeverityLevel.NONE;
  else if (total <= 30) severity = SeverityLevel.MILD;
  else if (total <= 60) severity = SeverityLevel.MODERATE;
  else severity = SeverityLevel.SEVERE;
  return { total, severity };
}

/** Compute percentile rank against population norms. */
function computePercentileRank(instrumentType: InstrumentType, score: number): number {
  const norm = POPULATION_NORMS[instrumentType];
  const zScore = (score - norm.mean) / norm.sd;
  // Approximate CDF using error function approximation
  const cdf = 0.5 * (1 + erf(zScore / Math.sqrt(2)));
  // For lower-is-better instruments, invert
  const pct = norm.higherIsBetter ? cdf * 100 : (1 - cdf) * 100;
  return round2(clamp(pct, 0.1, 99.9));
}

/** Error function approximation (Abramowitz and Stegun). */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-a * a));
}

// ============================================================================
// Assessment scheduling logic
// ============================================================================

/**
 * Generates the full schedule of assessments for a patient based on
 * surgery date. Schedule:
 *   - Pre-op baseline: 7 days before surgery
 *   - Weekly: weeks 1-4 (days 7, 14, 21, 28)
 *   - Monthly: months 2-6 (days 60, 90, 120, 150, 180)
 *   - Annual: day 365
 *
 * Each assessment window includes all instrument types appropriate
 * for the patient's surgery type.
 */
function generateAssessmentSchedule(
  patient: OutcomePatient
): ScheduledAssessment[] {
  const surgeryDate = new Date(patient.surgeryDate);
  const schedule: ScheduledAssessment[] = [];

  // Determine applicable instruments
  const instruments = getInstrumentsForSurgery(patient.surgeryType);

  // Pre-op baseline
  const preOpDate = addDays(surgeryDate, -7);
  for (const inst of instruments) {
    schedule.push({
      id: generateId('sched'),
      patientId: patient.id,
      instrumentType: inst,
      scheduledDate: toISODate(preOpDate),
      status: AssessmentStatus.SCHEDULED,
      trigger: AssessmentTrigger.SCHEDULED,
      completedAssessmentId: null,
    });
  }

  // Weekly: weeks 1-4
  for (let week = 1; week <= 4; week++) {
    const date = addDays(surgeryDate, week * 7);
    for (const inst of instruments) {
      schedule.push({
        id: generateId('sched'),
        patientId: patient.id,
        instrumentType: inst,
        scheduledDate: toISODate(date),
        status: AssessmentStatus.SCHEDULED,
        trigger: AssessmentTrigger.SCHEDULED,
        completedAssessmentId: null,
      });
    }
  }

  // Monthly: months 2-6
  for (let month = 2; month <= 6; month++) {
    const date = addDays(surgeryDate, month * 30);
    for (const inst of instruments) {
      schedule.push({
        id: generateId('sched'),
        patientId: patient.id,
        instrumentType: inst,
        scheduledDate: toISODate(date),
        status: AssessmentStatus.SCHEDULED,
        trigger: AssessmentTrigger.SCHEDULED,
        completedAssessmentId: null,
      });
    }
  }

  // Annual follow-up
  const annualDate = addDays(surgeryDate, 365);
  for (const inst of instruments) {
    schedule.push({
      id: generateId('sched'),
      patientId: patient.id,
      instrumentType: inst,
      scheduledDate: toISODate(annualDate),
      status: AssessmentStatus.SCHEDULED,
      trigger: AssessmentTrigger.SCHEDULED,
      completedAssessmentId: null,
    });
  }

  return schedule;
}

/** Determine which instruments are applicable for a surgery type. */
function getInstrumentsForSurgery(surgeryType: SurgeryType): InstrumentType[] {
  const base: InstrumentType[] = [
    InstrumentType.PROMIS_GLOBAL_HEALTH,
    InstrumentType.VAS_PAIN,
    InstrumentType.EQ5D5L,
    InstrumentType.PHQ9,
    InstrumentType.GAD7,
    InstrumentType.PATIENT_SATISFACTION,
  ];

  switch (surgeryType) {
    case SurgeryType.TOTAL_KNEE_REPLACEMENT:
    case SurgeryType.ACL_RECONSTRUCTION:
      return [...base, InstrumentType.KOOS];
    case SurgeryType.TOTAL_HIP_REPLACEMENT:
      return [...base, InstrumentType.HARRIS_HIP];
    default:
      return base;
  }
}

// ============================================================================
// Seed data generation: 50 patients, 5 surgery types, 6 months
// ============================================================================

const SURGEON_IDS = ['surgeon-001', 'surgeon-002', 'surgeon-003', 'surgeon-004', 'surgeon-005'] as const;

const SURGERY_TYPES_LIST: SurgeryType[] = [
  SurgeryType.TOTAL_KNEE_REPLACEMENT,
  SurgeryType.TOTAL_HIP_REPLACEMENT,
  SurgeryType.ACL_RECONSTRUCTION,
  SurgeryType.ROTATOR_CUFF_REPAIR,
  SurgeryType.LUMBAR_SPINAL_FUSION,
];

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Dorothy', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah',
  'Timothy', 'Stephanie',
] as const;

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts',
] as const;

/** Expected milestone durations per surgery type (in days). */
const EXPECTED_MILESTONES: Record<SurgeryType, Partial<Record<MilestoneType, number>>> = {
  [SurgeryType.TOTAL_KNEE_REPLACEMENT]: {
    [MilestoneType.WEIGHT_BEARING]: 2,
    [MilestoneType.INDEPENDENT_ADL]: 14,
    [MilestoneType.RETURN_TO_DRIVING]: 28,
    [MilestoneType.DISCONTINUED_NARCOTICS]: 21,
    [MilestoneType.RETURN_TO_WORK]: 42,
    [MilestoneType.FULL_ROM]: 90,
    [MilestoneType.RETURN_TO_SPORTS]: 180,
  },
  [SurgeryType.TOTAL_HIP_REPLACEMENT]: {
    [MilestoneType.WEIGHT_BEARING]: 1,
    [MilestoneType.INDEPENDENT_ADL]: 10,
    [MilestoneType.RETURN_TO_DRIVING]: 21,
    [MilestoneType.DISCONTINUED_NARCOTICS]: 14,
    [MilestoneType.RETURN_TO_WORK]: 35,
    [MilestoneType.FULL_ROM]: 60,
    [MilestoneType.RETURN_TO_SPORTS]: 120,
  },
  [SurgeryType.ACL_RECONSTRUCTION]: {
    [MilestoneType.WEIGHT_BEARING]: 7,
    [MilestoneType.INDEPENDENT_ADL]: 21,
    [MilestoneType.RETURN_TO_DRIVING]: 28,
    [MilestoneType.DISCONTINUED_NARCOTICS]: 14,
    [MilestoneType.RETURN_TO_WORK]: 30,
    [MilestoneType.FULL_ROM]: 120,
    [MilestoneType.RETURN_TO_SPORTS]: 270,
  },
  [SurgeryType.ROTATOR_CUFF_REPAIR]: {
    [MilestoneType.INDEPENDENT_ADL]: 42,
    [MilestoneType.RETURN_TO_DRIVING]: 35,
    [MilestoneType.DISCONTINUED_NARCOTICS]: 21,
    [MilestoneType.RETURN_TO_WORK]: 60,
    [MilestoneType.FULL_ROM]: 120,
    [MilestoneType.RETURN_TO_SPORTS]: 180,
  },
  [SurgeryType.LUMBAR_SPINAL_FUSION]: {
    [MilestoneType.WEIGHT_BEARING]: 1,
    [MilestoneType.INDEPENDENT_ADL]: 28,
    [MilestoneType.RETURN_TO_DRIVING]: 42,
    [MilestoneType.DISCONTINUED_NARCOTICS]: 30,
    [MilestoneType.RETURN_TO_WORK]: 90,
    [MilestoneType.FULL_ROM]: 180,
  },
};

/** Complication probability per surgery type. */
const COMPLICATION_RATES: Record<SurgeryType, number> = {
  [SurgeryType.TOTAL_KNEE_REPLACEMENT]: 0.12,
  [SurgeryType.TOTAL_HIP_REPLACEMENT]: 0.10,
  [SurgeryType.ACL_RECONSTRUCTION]: 0.08,
  [SurgeryType.ROTATOR_CUFF_REPAIR]: 0.09,
  [SurgeryType.LUMBAR_SPINAL_FUSION]: 0.15,
};

const POSSIBLE_COMPLICATIONS: ComplicationType[] = [
  ComplicationType.INFECTION,
  ComplicationType.DVT,
  ComplicationType.WOUND_DEHISCENCE,
  ComplicationType.NERVE_DAMAGE,
  ComplicationType.READMISSION,
];

/**
 * Simulate realistic questionnaire responses for a given instrument,
 * at a given point in recovery. Earlier post-op = worse scores,
 * improving over time with individual variation.
 */
function simulateResponses(
  rng: SeededRandom,
  instrumentType: InstrumentType,
  daysSinceSurgery: number,
  hasComplication: boolean,
  baseQuality: number // 0-1 patient individual factor (higher = better outcomes)
): QuestionResponse[] {
  // Recovery trajectory: exponential improvement from post-op baseline
  // Pre-op (negative days): moderate impairment due to condition needing surgery
  const recoveryProgress = daysSinceSurgery < 0
    ? 0.4  // pre-op baseline
    : clamp(0.3 + 0.7 * (1 - Math.exp(-daysSinceSurgery / 90)), 0.3, 0.95);

  const complicationPenalty = hasComplication ? 0.15 : 0;
  const effectiveQuality = clamp(
    recoveryProgress * baseQuality - complicationPenalty,
    0.05,
    0.95
  );

  switch (instrumentType) {
    case InstrumentType.PROMIS_GLOBAL_HEALTH:
      return simulatePROMIS(rng, effectiveQuality);
    case InstrumentType.VAS_PAIN:
      return simulateVASPain(rng, effectiveQuality);
    case InstrumentType.EQ5D5L:
      return simulateEQ5D(rng, effectiveQuality);
    case InstrumentType.PHQ9:
      return simulatePHQ9(rng, effectiveQuality);
    case InstrumentType.GAD7:
      return simulateGAD7(rng, effectiveQuality);
    case InstrumentType.KOOS:
      return simulateKOOS(rng, effectiveQuality);
    case InstrumentType.HARRIS_HIP:
      return simulateHarrisHip(rng, effectiveQuality);
    case InstrumentType.PATIENT_SATISFACTION:
      return simulateSatisfaction(rng, effectiveQuality);
  }
}

function simulatePROMIS(rng: SeededRandom, quality: number): QuestionResponse[] {
  return PROMIS_QUESTIONS.map((q) => {
    let value: number;
    if (q.id === 'gh7') {
      // Pain 0-10, lower is better
      value = Math.round(clamp(rng.normal(10 * (1 - quality), 1.5), 0, 10));
    } else {
      // 1-5, higher is better
      value = Math.round(clamp(rng.normal(1 + 4 * quality, 0.7), 1, 5));
    }
    return {
      questionId: q.id,
      questionText: q.text,
      value,
      label: q.labels[Math.min(value, q.labels.length - 1)] ?? String(value),
    };
  });
}

function simulateVASPain(rng: SeededRandom, quality: number): QuestionResponse[] {
  const vas = Math.round(clamp(rng.normal(100 * (1 - quality), 12), 0, 100));
  return [{
    questionId: 'vas_pain',
    questionText: 'Please mark your current pain level on a 0-100 scale',
    value: vas,
    label: `${vas}/100`,
  }];
}

function simulateEQ5D(rng: SeededRandom, quality: number): QuestionResponse[] {
  const responses: QuestionResponse[] = EQ5D_DIMENSIONS.map((d) => {
    // 1-5, 1 is best
    const val = Math.round(clamp(rng.normal(1 + 4 * (1 - quality), 0.8), 1, 5));
    return {
      questionId: d.id,
      questionText: d.text,
      value: val,
      label: d.labels[val - 1] ?? String(val),
    };
  });
  // Add VAS (0-100)
  const vasVal = Math.round(clamp(rng.normal(quality * 100, 10), 0, 100));
  responses.push({
    questionId: 'eq_vas',
    questionText: 'Your health today (0-100)',
    value: vasVal,
    label: `${vasVal}/100`,
  });
  return responses;
}

function simulatePHQ9(rng: SeededRandom, quality: number): QuestionResponse[] {
  return PHQ9_QUESTIONS.map((q) => {
    // 0-3, 0 is best; worse quality -> higher scores
    const val = Math.round(clamp(rng.normal(3 * (1 - quality), 0.6), 0, 3));
    const labels = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
    return {
      questionId: q.id,
      questionText: q.text,
      value: val,
      label: labels[val] ?? String(val),
    };
  });
}

function simulateGAD7(rng: SeededRandom, quality: number): QuestionResponse[] {
  return GAD7_QUESTIONS.map((q) => {
    const val = Math.round(clamp(rng.normal(3 * (1 - quality), 0.5), 0, 3));
    const labels = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
    return {
      questionId: q.id,
      questionText: q.text,
      value: val,
      label: labels[val] ?? String(val),
    };
  });
}

function simulateKOOS(rng: SeededRandom, quality: number): QuestionResponse[] {
  const responses: QuestionResponse[] = [];
  for (const sub of KOOS_SUBSCALES) {
    // 5 items per subscale, each 0-100, higher is better
    for (let i = 0; i < 5; i++) {
      const val = round2(clamp(rng.normal(quality * 100, 10), 0, 100));
      responses.push({
        questionId: `koos_${sub}_${i + 1}`,
        questionText: `KOOS ${sub} item ${i + 1}`,
        value: val,
        label: `${val}/100`,
      });
    }
  }
  return responses;
}

function simulateHarrisHip(rng: SeededRandom, quality: number): QuestionResponse[] {
  const responses: QuestionResponse[] = [];
  const maxScores: Record<string, number> = { pain: 44, function: 47, deformity: 4, range_of_motion: 5 };
  for (const domain of HARRIS_DOMAINS) {
    const maxScore = maxScores[domain];
    const val = round2(clamp(rng.normal(quality * maxScore, maxScore * 0.1), 0, maxScore));
    responses.push({
      questionId: `hhs_${domain}`,
      questionText: `Harris Hip Score - ${domain}`,
      value: val,
      label: `${val}/${maxScore}`,
    });
  }
  return responses;
}

function simulateSatisfaction(rng: SeededRandom, quality: number): QuestionResponse[] {
  return SATISFACTION_QUESTIONS.map((q) => {
    let val: number;
    if (q.id === 'sat10') {
      val = Math.round(clamp(rng.normal(quality * 10, 1.2), 0, 10));
    } else {
      val = Math.round(clamp(rng.normal(1 + 3 * quality, 0.5), 1, 4));
    }
    return {
      questionId: q.id,
      questionText: q.text,
      value: val,
      label: String(val),
    };
  });
}

// ============================================================================
// Seed data generator
// ============================================================================

interface SeedData {
  patients: OutcomePatient[];
  assessments: Assessment[];
  scheduledAssessments: ScheduledAssessment[];
}

export function generateOutcomeSeedData(): SeedData {
  const rng = new SeededRandom(20250101);
  const patients: OutcomePatient[] = [];
  const assessments: Assessment[] = [];
  const allScheduled: ScheduledAssessment[] = [];

  const baseSurgeryDate = new Date('2025-07-01');

  for (let i = 0; i < 50; i++) {
    const surgeryType = SURGERY_TYPES_LIST[i % 5];
    const surgeonId = SURGEON_IDS[i % 5];
    const surgeryOffset = Math.floor(i / 5) * 3; // stagger surgeries by 3 days per cohort
    const surgeryDate = addDays(baseSurgeryDate, surgeryOffset);
    const patientId = `outcome-patient-${(i + 1).toString().padStart(3, '0')}`;

    // Individual patient quality factor (higher = better outcomes)
    const baseQuality = rng.float(0.55, 0.95);

    // Determine complications
    const hasComplication = rng.next() < COMPLICATION_RATES[surgeryType];
    const complications: ComplicationType[] = [];
    if (hasComplication) {
      complications.push(rng.pick(POSSIBLE_COMPLICATIONS));
      // Small chance of second complication
      if (rng.next() < 0.15) {
        const second = rng.pick(POSSIBLE_COMPLICATIONS.filter((c) => !complications.includes(c)));
        complications.push(second);
      }
    }

    // Generate milestones
    const expectedMs = EXPECTED_MILESTONES[surgeryType];
    const milestones: RecoveryMilestone[] = [];
    const today = new Date('2026-01-15'); // simulated "today" for seed data
    const maxDaysSinceSurgery = daysBetween(surgeryDate, today);

    for (const [msType, targetDays] of Object.entries(expectedMs)) {
      const variation = rng.float(0.7, 1.4);
      const complicationDelay = hasComplication ? rng.float(1.1, 1.5) : 1.0;
      const qualityFactor = 2.0 - baseQuality; // lower quality -> slower milestone
      const actualDays = Math.round(targetDays * variation * complicationDelay * qualityFactor);
      const achieved = actualDays <= maxDaysSinceSurgery;

      milestones.push({
        type: msType as MilestoneType,
        targetDays,
        achievedDate: achieved ? toISODate(addDays(surgeryDate, actualDays)) : null,
        achievedDays: achieved ? actualDays : null,
      });
    }

    // Generate goals (goal attainment scaling)
    const goals: GoalAttainment[] = [
      {
        id: `goal-${patientId}-1`,
        description: 'Reduce pain to mild level (VAS < 30)',
        expectedLevel: 0,
        achievedLevel: clamp(Math.round(rng.normal(baseQuality > 0.7 ? 1 : -1, 0.8)), -2, 2),
        status: baseQuality > 0.75 ? GoalStatus.ACHIEVED : baseQuality > 0.6 ? GoalStatus.IN_PROGRESS : GoalStatus.NOT_STARTED,
        weight: 1.0,
      },
      {
        id: `goal-${patientId}-2`,
        description: 'Return to independent daily activities',
        expectedLevel: 0,
        achievedLevel: clamp(Math.round(rng.normal(baseQuality > 0.65 ? 0.5 : -0.5, 1.0)), -2, 2),
        status: baseQuality > 0.7 ? GoalStatus.ACHIEVED : baseQuality > 0.55 ? GoalStatus.PARTIALLY_ACHIEVED : GoalStatus.IN_PROGRESS,
        weight: 1.0,
      },
      {
        id: `goal-${patientId}-3`,
        description: 'Achieve target range of motion',
        expectedLevel: 0,
        achievedLevel: clamp(Math.round(rng.normal(baseQuality > 0.7 ? 0 : -1, 1.0)), -2, 2),
        status: baseQuality > 0.8 ? GoalStatus.ACHIEVED : GoalStatus.IN_PROGRESS,
        weight: 0.8,
      },
      {
        id: `goal-${patientId}-4`,
        description: 'Return to work/occupational activities',
        expectedLevel: 0,
        achievedLevel: clamp(Math.round(rng.normal(baseQuality > 0.75 ? 1 : -0.5, 1.2)), -2, 2),
        status: maxDaysSinceSurgery > 60 && baseQuality > 0.65
          ? GoalStatus.ACHIEVED
          : GoalStatus.IN_PROGRESS,
        weight: 0.7,
      },
    ];

    const patient: OutcomePatient = {
      id: patientId,
      name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
      age: rng.int(35, 78),
      gender: rng.next() > 0.5 ? 'male' : 'female',
      surgeryType,
      surgeryDate: toISODate(surgeryDate),
      surgeonId,
      complications,
      milestones,
      goals,
    };
    patients.push(patient);

    // Generate assessment schedule
    const schedule = generateAssessmentSchedule(patient);

    // Assessment timepoints relative to surgery date
    // Pre-op: day -7
    // Weekly: days 7, 14, 21, 28
    // Monthly: days 60, 90, 120, 150, 180
    const assessmentDays = [-7, 7, 14, 21, 28, 60, 90, 120, 150, 180];
    const instruments = getInstrumentsForSurgery(surgeryType);

    for (const dayOffset of assessmentDays) {
      const assessmentDate = addDays(surgeryDate, dayOffset);
      if (assessmentDate > today) continue; // Only complete assessments up to "today"

      // Small chance of missing an assessment (5%)
      const missed = rng.next() < 0.05;

      for (const inst of instruments) {
        if (missed) {
          // Find corresponding scheduled assessment and mark missed
          const sched = schedule.find(
            (s) =>
              s.instrumentType === inst &&
              s.scheduledDate === toISODate(assessmentDate)
          );
          if (sched) {
            sched.status = AssessmentStatus.MISSED;
          }
          continue;
        }

        const responses = simulateResponses(
          rng,
          inst,
          dayOffset,
          hasComplication,
          baseQuality
        );

        const scored = scoreAssessment(inst, responses);

        const assessment: Assessment = {
          id: generateId('assess'),
          patientId,
          instrumentType: inst,
          timestamp: addDays(assessmentDate, 0).toISOString(),
          responses,
          totalScore: scored.total,
          subscores: scored.subscores,
          severity: scored.severity,
          percentileRank: computePercentileRank(inst, scored.total),
          trigger: AssessmentTrigger.SCHEDULED,
        };
        assessments.push(assessment);

        // Mark corresponding scheduled assessment as completed
        const sched = schedule.find(
          (s) =>
            s.instrumentType === inst &&
            s.scheduledDate === toISODate(assessmentDate) &&
            s.status === AssessmentStatus.SCHEDULED
        );
        if (sched) {
          sched.status = AssessmentStatus.COMPLETED;
          sched.completedAssessmentId = assessment.id;
        }
      }
    }

    // If patient had complication, add triggered assessment
    if (hasComplication && maxDaysSinceSurgery > 14) {
      const triggerDay = rng.int(10, 30);
      const triggerDate = addDays(surgeryDate, triggerDay);
      if (triggerDate <= today) {
        for (const inst of [InstrumentType.VAS_PAIN, InstrumentType.PHQ9]) {
          const responses = simulateResponses(rng, inst, triggerDay, true, baseQuality * 0.8);
          const scored = scoreAssessment(inst, responses);

          const assessment: Assessment = {
            id: generateId('assess'),
            patientId,
            instrumentType: inst,
            timestamp: triggerDate.toISOString(),
            responses,
            totalScore: scored.total,
            subscores: scored.subscores,
            severity: scored.severity,
            percentileRank: computePercentileRank(inst, scored.total),
            trigger: AssessmentTrigger.COMPLICATION,
          };
          assessments.push(assessment);

          schedule.push({
            id: generateId('sched'),
            patientId,
            instrumentType: inst,
            scheduledDate: toISODate(triggerDate),
            status: AssessmentStatus.COMPLETED,
            trigger: AssessmentTrigger.COMPLICATION,
            completedAssessmentId: assessment.id,
          });
        }
      }
    }

    allScheduled.push(...schedule);
  }

  return { patients, assessments, scheduledAssessments: allScheduled };
}

/** Score an assessment using the appropriate algorithm. */
function scoreAssessment(
  instrumentType: InstrumentType,
  responses: QuestionResponse[]
): { total: number; subscores: Record<string, number>; severity: SeverityLevel } {
  switch (instrumentType) {
    case InstrumentType.PROMIS_GLOBAL_HEALTH: {
      const s = scorePROMIS(responses);
      return { total: s.total, subscores: { physical: s.physical, mental: s.mental }, severity: s.severity };
    }
    case InstrumentType.VAS_PAIN: {
      const s = scoreVASPain(responses);
      return { total: s.total, subscores: {}, severity: s.severity };
    }
    case InstrumentType.EQ5D5L: {
      const s = scoreEQ5D5L(responses);
      return { total: s.utilityIndex, subscores: { vas: s.vasScore }, severity: s.severity };
    }
    case InstrumentType.PHQ9: {
      const s = scorePHQ9(responses);
      return { total: s.total, subscores: {}, severity: s.severity };
    }
    case InstrumentType.GAD7: {
      const s = scoreGAD7(responses);
      return { total: s.total, subscores: {}, severity: s.severity };
    }
    case InstrumentType.KOOS: {
      const s = scoreKOOS(responses);
      return { total: s.total, subscores: s.subscales, severity: s.severity };
    }
    case InstrumentType.HARRIS_HIP: {
      const s = scoreHarrisHip(responses);
      return { total: s.total, subscores: s.domains, severity: s.severity };
    }
    case InstrumentType.PATIENT_SATISFACTION: {
      const s = scoreSatisfaction(responses);
      return { total: s.total, subscores: s.domains, severity: s.severity };
    }
  }
}

// ============================================================================
// OutcomeTrackingService implementation
// ============================================================================

class OutcomeTrackingServiceImpl {
  private patients: Map<string, OutcomePatient> = new Map();
  private assessments: Assessment[] = [];
  private scheduledAssessments: ScheduledAssessment[] = [];

  // --------------------------------------------------------------------------
  // Data loading
  // --------------------------------------------------------------------------

  /** Load seed data into the service. */
  loadSeedData(data: SeedData): void {
    for (const p of data.patients) {
      this.patients.set(p.id, p);
    }
    this.assessments.push(...data.assessments);
    this.scheduledAssessments.push(...data.scheduledAssessments);
  }

  /** Clear all data. */
  clearAll(): void {
    this.patients.clear();
    this.assessments = [];
    this.scheduledAssessments = [];
  }

  // --------------------------------------------------------------------------
  // Patient management
  // --------------------------------------------------------------------------

  /** Register a patient. */
  registerPatient(patient: OutcomePatient): OutcomePatient {
    this.patients.set(patient.id, patient);
    return patient;
  }

  /** Retrieve a patient by ID. */
  getPatient(patientId: string): OutcomePatient | null {
    return this.patients.get(patientId) ?? null;
  }

  /** Retrieve all patients. */
  getAllPatients(): OutcomePatient[] {
    return [...this.patients.values()];
  }

  /** Get patients by surgery type. */
  getPatientsBySurgeryType(surgeryType: SurgeryType): OutcomePatient[] {
    return [...this.patients.values()].filter((p) => p.surgeryType === surgeryType);
  }

  /** Get patients by surgeon. */
  getPatientsBySurgeon(surgeonId: string): OutcomePatient[] {
    return [...this.patients.values()].filter((p) => p.surgeonId === surgeonId);
  }

  // --------------------------------------------------------------------------
  // Assessment recording and scoring
  // --------------------------------------------------------------------------

  /**
   * Record a new completed assessment. Auto-scores using the validated
   * scoring algorithm for the instrument type.
   */
  recordAssessment(
    patientId: string,
    instrumentType: InstrumentType,
    responses: QuestionResponse[],
    trigger: AssessmentTrigger = AssessmentTrigger.SCHEDULED
  ): Assessment {
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    const scored = scoreAssessment(instrumentType, responses);
    const percentileRank = computePercentileRank(instrumentType, scored.total);

    const assessment: Assessment = {
      id: generateId('assess'),
      patientId,
      instrumentType,
      timestamp: new Date().toISOString(),
      responses,
      totalScore: scored.total,
      subscores: scored.subscores,
      severity: scored.severity,
      percentileRank,
      trigger,
    };

    this.assessments.push(assessment);

    // Update scheduled assessment if applicable
    const pending = this.scheduledAssessments.find(
      (s) =>
        s.patientId === patientId &&
        s.instrumentType === instrumentType &&
        s.status === AssessmentStatus.SCHEDULED
    );
    if (pending) {
      pending.status = AssessmentStatus.COMPLETED;
      pending.completedAssessmentId = assessment.id;
    }

    return assessment;
  }

  /** Bulk-load assessments (for seed data). */
  loadAssessments(items: Assessment[]): void {
    this.assessments.push(...items);
  }

  /** Get all assessments for a patient, optionally filtered by instrument. */
  getAssessments(
    patientId: string,
    instrumentType?: InstrumentType
  ): Assessment[] {
    let results = this.assessments.filter((a) => a.patientId === patientId);
    if (instrumentType) {
      results = results.filter((a) => a.instrumentType === instrumentType);
    }
    return results.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /** Get the most recent assessment for a patient and instrument. */
  getLatestAssessment(
    patientId: string,
    instrumentType: InstrumentType
  ): Assessment | null {
    const all = this.getAssessments(patientId, instrumentType);
    return all.length > 0 ? all[all.length - 1] : null;
  }

  /** Get baseline (first) assessment for a patient and instrument. */
  getBaselineAssessment(
    patientId: string,
    instrumentType: InstrumentType
  ): Assessment | null {
    const all = this.getAssessments(patientId, instrumentType);
    return all.length > 0 ? all[0] : null;
  }

  // --------------------------------------------------------------------------
  // Change scores and MCID tracking
  // --------------------------------------------------------------------------

  /**
   * Compute change scores from baseline for all instruments for a patient.
   * Evaluates whether the Minimal Clinically Important Difference is achieved.
   */
  getChangeScores(patientId: string): ChangeScore[] {
    const patient = this.patients.get(patientId);
    if (!patient) return [];

    const instruments = getInstrumentsForSurgery(patient.surgeryType);
    const results: ChangeScore[] = [];

    for (const inst of instruments) {
      const baseline = this.getBaselineAssessment(patientId, inst);
      const latest = this.getLatestAssessment(patientId, inst);
      if (!baseline || !latest || baseline.id === latest.id) continue;

      const absoluteChange = round2(latest.totalScore - baseline.totalScore);
      const percentChange = baseline.totalScore !== 0
        ? round2((absoluteChange / Math.abs(baseline.totalScore)) * 100)
        : 0;

      const norm = POPULATION_NORMS[inst];
      const mcid = MCID_VALUES[inst];

      let direction: 'improved' | 'unchanged' | 'worsened';
      if (norm.higherIsBetter) {
        if (absoluteChange > mcid * 0.5) direction = 'improved';
        else if (absoluteChange < -mcid * 0.5) direction = 'worsened';
        else direction = 'unchanged';
      } else {
        if (absoluteChange < -mcid * 0.5) direction = 'improved';
        else if (absoluteChange > mcid * 0.5) direction = 'worsened';
        else direction = 'unchanged';
      }

      const exceedsMCID = norm.higherIsBetter
        ? absoluteChange >= mcid
        : absoluteChange <= -mcid;

      results.push({
        instrumentType: inst,
        baselineScore: baseline.totalScore,
        currentScore: latest.totalScore,
        absoluteChange,
        percentChange,
        mcid,
        exceedsMCID,
        direction,
      });
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Individual patient dashboard
  // --------------------------------------------------------------------------

  /**
   * Build a comprehensive outcome dashboard for a single patient,
   * including trajectories, pre-op vs post-op comparison, milestones,
   * goals, and goal attainment T-score.
   */
  getPatientDashboard(patientId: string): PatientDashboard | null {
    const patient = this.patients.get(patientId);
    if (!patient) return null;

    const instruments = getInstrumentsForSurgery(patient.surgeryType);
    const surgeryDate = new Date(patient.surgeryDate);

    // Build trajectories for each instrument
    const trajectories = {} as Record<InstrumentType, TrajectoryPoint[]>;
    const preOpScores = {} as Record<InstrumentType, number>;
    const latestScores = {} as Record<InstrumentType, number>;

    for (const inst of instruments) {
      const allAssessments = this.getAssessments(patientId, inst);
      trajectories[inst] = allAssessments.map((a) => {
        const d = new Date(a.timestamp);
        const daysSince = daysBetween(surgeryDate, d);
        let label: string;
        if (daysSince < 0) label = 'Pre-op';
        else if (daysSince <= 28) label = `Week ${Math.ceil(daysSince / 7)}`;
        else if (daysSince <= 180) label = `Month ${Math.round(daysSince / 30)}`;
        else label = `Day ${daysSince}`;

        return {
          date: toISODate(d),
          score: a.totalScore,
          daysSinceSurgery: daysSince,
          label,
        };
      });

      const baseline = this.getBaselineAssessment(patientId, inst);
      const latest = this.getLatestAssessment(patientId, inst);
      if (baseline) preOpScores[inst] = baseline.totalScore;
      if (latest) latestScores[inst] = latest.totalScore;
    }

    const changeScores = this.getChangeScores(patientId);

    // Goal attainment T-score: GAS formula
    // T = 50 + (10 * sum(wi * xi)) / sqrt(0.7 * sum(wi^2) + 0.3 * (sum(wi))^2)
    const goals = patient.goals;
    const sumWx = goals.reduce((s, g) => s + g.weight * g.achievedLevel, 0);
    const sumW2 = goals.reduce((s, g) => s + g.weight * g.weight, 0);
    const sumW = goals.reduce((s, g) => s + g.weight, 0);
    const denominator = Math.sqrt(0.7 * sumW2 + 0.3 * sumW * sumW);
    const goalAttainmentTScore = denominator > 0
      ? round2(50 + (10 * sumWx) / denominator)
      : 50;

    return {
      patientId,
      patientName: patient.name,
      surgeryType: patient.surgeryType,
      surgeryDate: patient.surgeryDate,
      trajectories,
      preOpScores,
      latestScores,
      changeScores,
      milestones: patient.milestones,
      goals: patient.goals,
      goalAttainmentTScore,
    };
  }

  // --------------------------------------------------------------------------
  // Population outcomes
  // --------------------------------------------------------------------------

  /**
   * Compute aggregate outcomes for a group of patients (e.g., by surgery type
   * or by provider). Returns mean/median scores, MCID achievement rates,
   * complication rates, and average milestone durations.
   */
  computeAggregateOutcome(
    patientIds: string[],
    groupLabel: string
  ): AggregateOutcome {
    const pts = patientIds
      .map((id) => this.patients.get(id))
      .filter((p): p is OutcomePatient => p !== undefined);

    if (pts.length === 0) {
      return {
        groupLabel,
        patientCount: 0,
        meanScores: {} as Record<InstrumentType, number>,
        medianScores: {} as Record<InstrumentType, number>,
        mcidAchievementRates: {} as Record<InstrumentType, number>,
        complicationRate: 0,
        complicationBreakdown: {},
        averageMilestoneDays: {},
        readmissionRate: 0,
      };
    }

    // Collect latest scores by instrument
    const scoresByInstrument: Partial<Record<InstrumentType, number[]>> = {};
    const mcidByInstrument: Partial<Record<InstrumentType, boolean[]>> = {};

    for (const p of pts) {
      const changeScores = this.getChangeScores(p.id);
      for (const cs of changeScores) {
        if (!scoresByInstrument[cs.instrumentType]) {
          scoresByInstrument[cs.instrumentType] = [];
          mcidByInstrument[cs.instrumentType] = [];
        }
        scoresByInstrument[cs.instrumentType]!.push(cs.currentScore);
        mcidByInstrument[cs.instrumentType]!.push(cs.exceedsMCID);
      }
    }

    const meanScores = {} as Record<InstrumentType, number>;
    const medianScores = {} as Record<InstrumentType, number>;
    const mcidRates = {} as Record<InstrumentType, number>;

    for (const inst of Object.values(InstrumentType)) {
      const scores = scoresByInstrument[inst];
      const mcids = mcidByInstrument[inst];
      if (scores && scores.length > 0) {
        meanScores[inst] = round2(mean(scores));
        medianScores[inst] = round2(median(scores));
      }
      if (mcids && mcids.length > 0) {
        mcidRates[inst] = round2((mcids.filter(Boolean).length / mcids.length) * 100);
      }
    }

    // Complications
    const ptsWithComplications = pts.filter((p) => p.complications.length > 0);
    const complicationRate = round2((ptsWithComplications.length / pts.length) * 100);

    const compBreakdown: Record<string, number> = {};
    for (const p of pts) {
      for (const c of p.complications) {
        compBreakdown[c] = (compBreakdown[c] ?? 0) + 1;
      }
    }
    // Convert to rates
    for (const key of Object.keys(compBreakdown)) {
      compBreakdown[key] = round2((compBreakdown[key] / pts.length) * 100);
    }

    // Readmission rate
    const readmissions = pts.filter(
      (p) => p.complications.includes(ComplicationType.READMISSION)
    );
    const readmissionRate = round2((readmissions.length / pts.length) * 100);

    // Average milestone days
    const milestoneDays: Record<string, number[]> = {};
    for (const p of pts) {
      for (const ms of p.milestones) {
        if (ms.achievedDays !== null) {
          if (!milestoneDays[ms.type]) milestoneDays[ms.type] = [];
          milestoneDays[ms.type].push(ms.achievedDays);
        }
      }
    }
    const averageMilestoneDays: Record<string, number> = {};
    for (const [msType, days] of Object.entries(milestoneDays)) {
      averageMilestoneDays[msType] = round2(mean(days));
    }

    return {
      groupLabel,
      patientCount: pts.length,
      meanScores,
      medianScores,
      mcidAchievementRates: mcidRates,
      complicationRate,
      complicationBreakdown: compBreakdown,
      averageMilestoneDays,
      readmissionRate,
    };
  }

  /** Aggregate outcomes grouped by surgery type. */
  getOutcomesBySurgeryType(): AggregateOutcome[] {
    return SURGERY_TYPES_LIST.map((st) => {
      const pts = this.getPatientsBySurgeryType(st);
      return this.computeAggregateOutcome(
        pts.map((p) => p.id),
        st
      );
    });
  }

  /** Aggregate outcomes grouped by provider/surgeon. */
  getOutcomesByProvider(): AggregateOutcome[] {
    const surgeonIds = [...new Set([...this.patients.values()].map((p) => p.surgeonId))];
    return surgeonIds.map((sid) => {
      const pts = this.getPatientsBySurgeon(sid);
      return this.computeAggregateOutcome(
        pts.map((p) => p.id),
        sid
      );
    });
  }

  /**
   * Compute risk-adjusted outcomes for each provider.
   *
   * Risk adjustment uses a simplified model based on patient age,
   * complication history, and surgery complexity to compute expected
   * improvement, then compares actual vs expected.
   */
  getRiskAdjustedOutcomes(): RiskAdjustedOutcome[] {
    const providerOutcomes = this.getOutcomesByProvider();
    const allImprovements: number[] = [];

    // First pass: compute each provider's observed mean improvement
    const providerData: Array<{
      providerId: string;
      patientCount: number;
      observedImprovement: number;
      riskFactor: number;
    }> = [];

    for (const po of providerOutcomes) {
      const pts = this.getPatientsBySurgeon(po.groupLabel);
      if (pts.length === 0) continue;

      const improvements: number[] = [];
      let totalRiskFactor = 0;

      for (const p of pts) {
        const changeScores = this.getChangeScores(p.id);
        // Use VAS pain improvement as primary metric (lower is better, so negate)
        const vasChange = changeScores.find(
          (cs) => cs.instrumentType === InstrumentType.VAS_PAIN
        );
        if (vasChange) {
          improvements.push(-vasChange.absoluteChange); // negate: more negative = more improvement
        }

        // Risk factor: age/60 + complications count + surgery complexity
        const complexityFactor: Record<SurgeryType, number> = {
          [SurgeryType.TOTAL_KNEE_REPLACEMENT]: 1.0,
          [SurgeryType.TOTAL_HIP_REPLACEMENT]: 1.0,
          [SurgeryType.ACL_RECONSTRUCTION]: 0.8,
          [SurgeryType.ROTATOR_CUFF_REPAIR]: 0.9,
          [SurgeryType.LUMBAR_SPINAL_FUSION]: 1.3,
        };
        totalRiskFactor +=
          (p.age / 60) +
          p.complications.length * 0.5 +
          (complexityFactor[p.surgeryType] ?? 1.0);
      }

      const observedImprovement = improvements.length > 0 ? mean(improvements) : 0;
      const avgRiskFactor = totalRiskFactor / pts.length;

      allImprovements.push(observedImprovement);
      providerData.push({
        providerId: po.groupLabel,
        patientCount: pts.length,
        observedImprovement,
        riskFactor: avgRiskFactor,
      });
    }

    // Second pass: compute expected improvement based on risk factors
    // Use average improvement adjusted by risk factor
    const overallMeanImprovement = mean(allImprovements);
    const overallMeanRisk = mean(providerData.map((d) => d.riskFactor));

    const results: RiskAdjustedOutcome[] = providerData.map((pd) => {
      // Expected = overall mean * (patient risk / overall risk)
      const expectedImprovement = overallMeanRisk > 0
        ? overallMeanImprovement * (pd.riskFactor / overallMeanRisk)
        : overallMeanImprovement;

      const riskAdjustedScore = expectedImprovement !== 0
        ? round2((pd.observedImprovement / expectedImprovement) * 100)
        : 100;

      return {
        providerId: pd.providerId,
        patientCount: pd.patientCount,
        observedMeanImprovement: round2(pd.observedImprovement),
        expectedMeanImprovement: round2(expectedImprovement),
        riskAdjustedScore,
        percentileAmongProviders: 0, // computed below
      };
    });

    // Compute percentile among providers
    const sortedScores = [...results.map((r) => r.riskAdjustedScore)].sort((a, b) => a - b);
    for (const r of results) {
      const rank = sortedScores.filter((s) => s <= r.riskAdjustedScore).length;
      r.percentileAmongProviders = round2((rank / sortedScores.length) * 100);
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Assessment scheduling
  // --------------------------------------------------------------------------

  /**
   * Schedule assessments for a patient based on their surgery date.
   * Follows the standard schedule: pre-op, weekly (1-4), monthly (2-6), annual.
   */
  scheduleAssessments(patientId: string): ScheduledAssessment[] {
    const patient = this.patients.get(patientId);
    if (!patient) throw new Error(`Patient not found: ${patientId}`);

    const schedule = generateAssessmentSchedule(patient);
    this.scheduledAssessments.push(...schedule);
    return schedule;
  }

  /**
   * Schedule a triggered assessment (e.g., after complication or readmission).
   */
  scheduleTriggerAssessment(
    patientId: string,
    trigger: AssessmentTrigger,
    instruments?: InstrumentType[]
  ): ScheduledAssessment[] {
    const patient = this.patients.get(patientId);
    if (!patient) throw new Error(`Patient not found: ${patientId}`);

    const insts = instruments ?? getInstrumentsForSurgery(patient.surgeryType);
    const today = toISODate(new Date());
    const scheduled: ScheduledAssessment[] = [];

    for (const inst of insts) {
      const sa: ScheduledAssessment = {
        id: generateId('sched'),
        patientId,
        instrumentType: inst,
        scheduledDate: today,
        status: AssessmentStatus.PENDING,
        trigger,
        completedAssessmentId: null,
      };
      this.scheduledAssessments.push(sa);
      scheduled.push(sa);
    }

    return scheduled;
  }

  /** Get pending/scheduled assessments for a patient. */
  getPendingAssessments(patientId: string): ScheduledAssessment[] {
    return this.scheduledAssessments.filter(
      (s) =>
        s.patientId === patientId &&
        (s.status === AssessmentStatus.SCHEDULED || s.status === AssessmentStatus.PENDING)
    );
  }

  /** Get all scheduled assessments for a patient. */
  getScheduledAssessments(patientId: string): ScheduledAssessment[] {
    return this.scheduledAssessments.filter((s) => s.patientId === patientId);
  }

  /**
   * Get overdue assessments (scheduled date has passed, still pending).
   */
  getOverdueAssessments(): ScheduledAssessment[] {
    const today = toISODate(new Date());
    return this.scheduledAssessments.filter(
      (s) =>
        (s.status === AssessmentStatus.SCHEDULED || s.status === AssessmentStatus.PENDING) &&
        s.scheduledDate < today
    );
  }

  // --------------------------------------------------------------------------
  // Reporting
  // --------------------------------------------------------------------------

  /**
   * Generate a comprehensive quality report for a specified period.
   * Includes aggregate outcomes by surgery type and provider,
   * risk-adjusted provider comparisons, and overall quality metrics.
   */
  generateQualityReport(periodStart: string, periodEnd: string): QualityReport {
    const bySurgeryType = this.getOutcomesBySurgeryType();
    const byProvider = this.getOutcomesByProvider();
    const riskAdjusted = this.getRiskAdjustedOutcomes();

    const allPatients = this.getAllPatients();
    const patientsInPeriod = allPatients.filter((p) => {
      return p.surgeryDate >= periodStart && p.surgeryDate <= periodEnd;
    });
    const totalPatients = patientsInPeriod.length > 0 ? patientsInPeriod.length : allPatients.length;

    // Overall complication rate
    const ptsWithComp = allPatients.filter((p) => p.complications.length > 0);
    const overallComplicationRate = allPatients.length > 0
      ? round2((ptsWithComp.length / allPatients.length) * 100)
      : 0;

    // Overall readmission rate
    const readmissions = allPatients.filter(
      (p) => p.complications.includes(ComplicationType.READMISSION)
    );
    const overallReadmissionRate = allPatients.length > 0
      ? round2((readmissions.length / allPatients.length) * 100)
      : 0;

    // Overall MCID achievement rate
    let totalMCID = 0;
    let totalMCIDAchieved = 0;
    for (const p of allPatients) {
      const changes = this.getChangeScores(p.id);
      for (const cs of changes) {
        totalMCID++;
        if (cs.exceedsMCID) totalMCIDAchieved++;
      }
    }
    const overallMCIDAchievementRate = totalMCID > 0
      ? round2((totalMCIDAchieved / totalMCID) * 100)
      : 0;

    // Overall patient satisfaction
    const satScores: number[] = [];
    for (const p of allPatients) {
      const latest = this.getLatestAssessment(p.id, InstrumentType.PATIENT_SATISFACTION);
      if (latest) satScores.push(latest.totalScore);
    }
    const overallSatisfaction = satScores.length > 0 ? round2(mean(satScores)) : 0;

    // Generate summary text
    const summary = this.generateReportSummary(
      totalPatients,
      overallComplicationRate,
      overallReadmissionRate,
      overallMCIDAchievementRate,
      overallSatisfaction,
      bySurgeryType,
      riskAdjusted
    );

    return {
      reportId: generateId('report'),
      generatedAt: new Date().toISOString(),
      periodStart,
      periodEnd,
      totalPatients,
      bySurgeryType,
      byProvider,
      riskAdjusted,
      overallComplicationRate,
      overallReadmissionRate,
      overallMCIDAchievementRate,
      overallPatientSatisfactionMean: overallSatisfaction,
      summary,
    };
  }

  /** Generate the textual summary for a quality report. */
  private generateReportSummary(
    totalPatients: number,
    complicationRate: number,
    readmissionRate: number,
    mcidRate: number,
    satisfaction: number,
    bySurgeryType: AggregateOutcome[],
    riskAdjusted: RiskAdjustedOutcome[]
  ): string {
    const lines: string[] = [];

    lines.push('PATIENT OUTCOME QUALITY REPORT');
    lines.push('='.repeat(60));
    lines.push('');

    lines.push('EXECUTIVE SUMMARY');
    lines.push('-'.repeat(40));
    lines.push(`Total patients tracked: ${totalPatients}`);
    lines.push(`Overall complication rate: ${complicationRate}%`);
    lines.push(`Overall readmission rate: ${readmissionRate}%`);
    lines.push(`MCID achievement rate: ${mcidRate}%`);
    lines.push(`Mean patient satisfaction: ${satisfaction}/100`);
    lines.push('');

    lines.push('OUTCOMES BY SURGERY TYPE');
    lines.push('-'.repeat(40));
    for (const st of bySurgeryType) {
      if (st.patientCount === 0) continue;
      lines.push(`  ${st.groupLabel} (n=${st.patientCount})`);
      lines.push(`    Complication rate: ${st.complicationRate}%`);
      lines.push(`    Readmission rate: ${st.readmissionRate}%`);
      if (st.mcidAchievementRates[InstrumentType.VAS_PAIN] !== undefined) {
        lines.push(`    VAS Pain MCID achievement: ${st.mcidAchievementRates[InstrumentType.VAS_PAIN]}%`);
      }
      const msDriving = st.averageMilestoneDays[MilestoneType.RETURN_TO_DRIVING];
      const msWork = st.averageMilestoneDays[MilestoneType.RETURN_TO_WORK];
      if (msDriving !== undefined) {
        lines.push(`    Avg days to driving: ${msDriving}`);
      }
      if (msWork !== undefined) {
        lines.push(`    Avg days to return to work: ${msWork}`);
      }
      lines.push('');
    }

    lines.push('PROVIDER PERFORMANCE (Risk-Adjusted)');
    lines.push('-'.repeat(40));
    const sortedProviders = [...riskAdjusted].sort(
      (a, b) => b.riskAdjustedScore - a.riskAdjustedScore
    );
    for (const ra of sortedProviders) {
      lines.push(`  ${ra.providerId} (n=${ra.patientCount})`);
      lines.push(`    Risk-adjusted score: ${ra.riskAdjustedScore}`);
      lines.push(`    Observed improvement: ${ra.observedMeanImprovement}`);
      lines.push(`    Expected improvement: ${ra.expectedMeanImprovement}`);
      lines.push(`    Percentile: ${ra.percentileAmongProviders}th`);
      lines.push('');
    }

    lines.push('QUALITY INDICATORS');
    lines.push('-'.repeat(40));
    if (complicationRate <= 10) {
      lines.push('  [PASS] Complication rate within acceptable range (<= 10%)');
    } else {
      lines.push(`  [FLAG] Complication rate elevated at ${complicationRate}% (target <= 10%)`);
    }
    if (readmissionRate <= 5) {
      lines.push('  [PASS] Readmission rate within target (<= 5%)');
    } else {
      lines.push(`  [FLAG] Readmission rate elevated at ${readmissionRate}% (target <= 5%)`);
    }
    if (mcidRate >= 70) {
      lines.push(`  [PASS] MCID achievement rate meets benchmark (>= 70%): ${mcidRate}%`);
    } else {
      lines.push(`  [FLAG] MCID achievement rate below benchmark: ${mcidRate}% (target >= 70%)`);
    }
    if (satisfaction >= 75) {
      lines.push(`  [PASS] Patient satisfaction meets threshold (>= 75): ${satisfaction}/100`);
    } else {
      lines.push(`  [FLAG] Patient satisfaction below target: ${satisfaction}/100 (target >= 75)`);
    }
    lines.push('');

    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(40));
    if (complicationRate > 10) {
      lines.push('  - Review surgical protocols and infection control procedures');
    }
    if (readmissionRate > 5) {
      lines.push('  - Evaluate discharge planning and post-discharge follow-up processes');
    }
    if (mcidRate < 70) {
      lines.push('  - Consider enhanced rehabilitation protocols to improve outcome achievement');
    }
    if (satisfaction < 75) {
      lines.push('  - Investigate patient experience issues and communication gaps');
    }
    const lowPerformers = sortedProviders.filter((p) => p.percentileAmongProviders < 25);
    if (lowPerformers.length > 0) {
      lines.push(`  - Peer review recommended for providers: ${lowPerformers.map((p) => p.providerId).join(', ')}`);
    }
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('End of Report');

    return lines.join('\n');
  }

  /**
   * Generate an individual patient outcome report suitable for
   * clinic visits, quality reviews, or research.
   */
  generatePatientReport(patientId: string): string {
    const dashboard = this.getPatientDashboard(patientId);
    if (!dashboard) return `Patient ${patientId} not found.`;

    const patient = this.patients.get(patientId)!;
    const lines: string[] = [];

    lines.push('INDIVIDUAL PATIENT OUTCOME REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Patient: ${patient.name} (${patient.id})`);
    lines.push(`Age: ${patient.age} | Gender: ${patient.gender}`);
    lines.push(`Surgery: ${patient.surgeryType}`);
    lines.push(`Surgery Date: ${patient.surgeryDate}`);
    lines.push(`Surgeon: ${patient.surgeonId}`);
    if (patient.complications.length > 0) {
      lines.push(`Complications: ${patient.complications.join(', ')}`);
    } else {
      lines.push('Complications: None');
    }
    lines.push('');

    lines.push('OUTCOME TRAJECTORIES');
    lines.push('-'.repeat(40));
    for (const [inst, trajectory] of Object.entries(dashboard.trajectories)) {
      if (trajectory.length === 0) continue;
      lines.push(`  ${inst}:`);
      for (const point of trajectory) {
        lines.push(`    ${point.label} (${point.date}): ${point.score}`);
      }
      lines.push('');
    }

    lines.push('PRE-OP vs CURRENT COMPARISON');
    lines.push('-'.repeat(40));
    for (const cs of dashboard.changeScores) {
      const arrow = cs.direction === 'improved' ? '>>>' : cs.direction === 'worsened' ? '<<<' : '===';
      lines.push(
        `  ${cs.instrumentType}: ${cs.baselineScore} ${arrow} ${cs.currentScore} ` +
        `(change: ${cs.absoluteChange > 0 ? '+' : ''}${cs.absoluteChange}, ` +
        `MCID ${cs.exceedsMCID ? 'ACHIEVED' : 'not met'})`
      );
    }
    lines.push('');

    lines.push('RECOVERY MILESTONES');
    lines.push('-'.repeat(40));
    for (const ms of dashboard.milestones) {
      if (ms.achievedDate) {
        const diff = ms.achievedDays! - ms.targetDays;
        const status = diff <= 0 ? 'ON TIME' : `${diff} days late`;
        lines.push(`  [DONE] ${ms.type}: Day ${ms.achievedDays} (target: ${ms.targetDays}) - ${status}`);
      } else {
        lines.push(`  [PENDING] ${ms.type}: Target day ${ms.targetDays}`);
      }
    }
    lines.push('');

    lines.push('GOAL ATTAINMENT');
    lines.push('-'.repeat(40));
    for (const g of dashboard.goals) {
      lines.push(`  ${g.description}`);
      lines.push(`    Status: ${g.status} | Level: ${g.achievedLevel} (expected: ${g.expectedLevel})`);
    }
    lines.push(`  Goal Attainment T-Score: ${dashboard.goalAttainmentTScore}`);
    lines.push('');

    lines.push('='.repeat(60));
    lines.push('End of Patient Report');

    return lines.join('\n');
  }

  // --------------------------------------------------------------------------
  // Summary accessors
  // --------------------------------------------------------------------------

  /** Total number of completed assessments in the system. */
  getAssessmentCount(): number {
    return this.assessments.length;
  }

  /** Total number of registered patients. */
  getPatientCount(): number {
    return this.patients.size;
  }

  /** Get all unique surgeon IDs. */
  getSurgeonIds(): string[] {
    return [...new Set([...this.patients.values()].map((p) => p.surgeonId))];
  }

  /**
   * Compute complication rates per surgery type.
   * Returns a map of surgery type to { rate, count, total }.
   */
  getComplicationRates(): Record<SurgeryType, { rate: number; count: number; total: number }> {
    const result = {} as Record<SurgeryType, { rate: number; count: number; total: number }>;
    for (const st of SURGERY_TYPES_LIST) {
      const pts = this.getPatientsBySurgeryType(st);
      const withComp = pts.filter((p) => p.complications.length > 0);
      result[st] = {
        rate: pts.length > 0 ? round2((withComp.length / pts.length) * 100) : 0,
        count: withComp.length,
        total: pts.length,
      };
    }
    return result;
  }

  /**
   * Get average time to key milestones across all patients of a surgery type.
   */
  getAverageMilestoneTimes(
    surgeryType: SurgeryType
  ): Record<MilestoneType, { average: number; median: number; count: number }> {
    const pts = this.getPatientsBySurgeryType(surgeryType);
    const byMilestone: Record<string, number[]> = {};

    for (const p of pts) {
      for (const ms of p.milestones) {
        if (ms.achievedDays !== null) {
          if (!byMilestone[ms.type]) byMilestone[ms.type] = [];
          byMilestone[ms.type].push(ms.achievedDays);
        }
      }
    }

    const result = {} as Record<MilestoneType, { average: number; median: number; count: number }>;
    for (const [msType, days] of Object.entries(byMilestone)) {
      result[msType as MilestoneType] = {
        average: round2(mean(days)),
        median: round2(median(days)),
        count: days.length,
      };
    }
    return result;
  }

  /**
   * Get severity distribution for an instrument across all patients.
   */
  getSeverityDistribution(
    instrumentType: InstrumentType
  ): Record<SeverityLevel, number> {
    const dist = {
      [SeverityLevel.NONE]: 0,
      [SeverityLevel.MINIMAL]: 0,
      [SeverityLevel.MILD]: 0,
      [SeverityLevel.MODERATE]: 0,
      [SeverityLevel.MODERATELY_SEVERE]: 0,
      [SeverityLevel.SEVERE]: 0,
    };

    // Use latest assessment per patient
    for (const p of this.patients.values()) {
      const latest = this.getLatestAssessment(p.id, instrumentType);
      if (latest) {
        dist[latest.severity]++;
      }
    }
    return dist;
  }

  /**
   * Get percentile ranking statistics for an instrument.
   */
  getPercentileStatistics(
    instrumentType: InstrumentType
  ): { p25: number; p50: number; p75: number; p90: number; mean: number } {
    const scores: number[] = [];
    for (const p of this.patients.values()) {
      const latest = this.getLatestAssessment(p.id, instrumentType);
      if (latest) scores.push(latest.totalScore);
    }
    if (scores.length === 0) {
      return { p25: 0, p50: 0, p75: 0, p90: 0, mean: 0 };
    }
    return {
      p25: round2(percentile(scores, 25)),
      p50: round2(percentile(scores, 50)),
      p75: round2(percentile(scores, 75)),
      p90: round2(percentile(scores, 90)),
      mean: round2(mean(scores)),
    };
  }
}

// ============================================================================
// Singleton export
// ============================================================================

/** Singleton instance of the outcome tracking service. */
export const outcomeTrackingService = new OutcomeTrackingServiceImpl();

/** Export class for testing. */
export { OutcomeTrackingServiceImpl };
