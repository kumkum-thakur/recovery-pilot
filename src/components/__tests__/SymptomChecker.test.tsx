import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SymptomChecker } from '../SymptomChecker';

// Mock framer-motion to avoid animation complexity in tests
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

describe('SymptomChecker', () => {
  it('should render the component with heading and categories', () => {
    render(<SymptomChecker />);

    expect(screen.getByText('Symptom Checker')).toBeInTheDocument();
    // Should show symptom categories
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Wound')).toBeInTheDocument();
    expect(screen.getByText('Respiratory')).toBeInTheDocument();
    expect(screen.getByText('Cardiovascular')).toBeInTheDocument();
  });

  it('should expand a category and show symptoms on click', () => {
    render(<SymptomChecker />);

    // Click on the "General" category to expand it
    const generalCategory = screen.getByText('General');
    fireEvent.click(generalCategory);

    // Symptoms under General should now be visible
    expect(screen.getByText('Fever')).toBeInTheDocument();
    expect(screen.getByText('Fatigue')).toBeInTheDocument();
    expect(screen.getByText('Chills')).toBeInTheDocument();
  });

  it('should allow selecting symptoms', () => {
    render(<SymptomChecker />);

    // Expand General category
    fireEvent.click(screen.getByText('General'));

    // Select Fever
    const feverButton = screen.getByText('Fever');
    fireEvent.click(feverButton);

    // The "Check Symptoms" button should now be visible/enabled
    // since we have at least one symptom selected
    const checkButton = screen.getByText('Check Symptoms');
    expect(checkButton).toBeInTheDocument();
  });

  it('should show analyzing state after clicking Check Symptoms', () => {
    render(<SymptomChecker />);

    // Expand Wound category and select symptoms
    fireEvent.click(screen.getByText('Wound'));
    fireEvent.click(screen.getByText('Redness around incision'));
    fireEvent.click(screen.getByText('Swelling'));

    // Click Check Symptoms
    const checkButton = screen.getByText('Check Symptoms');
    fireEvent.click(checkButton);

    // Should show loading/analyzing state (the component uses setTimeout internally)
    expect(screen.getByText(/Analyzing/i)).toBeInTheDocument();
  });

  it('should show body map with clickable regions', () => {
    render(<SymptomChecker />);

    // Body map regions should be present
    expect(screen.getByLabelText('Head')).toBeInTheDocument();
    expect(screen.getByLabelText('Chest')).toBeInTheDocument();
    expect(screen.getByLabelText('Abdomen')).toBeInTheDocument();
  });
});
