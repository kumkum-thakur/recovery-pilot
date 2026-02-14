/**
 * Patient Clustering Engine for Post-Operative Recovery
 *
 * Implements K-means clustering from scratch to identify patient recovery phenotypes.
 *
 * Features:
 * - K-means clustering implementation (no external dependencies)
 * - Real patient feature vectors (demographics, vitals, labs, recovery metrics)
 * - Silhouette score for cluster quality evaluation
 * - 200+ synthetic realistic patient profiles as training data
 * - Cluster interpretation (recovery phenotypes)
 * - Self-learning: re-clusters as new patient data arrives
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const RecoveryPhenotype = {
  FAST_RECOVERER: 'fast_recoverer',
  STEADY_RECOVERER: 'steady_recoverer',
  STRUGGLING: 'struggling',
  COMPLEX: 'complex',
  UNASSIGNED: 'unassigned',
} as const;
export type RecoveryPhenotype = typeof RecoveryPhenotype[keyof typeof RecoveryPhenotype];

export type PatientFeatureVector = {
  patientId: string;
  // Demographics
  age: number;
  bmi: number;
  comorbidityCount: number;
  // Vitals (most recent)
  heartRate: number;
  systolicBP: number;
  oxygenSaturation: number;
  temperature: number;
  // Lab values
  hemoglobin: number;
  whiteBloodCellCount: number;
  creatinine: number;
  albumin: number;
  // Recovery metrics
  painLevel: number; // 0-10
  mobilityScore: number; // 0-10 (10 = fully mobile)
  woundHealingScore: number; // 0-10 (10 = fully healed)
  medicationAdherence: number; // 0-1
  daysSinceSurgery: number;
  exerciseCompletionRate: number; // 0-1
  sleepQualityScore: number; // 0-10
  appetiteScore: number; // 0-10
  moodScore: number; // 0-10
  functionalIndependence: number; // 0-10
};

export type ClusterResult = {
  clusterId: number;
  centroid: number[];
  patientIds: string[];
  size: number;
  phenotype: RecoveryPhenotype;
  phenotypeDescription: string;
  averageFeatures: Record<string, number>;
};

export type ClusteringResult = {
  clusters: ClusterResult[];
  assignments: Map<string, number>; // patientId -> clusterId
  silhouetteScore: number;
  iterations: number;
  converged: boolean;
  k: number;
  totalPatients: number;
};

export type PatientClusterAssignment = {
  patientId: string;
  clusterId: number;
  phenotype: RecoveryPhenotype;
  distanceToCentroid: number;
  nearestOtherCluster: number;
  silhouetteCoefficient: number;
  recommendations: string[];
};

// ============================================================================
// Feature Names for interpretation
// ============================================================================

const FEATURE_NAMES = [
  'age', 'bmi', 'comorbidity_count', 'heart_rate', 'systolic_bp',
  'oxygen_saturation', 'temperature', 'hemoglobin', 'wbc',
  'creatinine', 'albumin', 'pain_level', 'mobility_score',
  'wound_healing_score', 'medication_adherence', 'days_since_surgery',
  'exercise_completion', 'sleep_quality', 'appetite_score',
  'mood_score', 'functional_independence',
];

// ============================================================================
// Feature Extraction & Normalization
// ============================================================================

function extractFeatures(patient: PatientFeatureVector): number[] {
  return [
    patient.age,
    patient.bmi,
    patient.comorbidityCount,
    patient.heartRate,
    patient.systolicBP,
    patient.oxygenSaturation,
    patient.temperature,
    patient.hemoglobin,
    patient.whiteBloodCellCount,
    patient.creatinine,
    patient.albumin,
    patient.painLevel,
    patient.mobilityScore,
    patient.woundHealingScore,
    patient.medicationAdherence,
    patient.daysSinceSurgery,
    patient.exerciseCompletionRate,
    patient.sleepQualityScore,
    patient.appetiteScore,
    patient.moodScore,
    patient.functionalIndependence,
  ];
}

function computeFeatureStats(data: number[][]): { means: number[]; stds: number[] } {
  const n = data.length;
  const d = data[0].length;
  const means = new Array(d).fill(0);
  const stds = new Array(d).fill(0);

  for (const row of data) {
    for (let j = 0; j < d; j++) {
      means[j] += row[j];
    }
  }
  for (let j = 0; j < d; j++) {
    means[j] /= n;
  }

  for (const row of data) {
    for (let j = 0; j < d; j++) {
      stds[j] += (row[j] - means[j]) ** 2;
    }
  }
  for (let j = 0; j < d; j++) {
    stds[j] = Math.sqrt(stds[j] / n);
    if (stds[j] === 0) stds[j] = 1; // prevent division by zero
  }

  return { means, stds };
}

function normalizeData(data: number[][], means: number[], stds: number[]): number[][] {
  return data.map(row =>
    row.map((val, j) => (val - means[j]) / stds[j])
  );
}

// ============================================================================
// K-Means Clustering
// ============================================================================

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

function initializeCentroidsKMeansPP(data: number[][], k: number, rng: () => number): number[][] {
  const centroids: number[][] = [];
  const n = data.length;

  // Choose first centroid randomly
  centroids.push([...data[Math.floor(rng() * n)]]);

  for (let c = 1; c < k; c++) {
    // Compute distances to nearest centroid
    const distances = data.map(point => {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const d = euclideanDistance(point, centroid);
        if (d < minDist) minDist = d;
      }
      return minDist * minDist; // squared distance
    });

    // Weighted random selection
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let target = rng() * totalDist;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      target -= distances[i];
      if (target <= 0) {
        idx = i;
        break;
      }
    }
    centroids.push([...data[idx]]);
  }

  return centroids;
}

function assignClusters(data: number[][], centroids: number[][]): number[] {
  return data.map(point => {
    let minDist = Infinity;
    let bestCluster = 0;
    for (let c = 0; c < centroids.length; c++) {
      const d = euclideanDistance(point, centroids[c]);
      if (d < minDist) {
        minDist = d;
        bestCluster = c;
      }
    }
    return bestCluster;
  });
}

function updateCentroids(data: number[][], assignments: number[], k: number): number[][] {
  const d = data[0].length;
  const centroids: number[][] = [];
  const counts: number[] = new Array(k).fill(0);
  const sums: number[][] = Array.from({ length: k }, () => new Array(d).fill(0));

  for (let i = 0; i < data.length; i++) {
    const cluster = assignments[i];
    counts[cluster]++;
    for (let j = 0; j < d; j++) {
      sums[cluster][j] += data[i][j];
    }
  }

  for (let c = 0; c < k; c++) {
    if (counts[c] === 0) {
      centroids.push(data[Math.floor(Math.random() * data.length)].slice());
    } else {
      centroids.push(sums[c].map(s => s / counts[c]));
    }
  }

  return centroids;
}

function kMeans(data: number[][], k: number, maxIterations: number = 100, rng?: () => number): {
  assignments: number[];
  centroids: number[][];
  iterations: number;
  converged: boolean;
} {
  const rngFn = rng ?? (() => Math.random());
  let centroids = initializeCentroidsKMeansPP(data, k, rngFn);
  let assignments = assignClusters(data, centroids);
  let converged = false;
  let iterations = 0;

  for (iterations = 0; iterations < maxIterations; iterations++) {
    const newCentroids = updateCentroids(data, assignments, k);
    const newAssignments = assignClusters(data, newCentroids);

    // Check convergence
    let changed = false;
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i] !== newAssignments[i]) {
        changed = true;
        break;
      }
    }

    centroids = newCentroids;
    assignments = newAssignments;

    if (!changed) {
      converged = true;
      break;
    }
  }

  return { assignments, centroids, iterations, converged };
}

// ============================================================================
// Silhouette Score
// ============================================================================

function computeSilhouetteScore(data: number[][], assignments: number[], k: number): number {
  const n = data.length;
  if (n < 2 || k < 2) return 0;

  let totalSilhouette = 0;

  for (let i = 0; i < n; i++) {
    const myCluster = assignments[i];

    // a(i): average distance to points in same cluster
    let aSum = 0;
    let aCount = 0;
    for (let j = 0; j < n; j++) {
      if (j !== i && assignments[j] === myCluster) {
        aSum += euclideanDistance(data[i], data[j]);
        aCount++;
      }
    }
    const a = aCount > 0 ? aSum / aCount : 0;

    // b(i): minimum average distance to points in any other cluster
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === myCluster) continue;
      let bSum = 0;
      let bCount = 0;
      for (let j = 0; j < n; j++) {
        if (assignments[j] === c) {
          bSum += euclideanDistance(data[i], data[j]);
          bCount++;
        }
      }
      if (bCount > 0) {
        const avgDist = bSum / bCount;
        if (avgDist < b) b = avgDist;
      }
    }

    if (b === Infinity) b = 0;

    const silhouette = Math.max(a, b) > 0 ? (b - a) / Math.max(a, b) : 0;
    totalSilhouette += silhouette;
  }

  return totalSilhouette / n;
}

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

function generateSyntheticDataset(): PatientFeatureVector[] {
  const rng = createSeededRNG(77);
  const patients: PatientFeatureVector[] = [];

  // Generate 4 clusters of patients

  // Cluster 1: Fast recoverers (young, healthy, high compliance)
  for (let i = 0; i < 55; i++) {
    patients.push({
      patientId: `fast-${String(i).padStart(3, '0')}`,
      age: 35 + rng() * 20,
      bmi: 20 + rng() * 8,
      comorbidityCount: Math.floor(rng() * 2),
      heartRate: 60 + rng() * 20,
      systolicBP: 110 + rng() * 20,
      oxygenSaturation: 96 + rng() * 4,
      temperature: 36.5 + rng() * 0.8,
      hemoglobin: 12 + rng() * 4,
      whiteBloodCellCount: 5 + rng() * 5,
      creatinine: 0.7 + rng() * 0.4,
      albumin: 3.5 + rng() * 1,
      painLevel: rng() * 3,
      mobilityScore: 7 + rng() * 3,
      woundHealingScore: 7 + rng() * 3,
      medicationAdherence: 0.85 + rng() * 0.15,
      daysSinceSurgery: 3 + rng() * 14,
      exerciseCompletionRate: 0.8 + rng() * 0.2,
      sleepQualityScore: 7 + rng() * 3,
      appetiteScore: 7 + rng() * 3,
      moodScore: 7 + rng() * 3,
      functionalIndependence: 7 + rng() * 3,
    });
  }

  // Cluster 2: Steady recoverers (middle-aged, some comorbidities, adequate compliance)
  for (let i = 0; i < 60; i++) {
    patients.push({
      patientId: `steady-${String(i).padStart(3, '0')}`,
      age: 50 + rng() * 20,
      bmi: 24 + rng() * 10,
      comorbidityCount: 1 + Math.floor(rng() * 3),
      heartRate: 65 + rng() * 25,
      systolicBP: 120 + rng() * 25,
      oxygenSaturation: 94 + rng() * 5,
      temperature: 36.5 + rng() * 1,
      hemoglobin: 11 + rng() * 4,
      whiteBloodCellCount: 5 + rng() * 7,
      creatinine: 0.8 + rng() * 0.6,
      albumin: 3.0 + rng() * 1.2,
      painLevel: 2 + rng() * 4,
      mobilityScore: 4 + rng() * 4,
      woundHealingScore: 5 + rng() * 3,
      medicationAdherence: 0.65 + rng() * 0.25,
      daysSinceSurgery: 5 + rng() * 21,
      exerciseCompletionRate: 0.5 + rng() * 0.35,
      sleepQualityScore: 5 + rng() * 3,
      appetiteScore: 5 + rng() * 4,
      moodScore: 5 + rng() * 3,
      functionalIndependence: 4 + rng() * 4,
    });
  }

  // Cluster 3: Struggling (older, multiple comorbidities, poor metrics)
  for (let i = 0; i < 50; i++) {
    patients.push({
      patientId: `struggle-${String(i).padStart(3, '0')}`,
      age: 65 + rng() * 20,
      bmi: 28 + rng() * 14,
      comorbidityCount: 3 + Math.floor(rng() * 5),
      heartRate: 75 + rng() * 30,
      systolicBP: 130 + rng() * 35,
      oxygenSaturation: 90 + rng() * 6,
      temperature: 36.8 + rng() * 1.5,
      hemoglobin: 9 + rng() * 3,
      whiteBloodCellCount: 7 + rng() * 10,
      creatinine: 1.0 + rng() * 1.5,
      albumin: 2.5 + rng() * 1,
      painLevel: 5 + rng() * 5,
      mobilityScore: 1 + rng() * 4,
      woundHealingScore: 2 + rng() * 4,
      medicationAdherence: 0.3 + rng() * 0.4,
      daysSinceSurgery: 7 + rng() * 28,
      exerciseCompletionRate: 0.1 + rng() * 0.4,
      sleepQualityScore: 2 + rng() * 4,
      appetiteScore: 2 + rng() * 4,
      moodScore: 2 + rng() * 4,
      functionalIndependence: 1 + rng() * 4,
    });
  }

  // Cluster 4: Complex (mixed - good in some areas, poor in others)
  for (let i = 0; i < 45; i++) {
    patients.push({
      patientId: `complex-${String(i).padStart(3, '0')}`,
      age: 45 + rng() * 30,
      bmi: 22 + rng() * 16,
      comorbidityCount: 2 + Math.floor(rng() * 4),
      heartRate: 70 + rng() * 25,
      systolicBP: 115 + rng() * 35,
      oxygenSaturation: 92 + rng() * 7,
      temperature: 36.5 + rng() * 1.5,
      hemoglobin: 10 + rng() * 5,
      whiteBloodCellCount: 6 + rng() * 8,
      creatinine: 0.9 + rng() * 1,
      albumin: 2.8 + rng() * 1.5,
      painLevel: 3 + rng() * 6,
      mobilityScore: 3 + rng() * 5,
      woundHealingScore: 3 + rng() * 5,
      medicationAdherence: 0.5 + rng() * 0.4,
      daysSinceSurgery: 4 + rng() * 25,
      exerciseCompletionRate: 0.3 + rng() * 0.5,
      sleepQualityScore: 3 + rng() * 5,
      appetiteScore: 4 + rng() * 5,
      moodScore: 3 + rng() * 5,
      functionalIndependence: 3 + rng() * 5,
    });
  }

  return patients;
}

// ============================================================================
// Cluster Interpretation
// ============================================================================

function interpretClusters(
  centroids: number[][],
  assignments: number[],
  patients: PatientFeatureVector[],
  means: number[],
  stds: number[]
): ClusterResult[] {
  const k = centroids.length;
  const results: ClusterResult[] = [];

  for (let c = 0; c < k; c++) {
    const clusterPatients = patients.filter((_, i) => assignments[i] === c);
    const patientIds = clusterPatients.map(p => p.patientId);

    // Denormalize centroid for interpretation
    const denormalized = centroids[c].map((val, j) => val * stds[j] + means[j]);

    const avgFeatures: Record<string, number> = {};
    for (let j = 0; j < FEATURE_NAMES.length; j++) {
      avgFeatures[FEATURE_NAMES[j]] = denormalized[j];
    }

    // Determine phenotype based on centroid characteristics
    const painLevel = denormalized[11];
    const mobilityScore = denormalized[12];
    const adherence = denormalized[14];
    const funcIndep = denormalized[20];
    const comorbidities = denormalized[2];

    let phenotype: RecoveryPhenotype;
    let description: string;

    if (mobilityScore > 6.5 && funcIndep > 6.5 && painLevel < 4 && adherence > 0.75) {
      phenotype = RecoveryPhenotype.FAST_RECOVERER;
      description = 'Young, healthy patients with excellent recovery metrics. High mobility, low pain, good adherence. Expected to meet recovery milestones ahead of schedule.';
    } else if (mobilityScore > 3.5 && funcIndep > 3.5 && painLevel < 7 && comorbidities < 4) {
      phenotype = RecoveryPhenotype.STEADY_RECOVERER;
      description = 'Patients progressing at expected pace. Moderate comorbidities but adequate functional status. May need encouragement but generally on track.';
    } else if (mobilityScore < 3.5 && funcIndep < 4 && painLevel > 5) {
      phenotype = RecoveryPhenotype.STRUGGLING;
      description = 'Patients with significant recovery challenges. High pain, low mobility, often elderly with multiple comorbidities. Require intensive support and monitoring.';
    } else {
      phenotype = RecoveryPhenotype.COMPLEX;
      description = 'Patients with mixed recovery patterns. May excel in some areas but struggle in others. Require individualized care plans addressing specific deficits.';
    }

    results.push({
      clusterId: c,
      centroid: denormalized,
      patientIds,
      size: patientIds.length,
      phenotype,
      phenotypeDescription: description,
      averageFeatures: avgFeatures,
    });
  }

  return results;
}

// ============================================================================
// Storage
// ============================================================================

const STORAGE_PREFIX = 'recovery_pilot_pce_';
const STORAGE_KEYS = {
  CENTROIDS: `${STORAGE_PREFIX}centroids`,
  FEATURE_STATS: `${STORAGE_PREFIX}feature_stats`,
  NEW_PATIENTS: `${STORAGE_PREFIX}new_patients`,
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
// PatientClusteringEngine Class
// ============================================================================

export class PatientClusteringEngine {
  private syntheticData: PatientFeatureVector[];
  private newPatients: PatientFeatureVector[];
  private lastResult: ClusteringResult | null;
  private featureStats: { means: number[]; stds: number[] } | null;
  private storedCentroids: number[][] | null;

  constructor() {
    this.syntheticData = generateSyntheticDataset();
    this.newPatients = loadFromStorage<PatientFeatureVector[]>(STORAGE_KEYS.NEW_PATIENTS, []);
    this.lastResult = null;
    this.featureStats = loadFromStorage<{ means: number[]; stds: number[] } | null>(STORAGE_KEYS.FEATURE_STATS, null);
    this.storedCentroids = loadFromStorage<number[][] | null>(STORAGE_KEYS.CENTROIDS, null);
  }

  /**
   * Run K-means clustering on all available data
   */
  cluster(k: number = 4, maxIterations: number = 100): ClusteringResult {
    const allPatients = [...this.syntheticData, ...this.newPatients];
    const rawData = allPatients.map(p => extractFeatures(p));

    // Normalize
    const stats = computeFeatureStats(rawData);
    this.featureStats = stats;
    const normalizedData = normalizeData(rawData, stats.means, stats.stds);

    // Run K-means
    const rng = createSeededRNG(42);
    const { assignments, centroids, iterations, converged } = kMeans(normalizedData, k, maxIterations, rng);

    // Compute silhouette score (on a sample for performance)
    const sampleSize = Math.min(100, normalizedData.length);
    const sampleIndices = Array.from({ length: sampleSize }, (_, i) => i);
    const sampleData = sampleIndices.map(i => normalizedData[i]);
    const sampleAssignments = sampleIndices.map(i => assignments[i]);
    const silhouetteScore = computeSilhouetteScore(sampleData, sampleAssignments, k);

    // Interpret clusters
    const clusters = interpretClusters(centroids, assignments, allPatients, stats.means, stats.stds);

    // Build assignment map
    const assignmentMap = new Map<string, number>();
    for (let i = 0; i < allPatients.length; i++) {
      assignmentMap.set(allPatients[i].patientId, assignments[i]);
    }

    this.lastResult = {
      clusters,
      assignments: assignmentMap,
      silhouetteScore,
      iterations,
      converged,
      k,
      totalPatients: allPatients.length,
    };

    this.storedCentroids = centroids;
    this.persistState();

    return this.lastResult;
  }

  /**
   * Assign a single patient to the nearest cluster
   */
  assignPatient(patient: PatientFeatureVector): PatientClusterAssignment {
    if (!this.lastResult || !this.featureStats || !this.storedCentroids) {
      this.cluster();
    }

    const features = extractFeatures(patient);
    const normalized = features.map((val, j) => (val - this.featureStats!.means[j]) / this.featureStats!.stds[j]);

    // Find nearest cluster
    let minDist = Infinity;
    let bestCluster = 0;
    let nearestOtherCluster = 0;
    let secondMinDist = Infinity;

    for (let c = 0; c < this.storedCentroids!.length; c++) {
      const d = euclideanDistance(normalized, this.storedCentroids![c]);
      if (d < minDist) {
        secondMinDist = minDist;
        nearestOtherCluster = bestCluster;
        minDist = d;
        bestCluster = c;
      } else if (d < secondMinDist) {
        secondMinDist = d;
        nearestOtherCluster = c;
      }
    }

    const silhouetteCoefficient = secondMinDist > 0 ? (secondMinDist - minDist) / Math.max(minDist, secondMinDist) : 0;

    const cluster = this.lastResult!.clusters[bestCluster];
    const recommendations = this.generateRecommendations(patient, cluster.phenotype);

    return {
      patientId: patient.patientId,
      clusterId: bestCluster,
      phenotype: cluster.phenotype,
      distanceToCentroid: minDist,
      nearestOtherCluster,
      silhouetteCoefficient,
      recommendations,
    };
  }

  /**
   * Add a new patient to the dataset (self-learning)
   */
  addPatient(patient: PatientFeatureVector): void {
    this.newPatients.push(patient);
    this.persistState();
  }

  /**
   * Re-cluster with all current data (including new patients)
   */
  recluster(k?: number): ClusteringResult {
    return this.cluster(k ?? this.lastResult?.k ?? 4);
  }

  /**
   * Get the synthetic dataset
   */
  getSyntheticDataset(): PatientFeatureVector[] {
    // WARNING: This is SYNTHETIC training data generated algorithmically.
    // It does NOT represent real patients. Do not use for clinical decisions.
    return [...this.syntheticData];
  }

  /**
   * Get the last clustering result
   */
  getLastResult(): ClusteringResult | null {
    return this.lastResult;
  }

  /**
   * Get new patients added through self-learning
   */
  getNewPatients(): PatientFeatureVector[] {
    return [...this.newPatients];
  }

  /**
   * Get feature importance for cluster separation
   */
  getFeatureImportance(): Array<{ feature: string; variance: number }> {
    if (!this.lastResult || !this.storedCentroids) return [];

    const centroids = this.storedCentroids;
    const k = centroids.length;
    const d = centroids[0].length;

    // Compute variance of each feature across centroids
    const importance: Array<{ feature: string; variance: number }> = [];

    for (let j = 0; j < d; j++) {
      const values = centroids.map(c => c[j]);
      const mean = values.reduce((a, b) => a + b, 0) / k;
      const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / k;

      importance.push({ feature: FEATURE_NAMES[j] ?? `feature_${j}`, variance });
    }

    importance.sort((a, b) => b.variance - a.variance);
    return importance;
  }

  /**
   * Compute optimal k using elbow method
   */
  findOptimalK(minK: number = 2, maxK: number = 8): Array<{ k: number; silhouette: number; inertia: number }> {
    const allPatients = [...this.syntheticData, ...this.newPatients];
    const rawData = allPatients.map(p => extractFeatures(p));
    const stats = computeFeatureStats(rawData);
    const normalizedData = normalizeData(rawData, stats.means, stats.stds);

    const results: Array<{ k: number; silhouette: number; inertia: number }> = [];

    for (let k = minK; k <= maxK; k++) {
      const rng = createSeededRNG(42);
      const { assignments, centroids } = kMeans(normalizedData, k, 50, rng);

      // Compute inertia (sum of squared distances to centroids)
      let inertia = 0;
      for (let i = 0; i < normalizedData.length; i++) {
        inertia += euclideanDistance(normalizedData[i], centroids[assignments[i]]) ** 2;
      }

      const sampleSize = Math.min(80, normalizedData.length);
      const sampleData = normalizedData.slice(0, sampleSize);
      const sampleAssignments = assignments.slice(0, sampleSize);
      const silhouette = computeSilhouetteScore(sampleData, sampleAssignments, k);

      results.push({ k, silhouette, inertia });
    }

    return results;
  }

  /**
   * Reset all new patient data
   */
  resetNewPatients(): void {
    this.newPatients = [];
    this.lastResult = null;
    this.storedCentroids = null;
    this.featureStats = null;
    this.persistState();
  }

  private generateRecommendations(patient: PatientFeatureVector, phenotype: RecoveryPhenotype): string[] {
    const recs: string[] = [];

    switch (phenotype) {
      case RecoveryPhenotype.FAST_RECOVERER:
        recs.push('Continue current recovery plan - patient on track for early milestones');
        if (patient.exerciseCompletionRate > 0.9) {
          recs.push('Consider advancing physical therapy goals');
        }
        recs.push('Monitor for overexertion; ensure adequate rest periods');
        break;

      case RecoveryPhenotype.STEADY_RECOVERER:
        recs.push('Standard recovery protocol with regular milestone monitoring');
        if (patient.painLevel > 4) recs.push('Optimize pain management to support rehabilitation');
        if (patient.medicationAdherence < 0.8) recs.push('Address medication adherence with reminders');
        recs.push('Encourage consistent exercise and mobility activities');
        break;

      case RecoveryPhenotype.STRUGGLING:
        recs.push('Intensive recovery support protocol');
        if (patient.painLevel > 6) recs.push('Urgent pain management review needed');
        if (patient.mobilityScore < 3) recs.push('Physical therapy intensification; consider assistive devices');
        if (patient.moodScore < 4) recs.push('Screen for post-operative depression; consider mental health referral');
        if (patient.albumin < 3.0) recs.push('Nutritional supplementation for wound healing support');
        recs.push('Increase follow-up frequency to twice weekly');
        break;

      case RecoveryPhenotype.COMPLEX:
        recs.push('Individualized care plan addressing specific deficits');
        if (patient.woundHealingScore < 4) recs.push('Wound care specialist consultation');
        if (patient.medicationAdherence < 0.6) recs.push('Comprehensive medication management review');
        if (patient.sleepQualityScore < 4) recs.push('Sleep hygiene assessment and intervention');
        recs.push('Multidisciplinary team review recommended');
        break;

      default:
        recs.push('Standard post-operative follow-up protocol');
    }

    return recs;
  }

  private persistState(): void {
    saveToStorage(STORAGE_KEYS.NEW_PATIENTS, this.newPatients);
    saveToStorage(STORAGE_KEYS.FEATURE_STATS, this.featureStats);
    saveToStorage(STORAGE_KEYS.CENTROIDS, this.storedCentroids);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createPatientClusteringEngine(): PatientClusteringEngine {
  return new PatientClusteringEngine();
}
