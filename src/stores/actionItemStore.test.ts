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
      expect(actionItems[0].id).toBe('action-item-triage-1