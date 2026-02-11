/**
 * PainTracker - Pain tracking interface for post-operative patients
 *
 * Features:
 * - Pain scale slider (0-10) with color gradient (green to red)
 * - Pain location selector with body outline and clickable regions
 * - Pain quality checkboxes (sharp, dull, burning, throbbing, aching, stabbing)
 * - Timing selector (constant, intermittent, activity-related)
 * - Pain trend mini-chart (last 7 days bar visualization)
 * - Submit button to log pain entry
 * - Current medication effectiveness note
 *
 * Uses Tailwind CSS, Lucide icons, and Framer Motion for animations.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  CheckCircle2,
  Zap,
  Flame,
  TrendingDown,
  TrendingUp,
  Minus,
  Pill,
  Send,
  RotateCcw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PainQuality = 'sharp' | 'dull' | 'burning' | 'throbbing' | 'aching' | 'stabbing';
type PainTiming = 'constant' | 'intermittent' | 'activity-related';
type MedEffectiveness = 'very-effective' | 'somewhat-effective' | 'not-effective' | 'not-taking';

interface BodyRegion {
  id: string;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
}

interface PainHistoryEntry {
  day: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Constants / Mock Data
// ---------------------------------------------------------------------------

const PAIN_QUALITIES: { id: PainQuality; label: string; icon: typeof Zap }[] = [
  { id: 'sharp', label: 'Sharp', icon: Zap },
  { id: 'dull', label: 'Dull', icon: Minus },
  { id: 'burning', label: 'Burning', icon: Flame },
  { id: 'throbbing', label: 'Throbbing', icon: Activity },
  { id: 'aching', label: 'Aching', icon: TrendingDown },
  { id: 'stabbing', label: 'Stabbing', icon: Zap },
];

const PAIN_TIMINGS: { id: PainTiming; label: string; description: string }[] = [
  { id: 'constant', label: 'Constant', description: 'Pain is always present' },
  { id: 'intermittent', label: 'Intermittent', description: 'Pain comes and goes' },
  { id: 'activity-related', label: 'Activity-Related', description: 'Pain with movement or activity' },
];

const MED_EFFECTIVENESS_OPTIONS: { id: MedEffectiveness; label: string }[] = [
  { id: 'very-effective', label: 'Very effective' },
  { id: 'somewhat-effective', label: 'Somewhat effective' },
  { id: 'not-effective', label: 'Not effective' },
  { id: 'not-taking', label: 'Not taking medication' },
];

const BODY_REGIONS: BodyRegion[] = [
  { id: 'head', label: 'Head', top: '2%', left: '38%', width: '24%', height: '14%' },
  { id: 'neck', label: 'Neck', top: '16%', left: '40%', width: '20%', height: '6%' },
  { id: 'chest', label: 'Chest', top: '22%', left: '30%', width: '40%', height: '14%' },
  { id: 'abdomen', label: 'Abdomen', top: '36%', left: '32%', width: '36%', height: '14%' },
  { id: 'left-shoulder', label: 'Left Shoulder', top: '20%', left: '14%', width: '16%', height: '8%' },
  { id: 'right-shoulder', label: 'Right Shoulder', top: '20%', left: '70%', width: '16%', height: '8%' },
  { id: 'left-arm', label: 'Left Arm', top: '28%', left: '10%', width: '16%', height: '22%' },
  { id: 'right-arm', label: 'Right Arm', top: '28%', left: '74%', width: '16%', height: '22%' },
  { id: 'lower-back', label: 'Lower Back', top: '42%', left: '34%', width: '32%', height: '10%' },
  { id: 'left-leg', label: 'Left Leg', top: '52%', left: '28%', width: '20%', height: '46%' },
  { id: 'right-leg', label: 'Right Leg', top: '52%', left: '52%', width: '20%', height: '46%' },
];

// Mock last-7-day pain history
const MOCK_PAIN_HISTORY: PainHistoryEntry[] = [
  { day: 'Mon', score: 7 },
  { day: 'Tue', score: 6 },
  { day: 'Wed', score: 5 },
  { day: 'Thu', score: 6 },
  { day: 'Fri', score: 4 },
  { day: 'Sat', score: 3 },
  { day: 'Sun', score: 4 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a Tailwind color class based on pain score */
function painScoreColor(score: number): string {
  if (score <= 2) return 'bg-green-500';
  if (score <= 4) return 'bg-yellow-400';
  if (score <= 6) return 'bg-amber-500';
  if (score <= 8) return 'bg-orange-500';
  return 'bg-red-500';
}

/** Return text color for pain score */
function painScoreTextColor(score: number): string {
  if (score <= 2) return 'text-green-600';
  if (score <= 4) return 'text-yellow-600';
  if (score <= 6) return 'text-amber-600';
  if (score <= 8) return 'text-orange-600';
  return 'text-red-600';
}

/** Pain score label */
function painScoreLabel(score: number): string {
  if (score === 0) return 'No Pain';
  if (score <= 2) return 'Mild';
  if (score <= 4) return 'Moderate';
  if (score <= 6) return 'Significant';
  if (score <= 8) return 'Severe';
  return 'Worst Possible';
}

/** Compute trend direction from history */
function computeTrend(history: PainHistoryEntry[]): 'improving' | 'worsening' | 'stable' {
  if (history.length < 2) return 'stable';
  const recent = history.slice(-3);
  const earlier = history.slice(0, 3);
  const recentAvg = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, e) => sum + e.score, 0) / earlier.length;
  const diff = recentAvg - earlierAvg;
  if (diff < -0.5) return 'improving';
  if (diff > 0.5) return 'worsening';
  return 'stable';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PainTracker() {
  // State
  const [painScore, setPainScore] = useState(0);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedQualities, setSelectedQualities] = useState<PainQuality[]>([]);
  const [selectedTiming, setSelectedTiming] = useState<PainTiming | null>(null);
  const [medEffectiveness, setMedEffectiveness] = useState<MedEffectiveness | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [painHistory] = useState<PainHistoryEntry[]>(MOCK_PAIN_HISTORY);

  const trend = computeTrend(painHistory);

  // Handlers
  const toggleLocation = useCallback((regionId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId],
    );
  }, []);

  const toggleQuality = useCallback((quality: PainQuality) => {
    setSelectedQualities((prev) =>
      prev.includes(quality) ? prev.filter((q) => q !== quality) : [...prev, quality],
    );
  }, []);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);
    // In production, this would call an API to log the pain entry
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  }, []);

  const handleReset = useCallback(() => {
    setPainScore(0);
    setSelectedLocations([]);
    setSelectedQualities([]);
    setSelectedTiming(null);
    setMedEffectiveness(null);
    setNotes('');
    setIsSubmitted(false);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-medical-text">Pain Tracker</h2>
            <p className="text-sm text-gray-500">
              Log your current pain level and details
            </p>
          </div>
        </div>
      </div>

      {/* Pain Scale Slider */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-medical-text mb-4">Pain Level</h3>

        {/* Score display */}
        <div className="text-center mb-4">
          <motion.div
            key={painScore}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-block text-5xl font-bold font-mono ${painScoreTextColor(painScore)}`}
          >
            {painScore}
          </motion.div>
          <p className={`text-sm font-medium mt-1 ${painScoreTextColor(painScore)}`}>
            {painScoreLabel(painScore)}
          </p>
        </div>

        {/* Gradient bar background */}
        <div className="relative mb-2">
          <div className="h-3 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 via-amber-500 via-orange-500 to-red-500 opacity-30" />
          <div className="absolute inset-0 flex items-center">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={painScore}
              onChange={(e) => setPainScore(parseInt(e.target.value, 10))}
              className="w-full h-3 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-400 [&::-moz-range-thumb]:shadow-md"
              aria-label={`Pain level: ${painScore} out of 10`}
            />
          </div>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-xs text-gray-400 px-1">
          <span>0 - None</span>
          <span>5 - Moderate</span>
          <span>10 - Worst</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pain Location */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-medical-text mb-3">Pain Location</h3>
          <p className="text-xs text-gray-400 mb-3">
            Tap where you feel pain
          </p>

          {/* Body outline */}
          <div className="relative w-full aspect-[3/5] bg-gray-50 rounded-lg border border-gray-200 mx-auto max-w-[200px]">
            {/* Silhouette */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[60%] h-[90%] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36%] h-[12%] rounded-full border-2 border-gray-300" />
                <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-[50%] h-[32%] rounded-t-lg border-2 border-gray-300 border-b-0" />
                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 w-[44%] h-[14%] border-2 border-gray-300 border-t-0" />
                <div className="absolute top-[52%] left-[22%] w-[18%] h-[46%] border-2 border-gray-300 rounded-b-lg" />
                <div className="absolute top-[52%] right-[22%] w-[18%] h-[46%] border-2 border-gray-300 rounded-b-lg" />
                <div className="absolute top-[16%] left-0 w-[14%] h-[32%] border-2 border-gray-300 rounded-b-lg" />
                <div className="absolute top-[16%] right-0 w-[14%] h-[32%] border-2 border-gray-300 rounded-b-lg" />
              </div>
            </div>

            {/* Clickable regions */}
            {BODY_REGIONS.map((region) => {
              const isSelected = selectedLocations.includes(region.id);
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => toggleLocation(region.id)}
                  className={`absolute rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-400/40 border-2 border-red-500'
                      : 'bg-transparent hover:bg-red-200/20 border-2 border-transparent'
                  }`}
                  style={{
                    top: region.top,
                    left: region.left,
                    width: region.width,
                    height: region.height,
                  }}
                  aria-label={`${region.label}${isSelected ? ' (selected)' : ''}`}
                  title={region.label}
                />
              );
            })}
          </div>

          {/* Selected locations */}
          {selectedLocations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedLocations.map((locId) => {
                const region = BODY_REGIONS.find((r) => r.id === locId);
                return (
                  <span
                    key={locId}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium"
                  >
                    {region?.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Pain Quality */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-medical-text mb-3">Pain Quality</h3>
          <p className="text-xs text-gray-400 mb-3">
            Select all that describe your pain
          </p>

          <div className="grid grid-cols-2 gap-2">
            {PAIN_QUALITIES.map((quality) => {
              const isSelected = selectedQualities.includes(quality.id);
              const Icon = quality.icon;
              return (
                <button
                  key={quality.id}
                  type="button"
                  onClick={() => toggleQuality(quality.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left border transition-all ${
                    isSelected
                      ? 'bg-orange-50 text-orange-700 border-orange-300 font-medium'
                      : 'bg-gray-50 text-medical-text border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />
                  {quality.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timing */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-medical-text">Pain Timing</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PAIN_TIMINGS.map((timing) => {
            const isSelected = selectedTiming === timing.id;
            return (
              <button
                key={timing.id}
                type="button"
                onClick={() => setSelectedTiming(timing.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-medical-primary/10 border-medical-primary/30 text-medical-primary'
                    : 'bg-gray-50 border-gray-100 text-medical-text hover:border-gray-200'
                }`}
              >
                <p className={`text-sm font-medium ${isSelected ? 'text-medical-primary' : 'text-medical-text'}`}>
                  {timing.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timing.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medication Effectiveness */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-medical-text">Medication Effectiveness</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          How well is your current medication managing the pain?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MED_EFFECTIVENESS_OPTIONS.map((option) => {
            const isSelected = medEffectiveness === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMedEffectiveness(option.id)}
                className={`px-3 py-2.5 rounded-lg text-sm border transition-all ${
                  isSelected
                    ? 'bg-blue-50 text-medical-primary border-medical-primary/30 font-medium'
                    : 'bg-gray-50 text-medical-text border-gray-100 hover:border-gray-200'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pain Trend Mini-Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-medical-text">7-Day Pain Trend</h3>
          <div className="flex items-center gap-1.5">
            {trend === 'improving' && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <TrendingDown className="w-3.5 h-3.5" />
                Improving
              </span>
            )}
            {trend === 'worsening' && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                <TrendingUp className="w-3.5 h-3.5" />
                Worsening
              </span>
            )}
            {trend === 'stable' && (
              <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                <Minus className="w-3.5 h-3.5" />
                Stable
              </span>
            )}
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-32">
          {painHistory.map((entry, index) => {
            const heightPercent = (entry.score / 10) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-mono text-gray-500">{entry.score}</span>
                <motion.div
                  className={`w-full rounded-t-md ${painScoreColor(entry.score)}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  style={{ minHeight: entry.score > 0 ? '4px' : '0px' }}
                />
                <span className="text-xs text-gray-400">{entry.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-medical-text mb-2">Additional Notes</h3>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
          placeholder="Any additional details about your pain (triggers, relief measures, etc.)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Submit Section */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitted}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-medical-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.span
                key="submitted"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Pain Entry Logged
              </motion.span>
            ) : (
              <motion.span
                key="submit"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Log Pain Entry
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 bg-white text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors min-h-[44px]"
          aria-label="Reset form"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
