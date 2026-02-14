import { describe, it, expect } from 'vitest';
import {
  painProtocolEngine,
  classifyPainLevel,
  determineWHOStep,
  generateWHOLadder,
  convertOpioidDose,
  generatePCAProtocol,
  generateMultimodalProtocol,
  PainLevel,
  OpioidName,
  Route,
} from '../painProtocolEngine';
import type { PatientContext } from '../painProtocolEngine';

function makeDefaultContext(overrides: Partial<PatientContext> = {}): PatientContext {
  return {
    weightKg: 70,
    ageYears: 55,
    creatinineClearance: 90,
    hepaticFunction: 'normal',
    isOpioidTolerant: false,
    allergies: [],
    currentMedications: [],
    ...overrides,
  };
}

describe('PainProtocolEngine', () => {
  // ==========================================================================
  // Pain Classification
  // ==========================================================================
  describe('pain level classification', () => {
    it('should classify 0 as none', () => {
      expect(classifyPainLevel(0)).toBe(PainLevel.NONE);
    });

    it('should classify 1-3 as mild', () => {
      expect(classifyPainLevel(1)).toBe(PainLevel.MILD);
      expect(classifyPainLevel(3)).toBe(PainLevel.MILD);
    });

    it('should classify 4-6 as moderate', () => {
      expect(classifyPainLevel(4)).toBe(PainLevel.MODERATE);
      expect(classifyPainLevel(6)).toBe(PainLevel.MODERATE);
    });

    it('should classify 7-10 as severe', () => {
      expect(classifyPainLevel(7)).toBe(PainLevel.SEVERE);
      expect(classifyPainLevel(10)).toBe(PainLevel.SEVERE);
    });
  });

  // ==========================================================================
  // WHO Pain Ladder
  // ==========================================================================
  describe('WHO Pain Ladder', () => {
    it('should use Step 1 for mild pain (1-3)', () => {
      expect(determineWHOStep(2)).toBe(1);
      const result = generateWHOLadder(2, makeDefaultContext());
      expect(result.step).toBe(1);
      expect(result.medications.some(m => m.genericName === 'acetaminophen')).toBe(true);
    });

    it('should use Step 2 for moderate pain (4-6)', () => {
      expect(determineWHOStep(5)).toBe(2);
      const result = generateWHOLadder(5, makeDefaultContext());
      expect(result.step).toBe(2);
      expect(result.medications.some(m => m.genericName === 'tramadol')).toBe(true);
    });

    it('should use Step 3 for severe pain (7-10)', () => {
      expect(determineWHOStep(8)).toBe(3);
      const result = generateWHOLadder(8, makeDefaultContext());
      expect(result.step).toBe(3);
      expect(result.medications.some(m => m.genericName === 'morphine')).toBe(true);
    });

    it('should include adjuvant recommendations', () => {
      const result = generateWHOLadder(6, makeDefaultContext());
      expect(result.adjuvants.length).toBeGreaterThan(0);
      expect(result.adjuvants.some(a => a.name === 'Gabapentin')).toBe(true);
    });

    it('should include non-pharmacological options', () => {
      const result = generateWHOLadder(3, makeDefaultContext());
      expect(result.nonPharmacological.length).toBeGreaterThan(0);
    });

    it('should adjust for renal impairment', () => {
      const result = generateWHOLadder(5, makeDefaultContext({ creatinineClearance: 20 }));
      const tramadol = result.medications.find(m => m.genericName === 'tramadol');
      expect(tramadol?.renalAdjustment).toBeTruthy();
      // Should not include NSAID
      expect(result.medications.some(m => m.genericName === 'ibuprofen')).toBe(false);
    });

    it('should adjust for hepatic impairment', () => {
      const result = generateWHOLadder(2, makeDefaultContext({ hepaticFunction: 'severe_impairment' }));
      const apap = result.medications.find(m => m.genericName === 'acetaminophen');
      expect(apap?.dose).toBe('500 mg');
      expect(apap?.hepaticAdjustment).toBeTruthy();
    });

    it('should include escalation criteria', () => {
      const step1 = generateWHOLadder(2, makeDefaultContext());
      expect(step1.escalationCriteria).toContain('Step 2');

      const step3 = generateWHOLadder(9, makeDefaultContext());
      expect(step3.escalationCriteria).toContain('maximum step');
    });
  });

  // ==========================================================================
  // Equianalgesic Conversion
  // ==========================================================================
  describe('equianalgesic conversion', () => {
    it('should have correct equianalgesic table entries', () => {
      const table = painProtocolEngine.getEquianalgesicTable();
      expect(table.length).toBeGreaterThanOrEqual(8);

      const morphine = table.find(e => e.drug === OpioidName.MORPHINE);
      expect(morphine).toBeDefined();
      expect(morphine!.oralDoseMg).toBe(30);     // Morphine 30mg oral standard
      expect(morphine!.parenteralDoseMg).toBe(10); // Morphine 10mg IV standard

      const hydromorphone = table.find(e => e.drug === OpioidName.HYDROMORPHONE);
      expect(hydromorphone!.oralDoseMg).toBe(6);  // Hydromorphone 6mg oral = morphine 30mg oral
      expect(hydromorphone!.parenteralDoseMg).toBe(1.5);
    });

    it('should convert morphine oral to morphine IV correctly (3:1 ratio)', () => {
      // Morphine 30mg PO = Morphine 10mg IV
      const result = convertOpioidDose(
        OpioidName.MORPHINE, 30, Route.ORAL,
        OpioidName.MORPHINE, Route.IV, 0,
      );
      expect(result.toDose).toBeCloseTo(10, 1);
    });

    it('should convert morphine to hydromorphone (oral)', () => {
      // Morphine 30mg PO = Hydromorphone 6mg PO
      const result = convertOpioidDose(
        OpioidName.MORPHINE, 30, Route.ORAL,
        OpioidName.HYDROMORPHONE, Route.ORAL, 0,
      );
      expect(result.toDose).toBeCloseTo(6, 1);
    });

    it('should apply 25% safety reduction by default', () => {
      const result = convertOpioidDose(
        OpioidName.MORPHINE, 30, Route.ORAL,
        OpioidName.OXYCODONE, Route.ORAL,
      );
      // Morphine 30mg PO = Oxycodone 20mg PO, with 25% reduction = 15mg
      expect(result.toDose).toBeCloseTo(20, 1);
      expect(result.finalDose).toBeCloseTo(15, 1);
    });

    it('should warn about methadone conversion', () => {
      const result = convertOpioidDose(
        OpioidName.MORPHINE, 60, Route.ORAL,
        OpioidName.METHADONE, Route.ORAL,
      );
      expect(result.warnings.some(w => w.includes('Methadone'))).toBe(true);
    });

    it('should handle route unavailability', () => {
      // Oxycodone has no parenteral formulation
      const result = convertOpioidDose(
        OpioidName.OXYCODONE, 20, Route.ORAL,
        OpioidName.OXYCODONE, Route.IV, 0,
      );
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should correctly convert codeine to morphine', () => {
      // Codeine 200mg PO = Morphine 30mg PO
      const result = convertOpioidDose(
        OpioidName.CODEINE, 200, Route.ORAL,
        OpioidName.MORPHINE, Route.ORAL, 0,
      );
      expect(result.toDose).toBeCloseTo(30, 1);
    });
  });

  // ==========================================================================
  // PCA Protocols
  // ==========================================================================
  describe('PCA protocols', () => {
    it('should generate morphine PCA for opioid-naive patient', () => {
      const pca = generatePCAProtocol(OpioidName.MORPHINE, makeDefaultContext());
      expect(pca.drug).toBe('Morphine');
      expect(pca.demandDose).toContain('1-2 mg');
      expect(pca.continuousRate).toContain('None');
      expect(pca.loadingDose).toBeNull();
    });

    it('should include continuous rate for opioid-tolerant patient', () => {
      const pca = generatePCAProtocol(OpioidName.MORPHINE, makeDefaultContext({ isOpioidTolerant: true }));
      expect(pca.continuousRate).toContain('mg/hr');
      expect(pca.loadingDose).toBeTruthy();
    });

    it('should reduce dose for renal impairment', () => {
      const pca = generatePCAProtocol(OpioidName.MORPHINE, makeDefaultContext({ creatinineClearance: 25 }));
      expect(pca.demandDose).toContain('0.5-1 mg');
      expect(pca.hourlyLimit).toBe('6 mg');
    });

    it('should include comprehensive monitoring', () => {
      const pca = generatePCAProtocol(OpioidName.HYDROMORPHONE, makeDefaultContext());
      expect(pca.monitoring.length).toBeGreaterThanOrEqual(5);
      expect(pca.monitoring.some(m => m.includes('Respiratory'))).toBe(true);
      expect(pca.monitoring.some(m => m.includes('Naloxone'))).toBe(true);
    });

    it('should generate hydromorphone PCA protocol', () => {
      const pca = generatePCAProtocol(OpioidName.HYDROMORPHONE, makeDefaultContext());
      expect(pca.drug).toBe('Hydromorphone');
      expect(pca.concentration).toBe('0.2 mg/mL');
    });
  });

  // ==========================================================================
  // Multimodal Analgesia
  // ==========================================================================
  describe('multimodal protocol', () => {
    it('should always include scheduled acetaminophen', () => {
      const protocol = generateMultimodalProtocol(5, makeDefaultContext());
      expect(protocol.scheduled.some(m => m.genericName === 'acetaminophen')).toBe(true);
    });

    it('should include NSAID (ketorolac) for eligible patients', () => {
      const protocol = generateMultimodalProtocol(5, makeDefaultContext());
      expect(protocol.scheduled.some(m => m.genericName === 'ketorolac')).toBe(true);
    });

    it('should exclude NSAIDs for renal impairment', () => {
      const protocol = generateMultimodalProtocol(5, makeDefaultContext({ creatinineClearance: 20 }));
      expect(protocol.scheduled.some(m => m.genericName === 'ketorolac')).toBe(false);
    });

    it('should include opioid PRN for moderate-severe pain', () => {
      const protocol = generateMultimodalProtocol(7, makeDefaultContext());
      expect(protocol.prn.length).toBeGreaterThan(0);
      expect(protocol.prn.some(m => m.genericName === 'oxycodone' || m.genericName === 'morphine')).toBe(true);
    });

    it('should include side effect monitoring protocol', () => {
      const protocol = generateMultimodalProtocol(5, makeDefaultContext());
      expect(protocol.monitoring.sedationScale).toContain('Pasero');
      expect(protocol.monitoring.respiratoryRateMin).toBe(10);
      expect(protocol.monitoring.constipationProphylaxis).toContain('Docusate');
    });

    it('should reduce ketorolac dose for elderly', () => {
      const protocol = generateMultimodalProtocol(5, makeDefaultContext({ ageYears: 70 }));
      const ketorolac = protocol.scheduled.find(m => m.genericName === 'ketorolac');
      expect(ketorolac?.dose).toBe('15 mg');
    });
  });

  // ==========================================================================
  // Self-Learning
  // ==========================================================================
  describe('self-learning', () => {
    it('should have pre-generated outcome data', () => {
      expect(painProtocolEngine.getOutcomesCount()).toBeGreaterThanOrEqual(150);
    });

    it('should track average pain reduction', () => {
      const data = painProtocolEngine.getLearningData();
      expect(data.averagePainReduction).toBeGreaterThan(0);
    });

    it('should track medication-specific effectiveness', () => {
      const morphineEff = painProtocolEngine.getMedicationEffectiveness('morphine');
      expect(morphineEff).not.toBeNull();
      expect(morphineEff!.uses).toBeGreaterThan(0);
      expect(morphineEff!.avgReduction).toBeGreaterThan(0);
    });

    it('should track side effect rates', () => {
      const data = painProtocolEngine.getLearningData();
      const opioids = ['morphine', 'oxycodone', 'hydromorphone', 'fentanyl'];
      for (const name of opioids) {
        const eff = data.medicationEffectiveness[name];
        if (eff) {
          expect(eff.sideEffectRate).toBeGreaterThanOrEqual(0);
          expect(eff.sideEffectRate).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should update learning data on new outcome', () => {
      const before = painProtocolEngine.getOutcomesCount();
      painProtocolEngine.recordPainOutcome({
        patientId: 'test-learn',
        timestamp: new Date().toISOString(),
        painBefore: 8,
        painAfter: 3,
        medicationUsed: 'morphine',
        doseGiven: '4 mg IV',
        timeToPeakRelief: 15,
        durationOfRelief: 3,
        sideEffects: ['nausea'],
        effective: true,
      });
      expect(painProtocolEngine.getOutcomesCount()).toBe(before + 1);
    });
  });
});
