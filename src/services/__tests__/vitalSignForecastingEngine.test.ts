import { describe, it, expect, beforeEach } from 'vitest';
import {
  vitalSignForecastingEngine,
  VitalType,
  NEWS2Risk,
  MEWSRisk,
  TriggerType,
  type VitalReading,
} from '../vitalSignForecastingEngine';

describe('VitalSignForecastingEngine', () => {
  beforeEach(() => {
    vitalSignForecastingEngine.resetLearningData();
  });

  describe('NEWS2 scoring (real clinical criteria)', () => {
    it('should score normal vitals as LOW risk (score 0)', () => {
      const news = vitalSignForecastingEngine.calculateNEWS2(
        16,    // RR
        97,    // SpO2
        120,   // SBP
        72,    // HR
        37.0,  // Temp
        'A',   // Alert
        false  // Not on oxygen
      );
      expect(news.totalScore).toBe(0);
      expect(news.riskLevel).toBe(NEWS2Risk.LOW);
    });

    it('should score septic-appearing patient as HIGH risk', () => {
      const news = vitalSignForecastingEngine.calculateNEWS2(
        28,    // RR >= 25 = 3
        91,    // SpO2 <= 91 = 3
        88,    // SBP <= 90 = 3
        135,   // HR >= 131 = 3
        39.5,  // Temp >= 39.1 = 2
        'C',   // Confused = 3
        true   // On oxygen = 2
      );
      expect(news.totalScore).toBeGreaterThanOrEqual(7);
      expect(news.riskLevel).toBe(NEWS2Risk.HIGH);
      expect(news.clinicalResponse).toContain('Emergency');
      expect(news.monitoringFrequency).toContain('Continuous');
    });

    it('should correctly score each NEWS2 component', () => {
      // Test respiratory rate scoring
      const news = vitalSignForecastingEngine.calculateNEWS2(7, 97, 120, 72, 37, 'A', false);
      expect(news.componentScores.respiratoryRate).toBe(3); // RR <= 8

      const news2 = vitalSignForecastingEngine.calculateNEWS2(10, 97, 120, 72, 37, 'A', false);
      expect(news2.componentScores.respiratoryRate).toBe(1); // RR 9-11

      const news3 = vitalSignForecastingEngine.calculateNEWS2(15, 97, 120, 72, 37, 'A', false);
      expect(news3.componentScores.respiratoryRate).toBe(0); // RR 12-20
    });

    it('should flag any single parameter of 3 as at least LOW_MEDIUM risk', () => {
      // Only extreme HR, everything else normal
      const news = vitalSignForecastingEngine.calculateNEWS2(
        15, 97, 120, 38, 37, 'A', false  // HR <= 40 = 3
      );
      expect(news.componentScores.heartRate).toBe(3);
      // Total could be 3, which triggers LOW_MEDIUM or MEDIUM
      expect([NEWS2Risk.LOW_MEDIUM, NEWS2Risk.MEDIUM]).toContain(news.riskLevel);
    });

    it('should support SpO2 Scale 2 for COPD patients', () => {
      // SpO2 93% - normal on Scale 1, but scored 1 on Scale 2
      const scale1 = vitalSignForecastingEngine.calculateNEWS2(16, 93, 120, 72, 37, 'A', false, false);
      const scale2 = vitalSignForecastingEngine.calculateNEWS2(16, 93, 120, 72, 37, 'A', false, true);

      expect(scale1.componentScores.spo2).toBe(2); // Scale 1: 93 = 2
      expect(scale2.componentScores.spo2).toBe(1); // Scale 2: 93-94 = 1
    });
  });

  describe('MEWS scoring', () => {
    it('should score normal vitals as LOW risk', () => {
      const mews = vitalSignForecastingEngine.calculateMEWS(120, 80, 14, 37, 'A');
      expect(mews.totalScore).toBe(0);
      expect(mews.riskLevel).toBe(MEWSRisk.LOW);
    });

    it('should score critical patient as CRITICAL', () => {
      const mews = vitalSignForecastingEngine.calculateMEWS(70, 135, 32, 39, 'U');
      expect(mews.totalScore).toBeGreaterThanOrEqual(5);
      expect(mews.riskLevel).toBe(MEWSRisk.CRITICAL);
      expect(mews.clinicalResponse).toContain('Immediate');
    });

    it('should correctly score consciousness levels', () => {
      const alert = vitalSignForecastingEngine.calculateMEWS(120, 80, 14, 37, 'A');
      expect(alert.componentScores.consciousness).toBe(0);

      const verbal = vitalSignForecastingEngine.calculateMEWS(120, 80, 14, 37, 'V');
      expect(verbal.componentScores.consciousness).toBe(1);

      const pain = vitalSignForecastingEngine.calculateMEWS(120, 80, 14, 37, 'P');
      expect(pain.componentScores.consciousness).toBe(2);

      const unresponsive = vitalSignForecastingEngine.calculateMEWS(120, 80, 14, 37, 'U');
      expect(unresponsive.componentScores.consciousness).toBe(3);
    });
  });

  describe('forecasting algorithms', () => {
    it('should perform simple exponential smoothing', () => {
      const values = [80, 82, 85, 83, 84, 86];
      const forecast = vitalSignForecastingEngine.simpleExponentialSmoothing(values, 0.3, 3);

      expect(forecast).toHaveLength(3);
      // Forecast should be near the smoothed level
      for (const f of forecast) {
        expect(f).toBeGreaterThan(75);
        expect(f).toBeLessThan(95);
      }
    });

    it('should perform double exponential smoothing (Holt method)', () => {
      // Increasing trend
      const values = [80, 82, 84, 86, 88, 90];
      const forecast = vitalSignForecastingEngine.doubleExponentialSmoothing(values, 0.3, 0.1, 3);

      expect(forecast).toHaveLength(3);
      // Should project increasing trend
      expect(forecast[0]).toBeGreaterThan(88);
      expect(forecast[2]).toBeGreaterThan(forecast[0]);
    });

    it('should calculate moving average with configurable window', () => {
      const values = [80, 85, 82, 88, 84, 86, 83];
      const ma = vitalSignForecastingEngine.movingAverage(values, 3);

      expect(ma.length).toBeGreaterThan(0);
      // Each MA value should be within the range of values
      for (const val of ma) {
        expect(val).toBeGreaterThanOrEqual(80);
        expect(val).toBeLessThanOrEqual(88);
      }
    });

    it('should calculate confidence intervals', () => {
      const values = [80, 82, 81, 83, 82, 84];
      const ci = vitalSignForecastingEngine.calculateConfidenceInterval(values, 83);

      expect(ci.upper).toBeGreaterThan(83);
      expect(ci.lower).toBeLessThan(83);
      expect(ci.upper - ci.lower).toBeGreaterThan(0);
    });

    it('should forecast vital signs with full pipeline', () => {
      const readings: VitalReading[] = [];
      for (let i = 0; i < 12; i++) {
        readings.push({
          type: VitalType.HEART_RATE,
          value: 80 + i * 0.5 + (Math.sin(i) * 2),
          timestamp: new Date(Date.now() - (12 - i) * 60 * 60 * 1000).toISOString(),
          patientId: 'pt-001',
        });
      }

      const forecast = vitalSignForecastingEngine.forecastVitalSigns(readings, 6);

      expect(forecast.type).toBe(VitalType.HEART_RATE);
      expect(forecast.forecastedValues).toHaveLength(6);
      expect(forecast.method).toBe('double_exponential_smoothing'); // >=10 data points
      expect(forecast.confidence).toBeGreaterThan(0);

      // Each forecast point should have bounds
      for (const point of forecast.forecastedValues) {
        expect(point.upperBound).toBeGreaterThanOrEqual(point.value);
        expect(point.lowerBound).toBeLessThanOrEqual(point.value);
        expect(point.hoursAhead).toBeGreaterThan(0);
      }
    });
  });

  describe('trigger detection', () => {
    it('should detect critical HR threshold breach', () => {
      const readings: VitalReading[] = [
        { type: VitalType.HEART_RATE, value: 100, timestamp: new Date(Date.now() - 60000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.HEART_RATE, value: 140, timestamp: new Date().toISOString(), patientId: 'pt-001' },
      ];

      const triggers = vitalSignForecastingEngine.detectTriggers(readings);
      expect(triggers.length).toBeGreaterThan(0);
      expect(triggers[0].severity).toBe('critical');
      expect(triggers[0].type).toBe(TriggerType.THRESHOLD_BREACH);
    });

    it('should detect warning-level SpO2 drop', () => {
      const readings: VitalReading[] = [
        { type: VitalType.SPO2, value: 96, timestamp: new Date(Date.now() - 60000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.SPO2, value: 93, timestamp: new Date().toISOString(), patientId: 'pt-001' },
      ];

      const triggers = vitalSignForecastingEngine.detectTriggers(readings);
      const thresholdTrigger = triggers.find(t => t.type === TriggerType.THRESHOLD_BREACH);
      expect(thresholdTrigger).toBeDefined();
      expect(thresholdTrigger!.severity).toBe('warning');
    });

    it('should detect rapid change in vital signs', () => {
      const readings: VitalReading[] = [
        { type: VitalType.HEART_RATE, value: 80, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.HEART_RATE, value: 120, timestamp: new Date().toISOString(), patientId: 'pt-001' },
      ];

      const triggers = vitalSignForecastingEngine.detectTriggers(readings);
      const rapidChange = triggers.find(t => t.type === TriggerType.RAPID_CHANGE);
      expect(rapidChange).toBeDefined();
      expect(rapidChange!.severity).toBe('urgent');
    });

    it('should not trigger for normal vital signs', () => {
      const readings: VitalReading[] = [
        { type: VitalType.HEART_RATE, value: 75, timestamp: new Date(Date.now() - 60000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.HEART_RATE, value: 78, timestamp: new Date().toISOString(), patientId: 'pt-001' },
      ];

      const triggers = vitalSignForecastingEngine.detectTriggers(readings);
      expect(triggers).toHaveLength(0);
    });
  });

  describe('vital trend analysis', () => {
    it('should identify worsening trend (HR rising above normal)', () => {
      const readings: VitalReading[] = [
        { type: VitalType.HEART_RATE, value: 105, timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.HEART_RATE, value: 108, timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.HEART_RATE, value: 112, timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.HEART_RATE, value: 115, timestamp: new Date(Date.now() - 3600000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.HEART_RATE, value: 120, timestamp: new Date().toISOString(), patientId: 'pt-001' },
      ];

      const trend = vitalSignForecastingEngine.analyzeVitalTrend(readings);
      expect(trend.direction).toBe('worsening');
      expect(trend.slope).toBeGreaterThan(0);
    });

    it('should identify improving trend (SpO2 rising)', () => {
      const readings: VitalReading[] = [
        { type: VitalType.SPO2, value: 92, timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.SPO2, value: 94, timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.SPO2, value: 96, timestamp: new Date(Date.now() - 3600000).toISOString(), patientId: 'pt-001' },
        { type: VitalType.SPO2, value: 97, timestamp: new Date().toISOString(), patientId: 'pt-001' },
      ];

      const trend = vitalSignForecastingEngine.analyzeVitalTrend(readings);
      expect(trend.direction).toBe('improving');
    });
  });

  describe('synthetic dataset', () => {
    it('should generate post-op recovery curves with 200+ data points', () => {
      const dataset = vitalSignForecastingEngine.generateSyntheticDataset();
      let totalPoints = 0;

      for (const [, readings] of dataset) {
        totalPoints += readings.length;
        expect(readings.length).toBeGreaterThan(0);

        // All readings should have valid values
        for (const r of readings) {
          expect(r.value).toBeGreaterThan(0);
          expect(r.timestamp).toBeTruthy();
        }
      }

      expect(totalPoints).toBeGreaterThanOrEqual(200);
    });

    it('should generate realistic post-op HR recovery pattern', () => {
      const readings = vitalSignForecastingEngine.generatePostOpRecoveryCurve(VitalType.HEART_RATE, 5);
      expect(readings.length).toBeGreaterThan(20);

      // Early HR should be elevated
      const earlyReadings = readings.slice(0, 6);
      const lateReadings = readings.slice(-6);
      const earlyAvg = earlyReadings.reduce((sum, r) => sum + r.value, 0) / earlyReadings.length;
      const lateAvg = lateReadings.reduce((sum, r) => sum + r.value, 0) / lateReadings.length;

      // HR should generally decrease over recovery
      expect(earlyAvg).toBeGreaterThan(lateAvg);
    });
  });

  describe('self-learning', () => {
    it('should track forecast accuracy', () => {
      vitalSignForecastingEngine.recordPrediction(VitalType.HEART_RATE, 'ses', 85, 82);
      vitalSignForecastingEngine.recordPrediction(VitalType.HEART_RATE, 'ses', 87, 88);
      vitalSignForecastingEngine.recordPrediction(VitalType.HEART_RATE, 'ses', 90, 86);

      const accuracy = vitalSignForecastingEngine.getForcastAccuracy(VitalType.HEART_RATE, 'ses');
      expect(accuracy.predictions).toBe(3);
      expect(accuracy.mae).toBeGreaterThan(0);
      expect(accuracy.rmse).toBeGreaterThan(0);
    });

    it('should optimize smoothing parameters from historical data', () => {
      const values = Array.from({ length: 30 }, (_, i) => 80 + i * 0.5 + Math.sin(i) * 3);
      const params = vitalSignForecastingEngine.optimizeSmoothingParameters(VitalType.HEART_RATE, values);

      expect(params.alpha).toBeGreaterThanOrEqual(0.1);
      expect(params.alpha).toBeLessThanOrEqual(0.9);
      expect(params.beta).toBeGreaterThanOrEqual(0.05);
      expect(params.beta).toBeLessThanOrEqual(0.5);
    });

    it('should return default parameters with insufficient data', () => {
      const params = vitalSignForecastingEngine.optimizeSmoothingParameters(VitalType.HEART_RATE, [80, 82]);
      expect(params.alpha).toBe(0.3);
      expect(params.beta).toBe(0.1);
    });
  });
});
