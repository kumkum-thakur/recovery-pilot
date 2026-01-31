# PhotoCaptureModal Component

## Overview

The `PhotoCaptureModal` component provides a user-friendly interface for capturing or uploading wound photos as part of the patient's recovery missions. It implements the requirements for photo capture functionality with comprehensive error handling and accessibility features.

## Requirements Implemented

- **5.1**: Camera access using browser File API with file upload fallback
- **5.2**: Image preview before submission
- **5.3**: Photo upload and AI analysis trigger
- **5.4**: File format and size validation, camera permission error handling

## Features

### 1. Dual Input Methods

The modal provides two ways to capture/upload photos:

- **Camera Capture**: Uses the browser's File API with `capture="environment"` attribute for mobile camera access
- **File Upload**: Fallback option for desktop users or when camera access is unavailable

### 2. Image Preview

Before submission, users can preview the selected image to ensure it's the correct photo. The preview displays in a responsive container that maintains aspect ratio.

### 3. File Validation

The component validates:
- **File Type**: Only accepts JPEG, PNG, and HEIC formats
- **File Size**: Maximum 10MB file size
- **Error Display**: Clear error messages for validation failures

### 4. Error Handling

Comprehensive error handling for:
- Unsupported file formats
- Files exceeding size limit
- Camera permission denied
- Upload failures

### 5. Accessibility

- **ARIA Attributes**: Proper `role="dialog"`, `aria-modal`, and `aria-labelledby`
- **Keyboard Navigation**: Full keyboard support with focus management
- **Touch Targets**: Minimum 44px tap targets for all interactive elements
- **Text Size**: Minimum 16px for body text

### 6. Mobile-First Design

- Responsive layout that works on all screen sizes
- Touch-friendly buttons with adequate spacing
- Modal adapts to viewport height with scrolling if needed

## Usage

```tsx
import { PhotoCaptureModal } from './components/PhotoCaptureModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePhotoSubmit = async (imageFile: File) => {
    // Upload photo and trigger AI analysis
    await uploadPhoto(missionId, imageFile);
    await startTriageWorkflow(imageFile);
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Scan Incision
      </button>

      <PhotoCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handlePhotoSubmit}
        missionTitle="Mission 1: Scan Incision"
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Controls modal visibility |
| `onClose` | `() => void` | Yes | - | Called when modal should close |
| `onSubmit` | `(imageFile: File) => void \| Promise<void>` | Yes | - | Called when photo is submitted |
| `missionTitle` | `string` | No | `'Scan Incision'` | Title displayed in modal header |

## Integration with MissionStream

The `PhotoCaptureModal` is integrated into the `MissionStream` component:

1. When a photo upload mission's action button is clicked, the modal opens
2. User selects or captures a photo
3. User previews and confirms the photo
4. Photo is uploaded to the mission store
5. AI triage workflow is triggered
6. Modal closes and mission is marked complete

## File Validation Rules

### Supported Formats
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- HEIC (`.heic`, `.heif`)

### Size Limit
- Maximum: 10MB

### Error Messages
- **Invalid Format**: "Please upload a JPEG, PNG, or HEIC image"
- **File Too Large**: "Image must be under 10MB"
- **Camera Access Denied**: "Camera access is required. Please enable it in your browser settings."

## State Management

The component manages internal state for:
- `previewUrl`: Data URL for image preview
- `selectedFile`: Currently selected File object
- `error`: Error message to display
- `isSubmitting`: Loading state during submission

## Cleanup

The component properly cleans up resources:
- Revokes object URLs when modal closes
- Resets all state when modal closes
- Prevents memory leaks from preview URLs

## Testing

Comprehensive unit tests cover:
- Modal visibility and rendering
- User interactions (close, cancel, backdrop click)
- File validation (format, size)
- Error handling and display
- Accessibility features
- Button states and behavior

Run tests with:
```bash
npm test -- PhotoCaptureModal.test.tsx
```

## Browser Compatibility

The component uses standard browser APIs:
- **File API**: Supported in all modern browsers
- **FileReader**: For creating preview URLs
- **Input capture attribute**: Mobile camera access (iOS Safari 11+, Chrome Android)

### Fallback Behavior

If camera access is not available:
- The "Take Photo" button will open the file picker
- Users can still upload photos from their device
- No functionality is lost

## Future Enhancements

Potential improvements for production:
1. **Image Compression**: Reduce file size before upload
2. **EXIF Data Handling**: Strip or preserve metadata
3. **Multiple Photos**: Support uploading multiple images
4. **Crop/Rotate**: Basic image editing before submission
5. **Real-time Validation**: Check image quality (blur, lighting)

## Related Components

- **MissionStream**: Parent component that manages mission actions
- **MissionCard**: Displays mission details and action button
- **AgentStore**: Handles AI triage workflow after photo upload
- **MissionStore**: Manages photo upload and mission completion
