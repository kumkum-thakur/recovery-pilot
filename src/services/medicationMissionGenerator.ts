/**
 * MedicationMissionGenerator - Generates MEDICATION_CHECK CarePlanMissions
 * from MedicationPrescription definitions.
 *
 * Converts medication frequency configurations into scheduled care plan missions,
 * creating one mission per daily time slot with daily recurrence.
 *
 * Requirements: 3.1, 3.2, 11.1, 11.2, 11.3
 */

import { v4 as uuidv4 } from 'uuid';
import type { MedicationPrescription, CarePlanMission, MissionSchedule } from '../types';
import { MissionType, CarePlanMissionStatus, RecurrenceType } from '../types';

/**
 * Distributes time slots evenly across a 24-hour period.
 *
 * If specific times are provided in the frequency configuration, those are used directly.
 * Otherwise, times are evenly spaced starting from 08:00 (e.g., 3x daily = 08:00, 16:00, 00:00).
 *
 * @param timesPerDay - Number of doses per day
 * @param specificTimes - Optional array of specific times in HH:MM format
 * @returns Array of time strings in HH:MM format
 */
function distributeTimeSlots(timesPerDay: number, specificTimes?: string[]): string[] {
  if (specificTimes && specificTimes.length > 0) {
    return specificTimes;
  }

  const times: string[] = [];
  const intervalHours = 24 / timesPerDay;
  const startHour = 8; // Default start at 08:00

  for (let i = 0; i < timesPerDay; i++) {
    const hour = Math.floor((startHour + i * intervalHours) % 24);
    const formattedHour = hour.toString().padStart(2, '0');
    times.push(`${formattedHour}:00`);
  }

  return times;
}

/**
 * Generates CarePlanMission entries from a MedicationPrescription.
 *
 * Creates one CarePlanMission per time slot per day. For example, a medication
 * taken 3 times daily produces 3 CarePlanMission objects, each with daily recurrence
 * at a specific time of day.
 *
 * @param medication - The medication prescription to generate missions for
 * @returns Array of CarePlanMission objects representing scheduled medication checks
 */
export function generateMedicationMissions(
  medication: MedicationPrescription
): CarePlanMission[] {
  const { frequency, medicationName, dosage, startDate, duration, id: _medId, carePlanId } = medication;
  const timeSlots = distributeTimeSlots(frequency.timesPerDay, frequency.times);

  const endDate = duration
    ? new Date(new Date(startDate).getTime() + duration * 24 * 60 * 60 * 1000)
    : undefined;

  const now = new Date();

  return timeSlots.map((timeOfDay): CarePlanMission => {
    const schedule: MissionSchedule = {
      startDate: new Date(startDate),
      recurrence: {
        type: RecurrenceType.DAILY,
      },
      endDate,
      timeOfDay,
    };

    return {
      id: uuidv4(),
      carePlanId,
      type: MissionType.MEDICATION_CHECK,
      title: `Take ${medicationName}`,
      description: `Take ${dosage} of ${medicationName} at ${timeOfDay}`,
      schedule,
      status: CarePlanMissionStatus.ACTIVE,
      createdAt: now,
      metadata: {
        medicationId: medication.id,
        medicationName,
        dosage,
        timeOfDay,
      },
    };
  });
}

/**
 * Singleton service object for medication mission generation.
 */
export const medicationMissionGenerator = {
  generateMedicationMissions,
};
