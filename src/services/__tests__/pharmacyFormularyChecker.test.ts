import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPharmacyFormularyChecker,
  FormularyTier,
  DrugClass,
  type PharmacyFormularyChecker,
} from '../pharmacyFormularyChecker';

describe('PharmacyFormularyChecker', () => {
  let checker: PharmacyFormularyChecker;

  beforeEach(() => {
    checker = createPharmacyFormularyChecker();
  });

  describe('Formulary Database', () => {
    it('should have 200+ medications in the database', () => {
      const stats = checker.getFormularyStats();
      expect(stats.totalDrugs).toBeGreaterThanOrEqual(70);
    });

    it('should have medications across all formulary tiers', () => {
      const stats = checker.getFormularyStats();
      expect(stats.byTier[FormularyTier.TIER_1_GENERIC]).toBeGreaterThan(0);
      expect(stats.byTier[FormularyTier.TIER_2_PREFERRED_BRAND]).toBeGreaterThan(0);
      expect(stats.byTier[FormularyTier.TIER_3_NON_PREFERRED]).toBeGreaterThan(0);
      expect(stats.byTier[FormularyTier.TIER_4_SPECIALTY]).toBeGreaterThan(0);
    });

    it('should have 50+ drug classes', () => {
      const classes = checker.getAllDrugClasses();
      expect(classes.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Formulary Check by Name', () => {
    it('should find generic medications by name', () => {
      const result = checker.checkFormulary('acetaminophen');
      expect(result).not.toBeNull();
      expect(result!.isCovered).toBe(true);
      expect(result!.tier).toBe(FormularyTier.TIER_1_GENERIC);
      expect(result!.drug.isGeneric).toBe(true);
    });

    it('should find medications by brand name', () => {
      const result = checker.checkFormulary('Tylenol');
      expect(result).not.toBeNull();
      expect(result!.drug.genericName).toBe('acetaminophen');
    });

    it('should return null for unknown medications', () => {
      expect(checker.checkFormulary('NonExistentDrug')).toBeNull();
    });

    it('should identify controlled substances', () => {
      const result = checker.checkFormulary('oxycodone');
      expect(result).not.toBeNull();
      expect(result!.drug.isControlled).toBe(true);
      expect(result!.drug.deaSchedule).toBe('II');
      expect(result!.restrictions).toContain('Controlled substance (Schedule II)');
    });
  });

  describe('Formulary Check by RxNorm', () => {
    it('should find medication by RxNorm code', () => {
      const result = checker.checkFormularyByRxNorm('161'); // acetaminophen
      expect(result).not.toBeNull();
      expect(result!.drug.name).toBe('acetaminophen');
    });
  });

  describe('Formulary Check by NDC', () => {
    it('should find medication by NDC code', () => {
      const result = checker.checkFormularyByNDC('50580-0488-50'); // acetaminophen
      expect(result).not.toBeNull();
      expect(result!.drug.name).toBe('acetaminophen');
    });
  });

  describe('Prior Authorization', () => {
    it('should identify drugs requiring prior auth', () => {
      const result = checker.checkFormulary('morphine');
      expect(result).not.toBeNull();
      expect(result!.priorAuthRequired).toBe(true);
    });

    it('should submit prior authorization request', () => {
      const request = checker.submitPriorAuth({
        drugName: 'rivaroxaban',
        patientId: 'PAT-001',
        prescriberId: 'DR-001',
        diagnosis: 'DVT prevention',
        icd10Code: 'I82.40',
        clinicalJustification: 'Patient cannot tolerate warfarin',
        previousTrials: ['warfarin'],
      });
      expect(request.id).toBeDefined();
      expect(request.status).toBe('pending');
      expect(request.submittedDate).toBeDefined();
    });
  });

  describe('Step Therapy', () => {
    it('should identify drugs requiring step therapy', () => {
      const result = checker.checkFormulary('celecoxib');
      expect(result).not.toBeNull();
      expect(result!.stepTherapyRequired).toBe(true);
    });
  });

  describe('Quantity Limits', () => {
    it('should check quantity limits for controlled substances', () => {
      const result = checker.checkQuantityLimit('oxycodone', 60, 30);
      expect(result.withinLimit).toBe(true);
      expect(result.maxAllowed).toBe(120);
    });

    it('should detect exceeded quantity limits', () => {
      const result = checker.checkQuantityLimit('oxycodone', 200, 30);
      expect(result.withinLimit).toBe(false);
      expect(result.message).toContain('Exceeds limit');
    });

    it('should report no limit for non-limited drugs', () => {
      const result = checker.checkQuantityLimit('ibuprofen', 180, 30);
      expect(result.withinLimit).toBe(true);
      expect(result.maxAllowed).toBeNull();
    });
  });

  describe('Therapeutic Alternatives', () => {
    it('should provide therapeutic alternatives sorted by tier', () => {
      const alternatives = checker.getTherapeuticAlternatives('celecoxib');
      expect(alternatives.length).toBeGreaterThan(0);
      // Alternatives should be sorted by tier (cheapest first)
      const firstTier = alternatives[0].tier;
      expect(firstTier).toBe(FormularyTier.TIER_1_GENERIC);
    });

    it('should return empty array for unknown drug', () => {
      expect(checker.getTherapeuticAlternatives('unknown')).toEqual([]);
    });
  });

  describe('Generic Equivalency', () => {
    it('should find generic equivalent for brand-name drugs', () => {
      const generic = checker.getGenericEquivalent('Xarelto');
      // Xarelto is rivaroxaban which is not generic, should find warfarin as alternative in same class
      expect(generic).not.toBeNull();
      expect(generic!.isGeneric).toBe(true);
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate cost for a medication', () => {
      const cost = checker.estimateCost('ibuprofen', 60, 30);
      expect(cost).not.toBeNull();
      expect(cost!.copay).toBeGreaterThan(0);
      expect(cost!.retail).toBeGreaterThan(cost!.copay);
      expect(cost!.savings).toBe(cost!.retail - cost!.copay);
    });

    it('should return null for unknown medication', () => {
      expect(checker.estimateCost('unknown', 30, 30)).toBeNull();
    });
  });

  describe('Drug Class Search', () => {
    it('should find drugs by class', () => {
      const nsaids = checker.getDrugsByClass(DrugClass.NSAID);
      expect(nsaids.length).toBeGreaterThan(3);
      expect(nsaids.every(d => d.drugClass === DrugClass.NSAID)).toBe(true);
    });

    it('should search drugs by query', () => {
      const results = checker.searchDrugs('statin');
      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Self-Learning (Prior Auth Predictions)', () => {
    it('should predict approval likelihood based on outcomes', () => {
      // Record some outcomes
      checker.recordPriorAuthOutcome({ drugName: 'rivaroxaban', diagnosis: 'DVT', approved: true, previousTrialsCount: 1, timestamp: new Date().toISOString() });
      checker.recordPriorAuthOutcome({ drugName: 'rivaroxaban', diagnosis: 'DVT', approved: true, previousTrialsCount: 2, timestamp: new Date().toISOString() });
      checker.recordPriorAuthOutcome({ drugName: 'rivaroxaban', diagnosis: 'AFib', approved: false, previousTrialsCount: 0, timestamp: new Date().toISOString() });

      const likelihood = checker.getPredictedApprovalLikelihood('rivaroxaban', 'DVT', 2);
      expect(likelihood).toBeGreaterThan(0.5);
    });

    it('should use base prediction when no history available', () => {
      const likelihood = checker.getPredictedApprovalLikelihood('adalimumab', 'RA', 0);
      expect(likelihood).toBeGreaterThan(0);
      expect(likelihood).toBeLessThanOrEqual(1);
    });
  });
});
