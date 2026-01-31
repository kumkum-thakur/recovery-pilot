/**
 * CelebrationOverlay - Full-screen confetti celebration animation
 * 
 * Displays a celebratory confetti animation when a patient completes a mission.
 * Enhanced animations are triggered for streak milestones (7, 30, 100 days).
 * Auto-dismisses after 2 seconds.
 * 
 * Requirements: 
 * - 11.2 - Tone of Voice: encouraging, slightly humorous text
 * - 11.3 - Streak Celebration with full-screen confetti effect
 * 
 * @param isVisible - Whether the overlay is visible
 * @param streakCount - Current streak count (used to determine milestone animations)
 * @param message - Optional custom encouraging message to display
 * @param onComplete - Callback when animation completes and overlay dismisses
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStreakMilestoneMessage } from '../utils/encouragingMessages';

interface CelebrationOverlayProps {
  isVisible: boolean;
  streakCount?: number;
  onComplete: () => void;
}

// Streak milestones that trigger enhanced animations
const STREAK_MILESTONES = [7, 30, 100];

// Check if current streak is a milestone
function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

// Generate confetti pieces with random properties
function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // Random horizontal position (0-100%)
    y: -20, // Start above viewport
    rotation: Math.random() * 360, // Random initial rotation
    color: getRandomColor(),
    size: Math.random() * 10 + 5, // Random size (5-15px)
    delay: Math.random() * 0.3, // Stagger animation start
    duration: Math.random() * 1 + 1.5, // Random fall duration (1.5-2.5s)
  }));
}

// Get random confetti color from gamification palette
function getRandomColor(): string {
  const colors = [
    '#8b5cf6', // violet-500 (gamification accent)
    '#34d399', // emerald-400 (success)
    '#fbbf24', // amber-400 (agent)
    '#f472b6', // pink-400
    '#60a5fa', // blue-400
    '#a78bfa', // violet-400
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function CelebrationOverlay({
  isVisible,
  streakCount = 0,
  onComplete,
}: CelebrationOverlayProps) {
  const [confetti, setConfetti] = useState<ReturnType<typeof generateConfetti>>([]);
  const isMilestone = isStreakMilestone(streakCount);
  
  // Generate confetti when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      // More confetti for milestones
      const confettiCount = isMilestone ? 100 : 50;
      setConfetti(generateConfetti(confettiCount));
      
      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, isMilestone, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="presentation"
          aria-live="polite"
          aria-label="Celebration animation"
        >
          {/* Confetti pieces */}
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.x}%`,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                borderRadius: isMilestone ? '50%' : '2px', // Circles for milestones, squares for regular
              }}
              initial={{
                y: piece.y,
                rotate: piece.rotation,
                opacity: 1,
              }}
              animate={{
                y: window.innerHeight + 50, // Fall below viewport
                rotate: piece.rotation + 360 * 2, // Spin while falling
                opacity: [1, 1, 0.8, 0], // Fade out near the end
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeIn',
              }}
            />
          ))}
          
          {/* Milestone message */}
          {isMilestone && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl px-8 py-6 text-center border-4 border-gamification-accent">
                <div className="text-6xl mb-2">🎉</div>
                <h2 className="text-3xl font-bold text-gamification-accent mb-2">
                  {streakCount} Day Milestone!
                </h2>
                <p className="text-lg text-slate-600">
                  You're crushing it! Keep going! 💪
                </p>
              </div>
            </motion.div>
          )}
          
          {/* Regular completion message */}
          {!isMilestone && (
            <motion.div
              className="absolute top-1/3 left-1/2 -translate-x-1/2"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
            >
              <div className="bg-gamification-success/95 backdrop-blur-sm rounded-xl shadow-xl px-6 py-4 text-center">
                <div className="text-4xl mb-1">✨</div>
                <p className="text-xl font-bold text-white">
                  Mission Complete!
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
