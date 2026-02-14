// ============================================================================
// Anomaly Detection Engine for Patient Vital Signs and Behavioral Data
//
// Statistical anomaly detection system for post-operative patient monitoring.
// Implements multiple detection algorithms to identify concerning changes in
// vital signs, activity patterns, and behavioral data.
//
// Features:
// - Z-score anomaly detection for vital signs
// - IQR-based outlier detection (Tukey's method)
// - Moving average with standard deviation bands
// - Mahalanobis distance for multivariate anomaly detection
// - Baseline learning from initial patient data
// - Vital sign anomaly classification by severity
// - Behavioral anomaly detection (activity patterns)
// - Realistic test data generator (50 patients, 30 days)
//
// No external dependencies. Pure TypeScript.
// ============================================================================

// ============================================================================
// Types
// ============================================================================

export const AnomalySeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;
export type AnomalySeverity = typeof AnomalySeverity[keyof typeof AnomalySeverity];

export const AnomalyType = {
  Z_SCORE: 'z_score',
  IQR: 'iqr',
  MOVING_AVERAGE: 'moving_average',
  MAHALANOBIS: 'mahalanobis',
  TREND: 'trend',
  BEHAVIORAL: 'behavioral',
} as const;
export type AnomalyType = typeof AnomalyType[keyof typeof AnomalyType];

export const VitalType = {
  HEART_RATE: 'heart_rate',
  BLOOD_PRESSURE_SYSTOLIC: 'blood_pressure_systolic',
  BLOOD_PRESSURE_DIASTOLIC: 'blood_pressure_diastolic',
  TEMPERATURE: 'temperature',
  OXYGEN_SATURATION: 'oxygen_saturation',
  RESPIRATORY_RATE: 'respiratory_rate',
  PAIN_LEVEL: 'pain_level',
  BLOOD_GLUCOSE: 'blood_glucose',
} as const;
export type VitalType = typeof VitalType[keyof typeof VitalType];

/** A single vital sign reading */
export interface VitalReading {
  patientId: string;
  timestamp: string; // ISO date string
  vitalType: VitalType;
  value: number;
  unit: string;
}

/** Activity log entry for behavioral analysis */
export interface ActivityLog {
  patientId: string;
  timestamp: string;
  activityType: 'medication_taken' | 'exercise_completed' | 'meal_logged'
    | 'sleep_logged' | 'app_login' | 'symptom_reported' | 'photo_uploaded'
    | 'appointment_attended' | 'journal_entry' | 'mission_completed';
  duration?: number; // minutes, if applicable
  value?: number; // e.g., pain level, sleep hours
  notes?: string;
}

/** Learned baseline for a patient */
export interface Baseline {
  patientId: string;
  createdAt: string;
  updatedAt: string;
  sampleCount: number;
  vitals: Record<string, VitalBaseline>;
  correlationMatrix: number[][] | null;
  featureMeans: number[] | null;
  featureStds: number[] | null;
  covarianceMatrix: number[][] | null;
  inverseCovarianceMatrix: number[][] | null;
}

/** Per-vital-sign baseline statistics */
export interface VitalBaseline {
  vitalType: VitalType;
  mean: number;
  stdDev: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  min: number;
  max: number;
  sampleCount: number;
  recentValues: number[]; // Last 20 values for moving average
}

/** A detected anomaly */
export interface Anomaly {
  id: string;
  patientId: string;
  timestamp: string;
  detectionType: AnomalyType;
  vitalType?: VitalType;
  observedValue: number;
  expectedValue: number;
  deviation: number; // How far from expected (in std devs or other measure)
  severity: AnomalySeverity;
  description: string;
  metadata: Record<string, number | string>;
}

/** Classification result for an anomaly */
export interface AnomalyClassification {
  severity: AnomalySeverity;
  description: string;
  recommendedAction?: string;
  clinicalSignificance: 'low' | 'moderate' | 'high';
}

/** Configuration for anomaly detection thresholds */
export interface DetectionConfig {
  zScoreWarningThreshold: number;
  zScoreCriticalThreshold: number;
  iqrMultiplierWarning: number;
  iqrMultiplierCritical: number;
  movingAverageWindow: number;
  movingAverageBandWidth: number; // in std devs
  mahalanobisWarningThreshold: number;
  mahalanobisCriticalThreshold: number;
  minimumBaselineSamples: number;
}

/** Test data generation parameters */
export interface TestDataParams {
  patientCount: number;
  daysPerPatient: number;
  readingsPerDay: number;
  anomalyRate: number; // 0-1, probability of injecting anomalies
  seed: number;
}

/** Generated test data bundle */
export interface TestDataBundle {
  patients: Array<{
    patientId: string;
    age: number;
    surgeryType: string;
    daysPostOp: number;
  }>;
  vitalReadings: VitalReading[];
  activityLogs: ActivityLog[];
  injectedAnomalies: Array<{
    patientId: string;
    timestamp: string;
    vitalType: VitalType;
    value: number;
    description: string;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: DetectionConfig = {
  zScoreWarningThreshold: 2.0,
  zScoreCriticalThreshold: 3.0,
  iqrMultiplierWarning: 1.5,
  iqrMultiplierCritical: 3.0,
  movingAverageWindow: 7,
  movingAverageBandWidth: 2.0,
  mahalanobisWarningThreshold: 3.0,
  mahalanobisCriticalThreshold: 5.0,
  minimumBaselineSamples: 5,
};

/** Normal ranges for vital signs (adult post-operative) */
const VITAL_NORMAL_RANGES: Record<VitalType, {
  min: number;
  max: number;
  unit: string;
  criticalLow: number;
  criticalHigh: number;
  label: string;
}> = {
  [VitalType.HEART_RATE]: {
    min: 60, max: 100, unit: 'bpm',
    criticalLow: 40, criticalHigh: 150,
    label: 'Heart Rate',
  },
  [VitalType.BLOOD_PRESSURE_SYSTOLIC]: {
    min: 90, max: 140, unit: 'mmHg',
    criticalLow: 70, criticalHigh: 200,
    label: 'Systolic Blood Pressure',
  },
  [VitalType.BLOOD_PRESSURE_DIASTOLIC]: {
    min: 60, max: 90, unit: 'mmHg',
    criticalLow: 40, criticalHigh: 120,
    label: 'Diastolic Blood Pressure',
  },
  [VitalType.TEMPERATURE]: {
    min: 36.1, max: 37.5, unit: 'C',
    criticalLow: 34.0, criticalHigh: 40.0,
    label: 'Body Temperature',
  },
  [VitalType.OXYGEN_SATURATION]: {
    min: 95, max: 100, unit: '%',
    criticalLow: 85, criticalHigh: 101,
    label: 'Oxygen Saturation',
  },
  [VitalType.RESPIRATORY_RATE]: {
    min: 12, max: 20, unit: 'breaths/min',
    criticalLow: 8, criticalHigh: 35,
    label: 'Respiratory Rate',
  },
  [VitalType.PAIN_LEVEL]: {
    min: 0, max: 4, unit: '/10',
    criticalLow: -1, criticalHigh: 10,
    label: 'Pain Level',
  },
  [VitalType.BLOOD_GLUCOSE]: {
    min: 70, max: 140, unit: 'mg/dL',
    criticalLow: 40, criticalHigh: 400,
    label: 'Blood Glucose',
  },
};

/** Vital types used for multivariate analysis */
const MULTIVARIATE_VITALS: VitalType[] = [
  VitalType.HEART_RATE,
  VitalType.BLOOD_PRESSURE_SYSTOLIC,
  VitalType.BLOOD_PRESSURE_DIASTOLIC,
  VitalType.TEMPERATURE,
  VitalType.OXYGEN_SATURATION,
  VitalType.RESPIRATORY_RATE,
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
  return `anom-${timestamp}-${randomPart}`;
}

/** Seeded PRNG (Mulberry32) */
function createRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller transform for normal distribution */
function normalRandom(rng: () => number, mean: number = 0, stdDev: number = 1): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/** Compute mean of an array */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Compute standard deviation */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Compute median */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Compute percentile using linear interpolation */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const fraction = index - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

/** Compute Q1, Q3, IQR */
function computeQuartiles(values: number[]): { q1: number; q3: number; iqr: number } {
  const q1 = percentile(values, 25);
  const q3 = percentile(values, 75);
  return { q1, q3, iqr: q3 - q1 };
}

// ============================================================================
// Matrix Operations (for Mahalanobis distance)
// ============================================================================

/** Compute covariance matrix from data rows */
function computeCovarianceMatrix(data: number[][]): number[][] {
  const n = data.length;
  const p = data[0]?.length ?? 0;
  if (n < 2 || p === 0) return [];

  const means = new Array(p).fill(0);
  for (const row of data) {
    for (let j = 0; j < p; j++) {
      means[j] += row[j];
    }
  }
  for (let j = 0; j < p; j++) {
    means[j] /= n;
  }

  const cov: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (const row of data) {
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        cov[i][j] += (row[i] - means[i]) * (row[j] - means[j]);
      }
    }
  }
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      cov[i][j] /= (n - 1);
    }
  }

  return cov;
}

/** Compute correlation matrix from covariance matrix */
function covarianceToCorrelation(cov: number[][]): number[][] {
  const p = cov.length;
  const corr: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      const denominator = Math.sqrt(cov[i][i] * cov[j][j]);
      corr[i][j] = denominator > 0 ? cov[i][j] / denominator : 0;
    }
  }
  return corr;
}

/**
 * Invert a matrix using Gauss-Jordan elimination.
 * Returns null if the matrix is singular.
 */
function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  // Build augmented matrix [matrix | identity]
  const augmented: number[][] = matrix.map((row, i) => {
    const identityRow = new Array(n).fill(0);
    identityRow[i] = 1;
    return [...row, ...identityRow];
  });

  for (let col = 0; col < n; col++) {
    // Find pivot row
    let maxVal = Math.abs(augmented[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > maxVal) {
        maxVal = Math.abs(augmented[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < 1e-10) {
      // Singular matrix - add small regularization
      augmented[col][col] += 1e-6;
    }

    // Swap rows
    if (maxRow !== col) {
      [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
    }

    // Eliminate below and above
    const pivot = augmented[col][col];
    for (let j = 0; j < 2 * n; j++) {
      augmented[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = 0; j < 2 * n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  // Extract the inverse (right half of augmented matrix)
  return augmented.map(row => row.slice(n));
}

/**
 * Compute Mahalanobis distance of a point from the distribution.
 * D = sqrt((x - mu)^T * Sigma^-1 * (x - mu))
 */
function mahalanobisDistance(
  point: number[],
  featureMeans: number[],
  inverseCov: number[][],
): number {
  const p = point.length;
  const diff = point.map((v, i) => v - featureMeans[i]);

  // Multiply diff^T * inverseCov * diff
  let result = 0;
  for (let i = 0; i < p; i++) {
    let innerSum = 0;
    for (let j = 0; j < p; j++) {
      innerSum += inverseCov[i][j] * diff[j];
    }
    result += diff[i] * innerSum;
  }

  return Math.sqrt(Math.max(0, result));
}

// ============================================================================
// Baseline Learning
// ============================================================================

/**
 * Build a statistical baseline from a set of vital sign readings.
 *
 * Computes per-vital-type statistics (mean, std dev, quartiles, IQR)
 * and multivariate statistics (covariance matrix, inverse covariance)
 * for use in anomaly detection.
 *
 * @param readings - Array of vital sign readings from the baseline period
 * @returns Baseline object with all computed statistics
 */
export function buildBaseline(readings: VitalReading[]): Baseline {
  if (readings.length === 0) {
    throw new Error('Cannot build baseline from empty readings array');
  }

  const patientId = readings[0].patientId;
  const now = new Date().toISOString();

  // Group readings by vital type
  const groupedByType = new Map<VitalType, number[]>();
  for (const reading of readings) {
    if (!groupedByType.has(reading.vitalType)) {
      groupedByType.set(reading.vitalType, []);
    }
    groupedByType.get(reading.vitalType)!.push(reading.value);
  }

  // Compute per-vital-type baselines
  const vitals: Record<string, VitalBaseline> = {};
  for (const [vitalType, values] of groupedByType.entries()) {
    const { q1, q3, iqr } = computeQuartiles(values);
    const sorted = [...values].sort((a, b) => a - b);

    vitals[vitalType] = {
      vitalType,
      mean: Math.round(mean(values) * 100) / 100,
      stdDev: Math.round(stdDev(values) * 100) / 100,
      median: Math.round(median(values) * 100) / 100,
      q1: Math.round(q1 * 100) / 100,
      q3: Math.round(q3 * 100) / 100,
      iqr: Math.round(iqr * 100) / 100,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      sampleCount: values.length,
      recentValues: values.slice(-20),
    };
  }

  // Build multivariate data matrix for Mahalanobis distance
  // Group readings by timestamp (closest readings form a vector)
  const timestampGroups = new Map<string, Map<VitalType, number>>();
  for (const reading of readings) {
    // Round timestamp to nearest hour for grouping
    const date = new Date(reading.timestamp);
    const roundedKey = `${date.toISOString().slice(0, 13)}:00:00.000Z`;

    if (!timestampGroups.has(roundedKey)) {
      timestampGroups.set(roundedKey, new Map());
    }
    timestampGroups.get(roundedKey)!.set(reading.vitalType, reading.value);
  }

  // Build feature vectors from timestamps that have all multivariate vitals
  const featureVectors: number[][] = [];
  for (const typeMap of timestampGroups.values()) {
    const hasAllVitals = MULTIVARIATE_VITALS.every(vt => typeMap.has(vt));
    if (hasAllVitals) {
      featureVectors.push(MULTIVARIATE_VITALS.map(vt => typeMap.get(vt)!));
    }
  }

  let correlationMatrix: number[][] | null = null;
  let featureMeans: number[] | null = null;
  let featureStds: number[] | null = null;
  let covarianceMatrix: number[][] | null = null;
  let inverseCovarianceMatrix: number[][] | null = null;

  if (featureVectors.length >= 3) {
    const p = MULTIVARIATE_VITALS.length;
    featureMeans = new Array(p).fill(0);
    featureStds = new Array(p).fill(0);

    for (const vec of featureVectors) {
      for (let j = 0; j < p; j++) {
        featureMeans[j] += vec[j];
      }
    }
    for (let j = 0; j < p; j++) {
      featureMeans[j] /= featureVectors.length;
    }

    for (const vec of featureVectors) {
      for (let j = 0; j < p; j++) {
        featureStds[j] += (vec[j] - featureMeans[j]) ** 2;
      }
    }
    for (let j = 0; j < p; j++) {
      featureStds[j] = Math.sqrt(featureStds[j] / (featureVectors.length - 1));
    }

    covarianceMatrix = computeCovarianceMatrix(featureVectors);
    correlationMatrix = covarianceToCorrelation(covarianceMatrix);

    // Add small regularization to diagonal before inverting
    const regularized = covarianceMatrix.map((row, i) =>
      row.map((val, j) => val + (i === j ? 1e-4 : 0)),
    );
    inverseCovarianceMatrix = invertMatrix(regularized);
  }

  return {
    patientId,
    createdAt: now,
    updatedAt: now,
    sampleCount: readings.length,
    vitals,
    correlationMatrix,
    featureMeans,
    featureStds,
    covarianceMatrix,
    inverseCovarianceMatrix,
  };
}

// ============================================================================
// Z-Score Anomaly Detection
// ============================================================================

/**
 * Detect anomalies using z-score method.
 * Z = (x - mean) / stdDev
 *
 * If the baseline has insufficient data, falls back to clinical normal ranges.
 */
function detectZScoreAnomalies(
  reading: VitalReading,
  baseline: VitalBaseline | undefined,
  config: DetectionConfig,
): Anomaly | null {
  const normalRange = VITAL_NORMAL_RANGES[reading.vitalType];
  if (!normalRange) return null;

  let expectedMean: number;
  let expectedStd: number;

  if (baseline && baseline.sampleCount >= config.minimumBaselineSamples && baseline.stdDev > 0) {
    expectedMean = baseline.mean;
    expectedStd = baseline.stdDev;
  } else {
    // Fall back to clinical normal range
    expectedMean = (normalRange.min + normalRange.max) / 2;
    expectedStd = (normalRange.max - normalRange.min) / 4;
  }

  if (expectedStd < 1e-10) return null;

  const zScore = Math.abs(reading.value - expectedMean) / expectedStd;

  if (zScore >= config.zScoreWarningThreshold) {
    const severity = zScore >= config.zScoreCriticalThreshold
      ? AnomalySeverity.CRITICAL
      : AnomalySeverity.WARNING;

    const direction = reading.value > expectedMean ? 'elevated' : 'reduced';

    return {
      id: generateId(),
      patientId: reading.patientId,
      timestamp: reading.timestamp,
      detectionType: AnomalyType.Z_SCORE,
      vitalType: reading.vitalType,
      observedValue: reading.value,
      expectedValue: Math.round(expectedMean * 100) / 100,
      deviation: Math.round(zScore * 100) / 100,
      severity,
      description:
        `${normalRange.label} is ${direction} at ${reading.value}${normalRange.unit} ` +
        `(z-score: ${zScore.toFixed(2)}, expected: ${expectedMean.toFixed(1)}${normalRange.unit})`,
      metadata: {
        zScore: Math.round(zScore * 100) / 100,
        baselineMean: expectedMean,
        baselineStdDev: expectedStd,
        direction,
      },
    };
  }

  return null;
}

// ============================================================================
// IQR-Based Outlier Detection
// ============================================================================

/**
 * Detect outliers using Tukey's IQR method.
 * Outlier if: value < Q1 - k*IQR or value > Q3 + k*IQR
 */
function detectIqrAnomalies(
  reading: VitalReading,
  baseline: VitalBaseline | undefined,
  config: DetectionConfig,
): Anomaly | null {
  if (!baseline || baseline.sampleCount < config.minimumBaselineSamples || baseline.iqr <= 0) {
    return null;
  }

  const normalRange = VITAL_NORMAL_RANGES[reading.vitalType];
  if (!normalRange) return null;

  const lowerWarning = baseline.q1 - config.iqrMultiplierWarning * baseline.iqr;
  const upperWarning = baseline.q3 + config.iqrMultiplierWarning * baseline.iqr;
  const lowerCritical = baseline.q1 - config.iqrMultiplierCritical * baseline.iqr;
  const upperCritical = baseline.q3 + config.iqrMultiplierCritical * baseline.iqr;

  const isOutlier = reading.value < lowerWarning || reading.value > upperWarning;
  if (!isOutlier) return null;

  const isCritical = reading.value < lowerCritical || reading.value > upperCritical;
  const severity = isCritical ? AnomalySeverity.CRITICAL : AnomalySeverity.WARNING;
  const direction = reading.value > baseline.median ? 'above' : 'below';

  const iqrDeviation = direction === 'above'
    ? (reading.value - baseline.q3) / baseline.iqr
    : (baseline.q1 - reading.value) / baseline.iqr;

  return {
    id: generateId(),
    patientId: reading.patientId,
    timestamp: reading.timestamp,
    detectionType: AnomalyType.IQR,
    vitalType: reading.vitalType,
    observedValue: reading.value,
    expectedValue: Math.round(baseline.median * 100) / 100,
    deviation: Math.round(iqrDeviation * 100) / 100,
    severity,
    description:
      `${normalRange.label} outlier detected: ${reading.value}${normalRange.unit} is ` +
      `${Math.abs(iqrDeviation).toFixed(1)}x IQR ${direction} the expected range ` +
      `[${baseline.q1.toFixed(1)}, ${baseline.q3.toFixed(1)}]`,
    metadata: {
      iqrDeviation: Math.round(iqrDeviation * 100) / 100,
      q1: baseline.q1,
      q3: baseline.q3,
      iqr: baseline.iqr,
      direction,
    },
  };
}

// ============================================================================
// Moving Average with Standard Deviation Bands
// ============================================================================

/**
 * Detect anomalies using moving average with Bollinger-band-style deviation bands.
 * An anomaly is flagged when the current value falls outside:
 *   movingAvg +/- bandWidth * movingStdDev
 */
function detectMovingAverageAnomalies(
  reading: VitalReading,
  baseline: VitalBaseline | undefined,
  config: DetectionConfig,
): Anomaly | null {
  if (!baseline || baseline.recentValues.length < 3) return null;

  const normalRange = VITAL_NORMAL_RANGES[reading.vitalType];
  if (!normalRange) return null;

  const window = baseline.recentValues.slice(-config.movingAverageWindow);
  const ma = mean(window);
  const maStd = stdDev(window);

  if (maStd < 1e-10) return null;

  const upperBand = ma + config.movingAverageBandWidth * maStd;
  const lowerBand = ma - config.movingAverageBandWidth * maStd;

  if (reading.value >= lowerBand && reading.value <= upperBand) return null;

  const deviation = (reading.value - ma) / maStd;
  const direction = reading.value > ma ? 'above' : 'below';

  // Higher deviation from moving average is more severe
  const severity = Math.abs(deviation) > config.movingAverageBandWidth * 1.5
    ? AnomalySeverity.CRITICAL
    : AnomalySeverity.WARNING;

  return {
    id: generateId(),
    patientId: reading.patientId,
    timestamp: reading.timestamp,
    detectionType: AnomalyType.MOVING_AVERAGE,
    vitalType: reading.vitalType,
    observedValue: reading.value,
    expectedValue: Math.round(ma * 100) / 100,
    deviation: Math.round(deviation * 100) / 100,
    severity,
    description:
      `${normalRange.label} deviated from moving average: ` +
      `${reading.value}${normalRange.unit} is ${Math.abs(deviation).toFixed(1)} std devs ` +
      `${direction} the ${config.movingAverageWindow}-reading average of ${ma.toFixed(1)}`,
    metadata: {
      movingAverage: Math.round(ma * 100) / 100,
      movingStdDev: Math.round(maStd * 100) / 100,
      upperBand: Math.round(upperBand * 100) / 100,
      lowerBand: Math.round(lowerBand * 100) / 100,
      windowSize: config.movingAverageWindow,
      direction,
    },
  };
}

// ============================================================================
// Mahalanobis Distance Detection (Multivariate)
// ============================================================================

/**
 * Detect multivariate anomalies using Mahalanobis distance.
 * This catches anomalies where individual vitals may be within range,
 * but their combination is unusual (e.g., high heart rate with low BP).
 */
function detectMahalanobisAnomalies(
  readings: VitalReading[],
  baseline: Baseline,
  config: DetectionConfig,
): Anomaly[] {
  if (!baseline.inverseCovarianceMatrix || !baseline.featureMeans) return [];

  const anomalies: Anomaly[] = [];

  // Group concurrent readings by timestamp (rounded to nearest hour)
  const timestampGroups = new Map<string, Map<VitalType, VitalReading>>();
  for (const reading of readings) {
    const date = new Date(reading.timestamp);
    const roundedKey = `${date.toISOString().slice(0, 13)}:00:00.000Z`;
    if (!timestampGroups.has(roundedKey)) {
      timestampGroups.set(roundedKey, new Map());
    }
    timestampGroups.get(roundedKey)!.set(reading.vitalType, reading);
  }

  for (const [timestamp, typeMap] of timestampGroups.entries()) {
    const hasAllVitals = MULTIVARIATE_VITALS.every(vt => typeMap.has(vt));
    if (!hasAllVitals) continue;

    const point = MULTIVARIATE_VITALS.map(vt => typeMap.get(vt)!.value);
    const distance = mahalanobisDistance(
      point,
      baseline.featureMeans,
      baseline.inverseCovarianceMatrix,
    );

    if (distance >= config.mahalanobisWarningThreshold) {
      const severity = distance >= config.mahalanobisCriticalThreshold
        ? AnomalySeverity.CRITICAL
        : AnomalySeverity.WARNING;

      // Find which vitals contributed most to the anomaly
      const contributions: Array<{ vital: VitalType; deviation: number }> = [];
      for (let i = 0; i < MULTIVARIATE_VITALS.length; i++) {
        const vt = MULTIVARIATE_VITALS[i];
        const vBaseline = baseline.vitals[vt];
        if (vBaseline && vBaseline.stdDev > 0) {
          const zs = Math.abs(point[i] - vBaseline.mean) / vBaseline.stdDev;
          contributions.push({ vital: vt, deviation: zs });
        }
      }
      contributions.sort((a, b) => b.deviation - a.deviation);
      const topContributors = contributions.slice(0, 3)
        .map(c => `${VITAL_NORMAL_RANGES[c.vital]?.label ?? c.vital}: ${c.deviation.toFixed(1)}σ`)
        .join(', ');

      anomalies.push({
        id: generateId(),
        patientId: baseline.patientId,
        timestamp,
        detectionType: AnomalyType.MAHALANOBIS,
        observedValue: Math.round(distance * 100) / 100,
        expectedValue: 0,
        deviation: Math.round(distance * 100) / 100,
        severity,
        description:
          `Multivariate anomaly detected (Mahalanobis distance: ${distance.toFixed(2)}). ` +
          `Unusual combination of vital signs. Top contributors: ${topContributors}`,
        metadata: {
          mahalanobisDistance: Math.round(distance * 100) / 100,
          topContributors,
        },
      });
    }
  }

  return anomalies;
}

// ============================================================================
// Core Detection Functions
// ============================================================================

/**
 * Detect anomalies in vital sign readings.
 *
 * Applies multiple detection methods:
 * 1. Z-score analysis per vital type
 * 2. IQR-based outlier detection
 * 3. Moving average deviation
 * 4. Mahalanobis distance (multivariate)
 *
 * Results are deduplicated: if multiple methods detect the same anomaly,
 * the highest severity is kept.
 *
 * @param readings - Array of vital sign readings to analyze
 * @param baseline - Optional baseline statistics (if not provided, clinical norms are used)
 * @returns Array of detected anomalies
 */
export function detectVitalSignAnomalies(
  readings: VitalReading[],
  baseline?: Baseline,
  config?: Partial<DetectionConfig>,
): Anomaly[] {
  const mergedConfig: DetectionConfig = { ...DEFAULT_CONFIG, ...config };
  const anomalies: Anomaly[] = [];

  // If no baseline provided, build one from the readings if we have enough data
  let effectiveBaseline = baseline;
  if (!effectiveBaseline && readings.length >= mergedConfig.minimumBaselineSamples) {
    effectiveBaseline = buildBaseline(readings);
  }

  // Per-reading detection
  for (const reading of readings) {
    const vitalBaseline = effectiveBaseline?.vitals[reading.vitalType];

    // Z-score detection
    const zAnomaly = detectZScoreAnomalies(reading, vitalBaseline, mergedConfig);
    if (zAnomaly) anomalies.push(zAnomaly);

    // IQR detection
    const iqrAnomaly = detectIqrAnomalies(reading, vitalBaseline, mergedConfig);
    if (iqrAnomaly) anomalies.push(iqrAnomaly);

    // Moving average detection
    const maAnomaly = detectMovingAverageAnomalies(reading, vitalBaseline, mergedConfig);
    if (maAnomaly) anomalies.push(maAnomaly);

    // Clinical range check (always apply regardless of baseline)
    const normalRange = VITAL_NORMAL_RANGES[reading.vitalType];
    if (normalRange) {
      if (reading.value <= normalRange.criticalLow || reading.value >= normalRange.criticalHigh) {
        anomalies.push({
          id: generateId(),
          patientId: reading.patientId,
          timestamp: reading.timestamp,
          detectionType: AnomalyType.Z_SCORE,
          vitalType: reading.vitalType,
          observedValue: reading.value,
          expectedValue: (normalRange.min + normalRange.max) / 2,
          deviation: 99, // Extreme deviation marker
          severity: AnomalySeverity.CRITICAL,
          description:
            `CRITICAL: ${normalRange.label} at ${reading.value}${normalRange.unit} ` +
            `is outside safe clinical range [${normalRange.criticalLow}, ${normalRange.criticalHigh}]`,
          metadata: {
            criticalLow: normalRange.criticalLow,
            criticalHigh: normalRange.criticalHigh,
            clinicalRangeViolation: 'true',
          },
        });
      }
    }
  }

  // Mahalanobis distance detection (multivariate)
  if (effectiveBaseline) {
    const mahaAnomalies = detectMahalanobisAnomalies(readings, effectiveBaseline, mergedConfig);
    anomalies.push(...mahaAnomalies);
  }

  // Deduplicate: keep highest severity per patient + timestamp + vitalType combination
  return deduplicateAnomalies(anomalies);
}

/**
 * Detect behavioral anomalies from activity logs.
 *
 * Identifies concerning patterns:
 * - Sudden drops in app engagement
 * - Missed medication patterns
 * - Sleep pattern changes
 * - Reduced exercise compliance
 * - Increased symptom reporting
 *
 * @param activities - Array of activity log entries
 * @returns Array of detected behavioral anomalies
 */
export function detectBehavioralAnomalies(activities: ActivityLog[]): Anomaly[] {
  if (activities.length < 7) return [];

  const anomalies: Anomaly[] = [];
  const patientId = activities[0].patientId;

  // Sort by timestamp
  const sorted = [...activities].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Group activities by date
  const dailyActivities = new Map<string, ActivityLog[]>();
  for (const activity of sorted) {
    const dateKey = activity.timestamp.slice(0, 10);
    if (!dailyActivities.has(dateKey)) {
      dailyActivities.set(dateKey, []);
    }
    dailyActivities.get(dateKey)!.push(activity);
  }

  const dates = Array.from(dailyActivities.keys()).sort();
  if (dates.length < 3) return anomalies;

  // --- Engagement drop detection ---
  const dailyCounts = dates.map(d => dailyActivities.get(d)!.length);
  if (dailyCounts.length >= 7) {
    const firstHalf = dailyCounts.slice(0, Math.floor(dailyCounts.length / 2));
    const secondHalf = dailyCounts.slice(Math.floor(dailyCounts.length / 2));
    const firstAvg = mean(firstHalf);
    const secondAvg = mean(secondHalf);

    if (firstAvg > 0 && secondAvg / firstAvg < 0.4) {
      anomalies.push({
        id: generateId(),
        patientId,
        timestamp: new Date().toISOString(),
        detectionType: AnomalyType.BEHAVIORAL,
        observedValue: Math.round(secondAvg * 100) / 100,
        expectedValue: Math.round(firstAvg * 100) / 100,
        deviation: Math.round(((firstAvg - secondAvg) / firstAvg) * 100) / 100,
        severity: AnomalySeverity.WARNING,
        description:
          `Significant engagement drop: daily activities decreased from ` +
          `${firstAvg.toFixed(1)} to ${secondAvg.toFixed(1)} per day (${Math.round((1 - secondAvg / firstAvg) * 100)}% decline)`,
        metadata: {
          firstHalfAvg: firstAvg,
          secondHalfAvg: secondAvg,
          declinePercentage: Math.round((1 - secondAvg / firstAvg) * 100),
        },
      });
    }
  }

  // --- Missed medication pattern ---
  const medicationByDate = new Map<string, number>();
  for (const activity of sorted) {
    if (activity.activityType === 'medication_taken') {
      const dateKey = activity.timestamp.slice(0, 10);
      medicationByDate.set(dateKey, (medicationByDate.get(dateKey) ?? 0) + 1);
    }
  }

  // Check for consecutive days without medication
  let consecutiveMissed = 0;
  let maxConsecutiveMissed = 0;
  for (const date of dates) {
    if (!medicationByDate.has(date)) {
      consecutiveMissed++;
      maxConsecutiveMissed = Math.max(maxConsecutiveMissed, consecutiveMissed);
    } else {
      consecutiveMissed = 0;
    }
  }

  if (maxConsecutiveMissed >= 3) {
    anomalies.push({
      id: generateId(),
      patientId,
      timestamp: new Date().toISOString(),
      detectionType: AnomalyType.BEHAVIORAL,
      observedValue: maxConsecutiveMissed,
      expectedValue: 0,
      deviation: maxConsecutiveMissed,
      severity: maxConsecutiveMissed >= 5 ? AnomalySeverity.CRITICAL : AnomalySeverity.WARNING,
      description:
        `Medication non-adherence: ${maxConsecutiveMissed} consecutive days without medication logged`,
      metadata: {
        consecutiveDays: maxConsecutiveMissed,
        totalDaysTracked: dates.length,
      },
    });
  }

  // --- Increased symptom reporting ---
  const symptomsByDate = new Map<string, number>();
  for (const activity of sorted) {
    if (activity.activityType === 'symptom_reported') {
      const dateKey = activity.timestamp.slice(0, 10);
      symptomsByDate.set(dateKey, (symptomsByDate.get(dateKey) ?? 0) + 1);
    }
  }

  if (dates.length >= 7) {
    const recentDates = dates.slice(-7);
    const olderDates = dates.slice(0, -7);

    if (olderDates.length >= 3) {
      const recentSymptomAvg = mean(recentDates.map(d => symptomsByDate.get(d) ?? 0));
      const olderSymptomAvg = mean(olderDates.map(d => symptomsByDate.get(d) ?? 0));

      if (recentSymptomAvg > olderSymptomAvg * 2 && recentSymptomAvg >= 2) {
        anomalies.push({
          id: generateId(),
          patientId,
          timestamp: new Date().toISOString(),
          detectionType: AnomalyType.BEHAVIORAL,
          observedValue: Math.round(recentSymptomAvg * 100) / 100,
          expectedValue: Math.round(olderSymptomAvg * 100) / 100,
          deviation: olderSymptomAvg > 0
            ? Math.round((recentSymptomAvg / olderSymptomAvg) * 100) / 100
            : recentSymptomAvg,
          severity: AnomalySeverity.WARNING,
          description:
            `Increased symptom reporting: recent average of ${recentSymptomAvg.toFixed(1)} reports/day ` +
            `vs baseline of ${olderSymptomAvg.toFixed(1)} reports/day`,
          metadata: {
            recentAvg: recentSymptomAvg,
            baselineAvg: olderSymptomAvg,
          },
        });
      }
    }
  }

  // --- Sleep pattern changes ---
  const sleepEntries = sorted.filter(a => a.activityType === 'sleep_logged' && a.value !== undefined);
  if (sleepEntries.length >= 7) {
    const sleepValues = sleepEntries.map(a => a.value!);
    const recentSleep = sleepValues.slice(-5);
    const baselineSleep = sleepValues.slice(0, -5);

    if (baselineSleep.length >= 3) {
      const recentAvg = mean(recentSleep);
      const baselineAvg = mean(baselineSleep);
      const baselineStd = stdDev(baselineSleep);

      if (baselineStd > 0 && Math.abs(recentAvg - baselineAvg) > 1.5 * baselineStd) {
        const direction = recentAvg < baselineAvg ? 'decreased' : 'increased';
        anomalies.push({
          id: generateId(),
          patientId,
          timestamp: new Date().toISOString(),
          detectionType: AnomalyType.BEHAVIORAL,
          observedValue: Math.round(recentAvg * 100) / 100,
          expectedValue: Math.round(baselineAvg * 100) / 100,
          deviation: Math.round(((recentAvg - baselineAvg) / baselineStd) * 100) / 100,
          severity: AnomalySeverity.WARNING,
          description:
            `Sleep pattern change: average sleep ${direction} from ` +
            `${baselineAvg.toFixed(1)}h to ${recentAvg.toFixed(1)}h`,
          metadata: {
            recentAverage: recentAvg,
            baselineAverage: baselineAvg,
            direction,
          },
        });
      }
    }
  }

  // --- Exercise compliance drop ---
  const exerciseByDate = new Map<string, number>();
  for (const activity of sorted) {
    if (activity.activityType === 'exercise_completed') {
      const dateKey = activity.timestamp.slice(0, 10);
      exerciseByDate.set(dateKey, (exerciseByDate.get(dateKey) ?? 0) + (activity.duration ?? 1));
    }
  }

  if (dates.length >= 14) {
    const firstWeek = dates.slice(0, 7);
    const lastWeek = dates.slice(-7);
    const firstWeekExercise = mean(firstWeek.map(d => exerciseByDate.get(d) ?? 0));
    const lastWeekExercise = mean(lastWeek.map(d => exerciseByDate.get(d) ?? 0));

    if (firstWeekExercise > 0 && lastWeekExercise / firstWeekExercise < 0.3) {
      anomalies.push({
        id: generateId(),
        patientId,
        timestamp: new Date().toISOString(),
        detectionType: AnomalyType.BEHAVIORAL,
        observedValue: Math.round(lastWeekExercise * 100) / 100,
        expectedValue: Math.round(firstWeekExercise * 100) / 100,
        deviation: Math.round((1 - lastWeekExercise / firstWeekExercise) * 100) / 100,
        severity: AnomalySeverity.WARNING,
        description:
          `Exercise compliance dropped: average daily exercise decreased from ` +
          `${firstWeekExercise.toFixed(0)} to ${lastWeekExercise.toFixed(0)} minutes ` +
          `(${Math.round((1 - lastWeekExercise / firstWeekExercise) * 100)}% decline)`,
        metadata: {
          firstWeekAvg: firstWeekExercise,
          lastWeekAvg: lastWeekExercise,
        },
      });
    }
  }

  return anomalies;
}

// ============================================================================
// Anomaly Classification
// ============================================================================

// IMPORTANT: Recommendations below are AI-generated suggestions only.
// All recommendations require physician review and approval before implementation.
// No recommendation should be acted upon without a licensed physician's authorization.

/**
 * Classify an anomaly by severity and provide clinical context.
 *
 * @param anomaly - The detected anomaly to classify
 * @returns Classification with severity, description, and recommended action
 */
export function classifyAnomaly(anomaly: Anomaly): AnomalyClassification {
  // Already has severity from detection, but we refine with clinical context
  let severity = anomaly.severity;
  let description = anomaly.description;
  let recommendedAction: string | undefined;
  let clinicalSignificance: 'low' | 'moderate' | 'high' = 'moderate';

  if (anomaly.vitalType) {
    switch (anomaly.vitalType) {
      case VitalType.HEART_RATE:
        if (anomaly.observedValue > 130 || anomaly.observedValue < 45) {
          severity = AnomalySeverity.CRITICAL;
          clinicalSignificance = 'high';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Immediate clinical review. Assess for arrhythmia, hemorrhage, or sepsis.';
        } else if (anomaly.observedValue > 110 || anomaly.observedValue < 50) {
          severity = AnomalySeverity.WARNING;
          clinicalSignificance = 'moderate';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Monitor closely. Consider ECG and medication review.';
        } else {
          clinicalSignificance = 'low';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Continue monitoring. Note in chart.';
        }
        break;

      case VitalType.TEMPERATURE:
        if (anomaly.observedValue >= 39.0) {
          severity = AnomalySeverity.CRITICAL;
          clinicalSignificance = 'high';
          recommendedAction = '[AI SUGGESTION - Requires physician order] High fever post-operative: evaluate for surgical site infection, UTI, or pneumonia. Order blood cultures and CBC.';
        } else if (anomaly.observedValue >= 38.0) {
          severity = AnomalySeverity.WARNING;
          clinicalSignificance = 'moderate';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Low-grade fever: monitor trend. Consider wound assessment and urine culture if persistent.';
        } else if (anomaly.observedValue < 35.5) {
          severity = AnomalySeverity.WARNING;
          clinicalSignificance = 'moderate';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Hypothermia noted. Assess for sepsis or metabolic causes.';
        } else {
          clinicalSignificance = 'low';
        }
        break;

      case VitalType.OXYGEN_SATURATION:
        if (anomaly.observedValue < 90) {
          severity = AnomalySeverity.CRITICAL;
          clinicalSignificance = 'high';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Severe hypoxia. Immediate assessment. Consider PE, pneumothorax, or pneumonia. Supplemental O2 and stat ABG.';
        } else if (anomaly.observedValue < 93) {
          severity = AnomalySeverity.WARNING;
          clinicalSignificance = 'high';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Hypoxia detected. Assess respiratory status, encourage incentive spirometry. Consider chest X-ray.';
        } else {
          clinicalSignificance = 'low';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Mild desaturation. Encourage deep breathing exercises.';
        }
        break;

      case VitalType.BLOOD_PRESSURE_SYSTOLIC:
        if (anomaly.observedValue > 180 || anomaly.observedValue < 80) {
          severity = AnomalySeverity.CRITICAL;
          clinicalSignificance = 'high';
          recommendedAction = anomaly.observedValue > 180
            ? '[AI SUGGESTION - Requires physician order] Hypertensive urgency. Assess symptoms, administer antihypertensive, recheck in 30 minutes.'
            : '[AI SUGGESTION - Requires physician order] Hypotension. Assess for hemorrhage, fluid status, or sepsis. IV fluid bolus may be indicated.';
        } else if (anomaly.observedValue > 160 || anomaly.observedValue < 90) {
          severity = AnomalySeverity.WARNING;
          clinicalSignificance = 'moderate';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Blood pressure outside target range. Review medications and fluid balance.';
        } else {
          clinicalSignificance = 'low';
        }
        break;

      case VitalType.PAIN_LEVEL:
        if (anomaly.observedValue >= 8) {
          severity = AnomalySeverity.CRITICAL;
          clinicalSignificance = 'high';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Severe pain. Reassess pain management plan. Consider breakthrough medication and rule out surgical complications.';
        } else if (anomaly.observedValue >= 6) {
          severity = AnomalySeverity.WARNING;
          clinicalSignificance = 'moderate';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Elevated pain. Review analgesic regimen. Assess for new pathology.';
        } else {
          clinicalSignificance = 'low';
        }
        break;

      case VitalType.BLOOD_GLUCOSE:
        if (anomaly.observedValue < 50 || anomaly.observedValue > 350) {
          severity = AnomalySeverity.CRITICAL;
          clinicalSignificance = 'high';
          recommendedAction = anomaly.observedValue < 50
            ? '[AI SUGGESTION - Requires physician order] Severe hypoglycemia. Administer glucose immediately. Assess diabetic medication dosing.'
            : '[AI SUGGESTION - Requires physician order] Severe hyperglycemia. Check for DKA. Insulin correction and hydration.';
        } else if (anomaly.observedValue < 60 || anomaly.observedValue > 250) {
          severity = AnomalySeverity.WARNING;
          clinicalSignificance = 'moderate';
          recommendedAction = '[AI SUGGESTION - Requires physician order] Blood glucose out of range. Review diabetic medications and dietary intake.';
        } else {
          clinicalSignificance = 'low';
        }
        break;

      default:
        clinicalSignificance = anomaly.deviation > 3 ? 'high' : anomaly.deviation > 2 ? 'moderate' : 'low';
    }
  } else {
    // Behavioral anomaly
    clinicalSignificance = anomaly.severity === AnomalySeverity.CRITICAL ? 'high' : 'moderate';
    recommendedAction = '[AI SUGGESTION - Requires physician order] Review patient engagement patterns. Consider outreach or care team notification.';
  }

  return {
    severity,
    description,
    recommendedAction,
    clinicalSignificance,
  };
}

// ============================================================================
// Deduplication
// ============================================================================

/**
 * Deduplicate anomalies: keep the highest severity per unique key.
 */
function deduplicateAnomalies(anomalies: Anomaly[]): Anomaly[] {
  const severityRank: Record<string, number> = {
    [AnomalySeverity.INFO]: 0,
    [AnomalySeverity.WARNING]: 1,
    [AnomalySeverity.CRITICAL]: 2,
  };

  const seen = new Map<string, Anomaly>();
  for (const anomaly of anomalies) {
    const key = `${anomaly.patientId}|${anomaly.timestamp}|${anomaly.vitalType ?? 'behavioral'}`;
    const existing = seen.get(key);
    if (!existing || severityRank[anomaly.severity] > severityRank[existing.severity]) {
      seen.set(key, anomaly);
    }
  }

  return Array.from(seen.values());
}

// ============================================================================
// Realistic Test Data Generator
// ============================================================================

const SURGERY_TYPES = [
  'Total Knee Replacement', 'Total Hip Replacement', 'ACL Reconstruction',
  'Rotator Cuff Repair', 'Spinal Fusion', 'Appendectomy',
  'Cholecystectomy', 'Hernia Repair', 'Cardiac Bypass',
  'Cesarean Section',
] as const;

/** All recognized activity types for behavioral analysis */
export const ACTIVITY_TYPES: ActivityLog['activityType'][] = [
  'medication_taken', 'exercise_completed', 'meal_logged',
  'sleep_logged', 'app_login', 'symptom_reported', 'photo_uploaded',
  'appointment_attended', 'journal_entry', 'mission_completed',
];

/**
 * Generate a realistic vital sign value for a given type, accounting for
 * patient age, post-operative day, and circadian rhythm.
 */
function generateVitalValue(
  vitalType: VitalType,
  rng: () => number,
  age: number,
  dayPostOp: number,
  hourOfDay: number,
): number {
  const range = VITAL_NORMAL_RANGES[vitalType];
  const baseMean = (range.min + range.max) / 2;
  const baseStd = (range.max - range.min) / 6;

  // Age adjustment
  const ageFactor = (age - 50) / 50; // Centered at 50, scaled

  // Post-op day adjustment (more variation early in recovery)
  const postOpFactor = Math.max(0, 1 - dayPostOp / 30);

  // Circadian rhythm (slight HR/BP increase during day)
  const circadianFactor = hourOfDay >= 8 && hourOfDay <= 20 ? 0.05 : -0.05;

  let value: number;
  switch (vitalType) {
    case VitalType.HEART_RATE:
      value = normalRandom(rng,
        baseMean + ageFactor * 5 + postOpFactor * 8 + circadianFactor * 5,
        baseStd + postOpFactor * 3,
      );
      break;

    case VitalType.BLOOD_PRESSURE_SYSTOLIC:
      value = normalRandom(rng,
        baseMean + ageFactor * 10 + circadianFactor * 5,
        baseStd + postOpFactor * 5,
      );
      break;

    case VitalType.BLOOD_PRESSURE_DIASTOLIC:
      value = normalRandom(rng,
        baseMean + ageFactor * 5 + circadianFactor * 3,
        baseStd + postOpFactor * 3,
      );
      break;

    case VitalType.TEMPERATURE:
      // Slightly elevated early post-op
      value = normalRandom(rng,
        baseMean + postOpFactor * 0.3,
        baseStd + postOpFactor * 0.1,
      );
      break;

    case VitalType.OXYGEN_SATURATION:
      // Slightly lower early post-op, especially in older patients
      value = normalRandom(rng,
        baseMean - postOpFactor * 1.5 - Math.max(0, ageFactor) * 1,
        baseStd + postOpFactor * 0.5,
      );
      value = Math.min(100, value);
      break;

    case VitalType.RESPIRATORY_RATE:
      value = normalRandom(rng,
        baseMean + postOpFactor * 2,
        baseStd + postOpFactor * 1,
      );
      break;

    case VitalType.PAIN_LEVEL:
      // Higher early post-op, decreasing over time
      const painBase = 6 * postOpFactor + 1;
      value = normalRandom(rng, painBase, 1.5);
      value = clamp(Math.round(value), 0, 10);
      break;

    case VitalType.BLOOD_GLUCOSE:
      value = normalRandom(rng,
        baseMean + (hourOfDay >= 7 && hourOfDay <= 9 ? -10 : 15),
        baseStd,
      );
      break;

    default:
      value = normalRandom(rng, baseMean, baseStd);
  }

  return Math.round(value * 10) / 10;
}

/**
 * Generate realistic test data for a specified number of patients and days.
 *
 * Generates:
 * - Vital signs readings (multiple types, multiple times per day)
 * - Activity logs (medication, exercise, sleep, etc.)
 * - Injected anomalies at the specified rate
 *
 * Default: 50 patients, 30 days, 4 readings/day, 5% anomaly rate.
 *
 * @param params - Test data generation parameters
 * @returns Complete test data bundle with injected anomalies marked
 */
export function generateTestData(params?: Partial<TestDataParams>): TestDataBundle {
  const config: TestDataParams = {
    patientCount: 50,
    daysPerPatient: 30,
    readingsPerDay: 4,
    anomalyRate: 0.05,
    seed: 12345,
    ...params,
  };

  const rng = createRng(config.seed);
  const patients: TestDataBundle['patients'] = [];
  const vitalReadings: VitalReading[] = [];
  const activityLogs: ActivityLog[] = [];
  const injectedAnomalies: TestDataBundle['injectedAnomalies'] = [];

  const vitalTypes: VitalType[] = [
    VitalType.HEART_RATE,
    VitalType.BLOOD_PRESSURE_SYSTOLIC,
    VitalType.BLOOD_PRESSURE_DIASTOLIC,
    VitalType.TEMPERATURE,
    VitalType.OXYGEN_SATURATION,
    VitalType.RESPIRATORY_RATE,
    VitalType.PAIN_LEVEL,
  ];

  for (let p = 0; p < config.patientCount; p++) {
    const patientId = `patient-${String(p + 1).padStart(3, '0')}`;
    const age = Math.floor(30 + rng() * 50); // 30-79
    const surgeryType = SURGERY_TYPES[Math.floor(rng() * SURGERY_TYPES.length)];
    const daysPostOp = Math.floor(rng() * 14) + 1; // 1-14 days post-op at start

    patients.push({ patientId, age, surgeryType, daysPostOp });

    // Base date: 30 days ago
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - config.daysPerPatient);

    for (let day = 0; day < config.daysPerPatient; day++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(currentDate.getDate() + day);
      const dayPostOp = daysPostOp + day;

      // Generate vital readings at regular intervals throughout the day
      for (let r = 0; r < config.readingsPerDay; r++) {
        const hour = 6 + Math.floor((16 / config.readingsPerDay) * r) + Math.floor(rng() * 2);
        const readingDate = new Date(currentDate);
        readingDate.setHours(hour, Math.floor(rng() * 60), 0, 0);
        const timestamp = readingDate.toISOString();

        for (const vitalType of vitalTypes) {
          let value = generateVitalValue(vitalType, rng, age, dayPostOp, hour);

          // Inject anomaly with configured probability
          const isAnomaly = rng() < config.anomalyRate;
          let anomalyDescription = '';

          if (isAnomaly) {
            const anomalyDirection = rng() < 0.5 ? 'high' : 'low';

            switch (vitalType) {
              case VitalType.HEART_RATE:
                value = anomalyDirection === 'high'
                  ? 110 + rng() * 40 // Tachycardia: 110-150
                  : 40 + rng() * 15; // Bradycardia: 40-55
                anomalyDescription = anomalyDirection === 'high' ? 'Tachycardia' : 'Bradycardia';
                break;

              case VitalType.BLOOD_PRESSURE_SYSTOLIC:
                value = anomalyDirection === 'high'
                  ? 160 + rng() * 40 // Hypertension: 160-200
                  : 70 + rng() * 15; // Hypotension: 70-85
                anomalyDescription = anomalyDirection === 'high' ? 'Hypertensive episode' : 'Hypotensive episode';
                break;

              case VitalType.BLOOD_PRESSURE_DIASTOLIC:
                value = anomalyDirection === 'high'
                  ? 95 + rng() * 25 // High: 95-120
                  : 40 + rng() * 15; // Low: 40-55
                anomalyDescription = anomalyDirection === 'high' ? 'Elevated diastolic' : 'Low diastolic';
                break;

              case VitalType.TEMPERATURE:
                value = anomalyDirection === 'high'
                  ? 38.0 + rng() * 2.0 // Fever: 38-40
                  : 34.5 + rng() * 1.0; // Hypothermia: 34.5-35.5
                anomalyDescription = anomalyDirection === 'high' ? 'Fever' : 'Hypothermia';
                break;

              case VitalType.OXYGEN_SATURATION:
                // SpO2 anomalies are always low
                value = 82 + rng() * 10; // Low: 82-92
                anomalyDescription = 'Hypoxia';
                break;

              case VitalType.RESPIRATORY_RATE:
                value = anomalyDirection === 'high'
                  ? 24 + rng() * 12 // Tachypnea: 24-36
                  : 6 + rng() * 4; // Bradypnea: 6-10
                anomalyDescription = anomalyDirection === 'high' ? 'Tachypnea' : 'Bradypnea';
                break;

              case VitalType.PAIN_LEVEL:
                value = 7 + Math.floor(rng() * 4); // Severe: 7-10
                anomalyDescription = 'Severe pain spike';
                break;
            }

            value = Math.round(value * 10) / 10;

            injectedAnomalies.push({
              patientId,
              timestamp,
              vitalType,
              value,
              description: anomalyDescription,
            });
          }

          vitalReadings.push({
            patientId,
            timestamp,
            vitalType,
            value,
            unit: VITAL_NORMAL_RANGES[vitalType].unit,
          });
        }
      }

      // Generate activity logs for this day
      // Medication (2-4 times per day)
      const medCount = 2 + Math.floor(rng() * 3);
      for (let m = 0; m < medCount; m++) {
        if (rng() < 0.9) { // 90% compliance
          const activityDate = new Date(currentDate);
          activityDate.setHours(7 + m * 5, Math.floor(rng() * 60), 0, 0);
          activityLogs.push({
            patientId,
            timestamp: activityDate.toISOString(),
            activityType: 'medication_taken',
          });
        }
      }

      // Exercise (0-1 times per day, increasing over recovery)
      if (rng() < Math.min(0.8, 0.3 + dayPostOp * 0.02)) {
        const exerciseDate = new Date(currentDate);
        exerciseDate.setHours(10 + Math.floor(rng() * 4), Math.floor(rng() * 60), 0, 0);
        activityLogs.push({
          patientId,
          timestamp: exerciseDate.toISOString(),
          activityType: 'exercise_completed',
          duration: Math.floor(15 + rng() * 30 + dayPostOp * 0.5),
        });
      }

      // Sleep log
      if (rng() < 0.85) {
        const sleepDate = new Date(currentDate);
        sleepDate.setHours(8, 0, 0, 0);
        const sleepHours = normalRandom(rng, 7 - (dayPostOp < 7 ? 1 : 0), 1.2);
        activityLogs.push({
          patientId,
          timestamp: sleepDate.toISOString(),
          activityType: 'sleep_logged',
          value: Math.round(clamp(sleepHours, 2, 12) * 10) / 10,
        });
      }

      // App login (1-3 per day)
      const loginCount = 1 + Math.floor(rng() * 3);
      for (let l = 0; l < loginCount; l++) {
        const loginDate = new Date(currentDate);
        loginDate.setHours(7 + Math.floor(rng() * 14), Math.floor(rng() * 60), 0, 0);
        activityLogs.push({
          patientId,
          timestamp: loginDate.toISOString(),
          activityType: 'app_login',
        });
      }

      // Symptom report (occasional)
      if (rng() < 0.25 + (dayPostOp < 7 ? 0.3 : 0)) {
        const symDate = new Date(currentDate);
        symDate.setHours(9 + Math.floor(rng() * 10), Math.floor(rng() * 60), 0, 0);
        activityLogs.push({
          patientId,
          timestamp: symDate.toISOString(),
          activityType: 'symptom_reported',
          value: Math.round(normalRandom(rng, 4 - dayPostOp * 0.1, 2)),
        });
      }

      // Meal logged
      if (rng() < 0.7) {
        const mealCount = 1 + Math.floor(rng() * 3);
        for (let ml = 0; ml < mealCount; ml++) {
          const mealDate = new Date(currentDate);
          mealDate.setHours(7 + ml * 5 + Math.floor(rng() * 2), Math.floor(rng() * 60), 0, 0);
          activityLogs.push({
            patientId,
            timestamp: mealDate.toISOString(),
            activityType: 'meal_logged',
          });
        }
      }

      // Mission completed
      if (rng() < 0.6) {
        const missionDate = new Date(currentDate);
        missionDate.setHours(11 + Math.floor(rng() * 8), Math.floor(rng() * 60), 0, 0);
        activityLogs.push({
          patientId,
          timestamp: missionDate.toISOString(),
          activityType: 'mission_completed',
        });
      }

      // Journal entry (occasional)
      if (rng() < 0.3) {
        const journalDate = new Date(currentDate);
        journalDate.setHours(19 + Math.floor(rng() * 3), Math.floor(rng() * 60), 0, 0);
        activityLogs.push({
          patientId,
          timestamp: journalDate.toISOString(),
          activityType: 'journal_entry',
        });
      }

      // Photo upload (occasional)
      if (rng() < 0.2) {
        const photoDate = new Date(currentDate);
        photoDate.setHours(10 + Math.floor(rng() * 8), Math.floor(rng() * 60), 0, 0);
        activityLogs.push({
          patientId,
          timestamp: photoDate.toISOString(),
          activityType: 'photo_uploaded',
        });
      }

      // Appointment (rare)
      if (rng() < 0.05) {
        const apptDate = new Date(currentDate);
        apptDate.setHours(9 + Math.floor(rng() * 6), 0, 0, 0);
        activityLogs.push({
          patientId,
          timestamp: apptDate.toISOString(),
          activityType: 'appointment_attended',
        });
      }
    }
  }

  return {
    patients,
    vitalReadings,
    activityLogs,
    injectedAnomalies,
  };
}

// ============================================================================
// Anomaly Detection Engine Class
// ============================================================================

/**
 * Stateful anomaly detection engine that maintains baselines and history
 * for multiple patients.
 */
export class AnomalyDetectionEngine {
  private baselines: Map<string, Baseline> = new Map();
  private anomalyHistory: Map<string, Anomaly[]> = new Map();
  private config: DetectionConfig;

  constructor(config?: Partial<DetectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Learn a baseline for a patient from their initial readings.
   */
  learnBaseline(readings: VitalReading[]): Baseline {
    if (readings.length === 0) {
      throw new Error('Cannot learn baseline from empty readings');
    }
    const baseline = buildBaseline(readings);
    this.baselines.set(baseline.patientId, baseline);
    return baseline;
  }

  /**
   * Update an existing baseline with new readings.
   * Uses exponential moving average to adapt the baseline over time.
   */
  updateBaseline(patientId: string, newReadings: VitalReading[]): Baseline {
    const existingBaseline = this.baselines.get(patientId);
    if (!existingBaseline) {
      return this.learnBaseline(newReadings);
    }

    // Merge: combine recent values and recompute statistics
    const allReadings: VitalReading[] = [];

    // Reconstruct approximate readings from existing baseline's recent values
    for (const [vitalType, vBaseline] of Object.entries(existingBaseline.vitals)) {
      for (const value of vBaseline.recentValues) {
        allReadings.push({
          patientId,
          timestamp: existingBaseline.updatedAt,
          vitalType: vitalType as VitalType,
          value,
          unit: VITAL_NORMAL_RANGES[vitalType as VitalType]?.unit ?? '',
        });
      }
    }

    // Add new readings
    allReadings.push(...newReadings);

    const updated = buildBaseline(allReadings);
    updated.createdAt = existingBaseline.createdAt;
    this.baselines.set(patientId, updated);
    return updated;
  }

  /**
   * Detect vital sign anomalies for a patient.
   */
  detectVitalAnomalies(readings: VitalReading[]): Anomaly[] {
    if (readings.length === 0) return [];
    const patientId = readings[0].patientId;
    const baseline = this.baselines.get(patientId);
    const anomalies = detectVitalSignAnomalies(readings, baseline, this.config);

    // Record in history
    if (!this.anomalyHistory.has(patientId)) {
      this.anomalyHistory.set(patientId, []);
    }
    this.anomalyHistory.get(patientId)!.push(...anomalies);

    // Trim history to last 1000 entries
    const history = this.anomalyHistory.get(patientId)!;
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    return anomalies;
  }

  /**
   * Detect behavioral anomalies for a patient.
   */
  detectBehavioralAnomalies(activities: ActivityLog[]): Anomaly[] {
    const anomalies = detectBehavioralAnomalies(activities);

    if (anomalies.length > 0 && activities.length > 0) {
      const patientId = activities[0].patientId;
      if (!this.anomalyHistory.has(patientId)) {
        this.anomalyHistory.set(patientId, []);
      }
      this.anomalyHistory.get(patientId)!.push(...anomalies);
    }

    return anomalies;
  }

  /**
   * Get the baseline for a patient.
   */
  getBaseline(patientId: string): Baseline | undefined {
    return this.baselines.get(patientId);
  }

  /**
   * Get anomaly history for a patient.
   */
  getAnomalyHistory(patientId: string): Anomaly[] {
    return [...(this.anomalyHistory.get(patientId) ?? [])];
  }

  /**
   * Get summary statistics for detected anomalies.
   */
  getAnomalySummary(patientId: string): {
    totalAnomalies: number;
    bySeverity: Record<AnomalySeverity, number>;
    byType: Record<AnomalyType, number>;
    byVitalType: Record<string, number>;
    mostRecentAnomaly: Anomaly | null;
  } {
    const history = this.anomalyHistory.get(patientId) ?? [];

    const bySeverity: Record<string, number> = {
      [AnomalySeverity.INFO]: 0,
      [AnomalySeverity.WARNING]: 0,
      [AnomalySeverity.CRITICAL]: 0,
    };

    const byType: Record<string, number> = {
      [AnomalyType.Z_SCORE]: 0,
      [AnomalyType.IQR]: 0,
      [AnomalyType.MOVING_AVERAGE]: 0,
      [AnomalyType.MAHALANOBIS]: 0,
      [AnomalyType.TREND]: 0,
      [AnomalyType.BEHAVIORAL]: 0,
    };

    const byVitalType: Record<string, number> = {};

    for (const anomaly of history) {
      bySeverity[anomaly.severity]++;
      byType[anomaly.detectionType]++;
      if (anomaly.vitalType) {
        byVitalType[anomaly.vitalType] = (byVitalType[anomaly.vitalType] ?? 0) + 1;
      }
    }

    return {
      totalAnomalies: history.length,
      bySeverity: bySeverity as Record<AnomalySeverity, number>,
      byType: byType as Record<AnomalyType, number>,
      byVitalType,
      mostRecentAnomaly: history.length > 0 ? history[history.length - 1] : null,
    };
  }

  /**
   * Clear all data for a patient.
   */
  clearPatientData(patientId: string): void {
    this.baselines.delete(patientId);
    this.anomalyHistory.delete(patientId);
  }

  /**
   * Get current detection configuration.
   */
  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  /**
   * Update detection configuration.
   */
  updateConfig(updates: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get all tracked patient IDs.
   */
  getTrackedPatients(): string[] {
    const patientIds = new Set<string>();
    for (const id of this.baselines.keys()) patientIds.add(id);
    for (const id of this.anomalyHistory.keys()) patientIds.add(id);
    return Array.from(patientIds);
  }
}

// ============================================================================
// Singleton & Convenience Exports
// ============================================================================

/** Default singleton instance */
export const anomalyDetectionEngine = new AnomalyDetectionEngine();

/**
 * Create a new AnomalyDetectionEngine instance with custom configuration.
 */
export function createAnomalyDetectionEngine(
  config?: Partial<DetectionConfig>,
): AnomalyDetectionEngine {
  return new AnomalyDetectionEngine(config);
}

/**
 * Get the normal ranges for all vital sign types.
 */
export function getVitalNormalRanges(): Readonly<typeof VITAL_NORMAL_RANGES> {
  return VITAL_NORMAL_RANGES;
}

/**
 * Get the default detection configuration.
 */
export function getDefaultConfig(): DetectionConfig {
  return { ...DEFAULT_CONFIG };
}
