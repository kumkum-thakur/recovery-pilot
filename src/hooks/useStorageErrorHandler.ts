/**
 * useStorageErrorHandler - React hook for handling storage errors
 * 
 * Provides a consistent way to handle storage errors across components.
 * Automatically attempts recovery and shows user-friendly error messages.
 * 
 * Requirements: 12.4 - Error handling for data persistence
 */

import { useCallback, useState } from 'react';
import { PersistenceError } from '../services/persistenceService';
import { attemptStorageRecovery } from '../services/initializeApp';

export interface StorageErrorState {
  hasError: boolean;
  errorMessage: string | null;
  isRecovering: boolean;
}

/**
 * Hook for handling storage errors with automatic recovery
 * 
 * @returns Object with error state and handler function
 */
export function useStorageErrorHandler() {
  const [errorState, setErrorState] = useState<StorageErrorState>({
    hasError: false,
    errorMessage: null,
    isRecovering: false,
  });

  /**
   * Handles a storage error with automatic recovery attempt
   * 
   * @param error - The error to handle
   * @returns true if error was handled and recovered, false otherwise
   */
  const handleStorageError = useCallback(async (error: unknown): Promise<boolean> => {
    // Check if it's a storage-related error
    if (error instanceof PersistenceError) {
      // Check if it's a quota exceeded error
      if (error.message.includes('quota exceeded')) {
        setErrorState({
          hasError: true,
          errorMessage: 'Storage is full. Please clear some data or contact support.',
          isRecovering: false,
        });
        return false;
      }

      // Check if it's a corruption error
      if (error.message.includes('Invalid JSON') || error.message.includes('parse')) {
        setErrorState({
          hasError: true,
          errorMessage: 'Data corruption detected. Attempting to recover...',
          isRecovering: true,
        });

        // Attempt recovery
        const recovered = attemptStorageRecovery();

        if (recovered) {
          setErrorState({
            hasError: false,
            errorMessage: null,
            isRecovering: false,
          });
          return true;
        } else {
          setErrorState({
            hasError: true,
            errorMessage: 'Failed to recover from data corruption. Please refresh the page.',
            isRecovering: false,
          });
          return false;
        }
      }

      // Generic persistence error
      setErrorState({
        hasError: true,
        errorMessage: 'Failed to save data. Please try again.',
        isRecovering: false,
      });
      return false;
    }

    // Not a storage error, don't handle
    return false;
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      errorMessage: null,
      isRecovering: false,
    });
  }, []);

  return {
    errorState,
    handleStorageError,
    clearError,
  };
}
