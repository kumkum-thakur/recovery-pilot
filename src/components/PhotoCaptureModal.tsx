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
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return 'Please upload a JPEG, PNG, or HEIC image';
    }

    // Check file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return 'Image must be under 10MB';
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
   * Requirements: 5.1
   */
  const handleCameraClick = () => {
    setError(null);
    cameraInputRef.current?.click();
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
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      setIsSubmitting(false);
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

  /**
   * Handles camera permission errors
   * Requirements: 5.4
   */
  const handleCameraError = () => {
    setError('Camera access is required. Please enable it in your browser settings.');
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
            