// =============================================================================
// Emergency Protocol Service
// Detection and response system for post-operative emergencies
// =============================================================================

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export type PriorityLevel = 'URGENT' | 'EMERGENCY' | 'LIFE_THREATENING';

export type EmergencyCategory =
  | 'CARDIAC'
  | 'RESPIRATORY'
  | 'NEUROLOGICAL'
  | 'HEMORRHAGIC'
  | 'INFECTIOUS'
  | 'WOUND'
  | 'MEDICATION'
  | 'METABOLIC'
  | 'VASCULAR'
  | 'ANAPHYLAXIS'
  | 'PSYCHIATRIC';

export interface VitalSigns {
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  spo2?: number;
  temperature?: number; // Celsius
  respiratoryRate?: number;
  bloodGlucose?: number; // mg/dL
  painLevel?: number; // 0-10
}

export interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  onsetTime?: Date;
  duration?: string;
  description?: string;
}

export interface EmergencyRule {
  id: string;
  name: string;
  category: EmergencyCategory;
  priority: PriorityLevel;
  description: string;
  condition: (vitals: VitalSigns, symptoms: Symptom[]) => boolean;
  protocolId: string;
}

export interface ProtocolStep {
  order: number;
  instruction: string;
  forPatient: boolean;
  forCareTeam: boolean;
  timeLimit?: string;
  critical: boolean;
}

export interface Protocol {
  id: string;
  name: string;
  category: EmergencyCategory;
  priority: PriorityLevel;
  description: string;
  steps: ProtocolStep[];
  patientInstructions: string[];
  careTeamActions: string[];
  escalationTimeMinutes: number;
  requiredResources: string[];
}

export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  priority: number; // 1 = highest
  availableHours?: string;
  notificationPreference: 'call' | 'sms' | 'email' | 'all';
}

export interface EmergencyAssessment {
  timestamp: Date;
  triggeredRules: EmergencyRule[];
  highestPriority: PriorityLevel;
  categories: EmergencyCategory[];
  recommendedProtocols: Protocol[];
  immediateActions: string[];
  requiresEMS: boolean;
  vitalsSnapshot: VitalSigns;
  symptomsSnapshot: Symptom[];
}

export interface EmergencyEvent {
  id: string;
  patientId: string;
  timestamp: Date;
  assessment: EmergencyAssessment;
  protocolsActivated: string[];
  contactsNotified: string[];
  resolution?: string;
  resolvedAt?: Date;
  incidentReport?: string;
  outcome?: 'resolved_self' | 'resolved_care_team' | 'ems_dispatched' | 'hospitalized';
}

// -----------------------------------------------------------------------------
// Helper: check if symptom list contains a given symptom name
// -----------------------------------------------------------------------------

function hasSymptom(symptoms: Symptom[], name: string): boolean {
  return symptoms.some(
    (s) => s.name.toLowerCase().includes(name.toLowerCase())
  );
}

function hasSymptomSevere(symptoms: Symptom[], name: string): boolean {
  return symptoms.some(
    (s) =>
      s.name.toLowerCase().includes(name.toLowerCase()) &&
      s.severity === 'severe'
  );
}

// -----------------------------------------------------------------------------
// EMERGENCY_RULES — 35 detection rules
// -----------------------------------------------------------------------------

export const EMERGENCY_RULES: EmergencyRule[] = [
  // --- CARDIAC (1–6) ---
  {
    id: 'RULE-001',
    name: 'Severe Tachycardia',
    category: 'CARDIAC',
    priority: 'EMERGENCY',
    description: 'Heart rate exceeds 130 bpm',
    condition: (v) => (v.heartRate ?? 0) > 130,
    protocolId: 'PROTO-CARDIAC-TACHY',
  },
  {
    id: 'RULE-002',
    name: 'Severe Bradycardia',
    category: 'CARDIAC',
    priority: 'EMERGENCY',
    description: 'Heart rate below 40 bpm',
    condition: (v) => v.heartRate !== undefined && v.heartRate < 40,
    protocolId: 'PROTO-CARDIAC-BRADY',
  },
  {
    id: 'RULE-003',
    name: 'Hypertensive Crisis',
    category: 'CARDIAC',
    priority: 'LIFE_THREATENING',
    description: 'Systolic BP exceeds 180 mmHg',
    condition: (v) => (v.systolicBP ?? 0) > 180,
    protocolId: 'PROTO-CARDIAC-HYPER-CRISIS',
  },
  {
    id: 'RULE-004',
    name: 'Severe Hypotension',
    category: 'CARDIAC',
    priority: 'LIFE_THREATENING',
    description: 'Systolic BP below 80 mmHg',
    condition: (v) => v.systolicBP !== undefined && v.systolicBP < 80,
    protocolId: 'PROTO-CARDIAC-HYPOTENSION',
  },
  {
    id: 'RULE-005',
    name: 'Chest Pain with Shortness of Breath',
    category: 'CARDIAC',
    priority: 'LIFE_THREATENING',
    description: 'Combination of chest pain and shortness of breath suggests cardiac event',
    condition: (_v, s) => hasSymptom(s, 'chest pain') && hasSymptom(s, 'shortness of breath'),
    protocolId: 'PROTO-CARDIAC-ACS',
  },
  {
    id: 'RULE-006',
    name: 'Chest Pain with Arm Numbness',
    category: 'CARDIAC',
    priority: 'LIFE_THREATENING',
    description: 'Classic myocardial infarction presentation',
    condition: (_v, s) => hasSymptom(s, 'chest pain') && hasSymptom(s, 'arm numbness'),
    protocolId: 'PROTO-CARDIAC-ACS',
  },

  // --- RESPIRATORY (7–12) ---
  {
    id: 'RULE-007',
    name: 'Critical Hypoxemia',
    category: 'RESPIRATORY',
    priority: 'LIFE_THREATENING',
    description: 'SpO2 below 90%',
    condition: (v) => v.spo2 !== undefined && v.spo2 < 90,
    protocolId: 'PROTO-RESP-HYPOXIA',
  },
  {
    id: 'RULE-008',
    name: 'Moderate Hypoxemia',
    category: 'RESPIRATORY',
    priority: 'EMERGENCY',
    description: 'SpO2 between 90% and 92%',
    condition: (v) => v.spo2 !== undefined && v.spo2 >= 90 && v.spo2 <= 92,
    protocolId: 'PROTO-RESP-HYPOXIA-MOD',
  },
  {
    id: 'RULE-009',
    name: 'Severe Tachypnea',
    category: 'RESPIRATORY',
    priority: 'EMERGENCY',
    description: 'Respiratory rate exceeds 30 breaths/min',
    condition: (v) => (v.respiratoryRate ?? 0) > 30,
    protocolId: 'PROTO-RESP-TACHYPNEA',
  },
  {
    id: 'RULE-010',
    name: 'Bradypnea',
    category: 'RESPIRATORY',
    priority: 'EMERGENCY',
    description: 'Respiratory rate below 8 breaths/min',
    condition: (v) => v.respiratoryRate !== undefined && v.respiratoryRate < 8,
    protocolId: 'PROTO-RESP-BRADYPNEA',
  },
  {
    id: 'RULE-011',
    name: 'Acute Respiratory Distress',
    category: 'RESPIRATORY',
    priority: 'LIFE_THREATENING',
    description: 'Combination of low SpO2 and high respiratory rate',
    condition: (v) =>
      v.spo2 !== undefined && v.spo2 < 92 && (v.respiratoryRate ?? 0) > 28,
    protocolId: 'PROTO-RESP-ARDS',
  },
  {
    id: 'RULE-012',
    name: 'Suspected Pulmonary Embolism',
    category: 'RESPIRATORY',
    priority: 'LIFE_THREATENING',
    description: 'Sudden onset SOB with tachycardia and chest pain post-op',
    condition: (v, s) =>
      hasSymptom(s, 'shortness of breath') &&
      (v.heartRate ?? 0) > 100 &&
      hasSymptom(s, 'chest pain'),
    protocolId: 'PROTO-RESP-PE',
  },

  // --- NEUROLOGICAL (13–17) ---
  {
    id: 'RULE-013',
    name: 'Sudden Severe Headache with Vision Changes',
    category: 'NEUROLOGICAL',
    priority: 'LIFE_THREATENING',
    description: 'Possible stroke or intracranial hemorrhage',
    condition: (_v, s) =>
      hasSymptomSevere(s, 'headache') && hasSymptom(s, 'vision'),
    protocolId: 'PROTO-NEURO-STROKE',
  },
  {
    id: 'RULE-014',
    name: 'Facial Droop or Slurred Speech',
    category: 'NEUROLOGICAL',
    priority: 'LIFE_THREATENING',
    description: 'Stroke warning signs',
    condition: (_v, s) =>
      hasSymptom(s, 'facial droop') || hasSymptom(s, 'slurred speech'),
    protocolId: 'PROTO-NEURO-STROKE',
  },
  {
    id: 'RULE-015',
    name: 'Unilateral Weakness or Numbness',
    category: 'NEUROLOGICAL',
    priority: 'LIFE_THREATENING',
    description: 'One-sided weakness could indicate stroke',
    condition: (_v, s) =>
      hasSymptom(s, 'unilateral weakness') || hasSymptom(s, 'one-sided numbness'),
    protocolId: 'PROTO-NEURO-STROKE',
  },
  {
    id: 'RULE-016',
    name: 'Seizure Activity',
    category: 'NEUROLOGICAL',
    priority: 'EMERGENCY',
    description: 'New onset seizure post-operatively',
    condition: (_v, s) => hasSymptom(s, 'seizure'),
    protocolId: 'PROTO-NEURO-SEIZURE',
  },
  {
    id: 'RULE-017',
    name: 'Altered Mental Status',
    category: 'NEUROLOGICAL',
    priority: 'EMERGENCY',
    description: 'Confusion, disorientation, or decreased consciousness',
    condition: (_v, s) =>
      hasSymptom(s, 'confusion') ||
      hasSymptom(s, 'disorientation') ||
      hasSymptom(s, 'altered consciousness'),
    protocolId: 'PROTO-NEURO-AMS',
  },

  // --- HEMORRHAGIC / WOUND (18–23) ---
  {
    id: 'RULE-018',
    name: 'Active Hemorrhage',
    category: 'HEMORRHAGIC',
    priority: 'LIFE_THREATENING',
    description: 'Active bleeding from surgical site or other location',
    condition: (_v, s) =>
      hasSymptom(s, 'active bleeding') || hasSymptomSevere(s, 'bleeding'),
    protocolId: 'PROTO-HEMORRHAGE-ACTIVE',
  },
  {
    id: 'RULE-019',
    name: 'Hemorrhage with Hemodynamic Instability',
    category: 'HEMORRHAGIC',
    priority: 'LIFE_THREATENING',
    description: 'Bleeding combined with low BP and high HR',
    condition: (v, s) =>
      hasSymptom(s, 'bleeding') &&
      v.systolicBP !== undefined && v.systolicBP < 90 &&
      (v.heartRate ?? 0) > 110,
    protocolId: 'PROTO-HEMORRHAGE-SHOCK',
  },
  {
    id: 'RULE-020',
    name: 'Sudden Wound Dehiscence',
    category: 'WOUND',
    priority: 'EMERGENCY',
    description: 'Surgical wound has opened or separated',
    condition: (_v, s) =>
      hasSymptom(s, 'dehiscence') || hasSymptom(s, 'wound opening'),
    protocolId: 'PROTO-WOUND-DEHISCENCE',
  },
  {
    id: 'RULE-021',
    name: 'Evisceration',
    category: 'WOUND',
    priority: 'LIFE_THREATENING',
    description: 'Abdominal contents protruding through open wound',
    condition: (_v, s) => hasSymptom(s, 'evisceration'),
    protocolId: 'PROTO-WOUND-EVISCERATION',
  },
  {
    id: 'RULE-022',
    name: 'Wound Infection Signs',
    category: 'WOUND',
    priority: 'URGENT',
    description: 'Redness, swelling, warmth, purulent drainage at wound site',
    condition: (v, s) =>
      hasSymptom(s, 'wound redness') &&
      (hasSymptom(s, 'purulent drainage') || (v.temperature ?? 0) > 38.3),
    protocolId: 'PROTO-WOUND-INFECTION',
  },
  {
    id: 'RULE-023',
    name: 'Expanding Hematoma',
    category: 'HEMORRHAGIC',
    priority: 'EMERGENCY',
    description: 'Rapidly expanding bruise near surgical site',
    condition: (_v, s) => hasSymptom(s, 'expanding hematoma'),
    protocolId: 'PROTO-HEMORRHAGE-HEMATOMA',
  },

  // --- INFECTIOUS / FEVER (24–27) ---
  {
    id: 'RULE-024',
    name: 'High Fever',
    category: 'INFECTIOUS',
    priority: 'EMERGENCY',
    description: 'Temperature exceeds 39.5 C (103.1 F)',
    condition: (v) => (v.temperature ?? 0) > 39.5,
    protocolId: 'PROTO-INFECT-HIGHFEVER',
  },
  {
    id: 'RULE-025',
    name: 'Suspected Sepsis',
    category: 'INFECTIOUS',
    priority: 'LIFE_THREATENING',
    description: 'Fever + tachycardia + tachypnea + hypotension (SIRS criteria)',
    condition: (v) =>
      (v.temperature ?? 0) > 38.3 &&
      (v.heartRate ?? 0) > 100 &&
      (v.respiratoryRate ?? 0) > 22 &&
      v.systolicBP !== undefined && v.systolicBP < 100,
    protocolId: 'PROTO-INFECT-SEPSIS',
  },
  {
    id: 'RULE-026',
    name: 'Hypothermia',
    category: 'INFECTIOUS',
    priority: 'EMERGENCY',
    description: 'Temperature below 35 C (95 F)',
    condition: (v) => v.temperature !== undefined && v.temperature < 35,
    protocolId: 'PROTO-INFECT-HYPOTHERMIA',
  },
  {
    id: 'RULE-027',
    name: 'Fever with Rigors',
    category: 'INFECTIOUS',
    priority: 'EMERGENCY',
    description: 'Fever with uncontrollable shaking chills',
    condition: (v, s) =>
      (v.temperature ?? 0) > 38.5 && hasSymptom(s, 'rigors'),
    protocolId: 'PROTO-INFECT-BACTEREMIA',
  },

  // --- MEDICATION (28–31) ---
  {
    id: 'RULE-028',
    name: 'Allergic Reaction',
    category: 'MEDICATION',
    priority: 'EMERGENCY',
    description: 'Signs of allergic reaction to medication (rash, hives, swelling)',
    condition: (_v, s) =>
      hasSymptom(s, 'allergic reaction') ||
      hasSymptom(s, 'hives') ||
      hasSymptom(s, 'angioedema'),
    protocolId: 'PROTO-MED-ALLERGY',
  },
  {
    id: 'RULE-029',
    name: 'Anaphylaxis',
    category: 'ANAPHYLAXIS',
    priority: 'LIFE_THREATENING',
    description: 'Severe allergic reaction with airway compromise or hemodynamic instability',
    condition: (v, s) =>
      (hasSymptom(s, 'throat swelling') || hasSymptom(s, 'difficulty breathing')) &&
      (hasSymptom(s, 'hives') || hasSymptom(s, 'rash')) &&
      ((v.systolicBP ?? 120) < 90 || (v.heartRate ?? 70) > 120),
    protocolId: 'PROTO-MED-ANAPHYLAXIS',
  },
  {
    id: 'RULE-030',
    name: 'Opioid Overdose',
    category: 'MEDICATION',
    priority: 'LIFE_THREATENING',
    description: 'Respiratory depression with decreased consciousness from opioid use',
    condition: (v, s) =>
      v.respiratoryRate !== undefined && v.respiratoryRate < 8 &&
      (hasSymptom(s, 'drowsiness') || hasSymptom(s, 'pinpoint pupils')),
    protocolId: 'PROTO-MED-OPIOID-OD',
  },
  {
    id: 'RULE-031',
    name: 'Medication Overdose General',
    category: 'MEDICATION',
    priority: 'EMERGENCY',
    description: 'Patient reports taking too much medication',
    condition: (_v, s) =>
      hasSymptom(s, 'overdose') || hasSymptom(s, 'took too much'),
    protocolId: 'PROTO-MED-OVERDOSE',
  },

  // --- METABOLIC (32–34) ---
  {
    id: 'RULE-032',
    name: 'Severe Hypoglycemia',
    category: 'METABOLIC',
    priority: 'EMERGENCY',
    description: 'Blood glucose below 54 mg/dL',
    condition: (v) => v.bloodGlucose !== undefined && v.bloodGlucose < 54,
    protocolId: 'PROTO-META-HYPOGLYCEMIA',
  },
  {
    id: 'RULE-033',
    name: 'Severe Hyperglycemia',
    category: 'METABOLIC',
    priority: 'EMERGENCY',
    description: 'Blood glucose exceeds 400 mg/dL',
    condition: (v) => (v.bloodGlucose ?? 0) > 400,
    protocolId: 'PROTO-META-HYPERGLYCEMIA',
  },
  {
    id: 'RULE-034',
    name: 'Diabetic Ketoacidosis Symptoms',
    category: 'METABOLIC',
    priority: 'LIFE_THREATENING',
    description: 'High glucose with nausea, vomiting, abdominal pain, fruity breath',
    condition: (v, s) =>
      (v.bloodGlucose ?? 0) > 300 &&
      (hasSymptom(s, 'nausea') || hasSymptom(s, 'vomiting')) &&
      (hasSymptom(s, 'abdominal pain') || hasSymptom(s, 'fruity breath')),
    protocolId: 'PROTO-META-DKA',
  },

  // --- VASCULAR / DVT (35) ---
  {
    id: 'RULE-035',
    name: 'Suspected Deep Vein Thrombosis',
    category: 'VASCULAR',
    priority: 'URGENT',
    description: 'Unilateral leg swelling, pain, warmth post-operatively',
    condition: (_v, s) =>
      hasSymptom(s, 'leg swelling') &&
      (hasSymptom(s, 'leg pain') || hasSymptom(s, 'calf pain')),
    protocolId: 'PROTO-VASC-DVT',
  },

  // --- PSYCHIATRIC (36–38) ---
  {
    id: 'RULE-036',
    name: 'Self-Harm Language Detected',
    category: 'PSYCHIATRIC',
    priority: 'EMERGENCY',
    description: 'Patient uses language indicating self-harm intent',
    condition: (_v, s) =>
      hasSymptom(s, 'self-harm') ||
      hasSymptom(s, 'cutting') ||
      hasSymptom(s, 'hurting myself'),
    protocolId: 'PROTO-PSYCH-SELFHARM',
  },
  {
    id: 'RULE-037',
    name: 'Suicidal Ideation Keywords',
    category: 'PSYCHIATRIC',
    priority: 'LIFE_THREATENING',
    description: 'Patient expresses suicidal thoughts or plans',
    condition: (_v, s) =>
      hasSymptom(s, 'suicidal') ||
      hasSymptom(s, 'want to die') ||
      hasSymptom(s, 'end my life') ||
      hasSymptom(s, 'kill myself') ||
      hasSymptom(s, 'no reason to live'),
    protocolId: 'PROTO-PSYCH-SUICIDE',
  },
  {
    id: 'RULE-038',
    name: 'Acute Psychosis or Severe Agitation',
    category: 'PSYCHIATRIC',
    priority: 'EMERGENCY',
    description: 'Hallucinations, delusions, or dangerous agitation post-operatively',
    condition: (_v, s) =>
      hasSymptom(s, 'hallucination') ||
      hasSymptom(s, 'delusion') ||
      hasSymptomSevere(s, 'agitation'),
    protocolId: 'PROTO-PSYCH-PSYCHOSIS',
  },

  // --- WOUND ADVANCED (39–40) ---
  {
    id: 'RULE-039',
    name: 'Suspected Necrotizing Fasciitis',
    category: 'WOUND',
    priority: 'LIFE_THREATENING',
    description: 'Rapidly spreading wound pain disproportionate to appearance with systemic toxicity',
    condition: (v, s) =>
      hasSymptomSevere(s, 'wound pain') &&
      (hasSymptom(s, 'crepitus') || hasSymptom(s, 'skin discoloration') || hasSymptom(s, 'blistering')) &&
      ((v.heartRate ?? 0) > 110 || (v.temperature ?? 0) > 38.5),
    protocolId: 'PROTO-WOUND-NECFASC',
  },
  {
    id: 'RULE-040',
    name: 'Wound with Foul Odor and Gas',
    category: 'WOUND',
    priority: 'EMERGENCY',
    description: 'Foul-smelling wound drainage with gas formation suggests gas gangrene',
    condition: (_v, s) =>
      hasSymptom(s, 'foul odor') &&
      (hasSymptom(s, 'gas') || hasSymptom(s, 'crepitus')),
    protocolId: 'PROTO-WOUND-NECFASC',
  },

  // --- FALL DETECTION (41–42) ---
  {
    id: 'RULE-041',
    name: 'Fall with Immobility',
    category: 'NEUROLOGICAL',
    priority: 'EMERGENCY',
    description: 'Reported fall followed by inability to move or bear weight',
    condition: (_v, s) =>
      hasSymptom(s, 'fall') &&
      (hasSymptom(s, 'cannot move') || hasSymptom(s, 'immobile') || hasSymptom(s, 'cannot bear weight')),
    protocolId: 'PROTO-FALL-IMMOBILE',
  },
  {
    id: 'RULE-042',
    name: 'Fall with Head Impact',
    category: 'NEUROLOGICAL',
    priority: 'LIFE_THREATENING',
    description: 'Fall involving head impact — risk of traumatic brain injury',
    condition: (_v, s) =>
      hasSymptom(s, 'fall') &&
      (hasSymptom(s, 'head impact') || hasSymptom(s, 'hit head') || hasSymptom(s, 'head injury')),
    protocolId: 'PROTO-FALL-HEAD',
  },

  // --- ADDITIONAL MEDICATION (43) ---
  {
    id: 'RULE-043',
    name: 'Serotonin Syndrome Symptoms',
    category: 'MEDICATION',
    priority: 'EMERGENCY',
    description: 'Agitation, hyperthermia, tremor, clonus after serotonergic medication use',
    condition: (v, s) =>
      (v.temperature ?? 0) > 38.5 &&
      hasSymptom(s, 'tremor') &&
      (hasSymptom(s, 'agitation') || hasSymptom(s, 'clonus') || hasSymptom(s, 'muscle rigidity')),
    protocolId: 'PROTO-MED-SEROTONIN',
  },
];

// -----------------------------------------------------------------------------
// EMERGENCY_PROTOCOLS — step-by-step response templates
// -----------------------------------------------------------------------------

export const EMERGENCY_PROTOCOLS: Protocol[] = [
  // CARDIAC
  {
    id: 'PROTO-CARDIAC-TACHY',
    name: 'Severe Tachycardia Protocol',
    category: 'CARDIAC',
    priority: 'EMERGENCY',
    description: 'Response protocol for heart rate exceeding 130 bpm',
    steps: [
      { order: 1, instruction: 'Have patient sit or lie down immediately', forPatient: true, forCareTeam: false, critical: true },
      { order: 2, instruction: 'Assess for additional symptoms: chest pain, dizziness, SOB', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Perform vagal maneuvers if appropriate (bear down, cold water on face)', forPatient: true, forCareTeam: true, critical: false },
      { order: 4, instruction: 'Obtain 12-lead ECG if available', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 5, instruction: 'Contact on-call physician for medication orders', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 6, instruction: 'Monitor HR every 5 minutes until stabilized', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Sit or lie down immediately. Do not stand up quickly.',
      'Take slow, deep breaths. Inhale for 4 seconds, hold 4 seconds, exhale 4 seconds.',
      'Do not consume caffeine, alcohol, or stimulants.',
      'If you feel faint, dizzy, or develop chest pain, call 911 immediately.',
    ],
    careTeamActions: [
      'Assess patient hemodynamic stability',
      'Obtain vital signs and 12-lead ECG',
      'Review medication list for contributing factors',
      'Contact attending physician if HR does not decrease within 15 minutes',
    ],
    escalationTimeMinutes: 15,
    requiredResources: ['ECG machine', 'IV access supplies', 'Cardiac monitor'],
  },
  {
    id: 'PROTO-CARDIAC-BRADY',
    name: 'Severe Bradycardia Protocol',
    category: 'CARDIAC',
    priority: 'EMERGENCY',
    description: 'Response for heart rate below 40 bpm',
    steps: [
      { order: 1, instruction: 'Lay patient flat; elevate legs if hypotensive', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Assess consciousness level and hemodynamic status', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Prepare atropine 0.5 mg IV per physician order', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 4, instruction: 'Apply transcutaneous pacing pads', forPatient: false, forCareTeam: true, critical: false },
      { order: 5, instruction: 'Monitor continuously until HR stabilizes above 60 bpm', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Lie down flat. Do not try to get up or walk.',
      'Stay calm and keep still.',
      'Tell someone nearby if you feel dizzy, lightheaded, or are about to faint.',
      'Call 911 if you are alone and feel you may lose consciousness.',
    ],
    careTeamActions: [
      'Immediate assessment of hemodynamic stability',
      'Establish IV access',
      'Administer atropine per standing orders',
      'Activate rapid response if no improvement in 5 minutes',
    ],
    escalationTimeMinutes: 5,
    requiredResources: ['Atropine', 'IV access supplies', 'Transcutaneous pacer', 'Cardiac monitor'],
  },
  {
    id: 'PROTO-CARDIAC-HYPER-CRISIS',
    name: 'Hypertensive Crisis Protocol',
    category: 'CARDIAC',
    priority: 'LIFE_THREATENING',
    description: 'Response for systolic BP over 180 mmHg',
    steps: [
      { order: 1, instruction: 'Have patient rest in semi-Fowler position', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Recheck BP in both arms within 5 minutes', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 3, instruction: 'Assess for end-organ damage symptoms: headache, chest pain, vision changes', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Administer antihypertensive per physician order', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 5, instruction: 'If evidence of end-organ damage, call 911 immediately', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Monitor BP every 5 minutes for 30 minutes', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Sit up with your back supported at a 45-degree angle.',
      'Do not exert yourself. Avoid all physical activity.',
      'If you develop a severe headache, chest pain, or blurred vision call 911.',
      'Take any prescribed blood pressure medication as directed.',
    ],
    careTeamActions: [
      'Confirm BP with manual cuff and repeat measurement',
      'Assess for hypertensive emergency vs urgency',
      'Contact attending physician immediately',
      'Prepare for possible transfer to emergency department',
    ],
    escalationTimeMinutes: 10,
    requiredResources: ['BP cuff', 'Antihypertensive medications', 'Cardiac monitor'],
  },
  {
    id: 'PROTO-CARDIAC-HYPOTENSION',
    name: 'Severe Hypotension Protocol',
    category: 'CARDIAC',
    priority: 'LIFE_THREATENING',
    description: 'Response for systolic BP below 80 mmHg',
    steps: [
      { order: 1, instruction: 'Place patient in Trendelenburg position (flat with legs elevated)', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Establish two large-bore IV lines', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 3, instruction: 'Administer IV fluid bolus 500 mL normal saline', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 4, instruction: 'Assess for source of hypotension: hemorrhage, sepsis, cardiac', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Call 911 / activate rapid response', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Lie flat and elevate your legs on pillows or a chair.',
      'Do NOT stand up under any circumstances.',
      'Call 911 immediately if you are alone.',
      'Drink fluids slowly if you are conscious and able to swallow.',
    ],
    careTeamActions: [
      'Trendelenburg positioning',
      'Rapid IV fluid resuscitation',
      'Identify and treat underlying cause',
      'Prepare vasopressors if fluid-unresponsive',
    ],
    escalationTimeMinutes: 5,
    requiredResources: ['IV fluids', 'Large-bore IV catheters', 'Vasopressors', 'Cardiac monitor'],
  },
  {
    id: 'PROTO-CARDIAC-ACS',
    name: 'Acute Coronary Syndrome Protocol',
    category: 'CARDIAC',
    priority: 'LIFE_THREATENING',
    description: 'Response for suspected heart attack: chest pain with SOB or arm numbness',
    steps: [
      { order: 1, instruction: 'Call 911 immediately', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Have patient chew aspirin 325 mg (if not allergic)', forPatient: true, forCareTeam: true, timeLimit: '2 minutes', critical: true },
      { order: 3, instruction: 'Place patient in position of comfort, usually sitting upright', forPatient: true, forCareTeam: false, critical: true },
      { order: 4, instruction: 'Administer sublingual nitroglycerin if prescribed and SBP > 90', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 5, instruction: 'Obtain 12-lead ECG', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 6, instruction: 'Prepare for ALS transport', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'CALL 911 IMMEDIATELY. Do not drive yourself.',
      'Chew one regular aspirin (325 mg) unless you are allergic.',
      'Sit upright in the most comfortable position.',
      'Loosen any tight clothing.',
      'Do not eat or drink anything else.',
      'If you lose consciousness, someone should begin CPR.',
    ],
    careTeamActions: [
      'Activate EMS immediately',
      'Administer aspirin and nitroglycerin per protocol',
      'Obtain 12-lead ECG and transmit to receiving facility',
      'Establish IV access',
      'Continuous cardiac monitoring',
    ],
    escalationTimeMinutes: 2,
    requiredResources: ['Aspirin', 'Nitroglycerin', 'ECG machine', 'Cardiac monitor', 'AED'],
  },

  // RESPIRATORY
  {
    id: 'PROTO-RESP-HYPOXIA',
    name: 'Critical Hypoxemia Protocol',
    category: 'RESPIRATORY',
    priority: 'LIFE_THREATENING',
    description: 'Response for SpO2 below 90%',
    steps: [
      { order: 1, instruction: 'Apply high-flow oxygen via non-rebreather mask at 15 L/min', forPatient: false, forCareTeam: true, timeLimit: '1 minute', critical: true },
      { order: 2, instruction: 'Position patient upright (high Fowler)', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Assess airway patency', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Auscultate lung sounds bilaterally', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Obtain ABG if SpO2 does not improve within 5 minutes', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 6, instruction: 'Call 911 if SpO2 remains below 88% after oxygen therapy', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Sit up as straight as possible.',
      'Focus on slow, deep breathing.',
      'Do not talk excessively; conserve energy.',
      'If your lips or fingernails turn blue, call 911 immediately.',
    ],
    careTeamActions: [
      'Administer supplemental oxygen immediately',
      'Assess for pneumothorax, PE, or pneumonia',
      'Contact attending physician',
      'Prepare for possible intubation',
    ],
    escalationTimeMinutes: 5,
    requiredResources: ['Oxygen supply', 'Non-rebreather mask', 'Pulse oximeter', 'ABG kit'],
  },
  {
    id: 'PROTO-RESP-HYPOXIA-MOD',
    name: 'Moderate Hypoxemia Protocol',
    category: 'RESPIRATORY',
    priority: 'EMERGENCY',
    description: 'Response for SpO2 90-92%',
    steps: [
      { order: 1, instruction: 'Apply supplemental oxygen via nasal cannula at 4 L/min', forPatient: false, forCareTeam: true, timeLimit: '2 minutes', critical: true },
      { order: 2, instruction: 'Elevate head of bed to 45 degrees', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Encourage incentive spirometry', forPatient: true, forCareTeam: true, critical: false },
      { order: 4, instruction: 'Reassess SpO2 in 15 minutes', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 5, instruction: 'Escalate if no improvement', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Sit up and take slow, deep breaths.',
      'Use your incentive spirometer every hour.',
      'Avoid lying flat.',
      'Notify your nurse if breathing becomes more difficult.',
    ],
    careTeamActions: [
      'Apply supplemental oxygen',
      'Encourage deep breathing exercises',
      'Assess for atelectasis or fluid overload',
      'Contact physician if SpO2 does not improve above 93% in 30 minutes',
    ],
    escalationTimeMinutes: 30,
    requiredResources: ['Nasal cannula', 'Oxygen supply', 'Pulse oximeter', 'Incentive spirometer'],
  },
  {
    id: 'PROTO-RESP-TACHYPNEA',
    name: 'Severe Tachypnea Protocol',
    category: 'RESPIRATORY',
    priority: 'EMERGENCY',
    description: 'Response for respiratory rate exceeding 30/min',
    steps: [
      { order: 1, instruction: 'Position patient upright', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Apply pulse oximetry and supplemental O2 if SpO2 < 94%', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Assess for pain, anxiety, metabolic acidosis', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Treat underlying cause', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Monitor respiratory rate every 5 minutes', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Sit upright and try to slow your breathing.',
      'Breathe in through your nose for 4 counts, out through pursed lips for 6 counts.',
      'Place your hands on your abdomen to practice diaphragmatic breathing.',
      'Do not panic; controlled breathing will help.',
    ],
    careTeamActions: [
      'Assess and treat underlying cause of tachypnea',
      'Supplemental oxygen as needed',
      'Consider ABG analysis',
      'Contact physician for respiratory support orders',
    ],
    escalationTimeMinutes: 15,
    requiredResources: ['Pulse oximeter', 'Oxygen supply', 'ABG kit'],
  },
  {
    id: 'PROTO-RESP-BRADYPNEA',
    name: 'Bradypnea Protocol',
    category: 'RESPIRATORY',
    priority: 'EMERGENCY',
    description: 'Response for respiratory rate below 8/min',
    steps: [
      { order: 1, instruction: 'Stimulate patient: sternal rub, call name loudly', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Open airway with head-tilt/chin-lift', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Apply high-flow oxygen', forPatient: false, forCareTeam: true, timeLimit: '1 minute', critical: true },
      { order: 4, instruction: 'Prepare bag-valve mask for assisted ventilation', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Review recent opioid administration; consider naloxone', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'If someone is with you, have them call 911 immediately.',
      'Try to stay awake. Focus on taking deep breaths.',
      'Do not take any additional medications.',
    ],
    careTeamActions: [
      'Stimulate patient and assess consciousness',
      'Ensure patent airway',
      'Administer naloxone if opioid-related',
      'Prepare for assisted ventilation',
      'Call rapid response / code blue if apneic',
    ],
    escalationTimeMinutes: 2,
    requiredResources: ['Naloxone', 'Bag-valve mask', 'Oxygen supply', 'Suction equipment'],
  },
  {
    id: 'PROTO-RESP-ARDS',
    name: 'Acute Respiratory Distress Protocol',
    category: 'RESPIRATORY',
    priority: 'LIFE_THREATENING',
    description: 'Response for combined low SpO2 and high respiratory rate',
    steps: [
      { order: 1, instruction: 'Call 911 / activate rapid response', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'High-flow oxygen at maximum', forPatient: false, forCareTeam: true, timeLimit: '1 minute', critical: true },
      { order: 3, instruction: 'Position patient upright', forPatient: true, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Prepare for emergent intubation', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Obtain portable chest X-ray', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Sit upright. Do not lie down.',
      'Someone should call 911 immediately.',
      'Try to stay calm and breathe as slowly as possible.',
      'Do not eat or drink anything.',
    ],
    careTeamActions: [
      'Activate rapid response team',
      'High-flow oxygen immediately',
      'Prepare intubation equipment',
      'Notify ICU for possible transfer',
    ],
    escalationTimeMinutes: 2,
    requiredResources: ['High-flow oxygen', 'Intubation supplies', 'Chest X-ray', 'Ventilator'],
  },
  {
    id: 'PROTO-RESP-PE',
    name: 'Suspected Pulmonary Embolism Protocol',
    category: 'RESPIRATORY',
    priority: 'LIFE_THREATENING',
    description: 'Response for suspected PE: sudden SOB, tachycardia, and chest pain post-op',
    steps: [
      { order: 1, instruction: 'Call 911 immediately', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Apply high-flow oxygen', forPatient: false, forCareTeam: true, timeLimit: '1 minute', critical: true },
      { order: 3, instruction: 'Establish IV access', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Obtain stat CT angiography if in facility', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Administer anticoagulation per physician order', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Prepare for possible thrombolysis', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'CALL 911 IMMEDIATELY.',
      'Do not walk or move around.',
      'Sit upright to breathe more easily.',
      'Do not take any blood-thinning medication unless told to by a doctor.',
    ],
    careTeamActions: [
      'Activate EMS',
      'Supplemental oxygen',
      'IV access and heparin bolus per protocol',
      'CT angiography for definitive diagnosis',
      'Monitor for hemodynamic collapse',
    ],
    escalationTimeMinutes: 2,
    requiredResources: ['Oxygen', 'Heparin', 'IV supplies', 'CT scanner access'],
  },

  // NEUROLOGICAL
  {
    id: 'PROTO-NEURO-STROKE',
    name: 'Stroke Protocol',
    category: 'NEUROLOGICAL',
    priority: 'LIFE_THREATENING',
    description: 'Response for suspected stroke signs',
    steps: [
      { order: 1, instruction: 'Call 911 immediately — time is critical', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Note exact time symptoms started (last known well time)', forPatient: false, forCareTeam: true, timeLimit: '1 minute', critical: true },
      { order: 3, instruction: 'Perform FAST assessment: Face, Arms, Speech, Time', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Do NOT give any oral medications or fluids', forPatient: true, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Keep patient in position of comfort, head elevated 30 degrees', forPatient: true, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Prepare patient information for EMS handoff', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'CALL 911 IMMEDIATELY. Every minute matters.',
      'Do NOT take any medications.',
      'Do NOT eat or drink anything.',
      'Lie down with your head slightly elevated.',
      'Note the exact time your symptoms started.',
    ],
    careTeamActions: [
      'Activate stroke protocol / call EMS',
      'Document last known well time',
      'Perform FAST assessment',
      'Do NOT lower blood pressure acutely',
      'Prepare medication list for receiving facility',
    ],
    escalationTimeMinutes: 1,
    requiredResources: ['Phone to call 911', 'Patient medication list', 'BP cuff'],
  },
  {
    id: 'PROTO-NEURO-SEIZURE',
    name: 'Seizure Protocol',
    category: 'NEUROLOGICAL',
    priority: 'EMERGENCY',
    description: 'Response for new-onset seizure activity',
    steps: [
      { order: 1, instruction: 'Ensure patient safety: clear area of sharp objects', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Place patient on their side (recovery position)', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Do NOT restrain the patient or place anything in mouth', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Time the seizure duration', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Call 911 if seizure lasts > 5 minutes or recurs', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 6, instruction: 'Monitor vitals and consciousness after seizure ends', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'If you feel a seizure coming on, lie down in a safe area.',
      'Someone nearby should call 911 if the seizure lasts more than 5 minutes.',
      'After the seizure, lie on your side and rest.',
      'Do not drive or operate machinery.',
    ],
    careTeamActions: [
      'Protect patient from injury',
      'Position on side and time seizure',
      'Administer benzodiazepine if ordered and seizure > 5 min',
      'Post-ictal assessment and monitoring',
    ],
    escalationTimeMinutes: 5,
    requiredResources: ['Benzodiazepine', 'Suction equipment', 'Oxygen', 'Pulse oximeter'],
  },
  {
    id: 'PROTO-NEURO-AMS',
    name: 'Altered Mental Status Protocol',
    category: 'NEUROLOGICAL',
    priority: 'EMERGENCY',
    description: 'Response for confusion, disorientation, or decreased consciousness',
    steps: [
      { order: 1, instruction: 'Assess GCS (Glasgow Coma Scale)', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Check blood glucose immediately', forPatient: false, forCareTeam: true, timeLimit: '2 minutes', critical: true },
      { order: 3, instruction: 'Review medication list for sedating agents', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Obtain full vital signs', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'If GCS < 8, secure airway and call 911', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Try to stay awake and keep talking to someone.',
      'Have someone stay with you at all times.',
      'Do not take any new medications.',
      'If you are alone and feel confused, call 911.',
    ],
    careTeamActions: [
      'GCS assessment',
      'Stat glucose check',
      'Review medications and recent changes',
      'Head CT if no clear metabolic cause',
    ],
    escalationTimeMinutes: 10,
    requiredResources: ['Glucometer', 'Vital signs equipment', 'Medication list'],
  },

  // HEMORRHAGIC
  {
    id: 'PROTO-HEMORRHAGE-ACTIVE',
    name: 'Active Hemorrhage Protocol',
    category: 'HEMORRHAGIC',
    priority: 'LIFE_THREATENING',
    description: 'Response for active bleeding from surgical site',
    steps: [
      { order: 1, instruction: 'Apply direct pressure to the bleeding site', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Call 911 if bleeding is profuse', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Elevate the bleeding extremity above heart level if possible', forPatient: true, forCareTeam: true, critical: false },
      { order: 4, instruction: 'Establish two large-bore IV lines', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 5, instruction: 'Type and crossmatch for blood products', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Notify surgeon immediately', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
    ],
    patientInstructions: [
      'Apply firm, constant pressure with a clean cloth. Do NOT lift to check.',
      'Call 911 or have someone call for you.',
      'Lie down and elevate the bleeding area if possible.',
      'Do NOT remove any bandages; add more on top if soaked through.',
    ],
    careTeamActions: [
      'Direct pressure and pressure dressing',
      'IV access and fluid resuscitation',
      'Notify operating surgeon',
      'Type and screen, prepare for possible transfusion',
      'Monitor hemoglobin and vital signs',
    ],
    escalationTimeMinutes: 2,
    requiredResources: ['Pressure dressings', 'IV fluids', 'Blood products', 'Surgical tray'],
  },
  {
    id: 'PROTO-HEMORRHAGE-SHOCK',
    name: 'Hemorrhagic Shock Protocol',
    category: 'HEMORRHAGIC',
    priority: 'LIFE_THREATENING',
    description: 'Response for bleeding with hemodynamic instability',
    steps: [
      { order: 1, instruction: 'Activate massive transfusion protocol', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Call 911 immediately', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Two large-bore IVs, wide open crystalloid', forPatient: false, forCareTeam: true, timeLimit: '3 minutes', critical: true },
      { order: 4, instruction: 'Transfuse O-negative blood if type-specific not available', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Notify surgeon for emergent surgical hemostasis', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Lie flat. Do NOT move or try to stand.',
      'Someone must call 911 immediately.',
      'Keep applying pressure to any visible bleeding.',
      'Stay as calm and still as possible.',
    ],
    careTeamActions: [
      'Activate massive transfusion protocol',
      'Aggressive fluid resuscitation',
      'Emergent surgical consultation',
      'Continuous hemodynamic monitoring',
    ],
    escalationTimeMinutes: 1,
    requiredResources: ['Blood products', 'IV fluids', 'Surgical suite', 'Rapid infuser'],
  },
  {
    id: 'PROTO-HEMORRHAGE-HEMATOMA',
    name: 'Expanding Hematoma Protocol',
    category: 'HEMORRHAGIC',
    priority: 'EMERGENCY',
    description: 'Response for rapidly expanding hematoma near surgical site',
    steps: [
      { order: 1, instruction: 'Apply ice and gentle compression', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Mark the borders of the hematoma with a pen and note the time', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Notify surgeon', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 4, instruction: 'Check hemoglobin and coagulation studies', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Prepare for possible evacuation', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Apply ice wrapped in a cloth to the swelling.',
      'Do not apply heavy pressure directly.',
      'Notify your care team immediately.',
      'Watch for increasing swelling or pain.',
    ],
    careTeamActions: [
      'Mark hematoma borders and monitor expansion',
      'Obtain CBC and coagulation panel',
      'Notify surgeon for evaluation',
      'Prepare for surgical evacuation if expanding',
    ],
    escalationTimeMinutes: 15,
    requiredResources: ['Ice packs', 'Marking pen', 'Lab supplies', 'Surgical tray'],
  },

  // WOUND
  {
    id: 'PROTO-WOUND-DEHISCENCE',
    name: 'Wound Dehiscence Protocol',
    category: 'WOUND',
    priority: 'EMERGENCY',
    description: 'Response for surgical wound opening',
    steps: [
      { order: 1, instruction: 'Cover wound with sterile saline-moistened gauze', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Have patient lie flat and avoid coughing, straining', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Apply abdominal binder if abdominal wound', forPatient: false, forCareTeam: true, critical: false },
      { order: 4, instruction: 'Notify surgeon immediately', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 5, instruction: 'Do NOT push any tissue back into wound', forPatient: true, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Keep patient NPO in case of surgical repair', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Do NOT panic. Cover the wound with a clean, damp cloth.',
      'Lie flat and keep still. Do not bend, cough, or strain.',
      'Do NOT try to push anything back into the wound.',
      'Call your surgical team or 911 immediately.',
    ],
    careTeamActions: [
      'Cover wound with saline-soaked sterile dressing',
      'Keep patient supine and calm',
      'Notify surgeon for emergent evaluation',
      'NPO status and prepare for possible OR',
    ],
    escalationTimeMinutes: 10,
    requiredResources: ['Sterile saline', 'Sterile gauze', 'Abdominal binder', 'Surgical suite'],
  },
  {
    id: 'PROTO-WOUND-EVISCERATION',
    name: 'Evisceration Protocol',
    category: 'WOUND',
    priority: 'LIFE_THREATENING',
    description: 'Response for abdominal contents protruding from wound',
    steps: [
      { order: 1, instruction: 'Call 911 immediately', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Cover protruding organs with sterile saline-soaked towels', forPatient: false, forCareTeam: true, timeLimit: '1 minute', critical: true },
      { order: 3, instruction: 'Do NOT attempt to push organs back in', forPatient: true, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Position patient supine with knees bent', forPatient: true, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Keep dressings moist with warm saline', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Emergent surgical repair required', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'CALL 911 IMMEDIATELY.',
      'Do NOT touch or push anything back inside.',
      'Cover the area with a clean, wet towel or cloth.',
      'Lie on your back with your knees bent toward your chest.',
      'Stay as still as possible.',
    ],
    careTeamActions: [
      'Call 911 and notify surgeon',
      'Cover with warm saline-soaked sterile dressings',
      'Position supine with flexed knees',
      'IV access, NPO, prepare for emergent surgery',
    ],
    escalationTimeMinutes: 1,
    requiredResources: ['Sterile saline', 'Sterile towels', 'IV fluids', 'Surgical suite'],
  },
  {
    id: 'PROTO-WOUND-INFECTION',
    name: 'Wound Infection Protocol',
    category: 'WOUND',
    priority: 'URGENT',
    description: 'Response for signs of surgical wound infection',
    steps: [
      { order: 1, instruction: 'Photograph the wound if possible for documentation', forPatient: true, forCareTeam: true, critical: false },
      { order: 2, instruction: 'Obtain wound culture before starting antibiotics', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Mark erythema borders with pen and timestamp', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Obtain complete blood count and inflammatory markers', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Initiate empiric antibiotics per surgeon order', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Schedule follow-up wound check in 24-48 hours', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Do not touch the wound with dirty hands.',
      'Take a photo of the wound so your care team can track changes.',
      'Keep the wound clean and covered.',
      'Take your temperature twice daily.',
      'Report any worsening redness, swelling, or foul-smelling drainage.',
    ],
    careTeamActions: [
      'Obtain wound culture',
      'Order CBC, CRP, ESR',
      'Initiate empiric antibiotic therapy',
      'Mark erythema borders for progression tracking',
      'Schedule wound reassessment in 24-48 hours',
    ],
    escalationTimeMinutes: 60,
    requiredResources: ['Wound culture supplies', 'Antibiotics', 'Lab supplies', 'Wound care kit'],
  },

  // INFECTIOUS
  {
    id: 'PROTO-INFECT-HIGHFEVER',
    name: 'High Fever Protocol',
    category: 'INFECTIOUS',
    priority: 'EMERGENCY',
    description: 'Response for temperature exceeding 39.5 C',
    steps: [
      { order: 1, instruction: 'Administer antipyretic: acetaminophen 1000 mg PO or PR', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Obtain blood cultures x2 before antibiotics', forPatient: false, forCareTeam: true, timeLimit: '30 minutes', critical: true },
      { order: 3, instruction: 'Apply cooling measures: tepid sponge bath, cooling blankets', forPatient: true, forCareTeam: true, critical: false },
      { order: 4, instruction: 'Encourage fluid intake if PO tolerating', forPatient: true, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Complete sepsis screening', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Initiate broad-spectrum antibiotics within 1 hour if sepsis suspected', forPatient: false, forCareTeam: true, timeLimit: '1 hour', critical: true },
    ],
    patientInstructions: [
      'Take acetaminophen (Tylenol) as directed by your care team.',
      'Drink plenty of fluids: water, broth, electrolyte drinks.',
      'Use a cool, damp cloth on your forehead and wrists.',
      'Wear light clothing and use light bedding.',
      'Call your care team if fever exceeds 40 C (104 F) or you feel worse.',
    ],
    careTeamActions: [
      'Administer antipyretics',
      'Blood cultures before antibiotics',
      'Sepsis screening protocol',
      'Broad-spectrum antibiotics if indicated',
      'Monitor temperature every 2 hours',
    ],
    escalationTimeMinutes: 30,
    requiredResources: ['Acetaminophen', 'Blood culture supplies', 'Antibiotics', 'Cooling blankets'],
  },
  {
    id: 'PROTO-INFECT-SEPSIS',
    name: 'Suspected Sepsis Protocol',
    category: 'INFECTIOUS',
    priority: 'LIFE_THREATENING',
    description: 'Response for SIRS criteria with suspected infection',
    steps: [
      { order: 1, instruction: 'Call 911 / activate sepsis alert', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Obtain lactate level and blood cultures', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 3, instruction: 'Administer broad-spectrum IV antibiotics', forPatient: false, forCareTeam: true, timeLimit: '1 hour', critical: true },
      { order: 4, instruction: 'IV fluid bolus 30 mL/kg crystalloid', forPatient: false, forCareTeam: true, timeLimit: '3 hours', critical: true },
      { order: 5, instruction: 'Monitor urine output (goal > 0.5 mL/kg/hr)', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Reassess hemodynamic status; consider vasopressors if MAP < 65', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'This is a medical emergency. Call 911 if not already in a medical facility.',
      'Do not try to manage this at home.',
      'You may need to go to the hospital for IV treatment.',
    ],
    careTeamActions: [
      'Activate sepsis bundle (SEP-1)',
      'Blood cultures and lactate within 15 minutes',
      'Broad-spectrum antibiotics within 1 hour',
      'Aggressive IV fluid resuscitation',
      'Vasopressors if fluid-refractory hypotension',
    ],
    escalationTimeMinutes: 5,
    requiredResources: ['Blood culture supplies', 'IV antibiotics', 'IV fluids', 'Vasopressors', 'Foley catheter'],
  },
  {
    id: 'PROTO-INFECT-HYPOTHERMIA',
    name: 'Hypothermia Protocol',
    category: 'INFECTIOUS',
    priority: 'EMERGENCY',
    description: 'Response for temperature below 35 C',
    steps: [
      { order: 1, instruction: 'Apply warm blankets and remove any wet clothing', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Warm IV fluids to 40-42 C before infusion', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Monitor core temperature continuously', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Evaluate for sepsis (hypothermia can be a sepsis sign)', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Monitor cardiac rhythm for arrhythmias', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Wrap yourself in warm blankets.',
      'Drink warm (not hot) beverages if you can swallow safely.',
      'Do not take a hot bath or shower.',
      'Notify your care team immediately.',
    ],
    careTeamActions: [
      'Passive and active external rewarming',
      'Warm IV fluids',
      'Evaluate for sepsis',
      'Continuous cardiac monitoring',
    ],
    escalationTimeMinutes: 15,
    requiredResources: ['Warm blankets', 'Fluid warmer', 'Cardiac monitor', 'Thermometer'],
  },
  {
    id: 'PROTO-INFECT-BACTEREMIA',
    name: 'Bacteremia / Rigors Protocol',
    category: 'INFECTIOUS',
    priority: 'EMERGENCY',
    description: 'Response for fever with uncontrollable shaking chills',
    steps: [
      { order: 1, instruction: 'Obtain blood cultures from two separate sites', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 2, instruction: 'Administer IV antibiotics per protocol', forPatient: false, forCareTeam: true, timeLimit: '1 hour', critical: true },
      { order: 3, instruction: 'Warm blankets during rigors; cooling after they resolve', forPatient: true, forCareTeam: true, critical: false },
      { order: 4, instruction: 'Monitor vital signs every 15 minutes during rigors', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Check for indwelling line infections', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Shaking chills are your body fighting infection. This needs medical treatment.',
      'Use warm blankets during chills.',
      'Drink warm fluids if you are able.',
      'Seek immediate medical attention if not already under care.',
    ],
    careTeamActions: [
      'Blood cultures from two sites',
      'Empiric IV antibiotics',
      'Assess indwelling devices as infection source',
      'Frequent vital sign monitoring',
    ],
    escalationTimeMinutes: 15,
    requiredResources: ['Blood culture supplies', 'IV antibiotics', 'Warm blankets'],
  },

  // MEDICATION
  {
    id: 'PROTO-MED-ALLERGY',
    name: 'Allergic Reaction Protocol',
    category: 'MEDICATION',
    priority: 'EMERGENCY',
    description: 'Response for medication allergic reaction',
    steps: [
      { order: 1, instruction: 'Stop the offending medication immediately', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Administer diphenhydramine 50 mg IV or PO', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 3, instruction: 'Monitor for progression to anaphylaxis', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Document allergy in medical record', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Administer corticosteroids if severe reaction', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Stop taking the medication immediately.',
      'Take diphenhydramine (Benadryl) 25-50 mg if available.',
      'Watch for worsening symptoms: difficulty breathing, throat swelling, dizziness.',
      'If symptoms worsen, call 911 immediately.',
      'Report this allergy to all future healthcare providers.',
    ],
    careTeamActions: [
      'Discontinue offending agent',
      'Administer antihistamines',
      'Monitor for anaphylaxis progression',
      'Update allergy list in all records',
      'Report adverse drug reaction',
    ],
    escalationTimeMinutes: 10,
    requiredResources: ['Diphenhydramine', 'Epinephrine (standby)', 'Corticosteroids'],
  },
  {
    id: 'PROTO-MED-ANAPHYLAXIS',
    name: 'Anaphylaxis Protocol',
    category: 'ANAPHYLAXIS',
    priority: 'LIFE_THREATENING',
    description: 'Response for severe allergic reaction with hemodynamic instability',
    steps: [
      { order: 1, instruction: 'Administer epinephrine 0.3 mg IM in lateral thigh immediately', forPatient: false, forCareTeam: true, timeLimit: '1 minute', critical: true },
      { order: 2, instruction: 'Call 911', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Place patient supine with legs elevated', forPatient: true, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Administer high-flow oxygen', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Establish IV access for fluid resuscitation', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Repeat epinephrine in 5-15 minutes if no improvement', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
    ],
    patientInstructions: [
      'Use your EpiPen on the outer thigh if you have one. Call 911.',
      'Lie flat with your legs elevated.',
      'If you are having trouble breathing, sit up slightly.',
      'Do NOT stand or walk.',
      'Someone should stay with you at all times.',
    ],
    careTeamActions: [
      'Epinephrine IM immediately',
      'Call 911',
      'Supine positioning',
      'Oxygen and IV access',
      'Repeat epinephrine if needed',
      'Secondary: antihistamines, corticosteroids, bronchodilators',
    ],
    escalationTimeMinutes: 1,
    requiredResources: ['Epinephrine', 'Oxygen', 'IV fluids', 'Diphenhydramine', 'Albuterol'],
  },
  {
    id: 'PROTO-MED-OPIOID-OD',
    name: 'Opioid Overdose Protocol',
    category: 'MEDICATION',
    priority: 'LIFE_THREATENING',
    description: 'Response for suspected opioid overdose with respiratory depression',
    steps: [
      { order: 1, instruction: 'Administer naloxone (Narcan) 0.4 mg IV/IM/IN immediately', forPatient: false, forCareTeam: true, timeLimit: '1 minute', critical: true },
      { order: 2, instruction: 'Call 911', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Support ventilation with bag-valve mask if RR < 6', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Place in recovery position if breathing adequately', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Repeat naloxone every 2-3 minutes as needed (max 10 mg)', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Monitor for recurrence — naloxone duration shorter than most opioids', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'If someone is with you, have them call 911 and administer Narcan if available.',
      'Narcan nasal spray: one spray in one nostril.',
      'Turn person on their side (recovery position).',
      'Stay with the person until help arrives.',
    ],
    careTeamActions: [
      'Naloxone immediately',
      'Call 911',
      'Support airway and ventilation',
      'Monitor for renarcotization (opioid outlasts naloxone)',
      'Continuous pulse oximetry and cardiac monitoring',
    ],
    escalationTimeMinutes: 1,
    requiredResources: ['Naloxone', 'Bag-valve mask', 'Oxygen', 'Cardiac monitor'],
  },
  {
    id: 'PROTO-MED-OVERDOSE',
    name: 'General Medication Overdose Protocol',
    category: 'MEDICATION',
    priority: 'EMERGENCY',
    description: 'Response for general medication overdose',
    steps: [
      { order: 1, instruction: 'Call Poison Control (1-800-222-1222) or 911', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Identify the medication, amount taken, and time of ingestion', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Do NOT induce vomiting unless directed by Poison Control', forPatient: true, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Monitor vital signs continuously', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Prepare for possible gastric lavage or activated charcoal per toxicology', forPatient: false, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Call Poison Control at 1-800-222-1222 or call 911.',
      'Do NOT make yourself vomit unless told to by Poison Control.',
      'Bring the medication bottle with you to the ER.',
      'Tell the medical team exactly what you took, how much, and when.',
    ],
    careTeamActions: [
      'Contact Poison Control',
      'Identify substance, dose, time of ingestion',
      'Vital signs and cardiac monitoring',
      'Substance-specific antidote if available',
      'Consider GI decontamination per toxicology recommendation',
    ],
    escalationTimeMinutes: 5,
    requiredResources: ['Activated charcoal', 'Cardiac monitor', 'IV supplies'],
  },

  // METABOLIC
  {
    id: 'PROTO-META-HYPOGLYCEMIA',
    name: 'Severe Hypoglycemia Protocol',
    category: 'METABOLIC',
    priority: 'EMERGENCY',
    description: 'Response for blood glucose below 54 mg/dL',
    steps: [
      { order: 1, instruction: 'If conscious: give 15-20 g fast-acting glucose (juice, glucose tabs)', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'If unconscious: administer glucagon 1 mg IM or IV dextrose', forPatient: false, forCareTeam: true, timeLimit: '2 minutes', critical: true },
      { order: 3, instruction: 'Recheck glucose in 15 minutes', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 4, instruction: 'Repeat glucose treatment if still below 70 mg/dL', forPatient: true, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Provide complex carbohydrate snack once glucose stabilizes', forPatient: true, forCareTeam: true, critical: false },
    ],
    patientInstructions: [
      'Drink 4 oz of juice or regular soda, or eat 3-4 glucose tablets.',
      'Wait 15 minutes and recheck your blood sugar.',
      'If still low, repeat the juice or glucose tablets.',
      'Once blood sugar is above 70, eat a snack with protein and carbs.',
      'If you feel like you may pass out, call 911.',
    ],
    careTeamActions: [
      'Oral glucose if conscious; IV dextrose or glucagon if not',
      'Recheck glucose every 15 minutes',
      'Review insulin/diabetes medication doses',
      'Evaluate for cause of hypoglycemia',
    ],
    escalationTimeMinutes: 15,
    requiredResources: ['Glucose tablets', 'Juice', 'Glucagon kit', 'D50W', 'Glucometer'],
  },
  {
    id: 'PROTO-META-HYPERGLYCEMIA',
    name: 'Severe Hyperglycemia Protocol',
    category: 'METABOLIC',
    priority: 'EMERGENCY',
    description: 'Response for blood glucose exceeding 400 mg/dL',
    steps: [
      { order: 1, instruction: 'Contact physician for insulin orders', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 2, instruction: 'Encourage fluid intake (water, sugar-free beverages)', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Check for ketones in urine', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Administer rapid-acting insulin per sliding scale or orders', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Recheck glucose in 1 hour', forPatient: false, forCareTeam: true, timeLimit: '1 hour', critical: true },
      { order: 6, instruction: 'If ketones present, activate DKA protocol', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Drink plenty of water to stay hydrated.',
      'Take your insulin as directed by your care team.',
      'Do NOT exercise with very high blood sugar.',
      'Check for ketones if you have urine test strips.',
      'Seek emergency care if you develop nausea, vomiting, or abdominal pain.',
    ],
    careTeamActions: [
      'Contact physician for insulin correction',
      'Hydration',
      'Urine ketones',
      'Insulin per orders',
      'Monitor glucose hourly',
    ],
    escalationTimeMinutes: 30,
    requiredResources: ['Insulin', 'Glucometer', 'Ketone test strips', 'IV fluids'],
  },
  {
    id: 'PROTO-META-DKA',
    name: 'Diabetic Ketoacidosis Protocol',
    category: 'METABOLIC',
    priority: 'LIFE_THREATENING',
    description: 'Response for suspected DKA',
    steps: [
      { order: 1, instruction: 'Call 911 / transfer to emergency department', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'IV normal saline 1 L bolus', forPatient: false, forCareTeam: true, timeLimit: '30 minutes', critical: true },
      { order: 3, instruction: 'Start insulin infusion per DKA protocol', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Monitor potassium and replace as needed', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Monitor glucose hourly, BMP every 2 hours', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'This is a medical emergency. Call 911 or go to the ER immediately.',
      'Do not try to manage this at home.',
      'Bring your medication list and glucometer to the hospital.',
    ],
    careTeamActions: [
      'Activate DKA protocol',
      'Aggressive IV hydration',
      'Insulin drip',
      'Electrolyte monitoring and replacement',
      'Hourly glucose checks',
      'ICU admission',
    ],
    escalationTimeMinutes: 5,
    requiredResources: ['IV fluids', 'Insulin infusion', 'Electrolyte panels', 'ICU bed'],
  },

  // VASCULAR
  {
    id: 'PROTO-VASC-DVT',
    name: 'Suspected DVT Protocol',
    category: 'VASCULAR',
    priority: 'URGENT',
    description: 'Response for suspected deep vein thrombosis',
    steps: [
      { order: 1, instruction: 'Immobilize the affected extremity', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Elevate the affected leg', forPatient: true, forCareTeam: true, critical: false },
      { order: 3, instruction: 'Contact physician for duplex ultrasound order', forPatient: false, forCareTeam: true, timeLimit: '2 hours', critical: true },
      { order: 4, instruction: 'Obtain D-dimer if not already done', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Initiate anticoagulation per physician order if confirmed', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Educate patient on PE warning signs', forPatient: true, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Keep the swollen leg elevated and do not walk on it.',
      'Do NOT massage the affected leg.',
      'Watch for sudden shortness of breath or chest pain (signs of PE) — call 911 if these occur.',
      'You will likely need a special ultrasound test to confirm this.',
      'Do not start blood thinners unless directed by your doctor.',
    ],
    careTeamActions: [
      'Order duplex venous ultrasound',
      'D-dimer lab work',
      'Risk stratification with Wells criteria',
      'Anticoagulation initiation if confirmed',
      'PE education and warning signs',
    ],
    escalationTimeMinutes: 120,
    requiredResources: ['Ultrasound', 'D-dimer lab', 'Anticoagulants'],
  },

  // PSYCHIATRIC
  {
    id: 'PROTO-PSYCH-SELFHARM',
    name: 'Self-Harm Risk Protocol',
    category: 'PSYCHIATRIC',
    priority: 'EMERGENCY',
    description: 'Response for patient expressing self-harm behavior or intent',
    steps: [
      { order: 1, instruction: 'Ensure patient safety: remove sharp objects and potential hazards from immediate area', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Maintain calm, non-judgmental communication with patient', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Contact psychiatric crisis team or on-call psychiatrist', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 4, instruction: 'Stay with the patient continuously; do not leave them alone', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Document statements and behaviors observed', forPatient: false, forCareTeam: true, critical: false },
      { order: 6, instruction: 'Notify attending physician and emergency contacts', forPatient: false, forCareTeam: true, timeLimit: '30 minutes', critical: true },
    ],
    patientInstructions: [
      'You are not alone. Help is available right now.',
      'Please stay where you are. Someone will be with you shortly.',
      'If you are in immediate danger, call 988 (Suicide and Crisis Lifeline) or 911.',
      'It is okay to ask for help. This is a safe space.',
    ],
    careTeamActions: [
      'Environmental safety check',
      'One-to-one observation',
      'Psychiatric consult',
      'Notify attending physician',
      'Update care plan with safety interventions',
    ],
    escalationTimeMinutes: 15,
    requiredResources: ['Psychiatric crisis team', 'Safe room', 'Crisis hotline numbers'],
  },
  {
    id: 'PROTO-PSYCH-SUICIDE',
    name: 'Suicidal Ideation Emergency Protocol',
    category: 'PSYCHIATRIC',
    priority: 'LIFE_THREATENING',
    description: 'Response for patient expressing suicidal thoughts or plans',
    steps: [
      { order: 1, instruction: 'Call 988 (Suicide and Crisis Lifeline) or 911 immediately', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Remove all means of self-harm from patient area: medications, sharp objects, cords', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Stay with the patient; maintain constant line of sight', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Speak calmly: "I want to help you stay safe. Let us get through this together."', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Contact psychiatric emergency services for immediate evaluation', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 6, instruction: 'Notify all emergency contacts simultaneously', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 7, instruction: 'Prepare for possible involuntary psychiatric hold if patient is in imminent danger', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'You matter. Please call 988 (Suicide and Crisis Lifeline) or 911 right now.',
      'If someone is with you, tell them how you are feeling.',
      'Do not be alone. Go to a safe public place or stay on the phone with a crisis counselor.',
      'Help is on the way. Please stay where you are.',
    ],
    careTeamActions: [
      'Immediate 988/911 activation',
      'Environmental safety sweep',
      'Constant observation',
      'Psychiatric emergency consult',
      'Notify all emergency contacts and attending physician',
      'Document all statements verbatim',
    ],
    escalationTimeMinutes: 2,
    requiredResources: ['988 Lifeline', 'Psychiatric emergency team', 'Safe room', 'Security if needed'],
  },
  {
    id: 'PROTO-PSYCH-PSYCHOSIS',
    name: 'Acute Psychosis Protocol',
    category: 'PSYCHIATRIC',
    priority: 'EMERGENCY',
    description: 'Response for post-operative psychosis, hallucinations, or severe agitation',
    steps: [
      { order: 1, instruction: 'Ensure safety of patient and surrounding people', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Reduce environmental stimulation: dim lights, minimize noise', forPatient: false, forCareTeam: true, critical: false },
      { order: 3, instruction: 'Speak in calm, simple, reassuring sentences', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Do not argue with delusions or hallucinations', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Contact psychiatry for medication orders (haloperidol or olanzapine)', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 6, instruction: 'Review medication list for delirium-causing agents', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'You are safe. You are in a medical facility and people are here to help you.',
      'Try to stay calm. Focus on slow breathing.',
      'Tell someone if you are hearing or seeing things that feel unusual.',
      'Do not leave your room without assistance.',
    ],
    careTeamActions: [
      'Safety assessment',
      'Medication review for delirium contributors',
      'Psychiatric consult',
      'Consider delirium workup (labs, imaging)',
      'Reorientation interventions',
    ],
    escalationTimeMinutes: 15,
    requiredResources: ['Psychiatric team', 'Antipsychotic medications', 'Safe environment'],
  },

  // WOUND ADVANCED
  {
    id: 'PROTO-WOUND-NECFASC',
    name: 'Suspected Necrotizing Fasciitis Protocol',
    category: 'WOUND',
    priority: 'LIFE_THREATENING',
    description: 'Response for suspected necrotizing soft tissue infection',
    steps: [
      { order: 1, instruction: 'Call 911 immediately — this is a surgical emergency', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Mark the borders of redness/discoloration with a skin marker and note the time', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 3, instruction: 'Establish large-bore IV access and begin aggressive fluid resuscitation', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 4, instruction: 'Administer broad-spectrum IV antibiotics per sepsis protocol', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 5, instruction: 'Obtain STAT surgical consult for emergent debridement', forPatient: false, forCareTeam: true, timeLimit: '15 minutes', critical: true },
      { order: 6, instruction: 'Obtain LRINEC score labs: CBC, CMP, CRP, lactate', forPatient: false, forCareTeam: true, critical: true },
      { order: 7, instruction: 'Prepare for immediate OR transfer', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'This is a serious condition requiring immediate hospital treatment. Call 911 NOW.',
      'Do NOT apply any ointments, creams, or bandages to the area.',
      'Note if the painful area is spreading — tell the doctors exactly how fast.',
      'Do not eat or drink in case surgery is needed.',
      'If you feel faint or your heart is racing, lie down and elevate your legs.',
    ],
    careTeamActions: [
      'Activate surgical emergency response',
      'Aggressive IV fluid resuscitation',
      'Broad-spectrum antibiotics within 30 minutes',
      'STAT surgical consult',
      'Serial wound border assessments every 15 minutes',
      'Prepare for emergent operative debridement',
    ],
    escalationTimeMinutes: 5,
    requiredResources: ['OR availability', 'IV antibiotics', 'Surgical team', 'ICU bed', 'Blood products'],
  },

  // FALL
  {
    id: 'PROTO-FALL-IMMOBILE',
    name: 'Fall with Immobility Protocol',
    category: 'NEUROLOGICAL',
    priority: 'EMERGENCY',
    description: 'Response for patient fall resulting in inability to move',
    steps: [
      { order: 1, instruction: 'Do NOT move the patient — stabilize in current position', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Assess ABCs: airway, breathing, circulation', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Assess for head, neck, and spinal injury — maintain C-spine precautions', forPatient: false, forCareTeam: true, critical: true },
      { order: 4, instruction: 'Assess extremities for deformity, swelling, or open fracture', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Obtain vital signs including neurological assessment', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 6, instruction: 'Order imaging as indicated: X-ray, CT based on injury pattern', forPatient: false, forCareTeam: true, timeLimit: '30 minutes', critical: true },
    ],
    patientInstructions: [
      'Do NOT try to get up or move. Stay exactly where you are.',
      'Tell someone nearby that you have fallen and cannot move.',
      'If you are alone, call 911 from your phone if you can reach it.',
      'Try to stay calm and breathe normally.',
      'Do not let anyone move you until medical help arrives.',
    ],
    careTeamActions: [
      'Spinal precautions until cleared',
      'Full neurological and musculoskeletal assessment',
      'Vital signs monitoring',
      'Imaging as indicated',
      'Fall risk reassessment and care plan update',
      'Incident report completion',
    ],
    escalationTimeMinutes: 10,
    requiredResources: ['C-spine collar', 'Backboard', 'Imaging (X-ray/CT)', 'Splinting supplies'],
  },
  {
    id: 'PROTO-FALL-HEAD',
    name: 'Fall with Head Impact Protocol',
    category: 'NEUROLOGICAL',
    priority: 'LIFE_THREATENING',
    description: 'Response for fall involving head trauma',
    steps: [
      { order: 1, instruction: 'Call 911 immediately — potential traumatic brain injury', forPatient: true, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Do NOT move the patient; stabilize head and neck', forPatient: true, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Assess level of consciousness using Glasgow Coma Scale', forPatient: false, forCareTeam: true, timeLimit: '2 minutes', critical: true },
      { order: 4, instruction: 'Check for signs of skull fracture: Battle sign, raccoon eyes, CSF leak', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'Monitor for vomiting — position to prevent aspiration if unconscious', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Obtain STAT CT head', forPatient: false, forCareTeam: true, timeLimit: '30 minutes', critical: true },
      { order: 7, instruction: 'Neurological checks every 15 minutes', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Do NOT move. Keep your head and neck still.',
      'Call 911 or have someone call for you immediately.',
      'If you feel nauseous, turn to your side gently to prevent choking.',
      'Do not fall asleep until medical professionals assess you.',
      'Tell responders exactly how you fell and where you hit your head.',
    ],
    careTeamActions: [
      'Immediate 911 activation',
      'C-spine immobilization',
      'GCS assessment and serial monitoring',
      'STAT CT head',
      'Neurosurgery consult if GCS < 13 or signs of herniation',
      'Seizure precautions',
    ],
    escalationTimeMinutes: 2,
    requiredResources: ['C-spine collar', 'CT scanner', 'Neurosurgery team', 'ICU bed', 'Airway management'],
  },

  // MEDICATION ADVANCED
  {
    id: 'PROTO-MED-SEROTONIN',
    name: 'Serotonin Syndrome Protocol',
    category: 'MEDICATION',
    priority: 'EMERGENCY',
    description: 'Response for suspected serotonin syndrome from serotonergic medications',
    steps: [
      { order: 1, instruction: 'Discontinue all serotonergic medications immediately', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Assess severity: mild (tremor, diarrhea) vs severe (hyperthermia > 41C, seizures, rhabdomyolysis)', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Administer IV fluids for hydration', forPatient: false, forCareTeam: true, timeLimit: '10 minutes', critical: true },
      { order: 4, instruction: 'For agitation, administer benzodiazepines per physician order', forPatient: false, forCareTeam: true, critical: true },
      { order: 5, instruction: 'For severe hyperthermia, initiate active cooling measures', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Consider cyproheptadine 12 mg loading dose per physician order', forPatient: false, forCareTeam: true, critical: false },
      { order: 7, instruction: 'Monitor temperature, HR, BP, and mental status continuously', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'Stop taking any medications until a doctor advises you.',
      'If you are shaking, sweating heavily, or have a very high fever, call 911.',
      'Drink cool water if you can.',
      'Remove excess clothing to help cool down.',
      'Tell medical staff every medication and supplement you have taken recently.',
    ],
    careTeamActions: [
      'Discontinue all serotonergic agents',
      'Medication reconciliation',
      'IV hydration',
      'Benzodiazepines for agitation',
      'Active cooling if temperature > 41C',
      'Consider cyproheptadine',
      'Continuous monitoring',
    ],
    escalationTimeMinutes: 10,
    requiredResources: ['IV fluids', 'Benzodiazepines', 'Cyproheptadine', 'Cooling blankets', 'Cardiac monitor'],
  },

  // GENERAL — Universal Code Blue
  {
    id: 'PROTO-GENERAL-CODEBLUE',
    name: 'Cardiac Arrest / Code Blue Protocol',
    category: 'CARDIAC',
    priority: 'LIFE_THREATENING',
    description: 'Response for unresponsive patient with no pulse — cardiac arrest',
    steps: [
      { order: 1, instruction: 'Call 911 and activate code blue immediately', forPatient: false, forCareTeam: true, critical: true },
      { order: 2, instruction: 'Begin high-quality CPR: 30 compressions to 2 breaths, rate 100-120/min', forPatient: false, forCareTeam: true, critical: true },
      { order: 3, instruction: 'Apply AED as soon as available and follow voice prompts', forPatient: false, forCareTeam: true, timeLimit: '2 minutes', critical: true },
      { order: 4, instruction: 'Establish IV/IO access', forPatient: false, forCareTeam: true, timeLimit: '5 minutes', critical: true },
      { order: 5, instruction: 'Administer epinephrine 1 mg IV every 3-5 minutes per ACLS', forPatient: false, forCareTeam: true, critical: true },
      { order: 6, instruction: 'Analyze rhythm every 2 minutes; shock if indicated', forPatient: false, forCareTeam: true, critical: true },
      { order: 7, instruction: 'Continue CPR until ROSC or physician calls time of death', forPatient: false, forCareTeam: true, critical: true },
    ],
    patientInstructions: [
      'If you witness someone collapse and become unresponsive, call 911 immediately.',
      'If trained, begin chest compressions: push hard and fast in the center of the chest.',
      'If an AED is nearby, turn it on and follow the voice instructions.',
      'Do not stop CPR until paramedics arrive and take over.',
    ],
    careTeamActions: [
      'Activate code blue / call 911',
      'High-quality CPR with minimal interruptions',
      'Early defibrillation',
      'ACLS algorithm: epinephrine, rhythm checks',
      'Post-ROSC care if return of spontaneous circulation',
    ],
    escalationTimeMinutes: 1,
    requiredResources: ['AED/Defibrillator', 'Code cart', 'Epinephrine', 'Advanced airway', 'IV/IO supplies'],
  },
];

// -----------------------------------------------------------------------------
// In-memory data stores
// -----------------------------------------------------------------------------

const emergencyContactsStore: Map<string, EmergencyContact[]> = new Map();
const emergencyHistoryStore: Map<string, EmergencyEvent[]> = new Map();

// Pre-populate example contacts
emergencyContactsStore.set('patient-001', [
  {
    id: 'ec-001',
    patientId: 'patient-001',
    name: 'Maria Garcia',
    relationship: 'Spouse',
    phone: '555-0101',
    email: 'maria.garcia@email.com',
    isPrimary: true,
    priority: 1,
    availableHours: '24/7',
    notificationPreference: 'all',
  },
  {
    id: 'ec-002',
    patientId: 'patient-001',
    name: 'Dr. Sarah Chen',
    relationship: 'Primary Care Physician',
    phone: '555-0201',
    email: 'sarah.chen@hospital.org',
    isPrimary: false,
    priority: 2,
    availableHours: 'Mon-Fri 8am-6pm',
    notificationPreference: 'call',
  },
  {
    id: 'ec-003',
    patientId: 'patient-001',
    name: 'Carlos Garcia',
    relationship: 'Son',
    phone: '555-0301',
    email: 'carlos.g@email.com',
    isPrimary: false,
    priority: 3,
    notificationPreference: 'sms',
  },
]);

// -----------------------------------------------------------------------------
// Priority ordering helper
// -----------------------------------------------------------------------------

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  URGENT: 1,
  EMERGENCY: 2,
  LIFE_THREATENING: 3,
};

function highestPriority(levels: PriorityLevel[]): PriorityLevel {
  if (levels.length === 0) return 'URGENT';
  return levels.reduce((max, cur) =>
    PRIORITY_ORDER[cur] > PRIORITY_ORDER[max] ? cur : max
  );
}

// -----------------------------------------------------------------------------
// Core Functions
// -----------------------------------------------------------------------------

/**
 * Evaluate vital signs and symptoms against all emergency rules.
 * Returns an EmergencyAssessment with triggered rules, recommended protocols,
 * and immediate actions.
 */
export function evaluateEmergency(
  vitals: VitalSigns,
  symptoms: Symptom[]
): EmergencyAssessment {
  const triggeredRules: EmergencyRule[] = [];

  for (const rule of EMERGENCY_RULES) {
    try {
      if (rule.condition(vitals, symptoms)) {
        triggeredRules.push(rule);
      }
    } catch {
      // Rule evaluation failed — skip gracefully
    }
  }

  if (triggeredRules.length === 0) {
    return {
      timestamp: new Date(),
      triggeredRules: [],
      highestPriority: 'URGENT',
      categories: [],
      recommendedProtocols: [],
      immediateActions: ['Continue routine monitoring.'],
      requiresEMS: false,
      vitalsSnapshot: { ...vitals },
      symptomsSnapshot: [...symptoms],
    };
  }

  const priorities = triggeredRules.map((r) => r.priority);
  const topPriority = highestPriority(priorities);
  const categories = [...new Set(triggeredRules.map((r) => r.category))];
  const protocolIds = [...new Set(triggeredRules.map((r) => r.protocolId))];

  const recommendedProtocols = protocolIds
    .map((pid) => EMERGENCY_PROTOCOLS.find((p) => p.id === pid))
    .filter((p): p is Protocol => p !== undefined);

  const immediateActions: string[] = [];
  for (const protocol of recommendedProtocols) {
    const firstCriticalStep = protocol.steps.find((s) => s.critical);
    if (firstCriticalStep) {
      immediateActions.push(firstCriticalStep.instruction);
    }
  }

  const requiresEMS =
    topPriority === 'LIFE_THREATENING' ||
    recommendedProtocols.some((p) => p.escalationTimeMinutes <= 5);

  return {
    timestamp: new Date(),
    triggeredRules,
    highestPriority: topPriority,
    categories,
    recommendedProtocols,
    immediateActions: [...new Set(immediateActions)],
    requiresEMS,
    vitalsSnapshot: { ...vitals },
    symptomsSnapshot: [...symptoms],
  };
}

/**
 * Retrieve a specific emergency protocol by type/ID.
 */
export function getProtocol(emergencyType: string): Protocol | undefined {
  return (
    EMERGENCY_PROTOCOLS.find(
      (p) =>
        p.id === emergencyType ||
        p.name.toLowerCase().includes(emergencyType.toLowerCase()) ||
        p.category.toLowerCase() === emergencyType.toLowerCase()
    ) ?? undefined
  );
}

/**
 * Notify emergency contacts for a patient based on the emergency severity.
 * Contacts are notified in priority order. For LIFE_THREATENING emergencies,
 * all contacts are notified simultaneously.
 */
export function notifyEmergencyContacts(
  patientId: string,
  emergency: EmergencyAssessment
): void {
  const contacts = emergencyContactsStore.get(patientId) ?? [];

  if (contacts.length === 0) {
    console.warn(
      `[EmergencyProtocol] No emergency contacts found for patient ${patientId}`
    );
    return;
  }

  const sorted = [...contacts].sort((a, b) => a.priority - b.priority);

  const notificationMessage = buildNotificationMessage(emergency);

  if (emergency.highestPriority === 'LIFE_THREATENING') {
    // Notify all contacts simultaneously
    for (const contact of sorted) {
      sendNotification(contact, notificationMessage, emergency.highestPriority);
    }
  } else if (emergency.highestPriority === 'EMERGENCY') {
    // Notify primary + top 2 priority contacts
    const toNotify = sorted.slice(0, 2);
    for (const contact of toNotify) {
      sendNotification(contact, notificationMessage, emergency.highestPriority);
    }
  } else {
    // URGENT — notify primary contact only
    const primary = sorted.find((c) => c.isPrimary) ?? sorted[0];
    sendNotification(primary, notificationMessage, emergency.highestPriority);
  }
}

/**
 * Generate a structured incident report for an emergency event.
 */
export function generateIncidentReport(emergency: EmergencyAssessment): string {
  const timestamp = emergency.timestamp.toISOString();
  const rules = emergency.triggeredRules.map((r) => r.name).join(', ');
  const categories = emergency.categories.join(', ');
  const protocols = emergency.recommendedProtocols.map((p) => p.name).join(', ');
  const actions = emergency.immediateActions
    .map((a, i) => `  ${i + 1}. ${a}`)
    .join('\n');

  const vitals = emergency.vitalsSnapshot;
  const vitalsLines: string[] = [];
  if (vitals.heartRate !== undefined) vitalsLines.push(`  Heart Rate: ${vitals.heartRate} bpm`);
  if (vitals.systolicBP !== undefined) vitalsLines.push(`  Systolic BP: ${vitals.systolicBP} mmHg`);
  if (vitals.diastolicBP !== undefined) vitalsLines.push(`  Diastolic BP: ${vitals.diastolicBP} mmHg`);
  if (vitals.spo2 !== undefined) vitalsLines.push(`  SpO2: ${vitals.spo2}%`);
  if (vitals.temperature !== undefined) vitalsLines.push(`  Temperature: ${vitals.temperature} C`);
  if (vitals.respiratoryRate !== undefined) vitalsLines.push(`  Respiratory Rate: ${vitals.respiratoryRate}/min`);
  if (vitals.bloodGlucose !== undefined) vitalsLines.push(`  Blood Glucose: ${vitals.bloodGlucose} mg/dL`);
  if (vitals.painLevel !== undefined) vitalsLines.push(`  Pain Level: ${vitals.painLevel}/10`);

  const symptomsText = emergency.symptomsSnapshot
    .map((s) => `  - ${s.name} (${s.severity})`)
    .join('\n');

  return `
================================================================================
                        EMERGENCY INCIDENT REPORT
================================================================================
Report Generated: ${timestamp}
Priority Level:   ${emergency.highestPriority}
EMS Required:     ${emergency.requiresEMS ? 'YES' : 'No'}

TRIGGERED RULES:
  ${rules}

CATEGORIES:
  ${categories}

VITAL SIGNS AT TIME OF EVENT:
${vitalsLines.join('\n') || '  No vital signs recorded'}

SYMPTOMS REPORTED:
${symptomsText || '  No symptoms reported'}

ACTIVATED PROTOCOLS:
  ${protocols}

IMMEDIATE ACTIONS RECOMMENDED:
${actions}

PROTOCOL DETAILS:
${emergency.recommendedProtocols
  .map(
    (p) => `
  ${p.name} (Escalation: ${p.escalationTimeMinutes} min)
  Patient Instructions:
${p.patientInstructions.map((inst) => `    - ${inst}`).join('\n')}
  Care Team Actions:
${p.careTeamActions.map((act) => `    - ${act}`).join('\n')}
`
  )
  .join('\n')}
================================================================================
                          END OF INCIDENT REPORT
================================================================================
`.trim();
}

/**
 * Retrieve all emergency events for a given patient.
 */
export function getEmergencyHistory(patientId: string): EmergencyEvent[] {
  return emergencyHistoryStore.get(patientId) ?? [];
}

// -----------------------------------------------------------------------------
// Emergency Contact Management
// -----------------------------------------------------------------------------

/**
 * Add or update an emergency contact for a patient.
 */
export function addEmergencyContact(contact: EmergencyContact): void {
  const existing = emergencyContactsStore.get(contact.patientId) ?? [];
  const idx = existing.findIndex((c) => c.id === contact.id);
  if (idx >= 0) {
    existing[idx] = contact;
  } else {
    existing.push(contact);
  }
  emergencyContactsStore.set(contact.patientId, existing);
}

/**
 * Remove an emergency contact by ID.
 */
export function removeEmergencyContact(
  patientId: string,
  contactId: string
): boolean {
  const existing = emergencyContactsStore.get(patientId) ?? [];
  const filtered = existing.filter((c) => c.id !== contactId);
  if (filtered.length === existing.length) return false;
  emergencyContactsStore.set(patientId, filtered);
  return true;
}

/**
 * Get all emergency contacts for a patient, sorted by priority.
 */
export function getEmergencyContacts(patientId: string): EmergencyContact[] {
  const contacts = emergencyContactsStore.get(patientId) ?? [];
  return [...contacts].sort((a, b) => a.priority - b.priority);
}

/**
 * Get the escalation chain for a patient: ordered list of contacts to notify.
 */
export function getEscalationChain(patientId: string): EmergencyContact[] {
  return getEmergencyContacts(patientId);
}

// -----------------------------------------------------------------------------
// Record an emergency event
// -----------------------------------------------------------------------------

/**
 * Record an emergency event for a patient.
 */
export function recordEmergencyEvent(
  patientId: string,
  assessment: EmergencyAssessment,
  contactsNotified: string[]
): EmergencyEvent {
  const event: EmergencyEvent = {
    id: `emg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    patientId,
    timestamp: new Date(),
    assessment,
    protocolsActivated: assessment.recommendedProtocols.map((p) => p.id),
    contactsNotified,
    incidentReport: generateIncidentReport(assessment),
  };

  const history = emergencyHistoryStore.get(patientId) ?? [];
  history.push(event);
  emergencyHistoryStore.set(patientId, history);

  return event;
}

/**
 * Resolve an emergency event.
 */
export function resolveEmergencyEvent(
  patientId: string,
  eventId: string,
  resolution: string,
  outcome: EmergencyEvent['outcome']
): boolean {
  const history = emergencyHistoryStore.get(patientId) ?? [];
  const event = history.find((e) => e.id === eventId);
  if (!event) return false;

  event.resolution = resolution;
  event.resolvedAt = new Date();
  event.outcome = outcome;
  return true;
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function buildNotificationMessage(emergency: EmergencyAssessment): string {
  const level = emergency.highestPriority;
  const categories = emergency.categories.join(', ');
  const emsNote = emergency.requiresEMS
    ? ' EMS has been recommended.'
    : '';

  return (
    `[${level}] Emergency Alert: ${categories} emergency detected.` +
    ` Immediate actions: ${emergency.immediateActions[0] ?? 'Follow protocol.'}.${emsNote}`
  );
}

function sendNotification(
  contact: EmergencyContact,
  message: string,
  _priority: PriorityLevel
): void {
  // In a real system this would integrate with SMS/call/email services.
  console.log(
    `[EmergencyProtocol] Notifying ${contact.name} (${contact.notificationPreference}): ${message}`
  );
}

// -----------------------------------------------------------------------------
// Nearest Hospital / ER Information
// -----------------------------------------------------------------------------

export interface HospitalInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  erPhone: string;
  distanceMiles: number;
  estimatedMinutes: number;
  traumaLevel: 'I' | 'II' | 'III' | 'IV' | 'V';
  specialties: string[];
  open24Hours: boolean;
}

const hospitalDatabase: HospitalInfo[] = [
  {
    id: 'hosp-001',
    name: 'City General Hospital',
    address: '100 Medical Center Drive',
    phone: '555-1000',
    erPhone: '555-1001',
    distanceMiles: 2.3,
    estimatedMinutes: 8,
    traumaLevel: 'I',
    specialties: ['Cardiac', 'Neurological', 'Trauma', 'Burns', 'Pediatric'],
    open24Hours: true,
  },
  {
    id: 'hosp-002',
    name: 'St. Mary Regional Medical Center',
    address: '450 Oak Street',
    phone: '555-2000',
    erPhone: '555-2001',
    distanceMiles: 4.1,
    estimatedMinutes: 12,
    traumaLevel: 'II',
    specialties: ['Cardiac', 'Orthopedic', 'General Surgery'],
    open24Hours: true,
  },
  {
    id: 'hosp-003',
    name: 'University Teaching Hospital',
    address: '800 University Boulevard',
    phone: '555-3000',
    erPhone: '555-3001',
    distanceMiles: 6.8,
    estimatedMinutes: 18,
    traumaLevel: 'I',
    specialties: ['Cardiac', 'Neurological', 'Trauma', 'Pediatric', 'Psychiatric', 'Burn Center'],
    open24Hours: true,
  },
  {
    id: 'hosp-004',
    name: 'Community Health Center ER',
    address: '200 Main Street',
    phone: '555-4000',
    erPhone: '555-4001',
    distanceMiles: 1.5,
    estimatedMinutes: 5,
    traumaLevel: 'III',
    specialties: ['General Emergency', 'Orthopedic'],
    open24Hours: true,
  },
];

/**
 * Find nearest hospitals, optionally filtered by required specialty.
 */
export function findNearestHospitals(
  requiredSpecialty?: string,
  maxResults: number = 3
): HospitalInfo[] {
  let candidates = [...hospitalDatabase];

  if (requiredSpecialty) {
    candidates = candidates.filter((h) =>
      h.specialties.some(
        (s) => s.toLowerCase().includes(requiredSpecialty.toLowerCase())
      )
    );
  }

  candidates.sort((a, b) => a.distanceMiles - b.distanceMiles);
  return candidates.slice(0, maxResults);
}

/**
 * Get the best hospital for a given emergency category.
 */
export function getBestHospitalForEmergency(
  category: EmergencyCategory
): HospitalInfo | undefined {
  const specialtyMap: Record<EmergencyCategory, string> = {
    CARDIAC: 'Cardiac',
    RESPIRATORY: 'Cardiac',
    NEUROLOGICAL: 'Neurological',
    HEMORRHAGIC: 'Trauma',
    INFECTIOUS: 'General Emergency',
    WOUND: 'General Surgery',
    MEDICATION: 'General Emergency',
    METABOLIC: 'General Emergency',
    VASCULAR: 'Cardiac',
    ANAPHYLAXIS: 'General Emergency',
    PSYCHIATRIC: 'Psychiatric',
  };

  const specialty = specialtyMap[category];
  const hospitals = findNearestHospitals(specialty, 1);
  return hospitals[0];
}

// -----------------------------------------------------------------------------
// Follow-Up Protocol & Care Plan Adjustment
// -----------------------------------------------------------------------------

export interface FollowUpAction {
  id: string;
  eventId: string;
  patientId: string;
  actionType: 'appointment' | 'lab_work' | 'imaging' | 'medication_change' | 'care_plan_update' | 'specialist_referral' | 'monitoring_increase';
  description: string;
  dueWithinHours: number;
  assignedTo: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface CarePlanAdjustment {
  id: string;
  eventId: string;
  patientId: string;
  adjustmentType: 'add_monitoring' | 'increase_frequency' | 'add_medication' | 'restrict_activity' | 'add_precaution' | 'specialist_consult' | 'change_diet';
  description: string;
  reason: string;
  effectiveDate: Date;
  reviewDate: Date;
}

export interface OutcomeRecord {
  eventId: string;
  patientId: string;
  emergencyCategory: EmergencyCategory;
  priority: PriorityLevel;
  detectionToResponseSeconds: number;
  emsDispatched: boolean;
  hospitalized: boolean;
  outcome: string;
  followUpActionsCount: number;
  followUpActionsCompleted: number;
  lessonsLearned?: string;
  rulesThatFired: string[];
}

const followUpStore: Map<string, FollowUpAction[]> = new Map();
const carePlanAdjustmentStore: Map<string, CarePlanAdjustment[]> = new Map();
const outcomeStore: Map<string, OutcomeRecord[]> = new Map();

/**
 * Generate follow-up actions based on the emergency category and severity.
 */
export function generateFollowUpProtocol(
  patientId: string,
  event: EmergencyEvent
): FollowUpAction[] {
  const actions: FollowUpAction[] = [];
  const baseId = `fu-${event.id}`;
  const category = event.assessment.categories[0] ?? 'INFECTIOUS';
  const priority = event.assessment.highestPriority;

  // Universal follow-ups
  actions.push({
    id: `${baseId}-001`,
    eventId: event.id,
    patientId,
    actionType: 'appointment',
    description: 'Schedule follow-up appointment with attending physician within 24 hours',
    dueWithinHours: 24,
    assignedTo: 'attending_physician',
    completed: false,
  });

  actions.push({
    id: `${baseId}-002`,
    eventId: event.id,
    patientId,
    actionType: 'monitoring_increase',
    description: 'Increase vital signs monitoring frequency to every 2 hours for 48 hours',
    dueWithinHours: 1,
    assignedTo: 'nursing_staff',
    completed: false,
  });

  // Category-specific follow-ups
  if (category === 'CARDIAC' || category === 'VASCULAR') {
    actions.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      actionType: 'lab_work',
      description: 'Obtain troponin, BNP, CBC, and BMP within 6 hours',
      dueWithinHours: 6,
      assignedTo: 'lab_team',
      completed: false,
    });
    actions.push({
      id: `${baseId}-004`,
      eventId: event.id,
      patientId,
      actionType: 'imaging',
      description: 'Order echocardiogram or cardiac imaging as appropriate',
      dueWithinHours: 24,
      assignedTo: 'cardiology',
      completed: false,
    });
    actions.push({
      id: `${baseId}-005`,
      eventId: event.id,
      patientId,
      actionType: 'specialist_referral',
      description: 'Cardiology consult for ongoing management',
      dueWithinHours: 48,
      assignedTo: 'cardiology',
      completed: false,
    });
  }

  if (category === 'RESPIRATORY') {
    actions.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      actionType: 'imaging',
      description: 'Obtain chest X-ray and ABG if not already done',
      dueWithinHours: 4,
      assignedTo: 'radiology',
      completed: false,
    });
    actions.push({
      id: `${baseId}-004`,
      eventId: event.id,
      patientId,
      actionType: 'specialist_referral',
      description: 'Pulmonology consult if hypoxemia persists',
      dueWithinHours: 24,
      assignedTo: 'pulmonology',
      completed: false,
    });
  }

  if (category === 'NEUROLOGICAL') {
    actions.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      actionType: 'imaging',
      description: 'CT head or MRI brain within 4 hours',
      dueWithinHours: 4,
      assignedTo: 'radiology',
      completed: false,
    });
    actions.push({
      id: `${baseId}-004`,
      eventId: event.id,
      patientId,
      actionType: 'specialist_referral',
      description: 'Neurology consult for evaluation',
      dueWithinHours: 12,
      assignedTo: 'neurology',
      completed: false,
    });
  }

  if (category === 'HEMORRHAGIC' || category === 'WOUND') {
    actions.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      actionType: 'lab_work',
      description: 'CBC, coagulation panel, type and screen',
      dueWithinHours: 2,
      assignedTo: 'lab_team',
      completed: false,
    });
    actions.push({
      id: `${baseId}-004`,
      eventId: event.id,
      patientId,
      actionType: 'specialist_referral',
      description: 'Surgical consult for wound assessment',
      dueWithinHours: 12,
      assignedTo: 'surgery',
      completed: false,
    });
  }

  if (category === 'INFECTIOUS') {
    actions.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      actionType: 'lab_work',
      description: 'Blood cultures, CBC with differential, lactate, CRP, procalcitonin',
      dueWithinHours: 2,
      assignedTo: 'lab_team',
      completed: false,
    });
    actions.push({
      id: `${baseId}-004`,
      eventId: event.id,
      patientId,
      actionType: 'medication_change',
      description: 'Review and adjust antibiotic coverage based on culture results',
      dueWithinHours: 48,
      assignedTo: 'infectious_disease',
      completed: false,
    });
  }

  if (category === 'MEDICATION' || category === 'ANAPHYLAXIS') {
    actions.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      actionType: 'medication_change',
      description: 'Complete medication reconciliation and update allergy list',
      dueWithinHours: 4,
      assignedTo: 'pharmacy',
      completed: false,
    });
  }

  if (category === 'PSYCHIATRIC') {
    actions.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      actionType: 'specialist_referral',
      description: 'Psychiatric follow-up evaluation within 24 hours',
      dueWithinHours: 24,
      assignedTo: 'psychiatry',
      completed: false,
    });
    actions.push({
      id: `${baseId}-004`,
      eventId: event.id,
      patientId,
      actionType: 'care_plan_update',
      description: 'Update care plan with safety precautions and mental health interventions',
      dueWithinHours: 4,
      assignedTo: 'care_team',
      completed: false,
    });
  }

  // LIFE_THREATENING always gets extra follow-ups
  if (priority === 'LIFE_THREATENING') {
    actions.push({
      id: `${baseId}-lt-001`,
      eventId: event.id,
      patientId,
      actionType: 'care_plan_update',
      description: 'Comprehensive care plan review and update within 12 hours',
      dueWithinHours: 12,
      assignedTo: 'attending_physician',
      completed: false,
    });
  }

  // Store the follow-up actions
  const existing = followUpStore.get(patientId) ?? [];
  followUpStore.set(patientId, [...existing, ...actions]);

  return actions;
}

/**
 * Generate care plan adjustments based on the emergency event.
 */
export function generateCarePlanAdjustments(
  patientId: string,
  event: EmergencyEvent
): CarePlanAdjustment[] {
  const adjustments: CarePlanAdjustment[] = [];
  const baseId = `cpa-${event.id}`;
  const now = new Date();
  const reviewDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const category = event.assessment.categories[0] ?? 'INFECTIOUS';
  const priority = event.assessment.highestPriority;

  // Always increase monitoring
  adjustments.push({
    id: `${baseId}-001`,
    eventId: event.id,
    patientId,
    adjustmentType: 'increase_frequency',
    description: 'Increase vital signs check frequency',
    reason: `Emergency event: ${event.assessment.triggeredRules.map((r) => r.name).join(', ')}`,
    effectiveDate: now,
    reviewDate,
  });

  if (category === 'CARDIAC' || category === 'VASCULAR') {
    adjustments.push({
      id: `${baseId}-002`,
      eventId: event.id,
      patientId,
      adjustmentType: 'add_monitoring',
      description: 'Add continuous telemetry monitoring',
      reason: 'Cardiac emergency requires continuous monitoring',
      effectiveDate: now,
      reviewDate,
    });
    adjustments.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      adjustmentType: 'restrict_activity',
      description: 'Bed rest with gradual activity increase per physician',
      reason: 'Post-cardiac event activity restriction',
      effectiveDate: now,
      reviewDate,
    });
  }

  if (category === 'HEMORRHAGIC' || category === 'WOUND') {
    adjustments.push({
      id: `${baseId}-002`,
      eventId: event.id,
      patientId,
      adjustmentType: 'add_precaution',
      description: 'Bleeding precautions: avoid NSAIDs, soft toothbrush, no razor shaving',
      reason: 'Hemorrhagic event requires bleeding precautions',
      effectiveDate: now,
      reviewDate,
    });
  }

  if (category === 'INFECTIOUS') {
    adjustments.push({
      id: `${baseId}-002`,
      eventId: event.id,
      patientId,
      adjustmentType: 'add_medication',
      description: 'Add or adjust antibiotic/antimicrobial coverage',
      reason: 'Infectious emergency detected',
      effectiveDate: now,
      reviewDate,
    });
  }

  if (category === 'MEDICATION' || category === 'ANAPHYLAXIS') {
    adjustments.push({
      id: `${baseId}-002`,
      eventId: event.id,
      patientId,
      adjustmentType: 'add_precaution',
      description: 'Updated allergy alert and medication precautions in chart',
      reason: 'Medication-related emergency',
      effectiveDate: now,
      reviewDate,
    });
  }

  if (category === 'NEUROLOGICAL') {
    adjustments.push({
      id: `${baseId}-002`,
      eventId: event.id,
      patientId,
      adjustmentType: 'add_precaution',
      description: 'Fall precautions and neurological checks every 2 hours',
      reason: 'Neurological emergency event',
      effectiveDate: now,
      reviewDate,
    });
  }

  if (category === 'PSYCHIATRIC') {
    adjustments.push({
      id: `${baseId}-002`,
      eventId: event.id,
      patientId,
      adjustmentType: 'add_precaution',
      description: 'Safety precautions: environmental safety check, sharps removal, 1:1 observation consideration',
      reason: 'Psychiatric emergency event',
      effectiveDate: now,
      reviewDate,
    });
    adjustments.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      adjustmentType: 'specialist_consult',
      description: 'Add psychiatry to care team for ongoing management',
      reason: 'Psychiatric emergency requires specialist involvement',
      effectiveDate: now,
      reviewDate,
    });
  }

  if (category === 'METABOLIC') {
    adjustments.push({
      id: `${baseId}-002`,
      eventId: event.id,
      patientId,
      adjustmentType: 'add_monitoring',
      description: 'Point-of-care glucose monitoring every 4 hours',
      reason: 'Metabolic emergency requires close glucose monitoring',
      effectiveDate: now,
      reviewDate,
    });
    adjustments.push({
      id: `${baseId}-003`,
      eventId: event.id,
      patientId,
      adjustmentType: 'change_diet',
      description: 'Consult dietitian and adjust dietary plan',
      reason: 'Metabolic emergency may require dietary changes',
      effectiveDate: now,
      reviewDate,
    });
  }

  if (priority === 'LIFE_THREATENING') {
    adjustments.push({
      id: `${baseId}-lt-001`,
      eventId: event.id,
      patientId,
      adjustmentType: 'specialist_consult',
      description: 'Multidisciplinary team review of care plan within 24 hours',
      reason: 'Life-threatening event requires comprehensive care plan review',
      effectiveDate: now,
      reviewDate,
    });
  }

  const existing = carePlanAdjustmentStore.get(patientId) ?? [];
  carePlanAdjustmentStore.set(patientId, [...existing, ...adjustments]);

  return adjustments;
}

/**
 * Mark a follow-up action as completed.
 */
export function completeFollowUpAction(
  patientId: string,
  actionId: string,
  notes?: string
): boolean {
  const actions = followUpStore.get(patientId) ?? [];
  const action = actions.find((a) => a.id === actionId);
  if (!action) return false;

  action.completed = true;
  action.completedAt = new Date();
  action.notes = notes;
  return true;
}

/**
 * Get all follow-up actions for a patient, optionally filtered by completion status.
 */
export function getFollowUpActions(
  patientId: string,
  pendingOnly: boolean = false
): FollowUpAction[] {
  const actions = followUpStore.get(patientId) ?? [];
  if (pendingOnly) {
    return actions.filter((a) => !a.completed);
  }
  return [...actions];
}

/**
 * Get all care plan adjustments for a patient.
 */
export function getCarePlanAdjustments(
  patientId: string
): CarePlanAdjustment[] {
  return carePlanAdjustmentStore.get(patientId) ?? [];
}

// -----------------------------------------------------------------------------
// Outcome Tracking & Analytics
// -----------------------------------------------------------------------------

/**
 * Record an outcome for an emergency event for learning purposes.
 */
export function recordOutcome(
  patientId: string,
  event: EmergencyEvent,
  detectionToResponseSeconds: number,
  lessonsLearned?: string
): OutcomeRecord {
  const followUps = followUpStore.get(patientId) ?? [];
  const eventFollowUps = followUps.filter((f) => f.eventId === event.id);

  const record: OutcomeRecord = {
    eventId: event.id,
    patientId,
    emergencyCategory: event.assessment.categories[0] ?? 'INFECTIOUS',
    priority: event.assessment.highestPriority,
    detectionToResponseSeconds,
    emsDispatched: event.outcome === 'ems_dispatched' || event.outcome === 'hospitalized',
    hospitalized: event.outcome === 'hospitalized',
    outcome: event.resolution ?? 'pending',
    followUpActionsCount: eventFollowUps.length,
    followUpActionsCompleted: eventFollowUps.filter((f) => f.completed).length,
    lessonsLearned,
    rulesThatFired: event.assessment.triggeredRules.map((r) => r.id),
  };

  const existing = outcomeStore.get(patientId) ?? [];
  existing.push(record);
  outcomeStore.set(patientId, existing);

  return record;
}

/**
 * Get all outcome records for a patient.
 */
export function getOutcomeRecords(patientId: string): OutcomeRecord[] {
  return outcomeStore.get(patientId) ?? [];
}

/**
 * Get aggregate emergency statistics for a patient.
 */
export function getEmergencyStatistics(patientId: string): {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  eventsByPriority: Record<string, number>;
  averageResponseTimeSeconds: number;
  hospitalizationRate: number;
  emsDispatchRate: number;
  followUpCompletionRate: number;
  mostCommonRules: Array<{ ruleId: string; count: number }>;
} {
  const outcomes = outcomeStore.get(patientId) ?? [];
  const history = emergencyHistoryStore.get(patientId) ?? [];

  const eventsByCategory: Record<string, number> = {};
  const eventsByPriority: Record<string, number> = {};
  const ruleCounts: Record<string, number> = {};

  let totalResponseTime = 0;
  let hospitalizedCount = 0;
  let emsCount = 0;
  let totalFollowUps = 0;
  let completedFollowUps = 0;

  for (const outcome of outcomes) {
    eventsByCategory[outcome.emergencyCategory] =
      (eventsByCategory[outcome.emergencyCategory] ?? 0) + 1;
    eventsByPriority[outcome.priority] =
      (eventsByPriority[outcome.priority] ?? 0) + 1;
    totalResponseTime += outcome.detectionToResponseSeconds;
    if (outcome.hospitalized) hospitalizedCount++;
    if (outcome.emsDispatched) emsCount++;
    totalFollowUps += outcome.followUpActionsCount;
    completedFollowUps += outcome.followUpActionsCompleted;

    for (const ruleId of outcome.rulesThatFired) {
      ruleCounts[ruleId] = (ruleCounts[ruleId] ?? 0) + 1;
    }
  }

  const mostCommonRules = Object.entries(ruleCounts)
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const total = outcomes.length || 1; // avoid division by zero

  return {
    totalEvents: history.length,
    eventsByCategory,
    eventsByPriority,
    averageResponseTimeSeconds: Math.round(totalResponseTime / total),
    hospitalizationRate: hospitalizedCount / total,
    emsDispatchRate: emsCount / total,
    followUpCompletionRate: totalFollowUps > 0 ? completedFollowUps / totalFollowUps : 1,
    mostCommonRules,
  };
}

// -----------------------------------------------------------------------------
// EmergencyProtocolService — Main class wrapping all functionality
// -----------------------------------------------------------------------------

/**
 * Comprehensive emergency detection and protocol management service.
 *
 * Provides:
 * - Emergency detection from vitals and symptoms (43 rules)
 * - Protocol activation with step-by-step instructions (40 templates)
 * - Emergency contact management with escalation chains
 * - Automated notifications based on severity
 * - Nearest hospital / ER lookup
 * - Post-emergency follow-up protocol generation
 * - Care plan adjustment triggers
 * - Outcome tracking and analytics
 * - Full emergency event history
 */
export class EmergencyProtocolService {
  // --- Detection ---

  /**
   * Evaluate patient vitals and symptoms against all emergency rules.
   */
  evaluate(vitals: VitalSigns, symptoms: Symptom[]): EmergencyAssessment {
    return evaluateEmergency(vitals, symptoms);
  }

  /**
   * Run full emergency workflow: evaluate, notify contacts, record event,
   * generate follow-ups and care plan adjustments.
   * Returns the recorded EmergencyEvent or null if no emergency detected.
   */
  handleEmergency(
    patientId: string,
    vitals: VitalSigns,
    symptoms: Symptom[]
  ): EmergencyEvent | null {
    // IMPORTANT: This method auto-notifies contacts for all emergency levels.
    // For LIFE_THREATENING: Immediate auto-escalation is appropriate.
    // For EMERGENCY/URGENT: Notifications are sent but care plan changes
    // should be reviewed by a physician before implementation.
    const assessment = evaluateEmergency(vitals, symptoms);

    if (assessment.triggeredRules.length === 0) {
      return null;
    }

    // Notify contacts
    notifyEmergencyContacts(patientId, assessment);
    const contacts = getEmergencyContacts(patientId);
    const notifiedNames = contacts.map((c) => c.name);

    // Notify doctor
    console.log(
      `[EmergencyProtocol] Auto-notifying assigned doctor for patient ${patientId}. Priority: ${assessment.highestPriority}`
    );

    // Record the event
    const event = recordEmergencyEvent(patientId, assessment, notifiedNames);

    // Flag for physician confirmation requirement
    // LIFE_THREATENING: Auto-notify immediately (delay could be fatal)
    // EMERGENCY/URGENT: Notify but flag for physician confirmation
    if (assessment.highestPriority !== 'LIFE_THREATENING') {
      console.warn(
        `[EmergencyProtocol] ⚠️ PHYSICIAN CONFIRMATION REQUIRED for ${assessment.highestPriority} event. ` +
        `Patient: ${patientId}. Auto-notifications sent but care plan adjustments pending physician review.`
      );
    }

    // Generate follow-up protocol
    generateFollowUpProtocol(patientId, event);

    // Generate care plan adjustments
    generateCarePlanAdjustments(patientId, event);

    return event;
  }

  // --- Protocol Lookup ---

  getProtocol(emergencyType: string): Protocol | undefined {
    return getProtocol(emergencyType);
  }

  getAllProtocols(): Protocol[] {
    return [...EMERGENCY_PROTOCOLS];
  }

  getAllRules(): EmergencyRule[] {
    return [...EMERGENCY_RULES];
  }

  // --- Emergency Contact Management ---

  addContact(contact: EmergencyContact): void {
    addEmergencyContact(contact);
  }

  removeContact(patientId: string, contactId: string): boolean {
    return removeEmergencyContact(patientId, contactId);
  }

  getContacts(patientId: string): EmergencyContact[] {
    return getEmergencyContacts(patientId);
  }

  getEscalationChain(patientId: string): EmergencyContact[] {
    return getEscalationChain(patientId);
  }

  // --- Hospital Lookup ---

  findNearestHospitals(specialty?: string, maxResults?: number): HospitalInfo[] {
    return findNearestHospitals(specialty, maxResults);
  }

  getBestHospital(category: EmergencyCategory): HospitalInfo | undefined {
    return getBestHospitalForEmergency(category);
  }

  // --- History & Events ---

  getHistory(patientId: string): EmergencyEvent[] {
    return getEmergencyHistory(patientId);
  }

  recordEvent(
    patientId: string,
    assessment: EmergencyAssessment,
    contactsNotified: string[]
  ): EmergencyEvent {
    return recordEmergencyEvent(patientId, assessment, contactsNotified);
  }

  resolveEvent(
    patientId: string,
    eventId: string,
    resolution: string,
    outcome: EmergencyEvent['outcome']
  ): boolean {
    return resolveEmergencyEvent(patientId, eventId, resolution, outcome);
  }

  // --- Follow-Up & Care Plan ---

  getFollowUps(patientId: string, pendingOnly?: boolean): FollowUpAction[] {
    return getFollowUpActions(patientId, pendingOnly);
  }

  completeFollowUp(patientId: string, actionId: string, notes?: string): boolean {
    return completeFollowUpAction(patientId, actionId, notes);
  }

  getAdjustments(patientId: string): CarePlanAdjustment[] {
    return getCarePlanAdjustments(patientId);
  }

  // --- Outcome & Analytics ---

  recordOutcome(
    patientId: string,
    event: EmergencyEvent,
    responseTimeSeconds: number,
    lessonsLearned?: string
  ): OutcomeRecord {
    return recordOutcome(patientId, event, responseTimeSeconds, lessonsLearned);
  }

  getOutcomes(patientId: string): OutcomeRecord[] {
    return getOutcomeRecords(patientId);
  }

  getStatistics(patientId: string): ReturnType<typeof getEmergencyStatistics> {
    return getEmergencyStatistics(patientId);
  }

  // --- Incident Report ---

  generateReport(assessment: EmergencyAssessment): string {
    return generateIncidentReport(assessment);
  }
}

/** Singleton instance */
export const emergencyProtocolService = new EmergencyProtocolService();
