/**
 * Patient Education Engine
 * Condition-specific educational content with literacy assessment and personalization.
 */

type RecoveryPhase = 'immediate' | 'early' | 'intermediate' | 'late';
type ReadingLevel = 'basic' | 'intermediate' | 'advanced';
type ContentFormat = 'text' | 'bullet_points' | 'simplified';

interface PhaseContent {
  phase: RecoveryPhase;
  duration: string;
  goals: string[];
  activities: string[];
  restrictions: string[];
  warningSignals: string[];
}

interface TeachBackQuestion {
  question: string;
  expectedAnswer: string;
  hints: string[];
  difficulty: ReadingLevel;
}

interface EducationEntry {
  conditionId: string;
  title: string;
  summary: string;
  phases: PhaseContent[];
  teachBackQuestions: TeachBackQuestion[];
  citations: string[];
  keywords: string[];
}

interface LiteracyResult {
  score: number;
  level: ReadingLevel;
  wordsCorrect: number;
  totalWords: number;
  recommendation: string;
}

interface EngagementRecord {
  patientId: string;
  conditionId: string;
  sectionViewed: string;
  durationSeconds: number;
  completedTeachBack: boolean;
  teachBackScore: number;
  timestamp: Date;
}

interface PersonalizedContent {
  title: string;
  body: string;
  format: ContentFormat;
  readingLevel: ReadingLevel;
  estimatedReadTime: number;
}

// REALM-SF word list (Real validated instrument words)
const REALM_SF_WORDS = [
  'fat', 'flu', 'pill', 'dose', 'eye', 'stress', 'smear', 'nerves',
  'germs', 'meals', 'disease', 'cancer', 'caffeine', 'attack', 'kidney',
  'hormones', 'herpes', 'seizure', 'bowel', 'asthma', 'rectal', 'incest',
  'jaundice', 'exercise', 'behavior', 'nutrition', 'miscarriage', 'potassium',
  'colitis', 'obesity', 'osteoporosis', 'impetigo', 'gallbladder',
  'antibiotics', 'anemia', 'appendix', 'abnormal', 'syphilis', 'hemorrhoids',
  'nausea', 'directed', 'orally', 'allergic', 'menstrual', 'testicle',
  'colitis', 'emergency', 'medication', 'occupation', 'sexually',
  'alcoholism', 'irritable', 'constipation', 'gonorrhea', 'inflammatory',
  'diabetes', 'hepatitis', 'antibiotics', 'diagnosis', 'prescription',
  'menopause', 'progesterone', 'triglyceride', 'emphysema', 'osteoporosis',
];

const EDUCATION_CONTENT: EducationEntry[] = [
  {
    conditionId: 'knee_replacement',
    title: 'Total Knee Replacement Recovery',
    summary: 'Total knee replacement (arthroplasty) involves replacing damaged knee joint surfaces with metal and plastic components. Recovery typically takes 3-6 months for full function.',
    phases: [
      { phase: 'immediate', duration: '0-3 days', goals: ['Pain management', 'Prevent blood clots', 'Begin gentle movement'], activities: ['Ankle pumps every hour', 'Assisted walking with walker', 'Ice application 20 min on/off'], restrictions: ['No twisting on operated leg', 'No driving'], warningSignals: ['Fever above 101.5F', 'Calf swelling or redness', 'Wound drainage increasing'] },
      { phase: 'early', duration: '3-14 days', goals: ['Increase range of motion to 90 degrees', 'Reduce swelling', 'Independent transfers'], activities: ['PT exercises 3x daily', 'Walking with assistive device', 'Stair training'], restrictions: ['No kneeling', 'No heavy lifting over 10 lbs'], warningSignals: ['Increasing pain not relieved by medication', 'Wound opening'] },
      { phase: 'intermediate', duration: '2-6 weeks', goals: ['Walk without assistive device', 'Return to light daily activities', 'ROM to 110 degrees'], activities: ['Stationary cycling', 'Progressive strengthening', 'Balance exercises'], restrictions: ['No high-impact activities', 'No running'], warningSignals: ['Sudden pop or give-way', 'New onset swelling'] },
      { phase: 'late', duration: '6 weeks-6 months', goals: ['Full activity resumption', 'ROM to 120+ degrees', 'Return to work'], activities: ['Swimming', 'Golf', 'Cycling on roads'], restrictions: ['Avoid contact sports long-term', 'Annual follow-up X-rays'], warningSignals: ['Grinding or clicking with pain', 'Progressive stiffness'] },
    ],
    teachBackQuestions: [
      { question: 'How often should you do your ankle pump exercises right after surgery?', expectedAnswer: 'Every hour while awake', hints: ['Think about how often the clock ticks to a new hour'], difficulty: 'basic' },
      { question: 'What is one warning sign that means you should call your doctor immediately?', expectedAnswer: 'Fever above 101.5F, calf swelling/redness, or increasing wound drainage', hints: ['Think about your temperature', 'Think about your leg below the knee'], difficulty: 'basic' },
      { question: 'When can you expect to walk without a walker or cane?', expectedAnswer: 'Around 2-6 weeks after surgery', hints: ['Its the intermediate phase of recovery'], difficulty: 'intermediate' },
    ],
    citations: ['AAOS Clinical Practice Guideline: Surgical Management of Osteoarthritis of the Knee, 2021', 'Cram P, et al. JAMA. 2012;308(12):1227-1236'],
    keywords: ['knee', 'arthroplasty', 'joint replacement', 'orthopedic'],
  },
  {
    conditionId: 'hip_replacement',
    title: 'Total Hip Replacement Recovery',
    summary: 'Hip replacement surgery replaces the damaged hip joint with an artificial implant. Most patients experience significant pain relief and improved mobility within 3 months.',
    phases: [
      { phase: 'immediate', duration: '0-3 days', goals: ['Pain control', 'Prevent dislocation', 'Begin weight bearing'], activities: ['Bed exercises', 'Assisted standing', 'Walking with walker'], restrictions: ['No crossing legs', 'No bending past 90 degrees', 'No internal rotation'], warningSignals: ['Severe groin pain', 'Leg shortening', 'Fever'] },
      { phase: 'early', duration: '3-14 days', goals: ['Safe home mobility', 'Independent ADLs with precautions', 'Wound healing'], activities: ['Daily walking increasing distance', 'Hip precaution exercises', 'Stair training with rail'], restrictions: ['Hip precautions maintained', 'No driving 2-4 weeks', 'Elevated toilet seat'], warningSignals: ['Wound redness spreading', 'Inability to bear weight'] },
      { phase: 'intermediate', duration: '2-6 weeks', goals: ['Discontinue walker', 'Resume driving', 'Return to light work'], activities: ['Progressive walking', 'Stationary bike', 'Aquatic therapy'], restrictions: ['No high-impact sports', 'Continue elevated seat if posterior approach'], warningSignals: ['Clicking with pain', 'Limping not improving'] },
      { phase: 'late', duration: '6 weeks-6 months', goals: ['Full activity', 'Strength restoration', 'Long-term joint protection'], activities: ['Swimming', 'Cycling', 'Low-impact sports'], restrictions: ['Lifetime: avoid high-impact repetitive activities'], warningSignals: ['New onset groin pain', 'Feeling of instability'] },
    ],
    teachBackQuestions: [
      { question: 'What three movements should you avoid to prevent hip dislocation?', expectedAnswer: 'Do not cross legs, do not bend past 90 degrees, do not rotate leg inward', hints: ['Think about the position of your legs when sitting'], difficulty: 'intermediate' },
      { question: 'Why do you need an elevated toilet seat after surgery?', expectedAnswer: 'To prevent bending the hip past 90 degrees which could cause dislocation', hints: ['Think about the angle of your hip when sitting down low'], difficulty: 'basic' },
    ],
    citations: ['AAOS: Management of Hip Fractures in Older Adults, 2021', 'Learmonth ID, et al. Lancet. 2007;370(9597):1508-19'],
    keywords: ['hip', 'arthroplasty', 'joint replacement', 'orthopedic'],
  },
  {
    conditionId: 'cardiac_bypass',
    title: 'Coronary Artery Bypass Graft (CABG) Recovery',
    summary: 'CABG surgery reroutes blood around blocked coronary arteries using grafts. Full recovery takes 6-12 weeks, with cardiac rehabilitation essential for optimal outcomes.',
    phases: [
      { phase: 'immediate', duration: '0-5 days (ICU + step-down)', goals: ['Hemodynamic stability', 'Wean from ventilator', 'Pain management'], activities: ['Incentive spirometry 10x/hour', 'Splint chest for coughing', 'Sit in chair day 1-2'], restrictions: ['No lifting arms above shoulders', 'No driving'], warningSignals: ['Chest wound drainage', 'Irregular heartbeat', 'Fever above 100.4F'] },
      { phase: 'early', duration: '1-3 weeks', goals: ['Walk 5-10 minutes multiple times daily', 'Sternal precautions adherence', 'Manage incision care'], activities: ['Gradual walking increase', 'Light upper body stretching', 'Deep breathing exercises'], restrictions: ['No lifting over 5-8 lbs', 'No pushing/pulling', 'No driving 4-6 weeks'], warningSignals: ['Sternal clicking or movement', 'Wound opening', 'Shortness of breath at rest'] },
      { phase: 'intermediate', duration: '3-8 weeks', goals: ['Begin cardiac rehab Phase II', 'Resume household activities', 'Emotional adjustment'], activities: ['Supervised exercise 3x/week', 'Walking 20-30 min daily', 'Heart-healthy cooking'], restrictions: ['No heavy lifting until cleared', 'No strenuous yard work'], warningSignals: ['Chest pain with activity', 'Excessive fatigue', 'Depression symptoms'] },
      { phase: 'late', duration: '8-12 weeks', goals: ['Return to work', 'Full cardiac rehab', 'Lifestyle modification'], activities: ['Moderate aerobic exercise', 'Full ADL independence', 'Dietary changes permanent'], restrictions: ['Lifelong medication compliance', 'Annual cardiac follow-up'], warningSignals: ['Recurrent angina', 'New shortness of breath'] },
    ],
    teachBackQuestions: [
      { question: 'How should you protect your sternum when you cough?', expectedAnswer: 'Hug a pillow against your chest to splint the sternum', hints: ['Think about holding something against your chest'], difficulty: 'basic' },
      { question: 'What is the maximum weight you can lift in the first few weeks?', expectedAnswer: '5 to 8 pounds, about the weight of a gallon of milk', hints: ['Think about a jug of milk'], difficulty: 'basic' },
    ],
    citations: ['AHA/ACC Guideline for CABG Surgery, 2011 (updated 2021)', 'Hillis LD, et al. Circulation. 2011;124(23):e652-e735'],
    keywords: ['heart', 'bypass', 'CABG', 'cardiac', 'surgery'],
  },
  {
    conditionId: 'appendectomy',
    title: 'Appendectomy Recovery',
    summary: 'Appendectomy removes the inflamed appendix, usually laparoscopically. Most patients recover within 1-3 weeks for laparoscopic and 4-6 weeks for open surgery.',
    phases: [
      { phase: 'immediate', duration: '0-2 days', goals: ['Pain control', 'Tolerate clear liquids', 'Pass gas'], activities: ['Short walks in hallway', 'Deep breathing', 'Sips of fluid progressing to diet'], restrictions: ['No heavy lifting', 'No strenuous activity'], warningSignals: ['Fever above 101F', 'Increasing abdominal pain', 'Redness around incisions'] },
      { phase: 'early', duration: '2-7 days', goals: ['Advance to regular diet', 'Manage pain with oral meds', 'Independent mobility'], activities: ['Walking 10-15 min 3x daily', 'Light household tasks', 'Shower after 48 hours'], restrictions: ['No lifting over 10 lbs', 'No submerging incision'], warningSignals: ['Wound drainage with odor', 'Persistent vomiting'] },
      { phase: 'intermediate', duration: '1-3 weeks', goals: ['Return to work (desk job)', 'Resume normal diet', 'Gradual activity increase'], activities: ['Normal walking', 'Light exercise', 'Return to school/work'], restrictions: ['No contact sports 4-6 weeks', 'No heavy lifting 4 weeks'], warningSignals: ['Abscess formation signs', 'Bowel obstruction symptoms'] },
      { phase: 'late', duration: '3-6 weeks', goals: ['Full recovery', 'All activities resumed'], activities: ['Full exercise', 'All sports', 'No restrictions'], restrictions: ['None after full healing'], warningSignals: ['Incisional hernia signs'] },
    ],
    teachBackQuestions: [
      { question: 'When can you take a shower after laparoscopic appendectomy?', expectedAnswer: 'After 48 hours, keeping incisions clean', hints: ['Think about two days'], difficulty: 'basic' },
    ],
    citations: ['Di Saverio S, et al. World J Emerg Surg. 2020;15:27', 'SAGES Guidelines for Laparoscopic Appendectomy, 2019'],
    keywords: ['appendix', 'appendicitis', 'laparoscopic', 'abdominal'],
  },
  {
    conditionId: 'cesarean_section',
    title: 'Cesarean Section Recovery',
    summary: 'C-section recovery involves healing from both childbirth and abdominal surgery. Full recovery takes 6-8 weeks with gradual return to activities.',
    phases: [
      { phase: 'immediate', duration: '0-3 days', goals: ['Pain management', 'Begin breastfeeding', 'Early ambulation'], activities: ['Walking within 12-24 hours', 'Breastfeeding support', 'Incentive spirometry'], restrictions: ['No lifting heavier than baby', 'No driving', 'No stairs initially'], warningSignals: ['Heavy bleeding soaking pad per hour', 'Fever above 100.4F', 'Foul-smelling discharge'] },
      { phase: 'early', duration: '3-14 days', goals: ['Incision healing', 'Establish feeding routine', 'Emotional bonding'], activities: ['Short walks', 'Gentle pelvic floor exercises', 'Newborn care'], restrictions: ['No heavy lifting', 'No sexual intercourse', 'No baths (showers only)'], warningSignals: ['Incision opening', 'Signs of postpartum depression', 'Breast infection signs'] },
      { phase: 'intermediate', duration: '2-6 weeks', goals: ['Resume driving', 'Gradual return to household duties', 'Postpartum checkup'], activities: ['Walking program', 'Light housework', 'Core stability exercises'], restrictions: ['No abdominal exercises until cleared', 'No heavy lifting over 15 lbs'], warningSignals: ['Persistent pain at incision', 'Mood changes worsening'] },
      { phase: 'late', duration: '6-12 weeks', goals: ['Full activity', 'Return to exercise', 'Cleared for all activities'], activities: ['Progressive exercise', 'Full childcare independence', 'Return to work'], restrictions: ['Gradual return to high-impact exercise'], warningSignals: ['Incisional hernia', 'Ongoing pelvic pain'] },
    ],
    teachBackQuestions: [
      { question: 'What is the heaviest thing you should lift in the first 2 weeks?', expectedAnswer: 'Nothing heavier than your baby', hints: ['Think about the newest member of your family'], difficulty: 'basic' },
      { question: 'What bleeding pattern would require immediate medical attention?', expectedAnswer: 'Soaking through a pad in one hour', hints: ['Think about how quickly the pad fills up'], difficulty: 'basic' },
    ],
    citations: ['ACOG Practice Bulletin No. 205: Vaginal Birth After Cesarean, 2019', 'Keag OE, et al. PLoS Med. 2018;15(9):e1002494'],
    keywords: ['cesarean', 'c-section', 'childbirth', 'obstetric'],
  },
  {
    conditionId: 'cholecystectomy',
    title: 'Gallbladder Removal Recovery',
    summary: 'Cholecystectomy removes the gallbladder, usually laparoscopically. Recovery is typically 1-2 weeks with dietary modifications needed during adjustment.',
    phases: [
      { phase: 'immediate', duration: '0-1 days', goals: ['Pain control', 'Tolerate liquids', 'Same-day discharge if laparoscopic'], activities: ['Walking', 'Clear liquid diet advancing'], restrictions: ['No fatty foods initially', 'No driving while on narcotics'], warningSignals: ['Jaundice', 'Severe right-sided pain', 'Fever'] },
      { phase: 'early', duration: '1-7 days', goals: ['Low-fat diet tolerance', 'Independent self-care'], activities: ['Walking', 'Light household activities', 'Gradual diet advancement'], restrictions: ['Low-fat diet', 'No heavy lifting 1-2 weeks'], warningSignals: ['Persistent nausea/vomiting', 'Dark urine'] },
      { phase: 'intermediate', duration: '1-3 weeks', goals: ['Return to work', 'Normal diet tolerance'], activities: ['Regular exercise', 'Normal diet with gradual fat reintroduction'], restrictions: ['Listen to body regarding fatty foods'], warningSignals: ['Persistent diarrhea after fatty meals'] },
      { phase: 'late', duration: '3-6 weeks', goals: ['Full recovery', 'Dietary adaptation complete'], activities: ['All normal activities'], restrictions: ['None'], warningSignals: ['Post-cholecystectomy syndrome symptoms'] },
    ],
    teachBackQuestions: [
      { question: 'Why should you avoid fatty foods right after gallbladder removal?', expectedAnswer: 'Your body needs time to adjust to digesting fat without the gallbladder storing bile', hints: ['Think about what the gallbladder used to do with bile'], difficulty: 'intermediate' },
    ],
    citations: ['SAGES Guidelines for the Clinical Application of Laparoscopic Biliary Tract Surgery, 2010', 'Overby DW, et al. Surg Endosc. 2010;24(10):2368-86'],
    keywords: ['gallbladder', 'cholecystectomy', 'laparoscopic', 'biliary'],
  },
  {
    conditionId: 'spinal_fusion',
    title: 'Spinal Fusion Recovery',
    summary: 'Spinal fusion permanently joins two or more vertebrae. Recovery requires 3-6 months with strict activity limitations to allow bone healing.',
    phases: [
      { phase: 'immediate', duration: '0-5 days', goals: ['Pain management', 'Mobility with brace', 'Prevent complications'], activities: ['Log-rolling in bed', 'Walking with support', 'Incentive spirometry'], restrictions: ['No BLT (bending, lifting, twisting)', 'Brace wear as directed'], warningSignals: ['Loss of bowel/bladder control', 'Progressive numbness', 'Fever'] },
      { phase: 'early', duration: '1-6 weeks', goals: ['Wound healing', 'Walking endurance', 'Wean from narcotics'], activities: ['Walking 15-30 min daily', 'Gentle stretching as directed', 'Sitting limited to 30 min intervals'], restrictions: ['No lifting over 5 lbs', 'No driving 2-6 weeks', 'No bending or twisting'], warningSignals: ['Increasing leg pain or weakness', 'Wound drainage'] },
      { phase: 'intermediate', duration: '6-12 weeks', goals: ['Begin physical therapy', 'Increase sitting tolerance', 'Return to desk work'], activities: ['PT-guided core strengthening', 'Pool walking', 'Gradual activity increase'], restrictions: ['No lifting over 15 lbs', 'No impact activities'], warningSignals: ['Hardware prominence', 'New pain patterns'] },
      { phase: 'late', duration: '3-6 months', goals: ['Bone fusion confirmed on imaging', 'Full activity resumption', 'Long-term spine health'], activities: ['Full exercise program', 'Return to all work', 'Core maintenance program'], restrictions: ['Permanent body mechanics awareness'], warningSignals: ['Non-union symptoms', 'Adjacent segment disease signs'] },
    ],
    teachBackQuestions: [
      { question: 'What does BLT stand for in your movement restrictions?', expectedAnswer: 'No Bending, Lifting, or Twisting', hints: ['Think about a sandwich - each letter stands for a movement you cannot do'], difficulty: 'basic' },
    ],
    citations: ['North American Spine Society (NASS) Guidelines, 2020', 'Dhall SS, et al. J Neurosurg Spine. 2014;21(1):14-22'],
    keywords: ['spine', 'fusion', 'back surgery', 'vertebrae'],
  },
  {
    conditionId: 'mastectomy',
    title: 'Mastectomy Recovery',
    summary: 'Mastectomy involves removal of breast tissue for cancer treatment. Recovery includes physical healing, drain management, and emotional support over 4-6 weeks.',
    phases: [
      { phase: 'immediate', duration: '0-3 days', goals: ['Drain management', 'Pain control', 'Arm mobility initiation'], activities: ['Drain output recording', 'Gentle arm circles', 'Walking'], restrictions: ['No lifting on affected side', 'No raising arm above shoulder'], warningSignals: ['Drain output suddenly increases', 'Fever', 'Skin flap color changes'] },
      { phase: 'early', duration: '3-14 days', goals: ['Drain removal', 'Wound check', 'Emotional support'], activities: ['Wall climbing exercises for arm', 'Walking program', 'Support group connection'], restrictions: ['No heavy lifting', 'No repetitive arm movements'], warningSignals: ['Seroma formation', 'Infection signs', 'Lymphedema onset'] },
      { phase: 'intermediate', duration: '2-6 weeks', goals: ['Full arm range of motion', 'Return to daily activities', 'Discuss reconstruction options'], activities: ['Progressive stretching', 'Light exercise', 'Lymphedema prevention exercises'], restrictions: ['Avoid blood draws on affected arm', 'No heavy carrying on affected side'], warningSignals: ['Arm swelling', 'Persistent numbness', 'Cord formation in armpit'] },
      { phase: 'late', duration: '6 weeks-6 months', goals: ['Full activity', 'Oncology follow-up', 'Survivorship planning'], activities: ['Full exercise program', 'Lymphedema monitoring', 'Breast self-exam of remaining tissue'], restrictions: ['Lifelong lymphedema precautions on affected side'], warningSignals: ['New lumps', 'Persistent pain', 'Arm swelling changes'] },
    ],
    teachBackQuestions: [
      { question: 'Why should you avoid blood draws on the arm on your surgery side?', expectedAnswer: 'To reduce the risk of lymphedema since lymph nodes were removed', hints: ['Think about the drainage system that was affected by surgery'], difficulty: 'intermediate' },
    ],
    citations: ['NCCN Guidelines for Breast Cancer, v4.2023', 'Gradishar WJ, et al. J Natl Compr Canc Netw. 2022;20(6):691-722'],
    keywords: ['breast', 'mastectomy', 'cancer', 'oncology'],
  },
  {
    conditionId: 'colectomy',
    title: 'Colectomy (Colon Resection) Recovery',
    summary: 'Colectomy removes part or all of the colon. Recovery focuses on bowel function restoration over 4-8 weeks.',
    phases: [
      { phase: 'immediate', duration: '0-5 days', goals: ['Bowel function return', 'Pain management', 'Early mobilization'], activities: ['Walking 4x daily', 'Incentive spirometry', 'Ice chips advancing to clear liquids'], restrictions: ['NPO until bowel function returns', 'No straining'], warningSignals: ['No flatus by day 5', 'Abdominal distension', 'Fever'] },
      { phase: 'early', duration: '5-14 days', goals: ['Tolerate regular diet', 'Independent mobility', 'Stoma care if applicable'], activities: ['Walking program', 'Low-residue diet', 'Stoma education if applicable'], restrictions: ['No heavy lifting', 'Small frequent meals'], warningSignals: ['Wound infection', 'Anastomotic leak signs', 'Persistent ileus'] },
      { phase: 'intermediate', duration: '2-6 weeks', goals: ['Normalize bowel habits', 'Return to work', 'Nutritional recovery'], activities: ['Gradual fiber reintroduction', 'Moderate exercise', 'Normal diet advancement'], restrictions: ['No heavy lifting 6 weeks', 'Hydration focus'], warningSignals: ['Hernia at incision', 'Persistent diarrhea', 'Obstruction signs'] },
      { phase: 'late', duration: '6 weeks-3 months', goals: ['Full dietary tolerance', 'Complete healing', 'Oncology follow-up if cancer'], activities: ['Full activity', 'Colonoscopy surveillance schedule'], restrictions: ['None post-healing'], warningSignals: ['New bowel pattern changes', 'Rectal bleeding'] },
    ],
    teachBackQuestions: [
      { question: 'What is the first sign that your bowels are waking up after surgery?', expectedAnswer: 'Passing gas (flatus)', hints: ['Its a natural body function that shows your intestines are moving again'], difficulty: 'basic' },
    ],
    citations: ['ASCRS Clinical Practice Guidelines for Colon Cancer, 2022', 'Vogel JD, et al. Dis Colon Rectum. 2022;65(2):148-177'],
    keywords: ['colon', 'colectomy', 'bowel', 'colorectal'],
  },
  {
    conditionId: 'acl_reconstruction',
    title: 'ACL Reconstruction Recovery',
    summary: 'ACL reconstruction replaces the torn anterior cruciate ligament with a graft. Return to sport requires 9-12 months of structured rehabilitation.',
    phases: [
      { phase: 'immediate', duration: '0-2 weeks', goals: ['Reduce swelling', 'Achieve full extension', 'Quad activation'], activities: ['RICE protocol', 'Heel slides', 'Quad sets', 'Straight leg raises'], restrictions: ['Weight bearing as tolerated with crutches', 'Locked brace in extension for walking'], warningSignals: ['Excessive swelling', 'Inability to activate quad', 'Fever'] },
      { phase: 'early', duration: '2-6 weeks', goals: ['Full extension', 'Flexion to 90 degrees', 'Normal gait without crutches'], activities: ['Stationary bike', 'Progressive ROM exercises', 'Balance training'], restrictions: ['No open chain knee extensions', 'No pivoting'], warningSignals: ['Extension deficit not improving', 'Effusion not decreasing'] },
      { phase: 'intermediate', duration: '6 weeks-4 months', goals: ['Full ROM', 'Single-leg balance', 'Begin jogging program'], activities: ['Leg press', 'Step-ups', 'Pool running', 'Straight-line jogging at 3 months'], restrictions: ['No cutting or pivoting', 'No contact sports'], warningSignals: ['Pain with progression', 'Giving way episodes', 'Persistent swelling with activity'] },
      { phase: 'late', duration: '4-12 months', goals: ['Sport-specific training', 'Pass return-to-sport testing', 'Psychological readiness'], activities: ['Agility drills', 'Plyometrics', 'Sport-specific movements'], restrictions: ['No return to sport until cleared by testing'], warningSignals: ['Re-injury symptoms', 'Lack of confidence in knee'] },
    ],
    teachBackQuestions: [
      { question: 'Why is it important to achieve full knee extension early in recovery?', expectedAnswer: 'Failure to achieve full extension can lead to long-term stiffness and abnormal walking patterns', hints: ['Think about straightening your knee all the way - why would that matter for walking?'], difficulty: 'advanced' },
    ],
    citations: ['AAOS/AOSSM Guideline on ACL Injuries, 2022', 'van Melick N, et al. Br J Sports Med. 2016;50(24):1506-1515'],
    keywords: ['ACL', 'knee', 'ligament', 'sports medicine'],
  },
  {
    conditionId: 'hernia_repair',
    title: 'Hernia Repair Recovery',
    summary: 'Hernia repair pushes protruding tissue back and reinforces the abdominal wall, often with mesh. Recovery varies from 1-2 weeks (laparoscopic) to 4-6 weeks (open).',
    phases: [
      { phase: 'immediate', duration: '0-2 days', goals: ['Pain control', 'Ambulation', 'Prevent constipation'], activities: ['Walking short distances', 'Ice to incision area', 'Stool softeners'], restrictions: ['No straining', 'No heavy lifting'], warningSignals: ['Bulge returning at repair site', 'Fever', 'Wound redness'] },
      { phase: 'early', duration: '2-14 days', goals: ['Return to light activities', 'Wound healing'], activities: ['Walking increasing distance', 'Light stretching', 'Normal diet'], restrictions: ['No lifting over 10 lbs', 'No strenuous exercise'], warningSignals: ['Increasing pain', 'Scrotal swelling (inguinal)'] },
      { phase: 'intermediate', duration: '2-4 weeks', goals: ['Return to desk work', 'Resume driving'], activities: ['Light exercise', 'Normal household duties'], restrictions: ['No heavy lifting until 4-6 weeks', 'No abdominal exercises'], warningSignals: ['Pain at mesh site', 'Recurrence signs'] },
      { phase: 'late', duration: '4-8 weeks', goals: ['Full activity', 'Return to all work types'], activities: ['Progressive strengthening', 'All exercise'], restrictions: ['None after full healing'], warningSignals: ['Chronic pain at repair site', 'New bulge'] },
    ],
    teachBackQuestions: [
      { question: 'Why are stool softeners important after hernia repair?', expectedAnswer: 'To prevent straining during bowel movements which could stress the repair', hints: ['Think about the pressure on your abdomen when you strain'], difficulty: 'basic' },
    ],
    citations: ['HerniaSurge International Guidelines, 2018', 'European Hernia Society Guidelines, 2020'],
    keywords: ['hernia', 'mesh', 'inguinal', 'abdominal wall'],
  },
  {
    conditionId: 'pneumonia_recovery',
    title: 'Pneumonia Recovery',
    summary: 'Pneumonia recovery depends on severity and organism. Most patients improve in 1-3 weeks but fatigue may persist for a month or more.',
    phases: [
      { phase: 'immediate', duration: '0-3 days', goals: ['Antibiotic initiation', 'Oxygen maintenance', 'Hydration'], activities: ['Rest', 'Incentive spirometry', 'Fluid intake 2-3L/day'], restrictions: ['Activity as tolerated', 'Avoid others if infectious'], warningSignals: ['Worsening shortness of breath', 'Confusion', 'O2 sat below 92%'] },
      { phase: 'early', duration: '3-7 days', goals: ['Fever resolution', 'Complete antibiotic course', 'Appetite return'], activities: ['Gradual walking', 'Deep breathing exercises', 'Cough management'], restrictions: ['No strenuous exercise', 'Avoid smoke exposure'], warningSignals: ['Fever returning after initial improvement', 'Chest pain worsening'] },
      { phase: 'intermediate', duration: '1-3 weeks', goals: ['Energy improving', 'Cough resolving', 'Return to light duties'], activities: ['Progressive walking', 'Light exercise', 'Normal diet'], restrictions: ['Listen to fatigue levels', 'No overexertion'], warningSignals: ['Persistent high fever', 'Hemoptysis', 'Pleuritic pain'] },
      { phase: 'late', duration: '3 weeks-2 months', goals: ['Full energy restoration', 'Follow-up chest X-ray', 'Vaccination update'], activities: ['Normal exercise', 'Full work return', 'Pneumococcal vaccine if not current'], restrictions: ['None'], warningSignals: ['Persistent cough beyond 6 weeks', 'Recurrent infections'] },
    ],
    teachBackQuestions: [
      { question: 'Why is it important to finish all your antibiotics even if you feel better?', expectedAnswer: 'To fully eliminate the infection and prevent antibiotic resistance', hints: ['Think about what happens if some bacteria survive'], difficulty: 'basic' },
    ],
    citations: ['ATS/IDSA Guidelines for Community-Acquired Pneumonia, 2019', 'Metlay JP, et al. Am J Respir Crit Care Med. 2019;200(7):e45-e67'],
    keywords: ['pneumonia', 'respiratory', 'infection', 'lung'],
  },
  {
    conditionId: 'cataract_surgery',
    title: 'Cataract Surgery Recovery',
    summary: 'Cataract surgery replaces the clouded lens with an artificial one. Vision improves within days, with full recovery in 4-6 weeks.',
    phases: [
      { phase: 'immediate', duration: '0-1 days', goals: ['Eye protection', 'Begin eye drops', 'Rest'], activities: ['Wear eye shield at night', 'Begin prescribed eye drop regimen'], restrictions: ['No rubbing eye', 'No bending over', 'No heavy lifting'], warningSignals: ['Severe pain not relieved by acetaminophen', 'Vision loss', 'Flashes of light'] },
      { phase: 'early', duration: '1-7 days', goals: ['Vision stabilization', 'Drop compliance', 'Infection prevention'], activities: ['Light activity', 'Eye drop schedule adherence', 'Follow-up visit day 1'], restrictions: ['No swimming', 'No eye makeup', 'No dusty environments'], warningSignals: ['Increasing redness', 'Discharge from eye', 'Worsening vision'] },
      { phase: 'intermediate', duration: '1-4 weeks', goals: ['Progressive vision improvement', 'Reduced drop frequency'], activities: ['Normal daily activities', 'Reading', 'Television'], restrictions: ['No contact sports', 'Continue eye protection at night'], warningSignals: ['Floaters increasing', 'Curtain over vision'] },
      { phase: 'late', duration: '4-6 weeks', goals: ['Final refraction', 'New glasses if needed', 'Full activity'], activities: ['All normal activities', 'Swimming with goggles'], restrictions: ['None'], warningSignals: ['Posterior capsule opacification symptoms'] },
    ],
    teachBackQuestions: [
      { question: 'Why do you need to wear an eye shield at night after cataract surgery?', expectedAnswer: 'To prevent accidentally rubbing or pressing on the eye while sleeping', hints: ['Think about what your hands might do while you are asleep'], difficulty: 'basic' },
    ],
    citations: ['AAO Preferred Practice Pattern: Cataract in the Adult Eye, 2021', 'Liu YC, et al. Lancet. 2017;390(10094):600-612'],
    keywords: ['cataract', 'eye', 'lens', 'ophthalmology'],
  },
  {
    conditionId: 'tonsillectomy',
    title: 'Tonsillectomy Recovery',
    summary: 'Tonsillectomy removes the tonsils to treat recurrent infections or sleep apnea. Recovery takes 10-14 days with significant throat pain expected.',
    phases: [
      { phase: 'immediate', duration: '0-3 days', goals: ['Hydration', 'Pain management', 'Prevent bleeding'], activities: ['Cold fluids and soft foods', 'Ice collar', 'Rest with head elevated'], restrictions: ['No hot foods', 'No straws', 'No crunchy foods'], warningSignals: ['Bright red bleeding from mouth', 'Inability to swallow fluids', 'Fever above 102F'] },
      { phase: 'early', duration: '3-7 days', goals: ['Maintain hydration', 'Manage peak pain (days 3-5)', 'Adequate rest'], activities: ['Cool soft diet', 'Gentle activity', 'Pain medication schedule'], restrictions: ['No vigorous activity', 'No spicy or acidic foods', 'No aspirin or ibuprofen'], warningSignals: ['Bleeding (scab separation risk highest days 5-10)', 'Dehydration signs', 'Ear pain increasing significantly'] },
      { phase: 'intermediate', duration: '7-14 days', goals: ['Diet advancement', 'Activity increase', 'Scab healing'], activities: ['Gradually firmer foods', 'Light walking', 'Return to school/work'], restrictions: ['No contact sports 2 weeks', 'Avoid people who are sick'], warningSignals: ['Late bleeding', 'Inability to eat solids'] },
      { phase: 'late', duration: '2-4 weeks', goals: ['Full recovery', 'All foods tolerated', 'Full activity'], activities: ['Normal diet', 'All exercise', 'Normal routine'], restrictions: ['None'], warningSignals: ['Persistent throat pain beyond 3 weeks'] },
    ],
    teachBackQuestions: [
      { question: 'On which days after tonsillectomy is the risk of bleeding highest?', expectedAnswer: 'Days 5 through 10, when scabs begin to separate', hints: ['Think about the middle of the first two weeks'], difficulty: 'intermediate' },
    ],
    citations: ['AAO-HNS Clinical Practice Guideline: Tonsillectomy in Children, 2019', 'Mitchell RB, et al. Otolaryngol Head Neck Surg. 2019;160(1_suppl):S1-S42'],
    keywords: ['tonsils', 'tonsillectomy', 'ENT', 'throat'],
  },
  // Additional shorter entries for remaining conditions
  {
    conditionId: 'rotator_cuff_repair',
    title: 'Rotator Cuff Repair Recovery',
    summary: 'Rotator cuff repair reattaches torn shoulder tendons. Recovery requires 4-6 months with strict immobilization followed by progressive rehabilitation.',
    phases: [
      { phase: 'immediate', duration: '0-6 weeks', goals: ['Protect repair', 'Pain control', 'Passive ROM only'], activities: ['Sling wear', 'Pendulum exercises', 'Elbow/wrist/hand exercises'], restrictions: ['No active shoulder movement', 'Sling at all times including sleep'], warningSignals: ['Sudden pop with pain', 'Numbness in hand'] },
      { phase: 'early', duration: '6-12 weeks', goals: ['Begin active-assisted ROM', 'Wean sling', 'Light isometrics'], activities: ['PT 2-3x/week', 'Active-assisted elevation', 'Wall walks'], restrictions: ['No lifting', 'No reaching behind back'], warningSignals: ['Loss of motion not improving', 'Persistent night pain'] },
      { phase: 'intermediate', duration: '3-5 months', goals: ['Full active ROM', 'Progressive strengthening'], activities: ['Theraband exercises', 'Light weights', 'Functional training'], restrictions: ['No heavy lifting', 'No overhead sports'], warningSignals: ['Weakness not improving', 'Pain with resistance'] },
      { phase: 'late', duration: '5-12 months', goals: ['Return to full activity and sport'], activities: ['Sport-specific training', 'Full strengthening'], restrictions: ['Gradual return to overhead activities'], warningSignals: ['Re-tear symptoms'] },
    ],
    teachBackQuestions: [
      { question: 'Why must you wear the sling for 6 weeks even when your shoulder feels better?', expectedAnswer: 'The tendon needs time to heal and reattach to the bone - using it too early can cause the repair to fail', hints: ['Think about what would happen if you pulled on a freshly glued joint'], difficulty: 'intermediate' },
    ],
    citations: ['AAOS Guideline: Optimizing Rotator Cuff Repair, 2019'],
    keywords: ['shoulder', 'rotator cuff', 'tendon', 'orthopedic'],
  },
  {
    conditionId: 'cardiac_stent',
    title: 'Cardiac Stent (PCI) Recovery',
    summary: 'Percutaneous coronary intervention places a stent to open blocked arteries. Recovery from the procedure is 1-2 weeks, but lifestyle changes and medications are lifelong.',
    phases: [
      { phase: 'immediate', duration: '0-2 days', goals: ['Monitor access site', 'Dual antiplatelet therapy started', 'Risk factor education'], activities: ['Bedrest 2-6 hours post-procedure', 'Monitor groin/wrist site', 'Begin cardiac diet'], restrictions: ['No heavy lifting 5 days', 'No driving 2-3 days'], warningSignals: ['Access site bleeding or hematoma', 'Chest pain recurrence', 'Leg numbness if femoral access'] },
      { phase: 'early', duration: '2-14 days', goals: ['Resume daily activities', 'Medication adherence', 'Cardiac rehab referral'], activities: ['Walking program', 'Medication education', 'Diet modification'], restrictions: ['No strenuous exercise 1 week', 'No submerging access site'], warningSignals: ['Access site infection', 'New chest pain'] },
      { phase: 'intermediate', duration: '2-6 weeks', goals: ['Begin cardiac rehab', 'Lipid management', 'Exercise tolerance building'], activities: ['Supervised exercise', 'Stress management', 'Smoking cessation if applicable'], restrictions: ['Follow exercise prescription'], warningSignals: ['Angina symptoms', 'Shortness of breath with exertion'] },
      { phase: 'late', duration: '6 weeks-lifelong', goals: ['Maintain medication compliance', 'Lifestyle modifications permanent', 'Annual cardiology follow-up'], activities: ['Regular aerobic exercise', 'Mediterranean diet', 'Stress reduction'], restrictions: ['Never stop dual antiplatelet therapy without cardiologist approval'], warningSignals: ['Recurrent angina (restenosis)', 'New symptoms'] },
    ],
    teachBackQuestions: [
      { question: 'Why is it dangerous to stop your blood-thinning medications without asking your cardiologist?', expectedAnswer: 'Stopping antiplatelet drugs can cause the stent to clot, leading to a heart attack', hints: ['Think about what could happen inside the stent if the blood gets sticky'], difficulty: 'intermediate' },
    ],
    citations: ['ACC/AHA/SCAI Guideline for PCI, 2021', 'Lawton JS, et al. Circulation. 2022;145(4):e18-e114'],
    keywords: ['stent', 'PCI', 'cardiac', 'coronary', 'angioplasty'],
  },
  {
    conditionId: 'laminectomy',
    title: 'Laminectomy Recovery',
    summary: 'Laminectomy removes part of the vertebral bone to relieve spinal nerve compression. Recovery takes 4-6 weeks with activity restrictions.',
    phases: [
      { phase: 'immediate', duration: '0-3 days', goals: ['Pain relief', 'Early walking', 'Prevent blood clots'], activities: ['Walking in hallway', 'Log-rolling for bed mobility', 'Deep breathing'], restrictions: ['No BLT (bending, lifting, twisting)', 'No sitting more than 20 min'], warningSignals: ['New leg weakness', 'Bowel/bladder dysfunction', 'Fever'] },
      { phase: 'early', duration: '3 days-2 weeks', goals: ['Independent home mobility', 'Wound healing', 'Wean narcotics'], activities: ['Walking 15-20 min 3x daily', 'Gentle stretching', 'Wound care'], restrictions: ['No lifting over 5-10 lbs', 'No driving 2 weeks'], warningSignals: ['Wound drainage', 'Progressive numbness'] },
      { phase: 'intermediate', duration: '2-6 weeks', goals: ['Begin PT', 'Return to light work', 'Core activation'], activities: ['PT program', 'Walking 30+ min daily', 'Core stabilization'], restrictions: ['No heavy lifting', 'No impact activities'], warningSignals: ['Recurrent leg pain', 'Back spasms worsening'] },
      { phase: 'late', duration: '6-12 weeks', goals: ['Full activity', 'Long-term spine health'], activities: ['Full exercise', 'Core maintenance program'], restrictions: ['Permanent proper body mechanics'], warningSignals: ['Recurrent stenosis symptoms'] },
    ],
    teachBackQuestions: [
      { question: 'What does BLT stand for in your movement restrictions?', expectedAnswer: 'Bending, Lifting, and Twisting - movements to avoid after spine surgery', hints: ['Like the sandwich, but each letter is a movement'], difficulty: 'basic' },
    ],
    citations: ['NASS Evidence-Based Clinical Guidelines for Lumbar Stenosis, 2020'],
    keywords: ['spine', 'laminectomy', 'stenosis', 'back'],
  },
  {
    conditionId: 'thyroidectomy',
    title: 'Thyroidectomy Recovery',
    summary: 'Thyroidectomy removes part or all of the thyroid gland. Recovery takes 1-3 weeks with lifetime thyroid hormone replacement if total removal.',
    phases: [
      { phase: 'immediate', duration: '0-2 days', goals: ['Monitor calcium levels', 'Voice assessment', 'Pain control'], activities: ['Soft diet', 'Neck support when moving', 'Walking'], restrictions: ['No neck extension', 'No heavy lifting'], warningSignals: ['Tingling in fingers/lips (low calcium)', 'Voice hoarseness worsening', 'Neck swelling increasing', 'Difficulty breathing'] },
      { phase: 'early', duration: '2-14 days', goals: ['Calcium stabilization', 'Wound healing', 'Start thyroid hormone'], activities: ['Normal diet advancement', 'Gentle neck ROM', 'Scar care'], restrictions: ['No heavy lifting 2 weeks', 'Protect scar from sun'], warningSignals: ['Muscle cramps (hypocalcemia)', 'Wound infection signs'] },
      { phase: 'intermediate', duration: '2-6 weeks', goals: ['TSH level optimization', 'Full neck mobility', 'Return to work'], activities: ['All normal activities', 'TSH blood test at 6 weeks'], restrictions: ['Sun protection on scar for 1 year'], warningSignals: ['Hypothyroid symptoms: fatigue, weight gain, cold intolerance'] },
      { phase: 'late', duration: '6 weeks-lifelong', goals: ['Stable thyroid levels', 'Regular monitoring'], activities: ['Normal life', 'Annual thyroid labs'], restrictions: ['Lifelong thyroid medication if total'], warningSignals: ['Symptoms of over/under-replacement'] },
    ],
    teachBackQuestions: [
      { question: 'Why should you watch for tingling in your fingers or lips after thyroid surgery?', expectedAnswer: 'It could mean your calcium levels are too low because the parathyroid glands near the thyroid may have been affected', hints: ['Small glands near the thyroid control a mineral in your blood'], difficulty: 'advanced' },
    ],
    citations: ['ATA Guidelines for Thyroid Nodules, 2015 (updated 2023)', 'Haugen BR, et al. Thyroid. 2016;26(1):1-133'],
    keywords: ['thyroid', 'thyroidectomy', 'endocrine', 'neck'],
  },
  {
    conditionId: 'dvt_treatment',
    title: 'Deep Vein Thrombosis Treatment Recovery',
    summary: 'DVT treatment involves anticoagulation to prevent clot extension and pulmonary embolism. Treatment typically lasts 3-6 months with lifestyle modifications.',
    phases: [
      { phase: 'immediate', duration: '0-7 days', goals: ['Therapeutic anticoagulation', 'Pain relief', 'PE prevention'], activities: ['Leg elevation', 'Compression stockings', 'Walking as tolerated'], restrictions: ['Avoid prolonged immobility', 'Avoid injury risk activities'], warningSignals: ['Sudden chest pain or shortness of breath (PE)', 'Increased leg swelling', 'Bleeding signs'] },
      { phase: 'early', duration: '1-4 weeks', goals: ['Anticoagulation stabilized', 'Swelling decreasing', 'Activity resumption'], activities: ['Walking program', 'Compression stocking wear daily', 'INR monitoring if on warfarin'], restrictions: ['No contact sports', 'Limit alcohol', 'Consistent vitamin K diet if on warfarin'], warningSignals: ['Bruising easily', 'Blood in stool or urine', 'Severe headache'] },
      { phase: 'intermediate', duration: '1-3 months', goals: ['Symptom resolution', 'Activity normalization', 'Treatment adherence'], activities: ['Regular exercise', 'Normal activities', 'Travel precautions'], restrictions: ['Continue anticoagulation', 'Stay hydrated on flights'], warningSignals: ['Post-thrombotic syndrome onset', 'Recurrent swelling'] },
      { phase: 'late', duration: '3-6 months+', goals: ['Evaluate for extended anticoagulation', 'Provoked vs unprovoked assessment'], activities: ['All normal activities', 'Thrombophilia testing if indicated'], restrictions: ['Depends on recurrence risk assessment'], warningSignals: ['Recurrent DVT symptoms', 'Chronic leg changes'] },
    ],
    teachBackQuestions: [
      { question: 'What symptoms might indicate the clot has moved to your lungs?', expectedAnswer: 'Sudden chest pain, shortness of breath, or coughing up blood', hints: ['Think about what would happen if something blocked blood flow in your lungs'], difficulty: 'intermediate' },
    ],
    citations: ['ASH Guidelines for VTE Treatment, 2020', 'Ortel TL, et al. Blood Adv. 2020;4(19):4693-4738'],
    keywords: ['DVT', 'blood clot', 'anticoagulation', 'thrombosis'],
  },
];

export class PatientEducationEngine {
  private engagementLog: EngagementRecord[] = [];
  private contentViewCounts: Map<string, number> = new Map();

  getContent(conditionId: string): EducationEntry | null {
    return EDUCATION_CONTENT.find(e => e.conditionId === conditionId) ?? null;
  }

  getAllConditions(): { conditionId: string; title: string }[] {
    return EDUCATION_CONTENT.map(e => ({ conditionId: e.conditionId, title: e.title }));
  }

  assessLiteracy(wordsRead: string[]): LiteracyResult {
    let correct = 0;
    const normalized = wordsRead.map(w => w.toLowerCase().trim());
    for (const word of normalized) {
      if (REALM_SF_WORDS.includes(word)) correct++;
    }
    const total = Math.min(wordsRead.length, REALM_SF_WORDS.length);
    const score = Math.round((correct / Math.max(total, 1)) * 100);
    let level: ReadingLevel;
    let recommendation: string;

    if (score >= 80) {
      level = 'advanced';
      recommendation = 'Patient can handle standard medical materials. Provide detailed information with medical terminology.';
    } else if (score >= 50) {
      level = 'intermediate';
      recommendation = 'Patient may struggle with complex medical text. Use simplified language and supplement with visuals.';
    } else {
      level = 'basic';
      recommendation = 'Patient needs plain-language materials at 4th-6th grade level. Use pictures, teach-back, and verbal instructions.';
    }

    return { score, level, wordsCorrect: correct, totalWords: total, recommendation };
  }

  getTeachBackQuestions(conditionId: string, difficulty?: ReadingLevel): TeachBackQuestion[] {
    const entry = EDUCATION_CONTENT.find(e => e.conditionId === conditionId);
    if (!entry) return [];
    if (difficulty) {
      return entry.teachBackQuestions.filter(q => q.difficulty === difficulty);
    }
    return entry.teachBackQuestions;
  }

  personalizeContent(conditionId: string, readingLevel: ReadingLevel, phase?: RecoveryPhase): PersonalizedContent | null {
    const entry = EDUCATION_CONTENT.find(e => e.conditionId === conditionId);
    if (!entry) return null;

    const targetPhases = phase ? entry.phases.filter(p => p.phase === phase) : entry.phases;
    let body: string;
    let format: ContentFormat;

    if (readingLevel === 'basic') {
      format = 'simplified';
      body = this.simplifyContent(entry, targetPhases);
    } else if (readingLevel === 'intermediate') {
      format = 'bullet_points';
      body = this.bulletPointContent(entry, targetPhases);
    } else {
      format = 'text';
      body = this.fullContent(entry, targetPhases);
    }

    const wordCount = body.split(/\s+/).length;
    const estimatedReadTime = Math.ceil(wordCount / 200);

    return { title: entry.title, body, format, readingLevel, estimatedReadTime };
  }

  recordEngagement(patientId: string, conditionId: string, sectionViewed: string, durationSeconds: number, completedTeachBack: boolean, teachBackScore: number): void {
    this.engagementLog.push({ patientId, conditionId, sectionViewed, durationSeconds, completedTeachBack, teachBackScore, timestamp: new Date() });
    const key = `${conditionId}:${sectionViewed}`;
    this.contentViewCounts.set(key, (this.contentViewCounts.get(key) ?? 0) + 1);
  }

  getEngagementStats(patientId?: string): { totalViews: number; avgDuration: number; teachBackCompletionRate: number; avgTeachBackScore: number } {
    const records = patientId ? this.engagementLog.filter(r => r.patientId === patientId) : this.engagementLog;
    if (records.length === 0) return { totalViews: 0, avgDuration: 0, teachBackCompletionRate: 0, avgTeachBackScore: 0 };

    const totalViews = records.length;
    const avgDuration = records.reduce((s, r) => s + r.durationSeconds, 0) / totalViews;
    const tbRecords = records.filter(r => r.completedTeachBack);
    const teachBackCompletionRate = tbRecords.length / totalViews;
    const avgTeachBackScore = tbRecords.length > 0 ? tbRecords.reduce((s, r) => s + r.teachBackScore, 0) / tbRecords.length : 0;

    return { totalViews, avgDuration: Math.round(avgDuration), teachBackCompletionRate: Math.round(teachBackCompletionRate * 100) / 100, avgTeachBackScore: Math.round(avgTeachBackScore * 100) / 100 };
  }

  getPopularContent(): { conditionId: string; section: string; views: number }[] {
    return Array.from(this.contentViewCounts.entries())
      .map(([key, views]) => {
        const [conditionId, section] = key.split(':');
        return { conditionId, section, views };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  // --- Private content formatters ---

  private simplifyContent(entry: EducationEntry, phases: PhaseContent[]): string {
    const lines: string[] = [];
    lines.push(entry.title);
    lines.push('');
    lines.push(entry.summary.split('. ').slice(0, 2).join('. ') + '.');
    for (const p of phases) {
      lines.push('');
      lines.push(`== ${p.phase.toUpperCase()} (${p.duration}) ==`);
      lines.push('What to do:');
      for (const a of p.activities.slice(0, 3)) lines.push(`- ${a}`);
      lines.push('Watch out for:');
      for (const w of p.warningSignals.slice(0, 2)) lines.push(`- ${w}`);
    }
    return lines.join('\n');
  }

  private bulletPointContent(entry: EducationEntry, phases: PhaseContent[]): string {
    const lines: string[] = [];
    lines.push(entry.title);
    lines.push('');
    lines.push(entry.summary);
    for (const p of phases) {
      lines.push('');
      lines.push(`--- ${p.phase.charAt(0).toUpperCase() + p.phase.slice(1)} Phase (${p.duration}) ---`);
      lines.push('Goals:');
      for (const g of p.goals) lines.push(`  * ${g}`);
      lines.push('Activities:');
      for (const a of p.activities) lines.push(`  * ${a}`);
      lines.push('Restrictions:');
      for (const r of p.restrictions) lines.push(`  * ${r}`);
      lines.push('Warning Signs:');
      for (const w of p.warningSignals) lines.push(`  ! ${w}`);
    }
    return lines.join('\n');
  }

  private fullContent(entry: EducationEntry, phases: PhaseContent[]): string {
    const lines: string[] = [];
    lines.push(entry.title);
    lines.push('');
    lines.push(entry.summary);
    for (const p of phases) {
      lines.push('');
      lines.push(`${p.phase.charAt(0).toUpperCase() + p.phase.slice(1)} Phase (${p.duration})`);
      lines.push(`Goals: ${p.goals.join('; ')}`);
      lines.push(`Activities: ${p.activities.join('; ')}`);
      lines.push(`Restrictions: ${p.restrictions.join('; ')}`);
      lines.push(`Warning Signs: ${p.warningSignals.join('; ')}`);
    }
    lines.push('');
    lines.push('References:');
    for (const c of entry.citations) lines.push(`  ${c}`);
    return lines.join('\n');
  }
}

export type { RecoveryPhase, ReadingLevel, ContentFormat, PhaseContent, TeachBackQuestion, EducationEntry, LiteracyResult, EngagementRecord, PersonalizedContent };
