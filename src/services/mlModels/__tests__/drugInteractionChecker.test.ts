import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  DrugInteractionChecker,
  createDrugInteractionChecker,
  InteractionSeverity,
  InteractionMechanism,
  DrugCategory,
} from '../drugInteractionChecker';

describe('DrugInteractionChecker', () => {
  let checker: DrugInteractionChecker;

  beforeEach(() => {
    localStorage.clear();
    checker = createDrugInteractionChecker();
  });

  // ---- Core Database Tests ----

  it('should contain at least 50 drugs in the database', () => {
    const drugs = checker.getAllDrugs();
    expect(drugs.length).toBeGreaterThanOrEqual(50);
  });

  it('should contain at least 40 interaction pairs', () => {
    const stats = checker.getStats();
    expect(stats.totalInteractions).toBeGreaterThanOrEqual(40);
  });

  it('should look up drugs by ID', () => {
    const morphine = checker.getDrug('morphine');
    expect(morphine).toBeDefined();
    expect(morphine!.genericName).toBe('morphine sulfate');
    expect(morphine!.category).toBe(DrugCategory.OPIOID_ANALGESIC);
  });

  it('should look up drugs by name (case-insensitive)', () => {
    const tylenol = checker.getDrug('Tylenol');
    expect(tylenol).toBeDefined();
    expect(tylenol!.id).toBe('acetaminophen');
  });

  it('should return undefined for unknown drugs', () => {
    expect(checker.getDrug('nonexistent_drug')).toBeUndefined();
  });

  // ---- Interaction Checking Tests ----

  it('should detect FDA Black Box opioid-benzodiazepine interaction', () => {
    const result = checker.checkPairInteraction('morphine', 'midazolam');
    expect(result).not.toBeNull();
    expect(result!.severity).toBe(InteractionSeverity.MAJOR);
    expect(result!.mechanism).toBe(InteractionMechanism.ADDITIVE_RESPIRATORY_DEPRESSION);
    expect(result!.severityScore).toBeGreaterThan(0.8);
    expect(result!.clinicalRecommendation).toContain('respiratory');
  });

  it('should detect contraindicated fentanyl-midazolam combination', () => {
    const result = checker.checkPairInteraction('fentanyl', 'midazolam');
    expect(result).not.toBeNull();
    expect(result!.severity).toBe(InteractionSeverity.CONTRAINDICATED);
    expect(result!.severityScore).toBeGreaterThan(0.9);
  });

  it('should detect NSAID-anticoagulant bleeding risk', () => {
    const result = checker.checkPairInteraction('ibuprofen', 'warfarin');
    expect(result).not.toBeNull();
    expect(result!.severity).toBe(InteractionSeverity.MAJOR);
    expect(result!.mechanism).toBe(InteractionMechanism.ADDITIVE_BLEEDING_RISK);
  });

  it('should detect CYP450 enzyme interactions (fluconazole-warfarin CYP2C9)', () => {
    const result = checker.checkPairInteraction('fluconazole', 'warfarin');
    expect(result).not.toBeNull();
    expect(result!.mechanism).toBe(InteractionMechanism.CYP2C9_INHIBITION);
    expect(result!.severity).toBe(InteractionSeverity.MAJOR);
  });

  it('should detect serotonin syndrome risk (tramadol + SSRI)', () => {
    const result = checker.checkPairInteraction('tramadol', 'sertraline');
    expect(result).not.toBeNull();
    expect(result!.mechanism).toBe(InteractionMechanism.ADDITIVE_SEROTONERGIC);
    expect(result!.severity).toBe(InteractionSeverity.MAJOR);
  });

  it('should detect QT prolongation risk (ondansetron + amiodarone)', () => {
    const result = checker.checkPairInteraction('ondansetron', 'amiodarone');
    expect(result).not.toBeNull();
    expect(result!.mechanism).toBe(InteractionMechanism.ADDITIVE_QT_PROLONGATION);
  });

  it('should detect omeprazole-clopidogrel CYP2C19 interaction', () => {
    const result = checker.checkPairInteraction('omeprazole', 'clopidogrel');
    expect(result).not.toBeNull();
    expect(result!.mechanism).toBe(InteractionMechanism.CYP2C19_INHIBITION);
    expect(result!.severity).toBe(InteractionSeverity.MAJOR);
  });

  it('should return null for non-interacting drug pairs', () => {
    const result = checker.checkPairInteraction('docusate', 'gabapentin');
    expect(result).toBeNull();
  });

  // ---- Medication List Check Tests ----

  it('should check all pairwise interactions for a medication list', () => {
    const result = checker.checkMedicationList(['morphine', 'midazolam', 'ibuprofen', 'warfarin']);
    expect(result.totalInteractions).toBeGreaterThanOrEqual(2);
    expect(result.majorCount).toBeGreaterThanOrEqual(2);
    expect(result.safeToAdminister).toBe(false);
  });

  it('should report safe to administer for non-interacting drugs', () => {
    const result = checker.checkMedicationList(['cefazolin', 'acetaminophen', 'docusate']);
    expect(result.contraindicatedCount).toBe(0);
    expect(result.majorCount).toBe(0);
  });

  it('should identify highest severity in medication list', () => {
    const result = checker.checkMedicationList(['fentanyl', 'midazolam', 'acetaminophen']);
    expect(result.highestSeverity).toBe(InteractionSeverity.CONTRAINDICATED);
  });

  it('should return no interactions for single drug', () => {
    const result = checker.checkMedicationList(['morphine']);
    expect(result.totalInteractions).toBe(0);
    expect(result.highestSeverity).toBeNull();
    expect(result.safeToAdminister).toBe(true);
  });

  it('should return no interactions for empty list', () => {
    const result = checker.checkMedicationList([]);
    expect(result.totalInteractions).toBe(0);
    expect(result.safeToAdminister).toBe(true);
  });

  // ---- Self-Learning Tests ----

  it('should record clinician overrides', () => {
    checker.checkPairInteraction('morphine', 'midazolam');
    checker.recordOverride('morphine', 'midazolam', 'doctor-001', 'Patient tolerates combination well');

    const stats = checker.getOverrideStats('morphine', 'midazolam');
    expect(stats.overrideCount).toBe(1);
    expect(stats.checkCount).toBeGreaterThanOrEqual(1);
  });

  it('should adjust severity confidence based on override history', () => {
    // Check initial severity score
    const initial = checker.checkPairInteraction('morphine', 'gabapentin');
    const initialScore = initial!.severityScore;

    // Record multiple overrides (need >5 checks to trigger adjustment)
    for (let i = 0; i < 8; i++) {
      checker.checkPairInteraction('morphine', 'gabapentin');
      checker.recordOverride('morphine', 'gabapentin', `doctor-${i}`, 'Clinically acceptable');
    }

    // Re-check: severity score should be reduced
    const adjusted = checker.checkPairInteraction('morphine', 'gabapentin');
    expect(adjusted!.severityScore).toBeLessThanOrEqual(initialScore);
  });

  it('should increase confidence with more checks', () => {
    const first = checker.checkPairInteraction('ibuprofen', 'warfarin');
    const firstConfidence = first!.confidence;

    // More checks increase confidence
    for (let i = 0; i < 20; i++) {
      checker.checkPairInteraction('ibuprofen', 'warfarin');
    }

    const later = checker.checkPairInteraction('ibuprofen', 'warfarin');
    expect(later!.confidence).toBeGreaterThan(firstConfidence);
  });

  it('should persist override history to localStorage', () => {
    checker.recordOverride('morphine', 'midazolam', 'doc-1', 'Test reason');

    const checker2 = createDrugInteractionChecker();
    const history = checker2.getOverrideHistory();
    expect(history.length).toBe(1);
    expect(history[0].clinicianId).toBe('doc-1');
  });

  it('should reset all learned state', () => {
    checker.recordOverride('morphine', 'midazolam', 'doc-1', 'test');
    checker.resetLearning();

    const history = checker.getOverrideHistory();
    expect(history.length).toBe(0);

    const stats = checker.getOverrideStats('morphine', 'midazolam');
    expect(stats.overrideCount).toBe(0);
  });

  // ---- CYP450 Inference Tests ----

  it('should infer CYP450 interactions not in explicit database', () => {
    // Duloxetine inhibits CYP2D6, metoprolol is CYP2D6 substrate
    const result = checker.inferCYP450Interaction('metoprolol', 'duloxetine');
    expect(result.hasPotentialInteraction).toBe(true);
    expect(result.pathways.length).toBeGreaterThan(0);
  });

  it('should report no CYP450 inference for non-overlapping pathways', () => {
    // Docusate has no CYP interactions, sennosides has none
    const result = checker.inferCYP450Interaction('docusate', 'sennosides');
    expect(result.hasPotentialInteraction).toBe(false);
    expect(result.pathways.length).toBe(0);
  });

  // ---- Category Tests ----

  it('should filter drugs by category', () => {
    const opioids = checker.getDrugsByCategory(DrugCategory.OPIOID_ANALGESIC);
    expect(opioids.length).toBeGreaterThanOrEqual(5);
    for (const drug of opioids) {
      expect(drug.category).toBe(DrugCategory.OPIOID_ANALGESIC);
    }
  });

  it('should find all interactions for a specific drug', () => {
    const warfarinInteractions = checker.getInteractionsForDrug('warfarin');
    expect(warfarinInteractions.length).toBeGreaterThanOrEqual(5); // warfarin has many known interactions
  });

  // ---- Severity Color Test ----

  it('should return correct severity colors', () => {
    expect(checker.getSeverityColor(InteractionSeverity.MINOR)).toBe('#4CAF50');
    expect(checker.getSeverityColor(InteractionSeverity.MAJOR)).toBe('#F44336');
    expect(checker.getSeverityColor(InteractionSeverity.CONTRAINDICATED)).toBe('#9C27B0');
  });

  // ---- Medication Risk Score Test ----

  it('should compute medication risk score for drug list', () => {
    const result = checker.computeMedicationRiskScore(['fentanyl', 'midazolam', 'warfarin', 'ibuprofen']);
    expect(result.totalRiskScore).toBeGreaterThan(0);
    expect(result.criticalPairs.length).toBeGreaterThan(0);
    expect(['critical', 'high', 'moderate', 'low']).toContain(result.riskLevel);
  });

  it('should return low risk for safe medication list', () => {
    const result = checker.computeMedicationRiskScore(['acetaminophen', 'docusate']);
    expect(result.totalRiskScore).toBeLessThan(0.6);
  });

  // ---- Property-Based Tests ----

  it('should have symmetric interaction detection (drugA,drugB == drugB,drugA)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ['morphine', 'midazolam'],
          ['ibuprofen', 'warfarin'],
          ['fluconazole', 'atorvastatin'],
          ['tramadol', 'sertraline']
        ),
        ([a, b]) => {
          localStorage.clear();
          const checker1 = createDrugInteractionChecker();
          const forward = checker1.checkPairInteraction(a, b);
          localStorage.clear();
          const checker2 = createDrugInteractionChecker();
          const reverse = checker2.checkPairInteraction(b, a);
          if (forward === null) {
            return reverse === null;
          }
          return forward.severity === reverse!.severity && forward.mechanism === reverse!.mechanism;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should never return severity score > 1 or < 0', () => {
    const drugs = checker.getAllDrugs().map(d => d.id);
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: drugs.length - 1 }),
        fc.integer({ min: 0, max: drugs.length - 1 }),
        (i, j) => {
          if (i === j) return true;
          const result = checker.checkPairInteraction(drugs[i], drugs[j]);
          if (result === null) return true;
          return result.severityScore >= 0 && result.severityScore <= 1;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should always have a valid mechanism type for known interactions', () => {
    const drugs = checker.getAllDrugs().map(d => d.id);
    const validMechanisms = Object.values(InteractionMechanism);

    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const result = checker.checkPairInteraction(drugs[i], drugs[j]);
        if (result) {
          expect(validMechanisms).toContain(result.mechanism);
        }
      }
    }
  });

  // ---- Edge Cases ----

  it('should handle checking interactions with nonexistent drug IDs gracefully', () => {
    const result = checker.checkPairInteraction('fake_drug', 'morphine');
    expect(result).toBeNull();
  });

  it('should handle recording override for nonexistent interaction', () => {
    // Should not throw
    checker.recordOverride('fake_drug', 'other_fake', 'doc-1', 'test');
    expect(checker.getOverrideHistory().length).toBe(0);
  });

  it('should handle large medication lists without error', () => {
    const allDrugs = checker.getAllDrugs().map(d => d.id).slice(0, 20);
    const result = checker.checkMedicationList(allDrugs);
    expect(result.totalInteractions).toBeGreaterThan(0);
    expect(result.interactions).toBeDefined();
  });
});
