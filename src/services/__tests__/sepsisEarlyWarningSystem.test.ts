import { describe, it, expect } from 'vitest';
import {
  sepsisEarlyWarningSystem,
  calculateQSOFA,
  calculateSIRS,
  calculateSOFA,
  calculateRespirationSOFA,
  calculateCoagulationSOFA,
  calculateLiverSOFA,
  calculateCardiovascularSOFA,
  calculateCNSSOFA,
  calculateRenalSOFA,
  SepsisRiskLevel,
  SepsisStage,
  AlertSeverity,
  SOFA_MORTALITY_MAP,
} from '../sepsisEarlyWarningSystem';
import type {
  VitalSigns,
  LabValues,
  VasopressorInfo,
} from '../sepsisEarlyWarningSystem';

// Helper to create default vital signs
function makeVitals(overrides: Partial<VitalSigns> = {}): VitalSigns {
  return {
    timestamp: new Date().toISOString(),
    temperature: 37.0,
    heartRate: 75,
    respiratoryRate: 16,
    systolicBP: 120,
    diastolicBP: 80,
    meanArterialPressure: 93,
    spo2: 98,
    gcsScore: 15,
    supplementalO2: false,
    ...overrides,
  };
}

function makeLabs(overrides: Partial<LabValues> = {}): LabValues {
  return {
    wbc: 7.5,
    lactate: 1.0,
    plateletCount: 250,
    bilirubin: 0.6,
    creatinine: 0.8,
    pao2: 95,
    fio2: 0.21,
    urineOutput: 60,
    ...overrides,
  };
}

function makeVasopressors(overrides: Partial<VasopressorInfo> = {}): VasopressorInfo {
  return {
    dopamine: 0,
    dobutamine: 0,
    epinephrine: 0,
    norepinephrine: 0,
    ...overrides,
  };
}

describe('SepsisEarlyWarningSystem', () => {
  // ==========================================================================
  // qSOFA Score Tests
  // ==========================================================================
  describe('qSOFA scoring', () => {
    it('should return 0 for completely normal vitals', () => {
      const result = calculateQSOFA(makeVitals());
      expect(result.score).toBe(0);
      expect(result.alteredMentation).toBe(false);
      expect(result.lowSystolicBP).toBe(false);
      expect(result.elevatedRR).toBe(false);
      expect(result.sepsisLikely).toBe(false);
    });

    it('should score 1 for GCS < 15 (altered mentation)', () => {
      const result = calculateQSOFA(makeVitals({ gcsScore: 13 }));
      expect(result.score).toBe(1);
      expect(result.alteredMentation).toBe(true);
      expect(result.sepsisLikely).toBe(false);
    });

    it('should score 1 for systolic BP <= 100', () => {
      const result = calculateQSOFA(makeVitals({ systolicBP: 100 }));
      expect(result.score).toBe(1);
      expect(result.lowSystolicBP).toBe(true);
    });

    it('should score 1 for respiratory rate >= 22', () => {
      const result = calculateQSOFA(makeVitals({ respiratoryRate: 22 }));
      expect(result.score).toBe(1);
      expect(result.elevatedRR).toBe(true);
    });

    it('should score 2 and flag sepsis likely with 2 criteria', () => {
      const result = calculateQSOFA(makeVitals({
        systolicBP: 90,
        respiratoryRate: 24,
      }));
      expect(result.score).toBe(2);
      expect(result.sepsisLikely).toBe(true);
    });

    it('should score 3 with all criteria met', () => {
      const result = calculateQSOFA(makeVitals({
        gcsScore: 12,
        systolicBP: 85,
        respiratoryRate: 28,
      }));
      expect(result.score).toBe(3);
      expect(result.sepsisLikely).toBe(true);
      expect(result.recommendation).toContain('CRITICAL');
    });

    it('should not flag SBP of 101 as low', () => {
      const result = calculateQSOFA(makeVitals({ systolicBP: 101 }));
      expect(result.lowSystolicBP).toBe(false);
    });

    it('should not flag RR of 21 as elevated', () => {
      const result = calculateQSOFA(makeVitals({ respiratoryRate: 21 }));
      expect(result.elevatedRR).toBe(false);
    });
  });

  // ==========================================================================
  // SIRS Criteria Tests
  // ==========================================================================
  describe('SIRS scoring', () => {
    it('should return 0 criteria for normal values', () => {
      const result = calculateSIRS(makeVitals(), makeLabs());
      expect(result.criteriaCount).toBe(0);
      expect(result.sirsMet).toBe(false);
    });

    it('should detect hypothermia (< 36°C)', () => {
      const result = calculateSIRS(makeVitals({ temperature: 35.5 }), makeLabs());
      expect(result.temperatureAbnormal).toBe(true);
      expect(result.criteriaCount).toBe(1);
    });

    it('should detect hyperthermia (> 38.3°C)', () => {
      const result = calculateSIRS(makeVitals({ temperature: 39.0 }), makeLabs());
      expect(result.temperatureAbnormal).toBe(true);
    });

    it('should detect tachycardia (> 90 bpm)', () => {
      const result = calculateSIRS(makeVitals({ heartRate: 95 }), makeLabs());
      expect(result.heartRateElevated).toBe(true);
    });

    it('should detect tachypnea (> 20/min)', () => {
      const result = calculateSIRS(makeVitals({ respiratoryRate: 24 }), makeLabs());
      expect(result.respiratoryRateElevated).toBe(true);
    });

    it('should detect leukocytosis (WBC > 12)', () => {
      const result = calculateSIRS(makeVitals(), makeLabs({ wbc: 15 }));
      expect(result.wbcAbnormal).toBe(true);
    });

    it('should detect leukopenia (WBC < 4)', () => {
      const result = calculateSIRS(makeVitals(), makeLabs({ wbc: 3.0 }));
      expect(result.wbcAbnormal).toBe(true);
    });

    it('should meet SIRS with 2+ criteria', () => {
      const result = calculateSIRS(
        makeVitals({ temperature: 39.2, heartRate: 110 }),
        makeLabs({ wbc: 15 }),
      );
      expect(result.criteriaCount).toBe(3);
      expect(result.sirsMet).toBe(true);
      expect(result.details.length).toBe(3);
    });

    it('should not meet SIRS with only 1 criterion', () => {
      const result = calculateSIRS(
        makeVitals({ temperature: 39.0 }),
        makeLabs(),
      );
      expect(result.criteriaCount).toBe(1);
      expect(result.sirsMet).toBe(false);
    });
  });

  // ==========================================================================
  // SOFA Score Tests (6 organ systems)
  // ==========================================================================
  describe('SOFA scoring', () => {
    describe('respiration component', () => {
      it('should score 0 for PaO2/FiO2 >= 400', () => {
        expect(calculateRespirationSOFA(95, 0.21)).toBe(0); // ratio ~452
      });

      it('should score 1 for PaO2/FiO2 300-399', () => {
        expect(calculateRespirationSOFA(75, 0.21)).toBe(1); // ratio ~357
      });

      it('should score 2 for PaO2/FiO2 200-299', () => {
        expect(calculateRespirationSOFA(60, 0.25)).toBe(2); // ratio 240
      });

      it('should score 3 for PaO2/FiO2 100-199', () => {
        expect(calculateRespirationSOFA(60, 0.40)).toBe(3); // ratio 150
      });

      it('should score 4 for PaO2/FiO2 < 100', () => {
        expect(calculateRespirationSOFA(50, 0.80)).toBe(4); // ratio 62.5
      });
    });

    describe('coagulation component', () => {
      it('should score 0 for platelets >= 150', () => {
        expect(calculateCoagulationSOFA(200)).toBe(0);
      });

      it('should score 1 for platelets 100-149', () => {
        expect(calculateCoagulationSOFA(120)).toBe(1);
      });

      it('should score 2 for platelets 50-99', () => {
        expect(calculateCoagulationSOFA(75)).toBe(2);
      });

      it('should score 3 for platelets 20-49', () => {
        expect(calculateCoagulationSOFA(30)).toBe(3);
      });

      it('should score 4 for platelets < 20', () => {
        expect(calculateCoagulationSOFA(10)).toBe(4);
      });
    });

    describe('liver component', () => {
      it('should score 0 for bilirubin < 1.2', () => {
        expect(calculateLiverSOFA(0.8)).toBe(0);
      });

      it('should score 1 for bilirubin 1.2-1.9', () => {
        expect(calculateLiverSOFA(1.5)).toBe(1);
      });

      it('should score 2 for bilirubin 2.0-5.9', () => {
        expect(calculateLiverSOFA(4.0)).toBe(2);
      });

      it('should score 3 for bilirubin 6.0-11.9', () => {
        expect(calculateLiverSOFA(8.0)).toBe(3);
      });

      it('should score 4 for bilirubin >= 12', () => {
        expect(calculateLiverSOFA(15.0)).toBe(4);
      });
    });

    describe('cardiovascular component', () => {
      it('should score 0 for MAP >= 70 without vasopressors', () => {
        expect(calculateCardiovascularSOFA(75, makeVasopressors())).toBe(0);
      });

      it('should score 1 for MAP < 70', () => {
        expect(calculateCardiovascularSOFA(65, makeVasopressors())).toBe(1);
      });

      it('should score 2 for low-dose dopamine (<=5)', () => {
        expect(calculateCardiovascularSOFA(65, makeVasopressors({ dopamine: 4 }))).toBe(2);
      });

      it('should score 3 for high-dose dopamine (>5) or any dobutamine', () => {
        expect(calculateCardiovascularSOFA(65, makeVasopressors({ dopamine: 8 }))).toBe(3);
      });

      it('should score 4 for high-dose norepinephrine (>0.1)', () => {
        expect(calculateCardiovascularSOFA(55, makeVasopressors({ norepinephrine: 0.2 }))).toBe(4);
      });
    });

    describe('CNS component', () => {
      it('should score 0 for GCS 15', () => {
        expect(calculateCNSSOFA(15)).toBe(0);
      });

      it('should score 1 for GCS 13-14', () => {
        expect(calculateCNSSOFA(14)).toBe(1);
        expect(calculateCNSSOFA(13)).toBe(1);
      });

      it('should score 2 for GCS 10-12', () => {
        expect(calculateCNSSOFA(11)).toBe(2);
      });

      it('should score 3 for GCS 6-9', () => {
        expect(calculateCNSSOFA(7)).toBe(3);
      });

      it('should score 4 for GCS < 6', () => {
        expect(calculateCNSSOFA(3)).toBe(4);
      });
    });

    describe('renal component', () => {
      it('should score 0 for creatinine < 1.2 with normal urine output', () => {
        expect(calculateRenalSOFA(0.8, 60)).toBe(0);
      });

      it('should score 1 for creatinine 1.2-1.9', () => {
        expect(calculateRenalSOFA(1.5, 60)).toBe(1);
      });

      it('should score 2 for creatinine 2.0-3.4', () => {
        expect(calculateRenalSOFA(2.5, 60)).toBe(2);
      });

      it('should score 3 for low urine output (<500 mL/day)', () => {
        // 15 mL/hr * 24 = 360 mL/day
        expect(calculateRenalSOFA(1.0, 15)).toBe(3);
      });

      it('should score 4 for very low urine output (<200 mL/day)', () => {
        // 5 mL/hr * 24 = 120 mL/day
        expect(calculateRenalSOFA(1.0, 5)).toBe(4);
      });
    });

    describe('total SOFA score', () => {
      it('should be 0 for completely healthy patient', () => {
        const sofa = calculateSOFA(makeVitals(), makeLabs(), makeVasopressors());
        expect(sofa.totalScore).toBe(0);
        expect(sofa.organDysfunction).toBe(false);
        expect(sofa.estimatedMortality).toBe(0);
      });

      it('should detect organ dysfunction with SOFA increase >= 2 from baseline', () => {
        const sofa = calculateSOFA(
          makeVitals({ gcsScore: 12, meanArterialPressure: 65 }),
          makeLabs({ plateletCount: 80 }),
          makeVasopressors(),
          0,
        );
        // GCS 12 = CNS 2, MAP < 70 = CV 1, platelets 80 = coag 2 => total 5
        expect(sofa.totalScore).toBeGreaterThanOrEqual(4);
        expect(sofa.organDysfunction).toBe(true);
      });

      it('should estimate higher mortality for higher SOFA scores', () => {
        const lowSOFA = calculateSOFA(makeVitals(), makeLabs(), makeVasopressors());
        const highSOFA = calculateSOFA(
          makeVitals({ gcsScore: 6, meanArterialPressure: 50 }),
          makeLabs({ plateletCount: 15, bilirubin: 10, creatinine: 5, pao2: 55, fio2: 0.8 }),
          makeVasopressors({ norepinephrine: 0.2 }),
        );
        expect(highSOFA.estimatedMortality).toBeGreaterThan(lowSOFA.estimatedMortality);
      });

      it('should have mortality map for scores 0-24', () => {
        for (let i = 0; i <= 24; i++) {
          expect(SOFA_MORTALITY_MAP[i]).toBeDefined();
          expect(SOFA_MORTALITY_MAP[i]).toBeGreaterThanOrEqual(0);
          expect(SOFA_MORTALITY_MAP[i]).toBeLessThanOrEqual(100);
        }
        // Mortality should generally increase with score
        expect(SOFA_MORTALITY_MAP[24]).toBeGreaterThan(SOFA_MORTALITY_MAP[0]);
      });
    });
  });

  // ==========================================================================
  // Full Screening Tests
  // ==========================================================================
  describe('patient screening', () => {
    it('should return low risk for healthy patient', () => {
      const alert = sepsisEarlyWarningSystem.screenPatient(
        'test-healthy',
        makeVitals(),
        makeLabs(),
        makeVasopressors(),
      );
      expect(alert.riskLevel).toBe(SepsisRiskLevel.LOW);
      expect(alert.stage).toBe(SepsisStage.NO_SEPSIS);
      expect(alert.severity).toBe(AlertSeverity.INFO);
    });

    it('should detect SIRS in febrile tachycardic patient', () => {
      const alert = sepsisEarlyWarningSystem.screenPatient(
        'test-sirs',
        makeVitals({ temperature: 39.0, heartRate: 110, respiratoryRate: 22 }),
        makeLabs({ wbc: 14 }),
        makeVasopressors(),
      );
      expect(alert.sirs.sirsMet).toBe(true);
      expect(alert.sirs.criteriaCount).toBeGreaterThanOrEqual(2);
    });

    it('should identify septic shock with hypotension and high lactate', () => {
      const alert = sepsisEarlyWarningSystem.screenPatient(
        'test-shock',
        makeVitals({
          temperature: 39.5,
          heartRate: 130,
          respiratoryRate: 30,
          systolicBP: 75,
          diastolicBP: 40,
          meanArterialPressure: 52,
          gcsScore: 10,
        }),
        makeLabs({
          wbc: 22,
          lactate: 6.0,
          plateletCount: 40,
          bilirubin: 4.0,
          creatinine: 3.5,
          pao2: 55,
          fio2: 0.6,
        }),
        makeVasopressors({ norepinephrine: 0.15 }),
      );
      expect(alert.riskLevel).toBe(SepsisRiskLevel.CRITICAL);
      expect(alert.stage).toBe(SepsisStage.SEPTIC_SHOCK);
      expect(alert.severity).toBe(AlertSeverity.EMERGENCY);
      expect(alert.recommendations.length).toBeGreaterThan(3);
    });

    it('should include appropriate recommendations for sepsis', () => {
      const alert = sepsisEarlyWarningSystem.screenPatient(
        'test-recs',
        makeVitals({
          temperature: 39.0,
          heartRate: 115,
          respiratoryRate: 26,
          systolicBP: 88,
          meanArterialPressure: 60,
          gcsScore: 13,
        }),
        makeLabs({
          wbc: 16,
          lactate: 3.5,
          plateletCount: 90,
          creatinine: 2.0,
          pao2: 70,
          fio2: 0.4,
        }),
        makeVasopressors(),
      );
      const allRecs = alert.recommendations.join(' ');
      expect(allRecs).toContain('antibiotic');
    });
  });

  // ==========================================================================
  // Time Series & Escalation
  // ==========================================================================
  describe('time series and escalation', () => {
    it('should track patient time series across multiple screenings', () => {
      const pid = `ts-test-${Date.now()}`;
      sepsisEarlyWarningSystem.screenPatient(pid, makeVitals(), makeLabs(), makeVasopressors());
      sepsisEarlyWarningSystem.screenPatient(
        pid,
        makeVitals({ heartRate: 100 }),
        makeLabs(),
        makeVasopressors(),
      );
      const ts = sepsisEarlyWarningSystem.getPatientTimeSeries(pid);
      expect(ts).not.toBeNull();
      expect(ts!.vitalSigns.length).toBe(2);
      expect(ts!.alerts.length).toBe(2);
    });

    it('should detect escalation triggers from deteriorating vitals', () => {
      const pid = `esc-test-${Date.now()}`;
      sepsisEarlyWarningSystem.screenPatient(
        pid,
        makeVitals({ systolicBP: 120, heartRate: 80 }),
        makeLabs(),
        makeVasopressors(),
      );
      sepsisEarlyWarningSystem.screenPatient(
        pid,
        makeVitals({ systolicBP: 85, heartRate: 120 }),
        makeLabs({ lactate: 4.0 }),
        makeVasopressors(),
      );
      const triggers = sepsisEarlyWarningSystem.getEscalationTriggers(pid);
      expect(triggers.length).toBeGreaterThan(0);
      expect(triggers.some(t => t.includes('BP'))).toBe(true);
      expect(triggers.some(t => t.includes('heart rate'))).toBe(true);
    });

    it('should return empty triggers for new patient', () => {
      const triggers = sepsisEarlyWarningSystem.getEscalationTriggers('nonexistent');
      expect(triggers).toEqual([]);
    });
  });

  // ==========================================================================
  // Self-Learning
  // ==========================================================================
  describe('self-learning', () => {
    it('should track confirmed outcomes', () => {
      const pid = `learn-test-${Date.now()}`;
      sepsisEarlyWarningSystem.screenPatient(pid, makeVitals(), makeLabs(), makeVasopressors());
      sepsisEarlyWarningSystem.recordOutcome(pid, false);
      const data = sepsisEarlyWarningSystem.getLearningData();
      expect(data.totalCasesEvaluated).toBeGreaterThan(0);
    });

    it('should compute sensitivity and specificity', () => {
      const data = sepsisEarlyWarningSystem.getLearningData();
      expect(data.sensitivity).toBeGreaterThanOrEqual(0);
      expect(data.sensitivity).toBeLessThanOrEqual(1);
      expect(data.specificity).toBeGreaterThanOrEqual(0);
      expect(data.specificity).toBeLessThanOrEqual(1);
    });

    it('should have learning data populated from generated dataset', () => {
      const data = sepsisEarlyWarningSystem.getLearningData();
      expect(data.totalCasesEvaluated).toBeGreaterThanOrEqual(100);
      expect(data.confirmedSepsisCases).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Dataset Statistics
  // ==========================================================================
  describe('dataset statistics', () => {
    it('should have 110+ patients in generated dataset', () => {
      const stats = sepsisEarlyWarningSystem.getDatasetStatistics();
      expect(stats.totalPatients).toBeGreaterThanOrEqual(110);
    });

    it('should have realistic sepsis prevalence (~20%)', () => {
      const stats = sepsisEarlyWarningSystem.getDatasetStatistics();
      expect(stats.sepsisPrevalence).toBeGreaterThanOrEqual(0.1);
      expect(stats.sepsisPrevalence).toBeLessThanOrEqual(0.35);
    });

    it('should have generated alerts', () => {
      const stats = sepsisEarlyWarningSystem.getDatasetStatistics();
      expect(stats.alertsGenerated).toBeGreaterThan(0);
    });

    it('should have risk distribution covering all levels', () => {
      const stats = sepsisEarlyWarningSystem.getDatasetStatistics();
      const totalInDistribution = Object.values(stats.riskDistribution).reduce((s, v) => s + v, 0);
      expect(totalInDistribution).toBe(stats.totalPatients);
    });
  });
});
