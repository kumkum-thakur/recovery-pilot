/**
 * App Routing Tests
 *
 * Integration tests for the main App component routing logic.
 * Uses real authService, real persistenceService, and real seed data.
 * No mocks — every code path exercises the actual production services.
 *
 * Requirements: 1.1, 2.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import App from './App';
import { useUserStore } from './stores/userStore';
import { authService } from './services/authService';
import { persistenceService } from './services/persistenceService';
import { reinitializeWithSeedData } from './services/seedData';

// Real seed credentials — must match src/services/seedData.ts
const PATIENT = { username: 'divya', password: 'divya', name: 'Divya Patel' };
const DOCTOR = { username: 'dr.smith', password: 'smith', name: 'Dr. Sarah Smith' };

/** Log in a real user and sync the user store */
async function loginAs(username: string, password: string) {
  const user = await authService.login(username, password);
  useUserStore.setState({ isAuthenticated: true, currentUser: user });
  return user;
}

describe('App Routing', () => {
  beforeEach(() => {
    // Fresh real seed data in real localStorage for every test
    reinitializeWithSeedData(persistenceService);

    // Reset user store
    useUserStore.setState({ currentUser: null, isAuthenticated: false });

    // Fake timers so async effects (e.g. DoctorDashboard's 100ms
    // fetchActionItems delay) don't outlive the test environment
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Advance past the 100ms fetchActionItems delay so the async
    // effect completes while localStorage is still available.
    // (Cannot use runAllTimers — SessionMonitor has a recurring interval.)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    cleanup();
    vi.useRealTimers();
    authService.logout();
  });

  // ───────── Root Route (/) ─────────

  describe('Root Route (/)', () => {
    it('should redirect unauthenticated users to /login', () => {
      render(<App />);

      expect(screen.getByText('RecoveryPilot')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should redirect authenticated patient to /patient', async () => {
      await loginAs(PATIENT.username, PATIENT.password);

      render(<App />);

      expect(screen.getByText(new RegExp(`Welcome back, ${PATIENT.name}`, 'i'))).toBeInTheDocument();
    });

    it('should redirect authenticated doctor to /doctor', async () => {
      await loginAs(DOCTOR.username, DOCTOR.password);

      render(<App />);

      expect(screen.getAllByText('Triage Dashboard').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ───────── Login Route (/login) ─────────

  describe('Login Route (/login)', () => {
    it('should show login page when not authenticated', () => {
      window.history.pushState({}, '', '/login');
      render(<App />);

      expect(screen.getByText('RecoveryPilot')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should redirect authenticated patient to /patient from /login', async () => {
      await loginAs(PATIENT.username, PATIENT.password);

      window.history.pushState({}, '', '/login');
      render(<App />);

      expect(screen.getByText(new RegExp(`Welcome back, ${PATIENT.name}`, 'i'))).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('should redirect authenticated doctor to /doctor from /login', async () => {
      await loginAs(DOCTOR.username, DOCTOR.password);

      window.history.pushState({}, '', '/login');
      render(<App />);

      expect(screen.getAllByText('Triage Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
  });

  // ───────── Patient Route (/patient) ─────────

  describe('Patient Route (/patient)', () => {
    it('should show patient dashboard for authenticated patient', async () => {
      await loginAs(PATIENT.username, PATIENT.password);

      window.history.pushState({}, '', '/patient');
      render(<App />);

      expect(screen.getByText(new RegExp(`Welcome back, ${PATIENT.name}`, 'i'))).toBeInTheDocument();
    });

    it('should redirect unauthenticated user to /login', () => {
      window.history.pushState({}, '', '/patient');
      render(<App />);

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
    });

    it('should redirect doctor to /doctor when accessing /patient', async () => {
      await loginAs(DOCTOR.username, DOCTOR.password);

      window.history.pushState({}, '', '/patient');
      render(<App />);

      expect(screen.getAllByText('Triage Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
    });
  });

  // ───────── Doctor Route (/doctor) ─────────

  describe('Doctor Route (/doctor)', () => {
    it('should show doctor dashboard for authenticated doctor', async () => {
      await loginAs(DOCTOR.username, DOCTOR.password);

      window.history.pushState({}, '', '/doctor');
      render(<App />);

      expect(screen.getAllByText('Triage Dashboard').length).toBeGreaterThanOrEqual(1);
    });

    it('should redirect unauthenticated user to /login', () => {
      window.history.pushState({}, '', '/doctor');
      render(<App />);

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.queryByText('Doctor Dashboard')).not.toBeInTheDocument();
    });

    it('should redirect patient to /patient when accessing /doctor', async () => {
      await loginAs(PATIENT.username, PATIENT.password);

      window.history.pushState({}, '', '/doctor');
      render(<App />);

      expect(screen.getByText(new RegExp(`Welcome back, ${PATIENT.name}`, 'i'))).toBeInTheDocument();
      expect(screen.queryByText('Doctor Dashboard')).not.toBeInTheDocument();
    });
  });

  // ───────── Invalid Routes ─────────

  describe('Invalid Routes', () => {
    it('should redirect to root for unknown routes', () => {
      window.history.pushState({}, '', '/unknown-route');
      render(<App />);

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should redirect authenticated patient to /patient for unknown routes', async () => {
      await loginAs(PATIENT.username, PATIENT.password);

      window.history.pushState({}, '', '/some-invalid-path');
      render(<App />);

      expect(screen.getByText(new RegExp(`Welcome back, ${PATIENT.name}`, 'i'))).toBeInTheDocument();
    });

    it('should redirect authenticated doctor to /doctor for unknown routes', async () => {
      await loginAs(DOCTOR.username, DOCTOR.password);

      window.history.pushState({}, '', '/another-invalid-path');
      render(<App />);

      expect(screen.getAllByText('Triage Dashboard').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ───────── Navigation Guards ─────────

  describe('Navigation Guards', () => {
    it('should maintain authentication state across route changes', async () => {
      await loginAs(PATIENT.username, PATIENT.password);

      const { rerender } = render(<App />);

      expect(screen.getByText(new RegExp(`Welcome back, ${PATIENT.name}`, 'i'))).toBeInTheDocument();

      // Simulate navigation
      window.history.pushState({}, '', '/patient');
      rerender(<App />);

      expect(screen.getByText(new RegExp(`Welcome back, ${PATIENT.name}`, 'i'))).toBeInTheDocument();
    });

    it('should redirect to login after logout', async () => {
      await loginAs(PATIENT.username, PATIENT.password);

      const { rerender } = render(<App />);

      expect(screen.getByText(new RegExp(`Welcome back, ${PATIENT.name}`, 'i'))).toBeInTheDocument();

      // Real logout
      authService.logout();
      useUserStore.setState({ isAuthenticated: false, currentUser: null });

      rerender(<App />);

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });
  });
});
