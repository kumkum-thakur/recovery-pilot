# Design Document: Doctor Care Plan Management

## Overview

The Doctor Care Plan Management system provides doctors with comprehensive tools to create, manage, and monitor patient care plans within the Recovery Pilot application. This feature transforms the current hardcoded mission system into a dynamic, doctor-driven care planning platform.

The system enables doctors to:
- Create structured care plans for individual patients
- Assign missions (medication checks, photo uploads, exercise logs) with custom schedules
- Prescribe medications with automatic mission generation
- Use pre-configured templates for common post-surgery scenarios
- Monitor patient progress and adjust care plans as recovery progresses

This design integrates seamlessly with existing Recovery Pilot components including the mission system, medication tracker, refill engine, and action item workflow.

## Architecture

### System Components

The care plan management system consists of the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Doctor Dashboard                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Care Plan Management Panel                  │  │
│  │  - Patient Selection                                  │  │
│  │  - Care Plan Creation/Editing                        │  │
│  │  - Mission Assignment                                 │  │
│  │  │  - Medication Prescription                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Care Plan Store                            │
│  - Care plan state management                                │
│  - Mission generation logic                                  │
│  - Template management                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Care Plan Service                             │
│  - Care plan CRUD operations                                 │
│  - Mission scheduling logic                                  │
│  - Medication schedule generation                            │
│  - Template application                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Persistence Service (Existing)                  │
│  - LocalStorage operations                                   │
│  - JSON serialization/deserialization                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Integration Points                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Mission Store│  │  Medication  │  │ Refill Engine│     │
│  │  (Existing)  │  │   Tracker    │  │  (Existing)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Care Plan Creation Flow:**
   - Doctor selects patient → Opens care plan panel → Creates care plan → Adds missions/medications → Saves to persistence
   - Care plan service generates mission instances based on schedules
   - Missions are saved to mission store and appear in patient dashboard

2. **Mission Completion Flow:**
   - Patient completes mission → Mission store updates status → Care plan reflects completion
   - For medication missions: Medication tracker updates inventory → Triggers refill if needed
   - For photo missions: Triggers triage workflow → Creates action item for doctor review

3. **Template Application Flow:**
   - Doctor selects template → Template data loaded → Dates adjusted to current date → Pre-populated in care plan form → Doctor can modify before saving

## Components and Interfaces

### Data Models

#### CarePlan

Represents a complete care plan for a patient.

```typescript
interface CarePlan {
  id: string;                    // Unique identifier
  patientId: string;             // Patient this plan belongs to
  doctorId: string;              // Doctor who created the plan
  name: string;                  // Plan name (e.g., "Post-Surgery Recovery")
  description: string;           // Plan description
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  status: CarePlanStatus;        // active, archived, completed
  missions: CarePlanMission[];   // Missions in this plan
  medications: MedicationPrescription[]; // Medications prescribed
}

type CarePlanStatus = 'active' | 'archived' | 'completed';
```

#### CarePlanMission

Represents a mission template within a care plan (before instances are generated).

```typescript
interface CarePlanMission {
  id: string;                    // Unique identifier
  carePlanId: string;            // Parent care plan
  type: MissionType;             // PHOTO_UPLOAD, MEDICATION_CHECK, EXERCISE_LOG
  title: string;                 // Mission title
  description: string;           // Mission description
  schedule: MissionSchedule;     // Scheduling configuration
  status: CarePlanMissionStatus; // active, cancelled
  createdAt: Date;               // Creation timestamp
  metadata?: Record<string, any>; // Additional mission-specific data
}

type CarePlanMissionStatus = 'active' | 'cancelled';
```

#### MissionSchedule

Defines when and how often a mission should occur.

```typescript
interface MissionSchedule {
  startDate: Date;               // When mission starts
  recurrence: RecurrencePattern; // How often it repeats
  endDate?: Date;                // When mission ends (optional)
  occurrences?: number;          // Number of times to repeat (alternative to endDate)
  timeOfDay?: string;            // Specific time (HH:MM format, optional)
}

interface RecurrencePattern {
  type: RecurrenceType;          // one-time, daily, weekly, custom
  interval?: number;             // For custom: repeat every N days
  daysOfWeek?: number[];         // For weekly: [0-6] where 0=Sunday
}

type RecurrenceType = 'one-time' | 'daily' | 'weekly' | 'custom';
```

#### MedicationPrescription

Represents a medication prescribed in a care plan.

```typescript
interface MedicationPrescription {
  id: string;                    // Unique identifier
  carePlanId: string;            // Parent care plan
  medicationName: string;        // Name of medication
  dosage: string;                // Dosage (e.g., "500mg")
  frequency: MedicationFrequency; // How often to take
  duration?: number;             // Duration in days (optional, ongoing if not specified)
  refillThreshold: number;       // Tablets remaining to trigger refill
  instructions?: string;         // Additional instructions
  startDate: Date;               // When to start taking
  endDate?: Date;                // When to stop (calculated from duration)
  status: MedicationStatus;      // active, completed, cancelled
  createdAt: Date;               // Creation timestamp
}

interface MedicationFrequency {
  timesPerDay: number;           // 1, 2, 3, etc.
  times?: string[];              // Specific times (e.g., ["08:00", "20:00"])
}

type MedicationStatus = 'active' | 'completed' | 'cancelled';
```

#### CarePlanTemplate

Pre-configured care plan for common scenarios.

```typescript
interface CarePlanTemplate {
  id: string;                    // Unique identifier
  name: string;                  // Template name
  description: string;           // Template description
  category: string;              // Category (e.g., "Post-Surgery")
  missions: TemplateMission[];   // Mission templates
  medications: TemplateMedication[]; // Medication templates
}

interface TemplateMission {
  type: MissionType;
  title: string;
  description: string;
  schedule: TemplateMissionSchedule;
}

interface TemplateMissionSchedule {
  startDayOffset: number;        // Days after plan start (0 = same day)
  recurrence: RecurrencePattern;
  durationDays?: number;         // How many days this mission runs
}

interface TemplateMedication {
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  durationDays?: number;
  refillThreshold: number;
  instructions?: string;
}
```

#### CarePlanModel (Persistence)

Database representation of a care plan.

```typescript
interface CarePlanModel {
  id: string;
  patientId: string;
  doctorId: string;
  name: string;
  description: string;
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
  status: CarePlanStatus;
  missions: CarePlanMissionModel[];
  medications: MedicationPrescriptionModel[];
}

interface CarePlanMissionModel {
  id: string;
  carePlanId: string;
  type: MissionType;
  title: string;
  description: string;
  schedule: MissionScheduleModel;
  status: CarePlanMissionStatus;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface MissionScheduleModel {
  startDate: string;             // ISO date string
  recurrence: RecurrencePattern;
  endDate?: string;              // ISO date string
  occurrences?: number;
  timeOfDay?: string;
}

interface MedicationPrescriptionModel {
  id: string;
  carePlanId: string;
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  duration?: number;
  refillThreshold: number;
  instructions?: string;
  startDate: string;             // ISO date string
  endDate?: string;              // ISO date string
  status: MedicationStatus;
  createdAt: string;
}
```

### Services

#### CarePlanService

Handles care plan business logic and mission generation.

```typescript
interface CarePlanService {
  // Care plan CRUD
  createCarePlan(plan: CreateCarePlanInput): Promise<CarePlan>;
  getCarePlan(carePlanId: string): Promise<CarePlan | null>;
  getCarePlansForPatient(patientId: string): Promise<CarePlan[]>;
  getCarePlansForDoctor(doctorId: string): Promise<CarePlan[]>;
  updateCarePlan(carePlanId: string, updates: Partial<CarePlan>): Promise<CarePlan>;
  archiveCarePlan(carePlanId: string): Promise<void>;
  
  // Mission management
  addMissionToCarePlan(carePlanId: string, mission: CreateMissionInput): Promise<CarePlanMission>;
  updateCarePlanMission(missionId: string, updates: Partial<CarePlanMission>): Promise<CarePlanMission>;
  cancelCarePlanMission(missionId: string, cancelFutureInstances: boolean): Promise<void>;
  generateMissionInstances(carePlanMission: CarePlanMission): Promise<MissionModel[]>;
  
  // Medication management
  addMedicationToCarePlan(carePlanId: string, medication: CreateMedicationInput): Promise<MedicationPrescription>;
  updateMedication(medicationId: string, updates: Partial<MedicationPrescription>): Promise<MedicationPrescription>;
  cancelMedication(medicationId: string): Promise<void>;
  generateMedicationMissions(medication: MedicationPrescription): Promise<CarePlanMission[]>;
  
  // Template management
  getTemplates(): Promise<CarePlanTemplate[]>;
  applyTemplate(templateId: string, patientId: string, doctorId: string): Promise<CarePlan>;
  
  // Validation
  validateCarePlan(plan: CarePlan): ValidationResult;
  validateMissionSchedule(schedule: MissionSchedule): ValidationResult;
}

interface CreateCarePlanInput {
  patientId: string;
  doctorId: string;
  name: string;
  description: string;
}

interface CreateMissionInput {
  type: MissionType;
  title: string;
  description: string;
  schedule: MissionSchedule;
  metadata?: Record<string, any>;
}

interface CreateMedicationInput {
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  duration?: number;
  refillThreshold: number;
  instructions?: string;
  startDate: Date;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### Store

#### CarePlanStore

Zustand store for care plan state management.

```typescript
interface CarePlanStore {
  // State
  carePlans: CarePlan[];
  selectedCarePlan: CarePlan | null;
  templates: CarePlanTemplate[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCarePlansForDoctor: (doctorId: string) => Promise<void>;
  fetchCarePlansForPatient: (patientId: string) => Promise<void>;
  selectCarePlan: (carePlanId: string) => void;
  createCarePlan: (input: CreateCarePlanInput) => Promise<CarePlan>;
  updateCarePlan: (carePlanId: string, updates: Partial<CarePlan>) => Promise<void>;
  archiveCarePlan: (carePlanId: string) => Promise<void>;
  
  addMission: (carePlanId: string, mission: CreateMissionInput) => Promise<void>;
  updateMission: (missionId: string, updates: Partial<CarePlanMission>) => Promise<void>;
  cancelMission: (missionId: string, cancelFutureInstances: boolean) => Promise<void>;
  
  addMedication: (carePlanId: string, medication: CreateMedicationInput) => Promise<void>;
  updateMedication: (medicationId: string, updates: Partial<MedicationPrescription>) => Promise<void>;
  cancelMedication: (medicationId: string) => Promise<void>;
  
  fetchTemplates: () => Promise<void>;
  applyTemplate: (templateId: string, patientId: string, doctorId: string) => Promise<CarePlan>;
  
  clearError: () => void;
}
```

### UI Components

#### CarePlanPanel

Main panel for care plan management.

```typescript
interface CarePlanPanelProps {
  doctorId: string;
}

// Component displays:
// - Patient selector
// - Care plan list for selected patient
// - Create new care plan button
// - Care plan details when one is selected
```

#### CarePlanForm

Form for creating/editing care plans.

```typescript
interface CarePlanFormProps {
  carePlan?: CarePlan;           // For editing, undefined for creating
  patientId: string;
  doctorId: string;
  onSave: (carePlan: CarePlan) => void;
  onCancel: () => void;
}

// Component includes:
// - Name and description fields
// - Mission list with add/edit/delete
// - Medication list with add/edit/delete
// - Template selector
// - Save/cancel buttons
```

#### MissionScheduleEditor

Editor for mission scheduling configuration.

```typescript
interface MissionScheduleEditorProps {
  schedule: MissionSchedule;
  onChange: (schedule: MissionSchedule) => void;
}

// Component includes:
// - Start date picker
// - Recurrence type selector (one-time, daily, weekly, custom)
// - Interval input (for custom recurrence)
// - End date picker or occurrence count
// - Time of day picker (optional)
```

#### MedicationForm

Form for adding/editing medications.

```typescript
interface MedicationFormProps {
  medication?: MedicationPrescription; // For editing
  onSave: (medication: MedicationPrescription) => void;
  onCancel: () => void;
}

// Component includes:
// - Medication name input
// - Dosage input
// - Frequency selector (times per day)
// - Duration input (days)
// - Refill threshold input
// - Instructions textarea
// - Start date picker
```

#### TemplateSelector

Selector for care plan templates.

```typescript
interface TemplateSelectorProps {
  templates: CarePlanTemplate[];
  onSelect: (templateId: string) => void;
}

// Component displays:
// - List of templates grouped by category
// - Template preview on hover
// - Apply button
```

#### CarePlanOverviewDashboard

Dashboard showing all patients and their care plan status.

```typescript
interface CarePlanOverviewDashboardProps {
  doctorId: string;
  onPatientSelect: (patientId: string) => void;
}

// Component displays:
// - List of patients with active care plans
// - Completion percentage per patient
// - Overdue mission count
// - Pending action item count
// - Quick navigation to patient details
```

## Data Models

### Storage Keys

```typescript
export const CARE_PLAN_STORAGE_KEYS = {
  CARE_PLANS: 'recovery_pilot_care_plans',
  CARE_PLAN_TEMPLATES: 'recovery_pilot_care_plan_templates',
} as const;
```

### Model Conversion Functions

```typescript
// Convert CarePlanModel to CarePlan
function carePlanModelToCarePlan(model: CarePlanModel): CarePlan {
  return {
    id: model.id,
    patientId: model.patientId,
    doctorId: model.doctorId,
    name: model.name,
    description: model.description,
    createdAt: new Date(model.createdAt),
    updatedAt: new Date(model.updatedAt),
    status: model.status,
    missions: model.missions.map(missionModelToCarePlanMission),
    medications: model.medications.map(medicationModelToMedicationPrescription),
  };
}

// Convert CarePlan to CarePlanModel
function carePlanToCarePlanModel(carePlan: CarePlan): CarePlanModel {
  return {
    id: carePlan.id,
    patientId: carePlan.patientId,
    doctorId: carePlan.doctorId,
    name: carePlan.name,
    description: carePlan.description,
    createdAt: carePlan.createdAt.toISOString(),
    updatedAt: carePlan.updatedAt.toISOString(),
    status: carePlan.status,
    missions: carePlan.missions.map(carePlanMissionToMissionModel),
    medications: carePlan.medications.map(medicationPrescriptionToMedicationModel),
  };
}

// Similar conversion functions for missions and medications
```

### Default Templates

The system will include pre-configured templates for common scenarios:

1. **Knee Replacement Recovery**
   - Daily photo uploads for 14 days
   - Pain medication (3x daily for 7 days)
   - Physical therapy exercises (2x daily for 30 days)
   - Follow-up appointment reminder

2. **Appendectomy Recovery**
   - Daily photo uploads for 7 days
   - Antibiotic (2x daily for 10 days)
   - Activity log (daily for 14 days)
   - Follow-up appointment reminder

3. **General Wound Care**
   - Daily photo uploads for 10 days
   - Wound cleaning reminder (2x daily for 10 days)
   - Pain medication as needed
   - Follow-up appointment reminder

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following consolidations to eliminate redundancy:

**Consolidations:**
- Properties 11.1, 11.2, 11.3 (specific medication frequencies) are edge cases of property 3.4 (general medication mission generation)
- Properties S.1, S.2, S.4 (individual serialization steps) are covered by S.3 (round-trip property)
- Properties S.5, S.6, S.7 (schedule serialization) are covered by S.3 (round-trip includes nested structures)
- Property 15.3 (refill workflow trigger) is already tested in the existing refill engine, not needed here

**Unique Properties Retained:**
- Care plan persistence and retrieval (round-trip)
- Mission generation from schedules (recurring missions)
- Medication mission generation (frequency-based)
- Patient-care plan association
- Mission-patient association
- Data integrity (completion history preservation, cancellation without deletion)
- Validation (required fields, date constraints, scheduling limits)
- Integration (mission visibility, status synchronization, service integration)

### Correctness Properties

Property 1: Care plan persistence round-trip
*For any* valid care plan, serializing it to JSON then deserializing should produce an equivalent care plan with all nested structures (missions, medications, schedules) preserved
**Validates: Requirements 10.1, 10.2, S.3**

Property 2: Care plan-patient association
*For any* care plan created with a patient ID, querying care plans for that patient ID should return a list containing that care plan
**Validates: Requirements 1.3, 6.1**

Property 3: Mission-patient association
*For any* mission created in a care plan, that mission should be associated with the care plan's patient ID and appear in the patient's mission list
**Validates: Requirements 2.6, 9.1**

Property 4: Recurring mission instance generation
*For any* recurring mission with N occurrences, the system should generate exactly N mission instances with due dates matching the recurrence pattern
**Validates: Requirements 4.4**

Property 5: Medication mission generation
*For any* medication prescription with frequency F times per day and duration D days, the system should generate exactly F × D MEDICATION_CHECK missions
**Validates: Requirements 3.4, 11.5**

Property 6: Medication mission spacing
*For any* medication prescription with frequency F times per day, the generated missions should be spaced evenly throughout the day (24 hours / F)
**Validates: Requirements 11.4**

Property 7: Required field validation
*For any* care plan, mission, or medication with missing required fields, the system should reject it with a validation error
**Validates: Requirements 1.5, 2.2, 2.5, 3.1, 3.6**

Property 8: Date constraint validation
*For any* mission schedule, if the start date is in the past or the end date is before the start date, the system should reject it with a validation error
**Validates: Requirements 4.5, 4.6**

Property 9: Scheduling limit validation
*For any* recurring mission that would generate more than 100 instances, the system should reject it with a validation error
**Validates: Requirements 13.4**

Property 10: Mission completion history preservation
*For any* care plan with completed missions, editing the care plan should not modify or delete the completion records of those missions
**Validates: Requirements 6.4, 14.4**

Property 11: Mission cancellation without deletion
*For any* mission that is cancelled, the mission should still exist in storage with status 'cancelled' rather than being deleted
**Validates: Requirements 7.2, 6.5**

Property 12: Mission status synchronization
*For any* mission completed by a patient, the mission status in the care plan should be updated to 'completed'
**Validates: Requirements 9.2**

Property 13: Photo mission triage integration
*For any* PHOTO_UPLOAD mission that is completed, the system should trigger the triage workflow
**Validates: Requirements 9.3**

Property 14: Medication mission tracker integration
*For any* MEDICATION_CHECK mission that is completed, the system should update the medication tracker and check refill thresholds
**Validates: Requirements 9.4**

Property 15: Medication tracker registration
*For any* medication prescription created, the system should register it with the medication tracker service with the correct refill threshold
**Validates: Requirements 3.5, 15.1, 15.2**

Property 16: Template date adjustment
*For any* template applied with missions at day offsets, the generated care plan should have mission due dates set relative to the current date (today + offset)
**Validates: Requirements 5.4**

Property 17: Template data population
*For any* template selected, the care plan form should be pre-populated with all missions and medications from the template
**Validates: Requirements 5.2**

Property 18: Template persistence round-trip
*For any* valid care plan template, serializing it to JSON then deserializing should produce an equivalent template
**Validates: Requirements 5.5**

Property 19: Care plan unique identifiers
*For any* two care plans created, they should have different unique identifiers
**Validates: Requirements 10.3**

Property 20: Archived care plan filtering
*For any* care plan marked as archived, it should not appear in queries for active care plans but should appear in queries for archived care plans
**Validates: Requirements 14.2, 14.3**

Property 21: Patient search functionality
*For any* search query, the returned patients should have names that contain the search query (case-insensitive)
**Validates: Requirements 8.4**

Property 22: Care plan completion percentage calculation
*For any* care plan, the completion percentage should equal (number of completed missions / total missions) × 100
**Validates: Requirements 12.2**

Property 23: Pending action item count accuracy
*For any* patient, the displayed pending action item count should equal the actual number of action items with status 'pending_doctor' for that patient
**Validates: Requirements 12.4**

Property 24: Mission schedule warning threshold
*For any* day with more than 5 missions scheduled, the system should display a warning to the doctor
**Validates: Requirements 13.1**

Property 25: Mission future date limit
*For any* mission with a due date more than 365 days in the future, the system should display a warning to the doctor
**Validates: Requirements 13.2**

Property 26: Completed mission modification restriction
*For any* mission with status 'completed', attempting to modify its core details (title, description, type) should be rejected
**Validates: Requirements 7.5**

Property 27: Mission list update synchronization
*For any* care plan mission that is modified, the patient's mission list should reflect the changes immediately
**Validates: Requirements 7.4**

Property 28: Refill status synchronization
*For any* medication refill that is approved, the medication inventory in the care plan should be updated to reflect the new tablet count
**Validates: Requirements 15.4**

Property 29: Mission data structure compatibility
*For any* mission generated from a care plan, it should be compatible with the existing MissionModel structure and processable by the mission store
**Validates: Requirements 9.5**

Property 30: Referential integrity
*For any* care plan, all mission patient IDs should match the care plan's patient ID, and all medication care plan IDs should match the care plan's ID
**Validates: Requirements 10.4**

## Error Handling

### Validation Errors

The system will validate user input at multiple levels:

1. **Form-level validation:**
   - Required fields must be present
   - Field formats must be correct (dates, numbers, etc.)
   - Field values must be within acceptable ranges

2. **Business logic validation:**
   - Start dates cannot be in the past (with warning override option)
   - End dates must be after start dates
   - Recurring missions cannot generate more than 100 instances
   - More than 5 missions per day triggers a warning
   - Due dates more than 365 days in the future trigger a warning

3. **Data integrity validation:**
   - Patient must exist before creating care plan
   - Care plan must exist before adding missions/medications
   - Completed missions cannot have core details modified

### Error Messages

All validation errors will display user-friendly messages:

```typescript
const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_DATE: 'Please enter a valid date',
  START_DATE_PAST: 'Start date cannot be in the past',
  END_BEFORE_START: 'End date must be after start date',
  TOO_MANY_INSTANCES: 'This schedule would create more than 100 missions. Please adjust the end date or recurrence.',
  TOO_MANY_MISSIONS_PER_DAY: 'Warning: More than 5 missions scheduled for this day. Consider spreading them out.',
  FUTURE_DATE_WARNING: 'Warning: Mission is scheduled more than 1 year in the future.',
  PATIENT_NOT_FOUND: 'Patient not found. Please select a valid patient.',
  CARE_PLAN_NOT_FOUND: 'Care plan not found.',
  CANNOT_MODIFY_COMPLETED: 'Cannot modify core details of completed missions. You can add notes instead.',
  STORAGE_ERROR: 'Failed to save data. Please try again.',
  STORAGE_QUOTA_EXCEEDED: 'Storage limit reached. Please archive old care plans or contact support.',
};
```

### Storage Error Handling

The system will handle storage errors gracefully:

1. **Quota exceeded:**
   - Display error message suggesting archiving old care plans
   - Prevent data loss by not clearing the form
   - Log error for debugging

2. **Serialization errors:**
   - Display error message indicating data format issue
   - Log detailed error for debugging
   - Prevent partial saves

3. **Network/browser errors:**
   - Display generic error message
   - Suggest refreshing the page
   - Log error for debugging

### Integration Error Handling

When integrating with existing services:

1. **Mission store errors:**
   - If mission creation fails, roll back care plan changes
   - Display error message to doctor
   - Log error for debugging

2. **Medication tracker errors:**
   - If registration fails, display warning but allow care plan save
   - Log error for debugging
   - Allow manual retry

3. **Refill engine errors:**
   - If refill trigger fails, log error but don't block mission completion
   - Display notification to doctor
   - Allow manual refill request

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific examples and edge cases with property-based tests for universal properties:

**Unit Tests:**
- Specific examples of care plan creation
- Edge cases (empty lists, boundary values)
- Error conditions (missing fields, invalid dates)
- Integration points (mission store, medication tracker)
- UI component rendering and interactions

**Property-Based Tests:**
- Universal properties across all inputs (see Correctness Properties section)
- Comprehensive input coverage through randomization
- Each property test runs minimum 100 iterations
- Tests validate correctness across wide range of scenarios

### Property-Based Testing Configuration

**Library:** fast-check (for TypeScript/JavaScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: doctor-care-plan-management, Property N: [property text]`

**Example Property Test:**

```typescript
import fc from 'fast-check';

// Feature: doctor-care-plan-management, Property 1: Care plan persistence round-trip
test('Property 1: Care plan serialization round-trip', () => {
  fc.assert(
    fc.property(
      carePlanArbitrary(), // Generator for random care plans
      (carePlan) => {
        const serialized = carePlanToCarePlanModel(carePlan);
        const deserialized = carePlanModelToCarePlan(serialized);
        expect(deserialized).toEqual(carePlan);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

Unit tests will cover:

1. **CarePlanService:**
   - Create care plan with valid input
   - Create care plan with missing required fields (should fail)
   - Update care plan
   - Archive care plan
   - Add mission to care plan
   - Add medication to care plan
   - Generate mission instances from schedule
   - Generate medication missions from prescription
   - Apply template to care plan
   - Validate care plan (various invalid cases)

2. **CarePlanStore:**
   - Fetch care plans for doctor
   - Fetch care plans for patient
   - Select care plan
   - Create care plan (success and error cases)
   - Update care plan
   - Archive care plan
   - Add/update/cancel missions
   - Add/update/cancel medications
   - Apply template
   - Error handling

3. **UI Components:**
   - CarePlanPanel renders correctly
   - CarePlanForm handles input
   - MissionScheduleEditor updates schedule
   - MedicationForm validates input
   - TemplateSelector displays templates
   - CarePlanOverviewDashboard shows patient data

4. **Integration:**
   - Care plan missions appear in patient mission list
   - Completed missions update care plan status
   - Photo missions trigger triage workflow
   - Medication missions update tracker
   - Medication prescriptions register with tracker
   - Refill approvals update care plan

### Test Data Generators

For property-based testing, we'll create generators for:

```typescript
// Generate random care plans
function carePlanArbitrary(): fc.Arbitrary<CarePlan> {
  return fc.record({
    id: fc.uuid(),
    patientId: fc.uuid(),
    doctorId: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ maxLength: 500 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    status: fc.constantFrom('active', 'archived', 'completed'),
    missions: fc.array(carePlanMissionArbitrary(), { maxLength: 20 }),
    medications: fc.array(medicationPrescriptionArbitrary(), { maxLength: 10 }),
  });
}

// Generate random mission schedules
function missionScheduleArbitrary(): fc.Arbitrary<MissionSchedule> {
  return fc.record({
    startDate: fc.date({ min: new Date() }), // Future dates only
    recurrence: recurrencePatternArbitrary(),
    endDate: fc.option(fc.date({ min: new Date() })),
    occurrences: fc.option(fc.integer({ min: 1, max: 100 })),
    timeOfDay: fc.option(fc.string({ pattern: /^([01]\d|2[0-3]):[0-5]\d$/ })),
  });
}

// Generate random recurrence patterns
function recurrencePatternArbitrary(): fc.Arbitrary<RecurrencePattern> {
  return fc.oneof(
    fc.record({ type: fc.constant('one-time') }),
    fc.record({ type: fc.constant('daily') }),
    fc.record({
      type: fc.constant('weekly'),
      daysOfWeek: fc.array(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 }),
    }),
    fc.record({
      type: fc.constant('custom'),
      interval: fc.integer({ min: 1, max: 30 }),
    })
  );
}

// Generate random medication prescriptions
function medicationPrescriptionArbitrary(): fc.Arbitrary<MedicationPrescription> {
  return fc.record({
    id: fc.uuid(),
    carePlanId: fc.uuid(),
    medicationName: fc.string({ minLength: 1, maxLength: 100 }),
    dosage: fc.string({ minLength: 1, maxLength: 50 }),
    frequency: fc.record({
      timesPerDay: fc.integer({ min: 1, max: 4 }),
      times: fc.option(fc.array(fc.string({ pattern: /^([01]\d|2[0-3]):[0-5]\d$/ }))),
    }),
    duration: fc.option(fc.integer({ min: 1, max: 365 })),
    refillThreshold: fc.integer({ min: 1, max: 10 }),
    instructions: fc.option(fc.string({ maxLength: 200 })),
    startDate: fc.date({ min: new Date() }),
    endDate: fc.option(fc.date({ min: new Date() })),
    status: fc.constantFrom('active', 'completed', 'cancelled'),
    createdAt: fc.date(),
  });
}
```

### Integration Testing

Integration tests will verify:

1. **End-to-end care plan creation:**
   - Doctor creates care plan → Missions appear in patient dashboard → Patient completes mission → Status updates in care plan

2. **Medication workflow:**
   - Doctor prescribes medication → Medication missions generated → Patient completes mission → Tracker updated → Refill triggered when threshold reached

3. **Photo mission workflow:**
   - Doctor assigns photo mission → Patient uploads photo → Triage workflow triggered → Action item created for doctor

4. **Template application:**
   - Doctor selects template → Care plan pre-populated → Doctor modifies and saves → Missions generated correctly

### Performance Testing

While not part of automated testing, the following performance considerations should be manually verified:

1. **Large care plans:**
   - Care plans with 50+ missions should load within 2 seconds
   - Mission generation for recurring missions should complete within 1 second

2. **Dashboard performance:**
   - Dashboard with 20+ patients should load within 3 seconds
   - Completion percentage calculations should not block UI

3. **Storage limits:**
   - System should handle 100+ care plans without performance degradation
   - Storage quota warnings should appear before hitting limits
