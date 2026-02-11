# Requirements Document: Doctor Care Plan Management

## Introduction

The Doctor Care Plan Management system enables doctors to create, manage, and monitor comprehensive care plans for their patients within the Recovery Pilot application. Currently, missions are hardcoded in seed data and doctors can only view action items for review. This feature will provide doctors with a comprehensive panel to create custom care plans, assign missions, prescribe medications, and manage patient recovery protocols.

## Glossary

- **Care_Plan**: A structured recovery protocol assigned to a patient, containing missions, medications, and schedules
- **Mission**: A recovery task assigned to a patient (medication check, photo upload, or exercise log)
- **Doctor_Panel**: The user interface where doctors create and manage care plans
- **Patient**: A user receiving care and completing assigned missions
- **Doctor**: A medical professional who creates and manages patient care plans
- **Medication_Prescription**: A medication assignment with dosage, frequency, and duration details
- **Mission_Schedule**: The timing configuration for a mission including due dates and recurrence patterns
- **Care_Plan_Template**: A pre-configured care plan for common post-surgery scenarios
- **Recurrence_Pattern**: The frequency at which a mission repeats (daily, weekly, custom intervals)
- **System**: The Recovery Pilot application

## Requirements

### Requirement 1: Care Plan Creation

**User Story:** As a doctor, I want to create a new care plan for a patient, so that I can establish a structured recovery protocol.

#### Acceptance Criteria

1. WHEN a doctor selects a patient, THE System SHALL display a care plan creation interface
2. WHEN creating a care plan, THE System SHALL allow the doctor to specify a plan name and description
3. WHEN a care plan is created, THE System SHALL associate it with the selected patient
4. WHEN a care plan is saved, THE System SHALL persist it to storage immediately
5. THE System SHALL validate that a patient is selected before allowing care plan creation

### Requirement 2: Mission Assignment

**User Story:** As a doctor, I want to assign specific missions to a patient's care plan, so that I can track their recovery activities.

#### Acceptance Criteria

1. WHEN adding a mission to a care plan, THE System SHALL allow selection of mission type (PHOTO_UPLOAD, MEDICATION_CHECK, EXERCISE_LOG)
2. WHEN creating a mission, THE System SHALL require a title and description
3. WHEN creating a mission, THE System SHALL allow the doctor to set a due date
4. WHEN creating a mission, THE System SHALL allow the doctor to configure recurrence patterns (one-time, daily, weekly, custom)
5. WHEN a mission is added, THE System SHALL validate all required fields are present
6. WHEN a mission is saved, THE System SHALL generate a unique mission ID and associate it with the patient

### Requirement 3: Medication Prescription

**User Story:** As a doctor, I want to prescribe medications with detailed instructions, so that patients know exactly how to take their medications.

#### Acceptance Criteria

1. WHEN prescribing a medication, THE System SHALL require medication name, dosage, and frequency
2. WHEN prescribing a medication, THE System SHALL allow the doctor to specify duration (number of days or ongoing)
3. WHEN prescribing a medication, THE System SHALL allow the doctor to configure refill settings (auto-refill threshold)
4. WHEN prescribing a medication, THE System SHALL create corresponding MEDICATION_CHECK missions based on frequency
5. WHEN a medication prescription is saved, THE System SHALL integrate with the existing medication tracker service
6. THE System SHALL validate that dosage and frequency are specified before saving

### Requirement 4: Mission Scheduling

**User Story:** As a doctor, I want to schedule missions with specific timelines, so that patients receive tasks at appropriate times during recovery.

#### Acceptance Criteria

1. WHEN scheduling a mission, THE System SHALL allow the doctor to set a start date
2. WHEN scheduling a recurring mission, THE System SHALL allow the doctor to specify recurrence frequency (daily, every N days, weekly, custom)
3. WHEN scheduling a recurring mission, THE System SHALL allow the doctor to specify an end date or number of occurrences
4. WHEN a recurring mission is created, THE System SHALL generate individual mission instances for each occurrence
5. THE System SHALL validate that start dates are not in the past
6. THE System SHALL validate that end dates are after start dates for recurring missions

### Requirement 5: Care Plan Templates

**User Story:** As a doctor, I want to use pre-configured care plan templates, so that I can quickly set up common post-surgery protocols.

#### Acceptance Criteria

1. THE System SHALL provide templates for common post-surgery scenarios (knee replacement, appendectomy, wound care)
2. WHEN a doctor selects a template, THE System SHALL pre-populate the care plan with template missions and medications
3. WHEN using a template, THE System SHALL allow the doctor to modify any pre-populated content before saving
4. WHEN a template is applied, THE System SHALL adjust mission due dates relative to the current date
5. THE System SHALL store templates in a retrievable format

### Requirement 6: Care Plan Viewing and Editing

**User Story:** As a doctor, I want to view and edit existing patient care plans, so that I can adjust treatment as recovery progresses.

#### Acceptance Criteria

1. WHEN a doctor selects a patient, THE System SHALL display all active care plans for that patient
2. WHEN viewing a care plan, THE System SHALL display all missions, medications, and schedules
3. WHEN editing a care plan, THE System SHALL allow modification of mission details, schedules, and medications
4. WHEN editing a care plan, THE System SHALL preserve mission completion history
5. THE System SHALL allow doctors to mark missions as cancelled without deleting completion records

### Requirement 7: Mission Modification and Cancellation

**User Story:** As a doctor, I want to modify or cancel existing missions, so that I can respond to changes in patient condition or recovery progress.

#### Acceptance Criteria

1. WHEN modifying a mission, THE System SHALL allow changes to title, description, due date, and recurrence
2. WHEN cancelling a mission, THE System SHALL mark it as cancelled rather than deleting it
3. WHEN cancelling a recurring mission, THE System SHALL allow the doctor to cancel a single instance or all future instances
4. WHEN a mission is modified, THE System SHALL update the patient's mission list immediately
5. IF a mission is already completed, THEN THE System SHALL prevent modification of its core details but allow adding notes

### Requirement 8: Patient Selection and Management

**User Story:** As a doctor, I want to easily select and switch between my patients, so that I can manage multiple care plans efficiently.

#### Acceptance Criteria

1. WHEN accessing the care plan panel, THE System SHALL display a list of the doctor's assigned patients
2. WHEN a patient is selected, THE System SHALL load and display their current care plans
3. THE System SHALL display patient name and relevant information in the care plan interface
4. THE System SHALL allow the doctor to search or filter patients by name
5. WHEN switching patients, THE System SHALL save any unsaved changes or prompt the doctor to confirm

### Requirement 9: Integration with Existing Mission System

**User Story:** As a patient, I want to see doctor-assigned missions in my dashboard, so that I can complete my recovery tasks.

#### Acceptance Criteria

1. WHEN a doctor creates missions in a care plan, THE System SHALL make them visible in the patient's mission list
2. WHEN a patient completes a mission, THE System SHALL update the mission status in the care plan
3. WHEN a PHOTO_UPLOAD mission is completed, THE System SHALL trigger the existing triage workflow
4. WHEN a MEDICATION_CHECK mission is completed, THE System SHALL update the medication tracker and check refill thresholds
5. THE System SHALL maintain compatibility with existing mission data structures and services

### Requirement 10: Care Plan Data Persistence

**User Story:** As a doctor, I want my care plans to be saved reliably, so that patient treatment plans are not lost.

#### Acceptance Criteria

1. WHEN a care plan is created or modified, THE System SHALL persist it using the existing persistence service
2. WHEN the application is reloaded, THE System SHALL restore all care plans from storage
3. THE System SHALL store care plans with unique identifiers
4. THE System SHALL maintain referential integrity between care plans, missions, and patients
5. WHEN storage operations fail, THE System SHALL display an error message and prevent data loss

### Requirement 11: Medication Schedule Generation

**User Story:** As a doctor, I want medication prescriptions to automatically generate check-in missions, so that patients are reminded to take their medications.

#### Acceptance Criteria

1. WHEN a medication is prescribed with frequency "twice daily", THE System SHALL create two MEDICATION_CHECK missions per day
2. WHEN a medication is prescribed with frequency "three times daily", THE System SHALL create three MEDICATION_CHECK missions per day
3. WHEN a medication is prescribed with frequency "once daily", THE System SHALL create one MEDICATION_CHECK mission per day
4. WHEN generating medication missions, THE System SHALL space them evenly throughout the day (e.g., 8am, 2pm, 8pm for three times daily)
5. WHEN a medication prescription has a duration, THE System SHALL generate missions only for that duration period

### Requirement 12: Care Plan Overview Dashboard

**User Story:** As a doctor, I want to see an overview of all my patients' care plans, so that I can monitor overall progress and identify patients needing attention.

#### Acceptance Criteria

1. THE System SHALL display a dashboard showing all patients with active care plans
2. WHEN viewing the dashboard, THE System SHALL show each patient's care plan completion percentage
3. WHEN viewing the dashboard, THE System SHALL highlight patients with overdue missions
4. WHEN viewing the dashboard, THE System SHALL show the number of pending action items per patient
5. WHEN a doctor clicks on a patient in the dashboard, THE System SHALL navigate to that patient's detailed care plan

### Requirement 13: Mission Due Date Validation

**User Story:** As a doctor, I want the system to prevent scheduling conflicts, so that patients receive realistic and achievable mission schedules.

#### Acceptance Criteria

1. WHEN creating multiple missions for the same day, THE System SHALL warn if more than 5 missions are scheduled
2. WHEN scheduling a mission, THE System SHALL validate that the due date is not more than 365 days in the future
3. THE System SHALL allow doctors to override scheduling warnings after confirmation
4. WHEN a recurring mission would create more than 100 instances, THE System SHALL require the doctor to adjust the schedule
5. THE System SHALL display a calendar view showing mission distribution over time

### Requirement 14: Care Plan Archival

**User Story:** As a doctor, I want to archive completed care plans, so that I can maintain a clean active care plan list while preserving historical records.

#### Acceptance Criteria

1. WHEN a care plan is completed, THE System SHALL allow the doctor to mark it as archived
2. WHEN a care plan is archived, THE System SHALL remove it from the active care plan list
3. WHEN viewing archived care plans, THE System SHALL display all historical care plans for a patient
4. WHEN a care plan is archived, THE System SHALL preserve all mission completion data
5. THE System SHALL allow doctors to reactivate an archived care plan if needed

### Requirement 15: Medication Refill Integration

**User Story:** As a doctor, I want medication prescriptions to integrate with the refill system, so that patients receive timely refill notifications.

#### Acceptance Criteria

1. WHEN a medication prescription is created, THE System SHALL register it with the medication tracker service
2. WHEN a medication prescription includes a refill threshold, THE System SHALL configure the refill engine accordingly
3. WHEN a patient's medication inventory falls below the threshold, THE System SHALL trigger the existing refill workflow
4. WHEN a refill is approved, THE System SHALL update the medication inventory in the care plan
5. THE System SHALL display refill status in the care plan medication list

## Special Requirements Guidance

### Parser and Serializer Requirements

This feature requires serialization of care plan data structures to and from JSON format for persistence.

**Care Plan Serialization:**
- WHEN a care plan is saved, THE System SHALL serialize it to JSON format
- WHEN a care plan is loaded, THE System SHALL deserialize it from JSON format
- THE System SHALL validate that serialization and deserialization preserve all care plan data (round-trip property)
- THE System SHALL handle nested structures (missions, medications, schedules) correctly during serialization

**Mission Schedule Serialization:**
- WHEN a mission schedule is saved, THE System SHALL serialize recurrence patterns to JSON
- WHEN a mission schedule is loaded, THE System SHALL deserialize recurrence patterns from JSON
- THE System SHALL validate that date/time information is preserved correctly during round-trip serialization
