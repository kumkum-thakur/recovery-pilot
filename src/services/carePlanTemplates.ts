/**
 * CarePlanTemplates - Default care plan templates for common recovery scenarios.
 *
 * Provides pre-configured templates that doctors can apply to quickly set up
 * care plans with appropriate missions and medications for common procedures.
 *
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

import type { CarePlanTemplate } from '../types';
import { MissionType, RecurrenceType } from '../types';

/**
 * Default care plan templates shipped with the application.
 *
 * Each template includes missions (photo uploads, exercises, follow-ups) and
 * medications with dosage and frequency information tailored to the procedure type.
 */
export const DEFAULT_TEMPLATES: CarePlanTemplate[] = [
  // =========================================================================
  // Template 1: Knee Replacement Recovery
  // =========================================================================
  {
    id: 'template-knee-replacement',
    name: 'Knee Replacement Recovery',
    description:
      'Comprehensive recovery plan for total or partial knee replacement surgery, including wound monitoring, physical therapy, and pain management.',
    category: 'Post-Surgery',
    missions: [
      {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Daily wound photo upload',
        description:
          'Take a clear photo of the surgical site to monitor healing progress. Ensure good lighting and include the full incision area.',
        schedule: {
          startDayOffset: 0,
          recurrence: { type: RecurrenceType.DAILY },
          durationDays: 14,
        },
      },
      {
        type: MissionType.EXERCISE_LOG,
        title: 'Physical therapy exercises',
        description:
          'Complete prescribed physical therapy exercises including quad sets, straight leg raises, and range of motion exercises. Log completion and any pain levels.',
        schedule: {
          startDayOffset: 0,
          recurrence: { type: RecurrenceType.DAILY },
          durationDays: 30,
        },
      },
      {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Follow-up appointment reminder',
        description:
          'Reminder for your 2-week post-operative follow-up appointment. Prepare questions and bring your exercise log.',
        schedule: {
          startDayOffset: 14,
          recurrence: { type: RecurrenceType.ONE_TIME },
        },
      },
    ],
    medications: [
      {
        medicationName: 'Ibuprofen',
        dosage: '400mg',
        frequency: { timesPerDay: 3, times: ['08:00', '14:00', '20:00'] },
        durationDays: 7,
        refillThreshold: 5,
        instructions: 'Take with food to minimize stomach irritation.',
      },
      {
        medicationName: 'Cephalexin',
        dosage: '500mg',
        frequency: { timesPerDay: 2, times: ['08:00', '20:00'] },
        durationDays: 10,
        refillThreshold: 3,
        instructions: 'Complete the full course of antibiotics even if feeling better.',
      },
    ],
  },

  // =========================================================================
  // Template 2: Appendectomy Recovery
  // =========================================================================
  {
    id: 'template-appendectomy',
    name: 'Appendectomy Recovery',
    description:
      'Recovery plan for laparoscopic or open appendectomy, covering wound care, activity monitoring, and antibiotic management.',
    category: 'Post-Surgery',
    missions: [
      {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Daily wound photo upload',
        description:
          'Take a clear photo of each incision site. Watch for signs of redness, swelling, or discharge.',
        schedule: {
          startDayOffset: 0,
          recurrence: { type: RecurrenceType.DAILY },
          durationDays: 7,
        },
      },
      {
        type: MissionType.EXERCISE_LOG,
        title: 'Activity log',
        description:
          'Log your daily activity level and any pain or discomfort. Note if you are able to walk, climb stairs, and perform light tasks.',
        schedule: {
          startDayOffset: 0,
          recurrence: { type: RecurrenceType.DAILY },
          durationDays: 14,
        },
      },
      {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Follow-up appointment reminder',
        description:
          'Reminder for your 1-week post-operative follow-up appointment to check incision healing and remove any stitches.',
        schedule: {
          startDayOffset: 7,
          recurrence: { type: RecurrenceType.ONE_TIME },
        },
      },
    ],
    medications: [
      {
        medicationName: 'Amoxicillin',
        dosage: '500mg',
        frequency: { timesPerDay: 2, times: ['08:00', '20:00'] },
        durationDays: 10,
        refillThreshold: 3,
        instructions: 'Take with or without food. Complete the full course.',
      },
    ],
  },

  // =========================================================================
  // Template 3: General Wound Care
  // =========================================================================
  {
    id: 'template-wound-care',
    name: 'General Wound Care',
    description:
      'Standard wound care plan for lacerations, minor surgical wounds, or burns. Includes wound monitoring, cleaning reminders, and pain management.',
    category: 'Wound Care',
    missions: [
      {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Daily wound photo upload',
        description:
          'Photograph the wound area daily to track healing. Ensure the photo clearly shows wound edges and surrounding skin.',
        schedule: {
          startDayOffset: 0,
          recurrence: { type: RecurrenceType.DAILY },
          durationDays: 10,
        },
      },
      {
        type: MissionType.EXERCISE_LOG,
        title: 'Wound cleaning reminder',
        description:
          'Clean the wound gently with saline solution or as directed. Apply fresh dressing and log completion.',
        schedule: {
          startDayOffset: 0,
          recurrence: { type: RecurrenceType.DAILY },
          durationDays: 10,
        },
      },
      {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Follow-up appointment reminder',
        description:
          'Reminder for your follow-up appointment to assess wound healing and determine if further treatment is needed.',
        schedule: {
          startDayOffset: 10,
          recurrence: { type: RecurrenceType.ONE_TIME },
        },
      },
    ],
    medications: [
      {
        medicationName: 'Acetaminophen',
        dosage: '500mg',
        frequency: { timesPerDay: 2, times: ['08:00', '20:00'] },
        durationDays: 5,
        refillThreshold: 3,
        instructions: 'Take as needed for pain. Do not exceed 4g per day from all sources.',
      },
    ],
  },
];

/**
 * Retrieves a care plan template by its unique identifier.
 *
 * @param id - The template ID to look up
 * @returns The matching CarePlanTemplate, or undefined if not found
 */
export function getTemplateById(id: string): CarePlanTemplate | undefined {
  return DEFAULT_TEMPLATES.find((template) => template.id === id);
}
