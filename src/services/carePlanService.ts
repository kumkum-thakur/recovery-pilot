/**
 * CarePlanService - Main orchestration service for Doctor Care Plan Management.
 *
 * Coordinates care plan CRUD operations, mission and medication management,
 * template application, validation, and mission instance generation.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 5.1, 5.2, 10.1, 10.2
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  CarePlan,
  CarePlanMission,
  MedicationPrescription,
  CarePlanTemplate,
  CreateCarePlanInput,
  CreateMissionInput,
  CreateMedicationInput,
  ValidationResult,
  MissionModel,
  MissionSchedule,
} from '../types';
import {
  CarePlanStatus,
  CarePlanMissionStatus,
  MedicationStatus,
} from '../types';
import { persistenceService } from './persistenceService';
import { missionGenerationService } from './missionGenerationService';
import { medicationMissionGenerator } from './medicationMissionGenerator';
import { carePlanValidation } from './carePlanValidation';
import { DEFAULT_TEMPLATES, getTemplateById } from './carePlanTemplates';

/**
 * Implementation of the care plan management service.
 *
 * All methods are synchronous since the underlying persistence layer
 * uses localStorage which is a synchronous API.
 */
class CarePlanServiceImpl {
  // ==========================================================================
  // Care Plan CRUD
  // ==========================================================================

  /**
   * Creates a new care plan after validation.
   *
   * @param input - The care plan creation input
   * @returns The newly created CarePlan
   * @throws Error if validation fails
   */
  createCarePlan(input: CreateCarePlanInput): CarePlan {
    const validation = carePlanValidation.validateCarePlan(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const now = new Date();
    const carePlan: CarePlan = {
      id: uuidv4(),
      patientId: input.patientId,
      doctorId: input.doctorId,
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now,
      status: CarePlanStatus.ACTIVE,
      missions: [],
      medications: [],
    };

    persistenceService.saveCarePlan(carePlan);
    return carePlan;
  }

  /**
   * Retrieves a care plan by ID.
   *
   * @param carePlanId - The care plan ID
   * @returns The care plan or null if not found
   */
  getCarePlan(carePlanId: string): CarePlan | null {
    return persistenceService.getCarePlan(carePlanId);
  }

  /**
   * Retrieves all care plans for a specific patient.
   *
   * @param patientId - The patient ID
   * @returns Array of care plans belonging to the patient
   */
  getCarePlansForPatient(patientId: string): CarePlan[] {
    return persistenceService.getCarePlansForPatient(patientId);
  }

  /**
   * Retrieves all care plans created by a specific doctor.
   *
   * @param doctorId - The doctor ID
   * @returns Array of care plans created by the doctor
   */
  getCarePlansForDoctor(doctorId: string): CarePlan[] {
    return persistenceService.getCarePlansForDoctor(doctorId);
  }

  /**
   * Updates a care plan with partial data.
   *
   * @param carePlanId - The care plan ID to update
   * @param updates - Partial updates (name, description, status)
   * @returns The updated care plan
   * @throws Error if the care plan is not found
   */
  updateCarePlan(
    carePlanId: string,
    updates: Partial<Pick<CarePlan, 'name' | 'description' | 'status'>>
  ): CarePlan {
    const carePlan = persistenceService.getCarePlan(carePlanId);
    if (!carePlan) {
      throw new Error(`Care plan not found: ${carePlanId}`);
    }

    const updatedPlan: CarePlan = {
      ...carePlan,
      ...updates,
      updatedAt: new Date(),
    };

    persistenceService.saveCarePlan(updatedPlan);
    return updatedPlan;
  }

  /**
   * Archives a care plan by setting its status to ARCHIVED.
   *
   * @param carePlanId - The care plan ID to archive
   * @throws Error if the care plan is not found
   */
  archiveCarePlan(carePlanId: string): void {
    this.updateCarePlan(carePlanId, { status: CarePlanStatus.ARCHIVED });
  }

  // ==========================================================================
  // Mission Management
  // ==========================================================================

  /**
   * Adds a new mission to an existing care plan.
   *
   * Creates the CarePlanMission, attaches it to the care plan, saves the plan,
   * then generates concrete MissionModel instances from the schedule and persists them.
   *
   * @param carePlanId - The care plan to add the mission to
   * @param mission - The mission creation input
   * @returns The newly created CarePlanMission
   * @throws Error if the care plan is not found
   */
  addMissionToCarePlan(
    carePlanId: string,
    mission: CreateMissionInput
  ): CarePlanMission {
    const carePlan = persistenceService.getCarePlan(carePlanId);
    if (!carePlan) {
      throw new Error(`Care plan not found: ${carePlanId}`);
    }

    const now = new Date();
    const carePlanMission: CarePlanMission = {
      id: uuidv4(),
      carePlanId,
      type: mission.type,
      title: mission.title,
      description: mission.description,
      schedule: mission.schedule,
      status: CarePlanMissionStatus.ACTIVE,
      createdAt: now,
      metadata: mission.metadata,
    };

    carePlan.missions.push(carePlanMission);
    carePlan.updatedAt = new Date();
    persistenceService.saveCarePlan(carePlan);

    // Generate and persist concrete mission instances
    const instances = missionGenerationService.generateMissionInstances(
      carePlanMission,
      carePlan.patientId
    );
    for (const instance of instances) {
      persistenceService.saveMission(instance);
    }

    return carePlanMission;
  }

  /**
   * Updates an existing mission within a care plan.
   *
   * @param carePlanId - The care plan containing the mission
   * @param missionId - The mission ID to update
   * @param updates - Partial updates (title, description, schedule)
   * @returns The updated CarePlanMission
   * @throws Error if the care plan or mission is not found
   */
  updateCarePlanMission(
    carePlanId: string,
    missionId: string,
    updates: Partial<Pick<CarePlanMission, 'title' | 'description' | 'schedule'>>
  ): CarePlanMission {
    const carePlan = persistenceService.getCarePlan(carePlanId);
    if (!carePlan) {
      throw new Error(`Care plan not found: ${carePlanId}`);
    }

    const missionIndex = carePlan.missions.findIndex((m) => m.id === missionId);
    if (missionIndex === -1) {
      throw new Error(`Mission not found: ${missionId} in care plan ${carePlanId}`);
    }

    const updatedMission: CarePlanMission = {
      ...carePlan.missions[missionIndex],
      ...updates,
    };

    carePlan.missions[missionIndex] = updatedMission;
    carePlan.updatedAt = new Date();
    persistenceService.saveCarePlan(carePlan);

    return updatedMission;
  }

  /**
   * Cancels a mission within a care plan by setting its status to CANCELLED.
   *
   * @param carePlanId - The care plan containing the mission
   * @param missionId - The mission ID to cancel
   * @throws Error if the care plan or mission is not found
   */
  cancelCarePlanMission(carePlanId: string, missionId: string): void {
    const carePlan = persistenceService.getCarePlan(carePlanId);
    if (!carePlan) {
      throw new Error(`Care plan not found: ${carePlanId}`);
    }

    const missionIndex = carePlan.missions.findIndex((m) => m.id === missionId);
    if (missionIndex === -1) {
      throw new Error(`Mission not found: ${missionId} in care plan ${carePlanId}`);
    }

    carePlan.missions[missionIndex] = {
      ...carePlan.missions[missionIndex],
      status: CarePlanMissionStatus.CANCELLED,
    };
    carePlan.updatedAt = new Date();
    persistenceService.saveCarePlan(carePlan);
  }

  // ==========================================================================
  // Medication Management
  // ==========================================================================

  /**
   * Adds a medication prescription to an existing care plan.
   *
   * Creates the MedicationPrescription, attaches it to the care plan, saves the plan,
   * then generates medication-based CarePlanMissions and their concrete instances.
   *
   * @param carePlanId - The care plan to add the medication to
   * @param medication - The medication creation input
   * @returns The newly created MedicationPrescription
   * @throws Error if the care plan is not found
   */
  addMedicationToCarePlan(
    carePlanId: string,
    medication: CreateMedicationInput
  ): MedicationPrescription {
    const carePlan = persistenceService.getCarePlan(carePlanId);
    if (!carePlan) {
      throw new Error(`Care plan not found: ${carePlanId}`);
    }

    const now = new Date();
    const endDate = medication.duration
      ? new Date(
          medication.startDate.getTime() + medication.duration * 24 * 60 * 60 * 1000
        )
      : undefined;

    const prescription: MedicationPrescription = {
      id: uuidv4(),
      carePlanId,
      medicationName: medication.medicationName,
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.duration,
      refillThreshold: medication.refillThreshold,
      instructions: medication.instructions,
      startDate: medication.startDate,
      endDate,
      status: MedicationStatus.ACTIVE,
      createdAt: now,
    };

    carePlan.medications.push(prescription);
    carePlan.updatedAt = new Date();
    persistenceService.saveCarePlan(carePlan);

    // Generate medication-based care plan missions
    const medicationMissions =
      medicationMissionGenerator.generateMedicationMissions(prescription);

    // For each generated medication mission, also generate concrete instances
    for (const medMission of medicationMissions) {
      carePlan.missions.push(medMission);

      const instances = missionGenerationService.generateMissionInstances(
        medMission,
        carePlan.patientId
      );
      for (const instance of instances) {
        persistenceService.saveMission(instance);
      }
    }

    // Save the care plan again with the newly added medication missions
    carePlan.updatedAt = new Date();
    persistenceService.saveCarePlan(carePlan);

    return prescription;
  }

  /**
   * Updates an existing medication within a care plan.
   *
   * @param carePlanId - The care plan containing the medication
   * @param medicationId - The medication ID to update
   * @param updates - Partial updates (dosage, frequency, instructions)
   * @returns The updated MedicationPrescription
   * @throws Error if the care plan or medication is not found
   */
  updateMedication(
    carePlanId: string,
    medicationId: string,
    updates: Partial<Pick<MedicationPrescription, 'dosage' | 'frequency' | 'instructions'>>
  ): MedicationPrescription {
    const carePlan = persistenceService.getCarePlan(carePlanId);
    if (!carePlan) {
      throw new Error(`Care plan not found: ${carePlanId}`);
    }

    const medIndex = carePlan.medications.findIndex((m) => m.id === medicationId);
    if (medIndex === -1) {
      throw new Error(
        `Medication not found: ${medicationId} in care plan ${carePlanId}`
      );
    }

    const updatedMedication: MedicationPrescription = {
      ...carePlan.medications[medIndex],
      ...updates,
    };

    carePlan.medications[medIndex] = updatedMedication;
    carePlan.updatedAt = new Date();
    persistenceService.saveCarePlan(carePlan);

    return updatedMedication;
  }

  /**
   * Cancels a medication within a care plan by setting its status to CANCELLED.
   *
   * @param carePlanId - The care plan containing the medication
   * @param medicationId - The medication ID to cancel
   * @throws Error if the care plan or medication is not found
   */
  cancelMedication(carePlanId: string, medicationId: string): void {
    const carePlan = persistenceService.getCarePlan(carePlanId);
    if (!carePlan) {
      throw new Error(`Care plan not found: ${carePlanId}`);
    }

    const medIndex = carePlan.medications.findIndex((m) => m.id === medicationId);
    if (medIndex === -1) {
      throw new Error(
        `Medication not found: ${medicationId} in care plan ${carePlanId}`
      );
    }

    carePlan.medications[medIndex] = {
      ...carePlan.medications[medIndex],
      status: MedicationStatus.CANCELLED,
    };
    carePlan.updatedAt = new Date();
    persistenceService.saveCarePlan(carePlan);
  }

  // ==========================================================================
  // Templates
  // ==========================================================================

  /**
   * Returns all available care plan templates.
   *
   * @returns Array of CarePlanTemplate objects
   */
  getTemplates(): CarePlanTemplate[] {
    return DEFAULT_TEMPLATES;
  }

  /**
   * Applies a template to create a fully populated care plan.
   *
   * Creates a new care plan from the template definition, then adds all template
   * missions (with dates adjusted relative to today) and medications.
   *
   * @param templateId - The template ID to apply
   * @param patientId - The patient to create the plan for
   * @param doctorId - The doctor creating the plan
   * @returns The fully populated CarePlan
   * @throws Error if the template is not found
   */
  applyTemplate(
    templateId: string,
    patientId: string,
    doctorId: string
  ): CarePlan {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Create the base care plan
    const carePlan = this.createCarePlan({
      patientId,
      doctorId,
      name: template.name,
      description: template.description,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add missions from the template with adjusted dates
    for (const templateMission of template.missions) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() + templateMission.schedule.startDayOffset);

      const endDate = templateMission.schedule.durationDays
        ? new Date(
            startDate.getTime() +
              templateMission.schedule.durationDays * 24 * 60 * 60 * 1000
          )
        : undefined;

      const schedule: MissionSchedule = {
        startDate,
        recurrence: templateMission.schedule.recurrence,
        endDate,
      };

      this.addMissionToCarePlan(carePlan.id, {
        type: templateMission.type,
        title: templateMission.title,
        description: templateMission.description,
        schedule,
      });
    }

    // Add medications from the template
    for (const templateMed of template.medications) {
      this.addMedicationToCarePlan(carePlan.id, {
        medicationName: templateMed.medicationName,
        dosage: templateMed.dosage,
        frequency: templateMed.frequency,
        duration: templateMed.durationDays,
        refillThreshold: templateMed.refillThreshold,
        instructions: templateMed.instructions,
        startDate: new Date(today),
      });
    }

    // Return the fully populated care plan from persistence
    return persistenceService.getCarePlan(carePlan.id)!;
  }

  // ==========================================================================
  // Validation & Generation Delegates
  // ==========================================================================

  /**
   * Validates a care plan creation input.
   *
   * @param plan - The care plan input to validate
   * @returns ValidationResult with any detected errors
   */
  validateCarePlan(plan: CreateCarePlanInput): ValidationResult {
    return carePlanValidation.validateCarePlan(plan);
  }

  /**
   * Generates concrete MissionModel instances from a CarePlanMission.
   *
   * @param carePlanMission - The care plan mission to generate instances from
   * @param patientId - The patient to assign the missions to
   * @returns Array of MissionModel instances
   */
  generateMissionInstances(
    carePlanMission: CarePlanMission,
    patientId: string
  ): MissionModel[] {
    return missionGenerationService.generateMissionInstances(
      carePlanMission,
      patientId
    );
  }
}

/** Singleton instance of the care plan service */
export const carePlanService = new CarePlanServiceImpl();

/** Export class for testing */
export { CarePlanServiceImpl };
