/**
 * Unit Tests for ImageStorageSystem
 * 
 * Tests edge cases and error handling for image storage operations
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImageStorageSystem, ImageStorageError } from './ImageStorageSystem';
import type { ImageMetadata } from '../types';

describe('ImageStorageSystem - Unit Tests', () => {
  let storage: ImageStorageSystem;
  
  beforeEach(() => {
    storage = new ImageStorageSystem();
    // Clear storage before each test
    storage.clearAll();
  });
  
  afterEach(() => {
    // Clean up after each test
    storage.clearAll();
  });
  
  describe('storeImage', () => {
    it('should store an image with all required metadata', async () => {
      const patientId = 'patient-123';
      const missionId = 'mission-456';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      const result = await storage.storeImage(patientId, missionId, imageData, metadata);
      
      expect(result.imageId).toBeTruthy();
      expect(result.patientId).toBe(patientId);
      expect(result.missionId).toBe(missionId);
      expect(result.imageUrl).toContain('data:image/jpeg;base64,');
      expect(result.uploadTimestamp).toBeInstanceOf(Date);
      expect(result.metadata).toEqual(metadata);
    });
    
    it('should generate unique IDs for different images', async () => {
      const patientId = 'patient-123';
      const missionId = 'mission-456';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      const result1 = await storage.storeImage(patientId, missionId, imageData, metadata);
      const result2 = await storage.storeImage(patientId, missionId, imageData, metadata);
      
      expect(result1.imageId).not.toBe(result2.imageId);
    });
    
    it('should store image with optional deviceInfo', async () => {
      const patientId = 'patient-123';
      const missionId = 'mission-456';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
        deviceInfo: 'iPhone 12 Pro',
      };
      
      const result = await storage.storeImage(patientId, missionId, imageData, metadata);
      
      expect(result.metadata.deviceInfo).toBe('iPhone 12 Pro');
    });
    
    it('should throw error when patientId is empty', async () => {
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      await expect(
        storage.storeImage('', 'mission-456', imageData, metadata)
      ).rejects.toThrow(ImageStorageError);
    });
    
    it('should throw error when missionId is empty', async () => {
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      await expect(
        storage.storeImage('patient-123', '', imageData, metadata)
      ).rejects.toThrow(ImageStorageError);
    });
    
    it('should throw error when imageData is empty', async () => {
      const imageData = Buffer.from('');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      await expect(
        storage.storeImage('patient-123', 'mission-456', imageData, metadata)
      ).rejects.toThrow(ImageStorageError);
    });
    
    it('should throw error when metadata has invalid dimensions', async () => {
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 0,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      await expect(
        storage.storeImage('patient-123', 'mission-456', imageData, metadata)
      ).rejects.toThrow(ImageStorageError);
    });
    
    it('should throw error when metadata has empty format', async () => {
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: '',
        fileSize: 1024,
      };
      
      await expect(
        storage.storeImage('patient-123', 'mission-456', imageData, metadata)
      ).rejects.toThrow(ImageStorageError);
    });
    
    it('should throw error when metadata has invalid fileSize', async () => {
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 0,
      };
      
      await expect(
        storage.storeImage('patient-123', 'mission-456', imageData, metadata)
      ).rejects.toThrow(ImageStorageError);
    });
  });
  
  describe('getImage', () => {
    it('should retrieve an existing image by ID', async () => {
      const patientId = 'patient-123';
      const missionId = 'mission-456';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      const stored = await storage.storeImage(patientId, missionId, imageData, metadata);
      const retrieved = await storage.getImage(stored.imageId);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved!.imageId).toBe(stored.imageId);
      expect(retrieved!.patientId).toBe(patientId);
      expect(retrieved!.missionId).toBe(missionId);
      expect(retrieved!.uploadTimestamp).toBeInstanceOf(Date);
    });
    
    it('should return null for non-existent image ID', async () => {
      const result = await storage.getImage('non-existent-id');
      
      expect(result).toBeNull();
    });
    
    it('should deserialize uploadTimestamp as Date object', async () => {
      const patientId = 'patient-123';
      const missionId = 'mission-456';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      const stored = await storage.storeImage(patientId, missionId, imageData, metadata);
      const retrieved = await storage.getImage(stored.imageId);
      
      expect(retrieved!.uploadTimestamp).toBeInstanceOf(Date);
      expect(retrieved!.uploadTimestamp.getTime()).toBeCloseTo(stored.uploadTimestamp.getTime(), -2);
    });
  });
  
  describe('getPatientImages', () => {
    it('should return all images for a patient', async () => {
      const patientId = 'patient-123';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      await storage.storeImage(patientId, 'mission-1', imageData, metadata);
      await storage.storeImage(patientId, 'mission-2', imageData, metadata);
      await storage.storeImage(patientId, 'mission-3', imageData, metadata);
      
      const results = await storage.getPatientImages(patientId);
      
      expect(results).toHaveLength(3);
      expect(results.every(img => img.patientId === patientId)).toBe(true);
    });
    
    it('should return empty array for patient with no images', async () => {
      const results = await storage.getPatientImages('patient-with-no-images');
      
      expect(results).toEqual([]);
    });
    
    it('should order images by timestamp (most recent first)', async () => {
      const patientId = 'patient-123';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      // Store images with small delays to ensure different timestamps
      const img1 = await storage.storeImage(patientId, 'mission-1', imageData, metadata);
      await new Promise(resolve => setTimeout(resolve, 10));
      const img2 = await storage.storeImage(patientId, 'mission-2', imageData, metadata);
      await new Promise(resolve => setTimeout(resolve, 10));
      const img3 = await storage.storeImage(patientId, 'mission-3', imageData, metadata);
      
      const results = await storage.getPatientImages(patientId);
      
      expect(results).toHaveLength(3);
      // Most recent first
      expect(results[0].imageId).toBe(img3.imageId);
      expect(results[1].imageId).toBe(img2.imageId);
      expect(results[2].imageId).toBe(img1.imageId);
    });
    
    it('should not return images from other patients', async () => {
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      await storage.storeImage('patient-1', 'mission-1', imageData, metadata);
      await storage.storeImage('patient-2', 'mission-2', imageData, metadata);
      await storage.storeImage('patient-1', 'mission-3', imageData, metadata);
      
      const results = await storage.getPatientImages('patient-1');
      
      expect(results).toHaveLength(2);
      expect(results.every(img => img.patientId === 'patient-1')).toBe(true);
    });
  });
  
  describe('getImagesByMission', () => {
    it('should return all images for a mission', async () => {
      const missionId = 'mission-123';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      await storage.storeImage('patient-1', missionId, imageData, metadata);
      await storage.storeImage('patient-2', missionId, imageData, metadata);
      
      const results = await storage.getImagesByMission(missionId);
      
      expect(results).toHaveLength(2);
      expect(results.every(img => img.missionId === missionId)).toBe(true);
    });
    
    it('should return empty array for mission with no images', async () => {
      const results = await storage.getImagesByMission('mission-with-no-images');
      
      expect(results).toEqual([]);
    });
    
    it('should not return images from other missions', async () => {
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      await storage.storeImage('patient-1', 'mission-1', imageData, metadata);
      await storage.storeImage('patient-1', 'mission-2', imageData, metadata);
      await storage.storeImage('patient-1', 'mission-1', imageData, metadata);
      
      const results = await storage.getImagesByMission('mission-1');
      
      expect(results).toHaveLength(2);
      expect(results.every(img => img.missionId === 'mission-1')).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle different image formats', async () => {
      const patientId = 'patient-123';
      const missionId = 'mission-456';
      const imageData = Buffer.from('fake-image-data');
      
      const formats = ['jpeg', 'png', 'webp', 'gif'];
      
      for (const format of formats) {
        const metadata: ImageMetadata = {
          width: 800,
          height: 600,
          format,
          fileSize: 1024,
        };
        
        const result = await storage.storeImage(patientId, missionId, imageData, metadata);
        expect(result.metadata.format).toBe(format);
        expect(result.imageUrl).toContain(`data:image/${format};base64,`);
      }
    });
    
    it('should handle large image dimensions', async () => {
      const patientId = 'patient-123';
      const missionId = 'mission-456';
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 4000,
        height: 3000,
        format: 'jpeg',
        fileSize: 5000000,
      };
      
      const result = await storage.storeImage(patientId, missionId, imageData, metadata);
      
      expect(result.metadata.width).toBe(4000);
      expect(result.metadata.height).toBe(3000);
    });
    
    it('should handle multiple patients and missions', async () => {
      const imageData = Buffer.from('fake-image-data');
      const metadata: ImageMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg',
        fileSize: 1024,
      };
      
      // Store images for different patients and missions
      await storage.storeImage('patient-1', 'mission-1', imageData, metadata);
      await storage.storeImage('patient-1', 'mission-2', imageData, metadata);
      await storage.storeImage('patient-2', 'mission-1', imageData, metadata);
      await storage.storeImage('patient-2', 'mission-3', imageData, metadata);
      
      const patient1Images = await storage.getPatientImages('patient-1');
      const patient2Images = await storage.getPatientImages('patient-2');
      const mission1Images = await storage.getImagesByMission('mission-1');
      
      expect(patient1Images).toHaveLength(2);
      expect(patient2Images).toHaveLength(2);
      expect(mission1Images).toHaveLength(2);
    });
  });
});
