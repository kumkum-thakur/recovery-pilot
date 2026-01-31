/**
 * ConfigStore - Zustand store for demo scenario configuration
 * 
 * Manages:
 * - Current demo scenario (SCENARIO_HAPPY_PATH or SCENARIO_RISK_DETECTED)
 * - Mock delay configuration
 * - Persistence of configuration settings
 * 
 * Requirements: 15.1, 15.2
 */

import { create } from 'zustand';
import type { ConfigModel, DemoScenario } from '../types';
import { DemoScenario as DemoScenarioEnum } from '../types';
import { persistenceService } from '../services/persistenceService';

/**
 * Default configuration for demo scenarios
 * 
 * Requirements: 15.1
 */
const DEFAULT_CONFIG: ConfigModel = {
  demoScenario: DemoScenarioEnum.SCENARIO_HAPPY_PATH,
  mockDelayMs: 1000,
};

/**
 * ConfigStore interface
 * 
 * Requirements: 15.1, 15.2
 */
export interface ConfigStore {
  // State
  config: ConfigModel;
  
  // Actions
  setDemoScenario: (scenario: DemoScenario) => void;
  setMockDelay: (delayMs: number) => void;
  loadConfig: () => void;
  resetConfig: () => void;
  
  // Getters
  getCurrentScenario: () => DemoScenario;
  isHappyPath: () => boolean;
  isRiskDetected: () => boolean;
}

/**
 * ConfigStore implementation using Zustand
 * 
 * Provides state management for demo scenario configuration.
 * Configuration is persisted to LocalStorage for consistency across sessions.
 * 
 * Requirements: 15.1, 15.2
 */
export const useConfigStore = create<ConfigStore>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================
  
  /**
   * Current configuration
   * Defaults to SCENARIO_HAPPY_PATH
   * 
   * Requirements: 15.1
   */
  config: DEFAULT_CONFIG,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Sets the demo scenario
   * 
   * This determines the behavior of the mock AI service:
   * - SCENARIO_HAPPY_PATH: All uploads = Green/Healthy, Insurance = Approved
   * - SCENARIO_RISK_DETECTED: Next upload = Red/Infected, triggers Doctor Triage
   * 
   * @param scenario - Demo scenario to set
   * 
   * Requirements: 15.1, 15.2
   */
  setDemoScenario: (scenario: DemoScenario) => {
    // Update state using functional update to ensure we get latest state
    set((state) => {
      const updatedConfig: ConfigModel = {
        ...state.config,
        demoScenario: scenario,
      };
      
      // Persist to storage
      persistenceService.saveConfig(updatedConfig);
      
      console.log(`[ConfigStore] Demo scenario set to: ${scenario}`);
      
      return { config: updatedConfig };
    });
  },

  /**
   * Sets the mock delay in milliseconds
   * 
   * This controls how long each workflow step takes to complete.
   * Useful for speeding up or slowing down demos.
   * 
   * @param delayMs - Delay in milliseconds (default: 1000)
   * 
   * Requirements: 15.1
   */
  setMockDelay: (delayMs: number) => {
    const { config } = get();
    
    // Validate delay
    if (delayMs < 0) {
      console.warn('[ConfigStore] Mock delay cannot be negative, using 0');
      delayMs = 0;
    }
    
    // Update config
    const updatedConfig: ConfigModel = {
      ...config,
      mockDelayMs: delayMs,
    };
    
    // Persist to storage
    persistenceService.saveConfig(updatedConfig);
    
    // Update state
    set({ config: updatedConfig });
    
    console.log(`[ConfigStore] Mock delay set to: ${delayMs}ms`);
  },

  /**
   * Loads configuration from persistence
   * 
   * If no configuration exists, uses default configuration.
   * This should be called on app initialization.
   * 
   * Requirements: 15.1, 15.2
   */
  loadConfig: () => {
    try {
      // Load from persistence
      const savedConfig = persistenceService.getConfig();
      
      if (savedConfig) {
        // Use saved config
        set({ config: savedConfig });
        console.log('[ConfigStore] Loaded config from storage:', savedConfig);
      } else {
        // Use default config and save it
        persistenceService.saveConfig(DEFAULT_CONFIG);
        set({ config: DEFAULT_CONFIG });
        console.log('[ConfigStore] Initialized with default config:', DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('[ConfigStore] Failed to load config, using defaults:', error);
      set({ config: DEFAULT_CONFIG });
    }
  },

  /**
   * Resets configuration to defaults
   * 
   * Requirements: 15.1
   */
  resetConfig: () => {
    // Save default config
    persistenceService.saveConfig(DEFAULT_CONFIG);
    
    // Update state
    set({ config: DEFAULT_CONFIG });
    
    console.log('[ConfigStore] Config reset to defaults');
  },

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Gets the current demo scenario
   * 
   * @returns Current demo scenario
   * 
   * Requirements: 15.1, 15.2
   */
  getCurrentScenario: () => {
    const { config } = get();
    return config.demoScenario;
  },

  /**
   * Checks if current scenario is SCENARIO_HAPPY_PATH
   * 
   * @returns true if happy path scenario is active
   * 
   * Requirements: 15.1
   */
  isHappyPath: () => {
    const { config } = get();
    return config.demoScenario === DemoScenarioEnum.SCENARIO_HAPPY_PATH;
  },

  /**
   * Checks if current scenario is SCENARIO_RISK_DETECTED
   * 
   * @returns true if risk detected scenario is active
   * 
   * Requirements: 15.1
   */
  isRiskDetected: () => {
    const { config } = get();
    return config.demoScenario === DemoScenarioEnum.SCENARIO_RISK_DETECTED;
  },
}));
