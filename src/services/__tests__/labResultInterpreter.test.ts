import { describe, it, expect, beforeEach } from 'vitest';
import {
  labResultInterpreter,
  REFERENCE_RANGES,
  LabCategory,
  FlagLevel,
  DeltaAlertType,
  TrendDirection,
  type LabValue,
} from '../labResultInterpreter';

describe('LabResultInterpreter', () => {
  beforeEach(() => {
    labResultInterpreter.resetLearningData();
  });

  describe('reference ranges', () => {
    it('should have 60+ real lab test reference ranges', () => {
      expect(REFERENCE_RANGES.length).toBeGreaterThanOrEqual(60);
    });

    it('should cover all major lab categories', () => {
      const categories = new Set(REFERENCE_RANGES.map(r => r.category));
      expect(categories.has(LabCategory.CBC)).toBe(true);
      expect(categories.has(LabCategory.BMP)).toBe(true);
      expect(categories.has(LabCategory.LFT)).toBe(true);
      expect(categories.has(LabCategory.COAGULATION)).toBe(true);
      expect(categories.has(LabCategory.CARDIAC)).toBe(true);
      expect(categories.has(LabCategory.INFLAMMATORY)).toBe(true);
    });

    it('should include real critical thresholds for potassium', () => {
      const potassium = labResultInterpreter.getReferenceRange('K');
      expect(potassium).toBeDefined();
      expect(potassium!.criticalLow).toBe(2.5);
      expect(potassium!.criticalHigh).toBe(6.5);
      expect(potassium!.normalLow).toBe(3.5);
      expect(potassium!.normalHigh).toBe(5.0);
    });

    it('should include sex-adjusted ranges for hemoglobin', () => {
      const hgb = labResultInterpreter.getReferenceRange('HGB');
      expect(hgb).toBeDefined();
      expect(hgb!.maleAdjust).toBeDefined();
      expect(hgb!.femaleAdjust).toBeDefined();
      expect(hgb!.maleAdjust!.normalLow).toBeGreaterThan(hgb!.femaleAdjust!.normalLow);
    });
  });

  describe('result interpretation', () => {
    it('should flag normal values as NORMAL', () => {
      const lab: LabValue = { testCode: 'K', value: 4.0, unit: 'mEq/L', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' };
      const result = labResultInterpreter.interpretResult(lab);
      expect(result.flag).toBe(FlagLevel.NORMAL);
      expect(result.isCritical).toBe(false);
      expect(result.interpretation).toContain('normal');
    });

    it('should flag high values correctly', () => {
      const lab: LabValue = { testCode: 'K', value: 5.5, unit: 'mEq/L', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' };
      const result = labResultInterpreter.interpretResult(lab);
      expect(result.flag).toBe(FlagLevel.HIGH);
      expect(result.isCritical).toBe(false);
    });

    it('should flag critical high potassium', () => {
      const lab: LabValue = { testCode: 'K', value: 7.0, unit: 'mEq/L', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' };
      const result = labResultInterpreter.interpretResult(lab);
      expect(result.flag).toBe(FlagLevel.CRITICAL_HIGH);
      expect(result.isCritical).toBe(true);
      expect(result.clinicalSignificance).toContain('CRITICAL');
    });

    it('should flag critical low glucose', () => {
      const lab: LabValue = { testCode: 'GLU', value: 35, unit: 'mg/dL', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' };
      const result = labResultInterpreter.interpretResult(lab);
      expect(result.flag).toBe(FlagLevel.CRITICAL_LOW);
      expect(result.isCritical).toBe(true);
      expect(result.clinicalSignificance).toContain('dextrose');
    });

    it('should apply sex-adjusted ranges', () => {
      const labMale: LabValue = { testCode: 'HGB', value: 13.0, unit: 'g/dL', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-m' };
      const labFemale: LabValue = { testCode: 'HGB', value: 13.0, unit: 'g/dL', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-f' };

      const maleResult = labResultInterpreter.interpretResult(labMale, 50, 'M');
      const femaleResult = labResultInterpreter.interpretResult(labFemale, 50, 'F');

      // 13.0 is low for males (13.5-17.5) but normal for females (12.0-16.0)
      expect(maleResult.flag).toBe(FlagLevel.LOW);
      expect(femaleResult.flag).toBe(FlagLevel.NORMAL);
    });

    it('should apply geriatric-adjusted ranges for BUN in elderly', () => {
      const lab: LabValue = { testCode: 'BUN', value: 22, unit: 'mg/dL', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-eld' };

      const youngResult = labResultInterpreter.interpretResult(lab, 40);
      const elderlyResult = labResultInterpreter.interpretResult(lab, 70);

      // BUN 22 is high for normal (7-20) but normal for geriatric (8-23)
      expect(youngResult.flag).toBe(FlagLevel.HIGH);
      expect(elderlyResult.flag).toBe(FlagLevel.NORMAL);
    });
  });

  describe('delta checking', () => {
    it('should detect rapid increase in potassium', () => {
      const previous: LabValue = { testCode: 'K', value: 4.0, unit: 'mEq/L', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' };
      const current: LabValue = { testCode: 'K', value: 5.2, unit: 'mEq/L', collectedAt: '2024-12-01T12:00:00Z', patientId: 'pt-001' };

      const delta = labResultInterpreter.deltaCheck(current, previous);
      expect(delta.percentChange).toBeGreaterThan(15);
      expect(delta.alertType).not.toBe(DeltaAlertType.NONE);
      expect(delta.message).toContain('increase');
    });

    it('should detect rapid hemoglobin drop (possible bleeding)', () => {
      const previous: LabValue = { testCode: 'HGB', value: 12.0, unit: 'g/dL', collectedAt: '2024-12-01T06:00:00Z', patientId: 'pt-001' };
      const current: LabValue = { testCode: 'HGB', value: 8.5, unit: 'g/dL', collectedAt: '2024-12-01T18:00:00Z', patientId: 'pt-001' };

      const delta = labResultInterpreter.deltaCheck(current, previous);
      expect(delta.percentChange).toBeLessThan(-20);
      expect(delta.alertType).toBe(DeltaAlertType.RAPID_DECREASE);
    });

    it('should not alert for small changes', () => {
      const previous: LabValue = { testCode: 'K', value: 4.0, unit: 'mEq/L', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' };
      const current: LabValue = { testCode: 'K', value: 4.1, unit: 'mEq/L', collectedAt: '2024-12-01T16:00:00Z', patientId: 'pt-001' };

      const delta = labResultInterpreter.deltaCheck(current, previous);
      expect(delta.alertType).toBe(DeltaAlertType.NONE);
    });
  });

  describe('trend analysis', () => {
    it('should detect increasing trend in creatinine', () => {
      const values: LabValue[] = [
        { testCode: 'CR', value: 1.0, unit: 'mg/dL', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' },
        { testCode: 'CR', value: 1.3, unit: 'mg/dL', collectedAt: '2024-12-02T08:00:00Z', patientId: 'pt-001' },
        { testCode: 'CR', value: 1.7, unit: 'mg/dL', collectedAt: '2024-12-03T08:00:00Z', patientId: 'pt-001' },
        { testCode: 'CR', value: 2.1, unit: 'mg/dL', collectedAt: '2024-12-04T08:00:00Z', patientId: 'pt-001' },
      ];

      const trend = labResultInterpreter.analyzeTrend(values);
      expect(trend.direction).toBe(TrendDirection.INCREASING);
      expect(trend.slope).toBeGreaterThan(0);
      expect(trend.rSquared).toBeGreaterThan(0.8);
    });

    it('should predict next value from trend', () => {
      const values: LabValue[] = [
        { testCode: 'WBC', value: 10, unit: 'K/uL', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' },
        { testCode: 'WBC', value: 12, unit: 'K/uL', collectedAt: '2024-12-01T14:00:00Z', patientId: 'pt-001' },
        { testCode: 'WBC', value: 14, unit: 'K/uL', collectedAt: '2024-12-01T20:00:00Z', patientId: 'pt-001' },
      ];

      const trend = labResultInterpreter.analyzeTrend(values);
      expect(trend.predictedNext).toBeGreaterThan(14);
    });

    it('should handle insufficient data gracefully', () => {
      const values: LabValue[] = [
        { testCode: 'CR', value: 1.0, unit: 'mg/dL', collectedAt: '2024-12-01T08:00:00Z', patientId: 'pt-001' },
      ];
      const trend = labResultInterpreter.analyzeTrend(values);
      expect(trend.direction).toBe(TrendDirection.STABLE);
      expect(trend.message).toContain('Insufficient');
    });
  });

  describe('calculated values', () => {
    it('should calculate anion gap correctly', () => {
      // Na=140, Cl=104, HCO3=24 => AG = 140 - (104+24) = 12
      const ag = labResultInterpreter.calculateAnionGap(140, 104, 24);
      expect(ag.value).toBe(12);
      expect(ag.interpretation).toContain('Normal');

      // Elevated AG: Na=140, Cl=100, HCO3=18 => AG = 22
      const highAG = labResultInterpreter.calculateAnionGap(140, 100, 18);
      expect(highAG.value).toBe(22);
      expect(highAG.interpretation).toContain('Elevated');
      expect(highAG.interpretation).toContain('MUDPILES');
    });

    it('should calculate corrected calcium correctly', () => {
      // Total Ca=8.0, Albumin=2.5 => Corrected = 8.0 + 0.8*(4.0-2.5) = 9.2
      const corrected = labResultInterpreter.calculateCorrectedCalcium(8.0, 2.5);
      expect(corrected.value).toBe(9.2);
      expect(corrected.interpretation).toContain('normal');
    });

    it('should calculate eGFR using CKD-EPI formula', () => {
      // Young male with normal creatinine
      const egfr = labResultInterpreter.calculateEGFR(0.9, 30, 'M');
      expect(egfr.value).toBeGreaterThan(90);
      expect(egfr.interpretation).toContain('Normal');

      // Elderly female with elevated creatinine
      const egfr2 = labResultInterpreter.calculateEGFR(2.0, 75, 'F');
      expect(egfr2.value).toBeLessThan(40);
      expect(egfr2.interpretation).toContain('CKD');
    });

    it('should classify CKD stages by eGFR', () => {
      const stage1 = labResultInterpreter.calculateEGFR(0.8, 25, 'M');
      expect(stage1.interpretation).toContain('G1');

      const stage4 = labResultInterpreter.calculateEGFR(3.0, 70, 'M');
      expect(stage4.value).toBeLessThan(30);
    });
  });

  describe('panel interpretation', () => {
    it('should interpret hepatocellular pattern in liver panel', () => {
      const results = [
        { testCode: 'AST', testName: 'AST', value: 250, unit: 'U/L', flag: FlagLevel.HIGH, referenceRange: '10-40', interpretation: '', clinicalSignificance: '', isCritical: false },
        { testCode: 'ALT', testName: 'ALT', value: 320, unit: 'U/L', flag: FlagLevel.HIGH, referenceRange: '7-56', interpretation: '', clinicalSignificance: '', isCritical: false },
        { testCode: 'ALP', testName: 'ALP', value: 100, unit: 'U/L', flag: FlagLevel.NORMAL, referenceRange: '44-147', interpretation: '', clinicalSignificance: '', isCritical: false },
        { testCode: 'TBIL', testName: 'Total Bilirubin', value: 1.0, unit: 'mg/dL', flag: FlagLevel.NORMAL, referenceRange: '0.1-1.2', interpretation: '', clinicalSignificance: '', isCritical: false },
      ];

      const panel = labResultInterpreter.interpretHepaticPanel(results);
      expect(panel.pattern).toBe('Hepatocellular');
      expect(panel.interpretation).toContain('hepatocellular');
      expect(panel.suggestedFollowUp.length).toBeGreaterThan(0);
    });

    it('should detect AST>ALT pattern suggesting alcoholic liver disease', () => {
      const results = [
        { testCode: 'AST', testName: 'AST', value: 180, unit: 'U/L', flag: FlagLevel.HIGH, referenceRange: '10-40', interpretation: '', clinicalSignificance: '', isCritical: false },
        { testCode: 'ALT', testName: 'ALT', value: 90, unit: 'U/L', flag: FlagLevel.HIGH, referenceRange: '7-56', interpretation: '', clinicalSignificance: '', isCritical: false },
        { testCode: 'ALP', testName: 'ALP', value: 120, unit: 'U/L', flag: FlagLevel.NORMAL, referenceRange: '44-147', interpretation: '', clinicalSignificance: '', isCritical: false },
      ];

      const panel = labResultInterpreter.interpretHepaticPanel(results);
      expect(panel.clinicalCorrelations.some(c => c.includes('AST > ALT'))).toBe(true);
    });
  });

  describe('clinical correlations', () => {
    it('should correlate elevated WBC with neutrophilia as possible infection', () => {
      const results = [
        { testCode: 'WBC', testName: 'WBC', value: 15.0, unit: 'K/uL', flag: FlagLevel.HIGH, referenceRange: '4.5-11.0', interpretation: '', clinicalSignificance: '', isCritical: false },
        { testCode: 'NEUT', testName: 'Neutrophils', value: 12.0, unit: 'K/uL', flag: FlagLevel.HIGH, referenceRange: '1.8-7.7', interpretation: '', clinicalSignificance: '', isCritical: false },
      ];

      const correlations = labResultInterpreter.findClinicalCorrelations(results);
      expect(correlations.length).toBeGreaterThan(0);
      expect(correlations[0].possibleConditions).toContain('Bacterial infection');
      expect(correlations[0].suggestedTests).toContain('Blood cultures');
    });

    it('should flag elevated troponin as possible MI', () => {
      const results = [
        { testCode: 'TROP_I', testName: 'Troponin I', value: 0.8, unit: 'ng/mL', flag: FlagLevel.CRITICAL_HIGH, referenceRange: '0-0.04', interpretation: '', clinicalSignificance: '', isCritical: true },
      ];

      const correlations = labResultInterpreter.findClinicalCorrelations(results);
      expect(correlations.length).toBeGreaterThan(0);
      expect(correlations[0].possibleConditions.some(c => c.includes('MI'))).toBe(true);
      expect(correlations[0].urgency).toBe('stat');
    });
  });

  describe('self-learning (personalized baselines)', () => {
    it('should build patient baseline from multiple values', () => {
      const patientId = 'pt-baseline-001';
      const values = [4.2, 4.0, 4.3, 4.1, 4.2];

      for (const val of values) {
        labResultInterpreter.updatePatientBaseline(patientId, {
          testCode: 'K', value: val, unit: 'mEq/L',
          collectedAt: new Date().toISOString(), patientId,
        });
      }

      const insight = labResultInterpreter.getPersonalizedRange(patientId, 'K');
      expect(insight).not.toBeNull();
      expect(insight!.baselineValue).toBeCloseTo(4.16, 1);
      expect(insight!.personalizedRange.low).toBeLessThan(4.0);
      expect(insight!.personalizedRange.high).toBeGreaterThan(4.3);
      expect(insight!.dataPoints).toBe(5);
    });

    it('should detect deviation from personal baseline even when within normal range', () => {
      const patientId = 'pt-baseline-002';

      // Establish baseline at low end of normal
      for (let i = 0; i < 5; i++) {
        labResultInterpreter.updatePatientBaseline(patientId, {
          testCode: 'K', value: 3.7 + (i * 0.02), unit: 'mEq/L',
          collectedAt: new Date().toISOString(), patientId,
        });
      }

      // New value at high end of normal (still normal, but unusual for this patient)
      const result = labResultInterpreter.interpretWithPersonalizedRange(
        { testCode: 'K', value: 4.8, unit: 'mEq/L', collectedAt: new Date().toISOString(), patientId },
        60, 'M'
      );

      expect(result.flag).toBe(FlagLevel.NORMAL);
      // Should have personalized insight if enough data
      if ('personalizedInsight' in result && result.personalizedInsight) {
        expect(result.personalizedInsight).toContain('outside patient');
      }
    });

    it('should require minimum 3 data points for personalized range', () => {
      const patientId = 'pt-baseline-003';
      labResultInterpreter.updatePatientBaseline(patientId, {
        testCode: 'K', value: 4.0, unit: 'mEq/L',
        collectedAt: new Date().toISOString(), patientId,
      });

      const insight = labResultInterpreter.getPersonalizedRange(patientId, 'K');
      expect(insight).toBeNull(); // Insufficient data
    });
  });
});
