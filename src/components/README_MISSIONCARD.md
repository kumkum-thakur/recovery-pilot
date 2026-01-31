# MissionCard Component

## Overview

The `MissionCard` component displays individual patient recovery missions with a context-aware action button. It's a core component of the patient dashboard's mission stream.

## Features

### Display Requirements (Req 3.2, 3.3)
- **Mission Title**: Prominently displayed with icon
- **Mission Description**: Clear explanation of the task
- **Status Badge**: Visual indicator (Pending, Completed, Overdue)
- **Mission Icon**: Type-specific icon (Camera, CheckCircle, Activity)

### Smart Action Button (Req 4.1, 4.2, 4.3, 4.4)
The action button text adapts based on mission type:
- **Photo Upload**: "Scan Incision"
- **Medication Check**: "Mark Complete"
- **Exercise Log**: "Log Exercise"

The button executes the corresponding mission action when clicked.

### Visual Design
- **Medical Theme**: Uses `medical-primary` (blue-600) for trust
- **Gamification**: Gradient icon backgrounds with `gamification-accent` (violet-500)
- **Success States**: Uses `gamification-success` (emerald-400) for completed missions
- **Responsive**: Mobile-first with minimum 44px tap targets (Req 13.2)

## Usage

```tsx
import { MissionCard } from './components/MissionCard';
import { Mission } from './types';

function MissionStream() {
  const handleAction = (missionId: string) => {
    // Handle mission action (photo upload, mark complete, etc.)
    console.log('Action triggered for mission:', missionId);
  };

  const mission: Mission = {
    id: 'mission-1',
    type: 'photo_upload',
    title: 'Mission 1: Scan Incision',
    description: 'Take a photo of your surgical incision',
    status: 'pending',
    dueDate: new Date(),
    actionButtonText: 'Scan Incision',
  };

  return <MissionCard mission={mission} onAction={handleAction} />;
}
```

## Props

```typescript
interface MissionCardProps {
  mission: Mission;           // Mission data to display
  onAction: (missionId: string) => void;  // Callback when action button clicked
}
```

## Mission Types & Icons

| Type | Icon | Default Button Text |
|------|------|---------------------|
| `photo_upload` | Camera | "Scan Incision" |
| `medication_check` | CheckCircle | "Mark Complete" |
| `exercise_log` | Activity | "Log Exercise" |

## Status States

| Status | Badge Color | Action Button |
|--------|-------------|---------------|
| `pending` | Blue | Visible |
| `overdue` | Red | Visible |
| `completed` | Green | Hidden (shows completion message) |

## Accessibility

- **Minimum Tap Target**: 44px height for touch-friendly interaction
- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: WCAG AA compliant

## Testing

Comprehensive unit tests cover:
- Display of title, description, and status
- Smart action button text adaptation
- Button click handling
- Status badge rendering
- Accessibility requirements
- Visual styling with theme colors

Run tests:
```bash
npm test -- src/components/MissionCard.test.tsx
```

## Requirements Validated

- ✅ 3.2: Display mission title, description, status
- ✅ 3.3: Show mission status (pending, completed, overdue)
- ✅ 4.1: Display "Scan Incision" for photo upload
- ✅ 4.2: Display "Mark Complete" for confirmation
- ✅ 4.3: Display appropriate text for external actions
- ✅ 4.4: Execute corresponding mission action on button click
- ✅ 13.2: Minimum 44px tap targets

## Next Steps

This component will be integrated into the `MissionStream` component (Task 11.2) to display the full list of patient missions.
