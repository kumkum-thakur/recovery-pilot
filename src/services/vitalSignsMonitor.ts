/**
 * Vital Signs Monitor Service
 *
 * Comprehensive vital signs monitoring with smart baselines, trend analysis,
 * NEWS2 early warning scoring, wearable data simulation, and multi-level alerts.
 *
 * Requirements: Enhancement - Vital signs monitoring, early warning system
 */

// ============================================================================
// Constants & Enums (using const objects for erasableSyntaxOnly compatibility)
// ============================================================================

export const VitalSignType = {
  HEART_RATE: 'heart_rate',
  BLOOD_PRESSURE: 'blood_pressure',
  TEMPERATURE: 'temperature',
  RESPIRATORY_RATE: 'respiratory_rate',
  SPO2: 'spo2',
  WEIGHT: 'weight',
  BLOOD_GLUCOSE: 'blood_glucose',
} as const;
export type VitalSignType = typeof VitalSignType[keyof typeof VitalSignType];

export const AlertLevel = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
} as const;
export type AlertLevel = typeof AlertLevel[keyof typeof AlertLevel];

export const TrendDirection = {
  IMPROVING: 'improving',
  STABLE: 'stable',
  WORSENING: 'worsening',
} as const;
export type TrendDirection = typeof TrendDirection[keyof typeof TrendDirection];

export const ClinicalRisk = {
  LOW: 'low',
  LOW_MEDIUM: 'low-medium',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type ClinicalRisk = typeof ClinicalRisk[keyof typeof ClinicalRisk];

export const TimeOfDay = {
  RESTING: 'resting',
  ACTIVE: 'active',
} as const;
export type TimeOfDay = typeof TimeOfDay[keyof typeof TimeOfDay];

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;
export type Gender = typeof Gender[keyof typeof Gender];

export const AnomalyType = {
  FEVER: 'fever',
  TACHYCARDIA: 'tachycardia',
  BRADYCARDIA: 'bradycardia',
  HYPERTENSION: 'hypertension',
  HYPOTENSION: 'hypotension',
  HYPOXIA: 'hypoxia',
  TACHYPNEA: 'tachypnea',
  HYPERGLYCEMIA: 'hyperglycemia',
  HYPOGLYCEMIA: 'hypoglycemia',
  NONE: 'none',
} as const;
export type AnomalyType = typeof AnomalyType[keyof typeof AnomalyType];

// ============================================================================
// Interfaces
// ============================================================================

export interface VitalSignReading {
  id: string;
  patientId: string;
  timestamp: string; // ISO date string
  type: VitalSignType;
  value: number;
  secondaryValue?: number; // e.g., diastolic for blood pressure
  unit: string;
  source: 'wearable' | 'manual' | 'simulated';
  anomaly?: AnomalyType;
}

export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
}

export interface NormalRange {
  min: number;
  max: number;
  unit: string;
  secondaryMin?: number; // For blood pressure diastolic
  secondaryMax?: number;
}

export interface PatientProfile {
  patientId: string;
  age: number;
  gender: Gender;
  comorbidities: string[];
  isDiabetic: boolean;
  isPostOperative: boolean;
  surgeryDate?: string; // ISO date string
  admissionDate: string; // ISO date string
}

export interface PersonalizedBaseline {
  patientId: string;
  vitalType: VitalSignType;
  restingRange: NormalRange;
  activeRange: NormalRange;
  calibrationReadings: number;
  isCalibrated: boolean;
  lastUpdated: string; // ISO date string
}

export interface TrendAnalysis {
  vitalType: VitalSignType;
  direction: TrendDirection;
  movingAverage4h: number;
  movingAverage12h: number;
  movingAverage24h: number;
  rateOfChange: number; // units per hour
  rateOfChangePercent: number;
  dataPoints: number;
}

export interface VitalCorrelation {
  primaryVital: VitalSignType;
  secondaryVital: VitalSignType;
  correlationType: string;
  description: string;
  clinicalSignificance: string;
}

export interface NEWS2Score {
  patientId: string;
  timestamp: string;
  respiratoryRateScore: number;
  spo2Score: number;
  systolicBPScore: number;
  heartRateScore: number;
  temperatureScore: number;
  consciousnessScore: number; // Always 0 in simulation (Alert)
  supplementalO2Score: number; // Always 0 in simulation (no O2)
  aggregateScore: number;
  clinicalRisk: ClinicalRisk;
  recommendedResponse: string;
  individualScores: Record<string, number>;
}

export interface VitalAlert {
  id: string;
  patientId: string;
  timestamp: string;
  level: AlertLevel;
  vitalType: VitalSignType;
  message: string;
  currentValue: number;
  secondaryValue?: number;
  threshold: { min: number; max: number };
  acknowledged: boolean;
  news2Score?: number;
}

export interface PatientVitalsSummary {
  patientId: string;
  profile: PatientProfile;
  latestReadings: Record<string, VitalSignReading>;
  baselines: PersonalizedBaseline[];
  trends: TrendAnalysis[];
  correlations: VitalCorrelation[];
  currentNEWS2: NEWS2Score;
  activeAlerts: VitalAlert[];
  readingCount: number;
}

// ============================================================================
// Deterministic Seeded RNG
// ============================================================================

class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a pseudo-random float in [0, 1) */
  next(): number {
    // xorshift32
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return ((this.state >>> 0) % 10000) / 10000;
  }

  /** Returns a float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns an integer in [min, max] inclusive */
  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Returns a value from a normal distribution with given mean and stdDev */
  gaussian(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = this.next() || 0.0001; // avoid log(0)
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  /** Picks a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// ============================================================================
// Reference Ranges
// ============================================================================

const POPULATION_NORMAL_RANGES: Record<string, NormalRange> = {
  [VitalSignType.HEART_RATE]: { min: 60, max: 100, unit: 'bpm' },
  [VitalSignType.BLOOD_PRESSURE]: { min: 90, max: 140, unit: 'mmHg', secondaryMin: 60, secondaryMax: 90 },
  [VitalSignType.TEMPERATURE]: { min: 36.1, max: 37.2, unit: '°C' },
  [VitalSignType.RESPIRATORY_RATE]: { min: 12, max: 20, unit: 'breaths/min' },
  [VitalSignType.SPO2]: { min: 95, max: 100, unit: '%' },
  [VitalSignType.WEIGHT]: { min: 40, max: 150, unit: 'kg' },
  [VitalSignType.BLOOD_GLUCOSE]: { min: 70, max: 140, unit: 'mg/dL' },
};

const NEWS2_CLINICAL_RESPONSES: Record<string, string> = {
  [ClinicalRisk.LOW]:
    'Continue routine monitoring. Minimum 12-hourly observations.',
  [ClinicalRisk.LOW_MEDIUM]:
    'Increase monitoring frequency to minimum 4-6 hourly. Inform registered nurse who must assess the patient. Registered nurse to decide whether increased frequency of monitoring and/or escalation of care is required.',
  [ClinicalRisk.MEDIUM]:
    'Increase monitoring frequency to minimum 1-hourly. Urgent assessment by ward-based doctor or acute team nurse. Consider whether escalation of care to team with critical-care competencies is required.',
  [ClinicalRisk.HIGH]:
    'Continuous monitoring of vital signs. Emergency assessment by clinical/critical care team. Consider transfer to Level 2 or 3 care environment. Clinical alert to senior medical staff.',
};

// ============================================================================
// NEWS2 Scoring Implementation
// ============================================================================

function scoreRespiratoryRate(rate: number): number {
  if (rate <= 8) return 3;
  if (rate <= 11) return 1;
  if (rate <= 20) return 0;
  if (rate <= 24) return 2;
  return 3; // >= 25
}

function scoreSpo2Scale1(spo2: number): number {
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0; // >= 96
}

function scoreSystolicBP(systolic: number): number {
  if (systolic <= 90) return 3;
  if (systolic <= 100) return 2;
  if (systolic <= 110) return 1;
  if (systolic <= 219) return 0;
  return 3; // >= 220
}

function scoreHeartRate(hr: number): number {
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3; // >= 131
}

function scoreTemperature(temp: number): number {
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2; // >= 39.1
}

function classifyNEWS2Risk(aggregateScore: number, hasScore3InAnySingle: boolean): ClinicalRisk {
  if (aggregateScore >= 7) return ClinicalRisk.HIGH;
  if (hasScore3InAnySingle) return ClinicalRisk.LOW_MEDIUM;
  if (aggregateScore >= 5) return ClinicalRisk.MEDIUM;
  if (aggregateScore >= 1) return ClinicalRisk.LOW_MEDIUM;
  return ClinicalRisk.LOW;
}

// ============================================================================
// Circadian & Physiological Pattern Generators
// ============================================================================

/**
 * Returns a circadian multiplier based on hour of day.
 * Heart rate, BP, and temperature follow circadian rhythms:
 * - Lowest around 03:00-05:00
 * - Rising after wake (~06:00)
 * - Peak activity mid-afternoon (~14:00-16:00)
 * - Gradual decline in evening
 */
function circadianFactor(hourOfDay: number): number {
  // Smooth sinusoidal approximation: nadir at 04:00, peak at 16:00
  const radians = ((hourOfDay - 4) / 24) * 2 * Math.PI;
  return 0.5 + 0.5 * Math.sin(radians); // range: 0.0 to 1.0
}

/**
 * Simulates a post-operative recovery trajectory.
 * Vitals are slightly elevated in the first few days post-surgery and
 * gradually normalize over ~14 days.
 */
function postOpRecoveryFactor(daysSinceSurgery: number): number {
  if (daysSinceSurgery < 0) return 0;
  if (daysSinceSurgery > 14) return 0;
  // Exponential decay: strong effect on day 0-3, minimal by day 14
  return Math.exp(-daysSinceSurgery / 4);
}

/**
 * Simulates an exercise response spike.
 * Returns an elevated factor for a short duration around certain hours.
 */
function exerciseResponseFactor(hourOfDay: number, patientSeed: number): number {
  // Each patient exercises at a slightly different time, typically 07:00-18:00
  const exerciseHour = 7 + (patientSeed % 12);
  const diff = Math.abs(hourOfDay - exerciseHour);
  if (diff <= 1) {
    // During and shortly after exercise: elevated vitals
    return 0.3 * (1 - diff);
  }
  return 0;
}

// ============================================================================
// Data Generation Engine
// ============================================================================

interface AnomalyEvent {
  startDay: number;
  durationHours: number;
  type: AnomalyType;
}

function generateAnomaliesForPatient(rng: SeededRNG, dayCount: number): AnomalyEvent[] {
  const anomalies: AnomalyEvent[] = [];
  const anomalyTypes: AnomalyType[] = [
    AnomalyType.FEVER,
    AnomalyType.TACHYCARDIA,
    AnomalyType.HYPERTENSION,
    AnomalyType.HYPOTENSION,
    AnomalyType.HYPOXIA,
    AnomalyType.TACHYPNEA,
    AnomalyType.HYPERGLYCEMIA,
  ];

  // Each patient has 0-3 anomaly events in 30 days
  const numAnomalies = rng.intRange(0, 3);
  for (let i = 0; i < numAnomalies; i++) {
    anomalies.push({
      startDay: rng.intRange(3, dayCount - 2), // Avoid calibration period and last day
      durationHours: rng.intRange(8, 48),
      type: rng.pick(anomalyTypes),
    });
  }
  return anomalies;
}

function isInAnomalyWindow(
  anomalies: AnomalyEvent[],
  day: number,
  hourOfDay: number,
): AnomalyType {
  for (const anomaly of anomalies) {
    const anomalyStartHour = anomaly.startDay * 24;
    const currentHour = day * 24 + hourOfDay;
    if (
      currentHour >= anomalyStartHour &&
      currentHour < anomalyStartHour + anomaly.durationHours
    ) {
      return anomaly.type;
    }
  }
  return AnomalyType.NONE;
}

function applyAnomalyToVitals(
  baseHR: number,
  baseSystolic: number,
  baseDiastolic: number,
  baseTemp: number,
  baseRR: number,
  baseSpo2: number,
  baseGlucose: number,
  anomaly: AnomalyType,
): {
  hr: number;
  systolic: number;
  diastolic: number;
  temp: number;
  rr: number;
  spo2: number;
  glucose: number;
} {
  let hr = baseHR;
  let systolic = baseSystolic;
  let diastolic = baseDiastolic;
  let temp = baseTemp;
  let rr = baseRR;
  let spo2 = baseSpo2;
  let glucose = baseGlucose;

  switch (anomaly) {
    case AnomalyType.FEVER:
      temp += 1.5; // ~38.5-39°C
      hr += 15;    // Compensatory tachycardia
      rr += 4;
      break;
    case AnomalyType.TACHYCARDIA:
      hr += 35;    // 110-135+ bpm
      systolic += 10;
      break;
    case AnomalyType.BRADYCARDIA:
      hr -= 25;    // 40-50 bpm
      break;
    case AnomalyType.HYPERTENSION:
      systolic += 40;  // 160+ systolic
      diastolic += 20; // 100+ diastolic
      hr += 5;
      break;
    case AnomalyType.HYPOTENSION:
      systolic -= 30;  // <90 systolic
      diastolic -= 15;
      hr += 20;        // Compensatory tachycardia
      break;
    case AnomalyType.HYPOXIA:
      spo2 -= 8;       // 88-92%
      rr += 8;         // Compensatory tachypnea
      hr += 10;
      break;
    case AnomalyType.TACHYPNEA:
      rr += 10;        // 22-30 breaths/min
      hr += 5;
      break;
    case AnomalyType.HYPERGLYCEMIA:
      glucose += 120;  // 190-260+ mg/dL
      break;
    case AnomalyType.HYPOGLYCEMIA:
      glucose -= 40;   // 30-50 mg/dL
      hr += 10;        // Sympathetic response
      break;
    default:
      break;
  }

  return { hr, systolic, diastolic, temp, rr, spo2, glucose };
}

function generatePatientProfile(patientIndex: number, rng: SeededRNG): PatientProfile {
  const age = rng.intRange(25, 85);
  const genderOptions: Gender[] = [Gender.MALE, Gender.FEMALE, Gender.OTHER];
  const gender = rng.pick(genderOptions);

  const possibleComorbidities = [
    'hypertension', 'diabetes_type2', 'copd', 'heart_failure',
    'atrial_fibrillation', 'obesity', 'chronic_kidney_disease', 'asthma',
  ];
  const numComorbidities = rng.intRange(0, 3);
  const comorbidities: string[] = [];
  const shuffled = [...possibleComorbidities];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (let i = 0; i < numComorbidities; i++) {
    comorbidities.push(shuffled[i]);
  }

  const isDiabetic = comorbidities.includes('diabetes_type2') || rng.next() < 0.15;
  const isPostOperative = rng.next() < 0.6; // 60% of patients are post-op

  // Admission date: between 1 and 35 days ago
  const daysAgo = rng.intRange(30, 35);
  const admissionDate = new Date(2026, 0, 12 - daysAgo); // Relative to ~Jan 12 2026

  let surgeryDate: string | undefined;
  if (isPostOperative) {
    const surgeryDaysAgo = daysAgo - rng.intRange(0, 2); // Surgery around admission
    const sd = new Date(2026, 0, 12 - surgeryDaysAgo);
    surgeryDate = sd.toISOString();
  }

  return {
    patientId: `patient-vs-${String(patientIndex + 1).padStart(3, '0')}`,
    age,
    gender,
    comorbidities,
    isDiabetic,
    isPostOperative,
    surgeryDate,
    admissionDate: admissionDate.toISOString(),
  };
}

function adjustBaselineForProfile(
  profile: PatientProfile,
  rng: SeededRNG,
): {
  hrBase: number;
  systolicBase: number;
  diastolicBase: number;
  tempBase: number;
  rrBase: number;
  spo2Base: number;
  weightBase: number;
  glucoseBase: number;
} {
  // Start with population midpoints
  let hrBase = rng.gaussian(75, 6);
  let systolicBase = rng.gaussian(118, 8);
  let diastolicBase = rng.gaussian(76, 5);
  let tempBase = rng.gaussian(36.65, 0.2);
  let rrBase = rng.gaussian(16, 1.5);
  let spo2Base = rng.gaussian(97.5, 0.8);
  let weightBase = rng.gaussian(75, 12);
  let glucoseBase = rng.gaussian(95, 10);

  // Age adjustments
  if (profile.age > 65) {
    hrBase += 3;
    systolicBase += 12;
    diastolicBase += 5;
    spo2Base -= 1;
    rrBase += 1;
  } else if (profile.age < 40) {
    hrBase -= 3;
    systolicBase -= 5;
  }

  // Gender adjustments
  if (profile.gender === Gender.FEMALE) {
    hrBase += 3;
    systolicBase -= 5;
    weightBase -= 10;
  }

  // Comorbidity adjustments
  if (profile.comorbidities.includes('hypertension')) {
    systolicBase += 15;
    diastolicBase += 8;
  }
  if (profile.comorbidities.includes('copd')) {
    spo2Base -= 3;
    rrBase += 3;
  }
  if (profile.comorbidities.includes('heart_failure')) {
    hrBase += 8;
    rrBase += 2;
  }
  if (profile.comorbidities.includes('atrial_fibrillation')) {
    hrBase += 10;
  }
  if (profile.comorbidities.includes('obesity')) {
    weightBase += 25;
    systolicBase += 5;
  }
  if (profile.comorbidities.includes('asthma')) {
    rrBase += 1;
  }

  // Diabetic glucose adjustment
  if (profile.isDiabetic) {
    glucoseBase += 30;
  }

  // Clamp to physiologically plausible ranges
  hrBase = Math.max(50, Math.min(110, hrBase));
  systolicBase = Math.max(85, Math.min(170, systolicBase));
  diastolicBase = Math.max(55, Math.min(100, diastolicBase));
  tempBase = Math.max(35.8, Math.min(37.5, tempBase));
  rrBase = Math.max(10, Math.min(24, rrBase));
  spo2Base = Math.max(88, Math.min(100, spo2Base));
  weightBase = Math.max(40, Math.min(180, weightBase));
  glucoseBase = Math.max(70, Math.min(200, glucoseBase));

  return {
    hrBase, systolicBase, diastolicBase, tempBase,
    rrBase, spo2Base, weightBase, glucoseBase,
  };
}

function generateVitalReadings(
  profile: PatientProfile,
  baselines: ReturnType<typeof adjustBaselineForProfile>,
  anomalies: AnomalyEvent[],
  dayCount: number,
  readingsPerDay: number,
  rng: SeededRNG,
): VitalSignReading[] {
  const readings: VitalSignReading[] = [];
  const intervalHours = 24 / readingsPerDay; // 4 hours
  const admissionDate = new Date(profile.admissionDate);
  const patientSeed = parseInt(profile.patientId.replace(/\D/g, ''), 10) || 1;

  let surgeryDayOffset = -1;
  if (profile.isPostOperative && profile.surgeryDate) {
    const surgeryDate = new Date(profile.surgeryDate);
    surgeryDayOffset = Math.round(
      (surgeryDate.getTime() - admissionDate.getTime()) / (86400000),
    );
  }

  for (let day = 0; day < dayCount; day++) {
    for (let readingIdx = 0; readingIdx < readingsPerDay; readingIdx++) {
      const hourOfDay = readingIdx * intervalHours;
      const readingDate = new Date(admissionDate);
      readingDate.setDate(readingDate.getDate() + day);
      readingDate.setHours(Math.floor(hourOfDay), (hourOfDay % 1) * 60, 0, 0);

      const timestamp = readingDate.toISOString();
      const readingNumber = day * readingsPerDay + readingIdx;

      // Circadian adjustment: scale around baseline
      const circadian = circadianFactor(hourOfDay);
      const circadianHR = (circadian - 0.5) * 10;        // +/- 5 bpm
      const circadianBP = (circadian - 0.5) * 8;         // +/- 4 mmHg
      const circadianTemp = (circadian - 0.5) * 0.4;     // +/- 0.2°C
      const circadianRR = (circadian - 0.5) * 3;         // +/- 1.5 breaths

      // Post-operative recovery factor
      let postOpHR = 0;
      let postOpBP = 0;
      let postOpTemp = 0;
      let postOpRR = 0;
      if (profile.isPostOperative && surgeryDayOffset >= 0) {
        const daysSinceSurgery = day - surgeryDayOffset;
        const recovery = postOpRecoveryFactor(daysSinceSurgery);
        postOpHR = recovery * 12;      // +12 bpm immediately post-op
        postOpBP = recovery * 10;      // +10 mmHg
        postOpTemp = recovery * 0.5;   // +0.5°C low-grade fever
        postOpRR = recovery * 4;       // +4 breaths/min
      }

      // Exercise response
      const exercise = exerciseResponseFactor(hourOfDay, patientSeed);
      const exerciseHR = exercise * 40;
      const exerciseBP = exercise * 15;
      const exerciseRR = exercise * 6;

      // Random physiological noise
      const noiseHR = rng.gaussian(0, 3);
      const noiseSystolic = rng.gaussian(0, 4);
      const noiseDiastolic = rng.gaussian(0, 3);
      const noiseTemp = rng.gaussian(0, 0.1);
      const noiseRR = rng.gaussian(0, 1);
      const noiseSpo2 = rng.gaussian(0, 0.5);
      const noiseGlucose = rng.gaussian(0, 8);

      // Compute base values with all factors
      let hr = baselines.hrBase + circadianHR + postOpHR + exerciseHR + noiseHR;
      let systolic = baselines.systolicBase + circadianBP + postOpBP + exerciseBP + noiseSystolic;
      let diastolic = baselines.diastolicBase + circadianBP * 0.6 + postOpBP * 0.5 + noiseDiastolic;
      let temp = baselines.tempBase + circadianTemp + postOpTemp + noiseTemp;
      let rr = baselines.rrBase + circadianRR + postOpRR + exerciseRR + noiseRR;
      let spo2 = baselines.spo2Base + noiseSpo2 - exercise * 2;
      let glucose = baselines.glucoseBase + noiseGlucose;
      const weight = baselines.weightBase + rng.gaussian(0, 0.3); // Small daily fluctuation

      // Check for anomaly window
      const anomaly = isInAnomalyWindow(anomalies, day, hourOfDay);
      if (anomaly !== AnomalyType.NONE) {
        const adjusted = applyAnomalyToVitals(
          hr, systolic, diastolic, temp, rr, spo2, glucose, anomaly,
        );
        hr = adjusted.hr;
        systolic = adjusted.systolic;
        diastolic = adjusted.diastolic;
        temp = adjusted.temp;
        rr = adjusted.rr;
        spo2 = adjusted.spo2;
        glucose = adjusted.glucose;
      }

      // Clamp to physiological limits
      hr = Math.max(30, Math.min(200, Math.round(hr)));
      systolic = Math.max(60, Math.min(250, Math.round(systolic)));
      diastolic = Math.max(30, Math.min(150, Math.round(diastolic)));
      temp = Math.max(34, Math.min(42, Math.round(temp * 10) / 10));
      rr = Math.max(6, Math.min(45, Math.round(rr)));
      spo2 = Math.max(70, Math.min(100, Math.round(spo2)));
      glucose = Math.max(30, Math.min(400, Math.round(glucose)));

      const baseId = `vs-${profile.patientId}-${readingNumber}`;

      // Heart rate
      readings.push({
        id: `${baseId}-hr`,
        patientId: profile.patientId,
        timestamp,
        type: VitalSignType.HEART_RATE,
        value: hr,
        unit: 'bpm',
        source: 'simulated',
        anomaly: anomaly !== AnomalyType.NONE ? anomaly : undefined,
      });

      // Blood pressure
      readings.push({
        id: `${baseId}-bp`,
        patientId: profile.patientId,
        timestamp,
        type: VitalSignType.BLOOD_PRESSURE,
        value: systolic,
        secondaryValue: diastolic,
        unit: 'mmHg',
        source: 'simulated',
        anomaly: anomaly !== AnomalyType.NONE ? anomaly : undefined,
      });

      // Temperature
      readings.push({
        id: `${baseId}-temp`,
        patientId: profile.patientId,
        timestamp,
        type: VitalSignType.TEMPERATURE,
        value: temp,
        unit: '°C',
        source: 'simulated',
        anomaly: anomaly !== AnomalyType.NONE ? anomaly : undefined,
      });

      // Respiratory rate
      readings.push({
        id: `${baseId}-rr`,
        patientId: profile.patientId,
        timestamp,
        type: VitalSignType.RESPIRATORY_RATE,
        value: rr,
        unit: 'breaths/min',
        source: 'simulated',
        anomaly: anomaly !== AnomalyType.NONE ? anomaly : undefined,
      });

      // SpO2
      readings.push({
        id: `${baseId}-spo2`,
        patientId: profile.patientId,
        timestamp,
        type: VitalSignType.SPO2,
        value: spo2,
        unit: '%',
        source: 'simulated',
        anomaly: anomaly !== AnomalyType.NONE ? anomaly : undefined,
      });

      // Weight (only once per day, at the first reading)
      if (readingIdx === 0) {
        readings.push({
          id: `${baseId}-wt`,
          patientId: profile.patientId,
          timestamp,
          type: VitalSignType.WEIGHT,
          value: Math.round(weight * 10) / 10,
          unit: 'kg',
          source: 'simulated',
        });
      }

      // Blood glucose (only for diabetic patients, 3x/day)
      if (profile.isDiabetic && readingIdx % 2 === 0) {
        readings.push({
          id: `${baseId}-bg`,
          patientId: profile.patientId,
          timestamp,
          type: VitalSignType.BLOOD_GLUCOSE,
          value: glucose,
          unit: 'mg/dL',
          source: 'simulated',
          anomaly: anomaly !== AnomalyType.NONE ? anomaly : undefined,
        });
      }
    }
  }

  return readings;
}

// ============================================================================
// Vital Signs Monitor Service
// ============================================================================

export class VitalSignsMonitor {
  private readings: Map<string, VitalSignReading[]> = new Map();
  private profiles: Map<string, PatientProfile> = new Map();
  private baselines: Map<string, PersonalizedBaseline[]> = new Map();
  private alerts: Map<string, VitalAlert[]> = new Map();
  private alertCounter = 0;
  private dataGenerated = false;

  // --------------------------------------------------------------------------
  // Initialization & Data Generation
  // --------------------------------------------------------------------------

  /**
   * Generate realistic datasets for the given number of patients.
   * Each patient gets 30 days of vital signs at 4-hour intervals (6 readings/day).
   */
  generateDataset(
    patientCount: number = 50,
    dayCount: number = 30,
    readingsPerDay: number = 6,
  ): void {
    console.log(
      `[VitalSignsMonitor] Generating dataset: ${patientCount} patients, ` +
      `${dayCount} days, ${readingsPerDay} readings/day`,
    );

    this.readings.clear();
    this.profiles.clear();
    this.baselines.clear();
    this.alerts.clear();
    this.alertCounter = 0;

    for (let i = 0; i < patientCount; i++) {
      const rng = new SeededRNG(42 + i * 1337);
      const profile = generatePatientProfile(i, rng);
      const baseValues = adjustBaselineForProfile(profile, rng);
      const anomalies = generateAnomaliesForPatient(rng, dayCount);

      const patientReadings = generateVitalReadings(
        profile, baseValues, anomalies, dayCount, readingsPerDay, rng,
      );

      this.profiles.set(profile.patientId, profile);
      this.readings.set(profile.patientId, patientReadings);

      // Calibrate baselines from first 3 days
      const calibrated = this.calibrateBaselines(profile.patientId, 3, readingsPerDay);
      this.baselines.set(profile.patientId, calibrated);

      // Generate alerts for the entire dataset
      const patientAlerts = this.evaluateAllReadings(profile.patientId);
      this.alerts.set(profile.patientId, patientAlerts);
    }

    this.dataGenerated = true;
    console.log(
      `[VitalSignsMonitor] Dataset generated. Total readings: ${this.getTotalReadingCount()}`,
    );
  }

  /**
   * Lazily initialize the dataset on first access.
   */
  private ensureDataGenerated(): void {
    if (!this.dataGenerated) {
      this.generateDataset();
    }
  }

  // --------------------------------------------------------------------------
  // Smart Baselines
  // --------------------------------------------------------------------------

  /**
   * Learn patient-specific baselines from the first N days of data.
   * Separates resting (00:00-06:00, 22:00-24:00) from active (06:00-22:00) periods.
   */
  private calibrateBaselines(
    patientId: string,
    calibrationDays: number,
    readingsPerDay: number,
  ): PersonalizedBaseline[] {
    const patientReadings = this.readings.get(patientId);
    if (!patientReadings) return [];

    const calibrationCount = calibrationDays * readingsPerDay;
    // Take only the first N readings (calibration period)
    const calibrationReadings = patientReadings.slice(0, calibrationCount * 7); // ~7 types per slot

    const vitalTypes: VitalSignType[] = [
      VitalSignType.HEART_RATE,
      VitalSignType.BLOOD_PRESSURE,
      VitalSignType.TEMPERATURE,
      VitalSignType.RESPIRATORY_RATE,
      VitalSignType.SPO2,
    ];

    const profile = this.profiles.get(patientId);
    const baselines: PersonalizedBaseline[] = [];

    for (const vitalType of vitalTypes) {
      const typeReadings = calibrationReadings.filter(r => r.type === vitalType);

      const restingReadings = typeReadings.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour < 6 || hour >= 22;
      });

      const activeReadings = typeReadings.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= 6 && hour < 22;
      });

      const computeRange = (readings: VitalSignReading[]): NormalRange => {
        if (readings.length === 0) {
          const popRange = POPULATION_NORMAL_RANGES[vitalType];
          return { ...popRange };
        }

        const values = readings.map(r => r.value);
        const mean = values.reduce((s, v) => s + v, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length,
        );

        const range: NormalRange = {
          min: Math.round((mean - 2 * stdDev) * 10) / 10,
          max: Math.round((mean + 2 * stdDev) * 10) / 10,
          unit: POPULATION_NORMAL_RANGES[vitalType].unit,
        };

        // Blood pressure secondary values
        if (vitalType === VitalSignType.BLOOD_PRESSURE) {
          const secondaryValues = readings
            .filter(r => r.secondaryValue !== undefined)
            .map(r => r.secondaryValue as number);
          if (secondaryValues.length > 0) {
            const sMean = secondaryValues.reduce((s, v) => s + v, 0) / secondaryValues.length;
            const sStdDev = Math.sqrt(
              secondaryValues.reduce((s, v) => s + (v - sMean) ** 2, 0) / secondaryValues.length,
            );
            range.secondaryMin = Math.round((sMean - 2 * sStdDev) * 10) / 10;
            range.secondaryMax = Math.round((sMean + 2 * sStdDev) * 10) / 10;
          }
        }

        return range;
      };

      const restingRange = computeRange(restingReadings);
      const activeRange = computeRange(activeReadings);

      // Age/comorbidity adjustments to widen acceptable ranges
      if (profile && profile.age > 70) {
        restingRange.min -= 2;
        restingRange.max += 2;
        activeRange.min -= 2;
        activeRange.max += 2;
      }

      baselines.push({
        patientId,
        vitalType,
        restingRange,
        activeRange,
        calibrationReadings: typeReadings.length,
        isCalibrated: typeReadings.length >= 6, // At least 6 readings
        lastUpdated: new Date().toISOString(),
      });
    }

    return baselines;
  }

  // --------------------------------------------------------------------------
  // Trend Analysis
  // --------------------------------------------------------------------------

  /**
   * Calculate moving averages over 4h, 12h, and 24h windows.
   */
  calculateTrends(patientId: string, vitalType: VitalSignType): TrendAnalysis {
    this.ensureDataGenerated();

    const patientReadings = this.readings.get(patientId) ?? [];
    const typeReadings = patientReadings
      .filter(r => r.type === vitalType)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (typeReadings.length < 2) {
      return {
        vitalType,
        direction: TrendDirection.STABLE,
        movingAverage4h: 0,
        movingAverage12h: 0,
        movingAverage24h: 0,
        rateOfChange: 0,
        rateOfChangePercent: 0,
        dataPoints: typeReadings.length,
      };
    }

    const latestTimestamp = new Date(typeReadings[typeReadings.length - 1].timestamp).getTime();

    const computeMA = (windowHours: number): number => {
      const windowMs = windowHours * 3600000;
      const windowReadings = typeReadings.filter(
        r => latestTimestamp - new Date(r.timestamp).getTime() <= windowMs,
      );
      if (windowReadings.length === 0) return 0;
      return (
        Math.round(
          (windowReadings.reduce((s, r) => s + r.value, 0) / windowReadings.length) * 10,
        ) / 10
      );
    };

    const ma4h = computeMA(4);
    const ma12h = computeMA(12);
    const ma24h = computeMA(24);

    // Rate of change: compare last 6 hours vs previous 6 hours
    const sixHoursMs = 6 * 3600000;
    const recentReadings = typeReadings.filter(
      r => latestTimestamp - new Date(r.timestamp).getTime() <= sixHoursMs,
    );
    const previousReadings = typeReadings.filter(r => {
      const t = new Date(r.timestamp).getTime();
      return latestTimestamp - t > sixHoursMs && latestTimestamp - t <= 2 * sixHoursMs;
    });

    let rateOfChange = 0;
    let rateOfChangePercent = 0;

    if (recentReadings.length > 0 && previousReadings.length > 0) {
      const recentAvg = recentReadings.reduce((s, r) => s + r.value, 0) / recentReadings.length;
      const previousAvg =
        previousReadings.reduce((s, r) => s + r.value, 0) / previousReadings.length;
      const timeDiffHours = 6;
      rateOfChange = Math.round(((recentAvg - previousAvg) / timeDiffHours) * 100) / 100;
      rateOfChangePercent =
        previousAvg !== 0
          ? Math.round(((recentAvg - previousAvg) / previousAvg) * 10000) / 100
          : 0;
    }

    // Determine trend direction based on 24h slope
    const ma24hOlder = this.computeOlderMA(typeReadings, latestTimestamp, 24, 24);
    let direction: TrendDirection = TrendDirection.STABLE;

    if (ma24h > 0 && ma24hOlder > 0) {
      const changePct = ((ma24h - ma24hOlder) / ma24hOlder) * 100;

      // Determine if increase is improving or worsening based on vital type
      const isHighBad =
        vitalType === VitalSignType.HEART_RATE ||
        vitalType === VitalSignType.BLOOD_PRESSURE ||
        vitalType === VitalSignType.RESPIRATORY_RATE ||
        vitalType === VitalSignType.BLOOD_GLUCOSE;
      const isHighGood = vitalType === VitalSignType.SPO2;

      if (Math.abs(changePct) < 2) {
        direction = TrendDirection.STABLE;
      } else if (changePct > 0) {
        direction = isHighGood
          ? TrendDirection.IMPROVING
          : isHighBad
          ? TrendDirection.WORSENING
          : TrendDirection.STABLE;
      } else {
        direction = isHighGood
          ? TrendDirection.WORSENING
          : isHighBad
          ? TrendDirection.IMPROVING
          : TrendDirection.STABLE;
      }
    }

    return {
      vitalType,
      direction,
      movingAverage4h: ma4h,
      movingAverage12h: ma12h,
      movingAverage24h: ma24h,
      rateOfChange,
      rateOfChangePercent,
      dataPoints: typeReadings.length,
    };
  }

  /**
   * Compute a moving average over a window that ended `offsetHours` ago.
   */
  private computeOlderMA(
    readings: VitalSignReading[],
    latestMs: number,
    windowHours: number,
    offsetHours: number,
  ): number {
    const offsetMs = offsetHours * 3600000;
    const windowMs = windowHours * 3600000;
    const windowEnd = latestMs - offsetMs;
    const windowStart = windowEnd - windowMs;
    const windowReadings = readings.filter(r => {
      const t = new Date(r.timestamp).getTime();
      return t >= windowStart && t <= windowEnd;
    });
    if (windowReadings.length === 0) return 0;
    return windowReadings.reduce((s, r) => s + r.value, 0) / windowReadings.length;
  }

  /**
   * Detect correlations between vital signs (e.g., fever + elevated HR).
   */
  detectCorrelations(patientId: string): VitalCorrelation[] {
    this.ensureDataGenerated();

    const correlations: VitalCorrelation[] = [];
    const patientReadings = this.readings.get(patientId) ?? [];

    // Group readings by timestamp (within 5 minutes)
    const timeGroups = new Map<string, VitalSignReading[]>();
    for (const reading of patientReadings) {
      // Round to nearest 5-minute window
      const date = new Date(reading.timestamp);
      const roundedMs = Math.round(date.getTime() / 300000) * 300000;
      const key = new Date(roundedMs).toISOString();
      const group = timeGroups.get(key) ?? [];
      group.push(reading);
      timeGroups.set(key, group);
    }

    // Check for fever + tachycardia correlation
    let feverTachyCount = 0;
    let feverCount = 0;
    for (const group of timeGroups.values()) {
      const tempReading = group.find(r => r.type === VitalSignType.TEMPERATURE);
      const hrReading = group.find(r => r.type === VitalSignType.HEART_RATE);
      if (tempReading && tempReading.value > 38.0) {
        feverCount++;
        if (hrReading && hrReading.value > 100) {
          feverTachyCount++;
        }
      }
    }
    if (feverCount > 0 && feverTachyCount / feverCount > 0.5) {
      correlations.push({
        primaryVital: VitalSignType.TEMPERATURE,
        secondaryVital: VitalSignType.HEART_RATE,
        correlationType: 'fever_tachycardia',
        description:
          'Elevated temperature correlated with elevated heart rate in ' +
          `${Math.round((feverTachyCount / feverCount) * 100)}% of fever episodes`,
        clinicalSignificance:
          'Expected physiological response. Heart rate increases ~10 bpm per 1°C fever. ' +
          'Consider infection workup if persistent.',
      });
    }

    // Check for hypoxia + tachypnea correlation
    let hypoxiaTachypneaCount = 0;
    let hypoxiaCount = 0;
    for (const group of timeGroups.values()) {
      const spo2Reading = group.find(r => r.type === VitalSignType.SPO2);
      const rrReading = group.find(r => r.type === VitalSignType.RESPIRATORY_RATE);
      if (spo2Reading && spo2Reading.value < 93) {
        hypoxiaCount++;
        if (rrReading && rrReading.value > 22) {
          hypoxiaTachypneaCount++;
        }
      }
    }
    if (hypoxiaCount > 0 && hypoxiaTachypneaCount / hypoxiaCount > 0.5) {
      correlations.push({
        primaryVital: VitalSignType.SPO2,
        secondaryVital: VitalSignType.RESPIRATORY_RATE,
        correlationType: 'hypoxia_tachypnea',
        description:
          'Low oxygen saturation correlated with elevated respiratory rate in ' +
          `${Math.round((hypoxiaTachypneaCount / hypoxiaCount) * 100)}% of hypoxic episodes`,
        clinicalSignificance:
          'Compensatory tachypnea due to hypoxemia. Assess for pneumonia, ' +
          'PE, atelectasis, or bronchospasm.',
      });
    }

    // Check for hypotension + tachycardia correlation
    let hypoTachyCount = 0;
    let hypoCount = 0;
    for (const group of timeGroups.values()) {
      const bpReading = group.find(r => r.type === VitalSignType.BLOOD_PRESSURE);
      const hrReading = group.find(r => r.type === VitalSignType.HEART_RATE);
      if (bpReading && bpReading.value < 90) {
        hypoCount++;
        if (hrReading && hrReading.value > 100) {
          hypoTachyCount++;
        }
      }
    }
    if (hypoCount > 0 && hypoTachyCount / hypoCount > 0.5) {
      correlations.push({
        primaryVital: VitalSignType.BLOOD_PRESSURE,
        secondaryVital: VitalSignType.HEART_RATE,
        correlationType: 'hypotension_tachycardia',
        description:
          'Low blood pressure correlated with elevated heart rate in ' +
          `${Math.round((hypoTachyCount / hypoCount) * 100)}% of hypotensive episodes`,
        clinicalSignificance:
          'Compensatory tachycardia due to hypotension. Assess for hypovolemia, ' +
          'hemorrhage, sepsis, or cardiac dysfunction.',
      });
    }

    return correlations;
  }

  // --------------------------------------------------------------------------
  // NEWS2 Scoring
  // --------------------------------------------------------------------------

  /**
   * Calculate NEWS2 score from the latest vital sign readings for a patient.
   */
  calculateNEWS2(patientId: string): NEWS2Score {
    this.ensureDataGenerated();

    const patientReadings = this.readings.get(patientId) ?? [];

    // Get the latest reading of each type
    const latestByType = new Map<string, VitalSignReading>();
    for (const reading of patientReadings) {
      const existing = latestByType.get(reading.type);
      if (
        !existing ||
        new Date(reading.timestamp).getTime() > new Date(existing.timestamp).getTime()
      ) {
        latestByType.set(reading.type, reading);
      }
    }

    const hrReading = latestByType.get(VitalSignType.HEART_RATE);
    const bpReading = latestByType.get(VitalSignType.BLOOD_PRESSURE);
    const tempReading = latestByType.get(VitalSignType.TEMPERATURE);
    const rrReading = latestByType.get(VitalSignType.RESPIRATORY_RATE);
    const spo2Reading = latestByType.get(VitalSignType.SPO2);

    const hrScore = hrReading ? scoreHeartRate(hrReading.value) : 0;
    const bpScore = bpReading ? scoreSystolicBP(bpReading.value) : 0;
    const tempScore = tempReading ? scoreTemperature(tempReading.value) : 0;
    const rrScore = rrReading ? scoreRespiratoryRate(rrReading.value) : 0;
    const spo2Score = spo2Reading ? scoreSpo2Scale1(spo2Reading.value) : 0;
    const consciousnessScore = 0; // Assumed Alert in simulation
    const supplementalO2Score = 0; // Assumed no supplemental O2

    const individualScores: Record<string, number> = {
      respiratoryRate: rrScore,
      spo2: spo2Score,
      systolicBP: bpScore,
      heartRate: hrScore,
      temperature: tempScore,
      consciousness: consciousnessScore,
      supplementalO2: supplementalO2Score,
    };

    const aggregateScore =
      hrScore + bpScore + tempScore + rrScore + spo2Score +
      consciousnessScore + supplementalO2Score;

    const hasScore3 = Object.values(individualScores).some(s => s === 3);
    const clinicalRisk = classifyNEWS2Risk(aggregateScore, hasScore3);
    const recommendedResponse = NEWS2_CLINICAL_RESPONSES[clinicalRisk];

    const latestTimestamp = patientReadings.length > 0
      ? patientReadings.reduce((latest, r) =>
          new Date(r.timestamp).getTime() > new Date(latest.timestamp).getTime() ? r : latest,
        ).timestamp
      : new Date().toISOString();

    return {
      patientId,
      timestamp: latestTimestamp,
      respiratoryRateScore: rrScore,
      spo2Score,
      systolicBPScore: bpScore,
      heartRateScore: hrScore,
      temperatureScore: tempScore,
      consciousnessScore,
      supplementalO2Score,
      aggregateScore,
      clinicalRisk,
      recommendedResponse,
      individualScores,
    };
  }

  /**
   * Calculate NEWS2 from a specific set of readings rather than stored data.
   */
  calculateNEWS2FromReadings(
    patientId: string,
    hr: number,
    systolicBP: number,
    temp: number,
    respiratoryRate: number,
    spo2: number,
  ): NEWS2Score {
    const hrScore = scoreHeartRate(hr);
    const bpScore = scoreSystolicBP(systolicBP);
    const tempScore = scoreTemperature(temp);
    const rrScore = scoreRespiratoryRate(respiratoryRate);
    const spo2Score2 = scoreSpo2Scale1(spo2);
    const consciousnessScore = 0;
    const supplementalO2Score = 0;

    const individualScores: Record<string, number> = {
      respiratoryRate: rrScore,
      spo2: spo2Score2,
      systolicBP: bpScore,
      heartRate: hrScore,
      temperature: tempScore,
      consciousness: consciousnessScore,
      supplementalO2: supplementalO2Score,
    };

    const aggregateScore =
      hrScore + bpScore + tempScore + rrScore + spo2Score2 +
      consciousnessScore + supplementalO2Score;

    const hasScore3 = Object.values(individualScores).some(s => s === 3);
    const clinicalRisk = classifyNEWS2Risk(aggregateScore, hasScore3);
    const recommendedResponse = NEWS2_CLINICAL_RESPONSES[clinicalRisk];

    return {
      patientId,
      timestamp: new Date().toISOString(),
      respiratoryRateScore: rrScore,
      spo2Score: spo2Score2,
      systolicBPScore: bpScore,
      heartRateScore: hrScore,
      temperatureScore: tempScore,
      consciousnessScore,
      supplementalO2Score,
      aggregateScore,
      clinicalRisk,
      recommendedResponse,
      individualScores,
    };
  }

  // --------------------------------------------------------------------------
  // Alert Engine
  // --------------------------------------------------------------------------

  /**
   * Evaluate all readings for a patient and generate alerts.
   */
  private evaluateAllReadings(patientId: string): VitalAlert[] {
    const patientReadings = this.readings.get(patientId) ?? [];
    const patientBaselines = this.baselines.get(patientId) ?? [];
    const alerts: VitalAlert[] = [];

    // Group readings by timestamp
    const timeGroups = new Map<string, VitalSignReading[]>();
    for (const reading of patientReadings) {
      const key = reading.timestamp;
      const group = timeGroups.get(key) ?? [];
      group.push(reading);
      timeGroups.set(key, group);
    }

    for (const [timestamp, group] of timeGroups.entries()) {
      const hour = new Date(timestamp).getHours();
      const timeOfDay: TimeOfDay = (hour >= 6 && hour < 22)
        ? TimeOfDay.ACTIVE
        : TimeOfDay.RESTING;

      for (const reading of group) {
        if (
          reading.type === VitalSignType.WEIGHT // Weight alerts handled separately
        ) {
          continue;
        }

        const baseline = patientBaselines.find(b => b.vitalType === reading.type);
        const range = baseline
          ? (timeOfDay === TimeOfDay.RESTING ? baseline.restingRange : baseline.activeRange)
          : POPULATION_NORMAL_RANGES[reading.type];

        if (!range) continue;

        const alert = this.evaluateReading(reading, range, timestamp);
        if (alert) {
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  /**
   * Evaluate a single reading against a range and generate an alert if needed.
   */
  private evaluateReading(
    reading: VitalSignReading,
    range: NormalRange,
    timestamp: string,
  ): VitalAlert | null {
    const value = reading.value;
    const { min, max } = range;

    let level: AlertLevel | null = null;
    let message = '';

    const deviationAbove = max > 0 ? ((value - max) / max) * 100 : 0;
    const deviationBelow = min > 0 ? ((min - value) / min) * 100 : 0;

    // Determine alert based on vital type and deviation
    switch (reading.type) {
      case VitalSignType.HEART_RATE:
        if (value > 130 || value < 40) {
          level = AlertLevel.EMERGENCY;
          message = value > 130
            ? `Heart rate critically elevated at ${value} bpm`
            : `Heart rate critically low at ${value} bpm`;
        } else if (value > 120 || value < 45) {
          level = AlertLevel.CRITICAL;
          message = value > 120
            ? `Heart rate significantly elevated at ${value} bpm`
            : `Heart rate significantly low at ${value} bpm`;
        } else if (value > max || value < min) {
          level = AlertLevel.WARNING;
          message = value > max
            ? `Heart rate elevated at ${value} bpm (baseline max: ${max})`
            : `Heart rate low at ${value} bpm (baseline min: ${min})`;
        }
        break;

      case VitalSignType.BLOOD_PRESSURE:
        if (value >= 180 || value <= 70) {
          level = AlertLevel.EMERGENCY;
          message = value >= 180
            ? `Systolic BP critically elevated at ${value}/${reading.secondaryValue ?? '?'} mmHg`
            : `Systolic BP critically low at ${value}/${reading.secondaryValue ?? '?'} mmHg`;
        } else if (value >= 160 || value <= 80) {
          level = AlertLevel.CRITICAL;
          message = value >= 160
            ? `Systolic BP significantly elevated at ${value}/${reading.secondaryValue ?? '?'} mmHg`
            : `Systolic BP significantly low at ${value}/${reading.secondaryValue ?? '?'} mmHg`;
        } else if (value > max || value < min) {
          level = AlertLevel.WARNING;
          message = value > max
            ? `Systolic BP elevated at ${value}/${reading.secondaryValue ?? '?'} mmHg`
            : `Systolic BP low at ${value}/${reading.secondaryValue ?? '?'} mmHg`;
        }
        break;

      case VitalSignType.TEMPERATURE:
        if (value >= 40.0 || value <= 34.5) {
          level = AlertLevel.EMERGENCY;
          message = value >= 40.0
            ? `Temperature critically elevated at ${value}°C (${this.celsiusToFahrenheit(value)}°F)`
            : `Temperature critically low at ${value}°C (${this.celsiusToFahrenheit(value)}°F)`;
        } else if (value >= 39.0 || value <= 35.0) {
          level = AlertLevel.CRITICAL;
          message = value >= 39.0
            ? `High fever at ${value}°C (${this.celsiusToFahrenheit(value)}°F)`
            : `Hypothermia at ${value}°C (${this.celsiusToFahrenheit(value)}°F)`;
        } else if (value > 38.0 || value < 36.0) {
          level = AlertLevel.WARNING;
          message = value > 38.0
            ? `Low-grade fever at ${value}°C (${this.celsiusToFahrenheit(value)}°F)`
            : `Below-normal temperature at ${value}°C (${this.celsiusToFahrenheit(value)}°F)`;
        } else if (value > max || value < min) {
          level = AlertLevel.INFO;
          message = `Temperature ${value}°C slightly outside baseline range (${min}-${max}°C)`;
        }
        break;

      case VitalSignType.RESPIRATORY_RATE:
        if (value >= 30 || value <= 7) {
          level = AlertLevel.EMERGENCY;
          message = value >= 30
            ? `Respiratory rate critically elevated at ${value} breaths/min`
            : `Respiratory rate critically low at ${value} breaths/min`;
        } else if (value >= 25 || value <= 9) {
          level = AlertLevel.CRITICAL;
          message = value >= 25
            ? `Respiratory rate significantly elevated at ${value} breaths/min`
            : `Respiratory rate significantly low at ${value} breaths/min`;
        } else if (value > max || value < min) {
          level = AlertLevel.WARNING;
          message = `Respiratory rate outside baseline at ${value} breaths/min`;
        }
        break;

      case VitalSignType.SPO2:
        if (value <= 85) {
          level = AlertLevel.EMERGENCY;
          message = `Oxygen saturation critically low at ${value}%`;
        } else if (value <= 90) {
          level = AlertLevel.CRITICAL;
          message = `Oxygen saturation dangerously low at ${value}%`;
        } else if (value <= 93) {
          level = AlertLevel.WARNING;
          message = `Oxygen saturation below normal at ${value}%`;
        } else if (value < min) {
          level = AlertLevel.INFO;
          message = `Oxygen saturation slightly below baseline at ${value}%`;
        }
        break;

      case VitalSignType.BLOOD_GLUCOSE:
        if (value >= 300 || value <= 40) {
          level = AlertLevel.EMERGENCY;
          message = value >= 300
            ? `Blood glucose critically elevated at ${value} mg/dL`
            : `Blood glucose critically low at ${value} mg/dL - treat immediately`;
        } else if (value >= 250 || value <= 54) {
          level = AlertLevel.CRITICAL;
          message = value >= 250
            ? `Blood glucose significantly elevated at ${value} mg/dL`
            : `Blood glucose dangerously low at ${value} mg/dL`;
        } else if (value >= 180 || value <= 70) {
          level = AlertLevel.WARNING;
          message = value >= 180
            ? `Blood glucose elevated at ${value} mg/dL`
            : `Blood glucose low at ${value} mg/dL`;
        } else if (deviationAbove > 5 || deviationBelow > 5) {
          level = AlertLevel.INFO;
          message = `Blood glucose at ${value} mg/dL, slightly outside target`;
        }
        break;

      default:
        break;
    }

    if (level === null) return null;

    this.alertCounter++;
    return {
      id: `alert-${reading.patientId}-${this.alertCounter}`,
      patientId: reading.patientId,
      timestamp,
      level,
      vitalType: reading.type,
      message,
      currentValue: reading.value,
      secondaryValue: reading.secondaryValue,
      threshold: { min, max },
      acknowledged: false,
    };
  }

  private celsiusToFahrenheit(celsius: number): string {
    return (celsius * 9 / 5 + 32).toFixed(1);
  }

  // --------------------------------------------------------------------------
  // Public Query API
  // --------------------------------------------------------------------------

  /**
   * Get all patient profiles.
   */
  getAllPatients(): PatientProfile[] {
    this.ensureDataGenerated();
    return Array.from(this.profiles.values());
  }

  /**
   * Get a specific patient's profile.
   */
  getPatientProfile(patientId: string): PatientProfile | null {
    this.ensureDataGenerated();
    return this.profiles.get(patientId) ?? null;
  }

  /**
   * Get all readings for a patient, optionally filtered by vital type.
   */
  getReadings(patientId: string, vitalType?: VitalSignType): VitalSignReading[] {
    this.ensureDataGenerated();
    const patientReadings = this.readings.get(patientId) ?? [];
    if (vitalType) {
      return patientReadings.filter(r => r.type === vitalType);
    }
    return patientReadings;
  }

  /**
   * Get the latest reading of each type for a patient.
   */
  getLatestReadings(patientId: string): Record<string, VitalSignReading> {
    this.ensureDataGenerated();
    const patientReadings = this.readings.get(patientId) ?? [];
    const latest: Record<string, VitalSignReading> = {};

    for (const reading of patientReadings) {
      const existing = latest[reading.type];
      if (
        !existing ||
        new Date(reading.timestamp).getTime() > new Date(existing.timestamp).getTime()
      ) {
        latest[reading.type] = reading;
      }
    }

    return latest;
  }

  /**
   * Get readings in a time range.
   */
  getReadingsInRange(
    patientId: string,
    startTime: string,
    endTime: string,
    vitalType?: VitalSignType,
  ): VitalSignReading[] {
    this.ensureDataGenerated();
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    let patientReadings = this.readings.get(patientId) ?? [];
    if (vitalType) {
      patientReadings = patientReadings.filter(r => r.type === vitalType);
    }

    return patientReadings.filter(r => {
      const t = new Date(r.timestamp).getTime();
      return t >= startMs && t <= endMs;
    });
  }

  /**
   * Get personalized baselines for a patient.
   */
  getBaselines(patientId: string): PersonalizedBaseline[] {
    this.ensureDataGenerated();
    return this.baselines.get(patientId) ?? [];
  }

  /**
   * Get all active (unacknowledged) alerts for a patient.
   */
  getActiveAlerts(patientId: string): VitalAlert[] {
    this.ensureDataGenerated();
    const patientAlerts = this.alerts.get(patientId) ?? [];
    return patientAlerts.filter(a => !a.acknowledged);
  }

  /**
   * Get alerts filtered by level.
   */
  getAlertsByLevel(patientId: string, level: AlertLevel): VitalAlert[] {
    this.ensureDataGenerated();
    const patientAlerts = this.alerts.get(patientId) ?? [];
    return patientAlerts.filter(a => a.level === level);
  }

  /**
   * Get the most recent N alerts for a patient.
   */
  getRecentAlerts(patientId: string, count: number = 10): VitalAlert[] {
    this.ensureDataGenerated();
    const patientAlerts = this.alerts.get(patientId) ?? [];
    return patientAlerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  /**
   * Acknowledge an alert.
   */
  acknowledgeAlert(patientId: string, alertId: string): boolean {
    this.ensureDataGenerated();
    const patientAlerts = this.alerts.get(patientId) ?? [];
    const alert = patientAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get a complete summary for a patient.
   */
  getPatientSummary(patientId: string): PatientVitalsSummary | null {
    this.ensureDataGenerated();

    const profile = this.profiles.get(patientId);
    if (!profile) return null;

    const latestReadings = this.getLatestReadings(patientId);
    const baselines = this.getBaselines(patientId);
    const activeAlerts = this.getActiveAlerts(patientId);
    const currentNEWS2 = this.calculateNEWS2(patientId);
    const correlations = this.detectCorrelations(patientId);

    const vitalTypes: VitalSignType[] = [
      VitalSignType.HEART_RATE,
      VitalSignType.BLOOD_PRESSURE,
      VitalSignType.TEMPERATURE,
      VitalSignType.RESPIRATORY_RATE,
      VitalSignType.SPO2,
    ];
    const trends = vitalTypes.map(vt => this.calculateTrends(patientId, vt));

    const readingCount = (this.readings.get(patientId) ?? []).length;

    return {
      patientId,
      profile,
      latestReadings,
      baselines,
      trends,
      correlations,
      currentNEWS2,
      activeAlerts,
      readingCount,
    };
  }

  /**
   * Get all patients sorted by clinical risk (highest risk first).
   */
  getPatientsByRisk(): Array<{ patientId: string; news2Score: NEWS2Score }> {
    this.ensureDataGenerated();

    const riskOrder: Record<string, number> = {
      [ClinicalRisk.HIGH]: 0,
      [ClinicalRisk.MEDIUM]: 1,
      [ClinicalRisk.LOW_MEDIUM]: 2,
      [ClinicalRisk.LOW]: 3,
    };

    const results: Array<{ patientId: string; news2Score: NEWS2Score }> = [];
    for (const patientId of this.profiles.keys()) {
      const news2Score = this.calculateNEWS2(patientId);
      results.push({ patientId, news2Score });
    }

    results.sort((a, b) => {
      const riskDiff =
        (riskOrder[a.news2Score.clinicalRisk] ?? 99) -
        (riskOrder[b.news2Score.clinicalRisk] ?? 99);
      if (riskDiff !== 0) return riskDiff;
      return b.news2Score.aggregateScore - a.news2Score.aggregateScore;
    });

    return results;
  }

  /**
   * Get aggregate statistics across all patients.
   */
  getDatasetStatistics(): {
    totalPatients: number;
    totalReadings: number;
    totalAlerts: number;
    alertsByLevel: Record<string, number>;
    riskDistribution: Record<string, number>;
    averageReadingsPerPatient: number;
    postOperativePatients: number;
    diabeticPatients: number;
  } {
    this.ensureDataGenerated();

    const totalPatients = this.profiles.size;
    let totalReadings = 0;
    let totalAlerts = 0;
    const alertsByLevel: Record<string, number> = {
      [AlertLevel.INFO]: 0,
      [AlertLevel.WARNING]: 0,
      [AlertLevel.CRITICAL]: 0,
      [AlertLevel.EMERGENCY]: 0,
    };
    const riskDistribution: Record<string, number> = {
      [ClinicalRisk.LOW]: 0,
      [ClinicalRisk.LOW_MEDIUM]: 0,
      [ClinicalRisk.MEDIUM]: 0,
      [ClinicalRisk.HIGH]: 0,
    };
    let postOperativePatients = 0;
    let diabeticPatients = 0;

    for (const [patientId, readings] of this.readings.entries()) {
      totalReadings += readings.length;

      const patientAlerts = this.alerts.get(patientId) ?? [];
      totalAlerts += patientAlerts.length;
      for (const alert of patientAlerts) {
        alertsByLevel[alert.level] = (alertsByLevel[alert.level] ?? 0) + 1;
      }

      const news2 = this.calculateNEWS2(patientId);
      riskDistribution[news2.clinicalRisk] = (riskDistribution[news2.clinicalRisk] ?? 0) + 1;

      const profile = this.profiles.get(patientId);
      if (profile?.isPostOperative) postOperativePatients++;
      if (profile?.isDiabetic) diabeticPatients++;
    }

    return {
      totalPatients,
      totalReadings,
      totalAlerts,
      alertsByLevel,
      riskDistribution,
      averageReadingsPerPatient: totalPatients > 0 ? Math.round(totalReadings / totalPatients) : 0,
      postOperativePatients,
      diabeticPatients,
    };
  }

  /**
   * Add a new manual reading for a patient.
   */
  addReading(reading: VitalSignReading): void {
    this.ensureDataGenerated();

    const patientReadings = this.readings.get(reading.patientId) ?? [];
    patientReadings.push(reading);
    this.readings.set(reading.patientId, patientReadings);

    // Evaluate the new reading for alerts
    const patientBaselines = this.baselines.get(reading.patientId) ?? [];
    const hour = new Date(reading.timestamp).getHours();
    const timeOfDay: TimeOfDay = (hour >= 6 && hour < 22)
      ? TimeOfDay.ACTIVE
      : TimeOfDay.RESTING;

    const baseline = patientBaselines.find(b => b.vitalType === reading.type);
    const range = baseline
      ? (timeOfDay === TimeOfDay.RESTING ? baseline.restingRange : baseline.activeRange)
      : POPULATION_NORMAL_RANGES[reading.type];

    if (range) {
      const alert = this.evaluateReading(reading, range, reading.timestamp);
      if (alert) {
        const patientAlerts = this.alerts.get(reading.patientId) ?? [];
        patientAlerts.push(alert);
        this.alerts.set(reading.patientId, patientAlerts);
      }
    }
  }

  /**
   * Get the total number of readings across all patients.
   */
  getTotalReadingCount(): number {
    let total = 0;
    for (const readings of this.readings.values()) {
      total += readings.length;
    }
    return total;
  }

  /**
   * Get the population normal ranges for reference.
   */
  getPopulationNormalRanges(): Record<string, NormalRange> {
    return { ...POPULATION_NORMAL_RANGES };
  }

  /**
   * Convert Celsius to Fahrenheit for display.
   */
  static toFahrenheit(celsius: number): number {
    return Math.round((celsius * 9 / 5 + 32) * 10) / 10;
  }

  /**
   * Convert Fahrenheit to Celsius for storage.
   */
  static toCelsius(fahrenheit: number): number {
    return Math.round(((fahrenheit - 32) * 5 / 9) * 10) / 10;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const vitalSignsMonitor = new VitalSignsMonitor();

console.log('[VitalSignsMonitor] Service initialized');
