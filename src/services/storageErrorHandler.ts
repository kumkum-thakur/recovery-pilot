/**
 * Storage Error Handler - Centralized error handling for storage operations
 * 
 * Provides utilities for handling storage errors in stores and services.
 * Automatically attempts recovery from corruption and provides user-friendly messages.
 * 
 * Requirements: 12.4 - Error handling for data persistence
 */

import { PersistenceError } from './persistenceService';
import { attemptStorageRecovery } from './initializeApp';

/**
 * Wraps a storage operation with error handling and recovery
 * 
 * @param operation - The storage operation to execute
 * @param operationName - Name of the operation for error messages
 * @returns Result of the operation
 * @throws Error with user-friendly message if operation fails and cannot be recovered
 * 
 * Requirements: 12.4 - Handle LocalStorage full, data corruption, reinitialize with seed data
 */
export async function withStorageErrorHandling<T>(
  operation: () => T | Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Handle PersistenceError
    if (error instanceof PersistenceError) {
      // Check for quota exceeded
      if (error.message.includes('quota exceeded')) {
        throw new Error(
          'Storage is full. Please clear some data or contact support.'
        );
      }

      // Check for data corruption
      if (error.message.includes('Invalid JSON') || error.message.includes('parse')) {
        console.warn(`⚠️ Data corruption detected during ${operationName}, attempting recovery...`);
        
        // Attempt recovery
        const recovered = attemptStorageRecovery();
        
        if (recovered) {
          console.log(`✅ Recovered from corruption, retrying ${operationName}...`);
          
          // Retry the operation once after recovery
          try {
            return await operation();
          } catch (_retryError) {
            throw new Error(
              `Failed to ${operationName} after recovery. Please refresh the page.`
            );
          }
        } else {
          throw new Error(
            'Failed to recover from data corruption. Please refresh the page.'
          );
        }
      }

      // Generic persistence error
      throw new Error(
        `Failed to ${operationName}. Please try again.`
      );
    }

    // Unknown error, rethrow with context
    throw new Error(
      `Failed to ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Wraps a synchronous storage operation with error handling
 * 
 * @param operation - The storage operation to execute
 * @param operationName - Name of the operation for error messages
 * @returns Result of the operation
 * @throws Error with user-friendly message if operation fails
 */
export function withSyncStorageErrorHandling<T>(
  operation: () => T,
  operationName: string
): T {
  try {
    return operation();
  } catch (error) {
    // Handle PersistenceError
    if (error instanceof PersistenceError) {
      // Check for quota exceeded
      if (error.message.includes('quota exceeded')) {
        throw new Error(
          'Storage is full. Please clear some data or contact support.'
        );
      }

      // Check for data corruption
      if (error.message.includes('Invalid JSON') || error.message.includes('parse')) {
        console.warn(`⚠️ Data corruption detected during ${operationName}`);
        
        // For sync operations, we can't recover automatically
        // User needs to refresh the page
        throw new Error(
          'Data corruption detected. Please refresh the page to recover.'
        );
      }

      // Generic persistence error
      throw new Error(
        `Failed to ${operationName}. Please try again.`
      );
    }

    // Unknown error, rethrow with context
    throw new Error(
      `Failed to ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Checks if an error is a storage quota error
 * 
 * @param error - The error to check
 * @returns true if the error is a quota exceeded error
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof PersistenceError) {
    return error.message.includes('quota exceeded');
  }
  
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError';
  }
  
  return false;
}

/**
 * Checks if an error is a data corruption error
 * 
 * @param error - The error to check
 * @returns true if the error is a corruption error
 */
export function isCorruptionError(error: unknown): boolean {
  if (error instanceof PersistenceError) {
    return (
      error.message.includes('Invalid JSON') ||
      error.message.includes('parse') ||
      error.message.includes('Failed to parse')
    );
  }
  
  if (error instanceof SyntaxError) {
    return true;
  }
  
  return false;
}

/**
 * Gets a user-friendly error message for a storage error
 * 
 * @param error - The error to get a message for
 * @param operationName - Name of the operation that failed
 * @returns User-friendly error message
 */
export function getStorageErrorMessage(error: unknown, operationName: string): string {
  if (isQuotaExceededError(error)) {
    return 'Storage is full. Please clear some data or contact support.';
  }
  
  if (isCorruptionError(error)) {
    return 'Data corruption detected. Please refresh the page to recover.';
  }
  
  if (error instanceof PersistenceError) {
    return `Failed to ${operationName}. Please try again.`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return `Failed to ${operationName}. Please try again.`;
}
