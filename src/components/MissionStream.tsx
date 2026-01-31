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
import { TriageResultCard } from './TriageResultCard';
import { AgentStatusToast } from './AgentStatusToast';
import { useMissionStore } from '../stores/missionStore';
import { useUserStore } from '../stores/userStore';
import { useAgentStore } from '../stores/agentStore';
import { useConfigStore } from '../stores/configStore';
import { agentService } from '../services/agentService';
import { Loader2, Sparkles, X } from 'lucide-react';
import { MissionType } from '../types';
import type { TriageResult } from '../types';

export function MissionStream() {
  // Get missions and loading state from MissionStore
  const { missions, isLoading, fetchMissions, uploadPhoto, completeMission, areAllDailyMissionsCompleted } = useMissionStore();
  
  // Get current user and streak functions from UserStore
  const { currentUser, incrementStreak, updateLastMissionCheckDate, checkAndUpdateStreakForMissedDay } = useUserStore();

  // Get agent store for triggering AI analysis
  const { currentWorkflow, startTriageWorkflow, clearWorkflow } = useAgentStore();

  // Get config store for demo scenario
  const { getCurrentScenario } = useConfigStore();

  // State for PhotoCaptureModal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedMissionTitle, setSelectedMissionTitle] = useState<string>('');

  // State for triage result display
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [showTriageResult, setShowTriageResult] = useState(false);
  
  // State for workflow error handling
  const [workflowError, setWorkflowError] = useState<Error | null>(null);
  const [lastPhotoFile, setLastPhotoFile] = useState<File | null>(null);

  // Fetch missions on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchMissions(currentUser.id).catch((error) => {
        console.error('Failed to fetch missions:', error);
      });
    }
  }, [currentUser?.id, fetchMissions]);

  /**
   * Handles mission action button click
   * Opens PhotoCaptureModal for photo upload missions
   * Completes mission directly for other mission types
   * 
   * Requirements: 4.4, 5.1
   */
  const handleAction = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    
    if (!mission) {
      console.error('Mission not found:', missionId);
      return;
    }

    // Handle photo upload missions
    if (mission.type === MissionType.PHOTO_UPLOAD) {
      setSelectedMissionId(missionId);
      setSelectedMissionTitle(mission.title);
      setIsModalOpen(true);
    } else {
      // For other mission types, complete directly
      completeMission(missionId).catch((error) => {
        console.error('Failed to complete mission:', error);
      });
    }
  };

  /**
   * Handles photo submission from PhotoCaptureModal
   * Uploads photo, triggers AI triage workflow, and performs AI analysis
   * 
   * Requirements: 5.3, 6.1, 7.1
   */
  const handlePhotoSubmit = async (imageFile: File) => {
    if (!selectedMissionId) {
      throw new Error('No mission selected');
    }

    // Store the file for potential retry
    setLastPhotoFile(imageFile);
    setWorkflowError(null);

    try {
      // Step 1: Upload photo to mission store
      // This marks the mission as completed and stores the image
      await uploadPhoto(selectedMissionId, imageFile);

      // Step 2: Trigger AI triage workflow (visual steps for user)
      // This shows the "Analyzing Image...", "Drafting Note...", etc. steps
      await startTriageWorkflow(imageFile);

      // Step 3: Perform actual AI analysis
      // Get current demo scenario to determine result
      const scenario = getCurrentScenario();
      const result = await agentService.analyzeWoundImage(imageFile, scenario);

      // Step 4: Display triage result to user
      setTriageResult(result);
      setShowTriageResult(true);

      // Step 5: Clear the agent workflow after a short delay
      // This allows the UI to show the completed workflow before clearing
      setTimeout(() => {
        clearWorkflow();
      }, 1000);

      // Close modal
      setIsModalOpen(false);
      setSelectedMissionId(null);
      setSelectedMissionTitle('');
    } catch (error) {
      console.error('Failed to submit photo:', error);
      
      // Store error for display
      setWorkflowError(error instanceof Error ? error : new Error('Unknown error occurred'));
      
      // Don't close modal on error - let user see the error and retry
      // The workflow will show failed steps in the toast
    }
  };

  /**
   * Handles retry of failed workflow
   * Re-attempts the photo submission with the last uploaded file
   * 
   * Requirements: 7.1
   */
  const handleRetryWorkflow = async () => {
    if (!lastPhotoFile || !selectedMissionId) {
      console.error('Cannot retry: no photo file or mission selected');
      return;
    }

    // Clear previous error
    setWorkflowError(null);
    
    // Clear the failed workflow before retrying
    clearWorkflow();
    
    // Wait a brief moment for UI to update
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Retry the photo submission
    try {
      await handlePhotoSubmit(lastPhotoFile);
    } catch (error) {
      console.error('Retry failed:', error);
      // Error is already handled in handlePhotoSubmit
    }
  };

  /**
   * Handles modal close
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMissionId(null);
    setSelectedMissionTitle('');
  };

  /**
   * Handles triage result close
   */
  const handleTriageResultClose = () => {
    setShowTriageResult(false);
    setTriageResult(null);
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

      {/* PhotoCaptureModal for photo upload missions */}
      <PhotoCaptureModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handlePhotoSubmit}
        missionTitle={selectedMissionTitle}
      />

      {/* Agent Status Toast - displays workflow progress with retry option */}
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null && currentWorkflow.length > 0}
        onComplete={clearWorkflow}
        onRetry={workflowError ? handleRetryWorkflow : undefined}
      />

      {/* Triage Result Display */}
      {showTriageResult && triageResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            {/* Result header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-medical-text">
                Analysis Complete
              </h3>
              <button
                onClick={handleTriageResultClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close result"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Use TriageResultCard component */}
            <TriageResultCard
              analysis={triageResult.analysis}
              analysisText={triageResult.analysisText}
              confidenceScore={triageResult.confidenceScore}
              actionItemId={triageResult.actionItemId}
            />

            {/* Action button */}
            <button
              onClick={handleTriageResultClose}
              className="w-full px-6 py-3 bg-medical-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
