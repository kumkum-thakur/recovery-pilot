/**
 * Unit tests for CelebrationOverlay component
 * 
 * Tests:
 * - Visibility toggle
 * - Auto-dismiss after 2 seconds
 * - Milestone detection and enhanced animations
 * - Regular completion animations
 * - Callback invocation
 * - Accessibility attributes
 * 
 * Requirements: 11.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CelebrationOverlay } from './CelebrationOverlay';

describe('CelebrationOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Visibility', () => {
    it('should not render when isVisible is false', () => {
      const onComplete = vi.fn();
      
      const { container } = render(
        <CelebrationOverlay
          isVisible={false}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Should not render overlay
      expect(container.querySelector('[role="presentation"]')).toBeNull();
    });

    it('should render when isVisible is true', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Should render overlay
      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    it('should call onComplete after 2 seconds', async () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Should not be called immediately
      expect(onComplete).not.toHaveBeenCalled();
      
      // Fast-forward time by 2 seconds
      vi.advanceTimersByTime(2000);
      
      // Should be called after 2 seconds
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onComplete before 2 seconds', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Fast-forward time by 1 second
      vi.advanceTimersByTime(1000);
      
      // Should not be called yet
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should cleanup timer on unmount', () => {
      const onComplete = vi.fn();
      
      const { unmount } = render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Unmount before timer completes
      unmount();
      
      // Fast-forward time
      vi.advanceTimersByTime(2000);
      
      // Should not be called after unmount
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Regular Completion', () => {
    it('should show regular completion message for non-milestone streaks', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Should show regular completion message
      expect(screen.getByText('Mission Complete!')).toBeInTheDocument();
    });

    it('should not show milestone message for non-milestone streaks', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Should not show milestone message
      expect(screen.queryByText(/Day Milestone!/)).toBeNull();
    });

    it('should default to streak 0 if not provided', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          onComplete={onComplete}
        />
      );
      
      // Should show regular completion message (not milestone)
      expect(screen.getByText('Mission Complete!')).toBeInTheDocument();
    });
  });

  describe('Milestone Completion', () => {
    it('should show milestone message for 7-day streak', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={7}
          onComplete={onComplete}
        />
      );
      
      // Should show milestone message
      expect(screen.getByText('7 Day Milestone!')