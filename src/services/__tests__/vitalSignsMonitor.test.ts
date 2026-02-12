import { describe, it, expect } from 'vitest';
import {
  vitalSignsMonitor,
  VitalSignType,
  ClinicalRisk,
} from '../vitalSignsMonitor';

describe('VitalSignsMonitor', () => {
  // Use the singleton which auto-generates data on first use
  describe('data generation and initialization', () => {
    it('should have generated patient profiles', () => {
      const stats = vitalSignsMonitor.getDatasetStatistics();

      expect(stats.totalPatients).toBeGreaterThan(0);
      expect(stats.totalReadings).toBeGreaterThan(0);
      expect(stats.averageReadingsPerPatient).toBeGreaterThan(0);
    });

    it('should have valid risk distribution', () => {
      const stats = vitalSignsMonitor.getDatasetStatistics();

      expect(stats.riskDistribution).toBeDefined();
      expect(stats.riskDistribution[ClinicalRisk.LOW]).toBeGreaterThanOrEqual(0);
      expect(stats.riskDistribution[ClinicalRisk.HIGH]).toBeGreaterThanOrEqual(0);

      // Sum of risk distribution should equal total patients
      const totalInDistribution = Object.values(stats.riskDistribution).reduce(
        (sum, val) => sum + val,
        0,
      );
      expect(totalInDistribution).toBe(stats.totalPatients);
    });

    it('should provide population normal ranges', () => {
      const ranges = vitalSignsMonitor.getPopulationNormalRanges();

      expect(ranges[VitalSignType.HEART_RATE]).toBeDefined();
      expect(ranges[VitalSignType.HEART_RATE].min).toBe(60);
      expect(ranges[VitalSignType.HEART_RATE].max).toBe(100);
      expect(ranges[VitalSignType.HEART_RATE].unit).toBe('bpm');

      expect(ranges[VitalSignType.TEMPERATURE]).toBeDefined();
      expect(ranges[VitalSignType.TEMPERATURE].unit).toBe('°C');

      expect(ranges[VitalSignType.SPO2]).toBeDefined();
      expect(ranges[VitalSignType.SPO2].min).toBe(95);
    });
  });

  describe('NEWS2 scoring', () => {
    it('should calculate NEWS2 score for a patient', () => {
      const patients = vitalSignsMonitor.getPatientsByRisk();
      expect(patients.length).toBeGreaterThan(0);

      const first = patients[0];
      expect(first.news2Score).toBeDefined();
      expect(first.news2Score.aggregateScore).toBeGreaterThanOrEqual(0);
      expect(Object.values(ClinicalRisk)).toContain(first.news2Score.clinicalRisk);
      expect(first.news2Score.recommendedResponse).toBeTruthy();
    });

    it('should sort patients by risk level (highest first)', () => {
      const patients = vitalSignsMonitor.getPatientsByRisk();
      const riskOrder: Record<string, number> = {
        [ClinicalRisk.HIGH]: 0,
        [ClinicalRisk.MEDIUM]: 1,
        [ClinicalRisk.LOW_MEDIUM]: 2,
        [ClinicalRisk.LOW]: 3,
      };

      for (let i = 1; i < patients.length; i++) {
        const prevRisk = riskOrder[patients[i - 1].news2Score.clinicalRisk] ?? 99;
        const currRisk = riskOrder[patients[i].news2Score.clinicalRisk] ?? 99;
        expect(prevRisk).toBeLessThanOrEqual(currRisk);
      }
    });
  });

  describe('patient summary', () => {
    it('should return a comprehensive patient summary', () => {
      const patients = vitalSignsMonitor.getPatientsByRisk();
      const patientId = patients[0].patientId;

      const summary = vitalSignsMonitor.getPatientSummary(patientId);
      expect(summary).not.toBeNull();
      expect(summary!.patientId).toBe(patientId);
      expect(summary!.profile).toBeDefined();
      expect(summary!.latestReadings).toBeDefined();
      expect(summary!.currentNEWS2).toBeDefined();
      expect(summary!.readingCount).toBeGreaterThan(0);
    });

    it('should return null for an unknown patient', () => {
      const summary = vitalSignsMonitor.getPatientSummary('nonexistent-patient');
      expect(summary).toBeNull();
    });
  });

  describe('adding readings', () => {
    it('should add a manual reading for a patient', () => {
      const patients = vitalSignsMonitor.getPatientsByRisk();
      const patientId = patients[0].patientId;
      const countBefore = vitalSignsMonitor.getTotalReadingCount();

      vitalSignsMonitor.addReading({
        id: `manual-test-${Date.now()}`,
        patientId,
        timestamp: new Date().toISOString(),
        type: VitalSignType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        source: 'manual',
      });

      const countAfter = vitalSignsMonitor.getTotalReadingCount();
      expect(countAfter).toBe(countBefore + 1);
    });
  });

  describe('temperature conversion utilities', () => {
    it('should convert Celsius to Fahrenheit correctly', () => {
      // VitalSignsMonitor class is not exported; access static methods via singleton's constructor
      const MonitorClass = Object.getPrototypeOf(vitalSignsMonitor).constructor;
      expect(MonitorClass.toFahrenheit(37)).toBeCloseTo(98.6, 0);
      expect(MonitorClass.toFahrenheit(0)).toBeCloseTo(32, 0);
      expect(MonitorClass.toFahrenheit(100)).toBeCloseTo(212, 0);
    });

    it('should convert Fahrenheit to Celsius correctly', () => {
      const MonitorClass = Object.getPrototypeOf(vitalSignsMonitor).constructor;
      expect(MonitorClass.toCelsius(98.6)).toBeCloseTo(37, 0);
      expect(MonitorClass.toCelsius(32)).toBeCloseTo(0, 0);
      expect(MonitorClass.toCelsius(212)).toBeCloseTo(100, 0);
    });
  });
});
