/**
 * Staff Workload Balancer
 *
 * Real nursing workload and staffing optimization:
 * - Patient acuity scoring (real nursing acuity scales)
 * - Nurse-to-patient ratio optimization
 * - Workload calculation: direct care + indirect care + documentation
 * - Skill-mix requirements (RN, LPN, CNA, specialist)
 * - Assignment optimization (minimize handoffs, consider continuity)
 * - Overtime prediction
 * - Burnout risk indicators
 * - Shift scheduling with constraint satisfaction
 * - 50+ staff profiles with skills and availability
 * - Self-learning: adjusts acuity scores based on actual care time
 *
 * No external dependencies.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const StaffRole = {
  RN: 'rn',
  LPN: 'lpn',
  CNA: 'cna',
  CHARGE_RN: 'charge_rn',
  NP: 'nurse_practitioner',
  SPECIALIST: 'specialist',
} as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const ShiftType = {
  DAY: 'day',
  EVENING: 'evening',
  NIGHT: 'night',
} as const;
export type ShiftType = (typeof ShiftType)[keyof typeof ShiftType];

export const AcuityLevel = {
  MINIMAL: 1,
  LOW: 2,
  MODERATE: 3,
  HIGH: 4,
  INTENSIVE: 5,
} as const;
export type AcuityLevel = (typeof AcuityLevel)[keyof typeof AcuityLevel];

export const SkillCategory = {
  CRITICAL_CARE: 'critical_care',
  CARDIAC_MONITORING: 'cardiac_monitoring',
  VENTILATOR: 'ventilator',
  WOUND_CARE: 'wound_care',
  IV_THERAPY: 'iv_therapy',
  CHEMOTHERAPY: 'chemotherapy',
  DIALYSIS: 'dialysis',
  PEDIATRIC: 'pediatric',
  SURGICAL: 'surgical',
  ORTHOPEDIC: 'orthopedic',
  STROKE: 'stroke',
  ISOLATION: 'isolation',
  PAIN_MANAGEMENT: 'pain_management',
  TRACHEOSTOMY: 'tracheostomy',
} as const;
export type SkillCategory = (typeof SkillCategory)[keyof typeof SkillCategory];

export const BurnoutRisk = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type BurnoutRisk = (typeof BurnoutRisk)[keyof typeof BurnoutRisk];

export const UnitType = {
  ICU: 'icu',
  STEP_DOWN: 'step_down',
  MED_SURG: 'med_surg',
  REHAB: 'rehab',
  ED: 'ed',
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

// ============================================================================
// Interfaces
// ============================================================================

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  unit: UnitType;
  skills: SkillCategory[];
  yearsExperience: number;
  certification: string[];
  availability: ShiftType[];
  maxPatientsPerShift: number;
  consecutiveShifts: number;
  totalHoursThisWeek: number;
  totalHoursThisMonth: number;
  preferredPatientTypes?: string[];
  floatPoolEligible: boolean;
}

export interface PatientAcuity {
  patientId: string;
  acuityLevel: AcuityLevel;
  acuityScore: number;
  components: AcuityComponent[];
  requiredSkills: SkillCategory[];
  estimatedCareHours: number;
  directCareMinutes: number;
  indirectCareMinutes: number;
  documentationMinutes: number;
  specialRequirements: string[];
}

export interface AcuityComponent {
  category: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface StaffAssignment {
  staffId: string;
  staffName: string;
  role: StaffRole;
  patients: string[];
  totalAcuityScore: number;
  totalCareHours: number;
  shift: ShiftType;
  unit: UnitType;
  workloadPercentage: number;
  continuityBonus: boolean;
}

export interface WorkloadReport {
  shift: ShiftType;
  unit: UnitType;
  totalPatients: number;
  totalStaff: number;
  ratioRNToPatient: string;
  avgWorkloadPercentage: number;
  maxWorkloadPercentage: number;
  minWorkloadPercentage: number;
  overloadedStaff: string[];
  understaffedAreas: string[];
  recommendations: string[];
}

export interface OvertimePrediction {
  staffId: string;
  staffName: string;
  currentHoursThisWeek: number;
  projectedHoursThisWeek: number;
  overtimeHours: number;
  overtimeLikelihood: number;
  costImpact: number;
  recommendation: string;
}

export interface BurnoutAssessment {
  staffId: string;
  staffName: string;
  riskLevel: BurnoutRisk;
  riskScore: number;
  factors: { factor: string; score: number; weight: number }[];
  consecutiveShifts: number;
  weeklyHours: number;
  monthlyHours: number;
  recommendations: string[];
}

export interface SchedulingConstraint {
  type: 'min_rest' | 'max_consecutive' | 'max_weekly' | 'skill_required' | 'ratio';
  value: number;
  unit?: string;
  description: string;
}

export interface ShiftSchedule {
  shift: ShiftType;
  date: string;
  unit: UnitType;
  assignments: StaffAssignment[];
  constraintViolations: { constraint: string; severity: 'warning' | 'violation' }[];
  coverageScore: number;
}

// ============================================================================
// Acuity Scoring (Real Nursing Acuity Scales)
// ============================================================================

interface AcuityInput {
  patientId: string;
  // Assessment categories (1-4 scale each)
  respiratoryStatus: number;    // 1=room air, 2=nasal cannula, 3=high-flow/BiPAP, 4=ventilator
  hemodynamicStatus: number;    // 1=stable, 2=intermittent monitoring, 3=continuous/pressors, 4=unstable
  neurologicalStatus: number;   // 1=alert/oriented, 2=confused, 3=agitated/sedated, 4=unresponsive
  mobilityStatus: number;       // 1=independent, 2=assisted, 3=dependent, 4=bedbound/immobile
  nutritionStatus: number;      // 1=self-feeding, 2=setup needed, 3=assistance, 4=TPN/tube feeds
  woundCare: number;           // 1=none, 2=simple, 3=complex, 4=multiple/drains
  ivMedications: number;       // 1=none/oral only, 2=intermittent IV, 3=multiple IV, 4=continuous drips
  psychosocial: number;        // 1=stable, 2=mild anxiety, 3=high family needs, 4=behavioral
  educationNeeds: number;      // 1=minimal, 2=moderate, 3=extensive, 4=new diagnosis/complex
  dischargePlanning: number;   // 1=simple, 2=moderate, 3=complex, 4=SNF/rehab placement
  requiredSkills?: SkillCategory[];
  specialRequirements?: string[];
}

function calculatePatientAcuity(input: AcuityInput): PatientAcuity {
  const components: AcuityComponent[] = [
    { category: 'Respiratory', score: input.respiratoryStatus, maxScore: 4, description: getRespiratoryDescription(input.respiratoryStatus) },
    { category: 'Hemodynamic', score: input.hemodynamicStatus, maxScore: 4, description: getHemodynamicDescription(input.hemodynamicStatus) },
    { category: 'Neurological', score: input.neurologicalStatus, maxScore: 4, description: getNeurologicalDescription(input.neurologicalStatus) },
    { category: 'Mobility', score: input.mobilityStatus, maxScore: 4, description: getMobilityDescription(input.mobilityStatus) },
    { category: 'Nutrition', score: input.nutritionStatus, maxScore: 4, description: getNutritionDescription(input.nutritionStatus) },
    { category: 'Wound Care', score: input.woundCare, maxScore: 4, description: getWoundDescription(input.woundCare) },
    { category: 'IV/Medications', score: input.ivMedications, maxScore: 4, description: getIVDescription(input.ivMedications) },
    { category: 'Psychosocial', score: input.psychosocial, maxScore: 4, description: getPsychosocialDescription(input.psychosocial) },
    { category: 'Education', score: input.educationNeeds, maxScore: 4, description: getEducationDescription(input.educationNeeds) },
    { category: 'Discharge Planning', score: input.dischargePlanning, maxScore: 4, description: getDischargeDescription(input.dischargePlanning) },
  ];

  const totalScore = components.reduce((sum, c) => sum + c.score, 0);
  const maxPossible = components.reduce((sum, c) => sum + c.maxScore, 0);
  const normalizedScore = Math.round((totalScore / maxPossible) * 100);

  let acuityLevel: AcuityLevel;
  if (normalizedScore >= 80) acuityLevel = 5;
  else if (normalizedScore >= 60) acuityLevel = 4;
  else if (normalizedScore >= 40) acuityLevel = 3;
  else if (normalizedScore >= 25) acuityLevel = 2;
  else acuityLevel = 1;

  // Care time estimation based on acuity
  const directCareMinutes = calculateDirectCareTime(acuityLevel, components);
  const indirectCareMinutes = Math.round(directCareMinutes * 0.35);
  const documentationMinutes = Math.round(directCareMinutes * 0.25);
  const totalMinutes = directCareMinutes + indirectCareMinutes + documentationMinutes;

  return {
    patientId: input.patientId,
    acuityLevel,
    acuityScore: normalizedScore,
    components,
    requiredSkills: input.requiredSkills ?? [],
    estimatedCareHours: Math.round((totalMinutes / 60) * 10) / 10,
    directCareMinutes,
    indirectCareMinutes,
    documentationMinutes,
    specialRequirements: input.specialRequirements ?? [],
  };
}

function calculateDirectCareTime(acuity: AcuityLevel, components: AcuityComponent[]): number {
  // Base minutes per 12-hour shift by acuity level
  const baseTimes: Record<number, number> = { 1: 120, 2: 180, 3: 240, 4: 360, 5: 480 };
  let minutes = baseTimes[acuity] ?? 240;

  // Add time for specific high-scoring components
  for (const c of components) {
    if (c.score >= 4) {
      switch (c.category) {
        case 'Respiratory': minutes += 60; break;
        case 'Wound Care': minutes += 45; break;
        case 'IV/Medications': minutes += 30; break;
        case 'Psychosocial': minutes += 20; break;
        default: minutes += 15;
      }
    }
  }

  return minutes;
}

function getRespiratoryDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Room air, stable O2', 2: 'Nasal cannula ≤4L', 3: 'High-flow/BiPAP/CPAP', 4: 'Ventilator dependent' };
  return descs[score] ?? 'Unknown';
}
function getHemodynamicDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Stable vital signs', 2: 'Intermittent monitoring', 3: 'Continuous monitoring/vasopressors', 4: 'Hemodynamically unstable' };
  return descs[score] ?? 'Unknown';
}
function getNeurologicalDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Alert and oriented', 2: 'Confused/reorientation needed', 3: 'Agitated/requiring sedation', 4: 'Unresponsive/GCS <8' };
  return descs[score] ?? 'Unknown';
}
function getMobilityDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Independent', 2: 'Standby/minimal assist', 3: '1-2 person assist', 4: 'Bedbound/total care' };
  return descs[score] ?? 'Unknown';
}
function getNutritionDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Self-feeding, regular diet', 2: 'Setup/supervision needed', 3: 'Feeding assistance required', 4: 'TPN/tube feeds/NPO' };
  return descs[score] ?? 'Unknown';
}
function getWoundDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'No wound care needed', 2: 'Simple dressing changes', 3: 'Complex wound care/VAC', 4: 'Multiple wounds/drains/ostomy' };
  return descs[score] ?? 'Unknown';
}
function getIVDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Oral medications only', 2: 'Intermittent IV medications', 3: 'Multiple IV medications', 4: 'Continuous drips/TPN/blood products' };
  return descs[score] ?? 'Unknown';
}
function getPsychosocialDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Stable/coping well', 2: 'Mild anxiety/concerns', 3: 'High family involvement needs', 4: 'Behavioral issues/safety concerns' };
  return descs[score] ?? 'Unknown';
}
function getEducationDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Minimal education needs', 2: 'Standard education plan', 3: 'Extensive teaching required', 4: 'New diagnosis/complex discharge teaching' };
  return descs[score] ?? 'Unknown';
}
function getDischargeDescription(score: number): string {
  const descs: Record<number, string> = { 1: 'Simple home discharge', 2: 'Home with services', 3: 'Complex placement needed', 4: 'SNF/rehab placement/transfer' };
  return descs[score] ?? 'Unknown';
}

// ============================================================================
// Staffing Ratios (Real Standards)
// ============================================================================

const STAFFING_RATIOS: Record<string, { maxPatientsRN: number; maxPatientsLPN: number; maxPatientsCNA: number }> = {
  [UnitType.ICU]: { maxPatientsRN: 2, maxPatientsLPN: 0, maxPatientsCNA: 4 },
  [UnitType.STEP_DOWN]: { maxPatientsRN: 3, maxPatientsLPN: 0, maxPatientsCNA: 6 },
  [UnitType.MED_SURG]: { maxPatientsRN: 5, maxPatientsLPN: 6, maxPatientsCNA: 10 },
  [UnitType.REHAB]: { maxPatientsRN: 6, maxPatientsLPN: 8, maxPatientsCNA: 8 },
  [UnitType.ED]: { maxPatientsRN: 4, maxPatientsLPN: 0, maxPatientsCNA: 6 },
};

// ============================================================================
// Synthetic Staff Profiles (50+ staff)
// ============================================================================

function generateStaffProfiles(): StaffMember[] {
  const profiles: StaffMember[] = [];
  const firstNames = ['Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'James', 'Emily', 'Robert', 'Amanda', 'Thomas', 'Jessica', 'William', 'Maria', 'John', 'Nicole', 'Daniel', 'Ashley', 'Christopher', 'Stephanie', 'Matthew', 'Rachel', 'Andrew', 'Laura', 'Kevin', 'Megan'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'King'];
  const allSkills = Object.values(SkillCategory);
  const units = Object.values(UnitType);

  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed + 42) * 10000;
    return x - Math.floor(x);
  };

  // Generate 52 staff members
  for (let i = 0; i < 52; i++) {
    const r1 = seededRandom(i);
    const r2 = seededRandom(i + 100);
    const r3 = seededRandom(i + 200);

    let role: StaffRole;
    if (i < 30) role = StaffRole.RN;
    else if (i < 38) role = StaffRole.LPN;
    else if (i < 46) role = StaffRole.CNA;
    else if (i < 50) role = StaffRole.CHARGE_RN;
    else role = StaffRole.NP;

    const yearsExp = Math.floor(r1 * 20) + 1;
    const numSkills = Math.min(allSkills.length, 2 + Math.floor(r2 * 4));
    const skills: SkillCategory[] = [];
    for (let s = 0; s < numSkills; s++) {
      const skill = allSkills[Math.floor(seededRandom(i * 10 + s) * allSkills.length)];
      if (!skills.includes(skill)) skills.push(skill);
    }

    const unitIndex = Math.floor(r3 * units.length);
    const unit = units[unitIndex];
    const shifts: ShiftType[] = [];
    if (seededRandom(i + 300) > 0.2) shifts.push(ShiftType.DAY);
    if (seededRandom(i + 400) > 0.4) shifts.push(ShiftType.EVENING);
    if (seededRandom(i + 500) > 0.6) shifts.push(ShiftType.NIGHT);
    if (shifts.length === 0) shifts.push(ShiftType.DAY);

    const maxPatients = role === StaffRole.RN ? STAFFING_RATIOS[unit]?.maxPatientsRN ?? 5
      : role === StaffRole.LPN ? STAFFING_RATIOS[unit]?.maxPatientsLPN ?? 6
      : role === StaffRole.CNA ? STAFFING_RATIOS[unit]?.maxPatientsCNA ?? 10
      : role === StaffRole.CHARGE_RN ? 2
      : 8;

    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / 2) % lastNames.length];

    const certs: string[] = [];
    if (role === StaffRole.RN || role === StaffRole.CHARGE_RN) certs.push('BSN');
    if (yearsExp > 5 && skills.includes(SkillCategory.CRITICAL_CARE)) certs.push('CCRN');
    if (yearsExp > 3) certs.push('BLS', 'ACLS');
    if (role === StaffRole.NP) certs.push('MSN', 'ACNP-BC');

    profiles.push({
      id: `staff-${String(i + 1).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      role,
      unit,
      skills,
      yearsExperience: yearsExp,
      certification: certs,
      availability: shifts,
      maxPatientsPerShift: maxPatients,
      consecutiveShifts: Math.floor(seededRandom(i + 600) * 4),
      totalHoursThisWeek: Math.round(seededRandom(i + 700) * 36),
      totalHoursThisMonth: Math.round(seededRandom(i + 800) * 144),
      floatPoolEligible: seededRandom(i + 900) > 0.6,
    });
  }

  return profiles;
}

export const STAFF_PROFILES = generateStaffProfiles();

// ============================================================================
// State
// ============================================================================

interface WorkloadState {
  currentAssignments: StaffAssignment[];
  acuityCareTimeHistory: Map<string, { predicted: number; actual: number }[]>;
}

const workloadState: WorkloadState = {
  currentAssignments: [],
  acuityCareTimeHistory: new Map(),
};

// ============================================================================
// Core Functions
// ============================================================================

function optimizeAssignments(
  staff: StaffMember[],
  patients: PatientAcuity[],
  shift: ShiftType,
  unit: UnitType,
  previousAssignments?: StaffAssignment[]
): StaffAssignment[] {
  // Filter staff available for this shift and unit
  const availableStaff = staff.filter(s =>
    s.availability.includes(shift) &&
    (s.unit === unit || s.floatPoolEligible) &&
    s.role !== StaffRole.SPECIALIST
  );

  const assignments: StaffAssignment[] = [];

  // Sort patients by acuity (highest first)
  const sortedPatients = [...patients].sort((a, b) => b.acuityScore - a.acuityScore);

  // Sort staff by capability (charge nurses and experienced RNs first for high-acuity)
  const sortedStaff = [...availableStaff].sort((a, b) => {
    if (a.role === StaffRole.CHARGE_RN && b.role !== StaffRole.CHARGE_RN) return -1;
    if (b.role === StaffRole.CHARGE_RN && a.role !== StaffRole.CHARGE_RN) return 1;
    if (a.role === StaffRole.RN && b.role !== StaffRole.RN) return -1;
    if (b.role === StaffRole.RN && a.role !== StaffRole.RN) return 1;
    return b.yearsExperience - a.yearsExperience;
  });

  // Initialize assignment for each staff member
  for (const s of sortedStaff) {
    assignments.push({
      staffId: s.id,
      staffName: s.name,
      role: s.role,
      patients: [],
      totalAcuityScore: 0,
      totalCareHours: 0,
      shift,
      unit,
      workloadPercentage: 0,
      continuityBonus: false,
    });
  }

  // Assign patients using load-balancing algorithm
  for (const patient of sortedPatients) {
    // Check for continuity (was this patient assigned to same staff yesterday?)
    let continuityAssignment: StaffAssignment | undefined;
    if (previousAssignments) {
      const prevAssign = previousAssignments.find(a => a.patients.includes(patient.patientId));
      if (prevAssign) {
        continuityAssignment = assignments.find(a =>
          a.staffId === prevAssign.staffId &&
          a.patients.length < (sortedStaff.find(s => s.id === a.staffId)?.maxPatientsPerShift ?? 5)
        );
      }
    }

    if (continuityAssignment) {
      continuityAssignment.patients.push(patient.patientId);
      continuityAssignment.totalAcuityScore += patient.acuityScore;
      continuityAssignment.totalCareHours += patient.estimatedCareHours;
      continuityAssignment.continuityBonus = true;
      continue;
    }

    // Find best assignment considering skill match and workload balance
    let bestAssignment: StaffAssignment | undefined;
    let bestScore = -1;

    for (const assignment of assignments) {
      const staffMember = sortedStaff.find(s => s.id === assignment.staffId);
      if (!staffMember) continue;

      // Check capacity
      if (assignment.patients.length >= staffMember.maxPatientsPerShift) continue;

      // Check role compatibility
      if (patient.acuityLevel >= 4 && staffMember.role === StaffRole.CNA) continue;
      if (patient.acuityLevel >= 4 && staffMember.role === StaffRole.LPN) continue;

      // Score this assignment
      let score = 100;

      // Skill match bonus
      const matchedSkills = patient.requiredSkills.filter(s => staffMember.skills.includes(s)).length;
      score += matchedSkills * 20;

      // Workload balance (prefer less loaded staff)
      score -= assignment.totalAcuityScore * 2;
      score -= assignment.patients.length * 15;

      // Experience bonus for high-acuity
      if (patient.acuityLevel >= 4) {
        score += staffMember.yearsExperience * 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAssignment = assignment;
      }
    }

    if (bestAssignment) {
      bestAssignment.patients.push(patient.patientId);
      bestAssignment.totalAcuityScore += patient.acuityScore;
      bestAssignment.totalCareHours += patient.estimatedCareHours;
    }
  }

  // Calculate workload percentages (12-hour shift = 720 minutes)
  const shiftMinutes = 720;
  for (const assignment of assignments) {
    const totalCareMinutes = assignment.totalCareHours * 60;
    assignment.workloadPercentage = Math.round((totalCareMinutes / shiftMinutes) * 100);
  }

  workloadState.currentAssignments = assignments;
  return assignments;
}

function generateWorkloadReport(assignments: StaffAssignment[], shift: ShiftType, unit: UnitType): WorkloadReport {
  const totalPatients = assignments.reduce((sum, a) => sum + a.patients.length, 0);
  const totalStaff = assignments.filter(a => a.patients.length > 0).length;
  const rnCount = assignments.filter(a => (a.role === StaffRole.RN || a.role === StaffRole.CHARGE_RN) && a.patients.length > 0).length;
  const workloads = assignments.filter(a => a.patients.length > 0).map(a => a.workloadPercentage);

  const avgWorkload = workloads.length > 0 ? Math.round(workloads.reduce((a, b) => a + b, 0) / workloads.length) : 0;
  const maxWorkload = workloads.length > 0 ? Math.max(...workloads) : 0;
  const minWorkload = workloads.length > 0 ? Math.min(...workloads) : 0;

  const overloaded = assignments.filter(a => a.workloadPercentage > 90).map(a => a.staffName);

  const ratios = STAFFING_RATIOS[unit];
  const understaffed: string[] = [];
  if (ratios && rnCount > 0 && totalPatients / rnCount > ratios.maxPatientsRN) {
    understaffed.push(`RN ratio exceeds ${ratios.maxPatientsRN}:1 standard`);
  }

  const recommendations: string[] = [];
  if (maxWorkload > 100) {
    recommendations.push(`${overloaded.length} staff member(s) overloaded. Consider redistributing patients.`);
  }
  if (maxWorkload - minWorkload > 40) {
    recommendations.push('Significant workload imbalance detected. Rebalance patient assignments.');
  }
  if (overloaded.length > 0) {
    recommendations.push(`Prioritize support for: ${overloaded.join(', ')}`);
  }
  if (totalStaff < totalPatients / (ratios?.maxPatientsRN ?? 5)) {
    recommendations.push('Staffing below minimum ratio requirements. Request additional staff.');
  }

  return {
    shift,
    unit,
    totalPatients,
    totalStaff,
    ratioRNToPatient: `1:${rnCount > 0 ? (totalPatients / rnCount).toFixed(1) : 'N/A'}`,
    avgWorkloadPercentage: avgWorkload,
    maxWorkloadPercentage: maxWorkload,
    minWorkloadPercentage: minWorkload,
    overloadedStaff: overloaded,
    understaffedAreas: understaffed,
    recommendations,
  };
}

function predictOvertime(staff: StaffMember[], scheduledShiftsRemaining: number = 3): OvertimePrediction[] {
  const predictions: OvertimePrediction[] = [];
  const maxWeeklyHours = 40;
  const overtimeRate = 1.5;
  const baseHourlyRate = 35;

  for (const member of staff) {
    const hoursPerShift = 12;
    const projectedHours = member.totalHoursThisWeek + (scheduledShiftsRemaining * hoursPerShift);
    const overtimeHours = Math.max(0, projectedHours - maxWeeklyHours);
    const likelihood = overtimeHours > 0 ? Math.min(1, overtimeHours / 20) : 0;
    const costImpact = overtimeHours * baseHourlyRate * overtimeRate;

    let recommendation = '';
    if (overtimeHours > 12) {
      recommendation = 'High overtime risk. Consider finding replacement or redistributing shifts.';
    } else if (overtimeHours > 4) {
      recommendation = 'Moderate overtime expected. Monitor and adjust if possible.';
    } else if (overtimeHours > 0) {
      recommendation = 'Minor overtime possible. May be acceptable.';
    } else {
      recommendation = 'No overtime projected.';
    }

    predictions.push({
      staffId: member.id,
      staffName: member.name,
      currentHoursThisWeek: member.totalHoursThisWeek,
      projectedHoursThisWeek: Math.round(projectedHours * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      overtimeLikelihood: Math.round(likelihood * 100) / 100,
      costImpact: Math.round(costImpact * 100) / 100,
      recommendation,
    });
  }

  return predictions.sort((a, b) => b.overtimeHours - a.overtimeHours);
}

function assessBurnoutRisk(member: StaffMember): BurnoutAssessment {
  const factors: { factor: string; score: number; weight: number }[] = [];

  // Consecutive shifts factor
  const consecutiveScore = Math.min(member.consecutiveShifts / 6, 1) * 100;
  factors.push({ factor: 'Consecutive shifts', score: Math.round(consecutiveScore), weight: 0.25 });

  // Weekly hours factor
  const weeklyScore = Math.min(member.totalHoursThisWeek / 48, 1) * 100;
  factors.push({ factor: 'Weekly hours', score: Math.round(weeklyScore), weight: 0.25 });

  // Monthly hours factor
  const monthlyScore = Math.min(member.totalHoursThisMonth / 180, 1) * 100;
  factors.push({ factor: 'Monthly hours', score: Math.round(monthlyScore), weight: 0.2 });

  // Assignment workload factor
  const currentAssignment = workloadState.currentAssignments.find(a => a.staffId === member.id);
  const workloadScore = currentAssignment ? Math.min(currentAssignment.workloadPercentage / 100, 1) * 100 : 50;
  factors.push({ factor: 'Current workload', score: Math.round(workloadScore), weight: 0.15 });

  // Experience factor (less experienced = higher burnout risk)
  const experienceScore = Math.max(0, (10 - member.yearsExperience) / 10) * 100;
  factors.push({ factor: 'Experience level', score: Math.round(experienceScore), weight: 0.15 });

  const riskScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);

  let riskLevel: BurnoutRisk;
  if (riskScore >= 75) riskLevel = BurnoutRisk.CRITICAL;
  else if (riskScore >= 55) riskLevel = BurnoutRisk.HIGH;
  else if (riskScore >= 35) riskLevel = BurnoutRisk.MODERATE;
  else riskLevel = BurnoutRisk.LOW;

  const recommendations: string[] = [];
  if (riskLevel === BurnoutRisk.CRITICAL) {
    recommendations.push('Immediate intervention needed: reduce patient load, ensure time off');
    recommendations.push('Schedule mandatory recovery day within 48 hours');
  }
  if (member.consecutiveShifts >= 4) {
    recommendations.push(`${member.consecutiveShifts} consecutive shifts - schedule 2 days off`);
  }
  if (member.totalHoursThisWeek > 48) {
    recommendations.push('Excessive weekly hours - limit additional shifts');
  }
  if (recommendations.length === 0) {
    recommendations.push('Burnout risk within acceptable range');
  }

  return {
    staffId: member.id,
    staffName: member.name,
    riskLevel,
    riskScore: Math.round(riskScore),
    factors,
    consecutiveShifts: member.consecutiveShifts,
    weeklyHours: member.totalHoursThisWeek,
    monthlyHours: member.totalHoursThisMonth,
    recommendations,
  };
}

function createShiftSchedule(
  staff: StaffMember[],
  patients: PatientAcuity[],
  shift: ShiftType,
  unit: UnitType,
  date: string
): ShiftSchedule {
  const assignments = optimizeAssignments(staff, patients, shift, unit);
  const constraintViolations: { constraint: string; severity: 'warning' | 'violation' }[] = [];

  // Check constraints
  const ratios = STAFFING_RATIOS[unit];
  for (const assignment of assignments) {
    const member = staff.find(s => s.id === assignment.staffId);
    if (!member) continue;

    // Max consecutive shifts
    if (member.consecutiveShifts >= 5) {
      constraintViolations.push({
        constraint: `${member.name}: ${member.consecutiveShifts} consecutive shifts (max 5)`,
        severity: 'violation',
      });
    } else if (member.consecutiveShifts >= 3) {
      constraintViolations.push({
        constraint: `${member.name}: ${member.consecutiveShifts} consecutive shifts`,
        severity: 'warning',
      });
    }

    // Max weekly hours
    if (member.totalHoursThisWeek + 12 > 60) {
      constraintViolations.push({
        constraint: `${member.name}: projected ${member.totalHoursThisWeek + 12}h this week (max 60)`,
        severity: 'violation',
      });
    }

    // Patient ratio
    if (ratios && assignment.role === StaffRole.RN && assignment.patients.length > ratios.maxPatientsRN) {
      constraintViolations.push({
        constraint: `${member.name}: ${assignment.patients.length} patients (max ${ratios.maxPatientsRN} for ${unit})`,
        severity: 'violation',
      });
    }
  }

  // Coverage score
  const totalPatients = patients.length;
  const assignedPatients = assignments.reduce((sum, a) => sum + a.patients.length, 0);
  const coverageScore = totalPatients > 0 ? Math.round((assignedPatients / totalPatients) * 100) : 100;

  return {
    shift,
    date,
    unit,
    assignments,
    constraintViolations,
    coverageScore,
  };
}

// ============================================================================
// Self-Learning
// ============================================================================

function recordActualCareTime(acuityLevel: AcuityLevel, predictedHours: number, actualHours: number): void {
  const key = String(acuityLevel);
  const history = workloadState.acuityCareTimeHistory.get(key) ?? [];
  history.push({ predicted: predictedHours, actual: actualHours });
  if (history.length > 100) history.shift();
  workloadState.acuityCareTimeHistory.set(key, history);
}

function getAcuityCalibration(): Map<string, { bias: number; count: number; adjustment: number }> {
  const calibration = new Map<string, { bias: number; count: number; adjustment: number }>();

  for (const [level, history] of workloadState.acuityCareTimeHistory) {
    if (history.length < 5) continue;

    const avgPredicted = history.reduce((sum, h) => sum + h.predicted, 0) / history.length;
    const avgActual = history.reduce((sum, h) => sum + h.actual, 0) / history.length;
    const bias = avgActual - avgPredicted;
    const adjustment = bias * 0.5; // Gradual adjustment

    calibration.set(level, {
      bias: Math.round(bias * 100) / 100,
      count: history.length,
      adjustment: Math.round(adjustment * 100) / 100,
    });
  }

  return calibration;
}

function resetState(): void {
  workloadState.currentAssignments.length = 0;
  workloadState.acuityCareTimeHistory.clear();
}

// ============================================================================
// Exports
// ============================================================================

export const staffWorkloadBalancer = {
  calculatePatientAcuity,
  optimizeAssignments,
  generateWorkloadReport,
  predictOvertime,
  assessBurnoutRisk,
  createShiftSchedule,
  recordActualCareTime,
  getAcuityCalibration,
  generateStaffProfiles,
  resetState,
};
