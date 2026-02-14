import { describe, it, expect, beforeEach } from 'vitest';
import {
  createConsentManagementEngine,
  ConsentType,
  ConsentStatus,
  CapacityStatus,
  SurrogateType,
  Language,
  AuditAction,
  type ConsentManagementEngine,
  type CreateConsentInput,
} from '../consentManagementEngine';

describe('ConsentManagementEngine', () => {
  let engine: ConsentManagementEngine;

  const baseInput: CreateConsentInput = {
    consentType: ConsentType.SURGICAL,
    patientId: 'PAT-001',
    patientName: 'John Doe',
    providerName: 'Dr. Sarah Johnson',
    providerId: 'NPI-1234567890',
    facilityName: 'General Hospital',
    procedureDescription: 'Total knee arthroplasty, right knee',
    signatureMethod: 'electronic',
  };

  beforeEach(() => {
    engine = createConsentManagementEngine();
  });

  describe('Consent Documents Database', () => {
    it('should have 13 consent document templates', () => {
      const docs = engine.getConsentDocuments();
      expect(docs.length).toBe(13);
    });

    it('should include all consent types', () => {
      const docs = engine.getConsentDocuments();
      const types = new Set(docs.map(d => d.consentType));
      expect(types.has(ConsentType.SURGICAL)).toBe(true);
      expect(types.has(ConsentType.ANESTHESIA)).toBe(true);
      expect(types.has(ConsentType.BLOOD_PRODUCTS)).toBe(true);
      expect(types.has(ConsentType.RESEARCH)).toBe(true);
      expect(types.has(ConsentType.HIPAA)).toBe(true);
      expect(types.has(ConsentType.TELEHEALTH)).toBe(true);
      expect(types.has(ConsentType.ADVANCE_DIRECTIVE)).toBe(true);
      expect(types.has(ConsentType.DNR)).toBe(true);
    });

    it('should have documents with risk, benefit, and alternatives sections', () => {
      const doc = engine.getConsentDocument(ConsentType.SURGICAL);
      expect(doc).not.toBeNull();
      expect(doc!.riskSection.length).toBeGreaterThan(0);
      expect(doc!.benefitSection.length).toBeGreaterThan(0);
      expect(doc!.alternativesSection.length).toBeGreaterThan(0);
    });

    it('should support multiple languages', () => {
      const doc = engine.getConsentDocument(ConsentType.HIPAA);
      expect(doc).not.toBeNull();
      expect(doc!.availableLanguages.length).toBeGreaterThanOrEqual(10);
      expect(doc!.availableLanguages).toContain(Language.ENGLISH);
      expect(doc!.availableLanguages).toContain(Language.SPANISH);
    });
  });

  describe('Consent Record Creation', () => {
    it('should create a consent record with pending status', () => {
      const record = engine.createConsentRecord(baseInput);
      expect(record.id).toBeDefined();
      expect(record.consentType).toBe(ConsentType.SURGICAL);
      expect(record.patientId).toBe('PAT-001');
      expect(record.patientName).toBe('John Doe');
      expect(record.status).toBe(ConsentStatus.PENDING);
      expect(record.language).toBe(Language.ENGLISH);
      expect(record.signatureMethod).toBe('electronic');
    });

    it('should create consent in specified language', () => {
      const record = engine.createConsentRecord({
        ...baseInput,
        language: Language.SPANISH,
      });
      expect(record.language).toBe(Language.SPANISH);
    });

    it('should add creation audit entry', () => {
      const record = engine.createConsentRecord(baseInput);
      expect(record.auditTrail.length).toBe(1);
      expect(record.auditTrail[0].action).toBe(AuditAction.CREATED);
      expect(record.auditTrail[0].performedBy).toBe('Dr. Sarah Johnson');
    });
  });

  describe('Consent Status Management', () => {
    it('should update consent status to obtained', () => {
      const record = engine.createConsentRecord(baseInput);
      const updated = engine.updateConsentStatus(record.id, ConsentStatus.OBTAINED, 'Dr. Johnson');
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(ConsentStatus.OBTAINED);
      expect(updated!.signedDate).toBeDefined();
      expect(updated!.expirationDate).toBeDefined();
    });

    it('should update consent status to declined', () => {
      const record = engine.createConsentRecord(baseInput);
      const updated = engine.updateConsentStatus(record.id, ConsentStatus.DECLINED, 'Patient');
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe(ConsentStatus.DECLINED);
    });

    it('should update consent status to withdrawn', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.updateConsentStatus(record.id, ConsentStatus.OBTAINED, 'Dr. Johnson');
      const withdrawn = engine.updateConsentStatus(record.id, ConsentStatus.WITHDRAWN, 'Patient');
      expect(withdrawn).not.toBeNull();
      expect(withdrawn!.status).toBe(ConsentStatus.WITHDRAWN);
    });

    it('should return null for unknown record id', () => {
      const result = engine.updateConsentStatus('nonexistent', ConsentStatus.OBTAINED, 'Dr. X');
      expect(result).toBeNull();
    });
  });

  describe('Witness Management', () => {
    it('should add witness to consent record', () => {
      const record = engine.createConsentRecord(baseInput);
      const updated = engine.addWitness(record.id, {
        witnessName: 'Nurse Jane Smith',
        witnessRole: 'Registered Nurse',
        witnessDate: new Date().toISOString(),
        signatureMethod: 'electronic',
      });
      expect(updated).not.toBeNull();
      expect(updated!.witnessRecords.length).toBe(1);
      expect(updated!.witnessRecords[0].witnessName).toBe('Nurse Jane Smith');
    });

    it('should add witness audit entry', () => {
      const record = engine.createConsentRecord(baseInput);
      const updated = engine.addWitness(record.id, {
        witnessName: 'Nurse A',
        witnessRole: 'RN',
        witnessDate: new Date().toISOString(),
        signatureMethod: 'electronic',
      });
      const witnessAudit = updated!.auditTrail.find(a => a.action === AuditAction.WITNESSED);
      expect(witnessAudit).toBeDefined();
      expect(witnessAudit!.performedBy).toBe('Nurse A');
    });
  });

  describe('Capacity Assessment', () => {
    it('should record capacity assessment', () => {
      const record = engine.createConsentRecord(baseInput);
      const updated = engine.assessCapacity(record.id, {
        assessedBy: 'Dr. Smith',
        assessedDate: new Date().toISOString(),
        status: CapacityStatus.HAS_CAPACITY,
        findings: 'Patient demonstrates understanding of procedure, risks, and alternatives.',
        canUnderstand: true,
        canAppreciate: true,
        canReason: true,
        canCommunicate: true,
      });
      expect(updated).not.toBeNull();
      expect(updated!.capacityAssessment).toBeDefined();
      expect(updated!.capacityAssessment!.status).toBe(CapacityStatus.HAS_CAPACITY);
      expect(updated!.capacityAssessment!.canUnderstand).toBe(true);
      expect(updated!.capacityAssessment!.canAppreciate).toBe(true);
    });

    it('should add capacity assessment audit entry', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.assessCapacity(record.id, {
        assessedBy: 'Dr. Smith',
        assessedDate: new Date().toISOString(),
        status: CapacityStatus.LACKS_CAPACITY,
        findings: 'Patient unable to demonstrate understanding.',
        canUnderstand: false,
        canAppreciate: false,
        canReason: false,
        canCommunicate: true,
      });
      const trail = engine.getAuditTrail(record.id);
      expect(trail.some(e => e.action === AuditAction.CAPACITY_ASSESSED)).toBe(true);
    });
  });

  describe('Surrogate Decision Maker', () => {
    it('should designate surrogate decision maker', () => {
      const record = engine.createConsentRecord(baseInput);
      const updated = engine.designateSurrogate(record.id, {
        name: 'Jane Doe',
        relationship: SurrogateType.HEALTHCARE_PROXY,
        phone: '555-0123',
        email: 'jane@example.com',
        documentOnFile: true,
        documentDate: '2024-06-15',
      }, 'Dr. Johnson');
      expect(updated).not.toBeNull();
      expect(updated!.surrogate).toBeDefined();
      expect(updated!.surrogate!.name).toBe('Jane Doe');
      expect(updated!.surrogate!.relationship).toBe(SurrogateType.HEALTHCARE_PROXY);
    });

    it('should add surrogate designation audit entry', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.designateSurrogate(record.id, {
        name: 'Bob Doe',
        relationship: SurrogateType.NEXT_OF_KIN,
        phone: '555-0456',
        documentOnFile: false,
      }, 'Dr. Johnson');
      const trail = engine.getAuditTrail(record.id);
      expect(trail.some(e => e.action === AuditAction.SURROGATE_DESIGNATED)).toBe(true);
    });
  });

  describe('Expiration and Renewal', () => {
    it('should check expiration for obtained consent', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.updateConsentStatus(record.id, ConsentStatus.OBTAINED, 'Dr. Johnson');
      const result = engine.checkExpiration(record.id);
      expect(result.expired).toBe(false);
      expect(result.daysUntilExpiry).toBeGreaterThan(0);
    });

    it('should return no expiry for pending consent', () => {
      const record = engine.createConsentRecord(baseInput);
      const result = engine.checkExpiration(record.id);
      expect(result.daysUntilExpiry).toBeNull();
    });

    it('should renew consent and extend expiration', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.updateConsentStatus(record.id, ConsentStatus.OBTAINED, 'Dr. Johnson');
      const renewed = engine.renewConsent(record.id, 'Dr. Johnson');
      expect(renewed).not.toBeNull();
      expect(renewed!.status).toBe(ConsentStatus.OBTAINED);
      const trail = engine.getAuditTrail(record.id);
      expect(trail.some(e => e.action === AuditAction.RENEWED)).toBe(true);
    });
  });

  describe('Patient Consent Queries', () => {
    it('should retrieve all consents for a patient', () => {
      engine.createConsentRecord(baseInput);
      engine.createConsentRecord({ ...baseInput, consentType: ConsentType.ANESTHESIA });
      engine.createConsentRecord({ ...baseInput, consentType: ConsentType.HIPAA });

      const consents = engine.getPatientConsents('PAT-001');
      expect(consents.length).toBe(3);
    });

    it('should retrieve pending consents for a patient', () => {
      const r1 = engine.createConsentRecord(baseInput);
      engine.createConsentRecord({ ...baseInput, consentType: ConsentType.ANESTHESIA });
      engine.updateConsentStatus(r1.id, ConsentStatus.OBTAINED, 'Dr. Johnson');

      const pending = engine.getPendingConsents('PAT-001');
      expect(pending.length).toBe(1);
      expect(pending[0].consentType).toBe(ConsentType.ANESTHESIA);
    });
  });

  describe('Consent Validation', () => {
    it('should validate a complete consent as invalid when pending', () => {
      const record = engine.createConsentRecord(baseInput);
      const result = engine.validateConsent(record.id);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.includes('pending'))).toBe(true);
    });

    it('should flag missing witness', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.updateConsentStatus(record.id, ConsentStatus.OBTAINED, 'Dr. Johnson');
      const result = engine.validateConsent(record.id);
      // Surgical consent requires witness
      expect(result.issues.some(i => i.includes('witness'))).toBe(true);
    });

    it('should flag missing capacity assessment for surgical consent', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.updateConsentStatus(record.id, ConsentStatus.OBTAINED, 'Dr. Johnson');
      const result = engine.validateConsent(record.id);
      expect(result.issues.some(i => i.includes('Capacity assessment'))).toBe(true);
    });

    it('should flag lacks capacity without surrogate', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.updateConsentStatus(record.id, ConsentStatus.OBTAINED, 'Dr. Johnson');
      engine.addWitness(record.id, {
        witnessName: 'Nurse A', witnessRole: 'RN',
        witnessDate: new Date().toISOString(), signatureMethod: 'electronic',
      });
      engine.assessCapacity(record.id, {
        assessedBy: 'Dr. Smith', assessedDate: new Date().toISOString(),
        status: CapacityStatus.LACKS_CAPACITY, findings: 'Cannot understand.',
        canUnderstand: false, canAppreciate: false, canReason: false, canCommunicate: true,
      });
      const result = engine.validateConsent(record.id);
      expect(result.issues.some(i => i.includes('surrogate'))).toBe(true);
    });

    it('should return not found for invalid record id', () => {
      const result = engine.validateConsent('nonexistent');
      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('not found');
    });
  });

  describe('Version History', () => {
    it('should return version history for a consent type', () => {
      const history = engine.getConsentVersionHistory(ConsentType.SURGICAL);
      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history[0].version).toBe('1.0');
      expect(history[history.length - 1].version).toBe('3.2');
    });

    it('should return version history for research consent', () => {
      const history = engine.getConsentVersionHistory(ConsentType.RESEARCH);
      expect(history.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Audit Trail', () => {
    it('should maintain comprehensive audit trail', () => {
      const record = engine.createConsentRecord(baseInput);
      engine.updateConsentStatus(record.id, ConsentStatus.OBTAINED, 'Dr. Johnson');
      engine.addWitness(record.id, {
        witnessName: 'Nurse A', witnessRole: 'RN',
        witnessDate: new Date().toISOString(), signatureMethod: 'electronic',
      });

      const trail = engine.getAuditTrail(record.id);
      expect(trail.length).toBe(3);
      expect(trail[0].action).toBe(AuditAction.CREATED);
      expect(trail[1].action).toBe(AuditAction.SIGNED);
      expect(trail[2].action).toBe(AuditAction.WITNESSED);
      expect(trail.every(e => e.timestamp)).toBe(true);
      expect(trail.every(e => e.performedBy)).toBe(true);
    });

    it('should return empty trail for nonexistent record', () => {
      const trail = engine.getAuditTrail('nonexistent');
      expect(trail.length).toBe(0);
    });
  });

  describe('Consent Stats', () => {
    it('should compute consent statistics', () => {
      engine.createConsentRecord(baseInput);
      engine.createConsentRecord({ ...baseInput, consentType: ConsentType.ANESTHESIA });
      const r3 = engine.createConsentRecord({ ...baseInput, consentType: ConsentType.HIPAA });
      engine.updateConsentStatus(r3.id, ConsentStatus.OBTAINED, 'Dr. J');

      const stats = engine.getConsentStats();
      expect(stats.total).toBe(3);
      expect(stats.pendingCount).toBe(2);
      expect(stats.byStatus[ConsentStatus.PENDING]).toBe(2);
      expect(stats.byStatus[ConsentStatus.OBTAINED]).toBe(1);
      expect(stats.byType[ConsentType.SURGICAL]).toBe(1);
    });
  });

  describe('Self-Learning (Workflow Optimization)', () => {
    it('should return default workflow when no data recorded', () => {
      const workflow = engine.getOptimizedWorkflow(ConsentType.SURGICAL);
      expect(workflow.suggestedOrder.length).toBeGreaterThan(0);
      expect(workflow.avgTime).toBe(15);
      expect(workflow.bottlenecks.length).toBe(0);
    });

    it('should identify bottlenecks from recorded delays', () => {
      engine.recordWorkflowDelay({
        consentType: ConsentType.SURGICAL,
        avgDelayMinutes: 12,
        bottleneck: 'Witness signature',
        occurrenceCount: 5,
        timestamp: new Date().toISOString(),
      });
      engine.recordWorkflowDelay({
        consentType: ConsentType.SURGICAL,
        avgDelayMinutes: 8,
        bottleneck: 'Provider explanation',
        occurrenceCount: 3,
        timestamp: new Date().toISOString(),
      });

      const workflow = engine.getOptimizedWorkflow(ConsentType.SURGICAL);
      expect(workflow.bottlenecks.length).toBeGreaterThan(0);
      expect(workflow.bottlenecks[0]).toBe('Witness signature');
      expect(workflow.avgTime).toBeGreaterThan(0);
    });
  });
});
