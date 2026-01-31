/**
 * Unit tests for PersistenceService
 * 
 * Tests generic CRUD operations and domain-specific methods
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersistenceServiceImpl, PersistenceError } from './persistenceService';
import {
  UserModel,
  MissionModel,
  ActionItemModel,
  ConfigModel,
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
        ser