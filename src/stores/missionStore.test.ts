/**
 * Unit tests for MissionStore
 * 
 * Tests:
 * - fetchMissions retrieves and converts missions correctly
 * - completeMission updates mission status
 * - uploadPhoto validates and stores image data
 * - Error handling for invalid operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMissionStore } from './missionStore';
import { persistenceService } from '../services/persistenceService';
import { MissionStatus, MissionType } from '../types';
import type { MissionModel } from '../types';

// Mock the persistence service
vi.mock('../services/persistenceService', () => ({
  persistenceService: {
    getMissions: vi.fn(),
    getMission: vi.fn(),
    saveMission: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('MissionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useMissionStore.getState();
    store.missions = [];
    store.isLoading = false;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('fetchMissions', () => {
    it('should fetch and convert missions for a patient', async () => {
      // Arrange
      const patientId = 'patient-1';
      const mockMissionModels: MissionModel[] = [
        {
          id: 'mission-1',
          patientId,
          type: MissionType.PHOTO_UPLOAD,
          title: 'Scan Incision',
          description: 'Take a photo of your surgical incision',
          status: MissionStatus.PENDING,
          dueDate: new Date('2024-01-15').toISOString(),
        },
        {
          id: 'mission-2',
          patientId,
          type: MissionType.MEDICATION_CHECK,
          title: 'Medication Check',
          description: 'Confirm you took your morning antibiotics',
          status: MissionStatus.PENDING,
          dueDate: new Date('2024-01-14').toISOString(),
        },
      ];

      vi.mocked(persistenceService.getMissions).mockReturnValue(mockMissionModels);

      // Act
      await useMissionStore.getState().fetchMissions(patientId);

      // Assert
      const { missions, isLoading } = useMissionStore.getState();
      
      expect(persistenceService.getMissions).toHaveBeenCalledWith(patientId);
      expect(missions).toHaveLength(2);
      expect(isLoading).toBe(false);
      
      // Check missions are sorted by due date (earliest first)
      expect(missions[0].id).toBe('mission-2'); // Jan 14
      expect(missions[1].id).toBe('mission-1'); // Jan 15
      
      // Check action button text is set correctly
      expect(missions[0].actionButtonText).toBe('Mark Complete');
      expect(missions[1].actionButtonText).toBe('Scan Incision');
    });

    it('should handle empty mission list', async () => {
      // Arrange
      const patientId = 'patient-1';
      vi.mocked(persistenceService.getMissions).mockReturnValue([]);

      // Act
      await useMissionStore.getState().fetchMissions(patientId);

      // Assert
      const { missions, isLoading } = useMissionStore.getState();
      expect(missions).toHaveLength(0);
      expect(isLoading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      // Arrange
      const patientId = 'patient-1';
      vi.mocked(persistenceService.getMissions).mockReturnValue([]);

      // Act
      const fetchPromise = useMissionStore.getState().fetchMissions(patientId);
      
      // Check loading state is true during fetch
      expect(useMissionStore.getState().isLoading).toBe(true);
      
      await fetchPromise;

      // Assert loading state is false after fetch
      expect(useMissionStore.getState().isLoading).toBe(false);
    });

    it('should handle fetch errors', async () => {
      // Arrange
      const patientId = 'patient-1';
      const error = new Error('Database error');
      vi.mocked(persistenceService.getMissions).mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(
        useMissionStore.getState().fetchMissions(patientId)
      ).rejects.toThrow('Database error');
      
      // Loading state should be reset
      expect(useMissionStore.getState().isLoading).toBe(false);
    });
  });

  describe('completeMission', () => {
    beforeEach(() => {
      // Set up initial missions in store
      const missions = [
        {
          id: 'mission-1',
          type: MissionType.MEDICATION_CHECK,
          title: 'Medication Check',
          description: 'Take your pills',
          status: MissionStatus.PENDING,
          dueDate: new Date('2024-01-15'),
          actionButtonText: 'Mark Complete',
        },
      ];
      useMissionStore.setState({ missions });
    });

    it('should mark a mission as completed', async () => {
      // Arrange
      const missionId = 'mission-1';
      const mockMissionModel: MissionModel = {
        id: missionId,
        patientId: 'patient-1',
        type: MissionType.MEDICATION_CHECK,
        title: 'Medication Check',
        description: 'Take your pills',
        status: MissionStatus.PENDING,
        dueDate: new Date('2024-01-15').toISOString(),
      };

      vi.mocked(persistenceService.getMission).mockReturnValue(mockMissionModel);
      vi.mocked(persistenceService.saveMission).mockImplementation(() => {});

      // Act
      await useMissionStore.getState().completeMission(missionId);

      // Assert
      const { missions } = useMissionStore.getState();
      const completedMission = missions.find(m => m.id === missionId);
      
      expect(completedMission?.status).toBe(MissionStatus.COMPLETED);
      expect(persistenceService.saveMission).toHaveBeenCalledWith(
        expect.objectContaining({
          id: missionId,
          status: MissionStatus.COMPLETED,
          completedAt: expect.any(String),
        })
      );
    });

    it('should throw error if mission not found', async () => {
      // Act & Assert
      await expect(
        useMissionStore.getState().completeMission('non-existent-mission')
      ).rejects.toThrow('Mission with ID "non-existent-mission" not found');
    });

    it('should handle already completed missions gracefully', async () => {
      // Arrange
      const missionId = 'mission-1';
      const missions = [
        {
          id: missionId,
          type: MissionType.MEDICATION_CHECK,
          title: 'Medication Check',
          description: 'Take your pills',
          status: MissionStatus.COMPLETED,
          dueDate: new Date('2024-01-15'),
          actionButtonText: 'Mark Complete',
        },
      ];
      useMissionStore.setState({ missions });

      // Act
      await useMissionStore.getState().completeMission(missionId);

      // Assert - should not call persistence service
      expect(persistenceService.saveMission).not.toHaveBeenCalled();
    });
  });

  describe('uploadPhoto', () => {
    beforeEach(() => {
      // Set up initial missions in store
      const missions = [
        {
          id: 'mission-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Scan Incision',
          description: 'Take a photo',
          status: MissionStatus.PENDING,
          dueDate: new Date('2024-01-15'),
          actionButtonText: 'Scan Incision',
        },
        {
          id: 'mission-2',
          type: MissionType.MEDICATION_CHECK,
          title: 'Medication Check',
          description: 'Take your pills',
          status: MissionStatus.PENDING,
          dueDate: new Date('2024-01-15'),
          actionButtonText: 'Mark Complete',
        },
      ];
      useMissionStore.setState({ missions });
    });

    it('should upload photo and mark mission as completed', async () => {
      // Arrange
      const missionId = 'mission-1';
      const mockFile = new File(['fake image data'], 'test.jpg', { type: 'image/jpeg' });
      
      const mockMissionModel: MissionModel = {
        id: missionId,
        patientId: 'patient-1',
        type: MissionType.PHOTO_UPLOAD,
        title: 'Scan Incision',
        description: 'Take a photo',
        status: MissionStatus.PENDING,
        dueDate: new Date('2024-01-15').toISOString(),
      };

      vi.mocked(persistenceService.getMission).mockReturnValue(mockMissionModel);
      vi.mocked(persistenceService.saveMission).mockImplementation(() => {});

      // Act
      await useMissionStore.getState().uploadPhoto(missionId, mockFile);

      // Assert
      const { missions } = useMissionStore.getState();
      const completedMission = missions.find(m => m.id === missionId);
      
      expect(completedMission?.status).toBe(MissionStatus.COMPLETED);
      expect(persistenceService.saveMission).toHaveBeenCalledWith(
        expect.objectContaining({
          id: missionId,
          status: MissionStatus.COMPLETED,
          completedAt: expect.any(String),
          metadata: expect.objectContaining({
            imageFileName: 'test.jpg',
            imageType: 'image/jpeg',
          }),
        })
      );
    });

    it('should throw error if mission not found', async () => {
      // Arrange
      const mockFile = new File(['fake image data'], 'test.jpg', { type: 'image/jpeg' });

      // Act & Assert
      await expect(
        useMissionStore.getState().uploadPhoto('non-existent-mission', mockFile)
      ).rejects.toThrow('Mission with ID "non-existent-mission" not found');
    });

    it('should throw error if mission is not a photo upload mission', async () => {
      // Arrange
      const missionId = 'mission-2'; // This is a medication check mission
      const mockFile = new File(['fake image data'], 'test.jpg', { type: 'image/jpeg' });

      // Act & Assert
      await expect(
        useMissionStore.getState().uploadPhoto(missionId, mockFile)
      ).rejects.toThrow('Mission "mission-2" is not a photo upload mission');
    });

    it('should throw error if file is not an image', async () => {
      // Arrange
      const missionId = 'mission-1';
      const mockFile = new File(['fake data'], 'test.txt', { type: 'text/plain' });

      // Act & Assert
      await expect(
        useMissionStore.getState().uploadPhoto(missionId, mockFile)
      ).rejects.toThrow('File must be an image (JPEG, PNG, or HEIC)');
    });

    it('should throw error if file is too large', async () => {
      // Arrange
      const missionId = 'mission-1';
      // Create a file larger than 10MB
      const largeData = new Array(11 * 1024 * 1024).fill('x').join('');
      const mockFile = new File([largeData], 'large.jpg', { type: 'image/jpeg' });

      // Act & Assert
      await expect(
        useMissionStore.getState().uploadPhoto(missionId, mockFile)
      ).rejects.toThrow('Image must be under 10MB');
    });
  });

  describe('action button text', () => {
    it('should set correct action button text for photo upload missions', async () => {
      // Arrange
      const mockMissionModels: MissionModel[] = [
        {
          id: 'mission-1',
          patientId: 'patient-1',
          type: MissionType.PHOTO_UPLOAD,
          title: 'Scan Incision',
          description: 'Take a photo',
          status: MissionStatus.PENDING,
          dueDate: new Date().toISOString(),
        },
      ];

      vi.mocked(persistenceService.getMissions).mockReturnValue(mockMissionModels);

      // Act
      await useMissionStore.getState().fetchMissions('patient-1');

      // Assert
      const { missions } = useMissionStore.getState();
      expect(missions[0].actionButtonText).toBe('Scan Incision');
    });

    it('should set correct action button text for medication check missions', async () => {
      // Arrange
      const mockMissionModels: MissionModel[] = [
        {
          id: 'mission-1',
          patientId: 'patient-1',
          type: MissionType.MEDICATION_CHECK,
          title: 'Medication Check',
          description: 'Take your pills',
          status: MissionStatus.PENDING,
          dueDate: new Date().toISOString(),
        },
      ];

      vi.mocked(persistenceService.getMissions).mockReturnValue(mockMissionModels);

      // Act
      await useMissionStore.getState().fetchMissions('patient-1');

      // Assert
      const { missions } = useMissionStore.getState();
      expect(missions[0].actionButtonText).toBe('Mark Complete');
    });

    it('should set correct action button text for exercise log missions', async () => {
      // Arrange
      const mockMissionModels: MissionModel[] = [
        {
          id: 'mission-1',
          patientId: 'patient-1',
          type: MissionType.EXERCISE_LOG,
          title: 'Exercise Log',
          description: 'Log your exercise',
          status: MissionStatus.PENDING,
          dueDate: new Date().toISOString(),
        },
      ];

      vi.mocked(persistenceService.getMissions).mockReturnValue(mockMissionModels);

      // Act
      await useMissionStore.getState().fetchMissions('patient-1');

      // Assert
      const { missions } = useMissionStore.getState();
      expect(missions[0].actionButtonText).toBe('Log Exercise');
    });
  });
});
