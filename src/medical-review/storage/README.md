# Image Storage System

## Overview

The Image Storage System provides permanent storage for patient wound images with complete metadata and associations. It implements the storage layer for the Medical Image Review and AI Feedback System.

## Features

- **Permanent Image Storage**: Store wound images with unique identifiers
- **Patient Association**: Link images to patient records
- **Mission Tracking**: Associate images with specific upload events/missions
- **Metadata Management**: Store and retrieve image dimensions, format, file size, and device info
- **Timestamp Recording**: Automatic timestamp recording for all uploads
- **Ordered Retrieval**: Retrieve patient images ordered by timestamp (most recent first)

## Requirements Validated

- **Requirement 1.1**: Store images permanently with unique identifiers
- **Requirement 1.2**: Associate images with patient identifiers
- **Requirement 1.3**: Record upload timestamps
- **Requirement 1.4**: Link images to mission identifiers
- **Requirement 1.5**: Return patient images ordered by timestamp

## API Reference

### ImageStorageSystem

Main class for image storage operations.

#### Methods

##### `storeImage(patientId, missionId, imageData, metadata): Promise<StoredImage>`

Store a new image with metadata.

**Parameters:**
- `patientId` (string): Patient who uploaded the image
- `missionId` (string): Associated mission/upload event
- `imageData` (Buffer): Raw image data
- `metadata` (ImageMetadata): Image metadata

**Returns:** Promise<StoredImage> - Stored image with generated ID and timestamp

**Throws:** ImageStorageError if storage fails

**Example:**
```typescript
const metadata: ImageMetadata = {
  width: 800,
  height: 600,
  format: 'jpeg',
  fileSize: 1024,
  deviceInfo: 'iPhone 12 Pro' // optional
};

const storedImage = await imageStorageSystem.storeImage(
  'patient-123',
  'mission-456',
  imageBuffer,
  metadata
);

console.log(storedImage.imageId); // UUID
console.log(storedImage.uploadTimestamp); // Date object
```

##### `getImage(imageId): Promise<StoredImage | null>`

Retrieve a specific image by ID.

**Parameters:**
- `imageId` (string): Image ID to retrieve

**Returns:** Promise<StoredImage | null> - Stored image or null if not found

**Example:**
```typescript
const image = await imageStorageSystem.getImage('image-uuid');

if (image) {
  console.log(image.patientId);
  console.log(image.uploadTimestamp);
}
```

##### `getPatientImages(patientId): Promise<StoredImage[]>`

Retrieve all images for a patient, ordered by timestamp (most recent first).

**Parameters:**
- `patientId` (string): Patient ID

**Returns:** Promise<StoredImage[]> - Array of images ordered by timestamp

**Example:**
```typescript
const images = await imageStorageSystem.getPatientImages('patient-123');

// Images are ordered most recent first
images.forEach(img => {
  console.log(`${img.imageId}: ${img.uploadTimestamp}`);
});
```

##### `getImagesByMission(missionId): Promise<StoredImage[]>`

Get all images for a specific mission.

**Parameters:**
- `missionId` (string): Mission ID

**Returns:** Promise<StoredImage[]> - Array of images for the mission

**Example:**
```typescript
const images = await imageStorageSystem.getImagesByMission('mission-456');

console.log(`Found ${images.length} images for mission`);
```

## Data Models

### StoredImage

```typescript
interface StoredImage {
  imageId: string;              // Unique identifier (UUID)
  patientId: string;            // Patient who uploaded the image
  missionId: string;            // Associated mission/upload event
  imageUrl: string;             // Storage location (data URL)
  uploadTimestamp: Date;        // When image was uploaded
  metadata: ImageMetadata;      // Additional metadata
}
```

### ImageMetadata

```typescript
interface ImageMetadata {
  width: number;                // Image width in pixels
  height: number;               // Image height in pixels
  format: string;               // Image format ('jpeg', 'png', etc.)
  fileSize: number;             // File size in bytes
  deviceInfo?: string;          // Optional device information
}
```

## Error Handling

### ImageStorageError

Custom error class for storage-related errors.

**Common Error Scenarios:**
- Empty patient ID or mission ID
- Empty image data
- Invalid metadata (zero/negative dimensions, empty format, zero file size)
- Storage quota exceeded
- JSON parse/serialization errors

**Example:**
```typescript
try {
  await imageStorageSystem.storeImage(patientId, missionId, imageData, metadata);
} catch (error) {
  if (error instanceof ImageStorageError) {
    console.error('Storage error:', error.message);
    console.error('Cause:', error.cause);
  }
}
```

## Storage Implementation

The system uses **LocalStorage** for persistence:
- Images are stored as base64-encoded data URLs
- All images are stored in a single array under the key `medical_review_images`
- Timestamps are automatically serialized/deserialized as Date objects
- Storage quota is monitored and errors are thrown when exceeded

## Testing

### Unit Tests

Comprehensive unit tests cover:
- ✅ Image storage with all metadata fields
- ✅ Unique ID generation
- ✅ Optional deviceInfo field
- ✅ Error handling for invalid inputs
- ✅ Image retrieval by ID
- ✅ Patient image retrieval with ordering
- ✅ Mission image retrieval
- ✅ Edge cases (multiple formats, large dimensions, multiple patients/missions)

**Run tests:**
```bash
npm test src/medical-review/storage/ImageStorageSystem.test.ts
```

### Property-Based Tests

Property-based tests are implemented in separate test files:
- Property 1: Image storage with complete metadata (task 2.2)
- Property 2: Patient image retrieval completeness and ordering (task 2.3)

## Usage Examples

### Basic Usage

```typescript
import { imageStorageSystem } from './storage';

// Store an image
const metadata = {
  width: 1920,
  height: 1080,
  format: 'jpeg',
  fileSize: 2048000,
  deviceInfo: 'iPhone 13'
};

const stored = await imageStorageSystem.storeImage(
  'patient-abc',
  'mission-xyz',
  imageBuffer,
  metadata
);

// Retrieve the image
const retrieved = await imageStorageSystem.getImage(stored.imageId);

// Get all patient images
const patientImages = await imageStorageSystem.getPatientImages('patient-abc');

// Get mission images
const missionImages = await imageStorageSystem.getImagesByMission('mission-xyz');
```

### Error Handling

```typescript
try {
  const stored = await imageStorageSystem.storeImage(
    patientId,
    missionId,
    imageData,
    metadata
  );
  console.log('Image stored successfully:', stored.imageId);
} catch (error) {
  if (error instanceof ImageStorageError) {
    if (error.message.includes('quota exceeded')) {
      // Handle storage quota error
      alert('Storage is full. Please clear some data.');
    } else {
      // Handle other storage errors
      console.error('Failed to store image:', error.message);
    }
  }
}
```

### Integration with Other Components

```typescript
// Example: Store image and create preliminary report
const stored = await imageStorageSystem.storeImage(
  patientId,
  missionId,
  imageData,
  metadata
);

// Pass to AI analyzer
const report = await aiAnalyzer.analyzeImage(stored.imageId, imageData);

// Create audit log entry
await auditLog.logEvent(
  'image_uploaded',
  patientId,
  'patient',
  stored.imageId,
  { missionId, metadata }
);
```

## Performance Considerations

- **Storage Limits**: LocalStorage has a typical limit of 5-10MB per domain
- **Large Images**: Consider image compression before storage
- **Batch Operations**: Retrieve multiple images efficiently using patient or mission queries
- **Cleanup**: Implement periodic cleanup of old images if needed

## Future Enhancements

Potential improvements for production deployment:
- [ ] Migrate to cloud storage (S3, Azure Blob Storage)
- [ ] Implement image compression
- [ ] Add image thumbnail generation
- [ ] Implement pagination for large result sets
- [ ] Add caching layer for frequently accessed images
- [ ] Implement image deletion/archival

## Related Components

- **AI Preliminary Analyzer**: Consumes stored images for analysis
- **Review Workflow Manager**: Retrieves images for doctor review
- **Audit Log System**: Logs all image storage events
- **Doctor Review Interface**: Displays stored images to doctors

## License

Part of the Medical Image Review and AI Feedback System.
