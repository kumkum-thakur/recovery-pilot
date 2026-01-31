/**
 * TriageResultCard Examples
 * 
 * This file demonstrates various usage scenarios for the TriageResultCard component.
 * These examples can be used for:
 * - Visual testing and design review
 * - Integration guidance for developers
 * - Storybook-style component showcase
 */

import { TriageResultCard } from './TriageResultCard';
import type { TriageAnalysis } from '../types';

/**
 * Example 1: Green Result - High Confidence
 * 
 * Typical successful triage result showing healthy healing.
 * This is the most common scenario in the happy path.
 */
export function GreenResultHighConfidence() {
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Green Result - High Confidence</h2>
      <TriageResultCard
        analysis={'green' as TriageAnalysis}
        analysisText="Healing well. Keep it dry."
        confidenceScore={0.92}
      />
    </div>
  );
}

/**
 * Example 2: Green Result - Lower Confidence
 * 
 * Still a positive result, but with lower AI confidence.
 * The system is less certain but still categorizes as healthy.
 */
export function GreenResultLowerConfidence() {
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Green Result - Lower Confidence</h2>
      <TriageResultCard
        analysis={'green' as TriageAnalysis}
        analysisText="Incision appears to be healing normally. Continue monitoring."
        confidenceScore={0.73}
      />
    </div>
  );
}

/**
 * Example 3: Red Result - Infection Risk
 * 
 * Risk detected scenario that triggers doctor review.
 * This is the SCENARIO_RISK_DETECTED demo mode result.
 */
export function RedResultInfectionRisk() {
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Red Result - Infection Risk</h2>
      <TriageResultCard
        analysis={'red' as TriageAnalysis}
        analysisText="Redness detected around incision site. Possible infection. I have auto-drafted a message to Dr. Smith."
        confidenceScore={0.87}
        actionItemId="action-1234567890-abc"
      />
    </div>
  );
}

/**
 * Example 4: Red Result - High Confidence
 * 
 * Clear risk detected with high AI confidence.
 * Requires immediate doctor attention.
 */
export function RedResultHighConfidence() {
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Red Result - High Confidence</h2>
      <TriageResultCard
        analysis={'red' as TriageAnalysis}
        analysisText="Significant swelling and discoloration detected. Immediate review recommended."
        confidenceScore={0.94}
        actionItemId="action-urgent-9876543210"
      />
    </div>
  );
}

/**
 * Example 5: Red Result - Without Action Item (Edge Case)
 * 
 * This shouldn't happen in normal operation, but the component
 * handles it gracefully with a fallback message.
 */
export function RedResultNoActionItem() {
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Red Result - No Action Item (Edge Case)</h2>
      <TriageResultCard
        analysis={'red' as TriageAnalysis}
        analysisText="Potential issue detected."
        confidenceScore={0.81}
      />
    </div>
  );
}

/**
 * Example 6: Mobile View Comparison
 * 
 * Shows how both result types look on mobile devices.
 * The component is mobile-first and responsive.
 */
export function MobileViewComparison() {
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Mobile View (max-w-md)</h2>
      <div className="max-w-md space-y-4">
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well. Keep it dry."
          confidenceScore={0.92}
        />
        <TriageResultCard
          analysis={'red' as TriageAnalysis}
          analysisText="Redness detected. I have auto-drafted a message to Dr. Smith."
          confidenceScore={0.87}
          actionItemId="action-mobile-123"
        />
      </div>
    </div>
  );
}

/**
 * Example 7: Integration with Agent Workflow
 * 
 * Shows how the component appears after the agent workflow completes.
 * This demonstrates the full user experience flow.
 */
export function IntegrationExample() {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Photo Analysis Complete</h2>
        <p className="text-gray-600 mb-6">
          Your wound photo has been analyzed by our AI system.
        </p>
        
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well. Keep it dry."
          confidenceScore={0.92}
        />
        
        <div className="mt-6 flex gap-4">
          <button className="flex-1 bg-medical-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Continue
          </button>
          <button className="flex-1 bg-white text-medical-primary py-3 px-6 rounded-lg font-semibold border-2 border-medical-primary hover:bg-blue-50 transition-colors">
            View History
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 8: All Scenarios Side-by-Side
 * 
 * Useful for design review and visual regression testing.
 */
export function AllScenarios() {
  return (
    <div className="p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">TriageResultCard - All Scenarios</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Green - High Confidence</h3>
          <TriageResultCard
            analysis={'green' as TriageAnalysis}
            analysisText="Healing well. Keep it dry."
            confidenceScore={0.92}
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Green - Lower Confidence</h3>
          <TriageResultCard
            analysis={'green' as TriageAnalysis}
            analysisText="Incision appears to be healing normally."
            confidenceScore={0.73}
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Red - With Action Item</h3>
          <TriageResultCard
            analysis={'red' as TriageAnalysis}
            analysisText="Redness detected. I have auto-drafted a message to Dr. Smith."
            confidenceScore={0.87}
            actionItemId="action-123-456-789"
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Red - High Confidence</h3>
          <TriageResultCard
            analysis={'red' as TriageAnalysis}
            analysisText="Significant swelling detected. Immediate review recommended."
            confidenceScore={0.94}
            actionItemId="action-urgent-999"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Default export for easy importing
 */
export default {
  GreenResultHighConfidence,
  GreenResultLowerConfidence,
  RedResultInfectionRisk,
  RedResultHighConfidence,
  RedResultNoActionItem,
  MobileViewComparison,
  IntegrationExample,
  AllScenarios,
};
