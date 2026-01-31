/**
 * Infrastructure Verification Tests
 * 
 * Task 6: Checkpoint - Core infrastructure complete
 * 
 * This test suite verifies:
 * 1. All stores are working with persistence
 * 2. Authentication flow works end-to-end
 * 3. Seed data loads correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceService } from '../services/persistenceService';
import { authService } from '../services/authService';
import { initializeSeedData, SEED_USERS, SEED_MISSIONS } from '../services/seedData';
import { useUserStore } from '../stores/userStore';
import { useMissionStore } from '../stores/missionStore';
import { useAgentStore } from '../stores/agentStore';
import { useActionItemStore } from '../stores/actionItemStore';
import { UserRole, MissionStatus, ActionItemStatus, ActionItemType } from '../types';

describe('Task 6: Core Infrastructure Verification', () => {
  beforeEach(() => {
    // Clear all data before each test
    persistenceService.clearAll();
    authService.logout();
    
    // Reset all stores
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
    });
    useMissionStore.setState({
      missions: [],
      isLoading: false,
    });
    useAgentStore.setState({
      currentWorkflow: null,
      isProcessing: false,
    });
    useActionItemStore.setState({
      actionItems: [],
      isLoading: false,
    });
  });

  describe('1. Persistence Service', () => {
    it('should store and retrieve data correctly', () => {
      const testData = { name: 'Test', value: 123 };
      
      persistence