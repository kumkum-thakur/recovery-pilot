import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PainTracker } from '../PainTracker';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, layout, ...validProps } = props as Record<string, unknown>;
      return <div {...(validProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, layout, ...validProps } = props as Record<string, unknown>;
      return <button {...(validProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, layout, ...validProps } = props as Record<string, unknown>;
      return <span {...(validProps as React.HTMLAttributes<HTMLSpanElement>)}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('PainTracker', () => {
  it('should render the component with heading and pain scale', () => {
    render(<PainTracker />);

    expect(screen.getByText('Pain Tracker')).toBeInTheDocument();
    expect(screen.getByText('Pain Level')).toBeInTheDocument();
    expect(screen.getByText('No Pain')).toBeInTheDocument();

    // The slider should be present
    const slider = screen.getByLabelText(/Pain level: 0 out of 10/i);
    expect(slider).toBeInTheDocument();
  });

  it('should update pain score display when slider changes', () => {
    render(<PainTracker />);

    const slider = screen.getByLabelText(/Pain level/i);
    fireEvent.change(slider, { target: { value: '7' } });

    // The label should update to "Severe" for score 7
    expect(screen.getByText('Severe')).toBeInTheDocument();
  });

  it('should show pain quality options', () => {
    render(<PainTracker />);

    expect(screen.getByText('Pain Quality')).toBeInTheDocument();
    expect(screen.getByText('Sharp')).toBeInTheDocument();
    expect(screen.getByText('Dull')).toBeInTheDocument();
    expect(screen.getByText('Burning')).toBeInTheDocument();
    expect(screen.getByText('Throbbing')).toBeInTheDocument();
    expect(screen.getByText('Aching')).toBeInTheDocument();
    expect(screen.getByText('Stabbing')).toBeInTheDocument();
  });

  it('should allow selecting pain qualities', () => {
    render(<PainTracker />);

    const sharpButton = screen.getByText('Sharp');
    fireEvent.click(sharpButton);

    // After clicking, the button should change styling (have the selected state)
    // We can verify by checking the parent button element has the selected class
    const button = sharpButton.closest('button');
    expect(button?.className).toContain('orange');
  });

  it('should show pain timing options', () => {
    render(<PainTracker />);

    expect(screen.getByText('Pain Timing')).toBeInTheDocument();
    expect(screen.getByText('Constant')).toBeInTheDocument();
    expect(screen.getByText('Intermittent')).toBeInTheDocument();
    expect(screen.getByText('Activity-Related')).toBeInTheDocument();
  });

  it('should show medication effectiveness options', () => {
    render(<PainTracker />);

    expect(screen.getByText('Medication Effectiveness')).toBeInTheDocument();
    expect(screen.getByText('Very effective')).toBeInTheDocument();
    expect(screen.getByText('Not taking medication')).toBeInTheDocument();
  });

  it('should have body region buttons for pain location', () => {
    render(<PainTracker />);

    expect(screen.getByText('Pain Location')).toBeInTheDocument();
    // Body regions should be clickable
    expect(screen.getByLabelText('Head')).toBeInTheDocument();
    expect(screen.getByLabelText('Chest')).toBeInTheDocument();
    expect(screen.getByLabelText('Abdomen')).toBeInTheDocument();
  });

  it('should show 7-day pain trend chart', () => {
    render(<PainTracker />);

    expect(screen.getByText('7-Day Pain Trend')).toBeInTheDocument();
    // Mock history days should be shown
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('should show submit and reset buttons', () => {
    render(<PainTracker />);

    expect(screen.getByText('Log Pain Entry')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should trigger submission when clicking Log Pain Entry', () => {
    render(<PainTracker />);

    // Click submit
    const submitButton = screen.getByText('Log Pain Entry');
    fireEvent.click(submitButton);

    // After submission, the button text or UI should change to indicate success
    // The component sets isSubmitted=true synchronously then schedules a reset
    expect(screen.getByText(/Pain Entry Logged/i)).toBeInTheDocument();
  });
});
