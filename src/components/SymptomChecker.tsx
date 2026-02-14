/**
 * SymptomChecker - Patient-facing symptom checker component
 *
 * Features:
 * - Multi-select symptom input from categorized lists
 * - Body map visual with clickable regions
 * - Symptom analysis with probability bars, urgency badges, recommended actions
 * - Red flag alerts with emergency styling
 * - Follow-up questions section
 *
 * Uses Tailwind CSS, Lucide icons, and Framer Motion for animations.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Activity,
  Heart,
  Brain,
  Wind,
  Stethoscope,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Thermometer,
  Bandage,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Symptom {
  id: string;
  label: string;
  category: SymptomCategory;
}

type SymptomCategory =
  | 'general'
  | 'wound'
  | 'digestive'
  | 'respiratory'
  | 'cardiovascular'
  | 'neurological'
  | 'psychological';

interface BodyRegion {
  id: string;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
}

interface AnalysisResult {
  condition: string;
  probability: number; // 0-100
  urgency: 'low' | 'moderate' | 'high' | 'emergency';
  actions: string[];
}

interface RedFlag {
  message: string;
  instruction: string;
}

interface FollowUpQuestion {
  id: string;
  question: string;
  options: string[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const SYMPTOM_CATEGORIES: {
  key: SymptomCategory;
  label: string;
  icon: typeof Activity;
  color: string;
}[] = [
  { key: 'general', label: 'General', icon: Thermometer, color: 'text-gray-600' },
  { key: 'wound', label: 'Wound', icon: Bandage, color: 'text-red-500' },
  { key: 'digestive', label: 'Digestive', icon: Activity, color: 'text-amber-500' },
  { key: 'respiratory', label: 'Respiratory', icon: Wind, color: 'text-sky-500' },
  { key: 'cardiovascular', label: 'Cardiovascular', icon: Heart, color: 'text-rose-500' },
  { key: 'neurological', label: 'Neurological', icon: Brain, color: 'text-purple-500' },
  { key: 'psychological', label: 'Psychological', icon: Stethoscope, color: 'text-indigo-500' },
];

const SYMPTOMS: Symptom[] = [
  // General
  { id: 'fever', label: 'Fever', category: 'general' },
  { id: 'fatigue', label: 'Fatigue', category: 'general' },
  { id: 'chills', label: 'Chills', category: 'general' },
  { id: 'night-sweats', label: 'Night sweats', category: 'general' },
  { id: 'weight-loss', label: 'Unexplained weight loss', category: 'general' },
  // Wound
  { id: 'redness', label: 'Redness around incision', category: 'wound' },
  { id: 'swelling', label: 'Swelling', category: 'wound' },
  { id: 'discharge', label: 'Discharge or pus', category: 'wound' },
  { id: 'wound-odor', label: 'Foul odor from wound', category: 'wound' },
  { id: 'wound-pain', label: 'Increasing wound pain', category: 'wound' },
  // Digestive
  { id: 'nausea', label: 'Nausea', category: 'digestive' },
  { id: 'vomiting', label: 'Vomiting', category: 'digestive' },
  { id: 'diarrhea', label: 'Diarrhea', category: 'digestive' },
  { id: 'constipation', label: 'Constipation', category: 'digestive' },
  { id: 'appetite-loss', label: 'Loss of appetite', category: 'digestive' },
  // Respiratory
  { id: 'shortness-breath', label: 'Shortness of breath', category: 'respiratory' },
  { id: 'cough', label: 'Persistent cough', category: 'respiratory' },
  { id: 'chest-tightness', label: 'Chest tightness', category: 'respiratory' },
  { id: 'wheezing', label: 'Wheezing', category: 'respiratory' },
  // Cardiovascular
  { id: 'chest-pain', label: 'Chest pain', category: 'cardiovascular' },
  { id: 'palpitations', label: 'Palpitations', category: 'cardiovascular' },
  { id: 'leg-swelling', label: 'Leg swelling', category: 'cardiovascular' },
  { id: 'dizziness', label: 'Dizziness', category: 'cardiovascular' },
  // Neurological
  { id: 'headache', label: 'Severe headache', category: 'neurological' },
  { id: 'numbness', label: 'Numbness or tingling', category: 'neurological' },
  { id: 'confusion', label: 'Confusion', category: 'neurological' },
  { id: 'vision-changes', label: 'Vision changes', category: 'neurological' },
  // Psychological
  { id: 'anxiety', label: 'Anxiety', category: 'psychological' },
  { id: 'depression', label: 'Feeling depressed', category: 'psychological' },
  { id: 'insomnia', label: 'Insomnia', category: 'psychological' },
  { id: 'irritability', label: 'Irritability', category: 'psychological' },
];

const BODY_REGIONS: BodyRegion[] = [
  { id: 'head', label: 'Head', top: '2%', left: '38%', width: '24%', height: '14%' },
  { id: 'chest', label: 'Chest', top: '22%', left: '30%', width: '40%', height: '16%' },
  { id: 'abdomen', label: 'Abdomen', top: '38%', left: '32%', width: '36%', height: '14%' },
  { id: 'left-arm', label: 'Left Arm', top: '22%', left: '10%', width: '18%', height: '30%' },
  { id: 'right-arm', label: 'Right Arm', top: '22%', left: '72%', width: '18%', height: '30%' },
  { id: 'left-leg', label: 'Left Leg', top: '54%', left: '28%', width: '20%', height: '44%' },
  { id: 'right-leg', label: 'Right Leg', top: '54%', left: '52%', width: '20%', height: '44%' },
];

// Simulated analysis function
function analyzeSymptoms(
  selectedSymptoms: string[],
): {
  results: AnalysisResult[];
  redFlags: RedFlag[];
  followUps: FollowUpQuestion[];
} {
  const results: AnalysisResult[] = [];
  const redFlags: RedFlag[] = [];
  const followUps: FollowUpQuestion[] = [];

  // Wound infection detection
  const woundSymptomIds = ['redness', 'swelling', 'discharge', 'wound-odor', 'wound-pain'];
  const woundCount = selectedSymptoms.filter((s) => woundSymptomIds.includes(s)).length;
  if (woundCount >= 2) {
    results.push({
      condition: 'Possible Wound Infection',
      probability: Math.min(95, 40 + woundCount * 15),
      urgency: woundCount >= 4 ? 'high' : 'moderate',
      actions: [
        'Monitor wound for further changes',
        'Keep the area clean and dry',
        'Contact your care team if symptoms worsen',
      ],
    });
  }

  // Fever with wound symptoms = red flag
  if (selectedSymptoms.includes('fever') && woundCount >= 1) {
    redFlags.push({
      message: 'Fever combined with wound symptoms may indicate a serious infection',
      instruction:
        'Contact your care team immediately or visit urgent care if your temperature exceeds 101.3F (38.5C).',
    });
  }

  // Cardiovascular concerns
  if (selectedSymptoms.includes('chest-pain') || selectedSymptoms.includes('shortness-breath')) {
    results.push({
      condition: 'Cardiovascular Concern',
      probability: 60,
      urgency: 'high',
      actions: [
        'Sit down and rest immediately',
        'If pain is severe, call emergency services (911)',
        'Note the time symptoms started',
      ],
    });
    if (selectedSymptoms.includes('chest-pain')) {
      redFlags.push({
        message: 'Chest pain requires immediate medical attention',
        instruction: 'If you are experiencing severe chest pain, call 911 immediately.',
      });
    }
  }

  // Post-op dehydration / digestive
  const digestiveSymptomIds = ['nausea', 'vomiting', 'diarrhea', 'appetite-loss'];
  const digestiveCount = selectedSymptoms.filter((s) => digestiveSymptomIds.includes(s)).length;
  if (digestiveCount >= 2) {
    results.push({
      condition: 'Post-Operative Digestive Issues',
      probability: 55 + digestiveCount * 10,
      urgency: 'moderate',
      actions: [
        'Stay hydrated with small, frequent sips',
        'Try bland foods (toast, crackers, rice)',
        'Report persistent vomiting to your care team',
      ],
    });
  }

  // Neurological concerns
  if (selectedSymptoms.includes('confusion') || selectedSymptoms.includes('vision-changes')) {
    results.push({
      condition: 'Neurological Concern',
      probability: 45,
      urgency: 'high',
      actions: [
        'Stop any physical activity',
        'Have someone stay with you',
        'Contact your doctor right away',
      ],
    });
  }

  // General post-op recovery
  if (selectedSymptoms.includes('fatigue') || selectedSymptoms.includes('insomnia')) {
    results.push({
      condition: 'Normal Post-Operative Recovery',
      probability: 70,
      urgency: 'low',
      actions: [
        'Rest as needed',
        'Maintain a regular sleep schedule',
        'Light activity as tolerated',
      ],
    });
  }

  // Psychological
  if (selectedSymptoms.includes('anxiety') || selectedSymptoms.includes('depression')) {
    results.push({
      condition: 'Post-Surgical Emotional Adjustment',
      probability: 65,
      urgency: 'low',
      actions: [
        'This is common after surgery and usually improves',
        'Talk to your care team about how you feel',
        'Consider speaking with a counselor if persistent',
      ],
    });
  }

  // Follow-up questions
  if (woundCount >= 1) {
    followUps.push({
      id: 'fq-wound-timing',
      question: 'When did you first notice changes in your wound?',
      options: ['Today', 'Yesterday', '2-3 days ago', 'More than 3 days ago'],
    });
  }
  if (selectedSymptoms.includes('fever')) {
    followUps.push({
      id: 'fq-temp',
      question: 'What was your highest recorded temperature?',
      options: ['Below 100.4F', '100.4F - 101.3F', 'Above 101.3F', "Haven't measured"],
    });
  }
  if (digestiveCount >= 1) {
    followUps.push({
      id: 'fq-meds',
      question: 'Are you currently taking pain medications (opioids)?',
      options: ['Yes', 'No', 'Not sure'],
    });
  }

  // Fallback if nothing matched
  if (results.length === 0) {
    results.push({
      condition: 'No Specific Condition Identified',
      probability: 30,
      urgency: 'low',
      actions: [
        'Continue monitoring your symptoms',
        'Log symptoms daily in your journal',
        'Contact your care team if symptoms change or worsen',
      ],
    });
  }

  return { results, redFlags, followUps };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UrgencyBadge({ urgency }: { urgency: AnalysisResult['urgency'] }) {
  const config = {
    low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Low' },
    moderate: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: 'Moderate',
    },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'High' },
    emergency: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      label: 'Emergency',
    },
  }[urgency];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      {urgency === 'emergency' && <ShieldAlert className="w-3 h-3" />}
      {urgency === 'high' && <AlertTriangle className="w-3 h-3" />}
      {config.label}
    </span>
  );
}

function ProbabilityBar({ value }: { value: number }) {
  const color =
    value >= 75
      ? 'bg-red-500'
      : value >= 50
        ? 'bg-amber-500'
        : value >= 25
          ? 'bg-yellow-400'
          : 'bg-green-400';

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SymptomChecker() {
  // State
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<SymptomCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpQuestion[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});

  // Handlers
  const toggleSymptom = useCallback((symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((id) => id !== symptomId) : [...prev, symptomId],
    );
  }, []);

  const toggleRegion = useCallback((regionId: string) => {
    setSelectedRegions((prev) =>
      prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId],
    );
  }, []);

  const handleCheckSymptoms = useCallback(() => {
    if (selectedSymptoms.length === 0) return;
    setIsAnalyzing(true);
    setResults(null);
    setRedFlags([]);
    setFollowUps([]);
    setFollowUpAnswers({});

    // Simulate async analysis
    setTimeout(() => {
      const analysis = analyzeSymptoms(selectedSymptoms);
      setResults(analysis.results);
      setRedFlags(analysis.redFlags);
      setFollowUps(analysis.followUps);
      setIsAnalyzing(false);
    }, 1500);
  }, [selectedSymptoms]);

  const handleReset = useCallback(() => {
    setSelectedSymptoms([]);
    setSelectedRegions([]);
    setResults(null);
    setRedFlags([]);
    setFollowUps([]);
    setFollowUpAnswers({});
    setSearchQuery('');
    setExpandedCategory(null);
  }, []);

  // Filtered symptoms for search
  const filteredSymptoms = searchQuery.trim()
    ? SYMPTOMS.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-medical-primary/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-medical-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-medical-text">Symptom Checker</h2>
            <p className="text-sm text-gray-500">
              Select your symptoms below for a preliminary assessment
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          This tool provides guidance only and does not replace professional medical advice.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Symptom selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search symptoms..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Search results dropdown */}
            <AnimatePresence>
              {searchQuery.trim() && filteredSymptoms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto"
                >
                  {filteredSymptoms.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom.id);
                    return (
                      <button
                        key={symptom.id}
                        type="button"
                        onClick={() => toggleSymptom(symptom.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                          isSelected
                            ? 'bg-medical-primary/5 text-medical-primary'
                            : 'hover:bg-gray-50 text-medical-text'
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-medical-primary flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0" />
                        )}
                        <span>{symptom.label}</span>
                        <span className="ml-auto text-xs text-gray-400 capitalize">
                          {symptom.category}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Categorized symptom lists */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-medical-text">Symptoms by Category</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {SYMPTOM_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const categorySymptoms = SYMPTOMS.filter((s) => s.category === category.key);
                const selectedCount = categorySymptoms.filter((s) =>
                  selectedSymptoms.includes(s.id),
                ).length;
                const isExpanded = expandedCategory === category.key;

                return (
                  <div key={category.key}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategory(isExpanded ? null : category.key)
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <Icon className={`w-5 h-5 ${category.color} flex-shrink-0`} />
                      <span className="text-sm font-medium text-medical-text flex-1">
                        {category.label}
                      </span>
                      {selectedCount > 0 && (
                        <span className="text-xs font-semibold text-white bg-medical-primary rounded-full px-2 py-0.5">
                          {selectedCount}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {categorySymptoms.map((symptom) => {
                              const isSelected = selectedSymptoms.includes(symptom.id);
                              return (
                                <button
                                  key={symptom.id}
                                  type="button"
                                  onClick={() => toggleSymptom(symptom.id)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                                    isSelected
                                      ? 'bg-medical-primary/10 text-medical-primary border border-medical-primary/30 font-medium'
                                      : 'bg-gray-50 text-medical-text border border-transparent hover:border-gray-200'
                                  }`}
                                >
                                  {isSelected ? (
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0" />
                                  )}
                                  {symptom.label}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected symptoms summary */}
          <AnimatePresence>
            {selectedSymptoms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-medical-text">
                    Selected Symptoms ({selectedSymptoms.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((symptomId) => {
                    const symptom = SYMPTOMS.find((s) => s.id === symptomId);
                    if (!symptom) return null;
                    return (
                      <motion.button
                        key={symptomId}
                        type="button"
                        layout
                        onClick={() => toggleSymptom(symptomId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-medical-primary/10 text-medical-primary rounded-full text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        {symptom.label}
                        <XCircle className="w-3 h-3" />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: Body map */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-medical-text mb-3">
              Body Map
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Tap regions where you feel symptoms
            </p>

            {/* Body outline */}
            <div className="relative w-full aspect-[3/5] bg-gray-50 rounded-lg border border-gray-200 mx-auto max-w-[220px]">
              {/* Simple body silhouette outline */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[60%] h-[90%] relative">
                  {/* Head */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36%] h-[12%] rounded-full border-2 border-gray-300" />
                  {/* Torso */}
                  <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-[50%] h-[32%] rounded-t-lg border-2 border-gray-300 border-b-0" />
                  {/* Lower torso */}
                  <div className="absolute top-[38%] left-1/2 -translate-x-1/2 w-[44%] h-[14%] border-2 border-gray-300 border-t-0" />
                  {/* Left leg */}
                  <div className="absolute top-[52%] left-[22%] w-[18%] h-[46%] border-2 border-gray-300 rounded-b-lg" />
                  {/* Right leg */}
                  <div className="absolute top-[52%] right-[22%] w-[18%] h-[46%] border-2 border-gray-300 rounded-b-lg" />
                  {/* Left arm */}
                  <div className="absolute top-[16%] left-0 w-[14%] h-[32%] border-2 border-gray-300 rounded-b-lg" />
                  {/* Right arm */}
                  <div className="absolute top-[16%] right-0 w-[14%] h-[32%] border-2 border-gray-300 rounded-b-lg" />
                </div>
              </div>

              {/* Clickable regions */}
              {BODY_REGIONS.map((region) => {
                const isSelected = selectedRegions.includes(region.id);
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => toggleRegion(region.id)}
                    className={`absolute rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-medical-primary/30 border-2 border-medical-primary'
                        : 'bg-transparent hover:bg-medical-primary/10 border-2 border-transparent'
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

            {/* Selected regions */}
            {selectedRegions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedRegions.map((regionId) => {
                  const region = BODY_REGIONS.find((r) => r.id === regionId);
                  return (
                    <span
                      key={regionId}
                      className="text-xs bg-medical-primary/10 text-medical-primary px-2 py-1 rounded-full font-medium"
                    >
                      {region?.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Check Symptoms button */}
          <button
            type="button"
            onClick={handleCheckSymptoms}
            disabled={selectedSymptoms.length === 0 || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-medical-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isAnalyzing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity className="w-5 h-5" />
                </motion.div>
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Check Symptoms
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Red flag alerts */}
            {redFlags.length > 0 && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-red-50 border-2 border-red-500 rounded-lg p-5"
                role="alert"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-red-900">
                    Red Flag Alert
                  </h3>
                </div>
                <div className="space-y-3">
                  {redFlags.map((flag, index) => (
                    <div
                      key={index}
                      className="bg-white/60 rounded-lg p-4 border border-red-200"
                    >
                      <p className="text-sm font-semibold text-red-800 mb-1">
                        <AlertTriangle className="w-4 h-4 inline mr-1 -mt-0.5" />
                        {flag.message}
                      </p>
                      <p className="text-sm text-red-700">{flag.instruction}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Condition results */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-medical-text mb-4">
                Assessment Results
              </h3>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-medical-text">
                        {result.condition}
                      </h4>
                      <UrgencyBadge urgency={result.urgency} />
                    </div>

                    {/* Probability bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Likelihood</span>
                        <span className="font-mono font-semibold">{result.probability}%</span>
                      </div>
                      <ProbabilityBar value={result.probability} />
                    </div>

                    {/* Recommended actions */}
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Recommended Actions
                      </h5>
                      <ul className="space-y-1">
                        {result.actions.map((action, actionIdx) => (
                          <li
                            key={actionIdx}
                            className="flex items-start gap-2 text-sm text-medical-text"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-medical-primary flex-shrink-0 mt-0.5" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Follow-up questions */}
            {followUps.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-medical-text mb-1">
                  Follow-Up Questions
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Answer these to help refine your assessment.
                </p>
                <div className="space-y-4">
                  {followUps.map((fq) => (
                    <div key={fq.id}>
                      <p className="text-sm font-medium text-medical-text mb-2">
                        {fq.question}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fq.options.map((option) => {
                          const isSelected = followUpAnswers[fq.id] === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setFollowUpAnswers((prev) => ({
                                  ...prev,
                                  [fq.id]: option,
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                isSelected
                                  ? 'bg-medical-primary text-white border-medical-primary'
                                  : 'bg-white text-medical-text border-gray-200 hover:border-medical-primary/50'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Important Reminder</p>
                <p className="text-xs text-amber-700 mt-1">
                  This symptom checker provides general guidance only and is not a substitute for
                  professional medical advice, diagnosis, or treatment. Always consult your
                  healthcare provider with concerns about your recovery.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
