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
        mes