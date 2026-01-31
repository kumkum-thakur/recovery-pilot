/**
 * Tests for TriageResultCard component
 * 
 * Validates:
 * - Green result display with positive feedback
 * - Red result display with action item notification
 * - Confidence score display
 * - Appropriate styling for each result type
 * 
 * Requirements: 6.3, 6.4, 6.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TriageResultCard } from './TriageResultCard';
import type { TriageAnalysis } from '../types';

describe('TriageResultCard', () => {
  describe('Green Results', () => {
    it('should display positive feedback for green results', () => {
      // Requirement 6.3: Display Green results with positive feedback
      render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well. Keep it dry."
          confidenceScore={0.92}
        />
      );

      // Check for positive title
      expect(screen.getByText('Looking Good! ✨')).toBeInTheDocument();
      
      // Check for positive subtitle
      expect(screen.getByText('Your incision is healing well')).toBeInTheDocument();
      
      // Check for analysis text
      expect(screen.getByText('Healing well. Keep it dry.')).toBeInTheDocument();
    });

    it('should display care instructions for green results', () => {
      // Requirement 6.3: Display care instructions
      render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well. Keep it dry."
          confidenceScore={0.92}
        />
      );

      // Check for care instructions section
      expect(screen.getByText('Keep up the great work! 💪')).toBeInTheDocument();
      expect(screen.getByText(/Continue following your care instructions/)).toBeInTheDocument();
      expect(screen.getByText(/Keep the area clean and dry/)).toBeInTheDocument();
      expect(screen.getByText(/Take your medications as prescribed/)).toBeInTheDocument();
    });

    it('should not display action item notification for green results', () => {
      render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well. Keep it dry."
          confidenceScore={0.92}
        />
      );

      // Should not show doctor review section
      expect(screen.queryByText('Doctor Review Requested')).not.toBeInTheDocument();
    });
  });

  describe('Red Results', () => {
    it('should display warning message for red results', () => {
      // Requirement 6.4: Display Red results with action item notification
      render(
        <TriageResultCard
          analysis={'red' as TriageAnalysis}
          analysisText="Redness detected. I have auto-drafted a message to Dr. Smith."
          confidenceScore={0.87}
          actionItemId="action-123"
        />
      );

      // Check for warning title
      expect(screen.getByText('Attention Needed')).toBeInTheDocument();
      
      // Check for warning subtitle
      expect(screen.getByText('Potential issue detected')).toBeInTheDocument();
      
      // Check for analysis text
      expect(screen.getByText(/Redness detected/)).toBeInTheDocument();
    });

    it('should display action item notification for red results', () => {
      // Requirement 6.4: Display action item notification
      const actionItemId = 'action-123-456-789';
      
      render(
        <TriageResultCard
          analysis={'red' as TriageAnalysis}
          analysisText="Redness detected. I have auto-drafted a message to Dr. Smith."
          confidenceScore={0.87}
          actionItemId={actionItemId}
        />
      );

      // Check for doctor review section
      expect(screen.getByText('Doctor Review Requested')).toBeInTheDocument();
      expect(screen.getByText(/automatically created a review request/)).toBeInTheDocument();
      
      // Check for action item ID display (truncated)
      expect(screen.getByText(/Action Item ID:/)).toBeInTheDocument();
      expect(screen.getByText(/action-1/)).toBeInTheDocument();
    });

    it('should handle red results without action item gracefully', () => {
      // Edge case: Red result without action item (shouldn't happen, but handle it)
      render(
        <TriageResultCard
          analysis={'red' as TriageAnalysis}
          analysisText="Redness detected."
          confidenceScore={0.87}
        />
      );

      // Should show fallback message
      expect(screen.getByText(/contact your doctor/)).toBeInTheDocument();
    });

    it('should not display care instructions for red results', () => {
      render(
        <TriageResultCard
          analysis={'red' as TriageAnalysis}
          analysisText="Redness detected. I have auto-drafted a message to Dr. Smith."
          confidenceScore={0.87}
          actionItemId="action-123"
        />
      );

      // Should not show care instructions section
      expect(screen.queryByText('Keep up the great work! 💪')).not.toBeInTheDocument();
    });
  });

  describe('Confidence Score', () => {
    it('should display confidence score as percentage', () => {
      // Requirement 6.5: Show confidence score
      render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well."
          confidenceScore={0.92}
        />
      );

      // Check for confidence score display
      expect(screen.getByText('Confidence')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('should round confidence score to nearest integer', () => {
      // Test rounding behavior
      render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well."
          confidenceScore={0.876}
        />
      );

      // Should round 87.6% to 88%
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('should display confidence score for both green and red results', () => {
      // Test green result
      const { rerender } = render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well."
          confidenceScore={0.92}
        />
      );
      expect(screen.getByText('92%')).toBeInTheDocument();

      // Test red result
      rerender(
        <TriageResultCard
          analysis={'red' as TriageAnalysis}
          analysisText="Redness detected."
          confidenceScore={0.87}
          actionItemId="action-123"
        />
      );
      expect(screen.getByText('87%')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply green styling for green results', () => {
      const { container } = render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well."
          confidenceScore={0.92}
        />
      );

      // Check for green background and border classes
      const card = container.querySelector('[role="alert"]');
      expect(card).toHaveClass('bg-emerald-50');
      expect(card).toHaveClass('border-gamification-success');
    });

    it('should apply red styling for red results', () => {
      const { container } = render(
        <TriageResultCard
          analysis={'red' as TriageAnalysis}
          analysisText="Redness detected."
          confidenceScore={0.87}
          actionItemId="action-123"
        />
      );

      // Check for red background and border classes
      const card = container.querySelector('[role="alert"]');
      expect(card).toHaveClass('bg-red-50');
      expect(card).toHaveClass('border-red-500');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well."
          confidenceScore={0.92}
        />
      );

      // Check for alert role and aria-live
      const card = container.querySelector('[role="alert"]');
      expect(card).toHaveAttribute('aria-live', 'polite');
    });

    it('should hide decorative icons from screen readers', () => {
      const { container } = render(
        <TriageResultCard
          analysis={'green' as TriageAnalysis}
          analysisText="Healing well."
          confidenceScore={0.92}
        />
      );

      // Check that icons have aria-hidden
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
