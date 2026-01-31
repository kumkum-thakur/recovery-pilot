/**
 * MissionStream - Displays the list of patient missions
 * 
 * Fetches missions from MissionStore on mount and displays them as cards.
 * Handles loading states and empty states with encouraging messages.
 * Integrates PhotoCaptureModal for photo upload missions.
 * 
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3
 */

import { useEffect, useState } from 'react';
import { MissionCard } from './MissionCard';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { useMissionStore } from '../stores/missionStore';
import { useUserStore } from '../stores/userStore';
import { useAgentStore } from '../stores/agentStore';
import { Loader2, Sparkles } from 'lucide-react';
import { MissionType } from '../types';

export function MissionStream() {
  // Get missions and loading state from MissionStore
  const { missions, isLoading, fetchMissions } = useMissionStore();
  
  // Get current user from UserStore
  const { currentUser } = useUserStore();

  // Fetch missions on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchMissions(currentUser.id).catch((error) => {
        console.error('Failed to fetch missions:', error);
      });
    }
  }, [currentUser?.id, fetchMissions]);

  const handleAction = (missionId: string) => {
    console.log('Mission action triggered:', missionId);
    // Action handling will be implemented in task 12 (Photo Capture)
    // For now, just log the action
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-medical-text">Your Missions</h2>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 text-medical-primary animate-spin" />
          <p className="text-medical-text-secondary">Loading your missions...</p>
        </div>
      </div>
    );
  }

  // Empty state - no missions available
  if (missions.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-medical-text">Your Missions</h2>
        <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-gradient-to-br from-gamification-success/10 to-gamification-accent/10 rounded-lg border border-gamification-success/20">
          <Sparkles className="w-12 h-12 text-gamification-success" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-medical-text">
              Great job! 🎉
            </h3>
            <p className="text-medical-text-secondary max-w-md">
              No missions right now. You're all caught up! Check back tomorrow for new recovery tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Display missions
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-medical-text">Your Missions</h2>
      
      <div className="space-y-4">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  );
}
