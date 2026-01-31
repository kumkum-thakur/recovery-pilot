# Implementation Plan: RecoveryPilot

> **Multi-Agent Coordination:** If multiple agents/developers are working on this project, use `task-assignments.md` to coordinate work and avoid conflicts. Claim tasks before starting!

## Overview

This implementation plan breaks down the RecoveryPilot autonomous care orchestrator into discrete, incremental coding tasks. The approach follows a bottom-up strategy: establishing core infrastructure (routing, state management, services) first, then building patient features, followed by doctor features, and finally integrating gamification and polish.

**FOCUS: BUILD FIRST, TEST LATER** - All testing tasks have been moved to the end. The priority is to build a working application first, then add comprehensive tests afterward.

## Agent Task Assignments

**AGENT 1 - Backend & Infrastructure Focus:**
- Tasks 1-8: Core infrastructure, services, stores, routing
- Tasks 21: Error handling
- Tasks 25-29: Backend/service testing

**AGENT 2 - Frontend & UI Focus:**
- Tasks 9-20: All UI components (Login, Patient Dashboard, Doctor Dashboard)
- Tasks 22-24: Polish, accessibility, and manual testing
- Tasks 30-43: Frontend component testing

### Detailed Task Breakdown

**AGENT 1 Responsibilities:**
1. ✓ Task 1: Project setup and core infrastructure
2. ✓ Task 2: Define core TypeScript interfaces and types
3. ✓ Task 3: Implement Persistence Service with LocalStorage
4. ✓ Task 4: Implement Authentication Service
5. ✓ Task 5: Implement Zustand stores (UserStore, MissionStore, AgentStore, ActionItemStore)
6. ✓ Task 6: Checkpoint - Core infrastructure complete
7. Task 7: Implement Mock Agent Service (triage workflow, refill workflow, scenario config)
8. Task 8: Implement routing and navigation
9. Task 21: Implement error handling and edge cases
10. Task 25-29: Write backend/service tests (persistence, auth, stores, agent service)

**AGENT 2 Responsibilities:**
1. Task 9: Build Login page
2. Task 10: Build Patient Dashboard core layout
3. Task 11: Build Mission Stream components
4. Task 12: Build Photo Capture functionality
5. Task 13: Build Agent Status Toast
6. Task 14: Build Triage Result Display
7. Task 15: Checkpoint - Patient dashboard core features complete
8. Task 16: Build Gamification features (streak, celebration, notifications)
9. Task 17: Build Doctor Dashboard core layout
10. Task 18: Build Triage Inbox components
11. Task 19: Build Action Item Review functionality
12. Task 20: Checkpoint - Doctor dashboard complete
13. Task 22: Polish and accessibility
14. Task 23: Manual end-to-end testing
15. Task 24: Checkpoint - Application complete and ready for testing
16. Task 30-41: Write frontend component tests (routing, login, dashboards, components)

**BOTH AGENTS:**
- Task 42-43: Run full test suite and final checkpoint

## Tasks

### AGENT 1 TASKS - Core Infrastructure & Backend

- [-] 1. Project setup and core infrastructure
  - Initialize Vite + React project with TypeScript
  - Configure Tailwind CSS with custom theme (medical whites/blues, gamification orange/purple)
  - Install dependencies: zustand, react-router-dom, lucide-react, framer-motion, fast-check, vitest
  - Set up project structure: /components, /stores, /services, /pages, /types
  - Configure Vitest for testing
  - _Requirements: Technical Constraints 1, 2_

- [x] 2. Define core TypeScript interfaces and types
  - Create types for User, Mission, ActionItem, AgentStep models
  - Create types for store interfaces (UserStore, MissionStore, AgentStore, ActionItemStore)
  - Create types for service interfaces (AuthService, AgentService, PersistenceService)
  - Create enums for mission types, action item types, statuses
  - _Requirements: 1.3, 2.3, 3.1, 7.1, 8.1_

- [ ] 3. Implement Persistence Service with LocalStorage
  - [x] 3.1 Create PersistenceService with generic CRUD operations
    - Implement get, set, update, delete methods
    - Implement domain-specific methods: getUser, saveUser, getMissions, etc.
    - Add JSON serialization/deserialization with error handling
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [x] 3.2 Create seed data (SEED_USERS, SEED_MISSIONS)
    - Define default patient (Divya) and doctor (Dr. Smith)
    - Define initial missions for testing
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 4. Implement Authentication Service
  - [x] 4.1 Create AuthService with login/logout functionality
    - Implement simple password hashing for MVP
    - Implement credential validation
    - Implement session management
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 5. Implement Zustand stores
  - [x] 5.1 Create UserStore
    - Implement state: currentUser, isAuthenticated
    - Implement actions: login, logout, updateStreak
    - Integrate with AuthService and PersistenceService
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 10.1, 10.2_
  
  - [x] 5.2 Create MissionStore
    - Implement state: missions, isLoading
    - Implement actions: fetchMissions, completeMission, uploadPhoto
    - Integrate with PersistenceService
    - _Requirements: 3.1, 3.2, 3.3, 5.3, 10.1_
  
  - [x] 5.3 Create AgentStore
    - Implement state: currentWorkflow, isProcessing
    - Implement actions: startTriageWorkflow, startRefillWorkflow, clearWorkflow
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [-] 5.4 Create ActionItemStore
    - Implement state: actionItems, isLoading
    - Implement actions: fetchActionItems, approveItem, rejectItem
    - Integrate with PersistenceService
    - _Requirements: 8.1, 9.1, 9.2, 9.3, 9.4_

- [x] 6. Checkpoint - Core infrastructure complete
  - Verify all stores are working with persistence
  - Verify authentication flow works end-to-end
  - Test that seed data loads correctly
  - Ask user if questions arise

- [ ] 7. Implement Mock Agent Service
  - [x] 7.1 Create workflow step simulator
    - Implement simulateWorkflowSteps generator function
    - Add configurable delays for each step
    - _Requirements: 7.1, 7.2_
  
  - [x] 7.2 Implement triage workflow (analyzeWoundImage)
    - Create multi-step workflow: Analyzing, Drafting Note, Creating Appointment
    - Implement scenario-based results (Green vs Red)
    - Create action items for Red results
    - Store confidence scores
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1_
  
  - [~] 7.3 Implement refill workflow (processRefillRequest)
    - Create multi-step workflow: Checking Inventory, Verifying Insurance, Order Placed
    - Implement mock insurance/inventory checks
    - Create action items for doctor review
    - _Requirements: 7.2_
  
  - [~] 7.4 Implement demo scenario configuration
    - Create ConfigModel for scenario switching
    - Implement SCENARIO_HAPPY_PATH and SCENARIO_RISK_DETECTED
    - Add debug menu toggle (hidden UI or code flag)
    - _Requirements: 15.1, 15.2_

- [~] 8. Implement routing and navigation
  - Set up React Router with routes: /, /login, /patient, /doctor
  - Create ProtectedRoute component for authenticated routes
  - Implement role-based routing (patients → /patient, doctors → /doctor)
  - Add navigation guards and redirects
  - _Requirements: 1.1, 2.1_

### AGENT 2 TASKS - Frontend UI Components

- [ ] 9. Build Login page
  - [x] 9.1 Create LoginPage component
    - Build form with username and password fields
    - Add role selection (patient/doctor) or auto-detect from credentials
    - Implement form validation
    - Connect to UserStore login action
    - Display authentication errors
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 10. Build Patient Dashboard core layout
  - [x] 10.1 Create PatientDashboard page component
    - Implement mobile-first responsive layout
    - Add Header with StreakDisplay and ProfileButton
    - Add main content area for MissionStream
    - Ensure minimum 44px tap targets
    - Ensure minimum 16px body text
    - _Requirements: 3.4, 10.3, 13.1, 13.2, 13.3, 13.4_

- [ ] 11. Build Mission Stream components
  - [~] 11.1 Create MissionCard component
    - Display mission title, description, status
    - Implement SmartActionButton with context-aware text
    - Add mission icons from lucide-react
    - Style with Tailwind (medical whites/blues)
    - _Requirements: 3.2, 3.3, 4.1, 4.2, 4.3_
  
  - [~] 11.2 Create MissionStream component
    - Fetch missions from MissionStore on mount
    - Render list of MissionCard components
    - Implement empty state with encouraging message
    - Handle loading states
    - _Requirements: 3.1_

- [ ] 12. Build Photo Capture functionality
  - [~] 12.1 Create PhotoCaptureModal component
    - Implement camera access using browser File API
    - Add file upload fallback
    - Display image preview before submission
    - Add submit and cancel buttons
    - Handle camera permission errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [~] 12.2 Integrate photo upload with MissionStore
    - Connect PhotoCaptureModal to uploadPhoto action
    - Trigger AI analysis on submission
    - Update mission status to completed
    - _Requirements: 5.3, 6.1_

- [ ] 13. Build Agent Status Toast
  - [~] 13.1 Create AgentStatusToast component
    - Display workflow steps in a toast/card UI
    - Show step status: pending, in_progress, completed
    - Animate step transitions
    - Auto-dismiss on workflow completion
    - _Requirements: 7.3_
  
  - [~] 13.2 Integrate with AgentStore
    - Subscribe to currentWorkflow state
    - Display toast when workflow starts
    - Update steps as workflow progresses
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 14. Build Triage Result Display
  - [~] 14.1 Create TriageResultCard component
    - Display Green results with positive feedback
    - Display Red results with action item notification
    - Show confidence score
    - Style with appropriate colors (green for good, red for risk)
    - _Requirements: 6.3, 6.4, 6.5_

- [ ] 15. Checkpoint - Patient dashboard core features complete
  - Test mission stream displays correctly
  - Test photo upload and triage workflow end-to-end
  - Test agent status toast shows workflow steps
  - Verify mobile responsiveness
  - Ask user if questions arise

- [ ] 16. Build Gamification features
  - [~] 16.1 Create StreakDisplay component
    - Display current streak count prominently
    - Add fire emoji or icon for visual appeal
    - Style with gamification colors (orange/purple)
    - _Requirements: 10.3_
  
  - [~] 16.2 Implement streak tracking logic
    - Increment streak on all missions completed
    - Reset streak on missed day
    - Persist streak across sessions
    - _Requirements: 10.1, 10.2, 10.4_
  
  - [~] 16.3 Create CelebrationOverlay component
    - Implement confetti animation using framer-motion
    - Trigger on mission completion
    - Trigger enhanced animation on streak milestones
    - Auto-dismiss after 2 seconds
    - _Requirements: 11.3_
  
  - [~] 16.4 Add encouraging notification text
    - Implement friendly, humorous messages for mission completion
    - Examples: "You crushed that pill schedule! 💊", "Incision looking sharp! (Not literally) ✨"
    - _Requirements: 11.2_

- [ ] 17. Build Doctor Dashboard core layout
  - [~] 17.1 Create DoctorDashboard page component
    - Implement desktop-optimized layout (1024px+)
    - Add Header with NotificationBadge and ProfileButton
    - Add main content area for TriageInbox
    - Implement multi-column layout for wide screens
    - Add keyboard navigation shortcuts
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 18. Build Triage Inbox components
  - [~] 18.1 Create ActionItemCard component
    - Display patient name, request type, created date
    - Conditionally render TriageDetails or RefillDetails based on type
    - Show Approve and Reject buttons
    - Style with clean medical aesthetic
    - _Requirements: 8.2, 8.3, 8.4, 9.1_
  
  - [~] 18.2 Create TriageDetails sub-component
    - Display wound image
    - Display AI analysis text and category (Green/Red)
    - Display confidence score
    - _Requirements: 8.4_
  
  - [~] 18.3 Create RefillDetails sub-component
    - Display medication name
    - Display insurance verification status
    - Display inventory availability
    - _Requirements: 8.3_
  
  - [~] 18.4 Create TriageInbox component
    - Fetch action items from ActionItemStore on mount
    - Render list of ActionItemCard components in priority order
    - Implement empty state: "All caught up! No pending items to review. ✨"
    - Handle loading states
    - _Requirements: 8.1_

- [ ] 19. Build Action Item Review functionality
  - [~] 19.1 Implement approve action
    - Connect Approve button to ActionItemStore.approveItem
    - Update action item status to "approved"
    - Record timestamp
    - Show success toast notification
    - _Requirements: 9.2, 9.4_
  
  - [~] 19.2 Create RejectionModal component
    - Display textarea for rejection reason
    - Add submit and cancel buttons
    - Validate that reason is not empty
    - _Requirements: 9.3_
  
  - [~] 19.3 Implement reject action
    - Connect Reject button to open RejectionModal
    - Connect modal submit to ActionItemStore.rejectItem
    - Update action item status to "rejected"
    - Record timestamp and reason
    - Show success toast notification
    - _Requirements: 9.3, 9.4_

- [ ] 20. Checkpoint - Doctor dashboard complete
  - Test action item inbox displays correctly
  - Test approve and reject workflows end-to-end
  - Test multi-column layout on wide screens
  - Test keyboard shortcuts work
  - Ask user if questions arise

### AGENT 1 TASKS - Error Handling

- [ ] 21. Implement error handling and edge cases
  - [~] 21.1 Add error boundaries for React components
    - Catch and display component errors gracefully
    - Log errors for debugging
  
  - [~] 21.2 Add error handling for authentication
    - Display user-friendly error messages
    - Handle session expiration
    - _Requirements: 1.2, 2.2_
  
  - [~] 21.3 Add error handling for photo upload
    - Handle unsupported formats
    - Handle file size limits
    - Handle camera access denied
    - _Requirements: 5.4_
  
  - [~] 21.4 Add error handling for agent workflows
    - Handle workflow timeouts
    - Handle partial workflow completion
    - Display retry options
    - _Requirements: 7.1, 7.2_
  
  - [~] 21.5 Add error handling for data persistence
    - Handle LocalStorage full
    - Handle data corruption
    - Reinitialize with seed data on corruption
    - _Requirements: 12.4_

### AGENT 2 TASKS - Polish & Accessibility

- [ ] 22. Polish and accessibility
  - [~] 22.1 Add loading states and skeletons
    - Add skeleton loaders for mission stream
    - Add skeleton loaders for action item inbox
    - Add loading spinners for async actions
  
  - [~] 22.2 Add animations and transitions
    - Add smooth transitions for mission completion
    - Add hover effects on interactive elements
    - Add focus indicators for keyboard navigation
  
  - [~] 22.3 Improve accessibility
    - Add ARIA labels to all interactive elements
    - Ensure keyboard navigation works throughout
    - Test with screen reader
    - Ensure color contrast meets WCAG AA standards
  
  - [~] 22.4 Add empty states
    - Implement encouraging empty state for missions
    - Implement positive empty state for action items
    - _Requirements: 3.1, 8.1_

- [ ] 23. Manual end-to-end testing
  - [~] 23.1 End-to-end testing of patient flow
    - Test login → view missions → upload photo → see triage result → streak update
    - Test both Green and Red triage scenarios
    - Test refill request workflow
  
  - [~] 23.2 End-to-end testing of doctor flow
    - Test login → view action items → approve item → verify patient notification
    - Test reject with reason
    - Test empty inbox state
  
  - [~] 23.3 Test demo scenario switching
    - Verify SCENARIO_HAPPY_PATH produces Green results
    - Verify SCENARIO_RISK_DETECTED produces Red results
    - Test deterministic behavior across multiple runs
    - _Requirements: 15.1, 15.2_

- [ ] 24. Checkpoint - Application complete and ready for testing
  - Verify all features work end-to-end
  - Test on multiple devices and browsers
  - Verify responsive design on mobile and desktop
  - Ensure all error handling works correctly
  - Ask user for final feedback before adding tests

---

## TESTING PHASE - Add tests after app is working

### AGENT 1 TASKS - Backend & Service Testing

- [ ] 25. Unit tests for project configuration
  - [ ] 25.1 Write unit tests for project configuration
    - Test that Tailwind theme colors are correctly configured
    - Test that all required dependencies are installed
    - _Requirements: Technical Constraints 1_

- [ ] 26. Property tests for Persistence Service
  - [ ] 26.1 Write property test for JSON serialization validity
    - **Property 28: JSON Serialization Validity**
    - **Validates: Requirements 12.4**
  
  - [ ] 26.2 Write property test for data persistence round-trip
    - **Property 27: Data Persistence Round-Trip**
    - **Validates: Requirements 12.2, 12.3**

- [ ] 27. Tests for Authentication Service
  - [ ] 27.1 Write property test for authentication success and failure
    - **Property 1: Authentication Success and Failure**
    - **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
  
  - [ ] 27.2 Write unit tests for authentication edge cases
    - Test empty credentials
    - Test SQL injection attempts
    - Test session expiration
    - _Requirements: 1.2, 2.2_

- [ ] 28. Property tests for Zustand stores
  - [ ] 28.1 Write property test for profile persistence round-trip
    - **Property 2: Profile Data Persistence Round-Trip**
    - **Validates: Requirements 1.3, 2.3, 12.1**
  
  - [ ] 28.2 Write property test for streak persistence round-trip
    - **Property 3: Streak Persistence Round-Trip**
    - **Validates: Requirements 1.4, 10.4**

- [ ] 29. Tests for Mock Agent Service
  - [ ] 29.1 Write property test for triage workflow execution
    - **Property 14: Red Triage Workflow Execution**
    - **Validates: Requirements 7.1**
  
  - [ ] 29.2 Write property test for triage result categorization
    - **Property 10: Triage Result Categorization**
    - **Validates: Requirements 6.2**
  
  - [ ] 29.3 Write property test for refill workflow execution
    - **Property 15: Refill Workflow Execution**
    - **Validates: Requirements 7.2**
  
  - [ ] 29.4 Write property test for scenario determinism
    - **Property 34: Scenario Determinism**
    - **Validates: Requirements 15.2**

### AGENT 2 TASKS - Frontend Component Testing

- [ ] 30. Tests for routing and navigation
  - [ ] 30.1 Write unit tests for routing logic
    - Test unauthenticated users redirect to /login
    - Test patients cannot access /doctor
    - Test doctors cannot access /patient
    - _Requirements: 1.1, 2.1_

- [ ] 31. Tests for Login page
  - [ ] 31.1 Write unit tests for login form
    - Test form validation
    - Test error message display
    - Test successful login redirects
    - _Requirements: 1.2, 2.2_

- [ ] 32. Tests for Patient Dashboard
  - [ ] 32.1 Write property test for responsive viewport rendering
    - **Property 29: Responsive Viewport Rendering**
    - **Validates: Requirements 13.1, 13.3, 14.1**
  
  - [ ] 32.2 Write property test for touch target minimum size
    - **Property 30: Touch Target Minimum Size**
    - **Validates: Requirements 13.2**
  
  - [ ] 32.3 Write property test for text readability size
    - **Property 31: Text Readability Size**
    - **Validates: Requirements 13.4**

- [ ] 33. Tests for Mission Stream components
  - [ ] 33.1 Write property test for mission display completeness
    - **Property 4: Mission Stream Display Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ] 33.2 Write property test for smart action button adaptation
    - **Property 5: Smart Action Button Context Adaptation**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [ ] 33.3 Write property test for action button execution
    - **Property 6: Action Button Execution**
    - **Validates: Requirements 4.4**

- [ ] 34. Tests for Photo Capture functionality
  - [ ] 34.1 Write property test for photo preview display
    - **Property 7: Photo Preview Display**
    - **Validates: Requirements 5.2**
  
  - [ ] 34.2 Write unit tests for photo upload edge cases
    - Test unsupported file formats
    - Test file size limits
    - Test camera access denied
    - _Requirements: 5.4_
  
  - [ ] 34.3 Write property test for photo submission triggers analysis
    - **Property 8: Photo Submission Triggers Analysis**
    - **Validates: Requirements 5.3**

- [ ] 35. Tests for Agent Status Toast
  - [ ] 35.1 Write property test for agent workflow visibility
    - **Property 16: Agent Workflow Visibility**
    - **Validates: Requirements 7.3**

- [ ] 36. Tests for Triage Result Display
  - [ ] 36.1 Write property test for green result feedback
    - **Property 11: Green Result Feedback**
    - **Validates: Requirements 6.3**
  
  - [ ] 36.2 Write property test for red result action item creation
    - **Property 12: Red Result Action Item Creation**
    - **Validates: Requirements 6.4**
  
  - [ ] 36.3 Write property test for confidence score storage
    - **Property 13: Confidence Score Storage**
    - **Validates: Requirements 6.5**

- [ ] 37. Tests for Gamification features
  - [ ] 37.1 Write property test for streak display visibility
    - **Property 25: Streak Display Visibility**
    - **Validates: Requirements 10.3**
  
  - [ ] 37.2 Write property test for streak increment
    - **Property 23: Streak Increment on Completion**
    - **Validates: Requirements 10.1**
  
  - [ ] 37.3 Write property test for streak reset
    - **Property 24: Streak Reset on Miss**
    - **Validates: Requirements 10.2**
  
  - [ ] 37.4 Write property test for milestone confetti trigger
    - **Property 26: Milestone Confetti Trigger**
    - **Validates: Requirements 11.3**

- [ ] 38. Tests for Doctor Dashboard
  - [ ] 38.1 Write property test for multi-column layout activation
    - **Property 32: Multi-Column Layout Activation**
    - **Validates: Requirements 14.2**
  
  - [ ] 38.2 Write property test for keyboard navigation support
    - **Property 33: Keyboard Navigation Support**
    - **Validates: Requirements 14.3**

- [ ] 39. Tests for Triage Inbox components
  - [ ] 39.1 Write property test for action item display completeness
    - **Property 18: Action Item Display Completeness**
    - **Validates: Requirements 8.2, 8.3, 8.4**
  
  - [ ] 39.2 Write property test for action item review buttons
    - **Property 19: Action Item Review Buttons**
    - **Validates: Requirements 9.1**
  
  - [ ] 39.3 Write property test for doctor inbox display
    - **Property 17: Doctor Inbox Display**
    - **Validates: Requirements 8.1**

- [ ] 40. Tests for Action Item Review functionality
  - [ ] 40.1 Write property test for approval state transition
    - **Property 20: Approval State Transition**
    - **Validates: Requirements 9.2**
  
  - [ ] 40.2 Write property test for rejection state transition
    - **Property 21: Rejection State Transition**
    - **Validates: Requirements 9.3**
  
  - [ ] 40.3 Write property test for decision recording
    - **Property 22: Decision Recording**
    - **Validates: Requirements 9.4**
  
  - [ ] 40.4 Write unit tests for rejection edge cases
    - Test empty rejection reason is blocked
    - Test rejection modal cancel preserves pending state
    - _Requirements: 9.3_

- [ ] 41. Tests for error handling
  - [ ] 41.1 Write unit tests for all error scenarios
    - Test each error handler displays correct message
    - Test error recovery flows

### BOTH AGENTS - Final Testing & Deployment

- [ ] 42. Run full test suite
  - [ ] 42.1 Run full property test suite
    - Execute all property tests with 100 iterations
    - Verify all 34 properties pass
    - Fix any failures
  
  - [ ] 42.2 Run full unit test suite
    - Execute all unit tests
    - Verify coverage meets goals (80% line, 75% branch)
    - Fix any failures

- [ ] 43. Final checkpoint - Testing complete
  - All tests passing
  - Coverage goals met
  - Application fully tested and ready for deployment

## Notes

- **BUILD FIRST**: Focus on getting the application working end-to-end before writing tests
- All testing tasks have been moved to tasks 25-43
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a bottom-up approach: infrastructure → patient features → doctor features → polish → tests
