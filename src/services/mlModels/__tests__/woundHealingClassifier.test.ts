import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  WoundHealingClassifier,
  createWoundHealingClassifier,
  WagnerGrade,
  TissueType,
  ExudateType,
  ExudateAmount,
  WoundEdge,
  PeriwoundCondition,
  HealingPhase,
  type WoundAssessment,
  type BradenScaleInput,
} from '../woundHealingClassifier';

function createTestWound(overrides?: Partial<WoundAssessment>): WoundAssessment {
  return {
    woundId: 'wound-001',
    lengthCm: 2.0,
    widthCm: 1.5,
    depthCm: 0.3,
    tissueType: TissueType.GRANULATION,
    exudateType: ExudateType.SEROUS,
    exudateAmount: ExudateAmount.LIGHT,
    woundEdge: WoundEdge.WELL_DEFINED,
    periwoundCondition: PeriwoundCondition.HEALTHY,
    hasOdor: false,
    hasTunneling: false,
    tunnelingDepthCm: 0,
    hasUndermining: false,
    underminingCm: 0,
    painLevel: 3,
    temperatureElevated: false,
    surroundingErythemaCm: 0,
    daysSinceOnset: 10,
    isPostSurgical: true,
    hasInfectionSigns: false,
    hasBoneExposure: false,
    hasTendonExposure: false,
    hasGangrene: false,
    gangreneExtent: 'none',
    ...overrides,
  };
}

function createTestBraden(overrides?: Partial<BradenScaleInput>): BradenScaleInput {
  return {
    sensoryPerception: 3,
    moisture: 3,
    activity: 3,
    mobility: 3,
    nutrition: 3,
    frictionShear: 2,
    ...overrides,
  };
}

describe('WoundHealingClassifier', () => {
  let classifier: WoundHealingClassifier;

  beforeEach(() => {
    localStorage.clear();
    classifier = createWoundHealingClassifier();
  });

  // ---- Wagner Classification Tests ----

  it('should classify grade 0 (no open lesion)', () => {
    const wound = createTestWound({ depthCm: 0, lengthCm: 0, widthCm: 0, hasGangrene: false, hasBoneExposure: false, hasTendonExposure: false, hasUndermining: false, hasTunneling: false, hasInfectionSigns: false });
    const result = classifier.classifyWagner(wound);
    expect(result.grade).toBe(WagnerGrade.GRADE_0);
    expect(result.requiresSurgicalConsult).toBe(false);
  });

  it('should classify grade 1 (superficial ulcer)', () => {
    const wound = createTestWound({ depthCm: 0.3, hasBoneExposure: false, hasTendonExposure: false, hasUndermining: false, hasTunneling: false, hasInfectionSigns: false, hasGangrene: false, gangreneExtent: 'none' });
    const result = classifier.classifyWagner(wound);
    expect(result.grade).toBe(WagnerGrade.GRADE_1);
  });

  it('should classify grade 2 (deep ulcer to tendon/ligament)', () => {
    const wound = createTestWound({ depthCm: 1.5, hasTendonExposure: true, hasBoneExposure: false, hasGangrene: false, gangreneExtent: 'none', hasInfectionSigns: false });
    const result = classifier.classifyWagner(wound);
    expect(result.grade).toBe(WagnerGrade.GRADE_2);
    expect(result.requiresVascularAssessment).toBe(true);
  });

  it('should classify grade 3 (deep ulcer with abscess/osteomyelitis)', () => {
    const wound = createTestWound({ depthCm: 3, hasBoneExposure: true, hasGangrene: false, gangreneExtent: 'none' });
    const result = classifier.classifyWagner(wound);
    expect(result.grade).toBe(WagnerGrade.GRADE_3);
    expect(result.requiresSurgicalConsult).toBe(true);
  });

  it('should classify grade 4 (localized gangrene)', () => {
    const wound = createTestWound({ hasGangrene: true, gangreneExtent: 'localized' });
    const result = classifier.classifyWagner(wound);
    expect(result.grade).toBe(WagnerGrade.GRADE_4);
    expect(result.requiresSurgicalConsult).toBe(true);
    expect(result.requiresVascularAssessment).toBe(true);
  });

  it('should classify grade 5 (extensive gangrene)', () => {
    const wound = createTestWound({ hasGangrene: true, gangreneExtent: 'extensive' });
    const result = classifier.classifyWagner(wound);
    expect(result.grade).toBe(WagnerGrade.GRADE_5);
    expect(result.requiresSurgicalConsult).toBe(true);
  });

  // ---- Braden Scale Tests ----

  it('should compute Braden Scale score correctly', () => {
    const input = createTestBraden();
    const result = classifier.computeBradenScale(input);
    // 3+3+3+3+3+2 = 17
    expect(result.totalScore).toBe(17);
    expect(result.maxScore).toBe(23);
    expect(result.riskLevel).toBe('mild_risk');
  });

  it('should identify very high risk (Braden <= 9)', () => {
    const input: BradenScaleInput = { sensoryPerception: 1, moisture: 1, activity: 1, mobility: 1, nutrition: 1, frictionShear: 1 };
    const result = classifier.computeBradenScale(input);
    expect(result.totalScore).toBe(6);
    expect(result.riskLevel).toBe('very_high_risk');
    expect(result.recommendations.length).toBeGreaterThan(3);
  });

  it('should identify high risk (Braden 10-12)', () => {
    const input: BradenScaleInput = { sensoryPerception: 2, moisture: 2, activity: 2, mobility: 2, nutrition: 2, frictionShear: 1 };
    const result = classifier.computeBradenScale(input);
    expect(result.totalScore).toBe(11);
    expect(result.riskLevel).toBe('high_risk');
  });

  it('should identify no risk (Braden > 18)', () => {
    const input: BradenScaleInput = { sensoryPerception: 4, moisture: 4, activity: 4, mobility: 4, nutrition: 4, frictionShear: 3 };
    const result = classifier.computeBradenScale(input);
    expect(result.totalScore).toBe(23);
    expect(result.riskLevel).toBe('no_risk');
  });

  it('should generate nutritional recommendation for poor nutrition', () => {
    const input = createTestBraden({ nutrition: 1 });
    const result = classifier.computeBradenScale(input);
    expect(result.recommendations.some(r => r.toLowerCase().includes('nutrition'))).toBe(true);
  });

  // ---- PUSH Tool Tests ----

  it('should compute PUSH score of 1 for epithelial tissue (per PUSH 3.0: epithelial=1, closed=0)', () => {
    const wound = createTestWound({ lengthCm: 0, widthCm: 0, exudateAmount: ExudateAmount.NONE, tissueType: TissueType.EPITHELIAL });
    const result = classifier.computePUSHScore(wound);
    // Per PUSH Tool 3.0: epithelial tissue scores 1 (closed/resurfaced scores 0)
    expect(result.totalScore).toBe(1);
    expect(result.healingTrajectory).toBe('healing_well');
  });

  it('should compute correct PUSH score for small granulating wound', () => {
    const wound = createTestWound({ lengthCm: 1.0, widthCm: 0.5, exudateAmount: ExudateAmount.LIGHT, tissueType: TissueType.GRANULATION });
    const result = classifier.computePUSHScore(wound);
    // Area = 0.5 -> score 2; exudate light -> 1; granulation -> 2 (per PUSH 3.0) = total 5
    expect(result.components.lengthWidth).toBe(2);
    expect(result.components.exudateAmount).toBe(1);
    expect(result.components.surfaceType).toBe(2);
    expect(result.totalScore).toBe(5);
  });

  it('should compute high PUSH score for large necrotic wound', () => {
    const wound = createTestWound({ lengthCm: 6, widthCm: 5, exudateAmount: ExudateAmount.HEAVY, tissueType: TissueType.ESCHAR });
    const result = classifier.computePUSHScore(wound);
    // Area = 30 -> 10; exudate heavy -> 3; eschar -> 4 = total 17
    expect(result.totalScore).toBe(17);
    expect(result.healingTrajectory).toBe('deteriorating');
  });

  // ---- Decision Tree Tests ----

  it('should classify nearly closed wound as maturation', () => {
    const wound = createTestWound({ lengthCm: 0.05, widthCm: 0.05, daysSinceOnset: 30, tissueType: TissueType.EPITHELIAL, hasInfectionSigns: false });
    const result = classifier.classifyHealingPhase(wound);
    expect(result.healingPhase).toBe(HealingPhase.MATURATION);
  });

  it('should classify infected necrotic wound as deteriorating', () => {
    const wound = createTestWound({ lengthCm: 3, widthCm: 2, hasInfectionSigns: true, tissueType: TissueType.NECROTIC, daysSinceOnset: 20 });
    const result = classifier.classifyHealingPhase(wound);
    expect(result.healingPhase).toBe(HealingPhase.DETERIORATING);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should classify recent post-surgical wound as hemostasis', () => {
    const wound = createTestWound({ daysSinceOnset: 1, isPostSurgical: true, hasInfectionSigns: false, lengthCm: 5, widthCm: 0.5 });
    const result = classifier.classifyHealingPhase(wound);
    expect(result.healingPhase).toBe(HealingPhase.HEMOSTASIS);
  });

  it('should classify chronic wound with slough as non-healing', () => {
    const wound = createTestWound({ daysSinceOnset: 60, tissueType: TissueType.SLOUGH, hasInfectionSigns: false, lengthCm: 3, widthCm: 2 });
    const result = classifier.classifyHealingPhase(wound);
    expect(result.healingPhase).toBe(HealingPhase.CHRONIC_NON_HEALING);
  });

  it('should classify granulating wound with low exudate as proliferative', () => {
    const wound = createTestWound({ daysSinceOnset: 14, tissueType: TissueType.GRANULATION, exudateAmount: ExudateAmount.LIGHT, hasInfectionSigns: false, lengthCm: 2, widthCm: 1.5 });
    const result = classifier.classifyHealingPhase(wound);
    expect(result.healingPhase).toBe(HealingPhase.PROLIFERATIVE);
  });

  // ---- Comprehensive Assessment Tests ----

  it('should produce comprehensive wound assessment', () => {
    const wound = createTestWound();
    const braden = createTestBraden();
    const result = classifier.assessWound(wound, braden);

    expect(result.wagnerClassification).toBeDefined();
    expect(result.bradenScale).toBeDefined();
    expect(result.pushScore).toBeDefined();
    expect(result.decisionTreeClassification).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(['low', 'mild', 'moderate', 'high', 'critical']).toContain(result.overallRisk);
  });

  it('should work without Braden input', () => {
    const wound = createTestWound();
    const result = classifier.assessWound(wound);
    expect(result.bradenScale).toBeNull();
    expect(result.wagnerClassification).toBeDefined();
  });

  // ---- Self-Learning Tests ----

  it('should record clinician corrections', () => {
    classifier.recordCorrection('wound-001', HealingPhase.PROLIFERATIVE, HealingPhase.INFLAMMATORY, 'doc-1');
    const stats = classifier.getCorrectionStats();
    expect(stats.totalCorrections).toBe(1);
  });

  it('should adjust confidence based on corrections', () => {
    const wound = createTestWound({ daysSinceOnset: 14, tissueType: TissueType.GRANULATION, exudateAmount: ExudateAmount.LIGHT, hasInfectionSigns: false });
    const initial = classifier.classifyHealingPhase(wound);

    // Record multiple corrections saying model was wrong
    for (let i = 0; i < 10; i++) {
      classifier.recordCorrection(`wound-${i}`, HealingPhase.PROLIFERATIVE, HealingPhase.INFLAMMATORY, 'doc-1');
    }

    const adjusted = classifier.classifyHealingPhase(wound);
    // If the wound was classified as proliferative, confidence should decrease
    if (initial.healingPhase === HealingPhase.PROLIFERATIVE) {
      expect(adjusted.confidence).toBeLessThan(initial.confidence);
    }
  });

  it('should persist corrections to localStorage', () => {
    classifier.recordCorrection('w1', HealingPhase.INFLAMMATORY, HealingPhase.PROLIFERATIVE, 'doc-1');
    const classifier2 = createWoundHealingClassifier();
    expect(classifier2.getCorrections().length).toBe(1);
  });

  it('should reset learning state', () => {
    classifier.recordCorrection('w1', HealingPhase.INFLAMMATORY, HealingPhase.PROLIFERATIVE, 'doc-1');
    classifier.resetLearning();
    expect(classifier.getCorrections().length).toBe(0);
  });

  // ---- Property-Based Tests ----

  it('should always produce Wagner grade 0-5', () => {
    fc.assert(
      fc.property(
        fc.record({
          depth: fc.float({ min: 0, max: 10, noNaN: true }),
          hasBone: fc.boolean(),
          hasTendon: fc.boolean(),
          hasGangrene: fc.boolean(),
          gangreneExtent: fc.constantFrom('none' as const, 'localized' as const, 'extensive' as const),
          hasInfection: fc.boolean(),
          hasUndermining: fc.boolean(),
          hasTunneling: fc.boolean(),
        }),
        (data) => {
          const wound = createTestWound({
            depthCm: data.depth,
            hasBoneExposure: data.hasBone,
            hasTendonExposure: data.hasTendon,
            hasGangrene: data.hasGangrene,
            gangreneExtent: data.gangreneExtent,
            hasInfectionSigns: data.hasInfection,
            hasUndermining: data.hasUndermining,
            hasTunneling: data.hasTunneling,
          });
          const result = classifier.classifyWagner(wound);
          return result.grade >= 0 && result.grade <= 5;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should always produce Braden score between 6 and 23', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 3 }),
        (sp, moist, act, mob, nutr, fs) => {
          const result = classifier.computeBradenScale({
            sensoryPerception: sp as 1 | 2 | 3 | 4,
            moisture: moist as 1 | 2 | 3 | 4,
            activity: act as 1 | 2 | 3 | 4,
            mobility: mob as 1 | 2 | 3 | 4,
            nutrition: nutr as 1 | 2 | 3 | 4,
            frictionShear: fs as 1 | 2 | 3,
          });
          return result.totalScore >= 6 && result.totalScore <= 23;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should always produce PUSH score between 0 and 17', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 20, noNaN: true }),
        fc.float({ min: 0, max: 15, noNaN: true }),
        fc.constantFrom(...Object.values(ExudateAmount)),
        fc.constantFrom(...Object.values(TissueType)),
        (length, width, exudate, tissue) => {
          const wound = createTestWound({ lengthCm: length, widthCm: width, exudateAmount: exudate, tissueType: tissue });
          const result = classifier.computePUSHScore(wound);
          return result.totalScore >= 0 && result.totalScore <= 17;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should always produce valid healing phase from decision tree', () => {
    const validPhases = Object.values(HealingPhase);
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10, noNaN: true }),
        fc.float({ min: 0, max: 10, noNaN: true }),
        fc.integer({ min: 0, max: 180 }),
        fc.boolean(),
        fc.boolean(),
        (length, width, days, infection, postSurgical) => {
          const wound = createTestWound({
            lengthCm: length,
            widthCm: width,
            daysSinceOnset: days,
            hasInfectionSigns: infection,
            isPostSurgical: postSurgical,
          });
          const result = classifier.classifyHealingPhase(wound);
          return validPhases.includes(result.healingPhase) && result.confidence > 0 && result.confidence <= 1;
        }
      ),
      { numRuns: 50 }
    );
  });
});
