# CelebrationOverlay Component

## Overview

The `CelebrationOverlay` component displays a full-screen celebratory confetti animation when a patient completes a mission. It provides enhanced animations for streak milestones (7, 30, 100 days) and auto-dismisses after 2 seconds.

## Requirements

**Validates: Requirements 11.3**
- Streak Celebration: WHEN a streak milestone is hit, THE System SHALL trigger a full-screen "Confetti" effect

## Features

- ✅ Full-screen confetti animation using framer-motion
- ✅ Triggers on mission completion
- ✅ Enhanced animation for streak milestones (7, 30, 100 days)
- ✅ Auto-dismisses after 2 seconds
- ✅ Randomized confetti colors from gamification palette
- ✅ Different confetti shapes for milestones (circles) vs regular (squares)
- ✅ More confetti pieces for milestones (100 vs 50)
- ✅ Milestone message with celebration text
- ✅ Regular completion message with success feedback
- ✅ Smooth entrance and exit animations
- ✅ Accessibility support with ARIA labels

## Usage

```tsx
import { CelebrationOverlay } from './components/CelebrationOverlay';

function MyComponent() {
  const [showCelebration, setShowCelebration] = useState(false);
  const streakCount = 7; // Current streak count

  const handleMissionComplete = () => {
    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  return (
    <>
      <button onClick={handleMissionComplete}>
        Complete Mission
      </button>
      
      <CelebrationOverlay
        isVisible={showCelebration}
        streakCount={streakCount}
        onComplete={handleCelebrationComplete}
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isVisible` | `boolean` | Yes | Whether the overlay is visible |
| `streakCount` | `number` | No | Current streak count (default: 0). Used to determine if milestone animation should be shown |
| `onComplete` | `() => void` | Yes | Callback when animation completes and overlay dismisses (after 2 seconds) |

## Streak Milestones

The component recognizes the following streak milestones for enhanced animations:
- **7 days** - First week milestone
- **30 days** - One month milestone
- **100 days** - Major achievement milestone

When a milestone is reached:
- 100 confetti pieces (vs 50 for regular)
- Circular confetti shapes (vs squares for regular)
- Large milestone message with streak count
- Encouraging text: "You're crushing it! Keep going! 💪"

## Visual Design

### Regular Completion
- **Confetti**: 50 pieces, square shapes, random colors
- **Message**: "Mission Complete!" with sparkle emoji (✨)
- **Background**: Success green (`gamification-success`)
- **Animation**: Spring animation with scale and fade

### Milestone Completion
- **Confetti**: 100 pieces, circular shapes, random colors
- **Message**: "{X} Day Milestone!" with party emoji (🎉)
- **Background**: White with violet border (`gamification-accent`)
- **Animation**: Enhanced spring animation with larger scale

### Confetti Colors
Randomly selected from gamification palette:
- Violet-500 (`#8b5cf6`) - Gamification accent
- Emerald-400 (`#34d399`) - Success
- Amber-400 (`#fbbf24`) - Agent
- Pink-400 (`#f472b6`)
- Blue-400 (`#60a5fa`)
- Violet-400 (`#a78bfa`)

## Animation Details

### Confetti Animation
- **Initial Position**: Above viewport (`y: -20`)
- **Final Position**: Below viewport (`y: window.innerHeight + 50`)
- **Rotation**: 2 full rotations (720 degrees) while falling
- **Duration**: Random between 1.5-2.5 seconds
- **Delay**: Random stagger up to 0.3 seconds
- **Opacity**: Fades out near the end
- **Easing**: `easeIn` for natural falling motion

### Overlay Animation
- **Entrance**: Fade in over 0.3 seconds
- **Exit**: Fade out over 0.3 seconds
- **Auto-dismiss**: After 2 seconds

### Message Animation
- **Type**: Spring animation
- **Entrance**: Scale from 0 to 1 with upward motion
- **Exit**: Scale to 0 with downward motion
- **Stiffness**: 200-300 (milestone has lower stiffness for more bounce)
- **Damping**: 15-20

## Accessibility

- Uses `role="presentation"` for decorative overlay
- Includes `aria-live="polite"` for screen reader announcements
- Includes `aria-label="Celebration animation"` for context
- Pointer events disabled (`pointer-events-none`) to avoid blocking interaction
- Auto-dismisses to avoid indefinite blocking

## Integration Example

### With MissionStore

```tsx
import { useMissionStore } from '../stores/missionStore';
import { useUserStore } from '../stores/userStore';
import { CelebrationOverlay } from './CelebrationOverlay';

function PatientDashboard() {
  const [showCelebration, setShowCelebration] = useState(false);
  const { completeMission, areAllDailyMissionsCompleted } = useMissionStore();
  const { currentUser, incrementStreak } = useUserStore();

  const handleMissionComplete = async (missionId: string) => {
    // Complete the mission
    await completeMission(missionId);
    
    // Show celebration
    setShowCelebration(true);
    
    // Check if all daily missions are complete
    if (areAllDailyMissionsCompleted()) {
      incrementStreak();
    }
  };

  return (
    <>
      {/* Dashboard content */}
      
      <CelebrationOverlay
        isVisible={showCelebration}
        streakCount={currentUser?.streakCount}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}
```

## Performance Considerations

- Confetti pieces are generated only when overlay becomes visible
- Animation uses GPU-accelerated transforms (translate, rotate, scale)
- Overlay is removed from DOM when not visible (AnimatePresence)
- Auto-dismisses after 2 seconds to avoid memory leaks
- Cleanup timer on unmount to prevent memory leaks

## Testing

The component should be tested for:
- Visibility toggle (show/hide)
- Auto-dismiss after 2 seconds
- Milestone detection (7, 30, 100 days)
- Regular vs milestone animations
- Confetti generation (count, colors, shapes)
- Callback invocation on completion
- Accessibility attributes

Example test:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { CelebrationOverlay } from './CelebrationOverlay';

test('auto-dismisses after 2 seconds', async () => {
  const onComplete = vi.fn();
  
  render(
    <CelebrationOverlay
      isVisible={true}
      streakCount={5}
      onComplete={onComplete}
    />
  );
  
  // Should not be called immediately
  expect(onComplete).not.toHaveBeenCalled();
  
  // Should be called after 2 seconds
  await waitFor(() => {
    expect(onComplete).toHaveBeenCalledTimes(1);
  }, { timeout: 2500 });
});
```

## Design Rationale

The CelebrationOverlay component follows the "Gamified Layer" design strategy:
- Uses vibrant colors from the gamification palette
- Provides immediate positive feedback for mission completion
- Creates emotional connection through celebration
- Differentiates milestones with enhanced animations
- Balances excitement (confetti) with usability (auto-dismiss)
- Encourages continued engagement through milestone recognition

This design motivates patients in their recovery journey by making progress feel rewarding and celebrating achievements in a fun, engaging way.
