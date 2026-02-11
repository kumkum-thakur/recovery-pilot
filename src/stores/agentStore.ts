/**
 * AgentStore - Zustand store for AI workflow management
 * 
 * Manages:
 * - Current agent workflow state and steps
 * - Processing status
 * - Triage and refill workflow execution
 * - Error handling and retry capabilities
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { create } from 'zustand';
import type { AgentStore as IAgentStore, AgentStep } from '../types';

// Workflow timeout in milliseconds (5 seconds per step max)
const WORKFLOW_STEP_TIMEOUT = 5000;

/**
 * AgentStore implementation using Zustand
 * 
 * Provides state management for AI-driven workflows including
 * triage analysis and medication refill requests
 * 
 * Requirements: 7.1, 7.2, 7.3
 */
export const useAgentStore = create<IAgentStore>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================
  
  /**
   * Current workflow steps being executed
   * null if no workflow is active
   * 
   * Requirements: 7.1, 7.2, 7.3
   */
  currentWorkflow: null,
  
  /**
   * Processing status
   * true if a workflow is currently executing
   * 
   * Requirements: 7.1, 7.2
   */
  isProcessing: false,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Helper function to execute a single workflow step with timeout
   * 
   * @param step - The workflow step to execute
   * @param stepIndex - Index of the step in the workflow
   * @returns Promise that resolves when step completes or rejects on timeout
   * 
   * Requirements: 7.1, 7.2
   */
  executeStepWithTimeout: async (step: AgentStep, stepIndex: number): Promise<void> => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    // Update step to in_progress
    let updatedSteps = [...currentWorkflow];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status: 'in_progress' };
    set({ currentWorkflow: updatedSteps });

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Step "${step.label}" timed out after ${WORKFLOW_STEP_TIMEOUT}ms`));
      }, WORKFLOW_STEP_TIMEOUT);
    });

    // Create step execution promise
    const stepPromise = new Promise<void>(resolve => {
      setTimeout(resolve, step.duration || 1000);
    });

    try {
      // Race between step completion and timeout
      await Promise.race([stepPromise, timeoutPromise]);

      // Get current workflow state again (might have been cleared)
      const { currentWorkflow: updatedWorkflow } = get();
      if (!updatedWorkflow) return;

      // Update step to completed
      updatedSteps = [...updatedWorkflow];
      updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status: 'completed' };
      set({ currentWorkflow: updatedSteps });
    } catch (error) {
      // Mark step as failed on timeout
      const { currentWorkflow: failedWorkflow } = get();
      if (failedWorkflow) {
        const failedSteps = [...failedWorkflow];
        failedSteps[stepIndex] = { ...failedSteps[stepIndex], status: 'failed' };
        set({ currentWorkflow: failedSteps });
      }
      throw error;
    }
  },

  /**
   * Starts the triage workflow for wound image analysis
   * 
   * This workflow executes the following steps:
   * 1. Analyzing Image... (1s delay)
   * 2. Drafting Clinical Note... (1s delay)
   * 3. Creating Appointment Slot... (1s delay)
   * 
   * The workflow steps are displayed to the user via the AgentStatusToast
   * component, showing the AI "working" on their behalf.
   * 
   * Includes timeout handling (5s per step) and partial completion support.
   * 
   * @param imageFile - The wound photo to analyze
   * @throws Error if a workflow is already in progress or if workflow times out
   * 
   * Requirements: 7.1
   */
  startTriageWorkflow: async (_imageFile: File) => {
    const { isProcessing, executeStepWithTimeout } = get();
    
    // Prevent concurrent workflows
    if (isProcessing) {
      throw new Error('A workflow is already in progress');
    }
    
    // Define triage workflow steps
    const steps: AgentStep[] = [
      {
        id: 'triage-1',
        label: 'Analyzing Image...',
        status: 'pending',
        duration: 1000,
      },
      {
        id: 'triage-2',
        label: 'Drafting Clinical Note...',
        status: 'pending',
        duration: 1000,
      },
      {
        id: 'triage-3',
        label: 'Creating Appointment Slot...',
        status: 'pending',
        duration: 1000,
      },
    ];
    
    // Initialize workflow
    set({
      currentWorkflow: steps,
      isProcessing: true,
    });
    
    try {
      // Execute workflow steps sequentially with timeout handling
      for (let i = 0; i < steps.length; i++) {
        const { currentWorkflow } = get();
        if (!currentWorkflow) break;
        
        // Execute step with timeout protection
        await executeStepWithTimeout(steps[i], i);
      }
      
      // Workflow complete - keep steps visible for UI to handle cleanup
      set({ isProcessing: false });
      
    } catch (error) {
      // Mark workflow as failed but keep partial progress visible
      set({ isProcessing: false });
      
      // Re-throw error for UI to handle
      throw error;
    }
  },

  /**
   * Starts the refill workflow for medication ordering
   * 
   * This workflow executes the following steps:
   * 1. Checking Pharmacy Inventory (Mock API)... (1s delay)
   * 2. Verifying Insurance Coverage... (1s delay)
   * 3. Order Placed. (0.5s delay)
   * 
   * The workflow steps are displayed to the user via the AgentStatusToast
   * component, showing the AI "working" on their behalf.
   * 
   * Includes timeout handling (5s per step) and partial completion support.
   * 
   * @param medicationName - The medication to refill
   * @throws Error if a workflow is already in progress or if workflow times out
   * 
   * Requirements: 7.2
   */
  startRefillWorkflow: async (_medicationName: string) => {
    const { isProcessing, executeStepWithTimeout } = get();
    
    // Prevent concurrent workflows
    if (isProcessing) {
      throw new Error('A workflow is already in progress');
    }
    
    // Define refill workflow steps
    const steps: AgentStep[] = [
      {
        id: 'refill-1',
        label: 'Checking Pharmacy Inventory (Mock API)...',
        status: 'pending',
        duration: 1000,
      },
      {
        id: 'refill-2',
        label: 'Verifying Insurance Coverage...',
        status: 'pending',
        duration: 1000,
      },
      {
        id: 'refill-3',
        label: 'Order Placed.',
        status: 'pending',
        duration: 500,
      },
    ];
    
    // Initialize workflow
    set({
      currentWorkflow: steps,
      isProcessing: true,
    });
    
    try {
      // Execute workflow steps sequentially with timeout handling
      for (let i = 0; i < steps.length; i++) {
        const { currentWorkflow } = get();
        if (!currentWorkflow) break;
        
        // Execute step with timeout protection
        await executeStepWithTimeout(steps[i], i);
      }
      
      // Workflow complete - keep steps visible for UI to handle cleanup
      set({ isProcessing: false });
      
    } catch (error) {
      // Mark workflow as failed but keep partial progress visible
      set({ isProcessing: false });
      
      // Re-throw error for UI to handle
      throw error;
    }
  },

  /**
   * Clears the current workflow
   * 
   * This should be called after the UI has finished displaying
   * the workflow results (e.g., after the AgentStatusToast is dismissed)
   * 
   * Requirements: 7.3
   */
  clearWorkflow: () => {
    set({
      currentWorkflow: null,
      isProcessing: false,
    });
  },
}));
