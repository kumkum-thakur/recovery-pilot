/**
 * Bayesian Naive Bayes Symptom Checker for Post-Operative Patients
 *
 * Implements a naive Bayes classifier to estimate posterior probabilities of
 * post-operative conditions given a set of reported symptoms. Uses Bayes'
 * theorem with conditional independence assumption:
 *
 *   P(condition | symptoms) = P(symptoms | condition) * P(condition) / P(symptoms)
 *
 * With the naive independence assumption this expands to:
 *
 *   P(condition | s1, s2, ..., sN) ∝ P(condition) * ∏ P(si | condition)
 *
 * Features:
 * - 55 symptom definitions with severity levels and body-system classification
 * - 20 post-operative condition definitions with base prevalence rates
 * - Full conditional probability matrix P(symptom | condition) for every pair
 * - Context-aware adjustments for surgery type, days since surgery, and age
 * - Red-flag detection with immediate action recommendations
 * - Intelligent follow-up question generation
 * - Urgency classification (routine / soon / urgent / emergency)
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Types
// ============================================================================

export const Severity = {
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
  CRITICAL: 'critical',
} as const;
export type Severity = typeof Severity[keyof typeof Severity];

export const Urgency = {
  ROUTINE: 'routine',
  SOON: 'soon',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
} as const;
export type Urgency = typeof Urgency[keyof typeof Urgency];

export const BodySystem = {
  WOUND: 'wound',
  CARDIOVASCULAR: 'cardiovascular',
  RESPIRATORY: 'respiratory',
  GASTROINTESTINAL: 'gastrointestinal',
  URINARY: 'urinary',
  NEUROLOGICAL: 'neurological',
  MUSCULOSKELETAL: 'musculoskeletal',
  PSYCHOLOGICAL: 'psychological',
  SYSTEMIC: 'systemic',
  HEMATOLOGIC: 'hematologic',
} as const;
export type BodySystem = typeof BodySystem[keyof typeof BodySystem];

export interface SymptomDefinition {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  bodySystem: BodySystem;
  /** Whether this symptom alone should trigger a red-flag alert */
  isRedFlag: boolean;
}

export interface ConditionDefinition {
  id: string;
  name: string;
  description: string;
  /** Base prevalence rate among post-operative patients (0-1) */
  basePrior: number;
  /** Default urgency when this condition is suspected */
  defaultUrgency: Urgency;
  /** ICD-10 code for reference */
  icd10: string;
}

export interface AnalysisContext {
  surgeryType: string;
  daysSinceSurgery: number;
  age: number;
}

export interface ConditionResult {
  name: string;
  probability: number;
  urgency: string;
}

export interface AnalysisResult {
  conditions: ConditionResult[];
  redFlags: string[];
  recommendedAction: string;
}

export interface RedFlagResult {
  flag: string;
  action: string;
}

// ============================================================================
// SYMPTOM_DATABASE — 55 symptoms
// ============================================================================

export const SYMPTOM_DATABASE: SymptomDefinition[] = [
  // --- Systemic ---
  { id: 'fever', name: 'Fever', description: 'Body temperature >= 38.0 °C / 100.4 °F', severity: Severity.MODERATE, bodySystem: BodySystem.SYSTEMIC, isRedFlag: false },
  { id: 'high_fever', name: 'High Fever', description: 'Body temperature >= 39.5 °C / 103.1 °F', severity: Severity.SEVERE, bodySystem: BodySystem.SYSTEMIC, isRedFlag: true },
  { id: 'chills', name: 'Chills', description: 'Uncontrollable shaking or shivering', severity: Severity.MODERATE, bodySystem: BodySystem.SYSTEMIC, isRedFlag: false },
  { id: 'night_sweats', name: 'Night Sweats', description: 'Excessive sweating during sleep', severity: Severity.MILD, bodySystem: BodySystem.SYSTEMIC, isRedFlag: false },
  { id: 'fatigue', name: 'Fatigue', description: 'Persistent tiredness not relieved by rest', severity: Severity.MILD, bodySystem: BodySystem.SYSTEMIC, isRedFlag: false },
  { id: 'malaise', name: 'Malaise', description: 'General feeling of being unwell', severity: Severity.MILD, bodySystem: BodySystem.SYSTEMIC, isRedFlag: false },
  { id: 'dehydration_signs', name: 'Dehydration Signs', description: 'Dry mouth, dark urine, decreased urine output', severity: Severity.MODERATE, bodySystem: BodySystem.SYSTEMIC, isRedFlag: false },
  { id: 'reduced_appetite', name: 'Reduced Appetite', description: 'Significantly decreased desire to eat', severity: Severity.MILD, bodySystem: BodySystem.SYSTEMIC, isRedFlag: false },
  { id: 'weight_loss', name: 'Unexpected Weight Loss', description: 'Unintentional weight loss > 2 kg in a week', severity: Severity.MODERATE, bodySystem: BodySystem.SYSTEMIC, isRedFlag: false },

  // --- Wound ---
  { id: 'wound_redness', name: 'Wound Redness', description: 'Erythema extending > 2 cm from incision', severity: Severity.MODERATE, bodySystem: BodySystem.WOUND, isRedFlag: false },
  { id: 'wound_swelling', name: 'Wound Swelling', description: 'Noticeable swelling around the surgical site', severity: Severity.MODERATE, bodySystem: BodySystem.WOUND, isRedFlag: false },
  { id: 'wound_drainage', name: 'Wound Drainage', description: 'Purulent or foul-smelling drainage from incision', severity: Severity.SEVERE, bodySystem: BodySystem.WOUND, isRedFlag: true },
  { id: 'wound_warmth', name: 'Wound Warmth', description: 'Increased temperature at surgical site', severity: Severity.MODERATE, bodySystem: BodySystem.WOUND, isRedFlag: false },
  { id: 'wound_dehiscence_sign', name: 'Wound Opening', description: 'Incision edges separating or opening', severity: Severity.SEVERE, bodySystem: BodySystem.WOUND, isRedFlag: true },
  { id: 'wound_odor', name: 'Wound Odor', description: 'Foul smell from the surgical site', severity: Severity.SEVERE, bodySystem: BodySystem.WOUND, isRedFlag: true },
  { id: 'increased_pain', name: 'Increased Pain', description: 'Pain worsening beyond expected post-op trajectory', severity: Severity.MODERATE, bodySystem: BodySystem.WOUND, isRedFlag: false },
  { id: 'increased_pain_severe', name: 'Severe Increasing Pain', description: 'Sudden severe pain at or near surgical site', severity: Severity.SEVERE, bodySystem: BodySystem.WOUND, isRedFlag: true },

  // --- Hematologic ---
  { id: 'bleeding', name: 'Bleeding', description: 'Active bleeding from surgical site or drain', severity: Severity.SEVERE, bodySystem: BodySystem.HEMATOLOGIC, isRedFlag: true },
  { id: 'bruising_excessive', name: 'Excessive Bruising', description: 'Bruising spreading well beyond surgical site', severity: Severity.MODERATE, bodySystem: BodySystem.HEMATOLOGIC, isRedFlag: false },
  { id: 'pallor', name: 'Pallor', description: 'Unusually pale skin, lips, or nail beds', severity: Severity.MODERATE, bodySystem: BodySystem.HEMATOLOGIC, isRedFlag: false },

  // --- Cardiovascular ---
  { id: 'chest_pain', name: 'Chest Pain', description: 'Pain, pressure, or tightness in the chest', severity: Severity.CRITICAL, bodySystem: BodySystem.CARDIOVASCULAR, isRedFlag: true },
  { id: 'rapid_heartbeat', name: 'Rapid Heartbeat', description: 'Heart rate > 100 bpm at rest (tachycardia)', severity: Severity.MODERATE, bodySystem: BodySystem.CARDIOVASCULAR, isRedFlag: false },
  { id: 'leg_swelling', name: 'Leg Swelling', description: 'Unilateral swelling of a lower extremity', severity: Severity.SEVERE, bodySystem: BodySystem.CARDIOVASCULAR, isRedFlag: true },
  { id: 'calf_pain', name: 'Calf Pain', description: 'Pain or tenderness in the calf, especially with dorsiflexion', severity: Severity.SEVERE, bodySystem: BodySystem.CARDIOVASCULAR, isRedFlag: true },
  { id: 'leg_warmth', name: 'Leg Warmth', description: 'One leg feels warmer than the other', severity: Severity.MODERATE, bodySystem: BodySystem.CARDIOVASCULAR, isRedFlag: false },
  { id: 'leg_redness', name: 'Leg Redness', description: 'Redness along the calf or thigh', severity: Severity.MODERATE, bodySystem: BodySystem.CARDIOVASCULAR, isRedFlag: false },
  { id: 'hypotension_signs', name: 'Hypotension Signs', description: 'Lightheadedness on standing, low blood pressure', severity: Severity.MODERATE, bodySystem: BodySystem.CARDIOVASCULAR, isRedFlag: false },

  // --- Respiratory ---
  { id: 'shortness_of_breath', name: 'Shortness of Breath', description: 'Dyspnea at rest or with minimal exertion', severity: Severity.SEVERE, bodySystem: BodySystem.RESPIRATORY, isRedFlag: true },
  { id: 'cough', name: 'Cough', description: 'New or worsening cough', severity: Severity.MILD, bodySystem: BodySystem.RESPIRATORY, isRedFlag: false },
  { id: 'cough_productive', name: 'Productive Cough', description: 'Cough producing sputum, especially colored', severity: Severity.MODERATE, bodySystem: BodySystem.RESPIRATORY, isRedFlag: false },
  { id: 'wheezing', name: 'Wheezing', description: 'Audible high-pitched breathing sounds', severity: Severity.MODERATE, bodySystem: BodySystem.RESPIRATORY, isRedFlag: false },
  { id: 'low_oxygen', name: 'Low Oxygen Saturation', description: 'SpO2 reading below 94%', severity: Severity.CRITICAL, bodySystem: BodySystem.RESPIRATORY, isRedFlag: true },
  { id: 'pleuritic_chest_pain', name: 'Pleuritic Chest Pain', description: 'Sharp chest pain worsening with deep breaths', severity: Severity.SEVERE, bodySystem: BodySystem.RESPIRATORY, isRedFlag: true },

  // --- Gastrointestinal ---
  { id: 'nausea', name: 'Nausea', description: 'Feeling of sickness with inclination to vomit', severity: Severity.MILD, bodySystem: BodySystem.GASTROINTESTINAL, isRedFlag: false },
  { id: 'vomiting', name: 'Vomiting', description: 'Active emesis', severity: Severity.MODERATE, bodySystem: BodySystem.GASTROINTESTINAL, isRedFlag: false },
  { id: 'vomiting_persistent', name: 'Persistent Vomiting', description: 'Unable to keep fluids down for > 12 hours', severity: Severity.SEVERE, bodySystem: BodySystem.GASTROINTESTINAL, isRedFlag: true },
  { id: 'abdominal_distension', name: 'Abdominal Distension', description: 'Abdomen visibly swollen or bloated', severity: Severity.MODERATE, bodySystem: BodySystem.GASTROINTESTINAL, isRedFlag: false },
  { id: 'constipation', name: 'Constipation', description: 'No bowel movement for 3+ days post-operatively', severity: Severity.MILD, bodySystem: BodySystem.GASTROINTESTINAL, isRedFlag: false },
  { id: 'diarrhea', name: 'Diarrhea', description: 'Frequent loose or watery stools', severity: Severity.MILD, bodySystem: BodySystem.GASTROINTESTINAL, isRedFlag: false },
  { id: 'absent_bowel_sounds', name: 'Absent Bowel Sounds', description: 'No audible intestinal activity', severity: Severity.SEVERE, bodySystem: BodySystem.GASTROINTESTINAL, isRedFlag: true },

  // --- Urinary ---
  { id: 'urinary_retention', name: 'Urinary Retention', description: 'Inability to void for >= 8 hours post-op', severity: Severity.MODERATE, bodySystem: BodySystem.URINARY, isRedFlag: false },
  { id: 'dysuria', name: 'Dysuria', description: 'Painful or burning urination', severity: Severity.MILD, bodySystem: BodySystem.URINARY, isRedFlag: false },
  { id: 'urinary_frequency', name: 'Urinary Frequency', description: 'Abnormally frequent urination', severity: Severity.MILD, bodySystem: BodySystem.URINARY, isRedFlag: false },
  { id: 'hematuria', name: 'Blood in Urine', description: 'Visible blood in the urine', severity: Severity.MODERATE, bodySystem: BodySystem.URINARY, isRedFlag: false },
  { id: 'cloudy_urine', name: 'Cloudy Urine', description: 'Urine appears cloudy or has a strong odor', severity: Severity.MILD, bodySystem: BodySystem.URINARY, isRedFlag: false },

  // --- Neurological ---
  { id: 'dizziness', name: 'Dizziness', description: 'Feeling lightheaded or unsteady', severity: Severity.MILD, bodySystem: BodySystem.NEUROLOGICAL, isRedFlag: false },
  { id: 'confusion', name: 'Confusion', description: 'Altered mental status, disorientation', severity: Severity.SEVERE, bodySystem: BodySystem.NEUROLOGICAL, isRedFlag: true },
  { id: 'numbness', name: 'Numbness', description: 'Loss of sensation in extremity or near surgical site', severity: Severity.MODERATE, bodySystem: BodySystem.NEUROLOGICAL, isRedFlag: false },
  { id: 'tingling', name: 'Tingling', description: 'Pins-and-needles sensation', severity: Severity.MILD, bodySystem: BodySystem.NEUROLOGICAL, isRedFlag: false },
  { id: 'difficulty_walking', name: 'Difficulty Walking', description: 'New or worsening gait instability', severity: Severity.MODERATE, bodySystem: BodySystem.NEUROLOGICAL, isRedFlag: false },
  { id: 'headache', name: 'Headache', description: 'New or persistent headache post-operatively', severity: Severity.MILD, bodySystem: BodySystem.NEUROLOGICAL, isRedFlag: false },

  // --- Musculoskeletal ---
  { id: 'joint_stiffness', name: 'Joint Stiffness', description: 'Stiffness or reduced range of motion', severity: Severity.MILD, bodySystem: BodySystem.MUSCULOSKELETAL, isRedFlag: false },
  { id: 'muscle_weakness', name: 'Muscle Weakness', description: 'Noticeable decrease in strength', severity: Severity.MODERATE, bodySystem: BodySystem.MUSCULOSKELETAL, isRedFlag: false },

  // --- Psychological ---
  { id: 'insomnia', name: 'Insomnia', description: 'Difficulty falling or staying asleep', severity: Severity.MILD, bodySystem: BodySystem.PSYCHOLOGICAL, isRedFlag: false },
  { id: 'anxiety', name: 'Anxiety', description: 'Persistent worry, nervousness, or panic', severity: Severity.MODERATE, bodySystem: BodySystem.PSYCHOLOGICAL, isRedFlag: false },
  { id: 'depression', name: 'Depression', description: 'Persistent sadness, hopelessness, or loss of interest', severity: Severity.MODERATE, bodySystem: BodySystem.PSYCHOLOGICAL, isRedFlag: false },
];

// Build a fast lookup map: symptomId -> SymptomDefinition
const symptomMap: Map<string, SymptomDefinition> = new Map(
  SYMPTOM_DATABASE.map((s) => [s.id, s]),
);

// ============================================================================
// CONDITION_DATABASE — 20 conditions
// ============================================================================

export const CONDITION_DATABASE: ConditionDefinition[] = [
  {
    id: 'surgical_site_infection',
    name: 'Surgical Site Infection (SSI)',
    description: 'Infection at the incision or in the tissue/organ manipulated during surgery',
    basePrior: 0.03,
    defaultUrgency: Urgency.URGENT,
    icd10: 'T81.4',
  },
  {
    id: 'dvt',
    name: 'Deep Vein Thrombosis (DVT)',
    description: 'Blood clot forming in a deep vein, usually in the leg',
    basePrior: 0.015,
    defaultUrgency: Urgency.URGENT,
    icd10: 'I82.40',
  },
  {
    id: 'pulmonary_embolism',
    name: 'Pulmonary Embolism (PE)',
    description: 'Blood clot lodged in the pulmonary arteries',
    basePrior: 0.008,
    defaultUrgency: Urgency.EMERGENCY,
    icd10: 'I26.99',
  },
  {
    id: 'pneumonia',
    name: 'Pneumonia',
    description: 'Post-operative pulmonary infection',
    basePrior: 0.02,
    defaultUrgency: Urgency.URGENT,
    icd10: 'J18.9',
  },
  {
    id: 'urinary_tract_infection',
    name: 'Urinary Tract Infection (UTI)',
    description: 'Infection of the bladder or urinary tract, often catheter-associated',
    basePrior: 0.025,
    defaultUrgency: Urgency.SOON,
    icd10: 'N39.0',
  },
  {
    id: 'ileus',
    name: 'Paralytic Ileus',
    description: 'Temporary paralysis of intestinal motility after surgery',
    basePrior: 0.04,
    defaultUrgency: Urgency.URGENT,
    icd10: 'K56.0',
  },
  {
    id: 'wound_dehiscence',
    name: 'Wound Dehiscence',
    description: 'Partial or complete reopening of a surgical incision',
    basePrior: 0.012,
    defaultUrgency: Urgency.URGENT,
    icd10: 'T81.31',
  },
  {
    id: 'seroma',
    name: 'Seroma',
    description: 'Accumulation of serous fluid under the skin near the surgical site',
    basePrior: 0.035,
    defaultUrgency: Urgency.SOON,
    icd10: 'T81.89',
  },
  {
    id: 'hematoma',
    name: 'Hematoma',
    description: 'Localized collection of blood outside blood vessels near the surgical site',
    basePrior: 0.025,
    defaultUrgency: Urgency.SOON,
    icd10: 'T81.0',
  },
  {
    id: 'allergic_reaction',
    name: 'Allergic Reaction',
    description: 'Hypersensitivity reaction to medication or materials',
    basePrior: 0.01,
    defaultUrgency: Urgency.URGENT,
    icd10: 'T88.7',
  },
  {
    id: 'medication_side_effect',
    name: 'Medication Side Effect',
    description: 'Adverse effect from prescribed post-operative medications',
    basePrior: 0.06,
    defaultUrgency: Urgency.SOON,
    icd10: 'T88.7',
  },
  {
    id: 'dehydration',
    name: 'Dehydration',
    description: 'Insufficient fluid volume from reduced intake or increased losses',
    basePrior: 0.045,
    defaultUrgency: Urgency.SOON,
    icd10: 'E86.0',
  },
  {
    id: 'anemia',
    name: 'Post-operative Anemia',
    description: 'Low hemoglobin from surgical blood loss',
    basePrior: 0.05,
    defaultUrgency: Urgency.SOON,
    icd10: 'D64.9',
  },
  {
    id: 'atelectasis',
    name: 'Atelectasis',
    description: 'Partial lung collapse due to shallow breathing post-operatively',
    basePrior: 0.06,
    defaultUrgency: Urgency.SOON,
    icd10: 'J98.11',
  },
  {
    id: 'constipation_condition',
    name: 'Post-operative Constipation',
    description: 'Difficulty with bowel movements due to opioids, immobility, or anesthesia',
    basePrior: 0.15,
    defaultUrgency: Urgency.ROUTINE,
    icd10: 'K59.0',
  },
  {
    id: 'urinary_retention_condition',
    name: 'Post-operative Urinary Retention',
    description: 'Inability to empty the bladder after surgery, often from anesthesia effects',
    basePrior: 0.05,
    defaultUrgency: Urgency.SOON,
    icd10: 'R33.9',
  },
  {
    id: 'depression_condition',
    name: 'Post-operative Depression',
    description: 'Depressive episode following surgery, often related to reduced mobility',
    basePrior: 0.08,
    defaultUrgency: Urgency.SOON,
    icd10: 'F32.9',
  },
  {
    id: 'anxiety_condition',
    name: 'Post-operative Anxiety',
    description: 'Anxiety disorder onset or worsening after surgery',
    basePrior: 0.10,
    defaultUrgency: Urgency.ROUTINE,
    icd10: 'F41.9',
  },
  {
    id: 'nerve_damage',
    name: 'Peripheral Nerve Injury',
    description: 'Damage to peripheral nerves during surgery causing numbness or weakness',
    basePrior: 0.01,
    defaultUrgency: Urgency.SOON,
    icd10: 'G62.9',
  },
  {
    id: 'blood_clot',
    name: 'Superficial Thrombophlebitis',
    description: 'Blood clot in a superficial vein, often at IV site',
    basePrior: 0.02,
    defaultUrgency: Urgency.SOON,
    icd10: 'I80.0',
  },
];

// Build a fast lookup map: conditionId -> ConditionDefinition
const conditionMap: Map<string, ConditionDefinition> = new Map(
  CONDITION_DATABASE.map((c) => [c.id, c]),
);

// ============================================================================
// PROBABILITY_MATRIX — P(symptom | condition)
//
// Each entry is conditionId -> { symptomId -> probability }.
// Values represent the probability that a patient WITH the condition would
// exhibit the given symptom. These are based on clinical literature estimates.
// Symptoms not listed for a condition receive a small default probability.
// ============================================================================

export const PROBABILITY_MATRIX: Record<string, Record<string, number>> = {
  surgical_site_infection: {
    fever: 0.70,
    high_fever: 0.30,
    chills: 0.45,
    night_sweats: 0.25,
    fatigue: 0.50,
    malaise: 0.55,
    reduced_appetite: 0.35,
    wound_redness: 0.85,
    wound_swelling: 0.80,
    wound_drainage: 0.65,
    wound_warmth: 0.80,
    wound_odor: 0.40,
    increased_pain: 0.75,
    increased_pain_severe: 0.25,
    rapid_heartbeat: 0.30,
    nausea: 0.20,
  },

  dvt: {
    leg_swelling: 0.82,
    calf_pain: 0.75,
    leg_warmth: 0.60,
    leg_redness: 0.50,
    increased_pain: 0.55,
    difficulty_walking: 0.40,
    fever: 0.15,
    rapid_heartbeat: 0.20,
    fatigue: 0.20,
  },

  pulmonary_embolism: {
    shortness_of_breath: 0.85,
    chest_pain: 0.65,
    pleuritic_chest_pain: 0.55,
    rapid_heartbeat: 0.70,
    low_oxygen: 0.60,
    cough: 0.30,
    dizziness: 0.35,
    confusion: 0.15,
    anxiety: 0.40,
    leg_swelling: 0.30,
    calf_pain: 0.25,
    fever: 0.15,
    wheezing: 0.10,
    hypotension_signs: 0.25,
  },

  pneumonia: {
    fever: 0.75,
    high_fever: 0.35,
    chills: 0.40,
    cough: 0.80,
    cough_productive: 0.65,
    shortness_of_breath: 0.60,
    chest_pain: 0.25,
    pleuritic_chest_pain: 0.30,
    fatigue: 0.65,
    malaise: 0.55,
    reduced_appetite: 0.45,
    rapid_heartbeat: 0.35,
    low_oxygen: 0.30,
    wheezing: 0.20,
    night_sweats: 0.30,
    confusion: 0.15,
  },

  urinary_tract_infection: {
    dysuria: 0.80,
    urinary_frequency: 0.75,
    cloudy_urine: 0.60,
    hematuria: 0.25,
    fever: 0.45,
    chills: 0.25,
    malaise: 0.30,
    nausea: 0.15,
    reduced_appetite: 0.20,
    confusion: 0.10,
    abdominal_distension: 0.10,
  },

  ileus: {
    abdominal_distension: 0.85,
    nausea: 0.75,
    vomiting: 0.65,
    vomiting_persistent: 0.35,
    constipation: 0.80,
    absent_bowel_sounds: 0.70,
    reduced_appetite: 0.70,
    increased_pain: 0.50,
    fever: 0.15,
    dehydration_signs: 0.35,
  },

  wound_dehiscence: {
    wound_dehiscence_sign: 0.95,
    wound_drainage: 0.60,
    bleeding: 0.45,
    increased_pain: 0.70,
    increased_pain_severe: 0.40,
    wound_redness: 0.40,
    wound_swelling: 0.50,
    fever: 0.25,
    anxiety: 0.35,
  },

  seroma: {
    wound_swelling: 0.85,
    wound_drainage: 0.40,
    increased_pain: 0.35,
    wound_warmth: 0.30,
    wound_redness: 0.25,
    fatigue: 0.10,
  },

  hematoma: {
    bruising_excessive: 0.85,
    wound_swelling: 0.75,
    increased_pain: 0.65,
    increased_pain_severe: 0.30,
    wound_warmth: 0.35,
    wound_redness: 0.30,
    bleeding: 0.25,
    pallor: 0.20,
    dizziness: 0.15,
    hypotension_signs: 0.10,
  },

  allergic_reaction: {
    wound_redness: 0.45,
    wound_swelling: 0.40,
    shortness_of_breath: 0.30,
    wheezing: 0.35,
    nausea: 0.35,
    vomiting: 0.20,
    dizziness: 0.25,
    rapid_heartbeat: 0.30,
    anxiety: 0.25,
    diarrhea: 0.15,
    chest_pain: 0.10,
    hypotension_signs: 0.20,
  },

  medication_side_effect: {
    nausea: 0.60,
    vomiting: 0.35,
    dizziness: 0.45,
    constipation: 0.50,
    diarrhea: 0.25,
    reduced_appetite: 0.40,
    fatigue: 0.45,
    insomnia: 0.30,
    headache: 0.35,
    confusion: 0.10,
    anxiety: 0.15,
    depression: 0.10,
    urinary_retention: 0.15,
    drowsiness: 0.30,
  },

  dehydration: {
    dehydration_signs: 0.90,
    dizziness: 0.65,
    fatigue: 0.60,
    reduced_appetite: 0.50,
    nausea: 0.40,
    headache: 0.45,
    rapid_heartbeat: 0.35,
    hypotension_signs: 0.40,
    confusion: 0.15,
    muscle_weakness: 0.30,
    weight_loss: 0.35,
    malaise: 0.30,
    constipation: 0.25,
  },

  anemia: {
    fatigue: 0.85,
    pallor: 0.70,
    dizziness: 0.55,
    shortness_of_breath: 0.40,
    rapid_heartbeat: 0.50,
    headache: 0.30,
    muscle_weakness: 0.35,
    hypotension_signs: 0.25,
    confusion: 0.10,
    reduced_appetite: 0.25,
    malaise: 0.40,
  },

  atelectasis: {
    shortness_of_breath: 0.55,
    cough: 0.45,
    fever: 0.40,
    low_oxygen: 0.35,
    rapid_heartbeat: 0.25,
    fatigue: 0.30,
    chest_pain: 0.15,
    pleuritic_chest_pain: 0.10,
    wheezing: 0.10,
  },

  constipation_condition: {
    constipation: 0.95,
    abdominal_distension: 0.55,
    nausea: 0.30,
    reduced_appetite: 0.40,
    increased_pain: 0.25,
    vomiting: 0.10,
    malaise: 0.15,
  },

  urinary_retention_condition: {
    urinary_retention: 0.95,
    abdominal_distension: 0.35,
    increased_pain: 0.30,
    anxiety: 0.20,
    nausea: 0.10,
  },

  depression_condition: {
    depression: 0.90,
    insomnia: 0.60,
    fatigue: 0.70,
    reduced_appetite: 0.55,
    anxiety: 0.45,
    difficulty_walking: 0.20,
    malaise: 0.40,
    weight_loss: 0.20,
    headache: 0.15,
    muscle_weakness: 0.15,
  },

  anxiety_condition: {
    anxiety: 0.90,
    insomnia: 0.65,
    rapid_heartbeat: 0.40,
    shortness_of_breath: 0.20,
    nausea: 0.25,
    dizziness: 0.20,
    chest_pain: 0.10,
    fatigue: 0.35,
    headache: 0.25,
    depression: 0.30,
  },

  nerve_damage: {
    numbness: 0.85,
    tingling: 0.80,
    muscle_weakness: 0.55,
    difficulty_walking: 0.40,
    increased_pain: 0.35,
    increased_pain_severe: 0.15,
    anxiety: 0.20,
  },

  blood_clot: {
    leg_swelling: 0.50,
    calf_pain: 0.40,
    leg_warmth: 0.55,
    leg_redness: 0.60,
    increased_pain: 0.45,
    fever: 0.15,
    difficulty_walking: 0.20,
  },
};

// ============================================================================
// Default background probability: P(symptom | NOT any specific condition)
// Used as the fall-through when a symptom is not listed for a condition.
// ============================================================================

const DEFAULT_SYMPTOM_PROBABILITY = 0.02;

// ============================================================================
// Context-based prior adjustments
//
// These multipliers modify P(condition) based on surgery type, time since
// surgery, and patient age to produce a more realistic posterior.
// ============================================================================

/**
 * Multiplier for P(condition) by surgery type.
 * Missing entries default to 1.0.
 */
const SURGERY_TYPE_MODIFIERS: Record<string, Record<string, number>> = {
  knee_replacement: {
    dvt: 2.0,
    blood_clot: 1.8,
    pulmonary_embolism: 1.6,
    nerve_damage: 1.3,
    surgical_site_infection: 1.2,
    constipation_condition: 1.3,
  },
  hip_replacement: {
    dvt: 2.2,
    blood_clot: 1.9,
    pulmonary_embolism: 1.7,
    nerve_damage: 1.2,
    surgical_site_infection: 1.2,
    wound_dehiscence: 1.1,
  },
  acl_reconstruction: {
    dvt: 1.5,
    nerve_damage: 1.4,
    blood_clot: 1.3,
  },
  rotator_cuff_repair: {
    nerve_damage: 1.5,
    constipation_condition: 1.2,
  },
  spinal_fusion: {
    dvt: 1.8,
    nerve_damage: 2.0,
    pulmonary_embolism: 1.5,
    wound_dehiscence: 1.3,
    urinary_retention_condition: 1.5,
    constipation_condition: 1.4,
    depression_condition: 1.3,
  },
  appendectomy: {
    surgical_site_infection: 1.3,
    ileus: 1.5,
    constipation_condition: 1.2,
  },
  cholecystectomy: {
    ileus: 1.4,
    surgical_site_infection: 1.1,
    constipation_condition: 1.2,
  },
  hernia_repair: {
    seroma: 1.5,
    hematoma: 1.3,
    wound_dehiscence: 1.3,
    surgical_site_infection: 1.2,
    urinary_retention_condition: 1.3,
  },
  cardiac_bypass: {
    atelectasis: 2.0,
    pneumonia: 1.8,
    dvt: 1.5,
    pulmonary_embolism: 1.4,
    anemia: 1.5,
    depression_condition: 1.5,
    surgical_site_infection: 1.3,
    wound_dehiscence: 1.2,
    dehydration: 1.2,
  },
  cesarean_section: {
    surgical_site_infection: 1.4,
    wound_dehiscence: 1.3,
    dvt: 1.3,
    anemia: 1.4,
    depression_condition: 1.6,
    urinary_tract_infection: 1.3,
    constipation_condition: 1.3,
  },
};

/**
 * Returns a multiplier on P(condition) based on days since surgery.
 * Different conditions peak at different post-operative windows.
 */
function getTemporalModifier(conditionId: string, daysSinceSurgery: number): number {
  // Peak risk windows (center day, half-width in days)
  const windows: Record<string, { peak: number; width: number }> = {
    surgical_site_infection: { peak: 7, width: 7 },
    dvt: { peak: 7, width: 10 },
    pulmonary_embolism: { peak: 10, width: 12 },
    pneumonia: { peak: 4, width: 5 },
    urinary_tract_infection: { peak: 3, width: 5 },
    ileus: { peak: 2, width: 3 },
    wound_dehiscence: { peak: 7, width: 7 },
    seroma: { peak: 10, width: 10 },
    hematoma: { peak: 2, width: 3 },
    allergic_reaction: { peak: 1, width: 3 },
    medication_side_effect: { peak: 3, width: 7 },
    dehydration: { peak: 2, width: 4 },
    anemia: { peak: 1, width: 5 },
    atelectasis: { peak: 2, width: 3 },
    constipation_condition: { peak: 3, width: 5 },
    urinary_retention_condition: { peak: 1, width: 2 },
    depression_condition: { peak: 21, width: 30 },
    anxiety_condition: { peak: 7, width: 21 },
    nerve_damage: { peak: 3, width: 14 },
    blood_clot: { peak: 5, width: 7 },
  };

  const w = windows[conditionId];
  if (!w) return 1.0;

  // Gaussian-like decay from peak
  const distance = Math.abs(daysSinceSurgery - w.peak);
  // At peak => modifier ~2.0; falls to ~1.0 at edges
  const modifier = 1.0 + Math.exp(-(distance * distance) / (2 * w.width * w.width));
  return modifier;
}

/**
 * Returns a multiplier on P(condition) based on patient age.
 */
function getAgeModifier(conditionId: string, age: number): number {
  // Conditions that are more common in older patients
  const ageScaledUp: Set<string> = new Set([
    'dvt', 'pulmonary_embolism', 'pneumonia', 'dehydration', 'anemia',
    'atelectasis', 'confusion', 'urinary_tract_infection', 'constipation_condition',
    'urinary_retention_condition', 'nerve_damage', 'blood_clot',
  ]);

  // Conditions more common in younger patients or not age-dependent
  const ageScaledDown: Set<string> = new Set([
    'anxiety_condition',
  ]);

  if (ageScaledUp.has(conditionId)) {
    // Linear increase: 1.0 at age 40, up to 1.6 at age 80
    return 1.0 + Math.max(0, (age - 40) * 0.015);
  }

  if (ageScaledDown.has(conditionId)) {
    // Slightly higher for younger patients
    return 1.0 + Math.max(0, (50 - age) * 0.008);
  }

  return 1.0;
}

// ============================================================================
// Core Bayesian inference
// ============================================================================

/**
 * Computes the adjusted prior P(condition) incorporating surgery type,
 * temporal window, and age.
 */
function computeAdjustedPrior(
  condition: ConditionDefinition,
  context: AnalysisContext,
): number {
  let prior = condition.basePrior;

  // Surgery type modifier
  const surgeryMods = SURGERY_TYPE_MODIFIERS[context.surgeryType];
  if (surgeryMods && surgeryMods[condition.id] !== undefined) {
    prior *= surgeryMods[condition.id];
  }

  // Temporal modifier
  prior *= getTemporalModifier(condition.id, context.daysSinceSurgery);

  // Age modifier
  prior *= getAgeModifier(condition.id, context.age);

  // Clamp to [0, 1]
  return Math.min(prior, 1.0);
}

/**
 * Retrieves P(symptom | condition) from the probability matrix.
 * Returns DEFAULT_SYMPTOM_PROBABILITY if the symptom is not explicitly listed.
 */
function getLikelihood(conditionId: string, symptomId: string): number {
  const conditionProbs = PROBABILITY_MATRIX[conditionId];
  if (!conditionProbs) return DEFAULT_SYMPTOM_PROBABILITY;
  return conditionProbs[symptomId] ?? DEFAULT_SYMPTOM_PROBABILITY;
}

/**
 * Computes the log-likelihood of the observed symptoms given a condition.
 * Using log-space to avoid numerical underflow with many symptoms.
 *
 *   log P(symptoms | condition) = Σ log P(si | condition)              for present symptoms
 *                                + Σ log (1 - P(sj | condition))       for absent symptoms
 *
 * We only penalize absent symptoms that are highly indicative (>= 0.5) for
 * the condition, to avoid the "explaining away" problem dominating.
 */
function computeLogLikelihood(
  conditionId: string,
  presentSymptomIds: Set<string>,
): number {
  let logLik = 0;

  // Contribution from PRESENT symptoms
  for (const symptomId of presentSymptomIds) {
    const p = getLikelihood(conditionId, symptomId);
    logLik += Math.log(p);
  }

  // Contribution from ABSENT high-signal symptoms
  const conditionProbs = PROBABILITY_MATRIX[conditionId];
  if (conditionProbs) {
    for (const [symptomId, prob] of Object.entries(conditionProbs)) {
      if (!presentSymptomIds.has(symptomId) && prob >= 0.50) {
        // This symptom is expected but not reported — slight penalty
        logLik += Math.log(1 - prob * 0.5);
      }
    }
  }

  return logLik;
}

/**
 * Main Bayesian classifier. Returns unnormalized log-posteriors for each
 * condition, then normalizes into proper probabilities.
 *
 *   log P(condition | symptoms) ∝ log P(condition) + log P(symptoms | condition)
 */
function computePosteriors(
  symptoms: string[],
  context: AnalysisContext,
): Array<{ conditionId: string; probability: number }> {
  const presentSymptoms = new Set(symptoms);

  // Compute unnormalized log-posteriors
  const logPosteriors: Array<{ conditionId: string; logPosterior: number }> = [];

  for (const condition of CONDITION_DATABASE) {
    const adjustedPrior = computeAdjustedPrior(condition, context);
    const logPrior = Math.log(adjustedPrior);
    const logLik = computeLogLikelihood(condition.id, presentSymptoms);
    logPosteriors.push({
      conditionId: condition.id,
      logPosterior: logPrior + logLik,
    });
  }

  // Convert from log-space using log-sum-exp for numerical stability
  const maxLogP = Math.max(...logPosteriors.map((lp) => lp.logPosterior));
  const expValues = logPosteriors.map((lp) => ({
    conditionId: lp.conditionId,
    expValue: Math.exp(lp.logPosterior - maxLogP),
  }));
  const sumExp = expValues.reduce((sum, ev) => sum + ev.expValue, 0);

  return expValues.map((ev) => ({
    conditionId: ev.conditionId,
    probability: ev.expValue / sumExp,
  }));
}

// ============================================================================
// Urgency escalation
//
// The default urgency of a condition can be escalated when certain
// high-signal symptom combinations are present.
// ============================================================================

const URGENCY_LEVELS: Urgency[] = [
  Urgency.ROUTINE,
  Urgency.SOON,
  Urgency.URGENT,
  Urgency.EMERGENCY,
];

function urgencyIndex(u: Urgency): number {
  return URGENCY_LEVELS.indexOf(u);
}

function escalateUrgency(base: Urgency, steps: number): Urgency {
  const idx = Math.min(urgencyIndex(base) + steps, URGENCY_LEVELS.length - 1);
  return URGENCY_LEVELS[idx];
}

/**
 * Determines the effective urgency for a condition given the reported symptoms.
 */
function determineUrgency(conditionId: string, symptoms: string[]): Urgency {
  const condition = conditionMap.get(conditionId);
  if (!condition) return Urgency.ROUTINE;

  let urgency = condition.defaultUrgency;
  const symptomSet = new Set(symptoms);

  // Escalation rules based on critical combinations
  const escalationRules: Array<{ symptoms: string[]; conditionMatch: string | null; escalate: number }> = [
    // Any condition + confusion => escalate 1
    { symptoms: ['confusion'], conditionMatch: null, escalate: 1 },
    // PE signs => emergency
    { symptoms: ['shortness_of_breath', 'chest_pain'], conditionMatch: 'pulmonary_embolism', escalate: 1 },
    // DVT with PE symptoms => emergency
    { symptoms: ['leg_swelling', 'shortness_of_breath'], conditionMatch: 'dvt', escalate: 1 },
    // Severe bleeding => escalate
    { symptoms: ['bleeding', 'pallor', 'dizziness'], conditionMatch: null, escalate: 2 },
    // High fever with wound signs => urgent
    { symptoms: ['high_fever', 'wound_drainage'], conditionMatch: 'surgical_site_infection', escalate: 1 },
    // Persistent vomiting with anything => escalate
    { symptoms: ['vomiting_persistent'], conditionMatch: null, escalate: 1 },
    // Low oxygen => escalate
    { symptoms: ['low_oxygen'], conditionMatch: null, escalate: 1 },
  ];

  for (const rule of escalationRules) {
    const symptomsMatch = rule.symptoms.every((s) => symptomSet.has(s));
    const conditionMatches = rule.conditionMatch === null || rule.conditionMatch === conditionId;

    if (symptomsMatch && conditionMatches) {
      urgency = escalateUrgency(urgency, rule.escalate);
    }
  }

  return urgency;
}

// ============================================================================
// Red-flag detection
// ============================================================================

interface RedFlagRule {
  /** Symptom(s) that trigger this red flag — ANY match triggers unless requireAll is true */
  triggerSymptoms: string[];
  /** If true, ALL triggerSymptoms must be present */
  requireAll: boolean;
  /** Human-readable flag description */
  flag: string;
  /** Recommended immediate action */
  action: string;
}

const RED_FLAG_RULES: RedFlagRule[] = [
  {
    triggerSymptoms: ['chest_pain', 'shortness_of_breath'],
    requireAll: false,
    flag: 'Possible pulmonary embolism or cardiac event',
    action: 'Seek emergency medical attention immediately. Call 911 or go to the nearest emergency department.',
  },
  {
    triggerSymptoms: ['low_oxygen'],
    requireAll: true,
    flag: 'Critically low oxygen saturation',
    action: 'Seek emergency medical attention immediately. This may indicate a life-threatening respiratory or circulatory problem.',
  },
  {
    triggerSymptoms: ['leg_swelling', 'calf_pain'],
    requireAll: true,
    flag: 'Signs consistent with deep vein thrombosis',
    action: 'Contact your surgeon or go to an emergency department within the next few hours. Do not massage the affected leg.',
  },
  {
    triggerSymptoms: ['wound_drainage', 'high_fever'],
    requireAll: true,
    flag: 'Signs of severe surgical site infection',
    action: 'Contact your surgeon urgently. You may need antibiotics or wound evaluation within 24 hours.',
  },
  {
    triggerSymptoms: ['wound_dehiscence_sign'],
    requireAll: true,
    flag: 'Wound opening or dehiscence',
    action: 'Cover the wound with a clean, moist dressing and contact your surgeon immediately. Do not attempt to close the wound yourself.',
  },
  {
    triggerSymptoms: ['bleeding'],
    requireAll: true,
    flag: 'Active surgical site bleeding',
    action: 'Apply firm, direct pressure with a clean cloth. If bleeding does not stop within 15 minutes or is heavy, seek emergency care.',
  },
  {
    triggerSymptoms: ['confusion'],
    requireAll: true,
    flag: 'Altered mental status',
    action: 'This may indicate infection, medication reaction, or other serious condition. Contact your care team immediately or go to the emergency department.',
  },
  {
    triggerSymptoms: ['vomiting_persistent'],
    requireAll: true,
    flag: 'Persistent vomiting — risk of dehydration and aspiration',
    action: 'Stop oral intake. Contact your surgeon or go to the emergency department for IV fluid management.',
  },
  {
    triggerSymptoms: ['absent_bowel_sounds', 'abdominal_distension', 'vomiting'],
    requireAll: true,
    flag: 'Signs of bowel obstruction or severe ileus',
    action: 'Seek urgent medical evaluation. Do not eat or drink until evaluated.',
  },
  {
    triggerSymptoms: ['pleuritic_chest_pain', 'cough'],
    requireAll: true,
    flag: 'Pleuritic symptoms — possible PE or pneumonia',
    action: 'Contact your care team or go to the emergency department for evaluation including imaging if needed.',
  },
  {
    triggerSymptoms: ['high_fever', 'chills', 'confusion'],
    requireAll: true,
    flag: 'Signs of sepsis',
    action: 'Seek emergency medical attention immediately. Sepsis is life-threatening and requires prompt treatment.',
  },
  {
    triggerSymptoms: ['increased_pain_severe'],
    requireAll: true,
    flag: 'Sudden severe pain at surgical site',
    action: 'Contact your surgeon immediately. Sudden severe pain may indicate hematoma, dehiscence, or compartment syndrome.',
  },
  {
    triggerSymptoms: ['wound_odor'],
    requireAll: true,
    flag: 'Foul wound odor — possible necrotic tissue or anaerobic infection',
    action: 'Contact your surgeon within 24 hours for wound evaluation. Avoid self-treating.',
  },
  {
    triggerSymptoms: ['numbness', 'muscle_weakness'],
    requireAll: true,
    flag: 'Possible nerve injury',
    action: 'Report to your surgeon at your next visit or sooner if symptoms are worsening. Document the affected area and timeline.',
  },
];

/**
 * Detects red-flag symptom patterns and returns corresponding alerts.
 */
export function detectRedFlags(symptoms: string[]): RedFlagResult[] {
  const symptomSet = new Set(symptoms);
  const results: RedFlagResult[] = [];
  const seenFlags = new Set<string>();

  // Check rule-based red flags
  for (const rule of RED_FLAG_RULES) {
    let triggered: boolean;
    if (rule.requireAll) {
      triggered = rule.triggerSymptoms.every((s) => symptomSet.has(s));
    } else {
      triggered = rule.triggerSymptoms.some((s) => symptomSet.has(s));
    }

    if (triggered && !seenFlags.has(rule.flag)) {
      seenFlags.add(rule.flag);
      results.push({ flag: rule.flag, action: rule.action });
    }
  }

  // Also flag any individual symptom marked as isRedFlag in the database
  for (const symptomId of symptoms) {
    const symptomDef = symptomMap.get(symptomId);
    if (symptomDef && symptomDef.isRedFlag) {
      const flag = `${symptomDef.name}: ${symptomDef.description}`;
      if (!seenFlags.has(flag)) {
        seenFlags.add(flag);
        results.push({
          flag,
          action: `Report "${symptomDef.name}" to your surgical team promptly.`,
        });
      }
    }
  }

  return results;
}

// ============================================================================
// Follow-up question generation
// ============================================================================

/**
 * Symptom adjacency: given a reported symptom, which additional symptoms
 * should be asked about to improve diagnostic clarity?
 */
const FOLLOW_UP_MAP: Record<string, string[]> = {
  fever: ['chills', 'night_sweats', 'wound_redness', 'wound_drainage', 'dysuria', 'cough'],
  high_fever: ['chills', 'confusion', 'wound_drainage', 'rapid_heartbeat'],
  chills: ['fever', 'night_sweats', 'wound_redness'],
  wound_redness: ['wound_swelling', 'wound_warmth', 'wound_drainage', 'wound_odor', 'fever'],
  wound_swelling: ['wound_redness', 'wound_warmth', 'wound_drainage', 'bruising_excessive'],
  wound_drainage: ['wound_odor', 'fever', 'wound_redness', 'wound_dehiscence_sign'],
  increased_pain: ['increased_pain_severe', 'wound_swelling', 'wound_redness', 'bleeding', 'numbness'],
  nausea: ['vomiting', 'reduced_appetite', 'constipation', 'abdominal_distension', 'dizziness'],
  vomiting: ['vomiting_persistent', 'nausea', 'abdominal_distension', 'dehydration_signs', 'fever'],
  shortness_of_breath: ['chest_pain', 'pleuritic_chest_pain', 'cough', 'low_oxygen', 'leg_swelling', 'wheezing', 'rapid_heartbeat'],
  chest_pain: ['shortness_of_breath', 'pleuritic_chest_pain', 'rapid_heartbeat', 'dizziness', 'low_oxygen'],
  leg_swelling: ['calf_pain', 'leg_warmth', 'leg_redness', 'shortness_of_breath'],
  calf_pain: ['leg_swelling', 'leg_warmth', 'leg_redness'],
  dizziness: ['confusion', 'hypotension_signs', 'pallor', 'rapid_heartbeat', 'dehydration_signs'],
  confusion: ['fever', 'dizziness', 'headache', 'low_oxygen'],
  bleeding: ['pallor', 'dizziness', 'hypotension_signs', 'bruising_excessive'],
  constipation: ['abdominal_distension', 'nausea', 'vomiting', 'absent_bowel_sounds', 'reduced_appetite'],
  urinary_retention: ['dysuria', 'abdominal_distension', 'urinary_frequency'],
  fatigue: ['pallor', 'dizziness', 'reduced_appetite', 'insomnia', 'depression', 'shortness_of_breath'],
  insomnia: ['anxiety', 'depression', 'increased_pain', 'fatigue'],
  anxiety: ['insomnia', 'depression', 'rapid_heartbeat', 'chest_pain', 'shortness_of_breath'],
  depression: ['insomnia', 'reduced_appetite', 'fatigue', 'anxiety', 'weight_loss'],
  numbness: ['tingling', 'muscle_weakness', 'difficulty_walking'],
  tingling: ['numbness', 'muscle_weakness', 'difficulty_walking'],
  difficulty_walking: ['muscle_weakness', 'numbness', 'dizziness', 'increased_pain', 'leg_swelling'],
  reduced_appetite: ['nausea', 'weight_loss', 'fatigue', 'depression', 'constipation'],
  cough: ['cough_productive', 'shortness_of_breath', 'fever', 'pleuritic_chest_pain', 'wheezing'],
  cough_productive: ['fever', 'shortness_of_breath', 'chest_pain', 'night_sweats'],
  dysuria: ['urinary_frequency', 'cloudy_urine', 'hematuria', 'fever'],
  headache: ['dizziness', 'confusion', 'nausea', 'fever'],
  rapid_heartbeat: ['chest_pain', 'shortness_of_breath', 'dizziness', 'anxiety'],
  abdominal_distension: ['constipation', 'absent_bowel_sounds', 'nausea', 'vomiting'],
  pallor: ['fatigue', 'dizziness', 'shortness_of_breath', 'bleeding'],
  hypotension_signs: ['dizziness', 'confusion', 'rapid_heartbeat', 'pallor', 'dehydration_signs'],
  muscle_weakness: ['numbness', 'tingling', 'fatigue', 'difficulty_walking'],
};

/**
 * Human-readable question templates for symptoms.
 */
const SYMPTOM_QUESTIONS: Record<string, string> = {
  fever: 'Have you measured a temperature of 100.4°F (38°C) or higher?',
  high_fever: 'Has your temperature reached 103°F (39.5°C) or higher?',
  chills: 'Are you experiencing chills or shaking?',
  night_sweats: 'Have you been waking up drenched in sweat?',
  fatigue: 'Are you feeling unusually fatigued or exhausted?',
  malaise: 'Do you have a general feeling of being unwell?',
  dehydration_signs: 'Are you noticing dry mouth, dark urine, or decreased urination?',
  reduced_appetite: 'Has your appetite decreased significantly?',
  weight_loss: 'Have you lost weight unexpectedly in the past week?',
  wound_redness: 'Is there redness spreading around your incision?',
  wound_swelling: 'Do you notice swelling at or near your surgical site?',
  wound_drainage: 'Is there any discharge or drainage from your incision?',
  wound_warmth: 'Does the area around your incision feel warm to the touch?',
  wound_dehiscence_sign: 'Are the edges of your incision separating or opening?',
  wound_odor: 'Is there an unpleasant smell coming from your surgical site?',
  increased_pain: 'Is your pain at the surgical site getting worse instead of better?',
  increased_pain_severe: 'Are you experiencing sudden, severe pain at or near your surgical site?',
  bleeding: 'Is there active bleeding from your surgical site?',
  bruising_excessive: 'Do you have bruising that is spreading far from the surgical site?',
  pallor: 'Have you or others noticed that you look unusually pale?',
  chest_pain: 'Are you experiencing any chest pain, pressure, or tightness?',
  rapid_heartbeat: 'Does your heart feel like it is racing or pounding at rest?',
  leg_swelling: 'Is one of your legs noticeably more swollen than the other?',
  calf_pain: 'Do you have pain or tenderness in your calf, especially when flexing your foot?',
  leg_warmth: 'Does one leg feel noticeably warmer than the other?',
  leg_redness: 'Is there redness along your calf or thigh?',
  hypotension_signs: 'Do you feel lightheaded or dizzy when you stand up?',
  shortness_of_breath: 'Are you having difficulty breathing or feeling short of breath?',
  cough: 'Have you developed a new or worsening cough?',
  cough_productive: 'Are you coughing up sputum or phlegm, especially if colored?',
  wheezing: 'Do you hear a whistling sound when you breathe?',
  low_oxygen: 'If you have a pulse oximeter, is your reading below 94%?',
  pleuritic_chest_pain: 'Do you have sharp chest pain that gets worse when you take a deep breath?',
  nausea: 'Are you feeling nauseous?',
  vomiting: 'Have you been vomiting?',
  vomiting_persistent: 'Have you been unable to keep fluids down for more than 12 hours?',
  abdominal_distension: 'Does your abdomen look or feel bloated or distended?',
  constipation: 'Have you gone more than 3 days without a bowel movement?',
  diarrhea: 'Are you having frequent loose or watery stools?',
  absent_bowel_sounds: 'Has a healthcare provider noted that your bowel sounds are absent?',
  urinary_retention: 'Have you been unable to urinate for 8 or more hours?',
  dysuria: 'Do you feel burning or pain when you urinate?',
  urinary_frequency: 'Are you urinating much more frequently than usual?',
  hematuria: 'Have you noticed blood in your urine?',
  cloudy_urine: 'Does your urine appear cloudy or have a strong odor?',
  dizziness: 'Are you experiencing dizziness or lightheadedness?',
  confusion: 'Are you or your caregiver noticing confusion or difficulty thinking clearly?',
  numbness: 'Do you have numbness or loss of feeling in any area?',
  tingling: 'Are you experiencing a pins-and-needles sensation anywhere?',
  difficulty_walking: 'Are you having new or increased difficulty walking?',
  headache: 'Do you have a new or persistent headache?',
  joint_stiffness: 'Are you experiencing unusual joint stiffness beyond what is expected?',
  muscle_weakness: 'Have you noticed significant muscle weakness?',
  insomnia: 'Are you having difficulty falling or staying asleep?',
  anxiety: 'Are you feeling persistently anxious, worried, or panicky?',
  depression: 'Are you feeling persistently sad, hopeless, or losing interest in things?',
};

/**
 * Generates targeted follow-up questions based on reported symptoms.
 * Selects questions for symptoms that are clinically adjacent to the
 * reported ones but not yet reported, prioritized by diagnostic value.
 */
export function getFollowUpQuestions(symptoms: string[]): string[] {
  const reported = new Set(symptoms);
  const candidateScores: Map<string, number> = new Map();

  // Score candidate follow-up symptoms by how many reported symptoms point to them
  for (const symptomId of symptoms) {
    const followUps = FOLLOW_UP_MAP[symptomId];
    if (!followUps) continue;
    for (const candidate of followUps) {
      if (reported.has(candidate)) continue;
      candidateScores.set(candidate, (candidateScores.get(candidate) ?? 0) + 1);
    }
  }

  // Also boost candidates that are red flags
  for (const [candidate, score] of candidateScores) {
    const def = symptomMap.get(candidate);
    if (def && def.isRedFlag) {
      candidateScores.set(candidate, score + 2);
    }
  }

  // Sort by score descending
  const sorted = [...candidateScores.entries()]
    .sort((a, b) => b[1] - a[1]);

  // Return top 5 questions
  const questions: string[] = [];
  for (const [symptomId] of sorted) {
    const question = SYMPTOM_QUESTIONS[symptomId];
    if (question && questions.length < 5) {
      questions.push(question);
    }
  }

  // If we still have fewer than 3 questions, add general post-op screening questions
  const generalQuestions = [
    'Are you able to eat and drink normally?',
    'Are you able to move around as expected for this stage of recovery?',
    'Are your pain levels manageable with your current medication?',
    'Have you been able to sleep adequately?',
    'Do you have any concerns about your recovery that we have not addressed?',
  ];

  let gi = 0;
  while (questions.length < 3 && gi < generalQuestions.length) {
    questions.push(generalQuestions[gi]);
    gi++;
  }

  return questions;
}

// ============================================================================
// Recommended action determination
// ============================================================================

/**
 * Determines the single most appropriate recommended action based on the
 * analysis results — highest urgency condition + red flags.
 */
function determineRecommendedAction(
  rankedConditions: ConditionResult[],
  redFlags: RedFlagResult[],
): string {
  // If there are emergency-level red flags, that takes priority
  if (redFlags.length > 0) {
    // Check if any red flag action mentions "emergency"
    const emergencyFlag = redFlags.find((rf) =>
      rf.action.toLowerCase().includes('emergency') || rf.action.toLowerCase().includes('911'),
    );
    if (emergencyFlag) {
      return emergencyFlag.action;
    }
  }

  // Otherwise determine from the highest-urgency, highest-probability condition
  const topConditions = rankedConditions.slice(0, 5);
  const highestUrgency = topConditions.reduce<Urgency>((max, c) => {
    const cIdx = urgencyIndex(c.urgency as Urgency);
    return cIdx > urgencyIndex(max) ? (c.urgency as Urgency) : max;
  }, Urgency.ROUTINE);

  switch (highestUrgency) {
    case Urgency.EMERGENCY:
      return 'Seek emergency medical attention immediately. Call 911 or go to your nearest emergency department.';
    case Urgency.URGENT:
      return 'Contact your surgeon or care team today for evaluation. If symptoms worsen, go to the emergency department.';
    case Urgency.SOON:
      return 'Schedule an appointment with your surgeon within the next 1-2 days. Monitor symptoms and seek urgent care if they worsen.';
    case Urgency.ROUTINE:
      return 'Continue your recovery plan and mention these symptoms at your next scheduled follow-up appointment.';
    default:
      return 'Monitor your symptoms and contact your care team if they change or worsen.';
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Analyzes a set of patient-reported symptoms using Bayesian inference to
 * estimate the probability of post-operative conditions.
 *
 * @param symptoms - Array of symptom IDs from SYMPTOM_DATABASE
 * @param context - Patient context: surgery type, days since surgery, age
 * @returns Analysis result with ranked conditions, red flags, and recommendation
 *
 * @example
 * ```ts
 * const result = analyzeSymptoms(
 *   ['fever', 'wound_redness', 'wound_swelling', 'increased_pain'],
 *   { surgeryType: 'knee_replacement', daysSinceSurgery: 5, age: 65 }
 * );
 * // result.conditions[0] => { name: 'Surgical Site Infection (SSI)', probability: 0.72, urgency: 'urgent' }
 * ```
 */
export function analyzeSymptoms(
  symptoms: string[],
  context: AnalysisContext,
): AnalysisResult {
  // Validate inputs
  const validSymptoms = symptoms.filter((s) => symptomMap.has(s));
  if (validSymptoms.length === 0) {
    return {
      conditions: [],
      redFlags: [],
      recommendedAction: 'No recognized symptoms were provided. Please describe your symptoms and try again.',
    };
  }

  // --- Step 1: Compute posteriors via Bayes' theorem ---
  const posteriors = computePosteriors(validSymptoms, context);

  // --- Step 2: Rank and format conditions ---
  const rankedConditions: ConditionResult[] = posteriors
    .map((p) => {
      const condition = conditionMap.get(p.conditionId)!;
      const urgency = determineUrgency(p.conditionId, validSymptoms);
      return {
        name: condition.name,
        probability: Math.round(p.probability * 10000) / 10000, // 4 decimal places
        urgency,
      };
    })
    .sort((a, b) => b.probability - a.probability);

  // --- Step 3: Detect red flags ---
  const redFlags = detectRedFlags(validSymptoms);
  const redFlagStrings = redFlags.map((rf) => rf.flag);

  // --- Step 4: Determine recommended action ---
  const recommendedAction = determineRecommendedAction(rankedConditions, redFlags);

  return {
    conditions: rankedConditions,
    redFlags: redFlagStrings,
    recommendedAction,
  };
}
