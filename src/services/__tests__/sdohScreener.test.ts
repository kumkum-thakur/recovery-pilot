import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSDOHScreener,
  SDOHDomain,
  ScreeningToolType,
  RiskLevel,
  ResourceCategory,
  SDOH_Z_CODES,
  type SDOHScreener,
  type ScreeningResponse,
} from '../sdohScreener';

describe('SDOHScreener', () => {
  let screener: SDOHScreener;

  beforeEach(() => {
    screener = createSDOHScreener();
  });

  describe('Z-Code Database', () => {
    it('should contain real ICD-10-CM Z-codes for SDOH conditions', () => {
      expect(SDOH_Z_CODES.HOMELESSNESS.code).toBe('Z59.00');
      expect(SDOH_Z_CODES.FOOD_INSECURITY.code).toBe('Z59.41');
      expect(SDOH_Z_CODES.UNEMPLOYMENT.code).toBe('Z56.0');
      expect(SDOH_Z_CODES.SOCIAL_ISOLATION.code).toBe('Z60.9');
      expect(SDOH_Z_CODES.TRANSPORTATION_INSECURITY.code).toBe('Z59.82');
    });

    it('should map Z-codes to correct SDOH domains', () => {
      expect(SDOH_Z_CODES.FOOD_INSECURITY.domain).toBe(SDOHDomain.ECONOMIC_STABILITY);
      expect(SDOH_Z_CODES.HOMELESSNESS.domain).toBe(SDOHDomain.NEIGHBORHOOD_ENVIRONMENT);
      expect(SDOH_Z_CODES.LESS_THAN_HS.domain).toBe(SDOHDomain.EDUCATION_ACCESS);
      expect(SDOH_Z_CODES.SOCIAL_ISOLATION.domain).toBe(SDOHDomain.SOCIAL_COMMUNITY);
    });

    it('should lookup Z-codes by key', () => {
      const result = screener.getZCodeByKey('FOOD_INSECURITY');
      expect(result).not.toBeNull();
      expect(result!.code).toBe('Z59.41');
    });
  });

  describe('PRAPARE Screening', () => {
    it('should return PRAPARE screening questions', () => {
      const questions = screener.getScreeningQuestions(ScreeningToolType.PRAPARE);
      expect(questions.length).toBeGreaterThanOrEqual(10);
      expect(questions.every(q => q.tool === ScreeningToolType.PRAPARE)).toBe(true);
    });

    it('should cover all 5 SDOH domains in questions', () => {
      const questions = screener.getScreeningQuestions(ScreeningToolType.PRAPARE);
      const domains = new Set(questions.map(q => q.domain));
      expect(domains.has(SDOHDomain.ECONOMIC_STABILITY)).toBe(true);
      expect(domains.has(SDOHDomain.EDUCATION_ACCESS)).toBe(true);
      expect(domains.has(SDOHDomain.SOCIAL_COMMUNITY)).toBe(true);
      expect(domains.has(SDOHDomain.NEIGHBORHOOD_ENVIRONMENT)).toBe(true);
    });

    it('should conduct a complete PRAPARE screening with low-risk responses', () => {
      const questions = screener.getScreeningQuestions(ScreeningToolType.PRAPARE);
      const responses: ScreeningResponse[] = questions.map(q => ({
        questionId: q.id,
        response: q.responseOptions[0], // First option typically lowest risk
        timestamp: new Date().toISOString(),
      }));

      const result = screener.conductScreening('PAT-001', ScreeningToolType.PRAPARE, responses);
      expect(result.patientId).toBe('PAT-001');
      expect(result.tool).toBe(ScreeningToolType.PRAPARE);
      expect(result.domainScores).toBeDefined();
      expect(Object.keys(result.domainScores).length).toBe(5);
    });

    it('should identify high-risk patient with housing insecurity', () => {
      const questions = screener.getScreeningQuestions(ScreeningToolType.PRAPARE);
      const responses: ScreeningResponse[] = questions.map(q => {
        if (q.id === 'PR06') return { questionId: q.id, response: q.responseOptions[1], timestamp: new Date().toISOString() }; // Homeless
        if (q.id === 'PR07') return { questionId: q.id, response: 'Yes', timestamp: new Date().toISOString() }; // Worried about housing
        if (q.id === 'PR12') return { questionId: q.id, response: 'Yes', timestamp: new Date().toISOString() }; // Food insecurity
        return { questionId: q.id, response: q.responseOptions[0], timestamp: new Date().toISOString() };
      });

      const result = screener.conductScreening('PAT-002', ScreeningToolType.PRAPARE, responses);
      expect(result.overallRiskLevel).not.toBe(RiskLevel.LOW);
      expect(result.identifiedNeeds.length).toBeGreaterThan(0);
      expect(result.zCodes.length).toBeGreaterThan(0);
    });
  });

  describe('AHC HRSN Screening', () => {
    it('should return AHC HRSN screening questions', () => {
      const questions = screener.getScreeningQuestions(ScreeningToolType.AHC_HRSN);
      expect(questions.length).toBeGreaterThanOrEqual(8);
      expect(questions.every(q => q.tool === ScreeningToolType.AHC_HRSN)).toBe(true);
    });
  });

  describe('Domain Score Calculation', () => {
    it('should calculate normalized domain scores', () => {
      const questions = screener.getScreeningQuestions(ScreeningToolType.PRAPARE);
      const responses: ScreeningResponse[] = questions.map(q => ({
        questionId: q.id,
        response: q.responseOptions[0],
        timestamp: new Date().toISOString(),
      }));

      const scores = screener.calculateDomainScores(responses, questions);
      for (const score of Object.values(scores)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Risk Stratification', () => {
    it('should determine LOW risk for minimal scores', () => {
      const scores = {
        [SDOHDomain.ECONOMIC_STABILITY]: 0,
        [SDOHDomain.EDUCATION_ACCESS]: 0,
        [SDOHDomain.SOCIAL_COMMUNITY]: 0.5,
        [SDOHDomain.HEALTHCARE_ACCESS]: 0,
        [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: 0,
      };
      expect(screener.determineRiskLevel(scores)).toBe(RiskLevel.LOW);
    });

    it('should determine HIGH risk for elevated scores', () => {
      const scores = {
        [SDOHDomain.ECONOMIC_STABILITY]: 6,
        [SDOHDomain.EDUCATION_ACCESS]: 2,
        [SDOHDomain.SOCIAL_COMMUNITY]: 3,
        [SDOHDomain.HEALTHCARE_ACCESS]: 1,
        [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: 4,
      };
      expect(screener.determineRiskLevel(scores)).toBe(RiskLevel.HIGH);
    });

    it('should determine CRITICAL risk for very high scores', () => {
      const scores = {
        [SDOHDomain.ECONOMIC_STABILITY]: 8,
        [SDOHDomain.EDUCATION_ACCESS]: 5,
        [SDOHDomain.SOCIAL_COMMUNITY]: 6,
        [SDOHDomain.HEALTHCARE_ACCESS]: 4,
        [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: 7,
      };
      expect(screener.determineRiskLevel(scores)).toBe(RiskLevel.CRITICAL);
    });
  });

  describe('Recovery Impact Prediction', () => {
    it('should predict lower recovery score for higher SDOH risk', () => {
      const lowRisk = {
        [SDOHDomain.ECONOMIC_STABILITY]: 1,
        [SDOHDomain.EDUCATION_ACCESS]: 0,
        [SDOHDomain.SOCIAL_COMMUNITY]: 1,
        [SDOHDomain.HEALTHCARE_ACCESS]: 0,
        [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: 0,
      };
      const highRisk = {
        [SDOHDomain.ECONOMIC_STABILITY]: 8,
        [SDOHDomain.EDUCATION_ACCESS]: 5,
        [SDOHDomain.SOCIAL_COMMUNITY]: 7,
        [SDOHDomain.HEALTHCARE_ACCESS]: 6,
        [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: 7,
      };
      const lowScore = screener.predictRecoveryImpact(lowRisk);
      const highScore = screener.predictRecoveryImpact(highRisk);
      expect(lowScore).toBeGreaterThan(highScore);
      expect(lowScore).toBeLessThanOrEqual(100);
      expect(highScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Community Resource Matching', () => {
    it('should match resources to identified needs', () => {
      const needs = [
        { domain: SDOHDomain.ECONOMIC_STABILITY as SDOHDomain, description: 'Food insecurity', severity: RiskLevel.HIGH as RiskLevel, zCode: 'Z59.41', interventionStatus: 'identified' as const },
      ];
      const resources = screener.matchResources(needs);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources.some(r => r.category === ResourceCategory.FOOD_ASSISTANCE)).toBe(true);
    });

    it('should have 50+ community resources', () => {
      const all = screener.getAllResources();
      expect(all.length).toBeGreaterThanOrEqual(50);
    });

    it('should filter resources by category', () => {
      const housing = screener.getResourcesByCategory(ResourceCategory.HOUSING_ASSISTANCE);
      expect(housing.length).toBeGreaterThan(0);
      expect(housing.every(r => r.category === ResourceCategory.HOUSING_ASSISTANCE)).toBe(true);
    });
  });

  describe('Self-Learning (Intervention Effectiveness)', () => {
    it('should record and analyze intervention outcomes', () => {
      screener.recordInterventionOutcome({
        patientId: 'PAT-001', needDomain: SDOHDomain.ECONOMIC_STABILITY,
        resourceId: 'CR001', wasEffective: true, recoveryImpactDelta: 5, timestamp: new Date().toISOString(),
      });
      screener.recordInterventionOutcome({
        patientId: 'PAT-002', needDomain: SDOHDomain.ECONOMIC_STABILITY,
        resourceId: 'CR001', wasEffective: true, recoveryImpactDelta: 8, timestamp: new Date().toISOString(),
      });
      screener.recordInterventionOutcome({
        patientId: 'PAT-003', needDomain: SDOHDomain.ECONOMIC_STABILITY,
        resourceId: 'CR001', wasEffective: false, recoveryImpactDelta: -1, timestamp: new Date().toISOString(),
      });

      const effective = screener.getEffectiveInterventions(SDOHDomain.ECONOMIC_STABILITY);
      expect(effective.length).toBe(1);
      expect(effective[0].resourceId).toBe('CR001');
      expect(effective[0].effectivenessRate).toBeCloseTo(0.667, 1);
    });

    it('should return empty results when no outcomes recorded', () => {
      const effective = screener.getEffectiveInterventions(SDOHDomain.HEALTHCARE_ACCESS);
      expect(effective.length).toBe(0);
    });
  });
});
