/**
 * Debug test for ActionItemStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceService } from '../services/persistenceService';
import type { ActionItemModel } from '../types';
import { ActionItemStatus, ActionItemType, TriageAnalysis } from '../types';
import { STORAGE_KEYS } from '../types';

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

describe('ActionItemStore Debug', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and retrieve action item', () => {
    console.log('Before save - localStorage:', localStorage.getItem(STORAGE_KEYS.ACTION_ITEMS));
    
    persistenceService.saveActionItem(mockTriageActionItem);
    
    console.log('After save - localStorage:', localStorage.getItem(STORAGE_KEYS.ACTION_ITEMS));
    
    const items = persistenceService.getActionItems();
    console.log('Retrieved items:', items);
    
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('action-item-triage-1');
    expect(items[0].status).toBe(ActionItemStatus.PENDING_DOCTOR);
  });

  it('should test fetchActionItems from store', async () => {
    const { useActionItemStore } = await import('./actionItemStore');
    
    // Save action item
    persistenceService.saveActionItem(mockTriageActionItem);
    
    console.log('Before fetch - localStorage:', localStorage.getItem(STORAGE_KEYS.ACTION_ITEMS));
    
    // Check what getActionItems returns
    const itemsFromPersistence = persistenceService.getActionItems('doctor-1');
    console.log('Items from persistence:', itemsFromPersistence);
    console.log('First item status:', itemsFromPersistence[0]?.status);
    console.log('ActionItemStatus.PENDING_DOCTOR:', ActionItemStatus.PENDING_DOCTOR);
    console.log('Status match:', itemsFromPersistence[0]?.status === ActionItemStatus.PENDING_DOCTOR);
    
    const store = useActionItemStore.getState();
    await store.fetchActionItems('doctor-1');
    
    const { actionItems } = useActionItemStore.getState();
    console.log('After fetch - actionItems:', actionItems);
    
    expect(actionItems).toHaveLength(1);
  });
});
