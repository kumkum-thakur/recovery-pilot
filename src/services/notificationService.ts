// notificationService.ts — Full notification system for Recovery Pilot
// No external dependencies.

// ─── Enums & Constants ───────────────────────────────────────────────

export enum NotificationType {
  MEDICATION_REMINDER = 'MEDICATION_REMINDER',
  MISSION_DUE = 'MISSION_DUE',
  WOUND_CHECK = 'WOUND_CHECK',
  EXERCISE_TIME = 'EXERCISE_TIME',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  VITAL_SIGNS_ALERT = 'VITAL_SIGNS_ALERT',
  RISK_ALERT = 'RISK_ALERT',
  DOCTOR_MESSAGE = 'DOCTOR_MESSAGE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  SYSTEM = 'SYSTEM',
  PAIN_LOG_REMINDER = 'PAIN_LOG_REMINDER',
  SLEEP_REMINDER = 'SLEEP_REMINDER',
  HYDRATION_REMINDER = 'HYDRATION_REMINDER',
  FOLLOW_UP_NEEDED = 'FOLLOW_UP_NEEDED',
  CARE_PLAN_UPDATE = 'CARE_PLAN_UPDATE',
}

export enum NotificationPriority {
  CRITICAL = 4,
  HIGH = 3,
  MEDIUM = 2,
  LOW = 1,
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  SNOOZED = 'SNOOZED',
  DISMISSED = 'DISMISSED',
  EXPIRED = 'EXPIRED',
  ESCALATED = 'ESCALATED',
}

// ─── Interfaces ──────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  body: string;
  patientId: string;
  createdAt: number;    // epoch ms
  scheduledFor: number; // epoch ms
  deliveredAt?: number;
  readAt?: number;
  snoozedUntil?: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  groupKey?: string;    // for batching
  escalationLevel: number;
  deduplicationKey?: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  titleTemplate: string;
  bodyTemplate: string;
  defaultTTLMinutes: number;
  actionUrl?: string;
  groupKey?: string;
}

export interface NotificationPreferences {
  patientId: string;
  enabled: boolean;
  quietHoursStart: number; // hour 0-23
  quietHoursEnd: number;
  categoryPreferences: Record<NotificationType, {
    enabled: boolean;
    priority: NotificationPriority;
    channels: ('in_app' | 'push' | 'sms' | 'email')[];
    batchWindow: number; // minutes; 0 = immediate
    maxPerDay: number;
  }>;
  snoozeDefaults: Record<NotificationPriority, number>; // snooze duration in minutes per priority
}

export interface ScheduleEntry {
  notificationId: string;
  scheduledFor: number;
  fired: boolean;
}

export interface EscalationRule {
  type: NotificationType;
  priority: NotificationPriority;
  acknowledgeWithinMinutes: number;
  escalateToTypes: NotificationType[];
  maxEscalationLevel: number;
  escalationIntervalMinutes: number;
}

export interface NotificationStats {
  total: number;
  delivered: number;
  read: number;
  snoozed: number;
  dismissed: number;
  expired: number;
  escalated: number;
  avgReadTimeMs: number;
  readRate: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface BatchGroup {
  groupKey: string;
  notifications: Notification[];
  scheduledDelivery: number;
}

// ─── Utility Helpers ─────────────────────────────────────────────────

let _idCounter = 0;

function generateId(): string {
  _idCounter++;
  return `notif_${Date.now()}_${_idCounter}_${Math.random().toString(36).substring(2, 8)}`;
}

function interpolateTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`;
  });
}

function isQuietHours(hour: number, start: number, end: number): boolean {
  if (start <= end) {
    return hour >= start && hour < end;
  }
  // Wraps past midnight, e.g. 22:00 to 07:00
  return hour >= start || hour < end;
}

function nowMs(): number {
  return Date.now();
}

function minutesToMs(m: number): number {
  return m * 60 * 1000;
}

// ─── Notification Templates (100+) ──────────────────────────────────

function buildTemplates(): NotificationTemplate[] {
  const templates: NotificationTemplate[] = [];

  // ── MEDICATION_REMINDER (15 templates) ──
  const medTitles = [
    'Time to take {{medicationName}}',
    'Medication reminder: {{medicationName}}',
    'Don\'t forget your {{medicationName}}',
    '{{medicationName}} — take now',
    'Your {{timeOfDay}} medication is due',
    'Medication check-in',
    'It\'s time for your {{medicationName}} dose',
    'Reminder: {{medicationName}} at {{time}}',
    'Take {{medicationName}} with {{instruction}}',
    'Missed dose? Take {{medicationName}} now',
    '{{medicationName}}: {{dosage}} due',
    'Stay on track: {{medicationName}}',
    'Health reminder: medication due',
    'Your prescription reminder',
    '{{medicationName}} — {{dosage}} ready',
  ];
  const medBodies = [
    'Take {{dosage}} of {{medicationName}}. {{instruction}}.',
    'Your {{medicationName}} ({{dosage}}) is scheduled for now. Remember to take it with {{instruction}}.',
    'It\'s been {{hoursSinceLastDose}} hours since your last dose. Time for {{medicationName}}.',
    'Don\'t skip your {{medicationName}} today. Consistency helps your recovery.',
    'Tap to confirm you\'ve taken your {{medicationName}} ({{dosage}}).',
    'Your care team recommends taking {{medicationName}} at this time.',
    '{{medicationName}} helps with {{purpose}}. Take {{dosage}} now.',
    'Quick reminder to take your {{timeOfDay}} medications.',
    'You\'re {{streak}} days consistent with {{medicationName}}. Keep it up!',
    'Your {{medicationName}} is due. Check in after taking it.',
    'Time for {{medicationName}}. Tap to log.',
    'Medication adherence is key to recovery. Take {{medicationName}} now.',
    'Your next dose of {{medicationName}} is ready.',
    'Remember: {{medicationName}} should be taken {{instruction}}.',
    'Heads up — {{medicationName}} ({{dosage}}) is due soon.',
  ];
  for (let i = 0; i < 15; i++) {
    templates.push({
      id: `med_reminder_${i + 1}`,
      type: NotificationType.MEDICATION_REMINDER,
      priority: NotificationPriority.HIGH,
      titleTemplate: medTitles[i],
      bodyTemplate: medBodies[i],
      defaultTTLMinutes: 60,
      actionUrl: '/medications',
      groupKey: 'medication',
    });
  }

  // ── MISSION_DUE (10 templates) ──
  const missionTitles = [
    'Mission available: {{missionName}}',
    'New mission ready!',
    'Time for your {{missionName}} mission',
    'Recovery mission: {{missionName}}',
    'Complete {{missionName}} to earn {{xp}} XP',
    'Daily mission unlocked',
    'Your next challenge awaits',
    'Mission {{missionName}} is due soon',
    'Don\'t miss: {{missionName}}',
    'Mission checkpoint: {{missionName}}',
  ];
  const missionBodies = [
    'Complete "{{missionName}}" to earn {{xp}} XP and keep your streak alive.',
    'You have a new mission! "{{missionName}}" — estimated {{duration}} minutes.',
    'Your recovery mission "{{missionName}}" is waiting. Tap to start.',
    'Complete this mission to level up your recovery. {{description}}.',
    'Only {{remaining}} missions left today. Start with "{{missionName}}".',
    '"{{missionName}}" is due by {{deadline}}. You\'ve got this!',
    'Your care team assigned "{{missionName}}". Estimated time: {{duration}} min.',
    'Keep your {{streak}}-day streak! Complete "{{missionName}}" today.',
    'New mission: {{missionName}}. {{description}}',
    'Mission "{{missionName}}" unlocked. Tap to view details.',
  ];
  for (let i = 0; i < 10; i++) {
    templates.push({
      id: `mission_due_${i + 1}`,
      type: NotificationType.MISSION_DUE,
      priority: NotificationPriority.MEDIUM,
      titleTemplate: missionTitles[i],
      bodyTemplate: missionBodies[i],
      defaultTTLMinutes: 240,
      actionUrl: '/missions',
      groupKey: 'missions',
    });
  }

  // ── WOUND_CHECK (8 templates) ──
  const woundTitles = [
    'Time for wound inspection',
    'Wound check reminder',
    'How does your incision look?',
    'Daily wound assessment',
    'Wound care: check-in time',
    'Inspect your surgical site',
    'Wound monitoring reminder',
    'Time to photograph your wound',
  ];
  const woundBodies = [
    'Please inspect your surgical site and report any redness, swelling, or drainage.',
    'Take a photo of your wound for your care team to review.',
    'It\'s time for your daily wound check. Look for signs of infection.',
    'Your wound assessment is overdue. Please complete it now.',
    'Clean and inspect your surgical site. Report any changes.',
    'Remember to check your incision for redness, warmth, or unusual discharge.',
    'Your care team needs an updated wound photo. Tap to capture.',
    'Wound monitoring helps prevent complications. Take a moment to check.',
  ];
  for (let i = 0; i < 8; i++) {
    templates.push({
      id: `wound_check_${i + 1}`,
      type: NotificationType.WOUND_CHECK,
      priority: NotificationPriority.HIGH,
      titleTemplate: woundTitles[i],
      bodyTemplate: woundBodies[i],
      defaultTTLMinutes: 120,
      actionUrl: '/wound-check',
      groupKey: 'wound',
    });
  }

  // ── EXERCISE_TIME (10 templates) ──
  const exTitles = [
    'Exercise time: {{exerciseName}}',
    'Time to move!',
    'Your {{exerciseName}} session is ready',
    'Recovery exercise reminder',
    'Let\'s get moving: {{exerciseName}}',
    'Physical therapy: {{exerciseName}}',
    'Exercise checkpoint',
    'Stretch and strengthen',
    'Movement reminder',
    'Your PT exercises are due',
  ];
  const exBodies = [
    'Start your "{{exerciseName}}" exercises. Target: {{duration}} minutes.',
    'Your physical therapy session is scheduled now. {{sets}} sets of {{reps}} reps.',
    'Time for {{exerciseName}}. Remember: slow and steady wins the recovery.',
    'You\'ve completed {{completed}}/{{total}} exercises today. Keep going!',
    'Your {{exerciseName}} routine takes about {{duration}} minutes. Start when ready.',
    'Consistency is key! Your exercise goal today: {{duration}} min of {{exerciseName}}.',
    'Gentle reminder to do your PT exercises. Your body will thank you.',
    'Today\'s exercise: {{exerciseName}}. {{sets}} sets, {{reps}} reps each.',
    'Movement helps recovery. Try {{duration}} minutes of {{exerciseName}} today.',
    'Your therapist recommends {{exerciseName}} today. Tap to begin the guided session.',
  ];
  for (let i = 0; i < 10; i++) {
    templates.push({
      id: `exercise_time_${i + 1}`,
      type: NotificationType.EXERCISE_TIME,
      priority: NotificationPriority.MEDIUM,
      titleTemplate: exTitles[i],
      bodyTemplate: exBodies[i],
      defaultTTLMinutes: 180,
      actionUrl: '/exercises',
      groupKey: 'exercise',
    });
  }

  // ── APPOINTMENT_REMINDER (8 templates) ──
  const apptTitles = [
    'Appointment tomorrow: {{doctorName}}',
    'Upcoming appointment reminder',
    'Don\'t forget: {{appointmentType}} at {{time}}',
    'Appointment in {{hoursUntil}} hours',
    'Check-in: {{appointmentType}}',
    'Your appointment is coming up',
    'Reminder: see {{doctorName}} on {{date}}',
    'Pre-appointment checklist',
  ];
  const apptBodies = [
    'Your {{appointmentType}} with {{doctorName}} is on {{date}} at {{time}}. Location: {{location}}.',
    'Remember your appointment tomorrow. Bring your medication list and any questions.',
    'Your follow-up with {{doctorName}} is in {{hoursUntil}} hours. Prepare your questions.',
    'Appointment reminder: {{appointmentType}} on {{date}}. Arrive 15 minutes early.',
    'Don\'t forget your {{appointmentType}}. {{doctorName}} wants to check on your progress.',
    'Pre-appointment tip: Write down your symptoms and questions before your visit.',
    'Your next appointment: {{appointmentType}} with {{doctorName}}, {{date}} at {{time}}.',
    'Getting ready for your appointment? Review your recent progress in the app first.',
  ];
  for (let i = 0; i < 8; i++) {
    templates.push({
      id: `appointment_${i + 1}`,
      type: NotificationType.APPOINTMENT_REMINDER,
      priority: NotificationPriority.HIGH,
      titleTemplate: apptTitles[i],
      bodyTemplate: apptBodies[i],
      defaultTTLMinutes: 1440,
      actionUrl: '/appointments',
      groupKey: 'appointments',
    });
  }

  // ── VITAL_SIGNS_ALERT (8 templates) ──
  const vitalTitles = [
    'Abnormal {{vitalName}} detected',
    'Vital signs alert',
    'Check your {{vitalName}}',
    '{{vitalName}} outside normal range',
    'Health alert: {{vitalName}}',
    'Vital reading needs attention',
    'Your {{vitalName}} is {{status}}',
    'Important: vital sign change',
  ];
  const vitalBodies = [
    'Your {{vitalName}} reading of {{value}} {{unit}} is {{status}}. Normal range: {{normalRange}}.',
    'We noticed your {{vitalName}} is {{status}} ({{value}} {{unit}}). Please monitor closely.',
    'Your latest {{vitalName}} reading ({{value}} {{unit}}) requires attention. Contact your care team if it persists.',
    'Alert: {{vitalName}} recorded at {{value}} {{unit}}. This is {{deviation}} from your baseline.',
    'Your {{vitalName}} has been {{status}} for {{duration}}. Consider consulting your doctor.',
    'Vital sign update: {{vitalName}} is {{value}} {{unit}} ({{status}}). Retake in 30 minutes.',
    'Please re-check your {{vitalName}}. Last reading: {{value}} {{unit}} ({{status}}).',
    'Your care team has been notified about your {{vitalName}} reading of {{value}} {{unit}}.',
  ];
  for (let i = 0; i < 8; i++) {
    templates.push({
      id: `vital_alert_${i + 1}`,
      type: NotificationType.VITAL_SIGNS_ALERT,
      priority: NotificationPriority.CRITICAL,
      titleTemplate: vitalTitles[i],
      bodyTemplate: vitalBodies[i],
      defaultTTLMinutes: 30,
      actionUrl: '/vitals',
      groupKey: 'vitals',
    });
  }

  // ── RISK_ALERT (6 templates) ──
  const riskTitles = [
    'Elevated risk detected',
    'Health risk alert',
    'Risk level changed: {{riskType}}',
    'Important health update',
    'Risk assessment update',
    'Action needed: {{riskType}} risk',
  ];
  const riskBodies = [
    'Your {{riskType}} risk has increased to {{riskLevel}}. Please review the recommended actions.',
    'Based on recent data, your risk for {{riskType}} is now {{riskLevel}}. Contact your care team.',
    'Alert: your {{riskType}} risk score is {{riskScore}}/100. Factors: {{factors}}.',
    'Your care team has flagged an elevated {{riskType}} risk. Please check in.',
    'Risk update: {{riskType}} moved from {{previousLevel}} to {{riskLevel}}. Tap for details.',
    'Immediate attention suggested: {{riskType}} risk is {{riskLevel}}. Review your care plan.',
  ];
  for (let i = 0; i < 6; i++) {
    templates.push({
      id: `risk_alert_${i + 1}`,
      type: NotificationType.RISK_ALERT,
      priority: NotificationPriority.CRITICAL,
      titleTemplate: riskTitles[i],
      bodyTemplate: riskBodies[i],
      defaultTTLMinutes: 60,
      actionUrl: '/risk-dashboard',
      groupKey: 'risk',
    });
  }

  // ── DOCTOR_MESSAGE (6 templates) ──
  const docTitles = [
    'Message from {{doctorName}}',
    'Your doctor sent a message',
    'New message from your care team',
    '{{doctorName}} has an update',
    'Care team message',
    'Important message from {{doctorName}}',
  ];
  const docBodies = [
    '{{doctorName}} sent you a message: "{{preview}}"',
    'You have a new message from {{doctorName}} regarding your {{topic}}.',
    'Your care team has sent an update. Tap to read the full message.',
    '{{doctorName}} reviewed your recent data and left a note for you.',
    'New care team communication. Subject: {{topic}}. Tap to view.',
    '{{doctorName}} has updated your care plan. Review the changes.',
  ];
  for (let i = 0; i < 6; i++) {
    templates.push({
      id: `doctor_msg_${i + 1}`,
      type: NotificationType.DOCTOR_MESSAGE,
      priority: NotificationPriority.HIGH,
      titleTemplate: docTitles[i],
      bodyTemplate: docBodies[i],
      defaultTTLMinutes: 4320,
      actionUrl: '/messages',
      groupKey: 'messages',
    });
  }

  // ── ACHIEVEMENT (10 templates) ──
  const achTitles = [
    'Achievement unlocked: {{achievementName}}!',
    'Congratulations! You earned {{achievementName}}',
    'New badge: {{achievementName}}',
    'Milestone reached!',
    'You did it! {{achievementName}}',
    'Level up! {{achievementName}}',
    'Recovery milestone: {{achievementName}}',
    'Badge earned: {{achievementName}}',
    'Great progress! {{achievementName}}',
    'Achievement: {{achievementName}}',
  ];
  const achBodies = [
    'You unlocked "{{achievementName}}"! {{description}}. +{{xp}} XP earned.',
    'Amazing work! "{{achievementName}}" is now yours. {{description}}.',
    'You\'ve reached a recovery milestone: {{achievementName}}. Keep it up!',
    '{{achievementName}} achieved! You\'re now in the top {{percentile}}% of patients.',
    'Your consistency paid off: "{{achievementName}}" badge earned. {{description}}.',
    'Level {{level}} reached! "{{achievementName}}" — {{description}}.',
    'New achievement: "{{achievementName}}". Share your progress with your care team!',
    'Wow! You earned "{{achievementName}}" — {{description}}. +{{xp}} XP.',
    'Recovery win: {{achievementName}}! You\'re making great strides.',
    '"{{achievementName}}" unlocked. {{streak}}-day streak! {{description}}.',
  ];
  for (let i = 0; i < 10; i++) {
    templates.push({
      id: `achievement_${i + 1}`,
      type: NotificationType.ACHIEVEMENT,
      priority: NotificationPriority.LOW,
      titleTemplate: achTitles[i],
      bodyTemplate: achBodies[i],
      defaultTTLMinutes: 10080,
      actionUrl: '/achievements',
      groupKey: 'achievements',
    });
  }

  // ── SYSTEM (5 templates) ──
  const sysTitles = [
    'System update available',
    'App maintenance notice',
    'New feature: {{featureName}}',
    'Important system notice',
    'Recovery Pilot update',
  ];
  const sysBodies = [
    'A new version of Recovery Pilot is available. Update for the best experience.',
    'Scheduled maintenance on {{date}} from {{startTime}} to {{endTime}}. Some features may be unavailable.',
    'We\'ve added {{featureName}}! {{description}}. Tap to explore.',
    'Important: {{message}}. Please review and take action if needed.',
    'Recovery Pilot has been updated with improvements to {{area}}.',
  ];
  for (let i = 0; i < 5; i++) {
    templates.push({
      id: `system_${i + 1}`,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      titleTemplate: sysTitles[i],
      bodyTemplate: sysBodies[i],
      defaultTTLMinutes: 10080,
      actionUrl: '/settings',
      groupKey: 'system',
    });
  }

  // ── PAIN_LOG_REMINDER (5 templates) ──
  const painTitles = [
    'Time to log your pain level',
    'Pain check-in',
    'How\'s your pain today?',
    'Daily pain log reminder',
    'Track your pain level',
  ];
  const painBodies = [
    'Please rate your current pain level on a scale of 0-10. Consistent tracking helps your care team.',
    'It\'s time for your pain check-in. How are you feeling compared to yesterday?',
    'Log your pain level now to keep your recovery data up to date.',
    'Your care team benefits from regular pain logs. Tap to record your current level.',
    'Quick check: rate your pain from 0 (none) to 10 (worst). Takes only a moment.',
  ];
  for (let i = 0; i < 5; i++) {
    templates.push({
      id: `pain_log_${i + 1}`,
      type: NotificationType.PAIN_LOG_REMINDER,
      priority: NotificationPriority.MEDIUM,
      titleTemplate: painTitles[i],
      bodyTemplate: painBodies[i],
      defaultTTLMinutes: 120,
      actionUrl: '/pain-log',
      groupKey: 'pain',
    });
  }

  // ── SLEEP_REMINDER (4 templates) ──
  const sleepTitles = [
    'Time to wind down',
    'Sleep reminder',
    'Bedtime approaching',
    'Rest is important for recovery',
  ];
  const sleepBodies = [
    'Good sleep accelerates recovery. Start winding down in the next 30 minutes.',
    'Aim for 7-8 hours of sleep tonight. Put away screens and relax.',
    'Your target bedtime is approaching. Quality sleep helps healing.',
    'Recovery tip: consistent sleep schedules improve outcomes. Time to rest.',
  ];
  for (let i = 0; i < 4; i++) {
    templates.push({
      id: `sleep_${i + 1}`,
      type: NotificationType.SLEEP_REMINDER,
      priority: NotificationPriority.LOW,
      titleTemplate: sleepTitles[i],
      bodyTemplate: sleepBodies[i],
      defaultTTLMinutes: 60,
      actionUrl: '/sleep',
      groupKey: 'wellness',
    });
  }

  // ── HYDRATION_REMINDER (4 templates) ──
  const hydTitles = [
    'Stay hydrated!',
    'Water break reminder',
    'Hydration check',
    'Drink some water',
  ];
  const hydBodies = [
    'You\'ve had {{glasses}} glasses today. Aim for {{target}} to stay hydrated.',
    'Hydration supports healing. Have you had water in the last hour?',
    'Quick reminder: drink a glass of water. Proper hydration aids recovery.',
    'Your hydration goal is {{target}} glasses today. You\'re at {{glasses}} so far.',
  ];
  for (let i = 0; i < 4; i++) {
    templates.push({
      id: `hydration_${i + 1}`,
      type: NotificationType.HYDRATION_REMINDER,
      priority: NotificationPriority.LOW,
      titleTemplate: hydTitles[i],
      bodyTemplate: hydBodies[i],
      defaultTTLMinutes: 120,
      actionUrl: '/hydration',
      groupKey: 'wellness',
    });
  }

  // ── FOLLOW_UP_NEEDED (5 templates) ──
  const fuTitles = [
    'Follow-up needed',
    'Action required: {{topic}}',
    'Please respond: {{topic}}',
    'Care team needs your input',
    'Follow-up reminder',
  ];
  const fuBodies = [
    'Your care team requested a follow-up regarding {{topic}}. Please respond within {{deadline}}.',
    '{{doctorName}} needs your input on {{topic}}. Tap to respond.',
    'A follow-up item is pending: {{topic}}. Please complete it soon.',
    'You have an outstanding follow-up for {{topic}}. Your response helps guide your care.',
    'Reminder: please address the follow-up on {{topic}} from {{doctorName}}.',
  ];
  for (let i = 0; i < 5; i++) {
    templates.push({
      id: `follow_up_${i + 1}`,
      type: NotificationType.FOLLOW_UP_NEEDED,
      priority: NotificationPriority.HIGH,
      titleTemplate: fuTitles[i],
      bodyTemplate: fuBodies[i],
      defaultTTLMinutes: 480,
      actionUrl: '/follow-ups',
      groupKey: 'follow_ups',
    });
  }

  // ── CARE_PLAN_UPDATE (5 templates) ──
  const cpTitles = [
    'Care plan updated',
    'Your care plan has changed',
    'New care plan activity',
    'Care plan revision',
    'Updated recovery plan',
  ];
  const cpBodies = [
    'Your care plan has been updated by {{doctorName}}. Review the changes.',
    'New items added to your care plan: {{changes}}. Tap to view.',
    '{{doctorName}} adjusted your recovery plan. Key change: {{summary}}.',
    'Your care plan was revised on {{date}}. Please review and acknowledge.',
    'Recovery plan update: {{summary}}. Your next steps have been adjusted.',
  ];
  for (let i = 0; i < 5; i++) {
    templates.push({
      id: `care_plan_${i + 1}`,
      type: NotificationType.CARE_PLAN_UPDATE,
      priority: NotificationPriority.MEDIUM,
      titleTemplate: cpTitles[i],
      bodyTemplate: cpBodies[i],
      defaultTTLMinutes: 4320,
      actionUrl: '/care-plan',
      groupKey: 'care_plan',
    });
  }

  return templates;
}

// ─── Default Preferences ─────────────────────────────────────────────

function createDefaultPreferences(patientId: string): NotificationPreferences {
  const categoryDefaults = (
    enabled: boolean,
    priority: NotificationPriority,
    batchWindow: number,
    maxPerDay: number,
  ) => ({
    enabled,
    priority,
    channels: ['in_app' as const, 'push' as const],
    batchWindow,
    maxPerDay,
  });

  return {
    patientId,
    enabled: true,
    quietHoursStart: 22, // 10 PM
    quietHoursEnd: 7,    // 7 AM
    categoryPreferences: {
      [NotificationType.MEDICATION_REMINDER]: categoryDefaults(true, NotificationPriority.HIGH, 0, 10),
      [NotificationType.MISSION_DUE]: categoryDefaults(true, NotificationPriority.MEDIUM, 15, 8),
      [NotificationType.WOUND_CHECK]: categoryDefaults(true, NotificationPriority.HIGH, 0, 3),
      [NotificationType.EXERCISE_TIME]: categoryDefaults(true, NotificationPriority.MEDIUM, 10, 5),
      [NotificationType.APPOINTMENT_REMINDER]: categoryDefaults(true, NotificationPriority.HIGH, 0, 4),
      [NotificationType.VITAL_SIGNS_ALERT]: categoryDefaults(true, NotificationPriority.CRITICAL, 0, 20),
      [NotificationType.RISK_ALERT]: categoryDefaults(true, NotificationPriority.CRITICAL, 0, 10),
      [NotificationType.DOCTOR_MESSAGE]: categoryDefaults(true, NotificationPriority.HIGH, 0, 15),
      [NotificationType.ACHIEVEMENT]: categoryDefaults(true, NotificationPriority.LOW, 30, 10),
      [NotificationType.SYSTEM]: categoryDefaults(true, NotificationPriority.LOW, 60, 5),
      [NotificationType.PAIN_LOG_REMINDER]: categoryDefaults(true, NotificationPriority.MEDIUM, 0, 4),
      [NotificationType.SLEEP_REMINDER]: categoryDefaults(true, NotificationPriority.LOW, 0, 2),
      [NotificationType.HYDRATION_REMINDER]: categoryDefaults(true, NotificationPriority.LOW, 30, 6),
      [NotificationType.FOLLOW_UP_NEEDED]: categoryDefaults(true, NotificationPriority.HIGH, 0, 5),
      [NotificationType.CARE_PLAN_UPDATE]: categoryDefaults(true, NotificationPriority.MEDIUM, 0, 5),
    },
    snoozeDefaults: {
      [NotificationPriority.CRITICAL]: 5,
      [NotificationPriority.HIGH]: 15,
      [NotificationPriority.MEDIUM]: 30,
      [NotificationPriority.LOW]: 60,
    },
  };
}

// ─── Default Escalation Rules ────────────────────────────────────────

function getDefaultEscalationRules(): EscalationRule[] {
  return [
    {
      type: NotificationType.VITAL_SIGNS_ALERT,
      priority: NotificationPriority.CRITICAL,
      acknowledgeWithinMinutes: 10,
      escalateToTypes: [NotificationType.RISK_ALERT, NotificationType.DOCTOR_MESSAGE],
      maxEscalationLevel: 3,
      escalationIntervalMinutes: 5,
    },
    {
      type: NotificationType.RISK_ALERT,
      priority: NotificationPriority.CRITICAL,
      acknowledgeWithinMinutes: 15,
      escalateToTypes: [NotificationType.DOCTOR_MESSAGE],
      maxEscalationLevel: 2,
      escalationIntervalMinutes: 10,
    },
    {
      type: NotificationType.MEDICATION_REMINDER,
      priority: NotificationPriority.HIGH,
      acknowledgeWithinMinutes: 30,
      escalateToTypes: [NotificationType.FOLLOW_UP_NEEDED],
      maxEscalationLevel: 2,
      escalationIntervalMinutes: 15,
    },
    {
      type: NotificationType.WOUND_CHECK,
      priority: NotificationPriority.HIGH,
      acknowledgeWithinMinutes: 60,
      escalateToTypes: [NotificationType.FOLLOW_UP_NEEDED],
      maxEscalationLevel: 2,
      escalationIntervalMinutes: 30,
    },
    {
      type: NotificationType.DOCTOR_MESSAGE,
      priority: NotificationPriority.HIGH,
      acknowledgeWithinMinutes: 120,
      escalateToTypes: [NotificationType.FOLLOW_UP_NEEDED],
      maxEscalationLevel: 1,
      escalationIntervalMinutes: 60,
    },
    {
      type: NotificationType.FOLLOW_UP_NEEDED,
      priority: NotificationPriority.HIGH,
      acknowledgeWithinMinutes: 240,
      escalateToTypes: [NotificationType.RISK_ALERT],
      maxEscalationLevel: 1,
      escalationIntervalMinutes: 120,
    },
  ];
}

// ─── Priority Queue ──────────────────────────────────────────────────

class NotificationPriorityQueue {
  private heap: Notification[] = [];

  private parentIndex(i: number): number {
    return Math.floor((i - 1) / 2);
  }
  private leftChildIndex(i: number): number {
    return 2 * i + 1;
  }
  private rightChildIndex(i: number): number {
    return 2 * i + 2;
  }

  private compare(a: Notification, b: Notification): number {
    // Higher priority first; if equal, earlier scheduledFor first
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.scheduledFor - b.scheduledFor;
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = this.parentIndex(i);
      if (this.compare(this.heap[i], this.heap[parent]) < 0) {
        this.swap(i, parent);
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = this.leftChildIndex(i);
      const right = this.rightChildIndex(i);
      if (left < n && this.compare(this.heap[left], this.heap[smallest]) < 0) smallest = left;
      if (right < n && this.compare(this.heap[right], this.heap[smallest]) < 0) smallest = right;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  enqueue(notification: Notification): void {
    this.heap.push(notification);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): Notification | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  peek(): Notification | undefined {
    return this.heap[0];
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  toArray(): Notification[] {
    return [...this.heap].sort((a, b) => this.compare(a, b));
  }

  remove(notificationId: string): boolean {
    const idx = this.heap.findIndex((n) => n.id === notificationId);
    if (idx === -1) return false;
    const last = this.heap.pop()!;
    if (idx < this.heap.length) {
      this.heap[idx] = last;
      this.bubbleUp(idx);
      this.sinkDown(idx);
    }
    return true;
  }
}

// ─── Rate Limiter ────────────────────────────────────────────────────

class RateLimiter {
  private counters: Map<string, { count: number; windowStart: number }> = new Map();
  private windowMs: number;

  constructor(windowMs: number = 86400000) {
    // default 24 hour window
    this.windowMs = windowMs;
  }

  check(key: string, maxCount: number): boolean {
    const now = nowMs();
    const entry = this.counters.get(key);
    if (!entry || now - entry.windowStart >= this.windowMs) {
      return true; // new window or no entry
    }
    return entry.count < maxCount;
  }

  record(key: string): void {
    const now = nowMs();
    const entry = this.counters.get(key);
    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.counters.set(key, { count: 1, windowStart: now });
    } else {
      entry.count++;
    }
  }

  getCount(key: string): number {
    const now = nowMs();
    const entry = this.counters.get(key);
    if (!entry || now - entry.windowStart >= this.windowMs) return 0;
    return entry.count;
  }

  reset(key?: string): void {
    if (key) {
      this.counters.delete(key);
    } else {
      this.counters.clear();
    }
  }
}

// ─── Deduplication Tracker ───────────────────────────────────────────

class DeduplicationTracker {
  private seen: Map<string, number> = new Map();
  private windowMs: number;

  constructor(windowMs: number = 300000) {
    // default 5-min dedup window
    this.windowMs = windowMs;
  }

  isDuplicate(key: string): boolean {
    const now = nowMs();
    const lastSeen = this.seen.get(key);
    if (lastSeen && now - lastSeen < this.windowMs) {
      return true;
    }
    return false;
  }

  record(key: string): void {
    this.seen.set(key, nowMs());
  }

  cleanup(): void {
    const now = nowMs();
    for (const [key, ts] of this.seen) {
      if (now - ts >= this.windowMs) {
        this.seen.delete(key);
      }
    }
  }

  clear(): void {
    this.seen.clear();
  }
}

// ─── Smart Scheduler ─────────────────────────────────────────────────

interface SmartSchedulerConfig {
  quietHoursStart: number;
  quietHoursEnd: number;
  batchWindowMs: number;
  optimalTimes: Record<NotificationType, number[]>; // preferred hours
}

function getDefaultOptimalTimes(): Record<NotificationType, number[]> {
  return {
    [NotificationType.MEDICATION_REMINDER]: [8, 12, 18, 21],
    [NotificationType.MISSION_DUE]: [9, 14, 17],
    [NotificationType.WOUND_CHECK]: [10, 16],
    [NotificationType.EXERCISE_TIME]: [9, 11, 15],
    [NotificationType.APPOINTMENT_REMINDER]: [8, 18],
    [NotificationType.VITAL_SIGNS_ALERT]: [],      // immediate, no preferred time
    [NotificationType.RISK_ALERT]: [],              // immediate
    [NotificationType.DOCTOR_MESSAGE]: [9, 12, 16],
    [NotificationType.ACHIEVEMENT]: [10, 14, 19],
    [NotificationType.SYSTEM]: [10, 14],
    [NotificationType.PAIN_LOG_REMINDER]: [8, 12, 18, 21],
    [NotificationType.SLEEP_REMINDER]: [21, 22],
    [NotificationType.HYDRATION_REMINDER]: [9, 11, 13, 15, 17],
    [NotificationType.FOLLOW_UP_NEEDED]: [9, 14],
    [NotificationType.CARE_PLAN_UPDATE]: [9, 14, 17],
  };
}

function findOptimalDeliveryTime(
  type: NotificationType,
  priority: NotificationPriority,
  prefs: NotificationPreferences,
): number {
  const now = new Date();
  const currentHour = now.getHours();

  // Critical and high priority: deliver immediately unless quiet hours
  if (priority >= NotificationPriority.CRITICAL) {
    return nowMs();
  }

  // Check quiet hours
  if (isQuietHours(currentHour, prefs.quietHoursStart, prefs.quietHoursEnd)) {
    // Schedule for end of quiet hours
    const target = new Date(now);
    target.setHours(prefs.quietHoursEnd, 0, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }

  // Check batch window
  const catPref = prefs.categoryPreferences[type];
  if (catPref && catPref.batchWindow > 0) {
    return nowMs() + minutesToMs(catPref.batchWindow);
  }

  // Use optimal time if available and in the future
  const optimalTimes = getDefaultOptimalTimes()[type];
  if (optimalTimes && optimalTimes.length > 0) {
    for (const hour of optimalTimes) {
      if (hour > currentHour && !isQuietHours(hour, prefs.quietHoursStart, prefs.quietHoursEnd)) {
        const target = new Date(now);
        target.setHours(hour, 0, 0, 0);
        // Only use if within 2 hours from now
        if (target.getTime() - now.getTime() <= 7200000) {
          return target.getTime();
        }
      }
    }
  }

  return nowMs();
}

// ─── Main Notification Service ───────────────────────────────────────

export interface NotificationService {
  // Core operations
  create(
    type: NotificationType,
    patientId: string,
    vars?: Record<string, string | number>,
    overrides?: Partial<Pick<Notification, 'priority' | 'scheduledFor' | 'metadata' | 'actionUrl'>>,
  ): Notification | null;
  deliver(notificationId: string): boolean;
  markAsRead(notificationId: string): boolean;
  snooze(notificationId: string, minutes?: number): boolean;
  dismiss(notificationId: string): boolean;

  // Query
  getById(notificationId: string): Notification | undefined;
  getForPatient(patientId: string, options?: {
    status?: NotificationStatus[];
    type?: NotificationType[];
    limit?: number;
    offset?: number;
  }): Notification[];
  getUnread(patientId: string): Notification[];
  getHistory(patientId: string, limit?: number): Notification[];
  getPending(): Notification[];

  // Batch & scheduling
  processPendingDeliveries(): Notification[];
  processEscalations(): Notification[];
  getBatchGroups(patientId: string): BatchGroup[];

  // Preferences
  getPreferences(patientId: string): NotificationPreferences;
  updatePreferences(patientId: string, updates: Partial<NotificationPreferences>): NotificationPreferences;
  setQuietHours(patientId: string, start: number, end: number): void;
  toggleCategory(patientId: string, type: NotificationType, enabled: boolean): void;

  // Templates
  getTemplates(type?: NotificationType): NotificationTemplate[];
  getTemplateById(templateId: string): NotificationTemplate | undefined;

  // Stats
  getStats(patientId?: string): NotificationStats;

  // Management
  clearExpired(): number;
  clearAll(patientId?: string): number;
  resetRateLimits(): void;

  // Escalation rules
  getEscalationRules(): EscalationRule[];
}

export function createNotificationService(): NotificationService {
  const templates = buildTemplates();
  const templateIndex = new Map<string, NotificationTemplate>();
  const templatesByType = new Map<NotificationType, NotificationTemplate[]>();
  for (const t of templates) {
    templateIndex.set(t.id, t);
    const list = templatesByType.get(t.type) || [];
    list.push(t);
    templatesByType.set(t.type, list);
  }

  const notifications = new Map<string, Notification>();
  const patientNotifications = new Map<string, Set<string>>();
  const preferencesMap = new Map<string, NotificationPreferences>();
  const queue = new NotificationPriorityQueue();
  const rateLimiter = new RateLimiter();
  const deduplicator = new DeduplicationTracker();
  const escalationRules = getDefaultEscalationRules();

  // Template selection: rotate through available templates for variety
  const templateCounters = new Map<NotificationType, number>();

  function pickTemplate(type: NotificationType): NotificationTemplate | null {
    const available = templatesByType.get(type);
    if (!available || available.length === 0) return null;
    const counter = templateCounters.get(type) || 0;
    const template = available[counter % available.length];
    templateCounters.set(type, counter + 1);
    return template;
  }

  function getOrCreatePrefs(patientId: string): NotificationPreferences {
    let prefs = preferencesMap.get(patientId);
    if (!prefs) {
      prefs = createDefaultPreferences(patientId);
      preferencesMap.set(patientId, prefs);
    }
    return prefs;
  }

  function addNotification(n: Notification): void {
    notifications.set(n.id, n);
    let pSet = patientNotifications.get(n.patientId);
    if (!pSet) {
      pSet = new Set();
      patientNotifications.set(n.patientId, pSet);
    }
    pSet.add(n.id);
  }

  function getPatientNotifications(patientId: string): Notification[] {
    const ids = patientNotifications.get(patientId);
    if (!ids) return [];
    const result: Notification[] = [];
    for (const id of ids) {
      const n = notifications.get(id);
      if (n) result.push(n);
    }
    return result;
  }

  return {
    // ── Core Operations ──────────────────────────────────────────

    create(
      type: NotificationType,
      patientId: string,
      vars: Record<string, string | number> = {},
      overrides?: Partial<Pick<Notification, 'priority' | 'scheduledFor' | 'metadata' | 'actionUrl'>>,
    ): Notification | null {
      const prefs = getOrCreatePrefs(patientId);

      // Check if globally or category disabled
      if (!prefs.enabled) return null;
      const catPref = prefs.categoryPreferences[type];
      if (catPref && !catPref.enabled) return null;

      // Rate limiting
      const rateKey = `${patientId}_${type}`;
      const maxPerDay = catPref?.maxPerDay ?? 10;
      if (!rateLimiter.check(rateKey, maxPerDay)) return null;

      // Deduplication
      const dedupKey = `${patientId}_${type}_${JSON.stringify(vars)}`;
      if (deduplicator.isDuplicate(dedupKey)) return null;

      // Pick template
      const template = pickTemplate(type);
      if (!template) return null;

      const priority = overrides?.priority ?? (catPref?.priority ?? template.priority);
      const scheduledFor = overrides?.scheduledFor ?? findOptimalDeliveryTime(type, priority, prefs);
      const ttlMinutes = template.defaultTTLMinutes;

      const notification: Notification = {
        id: generateId(),
        type,
        priority,
        status: NotificationStatus.PENDING,
        title: interpolateTemplate(template.titleTemplate, vars),
        body: interpolateTemplate(template.bodyTemplate, vars),
        patientId,
        createdAt: nowMs(),
        scheduledFor,
        expiresAt: scheduledFor + minutesToMs(ttlMinutes),
        metadata: overrides?.metadata,
        actionUrl: overrides?.actionUrl ?? template.actionUrl,
        groupKey: template.groupKey,
        escalationLevel: 0,
        deduplicationKey: dedupKey,
      };

      addNotification(notification);
      queue.enqueue(notification);
      rateLimiter.record(rateKey);
      deduplicator.record(dedupKey);

      return notification;
    },

    deliver(notificationId: string): boolean {
      const n = notifications.get(notificationId);
      if (!n || n.status !== NotificationStatus.PENDING) return false;
      n.status = NotificationStatus.DELIVERED;
      n.deliveredAt = nowMs();
      return true;
    },

    markAsRead(notificationId: string): boolean {
      const n = notifications.get(notificationId);
      if (!n) return false;
      if (n.status === NotificationStatus.EXPIRED || n.status === NotificationStatus.DISMISSED) return false;
      n.status = NotificationStatus.READ;
      n.readAt = nowMs();
      return true;
    },

    snooze(notificationId: string, minutes?: number): boolean {
      const n = notifications.get(notificationId);
      if (!n) return false;
      if (n.status === NotificationStatus.EXPIRED || n.status === NotificationStatus.DISMISSED) return false;

      const prefs = getOrCreatePrefs(n.patientId);
      const snoozeDuration = minutes ?? prefs.snoozeDefaults[n.priority] ?? 15;

      n.status = NotificationStatus.SNOOZED;
      n.snoozedUntil = nowMs() + minutesToMs(snoozeDuration);
      n.scheduledFor = n.snoozedUntil;

      // Re-add to queue for future delivery
      queue.enqueue(n);
      return true;
    },

    dismiss(notificationId: string): boolean {
      const n = notifications.get(notificationId);
      if (!n) return false;
      n.status = NotificationStatus.DISMISSED;
      queue.remove(notificationId);
      return true;
    },

    // ── Query ────────────────────────────────────────────────────

    getById(notificationId: string): Notification | undefined {
      return notifications.get(notificationId);
    },

    getForPatient(
      patientId: string,
      options?: {
        status?: NotificationStatus[];
        type?: NotificationType[];
        limit?: number;
        offset?: number;
      },
    ): Notification[] {
      let result = getPatientNotifications(patientId);

      if (options?.status) {
        const statusSet = new Set(options.status);
        result = result.filter((n) => statusSet.has(n.status));
      }
      if (options?.type) {
        const typeSet = new Set(options.type);
        result = result.filter((n) => typeSet.has(n.type));
      }

      // Sort: highest priority first, then most recent first
      result.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.createdAt - a.createdAt;
      });

      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? result.length;
      return result.slice(offset, offset + limit);
    },

    getUnread(patientId: string): Notification[] {
      return getPatientNotifications(patientId)
        .filter((n) =>
          n.status === NotificationStatus.DELIVERED ||
          n.status === NotificationStatus.PENDING,
        )
        .sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          return b.createdAt - a.createdAt;
        });
    },

    getHistory(patientId: string, limit: number = 50): Notification[] {
      return getPatientNotifications(patientId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    },

    getPending(): Notification[] {
      return queue.toArray().filter((n) => n.status === NotificationStatus.PENDING);
    },

    // ── Batch & Scheduling ────────────────────────────────────────

    processPendingDeliveries(): Notification[] {
      const now = nowMs();
      const delivered: Notification[] = [];

      // Process queue
      while (!queue.isEmpty()) {
        const top = queue.peek();
        if (!top) break;
        if (top.scheduledFor > now) break; // not yet time

        const n = queue.dequeue()!;
        const actual = notifications.get(n.id);
        if (!actual) continue;

        // Check expiration
        if (actual.expiresAt && actual.expiresAt < now) {
          actual.status = NotificationStatus.EXPIRED;
          continue;
        }

        // Check snoozed that are now due
        if (actual.status === NotificationStatus.SNOOZED && actual.snoozedUntil && actual.snoozedUntil > now) {
          queue.enqueue(actual); // re-enqueue
          continue;
        }

        if (actual.status === NotificationStatus.PENDING || actual.status === NotificationStatus.SNOOZED) {
          actual.status = NotificationStatus.DELIVERED;
          actual.deliveredAt = now;
          delivered.push(actual);
        }
      }

      return delivered;
    },

    processEscalations(): Notification[] {
      const now = nowMs();
      const escalated: Notification[] = [];

      for (const [, n] of notifications) {
        if (n.status !== NotificationStatus.DELIVERED) continue;
        if (!n.deliveredAt) continue;

        // Find applicable escalation rule
        const rule = escalationRules.find((r) => r.type === n.type && r.priority === n.priority);
        if (!rule) continue;

        // Check if acknowledgment window has passed
        const elapsedMin = (now - n.deliveredAt) / 60000;
        const totalEscalationMin = rule.acknowledgeWithinMinutes +
          n.escalationLevel * rule.escalationIntervalMinutes;

        if (elapsedMin >= totalEscalationMin && n.escalationLevel < rule.maxEscalationLevel) {
          n.escalationLevel++;
          n.status = NotificationStatus.ESCALATED;

          // Create escalation notifications
          for (const escType of rule.escalateToTypes) {
            const escNotif = this.create(
              escType,
              n.patientId,
              {
                topic: n.title,
                message: `Escalation (level ${n.escalationLevel}): ${n.body}`,
                doctorName: 'Care Team',
                preview: n.body.substring(0, 100),
              },
              {
                priority: Math.min(n.priority + 1, NotificationPriority.CRITICAL) as NotificationPriority,
                metadata: { escalatedFrom: n.id, escalationLevel: n.escalationLevel },
              },
            );
            if (escNotif) escalated.push(escNotif);
          }
        }
      }

      return escalated;
    },

    getBatchGroups(patientId: string): BatchGroup[] {
      const pending = getPatientNotifications(patientId)
        .filter((n) => n.status === NotificationStatus.PENDING && n.groupKey);

      const groups = new Map<string, Notification[]>();
      for (const n of pending) {
        const key = n.groupKey!;
        const list = groups.get(key) || [];
        list.push(n);
        groups.set(key, list);
      }

      const result: BatchGroup[] = [];
      for (const [groupKey, notifs] of groups) {
        if (notifs.length > 1) {
          result.push({
            groupKey,
            notifications: notifs.sort((a, b) => b.priority - a.priority),
            scheduledDelivery: Math.min(...notifs.map((n) => n.scheduledFor)),
          });
        }
      }

      return result.sort((a, b) => a.scheduledDelivery - b.scheduledDelivery);
    },

    // ── Preferences ───────────────────────────────────────────────

    getPreferences(patientId: string): NotificationPreferences {
      return getOrCreatePrefs(patientId);
    },

    updatePreferences(
      patientId: string,
      updates: Partial<NotificationPreferences>,
    ): NotificationPreferences {
      const prefs = getOrCreatePrefs(patientId);
      if (updates.enabled !== undefined) prefs.enabled = updates.enabled;
      if (updates.quietHoursStart !== undefined) prefs.quietHoursStart = updates.quietHoursStart;
      if (updates.quietHoursEnd !== undefined) prefs.quietHoursEnd = updates.quietHoursEnd;
      if (updates.categoryPreferences) {
        for (const [key, val] of Object.entries(updates.categoryPreferences)) {
          prefs.categoryPreferences[key as NotificationType] = val;
        }
      }
      if (updates.snoozeDefaults) {
        Object.assign(prefs.snoozeDefaults, updates.snoozeDefaults);
      }
      preferencesMap.set(patientId, prefs);
      return prefs;
    },

    setQuietHours(patientId: string, start: number, end: number): void {
      const prefs = getOrCreatePrefs(patientId);
      prefs.quietHoursStart = start;
      prefs.quietHoursEnd = end;
    },

    toggleCategory(patientId: string, type: NotificationType, enabled: boolean): void {
      const prefs = getOrCreatePrefs(patientId);
      if (prefs.categoryPreferences[type]) {
        prefs.categoryPreferences[type].enabled = enabled;
      }
    },

    // ── Templates ─────────────────────────────────────────────────

    getTemplates(type?: NotificationType): NotificationTemplate[] {
      if (type) return templatesByType.get(type) || [];
      return templates;
    },

    getTemplateById(templateId: string): NotificationTemplate | undefined {
      return templateIndex.get(templateId);
    },

    // ── Stats ─────────────────────────────────────────────────────

    getStats(patientId?: string): NotificationStats {
      let notifs: Notification[];
      if (patientId) {
        notifs = getPatientNotifications(patientId);
      } else {
        notifs = Array.from(notifications.values());
      }

      const stats: NotificationStats = {
        total: notifs.length,
        delivered: 0,
        read: 0,
        snoozed: 0,
        dismissed: 0,
        expired: 0,
        escalated: 0,
        avgReadTimeMs: 0,
        readRate: 0,
        byType: {} as Record<NotificationType, number>,
        byPriority: {} as Record<NotificationPriority, number>,
      };

      // Initialize counters
      for (const t of Object.values(NotificationType)) {
        stats.byType[t as NotificationType] = 0;
      }
      for (const p of [NotificationPriority.LOW, NotificationPriority.MEDIUM, NotificationPriority.HIGH, NotificationPriority.CRITICAL]) {
        stats.byPriority[p] = 0;
      }

      let totalReadTime = 0;
      let readCount = 0;

      for (const n of notifs) {
        stats.byType[n.type]++;
        stats.byPriority[n.priority]++;

        switch (n.status) {
          case NotificationStatus.DELIVERED:
            stats.delivered++;
            break;
          case NotificationStatus.READ:
            stats.read++;
            if (n.deliveredAt && n.readAt) {
              totalReadTime += n.readAt - n.deliveredAt;
              readCount++;
            }
            break;
          case NotificationStatus.SNOOZED:
            stats.snoozed++;
            break;
          case NotificationStatus.DISMISSED:
            stats.dismissed++;
            break;
          case NotificationStatus.EXPIRED:
            stats.expired++;
            break;
          case NotificationStatus.ESCALATED:
            stats.escalated++;
            break;
        }
      }

      stats.avgReadTimeMs = readCount > 0 ? Math.round(totalReadTime / readCount) : 0;
      const deliveredOrRead = stats.delivered + stats.read;
      stats.readRate = deliveredOrRead > 0 ? Math.round((stats.read / deliveredOrRead) * 1000) / 1000 : 0;

      return stats;
    },

    // ── Management ────────────────────────────────────────────────

    clearExpired(): number {
      const now = nowMs();
      let count = 0;
      for (const [id, n] of notifications) {
        if (n.expiresAt && n.expiresAt < now && n.status === NotificationStatus.PENDING) {
          n.status = NotificationStatus.EXPIRED;
          queue.remove(id);
          count++;
        }
      }
      deduplicator.cleanup();
      return count;
    },

    clearAll(patientId?: string): number {
      let count = 0;
      if (patientId) {
        const ids = patientNotifications.get(patientId);
        if (ids) {
          for (const id of ids) {
            notifications.delete(id);
            queue.remove(id);
            count++;
          }
          patientNotifications.delete(patientId);
        }
      } else {
        count = notifications.size;
        notifications.clear();
        patientNotifications.clear();
        // Rebuild queue (empty)
        while (!queue.isEmpty()) queue.dequeue();
      }
      return count;
    },

    resetRateLimits(): void {
      rateLimiter.reset();
      deduplicator.clear();
    },

    getEscalationRules(): EscalationRule[] {
      return [...escalationRules];
    },
  };
}

// ─── Default Singleton ───────────────────────────────────────────────

let _defaultInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!_defaultInstance) {
    _defaultInstance = createNotificationService();
  }
  return _defaultInstance;
}

export default getNotificationService;
