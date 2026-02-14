import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFHIRResourceEngine,
  SNOMED_CODES,
  LOINC_CODES,
  ICD10_CODES,
  CODING_SYSTEMS,
  BundleType,
  type FHIRResourceEngine,
  type FHIRResource,
  type FHIRCoding,
} from '../fhirResourceEngine';

describe('FHIRResourceEngine', () => {
  let engine: FHIRResourceEngine;

  beforeEach(() => {
    engine = createFHIRResourceEngine();
  });

  describe('SNOMED CT Code Database', () => {
    it('should have 90+ real SNOMED CT codes', () => {
      const codeCount = Object.keys(SNOMED_CODES).length;
      expect(codeCount).toBeGreaterThanOrEqual(90);
    });

    it('should contain valid SNOMED CT codes for post-operative conditions', () => {
      expect(SNOMED_CODES.POSTOPERATIVE_PAIN.code).toBe('213299007');
      expect(SNOMED_CODES.DVT.code).toBe('128053003');
      expect(SNOMED_CODES.SURGICAL_WOUND_INFECTION.code).toBe('414478003');
      expect(SNOMED_CODES.ATELECTASIS.code).toBe('46621007');
      expect(SNOMED_CODES.PULMONARY_EMBOLISM.code).toBe('59282003');
      expect(SNOMED_CODES.TOTAL_KNEE_REPLACEMENT.code).toBe('609588000');
    });

    it('should lookup SNOMED codes correctly', () => {
      const coding = engine.lookupSNOMED('POSTOPERATIVE_PAIN');
      expect(coding).not.toBeNull();
      expect(coding!.system).toBe(CODING_SYSTEMS.SNOMED_CT);
      expect(coding!.code).toBe('213299007');
      expect(coding!.display).toBe('Postoperative pain');
    });

    it('should return null for unknown SNOMED keys', () => {
      expect(engine.lookupSNOMED('NONEXISTENT')).toBeNull();
    });
  });

  describe('LOINC Code Database', () => {
    it('should have 50+ real LOINC codes', () => {
      expect(Object.keys(LOINC_CODES).length).toBeGreaterThanOrEqual(50);
    });

    it('should contain valid LOINC codes with units and normal ranges', () => {
      expect(LOINC_CODES.HEMOGLOBIN.code).toBe('718-7');
      expect(LOINC_CODES.HEMOGLOBIN.unit).toBe('g/dL');
      expect(LOINC_CODES.HEMOGLOBIN.normalRange.low).toBe(12.0);
      expect(LOINC_CODES.HEMOGLOBIN.normalRange.high).toBe(17.5);

      expect(LOINC_CODES.HEART_RATE.code).toBe('8867-4');
      expect(LOINC_CODES.CREATININE.code).toBe('2160-0');
      expect(LOINC_CODES.TROPONIN_I.code).toBe('10839-9');
    });

    it('should lookup LOINC codes correctly', () => {
      const coding = engine.lookupLOINC('WBC');
      expect(coding).not.toBeNull();
      expect(coding!.system).toBe(CODING_SYSTEMS.LOINC);
      expect(coding!.code).toBe('6690-2');
    });
  });

  describe('ICD-10-CM Code Database', () => {
    it('should have 50+ real ICD-10 codes', () => {
      expect(Object.keys(ICD10_CODES).length).toBeGreaterThanOrEqual(50);
    });

    it('should contain valid ICD-10 codes', () => {
      expect(ICD10_CODES.SEPSIS.code).toBe('A41.9');
      expect(ICD10_CODES.ATRIAL_FIBRILLATION.code).toBe('I48.91');
      expect(ICD10_CODES.ACUTE_POSTOP_PAIN.code).toBe('G89.18');
      expect(ICD10_CODES.TYPE_2_DIABETES.code).toBe('E11.9');
    });

    it('should lookup ICD-10 codes correctly', () => {
      const coding = engine.lookupICD10('SEPSIS');
      expect(coding).not.toBeNull();
      expect(coding!.system).toBe(CODING_SYSTEMS.ICD10_CM);
      expect(coding!.code).toBe('A41.9');
    });
  });

  describe('Patient Resource', () => {
    it('should create a valid FHIR Patient resource', () => {
      const patient = engine.createPatient({
        givenName: 'John',
        familyName: 'Doe',
        birthDate: '1960-05-15',
        gender: 'male',
        mrn: 'MRN-12345',
      });

      expect(patient.resourceType).toBe('Patient');
      expect(patient.id).toBeDefined();
      expect(patient.gender).toBe('male');
      expect(patient.birthDate).toBe('1960-05-15');
      const names = patient.name as Array<{ family: string; given: string[] }>;
      expect(names[0].family).toBe('Doe');
      expect(names[0].given).toContain('John');
      expect(patient.meta).toBeDefined();
    });

    it('should include US Core profile in Patient', () => {
      const patient = engine.createPatient({
        givenName: 'Jane', familyName: 'Smith', birthDate: '1985-03-20', gender: 'female',
      });
      expect(patient.meta?.profile).toContain('http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient');
    });
  });

  describe('Observation Resource', () => {
    it('should create a valid Observation with LOINC coding', () => {
      const obs = engine.createObservation({
        patientId: 'patient-1',
        loincCode: 'HEMOGLOBIN',
        value: 13.5,
        effectiveDateTime: '2025-01-15T10:00:00Z',
      });

      expect(obs.resourceType).toBe('Observation');
      expect(obs.status).toBe('final');
      const code = obs.code as { coding: FHIRCoding[] };
      expect(code.coding[0].system).toBe(CODING_SYSTEMS.LOINC);
      expect(code.coding[0].code).toBe('718-7');
      const vq = obs.valueQuantity as { value: number; unit: string };
      expect(vq.value).toBe(13.5);
      expect(vq.unit).toBe('g/dL');
    });

    it('should include reference range from LOINC database', () => {
      const obs = engine.createObservation({
        patientId: 'patient-1',
        loincCode: 'GLUCOSE',
        value: 110,
        effectiveDateTime: '2025-01-15T10:00:00Z',
        interpretation: 'H',
      });

      const refRange = obs.referenceRange as Array<{ low: { value: number }; high: { value: number } }>;
      expect(refRange).toBeDefined();
      expect(refRange[0].low.value).toBe(70);
      expect(refRange[0].high.value).toBe(100);
    });
  });

  describe('Condition Resource', () => {
    it('should create Condition with SNOMED and ICD-10 dual coding', () => {
      const condition = engine.createCondition({
        patientId: 'patient-1',
        snomedCode: 'POSTOPERATIVE_PAIN',
        icd10Code: 'ACUTE_POSTOP_PAIN',
        clinicalStatus: 'active',
        verificationStatus: 'confirmed',
      });

      expect(condition.resourceType).toBe('Condition');
      const code = condition.code as { coding: FHIRCoding[] };
      expect(code.coding.length).toBe(2);
      expect(code.coding[0].system).toBe(CODING_SYSTEMS.SNOMED_CT);
      expect(code.coding[1].system).toBe(CODING_SYSTEMS.ICD10_CM);
    });
  });

  describe('Bundle Generation', () => {
    it('should create a transaction bundle with request entries', () => {
      const patient = engine.createPatient({ givenName: 'Test', familyName: 'User', birthDate: '1990-01-01', gender: 'male' });
      const obs = engine.createObservation({ patientId: patient.id, loincCode: 'HEART_RATE', value: 72, effectiveDateTime: '2025-01-01T00:00:00Z' });

      const bundle = engine.createBundle(BundleType.TRANSACTION, [patient, obs]);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('transaction');
      expect(bundle.entry.length).toBe(2);
      expect(bundle.entry[0].request).toBeDefined();
      expect(bundle.entry[0].request!.method).toBe('POST');
      expect(bundle.entry[0].request!.url).toBe('Patient');
    });

    it('should create a searchset bundle with search entries', () => {
      const obs = engine.createObservation({ patientId: 'p1', loincCode: 'WBC', value: 8.5, effectiveDateTime: '2025-01-01T00:00:00Z' });
      const bundle = engine.createBundle(BundleType.SEARCHSET, [obs]);

      expect(bundle.type).toBe('searchset');
      expect(bundle.entry[0].search).toBeDefined();
      expect(bundle.entry[0].search!.mode).toBe('match');
      expect(bundle.link).toBeDefined();
    });

    it('should create a document bundle', () => {
      const patient = engine.createPatient({ givenName: 'A', familyName: 'B', birthDate: '2000-01-01', gender: 'female' });
      const bundle = engine.createBundle(BundleType.DOCUMENT, [patient]);
      expect(bundle.type).toBe('document');
      expect(bundle.total).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should validate a valid Patient resource', () => {
      const patient = engine.createPatient({ givenName: 'Valid', familyName: 'Patient', birthDate: '1980-01-01', gender: 'male' });
      const result = engine.validateResource(patient);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail validation for resource missing resourceType', () => {
      const bad: FHIRResource = { resourceType: '', id: 'test' };
      const result = engine.validateResource(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'resourceType')).toBe(true);
    });

    it('should fail validation for Patient without name', () => {
      const bad: FHIRResource = { resourceType: 'Patient', id: 'test', gender: 'male' };
      const result = engine.validateResource(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('name'))).toBe(true);
    });

    it('should validate MedicationRequest required fields', () => {
      const medReq = engine.createMedicationRequest({
        patientId: 'p1', medicationName: 'Acetaminophen', dosageText: '500mg q6h',
        status: 'active', intent: 'order', authoredOn: '2025-01-01',
      });
      const result = engine.validateResource(medReq);
      expect(result.valid).toBe(true);
    });
  });

  describe('Resource Linking', () => {
    it('should link resources with proper references', () => {
      const patient = engine.createPatient({ givenName: 'L', familyName: 'P', birthDate: '1970-01-01', gender: 'female' });
      const encounter = engine.createEncounter({ patientId: patient.id, status: 'in-progress', class: 'IMP', period: { start: '2025-01-01' } });
      const obs = engine.createObservation({ patientId: patient.id, loincCode: 'HEMOGLOBIN', value: 11.0, effectiveDateTime: '2025-01-01T00:00:00Z' });

      const linked = engine.linkResources(obs, encounter, 'encounter');
      const ref = linked.encounter as { reference: string };
      expect(ref.reference).toBe(`Encounter/${encounter.id}`);
    });
  });

  describe('Self-Learning', () => {
    it('should record and retrieve corrections', () => {
      engine.recordCorrection({
        timestamp: new Date().toISOString(),
        resourceType: 'SNOMED',
        field: 'code',
        originalValue: 'POSTOPERATIVE_PAIN',
        correctedValue: '274663001',
        context: 'User preferred acute pain code',
      });

      const mappings = engine.getLearnedMappings();
      expect(mappings.length).toBe(1);
      expect(mappings[0].originalValue).toBe('POSTOPERATIVE_PAIN');
      expect(mappings[0].correctedValue).toBe('274663001');
    });

    it('should suggest corrected mappings based on history', () => {
      engine.recordCorrection({
        timestamp: new Date().toISOString(),
        resourceType: 'SNOMED',
        field: 'code',
        originalValue: 'PAIN_CODE',
        correctedValue: '213299007',
      });

      const suggestion = engine.getSuggestedMapping('SNOMED', 'code', 'PAIN_CODE');
      expect(suggestion).toBe('213299007');
    });

    it('should return null when no suggestion available', () => {
      const suggestion = engine.getSuggestedMapping('SNOMED', 'code', 'UNKNOWN');
      expect(suggestion).toBeNull();
    });
  });

  describe('All Resource Types', () => {
    it('should create Procedure with CPT code', () => {
      const proc = engine.createProcedure({
        patientId: 'p1', snomedCode: 'TOTAL_KNEE_REPLACEMENT', cptCode: '27447',
        status: 'completed', performedDateTime: '2025-01-10T08:00:00Z',
      });
      expect(proc.resourceType).toBe('Procedure');
      const code = proc.code as { coding: FHIRCoding[] };
      expect(code.coding.some(c => c.system === CODING_SYSTEMS.CPT)).toBe(true);
    });

    it('should create AllergyIntolerance with criticality', () => {
      const allergy = engine.createAllergyIntolerance({
        patientId: 'p1', substance: 'Penicillin', type: 'allergy', criticality: 'high', reaction: 'Anaphylaxis',
      });
      expect(allergy.resourceType).toBe('AllergyIntolerance');
      expect(allergy.criticality).toBe('high');
    });

    it('should create DiagnosticReport linked to observations', () => {
      const report = engine.createDiagnosticReport({
        patientId: 'p1', loincCode: 'HEMOGLOBIN', status: 'final',
        effectiveDateTime: '2025-01-15T00:00:00Z', observationIds: ['obs-1', 'obs-2'],
        conclusion: 'Normal CBC',
      });
      expect(report.resourceType).toBe('DiagnosticReport');
      const results = report.result as Array<{ reference: string }>;
      expect(results.length).toBe(2);
    });

    it('should create CarePlan with activities', () => {
      const plan = engine.createCarePlan({
        patientId: 'p1', title: 'Post-Op Recovery', status: 'active', intent: 'plan',
        period: { start: '2025-01-15', end: '2025-03-15' },
        activities: [
          { description: 'Physical therapy 3x/week', status: 'scheduled' },
          { description: 'Wound care daily', status: 'in-progress' },
        ],
      });
      expect(plan.resourceType).toBe('CarePlan');
      const activities = plan.activity as Array<{ detail: { description: string } }>;
      expect(activities.length).toBe(2);
    });
  });
});
