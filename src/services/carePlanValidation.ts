/**
 * CarePlanValidation - Validation service for care plans, missions, and medications.
 *
 * Provides comprehensive validation for all care plan entities including
 * input validation, schedule validation, and scheduling limit checks.
 *
 * Requirements: 1.5, 2.5, 3.6, 4.5, 4.6
 */

import type {
  MissionSchedule,
  ValidationResult,
  CreateCarePlanInput,
  CreateMedicationInput,
} from '../types';
import { RecurrenceType } from '../types';

/**
 * Centralized error message constants for consistent validation messaging.
 */
export const ERROR_MESSAGES = {
  // Care plan validation
  CARE_PLAN_NAME_REQUIRED: 'Care plan name is required.',
  CARE_PLAN_DESCRIPTION_REQUIRED: 'Care plan description is required.',
  CARE_PLAN_PATIENT_ID_REQUIRED: 'Patient ID is required.',
  CARE_PLAN_DOCTOR_ID_REQUIRED: 'Doctor ID is required.',

  // Mission schedule validation
  SCHEDULE_START_DATE_PAST: 'Start date cannot be in the past.',
  SCHEDULE_END_DATE_BEFORE_START: 'End date must be after start date.',
  SCHEDULE_OCCURRENCES_POSITIVE: 'Occurrences must be a positive number.',
  SCHEDULE_DAYS_OF_WEEK_REQUIRED: 'Weekly recurrence requires at least one day of week.',
  SCHEDULE_CUSTOM_INTERVAL_REQUIRED: 'Custom recurrence requires a positive interval.',

  // Medication validation
  MEDICATION_NAME_REQUIRED: 'Medication name is required.',
  MEDICATION_DOSAGE_REQUIRED: 'Dosage is required.',
  MEDICATION_FREQUENCY_MIN: 'Frequency must be at least 1 time per day.',
  MEDICATION_REFILL_THRESHOLD_MIN: 'Refill threshold must be 0 or greater.',

  // Scheduling limits
  LIMIT_MAX_INSTANCES_EXCEEDED: 'Schedule would generate more than 100 mission instances.',
  LIMIT_HIGH_DAILY_FREQUENCY: 'Schedule generates more than 5 missions per day.',
  LIMIT_FAR_FUTURE_DATE: 'Schedule extends more than 365 days into the future.',
} as const;

/**
 * Returns the start of today (midnight) for date comparison purposes.
 * Allows "today" but rejects dates strictly before today.
 */
function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Validates a CreateCarePlanInput for required fields.
 *
 * @param plan - The care plan input to validate
 * @returns ValidationResult with any detected errors
 */
export function validateCarePlan(plan: CreateCarePlanInput): ValidationResult {
  const errors: string[] = [];

  if (!plan.name || plan.name.trim().length === 0) {
    errors.push(ERROR_MESSAGES.CARE_PLAN_NAME_REQUIRED);
  }

  if (!plan.description || plan.description.trim().length === 0) {
    errors.push(ERROR_MESSAGES.CARE_PLAN_DESCRIPTION_REQUIRED);
  }

  if (!plan.patientId || plan.patientId.trim().length === 0) {
    errors.push(ERROR_MESSAGES.CARE_PLAN_PATIENT_ID_REQUIRED);
  }

  if (!plan.doctorId || plan.doctorId.trim().length === 0) {
    errors.push(ERROR_MESSAGES.CARE_PLAN_DOCTOR_ID_REQUIRED);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a MissionSchedule for logical consistency.
 *
 * Checks that the start date is not in the past (today is allowed),
 * end date is after start date if both are set, and occurrences is positive if set.
 *
 * @param schedule - The mission schedule to validate
 * @returns ValidationResult with any detected errors
 */
export function validateMissionSchedule(schedule: MissionSchedule): ValidationResult {
  const errors: string[] = [];
  const startOfToday = getStartOfToday();

  // Start date must not be in the past (today is allowed)
  if (schedule.startDate < startOfToday) {
    errors.push(ERROR_MESSAGES.SCHEDULE_START_DATE_PAST);
  }

  // End date must be after start date
  if (schedule.endDate && schedule.endDate <= schedule.startDate) {
    errors.push(ERROR_MESSAGES.SCHEDULE_END_DATE_BEFORE_START);
  }

  // Occurrences must be positive
  if (schedule.occurrences !== undefined && schedule.occurrences <= 0) {
    errors.push(ERROR_MESSAGES.SCHEDULE_OCCURRENCES_POSITIVE);
  }

  // Weekly recurrence needs days of week
  if (
    schedule.recurrence.type === RecurrenceType.WEEKLY &&
    (!schedule.recurrence.daysOfWeek || schedule.recurrence.daysOfWeek.length === 0)
  ) {
    errors.push(ERROR_MESSAGES.SCHEDULE_DAYS_OF_WEEK_REQUIRED);
  }

  // Custom recurrence needs a positive interval
  if (
    schedule.recurrence.type === RecurrenceType.CUSTOM &&
    (!schedule.recurrence.interval || schedule.recurrence.interval <= 0)
  ) {
    errors.push(ERROR_MESSAGES.SCHEDULE_CUSTOM_INTERVAL_REQUIRED);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a CreateMedicationInput for required fields and valid values.
 *
 * @param medication - The medication input to validate
 * @returns ValidationResult with any detected errors
 */
export function validateMedicationPrescription(
  medication: CreateMedicationInput
): ValidationResult {
  const errors: string[] = [];

  if (!medication.medicationName || medication.medicationName.trim().length === 0) {
    errors.push(ERROR_MESSAGES.MEDICATION_NAME_REQUIRED);
  }

  if (!medication.dosage || medication.dosage.trim().length === 0) {
    errors.push(ERROR_MESSAGES.MEDICATION_DOSAGE_REQUIRED);
  }

  if (!medication.frequency || medication.frequency.timesPerDay < 1) {
    errors.push(ERROR_MESSAGES.MEDICATION_FREQUENCY_MIN);
  }

  if (medication.refillThreshold < 0) {
    errors.push(ERROR_MESSAGES.MEDICATION_REFILL_THRESHOLD_MIN);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimates the number of mission instances a schedule would generate.
 *
 * @param schedule - The mission schedule to evaluate
 * @returns Estimated number of instances
 */
function estimateInstanceCount(schedule: MissionSchedule): number {
  const { recurrence, startDate, endDate, occurrences } = schedule;

  if (recurrence.type === RecurrenceType.ONE_TIME) {
    return 1;
  }

  // If occurrences is set, that is the count
  if (occurrences !== undefined) {
    return occurrences;
  }

  // If endDate is set, estimate based on date range
  if (endDate) {
    const daysBetween = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    switch (recurrence.type) {
      case RecurrenceType.DAILY:
        return daysBetween;
      case RecurrenceType.WEEKLY: {
        const daysPerWeek = recurrence.daysOfWeek?.length ?? 1;
        return Math.ceil((daysBetween / 7) * daysPerWeek);
      }
      case RecurrenceType.CUSTOM: {
        const interval = recurrence.interval ?? 1;
        return Math.ceil(daysBetween / interval);
      }
      default:
        return daysBetween;
    }
  }

  // No end constraint -- cannot estimate
  return 0;
}

/**
 * Validates scheduling limits with both errors (hard limits) and warnings (soft limits).
 *
 * Hard limits (errors):
 * - More than 100 instances
 *
 * Soft limits (warnings):
 * - More than 5 missions per day
 * - Dates more than 365 days in the future
 *
 * @param schedule - The mission schedule to check
 * @returns Object with valid flag, errors array, and warnings array
 */
export function validateSchedulingLimits(
  schedule: MissionSchedule
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Estimate total instances
  const estimatedCount = estimateInstanceCount(schedule);

  if (estimatedCount > 100) {
    errors.push(ERROR_MESSAGES.LIMIT_MAX_INSTANCES_EXCEEDED);
  }

  // Check daily frequency (for daily recurrence, check if multiple per day)
  if (schedule.recurrence.type === RecurrenceType.DAILY) {
    // Daily recurrence is 1 per day by default, but in the context of
    // multiple missions being added to a plan, this checks a single schedule.
    // A warning is issued if occurrences imply more than 5 on the same day.
    // Since a single daily schedule produces 1 per day, this is mainly
    // relevant when checking the broader plan context. However, for weekly
    // schedules with many days selected, all could fall in the same week.
  }

  // For weekly recurrence with all 7 days, check if effective daily count > 5
  if (
    schedule.recurrence.type === RecurrenceType.WEEKLY &&
    schedule.recurrence.daysOfWeek &&
    schedule.recurrence.daysOfWeek.length > 5
  ) {
    warnings.push(ERROR_MESSAGES.LIMIT_HIGH_DAILY_FREQUENCY);
  }

  // Check if schedule extends more than 365 days into the future
  const now = new Date();
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setDate(oneYearFromNow.getDate() + 365);

  if (schedule.endDate && schedule.endDate > oneYearFromNow) {
    warnings.push(ERROR_MESSAGES.LIMIT_FAR_FUTURE_DATE);
  }

  // Also check if occurrences with daily recurrence would extend beyond 365 days
  if (
    schedule.recurrence.type === RecurrenceType.DAILY &&
    schedule.occurrences !== undefined &&
    schedule.occurrences > 365
  ) {
    warnings.push(ERROR_MESSAGES.LIMIT_FAR_FUTURE_DATE);
  }

  // Custom recurrence extending beyond 365 days
  if (
    schedule.recurrence.type === RecurrenceType.CUSTOM &&
    schedule.occurrences !== undefined &&
    schedule.recurrence.interval !== undefined
  ) {
    const totalDays = schedule.occurrences * schedule.recurrence.interval;
    if (totalDays > 365) {
      warnings.push(ERROR_MESSAGES.LIMIT_FAR_FUTURE_DATE);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Singleton service object for care plan validation.
 */
export const carePlanValidation = {
  validateCarePlan,
  validateMissionSchedule,
  validateMedicationPrescription,
  validateSchedulingLimits,
  ERROR_MESSAGES,
};
