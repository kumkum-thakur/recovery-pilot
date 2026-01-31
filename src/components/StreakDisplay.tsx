/**
 * StreakDisplay - Shows the patient's current streak count
 * 
 * Displays the patient's current streak count prominently with a fire emoji
 * for visual appeal. Uses gamification colors (violet-500) to encourage engagement.
 * 
 * Requirements: 10.3 - Display current streak count prominently on patient dashboard
 * 
 * @param streakCount - The number of consecutive days of mission completion
 */

interface StreakDisplayProps {
  streakCount: number;
}

export function StreakDisplay({ streakCount }: StreakDisplayProps) {
  return (
    <div 
      className="flex items-center gap-2 bg-gamification-accent/10 px-4 py-2 rounded-lg border border-gamification-accent/20 shadow-sm hover:shadow-md transition-shadow"
      role="status"
      aria-label={`Current streak: ${streakCount} ${streakCount === 1 ? 'day' : 'days'}`}
    >
      {/* Fire emoji for visual appeal */}
      <span className="text-2xl" aria-hidden="true">🔥</span>
      
      <div className="flex flex-col">
        <span className="text-xs text-gamification-accent font-medium uppercase tracking-wide">
          Streak
        </span>
        <span className="text-xl font-bold text-gamification-accent font-mono">
          {streakCount} {streakCount === 1 ? 'day' : 'days'}
        </span>
      </div>
    </div>
  );
}
