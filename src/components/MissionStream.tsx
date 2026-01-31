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
import { useConfigStore } from '../stores/configStore';
import { agentService } from '../services/agentService';
import { Loader2, Sparkles } from 'lucide-react';
import { MissionType } from '../types';
import type { TriageResult } from '../types';

export function MissionStream() {
  // Get missions and loading state from MissionStore
  const { missions, isLoading, fetchMissions, uploadPhoto, completeMission } = useMissionStore();
  
  // Get current user from UserStore
  const { currentUser } = useUserStore();

  // Get agent store for triggering AI analysis
  const { startTriageWorkflow, clearWorkflow } = useAgentStore();

  // Get config store for demo scenario
  const { getCurrentScenario } = useConfigStore();

  // State for PhotoCaptureModal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedMissionTitle, setSelectedMissionTitle] = useState<string>('');

  // State for triage result display
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [showTriageResult, setShowTriageResult] = useState(false);

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
   * Requirements: 5.3, 6.1
   */
  const handlePhotoSubmit = async (imageFile: File) => {
    if (!selectedMissionId) {
      throw new Error('No mission selected');
    }

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
      throw error; // Re-throw to let modal handle the error
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

      {/* Triage Result Display */}
      {showTriageResult && triageResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            {/* Result header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-medical-text">
                Analysis Complete
              </h3>
              <button
                onClick={handleTriageResultClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close result"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Result content */}
            <div className={`p-4 rounded-lg ${
              triageResult.analysis === 'green' 
                ? 'bg-gamification-success/10 border border-gamification-success/20' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {/* Status icon and text */}
              <div className="flex items-start gap-3">
                {triageResult.analysis === 'green' ? (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gamification-success flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    triageResult.analysis === 'green' ? 'text-gamification-success' : 'text-red-700'
                  }`}>
                    {triageResult.analysis === 'green' ? 'Healing Well! ✨' : 'Attention Needed ⚠️'}
                  </h4>
                  <p className="text-medical-text text-base">
                    {triageResult.analysisText}
                  </p>
                </div>
              </div>

              {/* Confidence score */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  AI Confidence: <span className="font-semibold">{(triageResult.confidenceScore * 100).toFixed(0)}%</span>
                </p>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleTriageResultClose}
              className="w-full px-6 py-3 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
