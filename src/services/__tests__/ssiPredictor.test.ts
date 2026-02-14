import { describe, it, expect } from 'vitest';
import {
  ssiPredictor,
  calculateNNISRiskIndex,
  identifyRiskFactors,
  assessAntibioticProphylaxis,
  calculateASEPSIS,
  WoundClass,
  SSIRiskLevel,
  RiskFactorType,
  NHSN_SSI_RATES,
} from '../ssiPredictor';
import type {
  PatientSSIProfile,
  SurgicalProcedure,
} from '../ssiPredictor';

function makeDefaultPatient(overrides: Partial<PatientSSIProfile> = {}): PatientSSIProfile {
  return {
    patientId: 'test-pt',
    age: 55,
    bmi: 25,
    asaScore: 2,
    diabetes: false,
    diabetesControlled: true,
    smoker: false,
    immunosuppressed: false,
    malnutrition: false,
    obesity: false,
    remoteInfection: false,
    preoperativeGlucose: 110,
    albumin: 3.8,
    steroidUse: false,
    radiationHistory: false,
    priorSSI: false,
    ...overrides,
  };
}

function makeDefaultProcedure(overrides: Partial<SurgicalProcedure> = {}): SurgicalProcedure {
  return {
    name: 'Hip replacement',
    category: 'orthopedic',
    woundClass: WoundClass.CLEAN,
    durationMinutes: 100,
    nhsnDurationCutoffMinutes: 120,
    isLaparoscopic: false,
    implant: true,
    ...overrides,
  };
}

describe('SSIPredictor', () => {
  // ==========================================================================
  // NNIS Risk Index
  // ==========================================================================
  describe('NNIS Risk Index', () => {
    it('should score 0 for ASA 1-2, clean wound, within T-time', () => {
      const result = calculateNNISRiskIndex(2, WoundClass.CLEAN, 90, 120, false);
      expect(result.score).toBe(0);
      expect(result.riskLevel).toBe(SSIRiskLevel.LOW);
    });

    it('should add 1 for ASA >= 3', () => {
      const result = calculateNNISRiskIndex(3, WoundClass.CLEAN, 90, 120, false);
      expect(result.asaComponent).toBe(1);
      expect(result.score).toBe(1);
    });

    it('should add 1 for contaminated wound', () => {
      const result = calculateNNISRiskIndex(1, WoundClass.CONTAMINATED, 90, 120, false);
      expect(result.woundClassComponent).toBe(1);
      expect(result.score).toBe(1);
    });

    it('should add 1 for dirty/infected wound', () => {
      const result = calculateNNISRiskIndex(1, WoundClass.DIRTY_INFECTED, 90, 120, false);
      expect(result.woundClassComponent).toBe(1);
    });

    it('should NOT add 1 for clean-contaminated wound', () => {
      const result = calculateNNISRiskIndex(1, WoundClass.CLEAN_CONTAMINATED, 90, 120, false);
      expect(result.woundClassComponent).toBe(0);
    });

    it('should add 1 for duration exceeding T-time', () => {
      const result = calculateNNISRiskIndex(1, WoundClass.CLEAN, 150, 120, false);
      expect(result.durationComponent).toBe(1);
      expect(result.score).toBe(1);
    });

    it('should subtract 1 for laparoscopic procedure', () => {
      const result = calculateNNISRiskIndex(3, WoundClass.CLEAN, 90, 120, true);
      // ASA=1, wound=0, duration=0, lap=-1 => max(0, 1-1)=0
      expect(result.laparoscopicAdjustment).toBe(-1);
      expect(result.score).toBe(0);
    });

    it('should max out at score 3', () => {
      const result = calculateNNISRiskIndex(4, WoundClass.DIRTY_INFECTED, 300, 120, false);
      expect(result.score).toBe(3);
      expect(result.riskLevel).toBe(SSIRiskLevel.VERY_HIGH);
    });

    it('should increase predicted SSI rate with higher score', () => {
      const low = calculateNNISRiskIndex(1, WoundClass.CLEAN, 90, 120, false);
      const high = calculateNNISRiskIndex(4, WoundClass.DIRTY_INFECTED, 300, 120, false);
      expect(high.predictedSSIRate).toBeGreaterThan(low.predictedSSIRate);
    });
  });

  // ==========================================================================
  // NHSN Procedure-Specific Rates
  // ==========================================================================
  describe('NHSN SSI Rates', () => {
    it('should have rates for at least 15 procedure types', () => {
      const rates = ssiPredictor.getNHSNRates();
      expect(Object.keys(rates).length).toBeGreaterThanOrEqual(15);
    });

    it('should have real colon surgery rate (~3.38%)', () => {
      expect(NHSN_SSI_RATES['COLO'].rate).toBeCloseTo(3.38, 1);
    });

    it('should have real hip prosthesis rate (~0.82%)', () => {
      expect(NHSN_SSI_RATES['HPRO'].rate).toBeCloseTo(0.82, 1);
    });

    it('should have T-time for each procedure', () => {
      for (const data of Object.values(NHSN_SSI_RATES)) {
        expect(data.tTime).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Risk Factor Identification
  // ==========================================================================
  describe('risk factor identification', () => {
    it('should identify smoking as modifiable', () => {
      const factors = identifyRiskFactors(
        makeDefaultPatient({ smoker: true }),
        makeDefaultProcedure(),
      );
      const smoking = factors.find(f => f.name.includes('smoking'));
      expect(smoking).toBeDefined();
      expect(smoking!.type).toBe(RiskFactorType.MODIFIABLE);
      expect(smoking!.relativeRisk).toBeGreaterThan(1);
    });

    it('should identify immunosuppression as non-modifiable', () => {
      const factors = identifyRiskFactors(
        makeDefaultPatient({ immunosuppressed: true }),
        makeDefaultProcedure(),
      );
      const immuno = factors.find(f => f.name.includes('Immunosuppression'));
      expect(immuno!.type).toBe(RiskFactorType.NON_MODIFIABLE);
    });

    it('should identify uncontrolled diabetes', () => {
      const factors = identifyRiskFactors(
        makeDefaultPatient({ diabetes: true, diabetesControlled: false }),
        makeDefaultProcedure(),
      );
      expect(factors.some(f => f.name.includes('diabetes'))).toBe(true);
    });

    it('should flag low albumin', () => {
      const factors = identifyRiskFactors(
        makeDefaultPatient({ albumin: 2.5 }),
        makeDefaultProcedure(),
      );
      expect(factors.some(f => f.name.includes('albumin'))).toBe(true);
    });

    it('should flag implant as risk factor', () => {
      const factors = identifyRiskFactors(
        makeDefaultPatient(),
        makeDefaultProcedure({ implant: true }),
      );
      expect(factors.some(f => f.name.includes('Implant'))).toBe(true);
    });

    it('should include mitigation strategies for each factor', () => {
      const factors = identifyRiskFactors(
        makeDefaultPatient({ smoker: true, diabetes: true, diabetesControlled: false, obesity: true, bmi: 35 }),
        makeDefaultProcedure(),
      );
      for (const f of factors) {
        expect(f.mitigation.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Antibiotic Prophylaxis
  // ==========================================================================
  describe('antibiotic prophylaxis assessment', () => {
    it('should flag optimal timing within 60 minutes', () => {
      const result = assessAntibioticProphylaxis(makeDefaultProcedure(), 30, 'Cefazolin 2g IV', 70);
      expect(result.timingOptimal).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should flag late administration', () => {
      const result = assessAntibioticProphylaxis(makeDefaultProcedure(), 90, 'Cefazolin 2g IV', 70);
      expect(result.timingOptimal).toBe(false);
      expect(result.issues.some(i => i.includes('too early'))).toBe(true);
    });

    it('should flag missing administration', () => {
      const result = assessAntibioticProphylaxis(makeDefaultProcedure(), 0, 'Cefazolin 2g IV', 70);
      expect(result.timingOptimal).toBe(false);
    });

    it('should recommend redosing for long procedures', () => {
      const result = assessAntibioticProphylaxis(
        makeDefaultProcedure({ durationMinutes: 300 }),
        30, 'Cefazolin 2g IV', 70,
      );
      expect(result.redosingNeeded).toBe(true);
    });

    it('should allow 120-minute window for vancomycin', () => {
      const result = assessAntibioticProphylaxis(makeDefaultProcedure(), 100, 'Vancomycin 1g IV', 70);
      expect(result.timingOptimal).toBe(true);
    });

    it('should recommend metronidazole for colorectal procedures', () => {
      const result = assessAntibioticProphylaxis(
        makeDefaultProcedure({ category: 'colorectal' }),
        30, 'Cefazolin', 70,
      );
      expect(result.recommendedDrug).toContain('Metronidazole');
    });
  });

  // ==========================================================================
  // ASEPSIS Score
  // ==========================================================================
  describe('ASEPSIS wound scoring', () => {
    it('should classify clean wound as satisfactory healing', () => {
      const result = calculateASEPSIS(0, 0, 0, 0, false, false, false);
      expect(result.totalScore).toBe(0);
      expect(result.classification).toBe('Satisfactory healing');
    });

    it('should classify minor wound issues correctly', () => {
      const result = calculateASEPSIS(3, 5, 0, 2, false, false, false);
      expect(result.totalScore).toBe(10);
      expect(result.classification).toBe('Satisfactory healing');
    });

    it('should add 10 points for antibiotic treatment', () => {
      const result = calculateASEPSIS(5, 5, 5, 0, true, false, false);
      expect(result.additionalTreatments.antibiotics).toBe(10);
    });

    it('should classify severe infection with high scores', () => {
      const result = calculateASEPSIS(5, 5, 5, 5, true, true, true);
      // 20 + 10 + 5 + 10 = 45
      expect(result.totalScore).toBe(45);
      expect(result.classification).toBe('Severe wound infection');
    });
  });

  // ==========================================================================
  // Full Risk Assessment & Self-Learning
  // ==========================================================================
  describe('comprehensive risk assessment', () => {
    it('should produce low risk for healthy patient with clean procedure', () => {
      const assessment = ssiPredictor.performRiskAssessment(
        `test-low-${Date.now()}`,
        makeDefaultPatient(),
        makeDefaultProcedure({ woundClass: WoundClass.CLEAN, durationMinutes: 80 }),
      );
      expect(assessment.overallRiskLevel).toBe(SSIRiskLevel.LOW);
      expect(assessment.recommendations.length).toBeGreaterThan(0);
    });

    it('should include SSI prevention bundle recommendations', () => {
      const assessment = ssiPredictor.performRiskAssessment(
        `test-recs-${Date.now()}`,
        makeDefaultPatient(),
        makeDefaultProcedure(),
      );
      expect(assessment.recommendations.some(r => r.includes('chlorhexidine'))).toBe(true);
      expect(assessment.recommendations.some(r => r.includes('normothermia'))).toBe(true);
    });

    it('should count modifiable vs non-modifiable risk factors', () => {
      const assessment = ssiPredictor.performRiskAssessment(
        `test-factors-${Date.now()}`,
        makeDefaultPatient({ smoker: true, immunosuppressed: true, obesity: true, bmi: 35 }),
        makeDefaultProcedure(),
      );
      expect(assessment.modifiableRiskCount).toBeGreaterThan(0);
      expect(assessment.nonModifiableRiskCount).toBeGreaterThan(0);
    });
  });

  describe('self-learning', () => {
    it('should have 120+ patients in dataset', () => {
      expect(ssiPredictor.getAssessmentCount()).toBeGreaterThanOrEqual(120);
    });

    it('should track actual SSI rate', () => {
      const data = ssiPredictor.getLearningData();
      expect(data.observedSSIRate).toBeGreaterThan(0);
      expect(data.observedSSIRate).toBeLessThan(50);
    });

    it('should compute AUC', () => {
      const data = ssiPredictor.getLearningData();
      expect(data.areaUnderROC).toBeGreaterThan(0);
      expect(data.areaUnderROC).toBeLessThanOrEqual(1);
    });

    it('should calibrate baseline risk from observed data', () => {
      const data = ssiPredictor.getLearningData();
      expect(data.adjustedBaselineRisk).toBeGreaterThan(0);
    });
  });
});
