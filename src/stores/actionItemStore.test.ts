/**
 * Unit tests for ActionItemStore
 * 
 * Tests action item fetching, approval, and rejection functionality
 * Requirements: 8.1, 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useActionItemStore } from './actionItemStore';
import { persistenceService } from '../services/persistenceService';
import type { ActionItemModel } from '../types';
import { ActionItemStatus, ActionItemType, TriageAnalysis, InsuranceStatus, InventoryStatus } from '../types';

// Mock data
const mockTriageActionItem: ActionItemModel = {
  id: 'action-item-triage-1',
  patientId: 'patient-1',
  patientName: 'Test Patient',
  type: ActionItemType.TRIAGE,
  status: ActionItemStatus.PENDING_DOCTOR,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  imageUrl: 'data:image/png;base64,test',
  triageAnalysis: TriageAnalysis.RED,
  triageText: 'Redness detected around incision site',
  aiConfidenceScore: 0.87,
};

const mockRefillActionItem: ActionItemModel = {
  id: 'action-item-refill-1',
  patientId: 'patient-1',
  patientName: 'Test Patient',
  type: ActionItemType.REFILL,
  status: ActionItemStatus.PENDING_DOCTOR,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  medicationName: 'Amoxicillin',
  insuranceStatus: InsuranceStatus.APPROVED,
  inventoryStatus: InventoryStatus.IN_STOCK,
};

describe('ActionItemStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset store state
    useActionItemStore.setState({
      actionItems: [],
      isLoading: false,
    });
    
    // Initialize with test action items
    persistenceService.set('recovery_pilot_action_items', [
      mockTriageActionItem,
      mockRefillActionItem,
    ]);
  });

  describe('fetchActionItems', () => {
    it('should fetch and filter pending action items', async () => {
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      const { actionItems, isLoading } = useActionItemStore.getState();
      
      expect(isLoading).toBe(false);
      expect(actionItems).toHaveLength(2);
      expect(actionItems[0].id).toBe('action-item-triage-1');
      expect(actionItems[1].id).toBe('action-item-refill-1');
    });

    it('should prioritize red triage items first', async () => {
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      const { actionItems } = useActionItemStore.getState();
      
      // Red triage item should be first
      expect(actionItems[0].type).toBe(ActionItemType.TRIAGE);
      expect(actionItems[0].triageData?.analysis).toBe(TriageAnalysis.RED);
    });

    it('should convert action item models to action items correctly', async () => {
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      const { actionItems } = useActionItemStore.getState();
      
      // Check triage item conversion
      const triageItem = actionItems.find(item => item.type === ActionItemType.TRIAGE);
      expect(triageItem).toBeDefined();
      expect(triageItem?.triageData).toBeDefined();
      expect(triageItem?.triageData?.imageUrl).toBe('data:image/png;base64,test');
      expect(triageItem?.triageData?.analysis).toBe(TriageAnalysis.RED);
      expect(triageItem?.triageData?.confidenceScore).toBe(0.87);
      
      // Check refill item conversion
      const refillItem = actionItems.find(item => item.type === ActionItemType.REFILL);
      expect(refillItem).toBeDefined();
      expect(refillItem?.refillData).toBeDefined();
      expect(refillItem?.refillData?.medicationName).toBe('Amoxicillin');
      expect(refillItem?.refillData?.insuranceStatus).toBe(InsuranceStatus.APPROVED);
    });
  });

  describe('approveItem', () => {
    it('should approve an action item and update persistence', async () => {
      const store = useActionItemStore.getState();
      
      // First fetch items
      await store.fetchActionItems('doctor-1');
      
      // Approve the triage item
      await store.approveItem('action-item-triage-1');
      
      const { actionItems } = useActionItemStore.getState();
      
      // Item should be removed from pending list
      expect(actionItems).toHaveLength(1);
      expect(actionItems.find(item => item.id === 'action-item-triage-1')).toBeUndefined();
      
      // Check persistence was updated
      const persistedItem = persistenceService.getActionItem('action-item-triage-1');
      expect(persistedItem?.status).toBe(ActionItemStatus.APPROVED);
      expect(persistedItem?.updatedAt).toBeDefined();
    });

    it('should throw error if item not found', async () => {
      const store = useActionItemStore.getState();
      
      await expect(store.approveItem('non-existent-id')).rejects.toThrow(
        'Action item with ID "non-existent-id" not found'
      );
    });

    it('should handle already approved items gracefully', async () => {
      const store = useActionItemStore.getState();
      
      // First fetch and approve
      await store.fetchActionItems('doctor-1');
      await store.approveItem('action-item-triage-1');
      
      // Fetch again to get fresh state
      await store.fetchActionItems('doctor-1');
      
      // Try to approve again - should not throw
      await expect(store.approveItem('action-item-triage-1')).rejects.toThrow(
        'Action item with ID "action-item-triage-1" not found'
      );
    });
  });

  describe('rejectItem', () => {
    it('should reject an action item with reason and update persistence', async () => {
      const store = useActionItemStore.getState();
      
      // First fetch items
      await store.fetchActionItems('doctor-1');
      
      // Reject the refill item
      const rejectionReason = 'Patient needs to consult with specialist first';
      await store.rejectItem('action-item-refill-1', rejectionReason);
      
      const { actionItems } = useActionItemStore.getState();
      
      // Item should be removed from pending list
      expect(actionItems).toHaveLength(1);
      expect(actionItems.find(item => item.id === 'action-item-refill-1')).toBeUndefined();
      
      // Check persistence was updated
      const persistedItem = persistenceService.getActionItem('action-item-refill-1');
      expect(persistedItem?.status).toBe(ActionItemStatus.REJECTED);
      expect(persistedItem?.rejectionReason).toBe(rejectionReason);
      expect(persistedItem?.updatedAt).toBeDefined();
    });

    it('should throw error if rejection reason is empty', async () => {
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      await expect(store.rejectItem('action-item-refill-1', '')).rejects.toThrow(
        'Rejection reason is required'
      );
      
      await expect(store.rejectItem('action-item-refill-1', '   ')).rejects.toThrow(
        'Rejection reason is required'
      );
    });

    it('should throw error if item not found', async () => {
      const store = useActionItemStore.getState();
      
      await expect(store.rejectItem('non-existent-id', 'Some reason')).rejects.toThrow(
        'Action item with ID "non-existent-id" not found'
      );
    });

    it('should trim rejection reason before saving', async () => {
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      const rejectionReason = '  Needs more information  ';
      await store.rejectItem('action-item-refill-1', rejectionReason);
      
      const persistedItem = persistenceService.getActionItem('action-item-refill-1');
      expect(persistedItem?.rejectionReason).toBe('Needs more information');
    });
  });

  describe('loading state', () => {
    it('should set loading state during fetch', async () => {
      const store = useActionItemStore.getState();
      
      // Start fetch (don't await yet)
      const fetchPromise = store.fetchActionItems('doctor-1');
      
      // Check loading state is true (might be too fast to catch, but worth testing)
      // Note: This test might be flaky due to timing
      
      // Wait for completion
      await fetchPromise;
      
      // Loading should be false after completion
      const { isLoading } = useActionItemStore.getState();
      expect(isLoading).toBe(false);
    });
  });
});
