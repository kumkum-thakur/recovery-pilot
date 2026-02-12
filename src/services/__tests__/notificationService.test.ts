import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNotificationService,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  type NotificationService,
} from '../notificationService';

describe('NotificationService', () => {
  let service: NotificationService;
  const testPatientId = 'patient-notif-test';

  beforeEach(() => {
    service = createNotificationService();
  });

  describe('notification creation', () => {
    it('should create a medication reminder notification', () => {
      const notification = service.create(
        NotificationType.MEDICATION_REMINDER,
        testPatientId,
        { medicationName: 'Ibuprofen', time: '8:00 AM' },
      );

      expect(notification).not.toBeNull();
      expect(notification!.type).toBe(NotificationType.MEDICATION_REMINDER);
      expect(notification!.patientId).toBe(testPatientId);
      expect(notification!.status).toBe(NotificationStatus.PENDING);
      expect(notification!.priority).toBe(NotificationPriority.HIGH);
      expect(notification!.id).toBeTruthy();
      expect(notification!.title).toBeTruthy();
      expect(notification!.body).toBeTruthy();
    });

    it('should create notifications for different types', () => {
      const types = [
        NotificationType.MISSION_DUE,
        NotificationType.WOUND_CHECK,
        NotificationType.EXERCISE_TIME,
        NotificationType.ACHIEVEMENT,
      ];

      for (const type of types) {
        const notification = service.create(type, testPatientId);
        expect(notification).not.toBeNull();
        expect(notification!.type).toBe(type);
      }
    });

    it('should apply priority overrides', () => {
      const notification = service.create(
        NotificationType.SYSTEM,
        testPatientId,
        {},
        { priority: NotificationPriority.CRITICAL },
      );

      expect(notification).not.toBeNull();
      expect(notification!.priority).toBe(NotificationPriority.CRITICAL);
    });

    it('should deduplicate identical notifications', () => {
      const vars = { medicationName: 'Aspirin', time: '9:00 AM' };
      const first = service.create(NotificationType.MEDICATION_REMINDER, testPatientId, vars);
      const second = service.create(NotificationType.MEDICATION_REMINDER, testPatientId, vars);

      expect(first).not.toBeNull();
      expect(second).toBeNull(); // Deduplicated
    });
  });

  describe('notification lifecycle', () => {
    it('should deliver a pending notification', () => {
      const notification = service.create(NotificationType.WOUND_CHECK, testPatientId);
      expect(notification).not.toBeNull();

      const delivered = service.deliver(notification!.id);
      expect(delivered).toBe(true);

      const fetched = service.getById(notification!.id);
      expect(fetched!.status).toBe(NotificationStatus.DELIVERED);
      expect(fetched!.deliveredAt).toBeDefined();
    });

    it('should mark a notification as read', () => {
      const notification = service.create(NotificationType.ACHIEVEMENT, testPatientId);
      service.deliver(notification!.id);

      const read = service.markAsRead(notification!.id);
      expect(read).toBe(true);

      const fetched = service.getById(notification!.id);
      expect(fetched!.status).toBe(NotificationStatus.READ);
      expect(fetched!.readAt).toBeDefined();
    });

    it('should snooze a notification', () => {
      const notification = service.create(
        NotificationType.EXERCISE_TIME,
        testPatientId,
      );
      service.deliver(notification!.id);

      const snoozed = service.snooze(notification!.id, 30);
      expect(snoozed).toBe(true);

      const fetched = service.getById(notification!.id);
      expect(fetched!.status).toBe(NotificationStatus.SNOOZED);
      expect(fetched!.snoozedUntil).toBeDefined();
    });

    it('should dismiss a notification', () => {
      const notification = service.create(NotificationType.SYSTEM, testPatientId);

      const dismissed = service.dismiss(notification!.id);
      expect(dismissed).toBe(true);

      const fetched = service.getById(notification!.id);
      expect(fetched!.status).toBe(NotificationStatus.DISMISSED);
    });
  });

  describe('querying', () => {
    it('should retrieve notifications for a patient', () => {
      service.create(NotificationType.MEDICATION_REMINDER, testPatientId, { medicationName: 'Med1', time: '8am' });
      service.create(NotificationType.WOUND_CHECK, testPatientId);
      service.create(NotificationType.EXERCISE_TIME, testPatientId);

      const all = service.getForPatient(testPatientId);
      expect(all.length).toBe(3);
    });

    it('should filter notifications by status', () => {
      const n1 = service.create(NotificationType.MEDICATION_REMINDER, testPatientId, { medicationName: 'Med1', time: '8am' });
      service.create(NotificationType.WOUND_CHECK, testPatientId);
      service.deliver(n1!.id);
      service.markAsRead(n1!.id);

      const pending = service.getForPatient(testPatientId, {
        status: [NotificationStatus.PENDING],
      });
      expect(pending.length).toBe(1);

      const read = service.getForPatient(testPatientId, {
        status: [NotificationStatus.READ],
      });
      expect(read.length).toBe(1);
    });

    it('should return stats for a patient', () => {
      service.create(NotificationType.MEDICATION_REMINDER, testPatientId, { medicationName: 'Med1', time: '1' });
      service.create(NotificationType.WOUND_CHECK, testPatientId, { note: '1' });
      service.create(NotificationType.VITAL_SIGNS_ALERT, testPatientId, { vitalName: 'HR', value: '120', unit: 'bpm', status: 'high', normalRange: '60-100' });

      const stats = service.getStats(testPatientId);
      expect(stats.total).toBe(3);
      expect(stats.byType).toBeDefined();
    });
  });
});
