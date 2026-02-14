import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  PatientClusteringEngine,
  createPatientClusteringEngine,
  RecoveryPhenotype,
  type PatientFeatureVector,
} from '../patientClusteringEngine';

function createTestPatient(overrides?: Partial<PatientFeatureVector>): PatientFeatureVector {
  return {
    patientId: 'test-001',
    age: 55,
    bmi: 26,
    comorbidityCount: 2,
    heartRate: 72,
    systolicBP: 125,
    oxygenSaturation: 97,
    temperature: 37.0,
    hemoglobin: 13,
    whiteBloodCellCount: 7,
    creatinine: 1.0,
    albumin: 3.5,
    painLevel: 4,
    mobilityScore: 6,
    woundHealingScore: 6,
    medicationAdherence: 0.85,
    daysSinceSurgery: 7,
    exerciseCompletionRate: 0.7,
    sleepQualityScore: 6,
    appetiteScore: 7,
    moodScore: 6,
    functionalIndependence: 6,
    ...overrides,
  };
}

describe('PatientClusteringEngine', () => {
  let engine: PatientClusteringEngine;

  beforeEach(() => {
    localStorage.clear();
    engine = createPatientClusteringEngine();
  });

  // ---- Synthetic Dataset Tests ----

  it('should generate 200+ synthetic patient profiles', () => {
    const dataset = engine.getSyntheticDataset();
    expect(dataset.length).toBeGreaterThanOrEqual(200);
  });

  it('should have diverse patient profiles in synthetic data', () => {
    const dataset = engine.getSyntheticDataset();
    const ages = dataset.map(p => p.age);
    expect(Math.min(...ages)).toBeLessThan(40);
    expect(Math.max(...ages)).toBeGreaterThan(70);

    const painLevels = dataset.map(p => p.painLevel);
    expect(Math.max(...painLevels) - Math.min(...painLevels)).toBeGreaterThan(5);
  });

  // ---- K-Means Clustering Tests ----

  it('should perform clustering with k=4', () => {
    const result = engine.cluster(4);
    expect(result.clusters.length).toBe(4);
    expect(result.totalPatients).toBeGreaterThanOrEqual(200);
    expect(result.k).toBe(4);
  });

  it('should converge within max iterations', () => {
    const result = engine.cluster(4, 100);
    expect(result.iterations).toBeLessThanOrEqual(100);
  });

  it('should assign all patients to clusters', () => {
    const result = engine.cluster(4);
    let totalAssigned = 0;
    for (const cluster of result.clusters) {
      totalAssigned += cluster.size;
    }
    expect(totalAssigned).toBe(result.totalPatients);
  });

  it('should produce non-empty clusters', () => {
    const result = engine.cluster(4);
    for (const cluster of result.clusters) {
      expect(cluster.size).toBeGreaterThan(0);
    }
  });

  it('should assign recovery phenotypes to each cluster', () => {
    const result = engine.cluster(4);
    const validPhenotypes = Object.values(RecoveryPhenotype);
    for (const cluster of result.clusters) {
      expect(validPhenotypes).toContain(cluster.phenotype);
      expect(cluster.phenotypeDescription.length).toBeGreaterThan(20);
    }
  });

  // ---- Silhouette Score Tests ----

  it('should compute silhouette score between -1 and 1', () => {
    const result = engine.cluster(4);
    expect(result.silhouetteScore).toBeGreaterThanOrEqual(-1);
    expect(result.silhouetteScore).toBeLessThanOrEqual(1);
  });

  it('should have positive silhouette score (clusters are meaningful)', () => {
    const result = engine.cluster(4);
    expect(result.silhouetteScore).toBeGreaterThan(0);
  });

  // ---- Patient Assignment Tests ----

  it('should assign a new patient to the nearest cluster', () => {
    engine.cluster(4);
    const assignment = engine.assignPatient(createTestPatient());

    expect(assignment.clusterId).toBeGreaterThanOrEqual(0);
    expect(assignment.clusterId).toBeLessThan(4);
    expect(assignment.distanceToCentroid).toBeGreaterThan(0);
    expect(assignment.recommendations.length).toBeGreaterThan(0);
  });

  it('should assign fast-recovering patient to appropriate cluster', () => {
    engine.cluster(4);
    const fastPatient = createTestPatient({
      patientId: 'fast-test',
      age: 35,
      bmi: 23,
      comorbidityCount: 0,
      painLevel: 1,
      mobilityScore: 9,
      woundHealingScore: 9,
      medicationAdherence: 0.95,
      exerciseCompletionRate: 0.95,
      functionalIndependence: 9,
      moodScore: 9,
    });

    const assignment = engine.assignPatient(fastPatient);
    expect([RecoveryPhenotype.FAST_RECOVERER, RecoveryPhenotype.STEADY_RECOVERER]).toContain(assignment.phenotype);
  });

  it('should assign struggling patient to a different cluster than fast-recovering patient', () => {
    engine.cluster(4);
    const fastPatient = createTestPatient({
      patientId: 'fast-test-2',
      age: 35,
      bmi: 23,
      comorbidityCount: 0,
      painLevel: 1,
      mobilityScore: 9,
      woundHealingScore: 9,
      medicationAdherence: 0.95,
      exerciseCompletionRate: 0.95,
      functionalIndependence: 9,
      moodScore: 9,
    });
    const strugglingPatient = createTestPatient({
      patientId: 'struggle-test',
      age: 80,
      bmi: 35,
      comorbidityCount: 6,
      painLevel: 8,
      mobilityScore: 1,
      woundHealingScore: 2,
      medicationAdherence: 0.3,
      exerciseCompletionRate: 0.1,
      functionalIndependence: 1,
      moodScore: 2,
    });

    const fastAssignment = engine.assignPatient(fastPatient);
    const struggleAssignment = engine.assignPatient(strugglingPatient);
    // They should be in different clusters given their very different profiles
    expect(struggleAssignment.clusterId).not.toBe(fastAssignment.clusterId);
  });

  it('should compute silhouette coefficient for individual patient', () => {
    engine.cluster(4);
    const assignment = engine.assignPatient(createTestPatient());
    expect(assignment.silhouetteCoefficient).toBeGreaterThanOrEqual(-1);
    expect(assignment.silhouetteCoefficient).toBeLessThanOrEqual(1);
  });

  // ---- Self-Learning Tests ----

  it('should add new patients for re-clustering', () => {
    engine.addPatient(createTestPatient({ patientId: 'new-001' }));
    engine.addPatient(createTestPatient({ patientId: 'new-002' }));

    const newPatients = engine.getNewPatients();
    expect(newPatients.length).toBe(2);
  });

  it('should include new patients in re-clustering', () => {
    const initialResult = engine.cluster(4);

    engine.addPatient(createTestPatient({ patientId: 'new-001' }));
    engine.addPatient(createTestPatient({ patientId: 'new-002' }));

    const reclusterResult = engine.recluster();
    expect(reclusterResult.totalPatients).toBe(initialResult.totalPatients + 2);
  });

  it('should persist new patients to localStorage', () => {
    engine.addPatient(createTestPatient({ patientId: 'persist-001' }));
    const engine2 = createPatientClusteringEngine();
    expect(engine2.getNewPatients().length).toBe(1);
  });

  it('should reset new patient data', () => {
    engine.addPatient(createTestPatient({ patientId: 'new-001' }));
    engine.resetNewPatients();
    expect(engine.getNewPatients().length).toBe(0);
  });

  // ---- Feature Importance Tests ----

  it('should compute feature importance for cluster separation', () => {
    engine.cluster(4);
    const importance = engine.getFeatureImportance();
    expect(importance.length).toBeGreaterThan(0);

    // Features should be sorted by variance descending
    for (let i = 1; i < importance.length; i++) {
      expect(importance[i - 1].variance).toBeGreaterThanOrEqual(importance[i].variance);
    }
  });

  // ---- Optimal K Tests ----

  it('should find optimal k using elbow method', () => {
    const results = engine.findOptimalK(2, 6);
    expect(results.length).toBe(5); // k=2,3,4,5,6

    // Inertia should generally decrease with more clusters
    for (let i = 1; i < results.length; i++) {
      expect(results[i].inertia).toBeLessThanOrEqual(results[i - 1].inertia * 1.1); // allowing small tolerance
    }
  });

  it('should have silhouette scores for each k', () => {
    const results = engine.findOptimalK(2, 5);
    for (const result of results) {
      expect(result.silhouette).toBeGreaterThanOrEqual(-1);
      expect(result.silhouette).toBeLessThanOrEqual(1);
    }
  });

  // ---- Clustering with Different k Values ----

  it('should work with k=2', () => {
    const result = engine.cluster(2);
    expect(result.clusters.length).toBe(2);
    expect(result.totalPatients).toBeGreaterThanOrEqual(200);
  });

  it('should work with k=6', () => {
    const result = engine.cluster(6);
    expect(result.clusters.length).toBe(6);
  });

  // ---- Property-Based Tests ----

  it('should always assign patients to valid cluster IDs', () => {
    engine.cluster(4);
    fc.assert(
      fc.property(
        fc.record({
          age: fc.float({ min: 20, max: 95, noNaN: true }),
          painLevel: fc.float({ min: 0, max: 10, noNaN: true }),
          mobilityScore: fc.float({ min: 0, max: 10, noNaN: true }),
          adherence: fc.float({ min: 0, max: 1, noNaN: true }),
        }),
        (data) => {
          const patient = createTestPatient({
            age: data.age,
            painLevel: data.painLevel,
            mobilityScore: data.mobilityScore,
            medicationAdherence: data.adherence,
          });
          const assignment = engine.assignPatient(patient);
          return assignment.clusterId >= 0 && assignment.clusterId < 4;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should have non-negative distance to centroid for any patient', () => {
    engine.cluster(4);
    fc.assert(
      fc.property(
        fc.float({ min: 20, max: 90, noNaN: true }),
        fc.float({ min: 0, max: 10, noNaN: true }),
        (age, pain) => {
          const patient = createTestPatient({ age, painLevel: pain });
          const assignment = engine.assignPatient(patient);
          return assignment.distanceToCentroid >= 0;
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should have cluster centroid with valid average features', () => {
    const result = engine.cluster(4);
    for (const cluster of result.clusters) {
      expect(cluster.averageFeatures.age).toBeGreaterThan(0);
      expect(cluster.averageFeatures.pain_level).toBeGreaterThanOrEqual(0);
      expect(cluster.centroid.length).toBeGreaterThan(0);
    }
  });
});
