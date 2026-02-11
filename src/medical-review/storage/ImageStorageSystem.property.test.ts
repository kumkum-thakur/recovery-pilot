/**
 * Property-Based Tests for ImageStorageSystem
 * 
 * Tests universal correctness properties across all inputs using fast-check
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { ImageStorageSystem } from './ImageStorageSystem';
import {
  imageMetadataArb,
  imageDataArb,
  propertyTestConfig,
  propertyTestTag,
} from '../test-setup';

describe('ImageStorageSystem - Property-Based Tests', () => {
  let storage: ImageStorageSystem;
  
  beforeEach(() => {
    storage = new ImageStorageSystem();
    storage.clearAll();
  });
  
  afterEach(() => {
    storage.clearAll();
  });
  
  /**
   * Property 1: Image storage with complete metadata
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   * 
   * For any uploaded wound image, storing it should result in a record with:
   * - A unique ID
   * - Patient association
   * - Mission association
   * - Upload timestamp
   * And retrieving it should return all this metadata intact.
   */
  it(propertyTestTag(1, 'Image storage with complete metadata'), async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // patientId
        fc.uuid(), // missionId
        imageDataArb, // imageData
        imageMetadataArb, // metadata
        async (patientId, missionId, imageData, metadata) => {
          // Store the image
          const stored = await storage.storeImage(
            patientId,
            missionId,
            imageData,
            metadata
          );
          
          // Verify stored image has all required fields
          expect(stored.imageId).toBeTruthy();
          expect(typeof stored.imageId).toBe('string');
          expect(stored.imageId.length).toBeGreaterThan(0);
          
          // Verify patient association (Requirement 1.2)
          expect(stored.patientId).toBe(patientId);
          
          // Verify mission association (Requirement 1.4)
          expect(stored.missionId).toBe(missionId);
          
          // Verify upload timestamp is recorded (Requirement 1.3)
          expect(stored.uploadTimestamp).toBeInstanceOf(Date);
          expect(stored.uploadTimestamp.getTime()).toBeLessThanOrEqual(Date.now());
          
          // Verify metadata is preserved
          expect(stored.metadata).toEqual(metadata);
          
          // Verify image URL is generated (Requirement 1.1)
          expect(stored.imageUrl).toBeTruthy();
          expect(typeof stored.imageUrl).toBe('string');
          expect(stored.imageUrl).toContain('data:image/');
          
          // Retrieve the image and verify all metadata is intact
          const retrieved = await storage.getImage(stored.imageId);
          
          expect(retrieved).not.toBeNull();
          expect(retrieved!.imageId).toBe(stored.imageId);
          expect(retrieved!.patientId).toBe(patientId);
          expect(retrieved!.missionId).toBe(missionId);
          expect(retrieved!.uploadTimestamp).toBeInstanceOf(Date);
          expect(retrieved!.uploadTimestamp.getTime()).toBe(stored.uploadTimestamp.getTime());
          expect(retrieved!.metadata).toEqual(metadata);
          expect(retrieved!.imageUrl).toBe(stored.imageUrl);
        }
      ),
      propertyTestConfig
    );
  });
});
