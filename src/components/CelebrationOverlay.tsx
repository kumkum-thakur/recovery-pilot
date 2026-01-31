/**
 * CelebrationOverlay - Full-screen confetti celebration animation
 * 
 * Displays a celebratory confetti animation when a patient completes a mission.
 * Enhanced animations are triggered for streak milestones (7, 30, 100 days).
 * Auto-dismisses after 2 seconds.
 * 
 * Requirements: 11.3 - Streak Celebration with full-screen confetti effect
 * 
 * @param isVisible - Whether the overlay is visible
 * @param streakCount - Current streak count (used to determine milestone animations)
 * @param onComplete - Callback when animation completes and overlay dismisses
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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