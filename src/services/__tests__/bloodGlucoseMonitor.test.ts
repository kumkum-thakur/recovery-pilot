import { describe, it, expect } from 'vitest';
import {
  bloodGlucoseMonitor,
  classifyGlucose,
  calculateCorrectionFactor,
  generateSlidingScale,
  getCorrectionDose,
  generateHypoglycemiaProtocol,
  estimateHbA1c,
  calculateTimeInRange,
  GlucoseStatus,
  InsulinType,
  HypoSeverity,
  SlidingScaleIntensity,
  INSULIN_PROFILES,
  GLUCOSE_TARGETS,
} from '../bloodGlucoseMonitor';
import type { GlucoseReading } from '../bloodGlucoseMonitor';

function makeReading(value: number): GlucoseReading {
  return {
    timestamp: new Date().toISOString(),
    value,
    status: classifyGlucose(value),
    source: 'fingerstick',
    fasting: false,
  };
}

describe('BloodGlucoseMonitor', () => {
  // ==========================================================================
  // Glucose Classification
  // ==========================================================================
  describe('glucose classification', () => {
    it('should classify severe hypoglycemia (< 54)', () => {
      expect(classifyGlucose(40)).toBe(GlucoseStatus.SEVERE_HYPOGLYCEMIA);
      expect(classifyGlucose(53)).toBe(GlucoseStatus.SEVERE_HYPOGLYCEMIA);
    });

    it('should classify hypoglycemia (54-69)', () => {
      expect(classifyGlucose(54)).toBe(GlucoseStatus.HYPOGLYCEMIA);
      expect(classifyGlucose(69)).toBe(GlucoseStatus.HYPOGLYCEMIA);
    });

    it('should classify in target (140-180 per ADA inpatient)', () => {
      expect(classifyGlucose(140)).toBe(GlucoseStatus.IN_TARGET);
      expect(classifyGlucose(160)).toBe(GlucoseStatus.IN_TARGET);
      expect(classifyGlucose(180)).toBe(GlucoseStatus.IN_TARGET);
    });

    it('should classify above target (181-250)', () => {
      expect(classifyGlucose(200)).toBe(GlucoseStatus.ABOVE_TARGET);
      expect(classifyGlucose(250)).toBe(GlucoseStatus.ABOVE_TARGET);
    });

    it('should classify hyperglycemia (251-400)', () => {
      expect(classifyGlucose(300)).toBe(GlucoseStatus.HYPERGLYCEMIA);
    });

    it('should classify severe hyperglycemia (> 400)', () => {
      expect(classifyGlucose(450)).toBe(GlucoseStatus.SEVERE_HYPERGLYCEMIA);
    });
  });

  // ==========================================================================
  // ADA Glucose Targets
  // ==========================================================================
  describe('ADA glucose targets', () => {
    it('should have correct inpatient targets (140-180)', () => {
      expect(GLUCOSE_TARGETS.generalLow).toBe(140);
      expect(GLUCOSE_TARGETS.generalHigh).toBe(180);
    });

    it('should have correct hypoglycemia threshold (70)', () => {
      expect(GLUCOSE_TARGETS.hypoglycemiaThreshold).toBe(70);
    });

    it('should have correct severe hypoglycemia threshold (54)', () => {
      expect(GLUCOSE_TARGETS.severeHypoglycemia).toBe(54);
    });
  });

  // ==========================================================================
  // Insulin Profiles
  // ==========================================================================
  describe('insulin profiles', () => {
    it('should include at least 8 insulin types', () => {
      expect(INSULIN_PROFILES.length).toBeGreaterThanOrEqual(8);
    });

    it('should have correct rapid-acting onset (15 minutes)', () => {
      const lispro = INSULIN_PROFILES.find(p => p.genericName === 'insulin lispro');
      expect(lispro).toBeDefined();
      expect(lispro!.onsetMinutes).toBe(15);
      expect(lispro!.type).toBe(InsulinType.RAPID_ACTING);
    });

    it('should have correct regular insulin onset (30 minutes)', () => {
      const regular = INSULIN_PROFILES.find(p => p.genericName === 'regular insulin');
      expect(regular!.onsetMinutes).toBe(30);
      expect(regular!.type).toBe(InsulinType.SHORT_ACTING);
    });

    it('should have correct glargine profile (long-acting, peakless)', () => {
      const glargine = INSULIN_PROFILES.find(p => p.genericName === 'insulin glargine');
      expect(glargine!.type).toBe(InsulinType.LONG_ACTING);
      expect(glargine!.durationHours.max).toBeGreaterThanOrEqual(20);
    });

    it('should have correct degludec profile (ultra-long-acting)', () => {
      const degludec = INSULIN_PROFILES.find(p => p.genericName === 'insulin degludec');
      expect(degludec!.type).toBe(InsulinType.ULTRA_LONG_ACTING);
      expect(degludec!.durationHours.min).toBeGreaterThanOrEqual(42);
    });
  });

  // ==========================================================================
  // Correction Factor & ICR
  // ==========================================================================
  describe('correction factor calculation', () => {
    it('should use 1800 rule for rapid-acting insulin', () => {
      // TDD = 40 units => CF = 1800/40 = 45
      const result = calculateCorrectionFactor(40);
      expect(result.correctionFactor).toBe(45);
    });

    it('should use 500 rule for ICR', () => {
      // TDD = 50 units => ICR = 500/50 = 10
      const result = calculateCorrectionFactor(50);
      expect(result.insulinCarbRatio).toBe(10);
    });

    it('should calculate correction dose correctly', () => {
      // Current: 250, Target: 150, CF: 50 => (250-150)/50 = 2 units
      const dose = getCorrectionDose(250, 150, 50);
      expect(dose).toBe(2);
    });

    it('should return 0 dose when at or below target', () => {
      expect(getCorrectionDose(140, 150, 50)).toBe(0);
      expect(getCorrectionDose(150, 150, 50)).toBe(0);
    });

    it('should round dose to nearest 0.5 unit', () => {
      // (230-150)/50 = 1.6 => round to 1.5
      const dose = getCorrectionDose(230, 150, 50);
      expect(dose).toBe(1.5);
    });
  });

  // ==========================================================================
  // Sliding Scale
  // ==========================================================================
  describe('sliding scale protocols', () => {
    it('should generate low-dose sliding scale', () => {
      const scale = generateSlidingScale(SlidingScaleIntensity.LOW);
      expect(scale.scale.length).toBeGreaterThanOrEqual(5);
      expect(scale.scale[0].dose).toBe(1); // Low starts at 1 unit
    });

    it('should generate moderate sliding scale', () => {
      const scale = generateSlidingScale(SlidingScaleIntensity.MODERATE);
      expect(scale.scale[0].dose).toBe(2);
    });

    it('should generate aggressive sliding scale', () => {
      const scale = generateSlidingScale(SlidingScaleIntensity.AGGRESSIVE);
      expect(scale.scale[0].dose).toBe(4);
      // Higher intensity = higher doses
      const maxDose = scale.scale[scale.scale.length - 1].dose;
      expect(maxDose).toBeGreaterThanOrEqual(20);
    });

    it('should include note about holding insulin for hypoglycemia', () => {
      const scale = generateSlidingScale(SlidingScaleIntensity.MODERATE);
      expect(scale.notes.some(n => n.includes('Hold insulin') && n.includes('< 70'))).toBe(true);
    });

    it('should include monitoring instructions', () => {
      const scale = generateSlidingScale(SlidingScaleIntensity.MODERATE);
      expect(scale.monitoring).toContain('Check blood glucose before meals and at bedtime (AC/HS) = 4 times daily minimum');
    });
  });

  // ==========================================================================
  // Hypoglycemia Protocol (15/15 Rule)
  // ==========================================================================
  describe('hypoglycemia protocol', () => {
    it('should classify Level 1 for glucose 54-69', () => {
      const protocol = generateHypoglycemiaProtocol(65, true);
      expect(protocol.severity).toBe(HypoSeverity.LEVEL_1);
      expect(protocol.treatment.some(t => t.includes('15'))).toBe(true); // 15/15 rule
    });

    it('should classify Level 2 for glucose < 54', () => {
      const protocol = generateHypoglycemiaProtocol(45, true);
      expect(protocol.severity).toBe(HypoSeverity.LEVEL_2);
    });

    it('should classify Level 3 for unconscious patient', () => {
      const protocol = generateHypoglycemiaProtocol(50, false);
      expect(protocol.severity).toBe(HypoSeverity.LEVEL_3);
    });

    it('should recommend IV D50 for severe hypoglycemia', () => {
      const protocol = generateHypoglycemiaProtocol(35, false);
      expect(protocol.treatment.some(t => t.includes('D50') || t.includes('Dextrose'))).toBe(true);
      expect(protocol.treatment.some(t => t.includes('Glucagon'))).toBe(true);
    });

    it('should recommend 15g carbohydrate for Level 1', () => {
      const protocol = generateHypoglycemiaProtocol(62, true);
      expect(protocol.treatment.some(t => t.includes('15 grams'))).toBe(true);
    });

    it('should include prevention steps', () => {
      const protocol = generateHypoglycemiaProtocol(55, true);
      expect(protocol.preventionSteps.length).toBeGreaterThan(0);
      expect(protocol.preventionSteps.some(p => p.includes('insulin doses'))).toBe(true);
    });
  });

  // ==========================================================================
  // HbA1c Estimation
  // ==========================================================================
  describe('HbA1c estimation', () => {
    it('should use ADAG formula correctly', () => {
      // A1c = (eAG + 46.7) / 28.7
      // Average glucose 154 => A1c = (154 + 46.7) / 28.7 = 7.0
      const result = estimateHbA1c(154);
      expect(result.estimatedHbA1c).toBeCloseTo(7.0, 0);
    });

    it('should estimate A1c ~5.7 for average glucose ~117', () => {
      const result = estimateHbA1c(117);
      expect(result.estimatedHbA1c).toBeCloseTo(5.7, 0);
    });

    it('should estimate A1c ~9.0 for average glucose ~212', () => {
      const result = estimateHbA1c(212);
      expect(result.estimatedHbA1c).toBeCloseTo(9.0, 0);
    });

    it('should include interpretation', () => {
      const normal = estimateHbA1c(100);
      expect(normal.interpretation).toContain('Normal');

      const poorly = estimateHbA1c(250);
      expect(poorly.interpretation).toContain('poorly controlled');
    });

    it('should include formula reference', () => {
      const result = estimateHbA1c(154);
      expect(result.formula).toContain('ADAG');
    });
  });

  // ==========================================================================
  // Time In Range
  // ==========================================================================
  describe('time in range', () => {
    it('should calculate 100% in range for all normal readings', () => {
      const readings = [120, 140, 160, 175].map(v => makeReading(v));
      const tir = calculateTimeInRange(readings);
      expect(tir.inRangePercent).toBe(100);
      expect(tir.belowRangePercent).toBe(0);
      expect(tir.aboveRangePercent).toBe(0);
    });

    it('should detect below-range readings', () => {
      const readings = [50, 60, 150, 170].map(v => makeReading(v));
      const tir = calculateTimeInRange(readings);
      expect(tir.belowRange).toBe(2);
      expect(tir.belowRangePercent).toBe(50);
    });

    it('should detect above-range readings', () => {
      const readings = [160, 200, 300, 400].map(v => makeReading(v));
      const tir = calculateTimeInRange(readings);
      expect(tir.aboveRange).toBe(3);
    });

    it('should calculate mean glucose', () => {
      const readings = [100, 200].map(v => makeReading(v));
      const tir = calculateTimeInRange(readings);
      expect(tir.meanGlucose).toBe(150);
    });

    it('should calculate glycemic variability (CV%)', () => {
      const readings = [100, 300, 100, 300].map(v => makeReading(v));
      const tir = calculateTimeInRange(readings);
      expect(tir.glycemicVariability).toBeGreaterThan(0);
    });

    it('should return target of 70% TIR', () => {
      const tir = calculateTimeInRange([]);
      expect(tir.targetInRangePercent).toBe(70);
    });
  });

  // ==========================================================================
  // Self-Learning & Dataset
  // ==========================================================================
  describe('self-learning', () => {
    it('should have 100 patients in dataset', () => {
      expect(bloodGlucoseMonitor.getPatientCount()).toBeGreaterThanOrEqual(100);
    });

    it('should track hypo and hyper events', () => {
      const data = bloodGlucoseMonitor.getLearningData();
      expect(data.hypoEvents).toBeGreaterThan(0);
      expect(data.hyperEvents).toBeGreaterThan(0);
    });

    it('should calculate average time in range', () => {
      const data = bloodGlucoseMonitor.getLearningData();
      expect(data.averageTimeInRange).toBeGreaterThan(0);
      expect(data.averageTimeInRange).toBeLessThan(100);
    });

    it('should adjust sensitivity factors for patients with frequent hypos', () => {
      const pid = `hypo-learn-${Date.now()}`;
      // Record many hypo readings
      for (let i = 0; i < 10; i++) {
        bloodGlucoseMonitor.recordReading(pid, 55);
      }
      const data = bloodGlucoseMonitor.getLearningData();
      const factor = data.adjustedSensitivityFactors[pid];
      expect(factor).toBeDefined();
      expect(factor).toBeGreaterThan(1.0); // More sensitive = increase factor
    });

    it('should record readings and update profile', () => {
      const pid = `record-test-${Date.now()}`;
      bloodGlucoseMonitor.recordReading(pid, 150);
      bloodGlucoseMonitor.recordReading(pid, 200);
      const profile = bloodGlucoseMonitor.getPatientProfile(pid);
      expect(profile).not.toBeNull();
      expect(profile!.readings.length).toBe(2);
      expect(profile!.timeInRange.totalReadings).toBe(2);
    });
  });
});
