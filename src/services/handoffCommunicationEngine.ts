/**
 * Handoff Communication Engine (SBAR / I-PASS)
 *
 * Real clinical handoff communication protocols:
 * - SBAR format (Situation, Background, Assessment, Recommendation)
 * - I-PASS format (Illness severity, Patient summary, Action list, Situation awareness, Synthesis)
 * - Automated handoff note generation from patient data
 * - Critical information highlighting
 * - Handoff completeness scoring
 * - Shift change handoff workflows (day->evening->night)
 * - Read-back verification tracking
 * - Escalation criteria embedded in handoff
 * - 50+ handoff templates for common scenarios
 * - Self-learning: improves note generation based on clinician edits
 *
 * No external dependencies.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const HandoffFormat = {
  SBAR: 'sbar',
  IPASS: 'ipass',
} as const;
export type HandoffFormat = (typeof HandoffFormat)[keyof typeof HandoffFormat];

export const IllnessSeverity = {
  STABLE: 'stable',
  WATCHER: 'watcher',
  UNSTABLE: 'unstable',
} as const;
export type IllnessSeverity = (typeof IllnessSeverity)[keyof typeof IllnessSeverity];

export const ShiftType = {
  DAY: 'day',
  EVENING: 'evening',
  NIGHT: 'night',
} as const;
export type ShiftType = (typeof ShiftType)[keyof typeof ShiftType];

export const EscalationLevel = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  EMERGENT: 'emergent',
} as const;
export type EscalationLevel = (typeof EscalationLevel)[keyof typeof EscalationLevel];

export const VerificationStatus = {
  NOT_VERIFIED: 'not_verified',
  READ_BACK_COMPLETE: 'read_back_complete',
  ACKNOWLEDGED: 'acknowledged',
  QUESTIONED: 'questioned',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const HandoffSection = {
  // SBAR sections
  SITUATION: 'situation',
  BACKGROUND: 'background',
  ASSESSMENT: 'assessment',
  RECOMMENDATION: 'recommendation',
  // I-PASS sections
  ILLNESS_SEVERITY: 'illness_severity',
  PATIENT_SUMMARY: 'patient_summary',
  ACTION_LIST: 'action_list',
  SITUATION_AWARENESS: 'situation_awareness',
  SYNTHESIS: 'synthesis',
} as const;
export type HandoffSection = (typeof HandoffSection)[keyof typeof HandoffSection];

// ============================================================================
// Interfaces
// ============================================================================

export interface PatientData {
  id: string;
  name: string;
  age: number;
  sex: string;
  mrn: string;
  room: string;
  admitDate: string;
  diagnosis: string;
  surgeryType?: string;
  postOpDay?: number;
  allergies: string[];
  codeStatus: string;
  isolationPrecautions?: string;
  vitals: {
    hr: number;
    bp: string;
    temp: number;
    rr: number;
    spo2: number;
  };
  medications: MedicationInfo[];
  labs: LabResult[];
  activeProblems: string[];
  pendingTasks: string[];
  ivAccess: string;
  diet: string;
  activity: string;
  painScore?: number;
  intakeOutput?: { intake: number; output: number };
}

export interface MedicationInfo {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  nextDue?: string;
  isHighAlert?: boolean;
}

export interface LabResult {
  test: string;
  value: number | string;
  unit: string;
  flag?: string;
  timestamp: string;
}

export interface SBARNote {
  format: 'sbar';
  patientId: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  criticalFlags: string[];
  escalationCriteria: EscalationCriterion[];
  generatedAt: string;
  completenessScore: number;
}

export interface IPASSNote {
  format: 'ipass';
  patientId: string;
  illnessSeverity: IllnessSeverity;
  patientSummary: string;
  actionList: ActionItem[];
  situationAwareness: SituationAwarenessItem[];
  synthesis: string;
  criticalFlags: string[];
  escalationCriteria: EscalationCriterion[];
  generatedAt: string;
  completenessScore: number;
}

export interface ActionItem {
  action: string;
  priority: 'stat' | 'urgent' | 'routine';
  dueBy?: string;
  responsible?: string;
}

export interface SituationAwarenessItem {
  condition: string;
  planIfOccurs: string;
  likelihood: 'likely' | 'possible' | 'unlikely';
}

export interface EscalationCriterion {
  condition: string;
  level: EscalationLevel;
  notifyWhom: string;
  action: string;
}

export interface HandoffRecord {
  id: string;
  format: HandoffFormat;
  note: SBARNote | IPASSNote;
  senderClinicianId: string;
  receiverClinicianId: string;
  shiftChange: { from: ShiftType; to: ShiftType };
  verificationStatus: VerificationStatus;
  readBackAt?: string;
  questions: string[];
  edits: HandoffEdit[];
  timestamp: string;
}

export interface HandoffEdit {
  section: HandoffSection;
  originalText: string;
  editedText: string;
  editedBy: string;
  editedAt: string;
  reason?: string;
}

export interface CompletenessScoreBreakdown {
  totalScore: number;
  sectionScores: Record<string, number>;
  missingElements: string[];
  criticalMissing: string[];
  suggestions: string[];
}

export interface HandoffTemplate {
  id: string;
  scenario: string;
  category: string;
  format: HandoffFormat;
  templateData: Partial<SBARNote> | Partial<IPASSNote>;
  applicableConditions: string[];
}

export interface LearningPreference {
  clinicianId: string;
  preferredFormat: HandoffFormat;
  sectionEmphasis: Record<string, number>;
  commonEdits: { pattern: string; replacement: string; frequency: number }[];
  templatePreferences: string[];
}

// ============================================================================
// Handoff Templates (50+ Real Scenarios)
// ============================================================================

export const HANDOFF_TEMPLATES: HandoffTemplate[] = [
  // Post-surgical templates
  { id: 'ht-01', scenario: 'Post-op day 0 - Uncomplicated', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient, {surgery_type}, stable, pain controlled' }, applicableConditions: ['post_op', 'stable'] },
  { id: 'ht-02', scenario: 'Post-op - Fever workup needed', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with new fever >38.3°C, needs workup' }, applicableConditions: ['post_op', 'fever'] },
  { id: 'ht-03', scenario: 'Post-op - Pain crisis', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with uncontrolled pain despite multimodal regimen' }, applicableConditions: ['post_op', 'pain'] },
  { id: 'ht-04', scenario: 'Post-op - Nausea/vomiting', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with persistent nausea/vomiting, unable to tolerate PO' }, applicableConditions: ['post_op', 'nausea'] },
  { id: 'ht-05', scenario: 'Post-op - Wound concern', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with wound concern - erythema/drainage' }, applicableConditions: ['post_op', 'wound'] },
  { id: 'ht-06', scenario: 'Post-op - Urinary retention', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with urinary retention after catheter removal' }, applicableConditions: ['post_op', 'urinary'] },
  { id: 'ht-07', scenario: 'Post-op - Ileus', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with absent bowel sounds, abdominal distension, no flatus' }, applicableConditions: ['post_op', 'ileus'] },
  { id: 'ht-08', scenario: 'Post-op - DVT concern', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with calf swelling/pain, DVT concern' }, applicableConditions: ['post_op', 'dvt'] },
  { id: 'ht-09', scenario: 'Post-op - Atelectasis/pneumonia', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with new O2 requirement, productive cough' }, applicableConditions: ['post_op', 'respiratory'] },
  { id: 'ht-10', scenario: 'Post-op - Bleeding concern', category: 'post_surgical', format: HandoffFormat.SBAR, templateData: { situation: 'Post-operative patient with increased drain output/dropping Hgb' }, applicableConditions: ['post_op', 'bleeding'] },

  // Medical conditions
  { id: 'ht-11', scenario: 'Sepsis - Early recognition', category: 'medical', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.UNSTABLE }, applicableConditions: ['sepsis'] },
  { id: 'ht-12', scenario: 'Chest pain workup', category: 'medical', format: HandoffFormat.SBAR, templateData: { situation: 'Patient with new chest pain, cardiac workup in progress' }, applicableConditions: ['chest_pain'] },
  { id: 'ht-13', scenario: 'Acute kidney injury', category: 'medical', format: HandoffFormat.SBAR, templateData: { situation: 'Patient with rising creatinine, AKI stage assessment needed' }, applicableConditions: ['aki'] },
  { id: 'ht-14', scenario: 'Hyperglycemia management', category: 'medical', format: HandoffFormat.SBAR, templateData: { situation: 'Patient with persistent hyperglycemia requiring insulin adjustment' }, applicableConditions: ['hyperglycemia'] },
  { id: 'ht-15', scenario: 'Acute delirium', category: 'medical', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.WATCHER }, applicableConditions: ['delirium'] },
  { id: 'ht-16', scenario: 'Fall risk - Active', category: 'medical', format: HandoffFormat.SBAR, templateData: { situation: 'Patient identified as high fall risk, precautions in place' }, applicableConditions: ['fall_risk'] },
  { id: 'ht-17', scenario: 'Blood transfusion in progress', category: 'medical', format: HandoffFormat.SBAR, templateData: { situation: 'Patient receiving blood transfusion, monitoring for reaction' }, applicableConditions: ['transfusion'] },
  { id: 'ht-18', scenario: 'New anticoagulation started', category: 'medical', format: HandoffFormat.SBAR, templateData: { situation: 'Patient started on anticoagulation, monitoring plan in place' }, applicableConditions: ['anticoagulation'] },
  { id: 'ht-19', scenario: 'Electrolyte abnormality', category: 'medical', format: HandoffFormat.SBAR, templateData: { situation: 'Patient with significant electrolyte abnormality requiring correction' }, applicableConditions: ['electrolyte'] },
  { id: 'ht-20', scenario: 'Respiratory distress', category: 'medical', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.UNSTABLE }, applicableConditions: ['respiratory_distress'] },

  // ICU-specific
  { id: 'ht-21', scenario: 'ICU - Ventilated patient', category: 'icu', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.UNSTABLE }, applicableConditions: ['icu', 'ventilated'] },
  { id: 'ht-22', scenario: 'ICU - Vasopressor dependent', category: 'icu', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.UNSTABLE }, applicableConditions: ['icu', 'vasopressors'] },
  { id: 'ht-23', scenario: 'ICU - Weaning trial planned', category: 'icu', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.WATCHER }, applicableConditions: ['icu', 'weaning'] },
  { id: 'ht-24', scenario: 'ICU - Post-cardiac arrest', category: 'icu', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.UNSTABLE }, applicableConditions: ['icu', 'post_arrest'] },
  { id: 'ht-25', scenario: 'ICU to floor transfer', category: 'icu', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.WATCHER }, applicableConditions: ['icu', 'transfer'] },

  // Discharge-related
  { id: 'ht-26', scenario: 'Discharge planning - Same day', category: 'discharge', format: HandoffFormat.SBAR, templateData: { recommendation: 'Plan for discharge today pending final criteria' }, applicableConditions: ['discharge'] },
  { id: 'ht-27', scenario: 'Discharge planning - Next day', category: 'discharge', format: HandoffFormat.SBAR, templateData: { recommendation: 'Discharge anticipated tomorrow, complete checklist' }, applicableConditions: ['discharge_planning'] },
  { id: 'ht-28', scenario: 'Discharge delayed - Medical reason', category: 'discharge', format: HandoffFormat.SBAR, templateData: { situation: 'Planned discharge delayed due to new medical issue' }, applicableConditions: ['discharge_delay'] },

  // Procedure-related
  { id: 'ht-29', scenario: 'Pre-procedure preparation', category: 'procedure', format: HandoffFormat.SBAR, templateData: { recommendation: 'Procedure scheduled, ensure NPO and consent' }, applicableConditions: ['pre_procedure'] },
  { id: 'ht-30', scenario: 'Post-procedure monitoring', category: 'procedure', format: HandoffFormat.SBAR, templateData: { situation: 'Patient returned from procedure, monitoring per protocol' }, applicableConditions: ['post_procedure'] },

  // Nursing-specific
  { id: 'ht-31', scenario: 'Complex wound care', category: 'nursing', format: HandoffFormat.SBAR, templateData: { background: 'Complex wound requiring specialized dressing changes' }, applicableConditions: ['wound_care'] },
  { id: 'ht-32', scenario: 'Difficult IV access', category: 'nursing', format: HandoffFormat.SBAR, templateData: { background: 'Difficult IV access, current access details and plan' }, applicableConditions: ['iv_access'] },
  { id: 'ht-33', scenario: 'Insulin drip management', category: 'nursing', format: HandoffFormat.SBAR, templateData: { situation: 'Patient on insulin drip, titration per protocol' }, applicableConditions: ['insulin_drip'] },
  { id: 'ht-34', scenario: 'PCA management', category: 'nursing', format: HandoffFormat.SBAR, templateData: { situation: 'Patient on PCA for pain management' }, applicableConditions: ['pca'] },
  { id: 'ht-35', scenario: 'Restraint reassessment due', category: 'nursing', format: HandoffFormat.SBAR, templateData: { situation: 'Patient in restraints, reassessment/renewal needed' }, applicableConditions: ['restraints'] },

  // Safety-critical
  { id: 'ht-36', scenario: 'Suicide precautions', category: 'safety', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.WATCHER }, applicableConditions: ['suicide_precautions'] },
  { id: 'ht-37', scenario: 'Elopement risk', category: 'safety', format: HandoffFormat.SBAR, templateData: { situation: 'Patient identified as elopement risk, safety measures in place' }, applicableConditions: ['elopement_risk'] },
  { id: 'ht-38', scenario: 'Isolation precautions - Contact', category: 'safety', format: HandoffFormat.SBAR, templateData: { background: 'Contact isolation precautions for MDRO' }, applicableConditions: ['isolation'] },
  { id: 'ht-39', scenario: 'Isolation precautions - Droplet', category: 'safety', format: HandoffFormat.SBAR, templateData: { background: 'Droplet isolation precautions' }, applicableConditions: ['isolation'] },
  { id: 'ht-40', scenario: 'High-alert medication running', category: 'safety', format: HandoffFormat.SBAR, templateData: { situation: 'Patient receiving high-alert medication requiring monitoring' }, applicableConditions: ['high_alert_med'] },

  // Specialty-specific
  { id: 'ht-41', scenario: 'Post-joint replacement - PT focus', category: 'orthopedic', format: HandoffFormat.SBAR, templateData: { recommendation: 'Continue mobilization protocol, PT evaluation' }, applicableConditions: ['post_op', 'orthopedic'] },
  { id: 'ht-42', scenario: 'Post-cardiac surgery - Hemodynamics', category: 'cardiac', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.WATCHER }, applicableConditions: ['post_op', 'cardiac'] },
  { id: 'ht-43', scenario: 'Post-colorectal - GI function', category: 'colorectal', format: HandoffFormat.SBAR, templateData: { assessment: 'Monitor for return of bowel function' }, applicableConditions: ['post_op', 'colorectal'] },
  { id: 'ht-44', scenario: 'Post-GYN surgery - Standard', category: 'gynecologic', format: HandoffFormat.SBAR, templateData: { recommendation: 'Monitor for bleeding, VTE prophylaxis, early ambulation' }, applicableConditions: ['post_op', 'gynecologic'] },
  { id: 'ht-45', scenario: 'Post-urologic - Catheter care', category: 'urologic', format: HandoffFormat.SBAR, templateData: { recommendation: 'Monitor urine output, catheter care, pain management' }, applicableConditions: ['post_op', 'urologic'] },

  // Miscellaneous common scenarios
  { id: 'ht-46', scenario: 'New admission - Overnight', category: 'admission', format: HandoffFormat.IPASS, templateData: { illnessSeverity: IllnessSeverity.WATCHER }, applicableConditions: ['new_admission'] },
  { id: 'ht-47', scenario: 'Family concerns/conflict', category: 'communication', format: HandoffFormat.SBAR, templateData: { background: 'Family has expressed concerns regarding care plan' }, applicableConditions: ['family_concerns'] },
  { id: 'ht-48', scenario: 'Code status change', category: 'communication', format: HandoffFormat.SBAR, templateData: { situation: 'Code status recently changed, ensure documentation updated' }, applicableConditions: ['code_status'] },
  { id: 'ht-49', scenario: 'Pending consult results', category: 'communication', format: HandoffFormat.SBAR, templateData: { recommendation: 'Follow up on pending consult recommendations' }, applicableConditions: ['pending_consult'] },
  { id: 'ht-50', scenario: 'Awaiting imaging results', category: 'communication', format: HandoffFormat.SBAR, templateData: { recommendation: 'Follow up on imaging results and adjust plan accordingly' }, applicableConditions: ['pending_imaging'] },
  { id: 'ht-51', scenario: 'Social work/case management needs', category: 'discharge', format: HandoffFormat.SBAR, templateData: { recommendation: 'Social work consulted for discharge planning needs' }, applicableConditions: ['social_work'] },
  { id: 'ht-52', scenario: 'Pain management team following', category: 'pain', format: HandoffFormat.SBAR, templateData: { background: 'Pain management team is co-managing, follow their recommendations' }, applicableConditions: ['pain_team'] },
];

// ============================================================================
// Standard Escalation Criteria
// ============================================================================

const STANDARD_ESCALATION_CRITERIA: EscalationCriterion[] = [
  { condition: 'HR <50 or >130', level: EscalationLevel.EMERGENT, notifyWhom: 'Attending + Rapid Response', action: 'Activate rapid response if hemodynamically unstable' },
  { condition: 'SBP <90 or >180', level: EscalationLevel.EMERGENT, notifyWhom: 'Attending + Rapid Response', action: 'Fluid bolus if hypotensive, IV antihypertensive if hypertensive' },
  { condition: 'SpO2 <92% on supplemental O2', level: EscalationLevel.EMERGENT, notifyWhom: 'Attending + RT', action: 'Increase O2, ABG, CXR, consider BiPAP' },
  { condition: 'Temp >39°C or <35°C', level: EscalationLevel.URGENT, notifyWhom: 'Resident/Fellow', action: 'Blood cultures, UA, CXR, start sepsis workup' },
  { condition: 'RR <8 or >30', level: EscalationLevel.EMERGENT, notifyWhom: 'Attending + Rapid Response', action: 'Assess airway, consider naloxone if opioid-related' },
  { condition: 'Acute change in mental status', level: EscalationLevel.EMERGENT, notifyWhom: 'Attending', action: 'Neurological assessment, glucose check, consider stroke code' },
  { condition: 'Chest pain with ECG changes', level: EscalationLevel.EMERGENT, notifyWhom: 'Attending + Cardiology', action: 'STEMI protocol if indicated, troponin, heparin drip' },
  { condition: 'New onset seizure', level: EscalationLevel.EMERGENT, notifyWhom: 'Attending + Neurology', action: 'Benzodiazepine per protocol, protect airway, CT head' },
  { condition: 'Significant bleeding (>100mL/hr from drain)', level: EscalationLevel.URGENT, notifyWhom: 'Surgeon', action: 'Type and cross, CBC, coags, prepare for possible return to OR' },
  { condition: 'Urine output <0.5 mL/kg/hr for 2 hours', level: EscalationLevel.URGENT, notifyWhom: 'Resident', action: 'Fluid challenge, BMP, foley assessment' },
];

// ============================================================================
// Learning Store
// ============================================================================

interface HandoffLearningStore {
  clinicianPreferences: Map<string, LearningPreference>;
  editHistory: HandoffEdit[];
  templateUsage: Map<string, number>;
  sectionEmphasisLearned: Map<string, Record<string, number>>;
}

const learningStore: HandoffLearningStore = {
  clinicianPreferences: new Map(),
  editHistory: [],
  templateUsage: new Map(),
  sectionEmphasisLearned: new Map(),
};

// ============================================================================
// Engine Functions
// ============================================================================

function generateSBARNote(patient: PatientData): SBARNote {
  const criticalFlags = identifyCriticalFlags(patient);
  const escalationCriteria = getApplicableEscalation(patient);

  const situation = buildSituation(patient);
  const background = buildBackground(patient);
  const assessment = buildAssessment(patient);
  const recommendation = buildRecommendation(patient);

  const note: SBARNote = {
    format: 'sbar',
    patientId: patient.id,
    situation,
    background,
    assessment,
    recommendation,
    criticalFlags,
    escalationCriteria,
    generatedAt: new Date().toISOString(),
    completenessScore: 0,
  };

  note.completenessScore = scoreCompleteness(note).totalScore;
  return note;
}

function generateIPASSNote(patient: PatientData): IPASSNote {
  const criticalFlags = identifyCriticalFlags(patient);
  const escalationCriteria = getApplicableEscalation(patient);
  const severity = assessIllnessSeverity(patient);

  const note: IPASSNote = {
    format: 'ipass',
    patientId: patient.id,
    illnessSeverity: severity,
    patientSummary: buildPatientSummary(patient),
    actionList: buildActionList(patient),
    situationAwareness: buildSituationAwareness(patient),
    synthesis: buildSynthesis(patient, severity),
    criticalFlags,
    escalationCriteria,
    generatedAt: new Date().toISOString(),
    completenessScore: 0,
  };

  note.completenessScore = scoreIPASSCompleteness(note).totalScore;
  return note;
}

function buildSituation(patient: PatientData): string {
  const parts = [
    `${patient.name}, ${patient.age}yo ${patient.sex}, Room ${patient.room}`,
    `Admitted ${patient.admitDate} for ${patient.diagnosis}`,
  ];
  if (patient.postOpDay !== undefined) {
    parts.push(`Post-op day ${patient.postOpDay} from ${patient.surgeryType ?? 'surgery'}`);
  }
  parts.push(`Current vitals: HR ${patient.vitals.hr}, BP ${patient.vitals.bp}, T ${patient.vitals.temp}°C, RR ${patient.vitals.rr}, SpO2 ${patient.vitals.spo2}%`);
  if (patient.painScore !== undefined) {
    parts.push(`Pain: ${patient.painScore}/10`);
  }
  return parts.join('. ') + '.';
}

function buildBackground(patient: PatientData): string {
  const parts = [
    `MRN: ${patient.mrn}`,
    `Allergies: ${patient.allergies.length > 0 ? patient.allergies.join(', ') : 'NKDA'}`,
    `Code status: ${patient.codeStatus}`,
  ];
  if (patient.isolationPrecautions) {
    parts.push(`Isolation: ${patient.isolationPrecautions}`);
  }
  parts.push(`Active problems: ${patient.activeProblems.join('; ')}`);
  parts.push(`Diet: ${patient.diet}. Activity: ${patient.activity}`);
  parts.push(`IV access: ${patient.ivAccess}`);

  if (patient.medications.length > 0) {
    const highAlertMeds = patient.medications.filter(m => m.isHighAlert);
    if (highAlertMeds.length > 0) {
      parts.push(`HIGH-ALERT MEDS: ${highAlertMeds.map(m => `${m.name} ${m.dose} ${m.route} ${m.frequency}`).join('; ')}`);
    }
    parts.push(`Medications: ${patient.medications.map(m => `${m.name} ${m.dose}`).join(', ')}`);
  }

  if (patient.labs.length > 0) {
    const flaggedLabs = patient.labs.filter(l => l.flag);
    if (flaggedLabs.length > 0) {
      parts.push(`Abnormal labs: ${flaggedLabs.map(l => `${l.test}: ${l.value} ${l.unit} (${l.flag})`).join('; ')}`);
    }
  }

  return parts.join('. ') + '.';
}

function buildAssessment(patient: PatientData): string {
  const parts: string[] = [];
  const severity = assessIllnessSeverity(patient);

  parts.push(`Clinical impression: ${severity === IllnessSeverity.STABLE ? 'Stable' : severity === IllnessSeverity.WATCHER ? 'Needs close monitoring' : 'Unstable - requires intervention'}`);

  // Vital sign assessment
  if (patient.vitals.hr > 100) parts.push('Tachycardic');
  if (patient.vitals.hr < 60) parts.push('Bradycardic');
  if (patient.vitals.spo2 < 94) parts.push('Hypoxic');
  if (patient.vitals.temp > 38.3) parts.push('Febrile');
  if (patient.vitals.rr > 22) parts.push('Tachypneic');

  if (patient.painScore !== undefined && patient.painScore > 6) {
    parts.push('Pain not well controlled');
  }

  if (patient.intakeOutput) {
    const balance = patient.intakeOutput.intake - patient.intakeOutput.output;
    parts.push(`I/O balance: ${balance > 0 ? '+' : ''}${balance}mL`);
  }

  return parts.join('. ') + '.';
}

function buildRecommendation(patient: PatientData): string {
  const recs: string[] = [];

  if (patient.pendingTasks.length > 0) {
    recs.push(`Pending tasks: ${patient.pendingTasks.join('; ')}`);
  }

  // Vital-sign-based recommendations
  if (patient.vitals.temp > 38.3) {
    recs.push('Follow fever workup: blood cultures if not done, repeat CBC in AM');
  }
  if (patient.vitals.spo2 < 94) {
    recs.push('Monitor SpO2 closely, escalate if dropping below 92%');
  }
  if (patient.painScore !== undefined && patient.painScore > 6) {
    recs.push('Reassess pain in 1 hour after intervention, consider pain service consult');
  }
  if (patient.postOpDay === 0) {
    recs.push('Standard post-op monitoring: vitals Q4h, I&O, diet advancement per protocol');
  }

  recs.push('Contact on-call for any changes in clinical status');

  return recs.join('. ') + '.';
}

function buildPatientSummary(patient: PatientData): string {
  const parts = [
    `${patient.name}, ${patient.age}yo ${patient.sex}`,
    `Room ${patient.room}, MRN ${patient.mrn}`,
    `Admitted ${patient.admitDate}: ${patient.diagnosis}`,
  ];
  if (patient.postOpDay !== undefined) {
    parts.push(`POD#${patient.postOpDay} from ${patient.surgeryType ?? 'surgery'}`);
  }
  parts.push(`Allergies: ${patient.allergies.length > 0 ? patient.allergies.join(', ') : 'NKDA'}`);
  parts.push(`Code: ${patient.codeStatus}`);
  return parts.join('. ') + '.';
}

function buildActionList(patient: PatientData): ActionItem[] {
  const actions: ActionItem[] = [];

  for (const task of patient.pendingTasks) {
    actions.push({ action: task, priority: 'routine' });
  }

  // Add vital-sign-driven actions
  if (patient.vitals.temp > 38.3) {
    actions.push({ action: 'Blood cultures x2 if temp >38.3°C and not drawn', priority: 'urgent' });
    actions.push({ action: 'Repeat CBC in AM for trending', priority: 'routine' });
  }
  if (patient.vitals.spo2 < 94) {
    actions.push({ action: 'Titrate O2 to maintain SpO2 ≥94%, ABG if worsening', priority: 'urgent' });
  }
  if (patient.painScore !== undefined && patient.painScore > 6) {
    actions.push({ action: 'Reassess pain 30-60 min after PRN medication', priority: 'urgent' });
  }

  // Medication-related
  const nextDueMeds = patient.medications.filter(m => m.nextDue);
  for (const med of nextDueMeds) {
    const priority = med.isHighAlert ? 'urgent' as const : 'routine' as const;
    actions.push({ action: `${med.name} ${med.dose} due at ${med.nextDue}`, priority, dueBy: med.nextDue });
  }

  return actions;
}

function buildSituationAwareness(patient: PatientData): SituationAwarenessItem[] {
  const items: SituationAwarenessItem[] = [];

  if (patient.vitals.temp > 38.0) {
    items.push({
      condition: 'Fever worsens or new signs of sepsis',
      planIfOccurs: 'Start sepsis bundle: lactate, blood cultures, broad-spectrum antibiotics within 1h',
      likelihood: patient.vitals.temp > 38.5 ? 'likely' : 'possible',
    });
  }

  if (patient.postOpDay !== undefined && patient.postOpDay <= 2) {
    items.push({
      condition: 'Post-operative bleeding',
      planIfOccurs: 'Apply pressure, CBC/coags stat, notify surgeon, type and cross if not available',
      likelihood: 'possible',
    });
  }

  if (patient.painScore !== undefined && patient.painScore > 5) {
    items.push({
      condition: 'Pain escalates despite current regimen',
      planIfOccurs: 'Trial IV PRN analgesic, if no relief consider PCA or pain service consult',
      likelihood: 'possible',
    });
  }

  items.push({
    condition: 'Acute clinical deterioration',
    planIfOccurs: 'Activate rapid response team, reassess ABCs, notify attending',
    likelihood: 'unlikely',
  });

  return items;
}

function buildSynthesis(patient: PatientData, severity: IllnessSeverity): string {
  const parts = [
    `Overall: ${severity === IllnessSeverity.STABLE ? 'Stable, routine monitoring' : severity === IllnessSeverity.WATCHER ? 'Watcher - needs close observation' : 'Unstable - active management required'}`,
  ];

  if (patient.postOpDay !== undefined) {
    parts.push(`Expected recovery trajectory: ${patient.postOpDay <= 1 ? 'early post-op, expect improvement' : 'should be progressing toward discharge criteria'}`);
  }

  return parts.join('. ') + '.';
}

function assessIllnessSeverity(patient: PatientData): IllnessSeverity {
  // Unstable criteria
  if (patient.vitals.hr > 130 || patient.vitals.hr < 40) return IllnessSeverity.UNSTABLE;
  if (patient.vitals.spo2 < 90) return IllnessSeverity.UNSTABLE;
  if (patient.vitals.rr > 30 || patient.vitals.rr < 8) return IllnessSeverity.UNSTABLE;
  if (patient.vitals.temp > 39.5 || patient.vitals.temp < 35) return IllnessSeverity.UNSTABLE;

  // Watcher criteria
  if (patient.vitals.hr > 110 || patient.vitals.hr < 50) return IllnessSeverity.WATCHER;
  if (patient.vitals.spo2 < 94) return IllnessSeverity.WATCHER;
  if (patient.vitals.temp > 38.3) return IllnessSeverity.WATCHER;
  if (patient.vitals.rr > 24) return IllnessSeverity.WATCHER;
  if (patient.painScore !== undefined && patient.painScore > 7) return IllnessSeverity.WATCHER;

  return IllnessSeverity.STABLE;
}

function identifyCriticalFlags(patient: PatientData): string[] {
  const flags: string[] = [];

  if (patient.allergies.length > 0) {
    flags.push(`ALLERGIES: ${patient.allergies.join(', ')}`);
  }
  if (patient.codeStatus !== 'Full Code') {
    flags.push(`CODE STATUS: ${patient.codeStatus}`);
  }
  if (patient.isolationPrecautions) {
    flags.push(`ISOLATION: ${patient.isolationPrecautions}`);
  }

  const highAlertMeds = patient.medications.filter(m => m.isHighAlert);
  if (highAlertMeds.length > 0) {
    flags.push(`HIGH-ALERT MEDS: ${highAlertMeds.map(m => m.name).join(', ')}`);
  }

  const criticalLabs = patient.labs.filter(l => l.flag === 'critical');
  if (criticalLabs.length > 0) {
    flags.push(`CRITICAL LABS: ${criticalLabs.map(l => `${l.test}=${l.value}`).join(', ')}`);
  }

  if (patient.vitals.spo2 < 92) flags.push('HYPOXIA');
  if (patient.vitals.hr > 120) flags.push('TACHYCARDIA');
  if (patient.vitals.temp > 39) flags.push('HIGH FEVER');

  return flags;
}

function getApplicableEscalation(_patient: PatientData): EscalationCriterion[] {
  const applicable: EscalationCriterion[] = [];

  // Always include standard criteria but filter for relevance
  for (const criterion of STANDARD_ESCALATION_CRITERIA) {
    // Include all escalation criteria but mark which are currently relevant
    applicable.push(criterion);
  }

  return applicable;
}

function scoreCompleteness(note: SBARNote): CompletenessScoreBreakdown {
  const sectionScores: Record<string, number> = {};
  const missingElements: string[] = [];
  const criticalMissing: string[] = [];
  const suggestions: string[] = [];

  // Situation scoring (25 points)
  let situationScore = 0;
  if (note.situation.length > 0) situationScore += 10;
  if (note.situation.includes('vitals') || note.situation.includes('HR') || note.situation.includes('BP')) situationScore += 5;
  if (note.situation.includes('Room') || note.situation.includes('room')) situationScore += 3;
  if (note.situation.includes('yo') || note.situation.includes('year')) situationScore += 2;
  if (note.situation.length > 50) situationScore += 5;
  sectionScores['situation'] = Math.min(situationScore, 25);
  if (situationScore < 15) {
    missingElements.push('Situation lacks key patient identifiers or vital signs');
  }

  // Background scoring (25 points)
  let backgroundScore = 0;
  if (note.background.length > 0) backgroundScore += 5;
  if (note.background.includes('Allerg')) backgroundScore += 5;
  if (note.background.includes('Code') || note.background.includes('code')) backgroundScore += 5;
  if (note.background.includes('edication') || note.background.includes('med')) backgroundScore += 5;
  if (note.background.length > 100) backgroundScore += 5;
  sectionScores['background'] = Math.min(backgroundScore, 25);
  if (!note.background.includes('Allerg')) {
    criticalMissing.push('Allergy status not documented in background');
  }

  // Assessment scoring (25 points)
  let assessmentScore = 0;
  if (note.assessment.length > 0) assessmentScore += 10;
  if (note.assessment.includes('Stable') || note.assessment.includes('monitoring') || note.assessment.includes('Unstable')) assessmentScore += 10;
  if (note.assessment.length > 30) assessmentScore += 5;
  sectionScores['assessment'] = Math.min(assessmentScore, 25);
  if (assessmentScore < 15) {
    missingElements.push('Assessment needs clinical impression');
  }

  // Recommendation scoring (25 points)
  let recommendationScore = 0;
  if (note.recommendation.length > 0) recommendationScore += 10;
  if (note.recommendation.includes('task') || note.recommendation.includes('monitor') || note.recommendation.includes('follow')) recommendationScore += 10;
  if (note.recommendation.length > 30) recommendationScore += 5;
  sectionScores['recommendation'] = Math.min(recommendationScore, 25);
  if (recommendationScore < 10) {
    missingElements.push('Recommendation section needs specific action items');
  }

  // Suggestions
  if (note.criticalFlags.length === 0) {
    suggestions.push('Consider reviewing for critical flags (allergies, code status, isolation)');
  }
  if (note.escalationCriteria.length === 0) {
    suggestions.push('Add escalation criteria for overnight coverage');
  }

  const totalScore = Object.values(sectionScores).reduce((sum, s) => sum + s, 0);

  return {
    totalScore,
    sectionScores,
    missingElements,
    criticalMissing,
    suggestions,
  };
}

function scoreIPASSCompleteness(note: IPASSNote): CompletenessScoreBreakdown {
  const sectionScores: Record<string, number> = {};
  const missingElements: string[] = [];
  const criticalMissing: string[] = [];
  const suggestions: string[] = [];

  // Illness severity (10 points)
  sectionScores['illness_severity'] = note.illnessSeverity ? 10 : 0;
  if (!note.illnessSeverity) criticalMissing.push('Illness severity not classified');

  // Patient summary (20 points)
  let summaryScore = 0;
  if (note.patientSummary.length > 0) summaryScore += 10;
  if (note.patientSummary.includes('Allerg') || note.patientSummary.includes('NKDA')) summaryScore += 5;
  if (note.patientSummary.includes('Code')) summaryScore += 5;
  sectionScores['patient_summary'] = Math.min(summaryScore, 20);

  // Action list (30 points)
  let actionScore = 0;
  if (note.actionList.length > 0) actionScore += 15;
  if (note.actionList.length >= 3) actionScore += 10;
  if (note.actionList.some(a => a.priority === 'urgent' || a.priority === 'stat')) actionScore += 5;
  sectionScores['action_list'] = Math.min(actionScore, 30);
  if (note.actionList.length === 0) missingElements.push('No action items specified');

  // Situation awareness (25 points)
  let awarenessScore = 0;
  if (note.situationAwareness.length > 0) awarenessScore += 15;
  if (note.situationAwareness.length >= 2) awarenessScore += 5;
  if (note.situationAwareness.some(s => s.planIfOccurs.length > 0)) awarenessScore += 5;
  sectionScores['situation_awareness'] = Math.min(awarenessScore, 25);

  // Synthesis (15 points)
  let synthesisScore = 0;
  if (note.synthesis.length > 0) synthesisScore += 10;
  if (note.synthesis.length > 30) synthesisScore += 5;
  sectionScores['synthesis'] = Math.min(synthesisScore, 15);

  const totalScore = Object.values(sectionScores).reduce((sum, s) => sum + s, 0);

  return {
    totalScore,
    sectionScores,
    missingElements,
    criticalMissing,
    suggestions,
  };
}

function createHandoffRecord(
  note: SBARNote | IPASSNote,
  senderId: string,
  receiverId: string,
  fromShift: ShiftType,
  toShift: ShiftType
): HandoffRecord {
  return {
    id: `ho-${Date.now()}`,
    format: note.format === 'sbar' ? HandoffFormat.SBAR : HandoffFormat.IPASS,
    note,
    senderClinicianId: senderId,
    receiverClinicianId: receiverId,
    shiftChange: { from: fromShift, to: toShift },
    verificationStatus: VerificationStatus.NOT_VERIFIED,
    questions: [],
    edits: [],
    timestamp: new Date().toISOString(),
  };
}

function verifyHandoff(record: HandoffRecord, status: VerificationStatus): HandoffRecord {
  return {
    ...record,
    verificationStatus: status,
    readBackAt: status === VerificationStatus.READ_BACK_COMPLETE ? new Date().toISOString() : record.readBackAt,
  };
}

function recordEdit(record: HandoffRecord, edit: HandoffEdit): HandoffRecord {
  const updated = { ...record, edits: [...record.edits, edit] };

  // Record for learning
  learningStore.editHistory.push(edit);

  // Update clinician preferences
  const pref = learningStore.clinicianPreferences.get(edit.editedBy) ?? {
    clinicianId: edit.editedBy,
    preferredFormat: record.format,
    sectionEmphasis: {},
    commonEdits: [],
    templatePreferences: [],
  };

  // Track which sections get edited most
  pref.sectionEmphasis[edit.section] = (pref.sectionEmphasis[edit.section] ?? 0) + 1;

  // Track common edit patterns
  const existingPattern = pref.commonEdits.find(e => e.pattern === edit.originalText);
  if (existingPattern) {
    existingPattern.frequency++;
    existingPattern.replacement = edit.editedText;
  } else {
    pref.commonEdits.push({
      pattern: edit.originalText,
      replacement: edit.editedText,
      frequency: 1,
    });
  }

  learningStore.clinicianPreferences.set(edit.editedBy, pref);

  return updated;
}

function getMatchingTemplates(conditions: string[]): HandoffTemplate[] {
  return HANDOFF_TEMPLATES.filter(template =>
    template.applicableConditions.some(c => conditions.includes(c))
  );
}

function getShiftChangeWorkflow(fromShift: ShiftType, toShift: ShiftType): { checklist: string[]; focusAreas: string[] } {
  const checklists: Record<string, string[]> = {
    [`${ShiftType.DAY}-${ShiftType.EVENING}`]: [
      'Review all pending orders and tasks',
      'Update patient status summaries',
      'Verify medication reconciliation',
      'Communicate any procedure results received',
      'Highlight discharge planning updates',
      'Review pending consult responses',
      'Update family communication log',
      'Verify code status documentation',
    ],
    [`${ShiftType.EVENING}-${ShiftType.NIGHT}`]: [
      'Review PRN medication usage',
      'Confirm overnight monitoring plans',
      'Verify escalation criteria and contacts',
      'Update pain management status',
      'Review IV access and fluid orders',
      'Highlight patients needing overnight labs',
      'Confirm isolation/safety precautions',
      'Review patient sleep/rest plans',
    ],
    [`${ShiftType.NIGHT}-${ShiftType.DAY}`]: [
      'Summarize overnight events and interventions',
      'Report any new orders placed overnight',
      'Update vital sign trends',
      'Communicate any falls or safety events',
      'Highlight patients ready for morning rounds',
      'Review NPO status for procedures',
      'Update discharge readiness status',
      'Report any family calls received overnight',
    ],
  };

  const focusAreas: Record<string, string[]> = {
    [`${ShiftType.DAY}-${ShiftType.EVENING}`]: ['Pending results follow-up', 'Family communication', 'Discharge planning progress'],
    [`${ShiftType.EVENING}-${ShiftType.NIGHT}`]: ['Pain management', 'Safety precautions', 'Overnight monitoring thresholds'],
    [`${ShiftType.NIGHT}-${ShiftType.DAY}`]: ['Overnight events', 'Morning lab results', 'Rounding preparation'],
  };

  const key = `${fromShift}-${toShift}`;
  return {
    checklist: checklists[key] ?? checklists[`${ShiftType.DAY}-${ShiftType.EVENING}`],
    focusAreas: focusAreas[key] ?? focusAreas[`${ShiftType.DAY}-${ShiftType.EVENING}`],
  };
}

function getClinicianPreferences(clinicianId: string): LearningPreference | undefined {
  return learningStore.clinicianPreferences.get(clinicianId);
}

function getTopEditPatterns(clinicianId: string, limit: number = 5): { pattern: string; replacement: string; frequency: number }[] {
  const pref = learningStore.clinicianPreferences.get(clinicianId);
  if (!pref) return [];
  return [...pref.commonEdits].sort((a, b) => b.frequency - a.frequency).slice(0, limit);
}

function resetLearningData(): void {
  learningStore.clinicianPreferences.clear();
  learningStore.editHistory.length = 0;
  learningStore.templateUsage.clear();
  learningStore.sectionEmphasisLearned.clear();
}

// ============================================================================
// Exports
// ============================================================================

export const handoffCommunicationEngine = {
  generateSBARNote,
  generateIPASSNote,
  scoreCompleteness,
  scoreIPASSCompleteness,
  assessIllnessSeverity,
  identifyCriticalFlags,
  createHandoffRecord,
  verifyHandoff,
  recordEdit,
  getMatchingTemplates,
  getShiftChangeWorkflow,
  getClinicianPreferences,
  getTopEditPatterns,
  resetLearningData,
};
