/**
 * Unit tests for StreakDisplay component
 * 
 * Tests that the component displays streak count correctly and meets
 * accessibility requirements.
 * 
 * Requirements: 10.3
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakDisplay } from './StreakDisplay';

describe('StreakDisplay', () => {
  it('should display streak count with fire emoji', () => {
    render(<StreakDisplay streakCount={5} />);
    
    // Check that streak count is displayed
    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    
    // Check that fire emoji is present
    expect(screen.getByText('🔥')).toBeInTheDocument();
    
    // Check that "Streak" label is present
    expect(screen.getByText(/streak/i)).toBeInTheDocument();
  });

  it('should display singular "day" for streak count of 1', () => {
    render(<StreakDisplay streakCount={1} />);
    
    expect(screen.getByText(/1 day$/i)).toBeInTheDocument();
  });

  it('should display plural "days" for streak count greater than 1', () => {
    render(<StreakDisplay streakCount={3} />);
    
    expect(screen.getByText(/3 days/i)).toBeInTheDocument();
  });

  it('should display zero streak count', () => {
    render(<StreakDisplay streakCount={0} />);
    
    expect(screen.getByText(/0 days/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<StreakDisplay streakCount={7} />);
    
    // Check for role="status" for screen readers
    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
    
    // Check for aria-label
    expect(statusElement).toHaveAttribute('aria-label', 'Current streak: 7 days');
  });

  it('should display large streak counts correctly', () => {
    render(<StreakDisplay streakCount={365} />);
    
    expect(screen.getByText(/365 days/i)).toBeInTheDocument();
  });

  it('should use gamification accent color classes', () => {
    const { container } = render(<StreakDisplay streakCount={5} />);
    
    // Check that gamification color classes are applied
    const streakDiv = container.querySelector('.bg-gamification-accent\\/10');
    expect(streakDiv).toBeInTheDocument();
  });
});
