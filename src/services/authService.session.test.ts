/**
 * Tests for authentication session expiration handling
 * 
 * Requirements: 1.2, 2.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService, AuthenticationError } from './authService';
import { persistenceService } from './persistenceService';
import type { UserModel } from '../types';

describe('AuthService - Session Expiration', () => {
  // Mock user for testing
  const mockUser: UserModel = {
    id: 'test-user-1',
    username: 'testuser',
    passwordHash: 'simple_hash_testpass',
    name: 'Test User',
    role: 'patient',
    streakCount: 5,
    lastLoginDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Clear session storage
    sessionStorage.clear();
    
    // Mock persistence service
    vi.spyOn(persistenceService, 'getUserByUsername').mockReturnValue(mockUser);
    vi.spyOn(persistenceService, 'saveUser').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('Session Timeout', () => {
    it('should set session expiry time on login', async () => {
      const beforeLogin = Date.now();
      
      await authService.login('testuser', 'testpass');
      
      const expiryTimeStr = sessionStorage.getItem('recovery_pilot_session_expiry');
      expect(expiryTimeStr).toBeTruthy();
      
      const expiryTime = parseInt(expiryTimeStr!, 10);
      expect(expiryTime).toBeGreaterThan(beforeLogin);
      
      // Should be approximately 30 minutes in the future
      const expectedExpiry = beforeLogin + (30 * 60 * 1000);
      expect(expiryTime).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('should return null for getCurrentUser if session expired', async () => {
      // Login first
      await authService.login('testuser', 'testpass');
      
      // Verify user is logged in
      expect(authService.getCurrentUser()).toBeTruthy();
      
      // Manually set expiry time to the past
      sessionStorage.setItem('recovery_pilot_session_expiry', '0');
      
      // Should return null now
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
      
      // Session should be cleared
      expect(sessionStorage.getItem('recovery_pilot_current_user')).toBeNull();
    });

    it('should clear session expiry on logout', async () => {
      await authService.login('testuser', 'testpass');
      
      expect(sessionStorage.getItem('recovery_pilot_session_expiry')).toBeTruthy();
      
      authService.logout();
      
      expect(sessionStorage.getItem('recovery_pilot_session_expiry')).toBeNull();
    });
  });

  describe('Session Refresh', () => {
    it('should refresh session and extend expiry time', async () => {
      await authService.login('testuser', 'testpass');
      
      const initialExpiryStr = sessionStorage.getItem('recovery_pilot_session_expiry');
      const initialExpiry = parseInt(initialExpiryStr!, 10);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh session
      const success = authService.refreshSession();
      expect(success).toBe(true);
      
      const newExpiryStr = sessionStorage.getItem('recovery_pilot_session_expiry');
      const newExpiry = parseInt(newExpiryStr!, 10);
      
      // New expiry should be later than initial
      expect(newExpiry).toBeGreaterThan(initialExpiry);
    });

    it('should return false when refreshing with no active session', () => {
      const success = authService.refreshSession();
      expect(success).toBe(false);
    });

    it('should update expiry time when updating current user', async () => {
      await authService.login('testuser', 'testpass');
      
      const initialExpiryStr = sessionStorage.getItem('recovery_pilot_session_expiry');
      const initialExpiry = parseInt(initialExpiryStr!, 10);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update user (this should refresh session)
      const user = authService.getCurrentUser()!;
      authService.updateCurrentUser({ ...user, streakCount: 10 });
      
      const newExpiryStr = sessionStorage.getItem('recovery_pilot_session_expiry');
      const newExpiry = parseInt(newExpiryStr!, 10);
      
      // New expiry should be later than initial
      expect(newExpiry).toBeGreaterThan(initialExpiry);
    });
  });

  describe('Session Time Remaining', () => {
    it('should return remaining time for active session', async () => {
      await authService.login('testuser', 'testpass');
      
      const remaining = authService.getSessionTimeRemaining();
      
      // Should be approximately 30 minutes
      const expectedRemaining = 30 * 60 * 1000;
      expect(remaining).toBeGreaterThan(expectedRemaining - 5000);
      expect(remaining).toBeLessThanOrEqual(expectedRemaining);
    });

    it('should return 0 for expired session', async () => {
      await authService.login('testuser', 'testpass');
      
      // Set expiry to past
      sessionStorage.setItem('recovery_pilot_session_expiry', '0');
      
      const remaining = authService.getSessionTimeRemaining();
      expect(remaining).toBe(0);
    });

    it('should return 0 when no session exists', () => {
      const remaining = authService.getSessionTimeRemaining();
      expect(remaining).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should display user-friendly error for invalid credentials', async () => {
      vi.spyOn(persistenceService, 'getUserByUsername').mockReturnValue(null);
      
      await expect(authService.login('invalid', 'wrong')).rejects.toThrow(
        AuthenticationError
      );
      
      try {
        await authService.login('invalid', 'wrong');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect((error as AuthenticationError).message).toBe('Invalid username or password');
      }
    });

    it('should not reveal whether username exists', async () => {
      // Test with non-existent user
      vi.spyOn(persistenceService, 'getUserByUsername').mockReturnValue(null);
      
      let error1: AuthenticationError | null = null;
      try {
        await authService.login('nonexistent', 'password');
      } catch (e) {
        error1 = e as AuthenticationError;
      }
      
      // Test with wrong password for existing user
      vi.spyOn(persistenceService, 'getUserByUsername').mockReturnValue(mockUser);
      
      let error2: AuthenticationError | null = null;
      try {
        await authService.login('testuser', 'wrongpassword');
      } catch (e) {
        error2 = e as AuthenticationError;
      }
      
      // Both should have the same error message
      expect(error1?.message).toBe(error2?.message);
      expect(error1?.message).toBe('Invalid username or password');
    });

    it('should handle corrupted session data gracefully', async () => {
      // Set invalid JSON in session
      sessionStorage.setItem('recovery_pilot_current_user', 'invalid json');
      
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
      
      // Session should be cleared
      expect(sessionStorage.getItem('recovery_pilot_current_user')).toBeNull();
    });

    it('should handle missing expiry time as expired', async () => {
      await authService.login('testuser', 'testpass');
      
      // Remove expiry time
      sessionStorage.removeItem('recovery_pilot_session_expiry');
      
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should handle invalid expiry time as expired', async () => {
      await authService.login('testuser', 'testpass');
      
      // Set invalid expiry time
      sessionStorage.setItem('recovery_pilot_session_expiry', 'invalid');
      
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });
});
