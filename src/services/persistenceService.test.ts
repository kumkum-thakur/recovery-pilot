/**
 * Unit tests for PersistenceService
 * 
 * Tests generic CRUD operations and domain-specific methods
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersistenceServiceImpl, PersistenceError } from './persistenceService';
import type {
  UserModel,
  MissionModel,
  ActionItemModel,
  ConfigModel,
} from '../types';
import {
  UserRole,
  MissionType,
  MissionStatus,
  ActionItemType,
  ActionItemStatus,
  DemoScenario,
  STORAGE_KEYS,
} from '../types';

describe('PersistenceService', () => {
  let service: PersistenceServiceImpl;

  beforeEach(() => {
    // Create fresh instance for each test
    service = new PersistenceServiceImpl();
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  // ============================================================================
  // Generic CRUD Operations Tests
  // ============================================================================

  describe('Generic CRUD Operations', () => {
    describe('get()', () => {
      it('should return null for non-existent key', () => {
        const result = service.get<string>('non_existent_key');
        expect(result).toBeNull();
      });

      it('should retrieve stored data', () => {
        const testData = { name: 'Test', value: 42 };
        localStorage.setItem('test_key', JSON.stringify(testData));
        
        const result = service.get<typeof testData>('test_key');
        expect(result).toEqual(testData);
      });

      it('should throw PersistenceError for invalid JSON', () => {
        localStorage.setItem('invalid_json', '{invalid json}');
        
        expect(() => service.get('invalid_json')).toThrow(PersistenceError);
        expect(() => service.get('invalid_json')).toThrow(/Invalid JSON format/);
      });

      it('should handle arrays', () => {
        const testArray = [1, 2, 3, 4, 5];
        localStorage.setItem('test_array', JSON.stringify(testArray));
        
        const result = service.get<number[]>('test_array');
        expect(result).toEqual(testArray);
      });

      it('should handle nested objects', () => {
        const testData = {
          user: { id: '1', name: 'Test' },
          settings: { theme: 'dark', notifications: true }
        };
        localStorage.setItem('nested', JSON.stringify(testData));
        
        const result = service.get<typeof testData>('nested');
        expect(result).toEqual(testData);
      });
    });

    describe('set()', () => {
      it('should store data as JSON', () => {
        const testData = { name: 'Test', value: 42 };
        service.set('test_key', testData);
        
        const stored = localStorage.getItem('test_key');
        expect(stored).toBe(JSON.stringify(testData));
      });

      it('should overwrite existing data', () => {
        service.set('test_key', 'first');
        service.set('test_key', 'second');
        
        const result = service.get<string>('test_key');
        expect(result).toBe('second');
      });

      it('should handle arrays', () => {
        const testArray = ['a', 'b', 'c'];
        service.set('test_array', testArray);
        
        const result = service.get<string[]>('test_array');
        expect(result).toEqual(testArray);
      });

      it('should handle null values', () => {
        service.set('test_null', null);
        
        const result = service.get('test_null');
        expect(result).toBeNull();
      });

      it('should handle boolean values', () => {
        service.set('test_bool', true);
        
        const result = service.get<boolean>('test_bool');
        expect(result).toBe(true);
      });

      it('should handle number values', () => {
        service.set('test_number', 42);
        
        const result = service.get<number>('test_number');
        expect(result).toBe(42);
      });
    });

    describe('update()', () => {
      it('should update existing data', () => {
        service.set('counter', 0);
        service.update<number>('counter', (current) => current + 1);
        
        const result = service.get<number>('counter');
        expect(result).toBe(1);
      });

      it('should throw error for non-existent key', () => {
        expect(() => {
          service.update<number>('non_existent', (current) => current + 1);
        }).toThrow(PersistenceError);
        expect(() => {
          service.update<number>('non_existent', (current) => current + 1);
        }).toThrow(/Cannot update non-existent key/);
      });

      it('should handle complex object updates', () => {
        const initial = { count: 0, items: ['a'] };
        service.set('data', initial);
        
        service.update<typeof initial>('data', (current) => ({
          ...current,
          count: current.count + 1,
          items: [...current.items, 'b']
        }));
        
        const result = service.get<typeof initial>('data');
        expect(result).toEqual({ count: 1, items: ['a', 'b'] });
      });

      it('should handle array updates', () => {
        service.set('list', [1, 2, 3]);
        service.update<number[]>('list', (current) => [...current, 4]);
        
        const result = service.get<number[]>('list');
        expect(result).toEqual([1, 2, 3, 4]);
      });
    });

    describe('delete()', () => {
      it('should remove data from storage', () => {
        service.set('test_key', 'test_value');
        service.delete('test_key');
        
        const result = service.get('test_key');
        expect(result).toBeNull();
      });

      it('should not throw error for non-existent key', () => {
        expect(() => service.delete('non_existent')).not.toThrow();
      });
    });
  });

  // ============================================================================
  // User Domain Methods Tests
  // ============================================================================

  describe('User Domain Methods', () => {
    const testUser: UserModel = {
      id: 'user-1',
      username: 'testuser',
      passwordHash: 'hash123',
      name: 'Test User',
      role: UserRole.PATIENT,
      streakCount: 5,
      lastLoginDate: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    describe('saveUser()', () => {
      it('should save a new user', () => {
        service.saveUser(testUser);
        
        const users = service.get<UserModel[]>(STORAGE_KEYS.USERS);
        expect(users).toHaveLength(1);
        expect(users![0]).toEqual(testUser);
      });

      it('should update existing user', () => {
        service.saveUser(testUser);
        
        const updatedUser = { ...testUser, streakCount: 10 };
        service.saveUser(updatedUser);
        
        const users = service.get<UserModel[]>(STORAGE_KEYS.USERS);
        expect(users).toHaveLength(1);
        expect(users![0].streakCount).toBe(10);
      });

      it('should handle multiple users', () => {
        const user2: UserModel = { ...testUser, id: 'user-2', username: 'user2' };
        
        service.saveUser(testUser);
        service.saveUser(user2);
        
        const users = service.get<UserModel[]>(STORAGE_KEYS.USERS);
        expect(users).toHaveLength(2);
      });
    });

    describe('getUser()', () => {
      it('should retrieve user by ID', () => {
        service.saveUser(testUser);
        
        const result = service.getUser('user-1');
        expect(result).toEqual(testUser);
      });

      it('should return null for non-existent user', () => {
        const result = service.getUser('non-existent');
        expect(result).toBeNull();
      });

      it('should return null when no users exist', () => {
        const result = service.getUser('user-1');
        expect(result).toBeNull();
      });
    });

    describe('getUserByUsername()', () => {
      it('should retrieve user by username', () => {
        service.saveUser(testUser);
        
        const result = service.getUserByUsername('testuser');
        expect(result).toEqual(testUser);
      });

      it('should return null for non-existent username', () => {
        const result = service.getUserByUsername('nonexistent');
        expect(result).toBeNull();
      });
    });

    describe('getAllUsers()', () => {
      it('should return empty array when no users exist', () => {
        const result = service.getAllUsers();
        expect(result).toEqual([]);
      });

      it('should return all users', () => {
        const user2: UserModel = { ...testUser, id: 'user-2', username: 'user2' };
        
        service.saveUser(testUser);
        service.saveUser(user2);
        
        const result = service.getAllUsers();
        expect(result).toHaveLength(2);
      });
    });

    describe('deleteUser()', () => {
      it('should delete user by ID', () => {
        service.saveUser(testUser);
        service.deleteUser('user-1');
        
        const result = service.getUser('user-1');
        expect(result).toBeNull();
      });

      it('should not affect other users', () => {
        const user2: UserModel = { ...testUser, id: 'user-2', username: 'user2' };
        
        service.saveUser(testUser);
        service.saveUser(user2);
        service.deleteUser('user-1');
        
        const result = service.getUser('user-2');
        expect(result).toEqual(user2);
      });
    });
  });

  // ============================================================================
  // Mission Domain Methods Tests
  // ============================================================================

  describe('Mission Domain Methods', () => {
    const testMission: MissionModel = {
      id: 'mission-1',
      patientId: 'patient-1',
      type: MissionType.PHOTO_UPLOAD,
      title: 'Test Mission',
      description: 'Test description',
      status: MissionStatus.PENDING,
      dueDate: '2024-01-01T00:00:00.000Z',
    };

    describe('saveMission()', () => {
      it('should save a new mission', () => {
        service.saveMission(testMission);
        
        const missions = service.get<MissionModel[]>(STORAGE_KEYS.MISSIONS);
        expect(missions).toHaveLength(1);
        expect(missions![0]).toEqual(testMission);
      });

      it('should update existing mission', () => {
        service.saveMission(testMission);
        
        const updatedMission = { ...testMission, status: MissionStatus.COMPLETED };
        service.saveMission(updatedMission);
        
        const missions = service.get<MissionModel[]>(STORAGE_KEYS.MISSIONS);
        expect(missions).toHaveLength(1);
        expect(missions![0].status).toBe(MissionStatus.COMPLETED);
      });
    });

    describe('getMissions()', () => {
      it('should retrieve missions for a patient', () => {
        const mission2: MissionModel = { ...testMission, id: 'mission-2', patientId: 'patient-2' };
        
        service.saveMission(testMission);
        service.saveMission(mission2);
        
        const result = service.getMissions('patient-1');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('mission-1');
      });

      it('should return empty array for patient with no missions', () => {
        const result = service.getMissions('patient-1');
        expect(result).toEqual([]);
      });
    });

    describe('getMission()', () => {
      it('should retrieve mission by ID', () => {
        service.saveMission(testMission);
        
        const result = service.getMission('mission-1');
        expect(result).toEqual(testMission);
      });

      it('should return null for non-existent mission', () => {
        const result = service.getMission('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('getAllMissions()', () => {
      it('should return empty array when no missions exist', () => {
        const result = service.getAllMissions();
        expect(result).toEqual([]);
      });

      it('should return all missions', () => {
        const mission2: MissionModel = { ...testMission, id: 'mission-2' };
        
        service.saveMission(testMission);
        service.saveMission(mission2);
        
        const result = service.getAllMissions();
        expect(result).toHaveLength(2);
      });
    });

    describe('deleteMission()', () => {
      it('should delete mission by ID', () => {
        service.saveMission(testMission);
        service.deleteMission('mission-1');
        
        const result = service.getMission('mission-1');
        expect(result).toBeNull();
      });
    });
  });

  // ============================================================================
  // Action Item Domain Methods Tests
  // ============================================================================

  describe('Action Item Domain Methods', () => {
    const testActionItem: ActionItemModel = {
      id: 'item-1',
      patientId: 'patient-1',
      patientName: 'Test Patient',
      type: ActionItemType.TRIAGE,
      status: ActionItemStatus.PENDING_DOCTOR,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    describe('saveActionItem()', () => {
      it('should save a new action item', () => {
        service.saveActionItem(testActionItem);
        
        const items = service.get<ActionItemModel[]>(STORAGE_KEYS.ACTION_ITEMS);
        expect(items).toHaveLength(1);
        expect(items![0]).toEqual(testActionItem);
      });

      it('should update existing action item', () => {
        service.saveActionItem(testActionItem);
        
        const updatedItem = { ...testActionItem, status: ActionItemStatus.APPROVED };
        service.saveActionItem(updatedItem);
        
        const items = service.get<ActionItemModel[]>(STORAGE_KEYS.ACTION_ITEMS);
        expect(items).toHaveLength(1);
        expect(items![0].status).toBe(ActionItemStatus.APPROVED);
      });
    });

    describe('getActionItems()', () => {
      it('should retrieve all action items when no doctorId provided', () => {
        const item2: ActionItemModel = { ...testActionItem, id: 'item-2' };
        
        service.saveActionItem(testActionItem);
        service.saveActionItem(item2);
        
        const result = service.getActionItems();
        expect(result).toHaveLength(2);
      });

      it('should filter by doctorId when provided', () => {
        const item1 = { ...testActionItem, doctorId: 'doctor-1' };
        const item2 = { ...testActionItem, id: 'item-2', doctorId: 'doctor-2' };
        
        service.saveActionItem(item1);
        service.saveActionItem(item2);
        
        const result = service.getActionItems('doctor-1');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('item-1');
      });

      it('should return empty array when no items exist', () => {
        const result = service.getActionItems();
        expect(result).toEqual([]);
      });
    });

    describe('getActionItem()', () => {
      it('should retrieve action item by ID', () => {
        service.saveActionItem(testActionItem);
        
        const result = service.getActionItem('item-1');
        expect(result).toEqual(testActionItem);
      });

      it('should return null for non-existent item', () => {
        const result = service.getActionItem('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('deleteActionItem()', () => {
      it('should delete action item by ID', () => {
        service.saveActionItem(testActionItem);
        service.deleteActionItem('item-1');
        
        const result = service.getActionItem('item-1');
        expect(result).toBeNull();
      });
    });
  });

  // ============================================================================
  // Configuration Domain Methods Tests
  // ============================================================================

  describe('Configuration Domain Methods', () => {
    const testConfig: ConfigModel = {
      demoScenario: DemoScenario.SCENARIO_HAPPY_PATH,
      mockDelayMs: 1000,
    };

    describe('saveConfig()', () => {
      it('should save configuration', () => {
        service.saveConfig(testConfig);
        
        const config = service.get<ConfigModel>(STORAGE_KEYS.CONFIG);
        expect(config).toEqual(testConfig);
      });

      it('should overwrite existing configuration', () => {
        service.saveConfig(testConfig);
        
        const newConfig: ConfigModel = {
          demoScenario: DemoScenario.SCENARIO_RISK_DETECTED,
          mockDelayMs: 500,
        };
        service.saveConfig(newConfig);
        
        const result = service.getConfig();
        expect(result).toEqual(newConfig);
      });
    });

    describe('getConfig()', () => {
      it('should retrieve configuration', () => {
        service.saveConfig(testConfig);
        
        const result = service.getConfig();
        expect(result).toEqual(testConfig);
      });

      it('should return null when no config exists', () => {
        const result = service.getConfig();
        expect(result).toBeNull();
      });
    });
  });

  // ============================================================================
  // Utility Methods Tests
  // ============================================================================

  describe('Utility Methods', () => {
    describe('clearAll()', () => {
      it('should clear all RecoveryPilot data', () => {
        service.set(STORAGE_KEYS.USERS, []);
        service.set(STORAGE_KEYS.MISSIONS, []);
        service.set(STORAGE_KEYS.ACTION_ITEMS, []);
        service.set(STORAGE_KEYS.CONFIG, {});
        
        service.clearAll();
        
        expect(service.get(STORAGE_KEYS.USERS)).toBeNull();
        expect(service.get(STORAGE_KEYS.MISSIONS)).toBeNull();
        expect(service.get(STORAGE_KEYS.ACTION_ITEMS)).toBeNull();
        expect(service.get(STORAGE_KEYS.CONFIG)).toBeNull();
      });
    });

    describe('isAvailable()', () => {
      it('should return true when localStorage is available', () => {
        const result = service.isAvailable();
        expect(result).toBe(true);
      });
    });

    describe('getStorageSize()', () => {
      it('should return 0 for empty storage', () => {
        const size = service.getStorageSize();
        expect(size).toBe(0);
      });

      it('should return positive number when data exists', () => {
        service.set('test', 'data');
        const size = service.getStorageSize();
        expect(size).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should throw PersistenceError with descriptive message', () => {
      localStorage.setItem('bad_json', '{invalid}');
      
      try {
        service.get('bad_json');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(PersistenceError);
        expect((error as PersistenceError).message).toContain('Invalid JSON format');
      }
    });

    it('should include cause in PersistenceError', () => {
      localStorage.setItem('bad_json', '{invalid}');
      
      try {
        service.get('bad_json');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(PersistenceError);
        expect((error as PersistenceError).cause).toBeDefined();
      }
    });
  });
});
