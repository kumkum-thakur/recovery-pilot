// analyticsService.ts — Comprehensive analytics for Recovery Pilot
// No external dependencies. Uses localStorage for caching.

// ─── Types & Interfaces ──────────────────────────────────────────────

export interface PatientRecord {
  patientId: string;
  name: string;
  surgeryType: SurgeryType;
  surgeryDate: string; // ISO date
  age: number;
  gender: 'M' | 'F' | 'Other';
}

export type SurgeryType =
  | 'knee_replacement'
  | 'hip_replacement'
  | 'acl_reconstruction'
  | 'rotator_cuff'
  | 'spinal_fusion'
  | 'appendectomy'
  | 'cardiac_bypass'
  | 'hernia_repair';

export interface DailySnapshot {
  patientId: string;
  date: string; // ISO date
  painLevel: number; // 0-10
  medicationsTaken: number;
  medicationsPrescribed: number;
  exerciseMinutes: number;
  exerciseTarget: number;
  missionsCompleted: number;
  missionsAssigned: number;
  stepsCount: number;
  sleepHours: number;
  moodScore: number; // 1-5
  woundStatus: 'good' | 'fair' | 'concerning';
  vitals: {
    heartRate: number;
    bloodPressure: { systolic: number; diastolic: number };
    temperature: number; // Fahrenheit
    oxygenSaturation: number; // %
  };
  engagementEvents: number; // app interactions
  readmissionRisk: number; // 0-1
}

export interface RecoveryProgressScore {
  overall: number; // 0-100
  painManagement: number;
  medicationAdherence: number;
  exerciseCompliance: number;
  missionCompletion: number;
  engagement: number;
  vitalStability: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  streakHistory: { start: string; end: string; length: number }[];
}

export interface PainTrend {
  dates: string[];
  values: number[];
  average: number;
  min: number;
  max: number;
  trend: 'decreasing' | 'stable' | 'increasing';
  weeklyAverages: { week: number; average: number }[];
}

export interface PopulationOverview {
  totalPatients: number;
  activePatients: number;
  avgRecoveryScore: number;
  riskDistribution: { low: number; medium: number; high: number; critical: number };
  surgeryBreakdown: Record<SurgeryType, number>;
  avgDaysSinceSurgery: number;
}

export interface RecoveryTimeStats {
  surgeryType: SurgeryType;
  avgDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  sampleSize: number;
  percentile25: number;
  percentile75: number;
}

export interface TreatmentEffectiveness {
  surgeryType: SurgeryType;
  avgPainReduction: number; // percentage
  avgMobilityImprovement: number; // percentage
  readmissionRate: number; // percentage
  patientSatisfaction: number; // 1-5
  complicationRate: number; // percentage
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface TrendLineResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predicted: TimeSeriesPoint[];
}

export interface ForecastResult {
  historical: TimeSeriesPoint[];
  forecast: TimeSeriesPoint[];
  confidence: { upper: TimeSeriesPoint[]; lower: TimeSeriesPoint[] };
}

export interface WeeklySummary {
  patientId: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  recoveryScore: RecoveryProgressScore;
  painTrend: PainTrend;
  medicationAdherence: number;
  exerciseCompliance: number;
  missionsCompleted: number;
  missionsTotal: number;
  streakStats: StreakStats;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
}

export interface MonthlyProgress {
  patientId: string;
  month: string;
  generatedAt: string;
  weeklyScores: number[];
  overallTrend: 'improving' | 'stable' | 'declining';
  painReduction: number;
  mobilityGain: number;
  medicationAdherenceAvg: number;
  exerciseComplianceAvg: number;
  milestonesReached: string[];
  areasForImprovement: string[];
  doctorNotes: string[];
}

export interface DischargeReadiness {
  patientId: string;
  generatedAt: string;
  readinessScore: number; // 0-100
  isReady: boolean;
  criteria: {
    name: string;
    met: boolean;
    score: number;
    details: string;
  }[];
  estimatedDischargeDate: string;
  remainingMilestones: string[];
}

export interface DoctorHandoff {
  patientId: string;
  generatedAt: string;
  patientSummary: string;
  currentStatus: RecoveryProgressScore;
  recentTrends: {
    pain: 'decreasing' | 'stable' | 'increasing';
    mobility: 'improving' | 'stable' | 'declining';
    adherence: 'improving' | 'stable' | 'declining';
  };
  criticalAlerts: string[];
  medicationSummary: string;
  exerciseSummary: string;
  recommendedActions: string[];
  riskFactors: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ─── Utility Helpers ─────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const squareDiffs = arr.map((v) => (v - avg) ** 2);
  return Math.sqrt(squareDiffs.reduce((s, v) => s + v, 0) / (arr.length - 1));
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// ─── Seeded Random for Reproducible Sample Data ──────────────────────

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  gaussian(mean: number, stddev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stddev;
  }
}

// ─── Sample Data Generator ───────────────────────────────────────────

const FIRST_NAMES = [
  'Alice', 'Bob', 'Carol', 'David', 'Elena', 'Frank', 'Grace', 'Henry',
  'Irene', 'James', 'Karen', 'Leo', 'Maria', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Rachel', 'Sam', 'Tina',
];

const LAST_NAMES = [
  'Anderson', 'Brown', 'Chen', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris',
  'Ibrahim', 'Johnson', 'Kim', 'Lee', 'Martinez', 'Nguyen', 'Olsen', 'Patel',
  'Quinn', 'Roberts', 'Smith', 'Thompson',
];

const SURGERY_TYPES: SurgeryType[] = [
  'knee_replacement', 'hip_replacement', 'acl_reconstruction', 'rotator_cuff',
  'spinal_fusion', 'appendectomy', 'cardiac_bypass', 'hernia_repair',
];

function generateSamplePatients(count: number, rng: SeededRandom): PatientRecord[] {
  const patients: PatientRecord[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 35); // surgeries started 35 days ago

  for (let i = 0; i < count; i++) {
    const surgeryOffset = rng.int(0, 10);
    const surgeryDate = new Date(baseDate);
    surgeryDate.setDate(surgeryDate.getDate() + surgeryOffset);

    patients.push({
      patientId: `PAT-${String(i + 1).padStart(3, '0')}`,
      name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
      surgeryType: rng.pick(SURGERY_TYPES),
      surgeryDate: isoDate(surgeryDate),
      age: rng.int(28, 78),
      gender: rng.pick(['M', 'F', 'Other'] as const),
    });
  }
  return patients;
}

function generateDailySnapshots(
  patients: PatientRecord[],
  days: number,
  rng: SeededRandom,
): DailySnapshot[] {
  const snapshots: DailySnapshot[] = [];

  for (const patient of patients) {
    const startDate = patient.surgeryDate;
    // Initial pain is high, decreases over time with noise
    const basePain = rng.float(6, 9);
    const recoveryRate = rng.float(0.05, 0.15);
    const adherenceBase = rng.float(0.7, 0.95);
    const exerciseBase = rng.float(0.5, 0.9);

    for (let d = 0; d < days; d++) {
      const date = addDays(startDate, d);
      const dayFactor = d / days; // 0 to ~1

      // Pain decreases over time with daily noise
      const painDecay = basePain * Math.exp(-recoveryRate * d);
      const painNoise = rng.gaussian(0, 0.8);
      const painLevel = clamp(Math.round((painDecay + painNoise) * 10) / 10, 0, 10);

      // Medication adherence generally improves then may decline
      const medAdherence = clamp(
        adherenceBase + dayFactor * 0.1 - (dayFactor > 0.8 ? 0.1 : 0) + rng.gaussian(0, 0.05),
        0, 1,
      );
      const medsPrescribed = rng.int(3, 6);
      const medsTaken = Math.round(medsPrescribed * medAdherence);

      // Exercise compliance increases over time
      const exerciseCompliance = clamp(
        exerciseBase + dayFactor * 0.3 + rng.gaussian(0, 0.1),
        0, 1,
      );
      const exerciseTarget = rng.int(20, 45);
      const exerciseMinutes = Math.round(exerciseTarget * exerciseCompliance);

      // Missions
      const missionsAssigned = rng.int(3, 7);
      const missionCompletionRate = clamp(0.5 + dayFactor * 0.3 + rng.gaussian(0, 0.1), 0, 1);
      const missionsCompleted = Math.min(
        missionsAssigned,
        Math.round(missionsAssigned * missionCompletionRate),
      );

      // Steps increase over recovery
      const stepsBase = 500 + d * rng.float(100, 300);
      const stepsCount = Math.max(0, Math.round(stepsBase + rng.gaussian(0, 500)));

      // Sleep normalizes
      const sleepHours = clamp(
        roundTo(6 + dayFactor * 1.5 + rng.gaussian(0, 0.8), 1),
        3, 10,
      );

      // Mood improves
      const moodScore = clamp(
        Math.round(2 + dayFactor * 2 + rng.gaussian(0, 0.5)),
        1, 5,
      );

      // Wound status
      const woundRoll = rng.next();
      const woundStatus: DailySnapshot['woundStatus'] =
        woundRoll < 0.05 ? 'concerning' : woundRoll < 0.2 ? 'fair' : 'good';

      // Vitals
      const heartRate = Math.round(clamp(72 + rng.gaussian(0, 8) - dayFactor * 5, 55, 110));
      const systolic = Math.round(clamp(125 + rng.gaussian(0, 10) - dayFactor * 5, 90, 160));
      const diastolic = Math.round(clamp(80 + rng.gaussian(0, 6), 60, 100));
      const temperature = roundTo(clamp(98.6 + rng.gaussian(0, 0.3) - (d < 3 ? 0.5 : 0), 97, 101), 1);
      const oxygenSaturation = Math.round(clamp(97 + rng.gaussian(0, 1), 92, 100));

      // Engagement
      const engagementEvents = Math.max(0, Math.round(5 + dayFactor * 10 + rng.gaussian(0, 3)));

      // Readmission risk decreases
      const readmissionRisk = clamp(
        roundTo(0.3 - dayFactor * 0.25 + (painLevel > 7 ? 0.1 : 0) + rng.gaussian(0, 0.03), 3),
        0, 1,
      );

      snapshots.push({
        patientId: patient.patientId,
        date,
        painLevel,
        medicationsTaken: medsTaken,
        medicationsPrescribed: medsPrescribed,
        exerciseMinutes,
        exerciseTarget,
        missionsCompleted,
        missionsAssigned,
        stepsCount,
        sleepHours,
        moodScore,
        woundStatus,
        vitals: {
          heartRate,
          bloodPressure: { systolic, diastolic },
          temperature,
          oxygenSaturation,
        },
        engagementEvents,
        readmissionRisk,
      });
    }
  }

  return snapshots;
}

// ─── Cache Layer ─────────────────────────────────────────────────────

const CACHE_PREFIX = 'rp_analytics_';

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T, ttlMs: number = 300000): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable – silently ignore
  }
}

function cacheClear(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ─── Data Aggregation Pipeline ───────────────────────────────────────

export interface AggregationPipeline {
  patients: PatientRecord[];
  snapshots: DailySnapshot[];
  getSnapshotsForPatient(patientId: string): DailySnapshot[];
  getSnapshotsForDateRange(patientId: string, start: string, end: string): DailySnapshot[];
  getLatestSnapshot(patientId: string): DailySnapshot | null;
  refreshData(): void;
}

function createAggregationPipeline(): AggregationPipeline {
  const rng = new SeededRandom(42);
  let patients = generateSamplePatients(20, rng);
  let snapshots = generateDailySnapshots(patients, 30, rng);

  // Index by patientId for fast lookup
  let snapshotIndex: Map<string, DailySnapshot[]> = new Map();

  function buildIndex(): void {
    snapshotIndex = new Map();
    for (const s of snapshots) {
      const list = snapshotIndex.get(s.patientId) || [];
      list.push(s);
      snapshotIndex.set(s.patientId, list);
    }
    // Sort each patient's snapshots by date
    for (const [, list] of snapshotIndex) {
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  buildIndex();

  return {
    get patients() { return patients; },
    get snapshots() { return snapshots; },

    getSnapshotsForPatient(patientId: string): DailySnapshot[] {
      return snapshotIndex.get(patientId) || [];
    },

    getSnapshotsForDateRange(patientId: string, start: string, end: string): DailySnapshot[] {
      return (snapshotIndex.get(patientId) || []).filter(
        (s) => s.date >= start && s.date <= end,
      );
    },

    getLatestSnapshot(patientId: string): DailySnapshot | null {
      const list = snapshotIndex.get(patientId);
      if (!list || list.length === 0) return null;
      return list[list.length - 1];
    },

    refreshData(): void {
      const freshRng = new SeededRandom(Date.now());
      patients = generateSamplePatients(20, freshRng);
      snapshots = generateDailySnapshots(patients, 30, freshRng);
      buildIndex();
      cacheClear();
    },
  };
}

// ─── Patient Analytics ───────────────────────────────────────────────

function computeRecoveryProgressScore(
  snapshots: DailySnapshot[],
): RecoveryProgressScore {
  if (snapshots.length === 0) {
    return {
      overall: 0, painManagement: 0, medicationAdherence: 0,
      exerciseCompliance: 0, missionCompletion: 0, engagement: 0,
      vitalStability: 0, trend: 'stable',
    };
  }

  const recent = snapshots.slice(-7);
  const earlier = snapshots.slice(0, Math.max(1, snapshots.length - 7));

  // Pain management: lower pain = higher score, also account for trend
  const avgPainRecent = mean(recent.map((s) => s.painLevel));
  const painManagement = clamp(Math.round((1 - avgPainRecent / 10) * 100), 0, 100);

  // Medication adherence
  const medAdherence = recent.map(
    (s) => (s.medicationsPrescribed > 0 ? s.medicationsTaken / s.medicationsPrescribed : 1),
  );
  const medicationAdherence = clamp(Math.round(mean(medAdherence) * 100), 0, 100);

  // Exercise compliance
  const exCompliance = recent.map(
    (s) => (s.exerciseTarget > 0 ? s.exerciseMinutes / s.exerciseTarget : 1),
  );
  const exerciseCompliance = clamp(Math.round(mean(exCompliance) * 100), 0, 100);

  // Mission completion
  const missionRates = recent.map(
    (s) => (s.missionsAssigned > 0 ? s.missionsCompleted / s.missionsAssigned : 1),
  );
  const missionCompletion = clamp(Math.round(mean(missionRates) * 100), 0, 100);

  // Engagement (normalize to 0-100 assuming max 20 events/day is ideal)
  const engagement = clamp(
    Math.round(mean(recent.map((s) => Math.min(s.engagementEvents / 20, 1))) * 100),
    0, 100,
  );

  // Vital stability (penalize abnormal readings)
  const vitalScores = recent.map((s) => {
    let score = 100;
    if (s.vitals.heartRate < 60 || s.vitals.heartRate > 100) score -= 15;
    if (s.vitals.bloodPressure.systolic > 140 || s.vitals.bloodPressure.systolic < 100) score -= 15;
    if (s.vitals.temperature > 99.5) score -= 20;
    if (s.vitals.oxygenSaturation < 95) score -= 25;
    return Math.max(0, score);
  });
  const vitalStability = Math.round(mean(vitalScores));

  // Overall weighted score
  const overall = Math.round(
    painManagement * 0.2 +
    medicationAdherence * 0.2 +
    exerciseCompliance * 0.15 +
    missionCompletion * 0.15 +
    engagement * 0.1 +
    vitalStability * 0.2,
  );

  // Trend detection
  const recentAvgScore = mean(recent.map((s) => {
    const medRate = s.medicationsPrescribed > 0 ? s.medicationsTaken / s.medicationsPrescribed : 1;
    const exRate = s.exerciseTarget > 0 ? s.exerciseMinutes / s.exerciseTarget : 1;
    return ((1 - s.painLevel / 10) + medRate + exRate) / 3;
  }));
  const earlierAvgScore = mean(earlier.map((s) => {
    const medRate = s.medicationsPrescribed > 0 ? s.medicationsTaken / s.medicationsPrescribed : 1;
    const exRate = s.exerciseTarget > 0 ? s.exerciseMinutes / s.exerciseTarget : 1;
    return ((1 - s.painLevel / 10) + medRate + exRate) / 3;
  }));

  const diff = recentAvgScore - earlierAvgScore;
  const trend: RecoveryProgressScore['trend'] =
    diff > 0.05 ? 'improving' : diff < -0.05 ? 'declining' : 'stable';

  return {
    overall: clamp(overall, 0, 100),
    painManagement,
    medicationAdherence,
    exerciseCompliance,
    missionCompletion,
    engagement,
    vitalStability,
    trend,
  };
}

function computeMissionCompletionRates(
  snapshots: DailySnapshot[],
): { daily: { date: string; rate: number }[]; overall: number } {
  const daily = snapshots.map((s) => ({
    date: s.date,
    rate: s.missionsAssigned > 0
      ? roundTo(s.missionsCompleted / s.missionsAssigned, 3)
      : 1,
  }));
  const overall = roundTo(mean(daily.map((d) => d.rate)), 3);
  return { daily, overall };
}

function computeStreakStats(snapshots: DailySnapshot[]): StreakStats {
  if (snapshots.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, streakHistory: [] };
  }

  // A day is "active" if at least one mission was completed or exercise was done
  const activeDays = snapshots.filter(
    (s) => s.missionsCompleted > 0 || s.exerciseMinutes > 0,
  );

  const sortedDates = activeDays.map((s) => s.date).sort();
  const streaks: { start: string; end: string; length: number }[] = [];
  let streakStart = sortedDates[0];
  let streakEnd = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const dayDiff = daysBetween(sortedDates[i - 1], sortedDates[i]);
    if (dayDiff <= 1) {
      streakEnd = sortedDates[i];
    } else {
      streaks.push({
        start: streakStart,
        end: streakEnd,
        length: daysBetween(streakStart, streakEnd) + 1,
      });
      streakStart = sortedDates[i];
      streakEnd = sortedDates[i];
    }
  }
  streaks.push({
    start: streakStart,
    end: streakEnd,
    length: daysBetween(streakStart, streakEnd) + 1,
  });

  const longestStreak = Math.max(...streaks.map((s) => s.length));
  const currentStreak = streaks[streaks.length - 1].length;

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: activeDays.length,
    streakHistory: streaks,
  };
}

function computeMedicationAdherence(
  snapshots: DailySnapshot[],
): { daily: { date: string; adherence: number }[]; overall: number; trend: string } {
  const daily = snapshots.map((s) => ({
    date: s.date,
    adherence: s.medicationsPrescribed > 0
      ? roundTo(s.medicationsTaken / s.medicationsPrescribed, 3)
      : 1,
  }));
  const overall = roundTo(mean(daily.map((d) => d.adherence)), 3);

  const firstHalf = daily.slice(0, Math.floor(daily.length / 2));
  const secondHalf = daily.slice(Math.floor(daily.length / 2));
  const diff = mean(secondHalf.map((d) => d.adherence)) - mean(firstHalf.map((d) => d.adherence));
  const trend = diff > 0.03 ? 'improving' : diff < -0.03 ? 'declining' : 'stable';

  return { daily, overall, trend };
}

function computePainTrend(snapshots: DailySnapshot[]): PainTrend {
  const values = snapshots.map((s) => s.painLevel);
  const dates = snapshots.map((s) => s.date);

  const avg = roundTo(mean(values), 2);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // Weekly averages
  const weeklyAverages: { week: number; average: number }[] = [];
  for (let w = 0; w < Math.ceil(values.length / 7); w++) {
    const weekSlice = values.slice(w * 7, (w + 1) * 7);
    weeklyAverages.push({ week: w + 1, average: roundTo(mean(weekSlice), 2) });
  }

  // Trend from linear regression slope
  const trendLine = computeTrendLine(snapshots.map((s, i) => ({ date: s.date, value: s.painLevel })));
  const trend: PainTrend['trend'] =
    trendLine.slope < -0.05 ? 'decreasing' : trendLine.slope > 0.05 ? 'increasing' : 'stable';

  return { dates, values, average: avg, min: minVal, max: maxVal, trend, weeklyAverages };
}

function computeExerciseCompliance(
  snapshots: DailySnapshot[],
): { daily: { date: string; compliance: number }[]; overall: number; totalMinutes: number } {
  const daily = snapshots.map((s) => ({
    date: s.date,
    compliance: s.exerciseTarget > 0
      ? roundTo(Math.min(s.exerciseMinutes / s.exerciseTarget, 1), 3)
      : 1,
  }));
  const overall = roundTo(mean(daily.map((d) => d.compliance)), 3);
  const totalMinutes = snapshots.reduce((s, v) => s + v.exerciseMinutes, 0);
  return { daily, overall, totalMinutes };
}

function computeEngagementScore(
  snapshots: DailySnapshot[],
): { daily: { date: string; score: number }[]; overall: number; trend: string } {
  const daily = snapshots.map((s) => ({
    date: s.date,
    score: clamp(Math.round((s.engagementEvents / 20) * 100), 0, 100),
  }));
  const overall = Math.round(mean(daily.map((d) => d.score)));

  const firstHalf = daily.slice(0, Math.floor(daily.length / 2));
  const secondHalf = daily.slice(Math.floor(daily.length / 2));
  const diff = mean(secondHalf.map((d) => d.score)) - mean(firstHalf.map((d) => d.score));
  const trend = diff > 3 ? 'increasing' : diff < -3 ? 'decreasing' : 'stable';

  return { daily, overall, trend };
}

// ─── Population Analytics ────────────────────────────────────────────

function computePopulationOverview(
  pipeline: AggregationPipeline,
): PopulationOverview {
  const cacheKey = 'pop_overview';
  const cached = cacheGet<PopulationOverview>(cacheKey);
  if (cached) return cached;

  const patients = pipeline.patients;
  const today = isoDate(new Date());

  const surgeryBreakdown = {} as Record<SurgeryType, number>;
  for (const st of SURGERY_TYPES) surgeryBreakdown[st] = 0;

  let totalDaysSinceSurgery = 0;
  const recoveryScores: number[] = [];
  const riskLevels = { low: 0, medium: 0, high: 0, critical: 0 };

  for (const patient of patients) {
    surgeryBreakdown[patient.surgeryType]++;
    totalDaysSinceSurgery += daysBetween(patient.surgeryDate, today);

    const snaps = pipeline.getSnapshotsForPatient(patient.patientId);
    const score = computeRecoveryProgressScore(snaps);
    recoveryScores.push(score.overall);

    const latest = pipeline.getLatestSnapshot(patient.patientId);
    if (latest) {
      const risk = latest.readmissionRisk;
      if (risk < 0.1) riskLevels.low++;
      else if (risk < 0.25) riskLevels.medium++;
      else if (risk < 0.5) riskLevels.high++;
      else riskLevels.critical++;
    }
  }

  const result: PopulationOverview = {
    totalPatients: patients.length,
    activePatients: patients.length, // all sample patients are active
    avgRecoveryScore: Math.round(mean(recoveryScores)),
    riskDistribution: riskLevels,
    surgeryBreakdown,
    avgDaysSinceSurgery: Math.round(totalDaysSinceSurgery / patients.length),
  };

  cacheSet(cacheKey, result, 600000);
  return result;
}

function computeAverageRecoveryTimes(
  pipeline: AggregationPipeline,
): RecoveryTimeStats[] {
  const cacheKey = 'recovery_times';
  const cached = cacheGet<RecoveryTimeStats[]>(cacheKey);
  if (cached) return cached;

  // Simulate recovery completion days per surgery type based on snapshot data
  const rng = new SeededRandom(123);
  const baseDays: Record<SurgeryType, { mean: number; std: number }> = {
    knee_replacement: { mean: 90, std: 15 },
    hip_replacement: { mean: 85, std: 12 },
    acl_reconstruction: { mean: 120, std: 20 },
    rotator_cuff: { mean: 60, std: 10 },
    spinal_fusion: { mean: 100, std: 18 },
    appendectomy: { mean: 21, std: 5 },
    cardiac_bypass: { mean: 75, std: 14 },
    hernia_repair: { mean: 28, std: 7 },
  };

  const stats: RecoveryTimeStats[] = [];

  for (const st of SURGERY_TYPES) {
    const patientsOfType = pipeline.patients.filter((p) => p.surgeryType === st);
    const sampleCount = Math.max(patientsOfType.length, 10); // pad with synthetic data
    const days: number[] = [];
    for (let i = 0; i < sampleCount; i++) {
      days.push(Math.max(7, Math.round(rng.gaussian(baseDays[st].mean, baseDays[st].std))));
    }

    stats.push({
      surgeryType: st,
      avgDays: Math.round(mean(days)),
      medianDays: Math.round(median(days)),
      minDays: Math.min(...days),
      maxDays: Math.max(...days),
      sampleSize: sampleCount,
      percentile25: Math.round(percentile(days, 25)),
      percentile75: Math.round(percentile(days, 75)),
    });
  }

  cacheSet(cacheKey, stats, 3600000);
  return stats;
}

function computeReadmissionRiskDistribution(
  pipeline: AggregationPipeline,
): { buckets: { range: string; count: number }[]; avgRisk: number; highRiskPatients: string[] } {
  const buckets = [
    { range: '0-10%', count: 0 },
    { range: '10-20%', count: 0 },
    { range: '20-30%', count: 0 },
    { range: '30-40%', count: 0 },
    { range: '40-50%', count: 0 },
    { range: '50%+', count: 0 },
  ];

  const risks: number[] = [];
  const highRiskPatients: string[] = [];

  for (const patient of pipeline.patients) {
    const latest = pipeline.getLatestSnapshot(patient.patientId);
    if (!latest) continue;
    const risk = latest.readmissionRisk;
    risks.push(risk);

    if (risk < 0.1) buckets[0].count++;
    else if (risk < 0.2) buckets[1].count++;
    else if (risk < 0.3) buckets[2].count++;
    else if (risk < 0.4) buckets[3].count++;
    else if (risk < 0.5) buckets[4].count++;
    else buckets[5].count++;

    if (risk >= 0.3) highRiskPatients.push(patient.patientId);
  }

  return {
    buckets,
    avgRisk: roundTo(mean(risks), 3),
    highRiskPatients,
  };
}

function computeTreatmentEffectiveness(
  pipeline: AggregationPipeline,
): TreatmentEffectiveness[] {
  const cacheKey = 'treatment_effectiveness';
  const cached = cacheGet<TreatmentEffectiveness[]>(cacheKey);
  if (cached) return cached;

  const rng = new SeededRandom(456);
  const results: TreatmentEffectiveness[] = [];

  for (const st of SURGERY_TYPES) {
    const patientsOfType = pipeline.patients.filter((p) => p.surgeryType === st);

    let totalPainReduction = 0;
    let totalMobilityImprovement = 0;

    for (const patient of patientsOfType) {
      const snaps = pipeline.getSnapshotsForPatient(patient.patientId);
      if (snaps.length >= 7) {
        const firstWeekPain = mean(snaps.slice(0, 7).map((s) => s.painLevel));
        const lastWeekPain = mean(snaps.slice(-7).map((s) => s.painLevel));
        totalPainReduction += firstWeekPain > 0 ? ((firstWeekPain - lastWeekPain) / firstWeekPain) * 100 : 0;

        const firstWeekSteps = mean(snaps.slice(0, 7).map((s) => s.stepsCount));
        const lastWeekSteps = mean(snaps.slice(-7).map((s) => s.stepsCount));
        totalMobilityImprovement += firstWeekSteps > 0
          ? ((lastWeekSteps - firstWeekSteps) / firstWeekSteps) * 100
          : 0;
      }
    }

    const count = Math.max(patientsOfType.length, 1);

    results.push({
      surgeryType: st,
      avgPainReduction: roundTo(totalPainReduction / count, 1),
      avgMobilityImprovement: roundTo(totalMobilityImprovement / count, 1),
      readmissionRate: roundTo(rng.float(2, 12), 1),
      patientSatisfaction: roundTo(rng.float(3.5, 4.8), 1),
      complicationRate: roundTo(rng.float(1, 8), 1),
    });
  }

  cacheSet(cacheKey, results, 3600000);
  return results;
}

// ─── Time-Series Analytics ───────────────────────────────────────────

function computeMovingAverage(data: TimeSeriesPoint[], window: number): TimeSeriesPoint[] {
  if (data.length < window) return data.map((d) => ({ ...d }));
  const result: TimeSeriesPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      // Not enough data yet, use partial window
      const slice = data.slice(0, i + 1);
      result.push({
        date: data[i].date,
        value: roundTo(mean(slice.map((s) => s.value)), 2),
      });
    } else {
      const slice = data.slice(i - window + 1, i + 1);
      result.push({
        date: data[i].date,
        value: roundTo(mean(slice.map((s) => s.value)), 2),
      });
    }
  }

  return result;
}

function computeExponentialMovingAverage(
  data: TimeSeriesPoint[],
  alpha: number = 0.3,
): TimeSeriesPoint[] {
  if (data.length === 0) return [];
  const result: TimeSeriesPoint[] = [{ date: data[0].date, value: data[0].value }];

  for (let i = 1; i < data.length; i++) {
    const ema = alpha * data[i].value + (1 - alpha) * result[i - 1].value;
    result.push({ date: data[i].date, value: roundTo(ema, 2) });
  }

  return result;
}

function computeTrendLine(data: TimeSeriesPoint[]): TrendLineResult {
  const n = data.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: data.length > 0 ? data[0].value : 0,
      rSquared: 0,
      predicted: data.map((d) => ({ ...d })),
    };
  }

  // x values: 0, 1, 2, ...
  const xValues = data.map((_, i) => i);
  const yValues = data.map((d) => d.value);

  const xMean = mean(xValues);
  const yMean = mean(yValues);

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // R-squared
  const predicted = xValues.map((x) => slope * x + intercept);
  const ssRes = yValues.reduce((s, y, i) => s + (y - predicted[i]) ** 2, 0);
  const ssTot = yValues.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const rSquared = ssTot !== 0 ? roundTo(1 - ssRes / ssTot, 4) : 0;

  return {
    slope: roundTo(slope, 4),
    intercept: roundTo(intercept, 4),
    rSquared,
    predicted: data.map((d, i) => ({
      date: d.date,
      value: roundTo(slope * i + intercept, 2),
    })),
  };
}

function computeForecast(data: TimeSeriesPoint[], daysAhead: number = 7): ForecastResult {
  const trend = computeTrendLine(data);
  const residuals = data.map((d, i) => d.value - (trend.slope * i + trend.intercept));
  const residualStd = standardDeviation(residuals);

  const forecast: TimeSeriesPoint[] = [];
  const upper: TimeSeriesPoint[] = [];
  const lower: TimeSeriesPoint[] = [];

  const lastDate = data.length > 0 ? data[data.length - 1].date : isoDate(new Date());
  const n = data.length;

  for (let d = 1; d <= daysAhead; d++) {
    const x = n - 1 + d;
    const predictedValue = trend.slope * x + trend.intercept;
    const confidence = residualStd * 1.96 * Math.sqrt(1 + 1 / n + ((x - mean(data.map((_, i) => i))) ** 2) /
      (data.map((_, i) => i).reduce((s, xi) => s + (xi - mean(data.map((_, j) => j))) ** 2, 0) || 1));

    const date = addDays(lastDate, d);
    forecast.push({ date, value: roundTo(predictedValue, 2) });
    upper.push({ date, value: roundTo(predictedValue + confidence, 2) });
    lower.push({ date, value: roundTo(predictedValue - confidence, 2) });
  }

  return {
    historical: data.map((d) => ({ ...d })),
    forecast,
    confidence: { upper, lower },
  };
}

// ─── Report Generation ───────────────────────────────────────────────

function generateWeeklySummary(
  pipeline: AggregationPipeline,
  patientId: string,
  weekEndDate?: string,
): WeeklySummary {
  const end = weekEndDate || isoDate(new Date());
  const start = addDays(end, -6);
  const snaps = pipeline.getSnapshotsForDateRange(patientId, start, end);
  const allSnaps = pipeline.getSnapshotsForPatient(patientId);

  const recoveryScore = computeRecoveryProgressScore(allSnaps);
  const painTrend = computePainTrend(snaps);
  const medAdherence = computeMedicationAdherence(snaps);
  const exCompliance = computeExerciseCompliance(snaps);
  const streakStats = computeStreakStats(allSnaps);

  const missionsCompleted = snaps.reduce((s, v) => s + v.missionsCompleted, 0);
  const missionsTotal = snaps.reduce((s, v) => s + v.missionsAssigned, 0);

  // Generate highlights
  const highlights: string[] = [];
  if (recoveryScore.overall >= 80) highlights.push('Excellent overall recovery score');
  if (medAdherence.overall >= 0.9) highlights.push('Outstanding medication adherence');
  if (streakStats.currentStreak >= 7) highlights.push(`Active streak of ${streakStats.currentStreak} days`);
  if (painTrend.trend === 'decreasing') highlights.push('Pain levels are trending downward');
  if (exCompliance.overall >= 0.85) highlights.push('Great exercise compliance');
  if (highlights.length === 0) highlights.push('Steady progress this week');

  // Generate concerns
  const concerns: string[] = [];
  if (recoveryScore.overall < 50) concerns.push('Recovery score is below target');
  if (medAdherence.overall < 0.7) concerns.push('Medication adherence needs improvement');
  if (painTrend.trend === 'increasing') concerns.push('Pain levels are trending upward');
  if (exCompliance.overall < 0.5) concerns.push('Exercise targets are not being met');
  const woundConcerns = snaps.filter((s) => s.woundStatus === 'concerning').length;
  if (woundConcerns > 0) concerns.push(`${woundConcerns} day(s) with concerning wound status`);

  // Recommendations
  const recommendations: string[] = [];
  if (medAdherence.overall < 0.85) recommendations.push('Set medication reminders at consistent times');
  if (exCompliance.overall < 0.7) recommendations.push('Start with shorter exercise sessions and gradually increase');
  if (painTrend.trend !== 'decreasing') recommendations.push('Discuss pain management options with your care team');
  if (mean(snaps.map((s) => s.sleepHours)) < 7) recommendations.push('Aim for 7-8 hours of sleep nightly for optimal recovery');
  recommendations.push('Continue logging daily vitals and symptoms');

  return {
    patientId,
    weekStart: start,
    weekEnd: end,
    generatedAt: new Date().toISOString(),
    recoveryScore,
    painTrend,
    medicationAdherence: medAdherence.overall,
    exerciseCompliance: exCompliance.overall,
    missionsCompleted,
    missionsTotal,
    streakStats,
    highlights,
    concerns,
    recommendations,
  };
}

function generateMonthlyProgress(
  pipeline: AggregationPipeline,
  patientId: string,
  month?: string,
): MonthlyProgress {
  const allSnaps = pipeline.getSnapshotsForPatient(patientId);
  const targetMonth = month || isoDate(new Date()).substring(0, 7);

  const monthSnaps = allSnaps.filter((s) => s.date.startsWith(targetMonth));
  if (monthSnaps.length === 0 && allSnaps.length > 0) {
    // Use all available data if month filter returns empty
    monthSnaps.push(...allSnaps);
  }

  // Weekly scores
  const weeklyScores: number[] = [];
  for (let w = 0; w < Math.ceil(monthSnaps.length / 7); w++) {
    const weekSlice = monthSnaps.slice(w * 7, (w + 1) * 7);
    const score = computeRecoveryProgressScore(weekSlice);
    weeklyScores.push(score.overall);
  }

  // Determine overall trend
  let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (weeklyScores.length >= 2) {
    const firstHalf = mean(weeklyScores.slice(0, Math.ceil(weeklyScores.length / 2)));
    const secondHalf = mean(weeklyScores.slice(Math.ceil(weeklyScores.length / 2)));
    if (secondHalf - firstHalf > 3) overallTrend = 'improving';
    else if (firstHalf - secondHalf > 3) overallTrend = 'declining';
  }

  // Pain reduction
  const firstWeekPain = mean(monthSnaps.slice(0, 7).map((s) => s.painLevel));
  const lastWeekPain = mean(monthSnaps.slice(-7).map((s) => s.painLevel));
  const painReduction = firstWeekPain > 0
    ? roundTo(((firstWeekPain - lastWeekPain) / firstWeekPain) * 100, 1)
    : 0;

  // Mobility gain (steps)
  const firstWeekSteps = mean(monthSnaps.slice(0, 7).map((s) => s.stepsCount));
  const lastWeekSteps = mean(monthSnaps.slice(-7).map((s) => s.stepsCount));
  const mobilityGain = firstWeekSteps > 0
    ? roundTo(((lastWeekSteps - firstWeekSteps) / firstWeekSteps) * 100, 1)
    : 0;

  const medAdh = computeMedicationAdherence(monthSnaps);
  const exComp = computeExerciseCompliance(monthSnaps);

  // Milestones
  const milestones: string[] = [];
  if (lastWeekPain < 3) milestones.push('Pain level below 3/10');
  if (medAdh.overall >= 0.95) milestones.push('95%+ medication adherence');
  if (exComp.overall >= 0.9) milestones.push('90%+ exercise compliance');
  if (lastWeekSteps > 5000) milestones.push('Consistently walking 5000+ steps');
  if (mean(monthSnaps.slice(-7).map((s) => s.moodScore)) >= 4) milestones.push('Positive mood trend');

  // Areas for improvement
  const areas: string[] = [];
  if (medAdh.overall < 0.8) areas.push('Medication adherence');
  if (exComp.overall < 0.7) areas.push('Exercise compliance');
  if (painReduction < 20) areas.push('Pain management');
  if (mean(monthSnaps.map((s) => s.sleepHours)) < 7) areas.push('Sleep quality');

  return {
    patientId,
    month: targetMonth,
    generatedAt: new Date().toISOString(),
    weeklyScores,
    overallTrend,
    painReduction,
    mobilityGain,
    medicationAdherenceAvg: medAdh.overall,
    exerciseComplianceAvg: exComp.overall,
    milestonesReached: milestones,
    areasForImprovement: areas,
    doctorNotes: [
      'Patient showing expected recovery trajectory',
      'Continue current treatment plan',
      'Schedule follow-up in 2 weeks',
    ],
  };
}

function generateDischargeReadiness(
  pipeline: AggregationPipeline,
  patientId: string,
): DischargeReadiness {
  const allSnaps = pipeline.getSnapshotsForPatient(patientId);
  const recent = allSnaps.slice(-7);
  const patient = pipeline.patients.find((p) => p.patientId === patientId);

  const criteria: DischargeReadiness['criteria'] = [];

  // Pain management
  const avgPain = mean(recent.map((s) => s.painLevel));
  const painScore = clamp(Math.round((1 - avgPain / 10) * 100), 0, 100);
  criteria.push({
    name: 'Pain Management',
    met: avgPain <= 4,
    score: painScore,
    details: `Average pain level: ${roundTo(avgPain, 1)}/10 (target: <=4)`,
  });

  // Medication self-management
  const medAdh = computeMedicationAdherence(recent);
  criteria.push({
    name: 'Medication Self-Management',
    met: medAdh.overall >= 0.9,
    score: Math.round(medAdh.overall * 100),
    details: `Adherence: ${Math.round(medAdh.overall * 100)}% (target: >=90%)`,
  });

  // Mobility
  const avgSteps = mean(recent.map((s) => s.stepsCount));
  const mobilityScore = clamp(Math.round((avgSteps / 5000) * 100), 0, 100);
  criteria.push({
    name: 'Mobility',
    met: avgSteps >= 3000,
    score: mobilityScore,
    details: `Average daily steps: ${Math.round(avgSteps)} (target: >=3000)`,
  });

  // Vital stability
  const vitalIssues = recent.filter(
    (s) => s.vitals.temperature > 99.5 || s.vitals.oxygenSaturation < 95 ||
      s.vitals.heartRate > 100 || s.vitals.bloodPressure.systolic > 140,
  ).length;
  const vitalScore = Math.round(((recent.length - vitalIssues) / Math.max(recent.length, 1)) * 100);
  criteria.push({
    name: 'Vital Sign Stability',
    met: vitalIssues === 0,
    score: vitalScore,
    details: `${vitalIssues} day(s) with abnormal vitals in last week`,
  });

  // Wound healing
  const woundGood = recent.filter((s) => s.woundStatus === 'good').length;
  const woundScore = Math.round((woundGood / Math.max(recent.length, 1)) * 100);
  criteria.push({
    name: 'Wound Healing',
    met: woundGood >= recent.length - 1,
    score: woundScore,
    details: `${woundGood}/${recent.length} days with good wound status`,
  });

  // Exercise compliance
  const exComp = computeExerciseCompliance(recent);
  criteria.push({
    name: 'Exercise Independence',
    met: exComp.overall >= 0.8,
    score: Math.round(exComp.overall * 100),
    details: `Exercise compliance: ${Math.round(exComp.overall * 100)}% (target: >=80%)`,
  });

  // Readmission risk
  const latestSnap = allSnaps[allSnaps.length - 1];
  const riskScore = latestSnap
    ? clamp(Math.round((1 - latestSnap.readmissionRisk) * 100), 0, 100)
    : 50;
  criteria.push({
    name: 'Low Readmission Risk',
    met: latestSnap ? latestSnap.readmissionRisk < 0.15 : false,
    score: riskScore,
    details: `Current risk: ${latestSnap ? roundTo(latestSnap.readmissionRisk * 100, 1) : 'N/A'}%`,
  });

  const readinessScore = Math.round(mean(criteria.map((c) => c.score)));
  const allMet = criteria.every((c) => c.met);

  // Remaining milestones
  const remainingMilestones: string[] = [];
  for (const c of criteria) {
    if (!c.met) remainingMilestones.push(`Achieve: ${c.name} - ${c.details}`);
  }

  // Estimate discharge date
  const metCount = criteria.filter((c) => c.met).length;
  const daysPerCriterion = 3;
  const remainingDays = (criteria.length - metCount) * daysPerCriterion;
  const estimatedDischargeDate = addDays(isoDate(new Date()), allMet ? 0 : remainingDays);

  return {
    patientId,
    generatedAt: new Date().toISOString(),
    readinessScore,
    isReady: allMet && readinessScore >= 80,
    criteria,
    estimatedDischargeDate,
    remainingMilestones,
  };
}

function generateDoctorHandoff(
  pipeline: AggregationPipeline,
  patientId: string,
): DoctorHandoff {
  const patient = pipeline.patients.find((p) => p.patientId === patientId);
  const allSnaps = pipeline.getSnapshotsForPatient(patientId);
  const recent = allSnaps.slice(-7);

  const currentStatus = computeRecoveryProgressScore(allSnaps);
  const painTrend = computePainTrend(allSnaps);
  const medAdh = computeMedicationAdherence(allSnaps);
  const exComp = computeExerciseCompliance(allSnaps);

  // Mobility trend from steps
  const firstWeekSteps = mean(allSnaps.slice(0, 7).map((s) => s.stepsCount));
  const lastWeekSteps = mean(allSnaps.slice(-7).map((s) => s.stepsCount));
  const mobilityTrend: 'improving' | 'stable' | 'declining' =
    lastWeekSteps > firstWeekSteps * 1.1 ? 'improving' :
    lastWeekSteps < firstWeekSteps * 0.9 ? 'declining' : 'stable';

  const adherenceTrend: 'improving' | 'stable' | 'declining' =
    medAdh.trend === 'improving' ? 'improving' :
    medAdh.trend === 'declining' ? 'declining' : 'stable';

  // Critical alerts
  const criticalAlerts: string[] = [];
  const latest = allSnaps[allSnaps.length - 1];
  if (latest) {
    if (latest.readmissionRisk > 0.3) criticalAlerts.push(`High readmission risk: ${roundTo(latest.readmissionRisk * 100, 1)}%`);
    if (latest.vitals.temperature > 100) criticalAlerts.push(`Elevated temperature: ${latest.vitals.temperature}F`);
    if (latest.vitals.oxygenSaturation < 94) criticalAlerts.push(`Low O2 saturation: ${latest.vitals.oxygenSaturation}%`);
    if (latest.painLevel >= 8) criticalAlerts.push(`Severe pain reported: ${latest.painLevel}/10`);
    if (latest.woundStatus === 'concerning') criticalAlerts.push('Wound status flagged as concerning');
  }

  // Risk factors
  const riskFactors: string[] = [];
  if (patient && patient.age > 65) riskFactors.push('Age > 65');
  if (medAdh.overall < 0.7) riskFactors.push('Low medication adherence');
  if (painTrend.trend === 'increasing') riskFactors.push('Increasing pain trend');
  if (exComp.overall < 0.5) riskFactors.push('Poor exercise compliance');
  if (mean(recent.map((s) => s.sleepHours)) < 6) riskFactors.push('Insufficient sleep');

  // Recommended actions
  const recommendedActions: string[] = [];
  if (criticalAlerts.length > 0) recommendedActions.push('Review critical alerts and assess urgency');
  if (painTrend.trend !== 'decreasing') recommendedActions.push('Reassess pain management protocol');
  if (medAdh.overall < 0.8) recommendedActions.push('Discuss medication adherence barriers with patient');
  if (exComp.overall < 0.7) recommendedActions.push('Modify exercise plan to improve compliance');
  recommendedActions.push('Review latest vitals and wound assessment');
  recommendedActions.push('Update care plan based on current progress');

  const patientName = patient ? patient.name : patientId;
  const surgeryInfo = patient ? `${patient.surgeryType.replace(/_/g, ' ')}` : 'unknown surgery';
  const daysSinceSurgery = patient ? daysBetween(patient.surgeryDate, isoDate(new Date())) : 0;

  return {
    patientId,
    generatedAt: new Date().toISOString(),
    patientSummary: `${patientName}, ${patient?.age || 'N/A'} y/o ${patient?.gender || 'N/A'}, ` +
      `post-${surgeryInfo} day ${daysSinceSurgery}. ` +
      `Current recovery score: ${currentStatus.overall}/100 (${currentStatus.trend}).`,
    currentStatus,
    recentTrends: {
      pain: painTrend.trend === 'decreasing' ? 'decreasing' : painTrend.trend === 'increasing' ? 'increasing' : 'stable',
      mobility: mobilityTrend,
      adherence: adherenceTrend,
    },
    criticalAlerts,
    medicationSummary: `Adherence: ${Math.round(medAdh.overall * 100)}% overall (${medAdh.trend}). ` +
      `Recent: ${recent.length > 0 ? recent[recent.length - 1].medicationsTaken : 0}/${recent.length > 0 ? recent[recent.length - 1].medicationsPrescribed : 0} medications taken.`,
    exerciseSummary: `Compliance: ${Math.round(exComp.overall * 100)}% overall. ` +
      `Total: ${exComp.totalMinutes} minutes logged. ` +
      `Recent average: ${Math.round(mean(recent.map((s) => s.exerciseMinutes)))} min/day.`,
    recommendedActions,
    riskFactors,
  };
}

// ─── Export Functions ─────────────────────────────────────────────────

function escapeCSV(val: unknown): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportSnapshotsToCSV(snapshots: DailySnapshot[]): string {
  const headers = [
    'patientId', 'date', 'painLevel', 'medicationsTaken', 'medicationsPrescribed',
    'exerciseMinutes', 'exerciseTarget', 'missionsCompleted', 'missionsAssigned',
    'stepsCount', 'sleepHours', 'moodScore', 'woundStatus',
    'heartRate', 'systolic', 'diastolic', 'temperature', 'oxygenSaturation',
    'engagementEvents', 'readmissionRisk',
  ];

  const rows = snapshots.map((s) => [
    s.patientId, s.date, s.painLevel, s.medicationsTaken, s.medicationsPrescribed,
    s.exerciseMinutes, s.exerciseTarget, s.missionsCompleted, s.missionsAssigned,
    s.stepsCount, s.sleepHours, s.moodScore, s.woundStatus,
    s.vitals.heartRate, s.vitals.bloodPressure.systolic, s.vitals.bloodPressure.diastolic,
    s.vitals.temperature, s.vitals.oxygenSaturation,
    s.engagementEvents, s.readmissionRisk,
  ].map(escapeCSV).join(','));

  return [headers.join(','), ...rows].join('\n');
}

function exportPatientsToCSV(patients: PatientRecord[]): string {
  const headers = ['patientId', 'name', 'surgeryType', 'surgeryDate', 'age', 'gender'];
  const rows = patients.map((p) =>
    [p.patientId, p.name, p.surgeryType, p.surgeryDate, p.age, p.gender]
      .map(escapeCSV).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

function exportToJSON<T>(data: T, pretty: boolean = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

function exportReportToCSV(report: WeeklySummary | MonthlyProgress): string {
  const lines: string[] = [];

  if ('weekStart' in report) {
    const r = report as WeeklySummary;
    lines.push('Weekly Summary Report');
    lines.push(`Patient,${r.patientId}`);
    lines.push(`Week,${r.weekStart} to ${r.weekEnd}`);
    lines.push(`Generated,${r.generatedAt}`);
    lines.push('');
    lines.push('Recovery Score');
    lines.push(`Overall,${r.recoveryScore.overall}`);
    lines.push(`Pain Management,${r.recoveryScore.painManagement}`);
    lines.push(`Medication Adherence,${r.recoveryScore.medicationAdherence}`);
    lines.push(`Exercise Compliance,${r.recoveryScore.exerciseCompliance}`);
    lines.push(`Mission Completion,${r.recoveryScore.missionCompletion}`);
    lines.push(`Engagement,${r.recoveryScore.engagement}`);
    lines.push(`Vital Stability,${r.recoveryScore.vitalStability}`);
    lines.push(`Trend,${r.recoveryScore.trend}`);
    lines.push('');
    lines.push(`Medication Adherence,${roundTo(r.medicationAdherence * 100, 1)}%`);
    lines.push(`Exercise Compliance,${roundTo(r.exerciseCompliance * 100, 1)}%`);
    lines.push(`Missions Completed,${r.missionsCompleted}/${r.missionsTotal}`);
    lines.push(`Current Streak,${r.streakStats.currentStreak} days`);
    lines.push('');
    lines.push('Highlights');
    r.highlights.forEach((h) => lines.push(`- ${escapeCSV(h)}`));
    lines.push('');
    lines.push('Concerns');
    r.concerns.forEach((c) => lines.push(`- ${escapeCSV(c)}`));
    lines.push('');
    lines.push('Recommendations');
    r.recommendations.forEach((rec) => lines.push(`- ${escapeCSV(rec)}`));
  } else {
    const r = report as MonthlyProgress;
    lines.push('Monthly Progress Report');
    lines.push(`Patient,${r.patientId}`);
    lines.push(`Month,${r.month}`);
    lines.push(`Generated,${r.generatedAt}`);
    lines.push('');
    lines.push('Weekly Scores');
    r.weeklyScores.forEach((s, i) => lines.push(`Week ${i + 1},${s}`));
    lines.push(`Overall Trend,${r.overallTrend}`);
    lines.push('');
    lines.push(`Pain Reduction,${r.painReduction}%`);
    lines.push(`Mobility Gain,${r.mobilityGain}%`);
    lines.push(`Medication Adherence,${roundTo(r.medicationAdherenceAvg * 100, 1)}%`);
    lines.push(`Exercise Compliance,${roundTo(r.exerciseComplianceAvg * 100, 1)}%`);
    lines.push('');
    lines.push('Milestones Reached');
    r.milestonesReached.forEach((m) => lines.push(`- ${escapeCSV(m)}`));
    lines.push('');
    lines.push('Areas for Improvement');
    r.areasForImprovement.forEach((a) => lines.push(`- ${escapeCSV(a)}`));
  }

  return lines.join('\n');
}

// ─── Main Analytics Service ──────────────────────────────────────────

export interface AnalyticsService {
  // Pipeline
  pipeline: AggregationPipeline;

  // Patient analytics
  getRecoveryProgressScore(patientId: string): RecoveryProgressScore;
  getMissionCompletionRates(patientId: string): { daily: { date: string; rate: number }[]; overall: number };
  getStreakStats(patientId: string): StreakStats;
  getMedicationAdherence(patientId: string): { daily: { date: string; adherence: number }[]; overall: number; trend: string };
  getPainTrend(patientId: string): PainTrend;
  getExerciseCompliance(patientId: string): { daily: { date: string; compliance: number }[]; overall: number; totalMinutes: number };
  getEngagementScore(patientId: string): { daily: { date: string; score: number }[]; overall: number; trend: string };

  // Population analytics
  getPopulationOverview(): PopulationOverview;
  getAverageRecoveryTimes(): RecoveryTimeStats[];
  getReadmissionRiskDistribution(): { buckets: { range: string; count: number }[]; avgRisk: number; highRiskPatients: string[] };
  getTreatmentEffectiveness(): TreatmentEffectiveness[];

  // Time-series
  getMovingAverage(data: TimeSeriesPoint[], window?: number): TimeSeriesPoint[];
  getExponentialMovingAverage(data: TimeSeriesPoint[], alpha?: number): TimeSeriesPoint[];
  getTrendLine(data: TimeSeriesPoint[]): TrendLineResult;
  getForecast(data: TimeSeriesPoint[], daysAhead?: number): ForecastResult;

  // Reports
  generateWeeklySummary(patientId: string, weekEndDate?: string): WeeklySummary;
  generateMonthlyProgress(patientId: string, month?: string): MonthlyProgress;
  generateDischargeReadiness(patientId: string): DischargeReadiness;
  generateDoctorHandoff(patientId: string): DoctorHandoff;

  // Export
  exportSnapshotsCSV(patientId?: string): string;
  exportPatientsCSV(): string;
  exportJSON<T>(data: T, pretty?: boolean): string;
  exportReportCSV(report: WeeklySummary | MonthlyProgress): string;

  // Utilities
  clearCache(): void;
  refreshData(): void;
}

export function createAnalyticsService(): AnalyticsService {
  const pipeline = createAggregationPipeline();

  return {
    pipeline,

    // ── Patient Analytics ──────────────────────────────────────────
    getRecoveryProgressScore(patientId: string): RecoveryProgressScore {
      const cacheKey = `recovery_score_${patientId}`;
      const cached = cacheGet<RecoveryProgressScore>(cacheKey);
      if (cached) return cached;

      const snaps = pipeline.getSnapshotsForPatient(patientId);
      const result = computeRecoveryProgressScore(snaps);
      cacheSet(cacheKey, result);
      return result;
    },

    getMissionCompletionRates(patientId: string) {
      const snaps = pipeline.getSnapshotsForPatient(patientId);
      return computeMissionCompletionRates(snaps);
    },

    getStreakStats(patientId: string) {
      const snaps = pipeline.getSnapshotsForPatient(patientId);
      return computeStreakStats(snaps);
    },

    getMedicationAdherence(patientId: string) {
      const snaps = pipeline.getSnapshotsForPatient(patientId);
      return computeMedicationAdherence(snaps);
    },

    getPainTrend(patientId: string) {
      const snaps = pipeline.getSnapshotsForPatient(patientId);
      return computePainTrend(snaps);
    },

    getExerciseCompliance(patientId: string) {
      const snaps = pipeline.getSnapshotsForPatient(patientId);
      return computeExerciseCompliance(snaps);
    },

    getEngagementScore(patientId: string) {
      const snaps = pipeline.getSnapshotsForPatient(patientId);
      return computeEngagementScore(snaps);
    },

    // ── Population Analytics ───────────────────────────────────────
    getPopulationOverview() {
      return computePopulationOverview(pipeline);
    },

    getAverageRecoveryTimes() {
      return computeAverageRecoveryTimes(pipeline);
    },

    getReadmissionRiskDistribution() {
      return computeReadmissionRiskDistribution(pipeline);
    },

    getTreatmentEffectiveness() {
      return computeTreatmentEffectiveness(pipeline);
    },

    // ── Time-Series ────────────────────────────────────────────────
    getMovingAverage(data: TimeSeriesPoint[], window: number = 7) {
      return computeMovingAverage(data, window);
    },

    getExponentialMovingAverage(data: TimeSeriesPoint[], alpha: number = 0.3) {
      return computeExponentialMovingAverage(data, alpha);
    },

    getTrendLine(data: TimeSeriesPoint[]) {
      return computeTrendLine(data);
    },

    getForecast(data: TimeSeriesPoint[], daysAhead: number = 7) {
      return computeForecast(data, daysAhead);
    },

    // ── Reports ────────────────────────────────────────────────────
    generateWeeklySummary(patientId: string, weekEndDate?: string) {
      return generateWeeklySummary(pipeline, patientId, weekEndDate);
    },

    generateMonthlyProgress(patientId: string, month?: string) {
      return generateMonthlyProgress(pipeline, patientId, month);
    },

    generateDischargeReadiness(patientId: string) {
      return generateDischargeReadiness(pipeline, patientId);
    },

    generateDoctorHandoff(patientId: string) {
      return generateDoctorHandoff(pipeline, patientId);
    },

    // ── Export ──────────────────────────────────────────────────────
    exportSnapshotsCSV(patientId?: string) {
      const snaps = patientId
        ? pipeline.getSnapshotsForPatient(patientId)
        : pipeline.snapshots;
      return exportSnapshotsToCSV(snaps);
    },

    exportPatientsCSV() {
      return exportPatientsToCSV(pipeline.patients);
    },

    exportJSON<T>(data: T, pretty: boolean = true) {
      return exportToJSON(data, pretty);
    },

    exportReportCSV(report: WeeklySummary | MonthlyProgress) {
      return exportReportToCSV(report);
    },

    // ── Utilities ──────────────────────────────────────────────────
    clearCache() {
      cacheClear();
    },

    refreshData() {
      pipeline.refreshData();
      cacheClear();
    },
  };
}

// Default singleton instance
let _defaultInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!_defaultInstance) {
    _defaultInstance = createAnalyticsService();
  }
  return _defaultInstance;
}

export default getAnalyticsService;
