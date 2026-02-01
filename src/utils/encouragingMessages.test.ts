/**
 * Unit tests for Encouraging Messages Utility
 * 
 * Validates that encouraging messages are properly generated for different
 * mission types and triage results, implementing the "Recovery Buddy" tone.
 * 
 * Requirements: 11.2 - Tone of Voice: encouraging, slightly humorous text
 */

import { describe, it, expect } from 'vitest';
import {
  getEncouragingMessage,
  getTriageEncouragingMessage,
  getStreakMilestoneMessage,
  getStreakMessage,
  getAllMissionsCompleteMessage,
} from './encouragingMessages';
import { MissionType } from '../types';

describe('encouragingMessages', () => {
  describe('getEncouragingMessage', () => {
    it('should return a message for photo upload missions', () => {
      const message = getEncouragingMessage(MissionType.PHOTO_UPLOAD);
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return a message for medication check missions', () => {
      const message = getEncouragingMessage(MissionType.MEDICATION_CHECK);
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return a message for exercise log missions', () => {
      const message = getEncouragingMessage(MissionType.EXERCISE_LOG);
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should include the specific example "You crushed that pill schedule! 💊" for medication checks', () => {
      // Run multiple times to check if the message appears (it's random)
      const messages = new Set<string>();
      for (let i = 0; i < 50; i++) {
        messages.add(getEncouragingMessage(MissionType.MEDICATION_CHECK));
      }
      
      // Check that the specific example from requirements is in the pool
      expect(Array.from(messages)).toContain("You crushed that pill schedule! 💊");
    });

    it('should include the specific example "Incision looking sharp! (Not literally) ✨" for photo uploads', () => {
      // Run multiple times to check if the message appears (it's random)
      const messages = new Set<string>();
      for (let i = 0; i < 50; i++) {
        messages.add(getEncouragingMessage(MissionType.PHOTO_UPLOAD));
      }
      
      // Check that the specific example from requirements is in the pool
      expect(Array.from(messages)).toContain("Incision looking sharp! (Not literally) ✨");
    });

    it('should return varied messages for the same mission type', () => {
      const messages = new Set<string>();
      
      // Generate 20 messages for the same mission type
      for (let i = 0; i < 20; i++) {
        messages.add(getEncouragingMessage(MissionType.MEDICATION_CHECK));
      }
      
      // Should have at least 2 different messages (randomization)
      expect(messages.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getTriageEncouragingMessage', () => {
    it('should return a positive message for green analysis', () => {
      const message = getTriageEncouragingMessage('green');
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return a supportive message for red analysis', () => {
      const message = getTriageEncouragingMessage('red');
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return different messages for green vs red analysis', () => {
      const greenMessage = getTriageEncouragingMessage('green');
      const redMessage = getTriageEncouragingMessage('red');
      
      // Messages should be different (though technically could be same by chance)
      // More importantly, they should have different tones
      expect(greenMessage).not.toBe(redMessage);
    });

    it('should return varied messages for green analysis', () => {
      const messages = new Set<string>();
      
      for (let i = 0; i < 20; i++) {
        messages.add(getTriageEncouragingMessage('green'));
      }
      
      expect(messages.size).toBeGreaterThanOrEqual(2);
    });

    it('should return varied messages for red analysis', () => {
      const messages = new Set<string>();
      
      for (let i = 0; i < 20; i++) {
        messages.add(getTriageEncouragingMessage('red'));
      }
      
      expect(messages.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getStreakMilestoneMessage', () => {
    it('should return a special message for 7-day milestone', () => {
      const message = getStreakMilestoneMessage(7);
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toContain('week');
    });

    it('should return a special message for 30-day milestone', () => {
      const message = getStreakMilestoneMessage(30);
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toMatch(/30|month/);
    });

    it('should return a special message for 100-day milestone', () => {
      const message = getStreakMilestoneMessage(100);
      expect(message).toBeTruthy();
      expect(message).toContain('100');
    });

    it('should return a generic message for non-milestone streaks', () => {
      const message = getStreakMilestoneMessage(5);
      expect(message).toBeTruthy();
      expect(message).toContain('5 days');
    });
  });

  describe('getStreakMessage', () => {
    it('should return a start message for 0 streak', () => {
      const message = getStreakMessage(0);
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toContain('start');
    });

    it('should return an encouraging message for 1 day streak', () => {
      const message = getStreakMessage(1);
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toContain('start');
    });

    it('should return a momentum message for streaks under 7 days', () => {
      const message = getStreakMessage(5);
      expect(message).toBeTruthy();
      expect(message).toContain('5 days');
    });

    it('should return an escalating message for longer streaks', () => {
      const message = getStreakMessage(50);
      expect(message).toBeTruthy();
      expect(message).toContain('50 days');
    });

    it('should return a legendary message for 100+ day streaks', () => {
      const message = getStreakMessage(150);
      expect(message).toBeTruthy();
      expect(message).toContain('150 days');
      expect(message.toLowerCase()).toContain('legend');
    });
  });

  describe('getAllMissionsCompleteMessage', () => {
    it('should return a celebratory message', () => {
      const message = getAllMissionsCompleteMessage();
      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return varied messages', () => {
      const messages = new Set<string>();
      
      for (let i = 0; i < 20; i++) {
        messages.add(getAllMissionsCompleteMessage());
      }
      
      expect(messages.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('tone and style validation', () => {
    it('should include emojis in messages for friendly tone', () => {
      const photoMessage = getEncouragingMessage(MissionType.PHOTO_UPLOAD);
      const medMessage = getEncouragingMessage(MissionType.MEDICATION_CHECK);
      const exerciseMessage = getEncouragingMessage(MissionType.EXERCISE_LOG);
      
      // At least one should have an emoji (most do)
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u;
      const messages = [photoMessage, medMessage, exerciseMessage];
      const withEmojis = messages.filter(m => hasEmoji.test(m));
      
      expect(withEmojis.length).toBeGreaterThan(0);
    });

    it('should use encouraging language', () => {
      const encouragingWords = [
        'crushed', 'amazing', 'great', 'awesome', 'perfect',
        'champion', 'boss', 'unstoppable', 'crushing', 'fire',
        'superstar', 'legend', 'incredible', 'phenomenal'
      ];
      
      const messages = [
        getEncouragingMessage(MissionType.MEDICATION_CHECK),
        getEncouragingMessage(MissionType.PHOTO_UPLOAD),
        getEncouragingMessage(MissionType.EXERCISE_LOG),
        getTriageEncouragingMessage('green'),
        getStreakMessage(10),
      ];
      
      // At least some messages should contain encouraging words
      const withEncouragement = messages.filter(msg =>
        encouragingWords.some(word => msg.toLowerCase().includes(word))
      );
      
      expect(withEncouragement.length).toBeGreaterThan(0);
    });
  });
});
