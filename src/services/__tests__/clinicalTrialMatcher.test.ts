import { describe, it, expect, beforeEach } from 'vitest';
import {
  createClinicalTrialMatcher,
  TrialPhase,
  TrialCategory,
  TrialStatus,
  EligibilityResult,
  type ClinicalTrialMatcher,
  type PatientProfile,
} from '../clinicalTrialMatcher';

describe('ClinicalTrialMatcher', () => {
  let matcher: ClinicalTrialMatcher;

  beforeEach(() => {
    matcher = createClinicalTrialMatcher();
  });

  describe('Trial Database', () => {
    it('should have 50+ clinical trials', () => {
      const trials = matcher.getAllTrials();
      expect(trials.length).toBeGreaterThanOrEqual(50);
    });

    it('should have trials across multiple phases', () => {
      expect(matcher.getTrialsByPhase(TrialPhase.PHASE_I_II).length).toBeGreaterThan(0);
      expect(matcher.getTrialsByPhase(TrialPhase.PHASE_II).length).toBeGreaterThan(0);
      expect(matcher.getTrialsByPhase(TrialPhase.PHASE_III).length).toBeGreaterThan(0);
      expect(matcher.getTrialsByPhase(TrialPhase.PHASE_IV).length).toBeGreaterThan(0);
    });

    it('should have trials across multiple categories', () => {
      expect(matcher.getTrialsByCategory(TrialCategory.THERAPEUTIC).length).toBeGreaterThan(0);
      expect(matcher.getTrialsByCategory(TrialCategory.DEVICE).length).toBeGreaterThan(0);
      expect(matcher.getTrialsByCategory(TrialCategory.BEHAVIORAL).length).toBeGreaterThan(0);
      expect(matcher.getTrialsByCategory(TrialCategory.OBSERVATIONAL).length).toBeGreaterThan(0);
    });

    it('should have recruiting trials', () => {
      const recruiting = matcher.getRecruitingTrials();
      expect(recruiting.length).toBeGreaterThan(0);
      expect(recruiting.every(t => t.status === TrialStatus.RECRUITING)).toBe(true);
    });

    it('should find trials by condition', () => {
      const kneeTrials = matcher.getTrialsByCondition('knee');
      expect(kneeTrials.length).toBeGreaterThan(0);
    });

    it('should have ClinicalTrials.gov-compliant NCT IDs', () => {
      const trials = matcher.getAllTrials();
      expect(trials.every(t => t.nctId.startsWith('NCT'))).toBe(true);
      expect(trials.every(t => t.nctId.length === 11)).toBe(true);
    });
  });

  describe('Patient Matching - Eligible', () => {
    it('should match patient for TKA pain management trial and return a result', () => {
      const profile: PatientProfile = {
        patientId: 'PAT-001',
        age: 65,
        gender: 'male',
        diagnoses: ['osteoarthritis'],
        procedures: ['Total knee arthroplasty'],
        medications: ['acetaminophen', 'gabapentin'],
        labValues: {},
        comorbidities: ['hypertension'],
        allergies: [],
        performanceStatus: 1,
      };

      const result = matcher.matchPatientToTrial(
        profile,
        matcher.getAllTrials().find(t => t.nctId === 'NCT05000001')!
      );

      expect(result.score).toBeGreaterThan(0);
      expect(result.recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('Patient Matching - Excluded', () => {
    it('should exclude patient with NSAID allergy from pain trial', () => {
      const profile: PatientProfile = {
        patientId: 'PAT-002',
        age: 60,
        gender: 'female',
        diagnoses: ['osteoarthritis'],
        procedures: ['Total knee arthroplasty'],
        medications: [],
        labValues: {},
        comorbidities: [],
        allergies: ['NSAID'],
        performanceStatus: 1,
      };

      const result = matcher.matchPatientToTrial(
        profile,
        matcher.getAllTrials().find(t => t.nctId === 'NCT05000001')!
      );

      expect(result.eligibility).toBe(EligibilityResult.EXCLUDED);
      expect(result.unmatchedCriteria.length).toBeGreaterThan(0);
    });

    it('should exclude patient on chronic opioids', () => {
      const profile: PatientProfile = {
        patientId: 'PAT-003',
        age: 55,
        gender: 'male',
        diagnoses: ['osteoarthritis'],
        procedures: ['Total knee arthroplasty'],
        medications: ['oxycodone', 'morphine'],
        labValues: {},
        comorbidities: [],
        allergies: [],
        performanceStatus: 1,
      };

      const result = matcher.matchPatientToTrial(
        profile,
        matcher.getAllTrials().find(t => t.nctId === 'NCT05000001')!
      );

      expect(result.eligibility).toBe(EligibilityResult.EXCLUDED);
    });
  });

  describe('Criterion Evaluation', () => {
    it('should evaluate age criterion correctly', () => {
      const criterion = { type: 'age' as const, isInclusion: true, description: 'Age 50-85', parameter: 'age', operator: 'between' as const, value: [50, 85] as [number, number], required: true };
      const profile: PatientProfile = { patientId: 'p1', age: 65, gender: 'male', diagnoses: [], procedures: [], medications: [], labValues: {}, comorbidities: [], allergies: [] };

      const result = matcher.evaluateCriterion(criterion, profile);
      expect(result.met).toBe(true);
    });

    it('should evaluate lab value criterion', () => {
      const criterion = { type: 'lab_value' as const, isInclusion: true, description: 'Platelet > 100K', parameter: 'plateletCount', operator: 'gt' as const, value: 100, required: true };
      const profile: PatientProfile = { patientId: 'p1', age: 50, gender: 'male', diagnoses: [], procedures: [], medications: [], labValues: { plateletCount: 250 }, comorbidities: [], allergies: [] };

      const result = matcher.evaluateCriterion(criterion, profile);
      expect(result.met).toBe(true);
    });

    it('should handle missing lab value', () => {
      const criterion = { type: 'lab_value' as const, isInclusion: true, description: 'Hgb 8-12', parameter: 'hemoglobin', operator: 'between' as const, value: [8, 12] as [number, number], required: true };
      const profile: PatientProfile = { patientId: 'p1', age: 50, gender: 'male', diagnoses: [], procedures: [], medications: [], labValues: {}, comorbidities: [], allergies: [] };

      const result = matcher.evaluateCriterion(criterion, profile);
      expect(result.met).toBe(false);
    });

    it('should evaluate gender criterion', () => {
      const criterion = { type: 'gender' as const, isInclusion: true, description: 'Female', parameter: 'gender', operator: 'eq' as const, value: 'female', required: true };
      const female: PatientProfile = { patientId: 'p1', age: 40, gender: 'female', diagnoses: [], procedures: [], medications: [], labValues: {}, comorbidities: [], allergies: [] };
      const male: PatientProfile = { patientId: 'p2', age: 40, gender: 'male', diagnoses: [], procedures: [], medications: [], labValues: {}, comorbidities: [], allergies: [] };

      expect(matcher.evaluateCriterion(criterion, female).met).toBe(true);
      expect(matcher.evaluateCriterion(criterion, male).met).toBe(false);
    });
  });

  describe('Eligibility Score', () => {
    it('should calculate maximum score when all criteria met', () => {
      const matched = [
        { criterion: { type: 'age' as const, isInclusion: true, description: '', parameter: 'age', operator: 'between' as const, value: [18, 80] as [number, number], required: true }, met: true },
        { criterion: { type: 'gender' as const, isInclusion: true, description: '', parameter: 'gender', operator: 'eq' as const, value: 'male', required: false }, met: true },
      ];
      expect(matcher.calculateEligibilityScore(matched)).toBeCloseTo(1.0, 1);
    });

    it('should calculate lower score when some criteria not met', () => {
      const matched = [
        { criterion: { type: 'age' as const, isInclusion: true, description: '', parameter: 'age', operator: 'between' as const, value: [18, 80] as [number, number], required: true }, met: true },
        { criterion: { type: 'gender' as const, isInclusion: true, description: '', parameter: 'gender', operator: 'eq' as const, value: 'male', required: true }, met: false },
      ];
      const score = matcher.calculateEligibilityScore(matched);
      expect(score).toBeLessThan(1.0);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance between two points', () => {
      // Boston to New York ~190 miles
      const dist = matcher.calculateDistance(42.3601, -71.0589, 40.7128, -74.006);
      expect(dist).toBeGreaterThan(150);
      expect(dist).toBeLessThan(250);
    });

    it('should find nearest site for a patient', () => {
      const profile: PatientProfile = {
        patientId: 'p1', age: 60, gender: 'male', diagnoses: ['osteoarthritis'],
        procedures: ['Total knee arthroplasty'], medications: [], labValues: {},
        comorbidities: [], allergies: [], performanceStatus: 1,
        location: { latitude: 42.3, longitude: -71.1, zipCode: '02115' },
      };

      const trial = matcher.getAllTrials().find(t => t.nctId === 'NCT05000001')!;
      const nearest = matcher.findNearestSite(profile, trial);
      expect(nearest).not.toBeNull();
      expect(nearest!.site.city).toBe('Boston');
    });
  });

  describe('Batch Matching', () => {
    it('should match patient against all recruiting trials and sort by score', () => {
      const profile: PatientProfile = {
        patientId: 'PAT-100',
        age: 60,
        gender: 'male',
        diagnoses: ['osteoarthritis'],
        procedures: ['Total knee arthroplasty'],
        medications: ['acetaminophen'],
        labValues: { plateletCount: 250 },
        comorbidities: ['hypertension'],
        bmi: 28,
        smokingStatus: 'never',
        performanceStatus: 1,
        daysSinceSurgery: 3,
        allergies: [],
        location: { latitude: 42.36, longitude: -71.06, zipCode: '02115' },
      };

      const results = matcher.matchPatient(profile);
      expect(results.length).toBeGreaterThan(0);
      // Should be sorted by score descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('Self-Learning', () => {
    it('should adjust match threshold based on enrollment outcomes', () => {
      const initialThreshold = matcher.getImprovedMatchThreshold();
      expect(initialThreshold).toBe(0.6);

      // Record outcomes
      for (let i = 0; i < 6; i++) {
        matcher.recordEnrollmentOutcome({
          trialNctId: 'NCT05000001', patientId: `PAT-${i}`,
          wasEnrolled: i < 4, matchScore: i < 4 ? 0.8 : 0.3,
          timestamp: new Date().toISOString(),
        });
      }

      const newThreshold = matcher.getImprovedMatchThreshold();
      expect(newThreshold).not.toBe(initialThreshold);
    });
  });
});
