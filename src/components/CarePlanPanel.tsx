/**
 * CarePlanPanel - Main panel component for doctor care plan management
 *
 * Provides a multi-view interface for managing patient care plans:
 * 1. Overview Mode - Shows CarePlanOverviewDashboard with patient summary grid
 * 2. Patient Mode - Shows care plans for a selected patient with search/filter
 * 3. Detail Mode - Shows full care plan details with missions and medications
 * 4. Create/Edit Mode - Shows CarePlanForm for creating or editing care plans
 *
 * Requirements: 1.2, 1.3, 1.4, 14.1, 14.2
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  FileText,
  Pill,
  Calendar,
  Archive,
  Edit,
  User,
  Activity,
  Clock,
  AlertCircle,
  X,
  Camera,
  Loader2,
} from 'lucide-react';
import { CarePlanOverviewDashboard } from './CarePlanOverviewDashboard';
import { useCarePlanStore } from '../stores/carePlanStore';
import { userManagementService } from '../services/userManagementService';
import type {
  UserModel,
  CarePlan,
  CarePlanMission,
  MedicationPrescription,
  CreateCarePlanInput,
  CreateMissionInput,
  CreateMedicationInput,
  MissionSchedule,
  MedicationFrequency,
} from '../types';
import {
  CarePlanStatus,
  CarePlanMissionStatus,
  MedicationStatus,
  MissionType,
  RecurrenceType,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface CarePlanPanelProps {
  doctorId: string;
}

type ViewMode = 'overview' | 'patient' | 'detail' | 'create' | 'edit';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Returns a human-readable label for a care plan status
 */
function getStatusLabel(status: CarePlanStatus): string {
  switch (status) {
    case CarePlanStatus.ACTIVE:
      return 'Active';
    case CarePlanStatus.ARCHIVED:
      return 'Archived';
    case CarePlanStatus.COMPLETED:
      return 'Completed';
    default:
      return status;
  }
}

/**
 * Returns Tailwind classes for a care plan status badge
 */
function getStatusBadgeClasses(status: CarePlanStatus): string {
  switch (status) {
    case CarePlanStatus.ACTIVE:
      return 'bg-blue-50 text-medical-primary border-blue-200';
    case CarePlanStatus.ARCHIVED:
      return 'bg-gray-100 text-gray-600 border-gray-300';
    case CarePlanStatus.COMPLETED:
      return 'bg-gamification-success/10 text-gamification-success border-gamification-success/20';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

/**
 * Returns the icon component for a mission type
 */
function getMissionTypeIcon(type: MissionType) {
  switch (type) {
    case MissionType.PHOTO_UPLOAD:
      return Camera;
    case MissionType.MEDICATION_CHECK:
      return Pill;
    case MissionType.EXERCISE_LOG:
      return Activity;
    default:
      return FileText;
  }
}

/**
 * Returns a human-readable recurrence summary
 */
function getScheduleSummary(schedule: MissionSchedule): string {
  const start = schedule.startDate.toLocaleDateString();
  const recurrence = schedule.recurrence;

  switch (recurrence.type) {
    case RecurrenceType.ONE_TIME:
      return `One-time on ${start}`;
    case RecurrenceType.DAILY:
      return `Daily starting ${start}`;
    case RecurrenceType.WEEKLY: {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = recurrence.daysOfWeek?.map((d) => dayNames[d]).join(', ') || '';
      return `Weekly (${days}) starting ${start}`;
    }
    case RecurrenceType.CUSTOM:
      return `Every ${recurrence.interval || 1} days starting ${start}`;
    default:
      return `Starting ${start}`;
  }
}

/**
 * Returns a human-readable frequency summary for medication
 */
function getFrequencySummary(frequency: MedicationFrequency): string {
  if (frequency.timesPerDay === 1) {
    return 'Once daily';
  }
  if (frequency.timesPerDay === 2) {
    return 'Twice daily';
  }
  return `${frequency.timesPerDay}x daily`;
}

/**
 * Returns a human-readable label for medication status
 */
function getMedicationStatusLabel(status: MedicationStatus): string {
  switch (status) {
    case MedicationStatus.ACTIVE:
      return 'Active';
    case MedicationStatus.COMPLETED:
      return 'Completed';
    case MedicationStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Returns Tailwind classes for a medication status badge
 */
function getMedicationStatusClasses(status: MedicationStatus): string {
  switch (status) {
    case MedicationStatus.ACTIVE:
      return 'bg-blue-50 text-medical-primary border-blue-200';
    case MedicationStatus.COMPLETED:
      return 'bg-gamification-success/10 text-gamification-success border-gamification-success/20';
    case MedicationStatus.CANCELLED:
      return 'bg-gray-100 text-gray-600 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

/**
 * Returns a human-readable label for care plan mission status
 */
function getMissionStatusLabel(status: CarePlanMissionStatus): string {
  switch (status) {
    case CarePlanMissionStatus.ACTIVE:
      return 'Active';
    case CarePlanMissionStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Returns Tailwind classes for a care plan mission status badge
 */
function getMissionStatusClasses(status: CarePlanMissionStatus): string {
  switch (status) {
    case CarePlanMissionStatus.ACTIVE:
      return 'bg-blue-50 text-medical-primary border-blue-200';
    case CarePlanMissionStatus.CANCELLED:
      return 'bg-gray-100 text-gray-600 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

// ============================================================================
// Inline Create/Edit Form Sub-Component
// ============================================================================

interface CarePlanFormData {
  name: string;
  description: string;
  missions: CreateMissionInput[];
  medications: CreateMedicationInput[];
}

interface InlineCarePlanFormProps {
  patientId: string;
  doctorId: string;
  initialData?: CarePlan;
  onSave: (data: CarePlanFormData) => void;
  onCancel: () => void;
}

/**
 * InlineCarePlanForm - Form for creating or editing care plans
 * Embedded within CarePlanPanel for create/edit modes
 */
function InlineCarePlanForm({
  patientId,
  doctorId: _doctorId,
  initialData,
  onSave,
  onCancel,
}: InlineCarePlanFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(
    initialData?.description || ''
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { templates, fetchTemplates } = useCarePlanStore();

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Care plan name is required.');
    }
    if (!description.trim()) {
      errors.push('Care plan description is required.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    onSave({
      name: name.trim(),
      description: description.trim(),
      missions: [],
      medications: [],
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setName(template.name);
    setDescription(template.description);
  };

  const isEditing = initialData !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-medical-text mb-6">
        {isEditing ? 'Edit Care Plan' : 'Create New Care Plan'}
      </h3>

      {/* Template selector (only for create mode) */}
      {!isEditing && templates.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-medical-text mb-2">
            Start from Template (Optional)
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleApplyTemplate(e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-medical-text focus:outline-none focus:ring-2 focus:ring-medical-primary/50 focus:border-medical-primary"
            defaultValue=""
          >
            <option value="">Select a template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ul className="text-sm text-red-600 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient info (read-only) */}
        <div>
          <label className="block text-sm font-medium text-medical-text mb-1">
            Patient ID
          </label>
          <input
            type="text"
            value={patientId}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        {/* Care plan name */}
        <div>
          <label className="block text-sm font-medium text-medical-text mb-1">
            Care Plan Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Post-Surgery Recovery Plan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-medical-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-primary/50 focus:border-medical-primary"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-medical-text mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the care plan goals and instructions..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-medical-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-primary/50 focus:border-medical-primary resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-medical-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            {isEditing ? 'Save Changes' : 'Create Care Plan'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Main CarePlanPanel Component
// ============================================================================

/**
 * CarePlanPanel provides the complete care plan management interface for doctors.
 * It orchestrates navigation between overview, patient, detail, and form views.
 */
export function CarePlanPanel({ doctorId }: CarePlanPanelProps) {
  // Store state
  const {
    carePlans,
    selectedCarePlan,
    isLoading,
    error,
    fetchCarePlansForPatient,
    selectCarePlan,
    createCarePlan,
    updateCarePlan,
    archiveCarePlan,
    addMission,
    addMedication,
    clearError,
  } = useCarePlanStore();

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get patients assigned to this doctor for name lookup
  const patients = useMemo<UserModel[]>(() => {
    return userManagementService.getPatientsForDoctor(doctorId);
  }, [doctorId]);

  /**
   * Gets a patient's display name by ID
   */
  const getPatientName = useCallback(
    (patientId: string): string => {
      const patient = patients.find((p) => p.id === patientId);
      return patient?.name || 'Unknown Patient';
    },
    [patients]
  );

  // Fetch care plans when a patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      fetchCarePlansForPatient(selectedPatientId);
    }
  }, [selectedPatientId, fetchCarePlansForPatient]);

  // Filter care plans based on search query
  const filteredCarePlans = useMemo<CarePlan[]>(() => {
    if (!searchQuery.trim()) return carePlans;
    const query = searchQuery.toLowerCase();
    return carePlans.filter(
      (cp) =>
        cp.name.toLowerCase().includes(query) ||
        cp.description.toLowerCase().includes(query)
    );
  }, [carePlans, searchQuery]);

  // ============================================================================
  // Navigation Handlers
  // ============================================================================

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setViewMode('patient');
    setSearchQuery('');
    selectCarePlan(null);
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedPatientId(null);
    setSearchQuery('');
    selectCarePlan(null);
  };

  const handleBackToPatient = () => {
    setViewMode('patient');
    selectCarePlan(null);
  };

  const handleSelectCarePlan = (carePlanId: string) => {
    selectCarePlan(carePlanId);
    setViewMode('detail');
  };

  const handleCreateNew = () => {
    selectCarePlan(null);
    setViewMode('create');
  };

  const handleEditCarePlan = () => {
    setViewMode('edit');
  };

  const handleArchiveCarePlan = () => {
    if (!selectedCarePlan) return;

    const confirmed = window.confirm(
      `Are you sure you want to archive "${selectedCarePlan.name}"? This action can be reversed later.`
    );
    if (!confirmed) return;

    archiveCarePlan(selectedCarePlan.id);
    handleBackToPatient();
  };

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const handleCreateSave = (formData: CarePlanFormData) => {
    if (!selectedPatientId) return;

    const input: CreateCarePlanInput = {
      patientId: selectedPatientId,
      doctorId,
      name: formData.name,
      description: formData.description,
    };

    const newCarePlan = createCarePlan(input);

    // Add missions if any
    for (const mission of formData.missions) {
      addMission(newCarePlan.id, mission);
    }

    // Add medications if any
    for (const medication of formData.medications) {
      addMedication(newCarePlan.id, medication);
    }

    // Navigate to the detail view of the new plan
    selectCarePlan(newCarePlan.id);
    setViewMode('detail');
  };

  const handleEditSave = (formData: CarePlanFormData) => {
    if (!selectedCarePlan) return;

    updateCarePlan(selectedCarePlan.id, {
      name: formData.name,
      description: formData.description,
    });

    // Refresh selection and go to detail view
    selectCarePlan(selectedCarePlan.id);
    setViewMode('detail');
  };

  const handleFormCancel = () => {
    if (viewMode === 'create') {
      setViewMode('patient');
    } else if (viewMode === 'edit') {
      setViewMode('detail');
    }
  };

  // ============================================================================
  // Render: Error Banner
  // ============================================================================

  const renderErrorBanner = () => {
    if (!error) return null;

    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <button
          onClick={clearError}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4 text-red-600" />
        </button>
      </div>
    );
  };

  // ============================================================================
  // Render: Overview Mode
  // ============================================================================

  if (viewMode === 'overview') {
    return (
      <div className="space-y-4">
        {renderErrorBanner()}
        <CarePlanOverviewDashboard
          doctorId={doctorId}
          onPatientSelect={handlePatientSelect}
        />
      </div>
    );
  }

  // ============================================================================
  // Render: Create Mode
  // ============================================================================

  if (viewMode === 'create' && selectedPatientId) {
    return (
      <div className="space-y-4">
        {renderErrorBanner()}

        {/* Back navigation */}
        <button
          onClick={handleFormCancel}
          className="flex items-center gap-2 text-medical-primary hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {getPatientName(selectedPatientId)}'s Plans</span>
        </button>

        <InlineCarePlanForm
          patientId={selectedPatientId}
          doctorId={doctorId}
          onSave={handleCreateSave}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  // ============================================================================
  // Render: Edit Mode
  // ============================================================================

  if (viewMode === 'edit' && selectedCarePlan && selectedPatientId) {
    return (
      <div className="space-y-4">
        {renderErrorBanner()}

        {/* Back navigation */}
        <button
          onClick={handleFormCancel}
          className="flex items-center gap-2 text-medical-primary hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {selectedCarePlan.name}</span>
        </button>

        <InlineCarePlanForm
          patientId={selectedPatientId}
          doctorId={doctorId}
          initialData={selectedCarePlan}
          onSave={handleEditSave}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  // ============================================================================
  // Render: Detail Mode
  // ============================================================================

  if (viewMode === 'detail' && selectedCarePlan && selectedPatientId) {
    return (
      <div className="space-y-4">
        {renderErrorBanner()}

        {/* Back navigation */}
        <button
          onClick={handleBackToPatient}
          className="flex items-center gap-2 text-medical-primary hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {getPatientName(selectedPatientId)}'s Plans</span>
        </button>

        {/* Care plan header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-medical-text">
                {selectedCarePlan.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedCarePlan.description}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusBadgeClasses(
                selectedCarePlan.status
              )}`}
            >
              {getStatusLabel(selectedCarePlan.status)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>
                Created {selectedCarePlan.createdAt.toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                Updated {selectedCarePlan.updatedAt.toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleEditCarePlan}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-medical-primary border border-medical-primary hover:bg-medical-primary/5 transition-colors min-h-[40px]"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            {selectedCarePlan.status === CarePlanStatus.ACTIVE && (
              <button
                onClick={handleArchiveCarePlan}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors min-h-[40px]"
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
            )}
          </div>
        </div>

        {/* Missions section */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-medical-primary" />
            <h3 className="text-lg font-semibold text-medical-text">
              Missions ({selectedCarePlan.missions.length})
            </h3>
          </div>

          {selectedCarePlan.missions.length === 0 ? (
            <p className="text-gray-600 text-sm py-4">
              No missions added to this care plan yet.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedCarePlan.missions.map((mission: CarePlanMission) => {
                const MissionIcon = getMissionTypeIcon(mission.type);
                return (
                  <div
                    key={mission.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-medical-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MissionIcon className="w-4 h-4 text-medical-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-medical-text truncate">
                          {mission.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getMissionStatusClasses(
                            mission.status
                          )}`}
                        >
                          {getMissionStatusLabel(mission.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {mission.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getScheduleSummary(mission.schedule)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Medications section */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-gamification-accent" />
            <h3 className="text-lg font-semibold text-medical-text">
              Medications ({selectedCarePlan.medications.length})
            </h3>
          </div>

          {selectedCarePlan.medications.length === 0 ? (
            <p className="text-gray-600 text-sm py-4">
              No medications prescribed in this care plan yet.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedCarePlan.medications.map(
                (medication: MedicationPrescription) => (
                  <div
                    key={medication.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gamification-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Pill className="w-4 h-4 text-gamification-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-medical-text truncate">
                          {medication.medicationName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getMedicationStatusClasses(
                            medication.status
                          )}`}
                        >
                          {getMedicationStatusLabel(medication.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>{medication.dosage}</span>
                        <span className="text-gray-300">|</span>
                        <span>
                          {getFrequencySummary(medication.frequency)}
                        </span>
                        {medication.duration && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>{medication.duration} days</span>
                          </>
                        )}
                      </div>
                      {medication.instructions && (
                        <p className="text-xs text-gray-500 mt-1">
                          {medication.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Patient Mode
  // ============================================================================

  if (viewMode === 'patient' && selectedPatientId) {
    return (
      <div className="space-y-4">
        {renderErrorBanner()}

        {/* Back navigation */}
        <button
          onClick={handleBackToOverview}
          className="flex items-center gap-2 text-medical-primary hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        {/* Patient header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-medical-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-medical-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-medical-text">
                {getPatientName(selectedPatientId)}
              </h2>
              <p className="text-sm text-gray-600">Care Plans</p>
            </div>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-medical-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Care Plan</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search care plans..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-medical-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-primary/50 focus:border-medical-primary"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 text-medical-primary animate-spin" />
            <p className="text-gray-600">Loading care plans...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredCarePlans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <FileText className="w-10 h-10 text-gray-400" />
            <div className="text-center space-y-1">
              <p className="text-medical-text font-medium">
                {searchQuery
                  ? 'No care plans match your search'
                  : 'No care plans for this patient'}
              </p>
              <p className="text-sm text-gray-600">
                {searchQuery
                  ? 'Try a different search term.'
                  : 'Create a new care plan to get started.'}
              </p>
            </div>
          </div>
        )}

        {/* Care plan list */}
        {!isLoading && filteredCarePlans.length > 0 && (
          <div className="space-y-3">
            {filteredCarePlans.map((carePlan) => (
              <button
                key={carePlan.id}
                onClick={() => handleSelectCarePlan(carePlan.id)}
                className="w-full bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md hover:border-medical-primary/30 transition-all text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-medical-text">
                    {carePlan.name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-xs font-medium flex-shrink-0 ml-3 ${getStatusBadgeClasses(
                      carePlan.status
                    )}`}
                  >
                    {getStatusLabel(carePlan.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {carePlan.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {carePlan.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span>
                      {carePlan.missions.length} mission{carePlan.missions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5" />
                    <span>
                      {carePlan.medications.length} medication{carePlan.medications.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // Fallback: should not reach here, but return overview
  // ============================================================================

  return (
    <div className="space-y-4">
      {renderErrorBanner()}
      <CarePlanOverviewDashboard
        doctorId={doctorId}
        onPatientSelect={handlePatientSelect}
      />
    </div>
  );
}
