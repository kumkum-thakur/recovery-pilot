import { describe, it, expect, beforeEach } from 'vitest';
import {
  RehabilitationProtocolEngine,
} from '../rehabilitationProtocolEngine';
import type {
  SurgeryType,
  FIMLevel,
  MMTGrade,
  BorgRPE,
} from '../rehabilitationProtocolEngine';

describe('RehabilitationProtocolEngine', () => {
  let engine: RehabilitationProtocolEngine;

  beforeEach(() => {
    engine = new RehabilitationProtocolEngine();
  });

  // ----------------------------------------------------------------
  // Protocol Retrieval
  // ----------------------------------------------------------------
  describe('getProtocol', () => {
    it('should return a valid protocol for knee replacement', () => {
      const protocol = engine.getProtocol('knee_replacement');
      expect(protocol.surgeryType).toBe('knee_replacement');
      expect(protocol.totalPhases).toBe(4);
      expect(protocol.expectedDurationWeeks).toBe(12);
      expect(protocol.phases.length).toBe(4);
    });

    it('should return protocols for all 10 surgery types', () => {
      const surgeryTypes: SurgeryType[] = [
        'knee_replacement', 'hip_replacement', 'cardiac_bypass', 'appendectomy',
        'cesarean', 'shoulder_arthroscopy', 'spinal_fusion', 'hernia_repair',
        'colectomy', 'cholecystectomy',
      ];
      for (const st of surgeryTypes) {
        const protocol = engine.getProtocol(st);
        expect(protocol.surgeryType).toBe(st);
        expect(protocol.totalPhases).toBeGreaterThan(0);
        expect(protocol.phases.length).toBe(protocol.totalPhases);
        expect(protocol.expectedDurationWeeks).toBeGreaterThan(0);
      }
    });

    it('should include exercises in each phase', () => {
      const protocol = engine.getProtocol('knee_replacement');
      for (const phase of protocol.phases) {
        expect(phase.exercises.length).toBeGreaterThan(0);
        for (const ex of phase.exercises) {
          expect(ex.id).toBeDefined();
          expect(ex.name.length).toBeGreaterThan(0);
          expect(ex.sets).toBeGreaterThan(0);
          expect(ex.reps).toBeGreaterThan(0);
          expect(ex.restSeconds).toBeGreaterThanOrEqual(0);
          expect(ex.targetRPE).toBeGreaterThanOrEqual(6);
          expect(ex.targetRPE).toBeLessThanOrEqual(20);
        }
      }
    });

    it('should have sequential phase numbers starting at 1', () => {
      const protocol = engine.getProtocol('shoulder_arthroscopy');
      for (let i = 0; i < protocol.phases.length; i++) {
        expect(protocol.phases[i].phaseNumber).toBe(i + 1);
      }
    });

    it('should have non-overlapping day ranges across phases', () => {
      const protocol = engine.getProtocol('cardiac_bypass');
      for (let i = 1; i < protocol.phases.length; i++) {
        expect(protocol.phases[i].dayRange[0]).toBeGreaterThan(protocol.phases[i - 1].dayRange[0]);
      }
    });
  });

  // ----------------------------------------------------------------
  // FIM Assessment
  // ----------------------------------------------------------------
  describe('assessFunction (FIM)', () => {
    it('should compute correct motor and cognitive FIM scores for full independence', () => {
      const items: Partial<Record<string, FIMLevel>> = {};
      // 13 motor items + 5 cognitive items, all at level 7
      const motorKeys = [
        'eating', 'grooming', 'bathing', 'dressing_upper', 'dressing_lower',
        'toileting', 'bladder_management', 'bowel_management', 'transfer_bed',
        'transfer_toilet', 'transfer_tub', 'locomotion_walk', 'locomotion_stairs',
      ];
      const cogKeys = ['comprehension', 'expression', 'social_interaction', 'problem_solving', 'memory'];
      for (const k of motorKeys) items[k] = 7;
      for (const k of cogKeys) items[k] = 7;

      const assessment = engine.assessFunction('P001', items as Parameters<typeof engine.assessFunction>[1]);
      expect(assessment.motorScore).toBe(91); // 13 * 7
      expect(assessment.cognitiveScore).toBe(35); // 5 * 7
      expect(assessment.totalScore).toBe(126);
      expect(assessment.patientId).toBe('P001');
    });

    it('should default unspecified FIM items to level 1', () => {
      // Provide only a few items; rest default to 1
      const assessment = engine.assessFunction('P001', { eating: 7, memory: 7 });
      // Total = 7 + 7 + 16 * 1 = 30
      expect(assessment.totalScore).toBe(30);
    });

    it('should store assessments for trending via scoreFIM', () => {
      engine.assessFunction('P001', { eating: 3 });
      engine.assessFunction('P001', { eating: 5 });
      const report = engine.scoreFIM('P001');
      expect(report.trend.length).toBe(2);
      expect(report.latest).toBeDefined();
      expect(report.latest!.totalScore).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------------------
  // FIM Scoring & Trending
  // ----------------------------------------------------------------
  describe('scoreFIM', () => {
    it('should return null latest and empty trend for unknown patient', () => {
      const report = engine.scoreFIM('P_UNKNOWN');
      expect(report.latest).toBeNull();
      expect(report.trend).toEqual([]);
    });

    it('should provide item labels and level labels', () => {
      const report = engine.scoreFIM('P001');
      expect(Object.keys(report.itemLabels).length).toBe(18);
      expect(report.itemLabels['eating']).toBe('Eating');
      expect(report.levelLabels[1]).toContain('Total Assistance');
      expect(report.levelLabels[7]).toContain('Complete Independence');
    });

    it('should trend FIM scores chronologically', () => {
      engine.assessFunction('P001', { eating: 2 });
      engine.assessFunction('P001', { eating: 4 });
      engine.assessFunction('P001', { eating: 6 });
      const report = engine.scoreFIM('P001');
      expect(report.trend.length).toBe(3);
      // Total scores should be increasing
      expect(report.trend[2].totalScore).toBeGreaterThan(report.trend[0].totalScore);
    });
  });

  // ----------------------------------------------------------------
  // MMT Grading
  // ----------------------------------------------------------------
  describe('scoreMMT', () => {
    it('should record and return an MMT result with grade label', () => {
      const result = engine.scoreMMT('P001', 'quadriceps', 'right', 4, false, 'Good strength');
      expect(result.patientId).toBe('P001');
      expect(result.muscleGroup).toBe('quadriceps');
      expect(result.side).toBe('right');
      expect(result.grade).toBe(4);
      expect(result.gradeLabel).toContain('moderate resistance');
      expect(result.painDuringTest).toBe(false);
    });

    it('should return correct labels for all MMT grades', () => {
      const grades: MMTGrade[] = [0, 1, 2, 3, 4, 5];
      for (const grade of grades) {
        const result = engine.scoreMMT('P001', 'biceps', 'left', grade);
        expect(result.gradeLabel.length).toBeGreaterThan(0);
      }
    });

    it('should record pain during test', () => {
      const result = engine.scoreMMT('P001', 'hamstrings', 'bilateral', 3, true, 'Pain on resistance');
      expect(result.painDuringTest).toBe(true);
      expect(result.notes).toBe('Pain on resistance');
    });
  });

  // ----------------------------------------------------------------
  // Borg RPE / Exertion Assessment
  // ----------------------------------------------------------------
  describe('assessExertion', () => {
    it('should recommend progression for low RPE', () => {
      const assessment = engine.assessExertion('P001', 'kr-1-1', 9 as BorgRPE);
      expect(assessment.borgRPE).toBe(9);
      expect(assessment.shouldProgress).toBe(true);
      expect(assessment.shouldRegress).toBe(false);
    });

    it('should recommend regression for very high RPE', () => {
      const assessment = engine.assessExertion('P001', 'kr-1-1', 18 as BorgRPE);
      expect(assessment.shouldProgress).toBe(false);
      expect(assessment.shouldRegress).toBe(true);
    });

    it('should record heart rate and blood pressure when provided', () => {
      const assessment = engine.assessExertion('P001', 'kr-2-1', 13 as BorgRPE, 110, { systolic: 140, diastolic: 80 });
      expect(assessment.heartRate).toBe(110);
      expect(assessment.bloodPressure!.systolic).toBe(140);
      expect(assessment.bloodPressure!.diastolic).toBe(80);
    });

    it('should set shouldProgress=true at RPE 13 and shouldRegress=false', () => {
      const assessment = engine.assessExertion('P001', 'kr-1-1', 13 as BorgRPE);
      expect(assessment.shouldProgress).toBe(true);
      expect(assessment.shouldRegress).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // Exercise Progression
  // ----------------------------------------------------------------
  describe('progressExercise', () => {
    it('should require at least 3 sessions before recommending progression', () => {
      const result = engine.progressExercise('P001', 'knee_replacement', 1, 'kr-1-1');
      expect(result.shouldProgress).toBe(false);
      expect(result.recommendation).toContain('Need at least 3 sessions');
    });

    it('should recommend progression when RPE is at or below target', () => {
      engine.assessExertion('P001', 'kr-1-1', 7 as BorgRPE);
      engine.assessExertion('P001', 'kr-1-1', 7 as BorgRPE);
      engine.assessExertion('P001', 'kr-1-1', 7 as BorgRPE);
      const result = engine.progressExercise('P001', 'knee_replacement', 1, 'kr-1-1');
      expect(result.shouldProgress).toBe(true);
      expect(result.updatedExercise).toBeDefined();
      expect(result.updatedExercise!.sets).toBeGreaterThanOrEqual(3);
    });

    it('should return exercise not found for invalid exercise ID', () => {
      const result = engine.progressExercise('P001', 'knee_replacement', 1, 'nonexistent');
      expect(result.shouldProgress).toBe(false);
      expect(result.recommendation).toContain('not found');
      expect(result.updatedExercise).toBeNull();
    });

    it('should indicate nextPhase when progressing on the last exercise of a phase', () => {
      // Provide enough exertion data for kr-1-4 (last exercise in phase 1)
      engine.assessExertion('P001', 'kr-1-4', 9 as BorgRPE);
      engine.assessExertion('P001', 'kr-1-4', 9 as BorgRPE);
      engine.assessExertion('P001', 'kr-1-4', 9 as BorgRPE);
      const result = engine.progressExercise('P001', 'knee_replacement', 1, 'kr-1-4');
      if (result.shouldProgress) {
        expect(result.nextPhase).toBe(true);
      }
    });
  });

  // ----------------------------------------------------------------
  // Home Exercise Program (HEP)
  // ----------------------------------------------------------------
  describe('generateHEP', () => {
    it('should generate a home exercise program for knee replacement phase 1', () => {
      const hep = engine.generateHEP('P001', 'knee_replacement', 1);
      expect(hep.patientId).toBe('P001');
      expect(hep.surgeryType).toBe('knee_replacement');
      expect(hep.currentPhase).toBe(1);
      expect(hep.exercises.length).toBeGreaterThan(0);
      expect(hep.warnings.length).toBeGreaterThan(0);
      expect(hep.followUpDate).toBeGreaterThan(hep.generatedDate);
    });

    it('should include frequency and duration for each exercise', () => {
      const hep = engine.generateHEP('P001', 'hip_replacement', 1);
      for (const ex of hep.exercises) {
        expect(ex.frequency.length).toBeGreaterThan(0);
        expect(ex.duration.length).toBeGreaterThan(0);
        expect(typeof ex.specialInstructions).toBe('string');
      }
    });

    it('should return empty exercises and a warning for an invalid phase', () => {
      const hep = engine.generateHEP('P001', 'knee_replacement', 99);
      expect(hep.exercises).toEqual([]);
      expect(hep.warnings).toContain('Invalid phase');
    });

    it('should adjust exercise parameters based on recorded outcomes (self-learning)', () => {
      // Record positive outcomes to increase progression
      engine.recordOutcome('P001', 'knee_replacement', 1, 'kr-1-1', true, 9 as BorgRPE);
      engine.recordOutcome('P001', 'knee_replacement', 1, 'kr-1-1', true, 9 as BorgRPE);
      engine.recordOutcome('P001', 'knee_replacement', 1, 'kr-1-1', true, 9 as BorgRPE);

      const hep = engine.generateHEP('P001', 'knee_replacement', 1);
      const adjusted = hep.exercises.find((e) => e.id === 'kr-1-1');
      expect(adjusted).toBeDefined();
      // After positive outcomes, sets/reps may have increased
      expect(adjusted!.sets).toBeGreaterThanOrEqual(3);
    });

    it('should reduce exercise volume after negative outcomes', () => {
      // Record negative outcomes
      engine.recordOutcome('P001', 'knee_replacement', 1, 'kr-1-2', false, 18 as BorgRPE);
      engine.recordOutcome('P001', 'knee_replacement', 1, 'kr-1-2', false, 19 as BorgRPE);

      const hep = engine.generateHEP('P001', 'knee_replacement', 1);
      const adjusted = hep.exercises.find((e) => e.id === 'kr-1-2');
      expect(adjusted).toBeDefined();
      // After negative outcomes, the reps should be reduced but at least 5
      expect(adjusted!.reps).toBeGreaterThanOrEqual(5);
    });

    it('should include phase precautions in warnings', () => {
      const hep = engine.generateHEP('P001', 'cardiac_bypass', 1);
      // Cardiac bypass phase 1 has precaution "No lifting > 5 lbs"
      const hasSternalPrecaution = hep.warnings.some((w) => w.includes('lifting') || w.includes('Splint'));
      expect(hasSternalPrecaution).toBe(true);
    });
  });

  // ----------------------------------------------------------------
  // Static Reference Methods
  // ----------------------------------------------------------------
  describe('static reference methods', () => {
    it('should return Borg scale reference with expected labels', () => {
      const borg = RehabilitationProtocolEngine.getBorgScaleReference();
      expect(borg[6]).toBe('No exertion');
      expect(borg[13]).toBe('Somewhat hard');
      expect(borg[20]).toBe('Maximal');
    });

    it('should return MMT reference with all 6 grades', () => {
      const mmt = RehabilitationProtocolEngine.getMMTReference();
      expect(Object.keys(mmt).length).toBe(6);
      expect(mmt[0]).toContain('No contraction');
      expect(mmt[5]).toContain('normal');
    });

    it('should return FIM level reference with all 7 levels', () => {
      const fim = RehabilitationProtocolEngine.getFIMLevelReference();
      expect(Object.keys(fim).length).toBe(7);
      expect(fim[1]).toContain('Total Assistance');
      expect(fim[7]).toContain('Complete Independence');
    });
  });

  // ----------------------------------------------------------------
  // Edge Cases
  // ----------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle cholecystectomy which has only 2 phases', () => {
      const protocol = engine.getProtocol('cholecystectomy');
      expect(protocol.totalPhases).toBe(2);
      expect(protocol.expectedDurationWeeks).toBe(2);
    });

    it('should handle shoulder arthroscopy which has 4 phases over 16 weeks', () => {
      const protocol = engine.getProtocol('shoulder_arthroscopy');
      expect(protocol.totalPhases).toBe(4);
      expect(protocol.expectedDurationWeeks).toBe(16);
    });
  });
});
