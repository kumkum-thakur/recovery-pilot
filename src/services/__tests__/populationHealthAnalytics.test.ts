import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPopulationHealthAnalytics,
  RiskStratum,
  AgeGroup,
  Gender,
  SurgeryType,
  type PopulationHealthAnalytics,
  type CohortDefinition,
} from '../populationHealthAnalytics';

describe('PopulationHealthAnalytics', () => {
  let analytics: PopulationHealthAnalytics;

  beforeEach(() => {
    analytics = createPopulationHealthAnalytics();
  });

  describe('Synthetic Population', () => {
    it('should have 500+ patients in the population', () => {
      const population = analytics.getPopulation();
      expect(population.length).toBeGreaterThanOrEqual(500);
    });

    it('should have patients across multiple surgery types', () => {
      const population = analytics.getPopulation();
      const surgeryTypes = new Set(population.map(p => p.surgeryType));
      expect(surgeryTypes.size).toBeGreaterThanOrEqual(5);
      expect(surgeryTypes.has(SurgeryType.ORTHOPEDIC)).toBe(true);
      expect(surgeryTypes.has(SurgeryType.CARDIAC)).toBe(true);
    });

    it('should have patients with diverse demographics', () => {
      const population = analytics.getPopulation();
      const genders = new Set(population.map(p => p.gender));
      expect(genders.has(Gender.MALE)).toBe(true);
      expect(genders.has(Gender.FEMALE)).toBe(true);
      expect(population.every(p => p.age >= 18 && p.age <= 87)).toBe(true);
    });
  });

  describe('Cohort Definition', () => {
    it('should filter cohort by surgery type', () => {
      const definition: CohortDefinition = {
        name: 'Orthopedic Patients',
        filters: [{ field: 'surgeryType', operator: 'eq', value: SurgeryType.ORTHOPEDIC }],
      };
      const cohort = analytics.defineCohort(definition);
      expect(cohort.length).toBeGreaterThan(0);
      expect(cohort.every(p => p.surgeryType === SurgeryType.ORTHOPEDIC)).toBe(true);
    });

    it('should filter cohort by age range', () => {
      const definition: CohortDefinition = {
        name: 'Elderly Patients',
        filters: [
          { field: 'age', operator: 'gte', value: 65 },
        ],
      };
      const cohort = analytics.defineCohort(definition);
      expect(cohort.length).toBeGreaterThan(0);
      expect(cohort.every(p => p.age >= 65)).toBe(true);
    });

    it('should apply multiple filters', () => {
      const definition: CohortDefinition = {
        name: 'Male Cardiac',
        filters: [
          { field: 'gender', operator: 'eq', value: Gender.MALE },
          { field: 'surgeryType', operator: 'eq', value: SurgeryType.CARDIAC },
        ],
      };
      const cohort = analytics.defineCohort(definition);
      expect(cohort.every(p => p.gender === Gender.MALE && p.surgeryType === SurgeryType.CARDIAC)).toBe(true);
    });
  });

  describe('Cohort Analysis', () => {
    it('should analyze cohort demographics and outcomes', () => {
      const definition: CohortDefinition = {
        name: 'All Patients',
        filters: [],
      };
      const analysis = analytics.analyzeCohort(definition);
      expect(analysis.name).toBe('All Patients');
      expect(analysis.size).toBeGreaterThan(0);
      expect(analysis.demographics.meanAge).toBeGreaterThan(18);
      expect(analysis.demographics.medianAge).toBeGreaterThan(18);
      expect(Object.keys(analysis.demographics.genderDistribution).length).toBeGreaterThan(0);
      expect(Object.keys(analysis.demographics.ageGroupDistribution).length).toBeGreaterThan(0);
    });

    it('should compute outcome metrics', () => {
      const definition: CohortDefinition = {
        name: 'All',
        filters: [],
      };
      const analysis = analytics.analyzeCohort(definition);
      expect(analysis.outcomes.meanLOS).toBeGreaterThan(0);
      expect(analysis.outcomes.readmission30DayRate).toBeGreaterThanOrEqual(0);
      expect(analysis.outcomes.readmission30DayRate).toBeLessThanOrEqual(1);
      expect(analysis.outcomes.complicationRate).toBeGreaterThanOrEqual(0);
      expect(analysis.outcomes.complicationRate).toBeLessThanOrEqual(1);
      expect(analysis.outcomes.mortalityRate).toBeGreaterThanOrEqual(0);
      expect(analysis.outcomes.mortalityRate).toBeLessThanOrEqual(1);
    });

    it('should include risk distribution in analysis', () => {
      const definition: CohortDefinition = { name: 'All', filters: [] };
      const analysis = analytics.analyzeCohort(definition);
      expect(analysis.riskDistribution[RiskStratum.LOW]).toBeGreaterThanOrEqual(0);
      expect(analysis.riskDistribution[RiskStratum.RISING]).toBeGreaterThanOrEqual(0);
      expect(analysis.riskDistribution[RiskStratum.HIGH]).toBeGreaterThanOrEqual(0);
      const total = analysis.riskDistribution[RiskStratum.LOW] +
        analysis.riskDistribution[RiskStratum.RISING] +
        analysis.riskDistribution[RiskStratum.HIGH];
      expect(total).toBe(analysis.size);
    });
  });

  describe('Risk Stratification', () => {
    it('should stratify patients into low, rising, and high risk', () => {
      const population = analytics.getPopulation();
      const strata = analytics.stratifyRisk(population);
      expect(strata[RiskStratum.LOW].length).toBeGreaterThan(0);
      expect(strata[RiskStratum.RISING].length).toBeGreaterThan(0);
      expect(strata[RiskStratum.HIGH].length).toBeGreaterThan(0);
      // All low risk patients should have riskScore < 30
      expect(strata[RiskStratum.LOW].every(p => p.riskScore < 30)).toBe(true);
      // All high risk patients should have riskScore >= 60
      expect(strata[RiskStratum.HIGH].every(p => p.riskScore >= 60)).toBe(true);
    });
  });

  describe('Prevalence Calculation', () => {
    it('should calculate prevalence for a known condition', () => {
      const result = analytics.calculatePrevalence('hypertension');
      expect(result.condition).toBe('hypertension');
      expect(result.cases).toBeGreaterThan(0);
      expect(result.population).toBeGreaterThan(0);
      expect(result.prevalence).toBeGreaterThan(0);
      expect(result.prevalence).toBeLessThanOrEqual(1);
      expect(result.prevalencePer1000).toBeGreaterThan(0);
    });

    it('should include 95% confidence interval', () => {
      const result = analytics.calculatePrevalence('diabetes');
      expect(result.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
      expect(result.confidenceInterval.upper).toBeLessThanOrEqual(1);
      expect(result.confidenceInterval.lower).toBeLessThanOrEqual(result.prevalence);
      expect(result.confidenceInterval.upper).toBeGreaterThanOrEqual(result.prevalence);
    });

    it('should return zero prevalence for unknown conditions', () => {
      const result = analytics.calculatePrevalence('zzznonexistentzzz');
      expect(result.cases).toBe(0);
      expect(result.prevalence).toBe(0);
    });
  });

  describe('Incidence Calculation', () => {
    it('should calculate incidence rate for complications', () => {
      const result = analytics.calculateIncidence('SSI', 24);
      expect(result.condition).toBe('SSI');
      expect(result.newCases).toBeGreaterThanOrEqual(0);
      expect(result.personTime).toBeGreaterThan(0);
      expect(result.incidenceRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Odds Ratio', () => {
    it('should calculate odds ratio with confidence interval', () => {
      const result = analytics.calculateOddsRatio(
        'smokingStatus', 'current',
        'readmitted30Day', true
      );
      expect(result.oddsRatio).toBeGreaterThan(0);
      expect(result.confidenceInterval.lower).toBeGreaterThan(0);
      expect(result.confidenceInterval.upper).toBeGreaterThan(result.confidenceInterval.lower);
      expect(result.pValue).toBeGreaterThanOrEqual(0);
      expect(result.pValue).toBeLessThanOrEqual(1);
      expect(typeof result.significant).toBe('boolean');
    });
  });

  describe('Relative Risk', () => {
    it('should calculate relative risk with attributable risk', () => {
      const result = analytics.calculateRelativeRisk(
        'smokingStatus', 'current',
        'readmitted30Day', true
      );
      expect(result.relativeRisk).toBeGreaterThanOrEqual(0);
      expect(result.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
      expect(typeof result.attributableRisk).toBe('number');
    });
  });

  describe('Kaplan-Meier Survival Analysis', () => {
    it('should generate survival curve data', () => {
      const population = analytics.getPopulation();
      const result = analytics.kaplanMeierAnalysis(population, 'mortalityDate', 'followUpMonths');
      expect(result.timePoints.length).toBeGreaterThan(0);
      expect(result.survivalProbabilities.length).toBe(result.timePoints.length);
      expect(result.atRisk.length).toBe(result.timePoints.length);
      // Survival starts at 1.0
      expect(result.survivalProbabilities[0]).toBe(1.0);
      // Survival should be non-increasing
      for (let i = 1; i < result.survivalProbabilities.length; i++) {
        expect(result.survivalProbabilities[i]).toBeLessThanOrEqual(result.survivalProbabilities[i - 1]);
      }
    });
  });

  describe('Simplified Cox Model', () => {
    it('should produce covariate hazard ratios', () => {
      const population = analytics.getPopulation();
      const result = analytics.simplifiedCoxModel(population, ['age', 'bmi', 'riskScore']);
      expect(result.covariates.length).toBe(3);
      expect(result.covariates[0].name).toBe('age');
      expect(result.covariates[0].hazardRatio).toBeGreaterThan(0);
      expect(result.concordance).toBeGreaterThan(0.5);
      expect(result.concordance).toBeLessThanOrEqual(1);
    });
  });

  describe('Population Pyramid', () => {
    it('should build population pyramid by age and gender', () => {
      const pyramid = analytics.buildPopulationPyramid();
      expect(pyramid.ageGroups.length).toBe(Object.values(AgeGroup).length);
      expect(pyramid.maleCount.length).toBe(pyramid.ageGroups.length);
      expect(pyramid.femaleCount.length).toBe(pyramid.ageGroups.length);
      expect(pyramid.otherCount.length).toBe(pyramid.ageGroups.length);
      // Total should match population
      const total = pyramid.maleCount.reduce((a, b) => a + b, 0) +
        pyramid.femaleCount.reduce((a, b) => a + b, 0) +
        pyramid.otherCount.reduce((a, b) => a + b, 0);
      expect(total).toBe(analytics.getPopulation().length);
    });
  });

  describe('Utilization Patterns', () => {
    it('should analyze length of stay utilization', () => {
      const result = analytics.analyzeUtilization('lengthOfStay');
      expect(result.metric).toBe('lengthOfStay');
      expect(result.byMonth.length).toBeGreaterThan(0);
      expect(result.average).toBeGreaterThan(0);
      expect(['increasing', 'decreasing', 'stable']).toContain(result.trend);
    });

    it('should analyze volume utilization', () => {
      const result = analytics.analyzeUtilization('volume');
      expect(result.metric).toBe('volume');
      expect(result.byMonth.length).toBeGreaterThan(0);
    });
  });

  describe('Age-Adjusted Rate', () => {
    it('should calculate age-adjusted rate for a condition', () => {
      const rate = analytics.getAgeAdjustedRate('SSI');
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    });

    it('should accept custom standard population', () => {
      const custom: Record<string, number> = {
        [AgeGroup.AGE_18_29]: 0.20,
        [AgeGroup.AGE_30_39]: 0.20,
        [AgeGroup.AGE_40_49]: 0.15,
        [AgeGroup.AGE_50_59]: 0.15,
        [AgeGroup.AGE_60_69]: 0.15,
        [AgeGroup.AGE_70_79]: 0.10,
        [AgeGroup.AGE_80_PLUS]: 0.05,
      };
      const rate = analytics.getAgeAdjustedRate('DVT', custom);
      expect(rate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Self-Learning (Emerging Trends)', () => {
    it('should record and retrieve emerging trends', () => {
      expect(analytics.getEmergingTrends().length).toBe(0);

      analytics.recordTrend({
        description: 'Rising readmission rates in cardiac cohort',
        metric: 'readmission30Day',
        direction: 'increasing',
        magnitude: 0.15,
        confidence: 0.85,
        detectedAt: new Date().toISOString(),
      });

      analytics.recordTrend({
        description: 'Decreasing LOS in orthopedic cohort',
        metric: 'lengthOfStay',
        direction: 'decreasing',
        magnitude: 0.8,
        confidence: 0.92,
        detectedAt: new Date().toISOString(),
      });

      const trends = analytics.getEmergingTrends();
      expect(trends.length).toBe(2);
      expect(trends[0].direction).toBe('increasing');
      expect(trends[1].direction).toBe('decreasing');
    });
  });
});
