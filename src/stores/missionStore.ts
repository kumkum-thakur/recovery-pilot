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
import { MissionStatus } from '../types';
import { persistenceService } from '../services/persistenceService';

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
  // ==