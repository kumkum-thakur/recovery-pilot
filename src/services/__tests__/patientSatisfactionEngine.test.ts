import { describe, it, expect, beforeEach } from 'vitest';
import {
  PatientSatisfactionEngine,
  SurveyDomain,
} from '../patientSatisfactionEngine';

// Helper: build a full set of HCAHPS responses (all 21 questions)
function buildFullResponses(likertVal: 1 | 2 | 3 | 4, yesNo: 0 | 1, rating10: number, nps: number): Record<string, number> {
  return {
    // Likert-4 questions (hc-1 to hc-12, hc-15 to hc-19)
    'hc-1': likertVal, 'hc-2': likertVal, 'hc-3': likertVal,
    'hc-4': likertVal, 'hc-5': likertVal, 'hc-6': likertVal,
    'hc-7': likertVal, 'hc-8': likertVal,
    'hc-9': likertVal, 'hc-10': likertVal,
    'hc-11': likertVal, 'hc-12': likertVal,
    // Yes/No questions
    'hc-13': yesNo, 'hc-14': yesNo,
    // Likert-4 care transition
    'hc-15': likertVal, 'hc-16': likertVal, 'hc-17': likertVal,
    // Environment
    'hc-18': likertVal, 'hc-19': likertVal,
    // Overall rating (0-10)
    'hc-20': rating10,
    // NPS (0-10)
    'hc-21': nps,
  };
}

describe('PatientSatisfactionEngine', () => {
  let engine: PatientSatisfactionEngine;

  beforeEach(() => {
    engine = new PatientSatisfactionEngine();
  });

  // ----------------------------------------------------------------
  // Survey Creation
  // ----------------------------------------------------------------
  describe('createSurvey', () => {
    it('should create a survey with all HCAHPS questions when no domains specified', () => {
      const { surveyId, questions } = engine.createSurvey('P001');
      expect(surveyId).toContain('P001');
      expect(questions.length).toBe(21);
    });

    it('should filter questions by specified domains', () => {
      const { questions } = engine.createSurvey('P001', ['communication']);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.every((q) => q.domain === 'communication')).toBe(true);
    });

    it('should generate unique survey IDs for multiple calls', () => {
      const s1 = engine.createSurvey('P001');
      const s2 = engine.createSurvey('P001');
      expect(s1.surveyId).not.toBe(s2.surveyId);
    });

    it('should return questions with valid structure', () => {
      const { questions } = engine.createSurvey('P001');
      for (const q of questions) {
        expect(q.id).toBeDefined();
        expect(q.domain).toBeDefined();
        expect(q.text.length).toBeGreaterThan(0);
        expect(['likert_4', 'yes_no', 'nps', 'rating_10']).toContain(q.type);
        expect(q.hcahpsComposite.length).toBeGreaterThan(0);
      }
    });
  });

  // ----------------------------------------------------------------
  // Response Submission
  // ----------------------------------------------------------------
  describe('submitResponse', () => {
    it('should record and return a survey response', () => {
      const { surveyId } = engine.createSurvey('P001');
      const responses = buildFullResponses(4, 1, 9, 10);
      const entry = engine.submitResponse(surveyId, 'P001', responses, 7);
      expect(entry.surveyId).toBe(surveyId);
      expect(entry.patientId).toBe('P001');
      expect(entry.dayPostOp).toBe(7);
      expect(entry.timestamp).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------------------
  // Scoring
  // ----------------------------------------------------------------
  describe('calculateScores', () => {
    it('should return a perfect score for all top-box answers', () => {
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(4, 1, 10, 10), 7);
      const scores = engine.calculateScores(surveyId);
      expect(scores.overall).toBe(100);
      expect(scores.starRating).toBe(5);
      expect(scores.pressGaneyScore).toBe(100);
      // All domain scores should be 100
      const domains: SurveyDomain[] = ['communication', 'pain_management', 'responsiveness', 'environment', 'discharge_info', 'overall'];
      for (const d of domains) {
        expect(scores.domainScores[d]).toBe(100);
      }
    });

    it('should return low scores for all bottom-box answers', () => {
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(1, 0, 0, 0), 7);
      const scores = engine.calculateScores(surveyId);
      expect(scores.overall).toBe(0);
      expect(scores.starRating).toBe(1);
      expect(scores.pressGaneyScore).toBe(0);
    });

    it('should return zeroed scores for a non-existent survey', () => {
      const scores = engine.calculateScores('nonexistent-survey');
      expect(scores.overall).toBe(0);
      expect(scores.starRating).toBe(1);
      expect(scores.pressGaneyScore).toBe(0);
    });

    it('should produce a star rating of 3 for mid-range scores', () => {
      // Likert 3 => (3-1)/3*100 = 66.67, yes/no 1 => 100, rating_10 7 => 70, nps 7 => 70
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(3, 1, 7, 7), 7);
      const scores = engine.calculateScores(surveyId);
      expect(scores.starRating).toBeGreaterThanOrEqual(3);
      expect(scores.starRating).toBeLessThanOrEqual(4);
    });

    it('should calculate top-box percentages per domain', () => {
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(4, 1, 10, 10), 7);
      const scores = engine.calculateScores(surveyId);
      expect(scores.topBoxPercentages['communication']).toBe(100);
      expect(scores.topBoxPercentages['nurse_communication']).toBe(100);
      expect(scores.topBoxPercentages['doctor_communication']).toBe(100);
    });

    it('should calculate top-box at 0% when no answer is top-box', () => {
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(2, 0, 5, 5), 7);
      const scores = engine.calculateScores(surveyId);
      expect(scores.topBoxPercentages['communication']).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  // NPS (Net Promoter Score)
  // ----------------------------------------------------------------
  describe('getNPS', () => {
    it('should return perfect NPS of 100 when all are promoters', () => {
      for (let i = 0; i < 5; i++) {
        const { surveyId } = engine.createSurvey(`P${i}`);
        engine.submitResponse(surveyId, `P${i}`, { 'hc-21': 10 }, 7);
      }
      const nps = engine.getNPS();
      expect(nps.score).toBe(100);
      expect(nps.promoters).toBe(5);
      expect(nps.passives).toBe(0);
      expect(nps.detractors).toBe(0);
      expect(nps.totalResponses).toBe(5);
    });

    it('should return NPS of -100 when all are detractors', () => {
      for (let i = 0; i < 5; i++) {
        const { surveyId } = engine.createSurvey(`P${i}`);
        engine.submitResponse(surveyId, `P${i}`, { 'hc-21': 3 }, 7);
      }
      const nps = engine.getNPS();
      expect(nps.score).toBe(-100);
      expect(nps.detractors).toBe(5);
    });

    it('should compute NPS correctly with a mixed population', () => {
      // 3 promoters (9,10,9), 1 passive (7), 1 detractor (4)
      const npsValues = [9, 10, 9, 7, 4];
      for (let i = 0; i < npsValues.length; i++) {
        const { surveyId } = engine.createSurvey(`P${i}`);
        engine.submitResponse(surveyId, `P${i}`, { 'hc-21': npsValues[i] }, 7);
      }
      const nps = engine.getNPS();
      // (3 - 1) / 5 * 100 = 40
      expect(nps.score).toBe(40);
      expect(nps.promoters).toBe(3);
      expect(nps.passives).toBe(1);
      expect(nps.detractors).toBe(1);
    });

    it('should filter NPS by patient IDs', () => {
      const npsValues = [10, 10, 2, 2, 2];
      for (let i = 0; i < npsValues.length; i++) {
        const { surveyId } = engine.createSurvey(`P${i}`);
        engine.submitResponse(surveyId, `P${i}`, { 'hc-21': npsValues[i] }, 7);
      }
      const nps = engine.getNPS(['P0', 'P1']);
      expect(nps.score).toBe(100);
      expect(nps.totalResponses).toBe(2);
    });

    it('should return 0 when there are no NPS responses', () => {
      const nps = engine.getNPS();
      expect(nps.score).toBe(0);
      expect(nps.totalResponses).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  // Benchmarks
  // ----------------------------------------------------------------
  describe('getBenchmarks', () => {
    it('should return benchmark comparisons for all six domains', () => {
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(3, 1, 7, 7), 7);
      const benchmarks = engine.getBenchmarks(surveyId);
      expect(benchmarks.length).toBe(6);
      const domains: SurveyDomain[] = ['communication', 'pain_management', 'responsiveness', 'environment', 'discharge_info', 'overall'];
      const benchDomains = benchmarks.map((b) => b.domain);
      for (const d of domains) {
        expect(benchDomains).toContain(d);
      }
    });

    it('should place a perfect survey at a high percentile', () => {
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(4, 1, 10, 10), 7);
      const benchmarks = engine.getBenchmarks(surveyId);
      for (const b of benchmarks) {
        expect(b.percentileRank).toBeGreaterThanOrEqual(90);
        expect(b.score).toBeGreaterThan(b.nationalMean);
      }
    });

    it('should include national mean, median, and top decile threshold', () => {
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(3, 1, 7, 7), 7);
      const benchmarks = engine.getBenchmarks(surveyId);
      for (const b of benchmarks) {
        expect(b.nationalMean).toBeGreaterThan(0);
        expect(b.nationalMedian).toBeGreaterThan(0);
        expect(b.topDecileThreshold).toBeGreaterThan(b.nationalMean);
        expect(b.percentileRank).toBeGreaterThanOrEqual(1);
        expect(b.percentileRank).toBeLessThanOrEqual(99);
      }
    });
  });

  // ----------------------------------------------------------------
  // Trend Analysis
  // ----------------------------------------------------------------
  describe('analyzeTrends', () => {
    it('should return sorted trend points for multiple surveys', () => {
      const s1 = engine.createSurvey('P001');
      engine.submitResponse(s1.surveyId, 'P001', buildFullResponses(2, 0, 5, 5), 3);
      const s2 = engine.createSurvey('P001');
      engine.submitResponse(s2.surveyId, 'P001', buildFullResponses(3, 1, 7, 7), 7);
      const s3 = engine.createSurvey('P001');
      engine.submitResponse(s3.surveyId, 'P001', buildFullResponses(4, 1, 9, 9), 14);

      const trends = engine.analyzeTrends('P001');
      expect(trends.length).toBe(3);
      expect(trends[0].dayPostOp).toBe(3);
      expect(trends[1].dayPostOp).toBe(7);
      expect(trends[2].dayPostOp).toBe(14);
      // Scores should be increasing
      expect(trends[2].overallScore).toBeGreaterThan(trends[0].overallScore);
    });

    it('should return empty array for a patient with no surveys', () => {
      const trends = engine.analyzeTrends('P_NONE');
      expect(trends).toEqual([]);
    });
  });

  // ----------------------------------------------------------------
  // Driver Analysis (self-learning)
  // ----------------------------------------------------------------
  describe('getDriverAnalysis', () => {
    it('should return low-priority drivers with insufficient data', () => {
      const { surveyId } = engine.createSurvey('P001');
      engine.submitResponse(surveyId, 'P001', buildFullResponses(3, 1, 7, 7), 7);
      const drivers = engine.getDriverAnalysis();
      expect(drivers.length).toBe(5);
      expect(drivers.every((d) => d.priority === 'low')).toBe(true);
    });

    it('should compute correlations and improvement potential with sufficient data', () => {
      // Submit 5 varied responses to exceed the minimum threshold
      const ratings: Array<[1 | 2 | 3 | 4, 0 | 1, number, number]> = [
        [1, 0, 2, 2],
        [2, 0, 4, 4],
        [3, 1, 6, 6],
        [4, 1, 8, 8],
        [4, 1, 10, 10],
      ];
      for (let i = 0; i < ratings.length; i++) {
        const { surveyId } = engine.createSurvey(`P${i}`);
        engine.submitResponse(surveyId, `P${i}`, buildFullResponses(...ratings[i]), 7);
      }
      const drivers = engine.getDriverAnalysis();
      expect(drivers.length).toBe(5);
      // At least one domain should have a non-zero correlation
      const hasCorrelation = drivers.some((d) => d.correlationWithOverall !== 0);
      expect(hasCorrelation).toBe(true);
    });
  });
});
