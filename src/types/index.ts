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
 * Requirements: 1.3, 2.3
 */
export const UserRole = {
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
  
  // Actions
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  updateStreak: (newCount: number) => void;
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