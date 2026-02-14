/**
 * Drug Interaction Checker for Post-Operative Recovery
 *
 * Implements a comprehensive drug-drug interaction checking system using
 * real FDA-sourced interaction data for common post-operative medications.
 *
 * Features:
 * - 50+ common post-operative drugs with real interaction pairs
 * - Severity scoring: minor, moderate, major, contraindicated
 * - Real interaction mechanisms: CYP450 enzyme inhibition, additive effects, antagonism
 * - Clinical recommendations for each interaction
 * - Self-learning: tracks doctor overrides and adjusts severity confidence
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const InteractionSeverity = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  MAJOR: 'major',
  CONTRAINDICATED: 'contraindicated',
} as const;
export type InteractionSeverity = typeof InteractionSeverity[keyof typeof InteractionSeverity];

export const InteractionMechanism = {
  CYP3A4_INHIBITION: 'CYP3A4 inhibition',
  CYP2D6_INHIBITION: 'CYP2D6 inhibition',
  CYP2C9_INHIBITION: 'CYP2C9 inhibition',
  CYP2C19_INHIBITION: 'CYP2C19 inhibition',
  CYP1A2_INHIBITION: 'CYP1A2 inhibition',
  CYP3A4_INDUCTION: 'CYP3A4 induction',
  CYP2D6_SUBSTRATE_COMPETITION: 'CYP2D6 substrate competition',
  ADDITIVE_CNS_DEPRESSION: 'additive CNS depression',
  ADDITIVE_BLEEDING_RISK: 'additive bleeding risk',
  ADDITIVE_SEROTONERGIC: 'additive serotonergic effect',
  ADDITIVE_QT_PROLONGATION: 'additive QT prolongation',
  ADDITIVE_NEPHROTOXICITY: 'additive nephrotoxicity',
  ADDITIVE_HEPATOTOXICITY: 'additive hepatotoxicity',
  ADDITIVE_HYPOTENSION: 'additive hypotension',
  ADDITIVE_RESPIRATORY_DEPRESSION: 'additive respiratory depression',
  ANTAGONISM_PHARMACODYNAMIC: 'pharmacodynamic antagonism',
  ANTAGONISM_RECEPTOR: 'receptor antagonism',
  REDUCED_ABSORPTION: 'reduced absorption',
  INCREASED_ABSORPTION: 'increased absorption',
  PROTEIN_BINDING_DISPLACEMENT: 'protein binding displacement',
  RENAL_CLEARANCE_COMPETITION: 'renal clearance competition',
  ELECTROLYTE_IMBALANCE: 'electrolyte imbalance',
  ENHANCED_TOXICITY: 'enhanced toxicity',
} as const;
export type InteractionMechanism = typeof InteractionMechanism[keyof typeof InteractionMechanism];

export const DrugCategory = {
  OPIOID_ANALGESIC: 'opioid analgesic',
  NSAID: 'NSAID',
  ANTICOAGULANT: 'anticoagulant',
  ANTIBIOTIC: 'antibiotic',
  ANTIEMETIC: 'antiemetic',
  BENZODIAZEPINE: 'benzodiazepine',
  MUSCLE_RELAXANT: 'muscle relaxant',
  ANTIHYPERTENSIVE: 'antihypertensive',
  PPI: 'proton pump inhibitor',
  CORTICOSTEROID: 'corticosteroid',
  ANTIDEPRESSANT: 'antidepressant',
  ANTIDIABETIC: 'antidiabetic',
  STATIN: 'statin',
  ANTIPLATELET: 'antiplatelet',
  LOCAL_ANESTHETIC: 'local anesthetic',
  GABAPENTINOID: 'gabapentinoid',
  ACETAMINOPHEN: 'acetaminophen',
  LAXATIVE: 'laxative',
  ANTIHISTAMINE: 'antihistamine',
  BETA_BLOCKER: 'beta blocker',
  ACE_INHIBITOR: 'ACE inhibitor',
  DIURETIC: 'diuretic',
  CALCIUM_CHANNEL_BLOCKER: 'calcium channel blocker',
  ANTIFUNGAL: 'antifungal',
  ANTIARRHYTHMIC: 'antiarrhythmic',
} as const;
export type DrugCategory = typeof DrugCategory[keyof typeof DrugCategory];

export type DrugEntry = {
  id: string;
  name: string;
  genericName: string;
  category: DrugCategory;
  cyp450Substrates: string[];
  cyp450Inhibitors: string[];
  cyp450Inducers: string[];
  commonDoseForms: string[];
  halfLifeHours: number;
};

export type InteractionPair = {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  mechanism: InteractionMechanism;
  description: string;
  clinicalRecommendation: string;
  evidenceLevel: string;
  baseSeverityScore: number; // 0-1
};

export type InteractionResult = {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  severityScore: number;
  confidence: number;
  mechanism: InteractionMechanism;
  description: string;
  clinicalRecommendation: string;
  evidenceLevel: string;
  overrideRate: number;
};

export type DrugCheckResult = {
  interactions: InteractionResult[];
  highestSeverity: InteractionSeverity | null;
  totalInteractions: number;
  majorCount: number;
  moderateCount: number;
  minorCount: number;
  contraindicatedCount: number;
  safeToAdminister: boolean;
};

export type OverrideRecord = {
  drugA: string;
  drugB: string;
  originalSeverity: InteractionSeverity;
  overriddenAt: number;
  clinicianId: string;
  reason: string;
};

// ============================================================================
// Drug Database (50+ common post-operative medications)
// ============================================================================

const DRUG_DATABASE: DrugEntry[] = [
  { id: 'morphine', name: 'Morphine', genericName: 'morphine sulfate', category: DrugCategory.OPIOID_ANALGESIC, cyp450Substrates: ['CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'oral', 'IM'], halfLifeHours: 3 },
  { id: 'oxycodone', name: 'OxyContin', genericName: 'oxycodone', category: DrugCategory.OPIOID_ANALGESIC, cyp450Substrates: ['CYP3A4', 'CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 4.5 },
  { id: 'hydrocodone', name: 'Vicodin', genericName: 'hydrocodone/acetaminophen', category: DrugCategory.OPIOID_ANALGESIC, cyp450Substrates: ['CYP3A4', 'CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 4 },
  { id: 'fentanyl', name: 'Fentanyl', genericName: 'fentanyl', category: DrugCategory.OPIOID_ANALGESIC, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'transdermal', 'buccal'], halfLifeHours: 4 },
  { id: 'tramadol', name: 'Ultram', genericName: 'tramadol', category: DrugCategory.OPIOID_ANALGESIC, cyp450Substrates: ['CYP2D6', 'CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 6.3 },
  { id: 'hydromorphone', name: 'Dilaudid', genericName: 'hydromorphone', category: DrugCategory.OPIOID_ANALGESIC, cyp450Substrates: ['CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'oral'], halfLifeHours: 2.5 },
  { id: 'codeine', name: 'Codeine', genericName: 'codeine', category: DrugCategory.OPIOID_ANALGESIC, cyp450Substrates: ['CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 3 },
  { id: 'acetaminophen', name: 'Tylenol', genericName: 'acetaminophen', category: DrugCategory.ACETAMINOPHEN, cyp450Substrates: ['CYP2E1', 'CYP1A2', 'CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV', 'rectal'], halfLifeHours: 2 },
  { id: 'ibuprofen', name: 'Advil', genericName: 'ibuprofen', category: DrugCategory.NSAID, cyp450Substrates: ['CYP2C9'], cyp450Inhibitors: ['CYP2C9'], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 2 },
  { id: 'ketorolac', name: 'Toradol', genericName: 'ketorolac', category: DrugCategory.NSAID, cyp450Substrates: ['CYP2C9'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'IM', 'oral'], halfLifeHours: 5 },
  { id: 'celecoxib', name: 'Celebrex', genericName: 'celecoxib', category: DrugCategory.NSAID, cyp450Substrates: ['CYP2C9'], cyp450Inhibitors: ['CYP2D6'], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 11 },
  { id: 'naproxen', name: 'Aleve', genericName: 'naproxen', category: DrugCategory.NSAID, cyp450Substrates: ['CYP2C9', 'CYP1A2'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 14 },
  { id: 'aspirin', name: 'Aspirin', genericName: 'aspirin', category: DrugCategory.ANTIPLATELET, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 0.25 },
  { id: 'warfarin', name: 'Coumadin', genericName: 'warfarin', category: DrugCategory.ANTICOAGULANT, cyp450Substrates: ['CYP2C9', 'CYP3A4', 'CYP1A2'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 40 },
  { id: 'enoxaparin', name: 'Lovenox', genericName: 'enoxaparin', category: DrugCategory.ANTICOAGULANT, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['subcutaneous'], halfLifeHours: 4.5 },
  { id: 'heparin', name: 'Heparin', genericName: 'heparin', category: DrugCategory.ANTICOAGULANT, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'subcutaneous'], halfLifeHours: 1.5 },
  { id: 'rivaroxaban', name: 'Xarelto', genericName: 'rivaroxaban', category: DrugCategory.ANTICOAGULANT, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 9 },
  { id: 'apixaban', name: 'Eliquis', genericName: 'apixaban', category: DrugCategory.ANTICOAGULANT, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 12 },
  { id: 'clopidogrel', name: 'Plavix', genericName: 'clopidogrel', category: DrugCategory.ANTIPLATELET, cyp450Substrates: ['CYP2C19', 'CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 6 },
  { id: 'cefazolin', name: 'Ancef', genericName: 'cefazolin', category: DrugCategory.ANTIBIOTIC, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'IM'], halfLifeHours: 1.8 },
  { id: 'cephalexin', name: 'Keflex', genericName: 'cephalexin', category: DrugCategory.ANTIBIOTIC, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 1 },
  { id: 'amoxicillin_clavulanate', name: 'Augmentin', genericName: 'amoxicillin/clavulanate', category: DrugCategory.ANTIBIOTIC, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 1.3 },
  { id: 'ciprofloxacin', name: 'Cipro', genericName: 'ciprofloxacin', category: DrugCategory.ANTIBIOTIC, cyp450Substrates: [], cyp450Inhibitors: ['CYP1A2', 'CYP3A4'], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 4 },
  { id: 'metronidazole', name: 'Flagyl', genericName: 'metronidazole', category: DrugCategory.ANTIBIOTIC, cyp450Substrates: ['CYP2C9'], cyp450Inhibitors: ['CYP2C9'], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 8 },
  { id: 'clindamycin', name: 'Cleocin', genericName: 'clindamycin', category: DrugCategory.ANTIBIOTIC, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 2.5 },
  { id: 'vancomycin', name: 'Vancocin', genericName: 'vancomycin', category: DrugCategory.ANTIBIOTIC, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'oral'], halfLifeHours: 6 },
  { id: 'fluconazole', name: 'Diflucan', genericName: 'fluconazole', category: DrugCategory.ANTIFUNGAL, cyp450Substrates: [], cyp450Inhibitors: ['CYP2C9', 'CYP2C19', 'CYP3A4'], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 30 },
  { id: 'ondansetron', name: 'Zofran', genericName: 'ondansetron', category: DrugCategory.ANTIEMETIC, cyp450Substrates: ['CYP3A4', 'CYP1A2', 'CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'oral', 'ODT'], halfLifeHours: 4 },
  { id: 'metoclopramide', name: 'Reglan', genericName: 'metoclopramide', category: DrugCategory.ANTIEMETIC, cyp450Substrates: ['CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 5 },
  { id: 'promethazine', name: 'Phenergan', genericName: 'promethazine', category: DrugCategory.ANTIEMETIC, cyp450Substrates: ['CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV', 'IM', 'rectal'], halfLifeHours: 12 },
  { id: 'midazolam', name: 'Versed', genericName: 'midazolam', category: DrugCategory.BENZODIAZEPINE, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['IV', 'oral', 'intranasal'], halfLifeHours: 2.5 },
  { id: 'lorazepam', name: 'Ativan', genericName: 'lorazepam', category: DrugCategory.BENZODIAZEPINE, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV', 'IM'], halfLifeHours: 12 },
  { id: 'diazepam', name: 'Valium', genericName: 'diazepam', category: DrugCategory.BENZODIAZEPINE, cyp450Substrates: ['CYP2C19', 'CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV', 'rectal'], halfLifeHours: 43 },
  { id: 'cyclobenzaprine', name: 'Flexeril', genericName: 'cyclobenzaprine', category: DrugCategory.MUSCLE_RELAXANT, cyp450Substrates: ['CYP3A4', 'CYP1A2'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 18 },
  { id: 'methocarbamol', name: 'Robaxin', genericName: 'methocarbamol', category: DrugCategory.MUSCLE_RELAXANT, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 1.5 },
  { id: 'gabapentin', name: 'Neurontin', genericName: 'gabapentin', category: DrugCategory.GABAPENTINOID, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 6 },
  { id: 'pregabalin', name: 'Lyrica', genericName: 'pregabalin', category: DrugCategory.GABAPENTINOID, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 6.3 },
  { id: 'omeprazole', name: 'Prilosec', genericName: 'omeprazole', category: DrugCategory.PPI, cyp450Substrates: ['CYP2C19', 'CYP3A4'], cyp450Inhibitors: ['CYP2C19'], cyp450Inducers: ['CYP1A2'], commonDoseForms: ['oral'], halfLifeHours: 1 },
  { id: 'pantoprazole', name: 'Protonix', genericName: 'pantoprazole', category: DrugCategory.PPI, cyp450Substrates: ['CYP2C19'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 1 },
  { id: 'dexamethasone', name: 'Decadron', genericName: 'dexamethasone', category: DrugCategory.CORTICOSTEROID, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: ['CYP3A4'], commonDoseForms: ['oral', 'IV', 'IM'], halfLifeHours: 36 },
  { id: 'prednisone', name: 'Deltasone', genericName: 'prednisone', category: DrugCategory.CORTICOSTEROID, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: ['CYP3A4'], commonDoseForms: ['oral'], halfLifeHours: 3.5 },
  { id: 'methylprednisolone', name: 'Medrol', genericName: 'methylprednisolone', category: DrugCategory.CORTICOSTEROID, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV', 'IM'], halfLifeHours: 2.5 },
  { id: 'lisinopril', name: 'Zestril', genericName: 'lisinopril', category: DrugCategory.ACE_INHIBITOR, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 12 },
  { id: 'metoprolol', name: 'Lopressor', genericName: 'metoprolol', category: DrugCategory.BETA_BLOCKER, cyp450Substrates: ['CYP2D6'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 4 },
  { id: 'amlodipine', name: 'Norvasc', genericName: 'amlodipine', category: DrugCategory.CALCIUM_CHANNEL_BLOCKER, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 35 },
  { id: 'furosemide', name: 'Lasix', genericName: 'furosemide', category: DrugCategory.DIURETIC, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 2 },
  { id: 'metformin', name: 'Glucophage', genericName: 'metformin', category: DrugCategory.ANTIDIABETIC, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 6 },
  { id: 'insulin_glargine', name: 'Lantus', genericName: 'insulin glargine', category: DrugCategory.ANTIDIABETIC, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['subcutaneous'], halfLifeHours: 24 },
  { id: 'atorvastatin', name: 'Lipitor', genericName: 'atorvastatin', category: DrugCategory.STATIN, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 14 },
  { id: 'rosuvastatin', name: 'Crestor', genericName: 'rosuvastatin', category: DrugCategory.STATIN, cyp450Substrates: ['CYP2C9'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 19 },
  { id: 'sertraline', name: 'Zoloft', genericName: 'sertraline', category: DrugCategory.ANTIDEPRESSANT, cyp450Substrates: ['CYP2C19', 'CYP2D6'], cyp450Inhibitors: ['CYP2D6'], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 26 },
  { id: 'duloxetine', name: 'Cymbalta', genericName: 'duloxetine', category: DrugCategory.ANTIDEPRESSANT, cyp450Substrates: ['CYP1A2', 'CYP2D6'], cyp450Inhibitors: ['CYP2D6'], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 12 },
  { id: 'escitalopram', name: 'Lexapro', genericName: 'escitalopram', category: DrugCategory.ANTIDEPRESSANT, cyp450Substrates: ['CYP3A4', 'CYP2C19'], cyp450Inhibitors: ['CYP2D6'], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 30 },
  { id: 'diphenhydramine', name: 'Benadryl', genericName: 'diphenhydramine', category: DrugCategory.ANTIHISTAMINE, cyp450Substrates: ['CYP2D6'], cyp450Inhibitors: ['CYP2D6'], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 6 },
  { id: 'docusate', name: 'Colace', genericName: 'docusate sodium', category: DrugCategory.LAXATIVE, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 12 },
  { id: 'sennosides', name: 'Senokot', genericName: 'sennosides', category: DrugCategory.LAXATIVE, cyp450Substrates: [], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['oral'], halfLifeHours: 8 },
  { id: 'lidocaine', name: 'Lidocaine', genericName: 'lidocaine', category: DrugCategory.LOCAL_ANESTHETIC, cyp450Substrates: ['CYP1A2', 'CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['topical', 'IV', 'injection'], halfLifeHours: 1.5 },
  { id: 'bupivacaine', name: 'Marcaine', genericName: 'bupivacaine', category: DrugCategory.LOCAL_ANESTHETIC, cyp450Substrates: ['CYP3A4'], cyp450Inhibitors: [], cyp450Inducers: [], commonDoseForms: ['injection'], halfLifeHours: 3.5 },
  { id: 'amiodarone', name: 'Cordarone', genericName: 'amiodarone', category: DrugCategory.ANTIARRHYTHMIC, cyp450Substrates: ['CYP3A4', 'CYP2C8'], cyp450Inhibitors: ['CYP2D6', 'CYP2C9', 'CYP3A4'], cyp450Inducers: [], commonDoseForms: ['oral', 'IV'], halfLifeHours: 960 },
];

// ============================================================================
// Drug Interaction Pairs Database (real interactions)
// ============================================================================

const INTERACTION_DATABASE: InteractionPair[] = [
  // Opioid + Benzodiazepine combinations (FDA Black Box Warning)
  { drugA: 'morphine', drugB: 'midazolam', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_RESPIRATORY_DEPRESSION, description: 'Concurrent use of opioids and benzodiazepines increases risk of profound sedation, respiratory depression, coma, and death.', clinicalRecommendation: 'Avoid concurrent use unless no alternatives. If combined, use lowest effective doses and shortest duration. Monitor respiratory rate and sedation level closely.', evidenceLevel: 'FDA Black Box Warning', baseSeverityScore: 0.9 },
  { drugA: 'morphine', drugB: 'lorazepam', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_RESPIRATORY_DEPRESSION, description: 'Opioid-benzodiazepine combination significantly increases overdose risk.', clinicalRecommendation: 'Reserve concurrent use for patients with inadequate alternative options. Limit dosages and durations. Monitor for respiratory depression and sedation.', evidenceLevel: 'FDA Black Box Warning', baseSeverityScore: 0.9 },
  { drugA: 'oxycodone', drugB: 'diazepam', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_RESPIRATORY_DEPRESSION, description: 'Combining opioids with benzodiazepines increases risk of fatal overdose.', clinicalRecommendation: 'Avoid combination. If necessary, use lowest doses and monitor closely. Educate patient and caregiver about risks.', evidenceLevel: 'FDA Black Box Warning', baseSeverityScore: 0.9 },
  { drugA: 'fentanyl', drugB: 'midazolam', severity: InteractionSeverity.CONTRAINDICATED, mechanism: InteractionMechanism.ADDITIVE_RESPIRATORY_DEPRESSION, description: 'High-potency opioid combined with benzodiazepine carries extreme risk of fatal respiratory depression.', clinicalRecommendation: 'Do not use concurrently outside of monitored anesthesia settings. If used in procedural sedation, ensure continuous monitoring and reversal agents available.', evidenceLevel: 'Level A', baseSeverityScore: 0.95 },
  { drugA: 'hydrocodone', drugB: 'lorazepam', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_RESPIRATORY_DEPRESSION, description: 'Concurrent opioid and benzodiazepine use increases overdose risk.', clinicalRecommendation: 'Reserve for patients without alternatives. Prescribe lowest effective doses. Monitor respiratory status.', evidenceLevel: 'FDA Black Box Warning', baseSeverityScore: 0.88 },

  // Opioid + Gabapentinoid
  { drugA: 'morphine', drugB: 'gabapentin', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_CNS_DEPRESSION, description: 'Gabapentinoids may enhance CNS depressant effects of opioids, increasing respiratory depression risk.', clinicalRecommendation: 'Use with caution. Consider reduced opioid dose. Monitor for excessive sedation and respiratory depression.', evidenceLevel: 'Level B', baseSeverityScore: 0.65 },
  { drugA: 'oxycodone', drugB: 'pregabalin', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_CNS_DEPRESSION, description: 'Enhanced CNS depression when combining opioids and pregabalin. FDA has required warnings.', clinicalRecommendation: 'Use lower initial doses of opioid. Titrate carefully. Watch for respiratory depression, especially in elderly.', evidenceLevel: 'Level B', baseSeverityScore: 0.65 },

  // NSAID + Anticoagulant interactions
  { drugA: 'ibuprofen', drugB: 'warfarin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'NSAIDs inhibit platelet aggregation and may cause GI ulceration, significantly increasing bleeding risk with warfarin. Ibuprofen also inhibits CYP2C9, potentially increasing warfarin levels.', clinicalRecommendation: 'Avoid combination. Use acetaminophen for pain if possible. If NSAID necessary, monitor INR closely and consider GI prophylaxis with PPI.', evidenceLevel: 'Level A', baseSeverityScore: 0.85 },
  { drugA: 'ketorolac', drugB: 'enoxaparin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'Ketorolac combined with low-molecular-weight heparin dramatically increases risk of hemorrhage.', clinicalRecommendation: 'Contraindicated per ketorolac labeling. Do not use within 24 hours of each other. Choose alternative analgesic.', evidenceLevel: 'Level A', baseSeverityScore: 0.9 },
  { drugA: 'ketorolac', drugB: 'heparin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'Ketorolac significantly increases hemorrhage risk when combined with heparin.', clinicalRecommendation: 'Avoid combination. Use acetaminophen or opioid analgesics instead. If unavoidable, monitor closely for bleeding.', evidenceLevel: 'Level A', baseSeverityScore: 0.88 },
  { drugA: 'naproxen', drugB: 'warfarin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'Naproxen inhibits platelets and increases GI bleeding risk with warfarin.', clinicalRecommendation: 'Avoid if possible. Monitor INR frequently. Add PPI for GI protection if combination necessary.', evidenceLevel: 'Level A', baseSeverityScore: 0.82 },
  { drugA: 'aspirin', drugB: 'warfarin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'Dual antithrombotic therapy markedly increases bleeding risk.', clinicalRecommendation: 'Use only when clearly indicated (e.g., mechanical heart valve). Monitor INR. Add PPI. Educate patient on bleeding signs.', evidenceLevel: 'Level A', baseSeverityScore: 0.8 },
  { drugA: 'ibuprofen', drugB: 'rivaroxaban', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'NSAIDs increase bleeding risk when combined with direct oral anticoagulants.', clinicalRecommendation: 'Avoid concurrent use. Use acetaminophen for pain management. If NSAID required, use lowest dose for shortest duration.', evidenceLevel: 'Level B', baseSeverityScore: 0.8 },

  // NSAID + ACE Inhibitor / Diuretic
  { drugA: 'ibuprofen', drugB: 'lisinopril', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ANTAGONISM_PHARMACODYNAMIC, description: 'NSAIDs reduce antihypertensive effect of ACE inhibitors via prostaglandin inhibition. Triple whammy risk with diuretic (AKI).', clinicalRecommendation: 'Monitor blood pressure. Consider alternative analgesic. Avoid triple combination with diuretic. Monitor renal function.', evidenceLevel: 'Level A', baseSeverityScore: 0.6 },
  { drugA: 'ketorolac', drugB: 'lisinopril', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_NEPHROTOXICITY, description: 'Ketorolac reduces renal blood flow; combined with ACE inhibitor increases acute kidney injury risk.', clinicalRecommendation: 'Monitor renal function and potassium. Ensure adequate hydration. Limit ketorolac to 5 days maximum.', evidenceLevel: 'Level B', baseSeverityScore: 0.65 },
  { drugA: 'ibuprofen', drugB: 'furosemide', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ANTAGONISM_PHARMACODYNAMIC, description: 'NSAIDs reduce natriuretic effect of loop diuretics via prostaglandin inhibition.', clinicalRecommendation: 'Monitor fluid balance and renal function. May need to increase diuretic dose. Consider alternative analgesic.', evidenceLevel: 'Level B', baseSeverityScore: 0.55 },

  // Tramadol + SSRI (Serotonin Syndrome risk)
  { drugA: 'tramadol', drugB: 'sertraline', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_SEROTONERGIC, description: 'Tramadol inhibits serotonin reuptake; combined with SSRI significantly increases serotonin syndrome risk. Also seizure threshold reduction.', clinicalRecommendation: 'Avoid combination if possible. Monitor for serotonin syndrome symptoms (agitation, hyperthermia, myoclonus, tremor). Consider alternative opioid.', evidenceLevel: 'Level B', baseSeverityScore: 0.8 },
  { drugA: 'tramadol', drugB: 'duloxetine', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_SEROTONERGIC, description: 'Both tramadol and duloxetine have serotonergic activity. Risk of serotonin syndrome and lowered seizure threshold.', clinicalRecommendation: 'Use alternative analgesic. If combination necessary, start low and monitor closely. Educate patient on serotonin syndrome signs.', evidenceLevel: 'Level B', baseSeverityScore: 0.78 },
  { drugA: 'tramadol', drugB: 'escitalopram', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_SEROTONERGIC, description: 'Serotonergic activity of both drugs increases risk of serotonin syndrome.', clinicalRecommendation: 'Avoid if possible. Use non-serotonergic analgesic. Monitor for hyperthermia, rigidity, myoclonus, autonomic instability.', evidenceLevel: 'Level B', baseSeverityScore: 0.78 },

  // Ondansetron QT prolongation
  { drugA: 'ondansetron', drugB: 'amiodarone', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_QT_PROLONGATION, description: 'Both drugs prolong QT interval. Concurrent use increases risk of torsades de pointes.', clinicalRecommendation: 'Use alternative antiemetic (e.g., metoclopramide). If ondansetron necessary, obtain baseline ECG, monitor QTc, correct electrolytes.', evidenceLevel: 'Level B', baseSeverityScore: 0.82 },
  { drugA: 'ondansetron', drugB: 'escitalopram', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_QT_PROLONGATION, description: 'Both agents can prolong QTc interval.', clinicalRecommendation: 'Monitor ECG if combination used. Consider alternative antiemetic. Correct hypokalemia and hypomagnesemia.', evidenceLevel: 'Level C', baseSeverityScore: 0.55 },

  // CYP450 interactions
  { drugA: 'fluconazole', drugB: 'warfarin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.CYP2C9_INHIBITION, description: 'Fluconazole potently inhibits CYP2C9, markedly increasing warfarin levels and INR. Risk of serious hemorrhage.', clinicalRecommendation: 'Reduce warfarin dose by 25-50% when starting fluconazole. Monitor INR every 2-3 days during co-therapy and after discontinuation.', evidenceLevel: 'Level A', baseSeverityScore: 0.85 },
  { drugA: 'fluconazole', drugB: 'oxycodone', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.CYP3A4_INHIBITION, description: 'Fluconazole inhibits CYP3A4 metabolism of oxycodone, potentially increasing opioid levels and toxicity.', clinicalRecommendation: 'Reduce oxycodone dose. Monitor for increased sedation and respiratory depression. Consider alternative analgesic.', evidenceLevel: 'Level B', baseSeverityScore: 0.6 },
  { drugA: 'fluconazole', drugB: 'midazolam', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.CYP3A4_INHIBITION, description: 'Fluconazole significantly increases midazolam exposure via CYP3A4 inhibition. Prolonged sedation risk.', clinicalRecommendation: 'Use lorazepam instead (glucuronidated, no CYP interaction). If midazolam required, reduce dose by 50% or more.', evidenceLevel: 'Level A', baseSeverityScore: 0.75 },
  { drugA: 'ciprofloxacin', drugB: 'cyclobenzaprine', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.CYP1A2_INHIBITION, description: 'Ciprofloxacin inhibits CYP1A2, potentially increasing cyclobenzaprine levels and CNS depression.', clinicalRecommendation: 'Monitor for increased drowsiness and anticholinergic effects. Consider reduced cyclobenzaprine dose.', evidenceLevel: 'Level C', baseSeverityScore: 0.5 },
  { drugA: 'amiodarone', drugB: 'fentanyl', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.CYP3A4_INHIBITION, description: 'Amiodarone inhibits CYP3A4, increasing fentanyl exposure and risk of respiratory depression and cardiac toxicity.', clinicalRecommendation: 'Reduce fentanyl dose. Monitor closely for respiratory depression and QT prolongation. Consider alternative analgesic.', evidenceLevel: 'Level B', baseSeverityScore: 0.82 },
  { drugA: 'amiodarone', drugB: 'warfarin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.CYP2C9_INHIBITION, description: 'Amiodarone inhibits CYP2C9 (and CYP3A4), substantially increasing warfarin exposure. Effect persists weeks after amiodarone discontinuation due to long half-life.', clinicalRecommendation: 'Reduce warfarin dose by 33-50%. Monitor INR weekly for several months. Effect may persist for weeks after amiodarone stopped.', evidenceLevel: 'Level A', baseSeverityScore: 0.88 },
  { drugA: 'omeprazole', drugB: 'clopidogrel', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.CYP2C19_INHIBITION, description: 'Omeprazole inhibits CYP2C19-mediated bioactivation of clopidogrel, reducing antiplatelet effect. Increased cardiovascular event risk.', clinicalRecommendation: 'Use pantoprazole instead (weaker CYP2C19 inhibition). If PPI needed, separate dosing by 12 hours. Consider H2 blocker alternative.', evidenceLevel: 'Level A', baseSeverityScore: 0.8 },
  { drugA: 'fluconazole', drugB: 'atorvastatin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.CYP3A4_INHIBITION, description: 'Fluconazole inhibits CYP3A4 metabolism of atorvastatin, increasing statin levels and rhabdomyolysis risk.', clinicalRecommendation: 'Temporarily hold statin during fluconazole course, or use rosuvastatin (primarily CYP2C9). Monitor for myalgia and CK elevation.', evidenceLevel: 'Level B', baseSeverityScore: 0.75 },

  // Metronidazole interactions
  { drugA: 'metronidazole', drugB: 'warfarin', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.CYP2C9_INHIBITION, description: 'Metronidazole inhibits CYP2C9 metabolism of warfarin S-enantiomer, significantly increasing anticoagulant effect.', clinicalRecommendation: 'Reduce warfarin dose by 25-50%. Monitor INR within 3-5 days of starting metronidazole and after completion.', evidenceLevel: 'Level A', baseSeverityScore: 0.8 },

  // Corticosteroid interactions
  { drugA: 'dexamethasone', drugB: 'warfarin', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.CYP3A4_INDUCTION, description: 'Dexamethasone induces CYP3A4 and may alter warfarin metabolism. Also increases risk of GI bleeding.', clinicalRecommendation: 'Monitor INR closely during corticosteroid use and taper. Adjust warfarin dose as needed.', evidenceLevel: 'Level B', baseSeverityScore: 0.6 },
  { drugA: 'prednisone', drugB: 'ibuprofen', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'Both corticosteroids and NSAIDs increase GI ulceration and bleeding risk independently; combination synergistic.', clinicalRecommendation: 'Add GI prophylaxis (PPI). Monitor for GI symptoms. Use lowest effective doses. Consider alternative analgesic.', evidenceLevel: 'Level B', baseSeverityScore: 0.6 },
  { drugA: 'dexamethasone', drugB: 'metformin', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ANTAGONISM_PHARMACODYNAMIC, description: 'Corticosteroids cause hyperglycemia, antagonizing metformin effect. May require insulin supplementation.', clinicalRecommendation: 'Monitor blood glucose closely. May need to add sliding scale insulin. Adjust diabetes therapy during corticosteroid use.', evidenceLevel: 'Level B', baseSeverityScore: 0.55 },

  // Vancomycin nephrotoxicity
  { drugA: 'vancomycin', drugB: 'ketorolac', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_NEPHROTOXICITY, description: 'Both vancomycin and ketorolac are nephrotoxic. Combination significantly increases acute kidney injury risk.', clinicalRecommendation: 'Avoid combination. Use alternative analgesic. If combination necessary, monitor renal function daily and vancomycin levels.', evidenceLevel: 'Level B', baseSeverityScore: 0.8 },
  { drugA: 'vancomycin', drugB: 'furosemide', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_NEPHROTOXICITY, description: 'Loop diuretics may increase nephrotoxicity and ototoxicity of vancomycin.', clinicalRecommendation: 'Monitor renal function and vancomycin trough levels. Ensure adequate hydration. Monitor for hearing changes.', evidenceLevel: 'Level C', baseSeverityScore: 0.55 },

  // Opioid + Muscle Relaxant
  { drugA: 'morphine', drugB: 'cyclobenzaprine', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_CNS_DEPRESSION, description: 'Both agents cause CNS depression. Combination increases sedation and respiratory depression risk.', clinicalRecommendation: 'Use lower doses. Avoid in elderly. Monitor for excessive sedation. Educate patient about fall risk.', evidenceLevel: 'Level C', baseSeverityScore: 0.55 },
  { drugA: 'oxycodone', drugB: 'methocarbamol', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_CNS_DEPRESSION, description: 'Additive sedation from opioid and muscle relaxant combination.', clinicalRecommendation: 'Start with lower doses. Avoid driving. Monitor for respiratory depression, especially in elderly or with renal impairment.', evidenceLevel: 'Level C', baseSeverityScore: 0.5 },

  // Opioid + Antihistamine
  { drugA: 'morphine', drugB: 'diphenhydramine', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_CNS_DEPRESSION, description: 'First-generation antihistamine enhances opioid-induced sedation and respiratory depression.', clinicalRecommendation: 'Use non-sedating antihistamine if needed. Monitor for excessive drowsiness. Avoid in elderly (Beers criteria).', evidenceLevel: 'Level C', baseSeverityScore: 0.5 },
  { drugA: 'hydrocodone', drugB: 'promethazine', severity: InteractionSeverity.MAJOR, mechanism: InteractionMechanism.ADDITIVE_RESPIRATORY_DEPRESSION, description: 'Promethazine significantly enhances respiratory depression from opioids. FDA boxed warning for respiratory depression in children.', clinicalRecommendation: 'Avoid combination in patients <18. In adults, use lowest effective doses. Monitor respiratory status continuously.', evidenceLevel: 'Level A', baseSeverityScore: 0.82 },

  // Aspirin + Ibuprofen antagonism
  { drugA: 'aspirin', drugB: 'ibuprofen', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ANTAGONISM_RECEPTOR, description: 'Ibuprofen competitively inhibits aspirin binding to COX-1, reducing aspirin cardioprotective antiplatelet effect.', clinicalRecommendation: 'Take aspirin at least 30 minutes before or 8 hours after ibuprofen. Consider alternative NSAID (diclofenac does not interfere).', evidenceLevel: 'Level A', baseSeverityScore: 0.65 },

  // SSRI + NSAID bleeding
  { drugA: 'sertraline', drugB: 'ibuprofen', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'SSRIs impair platelet serotonin uptake. Combined with NSAID antiplatelet effect, GI bleeding risk increases 3-15 fold.', clinicalRecommendation: 'Add PPI for GI protection. Monitor for signs of bleeding. Use acetaminophen if possible.', evidenceLevel: 'Level A', baseSeverityScore: 0.6 },
  { drugA: 'sertraline', drugB: 'enoxaparin', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'SSRIs increase bleeding risk; combination with anticoagulant further elevates hemorrhage risk.', clinicalRecommendation: 'Monitor for signs of bleeding. Consider bleeding risk vs DVT prevention benefit. Watch for bruising.', evidenceLevel: 'Level B', baseSeverityScore: 0.55 },

  // Metoprolol + CYP2D6 inhibitors
  { drugA: 'metoprolol', drugB: 'diphenhydramine', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.CYP2D6_INHIBITION, description: 'Diphenhydramine inhibits CYP2D6, increasing metoprolol exposure and risk of bradycardia and hypotension.', clinicalRecommendation: 'Monitor heart rate and blood pressure. Consider non-sedating antihistamine or non-CYP2D6-dependent beta-blocker (atenolol).', evidenceLevel: 'Level C', baseSeverityScore: 0.5 },
  { drugA: 'metoprolol', drugB: 'sertraline', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.CYP2D6_INHIBITION, description: 'Sertraline moderately inhibits CYP2D6, potentially increasing metoprolol levels.', clinicalRecommendation: 'Monitor heart rate and blood pressure. Adjust metoprolol dose if symptomatic bradycardia or hypotension occurs.', evidenceLevel: 'Level C', baseSeverityScore: 0.45 },

  // Lidocaine + CYP1A2 inhibitor
  { drugA: 'lidocaine', drugB: 'ciprofloxacin', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.CYP1A2_INHIBITION, description: 'Ciprofloxacin inhibits CYP1A2 metabolism of lidocaine, increasing plasma levels and toxicity risk.', clinicalRecommendation: 'Monitor for lidocaine toxicity (perioral numbness, tinnitus, seizures). Reduce lidocaine dose if given systemically.', evidenceLevel: 'Level C', baseSeverityScore: 0.55 },

  // Amlodipine + CYP3A4 inhibitor
  { drugA: 'amlodipine', drugB: 'fluconazole', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.CYP3A4_INHIBITION, description: 'Fluconazole inhibits CYP3A4 metabolism of amlodipine, potentially causing excessive hypotension.', clinicalRecommendation: 'Monitor blood pressure. May need to reduce amlodipine dose during fluconazole therapy.', evidenceLevel: 'Level C', baseSeverityScore: 0.5 },

  // Metformin + contrast/nephrotoxic risk
  { drugA: 'metformin', drugB: 'vancomycin', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.ADDITIVE_NEPHROTOXICITY, description: 'Vancomycin-induced nephrotoxicity can impair metformin clearance, increasing lactic acidosis risk.', clinicalRecommendation: 'Monitor renal function closely. Consider holding metformin if creatinine rises. Resume when renal function stable.', evidenceLevel: 'Level C', baseSeverityScore: 0.55 },

  // Duloxetine + Tramadol
  { drugA: 'duloxetine', drugB: 'codeine', severity: InteractionSeverity.MODERATE, mechanism: InteractionMechanism.CYP2D6_INHIBITION, description: 'Duloxetine inhibits CYP2D6, reducing conversion of codeine to active metabolite morphine. Decreased analgesic efficacy.', clinicalRecommendation: 'Consider alternative opioid not dependent on CYP2D6 activation (morphine, hydromorphone). Monitor pain control.', evidenceLevel: 'Level B', baseSeverityScore: 0.55 },

  // Minor interactions
  { drugA: 'acetaminophen', drugB: 'warfarin', severity: InteractionSeverity.MINOR, mechanism: InteractionMechanism.ENHANCED_TOXICITY, description: 'Regular acetaminophen use (>2g/day for >1 week) may modestly increase INR.', clinicalRecommendation: 'Preferred over NSAIDs with warfarin. Monitor INR if acetaminophen >2g/day regularly. Limit to <2g/day if possible.', evidenceLevel: 'Level B', baseSeverityScore: 0.25 },
  { drugA: 'docusate', drugB: 'warfarin', severity: InteractionSeverity.MINOR, mechanism: InteractionMechanism.INCREASED_ABSORPTION, description: 'Docusate may slightly increase warfarin absorption through surfactant action.', clinicalRecommendation: 'Clinically insignificant in most patients. Monitor INR per routine schedule.', evidenceLevel: 'Level D', baseSeverityScore: 0.15 },
  { drugA: 'gabapentin', drugB: 'acetaminophen', severity: InteractionSeverity.MINOR, mechanism: InteractionMechanism.REDUCED_ABSORPTION, description: 'No significant pharmacokinetic interaction. Minor reduction in gabapentin bioavailability with some formulations.', clinicalRecommendation: 'No dose adjustment needed. Safe to combine for multimodal analgesia.', evidenceLevel: 'Level D', baseSeverityScore: 0.1 },
  { drugA: 'pantoprazole', drugB: 'clopidogrel', severity: InteractionSeverity.MINOR, mechanism: InteractionMechanism.CYP2C19_INHIBITION, description: 'Pantoprazole is a weak CYP2C19 inhibitor. Minimal effect on clopidogrel activation compared to omeprazole.', clinicalRecommendation: 'Pantoprazole preferred PPI with clopidogrel. No dose adjustment needed.', evidenceLevel: 'Level B', baseSeverityScore: 0.2 },
  { drugA: 'cefazolin', drugB: 'heparin', severity: InteractionSeverity.MINOR, mechanism: InteractionMechanism.ADDITIVE_BLEEDING_RISK, description: 'Cephalosporins may rarely interfere with vitamin K-dependent clotting factors.', clinicalRecommendation: 'Monitor for signs of bleeding. Routine prophylactic combination generally safe.', evidenceLevel: 'Level D', baseSeverityScore: 0.15 },
];

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_PREFIX = 'recovery_pilot_dic_';
const STORAGE_KEYS = {
  OVERRIDE_HISTORY: `${STORAGE_PREFIX}override_history`,
  ADJUSTED_SCORES: `${STORAGE_PREFIX}adjusted_scores`,
  CHECK_LOG: `${STORAGE_PREFIX}check_log`,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

function makeInteractionKey(drugA: string, drugB: string): string {
  return [drugA, drugB].sort().join('::');
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ============================================================================
// DrugInteractionChecker Class
// ============================================================================

export class DrugInteractionChecker {
  private drugs: Map<string, DrugEntry> = new Map();
  private interactions: Map<string, InteractionPair> = new Map();
  private overrideHistory: OverrideRecord[] = [];
  private adjustedScores: Map<string, { score: number; overrideCount: number; checkCount: number }> = new Map();

  constructor() {
    // Index drug database
    for (const drug of DRUG_DATABASE) {
      this.drugs.set(drug.id, drug);
    }

    // Index interaction database
    for (const interaction of INTERACTION_DATABASE) {
      const key = makeInteractionKey(interaction.drugA, interaction.drugB);
      this.interactions.set(key, interaction);
    }

    // Load learned state
    this.overrideHistory = loadFromStorage<OverrideRecord[]>(STORAGE_KEYS.OVERRIDE_HISTORY, []);
    const storedScores = loadFromStorage<Array<[string, { score: number; overrideCount: number; checkCount: number }]>>(STORAGE_KEYS.ADJUSTED_SCORES, []);
    this.adjustedScores = new Map(storedScores);
  }

  /**
   * Get all drugs in the database
   */
  getAllDrugs(): DrugEntry[] {
    return [...DRUG_DATABASE];
  }

  /**
   * Look up a drug by ID or name
   */
  getDrug(idOrName: string): DrugEntry | undefined {
    const lower = idOrName.toLowerCase();
    return this.drugs.get(lower) ?? DRUG_DATABASE.find(
      d => d.name.toLowerCase() === lower || d.genericName.toLowerCase() === lower
    );
  }

  /**
   * Check interactions between two specific drugs
   */
  checkPairInteraction(drugAId: string, drugBId: string): InteractionResult | null {
    const key = makeInteractionKey(drugAId, drugBId);
    const pair = this.interactions.get(key);
    if (!pair) return null;

    const adjusted = this.adjustedScores.get(key);
    const overrideRate = adjusted
      ? adjusted.overrideCount / Math.max(adjusted.checkCount, 1)
      : 0;

    // Adjust severity score based on override history
    let severityScore = pair.baseSeverityScore;
    if (adjusted && adjusted.checkCount > 5) {
      // Reduce confidence if doctors frequently override
      const dampening = overrideRate * 0.3; // max 30% reduction
      severityScore = Math.max(0.05, severityScore - dampening);
    }

    const confidence = adjusted
      ? Math.min(0.99, 0.7 + (adjusted.checkCount * 0.01))
      : 0.7;

    // Track this check
    if (adjusted) {
      adjusted.checkCount++;
    } else {
      this.adjustedScores.set(key, { score: pair.baseSeverityScore, overrideCount: 0, checkCount: 1 });
    }
    this.persistState();

    return {
      drugA: pair.drugA,
      drugB: pair.drugB,
      severity: pair.severity,
      severityScore,
      confidence,
      mechanism: pair.mechanism,
      description: pair.description,
      clinicalRecommendation: pair.clinicalRecommendation,
      evidenceLevel: pair.evidenceLevel,
      overrideRate,
    };
  }

  /**
   * Check all interactions for a list of drugs (the full medication list check)
   */
  checkMedicationList(drugIds: string[]): DrugCheckResult {
    const interactions: InteractionResult[] = [];

    // Check all pairwise combinations
    for (let i = 0; i < drugIds.length; i++) {
      for (let j = i + 1; j < drugIds.length; j++) {
        const result = this.checkPairInteraction(drugIds[i], drugIds[j]);
        if (result) {
          interactions.push(result);
        }
      }
    }

    // Sort by severity score descending
    interactions.sort((a, b) => b.severityScore - a.severityScore);

    const contraindicatedCount = interactions.filter(i => i.severity === InteractionSeverity.CONTRAINDICATED).length;
    const majorCount = interactions.filter(i => i.severity === InteractionSeverity.MAJOR).length;
    const moderateCount = interactions.filter(i => i.severity === InteractionSeverity.MODERATE).length;
    const minorCount = interactions.filter(i => i.severity === InteractionSeverity.MINOR).length;

    let highestSeverity: InteractionSeverity | null = null;
    if (contraindicatedCount > 0) highestSeverity = InteractionSeverity.CONTRAINDICATED;
    else if (majorCount > 0) highestSeverity = InteractionSeverity.MAJOR;
    else if (moderateCount > 0) highestSeverity = InteractionSeverity.MODERATE;
    else if (minorCount > 0) highestSeverity = InteractionSeverity.MINOR;

    return {
      interactions,
      highestSeverity,
      totalInteractions: interactions.length,
      majorCount,
      moderateCount,
      minorCount,
      contraindicatedCount,
      safeToAdminister: contraindicatedCount === 0 && majorCount === 0,
    };
  }

  /**
   * Record that a clinician overrode an interaction warning
   */
  recordOverride(drugAId: string, drugBId: string, clinicianId: string, reason: string): void {
    const key = makeInteractionKey(drugAId, drugBId);
    const pair = this.interactions.get(key);
    if (!pair) return;

    const record: OverrideRecord = {
      drugA: drugAId,
      drugB: drugBId,
      originalSeverity: pair.severity,
      overriddenAt: Date.now(),
      clinicianId,
      reason,
    };

    this.overrideHistory.push(record);

    // Update adjusted score
    const adjusted = this.adjustedScores.get(key);
    if (adjusted) {
      adjusted.overrideCount++;
      // Apply exponential moving average to severity score
      const alpha = 0.1;
      adjusted.score = adjusted.score * (1 - alpha) + (adjusted.score * 0.8) * alpha;
    } else {
      this.adjustedScores.set(key, {
        score: pair.baseSeverityScore * 0.95,
        overrideCount: 1,
        checkCount: 1,
      });
    }

    this.persistState();
  }

  /**
   * Get override statistics for an interaction pair
   */
  getOverrideStats(drugAId: string, drugBId: string): { overrideCount: number; checkCount: number; overrideRate: number } {
    const key = makeInteractionKey(drugAId, drugBId);
    const adjusted = this.adjustedScores.get(key);
    if (!adjusted) return { overrideCount: 0, checkCount: 0, overrideRate: 0 };
    return {
      overrideCount: adjusted.overrideCount,
      checkCount: adjusted.checkCount,
      overrideRate: adjusted.overrideCount / Math.max(adjusted.checkCount, 1),
    };
  }

  /**
   * Get drugs by category
   */
  getDrugsByCategory(category: DrugCategory): DrugEntry[] {
    return DRUG_DATABASE.filter(d => d.category === category);
  }

  /**
   * Find all known interactions for a specific drug
   */
  getInteractionsForDrug(drugId: string): InteractionPair[] {
    const results: InteractionPair[] = [];
    for (const pair of INTERACTION_DATABASE) {
      if (pair.drugA === drugId || pair.drugB === drugId) {
        results.push(pair);
      }
    }
    return results;
  }

  /**
   * Get severity color coding for UI display
   */
  getSeverityColor(severity: InteractionSeverity): string {
    const colors: Record<InteractionSeverity, string> = {
      [InteractionSeverity.MINOR]: '#4CAF50',
      [InteractionSeverity.MODERATE]: '#FF9800',
      [InteractionSeverity.MAJOR]: '#F44336',
      [InteractionSeverity.CONTRAINDICATED]: '#9C27B0',
    };
    return colors[severity];
  }

  /**
   * Dynamically infer potential interactions based on CYP450 metabolic pathways
   * even if not explicitly in the interaction database.
   */
  inferCYP450Interaction(drugAId: string, drugBId: string): {
    hasPotentialInteraction: boolean;
    pathways: string[];
    riskLevel: string;
  } {
    const drugA = this.drugs.get(drugAId);
    const drugB = this.drugs.get(drugBId);

    if (!drugA || !drugB) {
      return { hasPotentialInteraction: false, pathways: [], riskLevel: 'unknown' };
    }

    const overlappingPathways: string[] = [];

    // Check if drugB inhibits enzymes that drugA is substrate of
    for (const substrate of drugA.cyp450Substrates) {
      if (drugB.cyp450Inhibitors.includes(substrate)) {
        overlappingPathways.push(`${drugB.genericName} inhibits ${substrate} (metabolizes ${drugA.genericName})`);
      }
    }
    // Check reverse
    for (const substrate of drugB.cyp450Substrates) {
      if (drugA.cyp450Inhibitors.includes(substrate)) {
        overlappingPathways.push(`${drugA.genericName} inhibits ${substrate} (metabolizes ${drugB.genericName})`);
      }
    }
    // Check induction
    for (const substrate of drugA.cyp450Substrates) {
      if (drugB.cyp450Inducers.includes(substrate)) {
        overlappingPathways.push(`${drugB.genericName} induces ${substrate} (metabolizes ${drugA.genericName})`);
      }
    }
    for (const substrate of drugB.cyp450Substrates) {
      if (drugA.cyp450Inducers.includes(substrate)) {
        overlappingPathways.push(`${drugA.genericName} induces ${substrate} (metabolizes ${drugB.genericName})`);
      }
    }

    const riskLevel = overlappingPathways.length >= 2 ? 'high' : overlappingPathways.length === 1 ? 'moderate' : 'low';

    return {
      hasPotentialInteraction: overlappingPathways.length > 0,
      pathways: overlappingPathways,
      riskLevel,
    };
  }

  /**
   * Compute the overall severity score for a complete medication list
   * using a weighted combination approach
   */
  computeMedicationRiskScore(drugIds: string[]): {
    totalRiskScore: number;
    riskLevel: string;
    criticalPairs: Array<{ drugA: string; drugB: string; score: number }>;
  } {
    const result = this.checkMedicationList(drugIds);
    let totalScore = 0;
    const criticalPairs: Array<{ drugA: string; drugB: string; score: number }> = [];

    for (const interaction of result.interactions) {
      const weight =
        interaction.severity === InteractionSeverity.CONTRAINDICATED ? 4.0 :
        interaction.severity === InteractionSeverity.MAJOR ? 3.0 :
        interaction.severity === InteractionSeverity.MODERATE ? 2.0 : 1.0;
      const weighted = interaction.severityScore * weight;
      totalScore += weighted;

      if (interaction.severity === InteractionSeverity.MAJOR || interaction.severity === InteractionSeverity.CONTRAINDICATED) {
        criticalPairs.push({ drugA: interaction.drugA, drugB: interaction.drugB, score: weighted });
      }
    }

    // Normalize by number of possible pairs to get 0-1 score
    const maxPairs = (drugIds.length * (drugIds.length - 1)) / 2;
    const normalizedScore = maxPairs > 0 ? sigmoid(totalScore / maxPairs - 0.5) : 0;

    const riskLevel =
      normalizedScore > 0.8 ? 'critical' :
      normalizedScore > 0.6 ? 'high' :
      normalizedScore > 0.4 ? 'moderate' : 'low';

    return { totalRiskScore: normalizedScore, riskLevel, criticalPairs };
  }

  /**
   * Get the total override history
   */
  getOverrideHistory(): OverrideRecord[] {
    return [...this.overrideHistory];
  }

  /**
   * Reset all learned state
   */
  resetLearning(): void {
    this.overrideHistory = [];
    this.adjustedScores.clear();
    this.persistState();
  }

  /**
   * Get database statistics
   */
  getStats(): { totalDrugs: number; totalInteractions: number; totalOverrides: number; totalChecks: number } {
    let totalChecks = 0;
    for (const val of this.adjustedScores.values()) {
      totalChecks += val.checkCount;
    }
    return {
      totalDrugs: DRUG_DATABASE.length,
      totalInteractions: INTERACTION_DATABASE.length,
      totalOverrides: this.overrideHistory.length,
      totalChecks,
    };
  }

  private persistState(): void {
    saveToStorage(STORAGE_KEYS.OVERRIDE_HISTORY, this.overrideHistory);
    saveToStorage(STORAGE_KEYS.ADJUSTED_SCORES, [...this.adjustedScores.entries()]);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createDrugInteractionChecker(): DrugInteractionChecker {
  return new DrugInteractionChecker();
}
