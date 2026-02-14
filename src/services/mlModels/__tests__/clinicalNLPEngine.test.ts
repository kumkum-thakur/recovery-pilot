import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  ClinicalNLPEngine,
  createClinicalNLPEngine,
  EntityType,
  RelationType,
} from '../clinicalNLPEngine';

describe('ClinicalNLPEngine', () => {
  let engine: ClinicalNLPEngine;

  beforeEach(() => {
    localStorage.clear();
    engine = createClinicalNLPEngine();
  });

  // ---- Dictionary Size ----

  it('should have 500+ terms in the dictionary', () => {
    expect(engine.getDictionarySize()).toBeGreaterThanOrEqual(500);
  });

  // ---- Medication Entity Extraction ----

  it('should extract medication entities from clinical text', () => {
    const result = engine.extractEntities('Patient is taking morphine 10 mg IV q4h for pain management.');
    const meds = result.entities.filter(e => e.type === EntityType.MEDICATION);
    expect(meds.some(m => m.normalizedForm === 'morphine')).toBe(true);
  });

  it('should recognize brand name medications', () => {
    const result = engine.extractEntities('Started on Zofran 4 mg IV for nausea.');
    const meds = result.entities.filter(e => e.type === EntityType.MEDICATION);
    expect(meds.some(m => m.normalizedForm === 'ondansetron')).toBe(true);
  });

  it('should extract multiple medications from a medication list', () => {
    const text = 'Current medications: lisinopril 10 mg daily, metformin 500 mg bid, atorvastatin 20 mg qhs, aspirin 81 mg daily';
    const result = engine.extractEntities(text);
    const meds = result.entities.filter(e => e.type === EntityType.MEDICATION);
    const medNames = meds.map(m => m.normalizedForm);
    expect(medNames).toContain('lisinopril');
    expect(medNames).toContain('metformin');
    expect(medNames).toContain('atorvastatin');
    expect(medNames).toContain('aspirin');
  });

  // ---- Condition Entity Extraction ----

  it('should extract condition entities', () => {
    const result = engine.extractEntities('Patient diagnosed with deep vein thrombosis in the left leg.');
    const conditions = result.entities.filter(e => e.type === EntityType.CONDITION);
    expect(conditions.some(c => c.normalizedForm === 'deep vein thrombosis')).toBe(true);
  });

  it('should recognize abbreviations for conditions', () => {
    const result = engine.extractEntities('Monitoring for DVT and PE post-operatively.');
    const conditions = result.entities.filter(e => e.type === EntityType.CONDITION);
    expect(conditions.some(c => c.normalizedForm === 'deep vein thrombosis')).toBe(true);
    expect(conditions.some(c => c.normalizedForm === 'pulmonary embolism')).toBe(true);
  });

  // ---- Procedure Extraction ----

  it('should extract procedure entities', () => {
    const result = engine.extractEntities('Patient underwent total knee arthroplasty on the right knee.');
    const procs = result.entities.filter(e => e.type === EntityType.PROCEDURE);
    expect(procs.some(p => p.normalizedForm === 'total knee arthroplasty')).toBe(true);
  });

  it('should recognize procedure abbreviations (TKA, CABG)', () => {
    const result = engine.extractEntities('Status post TKA with uneventful recovery.');
    const procs = result.entities.filter(e => e.type === EntityType.PROCEDURE);
    expect(procs.some(p => p.normalizedForm === 'total knee arthroplasty')).toBe(true);
  });

  // ---- Lab Value Extraction ----

  it('should extract lab value entities', () => {
    const result = engine.extractEntities('Lab results: hemoglobin 10.2, WBC 12.5, creatinine 1.4');
    const labs = result.entities.filter(e => e.type === EntityType.LAB_VALUE);
    expect(labs.some(l => l.normalizedForm === 'hemoglobin')).toBe(true);
    expect(labs.some(l => l.normalizedForm === 'creatinine')).toBe(true);
  });

  // ---- Anatomy Extraction ----

  it('should extract anatomy entities', () => {
    const result = engine.extractEntities('Erythema noted around the surgical wound on the left knee.');
    const anat = result.entities.filter(e => e.type === EntityType.ANATOMY);
    expect(anat.some(a => a.normalizedForm === 'wound' || a.normalizedForm === 'knee')).toBe(true);
  });

  // ---- Negation Detection (NegEx) ----

  it('should detect negation with pre-negation triggers', () => {
    const result = engine.extractEntities('No fever or nausea reported today.');
    const negated = result.negatedEntities;
    expect(negated.length).toBeGreaterThan(0);
    expect(negated.some(e => e.type === EntityType.CONDITION)).toBe(true);
  });

  it('should detect negation with "denies"', () => {
    const result = engine.extractEntities('Patient denies fever, nausea, and vomiting.');
    const negated = result.negatedEntities;
    expect(negated.some(e => e.normalizedForm === 'fever')).toBe(true);
    expect(negated.some(e => e.normalizedForm === 'nausea')).toBe(true);
  });

  it('should not negate entities after termination words', () => {
    // "no fever but has pain" - "pain" should NOT be negated
    const isNeg = engine.detectNegation('no fever but has pain', 24, 28);
    expect(isNeg).toBe(false);
  });

  it('should detect post-negation triggers', () => {
    const result = engine.extractEntities('Pulmonary embolism was ruled out by CT angiography.');
    const negated = result.negatedEntities;
    expect(negated.some(e => e.normalizedForm === 'pulmonary embolism')).toBe(true);
  });

  // ---- Dosage Extraction ----

  it('should extract dosage information', () => {
    const result = engine.extractEntities('Administer morphine 4 mg IV every 4 hours as needed for pain.');
    const dosages = result.entities.filter(e => e.type === EntityType.DOSAGE);
    expect(dosages.some(d => d.text.includes('4 mg'))).toBe(true);
  });

  // ---- Frequency Extraction ----

  it('should extract frequency information', () => {
    const result = engine.extractEntities('Take acetaminophen 500 mg twice daily.');
    const freqs = result.entities.filter(e => e.type === EntityType.FREQUENCY);
    expect(freqs.some(f => f.text.toLowerCase().includes('twice daily'))).toBe(true);
  });

  // ---- Temporal Expression Extraction ----

  it('should extract temporal expressions', () => {
    const result = engine.extractEntities('Surgery performed on 01/15/2025. Follow-up in 2 weeks.');
    expect(result.temporalExpressions.length).toBeGreaterThanOrEqual(1);
    expect(result.temporalExpressions.some(t => t.type === 'date')).toBe(true);
  });

  it('should extract relative temporal expressions', () => {
    const result = engine.extractEntities('Patient reports increased pain today. Wound checked yesterday.');
    expect(result.temporalExpressions.some(t => t.text.toLowerCase() === 'today')).toBe(true);
    expect(result.temporalExpressions.some(t => t.text.toLowerCase() === 'yesterday')).toBe(true);
  });

  it('should extract post-operative day references', () => {
    const result = engine.extractEntities('Post-operative day #3: patient ambulating well.');
    expect(result.temporalExpressions.length).toBeGreaterThan(0);
  });

  // ---- Relation Extraction ----

  it('should extract dosage-of relations', () => {
    const result = engine.extractEntities('morphine 10 mg');
    const dosageRels = result.relations.filter(r => r.relationType === RelationType.DOSAGE_OF);
    expect(dosageRels.length).toBeGreaterThanOrEqual(1);
  });

  it('should extract negation relations', () => {
    const result = engine.extractEntities('No evidence of pneumonia on chest x-ray.');
    const negRels = result.relations.filter(r => r.relationType === RelationType.NEGATED);
    expect(negRels.length).toBeGreaterThan(0);
  });

  // ---- UMLS Concept Lookup ----

  it('should look up concept by CUI', () => {
    const concept = engine.lookupConcept('C0026549'); // morphine
    expect(concept).not.toBeNull();
    expect(concept!.preferred).toBe('morphine');
    expect(concept!.type).toBe(EntityType.MEDICATION);
  });

  it('should return null for unknown CUI', () => {
    expect(engine.lookupConcept('C9999999')).toBeNull();
  });

  // ---- Self-Learning Tests ----

  it('should record clinician corrections', () => {
    engine.recordCorrection(
      'Patient has GERD',
      { text: 'GERD', type: EntityType.CONDITION },
      EntityType.CONDITION,
      'gastroesophageal reflux disease',
      'doc-1'
    );
    const stats = engine.getCorrectionStats();
    expect(stats.totalCorrections).toBe(1);
    expect(stats.customTermsAdded).toBe(1);
  });

  it('should add custom terms from corrections', () => {
    const initialSize = engine.getDictionarySize();
    engine.recordCorrection(
      'test text',
      { text: 'fasciotomy', type: EntityType.PROCEDURE },
      EntityType.PROCEDURE,
      'fasciotomy',
      'doc-1'
    );
    expect(engine.getDictionarySize()).toBe(initialSize + 1);

    // Now the new term should be found
    const result = engine.extractEntities('Performed an emergency fasciotomy.');
    expect(result.entities.some(e => e.text === 'fasciotomy')).toBe(true);
  });

  it('should track false positives', () => {
    engine.recordCorrection(
      'test text',
      { text: 'cold', type: EntityType.CONDITION },
      null, // false positive
      null,
      'doc-1'
    );
    const stats = engine.getCorrectionStats();
    expect(stats.falsePositives).toBe(1);
  });

  it('should persist corrections to localStorage', () => {
    engine.recordCorrection('text', { text: 'test', type: EntityType.CONDITION }, EntityType.PROCEDURE, 'corrected', 'doc-1');
    const engine2 = createClinicalNLPEngine();
    expect(engine2.getCorrections().length).toBe(1);
  });

  it('should reset learning state', () => {
    engine.recordCorrection('text', { text: 'test', type: EntityType.CONDITION }, EntityType.PROCEDURE, 'corrected', 'doc-1');
    engine.resetLearning();
    expect(engine.getCorrections().length).toBe(0);
    expect(engine.getCorrectionStats().customTermsAdded).toBe(0);
  });

  // ---- Complex Clinical Text Tests ----

  it('should handle complex clinical note', () => {
    const note = `
      Assessment and Plan: 68-year-old male, post-operative day #2 following total hip arthroplasty.
      Currently receiving enoxaparin 40 mg subcutaneous daily for DVT prophylaxis.
      No signs of surgical site infection. Wound is clean and dry.
      Pain managed with oxycodone 5 mg q4h PRN, current pain 4/10.
      Labs: Hemoglobin 11.2 g/dL, WBC 8.5 K/uL, Creatinine 0.9 mg/dL.
      Patient denies chest pain, shortness of breath, and calf tenderness.
      Physical therapy initiated today. Plan for discharge tomorrow if stable.
    `;

    const result = engine.extractEntities(note);

    // Should find medications
    const meds = result.entities.filter(e => e.type === EntityType.MEDICATION);
    expect(meds.length).toBeGreaterThanOrEqual(2);

    // Should find procedures
    const procs = result.entities.filter(e => e.type === EntityType.PROCEDURE);
    expect(procs.some(p => p.normalizedForm === 'total hip arthroplasty')).toBe(true);

    // Should find negated conditions
    expect(result.negatedEntities.length).toBeGreaterThan(0);

    // Should find temporal expressions
    expect(result.temporalExpressions.length).toBeGreaterThan(0);
  });

  // ---- Property-Based Tests ----

  it('should never produce entities with invalid type', () => {
    const validTypes = Object.values(EntityType);
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 200 }),
        (text) => {
          const result = engine.extractEntities(text);
          for (const entity of result.entities) {
            if (!validTypes.includes(entity.type)) return false;
          }
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should always produce valid entity indices', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'Patient takes morphine 10 mg for pain.',
          'No signs of infection. DVT ruled out.',
          'Post-op day 2, started on heparin drip.',
          'Hemoglobin 9.8, creatinine 1.2, WBC 15.',
        ),
        (text) => {
          const result = engine.extractEntities(text);
          for (const entity of result.entities) {
            if (entity.startIndex < 0 || entity.endIndex > text.length) return false;
            if (entity.startIndex >= entity.endIndex) return false;
          }
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should have confidence between 0 and 1 for all entities', () => {
    const texts = [
      'Administered vancomycin 1g IV for suspected osteomyelitis.',
      'Patient with diabetes and hypertension on metformin and lisinopril.',
      'CT scan shows no pulmonary embolism.',
    ];

    for (const text of texts) {
      const result = engine.extractEntities(text);
      for (const entity of result.entities) {
        expect(entity.confidence).toBeGreaterThan(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  it('should handle empty text gracefully', () => {
    const result = engine.extractEntities('');
    expect(result.entities.length).toBe(0);
    expect(result.relations.length).toBe(0);
    expect(result.temporalExpressions.length).toBe(0);
  });

  it('should handle text with no medical terms', () => {
    const result = engine.extractEntities('The weather is nice today and the sun is shining.');
    // May have "today" as temporal but no medical entities
    const medicalEntities = result.entities.filter(
      e => e.type !== EntityType.TEMPORAL && e.type !== EntityType.DOSAGE && e.type !== EntityType.FREQUENCY
    );
    expect(medicalEntities.length).toBe(0);
  });
});
