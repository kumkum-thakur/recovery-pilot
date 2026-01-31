/**
 * Unit tests for MissionStore streak-related functionality
 * 
 * Tests the areAllDailyMissionsCompleted method
 * Requirements: 10.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMissionStore } from './missionStore';
import { persistenceService } from '../services/persistenceService';
import { MissionType, MissionStatus } from '../types';
import type { MissionModel } from '../types';

describe('MissionStore - Streak Tracking', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset store state
    const store = useMissionStore.getState();
    store.missions = [];
    store.isLoading = false;
  });

  describe('areAllDailyMissionsCompleted', () => {
    it('should return false when no missions exist', () => {
      const store = useMissionStore.getState();
      
      expect(store.areAllDailyMissionsCompleted()).toBe(false);
    });

    it('should return false when no missions are due today', () => {
      // Create missions for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const missions: MissionModel[] = [
        {
          id: 'mission-1',
          patientId: 'patient-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Mission 1',
          description: 'Test mission',
          status: MissionStatus.PENDING,
          dueDate: tomorrow.toISOString(),
        },
      ];
      
      missions.forEach(m => persistenceService.saveMission(m));
      
      const store = useMissionStore.getState();
      store.fetchMissions('patient-1');
      
      expect(store.areAllDailyMissionsCompleted()).toBe(false);
    });

    it('should return false when some today missions are pending', () => {
      // Create missions for today
      const today = new Date();
      
      const missions: MissionModel[] = [
        {
          id: 'mission-1',
          patientId: 'patient-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Mission 1',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: today.toISOString(),
        },
        {
          id: 'mission-2',
          patientId: 'patient-1',
          type: MissionType.MEDICATION_CHECK,
          title: 'Mission 2',
          description: 'Test mission',
          status: MissionStatus.PENDING,
          dueDate: today.toISOString(),
        },
      ];
      
      missions.forEach(m => persistenceService.saveMission(m));
      
      const store = useMissionStore.getState();
      store.fetchMissions('patient-1');
      
      expect(store.areAllDailyMissionsCompleted()).toBe(false);
    });

    it('should return true when all today missions are completed', async () => {
      // Requirement 10.1: Check if all daily missions are completed
      const today = new Date();
      
      const missions: MissionModel[] = [
        {
          id: 'mission-1',
          patientId: 'patient-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Mission 1',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: today.toISOString(),
        },
        {
          id: 'mission-2',
          patientId: 'patient-1',
          type: MissionType.MEDICATION_CHECK,
          title: 'Mission 2',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: today.toISOString(),
        },
      ];
      
      missions.forEach(m => persistenceService.saveMission(m));
      
      const store = useMissionStore.getState();
      await store.fetchMissions('patient-1');
      
      expect(store.areAllDailyMissionsCompleted()).toBe(true);
    });

    it('should only check today missions, not past or future', async () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const missions: MissionModel[] = [
        // Yesterday - pending (should not affect result)
        {
          id: 'mission-yesterday',
          patientId: 'patient-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Yesterday Mission',
          description: 'Test mission',
          status: MissionStatus.PENDING,
          dueDate: yesterday.toISOString(),
        },
        // Today - all completed
        {
          id: 'mission-today-1',
          patientId: 'patient-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Today Mission 1',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: today.toISOString(),
        },
        {
          id: 'mission-today-2',
          patientId: 'patient-1',
          type: MissionType.MEDICATION_CHECK,
          title: 'Today Mission 2',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: today.toISOString(),
        },
        // Tomorrow - pending (should not affect result)
        {
          id: 'mission-tomorrow',
          patientId: 'patient-1',
          type: MissionType.EXERCISE_LOG,
          title: 'Tomorrow Mission',
          description: 'Test mission',
          status: MissionStatus.PENDING,
          dueDate: tomorrow.toISOString(),
        },
      ];
      
      missions.forEach(m => persistenceService.saveMission(m));
      
      const store = useMissionStore.getState();
      await store.fetchMissions('patient-1');
      
      // Should return true because all TODAY missions are completed
      expect(store.areAllDailyMissionsCompleted()).toBe(true);
    });

    it('should handle missions with different times on same day', async () => {
      const today = new Date();
      
      // Create missions with different times but same day
      const morning = new Date(today);
      morning.setHours(8, 0, 0, 0);
      
      const afternoon = new Date(today);
      afternoon.setHours(14, 30, 0, 0);
      
      const evening = new Date(today);
      evening.setHours(20, 0, 0, 0);
      
      const missions: MissionModel[] = [
        {
          id: 'mission-morning',
          patientId: 'patient-1',
          type: MissionType.MEDICATION_CHECK,
          title: 'Morning Mission',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: morning.toISOString(),
        },
        {
          id: 'mission-afternoon',
          patientId: 'patient-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Afternoon Mission',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: afternoon.toISOString(),
        },
        {
          id: 'mission-evening',
          patientId: 'patient-1',
          type: MissionType.EXERCISE_LOG,
          title: 'Evening Mission',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: evening.toISOString(),
        },
      ];
      
      missions.forEach(m => persistenceService.saveMission(m));
      
      const store = useMissionStore.getState();
      await store.fetchMissions('patient-1');
      
      // All missions are on the same day and completed
      expect(store.areAllDailyMissionsCompleted()).toBe(true);
    });

    it('should return false if any today mission is overdue', async () => {
      const today = new Date();
      
      const missions: MissionModel[] = [
        {
          id: 'mission-1',
          patientId: 'patient-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Mission 1',
          description: 'Test mission',
          status: MissionStatus.COMPLETED,
          dueDate: today.toISOString(),
        },
        {
          id: 'mission-2',
          patientId: 'patient-1',
          type: MissionType.MEDICATION_CHECK,
          title: 'Mission 2',
          description: 'Test mission',
          status: MissionStatus.OVERDUE,
          dueDate: today.toISOString(),
        },
      ];
      
      missions.forEach(m => persistenceService.saveMission(m));
      
      const store = useMissionStore.getState();
      await store.fetchMissions('patient-1');
      
      // One mission is overdue, so not all are completed
      expect(store.areAllDailyMissionsCompleted()).toBe(false);
    });
  });
});
