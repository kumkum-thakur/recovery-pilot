# AgentStatusToast Component

## Overview

The `AgentStatusToast` component displays the AI agent's workflow progress in a toast notification at the bottom of the screen. It shows each step of the workflow with visual indicators for the current status, creating transparency and trust by showing the user that the AI is "working" on their behalf.

## Requirements

**Validates Requirements:**
- 7.3: Display workflow steps visually in a status toast/card

## Features

- **Step Status Display**: Shows each workflow step with appropriate icons:
  - ✓ Completed (green checkmark)
  - ⟳ In Progress (spinning loader, amber)
  - ○ Pending (gray circle)
  - ✗ Failed (red X)

- **Animated Transitions**: 
  - Steps scale up when in progress
  - Smooth fade in/out animations
  - Pulsing indicator when agent is working

- **Auto-dismiss**: Automatically dismisses 1.5 seconds after all steps complete

- **Accessibility**: 
  - ARIA live region for screen readers
  - Semantic HTML structure
  - Proper role and aria attributes

## Usage

### Basic Usage

```tsx
import { AgentStatusToast } from './components/AgentStatusToast';
import { useAgentStore } from './stores/agentStore';

function MyComponent() {
  const { currentWorkflow, clearWorkflow } = useAgentStore();
  
  return (
    <AgentStatusToast
      steps={currentWorkflow || []}
      isVisible={currentWorkflow !== null}
      onComplete={clearWorkflow}
    />
  );
}
```

### Integration with AgentStore

The component is designed to work seamlessly with the `AgentStore`:

```tsx
import { useAgentStore } from './stores/agentStore';

function PatientDashboard() {
  const { currentWorkflow, clearWorkflow, startTriageWorkflow } = useAgentStore();
  
  const handlePhotoUpload = async (file: File) => {
    // Start the triage workflow
    await startTriageWorkflow(file);
  };
  
  return (
    <div>
      {/* Your dashboard content */}
      
      {/* Agent status toast */}
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null}
        onComplete={clearWorkflow}
      />
    </div>
  );
}
```

## Props

```typescript
interface AgentStatusToastProps {
  steps: AgentStep[];        // Array of workflow steps to display
  isVisible: boolean;        // Controls visibility of the toast
  onComplete: () => void;    // Called after auto-dismiss delay
}

interface AgentStep {
  id: string;                // Unique identifier for the step
  label: string;             // Display text for the step
  status: AgentStepStatus;   // Current status of the step
  duration?: number;         // Optional duration in milliseconds
}

type AgentStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
```

## Workflow Examples

### Triage Workflow

When a patient uploads a wound photo:

```typescript
const triageSteps: AgentStep[] = [
  { id: '1', label: 'Analyzing Image...', status: 'in_progress', duration: 1000 },
  { id: '2', label: 'Drafting Clinical Note...', status: 'pending', duration: 1000 },
  { id: '3', label: 'Creating Appointment Slot...', status: 'pending', duration: 1000 },
];
```

### Refill Workflow

When a patient requests a medication refill:

```typescript
const refillSteps: AgentStep[] = [
  { id: '1', label: 'Checking Pharmacy Inventory (Mock API)...', status: 'completed', duration: 1000 },
  { id: '2', label: 'Verifying Insurance Coverage...', status: 'in_progress', duration: 1000 },
  { id: '3', label: 'Order Placed.', status: 'pending', duration: 500 },
];
```

## Styling

The component uses Tailwind CSS with custom theme colors:

- **Medical Core Colors**: 
  - `medical-text`: Primary text color
  - `medical-primary`: Blue accent

- **Gamification Colors**:
  - `gamification-success`: Green for completed steps
  - `gamification-agent`: Amber for in-progress steps

## Behavior

1. **Visibility**: The toast appears when `isVisible` is true and animates in from the bottom
2. **Step Updates**: As steps progress, their icons and styling update automatically
3. **Completion**: When all steps are completed, shows "All done! ✨" message
4. **Auto-dismiss**: After 1.5 seconds of completion, calls `onComplete` callback
5. **Exit Animation**: Fades out and slides down when dismissed

## Accessibility

- Uses `role="status"` for screen reader announcements
- `aria-live="polite"` ensures updates are announced without interrupting
- `aria-atomic="true"` announces the entire toast content on updates
- Icons have `aria-hidden="true"` to avoid redundant announcements

## Testing

The component includes comprehensive unit tests covering:
- Visibility states
- Step rendering
- Status indicators
- Auto-dismiss behavior
- Accessibility attributes
- Animation states

Run tests with:
```bash
npm test -- AgentStatusToast.test.tsx
```

## Design Notes

The toast is positioned at the bottom center of the screen to:
- Avoid blocking important content
- Be visible but not intrusive
- Work well on both mobile and desktop
- Follow common toast notification patterns

The component emphasizes transparency by showing the AI's "thought process" to build trust with users, especially in medical contexts where understanding what's happening is crucial.
