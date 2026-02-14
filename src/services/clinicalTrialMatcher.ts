/**
 * Feature 37: Clinical Trial Eligibility Matcher
 *
 * Real inclusion/exclusion criteria parsing, patient profile matching,
 * eligibility scoring, ClinicalTrials.gov data model compliance,
 * distance-to-site consideration, and self-learning.
 */

// ============================================================================
// Constants
// ============================================================================

export const TrialPhase = {
  PHASE_I: 'Phase 1',
  PHASE_I_II: 'Phase 1/Phase 2',
  PHASE_II: 'Phase 2',
  PHASE_II_III: 'Phase 2/Phase 3',
  PHASE_III: 'Phase 3',
  PHASE_IV: 'Phase 4',
  NOT_APPLICABLE: 'N/A',
} as const;
export type TrialPhase = typeof TrialPhase[keyof typeof TrialPhase];

export const TrialCategory = {
  THERAPEUTIC: 'therapeutic',
  DEVICE: 'device',
  BEHAVIORAL: 'behavioral',
  OBSERVATIONAL: 'observational',
  DIAGNOSTIC: 'diagnostic',
  PREVENTION: 'prevention',
  SUPPORTIVE_CARE: 'supportive_care',
} as const;
export type TrialCategory = typeof TrialCategory[keyof typeof TrialCategory];

export const TrialStatus = {
  NOT_YET_RECRUITING: 'Not yet recruiting',
  RECRUITING: 'Recruiting',
  ENROLLING_BY_INVITATION: 'Enrolling by invitation',
  ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
  COMPLETED: 'Completed',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
  WITHDRAWN: 'Withdrawn',
} as const;
export type TrialStatus = typeof TrialStatus[keyof typeof TrialStatus];

export const EligibilityResult = {
  ELIGIBLE: 'eligible',
  PARTIALLY_ELIGIBLE: 'partially_eligible',
  EXCLUDED: 'excluded',
  INSUFFICIENT_DATA: 'insufficient_data',
} as const;
export type EligibilityResult = typeof EligibilityResult[keyof typeof EligibilityResult];

export const CriterionType = {
  AGE: 'age',
  GENDER: 'gender',
  DIAGNOSIS: 'diagnosis',
  PROCEDURE_HISTORY: 'procedure_history',
  LAB_VALUE: 'lab_value',
  MEDICATION: 'medication',
  COMORBIDITY: 'comorbidity',
  PERFORMANCE_STATUS: 'performance_status',
  TIME_SINCE_SURGERY: 'time_since_surgery',
  BMI: 'bmi',
  SMOKING_STATUS: 'smoking_status',
  ALLERGY: 'allergy',
  PREGNANCY: 'pregnancy',
  ORGAN_FUNCTION: 'organ_function',
  PRIOR_TREATMENT: 'prior_treatment',
} as const;
export type CriterionType = typeof CriterionType[keyof typeof CriterionType];

// ============================================================================
// Types
// ============================================================================

export type EligibilityCriterion = {
  type: CriterionType;
  isInclusion: boolean;
  description: string;
  parameter: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'between' | 'exists' | 'not_exists';
  value: string | number | string[] | [number, number];
  unit?: string;
  required: boolean;
};

export type TrialSite = {
  name: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isRecruiting: boolean;
};

export type ClinicalTrial = {
  nctId: string;
  title: string;
  briefSummary: string;
  phase: TrialPhase;
  category: TrialCategory;
  status: TrialStatus;
  sponsor: string;
  conditions: string[];
  interventions: Array<{ type: string; name: string; description: string }>;
  inclusionCriteria: EligibilityCriterion[];
  exclusionCriteria: EligibilityCriterion[];
  primaryOutcome: string;
  secondaryOutcomes: string[];
  estimatedEnrollment: number;
  startDate: string;
  estimatedCompletionDate: string;
  sites: TrialSite[];
  minAge: number;
  maxAge: number;
  gender: 'all' | 'male' | 'female';
  healthyVolunteers: boolean;
};

export type PatientProfile = {
  patientId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  diagnoses: string[];
  procedures: string[];
  medications: string[];
  labValues: Record<string, number>;
  comorbidities: string[];
  bmi?: number;
  smokingStatus?: 'never' | 'former' | 'current';
  performanceStatus?: number;
  daysSinceSurgery?: number;
  allergies: string[];
  isPregnant?: boolean;
  location?: { latitude: number; longitude: number; zipCode: string };
};

export type MatchResult = {
  trial: ClinicalTrial;
  eligibility: EligibilityResult;
  score: number;
  matchedCriteria: Array<{ criterion: EligibilityCriterion; met: boolean; detail: string }>;
  unmatchedCriteria: Array<{ criterion: EligibilityCriterion; reason: string }>;
  nearestSite?: { site: TrialSite; distanceMiles: number };
  recommendation: string;
};

export type EnrollmentOutcome = {
  trialNctId: string;
  patientId: string;
  wasEnrolled: boolean;
  matchScore: number;
  timestamp: string;
};

export type ClinicalTrialMatcher = {
  matchPatient(profile: PatientProfile): MatchResult[];
  matchPatientToTrial(profile: PatientProfile, trial: ClinicalTrial): MatchResult;
  evaluateCriterion(criterion: EligibilityCriterion, profile: PatientProfile): { met: boolean; detail: string };
  calculateEligibilityScore(matchedResults: Array<{ criterion: EligibilityCriterion; met: boolean }>): number;
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  findNearestSite(profile: PatientProfile, trial: ClinicalTrial): { site: TrialSite; distanceMiles: number } | null;
  getTrialsByCondition(condition: string): ClinicalTrial[];
  getTrialsByPhase(phase: TrialPhase): ClinicalTrial[];
  getTrialsByCategory(category: TrialCategory): ClinicalTrial[];
  getRecruitingTrials(): ClinicalTrial[];
  getAllTrials(): ClinicalTrial[];
  recordEnrollmentOutcome(outcome: EnrollmentOutcome): void;
  getImprovedMatchThreshold(): number;
};

// ============================================================================
// Clinical Trials Database (50+ synthetic trials)
// ============================================================================

const TRIALS_DATABASE: ClinicalTrial[] = [
  {
    nctId: 'NCT05000001', title: 'Multimodal Pain Management After Total Knee Arthroplasty', briefSummary: 'A randomized controlled trial evaluating a multimodal pain management protocol versus standard opioid-based pain management after total knee arthroplasty.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'National Institute of Arthritis', conditions: ['Total knee arthroplasty', 'Postoperative pain'], interventions: [{ type: 'Drug', name: 'Multimodal Protocol', description: 'Combination of nerve block, NSAIDs, acetaminophen, and gabapentin' }], inclusionCriteria: [
      { type: CriterionType.AGE, isInclusion: true, description: 'Age 50-85', parameter: 'age', operator: 'between', value: [50, 85], required: true },
      { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Scheduled for primary TKA', parameter: 'procedures', operator: 'in', value: ['Total knee arthroplasty', 'TKA'], required: true },
      { type: CriterionType.PERFORMANCE_STATUS, isInclusion: true, description: 'ECOG performance status 0-2', parameter: 'performanceStatus', operator: 'lte', value: 2, required: true },
    ], exclusionCriteria: [
      { type: CriterionType.ALLERGY, isInclusion: false, description: 'No NSAID allergy', parameter: 'allergies', operator: 'not_in', value: ['NSAID', 'ibuprofen', 'naproxen', 'celecoxib'], required: true },
      { type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No chronic kidney disease', parameter: 'comorbidities', operator: 'not_in', value: ['CKD', 'chronic kidney disease', 'renal failure'], required: true },
      { type: CriterionType.MEDICATION, isInclusion: false, description: 'Not on chronic opioids', parameter: 'medications', operator: 'not_in', value: ['oxycodone', 'morphine', 'hydrocodone', 'fentanyl', 'methadone'], required: true },
    ], primaryOutcome: 'Pain scores at 48 hours post-surgery', secondaryOutcomes: ['Opioid consumption', 'Length of stay', 'Patient satisfaction'], estimatedEnrollment: 200, startDate: '2025-01-15', estimatedCompletionDate: '2027-06-30', sites: [
      { name: 'Academic Medical Center', city: 'Boston', state: 'MA', zipCode: '02115', country: 'US', latitude: 42.3601, longitude: -71.0589, isRecruiting: true },
      { name: 'University Hospital', city: 'New York', state: 'NY', zipCode: '10016', country: 'US', latitude: 40.7128, longitude: -74.006, isRecruiting: true },
    ], minAge: 50, maxAge: 85, gender: 'all', healthyVolunteers: false,
  },
  {
    nctId: 'NCT05000002', title: 'Enhanced Recovery After Surgery (ERAS) for Colorectal Surgery', briefSummary: 'Evaluating an enhanced recovery after surgery protocol to reduce length of stay and complications following colorectal surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'American College of Surgeons', conditions: ['Colorectal surgery', 'Postoperative recovery'], interventions: [{ type: 'Behavioral', name: 'ERAS Protocol', description: 'Standardized multimodal perioperative care pathway including early mobilization, nutritional optimization, and fluid management' }], inclusionCriteria: [
      { type: CriterionType.AGE, isInclusion: true, description: 'Age 18-80', parameter: 'age', operator: 'between', value: [18, 80], required: true },
      { type: CriterionType.DIAGNOSIS, isInclusion: true, description: 'Planned elective colorectal surgery', parameter: 'diagnoses', operator: 'in', value: ['colorectal cancer', 'diverticular disease', 'inflammatory bowel disease', 'colon polyps'], required: true },
    ], exclusionCriteria: [
      { type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No severe cardiac disease', parameter: 'comorbidities', operator: 'not_in', value: ['heart failure NYHA III', 'heart failure NYHA IV', 'unstable angina'], required: true },
      { type: CriterionType.PREGNANCY, isInclusion: false, description: 'Not pregnant', parameter: 'isPregnant', operator: 'eq', value: 'false', required: true },
    ], primaryOutcome: 'Length of hospital stay', secondaryOutcomes: ['30-day readmission', 'Surgical site infection rate', 'Return to normal function'], estimatedEnrollment: 300, startDate: '2025-03-01', estimatedCompletionDate: '2027-12-31', sites: [
      { name: 'Surgical Institute', city: 'Chicago', state: 'IL', zipCode: '60611', country: 'US', latitude: 41.8781, longitude: -87.6298, isRecruiting: true },
    ], minAge: 18, maxAge: 80, gender: 'all', healthyVolunteers: false,
  },
  {
    nctId: 'NCT05000003', title: 'Telehealth-Based Physical Therapy After Hip Replacement', briefSummary: 'Comparing outcomes of telehealth-delivered physical therapy versus in-person physical therapy after total hip arthroplasty.', phase: TrialPhase.PHASE_IV, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'National Institutes of Health', conditions: ['Total hip arthroplasty', 'Physical therapy', 'Rehabilitation'], interventions: [{ type: 'Behavioral', name: 'Telehealth PT', description: 'Structured telehealth physical therapy program with remote monitoring' }], inclusionCriteria: [
      { type: CriterionType.AGE, isInclusion: true, description: 'Age 45-80', parameter: 'age', operator: 'between', value: [45, 80], required: true },
      { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Undergone total hip arthroplasty', parameter: 'procedures', operator: 'in', value: ['Total hip arthroplasty', 'THA', 'hip replacement'], required: true },
      { type: CriterionType.TIME_SINCE_SURGERY, isInclusion: true, description: 'Within 14 days of surgery', parameter: 'daysSinceSurgery', operator: 'lte', value: 14, required: true },
    ], exclusionCriteria: [
      { type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No severe cognitive impairment', parameter: 'comorbidities', operator: 'not_in', value: ['dementia', 'severe cognitive impairment'], required: true },
    ], primaryOutcome: 'Harris Hip Score at 12 weeks', secondaryOutcomes: ['Patient satisfaction', 'Cost-effectiveness', 'Complication rate'], estimatedEnrollment: 150, startDate: '2025-02-01', estimatedCompletionDate: '2027-08-31', sites: [
      { name: 'Rehabilitation Center', city: 'Los Angeles', state: 'CA', zipCode: '90024', country: 'US', latitude: 34.0522, longitude: -118.2437, isRecruiting: true },
      { name: 'Orthopedic Institute', city: 'San Francisco', state: 'CA', zipCode: '94143', country: 'US', latitude: 37.7749, longitude: -122.4194, isRecruiting: true },
    ], minAge: 45, maxAge: 80, gender: 'all', healthyVolunteers: false,
  },
  {
    nctId: 'NCT05000004', title: 'Novel Anticoagulant for DVT Prevention After Orthopedic Surgery', briefSummary: 'Phase II trial of a next-generation oral anticoagulant for deep vein thrombosis prevention after major orthopedic surgery.', phase: TrialPhase.PHASE_II, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'PharmaCorp Research', conditions: ['DVT prevention', 'Orthopedic surgery', 'Thromboprophylaxis'], interventions: [{ type: 'Drug', name: 'NovAnticoag-X', description: 'Novel factor XIa inhibitor for thromboprophylaxis' }], inclusionCriteria: [
      { type: CriterionType.AGE, isInclusion: true, description: 'Age 40-75', parameter: 'age', operator: 'between', value: [40, 75], required: true },
      { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Recent major orthopedic surgery', parameter: 'procedures', operator: 'in', value: ['Total knee arthroplasty', 'Total hip arthroplasty', 'hip fracture repair'], required: true },
      { type: CriterionType.LAB_VALUE, isInclusion: true, description: 'Platelet count > 100,000', parameter: 'plateletCount', operator: 'gt', value: 100, unit: '10*3/uL', required: true },
    ], exclusionCriteria: [
      { type: CriterionType.MEDICATION, isInclusion: false, description: 'Not on other anticoagulants', parameter: 'medications', operator: 'not_in', value: ['warfarin', 'rivaroxaban', 'apixaban', 'dabigatran', 'enoxaparin'], required: true },
      { type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No active bleeding disorder', parameter: 'comorbidities', operator: 'not_in', value: ['hemophilia', 'von Willebrand disease', 'active GI bleed'], required: true },
      { type: CriterionType.LAB_VALUE, isInclusion: false, description: 'INR <= 1.5', parameter: 'INR', operator: 'lte', value: 1.5, required: false },
    ], primaryOutcome: 'VTE incidence at 35 days', secondaryOutcomes: ['Major bleeding events', 'All-cause mortality', 'Composite efficacy endpoint'], estimatedEnrollment: 400, startDate: '2025-04-01', estimatedCompletionDate: '2028-03-31', sites: [
      { name: 'Vascular Research Center', city: 'Houston', state: 'TX', zipCode: '77030', country: 'US', latitude: 29.7604, longitude: -95.3698, isRecruiting: true },
    ], minAge: 40, maxAge: 75, gender: 'all', healthyVolunteers: false,
  },
  {
    nctId: 'NCT05000005', title: 'Robotic-Assisted Versus Standard Laparoscopic Cholecystectomy', briefSummary: 'Comparing outcomes of robotic-assisted versus standard laparoscopic cholecystectomy in terms of operative time, complications, and recovery.', phase: TrialPhase.PHASE_IV, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Surgical Innovation Foundation', conditions: ['Cholecystectomy', 'Gallbladder disease', 'Cholelithiasis'], interventions: [{ type: 'Device', name: 'Robotic Surgical System', description: 'Da Vinci robotic-assisted surgical platform' }], inclusionCriteria: [
      { type: CriterionType.AGE, isInclusion: true, description: 'Age 18-70', parameter: 'age', operator: 'between', value: [18, 70], required: true },
      { type: CriterionType.DIAGNOSIS, isInclusion: true, description: 'Symptomatic cholelithiasis', parameter: 'diagnoses', operator: 'in', value: ['cholelithiasis', 'gallstones', 'biliary colic', 'chronic cholecystitis'], required: true },
      { type: CriterionType.BMI, isInclusion: true, description: 'BMI < 40', parameter: 'bmi', operator: 'lt', value: 40, required: true },
    ], exclusionCriteria: [
      { type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No previous upper abdominal surgery', parameter: 'procedures', operator: 'not_in', value: ['gastric bypass', 'liver resection', 'pancreatic surgery'], required: true },
    ], primaryOutcome: 'Operative time', secondaryOutcomes: ['Conversion rate', 'Length of stay', 'Bile duct injury rate', '30-day complications'], estimatedEnrollment: 250, startDate: '2025-06-01', estimatedCompletionDate: '2027-12-31', sites: [
      { name: 'Robotic Surgery Center', city: 'Atlanta', state: 'GA', zipCode: '30322', country: 'US', latitude: 33.749, longitude: -84.388, isRecruiting: true },
    ], minAge: 18, maxAge: 70, gender: 'all', healthyVolunteers: false,
  },
  // Trials 6-10
  { nctId: 'NCT05000006', title: 'Wearable Sensor Monitoring for Early Surgical Complications', briefSummary: 'Using continuous wearable sensor data to detect early signs of post-surgical complications.', phase: TrialPhase.PHASE_II, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Digital Health Institute', conditions: ['Postoperative monitoring', 'Surgical complications'], interventions: [{ type: 'Device', name: 'SmartPatch Sensor', description: 'Continuous vital sign monitoring patch with AI-based anomaly detection' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 21-90', parameter: 'age', operator: 'between', value: [21, 90], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Any major surgery', parameter: 'procedures', operator: 'exists', value: '', required: true }], exclusionCriteria: [{ type: CriterionType.ALLERGY, isInclusion: false, description: 'No adhesive allergy', parameter: 'allergies', operator: 'not_in', value: ['adhesive', 'medical tape', 'latex'], required: true }], primaryOutcome: 'Time to detection of complications', secondaryOutcomes: ['False positive rate', 'Patient compliance'], estimatedEnrollment: 500, startDate: '2025-01-01', estimatedCompletionDate: '2027-06-30', sites: [{ name: 'Digital Health Lab', city: 'Seattle', state: 'WA', zipCode: '98109', country: 'US', latitude: 47.6062, longitude: -122.3321, isRecruiting: true }], minAge: 21, maxAge: 90, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000007', title: 'Preoperative Exercise Training (Prehabilitation) for Cardiac Surgery', briefSummary: 'Evaluating structured preoperative exercise program on postoperative outcomes in cardiac surgery patients.', phase: TrialPhase.PHASE_III, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'Cardiac Surgery Research Group', conditions: ['Cardiac surgery', 'CABG', 'Valve replacement'], interventions: [{ type: 'Behavioral', name: 'Prehabilitation Program', description: '4-week supervised exercise program before cardiac surgery' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 50-80', parameter: 'age', operator: 'between', value: [50, 80], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Scheduled for cardiac surgery', parameter: 'procedures', operator: 'in', value: ['CABG', 'coronary artery bypass', 'valve replacement', 'aortic valve replacement'], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No unstable angina', parameter: 'comorbidities', operator: 'not_in', value: ['unstable angina', 'acute MI'], required: true }], primaryOutcome: 'Postoperative length of stay', secondaryOutcomes: ['6-minute walk test', 'Quality of life', 'Pulmonary complications'], estimatedEnrollment: 180, startDate: '2025-03-15', estimatedCompletionDate: '2028-03-15', sites: [{ name: 'Cardiac Center', city: 'Cleveland', state: 'OH', zipCode: '44106', country: 'US', latitude: 41.4993, longitude: -81.6944, isRecruiting: true }], minAge: 50, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000008', title: 'AI-Assisted Wound Assessment in Post-Surgical Patients', briefSummary: 'Validating an AI-powered smartphone application for surgical wound assessment and infection detection.', phase: TrialPhase.NOT_APPLICABLE, category: TrialCategory.DIAGNOSTIC, status: TrialStatus.RECRUITING, sponsor: 'MedTech Innovations', conditions: ['Surgical wound', 'Wound assessment', 'SSI detection'], interventions: [{ type: 'Diagnostic', name: 'WoundAI App', description: 'Smartphone-based AI wound image analysis application' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18+', parameter: 'age', operator: 'gte', value: 18, required: true }, { type: CriterionType.TIME_SINCE_SURGERY, isInclusion: true, description: 'Within 30 days of surgery', parameter: 'daysSinceSurgery', operator: 'lte', value: 30, required: true }], exclusionCriteria: [], primaryOutcome: 'Sensitivity and specificity for SSI detection', secondaryOutcomes: ['Time to diagnosis', 'Patient satisfaction'], estimatedEnrollment: 600, startDate: '2025-02-01', estimatedCompletionDate: '2026-12-31', sites: [{ name: 'University Hospital', city: 'Philadelphia', state: 'PA', zipCode: '19104', country: 'US', latitude: 39.9526, longitude: -75.1652, isRecruiting: true }], minAge: 18, maxAge: 120, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000009', title: 'Mindfulness-Based Stress Reduction for Postoperative Recovery', briefSummary: 'Evaluating mindfulness-based stress reduction program on pain, anxiety, and recovery outcomes after surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'Integrative Medicine Institute', conditions: ['Postoperative recovery', 'Pain management', 'Anxiety'], interventions: [{ type: 'Behavioral', name: 'MBSR Program', description: '8-week mindfulness-based stress reduction program adapted for surgical patients' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 25-75', parameter: 'age', operator: 'between', value: [25, 75], required: true }, { type: CriterionType.TIME_SINCE_SURGERY, isInclusion: true, description: 'Within 7 days of surgery', parameter: 'daysSinceSurgery', operator: 'lte', value: 7, required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No active psychosis', parameter: 'comorbidities', operator: 'not_in', value: ['psychosis', 'schizophrenia', 'active psychotic disorder'], required: true }], primaryOutcome: 'Pain scores at 4 weeks', secondaryOutcomes: ['Anxiety scores', 'Sleep quality', 'Opioid use'], estimatedEnrollment: 120, startDate: '2025-05-01', estimatedCompletionDate: '2027-05-01', sites: [{ name: 'Integrative Health Center', city: 'Denver', state: 'CO', zipCode: '80218', country: 'US', latitude: 39.7392, longitude: -104.9903, isRecruiting: true }], minAge: 25, maxAge: 75, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000010', title: 'Nutritional Supplementation for Wound Healing Post-Surgery', briefSummary: 'Examining the effect of high-protein nutritional supplements on wound healing and recovery.', phase: TrialPhase.PHASE_II, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Nutrition Research Foundation', conditions: ['Wound healing', 'Surgical recovery', 'Malnutrition'], interventions: [{ type: 'Dietary Supplement', name: 'HealPro Nutrition', description: 'High-protein, arginine-enriched oral nutritional supplement' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 40-85', parameter: 'age', operator: 'between', value: [40, 85], required: true }, { type: CriterionType.LAB_VALUE, isInclusion: true, description: 'Albumin < 3.5 g/dL', parameter: 'albumin', operator: 'lt', value: 3.5, required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No severe renal disease', parameter: 'comorbidities', operator: 'not_in', value: ['ESRD', 'dialysis', 'CKD stage 5'], required: true }], primaryOutcome: 'Wound healing rate at 4 weeks', secondaryOutcomes: ['Albumin levels', 'Wound infection rate', 'Length of stay'], estimatedEnrollment: 160, startDate: '2025-07-01', estimatedCompletionDate: '2027-07-01', sites: [{ name: 'Nutrition Research Center', city: 'Nashville', state: 'TN', zipCode: '37232', country: 'US', latitude: 36.1627, longitude: -86.7816, isRecruiting: true }], minAge: 40, maxAge: 85, gender: 'all', healthyVolunteers: false },
  // Trials 11-20
  { nctId: 'NCT05000011', title: 'Nerve Block vs Epidural for Post-Thoracotomy Pain', briefSummary: 'Comparing paravertebral nerve block to epidural analgesia for post-thoracotomy pain management.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Anesthesia Research Society', conditions: ['Thoracotomy', 'Post-surgical pain'], interventions: [{ type: 'Procedure', name: 'Paravertebral Block', description: 'Continuous paravertebral nerve block catheter' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 30-75', parameter: 'age', operator: 'between', value: [30, 75], required: true }], exclusionCriteria: [], primaryOutcome: 'Pain scores at 72 hours', secondaryOutcomes: ['Pulmonary function tests', 'Length of stay'], estimatedEnrollment: 100, startDate: '2025-04-01', estimatedCompletionDate: '2027-10-01', sites: [{ name: 'Thoracic Surgery Center', city: 'Rochester', state: 'MN', zipCode: '55905', country: 'US', latitude: 44.0121, longitude: -92.4802, isRecruiting: true }], minAge: 30, maxAge: 75, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000012', title: 'Early Mobilization Protocol After Spinal Fusion', briefSummary: 'Evaluating ultra-early mobilization within 4 hours of spinal fusion surgery versus standard next-day mobilization.', phase: TrialPhase.PHASE_III, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'Spine Research Institute', conditions: ['Spinal fusion', 'Lumbar surgery'], interventions: [{ type: 'Behavioral', name: 'Ultra-Early Mobilization', description: 'Structured mobilization within 4 hours post-surgery' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 30-70', parameter: 'age', operator: 'between', value: [30, 70], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Scheduled for lumbar fusion', parameter: 'procedures', operator: 'in', value: ['Spinal fusion', 'lumbar fusion', 'ALIF', 'PLIF', 'TLIF'], required: true }], exclusionCriteria: [{ type: CriterionType.BMI, isInclusion: false, description: 'BMI < 45', parameter: 'bmi', operator: 'lt', value: 45, required: false }], primaryOutcome: 'Functional recovery at 6 weeks', secondaryOutcomes: ['Length of stay', 'Complication rate', 'Return to work'], estimatedEnrollment: 200, startDate: '2025-06-01', estimatedCompletionDate: '2028-06-01', sites: [{ name: 'Spine Center', city: 'Pittsburgh', state: 'PA', zipCode: '15213', country: 'US', latitude: 40.4406, longitude: -79.9959, isRecruiting: true }], minAge: 30, maxAge: 70, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000013', title: 'Silver-Coated Wound Dressing for Surgical Site Infection Prevention', briefSummary: 'Evaluating silver-impregnated wound dressings for SSI prevention after abdominal surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Wound Care Research Group', conditions: ['Surgical site infection', 'Wound care'], interventions: [{ type: 'Device', name: 'Silver Wound Dressing', description: 'Antimicrobial silver-coated surgical wound dressing' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-85', parameter: 'age', operator: 'between', value: [18, 85], required: true }], exclusionCriteria: [{ type: CriterionType.ALLERGY, isInclusion: false, description: 'No silver allergy', parameter: 'allergies', operator: 'not_in', value: ['silver'], required: true }], primaryOutcome: 'SSI rate at 30 days', secondaryOutcomes: ['Wound healing time', 'Dressing change frequency'], estimatedEnrollment: 300, startDate: '2025-01-15', estimatedCompletionDate: '2027-01-15', sites: [{ name: 'Surgical Wound Center', city: 'Baltimore', state: 'MD', zipCode: '21205', country: 'US', latitude: 39.2904, longitude: -76.6122, isRecruiting: true }], minAge: 18, maxAge: 85, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000014', title: 'Remote Patient Monitoring After Ambulatory Surgery', briefSummary: 'Evaluating remote patient monitoring versus standard follow-up after same-day surgery.', phase: TrialPhase.PHASE_IV, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Ambulatory Surgery Association', conditions: ['Ambulatory surgery', 'Remote monitoring'], interventions: [{ type: 'Device', name: 'Remote Monitoring Kit', description: 'Home vital sign monitoring with nurse check-ins' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-80', parameter: 'age', operator: 'between', value: [18, 80], required: true }], exclusionCriteria: [], primaryOutcome: 'Unplanned ED visits within 72 hours', secondaryOutcomes: ['Patient satisfaction', 'Cost analysis'], estimatedEnrollment: 400, startDate: '2025-03-01', estimatedCompletionDate: '2027-03-01', sites: [{ name: 'Ambulatory Surgery Center', city: 'Dallas', state: 'TX', zipCode: '75390', country: 'US', latitude: 32.7767, longitude: -96.7970, isRecruiting: true }], minAge: 18, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000015', title: 'Antibiotic Duration After Appendectomy for Complicated Appendicitis', briefSummary: 'Comparing 3-day versus 5-day postoperative antibiotics after appendectomy for complicated appendicitis.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Infectious Disease Research Network', conditions: ['Appendicitis', 'Appendectomy', 'Surgical infection'], interventions: [{ type: 'Drug', name: 'Short-course Antibiotics', description: '3-day postoperative antibiotic course' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-65', parameter: 'age', operator: 'between', value: [18, 65], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Undergone appendectomy', parameter: 'procedures', operator: 'in', value: ['appendectomy', 'laparoscopic appendectomy'], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No immunosuppression', parameter: 'comorbidities', operator: 'not_in', value: ['HIV', 'immunosuppressed', 'transplant recipient', 'chemotherapy'], required: true }], primaryOutcome: 'Intra-abdominal abscess rate at 30 days', secondaryOutcomes: ['C. difficile infection rate', 'Antibiotic resistance patterns'], estimatedEnrollment: 250, startDate: '2025-05-01', estimatedCompletionDate: '2027-11-01', sites: [{ name: 'Emergency Surgery Unit', city: 'Miami', state: 'FL', zipCode: '33136', country: 'US', latitude: 25.7617, longitude: -80.1918, isRecruiting: true }], minAge: 18, maxAge: 65, gender: 'all', healthyVolunteers: false },
  // Trials 16-25
  { nctId: 'NCT05000016', title: 'Acupuncture for Postoperative Nausea and Vomiting', briefSummary: 'Evaluating acupuncture at PC6 point for PONV prevention.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Integrative Anesthesia Group', conditions: ['PONV', 'Postoperative nausea'], interventions: [{ type: 'Procedure', name: 'Acupuncture', description: 'PC6 acupuncture for antiemetic effect' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-70', parameter: 'age', operator: 'between', value: [18, 70], required: true }, { type: CriterionType.GENDER, isInclusion: true, description: 'Female patients', parameter: 'gender', operator: 'eq', value: 'female', required: true }], exclusionCriteria: [], primaryOutcome: 'PONV incidence at 24 hours', secondaryOutcomes: ['Rescue antiemetic use', 'Patient satisfaction'], estimatedEnrollment: 100, startDate: '2025-02-01', estimatedCompletionDate: '2026-08-01', sites: [{ name: 'Integrative Medicine Unit', city: 'Portland', state: 'OR', zipCode: '97239', country: 'US', latitude: 45.5152, longitude: -122.6784, isRecruiting: true }], minAge: 18, maxAge: 70, gender: 'female', healthyVolunteers: false },
  { nctId: 'NCT05000017', title: 'Continuous Glucose Monitoring in Diabetic Surgical Patients', briefSummary: 'Evaluating CGM versus standard glucose monitoring in diabetic patients undergoing surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Diabetes Surgery Coalition', conditions: ['Diabetes', 'Perioperative glucose management'], interventions: [{ type: 'Device', name: 'CGM System', description: 'Continuous glucose monitoring with alerts' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 30-80', parameter: 'age', operator: 'between', value: [30, 80], required: true }, { type: CriterionType.DIAGNOSIS, isInclusion: true, description: 'Type 1 or Type 2 diabetes', parameter: 'diagnoses', operator: 'in', value: ['type 1 diabetes', 'type 2 diabetes', 'diabetes mellitus'], required: true }], exclusionCriteria: [], primaryOutcome: 'Time in glucose target range', secondaryOutcomes: ['Hypoglycemic episodes', 'SSI rate', 'Length of stay'], estimatedEnrollment: 200, startDate: '2025-04-01', estimatedCompletionDate: '2027-04-01', sites: [{ name: 'Diabetes Center', city: 'Minneapolis', state: 'MN', zipCode: '55455', country: 'US', latitude: 44.9778, longitude: -93.2650, isRecruiting: true }], minAge: 30, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000018', title: 'Virtual Reality for Postoperative Pain Management', briefSummary: 'Evaluating immersive VR therapy as adjunctive treatment for postoperative pain.', phase: TrialPhase.PHASE_II, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'VR Therapeutics Inc', conditions: ['Postoperative pain', 'Pain management'], interventions: [{ type: 'Device', name: 'VR Pain Therapy', description: 'Immersive virtual reality therapy sessions' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-65', parameter: 'age', operator: 'between', value: [18, 65], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No seizure disorder', parameter: 'comorbidities', operator: 'not_in', value: ['epilepsy', 'seizure disorder'], required: true }], primaryOutcome: 'Pain reduction during VR sessions', secondaryOutcomes: ['Opioid use reduction', 'Patient satisfaction', 'Anxiety scores'], estimatedEnrollment: 80, startDate: '2025-08-01', estimatedCompletionDate: '2027-02-01', sites: [{ name: 'Pain Research Lab', city: 'San Diego', state: 'CA', zipCode: '92093', country: 'US', latitude: 32.7157, longitude: -117.1611, isRecruiting: true }], minAge: 18, maxAge: 65, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000019', title: 'Oral Immunonutrition Before Major Cancer Surgery', briefSummary: 'Evaluating preoperative immunonutrition on postoperative outcomes in cancer patients.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Oncology Nutrition Alliance', conditions: ['Cancer surgery', 'Immunonutrition'], interventions: [{ type: 'Dietary Supplement', name: 'ImmunoBoost', description: 'Arginine, omega-3, and nucleotide-enriched supplement' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 35-80', parameter: 'age', operator: 'between', value: [35, 80], required: true }, { type: CriterionType.DIAGNOSIS, isInclusion: true, description: 'Scheduled for cancer surgery', parameter: 'diagnoses', operator: 'in', value: ['colon cancer', 'gastric cancer', 'pancreatic cancer', 'esophageal cancer'], required: true }], exclusionCriteria: [], primaryOutcome: 'Infectious complication rate', secondaryOutcomes: ['Length of stay', 'Immune function markers'], estimatedEnrollment: 220, startDate: '2025-06-01', estimatedCompletionDate: '2028-06-01', sites: [{ name: 'Cancer Surgery Center', city: 'Houston', state: 'TX', zipCode: '77030', country: 'US', latitude: 29.7604, longitude: -95.3698, isRecruiting: true }], minAge: 35, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000020', title: 'Prophylactic Negative Pressure Wound Therapy in Obese Patients', briefSummary: 'Evaluating prophylactic negative pressure wound therapy for SSI prevention in obese patients.', phase: TrialPhase.PHASE_III, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Wound Innovation Research', conditions: ['Obesity', 'Surgical site infection', 'Wound management'], interventions: [{ type: 'Device', name: 'Negative Pressure System', description: 'Portable negative pressure wound therapy device' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-70', parameter: 'age', operator: 'between', value: [18, 70], required: true }, { type: CriterionType.BMI, isInclusion: true, description: 'BMI >= 30', parameter: 'bmi', operator: 'gte', value: 30, required: true }], exclusionCriteria: [], primaryOutcome: 'SSI rate at 30 days', secondaryOutcomes: ['Wound dehiscence', 'Readmission rate'], estimatedEnrollment: 350, startDate: '2025-02-15', estimatedCompletionDate: '2027-08-15', sites: [{ name: 'Bariatric Surgery Center', city: 'Phoenix', state: 'AZ', zipCode: '85004', country: 'US', latitude: 33.4484, longitude: -112.074, isRecruiting: true }], minAge: 18, maxAge: 70, gender: 'all', healthyVolunteers: false },
  // Trials 21-30 (more concise entries)
  { nctId: 'NCT05000021', title: 'Opioid-Free Anesthesia for Bariatric Surgery', briefSummary: 'Evaluating opioid-free anesthesia technique in bariatric surgery patients.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Bariatric Anesthesia Group', conditions: ['Bariatric surgery', 'Opioid-free anesthesia'], interventions: [{ type: 'Drug', name: 'OFA Protocol', description: 'Ketamine, dexmedetomidine, and lidocaine infusion' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 21-60', parameter: 'age', operator: 'between', value: [21, 60], required: true }, { type: CriterionType.BMI, isInclusion: true, description: 'BMI >= 35', parameter: 'bmi', operator: 'gte', value: 35, required: true }], exclusionCriteria: [], primaryOutcome: 'PONV incidence', secondaryOutcomes: ['Pain scores', 'Time to discharge'], estimatedEnrollment: 150, startDate: '2025-03-01', estimatedCompletionDate: '2027-09-01', sites: [{ name: 'Bariatric Center', city: 'Tampa', state: 'FL', zipCode: '33602', country: 'US', latitude: 27.9506, longitude: -82.4572, isRecruiting: true }], minAge: 21, maxAge: 60, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000022', title: 'Probiotics for C. difficile Prevention Post-Surgery', briefSummary: 'Evaluating probiotic supplementation for preventing C. difficile infection in surgical patients on antibiotics.', phase: TrialPhase.PHASE_II, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Microbiome Research Network', conditions: ['C. difficile prevention', 'Antibiotic-associated diarrhea'], interventions: [{ type: 'Dietary Supplement', name: 'ProBioGuard', description: 'Multi-strain probiotic capsule' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 40-85', parameter: 'age', operator: 'between', value: [40, 85], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No immunocompromised state', parameter: 'comorbidities', operator: 'not_in', value: ['immunocompromised', 'chemotherapy', 'HIV with CD4 < 200'], required: true }], primaryOutcome: 'C. difficile infection rate', secondaryOutcomes: ['Antibiotic-associated diarrhea', 'Length of stay'], estimatedEnrollment: 300, startDate: '2025-07-01', estimatedCompletionDate: '2027-07-01', sites: [{ name: 'GI Research Center', city: 'Cincinnati', state: 'OH', zipCode: '45220', country: 'US', latitude: 39.1031, longitude: -84.512, isRecruiting: true }], minAge: 40, maxAge: 85, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000023', title: 'Enhanced Thromboprophylaxis After Cancer Surgery', briefSummary: 'Extended versus standard thromboprophylaxis after major cancer surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Thrombosis Research Institute', conditions: ['Cancer surgery', 'VTE prevention'], interventions: [{ type: 'Drug', name: 'Extended LMWH', description: '28-day versus 10-day enoxaparin' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 30-80', parameter: 'age', operator: 'between', value: [30, 80], required: true }, { type: CriterionType.DIAGNOSIS, isInclusion: true, description: 'Cancer diagnosis requiring surgery', parameter: 'diagnoses', operator: 'in', value: ['colon cancer', 'rectal cancer', 'pancreatic cancer', 'ovarian cancer', 'bladder cancer'], required: true }], exclusionCriteria: [], primaryOutcome: 'VTE rate at 90 days', secondaryOutcomes: ['Bleeding events', 'Mortality'], estimatedEnrollment: 500, startDate: '2025-01-01', estimatedCompletionDate: '2028-01-01', sites: [{ name: 'Cancer Center', city: 'Boston', state: 'MA', zipCode: '02115', country: 'US', latitude: 42.3601, longitude: -71.0589, isRecruiting: true }], minAge: 30, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000024', title: 'Perioperative Music Therapy for Anxiety Reduction', briefSummary: 'Evaluating live music therapy on preoperative anxiety and postoperative outcomes.', phase: TrialPhase.PHASE_II, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'Arts in Medicine Foundation', conditions: ['Preoperative anxiety', 'Music therapy'], interventions: [{ type: 'Behavioral', name: 'Live Music Therapy', description: 'Trained music therapist sessions pre and post-surgery' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-80', parameter: 'age', operator: 'between', value: [18, 80], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No hearing impairment', parameter: 'comorbidities', operator: 'not_in', value: ['deaf', 'severe hearing loss'], required: true }], primaryOutcome: 'State-Trait Anxiety Inventory scores', secondaryOutcomes: ['Heart rate variability', 'Pain scores', 'Patient satisfaction'], estimatedEnrollment: 120, startDate: '2025-04-01', estimatedCompletionDate: '2026-10-01', sites: [{ name: 'Arts Medicine Center', city: 'Nashville', state: 'TN', zipCode: '37232', country: 'US', latitude: 36.1627, longitude: -86.7816, isRecruiting: true }], minAge: 18, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000025', title: 'Platelet-Rich Plasma for Rotator Cuff Repair Augmentation', briefSummary: 'Evaluating PRP injection augmentation in arthroscopic rotator cuff repair.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Sports Medicine Research Group', conditions: ['Rotator cuff tear', 'Shoulder surgery'], interventions: [{ type: 'Biological', name: 'PRP Injection', description: 'Autologous platelet-rich plasma injection at repair site' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 40-70', parameter: 'age', operator: 'between', value: [40, 70], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Scheduled for rotator cuff repair', parameter: 'procedures', operator: 'in', value: ['rotator cuff repair', 'shoulder arthroscopy'], required: true }], exclusionCriteria: [{ type: CriterionType.SMOKING_STATUS, isInclusion: false, description: 'Non-smoker', parameter: 'smokingStatus', operator: 'neq', value: 'current', required: true }], primaryOutcome: 'Re-tear rate at 12 months (MRI)', secondaryOutcomes: ['Shoulder function score', 'Pain reduction', 'Return to activity'], estimatedEnrollment: 180, startDate: '2025-05-01', estimatedCompletionDate: '2028-05-01', sites: [{ name: 'Sports Medicine Center', city: 'Scottsdale', state: 'AZ', zipCode: '85258', country: 'US', latitude: 33.5092, longitude: -111.8989, isRecruiting: true }], minAge: 40, maxAge: 70, gender: 'all', healthyVolunteers: false },
  // Trials 26-35
  { nctId: 'NCT05000026', title: 'Ketamine Infusion for Chronic Post-Surgical Pain Prevention', briefSummary: 'Low-dose perioperative ketamine infusion to prevent chronic post-surgical pain development.', phase: TrialPhase.PHASE_II_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Pain Prevention Alliance', conditions: ['Chronic post-surgical pain', 'Pain prevention'], interventions: [{ type: 'Drug', name: 'Low-dose Ketamine', description: 'Subanaesthetic ketamine infusion perioperatively' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-65', parameter: 'age', operator: 'between', value: [18, 65], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No psychotic disorder', parameter: 'comorbidities', operator: 'not_in', value: ['schizophrenia', 'psychosis'], required: true }], primaryOutcome: 'Chronic pain incidence at 6 months', secondaryOutcomes: ['Pain scores at 3 months', 'Opioid use at 3 months'], estimatedEnrollment: 200, startDate: '2025-03-01', estimatedCompletionDate: '2028-03-01', sites: [{ name: 'Pain Research Institute', city: 'Philadelphia', state: 'PA', zipCode: '19104', country: 'US', latitude: 39.9526, longitude: -75.1652, isRecruiting: true }], minAge: 18, maxAge: 65, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000027', title: 'Cognitive Behavioral Therapy for Post-Surgical Depression', briefSummary: 'Brief CBT intervention for patients with post-surgical depressive symptoms.', phase: TrialPhase.PHASE_III, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'Surgical Psychology Research', conditions: ['Post-surgical depression', 'Adjustment disorder'], interventions: [{ type: 'Behavioral', name: 'Brief CBT', description: '6-session CBT protocol for post-surgical patients' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-75', parameter: 'age', operator: 'between', value: [18, 75], required: true }, { type: CriterionType.DIAGNOSIS, isInclusion: true, description: 'Depression or adjustment disorder', parameter: 'diagnoses', operator: 'in', value: ['depression', 'adjustment disorder', 'depressive disorder'], required: true }], exclusionCriteria: [], primaryOutcome: 'PHQ-9 scores at 12 weeks', secondaryOutcomes: ['Functional recovery', 'Return to work'], estimatedEnrollment: 100, startDate: '2025-06-01', estimatedCompletionDate: '2027-06-01', sites: [{ name: 'Behavioral Health Center', city: 'Ann Arbor', state: 'MI', zipCode: '48109', country: 'US', latitude: 42.2808, longitude: -83.743, isRecruiting: true }], minAge: 18, maxAge: 75, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000028', title: 'Stem Cell Therapy for Cartilage Regeneration After Knee Surgery', briefSummary: 'Autologous mesenchymal stem cell therapy for cartilage repair after knee surgery.', phase: TrialPhase.PHASE_I_II, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Regenerative Medicine Corp', conditions: ['Cartilage defect', 'Knee surgery'], interventions: [{ type: 'Biological', name: 'MSC Therapy', description: 'Autologous mesenchymal stem cell implantation' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 25-55', parameter: 'age', operator: 'between', value: [25, 55], required: true }, { type: CriterionType.BMI, isInclusion: true, description: 'BMI <= 35', parameter: 'bmi', operator: 'lte', value: 35, required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No autoimmune disease', parameter: 'comorbidities', operator: 'not_in', value: ['rheumatoid arthritis', 'lupus', 'autoimmune disease'], required: true }], primaryOutcome: 'Cartilage volume by MRI at 12 months', secondaryOutcomes: ['KOOS scores', 'Return to sports'], estimatedEnrollment: 40, startDate: '2025-09-01', estimatedCompletionDate: '2028-09-01', sites: [{ name: 'Regenerative Center', city: 'San Francisco', state: 'CA', zipCode: '94143', country: 'US', latitude: 37.7749, longitude: -122.4194, isRecruiting: true }], minAge: 25, maxAge: 55, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000029', title: 'Blood Glucose Target in Post-Cardiac Surgery ICU', briefSummary: 'Strict versus moderate glucose control in cardiac surgery ICU patients.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Cardiac ICU Research Network', conditions: ['Cardiac surgery', 'Glucose management', 'ICU'], interventions: [{ type: 'Drug', name: 'Strict Glucose Protocol', description: 'Target 80-110 mg/dL versus 140-180 mg/dL' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 40-80', parameter: 'age', operator: 'between', value: [40, 80], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Post-cardiac surgery', parameter: 'procedures', operator: 'in', value: ['CABG', 'valve replacement', 'cardiac surgery'], required: true }], exclusionCriteria: [], primaryOutcome: 'Composite of death/MI/stroke/renal failure at 30 days', secondaryOutcomes: ['Hypoglycemic events', 'SSI rate', 'ICU length of stay'], estimatedEnrollment: 400, startDate: '2025-01-15', estimatedCompletionDate: '2028-01-15', sites: [{ name: 'Cardiac ICU', city: 'New York', state: 'NY', zipCode: '10032', country: 'US', latitude: 40.8448, longitude: -73.9425, isRecruiting: true }], minAge: 40, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000030', title: 'Mobile Health App for Post-Discharge Medication Adherence', briefSummary: 'Evaluating a mobile app with reminders and education for post-surgical medication adherence.', phase: TrialPhase.NOT_APPLICABLE, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'mHealth Research Group', conditions: ['Medication adherence', 'Post-discharge care'], interventions: [{ type: 'Behavioral', name: 'MedAdhere App', description: 'Smartphone app with medication reminders, education, and tracking' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-80', parameter: 'age', operator: 'between', value: [18, 80], required: true }], exclusionCriteria: [], primaryOutcome: 'Medication adherence rate at 30 days', secondaryOutcomes: ['30-day readmission', 'Patient engagement'], estimatedEnrollment: 300, startDate: '2025-02-01', estimatedCompletionDate: '2026-08-01', sites: [{ name: 'Digital Health Lab', city: 'Seattle', state: 'WA', zipCode: '98109', country: 'US', latitude: 47.6062, longitude: -122.3321, isRecruiting: true }], minAge: 18, maxAge: 80, gender: 'all', healthyVolunteers: false },
  // Trials 31-40
  { nctId: 'NCT05000031', title: 'IV Acetaminophen vs Oral for Postoperative Pain', briefSummary: 'IV versus oral acetaminophen in the immediate postoperative period.', phase: TrialPhase.PHASE_IV, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Pharmacotherapy Research Group', conditions: ['Postoperative pain'], interventions: [{ type: 'Drug', name: 'IV Acetaminophen', description: '1g IV acetaminophen versus 1g oral' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-75', parameter: 'age', operator: 'between', value: [18, 75], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No liver disease', parameter: 'comorbidities', operator: 'not_in', value: ['cirrhosis', 'hepatitis', 'liver failure'], required: true }], primaryOutcome: 'Pain scores at 4 hours', secondaryOutcomes: ['Opioid consumption', 'Time to first opioid'], estimatedEnrollment: 200, startDate: '2025-04-01', estimatedCompletionDate: '2026-10-01', sites: [{ name: 'Research Hospital', city: 'St. Louis', state: 'MO', zipCode: '63110', country: 'US', latitude: 38.627, longitude: -90.1994, isRecruiting: true }], minAge: 18, maxAge: 75, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000032', title: 'Sleep Quality Optimization After Surgery', briefSummary: 'Melatonin plus sleep hygiene protocol for improving postoperative sleep.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Sleep Medicine Society', conditions: ['Postoperative insomnia', 'Sleep disruption'], interventions: [{ type: 'Drug', name: 'Sleep Protocol', description: 'Melatonin 3mg plus structured sleep hygiene protocol' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 30-75', parameter: 'age', operator: 'between', value: [30, 75], required: true }], exclusionCriteria: [], primaryOutcome: 'Pittsburgh Sleep Quality Index at 2 weeks', secondaryOutcomes: ['Delirium incidence', 'Pain scores', 'Length of stay'], estimatedEnrollment: 180, startDate: '2025-05-01', estimatedCompletionDate: '2027-05-01', sites: [{ name: 'Sleep Lab', city: 'Detroit', state: 'MI', zipCode: '48201', country: 'US', latitude: 42.3314, longitude: -83.0458, isRecruiting: true }], minAge: 30, maxAge: 75, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000033', title: 'Bioabsorbable Suture vs Staples for Skin Closure', briefSummary: 'Comparing bioabsorbable subcuticular suture to metal staples for surgical skin closure.', phase: TrialPhase.PHASE_IV, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Surgical Techniques Institute', conditions: ['Wound closure', 'Surgical technique'], interventions: [{ type: 'Device', name: 'Bioabsorbable Suture', description: 'Monofilament bioabsorbable subcuticular suture' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-80', parameter: 'age', operator: 'between', value: [18, 80], required: true }], exclusionCriteria: [], primaryOutcome: 'Cosmetic outcome at 6 months (POSAS)', secondaryOutcomes: ['SSI rate', 'Patient satisfaction'], estimatedEnrollment: 400, startDate: '2025-03-01', estimatedCompletionDate: '2026-09-01', sites: [{ name: 'Plastic Surgery Center', city: 'Miami', state: 'FL', zipCode: '33136', country: 'US', latitude: 25.7617, longitude: -80.1918, isRecruiting: true }], minAge: 18, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000034', title: 'Preoperative Iron Infusion for Anemic Surgical Patients', briefSummary: 'IV iron supplementation before surgery in patients with iron deficiency anemia.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Blood Management Society', conditions: ['Iron deficiency anemia', 'Preoperative optimization'], interventions: [{ type: 'Drug', name: 'IV Iron', description: 'Ferric carboxymaltose 1000mg single dose' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-80', parameter: 'age', operator: 'between', value: [18, 80], required: true }, { type: CriterionType.LAB_VALUE, isInclusion: true, description: 'Hemoglobin 8-12 g/dL', parameter: 'hemoglobin', operator: 'between', value: [8, 12], required: true }], exclusionCriteria: [], primaryOutcome: 'Transfusion rate', secondaryOutcomes: ['Hemoglobin at discharge', 'Length of stay', 'Complication rate'], estimatedEnrollment: 250, startDate: '2025-02-01', estimatedCompletionDate: '2027-08-01', sites: [{ name: 'Blood Management Center', city: 'Denver', state: 'CO', zipCode: '80218', country: 'US', latitude: 39.7392, longitude: -104.9903, isRecruiting: true }], minAge: 18, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000035', title: 'Chlorhexidine vs Povidone-Iodine Surgical Skin Preparation', briefSummary: 'Comparing SSI rates with chlorhexidine-alcohol versus povidone-iodine skin preparation.', phase: TrialPhase.PHASE_IV, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Infection Prevention Alliance', conditions: ['SSI prevention', 'Skin antisepsis'], interventions: [{ type: 'Drug', name: 'Chlorhexidine-Alcohol', description: '2% chlorhexidine in 70% isopropyl alcohol' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-90', parameter: 'age', operator: 'between', value: [18, 90], required: true }], exclusionCriteria: [{ type: CriterionType.ALLERGY, isInclusion: false, description: 'No chlorhexidine allergy', parameter: 'allergies', operator: 'not_in', value: ['chlorhexidine'], required: true }], primaryOutcome: 'SSI rate at 30 days', secondaryOutcomes: ['Skin reaction rate', 'Cost analysis'], estimatedEnrollment: 1000, startDate: '2025-01-01', estimatedCompletionDate: '2027-01-01', sites: [{ name: 'Multi-site Study', city: 'Multiple', state: 'US', zipCode: '00000', country: 'US', latitude: 39.8283, longitude: -98.5795, isRecruiting: true }], minAge: 18, maxAge: 90, gender: 'all', healthyVolunteers: false },
  // Trials 36-50
  { nctId: 'NCT05000036', title: 'Intraoperative Ultrasound-Guided Nerve Block Training', briefSummary: 'Evaluating simulation-based training for ultrasound-guided nerve blocks.', phase: TrialPhase.NOT_APPLICABLE, category: TrialCategory.OBSERVATIONAL, status: TrialStatus.RECRUITING, sponsor: 'Medical Education Research', conditions: ['Medical education', 'Nerve block training'], interventions: [{ type: 'Other', name: 'Simulation Training', description: 'High-fidelity simulation for nerve block techniques' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 25-65', parameter: 'age', operator: 'between', value: [25, 65], required: true }], exclusionCriteria: [], primaryOutcome: 'Technical proficiency scores', secondaryOutcomes: ['Confidence ratings', 'Knowledge retention'], estimatedEnrollment: 60, startDate: '2025-07-01', estimatedCompletionDate: '2026-07-01', sites: [{ name: 'Simulation Center', city: 'Baltimore', state: 'MD', zipCode: '21205', country: 'US', latitude: 39.2904, longitude: -76.6122, isRecruiting: true }], minAge: 25, maxAge: 65, gender: 'all', healthyVolunteers: true },
  { nctId: 'NCT05000037', title: 'Tranexamic Acid in Total Joint Arthroplasty', briefSummary: 'IV plus topical versus IV only tranexamic acid in total joint replacement.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Joint Replacement Research', conditions: ['Total joint arthroplasty', 'Blood loss management'], interventions: [{ type: 'Drug', name: 'Combined TXA', description: 'IV + topical tranexamic acid' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 45-85', parameter: 'age', operator: 'between', value: [45, 85], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'TKA or THA', parameter: 'procedures', operator: 'in', value: ['Total knee arthroplasty', 'Total hip arthroplasty', 'TKA', 'THA'], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No history of VTE', parameter: 'comorbidities', operator: 'not_in', value: ['DVT', 'PE', 'pulmonary embolism'], required: true }], primaryOutcome: 'Total blood loss', secondaryOutcomes: ['Transfusion rate', 'Hemoglobin drop'], estimatedEnrollment: 300, startDate: '2025-04-01', estimatedCompletionDate: '2027-04-01', sites: [{ name: 'Joint Center', city: 'Indianapolis', state: 'IN', zipCode: '46202', country: 'US', latitude: 39.7684, longitude: -86.1581, isRecruiting: true }], minAge: 45, maxAge: 85, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000038', title: 'Observational Study of Long-Term Outcomes After Bariatric Surgery', briefSummary: 'Prospective registry of 10-year outcomes after various bariatric procedures.', phase: TrialPhase.NOT_APPLICABLE, category: TrialCategory.OBSERVATIONAL, status: TrialStatus.RECRUITING, sponsor: 'Obesity Research Alliance', conditions: ['Obesity', 'Bariatric surgery outcomes'], interventions: [{ type: 'Other', name: 'Registry', description: 'Prospective data collection' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-65', parameter: 'age', operator: 'between', value: [18, 65], required: true }, { type: CriterionType.BMI, isInclusion: true, description: 'BMI >= 35', parameter: 'bmi', operator: 'gte', value: 35, required: true }], exclusionCriteria: [], primaryOutcome: 'Weight loss maintenance at 10 years', secondaryOutcomes: ['Diabetes remission', 'Cardiovascular events', 'Mortality'], estimatedEnrollment: 2000, startDate: '2025-01-01', estimatedCompletionDate: '2035-01-01', sites: [{ name: 'Weight Management Center', city: 'Columbus', state: 'OH', zipCode: '43210', country: 'US', latitude: 39.9612, longitude: -82.9988, isRecruiting: true }], minAge: 18, maxAge: 65, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000039', title: 'Cryotherapy for Pain After Knee Arthroscopy', briefSummary: 'Continuous cryotherapy versus ice packs after knee arthroscopy.', phase: TrialPhase.PHASE_III, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Sports Recovery Research', conditions: ['Knee arthroscopy', 'Post-surgical pain'], interventions: [{ type: 'Device', name: 'Continuous Cryotherapy', description: 'Motorized continuous cold therapy device' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-60', parameter: 'age', operator: 'between', value: [18, 60], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Knee arthroscopy', parameter: 'procedures', operator: 'in', value: ['knee arthroscopy', 'ACL reconstruction', 'meniscus repair'], required: true }], exclusionCriteria: [], primaryOutcome: 'Pain scores at 48 hours', secondaryOutcomes: ['Swelling measurement', 'Range of motion', 'Return to function'], estimatedEnrollment: 100, startDate: '2025-06-01', estimatedCompletionDate: '2026-12-01', sites: [{ name: 'Sports Med Clinic', city: 'Salt Lake City', state: 'UT', zipCode: '84112', country: 'US', latitude: 40.7608, longitude: -111.891, isRecruiting: true }], minAge: 18, maxAge: 60, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000040', title: 'Perioperative Goal-Directed Fluid Therapy', briefSummary: 'Goal-directed versus liberal fluid therapy during major abdominal surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Fluid Management Research', conditions: ['Intraoperative fluid management', 'Abdominal surgery'], interventions: [{ type: 'Drug', name: 'Goal-Directed Fluids', description: 'Stroke volume variation-guided fluid administration' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 40-80', parameter: 'age', operator: 'between', value: [40, 80], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No severe heart failure', parameter: 'comorbidities', operator: 'not_in', value: ['heart failure NYHA III', 'heart failure NYHA IV'], required: true }], primaryOutcome: 'Postoperative complications (Clavien-Dindo)', secondaryOutcomes: ['Length of stay', 'Kidney injury', 'Pulmonary complications'], estimatedEnrollment: 300, startDate: '2025-03-01', estimatedCompletionDate: '2027-09-01', sites: [{ name: 'Surgery Research Unit', city: 'Washington', state: 'DC', zipCode: '20007', country: 'US', latitude: 38.9072, longitude: -77.0369, isRecruiting: true }], minAge: 40, maxAge: 80, gender: 'all', healthyVolunteers: false },
  // Remaining 10 trials (41-50) with minimal criteria for brevity
  { nctId: 'NCT05000041', title: 'Gabapentin Premedication for Postoperative Pain', briefSummary: 'Single preoperative gabapentin dose for multimodal analgesia.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Analgesia Research', conditions: ['Postoperative pain'], interventions: [{ type: 'Drug', name: 'Gabapentin', description: '600mg gabapentin 2h before surgery' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-70', parameter: 'age', operator: 'between', value: [18, 70], required: true }], exclusionCriteria: [], primaryOutcome: 'Opioid consumption at 24h', secondaryOutcomes: ['Pain scores', 'PONV'], estimatedEnrollment: 200, startDate: '2025-05-01', estimatedCompletionDate: '2026-11-01', sites: [{ name: 'Research Hospital', city: 'Boston', state: 'MA', zipCode: '02115', country: 'US', latitude: 42.3601, longitude: -71.0589, isRecruiting: true }], minAge: 18, maxAge: 70, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000042', title: 'Dexmedetomidine for Delirium Prevention in Elderly Surgery', briefSummary: 'Low-dose dexmedetomidine infusion for ICU delirium prevention in elderly patients.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Geriatric Surgery Research', conditions: ['Delirium prevention', 'Elderly surgery'], interventions: [{ type: 'Drug', name: 'Dexmedetomidine', description: 'Low-dose nocturnal dexmedetomidine infusion' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 65-90', parameter: 'age', operator: 'between', value: [65, 90], required: true }], exclusionCriteria: [], primaryOutcome: 'Delirium incidence (CAM-ICU)', secondaryOutcomes: ['Duration of delirium', 'ICU length of stay'], estimatedEnrollment: 250, startDate: '2025-02-01', estimatedCompletionDate: '2027-02-01', sites: [{ name: 'Geriatric Surgery Unit', city: 'New Haven', state: 'CT', zipCode: '06510', country: 'US', latitude: 41.3083, longitude: -72.9279, isRecruiting: true }], minAge: 65, maxAge: 90, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000043', title: 'Antibiotic-Loaded Cement in Joint Replacement', briefSummary: 'Antibiotic cement versus plain cement in total joint arthroplasty.', phase: TrialPhase.PHASE_IV, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Joint Infection Prevention', conditions: ['Joint replacement', 'Periprosthetic infection'], interventions: [{ type: 'Device', name: 'Antibiotic Cement', description: 'Gentamicin-loaded bone cement' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 50-85', parameter: 'age', operator: 'between', value: [50, 85], required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'TKA or THA', parameter: 'procedures', operator: 'in', value: ['Total knee arthroplasty', 'Total hip arthroplasty'], required: true }], exclusionCriteria: [], primaryOutcome: 'Periprosthetic infection at 2 years', secondaryOutcomes: ['Aseptic loosening', 'Revision rate'], estimatedEnrollment: 800, startDate: '2025-01-01', estimatedCompletionDate: '2029-01-01', sites: [{ name: 'Joint Replacement Center', city: 'Memphis', state: 'TN', zipCode: '38103', country: 'US', latitude: 35.1495, longitude: -90.049, isRecruiting: true }], minAge: 50, maxAge: 85, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000044', title: 'Smartphone-Based Gait Analysis After Lower Extremity Surgery', briefSummary: 'Validating smartphone accelerometer-based gait analysis for monitoring recovery.', phase: TrialPhase.NOT_APPLICABLE, category: TrialCategory.DIAGNOSTIC, status: TrialStatus.RECRUITING, sponsor: 'Digital Orthopedics Group', conditions: ['Gait analysis', 'Lower extremity surgery'], interventions: [{ type: 'Diagnostic', name: 'GaitApp', description: 'Smartphone gait analysis application' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-75', parameter: 'age', operator: 'between', value: [18, 75], required: true }], exclusionCriteria: [], primaryOutcome: 'Correlation with lab-based gait analysis', secondaryOutcomes: ['Patient compliance', 'Clinical utility'], estimatedEnrollment: 150, startDate: '2025-08-01', estimatedCompletionDate: '2027-02-01', sites: [{ name: 'Motion Analysis Lab', city: 'Rochester', state: 'MN', zipCode: '55905', country: 'US', latitude: 44.0121, longitude: -92.4802, isRecruiting: true }], minAge: 18, maxAge: 75, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000045', title: 'Enhanced Recovery Protocol for Mastectomy', briefSummary: 'ERAS protocol adapted specifically for mastectomy patients.', phase: TrialPhase.PHASE_III, category: TrialCategory.BEHAVIORAL, status: TrialStatus.RECRUITING, sponsor: 'Breast Surgery Research Group', conditions: ['Mastectomy', 'Breast cancer surgery'], interventions: [{ type: 'Behavioral', name: 'ERAS-Mastectomy', description: 'Comprehensive enhanced recovery protocol' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 25-75', parameter: 'age', operator: 'between', value: [25, 75], required: true }, { type: CriterionType.GENDER, isInclusion: true, description: 'Female', parameter: 'gender', operator: 'eq', value: 'female', required: true }, { type: CriterionType.PROCEDURE_HISTORY, isInclusion: true, description: 'Scheduled for mastectomy', parameter: 'procedures', operator: 'in', value: ['mastectomy', 'simple mastectomy', 'modified radical mastectomy'], required: true }], exclusionCriteria: [], primaryOutcome: 'Length of stay', secondaryOutcomes: ['Pain scores', 'Readmission rate', 'Drain output'], estimatedEnrollment: 150, startDate: '2025-04-01', estimatedCompletionDate: '2027-04-01', sites: [{ name: 'Breast Center', city: 'Houston', state: 'TX', zipCode: '77030', country: 'US', latitude: 29.7604, longitude: -95.3698, isRecruiting: true }], minAge: 25, maxAge: 75, gender: 'female', healthyVolunteers: false },
  { nctId: 'NCT05000046', title: 'Lidocaine Infusion for Postoperative Bowel Recovery', briefSummary: 'Systemic lidocaine infusion for enhanced bowel recovery after abdominal surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'GI Surgery Research', conditions: ['Ileus', 'Abdominal surgery', 'Bowel recovery'], interventions: [{ type: 'Drug', name: 'IV Lidocaine', description: 'Systemic lidocaine infusion perioperatively' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-75', parameter: 'age', operator: 'between', value: [18, 75], required: true }], exclusionCriteria: [{ type: CriterionType.ALLERGY, isInclusion: false, description: 'No lidocaine allergy', parameter: 'allergies', operator: 'not_in', value: ['lidocaine', 'local anesthetic'], required: true }], primaryOutcome: 'Time to first bowel movement', secondaryOutcomes: ['Time to regular diet', 'Length of stay', 'Ileus incidence'], estimatedEnrollment: 180, startDate: '2025-06-01', estimatedCompletionDate: '2027-06-01', sites: [{ name: 'GI Surgery Center', city: 'Chicago', state: 'IL', zipCode: '60611', country: 'US', latitude: 41.8781, longitude: -87.6298, isRecruiting: true }], minAge: 18, maxAge: 75, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000047', title: 'Prehabilitation for Major Lung Resection', briefSummary: 'Structured exercise and breathing program before lung cancer surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.BEHAVIORAL, status: TrialStatus.NOT_YET_RECRUITING, sponsor: 'Thoracic Surgery Group', conditions: ['Lung cancer', 'Thoracic surgery', 'Prehabilitation'], interventions: [{ type: 'Behavioral', name: 'Pulmonary Prehab', description: '3-week breathing exercises and aerobic training' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 40-80', parameter: 'age', operator: 'between', value: [40, 80], required: true }, { type: CriterionType.DIAGNOSIS, isInclusion: true, description: 'Lung cancer', parameter: 'diagnoses', operator: 'in', value: ['lung cancer', 'NSCLC', 'non-small cell lung cancer'], required: true }], exclusionCriteria: [], primaryOutcome: 'Postoperative pulmonary complications', secondaryOutcomes: ['FEV1 change', '6-minute walk test'], estimatedEnrollment: 120, startDate: '2025-09-01', estimatedCompletionDate: '2028-03-01', sites: [{ name: 'Thoracic Institute', city: 'Salt Lake City', state: 'UT', zipCode: '84112', country: 'US', latitude: 40.7608, longitude: -111.891, isRecruiting: true }], minAge: 40, maxAge: 80, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000048', title: 'Compression Garments After Body Contouring Surgery', briefSummary: 'Custom-fit versus standard compression garments after body contouring.', phase: TrialPhase.PHASE_IV, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Plastic Surgery Foundation', conditions: ['Body contouring', 'Compression therapy'], interventions: [{ type: 'Device', name: 'Custom Compression', description: '3D-printed custom-fit compression garment' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 21-65', parameter: 'age', operator: 'between', value: [21, 65], required: true }], exclusionCriteria: [], primaryOutcome: 'Edema reduction at 4 weeks', secondaryOutcomes: ['Patient comfort', 'Compliance', 'Cosmetic outcome'], estimatedEnrollment: 100, startDate: '2025-05-01', estimatedCompletionDate: '2026-11-01', sites: [{ name: 'Aesthetic Surgery Center', city: 'Beverly Hills', state: 'CA', zipCode: '90210', country: 'US', latitude: 34.0736, longitude: -118.4004, isRecruiting: true }], minAge: 21, maxAge: 65, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000049', title: 'Hemostatic Matrix for Hepatic Surgery Bleeding Control', briefSummary: 'Novel hemostatic matrix versus standard techniques for liver surgery hemostasis.', phase: TrialPhase.PHASE_II, category: TrialCategory.DEVICE, status: TrialStatus.RECRUITING, sponsor: 'Hepatobiliary Research Group', conditions: ['Liver surgery', 'Hemostasis'], interventions: [{ type: 'Device', name: 'HemoMatrix', description: 'Bioactive hemostatic matrix sealant' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 30-75', parameter: 'age', operator: 'between', value: [30, 75], required: true }], exclusionCriteria: [{ type: CriterionType.COMORBIDITY, isInclusion: false, description: 'No coagulopathy', parameter: 'comorbidities', operator: 'not_in', value: ['hemophilia', 'DIC', 'coagulopathy'], required: true }], primaryOutcome: 'Time to hemostasis', secondaryOutcomes: ['Blood loss', 'Transfusion requirements'], estimatedEnrollment: 80, startDate: '2025-07-01', estimatedCompletionDate: '2027-07-01', sites: [{ name: 'Liver Center', city: 'San Francisco', state: 'CA', zipCode: '94143', country: 'US', latitude: 37.7749, longitude: -122.4194, isRecruiting: true }], minAge: 30, maxAge: 75, gender: 'all', healthyVolunteers: false },
  { nctId: 'NCT05000050', title: 'Quadratus Lumborum Block for Renal Surgery Pain', briefSummary: 'Quadratus lumborum block versus TAP block for pain after renal surgery.', phase: TrialPhase.PHASE_III, category: TrialCategory.THERAPEUTIC, status: TrialStatus.RECRUITING, sponsor: 'Regional Anesthesia Society', conditions: ['Renal surgery', 'Regional anesthesia'], interventions: [{ type: 'Procedure', name: 'QL Block', description: 'Ultrasound-guided quadratus lumborum block' }], inclusionCriteria: [{ type: CriterionType.AGE, isInclusion: true, description: 'Age 18-75', parameter: 'age', operator: 'between', value: [18, 75], required: true }], exclusionCriteria: [{ type: CriterionType.ALLERGY, isInclusion: false, description: 'No local anesthetic allergy', parameter: 'allergies', operator: 'not_in', value: ['local anesthetic', 'bupivacaine', 'ropivacaine'], required: true }], primaryOutcome: 'Opioid consumption at 24h', secondaryOutcomes: ['Pain scores', 'Ambulation time'], estimatedEnrollment: 100, startDate: '2025-04-01', estimatedCompletionDate: '2026-10-01', sites: [{ name: 'Urology Center', city: 'Charlotte', state: 'NC', zipCode: '28203', country: 'US', latitude: 35.2271, longitude: -80.8431, isRecruiting: true }], minAge: 18, maxAge: 75, gender: 'all', healthyVolunteers: false },
];

// ============================================================================
// Implementation
// ============================================================================

export function createClinicalTrialMatcher(): ClinicalTrialMatcher {
  const enrollmentOutcomes: EnrollmentOutcome[] = [];
  let learnedThreshold = 0.6;

  function evaluateCriterion(criterion: EligibilityCriterion, profile: PatientProfile): { met: boolean; detail: string } {
    const { type, operator, value, parameter } = criterion;

    switch (type) {
      case CriterionType.AGE: {
        if (operator === 'between' && Array.isArray(value)) {
          const [min, max] = value as [number, number];
          const met = profile.age >= min && profile.age <= max;
          return { met, detail: `Age ${profile.age}: ${met ? 'within' : 'outside'} range ${min}-${max}` };
        }
        if (operator === 'gte') {
          const met = profile.age >= (value as number);
          return { met, detail: `Age ${profile.age} >= ${value}: ${met}` };
        }
        return { met: false, detail: 'Unknown age operator' };
      }

      case CriterionType.GENDER: {
        if (operator === 'eq') {
          const met = profile.gender === value;
          return { met, detail: `Gender ${profile.gender} ${met ? 'matches' : 'does not match'} ${value}` };
        }
        return { met: true, detail: 'All genders accepted' };
      }

      case CriterionType.DIAGNOSIS: {
        if (operator === 'in') {
          const vals = value as string[];
          const met = profile.diagnoses.some(d => vals.some(v => d.toLowerCase().includes(v.toLowerCase())));
          return { met, detail: met ? `Has matching diagnosis` : `No matching diagnosis from: ${vals.join(', ')}` };
        }
        return { met: false, detail: 'Unknown diagnosis operator' };
      }

      case CriterionType.PROCEDURE_HISTORY: {
        if (operator === 'in') {
          const vals = value as string[];
          const met = profile.procedures.some(p => vals.some(v => p.toLowerCase().includes(v.toLowerCase())));
          return { met, detail: met ? `Has matching procedure` : `No matching procedure from: ${vals.join(', ')}` };
        }
        if (operator === 'not_in') {
          const vals = value as string[];
          const met = !profile.procedures.some(p => vals.some(v => p.toLowerCase().includes(v.toLowerCase())));
          return { met, detail: met ? `No excluded procedures` : `Has excluded procedure` };
        }
        if (operator === 'exists') {
          const met = profile.procedures.length > 0;
          return { met, detail: met ? 'Has procedures' : 'No procedures' };
        }
        return { met: false, detail: 'Unknown procedure operator' };
      }

      case CriterionType.LAB_VALUE: {
        const labVal = profile.labValues[parameter];
        if (labVal === undefined) return { met: false, detail: `Lab value ${parameter} not available` };
        if (operator === 'gt') return { met: labVal > (value as number), detail: `${parameter}: ${labVal} > ${value}` };
        if (operator === 'gte') return { met: labVal >= (value as number), detail: `${parameter}: ${labVal} >= ${value}` };
        if (operator === 'lt') return { met: labVal < (value as number), detail: `${parameter}: ${labVal} < ${value}` };
        if (operator === 'lte') return { met: labVal <= (value as number), detail: `${parameter}: ${labVal} <= ${value}` };
        if (operator === 'between' && Array.isArray(value)) {
          const [lo, hi] = value as [number, number];
          const met = labVal >= lo && labVal <= hi;
          return { met, detail: `${parameter}: ${labVal} in [${lo}, ${hi}]` };
        }
        return { met: false, detail: 'Unknown lab operator' };
      }

      case CriterionType.MEDICATION: {
        if (operator === 'not_in') {
          const vals = value as string[];
          const met = !profile.medications.some(m => vals.some(v => m.toLowerCase().includes(v.toLowerCase())));
          return { met, detail: met ? 'Not on excluded medications' : 'On excluded medication' };
        }
        if (operator === 'in') {
          const vals = value as string[];
          const met = profile.medications.some(m => vals.some(v => m.toLowerCase().includes(v.toLowerCase())));
          return { met, detail: met ? 'On required medication' : 'Not on required medication' };
        }
        return { met: false, detail: 'Unknown medication operator' };
      }

      case CriterionType.COMORBIDITY: {
        if (operator === 'not_in') {
          const vals = value as string[];
          const met = !profile.comorbidities.some(c => vals.some(v => c.toLowerCase().includes(v.toLowerCase())));
          return { met, detail: met ? 'No excluded comorbidities' : 'Has excluded comorbidity' };
        }
        return { met: false, detail: 'Unknown comorbidity operator' };
      }

      case CriterionType.BMI: {
        if (profile.bmi === undefined) return { met: false, detail: 'BMI not available' };
        if (operator === 'lt') return { met: profile.bmi < (value as number), detail: `BMI ${profile.bmi} < ${value}` };
        if (operator === 'lte') return { met: profile.bmi <= (value as number), detail: `BMI ${profile.bmi} <= ${value}` };
        if (operator === 'gte') return { met: profile.bmi >= (value as number), detail: `BMI ${profile.bmi} >= ${value}` };
        if (operator === 'gt') return { met: profile.bmi > (value as number), detail: `BMI ${profile.bmi} > ${value}` };
        return { met: false, detail: 'Unknown BMI operator' };
      }

      case CriterionType.TIME_SINCE_SURGERY: {
        if (profile.daysSinceSurgery === undefined) return { met: false, detail: 'Days since surgery not available' };
        if (operator === 'lte') return { met: profile.daysSinceSurgery <= (value as number), detail: `Days since surgery ${profile.daysSinceSurgery} <= ${value}` };
        return { met: false, detail: 'Unknown time operator' };
      }

      case CriterionType.SMOKING_STATUS: {
        if (!profile.smokingStatus) return { met: false, detail: 'Smoking status not available' };
        if (operator === 'eq') return { met: profile.smokingStatus === value, detail: `Smoking: ${profile.smokingStatus} == ${value}` };
        if (operator === 'neq') return { met: profile.smokingStatus !== value, detail: `Smoking: ${profile.smokingStatus} != ${value}` };
        return { met: false, detail: 'Unknown smoking operator' };
      }

      case CriterionType.ALLERGY: {
        if (operator === 'not_in') {
          const vals = value as string[];
          const met = !profile.allergies.some(a => vals.some(v => a.toLowerCase().includes(v.toLowerCase())));
          return { met, detail: met ? 'No excluded allergies' : 'Has excluded allergy' };
        }
        return { met: false, detail: 'Unknown allergy operator' };
      }

      case CriterionType.PREGNANCY: {
        if (operator === 'eq') {
          const expected = value === 'false' ? false : true;
          const met = (profile.isPregnant || false) === expected;
          return { met, detail: `Pregnant: ${profile.isPregnant || false}, expected: ${expected}` };
        }
        return { met: false, detail: 'Unknown pregnancy operator' };
      }

      case CriterionType.PERFORMANCE_STATUS: {
        if (profile.performanceStatus === undefined) return { met: false, detail: 'Performance status not available' };
        if (operator === 'lte') return { met: profile.performanceStatus <= (value as number), detail: `ECOG ${profile.performanceStatus} <= ${value}` };
        return { met: false, detail: 'Unknown performance status operator' };
      }

      default:
        return { met: false, detail: `Unsupported criterion type: ${type}` };
    }
  }

  function calculateEligibilityScore(matchedResults: Array<{ criterion: EligibilityCriterion; met: boolean }>): number {
    if (matchedResults.length === 0) return 0;
    const required = matchedResults.filter(r => r.criterion.required);
    const optional = matchedResults.filter(r => !r.criterion.required);

    const requiredMet = required.filter(r => r.met).length;
    const requiredTotal = required.length || 1;
    const optionalMet = optional.filter(r => r.met).length;
    const optionalTotal = optional.length || 1;

    return Math.round(((requiredMet / requiredTotal) * 0.8 + (optionalMet / optionalTotal) * 0.2) * 100) / 100;
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  function findNearestSite(profile: PatientProfile, trial: ClinicalTrial): { site: TrialSite; distanceMiles: number } | null {
    if (!profile.location) return null;
    const recruitingSites = trial.sites.filter(s => s.isRecruiting);
    if (recruitingSites.length === 0) return null;

    let nearest: { site: TrialSite; distanceMiles: number } | null = null;
    for (const site of recruitingSites) {
      const dist = calculateDistance(profile.location.latitude, profile.location.longitude, site.latitude, site.longitude);
      if (!nearest || dist < nearest.distanceMiles) {
        nearest = { site, distanceMiles: dist };
      }
    }
    return nearest;
  }

  function matchPatientToTrial(profile: PatientProfile, trial: ClinicalTrial): MatchResult {
    const allCriteria = [...trial.inclusionCriteria, ...trial.exclusionCriteria];
    const matchedCriteria: Array<{ criterion: EligibilityCriterion; met: boolean; detail: string }> = [];
    const unmatchedCriteria: Array<{ criterion: EligibilityCriterion; reason: string }> = [];

    for (const criterion of allCriteria) {
      const result = evaluateCriterion(criterion, profile);
      if (criterion.isInclusion) {
        matchedCriteria.push({ criterion, met: result.met, detail: result.detail });
        if (!result.met) unmatchedCriteria.push({ criterion, reason: result.detail });
      } else {
        // Exclusion: met=true means the patient IS excluded
        const excluded = result.met;
        matchedCriteria.push({ criterion, met: !excluded, detail: result.detail });
        if (excluded) unmatchedCriteria.push({ criterion, reason: result.detail });
      }
    }

    const score = calculateEligibilityScore(matchedCriteria);
    const hasExclusion = unmatchedCriteria.some(u => !u.criterion.isInclusion);
    const requiredUnmet = unmatchedCriteria.filter(u => u.criterion.isInclusion && u.criterion.required);

    let eligibility: EligibilityResult;
    if (hasExclusion) eligibility = EligibilityResult.EXCLUDED;
    else if (requiredUnmet.length > 0 && score < 0.5) eligibility = EligibilityResult.EXCLUDED;
    else if (score >= learnedThreshold) eligibility = EligibilityResult.ELIGIBLE;
    else if (score >= 0.4) eligibility = EligibilityResult.PARTIALLY_ELIGIBLE;
    else eligibility = EligibilityResult.INSUFFICIENT_DATA;

    const nearestSite = findNearestSite(profile, trial) || undefined;

    let recommendation = '';
    if (eligibility === EligibilityResult.ELIGIBLE) {
      recommendation = `Patient appears eligible for "${trial.title}". ${nearestSite ? `Nearest site: ${nearestSite.site.name} (${nearestSite.distanceMiles} miles)` : ''}`;
    } else if (eligibility === EligibilityResult.PARTIALLY_ELIGIBLE) {
      recommendation = `Patient may be eligible pending: ${unmatchedCriteria.map(u => u.criterion.description).join('; ')}`;
    } else if (eligibility === EligibilityResult.EXCLUDED) {
      recommendation = `Patient is excluded: ${unmatchedCriteria.map(u => u.reason).join('; ')}`;
    } else {
      recommendation = `Insufficient data for eligibility determination. Missing: ${unmatchedCriteria.map(u => u.criterion.description).join('; ')}`;
    }

    return { trial, eligibility, score, matchedCriteria, unmatchedCriteria, nearestSite, recommendation };
  }

  function matchPatient(profile: PatientProfile): MatchResult[] {
    const recruitingTrials = TRIALS_DATABASE.filter(t =>
      t.status === TrialStatus.RECRUITING || t.status === TrialStatus.ENROLLING_BY_INVITATION
    );

    return recruitingTrials
      .map(trial => matchPatientToTrial(profile, trial))
      .sort((a, b) => b.score - a.score);
  }

  function getTrialsByCondition(condition: string): ClinicalTrial[] {
    const lower = condition.toLowerCase();
    return TRIALS_DATABASE.filter(t =>
      t.conditions.some(c => c.toLowerCase().includes(lower))
    );
  }

  function getTrialsByPhase(phase: TrialPhase): ClinicalTrial[] {
    return TRIALS_DATABASE.filter(t => t.phase === phase);
  }

  function getTrialsByCategory(category: TrialCategory): ClinicalTrial[] {
    return TRIALS_DATABASE.filter(t => t.category === category);
  }

  function getRecruitingTrials(): ClinicalTrial[] {
    return TRIALS_DATABASE.filter(t => t.status === TrialStatus.RECRUITING);
  }

  function getAllTrials(): ClinicalTrial[] {
    return [...TRIALS_DATABASE];
  }

  function recordEnrollmentOutcome(outcome: EnrollmentOutcome): void {
    enrollmentOutcomes.push(outcome);

    // Self-learning: adjust match threshold based on outcomes
    if (enrollmentOutcomes.length >= 5) {
      const enrolled = enrollmentOutcomes.filter(o => o.wasEnrolled);
      const notEnrolled = enrollmentOutcomes.filter(o => !o.wasEnrolled);

      if (enrolled.length > 0 && notEnrolled.length > 0) {
        const avgEnrolledScore = enrolled.reduce((s, o) => s + o.matchScore, 0) / enrolled.length;
        const avgNotEnrolledScore = notEnrolled.reduce((s, o) => s + o.matchScore, 0) / notEnrolled.length;
        learnedThreshold = (avgEnrolledScore + avgNotEnrolledScore) / 2;
      }
    }
  }

  function getImprovedMatchThreshold(): number {
    return learnedThreshold;
  }

  return {
    matchPatient,
    matchPatientToTrial,
    evaluateCriterion,
    calculateEligibilityScore,
    calculateDistance,
    findNearestSite,
    getTrialsByCondition,
    getTrialsByPhase,
    getTrialsByCategory,
    getRecruitingTrials,
    getAllTrials,
    recordEnrollmentOutcome,
    getImprovedMatchThreshold,
  };
}
