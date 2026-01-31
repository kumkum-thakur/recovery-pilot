/**
 * AgentStore - Timeout and Error Handling Tests
 * 
 * Tests the timeout and error handling functionality added in task 21.4
 * 
 * Requirements: 7.1, 7.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAgentStore } from './agentStore';

describe('AgentStore - Timeout and Error Handling', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAgentStore.getState();
    store.clearWorkflow();
  });

  describe('executeStepWithTimeout', () => {
    it('should complete step successfully within timeout', async () => {
      const { executeStepWithTimeout } = useAgentStore.getState();
      
      // Initialize a workflow
      useAgentStore.setState({
        currentWorkflow: [
          { id: 'test-1', label: 'Test Step', status: 'pending', duration: 100 }
        ],
        isProcessing: true,
      });

      // Execute step with short duration (should complete)
      await executeStepWithTimeout(
        { id: 'test-1', label: 'Test Step', status: 'pending', duration: 100 },
        0
      );

      const { currentWorkflow } = useAgentStore.getState();
      expect(currentWorkflow).not.toBeNull();
      expect(currentWorkflow![0].status).toBe('completed');
    });

    it('should mark step as failed on timeout', async () => {
      const { executeStepWithTimeout } = useAgentStore.getState();
      
      // Initialize a workflow with a step that will timeout
      useAgentStore.setState({
        currentWorkflow: [
          { id: 'test-1', label: 'Slow Step', status: 'pending', duration: 10000 } // 10 seconds
        ],
        isProcessing: true,
      });

      // Execute step that will timeout (5 second timeout)
      await expect(
        executeStepWithTimeout(
          { id: 'test-1', label: 'Slow Step', status: 'pending', duration: 10000 },
          0
        )
      ).rejects.toThrow('timed out');

      const { currentWorkflow } = useAgentStore.getState();
      expect(currentWorkflow).not.toBeNull();
      expect(currentWorkflow![0].status).toBe('failed');
    }, 10000); // 10 second test timeout to allow for 5 second workflow timeout

    it('should handle workflow cleared during execution', async () => {
      const { executeStepWithTimeout, clearWorkflow } = useAgentStore.getState();
      
      // Initialize a workflow
      useAgentStore.setState({
        currentWorkflow: [
          { id: 'test-1', label: 'Test Step', status: 'pending', duration: 100 }
        ],
        isProcessing: true,
      });

      // Start step execution
      const stepPromise = executeStepWithTimeout(
        { id: 'test-1', label: 'Test Step', status: 'pending', duration: 100 },
        0
      );

      // Clear workflow while step is executing
      clearWorkflow();

      // Should complete without error even though workflow was cleared
      await stepPromise;

      const { currentWorkflow } = useAgentStore.getState();
      expect(currentWorkflow).toBeNull();
    });
  });

  describe('startTriageWorkflow - Error Handling', () => {
    it('should handle workflow errors gracefully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const { startTriageWorkflow } = useAgentStore.getState();

      // Mock a step that will fail
      vi.spyOn(useAgentStore.getState(), 'executeStepWithTimeout')
        .mockRejectedValueOnce(new Error('Step failed'));

      // Start workflow - should throw error
      await expect(startTriageWorkflow(mockFile)).rejects.toThrow('Step failed');

      // Verify processing is set to false after error
      const { isProcessing } = useAgentStore.getState();
      expect(isProcessing).toBe(false);
    });

    it('should preserve partial workflow progress on failure', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const { startTriageWorkflow } = useAgentStore.getState();

      // Mock executeStepWithTimeout to succeed once then fail
      const executeStepMock = vi.spyOn(useAgentStore.getState(), 'executeStepWithTimeout');
      executeStepMock
        .mockResolvedValueOnce(undefined) // First step succeeds
        .mockRejectedValueOnce(new Error('Second step failed')); // Second step fails

      // Start workflow
      await expect(startTriageWorkflow(mockFile)).rejects.toThrow('Second step failed');

      // Verify workflow is still visible (not cleared)
      const { currentWorkflow } = useAgentStore.getState();
      expect(currentWorkflow).not.toBeNull();
      expect(currentWorkflow!.length).toBe(3); // All 3 steps should still be there
    });
  });

  describe('startRefillWorkflow - Error Handling', () => {
    it('should handle workflow errors gracefully', async () => {
      const { startRefillWorkflow } = useAgentStore.getState();

      // Mock a step that will fail
      vi.spyOn(useAgentStore.getState(), 'executeStepWithTimeout')
        .mockRejectedValueOnce(new Error('Step failed'));

      // Start workflow - should throw error
      await expect(startRefillWorkflow('Amoxicillin')).rejects.toThrow('Step failed');

      // Verify processing is set to false after error
      const { isProcessing } = useAgentStore.getState();
      expect(isProcessing).toBe(false);
    });

    it('should preserve partial workflow progress on failure', async () => {
      const { startRefillWorkflow } = useAgentStore.getState();

      // Mock executeStepWithTimeout to succeed once then fail
      const executeStepMock = vi.spyOn(useAgentStore.getState(), 'executeStepWithTimeout');
      executeStepMock
        .mockResolvedValueOnce(undefined) // First step succeeds
        .mockRejectedValueOnce(new Error('Second step failed')); // Second step fails

      // Start workflow
      await expect(startRefillWorkflow('Amoxicillin')).rejects.toThrow('Second step failed');

      // Verify workflow is still visible (not cleared)
      const { currentWorkflow } = useAgentStore.getState();
      expect(currentWorkflow).not.toBeNull();
      expect(currentWorkflow!.length).toBe(3); // All 3 steps should still be there
    });
  });
});
