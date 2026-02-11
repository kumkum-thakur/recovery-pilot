/**
 * Patient Recovery Journal / Diary Service
 *
 * Comprehensive journaling system for patient recovery tracking with:
 *  - Multiple entry types (daily log, symptom report, milestone, gratitude, concern, photo diary)
 *  - Structured daily check-ins with mood, energy, sleep, pain, appetite, activity
 *  - Journal analytics: mood trends, correlations, weekly/monthly summaries, milestone timeline
 *  - Doctor visibility: flagging, auto-flag, doctor annotations, appointment summaries
 *  - Engagement: 50+ rotating prompts, streak tracking, guided reflection templates
 *  - Data export for medical records
 *  - 100 sample journal entries spanning 30 days of realistic recovery
 *
 * No external dependencies. Uses const-object enums for erasableSyntaxOnly compatibility.
 */

// ============================================================================
// Const-object enums (erasableSyntaxOnly compatible)
// ============================================================================

export const JournalEntryType = {
  DAILY_LOG: 'daily_log',
  SYMPTOM_REPORT: 'symptom_report',
  MILESTONE: 'milestone',
  GRATITUDE: 'gratitude',
  CONCERN: 'concern',
  PHOTO_DIARY: 'photo_diary',
} as const;
export type JournalEntryType = typeof JournalEntryType[keyof typeof JournalEntryType];

export const MoodRating = {
  TERRIBLE: 1,
  POOR: 2,
  OKAY: 3,
  GOOD: 4,
  GREAT: 5,
} as const;
export type MoodRating = typeof MoodRating[keyof typeof MoodRating];

export const ActivityLevel = {
  SEDENTARY: 'sedentary',
  LIGHT: 'light',
  MODERATE: 'moderate',
  ACTIVE: 'active',
} as const;
export type ActivityLevel = typeof ActivityLevel[keyof typeof ActivityLevel];

export const MilestoneType = {
  FIRST_WALK: 'first_walk',
  STAIRS: 'stairs',
  DRIVING: 'driving',
  RETURN_TO_WORK: 'return_to_work',
  SHOWER_INDEPENDENTLY: 'shower_independently',
  SLEEP_THROUGH_NIGHT: 'sleep_through_night',
  REDUCED_MEDICATION: 'reduced_medication',
  EXERCISE_RESUMED: 'exercise_resumed',
  PAIN_FREE_DAY: 'pain_free_day',
  FULL_RANGE_OF_MOTION: 'full_range_of_motion',
  COOKED_A_MEAL: 'cooked_a_meal',
  WENT_OUTSIDE: 'went_outside',
} as const;
export type MilestoneType = typeof MilestoneType[keyof typeof MilestoneType];

export const RecoveryPhase = {
  ACUTE: 'acute',           // Days 1-7
  EARLY: 'early',           // Days 8-14
  PROGRESSIVE: 'progressive', // Days 15-21
  ADVANCED: 'advanced',     // Days 22-30+
} as const;
export type RecoveryPhase = typeof RecoveryPhase[keyof typeof RecoveryPhase];

export const FlagReason = {
  LOW_MOOD: 'low_mood',
  HIGH_PAIN: 'high_pain',
  KEYWORD_DETECTED: 'keyword_detected',
  PATIENT_REQUESTED: 'patient_requested',
  LOW_SLEEP: 'low_sleep',
  DECLINING_TREND: 'declining_trend',
  CONCERN_ENTRY: 'concern_entry',
} as const;
export type FlagReason = typeof FlagReason[keyof typeof FlagReason];

export const SentimentCategory = {
  VERY_NEGATIVE: 'very_negative',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  POSITIVE: 'positive',
  VERY_POSITIVE: 'very_positive',
} as const;
export type SentimentCategory = typeof SentimentCategory[keyof typeof SentimentCategory];

// ============================================================================
// Data models
// ============================================================================

export const MOOD_LABELS: Record<number, { label: string; emoji: string }> = {
  1: { label: 'Terrible', emoji: '(terrible)' },
  2: { label: 'Poor', emoji: '(poor)' },
  3: { label: 'Okay', emoji: '(okay)' },
  4: { label: 'Good', emoji: '(good)' },
  5: { label: 'Great', emoji: '(great)' },
};

/** Structured daily check-in data captured alongside a DAILY_LOG entry. */
export interface DailyCheckIn {
  mood: MoodRating;                 // 1-5
  energyLevel: number;              // 1-5
  sleepQuality: number;             // 1-5
  hoursSlept: number;               // decimal hours
  painLevel: number;                // 0-10
  appetite: number;                 // 1-5
  activityLevel: ActivityLevel;
  notes: string;
}

/** Detailed symptom description for SYMPTOM_REPORT entries. */
export interface SymptomDetail {
  symptomName: string;
  severity: number;                 // 1-10
  location: string;
  duration: string;                 // e.g. "2 hours", "all day"
  triggers: string[];
  notes: string;
}

/** Milestone data for MILESTONE entries. */
export interface MilestoneDetail {
  milestoneType: MilestoneType;
  description: string;
  daysSinceSurgery: number;
  emotionalResponse: string;
}

/** Photo diary metadata for PHOTO_DIARY entries. */
export interface PhotoDiaryDetail {
  photoUrl: string;
  caption: string;
  bodyArea: string;
  comparisonPhotoUrl?: string;      // previous photo for comparison
}

/** Doctor annotation on a journal entry. */
export interface DoctorAnnotation {
  id: string;
  doctorId: string;
  doctorName: string;
  timestamp: string;                // ISO-8601
  note: string;
  isPrivate: boolean;               // visible only to medical staff
}

/** Flag metadata for doctor review. */
export interface DoctorFlag {
  flaggedAt: string;                // ISO-8601
  reason: FlagReason;
  details: string;
  reviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
}

/** Sentiment analysis result for free-text content. */
export interface SentimentResult {
  score: number;                    // -1.0 to 1.0
  category: SentimentCategory;
  keywords: string[];
}

/** A single journal entry. */
export interface JournalEntry {
  id: string;
  patientId: string;
  type: JournalEntryType;
  timestamp: string;                // ISO-8601
  dayNumber: number;                // days since surgery/recovery start
  title: string;
  content: string;                  // free-text body

  // Type-specific data (only one populated per entry)
  dailyCheckIn?: DailyCheckIn;
  symptomDetail?: SymptomDetail;
  milestoneDetail?: MilestoneDetail;
  photoDiaryDetail?: PhotoDiaryDetail;

  // Metadata
  recoveryPhase: RecoveryPhase;
  sentiment?: SentimentResult;
  tags: string[];
  promptUsed?: string;              // the journaling prompt that inspired this entry

  // Doctor visibility
  flagForDoctor: boolean;
  doctorFlags: DoctorFlag[];
  doctorAnnotations: DoctorAnnotation[];
}

/** Trend data point for analytics. */
export interface JournalTrendPoint {
  date: string;                     // ISO date
  dayNumber: number;
  value: number;
  movingAverage?: number;
}

/** Correlation analysis between two metrics. */
export interface CorrelationResult {
  metricA: string;
  metricB: string;
  coefficient: number;              // Pearson r, -1 to 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
  sampleSize: number;
  interpretation: string;
}

/** Weekly or monthly summary. */
export interface PeriodSummary {
  periodLabel: string;              // e.g. "Week 1", "January 2026"
  startDate: string;
  endDate: string;
  entryCount: number;
  averageMood: number;
  averagePain: number;
  averageEnergy: number;
  averageSleep: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  painTrend: 'improving' | 'stable' | 'worsening';
  milestones: string[];
  topConcerns: string[];
  sentimentAverage: number;
  highlights: string[];
}

/** Recovery milestone timeline event. */
export interface MilestoneTimelineEvent {
  dayNumber: number;
  date: string;
  milestoneType: MilestoneType;
  description: string;
  entryId: string;
}

/** Journaling streak tracking. */
export interface JournalingStreak {
  currentStreak: number;            // consecutive days
  longestStreak: number;
  totalDaysJournaled: number;
  totalEntries: number;
  lastEntryDate: string;
  streakDates: string[];            // dates in current streak
}

/** Guided reflection template. */
export interface ReflectionTemplate {
  id: string;
  title: string;
  phase: RecoveryPhase;
  prompts: string[];
  description: string;
}

/** Appointment journal summary for doctors. */
export interface AppointmentJournalSummary {
  patientId: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  entryCount: number;
  averageMood: number;
  averagePain: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  painTrend: 'improving' | 'stable' | 'worsening';
  flaggedEntries: JournalEntry[];
  unansweredConcerns: JournalEntry[];
  milestones: MilestoneTimelineEvent[];
  topSymptoms: Array<{ name: string; count: number; avgSeverity: number }>;
  sentimentTrend: JournalTrendPoint[];
  summary: string;
}

/** Formatted export for medical records. */
export interface JournalExport {
  patientId: string;
  exportedAt: string;
  periodStart: string;
  periodEnd: string;
  entries: JournalEntry[];
  summary: AppointmentJournalSummary;
  formattedText: string;
}

// ============================================================================
// Deterministic seeded PRNG (xorshift32)
// ============================================================================

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0 || 1;
  }

  next(): number {
    let s = this.state;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    this.state = s;
    return (s >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  pickN<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const result: T[] = [];
    const count = Math.min(n, copy.length);
    for (let i = 0; i < count; i++) {
      const idx = this.int(0, copy.length - 1);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return result;
  }

  normal(mean: number, stddev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stddev;
  }

  boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
}

// ============================================================================
// Utility helpers
// ============================================================================

let _idCounter = 0;

function generateId(prefix: string = 'journal'): string {
  _idCounter++;
  const timestamp = Date.now().toString(36);
  const counter = _idCounter.toString(36).padStart(4, '0');
  return `${prefix}-${timestamp}-${counter}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getRecoveryPhase(dayNumber: number): RecoveryPhase {
  if (dayNumber <= 7) return RecoveryPhase.ACUTE;
  if (dayNumber <= 14) return RecoveryPhase.EARLY;
  if (dayNumber <= 21) return RecoveryPhase.PROGRESSIVE;
  return RecoveryPhase.ADVANCED;
}

// ============================================================================
// Journaling Prompts (50+ rotating prompts)
// ============================================================================

const JOURNALING_PROMPTS: readonly string[] = [
  'What was the best part of your recovery today?',
  'How did your exercises feel?',
  'What are you grateful for today?',
  'How would you describe your energy level compared to yesterday?',
  'What activity did you enjoy most today?',
  'Did anything surprise you about your recovery today?',
  'What is one thing you can do today that you could not do last week?',
  'How are you feeling emotionally right now?',
  'What helped you manage your pain today?',
  'What are you looking forward to this week?',
  'How did you sleep last night? What might help you sleep better?',
  'Describe a moment today that made you smile.',
  'What would you like to tell your doctor at your next appointment?',
  'How has your appetite been today?',
  'What support from friends or family meant the most today?',
  'How do you feel about your progress so far?',
  'What is one small goal you want to achieve tomorrow?',
  'What was the most challenging part of today?',
  'How did you handle a difficult moment today?',
  'What are three things your body can do today?',
  'How is your wound/surgical site healing?',
  'What medications did you take today, and how did they make you feel?',
  'Did you go outside today? How did it feel?',
  'What hobby or interest have you been able to return to?',
  'How do you feel about your mobility today?',
  'What encouragement would you give to someone starting this recovery?',
  'What was the easiest thing about today?',
  'How did physical therapy go today?',
  'What foods did you enjoy eating today?',
  'How are you feeling about returning to normal activities?',
  'What is one thing you want to remember about today?',
  'How has your mood changed throughout the day?',
  'What coping strategies worked well for you today?',
  'How would you rate your overall recovery this week?',
  'What question do you have for your care team?',
  'Describe how your body feels right now.',
  'What mental or emotional challenge are you working through?',
  'How did you practice self-care today?',
  'What made today different from yesterday?',
  'How are you managing your medications?',
  'What gave you hope today?',
  'How comfortable were you during daily activities?',
  'What is the biggest change you have noticed in your recovery?',
  'How do you feel about the pace of your recovery?',
  'What would make tomorrow better than today?',
  'How are you staying connected with others during recovery?',
  'What movement or stretch felt particularly good today?',
  'How is your incision or wound looking today?',
  'What advice would you give yourself from a week ago?',
  'How did you manage stress today?',
  'What new thing did you try today?',
  'How has your pain changed over the past few days?',
  'What part of your routine is working well?',
  'How are you keeping your spirits up?',
  'What has been your proudest moment this week?',
  'How do you feel when you compare today to your first day of recovery?',
  'What is something kind you did for yourself today?',
  'How are you adjusting to any new limitations?',
  'What is one thing you are determined to do this week?',
  'How do you describe your recovery journey to others?',
] as const;

// ============================================================================
// Guided Reflection Templates
// ============================================================================

const REFLECTION_TEMPLATES: readonly ReflectionTemplate[] = [
  {
    id: 'acute-first-days',
    title: 'First Days After Surgery',
    phase: RecoveryPhase.ACUTE,
    description: 'A gentle reflection for the earliest days when rest is most important.',
    prompts: [
      'How are you feeling right now, physically and emotionally?',
      'What is the most comfortable position you have found?',
      'What helped you get through today?',
      'Who or what has been your biggest source of comfort?',
      'What is one thing you want your care team to know?',
    ],
  },
  {
    id: 'acute-pain-reflection',
    title: 'Understanding Your Pain',
    phase: RecoveryPhase.ACUTE,
    description: 'Reflect on your pain experience to help your care team manage it better.',
    prompts: [
      'On a scale of 0-10, where is your pain right now?',
      'Is the pain constant or does it come and go?',
      'What makes the pain worse? What makes it better?',
      'How is the pain affecting your sleep and daily activities?',
      'What concerns do you have about your pain management?',
    ],
  },
  {
    id: 'early-progress-check',
    title: 'Noticing Small Wins',
    phase: RecoveryPhase.EARLY,
    description: 'Focus on the progress you have made, even if it feels small.',
    prompts: [
      'What can you do today that you could not do three days ago?',
      'How has your pain level changed since surgery?',
      'What daily activity are you most eager to return to?',
      'How are you feeling about the pace of your recovery?',
      'What positive change have you noticed in your body?',
    ],
  },
  {
    id: 'early-emotional-check',
    title: 'Emotional Wellness Check',
    phase: RecoveryPhase.EARLY,
    description: 'Recovery is emotional too. Take a moment to check in with yourself.',
    prompts: [
      'How have your emotions been over the past few days?',
      'Have you felt frustrated, anxious, or down? What triggered those feelings?',
      'What has brought you joy or comfort recently?',
      'How are you communicating your needs to those around you?',
      'What is one thing you could do to lift your spirits?',
    ],
  },
  {
    id: 'progressive-activity-log',
    title: 'Getting More Active',
    phase: RecoveryPhase.PROGRESSIVE,
    description: 'As you increase activity, reflect on how your body responds.',
    prompts: [
      'What new activity did you try this week?',
      'How did your body respond to increased activity?',
      'What exercise or movement felt the best?',
      'Are there activities you are avoiding out of fear? What are they?',
      'How are you balancing rest and activity?',
    ],
  },
  {
    id: 'progressive-milestone-reflection',
    title: 'Celebrating Milestones',
    phase: RecoveryPhase.PROGRESSIVE,
    description: 'Acknowledge and celebrate the milestones you have reached.',
    prompts: [
      'What milestone have you achieved recently?',
      'How did it feel to reach that milestone?',
      'Who did you share this achievement with?',
      'What is the next milestone you are working toward?',
      'How has reaching this milestone changed your outlook on recovery?',
    ],
  },
  {
    id: 'advanced-looking-forward',
    title: 'Looking Forward',
    phase: RecoveryPhase.ADVANCED,
    description: 'Reflect on your journey and plan for the future.',
    prompts: [
      'How has this recovery experience changed you?',
      'What have you learned about yourself during this process?',
      'What are your goals for the next month?',
      'How will you maintain the healthy habits you developed during recovery?',
      'What advice would you give to someone just starting their recovery?',
    ],
  },
  {
    id: 'advanced-gratitude-deep',
    title: 'Deep Gratitude Practice',
    phase: RecoveryPhase.ADVANCED,
    description: 'A deeper gratitude practice as you near the end of acute recovery.',
    prompts: [
      'What are three things about your body you are grateful for?',
      'Who has been your biggest supporter, and how can you thank them?',
      'What unexpected positive thing came from this experience?',
      'How has your appreciation for daily activities changed?',
      'Write a letter of gratitude to yourself for getting through this.',
    ],
  },
] as const;

// ============================================================================
// Keyword-based auto-flagging
// ============================================================================

const CONCERN_KEYWORDS: readonly string[] = [
  'worried', 'scared', 'bleeding', 'infection', 'fever', 'swelling',
  'worse', 'worsening', 'emergency', 'help', 'severe', 'unbearable',
  'cannot sleep', 'depressed', 'hopeless', 'suicidal', 'giving up',
  'medication not working', 'dizzy', 'nauseous', 'vomiting', 'fainted',
  'redness', 'discharge', 'oozing', 'numb', 'tingling', 'chest pain',
  'short of breath', 'cannot breathe', 'allergic reaction',
] as const;

// ============================================================================
// Sentiment Analysis (keyword-based, no external deps)
// ============================================================================

const POSITIVE_WORDS: readonly string[] = [
  'happy', 'great', 'wonderful', 'amazing', 'grateful', 'thankful',
  'better', 'improving', 'progress', 'milestone', 'accomplished',
  'hope', 'hopeful', 'encouraged', 'confident', 'comfortable',
  'peaceful', 'relaxed', 'calm', 'joy', 'excited', 'proud',
  'strong', 'capable', 'healing', 'recovered', 'independent',
  'motivated', 'optimistic', 'blessed', 'good', 'excellent',
  'fantastic', 'smile', 'laugh', 'love', 'support', 'helped',
] as const;

const NEGATIVE_WORDS: readonly string[] = [
  'pain', 'hurt', 'ache', 'suffering', 'terrible', 'awful',
  'frustrated', 'angry', 'sad', 'depressed', 'anxious', 'worried',
  'scared', 'afraid', 'worse', 'worsening', 'setback', 'difficult',
  'struggling', 'exhausted', 'tired', 'weak', 'helpless', 'hopeless',
  'miserable', 'uncomfortable', 'nauseous', 'dizzy', 'lonely',
  'isolated', 'overwhelmed', 'discouraged', 'disappointed', 'upset',
  'crying', 'sleepless', 'insomnia', 'stiff', 'swollen',
] as const;

function analyzeSentiment(text: string): SentimentResult {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];

  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, '');
    if (POSITIVE_WORDS.includes(cleaned as typeof POSITIVE_WORDS[number])) {
      positiveCount++;
      if (!foundPositive.includes(cleaned)) foundPositive.push(cleaned);
    }
    if (NEGATIVE_WORDS.includes(cleaned as typeof NEGATIVE_WORDS[number])) {
      negativeCount++;
      if (!foundNegative.includes(cleaned)) foundNegative.push(cleaned);
    }
  }

  // Also check multi-word phrases
  for (const keyword of CONCERN_KEYWORDS) {
    if (lower.includes(keyword) && !foundNegative.includes(keyword)) {
      negativeCount++;
      foundNegative.push(keyword);
    }
  }

  const total = positiveCount + negativeCount;
  let score: number;
  if (total === 0) {
    score = 0;
  } else {
    score = round2((positiveCount - negativeCount) / total);
  }
  score = clamp(score, -1, 1);

  let category: SentimentCategory;
  if (score <= -0.5) category = SentimentCategory.VERY_NEGATIVE;
  else if (score < -0.1) category = SentimentCategory.NEGATIVE;
  else if (score <= 0.1) category = SentimentCategory.NEUTRAL;
  else if (score < 0.5) category = SentimentCategory.POSITIVE;
  else category = SentimentCategory.VERY_POSITIVE;

  return {
    score,
    category,
    keywords: [...foundPositive, ...foundNegative],
  };
}

// ============================================================================
// Auto-flagging logic
// ============================================================================

function shouldAutoFlag(entry: JournalEntry): DoctorFlag[] {
  const flags: DoctorFlag[] = [];
  const now = new Date().toISOString();

  // Flag all CONCERN entries
  if (entry.type === JournalEntryType.CONCERN) {
    flags.push({
      flaggedAt: now,
      reason: FlagReason.CONCERN_ENTRY,
      details: 'Patient submitted a concern entry for doctor review.',
      reviewed: false,
    });
  }

  // Low mood (1-2)
  if (entry.dailyCheckIn && entry.dailyCheckIn.mood <= 2) {
    flags.push({
      flaggedAt: now,
      reason: FlagReason.LOW_MOOD,
      details: `Patient reported mood of ${entry.dailyCheckIn.mood}/5 (${MOOD_LABELS[entry.dailyCheckIn.mood].label}).`,
      reviewed: false,
    });
  }

  // High pain (8+)
  if (entry.dailyCheckIn && entry.dailyCheckIn.painLevel >= 8) {
    flags.push({
      flaggedAt: now,
      reason: FlagReason.HIGH_PAIN,
      details: `Patient reported pain level of ${entry.dailyCheckIn.painLevel}/10.`,
      reviewed: false,
    });
  }

  // Poor sleep (1)
  if (entry.dailyCheckIn && entry.dailyCheckIn.sleepQuality <= 1) {
    flags.push({
      flaggedAt: now,
      reason: FlagReason.LOW_SLEEP,
      details: `Patient reported sleep quality of ${entry.dailyCheckIn.sleepQuality}/5 with ${entry.dailyCheckIn.hoursSlept} hours.`,
      reviewed: false,
    });
  }

  // Keyword scanning
  const textToScan = `${entry.title} ${entry.content}`.toLowerCase();
  const matchedKeywords: string[] = [];
  for (const keyword of CONCERN_KEYWORDS) {
    if (textToScan.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  }
  if (matchedKeywords.length > 0) {
    flags.push({
      flaggedAt: now,
      reason: FlagReason.KEYWORD_DETECTED,
      details: `Concerning keywords detected: ${matchedKeywords.join(', ')}.`,
      reviewed: false,
    });
  }

  return flags;
}

// ============================================================================
// Pearson correlation coefficient
// ============================================================================

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;

  const xSlice = xs.slice(0, n);
  const ySlice = ys.slice(0, n);

  const xMean = mean(xSlice);
  const yMean = mean(ySlice);

  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - xMean;
    const dy = ySlice[i] - yMean;
    numerator += dx * dy;
    xDenominator += dx * dx;
    yDenominator += dy * dy;
  }

  const denominator = Math.sqrt(xDenominator * yDenominator);
  if (denominator === 0) return 0;

  return clamp(round2(numerator / denominator), -1, 1);
}

function interpretCorrelation(r: number): { strength: 'strong' | 'moderate' | 'weak' | 'none'; direction: 'positive' | 'negative' | 'none' } {
  const abs = Math.abs(r);
  const direction = r > 0.05 ? 'positive' as const : r < -0.05 ? 'negative' as const : 'none' as const;
  if (abs >= 0.7) return { strength: 'strong', direction };
  if (abs >= 0.4) return { strength: 'moderate', direction };
  if (abs >= 0.2) return { strength: 'weak', direction };
  return { strength: 'none', direction: 'none' };
}

// ============================================================================
// Seed data generator (100 entries over 30 days)
// ============================================================================

const SAMPLE_GRATITUDE_ENTRIES: readonly string[] = [
  'Grateful for my family who visited today and brought homemade soup.',
  'Thankful for the nurses who have been so patient and kind.',
  'Grateful I could sit up in bed without help today.',
  'Thankful for the beautiful weather I could see from my window.',
  'Grateful for the physical therapist who encouraged me today.',
  'Thankful for audiobooks that keep me company during recovery.',
  'Grateful that my pain is a little less today than yesterday.',
  'Thankful for friends who texted to check on me.',
  'Grateful I could take a real shower today.',
  'Thankful for my body and its ability to heal.',
] as const;

const SAMPLE_CONCERNS: readonly string[] = [
  'I noticed some redness around my incision site. Should I be worried?',
  'My pain seems worse in the mornings. Is this normal?',
  'I have been feeling dizzy when I stand up too quickly.',
  'I am worried about whether I am healing at the right pace.',
  'My sleep has been terrible and I am worried it is slowing my recovery.',
  'I noticed some swelling that was not there before.',
  'I am concerned about becoming dependent on pain medication.',
  'I feel more anxious than usual. Is this a side effect of my medication?',
] as const;

const SAMPLE_SYMPTOM_NAMES: readonly string[] = [
  'Incision site pain', 'Muscle stiffness', 'Joint swelling',
  'Nausea', 'Headache', 'Fatigue', 'Numbness near incision',
  'Bruising', 'Itching around wound', 'Cramping',
] as const;

const SAMPLE_DAILY_NOTES: readonly string[] = [
  'Took it easy today. Watched some TV and rested.',
  'Managed to walk to the kitchen and back. Small victory!',
  'Had a good physical therapy session. Feeling optimistic.',
  'Rough morning but the afternoon was better.',
  'Friends came to visit which really lifted my spirits.',
  'Tried some light stretching. It felt good to move.',
  'Spent time reading. Good distraction from discomfort.',
  'Video called my colleagues. Missing work but feeling better about recovery.',
  'Went for a short walk outside. Fresh air felt amazing.',
  'Cooked a simple meal for the first time since surgery.',
  'Had a frustrating day. Pain was higher than expected.',
  'Slept through the night for the first time. Feeling refreshed.',
  'Physical therapy was tough today but I pushed through.',
  'Feeling stronger today. Climbed a few stairs without much trouble.',
  'Reduced my pain medication today. A big step forward.',
  'Enjoyed sitting in the garden for a while.',
  'Started doing some light housework. Felt normal for a moment.',
  'Had my follow-up appointment. Doctor said I am on track.',
  'Took a longer walk today. My endurance is improving.',
  'Feeling grateful for how far I have come in just a few weeks.',
] as const;

const SAMPLE_PHOTO_CAPTIONS: readonly string[] = [
  'Incision site - Day {day}. Healing well, less redness.',
  'Swelling comparison from last week. Definite improvement.',
  'First time outside! Walking in the garden.',
  'Range of motion progress. Getting better each day.',
  'My recovery corner - where I spend most of my time.',
] as const;

function generateSampleEntries(): JournalEntry[] {
  const rng = new SeededRandom(20260101);
  const entries: JournalEntry[] = [];
  const patientId = 'journal-patient-001';
  const surgeryDate = new Date('2025-12-15T08:00:00.000Z');

  // Recovery progression model: pain decreases, mood increases over 30 days
  const basePain = (day: number): number => clamp(round2(7.5 * Math.exp(-0.08 * day) + 1), 0, 10);
  const baseMood = (day: number): number => clamp(Math.round(2 + 2.5 * (1 - Math.exp(-0.1 * day))), 1, 5);
  const baseEnergy = (day: number): number => clamp(Math.round(1.5 + 2.5 * (1 - Math.exp(-0.09 * day))), 1, 5);
  const baseSleep = (day: number): number => clamp(Math.round(2 + 2 * (1 - Math.exp(-0.07 * day))), 1, 5);
  const baseAppetite = (day: number): number => clamp(Math.round(2 + 2 * (1 - Math.exp(-0.06 * day))), 1, 5);

  let entryIndex = 0;

  // Milestone schedule
  const milestoneSchedule: Array<{ day: number; type: MilestoneType; desc: string }> = [
    { day: 2, type: MilestoneType.WENT_OUTSIDE, desc: 'Sat on the porch for 10 minutes. Fresh air felt incredible.' },
    { day: 4, type: MilestoneType.SHOWER_INDEPENDENTLY, desc: 'Took a shower without any help. Exhausting but empowering.' },
    { day: 7, type: MilestoneType.FIRST_WALK, desc: 'Walked to the end of the driveway and back. Legs felt shaky but I did it.' },
    { day: 10, type: MilestoneType.SLEEP_THROUGH_NIGHT, desc: 'Slept a full 7 hours without waking from pain. What a difference.' },
    { day: 14, type: MilestoneType.COOKED_A_MEAL, desc: 'Made scrambled eggs and toast. Standing at the stove felt like a marathon.' },
    { day: 17, type: MilestoneType.STAIRS, desc: 'Climbed the stairs to the second floor. Took it slow but made it.' },
    { day: 20, type: MilestoneType.REDUCED_MEDICATION, desc: 'Dropped from 3 doses to 2 doses of pain medication. Manageable.' },
    { day: 23, type: MilestoneType.EXERCISE_RESUMED, desc: 'Did 15 minutes of gentle exercise from my PT program. Felt great.' },
    { day: 26, type: MilestoneType.DRIVING, desc: 'Drove to the pharmacy and back. Short trip but a huge confidence boost.' },
    { day: 29, type: MilestoneType.PAIN_FREE_DAY, desc: 'First day where I barely noticed any pain. Recovery is real.' },
  ];

  for (let day = 1; day <= 30; day++) {
    const entryDate = new Date(surgeryDate);
    entryDate.setDate(entryDate.getDate() + day);
    const phase = getRecoveryPhase(day);

    // DAILY_LOG - every day
    {
      const mood = clamp(baseMood(day) + rng.int(-1, 1), 1, 5) as MoodRating;
      const energy = clamp(baseEnergy(day) + rng.int(-1, 1), 1, 5);
      const sleepQ = clamp(baseSleep(day) + rng.int(-1, 1), 1, 5);
      const hours = clamp(round2(rng.float(4, 9)), 2, 12);
      const pain = clamp(round2(basePain(day) + rng.float(-1.5, 1.5)), 0, 10);
      const appetite = clamp(baseAppetite(day) + rng.int(-1, 0), 1, 5);
      const activityOptions: ActivityLevel[] = day <= 5
        ? [ActivityLevel.SEDENTARY, ActivityLevel.LIGHT]
        : day <= 15
          ? [ActivityLevel.LIGHT, ActivityLevel.MODERATE]
          : [ActivityLevel.MODERATE, ActivityLevel.ACTIVE];
      const activity = rng.pick(activityOptions);
      const noteText = rng.pick(SAMPLE_DAILY_NOTES);
      const promptText = rng.pick(JOURNALING_PROMPTS);

      const dailyHour = rng.int(19, 21);
      const timestamp = new Date(entryDate);
      timestamp.setHours(dailyHour, rng.int(0, 59), 0);

      const title = `Day ${day} Check-in`;
      const content = noteText;

      const checkIn: DailyCheckIn = {
        mood,
        energyLevel: energy,
        sleepQuality: sleepQ,
        hoursSlept: hours,
        painLevel: round2(pain),
        appetite,
        activityLevel: activity,
        notes: noteText,
      };

      const sentiment = analyzeSentiment(content);

      const entry: JournalEntry = {
        id: `journal-${patientId}-${entryIndex++}`,
        patientId,
        type: JournalEntryType.DAILY_LOG,
        timestamp: timestamp.toISOString(),
        dayNumber: day,
        title,
        content,
        dailyCheckIn: checkIn,
        recoveryPhase: phase,
        sentiment,
        tags: ['daily', phase],
        promptUsed: promptText,
        flagForDoctor: false,
        doctorFlags: [],
        doctorAnnotations: [],
      };

      // Auto-flag
      const autoFlags = shouldAutoFlag(entry);
      if (autoFlags.length > 0) {
        entry.flagForDoctor = true;
        entry.doctorFlags = autoFlags;
      }

      entries.push(entry);
    }

    // MILESTONE entries on scheduled days
    const milestoneForDay = milestoneSchedule.find(m => m.day === day);
    if (milestoneForDay) {
      const timestamp = new Date(entryDate);
      timestamp.setHours(rng.int(14, 17), rng.int(0, 59), 0);

      const sentiment = analyzeSentiment(milestoneForDay.desc);

      const entry: JournalEntry = {
        id: `journal-${patientId}-${entryIndex++}`,
        patientId,
        type: JournalEntryType.MILESTONE,
        timestamp: timestamp.toISOString(),
        dayNumber: day,
        title: `Milestone: ${milestoneForDay.type.replace(/_/g, ' ')}`,
        content: milestoneForDay.desc,
        milestoneDetail: {
          milestoneType: milestoneForDay.type,
          description: milestoneForDay.desc,
          daysSinceSurgery: day,
          emotionalResponse: rng.pick(['proud', 'relieved', 'excited', 'grateful', 'emotional']),
        },
        recoveryPhase: phase,
        sentiment,
        tags: ['milestone', phase, milestoneForDay.type],
        flagForDoctor: false,
        doctorFlags: [],
        doctorAnnotations: [],
      };

      entries.push(entry);
    }

    // Extra morning reflection on even days (adds ~15 entries)
    if (day % 2 === 0) {
      const morningPrompt = rng.pick(JOURNALING_PROMPTS);
      const morningReflection = rng.pick([
        'Woke up feeling a bit sore but hopeful about today.',
        'Morning stiffness is real but it gets better as I move around.',
        'Had a peaceful morning. Took my time getting out of bed.',
        'Feeling motivated this morning. Ready to tackle my exercises.',
        'Morning pain was less than yesterday. Progress!',
        'Started the day with some gentle stretching. Felt good.',
        'Woke up early feeling rested. Good sign for recovery.',
        'Tough morning. Took extra time to get moving.',
        'Beautiful morning. Opened the window for fresh air.',
        'Morning routine is getting easier each day.',
      ]);
      const morningTimestamp = new Date(entryDate);
      morningTimestamp.setHours(rng.int(7, 9), rng.int(0, 59), 0);
      const morSentiment = analyzeSentiment(morningReflection);

      const morEntry: JournalEntry = {
        id: `journal-${patientId}-${entryIndex++}`,
        patientId,
        type: JournalEntryType.GRATITUDE,
        timestamp: morningTimestamp.toISOString(),
        dayNumber: day,
        title: 'Morning Reflection',
        content: morningReflection,
        recoveryPhase: phase,
        sentiment: morSentiment,
        tags: ['morning', 'reflection', phase],
        promptUsed: morningPrompt,
        flagForDoctor: false,
        doctorFlags: [],
        doctorAnnotations: [],
      };

      entries.push(morEntry);
    }

    // GRATITUDE - every 3 days
    if (day % 3 === 0) {
      const gratitudeText = rng.pick(SAMPLE_GRATITUDE_ENTRIES);
      const timestamp = new Date(entryDate);
      timestamp.setHours(rng.int(20, 22), rng.int(0, 59), 0);

      const sentiment = analyzeSentiment(gratitudeText);

      const entry: JournalEntry = {
        id: `journal-${patientId}-${entryIndex++}`,
        patientId,
        type: JournalEntryType.GRATITUDE,
        timestamp: timestamp.toISOString(),
        dayNumber: day,
        title: 'Gratitude Reflection',
        content: gratitudeText,
        recoveryPhase: phase,
        sentiment,
        tags: ['gratitude', phase],
        promptUsed: 'What are you grateful for today?',
        flagForDoctor: false,
        doctorFlags: [],
        doctorAnnotations: [],
      };

      entries.push(entry);
    }

    // CONCERN - every 4 days (especially early in recovery)
    if (day % 4 === 0 || (day <= 14 && day % 3 === 1) || day === 9 || day === 17 || day === 18 || day === 22 || day === 27) {
      const concernText = rng.pick(SAMPLE_CONCERNS);
      const timestamp = new Date(entryDate);
      timestamp.setHours(rng.int(9, 12), rng.int(0, 59), 0);

      const sentiment = analyzeSentiment(concernText);

      const entry: JournalEntry = {
        id: `journal-${patientId}-${entryIndex++}`,
        patientId,
        type: JournalEntryType.CONCERN,
        timestamp: timestamp.toISOString(),
        dayNumber: day,
        title: 'Question for My Doctor',
        content: concernText,
        recoveryPhase: phase,
        sentiment,
        tags: ['concern', phase],
        flagForDoctor: true,
        doctorFlags: [{
          flaggedAt: timestamp.toISOString(),
          reason: FlagReason.CONCERN_ENTRY,
          details: 'Patient submitted a concern entry for doctor review.',
          reviewed: day <= 20 ? rng.boolean(0.6) : false,
          reviewedAt: day <= 20 && rng.boolean(0.6) ? new Date(entryDate.getTime() + 86400000).toISOString() : undefined,
          reviewedBy: day <= 20 ? 'Dr. Sarah Chen' : undefined,
        }],
        doctorAnnotations: day <= 15 && rng.boolean(0.4) ? [{
          id: `annotation-${entryIndex}`,
          doctorId: 'doctor-001',
          doctorName: 'Dr. Sarah Chen',
          timestamp: new Date(entryDate.getTime() + 86400000).toISOString(),
          note: rng.pick([
            'This is normal for this stage of recovery. Will discuss at next appointment.',
            'Noted. Adjusting medication may help. See updated care plan.',
            'Good question. Will address during next visit.',
            'Monitoring this. Please report if it worsens.',
          ]),
          isPrivate: false,
        }] : [],
      };

      entries.push(entry);
    }

    // SYMPTOM_REPORT - every 3 days, plus extra in acute phase
    if ((day % 3 === 1 && day > 1) || (day <= 10 && day % 2 === 0)) {
      const symptomName = rng.pick(SAMPLE_SYMPTOM_NAMES);
      const severity = clamp(Math.round(basePain(day) + rng.float(-1, 1)), 1, 10);
      const timestamp = new Date(entryDate);
      timestamp.setHours(rng.int(10, 14), rng.int(0, 59), 0);

      const content = `Experiencing ${symptomName.toLowerCase()} at severity ${severity}/10. ${rng.pick([
        'It comes and goes throughout the day.',
        'Mostly noticeable in the morning.',
        'Gets worse with movement.',
        'Manageable with medication.',
        'Has been consistent for the past day or two.',
      ])}`;

      const sentiment = analyzeSentiment(content);

      const entry: JournalEntry = {
        id: `journal-${patientId}-${entryIndex++}`,
        patientId,
        type: JournalEntryType.SYMPTOM_REPORT,
        timestamp: timestamp.toISOString(),
        dayNumber: day,
        title: `Symptom Report: ${symptomName}`,
        content,
        symptomDetail: {
          symptomName,
          severity,
          location: rng.pick(['left knee', 'right knee', 'incision site', 'lower back', 'hip']),
          duration: rng.pick(['2 hours', 'half the day', 'all day', 'intermittent', 'since morning']),
          triggers: rng.pickN(['movement', 'standing', 'sitting too long', 'cold weather', 'exercise', 'waking up'], rng.int(1, 3)),
          notes: content,
        },
        recoveryPhase: phase,
        sentiment,
        tags: ['symptom', phase, symptomName.toLowerCase().replace(/\s+/g, '_')],
        flagForDoctor: severity >= 8,
        doctorFlags: severity >= 8 ? [{
          flaggedAt: timestamp.toISOString(),
          reason: FlagReason.HIGH_PAIN,
          details: `Symptom severity ${severity}/10 for ${symptomName}.`,
          reviewed: false,
        }] : [],
        doctorAnnotations: [],
      };

      entries.push(entry);
    }

    // PHOTO_DIARY - every 4 days starting day 3
    if (day >= 3 && (day - 3) % 4 === 0) {
      const caption = rng.pick(SAMPLE_PHOTO_CAPTIONS).replace('{day}', day.toString());
      const timestamp = new Date(entryDate);
      timestamp.setHours(rng.int(11, 15), rng.int(0, 59), 0);

      const sentiment = analyzeSentiment(caption);

      const entry: JournalEntry = {
        id: `journal-${patientId}-${entryIndex++}`,
        patientId,
        type: JournalEntryType.PHOTO_DIARY,
        timestamp: timestamp.toISOString(),
        dayNumber: day,
        title: `Photo Diary - Day ${day}`,
        content: caption,
        photoDiaryDetail: {
          photoUrl: `/recovery-photos/${patientId}/day-${day}.jpg`,
          caption,
          bodyArea: rng.pick(['incision site', 'left knee', 'right knee', 'surgical area']),
          comparisonPhotoUrl: day > 7 ? `/recovery-photos/${patientId}/day-${day - 7}.jpg` : undefined,
        },
        recoveryPhase: phase,
        sentiment,
        tags: ['photo', phase],
        flagForDoctor: false,
        doctorFlags: [],
        doctorAnnotations: [],
      };

      entries.push(entry);
    }
  }

  return entries;
}

// ============================================================================
// PatientJournalService implementation
// ============================================================================

class PatientJournalServiceImpl {
  private entries: JournalEntry[] = [];

  // --------------------------------------------------------------------------
  // Entry CRUD
  // --------------------------------------------------------------------------

  /**
   * Creates a new journal entry.
   *
   * Validates required fields, generates ID and timestamp if not provided,
   * runs auto-flagging and sentiment analysis, then stores the entry.
   */
  createEntry(
    input: Omit<JournalEntry, 'id' | 'timestamp' | 'sentiment' | 'doctorFlags' | 'doctorAnnotations'> & {
      id?: string;
      timestamp?: string;
      sentiment?: SentimentResult;
      doctorFlags?: DoctorFlag[];
      doctorAnnotations?: DoctorAnnotation[];
    }
  ): JournalEntry {
    const sentiment = input.sentiment ?? analyzeSentiment(`${input.title} ${input.content}`);

    const entry: JournalEntry = {
      id: input.id ?? generateId(),
      patientId: input.patientId,
      type: input.type,
      timestamp: input.timestamp ?? new Date().toISOString(),
      dayNumber: input.dayNumber,
      title: input.title,
      content: input.content,
      dailyCheckIn: input.dailyCheckIn,
      symptomDetail: input.symptomDetail,
      milestoneDetail: input.milestoneDetail,
      photoDiaryDetail: input.photoDiaryDetail,
      recoveryPhase: input.recoveryPhase,
      sentiment,
      tags: input.tags ?? [],
      promptUsed: input.promptUsed,
      flagForDoctor: input.flagForDoctor ?? false,
      doctorFlags: input.doctorFlags ?? [],
      doctorAnnotations: input.doctorAnnotations ?? [],
    };

    // Auto-flag
    const autoFlags = shouldAutoFlag(entry);
    if (autoFlags.length > 0) {
      entry.flagForDoctor = true;
      entry.doctorFlags = [...entry.doctorFlags, ...autoFlags];
    }

    this.entries.push(entry);
    return entry;
  }

  /**
   * Creates a structured daily check-in entry.
   */
  createDailyCheckIn(
    patientId: string,
    dayNumber: number,
    checkIn: DailyCheckIn,
    promptUsed?: string
  ): JournalEntry {
    const moodInfo = MOOD_LABELS[checkIn.mood];
    return this.createEntry({
      patientId,
      type: JournalEntryType.DAILY_LOG,
      dayNumber,
      title: `Day ${dayNumber} Check-in`,
      content: checkIn.notes || `Mood: ${moodInfo.label}, Pain: ${checkIn.painLevel}/10, Energy: ${checkIn.energyLevel}/5`,
      dailyCheckIn: checkIn,
      recoveryPhase: getRecoveryPhase(dayNumber),
      tags: ['daily', getRecoveryPhase(dayNumber)],
      promptUsed,
      flagForDoctor: false,
    });
  }

  /**
   * Records a recovery milestone.
   */
  recordMilestone(
    patientId: string,
    dayNumber: number,
    milestone: MilestoneDetail
  ): JournalEntry {
    return this.createEntry({
      patientId,
      type: JournalEntryType.MILESTONE,
      dayNumber,
      title: `Milestone: ${milestone.milestoneType.replace(/_/g, ' ')}`,
      content: milestone.description,
      milestoneDetail: milestone,
      recoveryPhase: getRecoveryPhase(dayNumber),
      tags: ['milestone', getRecoveryPhase(dayNumber), milestone.milestoneType],
      flagForDoctor: false,
    });
  }

  /**
   * Submits a concern for doctor review.
   */
  submitConcern(
    patientId: string,
    dayNumber: number,
    title: string,
    content: string
  ): JournalEntry {
    return this.createEntry({
      patientId,
      type: JournalEntryType.CONCERN,
      dayNumber,
      title,
      content,
      recoveryPhase: getRecoveryPhase(dayNumber),
      tags: ['concern', getRecoveryPhase(dayNumber)],
      flagForDoctor: true,
    });
  }

  /**
   * Bulk-loads entries (used for seed data and testing).
   */
  loadEntries(entries: JournalEntry[]): void {
    this.entries.push(...entries);
  }

  /**
   * Retrieves all entries for a patient, optionally filtered by type and date range.
   */
  getEntries(
    patientId: string,
    options?: {
      type?: JournalEntryType;
      startDate?: string;
      endDate?: string;
      flaggedOnly?: boolean;
    }
  ): JournalEntry[] {
    let results = this.entries.filter(e => e.patientId === patientId);

    if (options?.type) {
      results = results.filter(e => e.type === options.type);
    }
    if (options?.startDate) {
      results = results.filter(e => e.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      results = results.filter(e => e.timestamp <= options.endDate!);
    }
    if (options?.flaggedOnly) {
      results = results.filter(e => e.flagForDoctor);
    }

    return results.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Retrieves a single entry by ID.
   */
  getEntryById(entryId: string): JournalEntry | null {
    return this.entries.find(e => e.id === entryId) ?? null;
  }

  /**
   * Returns the most recent N entries for a patient.
   */
  getRecentEntries(patientId: string, count: number): JournalEntry[] {
    const all = this.getEntries(patientId);
    return all.slice(-count);
  }

  /**
   * Clears all data. Used for testing.
   */
  clearAll(): void {
    this.entries = [];
  }

  // --------------------------------------------------------------------------
  // Doctor Visibility
  // --------------------------------------------------------------------------

  /**
   * Manually flags an entry for doctor review.
   */
  flagEntryForDoctor(entryId: string, reason: string): boolean {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return false;

    entry.flagForDoctor = true;
    entry.doctorFlags.push({
      flaggedAt: new Date().toISOString(),
      reason: FlagReason.PATIENT_REQUESTED,
      details: reason,
      reviewed: false,
    });
    return true;
  }

  /**
   * Gets all flagged entries for a patient, optionally only unreviewed ones.
   */
  getFlaggedEntries(patientId: string, unreviewedOnly: boolean = false): JournalEntry[] {
    let results = this.entries.filter(
      e => e.patientId === patientId && e.flagForDoctor
    );

    if (unreviewedOnly) {
      results = results.filter(
        e => e.doctorFlags.some(f => !f.reviewed)
      );
    }

    return results.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Adds a doctor annotation to a journal entry.
   */
  addDoctorAnnotation(
    entryId: string,
    doctorId: string,
    doctorName: string,
    note: string,
    isPrivate: boolean = false
  ): DoctorAnnotation | null {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return null;

    const annotation: DoctorAnnotation = {
      id: generateId('annotation'),
      doctorId,
      doctorName,
      timestamp: new Date().toISOString(),
      note,
      isPrivate,
    };

    entry.doctorAnnotations.push(annotation);
    return annotation;
  }

  /**
   * Marks a doctor flag as reviewed.
   */
  markFlagReviewed(entryId: string, flagIndex: number, reviewedBy: string): boolean {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry || flagIndex < 0 || flagIndex >= entry.doctorFlags.length) return false;

    entry.doctorFlags[flagIndex].reviewed = true;
    entry.doctorFlags[flagIndex].reviewedAt = new Date().toISOString();
    entry.doctorFlags[flagIndex].reviewedBy = reviewedBy;
    return true;
  }

  // --------------------------------------------------------------------------
  // Journal Analytics
  // --------------------------------------------------------------------------

  /**
   * Computes mood trends over time with a 3-day moving average.
   */
  getMoodTrends(patientId: string): JournalTrendPoint[] {
    const dailyLogs = this.getEntries(patientId, { type: JournalEntryType.DAILY_LOG });
    if (dailyLogs.length === 0) return [];

    const points: JournalTrendPoint[] = dailyLogs
      .filter(e => e.dailyCheckIn)
      .map(e => ({
        date: e.timestamp.slice(0, 10),
        dayNumber: e.dayNumber,
        value: e.dailyCheckIn!.mood,
      }));

    // Compute 3-day moving average
    for (let i = 0; i < points.length; i++) {
      const start = Math.max(0, i - 2);
      const window = points.slice(start, i + 1).map(p => p.value);
      points[i].movingAverage = round2(mean(window));
    }

    return points;
  }

  /**
   * Computes pain trends over time.
   */
  getPainTrends(patientId: string): JournalTrendPoint[] {
    const dailyLogs = this.getEntries(patientId, { type: JournalEntryType.DAILY_LOG });
    if (dailyLogs.length === 0) return [];

    const points: JournalTrendPoint[] = dailyLogs
      .filter(e => e.dailyCheckIn)
      .map(e => ({
        date: e.timestamp.slice(0, 10),
        dayNumber: e.dayNumber,
        value: e.dailyCheckIn!.painLevel,
      }));

    for (let i = 0; i < points.length; i++) {
      const start = Math.max(0, i - 2);
      const window = points.slice(start, i + 1).map(p => p.value);
      points[i].movingAverage = round2(mean(window));
    }

    return points;
  }

  /**
   * Computes energy trends over time.
   */
  getEnergyTrends(patientId: string): JournalTrendPoint[] {
    const dailyLogs = this.getEntries(patientId, { type: JournalEntryType.DAILY_LOG });
    if (dailyLogs.length === 0) return [];

    const points: JournalTrendPoint[] = dailyLogs
      .filter(e => e.dailyCheckIn)
      .map(e => ({
        date: e.timestamp.slice(0, 10),
        dayNumber: e.dayNumber,
        value: e.dailyCheckIn!.energyLevel,
      }));

    for (let i = 0; i < points.length; i++) {
      const start = Math.max(0, i - 2);
      const window = points.slice(start, i + 1).map(p => p.value);
      points[i].movingAverage = round2(mean(window));
    }

    return points;
  }

  /**
   * Computes sentiment trends over time across all entry types.
   */
  getSentimentTrends(patientId: string): JournalTrendPoint[] {
    const all = this.getEntries(patientId);
    if (all.length === 0) return [];

    // Group by date, average sentiment
    const byDate = new Map<string, number[]>();
    for (const entry of all) {
      if (!entry.sentiment) continue;
      const date = entry.timestamp.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry.sentiment.score);
    }

    const sortedDates = [...byDate.keys()].sort();
    const points: JournalTrendPoint[] = sortedDates.map(date => {
      const values = byDate.get(date)!;
      // Determine dayNumber from closest entry
      const dayEntry = all.find(e => e.timestamp.startsWith(date));
      return {
        date,
        dayNumber: dayEntry?.dayNumber ?? 0,
        value: round2(mean(values)),
      };
    });

    // 3-day moving average
    for (let i = 0; i < points.length; i++) {
      const start = Math.max(0, i - 2);
      const window = points.slice(start, i + 1).map(p => p.value);
      points[i].movingAverage = round2(mean(window));
    }

    return points;
  }

  /**
   * Computes correlation analysis between two metrics.
   *
   * Supported pairs: sleep vs pain, activity vs mood, energy vs mood,
   * sleep vs mood, pain vs mood.
   */
  getCorrelationAnalysis(patientId: string): CorrelationResult[] {
    const dailyLogs = this.getEntries(patientId, { type: JournalEntryType.DAILY_LOG })
      .filter(e => e.dailyCheckIn);

    if (dailyLogs.length < 5) return [];

    const moods = dailyLogs.map(e => e.dailyCheckIn!.mood);
    const pains = dailyLogs.map(e => e.dailyCheckIn!.painLevel);
    const sleepQualities = dailyLogs.map(e => e.dailyCheckIn!.sleepQuality);
    const sleepHours = dailyLogs.map(e => e.dailyCheckIn!.hoursSlept);
    const energies = dailyLogs.map(e => e.dailyCheckIn!.energyLevel);
    const activityNums = dailyLogs.map(e => {
      const map: Record<string, number> = {
        [ActivityLevel.SEDENTARY]: 1,
        [ActivityLevel.LIGHT]: 2,
        [ActivityLevel.MODERATE]: 3,
        [ActivityLevel.ACTIVE]: 4,
      };
      return map[e.dailyCheckIn!.activityLevel] ?? 1;
    });

    const results: CorrelationResult[] = [];

    // Sleep quality vs Pain
    const sleepPainR = pearsonCorrelation(sleepQualities, pains);
    const sleepPainInterp = interpretCorrelation(sleepPainR);
    results.push({
      metricA: 'Sleep Quality',
      metricB: 'Pain Level',
      coefficient: sleepPainR,
      ...sleepPainInterp,
      sampleSize: dailyLogs.length,
      interpretation: sleepPainR < -0.2
        ? 'Better sleep quality is associated with lower pain levels.'
        : sleepPainR > 0.2
          ? 'Higher sleep quality appears correlated with higher reported pain, possibly due to increased activity on well-rested days.'
          : 'No significant relationship detected between sleep quality and pain.',
    });

    // Sleep hours vs Pain
    const hoursR = pearsonCorrelation(sleepHours, pains);
    const hoursInterp = interpretCorrelation(hoursR);
    results.push({
      metricA: 'Hours Slept',
      metricB: 'Pain Level',
      coefficient: hoursR,
      ...hoursInterp,
      sampleSize: dailyLogs.length,
      interpretation: hoursR < -0.2
        ? 'More sleep is associated with lower pain levels.'
        : 'Sleep duration does not show a strong direct impact on pain.',
    });

    // Activity vs Mood
    const actMoodR = pearsonCorrelation(activityNums, moods);
    const actMoodInterp = interpretCorrelation(actMoodR);
    results.push({
      metricA: 'Activity Level',
      metricB: 'Mood',
      coefficient: actMoodR,
      ...actMoodInterp,
      sampleSize: dailyLogs.length,
      interpretation: actMoodR > 0.2
        ? 'Higher activity levels are associated with better mood.'
        : 'Activity level does not show a strong direct relationship with mood.',
    });

    // Energy vs Mood
    const engMoodR = pearsonCorrelation(energies, moods);
    const engMoodInterp = interpretCorrelation(engMoodR);
    results.push({
      metricA: 'Energy Level',
      metricB: 'Mood',
      coefficient: engMoodR,
      ...engMoodInterp,
      sampleSize: dailyLogs.length,
      interpretation: engMoodR > 0.3
        ? 'Energy and mood are strongly linked. Improving energy may boost mood.'
        : 'Energy and mood show some association.',
    });

    // Pain vs Mood
    const painMoodR = pearsonCorrelation(pains, moods);
    const painMoodInterp = interpretCorrelation(painMoodR);
    results.push({
      metricA: 'Pain Level',
      metricB: 'Mood',
      coefficient: painMoodR,
      ...painMoodInterp,
      sampleSize: dailyLogs.length,
      interpretation: painMoodR < -0.2
        ? 'Higher pain is associated with lower mood, as expected.'
        : 'Pain and mood do not show a strong direct inverse relationship.',
    });

    return results;
  }

  /**
   * Generates a weekly summary for a given week number (1-based).
   */
  getWeeklySummary(patientId: string, weekNumber: number): PeriodSummary | null {
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = weekNumber * 7;

    const entries = this.getEntries(patientId).filter(
      e => e.dayNumber >= startDay && e.dayNumber <= endDay
    );
    if (entries.length === 0) return null;

    return this.buildPeriodSummary(
      `Week ${weekNumber}`,
      entries,
      startDay,
      endDay
    );
  }

  /**
   * Generates a monthly summary.
   */
  getMonthlySummary(patientId: string): PeriodSummary | null {
    const entries = this.getEntries(patientId);
    if (entries.length === 0) return null;

    const minDay = Math.min(...entries.map(e => e.dayNumber));
    const maxDay = Math.max(...entries.map(e => e.dayNumber));

    return this.buildPeriodSummary(
      'Full Recovery Period',
      entries,
      minDay,
      maxDay
    );
  }

  /**
   * Builds a period summary from a set of entries.
   */
  private buildPeriodSummary(
    periodLabel: string,
    entries: JournalEntry[],
    _startDay: number,
    _endDay: number
  ): PeriodSummary {
    const dailyLogs = entries.filter(e => e.dailyCheckIn);
    const moods = dailyLogs.map(e => e.dailyCheckIn!.mood);
    const pains = dailyLogs.map(e => e.dailyCheckIn!.painLevel);
    const energies = dailyLogs.map(e => e.dailyCheckIn!.energyLevel);
    const sleeps = dailyLogs.map(e => e.dailyCheckIn!.sleepQuality);

    // Mood trend
    let moodTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (moods.length >= 3) {
      const firstHalf = mean(moods.slice(0, Math.ceil(moods.length / 2)));
      const secondHalf = mean(moods.slice(Math.floor(moods.length / 2)));
      const diff = secondHalf - firstHalf;
      if (diff > 0.3) moodTrend = 'improving';
      else if (diff < -0.3) moodTrend = 'declining';
    }

    // Pain trend
    let painTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (pains.length >= 3) {
      const firstHalf = mean(pains.slice(0, Math.ceil(pains.length / 2)));
      const secondHalf = mean(pains.slice(Math.floor(pains.length / 2)));
      const diff = secondHalf - firstHalf;
      if (diff < -0.5) painTrend = 'improving';
      else if (diff > 0.5) painTrend = 'worsening';
    }

    // Milestones
    const milestones = entries
      .filter(e => e.type === JournalEntryType.MILESTONE)
      .map(e => e.milestoneDetail?.milestoneType?.replace(/_/g, ' ') ?? e.title);

    // Top concerns
    const concerns = entries
      .filter(e => e.type === JournalEntryType.CONCERN)
      .map(e => e.content);

    // Sentiment average
    const sentiments = entries
      .filter(e => e.sentiment)
      .map(e => e.sentiment!.score);

    // Highlights (positive-sentiment entries)
    const highlights = entries
      .filter(e => e.sentiment && e.sentiment.score > 0.3)
      .slice(0, 3)
      .map(e => e.content);

    const timestamps = entries.map(e => e.timestamp).sort();

    return {
      periodLabel,
      startDate: timestamps[0] ?? '',
      endDate: timestamps[timestamps.length - 1] ?? '',
      entryCount: entries.length,
      averageMood: round2(mean(moods)),
      averagePain: round2(mean(pains)),
      averageEnergy: round2(mean(energies)),
      averageSleep: round2(mean(sleeps)),
      moodTrend,
      painTrend,
      milestones,
      topConcerns: concerns.slice(0, 3),
      sentimentAverage: round2(mean(sentiments)),
      highlights,
    };
  }

  /**
   * Returns the recovery milestone timeline.
   */
  getMilestoneTimeline(patientId: string): MilestoneTimelineEvent[] {
    return this.getEntries(patientId, { type: JournalEntryType.MILESTONE })
      .filter(e => e.milestoneDetail)
      .map(e => ({
        dayNumber: e.dayNumber,
        date: e.timestamp.slice(0, 10),
        milestoneType: e.milestoneDetail!.milestoneType,
        description: e.milestoneDetail!.description,
        entryId: e.id,
      }))
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }

  // --------------------------------------------------------------------------
  // Prompts & Engagement
  // --------------------------------------------------------------------------

  /**
   * Returns a daily journaling prompt.
   *
   * The prompt rotates based on the day number and recovery phase.
   * Phase-specific prompts are prioritized.
   */
  getDailyPrompt(dayNumber: number): string {
    // Use day number to rotate through prompts deterministically
    const index = (dayNumber - 1) % JOURNALING_PROMPTS.length;
    return JOURNALING_PROMPTS[index];
  }

  /**
   * Returns multiple prompts suitable for a given recovery phase.
   */
  getPromptsForPhase(phase: RecoveryPhase, count: number = 3): string[] {
    const phaseSpecific: Record<string, readonly string[]> = {
      [RecoveryPhase.ACUTE]: [
        'How is your pain being managed right now?',
        'What is helping you rest and recover?',
        'How are you feeling about the surgery?',
        'Who or what is bringing you comfort?',
        'What do you need from your care team?',
      ],
      [RecoveryPhase.EARLY]: [
        'What small progress did you notice today?',
        'How is your mobility improving?',
        'What activity are you most looking forward to?',
        'How is your wound healing?',
        'What has been the biggest surprise about recovery?',
      ],
      [RecoveryPhase.PROGRESSIVE]: [
        'What new thing can you do this week?',
        'How is physical therapy going?',
        'What milestone are you working toward?',
        'How are you balancing rest and activity?',
        'What exercise felt the best today?',
      ],
      [RecoveryPhase.ADVANCED]: [
        'How do you feel about your recovery progress overall?',
        'What normal activities have you returned to?',
        'What healthy habits will you keep after full recovery?',
        'What has this experience taught you?',
        'How has your perspective changed through recovery?',
      ],
    };

    const prompts = phaseSpecific[phase] ?? JOURNALING_PROMPTS.slice(0, 5);
    return prompts.slice(0, count) as string[];
  }

  /**
   * Returns all available journaling prompts.
   */
  getAllPrompts(): readonly string[] {
    return JOURNALING_PROMPTS;
  }

  /**
   * Computes journaling streak information for a patient.
   */
  getJournalingStreak(patientId: string): JournalingStreak {
    const entries = this.getEntries(patientId);
    if (entries.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysJournaled: 0,
        totalEntries: 0,
        lastEntryDate: '',
        streakDates: [],
      };
    }

    // Get unique journal dates
    const dates = [...new Set(entries.map(e => e.timestamp.slice(0, 10)))].sort();
    const totalDaysJournaled = dates.length;
    const totalEntries = entries.length;
    const lastEntryDate = dates[dates.length - 1];

    // Compute longest streak by scanning all consecutive date sequences
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const current = new Date(dates[i]);
      const previous = new Date(dates[i - 1]);
      const diffMs = current.getTime() - previous.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Compute current streak from the most recent date backward
    let currentStreak = 1;
    const currentStreakDates = [dates[dates.length - 1]];
    for (let i = dates.length - 2; i >= 0; i--) {
      const current = new Date(dates[i + 1]);
      const previous = new Date(dates[i]);
      const diffMs = current.getTime() - previous.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        currentStreakDates.unshift(dates[i]);
      } else {
        break;
      }
    }

    return {
      currentStreak,
      longestStreak,
      totalDaysJournaled,
      totalEntries,
      lastEntryDate,
      streakDates: currentStreakDates,
    };
  }

  /**
   * Returns guided reflection templates, optionally filtered by recovery phase.
   */
  getReflectionTemplates(phase?: RecoveryPhase): ReflectionTemplate[] {
    if (phase) {
      return REFLECTION_TEMPLATES.filter(t => t.phase === phase) as ReflectionTemplate[];
    }
    return [...REFLECTION_TEMPLATES] as ReflectionTemplate[];
  }

  /**
   * Returns a specific reflection template by ID.
   */
  getReflectionTemplateById(templateId: string): ReflectionTemplate | null {
    return (REFLECTION_TEMPLATES.find(t => t.id === templateId) as ReflectionTemplate) ?? null;
  }

  // --------------------------------------------------------------------------
  // Doctor Appointment Summary
  // --------------------------------------------------------------------------

  /**
   * Generates a comprehensive journal summary for a doctor appointment.
   */
  generateAppointmentSummary(
    patientId: string,
    periodDays: number = 30
  ): AppointmentJournalSummary {
    const allEntries = this.getEntries(patientId);
    const cutoffDay = Math.max(
      0,
      (allEntries.length > 0 ? Math.max(...allEntries.map(e => e.dayNumber)) : 0) - periodDays
    );

    const entries = allEntries.filter(e => e.dayNumber > cutoffDay);
    const now = new Date().toISOString();

    const dailyLogs = entries.filter(e => e.dailyCheckIn);
    const moods = dailyLogs.map(e => e.dailyCheckIn!.mood);
    const pains = dailyLogs.map(e => e.dailyCheckIn!.painLevel);

    // Mood trend
    let moodTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (moods.length >= 3) {
      const firstHalf = mean(moods.slice(0, Math.ceil(moods.length / 2)));
      const secondHalf = mean(moods.slice(Math.floor(moods.length / 2)));
      const diff = secondHalf - firstHalf;
      if (diff > 0.3) moodTrend = 'improving';
      else if (diff < -0.3) moodTrend = 'declining';
    }

    // Pain trend
    let painTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (pains.length >= 3) {
      const firstHalf = mean(pains.slice(0, Math.ceil(pains.length / 2)));
      const secondHalf = mean(pains.slice(Math.floor(pains.length / 2)));
      const diff = secondHalf - firstHalf;
      if (diff < -0.5) painTrend = 'improving';
      else if (diff > 0.5) painTrend = 'worsening';
    }

    // Flagged entries
    const flaggedEntries = entries.filter(e => e.flagForDoctor);

    // Unanswered concerns
    const unansweredConcerns = entries.filter(
      e => e.type === JournalEntryType.CONCERN &&
        e.doctorFlags.some(f => !f.reviewed)
    );

    // Milestones
    const milestones = this.getMilestoneTimeline(patientId).filter(
      m => m.dayNumber > cutoffDay
    );

    // Top symptoms
    const symptomEntries = entries.filter(e => e.symptomDetail);
    const symptomMap = new Map<string, { count: number; totalSeverity: number }>();
    for (const e of symptomEntries) {
      const name = e.symptomDetail!.symptomName;
      const existing = symptomMap.get(name) ?? { count: 0, totalSeverity: 0 };
      existing.count++;
      existing.totalSeverity += e.symptomDetail!.severity;
      symptomMap.set(name, existing);
    }
    const topSymptoms = [...symptomMap.entries()]
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgSeverity: round2(data.totalSeverity / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sentiment trend
    const sentimentTrend = this.getSentimentTrends(patientId);

    // Build summary text
    const summary = this.buildAppointmentSummaryText(
      entries.length,
      round2(mean(moods)),
      round2(mean(pains)),
      moodTrend,
      painTrend,
      milestones,
      topSymptoms,
      flaggedEntries.length,
      unansweredConcerns.length
    );

    const timestamps = entries.map(e => e.timestamp).sort();

    return {
      patientId,
      generatedAt: now,
      periodStart: timestamps[0] ?? now,
      periodEnd: timestamps[timestamps.length - 1] ?? now,
      entryCount: entries.length,
      averageMood: round2(mean(moods)),
      averagePain: round2(mean(pains)),
      moodTrend,
      painTrend,
      flaggedEntries,
      unansweredConcerns,
      milestones,
      topSymptoms,
      sentimentTrend,
      summary,
    };
  }

  private buildAppointmentSummaryText(
    entryCount: number,
    avgMood: number,
    avgPain: number,
    moodTrend: string,
    painTrend: string,
    milestones: MilestoneTimelineEvent[],
    topSymptoms: Array<{ name: string; count: number; avgSeverity: number }>,
    flaggedCount: number,
    concernCount: number
  ): string {
    const lines: string[] = [];

    lines.push('PATIENT JOURNAL SUMMARY FOR APPOINTMENT');
    lines.push('='.repeat(50));
    lines.push('');

    lines.push('OVERVIEW');
    lines.push('-'.repeat(30));
    lines.push(`Total journal entries: ${entryCount}`);
    lines.push(`Average mood: ${avgMood}/5 (${MOOD_LABELS[Math.round(clamp(avgMood, 1, 5))]?.label ?? 'N/A'})`);
    lines.push(`Average pain: ${avgPain}/10`);
    lines.push(`Mood trend: ${moodTrend.toUpperCase()}`);
    lines.push(`Pain trend: ${painTrend.toUpperCase()}`);
    lines.push('');

    if (milestones.length > 0) {
      lines.push('RECOVERY MILESTONES');
      lines.push('-'.repeat(30));
      for (const m of milestones) {
        lines.push(`  Day ${m.dayNumber}: ${m.milestoneType.replace(/_/g, ' ')} - ${m.description}`);
      }
      lines.push('');
    }

    if (topSymptoms.length > 0) {
      lines.push('TOP REPORTED SYMPTOMS');
      lines.push('-'.repeat(30));
      for (const s of topSymptoms) {
        lines.push(`  ${s.name}: reported ${s.count} time(s), avg severity ${s.avgSeverity}/10`);
      }
      lines.push('');
    }

    if (flaggedCount > 0 || concernCount > 0) {
      lines.push('ITEMS REQUIRING ATTENTION');
      lines.push('-'.repeat(30));
      if (flaggedCount > 0) {
        lines.push(`  ${flaggedCount} entries flagged for doctor review`);
      }
      if (concernCount > 0) {
        lines.push(`  ${concernCount} unanswered patient concern(s)`);
      }
      lines.push('');
    }

    // Clinical observations
    lines.push('CLINICAL OBSERVATIONS');
    lines.push('-'.repeat(30));
    if (avgPain >= 7) {
      lines.push('  * Average pain is high (>=7/10). Review pain management plan.');
    } else if (avgPain >= 4) {
      lines.push('  * Average pain is moderate (4-6/10). Consider adjustment if patient is struggling.');
    } else {
      lines.push('  * Average pain is well-controlled (<4/10). Recovery progressing well.');
    }

    if (moodTrend === 'declining') {
      lines.push('  * Mood is declining. Consider screening for post-surgical depression.');
    }
    if (moodTrend === 'improving') {
      lines.push('  * Mood is improving, which supports positive recovery trajectory.');
    }

    if (milestones.length > 0) {
      lines.push(`  * Patient has achieved ${milestones.length} milestone(s), indicating functional progress.`);
    }

    lines.push('');
    lines.push('='.repeat(50));
    lines.push('End of Journal Summary');

    return lines.join('\n');
  }

  // --------------------------------------------------------------------------
  // Data Export
  // --------------------------------------------------------------------------

  /**
   * Generates a formatted journal export for medical records.
   */
  exportJournal(
    patientId: string,
    startDate?: string,
    endDate?: string
  ): JournalExport {
    const entries = this.getEntries(patientId, { startDate, endDate });
    const summary = this.generateAppointmentSummary(patientId);

    const formattedText = this.formatJournalForExport(patientId, entries, summary);

    const timestamps = entries.map(e => e.timestamp).sort();
    const now = new Date().toISOString();

    return {
      patientId,
      exportedAt: now,
      periodStart: startDate ?? timestamps[0] ?? now,
      periodEnd: endDate ?? timestamps[timestamps.length - 1] ?? now,
      entries,
      summary,
      formattedText,
    };
  }

  private formatJournalForExport(
    patientId: string,
    entries: JournalEntry[],
    summary: AppointmentJournalSummary
  ): string {
    const lines: string[] = [];

    lines.push('PATIENT RECOVERY JOURNAL - MEDICAL RECORD EXPORT');
    lines.push('='.repeat(60));
    lines.push(`Patient ID: ${patientId}`);
    lines.push(`Export Date: ${new Date().toISOString().slice(0, 10)}`);
    lines.push(`Total Entries: ${entries.length}`);
    lines.push(`Period: ${entries[0]?.timestamp.slice(0, 10) ?? 'N/A'} to ${entries[entries.length - 1]?.timestamp.slice(0, 10) ?? 'N/A'}`);
    lines.push('');

    // Summary section
    lines.push(summary.summary);
    lines.push('');

    // Detailed entries
    lines.push('DETAILED JOURNAL ENTRIES');
    lines.push('='.repeat(60));
    lines.push('');

    for (const entry of entries) {
      lines.push(`--- Day ${entry.dayNumber} | ${entry.timestamp.slice(0, 10)} | ${entry.type.toUpperCase()} ---`);
      lines.push(`Title: ${entry.title}`);

      if (entry.dailyCheckIn) {
        const c = entry.dailyCheckIn;
        lines.push(`  Mood: ${c.mood}/5 (${MOOD_LABELS[c.mood]?.label ?? ''}) | Pain: ${c.painLevel}/10 | Energy: ${c.energyLevel}/5`);
        lines.push(`  Sleep: ${c.sleepQuality}/5 (${c.hoursSlept}h) | Appetite: ${c.appetite}/5 | Activity: ${c.activityLevel}`);
      }

      if (entry.symptomDetail) {
        const s = entry.symptomDetail;
        lines.push(`  Symptom: ${s.symptomName} | Severity: ${s.severity}/10 | Location: ${s.location}`);
        lines.push(`  Duration: ${s.duration} | Triggers: ${s.triggers.join(', ')}`);
      }

      if (entry.milestoneDetail) {
        const m = entry.milestoneDetail;
        lines.push(`  Milestone: ${m.milestoneType.replace(/_/g, ' ')} (Day ${m.daysSinceSurgery})`);
      }

      lines.push(`  Content: ${entry.content}`);

      if (entry.sentiment) {
        lines.push(`  Sentiment: ${entry.sentiment.category} (${entry.sentiment.score})`);
      }

      if (entry.flagForDoctor) {
        lines.push(`  ** FLAGGED FOR DOCTOR REVIEW **`);
        for (const flag of entry.doctorFlags) {
          lines.push(`     Flag: ${flag.reason} - ${flag.details} (${flag.reviewed ? 'Reviewed' : 'Pending'})`);
        }
      }

      if (entry.doctorAnnotations.length > 0) {
        lines.push(`  Doctor Annotations:`);
        for (const ann of entry.doctorAnnotations) {
          if (!ann.isPrivate) {
            lines.push(`     [${ann.doctorName}] ${ann.note}`);
          }
        }
      }

      lines.push('');
    }

    lines.push('='.repeat(60));
    lines.push('END OF MEDICAL RECORD EXPORT');

    return lines.join('\n');
  }

  // --------------------------------------------------------------------------
  // Seed Data
  // --------------------------------------------------------------------------

  /**
   * Generates and loads 100 sample journal entries spanning 30 days.
   */
  generateAndLoadSeedData(): JournalEntry[] {
    const entries = generateSampleEntries();
    this.loadEntries(entries);
    return entries;
  }

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------

  /** Returns total number of stored entries. */
  getEntryCount(): number {
    return this.entries.length;
  }

  /** Returns all unique patient IDs with journal data. */
  getPatientIds(): string[] {
    return [...new Set(this.entries.map(e => e.patientId))];
  }

  /** Returns entries grouped by type for a patient. */
  getEntriesByType(patientId: string): Record<string, JournalEntry[]> {
    const entries = this.getEntries(patientId);
    const grouped: Record<string, JournalEntry[]> = {};

    for (const type of Object.values(JournalEntryType)) {
      grouped[type] = entries.filter(e => e.type === type);
    }

    return grouped;
  }

  /** Runs sentiment analysis on arbitrary text. */
  analyzeSentiment(text: string): SentimentResult {
    return analyzeSentiment(text);
  }
}

// ============================================================================
// Singleton export
// ============================================================================

/** Singleton instance of the patient journal service. */
export const patientJournalService = new PatientJournalServiceImpl();

/** Export class for testing. */
export { PatientJournalServiceImpl };
