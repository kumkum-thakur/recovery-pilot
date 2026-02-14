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
import { Settings, Check, RotateCcw, Key } from 'lucide-react';
import { useConfigStore, useMissionStore, useUserStore } from '../stores';
import { DemoScenario, UserRole } from '../types';
import { resetAdminPassword, clearAllDataAndReinitialize } from '../utils/resetAdminPassword';

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
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [passwordResetMessage, setPasswordResetMessage] = useState<string | null>(null);
  
  const { config, setDemoScenario, getCurrentScenario } = useConfigStore();
  const { missions, fetchMissions } = useMissionStore();
  const { currentUser } = useUserStore();
  const currentScenario = getCurrentScenario();

  /**
   * Keyboard shortcut handler
   * Ctrl+Shift+D (or Cmd+Shift+D on Mac) toggles visibility
   */
  useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return;
    }

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
  }, [currentUser]);

  // Only allow admin users to access the debug menu
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return null;
  }

  console.log('🐛 [DebugMenu] Current scenario:', currentScenario);

  /**
   * Handles scenario selection
   */
  const handleScenarioChange = (scenario: DemoScenario) => {
    setDemoScenario(scenario);
    console.log(`🐛 [DebugMenu] Scenario changed to: ${scenario}`);
  };

  /**
   * Handles admin password reset
   */
  const handleResetAdminPassword = () => {
    console.log('🔑 [DebugMenu] Resetting admin password...');
    setPasswordResetMessage(null);
    
    try {
      const success = resetAdminPassword();
      
      if (success) {
        setPasswordResetMessage('✅ Admin password reset to: admin');
      } else {
        setPasswordResetMessage('❌ Failed to reset password');
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setPasswordResetMessage(null), 5000);
    } catch (error) {
      console.error('❌ [DebugMenu] Error resetting password:', error);
      setPasswordResetMessage('❌ Error resetting password');
      setTimeout(() => setPasswordResetMessage(null), 5000);
    }
  };

  /**
   * Handles full data reset
   */
  const handleClearAllData = () => {
    if (confirm('This will clear ALL data and log you out. Continue?')) {
      clearAllDataAndReinitialize();
      // Reload page after a short delay
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  /**
   * Handles mission reset - resets missions to pending state
   */
  const handleResetMissions = async () => {
    console.log('🔄 [DebugMenu] Resetting missions...');
    setResetMessage(null);
    
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Get all missions for the current user
      const allMissions = missions;
      
      // Reset each mission to pending state and clear completion date
      for (const mission of allMissions) {
        const missionModel = await import('../services/persistenceService').then(m => 
          m.persistenceService.getMission(mission.id)
        );
        
        if (missionModel) {
          const resetModel = {
            ...missionModel,
            status: 'pending' as const,
            completedAt: undefined,
          };
          
          await import('../services/persistenceService').then(m => 
            m.persistenceService.saveMission(resetModel)
          );
        }
      }

      // Refetch missions to update UI
      await fetchMissions(currentUser.id);
      
      setResetMessage('✅ Missions reset successfully!');
      console.log('✅ [DebugMenu] Missions reset to pending state');
      
      // Clear message after 3 seconds
      setTimeout(() => setResetMessage(null), 3000);
    } catch (error) {
      console.error('❌ [DebugMenu] Error resetting missions:', error);
      setResetMessage('❌ Failed to reset missions');
      setTimeout(() => setResetMessage(null), 3000);
    }
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

          {/* Mission Reset */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mission Reset
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Reset missions to test photo upload again
            </p>
            <button
              onClick={handleResetMissions}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Missions
            </button>
            {resetMessage && (
              <p className="mt-2 text-xs text-center text-slate-600">
                {resetMessage}
              </p>
            )}
          </div>

          {/* Admin Password Reset */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Admin Password Reset
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Reset admin password to: admin
            </p>
            <button
              onClick={handleResetAdminPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              <Key className="w-4 h-4" />
              Reset Admin Password
            </button>
            {passwordResetMessage && (
              <p className="mt-2 text-xs text-center text-slate-600">
                {passwordResetMessage}
              </p>
            )}
          </div>

          {/* Clear All Data */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Clear All Data
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Reset everything to defaults (requires page reload)
            </p>
            <button
              onClick={handleClearAllData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All Data
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
