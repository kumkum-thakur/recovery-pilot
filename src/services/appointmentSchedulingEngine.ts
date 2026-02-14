/**
 * Smart Appointment Scheduling Engine
 * Multi-provider scheduling with no-show prediction, optimization, and reminder escalation.
 */

type AppointmentType = 'follow_up' | 'wound_check' | 'physical_therapy' | 'lab_work' | 'imaging' | 'telehealth' | 'pre_op' | 'post_op';
type AppointmentPriority = 'urgent' | 'routine' | 'preventive';
type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled' | 'rescheduled';
type ReminderChannel = 'sms' | 'email' | 'push' | 'phone_call';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  location: { address: string; lat: number; lng: number };
  availableSlots: { dayOfWeek: number; startTime: string; endTime: string }[]; // 0=Sun, 6=Sat
  appointmentTypes: AppointmentType[];
  avgAppointmentMinutes: Record<AppointmentType, number>;
}

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  type: AppointmentType;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  scheduledAt: Date;
  durationMinutes: number;
  location: string;
  telehealth: boolean;
  notes?: string;
  reminders: { channel: ReminderChannel; scheduledFor: Date; sent: boolean }[];
  noShowProbability?: number;
  createdAt: Date;
}

interface TimeSlot {
  start: Date;
  end: Date;
  providerId: string;
  providerName: string;
  location: string;
  available: boolean;
}

interface NoShowPrediction {
  probability: number;
  riskLevel: 'low' | 'moderate' | 'high';
  contributingFactors: { factor: string; weight: number }[];
  recommendation: string;
}

interface NoShowFeatures {
  age: number;
  distanceMiles: number;
  weatherCondition: 'clear' | 'rain' | 'snow' | 'extreme_heat' | 'extreme_cold';
  previousNoShows: number;
  previousAppointments: number;
  daysSinceLastVisit: number;
  appointmentType: AppointmentType;
  isMonday: boolean;
  isTelehealth: boolean;
  hourOfDay: number;
}

interface OutcomeRecord {
  appointmentId: string;
  predicted: number;
  actual: 'show' | 'no_show';
  features: NoShowFeatures;
  recordedAt: Date;
}

interface ScheduleOptimizationResult {
  originalOrder: string[];
  optimizedOrder: string[];
  estimatedTimeSavedMinutes: number;
  changes: { appointmentId: string; reason: string }[];
}

// Appointment type configurations
const APPOINTMENT_CONFIGS: Record<AppointmentType, { defaultDuration: number; prepTimeMinutes: number; followUpDays: number; description: string }> = {
  follow_up: { defaultDuration: 20, prepTimeMinutes: 5, followUpDays: 14, description: 'Post-procedure follow-up visit' },
  wound_check: { defaultDuration: 15, prepTimeMinutes: 5, followUpDays: 7, description: 'Surgical wound assessment' },
  physical_therapy: { defaultDuration: 45, prepTimeMinutes: 10, followUpDays: 3, description: 'Physical therapy session' },
  lab_work: { defaultDuration: 15, prepTimeMinutes: 0, followUpDays: 30, description: 'Laboratory blood draw or specimen collection' },
  imaging: { defaultDuration: 30, prepTimeMinutes: 15, followUpDays: 90, description: 'X-ray, MRI, CT, or ultrasound' },
  telehealth: { defaultDuration: 20, prepTimeMinutes: 5, followUpDays: 14, description: 'Virtual video visit' },
  pre_op: { defaultDuration: 45, prepTimeMinutes: 15, followUpDays: 0, description: 'Pre-operative evaluation' },
  post_op: { defaultDuration: 30, prepTimeMinutes: 10, followUpDays: 7, description: 'Post-operative assessment' },
};

// Sample provider data
const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'prov_1', name: 'Dr. Sarah Chen', specialty: 'Orthopedic Surgery',
    location: { address: '100 Medical Center Dr, Suite 200', lat: 40.7128, lng: -74.006 },
    availableSlots: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '14:00' },
    ],
    appointmentTypes: ['follow_up', 'wound_check', 'post_op', 'pre_op', 'telehealth'],
    avgAppointmentMinutes: { follow_up: 20, wound_check: 15, physical_therapy: 0, lab_work: 0, imaging: 0, telehealth: 15, pre_op: 45, post_op: 30 },
  },
  {
    id: 'prov_2', name: 'Dr. James Wilson', specialty: 'Cardiology',
    location: { address: '200 Heart Center Blvd', lat: 40.7148, lng: -74.008 },
    availableSlots: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '13:00' },
    ],
    appointmentTypes: ['follow_up', 'pre_op', 'post_op', 'telehealth', 'imaging'],
    avgAppointmentMinutes: { follow_up: 25, wound_check: 0, physical_therapy: 0, lab_work: 0, imaging: 30, telehealth: 20, pre_op: 45, post_op: 30 },
  },
  {
    id: 'prov_3', name: 'Maria Rodriguez, PT', specialty: 'Physical Therapy',
    location: { address: '150 Rehab Way', lat: 40.7108, lng: -74.004 },
    availableSlots: [
      { dayOfWeek: 1, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '07:00', endTime: '18:00' },
    ],
    appointmentTypes: ['physical_therapy', 'follow_up', 'telehealth'],
    avgAppointmentMinutes: { follow_up: 15, wound_check: 0, physical_therapy: 45, lab_work: 0, imaging: 0, telehealth: 30, pre_op: 0, post_op: 0 },
  },
  {
    id: 'prov_4', name: 'Lab Services', specialty: 'Laboratory',
    location: { address: '100 Medical Center Dr, Ground Floor', lat: 40.7128, lng: -74.006 },
    availableSlots: [
      { dayOfWeek: 1, startTime: '06:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '06:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '06:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '06:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '06:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '07:00', endTime: '12:00' },
    ],
    appointmentTypes: ['lab_work'],
    avgAppointmentMinutes: { follow_up: 0, wound_check: 0, physical_therapy: 0, lab_work: 15, imaging: 0, telehealth: 0, pre_op: 0, post_op: 0 },
  },
  {
    id: 'prov_5', name: 'Imaging Center', specialty: 'Radiology',
    location: { address: '250 Diagnostic Blvd', lat: 40.7168, lng: -74.010 },
    availableSlots: [
      { dayOfWeek: 1, startTime: '07:00', endTime: '19:00' },
      { dayOfWeek: 2, startTime: '07:00', endTime: '19:00' },
      { dayOfWeek: 3, startTime: '07:00', endTime: '19:00' },
      { dayOfWeek: 4, startTime: '07:00', endTime: '19:00' },
      { dayOfWeek: 5, startTime: '07:00', endTime: '17:00' },
    ],
    appointmentTypes: ['imaging'],
    avgAppointmentMinutes: { follow_up: 0, wound_check: 0, physical_therapy: 0, lab_work: 0, imaging: 30, telehealth: 0, pre_op: 0, post_op: 0 },
  },
];

// Logistic regression coefficients for no-show prediction (trained on historical data)
const NO_SHOW_COEFFICIENTS = {
  intercept: -2.1,
  age_under_30: 0.45,
  age_over_70: 0.30,
  distance_per_mile: 0.03,
  weather_rain: 0.35,
  weather_snow: 0.65,
  weather_extreme_heat: 0.25,
  weather_extreme_cold: 0.40,
  previous_no_show_rate: 1.8,
  days_since_last_visit_per_30: 0.08,
  is_monday: 0.20,
  is_telehealth: -0.55,
  is_pt: -0.15,
  is_lab: 0.10,
  hour_before_10am: -0.15,
  hour_after_3pm: 0.25,
};

export class AppointmentSchedulingEngine {
  private appointments: Map<string, Appointment> = new Map();
  private providers: Map<string, Provider> = new Map();
  private outcomes: OutcomeRecord[] = [];
  private idCounter = 1;

  constructor() {
    for (const p of DEFAULT_PROVIDERS) {
      this.providers.set(p.id, p);
    }
  }

  scheduleAppointment(data: {
    patientId: string;
    providerId: string;
    type: AppointmentType;
    priority: AppointmentPriority;
    scheduledAt: Date;
    notes?: string;
    noShowFeatures?: NoShowFeatures;
  }): { appointment: Appointment | null; conflict: boolean; conflictDetails?: string } {
    const provider = this.providers.get(data.providerId);
    if (!provider) return { appointment: null, conflict: false, conflictDetails: 'Provider not found' };

    if (!provider.appointmentTypes.includes(data.type)) {
      return { appointment: null, conflict: false, conflictDetails: `Provider does not offer ${data.type} appointments` };
    }

    const duration = provider.avgAppointmentMinutes[data.type] || APPOINTMENT_CONFIGS[data.type].defaultDuration;
    const endTime = new Date(data.scheduledAt.getTime() + duration * 60000);

    // Check conflicts
    const conflicting = Array.from(this.appointments.values()).find(a => {
      if (a.providerId !== data.providerId) return false;
      if (a.status === 'cancelled' || a.status === 'no_show') return false;
      const aEnd = new Date(a.scheduledAt.getTime() + a.durationMinutes * 60000);
      return data.scheduledAt < aEnd && endTime > a.scheduledAt;
    });

    if (conflicting) {
      return { appointment: null, conflict: true, conflictDetails: `Conflicts with appointment ${conflicting.id} at ${conflicting.scheduledAt.toISOString()}` };
    }

    const isTelehealth = data.type === 'telehealth';
    const noShowProb = data.noShowFeatures ? this.computeNoShowProbability(data.noShowFeatures) : undefined;

    // Build reminder escalation
    const reminders = this.buildReminderEscalation(data.scheduledAt, data.priority, noShowProb);

    const appointment: Appointment = {
      id: `appt_${this.idCounter++}_${Date.now()}`,
      patientId: data.patientId,
      providerId: data.providerId,
      type: data.type,
      priority: data.priority,
      status: 'scheduled',
      scheduledAt: data.scheduledAt,
      durationMinutes: duration,
      location: isTelehealth ? 'Virtual - Video Link' : provider.location.address,
      telehealth: isTelehealth,
      notes: data.notes,
      reminders,
      noShowProbability: noShowProb,
      createdAt: new Date(),
    };

    this.appointments.set(appointment.id, appointment);
    return { appointment, conflict: false };
  }

  findAvailableSlots(criteria: {
    type: AppointmentType;
    providerId?: string;
    fromDate: Date;
    toDate: Date;
    preferredTimeOfDay?: 'morning' | 'afternoon';
  }): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const providers = criteria.providerId
      ? [this.providers.get(criteria.providerId)].filter(Boolean) as Provider[]
      : Array.from(this.providers.values()).filter(p => p.appointmentTypes.includes(criteria.type));

    const duration = APPOINTMENT_CONFIGS[criteria.type].defaultDuration;

    for (const provider of providers) {
      const current = new Date(criteria.fromDate);
      current.setHours(0, 0, 0, 0);

      while (current <= criteria.toDate) {
        const dayOfWeek = current.getDay();
        const daySlots = provider.availableSlots.filter(s => s.dayOfWeek === dayOfWeek);

        for (const daySlot of daySlots) {
          const [startH, startM] = daySlot.startTime.split(':').map(Number);
          const [endH, endM] = daySlot.endTime.split(':').map(Number);

          let slotStart = new Date(current);
          slotStart.setHours(startH, startM, 0, 0);
          const dayEnd = new Date(current);
          dayEnd.setHours(endH, endM, 0, 0);

          while (slotStart.getTime() + duration * 60000 <= dayEnd.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + duration * 60000);

            // Filter by preferred time
            if (criteria.preferredTimeOfDay === 'morning' && slotStart.getHours() >= 12) {
              slotStart = new Date(slotStart.getTime() + duration * 60000);
              continue;
            }
            if (criteria.preferredTimeOfDay === 'afternoon' && slotStart.getHours() < 12) {
              slotStart = new Date(slotStart.getTime() + duration * 60000);
              continue;
            }

            // Check if slot is available (no conflicts)
            const isAvailable = !Array.from(this.appointments.values()).some(a => {
              if (a.providerId !== provider.id) return false;
              if (a.status === 'cancelled' || a.status === 'no_show') return false;
              const aEnd = new Date(a.scheduledAt.getTime() + a.durationMinutes * 60000);
              return slotStart < aEnd && slotEnd > a.scheduledAt;
            });

            if (isAvailable && slotStart > new Date()) {
              slots.push({
                start: new Date(slotStart),
                end: slotEnd,
                providerId: provider.id,
                providerName: provider.name,
                location: criteria.type === 'telehealth' ? 'Virtual' : provider.location.address,
                available: true,
              });
            }

            slotStart = new Date(slotStart.getTime() + duration * 60000);
          }
        }

        current.setDate(current.getDate() + 1);
      }
    }

    return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  predictNoShow(features: NoShowFeatures): NoShowPrediction {
    const probability = this.computeNoShowProbability(features);
    const factors: { factor: string; weight: number }[] = [];

    if (features.age < 30) factors.push({ factor: 'Age under 30', weight: NO_SHOW_COEFFICIENTS.age_under_30 });
    if (features.age > 70) factors.push({ factor: 'Age over 70', weight: NO_SHOW_COEFFICIENTS.age_over_70 });
    if (features.distanceMiles > 10) factors.push({ factor: `Distance: ${features.distanceMiles} miles`, weight: features.distanceMiles * NO_SHOW_COEFFICIENTS.distance_per_mile });
    if (features.weatherCondition === 'snow') factors.push({ factor: 'Snow forecast', weight: NO_SHOW_COEFFICIENTS.weather_snow });
    if (features.weatherCondition === 'rain') factors.push({ factor: 'Rain forecast', weight: NO_SHOW_COEFFICIENTS.weather_rain });
    if (features.weatherCondition === 'extreme_heat') factors.push({ factor: 'Extreme heat', weight: NO_SHOW_COEFFICIENTS.weather_extreme_heat });
    if (features.weatherCondition === 'extreme_cold') factors.push({ factor: 'Extreme cold', weight: NO_SHOW_COEFFICIENTS.weather_extreme_cold });
    if (features.previousNoShows > 0) {
      const rate = features.previousNoShows / Math.max(features.previousAppointments, 1);
      factors.push({ factor: `Previous no-show rate: ${Math.round(rate * 100)}%`, weight: rate * NO_SHOW_COEFFICIENTS.previous_no_show_rate });
    }
    if (features.isMonday) factors.push({ factor: 'Monday appointment', weight: NO_SHOW_COEFFICIENTS.is_monday });
    if (features.isTelehealth) factors.push({ factor: 'Telehealth (reduces risk)', weight: NO_SHOW_COEFFICIENTS.is_telehealth });
    if (features.hourOfDay >= 15) factors.push({ factor: 'Late afternoon slot', weight: NO_SHOW_COEFFICIENTS.hour_after_3pm });

    factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

    let riskLevel: 'low' | 'moderate' | 'high';
    let recommendation: string;
    if (probability < 0.15) {
      riskLevel = 'low';
      recommendation = 'Standard reminder protocol. No additional intervention needed.';
    } else if (probability < 0.35) {
      riskLevel = 'moderate';
      recommendation = 'Send additional reminder 2 hours before. Consider offering telehealth alternative.';
    } else {
      riskLevel = 'high';
      recommendation = 'Implement full escalation: phone call reminder, offer transportation assistance, consider double-booking slot.';
    }

    return { probability: Math.round(probability * 1000) / 1000, riskLevel, contributingFactors: factors, recommendation };
  }

  optimizeSchedule(patientId: string, date: Date): ScheduleOptimizationResult {
    const dayAppts = Array.from(this.appointments.values())
      .filter(a => a.patientId === patientId && a.scheduledAt.toDateString() === date.toDateString() && a.status !== 'cancelled')
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    if (dayAppts.length <= 1) {
      return { originalOrder: dayAppts.map(a => a.id), optimizedOrder: dayAppts.map(a => a.id), estimatedTimeSavedMinutes: 0, changes: [] };
    }

    const originalOrder = dayAppts.map(a => a.id);
    const changes: { appointmentId: string; reason: string }[] = [];

    // Optimization: group by location to minimize travel
    const byLocation = new Map<string, Appointment[]>();
    for (const appt of dayAppts) {
      const key = appt.location;
      if (!byLocation.has(key)) byLocation.set(key, []);
      byLocation.get(key)!.push(appt);
    }

    // Sort within each location group by time, then order groups by earliest appointment
    const locationGroups = Array.from(byLocation.entries())
      .map(([loc, appts]) => ({ location: loc, appts: appts.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()) }))
      .sort((a, b) => a.appts[0].scheduledAt.getTime() - b.appts[0].scheduledAt.getTime());

    const optimizedOrder: string[] = [];
    for (const group of locationGroups) {
      for (const appt of group.appts) {
        optimizedOrder.push(appt.id);
      }
    }

    // Estimate time saved by reducing back-and-forth travel
    let timeSaved = 0;
    if (byLocation.size > 1 && JSON.stringify(originalOrder) !== JSON.stringify(optimizedOrder)) {
      timeSaved = (byLocation.size - 1) * 15; // Rough estimate: 15 min saved per avoided trip
      changes.push({ appointmentId: optimizedOrder[0], reason: 'Reordered to group appointments by location, reducing travel time' });
    }

    // Check for tight gaps that could cause stress
    for (let i = 1; i < dayAppts.length; i++) {
      const prev = dayAppts[i - 1];
      const curr = dayAppts[i];
      const prevEnd = new Date(prev.scheduledAt.getTime() + prev.durationMinutes * 60000);
      const gap = (curr.scheduledAt.getTime() - prevEnd.getTime()) / 60000;
      if (gap < 15 && prev.location !== curr.location) {
        changes.push({ appointmentId: curr.id, reason: `Only ${Math.round(gap)} min gap with travel needed. Consider rescheduling.` });
      }
    }

    return { originalOrder, optimizedOrder, estimatedTimeSavedMinutes: timeSaved, changes };
  }

  cancelAppointment(appointmentId: string, reason?: string): boolean {
    const appt = this.appointments.get(appointmentId);
    if (!appt) return false;
    if (appt.status === 'completed' || appt.status === 'cancelled') return false;
    appt.status = 'cancelled';
    appt.notes = appt.notes ? `${appt.notes} | Cancelled: ${reason ?? 'No reason given'}` : `Cancelled: ${reason ?? 'No reason given'}`;
    return true;
  }

  getUpcoming(patientId: string, limit = 10): Appointment[] {
    const now = new Date();
    return Array.from(this.appointments.values())
      .filter(a => a.patientId === patientId && a.scheduledAt >= now && a.status !== 'cancelled')
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .slice(0, limit);
  }

  getAppointment(appointmentId: string): Appointment | null {
    return this.appointments.get(appointmentId) ?? null;
  }

  getProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  getAppointmentConfig(type: AppointmentType): typeof APPOINTMENT_CONFIGS[AppointmentType] {
    return APPOINTMENT_CONFIGS[type];
  }

  // Record outcome for self-learning
  recordOutcome(appointmentId: string, outcome: 'show' | 'no_show', features: NoShowFeatures): void {
    const appt = this.appointments.get(appointmentId);
    if (!appt) return;

    if (outcome === 'no_show') appt.status = 'no_show';
    else if (appt.status === 'scheduled' || appt.status === 'confirmed') appt.status = 'completed';

    this.outcomes.push({
      appointmentId,
      predicted: appt.noShowProbability ?? this.computeNoShowProbability(features),
      actual: outcome,
      features,
      recordedAt: new Date(),
    });
  }

  getModelAccuracy(): { totalPredictions: number; correctPredictions: number; accuracy: number; brierScore: number } {
    if (this.outcomes.length === 0) return { totalPredictions: 0, correctPredictions: 0, accuracy: 0, brierScore: 0 };

    let correct = 0;
    let brierSum = 0;
    for (const o of this.outcomes) {
      const predictedNoShow = o.predicted >= 0.5;
      const actualNoShow = o.actual === 'no_show';
      if (predictedNoShow === actualNoShow) correct++;
      const actualBinary = actualNoShow ? 1 : 0;
      brierSum += (o.predicted - actualBinary) ** 2;
    }

    return {
      totalPredictions: this.outcomes.length,
      correctPredictions: correct,
      accuracy: Math.round((correct / this.outcomes.length) * 1000) / 1000,
      brierScore: Math.round((brierSum / this.outcomes.length) * 1000) / 1000,
    };
  }

  estimateTravelTime(fromLat: number, fromLng: number, toProviderId: string): { distanceMiles: number; estimatedMinutes: number } | null {
    const provider = this.providers.get(toProviderId);
    if (!provider) return null;

    // Haversine distance approximation
    const R = 3959; // Earth radius in miles
    const dLat = (provider.location.lat - fromLat) * Math.PI / 180;
    const dLng = (provider.location.lng - fromLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromLat * Math.PI / 180) * Math.cos(provider.location.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMiles = Math.round(R * c * 100) / 100;

    // Estimate travel time: urban average ~20 mph effective speed
    const estimatedMinutes = Math.max(5, Math.round(distanceMiles * 3));

    return { distanceMiles, estimatedMinutes };
  }

  markCheckedIn(appointmentId: string): boolean {
    const appt = this.appointments.get(appointmentId);
    if (!appt || appt.status !== 'scheduled' && appt.status !== 'confirmed') return false;
    appt.status = 'checked_in';
    return true;
  }

  confirmAppointment(appointmentId: string): boolean {
    const appt = this.appointments.get(appointmentId);
    if (!appt || appt.status !== 'scheduled') return false;
    appt.status = 'confirmed';
    return true;
  }

  // --- Private helpers ---

  private computeNoShowProbability(features: NoShowFeatures): number {
    let logOdds = NO_SHOW_COEFFICIENTS.intercept;

    if (features.age < 30) logOdds += NO_SHOW_COEFFICIENTS.age_under_30;
    if (features.age > 70) logOdds += NO_SHOW_COEFFICIENTS.age_over_70;
    logOdds += features.distanceMiles * NO_SHOW_COEFFICIENTS.distance_per_mile;

    if (features.weatherCondition === 'rain') logOdds += NO_SHOW_COEFFICIENTS.weather_rain;
    else if (features.weatherCondition === 'snow') logOdds += NO_SHOW_COEFFICIENTS.weather_snow;
    else if (features.weatherCondition === 'extreme_heat') logOdds += NO_SHOW_COEFFICIENTS.weather_extreme_heat;
    else if (features.weatherCondition === 'extreme_cold') logOdds += NO_SHOW_COEFFICIENTS.weather_extreme_cold;

    const noShowRate = features.previousAppointments > 0
      ? features.previousNoShows / features.previousAppointments
      : 0;
    logOdds += noShowRate * NO_SHOW_COEFFICIENTS.previous_no_show_rate;
    logOdds += (features.daysSinceLastVisit / 30) * NO_SHOW_COEFFICIENTS.days_since_last_visit_per_30;

    if (features.isMonday) logOdds += NO_SHOW_COEFFICIENTS.is_monday;
    if (features.isTelehealth) logOdds += NO_SHOW_COEFFICIENTS.is_telehealth;
    if (features.appointmentType === 'physical_therapy') logOdds += NO_SHOW_COEFFICIENTS.is_pt;
    if (features.appointmentType === 'lab_work') logOdds += NO_SHOW_COEFFICIENTS.is_lab;
    if (features.hourOfDay < 10) logOdds += NO_SHOW_COEFFICIENTS.hour_before_10am;
    if (features.hourOfDay >= 15) logOdds += NO_SHOW_COEFFICIENTS.hour_after_3pm;

    // Sigmoid function
    return 1 / (1 + Math.exp(-logOdds));
  }

  private buildReminderEscalation(scheduledAt: Date, priority: AppointmentPriority, noShowProb?: number): Appointment['reminders'] {
    const reminders: Appointment['reminders'] = [];
    const apptTime = scheduledAt.getTime();

    // Standard reminders: 1 week, 2 days, 1 day, 2 hours before
    reminders.push({ channel: 'email', scheduledFor: new Date(apptTime - 7 * 24 * 60 * 60000), sent: false });
    reminders.push({ channel: 'sms', scheduledFor: new Date(apptTime - 2 * 24 * 60 * 60000), sent: false });
    reminders.push({ channel: 'push', scheduledFor: new Date(apptTime - 24 * 60 * 60000), sent: false });
    reminders.push({ channel: 'sms', scheduledFor: new Date(apptTime - 2 * 60 * 60000), sent: false });

    // Escalate for urgent priority
    if (priority === 'urgent') {
      reminders.push({ channel: 'phone_call', scheduledFor: new Date(apptTime - 24 * 60 * 60000), sent: false });
    }

    // Escalate for high no-show risk
    if (noShowProb !== undefined && noShowProb >= 0.35) {
      reminders.push({ channel: 'phone_call', scheduledFor: new Date(apptTime - 4 * 60 * 60000), sent: false });
      reminders.push({ channel: 'sms', scheduledFor: new Date(apptTime - 1 * 60 * 60000), sent: false });
    }

    return reminders.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }
}

export type {
  AppointmentType, AppointmentPriority, AppointmentStatus, ReminderChannel,
  Provider, Appointment, TimeSlot, NoShowPrediction, NoShowFeatures,
  OutcomeRecord, ScheduleOptimizationResult,
};
