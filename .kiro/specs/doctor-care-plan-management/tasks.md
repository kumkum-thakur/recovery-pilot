# Implementation Plan: Doctor Care Plan Management

## Overview

This implementation plan breaks down the Doctor Care Plan Management feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The implementation follows a bottom-up approach: data models → services → stores → UI components → integration.

## Tasks

- [x] 1. Set up data models and types
  - Create TypeScript interfaces for CarePlan, CarePlanMission, MissionSchedule, MedicationPrescription, and related types
  - Add CarePlanModel and related persistence models
  - Add storage keys for care plans and templates
  - Export all types from types/index.ts
  - _Requirements: 1.3, 2.6, 3.1, 4.2, 10.3_

- [ ] 2. Implement care plan persistence layer
  - [-] 2.1 Add care plan methods to PersistenceService
    - Implement getCarePlan, getCarePlansForPatient, getCarePlansForDoctor, saveCarePlan, deleteCarePlan
    - Add model conversion functions (carePlanModelToCarePlan, carePlanToCarePlanModel)
    - _Requirements: 10.1, 10.2_
  
  - [ ]* 2.2 Write property test for care plan persistence
    - **Property 1: Care plan persistence round-trip**
    - **Validates: Requirements 10.1, 10.2, S.3**
  
  - [ ]* 2.3 Write property test for unique identifiers
    - **Property 19: Care plan unique identifiers**
    - **Validates: Requirements 10.3**

- [ ] 3. Implement mission scheduling logic
  - [~] 3.1 Create mission generation service
    - Implement generateMissionInstances function that creates MissionModel instances from CarePlanMission
    - Handle one-time, daily, weekly, and custom recurrence patterns
    - Calculate due dates based on schedule configuration
    - _Requirements: 4.4, 4.2_
  
  - [ ]* 3.2 Write property test for recurring mission generation
    - **Property 4: Recurring mission instance generation**
    - **Validates: Requirements 4.4**
  
  - [ ]* 3.3 Write unit tests for mission generation edge cases
    - Test one-time missions
    - Test daily recurrence
    - Test weekly recurrence with specific days
    - Test custom interval recurrence
    - _Requirements: 4.4_

- [ ] 4. Implement medication mission generation
  - [~] 4.1 Create medication mission generator
    - Implement generateMedicationMissions function that creates MEDICATION_CHECK missions from MedicationPrescription
    - Calculate mission count based on frequency and duration
    - Space missions evenly throughout the day
    - _Requirements: 3.4, 11.4, 11.5_
  
  - [ ]* 4.2 Write property test for medication mission generation
    - **Property 5: Medication mission generation**
    - **Validates: Requirements 3.4, 11.5**
  
  - [ ]* 4.3 Write property test for medication mission spacing
    - **Property 6: Medication mission spacing**
    - **Validates: Requirements 11.4**

- [ ] 5. Implement validation logic
  - [~] 5.1 Create validation service
    - Implement validateCarePlan function
    - Implement validateMissionSchedule function
    - Implement validateMedicationPrescription function
    - Check required fields, date constraints, scheduling limits
    - _Requirements: 1.5, 2.2, 2.5, 3.1, 3.6, 4.5, 4.6, 13.4_
  
  - [ ]* 5.2 Write property test for required field validation
    - **Property 7: Required field validation**
    - **Validates: Requirements 1.5, 2.2, 2.5, 3.1, 3.6**
  
  - [ ]* 5.3 Write property test for date constraint validation
    - **Property 8: Date constraint validation**
    - **Validates: Requirements 4.5, 4.6**
  
  - [ ]* 5.4 Write property test for scheduling limit validation
    - **Property 9: Scheduling limit validation**
    - **Validates: Requirements 13.4**

- [~] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement CarePlanService
  - [~] 7.1 Create CarePlanService class
    - Implement createCarePlan, getCarePlan, getCarePlansForPatient, getCarePlansForDoctor
    - Implement updateCarePlan, archiveCarePlan
    - Implement addMissionToCarePlan, updateCarePlanMission, cancelCarePlanMission
    - Implement addMedicationToCarePlan, updateMedication, cancelMedication
    - Integrate with mission generation and validation logic
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.6, 3.1, 6.1, 7.1, 7.2, 14.1, 14.2_
  
  - [ ]* 7.2 Write property test for care plan-patient association
    - **Property 2: Care plan-patient association**
    - **Validates: Requirements 1.3, 6.1**
  
  - [ ]* 7.3 Write property test for mission-patient association
    - **Property 3: Mission-patient association**
    - **Validates: Requirements 2.6, 9.1**
  
  - [ ]* 7.4 Write property test for mission cancellation
    - **Property 11: Mission cancellation without deletion**
    - **Validates: Requirements 7.2, 6.5**
  
  - [ ]* 7.5 Write unit tests for CarePlanService
    - Test createCarePlan with valid and invalid inputs
    - Test updateCarePlan
    - Test archiveCarePlan
    - Test addMissionToCarePlan
    - Test addMedicationToCarePlan
    - _Requirements: 1.1, 1.3, 2.1, 3.1_

- [ ] 8. Implement care plan templates
  - [~] 8.1 Create default templates
    - Define templates for knee replacement, appendectomy, and general wound care
    - Store templates in persistence service
    - _Requirements: 5.1_
  
  - [~] 8.2 Implement template application logic
    - Implement applyTemplate function in CarePlanService
    - Adjust mission dates relative to current date
    - Pre-populate care plan with template data
    - _Requirements: 5.2, 5.4_
  
  - [ ]* 8.3 Write property test for template date adjustment
    - **Property 16: Template date adjustment**
    - **Validates: Requirements 5.4**
  
  - [ ]* 8.4 Write property test for template data population
    - **Property 17: Template data population**
    - **Validates: Requirements 5.2**
  
  - [ ]* 8.5 Write property test for template persistence
    - **Property 18: Template persistence round-trip**
    - **Validates: Requirements 5.5**

- [ ] 9. Implement CarePlanStore
  - [~] 9.1 Create CarePlanStore with Zustand
    - Implement state: carePlans, selectedCarePlan, templates, isLoading, error
    - Implement fetchCarePlansForDoctor, fetchCarePlansForPatient
    - Implement selectCarePlan, createCarePlan, updateCarePlan, archiveCarePlan
    - Implement addMission, updateMission, cancelMission
    - Implement addMedication, updateMedication, cancelMedication
    - Implement fetchTemplates, applyTemplate
    - _Requirements: 1.1, 1.4, 2.1, 3.1, 6.1, 7.1, 14.1_
  
  - [ ]* 9.2 Write unit tests for CarePlanStore
    - Test fetchCarePlansForDoctor
    - Test createCarePlan (success and error cases)
    - Test updateCarePlan
    - Test archiveCarePlan
    - Test addMission
    - Test addMedication
    - Test applyTemplate
    - _Requirements: 1.1, 2.1, 3.1_

- [~] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement integration with existing services
  - [~] 11.1 Update MissionStore to handle care plan missions
    - Modify fetchMissions to include care plan-generated missions
    - Ensure mission completion updates care plan status
    - _Requirements: 9.1, 9.2_
  
  - [~] 11.2 Integrate with medication tracker
    - Update addMedicationToCarePlan to register with medication tracker
    - Pass refill threshold to medication tracker
    - _Requirements: 3.5, 15.1, 15.2_
  
  - [~] 11.3 Integrate with refill engine
    - Ensure medication mission completion triggers refill check
    - Update care plan when refill is approved
    - _Requirements: 15.4_
  
  - [~] 11.4 Integrate with triage workflow
    - Ensure photo mission completion triggers triage
    - _Requirements: 9.3_
  
  - [ ]* 11.5 Write property test for mission status synchronization
    - **Property 12: Mission status synchronization**
    - **Validates: Requirements 9.2**
  
  - [ ]* 11.6 Write property test for photo mission triage integration
    - **Property 13: Photo mission triage integration**
    - **Validates: Requirements 9.3**
  
  - [ ]* 11.7 Write property test for medication mission tracker integration
    - **Property 14: Medication mission tracker integration**
    - **Validates: Requirements 9.4**
  
  - [ ]* 11.8 Write property test for medication tracker registration
    - **Property 15: Medication tracker registration**
    - **Validates: Requirements 3.5, 15.1, 15.2**
  
  - [ ]* 11.9 Write property test for refill status synchronization
    - **Property 28: Refill status synchronization**
    - **Validates: Requirements 15.4**

- [ ] 12. Implement MissionScheduleEditor component
  - [~] 12.1 Create MissionScheduleEditor component
    - Implement start date picker
    - Implement recurrence type selector (one-time, daily, weekly, custom)
    - Implement interval input for custom recurrence
    - Implement end date picker or occurrence count input
    - Implement time of day picker
    - Handle onChange events
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 12.2 Write unit tests for MissionScheduleEditor
    - Test rendering with different schedule configurations
    - Test onChange callbacks
    - Test validation display
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 13. Implement MedicationForm component
  - [~] 13.1 Create MedicationForm component
    - Implement medication name input
    - Implement dosage input
    - Implement frequency selector (times per day)
    - Implement duration input
    - Implement refill threshold input
    - Implement instructions textarea
    - Implement start date picker
    - Handle form submission and validation
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 13.2 Write unit tests for MedicationForm
    - Test form rendering
    - Test form validation
    - Test form submission
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 14. Implement TemplateSelector component
  - [~] 14.1 Create TemplateSelector component
    - Display list of templates grouped by category
    - Show template preview on hover
    - Handle template selection
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 14.2 Write unit tests for TemplateSelector
    - Test rendering with templates
    - Test template selection
    - _Requirements: 5.1, 5.2_

- [ ] 15. Implement CarePlanForm component
  - [~] 15.1 Create CarePlanForm component
    - Implement name and description fields
    - Implement mission list with add/edit/delete
    - Implement medication list with add/edit/delete
    - Integrate MissionScheduleEditor for mission scheduling
    - Integrate MedicationForm for medication entry
    - Integrate TemplateSelector for template application
    - Handle form submission and validation
    - Display validation errors
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 5.2, 5.3_
  
  - [ ]* 15.2 Write unit tests for CarePlanForm
    - Test form rendering
    - Test adding missions
    - Test adding medications
    - Test applying templates
    - Test form validation
    - Test form submission
    - _Requirements: 1.2, 2.1, 3.1_

- [~] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement CarePlanOverviewDashboard component
  - [~] 17.1 Create CarePlanOverviewDashboard component
    - Display list of patients with active care plans
    - Show completion percentage per patient
    - Highlight patients with overdue missions
    - Show pending action item count per patient
    - Handle patient selection for navigation
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 17.2 Write property test for completion percentage calculation
    - **Property 22: Care plan completion percentage calculation**
    - **Validates: Requirements 12.2**
  
  - [ ]* 17.3 Write property test for action item count accuracy
    - **Property 23: Pending action item count accuracy**
    - **Validates: Requirements 12.4**
  
  - [ ]* 17.4 Write unit tests for CarePlanOverviewDashboard
    - Test rendering with patient data
    - Test patient selection
    - Test completion percentage display
    - Test overdue mission highlighting
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 18. Implement CarePlanPanel component
  - [~] 18.1 Create CarePlanPanel component
    - Implement patient selector with search/filter
    - Display care plan list for selected patient
    - Show create new care plan button
    - Display care plan details when selected
    - Handle care plan selection and editing
    - Integrate CarePlanForm for creation/editing
    - Display validation warnings (too many missions, future dates)
    - _Requirements: 1.1, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4, 13.1, 13.2_
  
  - [ ]* 18.2 Write property test for patient search
    - **Property 21: Patient search functionality**
    - **Validates: Requirements 8.4**
  
  - [ ]* 18.3 Write property test for archived care plan filtering
    - **Property 20: Archived care plan filtering**
    - **Validates: Requirements 14.2, 14.3**
  
  - [ ]* 18.4 Write property test for mission schedule warnings
    - **Property 24: Mission schedule warning threshold**
    - **Property 25: Mission future date limit**
    - **Validates: Requirements 13.1, 13.2**
  
  - [ ]* 18.5 Write unit tests for CarePlanPanel
    - Test patient selection
    - Test care plan list display
    - Test care plan creation flow
    - Test care plan editing flow
    - Test search functionality
    - _Requirements: 1.1, 6.1, 8.1, 8.2_

- [ ] 19. Integrate CarePlanPanel into DoctorDashboard
  - [~] 19.1 Add care plan management tab to DoctorDashboard
    - Add navigation tab for "Care Plans"
    - Render CarePlanPanel when tab is selected
    - Pass doctor ID to CarePlanPanel
    - _Requirements: 1.1, 8.1_
  
  - [ ]* 19.2 Write integration test for doctor dashboard navigation
    - Test navigation to care plan panel
    - Test care plan panel rendering
    - _Requirements: 1.1_

- [ ] 20. Implement data integrity and validation properties
  - [ ]* 20.1 Write property test for completion history preservation
    - **Property 10: Mission completion history preservation**
    - **Validates: Requirements 6.4, 14.4**
  
  - [ ]* 20.2 Write property test for completed mission modification restriction
    - **Property 26: Completed mission modification restriction**
    - **Validates: Requirements 7.5**
  
  - [ ]* 20.3 Write property test for mission list synchronization
    - **Property 27: Mission list update synchronization**
    - **Validates: Requirements 7.4**
  
  - [ ]* 20.4 Write property test for mission data structure compatibility
    - **Property 29: Mission data structure compatibility**
    - **Validates: Requirements 9.5**
  
  - [ ]* 20.5 Write property test for referential integrity
    - **Property 30: Referential integrity**
    - **Validates: Requirements 10.4**

- [ ] 21. Implement error handling and user feedback
  - [~] 21.1 Add error handling to CarePlanService
    - Handle storage errors (quota exceeded, serialization errors)
    - Handle validation errors
    - Return user-friendly error messages
    - _Requirements: 10.5_
  
  - [~] 21.2 Add error display to UI components
    - Display validation errors in forms
    - Display storage errors with recovery suggestions
    - Display warnings for scheduling conflicts
    - _Requirements: 10.5, 13.1, 13.2, 13.3_
  
  - [ ]* 21.3 Write unit tests for error handling
    - Test storage quota exceeded
    - Test validation errors
    - Test error message display
    - _Requirements: 10.5_

- [~] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. End-to-end integration testing
  - [ ]* 23.1 Write integration test for complete care plan workflow
    - Doctor creates care plan → Missions generated → Patient sees missions → Patient completes mission → Status updates in care plan
    - _Requirements: 1.1, 2.1, 9.1, 9.2_
  
  - [ ]* 23.2 Write integration test for medication workflow
    - Doctor prescribes medication → Medication missions generated → Patient completes mission → Tracker updated → Refill triggered
    - _Requirements: 3.1, 3.4, 9.4, 15.1, 15.2_
  
  - [ ]* 23.3 Write integration test for photo mission workflow
    - Doctor assigns photo mission → Patient uploads photo → Triage triggered → Action item created
    - _Requirements: 9.3_
  
  - [ ]* 23.4 Write integration test for template application
    - Doctor selects template → Care plan pre-populated → Doctor saves → Missions generated correctly
    - _Requirements: 5.2, 5.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- The implementation follows a bottom-up approach: data models → services → stores → UI components → integration
- All care plan missions integrate seamlessly with the existing mission system
- Medication prescriptions integrate with the existing medication tracker and refill engine
