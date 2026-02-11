/**
 * Wearable Device Data Integration Service
 *
 * Comprehensive wearable device data ingestion, normalization, quality management,
 * sync management, and recovery-specific metrics extraction for post-surgical
 * recovery monitoring.
 *
 * Features:
 *  - Support for 7 device types (smartwatch, BP monitor, pulse oximeter, etc.)
 *  - Simulated data streams with realistic physiological patterns
 *  - Data normalization, validation, and quality scoring
 *  - Timestamp alignment and timezone handling
 *  - Batch and real-time data processing
 *  - Missing data detection and interpolation
 *  - Outlier filtering and device calibration tracking
 *  - Sync management with conflict resolution and deduplication
 *  - Recovery-specific metrics (activity curve, sleep impact, HRV, milestones)
 *  - 30-day simulated dataset per patient
 */

// ============================================================================
// Constants & Enums (using const objects for erasableSyntaxOnly compatibility)
// ============================================================================

export const DeviceType = {
  SMARTWATCH: 'smartwatch',
  BLOOD_PRESSURE_MONITOR: 'blood_pressure_monitor',
  PULSE_OXIMETER: 'pulse_oximeter',
  SMART_SCALE: 'smart_scale',
  CONTINUOUS_GLUCOSE_MONITOR: 'continuous_glucose_monitor',
  SMART_THERMOMETER: 'smart_thermometer',
  ACTIVITY_TRACKER: 'activity_tracker',
} as const;
export type DeviceType = typeof DeviceType[keyof typeof DeviceType];

export const DeviceBrand = {
  APPLE_WATCH: 'apple_watch',
  FITBIT: 'fitbit',
  GARMIN: 'garmin',
  OMRON: 'omron',
  WITHINGS: 'withings',
  MASIMO: 'masimo',
  DEXCOM: 'dexcom',
  KINSA: 'kinsa',
} as const;
export type DeviceBrand = typeof DeviceBrand[keyof typeof DeviceBrand];

export const MetricType = {
  STEPS: 'steps',
  DISTANCE_KM: 'distance_km',
  CALORIES_BURNED: 'calories_burned',
  HEART_RATE_RESTING: 'heart_rate_resting',
  HEART_RATE_ACTIVE: 'heart_rate_active',
  HEART_RATE_RECOVERY: 'heart_rate_recovery',
  HEART_RATE_VARIABILITY: 'heart_rate_variability',
  SLEEP_DEEP_MINUTES: 'sleep_deep_minutes',
  SLEEP_LIGHT_MINUTES: 'sleep_light_minutes',
  SLEEP_REM_MINUTES: 'sleep_rem_minutes',
  SLEEP_AWAKE_MINUTES: 'sleep_awake_minutes',
  SLEEP_TOTAL_MINUTES: 'sleep_total_minutes',
  BLOOD_OXYGEN: 'blood_oxygen',
  STRESS_LEVEL: 'stress_level',
  ACTIVITY_LIGHT_MINUTES: 'activity_light_minutes',
  ACTIVITY_MODERATE_MINUTES: 'activity_moderate_minutes',
  ACTIVITY_VIGOROUS_MINUTES: 'activity_vigorous_minutes',
  BLOOD_PRESSURE_SYSTOLIC: 'blood_pressure_systolic',
  BLOOD_PRESSURE_DIASTOLIC: 'blood_pressure_diastolic',
  WEIGHT_KG: 'weight_kg',
  BODY_FAT_PERCENT: 'body_fat_percent',
  BMI: 'bmi',
  BLOOD_GLUCOSE: 'blood_glucose',
  BODY_TEMPERATURE: 'body_temperature',
} as const;
export type MetricType = typeof MetricType[keyof typeof MetricType];

export const DataQualityLevel = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  INVALID: 'invalid',
} as const;
export type DataQualityLevel = typeof DataQualityLevel[keyof typeof DataQualityLevel];

export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  CONFLICT: 'conflict',
  FAILED: 'failed',
  OFFLINE_QUEUED: 'offline_queued',
} as const;
export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus];

export const ConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  INTERMITTENT: 'intermittent',
} as const;
export type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus];

export const RecoveryPhase = {
  ACUTE: 'acute',
  EARLY: 'early',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  FULL_RECOVERY: 'full_recovery',
} as const;
export type RecoveryPhase = typeof RecoveryPhase[keyof typeof RecoveryPhase];

export const SleepQualityRating = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  VERY_POOR: 'very_poor',
} as const;
export type SleepQualityRating = typeof SleepQualityRating[keyof typeof SleepQualityRating];

export const MilestoneStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  ACHIEVED: 'achieved',
  REGRESSED: 'regressed',
} as const;
export type MilestoneStatus = typeof MilestoneStatus[keyof typeof MilestoneStatus];

// ============================================================================
// Interfaces
// ============================================================================

/** Registered wearable device */
export interface WearableDevice {
  id: string;
  patientId: string;
  type: DeviceType;
  brand: DeviceBrand;
  model: string;
  firmwareVersion: string;
  batteryLevel: number;
  connectionStatus: ConnectionStatus;
  lastSyncTimestamp: string;
  registeredAt: string;
  timezone: string;
  calibrationDate: string;
  calibrationDueDate: string;
  isCalibrated: boolean;
}

/** Raw data point from a wearable device before normalization */
export interface RawDeviceDataPoint {
  id: string;
  deviceId: string;
  patientId: string;
  timestamp: string;
  timezone: string;
  metricType: MetricType;
  rawValue: number;
  unit: string;
  metadata?: Record<string, unknown>;
}

/** Normalized data point after processing */
export interface NormalizedDataPoint {
  id: string;
  sourceRawId: string;
  deviceId: string;
  patientId: string;
  timestamp: string;
  utcTimestamp: string;
  metricType: MetricType;
  value: number;
  unit: string;
  qualityScore: number;
  qualityLevel: DataQualityLevel;
  isInterpolated: boolean;
  isOutlier: boolean;
  source: 'device' | 'interpolated' | 'manual';
}

/** Data quality assessment for a batch of data */
export interface DataQualityReport {
  deviceId: string;
  patientId: string;
  periodStart: string;
  periodEnd: string;
  totalPoints: number;
  validPoints: number;
  interpolatedPoints: number;
  outlierPoints: number;
  missingIntervals: number;
  averageQualityScore: number;
  overallQuality: DataQualityLevel;
  gapIntervals: Array<{ start: string; end: string; durationMinutes: number }>;
}

/** Sync record for a device */
export interface SyncRecord {
  id: string;
  deviceId: string;
  patientId: string;
  syncTimestamp: string;
  status: SyncStatus;
  dataPointCount: number;
  conflictsResolved: number;
  duplicatesRemoved: number;
  errorMessage?: string;
}

/** Offline data queue entry */
export interface OfflineQueueEntry {
  id: string;
  deviceId: string;
  patientId: string;
  queuedAt: string;
  dataPoints: RawDeviceDataPoint[];
  retryCount: number;
  maxRetries: number;
}

/** Sleep analysis from wearable data */
export interface SleepAnalysis {
  patientId: string;
  date: string;
  totalMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
  sleepEfficiency: number;
  qualityRating: SleepQualityRating;
  bedtime: string;
  wakeTime: string;
  numberOfWakeups: number;
}

/** Heart rate variability analysis */
export interface HRVAnalysis {
  patientId: string;
  timestamp: string;
  rmssd: number;
  sdnn: number;
  stressLevel: number;
  stressCategory: 'low' | 'moderate' | 'high' | 'very_high';
  recoveryScore: number;
  comparedToBaseline: number;
}

/** Activity summary for a day */
export interface DailyActivitySummary {
  patientId: string;
  date: string;
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  lightMinutes: number;
  moderateMinutes: number;
  vigorousMinutes: number;
  sedentaryMinutes: number;
  activeMinutesTotal: number;
  goalCompletion: number;
}

/** Recovery activity curve data point */
export interface RecoveryCurvePoint {
  dayPostSurgery: number;
  date: string;
  steps: number;
  activeMinutes: number;
  expectedSteps: number;
  expectedActiveMinutes: number;
  percentOfExpected: number;
  phase: RecoveryPhase;
}

/** Step count recovery milestone */
export interface StepMilestone {
  name: string;
  targetSteps: number;
  status: MilestoneStatus;
  achievedDate?: string;
  dayPostSurgery?: number;
  expectedDay: number;
}

/** Sleep quality impact on recovery */
export interface SleepRecoveryImpact {
  patientId: string;
  periodStart: string;
  periodEnd: string;
  averageSleepQuality: number;
  averageSleepDuration: number;
  sleepQualityTrend: 'improving' | 'stable' | 'declining';
  recoveryCorrelation: number;
  poorSleepDays: number;
  goodSleepDays: number;
  impactSummary: string;
}

/** HRV-based stress tracking over time */
export interface StressTrackingRecord {
  patientId: string;
  date: string;
  morningHRV: number;
  eveningHRV: number;
  averageStressLevel: number;
  peakStressLevel: number;
  stressCategory: 'low' | 'moderate' | 'high' | 'very_high';
  recoveryImpact: 'positive' | 'neutral' | 'negative';
}

/** Comprehensive patient wearable summary */
export interface PatientWearableSummary {
  patientId: string;
  devices: WearableDevice[];
  latestMetrics: Record<string, NormalizedDataPoint>;
  todayActivity: DailyActivitySummary | null;
  lastSleep: SleepAnalysis | null;
  latestHRV: HRVAnalysis | null;
  recoveryCurve: RecoveryCurvePoint[];
  milestones: StepMilestone[];
  sleepImpact: SleepRecoveryImpact | null;
  dataQuality: DataQualityReport | null;
  syncHistory: SyncRecord[];
}

// ============================================================================
// Deterministic Seeded RNG
// ============================================================================

class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0 || 1;
  }

  /** Returns a pseudo-random float in [0, 1) */
  next(): number {
    let s = this.state;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    this.state = s;
    return (s >>> 0) / 4294967296;
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
    const u1 = this.next() || 0.0001;
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  /** Picks a random element from an array */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Returns true with the given probability */
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function meanOf(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function linearInterpolate(x0: number, y0: number, x1: number, y1: number, x: number): number {
  if (x1 === x0) return y0;
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

/** Circadian rhythm factor: nadir at 04:00, peak at 16:00 */
function circadianFactor(hourOfDay: number): number {
  const radians = ((hourOfDay - 4) / 24) * 2 * Math.PI;
  return 0.5 + 0.5 * Math.sin(radians);
}

/** Post-operative recovery trajectory: exponential decay toward baseline */
function postSurgeryRecoveryFactor(daysSinceSurgery: number): number {
  if (daysSinceSurgery < 0) return 0;
  return Math.exp(-daysSinceSurgery / 7);
}

/** Expected step count recovery curve over 30 days post-surgery */
function expectedStepRecovery(dayPostSurgery: number): number {
  // Day 0: ~500 steps (hospital), Day 7: ~2000, Day 14: ~4000, Day 30: ~7000+
  const maxSteps = 8000;
  const minSteps = 400;
  const recovery = 1 - Math.exp(-dayPostSurgery / 10);
  return Math.round(minSteps + (maxSteps - minSteps) * recovery);
}

/** Expected active minutes recovery curve */
function expectedActiveMinutesRecovery(dayPostSurgery: number): number {
  const maxMinutes = 45;
  const minMinutes = 5;
  const recovery = 1 - Math.exp(-dayPostSurgery / 12);
  return Math.round(minMinutes + (maxMinutes - minMinutes) * recovery);
}

// ============================================================================
// Metric Validation Ranges
// ============================================================================

interface MetricRange {
  min: number;
  max: number;
  unit: string;
  outlierMin: number;
  outlierMax: number;
}

const METRIC_RANGES: Record<string, MetricRange> = {
  [MetricType.STEPS]: { min: 0, max: 50000, unit: 'steps', outlierMin: 0, outlierMax: 40000 },
  [MetricType.DISTANCE_KM]: { min: 0, max: 50, unit: 'km', outlierMin: 0, outlierMax: 35 },
  [MetricType.CALORIES_BURNED]: { min: 0, max: 5000, unit: 'kcal', outlierMin: 0, outlierMax: 4000 },
  [MetricType.HEART_RATE_RESTING]: { min: 30, max: 200, unit: 'bpm', outlierMin: 38, outlierMax: 120 },
  [MetricType.HEART_RATE_ACTIVE]: { min: 40, max: 220, unit: 'bpm', outlierMin: 50, outlierMax: 200 },
  [MetricType.HEART_RATE_RECOVERY]: { min: 30, max: 200, unit: 'bpm', outlierMin: 40, outlierMax: 150 },
  [MetricType.HEART_RATE_VARIABILITY]: { min: 5, max: 200, unit: 'ms', outlierMin: 10, outlierMax: 150 },
  [MetricType.SLEEP_DEEP_MINUTES]: { min: 0, max: 300, unit: 'min', outlierMin: 0, outlierMax: 200 },
  [MetricType.SLEEP_LIGHT_MINUTES]: { min: 0, max: 500, unit: 'min', outlierMin: 0, outlierMax: 400 },
  [MetricType.SLEEP_REM_MINUTES]: { min: 0, max: 250, unit: 'min', outlierMin: 0, outlierMax: 180 },
  [MetricType.SLEEP_AWAKE_MINUTES]: { min: 0, max: 300, unit: 'min', outlierMin: 0, outlierMax: 180 },
  [MetricType.SLEEP_TOTAL_MINUTES]: { min: 0, max: 900, unit: 'min', outlierMin: 60, outlierMax: 720 },
  [MetricType.BLOOD_OXYGEN]: { min: 70, max: 100, unit: '%', outlierMin: 85, outlierMax: 100 },
  [MetricType.STRESS_LEVEL]: { min: 0, max: 100, unit: 'score', outlierMin: 0, outlierMax: 100 },
  [MetricType.ACTIVITY_LIGHT_MINUTES]: { min: 0, max: 600, unit: 'min', outlierMin: 0, outlierMax: 480 },
  [MetricType.ACTIVITY_MODERATE_MINUTES]: { min: 0, max: 300, unit: 'min', outlierMin: 0, outlierMax: 240 },
  [MetricType.ACTIVITY_VIGOROUS_MINUTES]: { min: 0, max: 180, unit: 'min', outlierMin: 0, outlierMax: 120 },
  [MetricType.BLOOD_PRESSURE_SYSTOLIC]: { min: 60, max: 250, unit: 'mmHg', outlierMin: 75, outlierMax: 200 },
  [MetricType.BLOOD_PRESSURE_DIASTOLIC]: { min: 30, max: 150, unit: 'mmHg', outlierMin: 45, outlierMax: 120 },
  [MetricType.WEIGHT_KG]: { min: 20, max: 300, unit: 'kg', outlierMin: 30, outlierMax: 250 },
  [MetricType.BODY_FAT_PERCENT]: { min: 2, max: 60, unit: '%', outlierMin: 5, outlierMax: 55 },
  [MetricType.BMI]: { min: 10, max: 70, unit: 'kg/m2', outlierMin: 13, outlierMax: 55 },
  [MetricType.BLOOD_GLUCOSE]: { min: 20, max: 500, unit: 'mg/dL', outlierMin: 40, outlierMax: 350 },
  [MetricType.BODY_TEMPERATURE]: { min: 34, max: 42, unit: 'C', outlierMin: 35, outlierMax: 40.5 },
};

// ============================================================================
// Device Model Definitions
// ============================================================================

interface DeviceModelSpec {
  type: DeviceType;
  brand: DeviceBrand;
  model: string;
  firmwareVersion: string;
  metrics: MetricType[];
  readingIntervalMinutes: number;
  batteryDrainPerDay: number;
}

const DEVICE_MODELS: DeviceModelSpec[] = [
  {
    type: DeviceType.SMARTWATCH,
    brand: DeviceBrand.APPLE_WATCH,
    model: 'Apple Watch Series 9',
    firmwareVersion: '10.3.1',
    metrics: [
      MetricType.STEPS, MetricType.DISTANCE_KM, MetricType.CALORIES_BURNED,
      MetricType.HEART_RATE_RESTING, MetricType.HEART_RATE_ACTIVE,
      MetricType.HEART_RATE_RECOVERY, MetricType.HEART_RATE_VARIABILITY,
      MetricType.SLEEP_DEEP_MINUTES, MetricType.SLEEP_LIGHT_MINUTES,
      MetricType.SLEEP_REM_MINUTES, MetricType.SLEEP_AWAKE_MINUTES,
      MetricType.SLEEP_TOTAL_MINUTES, MetricType.BLOOD_OXYGEN,
      MetricType.STRESS_LEVEL, MetricType.ACTIVITY_LIGHT_MINUTES,
      MetricType.ACTIVITY_MODERATE_MINUTES, MetricType.ACTIVITY_VIGOROUS_MINUTES,
    ],
    readingIntervalMinutes: 5,
    batteryDrainPerDay: 4.2,
  },
  {
    type: DeviceType.SMARTWATCH,
    brand: DeviceBrand.FITBIT,
    model: 'Fitbit Sense 2',
    firmwareVersion: '7.12.0',
    metrics: [
      MetricType.STEPS, MetricType.DISTANCE_KM, MetricType.CALORIES_BURNED,
      MetricType.HEART_RATE_RESTING, MetricType.HEART_RATE_ACTIVE,
      MetricType.HEART_RATE_VARIABILITY,
      MetricType.SLEEP_DEEP_MINUTES, MetricType.SLEEP_LIGHT_MINUTES,
      MetricType.SLEEP_REM_MINUTES, MetricType.SLEEP_AWAKE_MINUTES,
      MetricType.SLEEP_TOTAL_MINUTES, MetricType.BLOOD_OXYGEN,
      MetricType.STRESS_LEVEL, MetricType.ACTIVITY_LIGHT_MINUTES,
      MetricType.ACTIVITY_MODERATE_MINUTES, MetricType.ACTIVITY_VIGOROUS_MINUTES,
    ],
    readingIntervalMinutes: 10,
    batteryDrainPerDay: 2.8,
  },
  {
    type: DeviceType.SMARTWATCH,
    brand: DeviceBrand.GARMIN,
    model: 'Garmin Venu 3',
    firmwareVersion: '9.24',
    metrics: [
      MetricType.STEPS, MetricType.DISTANCE_KM, MetricType.CALORIES_BURNED,
      MetricType.HEART_RATE_RESTING, MetricType.HEART_RATE_ACTIVE,
      MetricType.HEART_RATE_RECOVERY, MetricType.HEART_RATE_VARIABILITY,
      MetricType.SLEEP_DEEP_MINUTES, MetricType.SLEEP_LIGHT_MINUTES,
      MetricType.SLEEP_REM_MINUTES, MetricType.SLEEP_AWAKE_MINUTES,
      MetricType.SLEEP_TOTAL_MINUTES, MetricType.BLOOD_OXYGEN,
      MetricType.STRESS_LEVEL, MetricType.ACTIVITY_LIGHT_MINUTES,
      MetricType.ACTIVITY_MODERATE_MINUTES, MetricType.ACTIVITY_VIGOROUS_MINUTES,
    ],
    readingIntervalMinutes: 15,
    batteryDrainPerDay: 1.8,
  },
  {
    type: DeviceType.BLOOD_PRESSURE_MONITOR,
    brand: DeviceBrand.OMRON,
    model: 'Omron Evolv',
    firmwareVersion: '2.4.1',
    metrics: [
      MetricType.BLOOD_PRESSURE_SYSTOLIC, MetricType.BLOOD_PRESSURE_DIASTOLIC,
      MetricType.HEART_RATE_RESTING,
    ],
    readingIntervalMinutes: 720,
    batteryDrainPerDay: 0.5,
  },
  {
    type: DeviceType.PULSE_OXIMETER,
    brand: DeviceBrand.MASIMO,
    model: 'Masimo MightySat Rx',
    firmwareVersion: '3.1.0',
    metrics: [
      MetricType.BLOOD_OXYGEN, MetricType.HEART_RATE_RESTING,
    ],
    readingIntervalMinutes: 60,
    batteryDrainPerDay: 1.2,
  },
  {
    type: DeviceType.SMART_SCALE,
    brand: DeviceBrand.WITHINGS,
    model: 'Withings Body+',
    firmwareVersion: '2.6.4',
    metrics: [
      MetricType.WEIGHT_KG, MetricType.BODY_FAT_PERCENT, MetricType.BMI,
    ],
    readingIntervalMinutes: 1440,
    batteryDrainPerDay: 0.3,
  },
  {
    type: DeviceType.CONTINUOUS_GLUCOSE_MONITOR,
    brand: DeviceBrand.DEXCOM,
    model: 'Dexcom G7',
    firmwareVersion: '1.8.2',
    metrics: [
      MetricType.BLOOD_GLUCOSE,
    ],
    readingIntervalMinutes: 5,
    batteryDrainPerDay: 7.1,
  },
  {
    type: DeviceType.SMART_THERMOMETER,
    brand: DeviceBrand.KINSA,
    model: 'Kinsa QuickCare',
    firmwareVersion: '4.2.0',
    metrics: [
      MetricType.BODY_TEMPERATURE,
    ],
    readingIntervalMinutes: 480,
    batteryDrainPerDay: 0.2,
  },
  {
    type: DeviceType.ACTIVITY_TRACKER,
    brand: DeviceBrand.FITBIT,
    model: 'Fitbit Inspire 3',
    firmwareVersion: '5.8.1',
    metrics: [
      MetricType.STEPS, MetricType.DISTANCE_KM, MetricType.CALORIES_BURNED,
      MetricType.HEART_RATE_RESTING, MetricType.HEART_RATE_ACTIVE,
      MetricType.SLEEP_TOTAL_MINUTES,
      MetricType.ACTIVITY_LIGHT_MINUTES, MetricType.ACTIVITY_MODERATE_MINUTES,
    ],
    readingIntervalMinutes: 15,
    batteryDrainPerDay: 1.5,
  },
];

// ============================================================================
// Step Milestones Definition
// ============================================================================

const STEP_MILESTONES: Array<{ name: string; targetSteps: number; expectedDay: number }> = [
  { name: 'First 500 Steps', targetSteps: 500, expectedDay: 1 },
  { name: 'First 1000 Steps', targetSteps: 1000, expectedDay: 3 },
  { name: 'Walk to Bathroom Independently', targetSteps: 2000, expectedDay: 5 },
  { name: 'First Short Walk', targetSteps: 3000, expectedDay: 8 },
  { name: 'Half Pre-Surgery Level', targetSteps: 4000, expectedDay: 12 },
  { name: 'Around the Block', targetSteps: 5000, expectedDay: 16 },
  { name: 'Active Recovery Level', targetSteps: 6000, expectedDay: 20 },
  { name: 'Near Normal Activity', targetSteps: 7500, expectedDay: 25 },
  { name: 'Full Recovery Target', targetSteps: 10000, expectedDay: 35 },
];

// ============================================================================
// Data Generation Engine
// ============================================================================

interface PatientWearableProfile {
  patientId: string;
  age: number;
  baselineHR: number;
  baselineHRV: number;
  baselineSystolic: number;
  baselineDiastolic: number;
  baselineWeight: number;
  baselineHeight: number;
  baselineGlucose: number;
  baselineTemp: number;
  baselineSpO2: number;
  baselineSteps: number;
  surgeryDate: Date;
  healingRate: number;
  sleepQualityBase: number;
  stressBase: number;
  isDiabetic: boolean;
}

function generatePatientProfile(patientIndex: number, rng: SeededRNG): PatientWearableProfile {
  const age = rng.intRange(30, 75);
  const baselineHR = rng.gaussian(72, 8);
  const baselineHRV = rng.gaussian(45, 12);
  const isMale = rng.chance(0.5);

  const baseSurgeryDate = new Date('2026-01-10T08:00:00.000Z');
  baseSurgeryDate.setDate(baseSurgeryDate.getDate() - 30 + (patientIndex % 3));

  return {
    patientId: `wearable-patient-${String(patientIndex + 1).padStart(3, '0')}`,
    age,
    baselineHR: clamp(Math.round(baselineHR), 55, 95),
    baselineHRV: clamp(Math.round(baselineHRV), 15, 80),
    baselineSystolic: clamp(Math.round(rng.gaussian(120, 10)), 95, 155),
    baselineDiastolic: clamp(Math.round(rng.gaussian(78, 7)), 60, 95),
    baselineWeight: clamp(roundTo(rng.gaussian(isMale ? 82 : 68, 12), 1), 45, 150),
    baselineHeight: isMale ? rng.range(1.68, 1.88) : rng.range(1.55, 1.75),
    baselineGlucose: clamp(Math.round(rng.gaussian(95, 12)), 70, 140),
    baselineTemp: clamp(roundTo(rng.gaussian(36.6, 0.2), 1), 36.0, 37.2),
    baselineSpO2: clamp(roundTo(rng.gaussian(97.5, 0.8), 0), 94, 100),
    baselineSteps: clamp(Math.round(rng.gaussian(8000, 2000)), 4000, 14000),
    surgeryDate: baseSurgeryDate,
    healingRate: rng.range(0.06, 0.16),
    sleepQualityBase: rng.range(0.6, 0.9),
    stressBase: rng.range(25, 50),
    isDiabetic: rng.chance(0.18),
  };
}

function generateDevicesForPatient(
  profile: PatientWearableProfile,
  rng: SeededRNG,
): WearableDevice[] {
  const devices: WearableDevice[] = [];

  // Each patient gets a smartwatch plus 1-3 other devices
  const smartwatchSpec = rng.pick(DEVICE_MODELS.filter(d => d.type === DeviceType.SMARTWATCH));
  const otherSpecs = DEVICE_MODELS.filter(d => d.type !== DeviceType.SMARTWATCH && d.type !== DeviceType.ACTIVITY_TRACKER);
  const numOtherDevices = rng.intRange(1, 3);

  const selectedOtherSpecs: DeviceModelSpec[] = [];
  const shuffled = [...otherSpecs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (let i = 0; i < numOtherDevices && i < shuffled.length; i++) {
    // Only add CGM if patient is diabetic
    if (shuffled[i].type === DeviceType.CONTINUOUS_GLUCOSE_MONITOR && !profile.isDiabetic) {
      continue;
    }
    selectedOtherSpecs.push(shuffled[i]);
  }

  const allSpecs = [smartwatchSpec, ...selectedOtherSpecs];

  for (let i = 0; i < allSpecs.length; i++) {
    const spec = allSpecs[i];
    const registeredDate = new Date(profile.surgeryDate);
    registeredDate.setDate(registeredDate.getDate() - rng.intRange(3, 14));

    const calibrationDate = new Date(registeredDate);
    const calibrationDue = new Date(calibrationDate);
    calibrationDue.setDate(calibrationDue.getDate() + 90);

    const daysSinceSurgery = 30;
    const batteryDrain = spec.batteryDrainPerDay * (daysSinceSurgery % (100 / spec.batteryDrainPerDay));
    const batteryLevel = clamp(Math.round(100 - batteryDrain), 5, 100);

    devices.push({
      id: `device-${profile.patientId}-${i}`,
      patientId: profile.patientId,
      type: spec.type,
      brand: spec.brand,
      model: spec.model,
      firmwareVersion: spec.firmwareVersion,
      batteryLevel,
      connectionStatus: rng.chance(0.9) ? ConnectionStatus.CONNECTED : ConnectionStatus.INTERMITTENT,
      lastSyncTimestamp: new Date().toISOString(),
      registeredAt: registeredDate.toISOString(),
      timezone: rng.pick(['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']),
      calibrationDate: calibrationDate.toISOString(),
      calibrationDueDate: calibrationDue.toISOString(),
      isCalibrated: true,
    });
  }

  return devices;
}

// ============================================================================
// Daily Data Generators per Device Type
// ============================================================================

function generateSmartwatchDailyData(
  profile: PatientWearableProfile,
  device: WearableDevice,
  _day: number,
  date: Date,
  rng: SeededRNG,
): RawDeviceDataPoint[] {
  const points: RawDeviceDataPoint[] = [];
  const daysSurgery = daysBetween(profile.surgeryDate, date);
  const recoveryFactor = postSurgeryRecoveryFactor(daysSurgery);
  const dateStr = toISODate(date);

  // Steps: reduced post-surgery, recovering over time
  const stepRecovery = 1 - recoveryFactor * 0.85;
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendFactor = isWeekend ? 0.85 : 1.0;
  const steps = clamp(
    Math.round(profile.baselineSteps * stepRecovery * weekendFactor + rng.gaussian(0, 400)),
    daysSurgery < 2 ? 100 : 200,
    20000,
  );

  points.push({
    id: `raw-${device.id}-${dateStr}-steps`,
    deviceId: device.id,
    patientId: profile.patientId,
    timestamp: `${dateStr}T23:59:00.000Z`,
    timezone: device.timezone,
    metricType: MetricType.STEPS,
    rawValue: steps,
    unit: 'steps',
  });

  // Distance (based on steps, ~0.7m per step)
  const distance = roundTo(steps * 0.0007, 2);
  points.push({
    id: `raw-${device.id}-${dateStr}-dist`,
    deviceId: device.id,
    patientId: profile.patientId,
    timestamp: `${dateStr}T23:59:00.000Z`,
    timezone: device.timezone,
    metricType: MetricType.DISTANCE_KM,
    rawValue: distance,
    unit: 'km',
  });

  // Calories burned
  const bmr = 10 * profile.baselineWeight + 6.25 * (profile.baselineHeight * 100) - 5 * profile.age;
  const activityCalories = steps * 0.04;
  const totalCalories = Math.round(bmr + activityCalories + rng.gaussian(0, 50));
  points.push({
    id: `raw-${device.id}-${dateStr}-cal`,
    deviceId: device.id,
    patientId: profile.patientId,
    timestamp: `${dateStr}T23:59:00.000Z`,
    timezone: device.timezone,
    metricType: MetricType.CALORIES_BURNED,
    rawValue: clamp(totalCalories, 800, 4000),
    unit: 'kcal',
  });

  // Heart rate readings throughout the day (every few hours)
  for (let hour = 0; hour < 24; hour += 4) {
    const circadian = circadianFactor(hour);
    const postOpElevation = recoveryFactor * 12;

    // Resting HR
    const restingHR = clamp(
      Math.round(profile.baselineHR + postOpElevation + (circadian - 0.5) * 6 + rng.gaussian(0, 3)),
      40, 130,
    );
    points.push({
      id: `raw-${device.id}-${dateStr}-rhr-${hour}`,
      deviceId: device.id,
      patientId: profile.patientId,
      timestamp: `${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`,
      timezone: device.timezone,
      metricType: MetricType.HEART_RATE_RESTING,
      rawValue: restingHR,
      unit: 'bpm',
    });

    // Active HR (only during waking hours)
    if (hour >= 8 && hour <= 20) {
      const activeHR = clamp(
        Math.round(restingHR + 25 + rng.gaussian(0, 8) + circadian * 15),
        60, 185,
      );
      points.push({
        id: `raw-${device.id}-${dateStr}-ahr-${hour}`,
        deviceId: device.id,
        patientId: profile.patientId,
        timestamp: `${dateStr}T${String(hour).padStart(2, '0')}:30:00.000Z`,
        timezone: device.timezone,
        metricType: MetricType.HEART_RATE_ACTIVE,
        rawValue: activeHR,
        unit: 'bpm',
      });
    }
  }

  // Heart rate recovery (once per day, during exercise, only if day > 3)
  if (daysSurgery > 3) {
    const exerciseHour = rng.intRange(9, 16);
    const hrRecovery = clamp(
      Math.round(profile.baselineHR + 40 - daysSurgery * 0.5 + rng.gaussian(0, 5)),
      50, 160,
    );
    points.push({
      id: `raw-${device.id}-${dateStr}-hrrec`,
      deviceId: device.id,
      patientId: profile.patientId,
      timestamp: `${dateStr}T${String(exerciseHour).padStart(2, '0')}:45:00.000Z`,
      timezone: device.timezone,
      metricType: MetricType.HEART_RATE_RECOVERY,
      rawValue: hrRecovery,
      unit: 'bpm',
    });
  }

  // HRV (morning measurement)
  const hrvBase = profile.baselineHRV;
  const hrvStressReduction = recoveryFactor * 15;
  const hrvRecovery = Math.min(daysSurgery * 0.8, 10);
  const hrv = clamp(
    Math.round(hrvBase - hrvStressReduction + hrvRecovery + rng.gaussian(0, 5)),
    10, 120,
  );
  points.push({
    id: `raw-${device.id}-${dateStr}-hrv`,
    deviceId: device.id,
    patientId: profile.patientId,
    timestamp: `${dateStr}T07:00:00.000Z`,
    timezone: device.timezone,
    metricType: MetricType.HEART_RATE_VARIABILITY,
    rawValue: hrv,
    unit: 'ms',
  });

  // Sleep data (recorded once per night)
  const sleepQuality = profile.sleepQualityBase * (1 - recoveryFactor * 0.3);
  const totalSleep = clamp(
    Math.round(420 * sleepQuality + rng.gaussian(0, 30)),
    180, 600,
  );
  const deepSleep = clamp(Math.round(totalSleep * rng.range(0.12, 0.22)), 0, 180);
  const remSleep = clamp(Math.round(totalSleep * rng.range(0.18, 0.28)), 0, 150);
  const awakeSleep = clamp(Math.round(totalSleep * rng.range(0.04, 0.12)), 0, 90);
  const lightSleep = totalSleep - deepSleep - remSleep - awakeSleep;

  const sleepTimestamp = `${dateStr}T06:30:00.000Z`;
  points.push(
    { id: `raw-${device.id}-${dateStr}-stotal`, deviceId: device.id, patientId: profile.patientId, timestamp: sleepTimestamp, timezone: device.timezone, metricType: MetricType.SLEEP_TOTAL_MINUTES, rawValue: totalSleep, unit: 'min' },
    { id: `raw-${device.id}-${dateStr}-sdeep`, deviceId: device.id, patientId: profile.patientId, timestamp: sleepTimestamp, timezone: device.timezone, metricType: MetricType.SLEEP_DEEP_MINUTES, rawValue: deepSleep, unit: 'min' },
    { id: `raw-${device.id}-${dateStr}-slight`, deviceId: device.id, patientId: profile.patientId, timestamp: sleepTimestamp, timezone: device.timezone, metricType: MetricType.SLEEP_LIGHT_MINUTES, rawValue: Math.max(0, lightSleep), unit: 'min' },
    { id: `raw-${device.id}-${dateStr}-srem`, deviceId: device.id, patientId: profile.patientId, timestamp: sleepTimestamp, timezone: device.timezone, metricType: MetricType.SLEEP_REM_MINUTES, rawValue: remSleep, unit: 'min' },
    { id: `raw-${device.id}-${dateStr}-sawake`, deviceId: device.id, patientId: profile.patientId, timestamp: sleepTimestamp, timezone: device.timezone, metricType: MetricType.SLEEP_AWAKE_MINUTES, rawValue: awakeSleep, unit: 'min' },
  );

  // Blood oxygen (a few readings per day)
  for (let h = 0; h < 24; h += 8) {
    const spO2 = clamp(
      roundTo(profile.baselineSpO2 - recoveryFactor * 2 + rng.gaussian(0, 0.8), 0),
      88, 100,
    );
    points.push({
      id: `raw-${device.id}-${dateStr}-spo2-${h}`,
      deviceId: device.id,
      patientId: profile.patientId,
      timestamp: `${dateStr}T${String(h).padStart(2, '0')}:15:00.000Z`,
      timezone: device.timezone,
      metricType: MetricType.BLOOD_OXYGEN,
      rawValue: spO2,
      unit: '%',
    });
  }

  // Stress level (HRV-based, inversely correlated with HRV)
  const stressLevel = clamp(
    Math.round(100 - hrv + profile.stressBase * recoveryFactor + rng.gaussian(0, 8)),
    5, 100,
  );
  points.push({
    id: `raw-${device.id}-${dateStr}-stress`,
    deviceId: device.id,
    patientId: profile.patientId,
    timestamp: `${dateStr}T12:00:00.000Z`,
    timezone: device.timezone,
    metricType: MetricType.STRESS_LEVEL,
    rawValue: stressLevel,
    unit: 'score',
  });

  // Activity minutes
  const totalActiveMinutes = Math.round(steps / 100);
  const vigorousMin = daysSurgery < 7 ? 0 : clamp(Math.round(totalActiveMinutes * rng.range(0.05, 0.15)), 0, 60);
  const moderateMin = clamp(Math.round(totalActiveMinutes * rng.range(0.2, 0.35)), 0, 90);
  const lightMin = clamp(totalActiveMinutes - vigorousMin - moderateMin, 0, 300);

  points.push(
    { id: `raw-${device.id}-${dateStr}-alight`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T23:59:00.000Z`, timezone: device.timezone, metricType: MetricType.ACTIVITY_LIGHT_MINUTES, rawValue: lightMin, unit: 'min' },
    { id: `raw-${device.id}-${dateStr}-amod`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T23:59:00.000Z`, timezone: device.timezone, metricType: MetricType.ACTIVITY_MODERATE_MINUTES, rawValue: moderateMin, unit: 'min' },
    { id: `raw-${device.id}-${dateStr}-avig`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T23:59:00.000Z`, timezone: device.timezone, metricType: MetricType.ACTIVITY_VIGOROUS_MINUTES, rawValue: vigorousMin, unit: 'min' },
  );

  return points;
}

function generateBPMonitorDailyData(
  profile: PatientWearableProfile,
  device: WearableDevice,
  _day: number,
  date: Date,
  rng: SeededRNG,
): RawDeviceDataPoint[] {
  const points: RawDeviceDataPoint[] = [];
  const daysSurgery = daysBetween(profile.surgeryDate, date);
  const recoveryFactor = postSurgeryRecoveryFactor(daysSurgery);
  const dateStr = toISODate(date);

  // Morning reading
  const morningHour = rng.intRange(6, 9);
  const morningSystolic = clamp(
    Math.round(profile.baselineSystolic + recoveryFactor * 10 + rng.gaussian(0, 5)),
    80, 200,
  );
  const morningDiastolic = clamp(
    Math.round(profile.baselineDiastolic + recoveryFactor * 5 + rng.gaussian(0, 3)),
    50, 120,
  );
  const morningHR = clamp(
    Math.round(profile.baselineHR + recoveryFactor * 8 + rng.gaussian(0, 3)),
    45, 120,
  );

  points.push(
    { id: `raw-${device.id}-${dateStr}-sys-am`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(morningHour).padStart(2, '0')}:00:00.000Z`, timezone: device.timezone, metricType: MetricType.BLOOD_PRESSURE_SYSTOLIC, rawValue: morningSystolic, unit: 'mmHg' },
    { id: `raw-${device.id}-${dateStr}-dia-am`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(morningHour).padStart(2, '0')}:00:00.000Z`, timezone: device.timezone, metricType: MetricType.BLOOD_PRESSURE_DIASTOLIC, rawValue: morningDiastolic, unit: 'mmHg' },
    { id: `raw-${device.id}-${dateStr}-hr-am`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(morningHour).padStart(2, '0')}:00:00.000Z`, timezone: device.timezone, metricType: MetricType.HEART_RATE_RESTING, rawValue: morningHR, unit: 'bpm' },
  );

  // Evening reading
  const eveningHour = rng.intRange(18, 21);
  const eveningSystolic = clamp(
    Math.round(profile.baselineSystolic + recoveryFactor * 8 + rng.gaussian(0, 5) + 5),
    80, 200,
  );
  const eveningDiastolic = clamp(
    Math.round(profile.baselineDiastolic + recoveryFactor * 4 + rng.gaussian(0, 3) + 3),
    50, 120,
  );

  points.push(
    { id: `raw-${device.id}-${dateStr}-sys-pm`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(eveningHour).padStart(2, '0')}:00:00.000Z`, timezone: device.timezone, metricType: MetricType.BLOOD_PRESSURE_SYSTOLIC, rawValue: eveningSystolic, unit: 'mmHg' },
    { id: `raw-${device.id}-${dateStr}-dia-pm`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(eveningHour).padStart(2, '0')}:00:00.000Z`, timezone: device.timezone, metricType: MetricType.BLOOD_PRESSURE_DIASTOLIC, rawValue: eveningDiastolic, unit: 'mmHg' },
  );

  return points;
}

function generatePulseOximeterDailyData(
  profile: PatientWearableProfile,
  device: WearableDevice,
  _day: number,
  date: Date,
  rng: SeededRNG,
): RawDeviceDataPoint[] {
  const points: RawDeviceDataPoint[] = [];
  const daysSurgery = daysBetween(profile.surgeryDate, date);
  const recoveryFactor = postSurgeryRecoveryFactor(daysSurgery);
  const dateStr = toISODate(date);

  // 3-4 readings per day
  const readingCount = rng.intRange(3, 4);
  const hours = [7, 12, 17, 22].slice(0, readingCount);

  for (const hour of hours) {
    const spO2 = clamp(
      roundTo(profile.baselineSpO2 - recoveryFactor * 3 + rng.gaussian(0, 1), 0),
      85, 100,
    );
    const hr = clamp(
      Math.round(profile.baselineHR + recoveryFactor * 10 + rng.gaussian(0, 4)),
      40, 130,
    );

    points.push(
      { id: `raw-${device.id}-${dateStr}-spo2-${hour}`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`, timezone: device.timezone, metricType: MetricType.BLOOD_OXYGEN, rawValue: spO2, unit: '%' },
      { id: `raw-${device.id}-${dateStr}-hr-${hour}`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`, timezone: device.timezone, metricType: MetricType.HEART_RATE_RESTING, rawValue: hr, unit: 'bpm' },
    );
  }

  return points;
}

function generateSmartScaleDailyData(
  profile: PatientWearableProfile,
  device: WearableDevice,
  day: number,
  date: Date,
  rng: SeededRNG,
): RawDeviceDataPoint[] {
  const points: RawDeviceDataPoint[] = [];
  const dateStr = toISODate(date);

  // Weight fluctuates slightly day to day, slight loss post-surgery
  const daysSurgery = daysBetween(profile.surgeryDate, date);
  const surgeryWeightLoss = Math.min(daysSurgery * 0.05, 2);
  const weight = clamp(
    roundTo(profile.baselineWeight - surgeryWeightLoss + rng.gaussian(0, 0.3), 1),
    30, 250,
  );
  const bodyFat = clamp(
    roundTo(25 + rng.gaussian(0, 1) - day * 0.02, 1),
    5, 55,
  );
  const bmi = roundTo(weight / (profile.baselineHeight * profile.baselineHeight), 1);

  const measureHour = rng.intRange(6, 8);

  points.push(
    { id: `raw-${device.id}-${dateStr}-wt`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(measureHour).padStart(2, '0')}:15:00.000Z`, timezone: device.timezone, metricType: MetricType.WEIGHT_KG, rawValue: weight, unit: 'kg' },
    { id: `raw-${device.id}-${dateStr}-bf`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(measureHour).padStart(2, '0')}:15:00.000Z`, timezone: device.timezone, metricType: MetricType.BODY_FAT_PERCENT, rawValue: bodyFat, unit: '%' },
    { id: `raw-${device.id}-${dateStr}-bmi`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T${String(measureHour).padStart(2, '0')}:15:00.000Z`, timezone: device.timezone, metricType: MetricType.BMI, rawValue: bmi, unit: 'kg/m2' },
  );

  return points;
}

function generateCGMDailyData(
  profile: PatientWearableProfile,
  device: WearableDevice,
  _day: number,
  date: Date,
  rng: SeededRNG,
): RawDeviceDataPoint[] {
  const points: RawDeviceDataPoint[] = [];
  const daysSurgery = daysBetween(profile.surgeryDate, date);
  const recoveryFactor = postSurgeryRecoveryFactor(daysSurgery);
  const dateStr = toISODate(date);

  // CGM provides readings every 5 minutes = 288 per day
  // For simulation efficiency, generate every 30 minutes = 48 per day
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const circadian = circadianFactor(hour);
      // Post-meal spikes around 8, 13, 19
      let mealSpike = 0;
      const hourMinute = hour + minute / 60;
      if (Math.abs(hourMinute - 8.5) < 1) mealSpike = 30 * (1 - Math.abs(hourMinute - 8.5));
      if (Math.abs(hourMinute - 13.5) < 1) mealSpike = 40 * (1 - Math.abs(hourMinute - 13.5));
      if (Math.abs(hourMinute - 19.5) < 1) mealSpike = 35 * (1 - Math.abs(hourMinute - 19.5));

      // Surgery stress elevates glucose
      const stressGlucose = recoveryFactor * 20;
      const diabeticOffset = profile.isDiabetic ? 30 : 0;

      const glucose = clamp(
        Math.round(profile.baselineGlucose + diabeticOffset + stressGlucose +
          (circadian - 0.5) * 10 + mealSpike + rng.gaussian(0, 5)),
        40, 350,
      );

      const ts = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
      points.push({
        id: `raw-${device.id}-${dateStr}-glu-${hour}-${minute}`,
        deviceId: device.id,
        patientId: profile.patientId,
        timestamp: ts,
        timezone: device.timezone,
        metricType: MetricType.BLOOD_GLUCOSE,
        rawValue: glucose,
        unit: 'mg/dL',
      });
    }
  }

  return points;
}

function generateThermometerDailyData(
  profile: PatientWearableProfile,
  device: WearableDevice,
  _day: number,
  date: Date,
  rng: SeededRNG,
): RawDeviceDataPoint[] {
  const points: RawDeviceDataPoint[] = [];
  const daysSurgery = daysBetween(profile.surgeryDate, date);
  const recoveryFactor = postSurgeryRecoveryFactor(daysSurgery);
  const dateStr = toISODate(date);

  // 2-3 readings per day
  const readingHours = [7, 14, 21].slice(0, rng.intRange(2, 3));

  for (const hour of readingHours) {
    const circadian = circadianFactor(hour);
    // Post-surgical low-grade fever in first few days
    const postOpFever = recoveryFactor * 0.8;
    const temp = clamp(
      roundTo(profile.baselineTemp + postOpFever + (circadian - 0.5) * 0.4 + rng.gaussian(0, 0.15), 1),
      35.0, 41.0,
    );

    points.push({
      id: `raw-${device.id}-${dateStr}-temp-${hour}`,
      deviceId: device.id,
      patientId: profile.patientId,
      timestamp: `${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`,
      timezone: device.timezone,
      metricType: MetricType.BODY_TEMPERATURE,
      rawValue: temp,
      unit: 'C',
    });
  }

  return points;
}

function generateActivityTrackerDailyData(
  profile: PatientWearableProfile,
  device: WearableDevice,
  _day: number,
  date: Date,
  rng: SeededRNG,
): RawDeviceDataPoint[] {
  const points: RawDeviceDataPoint[] = [];
  const daysSurgery = daysBetween(profile.surgeryDate, date);
  const recoveryFactor = postSurgeryRecoveryFactor(daysSurgery);
  const dateStr = toISODate(date);

  const stepRecovery = 1 - recoveryFactor * 0.85;
  const steps = clamp(
    Math.round(profile.baselineSteps * stepRecovery * 0.95 + rng.gaussian(0, 350)),
    daysSurgery < 2 ? 80 : 150,
    18000,
  );
  const distance = roundTo(steps * 0.00065, 2);
  const calories = Math.round(steps * 0.035 + 1400 + rng.gaussian(0, 40));

  points.push(
    { id: `raw-${device.id}-${dateStr}-steps`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T23:59:00.000Z`, timezone: device.timezone, metricType: MetricType.STEPS, rawValue: steps, unit: 'steps' },
    { id: `raw-${device.id}-${dateStr}-dist`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T23:59:00.000Z`, timezone: device.timezone, metricType: MetricType.DISTANCE_KM, rawValue: distance, unit: 'km' },
    { id: `raw-${device.id}-${dateStr}-cal`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T23:59:00.000Z`, timezone: device.timezone, metricType: MetricType.CALORIES_BURNED, rawValue: clamp(calories, 800, 3500), unit: 'kcal' },
  );

  // Simple HR readings
  for (let hour = 6; hour < 22; hour += 4) {
    const hr = clamp(
      Math.round(profile.baselineHR + recoveryFactor * 10 + rng.gaussian(0, 4)),
      40, 140,
    );
    points.push({
      id: `raw-${device.id}-${dateStr}-hr-${hour}`,
      deviceId: device.id,
      patientId: profile.patientId,
      timestamp: `${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`,
      timezone: device.timezone,
      metricType: MetricType.HEART_RATE_RESTING,
      rawValue: hr,
      unit: 'bpm',
    });
  }

  // Sleep total only
  const sleepQuality = profile.sleepQualityBase * (1 - recoveryFactor * 0.25);
  const totalSleep = clamp(Math.round(420 * sleepQuality + rng.gaussian(0, 25)), 180, 600);
  points.push({
    id: `raw-${device.id}-${dateStr}-stotal`,
    deviceId: device.id,
    patientId: profile.patientId,
    timestamp: `${dateStr}T06:30:00.000Z`,
    timezone: device.timezone,
    metricType: MetricType.SLEEP_TOTAL_MINUTES,
    rawValue: totalSleep,
    unit: 'min',
  });

  // Activity minutes
  const totalActive = Math.round(steps / 110);
  const moderate = clamp(Math.round(totalActive * rng.range(0.25, 0.4)), 0, 80);
  const light = clamp(totalActive - moderate, 0, 250);

  points.push(
    { id: `raw-${device.id}-${dateStr}-alight`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T23:59:00.000Z`, timezone: device.timezone, metricType: MetricType.ACTIVITY_LIGHT_MINUTES, rawValue: light, unit: 'min' },
    { id: `raw-${device.id}-${dateStr}-amod`, deviceId: device.id, patientId: profile.patientId, timestamp: `${dateStr}T23:59:00.000Z`, timezone: device.timezone, metricType: MetricType.ACTIVITY_MODERATE_MINUTES, rawValue: moderate, unit: 'min' },
  );

  return points;
}

function generateDeviceDailyData(
  profile: PatientWearableProfile,
  device: WearableDevice,
  deviceSpec: DeviceModelSpec,
  day: number,
  date: Date,
  rng: SeededRNG,
): RawDeviceDataPoint[] {
  switch (deviceSpec.type) {
    case DeviceType.SMARTWATCH:
      return generateSmartwatchDailyData(profile, device, day, date, rng);
    case DeviceType.BLOOD_PRESSURE_MONITOR:
      return generateBPMonitorDailyData(profile, device, day, date, rng);
    case DeviceType.PULSE_OXIMETER:
      return generatePulseOximeterDailyData(profile, device, day, date, rng);
    case DeviceType.SMART_SCALE:
      return generateSmartScaleDailyData(profile, device, day, date, rng);
    case DeviceType.CONTINUOUS_GLUCOSE_MONITOR:
      return generateCGMDailyData(profile, device, day, date, rng);
    case DeviceType.SMART_THERMOMETER:
      return generateThermometerDailyData(profile, device, day, date, rng);
    case DeviceType.ACTIVITY_TRACKER:
      return generateActivityTrackerDailyData(profile, device, day, date, rng);
    default:
      return [];
  }
}

// ============================================================================
// Data Processing Pipeline
// ============================================================================

function validateDataPoint(point: RawDeviceDataPoint): { isValid: boolean; qualityScore: number } {
  const range = METRIC_RANGES[point.metricType];
  if (!range) {
    return { isValid: false, qualityScore: 0 };
  }

  // Check hard bounds
  if (point.rawValue < range.min || point.rawValue > range.max) {
    return { isValid: false, qualityScore: 0 };
  }

  // Check outlier bounds
  if (point.rawValue < range.outlierMin || point.rawValue > range.outlierMax) {
    return { isValid: true, qualityScore: 0.4 };
  }

  // Normal range = full quality
  return { isValid: true, qualityScore: 1.0 };
}

function qualityLevelFromScore(score: number): DataQualityLevel {
  if (score >= 0.9) return DataQualityLevel.EXCELLENT;
  if (score >= 0.7) return DataQualityLevel.GOOD;
  if (score >= 0.5) return DataQualityLevel.FAIR;
  if (score > 0) return DataQualityLevel.POOR;
  return DataQualityLevel.INVALID;
}

function normalizeDataPoint(raw: RawDeviceDataPoint): NormalizedDataPoint {
  const validation = validateDataPoint(raw);

  return {
    id: `norm-${raw.id}`,
    sourceRawId: raw.id,
    deviceId: raw.deviceId,
    patientId: raw.patientId,
    timestamp: raw.timestamp,
    utcTimestamp: raw.timestamp,
    metricType: raw.metricType,
    value: raw.rawValue,
    unit: raw.unit,
    qualityScore: validation.qualityScore,
    qualityLevel: qualityLevelFromScore(validation.qualityScore),
    isInterpolated: false,
    isOutlier: validation.qualityScore < 0.5 && validation.qualityScore > 0,
    source: 'device',
  };
}

function interpolateMissingData(
  points: NormalizedDataPoint[],
  metricType: MetricType,
  expectedIntervalMinutes: number,
): NormalizedDataPoint[] {
  const filtered = points
    .filter(p => p.metricType === metricType)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (filtered.length < 2) return [];

  const interpolated: NormalizedDataPoint[] = [];
  const maxGapMinutes = expectedIntervalMinutes * 3;

  for (let i = 0; i < filtered.length - 1; i++) {
    const current = filtered[i];
    const next = filtered[i + 1];
    const currentTime = new Date(current.timestamp).getTime();
    const nextTime = new Date(next.timestamp).getTime();
    const gapMinutes = (nextTime - currentTime) / (1000 * 60);

    if (gapMinutes > expectedIntervalMinutes * 1.5 && gapMinutes <= maxGapMinutes) {
      const numMissing = Math.floor(gapMinutes / expectedIntervalMinutes) - 1;
      for (let j = 1; j <= numMissing; j++) {
        const fraction = j / (numMissing + 1);
        const interpTime = currentTime + fraction * (nextTime - currentTime);
        const interpValue = linearInterpolate(
          currentTime, current.value,
          nextTime, next.value,
          interpTime,
        );
        const interpDate = new Date(interpTime);

        interpolated.push({
          id: `interp-${current.id}-${j}`,
          sourceRawId: current.sourceRawId,
          deviceId: current.deviceId,
          patientId: current.patientId,
          timestamp: interpDate.toISOString(),
          utcTimestamp: interpDate.toISOString(),
          metricType,
          value: roundTo(interpValue, 1),
          unit: current.unit,
          qualityScore: 0.6,
          qualityLevel: DataQualityLevel.FAIR,
          isInterpolated: true,
          isOutlier: false,
          source: 'interpolated',
        });
      }
    }
  }

  return interpolated;
}

function deduplicateData(points: NormalizedDataPoint[]): NormalizedDataPoint[] {
  const seen = new Map<string, NormalizedDataPoint>();

  for (const point of points) {
    const key = `${point.patientId}-${point.metricType}-${point.timestamp}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, point);
    } else {
      // Keep the one with higher quality score
      if (point.qualityScore > existing.qualityScore) {
        seen.set(key, point);
      }
    }
  }

  return Array.from(seen.values());
}

// ============================================================================
// Wearable Integration Service Implementation
// ============================================================================

class WearableIntegrationServiceImpl {
  private devices: Map<string, WearableDevice[]> = new Map();
  private rawData: Map<string, RawDeviceDataPoint[]> = new Map();
  private normalizedData: Map<string, NormalizedDataPoint[]> = new Map();
  private syncRecords: Map<string, SyncRecord[]> = new Map();
  private offlineQueue: Map<string, OfflineQueueEntry[]> = new Map();
  private profiles: Map<string, PatientWearableProfile> = new Map();
  private dataGenerated = false;

  // --------------------------------------------------------------------------
  // Initialization & Data Generation
  // --------------------------------------------------------------------------

  /**
   * Generate a complete simulated dataset for the given number of patients.
   * Each patient gets 30 days of wearable device data across multiple devices.
   */
  generateDataset(patientCount: number = 20, dayCount: number = 30): void {
    this.devices.clear();
    this.rawData.clear();
    this.normalizedData.clear();
    this.syncRecords.clear();
    this.offlineQueue.clear();
    this.profiles.clear();

    for (let i = 0; i < patientCount; i++) {
      const rng = new SeededRNG(42 + i * 1337);
      const profile = generatePatientProfile(i, rng);
      this.profiles.set(profile.patientId, profile);

      const devices = generateDevicesForPatient(profile, rng);
      this.devices.set(profile.patientId, devices);

      const allRaw: RawDeviceDataPoint[] = [];
      const allNormalized: NormalizedDataPoint[] = [];
      const allSyncRecords: SyncRecord[] = [];

      for (const device of devices) {
        const deviceSpec = DEVICE_MODELS.find(
          d => d.brand === device.brand && d.model === device.model,
        );
        if (!deviceSpec) continue;

        for (let day = 0; day < dayCount; day++) {
          const date = new Date(profile.surgeryDate);
          date.setDate(date.getDate() + day);

          // Simulate occasional missed data days (5% chance)
          if (rng.chance(0.05) && day > 2) {
            continue;
          }

          const dailyRaw = generateDeviceDailyData(profile, device, deviceSpec, day, date, rng);
          allRaw.push(...dailyRaw);

          // Normalize each raw point
          for (const raw of dailyRaw) {
            const normalized = normalizeDataPoint(raw);
            allNormalized.push(normalized);
          }
        }

        // Generate sync records
        for (let syncDay = 0; syncDay < dayCount; syncDay += rng.intRange(1, 3)) {
          const syncDate = new Date(profile.surgeryDate);
          syncDate.setDate(syncDate.getDate() + syncDay);

          allSyncRecords.push({
            id: `sync-${device.id}-${syncDay}`,
            deviceId: device.id,
            patientId: profile.patientId,
            syncTimestamp: syncDate.toISOString(),
            status: rng.chance(0.95) ? SyncStatus.SYNCED : SyncStatus.FAILED,
            dataPointCount: rng.intRange(20, 200),
            conflictsResolved: rng.chance(0.1) ? rng.intRange(1, 5) : 0,
            duplicatesRemoved: rng.chance(0.15) ? rng.intRange(1, 10) : 0,
            errorMessage: rng.chance(0.05) ? 'Connection timeout during sync' : undefined,
          });
        }
      }

      // Interpolate missing data for key metrics
      const interpolationMetrics = [
        MetricType.HEART_RATE_RESTING,
        MetricType.BLOOD_OXYGEN,
        MetricType.BLOOD_GLUCOSE,
      ];
      for (const metric of interpolationMetrics) {
        const metricRange = METRIC_RANGES[metric];
        if (!metricRange) continue;
        const intervalMin = metric === MetricType.BLOOD_GLUCOSE ? 30 : 240;
        const interpolated = interpolateMissingData(allNormalized, metric, intervalMin);
        allNormalized.push(...interpolated);
      }

      // Deduplicate
      const deduplicated = deduplicateData(allNormalized);

      this.rawData.set(profile.patientId, allRaw);
      this.normalizedData.set(profile.patientId, deduplicated);
      this.syncRecords.set(profile.patientId, allSyncRecords);
    }

    this.dataGenerated = true;
  }

  /** Lazily initialize on first access */
  private ensureDataGenerated(): void {
    if (!this.dataGenerated) {
      this.generateDataset();
    }
  }

  // --------------------------------------------------------------------------
  // Device Management
  // --------------------------------------------------------------------------

  /**
   * Get all registered devices for a patient.
   */
  getDevices(patientId: string): WearableDevice[] {
    this.ensureDataGenerated();
    return this.devices.get(patientId) ?? [];
  }

  /**
   * Get a specific device by ID.
   */
  getDevice(deviceId: string): WearableDevice | null {
    this.ensureDataGenerated();
    for (const devices of this.devices.values()) {
      const device = devices.find(d => d.id === deviceId);
      if (device) return device;
    }
    return null;
  }

  /**
   * Get all devices of a specific type for a patient.
   */
  getDevicesByType(patientId: string, type: DeviceType): WearableDevice[] {
    return this.getDevices(patientId).filter(d => d.type === type);
  }

  /**
   * Check device battery and connectivity status.
   */
  getDeviceStatus(deviceId: string): {
    battery: number;
    connection: ConnectionStatus;
    isCalibrated: boolean;
    calibrationDue: boolean;
    lastSync: string;
  } | null {
    const device = this.getDevice(deviceId);
    if (!device) return null;

    const now = new Date();
    const calibDue = new Date(device.calibrationDueDate);

    return {
      battery: device.batteryLevel,
      connection: device.connectionStatus,
      isCalibrated: device.isCalibrated,
      calibrationDue: now >= calibDue,
      lastSync: device.lastSyncTimestamp,
    };
  }

  // --------------------------------------------------------------------------
  // Data Ingestion & Retrieval
  // --------------------------------------------------------------------------

  /**
   * Ingest a batch of raw data points. Normalizes, validates, deduplicates,
   * and stores the data.
   */
  ingestBatch(patientId: string, rawPoints: RawDeviceDataPoint[]): {
    accepted: number;
    rejected: number;
    duplicatesRemoved: number;
  } {
    this.ensureDataGenerated();

    const existing = this.normalizedData.get(patientId) ?? [];
    const newNormalized: NormalizedDataPoint[] = [];
    let rejected = 0;

    for (const raw of rawPoints) {
      const validation = validateDataPoint(raw);
      if (!validation.isValid) {
        rejected++;
        continue;
      }
      newNormalized.push(normalizeDataPoint(raw));
    }

    const combined = [...existing, ...newNormalized];
    const deduplicated = deduplicateData(combined);
    const duplicatesRemoved = combined.length - deduplicated.length;

    this.normalizedData.set(patientId, deduplicated);

    const existingRaw = this.rawData.get(patientId) ?? [];
    existingRaw.push(...rawPoints);
    this.rawData.set(patientId, existingRaw);

    return {
      accepted: rawPoints.length - rejected,
      rejected,
      duplicatesRemoved,
    };
  }

  /**
   * Ingest a single real-time data point.
   */
  ingestRealTime(raw: RawDeviceDataPoint): NormalizedDataPoint | null {
    this.ensureDataGenerated();

    const validation = validateDataPoint(raw);
    if (!validation.isValid) return null;

    const normalized = normalizeDataPoint(raw);
    const existing = this.normalizedData.get(raw.patientId) ?? [];
    existing.push(normalized);
    this.normalizedData.set(raw.patientId, existing);

    const existingRaw = this.rawData.get(raw.patientId) ?? [];
    existingRaw.push(raw);
    this.rawData.set(raw.patientId, existingRaw);

    return normalized;
  }

  /**
   * Get normalized data points for a patient, optionally filtered.
   */
  getData(
    patientId: string,
    options?: {
      metricType?: MetricType;
      deviceId?: string;
      startDate?: string;
      endDate?: string;
      includeOutliers?: boolean;
      includeInterpolated?: boolean;
    },
  ): NormalizedDataPoint[] {
    this.ensureDataGenerated();

    let points = this.normalizedData.get(patientId) ?? [];

    if (options?.metricType) {
      points = points.filter(p => p.metricType === options.metricType);
    }
    if (options?.deviceId) {
      points = points.filter(p => p.deviceId === options.deviceId);
    }
    if (options?.startDate) {
      const startMs = new Date(options.startDate).getTime();
      points = points.filter(p => new Date(p.timestamp).getTime() >= startMs);
    }
    if (options?.endDate) {
      const endMs = new Date(options.endDate).getTime();
      points = points.filter(p => new Date(p.timestamp).getTime() <= endMs);
    }
    if (options?.includeOutliers === false) {
      points = points.filter(p => !p.isOutlier);
    }
    if (options?.includeInterpolated === false) {
      points = points.filter(p => !p.isInterpolated);
    }

    return points.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  /**
   * Get the latest reading for each metric type.
   */
  getLatestMetrics(patientId: string): Record<string, NormalizedDataPoint> {
    this.ensureDataGenerated();

    const points = this.normalizedData.get(patientId) ?? [];
    const latest: Record<string, NormalizedDataPoint> = {};

    for (const point of points) {
      const existing = latest[point.metricType];
      if (!existing || new Date(point.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
        latest[point.metricType] = point;
      }
    }

    return latest;
  }

  // --------------------------------------------------------------------------
  // Data Quality Management
  // --------------------------------------------------------------------------

  /**
   * Generate a data quality report for a patient's data over a period.
   */
  getDataQualityReport(
    patientId: string,
    periodStart?: string,
    periodEnd?: string,
  ): DataQualityReport {
    this.ensureDataGenerated();

    const now = new Date();
    const start = periodStart ?? new Date(now.getTime() - 30 * 24 * 3600000).toISOString();
    const end = periodEnd ?? now.toISOString();

    const points = this.getData(patientId, { startDate: start, endDate: end });
    const devices = this.getDevices(patientId);
    const primaryDeviceId = devices[0]?.id ?? '';

    const validPoints = points.filter(p => p.qualityScore > 0);
    const interpolatedPoints = points.filter(p => p.isInterpolated);
    const outlierPoints = points.filter(p => p.isOutlier);

    // Detect gaps in heart rate data (primary metric for gap detection)
    const hrPoints = points
      .filter(p => p.metricType === MetricType.HEART_RATE_RESTING)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const gapIntervals: Array<{ start: string; end: string; durationMinutes: number }> = [];
    for (let i = 0; i < hrPoints.length - 1; i++) {
      const currentTime = new Date(hrPoints[i].timestamp).getTime();
      const nextTime = new Date(hrPoints[i + 1].timestamp).getTime();
      const gapMinutes = (nextTime - currentTime) / (1000 * 60);
      if (gapMinutes > 480) {
        gapIntervals.push({
          start: hrPoints[i].timestamp,
          end: hrPoints[i + 1].timestamp,
          durationMinutes: Math.round(gapMinutes),
        });
      }
    }

    const avgQuality = points.length > 0
      ? roundTo(meanOf(points.map(p => p.qualityScore)), 2)
      : 0;

    return {
      deviceId: primaryDeviceId,
      patientId,
      periodStart: start,
      periodEnd: end,
      totalPoints: points.length,
      validPoints: validPoints.length,
      interpolatedPoints: interpolatedPoints.length,
      outlierPoints: outlierPoints.length,
      missingIntervals: gapIntervals.length,
      averageQualityScore: avgQuality,
      overallQuality: qualityLevelFromScore(avgQuality),
      gapIntervals,
    };
  }

  // --------------------------------------------------------------------------
  // Sync Management
  // --------------------------------------------------------------------------

  /**
   * Get sync history for a patient.
   */
  getSyncHistory(patientId: string, limit?: number): SyncRecord[] {
    this.ensureDataGenerated();
    const records = this.syncRecords.get(patientId) ?? [];
    const sorted = records.sort(
      (a, b) => new Date(b.syncTimestamp).getTime() - new Date(a.syncTimestamp).getTime(),
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get the last successful sync timestamp for each device.
   */
  getLastSyncPerDevice(patientId: string): Record<string, string> {
    this.ensureDataGenerated();
    const records = this.syncRecords.get(patientId) ?? [];
    const lastSync: Record<string, string> = {};

    for (const record of records) {
      if (record.status !== SyncStatus.SYNCED) continue;
      const existing = lastSync[record.deviceId];
      if (!existing || new Date(record.syncTimestamp).getTime() > new Date(existing).getTime()) {
        lastSync[record.deviceId] = record.syncTimestamp;
      }
    }

    return lastSync;
  }

  /**
   * Queue offline data for later sync.
   */
  queueOfflineData(
    deviceId: string,
    patientId: string,
    dataPoints: RawDeviceDataPoint[],
  ): OfflineQueueEntry {
    this.ensureDataGenerated();

    const entry: OfflineQueueEntry = {
      id: `offline-${deviceId}-${Date.now()}`,
      deviceId,
      patientId,
      queuedAt: new Date().toISOString(),
      dataPoints,
      retryCount: 0,
      maxRetries: 5,
    };

    const existing = this.offlineQueue.get(patientId) ?? [];
    existing.push(entry);
    this.offlineQueue.set(patientId, existing);

    return entry;
  }

  /**
   * Process offline queue for a patient, attempting to sync queued data.
   */
  processOfflineQueue(patientId: string): {
    processed: number;
    failed: number;
    remaining: number;
  } {
    this.ensureDataGenerated();

    const queue = this.offlineQueue.get(patientId) ?? [];
    let processed = 0;
    let failed = 0;
    const remaining: OfflineQueueEntry[] = [];

    for (const entry of queue) {
      if (entry.retryCount >= entry.maxRetries) {
        failed++;
        continue;
      }

      const result = this.ingestBatch(patientId, entry.dataPoints);
      if (result.accepted > 0) {
        processed++;

        const syncRecord: SyncRecord = {
          id: `sync-offline-${entry.id}`,
          deviceId: entry.deviceId,
          patientId: entry.patientId,
          syncTimestamp: new Date().toISOString(),
          status: SyncStatus.SYNCED,
          dataPointCount: result.accepted,
          conflictsResolved: 0,
          duplicatesRemoved: result.duplicatesRemoved,
        };
        const records = this.syncRecords.get(patientId) ?? [];
        records.push(syncRecord);
        this.syncRecords.set(patientId, records);
      } else {
        entry.retryCount++;
        remaining.push(entry);
      }
    }

    this.offlineQueue.set(patientId, remaining);

    return { processed, failed, remaining: remaining.length };
  }

  /**
   * Get current offline queue size for a patient.
   */
  getOfflineQueueSize(patientId: string): number {
    return (this.offlineQueue.get(patientId) ?? []).length;
  }

  // --------------------------------------------------------------------------
  // Health Metrics Extraction
  // --------------------------------------------------------------------------

  /**
   * Get daily activity summary for a specific date.
   */
  getDailyActivitySummary(patientId: string, date: string): DailyActivitySummary | null {
    this.ensureDataGenerated();

    const dateStr = date.slice(0, 10);
    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd = `${dateStr}T23:59:59.999Z`;

    const dayData = this.getData(patientId, { startDate: dayStart, endDate: dayEnd });

    if (dayData.length === 0) return null;

    const getLatestValue = (metric: MetricType): number => {
      const metricPoints = dayData.filter(p => p.metricType === metric);
      if (metricPoints.length === 0) return 0;
      return metricPoints[metricPoints.length - 1].value;
    };

    const steps = getLatestValue(MetricType.STEPS);
    const distanceKm = getLatestValue(MetricType.DISTANCE_KM);
    const caloriesBurned = getLatestValue(MetricType.CALORIES_BURNED);
    const lightMinutes = getLatestValue(MetricType.ACTIVITY_LIGHT_MINUTES);
    const moderateMinutes = getLatestValue(MetricType.ACTIVITY_MODERATE_MINUTES);
    const vigorousMinutes = getLatestValue(MetricType.ACTIVITY_VIGOROUS_MINUTES);
    const activeMinutesTotal = lightMinutes + moderateMinutes + vigorousMinutes;
    const sedentaryMinutes = Math.max(0, 960 - activeMinutesTotal);

    const profile = this.profiles.get(patientId);
    const goalSteps = profile ? profile.baselineSteps : 8000;
    const goalCompletion = roundTo(Math.min(steps / goalSteps, 2.0) * 100, 1);

    return {
      patientId,
      date: dateStr,
      steps,
      distanceKm,
      caloriesBurned,
      lightMinutes,
      moderateMinutes,
      vigorousMinutes,
      sedentaryMinutes,
      activeMinutesTotal,
      goalCompletion,
    };
  }

  /**
   * Get sleep analysis for a specific date.
   */
  getSleepAnalysis(patientId: string, date: string): SleepAnalysis | null {
    this.ensureDataGenerated();

    const dateStr = date.slice(0, 10);
    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd = `${dateStr}T23:59:59.999Z`;

    const dayData = this.getData(patientId, { startDate: dayStart, endDate: dayEnd });

    const getMetricValue = (metric: MetricType): number => {
      const points = dayData.filter(p => p.metricType === metric);
      return points.length > 0 ? points[0].value : 0;
    };

    const totalMinutes = getMetricValue(MetricType.SLEEP_TOTAL_MINUTES);
    if (totalMinutes === 0) return null;

    const deepMinutes = getMetricValue(MetricType.SLEEP_DEEP_MINUTES);
    const lightMinutes = getMetricValue(MetricType.SLEEP_LIGHT_MINUTES);
    const remMinutes = getMetricValue(MetricType.SLEEP_REM_MINUTES);
    const awakeMinutes = getMetricValue(MetricType.SLEEP_AWAKE_MINUTES);

    const sleepEfficiency = totalMinutes > 0
      ? roundTo(((totalMinutes - awakeMinutes) / totalMinutes) * 100, 1)
      : 0;

    let qualityRating: SleepQualityRating;
    if (sleepEfficiency >= 90 && totalMinutes >= 420) {
      qualityRating = SleepQualityRating.EXCELLENT;
    } else if (sleepEfficiency >= 80 && totalMinutes >= 360) {
      qualityRating = SleepQualityRating.GOOD;
    } else if (sleepEfficiency >= 70 && totalMinutes >= 300) {
      qualityRating = SleepQualityRating.FAIR;
    } else if (sleepEfficiency >= 60) {
      qualityRating = SleepQualityRating.POOR;
    } else {
      qualityRating = SleepQualityRating.VERY_POOR;
    }

    // Estimate bed/wake times
    const bedtimeHour = 22 + Math.round((480 - totalMinutes) / 60);
    const wakeMinute = totalMinutes % 60;
    const wakeHour = (bedtimeHour + Math.floor(totalMinutes / 60)) % 24;

    return {
      patientId,
      date: dateStr,
      totalMinutes,
      deepMinutes,
      lightMinutes,
      remMinutes,
      awakeMinutes,
      sleepEfficiency,
      qualityRating,
      bedtime: `${dateStr}T${String(clamp(bedtimeHour, 20, 23)).padStart(2, '0')}:30:00.000Z`,
      wakeTime: `${dateStr}T${String(clamp(wakeHour, 5, 10)).padStart(2, '0')}:${String(wakeMinute).padStart(2, '0')}:00.000Z`,
      numberOfWakeups: Math.max(0, Math.round(awakeMinutes / 15)),
    };
  }

  /**
   * Get HRV analysis for a specific date.
   */
  getHRVAnalysis(patientId: string, date: string): HRVAnalysis | null {
    this.ensureDataGenerated();

    const dateStr = date.slice(0, 10);
    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd = `${dateStr}T23:59:59.999Z`;

    const hrvPoints = this.getData(patientId, {
      metricType: MetricType.HEART_RATE_VARIABILITY,
      startDate: dayStart,
      endDate: dayEnd,
    });

    if (hrvPoints.length === 0) return null;

    const latestHRV = hrvPoints[hrvPoints.length - 1];
    const rmssd = latestHRV.value;

    // Estimate SDNN from RMSSD (approximate: SDNN ~ RMSSD * 1.3)
    const sdnn = roundTo(rmssd * 1.3, 1);

    // Stress level: inversely proportional to HRV
    const stressLevel = clamp(Math.round(100 - rmssd * 1.2), 0, 100);

    let stressCategory: 'low' | 'moderate' | 'high' | 'very_high';
    if (stressLevel < 25) stressCategory = 'low';
    else if (stressLevel < 50) stressCategory = 'moderate';
    else if (stressLevel < 75) stressCategory = 'high';
    else stressCategory = 'very_high';

    // Recovery score: 0-100 based on HRV relative to baseline
    const profile = this.profiles.get(patientId);
    const baselineHRV = profile?.baselineHRV ?? 45;
    const recoveryScore = clamp(Math.round((rmssd / baselineHRV) * 100), 0, 100);
    const comparedToBaseline = roundTo(((rmssd - baselineHRV) / baselineHRV) * 100, 1);

    return {
      patientId,
      timestamp: latestHRV.timestamp,
      rmssd,
      sdnn,
      stressLevel,
      stressCategory,
      recoveryScore,
      comparedToBaseline,
    };
  }

  // --------------------------------------------------------------------------
  // Recovery-Specific Metrics
  // --------------------------------------------------------------------------

  /**
   * Generate the post-surgery activity recovery curve for a patient.
   * Compares actual steps/activity to expected recovery trajectory.
   */
  getRecoveryCurve(patientId: string): RecoveryCurvePoint[] {
    this.ensureDataGenerated();

    const profile = this.profiles.get(patientId);
    if (!profile) return [];

    const curve: RecoveryCurvePoint[] = [];

    for (let day = 0; day < 30; day++) {
      const date = new Date(profile.surgeryDate);
      date.setDate(date.getDate() + day);
      const dateStr = toISODate(date);

      const activity = this.getDailyActivitySummary(patientId, dateStr);
      const actualSteps = activity?.steps ?? 0;
      const actualActive = activity?.activeMinutesTotal ?? 0;

      const expectedSteps = expectedStepRecovery(day);
      const expectedActive = expectedActiveMinutesRecovery(day);
      const percentOfExpected = expectedSteps > 0
        ? roundTo((actualSteps / expectedSteps) * 100, 1)
        : 0;

      let phase: RecoveryPhase;
      if (day <= 3) phase = RecoveryPhase.ACUTE;
      else if (day <= 7) phase = RecoveryPhase.EARLY;
      else if (day <= 14) phase = RecoveryPhase.INTERMEDIATE;
      else if (day <= 21) phase = RecoveryPhase.ADVANCED;
      else phase = RecoveryPhase.FULL_RECOVERY;

      curve.push({
        dayPostSurgery: day,
        date: dateStr,
        steps: actualSteps,
        activeMinutes: actualActive,
        expectedSteps,
        expectedActiveMinutes: expectedActive,
        percentOfExpected,
        phase,
      });
    }

    return curve;
  }

  /**
   * Get step count recovery milestones and their status for a patient.
   */
  getStepMilestones(patientId: string): StepMilestone[] {
    this.ensureDataGenerated();

    const profile = this.profiles.get(patientId);
    if (!profile) return [];

    const milestones: StepMilestone[] = STEP_MILESTONES.map(m => ({
      name: m.name,
      targetSteps: m.targetSteps,
      status: MilestoneStatus.NOT_STARTED,
      expectedDay: m.expectedDay,
    }));

    // Check each day's step count against milestones
    for (let day = 0; day < 30; day++) {
      const date = new Date(profile.surgeryDate);
      date.setDate(date.getDate() + day);
      const dateStr = toISODate(date);

      const activity = this.getDailyActivitySummary(patientId, dateStr);
      if (!activity) continue;

      for (const milestone of milestones) {
        if (milestone.status === MilestoneStatus.ACHIEVED) continue;

        if (activity.steps >= milestone.targetSteps) {
          milestone.status = MilestoneStatus.ACHIEVED;
          milestone.achievedDate = dateStr;
          milestone.dayPostSurgery = day;
        } else if (activity.steps >= milestone.targetSteps * 0.7) {
          milestone.status = MilestoneStatus.IN_PROGRESS;
        }
      }
    }

    // Check for regression (achieved but then fell below for 3+ days)
    for (const milestone of milestones) {
      if (milestone.status !== MilestoneStatus.ACHIEVED || !milestone.dayPostSurgery) continue;

      let belowDays = 0;
      for (let day = milestone.dayPostSurgery + 1; day < 30; day++) {
        const date = new Date(profile.surgeryDate);
        date.setDate(date.getDate() + day);
        const dateStr = toISODate(date);

        const activity = this.getDailyActivitySummary(patientId, dateStr);
        if (activity && activity.steps < milestone.targetSteps * 0.6) {
          belowDays++;
        } else {
          belowDays = 0;
        }

        if (belowDays >= 3) {
          milestone.status = MilestoneStatus.REGRESSED;
          break;
        }
      }
    }

    return milestones;
  }

  /**
   * Analyze the impact of sleep quality on recovery progress.
   */
  getSleepRecoveryImpact(patientId: string): SleepRecoveryImpact | null {
    this.ensureDataGenerated();

    const profile = this.profiles.get(patientId);
    if (!profile) return null;

    const sleepAnalyses: SleepAnalysis[] = [];
    const activitySummaries: DailyActivitySummary[] = [];

    for (let day = 0; day < 30; day++) {
      const date = new Date(profile.surgeryDate);
      date.setDate(date.getDate() + day);
      const dateStr = toISODate(date);

      const sleep = this.getSleepAnalysis(patientId, dateStr);
      if (sleep) sleepAnalyses.push(sleep);

      const activity = this.getDailyActivitySummary(patientId, dateStr);
      if (activity) activitySummaries.push(activity);
    }

    if (sleepAnalyses.length < 5) return null;

    const avgSleepQuality = roundTo(
      meanOf(sleepAnalyses.map(s => s.sleepEfficiency)),
      1,
    );
    const avgSleepDuration = roundTo(
      meanOf(sleepAnalyses.map(s => s.totalMinutes)) / 60,
      1,
    );

    // Sleep quality trend: compare first half vs second half
    const half = Math.floor(sleepAnalyses.length / 2);
    const firstHalfQuality = meanOf(sleepAnalyses.slice(0, half).map(s => s.sleepEfficiency));
    const secondHalfQuality = meanOf(sleepAnalyses.slice(half).map(s => s.sleepEfficiency));
    const qualityChange = secondHalfQuality - firstHalfQuality;

    let sleepQualityTrend: 'improving' | 'stable' | 'declining';
    if (qualityChange > 3) sleepQualityTrend = 'improving';
    else if (qualityChange < -3) sleepQualityTrend = 'declining';
    else sleepQualityTrend = 'stable';

    // Correlate sleep quality with next-day activity
    let correlationSum = 0;
    let correlationCount = 0;
    for (let i = 1; i < Math.min(sleepAnalyses.length, activitySummaries.length); i++) {
      const sleepQual = sleepAnalyses[i - 1].sleepEfficiency / 100;
      const activityLevel = activitySummaries[i].steps / 10000;
      correlationSum += sleepQual * activityLevel;
      correlationCount++;
    }
    const recoveryCorrelation = correlationCount > 0
      ? roundTo(correlationSum / correlationCount, 3)
      : 0;

    const poorSleepDays = sleepAnalyses.filter(
      s => s.qualityRating === SleepQualityRating.POOR || s.qualityRating === SleepQualityRating.VERY_POOR,
    ).length;
    const goodSleepDays = sleepAnalyses.filter(
      s => s.qualityRating === SleepQualityRating.EXCELLENT || s.qualityRating === SleepQualityRating.GOOD,
    ).length;

    let impactSummary: string;
    if (avgSleepQuality >= 80 && poorSleepDays <= 3) {
      impactSummary = 'Sleep quality has been supportive of recovery. Consistent good sleep is positively correlated with activity levels and healing progress.';
    } else if (avgSleepQuality >= 65) {
      impactSummary = `Sleep quality is moderate with ${poorSleepDays} poor sleep nights in the recovery period. Some improvement in sleep hygiene could benefit recovery trajectory.`;
    } else {
      impactSummary = `Sleep quality has been suboptimal (${poorSleepDays} poor sleep nights) which may be impeding recovery. Consider addressing sleep disruptions, pain management timing, and sleep environment.`;
    }

    const startDate = toISODate(profile.surgeryDate);
    const endDate = new Date(profile.surgeryDate);
    endDate.setDate(endDate.getDate() + 29);

    return {
      patientId,
      periodStart: startDate,
      periodEnd: toISODate(endDate),
      averageSleepQuality: avgSleepQuality,
      averageSleepDuration: avgSleepDuration,
      sleepQualityTrend,
      recoveryCorrelation,
      poorSleepDays,
      goodSleepDays,
      impactSummary,
    };
  }

  /**
   * Get HRV-based stress tracking records over the recovery period.
   */
  getStressTracking(patientId: string): StressTrackingRecord[] {
    this.ensureDataGenerated();

    const profile = this.profiles.get(patientId);
    if (!profile) return [];

    const records: StressTrackingRecord[] = [];

    for (let day = 0; day < 30; day++) {
      const date = new Date(profile.surgeryDate);
      date.setDate(date.getDate() + day);
      const dateStr = toISODate(date);

      const hrvAnalysis = this.getHRVAnalysis(patientId, dateStr);
      if (!hrvAnalysis) continue;

      // Get stress readings for the day
      const stressPoints = this.getData(patientId, {
        metricType: MetricType.STRESS_LEVEL,
        startDate: `${dateStr}T00:00:00.000Z`,
        endDate: `${dateStr}T23:59:59.999Z`,
      });

      const stressValues = stressPoints.map(p => p.value);
      const avgStress = stressValues.length > 0 ? roundTo(meanOf(stressValues), 1) : hrvAnalysis.stressLevel;
      const peakStress = stressValues.length > 0 ? Math.max(...stressValues) : avgStress;

      // Morning vs evening HRV
      const morningHRV = hrvAnalysis.rmssd;
      // Simulate evening HRV as slightly lower due to daily fatigue
      const eveningHRV = roundTo(morningHRV * 0.85, 1);

      let stressCategory: 'low' | 'moderate' | 'high' | 'very_high';
      if (avgStress < 25) stressCategory = 'low';
      else if (avgStress < 50) stressCategory = 'moderate';
      else if (avgStress < 75) stressCategory = 'high';
      else stressCategory = 'very_high';

      let recoveryImpact: 'positive' | 'neutral' | 'negative';
      if (avgStress < 35) recoveryImpact = 'positive';
      else if (avgStress < 60) recoveryImpact = 'neutral';
      else recoveryImpact = 'negative';

      records.push({
        patientId,
        date: dateStr,
        morningHRV,
        eveningHRV,
        averageStressLevel: avgStress,
        peakStressLevel: peakStress,
        stressCategory,
        recoveryImpact,
      });
    }

    return records;
  }

  // --------------------------------------------------------------------------
  // Comprehensive Patient Summary
  // --------------------------------------------------------------------------

  /**
   * Get a comprehensive wearable data summary for a patient.
   */
  getPatientSummary(patientId: string): PatientWearableSummary | null {
    this.ensureDataGenerated();

    const profile = this.profiles.get(patientId);
    if (!profile) return null;

    const devices = this.getDevices(patientId);
    const latestMetrics = this.getLatestMetrics(patientId);

    // Today's data (use last day of generated data)
    const lastDate = new Date(profile.surgeryDate);
    lastDate.setDate(lastDate.getDate() + 29);
    const lastDateStr = toISODate(lastDate);

    const todayActivity = this.getDailyActivitySummary(patientId, lastDateStr);
    const lastSleep = this.getSleepAnalysis(patientId, lastDateStr);
    const latestHRV = this.getHRVAnalysis(patientId, lastDateStr);
    const recoveryCurve = this.getRecoveryCurve(patientId);
    const milestones = this.getStepMilestones(patientId);
    const sleepImpact = this.getSleepRecoveryImpact(patientId);
    const dataQuality = this.getDataQualityReport(patientId);
    const syncHistory = this.getSyncHistory(patientId, 10);

    return {
      patientId,
      devices,
      latestMetrics,
      todayActivity,
      lastSleep,
      latestHRV,
      recoveryCurve,
      milestones,
      sleepImpact,
      dataQuality,
      syncHistory,
    };
  }

  // --------------------------------------------------------------------------
  // Aggregate & Statistics
  // --------------------------------------------------------------------------

  /**
   * Get all tracked patient IDs.
   */
  getPatientIds(): string[] {
    this.ensureDataGenerated();
    return Array.from(this.profiles.keys());
  }

  /**
   * Get dataset statistics across all patients.
   */
  getDatasetStatistics(): {
    totalPatients: number;
    totalDevices: number;
    totalRawDataPoints: number;
    totalNormalizedDataPoints: number;
    totalSyncRecords: number;
    deviceTypeDistribution: Record<string, number>;
    averageDataPointsPerPatient: number;
    averageDevicesPerPatient: number;
    dataQualityDistribution: Record<string, number>;
  } {
    this.ensureDataGenerated();

    const totalPatients = this.profiles.size;
    let totalDevices = 0;
    let totalRaw = 0;
    let totalNormalized = 0;
    let totalSyncs = 0;
    const deviceTypeCounts: Record<string, number> = {};
    const qualityCounts: Record<string, number> = {
      [DataQualityLevel.EXCELLENT]: 0,
      [DataQualityLevel.GOOD]: 0,
      [DataQualityLevel.FAIR]: 0,
      [DataQualityLevel.POOR]: 0,
      [DataQualityLevel.INVALID]: 0,
    };

    for (const patientId of this.profiles.keys()) {
      const devices = this.devices.get(patientId) ?? [];
      totalDevices += devices.length;

      for (const device of devices) {
        deviceTypeCounts[device.type] = (deviceTypeCounts[device.type] ?? 0) + 1;
      }

      totalRaw += (this.rawData.get(patientId) ?? []).length;

      const normalized = this.normalizedData.get(patientId) ?? [];
      totalNormalized += normalized.length;

      for (const point of normalized) {
        qualityCounts[point.qualityLevel] = (qualityCounts[point.qualityLevel] ?? 0) + 1;
      }

      totalSyncs += (this.syncRecords.get(patientId) ?? []).length;
    }

    return {
      totalPatients,
      totalDevices,
      totalRawDataPoints: totalRaw,
      totalNormalizedDataPoints: totalNormalized,
      totalSyncRecords: totalSyncs,
      deviceTypeDistribution: deviceTypeCounts,
      averageDataPointsPerPatient: totalPatients > 0 ? Math.round(totalNormalized / totalPatients) : 0,
      averageDevicesPerPatient: totalPatients > 0 ? roundTo(totalDevices / totalPatients, 1) : 0,
      dataQualityDistribution: qualityCounts,
    };
  }

  /**
   * Get metric values over a date range as a simple time series.
   */
  getMetricTimeSeries(
    patientId: string,
    metricType: MetricType,
    startDate?: string,
    endDate?: string,
  ): Array<{ timestamp: string; value: number }> {
    const points = this.getData(patientId, {
      metricType,
      startDate,
      endDate,
      includeOutliers: false,
    });

    return points.map(p => ({
      timestamp: p.timestamp,
      value: p.value,
    }));
  }

  /**
   * Clear all data. Useful for testing.
   */
  clearAll(): void {
    this.devices.clear();
    this.rawData.clear();
    this.normalizedData.clear();
    this.syncRecords.clear();
    this.offlineQueue.clear();
    this.profiles.clear();
    this.dataGenerated = false;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Singleton instance of the wearable integration service. */
export const wearableIntegrationService = new WearableIntegrationServiceImpl();

/** Export class for testing. */
export { WearableIntegrationServiceImpl };
