/**
 * Mock Agent Service
 * 
 * Simulates AI-driven workflows with configurable delays and scenario-based responses.
 * This service provides the "agentic" experience where the system appears to be working
 * on behalf of the patient (checking insurance, analyzing images, etc.).
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 15.1, 15.2
 */

import type {
  AgentService,
  AgentStep,
  AgentStepStatus,
  DemoScenario,
  TriageResult,
  RefillResult,
} from '../types';

// ============================================================================
// Workflow Step Simulator
// ============================================================================

/**
 * Simulates workflow steps with configurable delays.
 * This async generator yields each step as it progresses through its lifecycle:
 * pending → in_progress → completed
 * 
 * Requirements: 7.1, 7.2
 * 
 * @param steps - Array of workflow steps to simulate
 * @yields Updated step objects as they progress
 * 
 * @example
 * const steps = [
 *   { id: '1', label: 'Analyzing Image...', status: 'pending', duration: 1000 },
 *   { id: '2', label: 'Drafting Note...', status: 'pending', duration: 1000 }
 * ];
 * 
 * for await (const step of simulateWorkflowSteps(steps)) {
 *   console.log(`Step ${step.id}: ${step.status}`);
 *   // Update UI with step progress
 * }
 */
export async function* simulateWorkflowSteps(
  steps: AgentStep[]
): AsyncGenerator<AgentStep> {
  for (const step of steps) {
    // Step 1: Mark as in progress
    const inProgressStep: AgentStep = {
      ...step,
      status: 'in_progress' as AgentStepStatus,
    };
    yield inProgressStep;

    // Step 2: Wait for the configured duration (default 1000ms)
    const duration = step.duration ?? 1000;
    await new Promise(resolve => setTimeout(resolve, duration));

    // Step 3: Mark as completed
    const completedStep: AgentStep = {
      ...step,
      status: 'completed' as AgentStepStatus,
    };
    yield completedStep;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Delays execution for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a unique ID for action items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Mock Agent Service Implementation
// ============================================================================

/**
 * Creates a mock agent service instance
 * 
 * This service simulates AI workflows for:
 * - Wound image triage analysis
 * - Medication refill requests
 * 
 * Requirements: 6.1, 7.1, 7.2
 */
export function createAgentService(): AgentService {
  return {
    simulateWorkflowSteps,
    
    /**
     * Analyzes a wound image and returns triage results
     * 
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1
     * 
     * @param imageFile - The wound image to analyze
     * @param scenario - Demo scenario to determine result
     * @returns Triage result with analysis and confidence score
     */
    async analyzeWoundImage(
      imageFile: File,
      scenario: DemoScenario
    ): Promise<TriageResult> {
      // This will be implemented in task 7.2
      throw new Error('Not implemented yet - will be completed in task 7.2');
    },

    /**
     * Processes a medication refill request
     * 
     * Requirements: 7.2
     * 
     * @param medicationName - Name of the medication to refill
     * @param scenario - Demo scenario to determine result
     * @returns Refill result with insurance and inventory status
     */
    async processRefillRequest(
      medicationName: string,
      scenario: DemoScenario
    ): Promise<RefillResult> {
      // This will be implemented in task 7.3
      throw new Error('Not implemented yet - will be completed in task 7.3');
    },
  };
}

// Export singleton instance
export const agentService = createAgentService();
