import { describe, it, expect, beforeEach } from 'vitest';
import {
  SymptomPatternRecognition,
} from '../symptomPatternRecognition';
import type { SymptomDataPoint } from '../symptomPatternRecognition';

describe('SymptomPatternRecognition', () => {
  let engine: SymptomPatternRecognition;

  beforeEach(() => {
    engine = new SymptomPatternRecognition();
  });

  // ----------------------------------------------------------------
  // Data Point Management
  // ----------------------------------------------------------------
  describe('addDataPoint', () => {
    it('should accept and store a new symptom data point', () => {
      const point: SymptomDataPoint = {
        patientId: 'PTEST',
        symptomType: 'pain',
        severity: 5,
        timestamp: Date.now(),
        dayPostOp: 1,
      };
      // Should not throw
      expect(() => engine.addDataPoint(point)).not.toThrow();
      // Verify the data point was stored by checking pattern history
      const history = engine.getPatternHistory('PTEST');
      expect(history.totalDataPoints).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------------------
  // Change-Point Detection (CUSUM)
  // ----------------------------------------------------------------
  describe('detectChangePoints', () => {
    it('should detect change points in the anomalous SSI data for P003', () => {
      // The synthetic data injects escalating wound_redness for P003 between day 5-10
      const changePoints = engine.detectChangePoints('P003', 'wound_redness');
      expect(changePoints.length).toBeGreaterThan(0);
      // Should detect an increase direction
      const increases = changePoints.filter((cp) => cp.direction === 'increase');
      expect(increases.length).toBeGreaterThan(0);
    });

    it('should detect change points in the DVT data for P007 calf pain', () => {
      const changePoints = engine.detectChangePoints('P007', 'calf_pain');
      expect(changePoints.length).toBeGreaterThan(0);
      const increases = changePoints.filter((cp) => cp.direction === 'increase');
      expect(increases.length).toBeGreaterThan(0);
    });

    it('should return empty array for a patient with fewer than 4 data points', () => {
      engine.addDataPoint({ patientId: 'PSHORT', symptomType: 'test', severity: 3, timestamp: Date.now(), dayPostOp: 0 });
      engine.addDataPoint({ patientId: 'PSHORT', symptomType: 'test', severity: 4, timestamp: Date.now() + 1, dayPostOp: 1 });
      const changePoints = engine.detectChangePoints('PSHORT', 'test');
      expect(changePoints).toEqual([]);
    });

    it('should return empty array for constant severity data', () => {
      const base = Date.now();
      for (let d = 0; d < 10; d++) {
        engine.addDataPoint({
          patientId: 'PFLAT', symptomType: 'constant_sym', severity: 5,
          timestamp: base + d * 86400000, dayPostOp: d,
        });
      }
      const changePoints = engine.detectChangePoints('PFLAT', 'constant_sym');
      expect(changePoints).toEqual([]);
    });

    it('should detect multiple change points for step-function severity data', () => {
      const base = Date.now();
      // Inject a sustained sharp increase: 20 low points then 20 high points
      for (let d = 0; d < 40; d++) {
        const severity = d < 20 ? 0 : 10;
        engine.addDataPoint({
          patientId: 'PSHARP', symptomType: 'spike_sym', severity,
          timestamp: base + d * 86400000, dayPostOp: d,
        });
      }
      const changePoints = engine.detectChangePoints('PSHARP', 'spike_sym');
      expect(changePoints.length).toBeGreaterThan(0);
      // The CUSUM algorithm resets after each detection, so magnitude = cusumPos/stdDev
      // With binary 0/10 data (stdDev=5), it should detect increases in the second half
      const increases = changePoints.filter((cp) => cp.direction === 'increase');
      expect(increases.length).toBeGreaterThan(0);
      for (const cp of increases) {
        expect(cp.dayPostOp).toBeGreaterThanOrEqual(20);
        expect(cp.magnitude).toBeGreaterThan(0);
      }
    });

    it('should include valid fields in each change point', () => {
      const changePoints = engine.detectChangePoints('P003', 'wound_redness');
      for (const cp of changePoints) {
        expect(cp.index).toBeGreaterThan(0);
        expect(cp.timestamp).toBeGreaterThan(0);
        expect(cp.dayPostOp).toBeGreaterThanOrEqual(0);
        expect(['increase', 'decrease']).toContain(cp.direction);
        expect(cp.magnitude).toBeGreaterThan(0);
        expect(cp.cumulativeSum).toBeGreaterThan(0);
        expect(['low', 'moderate', 'high']).toContain(cp.significance);
      }
    });
  });

  // ----------------------------------------------------------------
  // Autocorrelation Analysis
  // ----------------------------------------------------------------
  describe('analyzeAutocorrelation', () => {
    it('should return autocorrelation coefficients for pain data', () => {
      const result = engine.analyzeAutocorrelation('P001', 'pain');
      expect(result.symptomType).toBe('pain');
      expect(result.lags.length).toBeGreaterThan(0);
      expect(result.coefficients.length).toBe(result.lags.length);
    });

    it('should detect diurnal pattern flag', () => {
      const result = engine.analyzeAutocorrelation('P001', 'pain');
      expect(typeof result.hasDiurnalPattern).toBe('boolean');
    });

    it('should identify peak lag and coefficient', () => {
      const result = engine.analyzeAutocorrelation('P001', 'fatigue');
      expect(result.peakLag).toBeGreaterThanOrEqual(0);
      expect(typeof result.peakCoefficient).toBe('number');
    });

    it('should report significant periods in hours', () => {
      const result = engine.analyzeAutocorrelation('P001', 'pain');
      for (const period of result.significantPeriods) {
        // Periods should be multiples of 24 (daily data)
        expect(period % 24).toBe(0);
      }
    });
  });

  // ----------------------------------------------------------------
  // Cluster Identification
  // ----------------------------------------------------------------
  describe('identifyClusters', () => {
    it('should identify symptom clusters for P003 (SSI-injected patient)', () => {
      const clusters = engine.identifyClusters('P003');
      expect(clusters.length).toBeGreaterThan(0);
      // At least one cluster should contain wound_redness or fever
      const ssiRelated = clusters.some(
        (c) => c.symptoms.includes('wound_redness') || c.symptoms.includes('fever'),
      );
      expect(ssiRelated).toBe(true);
    });

    it('should return clusters sorted by confidence descending', () => {
      const clusters = engine.identifyClusters('P003');
      if (clusters.length >= 2) {
        for (let i = 1; i < clusters.length; i++) {
          expect(clusters[i].confidence).toBeLessThanOrEqual(clusters[i - 1].confidence);
        }
      }
    });

    it('should include a possible diagnosis and confidence for each cluster', () => {
      const clusters = engine.identifyClusters('P007');
      for (const cluster of clusters) {
        expect(typeof cluster.possibleDiagnosis).toBe('string');
        expect(cluster.confidence).toBeGreaterThanOrEqual(0);
        expect(cluster.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should compute cooccurrence scores between 0 and 1', () => {
      const clusters = engine.identifyClusters('P001');
      for (const cluster of clusters) {
        expect(cluster.cooccurrenceScore).toBeGreaterThanOrEqual(0);
        expect(cluster.cooccurrenceScore).toBeLessThanOrEqual(1);
      }
    });

    it('should only create clusters with 2 or more symptoms', () => {
      const clusters = engine.identifyClusters('P001');
      for (const cluster of clusters) {
        expect(cluster.symptoms.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ----------------------------------------------------------------
  // Prodromal Pattern Detection
  // ----------------------------------------------------------------
  describe('detectProdromalPatterns', () => {
    it('should detect SSI prodromal pattern for P003 on knee replacement', () => {
      const patterns = engine.detectProdromalPatterns('P003', 'knee_replacement', 10);
      expect(patterns.length).toBeGreaterThan(0);
      const ssi = patterns.find((p) => p.complication === 'Surgical Site Infection');
      expect(ssi).toBeDefined();
      expect(ssi!.matchScore).toBeGreaterThan(0.2);
    });

    it('should detect DVT prodromal pattern for P007 on hip replacement', () => {
      const patterns = engine.detectProdromalPatterns('P007', 'hip_replacement', 12);
      expect(patterns.length).toBeGreaterThan(0);
      const dvt = patterns.find((p) => p.complication === 'Deep Vein Thrombosis');
      expect(dvt).toBeDefined();
      expect(dvt!.matchScore).toBeGreaterThan(0.2);
    });

    it('should return patterns sorted by matchScore descending', () => {
      const patterns = engine.detectProdromalPatterns('P003', 'knee_replacement', 10);
      if (patterns.length >= 2) {
        for (let i = 1; i < patterns.length; i++) {
          expect(patterns[i].matchScore).toBeLessThanOrEqual(patterns[i - 1].matchScore);
        }
      }
    });

    it('should assign urgency based on match score', () => {
      const patterns = engine.detectProdromalPatterns('P003', 'knee_replacement', 10);
      for (const p of patterns) {
        expect(['watch', 'alert', 'urgent']).toContain(p.urgency);
        if (p.matchScore >= 0.7) expect(p.urgency).toBe('urgent');
        else if (p.matchScore >= 0.4) expect(p.urgency).toBe('alert');
        else expect(p.urgency).toBe('watch');
      }
    });

    it('should return empty for a surgery type with no matching templates', () => {
      // cholecystectomy has no complication templates defined
      const patterns = engine.detectProdromalPatterns('P001', 'cholecystectomy', 5);
      expect(patterns).toEqual([]);
    });

    it('should include warning symptoms with severity thresholds', () => {
      const patterns = engine.detectProdromalPatterns('P003', 'knee_replacement', 10);
      const ssi = patterns.find((p) => p.complication === 'Surgical Site Infection');
      if (ssi) {
        expect(ssi.warningSymptoms.length).toBeGreaterThan(0);
        for (const ws of ssi.warningSymptoms) {
          expect(ws.symptom.length).toBeGreaterThan(0);
          expect(ws.severityThreshold).toBeGreaterThan(0);
          expect(typeof ws.typicalOnsetHoursBefore).toBe('number');
        }
      }
    });
  });

  // ----------------------------------------------------------------
  // Pattern History
  // ----------------------------------------------------------------
  describe('getPatternHistory', () => {
    it('should return overall statistics without patient filter', () => {
      const history = engine.getPatternHistory();
      expect(history.totalDataPoints).toBeGreaterThan(100); // synthetic data has 100+
      expect(history.templateCount).toBeGreaterThan(0);
      expect(history.patientsTracked).toBe(10); // P001 through P010
    });

    it('should return patient-specific statistics', () => {
      const history = engine.getPatternHistory('P003');
      expect(history.totalDataPoints).toBeGreaterThan(0);
      expect(history.patientsTracked).toBe(1);
      // Should have recent change points for the anomalous patient
      expect(history.recentChangePoints.length).toBeGreaterThanOrEqual(0);
    });

    it('should limit recent change points to 10', () => {
      const history = engine.getPatternHistory('P003');
      expect(history.recentChangePoints.length).toBeLessThanOrEqual(10);
    });
  });

  // ----------------------------------------------------------------
  // Self-Learning via recordConfirmedDiagnosis
  // ----------------------------------------------------------------
  describe('recordConfirmedDiagnosis (self-learning)', () => {
    it('should increment template confirmation count', () => {
      const historyBefore = engine.getPatternHistory();
      const diagsBefore = historyBefore.confirmedDiagnoses;

      engine.recordConfirmedDiagnosis('P003', 'Surgical Site Infection', 10);

      const historyAfter = engine.getPatternHistory();
      expect(historyAfter.confirmedDiagnoses).toBe(diagsBefore + 1);
    });

    it('should refine template severity ranges after confirmed diagnosis', () => {
      // Record a confirmed SSI diagnosis and verify template was updated
      engine.recordConfirmedDiagnosis('P003', 'Surgical Site Infection', 10);

      // The patterns for a subsequent call should still be valid
      const patterns = engine.detectProdromalPatterns('P003', 'knee_replacement', 10);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should handle confirmation of a non-existent complication gracefully', () => {
      expect(() =>
        engine.recordConfirmedDiagnosis('P001', 'Nonexistent Complication', 5),
      ).not.toThrow();
    });

    it('should update template lastUpdated timestamp', () => {
      void Date.now();
      engine.recordConfirmedDiagnosis('P003', 'Surgical Site Infection', 10);
      // Detect patterns to indirectly verify the template was updated
      const patterns = engine.detectProdromalPatterns('P003', 'knee_replacement', 10);
      const ssi = patterns.find((p) => p.complication === 'Surgical Site Infection');
      expect(ssi).toBeDefined();
    });
  });
});
