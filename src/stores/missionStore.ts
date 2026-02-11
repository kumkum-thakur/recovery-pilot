/**
 * MissionStore - Zustand store for patient mission management
 * 
 * Manages:
 * - Mission list state and loading status
 * - Fetching missions for a patient
 * - Completing missions
 * - Photo upload for missions
 * 
 * Requirements: 3.1, 3.2, 3.3, 5.3, 10.1
 */

import { create } from 'zustand';
import type { Mission, MissionModel, MissionStore as IMissionStore } from '../types';
import { MissionStatus, MissionType } from '../types';
import { persistenceService } from '../services/persistenceService';
import { medicationTracker } from '../services/medicationTracker';
import { refillEngine } from '../services/refillEngine';

/**
 * Converts MissionModel (database format) to Mission (application format)
 * 
 * @param model - Mission model from database
 * @returns Mission object for application use
 */
function missionModelToMission(model: MissionModel): Mission {
  return {
    id: model.id,
    type: model.type,
    title: model.title,
    description: model.description,
    status: model.status,
    dueDate: new Date(model.dueDate),
    actionButtonText: getActionButtonText(model.type),
  };
}

/**
 * Gets the appropriate action button text for a mission type
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
function getActionButtonText(type: string): string {
  switch (type) {
    case 'photo_upload':
      return 'Scan Incision';
    case 'medication_check':
      return 'Mark Complete';
    case 'exercise_log':
      return 'Log Exercise';
    default:
      return 'Complete';
  }
}

/**
 * MissionStore implementation using Zustand
 * 
 * Provides state management for patient recovery missions
 * Requirements: 3.1, 3.2, 3.3, 5.3, 10.1
 */
export const useMissionStore = create<IMissionStore>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================
  
  /**
   * List of missions for the current patient
   * Empty array if no missions loaded
   * 
   * Requirements: 3.1, 3.2
   */
  missions: [],
  
  /**
   * Loading state for async operations
   * true when fetching missions or processing actions
   * 
   * Requirements: 3.1
   */
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Fetches all missions for a specific patient
   * 
   * This method:
   * 1. Sets loading state to true
   * 2. Retrieves missions from persistence
   * 3. Converts mission models to mission objects
   * 4. Updates missions state
   * 5. Sets loading state to false
   * 
   * @param userId - Patient user ID
   * @throws Error if fetch fails
   * 
   * Requirements: 3.1, 3.2, 3.3
   */
  fetchMissions: async (userId: string) => {
    // Set loading state
    set({ isLoading: true });
    
    try {
      // Simulate async operation (for consistency with future API integration)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get missions from persistence
      const missionModels = persistenceService.getMissions(userId);
      
      // Convert to Mission objects
      const missions = missionModels.map(missionModelToMission);
      
      // Sort by due date (earliest first)
      missions.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      
      // Update state
      set({
        missions,
        isLoading: false,
      });
    } catch (error) {
      // Log error and reset loading state
      console.error('Failed to fetch missions:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Marks a mission as completed
   * 
   * This method:
   * 1. Finds the mission in the current state
   * 2. Updates the mission status to 'completed' in persistence
   * 3. Updates the mission in the local state
   * 4. Records completion timestamp
   * 
   * Note: Streak count updates are handled by the caller (typically the UI component)
   * after checking if all daily missions are complete.
   * 
   * @param missionId - Mission ID to complete
   * @throws Error if mission not found or update fails
   * 
   * Requirements: 3.3, 10.1
   */
  completeMission: async (missionId: string) => {
    const { missions } = get();
    
    // Find the mission
    const mission = missions.find(m => m.id === missionId);
    if (!mission) {
      throw new Error(`Mission with ID "${missionId}" not found`);
    }
    
    // Check if already completed
    if (mission.status === MissionStatus.COMPLETED) {
      console.warn(`Mission "${missionId}" is already completed`);
      return;
    }
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get mission model from persistence
      const missionModel = persistenceService.getMission(missionId);
      if (!missionModel) {
        throw new Error(`Mission model with ID "${missionId}" not found in persistence`);
      }
      
      // Handle medication tracking if this is a medication mission
      if (mission.type === MissionType.MEDICATION_CHECK) {
        console.log('💊 [MissionStore] Processing medication mission');
        
        try {
          // Record medication taken
          const remaining = medicationTracker.recordMedicationTaken(
            missionModel.patientId,
            'med-1' // Default medication ID
          );
          
          console.log('💊 [MissionStore] Tablets remaining:', remaining);
          
          // Check if refill needed
          if (medicationTracker.checkRefillNeeded(missionModel.patientId, 'med-1')) {
            console.log('🔄 [MissionStore] Triggering refill request');
            
            // Trigger refill request
            await refillEngine.requestRefill(
              missionModel.patientId,
              'med-1',
              'Amoxicillin 500mg'
            );
          }
        } catch (medError) {
          console.error('❌ [MissionStore] Medication tracking error:', medError);
          // Don't fail the mission completion if medication tracking fails
        }
      }
      
      // Update mission status in persistence
      const updatedModel: MissionModel = {
        ...missionModel,
        status: MissionStatus.COMPLETED,
        completedAt: new Date().toISOString(),
      };
      persistenceService.saveMission(updatedModel);
      
      // Update mission in local state
      const updatedMissions = missions.map(m =>
        m.id === missionId
          ? { ...m, status: MissionStatus.COMPLETED }
          : m
      );
      
      set({ missions: updatedMissions });
    } catch (error) {
      console.error('Failed to complete mission:', error);
      throw error;
    }
  },

  /**
   * Checks if all missions for the current day are completed
   * 
   * DEV MODE: Uses 2-minute intervals instead of days for testing
   * 
   * This method:
   * 1. Filters missions to only include today's missions
   * 2. Checks if all of them are completed
   * 3. Checks if they were completed within the last 2 minutes
   * 
   * @returns true if all daily missions are completed within the interval, false otherwise
   * 
   * Requirements: 10.1
   */
  areAllDailyMissionsCompleted: (): boolean => {
    const { missions } = get();
    
    // DEV MODE: Use 2-minute intervals instead of days
    const DEV_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes in milliseconds
    
    const now = Date.now();
    
    // Get today's date (start of day) for filtering missions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter missions due today
    const todaysMissions = missions.filter(mission => {
      const dueDate = new Date(mission.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });
    
    // If no missions for today, return false (can't complete what doesn't exist)
    if (todaysMissions.length === 0) {
      return false;
    }
    
    // Check if all today's missions are completed AND were completed within the interval
    return todaysMissions.every(mission => {
      if (mission.status !== MissionStatus.COMPLETED) {
        return false;
      }
      
      // Get the mission model to check completion date
      const missionModel = persistenceService.getMission(mission.id);
      if (!missionModel || !missionModel.completedAt) {
        return false;
      }
      
      // Check if completed within the last 2 minutes (dev interval)
      const completedTime = new Date(missionModel.completedAt).getTime();
      const timeSinceCompletion = now - completedTime;
      
      return timeSinceCompletion <= DEV_INTERVAL_MS;
    });
  },

  /**
   * Uploads a photo for a mission and triggers AI analysis
   * 
   * This method:
   * 1. Validates the mission exists and is a photo upload mission
   * 2. Validates the image file
   * 3. Creates a local URL for the image (for MVP, stores as data URL)
   * 4. Stores the image reference in mission metadata
   * 5. Marks the mission as completed
   * 
   * Note: AI analysis is triggered by the caller (AgentStore) after this method completes.
   * This separation allows for better control flow and error handling.
   * 
   * @param missionId - Mission ID for photo upload
   * @param imageFile - Image file to upload
   * @throws Error if mission not found, wrong type, or upload fails
   * 
   * Requirements: 5.3, 6.1
   */
  uploadPhoto: async (missionId: string, imageFile: File) => {
    const { missions } = get();
    
    // Find the mission
    const mission = missions.find(m => m.id === missionId);
    if (!mission) {
      throw new Error(`Mission with ID "${missionId}" not found`);
    }
    
    // Validate mission type
    if (mission.type !== 'photo_upload') {
      throw new Error(`Mission "${missionId}" is not a photo upload mission`);
    }
    
    // Validate file is an image
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('File must be an image (JPEG, PNG, or HEIC)');
    }
    
    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (imageFile.size > MAX_FILE_SIZE) {
      throw new Error('Image must be under 10MB');
    }
    
    try {
      // Set loading state
      set({ isLoading: true });
      
      // Simulate async upload
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Convert image to data URL for MVP storage
      const imageUrl = await fileToDataUrl(imageFile);
      
      // Get mission model from persistence
      const missionModel = persistenceService.getMission(missionId);
      if (!missionModel) {
        throw new Error(`Mission model with ID "${missionId}" not found in persistence`);
      }
      
      // Update mission with image URL in metadata
      const updatedModel: MissionModel = {
        ...missionModel,
        status: MissionStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        metadata: {
          ...missionModel.metadata,
          imageUrl,
          imageFileName: imageFile.name,
          imageSize: imageFile.size,
          imageType: imageFile.type,
        },
      };
      persistenceService.saveMission(updatedModel);
      
      // Update mission in local state
      const updatedMissions = missions.map(m =>
        m.id === missionId
          ? { ...m, status: MissionStatus.COMPLETED }
          : m
      );
      
      set({
        missions: updatedMissions,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to upload photo:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));

/**
 * Converts a File to a data URL
 * 
 * @param file - File to convert
 * @returns Promise resolving to data URL string
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
