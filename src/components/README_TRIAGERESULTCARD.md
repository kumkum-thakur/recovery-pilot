# TriageResultCard Component

## Overview

The `TriageResultCard` component displays the results of AI-powered wound photo triage analysis. It provides clear, reassuring feedback for Green (healing well) results and appropriate notifications for Red (risk detected) results that require doctor review.

## Requirements

This component validates the following requirements:
- **6.3**: Display Green results with positive feedback and care instructions
- **6.4**: Display Red results with action item notification for doctor review
- **6.5**: Show AI confidence score

## Features

### Green Results (Healing Well)
- ✅ Positive, encouraging title: "Looking Good! ✨"
- ✅ Green color scheme (emerald-50 background, gamification-success border)
- ✅ Care instructions section with helpful tips
- ✅ Confidence score display
- ✅ CheckCircle icon for positive reinforcement

### Red Results (Risk Detected)
- ⚠️ Clear warning title: "Attention Needed"
- ⚠️ Red color scheme (red-50 background, red-500 border)
- ⚠️ Action item notification explaining doctor review
- ⚠️ Action item ID display (truncated for readability)
- ⚠️ Confidence score display
- ⚠️ AlertCircle icon for attention

### Confidence Score
- 📊 Displayed as percentage (0-100%)
- 📊 Rounded to nearest integer
- 📊 Monospace font for technical feel
- 📊 TrendingUp icon for visual context

## Usage

```tsx
import { TriageResultCard } from '../components/TriageResultCard';

// Green result example
<TriageResultCard
  analysis="green"
  analysisText="Healing well. Keep it dry."
  confidenceScore={0.92}
/>

// Red result example
<TriageResultCard
  analysis="red"
  analysisText="Redness detected. I have auto-drafted a message to Dr. Smith."
  confidenceScore={0.87}
  actionItemId="action-123-456-789"
/>
```

## Props

```typescript
interface TriageResultCardProps {
  analysis: TriageAnalysis;      // 'green' or 'red'
  analysisText: string;           // AI-generated analysis text
  confidenceScore: number;        // 0.0 to 1.0 (displayed as percentage)
  actionItemId?: string;          // Required for red results
}
```

## Integration Points

### Patient Dashboard
The component should be displayed after a patient uploads a wound photo and the AI analysis completes. It appears in the mission stream or as a modal/toast notification.

### Agent Store Integration
The component receives data from the `TriageResult` returned by `agentService.analyzeWoundImage()`:

```typescript
const result = await agentService.analyzeWoundImage(imageFile, scenario);

<TriageResultCard
  analysis={result.analysis}
  analysisText={result.analysisText}
  confidenceScore={result.confidenceScore}
  actionItemId={result.actionItemId}
/>
```

## Styling

### Color Scheme
- **Green Results**: Uses `gamification-success` (#34d399) for positive reinforcement
- **Red Results**: Uses red-500 (#ef4444) for attention and urgency
- **Backgrounds**: Soft tints (emerald-50, red-50) for readability
- **Text**: Dark variants (emerald-900, red-900) for contrast

### Responsive Design
- Mobile-first layout
- Flexible width (adapts to container)
- Minimum 16px body text for readability
- Touch-friendly spacing

## Accessibility

- ✅ `role="alert"` for screen reader announcements
- ✅ `aria-live="polite"` for non-intrusive updates
- ✅ `aria-hidden="true"` on decorative icons
- ✅ High contrast text colors (WCAG AA compliant)
- ✅ Semantic HTML structure

## Testing

The component has comprehensive test coverage:
- ✅ Green result display and messaging
- ✅ Red result display and action item notification
- ✅ Confidence score formatting and display
- ✅ Appropriate styling for each result type
- ✅ Accessibility attributes
- ✅ Edge cases (red result without action item)

Run tests:
```bash
npm test -- src/components/TriageResultCard.test.tsx
```

## Future Enhancements

1. **Animation**: Add entrance animation when result appears
2. **Expandable Details**: Allow users to expand for more detailed analysis
3. **History**: Link to previous triage results for comparison
4. **Share**: Allow patients to share results with family members
5. **Translation**: Support multiple languages for analysis text

## Related Components

- `AgentStatusToast`: Shows workflow progress before result appears
- `PhotoCaptureModal`: Captures the wound photo that triggers analysis
- `MissionCard`: Contains the "Scan Incision" action that starts the flow
- `ActionItemCard`: Doctor-side component that displays the same data for review
