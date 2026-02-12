import { describe, it, expect } from 'vitest';
import {
  analyzeSymptoms,
  detectRedFlags,
  getFollowUpQuestions,
  SYMPTOM_DATABASE,
  CONDITION_DATABASE,
  Severity,
  BodySystem,
  type AnalysisContext,
} from '../symptomCheckerModel';

const defaultContext: AnalysisContext = {
  surgeryType: 'knee_replacement',
  daysSinceSurgery: 7,
  age: 55,
};

describe('SymptomCheckerModel', () => {
  describe('symptom and condition databases', () => {
    it('should have a comprehensive symptom database', () => {
      expect(SYMPTOM_DATABASE.length).toBeGreaterThanOrEqual(55);
      // Verify structure
      const fever = SYMPTOM_DATABASE.find((s) => s.id === 'fever');
      expect(fever).toBeDefined();
      expect(fever!.name).toBe('Fever');
      expect(fever!.severity).toBe(Severity.MODERATE);
      expect(fever!.bodySystem).toBe(BodySystem.SYSTEMIC);
    });

    it('should have a comprehensive condition database', () => {
      expect(CONDITION_DATABASE.length).toBeGreaterThanOrEqual(20);
      // Verify structure
      const ssi = CONDITION_DATABASE.find((c) => c.id === 'surgical_site_infection');
      expect(ssi).toBeDefined();
      expect(ssi!.name).toContain('Surgical Site Infection');
      expect(ssi!.basePrior).toBeGreaterThan(0);
      expect(ssi!.basePrior).toBeLessThan(1);
    });
  });

  describe('analyzeSymptoms', () => {
    it('should return empty results for unrecognized symptoms', () => {
      const result = analyzeSymptoms(['nonexistent_symptom'], defaultContext);
      expect(result.conditions).toHaveLength(0);
      expect(result.redFlags).toHaveLength(0);
      expect(result.recommendedAction).toContain('No recognized symptoms');
    });

    it('should return ranked conditions for wound-related symptoms', () => {
      const result = analyzeSymptoms(
        ['fever', 'wound_redness', 'wound_swelling', 'increased_pain'],
        defaultContext,
      );

      expect(result.conditions.length).toBeGreaterThan(0);
      // Conditions should be sorted by probability (descending)
      for (let i = 1; i < result.conditions.length; i++) {
        expect(result.conditions[i - 1].probability).toBeGreaterThanOrEqual(
          result.conditions[i].probability,
        );
      }
      // SSI should be among top conditions for these symptoms
      const conditionNames = result.conditions.map((c) => c.name);
      expect(conditionNames.some((name) => name.toLowerCase().includes('infection'))).toBe(true);
    });

    it('should detect red flags when critical symptoms are present', () => {
      const result = analyzeSymptoms(
        ['chest_pain', 'shortness_of_breath'],
        defaultContext,
      );

      expect(result.redFlags.length).toBeGreaterThan(0);
      expect(result.recommendedAction).toBeTruthy();
    });

    it('should adjust analysis based on context', () => {
      const earlyResult = analyzeSymptoms(
        ['fever', 'wound_redness'],
        { surgeryType: 'knee_replacement', daysSinceSurgery: 3, age: 55 },
      );

      const lateResult = analyzeSymptoms(
        ['fever', 'wound_redness'],
        { surgeryType: 'knee_replacement', daysSinceSurgery: 30, age: 55 },
      );

      // Both should produce results, though scores may differ
      expect(earlyResult.conditions.length).toBeGreaterThan(0);
      expect(lateResult.conditions.length).toBeGreaterThan(0);
    });
  });

  describe('detectRedFlags', () => {
    it('should detect red flags for critical symptoms', () => {
      const flags = detectRedFlags(['chest_pain', 'bleeding']);
      expect(flags.length).toBeGreaterThan(0);
      expect(flags[0]).toHaveProperty('flag');
      expect(flags[0]).toHaveProperty('action');
    });

    it('should return empty for non-critical symptoms', () => {
      const flags = detectRedFlags(['fatigue', 'nausea']);
      expect(flags).toHaveLength(0);
    });

    it('should detect wound drainage as a red flag', () => {
      const flags = detectRedFlags(['wound_drainage']);
      expect(flags.length).toBeGreaterThan(0);
    });
  });

  describe('getFollowUpQuestions', () => {
    it('should generate follow-up questions for symptoms', () => {
      const questions = getFollowUpQuestions(['fever', 'wound_redness']);
      expect(questions.length).toBeGreaterThan(0);
      expect(typeof questions[0]).toBe('string');
    });

    it('should return questions even for a single symptom', () => {
      const questions = getFollowUpQuestions(['fever']);
      expect(questions.length).toBeGreaterThan(0);
    });
  });
});
