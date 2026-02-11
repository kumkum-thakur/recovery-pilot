/**
 * Telehealth Service - Virtual Visit Management
 *
 * Comprehensive telehealth session management with scheduling, lifecycle control,
 * pre-visit and post-visit summaries, visit note templates, and session analytics.
 *
 * Features:
 *  - Session types: VIDEO, PHONE, ASYNC_REVIEW
 *  - Full lifecycle: create, schedule, start, end, cancel
 *  - Pre-visit summary auto-generation (vitals, pain, medications, compliance)
 *  - Post-visit summary and action item generation
 *  - 30+ visit note templates
 *  - Session analytics (duration, satisfaction, wait times)
 *  - Realistic seed data
 *
 * No external dependencies.
 */

// ============================================================================
// Constants & Enums (const-object pattern for erasableSyntaxOnly)
// ============================================================================

export const SessionType = {
  VIDEO: 'video',
  PHONE: 'phone',
  ASYNC_REVIEW: 'async_review',
} as const;
export type SessionType = typeof SessionType[keyof typeof SessionType];

export const SessionStatus = {
  SCHEDULED: 'scheduled',
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  TECHNICAL_FAILURE: 'technical_failure',
} as const;
export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];

export const CancellationReason = {
  PATIENT_REQUEST: 'patient_request',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  TECHNICAL_ISSUE: 'technical_issue',
  RESCHEDULED: 'rescheduled',
  CONDITION_RESOLVED: 'condition_resolved',
  EMERGENCY: 'emergency',
} as const;
export type CancellationReason = typeof CancellationReason[keyof typeof CancellationReason];

export const VisitNoteCategory = {
  POST_OP_FOLLOW_UP: 'post_op_follow_up',
  WOUND_CHECK: 'wound_check',
  PAIN_MANAGEMENT: 'pain_management',
  MEDICATION_REVIEW: 'medication_review',
  PT_PROGRESS: 'pt_progress',
  PRE_OP_CONSULT: 'pre_op_consult',
  DISCHARGE_FOLLOW_UP: 'discharge_follow_up',
  URGENT_CONCERN: 'urgent_concern',
  MENTAL_HEALTH: 'mental_health',
  NUTRITION: 'nutrition',
  GENERAL_CHECK_IN: 'general_check_in',
} as const;
export type VisitNoteCategory = typeof VisitNoteCategory[keyof typeof VisitNoteCategory];

export const ActionItemPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type ActionItemPriority = typeof ActionItemPriority[keyof typeof ActionItemPriority];

export const RecoveryPhase = {
  PRE_OP: 'pre_op',
  IMMEDIATE_POST_OP: 'immediate_post_op',
  EARLY_RECOVERY: 'early_recovery',
  MID_RECOVERY: 'mid_recovery',
  LATE_RECOVERY: 'late_recovery',
  MAINTENANCE: 'maintenance',
} as const;
export type RecoveryPhase = typeof RecoveryPhase[keyof typeof RecoveryPhase];

// ============================================================================
// Interfaces
// ============================================================================

export interface TelehealthSession {
  id: string;
  patientId: string;
  providerId: string;
  sessionType: SessionType;
  status: SessionStatus;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  cancelledAt?: string;
  cancellationReason?: CancellationReason;
  durationMinutes?: number;
  waitTimeMinutes?: number;
  chiefComplaint: string;
  visitNoteTemplateId?: string;
  visitNotes?: string;
  preVisitSummary?: PreVisitSummary;
  postVisitSummary?: PostVisitSummary;
  satisfactionScore?: number; // 1-5
  technicalQuality?: number; // 1-5
  followUpScheduled: boolean;
  followUpDate?: string;
}

export interface PreVisitSummary {
  generatedAt: string;
  patientId: string;
  patientName: string;
  age: number;
  surgeryType: string;
  surgeryDate: string;
  recoveryPhase: RecoveryPhase;
  daysSinceSurgery: number;
  recentVitals: VitalSnapshot[];
  painTrend: PainTrendSummary;
  currentMedications: MedicationSummary[];
  complianceMetrics: ComplianceMetrics;
  recentAlerts: string[];
  openConcerns: string[];
  lastVisitSummary?: string;
}

export interface VitalSnapshot {
  type: string;
  value: string;
  unit: string;
  recordedAt: string;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface PainTrendSummary {
  currentLevel: number;
  averageLast7Days: number;
  trend: 'decreasing' | 'stable' | 'increasing';
  peakLevel: number;
  peakDate: string;
  primaryLocation: string;
}

export interface MedicationSummary {
  name: string;
  dosage: string;
  frequency: string;
  adherenceRate: number;
  lastTaken?: string;
  refillDate?: string;
}

export interface ComplianceMetrics {
  overallScore: number;
  medicationAdherence: number;
  exerciseCompletion: number;
  woundPhotoUploads: number;
  appointmentAttendance: number;
}

export interface PostVisitSummary {
  generatedAt: string;
  sessionId: string;
  patientId: string;
  providerId: string;
  visitType: SessionType;
  duration: number;
  chiefComplaint: string;
  findings: string[];
  assessment: string;
  plan: string[];
  actionItems: PostVisitActionItem[];
  medicationChanges: MedicationChange[];
  nextVisitRecommendation: string;
  patientInstructions: string[];
  redFlags: string[];
}

export interface PostVisitActionItem {
  id: string;
  description: string;
  assignedTo: 'patient' | 'provider' | 'nurse' | 'pt' | 'pharmacy';
  priority: ActionItemPriority;
  dueDate: string;
  completed: boolean;
}

export interface MedicationChange {
  medication: string;
  changeType: 'started' | 'stopped' | 'adjusted' | 'continued';
  previousDosage?: string;
  newDosage?: string;
  reason: string;
}

export interface VisitNoteTemplate {
  id: string;
  name: string;
  category: VisitNoteCategory;
  description: string;
  sections: VisitNoteSection[];
  defaultQuestions: string[];
  applicablePhases: RecoveryPhase[];
}

export interface VisitNoteSection {
  heading: string;
  promptText: string;
  required: boolean;
}

export interface SessionAnalytics {
  totalSessions: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageDurationMinutes: number;
  averageWaitTimeMinutes: number;
  averageSatisfaction: number;
  averageTechnicalQuality: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  peakHours: { hour: number; count: number }[];
  sessionsByDay: { date: string; count: number }[];
  providerMetrics: ProviderMetric[];
}

export interface ProviderMetric {
  providerId: string;
  totalSessions: number;
  completedSessions: number;
  averageDuration: number;
  averageSatisfaction: number;
  cancellationRate: number;
}

// ============================================================================
// ID Generator
// ============================================================================

let _teleCounter = 0;
function generateTeleId(prefix: string): string {
  _teleCounter++;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${ts}_${rand}_${_teleCounter}`;
}

// ============================================================================
// Visit Note Templates (30+)
// ============================================================================

const VISIT_NOTE_TEMPLATES: VisitNoteTemplate[] = [
  // ---- Post-Op Follow-Up (6 templates) ----
  {
    id: 'vnt_postop_day1',
    name: 'Post-Op Day 1 Check-In',
    category: VisitNoteCategory.POST_OP_FOLLOW_UP,
    description: 'First day after surgery virtual check-in to assess immediate recovery.',
    sections: [
      { heading: 'Subjective', promptText: 'Patient-reported symptoms, pain level, and concerns since surgery', required: true },
      { heading: 'Vital Signs Review', promptText: 'Review current vitals: BP, HR, temperature, SpO2', required: true },
      { heading: 'Surgical Site Assessment', promptText: 'Visual assessment of surgical site via video - swelling, drainage, dressing intact', required: true },
      { heading: 'Pain Management', promptText: 'Current pain protocol effectiveness, side effects, need for adjustment', required: true },
      { heading: 'Activity Level', promptText: 'Current mobility, assistance needed, fall risk assessment', required: true },
      { heading: 'Plan', promptText: 'Continuing care plan, next assessment timeline, red flags to watch for', required: true },
    ],
    defaultQuestions: [
      'How would you rate your pain right now on a scale of 0-10?',
      'Have you been able to keep fluids down?',
      'Have you noticed any bleeding or unusual drainage from the surgical site?',
      'Have you been able to get up and move with assistance?',
      'Are you experiencing any nausea from the pain medication?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP],
  },
  {
    id: 'vnt_postop_week1',
    name: 'Post-Op Week 1 Follow-Up',
    category: VisitNoteCategory.POST_OP_FOLLOW_UP,
    description: 'One-week post-operative assessment of early recovery progress.',
    sections: [
      { heading: 'Interval History', promptText: 'Events since surgery, any complications, ER visits', required: true },
      { heading: 'Pain Assessment', promptText: 'Pain trends over first week, medication effectiveness', required: true },
      { heading: 'Wound Evaluation', promptText: 'Surgical site appearance, signs of infection, healing progress', required: true },
      { heading: 'Functional Status', promptText: 'Range of motion, weight bearing status, daily activities', required: true },
      { heading: 'Medication Review', promptText: 'All current medications, adherence, side effects', required: true },
      { heading: 'Assessment & Plan', promptText: 'Overall recovery trajectory, plan adjustments, next milestones', required: true },
    ],
    defaultQuestions: [
      'How has your pain changed over the past week?',
      'Can you show me the surgical site on camera?',
      'Have you been doing the prescribed exercises?',
      'Any fever, chills, or increased redness?',
      'How are you sleeping?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY],
  },
  {
    id: 'vnt_postop_week2',
    name: 'Post-Op Week 2 Assessment',
    category: VisitNoteCategory.POST_OP_FOLLOW_UP,
    description: 'Two-week post-operative assessment with focus on healing milestones.',
    sections: [
      { heading: 'Progress Since Last Visit', promptText: 'Changes, improvements, or setbacks since last assessment', required: true },
      { heading: 'Wound Status', promptText: 'Incision healing, suture/staple status, any drainage', required: true },
      { heading: 'Pain Trajectory', promptText: 'Pain trend, current medication needs, tapering progress', required: true },
      { heading: 'Functional Milestones', promptText: 'ROM, strength, ambulation distance, ADL independence', required: true },
      { heading: 'PT Progress', promptText: 'Physical therapy exercises, frequency, barriers', required: false },
      { heading: 'Plan', promptText: 'Next steps, medication adjustments, activity progressions', required: true },
    ],
    defaultQuestions: [
      'Are you able to do more this week compared to last week?',
      'How is the incision looking? Any concerns?',
      'Have you started physical therapy?',
      'Are you ready to begin tapering off the strong pain medication?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY],
  },
  {
    id: 'vnt_postop_month1',
    name: 'One-Month Post-Op Review',
    category: VisitNoteCategory.POST_OP_FOLLOW_UP,
    description: 'Comprehensive one-month recovery assessment and care plan review.',
    sections: [
      { heading: 'Recovery Overview', promptText: 'Overall recovery trajectory over the first month', required: true },
      { heading: 'Physical Examination', promptText: 'Video-assisted physical exam: ROM, strength, gait', required: true },
      { heading: 'Wound Final Assessment', promptText: 'Complete wound healing status, scar assessment', required: true },
      { heading: 'Pain Management Status', promptText: 'Current pain levels, medication status, non-pharmacologic strategies', required: true },
      { heading: 'Functional Outcomes', promptText: 'Activities of daily living, return-to-work status, driving', required: true },
      { heading: 'Rehab Progress', promptText: 'PT milestone achievement, exercise program compliance', required: true },
      { heading: 'Plan Forward', promptText: 'Continued rehab plan, activity progressions, return-to-sport timeline', required: true },
    ],
    defaultQuestions: [
      'How would you describe your overall recovery so far?',
      'What activities can you do now that you could not do two weeks ago?',
      'Are you still taking prescription pain medication?',
      'Have you been able to return to work or normal activities?',
      'What goals do you have for the next month?',
    ],
    applicablePhases: [RecoveryPhase.MID_RECOVERY],
  },
  {
    id: 'vnt_postop_month3',
    name: 'Three-Month Post-Op Review',
    category: VisitNoteCategory.POST_OP_FOLLOW_UP,
    description: 'Three-month recovery milestone assessment with focus on long-term outcomes.',
    sections: [
      { heading: 'Long-Term Recovery Status', promptText: 'Overall outcome, residual symptoms, satisfaction', required: true },
      { heading: 'Functional Assessment', promptText: 'Full functional evaluation: strength, ROM, endurance', required: true },
      { heading: 'Activity Level', promptText: 'Return to work, sports, recreational activities', required: true },
      { heading: 'Ongoing Concerns', promptText: 'Any persistent issues, stiffness, numbness, pain', required: true },
      { heading: 'Future Plan', promptText: 'Continued exercise, activity modifications, follow-up schedule', required: true },
    ],
    defaultQuestions: [
      'On a scale of 1-10, how satisfied are you with your recovery?',
      'Are there activities you still cannot perform?',
      'Do you have any ongoing pain or discomfort?',
      'Are you doing your home exercise program regularly?',
    ],
    applicablePhases: [RecoveryPhase.LATE_RECOVERY, RecoveryPhase.MAINTENANCE],
  },
  {
    id: 'vnt_postop_6month',
    name: 'Six-Month Post-Op Final Review',
    category: VisitNoteCategory.POST_OP_FOLLOW_UP,
    description: 'Final long-term post-operative outcome assessment.',
    sections: [
      { heading: 'Final Outcome Assessment', promptText: 'Surgical outcome, patient satisfaction, quality of life', required: true },
      { heading: 'Physical Function', promptText: 'Complete physical function assessment, objective measures', required: true },
      { heading: 'Remaining Concerns', promptText: 'Any unresolved issues or complications', required: false },
      { heading: 'Discharge Summary', promptText: 'Discharge from surgical care, ongoing recommendations', required: true },
    ],
    defaultQuestions: [
      'Do you feel the surgery met your expectations?',
      'Are there any remaining limitations in your daily life?',
      'Would you have any questions before we wrap up surgical follow-up care?',
    ],
    applicablePhases: [RecoveryPhase.MAINTENANCE],
  },

  // ---- Wound Check (4 templates) ----
  {
    id: 'vnt_wound_routine',
    name: 'Routine Wound Assessment',
    category: VisitNoteCategory.WOUND_CHECK,
    description: 'Standard scheduled wound assessment via video.',
    sections: [
      { heading: 'Visual Assessment', promptText: 'Wound appearance: color, edges, drainage, size estimation', required: true },
      { heading: 'Symptoms', promptText: 'Pain, itching, warmth, odor at wound site', required: true },
      { heading: 'Dressing Status', promptText: 'Current dressing condition, adherence to change schedule', required: true },
      { heading: 'Healing Assessment', promptText: 'Progress compared to expected healing timeline', required: true },
      { heading: 'Instructions', promptText: 'Dressing change instructions, activity modifications', required: true },
    ],
    defaultQuestions: [
      'Please show me the wound from about 6 inches away',
      'Is there any drainage on the dressing when you remove it?',
      'Any increased pain, redness, or warmth around the site?',
      'Are you keeping the wound clean and dry as instructed?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY],
  },
  {
    id: 'vnt_wound_concern',
    name: 'Wound Concern Evaluation',
    category: VisitNoteCategory.WOUND_CHECK,
    description: 'Urgent wound assessment for patient-reported concerns.',
    sections: [
      { heading: 'Chief Concern', promptText: 'What change or symptom prompted this visit', required: true },
      { heading: 'Detailed Assessment', promptText: 'Thorough visual evaluation of wound, surrounding tissue', required: true },
      { heading: 'Infection Screening', promptText: 'Signs of infection: erythema, purulence, fever, tenderness', required: true },
      { heading: 'Differential', promptText: 'Possible causes of the observed changes', required: true },
      { heading: 'Action Plan', promptText: 'Immediate actions, escalation if needed, follow-up', required: true },
    ],
    defaultQuestions: [
      'When did you first notice this change?',
      'Has the area been getting worse, better, or staying the same?',
      'Have you had any fever or chills?',
      'Did anything happen that could have caused this? A fall, hitting the area, etc.?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY],
  },
  {
    id: 'vnt_wound_suture_removal',
    name: 'Suture/Staple Assessment & Removal Planning',
    category: VisitNoteCategory.WOUND_CHECK,
    description: 'Assessment for suture or staple removal readiness.',
    sections: [
      { heading: 'Wound Assessment', promptText: 'Incision line integrity, apposition, healing status', required: true },
      { heading: 'Readiness for Removal', promptText: 'Assessment of whether wound edges are sufficiently healed', required: true },
      { heading: 'Patient Instructions', promptText: 'Instructions for in-office removal or home steri-strip care', required: true },
    ],
    defaultQuestions: [
      'Please show me the full length of the incision on camera',
      'Is there any area that appears to still be open or draining?',
      'Have the staples or sutures been catching on clothing?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY],
  },
  {
    id: 'vnt_wound_chronic',
    name: 'Chronic Wound Follow-Up',
    category: VisitNoteCategory.WOUND_CHECK,
    description: 'Follow-up for wounds with delayed healing.',
    sections: [
      { heading: 'Wound Measurement', promptText: 'Estimated wound dimensions, depth, tunneling', required: true },
      { heading: 'Tissue Assessment', promptText: 'Wound bed tissue type, granulation, epithelialization', required: true },
      { heading: 'Periwound Skin', promptText: 'Assessment of skin surrounding the wound', required: true },
      { heading: 'Current Treatment Evaluation', promptText: 'Effectiveness of current wound care regimen', required: true },
      { heading: 'Modified Plan', promptText: 'Wound care modifications, specialty referral consideration', required: true },
    ],
    defaultQuestions: [
      'Has the wound changed in size since our last visit?',
      'What does the drainage look like in color and amount?',
      'Are you using the prescribed wound care supplies correctly?',
      'Is the wound painful? More or less than last time?',
    ],
    applicablePhases: [RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY],
  },

  // ---- Pain Management (4 templates) ----
  {
    id: 'vnt_pain_initial',
    name: 'Pain Management Initial Assessment',
    category: VisitNoteCategory.PAIN_MANAGEMENT,
    description: 'Comprehensive initial pain assessment and management plan development.',
    sections: [
      { heading: 'Pain History', promptText: 'Onset, character, location, radiation, severity (0-10)', required: true },
      { heading: 'Aggravating/Relieving Factors', promptText: 'What makes pain better or worse', required: true },
      { heading: 'Current Medications', promptText: 'All current pain medications, doses, frequency', required: true },
      { heading: 'Functional Impact', promptText: 'How pain affects sleep, activity, mood, quality of life', required: true },
      { heading: 'Management Plan', promptText: 'Multimodal pain management strategy', required: true },
    ],
    defaultQuestions: [
      'Describe your pain - is it sharp, dull, burning, throbbing?',
      'Is the pain constant or does it come and go?',
      'What are you currently doing for pain relief?',
      'How is the pain affecting your daily activities and sleep?',
      'What is your goal for a comfortable pain level?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY],
  },
  {
    id: 'vnt_pain_followup',
    name: 'Pain Management Follow-Up',
    category: VisitNoteCategory.PAIN_MANAGEMENT,
    description: 'Follow-up assessment of pain management effectiveness.',
    sections: [
      { heading: 'Pain Update', promptText: 'Current pain levels vs last visit, trend over time', required: true },
      { heading: 'Medication Effectiveness', promptText: 'Current medication impact, side effects, adherence', required: true },
      { heading: 'Non-Pharmacologic Strategies', promptText: 'Ice, elevation, PT exercises, mindfulness outcomes', required: true },
      { heading: 'Plan Adjustment', promptText: 'Medication changes, new strategies, tapering plan', required: true },
    ],
    defaultQuestions: [
      'Has your pain improved, worsened, or stayed the same since last visit?',
      'Are you experiencing any side effects from pain medication?',
      'Have you tried ice, elevation, or other non-medication approaches?',
      'Are you ready to start reducing pain medication dose?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY],
  },
  {
    id: 'vnt_pain_taper',
    name: 'Opioid Tapering Assessment',
    category: VisitNoteCategory.PAIN_MANAGEMENT,
    description: 'Assessment for opioid medication tapering and transition.',
    sections: [
      { heading: 'Current Opioid Use', promptText: 'Current opioid medication, dose, frequency, duration of use', required: true },
      { heading: 'Pain Control Assessment', promptText: 'Pain levels with current regimen, functional status', required: true },
      { heading: 'Readiness for Tapering', promptText: 'Patient readiness, anxiety about tapering, support system', required: true },
      { heading: 'Tapering Schedule', promptText: 'Detailed tapering plan with timeline and milestones', required: true },
      { heading: 'Alternative Strategies', promptText: 'Non-opioid medications, physical therapy, mindfulness', required: true },
    ],
    defaultQuestions: [
      'How many pills are you taking per day currently?',
      'How do you feel about reducing your pain medication?',
      'Have you tried going longer between doses?',
      'What concerns do you have about tapering?',
    ],
    applicablePhases: [RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY],
  },
  {
    id: 'vnt_pain_breakthrough',
    name: 'Breakthrough Pain Evaluation',
    category: VisitNoteCategory.PAIN_MANAGEMENT,
    description: 'Urgent assessment for breakthrough or escalating pain.',
    sections: [
      { heading: 'Pain Episode', promptText: 'Description of breakthrough pain: onset, severity, triggers', required: true },
      { heading: 'Current Management', promptText: 'What has been tried, effectiveness', required: true },
      { heading: 'Red Flag Assessment', promptText: 'Screen for complications: infection, DVT, nerve injury', required: true },
      { heading: 'Immediate Plan', promptText: 'Acute management, escalation criteria, follow-up', required: true },
    ],
    defaultQuestions: [
      'When did this pain episode start?',
      'Is this a different kind of pain than your usual post-surgical pain?',
      'Did anything trigger this? A particular activity or movement?',
      'Have you taken your regular pain medication? Did it help?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY],
  },

  // ---- Medication Review (3 templates) ----
  {
    id: 'vnt_med_review',
    name: 'Comprehensive Medication Review',
    category: VisitNoteCategory.MEDICATION_REVIEW,
    description: 'Complete review of all medications, interactions, and side effects.',
    sections: [
      { heading: 'Current Medication List', promptText: 'Review each medication: name, dose, frequency, indication', required: true },
      { heading: 'Adherence Assessment', promptText: 'Medication compliance, barriers, missed doses', required: true },
      { heading: 'Side Effects', promptText: 'Any adverse effects, tolerability', required: true },
      { heading: 'Interactions Review', promptText: 'Check for drug-drug and drug-food interactions', required: true },
      { heading: 'Optimization Plan', promptText: 'Simplification, dose adjustments, discontinuations', required: true },
    ],
    defaultQuestions: [
      'Let us go through each of your medications one by one. Which ones are you taking?',
      'Are you having trouble remembering to take any of your medications?',
      'Have you noticed any side effects from your medications?',
      'Are you taking any over-the-counter medications or supplements?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY],
  },
  {
    id: 'vnt_med_anticoag',
    name: 'Anticoagulation Management',
    category: VisitNoteCategory.MEDICATION_REVIEW,
    description: 'Follow-up for DVT prophylaxis medication management.',
    sections: [
      { heading: 'Current Anticoagulation', promptText: 'Medication, dose, duration of therapy', required: true },
      { heading: 'Compliance', promptText: 'Adherence to anticoagulation therapy, missed doses', required: true },
      { heading: 'Bleeding Assessment', promptText: 'Any signs of bleeding: bruising, gum bleeding, blood in urine/stool', required: true },
      { heading: 'DVT/PE Screening', promptText: 'Calf swelling, pain, shortness of breath', required: true },
      { heading: 'Plan', promptText: 'Continue, adjust, or discontinue anticoagulation', required: true },
    ],
    defaultQuestions: [
      'Have you missed any doses of your blood thinner?',
      'Have you noticed any unusual bruising or bleeding?',
      'Any calf swelling, pain, or redness in your legs?',
      'Any chest pain or shortness of breath?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY],
  },
  {
    id: 'vnt_med_refill',
    name: 'Medication Refill & Adjustment',
    category: VisitNoteCategory.MEDICATION_REVIEW,
    description: 'Visit for medication refill needs and dose adjustments.',
    sections: [
      { heading: 'Refill Needs', promptText: 'Which medications need refilling', required: true },
      { heading: 'Current Effectiveness', promptText: 'How well current medications are working', required: true },
      { heading: 'Adjustments', promptText: 'Any dose changes or medication switches needed', required: true },
      { heading: 'Prescriptions', promptText: 'New prescriptions or renewals to be sent', required: true },
    ],
    defaultQuestions: [
      'Which medications are you running low on?',
      'Do you feel your current medications are working well?',
      'Any side effects we should address?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY, RecoveryPhase.MAINTENANCE],
  },

  // ---- PT Progress (3 templates) ----
  {
    id: 'vnt_pt_initial',
    name: 'Physical Therapy Initial Check-In',
    category: VisitNoteCategory.PT_PROGRESS,
    description: 'Initial check-in regarding physical therapy progress.',
    sections: [
      { heading: 'PT Program Status', promptText: 'Has PT started, frequency, location (home/outpatient)', required: true },
      { heading: 'Exercise Compliance', promptText: 'Home exercise program adherence, barriers', required: true },
      { heading: 'Range of Motion', promptText: 'Current ROM measurements vs goals', required: true },
      { heading: 'Strength Assessment', promptText: 'Current strength levels vs baseline and goals', required: true },
      { heading: 'Plan', promptText: 'PT progression, exercise modifications, goal adjustment', required: true },
    ],
    defaultQuestions: [
      'Have you started physical therapy?',
      'How many times per week are you doing your exercises?',
      'Can you show me your range of motion on camera?',
      'Which exercises are the most difficult for you?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY],
  },
  {
    id: 'vnt_pt_progress',
    name: 'PT Progress Review',
    category: VisitNoteCategory.PT_PROGRESS,
    description: 'Progress review during active physical therapy phase.',
    sections: [
      { heading: 'Progress Update', promptText: 'Functional improvements, milestone achievement', required: true },
      { heading: 'ROM Update', promptText: 'Updated ROM measurements, comparison to goals', required: true },
      { heading: 'Exercise Progression', promptText: 'Current exercise level, ready for progression', required: true },
      { heading: 'Barriers', promptText: 'Any barriers to progress: pain, swelling, motivation', required: true },
      { heading: 'Updated Goals', promptText: 'Revised timeline and goals if needed', required: true },
    ],
    defaultQuestions: [
      'What improvements have you noticed since you started PT?',
      'Are you able to do exercises that were difficult before?',
      'Is pain limiting your ability to do the exercises?',
      'What are your goals for the next 2 weeks?',
    ],
    applicablePhases: [RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY],
  },
  {
    id: 'vnt_pt_return_activity',
    name: 'Return to Activity Assessment',
    category: VisitNoteCategory.PT_PROGRESS,
    description: 'Assessment for returning to specific activities or sports.',
    sections: [
      { heading: 'Activity Goals', promptText: 'Which activities patient wants to return to', required: true },
      { heading: 'Functional Testing', promptText: 'Video-guided functional tests via telehealth', required: true },
      { heading: 'Strength & Stability', promptText: 'Assessment of stability and strength for desired activities', required: true },
      { heading: 'Clearance Decision', promptText: 'Clear, modify restrictions, or continue restrictions', required: true },
      { heading: 'Graduated Return Plan', promptText: 'Step-by-step return-to-activity plan', required: true },
    ],
    defaultQuestions: [
      'What specific activities are you hoping to return to?',
      'Can you demonstrate a single-leg stand for me on camera?',
      'Do you feel confident in the stability of the surgical area?',
      'Are you still having any pain with activity?',
    ],
    applicablePhases: [RecoveryPhase.LATE_RECOVERY, RecoveryPhase.MAINTENANCE],
  },

  // ---- Pre-Op Consult (2 templates) ----
  {
    id: 'vnt_preop_initial',
    name: 'Pre-Operative Initial Consultation',
    category: VisitNoteCategory.PRE_OP_CONSULT,
    description: 'Initial telehealth consultation for surgical planning.',
    sections: [
      { heading: 'Reason for Surgery', promptText: 'Clinical indication, history, conservative treatments tried', required: true },
      { heading: 'Medical History', promptText: 'Past medical/surgical history, allergies, medications', required: true },
      { heading: 'Pre-Op Assessment', promptText: 'General health assessment, risk factors', required: true },
      { heading: 'Surgical Plan Discussion', promptText: 'Procedure description, expected outcomes, risks', required: true },
      { heading: 'Patient Questions', promptText: 'Address patient questions and concerns', required: true },
      { heading: 'Pre-Op Preparation', promptText: 'Instructions for surgery day preparation', required: true },
    ],
    defaultQuestions: [
      'Tell me about the problem that has led us to consider surgery',
      'What treatments have you already tried?',
      'Do you have any chronic medical conditions?',
      'What medications and supplements are you currently taking?',
      'Do you have any questions about the procedure?',
    ],
    applicablePhases: [RecoveryPhase.PRE_OP],
  },
  {
    id: 'vnt_preop_clearance',
    name: 'Pre-Operative Clearance Follow-Up',
    category: VisitNoteCategory.PRE_OP_CONSULT,
    description: 'Follow-up to review pre-op clearance results and finalize surgical plan.',
    sections: [
      { heading: 'Pre-Op Testing Results', promptText: 'Lab results, imaging, cardiac clearance, other tests', required: true },
      { heading: 'Medication Management', promptText: 'Pre-op medication hold/continue instructions', required: true },
      { heading: 'Final Instructions', promptText: 'NPO instructions, arrival time, what to bring', required: true },
      { heading: 'Questions', promptText: 'Final patient questions before surgery', required: true },
    ],
    defaultQuestions: [
      'Have you completed all the required pre-op testing?',
      'Do you understand which medications to stop before surgery?',
      'Do you have a ride arranged for surgery day?',
      'Any new health concerns since our last visit?',
    ],
    applicablePhases: [RecoveryPhase.PRE_OP],
  },

  // ---- Discharge Follow-Up (2 templates) ----
  {
    id: 'vnt_discharge_day1',
    name: 'First Day Home After Discharge',
    category: VisitNoteCategory.DISCHARGE_FOLLOW_UP,
    description: 'Check-in for patients on their first day home after hospital discharge.',
    sections: [
      { heading: 'Transition Home', promptText: 'How the transition from hospital to home went', required: true },
      { heading: 'Home Setup', promptText: 'Home safety assessment, equipment in place', required: true },
      { heading: 'Medication Setup', promptText: 'Have all medications been obtained, schedule understood', required: true },
      { heading: 'Support System', promptText: 'Caregiver availability, assistance with ADLs', required: true },
      { heading: 'Concerns', promptText: 'Immediate concerns or questions', required: true },
    ],
    defaultQuestions: [
      'How was the first night at home?',
      'Were you able to pick up all your medications from the pharmacy?',
      'Do you have someone helping you at home?',
      'Is your home set up safely - clear pathways, grab bars if needed?',
      'Do you know when to call us for help?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY],
  },
  {
    id: 'vnt_discharge_week1',
    name: 'One-Week Post-Discharge Check-In',
    category: VisitNoteCategory.DISCHARGE_FOLLOW_UP,
    description: 'One-week check-in to ensure smooth post-discharge recovery.',
    sections: [
      { heading: 'Adjustment', promptText: 'How patient is adjusting to home recovery', required: true },
      { heading: 'Symptom Management', promptText: 'Pain control, bowel function, appetite, sleep', required: true },
      { heading: 'Activity Level', promptText: 'Ambulation, independence, exercise compliance', required: true },
      { heading: 'Follow-Up Compliance', promptText: 'PT scheduled, appointments made, prescriptions filled', required: true },
      { heading: 'Action Items', promptText: 'Outstanding items to address', required: true },
    ],
    defaultQuestions: [
      'How are you managing with daily activities at home?',
      'Are you sleeping well?',
      'Have you scheduled your physical therapy?',
      'Is your appetite back to normal?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY],
  },

  // ---- Urgent Concern (2 templates) ----
  {
    id: 'vnt_urgent_general',
    name: 'Urgent Clinical Concern',
    category: VisitNoteCategory.URGENT_CONCERN,
    description: 'Template for urgent telehealth visits for unexpected symptoms or concerns.',
    sections: [
      { heading: 'Chief Complaint', promptText: 'Primary reason for urgent visit', required: true },
      { heading: 'History of Present Illness', promptText: 'Onset, duration, severity, associated symptoms', required: true },
      { heading: 'Relevant Surgical History', promptText: 'Surgical procedure, date, relevant post-op course', required: true },
      { heading: 'Assessment', promptText: 'Clinical assessment of concern', required: true },
      { heading: 'Red Flags', promptText: 'Screen for emergency indicators', required: true },
      { heading: 'Disposition', promptText: 'Manage telehealth, in-office visit, or ER referral', required: true },
    ],
    defaultQuestions: [
      'What is your main concern right now?',
      'When did this start?',
      'On a scale of 0-10, how severe is this?',
      'Have you had any fever?',
      'Are you having any difficulty breathing?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY],
  },
  {
    id: 'vnt_urgent_fall',
    name: 'Post-Fall Assessment',
    category: VisitNoteCategory.URGENT_CONCERN,
    description: 'Assessment following a reported fall during recovery.',
    sections: [
      { heading: 'Fall Details', promptText: 'When, where, how the fall occurred, witnessed or unwitnessed', required: true },
      { heading: 'Injury Assessment', promptText: 'Visual assessment of any injuries, surgical site impact', required: true },
      { heading: 'Neurological Screen', promptText: 'Consciousness, orientation, headache, vision changes', required: true },
      { heading: 'Surgical Site Status', promptText: 'Impact on surgical area, hardware, implant concerns', required: true },
      { heading: 'Disposition', promptText: 'ER referral, imaging needed, or home monitoring plan', required: true },
    ],
    defaultQuestions: [
      'Can you tell me exactly what happened?',
      'Did you hit your head?',
      'Did you land on or near the surgical site?',
      'Can you still bear weight / move the operated area?',
      'Are you dizzy right now?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY],
  },

  // ---- Mental Health (3 templates) ----
  {
    id: 'vnt_mh_screen',
    name: 'Post-Surgical Mental Health Screening',
    category: VisitNoteCategory.MENTAL_HEALTH,
    description: 'Screening for depression, anxiety, and adjustment disorders post-surgery.',
    sections: [
      { heading: 'Mood Assessment', promptText: 'PHQ-2/PHQ-9 screening, current mood, motivation', required: true },
      { heading: 'Anxiety Screening', promptText: 'GAD-2/GAD-7 screening, specific fears, worry patterns', required: true },
      { heading: 'Sleep Assessment', promptText: 'Sleep quality, insomnia, nighttime pain interference', required: true },
      { heading: 'Recovery Adjustment', promptText: 'Coping with limitations, frustration, timeline expectations', required: true },
      { heading: 'Support System', promptText: 'Social support, caregiver stress, isolation concerns', required: true },
      { heading: 'Plan', promptText: 'Counseling referral, coping strategies, follow-up', required: true },
    ],
    defaultQuestions: [
      'Over the past two weeks, how often have you felt down or hopeless?',
      'Are you feeling anxious about your recovery?',
      'How has your sleep been?',
      'Do you feel you have adequate emotional support?',
      'Are there things about the recovery that are particularly frustrating?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY],
  },
  {
    id: 'vnt_mh_coping',
    name: 'Recovery Coping Strategies Session',
    category: VisitNoteCategory.MENTAL_HEALTH,
    description: 'Focused session on coping strategies for recovery challenges.',
    sections: [
      { heading: 'Current Challenges', promptText: 'What aspects of recovery are most difficult', required: true },
      { heading: 'Current Coping', promptText: 'What strategies patient is currently using', required: true },
      { heading: 'New Strategies', promptText: 'Introduction of evidence-based coping techniques', required: true },
      { heading: 'Goals', promptText: 'Specific coping goals for next week', required: true },
    ],
    defaultQuestions: [
      'What has been the hardest part of your recovery emotionally?',
      'What do you do when you feel frustrated or overwhelmed?',
      'Have you tried any relaxation techniques like deep breathing?',
      'What motivates you to keep pushing through the recovery?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY],
  },
  {
    id: 'vnt_mh_caregiver',
    name: 'Caregiver Support Check-In',
    category: VisitNoteCategory.MENTAL_HEALTH,
    description: 'Assessment and support for patient caregiver well-being.',
    sections: [
      { heading: 'Caregiver Status', promptText: 'How the caregiver is coping, stress level', required: true },
      { heading: 'Caregiving Challenges', promptText: 'Specific difficulties, time demands, physical strain', required: true },
      { heading: 'Resources', promptText: 'Available support resources, respite care options', required: true },
      { heading: 'Plan', promptText: 'Action items to support both patient and caregiver', required: true },
    ],
    defaultQuestions: [
      'How are you doing as a caregiver?',
      'Are you able to take breaks and care for yourself?',
      'What aspects of caregiving are the most challenging?',
      'Would you benefit from connecting with a caregiver support group?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY],
  },

  // ---- Nutrition (2 templates) ----
  {
    id: 'vnt_nutrition_postop',
    name: 'Post-Operative Nutrition Assessment',
    category: VisitNoteCategory.NUTRITION,
    description: 'Nutritional assessment and guidance for optimal healing.',
    sections: [
      { heading: 'Dietary Intake', promptText: 'Current eating habits, appetite, caloric intake', required: true },
      { heading: 'Protein Intake', promptText: 'Protein consumption for wound healing support', required: true },
      { heading: 'Hydration', promptText: 'Fluid intake, dehydration risk factors', required: true },
      { heading: 'GI Issues', promptText: 'Constipation (common with opioids), nausea, appetite loss', required: true },
      { heading: 'Nutritional Recommendations', promptText: 'Specific dietary recommendations for healing', required: true },
    ],
    defaultQuestions: [
      'How has your appetite been since surgery?',
      'Are you eating enough protein? Meat, eggs, dairy, beans?',
      'How much water are you drinking per day?',
      'Are you having any constipation from pain medications?',
      'Are you taking any supplements like vitamin C or zinc?',
    ],
    applicablePhases: [RecoveryPhase.IMMEDIATE_POST_OP, RecoveryPhase.EARLY_RECOVERY],
  },
  {
    id: 'vnt_nutrition_weight',
    name: 'Weight Management During Recovery',
    category: VisitNoteCategory.NUTRITION,
    description: 'Nutrition guidance for weight management during limited mobility.',
    sections: [
      { heading: 'Weight Trend', promptText: 'Current weight, changes since surgery', required: true },
      { heading: 'Activity Limitations', promptText: 'Current mobility restrictions affecting caloric expenditure', required: true },
      { heading: 'Dietary Adjustments', promptText: 'Caloric intake adjustments for reduced activity', required: true },
      { heading: 'Meal Planning', promptText: 'Practical meal planning strategies', required: true },
    ],
    defaultQuestions: [
      'Have you noticed weight changes since your surgery?',
      'Are you eating out of boredom due to reduced activity?',
      'Do you need help with meal planning during recovery?',
    ],
    applicablePhases: [RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY],
  },

  // ---- General Check-In (2 templates) ----
  {
    id: 'vnt_checkin_general',
    name: 'General Recovery Check-In',
    category: VisitNoteCategory.GENERAL_CHECK_IN,
    description: 'General purpose recovery check-in for routine monitoring.',
    sections: [
      { heading: 'Overall Status', promptText: 'General well-being, energy level, mood', required: true },
      { heading: 'Recovery Progress', promptText: 'Self-reported progress, milestones achieved', required: true },
      { heading: 'Concerns', promptText: 'Any current concerns or questions', required: true },
      { heading: 'Next Steps', promptText: 'Upcoming milestones, appointments, goals', required: true },
    ],
    defaultQuestions: [
      'How are you feeling overall today?',
      'What is going well with your recovery?',
      'Do you have any concerns or questions?',
      'What are your goals for the coming week?',
    ],
    applicablePhases: [RecoveryPhase.EARLY_RECOVERY, RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY, RecoveryPhase.MAINTENANCE],
  },
  {
    id: 'vnt_checkin_milestone',
    name: 'Recovery Milestone Celebration',
    category: VisitNoteCategory.GENERAL_CHECK_IN,
    description: 'Check-in focused on celebrating milestones and setting new goals.',
    sections: [
      { heading: 'Milestone Achievement', promptText: 'What milestone was reached, patient response', required: true },
      { heading: 'Progress Summary', promptText: 'Overview of progress from surgery to now', required: true },
      { heading: 'New Goals', promptText: 'Setting new goals for next recovery phase', required: true },
      { heading: 'Encouragement', promptText: 'Positive reinforcement and motivation', required: true },
    ],
    defaultQuestions: [
      'Congratulations on reaching this milestone! How do you feel about your progress?',
      'What has been the key to your success so far?',
      'What would you like to achieve next?',
      'Is there anything holding you back from the next goal?',
    ],
    applicablePhases: [RecoveryPhase.MID_RECOVERY, RecoveryPhase.LATE_RECOVERY, RecoveryPhase.MAINTENANCE],
  },
];

// ============================================================================
// Seed: Simulated Patient Data for Pre-Visit Summaries
// ============================================================================

interface SeedPatient {
  id: string;
  name: string;
  age: number;
  surgeryType: string;
  surgeryDate: string;
  recoveryPhase: RecoveryPhase;
  vitals: VitalSnapshot[];
  painTrend: PainTrendSummary;
  medications: MedicationSummary[];
  compliance: ComplianceMetrics;
  alerts: string[];
  concerns: string[];
}

const SEED_PATIENTS: SeedPatient[] = [
  {
    id: 'pat_001',
    name: 'John Matthews',
    age: 62,
    surgeryType: 'Total Knee Replacement (Right)',
    surgeryDate: '2025-10-28',
    recoveryPhase: RecoveryPhase.EARLY_RECOVERY,
    vitals: [
      { type: 'Blood Pressure', value: '128/82', unit: 'mmHg', recordedAt: '2025-11-08T08:00:00Z', trend: 'stable' },
      { type: 'Heart Rate', value: '76', unit: 'bpm', recordedAt: '2025-11-08T08:00:00Z', trend: 'stable' },
      { type: 'Temperature', value: '98.4', unit: 'F', recordedAt: '2025-11-08T08:00:00Z', trend: 'improving' },
      { type: 'SpO2', value: '97', unit: '%', recordedAt: '2025-11-08T08:00:00Z', trend: 'stable' },
    ],
    painTrend: { currentLevel: 4, averageLast7Days: 5.2, trend: 'decreasing', peakLevel: 8, peakDate: '2025-10-29', primaryLocation: 'Right knee' },
    medications: [
      { name: 'Oxycodone', dosage: '5mg', frequency: 'Q8H PRN', adherenceRate: 0.85, lastTaken: '2025-11-08T06:00:00Z' },
      { name: 'Gabapentin', dosage: '300mg', frequency: 'TID', adherenceRate: 0.92, lastTaken: '2025-11-08T08:00:00Z' },
      { name: 'Enoxaparin', dosage: '40mg', frequency: 'Daily', adherenceRate: 1.0, lastTaken: '2025-11-08T09:00:00Z' },
      { name: 'Acetaminophen', dosage: '1000mg', frequency: 'Q6H', adherenceRate: 0.9, lastTaken: '2025-11-08T08:00:00Z' },
    ],
    compliance: { overallScore: 88, medicationAdherence: 92, exerciseCompletion: 78, woundPhotoUploads: 95, appointmentAttendance: 100 },
    alerts: ['Mild swelling noted day 5 - resolved with elevation', 'Pain spike to 7/10 after first PT session'],
    concerns: ['Concerned about knee flexion progress', 'Requests earlier opioid taper timeline'],
  },
  {
    id: 'pat_002',
    name: 'Maria Gonzalez',
    age: 55,
    surgeryType: 'Total Hip Replacement (Left)',
    surgeryDate: '2025-10-15',
    recoveryPhase: RecoveryPhase.MID_RECOVERY,
    vitals: [
      { type: 'Blood Pressure', value: '118/74', unit: 'mmHg', recordedAt: '2025-11-08T07:30:00Z', trend: 'stable' },
      { type: 'Heart Rate', value: '68', unit: 'bpm', recordedAt: '2025-11-08T07:30:00Z', trend: 'stable' },
      { type: 'Temperature', value: '98.6', unit: 'F', recordedAt: '2025-11-08T07:30:00Z', trend: 'stable' },
      { type: 'SpO2', value: '98', unit: '%', recordedAt: '2025-11-08T07:30:00Z', trend: 'stable' },
    ],
    painTrend: { currentLevel: 2, averageLast7Days: 2.8, trend: 'decreasing', peakLevel: 7, peakDate: '2025-10-16', primaryLocation: 'Left hip' },
    medications: [
      { name: 'Acetaminophen', dosage: '500mg', frequency: 'Q6H PRN', adherenceRate: 0.88, lastTaken: '2025-11-08T06:00:00Z' },
      { name: 'Celecoxib', dosage: '200mg', frequency: 'BID', adherenceRate: 0.95, lastTaken: '2025-11-08T08:00:00Z' },
    ],
    compliance: { overallScore: 94, medicationAdherence: 95, exerciseCompletion: 92, woundPhotoUploads: 90, appointmentAttendance: 100 },
    alerts: [],
    concerns: ['Wants to know when she can return to gardening'],
  },
  {
    id: 'pat_003',
    name: 'David Lee',
    age: 48,
    surgeryType: 'Total Hip Replacement (Right)',
    surgeryDate: '2025-10-25',
    recoveryPhase: RecoveryPhase.EARLY_RECOVERY,
    vitals: [
      { type: 'Blood Pressure', value: '132/86', unit: 'mmHg', recordedAt: '2025-11-08T09:00:00Z', trend: 'stable' },
      { type: 'Heart Rate', value: '72', unit: 'bpm', recordedAt: '2025-11-08T09:00:00Z', trend: 'improving' },
      { type: 'Temperature', value: '98.8', unit: 'F', recordedAt: '2025-11-08T09:00:00Z', trend: 'stable' },
      { type: 'SpO2', value: '97', unit: '%', recordedAt: '2025-11-08T09:00:00Z', trend: 'stable' },
    ],
    painTrend: { currentLevel: 3, averageLast7Days: 4.1, trend: 'decreasing', peakLevel: 7, peakDate: '2025-10-26', primaryLocation: 'Right hip' },
    medications: [
      { name: 'Acetaminophen', dosage: '1000mg', frequency: 'Q8H', adherenceRate: 0.93, lastTaken: '2025-11-08T08:00:00Z' },
      { name: 'Rivaroxaban', dosage: '10mg', frequency: 'Daily', adherenceRate: 1.0, lastTaken: '2025-11-08T09:00:00Z' },
    ],
    compliance: { overallScore: 90, medicationAdherence: 96, exerciseCompletion: 82, woundPhotoUploads: 88, appointmentAttendance: 100 },
    alerts: ['Transitioned from toe-touch to partial weight bearing'],
    concerns: ['Anxious about returning to work (office job)'],
  },
  {
    id: 'pat_005',
    name: 'Kevin O\'Brien',
    age: 42,
    surgeryType: 'Lumbar Spinal Fusion (L4-L5)',
    surgeryDate: '2025-10-20',
    recoveryPhase: RecoveryPhase.MID_RECOVERY,
    vitals: [
      { type: 'Blood Pressure', value: '126/80', unit: 'mmHg', recordedAt: '2025-11-08T08:30:00Z', trend: 'stable' },
      { type: 'Heart Rate', value: '70', unit: 'bpm', recordedAt: '2025-11-08T08:30:00Z', trend: 'stable' },
      { type: 'Temperature', value: '98.4', unit: 'F', recordedAt: '2025-11-08T08:30:00Z', trend: 'stable' },
      { type: 'SpO2', value: '98', unit: '%', recordedAt: '2025-11-08T08:30:00Z', trend: 'stable' },
    ],
    painTrend: { currentLevel: 3, averageLast7Days: 3.6, trend: 'decreasing', peakLevel: 8, peakDate: '2025-10-21', primaryLocation: 'Lower back' },
    medications: [
      { name: 'Oxycodone', dosage: '5mg', frequency: 'Q8H', adherenceRate: 0.9, lastTaken: '2025-11-08T06:00:00Z' },
      { name: 'Gabapentin', dosage: '300mg', frequency: 'BID', adherenceRate: 0.88, lastTaken: '2025-11-08T08:00:00Z' },
      { name: 'Acetaminophen', dosage: '500mg', frequency: 'Q6H PRN', adherenceRate: 0.8, lastTaken: '2025-11-08T06:00:00Z' },
    ],
    compliance: { overallScore: 82, medicationAdherence: 86, exerciseCompletion: 74, woundPhotoUploads: 85, appointmentAttendance: 100 },
    alerts: ['Pain spike during PT - modified exercises', 'Lifting restriction reminder sent'],
    concerns: ['Worried about long-term back flexibility', 'Difficulty sleeping on back'],
  },
  {
    id: 'pat_008',
    name: 'Lisa Chang',
    age: 29,
    surgeryType: 'ACL Reconstruction (Left Knee)',
    surgeryDate: '2025-10-10',
    recoveryPhase: RecoveryPhase.MID_RECOVERY,
    vitals: [
      { type: 'Blood Pressure', value: '112/70', unit: 'mmHg', recordedAt: '2025-11-08T07:00:00Z', trend: 'stable' },
      { type: 'Heart Rate', value: '64', unit: 'bpm', recordedAt: '2025-11-08T07:00:00Z', trend: 'stable' },
      { type: 'Temperature', value: '98.2', unit: 'F', recordedAt: '2025-11-08T07:00:00Z', trend: 'stable' },
      { type: 'SpO2', value: '99', unit: '%', recordedAt: '2025-11-08T07:00:00Z', trend: 'stable' },
    ],
    painTrend: { currentLevel: 2, averageLast7Days: 2.4, trend: 'decreasing', peakLevel: 6, peakDate: '2025-10-11', primaryLocation: 'Left knee' },
    medications: [
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'Q8H PRN', adherenceRate: 0.75, lastTaken: '2025-11-07T20:00:00Z' },
    ],
    compliance: { overallScore: 96, medicationAdherence: 88, exerciseCompletion: 98, woundPhotoUploads: 95, appointmentAttendance: 100 },
    alerts: [],
    concerns: ['Eager to return to recreational soccer - timeline?'],
  },
];

// ============================================================================
// Seed Sessions
// ============================================================================

function generateSeedSessions(): TelehealthSession[] {
  const sessions: TelehealthSession[] = [];

  const add = (
    id: string, patientId: string, providerId: string, sessionType: SessionType,
    status: SessionStatus, scheduledAt: string, chiefComplaint: string,
    opts: Partial<TelehealthSession> = {}
  ) => {
    sessions.push({
      id,
      patientId,
      providerId,
      sessionType,
      status,
      scheduledAt,
      chiefComplaint,
      followUpScheduled: false,
      ...opts,
    });
  };

  // Completed sessions
  add('ts_001', 'pat_001', 'usr_dr_001', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-01T09:00:00Z', 'Post-TKR day 4 follow-up',
    { startedAt: '2025-11-01T09:02:00Z', endedAt: '2025-11-01T09:22:00Z', durationMinutes: 20, waitTimeMinutes: 2, satisfactionScore: 5, technicalQuality: 4, visitNoteTemplateId: 'vnt_postop_day1', followUpScheduled: true, followUpDate: '2025-11-08' });

  add('ts_002', 'pat_002', 'usr_dr_001', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-01T10:00:00Z', 'Post-THR 2-week wound check',
    { startedAt: '2025-11-01T10:05:00Z', endedAt: '2025-11-01T10:20:00Z', durationMinutes: 15, waitTimeMinutes: 5, satisfactionScore: 4, technicalQuality: 5, visitNoteTemplateId: 'vnt_wound_routine' });

  add('ts_003', 'pat_003', 'usr_dr_002', SessionType.PHONE, SessionStatus.COMPLETED,
    '2025-11-02T14:00:00Z', 'Medication review - transitioning anticoagulant',
    { startedAt: '2025-11-02T14:00:00Z', endedAt: '2025-11-02T14:12:00Z', durationMinutes: 12, waitTimeMinutes: 0, satisfactionScore: 4, technicalQuality: 5, visitNoteTemplateId: 'vnt_med_anticoag' });

  add('ts_004', 'pat_005', 'usr_dr_002', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-03T09:30:00Z', 'Spinal fusion 2-week follow-up',
    { startedAt: '2025-11-03T09:33:00Z', endedAt: '2025-11-03T09:58:00Z', durationMinutes: 25, waitTimeMinutes: 3, satisfactionScore: 5, technicalQuality: 4, visitNoteTemplateId: 'vnt_postop_week2', followUpScheduled: true, followUpDate: '2025-11-10' });

  add('ts_005', 'pat_008', 'usr_dr_003', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-03T11:00:00Z', 'ACL reconstruction PT progress review',
    { startedAt: '2025-11-03T11:01:00Z', endedAt: '2025-11-03T11:18:00Z', durationMinutes: 17, waitTimeMinutes: 1, satisfactionScore: 5, technicalQuality: 5, visitNoteTemplateId: 'vnt_pt_progress' });

  add('ts_006', 'pat_001', 'usr_dr_001', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-04T09:00:00Z', 'Post-TKR week 1 comprehensive review',
    { startedAt: '2025-11-04T09:04:00Z', endedAt: '2025-11-04T09:30:00Z', durationMinutes: 26, waitTimeMinutes: 4, satisfactionScore: 4, technicalQuality: 4, visitNoteTemplateId: 'vnt_postop_week1' });

  add('ts_007', 'pat_002', 'usr_dr_001', SessionType.ASYNC_REVIEW, SessionStatus.COMPLETED,
    '2025-11-05T00:00:00Z', 'Wound photo async review',
    { startedAt: '2025-11-05T08:15:00Z', endedAt: '2025-11-05T08:25:00Z', durationMinutes: 10, waitTimeMinutes: 0, satisfactionScore: 4, technicalQuality: 5, visitNoteTemplateId: 'vnt_wound_routine' });

  add('ts_008', 'pat_005', 'usr_dr_002', SessionType.PHONE, SessionStatus.COMPLETED,
    '2025-11-05T15:00:00Z', 'Pain management follow-up call',
    { startedAt: '2025-11-05T15:02:00Z', endedAt: '2025-11-05T15:14:00Z', durationMinutes: 12, waitTimeMinutes: 2, satisfactionScore: 3, technicalQuality: 5, visitNoteTemplateId: 'vnt_pain_followup' });

  add('ts_009', 'pat_003', 'usr_dr_002', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-06T10:00:00Z', 'Post-THR 2-week assessment',
    { startedAt: '2025-11-06T10:08:00Z', endedAt: '2025-11-06T10:32:00Z', durationMinutes: 24, waitTimeMinutes: 8, satisfactionScore: 4, technicalQuality: 3, visitNoteTemplateId: 'vnt_postop_week2' });

  add('ts_010', 'pat_001', 'usr_dr_001', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-07T09:00:00Z', 'Breakthrough pain evaluation',
    { startedAt: '2025-11-07T09:01:00Z', endedAt: '2025-11-07T09:16:00Z', durationMinutes: 15, waitTimeMinutes: 1, satisfactionScore: 5, technicalQuality: 5, visitNoteTemplateId: 'vnt_pain_breakthrough' });

  add('ts_011', 'pat_008', 'usr_dr_003', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-07T14:00:00Z', 'Mental health screening - recovery adjustment',
    { startedAt: '2025-11-07T14:03:00Z', endedAt: '2025-11-07T14:23:00Z', durationMinutes: 20, waitTimeMinutes: 3, satisfactionScore: 5, technicalQuality: 5, visitNoteTemplateId: 'vnt_mh_screen' });

  add('ts_012', 'pat_002', 'usr_dr_001', SessionType.VIDEO, SessionStatus.COMPLETED,
    '2025-11-08T09:00:00Z', '4-week post-THR comprehensive review',
    { startedAt: '2025-11-08T09:05:00Z', endedAt: '2025-11-08T09:35:00Z', durationMinutes: 30, waitTimeMinutes: 5, satisfactionScore: 5, technicalQuality: 4, visitNoteTemplateId: 'vnt_postop_month1' });

  // Cancelled
  add('ts_013', 'pat_003', 'usr_dr_002', SessionType.VIDEO, SessionStatus.CANCELLED,
    '2025-11-04T14:00:00Z', 'Routine follow-up',
    { cancelledAt: '2025-11-04T10:00:00Z', cancellationReason: CancellationReason.PATIENT_REQUEST });

  // No-show
  add('ts_014', 'pat_005', 'usr_dr_002', SessionType.PHONE, SessionStatus.NO_SHOW,
    '2025-11-06T16:00:00Z', 'Medication review call');

  // Scheduled (upcoming)
  add('ts_015', 'pat_001', 'usr_dr_001', SessionType.VIDEO, SessionStatus.SCHEDULED,
    '2025-11-10T09:00:00Z', 'Post-TKR week 2 follow-up');

  add('ts_016', 'pat_005', 'usr_dr_002', SessionType.VIDEO, SessionStatus.SCHEDULED,
    '2025-11-10T11:00:00Z', 'Spinal fusion 3-week assessment');

  add('ts_017', 'pat_003', 'usr_dr_002', SessionType.VIDEO, SessionStatus.SCHEDULED,
    '2025-11-11T10:00:00Z', 'Post-THR 3-week review');

  add('ts_018', 'pat_008', 'usr_dr_003', SessionType.VIDEO, SessionStatus.SCHEDULED,
    '2025-11-12T14:00:00Z', 'ACL reconstruction - return to activity assessment');

  add('ts_019', 'pat_002', 'usr_dr_001', SessionType.PHONE, SessionStatus.SCHEDULED,
    '2025-11-15T10:00:00Z', 'Final follow-up before discharge from surgical care');

  add('ts_020', 'pat_001', 'usr_dr_001', SessionType.VIDEO, SessionStatus.SCHEDULED,
    '2025-11-14T09:00:00Z', 'Opioid taper assessment');

  return sessions;
}

// ============================================================================
// Telehealth Service Implementation
// ============================================================================

class TelehealthServiceImpl {
  private sessions: TelehealthSession[];
  private patients: SeedPatient[];

  constructor() {
    this.sessions = generateSeedSessions();
    this.patients = [...SEED_PATIENTS];
  }

  // ==========================================================================
  // Session Lifecycle
  // ==========================================================================

  /**
   * Creates a new telehealth session.
   */
  createSession(params: {
    patientId: string;
    providerId: string;
    sessionType: SessionType;
    scheduledAt: string;
    chiefComplaint: string;
  }): TelehealthSession {
    const session: TelehealthSession = {
      id: generateTeleId('ts'),
      patientId: params.patientId,
      providerId: params.providerId,
      sessionType: params.sessionType,
      status: SessionStatus.SCHEDULED,
      scheduledAt: params.scheduledAt,
      chiefComplaint: params.chiefComplaint,
      followUpScheduled: false,
    };

    this.sessions.push(session);
    return session;
  }

  /**
   * Moves a session to the waiting room, ready for the provider to join.
   */
  scheduleSession(sessionId: string, scheduledAt: string): TelehealthSession {
    const session = this.findSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    session.scheduledAt = scheduledAt;
    session.status = SessionStatus.SCHEDULED;
    return session;
  }

  /**
   * Starts a telehealth session - transitions from scheduled/waiting to in-progress.
   */
  startSession(sessionId: string): TelehealthSession {
    const session = this.findSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (session.status !== SessionStatus.SCHEDULED && session.status !== SessionStatus.WAITING) {
      throw new Error(`Cannot start session in status: ${session.status}`);
    }

    const now = new Date();
    session.status = SessionStatus.IN_PROGRESS;
    session.startedAt = now.toISOString();

    const scheduledTime = new Date(session.scheduledAt).getTime();
    const waitMs = now.getTime() - scheduledTime;
    session.waitTimeMinutes = Math.max(0, Math.round(waitMs / 60000));

    return session;
  }

  /**
   * Ends a telehealth session with optional visit notes and scores.
   */
  endSession(sessionId: string, params?: {
    visitNotes?: string;
    satisfactionScore?: number;
    technicalQuality?: number;
    followUpDate?: string;
  }): TelehealthSession {
    const session = this.findSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error(`Cannot end session in status: ${session.status}`);
    }

    const now = new Date();
    session.status = SessionStatus.COMPLETED;
    session.endedAt = now.toISOString();

    if (session.startedAt) {
      const startTime = new Date(session.startedAt).getTime();
      session.durationMinutes = Math.round((now.getTime() - startTime) / 60000);
    }

    if (params?.visitNotes) session.visitNotes = params.visitNotes;
    if (params?.satisfactionScore) session.satisfactionScore = params.satisfactionScore;
    if (params?.technicalQuality) session.technicalQuality = params.technicalQuality;
    if (params?.followUpDate) {
      session.followUpScheduled = true;
      session.followUpDate = params.followUpDate;
    }

    return session;
  }

  /**
   * Cancels a scheduled session.
   */
  cancelSession(sessionId: string, reason: CancellationReason): TelehealthSession {
    const session = this.findSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (session.status === SessionStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed session');
    }

    session.status = SessionStatus.CANCELLED;
    session.cancelledAt = new Date().toISOString();
    session.cancellationReason = reason;

    return session;
  }

  // ==========================================================================
  // Pre-Visit Summary
  // ==========================================================================

  /**
   * Generates a comprehensive pre-visit summary for a patient by compiling
   * their recent vitals, pain trends, medications, and compliance data.
   */
  generatePreVisitSummary(patientId: string): PreVisitSummary {
    const patient = this.patients.find(p => p.id === patientId);

    if (!patient) {
      // Return a default summary for unknown patients
      return {
        generatedAt: new Date().toISOString(),
        patientId,
        patientName: 'Unknown Patient',
        age: 0,
        surgeryType: 'Unknown',
        surgeryDate: '',
        recoveryPhase: RecoveryPhase.EARLY_RECOVERY,
        daysSinceSurgery: 0,
        recentVitals: [],
        painTrend: { currentLevel: 0, averageLast7Days: 0, trend: 'stable', peakLevel: 0, peakDate: '', primaryLocation: '' },
        currentMedications: [],
        complianceMetrics: { overallScore: 0, medicationAdherence: 0, exerciseCompletion: 0, woundPhotoUploads: 0, appointmentAttendance: 0 },
        recentAlerts: [],
        openConcerns: [],
      };
    }

    const surgeryDate = new Date(patient.surgeryDate);
    const now = new Date();
    const daysSinceSurgery = Math.floor((now.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));

    // Find last completed visit for this patient
    const completedSessions = this.sessions
      .filter(s => s.patientId === patientId && s.status === SessionStatus.COMPLETED)
      .sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''));

    const lastVisitSummary = completedSessions.length > 0
      ? `Last visit on ${completedSessions[0].endedAt?.substring(0, 10)}: ${completedSessions[0].chiefComplaint}`
      : undefined;

    return {
      generatedAt: new Date().toISOString(),
      patientId: patient.id,
      patientName: patient.name,
      age: patient.age,
      surgeryType: patient.surgeryType,
      surgeryDate: patient.surgeryDate,
      recoveryPhase: patient.recoveryPhase,
      daysSinceSurgery,
      recentVitals: patient.vitals,
      painTrend: patient.painTrend,
      currentMedications: patient.medications,
      complianceMetrics: patient.compliance,
      recentAlerts: patient.alerts,
      openConcerns: patient.concerns,
      lastVisitSummary,
    };
  }

  // ==========================================================================
  // Post-Visit Summary
  // ==========================================================================

  /**
   * Generates a post-visit summary with findings, action items, and follow-up
   * recommendations based on the completed session.
   */
  generatePostVisitSummary(sessionId: string): PostVisitSummary {
    const session = this.findSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const patient = this.patients.find(p => p.id === session.patientId);
    const patientName = patient?.name ?? 'Patient';
    const recoveryPhase = patient?.recoveryPhase ?? RecoveryPhase.EARLY_RECOVERY;

    // Generate context-appropriate findings, plans, and action items
    const findings: string[] = [];
    const plan: string[] = [];
    const actionItems: PostVisitActionItem[] = [];
    const medicationChanges: MedicationChange[] = [];
    const patientInstructions: string[] = [];
    const redFlags: string[] = [];
    let assessment = '';
    let nextVisitRecommendation = '';

    // Tailor output based on chief complaint and recovery phase
    if (session.chiefComplaint.toLowerCase().includes('pain') || session.chiefComplaint.toLowerCase().includes('breakthrough')) {
      findings.push(`${patientName} reports pain at ${patient?.painTrend.currentLevel ?? 'unknown'}/10`);
      findings.push('Pain pattern consistent with expected post-surgical course');
      findings.push('No signs of nerve injury or compartment syndrome');
      assessment = 'Post-surgical pain within expected parameters with adequate response to multimodal therapy';
      plan.push('Continue current multimodal pain management');
      plan.push('Increase non-pharmacologic strategies: ice, elevation, distraction');
      plan.push('Begin opioid taper discussion at next visit if pain continues to improve');
      actionItems.push({ id: generateTeleId('ai'), description: 'Schedule pain management follow-up in 5-7 days', assignedTo: 'nurse', priority: ActionItemPriority.MEDIUM, dueDate: this.addDays(2), completed: false });
      actionItems.push({ id: generateTeleId('ai'), description: 'Complete daily pain diary for next visit', assignedTo: 'patient', priority: ActionItemPriority.MEDIUM, dueDate: this.addDays(7), completed: false });
      patientInstructions.push('Continue pain medications as prescribed');
      patientInstructions.push('Apply ice for 20 minutes every 2 hours while awake');
      patientInstructions.push('Keep affected area elevated when resting');
      redFlags.push('Pain suddenly increasing to 9-10/10', 'New numbness or tingling', 'Fever above 101.5F');
    } else if (session.chiefComplaint.toLowerCase().includes('wound') || session.chiefComplaint.toLowerCase().includes('incision')) {
      findings.push('Surgical incision examined via video');
      findings.push('Wound edges well-approximated, no erythema or drainage');
      findings.push('Surrounding tissue without signs of cellulitis');
      assessment = 'Surgical wound healing well within expected timeline';
      plan.push('Continue current wound care regimen');
      plan.push('Continue daily wound photo uploads for monitoring');
      actionItems.push({ id: generateTeleId('ai'), description: 'Upload wound photo daily for next 7 days', assignedTo: 'patient', priority: ActionItemPriority.MEDIUM, dueDate: this.addDays(7), completed: false });
      patientInstructions.push('Keep wound clean and dry');
      patientInstructions.push('Change dressing daily or if soiled');
      patientInstructions.push('Do not submerge wound in water');
      redFlags.push('Increasing redness or warmth', 'Purulent drainage', 'Wound opening or separation', 'Fever above 101F');
    } else if (session.chiefComplaint.toLowerCase().includes('pt') || session.chiefComplaint.toLowerCase().includes('physical therapy') || session.chiefComplaint.toLowerCase().includes('progress')) {
      findings.push(`${patientName} demonstrating good engagement with PT program`);
      findings.push('Range of motion improving per expected trajectory');
      findings.push('No signs of hardware complications or joint instability');
      assessment = 'Recovery progressing well, PT milestones being met on schedule';
      plan.push('Continue current PT protocol');
      plan.push('Progress to next phase of exercises per PT plan');
      plan.push('Reassess functional milestones at next visit');
      actionItems.push({ id: generateTeleId('ai'), description: 'Advance PT exercises to next phase', assignedTo: 'pt', priority: ActionItemPriority.MEDIUM, dueDate: this.addDays(3), completed: false });
      actionItems.push({ id: generateTeleId('ai'), description: 'Complete home exercise program daily', assignedTo: 'patient', priority: ActionItemPriority.HIGH, dueDate: this.addDays(14), completed: false });
      patientInstructions.push('Perform prescribed exercises 2-3 times daily');
      patientInstructions.push('Stop exercise if sharp pain occurs');
      patientInstructions.push('Apply ice after exercise sessions');
    } else {
      // General follow-up
      findings.push(`${patientName} recovering from ${patient?.surgeryType ?? 'surgery'}`);
      findings.push('Overall recovery trajectory is on track');
      findings.push('Patient engaged with care plan activities');
      assessment = `${recoveryPhase} phase recovery proceeding as expected`;
      plan.push('Continue current care plan');
      plan.push('Monitor pain and functional progress');
      plan.push('Schedule next follow-up per protocol');
      actionItems.push({ id: generateTeleId('ai'), description: 'Schedule follow-up visit per care plan', assignedTo: 'nurse', priority: ActionItemPriority.LOW, dueDate: this.addDays(7), completed: false });
      patientInstructions.push('Continue all medications as prescribed');
      patientInstructions.push('Continue wound care and daily photo uploads');
      patientInstructions.push('Complete PT exercises per schedule');
      redFlags.push('Sudden increase in pain', 'Fever above 101F', 'Wound redness or drainage', 'Difficulty breathing');
    }

    // Add medication changes if patient has medications
    if (patient && patient.medications.length > 0) {
      for (const med of patient.medications) {
        medicationChanges.push({
          medication: med.name,
          changeType: 'continued',
          newDosage: `${med.dosage} ${med.frequency}`,
          reason: 'Adequate response, no adverse effects',
        });
      }
    }

    nextVisitRecommendation = recoveryPhase === RecoveryPhase.IMMEDIATE_POST_OP
      ? 'Follow-up in 3-5 days'
      : recoveryPhase === RecoveryPhase.EARLY_RECOVERY
        ? 'Follow-up in 1 week'
        : recoveryPhase === RecoveryPhase.MID_RECOVERY
          ? 'Follow-up in 2 weeks'
          : 'Follow-up in 4 weeks';

    return {
      generatedAt: new Date().toISOString(),
      sessionId: session.id,
      patientId: session.patientId,
      providerId: session.providerId,
      visitType: session.sessionType,
      duration: session.durationMinutes ?? 0,
      chiefComplaint: session.chiefComplaint,
      findings,
      assessment,
      plan,
      actionItems,
      medicationChanges,
      nextVisitRecommendation,
      patientInstructions,
      redFlags,
    };
  }

  // ==========================================================================
  // Session Analytics
  // ==========================================================================

  /**
   * Calculates comprehensive session analytics across all sessions.
   */
  getSessionAnalytics(): SessionAnalytics {
    const completed = this.sessions.filter(s => s.status === SessionStatus.COMPLETED);
    const cancelled = this.sessions.filter(s => s.status === SessionStatus.CANCELLED);
    const noShows = this.sessions.filter(s => s.status === SessionStatus.NO_SHOW);

    // Type distribution
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const session of this.sessions) {
      byType[session.sessionType] = (byType[session.sessionType] ?? 0) + 1;
      byStatus[session.status] = (byStatus[session.status] ?? 0) + 1;
    }

    // Duration stats
    const durations = completed.filter(s => s.durationMinutes != null).map(s => s.durationMinutes!);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Wait time stats
    const waitTimes = completed.filter(s => s.waitTimeMinutes != null).map(s => s.waitTimeMinutes!);
    const avgWait = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;

    // Satisfaction
    const satScores = completed.filter(s => s.satisfactionScore != null).map(s => s.satisfactionScore!);
    const avgSat = satScores.length > 0 ? satScores.reduce((a, b) => a + b, 0) / satScores.length : 0;

    // Technical quality
    const techScores = completed.filter(s => s.technicalQuality != null).map(s => s.technicalQuality!);
    const avgTech = techScores.length > 0 ? techScores.reduce((a, b) => a + b, 0) / techScores.length : 0;

    // Rates
    const total = this.sessions.length;
    const completionRate = total > 0 ? completed.length / total : 0;
    const cancellationRate = total > 0 ? cancelled.length / total : 0;
    const noShowRate = total > 0 ? noShows.length / total : 0;

    // Peak hours
    const hourCounts = new Map<number, number>();
    for (const s of completed) {
      if (s.startedAt) {
        const hour = new Date(s.startedAt).getUTCHours();
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      }
    }
    const peakHours = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);

    // Sessions by day
    const dayCounts = new Map<string, number>();
    for (const s of this.sessions) {
      const day = s.scheduledAt.substring(0, 10);
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    }
    const sessionsByDay = Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Provider metrics
    const providerMap = new Map<string, TelehealthSession[]>();
    for (const s of this.sessions) {
      const list = providerMap.get(s.providerId) ?? [];
      list.push(s);
      providerMap.set(s.providerId, list);
    }
    const providerMetrics: ProviderMetric[] = [];
    for (const [providerId, sessions] of providerMap) {
      const provCompleted = sessions.filter(s => s.status === SessionStatus.COMPLETED);
      const provCancelled = sessions.filter(s => s.status === SessionStatus.CANCELLED);
      const provDurations = provCompleted.filter(s => s.durationMinutes != null).map(s => s.durationMinutes!);
      const provSat = provCompleted.filter(s => s.satisfactionScore != null).map(s => s.satisfactionScore!);

      providerMetrics.push({
        providerId,
        totalSessions: sessions.length,
        completedSessions: provCompleted.length,
        averageDuration: provDurations.length > 0 ? Math.round(provDurations.reduce((a, b) => a + b, 0) / provDurations.length * 10) / 10 : 0,
        averageSatisfaction: provSat.length > 0 ? Math.round(provSat.reduce((a, b) => a + b, 0) / provSat.length * 10) / 10 : 0,
        cancellationRate: sessions.length > 0 ? Math.round(provCancelled.length / sessions.length * 100) / 100 : 0,
      });
    }

    return {
      totalSessions: total,
      byType,
      byStatus,
      averageDurationMinutes: Math.round(avgDuration * 10) / 10,
      averageWaitTimeMinutes: Math.round(avgWait * 10) / 10,
      averageSatisfaction: Math.round(avgSat * 10) / 10,
      averageTechnicalQuality: Math.round(avgTech * 10) / 10,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      noShowRate: Math.round(noShowRate * 100) / 100,
      peakHours,
      sessionsByDay,
      providerMetrics,
    };
  }

  // ==========================================================================
  // Template Access
  // ==========================================================================

  /**
   * Returns all visit note templates.
   */
  getVisitNoteTemplates(): VisitNoteTemplate[] {
    return [...VISIT_NOTE_TEMPLATES];
  }

  /**
   * Returns templates filtered by category.
   */
  getTemplatesByCategory(category: VisitNoteCategory): VisitNoteTemplate[] {
    return VISIT_NOTE_TEMPLATES.filter(t => t.category === category);
  }

  /**
   * Returns templates applicable to a specific recovery phase.
   */
  getTemplatesForPhase(phase: RecoveryPhase): VisitNoteTemplate[] {
    return VISIT_NOTE_TEMPLATES.filter(t => t.applicablePhases.includes(phase));
  }

  /**
   * Returns a specific template by ID.
   */
  getTemplateById(templateId: string): VisitNoteTemplate | undefined {
    return VISIT_NOTE_TEMPLATES.find(t => t.id === templateId);
  }

  // ==========================================================================
  // Session Queries
  // ==========================================================================

  /**
   * Returns all sessions for a given patient.
   */
  getSessionsByPatient(patientId: string): TelehealthSession[] {
    return this.sessions.filter(s => s.patientId === patientId);
  }

  /**
   * Returns all sessions for a given provider.
   */
  getSessionsByProvider(providerId: string): TelehealthSession[] {
    return this.sessions.filter(s => s.providerId === providerId);
  }

  /**
   * Returns upcoming scheduled sessions.
   */
  getUpcomingSessions(): TelehealthSession[] {
    const now = new Date().toISOString();
    return this.sessions
      .filter(s => s.status === SessionStatus.SCHEDULED && s.scheduledAt >= now)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  /**
   * Returns all sessions.
   */
  getAllSessions(): TelehealthSession[] {
    return [...this.sessions];
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private findSession(sessionId: string): TelehealthSession | undefined {
    return this.sessions.find(s => s.id === sessionId);
  }

  private addDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const telehealthService = new TelehealthServiceImpl();
