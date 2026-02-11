/**
 * MedicationForm - Form for creating/editing medication prescriptions
 *
 * Captures:
 * - Medication name, dosage, frequency (times per day + specific times)
 * - Duration in days (optional, ongoing if blank)
 * - Refill threshold, instructions, start date
 *
 * Requirements: 3.1, 3.2, 3.3
 */

import { useState } from 'react';
import type { CreateMedicationInput, MedicationFrequency } from '../types';
import { Pill, Clock, Save, X } from 'lucide-react';

interface MedicationFormProps {
  onSave: (medication: CreateMedicationInput) => void;
  onCancel: () => void;
  initialData?: Partial<CreateMedicationInput>;
}

interface FormErrors {
  medicationName?: string;
  dosage?: string;
  timesPerDay?: string;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent';

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
 * Generate default time slots evenly spaced throughout waking hours (07:00 - 22:00)
 */
function generateDefaultTimes(count: number): string[] {
  if (count <= 1) return ['08:00'];
  const startHour = 7;
  const endHour = 22;
  const step = (endHour - startHour) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const hour = Math.round(startHour + step * i);
    return `${String(hour).padStart(2, '0')}:00`;
  });
}

export function MedicationForm({ onSave, onCancel, initialData }: MedicationFormProps) {
  const [medicationName, setMedicationName] = useState(initialData?.medicationName ?? '');
  const [dosage, setDosage] = useState(initialData?.dosage ?? '');
  const [timesPerDay, setTimesPerDay] = useState(initialData?.frequency?.timesPerDay ?? 1);
  const [specificTimes, setSpecificTimes] = useState<string[]>(
    initialData?.frequency?.times ?? generateDefaultTimes(initialData?.frequency?.timesPerDay ?? 1),
  );
  const [duration, setDuration] = useState<string>(
    initialData?.duration !== undefined ? String(initialData.duration) : '',
  );
  const [refillThreshold, setRefillThreshold] = useState(initialData?.refillThreshold ?? 3);
  const [instructions, setInstructions] = useState(initialData?.instructions ?? '');
  const [startDate, setStartDate] = useState<Date>(initialData?.startDate ?? new Date());
  const [errors, setErrors] = useState<FormErrors>({});

  /** Validate the form and return true if valid */
  function validate(): boolean {
    const next: FormErrors = {};
    if (!medicationName.trim()) {
      next.medicationName = 'Medication name is required';
    }
    if (!dosage.trim()) {
      next.dosage = 'Dosage is required';
    }
    if (timesPerDay < 1) {
      next.timesPerDay = 'Must be at least 1 time per day';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /** Handle times per day changes, auto-generating time slots */
  function handleTimesPerDayChange(value: number) {
    const clamped = Math.max(1, Math.min(6, value));
    setTimesPerDay(clamped);
    setSpecificTimes(generateDefaultTimes(clamped));
  }

  /** Update a specific time slot */
  function updateTime(index: number, value: string) {
    setSpecificTimes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  /** Submit the form */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const frequency: MedicationFrequency = {
      timesPerDay,
      ...(timesPerDay > 1 ? { times: specificTimes } : {}),
    };

    const medication: CreateMedicationInput = {
      medicationName: medicationName.trim(),
      dosage: dosage.trim(),
      frequency,
      refillThreshold,
      startDate,
      ...(duration !== '' ? { duration: parseInt(duration, 10) } : {}),
      ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
    };

    onSave(medication);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Pill className="w-5 h-5 text-medical-primary" />
        <h3 className="text-base font-semibold text-medical-text">Medication Details</h3>
      </div>

      {/* Medication name */}
      <div>
        <label htmlFor="med-name" className="block text-sm font-medium text-gray-600 mb-1">
          Medication Name <span className="text-red-500">*</span>
        </label>
        <input
          id="med-name"
          type="text"
          className={`${inputClass} ${errors.medicationName ? 'border-red-400 focus:ring-red-400' : ''}`}
          placeholder="e.g., Amoxicillin"
          value={medicationName}
          onChange={(e) => {
            setMedicationName(e.target.value);
            if (errors.medicationName) setErrors((prev) => ({ ...prev, medicationName: undefined }));
          }}
        />
        {errors.medicationName && (
          <p className="mt-1 text-xs text-red-500">{errors.medicationName}</p>
        )}
      </div>

      {/* Dosage */}
      <div>
        <label htmlFor="med-dosage" className="block text-sm font-medium text-gray-600 mb-1">
          Dosage <span className="text-red-500">*</span>
        </label>
        <input
          id="med-dosage"
          type="text"
          className={`${inputClass} ${errors.dosage ? 'border-red-400 focus:ring-red-400' : ''}`}
          placeholder="e.g., 500mg"
          value={dosage}
          onChange={(e) => {
            setDosage(e.target.value);
            if (errors.dosage) setErrors((prev) => ({ ...prev, dosage: undefined }));
          }}
        />
        {errors.dosage && <p className="mt-1 text-xs text-red-500">{errors.dosage}</p>}
      </div>

      {/* Frequency: times per day */}
      <div>
        <label htmlFor="med-frequency" className="block text-sm font-medium text-gray-600 mb-1">
          Times Per Day
        </label>
        <input
          id="med-frequency"
          type="number"
          min={1}
          max={6}
          className={`${inputClass} ${errors.timesPerDay ? 'border-red-400 focus:ring-red-400' : ''}`}
          value={timesPerDay}
          onChange={(e) => handleTimesPerDayChange(parseInt(e.target.value, 10) || 1)}
        />
        {errors.timesPerDay && <p className="mt-1 text-xs text-red-500">{errors.timesPerDay}</p>}
      </div>

      {/* Specific times (shown when timesPerDay > 1) */}
      {timesPerDay > 1 && (
        <div>
          <span className="block text-sm font-medium text-gray-600 mb-2">
            <Clock className="inline w-4 h-4 mr-1 -mt-0.5 text-gray-400" />
            Specific Times
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {specificTimes.map((time, index) => (
              <div key={index}>
                <label htmlFor={`med-time-${index}`} className="block text-xs text-gray-500 mb-1">
                  Dose {index + 1}
                </label>
                <input
                  id={`med-time-${index}`}
                  type="time"
                  className={inputClass}
                  value={time}
                  onChange={(e) => updateTime(index, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duration */}
      <div>
        <label htmlFor="med-duration" className="block text-sm font-medium text-gray-600 mb-1">
          Duration (days) <span className="text-gray-400 font-normal">- leave blank for ongoing</span>
        </label>
        <input
          id="med-duration"
          type="number"
          min={1}
          className={inputClass}
          placeholder="Ongoing"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      {/* Refill threshold */}
      <div>
        <label htmlFor="med-refill" className="block text-sm font-medium text-gray-600 mb-1">
          Refill Threshold (tablets remaining)
        </label>
        <input
          id="med-refill"
          type="number"
          min={0}
          className={inputClass}
          value={refillThreshold}
          onChange={(e) => setRefillThreshold(parseInt(e.target.value, 10) || 0)}
        />
        <p className="mt-1 text-xs text-gray-400">
          Auto-refill will trigger when this many tablets remain
        </p>
      </div>

      {/* Instructions */}
      <div>
        <label htmlFor="med-instructions" className="block text-sm font-medium text-gray-600 mb-1">
          Instructions <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="med-instructions"
          rows={3}
          className={inputClass}
          placeholder="e.g., Take with food, avoid alcohol"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      {/* Start date */}
      <div>
        <label htmlFor="med-start-date" className="block text-sm font-medium text-gray-600 mb-1">
          Start Date
        </label>
        <input
          id="med-start-date"
          type="date"
          className={inputClass}
          value={toDateInputValue(startDate)}
          onChange={(e) => {
            const date = new Date(e.target.value + 'T00:00:00');
            if (!isNaN(date.getTime())) {
              setStartDate(date);
            }
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 bg-medical-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Medication
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
