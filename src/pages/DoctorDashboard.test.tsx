/**
 * DoctorDashboard - Tests for doctor dashboard component
 * 
 * Requirements: 14.1, 14.2, 14.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DoctorDashboard } from './DoctorDashboard';
import { useUserStore } from '../stores/userStore';
import { useActionItemStore } from '../stores/actionItemStore';

// Mock the stores
vi.mock('../stores/userStore');
vi.mock('../stores/actionItemStore');

describe('DoctorDashboard', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock user store
    vi.mocked(useUserStore).mockReturnValue({
      currentUser: {
        id: 'doctor-1',
        name: 'Dr. Sarah Smith',
        role: 'doctor',
      },
      isAuthenticated: true,
      logout: vi.fn(),
      login: vi.fn(),
      updateStreak: vi.fn(),
      incrementStreak: vi.fn(),
      resetStreak: vi.fn(),
      checkAndUpdateStreakForMissedDay: vi.fn(),
      updateLastMissionCheckDate: vi.fn(),
      lastMissionCheckDate: null,
    });
    
    // Mock action item store
    vi.mocked(useActionItemStore).mockReturnValue({
      actionItems: [],
      isLoading: false,
      fetchActionItems: vi.fn(),
      approveItem: vi.fn(),
      rejectItem: vi.fn(),
    });
  });

  it('should render header with doctor name and notification badge', () => {
    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('RecoveryPilot')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Smith')).toBeInTheDocument();
  });

  it('should render triage dashboard title', () => {
    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    // "Triage Dashboard" appears in both tab button and h2 heading
    expect(screen.getAllByText('Triage Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Review and manage patient action items')).toBeInTheDocument();
  });

  it('should show empty state when no action items', () => {
    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('All caught up!')).toBeInTheDocument();
    expect(screen.getByText('No pending items to review.')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useActionItemStore).mockReturnValue({
      actionItems: [],
      isLoading: true,
      fetchActionItems: vi.fn(),
      approveItem: vi.fn(),
      rejectItem: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display action items in grid layout', () => {
    const mockActionItems = [
      {
        id: 'item-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: 'triage' as const,
        status: 'pending_doctor' as const,
        createdAt: new Date(),
        triageData: {
          imageUrl: 'data:image/png;base64,test',
          analysis: 'red' as const,
          analysisText: 'Redness detected',
          confidenceScore: 0.87,
        },
      },
    ];

    vi.mocked(useActionItemStore).mockReturnValue({
      actionItems: mockActionItems,
      isLoading: false,
      fetchActionItems: vi.fn(),
      approveItem: vi.fn(),
      rejectItem: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    // Patient name appears in table row, mobile card, and Recovery Progress
    expect(screen.getAllByText('Divya Patel').length).toBeGreaterThanOrEqual(1);
    // Type label is "Triage" in table/card views
    expect(screen.getAllByText('Triage').length).toBeGreaterThanOrEqual(1);
    // Analysis text shown in description column
    expect(screen.getAllByText('Redness detected').length).toBeGreaterThanOrEqual(1);
  });

  it('should display refill action items', () => {
    const mockActionItems = [
      {
        id: 'item-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: 'refill' as const,
        status: 'pending_doctor' as const,
        createdAt: new Date(),
        refillData: {
          medicationName: 'Amoxicillin',
          insuranceStatus: 'approved' as const,
          inventoryStatus: 'in_stock' as const,
        },
      },
    ];

    vi.mocked(useActionItemStore).mockReturnValue({
      actionItems: mockActionItems,
      isLoading: false,
      fetchActionItems: vi.fn(),
      approveItem: vi.fn(),
      rejectItem: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    // Patient name appears in table row, mobile card, and Recovery Progress
    expect(screen.getAllByText('Divya Patel').length).toBeGreaterThanOrEqual(1);
    // Type label is "Refill" in table/card views
    expect(screen.getAllByText('Refill').length).toBeGreaterThanOrEqual(1);
    // Medication name shown in description as "Refill: Amoxicillin"
    expect(screen.getAllByText(/Amoxicillin/).length).toBeGreaterThanOrEqual(1);
  });

  it('should show keyboard shortcuts hint', () => {
    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Keyboard shortcuts:/)).toBeInTheDocument();
    // Use getAllByText since "R" appears in both logo and keyboard shortcut
    const rElements = screen.getAllByText('R');
    expect(rElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/to refresh/)).toBeInTheDocument();
  });

  it('should fetch action items on mount', () => {
    const mockFetchActionItems = vi.fn();
    
    vi.mocked(useActionItemStore).mockReturnValue({
      actionItems: [],
      isLoading: false,
      fetchActionItems: mockFetchActionItems,
      approveItem: vi.fn(),
      rejectItem: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    expect(mockFetchActionItems).toHaveBeenCalledWith('doctor-1');
  });

  it('should display notification count in header', () => {
    const mockActionItems = [
      {
        id: 'item-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: 'triage' as const,
        status: 'pending_doctor' as const,
        createdAt: new Date(),
        triageData: {
          imageUrl: 'data:image/png;base64,test',
          analysis: 'red' as const,
          analysisText: 'Redness detected',
          confidenceScore: 0.87,
        },
      },
      {
        id: 'item-2',
        patientId: 'patient-2',
        patientName: 'John Doe',
        type: 'refill' as const,
        status: 'pending_doctor' as const,
        createdAt: new Date(),
        refillData: {
          medicationName: 'Ibuprofen',
          insuranceStatus: 'approved' as const,
          inventoryStatus: 'in_stock' as const,
        },
      },
    ];

    vi.mocked(useActionItemStore).mockReturnValue({
      actionItems: mockActionItems,
      isLoading: false,
      fetchActionItems: vi.fn(),
      approveItem: vi.fn(),
      rejectItem: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DoctorDashboard />
      </BrowserRouter>
    );

    // Check that notification badge shows count
    const badge = screen.getByLabelText('2 pending notifications');
    expect(badge).toBeInTheDocument();
  });
});
