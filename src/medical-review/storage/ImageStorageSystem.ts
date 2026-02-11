/**
 * ImageStorageSystem - Image storage and retrieval with metadata
 * 
 * Provides storage operations for patient wound images with complete metadata:
 * - Store images with patient and mission associations
 * - Retrieve images by ID, patient, or mission
 * - Maintain upload timestamps and metadata
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ImageStorageSystem as IImageStorageSystem,
  StoredImage,
  ImageMetadata,
} from '../interfaces';

/**
 * Storage key for images in LocalStorage
 */
const STORAGE_KEY = 'medical_review_images';

/**
 * Error class for image storage-related errors
 */
export class ImageStorageError extends Error {
  cause?: unknown;
  
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ImageStorageError';
    this.cause = cause;
  }
}

/**
 * Implementation of ImageStorageSystem using LocalStorage
 * 
 * Stores images as base64-encoded data URLs with complete metadata
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export class ImageStorageSystem implements IImageStorageSystem {
  /**
   * Store a new image with metadata
   * 
   * @param patientId - Patient who uploaded the image
   * @param missionId - Associated mission/upload event
   * @param imageData - Raw image data as Buffer
   * @param metadata - Image metadata (dimensions, format, etc.)
   * @returns Stored image with generated ID and timestamp
   * @throws ImageStorageError if storage fails
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  async storeImage(
    patientId: string,
    missionId: string,
    imageData: Buffer,
    metadata: ImageMetadata
  ): Promise<StoredImage> {
    try {
      // Validate inputs
      if (!patientId || !missionId) {
        throw new ImageStorageError('Patient ID and Mission ID are required');
      }
      
      if (!imageData || imageData.length === 0) {
        throw new ImageStorageError('Image data cannot be empty');
      }
      
      // Validate metadata
      this.validateMetadata(metadata);
      
      // Generate unique image ID
      const imageId = uuidv4();
      
      // Convert Buffer to base64 data URL for storage
      const base64Data = imageData.toString('base64');
      const imageUrl = `data:image/${metadata.format};base64,${base64Data}`;
      
      // Create stored image record
      const storedImage: StoredImage = {
        imageId,
        patientId,
        missionId,
        imageUrl,
        uploadTimestamp: new Date(),
        metadata,
      };
      
      // Get existing images
      const images = this.getAllImages();
      
      // Add new image
      images.push(storedImage);
      
      // Save to LocalStorage
      this.saveImages(images);
      
      return storedImage;
    } catch (error) {
      if (error instanceof ImageStorageError) {
        throw error;
      }
      
      throw new ImageStorageError(
        'Failed to store image',
        error
      );
    }
  }
  
  /**
   * Retrieve a specific image by ID
   * 
   * @param imageId - Image ID to retrieve
   * @returns Stored image or null if not found
   * @throws ImageStorageError if retrieval fails
   * 
   * Requirements: 1.1
   */
  async getImage(imageId: string): Promise<StoredImage | null> {
    try {
      const images = this.getAllImages();
      const image = images.find(img => img.imageId === imageId);
      
      if (!image) {
        return null;
      }
      
      // Ensure uploadTimestamp is a Date object (may be string after JSON parse)
      return this.deserializeImage(image);
    } catch (error) {
      throw new ImageStorageError(
        `Failed to retrieve image with ID "${imageId}"`,
        error
      );
    }
  }
  
  /**
   * Retrieve all images for a patient
   * 
   * @param patientId - Patient ID
   * @returns Array of images ordered by timestamp (most recent first)
   * @throws ImageStorageError if retrieval fails
   * 
   * Requirements: 1.5, 2.4
   */
  async getPatientImages(patientId: string): Promise<StoredImage[]> {
    try {
      const images = this.getAllImages();
      
      // Filter by patient ID
      const patientImages = images.filter(img => img.patientId === patientId);
      
      // Sort by timestamp (most recent first)
      patientImages.sort((a, b) => {
        const dateA = new Date(a.uploadTimestamp).getTime();
        const dateB = new Date(b.uploadTimestamp).getTime();
        return dateB - dateA; // Descending order
      });
      
      // Deserialize dates
      return patientImages.map(img => this.deserializeImage(img));
    } catch (error) {
      throw new ImageStorageError(
        `Failed to retrieve images for patient "${patientId}"`,
        error
      );
    }
  }
  
  /**
   * Get images by mission
   * 
   * @param missionId - Mission ID
   * @returns Array of images for the mission
   * @throws ImageStorageError if retrieval fails
   * 
   * Requirements: 1.4
   */
  async getImagesByMission(missionId: string): Promise<StoredImage[]> {
    try {
      const images = this.getAllImages();
      
      // Filter by mission ID
      const missionImages = images.filter(img => img.missionId === missionId);
      
      // Deserialize dates
      return missionImages.map(img => this.deserializeImage(img));
    } catch (error) {
      throw new ImageStorageError(
        `Failed to retrieve images for mission "${missionId}"`,
        error
      );
    }
  }
  
  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  
  /**
   * Get all images from LocalStorage
   * 
   * @returns Array of all stored images
   * @throws ImageStorageError if retrieval fails
   */
  private getAllImages(): StoredImage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      
      if (!data) {
        return [];
      }
      
      const images = JSON.parse(data) as StoredImage[];
      return images;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ImageStorageError(
          'Failed to parse stored images: Invalid JSON format',
          error
        );
      }
      
      throw new ImageStorageError(
        'Failed to retrieve images from storage',
        error
      );
    }
  }
  
  /**
   * Save images to LocalStorage
   * 
   * @param images - Array of images to save
   * @throws ImageStorageError if save fails
   */
  private saveImages(images: StoredImage[]): void {
    try {
      const serialized = JSON.stringify(images);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new ImageStorageError(
          'Storage quota exceeded. Please clear some data or contact support.',
          error
        );
      }
      
      throw new ImageStorageError(
        'Failed to save images to storage',
        error
      );
    }
  }
  
  /**
   * Deserialize image (convert string dates to Date objects)
   * 
   * @param image - Image with potentially serialized dates
   * @returns Image with Date objects
   */
  private deserializeImage(image: StoredImage): StoredImage {
    return {
      ...image,
      uploadTimestamp: new Date(image.uploadTimestamp),
    };
  }
  
  /**
   * Validate image metadata
   * 
   * @param metadata - Metadata to validate
   * @throws ImageStorageError if validation fails
   */
  private validateMetadata(metadata: ImageMetadata): void {
    if (!metadata) {
      throw new ImageStorageError('Metadata is required');
    }
    
    if (metadata.width <= 0 || metadata.height <= 0) {
      throw new ImageStorageError('Image dimensions must be positive');
    }
    
    if (!metadata.format || metadata.format.trim() === '') {
      throw new ImageStorageError('Image format is required');
    }
    
    if (metadata.fileSize <= 0) {
      throw new ImageStorageError('File size must be positive');
    }
  }
  
  /**
   * Clear all images (for testing purposes)
   * 
   * WARNING: This will delete all stored images!
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      throw new ImageStorageError(
        'Failed to clear all images',
        error
      );
    }
  }
}

// Export singleton instance
export const imageStorageSystem = new ImageStorageSystem();
