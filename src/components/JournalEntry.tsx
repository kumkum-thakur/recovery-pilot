/**
 * JournalEntry - Daily journal/check-in component for recovery patients
 *
 * Features:
 * - Mood selector (5 emoji-style buttons: terrible to great)
 * - Energy level slider (1-5)
 * - Sleep quality slider (1-5)
 * - Activity level buttons (sedentary, light, moderate, active)
 * - Free text notes area
 * - Daily prompt display
 * - Streak indicator for consistent journaling
 * - Submit button with celebration animation on submission
 *
 * Uses Tailwind CSS, Lucide icons, and Framer Motion for animations.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Zap,
  Moon,
  Footprints,
  Sparkles,
  Send,
  CheckCircle2,
  Flame,
  MessageSquare,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MoodLevel = 1 | 2 | 3 | 4 | 5;
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOOD_OPTIONS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  { level: 1, emoji: '😣', label: 'Terrible', color: 'border-red-400 bg-red-50 text-red-700' },
  { level: 2, emoji: '😔', label: 'Bad', color: 'border-orange-400 bg-orange-50 text-orange-700' },
  { level: 3, emoji: '😐', label: 'Okay', color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { level: 4, emoji: '🙂', label: 'Good', color: 'border-green-400 bg-green-50 text-green-700' },
  { level: 5, emoji: '😊', label: 'Great', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
];

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string; description: string; icon: typeof Footprints }[] = [
  { id: 'sedentary', label: 'Sedentary', description: 'Resting, minimal movement', icon: Moon },
  { id: 'light', label: 'Light', description: 'Walking around the house', icon: Footprints },
  { id: 'moderate', label: 'Moderate', description: 'Short walks, light exercises', icon: Footprints },
  { id: 'active', label: 'Active', description: 'Physical therapy, longer walks', icon: Zap },
];

const DAILY_PROMPTS: string[] = [
  'What was the best part of your day today?',
  'How did your body feel when you woke up this morning?',
  'What is one thing you are grateful for in your recovery?',
  'Did anything surprise you today about your progress?',
  'How are you feeling emotionally about your recovery?',
  'What is one small win from today?',
  'How did you manage any discomfort today?',
  'What are you looking forward to tomorrow?',
  'Did you notice any improvements compared to yesterday?',
  'How are your spirits today? What helped or hindered them?',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDailyPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

function sliderLevelLabel(value: number, type: 'energy' | 'sleep'): string {
  const labels = {
    energy: ['', 'Very Low', 'Low', 'Moderate', 'Good', 'Excellent'],
    sleep: ['', 'Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'],
  };
  return labels[type][value] ?? '';
}

function sliderLevelColor(value: number): string {
  const colors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-emerald-500'];
  return colors[value] ?? 'text-gray-500';
}

// ---------------------------------------------------------------------------
// Confetti sub-component
// ---------------------------------------------------------------------------

function CelebrationBurst({ isVisible }: { isVisible: boolean }) {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i / 24) * 360,
    distance: 40 + Math.random() * 30,
    size: 4 + Math.random() * 4,
    color: ['#8b5cf6', '#34d399', '#fbbf24', '#f472b6', '#60a5fa'][Math.floor(Math.random() * 5)],
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const x = Math.cos(rad) * p.distance;
            const y = Math.sin(rad) * p.distance;
            return (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x, y, scale: 0, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function JournalEntry() {
  // State
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [notesText, setNotesText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dailyPrompt] = useState(getDailyPrompt);

  // Mock streak data
  const [streakCount] = useState(12);

  // Celebration timer
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);
    setShowCelebration(true);
  }, []);

  const canSubmit = mood !== null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with streak */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gamification-accent/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gamification-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-medical-text">Daily Journal</h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Streak indicator */}
          <div
            className="flex items-center gap-2 bg-gamification-accent/10 px-3 py-1.5 rounded-lg border border-gamification-accent/20"
            role="status"
            aria-label={`Current journaling streak: ${streakCount} days`}
          >
            <Flame className="w-4 h-4 text-gamification-accent" />
            <div className="flex flex-col">
              <span className="text-xs text-gamification-accent font-medium">Streak</span>
              <span className="text-sm font-bold text-gamification-accent font-mono">
                {streakCount} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Prompt */}
      <div className="bg-gamification-accent/5 border border-gamification-accent/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-gamification-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gamification-accent uppercase tracking-wide mb-1">
              Today's Prompt
            </p>
            <p className="text-sm text-medical-text font-medium">{dailyPrompt}</p>
          </div>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-medical-text mb-4">How are you feeling?</h3>
        <div className="flex justify-center gap-3">
          {MOOD_OPTIONS.map((option) => {
            const isSelected = mood === option.level;
            return (
              <motion.button
                key={option.level}
                type="button"
                onClick={() => setMood(option.level)}
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all min-w-[64px] ${
                  isSelected
                    ? option.color
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl" role="img" aria-label={option.label}>
                  {option.emoji}
                </span>
                <span className="text-xs font-medium">{option.label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="mood-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-current"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Energy Level */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-medical-text">Energy Level</h3>
          </div>
          <div className="text-center mb-3">
            <span className={`text-2xl font-bold font-mono ${sliderLevelColor(energyLevel)}`}>
              {energyLevel}
            </span>
            <span className="text-xs text-gray-400 ml-1">/5</span>
            <p className={`text-xs font-medium mt-0.5 ${sliderLevelColor(energyLevel)}`}>
              {sliderLevelLabel(energyLevel, 'energy')}
            </p>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={energyLevel}
            onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:shadow-md"
            aria-label={`Energy level: ${energyLevel} out of 5`}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-medical-text">Sleep Quality</h3>
          </div>
          <div className="text-center mb-3">
            <span className={`text-2xl font-bold font-mono ${sliderLevelColor(sleepQuality)}`}>
              {sleepQuality}
            </span>
            <span className="text-xs text-gray-400 ml-1">/5</span>
            <p className={`text-xs font-medium mt-0.5 ${sliderLevelColor(sleepQuality)}`}>
              {sliderLevelLabel(sleepQuality, 'sleep')}
            </p>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:shadow-md"
            aria-label={`Sleep quality: ${sleepQuality} out of 5`}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>

      {/* Activity Level */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Footprints className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold text-medical-text">Activity Level Today</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACTIVITY_OPTIONS.map((option) => {
            const isSelected = activityLevel === option.id;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setActivityLevel(option.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-100 text-medical-text hover:border-gray-200'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-green-500' : 'text-gray-400'}`}
                />
                <p className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-medical-text'}`}>
                  {option.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-medical-text mb-2">Notes</h3>
        <p className="text-xs text-gray-400 mb-3">
          Anything else you want to share about your day?
        </p>
        <textarea
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gamification-accent focus:border-transparent text-sm"
          placeholder="Write your thoughts, experiences, or answer today's prompt..."
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {notesText.length} characters
        </p>
      </div>

      {/* Submit */}
      <div className="relative">
        <CelebrationBurst isVisible={showCelebration} />
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gamification-success/10 border border-gamification-success/30 rounded-lg p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <CheckCircle2 className="w-12 h-12 text-gamification-success mx-auto mb-3" />
              </motion.div>
              <h3 className="text-lg font-bold text-gamification-success mb-1">
                Journal Entry Saved!
              </h3>
              <p className="text-sm text-gamification-success/80">
                Great job keeping up with your recovery journal.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Flame className="w-4 h-4 text-gamification-accent" />
                <span className="text-sm font-semibold text-gamification-accent">
                  {streakCount + 1} day streak!
                </span>
                <Sparkles className="w-4 h-4 text-gamification-accent" />
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="submit-btn"
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gamification-accent text-white font-semibold rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <Send className="w-5 h-5" />
              Save Journal Entry
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
