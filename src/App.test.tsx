/**
 * App Routing Tests
 * 
 * Tests for the main App component routing logic.
 * 
 * Requirements: 1.1, 2.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useUserStore } from './stores/userStore';
import { UserRole } from './types';

describe('App Routing', () => {
  beforeEach(() => {
    // Reset user store before each test
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
    });
    
    // Clear localStorage to reset config
    localStorage.clear();
  });

  describe('Root Route (/)', () => {
    it('should redirect unauthenticated users to /login', () => {
      render(<App />);
      
      // Should show login page content
      expect(screen.getByText('RecoveryPilot')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should redirect authenticated patient to /patient', () => {
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: {
          id: 'patient-1',
          name: 'Test Patient',
          role: UserRole.PATIENT,
          streakCount: 5,
        },
      });

      render(<App />);
      
      // Should show patient dashboard content
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument();
    });

    it('should redirect authenticated doctor to /doctor', () => {
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: {
          id: 'doctor-1',
          name: 'Test Doctor',
          role: UserRole.DOCTOR,
        },
      });

      render(<App />);
      
      // Should show doctor dashboard content
      expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Welcome, Test Doctor/i)).toBeInTheDocument();
    });
  });

  describe('Login Route (/login)', () => {
    it('should show login page when not authenticated', () => {
      // Set initial URL to /login
      window.history.pushState({}, '', '/login');
      
      render(<App />);
      
      expect(screen.getByText('RecoveryPilot')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should redirect authenticated patient to /patient from /login', () => {
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: {
          id: 'patient-1',
          name: 'Test Patient',
          role: UserRole.PATIENT,
          streakCount: 3,
        },
      });

      window.history.pushState({}, '', '/login');
      render(<App />);
      
      // Should redirect to patient dashboard
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('should redirect authenticated doctor to /doctor from /login', () => {
      useUserStore.setState({
        isAuthenticated: true,
        currentUser: {
          id: 'doctor-1',
          name: 'Test Doctor',
          role: UserRole.DOCTOR,
        },
      });

      window.history.pushState({}, '', '/login');
      render(<App />);
      
      // Should redirect to doctor dashboard
      expect(screen.getByText('Doctor Dash