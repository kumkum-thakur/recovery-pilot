/**
 * Pain Tracking and Prediction Service
 *
 * Provides comprehensive pain tracking, pattern analysis, prediction,
 * alerting, and reporting for post-surgical recovery monitoring.
 *
 * Features:
 *  - Pain entry system with NRS 0-10 scale, body map, quality descriptors
 *  - Daily/weekly trend analysis with moving averages
 *  - Activity, medication, weather, and sleep correlation
 *  - Linear regression prediction model (from scratch, no external deps)
 *  - Alert system for escalation, breakthrough pain, medication overuse
 *  - Doctor-visit pain summary reports
 *  - Realistic 30-patient, 4-week seed dataset
 */

// ============================================================================
// Const-object enums (erasableSyntaxOnly compatible)
// ============================================================================

export const PainQuality = {
  SHARP: 'sharp',
  DULL: 'dull',
  BURNING: 'burning',
  THROBBING: 'throbbing',
  ACHING: 'aching',
  STABBING: 'stabbing',
  RADIATING: 'radiating',
} as const;
export type PainQuality = typeof PainQuality[keyof typeof PainQuality];

export const PainTiming = {
  CONSTANT: 'constant',
  INTERMITTENT: 'intermittent',
  ACTIVITY_RELATED: 'activity_related',
} as const;
export type PainTiming = typeof PainTiming[keyof typeof PainTiming];

export const BodyLocation = {
  HEAD: 'head',
  NECK: 'neck',
  LEFT_SHOULDER: 'left_shoulder',
  RIGHT_SHOULDER: 'right_shoulder',
  UPPER_BACK: 'upper_back',
  LOWER_BACK: 'lower_back',
  CHEST: 'chest',
  ABDOMEN: 'abdomen',
  LEFT_ARM: 'left_arm',
  RIGHT_ARM: 'right_arm',
  LEFT_HAND: 'left_hand',
  RIGHT_HAND: 'right_hand',
  LEFT_HIP: 'left_hip',
  RIGHT_HIP: 'right_hip',
  LEFT_KNEE: 'left_knee',
  RIGHT_KNEE: 'right_knee',
  LEFT_ANKLE: 'left_ankle',
  RIGHT_ANKLE: 'right_ankle',
  LEFT_FOOT: 'left_foot',
  RIGHT_FOOT: 'right_foot',
  SURGICAL_SITE: 'surgical_site',
} as const;
export type BodyLocation = typeof BodyLocation[keyof typeof BodyLocation];

export const TimeOfDay = {
  EARLY_MORNING: 'early_morning',   // 05:00 - 08:00
  MORNING: 'morning',               // 08:00 - 12:00
  AFTERNOON: 'afternoon',           // 12:00 - 17:00
  EVENING: 'evening',               // 17:00 - 21:00
  NIGHT: 'night',                   // 21:00 - 05:00
} as const;
export type TimeOfDay = typeof TimeOfDay[keyof typeof TimeOfDay];

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;
export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

export const AlertType = {
  PAIN_ESCALATION: 'pain_escalation',
  BREAKTHROUGH_PAIN: 'breakthrough_pain',
  MEDICATION_OVERUSE: 'medication_overuse',
  ABOVE_EXPECTED_CURVE: 'above_expected_curve',
  SLEEP_CORRELATION: 'sleep_correlation',
} as const;
export type AlertType = typeof AlertType[keyof typeof AlertType];

// ============================================================================
// Data models
// ============================================================================

/** Factors that worsen or relieve pain. */
export interface PainFactors {
  aggravating: string[];
  alleviating: string[];
}

/** Context surrounding a pain entry. */
export interface PainContext {
  timeOfDay: TimeOfDay;
  activity: string;
  medicationTaken: boolean;
  medicationName?: string;
  minutesSinceMedication?: number;
  sleepQualityLastNight?: number;   // 1-10
  sleepHoursLastNight?: number;
  weatherCondition?: string;        // e.g. "sunny", "rainy", "cold", "humid"
  stressLevel?: number;             // 1-10
}

/** A single pain entry recorded by the patient. */
export interface PainEntry {
  id: string;
  patientId: string;
  timestamp: string;                // ISO-8601
  intensity: number;                // 0-10 NRS
  locations: BodyLocation[];
  quality: PainQuality[];
  timing: PainTiming;
  factors: PainFactors;
  context: PainContext;
  notes?: string;
}

/** Statistical summary for a collection of pain entries. */
export interface PainStatistics {
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  count: number;
}

/** A single data point in a time-series trend. */
export interface TrendPoint {
  date: string;
  value: number;
  movingAverage?: number;
}

/** Daily pain trend including raw and smoothed values. */
export interface DailyTrend {
  points: TrendPoint[];
  overallDirection: 'improving' | 'stable' | 'worsening';
  percentChange: number;
}

/** Time-of-day pattern analysis result. */
export interface TimeOfDayPattern {
  timeOfDay: TimeOfDay;
  averageIntensity: number;
  entryCount: number;
}

/** Correlation between an activity and pain intensity. */
export interface ActivityCorrelation {
  activity: string;
  averagePainDuring: number;
  averagePainWithout: number;
  difference: number;             // positive = activity increases pain
  occurrences: number;
}

/** Medication effectiveness measurement. */
export interface MedicationEffectiveness {
  medicationName: string;
  averagePainBefore: number;
  averagePainAfter: number;
  averageReduction: number;
  effectivenessPercent: number;   // 0-100
  sampleSize: number;
}

/** Weather correlation result. */
export interface WeatherCorrelation {
  condition: string;
  averagePain: number;
  entryCount: number;
}

/** Sleep correlation result. */
export interface SleepCorrelation {
  qualityBucket: string;          // e.g. "poor (1-3)", "fair (4-6)", "good (7-10)"
  averagePain: number;
  entryCount: number;
}

/** Prediction result from the linear-regression model. */
export interface PainPrediction {
  predictedIntensity: number;     // 0-10
  confidenceInterval: { lower: number; upper: number };
  confidence: number;             // 0-1 (R^2 of the model)
  features: Record<string, number>;
  date: string;                   // ISO date the prediction is for
}

/** An alert generated by the monitoring system. */
export interface PainAlert {
  id: string;
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  data?: Record<string, unknown>;
}

/** Expected pain curve point for a surgery type (for comparison). */
export interface ExpectedPainCurvePoint {
  dayPostSurgery: number;
  expectedIntensity: number;
  upperBound: number;
  lowerBound: number;
}

/** Pain report for doctor visits. */
export interface PainReport {
  patientId: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  statistics: PainStatistics;
  dailyTrend: DailyTrend;
  timeOfDayPatterns: TimeOfDayPattern[];
  topAggravatingFactors: string[];
  topAlleviatingFactors: string[];
  medicationEffectiveness: MedicationEffectiveness[];
  activityCorrelations: ActivityCorrelation[];
  alerts: PainAlert[];
  prediction: PainPrediction | null;
  summary: string;
}

// ============================================================================
// Deterministic seeded PRNG (xorshift32) -- avoids Math.random for
// reproducible datasets
// ============================================================================

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0 || 1;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let s = this.state;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    this.state = s;
    return (s >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a float in [min, max). */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Pick a random element from an array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  /** Pick N unique elements from an array. */
  pickN<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const result: T[] = [];
    const count = Math.min(n, copy.length);
    for (let i = 0; i < count; i++) {
      const idx = this.int(0, copy.length - 1);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return result;
  }

  /** Normal distribution via Box-Muller transform. */
  normal(mean: number, stddev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stddev;
  }
}

// ============================================================================
// Utility helpers
// ============================================================================

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const timestamp = Date.now().toString(36);
  id += timestamp;
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const squaredDiffs = values.map((v) => (v - m) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

function computeStats(values: number[]): PainStatistics {
  return {
    mean: Math.round(mean(values) * 100) / 100,
    median: Math.round(median(values) * 100) / 100,
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    standardDeviation: Math.round(standardDeviation(values) * 100) / 100,
    count: values.length,
  };
}

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return TimeOfDay.EARLY_MORNING;
  if (hour >= 8 && hour < 12) return TimeOfDay.MORNING;
  if (hour >= 12 && hour < 17) return TimeOfDay.AFTERNOON;
  if (hour >= 17 && hour < 21) return TimeOfDay.EVENING;
  return TimeOfDay.NIGHT;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// Linear Regression (from scratch)
// ============================================================================

interface RegressionModel {
  weights: number[];
  bias: number;
  rSquared: number;
  featureNames: string[];
  residualStdDev: number;
}

/**
 * Ordinary Least Squares via the normal equation:
 *   w = (X^T X)^{-1} X^T y
 *
 * Includes bias column automatically.
 */
function trainLinearRegression(
  features: number[][],
  targets: number[],
  featureNames: string[]
): RegressionModel {
  const n = features.length;
  const p = features[0]?.length ?? 0;

  if (n === 0 || p === 0) {
    return { weights: [], bias: 0, rSquared: 0, featureNames, residualStdDev: 0 };
  }

  // Augment with bias column
  const X: number[][] = features.map((row) => [...row, 1]);
  const cols = p + 1;

  // X^T X  (cols x cols)
  const XtX: number[][] = Array.from({ length: cols }, () =>
    new Array(cols).fill(0)
  );
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      XtX[i][j] = sum;
    }
  }

  // X^T y  (cols x 1)
  const Xty: number[] = new Array(cols).fill(0);
  for (let i = 0; i < cols; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * targets[k];
    }
    Xty[i] = sum;
  }

  // Invert XtX using Gauss-Jordan elimination
  const inv = invertMatrix(XtX);
  if (!inv) {
    // Singular matrix -- fall back to mean prediction
    const avgTarget = mean(targets);
    return {
      weights: new Array(p).fill(0),
      bias: avgTarget,
      rSquared: 0,
      featureNames,
      residualStdDev: standardDeviation(targets),
    };
  }

  // w = inv(X^T X) * X^T y
  const w: number[] = new Array(cols).fill(0);
  for (let i = 0; i < cols; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += inv[i][j] * Xty[j];
    }
    w[i] = sum;
  }

  const weights = w.slice(0, p);
  const bias = w[p];

  // Compute R^2
  const predictions = features.map((row) =>
    row.reduce((acc, val, idx) => acc + val * weights[idx], bias)
  );
  const ssRes = predictions.reduce(
    (acc, pred, idx) => acc + (targets[idx] - pred) ** 2,
    0
  );
  const yMean = mean(targets);
  const ssTot = targets.reduce((acc, y) => acc + (y - yMean) ** 2, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Residual standard deviation for confidence intervals
  const residuals = predictions.map((pred, idx) => targets[idx] - pred);
  const residualStdDev = standardDeviation(residuals);

  return { weights, bias, rSquared: Math.max(0, rSquared), featureNames, residualStdDev };
}

function predictWithModel(
  model: RegressionModel,
  featureValues: number[]
): { prediction: number; lower: number; upper: number } {
  const raw = featureValues.reduce(
    (acc, val, idx) => acc + val * (model.weights[idx] ?? 0),
    model.bias
  );
  const prediction = clamp(Math.round(raw * 10) / 10, 0, 10);
  // ~95% confidence interval
  const margin = 1.96 * model.residualStdDev;
  return {
    prediction,
    lower: clamp(Math.round((raw - margin) * 10) / 10, 0, 10),
    upper: clamp(Math.round((raw + margin) * 10) / 10, 0, 10),
  };
}

/** Gauss-Jordan matrix inversion. Returns null if singular. */
function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  // Augment with identity
  const aug: number[][] = matrix.map((row, i) => {
    const identityRow = new Array(n).fill(0);
    identityRow[i] = 1;
    return [...row, ...identityRow];
  });

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-12) return null; // singular

    // Swap
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Scale pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate column
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  return aug.map((row) => row.slice(n));
}

// ============================================================================
// Expected post-surgical pain curves
// ============================================================================

/**
 * Generic expected pain curve for post-surgical recovery (28 days).
 * Based on published orthopedic surgery recovery literature.
 * Pain typically peaks day 1-2 post-op and declines exponentially.
 */
function getExpectedPainCurve(): ExpectedPainCurvePoint[] {
  const curve: ExpectedPainCurvePoint[] = [];
  for (let day = 0; day <= 28; day++) {
    // Exponential decay: peak ~7.5 on day 1, settling around 2 by day 28
    const expected = 2 + 5.5 * Math.exp(-0.12 * day);
    const band = 1.2 + 0.3 * Math.exp(-0.05 * day); // band widens early
    curve.push({
      dayPostSurgery: day,
      expectedIntensity: Math.round(expected * 10) / 10,
      upperBound: Math.round((expected + band) * 10) / 10,
      lowerBound: Math.round(Math.max(0, expected - band) * 10) / 10,
    });
  }
  return curve;
}

// ============================================================================
// Seed data generator (30 patients x 28 days)
// ============================================================================

const ACTIVITIES = [
  'resting', 'walking', 'physical_therapy', 'climbing_stairs',
  'sitting', 'standing', 'sleeping', 'showering', 'driving',
  'light_housework', 'stretching', 'reading',
] as const;

const MEDICATIONS = [
  'Acetaminophen 500mg', 'Ibuprofen 400mg', 'Oxycodone 5mg',
  'Tramadol 50mg', 'Gabapentin 300mg', 'Naproxen 500mg',
] as const;

const AGGRAVATING_FACTORS = [
  'movement', 'coughing', 'deep_breathing', 'bending',
  'lifting', 'prolonged_sitting', 'cold_weather', 'stress',
  'poor_sleep', 'skipped_medication',
] as const;

const ALLEVIATING_FACTORS = [
  'rest', 'ice', 'heat', 'elevation', 'medication',
  'gentle_movement', 'deep_breathing_exercises', 'massage',
  'distraction', 'sleep',
] as const;

const WEATHER_CONDITIONS = [
  'sunny', 'cloudy', 'rainy', 'cold', 'humid', 'windy', 'stormy',
] as const;

const SURGERY_LOCATIONS: BodyLocation[] = [
  BodyLocation.RIGHT_KNEE,
  BodyLocation.LEFT_KNEE,
  BodyLocation.RIGHT_HIP,
  BodyLocation.LEFT_HIP,
  BodyLocation.LOWER_BACK,
  BodyLocation.RIGHT_SHOULDER,
  BodyLocation.LEFT_SHOULDER,
  BodyLocation.ABDOMEN,
  BodyLocation.SURGICAL_SITE,
];

/**
 * Generates a realistic set of pain entries for a single patient over
 * `daysCount` post-surgical days. Entries exhibit:
 *   - Exponential decay of baseline pain
 *   - Morning stiffness spikes
 *   - Activity-related flares
 *   - Medication relief effects
 *   - Day-of-week variation (weekends = more rest)
 *   - Random breakthrough pain episodes
 */
function generatePatientData(
  patientId: string,
  patientSeed: number,
  surgeryDate: Date,
  daysCount: number
): PainEntry[] {
  const rng = new SeededRandom(patientSeed);
  const entries: PainEntry[] = [];

  // Patient-specific parameters
  const basePainSensitivity = rng.float(0.8, 1.3);  // individual variation
  const healingRate = rng.float(0.08, 0.18);         // how fast pain decays
  const morningStiffness = rng.float(0.5, 2.0);      // extra AM pain
  const primaryLocation = rng.pick(SURGERY_LOCATIONS);
  const secondaryLocation = rng.pick(
    SURGERY_LOCATIONS.filter((l) => l !== primaryLocation)
  );
  const primaryMedication = rng.pick(MEDICATIONS);
  const medicationEffectiveness = rng.float(0.3, 0.6); // pain reduction ratio
  const breakthroughProbability = rng.float(0.03, 0.08);

  for (let day = 0; day < daysCount; day++) {
    const date = new Date(surgeryDate);
    date.setDate(date.getDate() + day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Baseline pain: exponential decay with individual variation
    const baseline =
      (2 + 5.5 * Math.exp(-healingRate * day)) * basePainSensitivity;

    // 2-4 entries per day
    const entriesPerDay = rng.int(2, 4);
    const hoursUsed: number[] = [];

    for (let e = 0; e < entriesPerDay; e++) {
      // Spread entries across the day
      let hour: number;
      if (e === 0) {
        hour = rng.int(6, 9);   // morning
      } else if (e === entriesPerDay - 1) {
        hour = rng.int(19, 22); // evening
      } else {
        hour = rng.int(10, 18); // midday
      }
      // Avoid duplicate hours
      while (hoursUsed.includes(hour)) {
        hour = (hour + 1) % 24;
      }
      hoursUsed.push(hour);

      const tod = getTimeOfDay(hour);

      // Time-of-day modifiers
      let todModifier = 0;
      if (tod === TimeOfDay.EARLY_MORNING || tod === TimeOfDay.MORNING) {
        todModifier = morningStiffness; // morning stiffness
      }
      if (tod === TimeOfDay.EVENING) {
        todModifier = rng.float(0.3, 0.8); // evening fatigue flare
      }

      // Activity
      const activity = isWeekend
        ? rng.pick(['resting', 'reading', 'light_housework', 'walking'] as const)
        : rng.pick(ACTIVITIES);

      // Activity modifier
      let activityModifier = 0;
      if (activity === 'physical_therapy') activityModifier = rng.float(0.5, 1.5);
      if (activity === 'climbing_stairs') activityModifier = rng.float(0.8, 2.0);
      if (activity === 'walking') activityModifier = rng.float(0.2, 0.8);
      if (activity === 'driving') activityModifier = rng.float(0.3, 1.0);
      if (activity === 'resting') activityModifier = rng.float(-0.5, -0.1);
      if (activity === 'sleeping') activityModifier = rng.float(-0.8, -0.2);

      // Medication
      const tookMedication = rng.next() < 0.65; // 65% of entries have medication
      let medicationModifier = 0;
      let minutesSinceMed: number | undefined;
      if (tookMedication) {
        minutesSinceMed = rng.int(15, 180);
        // Medication kicks in after ~30 min, peak effect at ~60 min
        const timeFactor =
          minutesSinceMed < 30
            ? 0.3
            : minutesSinceMed < 90
              ? 1.0
              : 0.6;
        medicationModifier = -baseline * medicationEffectiveness * timeFactor;
      }

      // Weather
      const weather = rng.pick(WEATHER_CONDITIONS);
      let weatherModifier = 0;
      if (weather === 'cold' || weather === 'rainy' || weather === 'stormy') {
        weatherModifier = rng.float(0.2, 0.8);
      }

      // Sleep quality (recorded on first entry of the day)
      const sleepQuality = e === 0 ? rng.int(3, 9) : undefined;
      const sleepHours = e === 0 ? rng.float(4, 9) : undefined;
      let sleepModifier = 0;
      if (sleepQuality !== undefined && sleepQuality <= 4) {
        sleepModifier = rng.float(0.3, 1.0); // poor sleep increases pain
      }

      // Breakthrough pain
      const isBreakthrough = rng.next() < breakthroughProbability;
      const breakthroughModifier = isBreakthrough ? rng.float(2.0, 4.0) : 0;

      // Day-of-week noise
      const noise = rng.normal(0, 0.5);

      // Calculate final intensity
      const rawIntensity =
        baseline +
        todModifier +
        activityModifier +
        medicationModifier +
        weatherModifier +
        sleepModifier +
        breakthroughModifier +
        noise;

      const intensity = clamp(Math.round(rawIntensity * 10) / 10, 0, 10);

      // Choose pain qualities based on intensity
      const qualities: PainQuality[] = [];
      if (intensity >= 6) {
        qualities.push(rng.pick([PainQuality.SHARP, PainQuality.STABBING]));
      } else if (intensity >= 3) {
        qualities.push(rng.pick([PainQuality.ACHING, PainQuality.THROBBING]));
      } else {
        qualities.push(rng.pick([PainQuality.DULL, PainQuality.ACHING]));
      }
      if (rng.next() > 0.6) {
        qualities.push(PainQuality.RADIATING);
      }
      if (isBreakthrough) {
        qualities.push(PainQuality.BURNING);
      }

      // Timing
      let timing: PainTiming;
      if (activityModifier > 0.5) {
        timing = PainTiming.ACTIVITY_RELATED;
      } else if (intensity >= 5 && rng.next() > 0.5) {
        timing = PainTiming.CONSTANT;
      } else {
        timing = PainTiming.INTERMITTENT;
      }

      // Locations
      const locations: BodyLocation[] = [primaryLocation];
      if (rng.next() > 0.5) {
        locations.push(secondaryLocation);
      }

      // Factors
      const numAggravating = rng.int(1, 3);
      const numAlleviating = rng.int(1, 3);
      const aggravating = rng.pickN([...AGGRAVATING_FACTORS], numAggravating);
      const alleviating = rng.pickN([...ALLEVIATING_FACTORS], numAlleviating);

      // Stress level
      const stressLevel = rng.int(2, 8);

      // Build timestamp
      const entryDate = new Date(date);
      entryDate.setHours(hour, rng.int(0, 59), rng.int(0, 59));

      const entry: PainEntry = {
        id: `pain-${patientId}-d${day}-e${e}`,
        patientId,
        timestamp: entryDate.toISOString(),
        intensity: Math.round(intensity * 10) / 10,
        locations,
        quality: [...new Set(qualities)],
        timing,
        factors: {
          aggravating,
          alleviating,
        },
        context: {
          timeOfDay: tod,
          activity,
          medicationTaken: tookMedication,
          medicationName: tookMedication ? primaryMedication : undefined,
          minutesSinceMedication: minutesSinceMed,
          sleepQualityLastNight: sleepQuality,
          sleepHoursLastNight: sleepHours !== undefined ? Math.round(sleepHours * 10) / 10 : undefined,
          weatherCondition: weather,
          stressLevel,
        },
      };

      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Generates the full seed dataset: 30 patients x 28 days.
 * Surgery dates are staggered so the dataset feels realistic.
 */
export function generateSeedData(): { entries: PainEntry[]; patientIds: string[] } {
  const patientCount = 30;
  const daysCount = 28;
  const baseSurgeryDate = new Date('2025-12-01T08:00:00.000Z');

  const allEntries: PainEntry[] = [];
  const patientIds: string[] = [];

  for (let p = 0; p < patientCount; p++) {
    const patientId = `pain-patient-${(p + 1).toString().padStart(3, '0')}`;
    patientIds.push(patientId);

    // Stagger surgery dates by 0-3 days
    const surgeryDate = new Date(baseSurgeryDate);
    surgeryDate.setDate(surgeryDate.getDate() + (p % 4));

    const entries = generatePatientData(
      patientId,
      42 + p * 137, // deterministic seed per patient
      surgeryDate,
      daysCount
    );
    allEntries.push(...entries);
  }

  return { entries: allEntries, patientIds };
}

// ============================================================================
// PainTrackingService implementation
// ============================================================================

class PainTrackingServiceImpl {
  private entries: PainEntry[] = [];
  private alerts: PainAlert[] = [];
  private models: Map<string, RegressionModel> = new Map();

  // --------------------------------------------------------------------------
  // Pain Entry CRUD
  // --------------------------------------------------------------------------

  /**
   * Records a new pain entry.
   *
   * Validates intensity is 0-10. Generates an ID and timestamp if not
   * provided. Runs alert checks after recording.
   */
  recordPainEntry(
    entry: Omit<PainEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ): PainEntry {
    if (entry.intensity < 0 || entry.intensity > 10) {
      throw new Error(`Pain intensity must be 0-10, received: ${entry.intensity}`);
    }

    const fullEntry: PainEntry = {
      id: entry.id ?? `pain-${generateId()}`,
      timestamp: entry.timestamp ?? new Date().toISOString(),
      patientId: entry.patientId,
      intensity: Math.round(entry.intensity * 10) / 10,
      locations: entry.locations,
      quality: entry.quality,
      timing: entry.timing,
      factors: entry.factors,
      context: entry.context,
      notes: entry.notes,
    };

    this.entries.push(fullEntry);
    this.checkAlerts(fullEntry.patientId);
    return fullEntry;
  }

  /**
   * Bulk-load pain entries (used for seed data and testing).
   */
  loadEntries(entries: PainEntry[]): void {
    this.entries.push(...entries);
  }

  /**
   * Retrieves all pain entries for a patient, optionally filtered by date range.
   */
  getEntries(
    patientId: string,
    startDate?: string,
    endDate?: string
  ): PainEntry[] {
    let results = this.entries.filter((e) => e.patientId === patientId);
    if (startDate) {
      results = results.filter((e) => e.timestamp >= startDate);
    }
    if (endDate) {
      results = results.filter((e) => e.timestamp <= endDate);
    }
    return results.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Returns the most recent N entries for a patient.
   */
  getRecentEntries(patientId: string, count: number): PainEntry[] {
    const all = this.getEntries(patientId);
    return all.slice(-count);
  }

  /**
   * Clears all data. Useful for testing.
   */
  clearAll(): void {
    this.entries = [];
    this.alerts = [];
    this.models.clear();
  }

  // --------------------------------------------------------------------------
  // Pain Pattern Analysis
  // --------------------------------------------------------------------------

  /**
   * Computes daily pain trends with a moving average.
   *
   * @param windowSize - Number of days for the moving average (default 3)
   */
  getDailyTrend(
    patientId: string,
    windowSize: number = 3
  ): DailyTrend {
    const entries = this.getEntries(patientId);
    if (entries.length === 0) {
      return { points: [], overallDirection: 'stable', percentChange: 0 };
    }

    // Group by date
    const byDate = new Map<string, number[]>();
    for (const entry of entries) {
      const date = entry.timestamp.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry.intensity);
    }

    // Sort dates
    const sortedDates = [...byDate.keys()].sort();
    const dailyMeans: TrendPoint[] = sortedDates.map((date) => ({
      date,
      value: Math.round(mean(byDate.get(date)!) * 100) / 100,
    }));

    // Moving average
    for (let i = 0; i < dailyMeans.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const windowValues = dailyMeans.slice(start, i + 1).map((p) => p.value);
      dailyMeans[i].movingAverage = Math.round(mean(windowValues) * 100) / 100;
    }

    // Overall direction
    let direction: 'improving' | 'stable' | 'worsening' = 'stable';
    let percentChange = 0;
    if (dailyMeans.length >= 3) {
      const firstWeekAvg = mean(
        dailyMeans.slice(0, Math.min(7, dailyMeans.length)).map((p) => p.value)
      );
      const lastWeekAvg = mean(
        dailyMeans.slice(-Math.min(7, dailyMeans.length)).map((p) => p.value)
      );
      if (firstWeekAvg > 0) {
        percentChange =
          Math.round(((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 10000) / 100;
      }
      if (percentChange < -10) direction = 'improving';
      else if (percentChange > 10) direction = 'worsening';
    }

    return { points: dailyMeans, overallDirection: direction, percentChange };
  }

  /**
   * Computes weekly pain trends.
   */
  getWeeklyTrend(patientId: string): TrendPoint[] {
    const entries = this.getEntries(patientId);
    if (entries.length === 0) return [];

    const byWeek = new Map<string, number[]>();
    for (const entry of entries) {
      const d = new Date(entry.timestamp);
      // Week key: ISO year + week number
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(
        ((d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + 1) / 7
      );
      const key = `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      if (!byWeek.has(key)) byWeek.set(key, []);
      byWeek.get(key)!.push(entry.intensity);
    }

    const sortedWeeks = [...byWeek.keys()].sort();
    return sortedWeeks.map((week) => ({
      date: week,
      value: Math.round(mean(byWeek.get(week)!) * 100) / 100,
    }));
  }

  /**
   * Analyzes pain patterns by time of day.
   */
  getTimeOfDayPatterns(patientId: string): TimeOfDayPattern[] {
    const entries = this.getEntries(patientId);
    const groups = new Map<TimeOfDay, number[]>();

    // Initialize all buckets
    for (const tod of Object.values(TimeOfDay)) {
      groups.set(tod, []);
    }

    for (const entry of entries) {
      groups.get(entry.context.timeOfDay)!.push(entry.intensity);
    }

    return Object.values(TimeOfDay).map((tod) => {
      const values = groups.get(tod) ?? [];
      return {
        timeOfDay: tod,
        averageIntensity: Math.round(mean(values) * 100) / 100,
        entryCount: values.length,
      };
    });
  }

  /**
   * Analyzes correlation between activities and pain levels.
   */
  getActivityCorrelations(patientId: string): ActivityCorrelation[] {
    const entries = this.getEntries(patientId);
    if (entries.length === 0) return [];

    const byActivity = new Map<string, number[]>();
    for (const entry of entries) {
      const act = entry.context.activity;
      if (!byActivity.has(act)) byActivity.set(act, []);
      byActivity.get(act)!.push(entry.intensity);
    }

    const overallMean = mean(entries.map((e) => e.intensity));

    const correlations: ActivityCorrelation[] = [];
    for (const [activity, values] of byActivity) {
      const avgDuring = mean(values);
      const otherValues = entries
        .filter((e) => e.context.activity !== activity)
        .map((e) => e.intensity);
      const avgWithout = otherValues.length > 0 ? mean(otherValues) : overallMean;

      correlations.push({
        activity,
        averagePainDuring: Math.round(avgDuring * 100) / 100,
        averagePainWithout: Math.round(avgWithout * 100) / 100,
        difference: Math.round((avgDuring - avgWithout) * 100) / 100,
        occurrences: values.length,
      });
    }

    return correlations.sort((a, b) => b.difference - a.difference);
  }

  /**
   * Analyzes medication effectiveness by comparing pain levels
   * in entries with and without medication.
   */
  getMedicationEffectiveness(patientId: string): MedicationEffectiveness[] {
    const entries = this.getEntries(patientId);
    const medEntries = entries.filter(
      (e) => e.context.medicationTaken && e.context.medicationName
    );
    const noMedEntries = entries.filter((e) => !e.context.medicationTaken);

    const byMed = new Map<string, number[]>();
    for (const entry of medEntries) {
      const name = entry.context.medicationName!;
      if (!byMed.has(name)) byMed.set(name, []);
      byMed.get(name)!.push(entry.intensity);
    }

    const baselinePain =
      noMedEntries.length > 0 ? mean(noMedEntries.map((e) => e.intensity)) : 0;

    const results: MedicationEffectiveness[] = [];
    for (const [name, values] of byMed) {
      const avgAfter = mean(values);
      const reduction = baselinePain - avgAfter;
      const effectPct =
        baselinePain > 0 ? (reduction / baselinePain) * 100 : 0;

      results.push({
        medicationName: name,
        averagePainBefore: Math.round(baselinePain * 100) / 100,
        averagePainAfter: Math.round(avgAfter * 100) / 100,
        averageReduction: Math.round(reduction * 100) / 100,
        effectivenessPercent: Math.round(Math.max(0, effectPct) * 100) / 100,
        sampleSize: values.length,
      });
    }

    return results.sort((a, b) => b.effectivenessPercent - a.effectivenessPercent);
  }

  /**
   * Analyzes correlation between weather conditions and pain.
   */
  getWeatherCorrelations(patientId: string): WeatherCorrelation[] {
    const entries = this.getEntries(patientId).filter(
      (e) => e.context.weatherCondition
    );
    if (entries.length === 0) return [];

    const byWeather = new Map<string, number[]>();
    for (const entry of entries) {
      const cond = entry.context.weatherCondition!;
      if (!byWeather.has(cond)) byWeather.set(cond, []);
      byWeather.get(cond)!.push(entry.intensity);
    }

    const results: WeatherCorrelation[] = [];
    for (const [condition, values] of byWeather) {
      results.push({
        condition,
        averagePain: Math.round(mean(values) * 100) / 100,
        entryCount: values.length,
      });
    }

    return results.sort((a, b) => b.averagePain - a.averagePain);
  }

  /**
   * Analyzes correlation between sleep quality and pain.
   */
  getSleepCorrelations(patientId: string): SleepCorrelation[] {
    const entries = this.getEntries(patientId).filter(
      (e) => e.context.sleepQualityLastNight !== undefined
    );
    if (entries.length === 0) return [];

    const buckets: Record<string, number[]> = {
      'poor (1-3)': [],
      'fair (4-6)': [],
      'good (7-10)': [],
    };

    for (const entry of entries) {
      const sq = entry.context.sleepQualityLastNight!;
      if (sq <= 3) buckets['poor (1-3)'].push(entry.intensity);
      else if (sq <= 6) buckets['fair (4-6)'].push(entry.intensity);
      else buckets['good (7-10)'].push(entry.intensity);
    }

    return Object.entries(buckets).map(([bucket, values]) => ({
      qualityBucket: bucket,
      averagePain: Math.round(mean(values) * 100) / 100,
      entryCount: values.length,
    }));
  }

  // --------------------------------------------------------------------------
  // Pain Prediction Model
  // --------------------------------------------------------------------------

  /**
   * Trains a linear-regression model on the patient's historical data.
   *
   * Features:
   *   1. 3-day rolling average pain
   *   2. 7-day rolling average pain
   *   3. Day of week (0-6)
   *   4. Days since surgery (proxy: days since first entry)
   *   5. Average sleep quality (last night)
   *   6. Medication taken ratio (last 3 entries)
   *   7. Average activity intensity proxy
   *   8. Weekend flag
   *
   * Trains on daily mean pain with features from the previous day.
   */
  trainPredictionModel(patientId: string): RegressionModel {
    const entries = this.getEntries(patientId);
    if (entries.length < 7) {
      throw new Error(
        `Insufficient data for training: need at least 7 days, have ${entries.length} entries`
      );
    }

    // Group by date
    const byDate = new Map<string, PainEntry[]>();
    for (const entry of entries) {
      const date = entry.timestamp.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry);
    }

    const sortedDates = [...byDate.keys()].sort();
    if (sortedDates.length < 7) {
      throw new Error(
        `Insufficient unique days for training: need at least 7, have ${sortedDates.length}`
      );
    }

    const dailyMeans = sortedDates.map((d) =>
      mean(byDate.get(d)!.map((e) => e.intensity))
    );

    const featureNames = [
      'rolling_avg_3d',
      'rolling_avg_7d',
      'day_of_week',
      'days_since_start',
      'sleep_quality',
      'medication_ratio',
      'activity_intensity',
      'is_weekend',
    ];

    const features: number[][] = [];
    const targets: number[] = [];

    // Start from day 7 to have enough history
    for (let i = 7; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);

      // Rolling averages
      const rolling3 = mean(dailyMeans.slice(i - 3, i));
      const rolling7 = mean(dailyMeans.slice(i - 7, i));

      // Day of week
      const dow = date.getDay();

      // Days since start
      const firstDate = new Date(sortedDates[0]);
      const daysSinceStart = daysBetween(firstDate, date);

      // Sleep quality from entries of the previous day
      const prevDayEntries = byDate.get(sortedDates[i - 1]) ?? [];
      const sleepValues = prevDayEntries
        .map((e) => e.context.sleepQualityLastNight)
        .filter((v): v is number => v !== undefined);
      const sleepQuality = sleepValues.length > 0 ? mean(sleepValues) : 5;

      // Medication ratio in previous 3 days
      let medCount = 0;
      let totalCount = 0;
      for (let j = Math.max(0, i - 3); j < i; j++) {
        const dayEntries = byDate.get(sortedDates[j]) ?? [];
        totalCount += dayEntries.length;
        medCount += dayEntries.filter((e) => e.context.medicationTaken).length;
      }
      const medRatio = totalCount > 0 ? medCount / totalCount : 0;

      // Activity intensity proxy: high-pain activities in previous day
      const highPainActivities = new Set([
        'physical_therapy', 'climbing_stairs', 'driving',
      ]);
      const prevActivities = prevDayEntries.map((e) => e.context.activity);
      const activityIntensity =
        prevActivities.filter((a) => highPainActivities.has(a)).length /
        Math.max(1, prevActivities.length);

      // Weekend flag
      const isWeekend = dow === 0 || dow === 6 ? 1 : 0;

      features.push([
        rolling3,
        rolling7,
        dow,
        daysSinceStart,
        sleepQuality,
        medRatio,
        activityIntensity,
        isWeekend,
      ]);

      targets.push(dailyMeans[i]);
    }

    const model = trainLinearRegression(features, targets, featureNames);
    this.models.set(patientId, model);
    return model;
  }

  /**
   * Predicts the next-day pain level for a patient.
   *
   * Trains or uses cached model. Builds feature vector from the most
   * recent entries.
   */
  predictNextDayPain(patientId: string): PainPrediction {
    // Train model if not cached
    if (!this.models.has(patientId)) {
      this.trainPredictionModel(patientId);
    }

    const model = this.models.get(patientId)!;
    const entries = this.getEntries(patientId);

    // Build feature vector from recent data
    const byDate = new Map<string, PainEntry[]>();
    for (const entry of entries) {
      const date = entry.timestamp.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry);
    }

    const sortedDates = [...byDate.keys()].sort();
    const dailyMeans = sortedDates.map((d) =>
      mean(byDate.get(d)!.map((e) => e.intensity))
    );

    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Features for tomorrow
    const rolling3 = mean(dailyMeans.slice(-3));
    const rolling7 = mean(dailyMeans.slice(-7));
    const dow = nextDate.getDay();
    const firstDate = new Date(sortedDates[0]);
    const daysSinceStart = daysBetween(firstDate, nextDate);

    // Recent sleep quality
    const recentEntries = entries.slice(-10);
    const sleepValues = recentEntries
      .map((e) => e.context.sleepQualityLastNight)
      .filter((v): v is number => v !== undefined);
    const sleepQuality = sleepValues.length > 0 ? mean(sleepValues) : 5;

    // Medication ratio
    const last3DaysEntries = entries.filter((e) => {
      const d = new Date(e.timestamp);
      return daysBetween(d, lastDate) <= 3;
    });
    const medRatio =
      last3DaysEntries.length > 0
        ? last3DaysEntries.filter((e) => e.context.medicationTaken).length /
          last3DaysEntries.length
        : 0;

    // Activity intensity
    const lastDayEntries = byDate.get(sortedDates[sortedDates.length - 1]) ?? [];
    const highPainActivities = new Set([
      'physical_therapy', 'climbing_stairs', 'driving',
    ]);
    const activityIntensity =
      lastDayEntries.filter((e) => highPainActivities.has(e.context.activity)).length /
      Math.max(1, lastDayEntries.length);

    const isWeekend = dow === 0 || dow === 6 ? 1 : 0;

    const featureValues = [
      rolling3,
      rolling7,
      dow,
      daysSinceStart,
      sleepQuality,
      medRatio,
      activityIntensity,
      isWeekend,
    ];

    const { prediction, lower, upper } = predictWithModel(model, featureValues);

    const featureMap: Record<string, number> = {};
    model.featureNames.forEach((name, idx) => {
      featureMap[name] = Math.round(featureValues[idx] * 1000) / 1000;
    });

    return {
      predictedIntensity: prediction,
      confidenceInterval: { lower, upper },
      confidence: Math.round(model.rSquared * 1000) / 1000,
      features: featureMap,
      date: toISODate(nextDate),
    };
  }

  // --------------------------------------------------------------------------
  // Alert System
  // --------------------------------------------------------------------------

  /**
   * Checks for alert conditions and generates alerts as needed.
   * Called automatically after each new pain entry.
   */
  checkAlerts(patientId: string): PainAlert[] {
    const newAlerts: PainAlert[] = [];

    newAlerts.push(...this.checkPainEscalation(patientId));
    newAlerts.push(...this.checkBreakthroughPain(patientId));
    newAlerts.push(...this.checkMedicationOveruse(patientId));
    newAlerts.push(...this.checkExpectedCurve(patientId));

    for (const alert of newAlerts) {
      this.alerts.push(alert);
    }
    return newAlerts;
  }

  /**
   * Pain escalation: 3+ consecutive days of increasing daily mean pain.
   */
  private checkPainEscalation(patientId: string): PainAlert[] {
    const trend = this.getDailyTrend(patientId);
    if (trend.points.length < 3) return [];

    const recent = trend.points.slice(-5);
    let consecutiveIncreases = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].value > recent[i - 1].value + 0.1) {
        consecutiveIncreases++;
      } else {
        consecutiveIncreases = 0;
      }
    }

    if (consecutiveIncreases >= 3) {
      // Avoid duplicate alerts on same date
      const today = toISODate(new Date());
      const existing = this.alerts.find(
        (a) =>
          a.patientId === patientId &&
          a.type === AlertType.PAIN_ESCALATION &&
          a.timestamp.slice(0, 10) === today
      );
      if (existing) return [];

      return [
        {
          id: `alert-esc-${generateId()}`,
          patientId,
          type: AlertType.PAIN_ESCALATION,
          severity: consecutiveIncreases >= 4 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
          message: `Pain has been increasing for ${consecutiveIncreases} consecutive days. ` +
            `Current average: ${recent[recent.length - 1].value}/10. ` +
            `Consider reviewing pain management plan.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          data: {
            consecutiveDays: consecutiveIncreases,
            recentValues: recent.map((p) => p.value),
          },
        },
      ];
    }

    return [];
  }

  /**
   * Breakthrough pain: sudden spike >= 3 points above the patient's
   * 3-day rolling average.
   */
  private checkBreakthroughPain(patientId: string): PainAlert[] {
    const entries = this.getEntries(patientId);
    if (entries.length < 5) return [];

    const latestEntry = entries[entries.length - 1];
    const recentIntensities = entries.slice(-10, -1).map((e) => e.intensity);
    const recentAvg = mean(recentIntensities);

    if (latestEntry.intensity >= recentAvg + 3 && latestEntry.intensity >= 7) {
      // Deduplicate
      const existingForEntry = this.alerts.find(
        (a) =>
          a.patientId === patientId &&
          a.type === AlertType.BREAKTHROUGH_PAIN &&
          (a.data as Record<string, unknown>)?.entryId === latestEntry.id
      );
      if (existingForEntry) return [];

      return [
        {
          id: `alert-brk-${generateId()}`,
          patientId,
          type: AlertType.BREAKTHROUGH_PAIN,
          severity: AlertSeverity.CRITICAL,
          message: `Breakthrough pain detected: ${latestEntry.intensity}/10 ` +
            `(recent average: ${Math.round(recentAvg * 10) / 10}/10). ` +
            `Spike of +${Math.round((latestEntry.intensity - recentAvg) * 10) / 10} points.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          data: {
            entryId: latestEntry.id,
            intensity: latestEntry.intensity,
            recentAverage: Math.round(recentAvg * 10) / 10,
          },
        },
      ];
    }

    return [];
  }

  /**
   * Medication overuse: if medication is taken in more than 85% of
   * entries over the last 7 days, warn about potential dependency risk.
   */
  private checkMedicationOveruse(patientId: string): PainAlert[] {
    const entries = this.getEntries(patientId);
    if (entries.length < 10) return [];

    // Get entries from last 7 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString();

    const recentEntries = entries.filter((e) => e.timestamp >= cutoffStr);
    if (recentEntries.length < 5) return [];

    const medCount = recentEntries.filter((e) => e.context.medicationTaken).length;
    const ratio = medCount / recentEntries.length;

    if (ratio > 0.85) {
      // Deduplicate: one per day
      const today = toISODate(new Date());
      const existing = this.alerts.find(
        (a) =>
          a.patientId === patientId &&
          a.type === AlertType.MEDICATION_OVERUSE &&
          a.timestamp.slice(0, 10) === today
      );
      if (existing) return [];

      return [
        {
          id: `alert-med-${generateId()}`,
          patientId,
          type: AlertType.MEDICATION_OVERUSE,
          severity: AlertSeverity.WARNING,
          message: `High medication usage detected: medication taken in ` +
            `${Math.round(ratio * 100)}% of pain reports over the last 7 days ` +
            `(${medCount}/${recentEntries.length} entries). ` +
            `Consider discussing medication plan with your doctor.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          data: {
            medicationRatio: Math.round(ratio * 100) / 100,
            entriesWithMedication: medCount,
            totalEntries: recentEntries.length,
          },
        },
      ];
    }

    return [];
  }

  /**
   * Compares current pain levels against the expected recovery curve.
   * Alerts if pain is consistently above the upper bound.
   */
  private checkExpectedCurve(patientId: string): PainAlert[] {
    const entries = this.getEntries(patientId);
    if (entries.length < 5) return [];

    const curve = getExpectedPainCurve();
    const firstEntryDate = new Date(entries[0].timestamp);

    // Check last 3 days
    const byDate = new Map<string, number[]>();
    for (const entry of entries) {
      const date = entry.timestamp.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry.intensity);
    }

    const sortedDates = [...byDate.keys()].sort();
    const recentDates = sortedDates.slice(-3);
    let daysAbove = 0;

    for (const dateStr of recentDates) {
      const date = new Date(dateStr);
      const day = daysBetween(firstEntryDate, date);
      const curvePoint = curve.find((c) => c.dayPostSurgery === day);
      if (!curvePoint) continue;

      const dailyMean = mean(byDate.get(dateStr)!);
      if (dailyMean > curvePoint.upperBound) {
        daysAbove++;
      }
    }

    if (daysAbove >= 2) {
      const today = toISODate(new Date());
      const existing = this.alerts.find(
        (a) =>
          a.patientId === patientId &&
          a.type === AlertType.ABOVE_EXPECTED_CURVE &&
          a.timestamp.slice(0, 10) === today
      );
      if (existing) return [];

      return [
        {
          id: `alert-curve-${generateId()}`,
          patientId,
          type: AlertType.ABOVE_EXPECTED_CURVE,
          severity: AlertSeverity.WARNING,
          message: `Pain levels have been above the expected recovery curve ` +
            `for ${daysAbove} of the last 3 days. This may indicate ` +
            `complications or inadequate pain management.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          data: { daysAboveExpected: daysAbove },
        },
      ];
    }

    return [];
  }

  /**
   * Returns all alerts for a patient.
   */
  getAlerts(patientId: string, unacknowledgedOnly: boolean = false): PainAlert[] {
    let results = this.alerts.filter((a) => a.patientId === patientId);
    if (unacknowledgedOnly) {
      results = results.filter((a) => !a.acknowledged);
    }
    return results.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Acknowledges (dismisses) an alert.
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.acknowledged = true;
    return true;
  }

  /**
   * Returns the expected pain curve for comparison.
   */
  getExpectedPainCurve(): ExpectedPainCurvePoint[] {
    return getExpectedPainCurve();
  }

  // --------------------------------------------------------------------------
  // Reporting
  // --------------------------------------------------------------------------

  /**
   * Generates a comprehensive pain report for doctor visits.
   *
   * @param patientId - The patient ID
   * @param periodDays - Number of days to include (default 28)
   */
  generateReport(patientId: string, periodDays: number = 28): PainReport {
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);

    const startStr = periodStart.toISOString();
    const endStr = now.toISOString();

    const entries = this.getEntries(patientId, startStr, endStr);
    const intensities = entries.map((e) => e.intensity);

    const statistics = computeStats(intensities);
    const dailyTrend = this.getDailyTrend(patientId);
    const timeOfDayPatterns = this.getTimeOfDayPatterns(patientId);
    const medicationEffectiveness = this.getMedicationEffectiveness(patientId);
    const activityCorrelations = this.getActivityCorrelations(patientId);
    const alerts = this.getAlerts(patientId);

    // Top aggravating and alleviating factors
    const aggravatingCounts = new Map<string, number>();
    const alleviatingCounts = new Map<string, number>();
    for (const entry of entries) {
      for (const factor of entry.factors.aggravating) {
        aggravatingCounts.set(factor, (aggravatingCounts.get(factor) ?? 0) + 1);
      }
      for (const factor of entry.factors.alleviating) {
        alleviatingCounts.set(factor, (alleviatingCounts.get(factor) ?? 0) + 1);
      }
    }
    const topAggravating = [...aggravatingCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor]) => factor);
    const topAlleviating = [...alleviatingCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor]) => factor);

    // Prediction (may fail if insufficient data)
    let prediction: PainPrediction | null = null;
    try {
      prediction = this.predictNextDayPain(patientId);
    } catch {
      // Not enough data for prediction
    }

    // Generate textual summary
    const summary = this.generateSummaryText(
      statistics,
      dailyTrend,
      timeOfDayPatterns,
      medicationEffectiveness,
      topAggravating,
      topAlleviating,
      alerts,
      prediction,
      periodDays
    );

    return {
      patientId,
      generatedAt: now.toISOString(),
      periodStart: startStr,
      periodEnd: endStr,
      statistics,
      dailyTrend,
      timeOfDayPatterns,
      topAggravatingFactors: topAggravating,
      topAlleviatingFactors: topAlleviating,
      medicationEffectiveness,
      activityCorrelations,
      alerts,
      prediction,
      summary,
    };
  }

  /**
   * Generates a human-readable summary for the doctor report.
   */
  private generateSummaryText(
    stats: PainStatistics,
    trend: DailyTrend,
    todPatterns: TimeOfDayPattern[],
    medEffectiveness: MedicationEffectiveness[],
    aggravating: string[],
    alleviating: string[],
    alerts: PainAlert[],
    prediction: PainPrediction | null,
    periodDays: number
  ): string {
    const lines: string[] = [];

    lines.push(`PAIN SUMMARY REPORT (${periodDays}-Day Period)`);
    lines.push('='.repeat(50));
    lines.push('');

    // Overview
    lines.push('OVERVIEW');
    lines.push('-'.repeat(30));
    lines.push(`Average pain intensity: ${stats.mean}/10`);
    lines.push(`Pain range: ${stats.min} - ${stats.max}/10`);
    lines.push(`Standard deviation: ${stats.standardDeviation}`);
    lines.push(`Total entries recorded: ${stats.count}`);
    lines.push('');

    // Trend
    lines.push('TREND ANALYSIS');
    lines.push('-'.repeat(30));
    const directionLabel =
      trend.overallDirection === 'improving'
        ? 'IMPROVING'
        : trend.overallDirection === 'worsening'
          ? 'WORSENING'
          : 'STABLE';
    lines.push(`Overall direction: ${directionLabel}`);
    lines.push(`Change over period: ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange}%`);
    lines.push('');

    // Time-of-day patterns
    lines.push('TIME-OF-DAY PATTERNS');
    lines.push('-'.repeat(30));
    const sortedTod = [...todPatterns].sort(
      (a, b) => b.averageIntensity - a.averageIntensity
    );
    for (const pattern of sortedTod) {
      if (pattern.entryCount > 0) {
        lines.push(
          `  ${pattern.timeOfDay}: ${pattern.averageIntensity}/10 avg (${pattern.entryCount} entries)`
        );
      }
    }
    lines.push('');

    // Medication effectiveness
    if (medEffectiveness.length > 0) {
      lines.push('MEDICATION EFFECTIVENESS');
      lines.push('-'.repeat(30));
      for (const med of medEffectiveness) {
        lines.push(
          `  ${med.medicationName}: ${med.effectivenessPercent}% reduction ` +
          `(${med.averagePainBefore} -> ${med.averagePainAfter}/10, n=${med.sampleSize})`
        );
      }
      lines.push('');
    }

    // Key factors
    if (aggravating.length > 0) {
      lines.push('TOP AGGRAVATING FACTORS');
      lines.push('-'.repeat(30));
      lines.push(`  ${aggravating.join(', ')}`);
      lines.push('');
    }

    if (alleviating.length > 0) {
      lines.push('TOP ALLEVIATING FACTORS');
      lines.push('-'.repeat(30));
      lines.push(`  ${alleviating.join(', ')}`);
      lines.push('');
    }

    // Alerts
    const activeAlerts = alerts.filter((a) => !a.acknowledged);
    if (activeAlerts.length > 0) {
      lines.push('ACTIVE ALERTS');
      lines.push('-'.repeat(30));
      for (const alert of activeAlerts.slice(0, 5)) {
        lines.push(`  [${alert.severity.toUpperCase()}] ${alert.message}`);
      }
      lines.push('');
    }

    // Prediction
    if (prediction) {
      lines.push('NEXT-DAY PREDICTION');
      lines.push('-'.repeat(30));
      lines.push(
        `  Predicted intensity: ${prediction.predictedIntensity}/10 ` +
        `(95% CI: ${prediction.confidenceInterval.lower} - ${prediction.confidenceInterval.upper})`
      );
      lines.push(`  Model confidence (R-squared): ${prediction.confidence}`);
      lines.push('');
    }

    // Clinical notes
    lines.push('CLINICAL NOTES');
    lines.push('-'.repeat(30));
    if (trend.overallDirection === 'worsening') {
      lines.push(
        '  * Pain levels are trending upward. Consider reviewing current pain management protocol.'
      );
    }
    if (stats.mean >= 7) {
      lines.push(
        '  * Average pain is severe (>=7/10). Aggressive pain management may be warranted.'
      );
    }
    if (stats.mean >= 4 && stats.mean < 7) {
      lines.push(
        '  * Average pain is moderate (4-6/10). Current management may need adjustment.'
      );
    }
    if (stats.mean < 4) {
      lines.push('  * Average pain is mild (<4/10). Recovery appears to be progressing well.');
    }

    const worstTod = sortedTod[0];
    if (worstTod && worstTod.averageIntensity > stats.mean + 1) {
      lines.push(
        `  * Notable pain spike during ${worstTod.timeOfDay} ` +
        `(${worstTod.averageIntensity}/10 vs ${stats.mean}/10 overall). ` +
        `Consider timing medication accordingly.`
      );
    }

    lines.push('');
    lines.push('='.repeat(50));
    lines.push('End of Report');

    return lines.join('\n');
  }

  // --------------------------------------------------------------------------
  // Accessors for testing and external use
  // --------------------------------------------------------------------------

  /** Returns the total number of stored entries. */
  getEntryCount(): number {
    return this.entries.length;
  }

  /** Returns all unique patient IDs that have recorded data. */
  getTrackedPatientIds(): string[] {
    return [...new Set(this.entries.map((e) => e.patientId))];
  }

  /** Returns the cached model for a patient, if trained. */
  getModel(patientId: string): RegressionModel | undefined {
    return this.models.get(patientId);
  }

  /** Returns statistics for a patient's entries. */
  getStatistics(patientId: string): PainStatistics {
    const intensities = this.getEntries(patientId).map((e) => e.intensity);
    return computeStats(intensities);
  }
}

// ============================================================================
// Singleton export
// ============================================================================

/** Singleton instance of the pain tracking service. */
export const painTrackingService = new PainTrackingServiceImpl();

/** Export class for testing. */
export { PainTrackingServiceImpl };
