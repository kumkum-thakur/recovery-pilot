import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  TreatmentResponsePredictor,
  createTreatmentResponsePredictor,
  TreatmentCategory,
  ResponseLevel,
  PainTreatmentType,
  AntibioticType,
  PTIntensity,
  WoundCareType,
  type PatientTreatmentProfile,
  type TreatmentInput,
} from '../treatmentResponsePredictor';

function createTestPatient(overrides?: Partial<PatientTreatmentProfile>): PatientTreatmentProfile {
  return {
    patientId: 'test-001',
    age: 55,
    gender: 'male',
    bmi: 26,
    comorbidities: ['hypertension'],
    geneticsProxy: {
      cyp2d6Metabolizer: 'normal',
      opioidSensitivity: 'normal',
      inflammatoryProfile: 'moderate',
      healingCapacity: 'normal',
    },
    priorResponses: [],
    currentPainLevel: 5,
    currentWoundStatus: 5,
    currentMobilityScore: 5,
    infectionPresent: false,
    daysSinceSurgery: 7,
    renalFunction: 90,
    hepaticFunction: 'normal',
    isSmoker: false,
    hasDiabetes: false,
    isImmunosuppressed: false,
    nutritionStatus: 'adequate',
    ...overrides,
  };
}

describe('TreatmentResponsePredictor', () => {
  let predictor: TreatmentResponsePredictor;

  beforeEach(() => {
    localStorage.clear();
    predictor = createTreatmentResponsePredictor();
  });

  // ---- Pain Management Prediction Tests ----

  it('should predict response to opioid pain management', () => {
    const treatment: TreatmentInput = {
      category: TreatmentCategory.PAIN_MANAGEMENT,
      specificType: PainTreatmentType.OPIOID,
    };
    const result = predictor.predict(createTestPatient(), treatment);

    expect(result.responseScore).toBeGreaterThan(0);
    expect(result.responseScore).toBeLessThanOrEqual(1);
    expect(Object.values(ResponseLevel)).toContain(result.predictedResponse);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.riskOfSideEffects).toBeGreaterThan(0);
  });

  it('should predict higher side effect risk for opioids in elderly patient', () => {
    const young = predictor.predict(
      createTestPatient({ age: 35 }),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID }
    );
    const elderly = predictor.predict(
      createTestPatient({ age: 80 }),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID }
    );
    expect(elderly.riskOfSideEffects).toBeGreaterThan(young.riskOfSideEffects);
  });

  it('should predict higher side effect risk for poor CYP2D6 metabolizers on opioids', () => {
    const normal = predictor.predict(
      createTestPatient({ geneticsProxy: { cyp2d6Metabolizer: 'normal', opioidSensitivity: 'normal', inflammatoryProfile: 'moderate', healingCapacity: 'normal' } }),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID }
    );
    const poorMetabolizer = predictor.predict(
      createTestPatient({ geneticsProxy: { cyp2d6Metabolizer: 'poor', opioidSensitivity: 'high', inflammatoryProfile: 'moderate', healingCapacity: 'normal' } }),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID }
    );
    expect(poorMetabolizer.riskOfSideEffects).toBeGreaterThan(normal.riskOfSideEffects);
  });

  it('should provide expected time to effect for nerve block', () => {
    const result = predictor.predict(
      createTestPatient(),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.NERVE_BLOCK }
    );
    expect(result.expectedTimeToEffect).toContain('minute');
  });

  // ---- Antibiotics Prediction Tests ----

  it('should predict response to antibiotics', () => {
    const result = predictor.predict(
      createTestPatient({ infectionPresent: true }),
      { category: TreatmentCategory.ANTIBIOTICS, specificType: AntibioticType.CEPHALOSPORIN }
    );
    expect(result.responseScore).toBeGreaterThan(0);
    expect(result.predictedResponse).toBeDefined();
    expect(result.expectedTimeToEffect).toContain('48-72 hours');
  });

  it('should predict lower response for immunosuppressed patient on antibiotics', () => {
    const normal = predictor.predict(
      createTestPatient({ infectionPresent: true }),
      { category: TreatmentCategory.ANTIBIOTICS, specificType: AntibioticType.CEPHALOSPORIN }
    );
    const immunosuppressed = predictor.predict(
      createTestPatient({ infectionPresent: true, isImmunosuppressed: true }),
      { category: TreatmentCategory.ANTIBIOTICS, specificType: AntibioticType.CEPHALOSPORIN }
    );
    expect(immunosuppressed.responseScore).toBeLessThan(normal.responseScore);
  });

  // ---- Physical Therapy Prediction Tests ----

  it('should predict response to physical therapy', () => {
    const result = predictor.predict(
      createTestPatient({ currentMobilityScore: 4 }),
      { category: TreatmentCategory.PHYSICAL_THERAPY, specificType: PTIntensity.MODERATE }
    );
    expect(result.responseScore).toBeGreaterThan(0);
    expect(result.expectedTimeToEffect).toContain('week');
  });

  it('should predict better PT response for patient with higher mobility baseline', () => {
    const lowMobility = predictor.predict(
      createTestPatient({ currentMobilityScore: 1 }),
      { category: TreatmentCategory.PHYSICAL_THERAPY, specificType: PTIntensity.MODERATE }
    );
    const highMobility = predictor.predict(
      createTestPatient({ currentMobilityScore: 7 }),
      { category: TreatmentCategory.PHYSICAL_THERAPY, specificType: PTIntensity.MODERATE }
    );
    expect(highMobility.responseScore).toBeGreaterThan(lowMobility.responseScore);
  });

  // ---- Wound Care Prediction Tests ----

  it('should predict response to wound care', () => {
    const result = predictor.predict(
      createTestPatient({ currentWoundStatus: 3 }),
      { category: TreatmentCategory.WOUND_CARE, specificType: WoundCareType.NEGATIVE_PRESSURE }
    );
    expect(result.responseScore).toBeGreaterThan(0);
    expect(result.predictedResponse).toBeDefined();
  });

  it('should predict lower wound care response for diabetic smoker', () => {
    const healthy = predictor.predict(
      createTestPatient({ hasDiabetes: false, isSmoker: false }),
      { category: TreatmentCategory.WOUND_CARE, specificType: WoundCareType.STANDARD_DRESSING }
    );
    const compromised = predictor.predict(
      createTestPatient({ hasDiabetes: true, isSmoker: true, geneticsProxy: { cyp2d6Metabolizer: 'normal', opioidSensitivity: 'normal', inflammatoryProfile: 'high', healingCapacity: 'poor' } }),
      { category: TreatmentCategory.WOUND_CARE, specificType: WoundCareType.STANDARD_DRESSING }
    );
    expect(compromised.responseScore).toBeLessThan(healthy.responseScore);
  });

  // ---- Confidence Interval Tests ----

  it('should produce valid confidence intervals', () => {
    const result = predictor.predict(
      createTestPatient(),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.MULTIMODAL }
    );
    expect(result.confidenceInterval.lower).toBeLessThanOrEqual(result.responseScore);
    expect(result.confidenceInterval.upper).toBeGreaterThanOrEqual(result.responseScore);
    expect(result.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
    expect(result.confidenceInterval.upper).toBeLessThanOrEqual(1);
  });

  // ---- Alternative Treatment Tests ----

  it('should provide alternative treatments', () => {
    const result = predictor.predict(
      createTestPatient(),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID }
    );
    expect(result.alternativeTreatments.length).toBeGreaterThan(0);
    for (const alt of result.alternativeTreatments) {
      expect(alt.responseScore).toBeGreaterThanOrEqual(0);
      expect(alt.responseScore).toBeLessThanOrEqual(1);
      expect(Object.values(ResponseLevel)).toContain(alt.predictedResponse);
    }
  });

  it('should rank alternative treatments by score', () => {
    const result = predictor.predict(
      createTestPatient(),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.NSAID }
    );
    for (let i = 1; i < result.alternativeTreatments.length; i++) {
      expect(result.alternativeTreatments[i - 1].responseScore)
        .toBeGreaterThanOrEqual(result.alternativeTreatments[i].responseScore);
    }
  });

  // ---- Explanation Tests ----

  it('should generate meaningful explanation', () => {
    const result = predictor.predict(
      createTestPatient(),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID }
    );
    expect(result.explanation.length).toBeGreaterThan(20);
    expect(result.explanation).toContain('Predicted');
  });

  // ---- Prior Response Influence Tests ----

  it('should consider prior good responses', () => {
    const noPrior = predictor.predict(
      createTestPatient({ priorResponses: [] }),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.MULTIMODAL }
    );
    const withGoodPrior = predictor.predict(
      createTestPatient({
        priorResponses: [
          { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.MULTIMODAL, responseLevel: ResponseLevel.EXCELLENT, sideEffects: false },
          { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.MULTIMODAL, responseLevel: ResponseLevel.GOOD, sideEffects: false },
        ],
      }),
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.MULTIMODAL }
    );
    expect(withGoodPrior.responseScore).toBeGreaterThanOrEqual(noPrior.responseScore);
  });

  // ---- Self-Learning Tests ----

  it('should record treatment outcomes', () => {
    predictor.recordOutcome(
      'test-001',
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID },
      0.6,
      ResponseLevel.GOOD,
      false
    );
    const log = predictor.getOutcomeLog();
    expect(log.length).toBe(1);
    expect(log[0].actualResponseLevel).toBe(ResponseLevel.GOOD);
  });

  it('should update model adjustments based on outcomes', () => {
    // Record multiple outcomes where model underpredicts
    for (let i = 0; i < 5; i++) {
      predictor.recordOutcome(
        `p-${i}`,
        { category: TreatmentCategory.ANTIBIOTICS, specificType: AntibioticType.CEPHALOSPORIN },
        0.4, // predicted low
        ResponseLevel.EXCELLENT, // actually excellent
        false
      );
    }

    const adjustments = predictor.getModelAdjustments();
    const key = `${TreatmentCategory.ANTIBIOTICS}:${AntibioticType.CEPHALOSPORIN}`;
    expect(adjustments.has(key)).toBe(true);
    expect(adjustments.get(key)!).toBeGreaterThan(0); // should adjust upward
  });

  it('should improve predictions after learning from outcomes', () => {
    const treatment: TreatmentInput = {
      category: TreatmentCategory.WOUND_CARE,
      specificType: WoundCareType.NEGATIVE_PRESSURE,
    };
    const patient = createTestPatient();

    const initial = predictor.predict(patient, treatment);

    // Record outcomes showing treatment works better than predicted
    for (let i = 0; i < 8; i++) {
      predictor.recordOutcome(
        `p-${i}`,
        treatment,
        initial.responseScore,
        ResponseLevel.EXCELLENT,
        false
      );
    }

    const updated = predictor.predict(patient, treatment);
    // Score should be adjusted upward after positive outcomes
    expect(updated.responseScore).toBeGreaterThanOrEqual(initial.responseScore);
  });

  it('should persist outcome log to localStorage', () => {
    predictor.recordOutcome(
      'p1',
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.NSAID },
      0.6,
      ResponseLevel.GOOD,
      false
    );
    const predictor2 = createTreatmentResponsePredictor();
    expect(predictor2.getOutcomeLog().length).toBe(1);
  });

  it('should compute performance metrics from outcome log', () => {
    predictor.recordOutcome('p1', { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID }, 0.7, ResponseLevel.GOOD, false);
    predictor.recordOutcome('p2', { category: TreatmentCategory.ANTIBIOTICS, specificType: AntibioticType.CEPHALOSPORIN }, 0.5, ResponseLevel.MODERATE, false);
    predictor.recordOutcome('p3', { category: TreatmentCategory.PHYSICAL_THERAPY, specificType: PTIntensity.HIGH }, 0.8, ResponseLevel.EXCELLENT, false);

    const metrics = predictor.getPerformanceMetrics();
    expect(metrics.totalPredictions).toBe(3);
    expect(metrics.meanAbsoluteError).toBeGreaterThanOrEqual(0);
    expect(metrics.meanAbsoluteError).toBeLessThan(1);
    expect(metrics.calibrationScore).toBeGreaterThan(0);
  });

  it('should reset learning state', () => {
    predictor.recordOutcome('p1', { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID }, 0.5, ResponseLevel.GOOD, false);
    predictor.resetLearning();
    expect(predictor.getOutcomeLog().length).toBe(0);
    expect(predictor.getModelAdjustments().size).toBe(0);
  });

  // ---- Property-Based Tests ----

  it('should always produce response score between 0 and 1', () => {
    const categories = Object.values(TreatmentCategory);
    const specificTypes: Record<TreatmentCategory, string[]> = {
      [TreatmentCategory.PAIN_MANAGEMENT]: Object.values(PainTreatmentType),
      [TreatmentCategory.ANTIBIOTICS]: Object.values(AntibioticType),
      [TreatmentCategory.PHYSICAL_THERAPY]: Object.values(PTIntensity),
      [TreatmentCategory.WOUND_CARE]: Object.values(WoundCareType),
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...categories),
        fc.integer({ min: 20, max: 90 }),
        fc.float({ min: 18, max: 45, noNaN: true }),
        (category, age, bmi) => {
          const types = specificTypes[category];
          const specificType = types[0];
          const patient = createTestPatient({ age, bmi });
          const result = predictor.predict(patient, { category, specificType });
          return result.responseScore >= 0 && result.responseScore <= 1;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should always produce valid confidence interval', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          TreatmentCategory.PAIN_MANAGEMENT,
          TreatmentCategory.ANTIBIOTICS,
          TreatmentCategory.PHYSICAL_THERAPY,
          TreatmentCategory.WOUND_CARE
        ),
        (category) => {
          const specificTypes: Record<TreatmentCategory, string> = {
            [TreatmentCategory.PAIN_MANAGEMENT]: PainTreatmentType.MULTIMODAL,
            [TreatmentCategory.ANTIBIOTICS]: AntibioticType.CEPHALOSPORIN,
            [TreatmentCategory.PHYSICAL_THERAPY]: PTIntensity.MODERATE,
            [TreatmentCategory.WOUND_CARE]: WoundCareType.STANDARD_DRESSING,
          };
          const result = predictor.predict(
            createTestPatient(),
            { category, specificType: specificTypes[category] }
          );
          return (
            result.confidenceInterval.lower >= 0 &&
            result.confidenceInterval.upper <= 1 &&
            result.confidenceInterval.lower <= result.confidenceInterval.upper
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should always have side effect risk between 0 and 1', () => {
    const treatments: TreatmentInput[] = [
      { category: TreatmentCategory.PAIN_MANAGEMENT, specificType: PainTreatmentType.OPIOID },
      { category: TreatmentCategory.ANTIBIOTICS, specificType: AntibioticType.GLYCOPEPTIDE },
      { category: TreatmentCategory.PHYSICAL_THERAPY, specificType: PTIntensity.INTENSIVE },
      { category: TreatmentCategory.WOUND_CARE, specificType: WoundCareType.ADVANCED_BIOLOGICS },
    ];

    for (const treatment of treatments) {
      const result = predictor.predict(createTestPatient(), treatment);
      expect(result.riskOfSideEffects).toBeGreaterThanOrEqual(0);
      expect(result.riskOfSideEffects).toBeLessThanOrEqual(1);
    }
  });

  // ---- Edge Cases ----

  it('should handle patient with no comorbidities and no prior responses', () => {
    const patient = createTestPatient({ comorbidities: [], priorResponses: [] });
    const result = predictor.predict(patient, {
      category: TreatmentCategory.PAIN_MANAGEMENT,
      specificType: PainTreatmentType.ACETAMINOPHEN,
    });
    expect(result.responseScore).toBeGreaterThan(0);
    expect(result.predictedResponse).toBeDefined();
  });

  it('should handle patient with severe impairments', () => {
    const patient = createTestPatient({
      age: 90,
      renalFunction: 20,
      hepaticFunction: 'severe_impairment',
      comorbidities: ['diabetes', 'chf', 'ckd', 'copd', 'cad', 'afib'],
      isImmunosuppressed: true,
      nutritionStatus: 'poor',
    });
    const result = predictor.predict(patient, {
      category: TreatmentCategory.ANTIBIOTICS,
      specificType: AntibioticType.GLYCOPEPTIDE,
    });
    expect(result.responseScore).toBeGreaterThanOrEqual(0);
    expect(result.riskOfSideEffects).toBeGreaterThan(0.3);
  });
});
