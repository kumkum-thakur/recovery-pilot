/**
 * Integration tests for AuthService with PersistenceService
 * 
 * Tests the full authentication flow including:
 * - Authentication with persisted user data
 * - Session management across page reloads (simulated)
 * - Integration with seed data
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authService } from './authService';
import { persistenceService } from './persistenceService';
import { initializeSeedData } from './seedData';

describe('AuthService Integration Tests', () => {
  beforeEach(() => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Initialize with seed data
    initializeSeedData(persistenceService);
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Full authentication flow', () => {
    it('should authenticate patient and maintain session', async () => {
      // Requirement 1.1: Patient authentication
      const user = await authService.login('divya', 'divya');
      
      expect(user).toBeDefined();
      expect(user.name).toBe('Divya Patel');
      expect(user.role).toBe('patient');
      expect(user.streakCount).toBe(3);
      
      // Session should be maintained
      expect(authService.isAuthenticated()).toBe(true);
      
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toEqual(user);
    });

    it('should authenticate doctor and maintain session', async () => {
      // Requirement 2.1: Doctor authentication
      const user = await authService.login('dr.smith', 'smith');
      
      expect(user).toBeDefined();
      expect(user.name).toBe('Dr. Sarah Smith');
      expect(user.role).toBe('doctor');
      
      // Session should be maintained
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should update user data in persistence on login', async () => {
      const beforeLogin = new Date();
      
      await authService.login('divya', 'divya');
      
      // Check that lastLoginDate was updated in persistence
      const userModel = persistenceService.getUserByUsername('divya');
      expect(userModel).toBeDefined();
      
      const lastLogin = new Date(userModel!.lastLoginDate);
      expect(lastLogin.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });

    it('should handle logout and clear session', async () => {
      await authService.login('divya', 'divya');
      expect(authService.isAuthenticated()).toBe(true);
      
      authService.logout();
      
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should allow re-login after logout', async () => {
      // First login
      await authService.login('divya', 'divya');
      
      // Logout
      authService.logout();
      
      // Second login
      const user = await authService.login('divya', 'divya');
      expect(user).toBeDefined();
      expect(user.name).toBe('Divya Patel');
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('Error handling with persistence', () => {
    it('should reject login for non-existent user', async () => {
      // Requirement 1.2, 2.2: Invalid credentials should be rejected
      await expect(
        authService.login('nonexistent', 'password')
      ).rejects.toThrow('Invalid username or password');
    });

    it('should reject login with wrong password', async () => {
      // Requirement 1.2, 2.2: Invalid credentials should be rejected
      await expect(
        authService.login('divya', 'wrongpassword')
      ).rejects.toThrow('Invalid username or password');
    });
  });

  describe('Session persistence simulation', () => {
    it('should maintain session data across service calls', async () => {
      // Login
      const loginUser = await authService.login('divya', 'divya');
      
      // Simulate multiple service calls
      for (let i = 0; i < 5; i++) {
        const currentUser = authService.getCurrentUser();
        expect(currentUser).toEqual(loginUser);
      }
    });

    it('should handle concurrent authentication checks', async () => {
      await authService.login('divya', 'divya');
      
      // Simulate concurrent checks
      const checks = await Promise.all([
        Promise.resolve(authService.isAuthenticated()),
        Promise.resolve(authService.isAuthenticated()),
        Promise.resolve(authService.isAuthenticated()),
      ]);
      
      expect(checks).toEqual([true, true, true]);
    });
  });

  describe('User data updates', () => {
    it('should update session when user data changes', async () => {
      await authService.login('divya', 'divya');
      
      // Update streak count
      const updatedUser = {
        ...authService.getCurrentUser()!,
        streakCount: 10,
      };
      
      authService.updateCurrentUser(updatedUser);
      
      const currentUser = authService.getCurrentUser();
      expect(currentUser!.streakCount).toBe(10);
    });

    it('should maintain updated data across multiple retrievals', async () => {
      await authService.login('divya', 'divya');
      
      const updatedUser = {
        ...authService.getCurrentUser()!,
        streakCount: 15,
      };
      
      authService.updateCurrentUser(updatedUser);
      
      // Multiple retrievals should return updated data
      expect(authService.getCurrentUser()!.streakCount).toBe(15);
      expect(authService.getCurrentUser()!.streakCount).toBe(15);
      expect(authService.getCurrentUser()!.streakCount).toBe(15);
    });
  });

  describe('Multiple user sessions', () => {
    it('should switch sessions when different users login', async () => {
      // Login as patient
      const patient = await authService.login('divya', 'divya');
      expect(authService.getCurrentUser()!.role).toBe('patient');
      
      // Logout
      authService.logout();
      
      // Login as doctor
      const doctor = await authService.login('dr.smith', 'smith');
      expect(authService.getCurrentUser()!.role).toBe('doctor');
      
      // Should be doctor's session now
      expect(authService.getCurrentUser()!.id).toBe(doctor.id);
      expect(authService.getCurrentUser()!.id).not.toBe(patient.id);
    });
  });
});
