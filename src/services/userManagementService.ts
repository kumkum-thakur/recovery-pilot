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
class Us