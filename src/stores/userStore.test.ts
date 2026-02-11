/**
 * Unit tests for UserStore
 * 
 * Tests authentication, logout, and streak update functionality
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 10.1, 10.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from './userStore';
import { persistenceService } from '../services/persistenceService';
import { authService } from '../services/authService';
import type { UserModel } from '../types';
import { UserRole } from '../types';

// Mock data
const mockPatient: UserModel = {
  id: 'patient-test-1',
  username: 'testpatient',
  passwordHash: 'simple_hash_password123',
  name: 'Test Patient',
  role: UserRole.PATIENT,
  streakCount: 5,
  lastLoginDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const mockDoctor: UserModel = {
  id: 'doctor-test-1',
  username: 'testdoctor',
  passwordHash: 'simple_hash_docpass',
  name: 'Dr. Test',
  role: UserRole.DOCTOR,
  streakCount: 0,
  lastLoginDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe('UserStore', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset store state
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
    });
    
    // Initialize with test users
    persistenceService.saveUser(mockPatient);
    persistenceService.saveUser(mockDoctor);
  });

  describe('Initial State', () => {
    it('should initialize with no user and not authenticated', () => {
      const store = useUserStore.getState();
      expect(store.currentUser).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login a patient with valid credentials', async () => {
      // Requirement 1.1: Patient authentication
      const store = useUserStore.getState();
      
      await store.login({
        username: 'testpatient',
        password: 'password123',
      });
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser).not.toBeNull();
      expect(state.currentUser?.id).toBe('patient-test-1');
      expect(state.currentUser?.name).toBe('Test Patient');
      expect(state.currentUser?.role).toBe(UserRole.PATIENT);
      expect(state.currentUser?.streakCount).toBe(5);
    });

    it('should successfully login a doctor with valid credentials', async () => {
      // Requirement 2.1: Doctor authentication
      const store = useUserStore.getState();
      
      await store.login({
        username: 'testdoctor',
        password: 'docpass',
      });
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser).not.toBeNull();
      expect(state.currentUser?.id).toBe('doctor-test-1');
      expect(state.currentUser?.name).toBe('Dr. Test');
      expect(state.currentUser?.role).toBe(UserRole.DOCTOR);
    });

    it('should reject login with invalid username', async () => {
      // Requirement 1.2: Invalid credentials rejection
      const store = useUserStore.getState();
      
      await expect(
        store.login({
          username: 'nonexistent',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid username or password');
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
    });

    it('should reject login with invalid password', async () => {
      // Requirement 1.2: Invalid credentials rejection
      const store = useUserStore.getState();
      
      await expect(
        store.login({
          username: 'testpatient',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid username or password');
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
    });

    it('should reject login with empty credentials', async () => {
      // Edge case: Empty credentials
      const store = useUserStore.getState();
      
      await expect(
        store.login({
          username: '',
          password: '',
        })
      ).rejects.toThrow('Username and password are required');
    });

    it('should update last login date on successful login', async () => {
      // Requirement 1.1: Update last login date
      const beforeLogin = new Date().toISOString();
      
      const store = useUserStore.getState();
      await store.login({
        username: 'testpatient',
        password: 'password123',
      });
      
      const afterLogin = new Date().toISOString();
      const userModel = persistenceService.getUser('patient-test-1');
      
      expect(userModel).not.toBeNull();
      expect(userModel!.lastLoginDate).toBeDefined();
      expect(userModel!.lastLoginDate >= beforeLogin).toBe(true);
      expect(userModel!.lastLoginDate <= afterLogin).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user state and authentication status', async () => {
      // Requirement 1.1: Logout functionality
      const store = useUserStore.getState();
      
      // First login
      await store.login({
        username: 'testpatient',
        password: 'password123',
      });
      
      expect(useUserStore.getState().isAuthenticated).toBe(true);
      
      // Then logout
      store.logout();
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
    });

    it('should clear session storage on logout', async () => {
      // Requirement 1.1: Clear session
      const store = useUserStore.getState();
      
      // Login
      await store.login({
        username: 'testpatient',
        password: 'password123',
      });
      
      expect(authService.getCurrentUser()).not.toBeNull();
      
      // Logout
      store.logout();
      
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should be safe to call logout when not logged in', () => {
      // Edge case: Logout when not authenticated
      const store = useUserStore.getState();
      
      expect(() => store.logout()).not.toThrow();
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
    });
  });

  describe('updateStreak', () => {
    beforeEach(async () => {
      // Login as patient before each streak test
      const store = useUserStore.getState();
      await store.login({
        username: 'testpatient',
        password: 'password123',
      });
    });

    it('should update streak count for patient', () => {
      // Requirement 10.1: Streak increment
      const store = useUserStore.getState();
      
      expect(store.currentUser?.streakCount).toBe(5);
      
      store.updateStreak(6);
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(6);
    });

    it('should persist streak count to storage', () => {
      // Requirement 10.4: Persist streak across sessions
      const store = useUserStore.getState();
      
      store.updateStreak(10);
      
      const userModel = persistenceService.getUser('patient-test-1');
      expect(userModel?.streakCount).toBe(10);
    });

    it('should update session with new streak count', () => {
      // Requirement 1.4: Retrieve and display streak count
      const store = useUserStore.getState();
      
      store.updateStreak(7);
      
      const sessionUser = authService.getCurrentUser();
      expect(sessionUser?.streakCount).toBe(7);
    });

    it('should allow resetting streak to zero', () => {
      // Requirement 10.2: Reset streak on missed day
      const store = useUserStore.getState();
      
      store.updateStreak(0);
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(0);
    });

    it('should reject negative streak counts', () => {
      // Edge case: Negative streak count
      const store = useUserStore.getState();
      
      expect(() => store.updateStreak(-1)).toThrow('Streak count cannot be negative');
      
      // Streak should remain unchanged
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(5);
    });

    it('should throw error when no user is logged in', () => {
      // Edge case: Update streak without login
      const store = useUserStore.getState();
      store.logout();
      
      expect(() => store.updateStreak(10)).toThrow('No user is currently logged in');
    });

    it('should throw error when user is a doctor', async () => {
      // Edge case: Doctor cannot have streak
      const store = useUserStore.getState();
      
      // Logout patient and login as doctor
      store.logout();
      await store.login({
        username: 'testdoctor',
        password: 'docpass',
      });
      
      expect(() => store.updateStreak(5)).toThrow('Only patients can have streak counts');
    });

    it('should handle large streak counts', () => {
      // Edge case: Large streak count
      const store = useUserStore.getState();
      
      store.updateStreak(365);
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(365);
    });
  });

  describe('Integration', () => {
    it('should maintain streak count across logout and login', async () => {
      // Requirement 10.4: Persist streak across sessions
      const store = useUserStore.getState();
      
      // Login and update streak
      await store.login({
        username: 'testpatient',
        password: 'password123',
      });
      store.updateStreak(15);
      
      // Logout
      store.logout();
      expect(useUserStore.getState().currentUser).toBeNull();
      
      // Login again
      await store.login({
        username: 'testpatient',
        password: 'password123',
      });
      
      // Streak should be preserved
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(15);
    });

    it('should handle multiple sequential logins', async () => {
      // Edge case: Multiple logins
      const store = useUserStore.getState();
      
      // Login as patient
      await store.login({
        username: 'testpatient',
        password: 'password123',
      });
      expect(useUserStore.getState().currentUser?.role).toBe(UserRole.PATIENT);
      
      // Logout
      store.logout();
      
      // Login as doctor
      await store.login({
        username: 'testdoctor',
        password: 'docpass',
      });
      expect(useUserStore.getState().currentUser?.role).toBe(UserRole.DOCTOR);
    });
  });
});
