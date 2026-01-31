/**
 * Encouraging Messages Utility
 * 
 * Provides friendly, humorous messages for mission completion and triage results.
 * Implements the "Recovery Buddy" tone of voice for gamification.
 * 
 * Requirements: 11.2 - Tone of Voice: encouraging, slightly humorous text
 */

import { MissionType, TriageAnalysis } from '../types';

/**
 * Get a random encouraging message for mission completion
 * 
 * @param missionType - The type of mission completed
 * @returns A friendly, humorous completion message
 */
export function getEncouragingMessage(missionType: MissionType): string {
  const messages: Record<MissionType, string[]> = {
    [MissionType.PHOTO_UPLOAD]: [
      "Incision looking sharp! (Not literally) ✨",
      "Photo uploaded! You're healing like a champ! 📸",
      "Snap! That's one mission down! 🎯",
      "Picture perfect recovery! Keep it up! 🌟",
      "You're documenting your comeback story! 📷",
    ],
    [MissionType.MEDICATION_CHECK]: [
      "You crushed that pill schedule! 💊",
      "Meds taken like a boss! 💪",
      "Medication mission accomplished! 🎖️",
      "Pills on point! You're unstoppable! ⚡",
      "Dose done! Your body thanks you! 🙌",
    ],
    [MissionType.EXERCISE_LOG]: [
      "Movement logged! You're on fire! 🔥",
      "Exercise complete! Recovery mode: activated! 💪",
      "You moved it, you logged it, you crushed it! 🏃",
      "That's the spirit! Keep moving forward! ⭐",
      "Activity tracked! Your body is loving this! 🎉",
    ],
  };

  const messageList = messages[missionType] || [
    "Mission complete! You're doing amazing! 🎉",
  ];

  // Return a random message from the list
  return messageList[Math.floor(Math.random() * messageList.length)];
}

/**
 * Get an encouraging message for triage results
 * 
 * @param analysis - The triage analysis result (green or red)
 * @returns A friendly message appropriate for the result
 */
export function getTriageEncouragingMessage(analysis: TriageAnalysis): string {
  if (analysis === 'green') {
    const greenMessages = [
      "Looking good! Your incision is healing beautifully! ✨",
      "Healing like a superhero! Keep up the great work! 🦸",
      "Your recovery is on track! You're crushing it! 🌟",
      "That's what we like to see! Healing progress: excellent! 💚",
      "Your incision is happy! Keep doing what you're doing! 😊",
    ];
    return greenMessages[Math.floor(Math.random() * greenMessages.length)];
  } else {
    const redMessages = [
      "I've got your back! Flagging this for Dr. Smith to review. 🩺",
      "Let's get a second opinion on this. Dr. Smith will take a look! 👨‍⚕️",
      "Safety first! I've alerted your doctor to check this out. 🔔",
      "Better safe than sorry! Your doctor will review this soon. 💙",
      "I'm on it! Dr. Smith will give this a closer look. 🔍",
    ];
    return redMessages[Math.floor(Math.random() * redMessages.length)];
  }
}

/**
 * Get an encouraging message for streak milestones
 * 
 * @param streakCount - The current streak count
 * @returns A celebratory message for the milestone
 */
export function getStreakMilestoneMessage(streakCount: number): string {
  const milestoneMessages: Record<number, string[]> = {
    7: [
      "One week strong! You're building amazing habits! 🔥",
      "7 days in a row! Your dedication is inspiring! ⭐",
      "Week one complete! You're a recovery rockstar! 🎸",
    ],
    30: [
      "30 days! You're officially a recovery champion! 🏆",
      "One month milestone! Your consistency is incredible! 💎",
      "30-day streak! You're unstoppable! 🚀",
    ],
    100: [
      "100 DAYS! You're a recovery LEGEND! 👑",
      "Century club! Your commitment is absolutely phenomenal! 🌟",
      "100-day streak! You've mastered the art of recovery! 🎯",
    ],
  };

  const messages = milestoneMessages[streakCount];
  if (messages) {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // For non-milestone streaks
  return `${streakCount} days strong! Keep the momentum going! 🔥`;
}

/**
 * Get an encouraging message for general streak display
 * 
 * @param streakCount - The current streak count
 * @returns A motivational message based on streak count
 */
export function getStreakMessage(streakCount: number): string {
  if (streakCount === 0) {
    return "Start your streak today! 🌟";
  } else if (streakCount === 1) {
    return "Great start! Keep it going! 💪";
  } else if (streakCount < 7) {
    return `${streakCount} days! You're building momentum! 🔥`;
  } else if (streakCount < 30) {
    return `${streakCount} days! You're on a roll! ⚡`;
  } else if (streakCount < 100) {
    return `${streakCount} days! Absolutely crushing it! 🚀`;
  } else {
    return `${streakCount} days! You're a recovery legend! 👑`;
  }
}

/**
 * Get an encouraging message for all missions completed
 * 
 * @returns A celebratory message for completing all daily missions
 */
export function getAllMissionsCompleteMessage(): string {
  const messages = [
    "All missions complete! You're absolutely crushing recovery! 🎉",
    "Daily goals achieved! You're a recovery superstar! ⭐",
    "Mission sweep! You're unstoppable today! 💪",
    "Perfect day! You've completed everything! 🌟",
    "All done! Your dedication is inspiring! 🏆",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
