/**
 * LoginPage Unit Tests
 * 
 * Tests for the LoginPage component including:
 * - Form rendering
 * - Form validation
 * - Successful login flow
 * - Error handling
 * - Role-based redirection
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useUserStore } from '../stores/userStore';
import { UserRole } from '../types';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render LoginPage with router
function renderLoginPage() {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset user store
    useUserStore.getState().logout();
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      renderLoginPage();
      
      expect(screen.getByText('RecoveryPilot')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should display demo credentials hint', () => {
      renderLoginPage();
      
      expect(screen.getByText(/Demo Credentials:/i)).toBeInTheDocument();
      expect(screen.getByText(/Patient:/i)).toBeInTheDocument();
      expect(screen.getByText(/Doctor:/i)).toBeInTheDocument();
    });

    it('should display role auto-detection message', () => {
      renderLoginPage();
      
      expect(screen.getByText(/Role is automatically detected from your credentials/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when username is empty', async () => {
      renderLoginPage();
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      renderLoginPage();
      
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'divya' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should clear previous errors when submitting again', async () => {
      renderLoginPage();
      
      // First submission with empty fields
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
      
      // Fill in username and submit again
      const usernameInput = screen.getByLabelText('Username');
      fireEvent.change(usernameInput, { target: { value: 'divya' } });
      fireEvent.click(submitButton);
      
      // Old error should be cleared, new error should appear
      await waitFor(() => {
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Login', () => {
    it('should login patient and redirect to /patient', async () => {
      renderLoginPage();
      
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'divya' } });
      fireEvent.change(passwordInput, { target: { value: 'divya' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const currentUser = useUserStore.getState().currentUser;
        expect(currentUser).not.toBeNull();
        expect(currentUser?.role).toBe(UserRole.PATIENT);
        expect(mockNavigate).toHaveBeenCalledWith('/patient');
      });
    });

    it('should login doctor and redirect to /doctor', async () => {
      renderLoginPage();
      
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'dr.smith' } });
      fireEvent.change(passwordInput, { target: { value: 'smith' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const currentUser = useUserStore.getState().currentUser;
        expect(currentUser).not.toBeNull();
        expect(currentUser?.role).toBe(UserRole.DOCTOR);
        expect(mockNavigate).toHaveBeenCalledWith('/doctor');
      });
    });

    it('should show loading state during login', async () => {
      renderLoginPage();
      
      const usernameInput = screen.getByLabelText('Username');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(usernameInput, { target: { value: 'divya' } });
      fireEvent.change(passwordInput, { target: { value: 'divya' } });
      fireEvent.click(submitButton);
      
      // Button should show loading text
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('should disable form inputs during login', async () => {
      renderLoginPage();
      
      const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const submitButton = screen.getByRo