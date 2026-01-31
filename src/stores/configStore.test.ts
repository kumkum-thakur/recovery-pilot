/**
 * ConfigStore Tests
 * 
 * Tests for demo scenario configuration store
 * 
 * Requirements: 15.1, 15.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useConfigStore } from './configStore';
import { DemoScenario } from '../types';
import { persistenceService } from '../services/persistenceService';

describe('ConfigStore', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Reset the store to default state
    const store = useConfigStore.getState();
    store.resetConfig();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have default configuration', () => {
      const store = useConfigStore.getState();
      
      expect(store.config.demoScenario).toBe(DemoScenario.SCENARIO_HAPPY_PATH);
      expect(store.config.mockDelayMs).toBe(1000);
    });
  });

  describe('setDemoScenario', () => {
    it('should update scenario to SCENARIO_RISK_DETECTED', () => {
      const store = useConfigStore.getState();
      
      // Set scenario
      store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Get fresh state after update
      const updatedStore = useConfigStore.getState();
      
      // Verify state updated
      expect(updatedStore.config.demoScenario).toBe(DemoScenario.SCENARIO_RISK_DETECTED);
    });

    it('should persist scenario to storage', () => {
      const store = useConfigStore.getState();
      
      // Set scenario
      store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Verify persisted
      const savedConfig = persistenceService.getConfig();
      expect(savedConfig?.demoScenario).toBe(DemoScenario.SCENARIO_RISK_DETECTED);
    });

    it('should update scenario to SCENARIO_HAPPY_PATH', () => {
      const store = useConfigStore.getState();
      
      // First set to risk detected
      store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Then set back to happy path
      store.setDemoScenario(DemoScenario.SCENARIO_HAPPY_PATH);
      
      // Verify state updated
      expect(store.config.demoScenario).toBe(DemoScenario.SCENARIO_HAPPY_PATH);
    });
  });

  describe('setMockDelay', () => {
    it('should update mock delay', () => {
      const store = useConfigStore.getState();
      
      // Set delay
      store.setMockDelay(500);
      
      // Verify state updated
      expect(store.config.mockDelayMs).toBe(500);
    });

    it('should persist mock delay to storage', () => {
      const store = useConfigStore.getState();
      
      // Set delay
      store.setMockDelay(2000);
      
      // Verify persisted
      const savedConfig = persistenceService.getConfig();
      expect(savedConfig?.mockDelayMs).toBe(2000);
    });

    it('should handle negative delay by using 0', () => {
      const store = useConfigStore.getState();
      
      // Set negative delay
      store.setMockDelay(-100);
      
      // Verify clamped to 0
      expect(store.config.mockDelayMs).toBe(0);
    });

    it('should handle zero delay', () => {
      const store = useConfigStore.getState();
      
      // Set zero delay
      store.setMockDelay(0);
      
      // Verify state updated
      expect(store.config.mockDelayMs).toBe(0);
    });
  });

  describe('loadConfig', () => {
    it('should load config from storage if exists', () => {
      // Save config to storage
      persistenceService.saveConfig({
        demoScenario: DemoScenario.SCENARIO_RISK_DETECTED,
        mockDelayMs: 500,
      });
      
      // Load config
      const store = useConfigStore.getState();
      store.loadConfig();
      
      // Verify loaded
      expect(store.config.demoScenario).toBe(DemoScenario.SCENARIO_RISK_DETECTED);
      expect(store.config.mockDelayMs).toBe(500);
    });

    it('should use default config if storage is empty', () => {
      // Ensure storage is empty
      localStorage.clear();
      
      // Load config
      const store = useConfigStore.getState();
      store.loadConfig();
      
      // Verify defaults
      expect(store.config.demoScenario).toBe(DemoScenario.SCENARIO_HAPPY_PATH);
      expect(store.config.mockDelayMs).toBe(1000);
    });

    it('should save default config to storage if none exists', () => {
      // Ensure storage is empty
      localStorage.clear();
      
      // Load config
      const store = useConfigStore.getState();
      store.loadConfig();
      
      // Verify saved to storage
      const savedConfig = persistenceService.getConfig();
      expect(savedConfig).toBeDefined();
      expect(savedConfig?.demoScenario).toBe(DemoScenario.SCENARIO_HAPPY_PATH);
    });
  });

  describe('resetConfig', () => {
    it('should reset to default configuration', () => {
      const store = useConfigStore.getState();
      
      // Change config
      store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
      store.setMockDelay(500);
      
      // Reset
      store.resetConfig();
      
      // Verify reset to defaults
      expect(store.config.demoScenario).toBe(DemoScenario.SCENARIO_HAPPY_PATH);
      expect(store.config.mockDelayMs).toBe(1000);
    });

    it('should persist reset config to storage', () => {
      const store = useConfigStore.getState();
      
      // Change config
      store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Reset
      store.resetConfig();
      
      // Verify persisted
      const savedConfig = persistenceService.getConfig();
      expect(savedConfig?.demoScenario).toBe(DemoScenario.SCENARIO_HAPPY_PATH);
    });
  });

  describe('Getters', () => {
    describe('getCurrentScenario', () => {
      it('should return current scenario', () => {
        const store = useConfigStore.getState();
        
        // Default scenario
        expect(store.getCurrentScenario()).toBe(DemoScenario.SCENARIO_HAPPY_PATH);
        
        // Change scenario
        store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
        expect(store.getCurrentScenario()).toBe(DemoScenario.SCENARIO_RISK_DETECTED);
      });
    });

    describe('isHappyPath', () => {
      it('should return true for SCENARIO_HAPPY_PATH', () => {
        const store = useConfigStore.getState();
        
        store.setDemoScenario(DemoScenario.SCENARIO_HAPPY_PATH);
        expect(store.isHappyPath()).toBe(true);
      });

      it('should return false for SCENARIO_RISK_DETECTED', () => {
        const store = useConfigStore.getState();
        
        store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
        expect(store.isHappyPath()).toBe(false);
      });
    });

    describe('isRiskDetected', () => {
      it('should return true for SCENARIO_RISK_DETECTED', () => {
        const store = useConfigStore.getState();
        
        store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
        expect(store.isRiskDetected()).toBe(true);
      });

      it('should return false for SCENARIO_HAPPY_PATH', () => {
        const store = useConfigStore.getState();
        
        store.setDemoScenario(DemoScenario.SCENARIO_HAPPY_PATH);
        expect(store.isRiskDetected()).toBe(false);
      });
    });
  });

  describe('Persistence Integration', () => {
    it('should maintain scenario across store resets', () => {
      // Set scenario
      let store = useConfigStore.getState();
      store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Simulate app restart by loading config
      store.loadConfig();
      
      // Verify scenario persisted
      expect(store.config.demoScenario).toBe(DemoScenario.SCENARIO_RISK_DETECTED);
    });

    it('should maintain mock delay across store resets', () => {
      // Set delay
      let store = useConfigStore.getState();
      store.setMockDelay(2500);
      
      // Simulate app restart by loading config
      store.loadConfig();
      
      // Verify delay persisted
      expect(store.config.mockDelayMs).toBe(2500);
    });
  });

  describe('Scenario Determinism', () => {
    it('should consistently return same scenario until changed', () => {
      const store = useConfigStore.getState();
      
      // Set scenario
      store.setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);
      
      // Get scenario multiple times
      const scenario1 = store.getCurrentScenario();
      const scenario2 = store.getCurrentScenario();
      const scenario3 = store.getCurrentScenario();
      
      // Verify consistency
      expect(scenario1).toBe(DemoScenario.SCENARIO_RISK_DETECTED);
      expect(scenario2).toBe(DemoScenario.SCENARIO_RISK_DETECTED);
      expect(scenario3).toBe(DemoScenario.SCENARIO_RISK_DETECTED);
    });
  });
});
