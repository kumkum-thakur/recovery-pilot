/**
 * DebugMenu - Hidden debug menu for demo scenario configuration
 * 
 * Provides a floating UI to switch between demo scenarios:
 * - SCENARIO_HAPPY_PATH: All uploads = Green/Healthy, Insurance = Approved
 * - SCENARIO_RISK_DETECTED: Next upload = Red/Infected, triggers Doctor Triage
 * 
 * Toggle visibility with: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
 * 
 * Requirements: 15.1, 15.2
 */

import { useState, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { useConfigStore } from '../stores';
import { DemoScenario } from '../types';

/**
 * DebugMenu component
 * 
 * A floating debug panel that allows switching between demo scenarios.
 * Hidden by default, can be toggled with Ctrl+Shift+D keyboard shortcut.
 * 
 * Requirements: 15.1, 15.2
 */
export function DebugMenu() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { config, setDemoScenario, getCurrentScenario } = useConfigStore();
  const currentScenario = getCurrentScenario();

  /**
   * Keyboard shortcut handler
   * Ctrl+Shift+D (or Cmd+Shift+D on Mac) toggles visibility
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+D or Cmd+Shift+D
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsVisible(prev => !prev);
        console.log('[DebugMenu] Toggled visibility');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Handles scenario selection
   */
  const handleScenarioChange = (scenario: DemoScenario) => {
    setDemoScenario(scenario);
    console.log(`[DebugMenu] Scenario changed to: ${scenario}`);
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
          aria-label="Open debug menu"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Debug</span>
        </button>
      )}

      {/* Expanded panel */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 p-4 w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Debug Menu</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close debug menu"
            >
              ✕
            </button>
          </div>

          {/* Scenario selection */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Demo Scenario
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Controls AI behavior for deterministic demos
              </p>
            </div>

            {/* Happy Path option */}
            <button
              onClick={() => handleScenarioChange(DemoScenario.SCENARIO_HAPPY_PATH)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                currentScenario === DemoScenario.SCENARIO_HAPPY_PATH
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {currentScenario === DemoScenario.SCENARIO_HAPPY_PATH ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-slate-900 text-sm">
                  Happy Path
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  All uploads = Green/Healthy
                  <br />
                  Insurance = Approved
                </div>
              </div>
            </button>

            {/* Risk Detected option */}
            <button
              onClick={() => handleScenarioChange(DemoScenario.SCENARIO_RISK_DETECTED)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                currentScenario === DemoScenario.SCENARIO_RISK_DETECTED
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {currentScenario === DemoScenario.SCENARIO_RISK_DETECTED ? (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-slate-900 text-sm">
                  Risk Detected
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Next upload = Red/Infected
                  <br />
                  Triggers Doctor Triage
                </div>
              </div>
            </button>
          </div>

          {/* Current status */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Mock Delay:</span>
                <span className="font-medium text-slate-700">{config.mockDelayMs}ms</span>
              </div>
              <div className="mt-2 text-slate-400">
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Ctrl+Shift+D</kbd> to toggle
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
