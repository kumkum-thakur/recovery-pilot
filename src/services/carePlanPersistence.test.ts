/**
 * Tests for care plan persistence methods in PersistenceService
 * 
 * Requirements: 10.1, 10.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PersistenceServiceImpl } from './persistenceService';
import type { CarePlan } from '../types';
import { CarePlanStatus, CarePlanMissionStatus, MissionType, MedicationStatus, RecurrenceType } from '../types';

describe('PersistenceService - Care Plan Methods', () => {
  let service: PersistenceServiceImpl;

  beforeEach(() => {
    // Create fresh instance and clear storage
    service = new PersistenceServiceImpl();
    localStorage.clear();
  });

  describe('saveCarePlan() and getCarePlan()', () => {
    it('should save and retrieve a care plan', () => {
      const carePlan: CarePlan = {
        id: 'cp-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Post-Surgery Recovery',
        description: 'Recovery plan after knee surgery',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      service.saveCarePlan(carePlan);
      const retrieved = service.getCarePlan('cp-1');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('cp-1');
      expect(retrieved?.patientId).toBe('patient-1');
      expect(retrieved?.doctorId).toBe('doctor-1');
      expect(retrieved?.name).toBe('Post-Surgery Recovery');
      expect(retrieved?.createdAt).toEqual(carePlan.createdAt);
      expect(retrieved?.updatedAt).toEqual(carePlan.updatedAt);
    });

    it('should return null for non-existent care plan', () => {
      const retrieved = service.getCarePlan('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should update existing care plan', () => {
      const carePlan: CarePlan = {
        id: 'cp-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Original Name',
        description: 'Original description',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      service.saveCarePlan(carePlan);

      const updated: CarePlan = {
        ...carePlan,
        name: 'Updated Name',
        updatedAt: new Date('2024-01-02T10:00:00Z'),
      };

      service.saveCarePlan(updated);
      const retrieved = service.getCarePlan('cp-1');

      expect(retrieved?.name).toBe('Updated Name');
      expect(retrieved?.updatedAt).toEqual(new Date('2024-01-02T10:00:00Z'));
    });
  });

  describe('getCarePlansForPatient()', () => {
    it('should retrieve all care plans for a patient', () => {
      const carePlan1: CarePlan = {
        id: 'cp-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Plan 1',
        description: 'Description 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      const carePlan2: CarePlan = {
        id: 'cp-2',
        patientId: 'patient-1',
        doctorId: 'doctor-2',
        name: 'Plan 2',
        description: 'Description 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      const carePlan3: CarePlan = {
        id: 'cp-3',
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        name: 'Plan 3',
        description: 'Description 3',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      service.saveCarePlan(carePlan1);
      service.saveCarePlan(carePlan2);
      service.saveCarePlan(carePlan3);

      const patient1Plans = service.getCarePlansForPatient('patient-1');
      expect(patient1Plans).toHaveLength(2);
      expect(patient1Plans.map(p => p.id)).toContain('cp-1');
      expect(patient1Plans.map(p => p.id)).toContain('cp-2');
    });

    it('should return empty array for patient with no care plans', () => {
      const plans = service.getCarePlansForPatient('non-existent');
      expect(plans).toEqual([]);
    });
  });

  describe('getCarePlansForDoctor()', () => {
    it('should retrieve all care plans for a doctor', () => {
      const carePlan1: CarePlan = {
        id: 'cp-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Plan 1',
        description: 'Description 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      const carePlan2: CarePlan = {
        id: 'cp-2',
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        name: 'Plan 2',
        description: 'Description 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      const carePlan3: CarePlan = {
        id: 'cp-3',
        patientId: 'patient-1',
        doctorId: 'doctor-2',
        name: 'Plan 3',
        description: 'Description 3',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      service.saveCarePlan(carePlan1);
      service.saveCarePlan(carePlan2);
      service.saveCarePlan(carePlan3);

      const doctor1Plans = service.getCarePlansForDoctor('doctor-1');
      expect(doctor1Plans).toHaveLength(2);
      expect(doctor1Plans.map(p => p.id)).toContain('cp-1');
      expect(doctor1Plans.map(p => p.id)).toContain('cp-2');
    });

    it('should return empty array for doctor with no care plans', () => {
      const plans = service.getCarePlansForDoctor('non-existent');
      expect(plans).toEqual([]);
    });
  });

  describe('deleteCarePlan()', () => {
    it('should delete a care plan', () => {
      const carePlan: CarePlan = {
        id: 'cp-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Plan to Delete',
        description: 'This will be deleted',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      service.saveCarePlan(carePlan);
      expect(service.getCarePlan('cp-1')).not.toBeNull();

      service.deleteCarePlan('cp-1');
      expect(service.getCarePlan('cp-1')).toBeNull();
    });

    it('should not affect other care plans', () => {
      const carePlan1: CarePlan = {
        id: 'cp-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Plan 1',
        description: 'Description 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      const carePlan2: CarePlan = {
        id: 'cp-2',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Plan 2',
        description: 'Description 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CarePlanStatus.ACTIVE,
        missions: [],
        medications: [],
      };

      service.saveCarePlan(carePlan1);
      service.saveCarePlan(carePlan2);

      service.deleteCarePlan('cp-1');

      expect(service.getCarePlan('cp-1')).toBeNull();
      expect(service.getCarePlan('cp-2')).not.toBeNull();
    });
  });

  describe('Care plan with nested structures', () => {
    it('should preserve missions and medications in round-trip', () => {
      const carePlan: CarePlan = {
        id: 'cp-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        name: 'Complex Plan',
        description: 'Plan with missions and medications',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
        status: CarePlanStatus.ACTIVE,
        missions: [
          {
            id: 'mission-1',
            carePlanId: 'cp-1',
            type: MissionType.PHOTO_UPLOAD,
            title: 'Daily Photo',
            description: 'Upload wound photo',
            schedule: {
              startDate: new Date('2024-01-02T08:00:00Z'),
              recurrence: {
                type: RecurrenceType.DAILY,
              },
              occurrences: 7,
              timeOfDay: '08:00',
            },
            status: CarePlanMissionStatus.ACTIVE,
            createdAt: new Date('2024-01-01T10:00:00Z'),
          },
        ],
        medications: [
          {
            id: 'med-1',
            carePlanId: 'cp-1',
            medicationName: 'Ibuprofen',
            dosage: '400mg',
            frequency: {
              timesPerDay: 2,
              times: ['08:00', '20:00'],
            },
            duration: 7,
            refillThreshold: 5,
            instructions: 'Take with food',
            startDate: new Date('2024-01-02T08:00:00Z'),
            endDate: new Date('2024-01-09T08:00:00Z'),
            status: MedicationStatus.ACTIVE,
            createdAt: new Date('2024-01-01T10:00:00Z'),
          },
        ],
      };

      service.saveCarePlan(carePlan);
      const retrieved = service.getCarePlan('cp-1');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.missions).toHaveLength(1);
      expect(retrieved?.missions[0].title).toBe('Daily Photo');
      expect(retrieved?.missions[0].schedule.startDate).toEqual(new Date('2024-01-02T08:00:00Z'));
      expect(retrieved?.missions[0].schedule.recurrence.type).toBe(RecurrenceType.DAILY);
      
      expect(retrieved?.medications).toHaveLength(1);
      expect(retrieved?.medications[0].medicationName).toBe('Ibuprofen');
      expect(retrieved?.medications[0].frequency.timesPerDay).toBe(2);
      expect(retrieved?.medications[0].startDate).toEqual(new Date('2024-01-02T08:00:00Z'));
    });
  });
});
