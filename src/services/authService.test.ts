/**
 * Unit tests for AuthService
 * 
 * Tests authentication functionality including:
 * - Login with valid/invalid credentials
 * - Logout functionality
 * - Session management
 * - Credential validation
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthServiceImpl, AuthenticationError } from './authService';
import { persistenceService } from './persistenceService';
import { SEED_USERS } from './seedData';
import type { UserModel } from '../types';
import { UserRole } from '../types';

describe('AuthService', () => {
  let authService: AuthServiceImpl;

  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Initialize with seed users
    SEED_USERS.forEach(user => {
      persistenceService.saveUser(user);
    });

    // Create fresh instance
    authService = new AuthServiceImpl();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('validateCredentials', () => {
    it('should return true for valid patient credentials', () => {
      // Requirement 1.2: Valid credentials should be accepted
      const result = authService.validateCredentials('divya', 'divya');
      expect(result).toBe(true);
    });

    it('should return true for valid doctor credentials', () => {
      // Requirement 2.2: Valid doctor credentials should be accepted
      const result = authService.validateCredentials('dr.smith', 'smith');
      expect(result).toBe(true);
    });

    it('should return false for invalid username', () => {
      // Requirement 1.2, 2.2: Invalid credentials should be rejected
      const result = authService.validateCredentials('nonexistent', 'password');
      expect(result).toBe(false);
    });

    it('should return false for invalid password', () => {
      // Requirement 1.2, 2.2: Invalid credentials should be rejected
      const result = authService.validateCredentials('divya', 'wrongpassword');
      expect(result).toBe(false);
    });

    it('should return false for empty username', () => {
      const result = authService.validateCredentials('', 'password');
      expect(result).toBe(false);
    });

    it('should return false for empty password', () => {
      const result = authService.validateCredentials('divya', '');
      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login patient with valid credentials', async () => {
      // Requirement 1.1: Patient should authenticate with valid credentials
      const user = await authService.login('divya', 'divya');
      
      expect(user).toBeDefined();
      expect(user.id).toBe('patient-1');
      expect(user.name).toBe('Divya Patel');
      expect(user.role).toBe(UserRole.PATIENT);
      expect(user.streakCount).toBe(3);
    });

    it('should successfully login doctor with valid credentials', async () => {
      // Requirement 2.1: Doctor should authenticate with valid credentials
      const user = await authService.login('dr.smith', 'smith');
      
      expect(user).toBeDefined();
      expect(user.id).toBe('doctor-1');
      expect(user.name).toBe('Dr. Sarah Smith');
      expect(user.role).toBe(UserRole.DOCTOR);
    });

    it('should throw AuthenticationError for invalid username', async () => {
      // Requirement 1.2, 2.2: Invalid credentials should be rejected
      await expect(
        authService.login('nonexistent', 'password')
      ).rejects.toThrow(AuthenticationError);
      
      await expect(
        authService.login('nonexistent', 'password')
      ).rejects.toThrow('Invalid username or password');
    });

    it('should throw AuthenticationError for invalid password', async () => {
      // Requirement 1.2, 2.2: Invalid credentials should be rejected
      await expect(
        authService.login('divya', 'wrongpassword')
      ).rejects.toThrow(AuthenticationError);
      
      await expect(
        authService.login('divya', 'wrongpassword')
      ).rejects.toThrow('Invalid username or password');
    });

    it('should throw AuthenticationError for empty username', async () => {
      await expect(
        authService.login('', 'password')
      ).rejects.toThrow(AuthenticationError);
      
      await expect(
        authService.login('', 'password')
      ).rejects.toThrow('Username and password are required');
    });

    it('should throw AuthenticationError for empty password', async () => {
      await expect(
        authService.login('divya', '')
      ).rejects.toThrow(AuthenticationError);
      
      await expect(
        authService.login('divya', '')
      ).rejects.toThrow('Username and password are required');
    });

    it('should update last login date on successful login', async () => {
      await authService.login('divya', 'divya');
      
      const userModel = persistenceService.getUserByUsername('divya');
      expect(userModel).toBeDefined();
      expect(userModel!.lastLoginDate).toBeDefined();
      
      // Last login should be recent (within last second)
      const lastLogin = new Date(userModel!.lastLoginDate);
      const now = new Date();
      const diffMs = now.getTime() - lastLogin.getTime();
      expect(diffMs).toBeLessThan(1000); // Less than 1 second
    });

    it('should create session on successful login', async () => {
      await authService.login('divya', 'divya');
      
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser!.id).toBe('patient-1');
    });

    it('should not expose password hash in returned user', async () => {
      const user = await authService.login('divya', 'divya');
      
      // User object should not contain sensitive data
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('username');
    });
  });

  describe('logout', () => {
    it('should clear session on logout', async () => {
      // Login first
      await authService.login('divya', 'divya');
      expect(authService.getCurrentUser()).toBeDefined();
      
      // Logout
      authService.logout();
      
      // Session should be cleared
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should not throw error when logging out without active session', () => {
      // Should not throw
      expect(() => authService.logout()).not.toThrow();
    });

    it('should allow login after logout', async () => {
      // Login
      await authService.login('divya', 'divya');
      
      // Logout
      authService.logout();
      
      // Login again
      const user = await authService.login('divya', 'divya');
      expect(user).toBeDefined();
      expect(user.id).toBe('patient-1');
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return current user after login', async () => {
      await authService.login('divya', 'divya');
      
      const user = authService.getCurrentUser();
      expect(user).toBeDefined();
      expect(user!.id).toBe('patient-1');
      expect(user!.name).toBe('Divya Patel');
    });

    it('should return null after logout', async () => {
      await authService.login('divya', 'divya');
      authService.logout();
      
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should handle corrupted session data gracefully', () => {
      // Manually corrupt session data
      sessionStorage.setItem('recovery_pilot_current_user', 'invalid json {');
      
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
      
      // Should clear corrupted data
      expect(sessionStorage.getItem('recovery_pilot_current_user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is logged in', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true after successful login', async () => {
      await authService.login('divya', 'divya');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false after logout', async () => {
      await authService.login('divya', 'divya');
      authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('updateCurrentUser', () => {
    it('should update session with new user data', async () => {
      await authService.login('divya', 'divya');
      
      const updatedUser = {
        id: 'patient-1',
        name: 'Divya Patel',
        role: UserRole.PATIENT,
        streakCount: 5, // Updated streak
      };
      
      authService.updateCurrentUser(updatedUser);
      
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser!.streakCount).toBe(5);
    });

    it('should throw error when no user is authenticated', () => {
      const user = {
        id: 'patient-1',
        name: 'Divya Patel',
        role: UserRole.PATIENT,
        streakCount: 5,
      };
      
      expect(() => authService.updateCurrentUser(user)).toThrow(AuthenticationError);
      expect(() => authService.updateCurrentUser(user)).toThrow('No user is currently authenticated');
    });
  });

  describe('session persistence', () => {
    it('should persist session across service instances', async () => {
      // Login with first instance
      await authService.login('divya', 'divya');
      
      // Create new instance
      const newAuthService = new AuthServiceImpl();
      
      // Should still have session
      const user = newAuthService.getCurrentUser();
      expect(user).toBeDefined();
      expect(user!.id).toBe('patient-1');
    });
  });

  describe('security', () => {
    it('should not reveal whether username exists in error message', async () => {
      // Try with non-existent username
      const error1 = await authService.login('nonexistent', 'password')
        .catch(e => e as AuthenticationError);
      
      // Try with existing username but wrong password
      const error2 = await authService.login('divya', 'wrongpassword')
        .catch(e => e as AuthenticationError);
      
      // Both should have the same error message (security best practice)
      expect((error1 as AuthenticationError).message).toBe((error2 as AuthenticationError).message);
      expect((error1 as AuthenticationError).message).toBe('Invalid username or password');
    });

    it('should hash passwords consistently', () => {
      const result1 = authService.validateCredentials('divya', 'divya');
      const result2 = authService.validateCredentials('divya', 'divya');
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in username', async () => {
      const specialUser: UserModel = {
        id: 'special-1',
        username: 'user@example.com',
        passwordHash: 'simple_hash_test123',
        name: 'Special User',
        role: UserRole.PATIENT,
        streakCount: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      persistenceService.saveUser(specialUser);
      
      const user = await authService.login('user@example.com', 'test123');
      expect(user).toBeDefined();
      expect(user.name).toBe('Special User');
    });

    it('should handle special characters in password', async () => {
      const specialUser: UserModel = {
        id: 'special-2',
        username: 'testuser',
        passwordHash: 'simple_hash_p@ssw0rd!#$',
        name: 'Test User',
        role: UserRole.PATIENT,
        streakCount: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      persistenceService.saveUser(specialUser);
      
      const user = await authService.login('testuser', 'p@ssw0rd!#$');
      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
    });

    it('should handle case-sensitive usernames', async () => {
      // Username is case-sensitive
      await expect(
        authService.login('DIVYA', 'divya')
      ).rejects.toThrow(AuthenticationError);
      
      await expect(
        authService.login('Divya', 'divya')
      ).rejects.toThrow(AuthenticationError);
    });
  });
});
