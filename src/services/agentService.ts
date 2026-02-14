/**
 * Agent Service
 *
 * AI-driven workflows using real Gemini Vision API for wound analysis
 * and mock responses for refill requests.
 * This service provides the "agentic" experience where the system works
 * on behalf of the patient (analyzing images, checking insurance, etc.).
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 15.1, 15.2
 */

import { geminiService } from './geminiService';

import type {
  AgentService,
  AgentStep,
  AgentStepStatus,
  TriageResult,
  RefillResult,
  TriageAnalysis,
  InsuranceStatus,
  InventoryStatus,
  ActionItemModel,
} from '../types';
import { DemoScenario } from '../types';

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
 * Generates a unique ID for action items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Converts a File object to a data URL for storage
 * 
 * @param file - File to convert
 * @returns Promise resolving to data URL string
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a triage action item for doctor review
 * 
 * Requirements: 6.4, 8.1, 12.2
 * 
 * @param triageData - Triage analysis data
 * @returns Action item ID
 */
async function createTriageActionItem(triageData: {
  imageUrl: string;
  analysis: TriageAnalysis;
  analysisText: string;
  confidenceScore: number;
  patientId: string;
}): Promise<string> {
  // Import services dynamically to avoid circular dependencies
  const { persistenceService } = await import('./persistenceService');
  const { ActionItemType, ActionItemStatus } = await import('../types');

  // Get patient info
  const patient = persistenceService.getUser(triageData.patientId);
  if (!patient) {
    throw new Error(`Patient with ID "${triageData.patientId}" not found`);
  }
  const patientName = patient.name;

  // Find the doctor assigned to this patient
  const relationships = persistenceService.get<any[]>('recovery_pilot_relationships') || [];
  const activeRelationship = relationships.find(
    (r: any) => r.patientId === triageData.patientId && r.active
  );

  // Create action item model
  const actionItemId = generateId();
  const now = new Date().toISOString();

  const actionItem: ActionItemModel = {
    id: actionItemId,
    patientId: triageData.patientId,
    patientName,
    type: ActionItemType.TRIAGE,
    status: ActionItemStatus.PENDING_DOCTOR,
    createdAt: now,
    updatedAt: now,
    imageUrl: triageData.imageUrl,
    triageAnalysis: triageData.analysis,
    triageText: triageData.analysisText,
    aiConfidenceScore: triageData.confidenceScore,
    // Assign to doctor if relationship exists
    doctorId: activeRelationship?.doctorId,
  };

  // Save to persistence
  persistenceService.saveActionItem(actionItem);

  return actionItemId;
}

/**
 * Creates a refill action item for doctor review
 * 
 * Requirements: 7.2, 8.1, 12.2
 * 
 * @param refillData - Refill request data
 * @returns Action item ID
 */
async function createRefillActionItem(refillData: {
  medicationName: string;
  insuranceStatus: InsuranceStatus;
  inventoryStatus: InventoryStatus;
  patientId?: string;
  patientName?: string;
}): Promise<string> {
  // Import persistence service dynamically to avoid circular dependencies
  const { persistenceService } = await import('./persistenceService');
  const { ActionItemType, ActionItemStatus } = await import('../types');

  // Use provided patient info, falling back to defaults for backward compatibility
  const patientId = refillData.patientId || 'patient-1';
  const patientName = refillData.patientName || 'Unknown Patient';
  
  // Create action item model
  const actionItemId = generateId();
  const now = new Date().toISOString();
  
  const actionItem: ActionItemModel = {
    id: actionItemId,
    patientId,
    patientName,
    type: ActionItemType.REFILL,
    status: ActionItemStatus.PENDING_DOCTOR,
    createdAt: now,
    updatedAt: now,
    medicationName: refillData.medicationName,
    insuranceStatus: refillData.insuranceStatus,
    inventoryStatus: refillData.inventoryStatus,
  };
  
  // Save to persistence
  persistenceService.saveActionItem(actionItem);
  
  return actionItemId;
}

// ============================================================================
// Agent Service Implementation
// ============================================================================

/**
 * Creates the agent service instance
 *
 * This service uses real Gemini Vision AI for wound image triage
 * and mock workflows for medication refill requests.
 *
 * Requirements: 6.1, 7.1, 7.2
 */
export function createAgentService(): AgentService {
  return {
    simulateWorkflowSteps,
    
    /**
     * Analyzes a wound image using real Gemini Vision API and returns triage results.
     *
     * Runs the AI analysis in parallel with the visual workflow steps so the
     * user sees the animated progress while the real API call completes.
     *
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1
     *
     * @param imageFile - The wound image to analyze
     * @param scenario - Demo scenario (kept for interface compatibility)
     * @param patientId - The ID of the patient uploading the image
     * @returns Triage result with real AI analysis and confidence score
     */
    async analyzeWoundImage(
      imageFile: File,
      scenario: DemoScenario,
      patientId?: string
    ): Promise<TriageResult> {
      // Define the multi-step workflow for triage analysis
      // Requirements: 7.1 - Three steps with 1s delays each
      const steps: AgentStep[] = [
        {
          id: '1',
          label: 'Analyzing Image...',
          status: 'pending' as AgentStepStatus,
          duration: 1000
        },
        {
          id: '2',
          label: 'Drafting Clinical Note...',
          status: 'pending' as AgentStepStatus,
          duration: 1000
        },
        {
          id: '3',
          label: 'Creating Appointment Slot...',
          status: 'pending' as AgentStepStatus,
          duration: 1000
        }
      ];

      // Demo scenario override: force RED result for demo purposes
      if (scenario === DemoScenario.SCENARIO_RISK_DETECTED) {
        // Run visual workflow steps for demo effect
        for await (const step of simulateWorkflowSteps(steps)) {
          void step;
        }

        const imageUrl = await fileToDataUrl(imageFile);
        const actionItemId = await createTriageActionItem({
          imageUrl,
          analysis: 'red' as TriageAnalysis,
          analysisText: 'Risk signs detected: Possible infection indicators observed including erythema and localized swelling around the incision site. Recommend in-person evaluation within 24 hours.',
          confidenceScore: 0.87,
          patientId: patientId || 'patient-1',
        });

        return {
          analysis: 'red' as TriageAnalysis,
          analysisText: 'Risk signs detected: Possible infection indicators observed including erythema and localized swelling around the incision site. Recommend in-person evaluation within 24 hours.',
          confidenceScore: 0.87,
          actionItemId,
        };
      }

      // Run real Gemini AI analysis in PARALLEL with visual workflow steps
      // The user sees the animated progress while the API call completes
      const [geminiResult] = await Promise.all([
        geminiService.analyzeWoundImage(imageFile),
        (async () => {
          for await (const step of simulateWorkflowSteps(steps)) {
            // Steps are yielded as they progress
            // The AgentStore will handle displaying these to the user
            void step;
          }
        })()
      ]);

      // Use real AI result to determine triage outcome
      const imageUrl = await fileToDataUrl(imageFile);

      if (geminiResult.analysis === 'red') {
        // RED RESULT: Risk detected, create action item for doctor review
        // Requirements: 6.2, 6.4, 6.5
        const actionItemId = await createTriageActionItem({
          imageUrl,
          analysis: 'red' as TriageAnalysis,
          analysisText: geminiResult.clinicalNote,
          confidenceScore: geminiResult.confidenceScore,
          patientId: patientId || 'patient-1', // Fallback to default patient for backward compatibility
        });

        // Return Red result with action item
        // Requirements: 6.3, 6.4
        return {
          analysis: 'red' as TriageAnalysis,
          analysisText: geminiResult.analysisText,
          confidenceScore: geminiResult.confidenceScore,
          actionItemId,
        };
      }

      // GREEN RESULT: Healing well, no action item needed
      // Requirements: 6.2, 6.3, 6.5
      return {
        analysis: 'green' as TriageAnalysis,
        analysisText: geminiResult.analysisText,
        confidenceScore: geminiResult.confidenceScore,
      };
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
      _scenario: DemoScenario
    ): Promise<RefillResult> {
      // Define the multi-step workflow for refill processing
      // Requirements: 7.2 - Three steps: Inventory check, Insurance verification, Order placement
      const steps: AgentStep[] = [
        { 
          id: '1', 
          label: 'Checking Pharmacy Inventory (Mock API)...', 
          status: 'pending' as AgentStepStatus, 
          duration: 1000 
        },
        { 
          id: '2', 
          label: 'Verifying Insurance Coverage...', 
          status: 'pending' as AgentStepStatus, 
          duration: 1000 
        },
        { 
          id: '3', 
          label: 'Order Placed.', 
          status: 'pending' as AgentStepStatus, 
          duration: 500 
        }
      ];
      
      // Execute workflow steps with delays
      // This simulates the AI "working" on behalf of the patient
      // Note: The actual step updates are handled by the AgentStore
      // which calls simulateWorkflowSteps and updates UI in real-time
      for await (const _step of simulateWorkflowSteps(steps)) {
        // Steps are yielded as they progress
        // The AgentStore will handle displaying these to the user
      }
      
      // Determine result based on demo scenario
      // Requirements: 15.2 - Scenario-based deterministic behavior
      // For refills, both scenarios result in approval (happy path)
      // In a real system, SCENARIO_RISK_DETECTED might deny insurance
      // MOCK RESPONSE: Insurance status is simulated for demo purposes.
      // The actual refill still requires doctor approval via the action item system.
      // The action item created below has status PENDING_DOCTOR.
      const insuranceStatus = 'approved' as InsuranceStatus;
      const inventoryStatus = 'in_stock' as InventoryStatus;
      
      // Create action item for doctor review
      // Requirements: 7.2, 8.1, 8.3
      const actionItemId = await createRefillActionItem({
        medicationName,
        insuranceStatus,
        inventoryStatus,
      });
      
      // Return refill result
      return {
        insuranceStatus,
        inventoryStatus,
        actionItemId,
      };
    },
  };
}

// Export singleton instance
export const agentService = createAgentService();
