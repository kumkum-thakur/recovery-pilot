# Agent Service

The Agent Service simulates AI-driven workflows with configurable delays and scenario-based responses. This service provides the "agentic" experience where the system appears to be working on behalf of the patient.

## Overview

The Agent Service is responsible for:
- Simulating multi-step AI workflows with realistic delays
- Processing wound image triage analysis
- Handling medication refill requests
- Providing visual feedback through workflow step progression

## Core Function: simulateWorkflowSteps

The `simulateWorkflowSteps` function is an async generator that simulates workflow steps with configurable delays.

### Signature

```typescript
async function* simulateWorkflowSteps(
  steps: AgentStep[]
): AsyncGenerator<AgentStep>
```

### Behavior

For each step in the input array:
1. Yields the step with status `in_progress`
2. Waits for the configured duration (default: 1000ms)
3. Yields the step with status `completed`

### Example Usage

```typescript
import { simulateWorkflowSteps } from './services';

const steps = [
  { id: '1', label: 'Analyzing Image...', status: 'pending', duration: 1000 },
  { id: '2', label: 'Drafting Clinical Note...', status: 'pending', duration: 1000 },
  { id: '3', label: 'Creating Appointment Slot...', status: 'pending', duration: 1000 }
];

// Use in a component or store
for await (const step of simulateWorkflowSteps(steps)) {
  console.log(`Step ${step.id}: ${step.status}`);
  // Update UI with step progress
  agentStore.updateStep(step);
}
```

## Workflow Types

### Triage Workflow

Used when analyzing wound photos:

```typescript
const triageSteps = [
  { id: '1', label: 'Analyzing Image...', status: 'pending', duration: 1000 },
  { id: '2', label: 'Drafting Clinical Note...', status: 'pending', duration: 1000 },
  { id: '3', label: 'Creating Appointment Slot...', status: 'pending', duration: 1000 }
];
```

**Requirements:** 7.1

### Refill Workflow

Used when processing medication refill requests:

```typescript
const refillSteps = [
  { id: '1', label: 'Checking Pharmacy Inventory (Mock API)...', status: 'pending', duration: 1000 },
  { id: '2', label: 'Verifying Insurance Coverage...', status: 'pending', duration: 1000 },
  { id: '3', label: 'Order Placed.', status: 'pending', duration: 500 }
];
```

**Requirements:** 7.2

## Integration with Stores

The workflow step simulator is designed to integrate with the AgentStore:

```typescript
// In AgentStore
async startTriageWorkflow(imageFile: File) {
  const steps = createTriageSteps();
  
  for await (const step of simulateWorkflowSteps(steps)) {
    // Update store state to trigger UI updates
    set({ currentWorkflow: updateStepInWorkflow(step) });
  }
  
  // Process the actual triage analysis
  const result = await agentService.analyzeWoundImage(imageFile, scenario);
  // Handle result...
}
```

## Properties and Guarantees

The workflow step simulator guarantees:

1. **Ordered Execution**: Steps are processed sequentially in the order provided
2. **State Transitions**: Each step transitions from `in_progress` → `completed`
3. **Immutability**: Original step objects are never mutated
4. **Yield Count**: Each step yields exactly 2 results (in_progress, completed)
5. **Label Preservation**: Step IDs and labels are preserved throughout

These properties are verified by comprehensive property-based tests using fast-check.

## Testing

The agent service has two test suites:

### Unit Tests (`agentService.test.ts`)
- Tests specific scenarios and edge cases
- Tests real-world workflow examples
- Tests timing behavior with fake timers

### Property Tests (`agentService.property.test.ts`)
- Verifies universal properties across random inputs
- Runs 100 iterations per property
- Tests invariants like ordering, state transitions, and immutability

Run tests with:
```bash
npm test -- agentService
```

## Future Implementation

Tasks 7.2 and 7.3 will implement:
- `analyzeWoundImage()` - Full triage workflow with AI analysis
- `processRefillRequest()` - Full refill workflow with insurance/inventory checks
- Demo scenario configuration for deterministic testing

## Requirements Traceability

- **Requirement 7.1**: Red triage workflow execution with multi-step simulation
- **Requirement 7.2**: Refill workflow execution with pharmacy and insurance checks
- **Requirement 7.3**: Visual display of agent workflow steps

## Related Files

- `src/types/index.ts` - Type definitions for AgentStep, AgentService, etc.
- `src/stores/agentStore.ts` - State management for agent workflows
- `src/components/AgentStatusToast.tsx` - UI component for displaying workflow steps
