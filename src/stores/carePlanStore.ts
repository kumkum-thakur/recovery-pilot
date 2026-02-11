/**
 * CarePlanStore - Zustand store for care plan management
 *
 * Manages:
 * - Care plan list state, selected plan, and loading status
 * - Creating, updating, and archiving care plans
 * - Adding, updating, and cancelling missions within care plans
 * - Adding, updating, and cancelling medications within care plans
 * - Fetching and applying care plan templates
 *
 * Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 5.1, 5.2, 14.1, 14.2
 */

import { create } from 'zustand';
import type {
  CarePlan,
  CarePlanMission,
  MedicationPrescription,
  CarePlanTemplate,
  CreateCarePlanInput,
  CreateMissionInput,
  CreateMedicationInput,
} from '../types';
import { carePlanService } from '../services/carePlanService';

// ============================================================================
// Store Interface
// ============================================================================

interface CarePlanStoreState {
  // State
  carePlans: CarePlan[];
  selectedCarePlan: CarePlan | null;
  templates: CarePlanTemplate[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCarePlansForDoctor: (doctorId: string) => void;
  fetchCarePlansForPatient: (patientId: string) => void;
  selectCarePlan: (carePlanId: string | null) => void;
  createCarePlan: (input: CreateCarePlanInput) => CarePlan;
  updateCarePlan: (carePlanId: string, updates: Partial<Pick<CarePlan, 'name' | 'description' | 'status'>>) => void;
  archiveCarePlan: (carePlanId: string) => void;

  addMission: (carePlanId: string, mission: CreateMissionInput) => void;
  updateMission: (carePlanId: string, missionId: string, updates: Partial<Pick<CarePlanMission, 'title' | 'description' | 'schedule'>>) => void;
  cancelMission: (carePlanId: string, missionId: string) => void;

  addMedication: (carePlanId: string, medication: CreateMedicationInput) => void;
  updateMedication: (carePlanId: string, medicationId: string, updates: Partial<Pick<MedicationPrescription, 'dosage' | 'frequency' | 'instructions'>>) => void;
  cancelMedication: (carePlanId: string, medicationId: string) => void;

  fetchTemplates: () => void;
  applyTemplate: (templateId: string, patientId: string, doctorId: string) => CarePlan;

  clearError: () => void;
}

// ============================================================================
// Internal State for Re-Fetching
// ============================================================================

/**
 * Tracks the last fetch context so mutations can re-fetch the
 * correct care plan list after modifying data.
 */
interface FetchContext {
  type: 'doctor' | 'patient';
  id: string;
}

let lastFetchContext: FetchContext | null = null;

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * CarePlanStore implementation using Zustand
 *
 * Provides state management for care plan creation, editing, missions,
 * medications, and template management.
 *
 * Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 5.1, 5.2, 14.1, 14.2
 */
export const useCarePlanStore = create<CarePlanStoreState>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================

  /**
   * List of care plans for the current doctor or patient.
   * Empty array if no care plans have been loaded.
   */
  carePlans: [],

  /**
   * The currently selected care plan for detailed viewing/editing.
   * null if no care plan is selected.
   */
  selectedCarePlan: null,

  /**
   * List of available care plan templates.
   * Empty array if templates have not been fetched.
   */
  templates: [],

  /**
   * Loading state for synchronous operations that may take time.
   * true when fetching or processing care plan data.
   */
  isLoading: false,

  /**
   * Error message from the most recent failed operation.
   * null when there is no error.
   */
  error: null,

  // ============================================================================
  // Fetch Actions
  // ============================================================================

  /**
   * Fetches all care plans for a specific doctor.
   *
   * Stores the doctor ID so subsequent mutations can re-fetch
   * the updated list automatically.
   *
   * @param doctorId - Doctor user ID
   */
  fetchCarePlansForDoctor: (doctorId: string) => {
    set({ isLoading: true, error: null });

    try {
      lastFetchContext = { type: 'doctor', id: doctorId };
      const carePlans = carePlanService.getCarePlansForDoctor(doctorId);

      set({
        carePlans,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch care plans for doctor';
      console.error('Failed to fetch care plans for doctor:', error);
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Fetches all care plans for a specific patient.
   *
   * Stores the patient ID so subsequent mutations can re-fetch
   * the updated list automatically.
   *
   * @param patientId - Patient user ID
   */
  fetchCarePlansForPatient: (patientId: string) => {
    set({ isLoading: true, error: null });

    try {
      lastFetchContext = { type: 'patient', id: patientId };
      const carePlans = carePlanService.getCarePlansForPatient(patientId);

      set({
        carePlans,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch care plans for patient';
      console.error('Failed to fetch care plans for patient:', error);
      set({ error: message, isLoading: false });
    }
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  /**
   * Selects a care plan by ID for detailed viewing/editing.
   *
   * If carePlanId is null, deselects the current care plan.
   * Looks up the plan in the currently loaded carePlans array.
   *
   * @param carePlanId - Care plan ID to select, or null to deselect
   */
  selectCarePlan: (carePlanId: string | null) => {
    if (carePlanId === null) {
      set({ selectedCarePlan: null });
      return;
    }

    const { carePlans } = get();
    const plan = carePlans.find((p) => p.id === carePlanId) ?? null;
    set({ selectedCarePlan: plan });
  },

  // ============================================================================
  // Care Plan CRUD Actions
  // ============================================================================

  /**
   * Creates a new care plan.
   *
   * After creation, re-fetches the care plans list to keep state in sync.
   *
   * @param input - Care plan creation input
   * @returns The newly created CarePlan
   * @throws Error if creation fails
   */
  createCarePlan: (input: CreateCarePlanInput): CarePlan => {
    set({ error: null });

    try {
      const newPlan = carePlanService.createCarePlan(input);
      refetchCarePlans(set);
      return newPlan;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create care plan';
      console.error('Failed to create care plan:', error);
      set({ error: message });
      throw error;
    }
  },

  /**
   * Updates an existing care plan's name, description, or status.
   *
   * After updating, re-fetches the care plans list and refreshes the
   * selected care plan if it matches the updated plan.
   *
   * @param carePlanId - ID of the care plan to update
   * @param updates - Partial updates to apply
   */
  updateCarePlan: (carePlanId: string, updates: Partial<Pick<CarePlan, 'name' | 'description' | 'status'>>) => {
    set({ error: null });

    try {
      const updatedPlan = carePlanService.updateCarePlan(carePlanId, updates);
      refetchCarePlans(set);
      refreshSelectedCarePlan(set, get, carePlanId, updatedPlan);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update care plan';
      console.error('Failed to update care plan:', error);
      set({ error: message });
    }
  },

  /**
   * Archives a care plan, making it inactive.
   *
   * After archiving, re-fetches the care plans list. If the archived plan
   * was the selected plan, deselects it.
   *
   * @param carePlanId - ID of the care plan to archive
   */
  archiveCarePlan: (carePlanId: string) => {
    set({ error: null });

    try {
      carePlanService.archiveCarePlan(carePlanId);
      refetchCarePlans(set);

      // Deselect if the archived plan was selected
      const { selectedCarePlan } = get();
      if (selectedCarePlan?.id === carePlanId) {
        set({ selectedCarePlan: null });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive care plan';
      console.error('Failed to archive care plan:', error);
      set({ error: message });
    }
  },

  // ============================================================================
  // Mission Actions
  // ============================================================================

  /**
   * Adds a new mission to a care plan.
   *
   * After adding, re-fetches care plans and refreshes the selected plan
   * if it matches.
   *
   * @param carePlanId - ID of the care plan
   * @param mission - Mission creation input
   */
  addMission: (carePlanId: string, mission: CreateMissionInput) => {
    set({ error: null });

    try {
      carePlanService.addMissionToCarePlan(carePlanId, mission);
      refetchCarePlans(set);
      refreshSelectedCarePlanFromService(set, get, carePlanId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add mission';
      console.error('Failed to add mission:', error);
      set({ error: message });
    }
  },

  /**
   * Updates an existing mission within a care plan.
   *
   * @param carePlanId - ID of the care plan
   * @param missionId - ID of the mission to update
   * @param updates - Partial updates (title, description, schedule)
   */
  updateMission: (carePlanId: string, missionId: string, updates: Partial<Pick<CarePlanMission, 'title' | 'description' | 'schedule'>>) => {
    set({ error: null });

    try {
      carePlanService.updateCarePlanMission(carePlanId, missionId, updates);
      refetchCarePlans(set);
      refreshSelectedCarePlanFromService(set, get, carePlanId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update mission';
      console.error('Failed to update mission:', error);
      set({ error: message });
    }
  },

  /**
   * Cancels a mission within a care plan.
   *
   * @param carePlanId - ID of the care plan
   * @param missionId - ID of the mission to cancel
   */
  cancelMission: (carePlanId: string, missionId: string) => {
    set({ error: null });

    try {
      carePlanService.cancelCarePlanMission(carePlanId, missionId);
      refetchCarePlans(set);
      refreshSelectedCarePlanFromService(set, get, carePlanId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel mission';
      console.error('Failed to cancel mission:', error);
      set({ error: message });
    }
  },

  // ============================================================================
  // Medication Actions
  // ============================================================================

  /**
   * Adds a new medication prescription to a care plan.
   *
   * @param carePlanId - ID of the care plan
   * @param medication - Medication creation input
   */
  addMedication: (carePlanId: string, medication: CreateMedicationInput) => {
    set({ error: null });

    try {
      carePlanService.addMedicationToCarePlan(carePlanId, medication);
      refetchCarePlans(set);
      refreshSelectedCarePlanFromService(set, get, carePlanId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add medication';
      console.error('Failed to add medication:', error);
      set({ error: message });
    }
  },

  /**
   * Updates a medication prescription within a care plan.
   *
   * @param carePlanId - ID of the care plan
   * @param medicationId - ID of the medication to update
   * @param updates - Partial updates (dosage, frequency, instructions)
   */
  updateMedication: (carePlanId: string, medicationId: string, updates: Partial<Pick<MedicationPrescription, 'dosage' | 'frequency' | 'instructions'>>) => {
    set({ error: null });

    try {
      carePlanService.updateMedication(carePlanId, medicationId, updates);
      refetchCarePlans(set);
      refreshSelectedCarePlanFromService(set, get, carePlanId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update medication';
      console.error('Failed to update medication:', error);
      set({ error: message });
    }
  },

  /**
   * Cancels a medication prescription within a care plan.
   *
   * @param carePlanId - ID of the care plan
   * @param medicationId - ID of the medication to cancel
   */
  cancelMedication: (carePlanId: string, medicationId: string) => {
    set({ error: null });

    try {
      carePlanService.cancelMedication(carePlanId, medicationId);
      refetchCarePlans(set);
      refreshSelectedCarePlanFromService(set, get, carePlanId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel medication';
      console.error('Failed to cancel medication:', error);
      set({ error: message });
    }
  },

  // ============================================================================
  // Template Actions
  // ============================================================================

  /**
   * Fetches all available care plan templates.
   */
  fetchTemplates: () => {
    set({ isLoading: true, error: null });

    try {
      const templates = carePlanService.getTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch templates';
      console.error('Failed to fetch templates:', error);
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Applies a care plan template to create a new care plan for a patient.
   *
   * After applying, re-fetches the care plans list to include the new plan.
   *
   * @param templateId - ID of the template to apply
   * @param patientId - Patient user ID
   * @param doctorId - Doctor user ID
   * @returns The newly created CarePlan from the template
   * @throws Error if template application fails
   */
  applyTemplate: (templateId: string, patientId: string, doctorId: string): CarePlan => {
    set({ error: null });

    try {
      const newPlan = carePlanService.applyTemplate(templateId, patientId, doctorId);
      refetchCarePlans(set);
      return newPlan;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply template';
      console.error('Failed to apply template:', error);
      set({ error: message });
      throw error;
    }
  },

  // ============================================================================
  // Utility Actions
  // ============================================================================

  /**
   * Clears the current error state.
   */
  clearError: () => {
    set({ error: null });
  },
}));

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Re-fetches the care plans list using the last fetch context (doctor or patient).
 *
 * This is called after mutations to keep the store state in sync with
 * the underlying service data.
 *
 * @param set - Zustand set function
 */
function refetchCarePlans(set: (state: Partial<CarePlanStoreState>) => void): void {
  if (!lastFetchContext) {
    return;
  }

  try {
    const carePlans =
      lastFetchContext.type === 'doctor'
        ? carePlanService.getCarePlansForDoctor(lastFetchContext.id)
        : carePlanService.getCarePlansForPatient(lastFetchContext.id);

    set({ carePlans });
  } catch (error) {
    console.error('Failed to re-fetch care plans:', error);
  }
}

/**
 * Refreshes the selected care plan if it matches the given carePlanId.
 *
 * Used after update operations where the updated plan object is already available.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param carePlanId - ID of the care plan that was modified
 * @param updatedPlan - The updated care plan object
 */
function refreshSelectedCarePlan(
  set: (state: Partial<CarePlanStoreState>) => void,
  get: () => CarePlanStoreState,
  carePlanId: string,
  updatedPlan: CarePlan,
): void {
  const { selectedCarePlan } = get();
  if (selectedCarePlan?.id === carePlanId) {
    set({ selectedCarePlan: updatedPlan });
  }
}

/**
 * Refreshes the selected care plan by re-fetching it from the service.
 *
 * Used after mission/medication mutations where the full updated plan
 * needs to be retrieved from the service.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param carePlanId - ID of the care plan to refresh
 */
function refreshSelectedCarePlanFromService(
  set: (state: Partial<CarePlanStoreState>) => void,
  get: () => CarePlanStoreState,
  carePlanId: string,
): void {
  const { selectedCarePlan } = get();
  if (selectedCarePlan?.id === carePlanId) {
    try {
      const refreshedPlan = carePlanService.getCarePlan(carePlanId);
      set({ selectedCarePlan: refreshedPlan });
    } catch (error) {
      console.error('Failed to refresh selected care plan:', error);
    }
  }
}
