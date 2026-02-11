/**
 * CarePlanForm - Complete form for creating or editing a care plan
 *
 * Orchestrates:
 * - Plan metadata (name, description)
 * - Template selection via TemplateSelector
 * - Mission list with inline add/edit via MissionScheduleEditor
 * - Medication list with inline add via MedicationForm
 * - Validation and submission
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1
 */

import { useState } from 'react';
import type {
  CarePlan,
  CreateCarePlanInput,
  CreateMissionInput,
  CreateMedicationInput,
  CarePlanTemplate,
  MissionSchedule,
  MissionType,
} from '../types';
import { MissionType as MissionTypeEnum, RecurrenceType } from '../types';
import { MissionScheduleEditor } from './MissionScheduleEditor';
import { MedicationForm } from './MedicationForm';
import { TemplateSelector } from './TemplateSelector';
import { Plus, Trash2, Pill, Calendar, FileText, Save, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface CarePlanFormProps {
  patientId: string;
  doctorId: string;
  templates: CarePlanTemplate[];
  onSave: (
    plan: CreateCarePlanInput,
    missions: CreateMissionInput[],
    medications: CreateMedicationInput[],
  ) => void;
  onCancel: () => void;
  existingPlan?: CarePlan;
}

/** Mission type options for the dropdown */
const MISSION_TYPE_OPTIONS: { value: MissionType; label: string }[] = [
  { value: MissionTypeEnum.PHOTO_UPLOAD, label: 'Photo Upload' },
  { value: MissionTypeEnum.MEDICATION_CHECK, label: 'Medication Check' },
  { value: MissionTypeEnum.EXERCISE_LOG, label: 'Exercise Log' },
];

/** Build a default MissionSchedule */
function defaultSchedule(): MissionSchedule {
  return {
    startDate: new Date(),
    recurrence: { type: RecurrenceType.DAILY },
  };
}

/** Inline mission being edited/added */
interface MissionDraft {
  type: MissionType;
  title: string;
  description: string;
  schedule: MissionSchedule;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent';

/** Produce a human-readable schedule summary */
function scheduleSummary(schedule: MissionSchedule): string {
  const parts: string[] = [];
  switch (schedule.recurrence.type) {
    case RecurrenceType.ONE_TIME:
      parts.push('One-time');
      break;
    case RecurrenceType.DAILY:
      parts.push('Daily');
      break;
    case RecurrenceType.WEEKLY: {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = (schedule.recurrence.daysOfWeek ?? []).map((d) => dayNames[d]).join(', ');
      parts.push(`Weekly (${days || 'no days'})`);
      break;
    }
    case RecurrenceType.CUSTOM:
      parts.push(`Every ${schedule.recurrence.interval ?? 2} days`);
      break;
  }
  if (schedule.timeOfDay) {
    parts.push(`at ${schedule.timeOfDay}`);
  }
  return parts.join(' ');
}

/** Readable mission type label */
function missionTypeLabel(type: MissionType): string {
  return MISSION_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? type;
}

export function CarePlanForm({
  patientId,
  doctorId,
  templates,
  onSave,
  onCancel,
  existingPlan,
}: CarePlanFormProps) {
  // Plan metadata
  const [planName, setPlanName] = useState(existingPlan?.name ?? '');
  const [planDescription, setPlanDescription] = useState(existingPlan?.description ?? '');

  // Missions and medications lists
  const [missions, setMissions] = useState<CreateMissionInput[]>(() => {
    if (!existingPlan) return [];
    return existingPlan.missions.map((m) => ({
      type: m.type,
      title: m.title,
      description: m.description,
      schedule: m.schedule,
      metadata: m.metadata,
    }));
  });
  const [medications, setMedications] = useState<CreateMedicationInput[]>(() => {
    if (!existingPlan) return [];
    return existingPlan.medications.map((m) => ({
      medicationName: m.medicationName,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      refillThreshold: m.refillThreshold,
      instructions: m.instructions,
      startDate: m.startDate,
    }));
  });

  // UI state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAddMission, setShowAddMission] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Mission draft state
  const [missionDraft, setMissionDraft] = useState<MissionDraft>({
    type: MissionTypeEnum.PHOTO_UPLOAD,
    title: '',
    description: '',
    schedule: defaultSchedule(),
  });

  // Collapsible sections
  const [missionsExpanded, setMissionsExpanded] = useState(true);
  const [medicationsExpanded, setMedicationsExpanded] = useState(true);

  // ---------- Template handling ----------

  function handleTemplateSelect(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Convert template missions to CreateMissionInput
    const templateMissions: CreateMissionInput[] = template.missions.map((m) => ({
      type: m.type,
      title: m.title,
      description: m.description,
      schedule: {
        startDate: new Date(Date.now() + m.schedule.startDayOffset * 86400000),
        recurrence: m.schedule.recurrence,
        ...(m.schedule.durationDays
          ? { endDate: new Date(Date.now() + (m.schedule.startDayOffset + m.schedule.durationDays) * 86400000) }
          : {}),
      },
    }));

    // Convert template medications to CreateMedicationInput
    const templateMedications: CreateMedicationInput[] = template.medications.map((m) => ({
      medicationName: m.medicationName,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.durationDays,
      refillThreshold: m.refillThreshold,
      instructions: m.instructions,
      startDate: new Date(),
    }));

    setMissions(templateMissions);
    setMedications(templateMedications);

    // Pre-fill name/description if empty
    if (!planName.trim()) setPlanName(template.name);
    if (!planDescription.trim()) setPlanDescription(template.description);

    setShowTemplateSelector(false);
  }

  // ---------- Mission CRUD ----------

  function handleSaveMissionDraft() {
    if (!missionDraft.title.trim()) return;
    setMissions((prev) => [
      ...prev,
      {
        type: missionDraft.type,
        title: missionDraft.title.trim(),
        description: missionDraft.description.trim(),
        schedule: missionDraft.schedule,
      },
    ]);
    setMissionDraft({
      type: MissionTypeEnum.PHOTO_UPLOAD,
      title: '',
      description: '',
      schedule: defaultSchedule(),
    });
    setShowAddMission(false);
  }

  function handleDeleteMission(index: number) {
    setMissions((prev) => prev.filter((_, i) => i !== index));
  }

  // ---------- Medication CRUD ----------

  function handleSaveMedication(medication: CreateMedicationInput) {
    setMedications((prev) => [...prev, medication]);
    setShowAddMedication(false);
  }

  function handleDeleteMedication(index: number) {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  // ---------- Form submission ----------

  function validate(): boolean {
    const errs: string[] = [];
    if (!planName.trim()) {
      errs.push('Plan name is required');
    }
    if (missions.length === 0 && medications.length === 0) {
      errs.push('At least one mission or medication is required');
    }
    setValidationErrors(errs);
    return errs.length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const planInput: CreateCarePlanInput = {
      patientId,
      doctorId,
      name: planName.trim(),
      description: planDescription.trim(),
    };

    onSave(planInput, missions, medications);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---- Validation errors ---- */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-800 mb-1">Please fix the following:</h4>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ---- Plan metadata card ---- */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-medical-primary" />
          <h2 className="text-lg font-semibold text-medical-text">
            {existingPlan ? 'Edit Care Plan' : 'New Care Plan'}
          </h2>
        </div>

        <div className="space-y-4">
          {/* Plan name */}
          <div>
            <label htmlFor="plan-name" className="block text-sm font-medium text-gray-600 mb-1">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <input
              id="plan-name"
              type="text"
              className={inputClass}
              placeholder="e.g., Post-Op Knee Replacement Recovery"
              value={planName}
              onChange={(e) => {
                setPlanName(e.target.value);
                if (validationErrors.length) setValidationErrors([]);
              }}
            />
          </div>

          {/* Plan description */}
          <div>
            <label htmlFor="plan-desc" className="block text-sm font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              id="plan-desc"
              rows={3}
              className={inputClass}
              placeholder="Brief description of the care plan goals..."
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
            />
          </div>

          {/* Use Template button */}
          {!showTemplateSelector && templates.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTemplateSelector(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-medical-primary bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Use Template
            </button>
          )}
        </div>
      </div>

      {/* ---- Template selector (conditionally shown) ---- */}
      {showTemplateSelector && (
        <TemplateSelector
          templates={templates}
          onSelect={handleTemplateSelect}
          onCancel={() => setShowTemplateSelector(false)}
        />
      )}

      {/* ---- Missions section ---- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Section header */}
        <button
          type="button"
          onClick={() => setMissionsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-medical-primary" />
            <h3 className="text-base font-semibold text-medical-text">
              Missions <span className="text-sm font-normal text-gray-400">({missions.length})</span>
            </h3>
          </div>
          {missionsExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {missionsExpanded && (
          <div className="px-6 pb-6 space-y-3">
            {/* Existing missions list */}
            {missions.length === 0 && !showAddMission && (
              <p className="text-sm text-gray-400 py-2">No missions added yet.</p>
            )}

            {missions.map((mission, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <Calendar className="w-4 h-4 text-medical-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-medical-text truncate">{mission.title}</span>
                    <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded capitalize whitespace-nowrap">
                      {missionTypeLabel(mission.type)}
                    </span>
                  </div>
                  {mission.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{mission.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{scheduleSummary(mission.schedule)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMission(index)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label={`Delete mission: ${mission.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Inline add mission form */}
            {showAddMission && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-5 space-y-4">
                <h4 className="text-sm font-semibold text-medical-text">Add Mission</h4>

                {/* Mission type */}
                <div>
                  <label htmlFor="mission-type" className="block text-sm font-medium text-gray-600 mb-1">
                    Mission Type
                  </label>
                  <select
                    id="mission-type"
                    className={inputClass}
                    value={missionDraft.type}
                    onChange={(e) =>
                      setMissionDraft((prev) => ({ ...prev, type: e.target.value as MissionType }))
                    }
                  >
                    {MISSION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="mission-title" className="block text-sm font-medium text-gray-600 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mission-title"
                    type="text"
                    className={inputClass}
                    placeholder="e.g., Daily Wound Photo"
                    value={missionDraft.title}
                    onChange={(e) => setMissionDraft((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="mission-description" className="block text-sm font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    id="mission-description"
                    rows={2}
                    className={inputClass}
                    placeholder="Instructions for the patient..."
                    value={missionDraft.description}
                    onChange={(e) => setMissionDraft((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Schedule editor */}
                <MissionScheduleEditor
                  schedule={missionDraft.schedule}
                  onChange={(schedule) => setMissionDraft((prev) => ({ ...prev, schedule }))}
                />

                {/* Save / Cancel */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveMissionDraft}
                    disabled={!missionDraft.title.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-medical-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Mission
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMission(false)}
                    className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add Mission button */}
            {!showAddMission && (
              <button
                type="button"
                onClick={() => setShowAddMission(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-medical-primary bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Mission
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---- Medications section ---- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Section header */}
        <button
          type="button"
          onClick={() => setMedicationsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-medical-primary" />
            <h3 className="text-base font-semibold text-medical-text">
              Medications <span className="text-sm font-normal text-gray-400">({medications.length})</span>
            </h3>
          </div>
          {medicationsExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {medicationsExpanded && (
          <div className="px-6 pb-6 space-y-3">
            {/* Existing medications list */}
            {medications.length === 0 && !showAddMedication && (
              <p className="text-sm text-gray-400 py-2">No medications added yet.</p>
            )}

            {medications.map((med, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <Pill className="w-4 h-4 text-medical-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-medical-text truncate">
                    {med.medicationName} &mdash; {med.dosage}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {med.frequency.timesPerDay}x daily
                    {med.duration ? ` for ${med.duration} days` : ' (ongoing)'}
                    {med.instructions ? ` | ${med.instructions}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMedication(index)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label={`Delete medication: ${med.medicationName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Inline add medication form */}
            {showAddMedication && (
              <MedicationForm
                onSave={handleSaveMedication}
                onCancel={() => setShowAddMedication(false)}
              />
            )}

            {/* Add Medication button */}
            {!showAddMedication && (
              <button
                type="button"
                onClick={() => setShowAddMedication(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-medical-primary bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---- Form actions ---- */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-medical-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          {existingPlan ? 'Update Care Plan' : 'Save Care Plan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-600 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>
    </form>
  );
}
