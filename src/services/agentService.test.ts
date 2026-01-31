/**
 * Unit tests for Agent Service
 * 
 * Tests the workflow step simulator and agent service functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { simulateWorkflowSteps } from './agentService';
import type { AgentStep } from '../types';

describe('Agent Service - Workflow Step Simulator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('simulateWorkflowSteps', () => {
    it('should yield steps in correct order: in_progress then completed', async () => {
      const steps: Agent