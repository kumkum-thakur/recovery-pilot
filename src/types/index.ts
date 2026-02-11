// ============================================================================
// Core Enums (using const objects for erasableSyntaxOnly compatibility)
// ============================================================================

/**
 * Mission types representing different recovery tasks
 * Requirements: 3.1, 4.1, 4.2, 4.3
 */
export const MissionType = {
  PHOTO_UPLOAD: 'photo_upload',
  MEDICATION_CHECK: 'medication_check',
  EXERCISE_LOG: 'exercise_log',
} as const;
export type MissionType = typeof MissionType[keyof typeof MissionType];

/**
 * Mission status values
 * Requirements: 3.3
 */
export const MissionStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
} as const;
export type MissionStatus = typeof MissionStatus[keyof typeof MissionStatus];

/**
 * Action item types for doctor review
 * Requirements: 8.1, 8.2
 */
export const ActionItemType = {
  TRIAGE: 'triage',
  REFILL: 'refill',
} as const;
export type ActionItemType = typeof ActionItemType[keyof typeof ActionItemType];

/**
 * Action item status workflow states
 * Requirements: 9.2, 9.3
 */
export const ActionItemStatus = {
  PENDING_AGENT: 'pending_agent',
  PENDING_DOCTOR: 'pending_doctor',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type ActionItemStatus = typeof ActionItemStatus[keyof typeof ActionItemStatus];

/**
 * Agent workflow step status
 * Requirements: 7.1, 7.2, 7.3
 */
export const AgentStepStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type AgentStepStatus = typeof AgentStepStatus[keyof typeof AgentStepStatus];

/**
 * User roles in the system
 * Requirements: 1.3, 2.3, Enhancement: Admin role
 */
export const UserRole = {
  ADMIN: 'admin',
  PATIENT: 'patient',
  DOCTOR: 'doctor',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * Triage analysis results
 * Requirements: 6.2
 */
export const TriageAnalysis = {
  GREEN: 'green', // Healing well
  RED: 'red',     // Risk detected
} as const;
export type TriageAnalysis = typeof TriageAnalysis[keyof typeof TriageAnalysis];

/**
 * Insurance verification status
 * Requirements: 7.2, 8.3
 */
export const InsuranceStatus = {
  APPROVED: 'approved',
  PENDING: 'pending',
  DENIED: 'denied',
} as const;
export type InsuranceStatus = typeof InsuranceStatus[keyof typeof InsuranceStatus];

/**
 * Pharmacy inventory status
 * Requirements: 7.2, 8.3
 */
export const InventoryStatus = {
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;
export type InventoryStatus = typeof InventoryStatus[keyof typeof InventoryStatus];

/**
 * Demo scenario configuration
 * Requirements: 15.1, 15.2
 */
export const DemoScenario = {
  SCENARIO_HAPPY_PATH: 'SCENARIO_HAPPY_PATH',
  SCENARIO_RISK_DETECTED: 'SCENARIO_RISK_DETECTED',
} as const;
export type DemoScenario = typeof DemoScenario[keyof typeof DemoScenario];

// ============================================================================
// Core Data Models
// ============================================================================

/**
 * User model representing both patients and doctors
 * Requirements: 1.3, 2.3
 */
export interface User {
  id: string;
  name: string;
  role: UserRole;
  streakCount?: number; // Only for patients
}

/**
 * User model for database persistence
 * Requirements: 1.3, 2.3, 12.1
 */
export interface UserModel {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  streakCount: number;
  lastLoginDate: string; // ISO date string
  createdAt: string;
}

/**
 * Mission model for patient recovery tasks
 * Requirements: 3.1, 3.2, 3.3
 */
export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  status: MissionStatus;
  dueDate: Date;
  actionButtonText: string;
}

// Explicit re-export for module resolution
export type { Mission as MissionInterface };

/**
 * Mission model for database persistence
 * Requirements: 3.1, 12.2
 */
export interface MissionModel {
  id: string;
  patientId: string;
  type: MissionType;
  title: string;
  description: string;
  status: MissionStatus;
  dueDate: string; // ISO date string
  completedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent workflow step
 * Requirements: 7.1, 7.2, 7.3
 */
export interface AgentStep {
  id: string;
  label: string;
  status: AgentStepStatus;
  duration?: number; // milliseconds
}

/**
 * Triage-specific data for action items
 * Requirements: 6.2, 6.3, 6.4, 6.5, 8.4
 */
export interface TriageData {
  imageUrl: string;
  analysis: TriageAnalysis;
  analysisText: string;
  confidenceScore: number;
}

/**
 * Refill-specific data for action items
 * Requirements: 7.2, 8.3
 */
export interface RefillData {
  medicationName: string;
  insuranceStatus: InsuranceStatus;
  inventoryStatus: InventoryStatus;
}

/**
 * Action item for doctor review
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export interface ActionItem {
  id: string;
  patientId: string;
  patientName: string;
  type: ActionItemType;
  status: ActionItemStatus;
  createdAt: Date;
  aiConfidenceScore?: number;
  
  // Type-specific data
  triageData?: TriageData;
  refillData?: RefillData;
}

/**
 * Action item model for database persistence
 * Requirements: 8.1, 12.2
 */
export interface ActionItemModel {
  id: string;
  patientId: string;
  patientName: string;
  type: ActionItemType;
  status: ActionItemStatus;
  createdAt: string;
  updatedAt: string;
  
  // Triage fields
  imageUrl?: string;
  triageAnalysis?: TriageAnalysis;
  triageText?: string;
  aiConfidenceScore?: number;
  
  // Refill fields
  medicationName?: string;
  insuranceStatus?: InsuranceStatus;
  inventoryStatus?: InventoryStatus;
  
  // Doctor response
  doctorId?: string;
  rejectionReason?: string;
}

/**
 * Configuration model for demo scenarios
 * Requirements: 15.1, 15.2
 */
export interface ConfigModel {
  demoScenario: DemoScenario;
  mockDelayMs: number;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Props for MissionCard component
 * Requirements: 3.2, 4.4
 */
export interface MissionCardProps {
  mission: Mission;
  onAction: (missionId: string) => void;
}

/**
 * Props for ActionItemCard component
 * Requirements: 8.2, 9.1
 */
export interface ActionItemCardProps {
  actionItem: ActionItem;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string, reason: string) => void;
}

/**
 * Props for AgentStatusToast component
 * Requirements: 7.3
 */
export interface AgentStatusToastProps {
  steps: AgentStep[];
  isVisible: boolean;
  onComplete: () => void;
}

// ============================================================================
// Zustand Store Interfaces
// ============================================================================

/**
 * User store interface for authentication and profile management
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 10.1, 10.2
 */
export interface UserStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  lastMissionCheckDate: string | null; // ISO date string for tracking daily mission completion
  
  // Actions
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  updateStreak: (newCount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  checkAndUpdateStreakForMissedDay: () => void;
  updateLastMissionCheckDate: (date: string) => void;
}

/**
 * Mission store interface for patient recovery tasks
 * Requirements: 3.1, 5.3, 10.1
 */
export interface MissionStore {
  missions: Mission[];
  isLoading: boolean;
  
  // Actions
  fetchMissions: (userId: string) => Promise<void>;
  completeMission: (missionId: string) => Promise<void>;
  uploadPhoto: (missionId: string, imageFile: File) => Promise<void>;
  areAllDailyMissionsCompleted: () => boolean;
}

/**
 * Agent store interface for AI workflow management
 * Requirements: 7.1, 7.2, 7.3
 */
export interface AgentStore {
  currentWorkflow: AgentStep[] | null;
  isProcessing: boolean;
  
  // Actions
  startTriageWorkflow: (imageFile: File) => Promise<void>;
  startRefillWorkflow: (medicationName: string) => Promise<void>;
  executeStepWithTimeout: (step: AgentStep, stepIndex: number) => Promise<void>;
  clearWorkflow: () => void;
}

/**
 * Action item store interface for doctor triage management
 * Requirements: 8.1, 9.1, 9.2, 9.3, 9.4
 */
export interface ActionItemStore {
  actionItems: ActionItem[];
  isLoading: boolean;
  
  // Actions
  fetchActionItems: (doctorId: string) => Promise<void>;
  approveItem: (itemId: string) => Promise<void>;
  rejectItem: (itemId: string, reason: string) => Promise<void>;
}

// ============================================================================
// Service Interfaces
// ============================================================================

/**
 * Authentication service interface
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */
export interface AuthService {
  login(username: string, password: string): Promise<User>;
  logout(): void;
  getCurrentUser(): User | null;
  validateCredentials(username: string, password: string): boolean;
}

/**
 * Triage result from AI analysis
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export interface TriageResult {
  analysis: TriageAnalysis;
  analysisText: string;
  confidenceScore: number;
  actionItemId?: string; // Created if red
}

/**
 * Refill request result
 * Requirements: 7.2
 */
export interface RefillResult {
  insuranceStatus: InsuranceStatus;
  inventoryStatus: InventoryStatus;
  actionItemId: string;
}

/**
 * Agent service interface for AI-driven workflows
 * Requirements: 6.1, 7.1, 7.2
 */
export interface AgentService {
  // Triage workflow
  analyzeWoundImage(imageFile: File, scenario: DemoScenario): Promise<TriageResult>;
  
  // Refill workflow
  processRefillRequest(medicationName: string, scenario: DemoScenario): Promise<RefillResult>;
  
  // Workflow step simulation
  simulateWorkflowSteps(steps: AgentStep[]): AsyncGenerator<AgentStep>;
}

/**
 * Persistence service interface for data storage
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export interface PersistenceService {
  // Generic CRUD operations
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  update<T>(key: string, updater: (current: T) => T): void;
  delete(key: string): void;
  
  // Specific domain operations
  getUser(userId: string): UserModel | null;
  saveUser(user: UserModel): void;
  getMissions(patientId: string): MissionModel[];
  saveMission(mission: MissionModel): void;
  getActionItems(doctorId?: string): ActionItemModel[];
  saveActionItem(item: ActionItemModel): void;
  
  // Care plan operations
  getCarePlan(carePlanId: string): CarePlan | null;
  getCarePlansForPatient(patientId: string): CarePlan[];
  getCarePlansForDoctor(doctorId: string): CarePlan[];
  saveCarePlan(carePlan: CarePlan): void;
  deleteCarePlan(carePlanId: string): void;
}

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * LocalStorage keys for data persistence
 * Requirements: 12.1
 */
export const STORAGE_KEYS = {
  USERS: 'recovery_pilot_users',
  MISSIONS: 'recovery_pilot_missions',
  ACTION_ITEMS: 'recovery_pilot_action_items',
  CONFIG: 'recovery_pilot_config',
} as const;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an action item is a triage item
 */
export function isTriageItem(item: ActionItem): item is ActionItem & { triageData: TriageData } {
  return item.type === ActionItemType.TRIAGE && item.triageData !== undefined;
}

/**
 * Type guard to check if an action item is a refill item
 */
export function isRefillItem(item: ActionItem): item is ActionItem & { refillData: RefillData } {
  return item.type === ActionItemType.REFILL && item.refillData !== undefined;
}

/**
 * Type guard to check if a user is a patient
 */
export function isPatient(user: User): user is User & { streakCount: number } {
  return user.role === UserRole.PATIENT;
}

/**
 * Type guard to check if a user is a doctor
 */
export function isDoctor(user: User): boolean {
  return user.role === UserRole.DOCTOR;
}


// ============================================================================
// Admin & Enhancement Types
// ============================================================================

/**
 * Patient-Doctor relationship model
 * Requirements: Enhancement - Admin dashboard, doctor patient management
 */
export interface PatientDoctorRelationship {
  id: string;
  patientId: string;
  doctorId: string;
  assignedAt: string; // ISO date string
  assignedBy: string; // Admin user ID
  active: boolean;
}

/**
 * Medication inventory model
 * Requirements: Enhancement - Medication tracking
 */
export interface MedicationInventory {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  tabletsRemaining: number;
  refillThreshold: number;
  lastTaken?: string; // ISO date string
  lastUpdated: string; // ISO date string
}

/**
 * Refill request model
 * Requirements: Enhancement - Auto-refill ordering
 */
export interface RefillRequest {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  requestedAt: string; // ISO date string
  completedAt?: string; // ISO date string
  status: RefillStatus;
  outcome?: RefillOutcome;
  agentWorkflowId?: string;
}

/**
 * Refill status enum
 */
export const RefillStatus = {
  PENDING: 'pending',
  INSURANCE_CHECK: 'insurance_check',
  PHARMACY_CHECK: 'pharmacy_check',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type RefillStatus = typeof RefillStatus[keyof typeof RefillStatus];

/**
 * Refill outcome
 */
export interface RefillOutcome {
  success: boolean;
  message: string;
  estimatedDelivery?: string; // ISO date string
}

/**
 * Test scenario enum for debug menu
 * Requirements: Enhancement - Testing scenarios
 */
export const TestScenario = {
  PRODUCTION: 'production',
  SCENARIO_HAPPY_PATH: 'happy_path',
  SCENARIO_RISK_DETECTED: 'risk_detected',
} as const;
export type TestScenario = typeof TestScenario[keyof typeof TestScenario];

/**
 * Storage keys for new features
 */
export const ENHANCEMENT_STORAGE_KEYS = {
  RELATIONSHIPS: 'recovery_pilot_relationships',
  MEDICATION_INVENTORY: 'recovery_pilot_medication_inventory',
  REFILL_REQUESTS: 'recovery_pilot_refill_requests',
  TEST_SCENARIO: 'recovery_pilot_test_scenario',
} as const;

// ============================================================================
// Care Plan Management Types
// ============================================================================

/**
 * Care plan status values
 * Requirements: 1.3, 14.1, 14.2
 */
export const CarePlanStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  COMPLETED: 'completed',
} as const;
export type CarePlanStatus = typeof CarePlanStatus[keyof typeof CarePlanStatus];

/**
 * Care plan mission status values
 * Requirements: 7.2, 6.5
 */
export const CarePlanMissionStatus = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
} as const;
export type CarePlanMissionStatus = typeof CarePlanMissionStatus[keyof typeof CarePlanMissionStatus];

/**
 * Medication prescription status values
 * Requirements: 3.1, 7.2
 */
export const MedicationStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type MedicationStatus = typeof MedicationStatus[keyof typeof MedicationStatus];

/**
 * Recurrence type for mission scheduling
 * Requirements: 2.4, 4.2
 */
export const RecurrenceType = {
  ONE_TIME: 'one-time',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  CUSTOM: 'custom',
} as const;
export type RecurrenceType = typeof RecurrenceType[keyof typeof RecurrenceType];

/**
 * Recurrence pattern for mission scheduling
 * Requirements: 2.4, 4.2, 4.3
 */
export interface RecurrencePattern {
  type: RecurrenceType;
  interval?: number; // For custom: repeat every N days
  daysOfWeek?: number[]; // For weekly: [0-6] where 0=Sunday
}

/**
 * Mission schedule configuration
 * Requirements: 4.1, 4.2, 4.3
 */
export interface MissionSchedule {
  startDate: Date;
  recurrence: RecurrencePattern;
  endDate?: Date;
  occurrences?: number; // Number of times to repeat (alternative to endDate)
  timeOfDay?: string; // Specific time (HH:MM format, optional)
}

/**
 * Mission schedule model for database persistence
 * Requirements: 4.1, 12.2
 */
export interface MissionScheduleModel {
  startDate: string; // ISO date string
  recurrence: RecurrencePattern;
  endDate?: string; // ISO date string
  occurrences?: number;
  timeOfDay?: string;
}

/**
 * Medication frequency configuration
 * Requirements: 3.2, 11.1, 11.2, 11.3
 */
export interface MedicationFrequency {
  timesPerDay: number; // 1, 2, 3, etc.
  times?: string[]; // Specific times (e.g., ["08:00", "20:00"])
}

/**
 * Medication prescription
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export interface MedicationPrescription {
  id: string;
  carePlanId: string;
  medicationName: string;
  dosage: string; // e.g., "500mg"
  frequency: MedicationFrequency;
  duration?: number; // Duration in days (optional, ongoing if not specified)
  refillThreshold: number; // Tablets remaining to trigger refill
  instructions?: string;
  startDate: Date;
  endDate?: Date; // Calculated from duration
  status: MedicationStatus;
  createdAt: Date;
}

/**
 * Medication prescription model for database persistence
 * Requirements: 3.1, 12.2
 */
export interface MedicationPrescriptionModel {
  id: string;
  carePlanId: string;
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  duration?: number;
  refillThreshold: number;
  instructions?: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  status: MedicationStatus;
  createdAt: string; // ISO date string
}

/**
 * Care plan mission template
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export interface CarePlanMission {
  id: string;
  carePlanId: string;
  type: MissionType;
  title: string;
  description: string;
  schedule: MissionSchedule;
  status: CarePlanMissionStatus;
  createdAt: Date;
  metadata?: Record<string, any>; // Additional mission-specific data
}

/**
 * Care plan mission model for database persistence
 * Requirements: 2.1, 12.2
 */
export interface CarePlanMissionModel {
  id: string;
  carePlanId: string;
  type: MissionType;
  title: string;
  description: string;
  schedule: MissionScheduleModel;
  status: CarePlanMissionStatus;
  createdAt: string; // ISO date string
  metadata?: Record<string, any>;
}

/**
 * Care plan
 * Requirements: 1.2, 1.3, 1.4
 */
export interface CarePlan {
  id: string;
  patientId: string;
  doctorId: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: CarePlanStatus;
  missions: CarePlanMission[];
  medications: MedicationPrescription[];
}

/**
 * Care plan model for database persistence
 * Requirements: 1.3, 10.1, 10.2, 10.3
 */
export interface CarePlanModel {
  id: string;
  patientId: string;
  doctorId: string;
  name: string;
  description: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  status: CarePlanStatus;
  missions: CarePlanMissionModel[];
  medications: MedicationPrescriptionModel[];
}

/**
 * Template mission schedule configuration
 * Requirements: 5.1, 5.4
 */
export interface TemplateMissionSchedule {
  startDayOffset: number; // Days after plan start (0 = same day)
  recurrence: RecurrencePattern;
  durationDays?: number; // How many days this mission runs
}

/**
 * Template mission
 * Requirements: 5.1, 5.2
 */
export interface TemplateMission {
  type: MissionType;
  title: string;
  description: string;
  schedule: TemplateMissionSchedule;
}

/**
 * Template medication
 * Requirements: 5.1, 5.2
 */
export interface TemplateMedication {
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  durationDays?: number;
  refillThreshold: number;
  instructions?: string;
}

/**
 * Care plan template
 * Requirements: 5.1, 5.2, 5.5
 */
export interface CarePlanTemplate {
  id: string;
  name: string;
  description: string;
  category: string; // e.g., "Post-Surgery"
  missions: TemplateMission[];
  medications: TemplateMedication[];
}

/**
 * Input for creating a new care plan
 * Requirements: 1.1, 1.2
 */
export interface CreateCarePlanInput {
  patientId: string;
  doctorId: string;
  name: string;
  description: string;
}

/**
 * Input for creating a new mission
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export interface CreateMissionInput {
  type: MissionType;
  title: string;
  description: string;
  schedule: MissionSchedule;
  metadata?: Record<string, any>;
}

/**
 * Input for creating a new medication prescription
 * Requirements: 3.1, 3.2, 3.3
 */
export interface CreateMedicationInput {
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  duration?: number;
  refillThreshold: number;
  instructions?: string;
  startDate: Date;
}

/**
 * Validation result
 * Requirements: 1.5, 2.5, 3.6, 4.5, 4.6
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Storage keys for care plan management
 * Requirements: 10.1, 10.3
 */
export const CARE_PLAN_STORAGE_KEYS = {
  CARE_PLANS: 'recovery_pilot_care_plans',
  CARE_PLAN_TEMPLATES: 'recovery_pilot_care_plan_templates',
} as const;
