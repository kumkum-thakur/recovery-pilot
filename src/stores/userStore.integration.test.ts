/**
 * Integration tests for UserStore
 * 
 * Tests the full integration between UserStore, AuthService, and PersistenceService
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 10.1, 10.2, 10.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from './userStore';
import { persistenceService } from '../services/persistenceService';
import { authService } from '../services/authService';
import { SEED_USERS } from '../services/seedData';

describe('UserStore Integration', () => {
  beforeEach(() => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset store state
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
    });
    
    // Initialize with seed data
    SEED_USERS.forEach(user => persistenceService.saveUser(user));
  });

  describe('Patient Workflow', () => {
    it('should complete full patient authentication and streak update workflow', async () => {
      // Requirement 1.1, 1.4, 10.1, 10.4: Full patient workflow
      const store = useUserStore.getState();
      
      // Step 1: Login as patient
      await store.login({
        username: 'divya',
        password: 'divya',
      });
      
      const afterLogin = useUserStore.getState();
      expect(afterLogin.isAuthenticated).toBe(true);
      expect(afterLogin.currentUser).not.toBeNull();
      expect(afterLogin.currentUser?.name).toBe('Divya Patel');
      expect(afterLogin.currentUser?.role).toBe('patient');
      expect(afterLogin.currentUser?.streakCount).toBe(3);
      
      // Step 2: Complete missions and increment streak
      store.updateStreak(4);
      
      const afterStreakUpdate = useUserStore.getState();
      expect(afterStreakUpdate.currentUser?.streakCount).toBe(4);
      
      // Step 3: Verify persistence
      const userModel = persistenceService.getUser('patient-1');
      expect(userModel?.streakCount).toBe(4);
      
      // Step 4: Verify session
      const sessionUser = authService.getCurrentUser();
      expect(sessionUser?.streakCount).toBe(4);
      
      // Step 5: Logout
      store.logout();
      
      const afterLogout = useUserStore.getState();
      expect(afterLogout.isAuthenticated).toBe(false);
      expect(afterLogout.currentUser).toBeNull();
      
      // Step 6: Login again and verify streak persisted
      await store.login({
        username: 'divya',
        password: 'divya',
      });
      
      const afterRelogin = useUserStore.getState();
      expect(afterRelogin.currentUser?.streakCount).toBe(4);
    });

    it('should handle streak reset on missed day', async () => {
      // Requirement 10.2: Streak reset
      const store = useUserStore.getState();
      
      // Login
      await store.login({
        username: 'divya',
        password: 'divya',
      });
      
      expect(useUserStore.getState().currentUser?.streakCount).toBe(3);
      
      // Reset streak
      store.updateStreak(0);
      
      expect(useUserStore.getState().currentUser?.streakCount).toBe(0);
      
      // Verify persistence
      const userModel = persistenceService.getUser('patient-1');
      expect(userModel?.streakCount).toBe(0);
    });
  });

  describe('Doctor Workflow', () => {
    it('should complete full doctor authentication workflow', async () => {
      // Requirement 2.1, 2.2: Doctor authentication
      const store = useUserStore.getState();
      
      // Step 1: Login as doctor
      await store.login({
        username: 'dr.smith',
        password: 'smith',
      });
      
      const afterLogin = useUserStore.getState();
      expect(afterLogin.isAuthenticated).toBe(true);
      expect(afterLogin.currentUser).not.toBeNull();
      expect(afterLogin.currentUser?.name).toBe('Dr. Sarah Smith');
      expect(afterLogin.currentUser?.role).toBe('doctor');
      
      // Step 2: Verify session
      const sessionUser = authService.getCurrentUser();
      expect(sessionUser?.id).toBe('doctor-1');
      expect(sessionUser?.role).toBe('doctor');
      
      // Step 3: Logout
      store.logout();
      
      const afterLogout = useUserStore.getState();
      expect(afterLogout.isAuthenticated).toBe(false);
      expect(afterLogout.currentUser).toBeNull();
    });

    it('should prevent doctors from updating streak', async () => {
      // Edge case: Doctors cannot have streaks
      const store = useUserStore.getState();
      
      await store.login({
        username: 'dr.smith',
        password: 'smith',
      });
      
      expect(() => store.updateStreak(5)).toThrow('Only patients can have streak counts');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials gracefully', async () => {
      // Requirement 1.2, 2.2: Invalid credentials
      const store = useUserStore.getState();
      
      await expect(
        store.login({
          username: 'divya',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid username or password');
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
    });

    it('should handle non-existent user gracefully', async () => {
      // Edge case: Non-existent user
      const store = useUserStore.getState();
      
      await expect(
        store.login({
          username: 'nonexistent',
          password: 'password',
        })
      ).rejects.toThrow('Invalid username or password');
    });

    it('should handle streak update without login', () => {
      // Edge case: Update streak without authentication
      const store = useUserStore.getState();
      
      expect(() => store.updateStreak(5)).toThrow('No user is currently logged in');
    });
  });

  describe('Session Persistence', () => {
    it('should restore session on store initialization', async () => {
      // Requirement 1.4, 10.4: Session restoration
      const store = useUserStore.getState();
      
      // Login
      await store.login({
        username: 'divya',
        password: 'divya',
      });
      
      // Simulate page reload by creating new store instance
      // In real app, the store would be recreated on page load
      const currentUser = authService.getCurrentUser();
      expect(currentUser).not.toBeNull();
      expect(currentUser?.name).toBe('Divya Patel');
      expect(currentUser?.streakCount).toBe(3);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle rapid streak updates', async () => {
      // Edge case: Rapid updates
      const store = useUserStore.getState();
      
      await store.login({
        username: 'divya',
        password: 'divya',
      });
      
      // Rapid streak updates
      store.updateStreak(4);
      store.updateStreak(5);
      store.updateStreak(6);
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(6);
      
      // Verify final state in persistence
      const userModel = persistenceService.getUser('patient-1');
      expect(userModel?.streakCount).toBe(6);
    });
  });
});
