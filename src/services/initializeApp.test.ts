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

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  initializeApp,
  InitializationError,
  validateStoredData,
  attemptStorageRecovery,
} from './initializeApp';
import { persistenceService, PersistenceError } from './persistenceService';
import { SEED_USERS,