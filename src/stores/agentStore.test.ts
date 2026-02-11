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

import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from './agentStore';
import { AgentStepStatus } from '../types';

describe('AgentStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useAgentStore.getState();
    store.clearWorkflow();
  });

  describe('Initial State', () => {
    it('should have null currentWorkflow initially', () => {
      const { currentWorkflow } = useAgentStore.getState();
      expect(currentWorkflow).toBeNull();
    });

    it('should have isProcessing false initially', () => {
      const { isProcessing } = useAgentStore.getState();
      expect(isProcessing).toBe(false);
    });
  });

  describe('startTriageWorkflow', () => {
    it('should initialize workflow with three steps', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const { startTriageWorkflow } = useAgentStore.getState();
      
      // Start workflow (don't await to check initial state)
      const workflowPromise = startTriageWorkflow(mockFile);
      
      // Check workflow was initialized
      const { currentWorkflow, isProcessing } = useAgentStore.getState();
      expect(currentWorkflow).not.toBeNull();
      expect(currentWorkflow).toHaveLength(3);
      expect(isProcessing).toBe(true);
      
      // Wait for completion
      await workflowPromise;
    });

    it('should have correct step labels for triage workflow', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const { startTriageWorkflow } = useAgentStore.getState();
      
      const workflowPromise = startTriageWorkflow(mockFile);
      
      const { currentWorkflow } = useAgentStore.getState();
      expect(currentWorkflow![0].label).toBe('Analyzing Image...');
      expect(currentWorkflow![1].label).toBe('Drafting Clinical Note...');
      expect(currentWorkflow![2].label).toBe('Creating Appointment Slot...');
      
      await workflowPromise;
    });

    it('should execute steps sequentially and mark them completed', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const { startTriageWorkflow } = useAgentStore.getState();
      
      await startTriageWorkflow(mockFile);
      
      const { currentWorkflow, isProcessing } = useAgentStore.getState();
      expect(currentWorkflow).not.toBeNull();
      expect(currentWorkflow!.every(step => step.status === AgentStepStatus.COMPLETED)).toBe(true);
      expect(isProcessing).toBe(false);
    });

    it('should throw error if workflow already in progress', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const { startTriageWorkflow } = useAgentStore.getState();
      
      // Start first workflow
      const firstWorkflow = startTriageWorkflow(mockFile);
      
      // Try to start second workflow
      await expect(startTriageWorkflow(mockFile)).rejects.toThrow('A workflow is already in progress');
      
      // Clean up
      await firstWorkflow;
    });
  });

  describe('startRefillWorkflow', () => {
    it('should initialize workflow with three steps', async () => {
      const { startRefillWorkflow } = useAgentStore.getState();
      
      // Start workflow (don't await to check initial state)
      const workflowPromise = startRefillWorkflow('Amoxicillin');
      
      // Check workflow was initialized
      const { currentWorkflow, isProcessing } = useAgentStore.getState();
      expect(currentWorkflow).not.toBeNull();
      expect(currentWorkflow).toHaveLength(3);
      expect(isProcessing).toBe(true);
      
      // Wait for completion
      await workflowPromise;
    });

    it('should have correct step labels for refill workflow', async () => {
      const { startRefillWorkflow } = useAgentStore.getState();
      
      const workflowPromise = startRefillWorkflow('Amoxicillin');
      
      const { currentWorkflow } = useAgentStore.getState();
      expect(currentWorkflow![0].label).toBe('Checking Pharmacy Inventory (Mock API)...');
      expect(currentWorkflow![1].label).toBe('Verifying Insurance Coverage...');
      expect(currentWorkflow![2].label).toBe('Order Placed.');
      
      await workflowPromise;
    });

    it('should execute steps sequentially and mark them completed', async () => {
      const { startRefillWorkflow } = useAgentStore.getState();
      
      await startRefillWorkflow('Amoxicillin');
      
      const { currentWorkflow, isProcessing } = useAgentStore.getState();
      expect(currentWorkflow).not.toBeNull();
      expect(currentWorkflow!.every(step => step.status === AgentStepStatus.COMPLETED)).toBe(true);
      expect(isProcessing).toBe(false);
    });

    it('should throw error if workflow already in progress', async () => {
      const { startRefillWorkflow } = useAgentStore.getState();
      
      // Start first workflow
      const firstWorkflow = startRefillWorkflow('Amoxicillin');
      
      // Try to start second workflow
      await expect(startRefillWorkflow('Ibuprofen')).rejects.toThrow('A workflow is already in progress');
      
      // Clean up
      await firstWorkflow;
    });
  });

  describe('clearWorkflow', () => {
    it('should clear workflow and reset processing state', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const { startTriageWorkflow, clearWorkflow } = useAgentStore.getState();
      
      // Start and complete workflow
      await startTriageWorkflow(mockFile);
      
      // Verify workflow exists
      let state = useAgentStore.getState();
      expect(state.currentWorkflow).not.toBeNull();
      
      // Clear workflow
      clearWorkflow();
      
      // Verify workflow is cleared
      state = useAgentStore.getState();
      expect(state.currentWorkflow).toBeNull();
      expect(state.isProcessing).toBe(false);
    });

    it('should be safe to call when no workflow is active', () => {
      const { clearWorkflow } = useAgentStore.getState();
      
      // Should not throw
      expect(() => clearWorkflow()).not.toThrow();
      
      const { currentWorkflow, isProcessing } = useAgentStore.getState();
      expect(currentWorkflow).toBeNull();
      expect(isProcessing).toBe(false);
    });
  });

  describe('Workflow Step Timing', () => {
    it('should respect step durations for triage workflow', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const { startTriageWorkflow } = useAgentStore.getState();
      
      const startTime = Date.now();
      await startTriageWorkflow(mockFile);
      const endTime = Date.now();
      
      // Total duration should be approximately 3000ms (3 steps * 1000ms)
      // Allow some tolerance for execution overhead
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(2900);
      expect(duration).toBeLessThan(3500);
    });

    it('should respect step durations for refill workflow', async () => {
      const { startRefillWorkflow } = useAgentStore.getState();
      
      const startTime = Date.now();
      await startRefillWorkflow('Amoxicillin');
      const endTime = Date.now();
      
      // Total duration should be approximately 2500ms (1000 + 1000 + 500)
      // Allow some tolerance for execution overhead
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(2400);
      expect(duration).toBeLessThan(3000);
    });
  });
});
