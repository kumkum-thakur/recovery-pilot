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
      expect(screen.getByText(/Welcome back, Test Patient/i)).toBeInTheDocument(