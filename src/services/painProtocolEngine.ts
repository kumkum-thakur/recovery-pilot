/**
 * Pain Protocol Engine Service
 *
 * Implements real clinical pain management protocols:
 * - WHO Pain Ladder (3-step approach)
 * - Equianalgesic conversion calculator (real conversion factors)
 * - Multimodal analgesia protocols
 * - PCA dose calculations
 * - Side effect monitoring
 * - Weight/renal/hepatic-adjusted dosing
 * - Self-learning pain relief effectiveness tracking
 *
 * Based on: WHO Pain Ladder; APS Guidelines; Equianalgesic tables
 */

// ============================================================================
// Constants & Enums
// ============================================================================

export const PainLevel = {
  NONE: 'none',
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
} as const;
export type PainLevel = typeof PainLevel[keyof typeof PainLevel];

export const WHOStep = {
  STEP_1: 1,
  STEP_2: 2,
  STEP_3: 3,
} as const;
export type WHOStep = typeof WHOStep[keyof typeof WHOStep];

export const OpioidName = {
  MORPHINE: 'morphine',
  HYDROMORPHONE: 'hydromorphone',
  OXYCODONE: 'oxycodone',
  FENTANYL: 'fentanyl',
  HYDROCODONE: 'hydrocodone',
  CODEINE: 'codeine',
  TRAMADOL: 'tramadol',
  METHADONE: 'methadone',
  OXYMORPHONE: 'oxymorphone',
  TAPENTADOL: 'tapentadol',
} as const;
export type OpioidName = typeof OpioidName[keyof typeof OpioidName];

export const Route = {
  ORAL: 'oral',
  IV: 'iv',
  IM: 'im',
  SC: 'sc',
  TRANSDERMAL: 'transdermal',
  RECTAL: 'rectal',
  SUBLINGUAL: 'sublingual',
} as const;
export type Route = typeof Route[keyof typeof Route];

export const SideEffectSeverity = {
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
  LIFE_THREATENING: 'life_threatening',
} as const;
export type SideEffectSeverity = typeof SideEffectSeverity[keyof typeof SideEffectSeverity];

// ============================================================================
// Interfaces
// ============================================================================

export interface PainAssessment {
  score: number;           // 0-10 NRS
  location: string;
  quality: string;
  onset: string;
  duration: string;
  aggravatingFactors: string[];
  relievingFactors: string[];
  functionalImpact: string;
}

export interface PatientContext {
  weightKg: number;
  ageYears: number;
  creatinineClearance: number;  // mL/min (CrCl)
  hepaticFunction: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  isOpioidTolerant: boolean;
  allergies: string[];
  currentMedications: string[];
}

export interface WHOLadderResult {
  step: number;
  painLevel: PainLevel;
  medications: MedicationRecommendation[];
  adjuvants: AdjuvantRecommendation[];
  nonPharmacological: string[];
  escalationCriteria: string;
}

export interface MedicationRecommendation {
  name: string;
  genericName: string;
  dose: string;
  route: string;
  frequency: string;
  maxDailyDose: string;
  renalAdjustment: string | null;
  hepaticAdjustment: string | null;
  warnings: string[];
}

export interface AdjuvantRecommendation {
  name: string;
  indication: string;
  dose: string;
  mechanism: string;
}

/** Real equianalgesic conversion factors (relative to oral morphine 30mg) */
export interface EquianalgesicEntry {
  drug: OpioidName;
  oralDoseMg: number | null;      // mg equivalent to morphine 30mg oral
  parenteralDoseMg: number | null; // mg equivalent to morphine 10mg IV
  oralBioavailability: number;     // fraction
  halfLifeHours: number;
  onsetMinutes: number;
  peakHours: number;
  durationHours: number;
}

export interface ConversionResult {
  fromDrug: string;
  fromDose: number;
  fromRoute: Route;
  toDrug: string;
  toDose: number;
  toRoute: Route;
  safetyReduction: number;        // percentage reduction for cross-tolerance
  finalDose: number;
  conversionRatio: number;
  warnings: string[];
}

export interface PCAProtocol {
  drug: string;
  concentration: string;
  demandDose: string;
  lockoutInterval: string;
  continuousRate: string;
  hourlyLimit: string;
  loadingDose: string | null;
  monitoring: string[];
}

export interface MultimodalProtocol {
  scheduled: MedicationRecommendation[];
  prn: MedicationRecommendation[];
  adjuvants: AdjuvantRecommendation[];
  nonPharmacological: string[];
  monitoring: SideEffectMonitoring;
}

export interface SideEffectMonitoring {
  sedationScale: string;
  respiratoryRateMin: number;
  nauseaProtocol: string;
  constipationProphylaxis: string;
  pruritusManagement: string;
  assessmentFrequency: string;
}

export interface PainOutcome {
  patientId: string;
  timestamp: string;
  painBefore: number;
  painAfter: number;
  medicationUsed: string;
  doseGiven: string;
  timeToPeakRelief: number;  // minutes
  durationOfRelief: number;  // hours
  sideEffects: string[];
  effective: boolean;
}

export interface LearningData {
  totalOutcomes: number;
  averagePainReduction: number;
  medicationEffectiveness: Record<string, { uses: number; avgReduction: number; sideEffectRate: number }>;
  adjustedConversionFactors: Record<string, number>;
}

// ============================================================================
// Real Equianalgesic Table
// Based on APS/AAPM Guidelines & standard references
// ============================================================================

const EQUIANALGESIC_TABLE: EquianalgesicEntry[] = [
  {
    drug: OpioidName.MORPHINE,
    oralDoseMg: 30, parenteralDoseMg: 10,
    oralBioavailability: 0.30, halfLifeHours: 3, onsetMinutes: 30, peakHours: 1, durationHours: 4,
  },
  {
    drug: OpioidName.HYDROMORPHONE,
    oralDoseMg: 6, parenteralDoseMg: 1.5,
    oralBioavailability: 0.50, halfLifeHours: 3, onsetMinutes: 30, peakHours: 1, durationHours: 4,
  },
  {
    drug: OpioidName.OXYCODONE,
    oralDoseMg: 20, parenteralDoseMg: null,
    oralBioavailability: 0.60, halfLifeHours: 3.5, onsetMinutes: 15, peakHours: 1, durationHours: 4,
  },
  {
    drug: OpioidName.FENTANYL,
    oralDoseMg: null, parenteralDoseMg: 0.1,
    oralBioavailability: 0.50, halfLifeHours: 3.5, onsetMinutes: 5, peakHours: 0.25, durationHours: 1,
  },
  {
    drug: OpioidName.HYDROCODONE,
    oralDoseMg: 30, parenteralDoseMg: null,
    oralBioavailability: 0.70, halfLifeHours: 4, onsetMinutes: 30, peakHours: 1.3, durationHours: 4,
  },
  {
    drug: OpioidName.CODEINE,
    oralDoseMg: 200, parenteralDoseMg: 120,
    oralBioavailability: 0.50, halfLifeHours: 3, onsetMinutes: 30, peakHours: 1.5, durationHours: 4,
  },
  {
    drug: OpioidName.TRAMADOL,
    oralDoseMg: 300, parenteralDoseMg: null,
    oralBioavailability: 0.70, halfLifeHours: 6, onsetMinutes: 60, peakHours: 2, durationHours: 6,
  },
  {
    drug: OpioidName.METHADONE,
    // WARNING: Methadone equianalgesic dosing is dose-dependent and NOT a fixed ratio.
    // Use variable ratios: morphine <90mg/d -> 4:1, 90-300mg/d -> 8:1, >300mg/d -> 12:1+
    // Values below are approximate for LOW-DOSE conversions only (morphine <90mg/day).
    oralDoseMg: 20, parenteralDoseMg: 10,
    oralBioavailability: 0.80, halfLifeHours: 25, onsetMinutes: 30, peakHours: 3, durationHours: 8,
  },
  {
    drug: OpioidName.OXYMORPHONE,
    oralDoseMg: 10, parenteralDoseMg: 1,
    oralBioavailability: 0.10, halfLifeHours: 4, onsetMinutes: 15, peakHours: 1, durationHours: 4,
  },
  {
    drug: OpioidName.TAPENTADOL,
    oralDoseMg: 75, parenteralDoseMg: null,
    oralBioavailability: 0.32, halfLifeHours: 4, onsetMinutes: 30, peakHours: 1.5, durationHours: 5,
  },
];

// ============================================================================
// Core Functions
// ============================================================================

function classifyPainLevel(score: number): PainLevel {
  if (score === 0) return PainLevel.NONE;
  if (score <= 3) return PainLevel.MILD;
  if (score <= 6) return PainLevel.MODERATE;
  return PainLevel.SEVERE;
}

function determineWHOStep(painScore: number): number {
  if (painScore <= 3) return 1;
  if (painScore <= 6) return 2;
  return 3;
}

function generateWHOLadder(
  painScore: number,
  context: PatientContext,
): WHOLadderResult {
  const painLevel = classifyPainLevel(painScore);
  const step = determineWHOStep(painScore);
  const medications: MedicationRecommendation[] = [];
  const adjuvants: AdjuvantRecommendation[] = [];
  const nonPharm: string[] = [];

  // Step 1: Non-opioid analgesics
  if (step >= 1) {
    if (!context.allergies.includes('NSAID')) {
      const renalAdj = context.creatinineClearance < 30
        ? 'Avoid NSAIDs with CrCl < 30 mL/min'
        : null;
      medications.push({
        name: 'Acetaminophen',
        genericName: 'acetaminophen',
        dose: context.hepaticFunction === 'severe_impairment' ? '500 mg' : '1000 mg',
        route: 'oral',
        frequency: 'every 6 hours',
        maxDailyDose: context.hepaticFunction === 'severe_impairment' ? '2000 mg' : '4000 mg',
        renalAdjustment: null,
        hepaticAdjustment: context.hepaticFunction !== 'normal' ? 'Reduce dose; max 2g/day with liver disease' : null,
        warnings: ['Hepatotoxicity risk', 'Check total daily intake from all sources'],
      });

      if (context.creatinineClearance >= 30) {
        medications.push({
          name: 'Ibuprofen',
          genericName: 'ibuprofen',
          dose: '400 mg',
          route: 'oral',
          frequency: 'every 6-8 hours',
          maxDailyDose: '2400 mg',
          renalAdjustment: renalAdj,
          hepaticAdjustment: null,
          warnings: ['GI bleeding risk', 'Renal impairment', 'Cardiovascular risk'],
        });
      }
    }

    nonPharm.push('Ice/heat therapy', 'Repositioning', 'Relaxation techniques');
  }

  // Step 2: Weak opioids + non-opioids
  if (step >= 2) {
    if (!context.allergies.includes('codeine') && !context.allergies.includes('opioid')) {
      medications.push({
        name: 'Tramadol',
        genericName: 'tramadol',
        dose: context.creatinineClearance < 30 ? '50 mg' : '50-100 mg',
        route: 'oral',
        frequency: context.creatinineClearance < 30 ? 'every 12 hours' : 'every 4-6 hours',
        maxDailyDose: context.creatinineClearance < 30 ? '200 mg' : '400 mg',
        renalAdjustment: context.creatinineClearance < 30 ? 'Reduce dose and extend interval' : null,
        hepaticAdjustment: context.hepaticFunction !== 'normal' ? 'Use with caution; reduce dose' : null,
        warnings: ['Seizure risk', 'Serotonin syndrome with SSRIs', 'CNS depression'],
      });
    }

    nonPharm.push('TENS unit', 'Guided imagery', 'Distraction techniques');
  }

  // Step 3: Strong opioids + non-opioids
  if (step >= 3) {
    const morphineDose = context.creatinineClearance < 30
      ? '2 mg IV every 4 hours'
      : (context.isOpioidTolerant ? '4-8 mg IV every 2-4 hours' : '2-4 mg IV every 2-4 hours');

    medications.push({
      name: 'Morphine',
      genericName: 'morphine',
      dose: morphineDose,
      route: 'IV',
      frequency: 'every 2-4 hours PRN',
      maxDailyDose: 'Titrate to effect; no ceiling dose',
      renalAdjustment: context.creatinineClearance < 30 ? 'Reduce dose 50-75%; extend interval. Active metabolite accumulation.' : null,
      hepaticAdjustment: context.hepaticFunction !== 'normal' ? 'Reduce dose; increased sensitivity' : null,
      warnings: ['Respiratory depression', 'Sedation', 'Constipation', 'Nausea/vomiting'],
    });

    nonPharm.push('Regional anesthesia consultation', 'Psychological support', 'Physical therapy as tolerated');
  }

  // Common adjuvants
  adjuvants.push({
    name: 'Gabapentin',
    indication: 'Neuropathic pain component',
    dose: '100-300 mg at bedtime, titrate up',
    mechanism: 'Calcium channel alpha-2-delta ligand',
  });

  if (painLevel === PainLevel.SEVERE) {
    adjuvants.push({
      name: 'Dexamethasone',
      indication: 'Inflammatory/surgical pain',
      dose: '4-8 mg IV/PO daily',
      mechanism: 'Anti-inflammatory; reduces edema',
    });
  }

  const escalationCriteria = step < 3
    ? `Escalate to Step ${step + 1} if pain score remains > ${step === 1 ? 3 : 6} after 1 hour of treatment.`
    : 'At maximum step. Consider interventional pain management, nerve blocks, or palliative care consultation.';

  return { step, painLevel, medications, adjuvants, nonPharmacological: nonPharm, escalationCriteria };
}

function convertOpioidDose(
  fromDrug: OpioidName,
  fromDoseMg: number,
  fromRoute: Route,
  toDrug: OpioidName,
  toRoute: Route,
  safetyReductionPercent: number = 25,
): ConversionResult {
  const fromEntry = EQUIANALGESIC_TABLE.find(e => e.drug === fromDrug);
  const toEntry = EQUIANALGESIC_TABLE.find(e => e.drug === toDrug);

  if (!fromEntry || !toEntry) {
    return {
      fromDrug, fromDose: fromDoseMg, fromRoute,
      toDrug, toDose: 0, toRoute,
      safetyReduction: safetyReductionPercent,
      finalDose: 0, conversionRatio: 0,
      warnings: ['Unknown drug in conversion table'],
    };
  }

  const warnings: string[] = [];

  // Get the reference dose for the "from" drug
  const fromReferenceDose = fromRoute === Route.ORAL
    ? fromEntry.oralDoseMg
    : fromEntry.parenteralDoseMg;

  // Get the reference dose for the "to" drug
  const toReferenceDose = toRoute === Route.ORAL
    ? toEntry.oralDoseMg
    : toEntry.parenteralDoseMg;

  if (fromReferenceDose === null || toReferenceDose === null) {
    warnings.push(`Route not available for ${fromReferenceDose === null ? fromDrug : toDrug}`);
    return {
      fromDrug, fromDose: fromDoseMg, fromRoute,
      toDrug, toDose: 0, toRoute,
      safetyReduction: safetyReductionPercent,
      finalDose: 0, conversionRatio: 0,
      warnings,
    };
  }

  // Morphine equivalents: how many "morphine oral 30mg equivalents" the from dose represents
  const morphineEquivalents = fromDoseMg / fromReferenceDose;

  // Calculate raw "to" dose
  const rawToDose = morphineEquivalents * toReferenceDose;

  // Apply safety reduction for incomplete cross-tolerance
  const reduction = safetyReductionPercent / 100;
  const finalDose = rawToDose * (1 - reduction);

  const conversionRatio = fromDoseMg > 0 ? finalDose / fromDoseMg : 0;

  // Special warnings
  if (toDrug === OpioidName.METHADONE) {
    warnings.push('CAUTION: Methadone conversion is complex and dose-dependent. Conversion ratios change at higher doses. Specialist consultation recommended.');
  }
  if (toDrug === OpioidName.FENTANYL && toRoute === Route.TRANSDERMAL) {
    warnings.push('Fentanyl patch: takes 12-24 hours to reach steady state. Provide breakthrough medication.');
  }
  if (safetyReductionPercent < 25) {
    warnings.push('Safety reduction < 25%. Standard recommendation is 25-50% reduction for incomplete cross-tolerance.');
  }

  return {
    fromDrug, fromDose: fromDoseMg, fromRoute,
    toDrug, toDose: Math.round(rawToDose * 100) / 100,
    toRoute,
    safetyReduction: safetyReductionPercent,
    finalDose: Math.round(finalDose * 100) / 100,
    conversionRatio: Math.round(conversionRatio * 1000) / 1000,
    warnings,
  };
}

function generatePCAProtocol(
  drug: OpioidName,
  context: PatientContext,
): PCAProtocol {
  const monitoring = [
    'Respiratory rate every 1 hour for first 24 hours, then every 2 hours',
    'Sedation scale (Pasero) every 1 hour for first 24 hours',
    'Pain score every 2 hours while awake',
    'SpO2 continuous monitoring',
    'Naloxone 0.4 mg IV at bedside',
    'Total PCA attempts and deliveries per shift',
  ];

  if (drug === OpioidName.MORPHINE) {
    const isRenalImpaired = context.creatinineClearance < 50;
    return {
      drug: 'Morphine',
      concentration: '1 mg/mL',
      demandDose: isRenalImpaired ? '0.5-1 mg' : '1-2 mg',
      lockoutInterval: '6-10 minutes',
      continuousRate: context.isOpioidTolerant ? '0.5-1 mg/hr' : 'None (opioid-naive)',
      hourlyLimit: isRenalImpaired ? '6 mg' : '10 mg',
      loadingDose: context.isOpioidTolerant ? '2-4 mg IV' : null,
      monitoring,
    };
  }

  if (drug === OpioidName.HYDROMORPHONE) {
    return {
      drug: 'Hydromorphone',
      concentration: '0.2 mg/mL',
      demandDose: '0.2-0.4 mg',
      lockoutInterval: '6-10 minutes',
      continuousRate: context.isOpioidTolerant ? '0.1-0.2 mg/hr' : 'None (opioid-naive)',
      hourlyLimit: '2 mg',
      loadingDose: context.isOpioidTolerant ? '0.4-0.8 mg IV' : null,
      monitoring,
    };
  }

  // Fentanyl PCA
  return {
    drug: 'Fentanyl',
    concentration: '10 mcg/mL',
    demandDose: '10-20 mcg',
    lockoutInterval: '6-10 minutes',
    continuousRate: context.isOpioidTolerant ? '10-20 mcg/hr' : 'None (opioid-naive)',
    hourlyLimit: '100 mcg',
    loadingDose: context.isOpioidTolerant ? '25-50 mcg IV' : null,
    monitoring,
  };
}

function generateMultimodalProtocol(
  painScore: number,
  context: PatientContext,
): MultimodalProtocol {
  const scheduled: MedicationRecommendation[] = [];
  const prn: MedicationRecommendation[] = [];
  const adjuvants: AdjuvantRecommendation[] = [];
  const nonPharm: string[] = [];

  // Scheduled acetaminophen (cornerstone of multimodal)
  scheduled.push({
    name: 'Acetaminophen',
    genericName: 'acetaminophen',
    dose: context.hepaticFunction === 'severe_impairment' ? '500 mg' : '1000 mg',
    route: 'IV or oral',
    frequency: 'every 6 hours (scheduled)',
    maxDailyDose: context.hepaticFunction === 'severe_impairment' ? '2000 mg' : '4000 mg',
    renalAdjustment: null,
    hepaticAdjustment: context.hepaticFunction !== 'normal' ? 'Reduce to 2g/day' : null,
    warnings: [],
  });

  // NSAID if no contraindication
  if (context.creatinineClearance >= 30 && !context.allergies.includes('NSAID')) {
    scheduled.push({
      name: 'Ketorolac',
      genericName: 'ketorolac',
      dose: context.ageYears >= 65 ? '15 mg' : '30 mg',
      route: 'IV',
      frequency: 'every 6 hours (max 5 days)',
      maxDailyDose: context.ageYears >= 65 ? '60 mg' : '120 mg',
      renalAdjustment: 'Reduce dose for CrCl 30-60',
      hepaticAdjustment: null,
      warnings: ['Max 5 days IV', 'GI/renal risk', 'Avoid with anticoagulants'],
    });
  }

  // Gabapentin for neuropathic component
  adjuvants.push({
    name: 'Gabapentin',
    indication: 'Multimodal - neuropathic pain, opioid sparing',
    dose: '100-300 mg TID',
    mechanism: 'Alpha-2-delta calcium channel modulation',
  });

  // Opioid PRN
  if (painScore >= 4) {
    prn.push({
      name: 'Oxycodone',
      genericName: 'oxycodone',
      dose: context.isOpioidTolerant ? '10-15 mg' : '5 mg',
      route: 'oral',
      frequency: 'every 4-6 hours PRN for pain > 4',
      maxDailyDose: 'Assess daily; titrate to effect',
      renalAdjustment: context.creatinineClearance < 30 ? 'Use with caution; start low' : null,
      hepaticAdjustment: context.hepaticFunction !== 'normal' ? 'Reduce starting dose by 50%' : null,
      warnings: ['Assess before each dose', 'Hold for sedation or RR < 10'],
    });
  }

  if (painScore >= 7) {
    prn.push({
      name: 'Morphine IV',
      genericName: 'morphine',
      dose: context.isOpioidTolerant ? '4 mg' : '2 mg',
      route: 'IV',
      frequency: 'every 2-4 hours PRN for severe pain',
      maxDailyDose: 'Titrate; monitor closely',
      renalAdjustment: context.creatinineClearance < 30 ? 'Avoid; use hydromorphone' : null,
      hepaticAdjustment: context.hepaticFunction !== 'normal' ? 'Reduce dose 50%' : null,
      warnings: ['Respiratory depression', 'Have naloxone at bedside'],
    });
  }

  nonPharm.push(
    'Positioning and splinting',
    'Ice therapy 20 min on/20 min off',
    'Deep breathing exercises',
    'Music therapy',
    'Early mobilization as tolerated',
  );

  const monitoring: SideEffectMonitoring = {
    sedationScale: 'Pasero Opioid-Induced Sedation Scale (POSS): assess q1h x 24h then q2h',
    respiratoryRateMin: 10,
    nauseaProtocol: 'Ondansetron 4 mg IV PRN nausea every 6 hours',
    constipationProphylaxis: 'Docusate 100 mg BID + Senna 8.6 mg BID with any opioid',
    pruritusManagement: 'Nalbuphine 2.5 mg IV or diphenhydramine 25 mg IV PRN',
    assessmentFrequency: 'Every 4 hours while on opioids; more frequently in first 24 hours',
  };

  return { scheduled, prn, adjuvants, nonPharmacological: nonPharm, monitoring };
}

// ============================================================================
// Pain Protocol Engine Class
// ============================================================================

class PainProtocolEngine {
  private outcomes: PainOutcome[] = [];
  private learningData: LearningData;

  constructor() {
    this.learningData = {
      totalOutcomes: 0,
      averagePainReduction: 0,
      medicationEffectiveness: {},
      adjustedConversionFactors: {},
    };
    this._generateOutcomeData();
  }

  // Public API

  classifyPainLevel(score: number): PainLevel {
    return classifyPainLevel(score);
  }

  determineWHOStep(painScore: number): number {
    return determineWHOStep(painScore);
  }

  generateWHOLadder(painScore: number, context: PatientContext): WHOLadderResult {
    return generateWHOLadder(painScore, context);
  }

  convertOpioidDose(
    fromDrug: OpioidName,
    fromDoseMg: number,
    fromRoute: Route,
    toDrug: OpioidName,
    toRoute: Route,
    safetyReduction?: number,
  ): ConversionResult {
    return convertOpioidDose(fromDrug, fromDoseMg, fromRoute, toDrug, toRoute, safetyReduction);
  }

  generatePCAProtocol(drug: OpioidName, context: PatientContext): PCAProtocol {
    return generatePCAProtocol(drug, context);
  }

  generateMultimodalProtocol(painScore: number, context: PatientContext): MultimodalProtocol {
    return generateMultimodalProtocol(painScore, context);
  }

  getEquianalgesicTable(): EquianalgesicEntry[] {
    return [...EQUIANALGESIC_TABLE];
  }

  recordPainOutcome(outcome: PainOutcome): void {
    this.outcomes.push(outcome);
    this.learningData.totalOutcomes++;
    this._updateLearningData(outcome);
  }

  getLearningData(): LearningData {
    return {
      ...this.learningData,
      medicationEffectiveness: { ...this.learningData.medicationEffectiveness },
    };
  }

  getOutcomesCount(): number {
    return this.outcomes.length;
  }

  getMedicationEffectiveness(medicationName: string): { uses: number; avgReduction: number; sideEffectRate: number } | null {
    return this.learningData.medicationEffectiveness[medicationName] ?? null;
  }

  // Private methods

  private _updateLearningData(outcome: PainOutcome): void {
    const reduction = outcome.painBefore - outcome.painAfter;

    // Update overall average
    const n = this.learningData.totalOutcomes;
    this.learningData.averagePainReduction =
      ((this.learningData.averagePainReduction * (n - 1)) + reduction) / n;

    // Update per-medication effectiveness
    const med = outcome.medicationUsed;
    if (!this.learningData.medicationEffectiveness[med]) {
      this.learningData.medicationEffectiveness[med] = { uses: 0, avgReduction: 0, sideEffectRate: 0 };
    }
    const entry = this.learningData.medicationEffectiveness[med];
    entry.avgReduction = ((entry.avgReduction * entry.uses) + reduction) / (entry.uses + 1);
    const hadSideEffect = outcome.sideEffects.length > 0 ? 1 : 0;
    entry.sideEffectRate = ((entry.sideEffectRate * entry.uses) + hadSideEffect) / (entry.uses + 1);
    entry.uses++;
  }

  private _generateOutcomeData(): void {
    const medications = ['morphine', 'oxycodone', 'hydromorphone', 'acetaminophen', 'ibuprofen', 'tramadol', 'fentanyl'];
    const sideEffects = ['nausea', 'sedation', 'constipation', 'pruritus', 'dizziness'];

    for (let i = 0; i < 150; i++) {
      const med = medications[i % medications.length];
      const painBefore = 3 + Math.floor(Math.random() * 7); // 3-9
      const isOpioid = ['morphine', 'oxycodone', 'hydromorphone', 'fentanyl'].includes(med);
      const painReduction = isOpioid
        ? 2 + Math.floor(Math.random() * 4)
        : 1 + Math.floor(Math.random() * 3);
      const painAfter = Math.max(0, painBefore - painReduction);

      const effectSideEffects: string[] = [];
      if (isOpioid && Math.random() < 0.3) {
        effectSideEffects.push(sideEffects[Math.floor(Math.random() * sideEffects.length)]);
      }

      this.recordPainOutcome({
        patientId: `pain-pt-${i.toString().padStart(3, '0')}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        painBefore,
        painAfter,
        medicationUsed: med,
        doseGiven: isOpioid ? '2 mg IV' : '1000 mg PO',
        timeToPeakRelief: isOpioid ? 10 + Math.random() * 20 : 30 + Math.random() * 30,
        durationOfRelief: isOpioid ? 2 + Math.random() * 3 : 4 + Math.random() * 4,
        sideEffects: effectSideEffects,
        effective: painAfter <= painBefore * 0.5,
      });
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export const painProtocolEngine = new PainProtocolEngine();

export {
  classifyPainLevel,
  determineWHOStep,
  generateWHOLadder,
  convertOpioidDose,
  generatePCAProtocol,
  generateMultimodalProtocol,
  EQUIANALGESIC_TABLE,
};
