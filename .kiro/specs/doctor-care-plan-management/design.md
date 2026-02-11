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

