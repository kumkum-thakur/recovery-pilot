/**
 * Example usage of CelebrationOverlay component
 * 
 * This file demonstrates how to integrate the CelebrationOverlay
 * component with mission completion and streak tracking.
 */

import { useState } from 'react';
import { CelebrationOverlay } from './CelebrationOverlay';

/**
 * Example 1: Basic usage with manual trigger
 */
export function BasicCelebrationExample() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [streakCount, setStreakCount] = useState(5);

  const handleComplete = () => {
    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Basic Celebration Example</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Current Streak: {streakCount} days
          </label>
          <input
            type="number"
            value={streakCount}
            onChange={(e) => setStreakCount(parseInt(e.target.value) || 0)}
            className="border rounded px-3 py-2"
            min="0"
          />
        </div>
        
        <button
          onClick={handleComplete}
          className="bg-gamification-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-gamification-accent/90 transition-colors"
        >
          Complete Mission
        </button>
      </div>

      <CelebrationOverlay
        isVisible={showCelebration}
        streakCount={streakCount}
        onComplete={handleCelebrationComplete}
      />
    </div>
  );
}

/**
 * Example 2: Integration with mission completion
 */
export function MissionCompletionExample() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [missions, setMissions] = useState([
    { id: '1', title: 'Scan Incision', completed: false },
    { id: '2', title: 'Take Medication', completed: false },
    { id: '3', title: 'Log Exercise', completed: false },
  ]);
  const [streakCount, setStreakCount] = useState(6);

  const handleMissionComplete = (missionId: string) => {
    // Mark mission as completed
    setMissions(prev =>
      prev.map(m => (m.id === missionId ? { ...m, completed: true } : m))
    );

    // Show celebration
    setShowCelebration(true);

    // Check if all missions are complete
    const allComplete = missions.every(m => m.id === missionId || m.completed);
    if (allComplete) {
      // Increment streak
      setStreakCount(prev => prev + 1);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Mission Completion Example</h2>
      
      <div className="mb-4">
        <div className="text-lg font-semibold text-gamification-accent">
          🔥 Streak: {streakCount} days
        </div>
      </div>

      <div className="space-y-3">
        {missions.map(mission => (
          <div
            key={mission.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h3 className="font-semibold">{mission.title}</h3>
              <p className="text-sm text-slate-600">
                {mission.completed ? '✅ Completed' : '⏳ Pending'}
              </p>
            </div>
            
            {!mission.completed && (
              <button
                onClick={() => handleMissionComplete(mission.id)}
                className="bg-medical-primary text-white px-4 py-2 rounded-lg hover:bg-medical-primary/90 transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        ))}
      </div>

      <CelebrationOverlay
        isVisible={showCelebration}
        streakCount={streakCount}
        onComplete={handleCelebrationComplete}
      />
    </div>
  );
}

/**
 * Example 3: Milestone testing
 */
export function MilestoneTestingExample() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedStreak, setSelectedStreak] = useState(7);

  const milestones = [
    { value: 1, label: '1 day (Regular)' },
    { value: 7, label: '7 days (Milestone)' },
    { value: 15, label: '15 days (Regular)' },
    { value: 30, label: '30 days (Milestone)' },
    { value: 50, label: '50 days (Regular)' },
    { value: 100, label: '100 days (Milestone)' },
  ];

  const handleTest = () => {
    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Milestone Testing Example</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Streak to Test:
          </label>
          <select
            value={selectedStreak}
            onChange={(e) => setSelectedStreak(parseInt(e.target.value))}
            className="border rounded px-3 py-2 w-full"
          >
            {milestones.map(milestone => (
              <option key={milestone.value} value={milestone.value}>
                {milestone.label}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleTest}
          className="bg-gamification-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-gamification-accent/90 transition-colors w-full"
        >
          Test Celebration
        </button>

        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
          <p className="font-semibold mb-2">Milestone Info:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Milestones: 7, 30, 100 days</li>
            <li>Milestone animations have 100 confetti pieces (vs 50 regular)</li>
            <li>Milestone confetti are circles (vs squares for regular)</li>
            <li>Milestone shows special message with streak count</li>
          </ul>
        </div>
      </div>

      <CelebrationOverlay
        isVisible={showCelebration}
        streakCount={selectedStreak}
        onComplete={handleCelebrationComplete}
      />
    </div>
  );
}

/**
 * Example 4: All examples in one page
 */
export function AllCelebrationExamples() {
  return (
    <div className="min-h-screen bg-medical-bg">
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          CelebrationOverlay Examples
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg">
          <BasicCelebrationExample />
        </div>
        
        <div className="bg-white rounded-xl shadow-lg">
          <MissionCompletionExample />
        </div>
        
        <div className="bg-white rounded-xl shadow-lg">
          <MilestoneTestingExample />
        </div>
      </div>
    </div>
  );
}
