/**
 * AgentStore - Zustand store for AI workflow management
 * 
 * Manages:
 * - Current workflow state and processing status
 * - Triage workflow execution
 * - Refill workflow execution
 * - Workflow step tracking and updates
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { create } from 'zustand';
import type { AgentStore as IAgentStore, AgentStep } from '../types';

/**
 * AgentStore implementation using Zustand
 * 
 * Provides state management for AI-driven workflows
 * Requirements: 7.1, 7.2, 7.3
 */
export const useAgentStore = create<IAgentStore>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================
  
  /**
   * Current workflow steps being executed
   * null when no workflow is active
   * 
   * Requirements: 7.3
   */
  currentWorkflow: null,
  
  /**
   * Processing state for async workflow operations
   * true when a workflow is actively executing
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
   * This method:
   * 1. Sets processing state to true
   * 2. Initializes workflow steps
   * 3. Delegates to agent service for actual analysis
   * 4. Updates workflow steps as they progress
   * 5. Clears workflow on completion
   * 
   * Note: The actual AI analysis is handled by the AgentService.
   * This store only manages the workflow state and UI updates.
   * 
   * @param imageFile - Wound image to analyze
   * @throws Error if workflow fails
   * 
   * Requirements: 7.1, 7.3
   */
  startTriageWorkflow: async (imageFile: File) => {
    // Set processing state
    set({ isProcessing: true });
    
    try {
      // Initialize workflow steps (will be updated by agent service)
      const steps: AgentStep[] = [
        { id: '1', label: 'Analyzing Image...', status: 'pending', duration: 1000 },
        { id: '2', label: 'Drafting Clinical Note...', status: 'pending', duration: 1000 },
        { id: '3', label: 'Creating Appointment Slot...', status: 'pending', duration: 1000 },
      ];
      
      set({ currentWorkflow: steps });
      
      // Note: Actual workflow execution will be handled by AgentService
      // This is a placeholder that will be integrated in task 7.2
      console.log('Triage workflow started for image:', imageFile.name);
      
      // Workflow will be cleared by the caller after completion
    } catch (error) {
      console.error('Failed to start triage workflow:', error);
      set({ isProcessing: false, currentWorkflow: null });
      throw error;
    }
  },

  /**
   * Starts the refill workflow for medication ordering
   * 
   * This method:
   * 1. Sets processing state to true
   * 2. Initializes workflow steps
   * 3. Delegates to agent service for processing
   * 4. Updates workflow steps as they progress
   * 5. Clears workflow on completion
   * 
   * Note: The actual processing is handled by the AgentService.
   * This store only manages the workflow state and UI updates.
   * 
   * @param medicationName - Medication to refill
   * @throws Error if workflow fails
   * 
   * Requirements: 7.2, 7.3
   */
  startRefillWorkflow: async (medicationName: string) => {
    // Set processing state
    set({ isProcessing: true });
    
    try {
      // Initialize workflow steps (will be updated by agent service)
      const steps: AgentStep[] = [
        { id: '1', label: 'Checking Pharmacy Inventory (Mock API)...', status: 'pending', duration: 1000 },
        { id: '2', label: 'Verifying Insurance Coverage...', status: 'pending', duration: 1000 },
        { id: '3', label: 'Order Placed.', status: 'pending', duration: 500 },
      ];
      
      set({ currentWorkflow: steps });
      
      // Note: Actual workflow execution will be handled by AgentService
      // This is a placeholder that will be integrated in task 7.5
      console.log('Refill workflow started for medication:', medicationName);
      
      // Workflow will be cleared by the caller after completion
    } catch (error) {
      console.error('Failed to start refill workflow:', error);
      set({ isProcessing: false, currentWorkflow: null });
      throw error;
    }
  },

  /**
   * Clears the current workflow and resets processing state
   * 
   * This method should be called:
   * - After a workflow completes successfully
   * - When a workflow is cancelled
   * - When an error occurs and the workflow needs to be reset
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
