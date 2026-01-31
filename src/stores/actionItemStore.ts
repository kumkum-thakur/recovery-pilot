/**
 * ActionItemStore - Zustand store for doctor triage management
 * 
 * Manages:
 * - Action item list state and loading status
 * - Fetching action items for doctor review
 * - Approving action items
 * - Rejecting action items with reasons
 * 
 * Requirements: 8.1, 9.1, 9.2, 9.3, 9.4
 */

import { create } from 'zustand';
import type { ActionItem, ActionItemModel, ActionItemStore as IActionItemStore } from '../types';
import { ActionItemStatus, ActionItemType } from '../types';
import { persistenceService } from '../services/persistenceService';

/**
 * Converts ActionItemModel (database format) to ActionItem (application format)
 * 
 * @param model - Action item model from database
 * @returns ActionItem object for application use
 */
function actionItemModelToActionItem(model: ActionItemModel): ActionItem {
  const baseItem: ActionItem = {
    id: model.id,
    patientId: model.patientId,
    patientName: model.patientName,
    type: model.type,
    status: model.status,
    createdAt: new Date(model.createdAt),
    aiConfidenceScore: model.aiConfidenceScore,
  };

  // Add type-specific data
  if (model.type === ActionItemType.TRIAGE && model.imageUrl && model.triageAnalysis && model.triageText) {
    baseItem.triageData = {
      imageUrl: model.imageUrl,
      analysis: model.triageAnalysis,
      analysisText: model.triageText,
      confidenceScore: model.aiConfidenceScore || 0,
    };
  }

  if (model.type === ActionItemType.REFILL && model.medicationName && model.insuranceStatus && model.inventoryStatus) {
    baseItem.refillData = {
      medicationName: model.medicationName,
      insuranceStatus: model.insuranceStatus,
      inventoryStatus: model.inventoryStatus,
    };
  }

  return baseItem;
}

/**
 * ActionItemStore implementation using Zustand
 * 
 * Provides state management for doctor action item review
 * Requirements: 8.1, 9.1, 9.2, 9.3, 9.4
 */
export const useActionItemStore = create<IActionItemStore>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================
  
  /**
   * List of action items for doctor review
   * Empty array if no action items loaded
   * 
   * Requirements: 8.1
   */
  actionItems: [],
  
  /**
   * Loading state for async operations
   * true when fetching action items or processing actions
   * 
   * Requirements: 8.1
   */
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Fetches all pending action items for a specific doctor
   * 
   * This method:
   * 1. Sets loading state to true
   * 2. Retrieves action items from persistence
   * 3. Filters for pending_doctor status
   * 4. Converts action item models to action item objects
   * 5. Sorts by priority (Red triage first, then by creation date)
   * 6. Updates actionItems state
   * 7. Sets loading state to false
   * 
   * @param doctorId - Doctor user ID
   * @throws Error if fetch fails
   * 
   * Requirements: 8.1
   */
  fetchActionItems: async (doctorId: string) => {
    // Set loading state
    set({ isLoading: true });
    
    try {
      // Simulate async operation (for consistency with future API integration)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get action items from persistence
      const actionItemModels = persistenceService.getActionItems(doctorId);
      
      // Filter for pending doctor review
      const pendingModels = actionItemModels.filter(
        item => item.status === ActionItemStatus.PENDING_DOCTOR
      );
      
      // Convert to ActionItem objects
      const actionItems = pendingModels.map(actionItemModelToActionItem);
      
      // Sort by priority:
      // 1. Red triage items first (highest priority)
      // 2. Then by creation date (oldest first)
      actionItems.sort((a, b) => {
        // Red triage items have highest priority
        const aIsRedTriage = a.type === ActionItemType.TRIAGE && a.triageData?.analysis === 'red';
        const bIsRedTriage = b.type === ActionItemType.TRIAGE && b.triageData?.analysis === 'red';
        
        if (aIsRedTriage && !bIsRedTriage) return -1;
        if (!aIsRedTriage && bIsRedTriage) return 1;
        
        // Otherwise sort by creation date (oldest first)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      
      // Update state
      set({
        actionItems,
        isLoading: false,
      });
    } catch (error) {
      // Log error and reset loading state
      console.error('Failed to fetch action items:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Approves an action item
   * 
   * This method:
   * 1. Finds the action item in the current state
   * 2. Updates the action item status to 'approved' in persistence
   * 3. Records the approval timestamp
   * 4. Removes the item from the local state (no longer pending)
   * 5. Triggers patient notification (future enhancement)
   * 
   * @param itemId - Action item ID to approve
   * @throws Error if item not found or update fails
   * 
   * Requirements: 9.2, 9.4
   */
  approveItem: async (itemId: string) => {
    const { actionItems } = get();
    
    // Find the action item
    const actionItem = actionItems.find(item => item.id === itemId);
    if (!actionItem) {
      throw new Error(`Action item with ID "${itemId}" not found`);
    }
    
    // Check if already approved
    if (actionItem.status === ActionItemStatus.APPROVED) {
      console.warn(`Action item "${itemId}" is already approved`);
      return;
    }
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get action item model from persistence
      const actionItemModel = persistenceService.getActionItem(itemId);
      if (!actionItemModel) {
        throw new Error(`Action item model with ID "${itemId}" not found in persistence`);
      }
      
      // Update action item status in persistence
      const updatedModel: ActionItemModel = {
        ...actionItemModel,
        status: ActionItemStatus.APPROVED,
        updatedAt: new Date().toISOString(),
      };
      persistenceService.saveActionItem(updatedModel);
      
      // Remove from local state (no longer pending)
      const updatedActionItems = actionItems.filter(item => item.id !== itemId);
      
      set({ actionItems: updatedActionItems });
      
      // TODO: Trigger patient notification (future enhancement)
      console.log(`Action item "${itemId}" approved successfully`);
    } catch (error) {
      console.error('Failed to approve action item:', error);
      throw error;
    }
  },

  /**
   * Rejects an action item with a reason
   * 
   * This method:
   * 1. Validates that a rejection reason is provided
   * 2. Finds the action item in the current state
   * 3. Updates the action item status to 'rejected' in persistence
   * 4. Records th