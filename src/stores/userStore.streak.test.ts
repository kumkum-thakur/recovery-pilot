/**
 * Unit tests for UserStore streak tracking logic
 * 
 * Tests the new streak increment, reset, and missed day detection functionality
 * Requirements: 10.1, 10.2, 10.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from './userStore';
import { persistenceService } from '../services/persistenceService';
import { UserRole } from '../types';
import type { UserModel } from '../types';

// Test user data
const TEST_PATIENT: UserModel = {
  id: 'patient-streak-test',
  username: 'streakpatient',
  passwordHash: 'simple_hash_password123',
  name: 'Streak Test Patient',
  role: UserRole.PATIENT,
  streakCount: 5,
  lastLoginDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe('UserStore - Streak Tracking', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset store state
    const store = useUserStore.getState();
    store.logout();
    
    // Save test user
    persistenceService.saveUser(TEST_PATIENT);
  });

  describe('incrementStreak', () => {
    it('should increment streak count by 1', async () => {
      // Requirement 10.1: Increment streak on all missions completed
      const store = useUserStore.getState();
      
      // Login as patient
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      const initialState = useUserStore.getState();
      expect(initialState.currentUser?.streakCount).toBe(5);
      
      // Increment streak
      store.incrementStreak();
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(6);
    });

    it('should persist incremented streak to storage', async () => {
      // Requirement 10.4: Persist streak across sessions
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      store.incrementStreak();
      
      const userModel = persistenceService.getUser('patient-streak-test');
      expect(userModel?.streakCount).toBe(6);
    });

    it('should increment from 0 to 1', async () => {
      // Edge case: First streak
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      // Reset to 0 first
      store.updateStreak(0);
      const afterReset = useUserStore.getState();
      expect(afterReset.currentUser?.streakCount).toBe(0);
      
      // Increment
      store.incrementStreak();
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(1);
    });

    it('should throw error when no user is logged in', () => {
      const store = useUserStore.getState();
      
      expect(() => store.incrementStreak()).toThrow('No user is currently logged in');
    });

    it('should throw error when user is a doctor', async () => {
      // Create doctor user
      const doctorUser: UserModel = {
        id: 'doctor-test',
        username: 'testdoctor',
        passwordHash: 'simple_hash_password123',
        name: 'Test Doctor',
        role: UserRole.DOCTOR,
        streakCount: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      persistenceService.saveUser(doctorUser);
      
      const store = useUserStore.getState();
      await store.login({
        username: 'testdoctor',
        password: 'password123',
      });
      
      expect(() => store.incrementStreak()).toThrow('Only patients can have streak counts');
    });
  });

  describe('resetStreak', () => {
    it('should reset streak count to 0', async () => {
      // Requirement 10.2: Reset streak on missed day
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      const initialState = useUserStore.getState();
      expect(initialState.currentUser?.streakCount).toBe(5);
      
      // Reset streak
      store.resetStreak();
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(0);
    });

    it('should persist reset streak to storage', async () => {
      // Requirement 10.4: Persist streak across sessions
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      store.resetStreak();
      
      const userModel = persistenceService.getUser('patient-streak-test');
      expect(userModel?.streakCount).toBe(0);
    });

    it('should be idempotent (resetting 0 to 0)', async () => {
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      store.resetStreak();
      const afterFirstReset = useUserStore.getState();
      expect(afterFirstReset.currentUser?.streakCount).toBe(0);
      
      // Reset again
      store.resetStreak();
      const afterSecondReset = useUserStore.getState();
      expect(afterSecondReset.currentUser?.streakCount).toBe(0);
    });

    it('should throw error when no user is logged in', () => {
      const store = useUserStore.getState();
      
      expect(() => store.resetStreak()).toThrow('No user is currently logged in');
    });

    it('should throw error when user is a doctor', async () => {
      const doctorUser: UserModel = {
        id: 'doctor-test',
        username: 'testdoctor',
        passwordHash: 'simple_hash_password123',
        name: 'Test Doctor',
        role: UserRole.DOCTOR,
        streakCount: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      persistenceService.saveUser(doctorUser);
      
      const store = useUserStore.getState();
      await store.login({
        username: 'testdoctor',
        password: 'password123',
      });
      
      expect(() => store.resetStreak()).toThrow('Only patients can have streak counts');
    });
  });

  describe('checkAndUpdateStreakForMissedDay', () => {
    it('should not reset streak if no last check date', async () => {
      // First time checking - should not reset
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      const beforeCheck = useUserStore.getState();
      const initialStreak = beforeCheck.currentUser?.streakCount;
      
      // Check for missed day (no last check date set)
      store.checkAndUpdateStreakForMissedDay();
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(initialStreak);
    });

    it('should not reset streak if checked today', async () => {
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      // Set last check date to today
      const today = new Date().toISOString();
      store.updateLastMissionCheckDate(today);
      
      const beforeCheck = useUserStore.getState();
      const initialStreak = beforeCheck.currentUser?.streakCount;
      
      // Check for missed day
      store.checkAndUpdateStreakForMissedDay();
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(initialStreak);
    });

    it('should not reset streak if checked yesterday', async () => {
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      // Set last check date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      store.updateLastMissionCheckDate(yesterday.toISOString());
      
      const beforeCheck = useUserStore.getState();
      const initialStreak = beforeCheck.currentUser?.streakCount;
      
      // Check for missed day
      store.checkAndUpdateStreakForMissedDay();
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(initialStreak);
    });

    it('should reset streak if more than 1 day has passed', async () => {
      // Requirement 10.2: Reset streak on missed day
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      // Set last check date to 3 days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      store.updateLastMissionCheckDate(threeDaysAgo.toISOString());
      
      const beforeCheck = useUserStore.getState();
      expect(beforeCheck.currentUser?.streakCount).toBe(5);
      
      // Check for missed day
      store.checkAndUpdateStreakForMissedDay();
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(0);
    });

    it('should not affect doctors', async () => {
      const doctorUser: UserModel = {
        id: 'doctor-test',
        username: 'testdoctor',
        passwordHash: 'simple_hash_password123',
        name: 'Test Doctor',
        role: UserRole.DOCTOR,
        streakCount: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      persistenceService.saveUser(doctorUser);
      
      const store = useUserStore.getState();
      await store.login({
        username: 'testdoctor',
        password: 'password123',
      });
      
      // Set last check date to 3 days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      store.updateLastMissionCheckDate(threeDaysAgo.toISOString());
      
      // Check for missed day - should not throw or change anything
      expect(() => store.checkAndUpdateStreakForMissedDay()).not.toThrow();
    });
  });

  describe('updateLastMissionCheckDate', () => {
    it('should update the last mission check date', async () => {
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      const testDate = new Date('2024-01-15').toISOString();
      store.updateLastMissionCheckDate(testDate);
      
      const state = useUserStore.getState();
      expect(state.lastMissionCheckDate).toBe(testDate);
    });
  });

  describe('Integration - Full streak workflow', () => {
    it('should handle complete streak workflow: increment, check, reset', async () => {
      const store = useUserStore.getState();
      
      await store.login({
        username: 'streakpatient',
        password: 'password123',
      });
      
      // Day 1: Complete missions, increment streak
      store.incrementStreak();
      store.updateLastMissionCheckDate(new Date().toISOString());
      expect(store.currentUser?.streakCount).toBe(6);
      
      // Day 2: Check for missed day (none), increment again
      store.checkAndUpdateStreakForMissedDay();
      expect(store.currentUser?.streakCount).toBe(6); // Not reset
      
      store.incrementStreak();
      expect(store.currentUser?.streakCount).toBe(7);
      
      // Simulate missing 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      store.updateLastMissionCheckDate(threeDaysAgo.toISOString());
      
      // Check for missed day - should reset
      store.checkAndUpdateStreakForMissedDay();
      expect(store.currentUser?.streakCount).toBe(0);
      
      // Start new streak
      store.incrementStreak();
      expect(store.currentUser?.streakCount).toBe(1);
    });
  });
});
