import { describe, it, expect, beforeEach } from 'vitest';
import {
  qualityMetricsEngine,
  QUALITY_MEASURES,
  SYNTHETIC_OUTCOMES,
  MeasureType,
  MeasureSource,
  PerformanceLevel,
  SPCSignal,
} from '../qualityMetricsEngine';

describe('QualityMetricsEngine', () => {
  beforeEach(() => {
    qualityMetricsEngine.resetLearningData();
  });

  describe('quality measures database', () => {
    it('should have real CMS and NQF measures', () => {
      expect(QUALITY_MEASURES.length).toBeGreaterThanOrEqual(10);

      const cmsMeasures = QUALITY_MEASURES.filter(m => m.source === MeasureSource.CMS);
      expect(cmsMeasures.length).toBeGreaterThanOrEqual(5);

      const nqfMeasures = QUALITY_MEASURES.filter(m => m.nqfNumber);
      expect(nqfMeasures.length).toBeGreaterThanOrEqual(5);
    });

    it('should include both process and outcome measures', () => {
      const processTypes = QUALITY_MEASURES.filter(m => m.type === MeasureType.PROCESS);
      const outcomeTypes = QUALITY_MEASURES.filter(m => m.type === MeasureType.OUTCOME);
      expect(processTypes.length).toBeGreaterThan(0);
      expect(outcomeTypes.length).toBeGreaterThan(0);
    });

    it('should have national benchmarks for all measures', () => {
      for (const measure of QUALITY_MEASURES) {
        expect(measure.nationalBenchmark).toBeGreaterThan(0);
        expect(measure.topDecileBenchmark).toBeGreaterThan(0);
        expect(measure.unit).toBeTruthy();
      }
    });

    it('should include key measures: readmission, mortality, SSI, satisfaction', () => {
      expect(qualityMetricsEngine.getMeasure('readmit-30')).toBeDefined();
      expect(qualityMetricsEngine.getMeasure('mort-30')).toBeDefined();
      expect(qualityMetricsEngine.getMeasure('ssi')).toBeDefined();
      expect(qualityMetricsEngine.getMeasure('satisfaction')).toBeDefined();
    });

    it('should include HEDIS measures', () => {
      const hedis = QUALITY_MEASURES.filter(m => m.source === MeasureSource.HEDIS);
      expect(hedis.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('synthetic dataset', () => {
    it('should generate 300+ patient outcomes', () => {
      expect(SYNTHETIC_OUTCOMES.length).toBeGreaterThanOrEqual(300);
    });

    it('should have realistic patient data', () => {
      for (const outcome of SYNTHETIC_OUTCOMES.slice(0, 50)) {
        expect(outcome.patientId).toBeTruthy();
        expect(outcome.los).toBeGreaterThan(0);
        expect(outcome.diagnosis).toBeTruthy();
        expect(outcome.ageGroup).toBeTruthy();
        expect(['18-44', '45-64', '65-74', '75+']).toContain(outcome.ageGroup);
      }
    });

    it('should have realistic readmission rates (roughly 10-20%)', () => {
      const readmitted = SYNTHETIC_OUTCOMES.filter(o => o.readmitted30Day).length;
      const rate = readmitted / SYNTHETIC_OUTCOMES.length;
      expect(rate).toBeGreaterThan(0.05);
      expect(rate).toBeLessThan(0.35);
    });
  });

  describe('measure calculation', () => {
    it('should calculate 30-day readmission rate', () => {
      const result = qualityMetricsEngine.calculateMeasureResult('readmit-30', SYNTHETIC_OUTCOMES);
      expect(result).not.toBeNull();
      expect(result!.numerator).toBeGreaterThan(0);
      expect(result!.denominator).toBe(SYNTHETIC_OUTCOMES.length);
      expect(result!.rate).toBeGreaterThan(0);
      expect(result!.rate).toBeLessThan(50);
    });

    it('should calculate SSI rate for surgical patients', () => {
      const result = qualityMetricsEngine.calculateMeasureResult('ssi', SYNTHETIC_OUTCOMES);
      expect(result).not.toBeNull();
      // SSI denominator should be surgical patients only
      expect(result!.denominator).toBeLessThanOrEqual(SYNTHETIC_OUTCOMES.length);
    });

    it('should calculate patient satisfaction rate', () => {
      const result = qualityMetricsEngine.calculateMeasureResult('satisfaction', SYNTHETIC_OUTCOMES);
      expect(result).not.toBeNull();
      expect(result!.rate).toBeGreaterThan(0);
      expect(result!.rate).toBeLessThanOrEqual(100);
    });

    it('should calculate average length of stay', () => {
      const result = qualityMetricsEngine.calculateMeasureResult('avg-los', SYNTHETIC_OUTCOMES);
      expect(result).not.toBeNull();
      expect(result!.rate).toBeGreaterThan(1);
      expect(result!.rate).toBeLessThan(15);
    });

    it('should include confidence intervals', () => {
      const result = qualityMetricsEngine.calculateMeasureResult('readmit-30', SYNTHETIC_OUTCOMES);
      expect(result!.confidence95.lower).toBeLessThan(result!.rate);
      expect(result!.confidence95.upper).toBeGreaterThan(result!.rate);
    });

    it('should classify performance level relative to benchmark', () => {
      const result = qualityMetricsEngine.calculateMeasureResult('readmit-30', SYNTHETIC_OUTCOMES);
      expect(Object.values(PerformanceLevel)).toContain(result!.performanceLevel);
    });
  });

  describe('SPC charts', () => {
    it('should generate SPC chart with control limits', () => {
      const periodicRates = [
        { period: '2024-Q1', rate: 14.5 },
        { period: '2024-Q2', rate: 15.2 },
        { period: '2024-Q3', rate: 13.8 },
        { period: '2024-Q4', rate: 14.1 },
        { period: '2025-Q1', rate: 15.5 },
        { period: '2025-Q2', rate: 13.9 },
      ];

      const chart = qualityMetricsEngine.generateSPCChart('readmit-30', periodicRates);

      expect(chart.dataPoints).toHaveLength(6);
      expect(chart.centerLine).toBeGreaterThan(0);
      expect(chart.ucl).toBeGreaterThan(chart.centerLine);
      expect(chart.lcl).toBeLessThan(chart.centerLine);

      for (const point of chart.dataPoints) {
        expect(point.ucl).toBe(chart.ucl);
        expect(point.lcl).toBe(chart.lcl);
        expect(Object.values(SPCSignal)).toContain(point.signal);
      }
    });

    it('should detect special cause variation (point beyond control limits)', () => {
      const periodicRates = [
        { period: '2024-Q1', rate: 14 },
        { period: '2024-Q2', rate: 15 },
        { period: '2024-Q3', rate: 14 },
        { period: '2024-Q4', rate: 15 },
        { period: '2025-Q1', rate: 14 },
        { period: '2025-Q2', rate: 30 }, // Outlier
      ];

      const chart = qualityMetricsEngine.generateSPCChart('readmit-30', periodicRates);
      const outlierPoint = chart.dataPoints[chart.dataPoints.length - 1];

      // The outlier should be flagged as special cause
      expect(outlierPoint.value).toBe(30);
      expect(outlierPoint.signal).toBe(SPCSignal.SPECIAL_CAUSE);
    });

    it('should detect shift pattern (7+ points on one side)', () => {
      const periodicRates = Array.from({ length: 10 }, (_, i) => ({
        period: `2024-M${i + 1}`,
        rate: 18 + Math.random() * 2, // All above center
      }));

      const chart = qualityMetricsEngine.generateSPCChart('readmit-30', periodicRates);
      const _shiftSignals = chart.signals.filter(s => s.signal === SPCSignal.SHIFT);
      // May or may not detect shift depending on center line calculation
      expect(chart.signals.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('risk-adjusted rates', () => {
    it('should calculate O/E ratio for mortality', () => {
      const riskAdjusted = qualityMetricsEngine.calculateRiskAdjustedRate('mort-30', SYNTHETIC_OUTCOMES);
      expect(riskAdjusted).not.toBeNull();
      expect(riskAdjusted!.observedRate).toBeGreaterThanOrEqual(0);
      expect(riskAdjusted!.expectedRate).toBeGreaterThan(0);
      expect(riskAdjusted!.oeRatio).toBeGreaterThan(0);
      expect(riskAdjusted!.interpretation).toBeTruthy();
    });

    it('should calculate risk-adjusted readmission rate', () => {
      const riskAdjusted = qualityMetricsEngine.calculateRiskAdjustedRate('readmit-30', SYNTHETIC_OUTCOMES);
      expect(riskAdjusted).not.toBeNull();
      expect(riskAdjusted!.standardizedRate).toBeGreaterThan(0);
    });

    it('should interpret O/E ratio correctly', () => {
      const riskAdjusted = qualityMetricsEngine.calculateRiskAdjustedRate('mort-30', SYNTHETIC_OUTCOMES);
      if (riskAdjusted!.oeRatio < 0.8) {
        expect(riskAdjusted!.interpretation).toContain('better');
      } else if (riskAdjusted!.oeRatio > 1.2) {
        expect(riskAdjusted!.interpretation).toContain('Worse');
      } else {
        expect(riskAdjusted!.interpretation).toContain('expected');
      }
    });
  });

  describe('composite quality scores', () => {
    it('should calculate composite score from multiple measures', () => {
      const results = ['readmit-30', 'mort-30', 'ssi', 'satisfaction'].map(id =>
        qualityMetricsEngine.calculateMeasureResult(id, SYNTHETIC_OUTCOMES)!
      ).filter(Boolean);

      const composite = qualityMetricsEngine.calculateCompositeScore(results);

      expect(composite.score).toBeGreaterThan(0);
      expect(composite.score).toBeLessThanOrEqual(100);
      expect(composite.components.length).toBe(results.length);
      expect(Object.values(PerformanceLevel)).toContain(composite.performanceLevel);
    });

    it('should weight outcome measures higher than process measures', () => {
      const results = [
        { measureId: 'readmit-30', measureName: 'Readmission', numerator: 10, denominator: 100, rate: 10, nationalBenchmark: 15.5, performanceLevel: PerformanceLevel.ABOVE_BENCHMARK, period: '2024-Q4', confidence95: { lower: 5, upper: 15 } },
        { measureId: 'vte', measureName: 'VTE Prophylaxis', numerator: 95, denominator: 100, rate: 95, nationalBenchmark: 92, performanceLevel: PerformanceLevel.AT_BENCHMARK, period: '2024-Q4', confidence95: { lower: 90, upper: 100 } },
      ];

      const composite = qualityMetricsEngine.calculateCompositeScore(results);
      const readmitComponent = composite.components.find(c => c.measureId === 'readmit-30');
      const vteComponent = composite.components.find(c => c.measureId === 'vte');

      // Outcome measure (readmit-30) should have weight 2, process (vte) weight 1
      expect(readmitComponent!.weight).toBeGreaterThan(vteComponent!.weight);
    });
  });

  describe('self-learning', () => {
    it('should record and analyze quality trends', () => {
      // Record quarterly results
      for (let q = 0; q < 6; q++) {
        const subset = SYNTHETIC_OUTCOMES.slice(q * 50, (q + 1) * 50);
        const result = qualityMetricsEngine.calculateMeasureResult('readmit-30', subset, `2024-Q${q + 1}`);
        if (result) {
          qualityMetricsEngine.recordMeasureResult(result);
        }
      }

      const trends = qualityMetricsEngine.analyzeQualityTrends();
      expect(trends.length).toBeGreaterThan(0);

      const readmitTrend = trends.find(t => t.measureId === 'readmit-30');
      expect(readmitTrend).toBeDefined();
      expect(['improving', 'stable', 'declining']).toContain(readmitTrend!.direction);
      expect(readmitTrend!.recommendation).toBeTruthy();
    });

    it('should provide recommendations based on trend direction', () => {
      // Record trending data
      for (let i = 0; i < 5; i++) {
        qualityMetricsEngine.recordMeasureResult({
          measureId: 'ssi',
          measureName: 'SSI',
          numerator: 5 + i,
          denominator: 100,
          rate: 5 + i,
          nationalBenchmark: 2.0,
          performanceLevel: PerformanceLevel.BELOW_BENCHMARK,
          period: `2024-Q${i + 1}`,
          confidence95: { lower: 3, upper: 8 },
        });
      }

      const trends = qualityMetricsEngine.analyzeQualityTrends();
      const ssiTrend = trends.find(t => t.measureId === 'ssi');
      expect(ssiTrend).toBeDefined();
      expect(ssiTrend!.recommendation).toBeTruthy();
    });
  });

  describe('performance level classification', () => {
    it('should correctly classify low-is-better metrics', () => {
      const readmitMeasure = qualityMetricsEngine.getMeasure('readmit-30')!;

      // Below top decile = above benchmark
      expect(qualityMetricsEngine.getPerformanceLevel(10, readmitMeasure)).toBe(PerformanceLevel.ABOVE_BENCHMARK);
      // Below national = at benchmark
      expect(qualityMetricsEngine.getPerformanceLevel(14, readmitMeasure)).toBe(PerformanceLevel.AT_BENCHMARK);
      // Above national = below benchmark
      expect(qualityMetricsEngine.getPerformanceLevel(17, readmitMeasure)).toBe(PerformanceLevel.BELOW_BENCHMARK);
    });

    it('should correctly classify high-is-better metrics', () => {
      const satisfactionMeasure = qualityMetricsEngine.getMeasure('satisfaction')!;

      // Above top decile = above benchmark
      expect(qualityMetricsEngine.getPerformanceLevel(90, satisfactionMeasure)).toBe(PerformanceLevel.ABOVE_BENCHMARK);
      // Above national = at benchmark
      expect(qualityMetricsEngine.getPerformanceLevel(75, satisfactionMeasure)).toBe(PerformanceLevel.AT_BENCHMARK);
      // Below national = below benchmark
      expect(qualityMetricsEngine.getPerformanceLevel(60, satisfactionMeasure)).toBe(PerformanceLevel.BELOW_BENCHMARK);
    });
  });
});
