/**
 * GamificationEngine - Comprehensive gamification system for patient recovery
 *
 * Extends the existing streak system with achievements, XP, levels, leaderboards,
 * challenges, and a virtual reward store to drive patient engagement throughout
 * the recovery journey.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 11.2, 11.3
 * No external dependencies.
 */

// ============================================================================
// Constants & Enums (const-object pattern for erasableSyntaxOnly)
// ============================================================================

export const BadgeCategory = {
  STREAK: 'streak',
  MISSION: 'mission',
  MEDICATION: 'medication',
  EXERCISE: 'exercise',
  PHOTO: 'photo',
  SOCIAL: 'social',
  MILESTONE: 'milestone',
  SECRET: 'secret',
} as const;
export type BadgeCategory = typeof BadgeCategory[keyof typeof BadgeCategory];

export const BadgeRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;
export type BadgeRarity = typeof BadgeRarity[keyof typeof BadgeRarity];

export const ChallengeType = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  RECOVERY_PHASE: 'recovery_phase',
} as const;
export type ChallengeType = typeof ChallengeType[keyof typeof ChallengeType];

export const ChallengeStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const;
export type ChallengeStatus = typeof ChallengeStatus[keyof typeof ChallengeStatus];

export const RewardCategory = {
  THEME: 'theme',
  AVATAR: 'avatar',
  ANIMATION: 'animation',
  PROFILE_FLAIR: 'profile_flair',
  TITLE: 'title',
} as const;
export type RewardCategory = typeof RewardCategory[keyof typeof RewardCategory];

export const LeaderboardType = {
  WEEKLY_RECOVERY_SCORE: 'weekly_recovery_score',
  MISSION_COMPLETION: 'mission_completion',
  STREAK: 'streak',
} as const;
export type LeaderboardType = typeof LeaderboardType[keyof typeof LeaderboardType];

export const XPEventType = {
  MISSION_COMPLETE: 'mission_complete',
  JOURNAL_ENTRY: 'journal_entry',
  MEDICATION_ADHERENCE: 'medication_adherence',
  EXERCISE_COMPLETE: 'exercise_complete',
  PHOTO_UPLOAD: 'photo_upload',
  DAILY_LOGIN: 'daily_login',
  CHALLENGE_COMPLETE: 'challenge_complete',
  BADGE_EARNED: 'badge_earned',
  STREAK_BONUS: 'streak_bonus',
} as const;
export type XPEventType = typeof XPEventType[keyof typeof XPEventType];

// ============================================================================
// Type Definitions
// ============================================================================

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  iconEmoji: string;
  xpReward: number;
  /** Returns true when the badge should be awarded. */
  condition: (stats: PlayerStats) => boolean;
  /** If true, badge is hidden until earned. */
  secret: boolean;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string; // ISO date string
  seen: boolean;
}

export interface XPEvent {
  id: string;
  type: XPEventType;
  amount: number;
  multiplier: number;
  totalAwarded: number;
  description: string;
  timestamp: string; // ISO date string
}

export interface LevelDefinition {
  level: number;
  name: string;
  title: string;
  xpRequired: number;
  cumulativeXP: number;
  reward: string;
}

export interface PlayerLevel {
  current: LevelDefinition;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  totalXP: number;
}

export interface LeaderboardEntry {
  rank: number;
  anonymousId: string;
  displayName: string;
  score: number;
  isSelf: boolean;
}

export interface LeaderboardConfig {
  optedIn: boolean;
  anonymousId: string;
}

export interface ChallengeDefinition {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  xpReward: number;
  target: number;
  metric: string;
  recoveryWeek?: number; // For recovery_phase challenges
}

export interface ActiveChallenge {
  challengeId: string;
  status: ChallengeStatus;
  progress: number;
  target: number;
  startedAt: string; // ISO date string
  expiresAt: string; // ISO date string
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  cost: number;
  iconEmoji: string;
  preview?: string;
}

export interface PurchasedReward {
  rewardId: string;
  purchasedAt: string; // ISO date string
  equipped: boolean;
}

/**
 * Cumulative player statistics used for badge condition evaluation,
 * leaderboard scoring, and challenge progress tracking.
 */
export interface PlayerStats {
  // Identity
  patientId: string;

  // Streaks
  currentStreak: number;
  longestStreak: number;

  // Missions
  totalMissionsCompleted: number;
  perfectDays: number; // Days where all missions were completed
  missionsCompletedToday: number;
  totalMissionsToday: number;

  // Medication
  medicationPerfectDays: number; // Consecutive perfect adherence days
  totalMedicationDoses: number;
  medicationPerfectStreak: number;

  // Exercise
  exerciseDaysTotal: number;
  exerciseCurrentStreak: number;
  exerciseMinutesTotal: number;
  flexibilityExercises: number;
  strengthExercises: number;
  cardioExercises: number;

  // Photos
  totalPhotosUploaded: number;

  // Social / Engagement
  totalJournalEntries: number;
  chatMessagesCount: number;
  questionsAsked: number;

  // Milestones
  daysSinceSurgery: number;
  discharged: boolean;

  // Time-based
  lastActivityHour: number; // 0-23
  totalLoginDays: number;
  consecutiveLoginDays: number;

  // XP & Level
  totalXP: number;
  currentLevel: number;
  xpSpent: number;

  // Challenges
  challengesCompleted: number;
  dailyChallengesCompleted: number;
  weeklyChallengesCompleted: number;
}

/**
 * Full persisted gamification profile for a patient.
 */
export interface GamificationProfile {
  patientId: string;
  stats: PlayerStats;
  earnedBadges: EarnedBadge[];
  xpHistory: XPEvent[];
  activeChallenges: ActiveChallenge[];
  purchasedRewards: PurchasedReward[];
  leaderboardConfig: LeaderboardConfig;
  lastDailyBonusDate: string | null;
  lastDailyChallengeDate: string | null;
  lastWeeklyChallengeDate: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ============================================================================
// Storage Key
// ============================================================================

const GAMIFICATION_STORAGE_KEY = 'recovery_pilot_gamification';

// ============================================================================
// Badge Definitions (60+)
// ============================================================================

function createBadge(
  id: string,
  name: string,
  description: string,
  category: BadgeCategory,
  rarity: BadgeRarity,
  iconEmoji: string,
  xpReward: number,
  condition: (stats: PlayerStats) => boolean,
  secret = false,
): BadgeDefinition {
  return { id, name, description, category, rarity, iconEmoji, xpReward, condition, secret };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ---------------------------------------------------------------------------
  // Streak Badges (8)
  // ---------------------------------------------------------------------------
  createBadge('streak-first', 'First Streak', 'Achieve a 3-day streak', BadgeCategory.STREAK, BadgeRarity.COMMON, '🔥', 25, (s) => s.currentStreak >= 3),
  createBadge('streak-week', 'Week Warrior', 'Maintain a 7-day streak', BadgeCategory.STREAK, BadgeRarity.UNCOMMON, '⚡', 50, (s) => s.currentStreak >= 7),
  createBadge('streak-fortnight', 'Fortnight Fighter', 'Maintain a 14-day streak', BadgeCategory.STREAK, BadgeRarity.RARE, '💎', 100, (s) => s.currentStreak >= 14),
  createBadge('streak-unstoppable', 'Unstoppable', 'Maintain a 30-day streak', BadgeCategory.STREAK, BadgeRarity.EPIC, '🚀', 200, (s) => s.currentStreak >= 30),
  createBadge('streak-legend', 'Streak Legend', 'Maintain a 60-day streak', BadgeCategory.STREAK, BadgeRarity.LEGENDARY, '👑', 500, (s) => s.currentStreak >= 60),
  createBadge('streak-century', 'Century Streak', 'Maintain a 100-day streak', BadgeCategory.STREAK, BadgeRarity.LEGENDARY, '💯', 1000, (s) => s.currentStreak >= 100),
  createBadge('streak-comeback', 'Comeback Kid', 'Rebuild a streak after losing one', BadgeCategory.STREAK, BadgeRarity.UNCOMMON, '🔄', 50, (s) => s.longestStreak > 0 && s.currentStreak >= 3 && s.currentStreak < s.longestStreak),
  createBadge('streak-personal-best', 'Personal Best', 'Set a new longest streak record', BadgeCategory.STREAK, BadgeRarity.RARE, '🏅', 75, (s) => s.currentStreak > 0 && s.currentStreak === s.longestStreak && s.longestStreak >= 5),

  // ---------------------------------------------------------------------------
  // Mission Badges (10)
  // ---------------------------------------------------------------------------
  createBadge('mission-first', 'First Mission', 'Complete your very first mission', BadgeCategory.MISSION, BadgeRarity.COMMON, '🎯', 15, (s) => s.totalMissionsCompleted >= 1),
  createBadge('mission-ten', 'Mission Enthusiast', 'Complete 10 missions', BadgeCategory.MISSION, BadgeRarity.COMMON, '📋', 30, (s) => s.totalMissionsCompleted >= 10),
  createBadge('mission-twentyfive', 'Mission Veteran', 'Complete 25 missions', BadgeCategory.MISSION, BadgeRarity.UNCOMMON, '🎖️', 75, (s) => s.totalMissionsCompleted >= 25),
  createBadge('mission-fifty', 'Mission Master', 'Complete 50 missions', BadgeCategory.MISSION, BadgeRarity.RARE, '🏆', 150, (s) => s.totalMissionsCompleted >= 50),
  createBadge('mission-hundred', 'Mission Centurion', 'Complete 100 missions', BadgeCategory.MISSION, BadgeRarity.EPIC, '💫', 300, (s) => s.totalMissionsCompleted >= 100),
  createBadge('mission-two-fifty', 'Mission Legend', 'Complete 250 missions', BadgeCategory.MISSION, BadgeRarity.LEGENDARY, '🌟', 500, (s) => s.totalMissionsCompleted >= 250),
  createBadge('mission-perfect-day', 'Perfect Day', 'Complete all missions in a single day', BadgeCategory.MISSION, BadgeRarity.UNCOMMON, '✨', 50, (s) => s.perfectDays >= 1),
  createBadge('mission-perfect-week', 'Perfect Week', 'Have 7 consecutive perfect days', BadgeCategory.MISSION, BadgeRarity.RARE, '🌈', 150, (s) => s.perfectDays >= 7),
  createBadge('mission-perfect-month', 'Perfect Month', 'Have 30 perfect days', BadgeCategory.MISSION, BadgeRarity.LEGENDARY, '🎊', 500, (s) => s.perfectDays >= 30),
  createBadge('mission-speedster', 'Speedster', 'Complete all daily missions before noon (logged 5 times)', BadgeCategory.MISSION, BadgeRarity.RARE, '⏱️', 100, (s) => s.missionsCompletedToday === s.totalMissionsToday && s.totalMissionsToday > 0 && s.lastActivityHour < 12 && s.perfectDays >= 5),

  // ---------------------------------------------------------------------------
  // Medication Badges (8)
  // ---------------------------------------------------------------------------
  createBadge('med-first', 'First Dose', 'Take your first medication dose', BadgeCategory.MEDICATION, BadgeRarity.COMMON, '💊', 10, (s) => s.totalMedicationDoses >= 1),
  createBadge('med-week', 'Pill Pro', '7 days of perfect medication adherence', BadgeCategory.MEDICATION, BadgeRarity.UNCOMMON, '💉', 75, (s) => s.medicationPerfectDays >= 7),
  createBadge('med-fortnight', 'Medication Maven', '14 days of perfect medication adherence', BadgeCategory.MEDICATION, BadgeRarity.RARE, '🧪', 150, (s) => s.medicationPerfectDays >= 14),
  createBadge('med-month', 'Medicine Master', '30 days of perfect medication adherence', BadgeCategory.MEDICATION, BadgeRarity.EPIC, '🏥', 300, (s) => s.medicationPerfectDays >= 30),
  createBadge('med-streak-five', 'Dosage Streak', '5-day medication adherence streak', BadgeCategory.MEDICATION, BadgeRarity.COMMON, '📆', 30, (s) => s.medicationPerfectStreak >= 5),
  createBadge('med-streak-twenty', 'Iron Adherence', '20-day medication adherence streak', BadgeCategory.MEDICATION, BadgeRarity.RARE, '🛡️', 150, (s) => s.medicationPerfectStreak >= 20),
  createBadge('med-fifty-doses', 'Dose Counter', 'Take 50 total medication doses', BadgeCategory.MEDICATION, BadgeRarity.UNCOMMON, '🔢', 50, (s) => s.totalMedicationDoses >= 50),
  createBadge('med-hundred-doses', 'Century of Doses', 'Take 100 total medication doses', BadgeCategory.MEDICATION, BadgeRarity.RARE, '💯', 100, (s) => s.totalMedicationDoses >= 100),

  // ---------------------------------------------------------------------------
  // Exercise Badges (10)
  // ---------------------------------------------------------------------------
  createBadge('exercise-first', 'First Steps', 'Complete your first exercise session', BadgeCategory.EXERCISE, BadgeRarity.COMMON, '🚶', 15, (s) => s.exerciseDaysTotal >= 1),
  createBadge('exercise-week', 'Active Week', 'Exercise for 7 days', BadgeCategory.EXERCISE, BadgeRarity.UNCOMMON, '🏃', 50, (s) => s.exerciseDaysTotal >= 7),
  createBadge('exercise-marathon-month', 'Marathon Month', '30 days of exercise', BadgeCategory.EXERCISE, BadgeRarity.EPIC, '🏅', 300, (s) => s.exerciseDaysTotal >= 30),
  createBadge('exercise-streak-week', 'Exercise Streak', '7-day exercise streak', BadgeCategory.EXERCISE, BadgeRarity.UNCOMMON, '🔗', 75, (s) => s.exerciseCurrentStreak >= 7),
  createBadge('exercise-streak-month', 'Iron Will', '30-day exercise streak', BadgeCategory.EXERCISE, BadgeRarity.LEGENDARY, '⛓️', 400, (s) => s.exerciseCurrentStreak >= 30),
  createBadge('exercise-flex-champ', 'Flexibility Champion', 'Complete 20 flexibility exercises', BadgeCategory.EXERCISE, BadgeRarity.RARE, '🧘', 100, (s) => s.flexibilityExercises >= 20),
  createBadge('exercise-strength', 'Strength Builder', 'Complete 20 strength exercises', BadgeCategory.EXERCISE, BadgeRarity.RARE, '💪', 100, (s) => s.strengthExercises >= 20),
  createBadge('exercise-cardio', 'Cardio King', 'Complete 20 cardio sessions', BadgeCategory.EXERCISE, BadgeRarity.RARE, '❤️', 100, (s) => s.cardioExercises >= 20),
  createBadge('exercise-60-min', 'Hour Power', 'Accumulate 60 minutes of exercise', BadgeCategory.EXERCISE, BadgeRarity.UNCOMMON, '⏰', 60, (s) => s.exerciseMinutesTotal >= 60),
  createBadge('exercise-300-min', 'Endurance Elite', 'Accumulate 300 minutes of exercise', BadgeCategory.EXERCISE, BadgeRarity.EPIC, '🏋️', 250, (s) => s.exerciseMinutesTotal >= 300),

  // ---------------------------------------------------------------------------
  // Photo Badges (6)
  // ---------------------------------------------------------------------------
  createBadge('photo-first', 'First Snapshot', 'Upload your first wound photo', BadgeCategory.PHOTO, BadgeRarity.COMMON, '📸', 15, (s) => s.totalPhotosUploaded >= 1),
  createBadge('photo-five', 'Shutterbug', 'Upload 5 wound photos', BadgeCategory.PHOTO, BadgeRarity.COMMON, '📷', 30, (s) => s.totalPhotosUploaded >= 5),
  createBadge('photo-ten', 'Photo Tracker', 'Upload 10 wound photos', BadgeCategory.PHOTO, BadgeRarity.UNCOMMON, '🖼️', 60, (s) => s.totalPhotosUploaded >= 10),
  createBadge('photo-twenty', 'Visual Documentarian', 'Upload 20 wound photos', BadgeCategory.PHOTO, BadgeRarity.RARE, '🎞️', 100, (s) => s.totalPhotosUploaded >= 20),
  createBadge('photo-journalist', 'Photo Journalist', 'Upload 30 wound photos', BadgeCategory.PHOTO, BadgeRarity.EPIC, '📰', 200, (s) => s.totalPhotosUploaded >= 30),
  createBadge('photo-fifty', 'Recovery Archivist', 'Upload 50 wound photos', BadgeCategory.PHOTO, BadgeRarity.LEGENDARY, '🏛️', 400, (s) => s.totalPhotosUploaded >= 50),

  // ---------------------------------------------------------------------------
  // Social / Engagement Badges (7)
  // ---------------------------------------------------------------------------
  createBadge('social-first-journal', 'Conversation Starter', 'Write your first journal entry', BadgeCategory.SOCIAL, BadgeRarity.COMMON, '📝', 15, (s) => s.totalJournalEntries >= 1),
  createBadge('social-journal-ten', 'Reflective Writer', 'Write 10 journal entries', BadgeCategory.SOCIAL, BadgeRarity.UNCOMMON, '📖', 50, (s) => s.totalJournalEntries >= 10),
  createBadge('social-journal-thirty', 'Daily Chronicler', 'Write 30 journal entries', BadgeCategory.SOCIAL, BadgeRarity.RARE, '📚', 150, (s) => s.totalJournalEntries >= 30),
  createBadge('social-engaged', 'Engaged Patient', 'Send 10 chat messages', BadgeCategory.SOCIAL, BadgeRarity.COMMON, '💬', 25, (s) => s.chatMessagesCount >= 10),
  createBadge('social-communicator', 'Communicator', 'Send 50 chat messages', BadgeCategory.SOCIAL, BadgeRarity.UNCOMMON, '🗣️', 75, (s) => s.chatMessagesCount >= 50),
  createBadge('social-curious', 'Curious Mind', 'Ask 5 questions', BadgeCategory.SOCIAL, BadgeRarity.COMMON, '❓', 20, (s) => s.questionsAsked >= 5),
  createBadge('social-inquisitive', 'Inquisitive Spirit', 'Ask 20 questions', BadgeCategory.SOCIAL, BadgeRarity.UNCOMMON, '🔍', 60, (s) => s.questionsAsked >= 20),

  // ---------------------------------------------------------------------------
  // Milestone Badges (7)
  // ---------------------------------------------------------------------------
  createBadge('milestone-week-1', 'Week 1 Complete', 'Survive the first week of recovery', BadgeCategory.MILESTONE, BadgeRarity.COMMON, '📅', 50, (s) => s.daysSinceSurgery >= 7),
  createBadge('milestone-week-2', 'Week 2 Complete', 'Two weeks into recovery', BadgeCategory.MILESTONE, BadgeRarity.COMMON, '🗓️', 50, (s) => s.daysSinceSurgery >= 14),
  createBadge('milestone-month-1', 'Month 1 Complete', 'One full month of recovery', BadgeCategory.MILESTONE, BadgeRarity.UNCOMMON, '🌙', 100, (s) => s.daysSinceSurgery >= 30),
  createBadge('milestone-month-2', 'Month 2 Complete', 'Two months of recovery', BadgeCategory.MILESTONE, BadgeRarity.RARE, '🌗', 150, (s) => s.daysSinceSurgery >= 60),
  createBadge('milestone-month-3', 'Quarter Year', 'Three months of recovery', BadgeCategory.MILESTONE, BadgeRarity.EPIC, '🌕', 250, (s) => s.daysSinceSurgery >= 90),
  createBadge('milestone-discharged', 'Discharged!', 'Successfully discharged from care', BadgeCategory.MILESTONE, BadgeRarity.LEGENDARY, '🎓', 1000, (s) => s.discharged),
  createBadge('milestone-login-30', 'Dedicated Patient', 'Log in for 30 different days', BadgeCategory.MILESTONE, BadgeRarity.RARE, '🔑', 100, (s) => s.totalLoginDays >= 30),

  // ---------------------------------------------------------------------------
  // Secret Badges (8)
  // ---------------------------------------------------------------------------
  createBadge('secret-night-owl', 'Night Owl', 'Complete a mission after 10pm', BadgeCategory.SECRET, BadgeRarity.RARE, '🦉', 75, (s) => s.lastActivityHour >= 22, true),
  createBadge('secret-early-bird', 'Early Bird', 'Complete a mission before 6am', BadgeCategory.SECRET, BadgeRarity.RARE, '🐦', 75, (s) => s.lastActivityHour < 6 && s.totalMissionsCompleted > 0, true),
  createBadge('secret-weekend-warrior', 'Weekend Warrior', 'Complete missions on 4 consecutive weekends', BadgeCategory.SECRET, BadgeRarity.EPIC, '🎯', 150, (s) => s.perfectDays >= 8 && s.currentStreak >= 14, true),
  createBadge('secret-perfectionist', 'Perfectionist', 'Earn 10 other badges', BadgeCategory.SECRET, BadgeRarity.EPIC, '🎪', 200, (s) => s.challengesCompleted >= 10, true),
  createBadge('secret-xp-hoarder', 'XP Hoarder', 'Accumulate 5000 XP without spending any', BadgeCategory.SECRET, BadgeRarity.RARE, '🐉', 100, (s) => s.totalXP >= 5000 && s.xpSpent === 0, true),
  createBadge('secret-max-level', 'Transcended', 'Reach the maximum level', BadgeCategory.SECRET, BadgeRarity.LEGENDARY, '🌌', 1000, (s) => s.currentLevel >= 20, true),
  createBadge('secret-all-categories', 'Renaissance Patient', 'Earn at least one badge from every non-secret category', BadgeCategory.SECRET, BadgeRarity.LEGENDARY, '🎭', 500, (s) => {
    // This checks that the player has enough activity to have likely earned a badge in each category.
    return s.currentStreak >= 3 &&
      s.totalMissionsCompleted >= 1 &&
      s.totalMedicationDoses >= 1 &&
      s.exerciseDaysTotal >= 1 &&
      s.totalPhotosUploaded >= 1 &&
      s.totalJournalEntries >= 1 &&
      s.daysSinceSurgery >= 7;
  }, true),
  createBadge('secret-challenge-king', 'Challenge Conqueror', 'Complete 25 challenges', BadgeCategory.SECRET, BadgeRarity.EPIC, '👑', 300, (s) => s.challengesCompleted >= 25, true),
];

// ============================================================================
// Level Definitions (20 levels, exponential XP curve)
// ============================================================================

function buildLevelDefinitions(): LevelDefinition[] {
  const levelData: Array<{ name: string; title: string; reward: string }> = [
    { name: 'Resting Rookie', title: 'Rookie', reward: 'Welcome badge unlocked' },
    { name: 'Healing Novice', title: 'Novice', reward: 'Blue theme unlocked' },
    { name: 'Recovery Apprentice', title: 'Apprentice', reward: 'Custom avatar border' },
    { name: 'Wellness Seeker', title: 'Seeker', reward: 'Green theme unlocked' },
    { name: 'Health Scout', title: 'Scout', reward: 'Sparkle celebration animation' },
    { name: 'Recovery Ranger', title: 'Ranger', reward: 'Purple theme unlocked' },
    { name: 'Vitality Adept', title: 'Adept', reward: 'Gold avatar border' },
    { name: 'Healing Knight', title: 'Knight', reward: 'Sunrise theme unlocked' },
    { name: 'Wellness Guardian', title: 'Guardian', reward: 'Fireworks celebration animation' },
    { name: 'Recovery Sentinel', title: 'Sentinel', reward: 'Ocean theme unlocked' },
    { name: 'Health Champion', title: 'Champion', reward: 'Diamond avatar border' },
    { name: 'Vitality Hero', title: 'Hero', reward: 'Forest theme unlocked' },
    { name: 'Healing Sage', title: 'Sage', reward: 'Rainbow celebration animation' },
    { name: 'Wellness Master', title: 'Master', reward: 'Cosmic theme unlocked' },
    { name: 'Recovery Virtuoso', title: 'Virtuoso', reward: 'Platinum avatar border' },
    { name: 'Health Paragon', title: 'Paragon', reward: 'Aurora theme unlocked' },
    { name: 'Vitality Legend', title: 'Legend', reward: 'Legendary celebration animation' },
    { name: 'Healing Titan', title: 'Titan', reward: 'Ember theme unlocked' },
    { name: 'Wellness Warrior', title: 'Warrior', reward: 'Animated profile badge' },
    { name: 'Recovery Champion', title: 'Champion Supreme', reward: 'All themes and animations unlocked' },
  ];

  const BASE_XP = 100;
  const GROWTH_FACTOR = 1.35;
  let cumulativeXP = 0;

  return levelData.map((data, index) => {
    const level = index + 1;
    const xpRequired = Math.round(BASE_XP * Math.pow(GROWTH_FACTOR, index));
    cumulativeXP += xpRequired;
    return {
      level,
      name: data.name,
      title: data.title,
      xpRequired,
      cumulativeXP,
      reward: data.reward,
    };
  });
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = buildLevelDefinitions();

// ============================================================================
// XP Configuration
// ============================================================================

const XP_VALUES = {
  MISSION_EASY: 10,
  MISSION_MEDIUM: 25,
  MISSION_HARD: 50,
  JOURNAL_ENTRY: 15,
  MEDICATION_PERFECT_DAY: 20,
  EXERCISE_COMPLETE: 25,
  PHOTO_UPLOAD: 30,
  DAILY_LOGIN_BONUS: 10,
  CHALLENGE_DAILY: 50,
  CHALLENGE_WEEKLY: 150,
  CHALLENGE_RECOVERY_PHASE: 200,
} as const;

const STREAK_MULTIPLIERS: Array<{ minDays: number; multiplier: number }> = [
  { minDays: 30, multiplier: 3.0 },
  { minDays: 14, multiplier: 2.0 },
  { minDays: 7, multiplier: 1.5 },
  { minDays: 0, multiplier: 1.0 },
];

// ============================================================================
// Daily Challenge Pool (30+)
// ============================================================================

const DAILY_CHALLENGE_POOL: ChallengeDefinition[] = [
  { id: 'dc-all-missions', type: ChallengeType.DAILY, title: 'Mission Sweep', description: 'Complete all of today\'s missions', xpReward: 50, target: 1, metric: 'perfect_day' },
  { id: 'dc-photo', type: ChallengeType.DAILY, title: 'Snapshot', description: 'Upload a wound photo today', xpReward: 30, target: 1, metric: 'photos_today' },
  { id: 'dc-medication', type: ChallengeType.DAILY, title: 'On the Dot', description: 'Take all medications on time', xpReward: 40, target: 1, metric: 'medication_perfect_today' },
  { id: 'dc-journal', type: ChallengeType.DAILY, title: 'Thoughtful Day', description: 'Write a journal entry', xpReward: 30, target: 1, metric: 'journal_today' },
  { id: 'dc-exercise', type: ChallengeType.DAILY, title: 'Get Moving', description: 'Complete an exercise session', xpReward: 35, target: 1, metric: 'exercise_today' },
  { id: 'dc-early-mission', type: ChallengeType.DAILY, title: 'Early Start', description: 'Complete a mission before 9am', xpReward: 40, target: 1, metric: 'early_mission' },
  { id: 'dc-two-missions', type: ChallengeType.DAILY, title: 'Double Down', description: 'Complete at least 2 missions', xpReward: 30, target: 2, metric: 'missions_today' },
  { id: 'dc-three-missions', type: ChallengeType.DAILY, title: 'Hat Trick', description: 'Complete at least 3 missions', xpReward: 45, target: 3, metric: 'missions_today' },
  { id: 'dc-check-in', type: ChallengeType.DAILY, title: 'Check In', description: 'Log in and view your dashboard', xpReward: 15, target: 1, metric: 'login_today' },
  { id: 'dc-hydrate', type: ChallengeType.DAILY, title: 'Hydration Hero', description: 'Log your water intake for the day', xpReward: 20, target: 1, metric: 'hydration_logged' },
  { id: 'dc-stretch', type: ChallengeType.DAILY, title: 'Stretch It Out', description: 'Complete a stretching exercise', xpReward: 25, target: 1, metric: 'flexibility_exercise' },
  { id: 'dc-read-tip', type: ChallengeType.DAILY, title: 'Knowledge Seeker', description: 'Read a recovery tip of the day', xpReward: 15, target: 1, metric: 'tip_read' },
  { id: 'dc-mood', type: ChallengeType.DAILY, title: 'Mood Check', description: 'Log your mood today', xpReward: 20, target: 1, metric: 'mood_logged' },
  { id: 'dc-pain-log', type: ChallengeType.DAILY, title: 'Pain Tracker', description: 'Log your pain level today', xpReward: 20, target: 1, metric: 'pain_logged' },
  { id: 'dc-gratitude', type: ChallengeType.DAILY, title: 'Grateful Heart', description: 'Write one thing you\'re grateful for', xpReward: 20, target: 1, metric: 'gratitude_entry' },
  { id: 'dc-deep-breath', type: ChallengeType.DAILY, title: 'Deep Breaths', description: 'Complete a breathing exercise', xpReward: 20, target: 1, metric: 'breathing_exercise' },
  { id: 'dc-walk', type: ChallengeType.DAILY, title: 'Step by Step', description: 'Take a short walk today', xpReward: 25, target: 1, metric: 'walk_logged' },
  { id: 'dc-sleep-log', type: ChallengeType.DAILY, title: 'Sweet Dreams', description: 'Log your sleep quality', xpReward: 20, target: 1, metric: 'sleep_logged' },
  { id: 'dc-vitals', type: ChallengeType.DAILY, title: 'Vital Signs', description: 'Record your vitals today', xpReward: 25, target: 1, metric: 'vitals_logged' },
  { id: 'dc-question', type: ChallengeType.DAILY, title: 'Ask Away', description: 'Ask a question about your recovery', xpReward: 20, target: 1, metric: 'question_asked' },
  { id: 'dc-perfect-timing', type: ChallengeType.DAILY, title: 'Perfect Timing', description: 'Complete all missions within their scheduled window', xpReward: 60, target: 1, metric: 'all_on_time' },
  { id: 'dc-review-progress', type: ChallengeType.DAILY, title: 'Progress Check', description: 'Review your recovery progress chart', xpReward: 15, target: 1, metric: 'progress_reviewed' },
  { id: 'dc-nutrition', type: ChallengeType.DAILY, title: 'Nutrition Check', description: 'Log a healthy meal today', xpReward: 20, target: 1, metric: 'nutrition_logged' },
  { id: 'dc-wound-care', type: ChallengeType.DAILY, title: 'Wound Care Pro', description: 'Complete your wound care routine', xpReward: 30, target: 1, metric: 'wound_care_done' },
  { id: 'dc-chat', type: ChallengeType.DAILY, title: 'Stay Connected', description: 'Send a message to your care team', xpReward: 20, target: 1, metric: 'chat_message' },
  { id: 'dc-no-skip', type: ChallengeType.DAILY, title: 'No Skips', description: 'Don\'t skip any scheduled mission today', xpReward: 40, target: 1, metric: 'no_skips' },
  { id: 'dc-evening-log', type: ChallengeType.DAILY, title: 'Evening Reflection', description: 'Complete an evening check-in', xpReward: 25, target: 1, metric: 'evening_checkin' },
  { id: 'dc-morning-routine', type: ChallengeType.DAILY, title: 'Morning Routine', description: 'Complete your morning mission set', xpReward: 35, target: 1, metric: 'morning_routine' },
  { id: 'dc-badge-check', type: ChallengeType.DAILY, title: 'Badge Hunter', description: 'Check your badge collection', xpReward: 10, target: 1, metric: 'badges_viewed' },
  { id: 'dc-compare-photos', type: ChallengeType.DAILY, title: 'Before & After', description: 'Compare your latest wound photo with an earlier one', xpReward: 25, target: 1, metric: 'photo_compared' },
  { id: 'dc-celebrate', type: ChallengeType.DAILY, title: 'Self-Celebration', description: 'Acknowledge one recovery win today', xpReward: 15, target: 1, metric: 'win_acknowledged' },
  { id: 'dc-posture', type: ChallengeType.DAILY, title: 'Posture Check', description: 'Do a posture correction exercise', xpReward: 20, target: 1, metric: 'posture_exercise' },
];

// ============================================================================
// Weekly Challenge Pool
// ============================================================================

const WEEKLY_CHALLENGE_POOL: ChallengeDefinition[] = [
  { id: 'wc-five-perfect', type: ChallengeType.WEEKLY, title: 'Five Perfect Days', description: 'Complete all missions for 5 days this week', xpReward: 150, target: 5, metric: 'perfect_days_this_week' },
  { id: 'wc-all-photos', type: ChallengeType.WEEKLY, title: 'Weekly Photo Album', description: 'Upload 5 wound photos this week', xpReward: 120, target: 5, metric: 'photos_this_week' },
  { id: 'wc-exercise-five', type: ChallengeType.WEEKLY, title: 'Active Five', description: 'Exercise on 5 different days this week', xpReward: 130, target: 5, metric: 'exercise_days_this_week' },
  { id: 'wc-journal-three', type: ChallengeType.WEEKLY, title: 'Reflective Week', description: 'Write 3 journal entries this week', xpReward: 100, target: 3, metric: 'journal_entries_this_week' },
  { id: 'wc-med-perfect', type: ChallengeType.WEEKLY, title: 'Perfect Adherence', description: 'Perfect medication adherence all week', xpReward: 175, target: 7, metric: 'med_perfect_days_this_week' },
  { id: 'wc-20-missions', type: ChallengeType.WEEKLY, title: 'Mission Marathon', description: 'Complete 20 missions this week', xpReward: 200, target: 20, metric: 'missions_this_week' },
  { id: 'wc-streak-maintain', type: ChallengeType.WEEKLY, title: 'Streak Keeper', description: 'Don\'t break your streak this entire week', xpReward: 125, target: 7, metric: 'streak_days_this_week' },
  { id: 'wc-variety', type: ChallengeType.WEEKLY, title: 'Variety Pack', description: 'Complete at least one of each mission type this week', xpReward: 140, target: 3, metric: 'mission_types_this_week' },
  { id: 'wc-early-bird', type: ChallengeType.WEEKLY, title: 'Early Bird Week', description: 'Complete a mission before 8am on 3 days', xpReward: 110, target: 3, metric: 'early_mission_days' },
  { id: 'wc-xp-500', type: ChallengeType.WEEKLY, title: 'XP Rush', description: 'Earn 500 XP this week', xpReward: 100, target: 500, metric: 'xp_this_week' },
];

// ============================================================================
// Recovery Phase Challenges
// ============================================================================

const RECOVERY_PHASE_CHALLENGES: ChallengeDefinition[] = [
  // Week 1: Focus on basics
  { id: 'rpc-w1-meds', type: ChallengeType.RECOVERY_PHASE, title: 'Foundation: Medications', description: 'Take all prescribed medications for 5 of 7 days', xpReward: 200, target: 5, metric: 'med_days', recoveryWeek: 1 },
  { id: 'rpc-w1-photos', type: ChallengeType.RECOVERY_PHASE, title: 'Foundation: Documentation', description: 'Upload at least 3 wound photos this week', xpReward: 150, target: 3, metric: 'photos', recoveryWeek: 1 },
  { id: 'rpc-w1-rest', type: ChallengeType.RECOVERY_PHASE, title: 'Foundation: Rest', description: 'Log rest and sleep for 5 days', xpReward: 150, target: 5, metric: 'rest_logged', recoveryWeek: 1 },

  // Week 2: Building habits
  { id: 'rpc-w2-streak', type: ChallengeType.RECOVERY_PHASE, title: 'Building Habits: Streak', description: 'Build a 5-day streak', xpReward: 200, target: 5, metric: 'streak', recoveryWeek: 2 },
  { id: 'rpc-w2-exercise', type: ChallengeType.RECOVERY_PHASE, title: 'Building Habits: Movement', description: 'Complete gentle exercises 3 times', xpReward: 175, target: 3, metric: 'exercise_sessions', recoveryWeek: 2 },
  { id: 'rpc-w2-journal', type: ChallengeType.RECOVERY_PHASE, title: 'Building Habits: Reflection', description: 'Write 3 journal entries about your recovery', xpReward: 150, target: 3, metric: 'journal_entries', recoveryWeek: 2 },

  // Week 3: Increasing activity
  { id: 'rpc-w3-missions', type: ChallengeType.RECOVERY_PHASE, title: 'Momentum: Missions', description: 'Complete 15 missions this week', xpReward: 250, target: 15, metric: 'missions', recoveryWeek: 3 },
  { id: 'rpc-w3-perfect', type: ChallengeType.RECOVERY_PHASE, title: 'Momentum: Perfect Days', description: 'Achieve 3 perfect days', xpReward: 225, target: 3, metric: 'perfect_days', recoveryWeek: 3 },

  // Week 4: Consolidating progress
  { id: 'rpc-w4-all-round', type: ChallengeType.RECOVERY_PHASE, title: 'Consolidation: All-Round', description: 'Complete photo, exercise, and medication missions every day for 5 days', xpReward: 300, target: 5, metric: 'all_type_days', recoveryWeek: 4 },
  { id: 'rpc-w4-streak-14', type: ChallengeType.RECOVERY_PHASE, title: 'Consolidation: Two-Week Streak', description: 'Reach a 14-day streak', xpReward: 300, target: 14, metric: 'streak', recoveryWeek: 4 },

  // Week 6: Advanced recovery
  { id: 'rpc-w6-master', type: ChallengeType.RECOVERY_PHASE, title: 'Advanced: Mastery', description: 'Complete 50 total missions', xpReward: 350, target: 50, metric: 'total_missions', recoveryWeek: 6 },
  { id: 'rpc-w6-level-10', type: ChallengeType.RECOVERY_PHASE, title: 'Advanced: Level Up', description: 'Reach level 10', xpReward: 300, target: 10, metric: 'level', recoveryWeek: 6 },

  // Week 8: Pre-discharge preparation
  { id: 'rpc-w8-independence', type: ChallengeType.RECOVERY_PHASE, title: 'Independence: Self-Care', description: 'Complete all missions independently for 7 days', xpReward: 400, target: 7, metric: 'independent_days', recoveryWeek: 8 },
];

// ============================================================================
// Reward Store Items
// ============================================================================

export const REWARD_STORE_ITEMS: RewardItem[] = [
  // Themes
  { id: 'theme-ocean', name: 'Ocean Breeze', description: 'A calming blue and teal theme', category: RewardCategory.THEME, cost: 200, iconEmoji: '🌊' },
  { id: 'theme-sunset', name: 'Golden Sunset', description: 'Warm orange and gold tones', category: RewardCategory.THEME, cost: 200, iconEmoji: '🌅' },
  { id: 'theme-forest', name: 'Forest Calm', description: 'Deep greens and earthy browns', category: RewardCategory.THEME, cost: 200, iconEmoji: '🌲' },
  { id: 'theme-midnight', name: 'Midnight Mode', description: 'Sleek dark theme with purple accents', category: RewardCategory.THEME, cost: 300, iconEmoji: '🌙' },
  { id: 'theme-cherry', name: 'Cherry Blossom', description: 'Soft pinks and whites inspired by spring', category: RewardCategory.THEME, cost: 300, iconEmoji: '🌸' },
  { id: 'theme-aurora', name: 'Aurora Borealis', description: 'Shifting greens and purples like the northern lights', category: RewardCategory.THEME, cost: 500, iconEmoji: '🌌' },
  { id: 'theme-golden', name: 'Golden Hour', description: 'Luxurious gold and cream palette', category: RewardCategory.THEME, cost: 750, iconEmoji: '✨' },

  // Avatar customizations
  { id: 'avatar-border-silver', name: 'Silver Border', description: 'A sleek silver border for your profile', category: RewardCategory.AVATAR, cost: 100, iconEmoji: '🔘' },
  { id: 'avatar-border-gold', name: 'Gold Border', description: 'A prestigious gold border for your profile', category: RewardCategory.AVATAR, cost: 250, iconEmoji: '🥇' },
  { id: 'avatar-border-diamond', name: 'Diamond Border', description: 'A rare diamond border for your profile', category: RewardCategory.AVATAR, cost: 500, iconEmoji: '💎' },
  { id: 'avatar-border-rainbow', name: 'Rainbow Border', description: 'An animated rainbow border', category: RewardCategory.AVATAR, cost: 750, iconEmoji: '🌈' },
  { id: 'avatar-bg-gradient', name: 'Gradient Background', description: 'Smooth gradient behind your avatar', category: RewardCategory.AVATAR, cost: 150, iconEmoji: '🎨' },
  { id: 'avatar-bg-sparkle', name: 'Sparkle Background', description: 'Twinkling sparkles behind your avatar', category: RewardCategory.AVATAR, cost: 300, iconEmoji: '💫' },
  { id: 'avatar-frame-medical', name: 'Medical Hero Frame', description: 'A frame celebrating your recovery', category: RewardCategory.AVATAR, cost: 400, iconEmoji: '🏥' },

  // Celebration animations
  { id: 'anim-confetti-gold', name: 'Golden Confetti', description: 'Gold confetti on mission completion', category: RewardCategory.ANIMATION, cost: 200, iconEmoji: '🎊' },
  { id: 'anim-fireworks', name: 'Fireworks', description: 'Fireworks burst on achievements', category: RewardCategory.ANIMATION, cost: 300, iconEmoji: '🎆' },
  { id: 'anim-stars', name: 'Starfall', description: 'Shooting stars across the screen', category: RewardCategory.ANIMATION, cost: 350, iconEmoji: '🌠' },
  { id: 'anim-hearts', name: 'Heart Shower', description: 'Hearts float up from below', category: RewardCategory.ANIMATION, cost: 250, iconEmoji: '💕' },
  { id: 'anim-rainbow-burst', name: 'Rainbow Burst', description: 'A rainbow explodes outward', category: RewardCategory.ANIMATION, cost: 500, iconEmoji: '🌈' },

  // Profile flair
  { id: 'flair-fire', name: 'Fire Flair', description: 'A fire icon next to your name', category: RewardCategory.PROFILE_FLAIR, cost: 150, iconEmoji: '🔥' },
  { id: 'flair-star', name: 'Star Flair', description: 'A star icon next to your name', category: RewardCategory.PROFILE_FLAIR, cost: 150, iconEmoji: '⭐' },
  { id: 'flair-crown', name: 'Crown Flair', description: 'A crown icon next to your name', category: RewardCategory.PROFILE_FLAIR, cost: 400, iconEmoji: '👑' },
  { id: 'flair-lightning', name: 'Lightning Flair', description: 'A lightning bolt next to your name', category: RewardCategory.PROFILE_FLAIR, cost: 200, iconEmoji: '⚡' },
  { id: 'flair-heart', name: 'Heart Flair', description: 'A heart icon next to your name', category: RewardCategory.PROFILE_FLAIR, cost: 100, iconEmoji: '❤️' },

  // Titles
  { id: 'title-survivor', name: 'Survivor Title', description: 'Display "Survivor" under your name', category: RewardCategory.TITLE, cost: 300, iconEmoji: '🛡️' },
  { id: 'title-champion', name: 'Champion Title', description: 'Display "Champion" under your name', category: RewardCategory.TITLE, cost: 500, iconEmoji: '🏆' },
  { id: 'title-legend', name: 'Legend Title', description: 'Display "Legend" under your name', category: RewardCategory.TITLE, cost: 1000, iconEmoji: '🌟' },
  { id: 'title-phoenix', name: 'Phoenix Title', description: 'Display "Phoenix" under your name', category: RewardCategory.TITLE, cost: 750, iconEmoji: '🔥' },
];

// ============================================================================
// Helper Utilities
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function todayISOString(): string {
  return new Date().toISOString();
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return () => {
    hash = (hash * 1664525 + 1013904223) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const result = [...array];
  const rng = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// Storage Helpers
// ============================================================================

function loadProfile(patientId: string): GamificationProfile | null {
  try {
    const raw = localStorage.getItem(`${GAMIFICATION_STORAGE_KEY}_${patientId}`);
    if (!raw) return null;
    return JSON.parse(raw) as GamificationProfile;
  } catch {
    return null;
  }
}

function saveProfile(profile: GamificationProfile): void {
  try {
    profile.updatedAt = todayISOString();
    localStorage.setItem(
      `${GAMIFICATION_STORAGE_KEY}_${profile.patientId}`,
      JSON.stringify(profile),
    );
  } catch {
    // Storage full or unavailable - fail silently for gamification
  }
}

function loadLeaderboardData(): Map<string, { anonymousId: string; scores: Record<string, number> }> {
  try {
    const raw = localStorage.getItem(`${GAMIFICATION_STORAGE_KEY}_leaderboard`);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Array<[string, { anonymousId: string; scores: Record<string, number> }]>;
    return new Map(parsed);
  } catch {
    return new Map();
  }
}

function saveLeaderboardData(data: Map<string, { anonymousId: string; scores: Record<string, number> }>): void {
  try {
    localStorage.setItem(
      `${GAMIFICATION_STORAGE_KEY}_leaderboard`,
      JSON.stringify(Array.from(data.entries())),
    );
  } catch {
    // Fail silently
  }
}

// ============================================================================
// Default Profile Factory
// ============================================================================

function createDefaultStats(patientId: string): PlayerStats {
  return {
    patientId,
    currentStreak: 0,
    longestStreak: 0,
    totalMissionsCompleted: 0,
    perfectDays: 0,
    missionsCompletedToday: 0,
    totalMissionsToday: 0,
    medicationPerfectDays: 0,
    totalMedicationDoses: 0,
    medicationPerfectStreak: 0,
    exerciseDaysTotal: 0,
    exerciseCurrentStreak: 0,
    exerciseMinutesTotal: 0,
    flexibilityExercises: 0,
    strengthExercises: 0,
    cardioExercises: 0,
    totalPhotosUploaded: 0,
    totalJournalEntries: 0,
    chatMessagesCount: 0,
    questionsAsked: 0,
    daysSinceSurgery: 0,
    discharged: false,
    lastActivityHour: new Date().getHours(),
    totalLoginDays: 0,
    consecutiveLoginDays: 0,
    totalXP: 0,
    currentLevel: 1,
    xpSpent: 0,
    challengesCompleted: 0,
    dailyChallengesCompleted: 0,
    weeklyChallengesCompleted: 0,
  };
}

function createDefaultProfile(patientId: string): GamificationProfile {
  const anonymousId = `player-${generateId()}`;
  return {
    patientId,
    stats: createDefaultStats(patientId),
    earnedBadges: [],
    xpHistory: [],
    activeChallenges: [],
    purchasedRewards: [],
    leaderboardConfig: {
      optedIn: false,
      anonymousId,
    },
    lastDailyBonusDate: null,
    lastDailyChallengeDate: null,
    lastWeeklyChallengeDate: null,
    createdAt: todayISOString(),
    updatedAt: todayISOString(),
  };
}

// ============================================================================
// Gamification Engine
// ============================================================================

class GamificationEngineImpl {
  // --------------------------------------------------------------------------
  // Profile Management
  // --------------------------------------------------------------------------

  /**
   * Get or create the gamification profile for a patient.
   */
  getProfile(patientId: string): GamificationProfile {
    const existing = loadProfile(patientId);
    if (existing) return existing;

    const profile = createDefaultProfile(patientId);
    saveProfile(profile);
    return profile;
  }

  /**
   * Reset the entire gamification profile for a patient.
   */
  resetProfile(patientId: string): GamificationProfile {
    const profile = createDefaultProfile(patientId);
    saveProfile(profile);
    return profile;
  }

  // --------------------------------------------------------------------------
  // XP System
  // --------------------------------------------------------------------------

  /**
   * Calculate the current streak multiplier.
   */
  getStreakMultiplier(currentStreak: number): number {
    for (const tier of STREAK_MULTIPLIERS) {
      if (currentStreak >= tier.minDays) {
        return tier.multiplier;
      }
    }
    return 1.0;
  }

  /**
   * Award XP for an event, applying streak multiplier automatically.
   * Returns the list of newly earned badges (may be empty).
   */
  awardXP(
    patientId: string,
    eventType: XPEventType,
    baseAmount?: number,
    description?: string,
  ): { xpAwarded: number; newBadges: BadgeDefinition[]; leveledUp: boolean; newLevel: LevelDefinition | null } {
    const profile = this.getProfile(patientId);
    const streak = profile.stats.currentStreak;
    const multiplier = this.getStreakMultiplier(streak);
    const amount = baseAmount ?? this.getDefaultXP(eventType);
    const totalAwarded = Math.round(amount * multiplier);

    const xpEvent: XPEvent = {
      id: generateId(),
      type: eventType,
      amount,
      multiplier,
      totalAwarded,
      description: description ?? this.getDefaultDescription(eventType),
      timestamp: todayISOString(),
    };

    profile.xpHistory.push(xpEvent);
    profile.stats.totalXP += totalAwarded;

    // Check for level up
    const oldLevel = profile.stats.currentLevel;
    const newPlayerLevel = this.calculateLevel(profile.stats.totalXP - profile.stats.xpSpent);
    profile.stats.currentLevel = newPlayerLevel.current.level;
    const leveledUp = newPlayerLevel.current.level > oldLevel;
    const newLevel = leveledUp ? newPlayerLevel.current : null;

    // Check for new badges
    const newBadges = this.evaluateBadges(profile);

    saveProfile(profile);

    return { xpAwarded: totalAwarded, newBadges, leveledUp, newLevel };
  }

  /**
   * Award daily login bonus XP (only once per day).
   */
  awardDailyLoginBonus(patientId: string): { awarded: boolean; xpAwarded: number } {
    const profile = this.getProfile(patientId);
    const today = todayDateString();

    if (profile.lastDailyBonusDate === today) {
      return { awarded: false, xpAwarded: 0 };
    }

    profile.lastDailyBonusDate = today;
    profile.stats.totalLoginDays += 1;
    profile.stats.consecutiveLoginDays += 1;
    saveProfile(profile);

    const result = this.awardXP(
      patientId,
      XPEventType.DAILY_LOGIN,
      XP_VALUES.DAILY_LOGIN_BONUS,
      'Daily login bonus',
    );

    return { awarded: true, xpAwarded: result.xpAwarded };
  }

  /**
   * Get the default XP amount for an event type.
   */
  private getDefaultXP(eventType: XPEventType): number {
    switch (eventType) {
      case XPEventType.MISSION_COMPLETE: return XP_VALUES.MISSION_MEDIUM;
      case XPEventType.JOURNAL_ENTRY: return XP_VALUES.JOURNAL_ENTRY;
      case XPEventType.MEDICATION_ADHERENCE: return XP_VALUES.MEDICATION_PERFECT_DAY;
      case XPEventType.EXERCISE_COMPLETE: return XP_VALUES.EXERCISE_COMPLETE;
      case XPEventType.PHOTO_UPLOAD: return XP_VALUES.PHOTO_UPLOAD;
      case XPEventType.DAILY_LOGIN: return XP_VALUES.DAILY_LOGIN_BONUS;
      case XPEventType.CHALLENGE_COMPLETE: return XP_VALUES.CHALLENGE_DAILY;
      case XPEventType.BADGE_EARNED: return 0; // Badge XP is defined per-badge
      case XPEventType.STREAK_BONUS: return 0; // Calculated dynamically
      default: return 10;
    }
  }

  /**
   * Get a human-readable description for an event type.
   */
  private getDefaultDescription(eventType: XPEventType): string {
    switch (eventType) {
      case XPEventType.MISSION_COMPLETE: return 'Mission completed';
      case XPEventType.JOURNAL_ENTRY: return 'Journal entry written';
      case XPEventType.MEDICATION_ADHERENCE: return 'Perfect medication adherence';
      case XPEventType.EXERCISE_COMPLETE: return 'Exercise session completed';
      case XPEventType.PHOTO_UPLOAD: return 'Wound photo uploaded';
      case XPEventType.DAILY_LOGIN: return 'Daily login bonus';
      case XPEventType.CHALLENGE_COMPLETE: return 'Challenge completed';
      case XPEventType.BADGE_EARNED: return 'Badge earned';
      case XPEventType.STREAK_BONUS: return 'Streak bonus';
      default: return 'XP earned';
    }
  }

  /**
   * Get the total XP earned today.
   */
  getXPEarnedToday(patientId: string): number {
    const profile = this.getProfile(patientId);
    const today = todayDateString();
    return profile.xpHistory
      .filter((e) => e.timestamp.startsWith(today))
      .reduce((sum, e) => sum + e.totalAwarded, 0);
  }

  /**
   * Get the available (spendable) XP for a patient.
   */
  getAvailableXP(patientId: string): number {
    const profile = this.getProfile(patientId);
    return profile.stats.totalXP - profile.stats.xpSpent;
  }

  // --------------------------------------------------------------------------
  // Level System
  // --------------------------------------------------------------------------

  /**
   * Calculate the player's current level information from total available XP.
   */
  calculateLevel(availableXP: number): PlayerLevel {
    let currentDef = LEVEL_DEFINITIONS[0];

    for (const levelDef of LEVEL_DEFINITIONS) {
      if (availableXP >= levelDef.cumulativeXP) {
        currentDef = levelDef;
      } else {
        break;
      }
    }

    const isMaxLevel = currentDef.level === LEVEL_DEFINITIONS.length;
    const nextLevel = isMaxLevel ? null : LEVEL_DEFINITIONS[currentDef.level]; // level is 1-indexed
    const xpInCurrentLevel = availableXP - (currentDef.level > 1 ? LEVEL_DEFINITIONS[currentDef.level - 2].cumulativeXP : 0);
    const xpToNextLevel = nextLevel ? nextLevel.xpRequired : 0;
    const progressPercent = xpToNextLevel > 0
      ? Math.min(100, Math.round((xpInCurrentLevel / currentDef.xpRequired) * 100))
      : 100;

    return {
      current: currentDef,
      xpInCurrentLevel,
      xpToNextLevel: nextLevel ? nextLevel.cumulativeXP - availableXP : 0,
      progressPercent,
      totalXP: availableXP,
    };
  }

  /**
   * Get the full level info for a patient.
   */
  getPlayerLevel(patientId: string): PlayerLevel {
    const profile = this.getProfile(patientId);
    const availableXP = profile.stats.totalXP - profile.stats.xpSpent;
    return this.calculateLevel(availableXP);
  }

  // --------------------------------------------------------------------------
  // Badge / Achievement System
  // --------------------------------------------------------------------------

  /**
   * Evaluate all badge conditions and award any newly earned badges.
   * Returns the list of newly awarded badges.
   */
  evaluateBadges(profile: GamificationProfile): BadgeDefinition[] {
    const earnedIds = new Set(profile.earnedBadges.map((b) => b.badgeId));
    const newlyEarned: BadgeDefinition[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      if (earnedIds.has(badge.id)) continue;
      try {
        if (badge.condition(profile.stats)) {
          profile.earnedBadges.push({
            badgeId: badge.id,
            earnedAt: todayISOString(),
            seen: false,
          });
          // Award badge XP (without recursion)
          if (badge.xpReward > 0) {
            profile.stats.totalXP += badge.xpReward;
            profile.xpHistory.push({
              id: generateId(),
              type: XPEventType.BADGE_EARNED,
              amount: badge.xpReward,
              multiplier: 1,
              totalAwarded: badge.xpReward,
              description: `Badge earned: ${badge.name}`,
              timestamp: todayISOString(),
            });
          }
          newlyEarned.push(badge);
          earnedIds.add(badge.id);
        }
      } catch {
        // Skip badges with failing conditions (defensive)
      }
    }

    if (newlyEarned.length > 0) {
      saveProfile(profile);
    }

    return newlyEarned;
  }

  /**
   * Manually trigger badge evaluation for a patient.
   */
  checkBadges(patientId: string): BadgeDefinition[] {
    const profile = this.getProfile(patientId);
    return this.evaluateBadges(profile);
  }

  /**
   * Get all badges for a patient, both earned and locked.
   */
  getAllBadges(patientId: string): Array<BadgeDefinition & { earned: boolean; earnedAt: string | null }> {
    const profile = this.getProfile(patientId);
    const earnedMap = new Map(profile.earnedBadges.map((b) => [b.badgeId, b]));

    return BADGE_DEFINITIONS.map((badge) => {
      const earned = earnedMap.get(badge.id);
      return {
        ...badge,
        earned: !!earned,
        earnedAt: earned?.earnedAt ?? null,
      };
    });
  }

  /**
   * Get only the earned badges for a patient.
   */
  getEarnedBadges(patientId: string): Array<BadgeDefinition & { earnedAt: string }> {
    const profile = this.getProfile(patientId);
    const earnedMap = new Map(profile.earnedBadges.map((b) => [b.badgeId, b]));

    return BADGE_DEFINITIONS
      .filter((b) => earnedMap.has(b.id))
      .map((b) => ({
        ...b,
        earnedAt: earnedMap.get(b.id)!.earnedAt,
      }));
  }

  /**
   * Get the count of unseen (newly earned) badges.
   */
  getUnseenBadgeCount(patientId: string): number {
    const profile = this.getProfile(patientId);
    return profile.earnedBadges.filter((b) => !b.seen).length;
  }

  /**
   * Mark all badges as seen.
   */
  markBadgesSeen(patientId: string): void {
    const profile = this.getProfile(patientId);
    for (const badge of profile.earnedBadges) {
      badge.seen = true;
    }
    saveProfile(profile);
  }

  /**
   * Get badges filtered by category.
   */
  getBadgesByCategory(patientId: string, category: BadgeCategory): Array<BadgeDefinition & { earned: boolean; earnedAt: string | null }> {
    return this.getAllBadges(patientId).filter((b) => b.category === category);
  }

  // --------------------------------------------------------------------------
  // Stats Tracking
  // --------------------------------------------------------------------------

  /**
   * Record a mission completion and update all related stats.
   */
  recordMissionComplete(
    patientId: string,
    missionType: 'photo_upload' | 'medication_check' | 'exercise_log',
    metadata?: {
      difficulty?: 'easy' | 'medium' | 'hard';
      exerciseType?: 'flexibility' | 'strength' | 'cardio';
      exerciseMinutes?: number;
      allDailyComplete?: boolean;
      totalMissionsToday?: number;
    },
  ): { xpAwarded: number; newBadges: BadgeDefinition[]; leveledUp: boolean; newLevel: LevelDefinition | null } {
    const profile = this.getProfile(patientId);
    const stats = profile.stats;
    const now = new Date();

    // Update generic mission stats
    stats.totalMissionsCompleted += 1;
    stats.lastActivityHour = now.getHours();
    stats.missionsCompletedToday = (stats.missionsCompletedToday || 0) + 1;

    if (metadata?.totalMissionsToday !== undefined) {
      stats.totalMissionsToday = metadata.totalMissionsToday;
    }

    // Update type-specific stats
    switch (missionType) {
      case 'photo_upload':
        stats.totalPhotosUploaded += 1;
        break;
      case 'medication_check':
        stats.totalMedicationDoses += 1;
        break;
      case 'exercise_log':
        stats.exerciseDaysTotal += 1;
        if (metadata?.exerciseMinutes) {
          stats.exerciseMinutesTotal += metadata.exerciseMinutes;
        }
        if (metadata?.exerciseType === 'flexibility') stats.flexibilityExercises += 1;
        if (metadata?.exerciseType === 'strength') stats.strengthExercises += 1;
        if (metadata?.exerciseType === 'cardio') stats.cardioExercises += 1;
        break;
    }

    // Perfect day check
    if (metadata?.allDailyComplete) {
      stats.perfectDays += 1;
    }

    saveProfile(profile);

    // Award XP based on difficulty
    let xpAmount: number;
    switch (metadata?.difficulty) {
      case 'easy': xpAmount = XP_VALUES.MISSION_EASY; break;
      case 'hard': xpAmount = XP_VALUES.MISSION_HARD; break;
      default: xpAmount = XP_VALUES.MISSION_MEDIUM;
    }

    return this.awardXP(patientId, XPEventType.MISSION_COMPLETE, xpAmount);
  }

  /**
   * Record a journal entry.
   */
  recordJournalEntry(patientId: string): { xpAwarded: number; newBadges: BadgeDefinition[]; leveledUp: boolean } {
    const profile = this.getProfile(patientId);
    profile.stats.totalJournalEntries += 1;
    saveProfile(profile);
    const result = this.awardXP(patientId, XPEventType.JOURNAL_ENTRY);
    return { xpAwarded: result.xpAwarded, newBadges: result.newBadges, leveledUp: result.leveledUp };
  }

  /**
   * Record perfect medication adherence for a day.
   */
  recordMedicationAdherence(patientId: string): { xpAwarded: number; newBadges: BadgeDefinition[]; leveledUp: boolean } {
    const profile = this.getProfile(patientId);
    profile.stats.medicationPerfectDays += 1;
    profile.stats.medicationPerfectStreak += 1;
    saveProfile(profile);
    const result = this.awardXP(patientId, XPEventType.MEDICATION_ADHERENCE);
    return { xpAwarded: result.xpAwarded, newBadges: result.newBadges, leveledUp: result.leveledUp };
  }

  /**
   * Reset the medication adherence streak (missed a day).
   */
  resetMedicationStreak(patientId: string): void {
    const profile = this.getProfile(patientId);
    profile.stats.medicationPerfectStreak = 0;
    saveProfile(profile);
  }

  /**
   * Record a chat message sent.
   */
  recordChatMessage(patientId: string): void {
    const profile = this.getProfile(patientId);
    profile.stats.chatMessagesCount += 1;
    saveProfile(profile);
  }

  /**
   * Record a question asked.
   */
  recordQuestionAsked(patientId: string): void {
    const profile = this.getProfile(patientId);
    profile.stats.questionsAsked += 1;
    saveProfile(profile);
  }

  /**
   * Update streak stats (call when the existing streak system updates).
   */
  syncStreak(patientId: string, currentStreak: number): void {
    const profile = this.getProfile(patientId);
    profile.stats.currentStreak = currentStreak;
    if (currentStreak > profile.stats.longestStreak) {
      profile.stats.longestStreak = currentStreak;
    }
    saveProfile(profile);
    this.evaluateBadges(profile);
  }

  /**
   * Update days since surgery (call periodically or on login).
   */
  updateDaysSinceSurgery(patientId: string, days: number): void {
    const profile = this.getProfile(patientId);
    profile.stats.daysSinceSurgery = days;
    saveProfile(profile);
    this.evaluateBadges(profile);
  }

  /**
   * Mark the patient as discharged.
   */
  markDischarged(patientId: string): BadgeDefinition[] {
    const profile = this.getProfile(patientId);
    profile.stats.discharged = true;
    saveProfile(profile);
    return this.evaluateBadges(profile);
  }

  /**
   * Reset daily counters (call at the start of each new day).
   */
  resetDailyCounters(patientId: string): void {
    const profile = this.getProfile(patientId);
    profile.stats.missionsCompletedToday = 0;
    profile.stats.totalMissionsToday = 0;
    saveProfile(profile);
  }

  /**
   * Get the full player stats.
   */
  getStats(patientId: string): PlayerStats {
    return this.getProfile(patientId).stats;
  }

  // --------------------------------------------------------------------------
  // Leaderboard System
  // --------------------------------------------------------------------------

  /**
   * Opt in or out of the anonymous leaderboard.
   */
  setLeaderboardOptIn(patientId: string, optIn: boolean): void {
    const profile = this.getProfile(patientId);
    profile.leaderboardConfig.optedIn = optIn;
    saveProfile(profile);

    if (optIn) {
      this.updateLeaderboardEntry(profile);
    } else {
      this.removeLeaderboardEntry(patientId);
    }
  }

  /**
   * Check if a patient is opted into the leaderboard.
   */
  isLeaderboardOptedIn(patientId: string): boolean {
    const profile = this.getProfile(patientId);
    return profile.leaderboardConfig.optedIn;
  }

  /**
   * Update the leaderboard entry for a patient.
   */
  private updateLeaderboardEntry(profile: GamificationProfile): void {
    if (!profile.leaderboardConfig.optedIn) return;

    const data = loadLeaderboardData();
    data.set(profile.patientId, {
      anonymousId: profile.leaderboardConfig.anonymousId,
      scores: {
        [LeaderboardType.WEEKLY_RECOVERY_SCORE]: this.calculateRecoveryScore(profile.stats),
        [LeaderboardType.MISSION_COMPLETION]: profile.stats.totalMissionsCompleted,
        [LeaderboardType.STREAK]: profile.stats.currentStreak,
      },
    });
    saveLeaderboardData(data);
  }

  /**
   * Remove a patient from the leaderboard.
   */
  private removeLeaderboardEntry(patientId: string): void {
    const data = loadLeaderboardData();
    data.delete(patientId);
    saveLeaderboardData(data);
  }

  /**
   * Calculate a composite recovery score for leaderboard ranking.
   */
  private calculateRecoveryScore(stats: PlayerStats): number {
    return (
      stats.totalMissionsCompleted * 10 +
      stats.currentStreak * 20 +
      stats.perfectDays * 30 +
      stats.medicationPerfectDays * 15 +
      stats.exerciseDaysTotal * 15 +
      stats.totalPhotosUploaded * 5 +
      stats.totalJournalEntries * 5 +
      Math.floor(stats.totalXP / 10)
    );
  }

  /**
   * Get the leaderboard for a specific type.
   */
  getLeaderboard(patientId: string, type: LeaderboardType, limit = 10): LeaderboardEntry[] {
    const data = loadLeaderboardData();
    const entries: LeaderboardEntry[] = [];

    for (const [pid, entry] of data) {
      const score = entry.scores[type] ?? 0;
      entries.push({
        rank: 0, // Will be set after sorting
        anonymousId: entry.anonymousId,
        displayName: this.generateAnonymousDisplayName(entry.anonymousId),
        score,
        isSelf: pid === patientId,
      });
    }

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Return top N, always including the current patient if they're opted in
    const topEntries = entries.slice(0, limit);
    const selfEntry = entries.find((e) => e.isSelf);
    if (selfEntry && !topEntries.find((e) => e.isSelf)) {
      topEntries.push(selfEntry);
    }

    return topEntries;
  }

  /**
   * Generate a fun anonymous display name from an anonymous ID.
   */
  private generateAnonymousDisplayName(anonymousId: string): string {
    const adjectives = [
      'Brave', 'Mighty', 'Swift', 'Calm', 'Bold', 'Wise', 'Kind',
      'Quick', 'Strong', 'Gentle', 'Happy', 'Lucky', 'Steady', 'Keen',
    ];
    const nouns = [
      'Phoenix', 'Eagle', 'Tiger', 'Wolf', 'Bear', 'Hawk', 'Falcon',
      'Lion', 'Panther', 'Fox', 'Dolphin', 'Owl', 'Deer', 'Swan',
    ];

    const rng = seededRandom(anonymousId);
    const adj = adjectives[Math.floor(rng() * adjectives.length)];
    const noun = nouns[Math.floor(rng() * nouns.length)];
    const num = Math.floor(rng() * 100);
    return `${adj}${noun}${num}`;
  }

  /**
   * Refresh leaderboard entry for a patient (call after stats change).
   */
  refreshLeaderboard(patientId: string): void {
    const profile = this.getProfile(patientId);
    this.updateLeaderboardEntry(profile);
  }

  // --------------------------------------------------------------------------
  // Challenge System
  // --------------------------------------------------------------------------

  /**
   * Get today's daily challenges (3 randomized from the pool).
   */
  getDailyChallenges(patientId: string): ActiveChallenge[] {
    const profile = this.getProfile(patientId);
    const today = todayDateString();

    // If challenges already assigned for today, return them
    if (profile.lastDailyChallengeDate === today) {
      return profile.activeChallenges.filter((c) => {
        const def = DAILY_CHALLENGE_POOL.find((d) => d.id === c.challengeId);
        return def?.type === ChallengeType.DAILY;
      });
    }

    // Remove expired daily challenges
    profile.activeChallenges = profile.activeChallenges.filter((c) => {
      const def = DAILY_CHALLENGE_POOL.find((d) => d.id === c.challengeId);
      if (!def || def.type !== ChallengeType.DAILY) return true;
      return c.status === ChallengeStatus.COMPLETED; // Keep completed ones for history
    });

    // Select 3 random daily challenges using today's date as seed
    const seed = `${patientId}-daily-${today}`;
    const shuffled = shuffleWithSeed(DAILY_CHALLENGE_POOL, seed);
    const selected = shuffled.slice(0, 3);

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    for (const def of selected) {
      profile.activeChallenges.push({
        challengeId: def.id,
        status: ChallengeStatus.ACTIVE,
        progress: 0,
        target: def.target,
        startedAt: todayISOString(),
        expiresAt: endOfDay.toISOString(),
      });
    }

    profile.lastDailyChallengeDate = today;
    saveProfile(profile);

    return profile.activeChallenges.filter((c) => {
      const def = DAILY_CHALLENGE_POOL.find((d) => d.id === c.challengeId);
      return def?.type === ChallengeType.DAILY && c.status === ChallengeStatus.ACTIVE;
    });
  }

  /**
   * Get this week's weekly challenge (1 randomized).
   */
  getWeeklyChallenges(patientId: string): ActiveChallenge[] {
    const profile = this.getProfile(patientId);
    const weekStart = getWeekStart(new Date());

    // If challenge already assigned for this week, return it
    if (profile.lastWeeklyChallengeDate === weekStart) {
      return profile.activeChallenges.filter((c) => {
        const def = WEEKLY_CHALLENGE_POOL.find((d) => d.id === c.challengeId);
        return def?.type === ChallengeType.WEEKLY && c.status === ChallengeStatus.ACTIVE;
      });
    }

    // Remove expired weekly challenges
    profile.activeChallenges = profile.activeChallenges.filter((c) => {
      const def = WEEKLY_CHALLENGE_POOL.find((d) => d.id === c.challengeId);
      if (!def || def.type !== ChallengeType.WEEKLY) return true;
      return c.status === ChallengeStatus.COMPLETED;
    });

    // Select 1 random weekly challenge
    const seed = `${patientId}-weekly-${weekStart}`;
    const shuffled = shuffleWithSeed(WEEKLY_CHALLENGE_POOL, seed);
    const selected = shuffled[0];

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    profile.activeChallenges.push({
      challengeId: selected.id,
      status: ChallengeStatus.ACTIVE,
      progress: 0,
      target: selected.target,
      startedAt: todayISOString(),
      expiresAt: endOfWeek.toISOString(),
    });

    profile.lastWeeklyChallengeDate = weekStart;
    saveProfile(profile);

    return profile.activeChallenges.filter((c) => {
      const def = WEEKLY_CHALLENGE_POOL.find((d) => d.id === c.challengeId);
      return def?.type === ChallengeType.WEEKLY && c.status === ChallengeStatus.ACTIVE;
    });
  }

  /**
   * Get recovery phase challenges for the current week of recovery.
   */
  getRecoveryPhaseChallenges(patientId: string): Array<ChallengeDefinition & { active: ActiveChallenge | null }> {
    const profile = this.getProfile(patientId);
    const currentWeek = Math.max(1, Math.ceil(profile.stats.daysSinceSurgery / 7));

    return RECOVERY_PHASE_CHALLENGES
      .filter((c) => c.recoveryWeek !== undefined && c.recoveryWeek <= currentWeek)
      .map((def) => {
        const active = profile.activeChallenges.find((a) => a.challengeId === def.id) ?? null;
        return { ...def, active };
      });
  }

  /**
   * Start a recovery phase challenge.
   */
  startRecoveryPhaseChallenge(patientId: string, challengeId: string): ActiveChallenge | null {
    const profile = this.getProfile(patientId);
    const def = RECOVERY_PHASE_CHALLENGES.find((c) => c.id === challengeId);
    if (!def) return null;

    // Don't start if already active or completed
    const existing = profile.activeChallenges.find((a) => a.challengeId === challengeId);
    if (existing) return existing;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const active: ActiveChallenge = {
      challengeId,
      status: ChallengeStatus.ACTIVE,
      progress: 0,
      target: def.target,
      startedAt: todayISOString(),
      expiresAt: endDate.toISOString(),
    };

    profile.activeChallenges.push(active);
    saveProfile(profile);
    return active;
  }

  /**
   * Update progress on a challenge.
   */
  updateChallengeProgress(
    patientId: string,
    challengeId: string,
    progressIncrement: number,
  ): { completed: boolean; xpAwarded: number; newBadges: BadgeDefinition[] } {
    const profile = this.getProfile(patientId);
    const challenge = profile.activeChallenges.find(
      (c) => c.challengeId === challengeId && c.status === ChallengeStatus.ACTIVE,
    );

    if (!challenge) {
      return { completed: false, xpAwarded: 0, newBadges: [] };
    }

    challenge.progress = Math.min(challenge.target, challenge.progress + progressIncrement);

    if (challenge.progress >= challenge.target) {
      challenge.status = ChallengeStatus.COMPLETED;
      profile.stats.challengesCompleted += 1;

      // Determine XP reward based on challenge type
      const dailyDef = DAILY_CHALLENGE_POOL.find((d) => d.id === challengeId);
      const weeklyDef = WEEKLY_CHALLENGE_POOL.find((d) => d.id === challengeId);
      const phaseDef = RECOVERY_PHASE_CHALLENGES.find((d) => d.id === challengeId);
      const def = dailyDef ?? weeklyDef ?? phaseDef;

      if (dailyDef) profile.stats.dailyChallengesCompleted += 1;
      if (weeklyDef) profile.stats.weeklyChallengesCompleted += 1;

      saveProfile(profile);

      const xpReward = def?.xpReward ?? XP_VALUES.CHALLENGE_DAILY;
      const result = this.awardXP(
        patientId,
        XPEventType.CHALLENGE_COMPLETE,
        xpReward,
        `Challenge completed: ${def?.title ?? challengeId}`,
      );

      return { completed: true, xpAwarded: result.xpAwarded, newBadges: result.newBadges };
    }

    saveProfile(profile);
    return { completed: false, xpAwarded: 0, newBadges: [] };
  }

  /**
   * Expire any challenges that have passed their deadline.
   */
  expireOldChallenges(patientId: string): number {
    const profile = this.getProfile(patientId);
    const now = new Date();
    let expiredCount = 0;

    for (const challenge of profile.activeChallenges) {
      if (challenge.status === ChallengeStatus.ACTIVE) {
        const expiresAt = new Date(challenge.expiresAt);
        if (now > expiresAt) {
          challenge.status = ChallengeStatus.EXPIRED;
          expiredCount += 1;
        }
      }
    }

    if (expiredCount > 0) {
      saveProfile(profile);
    }

    return expiredCount;
  }

  /**
   * Get the challenge definition by its ID.
   */
  getChallengeDefinition(challengeId: string): ChallengeDefinition | null {
    return (
      DAILY_CHALLENGE_POOL.find((c) => c.id === challengeId) ??
      WEEKLY_CHALLENGE_POOL.find((c) => c.id === challengeId) ??
      RECOVERY_PHASE_CHALLENGES.find((c) => c.id === challengeId) ??
      null
    );
  }

  /**
   * Get all active challenges for a patient.
   */
  getActiveChallenges(patientId: string): Array<ActiveChallenge & { definition: ChallengeDefinition }> {
    const profile = this.getProfile(patientId);
    return profile.activeChallenges
      .filter((c) => c.status === ChallengeStatus.ACTIVE)
      .map((c) => {
        const definition = this.getChallengeDefinition(c.challengeId);
        return definition ? { ...c, definition } : null;
      })
      .filter((c): c is ActiveChallenge & { definition: ChallengeDefinition } => c !== null);
  }

  // --------------------------------------------------------------------------
  // Reward Store
  // --------------------------------------------------------------------------

  /**
   * Get all reward store items with purchase status.
   */
  getStoreItems(patientId: string): Array<RewardItem & { purchased: boolean; equipped: boolean }> {
    const profile = this.getProfile(patientId);
    const purchasedMap = new Map(
      profile.purchasedRewards.map((r) => [r.rewardId, r]),
    );

    return REWARD_STORE_ITEMS.map((item) => {
      const purchased = purchasedMap.get(item.id);
      return {
        ...item,
        purchased: !!purchased,
        equipped: purchased?.equipped ?? false,
      };
    });
  }

  /**
   * Get store items filtered by category.
   */
  getStoreItemsByCategory(patientId: string, category: RewardCategory): Array<RewardItem & { purchased: boolean; equipped: boolean }> {
    return this.getStoreItems(patientId).filter((i) => i.category === category);
  }

  /**
   * Purchase a reward from the store.
   */
  purchaseReward(patientId: string, rewardId: string): { success: boolean; error?: string } {
    const profile = this.getProfile(patientId);
    const reward = REWARD_STORE_ITEMS.find((r) => r.id === rewardId);

    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    // Check if already purchased
    if (profile.purchasedRewards.find((r) => r.rewardId === rewardId)) {
      return { success: false, error: 'Already purchased' };
    }

    // Check if enough XP
    const availableXP = profile.stats.totalXP - profile.stats.xpSpent;
    if (availableXP < reward.cost) {
      return { success: false, error: `Not enough XP. Need ${reward.cost}, have ${availableXP}` };
    }

    // Purchase
    profile.stats.xpSpent += reward.cost;
    profile.purchasedRewards.push({
      rewardId,
      purchasedAt: todayISOString(),
      equipped: false,
    });

    saveProfile(profile);
    return { success: true };
  }

  /**
   * Equip or unequip a purchased reward.
   */
  toggleEquipReward(patientId: string, rewardId: string): { success: boolean; equipped: boolean; error?: string } {
    const profile = this.getProfile(patientId);
    const purchased = profile.purchasedRewards.find((r) => r.rewardId === rewardId);

    if (!purchased) {
      return { success: false, equipped: false, error: 'Reward not purchased' };
    }

    const reward = REWARD_STORE_ITEMS.find((r) => r.id === rewardId);
    if (!reward) {
      return { success: false, equipped: false, error: 'Reward not found' };
    }

    // Unequip other items in the same category
    for (const other of profile.purchasedRewards) {
      const otherReward = REWARD_STORE_ITEMS.find((r) => r.id === other.rewardId);
      if (otherReward && otherReward.category === reward.category && other.rewardId !== rewardId) {
        other.equipped = false;
      }
    }

    // Toggle this item
    purchased.equipped = !purchased.equipped;
    saveProfile(profile);

    return { success: true, equipped: purchased.equipped };
  }

  /**
   * Get all currently equipped rewards.
   */
  getEquippedRewards(patientId: string): RewardItem[] {
    const profile = this.getProfile(patientId);
    const equippedIds = new Set(
      profile.purchasedRewards.filter((r) => r.equipped).map((r) => r.rewardId),
    );
    return REWARD_STORE_ITEMS.filter((r) => equippedIds.has(r.id));
  }

  // --------------------------------------------------------------------------
  // Summary / Dashboard Data
  // --------------------------------------------------------------------------

  /**
   * Get a comprehensive gamification summary for the dashboard.
   */
  getDashboardSummary(patientId: string): {
    level: PlayerLevel;
    stats: PlayerStats;
    availableXP: number;
    xpToday: number;
    streakMultiplier: number;
    earnedBadgeCount: number;
    totalBadgeCount: number;
    unseenBadges: number;
    activeChallengeCount: number;
    equippedRewards: RewardItem[];
    recentXPEvents: XPEvent[];
  } {
    const profile = this.getProfile(patientId);
    const level = this.getPlayerLevel(patientId);
    const availableXP = profile.stats.totalXP - profile.stats.xpSpent;

    return {
      level,
      stats: profile.stats,
      availableXP,
      xpToday: this.getXPEarnedToday(patientId),
      streakMultiplier: this.getStreakMultiplier(profile.stats.currentStreak),
      earnedBadgeCount: profile.earnedBadges.length,
      totalBadgeCount: BADGE_DEFINITIONS.length,
      unseenBadges: profile.earnedBadges.filter((b) => !b.seen).length,
      activeChallengeCount: profile.activeChallenges.filter((c) => c.status === ChallengeStatus.ACTIVE).length,
      equippedRewards: this.getEquippedRewards(patientId),
      recentXPEvents: profile.xpHistory.slice(-10).reverse(),
    };
  }

  /**
   * Get the XP history for a patient (most recent first).
   */
  getXPHistory(patientId: string, limit = 50): XPEvent[] {
    const profile = this.getProfile(patientId);
    return profile.xpHistory.slice(-limit).reverse();
  }

  /**
   * Get the total number of defined badges.
   */
  getTotalBadgeCount(): number {
    return BADGE_DEFINITIONS.length;
  }

  /**
   * Get all level definitions.
   */
  getLevelDefinitions(): LevelDefinition[] {
    return [...LEVEL_DEFINITIONS];
  }

  /**
   * Get all available challenge definitions.
   */
  getAllChallengeDefinitions(): {
    daily: ChallengeDefinition[];
    weekly: ChallengeDefinition[];
    recoveryPhase: ChallengeDefinition[];
  } {
    return {
      daily: [...DAILY_CHALLENGE_POOL],
      weekly: [...WEEKLY_CHALLENGE_POOL],
      recoveryPhase: [...RECOVERY_PHASE_CHALLENGES],
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const gamificationEngine = new GamificationEngineImpl();
