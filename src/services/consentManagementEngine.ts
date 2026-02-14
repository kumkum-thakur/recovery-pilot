/**
 * Feature 40: Consent Management Engine
 *
 * Digital consent form management, consent types, status tracking,
 * witness requirements, expiration/renewal, capacity assessment,
 * surrogate decision-maker, audit trail, multi-language, version control,
 * and self-learning for workflow optimization.
 */

// ============================================================================
// Constants
// ============================================================================

export const ConsentType = {
  SURGICAL: 'surgical',
  ANESTHESIA: 'anesthesia',
  BLOOD_PRODUCTS: 'blood_products',
  RESEARCH: 'research',
  HIPAA: 'hipaa',
  TELEHEALTH: 'telehealth',
  IMAGING: 'imaging',
  PROCEDURE: 'procedure',
  ADVANCE_DIRECTIVE: 'advance_directive',
  DNR: 'dnr',
  ORGAN_DONATION: 'organ_donation',
  PHOTOGRAPHY: 'photography',
  GENETIC_TESTING: 'genetic_testing',
} as const;
export type ConsentType = typeof ConsentType[keyof typeof ConsentType];

export const ConsentStatus = {
  PENDING: 'pending',
  OBTAINED: 'obtained',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  WITHDRAWN: 'withdrawn',
  REVOKED: 'revoked',
  NEEDS_RENEWAL: 'needs_renewal',
} as const;
export type ConsentStatus = typeof ConsentStatus[keyof typeof ConsentStatus];

export const CapacityStatus = {
  HAS_CAPACITY: 'has_capacity',
  LACKS_CAPACITY: 'lacks_capacity',
  QUESTIONABLE: 'questionable',
  NOT_ASSESSED: 'not_assessed',
} as const;
export type CapacityStatus = typeof CapacityStatus[keyof typeof CapacityStatus];

export const SurrogateType = {
  HEALTHCARE_PROXY: 'healthcare_proxy',
  POWER_OF_ATTORNEY: 'power_of_attorney',
  LEGAL_GUARDIAN: 'legal_guardian',
  NEXT_OF_KIN: 'next_of_kin',
  COURT_APPOINTED: 'court_appointed',
  PARENT: 'parent',
} as const;
export type SurrogateType = typeof SurrogateType[keyof typeof SurrogateType];

export const Language = {
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  CHINESE: 'zh',
  VIETNAMESE: 'vi',
  KOREAN: 'ko',
  ARABIC: 'ar',
  RUSSIAN: 'ru',
  PORTUGUESE: 'pt',
  TAGALOG: 'tl',
  HAITIAN_CREOLE: 'ht',
  POLISH: 'pl',
} as const;
export type Language = typeof Language[keyof typeof Language];

export const AuditAction = {
  CREATED: 'created',
  VIEWED: 'viewed',
  SIGNED: 'signed',
  WITNESSED: 'witnessed',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired',
  RENEWED: 'renewed',
  PRINTED: 'printed',
  EMAILED: 'emailed',
  TRANSLATED: 'translated',
  VERSION_UPDATED: 'version_updated',
  CAPACITY_ASSESSED: 'capacity_assessed',
  SURROGATE_DESIGNATED: 'surrogate_designated',
} as const;
export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

// ============================================================================
// Types
// ============================================================================

export type ConsentDocument = {
  id: string;
  version: string;
  consentType: ConsentType;
  title: string;
  content: string;
  riskSection: string;
  benefitSection: string;
  alternativesSection: string;
  requiresWitness: boolean;
  witnessCount: number;
  expirationDays: number;
  availableLanguages: Language[];
  effectiveDate: string;
  approvedBy: string;
  isActive: boolean;
};

export type ConsentRecord = {
  id: string;
  documentId: string;
  documentVersion: string;
  consentType: ConsentType;
  patientId: string;
  patientName: string;
  status: ConsentStatus;
  language: Language;
  signedDate?: string;
  expirationDate?: string;
  signatureMethod: 'electronic' | 'paper' | 'verbal';
  witnessRecords: WitnessRecord[];
  capacityAssessment?: CapacityAssessment;
  surrogate?: SurrogateDecisionMaker;
  procedureDescription?: string;
  providerName: string;
  providerId: string;
  facilityName: string;
  auditTrail: AuditEntry[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type WitnessRecord = {
  witnessName: string;
  witnessRole: string;
  witnessDate: string;
  signatureMethod: 'electronic' | 'paper';
};

export type CapacityAssessment = {
  assessedBy: string;
  assessedDate: string;
  status: CapacityStatus;
  findings: string;
  toolUsed?: string;
  canUnderstand: boolean;
  canAppreciate: boolean;
  canReason: boolean;
  canCommunicate: boolean;
};

export type SurrogateDecisionMaker = {
  name: string;
  relationship: SurrogateType;
  phone: string;
  email?: string;
  documentOnFile: boolean;
  documentDate?: string;
  verifiedBy?: string;
  verifiedDate?: string;
};

export type AuditEntry = {
  timestamp: string;
  action: AuditAction;
  performedBy: string;
  performerRole: string;
  details: string;
  ipAddress?: string;
};

export type ConsentWorkflowDelay = {
  consentType: ConsentType;
  avgDelayMinutes: number;
  bottleneck: string;
  occurrenceCount: number;
  timestamp: string;
};

export type ConsentManagementEngine = {
  getConsentDocuments(): ConsentDocument[];
  getConsentDocument(consentType: ConsentType, language?: Language): ConsentDocument | null;
  createConsentRecord(input: CreateConsentInput): ConsentRecord;
  updateConsentStatus(recordId: string, status: ConsentStatus, performedBy: string): ConsentRecord | null;
  addWitness(recordId: string, witness: WitnessRecord): ConsentRecord | null;
  assessCapacity(recordId: string, assessment: CapacityAssessment): ConsentRecord | null;
  designateSurrogate(recordId: string, surrogate: SurrogateDecisionMaker, performedBy: string): ConsentRecord | null;
  checkExpiration(recordId: string): { expired: boolean; daysUntilExpiry: number | null; needsRenewal: boolean };
  renewConsent(recordId: string, performedBy: string): ConsentRecord | null;
  getAuditTrail(recordId: string): AuditEntry[];
  getPatientConsents(patientId: string): ConsentRecord[];
  getPendingConsents(patientId: string): ConsentRecord[];
  validateConsent(recordId: string): { valid: boolean; issues: string[] };
  getConsentVersionHistory(consentType: ConsentType): Array<{ version: string; effectiveDate: string; changes: string }>;
  recordWorkflowDelay(delay: ConsentWorkflowDelay): void;
  getOptimizedWorkflow(consentType: ConsentType): { suggestedOrder: string[]; avgTime: number; bottlenecks: string[] };
  getConsentStats(): { total: number; byStatus: Record<string, number>; byType: Record<string, number>; pendingCount: number; expiringSoonCount: number };
};

export type CreateConsentInput = {
  consentType: ConsentType;
  patientId: string;
  patientName: string;
  language?: Language;
  procedureDescription?: string;
  providerName: string;
  providerId: string;
  facilityName: string;
  signatureMethod?: 'electronic' | 'paper' | 'verbal';
  notes?: string;
};

// ============================================================================
// Consent Documents Database
// ============================================================================

const CONSENT_DOCUMENTS: ConsentDocument[] = [
  {
    id: 'DOC-001', version: '3.2', consentType: ConsentType.SURGICAL, title: 'Consent for Surgical Procedure',
    content: 'I hereby consent to the performance of the following surgical procedure(s) as explained to me by my physician. I understand that the procedure involves risks including but not limited to infection, bleeding, nerve damage, blood clots, adverse reactions to anesthesia, and the possibility that the procedure may not achieve the desired result.',
    riskSection: 'Risks include but are not limited to: infection, hemorrhage, damage to surrounding structures, blood clots (DVT/PE), adverse anesthetic reactions, scarring, need for additional procedures, and in rare cases, death.',
    benefitSection: 'Benefits may include: relief of symptoms, improved function, diagnosis of condition, prevention of disease progression.',
    alternativesSection: 'Alternatives may include: conservative/non-surgical management, medication therapy, physical therapy, watchful waiting, or alternative surgical approaches.',
    requiresWitness: true, witnessCount: 1, expirationDays: 30, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.FRENCH, Language.CHINESE, Language.VIETNAMESE, Language.KOREAN, Language.ARABIC], effectiveDate: '2024-01-01', approvedBy: 'Medical Executive Committee', isActive: true,
  },
  {
    id: 'DOC-002', version: '2.1', consentType: ConsentType.ANESTHESIA, title: 'Consent for Anesthesia',
    content: 'I consent to the administration of anesthesia as deemed necessary by the anesthesia team. I understand the types of anesthesia that may be used include general anesthesia, regional anesthesia (spinal, epidural, nerve block), local anesthesia, and monitored anesthesia care (sedation).',
    riskSection: 'Risks include: nausea/vomiting, sore throat, dental damage, awareness during anesthesia, allergic reactions, aspiration pneumonia, nerve damage, cardiovascular complications, malignant hyperthermia, and in rare cases, death.',
    benefitSection: 'Benefits: pain-free surgical experience, controlled physiological state during surgery, amnesia during procedure.',
    alternativesSection: 'Alternatives depend on the procedure: local anesthesia, regional anesthesia, or no anesthesia (not recommended for surgical procedures).',
    requiresWitness: true, witnessCount: 1, expirationDays: 30, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.FRENCH, Language.CHINESE], effectiveDate: '2024-01-01', approvedBy: 'Anesthesia Department', isActive: true,
  },
  {
    id: 'DOC-003', version: '1.5', consentType: ConsentType.BLOOD_PRODUCTS, title: 'Consent for Blood Transfusion',
    content: 'I consent to the transfusion of blood and/or blood products as deemed medically necessary. I understand that blood products are tested but there is a small residual risk of transfusion-transmitted infections.',
    riskSection: 'Risks include: allergic reactions, febrile reactions, hemolytic transfusion reaction, transfusion-related acute lung injury (TRALI), bacterial contamination, viral transmission (very rare), iron overload with multiple transfusions, volume overload.',
    benefitSection: 'Benefits: correction of anemia, restoration of blood volume, improvement of oxygen-carrying capacity, correction of coagulation disorders.',
    alternativesSection: 'Alternatives: autologous blood donation, cell salvage, erythropoietin therapy, iron supplementation, hemodilution techniques, or declining transfusion (with understanding of risks).',
    requiresWitness: true, witnessCount: 1, expirationDays: 30, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.FRENCH], effectiveDate: '2024-03-01', approvedBy: 'Transfusion Committee', isActive: true,
  },
  {
    id: 'DOC-004', version: '4.0', consentType: ConsentType.RESEARCH, title: 'Informed Consent for Research Participation',
    content: 'I voluntarily agree to participate in this research study. I understand that my participation is entirely voluntary and I may withdraw at any time without affecting my medical care. The study has been reviewed and approved by the Institutional Review Board (IRB).',
    riskSection: 'Study-specific risks will be detailed in the protocol addendum. General risks of research include: unknown side effects, loss of privacy, inconvenience, and the possibility that the investigational treatment may not be effective.',
    benefitSection: 'There may be no direct benefit to you. Potential benefits include: access to new treatments, contributing to medical knowledge, additional monitoring of your condition.',
    alternativesSection: 'You may choose not to participate and receive standard of care treatment. Alternative treatments available will be discussed with you.',
    requiresWitness: true, witnessCount: 1, expirationDays: 365, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.FRENCH, Language.CHINESE, Language.KOREAN, Language.VIETNAMESE], effectiveDate: '2024-01-15', approvedBy: 'IRB', isActive: true,
  },
  {
    id: 'DOC-005', version: '2.0', consentType: ConsentType.HIPAA, title: 'HIPAA Authorization for Use and Disclosure of PHI',
    content: 'I authorize the use and/or disclosure of my protected health information (PHI) as described in this authorization. I understand that I have the right to revoke this authorization in writing at any time, except to the extent that action has already been taken in reliance on this authorization.',
    riskSection: 'Once your information is disclosed, it may no longer be protected by federal privacy laws. There is a risk that disclosed information could be further shared by the recipient.',
    benefitSection: 'Benefits include: coordination of your care, facilitation of treatment, communication with your designated individuals.',
    alternativesSection: 'You may refuse to sign this authorization. Your treatment will not be conditioned on signing, except when the treatment is specifically related to the disclosed information.',
    requiresWitness: false, witnessCount: 0, expirationDays: 365, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.FRENCH, Language.CHINESE, Language.VIETNAMESE, Language.KOREAN, Language.ARABIC, Language.RUSSIAN, Language.PORTUGUESE, Language.TAGALOG, Language.HAITIAN_CREOLE, Language.POLISH], effectiveDate: '2024-01-01', approvedBy: 'Privacy Officer', isActive: true,
  },
  {
    id: 'DOC-006', version: '1.3', consentType: ConsentType.TELEHEALTH, title: 'Consent for Telehealth Services',
    content: 'I consent to receive healthcare services via telehealth (video, audio, or messaging). I understand that telehealth has limitations including technical difficulties, inability to perform physical examination, and potential privacy risks associated with electronic communication.',
    riskSection: 'Risks include: delays due to technical failures, reduced ability to evaluate conditions requiring physical examination, potential privacy breaches, limitations of technology, inability to provide emergency services remotely.',
    benefitSection: 'Benefits include: improved access to care, reduced travel time and costs, convenience, continuity of care during inability to travel.',
    alternativesSection: 'Alternative: in-person visit at the clinic or hospital. Emergency services should be accessed directly if needed.',
    requiresWitness: false, witnessCount: 0, expirationDays: 365, availableLanguages: [Language.ENGLISH, Language.SPANISH], effectiveDate: '2024-02-01', approvedBy: 'Telehealth Committee', isActive: true,
  },
  {
    id: 'DOC-007', version: '1.1', consentType: ConsentType.IMAGING, title: 'Consent for Diagnostic Imaging',
    content: 'I consent to the diagnostic imaging procedure(s) ordered by my physician. I understand the procedure may involve exposure to ionizing radiation and/or contrast agents.',
    riskSection: 'Risks include: radiation exposure (CT, X-ray, fluoroscopy), allergic reaction to contrast dye, contrast-induced nephropathy, claustrophobia (MRI), heating of metallic implants (MRI), incidental findings requiring further evaluation.',
    benefitSection: 'Benefits: accurate diagnosis, monitoring of treatment response, guidance for procedures.',
    alternativesSection: 'Alternatives may include: different imaging modality (ultrasound vs CT), no imaging with clinical monitoring, or biopsy for tissue diagnosis.',
    requiresWitness: false, witnessCount: 0, expirationDays: 30, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.CHINESE], effectiveDate: '2024-03-01', approvedBy: 'Radiology Department', isActive: true,
  },
  {
    id: 'DOC-008', version: '1.0', consentType: ConsentType.PROCEDURE, title: 'Consent for Medical Procedure',
    content: 'I consent to the medical procedure described below, which has been explained to me by my healthcare provider.',
    riskSection: 'Procedure-specific risks will be discussed and documented below.',
    benefitSection: 'Procedure-specific benefits will be discussed and documented below.',
    alternativesSection: 'Alternatives to this procedure have been discussed with me.',
    requiresWitness: true, witnessCount: 1, expirationDays: 30, availableLanguages: [Language.ENGLISH, Language.SPANISH], effectiveDate: '2024-01-01', approvedBy: 'Medical Staff Office', isActive: true,
  },
  {
    id: 'DOC-009', version: '2.0', consentType: ConsentType.ADVANCE_DIRECTIVE, title: 'Advance Healthcare Directive',
    content: 'This document states my wishes about my future healthcare if I become unable to make my own decisions. I appoint the following person as my healthcare agent to make decisions on my behalf.',
    riskSection: 'There is a risk that your wishes may not be followed if this document is not available when needed, or if there are disputes among family members.',
    benefitSection: 'Benefits: ensures your healthcare wishes are documented and followed, designates a trusted person to make decisions, reduces burden on family members, provides guidance to healthcare providers.',
    alternativesSection: 'Alternative: verbal communication of wishes to family and providers (less legally binding), Physician Orders for Life-Sustaining Treatment (POLST).',
    requiresWitness: true, witnessCount: 2, expirationDays: 0, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.CHINESE, Language.VIETNAMESE], effectiveDate: '2024-01-01', approvedBy: 'Legal Counsel', isActive: true,
  },
  {
    id: 'DOC-010', version: '1.0', consentType: ConsentType.DNR, title: 'Do Not Resuscitate Order',
    content: 'I have made the decision to not undergo cardiopulmonary resuscitation (CPR) in the event of cardiac or respiratory arrest.',
    riskSection: 'If cardiac or respiratory arrest occurs, no resuscitation efforts will be initiated. This decision may result in death.',
    benefitSection: 'Benefits: avoidance of potentially unwanted aggressive resuscitation measures, alignment of care with personal values, peaceful death if that is the patient\'s wish.',
    alternativesSection: 'Alternative: Full code (all resuscitative measures), limited interventions (e.g., medications but no CPR), comfort measures only.',
    requiresWitness: true, witnessCount: 2, expirationDays: 0, availableLanguages: [Language.ENGLISH, Language.SPANISH], effectiveDate: '2024-01-01', approvedBy: 'Ethics Committee', isActive: true,
  },
  {
    id: 'DOC-011', version: '1.0', consentType: ConsentType.ORGAN_DONATION, title: 'Organ and Tissue Donation Consent',
    content: 'I consent to the donation of my organs and/or tissues for transplantation, research, or education upon my death.',
    riskSection: 'There are no medical risks to the donor at the time of death. Family members should be aware of the donation decision.',
    benefitSection: 'Benefits: life-saving organ transplantation for recipients, advancement of medical research, tissue grafts for those in need.',
    alternativesSection: 'Alternative: decline donation. You may specify which organs/tissues you wish to donate.',
    requiresWitness: true, witnessCount: 1, expirationDays: 0, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.FRENCH], effectiveDate: '2024-04-01', approvedBy: 'Organ Procurement Organization', isActive: true,
  },
  {
    id: 'DOC-012', version: '1.0', consentType: ConsentType.PHOTOGRAPHY, title: 'Consent for Medical Photography',
    content: 'I consent to the taking of photographs, videos, or other recordings for medical documentation, education, and/or publication purposes.',
    riskSection: 'Risk: images may be identifiable despite efforts to de-identify. There is a small risk of unauthorized access to stored images.',
    benefitSection: 'Benefits: documentation of clinical findings, educational purposes, facilitation of consultations, tracking of treatment progress.',
    alternativesSection: 'Alternative: verbal or written description instead of visual documentation.',
    requiresWitness: false, witnessCount: 0, expirationDays: 365, availableLanguages: [Language.ENGLISH, Language.SPANISH], effectiveDate: '2024-01-01', approvedBy: 'Medical Records Committee', isActive: true,
  },
  {
    id: 'DOC-013', version: '1.0', consentType: ConsentType.GENETIC_TESTING, title: 'Consent for Genetic Testing',
    content: 'I consent to genetic testing as described. I understand the test results may have implications for my family members and future health insurance.',
    riskSection: 'Risks: results may reveal unexpected information, potential psychological impact, possible insurance or employment implications despite GINA protections, incidental findings.',
    benefitSection: 'Benefits: personalized treatment, risk assessment, family planning information, pharmacogenomic guidance for medications.',
    alternativesSection: 'Alternatives: clinical assessment without genetic testing, family history-based risk assessment.',
    requiresWitness: true, witnessCount: 1, expirationDays: 90, availableLanguages: [Language.ENGLISH, Language.SPANISH, Language.CHINESE], effectiveDate: '2024-05-01', approvedBy: 'Genetics Committee', isActive: true,
  },
];

const VERSION_HISTORY: Record<ConsentType, Array<{ version: string; effectiveDate: string; changes: string }>> = {
  [ConsentType.SURGICAL]: [
    { version: '1.0', effectiveDate: '2020-01-01', changes: 'Initial version' },
    { version: '2.0', effectiveDate: '2021-06-01', changes: 'Added COVID-19 risk language' },
    { version: '3.0', effectiveDate: '2023-01-01', changes: 'Updated risk section, added telehealth pre-op option' },
    { version: '3.2', effectiveDate: '2024-01-01', changes: 'Added additional language translations, updated alternatives section' },
  ],
  [ConsentType.ANESTHESIA]: [
    { version: '1.0', effectiveDate: '2020-01-01', changes: 'Initial version' },
    { version: '2.0', effectiveDate: '2022-03-01', changes: 'Added nerve block and enhanced recovery language' },
    { version: '2.1', effectiveDate: '2024-01-01', changes: 'Minor updates to risk section' },
  ],
  [ConsentType.BLOOD_PRODUCTS]: [{ version: '1.0', effectiveDate: '2020-01-01', changes: 'Initial version' }, { version: '1.5', effectiveDate: '2024-03-01', changes: 'Updated infectious risk data' }],
  [ConsentType.RESEARCH]: [{ version: '1.0', effectiveDate: '2020-01-01', changes: 'Initial version' }, { version: '2.0', effectiveDate: '2022-01-01', changes: 'Common Rule updates' }, { version: '3.0', effectiveDate: '2023-06-01', changes: 'Added genetic data section' }, { version: '4.0', effectiveDate: '2024-01-15', changes: 'Updated per revised Common Rule' }],
  [ConsentType.HIPAA]: [{ version: '1.0', effectiveDate: '2020-01-01', changes: 'Initial version' }, { version: '2.0', effectiveDate: '2024-01-01', changes: 'Updated per information blocking rules' }],
  [ConsentType.TELEHEALTH]: [{ version: '1.0', effectiveDate: '2020-03-01', changes: 'Emergency COVID-19 version' }, { version: '1.3', effectiveDate: '2024-02-01', changes: 'Permanent telehealth consent with updated regulations' }],
  [ConsentType.IMAGING]: [{ version: '1.0', effectiveDate: '2021-01-01', changes: 'Initial version' }, { version: '1.1', effectiveDate: '2024-03-01', changes: 'Added contrast risk language' }],
  [ConsentType.PROCEDURE]: [{ version: '1.0', effectiveDate: '2024-01-01', changes: 'Initial version' }],
  [ConsentType.ADVANCE_DIRECTIVE]: [{ version: '1.0', effectiveDate: '2020-01-01', changes: 'Initial version' }, { version: '2.0', effectiveDate: '2024-01-01', changes: 'Updated per state law changes' }],
  [ConsentType.DNR]: [{ version: '1.0', effectiveDate: '2024-01-01', changes: 'Initial version' }],
  [ConsentType.ORGAN_DONATION]: [{ version: '1.0', effectiveDate: '2024-04-01', changes: 'Initial version' }],
  [ConsentType.PHOTOGRAPHY]: [{ version: '1.0', effectiveDate: '2024-01-01', changes: 'Initial version' }],
  [ConsentType.GENETIC_TESTING]: [{ version: '1.0', effectiveDate: '2024-05-01', changes: 'Initial version' }],
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

export function createConsentManagementEngine(): ConsentManagementEngine {
  const consentRecords: ConsentRecord[] = [];
  const workflowDelays: ConsentWorkflowDelay[] = [];

  function getConsentDocuments(): ConsentDocument[] {
    return CONSENT_DOCUMENTS.filter(d => d.isActive);
  }

  function getConsentDocument(consentType: ConsentType, _language?: Language): ConsentDocument | null {
    return CONSENT_DOCUMENTS.find(d => d.consentType === consentType && d.isActive) || null;
  }

  function createConsentRecord(input: CreateConsentInput): ConsentRecord {
    const document = getConsentDocument(input.consentType, input.language);
    const id = generateId();
    const now = nowISO();

    const record: ConsentRecord = {
      id,
      documentId: document?.id || '',
      documentVersion: document?.version || '1.0',
      consentType: input.consentType,
      patientId: input.patientId,
      patientName: input.patientName,
      status: ConsentStatus.PENDING,
      language: input.language || Language.ENGLISH,
      signatureMethod: input.signatureMethod || 'electronic',
      witnessRecords: [],
      procedureDescription: input.procedureDescription,
      providerName: input.providerName,
      providerId: input.providerId,
      facilityName: input.facilityName,
      auditTrail: [{
        timestamp: now,
        action: AuditAction.CREATED,
        performedBy: input.providerName,
        performerRole: 'provider',
        details: `Consent form created for ${input.consentType}`,
      }],
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    consentRecords.push(record);
    return record;
  }

  function findRecord(recordId: string): ConsentRecord | undefined {
    return consentRecords.find(r => r.id === recordId);
  }

  function updateConsentStatus(recordId: string, status: ConsentStatus, performedBy: string): ConsentRecord | null {
    const record = findRecord(recordId);
    if (!record) return null;

    record.status = status;
    record.updatedAt = nowISO();

    if (status === ConsentStatus.OBTAINED) {
      record.signedDate = nowISO();
      const doc = CONSENT_DOCUMENTS.find(d => d.id === record.documentId);
      if (doc && doc.expirationDays > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + doc.expirationDays);
        record.expirationDate = expDate.toISOString();
      }
    }

    const actionMap: Record<string, AuditAction> = {
      [ConsentStatus.OBTAINED]: AuditAction.SIGNED,
      [ConsentStatus.DECLINED]: AuditAction.DECLINED,
      [ConsentStatus.WITHDRAWN]: AuditAction.WITHDRAWN,
      [ConsentStatus.EXPIRED]: AuditAction.EXPIRED,
      [ConsentStatus.NEEDS_RENEWAL]: AuditAction.EXPIRED,
    };

    record.auditTrail.push({
      timestamp: nowISO(),
      action: actionMap[status] || AuditAction.VIEWED,
      performedBy,
      performerRole: 'provider',
      details: `Status changed to ${status}`,
    });

    return record;
  }

  function addWitness(recordId: string, witness: WitnessRecord): ConsentRecord | null {
    const record = findRecord(recordId);
    if (!record) return null;

    record.witnessRecords.push(witness);
    record.updatedAt = nowISO();
    record.auditTrail.push({
      timestamp: nowISO(),
      action: AuditAction.WITNESSED,
      performedBy: witness.witnessName,
      performerRole: witness.witnessRole,
      details: `Witnessed by ${witness.witnessName} (${witness.witnessRole})`,
    });

    return record;
  }

  function assessCapacity(recordId: string, assessment: CapacityAssessment): ConsentRecord | null {
    const record = findRecord(recordId);
    if (!record) return null;

    record.capacityAssessment = assessment;
    record.updatedAt = nowISO();
    record.auditTrail.push({
      timestamp: nowISO(),
      action: AuditAction.CAPACITY_ASSESSED,
      performedBy: assessment.assessedBy,
      performerRole: 'provider',
      details: `Capacity assessed: ${assessment.status}. ${assessment.findings}`,
    });

    return record;
  }

  function designateSurrogate(recordId: string, surrogate: SurrogateDecisionMaker, performedBy: string): ConsentRecord | null {
    const record = findRecord(recordId);
    if (!record) return null;

    record.surrogate = surrogate;
    record.updatedAt = nowISO();
    record.auditTrail.push({
      timestamp: nowISO(),
      action: AuditAction.SURROGATE_DESIGNATED,
      performedBy,
      performerRole: 'provider',
      details: `Surrogate designated: ${surrogate.name} (${surrogate.relationship})`,
    });

    return record;
  }

  function checkExpiration(recordId: string): { expired: boolean; daysUntilExpiry: number | null; needsRenewal: boolean } {
    const record = findRecord(recordId);
    if (!record) return { expired: false, daysUntilExpiry: null, needsRenewal: false };

    if (!record.expirationDate) return { expired: false, daysUntilExpiry: null, needsRenewal: false };

    const now = new Date();
    const expiry = new Date(record.expirationDate);
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      expired: daysUntil <= 0,
      daysUntilExpiry: daysUntil,
      needsRenewal: daysUntil <= 7 && daysUntil > 0,
    };
  }

  function renewConsent(recordId: string, performedBy: string): ConsentRecord | null {
    const record = findRecord(recordId);
    if (!record) return null;

    const doc = CONSENT_DOCUMENTS.find(d => d.id === record.documentId);
    if (doc && doc.expirationDays > 0) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + doc.expirationDays);
      record.expirationDate = newExpiry.toISOString();
    }

    record.status = ConsentStatus.OBTAINED;
    record.updatedAt = nowISO();
    record.auditTrail.push({
      timestamp: nowISO(),
      action: AuditAction.RENEWED,
      performedBy,
      performerRole: 'provider',
      details: `Consent renewed. New expiration: ${record.expirationDate}`,
    });

    return record;
  }

  function getAuditTrail(recordId: string): AuditEntry[] {
    const record = findRecord(recordId);
    return record ? [...record.auditTrail] : [];
  }

  function getPatientConsents(patientId: string): ConsentRecord[] {
    return consentRecords.filter(r => r.patientId === patientId);
  }

  function getPendingConsents(patientId: string): ConsentRecord[] {
    return consentRecords.filter(r => r.patientId === patientId && r.status === ConsentStatus.PENDING);
  }

  function validateConsent(recordId: string): { valid: boolean; issues: string[] } {
    const record = findRecord(recordId);
    if (!record) return { valid: false, issues: ['Consent record not found'] };

    const issues: string[] = [];
    const doc = CONSENT_DOCUMENTS.find(d => d.id === record.documentId);

    // Check status
    if (record.status !== ConsentStatus.OBTAINED) {
      issues.push(`Consent status is ${record.status}, not obtained`);
    }

    // Check witness requirements
    if (doc?.requiresWitness && record.witnessRecords.length < (doc.witnessCount || 1)) {
      issues.push(`Requires ${doc.witnessCount} witness(es), has ${record.witnessRecords.length}`);
    }

    // Check expiration
    const expCheck = checkExpiration(recordId);
    if (expCheck.expired) {
      issues.push('Consent has expired');
    }

    // Check capacity for surgical/anesthesia/blood
    const needsCapacity = [ConsentType.SURGICAL, ConsentType.ANESTHESIA, ConsentType.BLOOD_PRODUCTS, ConsentType.RESEARCH].includes(record.consentType);
    if (needsCapacity && !record.capacityAssessment) {
      issues.push('Capacity assessment not documented');
    }

    if (record.capacityAssessment?.status === CapacityStatus.LACKS_CAPACITY && !record.surrogate) {
      issues.push('Patient lacks capacity but no surrogate designated');
    }

    // Check patient name
    if (!record.patientName) {
      issues.push('Patient name is missing');
    }

    // Check provider
    if (!record.providerName) {
      issues.push('Provider name is missing');
    }

    return { valid: issues.length === 0, issues };
  }

  function getConsentVersionHistory(consentType: ConsentType): Array<{ version: string; effectiveDate: string; changes: string }> {
    return VERSION_HISTORY[consentType] || [];
  }

  function recordWorkflowDelay(delay: ConsentWorkflowDelay): void {
    workflowDelays.push(delay);
  }

  function getOptimizedWorkflow(consentType: ConsentType): { suggestedOrder: string[]; avgTime: number; bottlenecks: string[] } {
    const delays = workflowDelays.filter(d => d.consentType === consentType);

    // Default workflow steps
    const defaultSteps = [
      'Patient identification',
      'Document selection',
      'Provider explanation',
      'Questions and answers',
      'Capacity confirmation',
      'Patient signature',
      'Witness signature',
      'Document filing',
    ];

    if (delays.length === 0) {
      return { suggestedOrder: defaultSteps, avgTime: 15, bottlenecks: [] };
    }

    // Identify bottlenecks from learned data
    const bottleneckMap = new Map<string, number>();
    let totalDelay = 0;
    for (const d of delays) {
      const current = bottleneckMap.get(d.bottleneck) || 0;
      bottleneckMap.set(d.bottleneck, current + d.avgDelayMinutes * d.occurrenceCount);
      totalDelay += d.avgDelayMinutes;
    }

    const bottlenecks = Array.from(bottleneckMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const avgTime = Math.round(totalDelay / delays.length);

    // Reorder steps to address bottlenecks early
    const optimized = [...defaultSteps];
    if (bottlenecks.includes('Witness signature')) {
      const wsIdx = optimized.indexOf('Witness signature');
      if (wsIdx > 0) {
        optimized.splice(wsIdx, 1);
        optimized.splice(2, 0, 'Pre-arrange witness');
      }
    }

    return { suggestedOrder: optimized, avgTime, bottlenecks };
  }

  function getConsentStats(): { total: number; byStatus: Record<string, number>; byType: Record<string, number>; pendingCount: number; expiringSoonCount: number } {
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let pendingCount = 0;
    let expiringSoonCount = 0;

    for (const r of consentRecords) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byType[r.consentType] = (byType[r.consentType] || 0) + 1;
      if (r.status === ConsentStatus.PENDING) pendingCount++;
      const exp = checkExpiration(r.id);
      if (exp.needsRenewal) expiringSoonCount++;
    }

    return { total: consentRecords.length, byStatus, byType, pendingCount, expiringSoonCount };
  }

  return {
    getConsentDocuments,
    getConsentDocument,
    createConsentRecord,
    updateConsentStatus,
    addWitness,
    assessCapacity,
    designateSurrogate,
    checkExpiration,
    renewConsent,
    getAuditTrail,
    getPatientConsents,
    getPendingConsents,
    validateConsent,
    getConsentVersionHistory,
    recordWorkflowDelay,
    getOptimizedWorkflow,
    getConsentStats,
  };
}
