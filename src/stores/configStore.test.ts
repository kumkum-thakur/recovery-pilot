/**
 * ConfigStore Tests
 * 
 * Tests for demo scenario configuration store
 * 
 * Requirements: 15.1, 15.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useConfigStore } from './configStore';
import { DemoScenario } from '../types';
import { persistenceService } from '../services/persistenceService';

describe('ConfigStore', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have default c