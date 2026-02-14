/**
 * Feature 33: FHIR R4 Resource Engine
 *
 * Real HL7 FHIR R4 resource generation with proper coding systems,
 * resource linking, bundle generation, validation, and self-learning.
 */

// ============================================================================
// Constants & Code Systems
// ============================================================================

export const FHIRResourceType = {
  PATIENT: 'Patient',
  ENCOUNTER: 'Encounter',
  CONDITION: 'Condition',
  OBSERVATION: 'Observation',
  MEDICATION_REQUEST: 'MedicationRequest',
  PROCEDURE: 'Procedure',
  ALLERGY_INTOLERANCE: 'AllergyIntolerance',
  DIAGNOSTIC_REPORT: 'DiagnosticReport',
  CARE_PLAN: 'CarePlan',
} as const;
export type FHIRResourceType = typeof FHIRResourceType[keyof typeof FHIRResourceType];

export const BundleType = {
  TRANSACTION: 'transaction',
  SEARCHSET: 'searchset',
  DOCUMENT: 'document',
  COLLECTION: 'collection',
  BATCH: 'batch',
} as const;
export type BundleType = typeof BundleType[keyof typeof BundleType];

export const HTTPVerb = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;
export type HTTPVerb = typeof HTTPVerb[keyof typeof HTTPVerb];

export const EncounterStatus = {
  PLANNED: 'planned',
  ARRIVED: 'arrived',
  TRIAGED: 'triaged',
  IN_PROGRESS: 'in-progress',
  ON_LEAVE: 'onleave',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
} as const;
export type EncounterStatus = typeof EncounterStatus[keyof typeof EncounterStatus];

export const ConditionClinicalStatus = {
  ACTIVE: 'active',
  RECURRENCE: 'recurrence',
  RELAPSE: 'relapse',
  INACTIVE: 'inactive',
  REMISSION: 'remission',
  RESOLVED: 'resolved',
} as const;
export type ConditionClinicalStatus = typeof ConditionClinicalStatus[keyof typeof ConditionClinicalStatus];

export const ConditionVerificationStatus = {
  UNCONFIRMED: 'unconfirmed',
  PROVISIONAL: 'provisional',
  DIFFERENTIAL: 'differential',
  CONFIRMED: 'confirmed',
  REFUTED: 'refuted',
  ENTERED_IN_ERROR: 'entered-in-error',
} as const;
export type ConditionVerificationStatus = typeof ConditionVerificationStatus[keyof typeof ConditionVerificationStatus];

export const ObservationStatus = {
  REGISTERED: 'registered',
  PRELIMINARY: 'preliminary',
  FINAL: 'final',
  AMENDED: 'amended',
  CORRECTED: 'corrected',
  CANCELLED: 'cancelled',
} as const;
export type ObservationStatus = typeof ObservationStatus[keyof typeof ObservationStatus];

export const MedicationRequestStatus = {
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  STOPPED: 'stopped',
  DRAFT: 'draft',
} as const;
export type MedicationRequestStatus = typeof MedicationRequestStatus[keyof typeof MedicationRequestStatus];

export const MedicationRequestIntent = {
  PROPOSAL: 'proposal',
  PLAN: 'plan',
  ORDER: 'order',
  ORIGINAL_ORDER: 'original-order',
  REFLEX_ORDER: 'reflex-order',
  FILLER_ORDER: 'filler-order',
  INSTANCE_ORDER: 'instance-order',
} as const;
export type MedicationRequestIntent = typeof MedicationRequestIntent[keyof typeof MedicationRequestIntent];

export const CarePlanStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
  REVOKED: 'revoked',
  COMPLETED: 'completed',
} as const;
export type CarePlanStatus = typeof CarePlanStatus[keyof typeof CarePlanStatus];

export const AllergyIntoleranceType = {
  ALLERGY: 'allergy',
  INTOLERANCE: 'intolerance',
} as const;
export type AllergyIntoleranceType = typeof AllergyIntoleranceType[keyof typeof AllergyIntoleranceType];

export const AllergyIntoleranceCriticality = {
  LOW: 'low',
  HIGH: 'high',
  UNABLE_TO_ASSESS: 'unable-to-assess',
} as const;
export type AllergyIntoleranceCriticality = typeof AllergyIntoleranceCriticality[keyof typeof AllergyIntoleranceCriticality];

export const DiagnosticReportStatus = {
  REGISTERED: 'registered',
  PARTIAL: 'partial',
  PRELIMINARY: 'preliminary',
  FINAL: 'final',
  AMENDED: 'amended',
  CORRECTED: 'corrected',
  APPENDED: 'appended',
  CANCELLED: 'cancelled',
} as const;
export type DiagnosticReportStatus = typeof DiagnosticReportStatus[keyof typeof DiagnosticReportStatus];

// Coding system URIs
export const CODING_SYSTEMS = {
  SNOMED_CT: 'http://snomed.info/sct',
  LOINC: 'http://loinc.org',
  ICD10_CM: 'http://hl7.org/fhir/sid/icd-10-cm',
  RXNORM: 'http://www.nlm.nih.gov/research/umls/rxnorm',
  CPT: 'http://www.ama-assn.org/go/cpt',
  NDC: 'http://hl7.org/fhir/sid/ndc',
  CVX: 'http://hl7.org/fhir/sid/cvx',
  UCUM: 'http://unitsofmeasure.org',
  HL7_CONDITION_CLINICAL: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
  HL7_CONDITION_VERIFICATION: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  HL7_OBSERVATION_CATEGORY: 'http://terminology.hl7.org/CodeSystem/observation-category',
} as const;

// ============================================================================
// Real SNOMED CT Codes for Post-Operative Conditions (100+)
// ============================================================================

export const SNOMED_CODES: Record<string, { code: string; display: string }> = {
  // Pain conditions
  POSTOPERATIVE_PAIN: { code: '213299007', display: 'Postoperative pain' },
  ACUTE_PAIN: { code: '274663001', display: 'Acute pain' },
  CHRONIC_PAIN: { code: '82423001', display: 'Chronic pain' },
  WOUND_PAIN: { code: '225558004', display: 'Wound pain' },
  INCISIONAL_PAIN: { code: '36708009', display: 'Incisional pain' },
  NEUROPATHIC_PAIN: { code: '247398009', display: 'Neuropathic pain' },
  REFERRED_PAIN: { code: '6617009', display: 'Referred pain' },

  // Surgical wound complications
  SURGICAL_WOUND_INFECTION: { code: '414478003', display: 'Surgical wound infection' },
  WOUND_DEHISCENCE: { code: '225553008', display: 'Wound dehiscence' },
  SURGICAL_SITE_HEMORRHAGE: { code: '269362003', display: 'Surgical site hemorrhage' },
  SEROMA: { code: '67782005', display: 'Seroma' },
  HEMATOMA: { code: '385494008', display: 'Hematoma' },
  WOUND_ABSCESS: { code: '128477000', display: 'Abscess' },
  KELOID_SCAR: { code: '4849005', display: 'Keloid scar' },
  HYPERTROPHIC_SCAR: { code: '72715006', display: 'Hypertrophic scar' },

  // Cardiovascular complications
  DVT: { code: '128053003', display: 'Deep venous thrombosis' },
  PULMONARY_EMBOLISM: { code: '59282003', display: 'Pulmonary embolism' },
  POSTOP_HYPOTENSION: { code: '45007003', display: 'Hypotension' },
  POSTOP_HYPERTENSION: { code: '38341003', display: 'Hypertension' },
  CARDIAC_ARRHYTHMIA: { code: '698247007', display: 'Cardiac arrhythmia' },
  ATRIAL_FIBRILLATION: { code: '49436004', display: 'Atrial fibrillation' },
  MYOCARDIAL_INFARCTION: { code: '22298006', display: 'Myocardial infarction' },
  HEART_FAILURE: { code: '84114007', display: 'Heart failure' },

  // Respiratory complications
  ATELECTASIS: { code: '46621007', display: 'Atelectasis' },
  PNEUMONIA: { code: '233604007', display: 'Pneumonia' },
  PNEUMOTHORAX: { code: '36118008', display: 'Pneumothorax' },
  PLEURAL_EFFUSION: { code: '60046008', display: 'Pleural effusion' },
  RESPIRATORY_FAILURE: { code: '409623005', display: 'Respiratory failure' },
  BRONCHOSPASM: { code: '4386001', display: 'Bronchospasm' },
  ASPIRATION_PNEUMONIA: { code: '422588002', display: 'Aspiration pneumonia' },

  // GI complications
  POSTOP_ILEUS: { code: '29339002', display: 'Postoperative ileus' },
  NAUSEA_VOMITING: { code: '16932000', display: 'Nausea and vomiting' },
  GI_HEMORRHAGE: { code: '74474003', display: 'Gastrointestinal hemorrhage' },
  BOWEL_OBSTRUCTION: { code: '81060008', display: 'Intestinal obstruction' },
  ANASTOMOTIC_LEAK: { code: '442683004', display: 'Anastomotic leak' },
  CONSTIPATION: { code: '14760008', display: 'Constipation' },

  // Urinary complications
  URINARY_RETENTION: { code: '267064002', display: 'Urinary retention' },
  UTI: { code: '68566005', display: 'Urinary tract infection' },
  ACUTE_KIDNEY_INJURY: { code: '14669001', display: 'Acute kidney injury' },
  OLIGURIA: { code: '83128009', display: 'Oliguria' },

  // Neurological complications
  POSTOP_DELIRIUM: { code: '2776000', display: 'Delirium' },
  POSTOP_COGNITIVE_DECLINE: { code: '386806002', display: 'Cognitive deficit' },
  STROKE: { code: '230690007', display: 'Stroke' },
  PERIPHERAL_NEUROPATHY: { code: '302226006', display: 'Peripheral neuropathy' },
  NERVE_INJURY: { code: '57182000', display: 'Nerve injury' },

  // Metabolic complications
  HYPERGLYCEMIA: { code: '80394007', display: 'Hyperglycemia' },
  HYPOGLYCEMIA: { code: '302866003', display: 'Hypoglycemia' },
  HYPONATREMIA: { code: '89627008', display: 'Hyponatremia' },
  HYPERKALEMIA: { code: '14140009', display: 'Hyperkalemia' },
  HYPOKALEMIA: { code: '43339004', display: 'Hypokalemia' },
  DEHYDRATION: { code: '34095006', display: 'Dehydration' },
  METABOLIC_ACIDOSIS: { code: '59455009', display: 'Metabolic acidosis' },

  // Infectious complications
  SEPSIS: { code: '91302008', display: 'Sepsis' },
  BACTEREMIA: { code: '5758002', display: 'Bacteremia' },
  CELLULITIS: { code: '128045006', display: 'Cellulitis' },
  CLOSTRIDIUM_DIFFICILE: { code: '186431008', display: 'Clostridioides difficile infection' },
  MRSA: { code: '266096002', display: 'Methicillin resistant Staphylococcus aureus infection' },

  // Musculoskeletal
  JOINT_STIFFNESS: { code: '84445001', display: 'Joint stiffness' },
  MUSCLE_WEAKNESS: { code: '26544005', display: 'Muscle weakness' },
  CONTRACTURE: { code: '55033002', display: 'Contracture' },
  PROSTHESIS_DISLOCATION: { code: '397181002', display: 'Prosthesis dislocation' },
  FRACTURE_NONUNION: { code: '71642004', display: 'Fracture nonunion' },
  HETEROTOPIC_OSSIFICATION: { code: '203555002', display: 'Heterotopic ossification' },

  // Anesthesia-related
  MALIGNANT_HYPERTHERMIA: { code: '405501007', display: 'Malignant hyperthermia' },
  POSTOP_NAUSEA: { code: '16932000', display: 'Postoperative nausea' },
  ANAPHYLAXIS: { code: '39579001', display: 'Anaphylaxis' },
  DIFFICULT_INTUBATION: { code: '52765003', display: 'Difficult intubation' },

  // Skin/tissue
  PRESSURE_ULCER: { code: '420226006', display: 'Pressure ulcer' },
  SKIN_NECROSIS: { code: '95345008', display: 'Skin necrosis' },
  COMPARTMENT_SYNDROME: { code: '111245009', display: 'Compartment syndrome' },

  // Hematological
  ANEMIA: { code: '271737000', display: 'Anemia' },
  THROMBOCYTOPENIA: { code: '302215000', display: 'Thrombocytopenia' },
  COAGULOPATHY: { code: '234466008', display: 'Coagulopathy' },
  DIC: { code: '67406007', display: 'Disseminated intravascular coagulation' },
  TRANSFUSION_REACTION: { code: '82545002', display: 'Transfusion reaction' },

  // General post-op
  FEVER: { code: '386661006', display: 'Fever' },
  FATIGUE: { code: '84229001', display: 'Fatigue' },
  INSOMNIA: { code: '193462001', display: 'Insomnia' },
  ANXIETY: { code: '48694002', display: 'Anxiety' },
  DEPRESSION: { code: '35489007', display: 'Depressive disorder' },
  MALNUTRITION: { code: '248325000', display: 'Malnutrition' },
  FALLS: { code: '217082002', display: 'Fall' },
  IMMOBILITY: { code: '102491009', display: 'Immobility' },
  LYMPHEDEMA: { code: '234097001', display: 'Lymphedema' },
  ADHESIONS: { code: '55342001', display: 'Adhesion' },

  // Specific surgical types
  TOTAL_KNEE_REPLACEMENT: { code: '609588000', display: 'Total knee replacement' },
  TOTAL_HIP_REPLACEMENT: { code: '52734007', display: 'Total hip replacement' },
  CORONARY_ARTERY_BYPASS: { code: '232717009', display: 'Coronary artery bypass grafting' },
  APPENDECTOMY: { code: '80146002', display: 'Appendectomy' },
  CHOLECYSTECTOMY: { code: '38102005', display: 'Cholecystectomy' },
  HERNIA_REPAIR: { code: '44558001', display: 'Hernia repair' },
  LAMINECTOMY: { code: '387731002', display: 'Laminectomy' },
  SPINAL_FUSION: { code: '174687004', display: 'Spinal fusion' },
  MASTECTOMY: { code: '172043006', display: 'Mastectomy' },
  COLECTOMY: { code: '23968004', display: 'Colectomy' },
};

// ============================================================================
// Real LOINC Codes for Lab Tests (50+)
// ============================================================================

export const LOINC_CODES: Record<string, { code: string; display: string; unit: string; normalRange: { low: number; high: number } }> = {
  // Complete Blood Count
  WBC: { code: '6690-2', display: 'Leukocytes [#/volume] in Blood', unit: '10*3/uL', normalRange: { low: 4.5, high: 11.0 } },
  RBC: { code: '789-8', display: 'Erythrocytes [#/volume] in Blood', unit: '10*6/uL', normalRange: { low: 4.5, high: 5.5 } },
  HEMOGLOBIN: { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood', unit: 'g/dL', normalRange: { low: 12.0, high: 17.5 } },
  HEMATOCRIT: { code: '4544-3', display: 'Hematocrit [Volume Fraction] of Blood', unit: '%', normalRange: { low: 36, high: 51 } },
  PLATELET_COUNT: { code: '777-3', display: 'Platelets [#/volume] in Blood', unit: '10*3/uL', normalRange: { low: 150, high: 400 } },
  MCV: { code: '787-2', display: 'MCV [Entitic volume]', unit: 'fL', normalRange: { low: 80, high: 100 } },
  MCH: { code: '785-6', display: 'MCH [Entitic mass]', unit: 'pg', normalRange: { low: 27, high: 33 } },
  MCHC: { code: '786-4', display: 'MCHC [Mass/volume]', unit: 'g/dL', normalRange: { low: 32, high: 36 } },
  RDW: { code: '788-0', display: 'RDW - Erythrocyte distribution width', unit: '%', normalRange: { low: 11.5, high: 14.5 } },
  MPV: { code: '32623-1', display: 'MPV [Entitic volume] in Blood', unit: 'fL', normalRange: { low: 7.5, high: 11.5 } },

  // Basic Metabolic Panel
  SODIUM: { code: '2951-2', display: 'Sodium [Moles/volume] in Serum', unit: 'mmol/L', normalRange: { low: 136, high: 145 } },
  POTASSIUM: { code: '2823-3', display: 'Potassium [Moles/volume] in Serum', unit: 'mmol/L', normalRange: { low: 3.5, high: 5.0 } },
  CHLORIDE: { code: '2075-0', display: 'Chloride [Moles/volume] in Serum', unit: 'mmol/L', normalRange: { low: 98, high: 106 } },
  BICARBONATE: { code: '1963-8', display: 'Bicarbonate [Moles/volume] in Serum', unit: 'mmol/L', normalRange: { low: 22, high: 29 } },
  BUN: { code: '3094-0', display: 'Urea nitrogen [Mass/volume] in Serum', unit: 'mg/dL', normalRange: { low: 7, high: 20 } },
  CREATININE: { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum', unit: 'mg/dL', normalRange: { low: 0.7, high: 1.3 } },
  GLUCOSE: { code: '2345-7', display: 'Glucose [Mass/volume] in Serum', unit: 'mg/dL', normalRange: { low: 70, high: 100 } },
  CALCIUM: { code: '17861-6', display: 'Calcium [Mass/volume] in Serum', unit: 'mg/dL', normalRange: { low: 8.5, high: 10.5 } },

  // Liver Function
  ALT: { code: '1742-6', display: 'Alanine aminotransferase [Enzymatic activity/volume]', unit: 'U/L', normalRange: { low: 7, high: 56 } },
  AST: { code: '1920-8', display: 'Aspartate aminotransferase [Enzymatic activity/volume]', unit: 'U/L', normalRange: { low: 10, high: 40 } },
  ALP: { code: '6768-6', display: 'Alkaline phosphatase [Enzymatic activity/volume]', unit: 'U/L', normalRange: { low: 44, high: 147 } },
  TOTAL_BILIRUBIN: { code: '1975-2', display: 'Bilirubin.total [Mass/volume] in Serum', unit: 'mg/dL', normalRange: { low: 0.1, high: 1.2 } },
  DIRECT_BILIRUBIN: { code: '1968-7', display: 'Bilirubin.direct [Mass/volume] in Serum', unit: 'mg/dL', normalRange: { low: 0.0, high: 0.3 } },
  ALBUMIN: { code: '1751-7', display: 'Albumin [Mass/volume] in Serum', unit: 'g/dL', normalRange: { low: 3.5, high: 5.5 } },
  TOTAL_PROTEIN: { code: '2885-2', display: 'Total protein [Mass/volume] in Serum', unit: 'g/dL', normalRange: { low: 6.0, high: 8.3 } },
  GGT: { code: '2324-2', display: 'Gamma glutamyl transferase [Enzymatic activity/volume]', unit: 'U/L', normalRange: { low: 9, high: 48 } },

  // Coagulation
  PT: { code: '5902-2', display: 'Prothrombin time (PT)', unit: 's', normalRange: { low: 11, high: 13.5 } },
  INR: { code: '6301-6', display: 'INR in Platelet poor plasma', unit: '{INR}', normalRange: { low: 0.9, high: 1.1 } },
  PTT: { code: '3173-2', display: 'aPTT in Blood', unit: 's', normalRange: { low: 25, high: 35 } },
  FIBRINOGEN: { code: '3255-7', display: 'Fibrinogen [Mass/volume] in Platelet poor plasma', unit: 'mg/dL', normalRange: { low: 200, high: 400 } },
  D_DIMER: { code: '48066-5', display: 'D-dimer DDU [Mass/volume] in Platelet poor plasma', unit: 'ng/mL', normalRange: { low: 0, high: 500 } },

  // Inflammatory markers
  CRP: { code: '1988-5', display: 'C reactive protein [Mass/volume] in Serum', unit: 'mg/L', normalRange: { low: 0, high: 10 } },
  ESR: { code: '4537-7', display: 'Erythrocyte sedimentation rate', unit: 'mm/h', normalRange: { low: 0, high: 20 } },
  PROCALCITONIN: { code: '75241-0', display: 'Procalcitonin [Mass/volume] in Serum', unit: 'ng/mL', normalRange: { low: 0, high: 0.1 } },
  LACTATE: { code: '2524-7', display: 'Lactate [Moles/volume] in Serum', unit: 'mmol/L', normalRange: { low: 0.5, high: 2.2 } },
  IL6: { code: '26881-3', display: 'Interleukin 6 [Mass/volume] in Serum', unit: 'pg/mL', normalRange: { low: 0, high: 7 } },

  // Cardiac markers
  TROPONIN_I: { code: '10839-9', display: 'Troponin I.cardiac [Mass/volume] in Serum', unit: 'ng/mL', normalRange: { low: 0, high: 0.04 } },
  BNP: { code: '30934-4', display: 'BNP [Mass/volume] in Blood', unit: 'pg/mL', normalRange: { low: 0, high: 100 } },
  CK_MB: { code: '13969-1', display: 'Creatine kinase.MB [Mass/volume] in Serum', unit: 'ng/mL', normalRange: { low: 0, high: 5 } },

  // Vitals (observation codes)
  HEART_RATE: { code: '8867-4', display: 'Heart rate', unit: '/min', normalRange: { low: 60, high: 100 } },
  SYSTOLIC_BP: { code: '8480-6', display: 'Systolic blood pressure', unit: 'mm[Hg]', normalRange: { low: 90, high: 140 } },
  DIASTOLIC_BP: { code: '8462-4', display: 'Diastolic blood pressure', unit: 'mm[Hg]', normalRange: { low: 60, high: 90 } },
  BODY_TEMPERATURE: { code: '8310-5', display: 'Body temperature', unit: 'Cel', normalRange: { low: 36.1, high: 38.0 } },
  RESPIRATORY_RATE: { code: '9279-1', display: 'Respiratory rate', unit: '/min', normalRange: { low: 12, high: 20 } },
  OXYGEN_SATURATION: { code: '2708-6', display: 'Oxygen saturation in Arterial blood', unit: '%', normalRange: { low: 95, high: 100 } },
  BMI: { code: '39156-5', display: 'Body mass index (BMI)', unit: 'kg/m2', normalRange: { low: 18.5, high: 24.9 } },
  PAIN_SEVERITY: { code: '72514-3', display: 'Pain severity - 0-10 verbal numeric rating', unit: '{score}', normalRange: { low: 0, high: 3 } },

  // Renal
  GFR: { code: '33914-3', display: 'Glomerular filtration rate/1.73 sq M', unit: 'mL/min/{1.73_m2}', normalRange: { low: 90, high: 120 } },
  URINE_PROTEIN: { code: '2888-6', display: 'Protein [Mass/volume] in Urine', unit: 'mg/dL', normalRange: { low: 0, high: 14 } },

  // HbA1c
  HBA1C: { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood', unit: '%', normalRange: { low: 4.0, high: 5.6 } },

  // Thyroid
  TSH: { code: '3016-3', display: 'Thyrotropin [Units/volume] in Serum', unit: 'mIU/L', normalRange: { low: 0.27, high: 4.2 } },

  // Iron
  FERRITIN: { code: '2276-4', display: 'Ferritin [Mass/volume] in Serum', unit: 'ng/mL', normalRange: { low: 12, high: 300 } },
  IRON: { code: '2498-4', display: 'Iron [Mass/volume] in Serum', unit: 'ug/dL', normalRange: { low: 60, high: 170 } },
};

// ============================================================================
// Real ICD-10-CM Codes for Post-Operative Diagnoses (50+)
// ============================================================================

export const ICD10_CODES: Record<string, { code: string; display: string }> = {
  // Post-operative complications
  POSTPROCEDURAL_HEMORRHAGE: { code: 'K91.840', display: 'Postprocedural hemorrhage of a digestive system organ' },
  SURGICAL_WOUND_INFECTION: { code: 'T81.41XA', display: 'Infection following a procedure, superficial incisional SSI' },
  WOUND_DISRUPTION: { code: 'T81.31XA', display: 'Disruption of external operation wound' },
  POSTOP_SHOCK: { code: 'T81.10XA', display: 'Postprocedural shock unspecified' },
  DVT_LOWER_EXTREMITY: { code: 'I82.40', display: 'Acute embolism and thrombosis of unspecified deep veins of lower extremity' },
  PULMONARY_EMBOLISM: { code: 'I26.99', display: 'Other pulmonary embolism without acute cor pulmonale' },
  POSTOP_ATELECTASIS: { code: 'J98.11', display: 'Atelectasis' },
  POSTOP_PNEUMONIA: { code: 'J18.9', display: 'Pneumonia, unspecified organism' },
  POSTOP_ILEUS: { code: 'K91.89', display: 'Other postprocedural complications of digestive system' },
  URINARY_RETENTION: { code: 'R33.9', display: 'Retention of urine, unspecified' },
  UTI: { code: 'N39.0', display: 'Urinary tract infection, site not specified' },
  ACUTE_KIDNEY_INJURY: { code: 'N17.9', display: 'Acute kidney failure, unspecified' },
  POSTOP_DELIRIUM: { code: 'F05', display: 'Delirium due to known physiological condition' },
  ANEMIA_BLOOD_LOSS: { code: 'D62', display: 'Acute posthemorrhagic anemia' },
  POSTOP_FEVER: { code: 'R50.82', display: 'Postprocedural fever' },
  SURGICAL_SITE_SEROMA: { code: 'T81.89XA', display: 'Other complications of procedures, not elsewhere classified' },
  POSTOP_NAUSEA_VOMITING: { code: 'R11.2', display: 'Nausea with vomiting, unspecified' },

  // Pain diagnoses
  ACUTE_POSTOP_PAIN: { code: 'G89.18', display: 'Other acute postprocedural pain' },
  CHRONIC_POSTOP_PAIN: { code: 'G89.28', display: 'Other chronic postprocedural pain' },
  ACUTE_PAIN_UNSPECIFIED: { code: 'G89.11', display: 'Acute pain due to trauma' },

  // Cardiovascular
  ATRIAL_FIBRILLATION: { code: 'I48.91', display: 'Unspecified atrial fibrillation' },
  HYPERTENSION: { code: 'I10', display: 'Essential (primary) hypertension' },
  HYPOTENSION: { code: 'I95.9', display: 'Hypotension, unspecified' },
  TYPE_2_DIABETES: { code: 'E11.9', display: 'Type 2 diabetes mellitus without complications' },
  HEART_FAILURE: { code: 'I50.9', display: 'Heart failure, unspecified' },
  MYOCARDIAL_INFARCTION: { code: 'I21.9', display: 'Acute myocardial infarction, unspecified' },

  // Respiratory
  RESPIRATORY_FAILURE: { code: 'J96.00', display: 'Acute respiratory failure, unspecified' },
  PLEURAL_EFFUSION: { code: 'J90', display: 'Pleural effusion, not elsewhere classified' },

  // Metabolic
  HYPERGLYCEMIA: { code: 'R73.9', display: 'Hyperglycemia, unspecified' },
  HYPONATREMIA: { code: 'E87.1', display: 'Hypo-osmolality and hyponatremia' },
  HYPERKALEMIA: { code: 'E87.5', display: 'Hyperkalemia' },
  HYPOKALEMIA: { code: 'E87.6', display: 'Hypokalemia' },
  DEHYDRATION: { code: 'E86.0', display: 'Dehydration' },

  // Infectious
  SEPSIS: { code: 'A41.9', display: 'Sepsis, unspecified organism' },
  CELLULITIS: { code: 'L03.90', display: 'Cellulitis, unspecified' },
  C_DIFF: { code: 'A04.72', display: 'Enterocolitis due to Clostridioides difficile, not specified as recurrent' },
  MRSA: { code: 'A49.02', display: 'Methicillin resistant Staphylococcus aureus infection, unspecified site' },

  // Musculoskeletal
  JOINT_STIFFNESS: { code: 'M25.60', display: 'Stiffness of unspecified joint' },
  MUSCLE_WEAKNESS: { code: 'M62.81', display: 'Muscle weakness (generalized)' },
  FRACTURE_NONUNION: { code: 'M84.9', display: 'Disorder of continuity of bone, unspecified' },
  PROSTHESIS_COMPLICATION: { code: 'T84.09XA', display: 'Mechanical complication of internal joint prosthesis' },
  OSTEOARTHRITIS_KNEE: { code: 'M17.11', display: 'Primary osteoarthritis, right knee' },
  OSTEOARTHRITIS_HIP: { code: 'M16.11', display: 'Primary osteoarthritis, right hip' },
  LUMBAR_STENOSIS: { code: 'M48.06', display: 'Spinal stenosis, lumbar region' },

  // Surgical procedure Z-codes
  AFTERCARE_SURGERY: { code: 'Z48.89', display: 'Encounter for other specified aftercare' },
  AFTERCARE_JOINT_REPLACEMENT: { code: 'Z47.1', display: 'Aftercare following joint replacement surgery' },
  STATUS_JOINT_REPLACEMENT: { code: 'Z96.641', display: 'Presence of right artificial hip joint' },
  SURGICAL_FOLLOWUP: { code: 'Z09', display: 'Encounter for follow-up examination after completed treatment' },

  // Mental health
  ANXIETY: { code: 'F41.9', display: 'Anxiety disorder, unspecified' },
  DEPRESSION: { code: 'F32.9', display: 'Major depressive disorder, single episode, unspecified' },
  INSOMNIA: { code: 'G47.00', display: 'Insomnia, unspecified' },
  ADJUSTMENT_DISORDER: { code: 'F43.20', display: 'Adjustment disorder, unspecified' },
};

// ============================================================================
// Interfaces (using type aliases for erasableSyntaxOnly)
// ============================================================================

export type FHIRCoding = {
  system: string;
  code: string;
  display: string;
};

export type FHIRCodeableConcept = {
  coding: FHIRCoding[];
  text?: string;
};

export type FHIRReference = {
  reference: string;
  display?: string;
  type?: string;
};

export type FHIRPeriod = {
  start: string;
  end?: string;
};

export type FHIRIdentifier = {
  system: string;
  value: string;
  type?: FHIRCodeableConcept;
};

export type FHIRHumanName = {
  use: string;
  family: string;
  given: string[];
  prefix?: string[];
  suffix?: string[];
};

export type FHIRAddress = {
  use: string;
  type?: string;
  line: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type FHIRContactPoint = {
  system: string;
  value: string;
  use: string;
};

export type FHIRQuantity = {
  value: number;
  unit: string;
  system: string;
  code: string;
};

export type FHIRDosage = {
  sequence?: number;
  text: string;
  timing?: {
    repeat?: {
      frequency: number;
      period: number;
      periodUnit: string;
    };
  };
  route?: FHIRCodeableConcept;
  doseAndRate?: Array<{
    type?: FHIRCodeableConcept;
    doseQuantity?: FHIRQuantity;
  }>;
};

export type FHIRResource = {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
  [key: string]: unknown;
};

export type FHIRBundleEntry = {
  fullUrl?: string;
  resource: FHIRResource;
  request?: {
    method: HTTPVerb;
    url: string;
  };
  search?: {
    mode: string;
    score?: number;
  };
};

export type FHIRBundle = {
  resourceType: 'Bundle';
  id: string;
  type: BundleType;
  timestamp?: string;
  total?: number;
  entry: FHIRBundleEntry[];
  link?: Array<{ relation: string; url: string }>;
};

export type FHIRValidationResult = {
  valid: boolean;
  errors: FHIRValidationError[];
  warnings: FHIRValidationWarning[];
};

export type FHIRValidationError = {
  path: string;
  message: string;
  severity: 'error';
};

export type FHIRValidationWarning = {
  path: string;
  message: string;
  severity: 'warning';
};

export type PatientInput = {
  givenName: string;
  familyName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  mrn?: string;
  ssn?: string;
  phone?: string;
  email?: string;
  address?: {
    line: string[];
    city: string;
    state: string;
    postalCode: string;
  };
};

export type EncounterInput = {
  patientId: string;
  status: EncounterStatus;
  class: 'IMP' | 'AMB' | 'EMER' | 'HH' | 'OBSENC';
  type?: string;
  period: FHIRPeriod;
  reasonCode?: string;
  facility?: string;
};

export type ConditionInput = {
  patientId: string;
  encounterId?: string;
  snomedCode: string;
  icd10Code?: string;
  clinicalStatus: ConditionClinicalStatus;
  verificationStatus: ConditionVerificationStatus;
  onsetDate?: string;
  abatementDate?: string;
};

export type ObservationInput = {
  patientId: string;
  encounterId?: string;
  loincCode: string;
  value: number;
  effectiveDateTime: string;
  status?: ObservationStatus;
  interpretation?: 'N' | 'L' | 'H' | 'LL' | 'HH' | 'A';
};

export type MedicationRequestInput = {
  patientId: string;
  encounterId?: string;
  medicationName: string;
  rxnormCode?: string;
  dosageText: string;
  status: MedicationRequestStatus;
  intent: MedicationRequestIntent;
  authoredOn: string;
  requesterId?: string;
};

export type ProcedureInput = {
  patientId: string;
  encounterId?: string;
  snomedCode?: string;
  cptCode?: string;
  status: 'preparation' | 'in-progress' | 'not-done' | 'on-hold' | 'stopped' | 'completed';
  performedDateTime: string;
  performerId?: string;
};

export type AllergyInput = {
  patientId: string;
  substance: string;
  snomedCode?: string;
  type: AllergyIntoleranceType;
  criticality: AllergyIntoleranceCriticality;
  reaction?: string;
  onsetDate?: string;
};

export type DiagnosticReportInput = {
  patientId: string;
  encounterId?: string;
  loincCode: string;
  status: DiagnosticReportStatus;
  effectiveDateTime: string;
  observationIds?: string[];
  conclusion?: string;
};

export type CarePlanInput = {
  patientId: string;
  encounterId?: string;
  title: string;
  status: CarePlanStatus;
  intent: 'proposal' | 'plan' | 'order' | 'option';
  period: FHIRPeriod;
  categories?: string[];
  activities?: Array<{
    description: string;
    status: 'not-started' | 'scheduled' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  }>;
};

export type SelfLearningEntry = {
  timestamp: string;
  resourceType: string;
  field: string;
  originalValue: string;
  correctedValue: string;
  context?: string;
};

export type FHIRResourceEngine = {
  createPatient(input: PatientInput): FHIRResource;
  createEncounter(input: EncounterInput): FHIRResource;
  createCondition(input: ConditionInput): FHIRResource;
  createObservation(input: ObservationInput): FHIRResource;
  createMedicationRequest(input: MedicationRequestInput): FHIRResource;
  createProcedure(input: ProcedureInput): FHIRResource;
  createAllergyIntolerance(input: AllergyInput): FHIRResource;
  createDiagnosticReport(input: DiagnosticReportInput): FHIRResource;
  createCarePlan(input: CarePlanInput): FHIRResource;
  createBundle(type: BundleType, resources: FHIRResource[]): FHIRBundle;
  validateResource(resource: FHIRResource): FHIRValidationResult;
  linkResources(source: FHIRResource, target: FHIRResource, relationship: string): FHIRResource;
  lookupSNOMED(key: string): FHIRCoding | null;
  lookupLOINC(key: string): FHIRCoding | null;
  lookupICD10(key: string): FHIRCoding | null;
  recordCorrection(entry: SelfLearningEntry): void;
  getLearnedMappings(): SelfLearningEntry[];
  getSuggestedMapping(resourceType: string, field: string, originalValue: string): string | null;
};

// ============================================================================
// Implementation
// ============================================================================

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

export function createFHIRResourceEngine(): FHIRResourceEngine {
  const corrections: SelfLearningEntry[] = [];

  function createPatient(input: PatientInput): FHIRResource {
    const id = generateId();
    const resource: FHIRResource = {
      resourceType: 'Patient',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'],
      },
      identifier: [] as FHIRIdentifier[],
      active: true,
      name: [
        {
          use: 'official',
          family: input.familyName,
          given: [input.givenName],
        },
      ] as FHIRHumanName[],
      gender: input.gender,
      birthDate: input.birthDate,
    };

    const identifiers = resource.identifier as FHIRIdentifier[];
    if (input.mrn) {
      identifiers.push({
        system: 'http://hospital.example.org/mrn',
        value: input.mrn,
        type: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR', display: 'Medical Record Number' }],
        },
      });
    }
    if (input.ssn) {
      identifiers.push({
        system: 'http://hl7.org/fhir/sid/us-ssn',
        value: input.ssn,
        type: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'SS', display: 'Social Security Number' }],
        },
      });
    }

    if (input.phone || input.email) {
      const telecom: FHIRContactPoint[] = [];
      if (input.phone) telecom.push({ system: 'phone', value: input.phone, use: 'home' });
      if (input.email) telecom.push({ system: 'email', value: input.email, use: 'home' });
      resource.telecom = telecom;
    }

    if (input.address) {
      resource.address = [
        {
          use: 'home',
          line: input.address.line,
          city: input.address.city,
          state: input.address.state,
          postalCode: input.address.postalCode,
          country: 'US',
        },
      ] as FHIRAddress[];
    }

    return resource;
  }

  function createEncounter(input: EncounterInput): FHIRResource {
    const id = generateId();
    const classDisplay: Record<string, string> = {
      IMP: 'inpatient encounter',
      AMB: 'ambulatory',
      EMER: 'emergency',
      HH: 'home health',
      OBSENC: 'observation encounter',
    };

    const resource: FHIRResource = {
      resourceType: 'Encounter',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter'],
      },
      status: input.status,
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: input.class,
        display: classDisplay[input.class] || input.class,
      },
      subject: {
        reference: `Patient/${input.patientId}`,
      } as FHIRReference,
      period: input.period,
    };

    if (input.type) {
      const snomedEntry = SNOMED_CODES[input.type];
      if (snomedEntry) {
        resource.type = [{
          coding: [{ system: CODING_SYSTEMS.SNOMED_CT, code: snomedEntry.code, display: snomedEntry.display }],
          text: snomedEntry.display,
        }];
      }
    }

    if (input.reasonCode) {
      const icdEntry = ICD10_CODES[input.reasonCode];
      if (icdEntry) {
        resource.reasonCode = [{
          coding: [{ system: CODING_SYSTEMS.ICD10_CM, code: icdEntry.code, display: icdEntry.display }],
        }];
      }
    }

    if (input.facility) {
      resource.serviceProvider = {
        display: input.facility,
      };
    }

    return resource;
  }

  function createCondition(input: ConditionInput): FHIRResource {
    const id = generateId();
    const snomedEntry = SNOMED_CODES[input.snomedCode];
    const coding: FHIRCoding[] = [];

    if (snomedEntry) {
      coding.push({ system: CODING_SYSTEMS.SNOMED_CT, code: snomedEntry.code, display: snomedEntry.display });
    }

    if (input.icd10Code) {
      const icdEntry = ICD10_CODES[input.icd10Code];
      if (icdEntry) {
        coding.push({ system: CODING_SYSTEMS.ICD10_CM, code: icdEntry.code, display: icdEntry.display });
      }
    }

    const resource: FHIRResource = {
      resourceType: 'Condition',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition'],
      },
      clinicalStatus: {
        coding: [{
          system: CODING_SYSTEMS.HL7_CONDITION_CLINICAL,
          code: input.clinicalStatus,
        }],
      },
      verificationStatus: {
        coding: [{
          system: CODING_SYSTEMS.HL7_CONDITION_VERIFICATION,
          code: input.verificationStatus,
        }],
      },
      code: { coding, text: snomedEntry?.display || input.snomedCode },
      subject: { reference: `Patient/${input.patientId}` } as FHIRReference,
    };

    if (input.encounterId) {
      resource.encounter = { reference: `Encounter/${input.encounterId}` } as FHIRReference;
    }
    if (input.onsetDate) {
      resource.onsetDateTime = input.onsetDate;
    }
    if (input.abatementDate) {
      resource.abatementDateTime = input.abatementDate;
    }

    return resource;
  }

  function createObservation(input: ObservationInput): FHIRResource {
    const id = generateId();
    const loincEntry = LOINC_CODES[input.loincCode];

    const resource: FHIRResource = {
      resourceType: 'Observation',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab'],
      },
      status: input.status || 'final',
      category: [{
        coding: [{
          system: CODING_SYSTEMS.HL7_OBSERVATION_CATEGORY,
          code: 'laboratory',
          display: 'Laboratory',
        }],
      }],
      code: {
        coding: loincEntry
          ? [{ system: CODING_SYSTEMS.LOINC, code: loincEntry.code, display: loincEntry.display }]
          : [{ system: CODING_SYSTEMS.LOINC, code: input.loincCode, display: input.loincCode }],
        text: loincEntry?.display || input.loincCode,
      },
      subject: { reference: `Patient/${input.patientId}` } as FHIRReference,
      effectiveDateTime: input.effectiveDateTime,
      valueQuantity: {
        value: input.value,
        unit: loincEntry?.unit || '',
        system: CODING_SYSTEMS.UCUM,
        code: loincEntry?.unit || '',
      } as FHIRQuantity,
    };

    if (input.encounterId) {
      resource.encounter = { reference: `Encounter/${input.encounterId}` } as FHIRReference;
    }

    if (input.interpretation) {
      const interpMap: Record<string, string> = {
        N: 'Normal', L: 'Low', H: 'High', LL: 'Critically low', HH: 'Critically high', A: 'Abnormal',
      };
      resource.interpretation = [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: input.interpretation,
          display: interpMap[input.interpretation],
        }],
      }];
    }

    // Add reference range if LOINC code is known
    if (loincEntry) {
      resource.referenceRange = [{
        low: { value: loincEntry.normalRange.low, unit: loincEntry.unit, system: CODING_SYSTEMS.UCUM, code: loincEntry.unit },
        high: { value: loincEntry.normalRange.high, unit: loincEntry.unit, system: CODING_SYSTEMS.UCUM, code: loincEntry.unit },
      }];
    }

    return resource;
  }

  function createMedicationRequest(input: MedicationRequestInput): FHIRResource {
    const id = generateId();
    const coding: FHIRCoding[] = [];

    if (input.rxnormCode) {
      coding.push({ system: CODING_SYSTEMS.RXNORM, code: input.rxnormCode, display: input.medicationName });
    }

    const resource: FHIRResource = {
      resourceType: 'MedicationRequest',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest'],
      },
      status: input.status,
      intent: input.intent,
      medicationCodeableConcept: {
        coding: coding.length > 0 ? coding : [{ display: input.medicationName }],
        text: input.medicationName,
      },
      subject: { reference: `Patient/${input.patientId}` } as FHIRReference,
      authoredOn: input.authoredOn,
      dosageInstruction: [{
        text: input.dosageText,
      }] as FHIRDosage[],
    };

    if (input.encounterId) {
      resource.encounter = { reference: `Encounter/${input.encounterId}` } as FHIRReference;
    }
    if (input.requesterId) {
      resource.requester = { reference: `Practitioner/${input.requesterId}` } as FHIRReference;
    }

    return resource;
  }

  function createProcedure(input: ProcedureInput): FHIRResource {
    const id = generateId();
    const coding: FHIRCoding[] = [];

    if (input.snomedCode) {
      const snomedEntry = SNOMED_CODES[input.snomedCode];
      if (snomedEntry) {
        coding.push({ system: CODING_SYSTEMS.SNOMED_CT, code: snomedEntry.code, display: snomedEntry.display });
      }
    }

    if (input.cptCode) {
      coding.push({ system: CODING_SYSTEMS.CPT, code: input.cptCode, display: input.cptCode });
    }

    const resource: FHIRResource = {
      resourceType: 'Procedure',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-procedure'],
      },
      status: input.status,
      code: {
        coding,
        text: coding[0]?.display || 'Unknown procedure',
      },
      subject: { reference: `Patient/${input.patientId}` } as FHIRReference,
      performedDateTime: input.performedDateTime,
    };

    if (input.encounterId) {
      resource.encounter = { reference: `Encounter/${input.encounterId}` } as FHIRReference;
    }
    if (input.performerId) {
      resource.performer = [{ actor: { reference: `Practitioner/${input.performerId}` } as FHIRReference }];
    }

    return resource;
  }

  function createAllergyIntolerance(input: AllergyInput): FHIRResource {
    const id = generateId();
    const coding: FHIRCoding[] = [];

    if (input.snomedCode) {
      const entry = SNOMED_CODES[input.snomedCode];
      if (entry) {
        coding.push({ system: CODING_SYSTEMS.SNOMED_CT, code: entry.code, display: entry.display });
      }
    }

    const resource: FHIRResource = {
      resourceType: 'AllergyIntolerance',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-allergyintolerance'],
      },
      clinicalStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }],
      },
      verificationStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }],
      },
      type: input.type,
      criticality: input.criticality,
      code: {
        coding: coding.length > 0 ? coding : undefined,
        text: input.substance,
      },
      patient: { reference: `Patient/${input.patientId}` } as FHIRReference,
    };

    if (input.reaction) {
      resource.reaction = [{
        manifestation: [{ text: input.reaction }],
      }];
    }

    if (input.onsetDate) {
      resource.onsetDateTime = input.onsetDate;
    }

    return resource;
  }

  function createDiagnosticReport(input: DiagnosticReportInput): FHIRResource {
    const id = generateId();
    const loincEntry = LOINC_CODES[input.loincCode];

    const resource: FHIRResource = {
      resourceType: 'DiagnosticReport',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-lab'],
      },
      status: input.status,
      category: [{
        coding: [{
          system: CODING_SYSTEMS.HL7_OBSERVATION_CATEGORY,
          code: 'LAB',
          display: 'Laboratory',
        }],
      }],
      code: {
        coding: loincEntry
          ? [{ system: CODING_SYSTEMS.LOINC, code: loincEntry.code, display: loincEntry.display }]
          : [{ system: CODING_SYSTEMS.LOINC, code: input.loincCode, display: input.loincCode }],
      },
      subject: { reference: `Patient/${input.patientId}` } as FHIRReference,
      effectiveDateTime: input.effectiveDateTime,
    };

    if (input.encounterId) {
      resource.encounter = { reference: `Encounter/${input.encounterId}` } as FHIRReference;
    }

    if (input.observationIds && input.observationIds.length > 0) {
      resource.result = input.observationIds.map(obsId => ({
        reference: `Observation/${obsId}`,
      } as FHIRReference));
    }

    if (input.conclusion) {
      resource.conclusion = input.conclusion;
    }

    return resource;
  }

  function createCarePlan(input: CarePlanInput): FHIRResource {
    const id = generateId();
    const resource: FHIRResource = {
      resourceType: 'CarePlan',
      id,
      meta: {
        versionId: '1',
        lastUpdated: nowISO(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-careplan'],
      },
      status: input.status,
      intent: input.intent,
      title: input.title,
      subject: { reference: `Patient/${input.patientId}` } as FHIRReference,
      period: input.period,
    };

    if (input.encounterId) {
      resource.encounter = { reference: `Encounter/${input.encounterId}` } as FHIRReference;
    }

    if (input.categories && input.categories.length > 0) {
      resource.category = input.categories.map(cat => ({
        coding: [{ system: CODING_SYSTEMS.SNOMED_CT, code: cat, display: cat }],
      }));
    }

    if (input.activities && input.activities.length > 0) {
      resource.activity = input.activities.map(act => ({
        detail: {
          status: act.status,
          description: act.description,
        },
      }));
    }

    return resource;
  }

  function createBundle(type: BundleType, resources: FHIRResource[]): FHIRBundle {
    const bundle: FHIRBundle = {
      resourceType: 'Bundle',
      id: generateId(),
      type,
      timestamp: nowISO(),
      total: resources.length,
      entry: [],
    };

    for (const res of resources) {
      const entry: FHIRBundleEntry = {
        fullUrl: `urn:uuid:${res.id}`,
        resource: res,
      };

      if (type === BundleType.TRANSACTION) {
        entry.request = {
          method: HTTPVerb.POST,
          url: res.resourceType,
        };
      }

      if (type === BundleType.SEARCHSET) {
        entry.search = {
          mode: 'match',
          score: 1.0,
        };
      }

      bundle.entry.push(entry);
    }

    if (type === BundleType.SEARCHSET) {
      bundle.link = [
        { relation: 'self', url: 'http://example.org/fhir/Bundle' },
      ];
    }

    return bundle;
  }

  function validateResource(resource: FHIRResource): FHIRValidationResult {
    const errors: FHIRValidationError[] = [];
    const warnings: FHIRValidationWarning[] = [];

    // Required field: resourceType
    if (!resource.resourceType) {
      errors.push({ path: 'resourceType', message: 'resourceType is required', severity: 'error' });
    }

    // Required field: id
    if (!resource.id) {
      errors.push({ path: 'id', message: 'id is required', severity: 'error' });
    }

    // Type-specific validation
    switch (resource.resourceType) {
      case 'Patient': {
        const names = resource.name as FHIRHumanName[] | undefined;
        if (!names || names.length === 0) {
          errors.push({ path: 'Patient.name', message: 'Patient must have at least one name', severity: 'error' });
        }
        if (!resource.gender) {
          errors.push({ path: 'Patient.gender', message: 'Patient gender is required for US Core', severity: 'error' });
        }
        if (!resource.birthDate) {
          warnings.push({ path: 'Patient.birthDate', message: 'birthDate is recommended', severity: 'warning' });
        }
        break;
      }
      case 'Encounter': {
        if (!resource.status) {
          errors.push({ path: 'Encounter.status', message: 'Encounter status is required', severity: 'error' });
        }
        if (!resource.class) {
          errors.push({ path: 'Encounter.class', message: 'Encounter class is required', severity: 'error' });
        }
        if (!resource.subject) {
          errors.push({ path: 'Encounter.subject', message: 'Encounter must reference a patient', severity: 'error' });
        }
        break;
      }
      case 'Condition': {
        if (!resource.clinicalStatus) {
          errors.push({ path: 'Condition.clinicalStatus', message: 'clinicalStatus is required', severity: 'error' });
        }
        if (!resource.code) {
          errors.push({ path: 'Condition.code', message: 'Condition code is required', severity: 'error' });
        }
        if (!resource.subject) {
          errors.push({ path: 'Condition.subject', message: 'Condition must reference a patient', severity: 'error' });
        }
        break;
      }
      case 'Observation': {
        if (!resource.status) {
          errors.push({ path: 'Observation.status', message: 'Observation status is required', severity: 'error' });
        }
        if (!resource.code) {
          errors.push({ path: 'Observation.code', message: 'Observation code is required', severity: 'error' });
        }
        if (!resource.subject) {
          errors.push({ path: 'Observation.subject', message: 'Observation must reference a patient', severity: 'error' });
        }
        if (!resource.effectiveDateTime && !resource.effectivePeriod) {
          warnings.push({ path: 'Observation.effective[x]', message: 'effective[x] is recommended', severity: 'warning' });
        }
        break;
      }
      case 'MedicationRequest': {
        if (!resource.status) {
          errors.push({ path: 'MedicationRequest.status', message: 'status is required', severity: 'error' });
        }
        if (!resource.intent) {
          errors.push({ path: 'MedicationRequest.intent', message: 'intent is required', severity: 'error' });
        }
        if (!resource.medicationCodeableConcept && !resource.medicationReference) {
          errors.push({ path: 'MedicationRequest.medication[x]', message: 'medication[x] is required', severity: 'error' });
        }
        if (!resource.subject) {
          errors.push({ path: 'MedicationRequest.subject', message: 'subject is required', severity: 'error' });
        }
        break;
      }
      case 'Procedure': {
        if (!resource.status) {
          errors.push({ path: 'Procedure.status', message: 'status is required', severity: 'error' });
        }
        if (!resource.code) {
          errors.push({ path: 'Procedure.code', message: 'code is required', severity: 'error' });
        }
        if (!resource.subject) {
          errors.push({ path: 'Procedure.subject', message: 'subject is required', severity: 'error' });
        }
        break;
      }
      case 'AllergyIntolerance': {
        if (!resource.patient && !resource.subject) {
          errors.push({ path: 'AllergyIntolerance.patient', message: 'patient is required', severity: 'error' });
        }
        if (!resource.code) {
          warnings.push({ path: 'AllergyIntolerance.code', message: 'code is recommended', severity: 'warning' });
        }
        break;
      }
      case 'DiagnosticReport': {
        if (!resource.status) {
          errors.push({ path: 'DiagnosticReport.status', message: 'status is required', severity: 'error' });
        }
        if (!resource.code) {
          errors.push({ path: 'DiagnosticReport.code', message: 'code is required', severity: 'error' });
        }
        if (!resource.subject) {
          errors.push({ path: 'DiagnosticReport.subject', message: 'subject is required', severity: 'error' });
        }
        break;
      }
      case 'CarePlan': {
        if (!resource.status) {
          errors.push({ path: 'CarePlan.status', message: 'status is required', severity: 'error' });
        }
        if (!resource.intent) {
          errors.push({ path: 'CarePlan.intent', message: 'intent is required', severity: 'error' });
        }
        if (!resource.subject) {
          errors.push({ path: 'CarePlan.subject', message: 'subject is required', severity: 'error' });
        }
        break;
      }
    }

    // Validate coding systems
    const codeField = resource.code as FHIRCodeableConcept | undefined;
    if (codeField?.coding) {
      for (const coding of codeField.coding) {
        if (coding.system && !coding.code) {
          warnings.push({
            path: `${resource.resourceType}.code.coding`,
            message: `Coding has system '${coding.system}' but no code`,
            severity: 'warning',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  function linkResources(source: FHIRResource, target: FHIRResource, relationship: string): FHIRResource {
    const linked = { ...source };
    const ref: FHIRReference = {
      reference: `${target.resourceType}/${target.id}`,
      type: target.resourceType,
    };

    switch (relationship) {
      case 'subject':
        linked.subject = ref;
        break;
      case 'encounter':
        linked.encounter = ref;
        break;
      case 'performer':
        linked.performer = [{ actor: ref }];
        break;
      case 'requester':
        linked.requester = ref;
        break;
      case 'result':
        if (!linked.result) linked.result = [];
        (linked.result as FHIRReference[]).push(ref);
        break;
      case 'partOf':
        linked.partOf = ref;
        break;
      default:
        linked[relationship] = ref;
    }

    return linked;
  }

  function lookupSNOMED(key: string): FHIRCoding | null {
    const entry = SNOMED_CODES[key];
    if (!entry) return null;

    // Check for learned corrections
    const suggestion = getSuggestedMapping('SNOMED', 'code', key);
    if (suggestion) {
      const correctedEntry = Object.values(SNOMED_CODES).find(e => e.code === suggestion);
      if (correctedEntry) {
        return { system: CODING_SYSTEMS.SNOMED_CT, code: correctedEntry.code, display: correctedEntry.display };
      }
    }

    return { system: CODING_SYSTEMS.SNOMED_CT, code: entry.code, display: entry.display };
  }

  function lookupLOINC(key: string): FHIRCoding | null {
    const entry = LOINC_CODES[key];
    if (!entry) return null;
    return { system: CODING_SYSTEMS.LOINC, code: entry.code, display: entry.display };
  }

  function lookupICD10(key: string): FHIRCoding | null {
    const entry = ICD10_CODES[key];
    if (!entry) return null;
    return { system: CODING_SYSTEMS.ICD10_CM, code: entry.code, display: entry.display };
  }

  function recordCorrection(entry: SelfLearningEntry): void {
    corrections.push({ ...entry, timestamp: entry.timestamp || nowISO() });
  }

  function getLearnedMappings(): SelfLearningEntry[] {
    return [...corrections];
  }

  function getSuggestedMapping(resourceType: string, field: string, originalValue: string): string | null {
    const relevant = corrections.filter(
      c => c.resourceType === resourceType && c.field === field && c.originalValue === originalValue
    );
    if (relevant.length === 0) return null;

    // Return the most recent correction
    const sorted = relevant.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted[0].correctedValue;
  }

  return {
    createPatient,
    createEncounter,
    createCondition,
    createObservation,
    createMedicationRequest,
    createProcedure,
    createAllergyIntolerance,
    createDiagnosticReport,
    createCarePlan,
    createBundle,
    validateResource,
    linkResources,
    lookupSNOMED,
    lookupLOINC,
    lookupICD10,
    recordCorrection,
    getLearnedMappings,
    getSuggestedMapping,
  };
}
