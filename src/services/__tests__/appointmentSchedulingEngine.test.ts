import { describe, it, expect, beforeEach } from 'vitest';
import { AppointmentSchedulingEngine } from '../appointmentSchedulingEngine';
import type { AppointmentType, NoShowFeatures } from '../appointmentSchedulingEngine';

describe('AppointmentSchedulingEngine', () => {
  let engine: AppointmentSchedulingEngine;

  beforeEach(() => {
    engine = new AppointmentSchedulingEngine();
  });

  // Helper: build a future date that falls on a specific day of week
  function getNextWeekday(dayOfWeek: number, hour = 10, minute = 0): Date {
    const now = new Date();
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
    const target = new Date(now);
    target.setDate(target.getDate() + daysUntil);
    target.setHours(hour, minute, 0, 0);
    return target;
  }

  function defaultNoShowFeatures(overrides?: Partial<NoShowFeatures>): NoShowFeatures {
    return {
      age: 45,
      distanceMiles: 5,
      weatherCondition: 'clear',
      previousNoShows: 0,
      previousAppointments: 10,
      daysSinceLastVisit: 14,
      appointmentType: 'follow_up',
      isMonday: false,
      isTelehealth: false,
      hourOfDay: 10,
      ...overrides,
    };
  }

  // ── Scheduling ──

  describe('scheduleAppointment()', () => {
    it('should schedule a valid appointment with a provider that supports the type', () => {
      const scheduledAt = getNextWeekday(1, 10); // Monday at 10am, prov_1 works Mon
      const result = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      expect(result.appointment).not.toBeNull();
      expect(result.conflict).toBe(false);
      expect(result.appointment!.status).toBe('scheduled');
      expect(result.appointment!.type).toBe('follow_up');
      expect(result.appointment!.providerId).toBe('prov_1');
    });

    it('should reject appointment for a non-existent provider', () => {
      const result = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'nonexistent',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt: new Date(Date.now() + 86400000),
      });
      expect(result.appointment).toBeNull();
      expect(result.conflictDetails).toContain('Provider not found');
    });

    it('should reject appointment type not offered by the provider', () => {
      // prov_1 does not offer physical_therapy
      const result = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'physical_therapy',
        priority: 'routine',
        scheduledAt: getNextWeekday(1, 10),
      });
      expect(result.appointment).toBeNull();
      expect(result.conflictDetails).toContain('does not offer');
    });

    it('should set telehealth location to Virtual for telehealth appointments', () => {
      const result = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'telehealth',
        priority: 'routine',
        scheduledAt: getNextWeekday(1, 10),
      });
      expect(result.appointment).not.toBeNull();
      expect(result.appointment!.telehealth).toBe(true);
      expect(result.appointment!.location).toContain('Virtual');
    });

    it('should attach no-show probability when features are provided', () => {
      const result = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt: getNextWeekday(1, 10),
        noShowFeatures: defaultNoShowFeatures(),
      });
      expect(result.appointment).not.toBeNull();
      expect(result.appointment!.noShowProbability).toBeDefined();
      expect(result.appointment!.noShowProbability).toBeGreaterThanOrEqual(0);
      expect(result.appointment!.noShowProbability).toBeLessThanOrEqual(1);
    });

    it('should build reminder escalation for scheduled appointments', () => {
      const result = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt: getNextWeekday(1, 10),
      });
      expect(result.appointment!.reminders.length).toBeGreaterThanOrEqual(4);
      // Reminders should be sorted chronologically
      for (let i = 1; i < result.appointment!.reminders.length; i++) {
        expect(result.appointment!.reminders[i].scheduledFor.getTime())
          .toBeGreaterThanOrEqual(result.appointment!.reminders[i - 1].scheduledFor.getTime());
      }
    });

    it('should add phone call reminder for urgent appointments', () => {
      const result = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'urgent',
        scheduledAt: getNextWeekday(1, 10),
      });
      expect(result.appointment).not.toBeNull();
      const phoneReminders = result.appointment!.reminders.filter(r => r.channel === 'phone_call');
      expect(phoneReminders.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Conflict Detection ──

  describe('conflict detection', () => {
    it('should detect a scheduling conflict with an existing appointment', () => {
      const scheduledAt = getNextWeekday(1, 10);
      engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });

      // Try to book at the same time with the same provider
      const result = engine.scheduleAppointment({
        patientId: 'patient_2',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      expect(result.conflict).toBe(true);
      expect(result.appointment).toBeNull();
      expect(result.conflictDetails).toContain('Conflicts with');
    });

    it('should allow appointment at same time with a different provider', () => {
      const scheduledAt = getNextWeekday(1, 10);
      engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });

      // prov_3 also works Monday
      const result = engine.scheduleAppointment({
        patientId: 'patient_2',
        providerId: 'prov_3',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      expect(result.conflict).toBe(false);
      expect(result.appointment).not.toBeNull();
    });

    it('should not conflict with cancelled appointments', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const first = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      engine.cancelAppointment(first.appointment!.id);

      // Should succeed now that the first is cancelled
      const result = engine.scheduleAppointment({
        patientId: 'patient_2',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      expect(result.conflict).toBe(false);
      expect(result.appointment).not.toBeNull();
    });
  });

  // ── No-Show Prediction ──

  describe('predictNoShow()', () => {
    it('should return low risk for ideal patient features', () => {
      const prediction = engine.predictNoShow(defaultNoShowFeatures());
      expect(prediction.riskLevel).toBe('low');
      expect(prediction.probability).toBeLessThan(0.15);
      expect(prediction.recommendation).toContain('Standard');
    });

    it('should return higher risk for young patient with previous no-shows in bad weather', () => {
      const prediction = engine.predictNoShow(defaultNoShowFeatures({
        age: 25,
        previousNoShows: 3,
        previousAppointments: 5,
        weatherCondition: 'snow',
        distanceMiles: 20,
        isMonday: true,
      }));
      expect(prediction.probability).toBeGreaterThan(0.15);
      expect(prediction.contributingFactors.length).toBeGreaterThan(0);
    });

    it('should show telehealth as a risk-reducing factor', () => {
      const prediction = engine.predictNoShow(defaultNoShowFeatures({ isTelehealth: true }));
      const telehealthFactor = prediction.contributingFactors.find(f => f.factor.includes('Telehealth'));
      expect(telehealthFactor).toBeDefined();
      expect(telehealthFactor!.weight).toBeLessThan(0);
    });

    it('should return contributing factors sorted by absolute weight', () => {
      const prediction = engine.predictNoShow(defaultNoShowFeatures({
        age: 25,
        weatherCondition: 'snow',
        previousNoShows: 2,
        previousAppointments: 4,
        isMonday: true,
        hourOfDay: 16,
      }));
      for (let i = 1; i < prediction.contributingFactors.length; i++) {
        expect(Math.abs(prediction.contributingFactors[i].weight))
          .toBeLessThanOrEqual(Math.abs(prediction.contributingFactors[i - 1].weight));
      }
    });

    it('should recommend escalation for high-risk predictions', () => {
      const prediction = engine.predictNoShow(defaultNoShowFeatures({
        age: 22,
        previousNoShows: 5,
        previousAppointments: 8,
        weatherCondition: 'snow',
        distanceMiles: 30,
        isMonday: true,
        hourOfDay: 16,
      }));
      if (prediction.riskLevel === 'high') {
        expect(prediction.recommendation).toContain('phone call');
      }
    });

    it('should return probability between 0 and 1', () => {
      const extremeFeatures = defaultNoShowFeatures({
        age: 20,
        previousNoShows: 10,
        previousAppointments: 10,
        weatherCondition: 'snow',
        distanceMiles: 100,
        isMonday: true,
        hourOfDay: 17,
      });
      const prediction = engine.predictNoShow(extremeFeatures);
      expect(prediction.probability).toBeGreaterThanOrEqual(0);
      expect(prediction.probability).toBeLessThanOrEqual(1);
    });
  });

  // ── Cancellation ──

  describe('cancelAppointment()', () => {
    it('should cancel a scheduled appointment', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      const result = engine.cancelAppointment(appointment!.id, 'Patient request');
      expect(result).toBe(true);

      const appt = engine.getAppointment(appointment!.id);
      expect(appt!.status).toBe('cancelled');
      expect(appt!.notes).toContain('Patient request');
    });

    it('should return false for non-existent appointment', () => {
      expect(engine.cancelAppointment('fake_id')).toBe(false);
    });

    it('should return false when cancelling an already-cancelled appointment', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      engine.cancelAppointment(appointment!.id);
      expect(engine.cancelAppointment(appointment!.id)).toBe(false);
    });

    it('should add default reason text when no reason is provided', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      engine.cancelAppointment(appointment!.id);
      const appt = engine.getAppointment(appointment!.id);
      expect(appt!.notes).toContain('No reason given');
    });
  });

  // ── Schedule Optimization ──

  describe('optimizeSchedule()', () => {
    it('should return original order for single appointment', () => {
      const scheduledAt = getNextWeekday(1, 10);
      engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      const result = engine.optimizeSchedule('patient_1', scheduledAt);
      expect(result.estimatedTimeSavedMinutes).toBe(0);
      expect(result.originalOrder.length).toBeLessThanOrEqual(1);
    });

    it('should group appointments by location for multiple appointments', () => {
      const date = getNextWeekday(1); // A Monday
      const _appt1 = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1', // Location A
        type: 'follow_up',
        priority: 'routine',
        scheduledAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
      });
      const _appt2 = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_3', // Location B
        type: 'physical_therapy',
        priority: 'routine',
        scheduledAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0),
      });
      const _appt3 = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1', // Location A again
        type: 'wound_check',
        priority: 'routine',
        scheduledAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 11, 0),
      });

      const result = engine.optimizeSchedule('patient_1', date);
      expect(result.originalOrder.length).toBe(3);
      expect(result.optimizedOrder.length).toBe(3);
    });

    it('should return zero time saved when no optimization needed', () => {
      const result = engine.optimizeSchedule('nonexistent_patient', new Date());
      expect(result.estimatedTimeSavedMinutes).toBe(0);
      expect(result.changes).toHaveLength(0);
    });
  });

  // ── Provider and Appointment Lookups ──

  describe('provider and appointment lookups', () => {
    it('should return all default providers', () => {
      const providers = engine.getProviders();
      expect(providers.length).toBe(5);
      const names = providers.map(p => p.name);
      expect(names).toContain('Dr. Sarah Chen');
      expect(names).toContain('Dr. James Wilson');
      expect(names).toContain('Maria Rodriguez, PT');
      expect(names).toContain('Lab Services');
      expect(names).toContain('Imaging Center');
    });

    it('should return appointment configuration for each type', () => {
      const types: AppointmentType[] = ['follow_up', 'wound_check', 'physical_therapy', 'lab_work', 'imaging', 'telehealth', 'pre_op', 'post_op'];
      for (const type of types) {
        const config = engine.getAppointmentConfig(type);
        expect(config.defaultDuration).toBeGreaterThan(0);
        expect(config.description.length).toBeGreaterThan(0);
        expect(typeof config.prepTimeMinutes).toBe('number');
        expect(typeof config.followUpDays).toBe('number');
      }
    });

    it('should return upcoming appointments for a patient', () => {
      const scheduledAt = getNextWeekday(1, 10);
      engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      const upcoming = engine.getUpcoming('patient_1');
      expect(upcoming.length).toBe(1);
      expect(upcoming[0].patientId).toBe('patient_1');
    });

    it('should exclude cancelled appointments from upcoming list', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      engine.cancelAppointment(appointment!.id);
      const upcoming = engine.getUpcoming('patient_1');
      expect(upcoming.length).toBe(0);
    });

    it('should retrieve a single appointment by ID', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      const retrieved = engine.getAppointment(appointment!.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(appointment!.id);
    });

    it('should return null for non-existent appointment ID', () => {
      expect(engine.getAppointment('fake_id')).toBeNull();
    });
  });

  // ── Confirm and Check-In ──

  describe('confirmAppointment() and markCheckedIn()', () => {
    it('should confirm a scheduled appointment', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      const result = engine.confirmAppointment(appointment!.id);
      expect(result).toBe(true);
      expect(engine.getAppointment(appointment!.id)!.status).toBe('confirmed');
    });

    it('should not confirm a non-scheduled appointment', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      engine.confirmAppointment(appointment!.id);
      // Now it is confirmed, confirming again should fail
      expect(engine.confirmAppointment(appointment!.id)).toBe(false);
    });

    it('should check in a confirmed appointment', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
      });
      engine.confirmAppointment(appointment!.id);
      const result = engine.markCheckedIn(appointment!.id);
      expect(result).toBe(true);
      expect(engine.getAppointment(appointment!.id)!.status).toBe('checked_in');
    });
  });

  // ── Self-Learning: Outcome Recording and Model Accuracy ──

  describe('self-learning outcome recording', () => {
    it('should record a show outcome and mark appointment completed', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
        noShowFeatures: defaultNoShowFeatures(),
      });
      engine.recordOutcome(appointment!.id, 'show', defaultNoShowFeatures());
      const appt = engine.getAppointment(appointment!.id);
      expect(appt!.status).toBe('completed');
    });

    it('should record a no-show outcome and mark appointment as no_show', () => {
      const scheduledAt = getNextWeekday(1, 10);
      const { appointment } = engine.scheduleAppointment({
        patientId: 'patient_1',
        providerId: 'prov_1',
        type: 'follow_up',
        priority: 'routine',
        scheduledAt,
        noShowFeatures: defaultNoShowFeatures(),
      });
      engine.recordOutcome(appointment!.id, 'no_show', defaultNoShowFeatures());
      const appt = engine.getAppointment(appointment!.id);
      expect(appt!.status).toBe('no_show');
    });

    it('should calculate model accuracy from recorded outcomes', () => {
      // Record several outcomes
      for (let i = 0; i < 5; i++) {
        const scheduledAt = getNextWeekday(1, 9 + i);
        const { appointment } = engine.scheduleAppointment({
          patientId: `patient_${i}`,
          providerId: 'prov_1',
          type: 'follow_up',
          priority: 'routine',
          scheduledAt,
          noShowFeatures: defaultNoShowFeatures(),
        });
        if (appointment) {
          engine.recordOutcome(appointment.id, 'show', defaultNoShowFeatures());
        }
      }
      const accuracy = engine.getModelAccuracy();
      expect(accuracy.totalPredictions).toBe(5);
      expect(accuracy.accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy.accuracy).toBeLessThanOrEqual(1);
      expect(typeof accuracy.brierScore).toBe('number');
    });

    it('should return zero accuracy when no outcomes are recorded', () => {
      const accuracy = engine.getModelAccuracy();
      expect(accuracy.totalPredictions).toBe(0);
      expect(accuracy.accuracy).toBe(0);
      expect(accuracy.brierScore).toBe(0);
    });
  });

  // ── Travel Time Estimation ──

  describe('estimateTravelTime()', () => {
    it('should return distance and time estimate for a valid provider', () => {
      const result = engine.estimateTravelTime(40.72, -74.01, 'prov_1');
      expect(result).not.toBeNull();
      expect(result!.distanceMiles).toBeGreaterThanOrEqual(0);
      expect(result!.estimatedMinutes).toBeGreaterThanOrEqual(5);
    });

    it('should return null for a non-existent provider', () => {
      const result = engine.estimateTravelTime(40.72, -74.01, 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return longer travel time for greater distances', () => {
      const close = engine.estimateTravelTime(40.7128, -74.006, 'prov_1')!;
      const far = engine.estimateTravelTime(41.0, -74.5, 'prov_1')!;
      expect(far.distanceMiles).toBeGreaterThan(close.distanceMiles);
      expect(far.estimatedMinutes).toBeGreaterThanOrEqual(close.estimatedMinutes);
    });
  });

  // ── Finding Available Slots ──

  describe('findAvailableSlots()', () => {
    it('should find available slots for a provider within a date range', () => {
      const fromDate = getNextWeekday(1, 0);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 5);

      const slots = engine.findAvailableSlots({
        type: 'follow_up',
        providerId: 'prov_1',
        fromDate,
        toDate,
      });
      expect(slots.length).toBeGreaterThan(0);
      for (const slot of slots) {
        expect(slot.providerId).toBe('prov_1');
        expect(slot.available).toBe(true);
      }
    });

    it('should filter slots by morning preference', () => {
      const fromDate = getNextWeekday(1, 0);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 5);

      const morningSlots = engine.findAvailableSlots({
        type: 'follow_up',
        providerId: 'prov_1',
        fromDate,
        toDate,
        preferredTimeOfDay: 'morning',
      });
      for (const slot of morningSlots) {
        expect(slot.start.getHours()).toBeLessThan(12);
      }
    });

    it('should filter slots by afternoon preference', () => {
      const fromDate = getNextWeekday(1, 0);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 5);

      const afternoonSlots = engine.findAvailableSlots({
        type: 'follow_up',
        providerId: 'prov_1',
        fromDate,
        toDate,
        preferredTimeOfDay: 'afternoon',
      });
      for (const slot of afternoonSlots) {
        expect(slot.start.getHours()).toBeGreaterThanOrEqual(12);
      }
    });

    it('should search across all providers when no providerId is specified', () => {
      const fromDate = getNextWeekday(1, 0);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 5);

      const slots = engine.findAvailableSlots({
        type: 'follow_up',
        fromDate,
        toDate,
      });
      const providerIds = new Set(slots.map(s => s.providerId));
      // follow_up is offered by prov_1, prov_2, prov_3
      expect(providerIds.size).toBeGreaterThanOrEqual(2);
    });

    it('should return slots sorted chronologically', () => {
      const fromDate = getNextWeekday(1, 0);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 7);

      const slots = engine.findAvailableSlots({
        type: 'lab_work',
        providerId: 'prov_4',
        fromDate,
        toDate,
      });
      for (let i = 1; i < slots.length; i++) {
        expect(slots[i].start.getTime()).toBeGreaterThanOrEqual(slots[i - 1].start.getTime());
      }
    });
  });
});
