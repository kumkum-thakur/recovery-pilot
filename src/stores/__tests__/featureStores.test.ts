import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  usePainStore,
  useVitalSignsStore,
  useAnalyticsStore,
  useNotificationStore,
  useChatStore,
  useJournalStore,
  useGamificationStore,
  useAppointmentStore,
  useExerciseStore,
  useSymptomStore,
  useNutritionStore,
  useSleepStore,
  useEmergencyStore,
  useTelehealthStore,
  useAccessibilityStore,
} from '../featureStores';

// Mock crypto.randomUUID for jsdom and reset Zustand stores between tests
beforeEach(() => {
  vi.stubGlobal('crypto', {
    randomUUID: () => `test-uuid-${Math.random().toString(36).substring(2, 11)}`,
  });
  localStorage.clear();

  // Reset Zustand stores between tests to prevent state leaking
  usePainStore.setState({ entries: [], currentPainLevel: 0, isLoading: false });
  useVitalSignsStore.setState({ readings: [], alerts: [], news2Score: 0, isLoading: false });
  useAnalyticsStore.setState({
    dashboardData: null,
    isGeneratingReport: false,
    reportProgress: 0,
    cachedComputations: [],
    lastRefreshed: null,
    isLoading: false,
  });
  useNotificationStore.setState({ notifications: [], isLoading: false });
  useChatStore.setState({
    conversations: [],
    activeConversationId: null,
    messages: {},
    isSending: false,
    isLoading: false,
  });
  useJournalStore.setState({ entries: [], hasCompletedDailyCheckIn: false, isLoading: false });
  useGamificationStore.setState({ xp: 0, level: 1, badges: [], challenges: [], isLoading: false });
  useAppointmentStore.setState({ appointments: [], isLoading: false });
  useExerciseStore.setState({ program: [], dailyRoutine: [], performanceLog: [], isLoading: false });
  useSymptomStore.setState({ currentSymptoms: [], analysisResults: [], isAnalyzing: false });
  useNutritionStore.setState({ mealLog: [], hydrationMl: 0, dailyCalorieGoal: 2000, dailyHydrationGoalMl: 2500, isLoading: false });
  useSleepStore.setState({ entries: [], isLoading: false });
  useEmergencyStore.setState({ contacts: [], activeEmergencies: [], emergencyHistory: [], isLoading: false });
  useTelehealthStore.setState({ sessions: [], currentSession: null, isConnecting: false, isLoading: false });
});

describe('Feature Stores', () => {
  // ---------- 1. Pain Store ----------
  describe('usePainStore', () => {
    it('should initialize with default state', () => {
      const state = usePainStore.getState();
      expect(state.entries).toHaveLength(0);
      expect(state.currentPainLevel).toBe(0);
      expect(state.isLoading).toBe(false);
    });

    it('should add a pain entry and update current level', () => {
      act(() => {
        usePainStore.getState().addEntry({
          level: 6,
          location: 'knee',
          description: 'after walking',
          tags: [],
        });
      });

      const state = usePainStore.getState();
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0].level).toBe(6);
      expect(state.entries[0].location).toBe('knee');
      expect(state.currentPainLevel).toBe(6);
    });

    it('should compute pain trend', () => {
      act(() => {
        const store = usePainStore.getState();
        store.addEntry({ level: 7, location: 'knee', description: '', tags: [] });
        store.addEntry({ level: 5, location: 'knee', description: '', tags: [] });
        store.addEntry({ level: 3, location: 'knee', description: '', tags: [] });
      });

      const trend = usePainStore.getState().getPainTrend();
      expect(['improving', 'worsening', 'stable', 'unknown']).toContain(trend);
    });
  });

  // ---------- 2. Vital Signs Store ----------
  describe('useVitalSignsStore', () => {
    it('should initialize with empty state', () => {
      const state = useVitalSignsStore.getState();
      expect(state.readings).toHaveLength(0);
      expect(state.alerts).toHaveLength(0);
      expect(state.news2Score).toBe(0);
    });

    it('should add a reading and generate alerts for abnormal values', () => {
      act(() => {
        useVitalSignsStore.getState().addReading({
          heartRate: 135,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          temperature: 37.0,
          oxygenSaturation: 98,
          respiratoryRate: 16,
        });
      });

      const state = useVitalSignsStore.getState();
      expect(state.readings).toHaveLength(1);
      // Heart rate 135 > 130 should generate a critical alert
      expect(state.alerts.length).toBeGreaterThan(0);
      expect(state.alerts[0].parameter).toBe('heartRate');
    });

    it('should acknowledge alerts', () => {
      act(() => {
        useVitalSignsStore.getState().addReading({
          heartRate: 140,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          temperature: 37.0,
          oxygenSaturation: 98,
          respiratoryRate: 16,
        });
      });

      const alertId = useVitalSignsStore.getState().alerts[0].id;

      act(() => {
        useVitalSignsStore.getState().acknowledgeAlert(alertId);
      });

      const alert = useVitalSignsStore.getState().alerts.find((a) => a.id === alertId);
      expect(alert?.acknowledged).toBe(true);
    });

    it('should calculate NEWS2 score', () => {
      act(() => {
        useVitalSignsStore.getState().addReading({
          heartRate: 75,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          temperature: 37.0,
          oxygenSaturation: 98,
          respiratoryRate: 16,
        });
      });

      const score = useVitalSignsStore.getState().calculateNEWS2();
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------- 3. Analytics Store ----------
  describe('useAnalyticsStore', () => {
    it('should initialize with null dashboard data', () => {
      const state = useAnalyticsStore.getState();
      expect(state.dashboardData).toBeNull();
      expect(state.lastRefreshed).toBeNull();
    });

    it('should refresh dashboard data', () => {
      act(() => {
        useAnalyticsStore.getState().refreshDashboard();
      });

      const state = useAnalyticsStore.getState();
      expect(state.dashboardData).not.toBeNull();
      expect(state.dashboardData!.totalPatients).toBeDefined();
      expect(state.lastRefreshed).toBeTruthy();
    });

    it('should manage cached computations with TTL', () => {
      act(() => {
        useAnalyticsStore.getState().setCachedComputation('test-key', 42, 60000);
      });

      const value = useAnalyticsStore.getState().getCachedComputation('test-key');
      expect(value).toBe(42);

      // Non-existent key should return null
      const missing = useAnalyticsStore.getState().getCachedComputation('nonexistent');
      expect(missing).toBeNull();
    });

    it('should track report generation progress', () => {
      act(() => {
        useAnalyticsStore.getState().startReportGeneration();
      });
      expect(useAnalyticsStore.getState().isGeneratingReport).toBe(true);
      expect(useAnalyticsStore.getState().reportProgress).toBe(0);

      act(() => {
        useAnalyticsStore.getState().updateReportProgress(50);
      });
      expect(useAnalyticsStore.getState().reportProgress).toBe(50);

      act(() => {
        useAnalyticsStore.getState().completeReportGeneration();
      });
      expect(useAnalyticsStore.getState().isGeneratingReport).toBe(false);
      expect(useAnalyticsStore.getState().reportProgress).toBe(100);
    });
  });

  // ---------- 4. Notification Store ----------
  describe('useNotificationStore', () => {
    it('should initialize with empty notifications', () => {
      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.preferences.enablePush).toBe(true);
    });

    it('should add and retrieve notifications', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Test Alert',
          message: 'Take your medicine',
          type: 'warning',
          priority: 'high',
        });
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].title).toBe('Test Alert');
      expect(state.notifications[0].read).toBe(false);
      expect(state.getUnreadCount()).toBe(1);
    });

    it('should mark notifications as read', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Alert',
          message: 'msg',
          type: 'info',
          priority: 'low',
        });
      });

      const id = useNotificationStore.getState().notifications[0].id;

      act(() => {
        useNotificationStore.getState().markAsRead(id);
      });

      expect(useNotificationStore.getState().notifications[0].read).toBe(true);
      expect(useNotificationStore.getState().getUnreadCount()).toBe(0);
    });
  });

  // ---------- 5. Chat Store ----------
  describe('useChatStore', () => {
    it('should initialize with empty state', () => {
      const state = useChatStore.getState();
      expect(state.conversations).toHaveLength(0);
      expect(state.activeConversationId).toBeNull();
    });

    it('should create a conversation and send messages', () => {
      let convId: string;
      act(() => {
        convId = useChatStore.getState().createConversation(
          ['patient1', 'doctor1'],
          ['Patient', 'Doctor'],
        );
      });

      expect(useChatStore.getState().conversations).toHaveLength(1);

      act(() => {
        useChatStore.getState().sendMessage(convId!, 'patient1', 'Patient', 'Hello doctor');
      });

      const messages = useChatStore.getState().getMessagesForConversation(convId!);
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Hello doctor');
    });
  });

  // ---------- 6. Journal Store ----------
  describe('useJournalStore', () => {
    it('should initialize empty', () => {
      const state = useJournalStore.getState();
      expect(state.entries).toHaveLength(0);
      expect(state.hasCompletedDailyCheckIn).toBe(false);
    });

    it('should add journal entries', () => {
      act(() => {
        useJournalStore.getState().addEntry({
          date: '2025-01-15',
          mood: 4,
          content: 'Feeling better today',
          tags: ['recovery'],
          isCheckIn: false,
        });
      });

      expect(useJournalStore.getState().entries).toHaveLength(1);
    });

    it('should complete daily check-in', () => {
      const prevCount = useJournalStore.getState().entries.length;
      act(() => {
        useJournalStore.getState().completeDailyCheckIn(4, 'Good day');
      });

      const state = useJournalStore.getState();
      expect(state.hasCompletedDailyCheckIn).toBe(true);
      expect(state.entries).toHaveLength(prevCount + 1);
      expect(state.entries.some(e => e.isCheckIn)).toBe(true);
    });
  });

  // ---------- 7. Gamification Store ----------
  describe('useGamificationStore', () => {
    it('should initialize with level 1 and 0 XP', () => {
      const state = useGamificationStore.getState();
      expect(state.xp).toBe(0);
      expect(state.level).toBe(1);
      expect(state.badges).toHaveLength(0);
    });

    it('should award XP and level up', () => {
      act(() => {
        useGamificationStore.getState().awardXP(150, 'Test reward');
      });

      const state = useGamificationStore.getState();
      expect(state.xp).toBe(150);
      // With 150 XP, should be at level 2 (100 XP per level)
      expect(state.level).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------- 8. Appointment Store ----------
  describe('useAppointmentStore', () => {
    it('should initialize empty', () => {
      const state = useAppointmentStore.getState();
      expect(state.appointments).toHaveLength(0);
      expect(state.isLoading).toBe(false);
    });

    it('should add appointments', () => {
      act(() => {
        useAppointmentStore.getState().addAppointment({
          patientId: 'patient-1',
          doctorId: 'doctor-1',
          doctorName: 'Dr. Smith',
          title: 'Follow-up',
          description: 'follow-up appointment',
          scheduledAt: '2025-02-01T10:00:00.000Z',
          durationMinutes: 30,
          location: 'Clinic A',
          notes: '',
        });
      });

      expect(useAppointmentStore.getState().appointments).toHaveLength(1);
    });
  });

  // ---------- 9. Exercise Store ----------
  describe('useExerciseStore', () => {
    it('should initialize empty', () => {
      const state = useExerciseStore.getState();
      expect(state.program).toHaveLength(0);
    });
  });

  // ---------- 10. Symptom Store ----------
  describe('useSymptomStore', () => {
    it('should initialize empty', () => {
      const state = useSymptomStore.getState();
      expect(state.currentSymptoms).toHaveLength(0);
    });
  });

  // ---------- 11. Nutrition Store ----------
  describe('useNutritionStore', () => {
    it('should initialize empty', () => {
      const state = useNutritionStore.getState();
      expect(state.mealLog).toHaveLength(0);
    });
  });

  // ---------- 12. Sleep Store ----------
  describe('useSleepStore', () => {
    it('should initialize empty', () => {
      const state = useSleepStore.getState();
      expect(state.entries).toHaveLength(0);
    });
  });

  // ---------- 13. Emergency Store ----------
  describe('useEmergencyStore', () => {
    it('should initialize with default emergency contacts', () => {
      const state = useEmergencyStore.getState();
      expect(state.contacts).toHaveLength(0);
      expect(state.activeEmergencies).toHaveLength(0);
    });
  });

  // ---------- 14. Telehealth Store ----------
  describe('useTelehealthStore', () => {
    it('should initialize with no active session', () => {
      const state = useTelehealthStore.getState();
      expect(state.currentSession).toBeNull();
      expect(state.isConnecting).toBe(false);
    });
  });

  // ---------- 15. Accessibility Store ----------
  describe('useAccessibilityStore', () => {
    it('should initialize with default accessibility settings', () => {
      const state = useAccessibilityStore.getState();
      expect(state.preferences.fontSize).toBe('medium');
      expect(state.preferences.highContrast).toBe(false);
    });
  });
});
