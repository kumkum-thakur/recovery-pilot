/**
 * Agent Service Wrapper
 * 
 * Provides a wrapper around the agent service that automatically
 * injects the current demo scenario from the config store.
 * 
 * This allows components to call agent methods without manually
 * passing the scenario parameter, ensuring consistent behavior
 * based on the debug menu configuration.
 * 
 * Requirements: 15.1, 15.2
 */

import { agentService } from './agentService';
import { useConfigStore } from '../stores/configStore';
import type { TriageResult, RefillResult } from '../types';

/**
 * Wrapped agent service that automatically uses the current demo scenario
 * 
 * Usage:
 * ```typescript
 * import { wrappedAgentService } from '../services/agentServiceWrapper';
 * 
 * // Automatically uses the current scenario from config store
 * const result = await wrappedAgentService.analyzeWoundImage(imageFile);
 * ```
 * 
 * Requirements: 15.1, 15.2
 */
export const wrappedAgentService = {
  /**
   * Analyzes a wound image using the current demo scenario
   * 
   * @param imageFile - The wound image to analyze
   * @returns Triage result with analysis and confidence score
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 15.2
   */
  async analyzeWoundImage(imageFile: File): Promise<TriageResult> {
    // Get current scenario from config store
    const scenario = useConfigStore.getState().getCurrentScenario();
    
    console.log(`[AgentServiceWrapper] Analyzing wound image with scenario: ${scenario}`);
    
    // Call agent service with current scenario
    return agentService.analyzeWoundImage(imageFile, scenario);
  },

  /**
   * Processes a medication refill request using the current demo scenario
   * 
   * @param medicationName - Name of the medication to refill
   * @returns Refill result with insurance and inventory status
   * 
   * Requirements: 7.2, 15.2
   */
  async processRefillRequest(medicationName: string): Promise<RefillResult> {
    // Get current scenario from config store
    const scenario = useConfigStore.getState().getCurrentScenario();
    
    console.log(`[AgentServiceWrapper] Processing refill request with scenario: ${scenario}`);
    
    // Call agent service with current scenario
    return agentService.processRefillRequest(medicationName, scenario);
  },
};

/**
 * Hook to get the wrapped agent service
 * 
 * This hook provides access to the agent service with automatic
 * scenario injection. Use this in React components.
 * 
 * @returns Wrapped agent service
 * 
 * Requirements: 15.1, 15.2
 */
export function useAgentService() {
  return wrappedAgentService;
}
