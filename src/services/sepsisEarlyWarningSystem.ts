/**
 * Sepsis Early Warning System Service
 *
 * Implements real clinical sepsis screening tools:
 * - qSOFA (quick Sequential Organ Failure Assessment)
 * - SIRS (Systemic Inflammatory Response Syndrome) criteria
 * - SOFA (Sequential Organ Failure Assessment) score for 6 organ systems
 * - Time-series monitoring with escalation triggers
 * - Self-learning threshold adjustment based on confirmed sepsis cases
 *
 * Based on Sepsis-3 definitions (Singer et al., JAMA 2016)
 */

// ============================================================================
// Constants & Enums
// ============================================================================

export const SepsisRiskLevel = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type SepsisRiskLevel = typeof SepsisRiskLevel[keyof typeof SepsisRiskLevel];

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
} as const;
export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

export const OrganSystem = {
  RESPIRATION: 'respiration',
  COAGULATION: 'coagulation',
  LIVER: 'liver',
  CARDIOVASCULAR: 'cardiovascular',
  CNS: 'cns',
  RENAL: 'renal',
} as const;
export type OrganSystem = typeof OrganSystem[keyof typeof OrganSystem];

export const SepsisStage = {
  NO_SEPSIS: 'no_sepsis',
  SIRS: 'sirs',
  SEPSIS: 'sepsis',
  SEVERE_SEPSIS: 'severe_sepsis',
  SEPTIC_SHOCK: 'septic_shock',
} as const;
export type SepsisStage = typeof SepsisStage[keyof typeof SepsisStage];

// ============================================================================
// Interfaces
// ============================================================================

export interface VitalSigns {
  timestamp: string;
  temperature: number;       // Celsius
  heartRate: number;         // bpm
  respiratoryRate: number;   // breaths/min
  systolicBP: number;        // mmHg
  diastolicBP: number;       // mmHg
  meanArterialPressure: number; // mmHg
  spo2: number;              // %
  gcsScore: number;          // 3-15
  supplementalO2: boolean;
}

export interface LabValues {
  wbc: number;              // x10^9/L
  lactate: number;          // mmol/L
  plateletCount: number;    // x10^9/L
  bilirubin: number;        // mg/dL
  creatinine: number;       // mg/dL
  pao2: number;             // mmHg
  fio2: number;             // fraction (0.21-1.0)
  urineOutput: number;      // mL/hr over past hour
}

export interface VasopressorInfo {
  dopamine: number;         // mcg/kg/min
  dobutamine: number;       // mcg/kg/min
  epinephrine: number;      // mcg/kg/min
  norepinephrine: number;   // mcg/kg/min
}

export interface QSOFAResult {
  score: number;            // 0-3
  alteredMentation: boolean; // GCS < 15
  lowSystolicBP: boolean;   // SBP <= 100 mmHg
  elevatedRR: boolean;      // RR >= 22
  sepsisLikely: boolean;    // score >= 2
  recommendation: string;
}

export interface SIRSResult {
  criteriaCount: number;    // 0-4
  temperatureAbnormal: boolean;  // <36 or >38.3°C
  heartRateElevated: boolean;    // >90 bpm
  respiratoryRateElevated: boolean; // >20 or PaCO2 <32
  wbcAbnormal: boolean;         // <4 or >12 x10^9/L
  sirsMet: boolean;             // >= 2 criteria
  details: string[];
}

export interface SOFAScore {
  totalScore: number;       // 0-24
  respirationScore: number; // 0-4 (PaO2/FiO2)
  coagulationScore: number; // 0-4 (platelets)
  liverScore: number;       // 0-4 (bilirubin)
  cardiovascularScore: number; // 0-4 (MAP/vasopressors)
  cnsScore: number;         // 0-4 (GCS)
  renalScore: number;       // 0-4 (creatinine/urine output)
  organDysfunction: boolean; // increase >= 2 from baseline
  estimatedMortality: number; // percentage
}

export interface SepsisAlert {
  id: string;
  patientId: string;
  timestamp: string;
  severity: AlertSeverity;
  stage: SepsisStage;
  qsofa: QSOFAResult;
  sirs: SIRSResult;
  sofa: SOFAScore | null;
  riskLevel: SepsisRiskLevel;
  message: string;
  recommendations: string[];
  acknowledged: boolean;
}

export interface PatientTimeSeries {
  patientId: string;
  vitalSigns: VitalSigns[];
  labValues: LabValues[];
  vasopressors: VasopressorInfo;
  alerts: SepsisAlert[];
  confirmedSepsis: boolean;
  sepsisOnsetTime: string | null;
}

export interface LearningData {
  totalCasesEvaluated: number;
  confirmedSepsisCases: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  sensitivity: number;
  specificity: number;
  adjustedQSOFAThreshold: number;
  adjustedSIRSThreshold: number;
  adjustedSOFAThreshold: number;
}

export interface DatasetStatistics {
  totalPatients: number;
  totalVitalReadings: number;
  sepsisPrevalence: number;
  averageQSOFA: number;
  averageSOFA: number;
  alertsGenerated: number;
  riskDistribution: Record<SepsisRiskLevel, number>;
}

// ============================================================================
// SOFA Score Reference Tables (Sepsis-3)
// ============================================================================

const SOFA_RESPIRATION_THRESHOLDS = [
  { maxScore: 0, pao2fio2Min: 400 },
  { maxScore: 1, pao2fio2Min: 300 },
  { maxScore: 2, pao2fio2Min: 200 },   // with respiratory support
  { maxScore: 3, pao2fio2Min: 100 },   // with respiratory support
  { maxScore: 4, pao2fio2Min: 0 },     // <100 with respiratory support
];

const SOFA_COAGULATION_THRESHOLDS = [
  { maxScore: 0, plateletsMin: 150 },
  { maxScore: 1, plateletsMin: 100 },
  { maxScore: 2, plateletsMin: 50 },
  { maxScore: 3, plateletsMin: 20 },
  { maxScore: 4, plateletsMin: 0 },
];

const SOFA_LIVER_THRESHOLDS = [
  { maxScore: 0, bilirubinMax: 1.2 },
  { maxScore: 1, bilirubinMax: 1.9 },
  { maxScore: 2, bilirubinMax: 5.9 },
  { maxScore: 3, bilirubinMax: 11.9 },
  { maxScore: 4, bilirubinMax: Infinity },
];

const SOFA_CNS_THRESHOLDS = [
  { maxScore: 0, gcsMin: 15 },
  { maxScore: 1, gcsMin: 13 },
  { maxScore: 2, gcsMin: 10 },
  { maxScore: 3, gcsMin: 6 },
  { maxScore: 4, gcsMin: 3 },
];

const SOFA_RENAL_THRESHOLDS = [
  { maxScore: 0, creatinineMax: 1.2, urineOutputMin: 500 },
  { maxScore: 1, creatinineMax: 1.9, urineOutputMin: 500 },
  { maxScore: 2, creatinineMax: 3.4, urineOutputMin: 200 },
  { maxScore: 3, creatinineMax: 4.9, urineOutputMin: 200 },
  { maxScore: 4, creatinineMax: Infinity, urineOutputMin: 0 },
];

// Mortality estimates by SOFA score (Vincent et al., Crit Care Med 1998)
const SOFA_MORTALITY_MAP: Record<number, number> = {
  0: 0, 1: 3, 2: 3, 3: 8, 4: 8,
  5: 15, 6: 15, 7: 22, 8: 22,
  9: 33, 10: 33, 11: 50, 12: 50,
  13: 60, 14: 60, 15: 75, 16: 75,
  17: 80, 18: 80, 19: 85, 20: 90,
  21: 92, 22: 95, 23: 97, 24: 99,
};

// ============================================================================
// Helper: Generate unique IDs
// ============================================================================

let _idCounter = 0;
function generateId(prefix: string): string {
  _idCounter++;
  return `${prefix}-${Date.now()}-${_idCounter}-${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================================
// Core Scoring Functions
// ============================================================================

function calculateQSOFA(vitals: VitalSigns): QSOFAResult {
  const alteredMentation = vitals.gcsScore < 15;
  const lowSystolicBP = vitals.systolicBP <= 100;
  const elevatedRR = vitals.respiratoryRate >= 22;

  const score = (alteredMentation ? 1 : 0) + (lowSystolicBP ? 1 : 0) + (elevatedRR ? 1 : 0);
  const sepsisLikely = score >= 2;

  let recommendation = '';
  if (score === 0) {
    recommendation = 'Low risk. Continue routine monitoring.';
  } else if (score === 1) {
    recommendation = 'Monitor closely. Consider infection workup if clinical suspicion.';
  } else if (score === 2) {
    recommendation = 'High risk for sepsis. Obtain blood cultures, lactate. Consider SOFA scoring. Initiate sepsis bundle.';
  } else {
    recommendation = 'CRITICAL: Very high risk. Immediate sepsis bundle. ICU consultation. Blood cultures, broad-spectrum antibiotics within 1 hour.';
  }

  return {
    score,
    alteredMentation,
    lowSystolicBP,
    elevatedRR,
    sepsisLikely,
    recommendation,
  };
}

function calculateSIRS(vitals: VitalSigns, labs: LabValues): SIRSResult {
  const details: string[] = [];

  // Temperature < 36°C or > 38°C (ACCP/SCCM 1992 Consensus)
  const temperatureAbnormal = vitals.temperature < 36 || vitals.temperature > 38;
  if (temperatureAbnormal) {
    details.push(`Temperature abnormal: ${vitals.temperature}°C (normal: 36-38°C)`);
  }

  // Heart rate > 90 bpm
  const heartRateElevated = vitals.heartRate > 90;
  if (heartRateElevated) {
    details.push(`Heart rate elevated: ${vitals.heartRate} bpm (normal: ≤90)`);
  }

  // Respiratory rate > 20 breaths/min
  const respiratoryRateElevated = vitals.respiratoryRate > 20;
  if (respiratoryRateElevated) {
    details.push(`Respiratory rate elevated: ${vitals.respiratoryRate}/min (normal: ≤20)`);
  }

  // WBC < 4 or > 12 x10^9/L
  const wbcAbnormal = labs.wbc < 4 || labs.wbc > 12;
  if (wbcAbnormal) {
    details.push(`WBC abnormal: ${labs.wbc} x10^9/L (normal: 4-12)`);
  }

  const criteriaCount =
    (temperatureAbnormal ? 1 : 0) +
    (heartRateElevated ? 1 : 0) +
    (respiratoryRateElevated ? 1 : 0) +
    (wbcAbnormal ? 1 : 0);

  return {
    criteriaCount,
    temperatureAbnormal,
    heartRateElevated,
    respiratoryRateElevated,
    wbcAbnormal,
    sirsMet: criteriaCount >= 2,
    details,
  };
}

function calculateRespirationSOFA(pao2: number, fio2: number): number {
  const ratio = pao2 / fio2;
  if (ratio >= 400) return 0;
  if (ratio >= 300) return 1;
  if (ratio >= 200) return 2;
  if (ratio >= 100) return 3;
  return 4;
}

function calculateCoagulationSOFA(platelets: number): number {
  if (platelets >= 150) return 0;
  if (platelets >= 100) return 1;
  if (platelets >= 50) return 2;
  if (platelets >= 20) return 3;
  return 4;
}

function calculateLiverSOFA(bilirubin: number): number {
  if (bilirubin < 1.2) return 0;
  if (bilirubin <= 1.9) return 1;
  if (bilirubin <= 5.9) return 2;
  if (bilirubin <= 11.9) return 3;
  return 4;
}

function calculateCardiovascularSOFA(
  map: number,
  vasopressors: VasopressorInfo,
): number {
  // Check vasopressor use first (higher scores)
  if (vasopressors.epinephrine > 0.1 || vasopressors.norepinephrine > 0.1) return 4;
  if (vasopressors.epinephrine > 0 || vasopressors.norepinephrine > 0) return 3;
  if (vasopressors.dopamine > 5) return 3;
  if (vasopressors.dobutamine > 0) return 2;
  if (vasopressors.dopamine > 0 && vasopressors.dopamine <= 5) return 2;
  if (map < 70) return 1;
  return 0;
}

function calculateCNSSOFA(gcs: number): number {
  if (gcs >= 15) return 0;
  if (gcs >= 13) return 1;
  if (gcs >= 10) return 2;
  if (gcs >= 6) return 3;
  return 4;
}

function calculateRenalSOFA(creatinine: number, urineOutput: number): number {
  // Check urine output criteria (24-hour equivalent)
  const daily = urineOutput * 24;
  if (daily < 200) return 4;
  if (daily < 500) return 3;

  // Check creatinine
  if (creatinine >= 5.0) return 4;
  if (creatinine >= 3.5) return 3;
  if (creatinine >= 2.0) return 2;
  if (creatinine >= 1.2) return 1;
  return 0;
}

function calculateSOFA(
  vitals: VitalSigns,
  labs: LabValues,
  vasopressors: VasopressorInfo,
  baselineSOFA: number = 0,
): SOFAScore {
  const respirationScore = calculateRespirationSOFA(labs.pao2, labs.fio2);
  const coagulationScore = calculateCoagulationSOFA(labs.plateletCount);
  const liverScore = calculateLiverSOFA(labs.bilirubin);
  const cardiovascularScore = calculateCardiovascularSOFA(vitals.meanArterialPressure, vasopressors);
  const cnsScore = calculateCNSSOFA(vitals.gcsScore);
  const renalScore = calculateRenalSOFA(labs.creatinine, labs.urineOutput);

  const totalScore = respirationScore + coagulationScore + liverScore +
    cardiovascularScore + cnsScore + renalScore;

  const organDysfunction = (totalScore - baselineSOFA) >= 2;

  const clampedScore = Math.min(totalScore, 24);
  const estimatedMortality = SOFA_MORTALITY_MAP[clampedScore] ?? 99;

  return {
    totalScore,
    respirationScore,
    coagulationScore,
    liverScore,
    cardiovascularScore,
    cnsScore,
    renalScore,
    organDysfunction,
    estimatedMortality,
  };
}

// ============================================================================
// Sepsis Early Warning System Class
// ============================================================================

class SepsisEarlyWarningSystem {
  private patients: Map<string, PatientTimeSeries> = new Map();
  private learningData: LearningData;
  private alertHistory: SepsisAlert[] = [];

  constructor() {
    this.learningData = {
      totalCasesEvaluated: 0,
      confirmedSepsisCases: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0,
      sensitivity: 0.85,
      specificity: 0.80,
      adjustedQSOFAThreshold: 2,
      adjustedSIRSThreshold: 2,
      adjustedSOFAThreshold: 2,
    };
    this._generateDataset();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  calculateQSOFA(vitals: VitalSigns): QSOFAResult {
    return calculateQSOFA(vitals);
  }

  calculateSIRS(vitals: VitalSigns, labs: LabValues): SIRSResult {
    return calculateSIRS(vitals, labs);
  }

  calculateSOFA(
    vitals: VitalSigns,
    labs: LabValues,
    vasopressors: VasopressorInfo,
    baselineSOFA: number = 0,
  ): SOFAScore {
    return calculateSOFA(vitals, labs, vasopressors, baselineSOFA);
  }

  screenPatient(
    patientId: string,
    vitals: VitalSigns,
    labs: LabValues,
    vasopressors: VasopressorInfo,
    baselineSOFA: number = 0,
  ): SepsisAlert {
    const qsofa = calculateQSOFA(vitals);
    const sirs = calculateSIRS(vitals, labs);
    const sofa = calculateSOFA(vitals, labs, vasopressors, baselineSOFA);

    const riskLevel = this._determineRiskLevel(qsofa, sirs, sofa, labs.lactate);
    const stage = this._determineSepsisStage(qsofa, sirs, sofa, labs.lactate, vitals);
    const severity = this._determineSeverity(riskLevel);
    const recommendations = this._generateRecommendations(stage, riskLevel, qsofa, sofa, labs);

    const alert: SepsisAlert = {
      id: generateId('sepsis-alert'),
      patientId,
      timestamp: vitals.timestamp,
      severity,
      stage,
      qsofa,
      sirs,
      sofa,
      riskLevel,
      message: this._generateAlertMessage(stage, riskLevel, qsofa.score, sofa.totalScore),
      recommendations,
      acknowledged: false,
    };

    this.alertHistory.push(alert);

    // Update patient time series
    let patient = this.patients.get(patientId);
    if (!patient) {
      patient = {
        patientId,
        vitalSigns: [],
        labValues: [],
        vasopressors,
        alerts: [],
        confirmedSepsis: false,
        sepsisOnsetTime: null,
      };
      this.patients.set(patientId, patient);
    }
    patient.vitalSigns.push(vitals);
    patient.labValues.push(labs);
    patient.alerts.push(alert);

    return alert;
  }

  getPatientTimeSeries(patientId: string): PatientTimeSeries | null {
    return this.patients.get(patientId) ?? null;
  }

  getEscalationTriggers(patientId: string): string[] {
    const patient = this.patients.get(patientId);
    if (!patient || patient.vitalSigns.length < 2) return [];

    const triggers: string[] = [];
    const latest = patient.vitalSigns[patient.vitalSigns.length - 1];
    const previous = patient.vitalSigns[patient.vitalSigns.length - 2];

    // Check for deteriorating trends
    if (latest.systolicBP < previous.systolicBP - 20) {
      triggers.push('Rapid systolic BP decline (>20 mmHg drop)');
    }
    if (latest.heartRate > previous.heartRate + 20) {
      triggers.push('Rapid heart rate increase (>20 bpm rise)');
    }
    if (latest.respiratoryRate > previous.respiratoryRate + 5) {
      triggers.push('Increasing respiratory rate');
    }
    if (latest.temperature > previous.temperature + 1) {
      triggers.push('Rapidly rising temperature');
    }
    if (latest.gcsScore < previous.gcsScore) {
      triggers.push('Declining consciousness (GCS drop)');
    }

    // Check lab trends if available
    if (patient.labValues.length >= 2) {
      const latestLabs = patient.labValues[patient.labValues.length - 1];
      const previousLabs = patient.labValues[patient.labValues.length - 2];

      if (latestLabs.lactate > previousLabs.lactate + 1) {
        triggers.push('Rising lactate (increase >1 mmol/L)');
      }
      if (latestLabs.plateletCount < previousLabs.plateletCount * 0.5) {
        triggers.push('Rapidly falling platelet count (>50% decline)');
      }
    }

    return triggers;
  }

  // Self-learning: record confirmed outcome
  recordOutcome(patientId: string, confirmedSepsis: boolean, onsetTime?: string): void {
    const patient = this.patients.get(patientId);
    if (patient) {
      patient.confirmedSepsis = confirmedSepsis;
      patient.sepsisOnsetTime = onsetTime ?? null;
    }

    this.learningData.totalCasesEvaluated++;

    // Determine if we had alerted for this patient
    const hadAlert = this.alertHistory.some(
      a => a.patientId === patientId &&
        (a.riskLevel === SepsisRiskLevel.HIGH || a.riskLevel === SepsisRiskLevel.CRITICAL),
    );

    if (confirmedSepsis) {
      this.learningData.confirmedSepsisCases++;
      if (hadAlert) {
        this.learningData.truePositives++;
      } else {
        this.learningData.falseNegatives++;
      }
    } else {
      if (hadAlert) {
        this.learningData.falsePositives++;
      } else {
        this.learningData.trueNegatives++;
      }
    }

    this._updateLearningMetrics();
  }

  getLearningData(): LearningData {
    return { ...this.learningData };
  }

  getDatasetStatistics(): DatasetStatistics {
    let totalVitalReadings = 0;
    let sepsisCount = 0;
    let totalQSOFA = 0;
    let totalSOFA = 0;
    let qsofaCount = 0;
    const riskDistribution: Record<SepsisRiskLevel, number> = {
      [SepsisRiskLevel.LOW]: 0,
      [SepsisRiskLevel.MODERATE]: 0,
      [SepsisRiskLevel.HIGH]: 0,
      [SepsisRiskLevel.CRITICAL]: 0,
    };

    for (const patient of this.patients.values()) {
      totalVitalReadings += patient.vitalSigns.length;
      if (patient.confirmedSepsis) sepsisCount++;

      if (patient.alerts.length > 0) {
        const lastAlert = patient.alerts[patient.alerts.length - 1];
        riskDistribution[lastAlert.riskLevel]++;
        totalQSOFA += lastAlert.qsofa.score;
        if (lastAlert.sofa) totalSOFA += lastAlert.sofa.totalScore;
        qsofaCount++;
      } else {
        riskDistribution[SepsisRiskLevel.LOW]++;
      }
    }

    const totalPatients = this.patients.size;

    return {
      totalPatients,
      totalVitalReadings,
      sepsisPrevalence: totalPatients > 0 ? sepsisCount / totalPatients : 0,
      averageQSOFA: qsofaCount > 0 ? totalQSOFA / qsofaCount : 0,
      averageSOFA: qsofaCount > 0 ? totalSOFA / qsofaCount : 0,
      alertsGenerated: this.alertHistory.length,
      riskDistribution,
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private _determineRiskLevel(
    qsofa: QSOFAResult,
    sirs: SIRSResult,
    sofa: SOFAScore,
    lactate: number,
  ): SepsisRiskLevel {
    // Critical: septic shock criteria
    if (sofa.totalScore >= 10 || (lactate > 4 && qsofa.score >= 2)) {
      return SepsisRiskLevel.CRITICAL;
    }

    // High: qSOFA >= 2 or SOFA >= adjusted threshold with organ dysfunction
    if (
      qsofa.score >= this.learningData.adjustedQSOFAThreshold ||
      (sofa.organDysfunction && sofa.totalScore >= this.learningData.adjustedSOFAThreshold + 2)
    ) {
      return SepsisRiskLevel.HIGH;
    }

    // Moderate: SIRS met with some organ impairment
    if (sirs.sirsMet && sofa.totalScore >= this.learningData.adjustedSOFAThreshold) {
      return SepsisRiskLevel.MODERATE;
    }

    // Moderate: high lactate alone
    if (lactate > 2) {
      return SepsisRiskLevel.MODERATE;
    }

    return SepsisRiskLevel.LOW;
  }

  private _determineSepsisStage(
    qsofa: QSOFAResult,
    sirs: SIRSResult,
    sofa: SOFAScore,
    lactate: number,
    vitals: VitalSigns,
  ): SepsisStage {
    // Septic shock: sepsis + vasopressor requirement + lactate > 2
    if (sofa.organDysfunction && lactate > 2 && vitals.systolicBP < 90) {
      return SepsisStage.SEPTIC_SHOCK;
    }

    // Sepsis (Sepsis-3): suspected infection + SOFA increase >= 2
    if (sofa.organDysfunction && qsofa.score >= 2) {
      return SepsisStage.SEPSIS;
    }

    // Severe sepsis (legacy): SIRS + organ dysfunction
    if (sirs.sirsMet && sofa.totalScore >= 2) {
      return SepsisStage.SEVERE_SEPSIS;
    }

    // SIRS
    if (sirs.sirsMet) {
      return SepsisStage.SIRS;
    }

    return SepsisStage.NO_SEPSIS;
  }

  private _determineSeverity(riskLevel: SepsisRiskLevel): AlertSeverity {
    switch (riskLevel) {
      case SepsisRiskLevel.CRITICAL: return AlertSeverity.EMERGENCY;
      case SepsisRiskLevel.HIGH: return AlertSeverity.URGENT;
      case SepsisRiskLevel.MODERATE: return AlertSeverity.WARNING;
      default: return AlertSeverity.INFO;
    }
  }

  private _generateAlertMessage(
    stage: SepsisStage,
    riskLevel: SepsisRiskLevel,
    qsofaScore: number,
    sofaScore: number,
  ): string {
    const stageName = {
      [SepsisStage.NO_SEPSIS]: 'No sepsis',
      [SepsisStage.SIRS]: 'SIRS criteria met',
      [SepsisStage.SEPSIS]: 'Sepsis identified',
      [SepsisStage.SEVERE_SEPSIS]: 'Severe sepsis',
      [SepsisStage.SEPTIC_SHOCK]: 'SEPTIC SHOCK',
    }[stage];

    return `${stageName} (Risk: ${riskLevel.toUpperCase()}) | qSOFA: ${qsofaScore}/3, SOFA: ${sofaScore}/24`;
  }

  private _generateRecommendations(
    stage: SepsisStage,
    _riskLevel: SepsisRiskLevel,
    qsofa: QSOFAResult,
    sofa: SOFAScore,
    labs: LabValues,
  ): string[] {
    const recs: string[] = [];

    if (stage === SepsisStage.SEPTIC_SHOCK) {
      recs.push('IMMEDIATE: Initiate Hour-1 Sepsis Bundle');
      recs.push('Obtain blood cultures before antibiotics');
      recs.push('Administer broad-spectrum antibiotics within 1 hour');
      recs.push('Begin 30 mL/kg crystalloid for hypotension or lactate ≥4');
      recs.push('Start vasopressors if hypotensive after fluid resuscitation (target MAP ≥65 mmHg)');
      recs.push('Remeasure lactate if initial lactate >2 mmol/L');
      recs.push('ICU transfer immediately');
    } else if (stage === SepsisStage.SEPSIS || stage === SepsisStage.SEVERE_SEPSIS) {
      recs.push('Obtain blood cultures (2 sets, aerobic + anaerobic)');
      recs.push('Administer antibiotics within 1 hour of recognition');
      recs.push('Measure serum lactate');
      if (labs.lactate > 2) recs.push('Administer 30 mL/kg crystalloid fluid bolus');
      recs.push('Increase monitoring frequency to every 15 minutes');
      recs.push('Consider ICU consultation');
    } else if (stage === SepsisStage.SIRS) {
      recs.push('Evaluate for source of infection');
      recs.push('Consider blood cultures if infection suspected');
      recs.push('Monitor vitals every 30 minutes');
      recs.push('Reassess with full SOFA scoring');
    }

    if (qsofa.score >= 2) {
      recs.push('qSOFA positive: assess for organ dysfunction');
    }

    if (sofa.respirationScore >= 3) {
      recs.push('Consider mechanical ventilation assessment');
    }

    if (sofa.renalScore >= 3) {
      recs.push('Nephrology consultation for potential renal replacement therapy');
    }

    if (sofa.cardiovascularScore >= 3) {
      recs.push('Hemodynamic monitoring: arterial line, central venous catheter');
    }

    return recs;
  }

  private _updateLearningMetrics(): void {
    const tp = this.learningData.truePositives;
    const fp = this.learningData.falsePositives;
    const tn = this.learningData.trueNegatives;
    const fn = this.learningData.falseNegatives;

    // Update sensitivity (true positive rate)
    this.learningData.sensitivity = (tp + fn) > 0 ? tp / (tp + fn) : 0.85;

    // Update specificity (true negative rate)
    this.learningData.specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0.80;

    // Adjust thresholds if too many false negatives (lower thresholds)
    if (this.learningData.totalCasesEvaluated >= 10) {
      if (this.learningData.sensitivity < 0.80) {
        // Too many missed cases; lower the threshold to catch more
        this.learningData.adjustedQSOFAThreshold = Math.max(1, this.learningData.adjustedQSOFAThreshold - 0.5);
        this.learningData.adjustedSOFAThreshold = Math.max(1, this.learningData.adjustedSOFAThreshold - 0.5);
      } else if (this.learningData.specificity < 0.70 && this.learningData.sensitivity > 0.90) {
        // Too many false alarms and sensitivity is already good; raise threshold
        this.learningData.adjustedQSOFAThreshold = Math.min(3, this.learningData.adjustedQSOFAThreshold + 0.25);
        this.learningData.adjustedSOFAThreshold = Math.min(4, this.learningData.adjustedSOFAThreshold + 0.25);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Dataset Generation
  // --------------------------------------------------------------------------

  private _generateDataset(): void {
    const now = Date.now();

    for (let i = 0; i < 110; i++) {
      const patientId = `sepsis-pt-${i.toString().padStart(3, '0')}`;
      const isSeptic = i < 22; // ~20% sepsis prevalence (realistic ICU)
      const isShock = isSeptic && i < 5;

      const vitalsList: VitalSigns[] = [];
      const labsList: LabValues[] = [];

      // Generate 8-12 time points per patient (hourly)
      const numReadings = 8 + Math.floor(Math.random() * 5);

      for (let t = 0; t < numReadings; t++) {
        const timestamp = new Date(now - (numReadings - t) * 3600000).toISOString();
        const progression = t / numReadings; // 0 to ~1

        let temp: number, hr: number, rr: number, sbp: number, dbp: number, gcs: number, spo2: number;
        let wbc: number, lactate: number, platelets: number, bilirubin: number;
        let creatinine: number, pao2: number, fio2: number, urineOutput: number;

        if (isShock) {
          // Septic shock: progressive deterioration
          temp = 38.5 + progression * 1.5 + (Math.random() - 0.5) * 0.5;
          hr = 100 + progression * 30 + Math.random() * 10;
          rr = 22 + progression * 8 + Math.random() * 4;
          sbp = 95 - progression * 30 + Math.random() * 10;
          dbp = 60 - progression * 15 + Math.random() * 5;
          gcs = Math.max(3, Math.round(15 - progression * 8));
          spo2 = Math.max(82, 96 - progression * 10 + Math.random() * 2);
          wbc = 16 + progression * 8 + Math.random() * 4;
          lactate = 2 + progression * 6 + Math.random();
          platelets = Math.max(10, 180 - progression * 150);
          bilirubin = 1.0 + progression * 8;
          creatinine = 1.0 + progression * 4;
          pao2 = Math.max(50, 90 - progression * 40);
          fio2 = Math.min(1.0, 0.21 + progression * 0.6);
          urineOutput = Math.max(5, 50 - progression * 45);
        } else if (isSeptic) {
          // Sepsis without shock
          temp = 38.0 + progression * 1.0 + (Math.random() - 0.5) * 0.5;
          hr = 90 + progression * 15 + Math.random() * 10;
          rr = 18 + progression * 6 + Math.random() * 3;
          sbp = 110 - progression * 15 + Math.random() * 10;
          dbp = 70 - progression * 8 + Math.random() * 5;
          gcs = Math.max(10, Math.round(15 - progression * 3));
          spo2 = Math.max(88, 97 - progression * 5 + Math.random() * 2);
          wbc = 12 + progression * 6 + Math.random() * 3;
          lactate = 1.5 + progression * 2.5 + Math.random() * 0.5;
          platelets = Math.max(40, 200 - progression * 100);
          bilirubin = 0.8 + progression * 3;
          creatinine = 0.9 + progression * 2;
          pao2 = Math.max(60, 95 - progression * 25);
          fio2 = Math.min(0.6, 0.21 + progression * 0.3);
          urineOutput = Math.max(15, 60 - progression * 35);
        } else {
          // Non-septic (normal with mild variations)
          temp = 36.5 + Math.random() * 1.2;
          hr = 65 + Math.random() * 25;
          rr = 12 + Math.random() * 6;
          sbp = 115 + Math.random() * 25;
          dbp = 70 + Math.random() * 15;
          gcs = 15;
          spo2 = 96 + Math.random() * 3;
          wbc = 5 + Math.random() * 6;
          lactate = 0.5 + Math.random() * 1.2;
          platelets = 150 + Math.random() * 200;
          bilirubin = 0.3 + Math.random() * 0.7;
          creatinine = 0.6 + Math.random() * 0.5;
          pao2 = 85 + Math.random() * 15;
          fio2 = 0.21;
          urineOutput = 40 + Math.random() * 40;
        }

        const map = Math.round(dbp + (sbp - dbp) / 3);

        vitalsList.push({
          timestamp,
          temperature: Math.round(temp * 10) / 10,
          heartRate: Math.round(hr),
          respiratoryRate: Math.round(rr),
          systolicBP: Math.round(sbp),
          diastolicBP: Math.round(dbp),
          meanArterialPressure: map,
          spo2: Math.round(spo2 * 10) / 10,
          gcsScore: Math.round(gcs),
          supplementalO2: fio2 > 0.21,
        });

        labsList.push({
          wbc: Math.round(wbc * 10) / 10,
          lactate: Math.round(lactate * 10) / 10,
          plateletCount: Math.round(platelets),
          bilirubin: Math.round(bilirubin * 10) / 10,
          creatinine: Math.round(creatinine * 10) / 10,
          pao2: Math.round(pao2),
          fio2: Math.round(fio2 * 100) / 100,
          urineOutput: Math.round(urineOutput),
        });
      }

      const vasopressors: VasopressorInfo = isShock
        ? { dopamine: 0, dobutamine: 0, epinephrine: 0, norepinephrine: 0.15 }
        : { dopamine: 0, dobutamine: 0, epinephrine: 0, norepinephrine: 0 };

      // Screen the patient at last time point
      const lastVitals = vitalsList[vitalsList.length - 1];
      const lastLabs = labsList[labsList.length - 1];

      const patient: PatientTimeSeries = {
        patientId,
        vitalSigns: vitalsList,
        labValues: labsList,
        vasopressors,
        alerts: [],
        confirmedSepsis: isSeptic,
        sepsisOnsetTime: isSeptic ? vitalsList[Math.floor(numReadings * 0.3)].timestamp : null,
      };

      this.patients.set(patientId, patient);

      // Run screening on last vitals
      this.screenPatient(patientId, lastVitals, lastLabs, vasopressors);

      // Record outcome for learning
      this.recordOutcome(patientId, isSeptic);
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export const sepsisEarlyWarningSystem = new SepsisEarlyWarningSystem();

export {
  calculateQSOFA,
  calculateSIRS,
  calculateSOFA,
  calculateRespirationSOFA,
  calculateCoagulationSOFA,
  calculateLiverSOFA,
  calculateCardiovascularSOFA,
  calculateCNSSOFA,
  calculateRenalSOFA,
  SOFA_RESPIRATION_THRESHOLDS,
  SOFA_COAGULATION_THRESHOLDS,
  SOFA_LIVER_THRESHOLDS,
  SOFA_CNS_THRESHOLDS,
  SOFA_RENAL_THRESHOLDS,
  SOFA_MORTALITY_MAP,
};
