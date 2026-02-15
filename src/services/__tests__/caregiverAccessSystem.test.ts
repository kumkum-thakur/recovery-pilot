import { describe, it, expect, beforeEach } from 'vitest';
import { CaregiverAccessSystem } from '../caregiverAccessSystem';
import type { CaregiverRole } from '../caregiverAccessSystem';

describe('CaregiverAccessSystem', () => {
  let system: CaregiverAccessSystem;

  beforeEach(() => {
    system = new CaregiverAccessSystem();
  });

  // Helper to register a caregiver quickly
  function registerPrimary(patientId = 'patient_1') {
    return system.registerCaregiver({
      patientId,
      name: 'Jane Doe',
      relationship: 'Spouse',
      role: 'primary',
      email: 'jane@example.com',
      phone: '555-0100',
    });
  }

  function registerSecondary(patientId = 'patient_1') {
    return system.registerCaregiver({
      patientId,
      name: 'John Smith',
      relationship: 'Sibling',
      role: 'secondary',
      email: 'john@example.com',
      phone: '555-0200',
    });
  }

  // ── Registration ──

  describe('registerCaregiver()', () => {
    it('should register a primary caregiver with default permissions', () => {
      const cg = registerPrimary();
      expect(cg.id).toBeDefined();
      expect(cg.name).toBe('Jane Doe');
      expect(cg.role).toBe('primary');
      expect(cg.active).toBe(true);
      expect(cg.permissions).toContain('view_vitals');
      expect(cg.permissions).toContain('modify_care_plan');
      expect(cg.permissions).toContain('communicate_provider');
      expect(cg.permissions).toContain('view_lab_results');
    });

    it('should register a secondary caregiver with limited default permissions', () => {
      const cg = registerSecondary();
      expect(cg.role).toBe('secondary');
      expect(cg.permissions).toContain('view_vitals');
      expect(cg.permissions).toContain('view_medications');
      expect(cg.permissions).not.toContain('modify_care_plan');
      expect(cg.permissions).not.toContain('communicate_provider');
    });

    it('should register with custom permissions overriding defaults', () => {
      const cg = system.registerCaregiver({
        patientId: 'patient_1',
        name: 'Custom User',
        relationship: 'Friend',
        role: 'secondary',
        email: 'custom@example.com',
        phone: '555-0300',
        customPermissions: ['view_vitals', 'emergency_contact'],
      });
      expect(cg.permissions).toEqual(['view_vitals', 'emergency_contact']);
      expect(cg.permissions).not.toContain('view_medications');
    });

    it('should register an emergency contact with minimal permissions', () => {
      const cg = system.registerCaregiver({
        patientId: 'patient_1',
        name: 'Emergency Contact',
        relationship: 'Neighbor',
        role: 'emergency',
        email: 'emergency@example.com',
        phone: '555-0400',
      });
      expect(cg.permissions).toContain('view_vitals');
      expect(cg.permissions).toContain('emergency_contact');
      expect(cg.permissions).not.toContain('modify_care_plan');
    });

    it('should initialize default notification preferences', () => {
      const cg = registerPrimary();
      expect(cg.notificationPreferences).toHaveLength(4);
      const emailPref = cg.notificationPreferences.find(p => p.channel === 'email');
      expect(emailPref!.enabled).toBe(true);
      const phonePref = cg.notificationPreferences.find(p => p.channel === 'phone_call');
      expect(phonePref!.enabled).toBe(false);
    });

    it('should generate an audit entry on registration', () => {
      const cg = registerPrimary();
      const log = system.getActivityLog({ caregiverId: cg.id, action: 'register' });
      expect(log.length).toBe(1);
      expect(log[0].details).toContain('Jane Doe');
      expect(log[0].details).toContain('primary');
    });
  });

  // ── Permissions ──

  describe('setPermissions()', () => {
    it('should update permissions for an existing caregiver', () => {
      const cg = registerSecondary();
      const result = system.setPermissions(cg.id, ['view_vitals', 'modify_care_plan']);
      expect(result).toBe(true);

      const updated = system.getCaregiver(cg.id);
      expect(updated!.permissions).toEqual(['view_vitals', 'modify_care_plan']);
    });

    it('should return false for a non-existent caregiver', () => {
      const result = system.setPermissions('nonexistent_id', ['view_vitals']);
      expect(result).toBe(false);
    });

    it('should log the permission change in audit log', () => {
      const cg = registerSecondary();
      system.setPermissions(cg.id, ['view_vitals']);
      const log = system.getActivityLog({ caregiverId: cg.id, action: 'permission_change' });
      expect(log.length).toBe(1);
      expect(log[0].details).toContain('Permissions changed');
    });
  });

  // ── Access Checks ──

  describe('checkAccess()', () => {
    it('should allow access for a caregiver with the correct permission', () => {
      const cg = registerPrimary();
      const result = system.checkAccess(cg.id, 'view_vitals', 'patient_1');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Access granted');
    });

    it('should deny access for a permission not granted', () => {
      const cg = registerSecondary();
      const result = system.checkAccess(cg.id, 'modify_care_plan', 'patient_1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not granted');
    });

    it('should deny access for an inactive caregiver', () => {
      const cg = registerPrimary();
      system.deactivateCaregiver(cg.id);
      const result = system.checkAccess(cg.id, 'view_vitals', 'patient_1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('inactive');
    });

    it('should deny access when caregiver is not authorized for the patient', () => {
      const cg = registerPrimary('patient_1');
      const result = system.checkAccess(cg.id, 'view_vitals', 'patient_999');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not authorized');
    });

    it('should deny access for a non-existent caregiver', () => {
      const result = system.checkAccess('fake_id', 'view_vitals', 'patient_1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should log successful access checks in audit log', () => {
      const cg = registerPrimary();
      system.checkAccess(cg.id, 'view_vitals', 'patient_1');
      const log = system.getActivityLog({ caregiverId: cg.id, action: 'access_data' });
      expect(log.length).toBe(1);
      expect(log[0].details).toContain('view_vitals');
    });
  });

  // ── Zarit Burden Assessment ──

  describe('assessBurden()', () => {
    it('should return little/no burden for low scores (total <= 20)', () => {
      const responses = new Array(22).fill(0); // all 0s = total 0
      const result = system.assessBurden('cg_1', responses);
      expect(result.totalScore).toBe(0);
      expect(result.interpretation).toBe('little_or_no_burden');
      expect(result.riskLevel).toBe('low');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should return mild_to_moderate for moderate scores (21-40)', () => {
      // Use mix of 1s and 2s to get total around 30
      const responses = new Array(22).fill(1); // total = 22
      const result = system.assessBurden('cg_1', responses);
      expect(result.totalScore).toBe(22);
      expect(result.interpretation).toBe('mild_to_moderate');
      expect(result.riskLevel).toBe('moderate');
      expect(result.recommendations).toContain('Consider respite care services.');
    });

    it('should return moderate_to_severe for higher scores (41-60)', () => {
      const responses = new Array(22).fill(2); // total = 44
      responses[0] = 3;
      responses[1] = 3;
      const result = system.assessBurden('cg_1', responses);
      expect(result.totalScore).toBe(46);
      expect(result.interpretation).toBe('moderate_to_severe');
      expect(result.riskLevel).toBe('high');
    });

    it('should return severe for very high scores (> 60)', () => {
      const responses = new Array(22).fill(3); // total = 66
      const result = system.assessBurden('cg_1', responses);
      expect(result.totalScore).toBe(66);
      expect(result.interpretation).toBe('severe');
      expect(result.riskLevel).toBe('high');
      expect(result.recommendations).toContain('Immediate intervention recommended.');
    });

    it('should throw error when not exactly 22 responses', () => {
      expect(() => system.assessBurden('cg_1', [1, 2, 3])).toThrow('Expected 22 responses');
    });

    it('should throw error when a response is out of 0-4 range', () => {
      const responses = new Array(22).fill(2);
      responses[5] = 5;
      expect(() => system.assessBurden('cg_1', responses)).toThrow('between 0 and 4');
    });

    it('should calculate subscale scores for personal and role strain', () => {
      const responses = new Array(22).fill(2);
      const result = system.assessBurden('cg_1', responses);
      expect(result.subscaleScores.personalStrain).toBeGreaterThan(0);
      expect(result.subscaleScores.roleStrain).toBeGreaterThan(0);
      expect(result.subscaleScores.personalStrain + result.subscaleScores.roleStrain).toBe(result.totalScore);
    });

    it('should add personal strain recommendation when personal strain is notably high', () => {
      // Set personal strain items high, role strain items low
      const responses = new Array(22).fill(0);
      // Personal strain indices: 1,3,4,6,8,9,10,12,16,21 (0-indexed)
      responses[1] = 4; responses[3] = 4; responses[4] = 4; responses[6] = 4;
      responses[8] = 4; responses[9] = 4; responses[10] = 4; responses[12] = 4;
      responses[16] = 4; responses[21] = 4;
      const result = system.assessBurden('cg_1', responses);
      expect(result.subscaleScores.personalStrain).toBeGreaterThan(result.subscaleScores.roleStrain * 1.5);
      expect(result.recommendations.some(r => r.includes('Personal strain'))).toBe(true);
    });
  });

  // ── Zarit Questions ──

  describe('getZaritQuestions()', () => {
    it('should return exactly 22 questions', () => {
      const questions = system.getZaritQuestions();
      expect(questions).toHaveLength(22);
    });

    it('should have id and text for each question', () => {
      const questions = system.getZaritQuestions();
      for (const q of questions) {
        expect(q.id).toBeGreaterThanOrEqual(1);
        expect(q.id).toBeLessThanOrEqual(22);
        expect(q.text.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Task Assignment ──

  describe('task assignment and completion', () => {
    it('should assign a task to an active caregiver', () => {
      const cg = registerPrimary();
      const task = system.assignTask({
        patientId: 'patient_1',
        assignedTo: cg.id,
        assignedBy: 'nurse_1',
        title: 'Administer medication',
        description: 'Give morning meds at 8am',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000),
      });
      expect(task).not.toBeNull();
      expect(task!.title).toBe('Administer medication');
      expect(task!.status).toBe('pending');
      expect(task!.priority).toBe('high');
    });

    it('should return null when assigning to a non-existent caregiver', () => {
      const task = system.assignTask({
        patientId: 'patient_1',
        assignedTo: 'fake_id',
        assignedBy: 'nurse_1',
        title: 'Test Task',
        description: 'Test',
        priority: 'low',
        dueDate: new Date(Date.now() + 86400000),
      });
      expect(task).toBeNull();
    });

    it('should return null when assigning to an inactive caregiver', () => {
      const cg = registerPrimary();
      system.deactivateCaregiver(cg.id);
      const task = system.assignTask({
        patientId: 'patient_1',
        assignedTo: cg.id,
        assignedBy: 'nurse_1',
        title: 'Test Task',
        description: 'Test',
        priority: 'low',
        dueDate: new Date(Date.now() + 86400000),
      });
      expect(task).toBeNull();
    });

    it('should complete a task and record completion time', () => {
      const cg = registerPrimary();
      const task = system.assignTask({
        patientId: 'patient_1',
        assignedTo: cg.id,
        assignedBy: 'nurse_1',
        title: 'Give medication',
        description: 'AM meds',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000),
      });
      const completed = system.completeTask(task!.id, 'Given at 8:05am');
      expect(completed).toBe(true);

      const tasks = system.getTasksForCaregiver(cg.id, 'completed');
      expect(tasks.length).toBe(1);
      expect(tasks[0].notes).toBe('Given at 8:05am');
      expect(tasks[0].completedAt).toBeInstanceOf(Date);
    });

    it('should return false when completing a non-existent task', () => {
      expect(system.completeTask('fake_task_id')).toBe(false);
    });

    it('should create next recurring task when completing a recurring task', () => {
      const cg = registerPrimary();
      const tomorrow = new Date(Date.now() + 86400000);
      const endDate = new Date(Date.now() + 86400000 * 10);
      const task = system.assignTask({
        patientId: 'patient_1',
        assignedTo: cg.id,
        assignedBy: 'nurse_1',
        title: 'Daily vitals check',
        description: 'Check vitals',
        priority: 'medium',
        dueDate: tomorrow,
        recurring: { frequency: 'daily', endDate },
      });

      system.completeTask(task!.id);

      // Should now have 2 tasks: the completed one and the new recurring one
      const allTasks = system.getTasksForCaregiver(cg.id);
      expect(allTasks.length).toBe(2);
      const pendingTasks = system.getTasksForCaregiver(cg.id, 'pending');
      expect(pendingTasks.length).toBe(1);
      expect(pendingTasks[0].title).toBe('Daily vitals check');
    });

    it('should retrieve tasks for a specific patient', () => {
      const cg = registerPrimary();
      system.assignTask({
        patientId: 'patient_1',
        assignedTo: cg.id,
        assignedBy: 'nurse_1',
        title: 'Task A',
        description: 'Desc A',
        priority: 'low',
        dueDate: new Date(Date.now() + 86400000),
      });
      system.assignTask({
        patientId: 'patient_1',
        assignedTo: cg.id,
        assignedBy: 'nurse_1',
        title: 'Task B',
        description: 'Desc B',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000),
      });

      const patientTasks = system.getTasksForPatient('patient_1');
      expect(patientTasks.length).toBe(2);
    });
  });

  // ── Overdue Task Detection ──

  describe('checkOverdueTasks()', () => {
    it('should mark past-due pending tasks as overdue', () => {
      const cg = registerPrimary();
      const yesterday = new Date(Date.now() - 86400000);
      system.assignTask({
        patientId: 'patient_1',
        assignedTo: cg.id,
        assignedBy: 'nurse_1',
        title: 'Overdue Task',
        description: 'This is overdue',
        priority: 'high',
        dueDate: yesterday,
      });

      const overdue = system.checkOverdueTasks();
      expect(overdue.length).toBe(1);
      expect(overdue[0].status).toBe('overdue');
    });

    it('should not mark future tasks as overdue', () => {
      const cg = registerPrimary();
      const tomorrow = new Date(Date.now() + 86400000);
      system.assignTask({
        patientId: 'patient_1',
        assignedTo: cg.id,
        assignedBy: 'nurse_1',
        title: 'Future Task',
        description: 'Not overdue yet',
        priority: 'low',
        dueDate: tomorrow,
      });

      const overdue = system.checkOverdueTasks();
      expect(overdue.length).toBe(0);
    });
  });

  // ── Caregiver Lookup and Deactivation ──

  describe('caregiver lookup and deactivation', () => {
    it('should retrieve a caregiver by ID', () => {
      const cg = registerPrimary();
      const found = system.getCaregiver(cg.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Jane Doe');
    });

    it('should return null for non-existent caregiver ID', () => {
      expect(system.getCaregiver('fake_id')).toBeNull();
    });

    it('should retrieve all active caregivers for a patient', () => {
      registerPrimary('patient_1');
      registerSecondary('patient_1');
      const caregivers = system.getCaregiversForPatient('patient_1');
      expect(caregivers).toHaveLength(2);
    });

    it('should exclude deactivated caregivers from patient list', () => {
      const cg1 = registerPrimary('patient_1');
      registerSecondary('patient_1');
      system.deactivateCaregiver(cg1.id);
      const caregivers = system.getCaregiversForPatient('patient_1');
      expect(caregivers).toHaveLength(1);
    });

    it('should return false when deactivating a non-existent caregiver', () => {
      expect(system.deactivateCaregiver('fake_id')).toBe(false);
    });
  });

  // ── Audit Logging ──

  describe('audit logging', () => {
    it('should filter audit log by action type', () => {
      const cg = registerPrimary();
      system.checkAccess(cg.id, 'view_vitals', 'patient_1');
      system.checkAccess(cg.id, 'view_medications', 'patient_1');

      const registerLogs = system.getActivityLog({ action: 'register' });
      expect(registerLogs.length).toBe(1);

      const accessLogs = system.getActivityLog({ action: 'access_data' });
      expect(accessLogs.length).toBe(2);
    });

    it('should filter audit log by patient ID', () => {
      registerPrimary('patient_1');
      registerPrimary('patient_2');

      const p1Logs = system.getActivityLog({ patientId: 'patient_1' });
      const p2Logs = system.getActivityLog({ patientId: 'patient_2' });
      expect(p1Logs.length).toBeGreaterThanOrEqual(1);
      expect(p2Logs.length).toBeGreaterThanOrEqual(1);
    });

    it('should include timestamps in audit entries', () => {
      registerPrimary();
      const log = system.getActivityLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0].timestamp).toBeInstanceOf(Date);
      expect(log[0].id).toBeDefined();
    });
  });

  // ── Notification Preferences ──

  describe('notification preferences', () => {
    it('should update notification preferences', () => {
      const cg = registerPrimary();
      const result = system.updateNotificationPreferences(cg.id, [
        { channel: 'email', enabled: false },
        { channel: 'sms', enabled: true, quietHoursStart: '22:00', quietHoursEnd: '07:00' },
      ]);
      expect(result).toBe(true);
      const updated = system.getCaregiver(cg.id);
      expect(updated!.notificationPreferences).toHaveLength(2);
      expect(updated!.notificationPreferences[0].enabled).toBe(false);
    });

    it('should return false when updating preferences for non-existent caregiver', () => {
      const result = system.updateNotificationPreferences('fake_id', []);
      expect(result).toBe(false);
    });

    it('should return an optimal notification channel for a caregiver', () => {
      const cg = registerPrimary();
      const channel = system.getOptimalNotificationChannel(cg.id);
      // Should return the first enabled channel (email by default)
      expect(channel).not.toBeNull();
    });

    it('should return null for non-existent caregiver optimal channel', () => {
      const channel = system.getOptimalNotificationChannel('fake_id');
      expect(channel).toBeNull();
    });

    it('should learn optimal channel from notification history', () => {
      const cg = registerPrimary();
      // Record 5+ notifications with sms having the best open rate
      system.recordNotification(cg.id, 'email', false);
      system.recordNotification(cg.id, 'email', false);
      system.recordNotification(cg.id, 'sms', true);
      system.recordNotification(cg.id, 'sms', true);
      system.recordNotification(cg.id, 'sms', true);

      const channel = system.getOptimalNotificationChannel(cg.id);
      expect(channel).toBe('sms');
    });
  });

  // ── Role-Based Permission Coverage ──

  describe('role-based permission coverage', () => {
    const roles: CaregiverRole[] = ['primary', 'secondary', 'professional', 'emergency'];

    for (const role of roles) {
      it(`should assign correct default permissions for role: ${role}`, () => {
        const cg = system.registerCaregiver({
          patientId: 'patient_1',
          name: `${role} User`,
          relationship: 'Test',
          role,
          email: `${role}@test.com`,
          phone: '555-0000',
        });
        expect(cg.permissions.length).toBeGreaterThan(0);
        // All roles should at least have view_vitals
        expect(cg.permissions).toContain('view_vitals');
      });
    }

    it('should give professional role communicate_provider permission', () => {
      const cg = system.registerCaregiver({
        patientId: 'patient_1',
        name: 'Pro User',
        relationship: 'Nurse',
        role: 'professional',
        email: 'pro@test.com',
        phone: '555-0000',
      });
      expect(cg.permissions).toContain('communicate_provider');
      expect(cg.permissions).toContain('modify_care_plan');
    });
  });
});
