import { describe, it, expect } from 'vitest';
import {
  fallRiskAssessment,
  calculateMorseFallScale,
  calculateHendrichII,
  evaluateTUGTest,
  identifyRiskFactors,
  generateInterventions,
  generateEnvironmentalRecommendations,
  FallRiskLevel,
  GaitType,
  MentalStatusType,
  TUGRiskCategory,
  HIGH_RISK_MEDICATIONS,
} from '../fallRiskAssessment';
import type {
  MorseFallScaleInput,
  HendrichIIInput,
  FallRiskFactors,
} from '../fallRiskAssessment';

function makeLowRiskMorse(): MorseFallScaleInput {
  return {
    historyOfFalling: false,
    secondaryDiagnosis: false,
    ambulatoryAid: 'none',
    ivOrHeparinLock: false,
    gait: GaitType.NORMAL,
    mentalStatus: MentalStatusType.ORIENTED,
  };
}

function makeHighRiskMorse(): MorseFallScaleInput {
  return {
    historyOfFalling: true,
    secondaryDiagnosis: true,
    ambulatoryAid: 'crutch_cane_walker',
    ivOrHeparinLock: true,
    gait: GaitType.IMPAIRED,
    mentalStatus: MentalStatusType.FORGETS_LIMITATIONS,
  };
}

function makeLowRiskHendrich(): HendrichIIInput {
  return {
    confusion: false,
    symptomaticDepression: false,
    alteredElimination: false,
    dizzinessVertigo: false,
    genderMale: false,
    antiepileptics: false,
    benzodiazepines: false,
    getUpAndGoTestRisk: false,
  };
}

describe('FallRiskAssessment', () => {
  // ==========================================================================
  // Morse Fall Scale Tests
  // ==========================================================================
  describe('Morse Fall Scale', () => {
    it('should score 0 for no risk factors', () => {
      const result = calculateMorseFallScale(makeLowRiskMorse());
      expect(result.totalScore).toBe(0);
      expect(result.riskLevel).toBe(FallRiskLevel.LOW);
    });

    it('should score 25 for history of falling', () => {
      const input = { ...makeLowRiskMorse(), historyOfFalling: true };
      const result = calculateMorseFallScale(input);
      expect(result.componentScores.historyOfFalling).toBe(25);
      expect(result.totalScore).toBe(25);
      expect(result.riskLevel).toBe(FallRiskLevel.MODERATE);
    });

    it('should score 15 for secondary diagnosis', () => {
      const input = { ...makeLowRiskMorse(), secondaryDiagnosis: true };
      const result = calculateMorseFallScale(input);
      expect(result.componentScores.secondaryDiagnosis).toBe(15);
    });

    it('should score 30 for crutch/cane/walker', () => {
      const input = { ...makeLowRiskMorse(), ambulatoryAid: 'crutch_cane_walker' as const };
      const result = calculateMorseFallScale(input);
      expect(result.componentScores.ambulatoryAid).toBe(30);
    });

    it('should score 15 for furniture ambulation', () => {
      const input = { ...makeLowRiskMorse(), ambulatoryAid: 'furniture' as const };
      const result = calculateMorseFallScale(input);
      expect(result.componentScores.ambulatoryAid).toBe(15);
    });

    it('should score 20 for IV/heparin lock', () => {
      const input = { ...makeLowRiskMorse(), ivOrHeparinLock: true };
      const result = calculateMorseFallScale(input);
      expect(result.componentScores.ivOrHeparinLock).toBe(20);
    });

    it('should score 10 for weak gait', () => {
      const input = { ...makeLowRiskMorse(), gait: GaitType.WEAK };
      const result = calculateMorseFallScale(input);
      expect(result.componentScores.gait).toBe(10);
    });

    it('should score 20 for impaired gait', () => {
      const input = { ...makeLowRiskMorse(), gait: GaitType.IMPAIRED };
      const result = calculateMorseFallScale(input);
      expect(result.componentScores.gait).toBe(20);
    });

    it('should score 15 for forgets limitations', () => {
      const input = { ...makeLowRiskMorse(), mentalStatus: MentalStatusType.FORGETS_LIMITATIONS };
      const result = calculateMorseFallScale(input);
      expect(result.componentScores.mentalStatus).toBe(15);
    });

    it('should classify high risk correctly (max score = 125)', () => {
      const result = calculateMorseFallScale(makeHighRiskMorse());
      // 25 + 15 + 30 + 20 + 20 + 15 = 125
      expect(result.totalScore).toBe(125);
      expect(result.riskLevel).toBe(FallRiskLevel.HIGH);
    });

    it('should classify moderate risk (25-44)', () => {
      // history (25) + secondary (15) = 40
      const input = { ...makeLowRiskMorse(), historyOfFalling: true, secondaryDiagnosis: true };
      const result = calculateMorseFallScale(input);
      expect(result.totalScore).toBe(40);
      expect(result.riskLevel).toBe(FallRiskLevel.MODERATE);
    });

    it('should use threshold of 45 for high risk', () => {
      // 25 + 20 = 45 exactly
      const input = { ...makeLowRiskMorse(), historyOfFalling: true, ivOrHeparinLock: true };
      const result = calculateMorseFallScale(input);
      expect(result.totalScore).toBe(45);
      expect(result.riskLevel).toBe(FallRiskLevel.HIGH);
    });
  });

  // ==========================================================================
  // Hendrich II Fall Risk Model
  // ==========================================================================
  describe('Hendrich II Fall Risk Model', () => {
    it('should score 0 for no risk factors', () => {
      const result = calculateHendrichII(makeLowRiskHendrich());
      expect(result.totalScore).toBe(0);
      expect(result.highRisk).toBe(false);
    });

    it('should assign 7 points for antiepileptics (highest single factor)', () => {
      const input = { ...makeLowRiskHendrich(), antiepileptics: true };
      const result = calculateHendrichII(input);
      expect(result.componentScores.antiepileptics).toBe(7);
      expect(result.totalScore).toBe(7);
      expect(result.highRisk).toBe(true);
    });

    it('should assign 4 points for confusion', () => {
      const input = { ...makeLowRiskHendrich(), confusion: true };
      const result = calculateHendrichII(input);
      expect(result.componentScores.confusion).toBe(4);
    });

    it('should use threshold of 5 for high risk', () => {
      // Confusion(4) + depression(2) = 6 >= 5
      const input = { ...makeLowRiskHendrich(), confusion: true, symptomaticDepression: true };
      const result = calculateHendrichII(input);
      expect(result.totalScore).toBe(6);
      expect(result.highRisk).toBe(true);
    });

    it('should not flag as high risk with score 4', () => {
      const input = { ...makeLowRiskHendrich(), confusion: true };
      const result = calculateHendrichII(input);
      expect(result.totalScore).toBe(4);
      expect(result.highRisk).toBe(false);
    });
  });

  // ==========================================================================
  // Timed Up and Go Test
  // ==========================================================================
  describe('TUG Test', () => {
    it('should classify <= 10 seconds as normal', () => {
      const result = evaluateTUGTest(8);
      expect(result.category).toBe(TUGRiskCategory.NORMAL);
      expect(result.fallRiskPercent).toBe(5);
    });

    it('should classify 10-20 seconds as moderate risk', () => {
      const result = evaluateTUGTest(15);
      expect(result.category).toBe(TUGRiskCategory.MODERATE_RISK);
      expect(result.fallRiskPercent).toBe(25);
    });

    it('should classify > 20 seconds as high risk', () => {
      const result = evaluateTUGTest(25);
      expect(result.category).toBe(TUGRiskCategory.HIGH_RISK);
      expect(result.fallRiskPercent).toBe(60);
    });

    it('should recommend PT for moderate risk', () => {
      const result = evaluateTUGTest(15);
      expect(result.recommendation).toContain('Physical therapy');
    });

    it('should recommend supervised ambulation for high risk', () => {
      const result = evaluateTUGTest(30);
      expect(result.recommendation).toContain('Supervised ambulation');
    });
  });

  // ==========================================================================
  // Risk Factor Identification
  // ==========================================================================
  describe('risk factor identification', () => {
    it('should identify age as risk factor at 65+', () => {
      const factors: FallRiskFactors = {
        age: 72, medications: [], cognitiveImpairment: false, visualImpairment: false,
        hearingImpairment: false, urinaryIncontinence: false, orthostasisHistory: false,
        arthritisJointPain: false, footProblems: false, peripheralNeuropathy: false,
        deconditioning: false, delirium: false, recentSurgery: false, postOperativeDay: 0,
        anemia: false, dehydration: false,
      };
      const risks = identifyRiskFactors(factors);
      expect(risks.some(r => r.includes('Age >= 65'))).toBe(true);
    });

    it('should identify polypharmacy with 4+ high-risk medications', () => {
      const factors: FallRiskFactors = {
        age: 50, medications: HIGH_RISK_MEDICATIONS.slice(0, 5),
        cognitiveImpairment: false, visualImpairment: false,
        hearingImpairment: false, urinaryIncontinence: false, orthostasisHistory: false,
        arthritisJointPain: false, footProblems: false, peripheralNeuropathy: false,
        deconditioning: false, delirium: false, recentSurgery: false, postOperativeDay: 0,
        anemia: false, dehydration: false,
      };
      const risks = identifyRiskFactors(factors);
      expect(risks.some(r => r.includes('Polypharmacy'))).toBe(true);
    });

    it('should flag high-risk medications with RR >= 1.5', () => {
      const factors: FallRiskFactors = {
        age: 50,
        medications: [{ name: 'SSRIs', category: 'Psychotropic', fallRiskIncrease: 1.67 }],
        cognitiveImpairment: false, visualImpairment: false,
        hearingImpairment: false, urinaryIncontinence: false, orthostasisHistory: false,
        arthritisJointPain: false, footProblems: false, peripheralNeuropathy: false,
        deconditioning: false, delirium: false, recentSurgery: false, postOperativeDay: 0,
        anemia: false, dehydration: false,
      };
      const risks = identifyRiskFactors(factors);
      expect(risks.some(r => r.includes('SSRIs'))).toBe(true);
    });
  });

  // ==========================================================================
  // Interventions & Environment
  // ==========================================================================
  describe('interventions', () => {
    it('should generate more interventions for high risk', () => {
      const highInterventions = generateInterventions(FallRiskLevel.HIGH, []);
      const lowInterventions = generateInterventions(FallRiskLevel.LOW, []);
      expect(highInterventions.length).toBeGreaterThan(lowInterventions.length);
    });

    it('should include 1:1 sitter for high risk', () => {
      const interventions = generateInterventions(FallRiskLevel.HIGH, []);
      expect(interventions.some(i => i.intervention.includes('sitter'))).toBe(true);
    });

    it('should include bed alarm for moderate risk', () => {
      const interventions = generateInterventions(FallRiskLevel.MODERATE, []);
      expect(interventions.some(i => i.intervention.includes('alarm'))).toBe(true);
    });

    it('should add vision intervention for visual impairment', () => {
      const interventions = generateInterventions(FallRiskLevel.MODERATE, ['Visual impairment']);
      expect(interventions.some(i => i.category === 'Vision')).toBe(true);
    });

    it('should generate environmental recommendations', () => {
      const recs = generateEnvironmentalRecommendations(FallRiskLevel.HIGH);
      expect(recs.length).toBeGreaterThan(5);
      expect(recs.some(r => r.area === 'Lighting')).toBe(true);
      expect(recs.some(r => r.area === 'Bed height')).toBe(true);
    });
  });

  // ==========================================================================
  // Comprehensive Assessment & Self-Learning
  // ==========================================================================
  describe('comprehensive assessment', () => {
    it('should use highest risk level from all tools', () => {
      const assessment = fallRiskAssessment.performComprehensiveAssessment(
        `comp-test-${Date.now()}`,
        makeLowRiskMorse(),             // Low risk
        { ...makeLowRiskHendrich(), antiepileptics: true }, // High risk (7 pts)
      );
      expect(assessment.overallRiskLevel).toBe(FallRiskLevel.HIGH);
    });

    it('should include reassessment schedule', () => {
      const assessment = fallRiskAssessment.performComprehensiveAssessment(
        `reassess-${Date.now()}`,
        makeHighRiskMorse(),
      );
      expect(assessment.reassessmentDue).toBeDefined();
      // High risk should reassess within 24 hours
      const diff = new Date(assessment.reassessmentDue).getTime() - new Date(assessment.timestamp).getTime();
      expect(diff).toBeLessThanOrEqual(25 * 3600000); // allow small margin
    });
  });

  describe('self-learning', () => {
    it('should have dataset with 110+ patients', () => {
      expect(fallRiskAssessment.getDatasetSize()).toBeGreaterThanOrEqual(110);
    });

    it('should track fall events', () => {
      const data = fallRiskAssessment.getLearningData();
      expect(data.totalFalls).toBeGreaterThan(0);
      expect(data.totalAssessments).toBeGreaterThanOrEqual(110);
    });

    it('should compute sensitivity from learning data', () => {
      const data = fallRiskAssessment.getLearningData();
      expect(data.sensitivity).toBeGreaterThanOrEqual(0);
      expect(data.sensitivity).toBeLessThanOrEqual(1);
    });

    it('should escalate risk level after fall event', () => {
      const pid = `fall-learn-${Date.now()}`;
      fallRiskAssessment.performComprehensiveAssessment(pid, makeLowRiskMorse());
      fallRiskAssessment.recordFallEvent(pid, 'minor', 'Bathroom', 'Slip', ['Wet floor']);
      const profile = fallRiskAssessment.getPatientProfile(pid);
      expect(profile!.currentRiskLevel).toBe(FallRiskLevel.HIGH);
      expect(profile!.fallEvents.length).toBe(1);
    });

    it('should have known high-risk medications database', () => {
      const meds = fallRiskAssessment.getHighRiskMedications();
      expect(meds.length).toBeGreaterThanOrEqual(10);
      expect(meds.every(m => m.fallRiskIncrease > 1.0)).toBe(true);
    });
  });
});
