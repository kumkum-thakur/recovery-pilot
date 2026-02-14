/**
 * Caregiver Access Management System
 * Role-based access control, burden assessment (Zarit), and task coordination for caregivers.
 */

type CaregiverRole = 'primary' | 'secondary' | 'professional' | 'emergency';
type Permission = 'view_vitals' | 'view_medications' | 'view_appointments' | 'emergency_contact' | 'modify_care_plan' | 'view_notes' | 'communicate_provider' | 'view_lab_results';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type NotificationChannel = 'sms' | 'email' | 'push' | 'phone_call';
type AuditAction = 'register' | 'permission_change' | 'access_data' | 'assign_task' | 'complete_task' | 'burden_assessment' | 'notification_sent';

interface Caregiver {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  role: CaregiverRole;
  permissions: Permission[];
  email: string;
  phone: string;
  notificationPreferences: { channel: NotificationChannel; enabled: boolean; quietHoursStart?: string; quietHoursEnd?: string }[];
  registeredAt: Date;
  active: boolean;
}

interface CareTask {
  id: string;
  patientId: string;
  assignedTo: string; // caregiver id
  assignedBy: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  completedAt?: Date;
  notes?: string;
  recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; endDate?: Date };
}

interface AuditEntry {
  id: string;
  caregiverId: string;
  patientId: string;
  action: AuditAction;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

interface BurdenResult {
  totalScore: number;
  interpretation: 'little_or_no_burden' | 'mild_to_moderate' | 'moderate_to_severe' | 'severe';
  subscaleScores: { personalStrain: number; roleStrain: number };
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high';
}

// Zarit Burden Interview - 22 items (validated instrument)
// Response scale: 0=Never, 1=Rarely, 2=Sometimes, 3=Quite Frequently, 4=Nearly Always
const ZARIT_QUESTIONS: { id: number; text: string; subscale: 'personal_strain' | 'role_strain' }[] = [
  { id: 1, text: 'Do you feel that your relative asks for more help than he/she needs?', subscale: 'role_strain' },
  { id: 2, text: 'Do you feel that because of the time you spend with your relative that you do not have enough time for yourself?', subscale: 'personal_strain' },
  { id: 3, text: 'Do you feel stressed between caring for your relative and trying to meet other responsibilities for your family or work?', subscale: 'role_strain' },
  { id: 4, text: 'Do you feel embarrassed over your relative\'s behavior?', subscale: 'personal_strain' },
  { id: 5, text: 'Do you feel angry when you are around your relative?', subscale: 'personal_strain' },
  { id: 6, text: 'Do you feel that your relative currently affects your relationships with other family members or friends in a negative way?', subscale: 'role_strain' },
  { id: 7, text: 'Are you afraid of what the future holds for your relative?', subscale: 'personal_strain' },
  { id: 8, text: 'Do you feel your relative is dependent on you?', subscale: 'role_strain' },
  { id: 9, text: 'Do you feel strained when you are around your relative?', subscale: 'personal_strain' },
  { id: 10, text: 'Do you feel your health has suffered because of your involvement with your relative?', subscale: 'personal_strain' },
  { id: 11, text: 'Do you feel that you do not have as much privacy as you would like because of your relative?', subscale: 'personal_strain' },
  { id: 12, text: 'Do you feel that your social life has suffered because you are caring for your relative?', subscale: 'role_strain' },
  { id: 13, text: 'Do you feel uncomfortable about having friends over because of your relative?', subscale: 'personal_strain' },
  { id: 14, text: 'Do you feel that your relative seems to expect you to take care of him/her as if you were the only one he/she could depend on?', subscale: 'role_strain' },
  { id: 15, text: 'Do you feel that you do not have enough money to take care of your relative in addition to the rest of your expenses?', subscale: 'role_strain' },
  { id: 16, text: 'Do you feel that you will be unable to take care of your relative much longer?', subscale: 'role_strain' },
  { id: 17, text: 'Do you feel you have lost control of your life since your relative\'s illness?', subscale: 'personal_strain' },
  { id: 18, text: 'Do you wish you could leave the care of your relative to someone else?', subscale: 'role_strain' },
  { id: 19, text: 'Do you feel uncertain about what to do about your relative?', subscale: 'role_strain' },
  { id: 20, text: 'Do you feel you should be doing more for your relative?', subscale: 'role_strain' },
  { id: 21, text: 'Do you feel you could do a better job in caring for your relative?', subscale: 'role_strain' },
  { id: 22, text: 'Overall, how burdened do you feel in caring for your relative?', subscale: 'personal_strain' },
];

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<CaregiverRole, Permission[]> = {
  primary: ['view_vitals', 'view_medications', 'view_appointments', 'emergency_contact', 'modify_care_plan', 'view_notes', 'communicate_provider', 'view_lab_results'],
  secondary: ['view_vitals', 'view_medications', 'view_appointments', 'view_notes'],
  professional: ['view_vitals', 'view_medications', 'view_appointments', 'view_notes', 'communicate_provider', 'view_lab_results', 'modify_care_plan'],
  emergency: ['view_vitals', 'view_medications', 'emergency_contact'],
};

export class CaregiverAccessSystem {
  private caregivers: Map<string, Caregiver> = new Map();
  private tasks: Map<string, CareTask> = new Map();
  private auditLog: AuditEntry[] = [];
  private notificationHistory: { caregiverId: string; channel: NotificationChannel; sentAt: Date; opened: boolean }[] = [];
  private idCounter = 1;

  registerCaregiver(data: {
    patientId: string;
    name: string;
    relationship: string;
    role: CaregiverRole;
    email: string;
    phone: string;
    customPermissions?: Permission[];
  }): Caregiver {
    const id = `cg_${this.idCounter++}_${Date.now()}`;
    const caregiver: Caregiver = {
      id,
      patientId: data.patientId,
      name: data.name,
      relationship: data.relationship,
      role: data.role,
      permissions: data.customPermissions ?? [...DEFAULT_PERMISSIONS[data.role]],
      email: data.email,
      phone: data.phone,
      notificationPreferences: [
        { channel: 'email', enabled: true },
        { channel: 'sms', enabled: true },
        { channel: 'push', enabled: true },
        { channel: 'phone_call', enabled: false },
      ],
      registeredAt: new Date(),
      active: true,
    };

    this.caregivers.set(id, caregiver);
    this.addAuditEntry(id, data.patientId, 'register', `Caregiver ${data.name} registered as ${data.role} for patient ${data.patientId}`);
    return caregiver;
  }

  setPermissions(caregiverId: string, permissions: Permission[]): boolean {
    const cg = this.caregivers.get(caregiverId);
    if (!cg) return false;
    const oldPerms = [...cg.permissions];
    cg.permissions = permissions;
    this.addAuditEntry(caregiverId, cg.patientId, 'permission_change', `Permissions changed from [${oldPerms.join(',')}] to [${permissions.join(',')}]`);
    return true;
  }

  checkAccess(caregiverId: string, permission: Permission, patientId: string): { allowed: boolean; reason: string } {
    const cg = this.caregivers.get(caregiverId);
    if (!cg) return { allowed: false, reason: 'Caregiver not found' };
    if (!cg.active) return { allowed: false, reason: 'Caregiver account is inactive' };
    if (cg.patientId !== patientId) return { allowed: false, reason: 'Caregiver not authorized for this patient' };
    if (!cg.permissions.includes(permission)) return { allowed: false, reason: `Permission '${permission}' not granted to role '${cg.role}'` };

    this.addAuditEntry(caregiverId, patientId, 'access_data', `Accessed: ${permission}`);
    return { allowed: true, reason: 'Access granted' };
  }

  assessBurden(caregiverId: string, responses: number[]): BurdenResult {
    if (responses.length !== 22) {
      throw new Error(`Expected 22 responses, received ${responses.length}`);
    }
    for (const r of responses) {
      if (r < 0 || r > 4) throw new Error('Each response must be between 0 and 4');
    }

    const totalScore = responses.reduce((s, v) => s + v, 0);

    let personalStrain = 0;
    let roleStrain = 0;
    for (let i = 0; i < 22; i++) {
      if (ZARIT_QUESTIONS[i].subscale === 'personal_strain') personalStrain += responses[i];
      else roleStrain += responses[i];
    }

    // Standard Zarit scoring thresholds
    let interpretation: BurdenResult['interpretation'];
    let riskLevel: BurdenResult['riskLevel'];
    const recommendations: string[] = [];

    if (totalScore <= 20) {
      interpretation = 'little_or_no_burden';
      riskLevel = 'low';
      recommendations.push('Continue current caregiving arrangement.', 'Consider preventive self-care strategies.');
    } else if (totalScore <= 40) {
      interpretation = 'mild_to_moderate';
      riskLevel = 'moderate';
      recommendations.push('Consider respite care services.', 'Join a caregiver support group.', 'Discuss shared caregiving responsibilities with family members.');
    } else if (totalScore <= 60) {
      interpretation = 'moderate_to_severe';
      riskLevel = 'high';
      recommendations.push('Strongly recommend professional caregiver support services.', 'Evaluate for caregiver depression screening.', 'Consider adult day care or home health aide services.', 'Schedule a consultation with a social worker.');
    } else {
      interpretation = 'severe';
      riskLevel = 'high';
      recommendations.push('Immediate intervention recommended.', 'Assess for caregiver burnout and depression.', 'Explore long-term care placement options.', 'Connect with crisis support resources.', 'Mandatory respite care arrangement.');
    }

    if (personalStrain > roleStrain * 1.5) {
      recommendations.push('Personal strain is notably high - prioritize emotional support and counseling.');
    }
    if (roleStrain > personalStrain * 1.5) {
      recommendations.push('Role strain is predominant - focus on practical support and task delegation.');
    }

    this.addAuditEntry(caregiverId, '', 'burden_assessment', `Zarit score: ${totalScore} (${interpretation})`);

    return { totalScore, interpretation, subscaleScores: { personalStrain, roleStrain }, recommendations, riskLevel };
  }

  getZaritQuestions(): { id: number; text: string }[] {
    return ZARIT_QUESTIONS.map(q => ({ id: q.id, text: q.text }));
  }

  assignTask(data: {
    patientId: string;
    assignedTo: string;
    assignedBy: string;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: Date;
    recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; endDate?: Date };
  }): CareTask | null {
    const cg = this.caregivers.get(data.assignedTo);
    if (!cg || !cg.active) return null;

    const task: CareTask = {
      id: `task_${this.idCounter++}_${Date.now()}`,
      patientId: data.patientId,
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: 'pending',
      dueDate: data.dueDate,
      recurring: data.recurring,
    };

    this.tasks.set(task.id, task);
    this.addAuditEntry(data.assignedTo, data.patientId, 'assign_task', `Task assigned: ${data.title} (priority: ${data.priority})`);
    return task;
  }

  completeTask(taskId: string, notes?: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    task.status = 'completed';
    task.completedAt = new Date();
    task.notes = notes;
    this.addAuditEntry(task.assignedTo, task.patientId, 'complete_task', `Task completed: ${task.title}`);

    // If recurring, create next instance
    if (task.recurring) {
      const nextDue = new Date(task.dueDate);
      if (task.recurring.frequency === 'daily') nextDue.setDate(nextDue.getDate() + 1);
      else if (task.recurring.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      else nextDue.setMonth(nextDue.getMonth() + 1);

      if (!task.recurring.endDate || nextDue <= task.recurring.endDate) {
        this.assignTask({
          patientId: task.patientId,
          assignedTo: task.assignedTo,
          assignedBy: task.assignedBy,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: nextDue,
          recurring: task.recurring,
        });
      }
    }
    return true;
  }

  getTasksForCaregiver(caregiverId: string, status?: TaskStatus): CareTask[] {
    const tasks = Array.from(this.tasks.values()).filter(t => t.assignedTo === caregiverId);
    if (status) return tasks.filter(t => t.status === status);
    return tasks;
  }

  getTasksForPatient(patientId: string, status?: TaskStatus): CareTask[] {
    const tasks = Array.from(this.tasks.values()).filter(t => t.patientId === patientId);
    if (status) return tasks.filter(t => t.status === status);
    return tasks;
  }

  updateNotificationPreferences(caregiverId: string, preferences: { channel: NotificationChannel; enabled: boolean; quietHoursStart?: string; quietHoursEnd?: string }[]): boolean {
    const cg = this.caregivers.get(caregiverId);
    if (!cg) return false;
    cg.notificationPreferences = preferences;
    return true;
  }

  getOptimalNotificationChannel(caregiverId: string): NotificationChannel | null {
    const cg = this.caregivers.get(caregiverId);
    if (!cg) return null;

    // Self-learning: check engagement history to find best channel
    const history = this.notificationHistory.filter(n => n.caregiverId === caregiverId);
    if (history.length >= 5) {
      const channelStats: Record<string, { sent: number; opened: number }> = {};
      for (const entry of history) {
        if (!channelStats[entry.channel]) channelStats[entry.channel] = { sent: 0, opened: 0 };
        channelStats[entry.channel].sent++;
        if (entry.opened) channelStats[entry.channel].opened++;
      }
      let bestChannel: NotificationChannel | null = null;
      let bestRate = 0;
      for (const [ch, stats] of Object.entries(channelStats)) {
        const rate = stats.opened / stats.sent;
        if (rate > bestRate) {
          bestRate = rate;
          bestChannel = ch as NotificationChannel;
        }
      }
      if (bestChannel) return bestChannel;
    }

    // Fallback: first enabled channel respecting quiet hours
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const pref of cg.notificationPreferences) {
      if (!pref.enabled) continue;
      if (pref.quietHoursStart && pref.quietHoursEnd) {
        if (currentTime >= pref.quietHoursStart && currentTime <= pref.quietHoursEnd) continue;
      }
      return pref.channel;
    }
    return null;
  }

  recordNotification(caregiverId: string, channel: NotificationChannel, opened: boolean): void {
    this.notificationHistory.push({ caregiverId, channel, sentAt: new Date(), opened });
    const cg = this.caregivers.get(caregiverId);
    if (cg) {
      this.addAuditEntry(caregiverId, cg.patientId, 'notification_sent', `Notification via ${channel}, opened: ${opened}`);
    }
  }

  getActivityLog(filters?: { caregiverId?: string; patientId?: string; action?: AuditAction; fromDate?: Date; toDate?: Date }): AuditEntry[] {
    let results = [...this.auditLog];
    if (filters?.caregiverId) results = results.filter(e => e.caregiverId === filters.caregiverId);
    if (filters?.patientId) results = results.filter(e => e.patientId === filters.patientId);
    if (filters?.action) results = results.filter(e => e.action === filters.action);
    if (filters?.fromDate) results = results.filter(e => e.timestamp >= filters.fromDate!);
    if (filters?.toDate) results = results.filter(e => e.timestamp <= filters.toDate!);
    return results;
  }

  getCaregiver(caregiverId: string): Caregiver | null {
    return this.caregivers.get(caregiverId) ?? null;
  }

  getCaregiversForPatient(patientId: string): Caregiver[] {
    return Array.from(this.caregivers.values()).filter(cg => cg.patientId === patientId && cg.active);
  }

  deactivateCaregiver(caregiverId: string): boolean {
    const cg = this.caregivers.get(caregiverId);
    if (!cg) return false;
    cg.active = false;
    this.addAuditEntry(caregiverId, cg.patientId, 'permission_change', 'Caregiver deactivated');
    return true;
  }

  // Mark overdue tasks
  checkOverdueTasks(): CareTask[] {
    const now = new Date();
    const overdue: CareTask[] = [];
    for (const task of Array.from(this.tasks.values())) {
      if (task.status === 'pending' || task.status === 'in_progress') {
        if (task.dueDate < now) {
          task.status = 'overdue';
          overdue.push(task);
        }
      }
    }
    return overdue;
  }

  private addAuditEntry(caregiverId: string, patientId: string, action: AuditAction, details: string): void {
    this.auditLog.push({
      id: `audit_${this.idCounter++}_${Date.now()}`,
      caregiverId,
      patientId,
      action,
      details,
      timestamp: new Date(),
    });
  }
}

export type { CaregiverRole, Permission, TaskStatus, TaskPriority, NotificationChannel, AuditAction, Caregiver, CareTask, AuditEntry, BurdenResult };
