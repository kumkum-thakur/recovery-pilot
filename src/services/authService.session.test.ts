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
    role: 