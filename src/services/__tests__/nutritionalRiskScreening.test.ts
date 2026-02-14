import { describe, it, expect } from 'vitest';
import {
  nutritionalRiskScreening,
  calculateBMI,
  calculateNRS2002,
  calculateMUST,
  calculateSGA,
  calculateCaloricNeeds,
  assessMicronutrients,
  BMICategory,
  NutritionRiskLevel,
  SGAClass,
  NutritionRoute,
  Sex,
} from '../nutritionalRiskScreening';
import type {
  PatientAnthropometrics,
  NRS2002Input,
  MUSTInput,
  SGAInput,
} from '../nutritionalRiskScreening';

function makeDefaultAnthro(overrides: Partial<PatientAnthropometrics> = {}): PatientAnthropometrics {
  return {
    weightKg: 70,
    heightCm: 175,
    sex: Sex.MALE,
    ageYears: 55,
    usualWeightKg: 75,
    weightLossPercent6Months: 3,
    weightLossPercent1Month: 1,
    ...overrides,
  };
}

describe('NutritionalRiskScreening', () => {
  // ==========================================================================
  // BMI Calculation
  // ==========================================================================
  describe('BMI calculation', () => {
    it('should calculate BMI correctly', () => {
      // 70 kg, 175 cm => BMI = 70 / (1.75^2) = 22.9
      const result = calculateBMI(70, 175);
      expect(result.bmi).toBeCloseTo(22.9, 0);
      expect(result.category).toBe(BMICategory.NORMAL);
    });

    it('should classify underweight (BMI < 18.5)', () => {
      const result = calculateBMI(50, 175);
      expect(result.bmi).toBeLessThan(18.5);
      expect(result.category).toBe(BMICategory.UNDERWEIGHT);
    });

    it('should classify overweight (BMI 25-29.9)', () => {
      const result = calculateBMI(85, 175);
      expect(result.bmi).toBeGreaterThanOrEqual(25);
      expect(result.bmi).toBeLessThan(30);
      expect(result.category).toBe(BMICategory.OVERWEIGHT);
    });

    it('should classify obese class 1 (BMI 30-34.9)', () => {
      const result = calculateBMI(100, 175);
      expect(result.category).toBe(BMICategory.OBESE_CLASS_1);
    });

    it('should classify obese class 3 (BMI >= 40)', () => {
      const result = calculateBMI(130, 175);
      expect(result.category).toBe(BMICategory.OBESE_CLASS_3);
    });

    it('should calculate ideal weight range for BMI 18.5-24.9', () => {
      const result = calculateBMI(70, 175);
      const heightM = 1.75;
      expect(result.idealWeightRange.min).toBeCloseTo(18.5 * heightM * heightM, 0);
      expect(result.idealWeightRange.max).toBeCloseTo(24.9 * heightM * heightM, 0);
    });
  });

  // ==========================================================================
  // NRS-2002
  // ==========================================================================
  describe('NRS-2002', () => {
    it('should return not at risk for healthy patient', () => {
      const result = calculateNRS2002({
        bmiLessThan20_5: false,
        weightLossGreaterThan5Percent3Months: false,
        reducedIntakePastWeek: false,
        foodIntakePercent: 100,
        severityOfDisease: 'absent',
        ageOver70: false,
      });
      expect(result.totalScore).toBe(0);
      expect(result.atNutritionalRisk).toBe(false);
    });

    it('should score 3+ for malnourished surgical patient', () => {
      const result = calculateNRS2002({
        bmiLessThan20_5: true,
        weightLossGreaterThan5Percent3Months: true,
        reducedIntakePastWeek: true,
        foodIntakePercent: 40,
        severityOfDisease: 'moderate',
        ageOver70: false,
      });
      expect(result.totalScore).toBeGreaterThanOrEqual(3);
      expect(result.atNutritionalRisk).toBe(true);
    });

    it('should add 1 point for age > 70', () => {
      const base = calculateNRS2002({
        bmiLessThan20_5: false,
        weightLossGreaterThan5Percent3Months: false,
        reducedIntakePastWeek: false,
        foodIntakePercent: 100,
        severityOfDisease: 'mild',
        ageOver70: false,
      });
      const aged = calculateNRS2002({
        bmiLessThan20_5: false,
        weightLossGreaterThan5Percent3Months: false,
        reducedIntakePastWeek: false,
        foodIntakePercent: 100,
        severityOfDisease: 'mild',
        ageOver70: true,
      });
      expect(aged.totalScore).toBe(base.totalScore + 1);
      expect(aged.ageAdjustment).toBe(1);
    });

    it('should classify severe disease as score 3', () => {
      const result = calculateNRS2002({
        bmiLessThan20_5: false,
        weightLossGreaterThan5Percent3Months: false,
        reducedIntakePastWeek: false,
        foodIntakePercent: 100,
        severityOfDisease: 'severe',
        ageOver70: false,
      });
      expect(result.severityScore).toBe(3);
    });

    it('should recommend dietitian consultation when at risk', () => {
      const result = calculateNRS2002({
        bmiLessThan20_5: true,
        weightLossGreaterThan5Percent3Months: true,
        reducedIntakePastWeek: true,
        foodIntakePercent: 30,
        severityOfDisease: 'moderate',
        ageOver70: true,
      });
      expect(result.recommendations.some(r => r.includes('Dietitian'))).toBe(true);
    });
  });

  // ==========================================================================
  // MUST
  // ==========================================================================
  describe('MUST', () => {
    it('should score 0 (low risk) for normal patient', () => {
      const result = calculateMUST({ bmi: 24, unplannedWeightLossPercent: 2, acutelyIll: false });
      expect(result.totalScore).toBe(0);
      expect(result.riskLevel).toBe(NutritionRiskLevel.LOW);
    });

    it('should score 2 for BMI < 18.5', () => {
      const result = calculateMUST({ bmi: 17, unplannedWeightLossPercent: 0, acutelyIll: false });
      expect(result.bmiScore).toBe(2);
    });

    it('should score 1 for BMI 18.5-20', () => {
      const result = calculateMUST({ bmi: 19, unplannedWeightLossPercent: 0, acutelyIll: false });
      expect(result.bmiScore).toBe(1);
    });

    it('should score 2 for weight loss >= 10%', () => {
      const result = calculateMUST({ bmi: 22, unplannedWeightLossPercent: 12, acutelyIll: false });
      expect(result.weightLossScore).toBe(2);
    });

    it('should score 1 for weight loss 5-9%', () => {
      const result = calculateMUST({ bmi: 22, unplannedWeightLossPercent: 7, acutelyIll: false });
      expect(result.weightLossScore).toBe(1);
    });

    it('should score 2 for acutely ill with no intake', () => {
      const result = calculateMUST({ bmi: 22, unplannedWeightLossPercent: 0, acutelyIll: true });
      expect(result.acuteIllnessScore).toBe(2);
      expect(result.riskLevel).toBe(NutritionRiskLevel.HIGH);
    });

    it('should classify medium risk (score 1)', () => {
      const result = calculateMUST({ bmi: 19.5, unplannedWeightLossPercent: 3, acutelyIll: false });
      expect(result.totalScore).toBe(1);
      expect(result.riskLevel).toBe(NutritionRiskLevel.MODERATE);
    });
  });

  // ==========================================================================
  // SGA
  // ==========================================================================
  describe('SGA', () => {
    it('should classify well-nourished patient as SGA-A', () => {
      const result = calculateSGA({
        weightChange: 'none', dietaryIntakeChange: 'none', giSymptoms: 'none',
        functionalCapacity: 'normal', metabolicStress: 'none',
        subcutaneousFatLoss: 'none', muscleLoss: 'none', edema: 'none',
      });
      expect(result.classification).toBe(SGAClass.WELL_NOURISHED);
    });

    it('should classify severely malnourished patient as SGA-C', () => {
      const result = calculateSGA({
        weightChange: 'loss_greater_10', dietaryIntakeChange: 'starvation',
        giSymptoms: 'severe', functionalCapacity: 'bed_bound',
        metabolicStress: 'high', subcutaneousFatLoss: 'severe',
        muscleLoss: 'severe', edema: 'severe',
      });
      expect(result.classification).toBe(SGAClass.SEVERELY_MALNOURISHED);
    });

    it('should classify moderate malnutrition as SGA-B', () => {
      const result = calculateSGA({
        weightChange: 'loss_5_10', dietaryIntakeChange: 'suboptimal_solid',
        giSymptoms: 'moderate', functionalCapacity: 'reduced',
        metabolicStress: 'moderate', subcutaneousFatLoss: 'moderate',
        muscleLoss: 'mild', edema: 'none',
      });
      expect(result.classification).toBe(SGAClass.MODERATELY_MALNOURISHED);
    });

    it('should recommend refeeding monitoring for severe malnutrition', () => {
      const result = calculateSGA({
        weightChange: 'loss_greater_10', dietaryIntakeChange: 'starvation',
        giSymptoms: 'severe', functionalCapacity: 'bed_bound',
        metabolicStress: 'high', subcutaneousFatLoss: 'severe',
        muscleLoss: 'severe', edema: 'moderate',
      });
      expect(result.recommendations.some(r => r.includes('refeeding'))).toBe(true);
    });
  });

  // ==========================================================================
  // Caloric Needs (Harris-Benedict & Mifflin-St Jeor)
  // ==========================================================================
  describe('caloric needs calculation', () => {
    it('should calculate Harris-Benedict BMR for male', () => {
      // Male: 88.362 + (13.397 × 70) + (4.799 × 175) - (5.677 × 55)
      // = 88.362 + 937.79 + 839.825 - 312.235 = 1553.742 => rounds to 1554
      const result = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'none', false);
      expect(result.harrisBenedictBMR).toBeCloseTo(1554, -1);
    });

    it('should calculate Mifflin-St Jeor BMR for male', () => {
      // Male: (10 × 70) + (6.25 × 175) - (5 × 55) + 5
      // = 700 + 1093.75 - 275 + 5 = 1523.75 => rounds to 1524
      const result = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'none', false);
      expect(result.mifflinStJeorBMR).toBeCloseTo(1524, -1);
    });

    it('should calculate Harris-Benedict BMR for female', () => {
      // Female: 447.593 + (9.247 × 60) + (3.098 × 165) - (4.330 × 50) = 1298
      const result = calculateCaloricNeeds(
        makeDefaultAnthro({ sex: Sex.FEMALE, weightKg: 60, heightCm: 165, ageYears: 50 }),
        'bedrest', 'none', false,
      );
      expect(result.harrisBenedictBMR).toBeCloseTo(1298, -1);
    });

    it('should apply activity factor for ambulatory patients', () => {
      const bedrest = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'none', false);
      const ambulatory = calculateCaloricNeeds(makeDefaultAnthro(), 'ambulatory', 'none', false);
      expect(ambulatory.totalCaloricNeed).toBeGreaterThan(bedrest.totalCaloricNeed);
      expect(ambulatory.activityFactor).toBe(1.3);
    });

    it('should apply stress factor for surgical patients', () => {
      const none = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'none', false);
      const surgery = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'moderate_surgery', false);
      expect(surgery.totalCaloricNeed).toBeGreaterThan(none.totalCaloricNeed);
      expect(surgery.stressFactor).toBe(1.2);
    });

    it('should calculate protein needs based on stress level', () => {
      const moderate = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'moderate_surgery', false);
      expect(moderate.proteinPerKg).toBe(1.2);
      expect(moderate.proteinNeed).toBe(Math.round(70 * 1.2));

      const burns = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'burns', false);
      expect(burns.proteinPerKg).toBe(2.0);
    });

    it('should increase protein for wound healing', () => {
      const noWound = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'none', false);
      const wound = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'none', true);
      expect(wound.proteinPerKg).toBeGreaterThanOrEqual(1.25);
      expect(wound.proteinNeed).toBeGreaterThan(noWound.proteinNeed);
    });

    it('should calculate fluid needs at 30 mL/kg', () => {
      const result = calculateCaloricNeeds(makeDefaultAnthro(), 'bedrest', 'none', false);
      expect(result.fluidNeed).toBe(70 * 30);
    });
  });

  // ==========================================================================
  // Micronutrient Assessment
  // ==========================================================================
  describe('micronutrient assessment', () => {
    it('should flag vitamin C as high risk for wound patients', () => {
      const assessment = assessMicronutrients(true, false, false);
      const vitC = assessment.find(a => a.nutrient === 'Vitamin C');
      expect(vitC!.riskLevel).toBe(NutritionRiskLevel.HIGH);
    });

    it('should flag zinc as high risk for wound patients', () => {
      const assessment = assessMicronutrients(true, false, false);
      const zinc = assessment.find(a => a.nutrient === 'Zinc');
      expect(zinc!.riskLevel).toBe(NutritionRiskLevel.HIGH);
    });

    it('should flag iron as moderate risk for post-operative patients', () => {
      const assessment = assessMicronutrients(false, false, true);
      const iron = assessment.find(a => a.nutrient === 'Iron');
      expect(iron!.riskLevel).toBe(NutritionRiskLevel.MODERATE);
    });

    it('should assess at least 7 micronutrients', () => {
      const assessment = assessMicronutrients(true, true, true);
      expect(assessment.length).toBeGreaterThanOrEqual(7);
    });

    it('should include wound healing importance for each nutrient', () => {
      const assessment = assessMicronutrients(true, true, true);
      for (const a of assessment) {
        expect(a.woundHealingImportance.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Nutrition Plan & Self-Learning
  // ==========================================================================
  describe('nutrition plan generation', () => {
    it('should recommend oral route for patients who can eat', () => {
      const anthro = makeDefaultAnthro();
      const nrs = calculateNRS2002({
        bmiLessThan20_5: false, weightLossGreaterThan5Percent3Months: false,
        reducedIntakePastWeek: false, foodIntakePercent: 80,
        severityOfDisease: 'mild', ageOver70: false,
      });
      const cal = calculateCaloricNeeds(anthro, 'bedrest', 'mild_surgery', false);
      const plan = nutritionalRiskScreening.generateNutritionPlan('test-oral', anthro, nrs, cal, true, true);
      expect(plan.route).toBe(NutritionRoute.ORAL);
    });

    it('should recommend enteral for patients who cannot eat with functional GI', () => {
      const anthro = makeDefaultAnthro();
      const nrs = calculateNRS2002({
        bmiLessThan20_5: true, weightLossGreaterThan5Percent3Months: true,
        reducedIntakePastWeek: true, foodIntakePercent: 10,
        severityOfDisease: 'severe', ageOver70: true,
      });
      const cal = calculateCaloricNeeds(anthro, 'bedrest', 'severe_trauma', true);
      const plan = nutritionalRiskScreening.generateNutritionPlan('test-enteral', anthro, nrs, cal, false, true);
      expect(plan.route).toBe(NutritionRoute.ENTERAL);
      expect(plan.enteralFormula).toBeTruthy();
    });

    it('should recommend TPN for patients with non-functional GI', () => {
      const anthro = makeDefaultAnthro();
      const nrs = calculateNRS2002({
        bmiLessThan20_5: true, weightLossGreaterThan5Percent3Months: true,
        reducedIntakePastWeek: true, foodIntakePercent: 0,
        severityOfDisease: 'severe', ageOver70: false,
      });
      const cal = calculateCaloricNeeds(anthro, 'bedrest', 'severe_trauma', true);
      const plan = nutritionalRiskScreening.generateNutritionPlan('test-tpn', anthro, nrs, cal, false, false);
      expect(plan.route).toBe(NutritionRoute.PARENTERAL);
      expect(plan.tpnComponents).toBeTruthy();
      expect(plan.tpnComponents!.aminoAcids).toContain('g');
    });
  });

  describe('self-learning', () => {
    it('should have 100 pre-generated patients', () => {
      expect(nutritionalRiskScreening.getPlanCount()).toBeGreaterThanOrEqual(100);
    });

    it('should track outcomes in learning data', () => {
      const data = nutritionalRiskScreening.getLearningData();
      expect(data.outcomes).toBeGreaterThan(0);
      expect(data.averageLOS).toBeGreaterThan(0);
    });

    it('should adjust protein factor for slow healing', () => {
      nutritionalRiskScreening.recordOutcome('test-slow', 12, false, 21);
      const data = nutritionalRiskScreening.getLearningData();
      expect(data.adjustedProteinFactor).toBeGreaterThanOrEqual(1.0);
    });

    it('should track readmission rates', () => {
      const data = nutritionalRiskScreening.getLearningData();
      expect(data.readmissionRate).toBeGreaterThanOrEqual(0);
      expect(data.readmissionRate).toBeLessThanOrEqual(1);
    });
  });
});
