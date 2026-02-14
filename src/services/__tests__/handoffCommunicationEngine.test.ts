import { describe, it, expect, beforeEach } from 'vitest';
import {
  handoffCommunicationEngine,
  HANDOFF_TEMPLATES,
  IllnessSeverity,
  ShiftType,
  VerificationStatus,
  HandoffSection,
  type PatientData,
} from '../handoffCommunicationEngine';

// Reusable test patient data
function createTestPatient(overrides?: Partial<PatientData>): PatientData {
  return {
    id: 'pt-test-001',
    name: 'John Smith',
    age: 65,
    sex: 'M',
    mrn: 'MRN123456',
    room: '501A',
    admitDate: '2024-12-01',
    diagnosis: 'Post-op colorectal surgery',
    surgeryType: 'Colorectal resection',
    postOpDay: 1,
    allergies: ['Penicillin', 'Sulfa'],
    codeStatus: 'Full Code',
    vitals: { hr: 88, bp: '130/80', temp: 37.2, rr: 16, spo2: 97 },
    medications: [
      { name: 'Acetaminophen', dose: '1g', route: 'PO', frequency: 'Q6h' },
      { name: 'Heparin', dose: '5000 units', route: 'SQ', frequency: 'Q8h', isHighAlert: true, nextDue: '2200' },
      { name: 'Ondansetron', dose: '4mg', route: 'IV', frequency: 'Q6h PRN' },
    ],
    labs: [
      { test: 'WBC', value: 12.5, unit: 'K/uL', flag: 'high', timestamp: '2024-12-02T08:00:00Z' },
      { test: 'Hgb', value: 10.2, unit: 'g/dL', flag: 'low', timestamp: '2024-12-02T08:00:00Z' },
    ],
    activeProblems: ['Postoperative ileus', 'Mild anemia', 'Controlled pain'],
    pendingTasks: ['Repeat CBC in AM', 'PT evaluation', 'Diet advancement trial'],
    ivAccess: '20G R forearm, running D5 1/2NS at 75mL/hr',
    diet: 'Clear liquids, advance as tolerated',
    activity: 'Up in chair TID, walk with assist',
    painScore: 4,
    intakeOutput: { intake: 2400, output: 1800 },
    ...overrides,
  };
}

describe('HandoffCommunicationEngine', () => {
  beforeEach(() => {
    handoffCommunicationEngine.resetLearningData();
  });

  describe('SBAR note generation', () => {
    it('should generate a complete SBAR note from patient data', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);

      expect(note.format).toBe('sbar');
      expect(note.patientId).toBe('pt-test-001');
      expect(note.situation).toBeTruthy();
      expect(note.background).toBeTruthy();
      expect(note.assessment).toBeTruthy();
      expect(note.recommendation).toBeTruthy();
      expect(note.generatedAt).toBeTruthy();
    });

    it('should include patient identifiers in situation', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);

      expect(note.situation).toContain('John Smith');
      expect(note.situation).toContain('65');
      expect(note.situation).toContain('501A');
      expect(note.situation).toContain('HR 88');
    });

    it('should include allergies and code status in background', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);

      expect(note.background).toContain('Penicillin');
      expect(note.background).toContain('Sulfa');
      expect(note.background).toContain('Full Code');
    });

    it('should highlight high-alert medications', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);

      expect(note.background).toContain('HIGH-ALERT MEDS');
      expect(note.background).toContain('Heparin');
    });

    it('should include abnormal labs in background', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);

      expect(note.background).toContain('Abnormal labs');
      expect(note.background).toContain('WBC');
    });

    it('should include pending tasks in recommendations', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);

      expect(note.recommendation).toContain('Repeat CBC in AM');
      expect(note.recommendation).toContain('PT evaluation');
    });
  });

  describe('I-PASS note generation', () => {
    it('should generate a complete I-PASS note from patient data', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateIPASSNote(patient);

      expect(note.format).toBe('ipass');
      expect(note.illnessSeverity).toBeTruthy();
      expect(note.patientSummary).toBeTruthy();
      expect(note.actionList.length).toBeGreaterThan(0);
      expect(note.situationAwareness.length).toBeGreaterThan(0);
      expect(note.synthesis).toBeTruthy();
    });

    it('should classify stable patient as STABLE', () => {
      const patient = createTestPatient({
        vitals: { hr: 75, bp: '120/70', temp: 37.0, rr: 14, spo2: 98 },
        painScore: 3,
      });
      const note = handoffCommunicationEngine.generateIPASSNote(patient);
      expect(note.illnessSeverity).toBe(IllnessSeverity.STABLE);
    });

    it('should classify tachycardic febrile patient as WATCHER', () => {
      const patient = createTestPatient({
        vitals: { hr: 115, bp: '130/80', temp: 38.5, rr: 20, spo2: 96 },
      });
      const note = handoffCommunicationEngine.generateIPASSNote(patient);
      expect(note.illnessSeverity).toBe(IllnessSeverity.WATCHER);
    });

    it('should classify severely hypoxic patient as UNSTABLE', () => {
      const patient = createTestPatient({
        vitals: { hr: 135, bp: '85/50', temp: 39.8, rr: 32, spo2: 88 },
      });
      const note = handoffCommunicationEngine.generateIPASSNote(patient);
      expect(note.illnessSeverity).toBe(IllnessSeverity.UNSTABLE);
    });

    it('should include medication action items with due times', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateIPASSNote(patient);

      const medActions = note.actionList.filter(a => a.action.includes('Heparin'));
      expect(medActions.length).toBeGreaterThan(0);
      expect(medActions[0].dueBy).toBe('2200');
    });
  });

  describe('critical information flagging', () => {
    it('should flag allergies, code status, and high-alert meds', () => {
      const patient = createTestPatient();
      const flags = handoffCommunicationEngine.identifyCriticalFlags(patient);

      expect(flags.some(f => f.includes('ALLERGIES'))).toBe(true);
      expect(flags.some(f => f.includes('HIGH-ALERT MEDS'))).toBe(true);
    });

    it('should flag abnormal code status', () => {
      const patient = createTestPatient({ codeStatus: 'DNR/DNI' });
      const flags = handoffCommunicationEngine.identifyCriticalFlags(patient);
      expect(flags.some(f => f.includes('CODE STATUS'))).toBe(true);
    });

    it('should flag isolation precautions', () => {
      const patient = createTestPatient({ isolationPrecautions: 'Contact - MRSA' });
      const flags = handoffCommunicationEngine.identifyCriticalFlags(patient);
      expect(flags.some(f => f.includes('ISOLATION'))).toBe(true);
    });

    it('should flag critical vitals', () => {
      const patient = createTestPatient({
        vitals: { hr: 140, bp: '80/40', temp: 39.5, rr: 30, spo2: 88 },
      });
      const flags = handoffCommunicationEngine.identifyCriticalFlags(patient);
      expect(flags.some(f => f.includes('HYPOXIA'))).toBe(true);
      expect(flags.some(f => f.includes('TACHYCARDIA'))).toBe(true);
    });
  });

  describe('completeness scoring', () => {
    it('should score a well-formed SBAR note highly', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);
      const score = handoffCommunicationEngine.scoreCompleteness(note);

      expect(score.totalScore).toBeGreaterThan(60);
      expect(score.sectionScores['situation']).toBeGreaterThan(0);
      expect(score.sectionScores['background']).toBeGreaterThan(0);
      expect(score.sectionScores['assessment']).toBeGreaterThan(0);
      expect(score.sectionScores['recommendation']).toBeGreaterThan(0);
    });

    it('should score I-PASS note completeness', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateIPASSNote(patient);
      const score = handoffCommunicationEngine.scoreIPASSCompleteness(note);

      expect(score.totalScore).toBeGreaterThan(50);
      expect(score.sectionScores['illness_severity']).toBe(10);
    });
  });

  describe('handoff templates', () => {
    it('should have 50+ handoff templates', () => {
      expect(HANDOFF_TEMPLATES.length).toBeGreaterThanOrEqual(50);
    });

    it('should match templates based on conditions', () => {
      const matches = handoffCommunicationEngine.getMatchingTemplates(['post_op', 'fever']);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(t => t.scenario.toLowerCase().includes('fever'))).toBe(true);
    });

    it('should match ICU-specific templates', () => {
      const matches = handoffCommunicationEngine.getMatchingTemplates(['icu', 'ventilated']);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('shift change workflow', () => {
    it('should provide day-to-evening handoff checklist', () => {
      const workflow = handoffCommunicationEngine.getShiftChangeWorkflow(ShiftType.DAY, ShiftType.EVENING);
      expect(workflow.checklist.length).toBeGreaterThan(0);
      expect(workflow.focusAreas.length).toBeGreaterThan(0);
    });

    it('should provide different checklists for different shift transitions', () => {
      const dayEvening = handoffCommunicationEngine.getShiftChangeWorkflow(ShiftType.DAY, ShiftType.EVENING);
      const eveningNight = handoffCommunicationEngine.getShiftChangeWorkflow(ShiftType.EVENING, ShiftType.NIGHT);
      const nightDay = handoffCommunicationEngine.getShiftChangeWorkflow(ShiftType.NIGHT, ShiftType.DAY);

      // Each transition should have unique focus areas
      expect(dayEvening.focusAreas).not.toEqual(eveningNight.focusAreas);
      expect(eveningNight.focusAreas).not.toEqual(nightDay.focusAreas);
    });
  });

  describe('verification and tracking', () => {
    it('should create handoff records with NOT_VERIFIED status', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);
      const record = handoffCommunicationEngine.createHandoffRecord(note, 'nurse-001', 'nurse-002', ShiftType.DAY, ShiftType.EVENING);

      expect(record.verificationStatus).toBe(VerificationStatus.NOT_VERIFIED);
      expect(record.senderClinicianId).toBe('nurse-001');
      expect(record.receiverClinicianId).toBe('nurse-002');
    });

    it('should update verification status and record read-back time', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);
      const record = handoffCommunicationEngine.createHandoffRecord(note, 'nurse-001', 'nurse-002', ShiftType.DAY, ShiftType.EVENING);

      const verified = handoffCommunicationEngine.verifyHandoff(record, VerificationStatus.READ_BACK_COMPLETE);
      expect(verified.verificationStatus).toBe(VerificationStatus.READ_BACK_COMPLETE);
      expect(verified.readBackAt).toBeTruthy();
    });
  });

  describe('self-learning', () => {
    it('should track clinician edits and build preferences', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);
      let record = handoffCommunicationEngine.createHandoffRecord(note, 'nurse-001', 'nurse-002', ShiftType.DAY, ShiftType.EVENING);

      // Record several edits
      record = handoffCommunicationEngine.recordEdit(record, {
        section: HandoffSection.ASSESSMENT,
        originalText: 'Clinical impression: Stable',
        editedText: 'Clinical impression: Stable but monitor for ileus',
        editedBy: 'nurse-002',
        editedAt: new Date().toISOString(),
      });

      record = handoffCommunicationEngine.recordEdit(record, {
        section: HandoffSection.RECOMMENDATION,
        originalText: 'Continue monitoring',
        editedText: 'Continue monitoring, advance diet if passing flatus',
        editedBy: 'nurse-002',
        editedAt: new Date().toISOString(),
      });

      expect(record.edits).toHaveLength(2);

      const prefs = handoffCommunicationEngine.getClinicianPreferences('nurse-002');
      expect(prefs).toBeDefined();
      expect(prefs!.sectionEmphasis[HandoffSection.ASSESSMENT]).toBeGreaterThan(0);
    });

    it('should return top edit patterns for a clinician', () => {
      const patient = createTestPatient();
      const note = handoffCommunicationEngine.generateSBARNote(patient);
      let record = handoffCommunicationEngine.createHandoffRecord(note, 'nurse-001', 'nurse-002', ShiftType.DAY, ShiftType.EVENING);

      // Same edit pattern multiple times
      for (let i = 0; i < 3; i++) {
        record = handoffCommunicationEngine.recordEdit(record, {
          section: HandoffSection.ASSESSMENT,
          originalText: 'Standard text',
          editedText: 'Preferred text',
          editedBy: 'nurse-003',
          editedAt: new Date().toISOString(),
        });
      }

      const patterns = handoffCommunicationEngine.getTopEditPatterns('nurse-003');
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].frequency).toBe(3);
    });
  });
});
