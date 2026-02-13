import { describe, it, expect, beforeEach } from 'vitest';
import {
  gamificationEngine,
  BADGE_DEFINITIONS,
  LEVEL_DEFINITIONS,
  REWARD_STORE_ITEMS,
  XPEventType,
  BadgeCategory,
  BadgeRarity,
} from '../gamificationEngine';

describe('GamificationEngine', () => {
  const testPatientId = `test-patient-${Date.now()}`;

  beforeEach(() => {
    // Reset profile for each test
    localStorage.clear();
  });

  describe('profile management', () => {
    it('should create a default profile for a new patient', () => {
      const profile = gamificationEngine.getProfile(testPatientId);

      expect(profile.patientId).toBe(testPatientId);
      expect(profile.stats.totalXP).toBe(0);
      expect(profile.stats.currentLevel).toBe(1);
      expect(profile.stats.currentStreak).toBe(0);
      expect(profile.earnedBadges).toHaveLength(0);
      expect(profile.xpHistory).toHaveLength(0);
      expect(profile.createdAt).toBeTruthy();
    });

    it('should return the same profile on subsequent calls', () => {
      const profile1 = gamificationEngine.getProfile(testPatientId);
      const profile2 = gamificationEngine.getProfile(testPatientId);

      expect(profile1.patientId).toBe(profile2.patientId);
      expect(profile1.createdAt).toBe(profile2.createdAt);
    });

    it('should reset a profile correctly', () => {
      // Award some XP first
      gamificationEngine.awardXP(testPatientId, XPEventType.MISSION_COMPLETE);
      const beforeReset = gamificationEngine.getProfile(testPatientId);
      expect(beforeReset.stats.totalXP).toBeGreaterThan(0);

      const resetProfile = gamificationEngine.resetProfile(testPatientId);
      expect(resetProfile.stats.totalXP).toBe(0);
      expect(resetProfile.stats.currentLevel).toBe(1);
      expect(resetProfile.earnedBadges).toHaveLength(0);
    });
  });

  describe('XP system', () => {
    it('should award XP for completing a mission', () => {
      const result = gamificationEngine.awardXP(testPatientId, XPEventType.MISSION_COMPLETE);

      expect(result.xpAwarded).toBeGreaterThan(0);
      const profile = gamificationEngine.getProfile(testPatientId);
      expect(profile.stats.totalXP).toBe(result.xpAwarded);
      expect(profile.xpHistory.length).toBeGreaterThan(0);
    });

    it('should apply streak multiplier correctly', () => {
      // No streak = 1.0x multiplier
      const noStreakMultiplier = gamificationEngine.getStreakMultiplier(0);
      expect(noStreakMultiplier).toBe(1.0);

      // 7-day streak = 1.5x multiplier
      const weekMultiplier = gamificationEngine.getStreakMultiplier(7);
      expect(weekMultiplier).toBe(1.5);

      // 14-day streak = 2.0x multiplier
      const fortnightMultiplier = gamificationEngine.getStreakMultiplier(14);
      expect(fortnightMultiplier).toBe(2.0);

      // 30-day streak = 3.0x multiplier
      const monthMultiplier = gamificationEngine.getStreakMultiplier(30);
      expect(monthMultiplier).toBe(3.0);
    });

    it('should award daily login bonus only once per day', () => {
      const first = gamificationEngine.awardDailyLoginBonus(testPatientId);
      expect(first.awarded).toBe(true);
      expect(first.xpAwarded).toBeGreaterThan(0);

      const second = gamificationEngine.awardDailyLoginBonus(testPatientId);
      expect(second.awarded).toBe(false);
      expect(second.xpAwarded).toBe(0);
    });
  });

  describe('badge definitions', () => {
    it('should have 60+ badge definitions across categories', () => {
      expect(BADGE_DEFINITIONS.length).toBeGreaterThanOrEqual(60);

      // Check that badges span multiple categories
      const categories = new Set(BADGE_DEFINITIONS.map((b) => b.category));
      expect(categories.size).toBeGreaterThanOrEqual(5);
      expect(categories.has(BadgeCategory.STREAK)).toBe(true);
      expect(categories.has(BadgeCategory.MISSION)).toBe(true);
      expect(categories.has(BadgeCategory.EXERCISE)).toBe(true);
    });

    it('should have badges with valid structure', () => {
      for (const badge of BADGE_DEFINITIONS) {
        expect(badge.id).toBeTruthy();
        expect(badge.name).toBeTruthy();
        expect(badge.description).toBeTruthy();
        expect(badge.xpReward).toBeGreaterThanOrEqual(0);
        expect(Object.values(BadgeRarity)).toContain(badge.rarity);
        expect(typeof badge.condition).toBe('function');
      }
    });
  });

  describe('level definitions', () => {
    it('should have 20 levels with increasing XP requirements', () => {
      expect(LEVEL_DEFINITIONS).toHaveLength(20);

      for (let i = 1; i < LEVEL_DEFINITIONS.length; i++) {
        expect(LEVEL_DEFINITIONS[i].xpRequired).toBeGreaterThan(
          LEVEL_DEFINITIONS[i - 1].xpRequired,
        );
        expect(LEVEL_DEFINITIONS[i].level).toBe(i + 1);
      }
    });

    it('should have names and rewards for each level', () => {
      for (const level of LEVEL_DEFINITIONS) {
        expect(level.name).toBeTruthy();
        expect(level.title).toBeTruthy();
        expect(level.reward).toBeTruthy();
      }
    });
  });

  describe('reward store', () => {
    it('should have reward items across categories', () => {
      expect(REWARD_STORE_ITEMS.length).toBeGreaterThan(10);

      const categories = new Set(REWARD_STORE_ITEMS.map((r) => r.category));
      expect(categories.size).toBeGreaterThanOrEqual(3);

      for (const item of REWARD_STORE_ITEMS) {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.cost).toBeGreaterThan(0);
      }
    });
  });
});
