// ============================================================================
// Real-World Test Data Generator
//
// Comprehensive, medically accurate test data generator for the Recovery Pilot
// healthcare platform. Generates 50 diverse patient records, 3 specialist
// doctors, patient-doctor mappings, realistic vital signs, post-operative
// medications, and individualized care plans.
//
// All data uses a seeded PRNG (Mulberry32) for deterministic, reproducible
// output. Medical values are grounded in published clinical ranges and
// post-operative recovery literature.
//
// Critical patients (indices 0-7) are specifically crafted to test crisis
// detection, anomaly alerting, and escalation pathways.
// ============================================================================

import {
  SurgeryType,
  type PatientRecord,
  type Comorbidities,
} from '../services/mlModels/recoveryPredictionModel';

import {
  type VitalReading,
  VitalType,
} from '../services/mlModels/anomalyDetectionEngine';

import {
  UserRole,
  MissionType,
  MissionStatus,
  CarePlanStatus,
  CarePlanMissionStatus,
  MedicationStatus,
} from '../types';

import type {
  UserModel,
  PatientDoctorRelationship,
  CarePlanModel,
  MissionModel,
} from '../types';

// ============================================================================
// Section 1: Seeded PRNG (Mulberry32)
// ============================================================================

/**
 * Create a seeded pseudo-random number generator using the Mulberry32 algorithm.
 * Returns a function that produces deterministic values in [0, 1) for a given seed.
 * Identical seeds always produce the identical sequence.
 */
export function createRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller transform: generate normally distributed value from uniform RNG */
function normalRandom(rng: () => number, mean: number, stdDev: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to N decimal places */
function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================================
// Section 2: Name Pools (Ethnically Diverse, Realistic)
// ============================================================================

const FIRST_NAMES_MALE = [
  'James', 'Rajesh', 'Carlos', 'Wei', 'Darnell', 'Mohammed', 'Patrick',
  'Hiroshi', 'Andrei', 'Samuel', 'Kwame', 'Diego', 'Vikram', 'Brandon',
  'Tomasz', 'Jin', 'Oluwaseun', 'Miguel', 'Arjun', 'Theodore',
  'Dmitri', 'Kofi', 'Amir', 'Javier', 'Tyrone',
];

const FIRST_NAMES_FEMALE = [
  'Maria', 'Priya', 'Aisha', 'Mei', 'Keisha', 'Fatima', 'Sarah',
  'Yuki', 'Elena', 'Amara', 'Guadalupe', 'Sunita', 'Jennifer', 'Nneka',
  'Olga', 'Linh', 'Abigail', 'Ananya', 'Rosa', 'Catherine',
  'Ifeoma', 'Hana', 'Lakshmi', 'Carmen', 'Denise',
];

const LAST_NAMES = [
  'Johnson', 'Patel', 'Garcia', 'Chen', 'Williams', 'Ahmed', 'O\'Brien',
  'Tanaka', 'Petrov', 'Okafor', 'Kim', 'Rodriguez', 'Singh', 'Jackson',
  'Kowalski', 'Nakamura', 'Adeyemi', 'Hernandez', 'Sharma', 'Thompson',
  'Ivanova', 'Mensah', 'Hassan', 'Morales', 'Washington',
  'Gupta', 'Lopez', 'Park', 'Okonkwo', 'Nguyen',
  'Fitzgerald', 'Yamamoto', 'Eze', 'Castillo', 'Robinson',
  'Chandra', 'Santos', 'Zhao', 'Diallo', 'Miller',
  'Reddy', 'Cruz', 'Li', 'Osei', 'Brown',
  'Joshi', 'Rivera', 'Wu', 'Afolabi', 'Davis',
];

// ============================================================================
// Section 3: Surgery Type Distribution & Metadata
// ============================================================================

const SURGERY_TYPES_LIST: SurgeryType[] = [
  SurgeryType.KNEE_REPLACEMENT,
  SurgeryType.HIP_REPLACEMENT,
  SurgeryType.ACL_RECONSTRUCTION,
  SurgeryType.ROTATOR_CUFF_REPAIR,
  SurgeryType.SPINAL_FUSION,
  SurgeryType.APPENDECTOMY,
  SurgeryType.CHOLECYSTECTOMY,
  SurgeryType.HERNIA_REPAIR,
  SurgeryType.CARDIAC_BYPASS,
  SurgeryType.CESAREAN_SECTION,
];

/** Expected recovery window in days per surgery type (median) */
const BASELINE_RECOVERY_DAYS: Record<SurgeryType, number> = {
  [SurgeryType.KNEE_REPLACEMENT]: 90,
  [SurgeryType.HIP_REPLACEMENT]: 84,
  [SurgeryType.ACL_RECONSTRUCTION]: 180,
  [SurgeryType.ROTATOR_CUFF_REPAIR]: 120,
  [SurgeryType.SPINAL_FUSION]: 180,
  [SurgeryType.APPENDECTOMY]: 21,
  [SurgeryType.CHOLECYSTECTOMY]: 28,
  [SurgeryType.HERNIA_REPAIR]: 35,
  [SurgeryType.CARDIAC_BYPASS]: 84,
  [SurgeryType.CESAREAN_SECTION]: 42,
};

/** Typical age ranges for each surgery type */
const SURGERY_AGE_RANGES: Record<SurgeryType, { min: number; max: number }> = {
  [SurgeryType.KNEE_REPLACEMENT]: { min: 50, max: 82 },
  [SurgeryType.HIP_REPLACEMENT]: { min: 50, max: 82 },
  [SurgeryType.ACL_RECONSTRUCTION]: { min: 22, max: 45 },
  [SurgeryType.ROTATOR_CUFF_REPAIR]: { min: 35, max: 65 },
  [SurgeryType.SPINAL_FUSION]: { min: 35, max: 72 },
  [SurgeryType.APPENDECTOMY]: { min: 22, max: 55 },
  [SurgeryType.CHOLECYSTECTOMY]: { min: 30, max: 65 },
  [SurgeryType.HERNIA_REPAIR]: { min: 28, max: 70 },
  [SurgeryType.CARDIAC_BYPASS]: { min: 50, max: 78 },
  [SurgeryType.CESAREAN_SECTION]: { min: 22, max: 42 },
};

// ============================================================================
// Section 4: Critical Patient Profiles (indices 0-7)
//
// These patients are specifically designed to trigger crisis detection systems.
// Each models a distinct, clinically significant post-operative complication.
// ============================================================================

interface CriticalProfile {
  name: string;
  gender: 'M' | 'F';
  age: number;
  bmi: number;
  surgeryType: SurgeryType;
  comorbidities: Comorbidities;
  complianceRate: number;
  woundHealingScore: number;
  daysSinceSurgery: number;
  painLevel: number;
  physicalTherapySessions: number;
  sleepQualityScore: number;
  description: string;
}

const CRITICAL_PATIENTS: CriticalProfile[] = [
  // 0: Developing sepsis - rising temp, tachycardia, dropping O2
  {
    name: 'Marcus Washington',
    gender: 'M',
    age: 68,
    bmi: 31.2,
    surgeryType: SurgeryType.HIP_REPLACEMENT,
    comorbidities: {
      diabetes: true,
      hypertension: true,
      obesity: true,
      smoking: false,
      heartDisease: false,
      osteoporosis: true,
      immunocompromised: false,
    },
    complianceRate: 0.72,
    woundHealingScore: 3,
    daysSinceSurgery: 5,
    painLevel: 8,
    physicalTherapySessions: 1,
    sleepQualityScore: 3,
    description: 'Developing sepsis: rising temperature, tachycardia, dropping O2 saturation',
  },

  // 1: Wound infection - fever, pain increase at surgical site
  {
    name: 'Elena Petrov',
    gender: 'F',
    age: 55,
    bmi: 27.8,
    surgeryType: SurgeryType.KNEE_REPLACEMENT,
    comorbidities: {
      diabetes: true,
      hypertension: false,
      obesity: false,
      smoking: true,
      heartDisease: false,
      osteoporosis: false,
      immunocompromised: false,
    },
    complianceRate: 0.65,
    woundHealingScore: 2,
    daysSinceSurgery: 8,
    painLevel: 7,
    physicalTherapySessions: 3,
    sleepQualityScore: 4,
    description: 'Wound infection: persistent fever, increasing pain, poor wound healing',
  },

  // 2: DVT risk - immobility, orthopedic surgery, obesity
  {
    name: 'Theodore Johnson',
    gender: 'M',
    age: 72,
    bmi: 38.5,
    surgeryType: SurgeryType.KNEE_REPLACEMENT,
    comorbidities: {
      diabetes: false,
      hypertension: true,
      obesity: true,
      smoking: false,
      heartDisease: true,
      osteoporosis: false,
      immunocompromised: false,
    },
    complianceRate: 0.35,
    woundHealingScore: 4,
    daysSinceSurgery: 3,
    painLevel: 7,
    physicalTherapySessions: 0,
    sleepQualityScore: 4,
    description: 'DVT risk: immobile post-op, obese, heart disease, zero PT sessions',
  },

  // 3: Medication non-compliance
  {
    name: 'Aisha Ahmed',
    gender: 'F',
    age: 34,
    bmi: 24.1,
    surgeryType: SurgeryType.APPENDECTOMY,
    comorbidities: {
      diabetes: false,
      hypertension: false,
      obesity: false,
      smoking: false,
      heartDisease: false,
      osteoporosis: false,
      immunocompromised: false,
    },
    complianceRate: 0.18,
    woundHealingScore: 5,
    daysSinceSurgery: 10,
    painLevel: 6,
    physicalTherapySessions: 1,
    sleepQualityScore: 5,
    description: 'Medication non-compliance: 18% compliance, rising pain from missed analgesics',
  },

  // 4: Post-op bleeding - dropping BP, tachycardia
  {
    name: 'Carlos Rodriguez',
    gender: 'M',
    age: 62,
    bmi: 26.3,
    surgeryType: SurgeryType.CARDIAC_BYPASS,
    comorbidities: {
      diabetes: false,
      hypertension: true,
      obesity: false,
      smoking: true,
      heartDisease: true,
      osteoporosis: false,
      immunocompromised: false,
    },
    complianceRate: 0.80,
    woundHealingScore: 4,
    daysSinceSurgery: 2,
    painLevel: 8,
    physicalTherapySessions: 0,
    sleepQualityScore: 2,
    description: 'Post-op bleeding: dropping systolic BP, compensatory tachycardia',
  },

  // 5: Mental health crisis - very low sleep, high pain, low compliance
  {
    name: 'Jennifer Thompson',
    gender: 'F',
    age: 45,
    bmi: 29.0,
    surgeryType: SurgeryType.SPINAL_FUSION,
    comorbidities: {
      diabetes: false,
      hypertension: false,
      obesity: false,
      smoking: true,
      heartDisease: false,
      osteoporosis: false,
      immunocompromised: false,
    },
    complianceRate: 0.22,
    woundHealingScore: 3,
    daysSinceSurgery: 21,
    painLevel: 9,
    physicalTherapySessions: 2,
    sleepQualityScore: 1,
    description: 'Mental health crisis: severe insomnia (1/10), uncontrolled pain, disengaged from care',
  },

  // 6: Elderly with multiple comorbidities at high readmission risk
  {
    name: 'Kwame Mensah',
    gender: 'M',
    age: 79,
    bmi: 33.4,
    surgeryType: SurgeryType.HIP_REPLACEMENT,
    comorbidities: {
      diabetes: true,
      hypertension: true,
      obesity: true,
      smoking: false,
      heartDisease: true,
      osteoporosis: true,
      immunocompromised: true,
    },
    complianceRate: 0.45,
    woundHealingScore: 2,
    daysSinceSurgery: 7,
    painLevel: 7,
    physicalTherapySessions: 1,
    sleepQualityScore: 3,
    description: 'High readmission risk: 79 yo, 6 comorbidities, immunocompromised, poor wound healing',
  },

  // 7: Diabetic with poor glucose control post-surgery
  {
    name: 'Sunita Gupta',
    gender: 'F',
    age: 58,
    bmi: 35.7,
    surgeryType: SurgeryType.CHOLECYSTECTOMY,
    comorbidities: {
      diabetes: true,
      hypertension: true,
      obesity: true,
      smoking: false,
      heartDisease: false,
      osteoporosis: false,
      immunocompromised: false,
    },
    complianceRate: 0.55,
    woundHealingScore: 4,
    daysSinceSurgery: 6,
    painLevel: 5,
    physicalTherapySessions: 2,
    sleepQualityScore: 4,
    description: 'Poor glucose control: diabetic with BMI 35.7, post-cholecystectomy glucose spikes',
  },
];

// ============================================================================
// Section 5: Patient Generation
// ============================================================================

/**
 * Generate realistic patient records for testing.
 *
 * The first 8 patients (indices 0-7) are hard-coded critical patients designed
 * to test crisis detection. The remaining patients are procedurally generated
 * with medically plausible demographics, comorbidities, and recovery metrics.
 *
 * Comorbidities are correlated with age and BMI:
 * - Diabetes: increases with age and BMI (base ~4%, up to ~30% in elderly obese)
 * - Hypertension: increases with age and BMI (base ~6%, up to ~40%)
 * - Obesity: defined as BMI >= 30
 * - Smoking: ~14% prevalence (age-independent)
 * - Heart disease: increases strongly with age (base ~2%, up to ~15% over 60)
 * - Osteoporosis: ~22% over 60, ~8% 50-60, rare under 50
 * - Immunocompromised: ~3% (rare, age-independent)
 *
 * @param count  Number of patients to generate (default 50)
 * @param seed   PRNG seed for reproducibility (default 42)
 * @returns Array of PatientRecord objects
 */
export function generateRealisticPatients(
  count: number = 50,
  seed: number = 42,
): PatientRecord[] {
  const rng = createRng(seed);
  const patients: PatientRecord[] = [];

  // --- Critical patients (indices 0-7) ---
  for (let i = 0; i < Math.min(CRITICAL_PATIENTS.length, count); i++) {
    const cp = CRITICAL_PATIENTS[i];
    const baselineDays = BASELINE_RECOVERY_DAYS[cp.surgeryType];

    // Compute realistic recovery multiplier for outcome classification
    let recoveryMultiplier = 1.0;
    if (cp.age > 50) recoveryMultiplier += (cp.age - 50) * 0.008;
    if (cp.bmi > 30) recoveryMultiplier += (cp.bmi - 30) * 0.015;
    if (cp.bmi > 35) recoveryMultiplier += 0.05;
    if (cp.comorbidities.diabetes) recoveryMultiplier += 0.15;
    if (cp.comorbidities.hypertension) recoveryMultiplier += 0.05;
    if (cp.comorbidities.smoking) recoveryMultiplier += 0.20;
    if (cp.comorbidities.heartDisease) recoveryMultiplier += 0.12;
    if (cp.comorbidities.osteoporosis) recoveryMultiplier += 0.10;
    if (cp.comorbidities.immunocompromised) recoveryMultiplier += 0.25;
    recoveryMultiplier -= (cp.complianceRate - 0.5) * 0.3;
    recoveryMultiplier = Math.max(0.6, recoveryMultiplier);

    const actualRecoveryDays = Math.round(baselineDays * recoveryMultiplier);
    const ratio = actualRecoveryDays / baselineDays;

    let outcome: PatientRecord['outcome'];
    if (ratio < 0.85) outcome = 'faster_than_expected';
    else if (ratio <= 1.1) outcome = 'on_track';
    else if (ratio <= 1.35) outcome = 'delayed';
    else outcome = 'significantly_delayed';

    patients.push({
      id: `patient-${String(i + 1).padStart(3, '0')}`,
      age: cp.age,
      bmi: cp.bmi,
      surgeryType: cp.surgeryType,
      comorbidities: cp.comorbidities,
      complianceRate: cp.complianceRate,
      woundHealingScore: cp.woundHealingScore,
      daysSinceSurgery: cp.daysSinceSurgery,
      painLevel: cp.painLevel,
      physicalTherapySessions: cp.physicalTherapySessions,
      sleepQualityScore: cp.sleepQualityScore,
      outcome,
      actualRecoveryDays,
    });
  }

  // --- Procedurally generated patients (indices 8+) ---
  const usedNames = new Set(CRITICAL_PATIENTS.map(cp => cp.name));

  for (let i = CRITICAL_PATIENTS.length; i < count; i++) {
    // Pick surgery type with weighted distribution
    const surgeryType = SURGERY_TYPES_LIST[Math.floor(rng() * SURGERY_TYPES_LIST.length)];
    const ageRange = SURGERY_AGE_RANGES[surgeryType];
    const age = Math.floor(ageRange.min + rng() * (ageRange.max - ageRange.min));

    // BMI: normal distribution centered at 26.5 with realistic spread
    // Higher ages tend toward higher BMI
    const ageBmiShift = (age - 40) * 0.05;
    let bmi = round(normalRandom(rng, 26.5 + ageBmiShift, 4.5), 1);
    bmi = clamp(bmi, 18.5, 42.0);

    // Gender determination
    const isFemale = rng() < 0.5 ||
      surgeryType === SurgeryType.CESAREAN_SECTION; // C-section always female

    // Name generation (avoid duplicates)
    let name: string;
    do {
      const firstPool = isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
      const firstName = firstPool[Math.floor(rng() * firstPool.length)];
      const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
      name = `${firstName} ${lastName}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    // Comorbidities correlated with age and BMI
    const comorbidityRisk = (age - 22) / 60 * 0.4 + (bmi - 18.5) / 23.5 * 0.3;
    const comorbidities: Comorbidities = {
      diabetes: rng() < (comorbidityRisk * 0.6 + 0.04),
      hypertension: rng() < (comorbidityRisk * 0.7 + 0.06),
      obesity: bmi >= 30,
      smoking: rng() < 0.14,
      heartDisease: rng() < (comorbidityRisk * 0.25 + (age > 60 ? 0.08 : 0.02)),
      osteoporosis: rng() < (age > 60 ? 0.22 : age > 50 ? 0.08 : 0.02),
      immunocompromised: rng() < 0.03,
    };

    const comorbidityCnt = Object.values(comorbidities).filter(Boolean).length;

    // Compliance: generally 0.5-1.0, reduced by comorbidity burden
    const baseCompliance = 0.55 + rng() * 0.45;
    const complianceRate = round(
      clamp(baseCompliance - comorbidityCnt * 0.04 + (rng() - 0.5) * 0.15, 0.25, 1.0),
      2,
    );

    // Days since surgery: distributed within recovery window
    const baselineDays = BASELINE_RECOVERY_DAYS[surgeryType];
    const daysSinceSurgery = Math.floor(1 + rng() * Math.min(baselineDays, 90));

    // Pain level: decreases over recovery, increased by comorbidities
    const surgeryProgress = Math.min(daysSinceSurgery / baselineDays, 1.5);
    const basePain = Math.max(0, 8 - surgeryProgress * 6 + (rng() - 0.5) * 2.5);
    const painLevel = clamp(
      Math.round(basePain + comorbidityCnt * 0.4 + (comorbidities.smoking ? 0.8 : 0)),
      0,
      10,
    );

    // PT sessions: ~1 every 3.5 days times compliance
    const expectedPt = Math.floor(daysSinceSurgery / 3.5);
    const physicalTherapySessions = Math.max(
      0,
      Math.floor(expectedPt * complianceRate + (rng() - 0.5) * 2),
    );

    // Wound healing: 1-10, improves over time, degraded by age/BMI/comorbidities
    const healingBase = Math.min(10, 2 + surgeryProgress * 7);
    const woundHealingScore = clamp(
      Math.round(
        healingBase
        - (age > 65 ? 1.5 : 0)
        - (bmi > 35 ? 1.2 : bmi > 30 ? 0.6 : 0)
        - comorbidityCnt * 0.35
        + complianceRate * 1.5
        + (rng() - 0.5) * 1.8,
      ),
      1,
      10,
    );

    // Sleep quality: 1-10, inversely related to pain
    const sleepQualityScore = clamp(
      Math.round(7 - painLevel * 0.35 + complianceRate * 1.2 + (rng() - 0.5) * 2),
      1,
      10,
    );

    // Recovery outcome determination
    let recoveryMultiplier = 1.0;
    if (age > 50) recoveryMultiplier += (age - 50) * 0.008;
    if (bmi > 30) recoveryMultiplier += (bmi - 30) * 0.015;
    if (bmi > 35) recoveryMultiplier += 0.05;
    if (comorbidities.diabetes) recoveryMultiplier += 0.15;
    if (comorbidities.hypertension) recoveryMultiplier += 0.05;
    if (comorbidities.smoking) recoveryMultiplier += 0.20;
    if (comorbidities.heartDisease) recoveryMultiplier += 0.12;
    if (comorbidities.osteoporosis) recoveryMultiplier += 0.10;
    if (comorbidities.immunocompromised) recoveryMultiplier += 0.25;
    recoveryMultiplier -= (complianceRate - 0.5) * 0.3;
    recoveryMultiplier += (rng() - 0.5) * 0.18;
    recoveryMultiplier = Math.max(0.6, recoveryMultiplier);

    const actualRecoveryDays = Math.round(baselineDays * recoveryMultiplier);
    const ratio = actualRecoveryDays / baselineDays;

    let outcome: PatientRecord['outcome'];
    if (ratio < 0.85) outcome = 'faster_than_expected';
    else if (ratio <= 1.1) outcome = 'on_track';
    else if (ratio <= 1.35) outcome = 'delayed';
    else outcome = 'significantly_delayed';

    patients.push({
      id: `patient-${String(i + 1).padStart(3, '0')}`,
      age,
      bmi,
      surgeryType,
      comorbidities,
      complianceRate,
      woundHealingScore,
      daysSinceSurgery,
      painLevel,
      physicalTherapySessions,
      sleepQualityScore,
      outcome,
      actualRecoveryDays,
    });
  }

  return patients;
}

// ============================================================================
// Section 6: Doctor Generation
// ============================================================================

/** Surgery types handled by Dr. Sarah Chen (Orthopedic Surgery) */
const ORTHOPEDIC_SURGERIES: SurgeryType[] = [
  SurgeryType.KNEE_REPLACEMENT,
  SurgeryType.HIP_REPLACEMENT,
  SurgeryType.ACL_RECONSTRUCTION,
  SurgeryType.ROTATOR_CUFF_REPAIR,
  SurgeryType.SPINAL_FUSION,
];

/** Surgery types handled by Dr. Michael Okonkwo (General Surgery) */
const GENERAL_SURGERIES: SurgeryType[] = [
  SurgeryType.APPENDECTOMY,
  SurgeryType.CHOLECYSTECTOMY,
  SurgeryType.HERNIA_REPAIR,
];

/** Surgery types handled by Dr. Priya Sharma (Cardiothoracic / OB-GYN) */
const CARDIOTHORACIC_OB_SURGERIES: SurgeryType[] = [
  SurgeryType.CARDIAC_BYPASS,
  SurgeryType.CESAREAN_SECTION,
];

/**
 * Generate the three specialist doctors.
 *
 * - Dr. Sarah Chen: Orthopedic Surgery
 *   Handles: knee replacement, hip replacement, ACL reconstruction,
 *   rotator cuff repair, spinal fusion
 *
 * - Dr. Michael Okonkwo: General Surgery
 *   Handles: appendectomy, cholecystectomy, hernia repair
 *
 * - Dr. Priya Sharma: Cardiothoracic Surgery / OB-GYN
 *   Handles: cardiac bypass, cesarean section
 */
export function generateDoctors(): UserModel[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'doctor-001',
      username: 'dr.chen',
      passwordHash: '$2b$10$placeholder.orthopedic.hash',
      name: 'Dr. Sarah Chen',
      role: UserRole.DOCTOR,
      streakCount: 0,
      lastLoginDate: now,
      createdAt: '2024-01-15T08:00:00.000Z',
    },
    {
      id: 'doctor-002',
      username: 'dr.okonkwo',
      passwordHash: '$2b$10$placeholder.general.hash',
      name: 'Dr. Michael Okonkwo',
      role: UserRole.DOCTOR,
      streakCount: 0,
      lastLoginDate: now,
      createdAt: '2024-02-01T08:00:00.000Z',
    },
    {
      id: 'doctor-003',
      username: 'dr.sharma',
      passwordHash: '$2b$10$placeholder.cardiothoracic.hash',
      name: 'Dr. Priya Sharma',
      role: UserRole.DOCTOR,
      streakCount: 0,
      lastLoginDate: now,
      createdAt: '2024-01-20T08:00:00.000Z',
    },
  ];
}

// ============================================================================
// Section 7: Patient-Doctor Mapping
// ============================================================================

/**
 * Map each patient to the appropriate doctor based on surgery type.
 *
 * - Orthopedic surgeries (knee, hip, ACL, rotator cuff, spinal fusion)
 *   -> Dr. Sarah Chen (doctor-001)
 * - General surgeries (appendectomy, cholecystectomy, hernia repair)
 *   -> Dr. Michael Okonkwo (doctor-002)
 * - Cardiac bypass, cesarean section
 *   -> Dr. Priya Sharma (doctor-003)
 */
export function generatePatientDoctorMappings(
  patients: PatientRecord[],
  doctors: UserModel[],
): PatientDoctorRelationship[] {
  const doctorMap: Record<string, string> = {};

  // Build surgery-type -> doctor-id lookup
  for (const st of ORTHOPEDIC_SURGERIES) {
    doctorMap[st] = doctors[0].id; // Dr. Chen
  }
  for (const st of GENERAL_SURGERIES) {
    doctorMap[st] = doctors[1].id; // Dr. Okonkwo
  }
  for (const st of CARDIOTHORACIC_OB_SURGERIES) {
    doctorMap[st] = doctors[2].id; // Dr. Sharma
  }

  return patients.map((patient, index) => ({
    id: `rel-${String(index + 1).padStart(3, '0')}`,
    patientId: patient.id,
    doctorId: doctorMap[patient.surgeryType] ?? doctors[0].id,
    assignedAt: '2025-01-10T09:00:00.000Z',
    assignedBy: 'admin-001',
    active: true,
  }));
}

// ============================================================================
// Section 8: Vital Signs Generation
// ============================================================================

/**
 * Generate realistic vital sign readings for a single patient across a 24-hour period.
 *
 * Medical accuracy requirements:
 * - Heart rate: 60-100 bpm normal, tachycardia >100 for complications
 * - BP systolic: 110-140 mmHg normal, hypertensive >140
 * - BP diastolic: 70-90 mmHg normal
 * - Temperature: 36.5-37.5 C normal, fever >38.0 for infection
 * - O2 saturation: 95-100% normal, <92% concerning
 * - Respiratory rate: 12-20 breaths/min normal
 * - Pain level: 0-10, should decrease over recovery time
 * - Blood glucose: 70-100 mg/dL fasting normal, diabetics may be higher
 *
 * Accounts for:
 * - Post-operative day (vitals normalize over recovery)
 * - Complications flag (elevates concerning vitals realistically)
 * - Circadian rhythm (slight daytime elevation in HR/BP)
 *
 * @param patientId        Patient identifier
 * @param daysSinceSurgery Number of days post-operation
 * @param hasComplications Whether the patient has active complications
 * @param seed             PRNG seed for reproducibility
 * @returns Array of VitalReading objects (one per vital type per reading time)
 */
export function generateRealisticVitals(
  patientId: string,
  daysSinceSurgery: number,
  hasComplications: boolean,
  seed: number,
): VitalReading[] {
  const rng = createRng(seed);
  const readings: VitalReading[] = [];

  // Recovery progress: 0 = just post-op, 1 = fully recovered
  const recovery = clamp(daysSinceSurgery / 90, 0, 1);

  // Generate 4 reading sets per day (06:00, 10:00, 14:00, 20:00)
  const readingHours = [6, 10, 14, 20];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 1);

  for (const hour of readingHours) {
    const timestamp = new Date(baseDate);
    timestamp.setHours(hour, Math.floor(rng() * 60), 0, 0);
    const ts = timestamp.toISOString();

    // Circadian: slightly higher HR/BP during waking hours
    const isDaytime = hour >= 8 && hour <= 18;
    const circadianShift = isDaytime ? 1 : -1;

    // --- Heart Rate ---
    // Normal range: 60-100 bpm. Post-op mild tachycardia is common.
    // Complications: tachycardia >100 (sepsis, bleeding, pain, PE)
    let hrMean = 75 + circadianShift * 3;
    if (hasComplications) hrMean += 20 + rng() * 15; // tachycardia 95-110+
    hrMean += (1 - recovery) * 5; // slightly elevated early post-op
    const hr = round(clamp(normalRandom(rng, hrMean, 6), 45, 160));
    readings.push({
      patientId, timestamp: ts, vitalType: VitalType.HEART_RATE,
      value: hr, unit: 'bpm',
    });

    // --- Systolic Blood Pressure ---
    // Normal: 110-140 mmHg. Drops in bleeding/sepsis.
    let sbpMean = 122 + circadianShift * 4;
    if (hasComplications) sbpMean -= 15 + rng() * 10; // hypotension in bleeding
    const sbp = round(clamp(normalRandom(rng, sbpMean, 10), 70, 200));
    readings.push({
      patientId, timestamp: ts, vitalType: VitalType.BLOOD_PRESSURE_SYSTOLIC,
      value: sbp, unit: 'mmHg',
    });

    // --- Diastolic Blood Pressure ---
    // Normal: 70-90 mmHg. Tracks with systolic changes.
    let dbpMean = 78 + circadianShift * 2;
    if (hasComplications) dbpMean -= 8;
    const dbp = round(clamp(normalRandom(rng, dbpMean, 6), 40, 120));
    readings.push({
      patientId, timestamp: ts, vitalType: VitalType.BLOOD_PRESSURE_DIASTOLIC,
      value: dbp, unit: 'mmHg',
    });

    // --- Temperature ---
    // Normal: 36.5-37.5 C. Fever >38.0 suggests infection.
    // Post-op day 1-2 low-grade elevation is physiologic.
    let tempMean = 36.8;
    if (hasComplications) tempMean += 0.8 + rng() * 1.2; // fever 37.6-39.8
    tempMean += (1 - recovery) * 0.2; // slight post-op elevation
    const temp = round(clamp(normalRandom(rng, tempMean, 0.25), 35.0, 41.0), 1);
    readings.push({
      patientId, timestamp: ts, vitalType: VitalType.TEMPERATURE,
      value: temp, unit: 'C',
    });

    // --- Oxygen Saturation ---
    // Normal: 95-100%. <92% is concerning. Post-op atelectasis common.
    let o2Mean = 97.5;
    if (hasComplications) o2Mean -= 4 + rng() * 4; // drop to 89.5-93.5
    o2Mean -= (1 - recovery) * 1; // slightly lower early post-op
    const o2 = round(clamp(normalRandom(rng, o2Mean, 1.2), 82, 100));
    readings.push({
      patientId, timestamp: ts, vitalType: VitalType.OXYGEN_SATURATION,
      value: o2, unit: '%',
    });

    // --- Respiratory Rate ---
    // Normal: 12-20 breaths/min. Tachypnea >20 in PE, sepsis, pain.
    let rrMean = 16;
    if (hasComplications) rrMean += 4 + rng() * 6; // tachypnea
    rrMean += (1 - recovery) * 2;
    const rr = round(clamp(normalRandom(rng, rrMean, 2), 8, 36));
    readings.push({
      patientId, timestamp: ts, vitalType: VitalType.RESPIRATORY_RATE,
      value: rr, unit: 'breaths/min',
    });

    // --- Pain Level ---
    // 0-10 scale. Decreases over recovery. Spikes with complications.
    let painMean = 3 + (1 - recovery) * 4; // 3-7 range, decreasing
    if (hasComplications) painMean += 2;
    const pain = clamp(Math.round(normalRandom(rng, painMean, 1.5)), 0, 10);
    readings.push({
      patientId, timestamp: ts, vitalType: VitalType.PAIN_LEVEL,
      value: pain, unit: '/10',
    });

    // --- Blood Glucose ---
    // Fasting: 70-100 mg/dL. Post-prandial: up to 140 mg/dL normal.
    // Surgical stress and diabetics: elevated levels expected.
    const isFasting = hour <= 8;
    let glucoseMean = isFasting ? 90 : 120;
    if (hasComplications) glucoseMean += 30 + rng() * 50; // stress hyperglycemia
    const glucose = round(clamp(normalRandom(rng, glucoseMean, 15), 50, 350));
    readings.push({
      patientId, timestamp: ts, vitalType: VitalType.BLOOD_GLUCOSE,
      value: glucose, unit: 'mg/dL',
    });
  }

  return readings;
}

// ============================================================================
// Section 9: Medication Generation
// ============================================================================

/** Single medication entry for post-operative care */
interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  category: 'analgesic' | 'antibiotic' | 'anticoagulant' | 'cardiac'
    | 'anti-inflammatory' | 'antiemetic' | 'gastrointestinal' | 'other';
  durationDays: number;
  instructions: string;
}

/**
 * Generate realistic post-operative medication regimens by surgery type.
 *
 * Medications are based on standard-of-care protocols from published surgical
 * guidelines (ACS, AAOS, ACC/AHA). Each regimen includes:
 * - Pain management (multimodal analgesia per Enhanced Recovery protocols)
 * - Infection prophylaxis (appropriate antibiotic coverage)
 * - Surgery-specific medications (anticoagulants, cardiac meds, etc.)
 * - Supportive medications (antiemetics, GI protection)
 *
 * @param surgeryType The type of surgery performed
 * @returns Array of medication entries with real drug names and dosages
 */
export function generateRealisticMedications(surgeryType: SurgeryType): MedicationEntry[] {
  const medicationsByType: Record<SurgeryType, MedicationEntry[]> = {

    // ---- Knee Replacement (per AAOS / ERAS guidelines) ----
    // Multimodal pain, DVT prophylaxis, infection prevention
    [SurgeryType.KNEE_REPLACEMENT]: [
      {
        name: 'Oxycodone',
        dosage: '5mg',
        frequency: 'Every 4-6 hours as needed',
        category: 'analgesic',
        durationDays: 14,
        instructions: 'Take with food. Do not exceed 6 tablets per day. Taper dose as pain improves.',
      },
      {
        name: 'Celecoxib',
        dosage: '200mg',
        frequency: 'Twice daily',
        category: 'anti-inflammatory',
        durationDays: 21,
        instructions: 'Take with food. COX-2 selective NSAID for inflammation and pain.',
      },
      {
        name: 'Enoxaparin',
        dosage: '40mg subcutaneous',
        frequency: 'Once daily',
        category: 'anticoagulant',
        durationDays: 28,
        instructions: 'Inject subcutaneously in the abdomen. DVT prophylaxis per AAOS guidelines.',
      },
      {
        name: 'Cephalexin',
        dosage: '500mg',
        frequency: 'Four times daily',
        category: 'antibiotic',
        durationDays: 7,
        instructions: 'Complete full course. Take at evenly spaced intervals.',
      },
      {
        name: 'Acetaminophen',
        dosage: '1000mg',
        frequency: 'Every 6 hours',
        category: 'analgesic',
        durationDays: 21,
        instructions: 'Do not exceed 3000mg/day. Avoid alcohol. Baseline analgesic.',
      },
    ],

    // ---- Hip Replacement (per AAOS / NICE guidelines) ----
    [SurgeryType.HIP_REPLACEMENT]: [
      {
        name: 'Oxycodone',
        dosage: '5-10mg',
        frequency: 'Every 4-6 hours as needed',
        category: 'analgesic',
        durationDays: 14,
        instructions: 'Take with food. Start at 5mg, increase only if needed. Taper by week 2.',
      },
      {
        name: 'Meloxicam',
        dosage: '15mg',
        frequency: 'Once daily',
        category: 'anti-inflammatory',
        durationDays: 28,
        instructions: 'Take with food. Long-acting NSAID for joint inflammation.',
      },
      {
        name: 'Rivaroxaban',
        dosage: '10mg',
        frequency: 'Once daily',
        category: 'anticoagulant',
        durationDays: 35,
        instructions: 'Take with evening meal. DVT/PE prophylaxis for 5 weeks post-THA.',
      },
      {
        name: 'Cefazolin IV then Cephalexin PO',
        dosage: '1g IV / 500mg PO',
        frequency: 'Three times daily (PO phase)',
        category: 'antibiotic',
        durationDays: 7,
        instructions: 'IV for 24h post-op, then transition to oral. Complete full course.',
      },
      {
        name: 'Acetaminophen',
        dosage: '1000mg',
        frequency: 'Every 6 hours',
        category: 'analgesic',
        durationDays: 28,
        instructions: 'Scheduled dosing for first 2 weeks, then as needed. Max 3000mg/day.',
      },
      {
        name: 'Ondansetron',
        dosage: '4mg',
        frequency: 'Every 8 hours as needed',
        category: 'antiemetic',
        durationDays: 5,
        instructions: 'For post-operative nausea. May dissolve on tongue.',
      },
    ],

    // ---- ACL Reconstruction (younger population, aggressive PT) ----
    [SurgeryType.ACL_RECONSTRUCTION]: [
      {
        name: 'Hydrocodone/Acetaminophen',
        dosage: '5/325mg',
        frequency: 'Every 4-6 hours as needed',
        category: 'analgesic',
        durationDays: 10,
        instructions: 'Short-term use only. Ice and elevation are primary pain management.',
      },
      {
        name: 'Ibuprofen',
        dosage: '600mg',
        frequency: 'Three times daily with food',
        category: 'anti-inflammatory',
        durationDays: 14,
        instructions: 'Take with food. Anti-inflammatory for knee swelling.',
      },
      {
        name: 'Aspirin',
        dosage: '325mg',
        frequency: 'Twice daily',
        category: 'anticoagulant',
        durationDays: 14,
        instructions: 'DVT prophylaxis. Take with food.',
      },
      {
        name: 'Cephalexin',
        dosage: '500mg',
        frequency: 'Three times daily',
        category: 'antibiotic',
        durationDays: 5,
        instructions: 'Perioperative antibiotic prophylaxis. Complete full course.',
      },
      {
        name: 'Gabapentin',
        dosage: '300mg',
        frequency: 'At bedtime',
        category: 'analgesic',
        durationDays: 14,
        instructions: 'For nerve pain and sleep improvement. Do not stop abruptly.',
      },
    ],

    // ---- Rotator Cuff Repair (shoulder-specific protocol) ----
    [SurgeryType.ROTATOR_CUFF_REPAIR]: [
      {
        name: 'Tramadol',
        dosage: '50mg',
        frequency: 'Every 6 hours as needed',
        category: 'analgesic',
        durationDays: 14,
        instructions: 'Take with food. Avoid driving. May cause drowsiness.',
      },
      {
        name: 'Naproxen',
        dosage: '500mg',
        frequency: 'Twice daily',
        category: 'anti-inflammatory',
        durationDays: 21,
        instructions: 'Take with food. For shoulder inflammation and pain.',
      },
      {
        name: 'Acetaminophen',
        dosage: '1000mg',
        frequency: 'Every 6 hours',
        category: 'analgesic',
        durationDays: 21,
        instructions: 'Scheduled around-the-clock for first week, then as needed. Max 3000mg/day.',
      },
      {
        name: 'Cephalexin',
        dosage: '500mg',
        frequency: 'Three times daily',
        category: 'antibiotic',
        durationDays: 5,
        instructions: 'Infection prophylaxis. Complete full course.',
      },
      {
        name: 'Cyclobenzaprine',
        dosage: '10mg',
        frequency: 'At bedtime',
        category: 'other',
        durationDays: 10,
        instructions: 'Muscle relaxant for shoulder spasm. Take at bedtime due to sedation.',
      },
    ],

    // ---- Spinal Fusion (complex pain management, nerve protection) ----
    [SurgeryType.SPINAL_FUSION]: [
      {
        name: 'Oxycodone Extended-Release',
        dosage: '10mg',
        frequency: 'Every 12 hours',
        category: 'analgesic',
        durationDays: 14,
        instructions: 'Swallow whole, do not crush or chew. Taper under physician guidance.',
      },
      {
        name: 'Gabapentin',
        dosage: '300mg titrating to 900mg',
        frequency: 'Three times daily',
        category: 'analgesic',
        durationDays: 60,
        instructions: 'Start at 300mg, increase by 300mg every 3 days. For neuropathic pain.',
      },
      {
        name: 'Diazepam',
        dosage: '5mg',
        frequency: 'Every 8 hours as needed',
        category: 'other',
        durationDays: 10,
        instructions: 'For muscle spasms. Short-term use only. Avoid alcohol.',
      },
      {
        name: 'Enoxaparin',
        dosage: '40mg subcutaneous',
        frequency: 'Once daily',
        category: 'anticoagulant',
        durationDays: 14,
        instructions: 'DVT prophylaxis. Continue until adequately mobile.',
      },
      {
        name: 'Cefazolin IV then Cephalexin PO',
        dosage: '2g IV / 500mg PO',
        frequency: 'Three times daily (PO phase)',
        category: 'antibiotic',
        durationDays: 7,
        instructions: 'IV for 48h post-op, then oral for 5 days.',
      },
      {
        name: 'Acetaminophen',
        dosage: '1000mg',
        frequency: 'Every 6 hours',
        category: 'analgesic',
        durationDays: 28,
        instructions: 'Baseline non-opioid analgesic. Max 3000mg/day.',
      },
    ],

    // ---- Appendectomy (short recovery, outpatient-friendly) ----
    [SurgeryType.APPENDECTOMY]: [
      {
        name: 'Amoxicillin-Clavulanate',
        dosage: '875/125mg',
        frequency: 'Twice daily',
        category: 'antibiotic',
        durationDays: 7,
        instructions: 'Complete full course. Broad-spectrum coverage for intra-abdominal flora.',
      },
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Every 6 hours as needed',
        category: 'anti-inflammatory',
        durationDays: 10,
        instructions: 'Take with food. First-line analgesic for post-appendectomy pain.',
      },
      {
        name: 'Ondansetron',
        dosage: '4mg',
        frequency: 'Every 8 hours as needed',
        category: 'antiemetic',
        durationDays: 5,
        instructions: 'For nausea and vomiting. May dissolve on tongue.',
      },
      {
        name: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 6 hours as needed',
        category: 'analgesic',
        durationDays: 10,
        instructions: 'Alternate with ibuprofen for optimal pain control. Max 3000mg/day.',
      },
    ],

    // ---- Cholecystectomy (laparoscopic-typical, bile acid management) ----
    [SurgeryType.CHOLECYSTECTOMY]: [
      {
        name: 'Ciprofloxacin',
        dosage: '500mg',
        frequency: 'Twice daily',
        category: 'antibiotic',
        durationDays: 5,
        instructions: 'If complicated cholecystitis. Take 2 hours before or 6 hours after antacids.',
      },
      {
        name: 'Ketorolac then Ibuprofen',
        dosage: '30mg IV / 400mg PO',
        frequency: 'Every 6 hours (PO phase)',
        category: 'anti-inflammatory',
        durationDays: 7,
        instructions: 'Ketorolac IV for 48h, then ibuprofen PO. Take with food.',
      },
      {
        name: 'Ondansetron',
        dosage: '4mg',
        frequency: 'Every 8 hours as needed',
        category: 'antiemetic',
        durationDays: 5,
        instructions: 'Post-operative nausea is common after cholecystectomy.',
      },
      {
        name: 'Acetaminophen',
        dosage: '1000mg',
        frequency: 'Every 6 hours',
        category: 'analgesic',
        durationDays: 10,
        instructions: 'Baseline analgesic. Max 3000mg/day.',
      },
      {
        name: 'Ursodiol',
        dosage: '300mg',
        frequency: 'Twice daily',
        category: 'gastrointestinal',
        durationDays: 90,
        instructions: 'If bile reflux or postcholecystectomy diarrhea. Take with meals.',
      },
    ],

    // ---- Hernia Repair (mesh-related, moderate pain management) ----
    [SurgeryType.HERNIA_REPAIR]: [
      {
        name: 'Hydrocodone/Acetaminophen',
        dosage: '5/325mg',
        frequency: 'Every 4-6 hours as needed',
        category: 'analgesic',
        durationDays: 7,
        instructions: 'Short-term use for moderate-severe pain. Transition to OTC analgesics.',
      },
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Three times daily',
        category: 'anti-inflammatory',
        durationDays: 14,
        instructions: 'Take with food. Primary analgesic after opioid taper.',
      },
      {
        name: 'Cephalexin',
        dosage: '500mg',
        frequency: 'Three times daily',
        category: 'antibiotic',
        durationDays: 5,
        instructions: 'Prophylactic coverage for mesh implant. Complete full course.',
      },
      {
        name: 'Docusate Sodium',
        dosage: '100mg',
        frequency: 'Twice daily',
        category: 'gastrointestinal',
        durationDays: 14,
        instructions: 'Stool softener. Prevent straining that could stress repair site.',
      },
      {
        name: 'Acetaminophen',
        dosage: '500mg',
        frequency: 'Every 6 hours as needed',
        category: 'analgesic',
        durationDays: 14,
        instructions: 'Alternate with ibuprofen. Max 3000mg/day.',
      },
    ],

    // ---- Cardiac Bypass / CABG (per ACC/AHA guidelines) ----
    // Dual antiplatelet, high-intensity statin, beta-blocker, ACE-I, diuretic
    [SurgeryType.CARDIAC_BYPASS]: [
      {
        name: 'Aspirin',
        dosage: '81mg',
        frequency: 'Once daily',
        category: 'anticoagulant',
        durationDays: 365,
        instructions: 'Lifelong antiplatelet therapy. Take with food. Do not discontinue without cardiology approval.',
      },
      {
        name: 'Metoprolol Succinate',
        dosage: '25mg titrating to 100mg',
        frequency: 'Once daily',
        category: 'cardiac',
        durationDays: 365,
        instructions: 'Beta-blocker for rate control and cardiac protection. Do not stop abruptly.',
      },
      {
        name: 'Lisinopril',
        dosage: '5mg titrating to 20mg',
        frequency: 'Once daily',
        category: 'cardiac',
        durationDays: 365,
        instructions: 'ACE inhibitor for cardiac remodeling. Monitor for cough and hyperkalemia.',
      },
      {
        name: 'Atorvastatin',
        dosage: '80mg',
        frequency: 'Once daily at bedtime',
        category: 'cardiac',
        durationDays: 365,
        instructions: 'High-intensity statin therapy per ACC/AHA guidelines. Take in the evening.',
      },
      {
        name: 'Warfarin',
        dosage: '5mg (adjust per INR)',
        frequency: 'Once daily',
        category: 'anticoagulant',
        durationDays: 90,
        instructions: 'Target INR 2.0-3.0. Weekly INR monitoring required. Many drug/food interactions.',
      },
      {
        name: 'Furosemide',
        dosage: '20mg',
        frequency: 'Once daily in the morning',
        category: 'cardiac',
        durationDays: 30,
        instructions: 'Loop diuretic for post-operative fluid management. Monitor potassium.',
      },
      {
        name: 'Oxycodone',
        dosage: '5mg',
        frequency: 'Every 4-6 hours as needed',
        category: 'analgesic',
        durationDays: 10,
        instructions: 'For sternal wound pain. Use sparingly. Transition to acetaminophen.',
      },
    ],

    // ---- Cesarean Section (breastfeeding-safe, uterotonic support) ----
    [SurgeryType.CESAREAN_SECTION]: [
      {
        name: 'Ibuprofen',
        dosage: '600mg',
        frequency: 'Every 6 hours',
        category: 'anti-inflammatory',
        durationDays: 10,
        instructions: 'First-line analgesic. Safe during breastfeeding. Take with food.',
      },
      {
        name: 'Acetaminophen',
        dosage: '1000mg',
        frequency: 'Every 6 hours (alternating with ibuprofen)',
        category: 'analgesic',
        durationDays: 10,
        instructions: 'Alternate with ibuprofen every 3 hours. Safe during breastfeeding. Max 3000mg/day.',
      },
      {
        name: 'Oxycodone',
        dosage: '5mg',
        frequency: 'Every 4-6 hours as needed for breakthrough pain',
        category: 'analgesic',
        durationDays: 5,
        instructions: 'Use only if ibuprofen/acetaminophen insufficient. Minimal transfer to breast milk at low doses.',
      },
      {
        name: 'Cefazolin IV then Cephalexin PO',
        dosage: '2g IV / 500mg PO',
        frequency: 'Three times daily (PO phase)',
        category: 'antibiotic',
        durationDays: 5,
        instructions: 'IV single dose pre-incision, then PO if risk factors present.',
      },
      {
        name: 'Enoxaparin',
        dosage: '40mg subcutaneous',
        frequency: 'Once daily',
        category: 'anticoagulant',
        durationDays: 7,
        instructions: 'VTE prophylaxis if high-risk (BMI >40, prior DVT, thrombophilia). Assess risk.',
      },
      {
        name: 'Docusate Sodium',
        dosage: '100mg',
        frequency: 'Twice daily',
        category: 'gastrointestinal',
        durationDays: 14,
        instructions: 'Stool softener to prevent straining on incision. Safe during breastfeeding.',
      },
    ],
  };

  return medicationsByType[surgeryType] ?? [];
}

// ============================================================================
// Section 10: Care Plan Generation
// ============================================================================

/**
 * Generate individualized care plans for each patient.
 *
 * Each care plan includes:
 * - Plan name and description tailored to surgery type
 * - Scheduled missions (photo uploads, medication checks, exercise logs)
 * - Medication prescriptions based on surgery type
 * - Status derived from patient recovery progress
 *
 * @param patients Array of patient records
 * @param doctors  Array of doctor records
 * @returns Array of CarePlanModel objects
 */
export function generateCarePlans(
  patients: PatientRecord[],
  doctors: UserModel[],
): CarePlanModel[] {
  const mappings = generatePatientDoctorMappings(patients, doctors);
  const now = new Date();
  const plans: CarePlanModel[] = [];

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const mapping = mappings[i];
    const medications = generateRealisticMedications(patient.surgeryType);
    const baselineDays = BASELINE_RECOVERY_DAYS[patient.surgeryType];

    // Plan start date = today minus daysSinceSurgery
    const planStart = new Date(now);
    planStart.setDate(planStart.getDate() - patient.daysSinceSurgery);
    const planStartStr = planStart.toISOString();

    // Surgery-specific plan names
    const surgeryLabels: Record<SurgeryType, string> = {
      [SurgeryType.KNEE_REPLACEMENT]: 'Total Knee Replacement Recovery',
      [SurgeryType.HIP_REPLACEMENT]: 'Total Hip Replacement Recovery',
      [SurgeryType.ACL_RECONSTRUCTION]: 'ACL Reconstruction Rehabilitation',
      [SurgeryType.ROTATOR_CUFF_REPAIR]: 'Rotator Cuff Repair Recovery',
      [SurgeryType.SPINAL_FUSION]: 'Spinal Fusion Recovery Program',
      [SurgeryType.APPENDECTOMY]: 'Post-Appendectomy Recovery',
      [SurgeryType.CHOLECYSTECTOMY]: 'Post-Cholecystectomy Recovery',
      [SurgeryType.HERNIA_REPAIR]: 'Hernia Repair Recovery',
      [SurgeryType.CARDIAC_BYPASS]: 'Cardiac Rehabilitation Program',
      [SurgeryType.CESAREAN_SECTION]: 'Post-Cesarean Recovery Plan',
    };

    // Surgery-specific plan descriptions
    const surgeryDescriptions: Record<SurgeryType, string> = {
      [SurgeryType.KNEE_REPLACEMENT]: 'Comprehensive recovery plan including pain management, DVT prophylaxis, and progressive physical therapy to restore range of motion and strength.',
      [SurgeryType.HIP_REPLACEMENT]: 'Structured recovery with hip precautions, anticoagulation therapy, and graduated weight-bearing exercises.',
      [SurgeryType.ACL_RECONSTRUCTION]: 'Phased rehabilitation protocol focusing on graft protection, quadriceps activation, and progressive return to sport.',
      [SurgeryType.ROTATOR_CUFF_REPAIR]: 'Sling immobilization protocol followed by passive then active range of motion exercises and rotator cuff strengthening.',
      [SurgeryType.SPINAL_FUSION]: 'Extended recovery with spinal precautions, neuropathic pain management, and core stabilization program.',
      [SurgeryType.APPENDECTOMY]: 'Straightforward recovery with wound care monitoring, antibiotic completion, and gradual activity resumption.',
      [SurgeryType.CHOLECYSTECTOMY]: 'Post-laparoscopic recovery with dietary modifications, wound care, and progressive return to normal activities.',
      [SurgeryType.HERNIA_REPAIR]: 'Mesh repair recovery with lifting restrictions, wound monitoring, and gradual return to full activity.',
      [SurgeryType.CARDIAC_BYPASS]: 'Cardiac rehabilitation program with medication titration, sternal precautions, monitored exercise progression, and lifestyle modification.',
      [SurgeryType.CESAREAN_SECTION]: 'Post-operative recovery with incision care, breastfeeding support, and gradual return to activity with core rehabilitation.',
    };

    // Determine plan status based on recovery progress
    let status: CarePlanModel['status'] = CarePlanStatus.ACTIVE;
    if (patient.daysSinceSurgery > baselineDays * 1.2) {
      status = CarePlanStatus.COMPLETED;
    }

    // Generate care plan missions (3 per patient: photo, med check, exercise)
    const missions: CarePlanModel['missions'] = [
      {
        id: `mission-${patient.id}-photo`,
        carePlanId: `plan-${patient.id}`,
        type: MissionType.PHOTO_UPLOAD,
        title: 'Wound Photo Upload',
        description: 'Take a clear photo of your surgical incision site for triage review.',
        schedule: {
          startDate: planStartStr,
          recurrence: { type: 'daily' as const },
        },
        status: CarePlanMissionStatus.ACTIVE,
        createdAt: planStartStr,
      },
      {
        id: `mission-${patient.id}-med`,
        carePlanId: `plan-${patient.id}`,
        type: MissionType.MEDICATION_CHECK,
        title: 'Medication Confirmation',
        description: 'Confirm you have taken all prescribed medications for today.',
        schedule: {
          startDate: planStartStr,
          recurrence: { type: 'daily' as const },
        },
        status: CarePlanMissionStatus.ACTIVE,
        createdAt: planStartStr,
      },
      {
        id: `mission-${patient.id}-exercise`,
        carePlanId: `plan-${patient.id}`,
        type: MissionType.EXERCISE_LOG,
        title: 'Physical Therapy & Exercise Log',
        description: 'Log your physical therapy exercises and activity for today.',
        schedule: {
          startDate: planStartStr,
          recurrence: { type: 'daily' as const },
        },
        status: CarePlanMissionStatus.ACTIVE,
        createdAt: planStartStr,
      },
    ];

    // Convert realistic medications into CarePlanModel medication prescriptions
    const medicationPrescriptions: CarePlanModel['medications'] = medications.map((med, medIdx) => {
      const medStart = new Date(planStart);
      const medEnd = new Date(planStart);
      medEnd.setDate(medEnd.getDate() + med.durationDays);

      // Parse frequency string to timesPerDay
      let timesPerDay = 1;
      const freqLower = med.frequency.toLowerCase();
      if (freqLower.includes('four times') || freqLower.includes('4 times')) timesPerDay = 4;
      else if (freqLower.includes('three times') || freqLower.includes('3 times')) timesPerDay = 3;
      else if (freqLower.includes('twice') || freqLower.includes('2 times')) timesPerDay = 2;
      else if (freqLower.includes('every 4') || freqLower.includes('every 4-6')) timesPerDay = 4;
      else if (freqLower.includes('every 6')) timesPerDay = 4;
      else if (freqLower.includes('every 8')) timesPerDay = 3;
      else if (freqLower.includes('every 12')) timesPerDay = 2;

      return {
        id: `med-${patient.id}-${medIdx}`,
        carePlanId: `plan-${patient.id}`,
        medicationName: med.name,
        dosage: med.dosage,
        frequency: {
          timesPerDay,
        },
        duration: med.durationDays,
        refillThreshold: Math.max(5, Math.floor(med.durationDays * timesPerDay * 0.15)),
        instructions: med.instructions,
        startDate: medStart.toISOString(),
        endDate: medEnd.toISOString(),
        status: MedicationStatus.ACTIVE,
        createdAt: planStartStr,
      };
    });

    plans.push({
      id: `plan-${patient.id}`,
      patientId: patient.id,
      doctorId: mapping.doctorId,
      name: surgeryLabels[patient.surgeryType],
      description: surgeryDescriptions[patient.surgeryType],
      createdAt: planStartStr,
      updatedAt: now.toISOString(),
      status,
      missions,
      medications: medicationPrescriptions,
    });
  }

  return plans;
}

// ============================================================================
// Section 11: Convenience - Full Test Dataset
// ============================================================================

/**
 * Generate a complete, self-consistent test dataset in one call.
 * Useful for integration tests that need all data types together.
 *
 * Returns:
 * - 50 patients (8 critical + 42 procedurally generated)
 * - 3 specialist doctors
 * - Patient-doctor mappings (surgery-type based)
 * - 50 individualized care plans
 * - Vital sign readings for all patients (critical patients have complications)
 * - Medication regimens per surgery type
 * - Indices and descriptions of critical patients for test assertions
 */
export function generateFullTestDataset(seed: number = 42) {
  const patients = generateRealisticPatients(50, seed);
  const doctors = generateDoctors();
  const mappings = generatePatientDoctorMappings(patients, doctors);
  const carePlans = generateCarePlans(patients, doctors);

  // Generate vitals for each patient
  const allVitals: Record<string, VitalReading[]> = {};
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    // Critical patients (indices 0-7) have active complications
    const hasComplications = i < CRITICAL_PATIENTS.length;
    allVitals[p.id] = generateRealisticVitals(
      p.id,
      p.daysSinceSurgery,
      hasComplications,
      seed + i,
    );
  }

  // Generate medications indexed by surgery type
  const allMedications: Record<string, MedicationEntry[]> = {};
  for (const st of SURGERY_TYPES_LIST) {
    allMedications[st] = generateRealisticMedications(st);
  }

  return {
    patients,
    doctors,
    mappings,
    carePlans,
    allVitals,
    allMedications,
    criticalPatientIndices: Array.from({ length: CRITICAL_PATIENTS.length }, (_, i) => i),
    criticalPatientDescriptions: CRITICAL_PATIENTS.map(cp => cp.description),
  };
}
