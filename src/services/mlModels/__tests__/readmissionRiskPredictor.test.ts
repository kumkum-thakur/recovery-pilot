import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  ReadmissionRiskPredictor,
  createReadmissionRiskPredictor,
  RiskLevel,
  AdmissionType,
  ProcedureType,
  type PatientProfile,
} from '../readmissionRiskPredictor';

function createTestPatient(overrides?: Partial<PatientProfile>): PatientProfile {
  return {
    patientId: 'test-001',
    age: 65,
    gender: 'male',
    hemoglobinAtDischarge: 13.5,
    sodiumAtDischarge: 140,
    hasOncologyDiagnosis: false,
    procedureType: ProcedureType.ORTHOPEDIC,
    admissionType: AdmissionType.ELECTIVE,
    lengthOfStayDays: 3,
    previousAdmissions6Months: 0,
    emergencyVisits6Months: 0,
    charlsonComorbidityIndex: 1,
    comorbidities: ['hypertension'],
    dischargeDisposition: 'home',
    insuranceType: 'private',
    livesAlone: false,
    hasCaregiver: true,
    medicationCount: 5,
    hasFollowUpScheduled: true,
    bmi: 26,
    isSmoker: false,
    hasDiabetes: false,
    hasHeartFailure: false,
    hasCOPD: false,
    hasRenalDisease: false,
    ...overrides,
  };
}

describe('ReadmissionRiskPredictor', () => {
  let predictor: ReadmissionRiskPredictor;

  beforeEach(() => {
    localStorage.clear();
    predictor = createReadmissionRiskPredictor();
  });

  // ---- HOSPITAL Score Tests ----

  it('should compute HOSPITAL score correctly for low-risk patient', () => {
    const patient = createTestPatient({
      hemoglobinAtDischarge: 14,
      sodiumAtDischarge: 140,
      hasOncologyDiagnosis: false,
      admissionType: AdmissionType.ELECTIVE,
      previousAdmissions6Months: 0,
      lengthOfStayDays: 2,
    });
    const result = predictor.computeHOSPITALScore(patient);
    // Procedure = 1 (orthopedic), all others = 0
    expect(result.totalScore).toBeLessThanOrEqual(3);
    expect(result.riskLevel).toBe(RiskLevel.LOW);
  });

  it('should compute HOSPITAL score with all risk factors present', () => {
    const patient = createTestPatient({
      hemoglobinAtDischarge: 10, // +1
      sodiumAtDischarge: 130,   // +1
      hasOncologyDiagnosis: true, // +2
      admissionType: AdmissionType.EMERGENCY, // +1 (index type)
      previousAdmissions6Months: 5, // +2
      lengthOfStayDays: 7,      // +2
      procedureType: ProcedureType.CARDIAC, // +1
    });
    const result = predictor.computeHOSPITALScore(patient);
    expect(result.totalScore).toBeGreaterThanOrEqual(7);
    expect(result.riskLevel).toBe(RiskLevel.VERY_HIGH);
    expect(result.readmissionProbability).toBeGreaterThanOrEqual(0.3);
  });

  it('should correctly score hemoglobin component (threshold at 12)', () => {
    const lowHgb = predictor.computeHOSPITALScore(createTestPatient({ hemoglobinAtDischarge: 11.5 }));
    const normalHgb = predictor.computeHOSPITALScore(createTestPatient({ hemoglobinAtDischarge: 12.5 }));
    expect(lowHgb.components.hemoglobin).toBe(1);
    expect(normalHgb.components.hemoglobin).toBe(0);
  });

  it('should correctly score sodium component (threshold at 135)', () => {
    const lowNa = predictor.computeHOSPITALScore(createTestPatient({ sodiumAtDischarge: 132 }));
    const normalNa = predictor.computeHOSPITALScore(createTestPatient({ sodiumAtDischarge: 138 }));
    expect(lowNa.components.sodium).toBe(1);
    expect(normalNa.components.sodium).toBe(0);
  });

  // ---- LACE Index Tests ----

  it('should compute LACE index correctly for low-risk patient', () => {
    const patient = createTestPatient({
      lengthOfStayDays: 1,
      admissionType: AdmissionType.ELECTIVE,
      charlsonComorbidityIndex: 0,
      emergencyVisits6Months: 0,
    });
    const result = predictor.computeLACEIndex(patient);
    expect(result.totalScore).toBeLessThanOrEqual(2);
    expect(result.riskLevel).toBe(RiskLevel.LOW);
  });

  it('should compute LACE index for high-risk patient', () => {
    const patient = createTestPatient({
      lengthOfStayDays: 14,  // 7 points
      admissionType: AdmissionType.EMERGENCY, // 3 points
      charlsonComorbidityIndex: 5, // 5 points
      emergencyVisits6Months: 4,   // 4 points
    });
    const result = predictor.computeLACEIndex(patient);
    expect(result.totalScore).toBeGreaterThanOrEqual(15);
    expect(result.riskLevel).toBe(RiskLevel.VERY_HIGH);
  });

  it('should correctly score length of stay tiers in LACE', () => {
    const los1 = predictor.computeLACEIndex(createTestPatient({ lengthOfStayDays: 1, admissionType: AdmissionType.ELECTIVE, charlsonComorbidityIndex: 0, emergencyVisits6Months: 0 }));
    const los3 = predictor.computeLACEIndex(createTestPatient({ lengthOfStayDays: 3, admissionType: AdmissionType.ELECTIVE, charlsonComorbidityIndex: 0, emergencyVisits6Months: 0 }));
    const los5 = predictor.computeLACEIndex(createTestPatient({ lengthOfStayDays: 5, admissionType: AdmissionType.ELECTIVE, charlsonComorbidityIndex: 0, emergencyVisits6Months: 0 }));
    const los10 = predictor.computeLACEIndex(createTestPatient({ lengthOfStayDays: 10, admissionType: AdmissionType.ELECTIVE, charlsonComorbidityIndex: 0, emergencyVisits6Months: 0 }));
    const los15 = predictor.computeLACEIndex(createTestPatient({ lengthOfStayDays: 15, admissionType: AdmissionType.ELECTIVE, charlsonComorbidityIndex: 0, emergencyVisits6Months: 0 }));

    expect(los1.components.lengthOfStay).toBe(1);
    expect(los3.components.lengthOfStay).toBe(3);
    expect(los5.components.lengthOfStay).toBe(4);
    expect(los10.components.lengthOfStay).toBe(5);
    expect(los15.components.lengthOfStay).toBe(7);
  });

  it('should correctly score emergency acuity in LACE', () => {
    const emergency = predictor.computeLACEIndex(createTestPatient({ admissionType: AdmissionType.EMERGENCY }));
    const elective = predictor.computeLACEIndex(createTestPatient({ admissionType: AdmissionType.ELECTIVE }));
    expect(emergency.components.acuity).toBe(3);
    expect(elective.components.acuity).toBe(0);
  });

  // ---- Logistic Regression Tests ----

  it('should produce probability between 0 and 1', () => {
    const result = predictor.predictWithLogisticRegression(createTestPatient());
    expect(result.probability).toBeGreaterThanOrEqual(0);
    expect(result.probability).toBeLessThanOrEqual(1);
  });

  it('should identify heart failure as a top risk factor', () => {
    const patient = createTestPatient({
      hasHeartFailure: true,
      hasCOPD: false,
      hasRenalDisease: false,
    });
    const result = predictor.predictWithLogisticRegression(patient);
    const hfFactor = result.topRiskFactors.find(f => f.factor === 'heart_failure');
    expect(hfFactor).toBeDefined();
    expect(hfFactor!.contribution).toBeGreaterThan(0);
  });

  it('should predict higher risk for complex patient', () => {
    const simple = predictor.predictWithLogisticRegression(createTestPatient());
    const complex = predictor.predictWithLogisticRegression(createTestPatient({
      age: 80,
      admissionType: AdmissionType.EMERGENCY,
      charlsonComorbidityIndex: 6,
      hasHeartFailure: true,
      hasDiabetes: true,
      hasRenalDisease: true,
      previousAdmissions6Months: 4,
      livesAlone: true,
      hasCaregiver: false,
      hasFollowUpScheduled: false,
    }));
    expect(complex.probability).toBeGreaterThan(simple.probability);
  });

  // ---- Ensemble Prediction Tests ----

  it('should produce ensemble prediction combining all three models', () => {
    const result = predictor.predict(createTestPatient());
    expect(result.hospitalScore).toBeDefined();
    expect(result.laceIndex).toBeDefined();
    expect(result.logisticRegression).toBeDefined();
    expect(result.ensembleProbability).toBeGreaterThanOrEqual(0);
    expect(result.ensembleProbability).toBeLessThanOrEqual(1);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should generate relevant recommendations', () => {
    const patient = createTestPatient({
      hasFollowUpScheduled: false,
      livesAlone: true,
      hasCaregiver: false,
      hemoglobinAtDischarge: 8,
      medicationCount: 12,
    });
    const result = predictor.predict(patient);
    expect(result.recommendations.some(r => r.includes('follow-up'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('caregiver') || r.includes('home health'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('anemia'))).toBe(true);
  });

  // ---- Synthetic Dataset Tests ----

  it('should generate 200+ synthetic patient profiles', () => {
    const dataset = predictor.getSyntheticDataset();
    expect(dataset.length).toBeGreaterThanOrEqual(200);
  });

  it('should have a mix of readmitted and non-readmitted patients', () => {
    const dataset = predictor.getSyntheticDataset();
    const readmitted = dataset.filter(p => p.wasReadmitted);
    const notReadmitted = dataset.filter(p => !p.wasReadmitted);
    expect(readmitted.length).toBeGreaterThan(10);
    expect(notReadmitted.length).toBeGreaterThan(10);
  });

  it('should generate realistic age distribution (30-85)', () => {
    const dataset = predictor.getSyntheticDataset();
    const ages = dataset.map(p => p.age);
    expect(Math.min(...ages)).toBeGreaterThanOrEqual(30);
    expect(Math.max(...ages)).toBeLessThanOrEqual(85);
  });

  // ---- Self-Learning Tests ----

  it('should update model weights based on outcomes', () => {
    const initialWeights = predictor.getModelWeights();
    const patient = createTestPatient();
    predictor.updateFromPatientOutcome(patient, true);
    const updatedWeights = predictor.getModelWeights();

    // At least some weights should change
    let changed = false;
    for (let i = 0; i < initialWeights.length; i++) {
      if (Math.abs(initialWeights[i] - updatedWeights[i]) > 1e-10) {
        changed = true;
        break;
      }
    }
    expect(changed).toBe(true);
  });

  it('should persist outcome log', () => {
    predictor.recordOutcome('test-001', 0.3, true, 5);
    const predictor2 = createReadmissionRiskPredictor();
    const log = predictor2.getOutcomeLog();
    expect(log.length).toBe(1);
    expect(log[0].actualReadmitted).toBe(true);
  });

  it('should train on synthetic data and report metrics', () => {
    const result = predictor.trainOnSyntheticData(2);
    expect(result.accuracy).toBeGreaterThan(0.4);
    expect(result.finalLoss).toBeGreaterThan(0);
    expect(result.finalLoss).toBeLessThan(5);
  });

  it('should compute performance metrics from outcome log', () => {
    predictor.recordOutcome('p1', 0.8, true, 3);
    predictor.recordOutcome('p2', 0.2, false, null);
    predictor.recordOutcome('p3', 0.7, true, 7);
    predictor.recordOutcome('p4', 0.1, false, null);

    const metrics = predictor.getPerformanceMetrics();
    expect(metrics.totalPredictions).toBe(4);
    expect(metrics.brierScore).toBeGreaterThanOrEqual(0);
    expect(metrics.auc).toBeGreaterThan(0.5); // Better than random since predictions align
  });

  it('should reset model to initial state', () => {
    predictor.recordOutcome('p1', 0.5, true, 3);
    predictor.updateFromPatientOutcome(createTestPatient(), true);
    predictor.resetModel();
    expect(predictor.getOutcomeLog().length).toBe(0);
  });

  // ---- Property-Based Tests ----

  it('should always produce valid probability (0-1) for any patient', () => {
    fc.assert(
      fc.property(
        fc.record({
          age: fc.integer({ min: 18, max: 100 }),
          hemoglobin: fc.float({ min: 5, max: 18, noNaN: true }),
          sodium: fc.float({ min: 120, max: 150, noNaN: true }),
          los: fc.integer({ min: 0, max: 30 }),
          cci: fc.integer({ min: 0, max: 10 }),
          priorAdmits: fc.integer({ min: 0, max: 10 }),
          edVisits: fc.integer({ min: 0, max: 10 }),
        }),
        (data) => {
          const patient = createTestPatient({
            age: data.age,
            hemoglobinAtDischarge: data.hemoglobin,
            sodiumAtDischarge: data.sodium,
            lengthOfStayDays: data.los,
            charlsonComorbidityIndex: data.cci,
            previousAdmissions6Months: data.priorAdmits,
            emergencyVisits6Months: data.edVisits,
          });
          const result = predictor.predict(patient);
          return result.ensembleProbability >= 0 && result.ensembleProbability <= 1;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should have HOSPITAL score between 0 and max (9)', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 30 }),
        (isOncology, isEmergency, priorAdmits, los) => {
          const patient = createTestPatient({
            hasOncologyDiagnosis: isOncology,
            admissionType: isEmergency ? AdmissionType.EMERGENCY : AdmissionType.ELECTIVE,
            previousAdmissions6Months: priorAdmits,
            lengthOfStayDays: los,
          });
          const result = predictor.computeHOSPITALScore(patient);
          return result.totalScore >= 0 && result.totalScore <= result.maxScore;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should have LACE score between 0 and max (19)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 }),
        fc.boolean(),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (los, isEmergency, cci, edVisits) => {
          const patient = createTestPatient({
            lengthOfStayDays: los,
            admissionType: isEmergency ? AdmissionType.EMERGENCY : AdmissionType.ELECTIVE,
            charlsonComorbidityIndex: cci,
            emergencyVisits6Months: edVisits,
          });
          const result = predictor.computeLACEIndex(patient);
          return result.totalScore >= 0 && result.totalScore <= result.maxScore;
        }
      ),
      { numRuns: 30 }
    );
  });
});
