/**
 * MissionGenerationService - Generates MissionModel instances from CarePlanMission schedules
 *
 * Handles all recurrence types (one-time, daily, weekly, custom) and converts
 * care plan mission definitions into concrete, schedulable mission instances.
 *
 * Requirements: 2.4, 4.1, 4.2, 4.3
 */

import { v4 as uuidv4 } from 'uuid';
import type { CarePlanMission, MissionModel, MissionSchedule } from '../types';
import { MissionStatus, RecurrenceType } from '../types';

/** Maximum number of mission instances that can be generated from a single schedule */
const MAX_INSTANCES = 100;

/**
 * Calculates an array of due dates based on a MissionSchedule configuration.
 *
 * @param schedule - The schedule defining recurrence, start/end dates, and occurrences
 * @returns Array of Date objects representing each due date
 */
export function calculateDueDates(schedule: MissionSchedule): Date[] {
  const dates: Date[] = [];
  const { startDate, recurrence, endDate, occurrences, timeOfDay } = schedule;

  const applyTimeOfDay = (date: Date): Date => {
    const result = new Date(date);
    if (timeOfDay) {
      const [hours, minutes] = timeOfDay.split(':').map(Number);
      result.setHours(hours, minutes, 0, 0);
    }
    return result;
  };

  const isWithinBounds = (date: Date, count: number): boolean => {
    if (endDate && date > endDate) {
      return false;
    }
    if (occurrences !== undefined && count >= occurrences) {
      return false;
    }
    if (count >= MAX_INSTANCES) {
      return false;
    }
    return true;
  };

  switch (recurrence.type) {
    case RecurrenceType.ONE_TIME: {
      dates.push(applyTimeOfDay(startDate));
      break;
    }

    case RecurrenceType.DAILY: {
      const current = new Date(startDate);
      let count = 0;

      while (isWithinBounds(current, count)) {
        dates.push(applyTimeOfDay(new Date(current)));
        count++;
        current.setDate(current.getDate() + 1);
      }
      break;
    }

    case RecurrenceType.WEEKLY: {
      const daysOfWeek = recurrence.daysOfWeek ?? [];
      if (daysOfWeek.length === 0) {
        // If no days specified, use the start date's day of week
        daysOfWeek.push(startDate.getDay());
      }

      const current = new Date(startDate);
      let count = 0;

      // Iterate day by day from startDate until bounds exceeded
      // We need a safety limit beyond MAX_INSTANCES to prevent infinite loops
      // when no matching days are found within the date range
      const maxIterations = MAX_INSTANCES * 7 + 7;
      let iterations = 0;

      while (count < MAX_INSTANCES && iterations < maxIterations) {
        if (endDate && current > endDate) {
          break;
        }
        if (occurrences !== undefined && count >= occurrences) {
          break;
        }

        if (daysOfWeek.includes(current.getDay())) {
          dates.push(applyTimeOfDay(new Date(current)));
          count++;
        }

        current.setDate(current.getDate() + 1);
        iterations++;
      }
      break;
    }

    case RecurrenceType.CUSTOM: {
      const interval = recurrence.interval ?? 1;
      const current = new Date(startDate);
      let count = 0;

      while (isWithinBounds(current, count)) {
        dates.push(applyTimeOfDay(new Date(current)));
        count++;
        current.setDate(current.getDate() + interval);
      }
      break;
    }
  }

  return dates;
}

/**
 * Generates concrete MissionModel instances from a CarePlanMission definition.
 *
 * Each generated mission is a standalone, trackable instance with a unique ID,
 * linked back to the source CarePlanMission via metadata.
 *
 * @param carePlanMission - The care plan mission template defining the schedule
 * @param patientId - The patient ID to assign missions to
 * @returns Array of MissionModel instances ready for persistence
 */
export function generateMissionInstances(
  carePlanMission: CarePlanMission,
  patientId: string
): MissionModel[] {
  const dueDates = calculateDueDates(carePlanMission.schedule);

  return dueDates.map((dueDate): MissionModel => ({
    id: uuidv4(),
    patientId,
    type: carePlanMission.type,
    title: carePlanMission.title,
    description: carePlanMission.description,
    status: MissionStatus.PENDING,
    dueDate: dueDate.toISOString(),
    metadata: {
      carePlanMissionId: carePlanMission.id,
      ...carePlanMission.metadata,
    },
  }));
}

/**
 * Singleton service object for mission generation.
 */
export const missionGenerationService = {
  generateMissionInstances,
  calculateDueDates,
};
