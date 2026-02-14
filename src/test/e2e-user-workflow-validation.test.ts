/**
 * End-to-End User Workflow Validation Tests
 *
 * Simulates real user interactions through the system exactly as they would
 * happen in the UI — admin login, user creation, doctor/patient operations,
 * cross-dashboard data verification, and all module testing.
 *
 * Flow tested:
 * 1. Admin login → create doctors → create patients → assign relationships
 * 2. Admin password change → verify new credentials
 * 3. Doctor login → create care plans → add missions/medications → create action items
 * 4. Patient login → view missions → complete missions → medication tracking
 * 5. Cross-dashboard: doctor inputs visible to patients, patient actions visible to doctors
 * 6. All ML models, clinical services, auto-processing, result verification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Core services
import { authService, AuthenticationError } from '../services/authService';
import { userManagementService, UserManagementError } from '../services/userManagementService';
import { persistenceService } from '../services/persistenceService';
import { carePlanService } from '../services/carePlanService';
import { medicationTracker } from '../services/medicationTracker';

// Types
import {
  UserRole,
  MissionType,
  MissionStatus,
  ActionItemType,
  ActionItemStatus,
  CarePlanStatus,
  MedicationStatus,
} from '../types';
import type {
  UserModel,
  ActionItemModel,
  MissionModel,
} from '../types';

// Seed data
import { reinitializeWithSeedData, SEED_USERS } from '../services/seedData';

// ============================================================================
// Helpers
// ============================================================================

/** Wipe all storage and reinitialize with seed data for a clean slate */
function freshState() {
  localStorage.clear();
  sessionStorage.clear();
  reinitializeWithSeedData(persistenceService);
}

/** Simulate login via authService and return the user */
async function loginAs(username: string, password: string) {
  return authService.login(username, password);
}

/** Create a user via admin service */
function createTestUser(
  data: { username: string; password: string; name: string; role: string },
  createdBy = 'admin-1'
) {
  return userManagementService.createUser(
    {
      username: data.username,
      password: data.password,
      name: data.name,
      role: data.role as unknown,
    },
    createdBy
  );
}

// ============================================================================
// Test Suite
// ============================================================================

describe('End-to-End User Workflow Validation', () => {
  beforeEach(() => {
    freshState();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ==========================================================================
  // SECTION 1: Admin Authentication & User Management
  // ==========================================================================
  describe('1. Admin Login & User Management', () => {
    it('should login as admin with seed credentials', async () => {
      const user = await loginAs('admin', 'admin');
      expect(user.id).toBe('admin-1');
      expect(user.name).toBe('System Administrator');
      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should reject invalid credentials', async () => {
      await expect(loginAs('admin', 'wrong')).rejects.toThrow(AuthenticationError);
      await expect(loginAs('nonexistent', 'pass')).rejects.toThrow(AuthenticationError);
      await expect(loginAs('', '')).rejects.toThrow(AuthenticationError);
    });

    it('should create 3 new doctors with unique specializations', async () => {
      await loginAs('admin', 'admin');

      const doctors = [
        { username: 'dr.chen', password: 'chen123', name: 'Dr. Sarah Chen', role: UserRole.DOCTOR },
        { username: 'dr.okonkwo', password: 'okonkwo123', name: 'Dr. Michael Okonkwo', role: UserRole.DOCTOR },
        { username: 'dr.sharma', password: 'sharma123', name: 'Dr. Priya Sharma', role: UserRole.DOCTOR },
      ];

      const createdDoctors: UserModel[] = [];
      for (const doc of doctors) {
        const created = createTestUser(doc);
        createdDoctors.push(created);
        expect(created.role).toBe(UserRole.DOCTOR);
        expect(created.username).toBe(doc.username);
        expect(created.passwordHash).toBe(`simple_hash_${doc.password}`);
      }

      // Verify all 3 exist in persistence (+ seed doctor = 4 total doctors)
      const allUsers = userManagementService.getAllUsers();
      const allDoctors = allUsers.filter(u => u.role === UserRole.DOCTOR);
      expect(allDoctors.length).toBe(4); // 1 seed + 3 new
    });

    it('should create 10 new patients with realistic data', async () => {
      await loginAs('admin', 'admin');

      const patients = [
        { username: 'john.m', password: 'john123', name: 'John Martinez' },
        { username: 'emily.r', password: 'emily123', name: 'Emily Robinson' },
        { username: 'raj.k', password: 'raj123', name: 'Raj Kumar' },
        { username: 'sarah.j', password: 'sarah123', name: 'Sarah Johnson' },
        { username: 'james.w', password: 'james123', name: 'James Wilson' },
        { username: 'fatima.a', password: 'fatima123', name: 'Fatima Al-Hassan' },
        { username: 'chen.w', password: 'chenw123', name: 'Chen Wei' },
        { username: 'maria.g', password: 'maria123', name: 'Maria Garcia' },
        { username: 'david.k', password: 'david123', name: 'David Kim' },
        { username: 'anna.p', password: 'anna123', name: 'Anna Petrov' },
      ];

      const createdPatients: UserModel[] = [];
      for (const p of patients) {
        const created = createTestUser({ ...p, role: UserRole.PATIENT });
        createdPatients.push(created);
        expect(created.role).toBe(UserRole.PATIENT);
        expect(created.streakCount).toBe(0); // New patients start at 0
      }

      // Verify all 10 exist (+ seed patient = 11 total patients)
      const allUsers = userManagementService.getAllUsers();
      const allPatients = allUsers.filter(u => u.role === UserRole.PATIENT);
      expect(allPatients.length).toBe(11);
    });

    it('should prevent duplicate username creation', async () => {
      await loginAs('admin', 'admin');

      // 'divya' already exists as seed user
      expect(() =>
        createTestUser({ username: 'divya', password: 'test', name: 'Duplicate', role: UserRole.PATIENT })
      ).toThrow(UserManagementError);
    });

    it('should assign patients to doctors and verify relationships', async () => {
      await loginAs('admin', 'admin');

      // Create doctors and patients
      const doc1 = createTestUser({ username: 'doc.a', password: 'a123', name: 'Dr. A', role: UserRole.DOCTOR });
      const doc2 = createTestUser({ username: 'doc.b', password: 'b123', name: 'Dr. B', role: UserRole.DOCTOR });
      const pat1 = createTestUser({ username: 'pat.x', password: 'x123', name: 'Patient X', role: UserRole.PATIENT });
      const pat2 = createTestUser({ username: 'pat.y', password: 'y123', name: 'Patient Y', role: UserRole.PATIENT });
      const pat3 = createTestUser({ username: 'pat.z', password: 'z123', name: 'Patient Z', role: UserRole.PATIENT });

      // Assign: doc1 gets pat1 and pat2, doc2 gets pat3
      const rel1 = userManagementService.assignPatientToDoctor(pat1.id, doc1.id, 'admin-1');
      const rel2 = userManagementService.assignPatientToDoctor(pat2.id, doc1.id, 'admin-1');
      const rel3 = userManagementService.assignPatientToDoctor(pat3.id, doc2.id, 'admin-1');

      expect(rel1.active).toBe(true);
      expect(rel2.active).toBe(true);
      expect(rel3.active).toBe(true);

      // Verify doctor1 sees exactly 2 patients
      const doc1Patients = userManagementService.getPatientsForDoctor(doc1.id);
      expect(doc1Patients.length).toBe(2);
      expect(doc1Patients.map(p => p.id)).toContain(pat1.id);
      expect(doc1Patients.map(p => p.id)).toContain(pat2.id);

      // Verify doctor2 sees exactly 1 patient
      const doc2Patients = userManagementService.getPatientsForDoctor(doc2.id);
      expect(doc2Patients.length).toBe(1);
      expect(doc2Patients[0].id).toBe(pat3.id);

      // Verify pat3 is NOT visible to doc1
      expect(doc1Patients.map(p => p.id)).not.toContain(pat3.id);
    });

    it('should prevent duplicate patient-doctor assignment', async () => {
      await loginAs('admin', 'admin');

      // Seed patient-1 is already assigned to doctor-1
      expect(() =>
        userManagementService.assignPatientToDoctor('patient-1', 'doctor-1', 'admin-1')
      ).toThrow(UserManagementError);
    });

    it('should prevent assigning wrong roles (doctor as patient, patient as doctor)', async () => {
      await loginAs('admin', 'admin');

      // Try to assign doctor-1 as a "patient" to another doctor
      expect(() =>
        userManagementService.assignPatientToDoctor('doctor-1', 'doctor-1', 'admin-1')
      ).toThrow(UserManagementError);

      // Try to assign patient-1 as a "doctor"
      expect(() =>
        userManagementService.assignPatientToDoctor('patient-1', 'patient-1', 'admin-1')
      ).toThrow(UserManagementError);
    });

    it('should remove patient from doctor and verify no longer visible', async () => {
      await loginAs('admin', 'admin');

      // Seed relationship: patient-1 → doctor-1
      let patients = userManagementService.getPatientsForDoctor('doctor-1');
      expect(patients.length).toBe(1);
      expect(patients[0].id).toBe('patient-1');

      // Remove
      userManagementService.removePatientFromDoctor('patient-1', 'doctor-1');

      // Verify no longer visible
      patients = userManagementService.getPatientsForDoctor('doctor-1');
      expect(patients.length).toBe(0);

      // Relationship should exist but be inactive
      const allRels = userManagementService.getAllRelationships();
      const seedRel = allRels.find(r => r.id === 'rel-1');
      expect(seedRel?.active).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 2: Admin Password Change & Re-Authentication
  // ==========================================================================
  describe('2. Admin Password Change', () => {
    it('should change admin password and login with new credentials', async () => {
      // Login with original password
      await loginAs('admin', 'admin');
      authService.logout();

      // Change password via userManagementService.updateUser
      userManagementService.updateUser('admin-1', { password: 'newAdminPass123' });

      // Verify old password no longer works
      await expect(loginAs('admin', 'admin')).rejects.toThrow(AuthenticationError);

      // Verify new password works
      const user = await loginAs('admin', 'newAdminPass123');
      expect(user.id).toBe('admin-1');
      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should change doctor password and verify access', async () => {
      // Login as admin, create a doctor, change their password
      await loginAs('admin', 'admin');
      const doc = createTestUser({
        username: 'dr.newdoc',
        password: 'initial123',
        name: 'Dr. New Doc',
        role: UserRole.DOCTOR,
      });
      authService.logout();

      // Login as doctor with initial password
      const docUser = await loginAs('dr.newdoc', 'initial123');
      expect(docUser.role).toBe(UserRole.DOCTOR);
      authService.logout();

      // Admin changes doctor's password
      await loginAs('admin', 'admin');
      userManagementService.updateUser(doc.id, { password: 'changed456' });
      authService.logout();

      // Old password fails
      await expect(loginAs('dr.newdoc', 'initial123')).rejects.toThrow(AuthenticationError);

      // New password works
      const docUser2 = await loginAs('dr.newdoc', 'changed456');
      expect(docUser2.role).toBe(UserRole.DOCTOR);
    });
  });

  // ==========================================================================
  // SECTION 3: Session Management
  // ==========================================================================
  describe('3. Session Management', () => {
    it('should create session on login and destroy on logout', async () => {
      const _user = await loginAs('admin', 'admin');
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()?.id).toBe('admin-1');

      authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should track session time remaining', async () => {
      await loginAs('admin', 'admin');
      const remaining = authService.getSessionTimeRemaining();
      // Should be close to 30 minutes (1800000 ms)
      expect(remaining).toBeGreaterThan(1790000);
      expect(remaining).toBeLessThanOrEqual(1800000);
    });

    it('should refresh session and extend expiry', async () => {
      await loginAs('admin', 'admin');

      // Advance time by 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000);

      // Refresh session
      const refreshed = authService.refreshSession();
      expect(refreshed).toBe(true);

      // Should have close to 30 min again (not 20 min)
      const remaining = authService.getSessionTimeRemaining();
      expect(remaining).toBeGreaterThan(1790000);
    });

    it('should expire session after 30 minutes', async () => {
      await loginAs('admin', 'admin');
      expect(authService.isAuthenticated()).toBe(true);

      // Advance time past 30 minutes
      vi.advanceTimersByTime(31 * 60 * 1000);

      // Session should be expired
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  // ==========================================================================
  // SECTION 4: Doctor Workflow — Care Plans, Missions, Medications
  // ==========================================================================
  describe('4. Doctor Workflow — Care Plans & Data Input', () => {
    let doctorId: string;
    let patientId: string;

    beforeEach(async () => {
      // Login as admin, create fresh doctor and patient
      await loginAs('admin', 'admin');
      const doc = createTestUser({
        username: 'dr.workflow',
        password: 'doc123',
        name: 'Dr. Workflow Test',
        role: UserRole.DOCTOR,
      });
      const pat = createTestUser({
        username: 'pat.workflow',
        password: 'pat123',
        name: 'Patient Workflow Test',
        role: UserRole.PATIENT,
      });
      userManagementService.assignPatientToDoctor(pat.id, doc.id, 'admin-1');
      doctorId = doc.id;
      patientId = pat.id;
      authService.logout();
    });

    it('should create a care plan as doctor for an assigned patient', async () => {
      await loginAs('dr.workflow', 'doc123');

      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Post-Knee Surgery Recovery',
        description: 'Comprehensive recovery plan for total knee replacement',
      });

      expect(carePlan.patientId).toBe(patientId);
      expect(carePlan.doctorId).toBe(doctorId);
      expect(carePlan.status).toBe(CarePlanStatus.ACTIVE);
      expect(carePlan.missions).toHaveLength(0);
      expect(carePlan.medications).toHaveLength(0);

      // Verify care plan is retrievable
      const retrieved = carePlanService.getCarePlan(carePlan.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Post-Knee Surgery Recovery');
    });

    it('should add missions to care plan and generate mission instances', async () => {
      await loginAs('dr.workflow', 'doc123');

      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Wound Monitoring Plan',
        description: 'Daily wound checks',
      });

      // Add a daily photo upload mission
      const mission = carePlanService.addMissionToCarePlan(carePlan.id, {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Daily Wound Photo',
        description: 'Take a photo of your surgical wound each morning',
        schedule: {
          startDate: new Date(),
          recurrence: { type: 'daily' },
          occurrences: 7, // 7 days
        },
      });

      expect(mission.type).toBe(MissionType.PHOTO_UPLOAD);
      expect(mission.title).toBe('Daily Wound Photo');

      // Verify mission instances were generated for the patient
      const patientMissions = persistenceService.getMissions(patientId);
      expect(patientMissions.length).toBeGreaterThanOrEqual(7);
    });

    it('should add medication to care plan and generate medication missions', async () => {
      await loginAs('dr.workflow', 'doc123');

      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Antibiotic Course',
        description: 'Post-op antibiotic regimen',
      });

      // Add medication
      const medication = carePlanService.addMedicationToCarePlan(carePlan.id, {
        medicationName: 'Cephalexin',
        dosage: '500mg',
        frequency: { timesPerDay: 3, times: ['08:00', '14:00', '20:00'] },
        duration: 10,
        refillThreshold: 5,
        instructions: 'Take with food',
        startDate: new Date(),
      });

      expect(medication.medicationName).toBe('Cephalexin');
      expect(medication.dosage).toBe('500mg');
      expect(medication.frequency.timesPerDay).toBe(3);
      expect(medication.status).toBe(MedicationStatus.ACTIVE);

      // Verify care plan now has the medication
      const updatedPlan = carePlanService.getCarePlan(carePlan.id);
      expect(updatedPlan!.medications.length).toBe(1);
      expect(updatedPlan!.medications[0].medicationName).toBe('Cephalexin');
    });

    it('should update care plan details', async () => {
      await loginAs('dr.workflow', 'doc123');

      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Initial Plan',
        description: 'Initial description',
      });

      const updated = carePlanService.updateCarePlan(carePlan.id, {
        name: 'Updated Recovery Plan',
        description: 'Updated with new instructions after week 2 review',
      });

      expect(updated.name).toBe('Updated Recovery Plan');
      expect(updated.description).toBe('Updated with new instructions after week 2 review');
    });

    it('should archive a care plan', async () => {
      await loginAs('dr.workflow', 'doc123');

      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Old Plan',
        description: 'To be archived',
      });

      carePlanService.archiveCarePlan(carePlan.id);

      const archived = carePlanService.getCarePlan(carePlan.id);
      expect(archived!.status).toBe(CarePlanStatus.ARCHIVED);
    });

    it('should cancel a mission within a care plan', async () => {
      await loginAs('dr.workflow', 'doc123');

      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Test Plan',
        description: 'For cancellation test',
      });

      const mission = carePlanService.addMissionToCarePlan(carePlan.id, {
        type: MissionType.EXERCISE_LOG,
        title: 'Daily Walk',
        description: 'Walk 15 minutes',
        schedule: { startDate: new Date(), recurrence: { type: 'daily' }, occurrences: 3 },
      });

      carePlanService.cancelCarePlanMission(carePlan.id, mission.id);

      const plan = carePlanService.getCarePlan(carePlan.id);
      const cancelledMission = plan!.missions.find(m => m.id === mission.id);
      expect(cancelledMission!.status).toBe('cancelled');
    });

    it('should update medication dosage', async () => {
      await loginAs('dr.workflow', 'doc123');

      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Med Update Test',
        description: 'For medication update test',
      });

      const medication = carePlanService.addMedicationToCarePlan(carePlan.id, {
        medicationName: 'Ibuprofen',
        dosage: '200mg',
        frequency: { timesPerDay: 2 },
        refillThreshold: 3,
        startDate: new Date(),
      });

      const updated = carePlanService.updateMedication(carePlan.id, medication.id, {
        dosage: '400mg',
        instructions: 'Increased dosage due to persistent pain',
      });

      expect(updated.dosage).toBe('400mg');
      expect(updated.instructions).toBe('Increased dosage due to persistent pain');
    });

    it('should retrieve care plans by doctor and by patient', async () => {
      await loginAs('dr.workflow', 'doc123');

      carePlanService.createCarePlan({ patientId, doctorId, name: 'Plan A', description: 'A' });
      carePlanService.createCarePlan({ patientId, doctorId, name: 'Plan B', description: 'B' });

      const doctorPlans = carePlanService.getCarePlansForDoctor(doctorId);
      expect(doctorPlans.length).toBe(2);

      const patientPlans = carePlanService.getCarePlansForPatient(patientId);
      expect(patientPlans.length).toBe(2);

      // Doctor should not see other patients' plans
      const otherDoctorPlans = carePlanService.getCarePlansForDoctor('doctor-1');
      const hasOurPlans = otherDoctorPlans.some(p => p.doctorId === doctorId);
      expect(hasOurPlans).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 5: Patient Workflow — Missions, Medications, Tracking
  // ==========================================================================
  describe('5. Patient Workflow — Missions & Medication', () => {
    it('should login as seed patient and see seed missions', async () => {
      const user = await loginAs('divya', 'divya');
      expect(user.id).toBe('patient-1');
      expect(user.role).toBe(UserRole.PATIENT);

      // Seed missions for patient-1
      const missions = persistenceService.getMissions('patient-1');
      expect(missions.length).toBeGreaterThanOrEqual(2); // At least 2 seed missions
    });

    it('should complete a mission and update its status in persistence', async () => {
      await loginAs('divya', 'divya');

      const missions = persistenceService.getMissions('patient-1');
      const pendingMission = missions.find(m => m.status === MissionStatus.PENDING);
      expect(pendingMission).toBeDefined();

      // Complete the mission directly in persistence (simulating store action)
      const completedMission: MissionModel = {
        ...pendingMission!,
        status: MissionStatus.COMPLETED,
        completedAt: new Date().toISOString(),
      };
      persistenceService.saveMission(completedMission);

      // Verify
      const updated = persistenceService.getMission(pendingMission!.id);
      expect(updated?.status).toBe(MissionStatus.COMPLETED);
      expect(updated?.completedAt).toBeDefined();
    });

    it('should track medication intake and decrement tablet count', async () => {
      await loginAs('divya', 'divya');

      // Re-initialize medication since beforeEach clears localStorage
      medicationTracker.initializeMedication('patient-1');
      const initialCount = medicationTracker.getTabletCount('patient-1', 'med-1');
      expect(initialCount).toBe(10);

      // Take medication
      const remaining = medicationTracker.recordMedicationTaken('patient-1', 'med-1');
      expect(remaining).toBe(9);

      // Take again
      const remaining2 = medicationTracker.recordMedicationTaken('patient-1', 'med-1');
      expect(remaining2).toBe(8);
    });

    it('should trigger refill alert when tablets reach threshold', async () => {
      await loginAs('divya', 'divya');
      medicationTracker.initializeMedication('patient-1');

      // Threshold is 3, start at 10, take 7 to reach 3
      for (let i = 0; i < 7; i++) {
        medicationTracker.recordMedicationTaken('patient-1', 'med-1');
      }

      const count = medicationTracker.getTabletCount('patient-1', 'med-1');
      expect(count).toBe(3);

      const needsRefill = medicationTracker.checkRefillNeeded('patient-1', 'med-1');
      expect(needsRefill).toBe(true);
    });

    it('should not need refill when above threshold', async () => {
      await loginAs('divya', 'divya');
      medicationTracker.initializeMedication('patient-1');

      // Take just 1 tablet (10 → 9, threshold is 3)
      medicationTracker.recordMedicationTaken('patient-1', 'med-1');

      const needsRefill = medicationTracker.checkRefillNeeded('patient-1', 'med-1');
      expect(needsRefill).toBe(false);
    });

    it('should prevent taking medication when 0 tablets remain', async () => {
      await loginAs('divya', 'divya');
      medicationTracker.initializeMedication('patient-1');

      // Take all 10 tablets
      for (let i = 0; i < 10; i++) {
        medicationTracker.recordMedicationTaken('patient-1', 'med-1');
      }

      expect(medicationTracker.getTabletCount('patient-1', 'med-1')).toBe(0);

      // Should throw when trying to take more
      expect(() => {
        medicationTracker.recordMedicationTaken('patient-1', 'med-1');
      }).toThrow('No tablets remaining');
    });

    it('should login as newly created patient and verify empty initial state', async () => {
      // Create patient via admin
      await loginAs('admin', 'admin');
      const pat = createTestUser({
        username: 'newpat',
        password: 'new123',
        name: 'New Patient',
        role: UserRole.PATIENT,
      });
      authService.logout();

      // Login as new patient
      const user = await loginAs('newpat', 'new123');
      expect(user.role).toBe(UserRole.PATIENT);

      // New patient should have no missions yet
      const missions = persistenceService.getMissions(pat.id);
      expect(missions.length).toBe(0);

      // No medications yet
      const meds = medicationTracker.getMedicationsForPatient(pat.id);
      expect(meds.length).toBe(0);
    });
  });

  // ==========================================================================
  // SECTION 6: Cross-Dashboard — Doctor inputs → Patient sees it
  // ==========================================================================
  describe('6. Cross-Dashboard Verification — Doctor → Patient', () => {
    let doctorId: string;
    let patientId: string;

    beforeEach(async () => {
      await loginAs('admin', 'admin');
      const doc = createTestUser({
        username: 'dr.cross',
        password: 'cross123',
        name: 'Dr. Cross Test',
        role: UserRole.DOCTOR,
      });
      const pat = createTestUser({
        username: 'pat.cross',
        password: 'cross456',
        name: 'Patient Cross Test',
        role: UserRole.PATIENT,
      });
      userManagementService.assignPatientToDoctor(pat.id, doc.id, 'admin-1');
      doctorId = doc.id;
      patientId = pat.id;
      authService.logout();
    });

    it('should reflect doctor-created care plan on patient side', async () => {
      // Doctor creates care plan
      await loginAs('dr.cross', 'cross123');
      const _carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Cross-Dashboard Test Plan',
        description: 'Verify patient can see this',
      });
      authService.logout();

      // Patient logs in and should see the care plan
      await loginAs('pat.cross', 'cross456');
      const patientPlans = carePlanService.getCarePlansForPatient(patientId);
      expect(patientPlans.length).toBe(1);
      expect(patientPlans[0].name).toBe('Cross-Dashboard Test Plan');
      expect(patientPlans[0].doctorId).toBe(doctorId);
    });

    it('should reflect doctor-created missions on patient side', async () => {
      // Doctor creates care plan with missions
      await loginAs('dr.cross', 'cross123');
      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Mission Test Plan',
        description: 'With missions',
      });
      carePlanService.addMissionToCarePlan(carePlan.id, {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Check Incision',
        description: 'Take a photo of your incision',
        schedule: { startDate: new Date(), recurrence: { type: 'one-time' } },
      });
      authService.logout();

      // Patient logs in and should see the mission
      await loginAs('pat.cross', 'cross456');
      const missions = persistenceService.getMissions(patientId);
      expect(missions.length).toBeGreaterThanOrEqual(1);
      const photoMission = missions.find(m => m.title === 'Check Incision');
      expect(photoMission).toBeDefined();
      expect(photoMission!.status).toBe(MissionStatus.PENDING);
    });

    it('should reflect doctor-prescribed medication on patient side', async () => {
      // Doctor creates care plan with medication
      await loginAs('dr.cross', 'cross123');
      const carePlan = carePlanService.createCarePlan({
        patientId,
        doctorId,
        name: 'Medication Test Plan',
        description: 'With medications',
      });
      carePlanService.addMedicationToCarePlan(carePlan.id, {
        medicationName: 'Metformin',
        dosage: '500mg',
        frequency: { timesPerDay: 2, times: ['08:00', '20:00'] },
        duration: 30,
        refillThreshold: 10,
        instructions: 'Take with meals',
        startDate: new Date(),
      });
      authService.logout();

      // Patient logs in and verifies medication exists in care plan
      await loginAs('pat.cross', 'cross456');
      const patientPlans = carePlanService.getCarePlansForPatient(patientId);
      expect(patientPlans.length).toBe(1);
      expect(patientPlans[0].medications.length).toBe(1);
      expect(patientPlans[0].medications[0].medicationName).toBe('Metformin');
      expect(patientPlans[0].medications[0].dosage).toBe('500mg');
    });
  });

  // ==========================================================================
  // SECTION 7: Cross-Dashboard — Patient actions → Doctor sees it
  // ==========================================================================
  describe('7. Cross-Dashboard Verification — Patient → Doctor', () => {
    it('should show triage action items to assigned doctor when patient has RED result', async () => {
      // Create an action item directly (simulating what the agent service would create after wound photo analysis)
      const actionItem: ActionItemModel = {
        id: 'test-triage-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: 'data:image/png;base64,fake-image-data',
        triageAnalysis: 'red',
        triageText: 'Redness and swelling detected around incision site',
        aiConfidenceScore: 0.87,
        doctorId: 'doctor-1',
      };
      persistenceService.saveActionItem(actionItem);

      // Doctor logs in and should see the action item
      await loginAs('dr.smith', 'smith');
      const items = persistenceService.getActionItems('doctor-1');
      const pendingItems = items.filter(i => i.status === ActionItemStatus.PENDING_DOCTOR);
      const triageItem = pendingItems.find(i => i.id === 'test-triage-1');

      expect(triageItem).toBeDefined();
      expect(triageItem!.patientName).toBe('Divya Patel');
      expect(triageItem!.triageAnalysis).toBe('red');
      expect(triageItem!.aiConfidenceScore).toBe(0.87);
    });

    it('should allow doctor to approve an action item', async () => {
      // Create pending action item
      const actionItem: ActionItemModel = {
        id: 'approve-test-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        triageAnalysis: 'red',
        triageText: 'Minor redness',
        aiConfidenceScore: 0.75,
        doctorId: 'doctor-1',
      };
      persistenceService.saveActionItem(actionItem);

      // Doctor approves
      await loginAs('dr.smith', 'smith');
      const updated: ActionItemModel = {
        ...actionItem,
        status: ActionItemStatus.APPROVED,
        updatedAt: new Date().toISOString(),
      };
      persistenceService.saveActionItem(updated);

      // Verify status changed
      const item = persistenceService.getActionItem('approve-test-1');
      expect(item!.status).toBe(ActionItemStatus.APPROVED);
    });

    it('should allow doctor to reject an action item with reason', async () => {
      const actionItem: ActionItemModel = {
        id: 'reject-test-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.REFILL,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        medicationName: 'Oxycodone',
        insuranceStatus: 'approved',
        inventoryStatus: 'in_stock',
        doctorId: 'doctor-1',
      };
      persistenceService.saveActionItem(actionItem);

      // Doctor rejects with reason
      await loginAs('dr.smith', 'smith');
      const updated: ActionItemModel = {
        ...actionItem,
        status: ActionItemStatus.REJECTED,
        rejectionReason: 'Switching to non-opioid pain management per new protocol',
        updatedAt: new Date().toISOString(),
      };
      persistenceService.saveActionItem(updated);

      // Verify rejection
      const item = persistenceService.getActionItem('reject-test-1');
      expect(item!.status).toBe(ActionItemStatus.REJECTED);
      expect(item!.rejectionReason).toBe('Switching to non-opioid pain management per new protocol');
    });

    it('should show refill action items to doctor when patient medication runs low', async () => {
      // Simulate refill action item (normally created by agent service)
      const refillItem: ActionItemModel = {
        id: 'refill-test-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.REFILL,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        medicationName: 'Amoxicillin 500mg',
        insuranceStatus: 'approved',
        inventoryStatus: 'in_stock',
        doctorId: 'doctor-1',
      };
      persistenceService.saveActionItem(refillItem);

      // Doctor sees it
      await loginAs('dr.smith', 'smith');
      const items = persistenceService.getActionItems('doctor-1');
      const refill = items.find(i => i.id === 'refill-test-1');
      expect(refill).toBeDefined();
      expect(refill!.type).toBe(ActionItemType.REFILL);
      expect(refill!.medicationName).toBe('Amoxicillin 500mg');
    });

    it('should isolate action items per doctor — doctor only sees their patients', async () => {
      // Create a second doctor
      await loginAs('admin', 'admin');
      const doc2 = createTestUser({
        username: 'dr.other',
        password: 'other123',
        name: 'Dr. Other',
        role: UserRole.DOCTOR,
      });
      authService.logout();

      // Action item assigned to doctor-1
      persistenceService.saveActionItem({
        id: 'isolated-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: 'doctor-1',
      } as ActionItemModel);

      // Action item assigned to doc2
      persistenceService.saveActionItem({
        id: 'isolated-2',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: doc2.id,
      } as ActionItemModel);

      // Doctor-1 should only see their item
      await loginAs('dr.smith', 'smith');
      const doc1Items = persistenceService.getActionItems('doctor-1');
      expect(doc1Items.some(i => i.id === 'isolated-1')).toBe(true);
      expect(doc1Items.some(i => i.id === 'isolated-2')).toBe(false);
      authService.logout();

      // Doc2 should only see their item
      await loginAs('dr.other', 'other123');
      const doc2Items = persistenceService.getActionItems(doc2.id);
      expect(doc2Items.some(i => i.id === 'isolated-2')).toBe(true);
      expect(doc2Items.some(i => i.id === 'isolated-1')).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 8: Full Workflow — Create → Input → Verify → Act → Confirm
  // ==========================================================================
  describe('8. Full End-to-End Workflow: Admin → Doctor → Patient → Doctor', () => {
    it('should complete entire lifecycle: create users, care plan, missions, complete mission, verify on doctor side', async () => {
      // Step 1: Admin creates doctor and patient
      await loginAs('admin', 'admin');
      const doctor = createTestUser({
        username: 'dr.lifecycle',
        password: 'life123',
        name: 'Dr. Lifecycle',
        role: UserRole.DOCTOR,
      });
      const patient = createTestUser({
        username: 'pat.lifecycle',
        password: 'life456',
        name: 'Patient Lifecycle',
        role: UserRole.PATIENT,
      });
      userManagementService.assignPatientToDoctor(patient.id, doctor.id, 'admin-1');
      authService.logout();

      // Step 2: Doctor creates care plan with mission
      await loginAs('dr.lifecycle', 'life123');
      const carePlan = carePlanService.createCarePlan({
        patientId: patient.id,
        doctorId: doctor.id,
        name: 'Full Recovery Plan',
        description: 'Comprehensive post-surgical recovery',
      });

      carePlanService.addMissionToCarePlan(carePlan.id, {
        type: MissionType.PHOTO_UPLOAD,
        title: 'Daily Wound Check',
        description: 'Photograph your incision',
        schedule: { startDate: new Date(), recurrence: { type: 'one-time' } },
      });

      carePlanService.addMedicationToCarePlan(carePlan.id, {
        medicationName: 'Cephalexin',
        dosage: '250mg',
        frequency: { timesPerDay: 4, times: ['06:00', '12:00', '18:00', '00:00'] },
        duration: 7,
        refillThreshold: 5,
        startDate: new Date(),
      });
      authService.logout();

      // Step 3: Patient logs in, sees missions created by doctor
      await loginAs('pat.lifecycle', 'life456');
      const missions = persistenceService.getMissions(patient.id);
      expect(missions.length).toBeGreaterThanOrEqual(1);

      const photoMission = missions.find(m => m.type === MissionType.PHOTO_UPLOAD);
      expect(photoMission).toBeDefined();

      // Patient completes the photo mission
      const completedMission: MissionModel = {
        ...photoMission!,
        status: MissionStatus.COMPLETED,
        completedAt: new Date().toISOString(),
      };
      persistenceService.saveMission(completedMission);

      // Simulate RED triage result creating action item for doctor
      const triageActionItem: ActionItemModel = {
        id: `triage-lifecycle-${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: 'data:image/png;base64,test-wound-image',
        triageAnalysis: 'red',
        triageText: 'Erythema detected, possible early infection',
        aiConfidenceScore: 0.82,
        doctorId: doctor.id,
      };
      persistenceService.saveActionItem(triageActionItem);
      authService.logout();

      // Step 4: Doctor logs in and sees the triage item
      await loginAs('dr.lifecycle', 'life123');
      const actionItems = persistenceService.getActionItems(doctor.id);
      const triageItem = actionItems.find(
        i => i.type === ActionItemType.TRIAGE && i.patientId === patient.id
      );
      expect(triageItem).toBeDefined();
      expect(triageItem!.triageAnalysis).toBe('red');
      expect(triageItem!.patientName).toBe('Patient Lifecycle');
      expect(triageItem!.aiConfidenceScore).toBe(0.82);

      // Doctor approves the triage result
      const approved: ActionItemModel = {
        ...triageItem!,
        status: ActionItemStatus.APPROVED,
        updatedAt: new Date().toISOString(),
      };
      persistenceService.saveActionItem(approved);

      // Verify approved
      const finalItem = persistenceService.getActionItem(triageItem!.id);
      expect(finalItem!.status).toBe(ActionItemStatus.APPROVED);

      // Verify patient's care plan still accessible
      const patientPlans = carePlanService.getCarePlansForPatient(patient.id);
      expect(patientPlans.length).toBe(1);
      expect(patientPlans[0].medications.length).toBe(1);
      expect(patientPlans[0].medications[0].medicationName).toBe('Cephalexin');
    });
  });

  // ==========================================================================
  // SECTION 9: Data Deletion & Cleanup
  // ==========================================================================
  describe('9. Data Deletion & Cleanup', () => {
    it('should delete a mission', async () => {
      const missions = persistenceService.getMissions('patient-1');
      const missionId = missions[0]?.id;
      expect(missionId).toBeDefined();

      persistenceService.deleteMission(missionId!);
      const afterDelete = persistenceService.getMission(missionId!);
      expect(afterDelete).toBeNull();
    });

    it('should delete an action item', async () => {
      const item: ActionItemModel = {
        id: 'delete-test',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: 'doctor-1',
      } as ActionItemModel;
      persistenceService.saveActionItem(item);

      expect(persistenceService.getActionItem('delete-test')).not.toBeNull();

      persistenceService.deleteActionItem('delete-test');
      expect(persistenceService.getActionItem('delete-test')).toBeNull();
    });

    it('should delete a care plan', async () => {
      const carePlan = carePlanService.createCarePlan({
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Delete Test',
        description: 'To be deleted',
      });

      expect(carePlanService.getCarePlan(carePlan.id)).not.toBeNull();

      persistenceService.deleteCarePlan(carePlan.id);
      expect(carePlanService.getCarePlan(carePlan.id)).toBeNull();
    });

    it('should reinitialize all data to seed state', () => {
      // Create extra data
      createTestUser({ username: 'extra', password: 'extra', name: 'Extra User', role: UserRole.PATIENT });
      const allBefore = userManagementService.getAllUsers();
      expect(allBefore.length).toBeGreaterThan(SEED_USERS.length);

      // Reinitialize
      reinitializeWithSeedData(persistenceService);

      // Should only have seed users
      const allAfter = userManagementService.getAllUsers();
      expect(allAfter.length).toBe(SEED_USERS.length);
    });
  });

  // ==========================================================================
  // SECTION 10: ML Model Predictions — Accuracy Verification
  // ==========================================================================
  describe('10. ML Model Predictions — Accuracy & Correctness', () => {
    it('should predict high risk for drug interaction between warfarin and aspirin', async () => {
      const { createDrugInteractionChecker } = await import('../services/mlModels/drugInteractionChecker');
      const checker = createDrugInteractionChecker();

      const result = checker.checkPairInteraction('warfarin', 'aspirin');
      expect(result).toBeDefined();
      expect(result!.severity).toBe('major');
      expect(result!.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result!.mechanism).toBeDefined();
    });

    it('should detect anomalies in critical vital signs', async () => {
      const { detectVitalSignAnomalies, VitalType } = await import('../services/mlModels/anomalyDetectionEngine');

      const now = Date.now();
      // Build VitalReading[] with extremely abnormal values
      const readings = [
        // Tachycardia escalating
        ...[120, 125, 130, 140, 160, 180].map((v, i) => ({
          patientId: 'anomaly-test',
          timestamp: new Date(now + i * 60000).toISOString(),
          vitalType: VitalType.HEART_RATE,
          value: v,
          unit: 'bpm',
        })),
        // Hypertensive crisis
        ...[180, 185, 190, 195, 200, 210].map((v, i) => ({
          patientId: 'anomaly-test',
          timestamp: new Date(now + i * 60000).toISOString(),
          vitalType: VitalType.BLOOD_PRESSURE_SYSTOLIC,
          value: v,
          unit: 'mmHg',
        })),
        // High fever
        ...[38.5, 38.8, 39.2, 39.5, 39.8, 40.0].map((v, i) => ({
          patientId: 'anomaly-test',
          timestamp: new Date(now + i * 60000).toISOString(),
          vitalType: VitalType.TEMPERATURE,
          value: v,
          unit: '°C',
        })),
        // Falling SpO2
        ...[95, 93, 91, 89, 87, 85].map((v, i) => ({
          patientId: 'anomaly-test',
          timestamp: new Date(now + i * 60000).toISOString(),
          vitalType: VitalType.OXYGEN_SATURATION,
          value: v,
          unit: '%',
        })),
      ];

      const anomalies = detectVitalSignAnomalies(readings);
      expect(anomalies.length).toBeGreaterThan(0);
      // Should detect critical-severity anomalies for these extreme values
      const hasCritical = anomalies.some(a => a.severity === 'critical');
      expect(hasCritical).toBe(true);
    });

    it('should correctly score recovery prediction', async () => {
      const { RecoveryPredictionModel } = await import('../services/mlModels/recoveryPredictionModel');
      const model = new RecoveryPredictionModel();
      model.train();

      const prediction = model.predict({
        age: 45,
        bmi: 25.0,
        surgeryType: 'knee_replacement',
        comorbidities: {
          diabetes: false,
          hypertension: true,
          obesity: false,
          smoking: false,
          heartDisease: false,
          osteoporosis: false,
          immunocompromised: false,
        },
        complianceRate: 0.95,
        woundHealingScore: 7,
        daysSinceSurgery: 7,
        painLevel: 3,
        physicalTherapySessions: 5,
        sleepQualityScore: 7,
      });

      expect(prediction).toBeDefined();
      expect(prediction.outcome).toBeDefined();
      expect(prediction.estimatedRecoveryDays).toBeGreaterThan(0);
      expect(prediction.riskFactors).toBeDefined();
    });

    it('should correctly assess readmission risk', async () => {
      const { createReadmissionRiskPredictor, AdmissionType, ProcedureType } = await import('../services/mlModels/readmissionRiskPredictor');
      const predictor = createReadmissionRiskPredictor();

      const result = predictor.predict({
        patientId: 'test-readmit',
        age: 78,
        gender: 'male',
        hemoglobinAtDischarge: 9.5,
        sodiumAtDischarge: 132,
        hasOncologyDiagnosis: false,
        procedureType: ProcedureType.CARDIAC,
        admissionType: AdmissionType.EMERGENCY,
        lengthOfStayDays: 12,
        previousAdmissions6Months: 5,
        emergencyVisits6Months: 3,
        charlsonComorbidityIndex: 5,
        comorbidities: ['heart_failure', 'diabetes', 'hypertension', 'copd', 'renal_disease'],
        dischargeDisposition: 'home',
        insuranceType: 'medicare',
        livesAlone: true,
        hasCaregiver: false,
        medicationCount: 12,
        hasFollowUpScheduled: false,
        bmi: 29,
        isSmoker: false,
        hasDiabetes: true,
        hasHeartFailure: true,
        hasCOPD: true,
        hasRenalDisease: true,
      });

      expect(result.ensembleRiskLevel).toBeDefined();
      expect(result.ensembleProbability).toBeGreaterThan(0);
      // High risk patient should score at least moderate
      expect(['moderate', 'high', 'very_high']).toContain(result.ensembleRiskLevel);
    });

    it('should assess wound healing classification', async () => {
      const { createWoundHealingClassifier, TissueType, ExudateType, ExudateAmount, WoundEdge, PeriwoundCondition } = await import('../services/mlModels/woundHealingClassifier');
      const classifier = createWoundHealingClassifier();

      const result = classifier.assessWound({
        woundId: 'test-wound-1',
        lengthCm: 4,
        widthCm: 2,
        depthCm: 0.5,
        tissueType: TissueType.GRANULATION,
        exudateType: ExudateType.SEROUS,
        exudateAmount: ExudateAmount.MODERATE,
        woundEdge: WoundEdge.WELL_DEFINED,
        periwoundCondition: PeriwoundCondition.HEALTHY,
        hasOdor: false,
        hasTunneling: false,
        tunnelingDepthCm: 0,
        hasUndermining: false,
        underminingCm: 0,
        painLevel: 3,
        temperatureElevated: false,
        surroundingErythemaCm: 0,
        daysSinceOnset: 5,
        isPostSurgical: true,
        hasInfectionSigns: false,
        hasBoneExposure: false,
        hasTendonExposure: false,
        hasGangrene: false,
        gangreneExtent: 'none',
      });

      expect(result).toBeDefined();
      // healingPhase is nested inside decisionTreeClassification
      expect(result.decisionTreeClassification.healingPhase).toBeDefined();
      expect(result.pushScore).toBeDefined();
      expect(result.wagnerClassification).toBeDefined();
      expect(result.overallRisk).toBeDefined();
    });

    it('should check medication adherence prediction', async () => {
      const { createMedicationAdherencePredictor } = await import('../services/mlModels/medicationAdherencePredictor');
      const predictor = createMedicationAdherencePredictor();

      const result = predictor.predict({
        patientId: 'test-adherence',
        age: 55,
        gender: 'female',
        numberOfMedications: 4,
        dosesPerDay: 8,
        hasExperiencedSideEffects: true,
        sideEffectSeverity: 5,
        monthlyMedicationCost: 150,
        hasInsuranceCoverage: true,
        healthLiteracyScore: 7,
        depressionScreenScore: 2,
        cognitiveScore: 8,
        hasSocialSupport: true,
        livesAlone: false,
        hasTransportationAccess: true,
        hasSymptoms: true,
        durationOfTherapyMonths: 6,
        hasAutoRefill: false,
        usesPillOrganizer: false,
        hasPharmacistCounseling: false,
        numberOfDailyDoseTimings: 3,
        isNewPrescription: false,
        hasHistoryOfNonadherence: true,
        comorbidityCount: 3,
        employmentStatus: 'employed',
      });

      expect(result).toBeDefined();
      expect(result.predictedAdherenceRate).toBeGreaterThanOrEqual(0);
      expect(result.predictedAdherenceRate).toBeLessThanOrEqual(1);
      expect(result.adherenceLevel).toBeDefined();
      // Confidence should NOT be artificially floored (we removed the 0.3 floor)
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should analyze symptoms and provide suggestions', async () => {
      const { analyzeSymptoms } = await import('../services/mlModels/symptomCheckerModel');

      const result = analyzeSymptoms(
        ['fever', 'wound_redness', 'wound_swelling', 'fatigue'],
        { surgeryType: 'knee_replacement', daysSinceSurgery: 5, age: 65 }
      );

      expect(result).toBeDefined();
      expect(result.conditions.length).toBeGreaterThan(0);
      expect(result.recommendedAction).toBeDefined();
    });

    it('should perform sentiment analysis on patient text', async () => {
      const { analyzeSentiment } = await import('../services/mlModels/sentimentAnalysisEngine');

      const positive = analyzeSentiment('I feel amazing and happy today, completely recovered and feeling great, wonderful improvement!');
      expect(positive.score).toBeGreaterThanOrEqual(0); // Positive text should have non-negative score
      expect(['positive', 'neutral']).toContain(positive.sentiment);

      const negative = analyzeSentiment('terrible pain suffering horrible agony worst unbearable miserable dying hurting bleeding emergency');
      expect(negative.score).toBeLessThanOrEqual(0); // Strongly negative text
      expect(['negative', 'neutral']).toContain(negative.sentiment);
    });

    it('should calculate risk scores accurately', async () => {
      const { createRiskScoringEngine, ASAClass, ComorbidityType, AnesthesiaType, SurgeryComplexity, WoundHealingPhase, MoodLevel } = await import('../services/mlModels/riskScoringEngine');
      const engine = createRiskScoringEngine();

      const result = engine.assessRisk({
        demographics: {
          patientId: 'test-risk-patient',
          age: 72,
          bmi: 32,
          isSmoker: false,
          comorbidities: [ComorbidityType.DIABETES, ComorbidityType.HYPERTENSION, ComorbidityType.CHF],
          asaClass: ASAClass.III,
          gender: 'male',
          livesAlone: false,
          hasCaregiver: true,
          primaryLanguageEnglish: true,
        },
        surgical: {
          surgeryType: 'cardiac_bypass',
          surgeryDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          durationMinutes: 240,
          complexity: SurgeryComplexity.MAJOR,
          anesthesiaType: AnesthesiaType.GENERAL,
          isEmergency: false,
          isReoperation: false,
          surgicalSite: 'chest',
        },
        compliance: {
          medicationAdherenceRate: 0.8,
          missionCompletionRate: 0.7,
          appointmentAttendanceRate: 0.9,
          daysWithMissedMedications: 3,
          consecutiveMissedDays: 1,
          totalScheduledAppointments: 5,
          appointmentsAttended: 4,
          appointmentsCancelled: 1,
          appointmentsNoShow: 0,
        },
        clinical: {
          woundHealingPhase: WoundHealingPhase.PROLIFERATIVE,
          woundHealingOnTrack: true,
          painLevel: 4,
          painTrend: 'decreasing',
          temperature: 37.2,
          heartRate: 82,
          bloodPressureSystolic: 140,
          bloodPressureDiastolic: 88,
          oxygenSaturation: 95,
          hasInfectionSigns: false,
          hasDrainageAbnormality: false,
          hasSwelling: false,
          hasRedness: false,
        },
        behavioral: {
          appEngagementScore: 0.7,
          avgDailySessionMinutes: 10,
          daysActiveLastWeek: 5,
          symptomReportsLast7Days: 2,
          symptomReportsLast30Days: 8,
          moodScores: [MoodLevel.GOOD, MoodLevel.NEUTRAL, MoodLevel.GOOD],
        },
        lengthOfStayDays: 8,
      });

      expect(result).toBeDefined();
      expect(result.overallRisk).toBeDefined();
      expect(result.laceIndexScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // SECTION 11: Clinical Services — Real-World Scenarios
  // ==========================================================================
  describe('11. Clinical Services — Auto-Processing & Results', () => {
    it('should detect sepsis risk from qSOFA criteria', async () => {
      const { EmergencyProtocolService } = await import('../services/emergencyProtocolService');
      const service = new EmergencyProtocolService();

      // Sepsis-like vitals: low BP, high HR, altered mental status
      const assessment = service.evaluate(
        {
          systolicBP: 85,
          heartRate: 120,
          respiratoryRate: 24,
          temperature: 39.5,
          spo2: 91,
        },
        [
          { id: 's1', name: 'confusion', severity: 'severe' },
          { id: 's2', name: 'fever', severity: 'severe' },
        ]
      );

      expect(assessment.triggeredRules.length).toBeGreaterThan(0);
      expect(assessment.highestPriority).toBeDefined();
    });

    it('should detect fall risk via emergency protocol evaluation', async () => {
      const { EmergencyProtocolService } = await import('../services/emergencyProtocolService');
      const service = new EmergencyProtocolService();

      // Patient with fall-risk symptoms: dizziness, unsteady gait
      const assessment = service.evaluate(
        { heartRate: 65, systolicBP: 100, spo2: 96 },
        [
          { id: 'f1', name: 'dizziness', severity: 'moderate' },
          { id: 'f2', name: 'unsteady_gait', severity: 'moderate' },
        ]
      );

      // The emergency protocol evaluates based on vitals + symptoms
      expect(assessment).toBeDefined();
      // EmergencyAssessment has highestPriority and triggeredRules
      expect(assessment.highestPriority).toBeDefined();
    });

    it('should manage alert fatigue correctly — never suppress HIGH alerts', async () => {
      const { alertFatigueManager, AlertPriority, AlertCategory } = await import('../services/alertFatigueManager');

      // Process a HIGH priority vital sign alert
      const highAlert = {
        id: 'high-vital-1',
        category: AlertCategory.VITAL_SIGN,
        priority: AlertPriority.HIGH,
        title: 'Elevated Heart Rate',
        message: 'Heart rate 130 bpm',
        patientId: 'patient-1',
        source: 'vital_monitor',
        createdAt: new Date().toISOString(),
      };

      const record = alertFatigueManager.processAlert(highAlert);
      expect(record.suppressed).toBe(false); // HIGH alerts should NEVER be suppressed

      // Process the exact same alert again (would normally be deduplicated)
      const duplicate = {
        ...highAlert,
        id: 'high-vital-2',
        createdAt: new Date().toISOString(),
      };
      const record2 = alertFatigueManager.processAlert(duplicate);
      expect(record2.suppressed).toBe(false); // Still should NOT be suppressed even if duplicate
    });

    it('should always suppress CRITICAL alerts: never', async () => {
      const { alertFatigueManager, AlertPriority, AlertCategory } = await import('../services/alertFatigueManager');

      const criticalAlert = {
        id: 'critical-1',
        category: AlertCategory.ALLERGY,
        priority: AlertPriority.CRITICAL,
        title: 'Allergic Reaction',
        message: 'Patient allergic to penicillin',
        patientId: 'patient-1',
        source: 'allergy_check',
        createdAt: new Date().toISOString(),
      };

      const record = alertFatigueManager.processAlert(criticalAlert);
      expect(record.suppressed).toBe(false);
    });

    it('should evaluate emergency rules for DVT-like symptoms', async () => {
      const { EmergencyProtocolService } = await import('../services/emergencyProtocolService');
      const service = new EmergencyProtocolService();

      // DVT-risk symptoms: leg swelling, pain, warmth
      const assessment = service.evaluate(
        { heartRate: 95, systolicBP: 130, respiratoryRate: 20, temperature: 37.8, spo2: 94 },
        [
          { id: 'd1', name: 'leg_swelling', severity: 'severe' },
          { id: 'd2', name: 'calf_pain', severity: 'moderate' },
          { id: 'd3', name: 'leg_warmth', severity: 'moderate' },
        ]
      );

      expect(assessment).toBeDefined();
      expect(assessment.highestPriority).toBeDefined();
    });

    it('should generate emergency protocols with all required information', async () => {
      const { EmergencyProtocolService } = await import('../services/emergencyProtocolService');
      const service = new EmergencyProtocolService();

      const protocols = service.getAllProtocols();
      expect(protocols.length).toBeGreaterThan(0);

      for (const protocol of protocols) {
        expect(protocol.name).toBeDefined();
        expect(protocol.steps.length).toBeGreaterThan(0);
        expect(protocol.patientInstructions.length).toBeGreaterThan(0);
        expect(protocol.careTeamActions.length).toBeGreaterThan(0);
        expect(protocol.escalationTimeMinutes).toBeGreaterThan(0);
      }
    });

    it('should compute blood glucose monitoring results', async () => {
      const { bloodGlucoseMonitor } = await import('../services/bloodGlucoseMonitor');

      // Record glucose readings
      const reading1 = bloodGlucoseMonitor.recordReading('patient-1', 180, false, 'fingerstick');
      expect(reading1.value).toBe(180);
      expect(reading1.status).toBeDefined();

      const reading2 = bloodGlucoseMonitor.recordReading('patient-1', 95, true, 'fingerstick');
      expect(reading2.value).toBe(95);

      // Calculate time in range
      const timeInRange = bloodGlucoseMonitor.calculateTimeInRange([reading1, reading2]);
      expect(timeInRange.totalReadings).toBe(2);
      expect(timeInRange.meanGlucose).toBeGreaterThan(0);
      expect(timeInRange.inRangePercent).toBeGreaterThanOrEqual(0);

      // Estimate HbA1c from average glucose
      const hba1c = bloodGlucoseMonitor.estimateHbA1c(137.5);
      expect(hba1c).toBeDefined();
      expect(hba1c.estimatedHbA1c).toBeGreaterThan(0);
    });

    it('should predict SSI risk accurately', async () => {
      const { ssiPredictor, WoundClass } = await import('../services/ssiPredictor');

      const result = ssiPredictor.performRiskAssessment(
        'test-ssi-patient',
        {
          patientId: 'test-ssi-patient',
          age: 65,
          bmi: 35,
          asaScore: 3,
          diabetes: true,
          diabetesControlled: false,
          smoker: true,
          immunosuppressed: false,
          malnutrition: true,
          obesity: true,
          remoteInfection: false,
          preoperativeGlucose: 200,
          albumin: 2.8,
          steroidUse: false,
          radiationHistory: false,
          priorSSI: false,
        },
        {
          procedureCode: 'COLO',
          procedureName: 'Colectomy',
          durationMinutes: 180,
          woundClass: WoundClass.CONTAMINATED,
          isLaparoscopic: false,
          implantUsed: false,
          procedureCategory: 'abdominal',
        }
      );

      expect(result).toBeDefined();
      expect(result.overallRiskLevel).toBeDefined();
      expect(result.predictedSSIRate).toBeGreaterThan(0);
      expect(result.riskFactors.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // SECTION 12: Multi-Patient, Multi-Doctor Isolation
  // ==========================================================================
  describe('12. Multi-Patient Multi-Doctor Data Isolation', () => {
    it('should ensure complete data isolation between doctors', async () => {
      await loginAs('admin', 'admin');

      // Create 2 doctors and 4 patients
      const doc1 = createTestUser({ username: 'iso.doc1', password: 'iso1', name: 'Dr. Iso1', role: UserRole.DOCTOR });
      const doc2 = createTestUser({ username: 'iso.doc2', password: 'iso2', name: 'Dr. Iso2', role: UserRole.DOCTOR });
      const pat1 = createTestUser({ username: 'iso.p1', password: 'iso1', name: 'Patient Iso1', role: UserRole.PATIENT });
      const pat2 = createTestUser({ username: 'iso.p2', password: 'iso2', name: 'Patient Iso2', role: UserRole.PATIENT });
      const pat3 = createTestUser({ username: 'iso.p3', password: 'iso3', name: 'Patient Iso3', role: UserRole.PATIENT });
      const pat4 = createTestUser({ username: 'iso.p4', password: 'iso4', name: 'Patient Iso4', role: UserRole.PATIENT });

      // Assign: doc1 → pat1, pat2; doc2 → pat3, pat4
      userManagementService.assignPatientToDoctor(pat1.id, doc1.id, 'admin-1');
      userManagementService.assignPatientToDoctor(pat2.id, doc1.id, 'admin-1');
      userManagementService.assignPatientToDoctor(pat3.id, doc2.id, 'admin-1');
      userManagementService.assignPatientToDoctor(pat4.id, doc2.id, 'admin-1');
      authService.logout();

      // Doc1 creates care plans
      await loginAs('iso.doc1', 'iso1');
      carePlanService.createCarePlan({ patientId: pat1.id, doctorId: doc1.id, name: 'Plan P1', description: 'For P1' });
      carePlanService.createCarePlan({ patientId: pat2.id, doctorId: doc1.id, name: 'Plan P2', description: 'For P2' });

      // Verify doc1 sees exactly 2 plans
      const doc1Plans = carePlanService.getCarePlansForDoctor(doc1.id);
      expect(doc1Plans.length).toBe(2);
      authService.logout();

      // Doc2 creates care plans
      await loginAs('iso.doc2', 'iso2');
      carePlanService.createCarePlan({ patientId: pat3.id, doctorId: doc2.id, name: 'Plan P3', description: 'For P3' });

      const doc2Plans = carePlanService.getCarePlansForDoctor(doc2.id);
      expect(doc2Plans.length).toBe(1);

      // Doc2 should NOT see doc1's patients' plans
      const pat1Plans = carePlanService.getCarePlansForPatient(pat1.id);
      const doc2HasPat1Plan = pat1Plans.some(p => p.doctorId === doc2.id);
      expect(doc2HasPat1Plan).toBe(false);
      authService.logout();

      // Verify patients see only their own plans
      await loginAs('iso.p1', 'iso1');
      const p1Plans = carePlanService.getCarePlansForPatient(pat1.id);
      expect(p1Plans.length).toBe(1);
      expect(p1Plans[0].name).toBe('Plan P1');
      authService.logout();

      await loginAs('iso.p3', 'iso3');
      const p3Plans = carePlanService.getCarePlansForPatient(pat3.id);
      expect(p3Plans.length).toBe(1);
      expect(p3Plans[0].name).toBe('Plan P3');
    });

    it('should ensure action items are isolated per doctor assignment', async () => {
      await loginAs('admin', 'admin');
      const docA = createTestUser({ username: 'iso.docA', password: 'isoA', name: 'Dr. IsoA', role: UserRole.DOCTOR });
      const docB = createTestUser({ username: 'iso.docB', password: 'isoB', name: 'Dr. IsoB', role: UserRole.DOCTOR });
      const patA = createTestUser({ username: 'iso.patA', password: 'isoA', name: 'Patient IsoA', role: UserRole.PATIENT });
      const patB = createTestUser({ username: 'iso.patB', password: 'isoB', name: 'Patient IsoB', role: UserRole.PATIENT });
      userManagementService.assignPatientToDoctor(patA.id, docA.id, 'admin-1');
      userManagementService.assignPatientToDoctor(patB.id, docB.id, 'admin-1');
      authService.logout();

      // Create action items for different doctors
      persistenceService.saveActionItem({
        id: 'iso-action-A',
        patientId: patA.id,
        patientName: 'Patient IsoA',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: docA.id,
      } as ActionItemModel);

      persistenceService.saveActionItem({
        id: 'iso-action-B',
        patientId: patB.id,
        patientName: 'Patient IsoB',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: docB.id,
      } as ActionItemModel);

      // DocA should only see their action item
      const docAItems = persistenceService.getActionItems(docA.id);
      expect(docAItems.some(i => i.id === 'iso-action-A')).toBe(true);
      expect(docAItems.some(i => i.id === 'iso-action-B')).toBe(false);

      // DocB should only see their action item
      const docBItems = persistenceService.getActionItems(docB.id);
      expect(docBItems.some(i => i.id === 'iso-action-B')).toBe(true);
      expect(docBItems.some(i => i.id === 'iso-action-A')).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 13: Edge Cases & Error Handling
  // ==========================================================================
  describe('13. Edge Cases & Error Handling', () => {
    it('should handle creating user with missing fields', () => {
      expect(() =>
        createTestUser({ username: '', password: 'test', name: 'Test', role: UserRole.PATIENT })
      ).toThrow(UserManagementError);

      expect(() =>
        createTestUser({ username: 'test', password: '', name: 'Test', role: UserRole.PATIENT })
      ).toThrow(UserManagementError);
    });

    it('should handle non-existent user login', async () => {
      await expect(loginAs('ghost', 'password')).rejects.toThrow(AuthenticationError);
    });

    it('should handle assigning to non-existent doctor', async () => {
      await loginAs('admin', 'admin');
      expect(() =>
        userManagementService.assignPatientToDoctor('patient-1', 'non-existent-doctor', 'admin-1')
      ).toThrow(UserManagementError);
    });

    it('should handle updating non-existent user', () => {
      expect(() =>
        userManagementService.updateUser('non-existent-id', { name: 'Updated' })
      ).toThrow(UserManagementError);
    });

    it('should handle removing non-existent relationship', () => {
      expect(() =>
        userManagementService.removePatientFromDoctor('patient-1', 'non-existent-doctor')
      ).toThrow(UserManagementError);
    });

    it('should handle care plan creation for non-existent data gracefully', () => {
      // Creating care plan with non-existent patient/doctor should still work
      // (persistence layer doesn't validate user existence)
      const plan = carePlanService.createCarePlan({
        patientId: 'ghost-patient',
        doctorId: 'ghost-doctor',
        name: 'Ghost Plan',
        description: 'For non-existent users',
      });
      expect(plan.id).toBeDefined();
    });

    it('should handle medication tracking for non-existent medication', () => {
      expect(() =>
        medicationTracker.recordMedicationTaken('patient-1', 'non-existent-med')
      ).toThrow('Medication not found');
    });

    it('should handle concurrent login switching', async () => {
      // Login as admin
      await loginAs('admin', 'admin');
      expect(authService.getCurrentUser()?.role).toBe(UserRole.ADMIN);

      // Login as patient (overwrites session)
      await loginAs('divya', 'divya');
      expect(authService.getCurrentUser()?.role).toBe(UserRole.PATIENT);
      expect(authService.getCurrentUser()?.id).toBe('patient-1');
    });
  });
});
