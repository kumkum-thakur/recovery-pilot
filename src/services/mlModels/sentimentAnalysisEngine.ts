// ============================================================================
// Sentiment Analysis Engine for Patient Recovery Messages
//
// NLP-based sentiment analysis tailored to post-operative patient communications,
// journal entries, and symptom descriptions. Uses a medical sentiment lexicon,
// bag-of-words tokenization, TF-IDF weighting, and rule-based emotion detection.
//
// Features:
// - 300+ word medical sentiment lexicon with scores from -1 to +1
// - Bag-of-words tokenizer with medical abbreviation handling
// - TF-IDF implementation for keyword importance weighting
// - Multi-emotion classification (anxiety, frustration, hope, pain, relief, fear)
// - Depression/anxiety screening keyword detection
// - Sentiment trend tracking over time with alerts
// - 50+ test sentences with expected results
//
// No external dependencies. Pure TypeScript.
// ============================================================================

// ============================================================================
// Types
// ============================================================================

export const SentimentLabel = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  MIXED: 'mixed',
} as const;
export type SentimentLabel = typeof SentimentLabel[keyof typeof SentimentLabel];

export const TrendDirection = {
  IMPROVING: 'improving',
  STABLE: 'stable',
  DECLINING: 'declining',
  VOLATILE: 'volatile',
} as const;
export type TrendDirection = typeof TrendDirection[keyof typeof TrendDirection];

export const AlertLevel = {
  INFO: 'info',
  WARNING: 'warning',
  URGENT: 'urgent',
  CRITICAL: 'critical',
} as const;
export type AlertLevel = typeof AlertLevel[keyof typeof AlertLevel];

/** Result of analyzing a single text */
export interface SentimentResult {
  sentiment: SentimentLabel;
  score: number; // -1 to +1
  emotions: EmotionScores;
  keywords: string[];
  alerts: string[];
}

/** Emotion dimension scores (0 to 1) */
export interface EmotionScores {
  anxiety: number;
  frustration: number;
  hope: number;
  pain: number;
  relief: number;
  fear: number;
}

/** Result of tracking sentiment over multiple entries */
export interface SentimentTrendResult {
  trend: TrendDirection;
  averageSentiment: number;
  alerts: string[];
  dataPoints: Array<{ date: string; score: number; sentiment: SentimentLabel }>;
  slope: number;
  volatility: number;
}

/** A single entry for trend tracking */
export interface JournalEntry {
  text: string;
  date: string; // ISO date string
}

/** TF-IDF document representation */
interface TfIdfDocument {
  termFrequencies: Map<string, number>;
  magnitude: number;
}

/** Internal token with metadata */
interface Token {
  word: string;
  isNegated: boolean;
  isIntensified: boolean;
  position: number;
}

/** Test case for validation */
export interface SentimentTestCase {
  input: string;
  expectedSentiment: SentimentLabel;
  expectedScoreRange: [number, number];
  description: string;
}

// ============================================================================
// Medical Sentiment Lexicon (300+ words)
// ============================================================================

/**
 * Sentiment scores range from -1.0 (extremely negative) to +1.0 (extremely positive).
 * Scores are calibrated for post-operative recovery context:
 * - Pain descriptors: strongly negative
 * - Recovery/healing language: positive
 * - Medication feedback: varies by context
 * - Emotional states: mapped to clinical significance
 */
const MEDICAL_SENTIMENT_LEXICON: Record<string, number> = {
  // --- Pain Descriptors (negative) ---
  'pain': -0.7,
  'painful': -0.75,
  'aching': -0.55,
  'ache': -0.5,
  'agony': -0.95,
  'agonizing': -0.95,
  'burning': -0.65,
  'throbbing': -0.7,
  'stabbing': -0.85,
  'sharp': -0.6,
  'dull': -0.35,
  'cramping': -0.55,
  'cramp': -0.5,
  'sore': -0.45,
  'soreness': -0.45,
  'stiff': -0.35,
  'stiffness': -0.35,
  'tender': -0.4,
  'tenderness': -0.4,
  'shooting': -0.7,
  'radiating': -0.55,
  'pulsating': -0.5,
  'gnawing': -0.6,
  'twinge': -0.35,
  'pinching': -0.45,
  'raw': -0.5,
  'excruciating': -0.98,
  'unbearable': -0.95,
  'intolerable': -0.9,
  'intense': -0.5,
  'severe': -0.75,
  'mild': -0.15,
  'moderate': -0.35,
  'chronic': -0.55,
  'persistent': -0.4,
  'constant': -0.45,
  'intermittent': -0.25,
  'flare': -0.55,
  'flareup': -0.6,

  // --- Physical Symptoms (negative) ---
  'swelling': -0.5,
  'swollen': -0.5,
  'inflamed': -0.55,
  'inflammation': -0.5,
  'infection': -0.8,
  'infected': -0.85,
  'fever': -0.6,
  'nausea': -0.55,
  'nauseous': -0.55,
  'vomiting': -0.7,
  'dizzy': -0.5,
  'dizziness': -0.5,
  'lightheaded': -0.45,
  'fatigue': -0.45,
  'fatigued': -0.45,
  'exhausted': -0.6,
  'exhaustion': -0.6,
  'tired': -0.35,
  'weakness': -0.5,
  'weak': -0.45,
  'numbness': -0.45,
  'numb': -0.4,
  'tingling': -0.35,
  'bleeding': -0.65,
  'discharge': -0.5,
  'pus': -0.7,
  'redness': -0.4,
  'bruising': -0.35,
  'bruised': -0.35,
  'itching': -0.3,
  'itchy': -0.3,
  'insomnia': -0.55,
  'sleepless': -0.5,
  'restless': -0.4,
  'constipated': -0.4,
  'constipation': -0.4,
  'diarrhea': -0.5,
  'headache': -0.45,
  'migraine': -0.65,
  'spasm': -0.5,
  'spasms': -0.55,
  'stinging': -0.5,
  'irritated': -0.45,
  'irritation': -0.4,
  'discomfort': -0.35,
  'uncomfortable': -0.35,
  'worsening': -0.65,
  'worsened': -0.65,
  'deteriorating': -0.75,
  'regression': -0.6,
  'setback': -0.6,
  'relapse': -0.7,
  'complication': -0.7,
  'complications': -0.7,
  'problematic': -0.5,

  // --- Emotional States (negative) ---
  'anxious': -0.6,
  'anxiety': -0.6,
  'worried': -0.5,
  'worry': -0.5,
  'scared': -0.65,
  'frightened': -0.7,
  'terrified': -0.85,
  'afraid': -0.6,
  'fear': -0.65,
  'fearful': -0.65,
  'panic': -0.8,
  'panicking': -0.8,
  'depressed': -0.8,
  'depression': -0.8,
  'hopeless': -0.9,
  'helpless': -0.8,
  'desperate': -0.85,
  'despair': -0.9,
  'lonely': -0.6,
  'isolated': -0.55,
  'frustrated': -0.6,
  'frustrating': -0.55,
  'frustration': -0.6,
  'angry': -0.6,
  'anger': -0.55,
  'irritable': -0.45,
  'miserable': -0.8,
  'suffering': -0.75,
  'struggling': -0.55,
  'overwhelmed': -0.65,
  'stressed': -0.55,
  'stress': -0.5,
  'crying': -0.6,
  'tearful': -0.55,
  'sad': -0.55,
  'sadness': -0.55,
  'upset': -0.5,
  'distressed': -0.65,
  'discouraged': -0.6,
  'defeated': -0.7,
  'worthless': -0.85,
  'burden': -0.6,
  'guilt': -0.55,
  'guilty': -0.55,
  'ashamed': -0.6,
  'embarrassed': -0.45,
  'confused': -0.4,
  'uncertain': -0.35,
  'doubtful': -0.4,
  'impatient': -0.35,
  'restlessness': -0.4,
  'agitated': -0.55,
  'moody': -0.4,

  // --- Recovery & Healing Language (positive) ---
  'better': 0.5,
  'improving': 0.6,
  'improved': 0.6,
  'improvement': 0.6,
  'progress': 0.55,
  'progressing': 0.55,
  'healing': 0.6,
  'healed': 0.7,
  'recovering': 0.6,
  'recovery': 0.55,
  'recovered': 0.7,
  'stronger': 0.6,
  'strength': 0.5,
  'mobile': 0.45,
  'mobility': 0.45,
  'flexible': 0.45,
  'flexibility': 0.45,
  'walking': 0.4,
  'moving': 0.35,
  'active': 0.45,
  'exercise': 0.4,
  'exercising': 0.4,
  'stretching': 0.35,
  'rehabilitation': 0.45,
  'therapy': 0.35,
  'milestone': 0.6,
  'achievement': 0.65,
  'accomplished': 0.6,
  'independent': 0.55,
  'independence': 0.55,
  'normal': 0.35,
  'comfortable': 0.5,
  'manageable': 0.35,
  'tolerable': 0.25,
  'stable': 0.3,
  'steady': 0.35,
  'consistent': 0.3,
  'resolved': 0.6,
  'cleared': 0.55,
  'decreased': 0.35,
  'diminished': 0.3,
  'subsiding': 0.4,
  'relief': 0.6,
  'relieved': 0.6,
  'easing': 0.45,
  'eased': 0.45,
  'painless': 0.5,
  'painfree': 0.55,
  'restored': 0.55,

  // --- Hope & Optimism (positive) ---
  'hopeful': 0.65,
  'hope': 0.55,
  'optimistic': 0.65,
  'positive': 0.5,
  'encouraged': 0.6,
  'encouraging': 0.55,
  'motivated': 0.6,
  'motivation': 0.55,
  'determined': 0.55,
  'confident': 0.6,
  'confidence': 0.55,
  'grateful': 0.7,
  'thankful': 0.65,
  'blessed': 0.6,
  'happy': 0.65,
  'glad': 0.55,
  'pleased': 0.55,
  'satisfied': 0.5,
  'proud': 0.6,
  'excited': 0.6,
  'looking forward': 0.55,
  'great': 0.6,
  'good': 0.45,
  'wonderful': 0.7,
  'excellent': 0.7,
  'amazing': 0.7,
  'fantastic': 0.7,
  'terrific': 0.65,
  'peaceful': 0.5,
  'calm': 0.45,
  'relaxed': 0.5,
  'content': 0.45,
  'supported': 0.5,

  // --- Medication Feedback (varied) ---
  'effective': 0.5,
  'working': 0.4,
  'helpful': 0.5,
  'helps': 0.45,
  'helped': 0.45,
  'sideeffect': -0.5,
  'sideeffects': -0.55,
  'drowsy': -0.4,
  'drowsiness': -0.4,
  'groggy': -0.4,
  'foggy': -0.35,
  'addicted': -0.75,
  'addictive': -0.65,
  'dependent': -0.5,
  'dependency': -0.55,
  'withdrawal': -0.6,
  'overdose': -0.9,
  'allergic': -0.6,
  'reaction': -0.4,
  'rash': -0.45,
  'dosage': -0.05,
  'prescription': 0.0,
  'refill': -0.05,
  'medication': 0.0,
  'medicine': 0.0,
  'pill': -0.05,
  'pills': -0.05,
  'painkiller': -0.15,
  'opioid': -0.2,
  'antibiotic': 0.05,
  'steroid': -0.1,
  'supplement': 0.1,
  'vitamin': 0.15,

  // --- Sleep & Rest (varied) ---
  'rested': 0.5,
  'resting': 0.3,
  'sleeping': 0.2,
  'slept': 0.25,
  'sleep': 0.1,
  'nightmares': -0.6,
  'nightmare': -0.6,
  'wakeup': -0.2,
  'awake': -0.15,
  'tossing': -0.35,

  // --- Social & Support (positive) ---
  'family': 0.35,
  'friends': 0.35,
  'support': 0.4,
  'helping': 0.4,
  'caregiver': 0.3,
  'doctor': 0.15,
  'nurse': 0.15,
  'surgeon': 0.1,
  'appointment': 0.05,
  'checkup': 0.1,
  'visit': 0.1,
  'community': 0.35,

  // --- Functional Activities (positive) ---
  'cooking': 0.4,
  'driving': 0.45,
  'returntowork': 0.45,
  'gardening': 0.45,
  'shopping': 0.35,
  'climbing': 0.35,
  'stairs': 0.15,
  'showering': 0.3,
  'selfdressing': 0.3,
  'eating': 0.2,
  'appetite': 0.15,

  // --- Negative functional states ---
  'bedridden': -0.7,
  'immobile': -0.65,
  'crippled': -0.8,
  'disabled': -0.6,
  'fullydependent': -0.55,
  'housebound': -0.5,
  'wheelchair': -0.3,
  'crutches': -0.2,
  'walker': -0.15,
  'limping': -0.35,
  'hobbling': -0.4,

  // --- Urgency / Crisis words ---
  'emergency': -0.85,
  'hospital': -0.4,
  'ambulance': -0.8,
  'urgent': -0.6,
  'critical': -0.75,
  'dangerous': -0.7,
  'dying': -0.95,
  'death': -0.9,
  'suicidal': -1.0,
  'suicide': -1.0,
  'selfharm': -0.95,
  'harm': -0.7,
  'hurt': -0.5,
  'worse': -0.55,
  'worst': -0.75,
  'terrible': -0.7,
  'horrible': -0.7,
  'awful': -0.65,
  'dreadful': -0.7,
  'unendurable': -0.9,

  // --- Quantifiers and modifiers ---
  'slightly': 0.0,
  'somewhat': 0.0,
  'much': 0.0,
  'very': 0.0,
  'extremely': 0.0,
  'incredibly': 0.0,
  'completely': 0.0,
  'totally': 0.0,
  'barely': -0.1,
  'hardly': -0.1,
  'almost': 0.05,
  'finally': 0.3,
  'still': -0.15,
  'again': -0.15,
  'already': 0.1,
  'never': -0.3,
  'always': -0.1,
  'nothing': -0.3,
  'everything': 0.1,

  // --- Additional recovery words ---
  'bandage': -0.1,
  'stitches': -0.2,
  'staples': -0.2,
  'incision': -0.2,
  'scar': -0.15,
  'wound': -0.3,
  'wounddressing': -0.1,
  'drain': -0.3,
  'swab': -0.1,
  'biopsy': -0.35,
  'xray': -0.1,
  'scan': -0.15,
  'results': 0.05,
  'clearance': 0.5,
  'discharged': 0.4,
  'released': 0.4,
  'homecare': 0.2,
};

// ============================================================================
// Negation Words
// ============================================================================

const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
  'nor', 'cannot', 'cant', "can't", 'dont', "don't", 'doesnt',
  "doesn't", 'didnt', "didn't", 'wont', "won't", 'wouldnt',
  "wouldn't", 'shouldnt', "shouldn't", 'isnt', "isn't", 'arent',
  "aren't", 'wasnt', "wasn't", 'werent', "weren't", 'havent',
  "haven't", 'hasnt', "hasn't", 'without', 'hardly', 'barely',
  'scarcely', 'rarely', 'seldom', 'lack', 'lacking', 'absence',
]);

// ============================================================================
// Intensifier Words
// ============================================================================

const INTENSIFIERS: Record<string, number> = {
  'very': 1.5,
  'extremely': 1.8,
  'incredibly': 1.7,
  'really': 1.4,
  'absolutely': 1.6,
  'completely': 1.5,
  'totally': 1.5,
  'utterly': 1.7,
  'quite': 1.2,
  'somewhat': 0.7,
  'slightly': 0.5,
  'barely': 0.4,
  'hardly': 0.4,
  'a little': 0.6,
  'a bit': 0.6,
  'so': 1.4,
  'much': 1.3,
  'such': 1.3,
  'terribly': 1.6,
  'awfully': 1.5,
  'significantly': 1.4,
  'considerably': 1.3,
  'substantially': 1.3,
  'severely': 1.6,
  'seriously': 1.5,
};

// ============================================================================
// Emotion Keyword Mappings
// ============================================================================

const ANXIETY_KEYWORDS = new Set([
  'anxious', 'anxiety', 'worried', 'worry', 'worrying', 'nervous',
  'panic', 'panicking', 'panicked', 'apprehensive', 'uneasy',
  'restless', 'tense', 'edgy', 'jittery', 'stressed', 'overthinking',
  'dread', 'dreading', 'fearful', 'obsessing', 'hyperventilating',
  'palpitations', 'sweating', 'trembling', 'shaking', 'insomnia',
  'sleepless', 'racing', 'thoughts', 'catastrophizing', 'spiraling',
]);

const FRUSTRATION_KEYWORDS = new Set([
  'frustrated', 'frustrating', 'frustration', 'annoyed', 'annoying',
  'irritated', 'irritating', 'angry', 'anger', 'impatient', 'fed up',
  'sick of', 'tired of', 'enough', 'agitated', 'exasperated',
  'infuriating', 'maddening', 'aggravating', 'bothersome', 'tedious',
  'pointless', 'useless', 'waste', 'ridiculous', 'unfair',
  'disappointed', 'disappointing', 'letdown', 'setback', 'stalled',
]);

const HOPE_KEYWORDS = new Set([
  'hopeful', 'hope', 'hoping', 'optimistic', 'positive', 'encouraged',
  'encouraging', 'promising', 'motivated', 'determined', 'confident',
  'looking forward', 'excited', 'eager', 'anticipating', 'believing',
  'faith', 'trust', 'progress', 'improving', 'better', 'milestone',
  'achievement', 'grateful', 'thankful', 'blessed', 'fortunate',
  'comeback', 'turning point', 'breakthrough', 'light',
]);

const PAIN_KEYWORDS = new Set([
  'pain', 'painful', 'aching', 'ache', 'agony', 'agonizing',
  'burning', 'throbbing', 'stabbing', 'sharp', 'cramping', 'cramp',
  'sore', 'soreness', 'shooting', 'radiating', 'pulsating', 'gnawing',
  'excruciating', 'unbearable', 'intolerable', 'stinging', 'pinching',
  'twinge', 'tender', 'raw', 'hurt', 'hurting', 'hurts',
  'discomfort', 'uncomfortable', 'spasm', 'spasms',
]);

const RELIEF_KEYWORDS = new Set([
  'relief', 'relieved', 'easing', 'eased', 'subsiding', 'fading',
  'diminishing', 'decreasing', 'lessening', 'better', 'improved',
  'comfortable', 'painless', 'painfree', 'manageable', 'tolerable',
  'cleared', 'resolved', 'gone', 'healed', 'recovered', 'resting',
  'peaceful', 'calm', 'relaxed', 'sleeping', 'finally',
]);

const FEAR_KEYWORDS = new Set([
  'scared', 'frightened', 'terrified', 'afraid', 'fear', 'fearful',
  'panic', 'panicking', 'dreading', 'dread', 'horror', 'alarmed',
  'alarming', 'threatening', 'dangerous', 'worried', 'petrified',
  'phobia', 'phobic', 'nightmare', 'nightmares', 'trauma',
  'traumatic', 'flashback', 'startled', 'jumpy', 'hypervigilant',
]);

// ============================================================================
// Depression/Anxiety Screening Keywords
// ============================================================================

const DEPRESSION_SCREENING_KEYWORDS = new Set([
  'hopeless', 'helpless', 'worthless', 'empty', 'numb', 'nothing matters',
  'no point', 'give up', 'giving up', 'cant go on', "can't go on",
  'suicidal', 'suicide', 'kill myself', 'end it', 'self harm', 'selfharm',
  'cutting', 'no reason to live', 'better off dead', 'want to die',
  'dying inside', 'dont care anymore', "don't care anymore",
  'lost interest', 'no motivation', 'no energy', 'cant sleep',
  "can't sleep", 'sleeping all day', 'no appetite', 'overeating',
  'isolated', 'alone', 'nobody cares', 'burden to everyone',
  'crying all day', 'cant stop crying', "can't stop crying",
  'depressed', 'depression', 'dark thoughts', 'despair',
]);

const ANXIETY_SCREENING_KEYWORDS = new Set([
  'panic attack', 'panic attacks', 'hyperventilating', 'cant breathe',
  "can't breathe", 'chest tightness', 'heart racing', 'palpitations',
  'constant worry', 'obsessive thoughts', 'intrusive thoughts',
  'cant relax', "can't relax", 'on edge', 'catastrophizing',
  'expecting the worst', 'doom', 'impending doom',
  'spiraling', 'out of control', 'losing control', 'losing my mind',
  'going crazy', 'anxious all the time', 'generalized anxiety',
  'phobia', 'avoidance', 'agoraphobia', 'social anxiety',
]);

// ============================================================================
// Stop Words
// ============================================================================

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'only', 'own', 'same', 'so',
  'than', 'too', 'just', 'because', 'as', 'until', 'while',
  'that', 'which', 'who', 'whom', 'this', 'these', 'those',
  'am', 'it', 'its', "it's", 'he', 'she', 'they', 'them', 'we',
  'you', 'your', 'my', 'his', 'her', 'our', 'their', 'me', 'him',
  'us', 'i', 'and', 'but', 'or', 'if', 'what',
]);

// ============================================================================
// Utility Functions
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Simple linear regression returning slope, intercept, and r-squared */
function linearRegression(points: Array<{ x: number; y: number }>): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, rSquared: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  const ssRes = points.reduce((acc, p) => {
    const predicted = slope * p.x + intercept;
    return acc + (p.y - predicted) ** 2;
  }, 0);
  const ssTot = points.reduce((acc, p) => acc + (p.y - meanY) ** 2, 0);
  const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, rSquared };
}

// ============================================================================
// Tokenizer
// ============================================================================

/**
 * Tokenize text into words, handling medical abbreviations, contractions,
 * and compound terms. Preserves negation context.
 */
function tokenize(text: string): Token[] {
  // Normalize text
  let normalized = text.toLowerCase();

  // Expand common medical abbreviations
  const abbreviations: Record<string, string> = {
    'pt': 'physical therapy',
    'ot': 'occupational therapy',
    'bp': 'blood pressure',
    'hr': 'heart rate',
    'rx': 'prescription',
    'dx': 'diagnosis',
    'tx': 'treatment',
    'fx': 'fracture',
    'sx': 'symptoms',
    'hx': 'history',
    'er': 'emergency room',
    'ed': 'emergency department',
    'icu': 'intensive care unit',
    'po': 'post operative',
    'prn': 'as needed',
    'nsaid': 'anti inflammatory',
    'rom': 'range of motion',
    'arom': 'active range of motion',
    'adl': 'activities of daily living',
    'bmi': 'body mass index',
    'dvt': 'deep vein thrombosis',
    'pe': 'pulmonary embolism',
  };

  // Replace abbreviations (only when they appear as whole words)
  for (const [abbr, expansion] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    normalized = normalized.replace(regex, expansion);
  }

  // Handle compound terms that should stay together
  normalized = normalized.replace(/side\s*effect/g, 'sideeffect');
  normalized = normalized.replace(/side\s*effects/g, 'sideeffects');
  normalized = normalized.replace(/flare\s*up/g, 'flareup');
  normalized = normalized.replace(/pain\s*free/g, 'painfree');
  normalized = normalized.replace(/self\s*harm/g, 'selfharm');
  normalized = normalized.replace(/looking\s+forward/g, 'looking forward');
  normalized = normalized.replace(/fed\s+up/g, 'fed up');
  normalized = normalized.replace(/sick\s+of/g, 'sick of');
  normalized = normalized.replace(/tired\s+of/g, 'tired of');
  normalized = normalized.replace(/give\s+up/g, 'give up');
  normalized = normalized.replace(/giving\s+up/g, 'giving up');

  // Handle contractions for negation detection
  normalized = normalized.replace(/n't/g, ' not');
  normalized = normalized.replace(/cannot/g, 'can not');

  // Split into words
  const rawWords = normalized
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  const tokens: Token[] = [];
  let negationActive = false;
  let negationWindow = 0;
  let intensifierMultiplier = 1.0;

  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];

    // Check for negation
    if (NEGATION_WORDS.has(word)) {
      negationActive = true;
      negationWindow = 3; // Negation affects next 3 words
      continue;
    }

    // Check for intensifier
    if (INTENSIFIERS[word] !== undefined) {
      intensifierMultiplier = INTENSIFIERS[word];
      continue;
    }

    // Check for sentence-ending punctuation (resets negation)
    if (word.includes('.') || word.includes('!') || word.includes('?')) {
      negationActive = false;
      negationWindow = 0;
    }

    // Decrease negation window
    if (negationWindow > 0) {
      negationWindow--;
      if (negationWindow === 0) {
        negationActive = false;
      }
    }

    tokens.push({
      word,
      isNegated: negationActive,
      isIntensified: intensifierMultiplier !== 1.0,
      position: i,
    });

    // Reset intensifier after one use
    if (intensifierMultiplier !== 1.0) {
      intensifierMultiplier = 1.0;
    }
  }

  return tokens;
}

/**
 * Extract clean words from text for bag-of-words representation.
 * Removes stop words and very short words.
 */
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// ============================================================================
// TF-IDF Implementation
// ============================================================================

/**
 * Compute term frequency for a document.
 * Uses augmented frequency to prevent bias toward longer documents:
 *   TF(t, d) = 0.5 + 0.5 * (f(t, d) / max(f(w, d) for w in d))
 */
function computeTermFrequency(words: string[]): Map<string, number> {
  const rawCounts = new Map<string, number>();
  let maxCount = 0;

  for (const word of words) {
    const count = (rawCounts.get(word) ?? 0) + 1;
    rawCounts.set(word, count);
    if (count > maxCount) maxCount = count;
  }

  const tf = new Map<string, number>();
  if (maxCount === 0) return tf;

  for (const [word, count] of rawCounts.entries()) {
    tf.set(word, 0.5 + 0.5 * (count / maxCount));
  }

  return tf;
}

/**
 * Compute inverse document frequency from a corpus.
 *   IDF(t) = log(N / (1 + df(t)))
 * where N is total documents and df(t) is number containing term t.
 */
function computeIdf(corpus: string[][]): Map<string, number> {
  const N = corpus.length;
  const documentFrequency = new Map<string, number>();

  for (const doc of corpus) {
    const uniqueWords = new Set(doc);
    for (const word of uniqueWords) {
      documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [word, df] of documentFrequency.entries()) {
    idf.set(word, Math.log(N / (1 + df)));
  }

  return idf;
}

/**
 * Build TF-IDF vectors for a corpus of documents.
 */
export function buildTfIdfVectors(
  corpus: string[][],
  idf: Map<string, number>,
): TfIdfDocument[] {
  return corpus.map(doc => {
    const tf = computeTermFrequency(doc);
    const termFrequencies = new Map<string, number>();
    let magnitudeSquared = 0;

    for (const [word, tfScore] of tf.entries()) {
      const idfScore = idf.get(word) ?? 0;
      const tfidf = tfScore * idfScore;
      termFrequencies.set(word, tfidf);
      magnitudeSquared += tfidf * tfidf;
    }

    return {
      termFrequencies,
      magnitude: Math.sqrt(magnitudeSquared),
    };
  });
}

/**
 * Extract top keywords from a text using TF-IDF scoring against
 * a reference corpus of medical recovery texts.
 */
function extractKeywords(text: string, topN: number = 8): string[] {
  const words = extractWords(text);
  if (words.length === 0) return [];

  // Build a small reference corpus from the lexicon categories
  const referenceDocs: string[][] = [
    // Pain document
    Array.from(PAIN_KEYWORDS),
    // Emotion document
    [...Array.from(ANXIETY_KEYWORDS), ...Array.from(FEAR_KEYWORDS)],
    // Recovery document
    Array.from(HOPE_KEYWORDS),
    // Relief document
    Array.from(RELIEF_KEYWORDS),
    // Frustration document
    Array.from(FRUSTRATION_KEYWORDS),
    // The input document itself
    words,
  ];

  const idf = computeIdf(referenceDocs);
  const tf = computeTermFrequency(words);

  // Score each unique word
  const scores: Array<{ word: string; score: number }> = [];
  const seenWords = new Set<string>();

  for (const word of words) {
    if (seenWords.has(word)) continue;
    seenWords.add(word);

    const tfScore = tf.get(word) ?? 0;
    const idfScore = idf.get(word) ?? 0;
    let tfidfScore = tfScore * idfScore;

    // Boost words that appear in the medical lexicon
    if (MEDICAL_SENTIMENT_LEXICON[word] !== undefined) {
      tfidfScore *= 1.5;
    }

    // Boost emotion keywords
    if (
      ANXIETY_KEYWORDS.has(word) || FRUSTRATION_KEYWORDS.has(word) ||
      HOPE_KEYWORDS.has(word) || PAIN_KEYWORDS.has(word) ||
      RELIEF_KEYWORDS.has(word) || FEAR_KEYWORDS.has(word)
    ) {
      tfidfScore *= 1.3;
    }

    scores.push({ word, score: tfidfScore });
  }

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.word);
}

// ============================================================================
// Emotion Scoring
// ============================================================================

/**
 * Compute emotion dimension scores based on keyword presence and intensity.
 */
function computeEmotionScores(tokens: Token[]): EmotionScores {
  const counts = {
    anxiety: 0,
    frustration: 0,
    hope: 0,
    pain: 0,
    relief: 0,
    fear: 0,
  };

  const weights = {
    anxiety: 0,
    frustration: 0,
    hope: 0,
    pain: 0,
    relief: 0,
    fear: 0,
  };

  for (const token of tokens) {
    const word = token.word;
    const negationFlip = token.isNegated ? -1 : 1;

    if (ANXIETY_KEYWORDS.has(word)) {
      counts.anxiety++;
      weights.anxiety += negationFlip > 0 ? 1.0 : 0.3;
    }
    if (FRUSTRATION_KEYWORDS.has(word)) {
      counts.frustration++;
      weights.frustration += negationFlip > 0 ? 1.0 : 0.3;
    }
    if (HOPE_KEYWORDS.has(word)) {
      counts.hope++;
      // Negated hope contributes to anxiety/frustration instead
      if (negationFlip < 0) {
        weights.anxiety += 0.5;
        weights.frustration += 0.3;
      } else {
        weights.hope += 1.0;
      }
    }
    if (PAIN_KEYWORDS.has(word)) {
      counts.pain++;
      if (negationFlip < 0) {
        // "not in pain" -> relief
        weights.relief += 0.6;
      } else {
        weights.pain += 1.0;
      }
    }
    if (RELIEF_KEYWORDS.has(word)) {
      counts.relief++;
      weights.relief += negationFlip > 0 ? 1.0 : 0.3;
    }
    if (FEAR_KEYWORDS.has(word)) {
      counts.fear++;
      weights.fear += negationFlip > 0 ? 1.0 : 0.3;
    }
  }

  // Normalize to 0-1 range using sigmoid-like scaling
  const normalize = (weight: number): number => {
    if (weight <= 0) return 0;
    // Using a saturating function: score = 1 - exp(-k * weight)
    // k chosen so that weight=3 gives ~0.8
    return Math.round(Math.min(1, 1 - Math.exp(-0.55 * weight)) * 100) / 100;
  };

  return {
    anxiety: normalize(weights.anxiety),
    frustration: normalize(weights.frustration),
    hope: normalize(weights.hope),
    pain: normalize(weights.pain),
    relief: normalize(weights.relief),
    fear: normalize(weights.fear),
  };
}

// ============================================================================
// Depression/Anxiety Screening
// ============================================================================

/**
 * Screen text for depression and anxiety indicators.
 * Returns alerts for any concerning patterns detected.
 */
function screenForMentalHealth(text: string, _tokens: Token[]): string[] {
  const alerts: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for depression screening keywords
  const depressionHits: string[] = [];
  for (const keyword of DEPRESSION_SCREENING_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      depressionHits.push(keyword);
    }
  }

  // Check for suicidal ideation (highest priority)
  const suicidalKeywords = ['suicidal', 'suicide', 'kill myself', 'want to die',
    'end it all', 'better off dead', 'no reason to live'];
  for (const keyword of suicidalKeywords) {
    if (lowerText.includes(keyword)) {
      alerts.push(
        `CRITICAL: Suicidal ideation detected ("${keyword}"). ` +
        'Immediate clinical intervention recommended. Contact crisis services.'
      );
    }
  }

  // Check for self-harm
  const selfHarmKeywords = ['self harm', 'selfharm', 'cutting myself', 'hurting myself'];
  for (const keyword of selfHarmKeywords) {
    if (lowerText.includes(keyword)) {
      alerts.push(
        `URGENT: Self-harm language detected ("${keyword}"). ` +
        'Clinical assessment recommended.'
      );
    }
  }

  // Depression screening threshold
  if (depressionHits.length >= 3) {
    alerts.push(
      `WARNING: Multiple depression indicators detected (${depressionHits.length} markers: ` +
      `${depressionHits.slice(0, 4).join(', ')}). ` +
      'Consider PHQ-9 screening.'
    );
  } else if (depressionHits.length >= 1) {
    alerts.push(
      `INFO: Depression-related language detected (${depressionHits.join(', ')}). ` +
      'Monitor for patterns.'
    );
  }

  // Anxiety screening
  const anxietyHits: string[] = [];
  for (const keyword of ANXIETY_SCREENING_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      anxietyHits.push(keyword);
    }
  }

  if (anxietyHits.length >= 3) {
    alerts.push(
      `WARNING: Multiple anxiety indicators detected (${anxietyHits.length} markers: ` +
      `${anxietyHits.slice(0, 4).join(', ')}). ` +
      'Consider GAD-7 screening.'
    );
  } else if (anxietyHits.length >= 1) {
    alerts.push(
      `INFO: Anxiety-related language detected (${anxietyHits.join(', ')}). ` +
      'Monitor for patterns.'
    );
  }

  // Check for pain crisis language
  const painCrisisIndicators = [
    'unbearable pain', 'excruciating', 'agony', "can't take it",
    'cant take it', 'worst pain', 'pain is getting worse',
    'nothing helps', 'nothing works', 'medication not working',
  ];
  for (const indicator of painCrisisIndicators) {
    if (lowerText.includes(indicator)) {
      alerts.push(
        `WARNING: Pain crisis language detected ("${indicator}"). ` +
        'Consider pain management review.'
      );
      break; // One alert per category is enough
    }
  }

  // Check for social isolation
  const isolationIndicators = ['nobody cares', 'all alone', 'no one helps',
    'no support', 'abandoned', 'forgotten'];
  const isolationHits = isolationIndicators.filter(i => lowerText.includes(i));
  if (isolationHits.length >= 1) {
    alerts.push(
      `INFO: Social isolation language detected ("${isolationHits[0]}"). ` +
      'Consider social support assessment.'
    );
  }

  return alerts;
}

// ============================================================================
// Core Sentiment Analysis
// ============================================================================

/**
 * Analyze the sentiment of a text string.
 *
 * Uses a combination of:
 * 1. Medical sentiment lexicon lookup with negation and intensifier handling
 * 2. Emotion keyword detection for multi-dimensional scoring
 * 3. Depression/anxiety screening for clinical alerts
 * 4. TF-IDF keyword extraction for important terms
 *
 * @param text - The patient message, journal entry, or symptom description
 * @returns SentimentResult with sentiment label, score, emotions, keywords, and alerts
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return {
      sentiment: SentimentLabel.NEUTRAL,
      score: 0,
      emotions: { anxiety: 0, frustration: 0, hope: 0, pain: 0, relief: 0, fear: 0 },
      keywords: [],
      alerts: [],
    };
  }

  const tokens = tokenize(text);

  // --- Lexicon-based sentiment scoring ---
  let sentimentSum = 0;
  let sentimentCount = 0;
  let positiveScore = 0;
  let negativeScore = 0;
  let positiveCount = 0;
  let negativeCount = 0;

  // Track intensifier context
  let currentIntensifier = 1.0;

  for (const token of tokens) {
    const word = token.word;

    // Check if word is an intensifier
    if (INTENSIFIERS[word] !== undefined) {
      currentIntensifier = INTENSIFIERS[word];
      continue;
    }

    // Look up in lexicon
    const lexiconScore = MEDICAL_SENTIMENT_LEXICON[word];
    if (lexiconScore !== undefined && lexiconScore !== 0) {
      let adjustedScore = lexiconScore;

      // Apply negation (flip the sign, but dampen slightly)
      if (token.isNegated) {
        adjustedScore = -adjustedScore * 0.75;
      }

      // Apply intensifier
      if (currentIntensifier !== 1.0) {
        if (adjustedScore > 0) {
          adjustedScore = Math.min(1, adjustedScore * currentIntensifier);
        } else {
          adjustedScore = Math.max(-1, adjustedScore * currentIntensifier);
        }
        currentIntensifier = 1.0;
      }

      sentimentSum += adjustedScore;
      sentimentCount++;

      if (adjustedScore > 0) {
        positiveScore += adjustedScore;
        positiveCount++;
      } else if (adjustedScore < 0) {
        negativeScore += Math.abs(adjustedScore);
        negativeCount++;
      }
    } else {
      // Reset intensifier if word is not in lexicon
      currentIntensifier = 1.0;
    }
  }

  // --- Compute final sentiment score ---
  let score: number;
  if (sentimentCount === 0) {
    score = 0;
  } else {
    // Weighted average with slight dampening for mixed content
    score = sentimentSum / sentimentCount;

    // Apply sentence-level heuristics
    // More negative words with few positive ones: push toward negative
    if (negativeCount > positiveCount * 2) {
      score = Math.min(score, score * 1.15);
    }
    // More positive words with few negative ones: push toward positive
    if (positiveCount > negativeCount * 2) {
      score = Math.max(score, score * 1.15);
    }
  }

  score = clamp(Math.round(score * 100) / 100, -1, 1);

  // --- Determine sentiment label ---
  let sentiment: SentimentLabel;
  const isMixed = positiveCount >= 2 && negativeCount >= 2
    && Math.abs(positiveScore - negativeScore) < (positiveScore + negativeScore) * 0.4;

  if (isMixed) {
    sentiment = SentimentLabel.MIXED;
  } else if (score > 0.15) {
    sentiment = SentimentLabel.POSITIVE;
  } else if (score < -0.15) {
    sentiment = SentimentLabel.NEGATIVE;
  } else {
    sentiment = SentimentLabel.NEUTRAL;
  }

  // --- Compute emotion scores ---
  const emotions = computeEmotionScores(tokens);

  // --- Extract keywords ---
  const keywords = extractKeywords(text);

  // --- Screen for mental health concerns ---
  const alerts = screenForMentalHealth(text, tokens);

  return {
    sentiment,
    score,
    emotions,
    keywords,
    alerts,
  };
}

// ============================================================================
// Sentiment Trend Tracking
// ============================================================================

/**
 * Track sentiment trends over a series of journal entries.
 *
 * Analyzes each entry, computes a trend line using linear regression,
 * and generates alerts for concerning patterns.
 *
 * @param entries - Array of journal entries with text and date
 * @returns SentimentTrendResult with trend direction, average, and alerts
 */
export function trackSentimentTrend(
  entries: Array<{ text: string; date: string }>,
): SentimentTrendResult {
  if (entries.length === 0) {
    return {
      trend: TrendDirection.STABLE,
      averageSentiment: 0,
      alerts: [],
      dataPoints: [],
      slope: 0,
      volatility: 0,
    };
  }

  // Sort entries chronologically
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Analyze each entry
  const dataPoints: Array<{ date: string; score: number; sentiment: SentimentLabel }> = [];
  const allSentimentAlerts: string[] = [];

  for (const entry of sorted) {
    const result = analyzeSentiment(entry.text);
    dataPoints.push({
      date: entry.date,
      score: result.score,
      sentiment: result.sentiment,
    });
    // Collect critical alerts from individual entries
    for (const alert of result.alerts) {
      if (alert.startsWith('CRITICAL') || alert.startsWith('URGENT')) {
        allSentimentAlerts.push(`[${entry.date}] ${alert}`);
      }
    }
  }

  // Compute average sentiment
  const scores = dataPoints.map(dp => dp.score);
  const averageSentiment = Math.round(
    (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
  ) / 100;

  // Compute trend using linear regression
  const firstDate = new Date(sorted[0].date).getTime();
  const regressionPoints = dataPoints.map(dp => ({
    x: (new Date(dp.date).getTime() - firstDate) / (1000 * 60 * 60 * 24), // days
    y: dp.score,
  }));

  const regression = linearRegression(regressionPoints);
  const slope = Math.round(regression.slope * 1000) / 1000;

  // Compute volatility (standard deviation of scores)
  const mean = averageSentiment;
  const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  const volatility = Math.round(Math.sqrt(variance) * 100) / 100;

  // Determine trend direction
  let trend: TrendDirection;
  if (volatility > 0.5 && Math.abs(slope) < 0.02) {
    trend = TrendDirection.VOLATILE;
  } else if (slope > 0.02) {
    trend = TrendDirection.IMPROVING;
  } else if (slope < -0.02) {
    trend = TrendDirection.DECLINING;
  } else {
    trend = TrendDirection.STABLE;
  }

  // Generate trend-level alerts
  const alerts = [...allSentimentAlerts];

  // Check for sustained negative sentiment
  if (entries.length >= 5) {
    const recentScores = scores.slice(-5);
    const allNegative = recentScores.every(s => s < -0.2);
    if (allNegative) {
      alerts.push(
        'WARNING: Sustained negative sentiment detected across last 5 entries. ' +
        'Consider clinical assessment for mood disorder.'
      );
    }
  }

  // Check for sharp decline
  if (entries.length >= 3) {
    const recentScores = scores.slice(-3);
    const olderScores = scores.slice(0, Math.max(1, scores.length - 3));
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

    if (olderAvg - recentAvg > 0.5) {
      alerts.push(
        'WARNING: Sharp decline in sentiment detected. ' +
        `Average dropped from ${olderAvg.toFixed(2)} to ${recentAvg.toFixed(2)}. ` +
        'Review patient status.'
      );
    }
  }

  // Check for high volatility
  if (volatility > 0.6) {
    alerts.push(
      'INFO: High emotional volatility detected (std dev: ' +
      `${volatility.toFixed(2)}). Patient may benefit from emotional support.`
    );
  }

  // Check for consistently low sentiment
  if (averageSentiment < -0.4) {
    alerts.push(
      'WARNING: Overall negative sentiment trend (avg: ' +
      `${averageSentiment.toFixed(2)}). ` +
      'Consider depression screening (PHQ-9) and support services.'
    );
  }

  return {
    trend,
    averageSentiment,
    alerts,
    dataPoints,
    slope,
    volatility,
  };
}

// ============================================================================
// Batch Analysis Utilities
// ============================================================================

/**
 * Analyze multiple texts and return aggregate statistics.
 */
export function analyzeBatch(texts: string[]): {
  results: SentimentResult[];
  summary: {
    averageScore: number;
    sentimentDistribution: Record<SentimentLabel, number>;
    topEmotions: Array<{ emotion: string; avgScore: number }>;
    totalAlerts: number;
    criticalAlerts: number;
  };
} {
  const results = texts.map(t => analyzeSentiment(t));

  const avgScore = results.length > 0
    ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 100) / 100
    : 0;

  const distribution: Record<string, number> = {
    [SentimentLabel.POSITIVE]: 0,
    [SentimentLabel.NEGATIVE]: 0,
    [SentimentLabel.NEUTRAL]: 0,
    [SentimentLabel.MIXED]: 0,
  };
  for (const r of results) {
    distribution[r.sentiment]++;
  }

  // Aggregate emotions
  const emotionSums = { anxiety: 0, frustration: 0, hope: 0, pain: 0, relief: 0, fear: 0 };
  for (const r of results) {
    for (const [emotion, score] of Object.entries(r.emotions)) {
      emotionSums[emotion as keyof EmotionScores] += score;
    }
  }
  const n = results.length || 1;
  const topEmotions = Object.entries(emotionSums)
    .map(([emotion, sum]) => ({ emotion, avgScore: Math.round((sum / n) * 100) / 100 }))
    .sort((a, b) => b.avgScore - a.avgScore);

  const totalAlerts = results.reduce((s, r) => s + r.alerts.length, 0);
  const criticalAlerts = results.reduce(
    (s, r) => s + r.alerts.filter(a => a.startsWith('CRITICAL')).length, 0,
  );

  return {
    results,
    summary: {
      averageScore: avgScore,
      sentimentDistribution: distribution as Record<SentimentLabel, number>,
      topEmotions,
      totalAlerts,
      criticalAlerts,
    },
  };
}

// ============================================================================
// TF-IDF Corpus Builder for Custom Contexts
// ============================================================================

/**
 * Build a TF-IDF model from a corpus of patient texts.
 * Can be used to identify unusual or important terms in new texts.
 */
export class TfIdfCorpus {
  private documents: string[][] = [];
  private idf: Map<string, number> = new Map();

  /**
   * Add a document to the corpus and recompute IDF.
   */
  addDocument(text: string): void {
    const words = extractWords(text);
    this.documents.push(words);
    this.rebuild();
  }

  /**
   * Add multiple documents at once.
   */
  addDocuments(texts: string[]): void {
    for (const text of texts) {
      this.documents.push(extractWords(text));
    }
    this.rebuild();
  }

  /**
   * Get the top TF-IDF terms for a given text relative to this corpus.
   */
  getTopTerms(text: string, topN: number = 10): Array<{ term: string; score: number }> {
    const words = extractWords(text);
    const tf = computeTermFrequency(words);
    const scores: Array<{ term: string; score: number }> = [];

    for (const [word, tfScore] of tf.entries()) {
      const idfScore = this.idf.get(word) ?? Math.log(this.documents.length + 1);
      scores.push({ term: word, score: Math.round(tfScore * idfScore * 1000) / 1000 });
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, topN);
  }

  /**
   * Get the number of documents in the corpus.
   */
  getDocumentCount(): number {
    return this.documents.length;
  }

  private rebuild(): void {
    this.idf = computeIdf(this.documents);
  }
}

// ============================================================================
// Sentiment Analysis Engine Class
// ============================================================================

/**
 * Stateful sentiment analysis engine that maintains history for a patient.
 * Provides ongoing monitoring and trend alerts.
 */
export class SentimentAnalysisEngine {
  private patientHistory: Map<string, Array<{
    date: string;
    result: SentimentResult;
    text: string;
  }>> = new Map();

  private corpus: TfIdfCorpus = new TfIdfCorpus();

  /**
   * Analyze a text and record it for a specific patient.
   */
  analyzeForPatient(patientId: string, text: string, date?: string): SentimentResult {
    const result = analyzeSentiment(text);
    const entryDate = date ?? new Date().toISOString();

    if (!this.patientHistory.has(patientId)) {
      this.patientHistory.set(patientId, []);
    }

    this.patientHistory.get(patientId)!.push({
      date: entryDate,
      result,
      text,
    });

    // Add to corpus for TF-IDF context building
    this.corpus.addDocument(text);

    return result;
  }

  /**
   * Get sentiment trend for a patient over their recorded history.
   */
  getPatientTrend(patientId: string): SentimentTrendResult {
    const history = this.patientHistory.get(patientId) ?? [];
    const entries: JournalEntry[] = history.map(h => ({ text: h.text, date: h.date }));
    return trackSentimentTrend(entries);
  }

  /**
   * Get the most recent N sentiment results for a patient.
   */
  getRecentResults(patientId: string, count: number = 10): Array<{
    date: string;
    result: SentimentResult;
  }> {
    const history = this.patientHistory.get(patientId) ?? [];
    return history
      .slice(-count)
      .map(h => ({ date: h.date, result: h.result }));
  }

  /**
   * Get unique keywords for a text relative to other patient texts.
   */
  getUniqueTerms(text: string, topN: number = 10): Array<{ term: string; score: number }> {
    return this.corpus.getTopTerms(text, topN);
  }

  /**
   * Clear history for a patient.
   */
  clearPatientHistory(patientId: string): void {
    this.patientHistory.delete(patientId);
  }

  /**
   * Get all tracked patient IDs.
   */
  getTrackedPatients(): string[] {
    return Array.from(this.patientHistory.keys());
  }

  /**
   * Get the total number of entries across all patients.
   */
  getTotalEntryCount(): number {
    let total = 0;
    for (const history of this.patientHistory.values()) {
      total += history.length;
    }
    return total;
  }
}

// ============================================================================
// Test Sentences (50+ with expected results)
// ============================================================================

export const SENTIMENT_TEST_CASES: SentimentTestCase[] = [
  // --- Positive Cases ---
  {
    input: 'I am feeling so much better today! The pain has almost completely gone.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.2, 0.8],
    description: 'Strong positive recovery statement',
  },
  {
    input: 'My wound is healing nicely and I can walk without the walker now.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.2, 0.7],
    description: 'Healing progress with functional improvement',
  },
  {
    input: 'Physical therapy went great today. I am getting stronger every week.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.2, 0.8],
    description: 'Positive therapy experience',
  },
  {
    input: 'I feel hopeful about my recovery. The doctor said everything looks good.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.2, 0.7],
    description: 'Optimistic outlook with medical confirmation',
  },
  {
    input: 'Finally slept through the night without waking up from pain. What a relief!',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.1, 0.7],
    description: 'Relief from pain with improved sleep',
  },
  {
    input: 'Grateful for the support from my family during this recovery.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.3, 0.8],
    description: 'Gratitude and social support',
  },
  {
    input: 'I managed to cook dinner for myself for the first time since surgery!',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.1, 0.6],
    description: 'Functional milestone achievement',
  },
  {
    input: 'The medication is really helping with the inflammation. Much more comfortable now.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.2, 0.7],
    description: 'Positive medication feedback',
  },
  {
    input: 'I can bend my knee to 90 degrees now! Big milestone in my recovery.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.3, 0.8],
    description: 'Range of motion milestone',
  },
  {
    input: 'Feeling motivated and determined to keep up with my exercises.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.3, 0.8],
    description: 'Motivation and determination',
  },

  // --- Negative Cases ---
  {
    input: 'The pain is unbearable today. Nothing seems to help.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.9, -0.3],
    description: 'Severe unmanaged pain',
  },
  {
    input: 'I am so frustrated with how slow this recovery is. I feel like I will never get better.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.2],
    description: 'Frustration with recovery pace',
  },
  {
    input: 'Woke up with a fever and the incision looks red and swollen.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.2],
    description: 'Potential infection symptoms',
  },
  {
    input: 'I feel hopeless and depressed. Everything is so difficult.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.9, -0.4],
    description: 'Depression indicators',
  },
  {
    input: 'The side effects from the medication are making me nauseous and dizzy.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.2],
    description: 'Medication side effects',
  },
  {
    input: 'I had a terrible night. Could not sleep because of the throbbing pain.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.3],
    description: 'Sleep disruption from pain',
  },
  {
    input: 'I am scared that the surgery did not work. The pain is getting worse.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.3],
    description: 'Fear about surgical outcome',
  },
  {
    input: 'Feel completely alone in this. Nobody understands what I am going through.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.7, -0.2],
    description: 'Social isolation',
  },
  {
    input: 'My wound is not healing and there is discharge coming out. I am worried about infection.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.3],
    description: 'Wound complications',
  },
  {
    input: 'I keep having nightmares about the surgery. I feel anxious all the time.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.3],
    description: 'Post-surgical anxiety and nightmares',
  },
  {
    input: 'Excruciating pain in my knee. Cannot bear it anymore.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.9, -0.4],
    description: 'Acute pain crisis',
  },
  {
    input: 'I feel like a burden to my family. They have to do everything for me.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.7, -0.2],
    description: 'Guilt and dependency',
  },

  // --- Neutral Cases ---
  {
    input: 'Had my follow-up appointment today. Doctor checked the incision.',
    expectedSentiment: SentimentLabel.NEUTRAL,
    expectedScoreRange: [-0.15, 0.2],
    description: 'Routine medical visit',
  },
  {
    input: 'Took my medication as prescribed this morning.',
    expectedSentiment: SentimentLabel.NEUTRAL,
    expectedScoreRange: [-0.15, 0.15],
    description: 'Routine medication compliance',
  },
  {
    input: 'Today is day 14 since the surgery.',
    expectedSentiment: SentimentLabel.NEUTRAL,
    expectedScoreRange: [-0.15, 0.15],
    description: 'Factual timeline statement',
  },
  {
    input: 'The bandage was changed during my visit.',
    expectedSentiment: SentimentLabel.NEUTRAL,
    expectedScoreRange: [-0.2, 0.15],
    description: 'Routine wound care',
  },
  {
    input: 'Need to schedule my next physical therapy session.',
    expectedSentiment: SentimentLabel.NEUTRAL,
    expectedScoreRange: [-0.1, 0.2],
    description: 'Administrative task',
  },

  // --- Mixed Cases ---
  {
    input: 'The pain is still there but I can see some improvement in my mobility.',
    expectedSentiment: SentimentLabel.MIXED,
    expectedScoreRange: [-0.3, 0.3],
    description: 'Pain with improvement',
  },
  {
    input: 'Good news is the infection cleared up, but I am still dealing with a lot of stiffness and discomfort.',
    expectedSentiment: SentimentLabel.MIXED,
    expectedScoreRange: [-0.3, 0.3],
    description: 'Resolved issue with ongoing symptoms',
  },
  {
    input: 'I am grateful for the progress but frustrated by how slow it has been.',
    expectedSentiment: SentimentLabel.MIXED,
    expectedScoreRange: [-0.3, 0.3],
    description: 'Gratitude mixed with frustration',
  },
  {
    input: 'The surgery was successful but the recovery pain is more than I expected.',
    expectedSentiment: SentimentLabel.MIXED,
    expectedScoreRange: [-0.3, 0.3],
    description: 'Successful outcome with unexpected pain',
  },
  {
    input: 'Some days are better than others. Today the swelling came back but at least I can walk.',
    expectedSentiment: SentimentLabel.MIXED,
    expectedScoreRange: [-0.3, 0.3],
    description: 'Variable recovery with mixed signals',
  },

  // --- Alert-Triggering Cases ---
  {
    input: 'I feel so hopeless. I have been thinking about suicide.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-1.0, -0.5],
    description: 'CRITICAL: Suicidal ideation requiring immediate attention',
  },
  {
    input: 'I cannot take this pain anymore. Nothing works. I just want it to end.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.9, -0.4],
    description: 'URGENT: Pain crisis with potentially ambiguous language',
  },
  {
    input: 'I have been cutting myself because the emotional pain is worse than the physical.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.9, -0.4],
    description: 'URGENT: Self-harm disclosure',
  },
  {
    input: 'Panic attacks every night. Heart racing and I feel like I cannot breathe.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.3],
    description: 'Severe anxiety symptoms',
  },
  {
    input: 'I have not left the house in two weeks. Nobody cares about me anymore.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.7, -0.2],
    description: 'Social isolation and withdrawal',
  },

  // --- Medication-Specific Cases ---
  {
    input: 'The new painkiller is very effective. I can actually move around now.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.2, 0.7],
    description: 'Positive medication response',
  },
  {
    input: 'I am worried about becoming addicted to the opioid painkillers.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.7, -0.2],
    description: 'Opioid addiction concern',
  },
  {
    input: 'Stopped taking the antibiotic because of severe diarrhea and nausea.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.7, -0.2],
    description: 'Medication non-compliance due to side effects',
  },

  // --- Physical Therapy Cases ---
  {
    input: 'Today I achieved full range of motion in my shoulder. My therapist was so proud.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.3, 0.8],
    description: 'Major PT milestone',
  },
  {
    input: 'Physical therapy is extremely painful. I dread going every session.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.8, -0.3],
    description: 'PT aversion due to pain',
  },
  {
    input: 'The exercises are getting easier but I still have a long way to go.',
    expectedSentiment: SentimentLabel.MIXED,
    expectedScoreRange: [-0.2, 0.4],
    description: 'Moderate PT progress with realism',
  },

  // --- Sleep-Related Cases ---
  {
    input: 'I finally got 8 hours of sleep last night. Feeling rested and energized.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.2, 0.7],
    description: 'Restored sleep quality',
  },
  {
    input: 'Insomnia is killing me. I have not slept properly in a week.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.7, -0.2],
    description: 'Chronic insomnia',
  },

  // --- Caregiver/Social Cases ---
  {
    input: 'My husband has been amazing through this whole recovery. So thankful for his support.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.3, 0.8],
    description: 'Strong social support',
  },
  {
    input: 'Nobody visits me anymore. I feel forgotten and abandoned.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.7, -0.3],
    description: 'Social abandonment',
  },

  // --- Edge Cases ---
  {
    input: '',
    expectedSentiment: SentimentLabel.NEUTRAL,
    expectedScoreRange: [0, 0],
    description: 'Empty input',
  },
  {
    input: 'The doctor said there is no infection and no complications.',
    expectedSentiment: SentimentLabel.NEUTRAL,
    expectedScoreRange: [-0.15, 0.4],
    description: 'Negated negative terms (should be neutral or slightly positive)',
  },
  {
    input: 'Not feeling any pain today which is not normal for me!',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [-0.1, 0.6],
    description: 'Double negation pattern',
  },
  {
    input: 'I used to feel terrible but now everything is wonderful and I am completely recovered.',
    expectedSentiment: SentimentLabel.POSITIVE,
    expectedScoreRange: [0.0, 0.7],
    description: 'Contrast between past negative and present positive',
  },
  {
    input: 'Pain pain pain. That is all I know anymore.',
    expectedSentiment: SentimentLabel.NEGATIVE,
    expectedScoreRange: [-0.9, -0.4],
    description: 'Repetitive pain emphasis',
  },
];

// ============================================================================
// Test Runner
// ============================================================================

/**
 * Run all test cases and return pass/fail results.
 */
export function runSentimentTests(): {
  totalTests: number;
  passed: number;
  failed: number;
  results: Array<{
    description: string;
    input: string;
    expected: { sentiment: SentimentLabel; scoreRange: [number, number] };
    actual: { sentiment: SentimentLabel; score: number };
    passed: boolean;
    reason?: string;
  }>;
} {
  const results: Array<{
    description: string;
    input: string;
    expected: { sentiment: SentimentLabel; scoreRange: [number, number] };
    actual: { sentiment: SentimentLabel; score: number };
    passed: boolean;
    reason?: string;
  }> = [];

  for (const testCase of SENTIMENT_TEST_CASES) {
    const actual = analyzeSentiment(testCase.input);
    const sentimentMatch = actual.sentiment === testCase.expectedSentiment;
    const scoreInRange =
      actual.score >= testCase.expectedScoreRange[0] &&
      actual.score <= testCase.expectedScoreRange[1];
    const passed = sentimentMatch && scoreInRange;

    let reason: string | undefined;
    if (!sentimentMatch) {
      reason = `Sentiment mismatch: expected ${testCase.expectedSentiment}, got ${actual.sentiment}`;
    } else if (!scoreInRange) {
      reason = `Score out of range: expected [${testCase.expectedScoreRange[0]}, ${testCase.expectedScoreRange[1]}], got ${actual.score}`;
    }

    results.push({
      description: testCase.description,
      input: testCase.input,
      expected: {
        sentiment: testCase.expectedSentiment,
        scoreRange: testCase.expectedScoreRange,
      },
      actual: {
        sentiment: actual.sentiment,
        score: actual.score,
      },
      passed,
      reason,
    });
  }

  return {
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results,
  };
}

// ============================================================================
// Singleton & Convenience Exports
// ============================================================================

/** Default singleton instance */
export const sentimentEngine = new SentimentAnalysisEngine();

/**
 * Create a new SentimentAnalysisEngine instance.
 */
export function createSentimentEngine(): SentimentAnalysisEngine {
  return new SentimentAnalysisEngine();
}

/**
 * Get the medical sentiment lexicon (read-only copy).
 */
export function getMedicalLexicon(): Readonly<Record<string, number>> {
  return { ...MEDICAL_SENTIMENT_LEXICON };
}

/**
 * Get the count of words in the medical lexicon.
 */
export function getLexiconSize(): number {
  return Object.keys(MEDICAL_SENTIMENT_LEXICON).length;
}
