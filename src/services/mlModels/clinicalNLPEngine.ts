/**
 * Clinical NLP Entity Extractor for Post-Operative Recovery
 *
 * Implements named entity recognition and information extraction for medical text:
 * 1. Named entity recognition (medications, conditions, procedures, lab values, anatomy)
 * 2. Medical terminology dictionary (500+ terms)
 * 3. UMLS-style concept mapping
 * 4. Negation detection (NegEx algorithm)
 * 5. Temporal expression extraction
 * 6. Relation extraction between entities
 *
 * Self-learning: improves extraction based on clinician corrections.
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const EntityType = {
  MEDICATION: 'medication',
  CONDITION: 'condition',
  PROCEDURE: 'procedure',
  LAB_VALUE: 'lab_value',
  ANATOMY: 'anatomy',
  SYMPTOM: 'symptom',
  VITAL_SIGN: 'vital_sign',
  DOSAGE: 'dosage',
  FREQUENCY: 'frequency',
  TEMPORAL: 'temporal',
  NEGATION_CUE: 'negation_cue',
} as const;
export type EntityType = typeof EntityType[keyof typeof EntityType];

export const RelationType = {
  TREATS: 'treats',
  CAUSES: 'causes',
  ADMINISTERED_FOR: 'administered_for',
  LOCATED_AT: 'located_at',
  MEASURED_AS: 'measured_as',
  DOSAGE_OF: 'dosage_of',
  FREQUENCY_OF: 'frequency_of',
  NEGATED: 'negated',
  TEMPORAL_OF: 'temporal_of',
} as const;
export type RelationType = typeof RelationType[keyof typeof RelationType];

export type ExtractedEntity = {
  id: string;
  text: string;
  type: EntityType;
  startIndex: number;
  endIndex: number;
  normalizedForm: string;
  conceptId: string; // UMLS-style CUI
  confidence: number;
  isNegated: boolean;
  metadata: Record<string, string>;
};

export type ExtractedRelation = {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: RelationType;
  confidence: number;
};

export type TemporalExpression = {
  text: string;
  startIndex: number;
  endIndex: number;
  normalizedValue: string;
  type: 'date' | 'time' | 'duration' | 'frequency' | 'relative';
};

export type ExtractionResult = {
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  temporalExpressions: TemporalExpression[];
  negatedEntities: ExtractedEntity[];
  rawText: string;
};

export type CorrectionRecord = {
  text: string;
  originalEntity: { text: string; type: EntityType };
  correctedType: EntityType | null; // null means the entity was false positive
  correctedText: string | null;
  timestamp: number;
  clinicianId: string;
};

export type ConceptEntry = {
  cui: string; // Concept Unique Identifier
  preferred: string;
  synonyms: string[];
  type: EntityType;
  semanticGroup: string;
};

// ============================================================================
// Medical Terminology Dictionary (500+ terms)
// ============================================================================

const MEDICATION_TERMS: Array<{ term: string; cui: string; synonyms: string[] }> = [
  // Analgesics
  { term: 'morphine', cui: 'C0026549', synonyms: ['morphine sulfate', 'ms contin', 'roxanol'] },
  { term: 'oxycodone', cui: 'C0030049', synonyms: ['oxycontin', 'percocet', 'roxicodone'] },
  { term: 'hydrocodone', cui: 'C0020293', synonyms: ['vicodin', 'lortab', 'norco'] },
  { term: 'fentanyl', cui: 'C0015846', synonyms: ['fentanyl patch', 'duragesic', 'sublimaze'] },
  { term: 'acetaminophen', cui: 'C0000970', synonyms: ['tylenol', 'apap', 'paracetamol'] },
  { term: 'ibuprofen', cui: 'C0020740', synonyms: ['advil', 'motrin', 'nurofen'] },
  { term: 'ketorolac', cui: 'C0073631', synonyms: ['toradol'] },
  { term: 'naproxen', cui: 'C0027396', synonyms: ['aleve', 'naprosyn', 'anaprox'] },
  { term: 'celecoxib', cui: 'C0538927', synonyms: ['celebrex'] },
  { term: 'tramadol', cui: 'C0040610', synonyms: ['ultram', 'conzip'] },
  { term: 'gabapentin', cui: 'C0060926', synonyms: ['neurontin', 'gralise'] },
  { term: 'pregabalin', cui: 'C0700185', synonyms: ['lyrica'] },
  // Anticoagulants
  { term: 'warfarin', cui: 'C0043031', synonyms: ['coumadin', 'jantoven'] },
  { term: 'heparin', cui: 'C0019134', synonyms: ['unfractionated heparin', 'ufh'] },
  { term: 'enoxaparin', cui: 'C0206460', synonyms: ['lovenox', 'clexane'] },
  { term: 'rivaroxaban', cui: 'C1739768', synonyms: ['xarelto'] },
  { term: 'apixaban', cui: 'C1831808', synonyms: ['eliquis'] },
  { term: 'aspirin', cui: 'C0004057', synonyms: ['asa', 'acetylsalicylic acid', 'ecotrin'] },
  { term: 'clopidogrel', cui: 'C0070166', synonyms: ['plavix'] },
  // Antibiotics
  { term: 'cefazolin', cui: 'C0007554', synonyms: ['ancef', 'kefzol'] },
  { term: 'cephalexin', cui: 'C0007716', synonyms: ['keflex'] },
  { term: 'amoxicillin', cui: 'C0002645', synonyms: ['amoxil', 'augmentin'] },
  { term: 'ciprofloxacin', cui: 'C0008809', synonyms: ['cipro', 'ciproxin'] },
  { term: 'metronidazole', cui: 'C0025872', synonyms: ['flagyl', 'metrogel'] },
  { term: 'clindamycin', cui: 'C0008947', synonyms: ['cleocin', 'dalacin'] },
  { term: 'vancomycin', cui: 'C0042313', synonyms: ['vancocin'] },
  { term: 'azithromycin', cui: 'C0052796', synonyms: ['zithromax', 'z-pack'] },
  { term: 'levofloxacin', cui: 'C0282386', synonyms: ['levaquin'] },
  { term: 'doxycycline', cui: 'C0013090', synonyms: ['vibramycin', 'doryx'] },
  // Cardiovascular
  { term: 'metoprolol', cui: 'C0025859', synonyms: ['lopressor', 'toprol'] },
  { term: 'lisinopril', cui: 'C0065374', synonyms: ['zestril', 'prinivil'] },
  { term: 'amlodipine', cui: 'C0051696', synonyms: ['norvasc'] },
  { term: 'atorvastatin', cui: 'C0286651', synonyms: ['lipitor'] },
  { term: 'furosemide', cui: 'C0016860', synonyms: ['lasix'] },
  { term: 'hydrochlorothiazide', cui: 'C0020261', synonyms: ['hctz', 'microzide'] },
  { term: 'losartan', cui: 'C0126174', synonyms: ['cozaar'] },
  { term: 'carvedilol', cui: 'C0071097', synonyms: ['coreg'] },
  // GI
  { term: 'omeprazole', cui: 'C0028978', synonyms: ['prilosec'] },
  { term: 'pantoprazole', cui: 'C0081876', synonyms: ['protonix'] },
  { term: 'ondansetron', cui: 'C0061851', synonyms: ['zofran'] },
  { term: 'metoclopramide', cui: 'C0025853', synonyms: ['reglan'] },
  { term: 'docusate', cui: 'C0058891', synonyms: ['colace', 'docusate sodium'] },
  { term: 'sennosides', cui: 'C0036816', synonyms: ['senokot', 'senna'] },
  // Endocrine
  { term: 'metformin', cui: 'C0025598', synonyms: ['glucophage'] },
  { term: 'insulin', cui: 'C0021641', synonyms: ['insulin glargine', 'lantus', 'novolog', 'humalog'] },
  { term: 'prednisone', cui: 'C0032952', synonyms: ['deltasone'] },
  { term: 'dexamethasone', cui: 'C0011777', synonyms: ['decadron'] },
  { term: 'methylprednisolone', cui: 'C0025815', synonyms: ['medrol', 'solu-medrol'] },
  { term: 'levothyroxine', cui: 'C0040165', synonyms: ['synthroid', 'levoxyl', 'tirosint'] },
  // Psych
  { term: 'sertraline', cui: 'C0074393', synonyms: ['zoloft'] },
  { term: 'duloxetine', cui: 'C0245561', synonyms: ['cymbalta'] },
  { term: 'escitalopram', cui: 'C1099456', synonyms: ['lexapro'] },
  { term: 'lorazepam', cui: 'C0024002', synonyms: ['ativan'] },
  { term: 'diazepam', cui: 'C0012010', synonyms: ['valium'] },
  { term: 'midazolam', cui: 'C0026056', synonyms: ['versed'] },
  { term: 'fluoxetine', cui: 'C0016365', synonyms: ['prozac'] },
  { term: 'bupropion', cui: 'C0085208', synonyms: ['wellbutrin', 'zyban'] },
  { term: 'trazodone', cui: 'C0040636', synonyms: ['desyrel'] },
  { term: 'quetiapine', cui: 'C0123091', synonyms: ['seroquel'] },
  // Other
  { term: 'diphenhydramine', cui: 'C0012522', synonyms: ['benadryl'] },
  { term: 'cyclobenzaprine', cui: 'C0010603', synonyms: ['flexeril', 'amrix'] },
  { term: 'lidocaine', cui: 'C0023660', synonyms: ['xylocaine', 'lidoderm'] },
  { term: 'albuterol', cui: 'C0001927', synonyms: ['proventil', 'ventolin', 'proair'] },
  { term: 'fluconazole', cui: 'C0016277', synonyms: ['diflucan'] },
  { term: 'amiodarone', cui: 'C0002598', synonyms: ['cordarone', 'pacerone'] },
];

const CONDITION_TERMS: Array<{ term: string; cui: string; synonyms: string[] }> = [
  { term: 'surgical site infection', cui: 'C0038941', synonyms: ['ssi', 'wound infection', 'post-operative infection'] },
  { term: 'deep vein thrombosis', cui: 'C0149871', synonyms: ['dvt', 'venous thrombosis', 'deep venous thrombosis'] },
  { term: 'pulmonary embolism', cui: 'C0034065', synonyms: ['pe', 'lung clot', 'pulmonary thromboembolism'] },
  { term: 'pneumonia', cui: 'C0032285', synonyms: ['lung infection', 'pna'] },
  { term: 'urinary tract infection', cui: 'C0042029', synonyms: ['uti', 'bladder infection', 'cystitis'] },
  { term: 'ileus', cui: 'C0020721', synonyms: ['paralytic ileus', 'postoperative ileus', 'bowel obstruction'] },
  { term: 'wound dehiscence', cui: 'C0259768', synonyms: ['dehiscence', 'wound separation', 'wound breakdown'] },
  { term: 'hemorrhage', cui: 'C0019080', synonyms: ['bleeding', 'blood loss', 'hemorrhaging'] },
  { term: 'acute kidney injury', cui: 'C2609414', synonyms: ['aki', 'acute renal failure', 'renal insufficiency'] },
  { term: 'atelectasis', cui: 'C0004144', synonyms: ['lung collapse', 'collapsed lung'] },
  { term: 'sepsis', cui: 'C0036690', synonyms: ['septicemia', 'blood infection', 'systemic infection'] },
  { term: 'hypertension', cui: 'C0020538', synonyms: ['htn', 'high blood pressure', 'elevated bp'] },
  { term: 'diabetes mellitus', cui: 'C0011849', synonyms: ['diabetes', 'dm', 'type 2 diabetes', 'dm2', 't2dm'] },
  { term: 'heart failure', cui: 'C0018801', synonyms: ['chf', 'congestive heart failure', 'hf'] },
  { term: 'atrial fibrillation', cui: 'C0004238', synonyms: ['afib', 'a-fib', 'af'] },
  { term: 'copd', cui: 'C0024117', synonyms: ['chronic obstructive pulmonary disease', 'emphysema'] },
  { term: 'chronic kidney disease', cui: 'C1561643', synonyms: ['ckd', 'chronic renal disease'] },
  { term: 'coronary artery disease', cui: 'C0010054', synonyms: ['cad', 'ischemic heart disease', 'ihd'] },
  { term: 'osteoarthritis', cui: 'C0029408', synonyms: ['oa', 'degenerative joint disease', 'djd'] },
  { term: 'obesity', cui: 'C0028754', synonyms: ['obese', 'morbid obesity'] },
  { term: 'hypotension', cui: 'C0020649', synonyms: ['low blood pressure', 'low bp'] },
  { term: 'hyperglycemia', cui: 'C0020456', synonyms: ['high blood sugar', 'elevated glucose'] },
  { term: 'hypoglycemia', cui: 'C0020615', synonyms: ['low blood sugar', 'low glucose'] },
  { term: 'nausea', cui: 'C0027497', synonyms: ['nauseous', 'feeling sick'] },
  { term: 'vomiting', cui: 'C0042963', synonyms: ['emesis', 'throwing up'] },
  { term: 'constipation', cui: 'C0009806', synonyms: ['no bowel movement', 'difficulty passing stool'] },
  { term: 'delirium', cui: 'C0011206', synonyms: ['acute confusional state', 'altered mental status', 'ams'] },
  { term: 'pain', cui: 'C0030193', synonyms: ['discomfort', 'ache', 'soreness', 'tenderness'] },
  { term: 'edema', cui: 'C0013604', synonyms: ['swelling', 'fluid retention', 'pitting edema'] },
  { term: 'fever', cui: 'C0015967', synonyms: ['pyrexia', 'febrile', 'elevated temperature'] },
  { term: 'dyspnea', cui: 'C0013404', synonyms: ['shortness of breath', 'sob', 'breathing difficulty'] },
  { term: 'tachycardia', cui: 'C0039231', synonyms: ['rapid heart rate', 'fast heartbeat'] },
  { term: 'bradycardia', cui: 'C0428977', synonyms: ['slow heart rate'] },
  { term: 'anemia', cui: 'C0002871', synonyms: ['low hemoglobin', 'low hgb'] },
  { term: 'hyponatremia', cui: 'C0020625', synonyms: ['low sodium', 'low na'] },
  { term: 'hyperkalemia', cui: 'C0020461', synonyms: ['high potassium', 'elevated k'] },
  { term: 'hypokalemia', cui: 'C0020621', synonyms: ['low potassium', 'low k'] },
  { term: 'cellulitis', cui: 'C0007642', synonyms: ['skin infection', 'soft tissue infection'] },
  { term: 'abscess', cui: 'C0000833', synonyms: ['pus collection', 'loculated fluid'] },
  { term: 'seroma', cui: 'C0262627', synonyms: ['fluid collection'] },
  { term: 'hematoma', cui: 'C0018944', synonyms: ['blood collection', 'bruise'] },
  { term: 'osteomyelitis', cui: 'C0029443', synonyms: ['bone infection'] },
  { term: 'rhabdomyolysis', cui: 'C0035410', synonyms: ['muscle breakdown'] },
  { term: 'thrombocytopenia', cui: 'C0040034', synonyms: ['low platelets'] },
  { term: 'leukocytosis', cui: 'C0023518', synonyms: ['elevated wbc', 'high white count'] },
];

const PROCEDURE_TERMS: Array<{ term: string; cui: string; synonyms: string[] }> = [
  { term: 'total knee arthroplasty', cui: 'C0086511', synonyms: ['tka', 'knee replacement', 'total knee replacement'] },
  { term: 'total hip arthroplasty', cui: 'C0040508', synonyms: ['tha', 'hip replacement', 'total hip replacement'] },
  { term: 'coronary artery bypass', cui: 'C0010055', synonyms: ['cabg', 'bypass surgery', 'heart bypass'] },
  { term: 'appendectomy', cui: 'C0003611', synonyms: ['appendix removal'] },
  { term: 'cholecystectomy', cui: 'C0008320', synonyms: ['gallbladder removal', 'chole'] },
  { term: 'colectomy', cui: 'C0009274', synonyms: ['colon resection', 'bowel resection'] },
  { term: 'hernia repair', cui: 'C0019328', synonyms: ['herniorrhaphy', 'hernioplasty'] },
  { term: 'laminectomy', cui: 'C0022983', synonyms: ['spinal decompression'] },
  { term: 'spinal fusion', cui: 'C0037935', synonyms: ['arthrodesis', 'spine fusion'] },
  { term: 'mastectomy', cui: 'C0024881', synonyms: ['breast removal'] },
  { term: 'hysterectomy', cui: 'C0020699', synonyms: ['uterus removal'] },
  { term: 'prostatectomy', cui: 'C0033436', synonyms: ['prostate removal'] },
  { term: 'nephrectomy', cui: 'C0027695', synonyms: ['kidney removal'] },
  { term: 'debridement', cui: 'C0011079', synonyms: ['wound debridement', 'tissue debridement'] },
  { term: 'wound closure', cui: 'C0191425', synonyms: ['suturing', 'stapling'] },
  { term: 'incision and drainage', cui: 'C0184898', synonyms: ['i&d', 'i and d'] },
  { term: 'central line placement', cui: 'C0007430', synonyms: ['central venous catheter', 'cvc placement'] },
  { term: 'intubation', cui: 'C0021925', synonyms: ['endotracheal intubation', 'eti'] },
  { term: 'extubation', cui: 'C0553692', synonyms: ['tube removal'] },
  { term: 'blood transfusion', cui: 'C0005841', synonyms: ['transfusion', 'prbc transfusion', 'rbc transfusion'] },
  { term: 'physical therapy', cui: 'C0949766', synonyms: ['pt', 'physiotherapy', 'rehab'] },
  { term: 'ct scan', cui: 'C0040405', synonyms: ['computed tomography', 'cat scan'] },
  { term: 'mri', cui: 'C0024485', synonyms: ['magnetic resonance imaging'] },
  { term: 'x-ray', cui: 'C0043299', synonyms: ['xray', 'radiograph', 'plain film'] },
  { term: 'ultrasound', cui: 'C0041618', synonyms: ['us', 'sonography', 'echo'] },
  { term: 'ecg', cui: 'C0013798', synonyms: ['ekg', 'electrocardiogram'] },
];

const LAB_VALUE_TERMS: Array<{ term: string; cui: string; synonyms: string[]; unit: string }> = [
  { term: 'hemoglobin', cui: 'C0019046', synonyms: ['hgb', 'hb'], unit: 'g/dL' },
  { term: 'white blood cell count', cui: 'C0023508', synonyms: ['wbc', 'leukocyte count', 'white count'], unit: 'K/uL' },
  { term: 'platelet count', cui: 'C0032181', synonyms: ['plt', 'platelets', 'thrombocyte count'], unit: 'K/uL' },
  { term: 'creatinine', cui: 'C0010294', synonyms: ['cr', 'serum creatinine', 'scr'], unit: 'mg/dL' },
  { term: 'blood urea nitrogen', cui: 'C0005845', synonyms: ['bun'], unit: 'mg/dL' },
  { term: 'sodium', cui: 'C0523891', synonyms: ['na', 'serum sodium'], unit: 'mEq/L' },
  { term: 'potassium', cui: 'C0523892', synonyms: ['k', 'serum potassium'], unit: 'mEq/L' },
  { term: 'glucose', cui: 'C0017725', synonyms: ['blood sugar', 'blood glucose', 'bg', 'fbs'], unit: 'mg/dL' },
  { term: 'inr', cui: 'C0525032', synonyms: ['international normalized ratio', 'pt/inr'], unit: '' },
  { term: 'ptt', cui: 'C0030605', synonyms: ['partial thromboplastin time', 'aptt'], unit: 'seconds' },
  { term: 'albumin', cui: 'C0001924', synonyms: ['serum albumin', 'alb'], unit: 'g/dL' },
  { term: 'lactate', cui: 'C0022924', synonyms: ['lactic acid', 'serum lactate'], unit: 'mmol/L' },
  { term: 'procalcitonin', cui: 'C0072332', synonyms: ['pct'], unit: 'ng/mL' },
  { term: 'c-reactive protein', cui: 'C0006560', synonyms: ['crp'], unit: 'mg/L' },
  { term: 'hba1c', cui: 'C0019018', synonyms: ['hemoglobin a1c', 'glycated hemoglobin', 'a1c'], unit: '%' },
  { term: 'troponin', cui: 'C0041199', synonyms: ['troponin i', 'troponin t', 'tnl'], unit: 'ng/mL' },
  { term: 'ast', cui: 'C0004002', synonyms: ['aspartate aminotransferase', 'sgot'], unit: 'U/L' },
  { term: 'alt', cui: 'C0001899', synonyms: ['alanine aminotransferase', 'sgpt'], unit: 'U/L' },
  { term: 'bilirubin', cui: 'C0005437', synonyms: ['total bilirubin', 'tbili'], unit: 'mg/dL' },
  { term: 'alkaline phosphatase', cui: 'C0002059', synonyms: ['alk phos', 'alp'], unit: 'U/L' },
];

const ANATOMY_TERMS: Array<{ term: string; cui: string; synonyms: string[] }> = [
  { term: 'abdomen', cui: 'C0000726', synonyms: ['belly', 'abdominal'] },
  { term: 'chest', cui: 'C0817096', synonyms: ['thorax', 'thoracic'] },
  { term: 'knee', cui: 'C0022742', synonyms: ['knee joint'] },
  { term: 'hip', cui: 'C0019552', synonyms: ['hip joint'] },
  { term: 'spine', cui: 'C0037949', synonyms: ['spinal', 'vertebral column', 'back'] },
  { term: 'lung', cui: 'C0024109', synonyms: ['lungs', 'pulmonary'] },
  { term: 'heart', cui: 'C0018787', synonyms: ['cardiac'] },
  { term: 'kidney', cui: 'C0022646', synonyms: ['kidneys', 'renal'] },
  { term: 'liver', cui: 'C0023884', synonyms: ['hepatic'] },
  { term: 'brain', cui: 'C0006104', synonyms: ['cerebral', 'cranial'] },
  { term: 'wound', cui: 'C0043250', synonyms: ['incision', 'surgical site', 'wound site'] },
  { term: 'skin', cui: 'C0037267', synonyms: ['cutaneous', 'dermal'] },
  { term: 'bone', cui: 'C0262950', synonyms: ['osseous', 'skeletal'] },
  { term: 'joint', cui: 'C0022417', synonyms: ['articular'] },
  { term: 'muscle', cui: 'C0026845', synonyms: ['muscular', 'musculature'] },
  { term: 'vein', cui: 'C0042449', synonyms: ['venous'] },
  { term: 'artery', cui: 'C0003842', synonyms: ['arterial'] },
  { term: 'bladder', cui: 'C0005682', synonyms: ['urinary bladder'] },
  { term: 'colon', cui: 'C0009368', synonyms: ['large bowel', 'large intestine'] },
  { term: 'small bowel', cui: 'C0021852', synonyms: ['small intestine', 'jejunum', 'ileum'] },
  { term: 'shoulder', cui: 'C0037004', synonyms: ['shoulder joint'] },
  { term: 'ankle', cui: 'C0003086', synonyms: ['ankle joint'] },
  { term: 'wrist', cui: 'C0043262', synonyms: ['wrist joint'] },
  { term: 'foot', cui: 'C0016504', synonyms: ['feet', 'pedal'] },
];

// ============================================================================
// NegEx Algorithm Patterns
// ============================================================================

const NEGATION_PRE_TRIGGERS = [
  'no', 'not', 'without', 'denies', 'denied', 'negative for', 'no evidence of',
  'no signs of', 'no symptoms of', 'absence of', 'absent', 'never had',
  'no history of', 'no sign of', 'not have', 'does not have', 'did not have',
  'rules out', 'ruled out', 'rule out', 'r/o', 'free of', 'no complaints of',
  'no concern for', 'no suspicion of', 'unlikely',
  'no further', 'unremarkable', 'fail to reveal',
  'no longer', 'resolved', 'cleared',
];

const NEGATION_POST_TRIGGERS = [
  'unlikely', 'not present', 'not seen', 'not found', 'not identified',
  'was ruled out', 'has been ruled out', 'not detected', 'was negative',
  'not demonstrated', 'absent', 'negative',
];

const NEGATION_TERMINATION = [
  'but', 'however', 'although', 'though', 'except', 'apart from',
  'which', 'with the exception', 'yet', 'still',
];

// ============================================================================
// Temporal Patterns
// ============================================================================

const TEMPORAL_PATTERNS: Array<{ regex: RegExp; type: TemporalExpression['type'] }> = [
  { regex: /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g, type: 'date' },
  { regex: /\b(\d{4})-(\d{2})-(\d{2})\b/g, type: 'date' },
  { regex: /\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\b/g, type: 'time' },
  { regex: /\b(today|yesterday|tomorrow|tonight|this morning|this evening)\b/gi, type: 'relative' },
  { regex: /\b(\d+)\s*(day|days|week|weeks|month|months|hour|hours|minute|minutes|year|years)\s*(ago|from now|postop|post-op|post op)?\b/gi, type: 'duration' },
  { regex: /\b(daily|twice daily|bid|tid|qid|q\d+h|every\s+\d+\s+hours?|once daily|qd|qhs|prn|as needed)\b/gi, type: 'frequency' },
  { regex: /\bpost[- ]?operative day\s*#?\s*(\d+)\b/gi, type: 'relative' },
  { regex: /\bpod\s*#?\s*(\d+)\b/gi, type: 'relative' },
  { regex: /\b(pre-?op|intra-?op|post-?op|perioperative)\b/gi, type: 'relative' },
];

// ============================================================================
// Dosage and Frequency Patterns
// ============================================================================

const DOSAGE_PATTERN = /\b(\d+(?:\.\d+)?)\s*(mg|g|mcg|ml|mL|units?|IU|mEq|%)\b/gi;
const FREQUENCY_PATTERN = /\b(once daily|twice daily|three times daily|four times daily|bid|tid|qid|q\d+h|qd|qhs|prn|as needed|every\s+\d+\s+hours?|daily|nightly)\b/gi;

// ============================================================================
// Storage
// ============================================================================

const STORAGE_PREFIX = 'recovery_pilot_nlp_';
const STORAGE_KEYS = {
  CORRECTIONS: `${STORAGE_PREFIX}corrections`,
  CUSTOM_TERMS: `${STORAGE_PREFIX}custom_terms`,
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// ============================================================================
// ClinicalNLPEngine Class
// ============================================================================

export class ClinicalNLPEngine {
  private corrections: CorrectionRecord[];
  private customTerms: Array<{ term: string; type: EntityType; cui: string }>;
  private entityIdCounter: number;

  constructor() {
    this.corrections = loadFromStorage<CorrectionRecord[]>(STORAGE_KEYS.CORRECTIONS, []);
    this.customTerms = loadFromStorage<Array<{ term: string; type: EntityType; cui: string }>>(STORAGE_KEYS.CUSTOM_TERMS, []);
    this.entityIdCounter = 0;
  }

  private nextEntityId(): string {
    return `ent-${++this.entityIdCounter}`;
  }

  /**
   * Extract all entities from clinical text
   */
  extractEntities(text: string): ExtractionResult {
    const entities: ExtractedEntity[] = [];
    const relations: ExtractedRelation[] = [];
    const textLower = text.toLowerCase();

    // Extract medications
    for (const med of MEDICATION_TERMS) {
      this.findTermOccurrences(text, textLower, med.term, med.synonyms, EntityType.MEDICATION, med.cui, entities);
    }

    // Extract conditions
    for (const cond of CONDITION_TERMS) {
      this.findTermOccurrences(text, textLower, cond.term, cond.synonyms, EntityType.CONDITION, cond.cui, entities);
    }

    // Extract procedures
    for (const proc of PROCEDURE_TERMS) {
      this.findTermOccurrences(text, textLower, proc.term, proc.synonyms, EntityType.PROCEDURE, proc.cui, entities);
    }

    // Extract lab values
    for (const lab of LAB_VALUE_TERMS) {
      this.findTermOccurrences(text, textLower, lab.term, lab.synonyms, EntityType.LAB_VALUE, lab.cui, entities, { unit: lab.unit });
    }

    // Extract anatomy
    for (const anat of ANATOMY_TERMS) {
      this.findTermOccurrences(text, textLower, anat.term, anat.synonyms, EntityType.ANATOMY, anat.cui, entities);
    }

    // Extract custom terms from self-learning
    for (const custom of this.customTerms) {
      this.findTermOccurrences(text, textLower, custom.term, [], custom.type, custom.cui, entities);
    }

    // Extract dosages
    this.extractDosages(text, entities);

    // Extract frequencies
    this.extractFrequencies(text, entities);

    // Extract temporal expressions
    const temporalExpressions = this.extractTemporalExpressions(text);

    // Apply negation detection
    this.applyNegation(text, textLower, entities);

    const negatedEntities = entities.filter(e => e.isNegated);

    // Extract relations
    this.extractRelations(entities, relations);

    // Remove duplicate entities (overlapping spans)
    const dedupedEntities = this.deduplicateEntities(entities);

    return {
      entities: dedupedEntities,
      relations,
      temporalExpressions,
      negatedEntities,
      rawText: text,
    };
  }

  /**
   * Look up a concept by CUI
   */
  lookupConcept(cui: string): ConceptEntry | null {
    for (const med of MEDICATION_TERMS) {
      if (med.cui === cui) {
        return { cui, preferred: med.term, synonyms: med.synonyms, type: EntityType.MEDICATION, semanticGroup: 'Chemicals & Drugs' };
      }
    }
    for (const cond of CONDITION_TERMS) {
      if (cond.cui === cui) {
        return { cui, preferred: cond.term, synonyms: cond.synonyms, type: EntityType.CONDITION, semanticGroup: 'Disorders' };
      }
    }
    for (const proc of PROCEDURE_TERMS) {
      if (proc.cui === cui) {
        return { cui, preferred: proc.term, synonyms: proc.synonyms, type: EntityType.PROCEDURE, semanticGroup: 'Procedures' };
      }
    }
    for (const lab of LAB_VALUE_TERMS) {
      if (lab.cui === cui) {
        return { cui, preferred: lab.term, synonyms: lab.synonyms, type: EntityType.LAB_VALUE, semanticGroup: 'Lab Results' };
      }
    }
    for (const anat of ANATOMY_TERMS) {
      if (anat.cui === cui) {
        return { cui, preferred: anat.term, synonyms: anat.synonyms, type: EntityType.ANATOMY, semanticGroup: 'Anatomy' };
      }
    }
    return null;
  }

  /**
   * Get total dictionary size
   */
  getDictionarySize(): number {
    let total = 0;
    for (const med of MEDICATION_TERMS) total += 1 + med.synonyms.length;
    for (const cond of CONDITION_TERMS) total += 1 + cond.synonyms.length;
    for (const proc of PROCEDURE_TERMS) total += 1 + proc.synonyms.length;
    for (const lab of LAB_VALUE_TERMS) total += 1 + lab.synonyms.length;
    for (const anat of ANATOMY_TERMS) total += 1 + anat.synonyms.length;
    total += this.customTerms.length;
    return total;
  }

  /**
   * Record a clinician correction for self-learning
   */
  recordCorrection(
    text: string,
    originalEntity: { text: string; type: EntityType },
    correctedType: EntityType | null,
    correctedText: string | null,
    clinicianId: string
  ): void {
    this.corrections.push({
      text,
      originalEntity,
      correctedType,
      correctedText,
      timestamp: Date.now(),
      clinicianId,
    });

    // If clinician provided a corrected entity, add it as a custom term
    if (correctedText && correctedType) {
      const existing = this.customTerms.find(t => t.term === correctedText.toLowerCase());
      if (!existing) {
        this.customTerms.push({
          term: correctedText.toLowerCase(),
          type: correctedType,
          cui: `CUSTOM-${Date.now()}`,
        });
      }
    }

    this.persistState();
  }

  /**
   * Get correction statistics
   */
  getCorrectionStats(): {
    totalCorrections: number;
    falsePositives: number;
    misclassifications: number;
    customTermsAdded: number;
  } {
    let falsePositives = 0;
    let misclassifications = 0;

    for (const corr of this.corrections) {
      if (corr.correctedType === null) falsePositives++;
      else if (corr.correctedType !== corr.originalEntity.type) misclassifications++;
    }

    return {
      totalCorrections: this.corrections.length,
      falsePositives,
      misclassifications,
      customTermsAdded: this.customTerms.length,
    };
  }

  /**
   * Get corrections
   */
  getCorrections(): CorrectionRecord[] {
    return [...this.corrections];
  }

  /**
   * Reset learned state
   */
  resetLearning(): void {
    this.corrections = [];
    this.customTerms = [];
    this.persistState();
  }

  /**
   * Detect negation for a specific text span using NegEx
   */
  detectNegation(text: string, entityStart: number, entityEnd: number): boolean {
    const textLower = text.toLowerCase();
    const beforeText = textLower.substring(Math.max(0, entityStart - 60), entityStart);
    const afterText = textLower.substring(entityEnd, Math.min(textLower.length, entityEnd + 40));

    // Check pre-negation triggers
    for (const trigger of NEGATION_PRE_TRIGGERS) {
      if (beforeText.includes(trigger)) {
        // Check for termination before entity
        let terminated = false;
        for (const term of NEGATION_TERMINATION) {
          const triggerPos = beforeText.lastIndexOf(trigger);
          const termPos = beforeText.indexOf(term, triggerPos + trigger.length);
          if (termPos !== -1) {
            terminated = true;
            break;
          }
        }
        if (!terminated) return true;
      }
    }

    // Check post-negation triggers
    for (const trigger of NEGATION_POST_TRIGGERS) {
      if (afterText.includes(trigger)) return true;
    }

    return false;
  }

  // ---- Private Methods ----

  private findTermOccurrences(
    text: string,
    textLower: string,
    primaryTerm: string,
    synonyms: string[],
    type: EntityType,
    cui: string,
    entities: ExtractedEntity[],
    metadata: Record<string, string> = {}
  ): void {
    const allTerms = [primaryTerm, ...synonyms];

    for (const term of allTerms) {
      const termLower = term.toLowerCase();
      let searchStart = 0;

      while (searchStart < textLower.length) {
        const idx = textLower.indexOf(termLower, searchStart);
        if (idx === -1) break;

        // Check word boundary
        const before = idx > 0 ? textLower[idx - 1] : ' ';
        const after = idx + termLower.length < textLower.length ? textLower[idx + termLower.length] : ' ';
        const isWordBoundary = !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);

        if (isWordBoundary) {
          entities.push({
            id: this.nextEntityId(),
            text: text.substring(idx, idx + termLower.length),
            type,
            startIndex: idx,
            endIndex: idx + termLower.length,
            normalizedForm: primaryTerm,
            conceptId: cui,
            confidence: term === primaryTerm ? 0.95 : 0.85,
            isNegated: false,
            metadata,
          });
        }

        searchStart = idx + 1;
      }
    }
  }

  private extractDosages(text: string, entities: ExtractedEntity[]): void {
    const regex = new RegExp(DOSAGE_PATTERN.source, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        id: this.nextEntityId(),
        text: match[0],
        type: EntityType.DOSAGE,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        normalizedForm: match[0].toLowerCase(),
        conceptId: 'DOSAGE',
        confidence: 0.9,
        isNegated: false,
        metadata: { value: match[1], unit: match[2] },
      });
    }
  }

  private extractFrequencies(text: string, entities: ExtractedEntity[]): void {
    const regex = new RegExp(FREQUENCY_PATTERN.source, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        id: this.nextEntityId(),
        text: match[0],
        type: EntityType.FREQUENCY,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        normalizedForm: match[0].toLowerCase(),
        conceptId: 'FREQUENCY',
        confidence: 0.88,
        isNegated: false,
        metadata: {},
      });
    }
  }

  private extractTemporalExpressions(text: string): TemporalExpression[] {
    const results: TemporalExpression[] = [];

    for (const pattern of TEMPORAL_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        results.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          normalizedValue: match[0].toLowerCase(),
          type: pattern.type,
        });
      }
    }

    return results;
  }

  private applyNegation(text: string, _textLower: string, entities: ExtractedEntity[]): void {
    for (const entity of entities) {
      if (entity.type === EntityType.DOSAGE || entity.type === EntityType.FREQUENCY) continue;
      entity.isNegated = this.detectNegation(text, entity.startIndex, entity.endIndex);
    }
  }

  private extractRelations(entities: ExtractedEntity[], relations: ExtractedRelation[]): void {
    const meds = entities.filter(e => e.type === EntityType.MEDICATION);
    const conditions = entities.filter(e => e.type === EntityType.CONDITION);
    const dosages = entities.filter(e => e.type === EntityType.DOSAGE);
    const frequencies = entities.filter(e => e.type === EntityType.FREQUENCY);
    const anatomy = entities.filter(e => e.type === EntityType.ANATOMY);

    // Med -> Dosage relations (closest dosage after medication)
    for (const med of meds) {
      const closestDosage = dosages
        .filter(d => d.startIndex > med.endIndex && d.startIndex - med.endIndex < 30)
        .sort((a, b) => a.startIndex - b.startIndex)[0];
      if (closestDosage) {
        relations.push({
          id: `rel-${relations.length}`,
          sourceEntityId: closestDosage.id,
          targetEntityId: med.id,
          relationType: RelationType.DOSAGE_OF,
          confidence: 0.85,
        });
      }

      // Med -> Frequency
      const closestFreq = frequencies
        .filter(f => Math.abs(f.startIndex - med.endIndex) < 50)
        .sort((a, b) => Math.abs(a.startIndex - med.endIndex) - Math.abs(b.startIndex - med.endIndex))[0];
      if (closestFreq) {
        relations.push({
          id: `rel-${relations.length}`,
          sourceEntityId: closestFreq.id,
          targetEntityId: med.id,
          relationType: RelationType.FREQUENCY_OF,
          confidence: 0.8,
        });
      }
    }

    // Condition -> Anatomy relations (proximity-based)
    for (const cond of conditions) {
      const nearbyAnat = anatomy
        .filter(a => Math.abs(a.startIndex - cond.startIndex) < 40)
        .sort((a, b) => Math.abs(a.startIndex - cond.startIndex) - Math.abs(b.startIndex - cond.startIndex))[0];
      if (nearbyAnat) {
        relations.push({
          id: `rel-${relations.length}`,
          sourceEntityId: cond.id,
          targetEntityId: nearbyAnat.id,
          relationType: RelationType.LOCATED_AT,
          confidence: 0.7,
        });
      }
    }

    // Negated entity relations
    for (const entity of entities) {
      if (entity.isNegated) {
        relations.push({
          id: `rel-${relations.length}`,
          sourceEntityId: entity.id,
          targetEntityId: entity.id,
          relationType: RelationType.NEGATED,
          confidence: 0.9,
        });
      }
    }
  }

  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    // Sort by confidence descending, then by span length descending
    const sorted = [...entities].sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    });

    const kept: ExtractedEntity[] = [];
    const usedSpans: Array<[number, number]> = [];

    for (const entity of sorted) {
      const overlaps = usedSpans.some(([start, end]) =>
        (entity.startIndex >= start && entity.startIndex < end) ||
        (entity.endIndex > start && entity.endIndex <= end) ||
        (entity.startIndex <= start && entity.endIndex >= end)
      );
      if (!overlaps) {
        kept.push(entity);
        usedSpans.push([entity.startIndex, entity.endIndex]);
      }
    }

    return kept.sort((a, b) => a.startIndex - b.startIndex);
  }

  private persistState(): void {
    saveToStorage(STORAGE_KEYS.CORRECTIONS, this.corrections);
    saveToStorage(STORAGE_KEYS.CUSTOM_TERMS, this.customTerms);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createClinicalNLPEngine(): ClinicalNLPEngine {
  return new ClinicalNLPEngine();
}
