import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAnalyticsService,
  getAnalyticsService,
  type AnalyticsService,
} from '../analyticsService';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = createAnalyticsService();
  });

  describe('initialization', () => {
    it('should create a service with a populated data pipeline', () => {
      expect(service).toBeDefined();
      expect(service.pipeline).toBeDefined();
      expect(service.pipeline.patients.length).toBeGreaterThan(0);
      expect(service.pipeline.snapshots.length).toBeGreaterThan(0);
    });

    it('getAnalyticsService should return a singleton instance', () => {
      const instance1 = getAnalyticsService();
      const instance2 = getAnalyticsService();
      // Both calls should return the same reference
      expect(instance1).toBe(instance2);
    });
  });

  describe('patient analytics', () => {
    it('should compute a recovery progress score for a patient', () => {
      const patientId = service.pipeline.patients[0].patientId;
      const score = service.getRecoveryProgressScore(patientId);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.painManagement).toBeGreaterThanOrEqual(0);
      expect(score.medicationAdherence).toBeGreaterThanOrEqual(0);
      expect(score.exerciseCompliance).toBeGreaterThanOrEqual(0);
      expect(score.missionCompletion).toBeGreaterThanOrEqual(0);
      expect(score.engagement).toBeGreaterThanOrEqual(0);
      expect(score.vitalStability).toBeGreaterThanOrEqual(0);
      expect(['improving', 'stable', 'declining']).toContain(score.trend);
    });

    it('should compute pain trend for a patient', () => {
      const patientId = service.pipeline.patients[0].patientId;
      const painTrend = service.getPainTrend(patientId);

      expect(painTrend.dates.length).toBeGreaterThan(0);
      expect(painTrend.values.length).toBe(painTrend.dates.length);
      expect(painTrend.average).toBeGreaterThanOrEqual(0);
      expect(painTrend.average).toBeLessThanOrEqual(10);
      expect(painTrend.min).toBeLessThanOrEqual(painTrend.max);
      expect(['decreasing', 'stable', 'increasing']).toContain(painTrend.trend);
    });

    it('should compute streak stats for a patient', () => {
      const patientId = service.pipeline.patients[0].patientId;
      const stats = service.getStreakStats(patientId);

      expect(stats.currentStreak).toBeGreaterThanOrEqual(0);
      expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak);
      expect(stats.totalActiveDays).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.streakHistory)).toBe(true);
    });

    it('should compute medication adherence for a patient', () => {
      const patientId = service.pipeline.patients[0].patientId;
      const adherence = service.getMedicationAdherence(patientId);

      expect(adherence).toBeDefined();
    });
  });

  describe('population analytics', () => {
    it('should compute population overview', () => {
      const overview = service.getPopulationOverview();

      expect(overview.totalPatients).toBeGreaterThan(0);
      expect(overview.activePatients).toBeGreaterThanOrEqual(0);
      expect(overview.avgRecoveryScore).toBeGreaterThanOrEqual(0);
      expect(overview.avgRecoveryScore).toBeLessThanOrEqual(100);
      expect(overview.riskDistribution).toBeDefined();
      expect(overview.surgeryBreakdown).toBeDefined();
    });

    it('should compute average recovery times by surgery type', () => {
      const times = service.getAverageRecoveryTimes();

      expect(Array.isArray(times)).toBe(true);
      for (const entry of times) {
        expect(entry.surgeryType).toBeTruthy();
        expect(entry.avgDays).toBeGreaterThan(0);
        expect(entry.medianDays).toBeGreaterThanOrEqual(0);
        expect(entry.sampleSize).toBeGreaterThan(0);
      }
    });
  });

  describe('time-series analysis', () => {
    it('should compute a moving average', () => {
      const data = [
        { date: '2025-01-01', value: 10 },
        { date: '2025-01-02', value: 12 },
        { date: '2025-01-03', value: 8 },
        { date: '2025-01-04', value: 14 },
        { date: '2025-01-05', value: 11 },
        { date: '2025-01-06', value: 13 },
        { date: '2025-01-07', value: 9 },
      ];
      const ma = service.getMovingAverage(data, 3);

      expect(ma.length).toBe(data.length);
      // First points where window is incomplete may equal raw values
      // Later points should be smoothed averages
      expect(typeof ma[ma.length - 1].value).toBe('number');
    });

    it('should compute a trend line', () => {
      const data = [
        { date: '2025-01-01', value: 7 },
        { date: '2025-01-02', value: 6 },
        { date: '2025-01-03', value: 5 },
        { date: '2025-01-04', value: 4 },
        { date: '2025-01-05', value: 3 },
      ];
      const trend = service.getTrendLine(data);

      expect(trend).toBeDefined();
      expect(trend.predicted.length).toBe(data.length);
    });
  });

  describe('export', () => {
    it('should export patient data as CSV', () => {
      const csv = service.exportPatientsCSV();
      expect(csv).toContain('patientId');
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });

    it('should export data as JSON', () => {
      const json = service.exportJSON({ test: true });
      expect(json).toBe('{\n  "test": true\n}');
    });
  });
});
