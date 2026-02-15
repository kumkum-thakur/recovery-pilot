import { describe, it, expect, beforeEach } from 'vitest';
import { PatientEducationEngine } from '../patientEducationEngine';

describe('PatientEducationEngine', () => {
  let engine: PatientEducationEngine;

  beforeEach(() => {
    engine = new PatientEducationEngine();
  });

  // ── Content Retrieval ──

  describe('getContent()', () => {
    it('should return education content for knee_replacement', () => {
      const content = engine.getContent('knee_replacement');
      expect(content).not.toBeNull();
      expect(content!.conditionId).toBe('knee_replacement');
      expect(content!.title).toBe('Total Knee Replacement Recovery');
      expect(content!.phases).toHaveLength(4);
      expect(content!.citations.length).toBeGreaterThan(0);
      expect(content!.keywords).toContain('knee');
    });

    it('should return education content for cardiac_bypass', () => {
      const content = engine.getContent('cardiac_bypass');
      expect(content).not.toBeNull();
      expect(content!.title).toContain('CABG');
      expect(content!.phases).toHaveLength(4);
    });

    it('should return null for an unknown condition', () => {
      const content = engine.getContent('nonexistent_condition');
      expect(content).toBeNull();
    });

    it('should have all four recovery phases in each condition entry', () => {
      const content = engine.getContent('hip_replacement');
      expect(content).not.toBeNull();
      const phases = content!.phases.map(p => p.phase);
      expect(phases).toContain('immediate');
      expect(phases).toContain('early');
      expect(phases).toContain('intermediate');
      expect(phases).toContain('late');
    });

    it('should include warning signals in each phase', () => {
      const content = engine.getContent('appendectomy');
      expect(content).not.toBeNull();
      for (const phase of content!.phases) {
        expect(phase.warningSignals.length).toBeGreaterThan(0);
      }
    });
  });

  // ── getAllConditions ──

  describe('getAllConditions()', () => {
    it('should return a list of all available conditions', () => {
      const conditions = engine.getAllConditions();
      expect(conditions.length).toBeGreaterThan(10);
      const ids = conditions.map(c => c.conditionId);
      expect(ids).toContain('knee_replacement');
      expect(ids).toContain('hip_replacement');
      expect(ids).toContain('cardiac_bypass');
      expect(ids).toContain('appendectomy');
      expect(ids).toContain('cesarean_section');
    });

    it('should return objects with conditionId and title', () => {
      const conditions = engine.getAllConditions();
      for (const c of conditions) {
        expect(c).toHaveProperty('conditionId');
        expect(c).toHaveProperty('title');
        expect(typeof c.conditionId).toBe('string');
        expect(typeof c.title).toBe('string');
      }
    });
  });

  // ── Literacy Assessment ──

  describe('assessLiteracy()', () => {
    it('should rate a high score for many correct REALM-SF words as advanced', () => {
      const correctWords = ['fat', 'flu', 'pill', 'dose', 'eye', 'stress', 'smear', 'nerves',
        'germs', 'meals', 'disease', 'cancer', 'caffeine', 'attack', 'kidney',
        'hormones', 'herpes', 'seizure', 'bowel', 'asthma'];
      const result = engine.assessLiteracy(correctWords);
      expect(result.level).toBe('advanced');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.wordsCorrect).toBeGreaterThanOrEqual(20);
      expect(result.recommendation).toContain('standard medical materials');
    });

    it('should rate a moderate score for partially correct words as intermediate', () => {
      const words = ['fat', 'flu', 'pill', 'dose', 'eye', 'stress', 'wrongword1',
        'wrongword2', 'wrongword3', 'wrongword4'];
      const result = engine.assessLiteracy(words);
      expect(result.level).toBe('intermediate');
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.score).toBeLessThan(80);
      expect(result.recommendation).toContain('simplified language');
    });

    it('should rate a low score as basic reading level', () => {
      const words = ['wrongA', 'wrongB', 'wrongC', 'wrongD', 'wrongE',
        'wrongF', 'wrongG', 'wrongH', 'wrongI', 'wrongJ'];
      const result = engine.assessLiteracy(words);
      expect(result.level).toBe('basic');
      expect(result.score).toBeLessThan(50);
      expect(result.recommendation).toContain('plain-language');
    });

    it('should handle an empty word list gracefully', () => {
      const result = engine.assessLiteracy([]);
      expect(result.wordsCorrect).toBe(0);
      expect(result.totalWords).toBe(0);
      expect(typeof result.level).toBe('string');
    });

    it('should be case-insensitive and trim whitespace', () => {
      const result = engine.assessLiteracy(['  FAT  ', 'FLU', '  Pill']);
      expect(result.wordsCorrect).toBe(3);
    });
  });

  // ── Teach-Back Questions ──

  describe('getTeachBackQuestions()', () => {
    it('should return teach-back questions for a valid condition', () => {
      const questions = engine.getTeachBackQuestions('knee_replacement');
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('expectedAnswer');
        expect(q).toHaveProperty('hints');
        expect(q).toHaveProperty('difficulty');
      }
    });

    it('should filter questions by difficulty level', () => {
      const basicQuestions = engine.getTeachBackQuestions('knee_replacement', 'basic');
      expect(basicQuestions.length).toBeGreaterThan(0);
      for (const q of basicQuestions) {
        expect(q.difficulty).toBe('basic');
      }
    });

    it('should return empty array for unknown condition', () => {
      const questions = engine.getTeachBackQuestions('nonexistent');
      expect(questions).toEqual([]);
    });

    it('should return all questions when no difficulty filter is provided', () => {
      const all = engine.getTeachBackQuestions('knee_replacement');
      const basic = engine.getTeachBackQuestions('knee_replacement', 'basic');
      const intermediate = engine.getTeachBackQuestions('knee_replacement', 'intermediate');
      expect(all.length).toBeGreaterThanOrEqual(basic.length + intermediate.length);
    });

    it('should include hints in each teach-back question', () => {
      const questions = engine.getTeachBackQuestions('cardiac_bypass');
      for (const q of questions) {
        expect(q.hints.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Personalized Content ──

  describe('personalizeContent()', () => {
    it('should return simplified content for basic reading level', () => {
      const result = engine.personalizeContent('knee_replacement', 'basic');
      expect(result).not.toBeNull();
      expect(result!.format).toBe('simplified');
      expect(result!.readingLevel).toBe('basic');
      expect(result!.body).toContain('What to do:');
      expect(result!.body).toContain('Watch out for:');
    });

    it('should return bullet point content for intermediate reading level', () => {
      const result = engine.personalizeContent('knee_replacement', 'intermediate');
      expect(result).not.toBeNull();
      expect(result!.format).toBe('bullet_points');
      expect(result!.readingLevel).toBe('intermediate');
      expect(result!.body).toContain('Goals:');
      expect(result!.body).toContain('Activities:');
    });

    it('should return full text content for advanced reading level', () => {
      const result = engine.personalizeContent('knee_replacement', 'advanced');
      expect(result).not.toBeNull();
      expect(result!.format).toBe('text');
      expect(result!.readingLevel).toBe('advanced');
      expect(result!.body).toContain('References:');
    });

    it('should filter content to a specific recovery phase', () => {
      const immediateOnly = engine.personalizeContent('knee_replacement', 'intermediate', 'immediate');
      const allPhases = engine.personalizeContent('knee_replacement', 'intermediate');
      expect(immediateOnly).not.toBeNull();
      expect(allPhases).not.toBeNull();
      // Content limited to one phase should be shorter than all phases
      expect(immediateOnly!.body.length).toBeLessThan(allPhases!.body.length);
    });

    it('should return null for unknown condition', () => {
      const result = engine.personalizeContent('nonexistent', 'basic');
      expect(result).toBeNull();
    });

    it('should include an estimated read time', () => {
      const result = engine.personalizeContent('cardiac_bypass', 'advanced');
      expect(result).not.toBeNull();
      expect(result!.estimatedReadTime).toBeGreaterThan(0);
    });

    it('should produce shorter body for simplified vs full format', () => {
      const basic = engine.personalizeContent('hip_replacement', 'basic');
      const advanced = engine.personalizeContent('hip_replacement', 'advanced');
      expect(basic).not.toBeNull();
      expect(advanced).not.toBeNull();
      // Simplified content should generally be shorter
      expect(basic!.body.length).toBeLessThan(advanced!.body.length);
    });
  });

  // ── Engagement Tracking ──

  describe('engagement tracking', () => {
    it('should record engagement and return stats for a patient', () => {
      engine.recordEngagement('patient1', 'knee_replacement', 'immediate', 120, true, 85);
      engine.recordEngagement('patient1', 'knee_replacement', 'early', 90, false, 0);

      const stats = engine.getEngagementStats('patient1');
      expect(stats.totalViews).toBe(2);
      expect(stats.avgDuration).toBe(105); // (120 + 90) / 2
      expect(stats.teachBackCompletionRate).toBe(0.5);
      expect(stats.avgTeachBackScore).toBe(85);
    });

    it('should return zero stats when no engagement recorded', () => {
      const stats = engine.getEngagementStats('nonexistent_patient');
      expect(stats.totalViews).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.teachBackCompletionRate).toBe(0);
      expect(stats.avgTeachBackScore).toBe(0);
    });

    it('should return overall stats when no patientId is provided', () => {
      engine.recordEngagement('patient1', 'knee_replacement', 'immediate', 100, true, 90);
      engine.recordEngagement('patient2', 'hip_replacement', 'early', 200, true, 70);

      const overallStats = engine.getEngagementStats();
      expect(overallStats.totalViews).toBe(2);
      expect(overallStats.avgDuration).toBe(150);
    });

    it('should track popular content by view counts', () => {
      engine.recordEngagement('p1', 'knee_replacement', 'immediate', 60, false, 0);
      engine.recordEngagement('p2', 'knee_replacement', 'immediate', 60, false, 0);
      engine.recordEngagement('p3', 'knee_replacement', 'immediate', 60, false, 0);
      engine.recordEngagement('p4', 'hip_replacement', 'early', 60, false, 0);

      const popular = engine.getPopularContent();
      expect(popular.length).toBeGreaterThan(0);
      // knee_replacement:immediate should be the most popular with 3 views
      expect(popular[0].conditionId).toBe('knee_replacement');
      expect(popular[0].section).toBe('immediate');
      expect(popular[0].views).toBe(3);
    });

    it('should limit popular content to top 10', () => {
      // Record views for more than 10 different sections
      for (let i = 0; i < 15; i++) {
        engine.recordEngagement('p1', `condition_${i}`, `section_${i}`, 30, false, 0);
      }
      const popular = engine.getPopularContent();
      expect(popular.length).toBeLessThanOrEqual(10);
    });
  });

  // ── Surgery Types Coverage ──

  describe('surgery types coverage', () => {
    const expectedConditions = [
      'knee_replacement',
      'hip_replacement',
      'cardiac_bypass',
      'appendectomy',
      'cesarean_section',
      'cholecystectomy',
      'spinal_fusion',
      'mastectomy',
      'colectomy',
      'acl_reconstruction',
    ];

    for (const conditionId of expectedConditions) {
      it(`should have content for ${conditionId}`, () => {
        const content = engine.getContent(conditionId);
        expect(content).not.toBeNull();
        expect(content!.summary.length).toBeGreaterThan(0);
        expect(content!.phases.length).toBe(4);
        expect(content!.teachBackQuestions.length).toBeGreaterThan(0);
      });
    }
  });
});
