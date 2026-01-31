/**
 * StreakDisplay - Shows the patient's current streak count
 * 
 * Requirements: 10.3
 */

interface StreakDisplayProps {
  streakCount: number;
}

export function StreakDisplay({ streakCount }: StreakDisplayProps) {
  return (
    <div className="flex items-center gap-2 bg-gamification-accent/10 px-4 py-2 rounded-lg">
      <span className="text-2xl">🔥</span>
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
