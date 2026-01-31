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
    it('should call onComplete after 2 seconds', () => {
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
      expect(onComplete).toHaveBeenCalledTimes(1);
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
      expect(screen.getByText('7 Day Milestone!')).toBeInTheDocument();
      expect(screen.getByText("You're crushing it! Keep going! 💪")).toBeInTheDocument();
    });

    it('should show milestone message for 30-day streak', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={30}
          onComplete={onComplete}
        />
      );
      
      // Should show milestone message
      expect(screen.getByText('30 Day Milestone!')).toBeInTheDocument();
    });

    it('should show milestone message for 100-day streak', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={100}
          onComplete={onComplete}
        />
      );
      
      // Should show milestone message
      expect(screen.getByText('100 Day Milestone!')).toBeInTheDocument();
    });

    it('should not show regular completion message for milestones', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={7}
          onComplete={onComplete}
        />
      );
      
      // Should not show regular message
      expect(screen.queryByText('Mission Complete!')).toBeNull();
    });

    it('should not show milestone message for near-milestone streaks', () => {
      const onComplete = vi.fn();
      
      // Test 6 days (just before 7-day milestone)
      const { rerender } = render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={6}
          onComplete={onComplete}
        />
      );
      
      expect(screen.queryByText(/Day Milestone!/)).toBeNull();
      expect(screen.getByText('Mission Complete!')).toBeInTheDocument();
      
      // Test 8 days (just after 7-day milestone)
      rerender(
        <CelebrationOverlay
          isVisible={true}
          streakCount={8}
          onComplete={onComplete}
        />
      );
      
      expect(screen.queryByText(/Day Milestone!/)).toBeNull();
      expect(screen.getByText('Mission Complete!')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      const overlay = screen.getByRole('presentation');
      
      // Should have aria-live for screen reader announcements
      expect(overlay).toHaveAttribute('aria-live', 'polite');
      
      // Should have aria-label for context
      expect(overlay).toHaveAttribute('aria-label', 'Celebration animation');
    });

    it('should have pointer-events-none to avoid blocking interaction', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      const overlay = screen.getByRole('presentation');
      
      // Should have pointer-events-none class
      expect(overlay).toHaveClass('pointer-events-none');
    });
  });

  describe('Confetti Generation', () => {
    it('should generate confetti when visible', () => {
      const onComplete = vi.fn();
      
      const { container } = render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Should have confetti pieces (divs with absolute positioning)
      const confettiPieces = container.querySelectorAll('.absolute');
      
      // Should have at least some confetti pieces
      // (Exact count may vary due to randomization, but should be > 0)
      expect(confettiPieces.length).toBeGreaterThan(0);
    });

    it('should not generate confetti when not visible', () => {
      const onComplete = vi.fn();
      
      const { container } = render(
        <CelebrationOverlay
          isVisible={false}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Should not have confetti pieces
      const confettiPieces = container.querySelectorAll('.absolute');
      expect(confettiPieces.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero streak count', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={0}
          onComplete={onComplete}
        />
      );
      
      // Should show regular completion message
      expect(screen.getByText('Mission Complete!')).toBeInTheDocument();
    });

    it('should handle negative streak count', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={-1}
          onComplete={onComplete}
        />
      );
      
      // Should show regular completion message (not milestone)
      expect(screen.getByText('Mission Complete!')).toBeInTheDocument();
    });

    it('should handle very large streak count', () => {
      const onComplete = vi.fn();
      
      render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={999}
          onComplete={onComplete}
        />
      );
      
      // Should show regular completion message (not a defined milestone)
      expect(screen.getByText('Mission Complete!')).toBeInTheDocument();
    });

    it('should handle rapid visibility changes', () => {
      const onComplete = vi.fn();
      
      const { rerender } = render(
        <CelebrationOverlay
          isVisible={true}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Hide immediately
      rerender(
        <CelebrationOverlay
          isVisible={false}
          streakCount={5}
          onComplete={onComplete}
        />
      );
      
      // Fast-forward time
      vi.advanceTimersByTime(2000);
      
      // Should not call onComplete (timer was cleaned up)
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
