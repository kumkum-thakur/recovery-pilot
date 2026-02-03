# Implementation Plan: RecoveryPilot Enhancements

## Overview

This implementation plan breaks down the RecoveryPilot enhancements into discrete coding tasks. The plan follows an incremental approach, building core infrastructure first, then adding features layer by layer, with testing integrated throughout. Each task builds on previous work and includes checkpoint tasks to ensure quality.

## Tasks

- [x] 1. Set up authentication and authorization infrastructure
  - [x] 1.1 Create UserRole enum and role-based types
    - Define TypeScript enums and interfaces for Admin, Doctor, Patient roles
    - Create AuthToken interface with userId, role, and expiration
    - _Requirements: 6.2_
  
  - [x] 1.2 Implement AuthService for authentication and authorization
    - Create authenticate() method for credential verification
    - Create verifyToken() method for token validation
    - Create hasPermission() method for role-based access control
    - _Requirements: 6.1, 1.7_
  
  - [ ]* 1.3 Write property test for role assignment uniqueness
    - **Property 6: Role assignment uniqueness**
    - **Validates: Requirements 6.2**
  
  - [ ]* 1.4 Write property test for authentication requirement
    - **Property 8: Authentication requirement**
    - **Validates: Requirements 6.1**
  
  - [ ]* 1.5 Write property test for role-based feature access
    - **Property 7: Role-based feature access**
    - **Validates: Requirements 6.3, 6.4, 6.5, 6.6**

- [x] 2. Implement user management service and data models
  - [x] 2.1 Create User and PatientDoctorRelationship data models
    - Define User interface with id, username, role, email, etc.
    - Define PatientDoctorRelationship interface with patient/doctor IDs
    - Create database schema or storage structure
    - _Requirements: 1.4, 2.1_
  
  - [x] 2.2 Implement UserManagementService
    - Create createUser() method with validation
    - Create getAllUsers() method for admin access
    - Create assignPatientToDoctor() method
    - Create getPatientsForDoctor() method
    - Create removePatientFromDoctor() method
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.3_
  
  - [ ]* 2.3 Write property test for user creation validation
    - **Property 4: User creation validation**
    - **Validates: Requirements 1.6**
  
  - [ ]* 2.4 Write property test for care relationship creation
    - **Property 2: Care relationship creation**
    - **Validates: Requirements 1.4, 2.1**
  
  - [ ]* 2.5 Write property test for duplicate assignment prevention
    - **Property 11: Duplicate assignment prevention**
    - **Validates: Requirements 2.4**
  
  - [ ]* 2.6 Write unit tests for error handling
    - Test duplicate username returns 409 Conflict
    - Test invalid user data returns 400 Bad Request
    - Test user not found returns 404 Not Found
    - _Requirements: 1.6_

- [x] 3. Build Admin Dashboard UI
  - [x] 3.1 Create AdminDashboard component with routing
    - Set up admin route with role-based access guard
    - Create main dashboard layout
    - _Requirements: 1.7_
  
  - [x] 3.2 Implement user creation forms
    - Create form for adding new doctors (username, email, specialization)
    - Create form for adding new patients (username, email, date of birth)
    - Add form validation and error display
    - _Requirements: 1.1, 1.2, 1.6_
  
  - [x] 3.3 Implement user list display
    - Create table/list component showing all users
    - Display user role, name, email, created date
    - Add filtering by role (Admin/Doctor/Patient)
    - _Requirements: 1.3_
  
  - [x] 3.4 Implement patient-doctor assignment interface
    - Create dropdown to select patient and doctor
    - Add "Assign" button to create relationship
    - Display current assignments in a table
    - Add "Remove" button to delete relationships
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 3.5 Write property test for user list completeness
    - **Property 1: User list completeness**
    - **Validates: Requirements 1.3**
  
  - [ ]* 3.6 Write property test for assignment display completeness
    - **Property 3: Assignment display completeness**
    - **Validates: Requirements 1.5**
  
  - [ ]* 3.7 Write unit tests for UI rendering
    - Test doctor creation form renders with correct fields
    - Test patient creation form renders with correct fields
    - _Requirements: 1.1, 1.2_

- [ ] 4. Checkpoint - Ensure admin features work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Build Doctor Patient Management UI
  - [ ] 5.1 Create DoctorPatientManagement component
    - Add section to doctor dashboard for patient management
    - Create "Add Patient" interface
    - _Requirements: 2.1_
  
  - [ ] 5.2 Implement patient list display for doctors
    - Display all patients assigned to the logged-in doctor
    - Show patient name, ID, assignment date
    - Add "Remove" button for each patient
    - _Requirements: 2.2, 2.3_
  
  - [ ] 5.3 Wire patient data access to doctor interface
    - Ensure doctors can view data only for assigned patients
    - Implement data filtering based on care relationships
    - _Requirements: 2.5, 7.1_
  
  - [ ]* 5.4 Write property test for patient list completeness
    - **Property 9: Patient list completeness for doctors**
    - **Validates: Requirements 2.2**
  
  - [ ]* 5.5 Write property test for care relationship deletion
    - **Property 10: Care relationship deletion**
    - **Validates: Requirements 2.3**
  
  - [ ]* 5.6 Write property test for data access after assignment
    - **Property 12: Data access after assignment**
    - **Validates: Requirements 2.5**

- [ ] 6. Implement data privacy and access control
  - [ ] 6.1 Create data access middleware
    - Implement middleware to filter queries based on user role
    - Ensure doctors only see assigned patients
    - Ensure patients only see their own data
    - Ensure admins see all data
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 6.2 Implement audit logging for data access
    - Create audit log data model
    - Log all patient data access with user ID, timestamp, action
    - _Requirements: 7.5_
  
  - [ ]* 6.3 Write property test for doctor patient visibility restriction
    - **Property 26: Doctor patient visibility restriction**
    - **Validates: Requirements 7.1**
  
  - [ ]* 6.4 Write property test for unauthorized access prevention
    - **Property 28: Unauthorized patient data access prevention**
    - **Validates: Requirements 7.3**
  
  - [ ]* 6.5 Write property test for patient self-data restriction
    - **Property 29: Patient self-data restriction**
    - **Validates: Requirements 7.4**
  
  - [ ]* 6.6 Write property test for audit logging
    - **Property 30: Data access audit logging**
    - **Validates: Requirements 7.5**

- [ ] 7. Checkpoint - Ensure access control works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Enhance Wound Analysis System with test scenarios
  - [ ] 8.1 Add TestScenario enum and scenario state management
    - Create TestScenario enum (SCENARIO_HAPPY_PATH, SCENARIO_RISK_DETECTED, PRODUCTION)
    - Add state variable to track current scenario
    - Create setTestScenario() and getCurrentScenario() methods
    - _Requirements: 3.1, 3.3_
  
  - [ ] 8.2 Modify analyzeWound() to respect test scenarios
    - When SCENARIO_HAPPY_PATH is active, return 92% confidence with GREEN status
    - When SCENARIO_RISK_DETECTED is active, return 85% confidence with RED status
    - When PRODUCTION is active, use actual AI analysis
    - _Requirements: 3.2, 3.4_
  
  - [ ] 8.3 Implement notification logic based on risk status
    - When analysis returns GREEN, do not create action item
    - When analysis returns RED, create action item for assigned doctor
    - _Requirements: 3.5, 3.6_
  
  - [ ]* 8.4 Write property test for green status notification suppression
    - **Property 13: Green status notification suppression**
    - **Validates: Requirements 3.5**
  
  - [ ]* 8.5 Write property test for red status notification creation
    - **Property 14: Red status notification creation**
    - **Validates: Requirements 3.6**
  
  - [ ]* 8.6 Write unit tests for test scenarios
    - Test SCENARIO_HAPPY_PATH returns exactly 92% confidence and GREEN
    - Test SCENARIO_RISK_DETECTED returns exactly 85% confidence and RED
    - _Requirements: 3.2, 3.4_

- [-] 9. Build Debug Menu UI
  - [ ] 9.1 Create DebugMenu component with keyboard shortcut
    - Create modal/overlay component for debug menu
    - Add keyboard listener for Ctrl+Shift+D to toggle menu
    - _Requirements: 3.1, 3.3, 3.7_
  
  - [ ] 9.2 Add scenario selection controls
    - Create radio buttons or dropdown for scenario selection
    - Display current active scenario
    - Wire to WoundAnalysisSystem.setTestScenario()
    - _Requirements: 3.1, 3.3_
  
  - [ ] 9.3 Implement mission reset functionality
    - Add "Reset Mission" button with mission selector
    - Implement resetMission() method to restore mission to initial state
    - Update mission status to RESET and clear completion data
    - _Requirements: 3.7, 3.8_
  
  - [ ]* 9.4 Write property test for mission reset restoration
    - **Property 15: Mission reset restoration**
    - **Validates: Requirements 3.8**
  
  - [ ]* 9.5 Write unit tests for debug menu UI
    - Test debug menu displays both scenario options
    - Test mission reset button is present
    - _Requirements: 3.1, 3.3, 3.7_

- [ ] 10. Checkpoint - Ensure testing features work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement medication inventory tracking
  - [ ] 11.1 Create MedicationInventory data model
    - Define MedicationInventory interface with tablet count and threshold
    - Create database schema or storage structure
    - Set default refill threshold to 3 days supply
    - _Requirements: 4.1, 5.1_
  
  - [ ] 11.2 Implement MedicationTracker service
    - Create recordMedicationTaken() method to decrement tablet count
    - Create getTabletCount() method
    - Create checkRefillNeeded() method
    - Create getMedicationDetails() method
    - Add validation to prevent negative tablet counts
    - _Requirements: 4.1, 4.2, 4.4, 5.1_
  
  - [ ] 11.3 Update medication mission to track inventory
    - Modify medication mission to call recordMedicationTaken() when marked complete
    - Persist tablet count updates immediately
    - _Requirements: 4.2, 4.5_
  
  - [ ]* 11.4 Write property test for tablet count persistence
    - **Property 16: Tablet count persistence**
    - **Validates: Requirements 4.1**
  
  - [ ]* 11.5 Write property test for medication consumption decrement
    - **Property 17: Medication consumption decrement**
    - **Validates: Requirements 4.2**
  
  - [ ]* 11.6 Write property test for non-negative invariant
    - **Property 19: Non-negative tablet count invariant**
    - **Validates: Requirements 4.4**
  
  - [ ]* 11.7 Write property test for update persistence round-trip
    - **Property 20: Tablet count update persistence**
    - **Validates: Requirements 4.5**
  
  - [ ]* 11.8 Write unit tests for edge cases
    - Test attempting to take medication when count is zero
    - Test setting negative tablet count is rejected
    - _Requirements: 4.4_

- [ ] 12. Update medication UI to display tablet count
  - [ ] 12.1 Modify MedicationMissionCard component
    - Add display of current tablet count
    - Show "X tablets remaining" text
    - Update display after medication is taken
    - _Requirements: 4.3_
  
  - [ ]* 12.2 Write property test for tablet count display
    - **Property 18: Tablet count display**
    - **Validates: Requirements 4.3**

- [ ] 13. Implement automatic refill ordering system
  - [ ] 13.1 Create RefillRequest data model and RefillEngine service
    - Define RefillRequest and RefillOutcome interfaces
    - Create RefillEngine with requestRefill() method
    - Create hasActiveRefill() method to check for duplicates
    - Create completeRefill() method
    - _Requirements: 5.2, 5.6_
  
  - [ ] 13.2 Implement refill trigger logic
    - After recordMedicationTaken(), check if tablet count <= threshold
    - If threshold reached, call RefillEngine.requestRefill()
    - Check for duplicate requests within 24 hours before triggering
    - _Requirements: 5.2, 5.6_
  
  - [ ] 13.3 Integrate with Agent Workflow
    - Invoke existing agent workflow when refill is requested
    - Pass medication and patient information to workflow
    - Ensure workflow performs insurance verification
    - Ensure workflow performs pharmacy inventory check
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [ ] 13.4 Implement refill completion and notification
    - Handle workflow completion callback
    - Update refill request status
    - Send notification to patient with outcome
    - _Requirements: 5.7_
  
  - [ ]* 13.5 Write property test for refill threshold existence
    - **Property 21: Refill threshold existence**
    - **Validates: Requirements 5.1**
  
  - [ ]* 13.6 Write property test for low inventory trigger
    - **Property 22: Low inventory refill trigger**
    - **Validates: Requirements 5.2**
  
  - [ ]* 13.7 Write property test for workflow invocation
    - **Property 23: Refill workflow invocation**
    - **Validates: Requirements 5.3, 5.4, 5.5**
  
  - [ ]* 13.8 Write property test for duplicate prevention
    - **Property 24: Duplicate refill prevention**
    - **Validates: Requirements 5.6**
  
  - [ ]* 13.9 Write property test for completion notification
    - **Property 25: Refill completion notification**
    - **Validates: Requirements 5.7**
  
  - [ ]* 13.10 Write unit tests for refill workflow integration
    - Test insurance verification is called
    - Test pharmacy check is called
    - Test workflow failure handling
    - _Requirements: 5.3, 5.4, 5.5_

- [ ] 14. Final checkpoint - Integration testing
  - [ ] 14.1 Test end-to-end admin workflow
    - Create admin user, log in, create doctor and patient accounts
    - Assign patient to doctor, verify relationship appears
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 14.2 Test end-to-end doctor workflow
    - Log in as doctor, view assigned patients
    - Add new patient to care list, remove patient from care list
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 14.3 Test end-to-end medication tracking workflow
    - Set up medication with 5 tablets, threshold of 3
    - Take medication twice (count should be 3)
    - Take medication once more (count should be 2, refill should trigger)
    - Verify refill request created and workflow invoked
    - _Requirements: 4.2, 5.2, 5.3_
  
  - [ ] 14.4 Test end-to-end wound analysis workflow
    - Switch to SCENARIO_RISK_DETECTED in debug menu
    - Upload wound photo as patient
    - Verify doctor receives action item notification
    - Switch to SCENARIO_HAPPY_PATH
    - Upload wound photo, verify no notification
    - _Requirements: 3.2, 3.4, 3.5, 3.6_
  
  - [ ] 14.5 Test access control across all features
    - Verify admin can access admin dashboard
    - Verify doctor cannot access admin dashboard
    - Verify patient cannot access doctor features
    - Verify doctors only see assigned patients
    - _Requirements: 1.7, 6.3, 6.4, 6.5, 7.1, 7.3_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally: auth → user management → admin UI → doctor UI → access control → wound analysis → medication tracking → refills
- Integration testing at the end verifies all features work together correctly

