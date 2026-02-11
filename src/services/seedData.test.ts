/**
 * Unit tests for seed data
 * 
 * Validates that seed data is correctly structured and contains
 * all required fields for users and missions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SEED_USERS, SEED_MISSIONS, initializeSeedData } from './seedData';
import { UserRole, MissionType, MissionStatus } from '../types';

describe('Seed Data', () => {
  describe('SEED_USERS', () => {
    it('should contain exactly 3 users (1 admin, 1 patient, 1 doctor)', () => {
      expect(SEED_USERS).toHaveLength(3);
      
      const admins = SEED_USERS.filter(u => u.role === UserRole.ADMIN);
      const patients = SEED_USERS.filter(u => u.role === UserRole.PATIENT);
      const doctors = SEED_USERS.filter(u => u.role === UserRole.DOCTOR);
      
      expect(admins).toHaveLength(1);
      expect(patients).toHaveLength(1);
      expect(doctors).toHaveLength(1);
    });

    it('should have patient with correct structure', () => {
      const patient = SEED_USERS.find(u => u.role === UserRole.PATIENT);
      
      expect(patient).toBeDefined();
      expect(patient?.id).toBe('patient-1');
      expect(patient?.username).toBe('divya');
      expect(patient?.name).toBe('Divya Patel');
      expect(patient?.passwordHash).toBe('simple_hash_divya');
      expect(patient?.streakCount).toBe(3);
      expect(patient?.lastLoginDate).toBeDefined();
      expect(patient?.createdAt).toBeDefined();
    });

    it('should have doctor with correct structure', () => {
      const doctor = SEED_USERS.find(u => u.role === UserRole.DOCTOR);
      
      expect(doctor).toBeDefined();
      expect(doctor?.id).toBe('doctor-1');
      expect(doctor?.username).toBe('dr.smith');
      expect(doctor?.name).toBe('Dr. Sarah Smith');
      expect(doctor?.passwordHash).toBe('simple_hash_smith');
      expect(doctor?.streakCount).toBe(0);
      expect(doctor?.lastLoginDate).toBeDefined();
      expect(doctor?.createdAt).toBeDefined();
    });

    it('should have valid ISO date strings for timestamps', () => {
      SEED_USERS.forEach(user => {
        // Should be valid ISO date strings
        expect(() => new Date(user.lastLoginDate)).not.toThrow();
        expect(() => new Date(user.createdAt)).not.toThrow();
        
        // Should be valid dates (not Invalid Date)
        expect(new Date(user.lastLoginDate).toString()).not.toBe('Invalid Date');
        expect(new Date(user.createdAt).toString()).not.toBe('Invalid Date');
      });
    });

    it('should have unique user IDs', () => {
      const ids = SEED_USERS.map(u => u.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique usernames', () => {
      const usernames = SEED_USERS.map(u => u.username);
      const uniqueUsernames = new Set(usernames);
      
      expect(uniqueUsernames.size).toBe(usernames.length);
    });
  });

  describe('SEED_MISSIONS', () => {
    it('should contain exactly 2 missions', () => {
      expect(SEED_MISSIONS).toHaveLength(2);
    });

    it('should have photo upload mission with correct structure', () => {
      const photoMission = SEED_MISSIONS.find(m => m.type === MissionType.PHOTO_UPLOAD);
      
      expect(photoMission).toBeDefined();
      expect(photoMission?.id).toBe('mission-1');
      expect(photoMission?.patientId).toBe('patient-1');
      expect(photoMission?.title).toBe('Mission 1: Scan Incision');
      expect(photoMission?.description).toContain('photo');
      expect(photoMission?.status).toBe(MissionStatus.PENDING);
      expect(photoMission?.dueDate).toBeDefined();
    });

    it('should have medication check mission with correct structure', () => {
      const medMission = SEED_MISSIONS.find(m => m.type === MissionType.MEDICATION_CHECK);
      
      expect(medMission).toBeDefined();
      expect(medMission?.id).toBe('mission-2');
      expect(medMission?.patientId).toBe('patient-1');
      expect(medMission?.title).toBe('Mission 2: Medication Check');
      expect(medMission?.description).toContain('antibiotics');
      expect(medMission?.status).toBe(MissionStatus.PENDING);
      expect(medMission?.dueDate).toBeDefined();
    });

    it('should have valid ISO date strings for due dates', () => {
      SEED_MISSIONS.forEach(mission => {
        // Should be valid ISO date strings
        expect(() => new Date(mission.dueDate)).not.toThrow();
        
        // Should be valid dates (not Invalid Date)
        expect(new Date(mission.dueDate).toString()).not.toBe('Invalid Date');
      });
    });

    it('should have unique mission IDs', () => {
      const ids = SEED_MISSIONS.map(m => m.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should all belong to the same patient', () => {
      const patientIds = SEED_MISSIONS.map(m => m.patientId);
      const uniquePatientIds = new Set(patientIds);
      
      expect(uniquePatientIds.size).toBe(1);
      expect(uniquePatientIds.has('patient-1')).toBe(true);
    });

    it('should all have pending status initially', () => {
      SEED_MISSIONS.forEach(mission => {
        expect(mission.status).toBe(MissionStatus.PENDING);
      });
    });
  });

  describe('initializeSeedData', () => {
    let mockPersistenceService: {
      getAllUsers: ReturnType<typeof vi.fn>;
      saveUser: ReturnType<typeof vi.fn>;
      getAllMissions: ReturnType<typeof vi.fn>;
      saveMission: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockPersistenceService = {
        getAllUsers: vi.fn(),
        saveUser: vi.fn(),
        getAllMissions: vi.fn(),
        saveMission: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
      };
    });

    it('should initialize users when none exist', () => {
      mockPersistenceService.getAllUsers.mockReturnValue([]);
      mockPersistenceService.getAllMissions.mockReturnValue([]);
      mockPersistenceService.get = vi.fn().mockReturnValue(null);
      mockPersistenceService.set = vi.fn();

      initializeSeedData(mockPersistenceService);

      expect(mockPersistenceService.saveUser).toHaveBeenCalledTimes(3);
      expect(mockPersistenceService.saveUser).toHaveBeenCalledWith(SEED_USERS[0]);
      expect(mockPersistenceService.saveUser).toHaveBeenCalledWith(SEED_USERS[1]);
      expect(mockPersistenceService.saveUser).toHaveBeenCalledWith(SEED_USERS[2]);
    });

    it('should not initialize users when they already exist', () => {
      mockPersistenceService.getAllUsers.mockReturnValue(SEED_USERS);
      mockPersistenceService.getAllMissions.mockReturnValue([]);
      mockPersistenceService.get = vi.fn().mockReturnValue(null);
      mockPersistenceService.set = vi.fn();

      initializeSeedData(mockPersistenceService);

      expect(mockPersistenceService.saveUser).not.toHaveBeenCalled();
    });

    it('should initialize missions when none exist', () => {
      mockPersistenceService.getAllUsers.mockReturnValue([]);
      mockPersistenceService.getAllMissions.mockReturnValue([]);
      mockPersistenceService.get = vi.fn().mockReturnValue(null);
      mockPersistenceService.set = vi.fn();

      initializeSeedData(mockPersistenceService);

      expect(mockPersistenceService.saveMission).toHaveBeenCalledTimes(2);
      expect(mockPersistenceService.saveMission).toHaveBeenCalledWith(SEED_MISSIONS[0]);
      expect(mockPersistenceService.saveMission).toHaveBeenCalledWith(SEED_MISSIONS[1]);
    });

    it('should not initialize missions when they already exist', () => {
      mockPersistenceService.getAllUsers.mockReturnValue([]);
      mockPersistenceService.getAllMissions.mockReturnValue(SEED_MISSIONS);
      mockPersistenceService.get = vi.fn().mockReturnValue(null);
      mockPersistenceService.set = vi.fn();

      initializeSeedData(mockPersistenceService);

      expect(mockPersistenceService.saveMission).not.toHaveBeenCalled();
    });

    it('should handle partial initialization (users exist, missions do not)', () => {
      mockPersistenceService.getAllUsers.mockReturnValue(SEED_USERS);
      mockPersistenceService.getAllMissions.mockReturnValue([]);
      mockPersistenceService.get = vi.fn().mockReturnValue(null);
      mockPersistenceService.set = vi.fn();

      initializeSeedData(mockPersistenceService);

      expect(mockPersistenceService.saveUser).not.toHaveBeenCalled();
      expect(mockPersistenceService.saveMission).toHaveBeenCalledTimes(2);
    });

    it('should handle partial initialization (missions exist, users do not)', () => {
      mockPersistenceService.getAllUsers.mockReturnValue([]);
      mockPersistenceService.getAllMissions.mockReturnValue(SEED_MISSIONS);
      mockPersistenceService.get = vi.fn().mockReturnValue(null);
      mockPersistenceService.set = vi.fn();

      initializeSeedData(mockPersistenceService);

      expect(mockPersistenceService.saveUser).toHaveBeenCalledTimes(3);
      expect(mockPersistenceService.saveMission).not.toHaveBeenCalled();
    });
  });
});
