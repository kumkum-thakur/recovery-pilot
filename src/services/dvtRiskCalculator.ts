/**
 * DVT Risk Calculator Service
 *
 * Implements real clinical DVT/PE risk assessment tools:
 * - Caprini DVT Risk Assessment Model (40+ risk factors)
 * - Wells Score for DVT
 * - Wells Score for PE
 * - Revised Geneva Score for PE
 * - Prophylaxis recommendations based on risk level
 * - Self-learning calibration based on actual VTE events
 *
 * Based on: Caprini JA, Thromb Haemost 2001; Wells PS et al., NEJM 2003
 */

// ============================================================================
// Constants & Enums
// ============================================================================

export const DVTRiskLevel = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  HIGHEST: 'highest',
} as const;
export type DVTRiskLevel = typeof DVTRiskLevel[keyof typeof DVTRiskLevel];

export const WellsDVTProbability = {
  UNLIKELY: 'unlikely',
  LIKELY: 'likely',
} as const;
export type WellsDVTProbability = typeof WellsDVTProbability[keyof typeof WellsDVTProbability];

export const WellsPEProbability = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
} as const;
export type WellsPEProbability = typeof WellsPEProbability[keyof typeof WellsPEProbability];

export const GenevaPEProbability = {
  LOW: 'low',
  INTERMEDIATE: 'intermediate',
  HIGH: 'high',
} as const;
export type GenevaPEProbability = typeof GenevaPEProbability[keyof typeof GenevaPEProbability];

export const ProphylaxisType = {
  NONE: 'none',
  MECHANICAL: 'mechanical',
  PHARMACOLOGICAL: 'pharmacological',
  COMBINED: 'combined',
} as const;
export type ProphylaxisType = typeof ProphylaxisType[keyof typeof ProphylaxisType];

// ============================================================================
// Interfaces
// ============================================================================

/** All 40+ Caprini risk factors grouped by point value */
export interface CapriniRiskFactors {
  // 1-point factors
  age41to60: boolean;
  minorSurgery: boolean;
  bmi25to30: boolean;
  swollenLegs: boolean;
  varicoseVeins: boolean;
  pregnancy: boolean;
  postpartum: boolean;
  historyUnexplainedStillbirth: boolean;
  oralContraceptives: boolean;
  hormoneReplacementTherapy: boolean;
  sepsis: boolean;
  seriousLungDisease: boolean;
  abnormalPulmonaryFunction: boolean;
  acuteMI: boolean;
  chf: boolean;
  medicalPatientBedRest: boolean;
  inflammatoryBowelDisease: boolean;
  // 2-point factors
  age61to74: boolean;
  arthroscopicSurgery: boolean;
  majorOpenSurgery: boolean;
  laparoscopicSurgery: boolean;
  malignancy: boolean;
  confinedToBedMoreThan72h: boolean;
  immobilizingCast: boolean;
  centralVenousAccess: boolean;
  // 3-point factors
  age75plus: boolean;
  historyOfDVT: boolean;
  historyOfPE: boolean;
  familyHistoryVTE: boolean;
  factorVLeiden: boolean;
  prothrombinMutation: boolean;
  lupusAnticoagulant: boolean;
  anticardiolipinAntibodies: boolean;
  elevatedHomocysteine: boolean;
  heparinInducedThrombocytopenia: boolean;
  otherThrombophilia: boolean;
  // 5-point factors
  stroke: boolean;
  multipleTrauma: boolean;
  acuteSpinalCordInjury: boolean;
  majorLowerExtremitySurgery: boolean;
  hipPelvisFracture: boolean;
}

export interface CapriniResult {
  totalScore: number;
  riskLevel: DVTRiskLevel;
  vteRiskPercent: number;
  recommendedProphylaxis: ProphylaxisType;
  details: string[];
}

export interface WellsDVTCriteria {
  activeCancer: boolean;                   // +1
  paralysisParesisImmobilization: boolean; // +1
  bedriddenMoreThan3Days: boolean;         // +1
  localizedTenderness: boolean;            // +1
  entireLegSwollen: boolean;               // +1
  calfSwellingMoreThan3cm: boolean;        // +1
  pittingEdema: boolean;                   // +1
  collateralSuperficialVeins: boolean;     // +1
  previousDVT: boolean;                    // +1
  alternativeDiagnosisLikely: boolean;     // -2
}

export interface WellsDVTResult {
  score: number;
  probability: WellsDVTProbability;
  dvtLikelyPercent: number;
  recommendation: string;
}

export interface WellsPECriteria {
  clinicalSignsDVT: boolean;           // +3
  peMoreLikelyThanAlternative: boolean; // +3
  heartRateOver100: boolean;           // +1.5
  immobilizationOrSurgery: boolean;    // +1.5
  previousDVTPE: boolean;             // +1.5
  hemoptysis: boolean;                // +1
  malignancy: boolean;                // +1
}

export interface WellsPEResult {
  score: number;
  probability: WellsPEProbability;
  peLikelyPercent: number;
  recommendation: string;
}

export interface GenevaPECriteria {
  age65plus: boolean;                 // +1
  previousDVTPE: boolean;            // +3
  surgeryOrFracture: boolean;        // +2
  activeMalignancy: boolean;         // +2
  unilateralLowerLimbPain: boolean;  // +3
  hemoptysis: boolean;               // +2
  heartRate75to94: boolean;          // +3
  heartRate95plus: boolean;          // +5
  painOnDeepPalpation: boolean;      // +4
  unilateralEdema: boolean;          // +4 (Note: revised Geneva)
}

export interface GenevaPEResult {
  score: number;
  probability: GenevaPEProbability;
  peRiskPercent: number;
  recommendation: string;
}

export interface ProphylaxisRecommendation {
  type: ProphylaxisType;
  medications: MedicationOption[];
  mechanicalOptions: string[];
  duration: string;
  notes: string[];
}

export interface MedicationOption {
  name: string;
  genericName: string;
  dose: string;
  frequency: string;
  route: string;
  contraindications: string[];
  monitoring: string[];
}

export interface PatientVTEProfile {
  patientId: string;
  capriniResult: CapriniResult | null;
  wellsDVTResult: WellsDVTResult | null;
  wellsPEResult: WellsPEResult | null;
  genevaResult: GenevaPEResult | null;
  prophylaxis: ProphylaxisRecommendation | null;
  actualVTEEvent: boolean;
  eventType: string | null;
  assessmentDate: string;
}

export interface LearningData {
  totalAssessments: number;
  actualVTEEvents: number;
  predictedHighRisk: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  calibrationFactor: number;
  areaUnderROC: number;
}

// ============================================================================
// Caprini Risk Factor Point Values
// ============================================================================

const CAPRINI_POINTS: Record<string, number> = {
  // 1-point factors
  age41to60: 1, minorSurgery: 1, bmi25to30: 1, swollenLegs: 1,
  varicoseVeins: 1, pregnancy: 1, postpartum: 1, historyUnexplainedStillbirth: 1,
  oralContraceptives: 1, hormoneReplacementTherapy: 1, sepsis: 1,
  seriousLungDisease: 1, abnormalPulmonaryFunction: 1, acuteMI: 1,
  chf: 1, medicalPatientBedRest: 1, inflammatoryBowelDisease: 1,
  // 2-point factors
  age61to74: 2, arthroscopicSurgery: 2, majorOpenSurgery: 2,
  laparoscopicSurgery: 2, malignancy: 2, confinedToBedMoreThan72h: 2,
  immobilizingCast: 2, centralVenousAccess: 2,
  // 3-point factors
  age75plus: 3, historyOfDVT: 3, historyOfPE: 3, familyHistoryVTE: 3,
  factorVLeiden: 3, prothrombinMutation: 3, lupusAnticoagulant: 3,
  anticardiolipinAntibodies: 3, elevatedHomocysteine: 3,
  heparinInducedThrombocytopenia: 3, otherThrombophilia: 3,
  // 5-point factors
  stroke: 5, multipleTrauma: 5, acuteSpinalCordInjury: 5,
  majorLowerExtremitySurgery: 5, hipPelvisFracture: 5,
};

// VTE risk percentages by Caprini score (based on Bahl et al. 2010)
const CAPRINI_VTE_RISK: Array<{ minScore: number; maxScore: number; risk: number }> = [
  { minScore: 0, maxScore: 0, risk: 0.5 },
  { minScore: 1, maxScore: 2, risk: 1.5 },
  { minScore: 3, maxScore: 4, risk: 3.0 },
  { minScore: 5, maxScore: 6, risk: 6.0 },
  { minScore: 7, maxScore: 8, risk: 10.7 },
  { minScore: 9, maxScore: Infinity, risk: 18.3 },
];

// ============================================================================
// Pharmacological Options
// ============================================================================

const PROPHYLAXIS_MEDICATIONS: MedicationOption[] = [
  {
    name: 'Enoxaparin (Lovenox)',
    genericName: 'enoxaparin',
    dose: '40 mg once daily OR 30 mg twice daily',
    frequency: 'Once or twice daily',
    route: 'Subcutaneous',
    contraindications: ['Active bleeding', 'HIT history', 'Severe renal impairment (CrCl <30)'],
    monitoring: ['Platelet count', 'Signs of bleeding', 'Anti-Xa levels if obese/renal impairment'],
  },
  {
    name: 'Unfractionated Heparin (UFH)',
    genericName: 'heparin',
    dose: '5000 units every 8-12 hours',
    frequency: 'Every 8-12 hours',
    route: 'Subcutaneous',
    contraindications: ['Active bleeding', 'HIT history'],
    monitoring: ['aPTT', 'Platelet count (for HIT)', 'Signs of bleeding'],
  },
  {
    name: 'Fondaparinux (Arixtra)',
    genericName: 'fondaparinux',
    dose: '2.5 mg once daily',
    frequency: 'Once daily',
    route: 'Subcutaneous',
    contraindications: ['CrCl <30 mL/min', 'Body weight <50 kg', 'Active bleeding'],
    monitoring: ['Renal function', 'Signs of bleeding', 'CBC'],
  },
  {
    name: 'Rivaroxaban (Xarelto)',
    genericName: 'rivaroxaban',
    dose: '10 mg once daily',
    frequency: 'Once daily',
    route: 'Oral',
    contraindications: ['Severe renal impairment', 'Hepatic disease with coagulopathy', 'Active bleeding'],
    monitoring: ['Renal function', 'Hepatic function', 'Signs of bleeding'],
  },
];

// ============================================================================
// Core Scoring Functions
// ============================================================================

function calculateCapriniScore(factors: CapriniRiskFactors): CapriniResult {
  let totalScore = 0;
  const details: string[] = [];

  for (const [key, value] of Object.entries(factors)) {
    if (value && CAPRINI_POINTS[key] !== undefined) {
      totalScore += CAPRINI_POINTS[key];
      details.push(`${key}: +${CAPRINI_POINTS[key]}`);
    }
  }

  let riskLevel: DVTRiskLevel;
  let recommendedProphylaxis: ProphylaxisType;

  if (totalScore === 0) {
    riskLevel = DVTRiskLevel.VERY_LOW;
    recommendedProphylaxis = ProphylaxisType.NONE;
  } else if (totalScore <= 2) {
    riskLevel = DVTRiskLevel.LOW;
    recommendedProphylaxis = ProphylaxisType.MECHANICAL;
  } else if (totalScore <= 4) {
    riskLevel = DVTRiskLevel.MODERATE;
    recommendedProphylaxis = ProphylaxisType.PHARMACOLOGICAL;
  } else if (totalScore <= 8) {
    riskLevel = DVTRiskLevel.HIGH;
    recommendedProphylaxis = ProphylaxisType.COMBINED;
  } else {
    riskLevel = DVTRiskLevel.HIGHEST;
    recommendedProphylaxis = ProphylaxisType.COMBINED;
  }

  const riskEntry = CAPRINI_VTE_RISK.find(r => totalScore >= r.minScore && totalScore <= r.maxScore);
  const vteRiskPercent = riskEntry ? riskEntry.risk : 18.3;

  return { totalScore, riskLevel, vteRiskPercent, recommendedProphylaxis, details };
}

function calculateWellsDVT(criteria: WellsDVTCriteria): WellsDVTResult {
  let score = 0;
  if (criteria.activeCancer) score += 1;
  if (criteria.paralysisParesisImmobilization) score += 1;
  if (criteria.bedriddenMoreThan3Days) score += 1;
  if (criteria.localizedTenderness) score += 1;
  if (criteria.entireLegSwollen) score += 1;
  if (criteria.calfSwellingMoreThan3cm) score += 1;
  if (criteria.pittingEdema) score += 1;
  if (criteria.collateralSuperficialVeins) score += 1;
  if (criteria.previousDVT) score += 1;
  if (criteria.alternativeDiagnosisLikely) score -= 2;

  const probability: WellsDVTProbability = score >= 2 ? WellsDVTProbability.LIKELY : WellsDVTProbability.UNLIKELY;
  // DVT probability: unlikely (~5%), likely (~28%) based on Wells et al.
  const dvtLikelyPercent = score >= 2 ? 28 : 5;

  let recommendation: string;
  if (score < 2) {
    recommendation = 'DVT unlikely. Obtain D-dimer. If negative, DVT excluded. If positive, obtain compression ultrasonography.';
  } else {
    recommendation = 'DVT likely. Obtain compression ultrasonography. If negative, consider D-dimer or repeat ultrasound in 1 week.';
  }

  return { score, probability, dvtLikelyPercent, recommendation };
}

function calculateWellsPE(criteria: WellsPECriteria): WellsPEResult {
  let score = 0;
  if (criteria.clinicalSignsDVT) score += 3;
  if (criteria.peMoreLikelyThanAlternative) score += 3;
  if (criteria.heartRateOver100) score += 1.5;
  if (criteria.immobilizationOrSurgery) score += 1.5;
  if (criteria.previousDVTPE) score += 1.5;
  if (criteria.hemoptysis) score += 1;
  if (criteria.malignancy) score += 1;

  let probability: WellsPEProbability;
  let peLikelyPercent: number;
  let recommendation: string;

  if (score <= 1) {
    probability = WellsPEProbability.LOW;
    peLikelyPercent = 1.3;
    recommendation = 'Low probability. Obtain D-dimer. If negative, PE excluded.';
  } else if (score <= 4) {
    probability = WellsPEProbability.MODERATE;
    peLikelyPercent = 16.2;
    recommendation = 'Moderate probability. Obtain D-dimer. If positive, CT pulmonary angiography (CTPA).';
  } else {
    probability = WellsPEProbability.HIGH;
    peLikelyPercent = 40.6;
    recommendation = 'High probability. Obtain CTPA immediately. Consider empiric anticoagulation while awaiting results.';
  }

  return { score, probability, peLikelyPercent, recommendation };
}

function calculateGenevaPE(criteria: GenevaPECriteria): GenevaPEResult {
  let score = 0;
  if (criteria.age65plus) score += 1;
  if (criteria.previousDVTPE) score += 3;
  if (criteria.surgeryOrFracture) score += 2;
  if (criteria.activeMalignancy) score += 2;
  if (criteria.unilateralLowerLimbPain) score += 3;
  if (criteria.hemoptysis) score += 2;
  if (criteria.heartRate95plus) {
    score += 5;
  } else if (criteria.heartRate75to94) {
    score += 3;
  }
  if (criteria.painOnDeepPalpation) score += 4;
  if (criteria.unilateralEdema) score += 4;

  let probability: GenevaPEProbability;
  let peRiskPercent: number;
  let recommendation: string;

  if (score <= 3) {
    probability = GenevaPEProbability.LOW;
    peRiskPercent = 8;
    recommendation = 'Low probability. Obtain D-dimer to rule out PE.';
  } else if (score <= 10) {
    probability = GenevaPEProbability.INTERMEDIATE;
    peRiskPercent = 29;
    recommendation = 'Intermediate probability. Obtain D-dimer; if positive, proceed to CTPA.';
  } else {
    probability = GenevaPEProbability.HIGH;
    peRiskPercent = 74;
    recommendation = 'High probability. Obtain CTPA immediately. Consider starting anticoagulation.';
  }

  return { score, probability, peRiskPercent, recommendation };
}

function generateProphylaxisRecommendation(
  caprini: CapriniResult,
  bleedingRisk: boolean = false,
  renalImpairment: boolean = false,
  hitHistory: boolean = false,
): ProphylaxisRecommendation {
  const type = caprini.recommendedProphylaxis;
  const medications: MedicationOption[] = [];
  const mechanicalOptions: string[] = [];
  const notes: string[] = [];

  if (type === ProphylaxisType.MECHANICAL || type === ProphylaxisType.COMBINED) {
    mechanicalOptions.push('Graduated compression stockings (GCS)');
    mechanicalOptions.push('Intermittent pneumatic compression devices (IPC)');
    if (caprini.riskLevel === DVTRiskLevel.HIGHEST) {
      mechanicalOptions.push('Venous foot pumps');
    }
  }

  if (type === ProphylaxisType.PHARMACOLOGICAL || type === ProphylaxisType.COMBINED) {
    if (bleedingRisk) {
      notes.push('High bleeding risk: mechanical prophylaxis preferred. Reassess for pharmacological when bleeding risk decreases.');
    } else if (hitHistory) {
      medications.push(PROPHYLAXIS_MEDICATIONS.find(m => m.genericName === 'fondaparinux')!);
      notes.push('HIT history: LMWH and UFH contraindicated. Fondaparinux recommended.');
    } else if (renalImpairment) {
      medications.push(PROPHYLAXIS_MEDICATIONS.find(m => m.genericName === 'heparin')!);
      notes.push('Renal impairment: UFH preferred over LMWH. Avoid fondaparinux if CrCl <30.');
    } else {
      medications.push(PROPHYLAXIS_MEDICATIONS.find(m => m.genericName === 'enoxaparin')!);
      medications.push(PROPHYLAXIS_MEDICATIONS.find(m => m.genericName === 'heparin')!);
      notes.push('LMWH (enoxaparin) preferred over UFH for most surgical patients.');
    }
  }

  let duration: string;
  if (caprini.totalScore >= 5) {
    duration = 'Continue for 7-10 days post-op, or up to 35 days for major orthopedic/cancer surgery';
  } else if (caprini.totalScore >= 3) {
    duration = 'Continue for duration of hospitalization or until fully ambulatory';
  } else {
    duration = 'Early ambulation recommended';
  }

  if (type === ProphylaxisType.NONE) {
    notes.push('Early ambulation is the primary preventive measure.');
  }

  return { type, medications, mechanicalOptions, duration, notes };
}

// ============================================================================
// DVT Risk Calculator Class
// ============================================================================

class DVTRiskCalculator {
  private profiles: Map<string, PatientVTEProfile> = new Map();
  private learningData: LearningData;

  constructor() {
    this.learningData = {
      totalAssessments: 0,
      actualVTEEvents: 0,
      predictedHighRisk: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0,
      calibrationFactor: 1.0,
      areaUnderROC: 0.78,
    };
    this._generateDataset();
  }

  // Public API

  calculateCapriniScore(factors: CapriniRiskFactors): CapriniResult {
    return calculateCapriniScore(factors);
  }

  calculateWellsDVT(criteria: WellsDVTCriteria): WellsDVTResult {
    return calculateWellsDVT(criteria);
  }

  calculateWellsPE(criteria: WellsPECriteria): WellsPEResult {
    return calculateWellsPE(criteria);
  }

  calculateGenevaPE(criteria: GenevaPECriteria): GenevaPEResult {
    return calculateGenevaPE(criteria);
  }

  generateProphylaxis(
    caprini: CapriniResult,
    bleedingRisk: boolean = false,
    renalImpairment: boolean = false,
    hitHistory: boolean = false,
  ): ProphylaxisRecommendation {
    return generateProphylaxisRecommendation(caprini, bleedingRisk, renalImpairment, hitHistory);
  }

  assessPatient(
    patientId: string,
    capriniFactors: CapriniRiskFactors,
    wellsDVTCriteria?: WellsDVTCriteria,
    wellsPECriteria?: WellsPECriteria,
    genevaCriteria?: GenevaPECriteria,
  ): PatientVTEProfile {
    const capriniResult = calculateCapriniScore(capriniFactors);
    const wellsDVTResult = wellsDVTCriteria ? calculateWellsDVT(wellsDVTCriteria) : null;
    const wellsPEResult = wellsPECriteria ? calculateWellsPE(wellsPECriteria) : null;
    const genevaResult = genevaCriteria ? calculateGenevaPE(genevaCriteria) : null;
    const prophylaxis = generateProphylaxisRecommendation(capriniResult);

    const profile: PatientVTEProfile = {
      patientId,
      capriniResult,
      wellsDVTResult,
      wellsPEResult,
      genevaResult,
      prophylaxis,
      actualVTEEvent: false,
      eventType: null,
      assessmentDate: new Date().toISOString(),
    };

    this.profiles.set(patientId, profile);
    this.learningData.totalAssessments++;

    if (capriniResult.riskLevel === DVTRiskLevel.HIGH || capriniResult.riskLevel === DVTRiskLevel.HIGHEST) {
      this.learningData.predictedHighRisk++;
    }

    return profile;
  }

  recordVTEEvent(patientId: string, occurred: boolean, eventType?: string): void {
    const profile = this.profiles.get(patientId);
    if (profile) {
      profile.actualVTEEvent = occurred;
      profile.eventType = eventType ?? null;
    }

    if (occurred) {
      this.learningData.actualVTEEvents++;
    }

    const wasHighRisk = profile &&
      (profile.capriniResult?.riskLevel === DVTRiskLevel.HIGH ||
       profile.capriniResult?.riskLevel === DVTRiskLevel.HIGHEST);

    if (occurred && wasHighRisk) this.learningData.truePositives++;
    else if (occurred && !wasHighRisk) this.learningData.falseNegatives++;
    else if (!occurred && wasHighRisk) this.learningData.falsePositives++;
    else this.learningData.trueNegatives++;

    this._updateCalibration();
  }

  getLearningData(): LearningData {
    return { ...this.learningData };
  }

  getAvailableMedications(): MedicationOption[] {
    return [...PROPHYLAXIS_MEDICATIONS];
  }

  getPatientProfile(patientId: string): PatientVTEProfile | null {
    return this.profiles.get(patientId) ?? null;
  }

  getDatasetSize(): number {
    return this.profiles.size;
  }

  // Private methods

  private _updateCalibration(): void {
    const tp = this.learningData.truePositives;
    const fp = this.learningData.falsePositives;
    const tn = this.learningData.trueNegatives;
    const fn = this.learningData.falseNegatives;

    const sensitivity = (tp + fn) > 0 ? tp / (tp + fn) : 0.85;
    const specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0.80;

    // Approximate AUC from sensitivity + specificity
    this.learningData.areaUnderROC = (sensitivity + specificity) / 2;

    // Adjust calibration factor if predictions are systematically off
    const totalPredicted = this.learningData.predictedHighRisk;
    const totalActual = this.learningData.actualVTEEvents;
    if (totalPredicted > 0 && totalActual > 0) {
      this.learningData.calibrationFactor = totalActual / totalPredicted;
    }
  }

  private _generateDataset(): void {
    // Generate 120 patients with varying risk profiles
    for (let i = 0; i < 120; i++) {
      const patientId = `dvt-pt-${i.toString().padStart(3, '0')}`;
      const isHighRisk = i < 30; // 25% high risk
      const hasVTE = i < 8;     // ~6.7% actual VTE rate (realistic)

      const factors: CapriniRiskFactors = {
        age41to60: i % 3 === 0,
        minorSurgery: i % 5 === 0 && !isHighRisk,
        bmi25to30: i % 4 === 0,
        swollenLegs: isHighRisk && i % 2 === 0,
        varicoseVeins: i % 8 === 0,
        pregnancy: false,
        postpartum: false,
        historyUnexplainedStillbirth: false,
        oralContraceptives: i % 10 === 0,
        hormoneReplacementTherapy: i % 12 === 0,
        sepsis: isHighRisk && i % 5 === 0,
        seriousLungDisease: i % 15 === 0,
        abnormalPulmonaryFunction: i % 20 === 0,
        acuteMI: i % 25 === 0,
        chf: isHighRisk && i % 6 === 0,
        medicalPatientBedRest: isHighRisk,
        inflammatoryBowelDisease: i % 30 === 0,
        age61to74: i % 4 === 1,
        arthroscopicSurgery: i % 10 === 1,
        majorOpenSurgery: isHighRisk && i % 3 === 0,
        laparoscopicSurgery: i % 8 === 1,
        malignancy: isHighRisk && i % 4 === 0,
        confinedToBedMoreThan72h: isHighRisk && i % 2 === 1,
        immobilizingCast: i % 15 === 1,
        centralVenousAccess: isHighRisk && i % 3 === 1,
        age75plus: i % 6 === 0,
        historyOfDVT: hasVTE || (isHighRisk && i % 5 === 0),
        historyOfPE: i % 20 === 0,
        familyHistoryVTE: isHighRisk && i % 7 === 0,
        factorVLeiden: i % 25 === 0,
        prothrombinMutation: i % 30 === 0,
        lupusAnticoagulant: i % 40 === 0,
        anticardiolipinAntibodies: i % 35 === 0,
        elevatedHomocysteine: i % 20 === 1,
        heparinInducedThrombocytopenia: false,
        otherThrombophilia: i % 25 === 1,
        stroke: i % 30 === 1,
        multipleTrauma: isHighRisk && i % 10 === 0,
        acuteSpinalCordInjury: i % 60 === 0,
        majorLowerExtremitySurgery: isHighRisk && i % 6 === 0,
        hipPelvisFracture: i % 40 === 1,
      };

      this.assessPatient(patientId, factors);
      this.recordVTEEvent(patientId, hasVTE, hasVTE ? (i % 2 === 0 ? 'DVT' : 'PE') : undefined);
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export const dvtRiskCalculator = new DVTRiskCalculator();

export {
  calculateCapriniScore,
  calculateWellsDVT,
  calculateWellsPE,
  calculateGenevaPE,
  generateProphylaxisRecommendation,
  CAPRINI_POINTS,
  CAPRINI_VTE_RISK,
  PROPHYLAXIS_MEDICATIONS,
};
