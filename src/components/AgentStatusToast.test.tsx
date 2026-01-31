/**
 * AgentStatusToast - Unit tests
 * 
 * Tests the AgentStatusToast component's rendering and behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AgentStatusToast } from './AgentStatusToast';
import type { AgentStep } from '../types';

describe('AgentStatusToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when isVisible is false', () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Step 1', status: 'pending' },
    ];
    
    const { container } = render(
      <AgentStatusToast steps={steps} isVisible={false} onComplete={vi.fn()} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render when isVisible is true', () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Analyzing Image...', status: 'pending' },
    ];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    expect(screen.getByText('Agent Working...')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Image...')).toBeInTheDocument();
  });

  it('should display all workflow steps', () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Analyzing Image...', status: 'completed' },
      { id: '2', label: 'Drafting Clinical Note...', status: 'in_progress' },
      { id: '3', label: 'Creating Appointment Slot...', status: 'pending' },
    ];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    expect(screen.getByText('Analyzing Image...')).toBeInTheDocument();
    expect(screen.getByText('Drafting Clinical Note...')).toBeInTheDocument();
    expect(screen.getByText('Creating Appointment Slot...')).toBeInTheDocument();
  });

  it('should show "Agent Working..." header when workflow is in progress', () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Step 1', status: 'in_progress' },
    ];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    expect(screen.getByText('Agent Working...')).toBeInTheDocument();
  });

  it('should show "Workflow Complete" header when all steps are completed', () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Step 1', status: 'completed' },
      { id: '2', label: 'Step 2', status: 'completed' },
    ];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    expect(screen.getByText('Workflow Complete')).toBeInTheDocument();
    expect(screen.getByText('All done! ✨')).toBeInTheDocument();
  });

  it('should show "Workflow Failed" header when any step fails', () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Step 1', status: 'completed' },
      { id: '2', label: 'Step 2', status: 'failed' },
    ];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    expect(screen.getByText('Workflow Failed')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('should call onComplete after delay when all steps are completed', async () => {
    const onComplete = vi.fn();
    const steps: AgentStep[] = [
      { id: '1', label: 'Step 1', status: 'completed' },
      { id: '2', label: 'Step 2', status: 'completed' },
    ];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={onComplete} />
    );
    
    // Should not call immediately
    expect(onComplete).not.toHaveBeenCalled();
    
    // Fast-forward time by 1.5 seconds
    vi.advanceTimersByTime(1500);
    
    // Should call onComplete after delay
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('should not auto-dismiss if steps are not all completed', () => {
    const onComplete = vi.fn();
    const steps: AgentStep[] = [
      { id: '1', label: 'Step 1', status: 'completed' },
      { id: '2', label: 'Step 2', status: 'in_progress' },
    ];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={onComplete} />
    );
    
    // Fast-forward time
    vi.advanceTimersByTime(2000);
    
    // Should not call onComplete
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should have proper ARIA attributes for accessibility', () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Step 1', status: 'in_progress' },
    ];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  it('should display different icons for different step statuses', () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Completed Step', status: 'completed' },
      { id: '2', label: 'In Progress Step', status: 'in_progress' },
      { id: '3', label: 'Pending Step', status: 'pending' },
      { id: '4', label: 'Failed Step', status: 'failed' },
    ];
    
    const { container } = render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    // Check that all steps are rendered
    expect(screen.getByText('Completed Step')).toBeInTheDocument();
    expect(screen.getByText('In Progress Step')).toBeInTheDocument();
    expect(screen.getByText('Pending Step')).toBeInTheDocument();
    expect(screen.getByText('Failed Step')).toBeInTheDocument();
    
    // Check for spinning animation on in_progress step
    const spinningIcons = container.querySelectorAll('.animate-spin');
    expect(spinningIcons.length).toBeGreaterThan(0);
  });

  it('should handle empty steps array', () => {
    const steps: AgentStep[] = [];
    
    render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    // Should still render the toast container
    expect(screen.getByText('Agent Working...')).toBeInTheDocument();
  });

  it('should animate out when isVisible changes to false', async () => {
    const steps: AgentStep[] = [
      { id: '1', label: 'Step 1', status: 'completed' },
    ];
    
    const { rerender, container } = render(
      <AgentStatusToast steps={steps} isVisible={true} onComplete={vi.fn()} />
    );
    
    // Initially visible
    expect(container.firstChild).not.toBeNull();
    
    // Change to not visible
    rerender(
      <AgentStatusToast steps={steps} isVisible={false} onComplete={vi.fn()} />
    );
    
    // Should still be in DOM but animating out
    expect(container.firstChild).not.toBeNull();
    
    // Fast-forward animation
    vi.advanceTimersByTime(300);
    
    // Should be removed from DOM after animation
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
