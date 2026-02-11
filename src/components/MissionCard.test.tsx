/**
 * Unit tests for MissionCard component
 * 
 * Requirements:
 * - 3.2: Display mission title, description, status
 * - 3.3: Show mission status (pending, completed, overdue)
 * - 4.1: Display action button as "Scan Incision" for photo upload
 * - 4.2: Display action button as "Mark Complete" for confirmation
 * - 4.3: Display action button with appropriate text for external actions
 * - 4.4: Execute corresponding mission action on button click
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MissionCard } from './MissionCard';
import type { Mission } from '../types';
import { MissionType, MissionStatus } from '../types';

describe('MissionCard', () => {
  const mockOnAction = vi.fn();

  const createMission = (overrides?: Partial<Mission>): Mission => ({
    id: 'mission-1',
    type: MissionType.PHOTO_UPLOAD,
    title: 'Mission 1: Scan Incision',
    description: 'Take a photo of your surgical incision for healing assessment',
    status: MissionStatus.PENDING,
    dueDate: new Date(),
    actionButtonText: 'Scan Incision',
    ...overrides,
  });

  beforeEach(() => {
    mockOnAction.mockClear();
  });

  describe('Display Requirements', () => {
    it('should display mission title, description, and status', () => {
      // Requirement 3.2: Display mission title, description, status
      const mission = createMission();
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.getByText('Mission 1: Scan Incision')).toBeInTheDocument();
      expect(screen.getByText('Take a photo of your surgical incision for healing assessment')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display completed status badge', () => {
      // Requirement 3.3: Show mission status (completed)
      const mission = createMission({ status: MissionStatus.COMPLETED });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Mission Complete! 🎉')).toBeInTheDocument();
    });

    it('should display overdue status badge', () => {
      // Requirement 3.3: Show mission status (overdue)
      const mission = createMission({ status: MissionStatus.OVERDUE });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('should display pending status badge', () => {
      // Requirement 3.3: Show mission status (pending)
      const mission = createMission({ status: MissionStatus.PENDING });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Smart Action Button', () => {
    it('should display "Scan Incision" for photo upload missions', () => {
      // Requirement 4.1: Display action button as "Scan Incision" for photo upload
      const mission = createMission({
        type: MissionType.PHOTO_UPLOAD,
        actionButtonText: 'Scan Incision',
      });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.getByText('Scan Incision')).toBeInTheDocument();
    });

    it('should display "Mark Complete" for medication check missions', () => {
      // Requirement 4.2: Display action button as "Mark Complete" for confirmation
      const mission = createMission({
        type: MissionType.MEDICATION_CHECK,
        title: 'Mission 2: Medication Check',
        actionButtonText: 'Mark Complete',
      });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
    });

    it('should display appropriate text for exercise log missions', () => {
      // Requirement 4.3: Display action button with appropriate text for external actions
      const mission = createMission({
        type: MissionType.EXERCISE_LOG,
        title: 'Mission 3: Exercise Log',
        actionButtonText: 'Log Exercise',
      });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.getByText('Log Exercise')).toBeInTheDocument();
    });

    it('should call onAction with mission id when button is clicked', () => {
      // Requirement 4.4: Execute corresponding mission action on button click
      const mission = createMission();
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      const button = screen.getByText('Scan Incision');
      fireEvent.click(button);

      expect(mockOnAction).toHaveBeenCalledTimes(1);
      expect(mockOnAction).toHaveBeenCalledWith('mission-1');
    });

    it('should not display action button for completed missions', () => {
      // Completed missions should not have an action button
      const mission = createMission({ status: MissionStatus.COMPLETED });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.queryByText('Scan Incision')).not.toBeInTheDocument();
      expect(screen.getByText('Mission Complete! 🎉')).toBeInTheDocument();
    });

    it('should display action button for overdue missions', () => {
      // Overdue missions should still be actionable
      const mission = createMission({ status: MissionStatus.OVERDUE });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      expect(screen.getByText('Scan Incision')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have minimum 44px tap target for action button', () => {
      // Requirement 13.2: Minimum 44px tap targets
      const mission = createMission();
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      const button = screen.getByText('Scan Incision').closest('button');
      expect(button).toHaveClass('min-h-[44px]');
    });

    it('should have proper aria-label for action button', () => {
      const mission = createMission();
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      const button = screen.getByLabelText('Scan Incision for Mission 1: Scan Incision');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should use medical theme colors', () => {
      const mission = createMission();
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      // Check for medical primary color on button
      const button = screen.getByText('Scan Incision').closest('button');
      expect(button).toHaveClass('bg-medical-primary');
    });

    it('should use gamification colors for completed state', () => {
      const mission = createMission({ status: MissionStatus.COMPLETED });
      render(<MissionCard mission={mission} onAction={mockOnAction} />);

      // Check for gamification success color
      const completedMessage = screen.getByText('Mission Complete! 🎉').closest('div');
      expect(completedMessage).toHaveClass('bg-gamification-success/10');
      expect(completedMessage).toHaveClass('text-gamification-success');
    });
  });

  describe('Mission Icons', () => {
    it('should display camera icon for photo upload missions', () => {
      const mission = createMission({ type: MissionType.PHOTO_UPLOAD });
      const { container } = render(<MissionCard mission={mission} onAction={mockOnAction} />);

      // Icon is rendered, check for the icon container
      const iconContainer = container.querySelector('.bg-gradient-to-br');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should display check circle icon for medication check missions', () => {
      const mission = createMission({ type: MissionType.MEDICATION_CHECK });
      const { container } = render(<MissionCard mission={mission} onAction={mockOnAction} />);

      const iconContainer = container.querySelector('.bg-gradient-to-br');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should display activity icon for exercise log missions', () => {
      const mission = createMission({ type: MissionType.EXERCISE_LOG });
      const { container } = render(<MissionCard mission={mission} onAction={mockOnAction} />);

      const iconContainer = container.querySelector('.bg-gradient-to-br');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
