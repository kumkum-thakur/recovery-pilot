/**
 * Integration tests for User Management Service
 * Tests user creation and login flow with password hashing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { userManagementService } from './userManagementService';
import { authService } from './authService';
import { persistenceService } from './persistenceService';
import { UserRole } from '../types';

describe('UserManagementService - Integration Tests', () => {
  beforeEach(() => {
    // Clear all data before each test
    persistenceService.clearAll();
  });

  describe('User Creation and Login Flow', () => {
    it('should create a patient and allow login with correct credentials', async () => {
      // Create a patient user
      const patientData = {
        username: 'testpatient',
        password: 'patient123',
        name: 'Test Patient',
        role: UserRole.PATIENT,
        email: 'patient@test.com',
        dateOfBirth: '1990-01-01',
      };

      const createdUser = userManagementService.createUser(patientData, 'admin');

      // Verify user was created
      expect(createdUser).toBeDefined();
      expect(createdUser.username).toBe('testpatient');
      expect(createdUser.role).toBe(UserRole.PATIENT);
      expect(createdUser.passwordHash).toBe('simple_hash_patient123');

      // Try to login with the created user
      const loggedInUser = await authService.login('testpatient', 'patient123');

      // Verify login was successful
      expect(loggedInUser).toBeDefined();
      expect(loggedInUser.name).toBe('Test Patient');
      expect(loggedInUser.role).toBe(UserRole.PATIENT);
    });

    it('should create a doctor and allow login with correct credentials', async () => {
      // Create a doctor user
      const doctorData = {
        username: 'testdoctor',
        password: 'doctor123',
        name: 'Dr. Test',
        role: UserRole.DOCTOR,
        email: 'doctor@test.com',
        specialization: 'Cardiology',
      };

      const createdUser = userManagementService.createUser(doctorData, 'admin');

      // Verify user was created
      expect(createdUser).toBeDefined();
      expect(createdUser.username).toBe('testdoctor');
      expect(createdUser.role).toBe(UserRole.DOCTOR);
      expect(createdUser.passwordHash).toBe('simple_hash_doctor123');

      // Try to login with the created user
      const loggedInUser = await authService.login('testdoctor', 'doctor123');

      // Verify login was successful
      expect(loggedInUser).toBeDefined();
      expect(loggedInUser.name).toBe('Dr. Test');
      expect(loggedInUser.role).toBe(UserRole.DOCTOR);
    });

    it('should create an admin and allow login with correct credentials', async () => {
      // Create an admin user
      const adminData = {
        username: 'testadmin',
        password: 'admin123',
        name: 'Test Admin',
        role: UserRole.ADMIN,
        email: 'admin@test.com',
      };

      const createdUser = userManagementService.createUser(adminData, 'superadmin');

      // Verify user was created
      expect(createdUser).toBeDefined();
      expect(createdUser.username).toBe('testadmin');
      expect(createdUser.role).toBe(UserRole.ADMIN);
      expect(createdUser.passwordHash).toBe('simple_hash_admin123');

      // Try to login with the created user
      const loggedInUser = await authService.login('testadmin', 'admin123');

      // Verify login was successful
      expect(loggedInUser).toBeDefined();
      expect(loggedInUser.name).toBe('Test Admin');
      expect(loggedInUser.role).toBe(UserRole.ADMIN);
    });

    it('should fail login with incorrect password', async () => {
      // Create a user
      const userData = {
        username: 'testuser',
        password: 'correct123',
        name: 'Test User',
        role: UserRole.PATIENT,
      };

      userManagementService.createUser(userData, 'admin');

      // Try to login with wrong password - should throw error
      await expect(authService.login('testuser', 'wrong123')).rejects.toThrow('Invalid username or password');
    });

    it('should update user password and allow login with new password', async () => {
      // Create a user
      const userData = {
        username: 'updatetest',
        password: 'oldpass123',
        name: 'Update Test',
        role: UserRole.PATIENT,
      };

      const createdUser = userManagementService.createUser(userData, 'admin');

      // Verify login with old password works
      const oldLoginUser = await authService.login('updatetest', 'oldpass123');
      expect(oldLoginUser).toBeDefined();

      // Update password
      userManagementService.updateUser(createdUser.id, {
        password: 'newpass456',
      });

      // Verify old password no longer works
      await expect(authService.login('updatetest', 'oldpass123')).rejects.toThrow('Invalid username or password');

      // Verify new password works
      const newLoginUser = await authService.login('updatetest', 'newpass456');
      expect(newLoginUser).toBeDefined();
      expect(newLoginUser.name).toBe('Update Test');
    });

    it('should create multiple users and allow each to login independently', async () => {
      // Create multiple users
      const users = [
        { username: 'patient1', password: 'pass1', name: 'Patient One', role: UserRole.PATIENT },
        { username: 'patient2', password: 'pass2', name: 'Patient Two', role: UserRole.PATIENT },
        { username: 'doctor1', password: 'pass3', name: 'Doctor One', role: UserRole.DOCTOR },
      ];

      users.forEach(userData => {
        userManagementService.createUser(userData, 'admin');
      });

      // Verify each user can login with their own credentials
      const login1 = await authService.login('patient1', 'pass1');
      expect(login1).toBeDefined();
      expect(login1.name).toBe('Patient One');

      const login2 = await authService.login('patient2', 'pass2');
      expect(login2).toBeDefined();
      expect(login2.name).toBe('Patient Two');

      const login3 = await authService.login('doctor1', 'pass3');
      expect(login3).toBeDefined();
      expect(login3.name).toBe('Doctor One');

      // Verify cross-login fails
      await expect(authService.login('patient1', 'pass2')).rejects.toThrow('Invalid username or password');
    });
  });
});
