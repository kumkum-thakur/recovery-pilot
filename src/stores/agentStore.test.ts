/**
 * AgentStore Unit Tests
 * 
 * Tests the AgentStore implementation for:
 * - Initial state
 * - Triage workflow execution
 * - Refill workflow execution
 * - Workflow clearing
 * - Error handling
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAgentStore } from './agentStore';
import { AgentStepStatus } from '../types';

describe('AgentStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useAgentStore.getState();
    store.clearWorkflow();
  });

  describe('Initial State', () => {
    i