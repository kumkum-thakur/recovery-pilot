// Recovery Milestone Tracker - Evidence-based milestone tracking for post-surgical recovery

export type SurgeryType =
  | 'knee_replacement' | 'hip_replacement' | 'cardiac_bypass' | 'appendectomy'
  | 'cesarean' | 'shoulder_arthroscopy' | 'spinal_fusion' | 'hernia_repair'
  | 'colectomy' | 'cholecystectomy';

export type MilestoneCategory =
  | 'mobility' | 'wound_healing' | 'pain_management'
  | 'functional_independence' | 'return_to_work';

export type DeviationStatus = 'ahead' | 'on_track' | 'behind' | 'significantly_behind';

export interface Milestone {
  id: string;
  surgeryType: SurgeryType;
  category: MilestoneCategory;
  description: string;
  expectedDayPostOp: number;
  toleranceDays: number; // +/- acceptable range
  weight: number; // importance 0-1
  prerequisites: string[];
}

export interface PatientFactors {
  age: number;
  bmi: number;
  comorbidities: string[];
  smokingStatus: 'never' | 'former' | 'current';
  activityLevelPreOp: 'sedentary' | 'light' | 'moderate' | 'active';
}

export interface ProgressEntry {
  patientId: string;
  milestoneId: string;
  achievedDay: number | null;
  status: 'not_started' | 'in_progress' | 'achieved' | 'skipped';
  notes: string;
  timestamp: number;
}

export interface DeviationReport {
  milestoneId: string;
  description: string;
  expectedDay: number;
  personalizedDay: number;
  actualDay: number | null;
  currentDayPostOp: number;
  status: DeviationStatus;
  deviationDays: number;
  recommendation: string;
}

export interface ComparativeAnalysis {
  patientId: string;
  surgeryType: SurgeryType;
  overallProgressPct: number;
  categoryBreakdown: Record<MilestoneCategory, number>;
  cohortPercentile: number;
  aheadCount: number;
  behindCount: number;
  onTrackCount: number;
}

interface OutcomeRecord {
  surgeryType: SurgeryType;
  patientFactors: PatientFactors;
  milestoneId: string;
  expectedDay: number;
  actualDay: number;
  timestamp: number;
}

// Evidence-based milestones for each surgery type
const SURGERY_MILESTONES: Milestone[] = [
  // --- Knee Replacement ---
  { id: 'kr-mob-1', surgeryType: 'knee_replacement', category: 'mobility', description: 'Dangle legs at bedside', expectedDayPostOp: 0, toleranceDays: 1, weight: 0.6, prerequisites: [] },
  { id: 'kr-mob-2', surgeryType: 'knee_replacement', category: 'mobility', description: 'Stand with walker assistance', expectedDayPostOp: 1, toleranceDays: 1, weight: 0.7, prerequisites: ['kr-mob-1'] },
  { id: 'kr-mob-3', surgeryType: 'knee_replacement', category: 'mobility', description: 'Walk 50 feet with walker', expectedDayPostOp: 2, toleranceDays: 2, weight: 0.8, prerequisites: ['kr-mob-2'] },
  { id: 'kr-mob-4', surgeryType: 'knee_replacement', category: 'mobility', description: 'Achieve 90-degree knee flexion', expectedDayPostOp: 14, toleranceDays: 5, weight: 0.9, prerequisites: ['kr-mob-3'] },
  { id: 'kr-mob-5', surgeryType: 'knee_replacement', category: 'mobility', description: 'Walk without assistive device', expectedDayPostOp: 42, toleranceDays: 14, weight: 1.0, prerequisites: ['kr-mob-4'] },
  { id: 'kr-wh-1', surgeryType: 'knee_replacement', category: 'wound_healing', description: 'Staple/suture removal', expectedDayPostOp: 14, toleranceDays: 3, weight: 0.7, prerequisites: [] },
  { id: 'kr-wh-2', surgeryType: 'knee_replacement', category: 'wound_healing', description: 'Incision fully closed, no drainage', expectedDayPostOp: 21, toleranceDays: 7, weight: 0.8, prerequisites: ['kr-wh-1'] },
  { id: 'kr-pm-1', surgeryType: 'knee_replacement', category: 'pain_management', description: 'Transition from IV to oral analgesics', expectedDayPostOp: 1, toleranceDays: 1, weight: 0.6, prerequisites: [] },
  { id: 'kr-pm-2', surgeryType: 'knee_replacement', category: 'pain_management', description: 'Pain at rest below 4/10', expectedDayPostOp: 7, toleranceDays: 3, weight: 0.8, prerequisites: [] },
  { id: 'kr-fi-1', surgeryType: 'knee_replacement', category: 'functional_independence', description: 'Independent toileting', expectedDayPostOp: 3, toleranceDays: 2, weight: 0.8, prerequisites: ['kr-mob-2'] },
  { id: 'kr-fi-2', surgeryType: 'knee_replacement', category: 'functional_independence', description: 'Climb stairs independently', expectedDayPostOp: 30, toleranceDays: 10, weight: 0.9, prerequisites: ['kr-mob-4'] },
  { id: 'kr-rw-1', surgeryType: 'knee_replacement', category: 'return_to_work', description: 'Return to sedentary work', expectedDayPostOp: 28, toleranceDays: 14, weight: 0.7, prerequisites: [] },
  { id: 'kr-rw-2', surgeryType: 'knee_replacement', category: 'return_to_work', description: 'Return to active work', expectedDayPostOp: 90, toleranceDays: 30, weight: 1.0, prerequisites: ['kr-mob-5'] },

  // --- Hip Replacement ---
  { id: 'hr-mob-1', surgeryType: 'hip_replacement', category: 'mobility', description: 'Stand with physical therapist', expectedDayPostOp: 0, toleranceDays: 1, weight: 0.7, prerequisites: [] },
  { id: 'hr-mob-2', surgeryType: 'hip_replacement', category: 'mobility', description: 'Walk 100 feet with walker', expectedDayPostOp: 1, toleranceDays: 1, weight: 0.8, prerequisites: ['hr-mob-1'] },
  { id: 'hr-mob-3', surgeryType: 'hip_replacement', category: 'mobility', description: 'Transition to cane', expectedDayPostOp: 21, toleranceDays: 7, weight: 0.9, prerequisites: ['hr-mob-2'] },
  { id: 'hr-mob-4', surgeryType: 'hip_replacement', category: 'mobility', description: 'Walk without assistive device', expectedDayPostOp: 42, toleranceDays: 14, weight: 1.0, prerequisites: ['hr-mob-3'] },
  { id: 'hr-wh-1', surgeryType: 'hip_replacement', category: 'wound_healing', description: 'Wound check - no signs of infection', expectedDayPostOp: 7, toleranceDays: 2, weight: 0.8, prerequisites: [] },
  { id: 'hr-pm-1', surgeryType: 'hip_replacement', category: 'pain_management', description: 'Pain controlled with oral medications', expectedDayPostOp: 2, toleranceDays: 1, weight: 0.7, prerequisites: [] },
  { id: 'hr-fi-1', surgeryType: 'hip_replacement', category: 'functional_independence', description: 'Independent dressing (lower body)', expectedDayPostOp: 14, toleranceDays: 7, weight: 0.8, prerequisites: [] },
  { id: 'hr-rw-1', surgeryType: 'hip_replacement', category: 'return_to_work', description: 'Return to desk work', expectedDayPostOp: 28, toleranceDays: 14, weight: 0.8, prerequisites: [] },

  // --- Cardiac Bypass ---
  { id: 'cb-mob-1', surgeryType: 'cardiac_bypass', category: 'mobility', description: 'Sit upright in chair', expectedDayPostOp: 1, toleranceDays: 1, weight: 0.7, prerequisites: [] },
  { id: 'cb-mob-2', surgeryType: 'cardiac_bypass', category: 'mobility', description: 'Walk in hallway with assistance', expectedDayPostOp: 2, toleranceDays: 1, weight: 0.8, prerequisites: ['cb-mob-1'] },
  { id: 'cb-mob-3', surgeryType: 'cardiac_bypass', category: 'mobility', description: 'Walk 500 feet unassisted', expectedDayPostOp: 5, toleranceDays: 2, weight: 0.9, prerequisites: ['cb-mob-2'] },
  { id: 'cb-wh-1', surgeryType: 'cardiac_bypass', category: 'wound_healing', description: 'Sternal wound stable, no crepitus', expectedDayPostOp: 7, toleranceDays: 3, weight: 0.9, prerequisites: [] },
  { id: 'cb-wh-2', surgeryType: 'cardiac_bypass', category: 'wound_healing', description: 'Sternum healed (no sternal precautions)', expectedDayPostOp: 56, toleranceDays: 14, weight: 1.0, prerequisites: ['cb-wh-1'] },
  { id: 'cb-pm-1', surgeryType: 'cardiac_bypass', category: 'pain_management', description: 'Adequate pain control for deep breathing', expectedDayPostOp: 3, toleranceDays: 2, weight: 0.8, prerequisites: [] },
  { id: 'cb-fi-1', surgeryType: 'cardiac_bypass', category: 'functional_independence', description: 'Shower independently', expectedDayPostOp: 7, toleranceDays: 3, weight: 0.7, prerequisites: [] },
  { id: 'cb-rw-1', surgeryType: 'cardiac_bypass', category: 'return_to_work', description: 'Return to sedentary work', expectedDayPostOp: 42, toleranceDays: 14, weight: 0.8, prerequisites: [] },
  { id: 'cb-rw-2', surgeryType: 'cardiac_bypass', category: 'return_to_work', description: 'Begin cardiac rehab phase II', expectedDayPostOp: 14, toleranceDays: 7, weight: 0.9, prerequisites: ['cb-mob-3'] },

  // --- Appendectomy (laparoscopic) ---
  { id: 'ap-mob-1', surgeryType: 'appendectomy', category: 'mobility', description: 'Ambulate same day', expectedDayPostOp: 0, toleranceDays: 1, weight: 0.8, prerequisites: [] },
  { id: 'ap-wh-1', surgeryType: 'appendectomy', category: 'wound_healing', description: 'Port sites clean and dry', expectedDayPostOp: 3, toleranceDays: 2, weight: 0.7, prerequisites: [] },
  { id: 'ap-pm-1', surgeryType: 'appendectomy', category: 'pain_management', description: 'Pain managed with OTC medications', expectedDayPostOp: 3, toleranceDays: 2, weight: 0.8, prerequisites: [] },
  { id: 'ap-fi-1', surgeryType: 'appendectomy', category: 'functional_independence', description: 'Resume all ADLs', expectedDayPostOp: 5, toleranceDays: 3, weight: 0.9, prerequisites: ['ap-mob-1'] },
  { id: 'ap-rw-1', surgeryType: 'appendectomy', category: 'return_to_work', description: 'Return to work', expectedDayPostOp: 7, toleranceDays: 5, weight: 1.0, prerequisites: ['ap-fi-1'] },

  // --- Cesarean Section ---
  { id: 'cs-mob-1', surgeryType: 'cesarean', category: 'mobility', description: 'Walk to bathroom with support', expectedDayPostOp: 1, toleranceDays: 1, weight: 0.7, prerequisites: [] },
  { id: 'cs-mob-2', surgeryType: 'cesarean', category: 'mobility', description: 'Walk hallway independently', expectedDayPostOp: 2, toleranceDays: 1, weight: 0.8, prerequisites: ['cs-mob-1'] },
  { id: 'cs-wh-1', surgeryType: 'cesarean', category: 'wound_healing', description: 'Incision approximated, no erythema', expectedDayPostOp: 7, toleranceDays: 3, weight: 0.8, prerequisites: [] },
  { id: 'cs-pm-1', surgeryType: 'cesarean', category: 'pain_management', description: 'Transition to ibuprofen/acetaminophen only', expectedDayPostOp: 4, toleranceDays: 2, weight: 0.7, prerequisites: [] },
  { id: 'cs-fi-1', surgeryType: 'cesarean', category: 'functional_independence', description: 'Lift and care for infant independently', expectedDayPostOp: 7, toleranceDays: 3, weight: 0.9, prerequisites: ['cs-mob-2'] },
  { id: 'cs-rw-1', surgeryType: 'cesarean', category: 'return_to_work', description: 'Cleared for return to work', expectedDayPostOp: 42, toleranceDays: 14, weight: 1.0, prerequisites: [] },

  // --- Shoulder Arthroscopy ---
  { id: 'sa-mob-1', surgeryType: 'shoulder_arthroscopy', category: 'mobility', description: 'Begin pendulum exercises', expectedDayPostOp: 3, toleranceDays: 2, weight: 0.7, prerequisites: [] },
  { id: 'sa-mob-2', surgeryType: 'shoulder_arthroscopy', category: 'mobility', description: 'Active-assisted ROM initiated', expectedDayPostOp: 21, toleranceDays: 7, weight: 0.8, prerequisites: ['sa-mob-1'] },
  { id: 'sa-mob-3', surgeryType: 'shoulder_arthroscopy', category: 'mobility', description: 'Full active ROM achieved', expectedDayPostOp: 84, toleranceDays: 21, weight: 1.0, prerequisites: ['sa-mob-2'] },
  { id: 'sa-pm-1', surgeryType: 'shoulder_arthroscopy', category: 'pain_management', description: 'Discontinue sling at rest', expectedDayPostOp: 28, toleranceDays: 7, weight: 0.8, prerequisites: [] },
  { id: 'sa-rw-1', surgeryType: 'shoulder_arthroscopy', category: 'return_to_work', description: 'Return to desk work', expectedDayPostOp: 7, toleranceDays: 5, weight: 0.7, prerequisites: [] },

  // --- Spinal Fusion ---
  { id: 'sf-mob-1', surgeryType: 'spinal_fusion', category: 'mobility', description: 'Log roll and sit at bedside', expectedDayPostOp: 1, toleranceDays: 1, weight: 0.7, prerequisites: [] },
  { id: 'sf-mob-2', surgeryType: 'spinal_fusion', category: 'mobility', description: 'Walk 200 feet with walker', expectedDayPostOp: 3, toleranceDays: 2, weight: 0.8, prerequisites: ['sf-mob-1'] },
  { id: 'sf-mob-3', surgeryType: 'spinal_fusion', category: 'mobility', description: 'Walk without brace', expectedDayPostOp: 84, toleranceDays: 28, weight: 1.0, prerequisites: ['sf-mob-2'] },
  { id: 'sf-wh-1', surgeryType: 'spinal_fusion', category: 'wound_healing', description: 'Incision healed, sutures removed', expectedDayPostOp: 14, toleranceDays: 5, weight: 0.8, prerequisites: [] },
  { id: 'sf-pm-1', surgeryType: 'spinal_fusion', category: 'pain_management', description: 'Weaned off opioids', expectedDayPostOp: 28, toleranceDays: 14, weight: 0.9, prerequisites: [] },
  { id: 'sf-rw-1', surgeryType: 'spinal_fusion', category: 'return_to_work', description: 'Return to sedentary work', expectedDayPostOp: 42, toleranceDays: 14, weight: 0.8, prerequisites: [] },

  // --- Hernia Repair (laparoscopic) ---
  { id: 'he-mob-1', surgeryType: 'hernia_repair', category: 'mobility', description: 'Walk same day', expectedDayPostOp: 0, toleranceDays: 1, weight: 0.8, prerequisites: [] },
  { id: 'he-wh-1', surgeryType: 'hernia_repair', category: 'wound_healing', description: 'Port sites healed', expectedDayPostOp: 7, toleranceDays: 3, weight: 0.7, prerequisites: [] },
  { id: 'he-pm-1', surgeryType: 'hernia_repair', category: 'pain_management', description: 'Pain below 3/10 at rest', expectedDayPostOp: 5, toleranceDays: 3, weight: 0.8, prerequisites: [] },
  { id: 'he-fi-1', surgeryType: 'hernia_repair', category: 'functional_independence', description: 'Lift 10 lbs without pain', expectedDayPostOp: 21, toleranceDays: 7, weight: 0.9, prerequisites: ['he-mob-1'] },
  { id: 'he-rw-1', surgeryType: 'hernia_repair', category: 'return_to_work', description: 'Return to light work', expectedDayPostOp: 7, toleranceDays: 5, weight: 0.8, prerequisites: [] },
  { id: 'he-rw-2', surgeryType: 'hernia_repair', category: 'return_to_work', description: 'Return to heavy lifting', expectedDayPostOp: 42, toleranceDays: 14, weight: 1.0, prerequisites: ['he-fi-1'] },

  // --- Colectomy (laparoscopic) ---
  { id: 'co-mob-1', surgeryType: 'colectomy', category: 'mobility', description: 'Ambulate in hallway', expectedDayPostOp: 1, toleranceDays: 1, weight: 0.7, prerequisites: [] },
  { id: 'co-wh-1', surgeryType: 'colectomy', category: 'wound_healing', description: 'Tolerating regular diet', expectedDayPostOp: 4, toleranceDays: 2, weight: 0.9, prerequisites: [] },
  { id: 'co-wh-2', surgeryType: 'colectomy', category: 'wound_healing', description: 'Return of normal bowel function', expectedDayPostOp: 3, toleranceDays: 2, weight: 0.8, prerequisites: [] },
  { id: 'co-pm-1', surgeryType: 'colectomy', category: 'pain_management', description: 'Oral pain control adequate', expectedDayPostOp: 3, toleranceDays: 2, weight: 0.7, prerequisites: [] },
  { id: 'co-rw-1', surgeryType: 'colectomy', category: 'return_to_work', description: 'Return to normal activities', expectedDayPostOp: 28, toleranceDays: 14, weight: 1.0, prerequisites: ['co-mob-1', 'co-wh-1'] },

  // --- Cholecystectomy (laparoscopic) ---
  { id: 'ch-mob-1', surgeryType: 'cholecystectomy', category: 'mobility', description: 'Walk same day of surgery', expectedDayPostOp: 0, toleranceDays: 1, weight: 0.8, prerequisites: [] },
  { id: 'ch-wh-1', surgeryType: 'cholecystectomy', category: 'wound_healing', description: 'Port sites clean, steri-strips off', expectedDayPostOp: 7, toleranceDays: 3, weight: 0.7, prerequisites: [] },
  { id: 'ch-pm-1', surgeryType: 'cholecystectomy', category: 'pain_management', description: 'Pain managed with OTC meds', expectedDayPostOp: 2, toleranceDays: 2, weight: 0.8, prerequisites: [] },
  { id: 'ch-fi-1', surgeryType: 'cholecystectomy', category: 'functional_independence', description: 'Tolerate normal diet without GI distress', expectedDayPostOp: 7, toleranceDays: 5, weight: 0.9, prerequisites: [] },
  { id: 'ch-rw-1', surgeryType: 'cholecystectomy', category: 'return_to_work', description: 'Return to work', expectedDayPostOp: 7, toleranceDays: 5, weight: 1.0, prerequisites: ['ch-fi-1'] },
];

// Adjustment multipliers per comorbidity
const COMORBIDITY_MULTIPLIERS: Record<string, number> = {
  diabetes: 1.25,
  obesity: 1.20,
  copd: 1.30,
  heart_failure: 1.35,
  chronic_kidney_disease: 1.20,
  rheumatoid_arthritis: 1.15,
  depression: 1.10,
  peripheral_vascular_disease: 1.25,
  osteoporosis: 1.15,
  anemia: 1.10,
};

export class RecoveryMilestoneTracker {
  private progressEntries: Map<string, ProgressEntry[]> = new Map();
  private outcomeHistory: OutcomeRecord[] = [];
  private learnedAdjustments: Map<string, number> = new Map();

  getMilestones(surgeryType: SurgeryType, category?: MilestoneCategory): Milestone[] {
    return SURGERY_MILESTONES.filter(
      (m) => m.surgeryType === surgeryType && (!category || m.category === category)
    );
  }

  trackProgress(
    patientId: string,
    milestoneId: string,
    status: ProgressEntry['status'],
    dayPostOp: number,
    notes: string = ''
  ): ProgressEntry {
    const entry: ProgressEntry = {
      patientId,
      milestoneId,
      achievedDay: status === 'achieved' ? dayPostOp : null,
      status,
      notes,
      timestamp: Date.now(),
    };
    const existing = this.progressEntries.get(patientId) || [];
    const idx = existing.findIndex((e) => e.milestoneId === milestoneId);
    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }
    this.progressEntries.set(patientId, existing);
    return entry;
  }

  assessDeviation(
    patientId: string,
    surgeryType: SurgeryType,
    currentDayPostOp: number,
    patientFactors?: PatientFactors
  ): DeviationReport[] {
    const milestones = this.getMilestones(surgeryType);
    const progress = this.progressEntries.get(patientId) || [];

    return milestones.map((m) => {
      const personalizedDay = patientFactors
        ? this.adjustDay(m.expectedDayPostOp, m.id, patientFactors)
        : m.expectedDayPostOp;
      const entry = progress.find((p) => p.milestoneId === m.id);
      const actualDay = entry?.achievedDay ?? null;

      let status: DeviationStatus;
      let deviationDays: number;

      if (actualDay !== null) {
        deviationDays = actualDay - personalizedDay;
        if (deviationDays < -m.toleranceDays) status = 'ahead';
        else if (deviationDays <= m.toleranceDays) status = 'on_track';
        else if (deviationDays <= m.toleranceDays * 2) status = 'behind';
        else status = 'significantly_behind';
      } else if (entry?.status === 'achieved') {
        deviationDays = 0;
        status = 'on_track';
      } else {
        deviationDays = currentDayPostOp - personalizedDay;
        if (deviationDays < 0) status = 'on_track';
        else if (deviationDays <= m.toleranceDays) status = 'on_track';
        else if (deviationDays <= m.toleranceDays * 2) status = 'behind';
        else status = 'significantly_behind';
      }

      const recommendation = this.generateRecommendation(status, m, deviationDays);

      return {
        milestoneId: m.id,
        description: m.description,
        expectedDay: m.expectedDayPostOp,
        personalizedDay: Math.round(personalizedDay),
        actualDay,
        currentDayPostOp,
        status,
        deviationDays: Math.round(deviationDays),
        recommendation,
      };
    });
  }

  personalizeTimeline(
    surgeryType: SurgeryType,
    patientFactors: PatientFactors
  ): Array<Milestone & { personalizedDay: number }> {
    const milestones = this.getMilestones(surgeryType);
    return milestones.map((m) => ({
      ...m,
      personalizedDay: Math.round(this.adjustDay(m.expectedDayPostOp, m.id, patientFactors)),
    }));
  }

  getComparativeAnalysis(
    patientId: string,
    surgeryType: SurgeryType,
    currentDayPostOp: number
  ): ComparativeAnalysis {
    const milestones = this.getMilestones(surgeryType);
    const progress = this.progressEntries.get(patientId) || [];
    const categories: MilestoneCategory[] = [
      'mobility', 'wound_healing', 'pain_management', 'functional_independence', 'return_to_work',
    ];

    let totalWeight = 0;
    let achievedWeight = 0;
    let aheadCount = 0;
    let behindCount = 0;
    let onTrackCount = 0;

    const categoryWeight: Record<string, number> = {};
    const categoryAchieved: Record<string, number> = {};

    for (const m of milestones) {
      if (m.expectedDayPostOp > currentDayPostOp + m.toleranceDays) continue;
      totalWeight += m.weight;
      categoryWeight[m.category] = (categoryWeight[m.category] || 0) + m.weight;
      const entry = progress.find((p) => p.milestoneId === m.id);
      if (entry?.status === 'achieved') {
        achievedWeight += m.weight;
        categoryAchieved[m.category] = (categoryAchieved[m.category] || 0) + m.weight;
        const deviation = (entry.achievedDay ?? m.expectedDayPostOp) - m.expectedDayPostOp;
        if (deviation < -m.toleranceDays) aheadCount++;
        else if (deviation <= m.toleranceDays) onTrackCount++;
        else behindCount++;
      }
    }

    const overallProgressPct = totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;
    const categoryBreakdown = {} as Record<MilestoneCategory, number>;
    for (const cat of categories) {
      categoryBreakdown[cat] = categoryWeight[cat]
        ? ((categoryAchieved[cat] || 0) / categoryWeight[cat]) * 100
        : 0;
    }

    // Simulate cohort percentile using progress ratio
    const cohortPercentile = Math.min(99, Math.max(1, Math.round(overallProgressPct * 1.1)));

    return {
      patientId,
      surgeryType,
      overallProgressPct: Math.round(overallProgressPct * 10) / 10,
      categoryBreakdown,
      cohortPercentile,
      aheadCount,
      behindCount,
      onTrackCount,
    };
  }

  recordOutcome(
    surgeryType: SurgeryType,
    patientFactors: PatientFactors,
    milestoneId: string,
    actualDay: number
  ): void {
    const milestone = SURGERY_MILESTONES.find((m) => m.id === milestoneId);
    if (!milestone) return;

    this.outcomeHistory.push({
      surgeryType,
      patientFactors,
      milestoneId,
      expectedDay: milestone.expectedDayPostOp,
      actualDay,
      timestamp: Date.now(),
    });

    // Self-learning: update adjustment factor using exponential moving average
    const key = `${milestoneId}_${this.factorsKey(patientFactors)}`;
    const ratio = actualDay / Math.max(milestone.expectedDayPostOp, 1);
    const prev = this.learnedAdjustments.get(key) ?? ratio;
    const alpha = 0.3;
    this.learnedAdjustments.set(key, prev * (1 - alpha) + ratio * alpha);
  }

  // --- Private helpers ---

  private adjustDay(baseDay: number, milestoneId: string, factors: PatientFactors): number {
    // Check learned adjustments first
    const learnedKey = `${milestoneId}_${this.factorsKey(factors)}`;
    const learned = this.learnedAdjustments.get(learnedKey);
    if (learned !== undefined) {
      return baseDay * learned;
    }

    let multiplier = 1.0;

    // Age adjustment: baseline 50, +1% per year above, -0.5% per year below
    if (factors.age > 50) multiplier += (factors.age - 50) * 0.01;
    else if (factors.age < 50) multiplier -= (50 - factors.age) * 0.005;

    // BMI adjustment: baseline 25, +2% per unit above 30
    if (factors.bmi > 30) multiplier += (factors.bmi - 30) * 0.02;

    // Smoking adjustment
    if (factors.smokingStatus === 'current') multiplier *= 1.25;
    else if (factors.smokingStatus === 'former') multiplier *= 1.05;

    // Activity level
    if (factors.activityLevelPreOp === 'active') multiplier *= 0.90;
    else if (factors.activityLevelPreOp === 'sedentary') multiplier *= 1.15;

    // Comorbidities
    for (const c of factors.comorbidities) {
      const cm = COMORBIDITY_MULTIPLIERS[c];
      if (cm) multiplier *= cm;
    }

    return baseDay * Math.max(multiplier, 0.5);
  }

  private factorsKey(f: PatientFactors): string {
    const ageGroup = Math.floor(f.age / 10) * 10;
    const bmiGroup = f.bmi < 25 ? 'normal' : f.bmi < 30 ? 'overweight' : 'obese';
    return `${ageGroup}_${bmiGroup}_${f.smokingStatus}`;
  }

  private generateRecommendation(
    status: DeviationStatus,
    milestone: Milestone,
    deviationDays: number
  ): string {
    switch (status) {
      case 'ahead':
        return `Patient is ${Math.abs(deviationDays)} days ahead on "${milestone.description}". Continue current protocol; avoid overexertion.`;
      case 'on_track':
        return `Patient is on track for "${milestone.description}". Maintain current plan.`;
      case 'behind':
        return `Patient is ${deviationDays} days behind on "${milestone.description}". Consider increasing therapy frequency or reassessing barriers.`;
      case 'significantly_behind':
        return `Patient is significantly behind (${deviationDays} days) on "${milestone.description}". Recommend clinical reassessment and potential plan modification.`;
    }
  }
}

export default RecoveryMilestoneTracker;
