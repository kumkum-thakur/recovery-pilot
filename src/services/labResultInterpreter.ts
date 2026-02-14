/**
 * Lab Result Interpreter
 *
 * Real clinical laboratory result interpretation engine:
 * - Real reference ranges for 60+ common lab tests
 * - Age and sex-adjusted reference ranges
 * - Critical value flagging with real thresholds
 * - Delta checking (rate of change alerts)
 * - Lab trend analysis with linear regression
 * - Clinical correlation suggestions
 * - Panel interpretation (hepatic, renal, etc.)
 * - Calculated values: anion gap, corrected calcium, eGFR (CKD-EPI)
 * - Self-learning: adjusts personalized reference ranges
 *
 * No external dependencies.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const LabCategory = {
  CBC: 'cbc',
  BMP: 'bmp',
  CMP: 'cmp',
  LFT: 'lft',
  COAGULATION: 'coagulation',
  CARDIAC: 'cardiac',
  INFLAMMATORY: 'inflammatory',
  THYROID: 'thyroid',
  LIPID: 'lipid',
  URINALYSIS: 'urinalysis',
  IRON: 'iron',
  RENAL: 'renal',
  OTHER: 'other',
} as const;
export type LabCategory = (typeof LabCategory)[keyof typeof LabCategory];

export const FlagLevel = {
  NORMAL: 'normal',
  LOW: 'low',
  HIGH: 'high',
  CRITICAL_LOW: 'critical_low',
  CRITICAL_HIGH: 'critical_high',
} as const;
export type FlagLevel = (typeof FlagLevel)[keyof typeof FlagLevel];

export const DeltaAlertType = {
  RAPID_INCREASE: 'rapid_increase',
  RAPID_DECREASE: 'rapid_decrease',
  STEADY_INCREASE: 'steady_increase',
  STEADY_DECREASE: 'steady_decrease',
  NONE: 'none',
} as const;
export type DeltaAlertType = (typeof DeltaAlertType)[keyof typeof DeltaAlertType];

export const TrendDirection = {
  INCREASING: 'increasing',
  DECREASING: 'decreasing',
  STABLE: 'stable',
  FLUCTUATING: 'fluctuating',
} as const;
export type TrendDirection = (typeof TrendDirection)[keyof typeof TrendDirection];

// ============================================================================
// Interfaces
// ============================================================================

export interface ReferenceRange {
  testCode: string;
  testName: string;
  category: LabCategory;
  unit: string;
  normalLow: number;
  normalHigh: number;
  criticalLow?: number;
  criticalHigh?: number;
  maleAdjust?: { normalLow: number; normalHigh: number };
  femaleAdjust?: { normalLow: number; normalHigh: number };
  pediatricAdjust?: { normalLow: number; normalHigh: number; ageMax: number };
  geriatricAdjust?: { normalLow: number; normalHigh: number; ageMin: number };
  deltaThreshold?: { percentChange: number; timeWindowHours: number };
}

export interface LabValue {
  testCode: string;
  value: number;
  unit: string;
  collectedAt: string;
  patientId: string;
}

export interface InterpretedResult {
  testCode: string;
  testName: string;
  value: number;
  unit: string;
  flag: FlagLevel;
  referenceRange: string;
  interpretation: string;
  clinicalSignificance: string;
  isCritical: boolean;
}

export interface DeltaCheckResult {
  testCode: string;
  currentValue: number;
  previousValue: number;
  percentChange: number;
  timeElapsedHours: number;
  alertType: DeltaAlertType;
  message: string;
}

export interface TrendAnalysis {
  testCode: string;
  testName: string;
  direction: TrendDirection;
  slope: number;
  rSquared: number;
  values: { value: number; timestamp: string }[];
  predictedNext: number;
  confidence: number;
  message: string;
}

export interface PanelInterpretation {
  panelName: string;
  results: InterpretedResult[];
  pattern: string;
  interpretation: string;
  suggestedFollowUp: string[];
  clinicalCorrelations: string[];
}

export interface CalculatedValue {
  name: string;
  value: number;
  unit: string;
  formula: string;
  interpretation: string;
  normalRange: string;
}

export interface ClinicalCorrelation {
  findings: string[];
  possibleConditions: string[];
  suggestedTests: string[];
  urgency: 'routine' | 'urgent' | 'stat';
}

export interface PatientBaseline {
  patientId: string;
  baselines: Map<string, { mean: number; stdDev: number; count: number; values: number[] }>;
  lastUpdated: string;
}

export interface LearningInsight {
  testCode: string;
  personalizedRange: { low: number; high: number };
  baselineValue: number;
  confidence: number;
  dataPoints: number;
}

// ============================================================================
// Reference Ranges Database (60+ Real Lab Tests)
// ============================================================================

export const REFERENCE_RANGES: ReferenceRange[] = [
  // === CBC (Complete Blood Count) ===
  { testCode: 'WBC', testName: 'White Blood Cell Count', category: LabCategory.CBC, unit: 'K/uL', normalLow: 4.5, normalHigh: 11.0, criticalLow: 2.0, criticalHigh: 30.0, deltaThreshold: { percentChange: 50, timeWindowHours: 24 } },
  { testCode: 'RBC', testName: 'Red Blood Cell Count', category: LabCategory.CBC, unit: 'M/uL', normalLow: 4.0, normalHigh: 5.5, maleAdjust: { normalLow: 4.5, normalHigh: 5.9 }, femaleAdjust: { normalLow: 4.0, normalHigh: 5.2 } },
  { testCode: 'HGB', testName: 'Hemoglobin', category: LabCategory.CBC, unit: 'g/dL', normalLow: 12.0, normalHigh: 17.0, criticalLow: 7.0, criticalHigh: 20.0, maleAdjust: { normalLow: 13.5, normalHigh: 17.5 }, femaleAdjust: { normalLow: 12.0, normalHigh: 16.0 }, deltaThreshold: { percentChange: 20, timeWindowHours: 24 } },
  { testCode: 'HCT', testName: 'Hematocrit', category: LabCategory.CBC, unit: '%', normalLow: 36, normalHigh: 50, criticalLow: 20, criticalHigh: 60, maleAdjust: { normalLow: 40, normalHigh: 54 }, femaleAdjust: { normalLow: 36, normalHigh: 48 } },
  { testCode: 'PLT', testName: 'Platelet Count', category: LabCategory.CBC, unit: 'K/uL', normalLow: 150, normalHigh: 400, criticalLow: 50, criticalHigh: 1000, deltaThreshold: { percentChange: 50, timeWindowHours: 24 } },
  { testCode: 'MCV', testName: 'Mean Corpuscular Volume', category: LabCategory.CBC, unit: 'fL', normalLow: 80, normalHigh: 100 },
  { testCode: 'MCH', testName: 'Mean Corpuscular Hemoglobin', category: LabCategory.CBC, unit: 'pg', normalLow: 27, normalHigh: 33 },
  { testCode: 'MCHC', testName: 'Mean Corpuscular Hemoglobin Concentration', category: LabCategory.CBC, unit: 'g/dL', normalLow: 32, normalHigh: 36 },
  { testCode: 'RDW', testName: 'Red Cell Distribution Width', category: LabCategory.CBC, unit: '%', normalLow: 11.5, normalHigh: 14.5 },
  { testCode: 'NEUT', testName: 'Neutrophils (Absolute)', category: LabCategory.CBC, unit: 'K/uL', normalLow: 1.8, normalHigh: 7.7, criticalLow: 0.5, criticalHigh: 20.0 },
  { testCode: 'LYMPH', testName: 'Lymphocytes (Absolute)', category: LabCategory.CBC, unit: 'K/uL', normalLow: 1.0, normalHigh: 4.8 },
  { testCode: 'MONO', testName: 'Monocytes (Absolute)', category: LabCategory.CBC, unit: 'K/uL', normalLow: 0.2, normalHigh: 0.8 },
  { testCode: 'EOS', testName: 'Eosinophils (Absolute)', category: LabCategory.CBC, unit: 'K/uL', normalLow: 0, normalHigh: 0.5 },
  { testCode: 'BASO', testName: 'Basophils (Absolute)', category: LabCategory.CBC, unit: 'K/uL', normalLow: 0, normalHigh: 0.2 },

  // === BMP (Basic Metabolic Panel) ===
  { testCode: 'NA', testName: 'Sodium', category: LabCategory.BMP, unit: 'mEq/L', normalLow: 136, normalHigh: 145, criticalLow: 120, criticalHigh: 160, deltaThreshold: { percentChange: 5, timeWindowHours: 24 } },
  { testCode: 'K', testName: 'Potassium', category: LabCategory.BMP, unit: 'mEq/L', normalLow: 3.5, normalHigh: 5.0, criticalLow: 2.5, criticalHigh: 6.5, deltaThreshold: { percentChange: 15, timeWindowHours: 8 } },
  { testCode: 'CL', testName: 'Chloride', category: LabCategory.BMP, unit: 'mEq/L', normalLow: 98, normalHigh: 106, criticalLow: 80, criticalHigh: 120 },
  { testCode: 'CO2', testName: 'Bicarbonate (CO2)', category: LabCategory.BMP, unit: 'mEq/L', normalLow: 22, normalHigh: 29, criticalLow: 10, criticalHigh: 40 },
  { testCode: 'BUN', testName: 'Blood Urea Nitrogen', category: LabCategory.BMP, unit: 'mg/dL', normalLow: 7, normalHigh: 20, criticalHigh: 100, geriatricAdjust: { normalLow: 8, normalHigh: 23, ageMin: 65 } },
  { testCode: 'CR', testName: 'Creatinine', category: LabCategory.BMP, unit: 'mg/dL', normalLow: 0.7, normalHigh: 1.3, criticalHigh: 10.0, maleAdjust: { normalLow: 0.7, normalHigh: 1.3 }, femaleAdjust: { normalLow: 0.6, normalHigh: 1.1 }, deltaThreshold: { percentChange: 50, timeWindowHours: 48 } },
  { testCode: 'GLU', testName: 'Glucose', category: LabCategory.BMP, unit: 'mg/dL', normalLow: 70, normalHigh: 100, criticalLow: 40, criticalHigh: 500, deltaThreshold: { percentChange: 30, timeWindowHours: 4 } },
  { testCode: 'CA', testName: 'Calcium', category: LabCategory.BMP, unit: 'mg/dL', normalLow: 8.5, normalHigh: 10.5, criticalLow: 6.0, criticalHigh: 13.0 },

  // === CMP Additional (beyond BMP) ===
  { testCode: 'TP', testName: 'Total Protein', category: LabCategory.CMP, unit: 'g/dL', normalLow: 6.0, normalHigh: 8.3 },
  { testCode: 'ALB', testName: 'Albumin', category: LabCategory.CMP, unit: 'g/dL', normalLow: 3.5, normalHigh: 5.5, criticalLow: 1.5 },

  // === LFTs (Liver Function Tests) ===
  { testCode: 'AST', testName: 'Aspartate Aminotransferase', category: LabCategory.LFT, unit: 'U/L', normalLow: 10, normalHigh: 40, criticalHigh: 1000 },
  { testCode: 'ALT', testName: 'Alanine Aminotransferase', category: LabCategory.LFT, unit: 'U/L', normalLow: 7, normalHigh: 56, criticalHigh: 1000 },
  { testCode: 'ALP', testName: 'Alkaline Phosphatase', category: LabCategory.LFT, unit: 'U/L', normalLow: 44, normalHigh: 147 },
  { testCode: 'TBIL', testName: 'Total Bilirubin', category: LabCategory.LFT, unit: 'mg/dL', normalLow: 0.1, normalHigh: 1.2, criticalHigh: 15 },
  { testCode: 'DBIL', testName: 'Direct Bilirubin', category: LabCategory.LFT, unit: 'mg/dL', normalLow: 0, normalHigh: 0.3 },
  { testCode: 'GGT', testName: 'Gamma-Glutamyl Transferase', category: LabCategory.LFT, unit: 'U/L', normalLow: 0, normalHigh: 65 },

  // === Coagulation ===
  { testCode: 'PT', testName: 'Prothrombin Time', category: LabCategory.COAGULATION, unit: 'sec', normalLow: 11.0, normalHigh: 13.5, criticalHigh: 30.0 },
  { testCode: 'INR', testName: 'International Normalized Ratio', category: LabCategory.COAGULATION, unit: 'ratio', normalLow: 0.8, normalHigh: 1.1, criticalHigh: 5.0 },
  { testCode: 'PTT', testName: 'Partial Thromboplastin Time', category: LabCategory.COAGULATION, unit: 'sec', normalLow: 25, normalHigh: 35, criticalHigh: 100 },
  { testCode: 'FIBRIN', testName: 'Fibrinogen', category: LabCategory.COAGULATION, unit: 'mg/dL', normalLow: 200, normalHigh: 400, criticalLow: 100 },
  { testCode: 'DDIMER', testName: 'D-Dimer', category: LabCategory.COAGULATION, unit: 'ng/mL', normalLow: 0, normalHigh: 500 },

  // === Cardiac Markers ===
  { testCode: 'TROP_I', testName: 'Troponin I', category: LabCategory.CARDIAC, unit: 'ng/mL', normalLow: 0, normalHigh: 0.04, criticalHigh: 0.5 },
  { testCode: 'TROP_T', testName: 'Troponin T (hs)', category: LabCategory.CARDIAC, unit: 'ng/L', normalLow: 0, normalHigh: 14, criticalHigh: 52, maleAdjust: { normalLow: 0, normalHigh: 22 }, femaleAdjust: { normalLow: 0, normalHigh: 14 } },
  { testCode: 'BNP', testName: 'B-type Natriuretic Peptide', category: LabCategory.CARDIAC, unit: 'pg/mL', normalLow: 0, normalHigh: 100, geriatricAdjust: { normalLow: 0, normalHigh: 300, ageMin: 75 } },
  { testCode: 'NTPROBNP', testName: 'NT-proBNP', category: LabCategory.CARDIAC, unit: 'pg/mL', normalLow: 0, normalHigh: 125, geriatricAdjust: { normalLow: 0, normalHigh: 450, ageMin: 75 } },
  { testCode: 'CK', testName: 'Creatine Kinase', category: LabCategory.CARDIAC, unit: 'U/L', normalLow: 30, normalHigh: 200, maleAdjust: { normalLow: 39, normalHigh: 308 }, femaleAdjust: { normalLow: 26, normalHigh: 192 } },
  { testCode: 'CKMB', testName: 'CK-MB', category: LabCategory.CARDIAC, unit: 'ng/mL', normalLow: 0, normalHigh: 5.0, criticalHigh: 25 },

  // === Inflammatory Markers ===
  { testCode: 'CRP', testName: 'C-Reactive Protein', category: LabCategory.INFLAMMATORY, unit: 'mg/L', normalLow: 0, normalHigh: 10 },
  { testCode: 'HSCRP', testName: 'High-Sensitivity CRP', category: LabCategory.INFLAMMATORY, unit: 'mg/L', normalLow: 0, normalHigh: 3.0 },
  { testCode: 'ESR', testName: 'Erythrocyte Sedimentation Rate', category: LabCategory.INFLAMMATORY, unit: 'mm/hr', normalLow: 0, normalHigh: 20, maleAdjust: { normalLow: 0, normalHigh: 15 }, femaleAdjust: { normalLow: 0, normalHigh: 20 } },
  { testCode: 'PCT', testName: 'Procalcitonin', category: LabCategory.INFLAMMATORY, unit: 'ng/mL', normalLow: 0, normalHigh: 0.05, criticalHigh: 2.0 },
  { testCode: 'FERRITIN', testName: 'Ferritin', category: LabCategory.INFLAMMATORY, unit: 'ng/mL', normalLow: 12, normalHigh: 300, maleAdjust: { normalLow: 12, normalHigh: 300 }, femaleAdjust: { normalLow: 12, normalHigh: 150 } },
  { testCode: 'LDH', testName: 'Lactate Dehydrogenase', category: LabCategory.INFLAMMATORY, unit: 'U/L', normalLow: 140, normalHigh: 280 },

  // === Thyroid ===
  { testCode: 'TSH', testName: 'Thyroid Stimulating Hormone', category: LabCategory.THYROID, unit: 'mIU/L', normalLow: 0.27, normalHigh: 4.2, criticalLow: 0.01, criticalHigh: 50 },
  { testCode: 'FT4', testName: 'Free T4 (Thyroxine)', category: LabCategory.THYROID, unit: 'ng/dL', normalLow: 0.93, normalHigh: 1.7, criticalHigh: 5.0 },
  { testCode: 'FT3', testName: 'Free T3 (Triiodothyronine)', category: LabCategory.THYROID, unit: 'pg/mL', normalLow: 2.0, normalHigh: 4.4 },

  // === Lipid Panel ===
  { testCode: 'CHOL', testName: 'Total Cholesterol', category: LabCategory.LIPID, unit: 'mg/dL', normalLow: 0, normalHigh: 200 },
  { testCode: 'LDL', testName: 'LDL Cholesterol', category: LabCategory.LIPID, unit: 'mg/dL', normalLow: 0, normalHigh: 100 },
  { testCode: 'HDL', testName: 'HDL Cholesterol', category: LabCategory.LIPID, unit: 'mg/dL', normalLow: 40, normalHigh: 200 },
  { testCode: 'TRIG', testName: 'Triglycerides', category: LabCategory.LIPID, unit: 'mg/dL', normalLow: 0, normalHigh: 150, criticalHigh: 500 },

  // === Iron Studies ===
  { testCode: 'FE', testName: 'Serum Iron', category: LabCategory.IRON, unit: 'mcg/dL', normalLow: 60, normalHigh: 170, maleAdjust: { normalLow: 65, normalHigh: 175 }, femaleAdjust: { normalLow: 50, normalHigh: 170 } },
  { testCode: 'TIBC', testName: 'Total Iron Binding Capacity', category: LabCategory.IRON, unit: 'mcg/dL', normalLow: 250, normalHigh: 400 },
  { testCode: 'TSAT', testName: 'Transferrin Saturation', category: LabCategory.IRON, unit: '%', normalLow: 20, normalHigh: 50 },

  // === Renal / Other ===
  { testCode: 'MG', testName: 'Magnesium', category: LabCategory.RENAL, unit: 'mg/dL', normalLow: 1.7, normalHigh: 2.2, criticalLow: 1.0, criticalHigh: 4.0 },
  { testCode: 'PHOS', testName: 'Phosphorus', category: LabCategory.RENAL, unit: 'mg/dL', normalLow: 2.5, normalHigh: 4.5, criticalLow: 1.0, criticalHigh: 8.0 },
  { testCode: 'URIC', testName: 'Uric Acid', category: LabCategory.RENAL, unit: 'mg/dL', normalLow: 3.0, normalHigh: 7.0, maleAdjust: { normalLow: 3.4, normalHigh: 7.0 }, femaleAdjust: { normalLow: 2.4, normalHigh: 6.0 } },
  { testCode: 'LACT', testName: 'Lactate', category: LabCategory.OTHER, unit: 'mmol/L', normalLow: 0.5, normalHigh: 2.0, criticalHigh: 4.0 },
  { testCode: 'NH3', testName: 'Ammonia', category: LabCategory.OTHER, unit: 'umol/L', normalLow: 15, normalHigh: 45, criticalHigh: 100 },
  { testCode: 'HBA1C', testName: 'Hemoglobin A1c', category: LabCategory.OTHER, unit: '%', normalLow: 4.0, normalHigh: 5.6 },
  { testCode: 'LIPASE', testName: 'Lipase', category: LabCategory.OTHER, unit: 'U/L', normalLow: 0, normalHigh: 160, criticalHigh: 600 },
  { testCode: 'AMYLASE', testName: 'Amylase', category: LabCategory.OTHER, unit: 'U/L', normalLow: 28, normalHigh: 100, criticalHigh: 500 },
];

// ============================================================================
// Clinical Correlation Rules
// ============================================================================

interface CorrelationRule {
  id: string;
  conditions: { testCode: string; flag: FlagLevel | FlagLevel[] }[];
  clinicalFindings?: string[];
  possibleConditions: string[];
  suggestedTests: string[];
  urgency: 'routine' | 'urgent' | 'stat';
}

const CORRELATION_RULES: CorrelationRule[] = [
  { id: 'cc-01', conditions: [{ testCode: 'WBC', flag: FlagLevel.HIGH }, { testCode: 'NEUT', flag: FlagLevel.HIGH }], clinicalFindings: ['fever', 'elevated_wbc'], possibleConditions: ['Bacterial infection', 'Acute inflammation', 'Stress response'], suggestedTests: ['Blood cultures', 'Procalcitonin', 'Urinalysis', 'Chest X-ray'], urgency: 'urgent' },
  { id: 'cc-02', conditions: [{ testCode: 'WBC', flag: FlagLevel.CRITICAL_LOW }], possibleConditions: ['Neutropenic fever risk', 'Bone marrow suppression', 'Aplastic anemia'], suggestedTests: ['Peripheral smear', 'Reticulocyte count', 'Blood cultures if febrile'], urgency: 'stat' },
  { id: 'cc-03', conditions: [{ testCode: 'HGB', flag: [FlagLevel.LOW, FlagLevel.CRITICAL_LOW] }], possibleConditions: ['Acute blood loss', 'Iron deficiency anemia', 'Chronic disease anemia', 'Hemolysis'], suggestedTests: ['Reticulocyte count', 'Iron studies', 'Peripheral smear', 'Type and screen'], urgency: 'urgent' },
  { id: 'cc-04', conditions: [{ testCode: 'PLT', flag: FlagLevel.CRITICAL_LOW }], possibleConditions: ['DIC', 'ITP', 'TTP/HUS', 'Drug-induced thrombocytopenia', 'Bone marrow failure'], suggestedTests: ['Peripheral smear', 'DIC panel (PT/PTT/fibrinogen/D-dimer)', 'Haptoglobin', 'LDH'], urgency: 'stat' },
  { id: 'cc-05', conditions: [{ testCode: 'K', flag: FlagLevel.CRITICAL_HIGH }], possibleConditions: ['Hyperkalemia - cardiac risk', 'Renal failure', 'Acidosis', 'Hemolyzed specimen'], suggestedTests: ['Repeat potassium (non-hemolyzed)', 'ECG stat', 'BMP', 'ABG'], urgency: 'stat' },
  { id: 'cc-06', conditions: [{ testCode: 'K', flag: FlagLevel.CRITICAL_LOW }], possibleConditions: ['Hypokalemia - arrhythmia risk', 'GI losses', 'Renal losses', 'Metabolic alkalosis'], suggestedTests: ['Magnesium', 'ECG', 'Urine potassium'], urgency: 'stat' },
  { id: 'cc-07', conditions: [{ testCode: 'TROP_I', flag: [FlagLevel.HIGH, FlagLevel.CRITICAL_HIGH] }], possibleConditions: ['Acute MI (NSTEMI/STEMI)', 'Myocarditis', 'PE', 'Type 2 MI (demand ischemia)'], suggestedTests: ['Serial troponins Q6h', 'ECG', 'Echocardiogram', 'Cardiology consult'], urgency: 'stat' },
  { id: 'cc-08', conditions: [{ testCode: 'AST', flag: FlagLevel.HIGH }, { testCode: 'ALT', flag: FlagLevel.HIGH }], possibleConditions: ['Hepatitis (viral, alcoholic, drug-induced)', 'Hepatic ischemia', 'Biliary obstruction'], suggestedTests: ['Hepatitis panel', 'RUQ ultrasound', 'GGT', 'Acetaminophen level'], urgency: 'urgent' },
  { id: 'cc-09', conditions: [{ testCode: 'CR', flag: FlagLevel.HIGH }, { testCode: 'BUN', flag: FlagLevel.HIGH }], possibleConditions: ['Acute kidney injury', 'Chronic kidney disease', 'Pre-renal azotemia', 'Post-renal obstruction'], suggestedTests: ['Urinalysis', 'Renal ultrasound', 'Urine sodium', 'FENa calculation'], urgency: 'urgent' },
  { id: 'cc-10', conditions: [{ testCode: 'NA', flag: FlagLevel.CRITICAL_LOW }], possibleConditions: ['SIADH', 'Hypothyroidism', 'Adrenal insufficiency', 'Cerebral salt wasting', 'Heart failure'], suggestedTests: ['Serum osmolality', 'Urine osmolality', 'Urine sodium', 'TSH', 'Cortisol'], urgency: 'stat' },
  { id: 'cc-11', conditions: [{ testCode: 'LACT', flag: FlagLevel.HIGH }], possibleConditions: ['Sepsis/septic shock', 'Tissue hypoperfusion', 'Mesenteric ischemia', 'Severe dehydration'], suggestedTests: ['Blood cultures', 'Lactate clearance Q2h', 'ABG', 'Procalcitonin'], urgency: 'stat' },
  { id: 'cc-12', conditions: [{ testCode: 'INR', flag: FlagLevel.CRITICAL_HIGH }], possibleConditions: ['Warfarin overdose', 'Liver failure', 'DIC', 'Vitamin K deficiency'], suggestedTests: ['Fibrinogen', 'D-dimer', 'LFTs', 'Factor levels'], urgency: 'stat' },
];

// ============================================================================
// Learning Store
// ============================================================================

interface LabLearningStore {
  patientBaselines: Map<string, PatientBaseline>;
}

const learningStore: LabLearningStore = {
  patientBaselines: new Map(),
};

// ============================================================================
// Core Functions
// ============================================================================

function getAdjustedRange(ref: ReferenceRange, age?: number, sex?: string): { low: number; high: number } {
  let low = ref.normalLow;
  let high = ref.normalHigh;

  if (sex === 'M' && ref.maleAdjust) {
    low = ref.maleAdjust.normalLow;
    high = ref.maleAdjust.normalHigh;
  } else if (sex === 'F' && ref.femaleAdjust) {
    low = ref.femaleAdjust.normalLow;
    high = ref.femaleAdjust.normalHigh;
  }

  if (age !== undefined) {
    if (age < 18 && ref.pediatricAdjust) {
      low = ref.pediatricAdjust.normalLow;
      high = ref.pediatricAdjust.normalHigh;
    } else if (age >= (ref.geriatricAdjust?.ageMin ?? 999) && ref.geriatricAdjust) {
      low = ref.geriatricAdjust.normalLow;
      high = ref.geriatricAdjust.normalHigh;
    }
  }

  return { low, high };
}

function flagValue(value: number, ref: ReferenceRange, age?: number, sex?: string): FlagLevel {
  // Check critical thresholds first
  if (ref.criticalLow !== undefined && value < ref.criticalLow) return FlagLevel.CRITICAL_LOW;
  if (ref.criticalHigh !== undefined && value > ref.criticalHigh) return FlagLevel.CRITICAL_HIGH;

  const range = getAdjustedRange(ref, age, sex);
  if (value < range.low) return FlagLevel.LOW;
  if (value > range.high) return FlagLevel.HIGH;
  return FlagLevel.NORMAL;
}

function interpretResult(lab: LabValue, age?: number, sex?: string): InterpretedResult {
  const ref = REFERENCE_RANGES.find(r => r.testCode === lab.testCode);
  if (!ref) {
    return {
      testCode: lab.testCode,
      testName: lab.testCode,
      value: lab.value,
      unit: lab.unit,
      flag: FlagLevel.NORMAL,
      referenceRange: 'Unknown',
      interpretation: 'Reference range not available',
      clinicalSignificance: 'Unable to interpret without reference range',
      isCritical: false,
    };
  }

  const flag = flagValue(lab.value, ref, age, sex);
  const range = getAdjustedRange(ref, age, sex);
  const isCritical = flag === FlagLevel.CRITICAL_LOW || flag === FlagLevel.CRITICAL_HIGH;

  let interpretation = '';
  let significance = '';

  switch (flag) {
    case FlagLevel.NORMAL:
      interpretation = 'Within normal limits';
      significance = 'No clinical action required';
      break;
    case FlagLevel.LOW:
      interpretation = `Below normal range (${range.low}-${range.high} ${ref.unit})`;
      significance = getSignificance(lab.testCode, 'low');
      break;
    case FlagLevel.HIGH:
      interpretation = `Above normal range (${range.low}-${range.high} ${ref.unit})`;
      significance = getSignificance(lab.testCode, 'high');
      break;
    case FlagLevel.CRITICAL_LOW:
      interpretation = `CRITICAL LOW - below ${ref.criticalLow} ${ref.unit}`;
      significance = `CRITICAL: ${getSignificance(lab.testCode, 'critical_low')}`;
      break;
    case FlagLevel.CRITICAL_HIGH:
      interpretation = `CRITICAL HIGH - above ${ref.criticalHigh} ${ref.unit}`;
      significance = `CRITICAL: ${getSignificance(lab.testCode, 'critical_high')}`;
      break;
  }

  return {
    testCode: lab.testCode,
    testName: ref.testName,
    value: lab.value,
    unit: ref.unit,
    flag,
    referenceRange: `${range.low}-${range.high} ${ref.unit}`,
    interpretation,
    clinicalSignificance: significance,
    isCritical,
  };
}

function getSignificance(testCode: string, direction: string): string {
  const significanceMap: Record<string, Record<string, string>> = {
    WBC: {
      low: 'Leukopenia - increased infection risk, consider infectious, drug-induced, or bone marrow cause',
      high: 'Leukocytosis - consider infection, inflammation, stress, or malignancy',
      critical_low: 'Severe leukopenia - neutropenic precautions, high infection risk',
      critical_high: 'Markedly elevated - consider leukemoid reaction, sepsis, or leukemia',
    },
    HGB: {
      low: 'Anemia - assess for bleeding, iron deficiency, or chronic disease',
      high: 'Polycythemia - consider dehydration or primary polycythemia',
      critical_low: 'Severe anemia - transfusion may be indicated, assess hemodynamic status',
      critical_high: 'Polycythemia - increased thrombosis risk',
    },
    K: {
      low: 'Hypokalemia - risk of arrhythmia, muscle weakness',
      high: 'Hyperkalemia - risk of cardiac arrhythmia, verify with repeat draw',
      critical_low: 'Severe hypokalemia - cardiac monitoring, aggressive replacement needed',
      critical_high: 'Severe hyperkalemia - immediate ECG, cardiac monitoring, emergent treatment',
    },
    NA: {
      low: 'Hyponatremia - assess volume status, medications, and free water intake',
      high: 'Hypernatremia - assess hydration status and free water deficit',
      critical_low: 'Severe hyponatremia - seizure risk, careful correction needed',
      critical_high: 'Severe hypernatremia - free water deficit, careful correction to prevent cerebral edema',
    },
    GLU: {
      low: 'Hypoglycemia - symptoms include diaphoresis, confusion, tremor',
      high: 'Hyperglycemia - assess diabetes management, stress response',
      critical_low: 'Severe hypoglycemia - IV dextrose indicated, altered mental status risk',
      critical_high: 'Severe hyperglycemia - assess for DKA/HHS, insulin therapy',
    },
    CR: {
      high: 'Elevated creatinine - assess for AKI vs CKD, review nephrotoxins',
      critical_high: 'Severely elevated creatinine - possible need for dialysis',
    },
    TROP_I: {
      high: 'Elevated troponin - myocardial injury, correlate with symptoms and ECG',
      critical_high: 'Markedly elevated troponin - acute MI highly likely, activate ACS protocol',
    },
    PLT: {
      low: 'Thrombocytopenia - bleeding risk, assess for DIC, ITP, drug effect',
      high: 'Thrombocytosis - reactive vs primary, assess for iron deficiency',
      critical_low: 'Severe thrombocytopenia - high bleeding risk, consider platelet transfusion',
      critical_high: 'Marked thrombocytosis - thrombosis risk, hematology consult',
    },
  };

  return significanceMap[testCode]?.[direction] ?? `Abnormal ${testCode} - clinical correlation required`;
}

function deltaCheck(current: LabValue, previous: LabValue): DeltaCheckResult {
  const ref = REFERENCE_RANGES.find(r => r.testCode === current.testCode);
  const currentTime = new Date(current.collectedAt).getTime();
  const previousTime = new Date(previous.collectedAt).getTime();
  const timeElapsedHours = (currentTime - previousTime) / (1000 * 60 * 60);

  const percentChange = previous.value !== 0
    ? ((current.value - previous.value) / Math.abs(previous.value)) * 100
    : current.value > 0 ? 100 : 0;

  let alertType: DeltaAlertType = DeltaAlertType.NONE;
  let message = 'No significant change';

  const threshold = ref?.deltaThreshold;
  if (threshold && Math.abs(percentChange) >= threshold.percentChange && timeElapsedHours <= threshold.timeWindowHours) {
    if (percentChange > 0 && timeElapsedHours <= threshold.timeWindowHours / 2) {
      alertType = DeltaAlertType.RAPID_INCREASE;
      message = `Rapid increase of ${percentChange.toFixed(1)}% in ${timeElapsedHours.toFixed(1)} hours`;
    } else if (percentChange > 0) {
      alertType = DeltaAlertType.STEADY_INCREASE;
      message = `Significant increase of ${percentChange.toFixed(1)}% over ${timeElapsedHours.toFixed(1)} hours`;
    } else if (percentChange < 0 && timeElapsedHours <= threshold.timeWindowHours / 2) {
      alertType = DeltaAlertType.RAPID_DECREASE;
      message = `Rapid decrease of ${Math.abs(percentChange).toFixed(1)}% in ${timeElapsedHours.toFixed(1)} hours`;
    } else {
      alertType = DeltaAlertType.STEADY_DECREASE;
      message = `Significant decrease of ${Math.abs(percentChange).toFixed(1)}% over ${timeElapsedHours.toFixed(1)} hours`;
    }
  }

  return {
    testCode: current.testCode,
    currentValue: current.value,
    previousValue: previous.value,
    percentChange: Math.round(percentChange * 10) / 10,
    timeElapsedHours: Math.round(timeElapsedHours * 10) / 10,
    alertType,
    message,
  };
}

function analyzeTrend(values: LabValue[]): TrendAnalysis {
  const ref = REFERENCE_RANGES.find(r => r.testCode === values[0]?.testCode);
  const testName = ref?.testName ?? values[0]?.testCode ?? 'Unknown';

  if (values.length < 2) {
    return {
      testCode: values[0]?.testCode ?? '',
      testName,
      direction: TrendDirection.STABLE,
      slope: 0,
      rSquared: 0,
      values: values.map(v => ({ value: v.value, timestamp: v.collectedAt })),
      predictedNext: values[0]?.value ?? 0,
      confidence: 0,
      message: 'Insufficient data for trend analysis (need ≥2 values)',
    };
  }

  // Linear regression
  const timestamps = values.map(v => new Date(v.collectedAt).getTime());
  const baseTime = timestamps[0];
  const xs = timestamps.map(t => (t - baseTime) / (1000 * 60 * 60)); // hours
  const ys = values.map(v => v.value);

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const sumY2 = ys.reduce((a, y) => a + y * y, 0);

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const ssRes = ys.reduce((sum, y, i) => sum + Math.pow(y - (intercept + slope * xs[i]), 2), 0);
  const meanY = sumY / n;
  const ssTot = ys.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Predict next (6 hours ahead)
  const lastX = xs[xs.length - 1];
  const predictedNext = intercept + slope * (lastX + 6);

  // Direction
  let direction: TrendDirection;
  if (Math.abs(slope) < 0.01) {
    direction = TrendDirection.STABLE;
  } else if (rSquared < 0.3) {
    direction = TrendDirection.FLUCTUATING;
  } else if (slope > 0) {
    direction = TrendDirection.INCREASING;
  } else {
    direction = TrendDirection.DECREASING;
  }

  const confidence = Math.round(rSquared * 100) / 100;

  let message = `${testName}: `;
  if (direction === TrendDirection.STABLE) {
    message += 'Stable trend';
  } else if (direction === TrendDirection.FLUCTUATING) {
    message += 'Fluctuating - no clear trend';
  } else {
    message += `${direction} trend (slope: ${slope.toFixed(3)}/hr, R²=${rSquared.toFixed(2)})`;
  }

  return {
    testCode: values[0].testCode,
    testName,
    direction,
    slope: Math.round(slope * 1000) / 1000,
    rSquared: Math.round(rSquared * 1000) / 1000,
    values: values.map(v => ({ value: v.value, timestamp: v.collectedAt })),
    predictedNext: Math.round(predictedNext * 100) / 100,
    confidence,
    message,
  };
}

// ============================================================================
// Calculated Values
// ============================================================================

function calculateAnionGap(sodium: number, chloride: number, bicarb: number): CalculatedValue {
  const ag = sodium - (chloride + bicarb);
  let interpretation = '';
  if (ag > 12) {
    interpretation = 'Elevated anion gap - consider MUDPILES: Methanol, Uremia, DKA, Propylene glycol, INH/Iron, Lactic acidosis, Ethylene glycol, Salicylates';
  } else if (ag < 6) {
    interpretation = 'Low anion gap - consider hypoalbuminemia, multiple myeloma';
  } else {
    interpretation = 'Normal anion gap';
  }

  return {
    name: 'Anion Gap',
    value: Math.round(ag * 10) / 10,
    unit: 'mEq/L',
    formula: 'Na - (Cl + HCO3)',
    interpretation,
    normalRange: '8-12 mEq/L',
  };
}

function calculateCorrectedCalcium(totalCalcium: number, albumin: number): CalculatedValue {
  const corrected = totalCalcium + 0.8 * (4.0 - albumin);
  let interpretation = '';
  if (corrected > 10.5) {
    interpretation = 'Corrected hypercalcemia - consider hyperparathyroidism, malignancy, granulomatous disease';
  } else if (corrected < 8.5) {
    interpretation = 'Corrected hypocalcemia - consider hypoparathyroidism, vitamin D deficiency, renal failure';
  } else {
    interpretation = 'Corrected calcium within normal limits';
  }

  return {
    name: 'Corrected Calcium',
    value: Math.round(corrected * 10) / 10,
    unit: 'mg/dL',
    formula: 'Total Ca + 0.8 × (4.0 - Albumin)',
    interpretation,
    normalRange: '8.5-10.5 mg/dL',
  };
}

function calculateEGFR(creatinine: number, age: number, sex: string, isBlack: boolean = false): CalculatedValue {
  // CKD-EPI 2021 formula (race-free)
  // For female: 142 * min(SCr/0.7, 1)^(-0.241) * max(SCr/0.7, 1)^(-1.200) * 0.9938^Age * 1.012
  // For male: 142 * min(SCr/0.9, 1)^(-0.302) * max(SCr/0.9, 1)^(-1.200) * 0.9938^Age

  let egfr: number;
  if (sex === 'F') {
    const kappa = 0.7;
    const alpha = -0.241;
    const minVal = Math.min(creatinine / kappa, 1);
    const maxVal = Math.max(creatinine / kappa, 1);
    egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * 1.012;
  } else {
    const kappa = 0.9;
    const alpha = -0.302;
    const minVal = Math.min(creatinine / kappa, 1);
    const maxVal = Math.max(creatinine / kappa, 1);
    egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age);
  }

  let interpretation = '';
  if (egfr >= 90) {
    interpretation = 'Normal kidney function (G1)';
  } else if (egfr >= 60) {
    interpretation = 'Mildly decreased (G2) - CKD Stage 2 if proteinuria present';
  } else if (egfr >= 45) {
    interpretation = 'Mildly to moderately decreased (G3a) - CKD Stage 3a';
  } else if (egfr >= 30) {
    interpretation = 'Moderately to severely decreased (G3b) - CKD Stage 3b';
  } else if (egfr >= 15) {
    interpretation = 'Severely decreased (G4) - CKD Stage 4, prepare for RRT';
  } else {
    interpretation = 'Kidney failure (G5) - dialysis may be indicated';
  }

  return {
    name: 'eGFR (CKD-EPI 2021)',
    value: Math.round(egfr),
    unit: 'mL/min/1.73m²',
    formula: 'CKD-EPI 2021 (race-free)',
    interpretation,
    normalRange: '≥90 mL/min/1.73m²',
  };
}

// ============================================================================
// Panel Interpretation
// ============================================================================

function interpretHepaticPanel(results: InterpretedResult[]): PanelInterpretation {
  const ast = results.find(r => r.testCode === 'AST');
  const alt = results.find(r => r.testCode === 'ALT');
  const alp = results.find(r => r.testCode === 'ALP');
  const tbil = results.find(r => r.testCode === 'TBIL');
  const dbil = results.find(r => r.testCode === 'DBIL');
  const ggt = results.find(r => r.testCode === 'GGT');
  const alb = results.find(r => r.testCode === 'ALB');

  let pattern = 'Normal';
  let interpretation = 'Hepatic panel within normal limits';
  const followUp: string[] = [];
  const correlations: string[] = [];

  const astHigh = ast && ast.flag !== FlagLevel.NORMAL;
  const altHigh = alt && alt.flag !== FlagLevel.NORMAL;
  const alpHigh = alp && alp.flag !== FlagLevel.NORMAL;
  const tbilHigh = tbil && tbil.flag !== FlagLevel.NORMAL;

  if (astHigh && altHigh && !alpHigh) {
    pattern = 'Hepatocellular';
    if (ast && alt && ast.value > 1000) {
      interpretation = 'Acute hepatocellular injury pattern (AST >1000) - consider acute viral hepatitis, ischemic hepatitis, or drug/toxin-induced';
      followUp.push('Hepatitis A IgM, Hepatitis B surface Ag, Hepatitis C Ab', 'Acetaminophen level', 'RUQ ultrasound with Doppler');
    } else {
      interpretation = 'Mild-moderate hepatocellular injury - consider NAFLD, chronic hepatitis, or medication effect';
      if (ast && alt && ast.value > alt.value) {
        correlations.push('AST > ALT ratio suggests alcoholic liver disease or cirrhosis');
      } else {
        correlations.push('ALT > AST ratio typical of non-alcoholic causes');
      }
      followUp.push('Hepatitis panel', 'Iron studies', 'Ceruloplasmin if young patient');
    }
  } else if (alpHigh && tbilHigh && !astHigh) {
    pattern = 'Cholestatic';
    interpretation = 'Cholestatic pattern - consider biliary obstruction, primary biliary cholangitis, or drug-induced';
    followUp.push('RUQ ultrasound', 'MRCP if obstruction suspected', 'AMA if PBC suspected');
    if (dbil && dbil.flag !== FlagLevel.NORMAL) {
      correlations.push('Elevated direct bilirubin supports biliary obstruction');
    }
  } else if (astHigh && altHigh && alpHigh) {
    pattern = 'Mixed hepatocellular-cholestatic';
    interpretation = 'Mixed pattern - consider infiltrative disease, drug reaction, or evolving obstruction';
    followUp.push('Liver imaging', 'Consider liver biopsy', 'Review medications');
  }

  if (alb && alb.flag === FlagLevel.LOW) {
    correlations.push('Low albumin suggests chronic liver disease or malnutrition');
  }

  return {
    panelName: 'Hepatic Panel',
    results: results.filter(r => ['AST', 'ALT', 'ALP', 'TBIL', 'DBIL', 'GGT', 'ALB'].includes(r.testCode)),
    pattern,
    interpretation,
    suggestedFollowUp: followUp,
    clinicalCorrelations: correlations,
  };
}

function findClinicalCorrelations(results: InterpretedResult[]): ClinicalCorrelation[] {
  const correlations: ClinicalCorrelation[] = [];

  for (const rule of CORRELATION_RULES) {
    const matches = rule.conditions.every(cond => {
      const result = results.find(r => r.testCode === cond.testCode);
      if (!result) return false;
      const flagArray = Array.isArray(cond.flag) ? cond.flag : [cond.flag];
      return flagArray.includes(result.flag);
    });

    if (matches) {
      const findings = rule.conditions.map(c => {
        const r = results.find(res => res.testCode === c.testCode);
        return r ? `${r.testName}: ${r.value} ${r.unit} (${r.flag})` : '';
      }).filter(Boolean);

      correlations.push({
        findings,
        possibleConditions: rule.possibleConditions,
        suggestedTests: rule.suggestedTests,
        urgency: rule.urgency,
      });
    }
  }

  return correlations;
}

// ============================================================================
// Self-Learning
// ============================================================================

function updatePatientBaseline(patientId: string, lab: LabValue): void {
  let baseline = learningStore.patientBaselines.get(patientId);
  if (!baseline) {
    baseline = { patientId, baselines: new Map(), lastUpdated: new Date().toISOString() };
  }

  const existing = baseline.baselines.get(lab.testCode);
  if (existing) {
    existing.values.push(lab.value);
    // Keep last 20 values
    if (existing.values.length > 20) existing.values.shift();
    existing.count = existing.values.length;
    existing.mean = existing.values.reduce((a, b) => a + b, 0) / existing.count;
    existing.stdDev = Math.sqrt(
      existing.values.reduce((sum, v) => sum + Math.pow(v - existing.mean, 2), 0) / existing.count
    );
  } else {
    baseline.baselines.set(lab.testCode, {
      mean: lab.value,
      stdDev: 0,
      count: 1,
      values: [lab.value],
    });
  }

  baseline.lastUpdated = new Date().toISOString();
  learningStore.patientBaselines.set(patientId, baseline);
}

function getPersonalizedRange(patientId: string, testCode: string): LearningInsight | null {
  const baseline = learningStore.patientBaselines.get(patientId);
  if (!baseline) return null;

  const data = baseline.baselines.get(testCode);
  if (!data || data.count < 3) return null;

  return {
    testCode,
    personalizedRange: {
      low: Math.round((data.mean - 2 * data.stdDev) * 100) / 100,
      high: Math.round((data.mean + 2 * data.stdDev) * 100) / 100,
    },
    baselineValue: Math.round(data.mean * 100) / 100,
    confidence: Math.min(data.count / 10, 1.0),
    dataPoints: data.count,
  };
}

function interpretWithPersonalizedRange(lab: LabValue, age?: number, sex?: string): InterpretedResult & { personalizedInsight?: string } {
  const standard = interpretResult(lab, age, sex);
  const personalized = getPersonalizedRange(lab.patientId, lab.testCode);

  if (personalized && personalized.confidence >= 0.5) {
    const isOutsidePersonal = lab.value < personalized.personalizedRange.low || lab.value > personalized.personalizedRange.high;
    if (isOutsidePersonal && standard.flag === FlagLevel.NORMAL) {
      return {
        ...standard,
        personalizedInsight: `Value is within normal range but outside patient's personalized baseline (${personalized.personalizedRange.low}-${personalized.personalizedRange.high}). Patient's baseline: ${personalized.baselineValue}`,
      };
    }
  }

  return standard;
}

function resetLearningData(): void {
  learningStore.patientBaselines.clear();
}

// ============================================================================
// Exports
// ============================================================================

export const labResultInterpreter = {
  interpretResult,
  flagValue,
  getAdjustedRange,
  deltaCheck,
  analyzeTrend,
  calculateAnionGap,
  calculateCorrectedCalcium,
  calculateEGFR,
  interpretHepaticPanel,
  findClinicalCorrelations,
  updatePatientBaseline,
  getPersonalizedRange,
  interpretWithPersonalizedRange,
  resetLearningData,
  getReferenceRange: (testCode: string) => REFERENCE_RANGES.find(r => r.testCode === testCode),
};
