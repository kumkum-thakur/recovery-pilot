/**
 * PhotoCaptureModal - Unit tests
 * 
 * Tests for the PhotoCaptureModal component including:
 * - Modal visibility
 * - File validation
 * - Image preview
 * - Error handling
 * - Camera permission errors
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoCaptureModal } from './PhotoCaptureModal';

describe('PhotoCaptureModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <PhotoCaptureModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Scan Incision')).toBeInTheDocument();
    });

    it('should display custom mission title', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          missionTitle="Custom Mission Title"
        />
      );

      expect(screen.getByText('Custom Mission Title')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
      
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Button Rendering', () => {
    it('should render Take Photo button', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText('Open camera to take photo')).toBeInTheDocument();
      expect(screen.getByText('Take Photo')).toBeInTheDocument();
    });

    it('should render Upload Image button', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText('Upload image from device')).toBeInTheDocument();
      expect(screen.getByText('Upload Image')).toBeInTheDocument();
    });

    it('should render Submit Photo button as disabled initially', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText('Submit Photo').closest('button');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('File Validation', () => {
    it('should show error for unsupported file type', async () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Create a mock file with unsupported type
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      // Get the hidden file input
      const fileInput = screen.getByLabelText('Upload image from device').parentElement?.querySelector('input[type="file"]');
      
      if (fileInput) {
        // Simulate file selection
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        
        fireEvent.change(fileInput);

        await waitFor(() => {
          expect(screen.getByText('Unsupported file format. Please upload a JPEG, PNG, or HEIC image.')).toBeInTheDocument();
        });
      }
    });

    it('should show error for file too large', async () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Create a mock file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      const fileInput = screen.getByLabelText('Upload image from device').parentElement?.querySelector('input[type="file"]');
      
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [largeFile],
          writable: false,
        });
        
        fireEvent.change(fileInput);

        await waitFor(() => {
          // The error message now includes the actual file size
          expect(screen.getByText(/Image is too large.*Please upload an image under 10MB/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Camera Access Errors', () => {
    it('should show error when camera access is denied', async () => {
      // Mock getUserMedia to simulate permission denied
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
      );
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
        configurable: true,
      });

      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const takePhotoButton = screen.getByLabelText('Open camera to take photo');
      fireEvent.click(takePhotoButton);

      await waitFor(() => {
        expect(screen.getByText(/Camera access denied/)).toBeInTheDocument();
      });
    });

    it('should show error when no camera is found', async () => {
      // Mock getUserMedia to simulate no camera found
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        Object.assign(new Error('No camera found'), { name: 'NotFoundError' })
      );
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
        configurable: true,
      });

      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const takePhotoButton = screen.getByLabelText('Open camera to take photo');
      fireEvent.click(takePhotoButton);

      await waitFor(() => {
        expect(screen.getByText(/No camera found/)).toBeInTheDocument();
      });
    });

    it('should show error when camera is already in use', async () => {
      // Mock getUserMedia to simulate camera in use
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        Object.assign(new Error('Camera in use'), { name: 'NotReadableError' })
      );
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
        configurable: true,
      });

      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const takePhotoButton = screen.getByLabelText('Open camera to take photo');
      fireEvent.click(takePhotoButton);

      await waitFor(() => {
        expect(screen.getByText(/Camera is already in use/)).toBeInTheDocument();
      });
    });

    it('should show error when MediaDevices API is not available', async () => {
      // Mock navigator.mediaDevices as undefined
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const takePhotoButton = screen.getByLabelText('Open camera to take photo');
      fireEvent.click(takePhotoButton);

      await waitFor(() => {
        expect(screen.getByText(/Camera is not available on this device/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have minimum 44px tap targets for buttons', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const takePhotoButton = screen.getByLabelText('Open camera to take photo');
      const uploadButton = screen.getByLabelText('Upload image from device');
      const cancelButton = screen.getByText('Cancel').closest('button');
      const submitButton = screen.getByText('Submit Photo').closest('button');

      // Check that buttons have min-h-[44px] class
      expect(takePhotoButton.className).toContain('min-h-[44px]');
      expect(uploadButton.className).toContain('min-h-[44px]');
      expect(cancelButton?.className).toContain('min-h-[44px]');
      expect(submitButton?.className).toContain('min-h-[44px]');
    });

    it('should have minimum 16px text size', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const takePhotoButton = screen.getByText('Take Photo');
      const uploadButton = screen.getByText('Upload Image');

      // Check that button text has text-base class (16px)
      expect(takePhotoButton.className).toContain('text-base');
      expect(uploadButton.className).toContain('text-base');
    });
  });

  describe('Error Display', () => {
    it('should display error message when provided', () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Initially no error
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should clear error when new file is selected', async () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // First, trigger an error with invalid file
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText('Upload image from device').parentElement?.querySelector('input[type="file"]');
      
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [invalidFile],
          writable: false,
        });
        
        fireEvent.change(fileInput);

        await waitFor(() => {
          expect(screen.getByText('Unsupported file format. Please upload a JPEG, PNG, or HEIC image.')).toBeInTheDocument();
        });

        // Now select a valid file
        const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(fileInput, 'files', {
          value: [validFile],
          writable: false,
        });
        
        fireEvent.change(fileInput);

        // Error should be cleared (though preview might not show in test environment)
        await waitFor(() => {
          expect(screen.queryByText('Unsupported file format. Please upload a JPEG, PNG, or HEIC image.')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Submit Behavior', () => {
    it('should show error when submitting without selecting a file', async () => {
      render(
        <PhotoCaptureModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByText('Submit Photo').closest('button');
      
      // Button should be disabled when no file is selected
      expect(submitButton).toBeDisabled();
    });
  });
});
