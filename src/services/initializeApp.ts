/**
 * Application Initialization - Safe startup with error handling
 * 
 * Provides robust initialization that handles:
 * - LocalStorage availability checks
 * - Data corruption recovery
 * - Automatic reinitialization with seed data
 * 
 * Requirements: 12.4 - Error handling for data persistence
 */

import { persistenceService, PersistenceError } from './persistenceService';
import { initializeSeedData, reinitializeWithSeedData } from './seedData';

/**
 * Error class for initialization failures
 */
export class InitializationError extends Error {
  cause?: unknown;
  
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'InitializationError';
    this.cause = cause;
  }
}

/**
 * Safely initializes the application with comprehensive error handling
 * 
 * Handles:
 * 1. LocalStorage availability check
 * 2. Data corruption detection and recovery
 * 3. Seed data initialization
 * 
 * @throws InitializationError if initialization fails and cannot be recovered
 * 
 * Requirements: 12.4 - Handle LocalStorage full, data corruption, reinitialize with seed data
 */
export function initializeApp(): void {
  try {
    // Step 1: Check if LocalStorage is available
    if (!persistenceService.isAvailable()) {
      throw new InitializationError(
        'LocalStorage is not available. Please enable cookies and site data in your browser settings.'
      );
    }

    // Step 2: Try to initialize seed data
    try {
      initializeSeedData(persistenceService);
      console.log('✅ Application initialized successfully');
    } catch (error) {
      // Step 3: Handle data corruption
      if (error instanceof PersistenceError) {
        console.error('❌ Data corruption detected:', error.message);
        
        // Attempt to recover by reinitializing with seed data
        try {
          reinitializeWithSeedData(persistenceService);
          console.log('✅ Recovered from data corruption');
        } catch (recoveryError) {
          // If recovery fails, throw a fatal error
          throw new InitializationError(
            'Failed to recover from data corruption. Please clear your browser data and try again.',
            recoveryError
          );
        }
      } else {
        // Unknown error, rethrow
        throw error;
      }
    }

    // Step 4: Verify storage size (warn if getting full)
    const storageSize = persistenceService.getStorageSize();
    const STORAGE_WARNING_THRESHOLD = 4 * 1024 * 1024; // 4MB (LocalStorage is typically 5-10MB)
    
    if (storageSize > STORAGE_WARNING_THRESHOLD) {
      console.warn(
        `⚠️ Storage is getting full (${Math.round(storageSize / 1024 / 1024)}MB used). ` +
        'Consider clearing old data.'
      );
    }
  } catch (error) {
    // Log the error for debugging
    console.error('❌ Application initialization failed:', error);
    
    // Rethrow as InitializationError if not already
    if (error instanceof InitializationError) {
      throw error;
    }
    
    throw new InitializationError(
      'Application initialization failed. Please refresh the page and try again.',
      error
    );
  }
}

/**
 * Validates that stored data is not corrupted
 * 
 * Performs basic validation checks on stored data to detect corruption early.
 * 
 * @returns true if data is valid, false if corrupted
 */
export function validateStoredData(): boolean {
  try {
    // Try to retrieve and validate users
    const users = persistenceService.getAllUsers();
    if (!Array.isArray(users)) {
      console.error('❌ Users data is not an array');
      return false;
    }
    
    // Validate user structure
    for (const user of users) {
      if (!user.id || !user.username || !user.role) {
        console.error('❌ Invalid user structure:', user);
        return false;
      }
    }
    
    // Try to retrieve and validate missions
    const missions = persistenceService.getAllMissions();
    if (!Array.isArray(missions)) {
      console.error('❌ Missions data is not an array');
      return false;
    }
    
    // Validate mission structure
    for (const mission of missions) {
      if (!mission.id || !mission.patientId || !mission.type) {
        console.error('❌ Invalid mission structure:', mission);
        return false;
      }
    }
    
    // Try to retrieve action items (may be empty, but should be an array)
    const actionItems = persistenceService.getActionItems();
    if (!Array.isArray(actionItems)) {
      console.error('❌ Action items data is not an array');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Data validation failed:', error);
    return false;
  }
}

/**
 * Attempts to recover from a storage error
 * 
 * This function is called when a storage operation fails.
 * It attempts to recover by:
 * 1. Validating stored data
 * 2. Reinitializing if corrupted
 * 3. Clearing and reinitializing if still failing
 * 
 * @returns true if recovery succeeded, false otherwise
 * 
 * Requirements: 12.4 - Handle data corruption, reinitialize with seed data
 */
export function attemptStorageRecovery(): boolean {
  try {
    console.warn('⚠️ Attempting storage recovery...');
    
    // Step 1: Validate current data
    const isValid = validateStoredData();
    
    if (!isValid) {
      // Step 2: Data is corrupted, reinitialize
      console.warn('⚠️ Data corruption detected, reinitializing...');
      reinitializeWithSeedData(persistenceService);
      
      // Step 3: Validate again
      const isValidAfterRecovery = validateStoredData();
      
      if (isValidAfterRecovery) {
        console.log('✅ Storage recovery successful');
        return true;
      } else {
        console.error('❌ Storage recovery failed - data still invalid');
        return false;
      }
    }
    
    console.log('✅ Data is valid, no recovery needed');
    return true;
  } catch (error) {
    console.error('❌ Storage recovery failed:', error);
    return false;
  }
}
