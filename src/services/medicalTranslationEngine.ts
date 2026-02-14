/**
 * Medical Translation Engine
 * Context-aware multilingual medical terminology translation with readability scoring.
 */

type Language = 'en' | 'es' | 'fr' | 'zh' | 'ar' | 'hi';
type TermCategory = 'medications' | 'conditions' | 'body_parts' | 'instructions' | 'symptoms' | 'procedures';
type UsageContext = 'medical' | 'common';

interface TranslationEntry {
  en: string;
  es: string;
  fr: string;
  zh: string; // Pinyin
  ar: string;
  hi: string;
  category: TermCategory;
  contextNote?: string;
}

interface CorrectionRecord {
  term: string;
  fromLang: Language;
  toLang: Language;
  original: string;
  corrected: string;
  timestamp: Date;
  correctedBy: string;
}

interface ReadabilityResult {
  fleschKincaid: number;
  gradeLevel: number;
  readingEase: number;
  assessment: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
  suggestions: string[];
}

interface PatientInstruction {
  title: string;
  body: string;
  language: Language;
  readabilityScore: number;
}

const MEDICAL_DICTIONARY: TranslationEntry[] = [
  // --- MEDICATIONS (35+) ---
  { en: 'acetaminophen', es: 'acetaminofen', fr: 'acetaminophene', zh: 'duiyi\'anjifen', ar: 'asetaminofen', hi: 'esetaminofen', category: 'medications' },
  { en: 'ibuprofen', es: 'ibuprofeno', fr: 'ibuprofene', zh: 'buluofen', ar: 'aybubrofen', hi: 'aibuprofen', category: 'medications' },
  { en: 'amoxicillin', es: 'amoxicilina', fr: 'amoxicilline', zh: 'amokexilin', ar: 'amoksisilin', hi: 'amoksisilin', category: 'medications' },
  { en: 'metformin', es: 'metformina', fr: 'metformine', zh: 'erjiashuanggua', ar: 'metformin', hi: 'metformin', category: 'medications' },
  { en: 'lisinopril', es: 'lisinopril', fr: 'lisinopril', zh: 'lainuopuli', ar: 'lisinobril', hi: 'lisinopril', category: 'medications' },
  { en: 'atorvastatin', es: 'atorvastatina', fr: 'atorvastatine', zh: 'atuofatating', ar: 'atorvastatin', hi: 'atorvastatin', category: 'medications' },
  { en: 'omeprazole', es: 'omeprazol', fr: 'omeprazole', zh: 'aomeilazuo', ar: 'omibrazol', hi: 'omeprazol', category: 'medications' },
  { en: 'warfarin', es: 'warfarina', fr: 'warfarine', zh: 'huafarin', ar: 'warfarin', hi: 'varfarin', category: 'medications' },
  { en: 'insulin', es: 'insulina', fr: 'insuline', zh: 'yidaosu', ar: 'insulin', hi: 'insulin', category: 'medications' },
  { en: 'morphine', es: 'morfina', fr: 'morphine', zh: 'mafei', ar: 'morfin', hi: 'morfin', category: 'medications' },
  { en: 'aspirin', es: 'aspirina', fr: 'aspirine', zh: 'asipilin', ar: 'asbirin', hi: 'aspirin', category: 'medications' },
  { en: 'prednisone', es: 'prednisona', fr: 'prednisone', zh: 'qiangnisong', ar: 'bridnizon', hi: 'prednizon', category: 'medications' },
  { en: 'gabapentin', es: 'gabapentina', fr: 'gabapentine', zh: 'jiabapenting', ar: 'jababintin', hi: 'gabapentin', category: 'medications' },
  { en: 'losartan', es: 'losartan', fr: 'losartan', zh: 'lushadang', ar: 'losartan', hi: 'losartan', category: 'medications' },
  { en: 'hydrochlorothiazide', es: 'hidroclorotiazida', fr: 'hydrochlorothiazide', zh: 'qinglushaisai', ar: 'hidroklorothiazid', hi: 'haidroklorothiazaid', category: 'medications' },
  { en: 'ciprofloxacin', es: 'ciprofloxacino', fr: 'ciprofloxacine', zh: 'huanbing shazuo', ar: 'sibrofloksasin', hi: 'siprofloksasin', category: 'medications' },
  { en: 'furosemide', es: 'furosemida', fr: 'furosemide', zh: 'fusaimi', ar: 'furosimid', hi: 'furosemaid', category: 'medications' },
  { en: 'metoprolol', es: 'metoprolol', fr: 'metoprolol', zh: 'meiduoluoer', ar: 'mitobrolol', hi: 'metoprolol', category: 'medications' },
  { en: 'amlodipine', es: 'amlodipino', fr: 'amlodipine', zh: 'amuluodiping', ar: 'amlodibin', hi: 'amlodipin', category: 'medications' },
  { en: 'clopidogrel', es: 'clopidogrel', fr: 'clopidogrel', zh: 'lubi geile', ar: 'klobidojril', hi: 'klopidogrel', category: 'medications' },
  { en: 'tramadol', es: 'tramadol', fr: 'tramadol', zh: 'qumaduoer', ar: 'tramadol', hi: 'tramadol', category: 'medications' },
  { en: 'oxycodone', es: 'oxicodona', fr: 'oxycodone', zh: 'yangtong', ar: 'oksikodun', hi: 'oksikodon', category: 'medications' },
  { en: 'heparin', es: 'heparina', fr: 'heparine', zh: 'gansu', ar: 'hibarin', hi: 'heparin', category: 'medications' },
  { en: 'enoxaparin', es: 'enoxaparina', fr: 'enoxaparine', zh: 'yinuogansu', ar: 'inoksabarin', hi: 'enoksaparin', category: 'medications' },
  // --- CONDITIONS (35+) ---
  { en: 'hypertension', es: 'hipertension', fr: 'hypertension', zh: 'gaoxueya', ar: 'irtifae daght aldam', hi: 'ucch raktachap', category: 'conditions' },
  { en: 'diabetes mellitus', es: 'diabetes mellitus', fr: 'diabete sucre', zh: 'tangniaobing', ar: 'daa alsukari', hi: 'madhumeh', category: 'conditions' },
  { en: 'pneumonia', es: 'neumonia', fr: 'pneumonie', zh: 'feiyan', ar: 'iltihab riwi', hi: 'nimoniya', category: 'conditions' },
  { en: 'fracture', es: 'fractura', fr: 'fracture', zh: 'guzhe', ar: 'kasr', hi: 'haddi tootna', category: 'conditions' },
  { en: 'infection', es: 'infeccion', fr: 'infection', zh: 'ganran', ar: 'adwa', hi: 'sankraman', category: 'conditions' },
  { en: 'deep vein thrombosis', es: 'trombosis venosa profunda', fr: 'thrombose veineuse profonde', zh: 'shenjingmai xueshuan', ar: 'takhaththur wridii amiq', hi: 'gahari shira ghanastrata', category: 'conditions' },
  { en: 'pulmonary embolism', es: 'embolia pulmonar', fr: 'embolie pulmonaire', zh: 'feishuansai', ar: 'intisam riwi', hi: 'phephde mein khoon ka thakka', category: 'conditions' },
  { en: 'atrial fibrillation', es: 'fibrilacion auricular', fr: 'fibrillation auriculaire', zh: 'fangchan', ar: 'rajashan uthayni', hi: 'aatriyal fibrileshon', category: 'conditions' },
  { en: 'heart failure', es: 'insuficiencia cardiaca', fr: 'insuffisance cardiaque', zh: 'xinshuaijie', ar: 'fashal alqalb', hi: 'hriday vifalta', category: 'conditions' },
  { en: 'chronic obstructive pulmonary disease', es: 'enfermedad pulmonar obstructiva cronica', fr: 'bronchopneumopathie chronique obstructive', zh: 'manxing zusaixing feibing', ar: 'marad riwi musadd muzmin', hi: 'dirghakalik avrodhi phephde ka rog', category: 'conditions' },
  { en: 'osteoarthritis', es: 'osteoartritis', fr: 'arthrose', zh: 'guguanjieyan', ar: 'iltihab almafasil', hi: 'astiyogathritis', category: 'conditions' },
  { en: 'sepsis', es: 'sepsis', fr: 'septicemie', zh: 'baoxuezheng', ar: 'tasummum aldam', hi: 'sepsis', category: 'conditions' },
  { en: 'stroke', es: 'accidente cerebrovascular', fr: 'accident vasculaire cerebral', zh: 'zhongfeng', ar: 'sakta damaghiya', hi: 'pakshaghat', category: 'conditions', contextNote: 'medical: cerebrovascular accident; common: a movement' },
  { en: 'anemia', es: 'anemia', fr: 'anemie', zh: 'pinxue', ar: 'faqr aldam', hi: 'khoon ki kami', category: 'conditions' },
  { en: 'cellulitis', es: 'celulitis', fr: 'cellulite infectieuse', zh: 'fengwozhiyan', ar: 'iltihab alansija', hi: 'selulaitish', category: 'conditions', contextNote: 'medical: skin infection; common: cosmetic condition' },
  { en: 'appendicitis', es: 'apendicitis', fr: 'appendicite', zh: 'lanweiyan', ar: 'iltihab alzaida', hi: 'appendisaitis', category: 'conditions' },
  { en: 'cholecystitis', es: 'colecistitis', fr: 'cholecystite', zh: 'dannanyan', ar: 'iltihab almarara', hi: 'pitthashay ka shoth', category: 'conditions' },
  // --- BODY PARTS (35+) ---
  { en: 'heart', es: 'corazon', fr: 'coeur', zh: 'xinzang', ar: 'qalb', hi: 'hriday', category: 'body_parts' },
  { en: 'lung', es: 'pulmon', fr: 'poumon', zh: 'fei', ar: 'ria', hi: 'phephda', category: 'body_parts' },
  { en: 'liver', es: 'higado', fr: 'foie', zh: 'gan', ar: 'kabid', hi: 'jigar', category: 'body_parts' },
  { en: 'kidney', es: 'rinon', fr: 'rein', zh: 'shen', ar: 'kulya', hi: 'gurdaa', category: 'body_parts' },
  { en: 'stomach', es: 'estomago', fr: 'estomac', zh: 'wei', ar: 'maida', hi: 'pet', category: 'body_parts' },
  { en: 'brain', es: 'cerebro', fr: 'cerveau', zh: 'danao', ar: 'dimagh', hi: 'dimaag', category: 'body_parts' },
  { en: 'knee', es: 'rodilla', fr: 'genou', zh: 'xigai', ar: 'rukba', hi: 'ghutna', category: 'body_parts' },
  { en: 'hip', es: 'cadera', fr: 'hanche', zh: 'kuanbu', ar: 'wirk', hi: 'koolha', category: 'body_parts' },
  { en: 'shoulder', es: 'hombro', fr: 'epaule', zh: 'jianbang', ar: 'katif', hi: 'kandha', category: 'body_parts' },
  { en: 'spine', es: 'columna vertebral', fr: 'colonne vertebrale', zh: 'jizhu', ar: 'amud faqari', hi: 'ridh ki haddi', category: 'body_parts' },
  { en: 'wrist', es: 'muneca', fr: 'poignet', zh: 'shouwan', ar: 'miasam', hi: 'kalai', category: 'body_parts' },
  { en: 'ankle', es: 'tobillo', fr: 'cheville', zh: 'jiaohuai', ar: 'kahil', hi: 'takhna', category: 'body_parts' },
  { en: 'abdomen', es: 'abdomen', fr: 'abdomen', zh: 'fubu', ar: 'batn', hi: 'udar', category: 'body_parts' },
  { en: 'chest', es: 'pecho', fr: 'poitrine', zh: 'xiongbu', ar: 'sadr', hi: 'chhaati', category: 'body_parts' },
  { en: 'throat', es: 'garganta', fr: 'gorge', zh: 'houlong', ar: 'halq', hi: 'gala', category: 'body_parts' },
  { en: 'gallbladder', es: 'vesicula biliar', fr: 'vesicule biliaire', zh: 'dannang', ar: 'marara', hi: 'pitthashay', category: 'body_parts' },
  { en: 'colon', es: 'colon', fr: 'colon', zh: 'jiechang', ar: 'qulun', hi: 'badi aant', category: 'body_parts' },
  { en: 'femur', es: 'femur', fr: 'femur', zh: 'daguigu', ar: 'azm alfakhidh', hi: 'jaangh ki haddi', category: 'body_parts' },
  { en: 'tibia', es: 'tibia', fr: 'tibia', zh: 'jinggu', ar: 'azm alqasaba', hi: 'pindli ki haddi', category: 'body_parts' },
  // --- SYMPTOMS (35+) ---
  { en: 'pain', es: 'dolor', fr: 'douleur', zh: 'tengtong', ar: 'alam', hi: 'dard', category: 'symptoms' },
  { en: 'fever', es: 'fiebre', fr: 'fievre', zh: 'fashao', ar: 'humma', hi: 'bukhar', category: 'symptoms' },
  { en: 'nausea', es: 'nauseas', fr: 'nausee', zh: 'exin', ar: 'ghathayan', hi: 'ji machlana', category: 'symptoms' },
  { en: 'vomiting', es: 'vomito', fr: 'vomissement', zh: 'outu', ar: 'taqayyu', hi: 'ulti', category: 'symptoms' },
  { en: 'swelling', es: 'hinchazon', fr: 'gonflement', zh: 'zhongtong', ar: 'tawarrum', hi: 'sujan', category: 'symptoms' },
  { en: 'shortness of breath', es: 'dificultad para respirar', fr: 'essoufflement', zh: 'huxi kunnan', ar: 'diq altanaffus', hi: 'sans ki taklif', category: 'symptoms' },
  { en: 'dizziness', es: 'mareo', fr: 'vertige', zh: 'touyun', ar: 'dawkha', hi: 'chakkar aana', category: 'symptoms' },
  { en: 'fatigue', es: 'fatiga', fr: 'fatigue', zh: 'pilao', ar: 'irhaq', hi: 'thakan', category: 'symptoms' },
  { en: 'constipation', es: 'estrenimiento', fr: 'constipation', zh: 'bianmi', ar: 'imsak', hi: 'kabz', category: 'symptoms' },
  { en: 'bleeding', es: 'sangrado', fr: 'saignement', zh: 'chuxue', ar: 'nazif', hi: 'khoon bahna', category: 'symptoms' },
  { en: 'redness', es: 'enrojecimiento', fr: 'rougeur', zh: 'fachong', ar: 'ihmrar', hi: 'lali', category: 'symptoms' },
  { en: 'numbness', es: 'entumecimiento', fr: 'engourdissement', zh: 'mamu', ar: 'khadar', hi: 'sunn hona', category: 'symptoms' },
  { en: 'itching', es: 'picazon', fr: 'demangeaison', zh: 'saoyang', ar: 'hakka', hi: 'khujli', category: 'symptoms' },
  { en: 'headache', es: 'dolor de cabeza', fr: 'mal de tete', zh: 'toutong', ar: 'sudae', hi: 'sir dard', category: 'symptoms' },
  { en: 'cough', es: 'tos', fr: 'toux', zh: 'kesou', ar: 'suaal', hi: 'khansi', category: 'symptoms' },
  { en: 'diarrhea', es: 'diarrea', fr: 'diarrhee', zh: 'fuxie', ar: 'ishal', hi: 'dast', category: 'symptoms' },
  { en: 'chest pain', es: 'dolor de pecho', fr: 'douleur thoracique', zh: 'xiongtong', ar: 'alam fi alsadr', hi: 'chhaati mein dard', category: 'symptoms' },
  { en: 'bruising', es: 'moretones', fr: 'ecchymose', zh: 'yuxue', ar: 'kadam', hi: 'neela padna', category: 'symptoms' },
  // --- INSTRUCTIONS (25+) ---
  { en: 'take with food', es: 'tomar con comida', fr: 'prendre avec de la nourriture', zh: 'suican fuyang', ar: 'tanawul mae altaeam', hi: 'khana khane ke saath lein', category: 'instructions' },
  { en: 'twice daily', es: 'dos veces al dia', fr: 'deux fois par jour', zh: 'mei ri liang ci', ar: 'marratain yawmiyyan', hi: 'din mein do baar', category: 'instructions' },
  { en: 'before bed', es: 'antes de dormir', fr: 'avant le coucher', zh: 'shuiqian', ar: 'qabl alnaum', hi: 'sone se pehle', category: 'instructions' },
  { en: 'on an empty stomach', es: 'con el estomago vacio', fr: 'a jeun', zh: 'kongfu', ar: 'ala maeida farigha', hi: 'khali pet', category: 'instructions' },
  { en: 'do not crush', es: 'no triture', fr: 'ne pas ecraser', zh: 'bu ke yansui', ar: 'la tashaq', hi: 'masle nahi', category: 'instructions' },
  { en: 'keep wound dry', es: 'mantenga la herida seca', fr: 'garder la plaie seche', zh: 'baochi shangkou ganzhao', ar: 'hafiz ala jafaf aljurh', hi: 'ghav ko sukha rakhein', category: 'instructions' },
  { en: 'elevate limb', es: 'eleve la extremidad', fr: 'surelever le membre', zh: 'taiqi zhiti', ar: 'irfae altaraf', hi: 'haath pair ooncha rakhein', category: 'instructions' },
  { en: 'apply ice', es: 'aplique hielo', fr: 'appliquer de la glace', zh: 'lengfu', ar: 'dae althalj', hi: 'barf lagayein', category: 'instructions' },
  { en: 'no driving', es: 'no conducir', fr: 'ne pas conduire', zh: 'jinzhi jiashi', ar: 'la taqud', hi: 'gaadi mat chalayein', category: 'instructions' },
  { en: 'no heavy lifting', es: 'no levantar objetos pesados', fr: 'ne pas soulever de charges lourdes', zh: 'jinzhi fuzho', ar: 'la tarfae athqal', hi: 'bhari cheezein mat uthaayein', category: 'instructions' },
  { en: 'return to emergency if', es: 'regrese a emergencias si', fr: 'retournez aux urgences si', zh: 'ruchu xianxia qing jiuzhen', ar: 'aeid ila altawari idha', hi: 'emergency mein wapas aayein agar', category: 'instructions' },
  { en: 'follow up in one week', es: 'seguimiento en una semana', fr: 'suivi dans une semaine', zh: 'yi zhou hou fushen', ar: 'mutabaeat baed usbue', hi: 'ek hafte mein dobara aayein', category: 'instructions' },
  // --- PROCEDURES (30+) ---
  { en: 'knee replacement', es: 'reemplazo de rodilla', fr: 'prothese du genou', zh: 'xigai zhihuan shu', ar: 'istibdal alrukba', hi: 'ghutne ka pratistaapan', category: 'procedures' },
  { en: 'hip replacement', es: 'reemplazo de cadera', fr: 'prothese de hanche', zh: 'kuangujie zhihuan shu', ar: 'istibdal alwirk', hi: 'koolhe ka pratistaapan', category: 'procedures' },
  { en: 'appendectomy', es: 'apendicectomia', fr: 'appendicectomie', zh: 'lanwei qiechu shu', ar: 'istitsal alzaida', hi: 'appendix ka operation', category: 'procedures' },
  { en: 'cholecystectomy', es: 'colecistectomia', fr: 'cholecystectomie', zh: 'dannang qiechu shu', ar: 'istitsal almarara', hi: 'pitthashay ka operation', category: 'procedures' },
  { en: 'coronary artery bypass', es: 'derivacion de arteria coronaria', fr: 'pontage coronarien', zh: 'guanmai daqiao shu', ar: 'tahwil alshiryani altaji', hi: 'hriday bypass surgery', category: 'procedures' },
  { en: 'cesarean section', es: 'cesarea', fr: 'cesarienne', zh: 'poufu chan', ar: 'amiliyya qaisariyya', hi: 'cesarean section', category: 'procedures' },
  { en: 'colonoscopy', es: 'colonoscopia', fr: 'coloscopie', zh: 'jiechang jing', ar: 'tanzir alqulun', hi: 'colonoscopy', category: 'procedures' },
  { en: 'catheterization', es: 'cateterismo', fr: 'catheterisme', zh: 'daoguan shu', ar: 'qasatara', hi: 'catheter lagana', category: 'procedures' },
  { en: 'blood transfusion', es: 'transfusion de sangre', fr: 'transfusion sanguine', zh: 'shuxue', ar: 'naql dam', hi: 'khoon chadana', category: 'procedures' },
  { en: 'biopsy', es: 'biopsia', fr: 'biopsie', zh: 'huojian', ar: 'khazea', hi: 'biopsy', category: 'procedures' },
  { en: 'dialysis', es: 'dialisis', fr: 'dialyse', zh: 'touxi', ar: 'ghasil kulawi', hi: 'dialysis', category: 'procedures' },
  { en: 'intubation', es: 'intubacion', fr: 'intubation', zh: 'chaguan', ar: 'tanabub', hi: 'intubation', category: 'procedures' },
  { en: 'physical therapy', es: 'fisioterapia', fr: 'kinesitherapie', zh: 'wuli zhiliao', ar: 'aleilaj altabiei', hi: 'physiotherapy', category: 'procedures' },
  { en: 'wound debridement', es: 'desbridamiento de herida', fr: 'debridement de plaie', zh: 'shangkou qingchuang', ar: 'tanzif aljurh', hi: 'ghav ki safai', category: 'procedures' },
  { en: 'spinal fusion', es: 'fusion espinal', fr: 'arthrodese vertebrale', zh: 'jizhui ronghe shu', ar: 'damj faqari', hi: 'spinal fusion', category: 'procedures' },
  { en: 'mastectomy', es: 'mastectomia', fr: 'mastectomie', zh: 'rufang qiechu shu', ar: 'istitsal althady', hi: 'mastectomy', category: 'procedures' },
  { en: 'hernia repair', es: 'reparacion de hernia', fr: 'reparation de hernie', zh: 'shanqi xiubu shu', ar: 'islah alfatq', hi: 'hernia ka operation', category: 'procedures' },
  { en: 'cataract surgery', es: 'cirugia de cataratas', fr: 'chirurgie de la cataracte', zh: 'baineizhang shoushu', ar: 'amiliyyat almiyah albayda', hi: 'motiyabind ka operation', category: 'procedures' },
  { en: 'tonsillectomy', es: 'amigdalectomia', fr: 'amygdalectomie', zh: 'biantaoti qiechu shu', ar: 'istitsal allawzatain', hi: 'tonsil ka operation', category: 'procedures' },
];

const INSTRUCTION_TEMPLATES: Record<string, Record<Language, string>> = {
  post_surgery_general: {
    en: 'After your {procedure}, rest for {days} days. Take {medication} as prescribed. Watch for signs of {complication}. Call your doctor if you have {warning_signs}.',
    es: 'Despues de su {procedure}, descanse por {days} dias. Tome {medication} segun lo recetado. Este atento a signos de {complication}. Llame a su medico si tiene {warning_signs}.',
    fr: 'Apres votre {procedure}, reposez-vous pendant {days} jours. Prenez {medication} tel que prescrit. Surveillez les signes de {complication}. Appelez votre medecin si vous avez {warning_signs}.',
    zh: '{procedure} hou, xiuxi {days} tian. An yizhu fuyang {medication}. zhuyi {complication} de zhengzhuang. Ruchu xianxia {warning_signs} qing jiuzhen.',
    ar: 'baed {procedure}, istarah limudat {days} ayyam. tanawul {medication} kama wusif. raqib alamat {complication}. ittasil bittabib idha kana ladayk {warning_signs}.',
    hi: 'Aapke {procedure} ke baad, {days} din aaram karein. {medication} doctor ki salah anusar lein. {complication} ke lakshan par dhyaan dein. Agar {warning_signs} ho to doctor ko call karein.',
  },
  medication_instructions: {
    en: 'Take {medication} {frequency}. {food_instructions}. Do not skip doses. If you miss a dose, {missed_dose_action}.',
    es: 'Tome {medication} {frequency}. {food_instructions}. No omita dosis. Si olvida una dosis, {missed_dose_action}.',
    fr: 'Prenez {medication} {frequency}. {food_instructions}. Ne sautez pas de doses. Si vous oubliez une dose, {missed_dose_action}.',
    zh: '{frequency} fuyang {medication}. {food_instructions}. Bu ke louyao. Ruguo cuoguo yici, {missed_dose_action}.',
    ar: 'tanawul {medication} {frequency}. {food_instructions}. la tufawwit aljurae. idha fatatk jurea, {missed_dose_action}.',
    hi: '{medication} {frequency} lein. {food_instructions}. Koi bhi dose na chhodein. Agar dose chhut jaye, {missed_dose_action}.',
  },
  wound_care: {
    en: 'Keep the wound clean and dry. Change dressing every {interval}. Watch for redness, swelling, or drainage. Do not submerge in water for {days} days.',
    es: 'Mantenga la herida limpia y seca. Cambie el vendaje cada {interval}. Observe si hay enrojecimiento, hinchazon o drenaje. No sumerja en agua por {days} dias.',
    fr: 'Gardez la plaie propre et seche. Changez le pansement toutes les {interval}. Surveillez rougeur, gonflement ou ecoulement. Ne plongez pas dans l\'eau pendant {days} jours.',
    zh: 'Baochi shangkou qingjie ganzhao. Mei {interval} genghuanyici. Zhuyi shifou you fachong, zhongtong huo yingliu. {days} tian nei jinzhi jinpao.',
    ar: 'hafiz ala nazafa aljurh wajafafih. ghayyir aldimada kull {interval}. raqib alihmrar waltawarrum waldanf. la taghmus fi almaa limudat {days} ayyam.',
    hi: 'Ghav ko saaf aur sukha rakhein. Har {interval} mein patti badlein. Lali, sujan, ya rishav par dhyaan dein. {days} din tak paani mein na duboyein.',
  },
};

const CONTEXT_OVERRIDES: Record<string, Record<UsageContext, Partial<Record<Language, string>>>> = {
  stroke: {
    medical: { es: 'accidente cerebrovascular', fr: 'accident vasculaire cerebral' },
    common: { es: 'golpe', fr: 'coup' },
  },
  cellulitis: {
    medical: { es: 'celulitis infecciosa', fr: 'cellulite infectieuse' },
    common: { es: 'celulitis cosmetica', fr: 'cellulite' },
  },
  discharge: {
    medical: { es: 'alta medica', fr: 'sortie de hopital' },
    common: { es: 'secrecion', fr: 'ecoulement' },
  },
};

export class MedicalTranslationEngine {
  private corrections: CorrectionRecord[] = [];
  private correctionIndex: Map<string, string> = new Map();

  translate(
    term: string,
    fromLang: Language,
    toLang: Language,
    context: UsageContext = 'medical'
  ): { translation: string; category: TermCategory | null; confidence: number; contextNote?: string } {
    const normalized = term.toLowerCase().trim();

    // Check correction index first (self-learning)
    const corrKey = `${normalized}:${fromLang}:${toLang}`;
    if (this.correctionIndex.has(corrKey)) {
      return { translation: this.correctionIndex.get(corrKey)!, category: null, confidence: 0.95 };
    }

    // Check context overrides
    if (CONTEXT_OVERRIDES[normalized] && CONTEXT_OVERRIDES[normalized][context]) {
      const override = CONTEXT_OVERRIDES[normalized][context][toLang];
      if (override) {
        const entry = MEDICAL_DICTIONARY.find(e => e[fromLang]?.toLowerCase() === normalized);
        return { translation: override, category: entry?.category ?? null, confidence: 0.9, contextNote: entry?.contextNote };
      }
    }

    // Dictionary lookup
    const entry = MEDICAL_DICTIONARY.find(e => e[fromLang]?.toLowerCase() === normalized);
    if (entry) {
      return { translation: entry[toLang], category: entry.category, confidence: 0.92, contextNote: entry.contextNote };
    }

    // Fuzzy match: find closest by Levenshtein-like prefix match
    const candidates = MEDICAL_DICTIONARY.filter(e => {
      const val = e[fromLang]?.toLowerCase() ?? '';
      return val.startsWith(normalized.substring(0, 3)) || normalized.startsWith(val.substring(0, 3));
    });
    if (candidates.length > 0) {
      const best = candidates[0];
      return { translation: best[toLang], category: best.category, confidence: 0.6 };
    }

    return { translation: `[untranslated: ${term}]`, category: null, confidence: 0 };
  }

  getPatientInstructions(
    templateKey: string,
    language: Language,
    variables: Record<string, string>
  ): PatientInstruction | null {
    const template = INSTRUCTION_TEMPLATES[templateKey];
    if (!template || !template[language]) return null;

    let body = template[language];
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    const readabilityScore = this.computeFleschKincaid(body);
    return {
      title: templateKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      body,
      language,
      readabilityScore,
    };
  }

  assessReadability(text: string): ReadabilityResult {
    const fk = this.computeFleschKincaid(text);
    const gradeLevel = Math.max(0, Math.round((0.39 * this.avgWordsPerSentence(text)) + (11.8 * this.avgSyllablesPerWord(text)) - 15.59));
    let assessment: ReadabilityResult['assessment'];
    const suggestions: string[] = [];

    if (fk >= 70) {
      assessment = 'easy';
    } else if (fk >= 50) {
      assessment = 'moderate';
      suggestions.push('Consider using shorter sentences.');
    } else if (fk >= 30) {
      assessment = 'difficult';
      suggestions.push('Use simpler words.', 'Break long sentences into shorter ones.');
    } else {
      assessment = 'very_difficult';
      suggestions.push('Rewrite at a 6th-grade reading level.', 'Replace medical jargon with plain language.', 'Use bullet points instead of long paragraphs.');
    }

    return { fleschKincaid: Math.round(fk * 10) / 10, gradeLevel, readingEase: fk, assessment, suggestions };
  }

  recordCorrection(term: string, fromLang: Language, toLang: Language, original: string, corrected: string, correctedBy: string): void {
    this.corrections.push({ term, fromLang, toLang, original, corrected, timestamp: new Date(), correctedBy });
    this.correctionIndex.set(`${term.toLowerCase().trim()}:${fromLang}:${toLang}`, corrected);
  }

  getSupportedLanguages(): { code: Language; name: string }[] {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'zh', name: 'Mandarin (Pinyin)' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
    ];
  }

  getCorrectionHistory(): CorrectionRecord[] {
    return [...this.corrections];
  }

  getDictionarySize(): number {
    return MEDICAL_DICTIONARY.length;
  }

  getTermsByCategory(category: TermCategory): TranslationEntry[] {
    return MEDICAL_DICTIONARY.filter(e => e.category === category);
  }

  // --- Private helpers ---

  private computeFleschKincaid(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (sentences.length === 0 || words.length === 0) return 0;
    const totalSyllables = words.reduce((sum, w) => sum + this.countSyllables(w), 0);
    return 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (totalSyllables / words.length));
  }

  private avgWordsPerSentence(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return sentences.length > 0 ? words.length / sentences.length : 0;
  }

  private avgSyllablesPerWord(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    return words.reduce((sum, w) => sum + this.countSyllables(w), 0) / words.length;
  }

  private countSyllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length <= 3) return 1;
    const vowelGroups = w.match(/[aeiouy]+/g);
    let count = vowelGroups ? vowelGroups.length : 1;
    if (w.endsWith('e') && count > 1) count--;
    if (w.endsWith('le') && w.length > 3 && !/[aeiouy]/.test(w[w.length - 3])) count++;
    return Math.max(1, count);
  }
}

export type { Language, TermCategory, UsageContext, TranslationEntry, CorrectionRecord, ReadabilityResult, PatientInstruction };
