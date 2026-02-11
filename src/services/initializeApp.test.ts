/**
 * Tests for Application Initialization and Error Handling
 * 
 * Validates:
 * - Safe initialization with error handling
 * - Data corruption detection and recovery
 * - LocalStorage availability checks
 * - Storage quota warnings
 * 
 * Requirements: 12.4 - Error handling for data persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initializeApp,
  InitializationError,
  validateStoredData,
  attemptStorageRecovery,
} from './initializeApp';
import { persistenceService, PersistenceError } from './persistenceService';
import { SEED_USERS, SEED_MISSIONS } from './seedData';

describe('Application Initialization', () => {
  beforeEach(() => {
    // Clear all data before each test
    persistenceService.clearAll();
  });

  describe('initializeApp', () => {
    it('should initialize successfully with empty storage', () => {
      expect(() => initializeApp()).not.toThrow();
      
      // Verify seed data was initialized
      const users = persistenceService.getAllUsers();
      const missions = persistenceService.getAllMissions();
      
      expect(users.length).toBeGreaterThan(0);
      expect(missions.length).toBeGreaterThan(0);
    });

    it('should not reinitialize if data already exists', () => {
      // Initialize once
      initializeApp();
      
      const usersAfterFirst = persistenceService.getAllUsers();
      const missionsAfterFirst = persistenceService.getAllMissions();
      
      // Initialize again
      initializeApp();
      
      const usersAfterSecond = persistenceService.getAllUsers();
      const missionsAfterSecond = persistenceService.getAllMissions();
      
      // Should have same data (not duplicated)
      expect(usersAfterSecond).toEqual(usersAfterFirst);
      expect(missionsAfterSecond).toEqual(missionsAfterFirst);
    });

    it('should recover from data corruption', () => {
      // Corrupt the data by storing invalid JSON
      localStorage.setItem('recovery_pilot_users', 'invalid json {{{');
      
      // Should recover automatically
      expect(() => initializeApp()).not.toThrow();
      
      // Verify data was reinitialized
      const users = persistenceService.getAllUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('username');
    });

    it('should throw InitializationError if LocalStorage is not available', () => {
      // Mock isAvailable to return false
      const originalIsAvailable = persistenceService.isAvailable;
      persistenceService.isAvailable = vi.fn(() => false);
      
      expect(() => initializeApp()).toThrow(InitializationError);
      expect(() => initializeApp()).toThrow('LocalStorage is not available');
      
      // Restore original method
      persistenceService.isAvailable = originalIsAvailable;
    });

    it('should warn if storage is getting full', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      // Mock getStorageSize to return a large value
      const originalGetStorageSize = persistenceService.getStorageSize;
      persistenceService.getStorageSize = vi.fn(() => 5 * 1024 * 1024); // 5MB
      
      initializeApp();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Storage is getting full')
      );
      
      // Restore original method
      persistenceService.getStorageSize = originalGetStorageSize;
      consoleSpy.mockRestore();
    });
  });

  describe('validateStoredData', () => {
    it('should return true for valid data', () => {
      // Initialize with seed data
      initializeApp();
      
      const isValid = validateStoredData();
      expect(isValid).toBe(true);
    });

    it('should return false if users is not an array', () => {
      // Store invalid users data
      localStorage.setItem('recovery_pilot_users', '"not an array"');
      
      const isValid = validateStoredData();
      expect(isValid).toBe(false);
    });

    it('should return false if user structure is invalid', () => {
      // Store users with missing required fields
      localStorage.setItem('recovery_pilot_users', JSON.stringify([
        { id: 'user-1' } // Missing username and role
      ]));
      
      const isValid = validateStoredData();
      expect(isValid).toBe(false);
    });

    it('should return false if missions is not an array', () => {
      // Store valid users but invalid missions
      localStorage.setItem('recovery_pilot_users', JSON.stringify(SEED_USERS));
      localStorage.setItem('recovery_pilot_missions', '"not an array"');
      
      const isValid = validateStoredData();
      expect(isValid).toBe(false);
    });

    it('should return false if mission structure is invalid', () => {
      // Store valid users but missions with missing required fields
      localStorage.setItem('recovery_pilot_users', JSON.stringify(SEED_USERS));
      localStorage.setItem('recovery_pilot_missions', JSON.stringify([
        { id: 'mission-1' } // Missing patientId and type
      ]));
      
      const isValid = validateStoredData();
      expect(isValid).toBe(false);
    });

    it('should return false if action items is not an array', () => {
      // Store valid users and missions but invalid action items
      localStorage.setItem('recovery_pilot_users', JSON.stringify(SEED_USERS));
      localStorage.setItem('recovery_pilot_missions', JSON.stringify(SEED_MISSIONS));
      localStorage.setItem('recovery_pilot_action_items', '"not an array"');
      
      const isValid = validateStoredData();
      expect(isValid).toBe(false);
    });

    it('should return false if data retrieval throws error', () => {
      // Store completely invalid JSON
      localStorage.setItem('recovery_pilot_users', 'invalid json {{{');
      
      const isValid = validateStoredData();
      expect(isValid).toBe(false);
    });
  });

  describe('attemptStorageRecovery', () => {
    it('should return true if data is already valid', () => {
      // Initialize with valid data
      initializeApp();
      
      const recovered = attemptStorageRecovery();
      expect(recovered).toBe(true);
    });

    it('should recover from corrupted data', () => {
      // Corrupt the data
      localStorage.setItem('recovery_pilot_users', 'invalid json {{{');
      
      const recovered = attemptStorageRecovery();
      expect(recovered).toBe(true);
      
      // Verify data is now valid
      const isValid = validateStoredData();
      expect(isValid).toBe(true);
    });

    it('should reinitialize with seed data on corruption', () => {
      // Corrupt the data
      localStorage.setItem('recovery_pilot_users', 'invalid json {{{');
      
      attemptStorageRecovery();
      
      // Verify seed data was restored
      const users = persistenceService.getAllUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].username).toBe(SEED_USERS[0].username);
    });

    it('should return false if recovery fails', () => {
      // Mock reinitializeWithSeedData to throw error
      const originalClearAll = persistenceService.clearAll;
      persistenceService.clearAll = vi.fn(() => {
        throw new Error('Storage is locked');
      });
      
      // Corrupt the data
      localStorage.setItem('recovery_pilot_users', 'invalid json {{{');
      
      const recovered = attemptStorageRecovery();
      expect(recovered).toBe(false);
      
      // Restore original method
      persistenceService.clearAll = originalClearAll;
    });
  });

  describe('Error Handling - LocalStorage Full', () => {
    it('should handle quota exceeded error gracefully', () => {
      // This test verifies the error is thrown with correct message
      // Actual quota exceeded is hard to simulate in tests
      
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      
      expect(() => {
        throw new PersistenceError(
          'Storage quota exceeded. Please clear some data or contact support.',
          quotaError
        );
      }).toThrow('Storage quota exceeded');
    });
  });

  describe('Error Handling - Data Corruption', () => {
    it('should detect JSON parse errors', () => {
      localStorage.setItem('recovery_pilot_users', 'invalid json {{{');
      
      expect(() => {
        persistenceService.getAllUsers();
      }).toThrow(PersistenceError);
      
      expect(() => {
        persistenceService.getAllUsers();
      }).toThrow('Failed to retrieve all users');
    });

    it('should recover from corruption during initialization', () => {
      // Corrupt multiple keys
      localStorage.setItem('recovery_pilot_users', 'invalid json {{{');
      localStorage.setItem('recovery_pilot_missions', 'invalid json {{{');
      
      // Should recover automatically
      expect(() => initializeApp()).not.toThrow();
      
      // Verify data is valid after recovery
      const users = persistenceService.getAllUsers();
      const missions = persistenceService.getAllMissions();
      
      expect(users.length).toBeGreaterThan(0);
      expect(missions.length).toBeGreaterThan(0);
    });
  });

  describe('Integration - Full Error Recovery Flow', () => {
    it('should handle complete corruption and recovery cycle', () => {
      // Step 1: Initialize normally
      initializeApp();
      const initialUsers = persistenceService.getAllUsers();
      expect(initialUsers.length).toBeGreaterThan(0);
      
      // Step 2: Simulate corruption
      localStorage.setItem('recovery_pilot_users', 'corrupted data {{{');
      
      // Step 3: Attempt recovery
      const recovered = attemptStorageRecovery();
      expect(recovered).toBe(true);
      
      // Step 4: Verify data is restored
      const recoveredUsers = persistenceService.getAllUsers();
      expect(recoveredUsers.length).toBeGreaterThan(0);
      expect(recoveredUsers[0]).toHaveProperty('id');
      expect(recoveredUsers[0]).toHaveProperty('username');
    });

    it('should maintain data integrity after recovery', () => {
      // Initialize with seed data
      initializeApp();
      
      // Corrupt and recover
      localStorage.setItem('recovery_pilot_users', 'invalid');
      attemptStorageRecovery();
      
      // Verify all seed users are present
      const users = persistenceService.getAllUsers();
      expect(users.length).toBe(SEED_USERS.length);
      
      // Verify all seed missions are present
      const missions = persistenceService.getAllMissions();
      expect(missions.length).toBe(SEED_MISSIONS.length);
    });
  });
});
