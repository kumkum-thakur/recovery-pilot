import { describe, it, expect } from 'vitest';
import {
  dvtRiskCalculator,
  calculateCapriniScore,
  calculateWellsDVT,
  calculateWellsPE,
  calculateGenevaPE,
  generateProphylaxisRecommendation,
  DVTRiskLevel,
  WellsDVTProbability,
  WellsPEProbability,
  GenevaPEProbability,
  ProphylaxisType,
  CAPRINI_POINTS,
} from '../dvtRiskCalculator';
import type {
  CapriniRiskFactors,
  WellsDVTCriteria,
  WellsPECriteria,
  GenevaPECriteria,
} from '../dvtRiskCalculator';

function makeEmptyCaprini(): CapriniRiskFactors {
  return {
    age41to60: false, minorSurgery: false, bmi25to30: false, swollenLegs: false,
    varicoseVeins: false, pregnancy: false, postpartum: false, historyUnexplainedStillbirth: false,
    oralContraceptives: false, hormoneReplacementTherapy: false, sepsis: false,
    seriousLungDisease: false, abnormalPulmonaryFunction: false, acuteMI: false,
    chf: false, medicalPatientBedRest: false, inflammatoryBowelDisease: false,
    age61to74: false, arthroscopicSurgery: false, majorOpenSurgery: false,
    laparoscopicSurgery: false, malignancy: false, confinedToBedMoreThan72h: false,
    immobilizingCast: false, centralVenousAccess: false,
    age75plus: false, historyOfDVT: false, historyOfPE: false, familyHistoryVTE: false,
    factorVLeiden: false, prothrombinMutation: false, lupusAnticoagulant: false,
    anticardiolipinAntibodies: false, elevatedHomocysteine: false,
    heparinInducedThrombocytopenia: false, otherThrombophilia: false,
    stroke: false, multipleTrauma: false, acuteSpinalCordInjury: false,
    majorLowerExtremitySurgery: false, hipPelvisFracture: false,
  };
}

function makeEmptyWellsDVT(): WellsDVTCriteria {
  return {
    activeCancer: false, paralysisParesisImmobilization: false,
    bedriddenMoreThan3Days: false, localizedTenderness: false,
    entireLegSwollen: false, calfSwellingMoreThan3cm: false,
    pittingEdema: false, collateralSuperficialVeins: false,
    previousDVT: false, alternativeDiagnosisLikely: false,
  };
}

function makeEmptyWellsPE(): WellsPECriteria {
  return {
    clinicalSignsDVT: false, peMoreLikelyThanAlternative: false,
    heartRateOver100: false, immobilizationOrSurgery: false,
    previousDVTPE: false, hemoptysis: false, malignancy: false,
  };
}

function makeEmptyGeneva(): GenevaPECriteria {
  return {
    age65plus: false, previousDVTPE: false, surgeryOrFracture: false,
    activeMalignancy: false, unilateralLowerLimbPain: false, hemoptysis: false,
    heartRate75to94: false, heartRate95plus: false,
    painOnDeepPalpation: false, unilateralEdema: false,
  };
}

describe('DVTRiskCalculator', () => {
  // ==========================================================================
  // Caprini Score Tests
  // ==========================================================================
  describe('Caprini DVT Risk Assessment', () => {
    it('should return score 0 and very low risk with no factors', () => {
      const result = calculateCapriniScore(makeEmptyCaprini());
      expect(result.totalScore).toBe(0);
      expect(result.riskLevel).toBe(DVTRiskLevel.VERY_LOW);
      expect(result.recommendedProphylaxis).toBe(ProphylaxisType.NONE);
    });

    it('should score 1-point factors correctly', () => {
      const factors = { ...makeEmptyCaprini(), age41to60: true, sepsis: true };
      const result = calculateCapriniScore(factors);
      expect(result.totalScore).toBe(2);
      expect(result.riskLevel).toBe(DVTRiskLevel.LOW);
    });

    it('should score 2-point factors correctly', () => {
      const factors = { ...makeEmptyCaprini(), malignancy: true, majorOpenSurgery: true };
      const result = calculateCapriniScore(factors);
      expect(result.totalScore).toBe(4);
      expect(result.riskLevel).toBe(DVTRiskLevel.MODERATE);
    });

    it('should score 3-point factors correctly', () => {
      const factors = { ...makeEmptyCaprini(), historyOfDVT: true, factorVLeiden: true };
      const result = calculateCapriniScore(factors);
      expect(result.totalScore).toBe(6);
      expect(result.riskLevel).toBe(DVTRiskLevel.HIGH);
    });

    it('should score 5-point factors correctly', () => {
      const factors = { ...makeEmptyCaprini(), majorLowerExtremitySurgery: true, hipPelvisFracture: true };
      const result = calculateCapriniScore(factors);
      expect(result.totalScore).toBe(10);
      expect(result.riskLevel).toBe(DVTRiskLevel.HIGHEST);
    });

    it('should have correct point values for all 40+ risk factors', () => {
      const factorCount = Object.keys(CAPRINI_POINTS).length;
      expect(factorCount).toBeGreaterThanOrEqual(40);
    });

    it('should compute VTE risk percentage that increases with score', () => {
      const low = calculateCapriniScore(makeEmptyCaprini());
      const high = calculateCapriniScore({
        ...makeEmptyCaprini(),
        majorLowerExtremitySurgery: true,
        historyOfDVT: true,
        malignancy: true,
      });
      expect(high.vteRiskPercent).toBeGreaterThan(low.vteRiskPercent);
    });

    it('should include details of triggered risk factors', () => {
      const factors = { ...makeEmptyCaprini(), sepsis: true, malignancy: true };
      const result = calculateCapriniScore(factors);
      expect(result.details.length).toBe(2);
      expect(result.details.some(d => d.includes('sepsis'))).toBe(true);
    });
  });

  // ==========================================================================
  // Wells DVT Score Tests
  // ==========================================================================
  describe('Wells DVT Score', () => {
    it('should return score 0 and unlikely with no criteria', () => {
      const result = calculateWellsDVT(makeEmptyWellsDVT());
      expect(result.score).toBe(0);
      expect(result.probability).toBe(WellsDVTProbability.UNLIKELY);
    });

    it('should add 1 point per positive criterion', () => {
      const criteria = {
        ...makeEmptyWellsDVT(),
        activeCancer: true,
        localizedTenderness: true,
        entireLegSwollen: true,
      };
      const result = calculateWellsDVT(criteria);
      expect(result.score).toBe(3);
      expect(result.probability).toBe(WellsDVTProbability.LIKELY);
    });

    it('should subtract 2 for alternative diagnosis likely', () => {
      const criteria = {
        ...makeEmptyWellsDVT(),
        activeCancer: true,
        alternativeDiagnosisLikely: true,
      };
      const result = calculateWellsDVT(criteria);
      expect(result.score).toBe(-1);
      expect(result.probability).toBe(WellsDVTProbability.UNLIKELY);
    });

    it('should recommend D-dimer for unlikely DVT', () => {
      const result = calculateWellsDVT(makeEmptyWellsDVT());
      expect(result.recommendation).toContain('D-dimer');
    });

    it('should recommend ultrasound for likely DVT', () => {
      const criteria = { ...makeEmptyWellsDVT(), localizedTenderness: true, previousDVT: true };
      const result = calculateWellsDVT(criteria);
      expect(result.recommendation).toContain('ultrasonography');
    });
  });

  // ==========================================================================
  // Wells PE Score Tests
  // ==========================================================================
  describe('Wells PE Score', () => {
    it('should return low probability with no criteria', () => {
      const result = calculateWellsPE(makeEmptyWellsPE());
      expect(result.score).toBe(0);
      expect(result.probability).toBe(WellsPEProbability.LOW);
      expect(result.peLikelyPercent).toBe(1.3);
    });

    it('should assign 3 points for clinical signs of DVT', () => {
      const criteria = { ...makeEmptyWellsPE(), clinicalSignsDVT: true };
      const result = calculateWellsPE(criteria);
      expect(result.score).toBe(3);
      expect(result.probability).toBe(WellsPEProbability.MODERATE);
    });

    it('should identify high probability PE (score > 4)', () => {
      const criteria = {
        ...makeEmptyWellsPE(),
        clinicalSignsDVT: true,
        peMoreLikelyThanAlternative: true,
      };
      const result = calculateWellsPE(criteria);
      expect(result.score).toBe(6);
      expect(result.probability).toBe(WellsPEProbability.HIGH);
      expect(result.peLikelyPercent).toBe(40.6);
    });

    it('should assign 1.5 points for heart rate > 100', () => {
      const criteria = { ...makeEmptyWellsPE(), heartRateOver100: true };
      const result = calculateWellsPE(criteria);
      expect(result.score).toBe(1.5);
    });

    it('should recommend CTPA for high probability', () => {
      const criteria = {
        ...makeEmptyWellsPE(),
        clinicalSignsDVT: true,
        peMoreLikelyThanAlternative: true,
      };
      const result = calculateWellsPE(criteria);
      expect(result.recommendation).toContain('CTPA');
    });
  });

  // ==========================================================================
  // Geneva PE Score Tests
  // ==========================================================================
  describe('Geneva PE Score', () => {
    it('should return low probability with no criteria', () => {
      const result = calculateGenevaPE(makeEmptyGeneva());
      expect(result.score).toBe(0);
      expect(result.probability).toBe(GenevaPEProbability.LOW);
    });

    it('should assign correct points for heart rate bands', () => {
      const mod = { ...makeEmptyGeneva(), heartRate75to94: true };
      expect(calculateGenevaPE(mod).score).toBe(3);

      const high = { ...makeEmptyGeneva(), heartRate95plus: true };
      expect(calculateGenevaPE(high).score).toBe(5);
    });

    it('should classify intermediate probability (4-10)', () => {
      const criteria = {
        ...makeEmptyGeneva(),
        previousDVTPE: true,
        surgeryOrFracture: true,
      };
      const result = calculateGenevaPE(criteria);
      expect(result.score).toBe(5);
      expect(result.probability).toBe(GenevaPEProbability.INTERMEDIATE);
    });

    it('should classify high probability (>10)', () => {
      const criteria = {
        ...makeEmptyGeneva(),
        previousDVTPE: true,
        heartRate95plus: true,
        painOnDeepPalpation: true,
      };
      const result = calculateGenevaPE(criteria);
      expect(result.score).toBe(12);
      expect(result.probability).toBe(GenevaPEProbability.HIGH);
      expect(result.peRiskPercent).toBe(74);
    });
  });

  // ==========================================================================
  // Prophylaxis Recommendations
  // ==========================================================================
  describe('prophylaxis recommendations', () => {
    it('should recommend nothing for very low risk', () => {
      const caprini = calculateCapriniScore(makeEmptyCaprini());
      const prophylaxis = generateProphylaxisRecommendation(caprini);
      expect(prophylaxis.type).toBe(ProphylaxisType.NONE);
      expect(prophylaxis.medications.length).toBe(0);
    });

    it('should recommend mechanical for low risk', () => {
      const caprini = calculateCapriniScore({ ...makeEmptyCaprini(), age41to60: true, bmi25to30: true });
      const prophylaxis = generateProphylaxisRecommendation(caprini);
      expect(prophylaxis.type).toBe(ProphylaxisType.MECHANICAL);
      expect(prophylaxis.mechanicalOptions.length).toBeGreaterThan(0);
    });

    it('should recommend pharmacological for moderate risk', () => {
      const caprini = calculateCapriniScore({
        ...makeEmptyCaprini(), majorOpenSurgery: true, age41to60: true, bmi25to30: true,
      });
      const prophylaxis = generateProphylaxisRecommendation(caprini);
      expect(prophylaxis.type).toBe(ProphylaxisType.PHARMACOLOGICAL);
      expect(prophylaxis.medications.length).toBeGreaterThan(0);
    });

    it('should recommend fondaparinux for HIT patients', () => {
      const caprini = calculateCapriniScore({
        ...makeEmptyCaprini(), majorOpenSurgery: true, malignancy: true, age41to60: true,
      });
      const prophylaxis = generateProphylaxisRecommendation(caprini, false, false, true);
      expect(prophylaxis.medications.some(m => m.genericName === 'fondaparinux')).toBe(true);
    });

    it('should recommend UFH for renal impairment', () => {
      const caprini = calculateCapriniScore({
        ...makeEmptyCaprini(), majorOpenSurgery: true, malignancy: true, age41to60: true,
      });
      const prophylaxis = generateProphylaxisRecommendation(caprini, false, true, false);
      expect(prophylaxis.medications.some(m => m.genericName === 'heparin')).toBe(true);
    });

    it('should have 4 pharmacological options available', () => {
      const meds = dvtRiskCalculator.getAvailableMedications();
      expect(meds.length).toBe(4);
      const names = meds.map(m => m.genericName);
      expect(names).toContain('enoxaparin');
      expect(names).toContain('heparin');
      expect(names).toContain('fondaparinux');
      expect(names).toContain('rivaroxaban');
    });
  });

  // ==========================================================================
  // Self-Learning & Dataset
  // ==========================================================================
  describe('self-learning and dataset', () => {
    it('should have generated 120+ patient profiles', () => {
      expect(dvtRiskCalculator.getDatasetSize()).toBeGreaterThanOrEqual(120);
    });

    it('should track VTE events in learning data', () => {
      const data = dvtRiskCalculator.getLearningData();
      expect(data.totalAssessments).toBeGreaterThanOrEqual(120);
      expect(data.actualVTEEvents).toBeGreaterThan(0);
    });

    it('should compute AUC for risk prediction', () => {
      const data = dvtRiskCalculator.getLearningData();
      expect(data.areaUnderROC).toBeGreaterThan(0);
      expect(data.areaUnderROC).toBeLessThanOrEqual(1);
    });

    it('should update calibration factor based on observed vs predicted', () => {
      const pid = `learn-dvt-${Date.now()}`;
      const factors = { ...makeEmptyCaprini(), majorLowerExtremitySurgery: true, historyOfDVT: true };
      dvtRiskCalculator.assessPatient(pid, factors);
      dvtRiskCalculator.recordVTEEvent(pid, true, 'DVT');
      const data = dvtRiskCalculator.getLearningData();
      expect(data.calibrationFactor).toBeGreaterThan(0);
    });
  });
});
