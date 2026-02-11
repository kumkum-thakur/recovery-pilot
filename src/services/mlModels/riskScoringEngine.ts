/**
 * Risk Scoring Engine for Post-Operative Patient Recovery
 *
 * Implements multi-factor risk modeling using established medical scoring
 * methodologies including LACE index, ASA Physical Status Classification,
 * and Charlson Comorbidity Index (CCI).
 *
 * Features:
 * - Multi-factor weighted risk scoring across 5 domains
 * - Six distinct risk category scores (overall, infection, readmission, fall, mental health, medication)
 * - Bayesian dynamic risk updates as new observations arrive
 * - Risk stratification into tiers (low, moderate, high, critical)
 * - Configurable alert thresholds
 * - Temporal trend analysis with linear regression
 * - Population-baseline comparative risk
 * - 200+ synthetic patient baseline profiles
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Constants & Enums (const objects for erasableSyntaxOnly compatibility)
// ============================================================================

export const RiskTier = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type RiskTier = typeof RiskTier[keyof typeof RiskTier];

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  URGENT: 'urgent',
  CRITICAL: 'critical',
} as const;
export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

export const TrendDirection = {
  IMPROVING: 'improving',
  STABLE: 'stable',
  WORSENING: 'worsening',
  RAPIDLY_WORSENING: 'rapidly_worsening',
} as const;
export type TrendDirection = typeof TrendDirection[keyof typeof TrendDirection];

export const ASAClass = {
  ASA_I: 1,
  ASA_II: 2,
  ASA_III: 3,
  ASA_IV: 4,
  ASA_V: 5,
  ASA_VI: 6,
} as const;
export type ASAClass = typeof ASAClass[keyof typeof ASAClass];

export const AnesthesiaType = {
  LOCAL: 'local',
  REGIONAL: 'regional',
  GENERAL: 'general',
  SEDATION: 'sedation',
} as const;
export type AnesthesiaType = typeof AnesthesiaType[keyof typeof AnesthesiaType];

export const SurgeryComplexity = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  MAJOR: 'major',
  COMPLEX: 'complex',
} as const;
export type SurgeryComplexity = typeof SurgeryComplexity[keyof typeof SurgeryComplexity];

export const WoundHealingPhase = {
  INFLAMMATORY: 'inflammatory',
  PROLIFERATIVE: 'proliferative',
  REMODELING: 'remodeling',
  HEALED: 'healed',
  COMPLICATED: 'complicated',
} as const;
export type WoundHealingPhase = typeof WoundHealingPhase[keyof typeof WoundHealingPhase];

export const MoodLevel = {
  VERY_LOW: 1,
  LOW: 2,
  NEUTRAL: 3,
  GOOD: 4,
  EXCELLENT: 5,
} as const;
export type MoodLevel = typeof MoodLevel[keyof typeof MoodLevel];

export const ComorbidityType = {
  DIABETES: 'diabetes',
  HYPERTENSION: 'hypertension',
  COPD: 'copd',
  CHF: 'chf',
  CKD: 'ckd',
  LIVER_DISEASE: 'liver_disease',
  CANCER: 'cancer',
  HIV: 'hiv',
  OBESITY: 'obesity',
  DEPRESSION: 'depression',
  ANXIETY: 'anxiety',
  SUBSTANCE_USE: 'substance_use',
  PERIPHERAL_VASCULAR: 'peripheral_vascular',
  CEREBROVASCULAR: 'cerebrovascular',
  DEMENTIA: 'dementia',
  RHEUMATIC: 'rheumatic',
  PEPTIC_ULCER: 'peptic_ulcer',
} as const;
export type ComorbidityType = typeof ComorbidityType[keyof typeof ComorbidityType];

// ============================================================================
// Interfaces
// ============================================================================

/** Patient demographic and baseline data */
export interface PatientDemographics {
  patientId: string;
  age: number;
  bmi: number;
  isSmoker: boolean;
  smokingPackYears?: number;
  comorbidities: ComorbidityType[];
  asaClass: ASAClass;
  gender: 'male' | 'female' | 'other';
  livesAlone: boolean;
  hasCaregiver: boolean;
  primaryLanguageEnglish: boolean;
  insuranceType?: 'private' | 'medicare' | 'medicaid' | 'uninsured';
}

/** Surgical procedure details */
export interface SurgicalFactors {
  surgeryType: string;
  surgeryDate: string; // ISO date
  durationMinutes: number;
  complexity: SurgeryComplexity;
  anesthesiaType: AnesthesiaType;
  estimatedBloodLossMl?: number;
  isEmergency: boolean;
  isReoperation: boolean;
  surgicalSite: string;
}

/** Post-operative compliance data */
export interface ComplianceData {
  medicationAdherenceRate: number; // 0-1
  missionCompletionRate: number; // 0-1
  appointmentAttendanceRate: number; // 0-1
  daysWithMissedMedications: number;
  consecutiveMissedDays: number;
  totalScheduledAppointments: number;
  appointmentsAttended: number;
  appointmentsCancelled: number;
  appointmentsNoShow: number;
}

/** Clinical indicators from medical observations */
export interface ClinicalIndicators {
  woundHealingPhase: WoundHealingPhase;
  woundHealingOnTrack: boolean;
  painLevel: number; // 0-10
  painTrend: 'decreasing' | 'stable' | 'increasing';
  temperature: number; // Celsius
  heartRate: number; // bpm
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenSaturation: number; // percentage
  whiteBloodCellCount?: number; // cells/uL (normal: 4500-11000)
  crpLevel?: number; // mg/L (normal < 10)
  hemoglobin?: number; // g/dL
  creatinine?: number; // mg/dL
  albumin?: number; // g/dL (normal 3.5-5.5)
  bloodGlucose?: number; // mg/dL
  hasInfectionSigns: boolean;
  hasDrainageAbnormality: boolean;
  hasSwelling: boolean;
  hasRedness: boolean;
}

/** Behavioral signals from app usage */
export interface BehavioralSignals {
  appEngagementScore: number; // 0-1
  avgDailySessionMinutes: number;
  daysActiveLastWeek: number; // 0-7
  symptomReportsLast7Days: number;
  symptomReportsLast30Days: number;
  moodScores: MoodLevel[]; // Recent mood entries
  sleepQualityScore?: number; // 0-10
  exerciseMinutesPerDay?: number;
  socialInteractionScore?: number; // 0-10
  painDiaryCompletionRate?: number; // 0-1
}

/** Complete patient risk input combining all factors */
export interface PatientRiskInput {
  demographics: PatientDemographics;
  surgical: SurgicalFactors;
  compliance: ComplianceData;
  clinical: ClinicalIndicators;
  behavioral: BehavioralSignals;
  lengthOfStayDays?: number; // For LACE index
  edVisitsLast6Months?: number; // For LACE index
}

/** Individual risk category score */
export interface RiskCategoryScore {
  score: number; // 0-100
  tier: RiskTier;
  confidence: number; // 0-1
  topContributors: RiskContributor[];
  methodology?: string;
}

/** Factor contributing to a risk score */
export interface RiskContributor {
  factor: string;
  weight: number;
  rawValue: number | string;
  normalizedContribution: number; // 0-100
  description: string;
}

/** Complete risk assessment for a patient */
export interface RiskAssessment {
  patientId: string;
  assessmentId: string;
  timestamp: string; // ISO date
  overallRisk: RiskCategoryScore;
  infectionRisk: RiskCategoryScore;
  readmissionRisk: RiskCategoryScore;
  fallRisk: RiskCategoryScore;
  mentalHealthRisk: RiskCategoryScore;
  medicationNonAdherenceRisk: RiskCategoryScore;
  laceIndexScore: number; // 0-19
  charlsonComorbidityIndex: number;
  alerts: RiskAlert[];
}

/** Alert generated from risk scoring */
export interface RiskAlert {
  id: string;
  patientId: string;
  severity: AlertSeverity;
  category: string;
  message: string;
  triggeringFactor: string;
  currentValue: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
}

/** Configurable alert threshold */
export interface AlertThreshold {
  category: string;
  metric: string;
  warningLevel: number;
  urgentLevel: number;
  criticalLevel: number;
  enabled: boolean;
}

/** Risk trend data point */
export interface RiskTrendPoint {
  timestamp: string;
  overallRisk: number;
  infectionRisk: number;
  readmissionRisk: number;
  fallRisk: number;
  mentalHealthRisk: number;
  medicationRisk: number;
}

/** Trend analysis result */
export interface TrendAnalysis {
  direction: TrendDirection;
  slope: number; // Rate of change per day
  rSquared: number; // Goodness of fit
  daysAnalyzed: number;
  predictedScoreIn7Days: number;
  significantChange: boolean;
}

/** Population comparison result */
export interface PopulationComparison {
  patientScore: number;
  populationMean: number;
  populationStdDev: number;
  percentile: number;
  zScore: number;
  comparisonGroup: string;
}

/** Bayesian prior for dynamic updating */
interface BayesianPrior {
  mean: number;
  variance: number;
  observationCount: number;
}

/** Synthetic baseline patient profile */
export interface BaselinePatientProfile {
  id: string;
  demographics: PatientDemographics;
  surgeryComplexity: SurgeryComplexity;
  ageGroup: string;
  overallRiskScore: number;
  infectionRiskScore: number;
  readmissionRiskScore: number;
  fallRiskScore: number;
  mentalHealthRiskScore: number;
  medicationRiskScore: number;
  outcome: 'good' | 'moderate' | 'poor' | 'readmitted';
}

// ============================================================================
// Charlson Comorbidity Index Weights
// ============================================================================

const CHARLSON_WEIGHTS: Record<string, number> = {
  [ComorbidityType.DIABETES]: 1,
  [ComorbidityType.HYPERTENSION]: 0, // Not in original CCI but tracked
  [ComorbidityType.COPD]: 1,
  [ComorbidityType.CHF]: 1,
  [ComorbidityType.CKD]: 2,
  [ComorbidityType.LIVER_DISEASE]: 3, // Moderate-severe
  [ComorbidityType.CANCER]: 2,
  [ComorbidityType.HIV]: 6,
  [ComorbidityType.OBESITY]: 0, // Not in original CCI but tracked
  [ComorbidityType.DEPRESSION]: 0,
  [ComorbidityType.ANXIETY]: 0,
  [ComorbidityType.SUBSTANCE_USE]: 0,
  [ComorbidityType.PERIPHERAL_VASCULAR]: 1,
  [ComorbidityType.CEREBROVASCULAR]: 1,
  [ComorbidityType.DEMENTIA]: 1,
  [ComorbidityType.RHEUMATIC]: 1,
  [ComorbidityType.PEPTIC_ULCER]: 1,
};

// Age-based CCI adjustment
function charlsonAgeAdjustment(age: number): number {
  if (age < 50) return 0;
  if (age < 60) return 1;
  if (age < 70) return 2;
  if (age < 80) return 3;
  return 4;
}

// ============================================================================
// Domain Weight Configuration
// ============================================================================

/**
 * Weights for the five risk domains, summing to 1.0.
 * These are the default weights for overall risk computation.
 */
const DOMAIN_WEIGHTS = {
  demographics: 0.20,
  surgical: 0.20,
  compliance: 0.20,
  clinical: 0.25,
  behavioral: 0.15,
} as const;

/**
 * Category-specific domain weight overrides.
 * Each risk category emphasizes different domains.
 */
const CATEGORY_DOMAIN_WEIGHTS: Record<string, Record<string, number>> = {
  infection: {
    demographics: 0.15,
    surgical: 0.25,
    compliance: 0.10,
    clinical: 0.40,
    behavioral: 0.10,
  },
  readmission: {
    demographics: 0.25,
    surgical: 0.20,
    compliance: 0.25,
    clinical: 0.20,
    behavioral: 0.10,
  },
  fall: {
    demographics: 0.30,
    surgical: 0.15,
    compliance: 0.10,
    clinical: 0.25,
    behavioral: 0.20,
  },
  mentalHealth: {
    demographics: 0.15,
    surgical: 0.10,
    compliance: 0.15,
    clinical: 0.10,
    behavioral: 0.50,
  },
  medication: {
    demographics: 0.15,
    surgical: 0.05,
    compliance: 0.50,
    clinical: 0.15,
    behavioral: 0.15,
  },
};

// ============================================================================
// Default Alert Thresholds
// ============================================================================

const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  { category: 'overall', metric: 'overallRisk', warningLevel: 40, urgentLevel: 65, criticalLevel: 85, enabled: true },
  { category: 'infection', metric: 'infectionRisk', warningLevel: 35, urgentLevel: 60, criticalLevel: 80, enabled: true },
  { category: 'readmission', metric: 'readmissionRisk', warningLevel: 40, urgentLevel: 65, criticalLevel: 85, enabled: true },
  { category: 'fall', metric: 'fallRisk', warningLevel: 30, urgentLevel: 55, criticalLevel: 75, enabled: true },
  { category: 'mentalHealth', metric: 'mentalHealthRisk', warningLevel: 35, urgentLevel: 60, criticalLevel: 80, enabled: true },
  { category: 'medication', metric: 'medicationRisk', warningLevel: 30, urgentLevel: 55, criticalLevel: 75, enabled: true },
  { category: 'vitals', metric: 'temperature', warningLevel: 37.8, urgentLevel: 38.3, criticalLevel: 39.0, enabled: true },
  { category: 'vitals', metric: 'heartRate', warningLevel: 100, urgentLevel: 120, criticalLevel: 140, enabled: true },
  { category: 'vitals', metric: 'oxygenSaturation', warningLevel: 94, urgentLevel: 90, criticalLevel: 85, enabled: true },
  { category: 'compliance', metric: 'consecutiveMissedDays', warningLevel: 2, urgentLevel: 4, criticalLevel: 7, enabled: true },
  { category: 'pain', metric: 'painLevel', warningLevel: 6, urgentLevel: 8, criticalLevel: 9, enabled: true },
];

// ============================================================================
// Utility Functions
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.max(0, (now - then) / (1000 * 60 * 60 * 24));
}

/** Simple linear regression returning slope, intercept, and R-squared */
function linearRegression(points: Array<{ x: number; y: number }>): { slope: number; intercept: number; rSquared: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, rSquared: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const ssRes = points.reduce((acc, p) => {
    const predicted = slope * p.x + intercept;
    return acc + (p.y - predicted) ** 2;
  }, 0);
  const meanY = sumY / n;
  const ssTot = points.reduce((acc, p) => acc + (p.y - meanY) ** 2, 0);
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared };
}

/** Standard normal CDF approximation (Abramowitz and Stegun) */
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2);
  return 0.5 * (1.0 + sign * y);
}

/** Deterministic seeded random for reproducible baseline generation */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

/** Pick a random element from an array using a random function */
function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ============================================================================
// Domain Scoring Functions
// ============================================================================

/**
 * Score demographics domain (0-100).
 *
 * Factors: age, BMI, smoking, comorbidities (via Charlson), ASA class,
 * living situation, caregiver availability.
 */
function scoreDemographics(demographics: PatientDemographics): { score: number; contributors: RiskContributor[] } {
  const contributors: RiskContributor[] = [];

  // Age risk: exponential increase after 60
  let ageRisk = 0;
  if (demographics.age < 40) ageRisk = 5;
  else if (demographics.age < 50) ageRisk = 12;
  else if (demographics.age < 60) ageRisk = 22;
  else if (demographics.age < 70) ageRisk = 40;
  else if (demographics.age < 80) ageRisk = 60;
  else ageRisk = 80;
  contributors.push({
    factor: 'age',
    weight: 0.25,
    rawValue: demographics.age,
    normalizedContribution: ageRisk,
    description: `Age ${demographics.age}: ${demographics.age >= 70 ? 'significantly elevated' : demographics.age >= 60 ? 'moderately elevated' : 'baseline'} risk`,
  });

  // BMI risk: U-shaped curve, underweight and obese both risky
  let bmiRisk = 0;
  if (demographics.bmi < 18.5) bmiRisk = 35; // Underweight
  else if (demographics.bmi < 25) bmiRisk = 5; // Normal
  else if (demographics.bmi < 30) bmiRisk = 15; // Overweight
  else if (demographics.bmi < 35) bmiRisk = 35; // Obese class I
  else if (demographics.bmi < 40) bmiRisk = 55; // Obese class II
  else bmiRisk = 75; // Obese class III
  contributors.push({
    factor: 'bmi',
    weight: 0.15,
    rawValue: demographics.bmi,
    normalizedContribution: bmiRisk,
    description: `BMI ${demographics.bmi.toFixed(1)}: ${demographics.bmi >= 30 ? 'obesity increases surgical risk' : demographics.bmi < 18.5 ? 'underweight impairs healing' : 'within normal range'}`,
  });

  // Smoking
  const smokingRisk = demographics.isSmoker ? clamp(30 + (demographics.smokingPackYears ?? 10) * 1.5, 30, 80) : 0;
  contributors.push({
    factor: 'smoking',
    weight: 0.15,
    rawValue: demographics.isSmoker ? `Yes (${demographics.smokingPackYears ?? 'unknown'} pack-years)` : 'No',
    normalizedContribution: smokingRisk,
    description: demographics.isSmoker ? 'Smoking impairs wound healing and increases infection risk' : 'Non-smoker baseline',
  });

  // Charlson Comorbidity Index
  const cci = computeCharlsonIndex(demographics.comorbidities, demographics.age);
  const cciRisk = clamp(cci * 12, 0, 100);
  contributors.push({
    factor: 'charlsonComorbidityIndex',
    weight: 0.25,
    rawValue: cci,
    normalizedContribution: cciRisk,
    description: `CCI ${cci}: ${cci === 0 ? 'no significant comorbidities' : cci <= 2 ? 'mild comorbidity burden' : cci <= 5 ? 'moderate comorbidity burden' : 'severe comorbidity burden'}`,
  });

  // ASA class
  const asaRisk = clamp((demographics.asaClass - 1) * 22, 0, 100);
  contributors.push({
    factor: 'asaClass',
    weight: 0.10,
    rawValue: demographics.asaClass,
    normalizedContribution: asaRisk,
    description: `ASA ${demographics.asaClass}: ${demographics.asaClass <= 2 ? 'low anesthetic risk' : demographics.asaClass === 3 ? 'moderate systemic disease' : 'severe systemic disease'}`,
  });

  // Social factors
  const socialRisk = (demographics.livesAlone ? 20 : 0) + (!demographics.hasCaregiver ? 15 : 0) + (!demographics.primaryLanguageEnglish ? 10 : 0);
  contributors.push({
    factor: 'socialFactors',
    weight: 0.10,
    rawValue: `Lives alone: ${demographics.livesAlone}, Caregiver: ${demographics.hasCaregiver}`,
    normalizedContribution: clamp(socialRisk, 0, 100),
    description: `Social support: ${demographics.livesAlone ? 'limited (lives alone)' : 'adequate'}`,
  });

  const score = contributors.reduce((sum, c) => sum + c.weight * c.normalizedContribution, 0) / contributors.reduce((sum, c) => sum + c.weight, 0);
  return { score: clamp(score, 0, 100), contributors };
}

/**
 * Score surgical factors domain (0-100).
 */
function scoreSurgical(surgical: SurgicalFactors): { score: number; contributors: RiskContributor[] } {
  const contributors: RiskContributor[] = [];

  // Surgery complexity
  const complexityMap: Record<SurgeryComplexity, number> = {
    [SurgeryComplexity.MINOR]: 10,
    [SurgeryComplexity.MODERATE]: 30,
    [SurgeryComplexity.MAJOR]: 60,
    [SurgeryComplexity.COMPLEX]: 85,
  };
  const complexityRisk = complexityMap[surgical.complexity];
  contributors.push({
    factor: 'surgeryComplexity',
    weight: 0.30,
    rawValue: surgical.complexity,
    normalizedContribution: complexityRisk,
    description: `${surgical.complexity} complexity: ${surgical.surgeryType}`,
  });

  // Duration risk: surgeries > 3hrs have elevated risk
  let durationRisk = 0;
  if (surgical.durationMinutes < 60) durationRisk = 5;
  else if (surgical.durationMinutes < 120) durationRisk = 15;
  else if (surgical.durationMinutes < 180) durationRisk = 30;
  else if (surgical.durationMinutes < 300) durationRisk = 55;
  else durationRisk = 80;
  contributors.push({
    factor: 'surgeryDuration',
    weight: 0.20,
    rawValue: surgical.durationMinutes,
    normalizedContribution: durationRisk,
    description: `${surgical.durationMinutes} min duration: ${surgical.durationMinutes > 180 ? 'prolonged procedure increases risk' : 'within expected range'}`,
  });

  // Anesthesia type
  const anesthesiaMap: Record<AnesthesiaType, number> = {
    [AnesthesiaType.LOCAL]: 5,
    [AnesthesiaType.SEDATION]: 15,
    [AnesthesiaType.REGIONAL]: 25,
    [AnesthesiaType.GENERAL]: 45,
  };
  const anesthesiaRisk = anesthesiaMap[surgical.anesthesiaType];
  contributors.push({
    factor: 'anesthesiaType',
    weight: 0.15,
    rawValue: surgical.anesthesiaType,
    normalizedContribution: anesthesiaRisk,
    description: `${surgical.anesthesiaType} anesthesia`,
  });

  // Days since surgery (recency)
  const daysSinceSurgery = daysSince(surgical.surgeryDate);
  let recencyRisk = 0;
  if (daysSinceSurgery < 3) recencyRisk = 70;
  else if (daysSinceSurgery < 7) recencyRisk = 50;
  else if (daysSinceSurgery < 14) recencyRisk = 35;
  else if (daysSinceSurgery < 30) recencyRisk = 20;
  else recencyRisk = 10;
  contributors.push({
    factor: 'daysSinceSurgery',
    weight: 0.15,
    rawValue: Math.round(daysSinceSurgery),
    normalizedContribution: recencyRisk,
    description: `${Math.round(daysSinceSurgery)} days post-op: ${daysSinceSurgery < 7 ? 'acute recovery phase' : daysSinceSurgery < 30 ? 'early recovery' : 'established recovery'}`,
  });

  // Emergency and reoperation
  const emergencyRisk = (surgical.isEmergency ? 30 : 0) + (surgical.isReoperation ? 25 : 0);
  contributors.push({
    factor: 'emergencyReoperation',
    weight: 0.10,
    rawValue: `Emergency: ${surgical.isEmergency}, Reoperation: ${surgical.isReoperation}`,
    normalizedContribution: clamp(emergencyRisk, 0, 100),
    description: `${surgical.isEmergency ? 'Emergency procedure' : 'Elective'}${surgical.isReoperation ? ', reoperation' : ''}`,
  });

  // Blood loss
  const ebl = surgical.estimatedBloodLossMl ?? 0;
  let bloodLossRisk = 0;
  if (ebl < 200) bloodLossRisk = 5;
  else if (ebl < 500) bloodLossRisk = 20;
  else if (ebl < 1000) bloodLossRisk = 50;
  else bloodLossRisk = 80;
  contributors.push({
    factor: 'estimatedBloodLoss',
    weight: 0.10,
    rawValue: ebl,
    normalizedContribution: bloodLossRisk,
    description: `EBL ${ebl}ml: ${ebl > 500 ? 'significant blood loss' : 'within expected range'}`,
  });

  const score = contributors.reduce((sum, c) => sum + c.weight * c.normalizedContribution, 0) / contributors.reduce((sum, c) => sum + c.weight, 0);
  return { score: clamp(score, 0, 100), contributors };
}

/**
 * Score compliance domain (0-100, higher = MORE at risk from non-compliance).
 */
function scoreCompliance(compliance: ComplianceData): { score: number; contributors: RiskContributor[] } {
  const contributors: RiskContributor[] = [];

  // Medication adherence (inverted: low adherence = high risk)
  const medAdherenceRisk = clamp((1 - compliance.medicationAdherenceRate) * 100, 0, 100);
  contributors.push({
    factor: 'medicationAdherence',
    weight: 0.35,
    rawValue: compliance.medicationAdherenceRate,
    normalizedContribution: medAdherenceRisk,
    description: `${(compliance.medicationAdherenceRate * 100).toFixed(0)}% adherence: ${compliance.medicationAdherenceRate >= 0.9 ? 'excellent' : compliance.medicationAdherenceRate >= 0.7 ? 'adequate' : 'concerning'}`,
  });

  // Mission completion
  const missionRisk = clamp((1 - compliance.missionCompletionRate) * 100, 0, 100);
  contributors.push({
    factor: 'missionCompletion',
    weight: 0.25,
    rawValue: compliance.missionCompletionRate,
    normalizedContribution: missionRisk,
    description: `${(compliance.missionCompletionRate * 100).toFixed(0)}% mission completion`,
  });

  // Appointment attendance
  const apptRisk = clamp((1 - compliance.appointmentAttendanceRate) * 100, 0, 100);
  contributors.push({
    factor: 'appointmentAttendance',
    weight: 0.20,
    rawValue: compliance.appointmentAttendanceRate,
    normalizedContribution: apptRisk,
    description: `${(compliance.appointmentAttendanceRate * 100).toFixed(0)}% appointment attendance (${compliance.appointmentsNoShow} no-shows)`,
  });

  // Consecutive missed medication days (critical indicator)
  let consecutiveRisk = 0;
  if (compliance.consecutiveMissedDays === 0) consecutiveRisk = 0;
  else if (compliance.consecutiveMissedDays <= 1) consecutiveRisk = 15;
  else if (compliance.consecutiveMissedDays <= 3) consecutiveRisk = 45;
  else if (compliance.consecutiveMissedDays <= 7) consecutiveRisk = 75;
  else consecutiveRisk = 95;
  contributors.push({
    factor: 'consecutiveMissedDays',
    weight: 0.20,
    rawValue: compliance.consecutiveMissedDays,
    normalizedContribution: consecutiveRisk,
    description: `${compliance.consecutiveMissedDays} consecutive missed days: ${compliance.consecutiveMissedDays >= 3 ? 'intervention needed' : 'within tolerance'}`,
  });

  const score = contributors.reduce((sum, c) => sum + c.weight * c.normalizedContribution, 0) / contributors.reduce((sum, c) => sum + c.weight, 0);
  return { score: clamp(score, 0, 100), contributors };
}

/**
 * Score clinical indicators domain (0-100).
 */
function scoreClinical(clinical: ClinicalIndicators): { score: number; contributors: RiskContributor[] } {
  const contributors: RiskContributor[] = [];

  // Wound healing assessment
  const woundPhaseRisk: Record<WoundHealingPhase, number> = {
    [WoundHealingPhase.HEALED]: 0,
    [WoundHealingPhase.REMODELING]: 10,
    [WoundHealingPhase.PROLIFERATIVE]: 25,
    [WoundHealingPhase.INFLAMMATORY]: 45,
    [WoundHealingPhase.COMPLICATED]: 85,
  };
  let woundRisk = woundPhaseRisk[clinical.woundHealingPhase];
  if (!clinical.woundHealingOnTrack) woundRisk = clamp(woundRisk + 20, 0, 100);
  contributors.push({
    factor: 'woundHealing',
    weight: 0.20,
    rawValue: clinical.woundHealingPhase,
    normalizedContribution: woundRisk,
    description: `Wound in ${clinical.woundHealingPhase} phase: ${clinical.woundHealingOnTrack ? 'on track' : 'delayed healing'}`,
  });

  // Temperature / fever
  let tempRisk = 0;
  if (clinical.temperature < 36.0) tempRisk = 30; // Hypothermia
  else if (clinical.temperature <= 37.5) tempRisk = 0;
  else if (clinical.temperature <= 38.0) tempRisk = 25; // Low-grade fever
  else if (clinical.temperature <= 38.5) tempRisk = 50;
  else if (clinical.temperature <= 39.0) tempRisk = 75;
  else tempRisk = 95;
  contributors.push({
    factor: 'temperature',
    weight: 0.15,
    rawValue: clinical.temperature,
    normalizedContribution: tempRisk,
    description: `Temp ${clinical.temperature.toFixed(1)}C: ${clinical.temperature > 38.0 ? 'fever detected' : 'afebrile'}`,
  });

  // Pain assessment
  let painRisk = clamp(clinical.painLevel * 10, 0, 100);
  if (clinical.painTrend === 'increasing') painRisk = clamp(painRisk + 15, 0, 100);
  contributors.push({
    factor: 'painLevel',
    weight: 0.12,
    rawValue: clinical.painLevel,
    normalizedContribution: painRisk,
    description: `Pain ${clinical.painLevel}/10 (${clinical.painTrend}): ${clinical.painLevel >= 7 ? 'severe' : clinical.painLevel >= 4 ? 'moderate' : 'controlled'}`,
  });

  // Vital signs composite
  let vitalRisk = 0;
  // Heart rate
  if (clinical.heartRate < 50 || clinical.heartRate > 120) vitalRisk += 40;
  else if (clinical.heartRate < 60 || clinical.heartRate > 100) vitalRisk += 15;
  // Blood pressure
  if (clinical.bloodPressureSystolic > 180 || clinical.bloodPressureSystolic < 90) vitalRisk += 35;
  else if (clinical.bloodPressureSystolic > 140 || clinical.bloodPressureSystolic < 100) vitalRisk += 12;
  // Oxygen saturation
  if (clinical.oxygenSaturation < 90) vitalRisk += 50;
  else if (clinical.oxygenSaturation < 94) vitalRisk += 25;
  else if (clinical.oxygenSaturation < 96) vitalRisk += 8;
  vitalRisk = clamp(vitalRisk, 0, 100);
  contributors.push({
    factor: 'vitalSigns',
    weight: 0.18,
    rawValue: `HR:${clinical.heartRate} BP:${clinical.bloodPressureSystolic}/${clinical.bloodPressureDiastolic} SpO2:${clinical.oxygenSaturation}%`,
    normalizedContribution: vitalRisk,
    description: `Vitals: HR ${clinical.heartRate}, BP ${clinical.bloodPressureSystolic}/${clinical.bloodPressureDiastolic}, SpO2 ${clinical.oxygenSaturation}%`,
  });

  // Lab results (when available)
  let labRisk = 0;
  let labCount = 0;
  if (clinical.whiteBloodCellCount !== undefined) {
    labCount++;
    if (clinical.whiteBloodCellCount > 12000) labRisk += 40;
    else if (clinical.whiteBloodCellCount > 11000) labRisk += 15;
    else if (clinical.whiteBloodCellCount < 4000) labRisk += 30;
  }
  if (clinical.crpLevel !== undefined) {
    labCount++;
    if (clinical.crpLevel > 50) labRisk += 50;
    else if (clinical.crpLevel > 20) labRisk += 30;
    else if (clinical.crpLevel > 10) labRisk += 15;
  }
  if (clinical.albumin !== undefined) {
    labCount++;
    if (clinical.albumin < 2.5) labRisk += 45;
    else if (clinical.albumin < 3.0) labRisk += 25;
    else if (clinical.albumin < 3.5) labRisk += 10;
  }
  if (clinical.hemoglobin !== undefined) {
    labCount++;
    if (clinical.hemoglobin < 8) labRisk += 45;
    else if (clinical.hemoglobin < 10) labRisk += 25;
    else if (clinical.hemoglobin < 12) labRisk += 10;
  }
  if (labCount > 0) labRisk = clamp(labRisk / labCount, 0, 100);
  contributors.push({
    factor: 'labResults',
    weight: 0.15,
    rawValue: `WBC:${clinical.whiteBloodCellCount ?? 'N/A'} CRP:${clinical.crpLevel ?? 'N/A'} Alb:${clinical.albumin ?? 'N/A'}`,
    normalizedContribution: labRisk,
    description: `Lab values: ${labCount > 0 ? `${labCount} results available` : 'no labs available'}`,
  });

  // Infection signs composite
  const infectionSignCount = [
    clinical.hasInfectionSigns,
    clinical.hasDrainageAbnormality,
    clinical.hasSwelling,
    clinical.hasRedness,
  ].filter(Boolean).length;
  const infectionSignRisk = clamp(infectionSignCount * 25, 0, 100);
  contributors.push({
    factor: 'infectionSigns',
    weight: 0.20,
    rawValue: infectionSignCount,
    normalizedContribution: infectionSignRisk,
    description: `${infectionSignCount} infection sign(s): ${infectionSignCount === 0 ? 'none detected' : [
      clinical.hasInfectionSigns ? 'infection' : '',
      clinical.hasDrainageAbnormality ? 'drainage' : '',
      clinical.hasSwelling ? 'swelling' : '',
      clinical.hasRedness ? 'redness' : '',
    ].filter(Boolean).join(', ')}`,
  });

  const score = contributors.reduce((sum, c) => sum + c.weight * c.normalizedContribution, 0) / contributors.reduce((sum, c) => sum + c.weight, 0);
  return { score: clamp(score, 0, 100), contributors };
}

/**
 * Score behavioral signals domain (0-100, higher = more at risk).
 */
function scoreBehavioral(behavioral: BehavioralSignals): { score: number; contributors: RiskContributor[] } {
  const contributors: RiskContributor[] = [];

  // App engagement (inverted: low engagement = higher risk)
  const engagementRisk = clamp((1 - behavioral.appEngagementScore) * 80, 0, 100);
  contributors.push({
    factor: 'appEngagement',
    weight: 0.25,
    rawValue: behavioral.appEngagementScore,
    normalizedContribution: engagementRisk,
    description: `${(behavioral.appEngagementScore * 100).toFixed(0)}% engagement: ${behavioral.appEngagementScore >= 0.7 ? 'active user' : behavioral.appEngagementScore >= 0.4 ? 'moderate engagement' : 'low engagement'}`,
  });

  // Days active last week
  const activityRisk = clamp((1 - behavioral.daysActiveLastWeek / 7) * 80, 0, 100);
  contributors.push({
    factor: 'weeklyActivity',
    weight: 0.15,
    rawValue: behavioral.daysActiveLastWeek,
    normalizedContribution: activityRisk,
    description: `Active ${behavioral.daysActiveLastWeek}/7 days last week`,
  });

  // Symptom reporting frequency (too much or too little can be concerning)
  let symptomRisk = 0;
  if (behavioral.symptomReportsLast7Days === 0 && behavioral.symptomReportsLast30Days === 0) {
    symptomRisk = 30; // No reporting is concerning
  } else if (behavioral.symptomReportsLast7Days > 10) {
    symptomRisk = 60; // Excessive reporting suggests problems
  } else {
    symptomRisk = 5;
  }
  contributors.push({
    factor: 'symptomReporting',
    weight: 0.15,
    rawValue: behavioral.symptomReportsLast7Days,
    normalizedContribution: symptomRisk,
    description: `${behavioral.symptomReportsLast7Days} symptom reports this week: ${behavioral.symptomReportsLast7Days > 10 ? 'high frequency' : behavioral.symptomReportsLast7Days === 0 ? 'no reports (may indicate disengagement)' : 'normal'}`,
  });

  // Mood trend analysis
  let moodRisk = 0;
  if (behavioral.moodScores.length > 0) {
    const avgMood = behavioral.moodScores.reduce((a, b) => a + b, 0) / behavioral.moodScores.length;
    moodRisk = clamp((5 - avgMood) * 20, 0, 100);

    // Check for declining trend
    if (behavioral.moodScores.length >= 3) {
      const recentMoods = behavioral.moodScores.slice(-3);
      const isDecling = recentMoods[2] < recentMoods[0];
      if (isDecling) moodRisk = clamp(moodRisk + 15, 0, 100);
    }
  } else {
    moodRisk = 30; // No mood data is somewhat concerning
  }
  contributors.push({
    factor: 'moodTrend',
    weight: 0.20,
    rawValue: behavioral.moodScores.length > 0
      ? (behavioral.moodScores.reduce((a, b) => a + b, 0) / behavioral.moodScores.length).toFixed(1)
      : 'N/A',
    normalizedContribution: moodRisk,
    description: `Mood: ${behavioral.moodScores.length > 0 ? `avg ${(behavioral.moodScores.reduce((a, b) => a + b, 0) / behavioral.moodScores.length).toFixed(1)}/5` : 'no data'}`,
  });

  // Sleep quality
  const sleepRisk = behavioral.sleepQualityScore !== undefined
    ? clamp((10 - behavioral.sleepQualityScore) * 10, 0, 100)
    : 25;
  contributors.push({
    factor: 'sleepQuality',
    weight: 0.15,
    rawValue: behavioral.sleepQualityScore ?? 'N/A',
    normalizedContribution: sleepRisk,
    description: `Sleep: ${behavioral.sleepQualityScore !== undefined ? `${behavioral.sleepQualityScore}/10` : 'not reported'}`,
  });

  // Social interaction (if available)
  const socialRisk = behavioral.socialInteractionScore !== undefined
    ? clamp((10 - behavioral.socialInteractionScore) * 10, 0, 100)
    : 20;
  contributors.push({
    factor: 'socialInteraction',
    weight: 0.10,
    rawValue: behavioral.socialInteractionScore ?? 'N/A',
    normalizedContribution: socialRisk,
    description: `Social interaction: ${behavioral.socialInteractionScore !== undefined ? `${behavioral.socialInteractionScore}/10` : 'not measured'}`,
  });

  const score = contributors.reduce((sum, c) => sum + c.weight * c.normalizedContribution, 0) / contributors.reduce((sum, c) => sum + c.weight, 0);
  return { score: clamp(score, 0, 100), contributors };
}

// ============================================================================
// Medical Index Computations
// ============================================================================

/**
 * Compute the Charlson Comorbidity Index (CCI).
 *
 * Original methodology from Charlson et al., 1987.
 * Uses comorbidity-specific weights and age adjustment.
 */
function computeCharlsonIndex(comorbidities: ComorbidityType[], age: number): number {
  let score = 0;
  for (const c of comorbidities) {
    score += CHARLSON_WEIGHTS[c] ?? 0;
  }
  score += charlsonAgeAdjustment(age);
  return score;
}

/**
 * Compute the LACE index for readmission risk.
 *
 * L = Length of stay (0-7 points)
 * A = Acuity of admission (0 or 3 points)
 * C = Comorbidity (Charlson, 0-5 points)
 * E = Emergency department visits in past 6 months (0-4 points)
 *
 * Total: 0-19 points.
 * Score >= 10 indicates high readmission risk.
 *
 * Reference: van Walraven et al., CMAJ 2010.
 */
function computeLACEIndex(
  lengthOfStayDays: number,
  isEmergency: boolean,
  charlsonIndex: number,
  edVisitsLast6Months: number,
): number {
  // L: Length of stay
  let lScore: number;
  if (lengthOfStayDays < 1) lScore = 0;
  else if (lengthOfStayDays === 1) lScore = 1;
  else if (lengthOfStayDays === 2) lScore = 2;
  else if (lengthOfStayDays === 3) lScore = 3;
  else if (lengthOfStayDays <= 6) lScore = 4;
  else if (lengthOfStayDays <= 13) lScore = 5;
  else lScore = 7;

  // A: Acuity of admission
  const aScore = isEmergency ? 3 : 0;

  // C: Charlson comorbidity (capped at 5 for LACE)
  const cScore = Math.min(charlsonIndex, 5);

  // E: ED visits in last 6 months
  let eScore: number;
  if (edVisitsLast6Months === 0) eScore = 0;
  else if (edVisitsLast6Months === 1) eScore = 1;
  else if (edVisitsLast6Months === 2) eScore = 2;
  else if (edVisitsLast6Months === 3) eScore = 3;
  else eScore = 4;

  return lScore + aScore + cScore + eScore;
}

// ============================================================================
// Risk Stratification
// ============================================================================

function determineRiskTier(score: number): RiskTier {
  if (score < 25) return RiskTier.LOW;
  if (score < 50) return RiskTier.MODERATE;
  if (score < 75) return RiskTier.HIGH;
  return RiskTier.CRITICAL;
}

// ============================================================================
// Alert Generation
// ============================================================================

function generateAlerts(
  patientId: string,
  assessment: {
    overallRisk: number;
    infectionRisk: number;
    readmissionRisk: number;
    fallRisk: number;
    mentalHealthRisk: number;
    medicationRisk: number;
  },
  clinical: ClinicalIndicators,
  compliance: ComplianceData,
  thresholds: AlertThreshold[],
): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const now = new Date().toISOString();

  const metricValues: Record<string, number> = {
    overallRisk: assessment.overallRisk,
    infectionRisk: assessment.infectionRisk,
    readmissionRisk: assessment.readmissionRisk,
    fallRisk: assessment.fallRisk,
    mentalHealthRisk: assessment.mentalHealthRisk,
    medicationRisk: assessment.medicationRisk,
    temperature: clinical.temperature,
    heartRate: clinical.heartRate,
    oxygenSaturation: clinical.oxygenSaturation,
    consecutiveMissedDays: compliance.consecutiveMissedDays,
    painLevel: clinical.painLevel,
  };

  for (const threshold of thresholds) {
    if (!threshold.enabled) continue;
    const value = metricValues[threshold.metric];
    if (value === undefined) continue;

    // For oxygen saturation, lower is worse (invert comparison)
    const isInvertedMetric = threshold.metric === 'oxygenSaturation';

    let severity: AlertSeverity | null = null;
    if (isInvertedMetric) {
      if (value <= threshold.criticalLevel) severity = AlertSeverity.CRITICAL;
      else if (value <= threshold.urgentLevel) severity = AlertSeverity.URGENT;
      else if (value <= threshold.warningLevel) severity = AlertSeverity.WARNING;
    } else {
      if (value >= threshold.criticalLevel) severity = AlertSeverity.CRITICAL;
      else if (value >= threshold.urgentLevel) severity = AlertSeverity.URGENT;
      else if (value >= threshold.warningLevel) severity = AlertSeverity.WARNING;
    }

    if (severity) {
      const thresholdValue = severity === AlertSeverity.CRITICAL
        ? threshold.criticalLevel
        : severity === AlertSeverity.URGENT
          ? threshold.urgentLevel
          : threshold.warningLevel;

      alerts.push({
        id: generateId(),
        patientId,
        severity,
        category: threshold.category,
        message: buildAlertMessage(threshold.metric, value, severity),
        triggeringFactor: threshold.metric,
        currentValue: value,
        threshold: thresholdValue,
        timestamp: now,
        acknowledged: false,
      });
    }
  }

  return alerts;
}

function buildAlertMessage(metric: string, value: number, severity: AlertSeverity): string {
  const severityLabel = severity === AlertSeverity.CRITICAL ? 'CRITICAL'
    : severity === AlertSeverity.URGENT ? 'URGENT'
      : 'WARNING';

  const messages: Record<string, string> = {
    overallRisk: `${severityLabel}: Overall recovery risk score elevated at ${value.toFixed(0)}/100`,
    infectionRisk: `${severityLabel}: Infection risk score at ${value.toFixed(0)}/100 - review wound status and labs`,
    readmissionRisk: `${severityLabel}: Readmission risk elevated to ${value.toFixed(0)}/100`,
    fallRisk: `${severityLabel}: Fall risk at ${value.toFixed(0)}/100 - consider mobility assessment`,
    mentalHealthRisk: `${severityLabel}: Mental health risk score ${value.toFixed(0)}/100 - consider psychological support`,
    medicationRisk: `${severityLabel}: Medication non-adherence risk at ${value.toFixed(0)}/100`,
    temperature: `${severityLabel}: Temperature ${value.toFixed(1)}C - ${value > 38.5 ? 'significant fever' : 'elevated temperature'}`,
    heartRate: `${severityLabel}: Heart rate ${value} bpm - tachycardia detected`,
    oxygenSaturation: `${severityLabel}: SpO2 at ${value}% - ${value < 90 ? 'severe hypoxia' : 'hypoxia detected'}`,
    consecutiveMissedDays: `${severityLabel}: Patient has missed medications for ${value} consecutive days`,
    painLevel: `${severityLabel}: Pain level ${value}/10 - ${value >= 8 ? 'severe pain requires attention' : 'elevated pain'}`,
  };

  return messages[metric] ?? `${severityLabel}: ${metric} at ${value}`;
}

// ============================================================================
// Baseline Patient Profile Generation (200+ profiles)
// ============================================================================

/**
 * Common post-operative surgery types used in baseline profile generation
 * and for display/filtering purposes.
 */
export const SURGERY_TYPES = [
  'Total Knee Replacement', 'Total Hip Replacement', 'Coronary Artery Bypass Graft',
  'Appendectomy', 'Cholecystectomy', 'Hernia Repair', 'Spinal Fusion',
  'Cesarean Section', 'Hysterectomy', 'Mastectomy', 'Colectomy',
  'Thyroidectomy', 'Rotator Cuff Repair', 'ACL Reconstruction',
  'Laminectomy', 'Prostatectomy', 'Nephrectomy', 'Gastric Bypass',
  'Cardiac Valve Replacement', 'Carotid Endarterectomy',
] as const;
export type SurgeryType = typeof SURGERY_TYPES[number];

const AGE_GROUPS = ['18-34', '35-49', '50-64', '65-74', '75+'] as const;
const ALL_COMORBIDITIES = Object.values(ComorbidityType);
const COMPLEXITY_OPTIONS: readonly SurgeryComplexity[] = [
  SurgeryComplexity.MINOR, SurgeryComplexity.MODERATE, SurgeryComplexity.MAJOR, SurgeryComplexity.COMPLEX,
];

function generateBaselineProfiles(): BaselinePatientProfile[] {
  const profiles: BaselinePatientProfile[] = [];
  const rng = seededRandom(42);

  for (let i = 0; i < 210; i++) {
    const ageGroupIdx = Math.floor(rng() * AGE_GROUPS.length);
    const ageGroup = AGE_GROUPS[ageGroupIdx];

    let age: number;
    switch (ageGroup) {
      case '18-34': age = 18 + Math.floor(rng() * 17); break;
      case '35-49': age = 35 + Math.floor(rng() * 15); break;
      case '50-64': age = 50 + Math.floor(rng() * 15); break;
      case '65-74': age = 65 + Math.floor(rng() * 10); break;
      case '75+': age = 75 + Math.floor(rng() * 15); break;
    }

    // BMI: normal distribution centered at 27 with std dev 5
    const u1 = rng();
    const u2 = rng();
    const normalRand = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
    const bmi = clamp(27 + normalRand * 5, 16, 55);

    const isSmoker = rng() < (age > 60 ? 0.15 : 0.22);
    const smokingPackYears = isSmoker ? Math.floor(rng() * 40) + 1 : 0;

    // Comorbidities: likelihood increases with age
    const comorbidityChance = 0.1 + (age - 18) * 0.005;
    const comorbidities: ComorbidityType[] = [];
    for (const c of ALL_COMORBIDITIES) {
      if (rng() < comorbidityChance) comorbidities.push(c);
    }

    // ASA class correlates with comorbidities
    let asaClass: ASAClass;
    if (comorbidities.length === 0) asaClass = rng() < 0.7 ? ASAClass.ASA_I : ASAClass.ASA_II;
    else if (comorbidities.length <= 2) asaClass = rng() < 0.6 ? ASAClass.ASA_II : ASAClass.ASA_III;
    else if (comorbidities.length <= 4) asaClass = rng() < 0.5 ? ASAClass.ASA_III : ASAClass.ASA_IV;
    else asaClass = rng() < 0.4 ? ASAClass.ASA_IV : ASAClass.ASA_V;

    const gender = rng() < 0.52 ? 'female' as const : 'male' as const;
    const livesAlone = rng() < (age > 70 ? 0.35 : 0.2);
    const hasCaregiver = !livesAlone || rng() < 0.4;
    const complexity = pickRandom(COMPLEXITY_OPTIONS, rng);

    const demographics: PatientDemographics = {
      patientId: `baseline-${i.toString().padStart(3, '0')}`,
      age,
      bmi,
      isSmoker,
      smokingPackYears: isSmoker ? smokingPackYears : undefined,
      comorbidities,
      asaClass,
      gender,
      livesAlone,
      hasCaregiver,
      primaryLanguageEnglish: rng() < 0.85,
      insuranceType: pickRandom(['private', 'medicare', 'medicaid', 'uninsured'] as const, rng),
    };

    // Compute risk scores deterministically based on profile
    const cci = computeCharlsonIndex(comorbidities, age);
    const demScore = scoreDemographics(demographics).score;

    // Simple surgical risk based on complexity
    const complexityScores: Record<SurgeryComplexity, number> = {
      [SurgeryComplexity.MINOR]: 10 + rng() * 15,
      [SurgeryComplexity.MODERATE]: 25 + rng() * 20,
      [SurgeryComplexity.MAJOR]: 45 + rng() * 25,
      [SurgeryComplexity.COMPLEX]: 65 + rng() * 25,
    };
    const surgScore = complexityScores[complexity];

    // Overall risk is weighted blend
    const overallRisk = clamp(demScore * 0.4 + surgScore * 0.35 + (cci * 5) * 0.25, 0, 100);
    const infectionRisk = clamp(overallRisk * (0.7 + rng() * 0.6) + (isSmoker ? 10 : 0) + (bmi > 35 ? 8 : 0), 0, 100);
    const readmissionRisk = clamp(overallRisk * (0.6 + rng() * 0.5) + (cci > 3 ? 15 : 0) + (livesAlone ? 8 : 0), 0, 100);
    const fallRisk = clamp((age > 65 ? 35 : 10) + (comorbidities.length * 5) + (rng() * 20), 0, 100);
    const mentalHealthRisk = clamp(
      (comorbidities.includes(ComorbidityType.DEPRESSION) ? 40 : 10)
      + (comorbidities.includes(ComorbidityType.ANXIETY) ? 20 : 0)
      + (livesAlone ? 10 : 0) + rng() * 15,
      0, 100,
    );
    const medicationRisk = clamp(
      (comorbidities.length * 6) + (age > 75 ? 15 : 0)
      + (!hasCaregiver ? 10 : 0) + rng() * 15,
      0, 100,
    );

    // Outcome based on overall risk
    let outcome: 'good' | 'moderate' | 'poor' | 'readmitted';
    if (overallRisk < 25) outcome = 'good';
    else if (overallRisk < 50) outcome = rng() < 0.8 ? 'moderate' : 'good';
    else if (overallRisk < 75) outcome = rng() < 0.6 ? 'poor' : rng() < 0.3 ? 'readmitted' : 'moderate';
    else outcome = rng() < 0.5 ? 'readmitted' : 'poor';

    profiles.push({
      id: demographics.patientId,
      demographics,
      surgeryComplexity: complexity,
      ageGroup,
      overallRiskScore: Math.round(overallRisk * 10) / 10,
      infectionRiskScore: Math.round(infectionRisk * 10) / 10,
      readmissionRiskScore: Math.round(readmissionRisk * 10) / 10,
      fallRiskScore: Math.round(fallRisk * 10) / 10,
      mentalHealthRiskScore: Math.round(mentalHealthRisk * 10) / 10,
      medicationRiskScore: Math.round(medicationRisk * 10) / 10,
      outcome,
    });
  }

  return profiles;
}

// ============================================================================
// Risk Scoring Engine Class
// ============================================================================

export class RiskScoringEngine {
  private alertThresholds: AlertThreshold[];
  private riskHistory: Map<string, RiskTrendPoint[]>;
  private bayesianPriors: Map<string, Record<string, BayesianPrior>>;
  private baselineProfiles: BaselinePatientProfile[];
  private populationStats: {
    overall: { mean: number; stdDev: number };
    infection: { mean: number; stdDev: number };
    readmission: { mean: number; stdDev: number };
    fall: { mean: number; stdDev: number };
    mentalHealth: { mean: number; stdDev: number };
    medication: { mean: number; stdDev: number };
  };

  constructor(customThresholds?: AlertThreshold[]) {
    this.alertThresholds = customThresholds ?? [...DEFAULT_ALERT_THRESHOLDS];
    this.riskHistory = new Map();
    this.bayesianPriors = new Map();
    this.baselineProfiles = generateBaselineProfiles();
    this.populationStats = this.computePopulationStats();
  }

  // --------------------------------------------------------------------------
  // Core Assessment
  // --------------------------------------------------------------------------

  /**
   * Perform a comprehensive risk assessment for a patient.
   *
   * Scores all six risk categories, computes LACE and Charlson indices,
   * applies Bayesian updates if prior observations exist, and generates
   * alerts for any threshold violations.
   */
  assessRisk(input: PatientRiskInput): RiskAssessment {
    const patientId = input.demographics.patientId;

    // Score each domain
    const demResult = scoreDemographics(input.demographics);
    const surgResult = scoreSurgical(input.surgical);
    const compResult = scoreCompliance(input.compliance);
    const clinResult = scoreClinical(input.clinical);
    const behResult = scoreBehavioral(input.behavioral);

    const domainScores = {
      demographics: demResult.score,
      surgical: surgResult.score,
      compliance: compResult.score,
      clinical: clinResult.score,
      behavioral: behResult.score,
    };

    // Compute each risk category
    const overallScore = this.computeCategoryScore(domainScores, DOMAIN_WEIGHTS);
    const infectionScore = this.computeCategoryScore(domainScores, CATEGORY_DOMAIN_WEIGHTS['infection']);
    const fallScore = this.computeCategoryScore(domainScores, CATEGORY_DOMAIN_WEIGHTS['fall']);
    const mentalHealthScore = this.computeCategoryScore(domainScores, CATEGORY_DOMAIN_WEIGHTS['mentalHealth']);
    const medicationScore = this.computeCategoryScore(domainScores, CATEGORY_DOMAIN_WEIGHTS['medication']);

    // Compute medical indices
    const charlsonIndex = computeCharlsonIndex(input.demographics.comorbidities, input.demographics.age);
    const laceIndex = computeLACEIndex(
      input.lengthOfStayDays ?? 1,
      input.surgical.isEmergency,
      charlsonIndex,
      input.edVisitsLast6Months ?? 0,
    );

    // Readmission risk uses LACE methodology: normalize LACE (0-19) to 0-100 and blend
    const laceNormalized = (laceIndex / 19) * 100;
    const readmissionDomainScore = this.computeCategoryScore(domainScores, CATEGORY_DOMAIN_WEIGHTS['readmission']);
    const readmissionScore = readmissionDomainScore * 0.5 + laceNormalized * 0.5;

    // Apply Bayesian update
    const rawScores = {
      overall: overallScore,
      infection: infectionScore,
      readmission: readmissionScore,
      fall: fallScore,
      mentalHealth: mentalHealthScore,
      medication: medicationScore,
    };
    const updatedScores = this.bayesianUpdate(patientId, rawScores);

    // Collect all contributors
    const allContributors = [
      ...demResult.contributors,
      ...surgResult.contributors,
      ...compResult.contributors,
      ...clinResult.contributors,
      ...behResult.contributors,
    ];

    const topN = (n: number) => [...allContributors]
      .sort((a, b) => b.normalizedContribution * b.weight - a.normalizedContribution * a.weight)
      .slice(0, n);

    // Build category scores
    const overallRisk = this.buildCategoryScore(updatedScores.overall, topN(5));
    const infectionRisk = this.buildCategoryScore(updatedScores.infection, topN(4), 'Composite: wound status, vitals, inflammatory markers, surgical factors');
    const readmissionRisk = this.buildCategoryScore(updatedScores.readmission, topN(4), `LACE Index (${laceIndex}/19) blended with multi-factor model`);
    const fallRisk = this.buildCategoryScore(updatedScores.fall, topN(4), 'Age, mobility, medication, cognitive factors');
    const mentalHealthRisk = this.buildCategoryScore(updatedScores.mentalHealth, topN(4), 'Mood trends, engagement, social factors, psychiatric history');
    const medicationRisk = this.buildCategoryScore(updatedScores.medication, topN(4), 'Adherence rates, polypharmacy, cognitive factors');

    // Generate alerts
    const alerts = generateAlerts(
      patientId,
      {
        overallRisk: updatedScores.overall,
        infectionRisk: updatedScores.infection,
        readmissionRisk: updatedScores.readmission,
        fallRisk: updatedScores.fall,
        mentalHealthRisk: updatedScores.mentalHealth,
        medicationRisk: updatedScores.medication,
      },
      input.clinical,
      input.compliance,
      this.alertThresholds,
    );

    // Record trend point
    this.recordTrendPoint(patientId, updatedScores);

    const assessment: RiskAssessment = {
      patientId,
      assessmentId: generateId(),
      timestamp: new Date().toISOString(),
      overallRisk,
      infectionRisk,
      readmissionRisk,
      fallRisk,
      mentalHealthRisk,
      medicationNonAdherenceRisk: medicationRisk,
      laceIndexScore: laceIndex,
      charlsonComorbidityIndex: charlsonIndex,
      alerts,
    };

    return assessment;
  }

  // --------------------------------------------------------------------------
  // Bayesian Dynamic Updates
  // --------------------------------------------------------------------------

  /**
   * Apply Bayesian updating to risk scores.
   *
   * Uses conjugate normal-normal model: as more observations arrive,
   * the posterior mean shifts toward the observed values, weighted by
   * the number of prior observations (precision weighting).
   *
   * This smooths out transient spikes while allowing genuine trends
   * to emerge over multiple assessments.
   */
  private bayesianUpdate(
    patientId: string,
    observed: Record<string, number>,
  ): Record<string, number> {
    if (!this.bayesianPriors.has(patientId)) {
      // Initialize priors from population statistics
      const priors: Record<string, BayesianPrior> = {};
      for (const key of Object.keys(observed)) {
        const statKey = key as keyof typeof this.populationStats;
        const stat = this.populationStats[statKey];
        priors[key] = {
          mean: stat?.mean ?? 30,
          variance: (stat?.stdDev ?? 15) ** 2,
          observationCount: 1, // Start with weak prior (1 pseudo-observation)
        };
      }
      this.bayesianPriors.set(patientId, priors);
    }

    const priors = this.bayesianPriors.get(patientId)!;
    const updated: Record<string, number> = {};

    for (const [key, observedValue] of Object.entries(observed)) {
      const prior = priors[key];
      if (!prior) {
        updated[key] = observedValue;
        continue;
      }

      // Observation variance: assume measurement noise proportional to score range
      const observationVariance = 100; // Fixed measurement uncertainty

      // Conjugate normal-normal posterior
      const priorPrecision = 1 / prior.variance;
      const likelihoodPrecision = 1 / observationVariance;
      const posteriorPrecision = priorPrecision + likelihoodPrecision;
      const posteriorMean = (priorPrecision * prior.mean + likelihoodPrecision * observedValue) / posteriorPrecision;
      const posteriorVariance = 1 / posteriorPrecision;

      // Update prior for next observation
      prior.mean = posteriorMean;
      prior.variance = posteriorVariance;
      prior.observationCount += 1;

      // After enough observations, weight shifts heavily toward observed
      // This prevents the prior from dominating long-term
      const priorWeight = Math.max(0.1, 1 / (prior.observationCount + 1));
      const blendedScore = priorWeight * posteriorMean + (1 - priorWeight) * observedValue;

      updated[key] = clamp(blendedScore, 0, 100);
    }

    return updated;
  }

  /**
   * Reset Bayesian priors for a patient (e.g., after a new surgery).
   */
  resetPriors(patientId: string): void {
    this.bayesianPriors.delete(patientId);
  }

  // --------------------------------------------------------------------------
  // Trend Analysis
  // --------------------------------------------------------------------------

  /**
   * Record a risk trend data point.
   */
  private recordTrendPoint(patientId: string, scores: Record<string, number>): void {
    if (!this.riskHistory.has(patientId)) {
      this.riskHistory.set(patientId, []);
    }
    const history = this.riskHistory.get(patientId)!;
    history.push({
      timestamp: new Date().toISOString(),
      overallRisk: scores['overall'] ?? 0,
      infectionRisk: scores['infection'] ?? 0,
      readmissionRisk: scores['readmission'] ?? 0,
      fallRisk: scores['fall'] ?? 0,
      mentalHealthRisk: scores['mentalHealth'] ?? 0,
      medicationRisk: scores['medication'] ?? 0,
    });

    // Keep maximum 365 data points per patient
    if (history.length > 365) {
      history.splice(0, history.length - 365);
    }
  }

  /**
   * Analyze risk trends for a patient over a given number of days.
   *
   * Uses linear regression to determine slope and direction.
   * Returns prediction for 7-day outlook.
   */
  analyzeTrend(patientId: string, category: 'overall' | 'infection' | 'readmission' | 'fall' | 'mentalHealth' | 'medication', daysBack: number = 30): TrendAnalysis {
    const history = this.riskHistory.get(patientId) ?? [];
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const relevantPoints = history.filter(p => new Date(p.timestamp).getTime() >= cutoff);

    if (relevantPoints.length < 2) {
      return {
        direction: TrendDirection.STABLE,
        slope: 0,
        rSquared: 0,
        daysAnalyzed: relevantPoints.length,
        predictedScoreIn7Days: relevantPoints[0]
          ? this.getTrendValue(relevantPoints[0], category)
          : 30,
        significantChange: false,
      };
    }

    const firstTimestamp = new Date(relevantPoints[0].timestamp).getTime();
    const points = relevantPoints.map(p => ({
      x: (new Date(p.timestamp).getTime() - firstTimestamp) / (1000 * 60 * 60 * 24), // days
      y: this.getTrendValue(p, category),
    }));

    const regression = linearRegression(points);
    const lastX = points[points.length - 1].x;
    const predicted = clamp(regression.slope * (lastX + 7) + regression.intercept, 0, 100);

    // Determine direction based on slope magnitude
    let direction: TrendDirection;
    if (regression.slope > 2) direction = TrendDirection.RAPIDLY_WORSENING;
    else if (regression.slope > 0.5) direction = TrendDirection.WORSENING;
    else if (regression.slope < -0.5) direction = TrendDirection.IMPROVING;
    else direction = TrendDirection.STABLE;

    const significantChange = Math.abs(regression.slope) > 0.5 && regression.rSquared > 0.3;

    return {
      direction,
      slope: Math.round(regression.slope * 100) / 100,
      rSquared: Math.round(regression.rSquared * 1000) / 1000,
      daysAnalyzed: Math.round(lastX),
      predictedScoreIn7Days: Math.round(predicted * 10) / 10,
      significantChange,
    };
  }

  /**
   * Get full trend history for a patient.
   */
  getTrendHistory(patientId: string): RiskTrendPoint[] {
    return [...(this.riskHistory.get(patientId) ?? [])];
  }

  /**
   * Manually add a historical trend point (for back-filling data).
   */
  addTrendPoint(patientId: string, point: RiskTrendPoint): void {
    if (!this.riskHistory.has(patientId)) {
      this.riskHistory.set(patientId, []);
    }
    this.riskHistory.get(patientId)!.push(point);
    this.riskHistory.get(patientId)!.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  private getTrendValue(point: RiskTrendPoint, category: string): number {
    const map: Record<string, number> = {
      overall: point.overallRisk,
      infection: point.infectionRisk,
      readmission: point.readmissionRisk,
      fall: point.fallRisk,
      mentalHealth: point.mentalHealthRisk,
      medication: point.medicationRisk,
    };
    return map[category] ?? point.overallRisk;
  }

  // --------------------------------------------------------------------------
  // Population Comparison
  // --------------------------------------------------------------------------

  /**
   * Compare a patient's risk against the baseline population.
   *
   * Returns percentile ranking using z-score and normal CDF approximation.
   */
  compareToPopulation(
    patientScore: number,
    category: 'overall' | 'infection' | 'readmission' | 'fall' | 'mentalHealth' | 'medication',
  ): PopulationComparison {
    const stat = this.populationStats[category];
    const zScore = stat.stdDev > 0 ? (patientScore - stat.mean) / stat.stdDev : 0;
    const percentile = normalCDF(zScore) * 100;

    return {
      patientScore,
      populationMean: Math.round(stat.mean * 10) / 10,
      populationStdDev: Math.round(stat.stdDev * 10) / 10,
      percentile: Math.round(percentile * 10) / 10,
      zScore: Math.round(zScore * 100) / 100,
      comparisonGroup: `All post-operative patients (n=${this.baselineProfiles.length})`,
    };
  }

  /**
   * Compare against a filtered subgroup (by age group, surgery complexity, etc.).
   */
  compareToSubgroup(
    patientScore: number,
    category: 'overall' | 'infection' | 'readmission' | 'fall' | 'mentalHealth' | 'medication',
    filter: { ageGroup?: string; surgeryComplexity?: SurgeryComplexity },
  ): PopulationComparison {
    let filtered = this.baselineProfiles;
    let groupDesc = 'Post-operative patients';

    if (filter.ageGroup) {
      filtered = filtered.filter(p => p.ageGroup === filter.ageGroup);
      groupDesc += ` aged ${filter.ageGroup}`;
    }
    if (filter.surgeryComplexity) {
      filtered = filtered.filter(p => p.surgeryComplexity === filter.surgeryComplexity);
      groupDesc += ` with ${filter.surgeryComplexity} surgery`;
    }

    if (filtered.length < 5) {
      // Fall back to full population if subgroup too small
      return this.compareToPopulation(patientScore, category);
    }

    const scores = filtered.map(p => {
      const scoreMap: Record<string, number> = {
        overall: p.overallRiskScore,
        infection: p.infectionRiskScore,
        readmission: p.readmissionRiskScore,
        fall: p.fallRiskScore,
        mentalHealth: p.mentalHealthRiskScore,
        medication: p.medicationRiskScore,
      };
      return scoreMap[category] ?? p.overallRiskScore;
    });

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const zScore = stdDev > 0 ? (patientScore - mean) / stdDev : 0;
    const percentile = normalCDF(zScore) * 100;

    return {
      patientScore,
      populationMean: Math.round(mean * 10) / 10,
      populationStdDev: Math.round(stdDev * 10) / 10,
      percentile: Math.round(percentile * 10) / 10,
      zScore: Math.round(zScore * 100) / 100,
      comparisonGroup: `${groupDesc} (n=${filtered.length})`,
    };
  }

  // --------------------------------------------------------------------------
  // Alert Configuration
  // --------------------------------------------------------------------------

  /**
   * Get current alert thresholds.
   */
  getAlertThresholds(): AlertThreshold[] {
    return [...this.alertThresholds];
  }

  /**
   * Update an alert threshold.
   */
  updateAlertThreshold(category: string, metric: string, updates: Partial<Omit<AlertThreshold, 'category' | 'metric'>>): boolean {
    const threshold = this.alertThresholds.find(t => t.category === category && t.metric === metric);
    if (!threshold) return false;

    if (updates.warningLevel !== undefined) threshold.warningLevel = updates.warningLevel;
    if (updates.urgentLevel !== undefined) threshold.urgentLevel = updates.urgentLevel;
    if (updates.criticalLevel !== undefined) threshold.criticalLevel = updates.criticalLevel;
    if (updates.enabled !== undefined) threshold.enabled = updates.enabled;

    return true;
  }

  /**
   * Add a custom alert threshold.
   */
  addAlertThreshold(threshold: AlertThreshold): void {
    this.alertThresholds.push(threshold);
  }

  /**
   * Remove an alert threshold.
   */
  removeAlertThreshold(category: string, metric: string): boolean {
    const index = this.alertThresholds.findIndex(t => t.category === category && t.metric === metric);
    if (index < 0) return false;
    this.alertThresholds.splice(index, 1);
    return true;
  }

  // --------------------------------------------------------------------------
  // Baseline Data Access
  // --------------------------------------------------------------------------

  /**
   * Get all baseline patient profiles.
   */
  getBaselineProfiles(): BaselinePatientProfile[] {
    return [...this.baselineProfiles];
  }

  /**
   * Get baseline profiles filtered by criteria.
   */
  getFilteredProfiles(filter: {
    ageGroup?: string;
    surgeryComplexity?: SurgeryComplexity;
    outcome?: 'good' | 'moderate' | 'poor' | 'readmitted';
    minOverallRisk?: number;
    maxOverallRisk?: number;
  }): BaselinePatientProfile[] {
    return this.baselineProfiles.filter(p => {
      if (filter.ageGroup && p.ageGroup !== filter.ageGroup) return false;
      if (filter.surgeryComplexity && p.surgeryComplexity !== filter.surgeryComplexity) return false;
      if (filter.outcome && p.outcome !== filter.outcome) return false;
      if (filter.minOverallRisk !== undefined && p.overallRiskScore < filter.minOverallRisk) return false;
      if (filter.maxOverallRisk !== undefined && p.overallRiskScore > filter.maxOverallRisk) return false;
      return true;
    });
  }

  /**
   * Get population statistics.
   */
  getPopulationStats(): typeof this.populationStats {
    return { ...this.populationStats };
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Compute Charlson Comorbidity Index for a given patient.
   * Exposed as a public utility for use outside the engine.
   */
  computeCharlsonIndex(comorbidities: ComorbidityType[], age: number): number {
    return computeCharlsonIndex(comorbidities, age);
  }

  /**
   * Compute LACE index for a given set of parameters.
   * Exposed as a public utility.
   */
  computeLACEIndex(
    lengthOfStayDays: number,
    isEmergency: boolean,
    charlsonIndex: number,
    edVisitsLast6Months: number,
  ): number {
    return computeLACEIndex(lengthOfStayDays, isEmergency, charlsonIndex, edVisitsLast6Months);
  }

  /**
   * Determine risk tier for a given score.
   */
  getRiskTier(score: number): RiskTier {
    return determineRiskTier(score);
  }

  /**
   * Clear all stored data for a patient.
   */
  clearPatientData(patientId: string): void {
    this.riskHistory.delete(patientId);
    this.bayesianPriors.delete(patientId);
  }

  /**
   * Get the number of assessments recorded for a patient.
   */
  getAssessmentCount(patientId: string): number {
    return this.bayesianPriors.get(patientId)?.['overall']?.observationCount ?? 0;
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private computeCategoryScore(
    domainScores: Record<string, number>,
    weights: Record<string, number>,
  ): number {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const [domain, weight] of Object.entries(weights)) {
      const score = domainScores[domain];
      if (score !== undefined) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }
    return totalWeight > 0 ? clamp(weightedSum / totalWeight, 0, 100) : 0;
  }

  private buildCategoryScore(
    score: number,
    topContributors: RiskContributor[],
    methodology?: string,
  ): RiskCategoryScore {
    return {
      score: Math.round(score * 10) / 10,
      tier: determineRiskTier(score),
      confidence: this.computeConfidence(topContributors),
      topContributors,
      methodology,
    };
  }

  private computeConfidence(contributors: RiskContributor[]): number {
    // Confidence is higher when more factors have data and agree
    if (contributors.length === 0) return 0.3;
    const naCount = contributors.filter(c =>
      c.rawValue === 'N/A' || c.rawValue === 'not measured',
    ).length;
    const dataCompleteness = 1 - naCount / contributors.length;
    return clamp(0.5 + dataCompleteness * 0.5, 0.3, 0.99);
  }

  private computePopulationStats(): typeof this.populationStats {
    const computeStats = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      return { mean, stdDev: Math.sqrt(variance) };
    };

    return {
      overall: computeStats(this.baselineProfiles.map(p => p.overallRiskScore)),
      infection: computeStats(this.baselineProfiles.map(p => p.infectionRiskScore)),
      readmission: computeStats(this.baselineProfiles.map(p => p.readmissionRiskScore)),
      fall: computeStats(this.baselineProfiles.map(p => p.fallRiskScore)),
      mentalHealth: computeStats(this.baselineProfiles.map(p => p.mentalHealthRiskScore)),
      medication: computeStats(this.baselineProfiles.map(p => p.medicationRiskScore)),
    };
  }
}

// ============================================================================
// Singleton & Exports
// ============================================================================

/** Default singleton instance of the risk scoring engine. */
export const riskScoringEngine = new RiskScoringEngine();

/**
 * Create a new RiskScoringEngine instance with custom alert thresholds.
 */
export function createRiskScoringEngine(customThresholds?: AlertThreshold[]): RiskScoringEngine {
  return new RiskScoringEngine(customThresholds);
}
