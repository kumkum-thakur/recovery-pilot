# StreakDisplay Component

## Overview

The `StreakDisplay` component displays the patient's current streak count prominently in the dashboard header. It uses gamification colors (violet-500) and a fire emoji to encourage engagement and motivate patients to maintain their recovery routine.

## Requirements

**Validates: Requirements 10.3**
- Display current streak count prominently on the patient dashboard

## Features

- ✅ Displays streak count in large, bold font
- ✅ Fire emoji (🔥) for visual appeal
- ✅ Gamification colors (violet-500 accent)
- ✅ Proper singular/plural handling ("1 day" vs "3 days")
- ✅ Accessibility support with ARIA labels
- ✅ Hover effects for interactivity
- ✅ Responsive design

## Usage

```tsx
import { StreakDisplay } from './components/StreakDisplay';

function MyComponent() {
  return <StreakDisplay streakCount={5} />;
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `streakCount` | `number` | Yes | The number of consecutive days of mission completion |

## Visual Design

The component uses:
- **Background**: `gamification-accent/10` (light violet background)
- **Border**: `gamification-accent/20` (subtle violet border)
- **Text Color**: `gamification-accent` (violet-500)
- **Font**: Space Grotesk (monospace) for numbers
- **Shadow**: Subtle shadow with hover effect

## Accessibility

- Uses `role="status"` for screen reader announcements
- Includes descriptive `aria-label` with full streak information
- Fire emoji marked with `aria-hidden="true"` to avoid confusion

## Examples

### Zero Streak
```tsx
<StreakDisplay streakCount={0} />
// Displays: 🔥 0 days
```

### Single Day
```tsx
<StreakDisplay streakCount={1} />
// Displays: 🔥 1 day
```

### Multiple Days
```tsx
<StreakDisplay streakCount={7} />
// Displays: 🔥 7 days
```

### Large Streak
```tsx
<StreakDisplay streakCount={365} />
// Displays: 🔥 365 days
```

## Integration

The component is integrated into the `Header` component, which is used in the `PatientDashboard`:

```tsx
// In Header.tsx
{streakCount !== undefined && (
  <StreakDisplay streakCount={streakCount} />
)}

// In PatientDashboard.tsx
<Header
  userName={currentUser.name}
  streakCount={currentUser.streakCount}
  onLogout={handleLogout}
/>
```

## Testing

The component has comprehensive unit tests covering:
- Display of streak count with fire emoji
- Singular/plural handling
- Zero streak display
- Large streak counts
- Accessibility attributes
- Gamification color classes

Run tests with:
```bash
npm test -- StreakDisplay.test.tsx
```

## Design Rationale

The StreakDisplay component follows the "Gamified Layer" design strategy:
- Uses violet-500 (gamification accent) instead of medical blues
- Prominent placement in header for constant visibility
- Fire emoji creates emotional connection and motivation
- Monospace font gives a "score counter" feel
- Hover effects add interactivity without being distracting

This design balances clinical trust (clean, readable) with gamified engagement (colorful, playful) to motivate patients in their recovery journey.
