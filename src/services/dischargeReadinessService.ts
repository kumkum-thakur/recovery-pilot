/**
 * Discharge Readiness Assessment Service
 *
 * Comprehensive discharge planning with multi-criteria readiness scoring,
 * checklist auto-generation, discharge summary documents, post-discharge
 * monitoring schedules, and readmission risk prevention.
 *
 * Features:
 *  - 12 readiness criteria each scored 0-100%
 *  - Weighted composite readiness score with tiered classification
 *  - Discharge checklist auto-generation from care plan
 *  - Discharge summary document generation (medications, restrictions, warnings, follow-ups)
 *  - Post-discharge 30-day monitoring schedule
 *  - Readmission risk prevention targeting
 *  - Realistic assessment data for 30 patients
 *
 * No external dependencies.
 */

// ============================================================================
// Constants & Enums (const-object pattern for erasableSyntaxOnly compatibility)
// ============================================================================

export const ReadinessLevel = {
  NOT_READY: 'not_ready',
  APPROACHING: 'approaching',
  READY_WITH_CONDITIONS: 'ready_with_conditions',
  FULLY_READY: 'fully_ready',
} as const;
export type ReadinessLevel = typeof ReadinessLevel[keyof typeof ReadinessLevel];

export const ChecklistItemStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  NOT_APPLICABLE: 'not_applicable',
} as const;
export type ChecklistItemStatus = typeof ChecklistItemStatus[keyof typeof ChecklistItemStatus];

export const ChecklistCategory = {
  CLINICAL: 'clinical',
  MEDICATION: 'medication',
  EDUCATION: 'education',
  LOGISTICS: 'logistics',
  FOLLOW_UP: 'follow_up',
  SAFETY: 'safety',
} as const;
export type ChecklistCategory = typeof ChecklistCategory[keyof typeof ChecklistCategory];

export const MonitoringPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type MonitoringPriority = typeof MonitoringPriority[keyof typeof MonitoringPriority];

export const RiskLevel = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
} as const;
export type RiskLevel = typeof RiskLevel[keyof typeof RiskLevel];

export const SurgeryType = {
  KNEE_REPLACEMENT: 'knee_replacement',
  HIP_REPLACEMENT: 'hip_replacement',
  CARDIAC_BYPASS: 'cardiac_bypass',
  APPENDECTOMY: 'appendectomy',
  SPINAL_FUSION: 'spinal_fusion',
  HERNIA_REPAIR: 'hernia_repair',
} as const;
export type SurgeryType = typeof SurgeryType[keyof typeof SurgeryType];

export const ActivityRestrictionLevel = {
  BED_REST: 'bed_rest',
  MINIMAL_ACTIVITY: 'minimal_activity',
  LIGHT_ACTIVITY: 'light_activity',
  MODERATE_ACTIVITY: 'moderate_activity',
  NORMAL_ACTIVITY: 'normal_activity',
} as const;
export type ActivityRestrictionLevel = typeof ActivityRestrictionLevel[keyof typeof ActivityRestrictionLevel];

export const ContactType = {
  PRIMARY_SURGEON: 'primary_surgeon',
  PRIMARY_CARE: 'primary_care',
  SPECIALIST: 'specialist',
  NURSE_HOTLINE: 'nurse_hotline',
  EMERGENCY: 'emergency',
  PHARMACY: 'pharmacy',
  PHYSICAL_THERAPY: 'physical_therapy',
} as const;
export type ContactType = typeof ContactType[keyof typeof ContactType];

// ============================================================================
// Readiness Criteria Definitions
// ============================================================================

export const READINESS_CRITERIA = {
  pain_controlled: {
    id: 'pain_controlled',
    name: 'Pain Controlled',
    description: 'Pain is manageable with oral medications and patient understands pain management plan',
    weight: 0.12,
    minAcceptable: 60,
  },
  wound_healing: {
    id: 'wound_healing',
    name: 'Wound Healing',
    description: 'Surgical wound is healing without signs of infection, drainage is minimal',
    weight: 0.12,
    minAcceptable: 70,
  },
  vitals_stable: {
    id: 'vitals_stable',
    name: 'Vitals Stable',
    description: 'Temperature, blood pressure, heart rate, and oxygen saturation within normal limits',
    weight: 0.12,
    minAcceptable: 75,
  },
  adequate_mobility: {
    id: 'adequate_mobility',
    name: 'Adequate Mobility',
    description: 'Patient can ambulate safely with or without assistive devices as appropriate',
    weight: 0.10,
    minAcceptable: 50,
  },
  medication_understanding: {
    id: 'medication_understanding',
    name: 'Medication Understanding',
    description: 'Patient demonstrates understanding of all discharge medications, dosages, and timing',
    weight: 0.08,
    minAcceptable: 70,
  },
  followup_scheduled: {
    id: 'followup_scheduled',
    name: 'Follow-up Scheduled',
    description: 'All necessary follow-up appointments have been scheduled and confirmed',
    weight: 0.08,
    minAcceptable: 80,
  },
  home_support: {
    id: 'home_support',
    name: 'Home Support',
    description: 'Adequate caregiver support and home environment assessed as safe for recovery',
    weight: 0.08,
    minAcceptable: 60,
  },
  education_completed: {
    id: 'education_completed',
    name: 'Education Completed',
    description: 'Patient and caregiver have received all necessary discharge education and instructions',
    weight: 0.07,
    minAcceptable: 70,
  },
  equipment_arranged: {
    id: 'equipment_arranged',
    name: 'Equipment Arranged',
    description: 'All required medical equipment and supplies have been ordered and delivery confirmed',
    weight: 0.06,
    minAcceptable: 80,
  },
  transportation: {
    id: 'transportation',
    name: 'Transportation',
    description: 'Safe transportation from hospital to home has been arranged',
    weight: 0.05,
    minAcceptable: 90,
  },
  mental_health_screen: {
    id: 'mental_health_screen',
    name: 'Mental Health Screen',
    description: 'Patient has been screened for depression, anxiety, and delirium; appropriate referrals made',
    weight: 0.06,
    minAcceptable: 60,
  },
  nutrition_adequate: {
    id: 'nutrition_adequate',
    name: 'Nutrition Adequate',
    description: 'Patient tolerating adequate oral intake and nutritional needs addressed',
    weight: 0.06,
    minAcceptable: 60,
  },
} as const;

export type CriterionId = keyof typeof READINESS_CRITERIA;

// ============================================================================
// Interfaces
// ============================================================================

export interface CriterionScore {
  criterionId: CriterionId;
  score: number; // 0-100
  notes: string;
  assessedAt: string;
  assessedBy: string;
}

export interface ReadinessAssessment {
  id: string;
  patientId: string;
  assessedAt: string;
  assessedBy: string;
  criteriaScores: CriterionScore[];
  overallScore: number; // 0-100, weighted composite
  readinessLevel: ReadinessLevel;
  blockingCriteria: CriterionId[]; // criteria below minimum acceptable
  recommendations: string[];
  estimatedDischargeDate: string | null;
  readmissionRiskScore: number; // 0-100
  readmissionRiskLevel: RiskLevel;
}

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  description: string;
  status: ChecklistItemStatus;
  assignedTo: string;
  dueDate: string | null;
  completedAt: string | null;
  notes: string;
  required: boolean;
}

export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  purpose: string;
  specialInstructions: string;
  startDate: string;
  endDate: string | null;
  prescribedBy: string;
}

export interface ActivityRestriction {
  activity: string;
  restriction: string;
  duration: string;
  level: ActivityRestrictionLevel;
}

export interface WarningSign {
  sign: string;
  severity: 'seek_immediate_care' | 'call_doctor_today' | 'monitor_closely';
  description: string;
}

export interface FollowUpAppointment {
  provider: string;
  specialty: string;
  scheduledDate: string;
  location: string;
  purpose: string;
  preparations: string[];
}

export interface EmergencyContact {
  name: string;
  role: ContactType;
  phone: string;
  available: string;
}

export interface DischargeSummary {
  id: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  dischargeDate: string;
  surgeryType: SurgeryType;
  surgeryDate: string;
  primarySurgeon: string;
  diagnosisSummary: string;
  procedureSummary: string;
  hospitalCourseSummary: string;
  medications: MedicationEntry[];
  activityRestrictions: ActivityRestriction[];
  dietaryInstructions: string[];
  woundCareInstructions: string[];
  warningSignsRequiringAttention: WarningSign[];
  followUpSchedule: FollowUpAppointment[];
  emergencyContacts: EmergencyContact[];
  specialInstructions: string[];
  generatedAt: string;
}

export interface MonitoringCheckpoint {
  day: number;
  date: string;
  type: 'phone_call' | 'video_visit' | 'in_person' | 'app_check_in' | 'lab_work';
  priority: MonitoringPriority;
  focusAreas: string[];
  questionsToAsk: string[];
  vitalsToCheck: string[];
  escalationTriggers: string[];
}

export interface MonitoringPlan {
  id: string;
  patientId: string;
  startDate: string;
  endDate: string;
  riskLevel: RiskLevel;
  checkpoints: MonitoringCheckpoint[];
  readmissionRiskFactors: string[];
  preventionStrategies: string[];
  escalationProtocol: string[];
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  surgeryType: SurgeryType;
  surgeryDate: string;
  admissionDate: string;
  comorbidities: string[];
  medications: string[];
  postOpDay: number;
}

// ============================================================================
// Internal Data Store
// ============================================================================

const assessmentStore: Map<string, ReadinessAssessment[]> = new Map();
const checklistStore: Map<string, ChecklistItem[]> = new Map();
const summaryStore: Map<string, DischargeSummary> = new Map();
const monitoringStore: Map<string, MonitoringPlan> = new Map();

// ============================================================================
// Seeded Pseudo-Random Number Generator
// ============================================================================

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function seededChoice<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function seededInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ============================================================================
// Helper: Generate IDs
// ============================================================================

let idCounter = 0;
function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

// ============================================================================
// Patient Profile Database (30 patients)
// ============================================================================

const PATIENT_NAMES = [
  'James Wilson', 'Maria Garcia', 'Robert Chen', 'Sarah Johnson', 'Ahmed Hassan',
  'Emily Brown', 'David Kim', 'Lisa Anderson', 'Michael Okafor', 'Jennifer Taylor',
  'Thomas Martinez', 'Amanda White', 'Christopher Lee', 'Michelle Davis', 'Daniel Wright',
  'Jessica Thompson', 'Andrew Robinson', 'Stephanie Clark', 'Joshua Hall', 'Nicole Young',
  'Kevin Hernandez', 'Laura King', 'Brian Scott', 'Rachel Adams', 'Patrick Nelson',
  'Samantha Hill', 'Ryan Mitchell', 'Megan Carter', 'Jason Phillips', 'Heather Evans',
];

const SURGERY_TYPES_LIST: SurgeryType[] = [
  SurgeryType.KNEE_REPLACEMENT,
  SurgeryType.HIP_REPLACEMENT,
  SurgeryType.CARDIAC_BYPASS,
  SurgeryType.APPENDECTOMY,
  SurgeryType.SPINAL_FUSION,
  SurgeryType.HERNIA_REPAIR,
];

const COMORBIDITIES_LIST = [
  'hypertension', 'type_2_diabetes', 'obesity', 'copd', 'atrial_fibrillation',
  'chronic_kidney_disease', 'depression', 'osteoarthritis', 'asthma', 'hypothyroidism',
  'hyperlipidemia', 'gerd', 'sleep_apnea', 'peripheral_neuropathy', 'anemia',
];

const COMMON_MEDICATIONS = [
  'lisinopril', 'metformin', 'atorvastatin', 'omeprazole', 'levothyroxine',
  'amlodipine', 'metoprolol', 'gabapentin', 'sertraline', 'acetaminophen',
  'ibuprofen', 'oxycodone', 'warfarin', 'aspirin', 'furosemide',
];

function generatePatientProfiles(): PatientProfile[] {
  const rng = seededRng(42);
  const profiles: PatientProfile[] = [];
  const baseDate = new Date('2025-01-15');

  for (let i = 0; i < 30; i++) {
    const surgeryType = SURGERY_TYPES_LIST[i % SURGERY_TYPES_LIST.length];
    const age = seededInt(35, 78, rng);
    const postOpDay = seededInt(2, 14, rng);
    const surgeryDate = new Date(baseDate);
    surgeryDate.setDate(surgeryDate.getDate() - postOpDay);
    const admissionDate = new Date(surgeryDate);
    admissionDate.setDate(admissionDate.getDate() - 1);

    const numComorbidities = seededInt(0, 4, rng);
    const comorbidities: string[] = [];
    for (let c = 0; c < numComorbidities; c++) {
      const cond = seededChoice(COMORBIDITIES_LIST, rng);
      if (!comorbidities.includes(cond)) comorbidities.push(cond);
    }

    const numMeds = seededInt(1, 5, rng);
    const medications: string[] = [];
    for (let m = 0; m < numMeds; m++) {
      const med = seededChoice(COMMON_MEDICATIONS, rng);
      if (!medications.includes(med)) medications.push(med);
    }

    profiles.push({
      id: `patient-${i + 1}`,
      name: PATIENT_NAMES[i],
      age,
      surgeryType,
      surgeryDate: surgeryDate.toISOString().split('T')[0],
      admissionDate: admissionDate.toISOString().split('T')[0],
      comorbidities,
      medications,
      postOpDay,
    });
  }

  return profiles;
}

const PATIENT_PROFILES = generatePatientProfiles();

// ============================================================================
// Surgery-Specific Configuration
// ============================================================================

interface SurgeryConfig {
  typicalStayDays: [number, number]; // [min, max]
  requiredEquipment: string[];
  commonRestrictions: ActivityRestriction[];
  warningSignsList: WarningSign[];
  dietaryInstructions: string[];
  woundCareInstructions: string[];
  followUpSchedule: Array<{ weeksPostOp: number; provider: string; specialty: string; purpose: string }>;
}

const SURGERY_CONFIGS: Record<SurgeryType, SurgeryConfig> = {
  [SurgeryType.KNEE_REPLACEMENT]: {
    typicalStayDays: [2, 4],
    requiredEquipment: ['CPM machine', 'ice therapy unit', 'elevated toilet seat', 'walker', 'grab bars', 'compression stockings'],
    commonRestrictions: [
      { activity: 'Running and jumping', restriction: 'Avoid completely', duration: '6 months', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
      { activity: 'Stair climbing', restriction: 'Limit to once daily, use handrail', duration: '4 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Driving', restriction: 'No driving', duration: '4-6 weeks or until cleared by surgeon', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Kneeling', restriction: 'Avoid kneeling on operative knee', duration: '3 months', level: ActivityRestrictionLevel.MODERATE_ACTIVITY },
      { activity: 'Lifting', restriction: 'No lifting over 10 lbs', duration: '6 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
    ],
    warningSignsList: [
      { sign: 'Fever above 101.5F (38.6C)', severity: 'seek_immediate_care', description: 'May indicate wound infection or deep vein thrombosis' },
      { sign: 'Increasing redness, swelling, or drainage from incision', severity: 'call_doctor_today', description: 'Could indicate wound infection' },
      { sign: 'Sudden calf pain or swelling', severity: 'seek_immediate_care', description: 'Possible deep vein thrombosis (DVT), a serious complication' },
      { sign: 'Chest pain or shortness of breath', severity: 'seek_immediate_care', description: 'Could indicate pulmonary embolism - call 911' },
      { sign: 'Increased pain not relieved by prescribed medication', severity: 'call_doctor_today', description: 'May need medication adjustment or evaluation' },
      { sign: 'Numbness or tingling in foot or toes', severity: 'call_doctor_today', description: 'Could indicate nerve compression or circulation issue' },
    ],
    dietaryInstructions: [
      'High-protein diet (1.2-1.5g/kg/day) to support tissue healing',
      'Increase fiber intake to prevent constipation from pain medications',
      'Stay hydrated - aim for 8-10 glasses of water daily',
      'Include iron-rich foods to support blood cell recovery',
      'Vitamin C-rich fruits and vegetables to support wound healing',
    ],
    woundCareInstructions: [
      'Keep incision clean and dry for first 48 hours after discharge',
      'Change dressing daily or as instructed using sterile technique',
      'Do not submerge incision in water (no baths, pools) for 4 weeks',
      'Showers permitted 48 hours after discharge with waterproof dressing',
      'Monitor incision daily for signs of infection (redness, warmth, drainage)',
      'Staples/sutures will be removed at 2-week follow-up appointment',
    ],
    followUpSchedule: [
      { weeksPostOp: 2, provider: 'Dr. Sarah Smith', specialty: 'Orthopedic Surgery', purpose: 'Wound check and staple removal' },
      { weeksPostOp: 6, provider: 'Dr. Sarah Smith', specialty: 'Orthopedic Surgery', purpose: 'X-ray and progress assessment' },
      { weeksPostOp: 12, provider: 'Dr. Sarah Smith', specialty: 'Orthopedic Surgery', purpose: 'Range of motion and strength evaluation' },
    ],
  },

  [SurgeryType.HIP_REPLACEMENT]: {
    typicalStayDays: [2, 4],
    requiredEquipment: ['elevated toilet seat', 'hip precaution kit', 'reacher/grabber', 'walker', 'long-handled shoe horn', 'compression stockings'],
    commonRestrictions: [
      { activity: 'Hip flexion beyond 90 degrees', restriction: 'Strict avoidance - no bending past waist level', duration: '6-12 weeks', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
      { activity: 'Crossing legs', restriction: 'Do not cross legs at any time', duration: '12 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Driving', restriction: 'No driving', duration: '6 weeks or until cleared', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Twisting at waist', restriction: 'Avoid internal rotation of hip', duration: '12 weeks', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
      { activity: 'Lifting', restriction: 'No lifting over 15 lbs', duration: '6 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
    ],
    warningSignsList: [
      { sign: 'Hip feels like it slipped out of place', severity: 'seek_immediate_care', description: 'Possible hip dislocation - do not attempt to reset' },
      { sign: 'Fever above 101.5F', severity: 'seek_immediate_care', description: 'May indicate infection around prosthetic joint' },
      { sign: 'Leg appears shorter or rotated differently', severity: 'seek_immediate_care', description: 'Sign of possible dislocation' },
      { sign: 'Sudden calf pain or swelling', severity: 'seek_immediate_care', description: 'Possible DVT requiring immediate treatment' },
      { sign: 'Wound drainage that is cloudy or foul-smelling', severity: 'call_doctor_today', description: 'Possible wound infection' },
      { sign: 'Inability to bear weight or sudden increase in pain', severity: 'call_doctor_today', description: 'Could indicate prosthetic complication' },
    ],
    dietaryInstructions: [
      'High-protein diet to promote healing (1.2-1.5g/kg/day)',
      'Calcium and Vitamin D supplements as directed for bone health',
      'Increase fiber and fluid intake to prevent constipation',
      'Iron-rich foods to replenish blood loss from surgery',
      'Limit alcohol as it can interfere with medications and healing',
    ],
    woundCareInstructions: [
      'Keep surgical dressing intact for 48 hours unless soiled',
      'After dressing removal, keep wound clean and dry',
      'Apply new sterile dressing daily for 10-14 days',
      'No soaking in bath, pool, or hot tub for 6 weeks',
      'Watch for spreading redness, warmth, or increased drainage',
      'Staples typically removed at 2-week follow-up visit',
    ],
    followUpSchedule: [
      { weeksPostOp: 2, provider: 'Dr. Sarah Smith', specialty: 'Orthopedic Surgery', purpose: 'Wound assessment and staple removal' },
      { weeksPostOp: 6, provider: 'Dr. Sarah Smith', specialty: 'Orthopedic Surgery', purpose: 'X-ray evaluation and hip precaution review' },
      { weeksPostOp: 12, provider: 'Dr. Sarah Smith', specialty: 'Orthopedic Surgery', purpose: 'Functional assessment and return to activities' },
    ],
  },

  [SurgeryType.CARDIAC_BYPASS]: {
    typicalStayDays: [5, 8],
    requiredEquipment: ['sternal precaution pillow', 'incentive spirometer', 'blood pressure monitor', 'pulse oximeter', 'compression stockings', 'scale for daily weight'],
    commonRestrictions: [
      { activity: 'Lifting', restriction: 'No lifting, pushing, or pulling over 5 lbs', duration: '8-12 weeks (sternal precautions)', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
      { activity: 'Driving', restriction: 'No driving', duration: '6-8 weeks or until cleared by cardiologist', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
      { activity: 'Raising arms above head', restriction: 'Avoid reaching overhead', duration: '6 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Sexual activity', restriction: 'Resume only when able to climb two flights of stairs without symptoms', duration: '4-6 weeks', level: ActivityRestrictionLevel.MODERATE_ACTIVITY },
      { activity: 'Housework', restriction: 'Light housework only, no vacuuming or mopping', duration: '8 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
    ],
    warningSignsList: [
      { sign: 'Chest pain different from incisional pain', severity: 'seek_immediate_care', description: 'May indicate graft occlusion - call 911' },
      { sign: 'Sudden shortness of breath or difficulty breathing', severity: 'seek_immediate_care', description: 'Possible heart failure, pleural effusion, or PE' },
      { sign: 'Rapid weight gain (>2 lbs/day or >5 lbs/week)', severity: 'call_doctor_today', description: 'Fluid retention suggesting heart failure' },
      { sign: 'Sternal wound clicking, shifting, or drainage', severity: 'call_doctor_today', description: 'Possible sternal dehiscence or infection' },
      { sign: 'New irregular heartbeat or palpitations', severity: 'call_doctor_today', description: 'Common after cardiac surgery but needs monitoring' },
      { sign: 'Fever above 101F', severity: 'call_doctor_today', description: 'Could indicate wound or systemic infection' },
      { sign: 'Leg wound redness or swelling (vein harvest site)', severity: 'call_doctor_today', description: 'Possible infection at vein harvest site' },
    ],
    dietaryInstructions: [
      'Heart-healthy diet: low sodium (<2000mg/day), low saturated fat',
      'Increase omega-3 fatty acids (fish, walnuts, flaxseed)',
      'Limit fluid intake if instructed (typically 2 liters/day)',
      'Small, frequent meals to reduce cardiac workload',
      'High potassium foods if on diuretics (bananas, oranges, potatoes)',
      'Avoid grapefruit if taking statins or calcium channel blockers',
    ],
    woundCareInstructions: [
      'Keep chest and leg incisions clean and dry',
      'Shower gently, let water run over incisions, pat dry',
      'Do not apply creams, ointments, or powders to incisions',
      'Wear supportive bra if applicable to reduce sternal tension',
      'Use sternal precaution pillow when coughing or getting up',
      'Monitor all incision sites daily for signs of infection',
      'Report any separation, drainage, or clicking of chest wound',
    ],
    followUpSchedule: [
      { weeksPostOp: 1, provider: 'Cardiac Rehab Team', specialty: 'Cardiac Rehabilitation', purpose: 'Phase II cardiac rehabilitation enrollment' },
      { weeksPostOp: 2, provider: 'Dr. Robert Chen', specialty: 'Cardiothoracic Surgery', purpose: 'Wound check and recovery assessment' },
      { weeksPostOp: 4, provider: 'Dr. Lisa Anderson', specialty: 'Cardiology', purpose: 'Cardiac function assessment, echocardiogram' },
      { weeksPostOp: 8, provider: 'Dr. Robert Chen', specialty: 'Cardiothoracic Surgery', purpose: 'Final surgical follow-up, activity clearance' },
      { weeksPostOp: 12, provider: 'Dr. Lisa Anderson', specialty: 'Cardiology', purpose: 'Stress test and long-term management plan' },
    ],
  },

  [SurgeryType.APPENDECTOMY]: {
    typicalStayDays: [1, 3],
    requiredEquipment: ['abdominal binder (optional)', 'thermometer'],
    commonRestrictions: [
      { activity: 'Lifting', restriction: 'No lifting over 10 lbs', duration: '2-4 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Core exercises', restriction: 'Avoid abdominal crunches and sit-ups', duration: '4-6 weeks', level: ActivityRestrictionLevel.MODERATE_ACTIVITY },
      { activity: 'Driving', restriction: 'No driving while on narcotic pain medication', duration: '1-2 weeks', level: ActivityRestrictionLevel.MODERATE_ACTIVITY },
      { activity: 'Swimming', restriction: 'No swimming or submerging incisions', duration: '2-3 weeks', level: ActivityRestrictionLevel.MODERATE_ACTIVITY },
    ],
    warningSignsList: [
      { sign: 'Fever above 101F', severity: 'seek_immediate_care', description: 'Possible abscess or peritonitis' },
      { sign: 'Increasing abdominal pain or rigidity', severity: 'seek_immediate_care', description: 'Could indicate abscess formation or leak' },
      { sign: 'Persistent nausea and vomiting', severity: 'call_doctor_today', description: 'May indicate ileus or bowel obstruction' },
      { sign: 'Redness or discharge from incision sites', severity: 'call_doctor_today', description: 'Possible wound infection' },
      { sign: 'Unable to pass gas or have bowel movement for >3 days', severity: 'call_doctor_today', description: 'Possible ileus requiring evaluation' },
    ],
    dietaryInstructions: [
      'Start with clear liquids, advance to regular diet as tolerated',
      'Small, frequent meals to reduce digestive stress',
      'High-fiber foods once tolerating regular diet to prevent constipation',
      'Stay well hydrated with at least 8 glasses of water daily',
      'Avoid gas-producing foods initially (beans, carbonated beverages)',
    ],
    woundCareInstructions: [
      'Laparoscopic incisions: keep Steri-Strips in place until they fall off naturally',
      'Keep incisions clean and dry for 48 hours',
      'Shower permitted after 48 hours, pat incisions dry',
      'Do not scrub incisions or remove adhesive strips',
      'Monitor for increasing redness, swelling, or drainage',
    ],
    followUpSchedule: [
      { weeksPostOp: 2, provider: 'Dr. Sarah Smith', specialty: 'General Surgery', purpose: 'Wound check and pathology review' },
      { weeksPostOp: 6, provider: 'Dr. Sarah Smith', specialty: 'General Surgery', purpose: 'Final follow-up and activity clearance' },
    ],
  },

  [SurgeryType.SPINAL_FUSION]: {
    typicalStayDays: [3, 6],
    requiredEquipment: ['back brace/LSO', 'log-rolling pillows', 'reacher/grabber', 'elevated toilet seat', 'shower chair', 'bone growth stimulator (if prescribed)'],
    commonRestrictions: [
      { activity: 'Bending at waist', restriction: 'No BLT (bending, lifting, twisting)', duration: '6-12 weeks', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
      { activity: 'Lifting', restriction: 'No lifting over 5 lbs', duration: '12 weeks', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
      { activity: 'Sitting for prolonged periods', restriction: 'Limit sitting to 30 minutes, then stand/walk', duration: '6 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Driving', restriction: 'No driving', duration: '6-12 weeks or until cleared', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
      { activity: 'Twisting', restriction: 'No twisting or rotating spine', duration: '12 weeks', level: ActivityRestrictionLevel.MINIMAL_ACTIVITY },
    ],
    warningSignsList: [
      { sign: 'New or worsening numbness/weakness in legs', severity: 'seek_immediate_care', description: 'Possible nerve compression or hardware complication' },
      { sign: 'Loss of bowel or bladder control', severity: 'seek_immediate_care', description: 'Possible cauda equina syndrome - emergency' },
      { sign: 'Fever above 101F', severity: 'seek_immediate_care', description: 'Possible spinal infection (discitis)' },
      { sign: 'Increasing back pain not responsive to medication', severity: 'call_doctor_today', description: 'Could indicate hardware issue or non-union' },
      { sign: 'Wound drainage or opening', severity: 'call_doctor_today', description: 'Risk of deep spinal infection' },
      { sign: 'Difficulty breathing or swallowing (cervical fusion)', severity: 'seek_immediate_care', description: 'Possible swelling affecting airway' },
    ],
    dietaryInstructions: [
      'High-protein diet for bone and tissue healing (1.5g/kg/day)',
      'Calcium supplement 1200mg daily plus Vitamin D 1000 IU',
      'Avoid NSAIDs (ibuprofen, naproxen) as they may impede bone fusion',
      'High-fiber diet to prevent constipation from opioid medications',
      'Adequate hydration - minimum 64 oz water daily',
      'No smoking or nicotine products as they severely impede bone fusion',
    ],
    woundCareInstructions: [
      'Keep incision dressing dry and intact for 72 hours',
      'After dressing removal, keep incision clean and dry',
      'Wear back brace as instructed during all upright activity',
      'No soaking incision for 4 weeks minimum',
      'Use log-roll technique when getting in and out of bed',
      'Monitor for signs of infection: redness, drainage, increased warmth',
    ],
    followUpSchedule: [
      { weeksPostOp: 2, provider: 'Dr. Michael Okafor', specialty: 'Spine Surgery', purpose: 'Wound check and pain management review' },
      { weeksPostOp: 6, provider: 'Dr. Michael Okafor', specialty: 'Spine Surgery', purpose: 'X-ray to assess hardware and early fusion' },
      { weeksPostOp: 12, provider: 'Dr. Michael Okafor', specialty: 'Spine Surgery', purpose: 'CT scan to evaluate fusion progress, activity advancement' },
      { weeksPostOp: 26, provider: 'Dr. Michael Okafor', specialty: 'Spine Surgery', purpose: 'Six-month follow-up with imaging' },
    ],
  },

  [SurgeryType.HERNIA_REPAIR]: {
    typicalStayDays: [0, 2],
    requiredEquipment: ['abdominal binder', 'ice pack', 'scrotal support (if inguinal)'],
    commonRestrictions: [
      { activity: 'Lifting', restriction: 'No lifting over 10-15 lbs', duration: '4-6 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Straining', restriction: 'Avoid straining during bowel movements, use stool softener', duration: '4 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
      { activity: 'Driving', restriction: 'No driving while on pain medication', duration: '1-2 weeks', level: ActivityRestrictionLevel.MODERATE_ACTIVITY },
      { activity: 'Exercise', restriction: 'Walking only, no vigorous exercise', duration: '4-6 weeks', level: ActivityRestrictionLevel.LIGHT_ACTIVITY },
    ],
    warningSignsList: [
      { sign: 'Fever above 101F', severity: 'seek_immediate_care', description: 'Possible mesh or wound infection' },
      { sign: 'Increasing swelling, redness, or warmth at surgical site', severity: 'call_doctor_today', description: 'Could indicate seroma, hematoma, or infection' },
      { sign: 'Severe pain not controlled by prescribed medication', severity: 'call_doctor_today', description: 'May indicate complication requiring evaluation' },
      { sign: 'Inability to urinate', severity: 'seek_immediate_care', description: 'Possible urinary retention requiring catheterization' },
      { sign: 'Nausea and vomiting preventing fluid intake', severity: 'call_doctor_today', description: 'May need IV hydration and anti-nausea medication' },
    ],
    dietaryInstructions: [
      'Start with light, bland foods and advance as tolerated',
      'High-fiber diet to prevent constipation and straining',
      'Stay well hydrated to promote healing and prevent constipation',
      'Adequate protein intake for wound healing',
      'Avoid carbonated beverages if experiencing abdominal distension',
    ],
    woundCareInstructions: [
      'Keep surgical dressing in place for 24-48 hours',
      'After removal, keep incisions clean and dry',
      'Laparoscopic: Steri-Strips will fall off in 7-10 days',
      'Open repair: sutures/staples removed at follow-up',
      'Ice the area for 20 minutes on/20 minutes off for first 48 hours',
      'Wear abdominal binder for comfort as directed',
    ],
    followUpSchedule: [
      { weeksPostOp: 2, provider: 'Dr. Sarah Smith', specialty: 'General Surgery', purpose: 'Wound assessment and recovery check' },
      { weeksPostOp: 6, provider: 'Dr. Sarah Smith', specialty: 'General Surgery', purpose: 'Final follow-up and return to activity clearance' },
    ],
  },
};

// ============================================================================
// Readmission Risk Assessment
// ============================================================================

interface RiskFactor {
  factor: string;
  weight: number;
  check: (patient: PatientProfile, scores: CriterionScore[]) => boolean;
}

const READMISSION_RISK_FACTORS: RiskFactor[] = [
  {
    factor: 'Age over 65',
    weight: 8,
    check: (p) => p.age > 65,
  },
  {
    factor: 'Multiple comorbidities (3+)',
    weight: 12,
    check: (p) => p.comorbidities.length >= 3,
  },
  {
    factor: 'Diabetes',
    weight: 7,
    check: (p) => p.comorbidities.includes('type_2_diabetes'),
  },
  {
    factor: 'Heart failure or cardiac history',
    weight: 10,
    check: (p) => p.comorbidities.includes('atrial_fibrillation') || p.surgeryType === SurgeryType.CARDIAC_BYPASS,
  },
  {
    factor: 'Chronic kidney disease',
    weight: 9,
    check: (p) => p.comorbidities.includes('chronic_kidney_disease'),
  },
  {
    factor: 'COPD',
    weight: 8,
    check: (p) => p.comorbidities.includes('copd'),
  },
  {
    factor: 'Depression or mental health concern',
    weight: 6,
    check: (p) => p.comorbidities.includes('depression'),
  },
  {
    factor: 'Pain not adequately controlled',
    weight: 10,
    check: (_p, scores) => {
      const painScore = scores.find(s => s.criterionId === 'pain_controlled');
      return painScore ? painScore.score < 60 : false;
    },
  },
  {
    factor: 'Inadequate home support',
    weight: 9,
    check: (_p, scores) => {
      const homeScore = scores.find(s => s.criterionId === 'home_support');
      return homeScore ? homeScore.score < 60 : false;
    },
  },
  {
    factor: 'Medication complexity (5+ medications)',
    weight: 7,
    check: (p) => p.medications.length >= 5,
  },
  {
    factor: 'Low medication understanding',
    weight: 8,
    check: (_p, scores) => {
      const medScore = scores.find(s => s.criterionId === 'medication_understanding');
      return medScore ? medScore.score < 60 : false;
    },
  },
  {
    factor: 'Incomplete discharge education',
    weight: 6,
    check: (_p, scores) => {
      const eduScore = scores.find(s => s.criterionId === 'education_completed');
      return eduScore ? eduScore.score < 50 : false;
    },
  },
  {
    factor: 'Nutrition concerns',
    weight: 5,
    check: (_p, scores) => {
      const nutScore = scores.find(s => s.criterionId === 'nutrition_adequate');
      return nutScore ? nutScore.score < 50 : false;
    },
  },
  {
    factor: 'Obesity',
    weight: 5,
    check: (p) => p.comorbidities.includes('obesity'),
  },
];

function calculateReadmissionRisk(patient: PatientProfile, scores: CriterionScore[]): { score: number; level: RiskLevel; factors: string[] } {
  let totalRisk = 0;
  const activeFactors: string[] = [];

  for (const rf of READMISSION_RISK_FACTORS) {
    if (rf.check(patient, scores)) {
      totalRisk += rf.weight;
      activeFactors.push(rf.factor);
    }
  }

  const score = clamp(totalRisk, 0, 100);
  let level: RiskLevel;
  if (score < 20) level = RiskLevel.LOW;
  else if (score < 40) level = RiskLevel.MODERATE;
  else if (score < 60) level = RiskLevel.HIGH;
  else level = RiskLevel.VERY_HIGH;

  return { score, level, factors: activeFactors };
}

// ============================================================================
// Readiness Level Classification
// ============================================================================

function classifyReadiness(score: number): ReadinessLevel {
  if (score < 50) return ReadinessLevel.NOT_READY;
  if (score < 75) return ReadinessLevel.APPROACHING;
  if (score < 90) return ReadinessLevel.READY_WITH_CONDITIONS;
  return ReadinessLevel.FULLY_READY;
}

// ============================================================================
// Core Assessment Logic
// ============================================================================

function generateCriteriaScores(patient: PatientProfile, rng: () => number): CriterionScore[] {
  const scores: CriterionScore[] = [];
  const postOpDay = patient.postOpDay;
  const typicalStay = SURGERY_CONFIGS[patient.surgeryType].typicalStayDays;
  const expectedStay = (typicalStay[0] + typicalStay[1]) / 2;
  const recoveryProgress = clamp(postOpDay / expectedStay, 0.2, 1.5);

  const criterionIds = Object.keys(READINESS_CRITERIA) as CriterionId[];

  for (const criterionId of criterionIds) {
    let baseScore: number;

    switch (criterionId) {
      case 'pain_controlled':
        baseScore = 30 + recoveryProgress * 40 + seededInt(-10, 15, rng);
        if (patient.comorbidities.includes('chronic_kidney_disease')) baseScore -= 10; // harder to manage pain with renal issues
        break;

      case 'wound_healing':
        baseScore = 25 + recoveryProgress * 45 + seededInt(-10, 15, rng);
        if (patient.comorbidities.includes('type_2_diabetes')) baseScore -= 15;
        if (patient.comorbidities.includes('obesity')) baseScore -= 8;
        break;

      case 'vitals_stable':
        baseScore = 40 + recoveryProgress * 35 + seededInt(-5, 15, rng);
        if (patient.comorbidities.includes('hypertension')) baseScore -= 10;
        if (patient.comorbidities.includes('atrial_fibrillation')) baseScore -= 12;
        break;

      case 'adequate_mobility':
        baseScore = 20 + recoveryProgress * 45 + seededInt(-10, 20, rng);
        if (patient.surgeryType === SurgeryType.SPINAL_FUSION) baseScore -= 15;
        if (patient.surgeryType === SurgeryType.KNEE_REPLACEMENT) baseScore -= 10;
        if (patient.age > 70) baseScore -= 10;
        break;

      case 'medication_understanding':
        baseScore = 40 + recoveryProgress * 30 + seededInt(-5, 20, rng);
        if (patient.medications.length > 4) baseScore -= 10;
        if (patient.age > 75) baseScore -= 8;
        break;

      case 'followup_scheduled':
        baseScore = 50 + recoveryProgress * 30 + seededInt(-10, 25, rng);
        break;

      case 'home_support':
        baseScore = 45 + seededInt(-15, 35, rng);
        if (patient.age > 70) baseScore -= 5;
        break;

      case 'education_completed':
        baseScore = 35 + recoveryProgress * 35 + seededInt(-10, 20, rng);
        break;

      case 'equipment_arranged':
        baseScore = 30 + recoveryProgress * 40 + seededInt(-10, 25, rng);
        if (patient.surgeryType === SurgeryType.APPENDECTOMY) baseScore += 20; // less equipment needed
        if (patient.surgeryType === SurgeryType.HERNIA_REPAIR) baseScore += 15;
        break;

      case 'transportation':
        baseScore = 60 + seededInt(-10, 30, rng);
        break;

      case 'mental_health_screen':
        baseScore = 50 + recoveryProgress * 20 + seededInt(-10, 25, rng);
        if (patient.comorbidities.includes('depression')) baseScore -= 20;
        break;

      case 'nutrition_adequate':
        baseScore = 35 + recoveryProgress * 35 + seededInt(-10, 20, rng);
        if (patient.surgeryType === SurgeryType.APPENDECTOMY) baseScore -= 5; // GI surgery
        break;

      default:
        baseScore = 50 + seededInt(-10, 20, rng);
    }

    const finalScore = clamp(Math.round(baseScore), 0, 100);
    const notes = generateCriterionNotes(criterionId, finalScore, patient);

    scores.push({
      criterionId,
      score: finalScore,
      notes,
      assessedAt: new Date().toISOString(),
      assessedBy: 'clinical_assessment',
    });
  }

  return scores;
}

function generateCriterionNotes(criterionId: CriterionId, score: number, patient: PatientProfile): string {
  const notesMap: Record<CriterionId, (s: number) => string> = {
    pain_controlled: (s) =>
      s >= 80 ? 'Pain well controlled with oral medications, patient reports acceptable pain levels' :
      s >= 60 ? 'Pain mostly controlled but occasional breakthrough episodes, medication adjustment may be needed' :
      s >= 40 ? 'Pain management suboptimal, patient requiring frequent PRN doses' :
      'Pain poorly controlled, consider pain management consultation',

    wound_healing: (s) =>
      s >= 80 ? 'Wound healing well, no signs of infection, minimal drainage' :
      s >= 60 ? 'Wound healing progressing, slight erythema at edges, drainage within normal limits' :
      s >= 40 ? 'Wound healing delayed, moderate erythema, some serous drainage noted' :
      'Wound healing concerns: increased drainage, erythema, possible early infection signs',

    vitals_stable: (s) =>
      s >= 80 ? 'All vitals within normal limits for 24+ hours, hemodynamically stable' :
      s >= 60 ? 'Vitals mostly stable with occasional minor variations, monitoring continues' :
      s >= 40 ? `Vitals intermittently unstable, ${patient.comorbidities.includes('hypertension') ? 'blood pressure labile' : 'mild tachycardia noted'}` :
      'Vitals unstable, requiring frequent monitoring and medication adjustments',

    adequate_mobility: (s) =>
      s >= 80 ? 'Ambulating independently or with appropriate assistive device, safe for discharge' :
      s >= 60 ? 'Ambulating with assistance, improving daily, near discharge threshold' :
      s >= 40 ? 'Limited mobility, requiring significant assistance, PT continuing daily' :
      'Minimal mobility, unable to perform safe transfers, continued inpatient PT needed',

    medication_understanding: (s) =>
      s >= 80 ? 'Patient demonstrates clear understanding of all medications, dosages, and timing' :
      s >= 60 ? 'Patient understands most medications, needs reinforcement on some details' :
      s >= 40 ? 'Patient has partial understanding, requires additional education sessions' :
      'Patient has limited understanding of medication regimen, barrier to safe discharge',

    followup_scheduled: (s) =>
      s >= 80 ? 'All follow-up appointments scheduled and confirmed with patient' :
      s >= 60 ? 'Most follow-up appointments scheduled, one or two pending confirmation' :
      s >= 40 ? 'Follow-up scheduling in progress, primary follow-up confirmed' :
      'Follow-up appointments not yet scheduled, discharge planning to coordinate',

    home_support: (s) =>
      s >= 80 ? 'Adequate caregiver support confirmed, home environment assessed as safe' :
      s >= 60 ? 'Caregiver identified but availability limited, home modifications needed' :
      s >= 40 ? 'Limited home support, exploring additional resources and home health services' :
      'Insufficient home support, social work evaluating options for safe discharge',

    education_completed: (s) =>
      s >= 80 ? 'All discharge education completed, patient and caregiver verbalize understanding' :
      s >= 60 ? 'Most education topics covered, remaining items scheduled before discharge' :
      s >= 40 ? 'Education partially completed, several key topics still need to be addressed' :
      'Discharge education barely started, significant teaching still required',

    equipment_arranged: (s) =>
      s >= 80 ? 'All required DME ordered, delivery confirmed, patient trained on use' :
      s >= 60 ? 'Equipment ordered, awaiting delivery confirmation for some items' :
      s >= 40 ? 'Equipment needs identified, orders being placed, some items on backorder' :
      'Equipment needs assessment not yet completed',

    transportation: (s) =>
      s >= 80 ? 'Transportation arranged and confirmed for discharge day' :
      s >= 60 ? 'Transportation plan identified, confirmation pending' :
      s >= 40 ? 'Working on transportation arrangement, exploring options' :
      'No transportation plan in place, social work assisting',

    mental_health_screen: (s) =>
      s >= 80 ? 'Mental health screen completed, no acute concerns identified' :
      s >= 60 ? `Screen completed, ${patient.comorbidities.includes('depression') ? 'existing depression managed, outpatient follow-up arranged' : 'mild situational anxiety noted, coping strategies discussed'}` :
      s >= 40 ? 'Screen identifies moderate concerns, referral to behavioral health made' :
      'Significant mental health concerns identified, psychiatric consultation recommended',

    nutrition_adequate: (s) =>
      s >= 80 ? 'Tolerating regular diet, adequate oral intake, nutritional goals met' :
      s >= 60 ? 'Tolerating soft diet, intake improving, close to meeting nutritional targets' :
      s >= 40 ? 'Oral intake below target, dietitian consulted, supplementation started' :
      'Poor oral intake, nutritional support required, not yet meeting discharge criteria',
  };

  return notesMap[criterionId](score);
}

// ============================================================================
// Checklist Generation
// ============================================================================

function generateChecklistFromConfig(patient: PatientProfile, scores: CriterionScore[], rng: () => number): ChecklistItem[] {
  const config = SURGERY_CONFIGS[patient.surgeryType];
  const items: ChecklistItem[] = [];
  let itemIdx = 0;

  function addItem(category: ChecklistCategory, description: string, assignedTo: string, required: boolean): void {
    itemIdx++;
    const progress = rng();
    let status: ChecklistItemStatus;
    if (progress < 0.35) status = ChecklistItemStatus.COMPLETED;
    else if (progress < 0.6) status = ChecklistItemStatus.IN_PROGRESS;
    else if (progress < 0.9) status = ChecklistItemStatus.PENDING;
    else status = ChecklistItemStatus.NOT_APPLICABLE;

    items.push({
      id: `chk-${patient.id}-${itemIdx}`,
      category,
      description,
      status,
      assignedTo,
      dueDate: null,
      completedAt: status === ChecklistItemStatus.COMPLETED ? new Date().toISOString() : null,
      notes: '',
      required,
    });
  }

  // Clinical items
  addItem(ChecklistCategory.CLINICAL, 'Verify all vital signs stable for 24 hours', 'Nursing', true);
  addItem(ChecklistCategory.CLINICAL, 'Confirm wound is healing without infection signs', 'Physician', true);
  addItem(ChecklistCategory.CLINICAL, 'Assess pain management adequacy with oral medications', 'Nursing', true);
  addItem(ChecklistCategory.CLINICAL, 'Verify adequate mobility for safe home discharge', 'Physical Therapy', true);
  addItem(ChecklistCategory.CLINICAL, 'Review and finalize lab results', 'Physician', true);
  addItem(ChecklistCategory.CLINICAL, 'Confirm dietary tolerance for discharge', 'Nursing', true);
  addItem(ChecklistCategory.CLINICAL, 'Remove IV lines and catheters', 'Nursing', true);
  addItem(ChecklistCategory.CLINICAL, 'Complete mental health screening', 'Social Work', true);

  // Medication items
  addItem(ChecklistCategory.MEDICATION, 'Reconcile all discharge medications', 'Pharmacy', true);
  addItem(ChecklistCategory.MEDICATION, 'Send prescriptions to patient pharmacy', 'Physician', true);
  addItem(ChecklistCategory.MEDICATION, 'Verify patient can obtain all prescribed medications', 'Pharmacy', true);
  addItem(ChecklistCategory.MEDICATION, 'Review medication interactions and side effects with patient', 'Pharmacy', true);
  addItem(ChecklistCategory.MEDICATION, 'Provide written medication schedule', 'Nursing', true);

  // Education items
  addItem(ChecklistCategory.EDUCATION, 'Wound care education and return demonstration', 'Nursing', true);
  addItem(ChecklistCategory.EDUCATION, 'Activity restrictions and progression plan review', 'Physical Therapy', true);
  addItem(ChecklistCategory.EDUCATION, 'Warning signs requiring medical attention', 'Nursing', true);
  addItem(ChecklistCategory.EDUCATION, 'Dietary guidelines for recovery', 'Dietitian', true);
  addItem(ChecklistCategory.EDUCATION, 'Pain management plan and medication education', 'Nursing', true);

  // Equipment items
  for (const equip of config.requiredEquipment) {
    addItem(ChecklistCategory.LOGISTICS, `Arrange ${equip}`, 'Case Management', true);
  }

  // Follow-up scheduling
  for (const fu of config.followUpSchedule) {
    addItem(ChecklistCategory.FOLLOW_UP, `Schedule ${fu.specialty} appointment with ${fu.provider} (${fu.purpose})`, 'Discharge Coordinator', true);
  }

  // Safety items
  addItem(ChecklistCategory.SAFETY, 'Arrange safe transportation home', 'Social Work', true);
  addItem(ChecklistCategory.SAFETY, 'Verify home environment safety (grab bars, trip hazards)', 'Case Management', true);
  addItem(ChecklistCategory.SAFETY, 'Confirm caregiver availability for first 48 hours', 'Social Work', true);
  addItem(ChecklistCategory.SAFETY, 'Provide emergency contact information card', 'Nursing', true);
  addItem(ChecklistCategory.SAFETY, 'Verify patient has working phone for follow-up contact', 'Discharge Coordinator', false);

  // Conditionally add items based on scores
  const painScore = scores.find(s => s.criterionId === 'pain_controlled');
  if (painScore && painScore.score < 60) {
    addItem(ChecklistCategory.CLINICAL, 'Pain management consultation before discharge', 'Physician', true);
  }

  const mentalScore = scores.find(s => s.criterionId === 'mental_health_screen');
  if (mentalScore && mentalScore.score < 60) {
    addItem(ChecklistCategory.CLINICAL, 'Behavioral health referral and follow-up plan', 'Social Work', true);
  }

  return items;
}

// ============================================================================
// Discharge Summary Generation
// ============================================================================

function generateSummaryDocument(patient: PatientProfile, scores: CriterionScore[]): DischargeSummary {
  const config = SURGERY_CONFIGS[patient.surgeryType];

  const surgeryNames: Record<SurgeryType, string> = {
    [SurgeryType.KNEE_REPLACEMENT]: 'Total Knee Arthroplasty',
    [SurgeryType.HIP_REPLACEMENT]: 'Total Hip Arthroplasty',
    [SurgeryType.CARDIAC_BYPASS]: 'Coronary Artery Bypass Grafting (CABG)',
    [SurgeryType.APPENDECTOMY]: 'Laparoscopic Appendectomy',
    [SurgeryType.SPINAL_FUSION]: 'Posterior Lumbar Interbody Fusion (PLIF)',
    [SurgeryType.HERNIA_REPAIR]: 'Laparoscopic Inguinal Hernia Repair with Mesh',
  };

  const medications: MedicationEntry[] = [];

  // Standard post-op medications based on surgery type
  medications.push({
    name: 'Acetaminophen',
    dosage: '1000mg',
    frequency: 'Every 6 hours',
    route: 'oral',
    purpose: 'Pain management',
    specialInstructions: 'Do not exceed 4000mg in 24 hours. Do not take with other acetaminophen-containing products.',
    startDate: patient.surgeryDate,
    endDate: null,
    prescribedBy: 'Dr. Sarah Smith',
  });

  if (patient.surgeryType !== SurgeryType.APPENDECTOMY && patient.surgeryType !== SurgeryType.HERNIA_REPAIR) {
    medications.push({
      name: 'Oxycodone',
      dosage: '5mg',
      frequency: 'Every 4-6 hours as needed',
      route: 'oral',
      purpose: 'Moderate to severe pain',
      specialInstructions: 'Take with food. Do not drive or operate machinery. Taper as pain improves. Take stool softener concurrently.',
      startDate: patient.surgeryDate,
      endDate: null,
      prescribedBy: 'Dr. Sarah Smith',
    });

    medications.push({
      name: 'Docusate Sodium',
      dosage: '100mg',
      frequency: 'Twice daily',
      route: 'oral',
      purpose: 'Prevent constipation from opioid use',
      specialInstructions: 'Take while using opioid pain medication. Increase fluid intake.',
      startDate: patient.surgeryDate,
      endDate: null,
      prescribedBy: 'Dr. Sarah Smith',
    });
  }

  // DVT prophylaxis for orthopedic and major surgeries
  if ([SurgeryType.KNEE_REPLACEMENT, SurgeryType.HIP_REPLACEMENT, SurgeryType.SPINAL_FUSION].includes(patient.surgeryType)) {
    medications.push({
      name: 'Enoxaparin (Lovenox)',
      dosage: '40mg',
      frequency: 'Once daily, subcutaneous injection',
      route: 'subcutaneous',
      purpose: 'Blood clot prevention (DVT/PE prophylaxis)',
      specialInstructions: 'Inject into abdomen rotating sites. Continue for 14 days post-surgery. Report any unusual bleeding or bruising.',
      startDate: patient.surgeryDate,
      endDate: null,
      prescribedBy: 'Dr. Sarah Smith',
    });
  }

  if (patient.surgeryType === SurgeryType.CARDIAC_BYPASS) {
    medications.push({
      name: 'Aspirin',
      dosage: '81mg',
      frequency: 'Once daily',
      route: 'oral',
      purpose: 'Graft patency and cardiovascular protection',
      specialInstructions: 'Take daily indefinitely unless directed otherwise by cardiologist.',
      startDate: patient.surgeryDate,
      endDate: null,
      prescribedBy: 'Dr. Robert Chen',
    });

    medications.push({
      name: 'Metoprolol Succinate',
      dosage: '50mg',
      frequency: 'Once daily',
      route: 'oral',
      purpose: 'Heart rate and blood pressure control',
      specialInstructions: 'Do not stop abruptly. Check heart rate before taking; hold if HR < 60.',
      startDate: patient.surgeryDate,
      endDate: null,
      prescribedBy: 'Dr. Robert Chen',
    });

    medications.push({
      name: 'Atorvastatin',
      dosage: '40mg',
      frequency: 'Once daily at bedtime',
      route: 'oral',
      purpose: 'Cholesterol management and cardiovascular protection',
      specialInstructions: 'Take in the evening. Avoid grapefruit juice. Report any muscle pain.',
      startDate: patient.surgeryDate,
      endDate: null,
      prescribedBy: 'Dr. Lisa Anderson',
    });
  }

  // Add pre-existing medications
  for (const med of patient.medications) {
    const medConfig = getMedicationDetails(med);
    if (medConfig) {
      medications.push(medConfig);
    }
  }

  const dischargeDate = new Date(patient.surgeryDate);
  dischargeDate.setDate(dischargeDate.getDate() + patient.postOpDay);

  const followUpSchedule: FollowUpAppointment[] = config.followUpSchedule.map(fu => {
    const appointmentDate = new Date(patient.surgeryDate);
    appointmentDate.setDate(appointmentDate.getDate() + fu.weeksPostOp * 7);
    return {
      provider: fu.provider,
      specialty: fu.specialty,
      scheduledDate: appointmentDate.toISOString().split('T')[0],
      location: 'Main Hospital Outpatient Clinic, 2nd Floor',
      purpose: fu.purpose,
      preparations: getAppointmentPreparations(fu.purpose),
    };
  });

  const emergencyContacts: EmergencyContact[] = [
    { name: 'Dr. Sarah Smith', role: ContactType.PRIMARY_SURGEON, phone: '(555) 234-5678', available: 'Mon-Fri 8am-5pm' },
    { name: 'Primary Care Office', role: ContactType.PRIMARY_CARE, phone: '(555) 345-6789', available: 'Mon-Fri 9am-5pm' },
    { name: '24-Hour Nurse Hotline', role: ContactType.NURSE_HOTLINE, phone: '(555) 111-CARE', available: '24/7' },
    { name: 'Hospital Pharmacy', role: ContactType.PHARMACY, phone: '(555) 456-7890', available: 'Mon-Sat 8am-9pm' },
    { name: 'Emergency Services', role: ContactType.EMERGENCY, phone: '911', available: '24/7' },
  ];

  if ([SurgeryType.KNEE_REPLACEMENT, SurgeryType.HIP_REPLACEMENT, SurgeryType.SPINAL_FUSION].includes(patient.surgeryType)) {
    emergencyContacts.push({
      name: 'Rehabilitation Center',
      role: ContactType.PHYSICAL_THERAPY,
      phone: '(555) 567-8901',
      available: 'Mon-Fri 7am-6pm',
    });
  }

  if (patient.surgeryType === SurgeryType.CARDIAC_BYPASS) {
    emergencyContacts.push({
      name: 'Dr. Lisa Anderson - Cardiology',
      role: ContactType.SPECIALIST,
      phone: '(555) 678-9012',
      available: 'Mon-Fri 8am-5pm',
    });
  }

  const hospitalCourseSummary = generateHospitalCourseSummary(patient, scores);

  return {
    id: generateId('ds'),
    patientId: patient.id,
    patientName: patient.name,
    admissionDate: patient.admissionDate,
    dischargeDate: dischargeDate.toISOString().split('T')[0],
    surgeryType: patient.surgeryType,
    surgeryDate: patient.surgeryDate,
    primarySurgeon: 'Dr. Sarah Smith',
    diagnosisSummary: getDiagnosisSummary(patient.surgeryType),
    procedureSummary: surgeryNames[patient.surgeryType],
    hospitalCourseSummary,
    medications,
    activityRestrictions: config.commonRestrictions,
    dietaryInstructions: config.dietaryInstructions,
    woundCareInstructions: config.woundCareInstructions,
    warningSignsRequiringAttention: config.warningSignsList,
    followUpSchedule,
    emergencyContacts,
    specialInstructions: getSpecialInstructions(patient),
    generatedAt: new Date().toISOString(),
  };
}

function getMedicationDetails(medName: string): MedicationEntry | null {
  const medMap: Record<string, Omit<MedicationEntry, 'startDate' | 'endDate' | 'prescribedBy'>> = {
    lisinopril: {
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      route: 'oral',
      purpose: 'Blood pressure management',
      specialInstructions: 'Monitor blood pressure regularly. Report persistent cough or swelling.',
    },
    metformin: {
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily with meals',
      route: 'oral',
      purpose: 'Blood glucose management',
      specialInstructions: 'Take with food to reduce GI side effects. Monitor blood glucose levels.',
    },
    atorvastatin: {
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily at bedtime',
      route: 'oral',
      purpose: 'Cholesterol management',
      specialInstructions: 'Take in the evening. Report any muscle pain or weakness.',
    },
    omeprazole: {
      name: 'Omeprazole',
      dosage: '20mg',
      frequency: 'Once daily before breakfast',
      route: 'oral',
      purpose: 'Acid reflux / stomach protection',
      specialInstructions: 'Take 30 minutes before eating. Do not crush or chew capsule.',
    },
    levothyroxine: {
      name: 'Levothyroxine',
      dosage: '75mcg',
      frequency: 'Once daily on empty stomach',
      route: 'oral',
      purpose: 'Thyroid hormone replacement',
      specialInstructions: 'Take on empty stomach, 30-60 minutes before eating. Do not take with calcium or iron supplements.',
    },
    amlodipine: {
      name: 'Amlodipine',
      dosage: '5mg',
      frequency: 'Once daily',
      route: 'oral',
      purpose: 'Blood pressure management',
      specialInstructions: 'May cause mild ankle swelling. Rise slowly from sitting/lying position.',
    },
    metoprolol: {
      name: 'Metoprolol Tartrate',
      dosage: '25mg',
      frequency: 'Twice daily',
      route: 'oral',
      purpose: 'Heart rate and blood pressure control',
      specialInstructions: 'Do not stop abruptly. Check pulse before taking; hold if under 60 bpm.',
    },
    gabapentin: {
      name: 'Gabapentin',
      dosage: '300mg',
      frequency: 'Three times daily',
      route: 'oral',
      purpose: 'Nerve pain management',
      specialInstructions: 'May cause drowsiness. Do not drive until you know how it affects you. Do not stop abruptly.',
    },
    sertraline: {
      name: 'Sertraline',
      dosage: '50mg',
      frequency: 'Once daily',
      route: 'oral',
      purpose: 'Depression and anxiety management',
      specialInstructions: 'May take 4-6 weeks for full effect. Report any suicidal thoughts immediately.',
    },
    acetaminophen: {
      name: 'Acetaminophen',
      dosage: '500mg',
      frequency: 'Every 6 hours as needed',
      route: 'oral',
      purpose: 'Mild pain and fever management',
      specialInstructions: 'Do not exceed 4000mg in 24 hours.',
    },
    ibuprofen: {
      name: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'Every 6-8 hours as needed with food',
      route: 'oral',
      purpose: 'Anti-inflammatory pain management',
      specialInstructions: 'Take with food. Avoid if on blood thinners or spinal fusion patient.',
    },
    oxycodone: {
      name: 'Oxycodone',
      dosage: '5mg',
      frequency: 'Every 4-6 hours as needed',
      route: 'oral',
      purpose: 'Moderate to severe pain',
      specialInstructions: 'Use only as needed. Do not drive. Dispose of unused medication safely.',
    },
    warfarin: {
      name: 'Warfarin',
      dosage: '5mg',
      frequency: 'Once daily',
      route: 'oral',
      purpose: 'Blood clot prevention',
      specialInstructions: 'Regular INR monitoring required. Avoid significant changes in vitamin K intake. Report any unusual bleeding.',
    },
    aspirin: {
      name: 'Aspirin',
      dosage: '81mg',
      frequency: 'Once daily',
      route: 'oral',
      purpose: 'Cardiovascular protection',
      specialInstructions: 'Take with food. Report any signs of GI bleeding (black stools, blood in vomit).',
    },
    furosemide: {
      name: 'Furosemide',
      dosage: '20mg',
      frequency: 'Once daily in the morning',
      route: 'oral',
      purpose: 'Fluid management / edema control',
      specialInstructions: 'Take in the morning to avoid nighttime urination. Monitor potassium levels.',
    },
  };

  const details = medMap[medName];
  if (!details) return null;

  return {
    ...details,
    startDate: 'Pre-existing',
    endDate: null,
    prescribedBy: 'Primary Care Physician',
  };
}

function getDiagnosisSummary(surgeryType: SurgeryType): string {
  const summaries: Record<SurgeryType, string> = {
    [SurgeryType.KNEE_REPLACEMENT]: 'Severe osteoarthritis of the knee with chronic pain and functional limitation unresponsive to conservative management',
    [SurgeryType.HIP_REPLACEMENT]: 'Advanced degenerative joint disease of the hip with significant pain and mobility impairment',
    [SurgeryType.CARDIAC_BYPASS]: 'Multi-vessel coronary artery disease with symptomatic angina and/or positive stress test findings',
    [SurgeryType.APPENDECTOMY]: 'Acute appendicitis confirmed by clinical exam and CT imaging',
    [SurgeryType.SPINAL_FUSION]: 'Degenerative disc disease with spinal instability and/or symptomatic spinal stenosis with neurological compromise',
    [SurgeryType.HERNIA_REPAIR]: 'Symptomatic inguinal hernia with risk of incarceration',
  };
  return summaries[surgeryType];
}

function generateHospitalCourseSummary(patient: PatientProfile, scores: CriterionScore[]): string {
  const painScore = scores.find(s => s.criterionId === 'pain_controlled')?.score ?? 50;
  const mobilityScore = scores.find(s => s.criterionId === 'adequate_mobility')?.score ?? 50;
  const woundScore = scores.find(s => s.criterionId === 'wound_healing')?.score ?? 50;

  const painDescription = painScore >= 70 ? 'well managed with multimodal approach' : painScore >= 50 ? 'gradually improving with medication adjustments' : 'challenging but showing improvement with current regimen';
  const mobilityDescription = mobilityScore >= 70 ? 'progressed well with physical therapy' : mobilityScore >= 50 ? 'steadily improving with daily PT sessions' : 'progressing slowly, continuing intensive therapy';
  const woundDescription = woundScore >= 70 ? 'healing well without complications' : woundScore >= 50 ? 'healing with expected progress' : 'being closely monitored with appropriate interventions';

  return `Patient underwent ${getDiagnosisSummary(patient.surgeryType).toLowerCase().includes('acute') ? 'emergent' : 'elective'} surgery on post-operative day 0. ` +
    `Hospital course was ${patient.comorbidities.length > 2 ? 'complicated by multiple comorbidities requiring careful management' : 'generally uncomplicated'}. ` +
    `Pain has been ${painDescription}. ` +
    `Mobility has ${mobilityDescription}. ` +
    `Surgical wound is ${woundDescription}. ` +
    `Patient is now on post-operative day ${patient.postOpDay} and ${painScore >= 60 && mobilityScore >= 50 ? 'approaching discharge readiness' : 'continuing recovery with targeted interventions'}.`;
}

function getAppointmentPreparations(purpose: string): string[] {
  if (purpose.toLowerCase().includes('x-ray') || purpose.toLowerCase().includes('imaging') || purpose.toLowerCase().includes('ct scan')) {
    return ['Wear loose, comfortable clothing', 'Bring list of current medications', 'Arrive 15 minutes early for imaging'];
  }
  if (purpose.toLowerCase().includes('wound') || purpose.toLowerCase().includes('staple')) {
    return ['Keep wound dressing clean before appointment', 'Bring list of current medications', 'Note any wound changes to report'];
  }
  if (purpose.toLowerCase().includes('cardiac') || purpose.toLowerCase().includes('stress') || purpose.toLowerCase().includes('echo')) {
    return ['Wear comfortable clothing and walking shoes', 'Fast for 4 hours before if stress test', 'Bring current medication list', 'Bring blood pressure log'];
  }
  if (purpose.toLowerCase().includes('rehabilitation')) {
    return ['Wear comfortable, loose clothing and supportive shoes', 'Bring insurance card and referral', 'List current pain levels and limitations'];
  }
  return ['Bring list of current medications', 'Bring insurance information', 'Arrive 15 minutes early', 'Prepare any questions for the provider'];
}

function getSpecialInstructions(patient: PatientProfile): string[] {
  const instructions: string[] = [];

  if (patient.comorbidities.includes('type_2_diabetes')) {
    instructions.push('Monitor blood glucose levels at least 4 times daily during recovery. Maintain blood sugar between 100-180 mg/dL. Contact your endocrinologist if readings are consistently outside this range.');
  }
  if (patient.comorbidities.includes('hypertension')) {
    instructions.push('Check blood pressure twice daily (morning and evening). Record readings in log. Contact provider if systolic >160 or diastolic >100.');
  }
  if (patient.comorbidities.includes('copd')) {
    instructions.push('Use incentive spirometer 10 times per hour while awake. Continue home oxygen if prescribed. Report any increased shortness of breath or change in sputum color.');
  }
  if (patient.comorbidities.includes('atrial_fibrillation')) {
    instructions.push('Check pulse daily. Report any irregular heartbeat, rapid heart rate (>100 bpm), dizziness, or palpitations.');
  }
  if (patient.comorbidities.includes('sleep_apnea')) {
    instructions.push('Resume CPAP use as soon as comfortable after surgery. Ensure machine is clean and functioning properly.');
  }

  if (patient.surgeryType === SurgeryType.SPINAL_FUSION) {
    instructions.push('Absolutely NO smoking or nicotine products. Nicotine severely inhibits bone fusion and can lead to surgical failure.');
  }

  instructions.push('Keep a daily recovery journal noting pain levels, activities, sleep quality, and any concerns to discuss at follow-up appointments.');
  instructions.push('Download the Recovery Pilot app for daily check-ins, medication reminders, and direct communication with your care team.');

  return instructions;
}

// ============================================================================
// Post-Discharge Monitoring Plan
// ============================================================================

function generateMonitoringPlan(patient: PatientProfile, riskResult: { score: number; level: RiskLevel; factors: string[] }): MonitoringPlan {
  const startDate = new Date(patient.surgeryDate);
  startDate.setDate(startDate.getDate() + patient.postOpDay);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  const checkpoints: MonitoringCheckpoint[] = [];

  // Day 1: Phone call for all patients
  checkpoints.push(createCheckpoint(startDate, 1, 'phone_call', MonitoringPriority.HIGH, patient));

  // Day 2-3: App check-in
  checkpoints.push(createCheckpoint(startDate, 2, 'app_check_in', MonitoringPriority.MEDIUM, patient));
  checkpoints.push(createCheckpoint(startDate, 3, 'app_check_in', MonitoringPriority.MEDIUM, patient));

  // Day 5: Phone call or video visit depending on risk
  if (riskResult.level === RiskLevel.HIGH || riskResult.level === RiskLevel.VERY_HIGH) {
    checkpoints.push(createCheckpoint(startDate, 5, 'video_visit', MonitoringPriority.HIGH, patient));
  } else {
    checkpoints.push(createCheckpoint(startDate, 5, 'phone_call', MonitoringPriority.MEDIUM, patient));
  }

  // Day 7: All patients get a check-in
  checkpoints.push(createCheckpoint(startDate, 7, riskResult.level === RiskLevel.VERY_HIGH ? 'video_visit' : 'phone_call', MonitoringPriority.HIGH, patient));

  // Day 10: High-risk patients extra check
  if (riskResult.level === RiskLevel.HIGH || riskResult.level === RiskLevel.VERY_HIGH) {
    checkpoints.push(createCheckpoint(startDate, 10, 'phone_call', MonitoringPriority.MEDIUM, patient));
  }

  // Day 14: Two-week follow-up (typically in-person for wound check)
  checkpoints.push(createCheckpoint(startDate, 14, 'in_person', MonitoringPriority.HIGH, patient));

  // Day 14: Lab work for certain surgeries
  if ([SurgeryType.CARDIAC_BYPASS, SurgeryType.KNEE_REPLACEMENT, SurgeryType.HIP_REPLACEMENT].includes(patient.surgeryType)) {
    checkpoints.push(createCheckpoint(startDate, 14, 'lab_work', MonitoringPriority.MEDIUM, patient));
  }

  // Day 21
  checkpoints.push(createCheckpoint(startDate, 21, 'phone_call', MonitoringPriority.MEDIUM, patient));

  // Day 28-30: One-month follow-up
  checkpoints.push(createCheckpoint(startDate, 30, riskResult.level !== RiskLevel.LOW ? 'in_person' : 'video_visit', MonitoringPriority.HIGH, patient));

  // Extra daily app check-ins for very high risk
  if (riskResult.level === RiskLevel.VERY_HIGH) {
    for (let d = 4; d <= 14; d++) {
      if (!checkpoints.some(cp => cp.day === d)) {
        checkpoints.push(createCheckpoint(startDate, d, 'app_check_in', MonitoringPriority.LOW, patient));
      }
    }
  }

  // Sort by day
  checkpoints.sort((a, b) => a.day - b.day);

  const preventionStrategies = generatePreventionStrategies(riskResult.factors, patient);
  const escalationProtocol = [
    'Patient reports new or worsening symptoms: escalate to on-call physician within 1 hour',
    'Missed two consecutive app check-ins: initiate phone outreach within 4 hours',
    'Abnormal vital signs or pain spike: schedule same-day or next-day video visit',
    'Emergency warning signs reported: direct to ER and notify surgeon immediately',
    'Patient unable to manage medications: coordinate with pharmacy for adherence support',
    'Mental health crisis indicators: warm handoff to behavioral health crisis line',
  ];

  return {
    id: generateId('mp'),
    patientId: patient.id,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    riskLevel: riskResult.level,
    checkpoints,
    readmissionRiskFactors: riskResult.factors,
    preventionStrategies,
    escalationProtocol,
  };
}

function createCheckpoint(startDate: Date, day: number, type: MonitoringCheckpoint['type'], priority: MonitoringPriority, patient: PatientProfile): MonitoringCheckpoint {
  const checkDate = new Date(startDate);
  checkDate.setDate(checkDate.getDate() + day);

  return {
    day,
    date: checkDate.toISOString().split('T')[0],
    type,
    priority,
    focusAreas: getCheckpointFocusAreas(day, patient),
    questionsToAsk: getCheckpointQuestions(day, patient),
    vitalsToCheck: getCheckpointVitals(day, patient),
    escalationTriggers: getEscalationTriggers(day, patient),
  };
}

function getCheckpointFocusAreas(day: number, patient: PatientProfile): string[] {
  const areas: string[] = ['Pain management', 'Wound status'];

  if (day <= 3) {
    areas.push('Medication adherence', 'Activity level', 'Diet tolerance');
  } else if (day <= 7) {
    areas.push('Functional progress', 'Sleep quality', 'Caregiver coping');
  } else if (day <= 14) {
    areas.push('Rehabilitation progress', 'Medication side effects', 'Emotional wellbeing');
  } else {
    areas.push('Return to activities', 'Long-term medication management', 'Recovery milestones');
  }

  if (patient.comorbidities.includes('type_2_diabetes')) areas.push('Blood glucose control');
  if (patient.comorbidities.includes('hypertension')) areas.push('Blood pressure monitoring');
  if (patient.comorbidities.includes('depression')) areas.push('Mood assessment');

  return areas;
}

function getCheckpointQuestions(day: number, patient: PatientProfile): string[] {
  const questions: string[] = [
    'How would you rate your pain on a 0-10 scale?',
    'Are you taking all medications as prescribed?',
  ];

  if (day <= 3) {
    questions.push(
      'Are you able to eat and drink normally?',
      'Have you noticed any changes to your surgical wound?',
      'Are you able to move around your home safely?',
    );
  } else if (day <= 14) {
    questions.push(
      'How are you sleeping?',
      'Are you doing your prescribed exercises/physical therapy?',
      'Have you had any falls or near-falls?',
    );
  } else {
    questions.push(
      'How is your energy level compared to last week?',
      'Are you achieving your recovery milestones?',
      'Do you have any concerns about your upcoming follow-up appointment?',
    );
  }

  if (patient.surgeryType === SurgeryType.CARDIAC_BYPASS) {
    questions.push('What is your daily weight? Any sudden changes?');
  }

  return questions;
}

function getCheckpointVitals(day: number, patient: PatientProfile): string[] {
  const vitals = ['Temperature', 'Pain score'];

  if (patient.comorbidities.includes('hypertension') || patient.surgeryType === SurgeryType.CARDIAC_BYPASS) {
    vitals.push('Blood pressure', 'Heart rate');
  }
  if (patient.comorbidities.includes('type_2_diabetes')) {
    vitals.push('Blood glucose');
  }
  if (patient.surgeryType === SurgeryType.CARDIAC_BYPASS) {
    vitals.push('Daily weight', 'Oxygen saturation');
  }
  if (day <= 7) {
    vitals.push('Wound assessment');
  }

  return vitals;
}

function getEscalationTriggers(day: number, patient: PatientProfile): string[] {
  const triggers: string[] = [
    'Fever > 101.5F (38.6C)',
    'Uncontrolled pain (score > 7 on prescribed medications)',
    'Signs of wound infection',
  ];

  if ([SurgeryType.KNEE_REPLACEMENT, SurgeryType.HIP_REPLACEMENT].includes(patient.surgeryType)) {
    triggers.push('Sudden calf pain or leg swelling (DVT risk)', 'Chest pain or shortness of breath (PE risk)');
  }
  if (patient.surgeryType === SurgeryType.CARDIAC_BYPASS) {
    triggers.push('Weight gain > 2 lbs in 24 hours', 'New shortness of breath or chest pain', 'New irregular heartbeat');
  }
  if (patient.surgeryType === SurgeryType.SPINAL_FUSION) {
    triggers.push('New neurological symptoms (numbness, weakness)', 'Loss of bowel or bladder function');
  }
  if (day >= 7) {
    triggers.push('Missed medications for 24+ hours', 'Unable to perform basic daily activities');
  }

  return triggers;
}

function generatePreventionStrategies(riskFactors: string[], patient: PatientProfile): string[] {
  const strategies: string[] = [];

  if (riskFactors.includes('Age over 65')) {
    strategies.push('Enhanced fall prevention assessment and daily safety check-ins');
    strategies.push('Simplified medication regimen with pill organizer and reminders');
  }
  if (riskFactors.includes('Multiple comorbidities (3+)')) {
    strategies.push('Coordinated care team communication with weekly interdisciplinary reviews');
    strategies.push('Comprehensive medication reconciliation at each touchpoint');
  }
  if (riskFactors.includes('Diabetes')) {
    strategies.push('Daily blood glucose monitoring with telehealth threshold alerts');
    strategies.push('Nutrition counseling focused on glycemic control during recovery');
  }
  if (riskFactors.includes('Heart failure or cardiac history')) {
    strategies.push('Daily weight monitoring with automated alerts for >2 lb gain');
    strategies.push('Cardiac rehabilitation enrollment and attendance tracking');
  }
  if (riskFactors.includes('Pain not adequately controlled')) {
    strategies.push('Multimodal pain management plan with scheduled reassessments');
    strategies.push('Non-pharmacological pain management education (ice, elevation, breathing)');
  }
  if (riskFactors.includes('Inadequate home support')) {
    strategies.push('Home health aide coordination for first 2 weeks post-discharge');
    strategies.push('Community resource connection (meals-on-wheels, transportation services)');
  }
  if (riskFactors.includes('Depression or mental health concern')) {
    strategies.push('Behavioral health follow-up within 7 days of discharge');
    strategies.push('Daily mood tracking in Recovery Pilot app with crisis resource access');
  }
  if (riskFactors.includes('Low medication understanding')) {
    strategies.push('Teach-back medication education at each follow-up contact');
    strategies.push('Visual medication schedule with photos and simplified instructions');
  }

  // Default strategies
  strategies.push('Recovery Pilot app engagement with daily check-ins and milestone tracking');
  strategies.push('24/7 nurse hotline access card provided at discharge');

  return strategies;
}

// ============================================================================
// Seed Data Generation
// ============================================================================

function generateSeedAssessments(): void {
  const rng = seededRng(7777);

  for (const patient of PATIENT_PROFILES) {
    const scores = generateCriteriaScores(patient, rng);
    const weightedScore = scores.reduce((sum, s) => {
      const criterion = READINESS_CRITERIA[s.criterionId];
      return sum + s.score * criterion.weight;
    }, 0);
    const overallScore = Math.round(weightedScore);

    const blockingCriteria: CriterionId[] = scores
      .filter(s => s.score < READINESS_CRITERIA[s.criterionId].minAcceptable)
      .map(s => s.criterionId);

    const riskResult = calculateReadmissionRisk(patient, scores);

    const recommendations: string[] = [];
    for (const blockingId of blockingCriteria) {
      const criterion = READINESS_CRITERIA[blockingId];
      recommendations.push(`Address ${criterion.name}: ${criterion.description}`);
    }
    if (overallScore < 75) {
      recommendations.push('Consider extending hospital stay until readiness criteria are met');
    }
    if (riskResult.level === RiskLevel.HIGH || riskResult.level === RiskLevel.VERY_HIGH) {
      recommendations.push('Implement enhanced post-discharge monitoring protocol');
    }

    const readinessLevel = classifyReadiness(overallScore);
    const estimatedDays = readinessLevel === ReadinessLevel.FULLY_READY ? 0 :
      readinessLevel === ReadinessLevel.READY_WITH_CONDITIONS ? seededInt(0, 1, rng) :
      readinessLevel === ReadinessLevel.APPROACHING ? seededInt(1, 3, rng) :
      seededInt(2, 5, rng);

    const estimatedDischargeDate = estimatedDays === 0 ? new Date().toISOString().split('T')[0] : (() => {
      const d = new Date();
      d.setDate(d.getDate() + estimatedDays);
      return d.toISOString().split('T')[0];
    })();

    const assessment: ReadinessAssessment = {
      id: generateId('ra'),
      patientId: patient.id,
      assessedAt: new Date().toISOString(),
      assessedBy: 'Dr. Sarah Smith',
      criteriaScores: scores,
      overallScore,
      readinessLevel,
      blockingCriteria,
      recommendations,
      estimatedDischargeDate,
      readmissionRiskScore: riskResult.score,
      readmissionRiskLevel: riskResult.level,
    };

    const existing = assessmentStore.get(patient.id) ?? [];
    existing.push(assessment);
    assessmentStore.set(patient.id, existing);

    // Generate checklists
    const checklist = generateChecklistFromConfig(patient, scores, rng);
    checklistStore.set(patient.id, checklist);

    // Generate discharge summaries
    const summary = generateSummaryDocument(patient, scores);
    summaryStore.set(patient.id, summary);

    // Generate monitoring plans
    const monitoringPlan = generateMonitoringPlan(patient, riskResult);
    monitoringStore.set(patient.id, monitoringPlan);
  }
}

// Initialize seed data on module load
generateSeedAssessments();

// ============================================================================
// Public API
// ============================================================================

/**
 * Assess discharge readiness for a patient.
 * Evaluates 12 criteria and produces a weighted composite readiness score.
 */
export function assessReadiness(patientId: string): ReadinessAssessment {
  const assessments = assessmentStore.get(patientId);
  if (assessments && assessments.length > 0) {
    return assessments[assessments.length - 1];
  }

  // Generate new assessment for unknown patient
  const patient = PATIENT_PROFILES.find(p => p.id === patientId);
  if (!patient) {
    // Create a default profile
    const defaultPatient: PatientProfile = {
      id: patientId,
      name: 'Unknown Patient',
      age: 55,
      surgeryType: SurgeryType.APPENDECTOMY,
      surgeryDate: new Date().toISOString().split('T')[0],
      admissionDate: new Date().toISOString().split('T')[0],
      comorbidities: [],
      medications: [],
      postOpDay: 3,
    };

    const rng = seededRng(patientId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0));
    const scores = generateCriteriaScores(defaultPatient, rng);
    const overallScore = Math.round(scores.reduce((sum, s) => sum + s.score * READINESS_CRITERIA[s.criterionId].weight, 0));
    const blockingCriteria = scores.filter(s => s.score < READINESS_CRITERIA[s.criterionId].minAcceptable).map(s => s.criterionId);
    const riskResult = calculateReadmissionRisk(defaultPatient, scores);

    const assessment: ReadinessAssessment = {
      id: generateId('ra'),
      patientId,
      assessedAt: new Date().toISOString(),
      assessedBy: 'system',
      criteriaScores: scores,
      overallScore,
      readinessLevel: classifyReadiness(overallScore),
      blockingCriteria,
      recommendations: blockingCriteria.map(id => `Address ${READINESS_CRITERIA[id].name}`),
      estimatedDischargeDate: null,
      readmissionRiskScore: riskResult.score,
      readmissionRiskLevel: riskResult.level,
    };

    assessmentStore.set(patientId, [assessment]);
    return assessment;
  }

  // Generate for known but unassessed patient (shouldn't happen after seed)
  const rng = seededRng(patientId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0));
  const scores = generateCriteriaScores(patient, rng);
  const overallScore = Math.round(scores.reduce((sum, s) => sum + s.score * READINESS_CRITERIA[s.criterionId].weight, 0));
  const blockingCriteria = scores.filter(s => s.score < READINESS_CRITERIA[s.criterionId].minAcceptable).map(s => s.criterionId);
  const riskResult = calculateReadmissionRisk(patient, scores);

  const assessment: ReadinessAssessment = {
    id: generateId('ra'),
    patientId,
    assessedAt: new Date().toISOString(),
    assessedBy: 'clinical_assessment',
    criteriaScores: scores,
    overallScore,
    readinessLevel: classifyReadiness(overallScore),
    blockingCriteria,
    recommendations: blockingCriteria.map(id => `Address ${READINESS_CRITERIA[id].name}`),
    estimatedDischargeDate: null,
    readmissionRiskScore: riskResult.score,
    readmissionRiskLevel: riskResult.level,
  };

  assessmentStore.set(patientId, [assessment]);
  return assessment;
}

/**
 * Generate a discharge checklist for a patient, auto-populated from their care plan and surgery type.
 */
export function generateDischargeChecklist(patientId: string): ChecklistItem[] {
  const existing = checklistStore.get(patientId);
  if (existing) return existing;

  // Generate for unknown patients
  const patient = PATIENT_PROFILES.find(p => p.id === patientId);
  if (!patient) {
    return [];
  }

  const assessment = assessReadiness(patientId);
  const rng = seededRng(patientId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + 100);
  const checklist = generateChecklistFromConfig(patient, assessment.criteriaScores, rng);
  checklistStore.set(patientId, checklist);
  return checklist;
}

/**
 * Generate a comprehensive discharge summary document for a patient.
 * Includes medication list, activity restrictions, warning signs, follow-up schedule, and emergency contacts.
 */
export function generateDischargeSummary(patientId: string): DischargeSummary {
  const existing = summaryStore.get(patientId);
  if (existing) return existing;

  const patient = PATIENT_PROFILES.find(p => p.id === patientId);
  if (!patient) {
    throw new Error(`Patient ${patientId} not found. Available patients: patient-1 through patient-30.`);
  }

  const assessment = assessReadiness(patientId);
  const summary = generateSummaryDocument(patient, assessment.criteriaScores);
  summaryStore.set(patientId, summary);
  return summary;
}

/**
 * Create a post-discharge 30-day monitoring plan with checkpoints, escalation triggers, and prevention strategies.
 */
export function createPostDischargeMonitoringPlan(patientId: string): MonitoringPlan {
  const existing = monitoringStore.get(patientId);
  if (existing) return existing;

  const patient = PATIENT_PROFILES.find(p => p.id === patientId);
  if (!patient) {
    throw new Error(`Patient ${patientId} not found. Available patients: patient-1 through patient-30.`);
  }

  const assessment = assessReadiness(patientId);
  const riskResult = calculateReadmissionRisk(patient, assessment.criteriaScores);
  const plan = generateMonitoringPlan(patient, riskResult);
  monitoringStore.set(patientId, plan);
  return plan;
}

/**
 * Get all patient profiles (for listing/dashboard purposes).
 */
export function getPatientProfiles(): PatientProfile[] {
  return [...PATIENT_PROFILES];
}

/**
 * Get a specific patient profile by ID.
 */
export function getPatientProfile(patientId: string): PatientProfile | null {
  return PATIENT_PROFILES.find(p => p.id === patientId) ?? null;
}

/**
 * Get summary statistics across all patients for a dashboard view.
 */
export function getDashboardSummary(): {
  totalPatients: number;
  readinessDistribution: Record<ReadinessLevel, number>;
  riskDistribution: Record<RiskLevel, number>;
  averageReadinessScore: number;
  averageRiskScore: number;
  patientsReadyForDischarge: string[];
  highRiskPatients: string[];
} {
  let totalReadiness = 0;
  let totalRisk = 0;
  const readinessDist: Record<ReadinessLevel, number> = {
    [ReadinessLevel.NOT_READY]: 0,
    [ReadinessLevel.APPROACHING]: 0,
    [ReadinessLevel.READY_WITH_CONDITIONS]: 0,
    [ReadinessLevel.FULLY_READY]: 0,
  };
  const riskDist: Record<RiskLevel, number> = {
    [RiskLevel.LOW]: 0,
    [RiskLevel.MODERATE]: 0,
    [RiskLevel.HIGH]: 0,
    [RiskLevel.VERY_HIGH]: 0,
  };
  const readyPatients: string[] = [];
  const highRiskPatients: string[] = [];

  for (const patient of PATIENT_PROFILES) {
    const assessment = assessReadiness(patient.id);
    totalReadiness += assessment.overallScore;
    totalRisk += assessment.readmissionRiskScore;
    readinessDist[assessment.readinessLevel]++;
    riskDist[assessment.readmissionRiskLevel]++;

    if (assessment.readinessLevel === ReadinessLevel.FULLY_READY || assessment.readinessLevel === ReadinessLevel.READY_WITH_CONDITIONS) {
      readyPatients.push(patient.id);
    }
    if (assessment.readmissionRiskLevel === RiskLevel.HIGH || assessment.readmissionRiskLevel === RiskLevel.VERY_HIGH) {
      highRiskPatients.push(patient.id);
    }
  }

  return {
    totalPatients: PATIENT_PROFILES.length,
    readinessDistribution: readinessDist,
    riskDistribution: riskDist,
    averageReadinessScore: Math.round(totalReadiness / PATIENT_PROFILES.length),
    averageRiskScore: Math.round(totalRisk / PATIENT_PROFILES.length),
    patientsReadyForDischarge: readyPatients,
    highRiskPatients,
  };
}

// ============================================================================
// Singleton Export
// ============================================================================

export const dischargeReadinessService = {
  assessReadiness,
  generateDischargeChecklist,
  generateDischargeSummary,
  createPostDischargeMonitoringPlan,
  getPatientProfiles,
  getPatientProfile,
  getDashboardSummary,
};
