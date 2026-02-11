/**
 * MissionScheduleEditor - Form for configuring mission recurrence schedules
 *
 * Allows doctors to set:
 * - Start date
 * - Recurrence type (One-time, Daily, Weekly, Custom)
 * - Weekly day-of-week selection
 * - Custom interval (every N days)
 * - End condition (end date or number of occurrences)
 * - Optional time of day
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import { useState } from 'react';
import type { MissionSchedule, RecurrencePattern } from '../types';
import { RecurrenceType } from '../types';
import { Calendar, Clock, Repeat } from 'lucide-react';

interface MissionScheduleEditorProps {
  schedule: MissionSchedule;
  onChange: (schedule: MissionSchedule) => void;
}

type EndCondition = 'endDate' | 'occurrences';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: RecurrenceType.ONE_TIME, label: 'One-time' },
  { value: RecurrenceType.DAILY, label: 'Daily' },
  { value: RecurrenceType.WEEKLY, label: 'Weekly' },
  { value: RecurrenceType.CUSTOM, label: 'Custom' },
];

/**
 * Format a Date to YYYY-MM-DD string for date input values
 */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Derive initial end condition from the schedule state
 */
function deriveEndCondition(schedule: MissionSchedule): EndCondition {
  if (schedule.occurrences !== undefined) {
    return 'occurrences';
  }
  return 'endDate';
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent';

export function MissionScheduleEditor({ schedule, onChange }: MissionScheduleEditorProps) {
  const [endCondition, setEndCondition] = useState<EndCondition>(deriveEndCondition(schedule));

  /** Convenience updater that merges partial changes into the current schedule */
  function update(partial: Partial<MissionSchedule>) {
    onChange({ ...schedule, ...partial });
  }

  /** Update the recurrence pattern, merging partial changes */
  function updateRecurrence(partial: Partial<RecurrencePattern>) {
    const recurrence: RecurrencePattern = { ...schedule.recurrence, ...partial };

    // Clean up fields that don't apply to the new type
    if (recurrence.type !== RecurrenceType.WEEKLY) {
      delete recurrence.daysOfWeek;
    }
    if (recurrence.type !== RecurrenceType.CUSTOM) {
      delete recurrence.interval;
    }

    // Apply sensible defaults
    if (recurrence.type === RecurrenceType.WEEKLY && !recurrence.daysOfWeek) {
      recurrence.daysOfWeek = [];
    }
    if (recurrence.type === RecurrenceType.CUSTOM && recurrence.interval === undefined) {
      recurrence.interval = 2;
    }

    onChange({ ...schedule, recurrence });
  }

  /** Toggle a day in the weekly days-of-week array */
  function toggleDay(dayIndex: number) {
    const current = schedule.recurrence.daysOfWeek ?? [];
    const next = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex].sort((a, b) => a - b);
    updateRecurrence({ daysOfWeek: next });
  }

  /** Handle switching end condition between endDate and occurrences */
  function handleEndConditionChange(condition: EndCondition) {
    setEndCondition(condition);
    if (condition === 'endDate') {
      const updated = { ...schedule };
      delete updated.occurrences;
      onChange(updated);
    } else {
      const updated = { ...schedule, occurrences: schedule.occurrences ?? 10 };
      delete updated.endDate;
      onChange(updated);
    }
  }

  const isRecurring = schedule.recurrence.type !== RecurrenceType.ONE_TIME;

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <Repeat className="w-5 h-5 text-medical-primary" />
        <h4 className="text-sm font-semibold text-medical-text">Schedule Configuration</h4>
      </div>

      {/* Start date */}
      <div>
        <label htmlFor="schedule-start-date" className="block text-sm font-medium text-gray-600 mb-1">
          Start Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            id="schedule-start-date"
            type="date"
            className={`${inputClass} pl-9`}
            value={toDateInputValue(schedule.startDate)}
            onChange={(e) => {
              const date = new Date(e.target.value + 'T00:00:00');
              if (!isNaN(date.getTime())) {
                update({ startDate: date });
              }
            }}
          />
        </div>
      </div>

      {/* Recurrence type */}
      <div>
        <label htmlFor="schedule-recurrence" className="block text-sm font-medium text-gray-600 mb-1">
          Recurrence
        </label>
        <select
          id="schedule-recurrence"
          className={inputClass}
          value={schedule.recurrence.type}
          onChange={(e) => updateRecurrence({ type: e.target.value as RecurrenceType })}
        >
          {RECURRENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly: day-of-week checkboxes */}
      {schedule.recurrence.type === RecurrenceType.WEEKLY && (
        <div>
          <span className="block text-sm font-medium text-gray-600 mb-2">Days of Week</span>
          <div className="flex gap-2 flex-wrap">
            {DAY_LABELS.map((label, index) => {
              const isSelected = schedule.recurrence.daysOfWeek?.includes(index) ?? false;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-medical-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={label}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom: interval in days */}
      {schedule.recurrence.type === RecurrenceType.CUSTOM && (
        <div>
          <label htmlFor="schedule-interval" className="block text-sm font-medium text-gray-600 mb-1">
            Repeat Every (days)
          </label>
          <input
            id="schedule-interval"
            type="number"
            min={1}
            className={inputClass}
            value={schedule.recurrence.interval ?? 2}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) {
                updateRecurrence({ interval: val });
              }
            }}
          />
        </div>
      )}

      {/* End condition (only for recurring schedules) */}
      {isRecurring && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          <span className="block text-sm font-medium text-medical-text">End Condition</span>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="end-condition"
                value="endDate"
                checked={endCondition === 'endDate'}
                onChange={() => handleEndConditionChange('endDate')}
                className="text-medical-primary focus:ring-medical-primary"
              />
              End Date
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="end-condition"
                value="occurrences"
                checked={endCondition === 'occurrences'}
                onChange={() => handleEndConditionChange('occurrences')}
                className="text-medical-primary focus:ring-medical-primary"
              />
              Number of Occurrences
            </label>
          </div>

          {endCondition === 'endDate' && (
            <div>
              <label htmlFor="schedule-end-date" className="block text-sm font-medium text-gray-600 mb-1">
                End Date
              </label>
              <input
                id="schedule-end-date"
                type="date"
                className={inputClass}
                value={schedule.endDate ? toDateInputValue(schedule.endDate) : ''}
                min={toDateInputValue(schedule.startDate)}
                onChange={(e) => {
                  const date = new Date(e.target.value + 'T00:00:00');
                  if (!isNaN(date.getTime())) {
                    update({ endDate: date });
                  }
                }}
              />
            </div>
          )}

          {endCondition === 'occurrences' && (
            <div>
              <label htmlFor="schedule-occurrences" className="block text-sm font-medium text-gray-600 mb-1">
                Number of Occurrences
              </label>
              <input
                id="schedule-occurrences"
                type="number"
                min={1}
                className={inputClass}
                value={schedule.occurrences ?? 10}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) {
                    update({ occurrences: val });
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Time of day (optional) */}
      <div>
        <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-600 mb-1">
          Time of Day <span className="text-gray-400">(optional)</span>
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            id="schedule-time"
            type="time"
            className={`${inputClass} pl-9`}
            value={schedule.timeOfDay ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                update({ timeOfDay: val });
              } else {
                const updated = { ...schedule };
                delete updated.timeOfDay;
                onChange(updated);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
