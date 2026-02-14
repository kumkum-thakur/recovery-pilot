import { describe, it, expect, beforeEach } from 'vitest';
import {
  createClinicalDocumentGenerator,
  CDADocumentType,
  CDASectionType,
  CDA_OIDS,
  LOINC_DOCUMENT_CODES,
  SECTION_LOINC_CODES,
  type ClinicalDocumentGenerator,
  type CDADocumentInput,
} from '../clinicalDocumentGenerator';

describe('ClinicalDocumentGenerator', () => {
  let generator: ClinicalDocumentGenerator;

  const baseInput: CDADocumentInput = {
    documentType: CDADocumentType.CCD,
    patientId: 'patient-001',
    patientName: { given: 'John', family: 'Doe' },
    patientDOB: '1960-05-15',
    patientGender: 'male',
    patientMRN: 'MRN-12345',
    author: { role: 'AUTHOR' as const, name: { given: 'Sarah', family: 'Johnson' }, npi: '1234567890', organization: 'General Hospital' },
    custodian: { role: 'CUSTODIAN' as const, name: { given: 'Admin', family: 'Staff' }, organization: 'General Hospital' },
    encounterDate: '2025-01-15T10:00:00Z',
    sections: [
      { type: CDASectionType.ALLERGIES, entries: [{ text: 'Penicillin - anaphylaxis' }] },
      { type: CDASectionType.MEDICATIONS, entries: [{ text: 'Metoprolol 25mg BID' }, { text: 'Lisinopril 10mg daily' }] },
      { type: CDASectionType.PROBLEMS, entries: [{ text: 'Hypertension - I10' }, { text: 'Osteoarthritis - M17.11' }] },
      { type: CDASectionType.PROCEDURES, entries: [{ text: 'Total knee arthroplasty - 27447' }] },
      { type: CDASectionType.VITALS, entries: [{ text: 'BP 130/80, HR 72, Temp 98.6F' }] },
      { type: CDASectionType.RESULTS, entries: [{ text: 'Hemoglobin 13.5 g/dL (normal)' }] },
    ],
  };

  beforeEach(() => {
    generator = createClinicalDocumentGenerator();
  });

  describe('OID Database', () => {
    it('should contain real CDA template OIDs', () => {
      expect(CDA_OIDS.CCD_TEMPLATE).toBe('2.16.840.1.113883.10.20.22.1.2');
      expect(CDA_OIDS.DISCHARGE_SUMMARY_TEMPLATE).toBe('2.16.840.1.113883.10.20.22.1.8');
      expect(CDA_OIDS.OPERATIVE_NOTE_TEMPLATE).toBe('2.16.840.1.113883.10.20.22.1.7');
      expect(CDA_OIDS.US_REALM_HEADER).toBe('2.16.840.1.113883.10.20.22.1.1');
    });

    it('should contain real section OIDs', () => {
      expect(CDA_OIDS.ALLERGIES_SECTION).toBe('2.16.840.1.113883.10.20.22.2.6.1');
      expect(CDA_OIDS.MEDICATIONS_SECTION).toBe('2.16.840.1.113883.10.20.22.2.1.1');
      expect(CDA_OIDS.PROBLEMS_SECTION).toBe('2.16.840.1.113883.10.20.22.2.5.1');
    });

    it('should lookup OIDs by key', () => {
      expect(generator.getOID('LOINC_OID')).toBe('2.16.840.1.113883.6.1');
      expect(generator.getOID('SNOMED_CT_OID')).toBe('2.16.840.1.113883.6.96');
      expect(generator.getOID('NPI_OID')).toBe('2.16.840.1.113883.4.6');
    });

    it('should have real LOINC document type codes', () => {
      expect(LOINC_DOCUMENT_CODES.CCD.code).toBe('34133-9');
      expect(LOINC_DOCUMENT_CODES.DISCHARGE_SUMMARY.code).toBe('18842-5');
      expect(LOINC_DOCUMENT_CODES.OPERATIVE_NOTE.code).toBe('11504-8');
    });

    it('should have real section LOINC codes', () => {
      expect(SECTION_LOINC_CODES.ALLERGIES.code).toBe('48765-2');
      expect(SECTION_LOINC_CODES.MEDICATIONS.code).toBe('10160-0');
      expect(SECTION_LOINC_CODES.VITALS.code).toBe('8716-3');
    });
  });

  describe('CCD Generation', () => {
    it('should generate a valid CCD document', () => {
      const doc = generator.generateCCD(baseInput);
      expect(doc.documentType).toBe(CDADocumentType.CCD);
      expect(doc.title).toBe('Continuity of Care Document');
      expect(doc.templateIds).toContain(CDA_OIDS.US_REALM_HEADER);
      expect(doc.templateIds).toContain(CDA_OIDS.CCD_TEMPLATE);
      expect(doc.loincCode).toBe('34133-9');
    });

    it('should include proper header with patient and author', () => {
      const doc = generator.generateCCD(baseInput);
      expect(doc.header.patient.name.given).toBe('John');
      expect(doc.header.patient.name.family).toBe('Doe');
      expect(doc.header.author.npi).toBe('1234567890');
      expect(doc.header.custodian.organization).toBe('General Hospital');
    });

    it('should build sections with LOINC codes and template IDs', () => {
      const doc = generator.generateCCD(baseInput);
      const allergiesSection = doc.sections.find(s => s.type === CDASectionType.ALLERGIES);
      expect(allergiesSection).toBeDefined();
      expect(allergiesSection!.loincCode).toBe('48765-2');
      expect(allergiesSection!.templateId).toBe(CDA_OIDS.ALLERGIES_SECTION);
    });
  });

  describe('Discharge Summary', () => {
    it('should generate a discharge summary with required sections', () => {
      const dsInput: CDADocumentInput = {
        ...baseInput,
        documentType: CDADocumentType.DISCHARGE_SUMMARY,
        sections: [
          ...baseInput.sections,
          { type: CDASectionType.HOSPITAL_COURSE, entries: [{ text: 'Patient admitted for TKA. Uneventful recovery.' }] },
          { type: CDASectionType.DISCHARGE_DIAGNOSIS, entries: [{ text: 'Osteoarthritis right knee, status post TKA' }] },
          { type: CDASectionType.DISCHARGE_MEDICATIONS, entries: [{ text: 'Oxycodone 5mg q6h PRN' }] },
          { type: CDASectionType.DISCHARGE_INSTRUCTIONS, entries: [{ text: 'Follow up in 2 weeks.' }] },
        ],
      };
      const doc = generator.generateDischargeSummary(dsInput);
      expect(doc.documentType).toBe(CDADocumentType.DISCHARGE_SUMMARY);
      expect(doc.loincCode).toBe('18842-5');
    });
  });

  describe('Operative Note', () => {
    it('should generate an operative note', () => {
      const opInput: CDADocumentInput = {
        ...baseInput,
        documentType: CDADocumentType.OPERATIVE_NOTE,
        sections: [
          { type: CDASectionType.PREOPERATIVE_DIAGNOSIS, entries: [{ text: 'Osteoarthritis right knee' }] },
          { type: CDASectionType.POSTOPERATIVE_DIAGNOSIS, entries: [{ text: 'Same' }] },
          { type: CDASectionType.OPERATIVE_DESCRIPTION, entries: [{ text: 'TKA performed under spinal anesthesia.' }] },
          { type: CDASectionType.ANESTHESIA, entries: [{ text: 'Spinal anesthesia with sedation' }] },
          { type: CDASectionType.COMPLICATIONS, entries: [{ text: 'None' }] },
          { type: CDASectionType.ESTIMATED_BLOOD_LOSS, entries: [{ text: '200 mL' }] },
          { type: CDASectionType.SPECIMENS, entries: [{ text: 'None sent' }] },
        ],
      };
      const doc = generator.generateOperativeNote(opInput);
      expect(doc.documentType).toBe(CDADocumentType.OPERATIVE_NOTE);
      expect(doc.loincCode).toBe('11504-8');
    });
  });

  describe('Progress Note', () => {
    it('should generate a progress note', () => {
      const pnInput: CDADocumentInput = {
        ...baseInput,
        documentType: CDADocumentType.PROGRESS_NOTE,
        sections: [
          { type: CDASectionType.CHIEF_COMPLAINT, entries: [{ text: 'Post-op day 1 pain management' }] },
          { type: CDASectionType.ASSESSMENT, entries: [{ text: 'Recovering well after TKA' }] },
          { type: CDASectionType.PLAN_OF_CARE, entries: [{ text: 'Continue current regimen, PT evaluation' }] },
        ],
      };
      const doc = generator.generateProgressNote(pnInput);
      expect(doc.documentType).toBe(CDADocumentType.PROGRESS_NOTE);
      expect(doc.loincCode).toBe('11506-3');
    });
  });

  describe('XML Generation', () => {
    it('should generate valid XML content', () => {
      const doc = generator.generateCCD(baseInput);
      expect(doc.xmlContent).toContain('<?xml version="1.0"');
      expect(doc.xmlContent).toContain('<ClinicalDocument');
      expect(doc.xmlContent).toContain('</ClinicalDocument>');
      expect(doc.xmlContent).toContain('<realmCode code="US"');
      expect(doc.xmlContent).toContain('<structuredBody>');
    });

    it('should include NPI in author section', () => {
      const doc = generator.generateCCD(baseInput);
      expect(doc.xmlContent).toContain('1234567890');
      expect(doc.xmlContent).toContain(CDA_OIDS.NPI_OID);
    });
  });

  describe('Document Templates', () => {
    it('should return correct template for each document type', () => {
      const ccdTemplate = generator.getDocumentTemplate(CDADocumentType.CCD);
      expect(ccdTemplate.requiredSections).toContain(CDASectionType.ALLERGIES);
      expect(ccdTemplate.requiredSections).toContain(CDASectionType.MEDICATIONS);
      expect(ccdTemplate.requiredSections).toContain(CDASectionType.PROBLEMS);

      const opTemplate = generator.getDocumentTemplate(CDADocumentType.OPERATIVE_NOTE);
      expect(opTemplate.requiredSections).toContain(CDASectionType.PREOPERATIVE_DIAGNOSIS);
      expect(opTemplate.requiredSections).toContain(CDASectionType.POSTOPERATIVE_DIAGNOSIS);
    });
  });

  describe('Validation', () => {
    it('should validate a complete document as valid', () => {
      const doc = generator.generateCCD(baseInput);
      const result = generator.validateDocument(doc);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing required sections', () => {
      const incomplete: CDADocumentInput = {
        ...baseInput,
        sections: [{ type: CDASectionType.ALLERGIES, entries: [{ text: 'NKDA' }] }],
      };
      const doc = generator.generateCCD(incomplete);
      const result = generator.validateDocument(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Self-Learning (Provider Preferences)', () => {
    it('should record and retrieve provider preferences', () => {
      generator.recordProviderPreference({
        providerId: 'NPI-123',
        documentType: CDADocumentType.CCD,
        preferredSectionOrder: [CDASectionType.MEDICATIONS, CDASectionType.ALLERGIES, CDASectionType.PROBLEMS],
        defaultNarrativeStyle: 'detailed',
        includeOptionalSections: [CDASectionType.SOCIAL_HISTORY],
        lastUpdated: new Date().toISOString(),
      });

      const prefs = generator.getProviderPreferences('NPI-123');
      expect(prefs.length).toBe(1);
      expect(prefs[0].defaultNarrativeStyle).toBe('detailed');
    });

    it('should suggest section order based on provider history', () => {
      generator.recordProviderPreference({
        providerId: 'NPI-456',
        documentType: CDADocumentType.CCD,
        preferredSectionOrder: [CDASectionType.PROBLEMS, CDASectionType.MEDICATIONS, CDASectionType.ALLERGIES],
        defaultNarrativeStyle: 'brief',
        includeOptionalSections: [],
        lastUpdated: new Date().toISOString(),
      });

      const order = generator.suggestSectionOrder('NPI-456', CDADocumentType.CCD);
      expect(order[0]).toBe(CDASectionType.PROBLEMS);
      expect(order[1]).toBe(CDASectionType.MEDICATIONS);
    });
  });
});
