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
- **Background**: White with v