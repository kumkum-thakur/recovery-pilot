/**
 * Wound Healing Stage Classifier for Post-Operative Recovery
 *
 * Implements three established clinical wound assessment systems:
 * 1. Wagner Wound Classification (grades 0-5) for diabetic foot ulcers
 * 2. Braden Scale for Pressure Injury Risk (6 subscales, scores 6-23)
 * 3. PUSH Tool (Pressure Ulcer Scale for Healing) scoring
 *
 * Also includes a decision tree classifier for wound stage classification
 * based on wound characteristics.
 *
 * Features:
 * - Wagner classification grades 0-5
 * - Full Braden Scale with 6 subscales
 * - PUSH Tool scoring system
 * - Decision tree wound stage classifier
 * - Self-learning: adjusts thresholds based on clinician corrections
 *
 * No external dependencies. Pure TypeScript.
 */

// ============================================================================
// Constants & Types
// ============================================================================

export const WagnerGrade = {
  GRADE_0: 0,
  GRADE_1: 1,
  GRADE_2: 2,
  GRADE_3: 3,
  GRADE_4: 4,
  GRADE_5: 5,
} as const;
export type WagnerGrade = typeof WagnerGrade[keyof typeof WagnerGrade];

export const WagnerDescription = {
  [WagnerGrade.GRADE_0]: 'No open lesion; may have deformity or cellulitis',
  [WagnerGrade.GRADE_1]: 'Superficial diabetic ulcer (partial or full thickness)',
  [WagnerGrade.GRADE_2]: 'Ulcer extension to ligament, tendon, joint capsule, or deep fascia; no abscess or osteomyelitis',
  [WagnerGrade.GRADE_3]: 'Deep ulcer with abscess, osteomyelitis, or joint sepsis',
  [WagnerGrade.GRADE_4]: 'Gangrene localized to forefoot',
  [WagnerGrade.GRADE_5]: 'Extensive gangrene involving whole foot',
} as const;

export const TissueType = {
  EPITHELIAL: 'epithelial',
  GRANULATION: 'granulation',
  SLOUGH: 'slough',
  NECROTIC: 'necrotic',
  ESCHAR: 'eschar',
  MIXED: 'mixed',
} as const;
export type TissueType = typeof TissueType[keyof typeof TissueType];

export const ExudateType = {
  NONE: 'none',
  SEROUS: 'serous',
  SEROSANGUINEOUS: 'serosanguineous',
  SANGUINEOUS: 'sanguineous',
  PURULENT: 'purulent',
} as const;
export type ExudateType = typeof ExudateType[keyof typeof ExudateType];

export const ExudateAmount = {
  NONE: 'none',
  LIGHT: 'light',
  MODERATE: 'moderate',
  HEAVY: 'heavy',
} as const;
export type ExudateAmount = typeof ExudateAmount[keyof typeof ExudateAmount];

export const WoundEdge = {
  WELL_DEFINED: 'well_defined',
  DIFFUSE: 'diffuse',
  ROLLED: 'rolled',
  UNDERMINED: 'undermined',
  TUNNELING: 'tunneling',
} as const;
export type WoundEdge = typeof WoundEdge[keyof typeof WoundEdge];

export const PeriwoundCondition = {
  HEALTHY: 'healthy',
  ERYTHEMA: 'erythema',
  MACERATED: 'macerated',
  INDURATED: 'indurated',
  EDEMATOUS: 'edematous',
  CALLUSED: 'callused',
} as const;
export type PeriwoundCondition = typeof PeriwoundCondition[keyof typeof PeriwoundCondition];

export const HealingPhase = {
  HEMOSTASIS: 'hemostasis',
  INFLAMMATORY: 'inflammatory',
  PROLIFERATIVE: 'proliferative',
  MATURATION: 'maturation',
  CHRONIC_NON_HEALING: 'chronic_non_healing',
  DETERIORATING: 'deteriorating',
} as const;
export type HealingPhase = typeof HealingPhase[keyof typeof HealingPhase];

export type WoundAssessment = {
  woundId: string;
  lengthCm: number;
  widthCm: number;
  depthCm: number;
  tissueType: TissueType;
  exudateType: ExudateType;
  exudateAmount: ExudateAmount;
  woundEdge: WoundEdge;
  periwoundCondition: PeriwoundCondition;
  hasOdor: boolean;
  hasTunneling: boolean;
  tunnelingDepthCm: number;
  hasUndermining: boolean;
  underminingCm: number;
  painLevel: number; // 0-10
  temperatureElevated: boolean;
  surroundingErythemaCm: number;
  daysSinceOnset: number;
  isPostSurgical: boolean;
  hasInfectionSigns: boolean;
  hasBoneExposure: boolean;
  hasTendonExposure: boolean;
  hasGangrene: boolean;
  gangreneExtent: 'none' | 'localized' | 'extensive';
};

export type BradenScaleInput = {
  sensoryPerception: 1 | 2 | 3 | 4;  // 1=completely limited, 4=no impairment
  moisture: 1 | 2 | 3 | 4;            // 1=constantly moist, 4=rarely moist
  activity: 1 | 2 | 3 | 4;            // 1=bedfast, 4=walks frequently
  mobility: 1 | 2 | 3 | 4;            // 1=completely immobile, 4=no limitations
  nutrition: 1 | 2 | 3 | 4;           // 1=very poor, 4=excellent
  frictionShear: 1 | 2 | 3;           // 1=problem, 3=no apparent problem
};

export type BradenScaleResult = {
  totalScore: number;
  maxScore: number;
  riskLevel: string;
  subscores: {
    sensoryPerception: number;
    moisture: number;
    activity: number;
    mobility: number;
    nutrition: number;
    frictionShear: number;
  };
  recommendations: string[];
};

export type PUSHScoreResult = {
  totalScore: number;
  maxScore: number;
  components: {
    lengthWidth: number;    // 0-10
    exudateAmount: number;  // 0-3
    surfaceType: number;    // 0-4
  };
  healingTrajectory: string;
};

export type WagnerClassificationResult = {
  grade: WagnerGrade;
  description: string;
  managementRecommendation: string;
  requiresSurgicalConsult: boolean;
  requiresVascularAssessment: boolean;
};

export type DecisionTreeResult = {
  healingPhase: HealingPhase;
  confidence: number;
  featureImportance: Array<{ feature: string; importance: number }>;
  explanation: string;
};

export type ComprehensiveWoundResult = {
  wagnerClassification: WagnerClassificationResult;
  bradenScale: BradenScaleResult | null;
  pushScore: PUSHScoreResult;
  decisionTreeClassification: DecisionTreeResult;
  overallRisk: string;
  recommendations: string[];
};

export type CorrectionRecord = {
  woundId: string;
  predictedPhase: HealingPhase;
  correctedPhase: HealingPhase;
  timestamp: number;
  clinicianId: string;
};

// ============================================================================
// Wagner Classification
// ============================================================================

function classifyWagner(assessment: WoundAssessment): WagnerClassificationResult {
  let grade: WagnerGrade;
  let managementRecommendation: string;
  let requiresSurgicalConsult = false;
  let requiresVascularAssessment = false;

  if (assessment.gangreneExtent === 'extensive') {
    grade = WagnerGrade.GRADE_5;
    managementRecommendation = 'Emergent surgical consultation. Major amputation likely required. Vascular surgery assessment critical.';
    requiresSurgicalConsult = true;
    requiresVascularAssessment = true;
  } else if (assessment.gangreneExtent === 'localized' || assessment.hasGangrene) {
    grade = WagnerGrade.GRADE_4;
    managementRecommendation = 'Urgent surgical referral. Partial amputation or revascularization may be needed. Aggressive infection control.';
    requiresSurgicalConsult = true;
    requiresVascularAssessment = true;
  } else if (assessment.hasBoneExposure || (assessment.hasInfectionSigns && assessment.depthCm > 2)) {
    grade = WagnerGrade.GRADE_3;
    managementRecommendation = 'Deep infection management required. IV antibiotics, surgical debridement. Rule out osteomyelitis (MRI/bone biopsy).';
    requiresSurgicalConsult = true;
    requiresVascularAssessment = true;
  } else if (assessment.hasTendonExposure || assessment.depthCm > 0.5 || assessment.hasUndermining || assessment.hasTunneling) {
    grade = WagnerGrade.GRADE_2;
    managementRecommendation = 'Wound care with debridement as needed. Offloading device. Monitor for deep infection. Consider advanced wound therapy.';
    requiresVascularAssessment = true;
  } else if (assessment.depthCm > 0 && assessment.depthCm <= 0.5 && !assessment.hasBoneExposure && !assessment.hasTendonExposure) {
    grade = WagnerGrade.GRADE_1;
    managementRecommendation = 'Local wound care. Offloading. Daily dressing changes. Monitor for progression. Optimize glucose control.';
  } else {
    grade = WagnerGrade.GRADE_0;
    managementRecommendation = 'Preventive care. Proper footwear. Skin inspections. Moisturizer. Podiatric follow-up. Address deformities.';
  }

  return {
    grade,
    description: WagnerDescription[grade],
    managementRecommendation,
    requiresSurgicalConsult,
    requiresVascularAssessment,
  };
}

// ============================================================================
// Braden Scale
// ============================================================================

function computeBradenScale(input: BradenScaleInput): BradenScaleResult {
  const totalScore = input.sensoryPerception + input.moisture + input.activity +
    input.mobility + input.nutrition + input.frictionShear;

  // Braden Scale risk levels per Braden & Bergstrom
  const riskLevel =
    totalScore <= 9 ? 'very_high_risk' :
    totalScore <= 12 ? 'high_risk' :
    totalScore <= 14 ? 'moderate_risk' :
    totalScore <= 18 ? 'mild_risk' : 'no_risk';

  const recommendations: string[] = [];

  if (totalScore <= 9) {
    recommendations.push('Implement maximum pressure redistribution protocol');
    recommendations.push('Reposition every 1-2 hours');
    recommendations.push('Use specialty pressure-redistribution mattress');
    recommendations.push('Nutritional consultation for wound healing support');
    recommendations.push('Moisture management with barrier cream');
  } else if (totalScore <= 12) {
    recommendations.push('Use pressure-redistribution mattress');
    recommendations.push('Reposition every 2 hours');
    recommendations.push('Protect bony prominences with foam dressings');
    recommendations.push('Assess and optimize nutritional intake');
  } else if (totalScore <= 14) {
    recommendations.push('Reposition every 2-4 hours');
    recommendations.push('Use pressure-redistribution cushion for sitting');
    recommendations.push('Keep skin clean and dry');
    recommendations.push('Ensure adequate protein intake');
  } else if (totalScore <= 18) {
    recommendations.push('Standard pressure injury prevention protocol');
    recommendations.push('Reposition at least every 4 hours');
    recommendations.push('Maintain skin moisture balance');
  }

  if (input.nutrition <= 2) {
    recommendations.push('Nutritional supplementation: high protein, vitamin C, zinc');
  }
  if (input.moisture <= 2) {
    recommendations.push('Apply moisture barrier cream. Consider incontinence management.');
  }
  if (input.frictionShear === 1) {
    recommendations.push('Use lift sheets for repositioning. Apply heel protection.');
  }

  return {
    totalScore,
    maxScore: 23,
    riskLevel,
    subscores: {
      sensoryPerception: input.sensoryPerception,
      moisture: input.moisture,
      activity: input.activity,
      mobility: input.mobility,
      nutrition: input.nutrition,
      frictionShear: input.frictionShear,
    },
    recommendations,
  };
}

// ============================================================================
// PUSH Tool (Pressure Ulcer Scale for Healing)
// ============================================================================

function computePUSHScore(assessment: WoundAssessment): PUSHScoreResult {
  const area = assessment.lengthCm * assessment.widthCm;

  // Length x Width score (0-10)
  const lengthWidth =
    area === 0 ? 0 :
    area < 0.3 ? 1 :
    area < 0.7 ? 2 :
    area < 1.0 ? 3 :
    area < 2.0 ? 4 :
    area < 3.0 ? 5 :
    area < 4.0 ? 6 :
    area < 8.0 ? 7 :
    area < 12.0 ? 8 :
    area < 24.0 ? 9 : 10;

  // Exudate Amount score (0-3)
  const exudateScore =
    assessment.exudateAmount === ExudateAmount.NONE ? 0 :
    assessment.exudateAmount === ExudateAmount.LIGHT ? 1 :
    assessment.exudateAmount === ExudateAmount.MODERATE ? 2 : 3;

  // Surface Type score (0-4)
  const surfaceType =
    assessment.tissueType === TissueType.EPITHELIAL ? 0 :  // closed/resurfaced = 0
    assessment.tissueType === TissueType.GRANULATION ? 1 :
    assessment.tissueType === TissueType.SLOUGH ? 2 :
    assessment.tissueType === TissueType.NECROTIC ? 3 :
    assessment.tissueType === TissueType.ESCHAR ? 4 : 2; // mixed defaults to slough score

  const totalScore = lengthWidth + exudateScore + surfaceType;
  const maxScore = 17;

  const healingTrajectory =
    totalScore === 0 ? 'healed' :
    totalScore <= 5 ? 'healing_well' :
    totalScore <= 10 ? 'healing_slowly' :
    totalScore <= 14 ? 'stalled' : 'deteriorating';

  return {
    totalScore,
    maxScore,
    components: { lengthWidth, exudateAmount: exudateScore, surfaceType },
    healingTrajectory,
  };
}

// ============================================================================
// Decision Tree Classifier for Healing Phase
// ============================================================================

type DecisionNode = {
  type: 'leaf';
  phase: HealingPhase;
  confidence: number;
  explanation: string;
} | {
  type: 'branch';
  feature: string;
  threshold: number;
  comparator: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
  trueNode: DecisionNode;
  falseNode: DecisionNode;
};

function extractNumericFeature(assessment: WoundAssessment, feature: string): number {
  const featureMap: Record<string, number> = {
    area: assessment.lengthCm * assessment.widthCm,
    depth: assessment.depthCm,
    daysSinceOnset: assessment.daysSinceOnset,
    painLevel: assessment.painLevel,
    surroundingErythema: assessment.surroundingErythemaCm,
    tunneling: assessment.hasTunneling ? assessment.tunnelingDepthCm : 0,
    undermining: assessment.hasUndermining ? assessment.underminingCm : 0,
    hasInfection: assessment.hasInfectionSigns ? 1 : 0,
    hasOdor: assessment.hasOdor ? 1 : 0,
    tempElevated: assessment.temperatureElevated ? 1 : 0,
    tissueScore: assessment.tissueType === TissueType.EPITHELIAL ? 0 :
                 assessment.tissueType === TissueType.GRANULATION ? 1 :
                 assessment.tissueType === TissueType.SLOUGH ? 2 :
                 assessment.tissueType === TissueType.NECROTIC ? 3 :
                 assessment.tissueType === TissueType.ESCHAR ? 4 : 2,
    exudateScore: assessment.exudateAmount === ExudateAmount.NONE ? 0 :
                  assessment.exudateAmount === ExudateAmount.LIGHT ? 1 :
                  assessment.exudateAmount === ExudateAmount.MODERATE ? 2 : 3,
    isPostSurgical: assessment.isPostSurgical ? 1 : 0,
  };
  return featureMap[feature] ?? 0;
}

// Build the decision tree
function buildDecisionTree(): DecisionNode {
  return {
    type: 'branch',
    feature: 'area',
    threshold: 0.01,
    comparator: 'lt',
    // Nearly closed wound
    trueNode: {
      type: 'leaf',
      phase: HealingPhase.MATURATION,
      confidence: 0.85,
      explanation: 'Wound area is minimal, indicating maturation/remodeling phase',
    },
    falseNode: {
      type: 'branch',
      feature: 'hasInfection',
      threshold: 0.5,
      comparator: 'gt',
      // Infection present
      trueNode: {
        type: 'branch',
        feature: 'tissueScore',
        threshold: 2.5,
        comparator: 'gt',
        // Necrotic/eschar tissue with infection
        trueNode: {
          type: 'leaf',
          phase: HealingPhase.DETERIORATING,
          confidence: 0.9,
          explanation: 'Infection with necrotic tissue indicates deteriorating wound requiring urgent intervention',
        },
        // Granulation/slough tissue with infection
        falseNode: {
          type: 'leaf',
          phase: HealingPhase.INFLAMMATORY,
          confidence: 0.75,
          explanation: 'Infection signs with viable tissue suggest prolonged inflammatory phase',
        },
      },
      // No infection
      falseNode: {
        type: 'branch',
        feature: 'daysSinceOnset',
        threshold: 3,
        comparator: 'lte',
        // Early wound
        trueNode: {
          type: 'branch',
          feature: 'isPostSurgical',
          threshold: 0.5,
          comparator: 'gt',
          trueNode: {
            type: 'leaf',
            phase: HealingPhase.HEMOSTASIS,
            confidence: 0.88,
            explanation: 'Recent post-surgical wound in hemostasis/early healing phase',
          },
          falseNode: {
            type: 'leaf',
            phase: HealingPhase.INFLAMMATORY,
            confidence: 0.8,
            explanation: 'Recent wound in early inflammatory phase',
          },
        },
        // Older wound
        falseNode: {
          type: 'branch',
          feature: 'tissueScore',
          threshold: 1.5,
          comparator: 'lt',
          // Epithelial or granulation tissue
          trueNode: {
            type: 'branch',
            feature: 'exudateScore',
            threshold: 1.5,
            comparator: 'lt',
            trueNode: {
              type: 'leaf',
              phase: HealingPhase.PROLIFERATIVE,
              confidence: 0.85,
              explanation: 'Granulation tissue with minimal exudate indicates active proliferative healing',
            },
            falseNode: {
              type: 'leaf',
              phase: HealingPhase.INFLAMMATORY,
              confidence: 0.7,
              explanation: 'Granulation tissue but moderate exudate suggests lingering inflammation',
            },
          },
          // Slough, necrotic, or eschar
          falseNode: {
            type: 'branch',
            feature: 'daysSinceOnset',
            threshold: 30,
            comparator: 'gt',
            // Chronic wound
            trueNode: {
              type: 'leaf',
              phase: HealingPhase.CHRONIC_NON_HEALING,
              confidence: 0.82,
              explanation: 'Wound >30 days with non-viable tissue indicates chronic non-healing state',
            },
            // Sub-acute wound with bad tissue
            falseNode: {
              type: 'leaf',
              phase: HealingPhase.INFLAMMATORY,
              confidence: 0.65,
              explanation: 'Non-viable tissue present but wound age suggests delayed inflammatory phase',
            },
          },
        },
      },
    },
  };
}

function classifyWithTree(assessment: WoundAssessment, node: DecisionNode): DecisionTreeResult {
  const featureImportance: Array<{ feature: string; importance: number }> = [];
  let currentNode = node;
  let pathDepth = 0;

  while (currentNode.type !== 'leaf') {
    const featureValue = extractNumericFeature(assessment, currentNode.feature);
    const threshold = currentNode.threshold;
    let condition = false;

    switch (currentNode.comparator) {
      case 'lt': condition = featureValue < threshold; break;
      case 'gt': condition = featureValue > threshold; break;
      case 'eq': condition = featureValue === threshold; break;
      case 'lte': condition = featureValue <= threshold; break;
      case 'gte': condition = featureValue >= threshold; break;
    }

    featureImportance.push({
      feature: currentNode.feature,
      importance: 1 / (pathDepth + 1), // Higher importance for earlier splits
    });

    currentNode = condition ? currentNode.trueNode : currentNode.falseNode;
    pathDepth++;
  }

  return {
    healingPhase: currentNode.phase,
    confidence: currentNode.confidence,
    featureImportance,
    explanation: currentNode.explanation,
  };
}

// ============================================================================
// Storage & Self-Learning
// ============================================================================

const STORAGE_PREFIX = 'recovery_pilot_whc_';
const STORAGE_KEYS = {
  CORRECTIONS: `${STORAGE_PREFIX}corrections`,
  THRESHOLD_ADJUSTMENTS: `${STORAGE_PREFIX}threshold_adj`,
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
// WoundHealingClassifier Class
// ============================================================================

export class WoundHealingClassifier {
  private decisionTree: DecisionNode;
  private corrections: CorrectionRecord[];
  private confidenceAdjustments: Map<HealingPhase, number>;

  constructor() {
    this.decisionTree = buildDecisionTree();
    this.corrections = loadFromStorage<CorrectionRecord[]>(STORAGE_KEYS.CORRECTIONS, []);
    const adjustmentEntries = loadFromStorage<Array<[HealingPhase, number]>>(STORAGE_KEYS.THRESHOLD_ADJUSTMENTS, []);
    this.confidenceAdjustments = new Map(adjustmentEntries);
  }

  /**
   * Classify using Wagner system
   */
  classifyWagner(assessment: WoundAssessment): WagnerClassificationResult {
    return classifyWagner(assessment);
  }

  /**
   * Compute Braden Scale score
   */
  computeBradenScale(input: BradenScaleInput): BradenScaleResult {
    return computeBradenScale(input);
  }

  /**
   * Compute PUSH score
   */
  computePUSHScore(assessment: WoundAssessment): PUSHScoreResult {
    return computePUSHScore(assessment);
  }

  /**
   * Classify wound healing phase using decision tree
   */
  classifyHealingPhase(assessment: WoundAssessment): DecisionTreeResult {
    const result = classifyWithTree(assessment, this.decisionTree);

    // Apply confidence adjustment from self-learning
    const adjustment = this.confidenceAdjustments.get(result.healingPhase);
    if (adjustment !== undefined) {
      result.confidence = Math.max(0.1, Math.min(0.99, result.confidence + adjustment));
    }

    return result;
  }

  /**
   * Comprehensive wound assessment combining all systems
   */
  assessWound(assessment: WoundAssessment, bradenInput?: BradenScaleInput): ComprehensiveWoundResult {
    const wagner = this.classifyWagner(assessment);
    const braden = bradenInput ? this.computeBradenScale(bradenInput) : null;
    const push = this.computePUSHScore(assessment);
    const dtResult = this.classifyHealingPhase(assessment);

    // Overall risk combining Wagner and PUSH
    const overallRisk =
      wagner.grade >= 4 ? 'critical' :
      wagner.grade >= 3 ? 'high' :
      push.totalScore >= 12 ? 'high' :
      wagner.grade >= 2 || push.totalScore >= 8 ? 'moderate' :
      push.totalScore >= 4 ? 'mild' : 'low';

    const recommendations = this.generateRecommendations(assessment, wagner, braden, push, dtResult);

    return {
      wagnerClassification: wagner,
      bradenScale: braden,
      pushScore: push,
      decisionTreeClassification: dtResult,
      overallRisk,
      recommendations,
    };
  }

  /**
   * Record a clinician correction for self-learning
   */
  recordCorrection(woundId: string, predictedPhase: HealingPhase, correctedPhase: HealingPhase, clinicianId: string): void {
    this.corrections.push({
      woundId,
      predictedPhase,
      correctedPhase,
      timestamp: Date.now(),
      clinicianId,
    });

    // Decrease confidence for the incorrectly predicted phase
    const currentPredAdj = this.confidenceAdjustments.get(predictedPhase) ?? 0;
    this.confidenceAdjustments.set(predictedPhase, currentPredAdj - 0.02);

    // Increase confidence for the correct phase
    const currentCorrAdj = this.confidenceAdjustments.get(correctedPhase) ?? 0;
    this.confidenceAdjustments.set(correctedPhase, currentCorrAdj + 0.01);

    this.persistState();
  }

  /**
   * Get accuracy based on correction history
   */
  getCorrectionStats(): {
    totalCorrections: number;
    accuracyByPhase: Record<string, { correct: number; total: number; accuracy: number }>;
  } {
    const phaseStats: Record<string, { correct: number; total: number }> = {};

    for (const corr of this.corrections) {
      if (!phaseStats[corr.predictedPhase]) {
        phaseStats[corr.predictedPhase] = { correct: 0, total: 0 };
      }
      phaseStats[corr.predictedPhase].total++;
      if (corr.predictedPhase === corr.correctedPhase) {
        phaseStats[corr.predictedPhase].correct++;
      }
    }

    const accuracyByPhase: Record<string, { correct: number; total: number; accuracy: number }> = {};
    for (const [phase, stats] of Object.entries(phaseStats)) {
      accuracyByPhase[phase] = {
        ...stats,
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
      };
    }

    return {
      totalCorrections: this.corrections.length,
      accuracyByPhase,
    };
  }

  /**
   * Get all corrections
   */
  getCorrections(): CorrectionRecord[] {
    return [...this.corrections];
  }

  /**
   * Reset learning state
   */
  resetLearning(): void {
    this.corrections = [];
    this.confidenceAdjustments.clear();
    this.persistState();
  }

  private generateRecommendations(
    assessment: WoundAssessment,
    wagner: WagnerClassificationResult,
    braden: BradenScaleResult | null,
    push: PUSHScoreResult,
    dt: DecisionTreeResult
  ): string[] {
    const recs: string[] = [];

    if (wagner.requiresSurgicalConsult) {
      recs.push('URGENT: Surgical consultation required');
    }
    if (wagner.requiresVascularAssessment) {
      recs.push('Vascular assessment recommended (ABI or duplex ultrasound)');
    }
    if (assessment.hasInfectionSigns) {
      recs.push('Obtain wound culture. Initiate empiric antibiotic therapy. Monitor for systemic infection signs.');
    }
    if (assessment.tissueType === TissueType.NECROTIC || assessment.tissueType === TissueType.ESCHAR) {
      recs.push('Debridement indicated (sharp, enzymatic, or autolytic based on clinical judgment)');
    }
    if (assessment.exudateAmount === ExudateAmount.HEAVY) {
      recs.push('Use absorptive dressing (alginate, hydrofiber). Protect periwound skin with barrier.');
    }
    if (push.healingTrajectory === 'stalled' || push.healingTrajectory === 'deteriorating') {
      recs.push('Consider advanced wound therapy: negative pressure, growth factors, or skin substitute');
    }
    if (dt.healingPhase === HealingPhase.CHRONIC_NON_HEALING) {
      recs.push('Reassess wound etiology. Consider biopsy to rule out malignancy. Address underlying comorbidities.');
    }
    if (braden && braden.totalScore <= 12) {
      recs.push('High pressure injury risk: implement comprehensive prevention protocol');
    }
    if (assessment.periwoundCondition === PeriwoundCondition.MACERATED) {
      recs.push('Apply moisture barrier to periwound skin. Reduce dressing change frequency if appropriate.');
    }
    if (recs.length === 0) {
      recs.push('Continue current wound care regimen. Monitor for signs of healing progression.');
    }

    return recs;
  }

  private persistState(): void {
    saveToStorage(STORAGE_KEYS.CORRECTIONS, this.corrections);
    saveToStorage(STORAGE_KEYS.THRESHOLD_ADJUSTMENTS, [...this.confidenceAdjustments.entries()]);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createWoundHealingClassifier(): WoundHealingClassifier {
  return new WoundHealingClassifier();
}
