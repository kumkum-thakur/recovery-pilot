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
      
      expect(store.currentUser?.streakCount).toBe(5);
      
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
      expect(store.currentUser?.streakCount).toBe(0);
      
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
  }