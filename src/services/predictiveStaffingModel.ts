/**
 * Feature 39: Predictive Staffing Model
 *
 * Patient volume forecasting, acuity-based staffing, seasonal adjustment,
 * skill-mix optimization, budget impact analysis, and self-learning.
 */

// ============================================================================
// Constants
// ============================================================================

export const StaffType = {
  RN: 'registered_nurse',
  LPN: 'licensed_practical_nurse',
  CNA: 'certified_nursing_assistant',
  NP: 'nurse_practitioner',
  PA: 'physician_assistant',
  PT: 'physical_therapist',
  OT: 'occupational_therapist',
  RT: 'respiratory_therapist',
  SW: 'social_worker',
  PHARM: 'pharmacist',
  UNIT_CLERK: 'unit_clerk',
  CHARGE_NURSE: 'charge_nurse',
} as const;
export type StaffType = typeof StaffType[keyof typeof StaffType];

export const ShiftType = {
  DAY: 'day',
  EVENING: 'evening',
  NIGHT: 'night',
} as const;
export type ShiftType = typeof ShiftType[keyof typeof ShiftType];

export const AcuityLevel = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  INTENSIVE: 4,
  CRITICAL: 5,
} as const;
export type AcuityLevel = typeof AcuityLevel[keyof typeof AcuityLevel];

export const UnitType = {
  MED_SURG: 'medical_surgical',
  ORTHO: 'orthopedic',
  CARDIAC: 'cardiac',
  ICU: 'intensive_care',
  STEPDOWN: 'stepdown',
  PACU: 'post_anesthesia_care',
  REHAB: 'rehabilitation',
} as const;
export type UnitType = typeof UnitType[keyof typeof UnitType];

// ============================================================================
// Types
// ============================================================================

export type DailyCensus = {
  date: string;
  dayOfWeek: number;
  month: number;
  census: number;
  admissions: number;
  discharges: number;
  avgAcuity: number;
  scheduledSurgeries: number;
  unitType: UnitType;
  isHoliday: boolean;
  seasonalFactor: number;
};

export type StaffingRequirement = {
  date: string;
  shift: ShiftType;
  unitType: UnitType;
  predictedCensus: number;
  predictedAcuity: number;
  staffNeeds: Record<StaffType, number>;
  totalFTEs: number;
  estimatedCost: number;
  agencyStaffNeeded: number;
  confidence: number;
};

export type SkillMixRecommendation = {
  unitType: UnitType;
  recommendedMix: Record<StaffType, number>;
  currentMix?: Record<StaffType, number>;
  rationale: string;
  costImpact: number;
};

export type BudgetImpact = {
  period: string;
  regularStaffCost: number;
  overtimeCost: number;
  agencyStaffCost: number;
  totalCost: number;
  costPerPatientDay: number;
  projectedSavings: number;
};

export type ForecastResult = {
  date: string;
  predictedCensus: number;
  confidenceInterval: { lower: number; upper: number };
  predictedAcuity: number;
  predictedAdmissions: number;
  predictedDischarges: number;
  factors: string[];
};

export type StaffingOutcome = {
  date: string;
  unitType: UnitType;
  predictedCensus: number;
  actualCensus: number;
  predictedStaff: number;
  actualStaff: number;
  timestamp: string;
};

export type PredictiveStaffingModel = {
  getHistoricalCensus(): DailyCensus[];
  forecastCensus(startDate: string, days: number, unitType: UnitType): ForecastResult[];
  calculateStaffingRequirements(forecast: ForecastResult, unitType: UnitType): StaffingRequirement;
  generateStaffingPlan(startDate: string, days: number, unitType: UnitType): StaffingRequirement[];
  optimizeSkillMix(unitType: UnitType, census: number, acuity: number): SkillMixRecommendation;
  calculateBudgetImpact(staffingPlan: StaffingRequirement[]): BudgetImpact;
  getSeasonalFactors(): Record<number, number>;
  getDayOfWeekFactors(): Record<number, number>;
  predictAgencyNeeds(unitType: UnitType, month: number): number;
  recordStaffingOutcome(outcome: StaffingOutcome): void;
  getForecastAccuracy(): number;
};

// ============================================================================
// Staffing Ratios by Unit Type and Acuity
// ============================================================================

const STAFFING_RATIOS: Record<UnitType, Record<number, Record<StaffType, number>>> = {
  [UnitType.MED_SURG]: {
    1: { [StaffType.RN]: 0.17, [StaffType.LPN]: 0.08, [StaffType.CNA]: 0.13, [StaffType.NP]: 0, [StaffType.PA]: 0, [StaffType.PT]: 0.04, [StaffType.OT]: 0.02, [StaffType.RT]: 0, [StaffType.SW]: 0.02, [StaffType.PHARM]: 0.02, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    2: { [StaffType.RN]: 0.20, [StaffType.LPN]: 0.10, [StaffType.CNA]: 0.15, [StaffType.NP]: 0.02, [StaffType.PA]: 0, [StaffType.PT]: 0.05, [StaffType.OT]: 0.03, [StaffType.RT]: 0.02, [StaffType.SW]: 0.03, [StaffType.PHARM]: 0.03, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    3: { [StaffType.RN]: 0.25, [StaffType.LPN]: 0.10, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.04, [StaffType.PA]: 0.02, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.04, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.04, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    4: { [StaffType.RN]: 0.33, [StaffType.LPN]: 0.08, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.06, [StaffType.PA]: 0.04, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.06, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.04, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    5: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0.08, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.08, [StaffType.PA]: 0.04, [StaffType.PT]: 0.04, [StaffType.OT]: 0.04, [StaffType.RT]: 0.08, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
  },
  [UnitType.ORTHO]: {
    1: { [StaffType.RN]: 0.17, [StaffType.LPN]: 0.08, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.02, [StaffType.PA]: 0.02, [StaffType.PT]: 0.08, [StaffType.OT]: 0.06, [StaffType.RT]: 0, [StaffType.SW]: 0.02, [StaffType.PHARM]: 0.02, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    2: { [StaffType.RN]: 0.20, [StaffType.LPN]: 0.10, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.04, [StaffType.PA]: 0.02, [StaffType.PT]: 0.10, [StaffType.OT]: 0.06, [StaffType.RT]: 0.02, [StaffType.SW]: 0.03, [StaffType.PHARM]: 0.03, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    3: { [StaffType.RN]: 0.25, [StaffType.LPN]: 0.10, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.06, [StaffType.PA]: 0.04, [StaffType.PT]: 0.10, [StaffType.OT]: 0.06, [StaffType.RT]: 0.04, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.04, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    4: { [StaffType.RN]: 0.33, [StaffType.LPN]: 0.08, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.06, [StaffType.PA]: 0.04, [StaffType.PT]: 0.08, [StaffType.OT]: 0.06, [StaffType.RT]: 0.06, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.04, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    5: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0.08, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.08, [StaffType.PA]: 0.04, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.08, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
  },
  [UnitType.CARDIAC]: {
    1: { [StaffType.RN]: 0.20, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.04, [StaffType.PA]: 0.02, [StaffType.PT]: 0.04, [StaffType.OT]: 0.02, [StaffType.RT]: 0.04, [StaffType.SW]: 0.02, [StaffType.PHARM]: 0.04, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    2: { [StaffType.RN]: 0.25, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.06, [StaffType.PA]: 0.04, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.06, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    3: { [StaffType.RN]: 0.33, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.08, [StaffType.PA]: 0.04, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.08, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    4: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.08, [StaffType.PA]: 0.06, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.10, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.08, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    5: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.10, [StaffType.PA]: 0.06, [StaffType.PT]: 0.04, [StaffType.OT]: 0.04, [StaffType.RT]: 0.13, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.08, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
  },
  [UnitType.ICU]: {
    1: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.08, [StaffType.PA]: 0.04, [StaffType.PT]: 0.04, [StaffType.OT]: 0.02, [StaffType.RT]: 0.13, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    2: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.08, [StaffType.PA]: 0.04, [StaffType.PT]: 0.04, [StaffType.OT]: 0.02, [StaffType.RT]: 0.17, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.08, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    3: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.10, [StaffType.PA]: 0.06, [StaffType.PT]: 0.04, [StaffType.OT]: 0.02, [StaffType.RT]: 0.17, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.08, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    4: { [StaffType.RN]: 1.00, [StaffType.LPN]: 0, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.13, [StaffType.PA]: 0.06, [StaffType.PT]: 0.04, [StaffType.OT]: 0.02, [StaffType.RT]: 0.25, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.10, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    5: { [StaffType.RN]: 1.00, [StaffType.LPN]: 0, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.17, [StaffType.PA]: 0.08, [StaffType.PT]: 0.04, [StaffType.OT]: 0.02, [StaffType.RT]: 0.25, [StaffType.SW]: 0.06, [StaffType.PHARM]: 0.13, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
  },
  [UnitType.STEPDOWN]: {
    1: { [StaffType.RN]: 0.25, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.04, [StaffType.PA]: 0.02, [StaffType.PT]: 0.04, [StaffType.OT]: 0.02, [StaffType.RT]: 0.06, [StaffType.SW]: 0.02, [StaffType.PHARM]: 0.04, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    2: { [StaffType.RN]: 0.33, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.06, [StaffType.PA]: 0.04, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.08, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    3: { [StaffType.RN]: 0.33, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.08, [StaffType.PA]: 0.04, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.10, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    4: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.08, [StaffType.PA]: 0.06, [StaffType.PT]: 0.06, [StaffType.OT]: 0.04, [StaffType.RT]: 0.13, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.08, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    5: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0.04, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.10, [StaffType.PA]: 0.06, [StaffType.PT]: 0.04, [StaffType.OT]: 0.04, [StaffType.RT]: 0.17, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.08, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
  },
  [UnitType.PACU]: {
    1: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0, [StaffType.CNA]: 0.08, [StaffType.NP]: 0.04, [StaffType.PA]: 0.04, [StaffType.PT]: 0, [StaffType.OT]: 0, [StaffType.RT]: 0.08, [StaffType.SW]: 0, [StaffType.PHARM]: 0.04, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    2: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0, [StaffType.CNA]: 0.08, [StaffType.NP]: 0.06, [StaffType.PA]: 0.04, [StaffType.PT]: 0, [StaffType.OT]: 0, [StaffType.RT]: 0.10, [StaffType.SW]: 0, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    3: { [StaffType.RN]: 0.50, [StaffType.LPN]: 0, [StaffType.CNA]: 0.10, [StaffType.NP]: 0.08, [StaffType.PA]: 0.06, [StaffType.PT]: 0, [StaffType.OT]: 0, [StaffType.RT]: 0.13, [StaffType.SW]: 0.02, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    4: { [StaffType.RN]: 1.00, [StaffType.LPN]: 0, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.10, [StaffType.PA]: 0.06, [StaffType.PT]: 0, [StaffType.OT]: 0, [StaffType.RT]: 0.17, [StaffType.SW]: 0.02, [StaffType.PHARM]: 0.08, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    5: { [StaffType.RN]: 1.00, [StaffType.LPN]: 0, [StaffType.CNA]: 0.13, [StaffType.NP]: 0.13, [StaffType.PA]: 0.08, [StaffType.PT]: 0, [StaffType.OT]: 0, [StaffType.RT]: 0.25, [StaffType.SW]: 0.02, [StaffType.PHARM]: 0.10, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
  },
  [UnitType.REHAB]: {
    1: { [StaffType.RN]: 0.13, [StaffType.LPN]: 0.08, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.02, [StaffType.PA]: 0, [StaffType.PT]: 0.13, [StaffType.OT]: 0.10, [StaffType.RT]: 0.02, [StaffType.SW]: 0.04, [StaffType.PHARM]: 0.02, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    2: { [StaffType.RN]: 0.17, [StaffType.LPN]: 0.08, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.04, [StaffType.PA]: 0.02, [StaffType.PT]: 0.17, [StaffType.OT]: 0.13, [StaffType.RT]: 0.04, [StaffType.SW]: 0.06, [StaffType.PHARM]: 0.02, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    3: { [StaffType.RN]: 0.20, [StaffType.LPN]: 0.10, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.06, [StaffType.PA]: 0.02, [StaffType.PT]: 0.17, [StaffType.OT]: 0.13, [StaffType.RT]: 0.06, [StaffType.SW]: 0.06, [StaffType.PHARM]: 0.04, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    4: { [StaffType.RN]: 0.25, [StaffType.LPN]: 0.10, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.08, [StaffType.PA]: 0.04, [StaffType.PT]: 0.13, [StaffType.OT]: 0.10, [StaffType.RT]: 0.08, [StaffType.SW]: 0.06, [StaffType.PHARM]: 0.06, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
    5: { [StaffType.RN]: 0.33, [StaffType.LPN]: 0.10, [StaffType.CNA]: 0.17, [StaffType.NP]: 0.10, [StaffType.PA]: 0.04, [StaffType.PT]: 0.10, [StaffType.OT]: 0.08, [StaffType.RT]: 0.10, [StaffType.SW]: 0.06, [StaffType.PHARM]: 0.08, [StaffType.UNIT_CLERK]: 0.04, [StaffType.CHARGE_NURSE]: 0.04 },
  },
};

// Hourly rates by staff type
const HOURLY_RATES: Record<StaffType, number> = {
  [StaffType.RN]: 42, [StaffType.LPN]: 28, [StaffType.CNA]: 18, [StaffType.NP]: 62,
  [StaffType.PA]: 58, [StaffType.PT]: 48, [StaffType.OT]: 46, [StaffType.RT]: 38,
  [StaffType.SW]: 35, [StaffType.PHARM]: 65, [StaffType.UNIT_CLERK]: 20, [StaffType.CHARGE_NURSE]: 48,
};

const AGENCY_MULTIPLIER = 1.75;

// ============================================================================
// Generate 365-day historical census
// ============================================================================

function generateHistoricalCensus(): DailyCensus[] {
  const data: DailyCensus[] = [];
  const units = Object.values(UnitType);

  // Seasonal factors by month (1-indexed)
  const seasonalFactors: Record<number, number> = {
    1: 1.15, 2: 1.10, 3: 1.05, 4: 0.95, 5: 0.90, 6: 0.88,
    7: 0.85, 8: 0.87, 9: 0.92, 10: 1.00, 11: 1.05, 12: 1.12,
  };

  // Day of week factors (0=Sun)
  const dowFactors: Record<number, number> = {
    0: 0.85, 1: 1.10, 2: 1.08, 3: 1.05, 4: 1.02, 5: 0.95, 6: 0.88,
  };

  // Holidays
  const holidays = new Set(['2024-01-01', '2024-05-27', '2024-07-04', '2024-09-02', '2024-11-28', '2024-12-25']);

  function seededRand(seed: number): () => number {
    let s = seed;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }
  const rand = seededRand(123);

  const baseCensus: Record<UnitType, number> = {
    [UnitType.MED_SURG]: 28, [UnitType.ORTHO]: 20, [UnitType.CARDIAC]: 16,
    [UnitType.ICU]: 10, [UnitType.STEPDOWN]: 12, [UnitType.PACU]: 8, [UnitType.REHAB]: 18,
  };

  const baseDate = new Date('2024-01-01');
  for (let d = 0; d < 365; d++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    const dow = date.getDay();
    const month = date.getMonth() + 1;
    const isHoliday = holidays.has(dateStr);
    const sf = seasonalFactors[month] || 1.0;
    const df = dowFactors[dow] || 1.0;
    const hf = isHoliday ? 0.70 : 1.0;

    for (const unit of units) {
      const base = baseCensus[unit];
      const adjusted = base * sf * df * hf;
      const noise = (rand() - 0.5) * base * 0.15;
      const census = Math.max(1, Math.round(adjusted + noise));
      const surgeries = unit === UnitType.PACU ? Math.round(census * 0.8) : Math.round(census * 0.2 * df);
      const admissions = Math.round(census * 0.3 + rand() * 3);
      const discharges = Math.round(census * 0.28 + rand() * 3);
      const avgAcuity = unit === UnitType.ICU ? 3.5 + rand() * 1.5 : unit === UnitType.STEPDOWN ? 2.5 + rand() : 1.5 + rand() * 1.5;

      data.push({
        date: dateStr, dayOfWeek: dow, month, census, admissions, discharges,
        avgAcuity: Math.round(avgAcuity * 10) / 10,
        scheduledSurgeries: surgeries, unitType: unit, isHoliday, seasonalFactor: sf,
      });
    }
  }

  return data;
}

// ============================================================================
// Implementation
// ============================================================================

export function createPredictiveStaffingModel(): PredictiveStaffingModel {
  const historicalData = generateHistoricalCensus();
  const staffingOutcomes: StaffingOutcome[] = [];

  function getHistoricalCensus(): DailyCensus[] {
    return [...historicalData];
  }

  function forecastCensus(startDate: string, days: number, unitType: UnitType): ForecastResult[] {
    const unitData = historicalData.filter(d => d.unitType === unitType);
    const avgCensus = unitData.reduce((s, d) => s + d.census, 0) / unitData.length;
    const avgAcuity = unitData.reduce((s, d) => s + d.avgAcuity, 0) / unitData.length;
    const avgAdmissions = unitData.reduce((s, d) => s + d.admissions, 0) / unitData.length;
    const avgDischarges = unitData.reduce((s, d) => s + d.discharges, 0) / unitData.length;

    const seasonalFactors = getSeasonalFactors();
    const dowFactors = getDayOfWeekFactors();
    const forecasts: ForecastResult[] = [];

    // Apply learned accuracy adjustment
    const accuracyFactor = getForecastAccuracy();
    const adjustmentFactor = accuracyFactor > 0 ? Math.min(1.1, 1 / accuracyFactor) : 1.0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dow = date.getDay();
      const month = date.getMonth() + 1;
      const sf = seasonalFactors[month] || 1.0;
      const df = dowFactors[dow] || 1.0;

      const predictedCensus = Math.round(avgCensus * sf * df * adjustmentFactor);
      const variance = avgCensus * 0.15;
      const factors: string[] = [];
      if (sf > 1.05) factors.push('High seasonal demand');
      if (sf < 0.95) factors.push('Low seasonal demand');
      if (df > 1.05) factors.push('High weekday volume');
      if (df < 0.9) factors.push('Weekend reduction');
      if (month === 1 || month === 2) factors.push('Flu season');
      if (month === 12) factors.push('Holiday season');

      forecasts.push({
        date: dateStr,
        predictedCensus,
        confidenceInterval: {
          lower: Math.max(1, Math.round(predictedCensus - 1.96 * variance)),
          upper: Math.round(predictedCensus + 1.96 * variance),
        },
        predictedAcuity: Math.round(avgAcuity * 10) / 10,
        predictedAdmissions: Math.round(avgAdmissions * sf * df),
        predictedDischarges: Math.round(avgDischarges * sf * df),
        factors,
      });
    }

    return forecasts;
  }

  function calculateStaffingRequirements(forecast: ForecastResult, unitType: UnitType): StaffingRequirement {
    const acuityLevel = Math.min(5, Math.max(1, Math.round(forecast.predictedAcuity)));
    const ratios = STAFFING_RATIOS[unitType]?.[acuityLevel] || STAFFING_RATIOS[UnitType.MED_SURG][2];

    const staffNeeds: Record<StaffType, number> = {} as Record<StaffType, number>;
    let totalFTEs = 0;
    let totalCost = 0;

    for (const [staffType, ratio] of Object.entries(ratios)) {
      const needed = Math.ceil(forecast.predictedCensus * ratio);
      staffNeeds[staffType as StaffType] = needed;
      totalFTEs += needed;
      totalCost += needed * (HOURLY_RATES[staffType as StaffType] || 30) * 8;
    }

    // Estimate agency needs
    const agencyNeeded = Math.max(0, Math.round(totalFTEs * 0.05));

    return {
      date: forecast.date,
      shift: ShiftType.DAY,
      unitType,
      predictedCensus: forecast.predictedCensus,
      predictedAcuity: forecast.predictedAcuity,
      staffNeeds,
      totalFTEs,
      estimatedCost: Math.round(totalCost),
      agencyStaffNeeded: agencyNeeded,
      confidence: 0.85,
    };
  }

  function generateStaffingPlan(startDate: string, days: number, unitType: UnitType): StaffingRequirement[] {
    const forecasts = forecastCensus(startDate, days, unitType);
    return forecasts.map(f => calculateStaffingRequirements(f, unitType));
  }

  function optimizeSkillMix(unitType: UnitType, census: number, acuity: number): SkillMixRecommendation {
    const acuityLevel = Math.min(5, Math.max(1, Math.round(acuity)));
    const ratios = STAFFING_RATIOS[unitType]?.[acuityLevel] || STAFFING_RATIOS[UnitType.MED_SURG][2];

    const recommended: Record<StaffType, number> = {} as Record<StaffType, number>;
    let totalCost = 0;

    for (const [st, ratio] of Object.entries(ratios)) {
      const count = Math.ceil(census * ratio);
      recommended[st as StaffType] = count;
      totalCost += count * (HOURLY_RATES[st as StaffType] || 30) * 8;
    }

    return {
      unitType,
      recommendedMix: recommended,
      rationale: `Based on census of ${census} with average acuity ${acuity} (level ${acuityLevel}). Staffing ratios follow evidence-based guidelines for ${unitType} units.`,
      costImpact: Math.round(totalCost),
    };
  }

  function calculateBudgetImpact(staffingPlan: StaffingRequirement[]): BudgetImpact {
    let regularCost = 0;
    let agencyCost = 0;
    const overtimeRate = 0.08;

    for (const req of staffingPlan) {
      regularCost += req.estimatedCost;
      agencyCost += req.agencyStaffNeeded * 42 * 8 * AGENCY_MULTIPLIER;
    }

    const overtimeCost = regularCost * overtimeRate;
    const totalCost = regularCost + overtimeCost + agencyCost;
    const totalPatientDays = staffingPlan.reduce((s, r) => s + r.predictedCensus, 0);
    const costPerPatientDay = totalPatientDays > 0 ? totalCost / totalPatientDays : 0;

    return {
      period: staffingPlan.length > 0 ? `${staffingPlan[0].date} to ${staffingPlan[staffingPlan.length - 1].date}` : 'N/A',
      regularStaffCost: Math.round(regularCost),
      overtimeCost: Math.round(overtimeCost),
      agencyStaffCost: Math.round(agencyCost),
      totalCost: Math.round(totalCost),
      costPerPatientDay: Math.round(costPerPatientDay),
      projectedSavings: Math.round(agencyCost * 0.3),
    };
  }

  function getSeasonalFactors(): Record<number, number> {
    return { 1: 1.15, 2: 1.10, 3: 1.05, 4: 0.95, 5: 0.90, 6: 0.88, 7: 0.85, 8: 0.87, 9: 0.92, 10: 1.00, 11: 1.05, 12: 1.12 };
  }

  function getDayOfWeekFactors(): Record<number, number> {
    return { 0: 0.85, 1: 1.10, 2: 1.08, 3: 1.05, 4: 1.02, 5: 0.95, 6: 0.88 };
  }

  function predictAgencyNeeds(unitType: UnitType, month: number): number {
    const sf = getSeasonalFactors()[month] || 1.0;
    const unitData = historicalData.filter(d => d.unitType === unitType && d.month === month);
    const avgCensus = unitData.length > 0 ? unitData.reduce((s, d) => s + d.census, 0) / unitData.length : 15;
    return Math.round(avgCensus * 0.05 * sf);
  }

  function recordStaffingOutcome(outcome: StaffingOutcome): void {
    staffingOutcomes.push(outcome);
  }

  function getForecastAccuracy(): number {
    if (staffingOutcomes.length === 0) return 1.0;
    const errors = staffingOutcomes.map(o => Math.abs(o.predictedCensus - o.actualCensus) / Math.max(o.actualCensus, 1));
    const mape = errors.reduce((s, e) => s + e, 0) / errors.length;
    return Math.round((1 - mape) * 100) / 100;
  }

  return {
    getHistoricalCensus,
    forecastCensus,
    calculateStaffingRequirements,
    generateStaffingPlan,
    optimizeSkillMix,
    calculateBudgetImpact,
    getSeasonalFactors,
    getDayOfWeekFactors,
    predictAgencyNeeds,
    recordStaffingOutcome,
    getForecastAccuracy,
  };
}
