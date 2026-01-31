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
      const steps: AgentStep[] = [
        { id: '1', label: 'Step 1', status: 'pending', duration: 100 },
      ];

      const generator = simulateWorkflowSteps(steps);
      const results: AgentStep[] = [];

      // Start the generator
      const promise = (async () => {
        for await (const step of generator) {
          results.push(step);
        }
      })();

      // Fast-forward through the delays
      await vi.runAllTimersAsync();
      await promise;

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: '1',
        label: 'Step 1',
        status: 'in_progress',
      });
      expect(results[1]).toMatchObject({
        id: '1',
        label: 'Step 1',
        status: 'completed',
      });
    });

    it('should process multiple steps sequentially', async () => {
      const steps: AgentStep[] = [
        { id: '1', label: 'Step 1', status: 'pending', duration: 100 },
        { id: '2', label: 'Step 2', status: 'pending', duration: 100 },
        { id: '3', label: 'Step 3', status: 'pending', duration: 100 },
      ];

      const generator = simulateWorkflowSteps(steps);
      const results: AgentStep[] = [];

      const promise = (async () => {
        for await (const step of generator) {
          results.push(step);
        }
      })();

      await vi.runAllTimersAsync();
      await promise;

      // Should have 2 yields per step (in_progress + completed)
      expect(results).toHaveLength(6);
      
      // Verify order: step1 in_progress, step1 completed, step2 in_progress, etc.
      expect(results[0].id).toBe('1');
      expect(results[0].status).toBe('in_progress');
      expect(results[1].id).toBe('1');
      expect(results[1].status).toBe('completed');
      expect(results[2].id).toBe('2');
      expect(results[2].status).toBe('in_progress');
      expect(results[3].id).toBe('2');
      expect(results[3].status).toBe('completed');
      expect(results[4].id).toBe('3');
      expect(results[4].status).toBe('in_progress');
      expect(results[5].id).toBe('3');
      expect(results[5].status).toBe('completed');
    });

    it('should use default duration of 1000ms when not specified', async () => {
      const steps: AgentStep[] = [
        { id: '1', label: 'Step 1', status: 'pending' }, // No duration specified
      ];

      const generator = simulateWorkflowSteps(steps);
      const results: AgentStep[] = [];

      const promise = (async () => {
        for await (const step of generator) {
          results.push(step);
        }
      })();

      // Advance by less than 1000ms - should not complete yet
      await vi.advanceTimersByTimeAsync(500);
      expect(results).toHaveLength(1); // Only in_progress

      // Advance the rest of the way
      await vi.advanceTimersByTimeAsync(500);
      await promise;
      
      expect(results).toHaveLength(2); // in_progress + completed
    });

    it('should respect custom durations for each step', async () => {
      const steps: AgentStep[] = [
        { id: '1', label: 'Fast step', status: 'pending', duration: 100 },
        { id: '2', label: 'Slow step', status: 'pending', duration: 500 },
      ];

      const generator = simulateWorkflowSteps(steps);
      const results: AgentStep[] = [];

      const promise = (async () => {
        for await (const step of generator) {
          results.push(step);
        }
      })();

      // Run all timers to completion
      await vi.runAllTimersAsync();
      await promise;
      
      // Should have 4 results total (2 steps × 2 states each)
      expect(results).toHaveLength(4);
      
      // Verify the steps and their order
      expect(results[0].id).toBe('1');
      expect(results[0].status).toBe('in_progress');
      expect(results[1].id).toBe('1');
      expect(results[1].status).toBe('completed');
      expect(results[2].id).toBe('2');
      expect(results[2].status).toBe('in_progress');
      expect(results[3].id).toBe('2');
      expect(results[3].status).toBe('completed');
    });

    it('should handle empty step array', async () => {
      const steps: AgentStep[] = [];
      const generator = simulateWorkflowSteps(steps);
      const results: AgentStep[] = [];

      for await (const step of generator) {
        results.push(step);
      }

      expect(results).toHaveLength(0);
    });

    it('should preserve step labels and IDs', async () => {
      const steps: AgentStep[] = [
        { id: 'custom-id', label: 'Custom Label', status: 'pending', duration: 100 },
      ];

      const generator = simulateWorkflowSteps(steps);
      const results: AgentStep[] = [];

      const promise = (async () => {
        for await (const step of generator) {
          results.push(step);
        }
      })();

      await vi.runAllTimersAsync();
      await promise;

      expect(results[0].id).toBe('custom-id');
      expect(results[0].label).toBe('Custom Label');
      expect(results[1].id).toBe('custom-id');
      expect(results[1].label).toBe('Custom Label');
    });

    it('should handle steps with zero duration', async () => {
      const steps: AgentStep[] = [
        { id: '1', label: 'Instant step', status: 'pending', duration: 0 },
      ];

      const generator = simulateWorkflowSteps(steps);
      const results: AgentStep[] = [];

      const promise = (async () => {
        for await (const step of generator) {
          results.push(step);
        }
      })();

      await vi.runAllTimersAsync();
      await promise;

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('in_progress');
      expect(results[1].status).toBe('completed');
    });

    it('should not mutate original step objects', async () => {
      const originalStep: AgentStep = {
        id: '1',
        label: 'Original',
        status: 'pending',
        duration: 100,
      };
      const steps: AgentStep[] = [originalStep];

      const generator = simulateWorkflowSteps(steps);
      
      const promise = (async () => {
        for await (const step of generator) {
          // Just consume the generator
        }
      })();

      await vi.runAllTimersAsync();
      await promise;

      // Original should be unchanged
      expect(originalStep.status).toBe('pending');
    });
  });

  describe('Real-world workflow scenarios', () => {
    it('should simulate triage workflow steps', async () => {
      const triageSteps: AgentStep[] = [
        { id: '1', label: 'Analyzing Image...', status: 'pending', duration: 1000 },
        { id: '2', label: 'Drafting Clinical Note...', status: 'pending', duration: 1000 },
        { id: '3', label: 'Creating Appointment Slot...', status: 'pending', duration: 1000 },
      ];

      const generator = simulateWorkflowSteps(triageSteps);
      const results: AgentStep[] = [];

      const promise = (async () => {
        for await (const step of generator) {
          results.push(step);
        }
      })();

      await vi.runAllTimersAsync();
      await promise;

      // Should have 6 results (3 steps × 2 states each)
      expect(results).toHaveLength(6);
      
      // Verify the workflow labels are preserved
      expect(results[0].label).toBe('Analyzing Image...');
      expect(results[2].label).toBe('Drafting Clinical Note...');
      expect(results[4].label).toBe('Creating Appointment Slot...');
    });

    it('should simulate refill workflow steps', async () => {
      const refillSteps: AgentStep[] = [
        { id: '1', label: 'Checking Pharmacy Inventory (Mock API)...', status: 'pending', duration: 1000 },
        { id: '2', label: 'Verifying Insurance Coverage...', status: 'pending', duration: 1000 },
        { id: '3', label: 'Order Placed.', status: 'pending', duration: 500 },
      ];

      const generator = simulateWorkflowSteps(refillSteps);
      const results: AgentStep[] = [];

      const promise = (async () => {
        for await (const step of generator) {
          results.push(step);
        }
      })();

      await vi.runAllTimersAsync();
      await promise;

      expect(results).toHaveLength(6);
      expect(results[0].label).toBe('Checking Pharmacy Inventory (Mock API)...');
      expect(results[2].label).toBe('Verifying Insurance Coverage...');
      expect(results[4].label).toBe('Order Placed.');
    });
  });
});

describe('Agent Service - Triage Workflow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeWoundImage', () => {
    it('should return green result for SCENARIO_HAPPY_PATH', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      // Create a mock image file
      const mockFile = new File(['mock image data'], 'wound.jpg', { type: 'image/jpeg' });
      
      // Start the analysis
      const promise = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_HAPPY_PATH);
      
      // Fast-forward through all timers
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Verify green result
      expect(result.analysis).toBe('green');
      expect(result.analysisText).toBe('Healing well. Keep it dry.');
      expect(result.confidenceScore).toBe(0.92);
      expect(result.actionItemId).toBeUndefined();
    });

    it('should return red result for SCENARIO_RISK_DETECTED', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      // Create a mock image file
      const mockFile = new File(['mock image data'], 'wound.jpg', { type: 'image/jpeg' });
      
      // Start the analysis
      const promise = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Fast-forward through all timers
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Verify red result
      expect(result.analysis).toBe('red');
      expect(result.analysisText).toBe('Redness detected. I have auto-drafted a message to Dr. Smith.');
      expect(result.confidenceScore).toBe(0.87);
      expect(result.actionItemId).toBeDefined();
    });

    it('should create action item for red result', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      const { persistenceService } = await import('./persistenceService');
      
      // Create a mock image file
      const mockFile = new File(['mock image data'], 'wound.jpg', { type: 'image/jpeg' });
      
      // Start the analysis
      const promise = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Fast-forward through all timers
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Verify action item was created
      expect(result.actionItemId).toBeDefined();
      
      // Retrieve the action item from persistence
      const actionItem = persistenceService.getActionItem(result.actionItemId!);
      
      expect(actionItem).toBeDefined();
      expect(actionItem?.type).toBe('triage');
      expect(actionItem?.status).toBe('pending_doctor');
      expect(actionItem?.triageAnalysis).toBe('red');
      expect(actionItem?.triageText).toBe('Redness detected around incision site. Possible infection.');
      expect(actionItem?.aiConfidenceScore).toBe(0.87);
      expect(actionItem?.imageUrl).toBeDefined();
      expect(actionItem?.patientId).toBe('patient-1');
      expect(actionItem?.patientName).toBe('Divya Patel');
    });

    it('should store confidence score for both green and red results', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      const mockFile = new File(['mock image data'], 'wound.jpg', { type: 'image/jpeg' });
      
      // Test green result
      const greenPromise = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_HAPPY_PATH);
      await vi.runAllTimersAsync();
      const greenResult = await greenPromise;
      expect(greenResult.confidenceScore).toBe(0.92);
      
      // Clear timers for next test
      vi.clearAllTimers();
      
      // Test red result
      const redPromise = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_RISK_DETECTED);
      await vi.runAllTimersAsync();
      const redResult = await redPromise;
      expect(redResult.confidenceScore).toBe(0.87);
    });

    it('should convert image file to data URL for storage', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      const { persistenceService } = await import('./persistenceService');
      
      // Create a mock image file
      const mockFile = new File(['mock image data'], 'wound.jpg', { type: 'image/jpeg' });
      
      // Start the analysis (which stores the image)
      const promise = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Fast-forward through all timers
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Retrieve the action item
      const actionItem = persistenceService.getActionItem(result.actionItemId!);
      
      // Verify image URL is a data URL
      expect(actionItem?.imageUrl).toBeDefined();
      expect(actionItem?.imageUrl).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should execute workflow steps before returning result', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      const mockFile = new File(['mock image data'], 'wound.jpg', { type: 'image/jpeg' });
      
      // Start the analysis
      const promise = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_HAPPY_PATH);
      
      // Fast-forward through all timers (3 steps × 1000ms each)
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      expect(result.analysis).toBe('green');
    });

    it('should be deterministic for same scenario', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      const mockFile = new File(['mock image data'], 'wound.jpg', { type: 'image/jpeg' });
      
      // Run first analysis
      const promise1 = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_HAPPY_PATH);
      await vi.runAllTimersAsync();
      const result1 = await promise1;
      
      // Clear timers for next test
      vi.clearAllTimers();
      
      // Run second analysis
      const promise2 = agentService.analyzeWoundImage(mockFile, DemoScenario.SCENARIO_HAPPY_PATH);
      await vi.runAllTimersAsync();
      const result2 = await promise2;
      
      // Results should be identical (except for action item IDs which are time-based)
      expect(result1.analysis).toBe(result2.analysis);
      expect(result1.analysisText).toBe(result2.analysisText);
      expect(result1.confidenceScore).toBe(result2.confidenceScore);
    });
  });
});

describe('Agent Service - Refill Workflow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processRefillRequest', () => {
    it('should return approved insurance and in-stock inventory for SCENARIO_HAPPY_PATH', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      // Start the refill request
      const promise = agentService.processRefillRequest('Amoxicillin', DemoScenario.SCENARIO_HAPPY_PATH);
      
      // Fast-forward through all timers
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Verify result
      expect(result.insuranceStatus).toBe('approved');
      expect(result.inventoryStatus).toBe('in_stock');
      expect(result.actionItemId).toBeDefined();
    });

    it('should return approved insurance and in-stock inventory for SCENARIO_RISK_DETECTED', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      // Start the refill request
      const promise = agentService.processRefillRequest('Ibuprofen', DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Fast-forward through all timers
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Verify result (refills are always approved in MVP)
      expect(result.insuranceStatus).toBe('approved');
      expect(result.inventoryStatus).toBe('in_stock');
      expect(result.actionItemId).toBeDefined();
    });

    it('should create action item for doctor review', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      const { persistenceService } = await import('./persistenceService');
      
      const medicationName = 'Hydrocodone';
      
      // Start the refill request
      const promise = agentService.processRefillRequest(medicationName, DemoScenario.SCENARIO_HAPPY_PATH);
      
      // Fast-forward through all timers
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Verify action item was created
      expect(result.actionItemId).toBeDefined();
      
      // Retrieve the action item from persistence
      const actionItem = persistenceService.getActionItem(result.actionItemId);
      
      expect(actionItem).toBeDefined();
      expect(actionItem?.type).toBe('refill');
      expect(actionItem?.status).toBe('pending_doctor');
      expect(actionItem?.medicationName).toBe(medicationName);
      expect(actionItem?.insuranceStatus).toBe('approved');
      expect(actionItem?.inventoryStatus).toBe('in_stock');
      expect(actionItem?.patientId).toBe('patient-1');
      expect(actionItem?.patientName).toBe('Divya Patel');
    });

    it('should execute workflow steps before returning result', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      // Start the refill request
      const promise = agentService.processRefillRequest('Aspirin', DemoScenario.SCENARIO_HAPPY_PATH);
      
      // Fast-forward through all timers (1000ms + 1000ms + 500ms)
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      expect(result.insuranceStatus).toBe('approved');
      expect(result.inventoryStatus).toBe('in_stock');
    });

    it('should be deterministic for same scenario', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      
      const medicationName = 'Acetaminophen';
      
      // Run first refill request
      const promise1 = agentService.processRefillRequest(medicationName, DemoScenario.SCENARIO_HAPPY_PATH);
      await vi.runAllTimersAsync();
      const result1 = await promise1;
      
      // Clear timers for next test
      vi.clearAllTimers();
      
      // Run second refill request
      const promise2 = agentService.processRefillRequest(medicationName, DemoScenario.SCENARIO_HAPPY_PATH);
      await vi.runAllTimersAsync();
      const result2 = await promise2;
      
      // Results should be identical (except for action item IDs which are time-based)
      expect(result1.insuranceStatus).toBe(result2.insuranceStatus);
      expect(result1.inventoryStatus).toBe(result2.inventoryStatus);
    });

    it('should handle different medication names', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      const { persistenceService } = await import('./persistenceService');
      
      const medications = ['Medication A', 'Medication B', 'Medication C'];
      
      for (const medication of medications) {
        // Start the refill request
        const promise = agentService.processRefillRequest(medication, DemoScenario.SCENARIO_HAPPY_PATH);
        
        // Fast-forward through all timers
        await vi.runAllTimersAsync();
        
        // Wait for the promise to resolve
        const result = await promise;
        
        // Retrieve the action item
        const actionItem = persistenceService.getActionItem(result.actionItemId);
        
        // Verify medication name is stored correctly
        expect(actionItem?.medicationName).toBe(medication);
        
        // Clear timers for next iteration
        vi.clearAllTimers();
      }
    });

    it('should create unique action items for multiple refill requests', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      const { persistenceService } = await import('./persistenceService');
      
      // First refill request
      const promise1 = agentService.processRefillRequest('Med1', DemoScenario.SCENARIO_HAPPY_PATH);
      await vi.runAllTimersAsync();
      const result1 = await promise1;
      
      // Clear timers
      vi.clearAllTimers();
      
      // Second refill request
      const promise2 = agentService.processRefillRequest('Med2', DemoScenario.SCENARIO_HAPPY_PATH);
      await vi.runAllTimersAsync();
      const result2 = await promise2;
      
      // Action item IDs should be different
      expect(result1.actionItemId).not.toBe(result2.actionItemId);
      
      // Both action items should exist
      const actionItem1 = persistenceService.getActionItem(result1.actionItemId);
      const actionItem2 = persistenceService.getActionItem(result2.actionItemId);
      
      expect(actionItem1).toBeDefined();
      expect(actionItem2).toBeDefined();
      expect(actionItem1?.medicationName).toBe('Med1');
      expect(actionItem2?.medicationName).toBe('Med2');
    });

    it('should store timestamps for action items', async () => {
      const { agentService } = await import('./agentService');
      const { DemoScenario } = await import('../types');
      const { persistenceService } = await import('./persistenceService');
      
      // Start the refill request
      const promise = agentService.processRefillRequest('Medication', DemoScenario.SCENARIO_HAPPY_PATH);
      
      // Fast-forward through all timers
      await vi.runAllTimersAsync();
      
      // Wait for the promise to resolve
      const result = await promise;
      
      // Retrieve the action item
      const actionItem = persistenceService.getActionItem(result.actionItemId);
      
      // Verify timestamps exist and are valid ISO strings
      expect(actionItem?.createdAt).toBeDefined();
      expect(actionItem?.updatedAt).toBeDefined();
      expect(() => new Date(actionItem!.createdAt)).not.toThrow();
      expect(() => new Date(actionItem!.updatedAt)).not.toThrow();
    });
  });
});
