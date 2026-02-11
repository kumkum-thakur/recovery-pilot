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
  resetMissions: () => void;
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
  analyzeWoundImage(imageFile: File, scenario: DemoScenario, patientId?: string): Promise<TriageResult>;

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

// ============================================================================
// 1. Recovery Prediction ML Model Types
// ============================================================================

/**
 * Model type identifiers for different ML prediction models
 * used across the recovery prediction pipeline.
 */
export const PredictionModelType = {
  LINEAR_REGRESSION: 'linear_regression',
  RANDOM_FOREST: 'random_forest',
  GRADIENT_BOOSTING: 'gradient_boosting',
  NEURAL_NETWORK: 'neural_network',
  TIME_SERIES: 'time_series',
} as const;
export type PredictionModelType = typeof PredictionModelType[keyof typeof PredictionModelType];

/**
 * Status of a prediction model in its lifecycle.
 */
export const ModelStatus = {
  TRAINING: 'training',
  VALIDATING: 'validating',
  DEPLOYED: 'deployed',
  DEPRECATED: 'deprecated',
  FAILED: 'failed',
} as const;
export type ModelStatus = typeof ModelStatus[keyof typeof ModelStatus];

/**
 * A single feature used as input to the prediction model.
 */
export interface PredictionFeature {
  /** Machine-readable feature name (e.g., "wound_area_cm2") */
  name: string;
  /** Numeric value of the feature */
  value: number;
  /** Unit of measurement (e.g., "cm2", "days", "mg/dL") */
  unit: string;
  /** ISO timestamp when the feature was captured */
  capturedAt: string;
}

/**
 * Confidence interval for a prediction value.
 */
export interface PredictionConfidenceInterval {
  /** Lower bound of the confidence interval */
  lower: number;
  /** Upper bound of the confidence interval */
  upper: number;
  /** Confidence level as a decimal (e.g., 0.95 for 95%) */
  confidenceLevel: number;
}

/**
 * Result of a recovery prediction for a given patient.
 */
export interface RecoveryPrediction {
  id: string;
  patientId: string;
  carePlanId: string;
  /** The model type that generated this prediction */
  modelType: PredictionModelType;
  /** Model version string (semver) */
  modelVersion: string;
  /** Predicted number of days until full recovery */
  predictedRecoveryDays: number;
  /** Confidence interval for the recovery estimate */
  confidenceInterval: PredictionConfidenceInterval;
  /** Overall confidence score from 0.0 to 1.0 */
  confidenceScore: number;
  /** Features that were fed into the model */
  inputFeatures: PredictionFeature[];
  /** Top factors driving the prediction, ranked by importance */
  contributingFactors: PredictionContributingFactor[];
  /** ISO timestamp of when the prediction was generated */
  generatedAt: string;
  /** ISO timestamp of the prediction's next scheduled refresh */
  nextRefreshAt?: string;
}

/**
 * A contributing factor explaining part of the prediction.
 */
export interface PredictionContributingFactor {
  /** Human-readable factor name */
  factorName: string;
  /** Relative importance weight from 0.0 to 1.0 */
  importance: number;
  /** Direction of influence on recovery time */
  direction: 'positive' | 'negative' | 'neutral';
  /** Human-readable explanation of the factor's effect */
  description: string;
}

/**
 * Metadata about a trained ML model artifact.
 */
export interface PredictionModelMetadata {
  id: string;
  modelType: PredictionModelType;
  version: string;
  status: ModelStatus;
  /** Number of training samples used */
  trainingSampleCount: number;
  /** Model accuracy metrics */
  metrics: PredictionModelMetrics;
  /** ISO timestamp of when training began */
  trainedAt: string;
  /** ISO timestamp of when the model was deployed (if applicable) */
  deployedAt?: string;
  /** Hyperparameters used during training */
  hyperparameters: Record<string, number | string | boolean>;
}

/**
 * Accuracy and performance metrics for a prediction model.
 */
export interface PredictionModelMetrics {
  /** Mean Absolute Error in days */
  mae: number;
  /** Root Mean Squared Error in days */
  rmse: number;
  /** R-squared (coefficient of determination) */
  rSquared: number;
  /** Mean Absolute Percentage Error */
  mape: number;
  /** Area Under the ROC Curve (for classification sub-tasks) */
  aucRoc?: number;
}

// ============================================================================
// 2. Self-Learning / Adaptive System Types
// ============================================================================

/**
 * Types of feedback the adaptive system can receive
 * to improve its models and recommendations.
 */
export const FeedbackType = {
  PREDICTION_ACCURACY: 'prediction_accuracy',
  TREATMENT_OUTCOME: 'treatment_outcome',
  PATIENT_SATISFACTION: 'patient_satisfaction',
  CLINICIAN_OVERRIDE: 'clinician_override',
  AUTOMATED_METRIC: 'automated_metric',
} as const;
export type FeedbackType = typeof FeedbackType[keyof typeof FeedbackType];

/**
 * Trigger types for adaptive model retraining.
 */
export const AdaptiveTriggerType = {
  SCHEDULED: 'scheduled',
  DRIFT_DETECTED: 'drift_detected',
  PERFORMANCE_DEGRADATION: 'performance_degradation',
  MANUAL: 'manual',
  NEW_DATA_THRESHOLD: 'new_data_threshold',
} as const;
export type AdaptiveTriggerType = typeof AdaptiveTriggerType[keyof typeof AdaptiveTriggerType];

/**
 * A single feedback entry from a clinician, patient, or automated process.
 */
export interface AdaptiveFeedbackEntry {
  id: string;
  /** The type of feedback provided */
  feedbackType: FeedbackType;
  /** Reference to the entity being evaluated (prediction, recommendation, etc.) */
  referenceId: string;
  /** Type of the referenced entity */
  referenceType: 'prediction' | 'recommendation' | 'exercise_plan' | 'medication';
  /** ID of the user who provided the feedback (null for automated) */
  providedBy: string | null;
  /** Numeric rating from 1 to 5 (when applicable) */
  rating?: number;
  /** Free-text comment */
  comment?: string;
  /** Structured correction data (e.g., "actual recovery was 14 days, not 10") */
  correctionData?: Record<string, unknown>;
  /** ISO timestamp of when the feedback was submitted */
  createdAt: string;
}

/**
 * Tracks data drift metrics for a deployed model, used to decide
 * whether retraining is necessary.
 */
export interface ModelDriftReport {
  id: string;
  modelId: string;
  /** Population Stability Index — measures distribution shift */
  populationStabilityIndex: number;
  /** Per-feature drift scores */
  featureDriftScores: Record<string, number>;
  /** Whether drift exceeds the configured threshold */
  driftDetected: boolean;
  /** Threshold value that triggered (or would trigger) retraining */
  threshold: number;
  /** ISO timestamp of the analysis window start */
  windowStart: string;
  /** ISO timestamp of the analysis window end */
  windowEnd: string;
  /** ISO timestamp of when this report was generated */
  generatedAt: string;
}

/**
 * A single retraining cycle event tracked by the adaptive system.
 */
export interface AdaptiveRetrainingEvent {
  id: string;
  modelId: string;
  trigger: AdaptiveTriggerType;
  /** Model version before retraining */
  previousVersion: string;
  /** Model version after retraining */
  newVersion: string;
  /** Metrics comparison: before vs after */
  metricsBefore: PredictionModelMetrics;
  metricsAfter: PredictionModelMetrics;
  /** Number of new samples incorporated */
  newSamplesCount: number;
  /** ISO timestamp of when retraining started */
  startedAt: string;
  /** ISO timestamp of when retraining completed */
  completedAt?: string;
  /** Whether the retrained model passed validation and was promoted */
  promoted: boolean;
}

/**
 * Configuration for the adaptive learning system.
 */
export interface AdaptiveSystemConfig {
  /** Minimum number of new feedback entries before triggering retraining */
  retrainingDataThreshold: number;
  /** Maximum number of days between scheduled retraining runs */
  retrainingIntervalDays: number;
  /** PSI threshold above which drift-based retraining is triggered */
  driftThreshold: number;
  /** Minimum improvement in MAE required to promote a retrained model */
  minimumImprovementThreshold: number;
  /** Whether automatic retraining is enabled */
  autoRetrainingEnabled: boolean;
}

// ============================================================================
// 3. Symptom Checker Types
// ============================================================================

/**
 * Severity levels for patient-reported symptoms.
 */
export const SymptomSeverity = {
  NONE: 'none',
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
  CRITICAL: 'critical',
} as const;
export type SymptomSeverity = typeof SymptomSeverity[keyof typeof SymptomSeverity];

/**
 * Symptom body region for anatomical mapping.
 */
export const SymptomBodyRegion = {
  HEAD: 'head',
  NECK: 'neck',
  CHEST: 'chest',
  ABDOMEN: 'abdomen',
  UPPER_BACK: 'upper_back',
  LOWER_BACK: 'lower_back',
  LEFT_ARM: 'left_arm',
  RIGHT_ARM: 'right_arm',
  LEFT_LEG: 'left_leg',
  RIGHT_LEG: 'right_leg',
  LEFT_HAND: 'left_hand',
  RIGHT_HAND: 'right_hand',
  LEFT_FOOT: 'left_foot',
  RIGHT_FOOT: 'right_foot',
  GENERAL: 'general',
} as const;
export type SymptomBodyRegion = typeof SymptomBodyRegion[keyof typeof SymptomBodyRegion];

/**
 * A single symptom entry reported by a patient.
 */
export interface SymptomEntry {
  id: string;
  patientId: string;
  /** Standardized symptom code (e.g., SNOMED-CT code) */
  symptomCode: string;
  /** Human-readable symptom name */
  symptomName: string;
  /** Patient-reported severity */
  severity: SymptomSeverity;
  /** Body region where the symptom is experienced */
  bodyRegion: SymptomBodyRegion;
  /** Onset date/time in ISO format */
  onsetAt: string;
  /** Duration of the symptom in minutes (if known) */
  durationMinutes?: number;
  /** Whether the symptom is recurring */
  isRecurring: boolean;
  /** Free-text notes from the patient */
  notes?: string;
  /** ISO timestamp of when this entry was recorded */
  reportedAt: string;
}

/**
 * Result of symptom assessment performed by the checker algorithm.
 */
export interface SymptomAssessmentResult {
  id: string;
  patientId: string;
  /** Symptom entries that were evaluated */
  symptomIds: string[];
  /** Possible conditions with associated probabilities */
  possibleConditions: SymptomConditionMatch[];
  /** Recommended urgency level */
  urgencyLevel: 'routine' | 'soon' | 'urgent' | 'emergency';
  /** Recommended next steps (e.g., "Schedule appointment", "Go to ER") */
  recommendedActions: string[];
  /** Triage-relevant red flag symptoms detected */
  redFlags: string[];
  /** Disclaimer text for patient-facing display */
  disclaimerText: string;
  /** ISO timestamp of the assessment */
  assessedAt: string;
}

/**
 * A possible condition matched by the symptom checker.
 */
export interface SymptomConditionMatch {
  /** ICD-10 code or internal condition identifier */
  conditionCode: string;
  /** Human-readable condition name */
  conditionName: string;
  /** Probability from 0.0 to 1.0 */
  probability: number;
  /** Severity if this condition is confirmed */
  severity: 'low' | 'moderate' | 'high' | 'critical';
  /** Brief description of the condition */
  description: string;
}

/**
 * A question presented to the patient during the symptom checking flow.
 */
export interface SymptomCheckerQuestion {
  id: string;
  /** Question text displayed to the patient */
  questionText: string;
  /** Type of answer expected */
  answerType: 'yes_no' | 'scale' | 'multiple_choice' | 'free_text';
  /** Options for multiple choice questions */
  options?: string[];
  /** Min/max for scale-type questions */
  scaleMin?: number;
  scaleMax?: number;
  /** Whether this question is required */
  required: boolean;
}

/**
 * Patient's answer to a symptom checker question.
 */
export interface SymptomCheckerAnswer {
  questionId: string;
  /** The patient's response value */
  answerValue: string | number | boolean;
  /** ISO timestamp of when the answer was provided */
  answeredAt: string;
}

// ============================================================================
// 4. Risk Scoring Engine Types
// ============================================================================

/**
 * Risk categories used across the scoring engine.
 */
export const RiskCategory = {
  INFECTION: 'infection',
  READMISSION: 'readmission',
  COMPLICATION: 'complication',
  NON_ADHERENCE: 'non_adherence',
  FALL: 'fall',
  CHRONIC_DETERIORATION: 'chronic_deterioration',
  MENTAL_HEALTH: 'mental_health',
} as const;
export type RiskCategory = typeof RiskCategory[keyof typeof RiskCategory];

/**
 * Overall risk level classification.
 */
export const RiskLevel = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type RiskLevel = typeof RiskLevel[keyof typeof RiskLevel];

/**
 * A computed risk score for a single category.
 */
export interface RiskScore {
  id: string;
  patientId: string;
  carePlanId?: string;
  /** The risk category being scored */
  category: RiskCategory;
  /** Numeric score from 0 to 100 */
  score: number;
  /** Classified risk level */
  level: RiskLevel;
  /** Factors that contributed to this score */
  contributingFactors: RiskContributingFactor[];
  /** Recommended mitigation actions */
  mitigations: string[];
  /** ISO timestamp of when the score was computed */
  computedAt: string;
  /** ISO timestamp of when the score expires and needs refresh */
  expiresAt: string;
}

/**
 * A factor contributing to a risk score, with its individual weight.
 */
export interface RiskContributingFactor {
  /** Human-readable factor name */
  factorName: string;
  /** Individual contribution to the score (0 to 100) */
  contribution: number;
  /** Source of the data (e.g., "vital_signs", "symptom_report", "lab_result") */
  dataSource: string;
  /** Description of why this factor matters */
  description: string;
}

/**
 * Composite risk profile summarizing all risk categories for a patient.
 */
export interface PatientRiskProfile {
  patientId: string;
  /** Individual scores per risk category */
  scores: RiskScore[];
  /** Overall composite risk level across all categories */
  overallRiskLevel: RiskLevel;
  /** Weighted composite score from 0 to 100 */
  compositeScore: number;
  /** ISO timestamp of when the profile was last computed */
  lastUpdatedAt: string;
  /** ISO timestamp of the next scheduled re-evaluation */
  nextEvaluationAt: string;
}

/**
 * Configuration for the risk scoring engine's thresholds and weights.
 */
export interface RiskScoringConfig {
  /** Threshold boundaries for risk levels: [low_max, moderate_max, high_max] */
  thresholds: {
    low: number;
    moderate: number;
    high: number;
    // Anything above high is critical
  };
  /** Per-category weight for composite scoring (must sum to 1.0) */
  categoryWeights: Record<RiskCategory, number>;
  /** How often to recompute scores (in hours) */
  refreshIntervalHours: number;
}

// ============================================================================
// 5. NLP Sentiment Analysis Types
// ============================================================================

/**
 * Sentiment classification labels.
 */
export const SentimentLabel = {
  VERY_NEGATIVE: 'very_negative',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  POSITIVE: 'positive',
  VERY_POSITIVE: 'very_positive',
} as const;
export type SentimentLabel = typeof SentimentLabel[keyof typeof SentimentLabel];

/**
 * Emotion categories detected in patient text.
 */
export const EmotionCategory = {
  JOY: 'joy',
  SADNESS: 'sadness',
  ANGER: 'anger',
  FEAR: 'fear',
  SURPRISE: 'surprise',
  DISGUST: 'disgust',
  TRUST: 'trust',
  ANTICIPATION: 'anticipation',
} as const;
export type EmotionCategory = typeof EmotionCategory[keyof typeof EmotionCategory];

/**
 * Result of sentiment analysis on a piece of patient-generated text.
 */
export interface SentimentAnalysisResult {
  id: string;
  /** ID of the source document (message, note, survey response, etc.) */
  sourceId: string;
  /** Type of the source document */
  sourceType: 'chat_message' | 'symptom_note' | 'survey_response' | 'journal_entry';
  /** The original text that was analyzed */
  originalText: string;
  /** Overall sentiment classification */
  sentiment: SentimentLabel;
  /** Sentiment polarity score from -1.0 (very negative) to 1.0 (very positive) */
  polarityScore: number;
  /** Subjectivity score from 0.0 (objective) to 1.0 (subjective) */
  subjectivityScore: number;
  /** Detected emotions with confidence scores */
  emotions: EmotionScore[];
  /** Key phrases extracted from the text */
  keyPhrases: string[];
  /** Whether clinical concern language was detected (e.g., self-harm, hopelessness) */
  clinicalConcernDetected: boolean;
  /** Specific clinical concerns identified, if any */
  clinicalConcerns?: string[];
  /** ISO timestamp of analysis */
  analyzedAt: string;
}

/**
 * An emotion detected with its associated confidence.
 */
export interface EmotionScore {
  emotion: EmotionCategory;
  /** Confidence score from 0.0 to 1.0 */
  score: number;
}

/**
 * Aggregated sentiment trend over a time window for a patient.
 */
export interface SentimentTrend {
  patientId: string;
  /** Start of the aggregation window (ISO timestamp) */
  periodStart: string;
  /** End of the aggregation window (ISO timestamp) */
  periodEnd: string;
  /** Average polarity over the window */
  averagePolarity: number;
  /** Standard deviation of polarity (measures volatility) */
  polarityStdDev: number;
  /** Dominant sentiment label during the window */
  dominantSentiment: SentimentLabel;
  /** Number of text entries analyzed in this window */
  sampleCount: number;
  /** Trend direction compared to the previous window */
  trendDirection: 'improving' | 'stable' | 'declining';
  /** Individual data points for charting */
  dataPoints: SentimentDataPoint[];
}

/**
 * A single data point in a sentiment trend.
 */
export interface SentimentDataPoint {
  /** ISO timestamp */
  timestamp: string;
  /** Polarity value at this point */
  polarity: number;
  /** Source type of the analyzed text */
  sourceType: string;
}

// ============================================================================
// 6. Anomaly Detection Types
// ============================================================================

/**
 * Types of anomalies the detection system can identify.
 */
export const AnomalyType = {
  VITAL_SIGN_SPIKE: 'vital_sign_spike',
  VITAL_SIGN_DROP: 'vital_sign_drop',
  BEHAVIORAL_CHANGE: 'behavioral_change',
  MEDICATION_PATTERN: 'medication_pattern',
  RECOVERY_DEVIATION: 'recovery_deviation',
  SYMPTOM_ESCALATION: 'symptom_escalation',
  DATA_QUALITY: 'data_quality',
} as const;
export type AnomalyType = typeof AnomalyType[keyof typeof AnomalyType];

/**
 * Severity of a detected anomaly.
 */
export const AnomalySeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ALERT: 'alert',
  CRITICAL: 'critical',
} as const;
export type AnomalySeverity = typeof AnomalySeverity[keyof typeof AnomalySeverity];

/**
 * Status of an anomaly alert in its lifecycle.
 */
export const AnomalyAlertStatus = {
  NEW: 'new',
  ACKNOWLEDGED: 'acknowledged',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive',
} as const;
export type AnomalyAlertStatus = typeof AnomalyAlertStatus[keyof typeof AnomalyAlertStatus];

/**
 * A detected anomaly event.
 */
export interface AnomalyDetectionResult {
  id: string;
  patientId: string;
  /** Type of anomaly detected */
  anomalyType: AnomalyType;
  /** Severity classification */
  severity: AnomalySeverity;
  /** Current alert status */
  alertStatus: AnomalyAlertStatus;
  /** Anomaly score; higher values indicate stronger anomaly signals */
  anomalyScore: number;
  /** Expected value or range for the metric */
  expectedValue: string;
  /** Actual observed value */
  observedValue: string;
  /** Number of standard deviations from the expected value */
  deviationSigma: number;
  /** The metric or data source where the anomaly was detected */
  metricName: string;
  /** Human-readable description of the anomaly */
  description: string;
  /** Recommended clinical actions */
  recommendedActions: string[];
  /** ISO timestamp of when the anomaly was first detected */
  detectedAt: string;
  /** ISO timestamp of when the anomaly was resolved (if applicable) */
  resolvedAt?: string;
  /** ID of the clinician who acknowledged/resolved */
  resolvedBy?: string;
}

/**
 * Configuration for anomaly detection per metric.
 */
export interface AnomalyDetectionConfig {
  /** Name of the metric being monitored */
  metricName: string;
  /** Number of standard deviations for threshold-based detection */
  sigmaThreshold: number;
  /** Minimum number of data points required before anomaly detection activates */
  minimumDataPoints: number;
  /** Lookback window in hours for computing baselines */
  lookbackWindowHours: number;
  /** Whether this metric is actively monitored */
  enabled: boolean;
  /** Severity to assign when an anomaly is detected */
  defaultSeverity: AnomalySeverity;
}

// ============================================================================
// 7. Treatment Recommendation Engine Types
// ============================================================================

/**
 * Source of a treatment recommendation.
 */
export const RecommendationSource = {
  CLINICAL_GUIDELINE: 'clinical_guideline',
  ML_MODEL: 'ml_model',
  PEER_COMPARISON: 'peer_comparison',
  CLINICIAN_INPUT: 'clinician_input',
  LITERATURE_REVIEW: 'literature_review',
} as const;
export type RecommendationSource = typeof RecommendationSource[keyof typeof RecommendationSource];

/**
 * Status of a treatment recommendation in the review workflow.
 */
export const RecommendationStatus = {
  GENERATED: 'generated',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  APPLIED: 'applied',
  EXPIRED: 'expired',
} as const;
export type RecommendationStatus = typeof RecommendationStatus[keyof typeof RecommendationStatus];

/**
 * A treatment recommendation produced by the engine.
 */
export interface TreatmentRecommendation {
  id: string;
  patientId: string;
  carePlanId?: string;
  /** Source of the recommendation */
  source: RecommendationSource;
  /** Current status in the review workflow */
  status: RecommendationStatus;
  /** Category of treatment (e.g., "medication_adjustment", "exercise_modification") */
  treatmentCategory: string;
  /** Short title of the recommendation */
  title: string;
  /** Detailed rationale for the recommendation */
  rationale: string;
  /** Specific actions to be taken */
  actions: RecommendationAction[];
  /** Confidence score from 0.0 to 1.0 */
  confidenceScore: number;
  /** Evidence references supporting this recommendation */
  evidenceReferences: EvidenceReference[];
  /** Expected outcome if the recommendation is followed */
  expectedOutcome: string;
  /** Potential risks if the recommendation is followed */
  risks: string[];
  /** Contraindications to check before applying */
  contraindications: string[];
  /** ID of the reviewing clinician */
  reviewedBy?: string;
  /** Clinician's notes on the recommendation */
  reviewNotes?: string;
  /** ISO timestamp of generation */
  generatedAt: string;
  /** ISO timestamp of review decision */
  reviewedAt?: string;
  /** ISO timestamp after which the recommendation expires */
  expiresAt: string;
}

/**
 * A specific action within a treatment recommendation.
 */
export interface RecommendationAction {
  /** Description of the action to be taken */
  description: string;
  /** Priority of this action relative to others */
  priority: 'required' | 'recommended' | 'optional';
  /** Entity type affected (e.g., "medication", "exercise", "appointment") */
  targetType: string;
  /** ID of the entity to be modified (if applicable) */
  targetId?: string;
  /** Structured parameters for the action (varies by action type) */
  parameters?: Record<string, unknown>;
}

/**
 * A clinical evidence reference supporting a recommendation.
 */
export interface EvidenceReference {
  /** Title of the evidence source */
  title: string;
  /** Type of evidence (e.g., "rct", "meta_analysis", "guideline") */
  evidenceType: string;
  /** URL or DOI link to the source */
  url?: string;
  /** Level of evidence (e.g., "I", "II-A", "II-B", "III") */
  evidenceLevel: string;
  /** Brief summary of the relevant finding */
  summary: string;
}

// ============================================================================
// 8. Rehabilitation Exercise AI Types
// ============================================================================

/**
 * Difficulty levels for rehabilitation exercises.
 */
export const ExerciseDifficulty = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;
export type ExerciseDifficulty = typeof ExerciseDifficulty[keyof typeof ExerciseDifficulty];

/**
 * Types of rehabilitation exercises.
 */
export const ExerciseType = {
  RANGE_OF_MOTION: 'range_of_motion',
  STRENGTHENING: 'strengthening',
  STRETCHING: 'stretching',
  BALANCE: 'balance',
  CARDIOVASCULAR: 'cardiovascular',
  FUNCTIONAL: 'functional',
  BREATHING: 'breathing',
} as const;
export type ExerciseType = typeof ExerciseType[keyof typeof ExerciseType];

/**
 * Status of an exercise session.
 */
export const ExerciseSessionStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  PARTIALLY_COMPLETED: 'partially_completed',
} as const;
export type ExerciseSessionStatus = typeof ExerciseSessionStatus[keyof typeof ExerciseSessionStatus];

/**
 * Definition of a single rehabilitation exercise.
 */
export interface RehabExercise {
  id: string;
  /** Display name of the exercise */
  name: string;
  /** Detailed description and instructions */
  description: string;
  /** Type of exercise */
  exerciseType: ExerciseType;
  /** Current difficulty level */
  difficulty: ExerciseDifficulty;
  /** Target body region(s) */
  targetBodyRegions: SymptomBodyRegion[];
  /** Number of sets */
  sets: number;
  /** Number of repetitions per set */
  reps: number;
  /** Hold time per repetition in seconds (for stretching/isometric) */
  holdSeconds?: number;
  /** Rest time between sets in seconds */
  restBetweenSetsSeconds: number;
  /** Estimated total duration in minutes */
  estimatedDurationMinutes: number;
  /** URL to instructional video */
  videoUrl?: string;
  /** URL to instructional image or animation */
  imageUrl?: string;
  /** Contraindications and precautions */
  precautions: string[];
  /** Conditions under which to stop the exercise (safety) */
  stopConditions: string[];
}

/**
 * An AI-generated exercise plan for a patient.
 */
export interface RehabExercisePlan {
  id: string;
  patientId: string;
  carePlanId?: string;
  /** Plan name (e.g., "Week 3 Post-Op Knee Rehabilitation") */
  name: string;
  /** Exercises included in this plan, ordered by sequence */
  exercises: RehabPlanExercise[];
  /** Number of sessions per week */
  sessionsPerWeek: number;
  /** Estimated total plan duration in weeks */
  durationWeeks: number;
  /** Difficulty that the AI selected based on patient status */
  currentDifficulty: ExerciseDifficulty;
  /** ISO timestamp of plan creation */
  createdAt: string;
  /** ISO timestamp of last AI-driven adjustment */
  lastAdjustedAt?: string;
  /** Reason for the most recent adjustment */
  adjustmentReason?: string;
}

/**
 * An exercise within a plan, with plan-specific overrides.
 */
export interface RehabPlanExercise {
  exerciseId: string;
  /** Overridden sets (if different from default) */
  sets: number;
  /** Overridden reps (if different from default) */
  reps: number;
  /** Order in the session */
  sequenceOrder: number;
  /** AI-generated notes specific to this patient */
  patientNotes?: string;
}

/**
 * Record of a completed exercise session.
 */
export interface ExerciseSession {
  id: string;
  patientId: string;
  planId: string;
  /** Status of this session */
  status: ExerciseSessionStatus;
  /** Actual exercises performed with completion details */
  exerciseLogs: ExerciseLog[];
  /** Patient-reported pain level during session (0-10 scale) */
  painLevelDuring?: number;
  /** Patient-reported pain level after session (0-10 scale) */
  painLevelAfter?: number;
  /** Patient-reported perceived exertion (Borg scale 6-20) */
  perceivedExertion?: number;
  /** Free-text session notes from the patient */
  notes?: string;
  /** ISO timestamp of session start */
  startedAt: string;
  /** ISO timestamp of session end */
  completedAt?: string;
}

/**
 * Log entry for a single exercise within a session.
 */
export interface ExerciseLog {
  exerciseId: string;
  /** Actual sets completed */
  setsCompleted: number;
  /** Actual reps completed per set */
  repsCompleted: number[];
  /** Whether the patient was able to maintain proper form */
  properForm: boolean;
  /** Pain experienced during this exercise (0-10) */
  painLevel: number;
  /** Optional notes about this specific exercise */
  notes?: string;
}

// ============================================================================
// 9. Pain Tracking & Prediction Types
// ============================================================================

/**
 * Type of pain reported by the patient.
 */
export const PainType = {
  SHARP: 'sharp',
  DULL: 'dull',
  THROBBING: 'throbbing',
  BURNING: 'burning',
  ACHING: 'aching',
  STABBING: 'stabbing',
  TINGLING: 'tingling',
  SHOOTING: 'shooting',
  CRAMPING: 'cramping',
} as const;
export type PainType = typeof PainType[keyof typeof PainType];

/**
 * Context/trigger for a pain episode.
 */
export const PainTrigger = {
  REST: 'rest',
  MOVEMENT: 'movement',
  EXERCISE: 'exercise',
  MEDICATION_WEARING_OFF: 'medication_wearing_off',
  WEATHER_CHANGE: 'weather_change',
  STRESS: 'stress',
  SLEEP_POSITION: 'sleep_position',
  UNKNOWN: 'unknown',
} as const;
export type PainTrigger = typeof PainTrigger[keyof typeof PainTrigger];

/**
 * A single pain entry logged by a patient.
 */
export interface PainEntry {
  id: string;
  patientId: string;
  /** Pain intensity on a 0-10 Numeric Rating Scale (NRS) */
  intensityScore: number;
  /** Type(s) of pain experienced */
  painTypes: PainType[];
  /** Body region where pain is felt */
  bodyRegion: SymptomBodyRegion;
  /** Trigger or context for the pain episode */
  trigger: PainTrigger;
  /** Duration of the pain episode in minutes (if known) */
  durationMinutes?: number;
  /** Whether medication was taken for this pain */
  medicationTaken: boolean;
  /** Name of medication taken (if any) */
  medicationName?: string;
  /** Whether the medication provided relief */
  medicationEffective?: boolean;
  /** Interference with daily activities (0-10 scale) */
  activityInterference: number;
  /** Interference with sleep (0-10 scale) */
  sleepInterference: number;
  /** Free-text notes from the patient */
  notes?: string;
  /** ISO timestamp of when pain was reported */
  reportedAt: string;
}

/**
 * AI-generated pain prediction for upcoming time periods.
 */
export interface PainPrediction {
  id: string;
  patientId: string;
  /** Predicted average pain level (0-10) for the prediction window */
  predictedIntensity: number;
  /** Confidence interval for the prediction */
  confidenceInterval: PredictionConfidenceInterval;
  /** Start of the prediction window (ISO timestamp) */
  windowStart: string;
  /** End of the prediction window (ISO timestamp) */
  windowEnd: string;
  /** Factors most likely contributing to predicted pain */
  predictedTriggers: PainTrigger[];
  /** AI-generated suggestions for pain management */
  managementSuggestions: string[];
  /** ISO timestamp of when the prediction was generated */
  generatedAt: string;
}

/**
 * Aggregated pain trend data for visualization.
 */
export interface PainTrend {
  patientId: string;
  /** Start of the trend period */
  periodStart: string;
  /** End of the trend period */
  periodEnd: string;
  /** Average pain intensity across the period */
  averageIntensity: number;
  /** Maximum pain intensity recorded in the period */
  maxIntensity: number;
  /** Minimum pain intensity recorded in the period */
  minIntensity: number;
  /** Total number of pain entries in the period */
  entryCount: number;
  /** Most common pain type in the period */
  dominantPainType: PainType;
  /** Most common trigger in the period */
  dominantTrigger: PainTrigger;
  /** Trend direction compared to the previous period */
  trendDirection: 'improving' | 'stable' | 'worsening';
  /** Individual data points for charting */
  dataPoints: PainDataPoint[];
}

/**
 * A single data point in a pain trend for charting.
 */
export interface PainDataPoint {
  /** ISO timestamp of the reading */
  timestamp: string;
  /** Pain intensity (0-10) */
  intensity: number;
  /** Pain type(s) at this point */
  painTypes: PainType[];
}

// ============================================================================
// 10. Vital Signs Monitoring Types
// ============================================================================

/**
 * Types of vital signs tracked by the system.
 */
export const VitalSignType = {
  HEART_RATE: 'heart_rate',
  BLOOD_PRESSURE_SYSTOLIC: 'blood_pressure_systolic',
  BLOOD_PRESSURE_DIASTOLIC: 'blood_pressure_diastolic',
  TEMPERATURE: 'temperature',
  RESPIRATORY_RATE: 'respiratory_rate',
  OXYGEN_SATURATION: 'oxygen_saturation',
  BLOOD_GLUCOSE: 'blood_glucose',
  WEIGHT: 'weight',
} as const;
export type VitalSignType = typeof VitalSignType[keyof typeof VitalSignType];

/**
 * Source of the vital sign measurement.
 */
export const VitalSignSource = {
  MANUAL_ENTRY: 'manual_entry',
  WEARABLE_DEVICE: 'wearable_device',
  CLINICAL_MEASUREMENT: 'clinical_measurement',
  HOME_DEVICE: 'home_device',
} as const;
export type VitalSignSource = typeof VitalSignSource[keyof typeof VitalSignSource];

/**
 * A single vital sign reading.
 */
export interface VitalSignReading {
  id: string;
  patientId: string;
  /** Type of vital sign */
  vitalType: VitalSignType;
  /** Numeric value of the reading */
  value: number;
  /** Unit of measurement (e.g., "bpm", "mmHg", "°F", "%SpO2") */
  unit: string;
  /** Source of the reading */
  source: VitalSignSource;
  /** Device ID if from a connected device */
  deviceId?: string;
  /** Whether this reading is within normal range */
  isNormal: boolean;
  /** If abnormal, which direction (above or below normal) */
  abnormalDirection?: 'above' | 'below';
  /** ISO timestamp of when the reading was taken */
  measuredAt: string;
  /** ISO timestamp of when the reading was recorded in the system */
  recordedAt: string;
}

/**
 * Normal range configuration for a vital sign type.
 */
export interface VitalSignNormalRange {
  vitalType: VitalSignType;
  /** Lower bound of normal range */
  normalMin: number;
  /** Upper bound of normal range */
  normalMax: number;
  /** Critical low threshold (triggers immediate alert) */
  criticalMin: number;
  /** Critical high threshold (triggers immediate alert) */
  criticalMax: number;
  /** Unit of measurement */
  unit: string;
}

/**
 * Aggregated vital sign summary for a time period.
 */
export interface VitalSignSummary {
  patientId: string;
  vitalType: VitalSignType;
  /** Start of the summary period */
  periodStart: string;
  /** End of the summary period */
  periodEnd: string;
  /** Average value in the period */
  average: number;
  /** Minimum value in the period */
  min: number;
  /** Maximum value in the period */
  max: number;
  /** Standard deviation of values */
  stdDev: number;
  /** Number of readings in the period */
  readingCount: number;
  /** Number of abnormal readings */
  abnormalCount: number;
  /** Trend direction compared to previous period */
  trend: 'increasing' | 'stable' | 'decreasing';
  /** Unit of measurement */
  unit: string;
}

/**
 * A vital sign alert triggered by abnormal readings.
 */
export interface VitalSignAlert {
  id: string;
  patientId: string;
  /** The reading that triggered the alert */
  readingId: string;
  /** Vital sign type involved */
  vitalType: VitalSignType;
  /** Severity of the alert */
  severity: 'warning' | 'critical';
  /** Human-readable alert message */
  message: string;
  /** Whether the alert has been acknowledged by a clinician */
  acknowledged: boolean;
  /** ID of the clinician who acknowledged */
  acknowledgedBy?: string;
  /** ISO timestamp of the alert */
  triggeredAt: string;
  /** ISO timestamp of acknowledgment */
  acknowledgedAt?: string;
}

// ============================================================================
// 11. Analytics Dashboard Types
// ============================================================================

/**
 * Time granularity for analytics data aggregation.
 */
export const AnalyticsGranularity = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
} as const;
export type AnalyticsGranularity = typeof AnalyticsGranularity[keyof typeof AnalyticsGranularity];

/**
 * Types of analytics widgets available on the dashboard.
 */
export const AnalyticsWidgetType = {
  LINE_CHART: 'line_chart',
  BAR_CHART: 'bar_chart',
  PIE_CHART: 'pie_chart',
  STAT_CARD: 'stat_card',
  HEATMAP: 'heatmap',
  TABLE: 'table',
  GAUGE: 'gauge',
  SCATTER_PLOT: 'scatter_plot',
} as const;
export type AnalyticsWidgetType = typeof AnalyticsWidgetType[keyof typeof AnalyticsWidgetType];

/**
 * A single metric data point for analytics display.
 */
export interface AnalyticsDataPoint {
  /** ISO timestamp or label for the x-axis */
  label: string;
  /** Numeric value */
  value: number;
  /** Optional secondary value (e.g., for comparison) */
  comparisonValue?: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A data series within an analytics widget.
 */
export interface AnalyticsDataSeries {
  /** Display name of the series */
  name: string;
  /** Color for rendering (CSS color value) */
  color?: string;
  /** Data points in the series */
  dataPoints: AnalyticsDataPoint[];
}

/**
 * Configuration and data for an analytics dashboard widget.
 */
export interface AnalyticsWidget {
  id: string;
  /** Display title of the widget */
  title: string;
  /** Widget visualization type */
  widgetType: AnalyticsWidgetType;
  /** Data series to render */
  dataSeries: AnalyticsDataSeries[];
  /** Time granularity for time-based widgets */
  granularity?: AnalyticsGranularity;
  /** Position on the dashboard grid (row, column) */
  gridPosition: { row: number; column: number };
  /** Size on the dashboard grid (width, height in grid units) */
  gridSize: { width: number; height: number };
  /** ISO timestamp of when the data was last refreshed */
  lastRefreshedAt: string;
}

/**
 * A saved dashboard layout configuration.
 */
export interface AnalyticsDashboard {
  id: string;
  /** Dashboard name */
  name: string;
  /** User who created the dashboard */
  ownerId: string;
  /** Role-based visibility (which roles can see this dashboard) */
  visibleToRoles: UserRole[];
  /** Widgets on this dashboard */
  widgets: AnalyticsWidget[];
  /** Default date range filter */
  defaultDateRange: {
    start: string;
    end: string;
  };
  /** Default granularity */
  defaultGranularity: AnalyticsGranularity;
  /** Whether this is the default dashboard for its audience */
  isDefault: boolean;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  updatedAt: string;
}

/**
 * Request parameters for fetching analytics data.
 */
export interface AnalyticsQuery {
  /** Metric identifier to fetch */
  metricId: string;
  /** Start of the query range (ISO timestamp) */
  startDate: string;
  /** End of the query range (ISO timestamp) */
  endDate: string;
  /** Desired granularity */
  granularity: AnalyticsGranularity;
  /** Optional filters (e.g., patientId, doctorId, carePlanId) */
  filters?: Record<string, string | string[]>;
  /** Optional comparison period */
  comparisonStartDate?: string;
  comparisonEndDate?: string;
}

// ============================================================================
// 12. Patient Outcome Tracking Types
// ============================================================================

/**
 * Types of patient outcome measures.
 */
export const OutcomeMeasureType = {
  PAIN_REDUCTION: 'pain_reduction',
  MOBILITY_IMPROVEMENT: 'mobility_improvement',
  FUNCTIONAL_SCORE: 'functional_score',
  QUALITY_OF_LIFE: 'quality_of_life',
  READMISSION_RATE: 'readmission_rate',
  RECOVERY_TIME: 'recovery_time',
  PATIENT_SATISFACTION: 'patient_satisfaction',
  ADHERENCE_RATE: 'adherence_rate',
} as const;
export type OutcomeMeasureType = typeof OutcomeMeasureType[keyof typeof OutcomeMeasureType];

/**
 * Status of an outcome goal.
 */
export const OutcomeGoalStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  ACHIEVED: 'achieved',
  NOT_ACHIEVED: 'not_achieved',
} as const;
export type OutcomeGoalStatus = typeof OutcomeGoalStatus[keyof typeof OutcomeGoalStatus];

/**
 * A defined outcome goal for a patient's care plan.
 */
export interface OutcomeGoal {
  id: string;
  patientId: string;
  carePlanId: string;
  /** Type of outcome being measured */
  measureType: OutcomeMeasureType;
  /** Short description of the goal */
  description: string;
  /** Target value to achieve */
  targetValue: number;
  /** Unit of the target value */
  targetUnit: string;
  /** Baseline value at the start of the care plan */
  baselineValue: number;
  /** Current value (most recent measurement) */
  currentValue: number;
  /** Goal status */
  status: OutcomeGoalStatus;
  /** Target date for achieving the goal (ISO timestamp) */
  targetDate: string;
  /** ISO timestamp of when the goal was created */
  createdAt: string;
  /** ISO timestamp of the most recent measurement */
  lastMeasuredAt: string;
}

/**
 * A single outcome measurement entry.
 */
export interface OutcomeMeasurement {
  id: string;
  goalId: string;
  patientId: string;
  /** Measured value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Source of the measurement (e.g., "patient_report", "clinical_assessment") */
  source: string;
  /** Notes from the measurer */
  notes?: string;
  /** ISO timestamp of the measurement */
  measuredAt: string;
  /** ID of the user who recorded the measurement */
  recordedBy: string;
}

/**
 * Summary of patient outcomes across a care plan.
 */
export interface PatientOutcomeSummary {
  patientId: string;
  carePlanId: string;
  /** All defined goals for this care plan */
  goals: OutcomeGoal[];
  /** Percentage of goals on track or achieved */
  overallProgressPercent: number;
  /** Number of goals achieved */
  goalsAchieved: number;
  /** Number of goals at risk */
  goalsAtRisk: number;
  /** Overall care plan adherence rate as a percentage */
  adherenceRate: number;
  /** ISO timestamp of the summary generation */
  generatedAt: string;
}

// ============================================================================
// 13. Notification System Types
// ============================================================================

/**
 * Notification delivery channels.
 */
export const NotificationChannel = {
  IN_APP: 'in_app',
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms',
} as const;
export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];

/**
 * Notification priority levels.
 */
export const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type NotificationPriority = typeof NotificationPriority[keyof typeof NotificationPriority];

/**
 * Categories of notifications.
 */
export const NotificationCategory = {
  MISSION_REMINDER: 'mission_reminder',
  MEDICATION_REMINDER: 'medication_reminder',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  LAB_RESULT: 'lab_result',
  TRIAGE_ALERT: 'triage_alert',
  MESSAGE_RECEIVED: 'message_received',
  CARE_PLAN_UPDATE: 'care_plan_update',
  ANOMALY_ALERT: 'anomaly_alert',
  STREAK_UPDATE: 'streak_update',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
} as const;
export type NotificationCategory = typeof NotificationCategory[keyof typeof NotificationCategory];

/**
 * Status of a notification.
 */
export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  DISMISSED: 'dismissed',
} as const;
export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus];

/**
 * A notification record.
 */
export interface Notification {
  id: string;
  /** Recipient user ID */
  recipientId: string;
  /** Notification category */
  category: NotificationCategory;
  /** Priority level */
  priority: NotificationPriority;
  /** Delivery channel */
  channel: NotificationChannel;
  /** Current status */
  status: NotificationStatus;
  /** Short notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Deep link URL within the application (e.g., "/missions/123") */
  actionUrl?: string;
  /** Label for the action button */
  actionLabel?: string;
  /** Additional structured data for the notification */
  data?: Record<string, unknown>;
  /** ISO timestamp of when the notification was created */
  createdAt: string;
  /** ISO timestamp of when the notification was sent */
  sentAt?: string;
  /** ISO timestamp of when the notification was read */
  readAt?: string;
  /** ISO timestamp after which the notification should not be delivered */
  expiresAt?: string;
}

/**
 * User notification preferences.
 */
export interface NotificationPreferences {
  userId: string;
  /** Global toggle for all notifications */
  enabled: boolean;
  /** Per-channel enabled/disabled */
  channels: Record<NotificationChannel, boolean>;
  /** Per-category preferences */
  categoryPreferences: NotificationCategoryPreference[];
  /** Quiet hours configuration (no non-urgent notifications) */
  quietHours?: {
    enabled: boolean;
    /** Start time in HH:MM format (24h) */
    startTime: string;
    /** End time in HH:MM format (24h) */
    endTime: string;
    /** Timezone (IANA format, e.g., "America/New_York") */
    timezone: string;
  };
}

/**
 * Per-category notification preference.
 */
export interface NotificationCategoryPreference {
  category: NotificationCategory;
  /** Whether this category is enabled */
  enabled: boolean;
  /** Preferred channels for this category */
  preferredChannels: NotificationChannel[];
}

// ============================================================================
// 14. Medication Interaction Checker Types
// ============================================================================

/**
 * Severity of a medication interaction.
 */
export const InteractionSeverity = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  MAJOR: 'major',
  CONTRAINDICATED: 'contraindicated',
} as const;
export type InteractionSeverity = typeof InteractionSeverity[keyof typeof InteractionSeverity];

/**
 * Type of interaction between medications.
 */
export const InteractionType = {
  DRUG_DRUG: 'drug_drug',
  DRUG_FOOD: 'drug_food',
  DRUG_ALLERGY: 'drug_allergy',
  DRUG_CONDITION: 'drug_condition',
  DUPLICATE_THERAPY: 'duplicate_therapy',
} as const;
export type InteractionType = typeof InteractionType[keyof typeof InteractionType];

/**
 * A detected interaction between two or more substances/conditions.
 */
export interface MedicationInteraction {
  id: string;
  /** Type of interaction */
  interactionType: InteractionType;
  /** Severity classification */
  severity: InteractionSeverity;
  /** First substance involved */
  substanceA: string;
  /** Second substance (or food/condition) involved */
  substanceB: string;
  /** Clinical description of the interaction effect */
  description: string;
  /** Clinical significance and what can happen */
  clinicalEffect: string;
  /** Recommended management approach */
  management: string;
  /** Evidence references or drug database sources */
  references: string[];
}

/**
 * Request to check for medication interactions.
 */
export interface InteractionCheckRequest {
  patientId: string;
  /** List of current medication names to check */
  currentMedications: string[];
  /** New medication being considered */
  proposedMedication: string;
  /** Known patient allergies */
  knownAllergies: string[];
  /** Active medical conditions (ICD-10 codes or descriptions) */
  activeConditions: string[];
}

/**
 * Result of a medication interaction check.
 */
export interface InteractionCheckResult {
  id: string;
  patientId: string;
  /** The proposed medication that was checked */
  proposedMedication: string;
  /** All detected interactions */
  interactions: MedicationInteraction[];
  /** Whether it is safe to proceed (no major/contraindicated interactions) */
  isSafe: boolean;
  /** Overall risk summary */
  riskSummary: string;
  /** Recommended alternatives if interactions are found */
  alternatives: MedicationAlternative[];
  /** ISO timestamp of the check */
  checkedAt: string;
}

/**
 * A suggested alternative medication when an interaction is detected.
 */
export interface MedicationAlternative {
  /** Alternative medication name */
  medicationName: string;
  /** Therapeutic equivalence class */
  therapeuticClass: string;
  /** Why this alternative is suggested */
  rationale: string;
  /** Whether this alternative has its own interactions with current medications */
  hasOwnInteractions: boolean;
}

// ============================================================================
// 15. Appointment Scheduling Types
// ============================================================================

/**
 * Types of appointments available.
 */
export const AppointmentType = {
  IN_PERSON: 'in_person',
  TELEHEALTH_VIDEO: 'telehealth_video',
  TELEHEALTH_PHONE: 'telehealth_phone',
  LAB_WORK: 'lab_work',
  IMAGING: 'imaging',
  PHYSICAL_THERAPY: 'physical_therapy',
  FOLLOW_UP: 'follow_up',
  URGENT_CARE: 'urgent_care',
} as const;
export type AppointmentType = typeof AppointmentType[keyof typeof AppointmentType];

/**
 * Status of an appointment.
 */
export const AppointmentStatus = {
  REQUESTED: 'requested',
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
} as const;
export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

/**
 * An appointment record.
 */
export interface Appointment {
  id: string;
  patientId: string;
  /** ID of the assigned clinician */
  clinicianId: string;
  /** Name of the assigned clinician (for display) */
  clinicianName: string;
  /** Type of appointment */
  appointmentType: AppointmentType;
  /** Current status */
  status: AppointmentStatus;
  /** Title/reason for the appointment */
  title: string;
  /** Detailed notes or reason for visit */
  description?: string;
  /** Scheduled start time (ISO timestamp) */
  scheduledStart: string;
  /** Scheduled end time (ISO timestamp) */
  scheduledEnd: string;
  /** Physical location (for in-person) */
  location?: string;
  /** Telehealth meeting URL (for virtual visits) */
  meetingUrl?: string;
  /** Related care plan ID */
  carePlanId?: string;
  /** Pre-appointment instructions for the patient */
  preInstructions?: string;
  /** Post-appointment notes from the clinician */
  postNotes?: string;
  /** Whether a reminder has been sent */
  reminderSent: boolean;
  /** Cancellation or reschedule reason */
  cancellationReason?: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * A time slot representing availability for scheduling.
 */
export interface AppointmentSlot {
  /** Start of the available slot (ISO timestamp) */
  startTime: string;
  /** End of the available slot (ISO timestamp) */
  endTime: string;
  /** Clinician ID who is available during this slot */
  clinicianId: string;
  /** Whether this slot is already booked */
  isBooked: boolean;
  /** Appointment types supported during this slot */
  supportedTypes: AppointmentType[];
}

/**
 * Request to schedule a new appointment.
 */
export interface ScheduleAppointmentRequest {
  patientId: string;
  clinicianId: string;
  appointmentType: AppointmentType;
  /** Desired start time (ISO timestamp) */
  preferredStart: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Reason for the visit */
  reason: string;
  /** Related care plan ID (optional) */
  carePlanId?: string;
}

// ============================================================================
// 16. Chat / Messaging Types
// ============================================================================

/**
 * Type of chat message.
 */
export const ChatMessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
  AI_SUGGESTION: 'ai_suggestion',
} as const;
export type ChatMessageType = typeof ChatMessageType[keyof typeof ChatMessageType];

/**
 * Status of a chat message delivery.
 */
export const ChatMessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;
export type ChatMessageStatus = typeof ChatMessageStatus[keyof typeof ChatMessageStatus];

/**
 * A chat conversation (thread) between participants.
 */
export interface ChatConversation {
  id: string;
  /** Participant user IDs */
  participantIds: string[];
  /** Display title for the conversation (e.g., patient name or group subject) */
  title: string;
  /** Related care plan (if this is a care-plan-specific conversation) */
  carePlanId?: string;
  /** ID of the most recent message in the conversation */
  lastMessageId?: string;
  /** Preview text of the most recent message */
  lastMessagePreview?: string;
  /** ISO timestamp of the most recent message */
  lastMessageAt?: string;
  /** Per-participant unread counts */
  unreadCounts: Record<string, number>;
  /** Whether the conversation is archived */
  isArchived: boolean;
  /** ISO timestamp of creation */
  createdAt: string;
}

/**
 * A single chat message within a conversation.
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  /** ID of the user who sent the message (null for system messages) */
  senderId: string | null;
  /** Display name of the sender */
  senderName: string;
  /** Role of the sender */
  senderRole: UserRole;
  /** Type of message */
  messageType: ChatMessageType;
  /** Text content of the message */
  content: string;
  /** Delivery status */
  status: ChatMessageStatus;
  /** File/image attachment metadata */
  attachment?: ChatAttachment;
  /** Whether this message has been flagged for clinical review */
  flaggedForReview: boolean;
  /** ID of the message being replied to (for threaded replies) */
  replyToMessageId?: string;
  /** ISO timestamp of when the message was sent */
  sentAt: string;
  /** ISO timestamp of when the message was edited (if applicable) */
  editedAt?: string;
}

/**
 * Metadata for a file or image attachment in a chat message.
 */
export interface ChatAttachment {
  /** Original file name */
  fileName: string;
  /** MIME type of the file */
  mimeType: string;
  /** File size in bytes */
  fileSizeBytes: number;
  /** URL to retrieve the attachment */
  url: string;
  /** Thumbnail URL for images */
  thumbnailUrl?: string;
}

// ============================================================================
// 17. Audit Log Types
// ============================================================================

/**
 * Categories of auditable actions in the system.
 */
export const AuditActionCategory = {
  AUTHENTICATION: 'authentication',
  PATIENT_DATA: 'patient_data',
  CARE_PLAN: 'care_plan',
  MEDICATION: 'medication',
  TRIAGE: 'triage',
  MESSAGING: 'messaging',
  APPOINTMENT: 'appointment',
  CONFIGURATION: 'configuration',
  EXPORT: 'export',
  ADMIN: 'admin',
} as const;
export type AuditActionCategory = typeof AuditActionCategory[keyof typeof AuditActionCategory];

/**
 * Specific audit action types.
 */
export const AuditAction = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  VIEW_RECORD: 'view_record',
  CREATE_RECORD: 'create_record',
  UPDATE_RECORD: 'update_record',
  DELETE_RECORD: 'delete_record',
  EXPORT_DATA: 'export_data',
  APPROVE_ACTION: 'approve_action',
  REJECT_ACTION: 'reject_action',
  SEND_MESSAGE: 'send_message',
  SCHEDULE_APPOINTMENT: 'schedule_appointment',
  MODIFY_PERMISSIONS: 'modify_permissions',
  SYSTEM_CONFIG_CHANGE: 'system_config_change',
} as const;
export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

/**
 * A single audit log entry. Compliant with HIPAA audit trail requirements.
 */
export interface AuditLogEntry {
  id: string;
  /** ISO timestamp of the event (high-precision) */
  timestamp: string;
  /** ID of the user who performed the action */
  userId: string;
  /** Name of the user (captured at the time of event) */
  userName: string;
  /** Role of the user at the time of the event */
  userRole: UserRole;
  /** Category of the action */
  category: AuditActionCategory;
  /** Specific action performed */
  action: AuditAction;
  /** Type of the resource that was acted upon (e.g., "care_plan", "patient") */
  resourceType: string;
  /** ID of the resource that was acted upon */
  resourceId: string;
  /** Human-readable description of the action */
  description: string;
  /** IP address of the client (if available) */
  ipAddress?: string;
  /** User agent string of the client */
  userAgent?: string;
  /** Previous state of the resource (for update/delete actions) */
  previousState?: Record<string, unknown>;
  /** New state of the resource (for create/update actions) */
  newState?: Record<string, unknown>;
  /** Whether the action was successful */
  success: boolean;
  /** Error message if the action failed */
  errorMessage?: string;
}

/**
 * Query parameters for searching audit logs.
 */
export interface AuditLogQuery {
  /** Filter by user ID */
  userId?: string;
  /** Filter by action category */
  category?: AuditActionCategory;
  /** Filter by specific action */
  action?: AuditAction;
  /** Filter by resource type */
  resourceType?: string;
  /** Filter by resource ID */
  resourceId?: string;
  /** Start of the time range (ISO timestamp) */
  startDate: string;
  /** End of the time range (ISO timestamp) */
  endDate: string;
  /** Whether to include only failed actions */
  failedOnly?: boolean;
  /** Maximum number of results to return */
  limit: number;
  /** Offset for pagination */
  offset: number;
}

// ============================================================================
// 18. Export / Report Types
// ============================================================================

/**
 * Supported export file formats.
 */
export const ExportFormat = {
  PDF: 'pdf',
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
  HL7_FHIR: 'hl7_fhir',
} as const;
export type ExportFormat = typeof ExportFormat[keyof typeof ExportFormat];

/**
 * Types of reports that can be generated.
 */
export const ReportType = {
  PATIENT_SUMMARY: 'patient_summary',
  CARE_PLAN_PROGRESS: 'care_plan_progress',
  OUTCOME_REPORT: 'outcome_report',
  MEDICATION_HISTORY: 'medication_history',
  VITAL_SIGNS_REPORT: 'vital_signs_report',
  PAIN_LOG_REPORT: 'pain_log_report',
  EXERCISE_COMPLIANCE: 'exercise_compliance',
  AUDIT_TRAIL: 'audit_trail',
  ANALYTICS_EXPORT: 'analytics_export',
  BILLING_SUMMARY: 'billing_summary',
} as const;
export type ReportType = typeof ReportType[keyof typeof ReportType];

/**
 * Status of an export job.
 */
export const ExportJobStatus = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired',
} as const;
export type ExportJobStatus = typeof ExportJobStatus[keyof typeof ExportJobStatus];

/**
 * Request to generate a report export.
 */
export interface ExportRequest {
  /** Type of report to generate */
  reportType: ReportType;
  /** Desired file format */
  format: ExportFormat;
  /** Patient ID (for patient-specific reports) */
  patientId?: string;
  /** Care plan ID (for care-plan-specific reports) */
  carePlanId?: string;
  /** Start of the date range for the report */
  startDate: string;
  /** End of the date range for the report */
  endDate: string;
  /** Additional filters specific to the report type */
  filters?: Record<string, unknown>;
  /** Whether to include PHI (Protected Health Information) */
  includePhi: boolean;
  /** ID of the user requesting the export */
  requestedBy: string;
}

/**
 * An export job tracking record.
 */
export interface ExportJob {
  id: string;
  /** The original export request */
  request: ExportRequest;
  /** Current status of the job */
  status: ExportJobStatus;
  /** Progress percentage (0-100) */
  progressPercent: number;
  /** URL to download the exported file (when completed) */
  downloadUrl?: string;
  /** File size in bytes (when completed) */
  fileSizeBytes?: number;
  /** Error message if the job failed */
  errorMessage?: string;
  /** ISO timestamp of when the job was created */
  createdAt: string;
  /** ISO timestamp of when the job completed */
  completedAt?: string;
  /** ISO timestamp of when the download link expires */
  expiresAt?: string;
}

/**
 * A generated report document with metadata.
 */
export interface ReportDocument {
  id: string;
  /** Export job that produced this document */
  exportJobId: string;
  /** Report type */
  reportType: ReportType;
  /** File format */
  format: ExportFormat;
  /** Report title */
  title: string;
  /** Report generation timestamp */
  generatedAt: string;
  /** User who requested the report */
  generatedBy: string;
  /** Number of records included in the report */
  recordCount: number;
  /** Date range covered by the report */
  dateRange: {
    start: string;
    end: string;
  };
  /** Whether the report contains PHI */
  containsPhi: boolean;
}

// ============================================================================
// 19. Wearable Device Integration Types
// ============================================================================

/**
 * Supported wearable device platforms.
 */
export const WearablePlatform = {
  APPLE_HEALTH: 'apple_health',
  GOOGLE_FIT: 'google_fit',
  FITBIT: 'fitbit',
  GARMIN: 'garmin',
  SAMSUNG_HEALTH: 'samsung_health',
  WITHINGS: 'withings',
  GENERIC_BLE: 'generic_ble',
} as const;
export type WearablePlatform = typeof WearablePlatform[keyof typeof WearablePlatform];

/**
 * Connection status of a wearable device.
 */
export const WearableConnectionStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  PAIRING: 'pairing',
  SYNCING: 'syncing',
  ERROR: 'error',
} as const;
export type WearableConnectionStatus = typeof WearableConnectionStatus[keyof typeof WearableConnectionStatus];

/**
 * Types of data a wearable device can provide.
 */
export const WearableDataType = {
  HEART_RATE: 'heart_rate',
  STEPS: 'steps',
  SLEEP: 'sleep',
  BLOOD_OXYGEN: 'blood_oxygen',
  TEMPERATURE: 'temperature',
  BLOOD_PRESSURE: 'blood_pressure',
  ECG: 'ecg',
  ACTIVITY: 'activity',
  CALORIES: 'calories',
} as const;
export type WearableDataType = typeof WearableDataType[keyof typeof WearableDataType];

/**
 * A registered wearable device for a patient.
 */
export interface WearableDevice {
  id: string;
  patientId: string;
  /** Platform/manufacturer of the device */
  platform: WearablePlatform;
  /** Device model name */
  deviceModel: string;
  /** Firmware version of the device */
  firmwareVersion?: string;
  /** Battery level as a percentage (0-100) */
  batteryLevel?: number;
  /** Current connection status */
  connectionStatus: WearableConnectionStatus;
  /** Types of data this device can provide */
  supportedDataTypes: WearableDataType[];
  /** OAuth token or API key for the device platform (encrypted reference) */
  authTokenRef?: string;
  /** ISO timestamp of when the device was paired */
  pairedAt: string;
  /** ISO timestamp of the last successful data sync */
  lastSyncAt?: string;
  /** ISO timestamp of the next scheduled sync */
  nextSyncAt?: string;
}

/**
 * A batch of data synced from a wearable device.
 */
export interface WearableSyncRecord {
  id: string;
  deviceId: string;
  patientId: string;
  /** Type of data synced */
  dataType: WearableDataType;
  /** Data points received in this sync batch */
  dataPoints: WearableDataPoint[];
  /** Number of data points in the batch */
  pointCount: number;
  /** ISO timestamp of sync start */
  syncStartedAt: string;
  /** ISO timestamp of sync completion */
  syncCompletedAt: string;
  /** Whether the sync was successful */
  success: boolean;
  /** Error message if sync failed */
  errorMessage?: string;
}

/**
 * A single data point from a wearable device.
 */
export interface WearableDataPoint {
  /** ISO timestamp of the reading */
  timestamp: string;
  /** Numeric value of the reading */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Optional secondary value (e.g., diastolic for blood pressure) */
  secondaryValue?: number;
  /** Additional metadata from the device */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for wearable device data sync.
 */
export interface WearableSyncConfig {
  deviceId: string;
  /** Data types to sync from this device */
  enabledDataTypes: WearableDataType[];
  /** Sync interval in minutes */
  syncIntervalMinutes: number;
  /** Whether real-time streaming is enabled (if supported) */
  realtimeEnabled: boolean;
  /** Whether to generate alerts from wearable data */
  alertsEnabled: boolean;
}

// ============================================================================
// 20. Telehealth Session Types
// ============================================================================

/**
 * Status of a telehealth session.
 */
export const TelehealthSessionStatus = {
  SCHEDULED: 'scheduled',
  WAITING_ROOM: 'waiting_room',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;
export type TelehealthSessionStatus = typeof TelehealthSessionStatus[keyof typeof TelehealthSessionStatus];

/**
 * Connection quality levels for telehealth sessions.
 */
export const ConnectionQuality = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  DISCONNECTED: 'disconnected',
} as const;
export type ConnectionQuality = typeof ConnectionQuality[keyof typeof ConnectionQuality];

/**
 * A telehealth video/audio session record.
 */
export interface TelehealthSession {
  id: string;
  /** Related appointment ID */
  appointmentId: string;
  patientId: string;
  clinicianId: string;
  /** Current session status */
  status: TelehealthSessionStatus;
  /** Video/audio meeting room URL */
  meetingUrl: string;
  /** Meeting room token/ID for the video platform */
  meetingRoomId: string;
  /** Whether video is enabled */
  videoEnabled: boolean;
  /** Whether audio is enabled */
  audioEnabled: boolean;
  /** Whether screen sharing is active */
  screenSharingActive: boolean;
  /** Whether the session is being recorded (with consent) */
  recordingEnabled: boolean;
  /** URL of the session recording (if recorded) */
  recordingUrl?: string;
  /** ISO timestamp of scheduled start */
  scheduledStart: string;
  /** ISO timestamp of actual session start */
  actualStart?: string;
  /** ISO timestamp of session end */
  actualEnd?: string;
  /** Duration of the session in minutes */
  durationMinutes?: number;
}

/**
 * Network/connection quality metrics for a telehealth participant.
 */
export interface TelehealthConnectionMetrics {
  sessionId: string;
  /** User ID of the participant */
  participantId: string;
  /** Overall connection quality assessment */
  quality: ConnectionQuality;
  /** Round-trip latency in milliseconds */
  latencyMs: number;
  /** Packet loss percentage (0-100) */
  packetLossPercent: number;
  /** Audio bitrate in kbps */
  audioBitrateKbps: number;
  /** Video bitrate in kbps */
  videoBitrateKbps: number;
  /** Video resolution (e.g., "1280x720") */
  videoResolution: string;
  /** Frames per second */
  fps: number;
  /** ISO timestamp of the metrics snapshot */
  measuredAt: string;
}

/**
 * Clinical notes captured during or after a telehealth session.
 */
export interface TelehealthSessionNotes {
  sessionId: string;
  clinicianId: string;
  /** Chief complaint discussed */
  chiefComplaint: string;
  /** Summary of findings from the session */
  findings: string;
  /** Assessment and plan text */
  assessmentAndPlan: string;
  /** Prescriptions or orders made during the session */
  orders?: string[];
  /** Follow-up recommendations */
  followUpRecommendations?: string;
  /** ICD-10 diagnosis codes discussed */
  diagnosisCodes?: string[];
  /** CPT billing codes for the session */
  billingCodes?: string[];
  /** ISO timestamp of when notes were saved */
  savedAt: string;
}

/**
 * Consent record for telehealth session recording/participation.
 */
export interface TelehealthConsent {
  sessionId: string;
  patientId: string;
  /** Whether the patient consented to the telehealth visit */
  telehealthConsent: boolean;
  /** Whether the patient consented to recording */
  recordingConsent: boolean;
  /** Method of obtaining consent */
  consentMethod: 'verbal' | 'written' | 'electronic';
  /** ISO timestamp of when consent was obtained */
  consentedAt: string;
  /** ID of the clinician who obtained consent */
  obtainedBy: string;
}

// ============================================================================
// Extended Storage Keys
// ============================================================================

/**
 * Storage keys for the extended system modules.
 */
export const EXTENDED_STORAGE_KEYS = {
  PREDICTIONS: 'recovery_pilot_predictions',
  ADAPTIVE_FEEDBACK: 'recovery_pilot_adaptive_feedback',
  SYMPTOM_ENTRIES: 'recovery_pilot_symptom_entries',
  RISK_PROFILES: 'recovery_pilot_risk_profiles',
  SENTIMENT_RESULTS: 'recovery_pilot_sentiment_results',
  ANOMALY_DETECTIONS: 'recovery_pilot_anomaly_detections',
  TREATMENT_RECOMMENDATIONS: 'recovery_pilot_treatment_recommendations',
  REHAB_EXERCISE_PLANS: 'recovery_pilot_rehab_exercise_plans',
  EXERCISE_SESSIONS: 'recovery_pilot_exercise_sessions',
  PAIN_ENTRIES: 'recovery_pilot_pain_entries',
  VITAL_SIGN_READINGS: 'recovery_pilot_vital_sign_readings',
  ANALYTICS_DASHBOARDS: 'recovery_pilot_analytics_dashboards',
  OUTCOME_GOALS: 'recovery_pilot_outcome_goals',
  OUTCOME_MEASUREMENTS: 'recovery_pilot_outcome_measurements',
  NOTIFICATIONS: 'recovery_pilot_notifications',
  NOTIFICATION_PREFERENCES: 'recovery_pilot_notification_preferences',
  INTERACTION_CHECKS: 'recovery_pilot_interaction_checks',
  APPOINTMENTS: 'recovery_pilot_appointments',
  CHAT_CONVERSATIONS: 'recovery_pilot_chat_conversations',
  CHAT_MESSAGES: 'recovery_pilot_chat_messages',
  AUDIT_LOG: 'recovery_pilot_audit_log',
  EXPORT_JOBS: 'recovery_pilot_export_jobs',
  WEARABLE_DEVICES: 'recovery_pilot_wearable_devices',
  WEARABLE_SYNC_RECORDS: 'recovery_pilot_wearable_sync_records',
  TELEHEALTH_SESSIONS: 'recovery_pilot_telehealth_sessions',
} as const;
