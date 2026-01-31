/**
 * AgentStore - Zustand store for AI workflow management
 * 
 * Manages:
 * - Current agent workflow state and steps
 * - Processing status
 * - Triage and refill workflow execution
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { create } from 'zustand';
import type { AgentStore as IAgentStore, AgentStep } from '../types';

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
   * @param imageFile - The wound photo to analyze
   * @throws Error if a workflow is already in progress
   * 
   * Requirements: 7.1
   */
  startTriageWorkflow: async (imageFile: File) => {
    const { isProcessing } = get();
    
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
      // Execute workflow steps sequentially
      for (let i = 0; i < steps.length; i++) {
        // Update step to in_progress
        const updatedSteps = [...steps];
        updatedSteps[i] = { ...updatedSteps[i], status: 'in_progress' };
        set({ currentWorkflow: updatedSteps });
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, steps[i].duration || 1000));
        
        // Update step to completed
        updatedSteps[i] = { ...updatedSteps[i], status: 'completed' };
        set({ currentWorkflow: updatedSteps });
      }
      
      // Workflow complete - keep steps visible for UI to handle cleanup
      set({ isProcessing: false });
      
    } catch (error) {
      // Mark current step as failed
      const { currentWorkflow } = get();
      if (currentWorkflow) {
        const failedSteps = currentWorkflow.map(step => 
          step.status === 'in_progress' 
            ? { ...step, status: 'failed' as const }
            : step
        );
        set({
          currentWorkflow: failedSteps,
          isProcessing: false,
        });
      }
      
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
   * @param medicationName - The medication to refill
   * @throws Error if a workflow is already in progress
   * 
   * Requirements: 7.2
   */
  startRefillWorkflow: async (medicationName: string) => {
    const { isProcessing } = get();
    
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
      // Execute workflow steps sequentially
      for (let i = 0; i < steps.length; i++) {
        // Update step to in_progress
        const updatedSteps = [...steps];
        updatedSteps[i] = { ...updatedSteps[i], status: 'in_progress' };
        set({ currentWorkflow: updatedSteps });
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, steps[i].duration || 1000));
        
        // Update step to completed
        updatedSteps[i] = { ...updatedSteps[i], status: 'completed' };
        set({ currentWorkflow: updatedSteps });
      }
      
      // Workflow complete - keep steps visible for UI to handle cleanup
      set({ isProcessing: false });
      
    } catch (error) {
      // Mark current step as failed
      const { currentWorkflow } = get();
      if (currentWorkflow) {
        const failedSteps = currentWorkflow.map(step => 
          step.status === 'in_progress' 
            ? { ...step, status: 'failed' as const }
            : step
        );
        set({
          currentWorkflow: failedSteps,
          isProcessing: false,
        });
      }
      
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
