/**
 * FeatureStores - Zustand stores for expanded recovery pilot features
 *
 * This file contains lean state containers for the following domains:
 * - Pain tracking
 * - Vital signs monitoring
 * - Analytics dashboard
 * - Notifications
 * - In-app chat / messaging
 * - Recovery journal
 * - Gamification / XP
 * - Appointments
 * - Exercise programs
 * - Symptom tracking
 * - Nutrition logging
 * - Sleep tracking
 * - Emergency contacts
 * - Telehealth sessions
 * - Accessibility preferences
 *
 * Each store follows the project conventions established in userStore.ts,
 * missionStore.ts, configStore.ts, etc.:
 *  - Uses `create` from 'zustand'
 *  - TypeScript interfaces for state and actions
 *  - Section separators for State / Actions / Getters
 *  - Sensible defaults
 *  - localStorage persistence via the project's persistenceService where appropriate
 */

import { create } from 'zustand';

// ============================================================================
// Shared localStorage helpers
// ============================================================================

const STORAGE_KEYS = {
  PAIN_ENTRIES: 'recovery_pilot_pain_entries',
  VITAL_READINGS: 'recovery_pilot_vital_readings',
  NOTIFICATIONS: 'recovery_pilot_notifications',
  NOTIFICATION_PREFS: 'recovery_pilot_notification_prefs',
  JOURNAL_ENTRIES: 'recovery_pilot_journal_entries',
  GAMIFICATION: 'recovery_pilot_gamification',
  APPOINTMENTS: 'recovery_pilot_appointments',
  EXERCISE_LOG: 'recovery_pilot_exercise_log',
  MEAL_LOG: 'recovery_pilot_meal_log',
  SLEEP_ENTRIES: 'recovery_pilot_sleep_entries',
  EMERGENCY_CONTACTS: 'recovery_pilot_emergency_contacts',
  ACCESSIBILITY: 'recovery_pilot_accessibility',
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // Silently fall back to default
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[featureStores] Failed to persist ${key}:`, error);
  }
}

// ============================================================================
// 1. Pain Store
// ============================================================================

/**
 * A single pain entry recorded by the patient
 */
export interface PainEntry {
  id: string;
  timestamp: string; // ISO date string
  level: number; // 0-10
  location: string;
  description: string;
  tags: string[];
}

/**
 * Pain trend direction over recent entries
 */
export type PainTrend = 'improving' | 'worsening' | 'stable' | 'unknown';

export interface PainStoreState {
  // State
  entries: PainEntry[];
  currentPainLevel: number;
  isLoading: boolean;

  // Actions
  addEntry: (entry: Omit<PainEntry, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  setCurrentPainLevel: (level: number) => void;
  loadEntries: () => void;

  // Getters
  getEntriesByDateRange: (start: string, end: string) => PainEntry[];
  getPainTrend: () => PainTrend;
  getAveragePain: (days: number) => number;
}

/**
 * usePainStore - Manages pain tracking entries and current pain level
 *
 * Persists entries to localStorage.
 */
export const usePainStore = create<PainStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  entries: [],
  currentPainLevel: 0,
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  addEntry: (entry) => {
    const newEntry: PainEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...get().entries, newEntry];
    saveToStorage(STORAGE_KEYS.PAIN_ENTRIES, updated);

    set({
      entries: updated,
      currentPainLevel: newEntry.level,
    });
  },

  removeEntry: (id) => {
    const updated = get().entries.filter((e) => e.id !== id);
    saveToStorage(STORAGE_KEYS.PAIN_ENTRIES, updated);
    set({ entries: updated });
  },

  setCurrentPainLevel: (level) => {
    set({ currentPainLevel: Math.max(0, Math.min(10, level)) });
  },

  loadEntries: () => {
    set({ isLoading: true });
    const entries = loadFromStorage<PainEntry[]>(STORAGE_KEYS.PAIN_ENTRIES, []);
    set({ entries, isLoading: false });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getEntriesByDateRange: (start, end) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return get().entries.filter((entry) => {
      const t = new Date(entry.timestamp).getTime();
      return t >= s && t <= e;
    });
  },

  getPainTrend: () => {
    const { entries } = get();
    if (entries.length < 3) return 'unknown';

    const recent = entries.slice(-5);
    const first = recent[0].level;
    const last = recent[recent.length - 1].level;
    const diff = last - first;

    if (diff <= -1) return 'improving';
    if (diff >= 1) return 'worsening';
    return 'stable';
  },

  getAveragePain: (days) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = get().entries.filter(
      (e) => new Date(e.timestamp).getTime() >= cutoff,
    );
    if (recent.length === 0) return 0;
    return recent.reduce((sum, e) => sum + e.level, 0) / recent.length;
  },
}));

// ============================================================================
// 2. Vital Signs Store
// ============================================================================

/**
 * A single vital signs reading
 */
export interface VitalReading {
  id: string;
  timestamp: string;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: number; // Celsius
  oxygenSaturation: number; // percentage
  respiratoryRate: number;
}

/**
 * An alert generated when a vital reading is out of range
 */
export interface VitalAlert {
  id: string;
  readingId: string;
  parameter: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

export interface VitalSignsStoreState {
  // State
  readings: VitalReading[];
  alerts: VitalAlert[];
  news2Score: number;
  isLoading: boolean;

  // Actions
  addReading: (reading: Omit<VitalReading, 'id' | 'timestamp'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  loadReadings: () => void;
  clearAlerts: () => void;

  // Getters
  getLatestReading: () => VitalReading | null;
  getUnacknowledgedAlerts: () => VitalAlert[];
  calculateNEWS2: () => number;
}

/**
 * useVitalSignsStore - Manages vital sign readings and alerts
 *
 * Persists readings to localStorage.
 */
export const useVitalSignsStore = create<VitalSignsStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  readings: [],
  alerts: [],
  news2Score: 0,
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  addReading: (reading) => {
    const newReading: VitalReading = {
      ...reading,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...get().readings, newReading];
    saveToStorage(STORAGE_KEYS.VITAL_READINGS, updated);

    // Simple alert generation for out-of-range values
    const newAlerts: VitalAlert[] = [];
    if (reading.heartRate > 100 || reading.heartRate < 50) {
      newAlerts.push({
        id: crypto.randomUUID(),
        readingId: newReading.id,
        parameter: 'heartRate',
        value: reading.heartRate,
        threshold: reading.heartRate > 100 ? 100 : 50,
        severity: reading.heartRate > 130 || reading.heartRate < 40 ? 'critical' : 'medium',
        timestamp: newReading.timestamp,
        acknowledged: false,
      });
    }
    if (reading.oxygenSaturation < 94) {
      newAlerts.push({
        id: crypto.randomUUID(),
        readingId: newReading.id,
        parameter: 'oxygenSaturation',
        value: reading.oxygenSaturation,
        threshold: 94,
        severity: reading.oxygenSaturation < 90 ? 'critical' : 'high',
        timestamp: newReading.timestamp,
        acknowledged: false,
      });
    }
    if (reading.temperature > 38.5 || reading.temperature < 35.5) {
      newAlerts.push({
        id: crypto.randomUUID(),
        readingId: newReading.id,
        parameter: 'temperature',
        value: reading.temperature,
        threshold: reading.temperature > 38.5 ? 38.5 : 35.5,
        severity: reading.temperature > 39.5 || reading.temperature < 35.0 ? 'critical' : 'medium',
        timestamp: newReading.timestamp,
        acknowledged: false,
      });
    }

    const news2 = get().calculateNEWS2();

    set({
      readings: updated,
      alerts: [...get().alerts, ...newAlerts],
      news2Score: news2,
    });
  },

  acknowledgeAlert: (alertId) => {
    const updated = get().alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true } : a,
    );
    set({ alerts: updated });
  },

  loadReadings: () => {
    set({ isLoading: true });
    const readings = loadFromStorage<VitalReading[]>(STORAGE_KEYS.VITAL_READINGS, []);
    set({ readings, isLoading: false });
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getLatestReading: () => {
    const { readings } = get();
    return readings.length > 0 ? readings[readings.length - 1] : null;
  },

  getUnacknowledgedAlerts: () => {
    return get().alerts.filter((a) => !a.acknowledged);
  },

  calculateNEWS2: () => {
    const latest = get().getLatestReading();
    if (!latest) return 0;

    // Simplified NEWS2 scoring
    let score = 0;
    if (latest.respiratoryRate <= 8 || latest.respiratoryRate >= 25) score += 3;
    else if (latest.respiratoryRate >= 21) score += 2;
    else if (latest.respiratoryRate >= 12 && latest.respiratoryRate <= 20) score += 0;
    else score += 1;

    if (latest.oxygenSaturation <= 91) score += 3;
    else if (latest.oxygenSaturation <= 93) score += 2;
    else if (latest.oxygenSaturation <= 95) score += 1;

    if (latest.temperature <= 35.0) score += 3;
    else if (latest.temperature >= 39.1) score += 2;
    else if (latest.temperature >= 38.1 || latest.temperature <= 36.0) score += 1;

    if (latest.bloodPressureSystolic <= 90 || latest.bloodPressureSystolic >= 220) score += 3;
    else if (latest.bloodPressureSystolic <= 100) score += 2;
    else if (latest.bloodPressureSystolic <= 110) score += 1;

    if (latest.heartRate <= 40 || latest.heartRate >= 131) score += 3;
    else if (latest.heartRate >= 111) score += 2;
    else if (latest.heartRate <= 50 || latest.heartRate >= 91) score += 1;

    return score;
  },
}));

// ============================================================================
// 3. Analytics Store
// ============================================================================

/**
 * Dashboard summary data for analytics
 */
export interface DashboardData {
  totalPatients: number;
  activeMissions: number;
  completionRate: number;
  averagePainLevel: number;
  alertsCount: number;
  appointmentsToday: number;
}

/**
 * Cached computation entry
 */
export interface CachedComputation {
  key: string;
  value: unknown;
  computedAt: string;
  expiresAt: string;
}

export interface AnalyticsStoreState {
  // State
  dashboardData: DashboardData | null;
  isGeneratingReport: boolean;
  reportProgress: number;
  cachedComputations: CachedComputation[];
  lastRefreshed: string | null;
  isLoading: boolean;

  // Actions
  refreshDashboard: () => void;
  startReportGeneration: () => void;
  completeReportGeneration: () => void;
  updateReportProgress: (progress: number) => void;
  setCachedComputation: (key: string, value: unknown, ttlMs: number) => void;

  // Getters
  getCachedComputation: (key: string) => unknown | null;
  isDataStale: (maxAgeMs: number) => boolean;
}

/**
 * useAnalyticsStore - Manages dashboard data, report generation, and cached computations
 */
export const useAnalyticsStore = create<AnalyticsStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  dashboardData: null,
  isGeneratingReport: false,
  reportProgress: 0,
  cachedComputations: [],
  lastRefreshed: null,
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  refreshDashboard: () => {
    set({ isLoading: true });

    // Default dashboard data - services will populate real values
    const data: DashboardData = {
      totalPatients: 0,
      activeMissions: 0,
      completionRate: 0,
      averagePainLevel: 0,
      alertsCount: 0,
      appointmentsToday: 0,
    };

    set({
      dashboardData: data,
      lastRefreshed: new Date().toISOString(),
      isLoading: false,
    });
  },

  startReportGeneration: () => {
    set({ isGeneratingReport: true, reportProgress: 0 });
  },

  completeReportGeneration: () => {
    set({ isGeneratingReport: false, reportProgress: 100 });
  },

  updateReportProgress: (progress) => {
    set({ reportProgress: Math.max(0, Math.min(100, progress)) });
  },

  setCachedComputation: (key, value, ttlMs) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

    const existing = get().cachedComputations.filter((c) => c.key !== key);
    const entry: CachedComputation = {
      key,
      value,
      computedAt: now.toISOString(),
      expiresAt,
    };

    set({ cachedComputations: [...existing, entry] });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getCachedComputation: (key) => {
    const entry = get().cachedComputations.find((c) => c.key === key);
    if (!entry) return null;

    if (new Date(entry.expiresAt).getTime() < Date.now()) {
      // Expired, remove it
      const filtered = get().cachedComputations.filter((c) => c.key !== key);
      set({ cachedComputations: filtered });
      return null;
    }

    return entry.value;
  },

  isDataStale: (maxAgeMs) => {
    const { lastRefreshed } = get();
    if (!lastRefreshed) return true;
    return Date.now() - new Date(lastRefreshed).getTime() > maxAgeMs;
  },
}));

// ============================================================================
// 4. Notification Store
// ============================================================================

/**
 * Notification priority level
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * A single in-app notification
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: NotificationPriority;
  read: boolean;
  dismissed: boolean;
  snoozedUntil: string | null;
  createdAt: string;
  actionUrl?: string;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  enablePush: boolean;
  enableEmail: boolean;
  enableInApp: boolean;
  quietHoursStart: string | null; // HH:mm
  quietHoursEnd: string | null;   // HH:mm
  mutedTypes: string[];
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enablePush: true,
  enableEmail: false,
  enableInApp: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  mutedTypes: [],
};

export interface NotificationStoreState {
  // State
  notifications: Notification[];
  preferences: NotificationPreferences;
  isLoading: boolean;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'dismissed' | 'snoozedUntil'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string, durationMs: number) => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  loadNotifications: () => void;
  clearAll: () => void;

  // Getters
  getUnreadCount: () => number;
  getActiveNotifications: () => Notification[];
  getByPriority: (priority: NotificationPriority) => Notification[];
}

/**
 * useNotificationStore - Manages notifications, unread counts, and preferences
 *
 * Persists notifications and preferences to localStorage.
 */
export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  notifications: [],
  preferences: DEFAULT_NOTIFICATION_PREFS,
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
      dismissed: false,
      snoozedUntil: null,
    };

    const updated = [newNotification, ...get().notifications];
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    set({ notifications: updated });
  },

  markAsRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    set({ notifications: updated });
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    set({ notifications: updated });
  },

  dismissNotification: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, dismissed: true } : n,
    );
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    set({ notifications: updated });
  },

  snoozeNotification: (id, durationMs) => {
    const snoozedUntil = new Date(Date.now() + durationMs).toISOString();
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, snoozedUntil } : n,
    );
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    set({ notifications: updated });
  },

  updatePreferences: (prefs) => {
    const updated = { ...get().preferences, ...prefs };
    saveToStorage(STORAGE_KEYS.NOTIFICATION_PREFS, updated);
    set({ preferences: updated });
  },

  loadNotifications: () => {
    set({ isLoading: true });
    const notifications = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const preferences = loadFromStorage<NotificationPreferences>(
      STORAGE_KEYS.NOTIFICATION_PREFS,
      DEFAULT_NOTIFICATION_PREFS,
    );
    set({ notifications, preferences, isLoading: false });
  },

  clearAll: () => {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    set({ notifications: [] });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read && !n.dismissed).length;
  },

  getActiveNotifications: () => {
    const now = Date.now();
    return get().notifications.filter((n) => {
      if (n.dismissed) return false;
      if (n.snoozedUntil && new Date(n.snoozedUntil).getTime() > now) return false;
      return true;
    });
  },

  getByPriority: (priority) => {
    return get().notifications.filter((n) => n.priority === priority && !n.dismissed);
  },
}));

// ============================================================================
// 5. Chat Store
// ============================================================================

/**
 * A chat conversation between users
 */
export interface ChatConversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

/**
 * A single chat message
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'system';
}

export interface ChatStoreState {
  // State
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>; // keyed by conversationId
  isSending: boolean;
  isLoading: boolean;

  // Actions
  loadConversations: () => void;
  setActiveConversation: (conversationId: string | null) => void;
  sendMessage: (conversationId: string, senderId: string, senderName: string, content: string) => void;
  receiveMessage: (message: ChatMessage) => void;
  markConversationRead: (conversationId: string) => void;
  createConversation: (participantIds: string[], participantNames: string[]) => string;

  // Getters
  getTotalUnreadCount: () => number;
  getMessagesForConversation: (conversationId: string) => ChatMessage[];
}

/**
 * useChatStore - Manages chat conversations and messages
 */
export const useChatStore = create<ChatStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  conversations: [],
  activeConversationId: null,
  messages: {},
  isSending: false,
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  loadConversations: () => {
    set({ isLoading: true });
    // Conversations loaded from service layer; initialize empty
    set({ isLoading: false });
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    if (conversationId) {
      get().markConversationRead(conversationId);
    }
  },

  sendMessage: (conversationId, senderId, senderName, content) => {
    set({ isSending: true });

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'text',
    };

    const { messages, conversations } = get();
    const conversationMessages = messages[conversationId] || [];
    const updatedMessages = {
      ...messages,
      [conversationId]: [...conversationMessages, message],
    };

    const updatedConversations = conversations.map((c) =>
      c.id === conversationId
        ? { ...c, lastMessage: content, lastMessageAt: message.timestamp }
        : c,
    );

    set({
      messages: updatedMessages,
      conversations: updatedConversations,
      isSending: false,
    });
  },

  receiveMessage: (message) => {
    const { messages, conversations, activeConversationId } = get();
    const conversationMessages = messages[message.conversationId] || [];

    const isActive = activeConversationId === message.conversationId;
    const updatedMessage = isActive ? { ...message, read: true } : message;

    const updatedMessages = {
      ...messages,
      [message.conversationId]: [...conversationMessages, updatedMessage],
    };

    const updatedConversations = conversations.map((c) =>
      c.id === message.conversationId
        ? {
            ...c,
            lastMessage: message.content,
            lastMessageAt: message.timestamp,
            unreadCount: isActive ? c.unreadCount : c.unreadCount + 1,
          }
        : c,
    );

    set({
      messages: updatedMessages,
      conversations: updatedConversations,
    });
  },

  markConversationRead: (conversationId) => {
    const { messages, conversations } = get();
    const conversationMessages = (messages[conversationId] || []).map((m) => ({
      ...m,
      read: true,
    }));

    set({
      messages: { ...messages, [conversationId]: conversationMessages },
      conversations: conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    });
  },

  createConversation: (participantIds, participantNames) => {
    const id = crypto.randomUUID();
    const conversation: ChatConversation = {
      id,
      participantIds,
      participantNames,
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    set({
      conversations: [...get().conversations, conversation],
      messages: { ...get().messages, [id]: [] },
    });

    return id;
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getTotalUnreadCount: () => {
    return get().conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  },

  getMessagesForConversation: (conversationId) => {
    return get().messages[conversationId] || [];
  },
}));

// ============================================================================
// 6. Journal Store
// ============================================================================

/**
 * A recovery journal entry
 */
export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  mood: number; // 1-5
  content: string;
  tags: string[];
  isCheckIn: boolean;
  createdAt: string;
}

export interface JournalStoreState {
  // State
  entries: JournalEntry[];
  hasCompletedDailyCheckIn: boolean;
  isLoading: boolean;

  // Actions
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, updates: Partial<Pick<JournalEntry, 'mood' | 'content' | 'tags'>>) => void;
  removeEntry: (id: string) => void;
  completeDailyCheckIn: (mood: number, content: string) => void;
  resetDailyCheckIn: () => void;
  loadEntries: () => void;

  // Getters
  getEntriesByDate: (date: string) => JournalEntry[];
  getMoodTrend: (days: number) => number[];
  getRecentEntries: (count: number) => JournalEntry[];
}

/**
 * useJournalStore - Manages recovery journal entries and daily check-ins
 *
 * Persists entries to localStorage.
 */
export const useJournalStore = create<JournalStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  entries: [],
  hasCompletedDailyCheckIn: false,
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  addEntry: (entry) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...get().entries, newEntry];
    saveToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, updated);
    set({ entries: updated });
  },

  updateEntry: (id, updates) => {
    const updated = get().entries.map((e) =>
      e.id === id ? { ...e, ...updates } : e,
    );
    saveToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, updated);
    set({ entries: updated });
  },

  removeEntry: (id) => {
    const updated = get().entries.filter((e) => e.id !== id);
    saveToStorage(STORAGE_KEYS.JOURNAL_ENTRIES, updated);
    set({ entries: updated });
  },

  completeDailyCheckIn: (mood, content) => {
    const entry: Omit<JournalEntry, 'id' | 'createdAt'> = {
      date: new Date().toISOString().split('T')[0],
      mood: Math.max(1, Math.min(5, mood)),
      content,
      tags: ['daily-check-in'],
      isCheckIn: true,
    };

    get().addEntry(entry);
    set({ hasCompletedDailyCheckIn: true });
  },

  resetDailyCheckIn: () => {
    set({ hasCompletedDailyCheckIn: false });
  },

  loadEntries: () => {
    set({ isLoading: true });
    const entries = loadFromStorage<JournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, []);

    // Check if today's check-in is already done
    const today = new Date().toISOString().split('T')[0];
    const hasCheckIn = entries.some((e) => e.isCheckIn && e.date === today);

    set({ entries, hasCompletedDailyCheckIn: hasCheckIn, isLoading: false });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getEntriesByDate: (date) => {
    return get().entries.filter((e) => e.date === date);
  },

  getMoodTrend: (days) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return get()
      .entries.filter((e) => e.isCheckIn && new Date(e.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((e) => e.mood);
  },

  getRecentEntries: (count) => {
    return get()
      .entries.slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, count);
  },
}));

// ============================================================================
// 7. Gamification Store
// ============================================================================

/**
 * A badge that can be earned by the patient
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt: string | null;
  category: string;
}

/**
 * A challenge the patient can participate in
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  xpReward: number;
  deadline: string | null;
  completed: boolean;
}

/**
 * Persisted gamification progress data
 */
export interface GamificationData {
  xp: number;
  level: number;
  badges: Badge[];
  challenges: Challenge[];
}

const DEFAULT_GAMIFICATION: GamificationData = {
  xp: 0,
  level: 1,
  badges: [],
  challenges: [],
};

export interface GamificationStoreState {
  // State
  xp: number;
  level: number;
  badges: Badge[];
  challenges: Challenge[];
  isLoading: boolean;

  // Actions
  awardXP: (amount: number, reason: string) => void;
  unlockBadge: (badgeId: string) => void;
  addBadge: (badge: Omit<Badge, 'unlockedAt'>) => void;
  addChallenge: (challenge: Omit<Challenge, 'currentValue' | 'completed'>) => void;
  updateChallengeProgress: (challengeId: string, value: number) => void;
  loadProgress: () => void;

  // Getters
  getXPForNextLevel: () => number;
  getLevelProgress: () => number;
  getUnlockedBadges: () => Badge[];
  getActiveChallenges: () => Challenge[];
}

/**
 * useGamificationStore - Manages XP, levels, badges, and challenges
 *
 * Persists all gamification data to localStorage.
 */
export const useGamificationStore = create<GamificationStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  xp: 0,
  level: 1,
  badges: [],
  challenges: [],
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  awardXP: (amount, _reason) => {
    const { xp, level } = get();
    const newXP = xp + amount;

    // Level up formula: each level requires level * 100 XP
    let newLevel = level;
    let xpThreshold = newLevel * 100;
    while (newXP >= xpThreshold) {
      newLevel++;
      xpThreshold = newLevel * 100;
    }

    const data: GamificationData = {
      xp: newXP,
      level: newLevel,
      badges: get().badges,
      challenges: get().challenges,
    };
    saveToStorage(STORAGE_KEYS.GAMIFICATION, data);

    set({ xp: newXP, level: newLevel });
  },

  unlockBadge: (badgeId) => {
    const updated = get().badges.map((b) =>
      b.id === badgeId && !b.unlockedAt
        ? { ...b, unlockedAt: new Date().toISOString() }
        : b,
    );

    const data: GamificationData = {
      xp: get().xp,
      level: get().level,
      badges: updated,
      challenges: get().challenges,
    };
    saveToStorage(STORAGE_KEYS.GAMIFICATION, data);

    set({ badges: updated });
  },

  addBadge: (badge) => {
    const newBadge: Badge = { ...badge, unlockedAt: null };
    const updated = [...get().badges, newBadge];

    const data: GamificationData = {
      xp: get().xp,
      level: get().level,
      badges: updated,
      challenges: get().challenges,
    };
    saveToStorage(STORAGE_KEYS.GAMIFICATION, data);

    set({ badges: updated });
  },

  addChallenge: (challenge) => {
    const newChallenge: Challenge = {
      ...challenge,
      currentValue: 0,
      completed: false,
    };
    const updated = [...get().challenges, newChallenge];

    const data: GamificationData = {
      xp: get().xp,
      level: get().level,
      badges: get().badges,
      challenges: updated,
    };
    saveToStorage(STORAGE_KEYS.GAMIFICATION, data);

    set({ challenges: updated });
  },

  updateChallengeProgress: (challengeId, value) => {
    const updated = get().challenges.map((c) => {
      if (c.id !== challengeId) return c;
      const newValue = Math.min(value, c.targetValue);
      return {
        ...c,
        currentValue: newValue,
        completed: newValue >= c.targetValue,
      };
    });

    // Auto-award XP for newly completed challenges
    const challenge = get().challenges.find((c) => c.id === challengeId);
    const updatedChallenge = updated.find((c) => c.id === challengeId);
    if (challenge && !challenge.completed && updatedChallenge?.completed) {
      get().awardXP(updatedChallenge.xpReward, `Completed challenge: ${updatedChallenge.title}`);
    }

    const data: GamificationData = {
      xp: get().xp,
      level: get().level,
      badges: get().badges,
      challenges: updated,
    };
    saveToStorage(STORAGE_KEYS.GAMIFICATION, data);

    set({ challenges: updated });
  },

  loadProgress: () => {
    set({ isLoading: true });
    const data = loadFromStorage<GamificationData>(STORAGE_KEYS.GAMIFICATION, DEFAULT_GAMIFICATION);
    set({
      xp: data.xp,
      level: data.level,
      badges: data.badges,
      challenges: data.challenges,
      isLoading: false,
    });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getXPForNextLevel: () => {
    return get().level * 100;
  },

  getLevelProgress: () => {
    const { xp, level } = get();
    const currentLevelXP = (level - 1) * 100;
    const nextLevelXP = level * 100;
    return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  },

  getUnlockedBadges: () => {
    return get().badges.filter((b) => b.unlockedAt !== null);
  },

  getActiveChallenges: () => {
    return get().challenges.filter((c) => !c.completed);
  },
}));

// ============================================================================
// 8. Appointment Store
// ============================================================================

/**
 * Appointment status values
 */
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

/**
 * An appointment entry
 */
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  title: string;
  description: string;
  scheduledAt: string; // ISO date string
  durationMinutes: number;
  status: AppointmentStatus;
  location: string;
  notes: string;
  createdAt: string;
}

export interface AppointmentStoreState {
  // State
  appointments: Appointment[];
  isLoading: boolean;

  // Actions
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => void;
  rescheduleAppointment: (id: string, newDate: string) => void;
  cancelAppointment: (id: string) => void;
  updateStatus: (id: string, status: AppointmentStatus) => void;
  loadAppointments: () => void;

  // Getters
  getUpcoming: () => Appointment[];
  getByDate: (date: string) => Appointment[];
  getByPatient: (patientId: string) => Appointment[];
}

/**
 * useAppointmentStore - Manages appointments, scheduling, and rescheduling
 *
 * Persists appointments to localStorage.
 */
export const useAppointmentStore = create<AppointmentStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  appointments: [],
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  addAppointment: (appointment) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'scheduled',
    };

    const updated = [...get().appointments, newAppointment];
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, updated);
    set({ appointments: updated });
  },

  rescheduleAppointment: (id, newDate) => {
    const updated = get().appointments.map((a) =>
      a.id === id ? { ...a, scheduledAt: newDate, status: 'scheduled' as AppointmentStatus } : a,
    );
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, updated);
    set({ appointments: updated });
  },

  cancelAppointment: (id) => {
    const updated = get().appointments.map((a) =>
      a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a,
    );
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, updated);
    set({ appointments: updated });
  },

  updateStatus: (id, status) => {
    const updated = get().appointments.map((a) =>
      a.id === id ? { ...a, status } : a,
    );
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, updated);
    set({ appointments: updated });
  },

  loadAppointments: () => {
    set({ isLoading: true });
    const appointments = loadFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    set({ appointments, isLoading: false });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getUpcoming: () => {
    const now = new Date().toISOString();
    return get()
      .appointments.filter(
        (a) => a.scheduledAt > now && a.status !== 'cancelled' && a.status !== 'completed',
      )
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  },

  getByDate: (date) => {
    return get().appointments.filter((a) => a.scheduledAt.startsWith(date));
  },

  getByPatient: (patientId) => {
    return get().appointments.filter((a) => a.patientId === patientId);
  },
}));

// ============================================================================
// 9. Exercise Store
// ============================================================================

/**
 * An exercise defined in a program
 */
export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  sets: number;
  reps: number;
  durationSeconds: number;
  imageUrl?: string;
}

/**
 * A logged exercise performance entry
 */
export interface ExercisePerformance {
  id: string;
  exerciseId: string;
  completedAt: string;
  setsCompleted: number;
  repsCompleted: number;
  painDuring: number; // 0-10
  painAfter: number;  // 0-10
  notes: string;
}

export interface ExerciseStoreState {
  // State
  program: Exercise[];
  dailyRoutine: Exercise[];
  performanceLog: ExercisePerformance[];
  isLoading: boolean;

  // Actions
  setProgram: (exercises: Exercise[]) => void;
  setDailyRoutine: (exercises: Exercise[]) => void;
  completeExercise: (exerciseId: string, performance: Omit<ExercisePerformance, 'id' | 'exerciseId' | 'completedAt'>) => void;
  loadPerformanceLog: () => void;

  // Getters
  getCompletedToday: () => ExercisePerformance[];
  getDailyProgress: () => number;
  getPerformanceHistory: (exerciseId: string) => ExercisePerformance[];
}

/**
 * useExerciseStore - Manages exercise programs, daily routines, and performance logs
 *
 * Persists performance log to localStorage.
 */
export const useExerciseStore = create<ExerciseStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  program: [],
  dailyRoutine: [],
  performanceLog: [],
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  setProgram: (exercises) => {
    set({ program: exercises });
  },

  setDailyRoutine: (exercises) => {
    set({ dailyRoutine: exercises });
  },

  completeExercise: (exerciseId, performance) => {
    const entry: ExercisePerformance = {
      ...performance,
      id: crypto.randomUUID(),
      exerciseId,
      completedAt: new Date().toISOString(),
    };

    const updated = [...get().performanceLog, entry];
    saveToStorage(STORAGE_KEYS.EXERCISE_LOG, updated);
    set({ performanceLog: updated });
  },

  loadPerformanceLog: () => {
    set({ isLoading: true });
    const performanceLog = loadFromStorage<ExercisePerformance[]>(STORAGE_KEYS.EXERCISE_LOG, []);
    set({ performanceLog, isLoading: false });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getCompletedToday: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().performanceLog.filter((p) => p.completedAt.startsWith(today));
  },

  getDailyProgress: () => {
    const { dailyRoutine } = get();
    if (dailyRoutine.length === 0) return 0;

    const completedToday = get().getCompletedToday();
    const completedIds = new Set(completedToday.map((p) => p.exerciseId));
    const completedCount = dailyRoutine.filter((e) => completedIds.has(e.id)).length;

    return (completedCount / dailyRoutine.length) * 100;
  },

  getPerformanceHistory: (exerciseId) => {
    return get()
      .performanceLog.filter((p) => p.exerciseId === exerciseId)
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  },
}));

// ============================================================================
// 10. Symptom Store
// ============================================================================

/**
 * A reported symptom
 */
export interface Symptom {
  id: string;
  name: string;
  severity: number; // 1-10
  duration: string;
  bodyLocation: string;
  description: string;
  reportedAt: string;
}

/**
 * Result of symptom analysis
 */
export interface SymptomAnalysisResult {
  id: string;
  symptomIds: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
  shouldContactDoctor: boolean;
  analyzedAt: string;
}

export interface SymptomStoreState {
  // State
  currentSymptoms: Symptom[];
  analysisResults: SymptomAnalysisResult[];
  isAnalyzing: boolean;

  // Actions
  addSymptom: (symptom: Omit<Symptom, 'id' | 'reportedAt'>) => void;
  removeSymptom: (id: string) => void;
  clearCurrentSymptoms: () => void;
  setAnalysisResult: (result: SymptomAnalysisResult) => void;
  setIsAnalyzing: (value: boolean) => void;

  // Getters
  getSymptomsByLocation: (location: string) => Symptom[];
  getLatestAnalysis: () => SymptomAnalysisResult | null;
  getHighSeveritySymptoms: () => Symptom[];
}

/**
 * useSymptomStore - Manages current symptoms and analysis results
 */
export const useSymptomStore = create<SymptomStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  currentSymptoms: [],
  analysisResults: [],
  isAnalyzing: false,

  // ============================================================================
  // Actions
  // ============================================================================

  addSymptom: (symptom) => {
    const newSymptom: Symptom = {
      ...symptom,
      id: crypto.randomUUID(),
      reportedAt: new Date().toISOString(),
    };

    set({ currentSymptoms: [...get().currentSymptoms, newSymptom] });
  },

  removeSymptom: (id) => {
    set({ currentSymptoms: get().currentSymptoms.filter((s) => s.id !== id) });
  },

  clearCurrentSymptoms: () => {
    set({ currentSymptoms: [] });
  },

  setAnalysisResult: (result) => {
    set({ analysisResults: [...get().analysisResults, result] });
  },

  setIsAnalyzing: (value) => {
    set({ isAnalyzing: value });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getSymptomsByLocation: (location) => {
    return get().currentSymptoms.filter((s) => s.bodyLocation === location);
  },

  getLatestAnalysis: () => {
    const { analysisResults } = get();
    return analysisResults.length > 0 ? analysisResults[analysisResults.length - 1] : null;
  },

  getHighSeveritySymptoms: () => {
    return get().currentSymptoms.filter((s) => s.severity >= 7);
  },
}));

// ============================================================================
// 11. Nutrition Store
// ============================================================================

/**
 * A logged meal
 */
export interface MealEntry {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  timestamp: string;
  notes: string;
}

/**
 * Daily nutrition summary
 */
export interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  hydrationMl: number;
  mealsLogged: number;
}

export interface NutritionStoreState {
  // State
  mealLog: MealEntry[];
  hydrationMl: number;
  dailyCalorieGoal: number;
  dailyHydrationGoalMl: number;
  isLoading: boolean;

  // Actions
  logMeal: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => void;
  removeMeal: (id: string) => void;
  addHydration: (ml: number) => void;
  resetDailyHydration: () => void;
  setCalorieGoal: (calories: number) => void;
  setHydrationGoal: (ml: number) => void;
  loadMealLog: () => void;

  // Getters
  getDailyNutrition: (date: string) => DailyNutrition;
  getTodayCalories: () => number;
  getCalorieProgress: () => number;
  getHydrationProgress: () => number;
}

/**
 * useNutritionStore - Manages meal logging, hydration, and daily nutrition
 *
 * Persists meal log to localStorage.
 */
export const useNutritionStore = create<NutritionStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  mealLog: [],
  hydrationMl: 0,
  dailyCalorieGoal: 2000,
  dailyHydrationGoalMl: 2500,
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  logMeal: (meal) => {
    const newMeal: MealEntry = {
      ...meal,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...get().mealLog, newMeal];
    saveToStorage(STORAGE_KEYS.MEAL_LOG, updated);
    set({ mealLog: updated });
  },

  removeMeal: (id) => {
    const updated = get().mealLog.filter((m) => m.id !== id);
    saveToStorage(STORAGE_KEYS.MEAL_LOG, updated);
    set({ mealLog: updated });
  },

  addHydration: (ml) => {
    set({ hydrationMl: get().hydrationMl + ml });
  },

  resetDailyHydration: () => {
    set({ hydrationMl: 0 });
  },

  setCalorieGoal: (calories) => {
    set({ dailyCalorieGoal: Math.max(0, calories) });
  },

  setHydrationGoal: (ml) => {
    set({ dailyHydrationGoalMl: Math.max(0, ml) });
  },

  loadMealLog: () => {
    set({ isLoading: true });
    const mealLog = loadFromStorage<MealEntry[]>(STORAGE_KEYS.MEAL_LOG, []);
    set({ mealLog, isLoading: false });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getDailyNutrition: (date) => {
    const meals = get().mealLog.filter((m) => m.timestamp.startsWith(date));
    return {
      date,
      totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
      totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
      totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
      totalFat: meals.reduce((sum, m) => sum + m.fat, 0),
      hydrationMl: get().hydrationMl,
      mealsLogged: meals.length,
    };
  },

  getTodayCalories: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().getDailyNutrition(today).totalCalories;
  },

  getCalorieProgress: () => {
    const { dailyCalorieGoal } = get();
    if (dailyCalorieGoal === 0) return 0;
    return (get().getTodayCalories() / dailyCalorieGoal) * 100;
  },

  getHydrationProgress: () => {
    const { hydrationMl, dailyHydrationGoalMl } = get();
    if (dailyHydrationGoalMl === 0) return 0;
    return (hydrationMl / dailyHydrationGoalMl) * 100;
  },
}));

// ============================================================================
// 12. Sleep Store
// ============================================================================

/**
 * A sleep log entry
 */
export interface SleepEntry {
  id: string;
  date: string; // The night of (e.g. "2026-02-10" for the night of Feb 10)
  bedtime: string;  // ISO datetime
  wakeTime: string; // ISO datetime
  quality: number;  // 1-5
  interruptions: number;
  notes: string;
}

/**
 * Computed sleep metrics
 */
export interface SleepMetrics {
  averageDurationHours: number;
  averageQuality: number;
  averageBedtime: string;
  averageWakeTime: string;
  consistency: number; // 0-100 percentage
}

export interface SleepStoreState {
  // State
  entries: SleepEntry[];
  isLoading: boolean;

  // Actions
  logSleep: (entry: Omit<SleepEntry, 'id'>) => void;
  updateSleepEntry: (id: string, updates: Partial<Omit<SleepEntry, 'id'>>) => void;
  removeSleepEntry: (id: string) => void;
  loadEntries: () => void;

  // Getters
  getSleepDuration: (entry: SleepEntry) => number;
  getMetrics: (days: number) => SleepMetrics;
  getRecentEntries: (count: number) => SleepEntry[];
  getEntryByDate: (date: string) => SleepEntry | null;
}

/**
 * useSleepStore - Manages sleep entries, metrics, and pattern analysis
 *
 * Persists entries to localStorage.
 */
export const useSleepStore = create<SleepStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  entries: [],
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  logSleep: (entry) => {
    const newEntry: SleepEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };

    const updated = [...get().entries, newEntry];
    saveToStorage(STORAGE_KEYS.SLEEP_ENTRIES, updated);
    set({ entries: updated });
  },

  updateSleepEntry: (id, updates) => {
    const updated = get().entries.map((e) =>
      e.id === id ? { ...e, ...updates } : e,
    );
    saveToStorage(STORAGE_KEYS.SLEEP_ENTRIES, updated);
    set({ entries: updated });
  },

  removeSleepEntry: (id) => {
    const updated = get().entries.filter((e) => e.id !== id);
    saveToStorage(STORAGE_KEYS.SLEEP_ENTRIES, updated);
    set({ entries: updated });
  },

  loadEntries: () => {
    set({ isLoading: true });
    const entries = loadFromStorage<SleepEntry[]>(STORAGE_KEYS.SLEEP_ENTRIES, []);
    set({ entries, isLoading: false });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getSleepDuration: (entry) => {
    const bed = new Date(entry.bedtime).getTime();
    const wake = new Date(entry.wakeTime).getTime();
    return (wake - bed) / (1000 * 60 * 60); // hours
  },

  getMetrics: (days) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = get().entries.filter(
      (e) => new Date(e.bedtime).getTime() >= cutoff,
    );

    if (recent.length === 0) {
      return {
        averageDurationHours: 0,
        averageQuality: 0,
        averageBedtime: '',
        averageWakeTime: '',
        consistency: 0,
      };
    }

    const durations = recent.map((e) => get().getSleepDuration(e));
    const avgDuration = durations.reduce((s, d) => s + d, 0) / durations.length;
    const avgQuality = recent.reduce((s, e) => s + e.quality, 0) / recent.length;

    // Consistency: ratio of days with logged sleep
    const consistency = (recent.length / days) * 100;

    return {
      averageDurationHours: Math.round(avgDuration * 10) / 10,
      averageQuality: Math.round(avgQuality * 10) / 10,
      averageBedtime: recent.length > 0 ? recent[recent.length - 1].bedtime : '',
      averageWakeTime: recent.length > 0 ? recent[recent.length - 1].wakeTime : '',
      consistency: Math.min(100, Math.round(consistency)),
    };
  },

  getRecentEntries: (count) => {
    return get()
      .entries.slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, count);
  },

  getEntryByDate: (date) => {
    return get().entries.find((e) => e.date === date) ?? null;
  },
}));

// ============================================================================
// 13. Emergency Store
// ============================================================================

/**
 * An emergency contact
 */
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  notifyAutomatically: boolean;
}

/**
 * An active or historical emergency event
 */
export interface EmergencyEvent {
  id: string;
  type: 'fall' | 'cardiac' | 'breathing' | 'pain' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: string;
  resolvedAt: string | null;
  contactsNotified: string[];
  location: string;
}

export interface EmergencyStoreState {
  // State
  contacts: EmergencyContact[];
  activeEmergencies: EmergencyEvent[];
  emergencyHistory: EmergencyEvent[];
  isLoading: boolean;

  // Actions
  addContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  updateContact: (id: string, updates: Partial<Omit<EmergencyContact, 'id'>>) => void;
  removeContact: (id: string) => void;
  triggerEmergency: (event: Omit<EmergencyEvent, 'id' | 'triggeredAt' | 'resolvedAt' | 'contactsNotified'>) => string;
  resolveEmergency: (id: string) => void;
  loadContacts: () => void;

  // Getters
  getPrimaryContact: () => EmergencyContact | null;
  getActiveEmergencyCount: () => number;
}

/**
 * useEmergencyStore - Manages emergency contacts and emergency events
 *
 * Persists contacts to localStorage.
 */
export const useEmergencyStore = create<EmergencyStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  contacts: [],
  activeEmergencies: [],
  emergencyHistory: [],
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  addContact: (contact) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: crypto.randomUUID(),
    };

    // If this is primary, unset others
    let updated: EmergencyContact[];
    if (contact.isPrimary) {
      updated = get().contacts.map((c) => ({ ...c, isPrimary: false }));
      updated.push(newContact);
    } else {
      updated = [...get().contacts, newContact];
    }

    saveToStorage(STORAGE_KEYS.EMERGENCY_CONTACTS, updated);
    set({ contacts: updated });
  },

  updateContact: (id, updates) => {
    let updated = get().contacts.map((c) =>
      c.id === id ? { ...c, ...updates } : c,
    );

    // If setting as primary, unset others
    if (updates.isPrimary) {
      updated = updated.map((c) =>
        c.id !== id ? { ...c, isPrimary: false } : c,
      );
    }

    saveToStorage(STORAGE_KEYS.EMERGENCY_CONTACTS, updated);
    set({ contacts: updated });
  },

  removeContact: (id) => {
    const updated = get().contacts.filter((c) => c.id !== id);
    saveToStorage(STORAGE_KEYS.EMERGENCY_CONTACTS, updated);
    set({ contacts: updated });
  },

  triggerEmergency: (event) => {
    const id = crypto.randomUUID();
    const autoNotifyContacts = get()
      .contacts.filter((c) => c.notifyAutomatically)
      .map((c) => c.id);

    const emergencyEvent: EmergencyEvent = {
      ...event,
      id,
      triggeredAt: new Date().toISOString(),
      resolvedAt: null,
      contactsNotified: autoNotifyContacts,
    };

    set({
      activeEmergencies: [...get().activeEmergencies, emergencyEvent],
    });

    return id;
  },

  resolveEmergency: (id) => {
    const event = get().activeEmergencies.find((e) => e.id === id);
    if (!event) return;

    const resolved: EmergencyEvent = {
      ...event,
      resolvedAt: new Date().toISOString(),
    };

    set({
      activeEmergencies: get().activeEmergencies.filter((e) => e.id !== id),
      emergencyHistory: [...get().emergencyHistory, resolved],
    });
  },

  loadContacts: () => {
    set({ isLoading: true });
    const contacts = loadFromStorage<EmergencyContact[]>(STORAGE_KEYS.EMERGENCY_CONTACTS, []);
    set({ contacts, isLoading: false });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getPrimaryContact: () => {
    return get().contacts.find((c) => c.isPrimary) ?? null;
  },

  getActiveEmergencyCount: () => {
    return get().activeEmergencies.length;
  },
}));

// ============================================================================
// 14. Telehealth Store
// ============================================================================

/**
 * Status of a telehealth session
 */
export type TelehealthSessionStatus =
  | 'scheduled'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * A telehealth video session
 */
export interface TelehealthSession {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  status: TelehealthSessionStatus;
  notes: string;
  recordingUrl: string | null;
}

export interface TelehealthStoreState {
  // State
  sessions: TelehealthSession[];
  currentSession: TelehealthSession | null;
  isConnecting: boolean;
  isLoading: boolean;

  // Actions
  loadSessions: () => void;
  scheduleSession: (session: Omit<TelehealthSession, 'id' | 'startedAt' | 'endedAt' | 'status' | 'recordingUrl'>) => void;
  startSession: (sessionId: string) => void;
  endSession: (sessionId: string) => void;
  cancelSession: (sessionId: string) => void;
  addSessionNotes: (sessionId: string, notes: string) => void;

  // Getters
  getUpcomingSessions: () => TelehealthSession[];
  getSessionHistory: () => TelehealthSession[];
}

/**
 * useTelehealthStore - Manages telehealth video sessions and session state
 */
export const useTelehealthStore = create<TelehealthStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  sessions: [],
  currentSession: null,
  isConnecting: false,
  isLoading: false,

  // ============================================================================
  // Actions
  // ============================================================================

  loadSessions: () => {
    set({ isLoading: true });
    // Sessions loaded from service layer; initialize empty
    set({ isLoading: false });
  },

  scheduleSession: (session) => {
    const newSession: TelehealthSession = {
      ...session,
      id: crypto.randomUUID(),
      startedAt: null,
      endedAt: null,
      status: 'scheduled',
      recordingUrl: null,
    };

    set({ sessions: [...get().sessions, newSession] });
  },

  startSession: (sessionId) => {
    set({ isConnecting: true });

    const updated = get().sessions.map((s) =>
      s.id === sessionId
        ? { ...s, status: 'in_progress' as TelehealthSessionStatus, startedAt: new Date().toISOString() }
        : s,
    );

    const current = updated.find((s) => s.id === sessionId) ?? null;

    set({
      sessions: updated,
      currentSession: current,
      isConnecting: false,
    });
  },

  endSession: (sessionId) => {
    const updated = get().sessions.map((s) =>
      s.id === sessionId
        ? { ...s, status: 'completed' as TelehealthSessionStatus, endedAt: new Date().toISOString() }
        : s,
    );

    set({
      sessions: updated,
      currentSession: null,
    });
  },

  cancelSession: (sessionId) => {
    const updated = get().sessions.map((s) =>
      s.id === sessionId
        ? { ...s, status: 'cancelled' as TelehealthSessionStatus }
        : s,
    );

    set({ sessions: updated });

    // If cancelling the current session, clear it
    if (get().currentSession?.id === sessionId) {
      set({ currentSession: null });
    }
  },

  addSessionNotes: (sessionId, notes) => {
    const updated = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, notes } : s,
    );

    set({ sessions: updated });

    // Update current session if applicable
    if (get().currentSession?.id === sessionId) {
      set({ currentSession: { ...get().currentSession!, notes } });
    }
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getUpcomingSessions: () => {
    const now = new Date().toISOString();
    return get()
      .sessions.filter(
        (s) => s.scheduledAt > now && (s.status === 'scheduled' || s.status === 'waiting'),
      )
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  },

  getSessionHistory: () => {
    return get()
      .sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled')
      .sort((a, b) => (b.endedAt ?? b.scheduledAt).localeCompare(a.endedAt ?? a.scheduledAt));
  },
}));

// ============================================================================
// 15. Accessibility Store
// ============================================================================

/**
 * Color blind mode types
 */
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

/**
 * App theme options
 */
export type AppTheme = 'light' | 'dark' | 'system';

/**
 * Persisted accessibility preferences
 */
export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  theme: AppTheme;
  language: string;
  colorBlindMode: ColorBlindMode;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderOptimized: boolean;
}

const DEFAULT_ACCESSIBILITY: AccessibilityPreferences = {
  fontSize: 'medium',
  theme: 'system',
  language: 'en',
  colorBlindMode: 'none',
  reduceMotion: false,
  highContrast: false,
  screenReaderOptimized: false,
};

export interface AccessibilityStoreState {
  // State
  preferences: AccessibilityPreferences;

  // Actions
  setFontSize: (size: AccessibilityPreferences['fontSize']) => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: string) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setReduceMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setScreenReaderOptimized: (enabled: boolean) => void;
  updatePreferences: (prefs: Partial<AccessibilityPreferences>) => void;
  loadPreferences: () => void;
  resetPreferences: () => void;

  // Getters
  getEffectiveTheme: () => 'light' | 'dark';
  getFontSizeMultiplier: () => number;
}

/**
 * useAccessibilityStore - Manages accessibility preferences
 *
 * Persists all preferences to localStorage.
 */
export const useAccessibilityStore = create<AccessibilityStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  preferences: DEFAULT_ACCESSIBILITY,

  // ============================================================================
  // Actions
  // ============================================================================

  setFontSize: (size) => {
    const updated = { ...get().preferences, fontSize: size };
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, updated);
    set({ preferences: updated });
  },

  setTheme: (theme) => {
    const updated = { ...get().preferences, theme };
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, updated);
    set({ preferences: updated });
  },

  setLanguage: (language) => {
    const updated = { ...get().preferences, language };
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, updated);
    set({ preferences: updated });
  },

  setColorBlindMode: (mode) => {
    const updated = { ...get().preferences, colorBlindMode: mode };
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, updated);
    set({ preferences: updated });
  },

  setReduceMotion: (enabled) => {
    const updated = { ...get().preferences, reduceMotion: enabled };
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, updated);
    set({ preferences: updated });
  },

  setHighContrast: (enabled) => {
    const updated = { ...get().preferences, highContrast: enabled };
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, updated);
    set({ preferences: updated });
  },

  setScreenReaderOptimized: (enabled) => {
    const updated = { ...get().preferences, screenReaderOptimized: enabled };
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, updated);
    set({ preferences: updated });
  },

  updatePreferences: (prefs) => {
    const updated = { ...get().preferences, ...prefs };
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, updated);
    set({ preferences: updated });
  },

  loadPreferences: () => {
    const preferences = loadFromStorage<AccessibilityPreferences>(
      STORAGE_KEYS.ACCESSIBILITY,
      DEFAULT_ACCESSIBILITY,
    );
    set({ preferences });
  },

  resetPreferences: () => {
    saveToStorage(STORAGE_KEYS.ACCESSIBILITY, DEFAULT_ACCESSIBILITY);
    set({ preferences: DEFAULT_ACCESSIBILITY });
  },

  // ============================================================================
  // Getters
  // ============================================================================

  getEffectiveTheme: () => {
    const { theme } = get().preferences;
    if (theme === 'system') {
      // Check system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return theme;
  },

  getFontSizeMultiplier: () => {
    switch (get().preferences.fontSize) {
      case 'small':
        return 0.875;
      case 'medium':
        return 1.0;
      case 'large':
        return 1.25;
      case 'extra-large':
        return 1.5;
      default:
        return 1.0;
    }
  },
}));
