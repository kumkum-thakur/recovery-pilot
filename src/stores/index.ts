/**
 * Stores index - Central export for all Zustand stores
 *
 * Exports:
 * - useUserStore: User authentication and profile management
 * - useMissionStore: Patient mission management
 * - useAgentStore: AI workflow management
 * - useActionItemStore: Doctor action item review management
 * - useConfigStore: Demo scenario configuration management
 * - useCarePlanStore: Care plan management
 * - Feature stores (featureStores.ts):
 *   - usePainStore: Pain tracking
 *   - useVitalSignsStore: Vital signs monitoring
 *   - useAnalyticsStore: Analytics dashboard
 *   - useNotificationStore: Notifications
 *   - useChatStore: In-app messaging
 *   - useJournalStore: Recovery journal
 *   - useGamificationStore: XP, levels, badges
 *   - useAppointmentStore: Appointments
 *   - useExerciseStore: Exercise programs
 *   - useSymptomStore: Symptom tracking
 *   - useNutritionStore: Nutrition logging
 *   - useSleepStore: Sleep tracking
 *   - useEmergencyStore: Emergency contacts
 *   - useTelehealthStore: Telehealth sessions
 *   - useAccessibilityStore: Accessibility preferences
 */

export { useUserStore } from './userStore';
export { useMissionStore } from './missionStore';
export { useAgentStore } from './agentStore';
export { useActionItemStore } from './actionItemStore';
export { useConfigStore } from './configStore';
export { useCarePlanStore } from './carePlanStore';

// Feature stores
export {
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
} from './featureStores';
