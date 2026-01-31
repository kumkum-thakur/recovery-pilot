/**
 * PhotoCaptureModal - Modal for capturing or uploading wound photos
 * 
 * Provides two methods for photo submission:
 * 1. Camera access using browser File API (mobile-first)
 * 2. File upload fallback (desktop or if camera unavailable)
 * 
 * Features:
 * - Image preview before submission
 * - Camera permission error handling
 * - File format and size validation
 * - Accessible modal with keyboard navigation
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageFile: File) => void;
  missionTitle?: string;
}

export function PhotoCaptureModal({
  isOpen,
  onClose,
  onSubmit,
  missionTitle = 'Scan Incision',
}: PhotoCaptureModalProps) {
  // State for image preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  /**
   * Validates image file format and size
   * Requirements: 5.4
   */
  const validateImageFile = (file: File): string | null => {
    // Check file type - support common image formats
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    const fileType = file.type.toLowerCase();
    
    if (!validTypes.includes(fileType)) {
      // Provide helpful error message with supported formats
      return 'Unsupported file format. Please upload a JPEG, PNG, or HEIC image.';
    }

    // Check file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `Image is too large (${sizeMB}MB). Please upload an image under 10MB.`;
    }

    return null;
  };

  /**
   * Handles file selection from camera or file input
   * Requirements: 5.1, 5.2, 5.4
   */
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Clear previous error
    setError(null);

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  /**
   * Handles camera button click
   * Attempts to check camera permissions before opening camera input
   * Requirements: 5.1, 5.4
   */
  const handleCameraClick = async () => {
    setError(null);
    
    // Check if MediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera is not available on this device. Please use the Upload Image option.');
      return;
    }
    
    try {
      // Request camera permission to check if it's available
      // We'll immediately stop the stream - we just need to check permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera for wound photos
      });
      
      // Stop the stream immediately - we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      // Permission granted, open the file input with camera capture
      cameraInputRef.current?.click();
    } catch (err) {
      // Handle different types of camera errors
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera access denied. Please enable camera permissions in your browser settings, or use the Upload Image option.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device. Please use the Upload Image option.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is already in use by another application. Please close other apps and try again.');
        } else {
          setError('Unable to access camera. Please use the Upload Image option.');
        }
      } else {
        setError('Unable to access camera. Please use the Upload Image option.');
      }
      console.error('Camera access error:', err);
    }
  };

  /**
   * Handles file upload button click
   * Requirements: 5.1
   */
  const handleFileUploadClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  /**
   * Handles photo submission
   * Requirements: 5.3
   */
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(selectedFile);
      handleClose();
    } catch (err) {
      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Failed to upload photo. Please try again.';
      
      if (err instanceof Error) {
        // Check for specific error messages from the upload process
        if (err.message.includes('not found')) {
          errorMessage = 'Mission not found. Please refresh the page and try again.';
        } else if (err.message.includes('not a photo upload mission')) {
          errorMessage = 'This mission does not support photo uploads.';
        } else if (err.message.includes('image') || err.message.includes('format')) {
          errorMessage = err.message; // Use the specific validation error
        } else if (err.message.includes('size')) {
          errorMessage = err.message; // Use the specific size error
        } else if (err.message.includes('network') || err.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // Use the error message if it's user-friendly, otherwise use default
          errorMessage = err.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
      console.error('Photo upload error:', err);
    }
  };

  /**
   * Handles modal close and cleanup
   */
  const handleClose = () => {
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Reset state
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    setIsSubmitting(false);
    
    // Call parent close handler
    onClose();
  };

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2
              id="modal-title"
              className="text-xl font-bold text-medical-text"
            >
              {missionTitle}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div
                className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Image preview or capture options */}
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview of captured image"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Preview your image before submitting
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-base text-gray-700">
                  Take a clear photo of your incision or upload an existing image.
                </p>

                {/* Camera capture button */}
                <button
                  onClick={handleCameraClick}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  aria-label="Open camera to take photo"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-base font-medium">Take Photo</span>
                </button>

                {/* File upload button */}
                <button
                  onClick={handleFileUploadClick}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-medical-primary border-2 border-medical-primary rounded-lg hover:bg-medical-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  aria-label="Upload image from device"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-base font-medium">Upload Image</span>
                </button>

                <p className="text-sm text-gray-500 text-center">
                  Supported formats: JPEG, PNG, HEIC (max 10MB)
                </p>
              </div>
            )}

            {/* Hidden file inputs */}
            {/* Camera input with capture attribute for mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />

            {/* File upload input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          {/* Footer with action buttons */}
          <div className="flex gap-3 p-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-base font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gamification-success text-white rounded-lg hover:bg-gamification-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-base font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Submit Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
