/**
 * Sleep Tracking and Analysis Service
 *
 * Comprehensive sleep monitoring for post-operative recovery, including:
 *  - Sleep logging with bedtime/wake, quality, disturbances, naps, environment
 *  - Sleep metrics: duration, efficiency, onset latency, WASO, awakenings, debt
 *  - Pattern analysis: circadian rhythm, consistency, trends, day-of-week, correlations
 *  - Sleep hygiene scoring (0-100)
 *  - Personalized recommendations engine
 *  - Alert system: deprivation, excessive daytime sleep, apnea risk, medication-induced insomnia
 *  - Realistic seed data for 30 patients over 30 days
 *
 * No external dependencies. Uses deterministic seeded PRNG for reproducible datasets.
 */

// ============================================================================
// Const-object enums (erasableSyntaxOnly compatible)
// ============================================================================

export const SleepQualityRating = {
  VERY_POOR: 1,
  POOR: 2,
  FAIR: 3,
  GOOD: 4,
  EXCELLENT: 5,
} as const;
export type SleepQualityRating = typeof SleepQualityRating[keyof typeof SleepQualityRating];

export const DisturbanceType = {
  PAIN: 'pain',
  BATHROOM: 'bathroom',
  ANXIETY: 'anxiety',
  NOISE: 'noise',
  MEDICATION_SIDE_EFFECTS: 'medication_side_effects',
} as const;
export type DisturbanceType = typeof DisturbanceType[keyof typeof DisturbanceType];

export const TrendDirection = {
  IMPROVING: 'improving',
  STABLE: 'stable',
  WORSENING: 'worsening',
} as const;
export type TrendDirection = typeof TrendDirection[keyof typeof TrendDirection];

export const SleepAlertType = {
  SLEEP_DEPRIVATION: 'sleep_deprivation',
  EXCESSIVE_DAYTIME_SLEEP: 'excessive_daytime_sleep',
  SLEEP_APNEA_RISK: 'sleep_apnea_risk',
  MEDICATION_INDUCED_INSOMNIA: 'medication_induced_insomnia',
} as const;
export type SleepAlertType = typeof SleepAlertType[keyof typeof SleepAlertType];

export const SleepAlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;
export type SleepAlertSeverity = typeof SleepAlertSeverity[keyof typeof SleepAlertSeverity];

export const SurgeryType = {
  KNEE_REPLACEMENT: 'knee_replacement',
  HIP_REPLACEMENT: 'hip_replacement',
  SPINAL_FUSION: 'spinal_fusion',
  SHOULDER_ARTHROSCOPY: 'shoulder_arthroscopy',
  ABDOMINAL: 'abdominal',
  CARDIAC: 'cardiac',
  GENERAL: 'general',
} as const;
export type SurgeryType = typeof SurgeryType[keyof typeof SurgeryType];

export const DayOfWeek = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;
export type DayOfWeek = typeof DayOfWeek[keyof typeof DayOfWeek];

// ============================================================================
// Data Models
// ============================================================================

/** A disturbance event during sleep. */
export interface SleepDisturbance {
  type: DisturbanceType;
  time: string;           // ISO-8601 timestamp
  durationMinutes: number;
  severity: number;       // 1-5
  notes?: string;
}

/** Sleep environment factors for a night. */
export interface SleepEnvironment {
  roomTemperatureFahrenheit: number;
  noiseLevel: number;     // 1-5 (1=silent, 5=very noisy)
  lightLevel: number;     // 1-5 (1=pitch dark, 5=bright)
}

/** A nap recorded during the day. */
export interface NapEntry {
  id: string;
  patientId: string;
  date: string;           // ISO date (YYYY-MM-DD)
  startTime: string;      // ISO-8601 timestamp
  durationMinutes: number;
  quality: SleepQualityRating;
  notes?: string;
}

/** Sleep hygiene habits for a given day. */
export interface SleepHygieneFactors {
  screenTimeBeforeBedMinutes: number;
  lastCaffeineHoursBeforeBed: number;
  exerciseHoursBeforeBed: number;
  alcoholConsumed: boolean;
  heavyMealBeforeBedHours: number;
}

/** A full night's sleep log entry. */
export interface SleepLogEntry {
  id: string;
  patientId: string;
  date: string;                     // ISO date for the night (date when going to bed)
  bedtime: string;                  // ISO-8601
  wakeTime: string;                 // ISO-8601
  sleepOnsetLatencyMinutes: number; // time to fall asleep
  qualityRating: SleepQualityRating;
  disturbances: SleepDisturbance[];
  environment: SleepEnvironment;
  hygieneFactors: SleepHygieneFactors;
  naps: NapEntry[];
  painLevelBeforeBed: number;       // 0-10 NRS
  medicationsTakenBeforeBed: string[];
  exerciseDuringDay: boolean;
  exerciseMinutes: number;
  notes?: string;
}

/** Computed metrics for a single night. */
export interface NightlyMetrics {
  date: string;
  totalTimeInBedMinutes: number;
  totalSleepDurationMinutes: number;
  sleepEfficiency: number;          // percentage (0-100)
  sleepOnsetLatencyMinutes: number;
  wasoMinutes: number;              // wake after sleep onset
  numberOfAwakenings: number;
  qualityRating: SleepQualityRating;
  totalNapMinutes: number;
}

/** Sleep debt tracking for a patient. */
export interface SleepDebt {
  patientId: string;
  recommendedHoursPerNight: number;
  cumulativeDebtHours: number;
  averageNightlyDeficitHours: number;
  daysTracked: number;
  debtTrend: TrendDirection;
}

/** Circadian rhythm analysis result. */
export interface CircadianRhythm {
  averageBedtime: string;           // HH:MM format
  averageWakeTime: string;          // HH:MM format
  averageSleepDuration: number;     // hours
  bedtimeStdDevMinutes: number;
  wakeTimeStdDevMinutes: number;
}

/** Consistency score result. */
export interface ConsistencyScore {
  overall: number;                  // 0-100
  bedtimeConsistency: number;       // 0-100
  wakeTimeConsistency: number;      // 0-100
  durationConsistency: number;      // 0-100
}

/** Day-of-week sleep pattern. */
export interface DayOfWeekPattern {
  dayOfWeek: number;                // 0=Sun, 6=Sat
  dayName: string;
  averageDurationHours: number;
  averageQuality: number;
  averageBedtimeMinutesFromMidnight: number;
  entryCount: number;
}

/** Correlation result between sleep and another factor. */
export interface SleepCorrelation {
  factor: string;
  correlationCoefficient: number;   // -1 to 1
  strength: string;                 // weak, moderate, strong
  direction: string;                // positive, negative
  description: string;
  sampleSize: number;
}

/** Sleep hygiene score breakdown. */
export interface SleepHygieneScore {
  patientId: string;
  overallScore: number;             // 0-100
  consistentBedtimeScore: number;   // 0-20
  screenTimeScore: number;          // 0-20
  caffeineTimingScore: number;      // 0-20
  exerciseTimingScore: number;      // 0-20
  environmentScore: number;         // 0-20
  details: string[];
}

/** A sleep-related recommendation. */
export interface SleepRecommendation {
  id: string;
  patientId: string;
  category: string;
  priority: number;                 // 1=highest, 5=lowest
  title: string;
  description: string;
  rationale: string;
}

/** A sleep alert. */
export interface SleepAlert {
  id: string;
  patientId: string;
  type: SleepAlertType;
  severity: SleepAlertSeverity;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  data?: Record<string, unknown>;
}

/** Comprehensive sleep report. */
export interface SleepReport {
  patientId: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  nightlyMetrics: NightlyMetrics[];
  averageMetrics: {
    sleepDurationHours: number;
    sleepEfficiency: number;
    sleepOnsetLatencyMinutes: number;
    wasoMinutes: number;
    awakeningsPerNight: number;
    qualityRating: number;
  };
  sleepDebt: SleepDebt;
  circadianRhythm: CircadianRhythm;
  consistencyScore: ConsistencyScore;
  trendDirection: TrendDirection;
  dayOfWeekPatterns: DayOfWeekPattern[];
  correlations: SleepCorrelation[];
  hygieneScore: SleepHygieneScore;
  recommendations: SleepRecommendation[];
  alerts: SleepAlert[];
  summary: string;
}

// ============================================================================
// Deterministic Seeded PRNG (xorshift32)
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

  normal(mean: number, stddev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stddev;
  }

  boolean(probability: number): boolean {
    return this.next() < probability;
  }
}

// ============================================================================
// Utility Helpers
// ============================================================================

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter++;
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${idCounter}`;
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

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const squaredDiffs = values.map((v) => (v - m) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Converts an ISO-8601 timestamp to minutes from midnight.
 * Handles times after midnight (e.g., 01:30 AM = 90 minutes).
 */
function timeToMinutesFromMidnight(isoTime: string): number {
  const d = new Date(isoTime);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Converts minutes-from-midnight to "HH:MM" format.
 */
function minutesToTimeString(minutes: number): string {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalizedMinutes / 60);
  const m = Math.round(normalizedMinutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calculates difference in minutes between two ISO timestamps.
 * Properly handles overnight spans (bedtime to wake time).
 */
function minutesBetween(start: string, end: string): number {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Math.max(0, (endMs - startMs) / (1000 * 60));
}

/**
 * Computes Pearson correlation coefficient between two arrays.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const meanX = mean(x.slice(0, n));
  const meanY = mean(y.slice(0, n));

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Categorizes a Pearson r-value into human-readable strength and direction.
 */
function categorizeCorrelation(r: number): { strength: string; direction: string } {
  const abs = Math.abs(r);
  let strength: string;
  if (abs >= 0.7) strength = 'strong';
  else if (abs >= 0.4) strength = 'moderate';
  else strength = 'weak';

  const direction = r >= 0 ? 'positive' : 'negative';
  return { strength, direction };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============================================================================
// Seed Data Constants
// ============================================================================

const MEDICATIONS_AFFECTING_SLEEP = [
  'Oxycodone 5mg',
  'Tramadol 50mg',
  'Gabapentin 300mg',
  'Prednisone 10mg',
  'Zolpidem 10mg',
  'Melatonin 5mg',
  'Ibuprofen 400mg',
  'Acetaminophen 500mg',
] as const;

const STIMULATING_MEDICATIONS = new Set([
  'Prednisone 10mg',
]);

/** Medications with sedating effects (exported for potential cross-service use). */
export const SEDATING_MEDICATIONS = new Set([
  'Oxycodone 5mg',
  'Tramadol 50mg',
  'Gabapentin 300mg',
  'Zolpidem 10mg',
  'Melatonin 5mg',
]);

const SURGERY_TYPES_LIST: SurgeryType[] = [
  SurgeryType.KNEE_REPLACEMENT,
  SurgeryType.HIP_REPLACEMENT,
  SurgeryType.SPINAL_FUSION,
  SurgeryType.SHOULDER_ARTHROSCOPY,
  SurgeryType.ABDOMINAL,
  SurgeryType.CARDIAC,
  SurgeryType.GENERAL,
];

// ============================================================================
// Seed Data Generator (30 patients x 30 days)
// ============================================================================

/** Patient profile for sleep data generation. */
interface SleepPatientProfile {
  patientId: string;
  surgeryType: SurgeryType;
  daysPostSurgery: number;
  baselineBedtimeMinutes: number;     // minutes from midnight (e.g., 1380 = 23:00)
  baselineWakeMinutes: number;        // minutes from midnight (e.g., 420 = 07:00)
  baseSleepQuality: number;           // 1-5 base quality
  painSensitivity: number;            // 0.5-1.5 multiplier
  anxietyLevel: number;               // 0-10
  isGoodSleeper: boolean;             // naturally good vs. poor sleeper
  primaryMedications: string[];
  bedtimeVariability: number;         // stddev in minutes for bedtime consistency
  hasApneaRisk: boolean;
}

/**
 * Generates a single patient's 30-day sleep log with realistic patterns.
 *
 * Normal sleepers: 7-8h sleep, few disturbances, good efficiency
 * Disturbed sleepers: shorter sleep, more awakenings, lower quality
 * Post-surgical patterns: elevated pain/disturbance early, improving over time
 */
function generatePatientSleepData(
  profile: SleepPatientProfile,
  startDate: Date,
  dayCount: number,
  patientSeed: number
): SleepLogEntry[] {
  const rng = new SeededRandom(patientSeed);
  const entries: SleepLogEntry[] = [];

  for (let day = 0; day < dayCount; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = toISODate(date);

    // Recovery factor: pain and disruption improve over post-surgical days
    const postSurgDay = profile.daysPostSurgery + day;
    const recoveryFactor = Math.exp(-0.08 * postSurgDay);

    // --- Bedtime ---
    // Weekends: tend to stay up later
    const weekendShift = isWeekend ? rng.float(15, 45) : 0;
    const bedtimeVariation = rng.normal(0, profile.bedtimeVariability);
    const bedtimeMinutes = Math.round(
      profile.baselineBedtimeMinutes + weekendShift + bedtimeVariation
    );

    const bedtimeDate = new Date(date);
    const bedHour = Math.floor(bedtimeMinutes / 60) % 24;
    const bedMin = bedtimeMinutes % 60;
    bedtimeDate.setHours(bedHour, bedMin, 0, 0);
    const bedtime = bedtimeDate.toISOString();

    // --- Sleep onset latency ---
    // Affected by pain, anxiety, screen time, caffeine
    let baseLatency = profile.isGoodSleeper
      ? rng.float(5, 15)
      : rng.float(15, 40);

    // Pain effect on latency
    const painBeforeBed = clamp(
      round1(rng.float(1, 4) + 5 * recoveryFactor * profile.painSensitivity),
      0, 10
    );
    baseLatency += painBeforeBed * 2;

    // Anxiety effect
    const anxietyEffect = profile.anxietyLevel * recoveryFactor * 2;
    baseLatency += anxietyEffect;

    const sleepOnsetLatency = Math.round(clamp(baseLatency + rng.normal(0, 5), 2, 90));

    // --- Disturbances ---
    const disturbances: SleepDisturbance[] = [];

    // Number of disturbances depends on pain, recovery stage, and natural sleep quality
    const baseDisturbanceCount = profile.isGoodSleeper ? 0.5 : 1.5;
    const painDisturbanceBoost = recoveryFactor * profile.painSensitivity * 2;
    const expectedDisturbances = baseDisturbanceCount + painDisturbanceBoost;
    const numDisturbances = Math.max(0, Math.round(
      rng.normal(expectedDisturbances, 0.8)
    ));

    let totalDisturbanceMinutes = 0;
    const wakeUpHour = Math.floor(profile.baselineWakeMinutes / 60);

    for (let d = 0; d < numDisturbances; d++) {
      // Weight disturbance types by recovery stage
      let type: DisturbanceType;
      const roll = rng.next();
      if (roll < 0.35 * recoveryFactor + 0.05) {
        type = DisturbanceType.PAIN;
      } else if (roll < 0.50) {
        type = DisturbanceType.BATHROOM;
      } else if (roll < 0.70) {
        type = DisturbanceType.ANXIETY;
      } else if (roll < 0.85) {
        type = DisturbanceType.NOISE;
      } else {
        type = DisturbanceType.MEDICATION_SIDE_EFFECTS;
      }

      // Time: spread across the night
      const disturbHour = rng.int(bedHour + 1 > 23 ? 0 : bedHour + 1, wakeUpHour - 1 < 0 ? 5 : wakeUpHour - 1);
      const disturbMin = rng.int(0, 59);
      const disturbDate = new Date(date);
      // If disturbance is past midnight, set to next day
      if (disturbHour < bedHour) {
        disturbDate.setDate(disturbDate.getDate() + 1);
      }
      disturbDate.setHours(disturbHour, disturbMin, 0, 0);

      const severity = clamp(Math.round(rng.normal(
        type === DisturbanceType.PAIN ? 3.5 * recoveryFactor + 1.5 : 2.5,
        0.8
      )), 1, 5);

      const duration = Math.round(clamp(
        rng.normal(severity * 5 + 5, 3),
        2, 45
      ));

      totalDisturbanceMinutes += duration;

      disturbances.push({
        type,
        time: disturbDate.toISOString(),
        durationMinutes: duration,
        severity,
      });
    }

    // --- Wake time ---
    const wakeVariation = rng.normal(0, profile.bedtimeVariability * 0.8);
    const weekendWakeShift = isWeekend ? rng.float(20, 60) : 0;
    const wakeMinutes = Math.round(
      profile.baselineWakeMinutes + weekendWakeShift + wakeVariation
    );

    const wakeDate = new Date(date);
    wakeDate.setDate(wakeDate.getDate() + 1); // wake is next day
    const wakeHour = Math.floor(wakeMinutes / 60) % 24;
    const wakeMin = wakeMinutes % 60;
    wakeDate.setHours(wakeHour, wakeMin, 0, 0);
    const wakeTime = wakeDate.toISOString();

    // --- Environment ---
    const roomTemp = round1(rng.normal(
      profile.isGoodSleeper ? 68 : 72, 2
    ));
    const noiseLevel = clamp(Math.round(rng.normal(
      profile.isGoodSleeper ? 1.5 : 2.5, 0.7
    )), 1, 5) as 1 | 2 | 3 | 4 | 5;
    const lightLevel = clamp(Math.round(rng.normal(
      profile.isGoodSleeper ? 1.3 : 2.2, 0.6
    )), 1, 5) as 1 | 2 | 3 | 4 | 5;

    const environment: SleepEnvironment = {
      roomTemperatureFahrenheit: roomTemp,
      noiseLevel,
      lightLevel,
    };

    // --- Sleep hygiene factors ---
    const screenTimeBeforeBed = Math.round(clamp(
      rng.normal(profile.isGoodSleeper ? 15 : 55, 15),
      0, 120
    ));
    const lastCaffeineHours = round1(clamp(
      rng.normal(profile.isGoodSleeper ? 8 : 4, 2),
      0, 24
    ));
    const exerciseHoursBeforeBed = round1(clamp(
      rng.normal(profile.isGoodSleeper ? 6 : 3, 2),
      0, 16
    ));
    const alcoholConsumed = rng.boolean(isWeekend ? 0.3 : 0.1);
    const heavyMealHours = round1(clamp(
      rng.normal(profile.isGoodSleeper ? 3.5 : 1.5, 1),
      0, 8
    ));

    const hygieneFactors: SleepHygieneFactors = {
      screenTimeBeforeBedMinutes: screenTimeBeforeBed,
      lastCaffeineHoursBeforeBed: lastCaffeineHours,
      exerciseHoursBeforeBed: exerciseHoursBeforeBed,
      alcoholConsumed,
      heavyMealBeforeBedHours: heavyMealHours,
    };

    // --- Naps ---
    const naps: NapEntry[] = [];
    // More naps when sleep-deprived or in early recovery
    const napProbability = profile.isGoodSleeper
      ? 0.1 + recoveryFactor * 0.2
      : 0.25 + recoveryFactor * 0.3;

    if (rng.boolean(napProbability)) {
      const napHour = rng.int(12, 16);
      const napDuration = Math.round(clamp(
        rng.normal(profile.isGoodSleeper ? 25 : 50, 15),
        10, 120
      ));
      const napDate = new Date(date);
      napDate.setHours(napHour, rng.int(0, 59), 0, 0);

      naps.push({
        id: `nap-${profile.patientId}-d${day}`,
        patientId: profile.patientId,
        date: dateStr,
        startTime: napDate.toISOString(),
        durationMinutes: napDuration,
        quality: clamp(Math.round(rng.normal(3, 0.8)), 1, 5) as SleepQualityRating,
      });
    }

    // Second nap (more likely for very disrupted sleepers in early recovery)
    if (!profile.isGoodSleeper && rng.boolean(0.1 + recoveryFactor * 0.15)) {
      const napHour2 = rng.int(9, 11);
      const napDuration2 = Math.round(clamp(rng.normal(30, 10), 10, 60));
      const napDate2 = new Date(date);
      napDate2.setHours(napHour2, rng.int(0, 59), 0, 0);

      naps.push({
        id: `nap-${profile.patientId}-d${day}-2`,
        patientId: profile.patientId,
        date: dateStr,
        startTime: napDate2.toISOString(),
        durationMinutes: napDuration2,
        quality: clamp(Math.round(rng.normal(2.5, 0.8)), 1, 5) as SleepQualityRating,
      });
    }

    // --- Quality rating ---
    // Based on sleep efficiency, disturbances, pain
    const timeInBed = minutesBetween(bedtime, wakeTime);
    const wasoMinutes = totalDisturbanceMinutes;
    const actualSleep = Math.max(0, timeInBed - sleepOnsetLatency - wasoMinutes);
    const efficiency = timeInBed > 0 ? (actualSleep / timeInBed) * 100 : 0;

    let qualityBase = 3;
    if (efficiency >= 90) qualityBase = 5;
    else if (efficiency >= 80) qualityBase = 4;
    else if (efficiency >= 70) qualityBase = 3;
    else if (efficiency >= 60) qualityBase = 2;
    else qualityBase = 1;

    // Adjust for pain
    if (painBeforeBed >= 6) qualityBase -= 1;
    if (numDisturbances >= 3) qualityBase -= 1;

    const qualityRating = clamp(qualityBase, 1, 5) as SleepQualityRating;

    // --- Exercise ---
    const exerciseDuringDay = rng.boolean(
      postSurgDay < 3 ? 0.1 : postSurgDay < 14 ? 0.4 : 0.6
    );
    const exerciseMinutes = exerciseDuringDay
      ? Math.round(clamp(rng.normal(
          postSurgDay < 7 ? 15 : postSurgDay < 14 ? 25 : 35,
          10
        ), 5, 90))
      : 0;

    // --- Medications ---
    const meds: string[] = [];
    // In early recovery, more likely to take pain meds
    if (rng.boolean(0.3 + recoveryFactor * 0.5)) {
      meds.push(rng.pick(['Oxycodone 5mg', 'Tramadol 50mg', 'Gabapentin 300mg'] as const));
    }
    if (rng.boolean(0.2)) {
      meds.push(rng.pick(['Ibuprofen 400mg', 'Acetaminophen 500mg'] as const));
    }
    // Sleep aids
    if (!profile.isGoodSleeper && rng.boolean(0.25)) {
      meds.push(rng.pick(['Zolpidem 10mg', 'Melatonin 5mg'] as const));
    }
    // Steroids (can disrupt sleep)
    if (rng.boolean(0.05 + recoveryFactor * 0.1)) {
      meds.push('Prednisone 10mg');
    }

    entries.push({
      id: `sleep-${profile.patientId}-d${day}`,
      patientId: profile.patientId,
      date: dateStr,
      bedtime,
      wakeTime,
      sleepOnsetLatencyMinutes: sleepOnsetLatency,
      qualityRating,
      disturbances,
      environment,
      hygieneFactors,
      naps,
      painLevelBeforeBed: painBeforeBed,
      medicationsTakenBeforeBed: [...new Set(meds)],
      exerciseDuringDay,
      exerciseMinutes,
    });
  }

  return entries;
}

/**
 * Generates the full seed dataset: 30 patients x 30 days.
 * Mix of good sleepers and disturbed sleepers with varied surgery types.
 */
export function generateSleepSeedData(): {
  entries: SleepLogEntry[];
  patientIds: string[];
  profiles: SleepPatientProfile[];
} {
  const patientCount = 30;
  const dayCount = 30;
  const baseSurgeryDate = new Date('2025-12-01T08:00:00.000Z');

  const allEntries: SleepLogEntry[] = [];
  const patientIds: string[] = [];
  const profiles: SleepPatientProfile[] = [];

  for (let p = 0; p < patientCount; p++) {
    const patientId = `sleep-patient-${(p + 1).toString().padStart(3, '0')}`;
    patientIds.push(patientId);

    const rng = new SeededRandom(77 + p * 211);

    // Determine patient archetype
    // 40% good sleepers, 40% moderate, 20% poor sleepers
    const isGoodSleeper = p < 12;
    const isModerate = p >= 12 && p < 24;

    // Stagger surgery dates
    const daysPostSurgery = rng.int(1, 5);
    const surgeryDate = new Date(baseSurgeryDate);
    surgeryDate.setDate(surgeryDate.getDate() - daysPostSurgery);

    // Bedtime: good sleepers 22:00-23:00, poor sleepers 23:30-01:00
    const baselineBedtimeMinutes = isGoodSleeper
      ? rng.int(22 * 60, 23 * 60)
      : isModerate
        ? rng.int(22 * 60 + 30, 23 * 60 + 30)
        : rng.int(23 * 60 + 30, 25 * 60); // 23:30-01:00 (25*60 = 1:00 next day via mod)

    // Wake time: good sleepers 06:00-07:00, poor sleepers 07:30-09:00
    const baselineWakeMinutes = isGoodSleeper
      ? rng.int(6 * 60, 7 * 60)
      : isModerate
        ? rng.int(6 * 60 + 30, 7 * 60 + 30)
        : rng.int(7 * 60 + 30, 9 * 60);

    const profile: SleepPatientProfile = {
      patientId,
      surgeryType: rng.pick(SURGERY_TYPES_LIST),
      daysPostSurgery,
      baselineBedtimeMinutes,
      baselineWakeMinutes,
      baseSleepQuality: isGoodSleeper ? rng.int(4, 5) : isModerate ? rng.int(3, 4) : rng.int(1, 3),
      painSensitivity: rng.float(0.5, 1.5),
      anxietyLevel: isGoodSleeper ? rng.float(1, 3) : isModerate ? rng.float(3, 6) : rng.float(5, 9),
      isGoodSleeper,
      primaryMedications: rng.pickN([...MEDICATIONS_AFFECTING_SLEEP], rng.int(1, 3)),
      bedtimeVariability: isGoodSleeper ? rng.float(10, 20) : rng.float(25, 50),
      hasApneaRisk: rng.boolean(0.12),
    };

    profiles.push(profile);

    const entries = generatePatientSleepData(
      profile,
      baseSurgeryDate,
      dayCount,
      77 + p * 211 + 500
    );
    allEntries.push(...entries);
  }

  return { entries: allEntries, patientIds, profiles };
}

// ============================================================================
// SleepTrackingService Implementation
// ============================================================================

class SleepTrackingServiceImpl {
  private entries: SleepLogEntry[] = [];
  private alerts: SleepAlert[] = [];
  private patientProfiles: Map<string, SleepPatientProfile> = new Map();

  // --------------------------------------------------------------------------
  // Sleep Log CRUD
  // --------------------------------------------------------------------------

  /**
   * Records a new sleep log entry.
   * Validates quality rating is 1-5 and computes derived data.
   * Runs alert checks after recording.
   */
  recordSleepEntry(
    entry: Omit<SleepLogEntry, 'id'> & { id?: string }
  ): SleepLogEntry {
    if (entry.qualityRating < 1 || entry.qualityRating > 5) {
      throw new Error(
        `Sleep quality rating must be 1-5, received: ${entry.qualityRating}`
      );
    }

    const fullEntry: SleepLogEntry = {
      id: entry.id ?? generateId('sleep'),
      ...entry,
    };

    this.entries.push(fullEntry);
    this.checkAlerts(fullEntry.patientId);
    return fullEntry;
  }

  /**
   * Bulk-load sleep entries (used for seed data and testing).
   */
  loadEntries(entries: SleepLogEntry[]): void {
    this.entries.push(...entries);
  }

  /**
   * Loads patient profiles from seed data generation.
   */
  loadProfiles(profiles: SleepPatientProfile[]): void {
    for (const profile of profiles) {
      this.patientProfiles.set(profile.patientId, profile);
    }
  }

  /**
   * Retrieves all sleep log entries for a patient, optionally filtered by date range.
   */
  getEntries(
    patientId: string,
    startDate?: string,
    endDate?: string
  ): SleepLogEntry[] {
    let results = this.entries.filter((e) => e.patientId === patientId);
    if (startDate) {
      results = results.filter((e) => e.date >= startDate);
    }
    if (endDate) {
      results = results.filter((e) => e.date <= endDate);
    }
    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Returns the most recent N entries for a patient.
   */
  getRecentEntries(patientId: string, count: number): SleepLogEntry[] {
    const all = this.getEntries(patientId);
    return all.slice(-count);
  }

  /**
   * Clears all data. Useful for testing.
   */
  clearAll(): void {
    this.entries = [];
    this.alerts = [];
    this.patientProfiles.clear();
  }

  // --------------------------------------------------------------------------
  // Sleep Metrics Calculation
  // --------------------------------------------------------------------------

  /**
   * Computes nightly sleep metrics for a single entry.
   */
  computeNightlyMetrics(entry: SleepLogEntry): NightlyMetrics {
    const totalTimeInBedMinutes = minutesBetween(entry.bedtime, entry.wakeTime);
    const wasoMinutes = entry.disturbances.reduce(
      (sum, d) => sum + d.durationMinutes, 0
    );
    const totalSleepDurationMinutes = Math.max(
      0,
      totalTimeInBedMinutes - entry.sleepOnsetLatencyMinutes - wasoMinutes
    );
    const sleepEfficiency = totalTimeInBedMinutes > 0
      ? round2((totalSleepDurationMinutes / totalTimeInBedMinutes) * 100)
      : 0;
    const totalNapMinutes = entry.naps.reduce(
      (sum, n) => sum + n.durationMinutes, 0
    );

    return {
      date: entry.date,
      totalTimeInBedMinutes: Math.round(totalTimeInBedMinutes),
      totalSleepDurationMinutes: Math.round(totalSleepDurationMinutes),
      sleepEfficiency: clamp(sleepEfficiency, 0, 100),
      sleepOnsetLatencyMinutes: entry.sleepOnsetLatencyMinutes,
      wasoMinutes: Math.round(wasoMinutes),
      numberOfAwakenings: entry.disturbances.length,
      qualityRating: entry.qualityRating,
      totalNapMinutes,
    };
  }

  /**
   * Computes nightly metrics for all entries of a patient.
   */
  getAllNightlyMetrics(patientId: string): NightlyMetrics[] {
    const entries = this.getEntries(patientId);
    return entries.map((e) => this.computeNightlyMetrics(e));
  }

  /**
   * Calculates total sleep duration in hours for a given entry (nightly sleep only, excludes naps).
   */
  getTotalSleepDuration(entry: SleepLogEntry): number {
    const metrics = this.computeNightlyMetrics(entry);
    return round2(metrics.totalSleepDurationMinutes / 60);
  }

  /**
   * Calculates sleep efficiency for a given entry.
   * Formula: (time asleep / time in bed) * 100
   */
  getSleepEfficiency(entry: SleepLogEntry): number {
    return this.computeNightlyMetrics(entry).sleepEfficiency;
  }

  /**
   * Calculates cumulative sleep debt.
   *
   * Sleep debt = sum of (recommended - actual) for each night.
   * Recommended hours vary by age but default to 7.5 for post-surgical patients.
   */
  calculateSleepDebt(
    patientId: string,
    recommendedHoursPerNight: number = 7.5
  ): SleepDebt {
    const metrics = this.getAllNightlyMetrics(patientId);

    if (metrics.length === 0) {
      return {
        patientId,
        recommendedHoursPerNight,
        cumulativeDebtHours: 0,
        averageNightlyDeficitHours: 0,
        daysTracked: 0,
        debtTrend: TrendDirection.STABLE,
      };
    }

    let cumulativeDebt = 0;
    const deficits: number[] = [];

    for (const night of metrics) {
      const actualHours = night.totalSleepDurationMinutes / 60;
      const deficit = recommendedHoursPerNight - actualHours;
      cumulativeDebt += deficit;
      deficits.push(deficit);
    }

    // Trend: compare first half to second half
    let debtTrend: TrendDirection = TrendDirection.STABLE;
    if (deficits.length >= 6) {
      const midpoint = Math.floor(deficits.length / 2);
      const firstHalf = mean(deficits.slice(0, midpoint));
      const secondHalf = mean(deficits.slice(midpoint));
      const diff = secondHalf - firstHalf;
      if (diff < -0.3) debtTrend = TrendDirection.IMPROVING;
      else if (diff > 0.3) debtTrend = TrendDirection.WORSENING;
    }

    return {
      patientId,
      recommendedHoursPerNight,
      cumulativeDebtHours: round2(Math.max(0, cumulativeDebt)),
      averageNightlyDeficitHours: round2(mean(deficits)),
      daysTracked: metrics.length,
      debtTrend,
    };
  }

  // --------------------------------------------------------------------------
  // Sleep Pattern Analysis
  // --------------------------------------------------------------------------

  /**
   * Detects the patient's circadian rhythm: average bedtime, wake time,
   * and their variability.
   */
  analyzeCircadianRhythm(patientId: string): CircadianRhythm {
    const entries = this.getEntries(patientId);

    if (entries.length === 0) {
      return {
        averageBedtime: '23:00',
        averageWakeTime: '07:00',
        averageSleepDuration: 8,
        bedtimeStdDevMinutes: 0,
        wakeTimeStdDevMinutes: 0,
      };
    }

    // Convert bedtimes to minutes-from-midnight, handling overnight wrap
    // We normalize bedtimes: if hour < 12, treat as next-day (add 24h worth of minutes)
    const bedtimeMinutes: number[] = [];
    const wakeMinutes: number[] = [];
    const durations: number[] = [];

    for (const entry of entries) {
      const bedM = timeToMinutesFromMidnight(entry.bedtime);
      // Normalize: bedtime before noon means it's past midnight
      const normalizedBed = bedM < 720 ? bedM + 1440 : bedM;
      bedtimeMinutes.push(normalizedBed);

      const wakeM = timeToMinutesFromMidnight(entry.wakeTime);
      wakeMinutes.push(wakeM);

      const metrics = this.computeNightlyMetrics(entry);
      durations.push(metrics.totalSleepDurationMinutes / 60);
    }

    const avgBedMinutes = mean(bedtimeMinutes);
    const avgWakeMinutes = mean(wakeMinutes);

    return {
      averageBedtime: minutesToTimeString(avgBedMinutes),
      averageWakeTime: minutesToTimeString(avgWakeMinutes),
      averageSleepDuration: round2(mean(durations)),
      bedtimeStdDevMinutes: round1(standardDeviation(bedtimeMinutes)),
      wakeTimeStdDevMinutes: round1(standardDeviation(wakeMinutes)),
    };
  }

  /**
   * Calculates a consistency score (0-100) measuring how regular
   * the patient's sleep schedule is.
   *
   * Components:
   *  - Bedtime consistency: low stddev => high score
   *  - Wake time consistency: low stddev => high score
   *  - Duration consistency: low stddev => high score
   */
  calculateConsistencyScore(patientId: string): ConsistencyScore {
    const entries = this.getEntries(patientId);

    if (entries.length < 3) {
      return { overall: 0, bedtimeConsistency: 0, wakeTimeConsistency: 0, durationConsistency: 0 };
    }

    const bedtimeMinutes: number[] = [];
    const wakeMinutes: number[] = [];
    const durations: number[] = [];

    for (const entry of entries) {
      const bedM = timeToMinutesFromMidnight(entry.bedtime);
      bedtimeMinutes.push(bedM < 720 ? bedM + 1440 : bedM);
      wakeMinutes.push(timeToMinutesFromMidnight(entry.wakeTime));

      const metrics = this.computeNightlyMetrics(entry);
      durations.push(metrics.totalSleepDurationMinutes);
    }

    // Score function: stddev of 0 => 100, stddev of 120 minutes => 0 (linear)
    const scoreFromStdDev = (stddev: number, maxStdDev: number): number => {
      return clamp(Math.round((1 - stddev / maxStdDev) * 100), 0, 100);
    };

    const bedtimeConsistency = scoreFromStdDev(standardDeviation(bedtimeMinutes), 120);
    const wakeTimeConsistency = scoreFromStdDev(standardDeviation(wakeMinutes), 120);
    const durationConsistency = scoreFromStdDev(standardDeviation(durations), 120);

    const overall = Math.round(
      (bedtimeConsistency + wakeTimeConsistency + durationConsistency) / 3
    );

    return { overall, bedtimeConsistency, wakeTimeConsistency, durationConsistency };
  }

  /**
   * Analyzes overall sleep trend direction over the tracking period.
   * Compares the first third of nights to the last third.
   */
  analyzeTrend(patientId: string): TrendDirection {
    const metrics = this.getAllNightlyMetrics(patientId);

    if (metrics.length < 6) return TrendDirection.STABLE;

    const third = Math.floor(metrics.length / 3);
    const firstThird = metrics.slice(0, third);
    const lastThird = metrics.slice(-third);

    const firstAvgEfficiency = mean(firstThird.map((m) => m.sleepEfficiency));
    const lastAvgEfficiency = mean(lastThird.map((m) => m.sleepEfficiency));

    const firstAvgDuration = mean(firstThird.map((m) => m.totalSleepDurationMinutes));
    const lastAvgDuration = mean(lastThird.map((m) => m.totalSleepDurationMinutes));

    // Combine efficiency and duration changes
    const efficiencyChange = lastAvgEfficiency - firstAvgEfficiency;
    const durationChangeMinutes = lastAvgDuration - firstAvgDuration;

    // Improving: efficiency up by 5+ or duration up by 30+ min
    if (efficiencyChange > 5 || durationChangeMinutes > 30) {
      return TrendDirection.IMPROVING;
    }
    // Worsening: efficiency down by 5+ or duration down by 30+ min
    if (efficiencyChange < -5 || durationChangeMinutes < -30) {
      return TrendDirection.WORSENING;
    }
    return TrendDirection.STABLE;
  }

  /**
   * Analyzes sleep patterns by day of week.
   */
  analyzeDayOfWeekPatterns(patientId: string): DayOfWeekPattern[] {
    const entries = this.getEntries(patientId);

    // Group by day of week (based on bedtime date)
    const groups: Map<number, SleepLogEntry[]> = new Map();
    for (let dow = 0; dow < 7; dow++) {
      groups.set(dow, []);
    }

    for (const entry of entries) {
      const dow = new Date(entry.date).getDay();
      groups.get(dow)!.push(entry);
    }

    const patterns: DayOfWeekPattern[] = [];

    for (const [dow, dayEntries] of groups) {
      if (dayEntries.length === 0) {
        patterns.push({
          dayOfWeek: dow,
          dayName: DAY_NAMES[dow],
          averageDurationHours: 0,
          averageQuality: 0,
          averageBedtimeMinutesFromMidnight: 0,
          entryCount: 0,
        });
        continue;
      }

      const metrics = dayEntries.map((e) => this.computeNightlyMetrics(e));
      const bedtimeMinutes = dayEntries.map((e) => {
        const m = timeToMinutesFromMidnight(e.bedtime);
        return m < 720 ? m + 1440 : m;
      });

      patterns.push({
        dayOfWeek: dow,
        dayName: DAY_NAMES[dow],
        averageDurationHours: round2(
          mean(metrics.map((m) => m.totalSleepDurationMinutes)) / 60
        ),
        averageQuality: round2(mean(dayEntries.map((e) => e.qualityRating))),
        averageBedtimeMinutesFromMidnight: Math.round(mean(bedtimeMinutes)),
        entryCount: dayEntries.length,
      });
    }

    return patterns.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  /**
   * Computes correlations between sleep metrics and external factors:
   *  - Pain levels
   *  - Medication timing
   *  - Exercise
   *  - Screen time
   *  - Caffeine timing
   *  - Room temperature
   */
  analyzeCorrelations(patientId: string): SleepCorrelation[] {
    const entries = this.getEntries(patientId);
    if (entries.length < 5) return [];

    const metrics = entries.map((e) => this.computeNightlyMetrics(e));
    const efficiencies = metrics.map((m) => m.sleepEfficiency);
    const durations = metrics.map((m) => m.totalSleepDurationMinutes / 60);
    const qualities = entries.map((e) => e.qualityRating);

    const correlations: SleepCorrelation[] = [];

    // 1. Pain vs. sleep quality
    const painLevels = entries.map((e) => e.painLevelBeforeBed);
    const painQualityR = pearsonCorrelation(painLevels, qualities);
    const painCat = categorizeCorrelation(painQualityR);
    correlations.push({
      factor: 'Pain Level Before Bed',
      correlationCoefficient: round2(painQualityR),
      strength: painCat.strength,
      direction: painCat.direction,
      description: `Higher pre-bed pain is ${painCat.strength}ly associated with ${painQualityR < 0 ? 'lower' : 'higher'} sleep quality.`,
      sampleSize: entries.length,
    });

    // 2. Pain vs. sleep duration
    const painDurationR = pearsonCorrelation(painLevels, durations);
    const painDurCat = categorizeCorrelation(painDurationR);
    correlations.push({
      factor: 'Pain Level vs. Sleep Duration',
      correlationCoefficient: round2(painDurationR),
      strength: painDurCat.strength,
      direction: painDurCat.direction,
      description: `Higher pre-bed pain has a ${painDurCat.strength} ${painDurCat.direction} correlation with sleep duration.`,
      sampleSize: entries.length,
    });

    // 3. Screen time vs. sleep onset latency
    const screenTimes = entries.map((e) => e.hygieneFactors.screenTimeBeforeBedMinutes);
    const latencies = entries.map((e) => e.sleepOnsetLatencyMinutes);
    const screenLatencyR = pearsonCorrelation(screenTimes, latencies);
    const screenCat = categorizeCorrelation(screenLatencyR);
    correlations.push({
      factor: 'Screen Time vs. Sleep Onset Latency',
      correlationCoefficient: round2(screenLatencyR),
      strength: screenCat.strength,
      direction: screenCat.direction,
      description: `Screen time before bed has a ${screenCat.strength} ${screenCat.direction} correlation with time to fall asleep.`,
      sampleSize: entries.length,
    });

    // 4. Caffeine timing vs. sleep efficiency
    const caffeineTiming = entries.map((e) => e.hygieneFactors.lastCaffeineHoursBeforeBed);
    const caffeineEffR = pearsonCorrelation(caffeineTiming, efficiencies);
    const caffeineCat = categorizeCorrelation(caffeineEffR);
    correlations.push({
      factor: 'Caffeine Timing vs. Sleep Efficiency',
      correlationCoefficient: round2(caffeineEffR),
      strength: caffeineCat.strength,
      direction: caffeineCat.direction,
      description: `Longer caffeine-free period before bed has a ${caffeineCat.strength} ${caffeineCat.direction} correlation with sleep efficiency.`,
      sampleSize: entries.length,
    });

    // 5. Exercise vs. sleep quality
    const exerciseMinutes = entries.map((e) => e.exerciseMinutes);
    const exerciseQualityR = pearsonCorrelation(exerciseMinutes, qualities);
    const exerciseCat = categorizeCorrelation(exerciseQualityR);
    correlations.push({
      factor: 'Exercise Duration vs. Sleep Quality',
      correlationCoefficient: round2(exerciseQualityR),
      strength: exerciseCat.strength,
      direction: exerciseCat.direction,
      description: `Exercise during the day has a ${exerciseCat.strength} ${exerciseCat.direction} correlation with sleep quality.`,
      sampleSize: entries.length,
    });

    // 6. Room temperature vs. sleep efficiency
    const roomTemps = entries.map((e) => e.environment.roomTemperatureFahrenheit);
    const tempEffR = pearsonCorrelation(roomTemps, efficiencies);
    const tempCat = categorizeCorrelation(tempEffR);
    correlations.push({
      factor: 'Room Temperature vs. Sleep Efficiency',
      correlationCoefficient: round2(tempEffR),
      strength: tempCat.strength,
      direction: tempCat.direction,
      description: `Room temperature has a ${tempCat.strength} ${tempCat.direction} relationship with sleep efficiency.`,
      sampleSize: entries.length,
    });

    // 7. Number of medications vs. disturbances
    const medCounts = entries.map((e) => e.medicationsTakenBeforeBed.length);
    const disturbanceCounts = metrics.map((m) => m.numberOfAwakenings);
    const medDisturbR = pearsonCorrelation(medCounts, disturbanceCounts);
    const medCat = categorizeCorrelation(medDisturbR);
    correlations.push({
      factor: 'Medication Count vs. Awakenings',
      correlationCoefficient: round2(medDisturbR),
      strength: medCat.strength,
      direction: medCat.direction,
      description: `Number of bedtime medications has a ${medCat.strength} ${medCat.direction} correlation with nighttime awakenings.`,
      sampleSize: entries.length,
    });

    return correlations.sort(
      (a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient)
    );
  }

  // --------------------------------------------------------------------------
  // Sleep Hygiene Scoring
  // --------------------------------------------------------------------------

  /**
   * Rates patient's sleep hygiene on a 0-100 scale.
   *
   * Components (each 0-20):
   *  1. Consistent bedtime: stddev <= 30 min => full marks
   *  2. Screen time before bed: <= 15 min => full marks
   *  3. Caffeine intake timing: >= 8 hours before bed => full marks
   *  4. Exercise timing: >= 4 hours before bed => full marks
   *  5. Bedroom environment: optimal temp (65-68F), low noise, low light
   */
  calculateSleepHygieneScore(patientId: string): SleepHygieneScore {
    const entries = this.getEntries(patientId);

    if (entries.length === 0) {
      return {
        patientId,
        overallScore: 0,
        consistentBedtimeScore: 0,
        screenTimeScore: 0,
        caffeineTimingScore: 0,
        exerciseTimingScore: 0,
        environmentScore: 0,
        details: ['No sleep data available.'],
      };
    }

    const details: string[] = [];

    // 1. Bedtime consistency (0-20)
    const bedtimeMinutes = entries.map((e) => {
      const m = timeToMinutesFromMidnight(e.bedtime);
      return m < 720 ? m + 1440 : m;
    });
    const bedtimeStdDev = standardDeviation(bedtimeMinutes);
    // Perfect: stddev <= 15 min, zero: stddev >= 90 min
    const consistentBedtimeScore = Math.round(
      clamp(20 * (1 - (bedtimeStdDev - 15) / 75), 0, 20)
    );
    if (bedtimeStdDev <= 30) {
      details.push('Good: Bedtime is consistent (within +/- 30 minutes).');
    } else if (bedtimeStdDev <= 60) {
      details.push('Fair: Bedtime varies moderately. Try to be more consistent.');
    } else {
      details.push('Poor: Bedtime is highly irregular. Establish a consistent sleep schedule.');
    }

    // 2. Screen time before bed (0-20)
    const avgScreenTime = mean(
      entries.map((e) => e.hygieneFactors.screenTimeBeforeBedMinutes)
    );
    // Perfect: <= 10 min, zero: >= 90 min
    const screenTimeScore = Math.round(
      clamp(20 * (1 - (avgScreenTime - 10) / 80), 0, 20)
    );
    if (avgScreenTime <= 15) {
      details.push('Good: Minimal screen time before bed.');
    } else if (avgScreenTime <= 45) {
      details.push('Fair: Moderate screen time before bed. Consider reducing to improve sleep onset.');
    } else {
      details.push('Poor: Excessive screen time before bed. Blue light exposure disrupts melatonin production.');
    }

    // 3. Caffeine timing (0-20)
    const avgCaffeineTiming = mean(
      entries.map((e) => e.hygieneFactors.lastCaffeineHoursBeforeBed)
    );
    // Perfect: >= 8 hours, zero: <= 1 hour
    const caffeineTimingScore = Math.round(
      clamp(20 * ((avgCaffeineTiming - 1) / 7), 0, 20)
    );
    if (avgCaffeineTiming >= 8) {
      details.push('Good: Caffeine intake is well-timed (8+ hours before bed).');
    } else if (avgCaffeineTiming >= 4) {
      details.push('Fair: Caffeine consumed moderately close to bedtime. Aim for 8+ hours before bed.');
    } else {
      details.push('Poor: Caffeine consumed too close to bedtime. Caffeine has a 6-hour half-life.');
    }

    // 4. Exercise timing (0-20)
    const avgExerciseTiming = mean(
      entries.map((e) => e.hygieneFactors.exerciseHoursBeforeBed)
    );
    // Perfect: >= 4 hours before bed, zero: <= 1 hour
    const exerciseTimingScore = Math.round(
      clamp(20 * ((avgExerciseTiming - 1) / 3), 0, 20)
    );
    if (avgExerciseTiming >= 4) {
      details.push('Good: Exercise is well-timed relative to bedtime.');
    } else if (avgExerciseTiming >= 2) {
      details.push('Fair: Exercise sometimes occurs close to bedtime. Allow 3-4 hours of wind-down.');
    } else {
      details.push('Poor: Exercise too close to bedtime. This elevates core body temperature and adrenaline.');
    }

    // 5. Environment (0-20)
    const avgTemp = mean(entries.map((e) => e.environment.roomTemperatureFahrenheit));
    const avgNoise = mean(entries.map((e) => e.environment.noiseLevel));
    const avgLight = mean(entries.map((e) => e.environment.lightLevel));

    // Temperature: optimal 65-68 F
    const tempScore = clamp(
      avgTemp >= 65 && avgTemp <= 68
        ? 8
        : avgTemp >= 62 && avgTemp <= 72
          ? 5
          : 2,
      0, 8
    );
    // Noise: 1=best, 5=worst
    const noiseScore = clamp(Math.round(6 * (1 - (avgNoise - 1) / 4)), 0, 6);
    // Light: 1=best, 5=worst
    const lightScore = clamp(Math.round(6 * (1 - (avgLight - 1) / 4)), 0, 6);
    const environmentScore = tempScore + noiseScore + lightScore;

    if (environmentScore >= 16) {
      details.push('Good: Bedroom environment is well-optimized for sleep.');
    } else if (environmentScore >= 10) {
      details.push('Fair: Bedroom environment could be improved. Optimize temperature, noise, and light.');
    } else {
      details.push('Poor: Bedroom environment is not conducive to quality sleep.');
    }

    if (avgTemp > 72) {
      details.push('Tip: Room is too warm. Optimal sleep temperature is 65-68F (18-20C).');
    } else if (avgTemp < 62) {
      details.push('Tip: Room may be too cool. Optimal sleep temperature is 65-68F (18-20C).');
    }

    const overallScore = consistentBedtimeScore + screenTimeScore +
      caffeineTimingScore + exerciseTimingScore + environmentScore;

    return {
      patientId,
      overallScore: clamp(overallScore, 0, 100),
      consistentBedtimeScore,
      screenTimeScore,
      caffeineTimingScore,
      exerciseTimingScore,
      environmentScore,
      details,
    };
  }

  // --------------------------------------------------------------------------
  // Recommendations Engine
  // --------------------------------------------------------------------------

  /**
   * Generates personalized sleep improvement recommendations based on
   * the patient's sleep patterns, hygiene score, and surgical context.
   */
  generateRecommendations(patientId: string): SleepRecommendation[] {
    const entries = this.getEntries(patientId);
    if (entries.length === 0) return [];

    const recommendations: SleepRecommendation[] = [];
    const metrics = this.getAllNightlyMetrics(patientId);
    const hygieneScore = this.calculateSleepHygieneScore(patientId);
    const circadian = this.analyzeCircadianRhythm(patientId);
    const consistency = this.calculateConsistencyScore(patientId);
    const recentEntries = entries.slice(-7);

    let recId = 0;
    const addRec = (
      category: string,
      priority: number,
      title: string,
      description: string,
      rationale: string
    ) => {
      recId++;
      recommendations.push({
        id: `rec-${patientId}-${recId}`,
        patientId,
        category,
        priority,
        title,
        description,
        rationale,
      });
    };

    // --- Consistency recommendations ---
    if (consistency.bedtimeConsistency < 60) {
      addRec(
        'schedule',
        1,
        'Establish a Consistent Bedtime',
        `Try going to bed within 30 minutes of ${circadian.averageBedtime} each night, including weekends. ` +
        'Set a recurring alarm to remind you when to start your wind-down routine.',
        `Your bedtime varies by ${Math.round(circadian.bedtimeStdDevMinutes)} minutes on average. ` +
        'Irregular sleep schedules disrupt the circadian rhythm and reduce sleep quality.'
      );
    }

    if (consistency.wakeTimeConsistency < 60) {
      addRec(
        'schedule',
        1,
        'Wake at the Same Time Daily',
        `Aim to wake up within 30 minutes of ${circadian.averageWakeTime} every day. ` +
        'This is the single most effective way to regulate your body clock.',
        `Your wake time varies by ${Math.round(circadian.wakeTimeStdDevMinutes)} minutes. ` +
        'Consistent wake times anchor your circadian rhythm more effectively than consistent bedtimes.'
      );
    }

    // --- Hygiene recommendations ---
    if (hygieneScore.screenTimeScore < 10) {
      addRec(
        'hygiene',
        2,
        'Reduce Screen Time Before Bed',
        'Stop using phones, tablets, and computers at least 60 minutes before your target bedtime. ' +
        'If necessary, use blue-light filtering apps or glasses.',
        'Blue light from screens suppresses melatonin production by up to 50%, ' +
        'delaying sleep onset and reducing REM sleep.'
      );
    }

    if (hygieneScore.caffeineTimingScore < 10) {
      addRec(
        'hygiene',
        2,
        'Limit Caffeine After Early Afternoon',
        'Avoid coffee, tea, energy drinks, and chocolate after 2:00 PM. ' +
        'Caffeine has a half-life of 5-6 hours and can remain active for 10+ hours.',
        'Your caffeine intake timing correlates with reduced sleep efficiency.'
      );
    }

    if (hygieneScore.environmentScore < 12) {
      const avgTemp = mean(entries.map((e) => e.environment.roomTemperatureFahrenheit));
      if (avgTemp > 72) {
        addRec(
          'environment',
          2,
          'Cool Your Bedroom',
          `Your average room temperature is ${round1(avgTemp)}F. Lower it to 65-68F (18-20C) ` +
          'using AC, a fan, or lighter bedding. Core body temperature must drop for sleep initiation.',
          'Room temperatures above 72F are associated with reduced sleep efficiency and more awakenings.'
        );
      }

      const avgNoise = mean(entries.map((e) => e.environment.noiseLevel));
      if (avgNoise > 2.5) {
        addRec(
          'environment',
          3,
          'Address Noise in Your Bedroom',
          'Consider using earplugs, a white noise machine, or soundproofing measures. ' +
          'Even noise levels that do not fully awaken you can shift you to lighter sleep stages.',
          'Elevated nighttime noise is disrupting your sleep continuity.'
        );
      }

      const avgLight = mean(entries.map((e) => e.environment.lightLevel));
      if (avgLight > 2) {
        addRec(
          'environment',
          3,
          'Darken Your Sleep Environment',
          'Use blackout curtains, cover LED lights on devices, and consider a sleep mask. ' +
          'Even dim light exposure during sleep suppresses melatonin.',
          'Light exposure during sleep reduces sleep efficiency and disrupts circadian signaling.'
        );
      }
    }

    // --- Pain-related recommendations ---
    const avgPain = mean(entries.map((e) => e.painLevelBeforeBed));
    if (avgPain >= 4) {
      addRec(
        'pain_management',
        1,
        'Optimize Pre-Bedtime Pain Management',
        'Discuss with your care team about timing your pain medication 30-60 minutes before bed. ' +
        'Apply ice or heat therapy before settling in. Practice gentle stretching if approved by your surgeon.',
        `Your average pre-bed pain level is ${round1(avgPain)}/10. ` +
        'Pain is strongly associated with reduced sleep quality and more awakenings.'
      );
    }

    // --- Medication timing ---
    const stimulatingMedNights = recentEntries.filter((e) =>
      e.medicationsTakenBeforeBed.some((m) => STIMULATING_MEDICATIONS.has(m))
    );
    if (stimulatingMedNights.length >= 2) {
      addRec(
        'medication',
        1,
        'Review Stimulating Medication Timing',
        'Discuss with your prescriber about moving stimulating medications (e.g., steroids) to earlier in the day. ' +
        'Prednisone and similar corticosteroids can cause insomnia when taken at bedtime.',
        `Stimulating medications were taken before bed on ${stimulatingMedNights.length} of the last 7 nights.`
      );
    }

    // --- Sleep position recommendations by surgery type ---
    const profile = this.patientProfiles.get(patientId);
    if (profile) {
      const surgeryPositionRecs = this.getSurgeryPositionRecommendation(profile.surgeryType);
      if (surgeryPositionRecs) {
        addRec(
          'sleep_position',
          2,
          surgeryPositionRecs.title,
          surgeryPositionRecs.description,
          surgeryPositionRecs.rationale
        );
      }
    }

    // --- Anxiety-related recommendations ---
    const anxietyDisturbances = entries.reduce((count, e) =>
      count + e.disturbances.filter((d) => d.type === DisturbanceType.ANXIETY).length, 0
    );
    const anxietyRate = anxietyDisturbances / entries.length;
    if (anxietyRate > 0.3) {
      addRec(
        'relaxation',
        2,
        'Practice Pre-Bed Relaxation Techniques',
        'Try progressive muscle relaxation: starting from your toes, tense each muscle group for 5 seconds ' +
        'then release for 30 seconds, working up to your head. Also effective: 4-7-8 breathing ' +
        '(inhale 4 sec, hold 7 sec, exhale 8 sec), guided imagery, or body scan meditation.',
        `Anxiety-related awakenings occur on ${Math.round(anxietyRate * 100)}% of nights. ` +
        'Relaxation techniques reduce cortisol levels and activate the parasympathetic nervous system.'
      );

      addRec(
        'relaxation',
        3,
        'Consider a Worry Journal',
        'Write down your worries and a brief action plan 2-3 hours before bed. ' +
        'This "cognitive offloading" prevents rumination when trying to sleep.',
        'Pre-bed worry has been shown to increase sleep onset latency by 20-40 minutes.'
      );
    }

    // --- Nap recommendations ---
    const avgNapMinutes = mean(
      entries.map((e) => e.naps.reduce((sum, n) => sum + n.durationMinutes, 0))
    );
    if (avgNapMinutes > 40) {
      addRec(
        'napping',
        3,
        'Limit Daytime Naps',
        'Keep naps to 20-30 minutes maximum and avoid napping after 3:00 PM. ' +
        'Long or late naps reduce sleep pressure (adenosine buildup), making it harder to fall asleep at night.',
        `Average daily nap time is ${Math.round(avgNapMinutes)} minutes. ` +
        'Excessive napping can perpetuate a cycle of poor nighttime sleep.'
      );
    }

    // --- Exercise recommendation ---
    const exerciseRate = entries.filter((e) => e.exerciseDuringDay).length / entries.length;
    if (exerciseRate < 0.3) {
      addRec(
        'exercise',
        3,
        'Increase Daytime Physical Activity',
        'Aim for at least 15-20 minutes of gentle activity daily (as approved by your surgeon). ' +
        'Walking is excellent for post-surgical recovery and sleep improvement. ' +
        'Schedule activity in the morning or early afternoon for the best sleep benefit.',
        `You exercised on only ${Math.round(exerciseRate * 100)}% of tracked days. ` +
        'Regular physical activity increases slow-wave (deep) sleep and total sleep duration.'
      );
    }

    // --- Sleep efficiency recommendation ---
    const avgEfficiency = mean(metrics.map((m) => m.sleepEfficiency));
    if (avgEfficiency < 80) {
      addRec(
        'efficiency',
        2,
        'Improve Sleep Efficiency with Stimulus Control',
        'Only use your bed for sleep (and intimacy). If unable to sleep after 20 minutes, ' +
        'get up, go to another room, and do a quiet activity until you feel sleepy. ' +
        'Do not watch the clock. Return to bed only when drowsy.',
        `Your average sleep efficiency is ${Math.round(avgEfficiency)}%. The clinical target is 85%+. ` +
        'Stimulus control is one of the most evidence-based techniques from Cognitive Behavioral Therapy for Insomnia (CBT-I).'
      );
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Returns sleep position recommendations specific to the surgery type.
   */
  private getSurgeryPositionRecommendation(
    surgeryType: SurgeryType
  ): { title: string; description: string; rationale: string } | null {
    switch (surgeryType) {
      case SurgeryType.KNEE_REPLACEMENT:
        return {
          title: 'Sleep Position After Knee Replacement',
          description:
            'Sleep on your back with a pillow under the operated knee to maintain slight flexion. ' +
            'If sleeping on your side, place a pillow between your knees to keep hips aligned. ' +
            'Avoid sleeping with the knee fully bent.',
          rationale:
            'Proper knee positioning during sleep prevents stiffness, reduces swelling, ' +
            'and supports healing of the surgical site.',
        };
      case SurgeryType.HIP_REPLACEMENT:
        return {
          title: 'Sleep Position After Hip Replacement',
          description:
            'Sleep on your back or on the non-operated side with a pillow between your legs. ' +
            'Always keep the operated leg slightly abducted (away from midline). ' +
            'Avoid crossing your legs or rotating the operated hip inward.',
          rationale:
            'Hip precautions must be maintained during sleep to prevent dislocation. ' +
            'The abduction pillow maintains safe hip alignment.',
        };
      case SurgeryType.SPINAL_FUSION:
        return {
          title: 'Sleep Position After Spinal Fusion',
          description:
            'Sleep on your back with a pillow under your knees to reduce spinal pressure, ' +
            'or on your side in a fetal position with a pillow between your knees. ' +
            'Use a firm mattress. Avoid stomach sleeping and twisting motions when turning.',
          rationale:
            'Neutral spinal alignment during sleep is critical for fusion healing. ' +
            'Log-rolling technique should be used when changing positions.',
        };
      case SurgeryType.SHOULDER_ARTHROSCOPY:
        return {
          title: 'Sleep Position After Shoulder Surgery',
          description:
            'Sleep in a reclined position (30-45 degrees) or in a recliner for the first 2-4 weeks. ' +
            'If in bed, prop up with pillows and keep the operated arm supported on a pillow at your side. ' +
            'Do not sleep on the operated shoulder.',
          rationale:
            'Elevated positioning reduces shoulder swelling and pain. ' +
            'Sleeping flat can increase pressure on the repaired structures.',
        };
      case SurgeryType.ABDOMINAL:
        return {
          title: 'Sleep Position After Abdominal Surgery',
          description:
            'Sleep on your back with the head elevated 30 degrees and a pillow under your knees. ' +
            'When getting in/out of bed, roll onto your side and push up with your arms (log roll) ' +
            'to avoid straining your abdominal muscles. A small pillow pressed against the incision ' +
            'provides support when coughing.',
          rationale:
            'Elevation reduces incisional tension and helps prevent acid reflux, which is common post-operatively.',
        };
      case SurgeryType.CARDIAC:
        return {
          title: 'Sleep Position After Cardiac Surgery',
          description:
            'Sleep on your back with the head elevated 30-45 degrees for the first 6 weeks. ' +
            'A wedge pillow or stacked pillows help maintain this position. ' +
            'Avoid sleeping on your side until your surgeon approves. ' +
            'Hug a heart pillow for sternal support if needed.',
          rationale:
            'Elevation reduces fluid accumulation in the lungs and decreases pressure on the healing sternum. ' +
            'Sternal precautions must be maintained.',
        };
      default:
        return null;
    }
  }

  // --------------------------------------------------------------------------
  // Alert System
  // --------------------------------------------------------------------------

  /**
   * Runs all alert checks for a patient and stores any new alerts.
   */
  checkAlerts(patientId: string): SleepAlert[] {
    const newAlerts: SleepAlert[] = [];

    newAlerts.push(...this.checkSleepDeprivation(patientId));
    newAlerts.push(...this.checkExcessiveDaytimeSleep(patientId));
    newAlerts.push(...this.checkSleepApneaRisk(patientId));
    newAlerts.push(...this.checkMedicationInducedInsomnia(patientId));

    for (const alert of newAlerts) {
      this.alerts.push(alert);
    }
    return newAlerts;
  }

  /**
   * Sleep deprivation warning: < 5 hours for 3+ consecutive nights.
   */
  private checkSleepDeprivation(patientId: string): SleepAlert[] {
    const metrics = this.getAllNightlyMetrics(patientId);
    if (metrics.length < 3) return [];

    // Check last 7 nights for consecutive short sleep
    const recent = metrics.slice(-7);
    let consecutiveShort = 0;
    let maxConsecutive = 0;

    for (const night of recent) {
      const hours = night.totalSleepDurationMinutes / 60;
      if (hours < 5) {
        consecutiveShort++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveShort);
      } else {
        consecutiveShort = 0;
      }
    }

    if (maxConsecutive >= 3) {
      // Deduplicate: one alert per day
      const today = toISODate(new Date());
      const existing = this.alerts.find(
        (a) =>
          a.patientId === patientId &&
          a.type === SleepAlertType.SLEEP_DEPRIVATION &&
          a.timestamp.slice(0, 10) === today
      );
      if (existing) return [];

      return [{
        id: generateId('alert-deprivation'),
        patientId,
        type: SleepAlertType.SLEEP_DEPRIVATION,
        severity: maxConsecutive >= 5 ? SleepAlertSeverity.CRITICAL : SleepAlertSeverity.WARNING,
        message:
          `Sleep deprivation detected: less than 5 hours of sleep for ${maxConsecutive} ` +
          `consecutive nights. This significantly impairs recovery, immune function, and pain tolerance. ` +
          'Urgent review of sleep management recommended.',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        data: {
          consecutiveNights: maxConsecutive,
          recentSleepHours: recent.map((m) => round1(m.totalSleepDurationMinutes / 60)),
        },
      }];
    }

    return [];
  }

  /**
   * Excessive daytime sleeping: average nap duration > 90 minutes/day
   * over the last 5 days.
   */
  private checkExcessiveDaytimeSleep(patientId: string): SleepAlert[] {
    const entries = this.getEntries(patientId);
    if (entries.length < 5) return [];

    const recent = entries.slice(-5);
    const avgNapMinutes = mean(
      recent.map((e) => e.naps.reduce((sum, n) => sum + n.durationMinutes, 0))
    );

    if (avgNapMinutes > 90) {
      const today = toISODate(new Date());
      const existing = this.alerts.find(
        (a) =>
          a.patientId === patientId &&
          a.type === SleepAlertType.EXCESSIVE_DAYTIME_SLEEP &&
          a.timestamp.slice(0, 10) === today
      );
      if (existing) return [];

      return [{
        id: generateId('alert-daytime'),
        patientId,
        type: SleepAlertType.EXCESSIVE_DAYTIME_SLEEP,
        severity: SleepAlertSeverity.WARNING,
        message:
          `Excessive daytime sleeping detected: averaging ${Math.round(avgNapMinutes)} minutes ` +
          'of naps per day over the last 5 days. This may indicate poor nighttime sleep, ' +
          'medication side effects, or underlying sleep disorder. Excessive napping can also ' +
          'perpetuate poor nighttime sleep quality.',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        data: {
          averageDailyNapMinutes: Math.round(avgNapMinutes),
        },
      }];
    }

    return [];
  }

  /**
   * Sleep apnea risk screening based on observable indicators:
   *  - Frequent awakenings (>= 4/night average)
   *  - Low sleep efficiency despite adequate time in bed
   *  - High daytime sleepiness (excessive napping)
   *  - Persistent fatigue with adequate sleep duration
   */
  private checkSleepApneaRisk(patientId: string): SleepAlert[] {
    const metrics = this.getAllNightlyMetrics(patientId);
    if (metrics.length < 7) return [];

    const recent = metrics.slice(-7);
    const avgAwakenings = mean(recent.map((m) => m.numberOfAwakenings));
    const avgEfficiency = mean(recent.map((m) => m.sleepEfficiency));
    const avgDuration = mean(recent.map((m) => m.totalSleepDurationMinutes / 60));
    const avgNapMinutes = mean(
      this.getEntries(patientId).slice(-7).map((e) =>
        e.naps.reduce((sum, n) => sum + n.durationMinutes, 0)
      )
    );

    // Risk factors
    let riskScore = 0;
    const screeningQuestions: string[] = [];

    if (avgAwakenings >= 4) {
      riskScore += 2;
      screeningQuestions.push('Frequent nighttime awakenings (avg ' + round1(avgAwakenings) + '/night)');
    }
    if (avgEfficiency < 75 && avgDuration >= 7) {
      riskScore += 2;
      screeningQuestions.push('Low sleep efficiency despite adequate time in bed');
    }
    if (avgNapMinutes > 45) {
      riskScore += 1;
      screeningQuestions.push('Significant daytime sleepiness requiring naps');
    }

    // Also check the patient profile for apnea risk flag
    const profile = this.patientProfiles.get(patientId);
    if (profile?.hasApneaRisk) {
      riskScore += 2;
      screeningQuestions.push('Pre-existing risk factors for obstructive sleep apnea');
    }

    if (riskScore >= 3) {
      const today = toISODate(new Date());
      const existing = this.alerts.find(
        (a) =>
          a.patientId === patientId &&
          a.type === SleepAlertType.SLEEP_APNEA_RISK &&
          a.timestamp.slice(0, 10) === today
      );
      if (existing) return [];

      return [{
        id: generateId('alert-apnea'),
        patientId,
        type: SleepAlertType.SLEEP_APNEA_RISK,
        severity: SleepAlertSeverity.INFO,
        message:
          'Sleep patterns suggest possible sleep apnea risk. Recommend discussing with physician. ' +
          'Screening indicators: ' + screeningQuestions.join('; ') + '. ' +
          'A formal sleep study (polysomnography) may be warranted.',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        data: {
          riskScore,
          screeningQuestions,
          avgAwakenings: round1(avgAwakenings),
          avgEfficiency: round1(avgEfficiency),
        },
      }];
    }

    return [];
  }

  /**
   * Medication-induced insomnia detection.
   * Checks if stimulating medications correlate with poor sleep.
   */
  private checkMedicationInducedInsomnia(patientId: string): SleepAlert[] {
    const entries = this.getEntries(patientId);
    if (entries.length < 7) return [];

    const recent = entries.slice(-14);

    // Split into nights with and without stimulating medications
    const withStimulant: NightlyMetrics[] = [];
    const withoutStimulant: NightlyMetrics[] = [];

    for (const entry of recent) {
      const hasStimulant = entry.medicationsTakenBeforeBed.some(
        (m) => STIMULATING_MEDICATIONS.has(m)
      );
      const metrics = this.computeNightlyMetrics(entry);

      if (hasStimulant) {
        withStimulant.push(metrics);
      } else {
        withoutStimulant.push(metrics);
      }
    }

    if (withStimulant.length < 2 || withoutStimulant.length < 2) return [];

    const stimulantEfficiency = mean(withStimulant.map((m) => m.sleepEfficiency));
    const noStimulantEfficiency = mean(withoutStimulant.map((m) => m.sleepEfficiency));
    const stimulantLatency = mean(withStimulant.map((m) => m.sleepOnsetLatencyMinutes));
    const noStimulantLatency = mean(withoutStimulant.map((m) => m.sleepOnsetLatencyMinutes));

    const efficiencyDrop = noStimulantEfficiency - stimulantEfficiency;
    const latencyIncrease = stimulantLatency - noStimulantLatency;

    // Alert if stimulating meds cause meaningful sleep disruption
    if (efficiencyDrop > 10 || latencyIncrease > 15) {
      const today = toISODate(new Date());
      const existing = this.alerts.find(
        (a) =>
          a.patientId === patientId &&
          a.type === SleepAlertType.MEDICATION_INDUCED_INSOMNIA &&
          a.timestamp.slice(0, 10) === today
      );
      if (existing) return [];

      const culpritMeds = [...new Set(
        recent
          .flatMap((e) => e.medicationsTakenBeforeBed)
          .filter((m) => STIMULATING_MEDICATIONS.has(m))
      )];

      return [{
        id: generateId('alert-med-insomnia'),
        patientId,
        type: SleepAlertType.MEDICATION_INDUCED_INSOMNIA,
        severity: SleepAlertSeverity.WARNING,
        message:
          `Medication-induced insomnia suspected. On nights with stimulating medications ` +
          `(${culpritMeds.join(', ')}), sleep efficiency drops by ${Math.round(efficiencyDrop)}% ` +
          `and sleep onset latency increases by ${Math.round(latencyIncrease)} minutes. ` +
          'Discuss with prescriber about adjusting medication timing.',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        data: {
          culpritMedications: culpritMeds,
          efficiencyWithStimulant: round1(stimulantEfficiency),
          efficiencyWithout: round1(noStimulantEfficiency),
          latencyWithStimulant: round1(stimulantLatency),
          latencyWithout: round1(noStimulantLatency),
        },
      }];
    }

    return [];
  }

  /**
   * Returns all alerts for a patient.
   */
  getAlerts(patientId: string, unacknowledgedOnly: boolean = false): SleepAlert[] {
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

  // --------------------------------------------------------------------------
  // Reporting
  // --------------------------------------------------------------------------

  /**
   * Generates a comprehensive sleep report for a patient.
   *
   * @param patientId - The patient ID
   * @param periodDays - Number of days to include (default 30)
   */
  generateReport(patientId: string, periodDays: number = 30): SleepReport {
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);

    const startStr = toISODate(periodStart);
    const endStr = toISODate(now);

    const entries = this.getEntries(patientId, startStr, endStr);
    const nightlyMetrics = entries.map((e) => this.computeNightlyMetrics(e));

    // Average metrics
    const avgDuration = entries.length > 0
      ? round2(mean(nightlyMetrics.map((m) => m.totalSleepDurationMinutes)) / 60)
      : 0;
    const avgEfficiency = entries.length > 0
      ? round2(mean(nightlyMetrics.map((m) => m.sleepEfficiency)))
      : 0;
    const avgLatency = entries.length > 0
      ? round1(mean(nightlyMetrics.map((m) => m.sleepOnsetLatencyMinutes)))
      : 0;
    const avgWaso = entries.length > 0
      ? round1(mean(nightlyMetrics.map((m) => m.wasoMinutes)))
      : 0;
    const avgAwakenings = entries.length > 0
      ? round2(mean(nightlyMetrics.map((m) => m.numberOfAwakenings)))
      : 0;
    const avgQuality = entries.length > 0
      ? round2(mean(entries.map((e) => e.qualityRating)))
      : 0;

    const sleepDebt = this.calculateSleepDebt(patientId);
    const circadianRhythm = this.analyzeCircadianRhythm(patientId);
    const consistencyScore = this.calculateConsistencyScore(patientId);
    const trendDirection = this.analyzeTrend(patientId);
    const dayOfWeekPatterns = this.analyzeDayOfWeekPatterns(patientId);
    const correlations = this.analyzeCorrelations(patientId);
    const hygieneScore = this.calculateSleepHygieneScore(patientId);
    const recommendations = this.generateRecommendations(patientId);
    const alerts = this.getAlerts(patientId);

    const summary = this.generateSummaryText(
      patientId,
      periodDays,
      avgDuration,
      avgEfficiency,
      avgLatency,
      avgWaso,
      avgAwakenings,
      avgQuality,
      sleepDebt,
      circadianRhythm,
      consistencyScore,
      trendDirection,
      hygieneScore,
      recommendations,
      alerts
    );

    return {
      patientId,
      generatedAt: now.toISOString(),
      periodStart: startStr,
      periodEnd: endStr,
      nightlyMetrics,
      averageMetrics: {
        sleepDurationHours: avgDuration,
        sleepEfficiency: avgEfficiency,
        sleepOnsetLatencyMinutes: avgLatency,
        wasoMinutes: avgWaso,
        awakeningsPerNight: avgAwakenings,
        qualityRating: avgQuality,
      },
      sleepDebt,
      circadianRhythm,
      consistencyScore,
      trendDirection,
      dayOfWeekPatterns,
      correlations,
      hygieneScore,
      recommendations,
      alerts,
      summary,
    };
  }

  /**
   * Generates a human-readable sleep report summary.
   */
  private generateSummaryText(
    patientId: string,
    periodDays: number,
    avgDuration: number,
    avgEfficiency: number,
    avgLatency: number,
    avgWaso: number,
    avgAwakenings: number,
    avgQuality: number,
    sleepDebt: SleepDebt,
    circadian: CircadianRhythm,
    consistency: ConsistencyScore,
    trend: TrendDirection,
    hygiene: SleepHygieneScore,
    recommendations: SleepRecommendation[],
    alerts: SleepAlert[]
  ): string {
    const lines: string[] = [];

    lines.push(`SLEEP ANALYSIS REPORT (${periodDays}-Day Period)`);
    lines.push('='.repeat(55));
    lines.push('');

    // Overview
    lines.push('OVERVIEW');
    lines.push('-'.repeat(35));
    lines.push(`Patient: ${patientId}`);
    lines.push(`Average sleep duration: ${avgDuration} hours/night`);
    lines.push(`Average sleep efficiency: ${avgEfficiency}%`);
    lines.push(`Average sleep onset latency: ${avgLatency} minutes`);
    lines.push(`Average WASO: ${avgWaso} minutes`);
    lines.push(`Average awakenings per night: ${avgAwakenings}`);
    lines.push(`Average quality rating: ${avgQuality}/5`);
    lines.push('');

    // Sleep Debt
    lines.push('SLEEP DEBT');
    lines.push('-'.repeat(35));
    if (sleepDebt.cumulativeDebtHours > 0) {
      lines.push(`Cumulative sleep debt: ${sleepDebt.cumulativeDebtHours} hours`);
      lines.push(`Average nightly deficit: ${sleepDebt.averageNightlyDeficitHours} hours`);
    } else {
      lines.push('No significant sleep debt accumulated.');
    }
    lines.push(`Debt trend: ${sleepDebt.debtTrend.toUpperCase()}`);
    lines.push('');

    // Circadian Rhythm
    lines.push('CIRCADIAN RHYTHM');
    lines.push('-'.repeat(35));
    lines.push(`Average bedtime: ${circadian.averageBedtime}`);
    lines.push(`Average wake time: ${circadian.averageWakeTime}`);
    lines.push(`Bedtime variability: +/- ${circadian.bedtimeStdDevMinutes} minutes`);
    lines.push(`Wake time variability: +/- ${circadian.wakeTimeStdDevMinutes} minutes`);
    lines.push('');

    // Consistency
    lines.push('SCHEDULE CONSISTENCY');
    lines.push('-'.repeat(35));
    lines.push(`Overall consistency score: ${consistency.overall}/100`);
    lines.push(`  Bedtime: ${consistency.bedtimeConsistency}/100`);
    lines.push(`  Wake time: ${consistency.wakeTimeConsistency}/100`);
    lines.push(`  Duration: ${consistency.durationConsistency}/100`);
    lines.push('');

    // Trend
    lines.push('TREND');
    lines.push('-'.repeat(35));
    const trendLabel = trend === TrendDirection.IMPROVING
      ? 'IMPROVING - Sleep quality is getting better over the tracking period.'
      : trend === TrendDirection.WORSENING
        ? 'WORSENING - Sleep quality is declining. Review recommendations.'
        : 'STABLE - Sleep patterns are consistent.';
    lines.push(trendLabel);
    lines.push('');

    // Hygiene Score
    lines.push('SLEEP HYGIENE SCORE');
    lines.push('-'.repeat(35));
    lines.push(`Overall: ${hygiene.overallScore}/100`);
    for (const detail of hygiene.details) {
      lines.push(`  ${detail}`);
    }
    lines.push('');

    // Active Alerts
    const activeAlerts = alerts.filter((a) => !a.acknowledged);
    if (activeAlerts.length > 0) {
      lines.push('ACTIVE ALERTS');
      lines.push('-'.repeat(35));
      for (const alert of activeAlerts.slice(0, 5)) {
        lines.push(`  [${alert.severity.toUpperCase()}] ${alert.message.slice(0, 120)}...`);
      }
      lines.push('');
    }

    // Top Recommendations
    if (recommendations.length > 0) {
      lines.push('TOP RECOMMENDATIONS');
      lines.push('-'.repeat(35));
      for (const rec of recommendations.slice(0, 5)) {
        lines.push(`  ${rec.priority}. ${rec.title}`);
        lines.push(`     ${rec.description.slice(0, 100)}...`);
      }
      lines.push('');
    }

    // Clinical Notes
    lines.push('CLINICAL NOTES');
    lines.push('-'.repeat(35));
    if (avgDuration < 6) {
      lines.push('  * Average sleep duration is below 6 hours. Consider aggressive sleep intervention.');
    }
    if (avgEfficiency < 75) {
      lines.push('  * Sleep efficiency below 75% suggests significant sleep disruption.');
    }
    if (avgLatency > 30) {
      lines.push('  * Prolonged sleep onset latency (>30 min) may indicate insomnia or anxiety.');
    }
    if (sleepDebt.cumulativeDebtHours > 20) {
      lines.push('  * Significant sleep debt has accumulated. Recovery sleep is needed.');
    }
    if (avgDuration >= 7 && avgEfficiency >= 85) {
      lines.push('  * Sleep patterns appear healthy. Continue current habits.');
    }

    lines.push('');
    lines.push('='.repeat(55));
    lines.push('End of Sleep Report');

    return lines.join('\n');
  }

  // --------------------------------------------------------------------------
  // Accessors for Testing and External Use
  // --------------------------------------------------------------------------

  /** Returns the total number of stored sleep entries. */
  getEntryCount(): number {
    return this.entries.length;
  }

  /** Returns all unique patient IDs that have recorded data. */
  getTrackedPatientIds(): string[] {
    return [...new Set(this.entries.map((e) => e.patientId))];
  }

  /** Returns the stored patient profile, if available. */
  getPatientProfile(patientId: string): SleepPatientProfile | undefined {
    return this.patientProfiles.get(patientId);
  }

  /** Returns all stored patient profiles. */
  getAllPatientProfiles(): SleepPatientProfile[] {
    return [...this.patientProfiles.values()];
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Singleton instance of the sleep tracking service. */
export const sleepTrackingService = new SleepTrackingServiceImpl();

/** Export class for testing. */
export { SleepTrackingServiceImpl };
