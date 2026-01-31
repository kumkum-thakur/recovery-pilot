# Demo Scenario Configuration Guide

## Overview

The RecoveryPilot application includes a demo scenario configuration system that allows presenters to control the behavior of the mock AI service for deterministic demonstrations. This ensures reliable, predictable results during demos and presentations.

**Requirements:** 15.1, 15.2

## Features

### Two Demo Scenarios

1. **SCENARIO_HAPPY_PATH** (Default)
   - All wound photo uploads return **Green/Healthy** results
   - Insurance verification returns **Approved**
   - Pharmacy inventory shows **In Stock**
   - No action items created for doctor review (except refills)
   - Perfect for demonstrating the happy path user experience

2. **SCENARIO_RISK_DETECTED**
   - Next wound photo upload returns **Red/Infected** result
   - Triggers automatic doctor triage workflow
   - Creates action item for doctor review
   - Shows the full AI-driven escalation process
   - Perfect for demonstrating risk detection and doctor workflow

### Configuration Persistence

- Scenario selection is persisted to LocalStorage
- Configuration survives page refreshes and browser restarts
- Ensures consistent behavior throughout a demo session

## How to Use

### Accessing the Debug Menu

The debug menu is hidden by default and can be toggled using a keyboard shortcut:

**Keyboard Shortcut:** `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)

### Using the Debug Menu

1. **Open the Debug Menu**
   - Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
   - A floating "Debug" button will appear in the bottom-right corner

2. **Expand the Panel**
   - Click the "Debug" button to expand the configuration panel

3. **Select a Scenario**
   - Click on either "Happy Path" or "Risk Detected"
   - The selected scenario will be highlighted with a checkmark
   - Configuration is saved automatically

4. **Close the Menu**
   - Click the "✕" button to collapse the panel
   - Press `Ctrl+Shift+D` again to hide the debug menu completely

### Demo Workflow Examples

#### Demonstrating Happy Path

1. Open debug menu (`Ctrl+Shift+D`)
2. Select "Happy Path" scenario
3. Close debug menu
4. Log in as patient (username: `divya`, password: `divya`)
5. Upload wound photo
6. Observe green "Healing well" result
7. No doctor action items created

#### Demonstrating Risk Detection

1. Open debug menu (`Ctrl+Shift+D`)
2. Select "Risk Detected" scenario
3. Close debug menu
4. Log in as patient (username: `divya`, password: `divya`)
5. Upload wound photo
6. Observe:
   - Agent workflow steps (Analyzing, Drafting Note, Creating Appointment)
   - Red "Risk detected" result
   - Notification that doctor has been notified
7. Log out and log in as doctor (username: `dr.smith`, password: `smith`)
8. View the triage action item in the doctor dashboard
9. Approve or reject the action item

## Technical Implementation

### Architecture

```
┌─────────────────┐
│   DebugMenu     │ ← User toggles scenario
│   Component     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ConfigStore   │ ← Manages scenario state
│   (Zustand)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PersistenceService │ ← Saves to LocalStorage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AgentServiceWrapper │ ← Injects scenario
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AgentService   │ ← Returns scenario-based results
└─────────────────┘
```

### Key Files

- **`src/stores/configStore.ts`** - Zustand store for configuration management
- **`src/components/DebugMenu.tsx`** - UI component for scenario selection
- **`src/services/agentServiceWrapper.ts`** - Wrapper that injects current scenario
- **`src/services/agentService.ts`** - Mock AI service with scenario support
- **`src/types/index.ts`** - Type definitions for ConfigModel and DemoScenario

### Using in Code

#### Option 1: Use the Wrapped Service (Recommended)

```typescript
import { wrappedAgentService } from '../services/agentServiceWrapper';

// Automatically uses the current scenario from config store
const result = await wrappedAgentService.analyzeWoundImage(imageFile);
```

#### Option 2: Use the Hook

```typescript
import { useAgentService } from '../services/agentServiceWrapper';

function MyComponent() {
  const agentService = useAgentService();
  
  const handleUpload = async (file: File) => {
    const result = await agentService.analyzeWoundImage(file);
    // ...
  };
}
```

#### Option 3: Direct Access (Not Recommended)

```typescript
import { agentService } from '../services/agentService';
import { useConfigStore } from '../stores/configStore';

// Manually get scenario and pass it
const scenario = useConfigStore.getState().getCurrentScenario();
const result = await agentService.analyzeWoundImage(imageFile, scenario);
```

### Programmatic Access

You can also access and modify the configuration programmatically:

```typescript
import { useConfigStore } from '../stores/configStore';
import { DemoScenario } from '../types';

// Get current scenario
const scenario = useConfigStore.getState().getCurrentScenario();

// Set scenario
useConfigStore.getState().setDemoScenario(DemoScenario.SCENARIO_RISK_DETECTED);

// Check scenario type
const isHappyPath = useConfigStore.getState().isHappyPath();
const isRiskDetected = useConfigStore.getState().isRiskDetected();

// Reset to defaults
useConfigStore.getState().resetConfig();
```

## Testing

### Manual Testing

1. **Test Scenario Persistence**
   - Set scenario to "Risk Detected"
   - Refresh the page
   - Open debug menu
   - Verify "Risk Detected" is still selected

2. **Test Happy Path Scenario**
   - Set scenario to "Happy Path"
   - Upload multiple wound photos
   - Verify all return green results

3. **Test Risk Detected Scenario**
   - Set scenario to "Risk Detected"
   - Upload a wound photo
   - Verify red result and action item creation

4. **Test Keyboard Shortcut**
   - Press `Ctrl+Shift+D` multiple times
   - Verify menu toggles visibility correctly

### Automated Testing

The configuration system includes comprehensive tests:

- **`src/stores/configStore.test.ts`** - Store behavior tests
- **`src/services/agentService.test.ts`** - Scenario-based result tests

Run tests with:
```bash
npm test
```

## Troubleshooting

### Debug Menu Not Appearing

- Ensure you're pressing the correct keyboard shortcut: `Ctrl+Shift+D`
- Check browser console for any errors
- Try refreshing the page

### Scenario Not Changing

- Verify the scenario is selected (checkmark should appear)
- Check browser console for configuration logs
- Try resetting configuration: `useConfigStore.getState().resetConfig()`

### LocalStorage Issues

- Check if LocalStorage is available: `persistenceService.isAvailable()`
- Clear LocalStorage if corrupted: `persistenceService.clearAll()`
- Check browser storage quota

## Future Enhancements

Potential improvements for the demo scenario system:

1. **Additional Scenarios**
   - Insurance denied scenario
   - Out of stock medication scenario
   - Multiple risk levels (yellow/orange warnings)

2. **Advanced Configuration**
   - Adjustable mock delay times
   - Custom confidence scores
   - Specific error simulation

3. **Demo Recording**
   - Record and replay demo sequences
   - Automated demo mode with timed actions

4. **URL-Based Configuration**
   - Set scenario via URL parameter: `?scenario=risk_detected`
   - Useful for sharing demo links

## Support

For questions or issues with the demo scenario configuration:

1. Check this guide first
2. Review the implementation in `src/stores/configStore.ts`
3. Check browser console for debug logs
4. Contact the development team

---

**Last Updated:** Task 7.4 Implementation
**Requirements:** 15.1, 15.2
