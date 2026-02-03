/**
 * User Management Service
 * 
 * Handles user creation, patient-doctor relationships, and admin operations
 * Requirements: Enhancement - Admin dashboard, doctor patient management
 */

import type { UserModel, PatientDoctorRelationship, UserRole } from '../types';
import { UserRole as UserRoleEnum, ENHANCEMENT_STORAGE_KEYS } from '../types';
import { persistenceService } from './persistenceService';

console.log('🔧 [UserManagementService] Module loaded');

/**
 * User creation data
 */
export interface UserCreationData {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string;
  specialization?: string; // For doctors
  dateOfBirth?: string; // For patients
}

/**
 * Error class for user management operations
 */
export class UserManagementError extends Error {
  constructor(
    message: string,
    public code: 'DUPLICATE_USERNAME' | 'INVALID_DATA' | 'NOT_FOUND' | 'DUPLICATE_RELATIONSHIP' | 'UNAUTHORIZED'
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

/**
 * User Management Service
 */
class UserManagementService {
  /**
   * Create a new user account
   */
  createUser(userData: UserCreationData, createdBy: string): UserModel {
    console.log('👤 [UserManagementService] Creating user:', {
      username: userData.username,
      role: userData.role,
      createdBy,
    });

    // Validate required fields
    if (!userData.username || !userData.password || !userData.name || !userData.role) {
      console.error('❌ [UserManagementService] Invalid user data - missing required fields');
      throw new UserManagementError('Missing required fields', 'INVALID_DATA');
    }

    // Check for duplicate username
    const existingUsers = persistenceService.getAllUsers();
    const duplicate = existingUsers.find(u => u.username === userData.username);
    
    if (duplicate) {
      console.error('❌ [UserManagementService] Duplicate username:', userData.username);
      throw new UserManagementError('Username already exists', 'DUPLICATE_USERNAME');
    }

    // Create user model
    const newUser: UserModel = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: userData.username,
      passwordHash: userData.password, // In production, this should be hashed
      name: userData.name,
      role: userData.role,
      streakCount: userData.role === UserRoleEnum.PATIENT ? 0 : 0,
      lastLoginDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Save user
    persistenceService.saveUser(newUser);
    
    console.log('✅ [UserManagementService] User created successfully:', {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });

    return newUser;
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers(): UserModel[] {
    console.log('📋 [UserManagementService] Fetching all users');
    const users = persistenceService.getAllUsers();
    console.log(`✅ [UserManagementService] Found ${users.length} users`);
    return users;
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): UserModel | null {
    console.log('🔍 [UserManagementService] Fetching user by ID:', userId);
    const user = persistenceService.getUser(userId);
    
    if (!user) {
      console.warn('⚠️ [UserManagementService] User not found:', userId);
    } else {
      console.log('✅ [UserManagementService] User found:', user.username);
    }
    
    return user;
  }

  /**
   * Assign patient to doctor
   */
  assignPatientToDoctor(patientId: string, doctorId: string, assignedBy: string): PatientDoctorRelationship {
    console.log('🔗 [UserManagementService] Assigning patient to doctor:', {
      patientId,
      doctorId,
      assignedBy,
    });

    // Validate users exist
    const patient = this.getUserById(patientId);
    const doctor = this.getUserById(doctorId);

    if (!patient) {
      console.error('❌ [UserManagementService] Patient not found:', patientId);
      throw new UserManagementError('Patient not found', 'NOT_FOUND');
    }

    if (!doctor) {
      console.error('❌ [UserManagementService] Doctor not found:', doctorId);
      throw new UserManagementError('Doctor not found', 'NOT_FOUND');
    }

    // Validate roles
    if (patient.role !== UserRoleEnum.PATIENT) {
      console.error('❌ [UserManagementService] User is not a patient:', patientId);
      throw new UserManagementError('User is not a patient', 'INVALID_DATA');
    }

    if (doctor.role !== UserRoleEnum.DOCTOR) {
      console.error('❌ [UserManagementService] User is not a doctor:', doctorId);
      throw new UserManagementError('User is not a doctor', 'INVALID_DATA');
    }

    // Check for existing relationship
    const relationships = this.getAllRelationships();
    const existing = relationships.find(
      r => r.patientId === patientId && r.doctorId === doctorId && r.active
    );

    if (existing) {
      console.error('❌ [UserManagementService] Relationship already exists');
      throw new UserManagementError('Patient already assigned to this doctor', 'DUPLICATE_RELATIONSHIP');
    }

    // Create relationship
    const relationship: PatientDoctorRelationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      doctorId,
      assignedAt: new Date().toISOString(),
      assignedBy,
      active: true,
    };

    // Save relationship
    const allRelationships = [...relationships, relationship];
    this.saveRelationships(allRelationships);

    console.log('✅ [UserManagementService] Relationship created:', relationship.id);

    return relationship;
  }

  /**
   * Get patients for a doctor
   */
  getPatientsForDoctor(doctorId: string): UserModel[] {
    console.log('👥 [UserManagementService] Fetching patients for doctor:', doctorId);

    const relationships = this.getAllRelationships();
    const activeRelationships = relationships.filter(
      r => r.doctorId === doctorId && r.active
    );

    console.log(`📊 [UserManagementService] Found ${activeRelationships.length} active relationships`);

    const patients = activeRelationships
      .map(r => this.getUserById(r.patientId))
      .filter((p): p is UserModel => p !== null);

    console.log(`✅ [UserManagementService] Returning ${patients.length} patients`);

    return patients;
  }

  /**
   * Remove patient from doctor's care list
   */
  removePatientFromDoctor(patientId: string, doctorId: string): void {
    console.log('🗑️ [UserManagementService] Removing patient from doctor:', {
      patientId,
      doctorId,
    });

    const relationships = this.getAllRelationships();
    const relationship = relationships.find(
      r => r.patientId === patientId && r.doctorId === doctorId && r.active
    );

    if (!relationship) {
      console.error('❌ [UserManagementService] Relationship not found');
      throw new UserManagementError('Relationship not found', 'NOT_FOUND');
    }

    // Mark as inactive
    relationship.active = false;
    this.saveRelationships(relationships);

    console.log('✅ [UserManagementService] Relationship removed');
  }

  /**
   * Get all relationships
   */
  getAllRelationships(): PatientDoctorRelationship[] {
    const data = persistenceService.get<PatientDoctorRelationship[]>(
      ENHANCEMENT_STORAGE_KEYS.RELATIONSHIPS
    );
    return data || [];
  }

  /**
   * Get all active relationships
   */
  getActiveRelationships(): PatientDoctorRelationship[] {
    return this.getAllRelationships().filter(r => r.active);
  }

  /**
   * Save relationships
   */
  private saveRelationships(relationships: PatientDoctorRelationship[]): void {
    persistenceService.set(ENHANCEMENT_STORAGE_KEYS.RELATIONSHIPS, relationships);
  }
}

export const userManagementService = new UserManagementService();
console.log('✅ [UserManagementService] Service initialized');
