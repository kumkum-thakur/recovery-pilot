/**
 * PersistenceService - Data persistence layer using LocalStorage
 * 
 * Provides generic CRUD operations and domain-specific methods for:
 * - User profile management
 * - Mission tracking
 * - Action item management
 * - Configuration storage
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import type {
  UserModel,
  MissionModel,
  ActionItemModel,
  ConfigModel,
  PersistenceService as IPersistenceService,
} from '../types';
import { STORAGE_KEYS } from '../types';

/**
 * Error class for persistence-related errors
 */
export class PersistenceError extends Error {
  cause?: unknown;
  
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PersistenceError';
    this.cause = cause;
  }
}

/**
 * Implementation of PersistenceService using LocalStorage
 * 
 * Handles JSON serialization/deserialization with comprehensive error handling
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
class PersistenceServiceImpl implements IPersistenceService {
  /**
   * Generic get operation - retrieves and deserializes data from LocalStorage
   * 
   * @param key - Storage key
   * @returns Deserialized data or null if not found
   * @throws PersistenceError if deserialization fails
   * 
   * Requirement 12.4: JSON deserialization with error handling
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      
      if (item === null) {
        return null;
      }
      
      // Parse JSON with error handling
      const parsed = JSON.parse(item) as T;
      return parsed;
    } catch (error) {
      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        throw new PersistenceError(
          `Failed to parse data for key "${key}": Invalid JSON format`,
          error
        );
      }
      
      throw new PersistenceError(
        `Failed to retrieve data for key "${key}"`,
        error
      );
    }
  }

  /**
   * Generic set operation - serializes and stores data in LocalStorage
   * 
   * @param key - Storage key
   * @param value - Data to store
   * @throws PersistenceError if serialization or storage fails
   * 
   * Requirement 12.4: JSON serialization with error handling
   */
  set<T>(key: string, value: T): void {
    try {
      // Serialize to JSON
      const serialized = JSON.stringify(value);
      
      // Store in LocalStorage
      localStorage.setItem(key, serialized);
    } catch (error) {
      // Handle quota exceeded errors
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new PersistenceError(
          'Storage quota exceeded. Please clear some data or contact support.',
          error
        );
      }
      
      // Handle serialization errors (circular references, etc.)
      if (error instanceof TypeError) {
        throw new PersistenceError(
          `Failed to serialize data for key "${key}": Data contains non-serializable values`,
          error
        );
      }
      
      throw new PersistenceError(
        `Failed to store data for key "${key}"`,
        error
      );
    }
  }

  /**
   * Generic update operation - retrieves, updates, and stores data
   * 
   * @param key - Storage key
   * @param updater - Function to transform current value
   * @throws PersistenceError if retrieval, update, or storage fails
   * 
   * Requirement 12.2: Data persistence with update operations
   */
  update<T>(key: string, updater: (current: T) => T): void {
    try {
      // Get current value
      const current = this.get<T>(key);
      
      if (current === null) {
        throw new PersistenceError(
          `Cannot update non-existent key "${key}". Use set() to create new data.`
        );
      }
      
      // Apply updater function
      const updated = updater(current);
      
      // Store updated value
      this.set(key, updated);
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      
      throw new PersistenceError(
        `Failed to update data for key "${key}"`,
        error
      );
    }
  }

  /**
   * Generic delete operation - removes data from LocalStorage
   * 
   * @param key - Storage key
   * 
   * Requirement 12.1: Generic CRUD operations
   */
  delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      throw new PersistenceError(
        `Failed to delete data for key "${key}"`,
        error
      );
    }
  }

  // ============================================================================
  // Domain-Specific Methods - Users
  // ============================================================================

  /**
   * Retrieves a user by ID
   * 
   * @param userId - User ID to retrieve
   * @returns User model or null if not found
   * 
   * Requirements: 1.3, 2.3, 12.1
   */
  getUser(userId: string): UserModel | null {
    try {
      const users = this.get<UserModel[]>(STORAGE_KEYS.USERS);
      
      if (!users) {
        return null;
      }
      
      const user = users.find(u => u.id === userId);
      return user || null;
    } catch (error) {
      throw new PersistenceError(
        `Failed to retrieve user with ID "${userId}"`,
        error
      );
    }
  }

  /**
   * Retrieves a user by username
   * 
   * @param username - Username to search for
   * @returns User model or null if not found
   * 
   * Requirements: 1.1, 2.1
   */
  getUserByUsername(username: string): UserModel | null {
    try {
      const users = this.get<UserModel[]>(STORAGE_KEYS.USERS);
      
      if (!users) {
        return null;
      }
      
      const user = users.find(u => u.username === username);
      return user || null;
    } catch (error) {
      throw new PersistenceError(
        `Failed to retrieve user with username "${username}"`,
        error
      );
    }
  }

  /**
   * Retrieves all users
   * 
   * @returns Array of all users
   */
  getAllUsers(): UserModel[] {
    try {
      const users = this.get<UserModel[]>(STORAGE_KEYS.USERS);
      return users || [];
    } catch (error) {
      throw new PersistenceError('Failed to retrieve all users', error);
    }
  }

  /**
   * Saves or updates a user
   * 
   * If user with same ID exists, updates it. Otherwise, adds new user.
   * 
   * @param user - User model to save
   * 
   * Requirements: 1.3, 2.3, 12.1
   */
  saveUser(user: UserModel): void {
    try {
      const users = this.get<UserModel[]>(STORAGE_KEYS.USERS) || [];
      
      // Find existing user index
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        // Update existing user
        users[existingIndex] = user;
      } else {
        // Add new user
        users.push(user);
      }
      
      // Save updated users array
      this.set(STORAGE_KEYS.USERS, users);
    } catch (error) {
      throw new PersistenceError(
        `Failed to save user with ID "${user.id}"`,
        error
      );
    }
  }

  /**
   * Deletes a user by ID
   * 
   * @param userId - User ID to delete
   */
  deleteUser(userId: string): void {
    try {
      const users = this.get<UserModel[]>(STORAGE_KEYS.USERS) || [];
      const filtered = users.filter(u => u.id !== userId);
      this.set(STORAGE_KEYS.USERS, filtered);
    } catch (error) {
      throw new PersistenceError(
        `Failed to delete user with ID "${userId}"`,
        error
      );
    }
  }

  // ============================================================================
  // Domain-Specific Methods - Missions
  // ============================================================================

  /**
   * Retrieves all missions for a patient
   * 
   * @param patientId - Patient ID
   * @returns Array of missions for the patient
   * 
   * Requirements: 3.1, 12.2
   */
  getMissions(patientId: string): MissionModel[] {
    try {
      const missions = this.get<MissionModel[]>(STORAGE_KEYS.MISSIONS) || [];
      return missions.filter(m => m.patientId === patientId);
    } catch (error) {
      throw new PersistenceError(
        `Failed to retrieve missions for patient "${patientId}"`,
        error
      );
    }
  }

  /**
   * Retrieves a specific mission by ID
   * 
   * @param missionId - Mission ID
   * @returns Mission model or null if not found
   */
  getMission(missionId: string): MissionModel | null {
    try {
      const missions = this.get<MissionModel[]>(STORAGE_KEYS.MISSIONS) || [];
      const mission = missions.find(m => m.id === missionId);
      return mission || null;
    } catch (error) {
      throw new PersistenceError(
        `Failed to retrieve mission with ID "${missionId}"`,
        error
      );
    }
  }

  /**
   * Retrieves all missions
   * 
   * @returns Array of all missions
   */
  getAllMissions(): MissionModel[] {
    try {
      const missions = this.get<MissionModel[]>(STORAGE_KEYS.MISSIONS);
      return missions || [];
    } catch (error) {
      throw new PersistenceError('Failed to retrieve all missions', error);
    }
  }

  /**
   * Saves or updates a mission
   * 
   * If mission with same ID exists, updates it. Otherwise, adds new mission.
   * 
   * @param mission - Mission model to save
   * 
   * Requirements: 12.3
   */
  saveMission(mission: MissionModel): void {
    try {
      const missions = this.get<MissionModel[]>(STORAGE_KEYS.MISSIONS) || [];
      
      // Find existing mission index
      const existingIndex = missions.findIndex(m => m.id === mission.id);
      
      if (existingIndex >= 0) {
        // Update existing mission
        missions[existingIndex] = mission;
      } else {
        // Add new mission
        missions.push(mission);
      }
      
      // Save updated missions array
      this.set(STORAGE_KEYS.MISSIONS, missions);
    } catch (error) {
      throw new PersistenceError(
        `Failed to save mission with ID "${mission.id}"`,
        error
      );
    }
  }

  /**
   * Deletes a mission by ID
   * 
   * @param missionId - Mission ID to delete
   */
  deleteMission(missionId: string): void {
    try {
      const missions = this.get<MissionModel[]>(STORAGE_KEYS.MISSIONS) || [];
      const filtered = missions.filter(m => m.id !== missionId);
      this.set(STORAGE_KEYS.MISSIONS, filtered);
    } catch (error) {
      throw new PersistenceError(
        `Failed to delete mission with ID "${missionId}"`,
        error
      );
    }
  }

  // ============================================================================
  // Domain-Specific Methods - Action Items
  // ============================================================================

  /**
   * Retrieves action items, optionally filtered by doctor ID
   * 
   * @param doctorId - Optional doctor ID to filter by
   * @returns Array of action items
   * 
   * Requirements: 8.1, 12.2
   */
  getActionItems(doctorId?: string): ActionItemModel[] {
    try {
      const items = this.get<ActionItemModel[]>(STORAGE_KEYS.ACTION_ITEMS) || [];
      
      // If doctorId provided, filter by it (for future use)
      // For MVP, return all items since we don't track doctor assignment yet
      if (doctorId) {
        return items.filter(item => item.doctorId === doctorId);
      }
      
      return items;
    } catch (error) {
      throw new PersistenceError(
        `Failed to retrieve action items${doctorId ? ` for doctor "${doctorId}"` : ''}`,
        error
      );
    }
  }

  /**
   * Retrieves a specific action item by ID
   * 
   * @param itemId - Action item ID
   * @returns Action item model or null if not found
   */
  getActionItem(itemId: string): ActionItemModel | null {
    try {
      const items = this.get<ActionItemModel[]>(STORAGE_KEYS.ACTION_ITEMS) || [];
      const item = items.find(i => i.id === itemId);
      return item || null;
    } catch (error) {
      throw new PersistenceError(
        `Failed to retrieve action item with ID "${itemId}"`,
        error
      );
    }
  }

  /**
   * Saves or updates an action item
   * 
   * If action item with same ID exists, updates it. Otherwise, adds new item.
   * 
   * @param item - Action item model to save
   * 
   * Requirements: 12.2
   */
  saveActionItem(item: ActionItemModel): void {
    try {
      const items = this.get<ActionItemModel[]>(STORAGE_KEYS.ACTION_ITEMS) || [];
      
      // Find existing item index
      const existingIndex = items.findIndex(i => i.id === item.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        items[existingIndex] = item;
      } else {
        // Add new item
        items.push(item);
      }
      
      // Save updated items array
      this.set(STORAGE_KEYS.ACTION_ITEMS, items);
    } catch (error) {
      throw new PersistenceError(
        `Failed to save action item with ID "${item.id}"`,
        error
      );
    }
  }

  /**
   * Deletes an action item by ID
   * 
   * @param itemId - Action item ID to delete
   */
  deleteActionItem(itemId: string): void {
    try {
      const items = this.get<ActionItemModel[]>(STORAGE_KEYS.ACTION_ITEMS) || [];
      const filtered = items.filter(i => i.id !== itemId);
      this.set(STORAGE_KEYS.ACTION_ITEMS, filtered);
    } catch (error) {
      throw new PersistenceError(
        `Failed to delete action item with ID "${itemId}"`,
        error
      );
    }
  }

  // ============================================================================
  // Domain-Specific Methods - Configuration
  // ============================================================================

  /**
   * Retrieves the current configuration
   * 
   * @returns Configuration model or null if not set
   * 
   * Requirements: 15.1, 15.2
   */
  getConfig(): ConfigModel | null {
    try {
      return this.get<ConfigModel>(STORAGE_KEYS.CONFIG);
    } catch (error) {
      throw new PersistenceError('Failed to retrieve configuration', error);
    }
  }

  /**
   * Saves configuration
   * 
   * @param config - Configuration model to save
   * 
   * Requirements: 15.1, 15.2
   */
  saveConfig(config: ConfigModel): void {
    try {
      this.set(STORAGE_KEYS.CONFIG, config);
    } catch (error) {
      throw new PersistenceError('Failed to save configuration', error);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Clears all data from LocalStorage
   * 
   * WARNING: This will delete all user data, missions, and action items!
   */
  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      throw new PersistenceError('Failed to clear all data', error);
    }
  }

  /**
   * Checks if LocalStorage is available and working
   * 
   * @returns true if LocalStorage is available, false otherwise
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the approximate size of stored data in bytes
   * 
   * @returns Approximate size in bytes
   */
  getStorageSize(): number {
    let total = 0;
    
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key);
          if (value) {
            // Approximate size: key length + value length in bytes
            total += key.length + value.length;
          }
        }
      }
    } catch {
      // Return 0 if unable to calculate
      return 0;
    }
    
    return total;
  }
}

// Export singleton instance
export const persistenceService = new PersistenceServiceImpl();

// Export class for testing
export { PersistenceServiceImpl };
