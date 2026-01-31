/**
 * Unit tests for seed data
 * 
 * Validates that seed data is correctly structured and contains
 * all required fields for users and missions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SEED_USERS, SEED_MISSIONS, initializeSeedData } from './seedData';
import { UserRole, MissionType, MissionStatus } from '../types';

describe('Seed Data', () => {
  describe('SEED_USERS', () => {
    it('should contain exactly 2 users (1 patient, 1 doctor)', () => {
      expect(SEED_USERS).toHaveLength(2);
      
      const patients = SEED_USERS.filter(u => u.role === UserRole.PATIENT);
      const doctors = SEED_USERS.filter(u => u.role === UserRole.DOCTOR);
      
      expect(patients).toHaveLength(1);
      expect(doctors).toHaveLength(1);
    });

    it('should have patient with correct structure', () => {
      const patient = SEED_USERS.find(u => u.role === UserRole.PATIENT);
      
      expect(patient).toBeDefined();
      expect(patient?.id).toBe('patient-1');
      expect(patient?.username).toBe('divya');
      expect(patient?.name).toBe('Divya Patel');
      expect(patient?.passwordHash).toBe('simple_hash_divya');
      expect(patient?.streakCount).toBe(3);
      expect(patient?.lastLoginDate).toBeDefined();
      expect(patient?.createdAt).toBeDefined();
    });

    it('should have doctor with correct structure', () => {
      const doctor = SEED_USERS.find(u => u.role === UserRole.DOCTOR);
      
      expect(doctor).toBeDefined();
      expect(doctor?.id).toBe('doctor-1');
      expect(doctor?.username).toBe('dr.smith');
      expect(doctor?.name).toBe('Dr. Sarah Smith');
      expect(doctor?.passwordH