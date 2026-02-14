import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  MedicationAdherencePredictor,
  createMedicationAdherencePredictor,
  AdherenceLevel,
  AdherenceBarrier,
  type PatientMedicationProfile,
  type MMAS8Response,
} from '../medicationAdherencePredictor';

function createTestProfile(overrides?: Partial<PatientMedicationProfile>): PatientMedicationProfile {
  return {
    patientId: 'test-001',
    age: 55,
    gender: 'male',
    numberOfMedications: 4,
    dosesPerDay: 4,
    hasExperiencedSideEffects: false,
    sideEffectSeverity: 0,
    monthlyMedicationCost: 50,
    hasInsuranceCoverage: true,
    healthLiteracyScore: 8,
    depressionScreenScore: 1,
    cognitiveScore: 9,
    hasSocialSupport: true,
    livesAlone: false,
    hasTransportationAccess: true,
    hasSymptoms: true,
    durationOfTherapyMonths: 6,
    hasAutoRefill: true,
    usesPillOrganizer: true,
    hasPharmacistCounseling: true,
    numberOfDailyDoseTimings: 1,
    isNewPrescription: false,
    hasHistoryOfNonadherence: false,
    comorbidityCount: 2,
    employmentStatus: 'employed',
    ...overrides,
  };
}

function createHighAdherenceMMAS8(): MMAS8Response {
  return {
    q1_forgetToTake: false,
    q2_missedLastTwoWeeks: false,
    q3_stoppedFeelWorse: false,
    q4_forgetOnTravel: false,
    q5_tookYesterday: true,
    q6_stoppedFeelBetter: false,
    q7_feelHassled: false,
    q8_difficultyRemembering: 'never',
  };
}

function createLowAdherenceMMAS8(): MMAS8Response {
  return {
    q1_forgetToTake: true,
    q2_missedLastTwoWeeks: true,
    q3_stoppedFeelWorse: true,
    q4_forgetOnTravel: true,
    q5_tookYesterday: false,
    q6_stoppedFeelBetter: true,
    q7_feelHassled: true,
    q8_difficultyRemembering: 'all_the_time',
  };
}

describe('MedicationAdherencePredictor', () => {
  let predictor: MedicationAdherencePredictor;

  beforeEach(() => {
    localStorage.clear();
    predictor = createMedicationAdherencePredictor();
  });

  // ---- MMAS-8 Tests ----

  it('should score perfect adherence as 8 (high)', () => {
    const result = predictor.scoreMMA8(createHighAdherenceMMAS8());
    expect(result.score).toBe(8);
    expect(result.level).toBe(AdherenceLevel.HIGH);
    expect(result.flaggedItems.length).toBe(0);
  });

  it('should score worst adherence as 0 (low)', () => {
    const result = predictor.scoreMMA8(createLowAdherenceMMAS8());
    expect(result.score).toBe(0);
    expect(result.level).toBe(AdherenceLevel.LOW);
    expect(result.flaggedItems.length).toBeGreaterThanOrEqual(7);
  });

  it('should classify medium adherence (score 6-7)', () => {
    const responses: MMAS8Response = {
      ...createHighAdherenceMMAS8(),
      q1_forgetToTake: true,
      q8_difficultyRemembering: 'once_in_a_while',
    };
    const result = predictor.scoreMMA8(responses);
    expect(result.score).toBeGreaterThanOrEqual(6);
    expect(result.score).toBeLessThan(8);
    expect(result.level).toBe(AdherenceLevel.MEDIUM);
  });

  it('should flag specific adherence issues', () => {
    const responses: MMAS8Response = {
      ...createHighAdherenceMMAS8(),
      q3_stoppedFeelWorse: true,
      q6_stoppedFeelBetter: true,
    };
    const result = predictor.scoreMMA8(responses);
    expect(result.flaggedItems.some(f => f.includes('worse'))).toBe(true);
    expect(result.flaggedItems.some(f => f.includes('controlled'))).toBe(true);
  });

  // ---- Random Forest Prediction Tests ----

  it('should predict adherence rate between 0.1 and 1.0', () => {
    const result = predictor.predict(createTestProfile());
    expect(result.predictedAdherenceRate).toBeGreaterThanOrEqual(0.1);
    expect(result.predictedAdherenceRate).toBeLessThanOrEqual(1.0);
  });

  it('should predict higher adherence for ideal profile', () => {
    const ideal = predictor.predict(createTestProfile());
    const problematic = predictor.predict(createTestProfile({
      hasExperiencedSideEffects: true,
      sideEffectSeverity: 8,
      numberOfMedications: 12,
      healthLiteracyScore: 2,
      depressionScreenScore: 5,
      hasHistoryOfNonadherence: true,
      hasAutoRefill: false,
      usesPillOrganizer: false,
      hasInsuranceCoverage: false,
      monthlyMedicationCost: 400,
    }));
    expect(ideal.predictedAdherenceRate).toBeGreaterThan(problematic.predictedAdherenceRate);
  });

  it('should produce 10 tree votes', () => {
    const result = predictor.predict(createTestProfile());
    expect(result.treeVotes.length).toBe(10);
    for (const vote of result.treeVotes) {
      expect([0, 1]).toContain(vote);
    }
  });

  it('should identify barriers for patient with side effects', () => {
    const result = predictor.predict(createTestProfile({
      hasExperiencedSideEffects: true,
      sideEffectSeverity: 7,
    }));
    expect(result.identifiedBarriers.some(b => b.barrier === AdherenceBarrier.SIDE_EFFECTS)).toBe(true);
  });

  it('should identify cost barrier for uninsured patient with high costs', () => {
    const result = predictor.predict(createTestProfile({
      hasInsuranceCoverage: false,
      monthlyMedicationCost: 300,
    }));
    expect(result.identifiedBarriers.some(b => b.barrier === AdherenceBarrier.COST)).toBe(true);
  });

  it('should identify complexity barrier for high pill burden', () => {
    const result = predictor.predict(createTestProfile({
      numberOfMedications: 12,
      numberOfDailyDoseTimings: 4,
    }));
    expect(result.identifiedBarriers.some(b => b.barrier === AdherenceBarrier.COMPLEXITY || b.barrier === AdherenceBarrier.POLYPHARMACY)).toBe(true);
  });

  it('should generate interventions for identified barriers', () => {
    const result = predictor.predict(createTestProfile({
      hasExperiencedSideEffects: true,
      sideEffectSeverity: 7,
      healthLiteracyScore: 3,
    }));
    expect(result.interventions.length).toBeGreaterThan(0);
    expect(result.interventions[0].intervention.length).toBeGreaterThan(10);
  });

  it('should identify depression as a barrier', () => {
    const result = predictor.predict(createTestProfile({ depressionScreenScore: 5 }));
    expect(result.identifiedBarriers.some(b => b.barrier === AdherenceBarrier.DEPRESSION)).toBe(true);
  });

  // ---- Synthetic Dataset Tests ----

  it('should generate 150+ synthetic patient profiles', () => {
    const dataset = predictor.getSyntheticDataset();
    expect(dataset.length).toBeGreaterThanOrEqual(150);
  });

  it('should have realistic adherence rates in synthetic data (0.1-1.0)', () => {
    const dataset = predictor.getSyntheticDataset();
    for (const patient of dataset) {
      expect(patient.actualAdherenceRate).toBeGreaterThanOrEqual(0.1);
      expect(patient.actualAdherenceRate).toBeLessThanOrEqual(1.0);
    }
  });

  it('should have variance in synthetic adherence rates', () => {
    const dataset = predictor.getSyntheticDataset();
    const rates = dataset.map(p => p.actualAdherenceRate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    expect(max - min).toBeGreaterThan(0.3); // meaningful spread
  });

  // ---- Self-Learning Tests ----

  it('should record actual adherence data', () => {
    predictor.recordActualAdherence('test-001', 0.7, 0.6, 'pharmacy_refill');
    const log = predictor.getOutcomeLog();
    expect(log.length).toBe(1);
    expect(log[0].actualRate).toBe(0.6);
  });

  it('should update tree weights after sufficient data', () => {
    const initialWeights = predictor.getTreeWeights();

    for (let i = 0; i < 10; i++) {
      predictor.recordActualAdherence(`p-${i}`, 0.8, 0.85, 'pill_count');
    }

    const updatedWeights = predictor.getTreeWeights();
    let changed = false;
    for (let i = 0; i < initialWeights.length; i++) {
      if (Math.abs(initialWeights[i] - updatedWeights[i]) > 0.001) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it('should persist outcome log to localStorage', () => {
    predictor.recordActualAdherence('p1', 0.7, 0.6, 'refill');
    const predictor2 = createMedicationAdherencePredictor();
    expect(predictor2.getOutcomeLog().length).toBe(1);
  });

  it('should compute performance metrics from outcome log', () => {
    predictor.recordActualAdherence('p1', 0.8, 0.75, 'refill');
    predictor.recordActualAdherence('p2', 0.4, 0.35, 'refill');
    predictor.recordActualAdherence('p3', 0.9, 0.85, 'refill');

    const metrics = predictor.getPerformanceMetrics();
    expect(metrics.totalPredictions).toBe(3);
    expect(metrics.meanAbsoluteError).toBeGreaterThanOrEqual(0);
    expect(metrics.meanAbsoluteError).toBeLessThan(1);
  });

  it('should reset learning state', () => {
    predictor.recordActualAdherence('p1', 0.7, 0.6, 'refill');
    predictor.resetLearning();
    expect(predictor.getOutcomeLog().length).toBe(0);
    const weights = predictor.getTreeWeights();
    for (const w of weights) {
      expect(w).toBe(1.0);
    }
  });

  // ---- Property-Based Tests ----

  it('should always predict adherence rate between 0.1 and 1.0 for any profile', () => {
    fc.assert(
      fc.property(
        fc.record({
          numMeds: fc.integer({ min: 1, max: 20 }),
          seSeverity: fc.float({ min: 0, max: 10, noNaN: true }),
          cost: fc.float({ min: 0, max: 1000, noNaN: true }),
          healthLit: fc.float({ min: 0, max: 10, noNaN: true }),
          depression: fc.integer({ min: 0, max: 6 }),
          cognitive: fc.float({ min: 0, max: 10, noNaN: true }),
          timings: fc.integer({ min: 1, max: 4 }),
        }),
        (data) => {
          const profile = createTestProfile({
            numberOfMedications: data.numMeds,
            sideEffectSeverity: data.seSeverity,
            hasExperiencedSideEffects: data.seSeverity > 0,
            monthlyMedicationCost: data.cost,
            healthLiteracyScore: data.healthLit,
            depressionScreenScore: data.depression,
            cognitiveScore: data.cognitive,
            numberOfDailyDoseTimings: data.timings,
          });
          const result = predictor.predict(profile);
          return result.predictedAdherenceRate >= 0.1 && result.predictedAdherenceRate <= 1.0;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should always have MMAS-8 score between 0 and 8', () => {
    fc.assert(
      fc.property(
        fc.record({
          q1: fc.boolean(),
          q2: fc.boolean(),
          q3: fc.boolean(),
          q4: fc.boolean(),
          q5: fc.boolean(),
          q6: fc.boolean(),
          q7: fc.boolean(),
          q8: fc.constantFrom('never' as const, 'once_in_a_while' as const, 'sometimes' as const, 'usually' as const, 'all_the_time' as const),
        }),
        (data) => {
          const responses: MMAS8Response = {
            q1_forgetToTake: data.q1,
            q2_missedLastTwoWeeks: data.q2,
            q3_stoppedFeelWorse: data.q3,
            q4_forgetOnTravel: data.q4,
            q5_tookYesterday: data.q5,
            q6_stoppedFeelBetter: data.q6,
            q7_feelHassled: data.q7,
            q8_difficultyRemembering: data.q8,
          };
          const result = predictor.scoreMMA8(responses);
          return result.score >= 0 && result.score <= 8;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have non-negative barrier severity', () => {
    const dataset = predictor.getSyntheticDataset();
    for (const patient of dataset.slice(0, 30)) {
      const result = predictor.predict(patient);
      for (const barrier of result.identifiedBarriers) {
        expect(barrier.severity).toBeGreaterThanOrEqual(0);
        expect(barrier.severity).toBeLessThanOrEqual(1);
      }
    }
  });
});
