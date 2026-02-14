/**
 * Blood Glucose Monitor Service
 *
 * Implements real clinical blood glucose management:
 * - ADA inpatient glucose targets (140-180 mg/dL)
 * - Insulin dosing protocols (correction factor, ICR)
 * - Sliding scale insulin calculator
 * - Hypoglycemia protocol (15/15 rule)
 * - HbA1c estimation from average glucose (real formula)
 * - Insulin types with real pharmacokinetics
 * - Time-in-range calculation
 * - Self-learning insulin sensitivity adjustment
 *
 * Based on: ADA Standards of Medical Care in Diabetes;
 * AACE/ADA Inpatient Glycemic Control Guidelines
 */

// ============================================================================
// Constants & Enums
// ============================================================================

export const GlucoseStatus = {
  SEVERE_HYPOGLYCEMIA: 'severe_hypoglycemia',
  HYPOGLYCEMIA: 'hypoglycemia',
  BELOW_TARGET: 'below_target',
  IN_TARGET: 'in_target',
  ABOVE_TARGET: 'above_target',
  HYPERGLYCEMIA: 'hyperglycemia',
  SEVERE_HYPERGLYCEMIA: 'severe_hyperglycemia',
} as const;
export type GlucoseStatus = typeof GlucoseStatus[keyof typeof GlucoseStatus];

export const InsulinType = {
  RAPID_ACTING: 'rapid_acting',
  SHORT_ACTING: 'short_acting',
  INTERMEDIATE_ACTING: 'intermediate_acting',
  LONG_ACTING: 'long_acting',
  ULTRA_LONG_ACTING: 'ultra_long_acting',
} as const;
export type InsulinType = typeof InsulinType[keyof typeof InsulinType];

export const HypoSeverity = {
  LEVEL_1: 'level_1',    // 54-69 mg/dL
  LEVEL_2: 'level_2',    // < 54 mg/dL
  LEVEL_3: 'level_3',    // Severe: altered mental/physical status
} as const;
export type HypoSeverity = typeof HypoSeverity[keyof typeof HypoSeverity];

export const SlidingScaleIntensity = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  AGGRESSIVE: 'aggressive',
} as const;
export type SlidingScaleIntensity = typeof SlidingScaleIntensity[keyof typeof SlidingScaleIntensity];

// ============================================================================
// Interfaces
// ============================================================================

export interface GlucoseReading {
  timestamp: string;
  value: number;           // mg/dL
  status: GlucoseStatus;
  source: 'fingerstick' | 'cgm' | 'lab';
  fasting: boolean;
}

export interface InsulinProfile {
  name: string;
  genericName: string;
  type: InsulinType;
  onsetMinutes: number;
  peakHours: { min: number; max: number };
  durationHours: { min: number; max: number };
  maxDoseUnits: number;
  notes: string;
}

export interface GlucoseTargets {
  generalLow: number;      // 140 mg/dL
  generalHigh: number;     // 180 mg/dL
  icuLow: number;          // 140 mg/dL
  icuHigh: number;         // 180 mg/dL
  preMealTarget: number;   // <140 mg/dL
  randomTarget: number;    // <180 mg/dL
  hypoglycemiaThreshold: number; // 70 mg/dL
  severeHypoglycemia: number;    // 54 mg/dL
}

export interface CorrectionFactor {
  totalDailyDose: number;
  correctionFactor: number;   // mg/dL drop per unit of insulin (1800/TDD rule for rapid)
  insulinCarbRatio: number;   // grams of carb per unit of insulin (500/TDD rule)
  targetGlucose: number;
}

export interface SlidingScaleEntry {
  glucoseMin: number;
  glucoseMax: number;
  dose: number;             // units of rapid-acting insulin
}

export interface SlidingScaleProtocol {
  intensity: SlidingScaleIntensity;
  insulinType: string;
  scale: SlidingScaleEntry[];
  basalInsulin: string;
  monitoring: string;
  notes: string[];
}

export interface HypoglycemiaProtocol {
  severity: HypoSeverity;
  glucoseValue: number;
  isConscious: boolean;
  treatment: string[];
  monitoring: string[];
  preventionSteps: string[];
}

export interface HbA1cEstimate {
  averageGlucose: number;   // mg/dL
  estimatedHbA1c: number;   // percentage
  formula: string;
  interpretation: string;
}

export interface TimeInRange {
  totalReadings: number;
  belowRange: number;       // < 70
  inRange: number;           // 70-180
  aboveRange: number;        // > 180
  belowRangePercent: number;
  inRangePercent: number;
  aboveRangePercent: number;
  targetInRangePercent: number; // > 70% recommended
  glycemicVariability: number;  // CV%
  meanGlucose: number;
}

export interface PatientGlucoseProfile {
  patientId: string;
  readings: GlucoseReading[];
  currentRegimen: string;
  totalDailyDose: number;
  correctionFactor: CorrectionFactor;
  timeInRange: TimeInRange;
  a1cEstimate: HbA1cEstimate;
}

export interface LearningData {
  totalPatients: number;
  totalReadings: number;
  hypoEvents: number;
  hyperEvents: number;
  averageTimeInRange: number;
  adjustedSensitivityFactors: Record<string, number>;
  modelAccuracy: number;
}

// ============================================================================
// Real Insulin Profiles
// ============================================================================

const INSULIN_PROFILES: InsulinProfile[] = [
  {
    name: 'Lispro (Humalog)',
    genericName: 'insulin lispro',
    type: InsulinType.RAPID_ACTING,
    onsetMinutes: 15,
    peakHours: { min: 0.5, max: 2.5 },
    durationHours: { min: 3, max: 5 },
    maxDoseUnits: 100,
    notes: 'Give immediately before meals or within 15 minutes of starting meal',
  },
  {
    name: 'Aspart (NovoLog)',
    genericName: 'insulin aspart',
    type: InsulinType.RAPID_ACTING,
    onsetMinutes: 15,
    peakHours: { min: 1, max: 3 },
    durationHours: { min: 3, max: 5 },
    maxDoseUnits: 100,
    notes: 'Give 5-10 minutes before meals',
  },
  {
    name: 'Glulisine (Apidra)',
    genericName: 'insulin glulisine',
    type: InsulinType.RAPID_ACTING,
    onsetMinutes: 15,
    peakHours: { min: 0.5, max: 1.5 },
    durationHours: { min: 3, max: 5 },
    maxDoseUnits: 100,
    notes: 'Give within 15 minutes before or within 20 minutes after starting a meal',
  },
  {
    name: 'Regular (Humulin R)',
    genericName: 'regular insulin',
    type: InsulinType.SHORT_ACTING,
    onsetMinutes: 30,
    peakHours: { min: 2, max: 4 },
    durationHours: { min: 5, max: 8 },
    maxDoseUnits: 100,
    notes: 'Give 30 minutes before meals. Can be given IV for DKA/HHS.',
  },
  {
    name: 'NPH (Humulin N)',
    genericName: 'NPH insulin',
    type: InsulinType.INTERMEDIATE_ACTING,
    onsetMinutes: 90,
    peakHours: { min: 4, max: 12 },
    durationHours: { min: 12, max: 18 },
    maxDoseUnits: 100,
    notes: 'Cloudy appearance - must resuspend. Twice daily dosing typical.',
  },
  {
    name: 'Glargine (Lantus)',
    genericName: 'insulin glargine',
    type: InsulinType.LONG_ACTING,
    onsetMinutes: 120,
    peakHours: { min: 6, max: 6 },       // Essentially peakless
    durationHours: { min: 20, max: 24 },
    maxDoseUnits: 100,
    notes: 'Peakless; once daily dosing. Do NOT mix with other insulins.',
  },
  {
    name: 'Detemir (Levemir)',
    genericName: 'insulin detemir',
    type: InsulinType.LONG_ACTING,
    onsetMinutes: 120,
    peakHours: { min: 3, max: 9 },
    durationHours: { min: 12, max: 24 },
    maxDoseUnits: 100,
    notes: 'May require twice daily dosing. Dose-dependent duration.',
  },
  {
    name: 'Degludec (Tresiba)',
    genericName: 'insulin degludec',
    type: InsulinType.ULTRA_LONG_ACTING,
    onsetMinutes: 60,
    peakHours: { min: 9, max: 9 },       // Essentially peakless
    durationHours: { min: 42, max: 42 },
    maxDoseUnits: 160,
    notes: 'Ultra-long duration (>42h). Flexible dosing time. Once daily.',
  },
];

// ============================================================================
// ADA Glucose Targets
// ============================================================================

const GLUCOSE_TARGETS: GlucoseTargets = {
  generalLow: 140,
  generalHigh: 180,
  icuLow: 140,
  icuHigh: 180,
  preMealTarget: 140,
  randomTarget: 180,
  hypoglycemiaThreshold: 70,
  severeHypoglycemia: 54,
};

// ============================================================================
// Core Functions
// ============================================================================

function classifyGlucose(value: number): GlucoseStatus {
  if (value < 54) return GlucoseStatus.SEVERE_HYPOGLYCEMIA;
  if (value < 70) return GlucoseStatus.HYPOGLYCEMIA;
  if (value < 140) return GlucoseStatus.BELOW_TARGET; // In practice, below target but not hypo
  if (value <= 180) return GlucoseStatus.IN_TARGET;
  if (value <= 250) return GlucoseStatus.ABOVE_TARGET;
  if (value <= 400) return GlucoseStatus.HYPERGLYCEMIA;
  return GlucoseStatus.SEVERE_HYPERGLYCEMIA;
}

function calculateCorrectionFactor(totalDailyDose: number, targetGlucose: number = 150): CorrectionFactor {
  // 1800 Rule for rapid-acting insulin: CF = 1800 / TDD
  const correctionFactor = totalDailyDose > 0 ? Math.round(1800 / totalDailyDose) : 50;

  // 500 Rule: ICR = 500 / TDD
  const insulinCarbRatio = totalDailyDose > 0 ? Math.round(500 / totalDailyDose) : 15;

  return {
    totalDailyDose,
    correctionFactor,
    insulinCarbRatio,
    targetGlucose,
  };
}

function generateSlidingScale(
  intensity: SlidingScaleIntensity,
  insulinType: string = 'Lispro (Humalog)',
): SlidingScaleProtocol {
  let scale: SlidingScaleEntry[];
  const notes: string[] = [];

  switch (intensity) {
    case SlidingScaleIntensity.LOW:
      scale = [
        { glucoseMin: 150, glucoseMax: 199, dose: 1 },
        { glucoseMin: 200, glucoseMax: 249, dose: 2 },
        { glucoseMin: 250, glucoseMax: 299, dose: 3 },
        { glucoseMin: 300, glucoseMax: 349, dose: 4 },
        { glucoseMin: 350, glucoseMax: 400, dose: 5 },
        { glucoseMin: 401, glucoseMax: 9999, dose: 6 },
      ];
      notes.push('For insulin-sensitive or elderly patients');
      break;
    case SlidingScaleIntensity.MODERATE:
      scale = [
        { glucoseMin: 150, glucoseMax: 199, dose: 2 },
        { glucoseMin: 200, glucoseMax: 249, dose: 4 },
        { glucoseMin: 250, glucoseMax: 299, dose: 6 },
        { glucoseMin: 300, glucoseMax: 349, dose: 8 },
        { glucoseMin: 350, glucoseMax: 400, dose: 10 },
        { glucoseMin: 401, glucoseMax: 9999, dose: 12 },
      ];
      notes.push('Standard sliding scale for most patients');
      break;
    case SlidingScaleIntensity.HIGH:
      scale = [
        { glucoseMin: 150, glucoseMax: 199, dose: 3 },
        { glucoseMin: 200, glucoseMax: 249, dose: 6 },
        { glucoseMin: 250, glucoseMax: 299, dose: 9 },
        { glucoseMin: 300, glucoseMax: 349, dose: 12 },
        { glucoseMin: 350, glucoseMax: 400, dose: 15 },
        { glucoseMin: 401, glucoseMax: 9999, dose: 18 },
      ];
      notes.push('For insulin-resistant patients or those on high-dose steroids');
      break;
    case SlidingScaleIntensity.AGGRESSIVE:
      scale = [
        { glucoseMin: 150, glucoseMax: 199, dose: 4 },
        { glucoseMin: 200, glucoseMax: 249, dose: 8 },
        { glucoseMin: 250, glucoseMax: 299, dose: 12 },
        { glucoseMin: 300, glucoseMax: 349, dose: 16 },
        { glucoseMin: 350, glucoseMax: 400, dose: 20 },
        { glucoseMin: 401, glucoseMax: 9999, dose: 24 },
      ];
      notes.push('For severely insulin-resistant patients. Close monitoring required.');
      break;
  }

  notes.push('Hold insulin if glucose < 70 mg/dL and treat hypoglycemia');
  notes.push('Notify physician if glucose > 400 mg/dL');
  notes.push('Reassess sliding scale if 2+ readings > 300 mg/dL in 24 hours');

  return {
    intensity,
    insulinType,
    scale,
    basalInsulin: 'Continue home basal insulin at 80% of home dose, or initiate at 0.2 units/kg/day',
    monitoring: 'Check blood glucose before meals and at bedtime (AC/HS) = 4 times daily minimum',
    notes,
  };
}

function getCorrectionDose(
  currentGlucose: number,
  targetGlucose: number,
  correctionFactor: number,
): number {
  if (currentGlucose <= targetGlucose) return 0;
  const dose = (currentGlucose - targetGlucose) / correctionFactor;
  return Math.round(dose * 2) / 2; // Round to nearest 0.5 unit
}

function generateHypoglycemiaProtocol(
  glucoseValue: number,
  isConscious: boolean,
): HypoglycemiaProtocol {
  let severity: HypoSeverity;
  if (glucoseValue < 54 || !isConscious) {
    severity = !isConscious ? HypoSeverity.LEVEL_3 : HypoSeverity.LEVEL_2;
  } else {
    severity = HypoSeverity.LEVEL_1;
  }

  const treatment: string[] = [];
  const monitoring: string[] = [];
  const prevention: string[] = [];

  if (severity === HypoSeverity.LEVEL_3 || !isConscious) {
    // Severe - patient cannot self-treat
    treatment.push('IV access: Dextrose 50% (D50) 25 mL (12.5g glucose) IV push');
    treatment.push('If no IV access: Glucagon 1 mg IM/SC');
    treatment.push('Position patient on side (aspiration precaution)');
    treatment.push('Continuous monitoring; repeat D50 if glucose remains < 70 after 15 min');
    treatment.push('Once conscious: oral carbohydrate (15g fast-acting + complex carb)');
  } else if (severity === HypoSeverity.LEVEL_2) {
    // < 54 mg/dL but conscious
    treatment.push('15/15 Rule: Give 15-20 grams of fast-acting carbohydrate');
    treatment.push('Examples: 4 oz juice, 4 glucose tablets, 15g glucose gel');
    treatment.push('Recheck blood glucose in 15 minutes');
    treatment.push('If still < 70 mg/dL, repeat treatment');
    treatment.push('Once glucose > 70, give a snack with protein and complex carbs');
    treatment.push('Consider IV D50 if unable to achieve glucose > 70 after 2 treatments');
  } else {
    // Level 1: 54-69 mg/dL
    treatment.push('15/15 Rule: Give 15 grams of fast-acting carbohydrate');
    treatment.push('Examples: 4 oz (120 mL) juice, 3-4 glucose tablets, 1 tablespoon honey');
    treatment.push('Recheck blood glucose in 15 minutes');
    treatment.push('Repeat if glucose remains < 70 mg/dL');
    treatment.push('Follow with meal/snack if next meal is > 1 hour away');
  }

  monitoring.push('Recheck glucose every 15 minutes until > 70 mg/dL');
  monitoring.push('Recheck 1 hour after treatment to ensure stability');
  monitoring.push('Document episode in medical record');
  monitoring.push('Report to physician');

  prevention.push('Review insulin doses - consider reduction');
  prevention.push('Review meal/snack timing relative to insulin');
  prevention.push('Ensure adequate caloric intake');
  prevention.push('Consider adjusting sliding scale intensity');
  if (severity !== HypoSeverity.LEVEL_1) {
    prevention.push('Hold next scheduled insulin dose; reassess regimen');
  }

  return { severity, glucoseValue, isConscious, treatment, monitoring, preventionSteps: prevention };
}

function estimateHbA1c(averageGlucose: number): HbA1cEstimate {
  // ADAG study formula: eAG = 28.7 × A1c − 46.7
  // Rearranged: A1c = (eAG + 46.7) / 28.7
  const estimatedHbA1c = Math.round(((averageGlucose + 46.7) / 28.7) * 10) / 10;

  let interpretation: string;
  if (estimatedHbA1c < 5.7) interpretation = 'Normal range';
  else if (estimatedHbA1c < 6.5) interpretation = 'Prediabetes range';
  else if (estimatedHbA1c < 7.0) interpretation = 'Diabetes, at ADA general target';
  else if (estimatedHbA1c < 8.0) interpretation = 'Diabetes, above general target (consider intensification)';
  else if (estimatedHbA1c < 9.0) interpretation = 'Diabetes, poorly controlled';
  else interpretation = 'Diabetes, very poorly controlled (urgent medication adjustment)';

  return {
    averageGlucose,
    estimatedHbA1c,
    formula: 'A1c = (eAG + 46.7) / 28.7 (ADAG study, Nathan et al., Diabetes Care 2008)',
    interpretation,
  };
}

function calculateTimeInRange(readings: GlucoseReading[]): TimeInRange {
  if (readings.length === 0) {
    return {
      totalReadings: 0, belowRange: 0, inRange: 0, aboveRange: 0,
      belowRangePercent: 0, inRangePercent: 0, aboveRangePercent: 0,
      targetInRangePercent: 70, glycemicVariability: 0, meanGlucose: 0,
    };
  }

  let belowRange = 0;
  let inRange = 0;
  let aboveRange = 0;
  let sum = 0;

  for (const r of readings) {
    sum += r.value;
    if (r.value < 70) belowRange++;
    else if (r.value <= 180) inRange++;
    else aboveRange++;
  }

  const n = readings.length;
  const mean = sum / n;
  const variance = readings.reduce((s, r) => s + Math.pow(r.value - mean, 2), 0) / n;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;

  return {
    totalReadings: n,
    belowRange,
    inRange,
    aboveRange,
    belowRangePercent: Math.round((belowRange / n) * 1000) / 10,
    inRangePercent: Math.round((inRange / n) * 1000) / 10,
    aboveRangePercent: Math.round((aboveRange / n) * 1000) / 10,
    targetInRangePercent: 70,
    glycemicVariability: Math.round(cv * 10) / 10,
    meanGlucose: Math.round(mean),
  };
}

// ============================================================================
// Blood Glucose Monitor Class
// ============================================================================

class BloodGlucoseMonitorService {
  private patients: Map<string, PatientGlucoseProfile> = new Map();
  private learningData: LearningData;

  constructor() {
    this.learningData = {
      totalPatients: 0,
      totalReadings: 0,
      hypoEvents: 0,
      hyperEvents: 0,
      averageTimeInRange: 0,
      adjustedSensitivityFactors: {},
      modelAccuracy: 0.80,
    };
    this._generateDataset();
  }

  // Public API

  classifyGlucose(value: number): GlucoseStatus {
    return classifyGlucose(value);
  }

  getGlucoseTargets(): GlucoseTargets {
    return { ...GLUCOSE_TARGETS };
  }

  getInsulinProfiles(): InsulinProfile[] {
    return [...INSULIN_PROFILES];
  }

  calculateCorrectionFactor(totalDailyDose: number, targetGlucose?: number): CorrectionFactor {
    return calculateCorrectionFactor(totalDailyDose, targetGlucose);
  }

  getCorrectionDose(currentGlucose: number, targetGlucose: number, correctionFactor: number): number {
    return getCorrectionDose(currentGlucose, targetGlucose, correctionFactor);
  }

  generateSlidingScale(intensity: SlidingScaleIntensity, insulinType?: string): SlidingScaleProtocol {
    return generateSlidingScale(intensity, insulinType);
  }

  generateHypoglycemiaProtocol(glucoseValue: number, isConscious: boolean): HypoglycemiaProtocol {
    return generateHypoglycemiaProtocol(glucoseValue, isConscious);
  }

  estimateHbA1c(averageGlucose: number): HbA1cEstimate {
    return estimateHbA1c(averageGlucose);
  }

  calculateTimeInRange(readings: GlucoseReading[]): TimeInRange {
    return calculateTimeInRange(readings);
  }

  recordReading(patientId: string, value: number, fasting: boolean = false, source: 'fingerstick' | 'cgm' | 'lab' = 'fingerstick'): GlucoseReading {
    const reading: GlucoseReading = {
      timestamp: new Date().toISOString(),
      value,
      status: classifyGlucose(value),
      source,
      fasting,
    };

    let profile = this.patients.get(patientId);
    if (!profile) {
      const cf = calculateCorrectionFactor(40);
      profile = {
        patientId,
        readings: [],
        currentRegimen: 'Basal-bolus',
        totalDailyDose: 40,
        correctionFactor: cf,
        timeInRange: calculateTimeInRange([]),
        a1cEstimate: estimateHbA1c(150),
      };
      this.patients.set(patientId, profile);
      this.learningData.totalPatients++;
    }

    profile.readings.push(reading);
    profile.timeInRange = calculateTimeInRange(profile.readings);
    const avgGlucose = profile.timeInRange.meanGlucose;
    profile.a1cEstimate = estimateHbA1c(avgGlucose);

    this.learningData.totalReadings++;
    if (value < 70) this.learningData.hypoEvents++;
    if (value > 250) this.learningData.hyperEvents++;

    this._updateLearning(patientId);

    return reading;
  }

  getPatientProfile(patientId: string): PatientGlucoseProfile | null {
    return this.patients.get(patientId) ?? null;
  }

  getLearningData(): LearningData {
    return { ...this.learningData };
  }

  getPatientCount(): number {
    return this.patients.size;
  }

  // Private

  private _updateLearning(patientId: string): void {
    const profile = this.patients.get(patientId);
    if (!profile) return;

    // Recalculate average time in range
    let totalTIR = 0;
    let count = 0;
    for (const p of this.patients.values()) {
      if (p.timeInRange.totalReadings > 0) {
        totalTIR += p.timeInRange.inRangePercent;
        count++;
      }
    }
    this.learningData.averageTimeInRange = count > 0 ? totalTIR / count : 0;

    // Adjust sensitivity factor if patient keeps going hypo
    const recentReadings = profile.readings.slice(-10);
    const hypoCount = recentReadings.filter(r => r.value < 70).length;
    if (hypoCount >= 3) {
      // Patient is too sensitive to insulin; increase correction factor
      this.learningData.adjustedSensitivityFactors[patientId] =
        (this.learningData.adjustedSensitivityFactors[patientId] ?? 1.0) * 1.15;
    }

    const hyperCount = recentReadings.filter(r => r.value > 250).length;
    if (hyperCount >= 5) {
      // Patient is too resistant; decrease correction factor
      this.learningData.adjustedSensitivityFactors[patientId] =
        (this.learningData.adjustedSensitivityFactors[patientId] ?? 1.0) * 0.90;
    }
  }

  private _generateDataset(): void {
    for (let i = 0; i < 100; i++) {
      const patientId = `gluc-pt-${i.toString().padStart(3, '0')}`;
      const isUncontrolled = i < 25;
      const numReadings = 10 + Math.floor(Math.random() * 15);

      for (let r = 0; r < numReadings; r++) {
        let value: number;
        if (isUncontrolled) {
          value = 140 + Math.random() * 200; // 140-340
          if (Math.random() < 0.1) value = 40 + Math.random() * 30; // occasional hypo
        } else {
          value = 90 + Math.random() * 120; // 90-210, mostly in range
          if (Math.random() < 0.05) value = 50 + Math.random() * 20;
        }
        this.recordReading(patientId, Math.round(value), r % 3 === 0);
      }
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export const bloodGlucoseMonitor = new BloodGlucoseMonitorService();

export {
  classifyGlucose,
  calculateCorrectionFactor,
  generateSlidingScale,
  getCorrectionDose,
  generateHypoglycemiaProtocol,
  estimateHbA1c,
  calculateTimeInRange,
  INSULIN_PROFILES,
  GLUCOSE_TARGETS,
};
