/**
 * Seed Data - Default users and missions for MVP testing
 * 
 * Provides initial data for:
 * - Default patient (Divya Patel)
 * - Default doctor (Dr. Sarah Smith)
 * - Initial missions for testing
 * 
 * Requirements: 1.1, 2.1, 3.1
 */

import type { UserModel, MissionModel, PatientDoctorRelationship } from '../types';
import { UserRole, MissionType, MissionStatus, ENHANCEMENT_STORAGE_KEYS } from '../types';

/**
 * Default users for testing
 * 
 * Includes:
 * - Patient: Divya Patel (username: divya)
 * - Doctor: Dr. Sarah Smith (username: dr.smith)
 * 
 * Requirements: 1.1, 2.1
 */
export const SEED_USERS: UserModel[] = [
  {
    id: 'admin-1',
    username: 'admin',
    passwordHash: 'simple_hash_admin', // Simple hash for MVP: "simple_hash_" + password
    name: 'System Administrator',
    role: UserRole.ADMIN,
    streakCount: 0,
    lastLoginDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'patient-1',
    username: 'divya',
    passwordHash: 'simple_hash_divya', // Simple hash for MVP: "simple_hash_" + password
    name: 'Divya Patel',
    role: UserRole.PATIENT,
    streakCount: 3,
    lastLoginDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'doctor-1',
    username: 'dr.smith',
    passwordHash: 'simple_hash_smith', // Simple hash for MVP: "simple_hash_" + password
    name: 'Dr. Sarah Smith',
    role: UserRole.DOCTOR,
    streakCount: 0, // Doctors don't use streaks, but field is required
    lastLoginDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

/**
 * Default patient-doctor relationship
 */
export const SEED_RELATIONSHIPS: PatientDoctorRelationship[] = [
  {
    id: 'rel-1',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    assignedAt: new Date().toISOString(),
    assignedBy: 'admin-1',
    active: true,
  },
];

/**
 * Default missions for patient testing
 * 
 * Includes:
 * - Mission 1: Photo upload (Scan Incision)
 * - Mission 2: Medication check
 * 
 * Requirements: 3.1
 */
export const SEED_MISSIONS: MissionModel[] = [
  {
    id: 'mission-1',
    patientId: 'patient-1',
    type: MissionType.PHOTO_UPLOAD,
    title: 'Mission 1: Scan Incision',
    description: 'Take a photo of your surgical incision for healing assessment',
    status: MissionStatus.PENDING,
    dueDate: new Date().toISOString(),
  },
  {
    id: 'mission-2',
    patientId: 'patient-1',
    type: MissionType.MEDICATION_CHECK,
    title: 'Mission 2: Medication Check',
    description: 'Confirm you took your morning antibiotics',
    status: MissionStatus.PENDING,
    dueDate: new Date().toISOString(),
  },
];

/**
 * Initializes the database with seed data if it's empty
 * 
 * This function should be called on application startup to ensure
 * default users and missions exist for testing.
 * 
 * @param persistenceService - The persistence service instance
 */
export function initializeSeedData(persistenceService: {
  getAllUsers: () => UserModel[];
  saveUser: (user: UserModel) => void;
  getAllMissions: () => MissionModel[];
  saveMission: (mission: MissionModel) => void;
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T) => void;
}): void {
  // Initialize users if none exist
  const existingUsers = persistenceService.getAllUsers();
  if (existingUsers.length === 0) {
    SEED_USERS.forEach(user => {
      persistenceService.saveUser(user);
    });
    console.log('✅ Initialized seed users:', SEED_USERS.map(u => u.name).join(', '));
  }

  // Initialize missions if none exist
  const existingMissions = persistenceService.getAllMissions();
  if (existingMissions.length === 0) {
    SEED_MISSIONS.forEach(mission => {
      persistenceService.saveMission(mission);
    });
    console.log('✅ Initialized seed missions:', SEED_MISSIONS.map(m => m.title).join(', '));
  }

  // Initialize relationships if none exist
  const existingRelationships = persistenceService.get<PatientDoctorRelationship[]>(
    ENHANCEMENT_STORAGE_KEYS.RELATIONSHIPS
  );
  if (!existingRelationships || existingRelationships.length === 0) {
    persistenceService.set(ENHANCEMENT_STORAGE_KEYS.RELATIONSHIPS, SEED_RELATIONSHIPS);
    console.log('✅ Initialized seed relationships');
  }
}

/**
 * Reinitializes the database with fresh seed data
 *
 * This function clears ALL localStorage/sessionStorage and reinitializes
 * with seed data. Used for demo mode and corruption recovery.
 *
 * @param persistenceService - The persistence service instance
 *
 * Requirements: 12.4 - Reinitialize with seed data on corruption
 */
export function reinitializeWithSeedData(persistenceService: {
  clearAll: () => void;
  saveUser: (user: UserModel) => void;
  saveMission: (mission: MissionModel) => void;
  set: <T>(key: string, value: T) => void;
}): void {
  console.warn('⚠️ Reinitializing database with fresh seed data...');

  // Clear all existing data (localStorage keys managed by the app)
  persistenceService.clearAll();
  // Also clear any extra keys and sessionStorage for a true fresh start
  localStorage.clear();
  sessionStorage.clear();

  // Reinitialize users
  SEED_USERS.forEach(user => {
    persistenceService.saveUser(user);
  });

  // Reinitialize missions (all pending, fresh dates)
  SEED_MISSIONS.forEach(mission => {
    persistenceService.saveMission({
      ...mission,
      status: MissionStatus.PENDING,
      dueDate: new Date().toISOString(),
      completedAt: undefined,
    });
  });

  // Reinitialize relationships
  persistenceService.set(ENHANCEMENT_STORAGE_KEYS.RELATIONSHIPS, SEED_RELATIONSHIPS);

  // Reinitialize empty action items
  persistenceService.set('recovery_pilot_action_items', []);

  console.log('✅ Database reinitialized with fresh seed data');
}
