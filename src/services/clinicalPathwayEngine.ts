/**
 * Clinical Pathway Engine (ERAS - Enhanced Recovery After Surgery)
 *
 * Real Enhanced Recovery After Surgery protocol implementation with:
 * - ERAS elements: pre-op optimization, multimodal analgesia, early mobilization,
 *   early nutrition, goal-directed fluid therapy
 * - Pathway compliance tracking and scoring
 * - Protocol deviation detection and alerts
 * - Real pathway templates for colorectal, orthopedic, cardiac, gynecologic, urologic surgery
 * - Evidence-based milestone checklists (pre-op, intra-op, post-op phases)
 * - Outcome correlation with protocol adherence
 * - Self-learning: identifies which protocol elements most impact recovery
 *
 * No external dependencies.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const SurgeryType = {
  COLORECTAL: 'colorectal',
  ORTHOPEDIC: 'orthopedic',
  CARDIAC: 'cardiac',
  GYNECOLOGIC: 'gynecologic',
  UROLOGIC: 'urologic',
} as const;
export type SurgeryType = (typeof SurgeryType)[keyof typeof SurgeryType];

export const PathwayPhase = {
  PRE_OP: 'pre_op',
  INTRA_OP: 'intra_op',
  POST_OP_DAY0: 'post_op_day0',
  POST_OP_DAY1: 'post_op_day1',
  POST_OP_DAY2: 'post_op_day2',
  POST_OP_DAY3_PLUS: 'post_op_day3_plus',
  DISCHARGE: 'discharge',
} as const;
export type PathwayPhase = (typeof PathwayPhase)[keyof typeof PathwayPhase];

export const ERASElement = {
  PREOP_COUNSELING: 'preop_counseling',
  PREOP_OPTIMIZATION: 'preop_optimization',
  CARB_LOADING: 'carb_loading',
  NO_PROLONGED_FASTING: 'no_prolonged_fasting',
  VTE_PROPHYLAXIS: 'vte_prophylaxis',
  ANTIBIOTIC_PROPHYLAXIS: 'antibiotic_prophylaxis',
  MULTIMODAL_ANALGESIA: 'multimodal_analgesia',
  REGIONAL_ANESTHESIA: 'regional_anesthesia',
  GOAL_DIRECTED_FLUID: 'goal_directed_fluid',
  NORMOTHERMIA: 'normothermia',
  MINIMALLY_INVASIVE: 'minimally_invasive',
  NO_NASOGASTRIC_TUBE: 'no_nasogastric_tube',
  NO_DRAINS: 'no_drains',
  EARLY_MOBILIZATION: 'early_mobilization',
  EARLY_ORAL_NUTRITION: 'early_oral_nutrition',
  CHEWING_GUM: 'chewing_gum',
  EARLY_CATHETER_REMOVAL: 'early_catheter_removal',
  GLYCEMIC_CONTROL: 'glycemic_control',
  NAUSEA_PREVENTION: 'nausea_prevention',
  AUDIT_COMPLIANCE: 'audit_compliance',
} as const;
export type ERASElement = (typeof ERASElement)[keyof typeof ERASElement];

export const MilestoneStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  DEVIATED: 'deviated',
} as const;
export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export const DeviationSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type DeviationSeverity = (typeof DeviationSeverity)[keyof typeof DeviationSeverity];

export const ComplianceLevel = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
} as const;
export type ComplianceLevel = (typeof ComplianceLevel)[keyof typeof ComplianceLevel];

// ============================================================================
// Interfaces
// ============================================================================

export interface ERASMilestone {
  id: string;
  element: ERASElement;
  phase: PathwayPhase;
  description: string;
  target: string;
  evidenceGrade: string;
  required: boolean;
}

export interface MilestoneRecord {
  milestoneId: string;
  status: MilestoneStatus;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  deviationReason?: string;
}

export interface PathwayTemplate {
  surgeryType: SurgeryType;
  name: string;
  expectedLOS: number;
  milestones: ERASMilestone[];
  criticalElements: ERASElement[];
}

export interface PatientPathway {
  patientId: string;
  surgeryType: SurgeryType;
  surgeryDate: string;
  currentPhase: PathwayPhase;
  milestoneRecords: MilestoneRecord[];
  complianceScore: number;
  deviations: ProtocolDeviation[];
  outcomes: PathwayOutcome;
}

export interface ProtocolDeviation {
  id: string;
  milestoneId: string;
  element: ERASElement;
  severity: DeviationSeverity;
  reason: string;
  detectedAt: string;
  resolved: boolean;
  impactDescription: string;
}

export interface PathwayOutcome {
  actualLOS: number;
  expectedLOS: number;
  complications: string[];
  readmitted30Day: boolean;
  painScoreAvg: number;
  mobilizationDay: number;
  firstOralIntakeDay: number;
}

export interface ComplianceReport {
  patientId: string;
  overallScore: number;
  complianceLevel: ComplianceLevel;
  phaseScores: Record<string, number>;
  elementScores: Record<string, number>;
  totalMilestones: number;
  completedMilestones: number;
  deviationCount: number;
  criticalDeviations: number;
  recommendations: string[];
}

export interface ElementImpact {
  element: ERASElement;
  adherenceRate: number;
  avgLOSWhenAdherent: number;
  avgLOSWhenNonAdherent: number;
  complicationRateAdherent: number;
  complicationRateNonAdherent: number;
  impactScore: number;
  sampleSize: number;
}

export interface LearningInsight {
  element: ERASElement;
  insight: string;
  confidence: number;
  recommendation: string;
  dataPoints: number;
}

// ============================================================================
// ERAS Pathway Templates (Real Evidence-Based Protocols)
// ============================================================================

const COLORECTAL_MILESTONES: ERASMilestone[] = [
  { id: 'cr-pre-01', element: ERASElement.PREOP_COUNSELING, phase: PathwayPhase.PRE_OP, description: 'Patient education on ERAS pathway and expectations', target: 'Completed 2-4 weeks before surgery', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'cr-pre-02', element: ERASElement.PREOP_OPTIMIZATION, phase: PathwayPhase.PRE_OP, description: 'Nutritional screening and optimization (albumin >3.0)', target: 'Albumin ≥3.0 g/dL, BMI assessed', evidenceGrade: 'Strong/Low', required: true },
  { id: 'cr-pre-03', element: ERASElement.CARB_LOADING, phase: PathwayPhase.PRE_OP, description: 'Clear carbohydrate drink 2h before surgery', target: '400mL carbohydrate drink 2-3h pre-op', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'cr-pre-04', element: ERASElement.NO_PROLONGED_FASTING, phase: PathwayPhase.PRE_OP, description: 'Minimize pre-operative fasting', target: 'Clear fluids up to 2h, solids up to 6h pre-op', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'cr-pre-05', element: ERASElement.VTE_PROPHYLAXIS, phase: PathwayPhase.PRE_OP, description: 'VTE risk assessment and prophylaxis initiation', target: 'LMWH or UFH + mechanical prophylaxis', evidenceGrade: 'Strong/High', required: true },
  { id: 'cr-intra-01', element: ERASElement.ANTIBIOTIC_PROPHYLAXIS, phase: PathwayPhase.INTRA_OP, description: 'IV antibiotics within 60 min of incision', target: 'Cefoxitin 2g or cefazolin+metronidazole within 60 min', evidenceGrade: 'Strong/High', required: true },
  { id: 'cr-intra-02', element: ERASElement.MULTIMODAL_ANALGESIA, phase: PathwayPhase.INTRA_OP, description: 'Multimodal analgesia initiated (avoid excess opioids)', target: 'Acetaminophen + NSAIDs + regional/neuraxial', evidenceGrade: 'Strong/High', required: true },
  { id: 'cr-intra-03', element: ERASElement.GOAL_DIRECTED_FLUID, phase: PathwayPhase.INTRA_OP, description: 'Goal-directed fluid therapy to avoid overload', target: 'Balanced crystalloids, SVV-guided, avoid >2.5L excess', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'cr-intra-04', element: ERASElement.NORMOTHERMIA, phase: PathwayPhase.INTRA_OP, description: 'Maintain core temperature ≥36°C', target: 'Forced-air warming, warm IV fluids, temp ≥36°C', evidenceGrade: 'Strong/High', required: true },
  { id: 'cr-intra-05', element: ERASElement.MINIMALLY_INVASIVE, phase: PathwayPhase.INTRA_OP, description: 'Laparoscopic approach when feasible', target: 'Laparoscopic or robotic approach preferred', evidenceGrade: 'Strong/High', required: false },
  { id: 'cr-intra-06', element: ERASElement.NO_NASOGASTRIC_TUBE, phase: PathwayPhase.INTRA_OP, description: 'Avoid routine nasogastric tube', target: 'Remove NG tube before extubation if placed', evidenceGrade: 'Strong/High', required: true },
  { id: 'cr-intra-07', element: ERASElement.NO_DRAINS, phase: PathwayPhase.INTRA_OP, description: 'Avoid routine abdominal drains', target: 'No drain unless specific indication', evidenceGrade: 'Strong/Moderate', required: false },
  { id: 'cr-post-01', element: ERASElement.EARLY_MOBILIZATION, phase: PathwayPhase.POST_OP_DAY0, description: 'Out of bed within 2h of arrival to floor', target: 'Sit in chair ≥2h on POD0, walk ≥60m POD1', evidenceGrade: 'Strong/Low', required: true },
  { id: 'cr-post-02', element: ERASElement.EARLY_ORAL_NUTRITION, phase: PathwayPhase.POST_OP_DAY0, description: 'Oral fluids within 4h post-op, diet POD0', target: 'Clear fluids POD0, regular diet POD1', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'cr-post-03', element: ERASElement.CHEWING_GUM, phase: PathwayPhase.POST_OP_DAY0, description: 'Chewing gum to promote ileus resolution', target: 'Gum TID starting POD0', evidenceGrade: 'Strong/Moderate', required: false },
  { id: 'cr-post-04', element: ERASElement.EARLY_CATHETER_REMOVAL, phase: PathwayPhase.POST_OP_DAY1, description: 'Remove urinary catheter within 24h', target: 'Catheter out POD1 (POD2 if low anterior resection)', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'cr-post-05', element: ERASElement.MULTIMODAL_ANALGESIA, phase: PathwayPhase.POST_OP_DAY1, description: 'Continue multimodal analgesia, minimize opioids', target: 'Scheduled acetaminophen + NSAIDs, PRN opioid only', evidenceGrade: 'Strong/High', required: true },
  { id: 'cr-post-06', element: ERASElement.GLYCEMIC_CONTROL, phase: PathwayPhase.POST_OP_DAY0, description: 'Maintain blood glucose <180 mg/dL', target: 'BG 110-180 mg/dL with insulin protocol', evidenceGrade: 'Strong/High', required: true },
  { id: 'cr-post-07', element: ERASElement.NAUSEA_PREVENTION, phase: PathwayPhase.POST_OP_DAY0, description: 'Multimodal PONV prophylaxis', target: '≥2 antiemetics for moderate risk, ≥3 for high risk', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'cr-post-08', element: ERASElement.AUDIT_COMPLIANCE, phase: PathwayPhase.DISCHARGE, description: 'Audit ERAS compliance and document outcomes', target: '≥80% element compliance, document LOS and complications', evidenceGrade: 'Strong/Low', required: true },
];

const ORTHOPEDIC_MILESTONES: ERASMilestone[] = [
  { id: 'or-pre-01', element: ERASElement.PREOP_COUNSELING, phase: PathwayPhase.PRE_OP, description: 'Joint class education and expectation setting', target: 'Completed 2-4 weeks pre-op with PT consult', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'or-pre-02', element: ERASElement.PREOP_OPTIMIZATION, phase: PathwayPhase.PRE_OP, description: 'Anemia screening and optimization (Hb >12)', target: 'Iron supplementation if Hb <13, EPO if needed', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'or-pre-03', element: ERASElement.CARB_LOADING, phase: PathwayPhase.PRE_OP, description: 'Carbohydrate loading pre-operatively', target: '400mL carb drink 2h pre-op', evidenceGrade: 'Moderate/Moderate', required: false },
  { id: 'or-pre-04', element: ERASElement.VTE_PROPHYLAXIS, phase: PathwayPhase.PRE_OP, description: 'VTE prophylaxis plan (high risk for TKA/THA)', target: 'LMWH or DOAC + mechanical for 14-35 days', evidenceGrade: 'Strong/High', required: true },
  { id: 'or-intra-01', element: ERASElement.REGIONAL_ANESTHESIA, phase: PathwayPhase.INTRA_OP, description: 'Spinal or regional anesthesia preferred', target: 'Spinal anesthesia or nerve block + sedation', evidenceGrade: 'Strong/High', required: true },
  { id: 'or-intra-02', element: ERASElement.MULTIMODAL_ANALGESIA, phase: PathwayPhase.INTRA_OP, description: 'Periarticular injection and nerve blocks', target: 'Adductor canal block + periarticular cocktail', evidenceGrade: 'Strong/High', required: true },
  { id: 'or-intra-03', element: ERASElement.GOAL_DIRECTED_FLUID, phase: PathwayPhase.INTRA_OP, description: 'Restrictive fluid strategy', target: 'Balanced crystalloid, avoid >1.5L excess', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'or-intra-04', element: ERASElement.NORMOTHERMIA, phase: PathwayPhase.INTRA_OP, description: 'Active warming throughout procedure', target: 'Core temp ≥36°C at all times', evidenceGrade: 'Strong/High', required: true },
  { id: 'or-post-01', element: ERASElement.EARLY_MOBILIZATION, phase: PathwayPhase.POST_OP_DAY0, description: 'Stand and walk within 4h post-op', target: 'Stand POD0, walk 30m POD0, stairs POD1', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'or-post-02', element: ERASElement.MULTIMODAL_ANALGESIA, phase: PathwayPhase.POST_OP_DAY0, description: 'Scheduled multimodal analgesia regimen', target: 'Acetaminophen 1g Q6h + celecoxib + gabapentin + PRN opioid', evidenceGrade: 'Strong/High', required: true },
  { id: 'or-post-03', element: ERASElement.EARLY_ORAL_NUTRITION, phase: PathwayPhase.POST_OP_DAY0, description: 'Regular diet immediately post-op', target: 'Regular diet within 4h of surgery', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'or-post-04', element: ERASElement.NAUSEA_PREVENTION, phase: PathwayPhase.POST_OP_DAY0, description: 'PONV prophylaxis and treatment', target: 'Ondansetron + dexamethasone, scopolamine if high risk', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'or-post-05', element: ERASElement.EARLY_CATHETER_REMOVAL, phase: PathwayPhase.POST_OP_DAY0, description: 'Avoid routine catheterization or remove early', target: 'Remove within 6h or avoid altogether', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'or-post-06', element: ERASElement.AUDIT_COMPLIANCE, phase: PathwayPhase.DISCHARGE, description: 'Audit pathway compliance and outcomes', target: 'Document compliance %, LOS, ROM achieved', evidenceGrade: 'Strong/Low', required: true },
];

const CARDIAC_MILESTONES: ERASMilestone[] = [
  { id: 'ca-pre-01', element: ERASElement.PREOP_COUNSELING, phase: PathwayPhase.PRE_OP, description: 'Pre-operative cardiac surgery education', target: 'Completed with ICU expectations, breathing exercises', evidenceGrade: 'Moderate/Low', required: true },
  { id: 'ca-pre-02', element: ERASElement.PREOP_OPTIMIZATION, phase: PathwayPhase.PRE_OP, description: 'Cardiac optimization and comorbidity management', target: 'HbA1c <8%, EF documented, lung function assessed', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ca-pre-03', element: ERASElement.CARB_LOADING, phase: PathwayPhase.PRE_OP, description: 'Carbohydrate drink if not diabetic', target: '200-400mL carb drink 2h pre-op (non-diabetic)', evidenceGrade: 'Moderate/Low', required: false },
  { id: 'ca-pre-04', element: ERASElement.VTE_PROPHYLAXIS, phase: PathwayPhase.PRE_OP, description: 'Anticoagulation management plan', target: 'Bridge plan for warfarin, hold DOACs per protocol', evidenceGrade: 'Strong/High', required: true },
  { id: 'ca-intra-01', element: ERASElement.ANTIBIOTIC_PROPHYLAXIS, phase: PathwayPhase.INTRA_OP, description: 'Perioperative antibiotics per STS guidelines', target: 'Cefazolin 2g within 60 min, redose Q4h', evidenceGrade: 'Strong/High', required: true },
  { id: 'ca-intra-02', element: ERASElement.GOAL_DIRECTED_FLUID, phase: PathwayPhase.INTRA_OP, description: 'Hemodynamic-guided fluid management on bypass', target: 'TEE-guided, target MAP >65, CI >2.2', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ca-intra-03', element: ERASElement.NORMOTHERMIA, phase: PathwayPhase.INTRA_OP, description: 'Temperature management on/off bypass', target: 'Avoid deep hypothermia unless indicated, rewarm to ≥36°C', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ca-intra-04', element: ERASElement.GLYCEMIC_CONTROL, phase: PathwayPhase.INTRA_OP, description: 'Intraoperative glucose management', target: 'BG <180 mg/dL with insulin infusion', evidenceGrade: 'Strong/High', required: true },
  { id: 'ca-post-01', element: ERASElement.EARLY_MOBILIZATION, phase: PathwayPhase.POST_OP_DAY1, description: 'Early mobilization in ICU', target: 'Sit in chair POD1, walk with assist POD2', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ca-post-02', element: ERASElement.MULTIMODAL_ANALGESIA, phase: PathwayPhase.POST_OP_DAY0, description: 'Multimodal pain management (sternal precautions)', target: 'Acetaminophen + gabapentin, minimize opioids', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ca-post-03', element: ERASElement.EARLY_ORAL_NUTRITION, phase: PathwayPhase.POST_OP_DAY0, description: 'Clear fluids post-extubation', target: 'Clear fluids within 6h of extubation, diet POD1', evidenceGrade: 'Moderate/Low', required: true },
  { id: 'ca-post-04', element: ERASElement.NAUSEA_PREVENTION, phase: PathwayPhase.POST_OP_DAY0, description: 'Antiemetic prophylaxis', target: 'Ondansetron PRN, dexamethasone if tolerated', evidenceGrade: 'Moderate/Low', required: false },
  { id: 'ca-post-05', element: ERASElement.AUDIT_COMPLIANCE, phase: PathwayPhase.DISCHARGE, description: 'Audit ERAS cardiac compliance', target: 'Document compliance, ICU days, ventilator hours', evidenceGrade: 'Strong/Low', required: true },
];

const GYNECOLOGIC_MILESTONES: ERASMilestone[] = [
  { id: 'gy-pre-01', element: ERASElement.PREOP_COUNSELING, phase: PathwayPhase.PRE_OP, description: 'Patient education and expectation setting', target: 'Completed 1-2 weeks pre-op', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'gy-pre-02', element: ERASElement.PREOP_OPTIMIZATION, phase: PathwayPhase.PRE_OP, description: 'Anemia correction and nutritional optimization', target: 'Hb >10, iron supplementation if needed', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'gy-pre-03', element: ERASElement.CARB_LOADING, phase: PathwayPhase.PRE_OP, description: 'Carbohydrate loading', target: '400mL carb drink 2h pre-op', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'gy-pre-04', element: ERASElement.NO_PROLONGED_FASTING, phase: PathwayPhase.PRE_OP, description: 'Minimize fasting duration', target: 'Clear fluids to 2h, solids to 6h pre-op', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'gy-pre-05', element: ERASElement.VTE_PROPHYLAXIS, phase: PathwayPhase.PRE_OP, description: 'VTE risk assessment (Caprini score)', target: 'Mechanical + pharmacological per Caprini score', evidenceGrade: 'Strong/High', required: true },
  { id: 'gy-intra-01', element: ERASElement.ANTIBIOTIC_PROPHYLAXIS, phase: PathwayPhase.INTRA_OP, description: 'Prophylactic antibiotics', target: 'Cefazolin 2g within 60 min of incision', evidenceGrade: 'Strong/High', required: true },
  { id: 'gy-intra-02', element: ERASElement.MINIMALLY_INVASIVE, phase: PathwayPhase.INTRA_OP, description: 'Laparoscopic/robotic approach preferred', target: 'MIS approach when feasible', evidenceGrade: 'Strong/High', required: false },
  { id: 'gy-intra-03', element: ERASElement.MULTIMODAL_ANALGESIA, phase: PathwayPhase.INTRA_OP, description: 'Multimodal analgesia with TAP blocks', target: 'TAP block + acetaminophen + NSAIDs + low-dose ketamine', evidenceGrade: 'Strong/High', required: true },
  { id: 'gy-intra-04', element: ERASElement.GOAL_DIRECTED_FLUID, phase: PathwayPhase.INTRA_OP, description: 'Goal-directed fluid therapy', target: 'Balanced crystalloid, avoid overload', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'gy-post-01', element: ERASElement.EARLY_MOBILIZATION, phase: PathwayPhase.POST_OP_DAY0, description: 'Early ambulation', target: 'Out of bed within 4h, walk POD0', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'gy-post-02', element: ERASElement.EARLY_ORAL_NUTRITION, phase: PathwayPhase.POST_OP_DAY0, description: 'Early oral intake', target: 'Regular diet within 4h post-op', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'gy-post-03', element: ERASElement.EARLY_CATHETER_REMOVAL, phase: PathwayPhase.POST_OP_DAY0, description: 'Early catheter removal', target: 'Remove within 6h or midnight POD0', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'gy-post-04', element: ERASElement.NAUSEA_PREVENTION, phase: PathwayPhase.POST_OP_DAY0, description: 'PONV multimodal prophylaxis (high-risk population)', target: '≥3 antiemetics for this high-risk group', evidenceGrade: 'Strong/High', required: true },
  { id: 'gy-post-05', element: ERASElement.AUDIT_COMPLIANCE, phase: PathwayPhase.DISCHARGE, description: 'Audit compliance and outcomes', target: 'Target ≥80% compliance, same-day or next-day discharge for MIS', evidenceGrade: 'Strong/Low', required: true },
];

const UROLOGIC_MILESTONES: ERASMilestone[] = [
  { id: 'ur-pre-01', element: ERASElement.PREOP_COUNSELING, phase: PathwayPhase.PRE_OP, description: 'Patient education on enhanced recovery', target: 'Stoma education if needed, expected recovery timeline', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ur-pre-02', element: ERASElement.PREOP_OPTIMIZATION, phase: PathwayPhase.PRE_OP, description: 'Nutritional and anemia optimization', target: 'Albumin ≥3.0, Hb ≥10, immunonutrition 5 days pre-op', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ur-pre-03', element: ERASElement.CARB_LOADING, phase: PathwayPhase.PRE_OP, description: 'Carbohydrate loading', target: '400mL carb drink 2h pre-op', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ur-pre-04', element: ERASElement.VTE_PROPHYLAXIS, phase: PathwayPhase.PRE_OP, description: 'Extended VTE prophylaxis plan', target: 'LMWH for 28 days post-op (cystectomy)', evidenceGrade: 'Strong/High', required: true },
  { id: 'ur-intra-01', element: ERASElement.ANTIBIOTIC_PROPHYLAXIS, phase: PathwayPhase.INTRA_OP, description: 'Perioperative antibiotics', target: 'Per AUA guidelines for procedure type', evidenceGrade: 'Strong/High', required: true },
  { id: 'ur-intra-02', element: ERASElement.MINIMALLY_INVASIVE, phase: PathwayPhase.INTRA_OP, description: 'Robotic/laparoscopic approach', target: 'Robotic approach for cystectomy/prostatectomy when feasible', evidenceGrade: 'Strong/High', required: false },
  { id: 'ur-intra-03', element: ERASElement.MULTIMODAL_ANALGESIA, phase: PathwayPhase.INTRA_OP, description: 'Multimodal analgesia with regional techniques', target: 'TAP block or epidural + acetaminophen + NSAIDs', evidenceGrade: 'Strong/High', required: true },
  { id: 'ur-intra-04', element: ERASElement.GOAL_DIRECTED_FLUID, phase: PathwayPhase.INTRA_OP, description: 'Goal-directed fluid management', target: 'Balanced crystalloid, SVV-guided', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ur-post-01', element: ERASElement.EARLY_MOBILIZATION, phase: PathwayPhase.POST_OP_DAY0, description: 'Early ambulation', target: 'Sit in chair POD0, walk POD1', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ur-post-02', element: ERASElement.EARLY_ORAL_NUTRITION, phase: PathwayPhase.POST_OP_DAY0, description: 'Early oral intake', target: 'Clear fluids POD0, regular diet POD1', evidenceGrade: 'Strong/Moderate', required: true },
  { id: 'ur-post-03', element: ERASElement.CHEWING_GUM, phase: PathwayPhase.POST_OP_DAY0, description: 'Chewing gum for ileus prevention', target: 'Gum TID starting POD0 (cystectomy)', evidenceGrade: 'Strong/Moderate', required: false },
  { id: 'ur-post-04', element: ERASElement.NO_NASOGASTRIC_TUBE, phase: PathwayPhase.INTRA_OP, description: 'Avoid routine NG tube', target: 'No NG tube or remove before extubation', evidenceGrade: 'Strong/High', required: true },
  { id: 'ur-post-05', element: ERASElement.AUDIT_COMPLIANCE, phase: PathwayPhase.DISCHARGE, description: 'Audit compliance and outcomes', target: 'Document compliance, LOS target ≤5 days (cystectomy)', evidenceGrade: 'Strong/Low', required: true },
];

export const PATHWAY_TEMPLATES: PathwayTemplate[] = [
  {
    surgeryType: SurgeryType.COLORECTAL,
    name: 'ERAS Colorectal Surgery Protocol',
    expectedLOS: 4,
    milestones: COLORECTAL_MILESTONES,
    criticalElements: [ERASElement.MULTIMODAL_ANALGESIA, ERASElement.EARLY_MOBILIZATION, ERASElement.EARLY_ORAL_NUTRITION, ERASElement.GOAL_DIRECTED_FLUID, ERASElement.VTE_PROPHYLAXIS],
  },
  {
    surgeryType: SurgeryType.ORTHOPEDIC,
    name: 'ERAS Total Joint Replacement Protocol',
    expectedLOS: 2,
    milestones: ORTHOPEDIC_MILESTONES,
    criticalElements: [ERASElement.REGIONAL_ANESTHESIA, ERASElement.MULTIMODAL_ANALGESIA, ERASElement.EARLY_MOBILIZATION, ERASElement.VTE_PROPHYLAXIS],
  },
  {
    surgeryType: SurgeryType.CARDIAC,
    name: 'ERAS Cardiac Surgery Protocol',
    expectedLOS: 6,
    milestones: CARDIAC_MILESTONES,
    criticalElements: [ERASElement.GLYCEMIC_CONTROL, ERASElement.GOAL_DIRECTED_FLUID, ERASElement.EARLY_MOBILIZATION, ERASElement.VTE_PROPHYLAXIS],
  },
  {
    surgeryType: SurgeryType.GYNECOLOGIC,
    name: 'ERAS Gynecologic Surgery Protocol',
    expectedLOS: 2,
    milestones: GYNECOLOGIC_MILESTONES,
    criticalElements: [ERASElement.MINIMALLY_INVASIVE, ERASElement.MULTIMODAL_ANALGESIA, ERASElement.EARLY_MOBILIZATION, ERASElement.NAUSEA_PREVENTION],
  },
  {
    surgeryType: SurgeryType.UROLOGIC,
    name: 'ERAS Urologic Surgery Protocol',
    expectedLOS: 5,
    milestones: UROLOGIC_MILESTONES,
    criticalElements: [ERASElement.MULTIMODAL_ANALGESIA, ERASElement.EARLY_MOBILIZATION, ERASElement.EARLY_ORAL_NUTRITION, ERASElement.VTE_PROPHYLAXIS],
  },
];

// ============================================================================
// Learning Data Store
// ============================================================================

interface LearningStore {
  outcomesByElement: Map<string, { adherent: PathwayOutcome[]; nonAdherent: PathwayOutcome[] }>;
  elementWeights: Map<string, number>;
  completedPathways: PatientPathway[];
}

const learningStore: LearningStore = {
  outcomesByElement: new Map(),
  elementWeights: new Map(),
  completedPathways: [],
};

// ============================================================================
// Clinical Pathway Engine
// ============================================================================

function getTemplate(surgeryType: SurgeryType): PathwayTemplate | undefined {
  return PATHWAY_TEMPLATES.find(t => t.surgeryType === surgeryType);
}

function initializePathway(patientId: string, surgeryType: SurgeryType, surgeryDate: string): PatientPathway | null {
  const template = getTemplate(surgeryType);
  if (!template) return null;

  const milestoneRecords: MilestoneRecord[] = template.milestones.map(m => ({
    milestoneId: m.id,
    status: MilestoneStatus.NOT_STARTED,
  }));

  return {
    patientId,
    surgeryType,
    surgeryDate,
    currentPhase: PathwayPhase.PRE_OP,
    milestoneRecords,
    complianceScore: 0,
    deviations: [],
    outcomes: {
      actualLOS: 0,
      expectedLOS: template.expectedLOS,
      complications: [],
      readmitted30Day: false,
      painScoreAvg: 0,
      mobilizationDay: -1,
      firstOralIntakeDay: -1,
    },
  };
}

function updateMilestone(
  pathway: PatientPathway,
  milestoneId: string,
  status: MilestoneStatus,
  completedBy?: string,
  notes?: string,
  deviationReason?: string
): PatientPathway {
  const template = getTemplate(pathway.surgeryType);
  if (!template) return pathway;

  const updatedRecords = pathway.milestoneRecords.map(r => {
    if (r.milestoneId === milestoneId) {
      return {
        ...r,
        status,
        completedAt: status === MilestoneStatus.COMPLETED ? new Date().toISOString() : r.completedAt,
        completedBy: completedBy ?? r.completedBy,
        notes: notes ?? r.notes,
        deviationReason: deviationReason ?? r.deviationReason,
      };
    }
    return r;
  });

  const updatedDeviations = [...pathway.deviations];
  if (status === MilestoneStatus.DEVIATED || status === MilestoneStatus.SKIPPED) {
    const milestone = template.milestones.find(m => m.id === milestoneId);
    if (milestone) {
      const severity = milestone.required
        ? (template.criticalElements.includes(milestone.element) ? DeviationSeverity.CRITICAL : DeviationSeverity.HIGH)
        : DeviationSeverity.MEDIUM;

      updatedDeviations.push({
        id: `dev-${Date.now()}-${milestoneId}`,
        milestoneId,
        element: milestone.element,
        severity,
        reason: deviationReason ?? 'Not specified',
        detectedAt: new Date().toISOString(),
        resolved: false,
        impactDescription: getDeviationImpact(milestone.element, severity),
      });
    }
  }

  const updatedPathway = {
    ...pathway,
    milestoneRecords: updatedRecords,
    deviations: updatedDeviations,
  };

  updatedPathway.complianceScore = calculateComplianceScore(updatedPathway);
  return updatedPathway;
}

function getDeviationImpact(element: ERASElement, severity: DeviationSeverity): string {
  const impacts: Record<string, string> = {
    [ERASElement.MULTIMODAL_ANALGESIA]: 'Increased opioid use, delayed mobilization, increased ileus risk',
    [ERASElement.EARLY_MOBILIZATION]: 'Increased VTE risk, prolonged LOS, increased pulmonary complications',
    [ERASElement.EARLY_ORAL_NUTRITION]: 'Delayed return of bowel function, prolonged IV fluids, longer LOS',
    [ERASElement.GOAL_DIRECTED_FLUID]: 'Fluid overload risk, tissue edema, delayed recovery',
    [ERASElement.VTE_PROPHYLAXIS]: 'Increased DVT/PE risk - potentially life-threatening',
    [ERASElement.GLYCEMIC_CONTROL]: 'Increased surgical site infection risk, impaired wound healing',
    [ERASElement.NORMOTHERMIA]: 'Increased SSI risk, coagulopathy, prolonged recovery',
    [ERASElement.ANTIBIOTIC_PROPHYLAXIS]: 'Increased surgical site infection risk',
    [ERASElement.REGIONAL_ANESTHESIA]: 'Increased opioid requirements, delayed mobilization',
    [ERASElement.NAUSEA_PREVENTION]: 'Delayed oral intake, patient dissatisfaction, aspiration risk',
  };
  return impacts[element] ?? `Protocol deviation (${severity}): may impact recovery timeline`;
}

function calculateComplianceScore(pathway: PatientPathway): number {
  const template = getTemplate(pathway.surgeryType);
  if (!template) return 0;

  let totalWeight = 0;
  let achievedWeight = 0;

  for (const milestone of template.milestones) {
    const record = pathway.milestoneRecords.find(r => r.milestoneId === milestone.id);
    if (!record) continue;

    const weight = milestone.required ? 2 : 1;
    const criticalBonus = template.criticalElements.includes(milestone.element) ? 1 : 0;
    const elementWeight = weight + criticalBonus;

    // Check if self-learning has adjusted weights
    const learnedWeight = learningStore.elementWeights.get(milestone.element);
    const finalWeight = learnedWeight !== undefined ? elementWeight * learnedWeight : elementWeight;

    totalWeight += finalWeight;

    if (record.status === MilestoneStatus.COMPLETED) {
      achievedWeight += finalWeight;
    } else if (record.status === MilestoneStatus.IN_PROGRESS) {
      achievedWeight += finalWeight * 0.5;
    }
  }

  return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
}

function getComplianceLevel(score: number): ComplianceLevel {
  if (score >= 90) return ComplianceLevel.EXCELLENT;
  if (score >= 75) return ComplianceLevel.GOOD;
  if (score >= 50) return ComplianceLevel.FAIR;
  return ComplianceLevel.POOR;
}

function generateComplianceReport(pathway: PatientPathway): ComplianceReport {
  const template = getTemplate(pathway.surgeryType);
  if (!template) {
    return {
      patientId: pathway.patientId,
      overallScore: 0,
      complianceLevel: ComplianceLevel.POOR,
      phaseScores: {},
      elementScores: {},
      totalMilestones: 0,
      completedMilestones: 0,
      deviationCount: 0,
      criticalDeviations: 0,
      recommendations: ['Unknown surgery type'],
    };
  }

  // Phase scores
  const phaseScores: Record<string, number> = {};
  const phases = Object.values(PathwayPhase);
  for (const phase of phases) {
    const phaseMilestones = template.milestones.filter(m => m.phase === phase);
    if (phaseMilestones.length === 0) continue;
    const completed = phaseMilestones.filter(m => {
      const r = pathway.milestoneRecords.find(rec => rec.milestoneId === m.id);
      return r?.status === MilestoneStatus.COMPLETED;
    }).length;
    phaseScores[phase] = Math.round((completed / phaseMilestones.length) * 100);
  }

  // Element scores
  const elementScores: Record<string, number> = {};
  const elementGroups = new Map<string, { total: number; completed: number }>();
  for (const milestone of template.milestones) {
    const group = elementGroups.get(milestone.element) ?? { total: 0, completed: 0 };
    group.total++;
    const record = pathway.milestoneRecords.find(r => r.milestoneId === milestone.id);
    if (record?.status === MilestoneStatus.COMPLETED) group.completed++;
    elementGroups.set(milestone.element, group);
  }
  for (const [element, group] of elementGroups) {
    elementScores[element] = Math.round((group.completed / group.total) * 100);
  }

  const completedMilestones = pathway.milestoneRecords.filter(r => r.status === MilestoneStatus.COMPLETED).length;
  const criticalDeviations = pathway.deviations.filter(d => d.severity === DeviationSeverity.CRITICAL || d.severity === DeviationSeverity.HIGH).length;

  // Generate recommendations
  const recommendations: string[] = [];
  for (const [element, score] of Object.entries(elementScores)) {
    if (score < 100) {
      recommendations.push(`Improve adherence to ${element.replace(/_/g, ' ')} (current: ${score}%)`);
    }
  }
  if (criticalDeviations > 0) {
    recommendations.push(`Address ${criticalDeviations} critical/high deviations urgently`);
  }
  if (pathway.complianceScore < 75) {
    recommendations.push('Consider ERAS champion consultation for low overall compliance');
  }

  return {
    patientId: pathway.patientId,
    overallScore: pathway.complianceScore,
    complianceLevel: getComplianceLevel(pathway.complianceScore),
    phaseScores,
    elementScores,
    totalMilestones: template.milestones.length,
    completedMilestones,
    deviationCount: pathway.deviations.length,
    criticalDeviations,
    recommendations,
  };
}

function detectDeviations(pathway: PatientPathway, currentDay: number): ProtocolDeviation[] {
  const template = getTemplate(pathway.surgeryType);
  if (!template) return [];

  const newDeviations: ProtocolDeviation[] = [];
  const phaseForDay = getPhaseForDay(currentDay);

  // Check milestones that should be completed by the current phase
  const phasePriority: Record<string, number> = {
    [PathwayPhase.PRE_OP]: 0,
    [PathwayPhase.INTRA_OP]: 1,
    [PathwayPhase.POST_OP_DAY0]: 2,
    [PathwayPhase.POST_OP_DAY1]: 3,
    [PathwayPhase.POST_OP_DAY2]: 4,
    [PathwayPhase.POST_OP_DAY3_PLUS]: 5,
    [PathwayPhase.DISCHARGE]: 6,
  };

  const currentPhasePriority = phasePriority[phaseForDay] ?? 0;

  for (const milestone of template.milestones) {
    const milestonePriority = phasePriority[milestone.phase] ?? 0;
    if (milestonePriority >= currentPhasePriority) continue;

    const record = pathway.milestoneRecords.find(r => r.milestoneId === milestone.id);
    if (!record) continue;

    if (record.status === MilestoneStatus.NOT_STARTED && milestone.required) {
      const alreadyDeviated = pathway.deviations.some(d => d.milestoneId === milestone.id);
      if (!alreadyDeviated) {
        const severity = template.criticalElements.includes(milestone.element)
          ? DeviationSeverity.CRITICAL
          : DeviationSeverity.HIGH;

        newDeviations.push({
          id: `dev-auto-${Date.now()}-${milestone.id}`,
          milestoneId: milestone.id,
          element: milestone.element,
          severity,
          reason: `Milestone not completed by expected phase (${milestone.phase})`,
          detectedAt: new Date().toISOString(),
          resolved: false,
          impactDescription: getDeviationImpact(milestone.element, severity),
        });
      }
    }
  }

  return newDeviations;
}

function getPhaseForDay(postOpDay: number): PathwayPhase {
  if (postOpDay < 0) return PathwayPhase.PRE_OP;
  if (postOpDay === 0) return PathwayPhase.POST_OP_DAY0;
  if (postOpDay === 1) return PathwayPhase.POST_OP_DAY1;
  if (postOpDay === 2) return PathwayPhase.POST_OP_DAY2;
  return PathwayPhase.POST_OP_DAY3_PLUS;
}

function correlateOutcomes(pathway: PatientPathway): Record<string, { adherent: boolean; outcomeImpact: string }> {
  const template = getTemplate(pathway.surgeryType);
  if (!template) return {};

  const correlations: Record<string, { adherent: boolean; outcomeImpact: string }> = {};

  const elementAdherence = new Map<string, boolean>();
  for (const milestone of template.milestones) {
    const record = pathway.milestoneRecords.find(r => r.milestoneId === milestone.id);
    const isAdherent = record?.status === MilestoneStatus.COMPLETED;
    const current = elementAdherence.get(milestone.element);
    elementAdherence.set(milestone.element, current !== undefined ? current && isAdherent : isAdherent);
  }

  const losDeviation = pathway.outcomes.actualLOS - pathway.outcomes.expectedLOS;

  for (const [element, adherent] of elementAdherence) {
    let impact = '';
    if (element === ERASElement.EARLY_MOBILIZATION) {
      impact = adherent
        ? `Early mobilization on day ${pathway.outcomes.mobilizationDay} - associated with shorter LOS`
        : `Delayed mobilization - LOS ${losDeviation > 0 ? losDeviation + ' days longer than expected' : 'within expected range'}`;
    } else if (element === ERASElement.EARLY_ORAL_NUTRITION) {
      impact = adherent
        ? `Oral nutrition started day ${pathway.outcomes.firstOralIntakeDay} - supports GI recovery`
        : 'Delayed nutrition may contribute to prolonged ileus';
    } else if (element === ERASElement.MULTIMODAL_ANALGESIA) {
      impact = adherent
        ? `Pain well-controlled (avg ${pathway.outcomes.painScoreAvg}/10) with multimodal approach`
        : `Higher pain scores (avg ${pathway.outcomes.painScoreAvg}/10) may limit mobility`;
    } else {
      impact = adherent ? 'Adherent - positive outcome association' : 'Non-adherent - monitor for adverse impact';
    }

    correlations[element] = { adherent, outcomeImpact: impact };
  }

  return correlations;
}

// ============================================================================
// Self-Learning Functions
// ============================================================================

function recordCompletedPathway(pathway: PatientPathway): void {
  learningStore.completedPathways.push(pathway);

  const template = getTemplate(pathway.surgeryType);
  if (!template) return;

  for (const milestone of template.milestones) {
    const record = pathway.milestoneRecords.find(r => r.milestoneId === milestone.id);
    if (!record) continue;

    const key = milestone.element;
    const existing = learningStore.outcomesByElement.get(key) ?? { adherent: [], nonAdherent: [] };

    if (record.status === MilestoneStatus.COMPLETED) {
      existing.adherent.push(pathway.outcomes);
    } else {
      existing.nonAdherent.push(pathway.outcomes);
    }

    learningStore.outcomesByElement.set(key, existing);
  }
}

function analyzeElementImpact(): ElementImpact[] {
  const impacts: ElementImpact[] = [];

  for (const [element, data] of learningStore.outcomesByElement) {
    if (data.adherent.length < 2 && data.nonAdherent.length < 2) continue;

    const avgLOSAdherent = data.adherent.length > 0
      ? data.adherent.reduce((sum, o) => sum + o.actualLOS, 0) / data.adherent.length
      : 0;
    const avgLOSNonAdherent = data.nonAdherent.length > 0
      ? data.nonAdherent.reduce((sum, o) => sum + o.actualLOS, 0) / data.nonAdherent.length
      : 0;

    const compRateAdherent = data.adherent.length > 0
      ? data.adherent.filter(o => o.complications.length > 0).length / data.adherent.length
      : 0;
    const compRateNonAdherent = data.nonAdherent.length > 0
      ? data.nonAdherent.filter(o => o.complications.length > 0).length / data.nonAdherent.length
      : 0;

    const losDiff = avgLOSNonAdherent - avgLOSAdherent;
    const compDiff = compRateNonAdherent - compRateAdherent;
    const impactScore = (losDiff * 0.6 + compDiff * 10 * 0.4);

    impacts.push({
      element: element as ERASElement,
      adherenceRate: data.adherent.length / (data.adherent.length + data.nonAdherent.length),
      avgLOSWhenAdherent: Math.round(avgLOSAdherent * 10) / 10,
      avgLOSWhenNonAdherent: Math.round(avgLOSNonAdherent * 10) / 10,
      complicationRateAdherent: Math.round(compRateAdherent * 1000) / 1000,
      complicationRateNonAdherent: Math.round(compRateNonAdherent * 1000) / 1000,
      impactScore: Math.round(impactScore * 100) / 100,
      sampleSize: data.adherent.length + data.nonAdherent.length,
    });
  }

  return impacts.sort((a, b) => b.impactScore - a.impactScore);
}

function updateElementWeights(): void {
  const impacts = analyzeElementImpact();
  if (impacts.length === 0) return;

  const maxImpact = Math.max(...impacts.map(i => Math.abs(i.impactScore)), 1);

  for (const impact of impacts) {
    // Scale weight: high impact elements get higher weights (1.0 to 2.0 range)
    const normalizedImpact = impact.impactScore / maxImpact;
    const weight = 1.0 + normalizedImpact * 0.5; // Gentle adjustment
    learningStore.elementWeights.set(impact.element, Math.max(0.5, Math.min(2.0, weight)));
  }
}

function generateLearningInsights(): LearningInsight[] {
  const impacts = analyzeElementImpact();
  const insights: LearningInsight[] = [];

  for (const impact of impacts) {
    if (impact.sampleSize < 3) continue;

    let insight = '';
    let recommendation = '';
    const confidence = Math.min(impact.sampleSize / 20, 1.0);

    if (impact.impactScore > 1) {
      insight = `${impact.element} adherence reduces LOS by ${(impact.avgLOSWhenNonAdherent - impact.avgLOSWhenAdherent).toFixed(1)} days on average`;
      recommendation = `Prioritize ${impact.element.replace(/_/g, ' ')} - high impact on recovery`;
    } else if (impact.complicationRateNonAdherent > impact.complicationRateAdherent * 1.5) {
      insight = `Non-adherence to ${impact.element} associated with ${Math.round((impact.complicationRateNonAdherent - impact.complicationRateAdherent) * 100)}% higher complication rate`;
      recommendation = `Ensure strict compliance with ${impact.element.replace(/_/g, ' ')}`;
    } else if (impact.adherenceRate < 0.5) {
      insight = `${impact.element} has low adherence rate (${Math.round(impact.adherenceRate * 100)}%) - potential systemic barrier`;
      recommendation = `Investigate barriers to ${impact.element.replace(/_/g, ' ')} compliance`;
    } else {
      insight = `${impact.element} showing stable adherence pattern`;
      recommendation = 'Continue current protocol emphasis';
    }

    insights.push({
      element: impact.element,
      insight,
      confidence: Math.round(confidence * 100) / 100,
      recommendation,
      dataPoints: impact.sampleSize,
    });
  }

  return insights;
}

function resetLearningData(): void {
  learningStore.outcomesByElement.clear();
  learningStore.elementWeights.clear();
  learningStore.completedPathways.length = 0;
}

// ============================================================================
// Exports
// ============================================================================

export const clinicalPathwayEngine = {
  getTemplate,
  initializePathway,
  updateMilestone,
  calculateComplianceScore,
  getComplianceLevel,
  generateComplianceReport,
  detectDeviations,
  getPhaseForDay,
  correlateOutcomes,
  recordCompletedPathway,
  analyzeElementImpact,
  updateElementWeights,
  generateLearningInsights,
  resetLearningData,
};
