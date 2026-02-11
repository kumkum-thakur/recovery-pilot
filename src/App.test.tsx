/**
 * App Routing Tests
 * 
 * Tests for the main App component routing logic.
 * 
 * Requirements: 1.1, 2.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useUserStore } from './stores/userStore';
import { UserRole } from './types';
import { authService } from './services/authService';

// Mock authService
vi.mock('./services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    getSessionTimeRemaining: vi.fn(() => 30 * 60 * 1000), // 30 minutes
    login: vi.fn(),
    logout: vi.fn(),
    validateCredentials: vi.fn(),
  },
}));

describe('App Routing', () => {
  beforeEach(() => {
    // Reset user store before each test
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
    });
    
    // Reset authService mock
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
    
    // Clear localStorage to reset config
    localStorage.clear();
  });

  describe('Root Route (/)', () => {
    it('should redirect unauthenticated users to /login', () => {
      render(<App />);
      
      // Should show login page content
      expect(screen.getByText('RecoveryPilot')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should redirect authenticated patient to /patient', () => {
      const testUser = {
        id: 'patient-1',
        name: 'Test Patient',
        role: UserRole.PATIENT,
        streakCount: 5,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      render(<App />);
      
      // Should show patient dashboard content
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument();
    });

    it('should redirect authenticated doctor to /doctor', () => {
      const testUser = {
        id: 'doctor-1',
        name: 'Test Doctor',
        role: UserRole.DOCTOR,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      render(<App />);
      
      // Should show doctor dashboard content
      expect(screen.getByText('Triage Dashboard')).toBeInTheDocument();
    });
  });

  describe('Login Route (/login)', () => {
    it('should show login page when not authenticated', () => {
      // Set initial URL to /login
      window.history.pushState({}, '', '/login');
      
      render(<App />);
      
      expect(screen.getByText('RecoveryPilot')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should redirect authenticated patient to /patient from /login', () => {
      const testUser = {
        id: 'patient-1',
        name: 'Test Patient',
        role: UserRole.PATIENT,
        streakCount: 3,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      window.history.pushState({}, '', '/login');
      render(<App />);
      
      // Should redirect to patient dashboard
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('should redirect authenticated doctor to /doctor from /login', () => {
      const testUser = {
        id: 'doctor-1',
        name: 'Test Doctor',
        role: UserRole.DOCTOR,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      window.history.pushState({}, '', '/login');
      render(<App />);
      
      // Should redirect to doctor dashboard
      expect(screen.getByText('Triage Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
  });

  describe('Patient Route (/patient)', () => {
    it('should show patient dashboard for authenticated patient', () => {
      const testUser = {
        id: 'patient-1',
        name: 'Divya Patel',
        role: UserRole.PATIENT,
        streakCount: 7,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      window.history.pushState({}, '', '/patient');
      render(<App />);
      
      expect(screen.getByText(/Welcome back, Divya Patel/i)).toBeInTheDocument();
    });

    it('should redirect unauthenticated user to /login', () => {
      window.history.pushState({}, '', '/patient');
      render(<App />);
      
      // Should redirect to login
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
    });

    it('should redirect doctor to /doctor when accessing /patient', () => {
      const testUser = {
        id: 'doctor-1',
        name: 'Dr. Smith',
        role: UserRole.DOCTOR,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      window.history.pushState({}, '', '/patient');
      render(<App />);
      
      // Should redirect to doctor dashboard
      expect(screen.getByText('Triage Dashboard')).toBeInTheDocument();
      expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
    });
  });

  describe('Doctor Route (/doctor)', () => {
    it('should show doctor dashboard for authenticated doctor', () => {
      const testUser = {
        id: 'doctor-1',
        name: 'Dr. Sarah Smith',
        role: UserRole.DOCTOR,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      window.history.pushState({}, '', '/doctor');
      render(<App />);
      
      expect(screen.getByText('Triage Dashboard')).toBeInTheDocument();
    });

    it('should redirect unauthenticated user to /login', () => {
      window.history.pushState({}, '', '/doctor');
      render(<App />);
      
      // Should redirect to login
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.queryByText('Doctor Dashboard')).not.toBeInTheDocument();
    });

    it('should redirect patient to /patient when accessing /doctor', () => {
      const testUser = {
        id: 'patient-1',
        name: 'Divya Patel',
        role: UserRole.PATIENT,
        streakCount: 5,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      window.history.pushState({}, '', '/doctor');
      render(<App />);
      
      // Should redirect to patient dashboard
      expect(screen.getByText(/Welcome back, Divya Patel/i)).toBeInTheDocument();
      expect(screen.queryByText('Doctor Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Invalid Routes', () => {
    it('should redirect to root for unknown routes', () => {
      window.history.pushState({}, '', '/unknown-route');
      render(<App />);
      
      // Should redirect to login (via root redirect)
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should redirect authenticated patient to /patient for unknown routes', () => {
      const testUser = {
        id: 'patient-1',
        name: 'Test Patient',
        role: UserRole.PATIENT,
        streakCount: 0,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      window.history.pushState({}, '', '/some-invalid-path');
      render(<App />);
      
      // Should redirect to patient dashboard
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument();
    });

    it('should redirect authenticated doctor to /doctor for unknown routes', () => {
      const testUser = {
        id: 'doctor-1',
        name: 'Test Doctor',
        role: UserRole.DOCTOR,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      window.history.pushState({}, '', '/another-invalid-path');
      render(<App />);
      
      // Should redirect to doctor dashboard
      expect(screen.getByText('Triage Dashboard')).toBeInTheDocument();
    });
  });

  describe('Navigation Guards', () => {
    it('should maintain authentication state across route changes', () => {
      const testUser = {
        id: 'patient-1',
        name: 'Test Patient',
        role: UserRole.PATIENT,
        streakCount: 5,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      const { rerender } = render(<App />);
      
      // Should show patient dashboard
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument();
      
      // Simulate navigation by changing URL
      window.history.pushState({}, '', '/patient');
      rerender(<App />);
      
      // Should still show patient dashboard
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument();
    });

    it('should redirect to login after logout', () => {
      const testUser = {
        id: 'patient-1',
        name: 'Test Patient',
        role: UserRole.PATIENT,
        streakCount: 5,
      };
      
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: testUser,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(testUser);

      const { rerender } = render(<App />);
      
      // Should show patient dashboard
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument();
      
      // Simulate logout
      useUserStore.setState({
        isAuthenticated: false,
        currentUser: null,
      });
      
      vi.mocked(authService.getCurrentUser).mockReturnValue(null);
      
      rerender(<App />);
      
      // Should redirect to login
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });
  });
});
