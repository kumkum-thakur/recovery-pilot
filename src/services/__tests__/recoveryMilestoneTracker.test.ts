import { describe, it, expect, beforeEach } from 'vitest';
import {
  RecoveryMilestoneTracker,
  SurgeryType,
  MilestoneCategory,
  PatientFactors,
} from '../recoveryMilestoneTracker';

describe('RecoveryMilestoneTracker', () => {
  let tracker: RecoveryMilestoneTracker;

  beforeEach(() => {
    tracker = new RecoveryMilestoneTracker();
  });

  // ----------------------------------------------------------------
  // Milestone Retrieval
  // ----------------------------------------------------------------
  describe('getMilestones', () => {
    it('should return milestones for knee replacement', () => {
      const milestones = tracker.getMilestones('knee_replacement');
      expect(milestones.length).toBeGreaterThanOrEqual(10);
      expect(milestones.every((m) => m.surgeryType === 'knee_replacement')).toBe(true);
    });

    it('should filter milestones by category', () => {
      const mobilityMilestones = tracker.getMilestones('knee_replacement', 'mobility');
      expect(mobilityMilestones.length).toBeGreaterThan(0);
      expect(mobilityMilestones.every((m) => m.category === 'mobility')).toBe(true);
    });

    it('should return milestones for all supported surgery types', () => {
      const surgeryTypes: SurgeryType[] = [
        'knee_replacement', 'hip_replacement', 'cardiac_bypass', 'appendectomy',
        'cesarean', 'shoulder_arthroscopy', 'spinal_fusion', 'hernia_repair',
        'colectomy', 'cholecystectomy',
      ];
      for (const st of surgeryTypes) {
        const milestones = tracker.getMilestones(st);
        expect(milestones.length).toBeGreaterThan(0);
      }
    });

    it('should return an empty array for an unrecognized surgery type', () => {
      const milestones = tracker.getMilestones('unknown_surgery' as SurgeryType);
      expect(milestones).toEqual([]);
    });

    it('should return milestones with valid structure fields', () => {
      const milestones = tracker.getMilestones('hip_replacement');
      for (const m of milestones) {
        expect(m.id).toBeDefined();
        expect(typeof m.description).toBe('string');
        expect(m.expectedDayPostOp).toBeGreaterThanOrEqual(0);
        expect(m.toleranceDays).toBeGreaterThan(0);
        expect(m.weight).toBeGreaterThan(0);
        expect(m.weight).toBeLessThanOrEqual(1);
        expect(Array.isArray(m.prerequisites)).toBe(true);
      }
    });
  });

  // ----------------------------------------------------------------
  // Progress Tracking
  // ----------------------------------------------------------------
  describe('trackProgress', () => {
    it('should record a progress entry with status achieved', () => {
      const entry = tracker.trackProgress('P001', 'kr-mob-1', 'achieved', 0, 'Dangled legs');
      expect(entry.patientId).toBe('P001');
      expect(entry.milestoneId).toBe('kr-mob-1');
      expect(entry.status).toBe('achieved');
      expect(entry.achievedDay).toBe(0);
      expect(entry.notes).toBe('Dangled legs');
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    it('should set achievedDay to null for non-achieved statuses', () => {
      const entry = tracker.trackProgress('P001', 'kr-mob-2', 'in_progress', 1);
      expect(entry.achievedDay).toBeNull();
      expect(entry.status).toBe('in_progress');
    });

    it('should overwrite existing progress for the same milestone', () => {
      tracker.trackProgress('P001', 'kr-mob-1', 'in_progress', 0);
      const updated = tracker.trackProgress('P001', 'kr-mob-1', 'achieved', 1, 'Done');
      expect(updated.status).toBe('achieved');
      expect(updated.achievedDay).toBe(1);
    });

    it('should store independent progress per patient', () => {
      tracker.trackProgress('P001', 'kr-mob-1', 'achieved', 0);
      tracker.trackProgress('P002', 'kr-mob-1', 'in_progress', 1);
      // Both entries should exist without interference; verify via deviation assessment
      const devP1 = tracker.assessDeviation('P001', 'knee_replacement', 5);
      const devP2 = tracker.assessDeviation('P002', 'knee_replacement', 5);
      const mob1P1 = devP1.find((d) => d.milestoneId === 'kr-mob-1');
      const mob1P2 = devP2.find((d) => d.milestoneId === 'kr-mob-1');
      expect(mob1P1!.actualDay).toBe(0);
      expect(mob1P2!.actualDay).toBeNull();
    });
  });

  // ----------------------------------------------------------------
  // Deviation Detection
  // ----------------------------------------------------------------
  describe('assessDeviation', () => {
    it('should mark milestones achieved early as ahead', () => {
      // kr-mob-4: expected day 14, tolerance 5 -> ahead if achieved before day 9
      tracker.trackProgress('P001', 'kr-mob-4', 'achieved', 5);
      const deviations = tracker.assessDeviation('P001', 'knee_replacement', 20);
      const mob4 = deviations.find((d) => d.milestoneId === 'kr-mob-4')!;
      expect(mob4.status).toBe('ahead');
      expect(mob4.actualDay).toBe(5);
      expect(mob4.deviationDays).toBeLessThan(0);
    });

    it('should mark milestones achieved on time as on_track', () => {
      // kr-mob-1: expected day 0, tolerance 1 -> on track if achieved day 0 or 1
      tracker.trackProgress('P001', 'kr-mob-1', 'achieved', 1);
      const deviations = tracker.assessDeviation('P001', 'knee_replacement', 5);
      const mob1 = deviations.find((d) => d.milestoneId === 'kr-mob-1')!;
      expect(mob1.status).toBe('on_track');
    });

    it('should mark overdue milestones as behind', () => {
      // kr-mob-4: expected day 14, tolerance 5 -> behind if achieved between day 19-24
      tracker.trackProgress('P001', 'kr-mob-4', 'achieved', 22);
      const deviations = tracker.assessDeviation('P001', 'knee_replacement', 25);
      const mob4 = deviations.find((d) => d.milestoneId === 'kr-mob-4')!;
      expect(mob4.status).toBe('behind');
    });

    it('should mark significantly overdue milestones as significantly_behind', () => {
      // kr-mob-4: expected day 14, tolerance 5 -> significantly_behind if achieved after day 24
      tracker.trackProgress('P001', 'kr-mob-4', 'achieved', 30);
      const deviations = tracker.assessDeviation('P001', 'knee_replacement', 35);
      const mob4 = deviations.find((d) => d.milestoneId === 'kr-mob-4')!;
      expect(mob4.status).toBe('significantly_behind');
    });

    it('should handle patients with no progress entries', () => {
      const deviations = tracker.assessDeviation('P_EMPTY', 'knee_replacement', 3);
      expect(deviations.length).toBeGreaterThan(0);
      // Very early days, most milestones should be on_track (not yet due)
      const earlyMilestones = deviations.filter((d) => d.expectedDay > 3);
      expect(earlyMilestones.every((d) => d.status === 'on_track')).toBe(true);
    });

    it('should generate recommendation strings for every deviation', () => {
      tracker.trackProgress('P001', 'kr-mob-1', 'achieved', 0);
      const deviations = tracker.assessDeviation('P001', 'knee_replacement', 10);
      for (const dev of deviations) {
        expect(typeof dev.recommendation).toBe('string');
        expect(dev.recommendation.length).toBeGreaterThan(0);
      }
    });
  });

  // ----------------------------------------------------------------
  // Personalization
  // ----------------------------------------------------------------
  describe('personalizeTimeline', () => {
    const healthyYoung: PatientFactors = {
      age: 35, bmi: 22, comorbidities: [], smokingStatus: 'never', activityLevelPreOp: 'active',
    };

    const elderlyComorbid: PatientFactors = {
      age: 75, bmi: 34, comorbidities: ['diabetes', 'copd'], smokingStatus: 'current', activityLevelPreOp: 'sedentary',
    };

    it('should shorten timelines for young healthy active patients', () => {
      const personalized = tracker.personalizeTimeline('knee_replacement', healthyYoung);
      const baseline = tracker.getMilestones('knee_replacement');
      // Find a milestone with expectedDay > 0 to compare
      const ref = baseline.find((m) => m.expectedDayPostOp > 10)!;
      const pers = personalized.find((p) => p.id === ref.id)!;
      expect(pers.personalizedDay).toBeLessThanOrEqual(ref.expectedDayPostOp);
    });

    it('should lengthen timelines for elderly patients with comorbidities', () => {
      const personalized = tracker.personalizeTimeline('knee_replacement', elderlyComorbid);
      const baseline = tracker.getMilestones('knee_replacement');
      const ref = baseline.find((m) => m.expectedDayPostOp > 10)!;
      const pers = personalized.find((p) => p.id === ref.id)!;
      expect(pers.personalizedDay).toBeGreaterThan(ref.expectedDayPostOp);
    });

    it('should adjust deviations when patient factors are supplied', () => {
      tracker.trackProgress('P001', 'kr-mob-4', 'achieved', 20);
      const withoutFactors = tracker.assessDeviation('P001', 'knee_replacement', 25);
      const withFactors = tracker.assessDeviation('P001', 'knee_replacement', 25, elderlyComorbid);
      const devWithout = withoutFactors.find((d) => d.milestoneId === 'kr-mob-4')!;
      const devWith = withFactors.find((d) => d.milestoneId === 'kr-mob-4')!;
      // Personalized day should be later for the comorbid patient
      expect(devWith.personalizedDay).toBeGreaterThan(devWithout.personalizedDay);
    });
  });

  // ----------------------------------------------------------------
  // Comparative Analysis
  // ----------------------------------------------------------------
  describe('getComparativeAnalysis', () => {
    it('should return zero progress when no milestones are achieved', () => {
      const analysis = tracker.getComparativeAnalysis('P001', 'appendectomy', 5);
      expect(analysis.overallProgressPct).toBe(0);
      expect(analysis.aheadCount).toBe(0);
      expect(analysis.behindCount).toBe(0);
      expect(analysis.onTrackCount).toBe(0);
    });

    it('should compute progress after achieving milestones', () => {
      tracker.trackProgress('P001', 'ap-mob-1', 'achieved', 0);
      tracker.trackProgress('P001', 'ap-wh-1', 'achieved', 3);
      tracker.trackProgress('P001', 'ap-pm-1', 'achieved', 3);
      const analysis = tracker.getComparativeAnalysis('P001', 'appendectomy', 5);
      expect(analysis.overallProgressPct).toBeGreaterThan(0);
      expect(analysis.onTrackCount + analysis.aheadCount + analysis.behindCount).toBeGreaterThan(0);
    });

    it('should have a category breakdown for all five categories', () => {
      const analysis = tracker.getComparativeAnalysis('P001', 'knee_replacement', 50);
      const categories: MilestoneCategory[] = [
        'mobility', 'wound_healing', 'pain_management', 'functional_independence', 'return_to_work',
      ];
      for (const cat of categories) {
        expect(analysis.categoryBreakdown[cat]).toBeDefined();
        expect(analysis.categoryBreakdown[cat]).toBeGreaterThanOrEqual(0);
      }
    });

    it('should compute a cohort percentile between 1 and 99', () => {
      tracker.trackProgress('P001', 'ap-mob-1', 'achieved', 0);
      const analysis = tracker.getComparativeAnalysis('P001', 'appendectomy', 5);
      expect(analysis.cohortPercentile).toBeGreaterThanOrEqual(1);
      expect(analysis.cohortPercentile).toBeLessThanOrEqual(99);
    });
  });

  // ----------------------------------------------------------------
  // Self-Learning via recordOutcome
  // ----------------------------------------------------------------
  describe('recordOutcome (self-learning)', () => {
    it('should update learned adjustments after recording outcomes', () => {
      const factors: PatientFactors = {
        age: 60, bmi: 28, comorbidities: [], smokingStatus: 'never', activityLevelPreOp: 'moderate',
      };
      // Record several outcomes that are slower than expected
      tracker.recordOutcome('knee_replacement', factors, 'kr-mob-3', 5);
      tracker.recordOutcome('knee_replacement', factors, 'kr-mob-3', 6);
      // Personalization should now reflect the learned data
      const personalized = tracker.personalizeTimeline('knee_replacement', factors);
      const mob3 = personalized.find((p) => p.id === 'kr-mob-3')!;
      // The learned adjustment should influence the personalized day
      expect(mob3.personalizedDay).toBeDefined();
      expect(typeof mob3.personalizedDay).toBe('number');
    });

    it('should ignore outcomes for non-existent milestones', () => {
      const factors: PatientFactors = {
        age: 50, bmi: 25, comorbidities: [], smokingStatus: 'never', activityLevelPreOp: 'moderate',
      };
      // Should not throw
      expect(() =>
        tracker.recordOutcome('knee_replacement', factors, 'nonexistent-milestone', 5),
      ).not.toThrow();
    });

    it('should use exponential moving average for learned adjustments', () => {
      const factors: PatientFactors = {
        age: 50, bmi: 25, comorbidities: [], smokingStatus: 'never', activityLevelPreOp: 'moderate',
      };
      // kr-pm-1 expected day 1
      tracker.recordOutcome('knee_replacement', factors, 'kr-pm-1', 2);
      const first = tracker.personalizeTimeline('knee_replacement', factors);
      const pm1First = first.find((p) => p.id === 'kr-pm-1')!;

      tracker.recordOutcome('knee_replacement', factors, 'kr-pm-1', 3);
      const second = tracker.personalizeTimeline('knee_replacement', factors);
      const pm1Second = second.find((p) => p.id === 'kr-pm-1')!;

      // Second outcome should shift the learned value further
      expect(pm1Second.personalizedDay).toBeGreaterThanOrEqual(pm1First.personalizedDay);
    });
  });

  // ----------------------------------------------------------------
  // Edge Cases
  // ----------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle day 0 milestones correctly', () => {
      // Several surgeries have day-0 milestones (appendectomy, cholecystectomy, hernia_repair)
      const milestones = tracker.getMilestones('appendectomy');
      const dayZero = milestones.filter((m) => m.expectedDayPostOp === 0);
      expect(dayZero.length).toBeGreaterThan(0);
    });

    it('should handle milestones with prerequisites', () => {
      const milestones = tracker.getMilestones('knee_replacement');
      const withPrereqs = milestones.filter((m) => m.prerequisites.length > 0);
      expect(withPrereqs.length).toBeGreaterThan(0);
      // All prerequisites should reference valid milestone IDs
      const allIds = new Set(milestones.map((m) => m.id));
      for (const m of withPrereqs) {
        for (const prereq of m.prerequisites) {
          expect(allIds.has(prereq)).toBe(true);
        }
      }
    });

    it('should not allow multiplier to go below 0.5', () => {
      const superHealthy: PatientFactors = {
        age: 18, bmi: 20, comorbidities: [], smokingStatus: 'never', activityLevelPreOp: 'active',
      };
      const personalized = tracker.personalizeTimeline('knee_replacement', superHealthy);
      for (const m of personalized) {
        // Day 0 milestones will be 0 regardless of multiplier, but non-zero should respect floor
        if (m.expectedDayPostOp > 0) {
          expect(m.personalizedDay).toBeGreaterThanOrEqual(
            Math.round(m.expectedDayPostOp * 0.5),
          );
        }
      }
    });
  });
});
