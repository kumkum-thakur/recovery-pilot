/**
 * ProtectedRoute Tests
 * 
 * Tests for the ProtectedRoute component that guards authenticated routes.
 * 
 * Requirements: 1.1, 2.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useUserStore } from '../stores/userStore';
import { UserRole } from '../types';
import { authService } from '../services/authService';

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(),
    logout: vi.fn(),
    validateCredentials: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
}));

// Test component to render inside protected route
function TestComponent({ text }: { text: string }) {
  return <div>{text}</div>;
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Reset user store before each test
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
    });
    
    // Reset authService mock
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to /login when user is not authenticated', () => {
      window.history.pushState({}, '', '/protected');
      
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent text="Protected Content" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to login, so we should see "Login Page"
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to /login when currentUser is null', () => {
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: null,
      });

      window.history.pushState({}, '', '/protected');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent text="Protected Content" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Access Without Role Requirement', () => {
    it('should render children when user is authenticated (patient)', () => {
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

      window.history.pushState({}, '', '/');

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TestComponent text="Protected Content" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render children when user is authenticated (doctor)', () => {
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

      window.history.pushState({}, '', '/');

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TestComponent text="Protected Content" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should render children when patient accesses patient route', () => {
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

      window.history.pushState({}, '', '/');

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRole={UserRole.PATIENT}>
                  <TestComponent text="Patient Content" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText('Patient Content')).toBeInTheDocument();
    });

    it('should render children when doctor accesses doctor route', () => {
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

      window.history.pushState({}, '', '/');

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRole={UserRole.DOCTOR}>
                  <TestComponent text="Doctor Content" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText('Doctor Content')).toBeInTheDocument();
    });

    it('should redirect patient to /patient when accessing doctor route', () => {
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

      window.history.pushState({}, '', '/doctor');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/patient" element={<div>Patient Dashboard</div>} />
            <Route
              path="/doctor"
              element={
                <ProtectedRoute requiredRole={UserRole.DOCTOR}>
                  <TestComponent text="Doctor Content" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to patient dashboard
      expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Doctor Content')).not.toBeInTheDocument();
    });

    it('should redirect doctor to /doctor when accessing patient route', () => {
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

      window.history.pushState({}, '', '/patient');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/doctor" element={<div>Doctor Dashboard</div>} />
            <Route
              path="/patient"
              element={
                <ProtectedRoute requiredRole={UserRole.PATIENT}>
                  <TestComponent text="Patient Content" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to doctor dashboard
      expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Patient Content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing requiredRole parameter', () => {
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

      window.history.pushState({}, '', '/');

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TestComponent text="Content Without Role Check" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText('Content Without Role Check')).toBeInTheDocument();
    });
  });
});
