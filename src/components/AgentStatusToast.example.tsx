/**
 * AgentStatusToast - Integration Example
 * 
 * This file demonstrates how to integrate the AgentStatusToast component
 * with the AgentStore in a real application.
 */

import { AgentStatusToast } from './AgentStatusToast';
import { useAgentStore } from '../stores/agentStore';

/**
 * Example 1: Basic Integration in Patient Dashboard
 * 
 * This is the most common usage pattern - simply connect the toast
 * to the AgentStore's currentWorkflow state.
 */
export function PatientDashboardWithToast() {
  const { currentWorkflow, clearWorkflow } = useAgentStore();
  
  return (
    <div className="min-h-screen bg-medical-bg">
      {/* Your dashboard content here */}
      <div className="container mx-auto p-4">
        <h1>Patient Dashboard</h1>
        {/* Mission cards, etc. */}
      </div>
      
      {/* Agent Status Toast - shows workflow progress */}
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null}
        onComplete={clearWorkflow}
      />
    </div>
  );
}

/**
 * Example 2: Integration with Photo Upload
 * 
 * Shows how the toast appears when a patient uploads a wound photo
 * and the triage workflow begins.
 */
export function PhotoUploadWithToast() {
  const { currentWorkflow, clearWorkflow, startTriageWorkflow } = useAgentStore();
  
  const handlePhotoUpload = async (file: File) => {
    try {
      // Start the triage workflow - this will populate currentWorkflow
      await startTriageWorkflow(file);
      
      // The toast will automatically show the workflow progress
      // and auto-dismiss when complete
      
      console.log('Triage workflow completed!');
    } catch (error) {
      console.error('Triage workflow failed:', error);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoUpload(file);
        }}
      />
      
      {/* Toast shows workflow steps as they execute */}
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null}
        onComplete={clearWorkflow}
      />
    </div>
  );
}

/**
 * Example 3: Integration with Medication Refill
 * 
 * Shows how the toast appears when a patient requests a medication refill
 * and the refill workflow begins.
 */
export function RefillRequestWithToast() {
  const { currentWorkflow, clearWorkflow, startRefillWorkflow } = useAgentStore();
  
  const handleRefillRequest = async (medicationName: string) => {
    try {
      // Start the refill workflow
      await startRefillWorkflow(medicationName);
      
      console.log('Refill workflow completed!');
    } catch (error) {
      console.error('Refill workflow failed:', error);
    }
  };
  
  return (
    <div>
      <button
        onClick={() => handleRefillRequest('Amoxicillin')}
        className="bg-medical-primary text-white px-4 py-2 rounded"
      >
        Request Refill
      </button>
      
      {/* Toast shows workflow steps */}
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null}
        onComplete={clearWorkflow}
      />
    </div>
  );
}

/**
 * Example 4: Custom onComplete Handler
 * 
 * Shows how to add custom logic when the workflow completes
 * and the toast auto-dismisses.
 */
export function CustomCompletionHandler() {
  const { currentWorkflow, clearWorkflow } = useAgentStore();
  
  const handleWorkflowComplete = () => {
    // Custom logic before clearing
    console.log('Workflow completed! Showing success message...');
    
    // You could show a success notification, update UI, etc.
    
    // Then clear the workflow
    clearWorkflow();
  };
  
  return (
    <div>
      {/* Your content */}
      
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null}
        onComplete={handleWorkflowComplete}
      />
    </div>
  );
}

/**
 * Example 5: Conditional Rendering
 * 
 * Shows how to only render the toast when needed to optimize performance.
 */
export function ConditionalToastRendering() {
  const { currentWorkflow, clearWorkflow } = useAgentStore();
  
  // Only render the toast component when there's actually a workflow
  return (
    <div>
      {/* Your content */}
      
      {currentWorkflow && (
        <AgentStatusToast
          steps={currentWorkflow}
          isVisible={true}
          onComplete={clearWorkflow}
        />
      )}
    </div>
  );
}

/**
 * Example 6: Multiple Workflows
 * 
 * If you need to handle multiple workflows (not typical for this app,
 * but shown for completeness), you could manage them separately.
 */
export function MultipleWorkflowsExample() {
  const { currentWorkflow, clearWorkflow } = useAgentStore();
  
  // In this app, only one workflow runs at a time (enforced by AgentStore)
  // But if you needed multiple, you could track them separately
  
  return (
    <div>
      {/* Your content */}
      
      {/* Primary workflow toast */}
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null}
        onComplete={clearWorkflow}
      />
    </div>
  );
}
