/**
 * Feature 34: Clinical Document Generator (CDA R2)
 *
 * Real CDA R2 document structure generation including CCD, Discharge Summary,
 * Operative Note, Progress Note with proper OIDs, sections, and self-learning.
 */

// ============================================================================
// Constants
// ============================================================================

export const CDADocumentType = {
  CCD: 'CCD',
  DISCHARGE_SUMMARY: 'DISCHARGE_SUMMARY',
  OPERATIVE_NOTE: 'OPERATIVE_NOTE',
  PROGRESS_NOTE: 'PROGRESS_NOTE',
  CONSULTATION_NOTE: 'CONSULTATION_NOTE',
  HISTORY_AND_PHYSICAL: 'HISTORY_AND_PHYSICAL',
  TRANSFER_SUMMARY: 'TRANSFER_SUMMARY',
} as const;
export type CDADocumentType = typeof CDADocumentType[keyof typeof CDADocumentType];

export const CDASectionType = {
  ALLERGIES: 'ALLERGIES',
  MEDICATIONS: 'MEDICATIONS',
  PROBLEMS: 'PROBLEMS',
  PROCEDURES: 'PROCEDURES',
  VITALS: 'VITALS',
  RESULTS: 'RESULTS',
  PLAN_OF_CARE: 'PLAN_OF_CARE',
  SOCIAL_HISTORY: 'SOCIAL_HISTORY',
  FAMILY_HISTORY: 'FAMILY_HISTORY',
  FUNCTIONAL_STATUS: 'FUNCTIONAL_STATUS',
  IMMUNIZATIONS: 'IMMUNIZATIONS',
  INSTRUCTIONS: 'INSTRUCTIONS',
  ENCOUNTERS: 'ENCOUNTERS',
  REASON_FOR_VISIT: 'REASON_FOR_VISIT',
  CHIEF_COMPLAINT: 'CHIEF_COMPLAINT',
  ASSESSMENT: 'ASSESSMENT',
  HOSPITAL_COURSE: 'HOSPITAL_COURSE',
  DISCHARGE_DIAGNOSIS: 'DISCHARGE_DIAGNOSIS',
  DISCHARGE_MEDICATIONS: 'DISCHARGE_MEDICATIONS',
  DISCHARGE_INSTRUCTIONS: 'DISCHARGE_INSTRUCTIONS',
  OPERATIVE_DESCRIPTION: 'OPERATIVE_DESCRIPTION',
  PREOPERATIVE_DIAGNOSIS: 'PREOPERATIVE_DIAGNOSIS',
  POSTOPERATIVE_DIAGNOSIS: 'POSTOPERATIVE_DIAGNOSIS',
  ANESTHESIA: 'ANESTHESIA',
  COMPLICATIONS: 'COMPLICATIONS',
  SPECIMENS: 'SPECIMENS',
  ESTIMATED_BLOOD_LOSS: 'ESTIMATED_BLOOD_LOSS',
} as const;
export type CDASectionType = typeof CDASectionType[keyof typeof CDASectionType];

export const ParticipantRole = {
  AUTHOR: 'AUTHOR',
  CUSTODIAN: 'CUSTODIAN',
  AUTHENTICATOR: 'AUTHENTICATOR',
  LEGAL_AUTHENTICATOR: 'LEGAL_AUTHENTICATOR',
  INFORMANT: 'INFORMANT',
  PARTICIPANT: 'PARTICIPANT',
  PERFORMER: 'PERFORMER',
} as const;
export type ParticipantRole = typeof ParticipantRole[keyof typeof ParticipantRole];

// Real OIDs used in CDA documents
export const CDA_OIDS = {
  // Document template OIDs
  CCD_TEMPLATE: '2.16.840.1.113883.10.20.22.1.2',
  DISCHARGE_SUMMARY_TEMPLATE: '2.16.840.1.113883.10.20.22.1.8',
  OPERATIVE_NOTE_TEMPLATE: '2.16.840.1.113883.10.20.22.1.7',
  PROGRESS_NOTE_TEMPLATE: '2.16.840.1.113883.10.20.22.1.9',
  CONSULTATION_NOTE_TEMPLATE: '2.16.840.1.113883.10.20.22.1.4',
  H_AND_P_TEMPLATE: '2.16.840.1.113883.10.20.22.1.3',
  US_REALM_HEADER: '2.16.840.1.113883.10.20.22.1.1',
  TRANSFER_SUMMARY_TEMPLATE: '2.16.840.1.113883.10.20.22.1.13',

  // Section template OIDs
  ALLERGIES_SECTION: '2.16.840.1.113883.10.20.22.2.6.1',
  MEDICATIONS_SECTION: '2.16.840.1.113883.10.20.22.2.1.1',
  PROBLEMS_SECTION: '2.16.840.1.113883.10.20.22.2.5.1',
  PROCEDURES_SECTION: '2.16.840.1.113883.10.20.22.2.7.1',
  VITALS_SECTION: '2.16.840.1.113883.10.20.22.2.4.1',
  RESULTS_SECTION: '2.16.840.1.113883.10.20.22.2.3.1',
  PLAN_OF_CARE_SECTION: '2.16.840.1.113883.10.20.22.2.10',
  SOCIAL_HISTORY_SECTION: '2.16.840.1.113883.10.20.22.2.17',
  FAMILY_HISTORY_SECTION: '2.16.840.1.113883.10.20.22.2.15',
  FUNCTIONAL_STATUS_SECTION: '2.16.840.1.113883.10.20.22.2.14',
  IMMUNIZATIONS_SECTION: '2.16.840.1.113883.10.20.22.2.2.1',
  INSTRUCTIONS_SECTION: '2.16.840.1.113883.10.20.22.2.45',
  ENCOUNTERS_SECTION: '2.16.840.1.113883.10.20.22.2.22.1',
  REASON_FOR_VISIT_SECTION: '2.16.840.1.113883.10.20.22.2.12',
  CHIEF_COMPLAINT_SECTION: '1.3.6.1.4.1.19376.1.5.3.1.1.13.2.1',
  ASSESSMENT_SECTION: '2.16.840.1.113883.10.20.22.2.8',
  HOSPITAL_COURSE_SECTION: '1.3.6.1.4.1.19376.1.5.3.1.3.5',
  DISCHARGE_DIAGNOSIS_SECTION: '2.16.840.1.113883.10.20.22.2.24',
  OPERATIVE_DESCRIPTION_SECTION: '2.16.840.1.113883.10.20.22.2.27',
  PREOPERATIVE_DIAGNOSIS_SECTION: '2.16.840.1.113883.10.20.22.2.34',
  POSTOPERATIVE_DIAGNOSIS_SECTION: '2.16.840.1.113883.10.20.22.2.35',
  ANESTHESIA_SECTION: '2.16.840.1.113883.10.20.22.2.25',
  COMPLICATIONS_SECTION: '2.16.840.1.113883.10.20.22.2.37',

  // Code system OIDs
  LOINC_OID: '2.16.840.1.113883.6.1',
  SNOMED_CT_OID: '2.16.840.1.113883.6.96',
  ICD10_CM_OID: '2.16.840.1.113883.6.90',
  RXNORM_OID: '2.16.840.1.113883.6.88',
  CPT_OID: '2.16.840.1.113883.6.12',
  NPI_OID: '2.16.840.1.113883.4.6',

  // Identifier OIDs
  SSN_OID: '2.16.840.1.113883.4.1',
  EIN_OID: '2.16.840.1.113883.4.4',
} as const;

// LOINC document type codes
export const LOINC_DOCUMENT_CODES: Record<string, { code: string; display: string }> = {
  CCD: { code: '34133-9', display: 'Summarization of Episode Note' },
  DISCHARGE_SUMMARY: { code: '18842-5', display: 'Discharge Summary' },
  OPERATIVE_NOTE: { code: '11504-8', display: 'Surgical operation note' },
  PROGRESS_NOTE: { code: '11506-3', display: 'Progress note' },
  CONSULTATION_NOTE: { code: '11488-4', display: 'Consultation note' },
  HISTORY_AND_PHYSICAL: { code: '34117-2', display: 'History and physical note' },
  TRANSFER_SUMMARY: { code: '18761-7', display: 'Transfer summary note' },
};

// Section LOINC codes
export const SECTION_LOINC_CODES: Record<string, { code: string; display: string }> = {
  ALLERGIES: { code: '48765-2', display: 'Allergies and adverse reactions Document' },
  MEDICATIONS: { code: '10160-0', display: 'History of Medication use Narrative' },
  PROBLEMS: { code: '11450-4', display: 'Problem list - Reported' },
  PROCEDURES: { code: '47519-4', display: 'History of Procedures Document' },
  VITALS: { code: '8716-3', display: 'Vital signs' },
  RESULTS: { code: '30954-2', display: 'Relevant diagnostic tests/laboratory data Narrative' },
  PLAN_OF_CARE: { code: '18776-5', display: 'Plan of care note' },
  SOCIAL_HISTORY: { code: '29762-2', display: 'Social history Narrative' },
  FAMILY_HISTORY: { code: '10157-6', display: 'History of family member diseases Narrative' },
  FUNCTIONAL_STATUS: { code: '47420-5', display: 'Functional status assessment note' },
  IMMUNIZATIONS: { code: '11369-6', display: 'History of Immunization Narrative' },
  INSTRUCTIONS: { code: '69730-0', display: 'Instructions' },
  ENCOUNTERS: { code: '46240-8', display: 'History of Hospitalizations+Outpatient visits Narrative' },
  REASON_FOR_VISIT: { code: '29299-5', display: 'Reason for visit Narrative' },
  CHIEF_COMPLAINT: { code: '10154-3', display: 'Chief complaint Narrative' },
  ASSESSMENT: { code: '51848-0', display: 'Evaluation note' },
  HOSPITAL_COURSE: { code: '8648-8', display: 'Hospital course Narrative' },
  DISCHARGE_DIAGNOSIS: { code: '11535-2', display: 'Hospital discharge Dx Narrative' },
  DISCHARGE_MEDICATIONS: { code: '10183-2', display: 'Hospital discharge medications Narrative' },
  DISCHARGE_INSTRUCTIONS: { code: '8653-8', display: 'Hospital Discharge instructions' },
  OPERATIVE_DESCRIPTION: { code: '10216-0', display: 'Surgical operation note fluids Narrative' },
  PREOPERATIVE_DIAGNOSIS: { code: '10219-4', display: 'Surgical operation note preoperative Dx Narrative' },
  POSTOPERATIVE_DIAGNOSIS: { code: '10218-6', display: 'Surgical operation note postoperative Dx Narrative' },
  ANESTHESIA: { code: '59774-0', display: 'Anesthesia record' },
  COMPLICATIONS: { code: '55109-3', display: 'Complications Document' },
};

// ============================================================================
// Types
// ============================================================================

export type CDAParticipant = {
  role: ParticipantRole;
  name: { given: string; family: string; prefix?: string; suffix?: string };
  npi?: string;
  organization?: string;
  telecom?: { type: string; value: string }[];
  address?: { line: string[]; city: string; state: string; postalCode: string };
};

export type CDASectionEntry = {
  text: string;
  code?: { system: string; code: string; display: string };
  date?: string;
  status?: string;
  details?: Record<string, string>;
};

export type CDASection = {
  type: CDASectionType;
  title: string;
  templateId: string;
  loincCode: string;
  loincDisplay: string;
  entries: CDASectionEntry[];
  narrative?: string;
};

export type CDADocumentInput = {
  documentType: CDADocumentType;
  patientId: string;
  patientName: { given: string; family: string };
  patientDOB: string;
  patientGender: string;
  patientMRN?: string;
  author: CDAParticipant;
  custodian: CDAParticipant;
  authenticator?: CDAParticipant;
  participants?: CDAParticipant[];
  encounterDate: string;
  sections: Array<{
    type: CDASectionType;
    entries: CDASectionEntry[];
    narrative?: string;
  }>;
  title?: string;
  confidentialityCode?: string;
};

export type CDADocument = {
  id: string;
  documentType: CDADocumentType;
  title: string;
  templateIds: string[];
  effectiveTime: string;
  confidentialityCode: string;
  languageCode: string;
  realmCode: string;
  typeId: { root: string; extension: string };
  loincCode: string;
  loincDisplay: string;
  header: {
    patient: {
      id: string;
      name: { given: string; family: string };
      dob: string;
      gender: string;
      mrn?: string;
    };
    author: CDAParticipant;
    custodian: CDAParticipant;
    authenticator?: CDAParticipant;
    participants: CDAParticipant[];
  };
  sections: CDASection[];
  xmlContent: string;
  createdAt: string;
};

export type DocumentTemplate = {
  documentType: CDADocumentType;
  requiredSections: CDASectionType[];
  optionalSections: CDASectionType[];
  templateId: string;
};

export type ProviderPreference = {
  providerId: string;
  documentType: CDADocumentType;
  preferredSectionOrder: CDASectionType[];
  defaultNarrativeStyle: 'brief' | 'detailed' | 'structured';
  includeOptionalSections: CDASectionType[];
  lastUpdated: string;
};

export type ClinicalDocumentGenerator = {
  generateDocument(input: CDADocumentInput): CDADocument;
  generateCCD(input: CDADocumentInput): CDADocument;
  generateDischargeSummary(input: CDADocumentInput): CDADocument;
  generateOperativeNote(input: CDADocumentInput): CDADocument;
  generateProgressNote(input: CDADocumentInput): CDADocument;
  getDocumentTemplate(docType: CDADocumentType): DocumentTemplate;
  buildSection(type: CDASectionType, entries: CDASectionEntry[], narrative?: string): CDASection;
  generateXML(document: CDADocument): string;
  validateDocument(document: CDADocument): { valid: boolean; errors: string[]; warnings: string[] };
  getOID(key: string): string | null;
  recordProviderPreference(preference: ProviderPreference): void;
  getProviderPreferences(providerId: string): ProviderPreference[];
  suggestSectionOrder(providerId: string, documentType: CDADocumentType): CDASectionType[];
};

// ============================================================================
// Document Templates
// ============================================================================

const DOCUMENT_TEMPLATES: Record<CDADocumentType, DocumentTemplate> = {
  [CDADocumentType.CCD]: {
    documentType: CDADocumentType.CCD,
    requiredSections: [
      CDASectionType.ALLERGIES,
      CDASectionType.MEDICATIONS,
      CDASectionType.PROBLEMS,
      CDASectionType.PROCEDURES,
      CDASectionType.RESULTS,
      CDASectionType.VITALS,
    ],
    optionalSections: [
      CDASectionType.PLAN_OF_CARE,
      CDASectionType.SOCIAL_HISTORY,
      CDASectionType.FAMILY_HISTORY,
      CDASectionType.FUNCTIONAL_STATUS,
      CDASectionType.IMMUNIZATIONS,
      CDASectionType.ENCOUNTERS,
    ],
    templateId: CDA_OIDS.CCD_TEMPLATE,
  },
  [CDADocumentType.DISCHARGE_SUMMARY]: {
    documentType: CDADocumentType.DISCHARGE_SUMMARY,
    requiredSections: [
      CDASectionType.ALLERGIES,
      CDASectionType.MEDICATIONS,
      CDASectionType.PROBLEMS,
      CDASectionType.HOSPITAL_COURSE,
      CDASectionType.DISCHARGE_DIAGNOSIS,
      CDASectionType.DISCHARGE_MEDICATIONS,
      CDASectionType.DISCHARGE_INSTRUCTIONS,
    ],
    optionalSections: [
      CDASectionType.PROCEDURES,
      CDASectionType.VITALS,
      CDASectionType.RESULTS,
      CDASectionType.PLAN_OF_CARE,
      CDASectionType.FUNCTIONAL_STATUS,
      CDASectionType.REASON_FOR_VISIT,
    ],
    templateId: CDA_OIDS.DISCHARGE_SUMMARY_TEMPLATE,
  },
  [CDADocumentType.OPERATIVE_NOTE]: {
    documentType: CDADocumentType.OPERATIVE_NOTE,
    requiredSections: [
      CDASectionType.PREOPERATIVE_DIAGNOSIS,
      CDASectionType.POSTOPERATIVE_DIAGNOSIS,
      CDASectionType.OPERATIVE_DESCRIPTION,
      CDASectionType.ANESTHESIA,
      CDASectionType.ESTIMATED_BLOOD_LOSS,
      CDASectionType.COMPLICATIONS,
      CDASectionType.SPECIMENS,
    ],
    optionalSections: [
      CDASectionType.PROCEDURES,
      CDASectionType.MEDICATIONS,
      CDASectionType.PLAN_OF_CARE,
    ],
    templateId: CDA_OIDS.OPERATIVE_NOTE_TEMPLATE,
  },
  [CDADocumentType.PROGRESS_NOTE]: {
    documentType: CDADocumentType.PROGRESS_NOTE,
    requiredSections: [
      CDASectionType.CHIEF_COMPLAINT,
      CDASectionType.ASSESSMENT,
      CDASectionType.PLAN_OF_CARE,
    ],
    optionalSections: [
      CDASectionType.ALLERGIES,
      CDASectionType.MEDICATIONS,
      CDASectionType.PROBLEMS,
      CDASectionType.VITALS,
      CDASectionType.RESULTS,
      CDASectionType.INSTRUCTIONS,
    ],
    templateId: CDA_OIDS.PROGRESS_NOTE_TEMPLATE,
  },
  [CDADocumentType.CONSULTATION_NOTE]: {
    documentType: CDADocumentType.CONSULTATION_NOTE,
    requiredSections: [
      CDASectionType.REASON_FOR_VISIT,
      CDASectionType.ASSESSMENT,
      CDASectionType.PLAN_OF_CARE,
    ],
    optionalSections: [
      CDASectionType.ALLERGIES,
      CDASectionType.MEDICATIONS,
      CDASectionType.PROBLEMS,
      CDASectionType.VITALS,
      CDASectionType.RESULTS,
      CDASectionType.SOCIAL_HISTORY,
      CDASectionType.FAMILY_HISTORY,
    ],
    templateId: CDA_OIDS.CONSULTATION_NOTE_TEMPLATE,
  },
  [CDADocumentType.HISTORY_AND_PHYSICAL]: {
    documentType: CDADocumentType.HISTORY_AND_PHYSICAL,
    requiredSections: [
      CDASectionType.CHIEF_COMPLAINT,
      CDASectionType.ALLERGIES,
      CDASectionType.MEDICATIONS,
      CDASectionType.PROBLEMS,
      CDASectionType.SOCIAL_HISTORY,
      CDASectionType.FAMILY_HISTORY,
      CDASectionType.VITALS,
      CDASectionType.ASSESSMENT,
      CDASectionType.PLAN_OF_CARE,
    ],
    optionalSections: [
      CDASectionType.RESULTS,
      CDASectionType.PROCEDURES,
      CDASectionType.FUNCTIONAL_STATUS,
      CDASectionType.IMMUNIZATIONS,
    ],
    templateId: CDA_OIDS.H_AND_P_TEMPLATE,
  },
  [CDADocumentType.TRANSFER_SUMMARY]: {
    documentType: CDADocumentType.TRANSFER_SUMMARY,
    requiredSections: [
      CDASectionType.ALLERGIES,
      CDASectionType.MEDICATIONS,
      CDASectionType.PROBLEMS,
      CDASectionType.REASON_FOR_VISIT,
    ],
    optionalSections: [
      CDASectionType.PROCEDURES,
      CDASectionType.VITALS,
      CDASectionType.RESULTS,
      CDASectionType.HOSPITAL_COURSE,
    ],
    templateId: CDA_OIDS.TRANSFER_SUMMARY_TEMPLATE,
  },
};

// ============================================================================
// Implementation
// ============================================================================

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

function getSectionOID(type: CDASectionType): string {
  const oidMap: Record<string, string> = {
    [CDASectionType.ALLERGIES]: CDA_OIDS.ALLERGIES_SECTION,
    [CDASectionType.MEDICATIONS]: CDA_OIDS.MEDICATIONS_SECTION,
    [CDASectionType.PROBLEMS]: CDA_OIDS.PROBLEMS_SECTION,
    [CDASectionType.PROCEDURES]: CDA_OIDS.PROCEDURES_SECTION,
    [CDASectionType.VITALS]: CDA_OIDS.VITALS_SECTION,
    [CDASectionType.RESULTS]: CDA_OIDS.RESULTS_SECTION,
    [CDASectionType.PLAN_OF_CARE]: CDA_OIDS.PLAN_OF_CARE_SECTION,
    [CDASectionType.SOCIAL_HISTORY]: CDA_OIDS.SOCIAL_HISTORY_SECTION,
    [CDASectionType.FAMILY_HISTORY]: CDA_OIDS.FAMILY_HISTORY_SECTION,
    [CDASectionType.FUNCTIONAL_STATUS]: CDA_OIDS.FUNCTIONAL_STATUS_SECTION,
    [CDASectionType.IMMUNIZATIONS]: CDA_OIDS.IMMUNIZATIONS_SECTION,
    [CDASectionType.INSTRUCTIONS]: CDA_OIDS.INSTRUCTIONS_SECTION,
    [CDASectionType.ENCOUNTERS]: CDA_OIDS.ENCOUNTERS_SECTION,
    [CDASectionType.REASON_FOR_VISIT]: CDA_OIDS.REASON_FOR_VISIT_SECTION,
    [CDASectionType.CHIEF_COMPLAINT]: CDA_OIDS.CHIEF_COMPLAINT_SECTION,
    [CDASectionType.ASSESSMENT]: CDA_OIDS.ASSESSMENT_SECTION,
    [CDASectionType.HOSPITAL_COURSE]: CDA_OIDS.HOSPITAL_COURSE_SECTION,
    [CDASectionType.DISCHARGE_DIAGNOSIS]: CDA_OIDS.DISCHARGE_DIAGNOSIS_SECTION,
    [CDASectionType.OPERATIVE_DESCRIPTION]: CDA_OIDS.OPERATIVE_DESCRIPTION_SECTION,
    [CDASectionType.PREOPERATIVE_DIAGNOSIS]: CDA_OIDS.PREOPERATIVE_DIAGNOSIS_SECTION,
    [CDASectionType.POSTOPERATIVE_DIAGNOSIS]: CDA_OIDS.POSTOPERATIVE_DIAGNOSIS_SECTION,
    [CDASectionType.ANESTHESIA]: CDA_OIDS.ANESTHESIA_SECTION,
    [CDASectionType.COMPLICATIONS]: CDA_OIDS.COMPLICATIONS_SECTION,
  };
  return oidMap[type] || '';
}

function getSectionTitle(type: CDASectionType): string {
  const titleMap: Record<string, string> = {
    [CDASectionType.ALLERGIES]: 'Allergies and Adverse Reactions',
    [CDASectionType.MEDICATIONS]: 'Medications',
    [CDASectionType.PROBLEMS]: 'Problem List',
    [CDASectionType.PROCEDURES]: 'Procedures',
    [CDASectionType.VITALS]: 'Vital Signs',
    [CDASectionType.RESULTS]: 'Results',
    [CDASectionType.PLAN_OF_CARE]: 'Plan of Care',
    [CDASectionType.SOCIAL_HISTORY]: 'Social History',
    [CDASectionType.FAMILY_HISTORY]: 'Family History',
    [CDASectionType.FUNCTIONAL_STATUS]: 'Functional Status',
    [CDASectionType.IMMUNIZATIONS]: 'Immunizations',
    [CDASectionType.INSTRUCTIONS]: 'Instructions',
    [CDASectionType.ENCOUNTERS]: 'Encounters',
    [CDASectionType.REASON_FOR_VISIT]: 'Reason for Visit',
    [CDASectionType.CHIEF_COMPLAINT]: 'Chief Complaint',
    [CDASectionType.ASSESSMENT]: 'Assessment',
    [CDASectionType.HOSPITAL_COURSE]: 'Hospital Course',
    [CDASectionType.DISCHARGE_DIAGNOSIS]: 'Discharge Diagnosis',
    [CDASectionType.DISCHARGE_MEDICATIONS]: 'Discharge Medications',
    [CDASectionType.DISCHARGE_INSTRUCTIONS]: 'Discharge Instructions',
    [CDASectionType.OPERATIVE_DESCRIPTION]: 'Operative Description',
    [CDASectionType.PREOPERATIVE_DIAGNOSIS]: 'Preoperative Diagnosis',
    [CDASectionType.POSTOPERATIVE_DIAGNOSIS]: 'Postoperative Diagnosis',
    [CDASectionType.ANESTHESIA]: 'Anesthesia',
    [CDASectionType.COMPLICATIONS]: 'Complications',
    [CDASectionType.SPECIMENS]: 'Specimens',
    [CDASectionType.ESTIMATED_BLOOD_LOSS]: 'Estimated Blood Loss',
  };
  return titleMap[type] || type;
}

export function createClinicalDocumentGenerator(): ClinicalDocumentGenerator {
  const providerPreferences: ProviderPreference[] = [];

  function buildSection(type: CDASectionType, entries: CDASectionEntry[], narrative?: string): CDASection {
    const loincInfo = SECTION_LOINC_CODES[type];
    return {
      type,
      title: getSectionTitle(type),
      templateId: getSectionOID(type),
      loincCode: loincInfo?.code || '',
      loincDisplay: loincInfo?.display || '',
      entries,
      narrative: narrative || entries.map(e => e.text).join('\n'),
    };
  }

  function generateDocument(input: CDADocumentInput): CDADocument {
    const id = generateId();
    const template = DOCUMENT_TEMPLATES[input.documentType];
    const loincDoc = LOINC_DOCUMENT_CODES[input.documentType];

    const sections = input.sections.map(s =>
      buildSection(s.type, s.entries, s.narrative)
    );

    // Apply learned provider preferences for section ordering
    const preferredOrder = suggestSectionOrder(input.author.npi || '', input.documentType);
    let orderedSections = sections;
    if (preferredOrder.length > 0) {
      orderedSections = [...sections].sort((a, b) => {
        const aIdx = preferredOrder.indexOf(a.type);
        const bIdx = preferredOrder.indexOf(b.type);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    }

    const doc: CDADocument = {
      id,
      documentType: input.documentType,
      title: input.title || getDocumentTitle(input.documentType),
      templateIds: [CDA_OIDS.US_REALM_HEADER, template.templateId],
      effectiveTime: input.encounterDate,
      confidentialityCode: input.confidentialityCode || 'N',
      languageCode: 'en-US',
      realmCode: 'US',
      typeId: {
        root: '2.16.840.1.113883.1.3',
        extension: 'POCD_HD000040',
      },
      loincCode: loincDoc?.code || '',
      loincDisplay: loincDoc?.display || '',
      header: {
        patient: {
          id: input.patientId,
          name: input.patientName,
          dob: input.patientDOB,
          gender: input.patientGender,
          mrn: input.patientMRN,
        },
        author: input.author,
        custodian: input.custodian,
        authenticator: input.authenticator,
        participants: input.participants || [],
      },
      sections: orderedSections,
      xmlContent: '',
      createdAt: nowISO(),
    };

    doc.xmlContent = generateXML(doc);
    return doc;
  }

  function getDocumentTitle(docType: CDADocumentType): string {
    const titles: Record<string, string> = {
      [CDADocumentType.CCD]: 'Continuity of Care Document',
      [CDADocumentType.DISCHARGE_SUMMARY]: 'Discharge Summary',
      [CDADocumentType.OPERATIVE_NOTE]: 'Operative Note',
      [CDADocumentType.PROGRESS_NOTE]: 'Progress Note',
      [CDADocumentType.CONSULTATION_NOTE]: 'Consultation Note',
      [CDADocumentType.HISTORY_AND_PHYSICAL]: 'History and Physical',
      [CDADocumentType.TRANSFER_SUMMARY]: 'Transfer Summary',
    };
    return titles[docType] || 'Clinical Document';
  }

  function generateCCD(input: CDADocumentInput): CDADocument {
    return generateDocument({ ...input, documentType: CDADocumentType.CCD });
  }

  function generateDischargeSummary(input: CDADocumentInput): CDADocument {
    return generateDocument({ ...input, documentType: CDADocumentType.DISCHARGE_SUMMARY });
  }

  function generateOperativeNote(input: CDADocumentInput): CDADocument {
    return generateDocument({ ...input, documentType: CDADocumentType.OPERATIVE_NOTE });
  }

  function generateProgressNote(input: CDADocumentInput): CDADocument {
    return generateDocument({ ...input, documentType: CDADocumentType.PROGRESS_NOTE });
  }

  function getDocumentTemplate(docType: CDADocumentType): DocumentTemplate {
    return DOCUMENT_TEMPLATES[docType];
  }

  function generateXML(document: CDADocument): string {
    const xmlParts: string[] = [];

    xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlParts.push('<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">');

    // Realm code
    xmlParts.push(`  <realmCode code="${document.realmCode}"/>`);

    // Type ID
    xmlParts.push(`  <typeId root="${document.typeId.root}" extension="${document.typeId.extension}"/>`);

    // Template IDs
    for (const tid of document.templateIds) {
      xmlParts.push(`  <templateId root="${tid}"/>`);
    }

    // Document ID
    xmlParts.push(`  <id root="${document.id}"/>`);

    // Document code (LOINC)
    xmlParts.push(`  <code code="${document.loincCode}" codeSystem="${CDA_OIDS.LOINC_OID}" displayName="${document.loincDisplay}"/>`);

    // Title
    xmlParts.push(`  <title>${escapeXml(document.title)}</title>`);

    // Effective time
    xmlParts.push(`  <effectiveTime value="${formatCDADate(document.effectiveTime)}"/>`);

    // Confidentiality
    xmlParts.push(`  <confidentialityCode code="${document.confidentialityCode}" codeSystem="2.16.840.1.113883.5.25"/>`);

    // Language
    xmlParts.push(`  <languageCode code="${document.languageCode}"/>`);

    // Record target (patient)
    xmlParts.push('  <recordTarget>');
    xmlParts.push('    <patientRole>');
    if (document.header.patient.mrn) {
      xmlParts.push(`      <id root="2.16.840.1.113883.19.5" extension="${document.header.patient.mrn}"/>`);
    }
    xmlParts.push('      <patient>');
    xmlParts.push(`        <name><given>${escapeXml(document.header.patient.name.given)}</given><family>${escapeXml(document.header.patient.name.family)}</family></name>`);
    xmlParts.push(`        <administrativeGenderCode code="${document.header.patient.gender === 'male' ? 'M' : document.header.patient.gender === 'female' ? 'F' : 'UN'}"/>`);
    xmlParts.push(`        <birthTime value="${formatCDADate(document.header.patient.dob)}"/>`);
    xmlParts.push('      </patient>');
    xmlParts.push('    </patientRole>');
    xmlParts.push('  </recordTarget>');

    // Author
    xmlParts.push('  <author>');
    xmlParts.push(`    <time value="${formatCDADate(document.effectiveTime)}"/>`);
    xmlParts.push('    <assignedAuthor>');
    if (document.header.author.npi) {
      xmlParts.push(`      <id root="${CDA_OIDS.NPI_OID}" extension="${document.header.author.npi}"/>`);
    }
    xmlParts.push(`      <assignedPerson><name><given>${escapeXml(document.header.author.name.given)}</given><family>${escapeXml(document.header.author.name.family)}</family></name></assignedPerson>`);
    if (document.header.author.organization) {
      xmlParts.push(`      <representedOrganization><name>${escapeXml(document.header.author.organization)}</name></representedOrganization>`);
    }
    xmlParts.push('    </assignedAuthor>');
    xmlParts.push('  </author>');

    // Custodian
    xmlParts.push('  <custodian>');
    xmlParts.push('    <assignedCustodian>');
    xmlParts.push('      <representedCustodianOrganization>');
    if (document.header.custodian.organization) {
      xmlParts.push(`        <name>${escapeXml(document.header.custodian.organization)}</name>`);
    }
    xmlParts.push('      </representedCustodianOrganization>');
    xmlParts.push('    </assignedCustodian>');
    xmlParts.push('  </custodian>');

    // Body with sections
    xmlParts.push('  <component>');
    xmlParts.push('    <structuredBody>');

    for (const section of document.sections) {
      xmlParts.push('      <component>');
      xmlParts.push('        <section>');
      if (section.templateId) {
        xmlParts.push(`          <templateId root="${section.templateId}"/>`);
      }
      if (section.loincCode) {
        xmlParts.push(`          <code code="${section.loincCode}" codeSystem="${CDA_OIDS.LOINC_OID}" displayName="${escapeXml(section.loincDisplay)}"/>`);
      }
      xmlParts.push(`          <title>${escapeXml(section.title)}</title>`);
      xmlParts.push('          <text>');
      if (section.narrative) {
        xmlParts.push(`            ${escapeXml(section.narrative)}`);
      }
      for (const entry of section.entries) {
        xmlParts.push(`            <paragraph>${escapeXml(entry.text)}</paragraph>`);
      }
      xmlParts.push('          </text>');
      xmlParts.push('        </section>');
      xmlParts.push('      </component>');
    }

    xmlParts.push('    </structuredBody>');
    xmlParts.push('  </component>');
    xmlParts.push('</ClinicalDocument>');

    return xmlParts.join('\n');
  }

  function validateDocument(document: CDADocument): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const template = DOCUMENT_TEMPLATES[document.documentType];

    // Check required template IDs
    if (!document.templateIds.includes(CDA_OIDS.US_REALM_HEADER)) {
      errors.push('Missing US Realm Header template ID');
    }

    if (!document.templateIds.includes(template.templateId)) {
      errors.push(`Missing document-specific template ID: ${template.templateId}`);
    }

    // Check required sections
    const sectionTypes = document.sections.map(s => s.type);
    for (const requiredSection of template.requiredSections) {
      if (!sectionTypes.includes(requiredSection)) {
        errors.push(`Missing required section: ${getSectionTitle(requiredSection)}`);
      }
    }

    // Check header elements
    if (!document.header.patient.name.given || !document.header.patient.name.family) {
      errors.push('Patient name is required');
    }

    if (!document.header.author.name.given || !document.header.author.name.family) {
      errors.push('Author name is required');
    }

    if (!document.header.custodian.organization) {
      warnings.push('Custodian organization is recommended');
    }

    // Check document code
    if (!document.loincCode) {
      errors.push('Document LOINC code is required');
    }

    // Check confidentiality
    if (!['N', 'R', 'V'].includes(document.confidentialityCode)) {
      warnings.push('Confidentiality code should be N (Normal), R (Restricted), or V (Very Restricted)');
    }

    // Check section content
    for (const section of document.sections) {
      if (section.entries.length === 0 && !section.narrative) {
        warnings.push(`Section "${section.title}" has no entries or narrative`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  function getOID(key: string): string | null {
    const allOids = CDA_OIDS as Record<string, string>;
    return allOids[key] || null;
  }

  function recordProviderPreference(preference: ProviderPreference): void {
    const existingIdx = providerPreferences.findIndex(
      p => p.providerId === preference.providerId && p.documentType === preference.documentType
    );
    if (existingIdx >= 0) {
      providerPreferences[existingIdx] = preference;
    } else {
      providerPreferences.push(preference);
    }
  }

  function getProviderPreferences(providerId: string): ProviderPreference[] {
    return providerPreferences.filter(p => p.providerId === providerId);
  }

  function suggestSectionOrder(providerId: string, documentType: CDADocumentType): CDASectionType[] {
    const pref = providerPreferences.find(
      p => p.providerId === providerId && p.documentType === documentType
    );
    if (pref) {
      return pref.preferredSectionOrder;
    }
    // Default: return template required sections then optional
    const template = DOCUMENT_TEMPLATES[documentType];
    return [...template.requiredSections, ...template.optionalSections];
  }

  return {
    generateDocument,
    generateCCD,
    generateDischargeSummary,
    generateOperativeNote,
    generateProgressNote,
    getDocumentTemplate,
    buildSection,
    generateXML,
    validateDocument,
    getOID,
    recordProviderPreference,
    getProviderPreferences,
    suggestSectionOrder,
  };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatCDADate(isoDate: string): string {
  return isoDate.replace(/[-T:Z.]/g, '').substring(0, 14);
}
