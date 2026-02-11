/**
 * Chat Service - Patient-Doctor Messaging System
 *
 * Comprehensive messaging service for post-surgical recovery communication
 * between patients and their care teams.
 *
 * Features:
 *  - Multiple message types (text, image, voice note, system, quick reply, care update)
 *  - Conversation management with thread support
 *  - Read receipts and typing indicators
 *  - Smart quick-reply suggestions based on context
 *  - Symptom keyword detection and priority flagging
 *  - Auto-translation placeholder with language detection
 *  - 50+ pre-built doctor message templates
 *  - Conversation analytics (response time, engagement scoring)
 *  - Efficient localStorage-backed pagination
 */

// ============================================================================
// Constants & Enums (using const objects for erasableSyntaxOnly compatibility)
// ============================================================================

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  VOICE_NOTE: 'voice_note',
  SYSTEM: 'system',
  QUICK_REPLY: 'quick_reply',
  CARE_UPDATE: 'care_update',
} as const;
export type MessageType = typeof MessageType[keyof typeof MessageType];

export const MessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;
export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

export const ConversationStatus = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
} as const;
export type ConversationStatus = typeof ConversationStatus[keyof typeof ConversationStatus];

export const ParticipantRole = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  CARE_COORDINATOR: 'care_coordinator',
  SYSTEM: 'system',
} as const;
export type ParticipantRole = typeof ParticipantRole[keyof typeof ParticipantRole];

export const MessagePriority = {
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type MessagePriority = typeof MessagePriority[keyof typeof MessagePriority];

export const TemplateCategory = {
  WOUND_CARE: 'wound_care',
  MEDICATION: 'medication',
  EXERCISE: 'exercise',
  APPOINTMENT: 'appointment',
  LAB_RESULTS: 'lab_results',
  ENCOURAGEMENT: 'encouragement',
  GENERAL: 'general',
  DIET: 'diet',
  FOLLOW_UP: 'follow_up',
  EMERGENCY_GUIDANCE: 'emergency_guidance',
} as const;
export type TemplateCategory = typeof TemplateCategory[keyof typeof TemplateCategory];

export const DetectedLanguage = {
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  GERMAN: 'de',
  CHINESE: 'zh',
  ARABIC: 'ar',
  PORTUGUESE: 'pt',
  RUSSIAN: 'ru',
  JAPANESE: 'ja',
  KOREAN: 'ko',
  UNKNOWN: 'unknown',
} as const;
export type DetectedLanguage = typeof DetectedLanguage[keyof typeof DetectedLanguage];

// ============================================================================
// Interfaces
// ============================================================================

/** Metadata for image message attachments. */
export interface ImageAttachment {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  mimeType: string;
  sizeBytes: number;
  caption?: string;
}

/** Metadata for voice note messages. */
export interface VoiceNoteMetadata {
  durationSeconds: number;
  sizeBytes: number;
  mimeType: string;
  url: string;
  transcription?: string;
  waveformData?: number[];
}

/** A quick reply option that can be attached to messages. */
export interface QuickReplyOption {
  id: string;
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
}

/** Care update payload for automated care plan notifications. */
export interface CareUpdatePayload {
  carePlanId: string;
  updateType: string;
  title: string;
  description: string;
  actionRequired: boolean;
  dueDate?: string;
}

/** Language detection result for a message. */
export interface LanguageDetectionResult {
  detectedLanguage: DetectedLanguage;
  confidence: number;
  originalText: string;
  suggestTranslation: boolean;
}

/** A detected symptom keyword found in a message. */
export interface DetectedSymptom {
  keyword: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  position: number;
  context: string;
}

/** Priority flag analysis result for a message. */
export interface PriorityFlagResult {
  priority: MessagePriority;
  triggerWords: string[];
  reason: string;
  requiresImmediateAttention: boolean;
}

/** A participant in a conversation. */
export interface ConversationParticipant {
  userId: string;
  displayName: string;
  role: ParticipantRole;
  joinedAt: string;
  lastSeenAt: string;
  isTyping: boolean;
  typingStartedAt?: string;
}

/** A single chat message. */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: ParticipantRole;
  senderName: string;
  type: MessageType;
  content: string;
  status: MessageStatus;
  priority: MessagePriority;
  timestamp: string;
  editedAt?: string;
  threadId?: string;
  replyToMessageId?: string;
  imageAttachment?: ImageAttachment;
  voiceNoteMetadata?: VoiceNoteMetadata;
  quickReplyOptions?: QuickReplyOption[];
  careUpdatePayload?: CareUpdatePayload;
  detectedSymptoms?: DetectedSymptom[];
  languageDetection?: LanguageDetectionResult;
  metadata?: Record<string, unknown>;
}

/** A conversation between participants. */
export interface Conversation {
  id: string;
  patientId: string;
  title: string;
  status: ConversationStatus;
  participants: ConversationParticipant[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCounts: Record<string, number>;
  metadata?: Record<string, unknown>;
}

/** A doctor message template. */
export interface MessageTemplate {
  id: string;
  category: TemplateCategory;
  title: string;
  content: string;
  variables?: string[];
  tags: string[];
}

/** Pagination result wrapper. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Message search parameters. */
export interface MessageSearchParams {
  query: string;
  conversationId?: string;
  senderId?: string;
  messageType?: MessageType;
  startDate?: string;
  endDate?: string;
  priority?: MessagePriority;
}

/** Message search result with match highlighting context. */
export interface MessageSearchResult {
  message: ChatMessage;
  matchScore: number;
  matchContext: string;
}

/** Response time statistics for analytics. */
export interface ResponseTimeStats {
  averageMs: number;
  medianMs: number;
  minMs: number;
  maxMs: number;
  p90Ms: number;
  sampleSize: number;
}

/** Message volume data point for trend analysis. */
export interface MessageVolumeTrend {
  date: string;
  sent: number;
  received: number;
  total: number;
}

/** Patient engagement score based on messaging patterns. */
export interface PatientEngagementScore {
  patientId: string;
  overallScore: number;
  responseRate: number;
  averageResponseTimeMs: number;
  messagesPerDay: number;
  activeDays: number;
  totalDays: number;
  lastActiveAt: string;
  engagementLevel: 'low' | 'medium' | 'high' | 'very_high';
}

/** Conversation analytics summary. */
export interface ConversationAnalytics {
  conversationId: string;
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesByParticipant: Record<string, number>;
  responseTimeStats: ResponseTimeStats;
  volumeTrends: MessageVolumeTrend[];
  unreadCounts: Record<string, number>;
  engagementScores: PatientEngagementScore[];
  averageMessagesPerDay: number;
  peakHour: number;
  conversationDurationDays: number;
}

// ============================================================================
// Storage Keys
// ============================================================================

const CHAT_STORAGE_KEYS = {
  CONVERSATIONS: 'rp_chat_conversations',
  MESSAGES_PREFIX: 'rp_chat_messages_',
  TYPING_INDICATORS: 'rp_chat_typing',
  TEMPLATES: 'rp_chat_templates',
  ANALYTICS_CACHE: 'rp_chat_analytics_cache',
} as const;

// ============================================================================
// Utility Helpers
// ============================================================================

function generateChatId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 10; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}_${timestamp}_${random}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}


// ============================================================================
// Symptom & Priority Detection Data
// ============================================================================

/** Urgency trigger words that cause priority escalation. */
const URGENCY_WORDS: Record<string, MessagePriority> = {
  'emergency': MessagePriority.URGENT,
  'bleeding': MessagePriority.URGENT,
  'severe pain': MessagePriority.URGENT,
  'can\'t breathe': MessagePriority.URGENT,
  'chest pain': MessagePriority.URGENT,
  'unconscious': MessagePriority.URGENT,
  'fainted': MessagePriority.URGENT,
  'seizure': MessagePriority.URGENT,
  'heart attack': MessagePriority.URGENT,
  'stroke': MessagePriority.URGENT,
  'allergic reaction': MessagePriority.URGENT,
  'anaphylaxis': MessagePriority.URGENT,
  'suicidal': MessagePriority.URGENT,
  'overdose': MessagePriority.URGENT,
  'fell down': MessagePriority.HIGH,
  'high fever': MessagePriority.HIGH,
  'vomiting blood': MessagePriority.URGENT,
  'blood in stool': MessagePriority.HIGH,
  'difficulty breathing': MessagePriority.URGENT,
  'swelling': MessagePriority.HIGH,
  'infection': MessagePriority.HIGH,
  'pus': MessagePriority.HIGH,
  'redness spreading': MessagePriority.HIGH,
  'numbness': MessagePriority.HIGH,
  'tingling': MessagePriority.HIGH,
  'dizziness': MessagePriority.HIGH,
  'blurred vision': MessagePriority.HIGH,
  'worse': MessagePriority.HIGH,
  'not getting better': MessagePriority.HIGH,
  'increasing pain': MessagePriority.HIGH,
  'can\'t sleep': MessagePriority.NORMAL,
  'worried': MessagePriority.NORMAL,
  'concerned': MessagePriority.NORMAL,
};

/** Symptom keywords mapped to categories and severity. */
const SYMPTOM_KEYWORDS: Array<{
  keyword: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
}> = [
  // Pain-related
  { keyword: 'pain', category: 'pain', severity: 'medium' },
  { keyword: 'sharp pain', category: 'pain', severity: 'high' },
  { keyword: 'dull pain', category: 'pain', severity: 'low' },
  { keyword: 'throbbing', category: 'pain', severity: 'medium' },
  { keyword: 'burning', category: 'pain', severity: 'medium' },
  { keyword: 'aching', category: 'pain', severity: 'low' },
  { keyword: 'stabbing', category: 'pain', severity: 'high' },
  { keyword: 'cramping', category: 'pain', severity: 'medium' },
  { keyword: 'sore', category: 'pain', severity: 'low' },
  { keyword: 'tender', category: 'pain', severity: 'low' },
  // Wound-related
  { keyword: 'bleeding', category: 'wound', severity: 'high' },
  { keyword: 'discharge', category: 'wound', severity: 'medium' },
  { keyword: 'pus', category: 'wound', severity: 'high' },
  { keyword: 'redness', category: 'wound', severity: 'medium' },
  { keyword: 'swelling', category: 'wound', severity: 'medium' },
  { keyword: 'wound', category: 'wound', severity: 'medium' },
  { keyword: 'incision', category: 'wound', severity: 'medium' },
  { keyword: 'stitches', category: 'wound', severity: 'low' },
  { keyword: 'bruising', category: 'wound', severity: 'low' },
  { keyword: 'scab', category: 'wound', severity: 'low' },
  // Systemic symptoms
  { keyword: 'fever', category: 'systemic', severity: 'high' },
  { keyword: 'chills', category: 'systemic', severity: 'medium' },
  { keyword: 'fatigue', category: 'systemic', severity: 'low' },
  { keyword: 'nausea', category: 'systemic', severity: 'medium' },
  { keyword: 'vomiting', category: 'systemic', severity: 'high' },
  { keyword: 'diarrhea', category: 'systemic', severity: 'medium' },
  { keyword: 'constipation', category: 'systemic', severity: 'low' },
  { keyword: 'dizziness', category: 'systemic', severity: 'medium' },
  { keyword: 'headache', category: 'systemic', severity: 'low' },
  { keyword: 'shortness of breath', category: 'respiratory', severity: 'high' },
  // Mobility-related
  { keyword: 'stiffness', category: 'mobility', severity: 'low' },
  { keyword: 'can\'t move', category: 'mobility', severity: 'high' },
  { keyword: 'limited range', category: 'mobility', severity: 'medium' },
  { keyword: 'limping', category: 'mobility', severity: 'medium' },
  { keyword: 'weakness', category: 'mobility', severity: 'medium' },
  { keyword: 'numbness', category: 'neurological', severity: 'high' },
  { keyword: 'tingling', category: 'neurological', severity: 'medium' },
  // Medication-related
  { keyword: 'side effect', category: 'medication', severity: 'medium' },
  { keyword: 'allergic', category: 'medication', severity: 'high' },
  { keyword: 'rash', category: 'medication', severity: 'medium' },
  { keyword: 'itching', category: 'medication', severity: 'low' },
  // Mental health
  { keyword: 'anxiety', category: 'mental_health', severity: 'medium' },
  { keyword: 'depression', category: 'mental_health', severity: 'medium' },
  { keyword: 'can\'t sleep', category: 'mental_health', severity: 'medium' },
  { keyword: 'insomnia', category: 'mental_health', severity: 'medium' },
  { keyword: 'stressed', category: 'mental_health', severity: 'low' },
];

/** Language detection heuristic patterns (simplified, no external deps). */
const LANGUAGE_PATTERNS: Array<{
  language: DetectedLanguage;
  patterns: RegExp[];
  commonWords: string[];
}> = [
  {
    language: DetectedLanguage.SPANISH,
    patterns: [/[¿¡]/],
    commonWords: ['el', 'la', 'los', 'las', 'de', 'en', 'que', 'por', 'con', 'para', 'es', 'un', 'una', 'no', 'dolor', 'tengo', 'estoy', 'como', 'pero', 'muy'],
  },
  {
    language: DetectedLanguage.FRENCH,
    patterns: [/[àâçéèêëîïôùûü]/i],
    commonWords: ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'est', 'que', 'dans', 'pour', 'pas', 'sur', 'avec', 'je', 'ne', 'douleur', 'avoir'],
  },
  {
    language: DetectedLanguage.GERMAN,
    patterns: [/[äöüß]/i],
    commonWords: ['der', 'die', 'das', 'und', 'ist', 'von', 'den', 'ein', 'eine', 'mit', 'auf', 'nicht', 'ich', 'haben', 'schmerz', 'habe', 'mein', 'mir'],
  },
  {
    language: DetectedLanguage.PORTUGUESE,
    patterns: [/[ãõ]/i],
    commonWords: ['o', 'a', 'os', 'as', 'de', 'em', 'que', 'por', 'com', 'para', 'nao', 'um', 'uma', 'dor', 'tenho', 'estou', 'como', 'mais', 'muito'],
  },
  {
    language: DetectedLanguage.CHINESE,
    patterns: [/[\u4e00-\u9fff]/],
    commonWords: [],
  },
  {
    language: DetectedLanguage.ARABIC,
    patterns: [/[\u0600-\u06ff]/],
    commonWords: [],
  },
  {
    language: DetectedLanguage.JAPANESE,
    patterns: [/[\u3040-\u309f\u30a0-\u30ff]/],
    commonWords: [],
  },
  {
    language: DetectedLanguage.KOREAN,
    patterns: [/[\uac00-\ud7af]/],
    commonWords: [],
  },
  {
    language: DetectedLanguage.RUSSIAN,
    patterns: [/[\u0400-\u04ff]/],
    commonWords: [],
  },
];

// ============================================================================
// Quick Reply Suggestion Engine
// ============================================================================

/** Context-based quick reply suggestion sets. */
const QUICK_REPLY_SETS: Record<string, QuickReplyOption[]> = {
  pain_report: [
    { id: 'qr_pain_1', label: 'Pain is mild (1-3)', value: 'My pain level is mild, around 1-3 out of 10.' },
    { id: 'qr_pain_2', label: 'Pain is moderate (4-6)', value: 'My pain level is moderate, around 4-6 out of 10.' },
    { id: 'qr_pain_3', label: 'Pain is severe (7-10)', value: 'My pain level is severe, around 7-10 out of 10.' },
    { id: 'qr_pain_4', label: 'Pain is getting better', value: 'My pain has been improving compared to yesterday.' },
    { id: 'qr_pain_5', label: 'Pain is getting worse', value: 'My pain has been getting worse since my last report.' },
  ],
  medication: [
    { id: 'qr_med_1', label: 'Took medication on time', value: 'I took my medication as prescribed today.' },
    { id: 'qr_med_2', label: 'Missed a dose', value: 'I missed a dose of my medication today.' },
    { id: 'qr_med_3', label: 'Having side effects', value: 'I think I am experiencing side effects from my medication.' },
    { id: 'qr_med_4', label: 'Need a refill', value: 'I am running low on medication and need a refill.' },
    { id: 'qr_med_5', label: 'Medication helping', value: 'The medication seems to be helping with my symptoms.' },
  ],
  wound_check: [
    { id: 'qr_wound_1', label: 'Wound looks normal', value: 'My wound/incision site looks normal today. No unusual changes.' },
    { id: 'qr_wound_2', label: 'Some redness', value: 'I notice some redness around my wound/incision site.' },
    { id: 'qr_wound_3', label: 'Discharge present', value: 'There is some discharge from my wound/incision site.' },
    { id: 'qr_wound_4', label: 'Wound is healing', value: 'The wound appears to be healing well.' },
    { id: 'qr_wound_5', label: 'Swelling noticed', value: 'I notice some swelling around the surgical area.' },
  ],
  general_status: [
    { id: 'qr_gen_1', label: 'Feeling better today', value: 'I am feeling better today overall.' },
    { id: 'qr_gen_2', label: 'About the same', value: 'I feel about the same as yesterday.' },
    { id: 'qr_gen_3', label: 'Not doing well', value: 'I am not feeling well today.' },
    { id: 'qr_gen_4', label: 'Have a question', value: 'I have a question about my recovery.' },
    { id: 'qr_gen_5', label: 'Need to talk', value: 'I would like to schedule a time to talk with my care team.' },
  ],
  appointment: [
    { id: 'qr_appt_1', label: 'Confirm appointment', value: 'I confirm my upcoming appointment.' },
    { id: 'qr_appt_2', label: 'Need to reschedule', value: 'I need to reschedule my appointment.' },
    { id: 'qr_appt_3', label: 'Have questions for visit', value: 'I have some questions I would like to discuss at my next visit.' },
    { id: 'qr_appt_4', label: 'Transportation issue', value: 'I may have a transportation issue getting to my appointment.' },
  ],
  exercise: [
    { id: 'qr_ex_1', label: 'Completed exercises', value: 'I completed all my prescribed exercises today.' },
    { id: 'qr_ex_2', label: 'Exercises cause pain', value: 'Some of the exercises are causing me pain.' },
    { id: 'qr_ex_3', label: 'Need easier exercises', value: 'I think I need easier exercise modifications.' },
    { id: 'qr_ex_4', label: 'Ready for more', value: 'I feel ready to advance to more challenging exercises.' },
  ],
  acknowledgment: [
    { id: 'qr_ack_1', label: 'Got it, thanks', value: 'I understand, thank you.' },
    { id: 'qr_ack_2', label: 'Will do', value: 'I will follow your instructions.' },
    { id: 'qr_ack_3', label: 'Need clarification', value: 'Could you please clarify that for me?' },
    { id: 'qr_ack_4', label: 'Thank you', value: 'Thank you for the information.' },
  ],
};

// ============================================================================
// Doctor Message Templates (50+)
// ============================================================================

const DOCTOR_MESSAGE_TEMPLATES: MessageTemplate[] = [
  // --- Wound Care (10) ---
  {
    id: 'tpl_wc_01',
    category: TemplateCategory.WOUND_CARE,
    title: 'General wound care reminder',
    content: 'Please continue to keep your wound clean and dry. Change your dressing {frequency} as instructed. If you notice any increased redness, swelling, warmth, or drainage, please let me know immediately.',
    variables: ['frequency'],
    tags: ['wound', 'dressing', 'hygiene'],
  },
  {
    id: 'tpl_wc_02',
    category: TemplateCategory.WOUND_CARE,
    title: 'Wound healing progress - positive',
    content: 'Your wound appears to be healing well based on what you have described. Continue with your current wound care routine. Your next wound check is scheduled for {date}.',
    variables: ['date'],
    tags: ['wound', 'healing', 'progress'],
  },
  {
    id: 'tpl_wc_03',
    category: TemplateCategory.WOUND_CARE,
    title: 'Request wound photo',
    content: 'Could you please send a photo of your wound/incision site today? This will help me assess how your healing is progressing. Try to take the photo in good lighting from about 12 inches away.',
    variables: [],
    tags: ['wound', 'photo', 'assessment'],
  },
  {
    id: 'tpl_wc_04',
    category: TemplateCategory.WOUND_CARE,
    title: 'Signs of infection warning',
    content: 'Please watch for these signs of infection: increasing redness or warmth around the incision, yellow/green discharge, fever above 100.4F (38C), or increasing pain at the site. Contact us immediately if you notice any of these.',
    variables: [],
    tags: ['wound', 'infection', 'warning'],
  },
  {
    id: 'tpl_wc_05',
    category: TemplateCategory.WOUND_CARE,
    title: 'Dressing change instructions',
    content: 'For your dressing change: 1) Wash your hands thoroughly. 2) Gently remove the old dressing. 3) Clean the area with {solution}. 4) Apply a new sterile dressing. 5) Secure with medical tape. Do not pull or tug on any stitches or staples.',
    variables: ['solution'],
    tags: ['wound', 'dressing', 'instructions'],
  },
  {
    id: 'tpl_wc_06',
    category: TemplateCategory.WOUND_CARE,
    title: 'Showering with wound',
    content: 'You may shower {timeframe} after surgery, but do not submerge the wound in water (no baths, pools, or hot tubs) for at least {restriction_period}. Pat the area dry gently after showering.',
    variables: ['timeframe', 'restriction_period'],
    tags: ['wound', 'shower', 'bathing'],
  },
  {
    id: 'tpl_wc_07',
    category: TemplateCategory.WOUND_CARE,
    title: 'Staple/stitch removal timeline',
    content: 'Your {closure_type} are scheduled to be removed at your appointment on {date}. In the meantime, do not attempt to remove them yourself. If any fall out on their own, please let us know.',
    variables: ['closure_type', 'date'],
    tags: ['wound', 'stitches', 'staples', 'removal'],
  },
  {
    id: 'tpl_wc_08',
    category: TemplateCategory.WOUND_CARE,
    title: 'Bruising is normal',
    content: 'Some bruising around the surgical site is completely normal and should gradually fade over the next 1-2 weeks. If the bruising is expanding rapidly or is accompanied by significant swelling, please let me know.',
    variables: [],
    tags: ['wound', 'bruising', 'normal'],
  },
  {
    id: 'tpl_wc_09',
    category: TemplateCategory.WOUND_CARE,
    title: 'Scar care guidance',
    content: 'Once your incision has fully closed (usually 2-3 weeks), you can begin gentle scar massage using {product}. Massage in circular motions for 5 minutes, twice daily. Protect the scar from sun exposure for at least 12 months.',
    variables: ['product'],
    tags: ['wound', 'scar', 'cosmetic'],
  },
  {
    id: 'tpl_wc_10',
    category: TemplateCategory.WOUND_CARE,
    title: 'Wound drainage concern follow-up',
    content: 'Thank you for reporting the drainage. A small amount of clear or slightly pink drainage can be normal in the first few days. However, if the drainage is thick, cloudy, foul-smelling, or increasing in amount, please come in for evaluation.',
    variables: [],
    tags: ['wound', 'drainage', 'follow-up'],
  },

  // --- Medication (10) ---
  {
    id: 'tpl_med_01',
    category: TemplateCategory.MEDICATION,
    title: 'Medication schedule reminder',
    content: 'Please remember to take {medication_name} {dosage} {frequency}. Take it {instructions}. If you miss a dose, {missed_dose_instructions}.',
    variables: ['medication_name', 'dosage', 'frequency', 'instructions', 'missed_dose_instructions'],
    tags: ['medication', 'schedule', 'reminder'],
  },
  {
    id: 'tpl_med_02',
    category: TemplateCategory.MEDICATION,
    title: 'Pain medication guidance',
    content: 'For pain management, take {medication_name} as needed, no more than {max_frequency}. Try to stay ahead of the pain rather than waiting until it becomes severe. If your pain is not well controlled, please let me know.',
    variables: ['medication_name', 'max_frequency'],
    tags: ['medication', 'pain', 'management'],
  },
  {
    id: 'tpl_med_03',
    category: TemplateCategory.MEDICATION,
    title: 'Medication adjustment',
    content: 'Based on your recent reports, I am adjusting your {medication_name} from {old_dosage} to {new_dosage}. Start the new dose {start_date}. Please monitor for any changes in symptoms and let me know how you feel.',
    variables: ['medication_name', 'old_dosage', 'new_dosage', 'start_date'],
    tags: ['medication', 'adjustment', 'dosage'],
  },
  {
    id: 'tpl_med_04',
    category: TemplateCategory.MEDICATION,
    title: 'Medication side effects',
    content: 'Common side effects of {medication_name} include {side_effects}. These usually improve within the first week. If side effects are severe or do not improve, please contact us. Do not stop taking the medication without consulting us first.',
    variables: ['medication_name', 'side_effects'],
    tags: ['medication', 'side effects'],
  },
  {
    id: 'tpl_med_05',
    category: TemplateCategory.MEDICATION,
    title: 'Tapering instructions',
    content: 'It is time to begin tapering your {medication_name}. Reduce your dose to {new_dosage} for the next {duration}. After that period, we will discuss the next step. Do not stop abruptly.',
    variables: ['medication_name', 'new_dosage', 'duration'],
    tags: ['medication', 'tapering', 'reduction'],
  },
  {
    id: 'tpl_med_06',
    category: TemplateCategory.MEDICATION,
    title: 'Blood thinner reminders',
    content: 'Please continue taking your blood thinner ({medication_name}) at the same time each day. Avoid activities with high risk of injury. Watch for unusual bruising, blood in stool/urine, or prolonged bleeding from cuts.',
    variables: ['medication_name'],
    tags: ['medication', 'blood thinner', 'anticoagulant'],
  },
  {
    id: 'tpl_med_07',
    category: TemplateCategory.MEDICATION,
    title: 'Antibiotic completion',
    content: 'Please make sure to complete the full course of your antibiotic ({medication_name}). You have {remaining_days} days remaining. Even if you feel better, stopping early could allow the infection to return.',
    variables: ['medication_name', 'remaining_days'],
    tags: ['medication', 'antibiotic', 'completion'],
  },
  {
    id: 'tpl_med_08',
    category: TemplateCategory.MEDICATION,
    title: 'Over-the-counter pain alternatives',
    content: 'As you wean off prescription pain medication, you may switch to over-the-counter options: Acetaminophen (Tylenol) up to {acetaminophen_max}, or Ibuprofen (Advil) {ibuprofen_dosage} with food. Do not take both together without checking with me.',
    variables: ['acetaminophen_max', 'ibuprofen_dosage'],
    tags: ['medication', 'OTC', 'pain'],
  },
  {
    id: 'tpl_med_09',
    category: TemplateCategory.MEDICATION,
    title: 'Medication interaction warning',
    content: 'Please be aware that {medication_a} can interact with {medication_b}. To minimize this, {mitigation}. If you experience {warning_signs}, please contact us immediately.',
    variables: ['medication_a', 'medication_b', 'mitigation', 'warning_signs'],
    tags: ['medication', 'interaction', 'warning'],
  },
  {
    id: 'tpl_med_10',
    category: TemplateCategory.MEDICATION,
    title: 'Refill authorized',
    content: 'I have authorized a refill for {medication_name} {dosage}. It should be available at your pharmacy ({pharmacy_name}) within {timeframe}. Please let me know if there are any issues picking it up.',
    variables: ['medication_name', 'dosage', 'pharmacy_name', 'timeframe'],
    tags: ['medication', 'refill', 'pharmacy'],
  },

  // --- Exercise (8) ---
  {
    id: 'tpl_ex_01',
    category: TemplateCategory.EXERCISE,
    title: 'Begin gentle exercises',
    content: 'You are now cleared to begin gentle range-of-motion exercises. Start with {exercise_list}. Perform each exercise {reps} times, {frequency}. Stop if you experience sharp pain.',
    variables: ['exercise_list', 'reps', 'frequency'],
    tags: ['exercise', 'range of motion', 'gentle'],
  },
  {
    id: 'tpl_ex_02',
    category: TemplateCategory.EXERCISE,
    title: 'Walking guidelines',
    content: 'Walking is one of the best exercises for recovery. Aim for {duration} of walking {frequency}. Use {assistive_device} as needed. Gradually increase your distance each week.',
    variables: ['duration', 'frequency', 'assistive_device'],
    tags: ['exercise', 'walking', 'mobility'],
  },
  {
    id: 'tpl_ex_03',
    category: TemplateCategory.EXERCISE,
    title: 'Exercise progression',
    content: 'Great progress! Based on your recovery, you can now advance to {new_exercises}. Continue with your current exercises and add these new ones. Remember to warm up first and listen to your body.',
    variables: ['new_exercises'],
    tags: ['exercise', 'progression', 'advancement'],
  },
  {
    id: 'tpl_ex_04',
    category: TemplateCategory.EXERCISE,
    title: 'Exercise modification for pain',
    content: 'I understand the exercises are causing some discomfort. Let us modify your routine: {modifications}. Pain during exercise should stay below a 4 out of 10. If it exceeds that, stop and rest.',
    variables: ['modifications'],
    tags: ['exercise', 'modification', 'pain'],
  },
  {
    id: 'tpl_ex_05',
    category: TemplateCategory.EXERCISE,
    title: 'Physical therapy referral',
    content: 'I am referring you to physical therapy to help with your recovery. You will have {sessions_per_week} sessions per week for approximately {duration}. The therapist will work on {focus_areas}.',
    variables: ['sessions_per_week', 'duration', 'focus_areas'],
    tags: ['exercise', 'physical therapy', 'referral'],
  },
  {
    id: 'tpl_ex_06',
    category: TemplateCategory.EXERCISE,
    title: 'Ice/heat therapy instructions',
    content: 'Apply {therapy_type} to the affected area for {duration} minutes, {frequency}. Always use a barrier (towel) between the {therapy_type} and your skin. This can help manage swelling and discomfort.',
    variables: ['therapy_type', 'duration', 'frequency'],
    tags: ['exercise', 'ice', 'heat', 'therapy'],
  },
  {
    id: 'tpl_ex_07',
    category: TemplateCategory.EXERCISE,
    title: 'Activity restrictions',
    content: 'Please avoid the following activities for the next {restriction_period}: {restricted_activities}. These restrictions help protect your surgical site and promote proper healing.',
    variables: ['restriction_period', 'restricted_activities'],
    tags: ['exercise', 'restrictions', 'activities'],
  },
  {
    id: 'tpl_ex_08',
    category: TemplateCategory.EXERCISE,
    title: 'Return to normal activity',
    content: 'You are progressing well. You may begin to resume normal daily activities gradually. Start with {light_activities} this week. Avoid {heavy_activities} for another {restriction_period}.',
    variables: ['light_activities', 'heavy_activities', 'restriction_period'],
    tags: ['exercise', 'return to activity', 'normal'],
  },

  // --- Appointment (7) ---
  {
    id: 'tpl_appt_01',
    category: TemplateCategory.APPOINTMENT,
    title: 'Follow-up appointment scheduled',
    content: 'Your follow-up appointment is scheduled for {date} at {time} with {provider_name}. Please arrive 15 minutes early. Bring {items_to_bring}. Let me know if you need to reschedule.',
    variables: ['date', 'time', 'provider_name', 'items_to_bring'],
    tags: ['appointment', 'follow-up', 'scheduled'],
  },
  {
    id: 'tpl_appt_02',
    category: TemplateCategory.APPOINTMENT,
    title: 'Appointment reminder',
    content: 'Reminder: You have an appointment {timeframe}. Please {pre_appointment_instructions}. If you need to cancel or reschedule, please let us know at least 24 hours in advance.',
    variables: ['timeframe', 'pre_appointment_instructions'],
    tags: ['appointment', 'reminder'],
  },
  {
    id: 'tpl_appt_03',
    category: TemplateCategory.APPOINTMENT,
    title: 'Telehealth appointment option',
    content: 'We can also conduct your follow-up via telehealth video visit. Would you prefer an in-person or virtual appointment? If virtual, I will send you a link before the scheduled time.',
    variables: [],
    tags: ['appointment', 'telehealth', 'virtual'],
  },
  {
    id: 'tpl_appt_04',
    category: TemplateCategory.APPOINTMENT,
    title: 'Pre-appointment lab work',
    content: 'Before your appointment on {date}, please complete the following lab work: {lab_tests}. You can have these done at {lab_location}. Please fast for {fasting_hours} hours beforehand if required.',
    variables: ['date', 'lab_tests', 'lab_location', 'fasting_hours'],
    tags: ['appointment', 'lab', 'pre-appointment'],
  },
  {
    id: 'tpl_appt_05',
    category: TemplateCategory.APPOINTMENT,
    title: 'Reschedule confirmation',
    content: 'Your appointment has been rescheduled from {old_date} to {new_date} at {new_time}. All other details remain the same. Please confirm that this new time works for you.',
    variables: ['old_date', 'new_date', 'new_time'],
    tags: ['appointment', 'reschedule', 'confirmation'],
  },
  {
    id: 'tpl_appt_06',
    category: TemplateCategory.APPOINTMENT,
    title: 'Post-appointment summary',
    content: 'Summary from your visit today: {visit_summary}. Your next steps are: {next_steps}. Your next appointment is {next_appointment}. Please reach out if you have any questions.',
    variables: ['visit_summary', 'next_steps', 'next_appointment'],
    tags: ['appointment', 'summary', 'post-visit'],
  },
  {
    id: 'tpl_appt_07',
    category: TemplateCategory.APPOINTMENT,
    title: 'Specialist referral',
    content: 'I am referring you to {specialist_name} ({specialty}) for further evaluation of {concern}. Their office will contact you to schedule. If you do not hear from them within {timeframe}, please let me know.',
    variables: ['specialist_name', 'specialty', 'concern', 'timeframe'],
    tags: ['appointment', 'referral', 'specialist'],
  },

  // --- Lab Results (6) ---
  {
    id: 'tpl_lab_01',
    category: TemplateCategory.LAB_RESULTS,
    title: 'Lab results - all normal',
    content: 'Good news! Your recent lab results from {date} are all within normal ranges. This is a positive sign for your recovery. We will recheck in {recheck_timeframe}.',
    variables: ['date', 'recheck_timeframe'],
    tags: ['lab', 'results', 'normal'],
  },
  {
    id: 'tpl_lab_02',
    category: TemplateCategory.LAB_RESULTS,
    title: 'Lab results - minor abnormality',
    content: 'Your lab results from {date} are mostly normal. However, your {test_name} was slightly {direction} at {value} (normal range: {normal_range}). This is {explanation}. We will monitor this at your next visit.',
    variables: ['date', 'test_name', 'direction', 'value', 'normal_range', 'explanation'],
    tags: ['lab', 'results', 'abnormal', 'minor'],
  },
  {
    id: 'tpl_lab_03',
    category: TemplateCategory.LAB_RESULTS,
    title: 'Lab results - action needed',
    content: 'Your {test_name} results require attention. Your level is {value}, which is {direction} the normal range of {normal_range}. I recommend {action}. Please {follow_up_instruction}.',
    variables: ['test_name', 'value', 'direction', 'normal_range', 'action', 'follow_up_instruction'],
    tags: ['lab', 'results', 'action', 'abnormal'],
  },
  {
    id: 'tpl_lab_04',
    category: TemplateCategory.LAB_RESULTS,
    title: 'Blood count update',
    content: 'Your complete blood count (CBC) results: Hemoglobin: {hemoglobin}, White blood cells: {wbc}, Platelets: {platelets}. {interpretation}. {action_needed}.',
    variables: ['hemoglobin', 'wbc', 'platelets', 'interpretation', 'action_needed'],
    tags: ['lab', 'CBC', 'blood count'],
  },
  {
    id: 'tpl_lab_05',
    category: TemplateCategory.LAB_RESULTS,
    title: 'Inflammatory markers',
    content: 'Your inflammatory markers (CRP: {crp}, ESR: {esr}) are {status}. {interpretation}. This {implication} for your recovery. We will recheck {recheck_plan}.',
    variables: ['crp', 'esr', 'status', 'interpretation', 'implication', 'recheck_plan'],
    tags: ['lab', 'inflammation', 'CRP', 'ESR'],
  },
  {
    id: 'tpl_lab_06',
    category: TemplateCategory.LAB_RESULTS,
    title: 'Lab order placed',
    content: 'I have placed an order for the following lab tests: {test_list}. Please have these drawn at {lab_location} {timing_instructions}. Results are typically available within {turnaround}.',
    variables: ['test_list', 'lab_location', 'timing_instructions', 'turnaround'],
    tags: ['lab', 'order', 'instructions'],
  },

  // --- Encouragement (9) ---
  {
    id: 'tpl_enc_01',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'General encouragement',
    content: 'You are doing a great job with your recovery! I can see the progress you are making. Keep up the good work with your exercises and medication routine.',
    variables: [],
    tags: ['encouragement', 'positive', 'progress'],
  },
  {
    id: 'tpl_enc_02',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'Milestone reached',
    content: 'Congratulations on reaching {milestone}! This is an important step in your recovery. You should be proud of how far you have come since surgery.',
    variables: ['milestone'],
    tags: ['encouragement', 'milestone', 'achievement'],
  },
  {
    id: 'tpl_enc_03',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'Tough day support',
    content: 'I understand today has been a difficult day. Recovery is not always a straight line. Some days will be harder than others, and that is completely normal. You are doing well overall.',
    variables: [],
    tags: ['encouragement', 'support', 'difficult day'],
  },
  {
    id: 'tpl_enc_04',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'Pain improvement acknowledgment',
    content: 'I am glad to see your pain levels have been improving. This is a positive sign that your body is healing. Continue with your current management plan.',
    variables: [],
    tags: ['encouragement', 'pain', 'improvement'],
  },
  {
    id: 'tpl_enc_05',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'Patient engagement acknowledgment',
    content: 'Thank you for being so diligent about tracking your symptoms and communicating with us. Your active participation in your recovery makes a real difference in your outcomes.',
    variables: [],
    tags: ['encouragement', 'engagement', 'communication'],
  },
  {
    id: 'tpl_enc_06',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'Recovery timeline reassurance',
    content: 'You are currently at {weeks_post_op} weeks post-surgery. At this stage, it is normal to experience {common_symptoms}. Most patients see significant improvement by {improvement_timeline}.',
    variables: ['weeks_post_op', 'common_symptoms', 'improvement_timeline'],
    tags: ['encouragement', 'timeline', 'reassurance'],
  },
  {
    id: 'tpl_enc_07',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'Support resources',
    content: 'Remember, you do not have to go through this alone. In addition to our team, you can reach out to {support_resources}. Many patients find it helpful to {suggestions}.',
    variables: ['support_resources', 'suggestions'],
    tags: ['encouragement', 'support', 'resources'],
  },
  {
    id: 'tpl_enc_08',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'Weekend check-in',
    content: 'Just checking in to see how you are doing this weekend. Remember to stay on top of your medication schedule and do your exercises. Enjoy some rest as well. Let me know if you need anything.',
    variables: [],
    tags: ['encouragement', 'check-in', 'weekend'],
  },
  {
    id: 'tpl_enc_09',
    category: TemplateCategory.ENCOURAGEMENT,
    title: 'Pre-surgery anxiety support',
    content: 'It is completely normal to feel anxious before a procedure. Our team will be with you every step of the way. If you have any last-minute questions or concerns, do not hesitate to ask.',
    variables: [],
    tags: ['encouragement', 'anxiety', 'pre-surgery'],
  },

  // --- Diet (3) ---
  {
    id: 'tpl_diet_01',
    category: TemplateCategory.DIET,
    title: 'Post-surgery diet guidelines',
    content: 'For optimal healing, focus on: protein-rich foods (lean meats, eggs, beans), fruits and vegetables rich in Vitamin C, whole grains, and plenty of water ({water_intake} daily). Avoid {foods_to_avoid}.',
    variables: ['water_intake', 'foods_to_avoid'],
    tags: ['diet', 'nutrition', 'healing'],
  },
  {
    id: 'tpl_diet_02',
    category: TemplateCategory.DIET,
    title: 'Hydration reminder',
    content: 'Staying hydrated is crucial for your recovery. Aim for at least {water_intake} of water daily. Proper hydration helps with wound healing, medication absorption, and preventing constipation.',
    variables: ['water_intake'],
    tags: ['diet', 'hydration', 'water'],
  },
  {
    id: 'tpl_diet_03',
    category: TemplateCategory.DIET,
    title: 'Constipation management',
    content: 'If you are experiencing constipation (common with pain medications), try increasing fiber intake, drinking more water, and gentle walking. If it persists, you may take {otc_recommendation}. Let me know if it continues beyond {timeframe}.',
    variables: ['otc_recommendation', 'timeframe'],
    tags: ['diet', 'constipation', 'medication side effect'],
  },

  // --- Follow-up (4) ---
  {
    id: 'tpl_fu_01',
    category: TemplateCategory.FOLLOW_UP,
    title: 'Daily check-in prompt',
    content: 'Good morning! How are you feeling today? Please rate your pain level (0-10) and let me know about any new symptoms or concerns. Your daily updates help us manage your recovery effectively.',
    variables: [],
    tags: ['follow-up', 'check-in', 'daily'],
  },
  {
    id: 'tpl_fu_02',
    category: TemplateCategory.FOLLOW_UP,
    title: 'Post-visit check-in',
    content: 'I wanted to follow up after your visit on {date}. How are you doing with the changes we discussed? Have you been able to {action_items}? Please let me know if you have any questions.',
    variables: ['date', 'action_items'],
    tags: ['follow-up', 'post-visit', 'check-in'],
  },
  {
    id: 'tpl_fu_03',
    category: TemplateCategory.FOLLOW_UP,
    title: 'Symptom follow-up',
    content: 'You mentioned {symptom} in your last message. Has this improved, stayed the same, or gotten worse? Please provide details so I can determine if we need to adjust your treatment plan.',
    variables: ['symptom'],
    tags: ['follow-up', 'symptom', 'assessment'],
  },
  {
    id: 'tpl_fu_04',
    category: TemplateCategory.FOLLOW_UP,
    title: 'No response follow-up',
    content: 'I noticed we have not heard from you in {days} days. I want to make sure everything is going well with your recovery. Please send us a quick update when you get a chance.',
    variables: ['days'],
    tags: ['follow-up', 'no response', 'check-in'],
  },

  // --- Emergency Guidance (3) ---
  {
    id: 'tpl_emg_01',
    category: TemplateCategory.EMERGENCY_GUIDANCE,
    title: 'When to call 911',
    content: 'If you are experiencing any of the following, please call 911 immediately: chest pain, difficulty breathing, sudden severe headache, loss of consciousness, uncontrollable bleeding, or signs of stroke (face drooping, arm weakness, speech difficulty).',
    variables: [],
    tags: ['emergency', '911', 'urgent'],
  },
  {
    id: 'tpl_emg_02',
    category: TemplateCategory.EMERGENCY_GUIDANCE,
    title: 'When to go to ER',
    content: 'Please go to the emergency room if you experience: fever above {fever_threshold}, sudden severe pain not relieved by medication, signs of wound infection with fever, inability to keep fluids down for {vomiting_duration}, or {additional_criteria}.',
    variables: ['fever_threshold', 'vomiting_duration', 'additional_criteria'],
    tags: ['emergency', 'ER', 'urgent'],
  },
  {
    id: 'tpl_emg_03',
    category: TemplateCategory.EMERGENCY_GUIDANCE,
    title: 'After-hours contact information',
    content: 'For after-hours concerns: Call our nurse line at {nurse_line}. For emergencies, call 911 or go to your nearest ER. For non-urgent questions, message us here and we will respond during business hours ({business_hours}).',
    variables: ['nurse_line', 'business_hours'],
    tags: ['emergency', 'after-hours', 'contact'],
  },
];

// ============================================================================
// ChatService Implementation
// ============================================================================

class ChatServiceImpl {
  // --------------------------------------------------------------------------
  // Internal storage accessors
  // --------------------------------------------------------------------------

  private getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(CHAT_STORAGE_KEYS.CONVERSATIONS);
      if (!data) return [];
      return JSON.parse(data) as Conversation[];
    } catch {
      return [];
    }
  }

  private saveConversations(conversations: Conversation[]): void {
    localStorage.setItem(CHAT_STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }

  private getMessagesKey(conversationId: string): string {
    return `${CHAT_STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
  }

  private getMessages(conversationId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(this.getMessagesKey(conversationId));
      if (!data) return [];
      return JSON.parse(data) as ChatMessage[];
    } catch {
      return [];
    }
  }

  private saveMessages(conversationId: string, messages: ChatMessage[]): void {
    localStorage.setItem(this.getMessagesKey(conversationId), JSON.stringify(messages));
  }

  // --------------------------------------------------------------------------
  // Conversation Management
  // --------------------------------------------------------------------------

  /**
   * Creates a new conversation between participants.
   */
  createConversation(
    patientId: string,
    title: string,
    participants: ConversationParticipant[]
  ): Conversation {
    const now = nowISO();

    // Ensure system participant is present
    const hasSystem = participants.some(p => p.role === ParticipantRole.SYSTEM);
    if (!hasSystem) {
      participants.push({
        userId: 'system',
        displayName: 'System',
        role: ParticipantRole.SYSTEM,
        joinedAt: now,
        lastSeenAt: now,
        isTyping: false,
      });
    }

    const unreadCounts: Record<string, number> = {};
    for (const p of participants) {
      unreadCounts[p.userId] = 0;
    }

    const conversation: Conversation = {
      id: generateChatId('conv'),
      patientId,
      title,
      status: ConversationStatus.ACTIVE,
      participants,
      createdAt: now,
      updatedAt: now,
      unreadCounts,
    };

    const conversations = this.getConversations();
    conversations.push(conversation);
    this.saveConversations(conversations);

    // Create the conversation messages store
    this.saveMessages(conversation.id, []);

    // Send system welcome message
    this.sendMessage({
      conversationId: conversation.id,
      senderId: 'system',
      senderRole: ParticipantRole.SYSTEM,
      senderName: 'System',
      type: MessageType.SYSTEM,
      content: `Conversation started: "${title}". All messages are secure and part of your medical record.`,
    });

    return conversation;
  }

  /**
   * Retrieves a conversation by ID.
   */
  getConversation(conversationId: string): Conversation | null {
    const conversations = this.getConversations();
    return conversations.find(c => c.id === conversationId) ?? null;
  }

  /**
   * Retrieves all conversations for a patient.
   */
  getConversationsForPatient(patientId: string): Conversation[] {
    return this.getConversations()
      .filter(c => c.patientId === patientId)
      .sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.createdAt;
        const bTime = b.lastMessageAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }

  /**
   * Retrieves all conversations where a user is a participant.
   */
  getConversationsForUser(userId: string): Conversation[] {
    return this.getConversations()
      .filter(c => c.participants.some(p => p.userId === userId))
      .sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.createdAt;
        const bTime = b.lastMessageAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }

  /**
   * Closes a conversation.
   */
  closeConversation(conversationId: string, closedBy: string): Conversation | null {
    const conversations = this.getConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index === -1) return null;

    const now = nowISO();
    conversations[index] = {
      ...conversations[index],
      status: ConversationStatus.CLOSED,
      closedAt: now,
      updatedAt: now,
    };
    this.saveConversations(conversations);

    // Send system message about closure
    this.sendMessage({
      conversationId,
      senderId: 'system',
      senderRole: ParticipantRole.SYSTEM,
      senderName: 'System',
      type: MessageType.SYSTEM,
      content: `Conversation closed by ${closedBy}. You can still view messages but new messages cannot be sent.`,
    });

    return conversations[index];
  }

  /**
   * Archives a conversation.
   */
  archiveConversation(conversationId: string): Conversation | null {
    const conversations = this.getConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index === -1) return null;

    conversations[index] = {
      ...conversations[index],
      status: ConversationStatus.ARCHIVED,
      updatedAt: nowISO(),
    };
    this.saveConversations(conversations);
    return conversations[index];
  }

  /**
   * Adds a participant to a conversation.
   */
  addParticipant(conversationId: string, participant: ConversationParticipant): boolean {
    const conversations = this.getConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index === -1) return false;

    const exists = conversations[index].participants.some(
      p => p.userId === participant.userId
    );
    if (exists) return false;

    conversations[index].participants.push(participant);
    conversations[index].unreadCounts[participant.userId] = 0;
    conversations[index].updatedAt = nowISO();
    this.saveConversations(conversations);

    this.sendMessage({
      conversationId,
      senderId: 'system',
      senderRole: ParticipantRole.SYSTEM,
      senderName: 'System',
      type: MessageType.SYSTEM,
      content: `${participant.displayName} (${participant.role}) has joined the conversation.`,
    });

    return true;
  }

  /**
   * Removes a participant from a conversation.
   */
  removeParticipant(conversationId: string, userId: string): boolean {
    const conversations = this.getConversations();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index === -1) return false;

    const participantIndex = conversations[index].participants.findIndex(
      p => p.userId === userId
    );
    if (participantIndex === -1) return false;

    const removed = conversations[index].participants[participantIndex];
    conversations[index].participants.splice(participantIndex, 1);
    delete conversations[index].unreadCounts[userId];
    conversations[index].updatedAt = nowISO();
    this.saveConversations(conversations);

    this.sendMessage({
      conversationId,
      senderId: 'system',
      senderRole: ParticipantRole.SYSTEM,
      senderName: 'System',
      type: MessageType.SYSTEM,
      content: `${removed.displayName} has left the conversation.`,
    });

    return true;
  }

  // --------------------------------------------------------------------------
  // Message Operations
  // --------------------------------------------------------------------------

  /**
   * Sends a new message in a conversation.
   * Automatically runs symptom detection, priority analysis, and language
   * detection on text messages.
   */
  sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderRole: ParticipantRole;
    senderName: string;
    type: MessageType;
    content: string;
    threadId?: string;
    replyToMessageId?: string;
    imageAttachment?: ImageAttachment;
    voiceNoteMetadata?: VoiceNoteMetadata;
    quickReplyOptions?: QuickReplyOption[];
    careUpdatePayload?: CareUpdatePayload;
    metadata?: Record<string, unknown>;
  }): ChatMessage {
    const now = nowISO();

    // Analyze text content for symptoms and priority
    let detectedSymptoms: DetectedSymptom[] | undefined;
    let languageDetection: LanguageDetectionResult | undefined;
    let priority: MessagePriority = MessagePriority.NORMAL;

    if (params.type === MessageType.TEXT || params.type === MessageType.QUICK_REPLY) {
      detectedSymptoms = this.detectSymptoms(params.content);
      if (detectedSymptoms.length === 0) detectedSymptoms = undefined;

      const priorityResult = this.analyzePriority(params.content);
      priority = priorityResult.priority;

      languageDetection = this.detectLanguage(params.content);
      if (languageDetection.detectedLanguage === DetectedLanguage.ENGLISH) {
        languageDetection = undefined; // Only attach if non-English
      }
    }

    const message: ChatMessage = {
      id: generateChatId('msg'),
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      senderName: params.senderName,
      type: params.type,
      content: params.content,
      status: MessageStatus.SENT,
      priority,
      timestamp: now,
      threadId: params.threadId,
      replyToMessageId: params.replyToMessageId,
      imageAttachment: params.imageAttachment,
      voiceNoteMetadata: params.voiceNoteMetadata,
      quickReplyOptions: params.quickReplyOptions,
      careUpdatePayload: params.careUpdatePayload,
      detectedSymptoms,
      languageDetection,
      metadata: params.metadata,
    };

    // Persist message
    const messages = this.getMessages(params.conversationId);
    messages.push(message);
    this.saveMessages(params.conversationId, messages);

    // Update conversation metadata
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(c => c.id === params.conversationId);
    if (convIndex !== -1) {
      const conv = conversations[convIndex];
      conv.lastMessageAt = now;
      conv.lastMessagePreview = params.content.slice(0, 100);
      conv.updatedAt = now;

      // Increment unread for all participants except sender
      for (const participant of conv.participants) {
        if (participant.userId !== params.senderId) {
          conv.unreadCounts[participant.userId] = (conv.unreadCounts[participant.userId] ?? 0) + 1;
        }
      }

      conversations[convIndex] = conv;
      this.saveConversations(conversations);
    }

    return message;
  }

  /**
   * Retrieves messages for a conversation with pagination.
   */
  getConversationMessages(
    conversationId: string,
    page: number = 1,
    pageSize: number = 50
  ): PaginatedResult<ChatMessage> {
    const allMessages = this.getMessages(conversationId);

    // Sort newest first for pagination, then reverse for display order
    const sorted = [...allMessages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const total = sorted.length;
    const startIndex = (page - 1) * pageSize;
    const pageMessages = sorted.slice(startIndex, startIndex + pageSize);

    // Reverse back to chronological order for display
    pageMessages.reverse();

    return {
      items: pageMessages,
      total,
      page,
      pageSize,
      hasMore: startIndex + pageSize < total,
    };
  }

  /**
   * Retrieves messages in a specific thread.
   */
  getThreadMessages(conversationId: string, threadId: string): ChatMessage[] {
    const messages = this.getMessages(conversationId);
    return messages
      .filter(m => m.threadId === threadId || m.id === threadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Updates message status (sent -> delivered -> read).
   */
  updateMessageStatus(
    conversationId: string,
    messageId: string,
    status: MessageStatus
  ): boolean {
    const messages = this.getMessages(conversationId);
    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return false;

    messages[index] = { ...messages[index], status };
    this.saveMessages(conversationId, messages);
    return true;
  }

  /**
   * Marks all messages in a conversation as read for a specific user.
   * Returns the count of messages marked as read.
   */
  markConversationAsRead(conversationId: string, userId: string): number {
    const messages = this.getMessages(conversationId);
    let count = 0;

    for (let i = 0; i < messages.length; i++) {
      if (messages[i].senderId !== userId && messages[i].status !== MessageStatus.READ) {
        messages[i] = { ...messages[i], status: MessageStatus.READ };
        count++;
      }
    }

    if (count > 0) {
      this.saveMessages(conversationId, messages);
    }

    // Reset unread count for user
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    if (convIndex !== -1) {
      conversations[convIndex].unreadCounts[userId] = 0;
      this.saveConversations(conversations);
    }

    return count;
  }

  /**
   * Marks messages as delivered for a specific user.
   */
  markMessagesAsDelivered(conversationId: string, userId: string): number {
    const messages = this.getMessages(conversationId);
    let count = 0;

    for (let i = 0; i < messages.length; i++) {
      if (
        messages[i].senderId !== userId &&
        messages[i].status === MessageStatus.SENT
      ) {
        messages[i] = { ...messages[i], status: MessageStatus.DELIVERED };
        count++;
      }
    }

    if (count > 0) {
      this.saveMessages(conversationId, messages);
    }

    return count;
  }

  /**
   * Edits an existing message content.
   */
  editMessage(conversationId: string, messageId: string, newContent: string): ChatMessage | null {
    const messages = this.getMessages(conversationId);
    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return null;

    // Re-run analysis on new content
    const detectedSymptoms = this.detectSymptoms(newContent);
    const priorityResult = this.analyzePriority(newContent);

    messages[index] = {
      ...messages[index],
      content: newContent,
      editedAt: nowISO(),
      detectedSymptoms: detectedSymptoms.length > 0 ? detectedSymptoms : undefined,
      priority: priorityResult.priority,
    };

    this.saveMessages(conversationId, messages);
    return messages[index];
  }

  /**
   * Deletes a message (soft delete -- replaces content).
   */
  deleteMessage(conversationId: string, messageId: string): boolean {
    const messages = this.getMessages(conversationId);
    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return false;

    messages[index] = {
      ...messages[index],
      content: '[Message deleted]',
      editedAt: nowISO(),
      detectedSymptoms: undefined,
      imageAttachment: undefined,
      voiceNoteMetadata: undefined,
      quickReplyOptions: undefined,
      metadata: { ...messages[index].metadata, deleted: true },
    };

    this.saveMessages(conversationId, messages);
    return true;
  }

  // --------------------------------------------------------------------------
  // Typing Indicators
  // --------------------------------------------------------------------------

  /**
   * Sets typing status for a user in a conversation.
   */
  setTypingIndicator(conversationId: string, userId: string, isTyping: boolean): void {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return;

    const participantIndex = conversations[convIndex].participants.findIndex(
      p => p.userId === userId
    );
    if (participantIndex === -1) return;

    const now = nowISO();
    conversations[convIndex].participants[participantIndex] = {
      ...conversations[convIndex].participants[participantIndex],
      isTyping,
      typingStartedAt: isTyping ? now : undefined,
      lastSeenAt: now,
    };

    this.saveConversations(conversations);
  }

  /**
   * Gets all currently typing users in a conversation.
   * Automatically expires typing indicators older than 10 seconds.
   */
  getTypingUsers(conversationId: string): ConversationParticipant[] {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return [];

    const now = Date.now();
    const TYPING_TIMEOUT_MS = 10000;

    return conversation.participants.filter(p => {
      if (!p.isTyping) return false;
      if (p.typingStartedAt) {
        const elapsed = now - new Date(p.typingStartedAt).getTime();
        if (elapsed > TYPING_TIMEOUT_MS) {
          // Auto-expire stale typing indicator
          this.setTypingIndicator(conversationId, p.userId, false);
          return false;
        }
      }
      return true;
    });
  }

  // --------------------------------------------------------------------------
  // Message Search
  // --------------------------------------------------------------------------

  /**
   * Searches messages across conversations or within a specific conversation.
   */
  searchMessages(params: MessageSearchParams): MessageSearchResult[] {
    const results: MessageSearchResult[] = [];
    const queryLower = params.query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

    let conversations: Conversation[];
    if (params.conversationId) {
      const conv = this.getConversation(params.conversationId);
      conversations = conv ? [conv] : [];
    } else {
      conversations = this.getConversations();
    }

    for (const conv of conversations) {
      const messages = this.getMessages(conv.id);

      for (const message of messages) {
        // Filter by criteria
        if (params.senderId && message.senderId !== params.senderId) continue;
        if (params.messageType && message.type !== params.messageType) continue;
        if (params.startDate && message.timestamp < params.startDate) continue;
        if (params.endDate && message.timestamp > params.endDate) continue;
        if (params.priority && message.priority !== params.priority) continue;

        // Text matching
        const contentLower = message.content.toLowerCase();
        const matchingWords = queryWords.filter(w => contentLower.includes(w));
        if (matchingWords.length === 0) continue;

        // Score based on match quality
        const exactMatch = contentLower.includes(queryLower);
        const wordMatchRatio = matchingWords.length / queryWords.length;
        const matchScore = exactMatch ? 1.0 : wordMatchRatio * 0.8;

        // Extract context around the first match
        const firstMatchIndex = contentLower.indexOf(matchingWords[0]);
        const contextStart = Math.max(0, firstMatchIndex - 40);
        const contextEnd = Math.min(message.content.length, firstMatchIndex + queryLower.length + 40);
        const matchContext = (contextStart > 0 ? '...' : '') +
          message.content.slice(contextStart, contextEnd) +
          (contextEnd < message.content.length ? '...' : '');

        results.push({
          message,
          matchScore,
          matchContext,
        });
      }
    }

    return results.sort((a, b) => {
      // Sort by score first, then by recency
      if (Math.abs(a.matchScore - b.matchScore) > 0.1) {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.message.timestamp).getTime() - new Date(a.message.timestamp).getTime();
    });
  }

  // --------------------------------------------------------------------------
  // Smart Features: Symptom Detection
  // --------------------------------------------------------------------------

  /**
   * Detects symptom keywords in a message and returns categorized results.
   */
  detectSymptoms(text: string): DetectedSymptom[] {
    const textLower = text.toLowerCase();
    const detected: DetectedSymptom[] = [];
    const foundPositions = new Set<number>();

    // Sort keywords by length descending so longer matches take priority
    const sortedKeywords = [...SYMPTOM_KEYWORDS].sort(
      (a, b) => b.keyword.length - a.keyword.length
    );

    for (const entry of sortedKeywords) {
      let searchIndex = 0;
      while (searchIndex < textLower.length) {
        const position = textLower.indexOf(entry.keyword, searchIndex);
        if (position === -1) break;

        // Avoid overlapping detections
        let overlaps = false;
        for (let i = position; i < position + entry.keyword.length; i++) {
          if (foundPositions.has(i)) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          // Mark positions as used
          for (let i = position; i < position + entry.keyword.length; i++) {
            foundPositions.add(i);
          }

          // Extract surrounding context
          const contextStart = Math.max(0, position - 30);
          const contextEnd = Math.min(text.length, position + entry.keyword.length + 30);
          const context = text.slice(contextStart, contextEnd);

          detected.push({
            keyword: entry.keyword,
            category: entry.category,
            severity: entry.severity,
            position,
            context,
          });
        }

        searchIndex = position + 1;
      }
    }

    return detected.sort((a, b) => a.position - b.position);
  }

  // --------------------------------------------------------------------------
  // Smart Features: Priority Analysis
  // --------------------------------------------------------------------------

  /**
   * Analyzes message content for urgency and returns priority assessment.
   */
  analyzePriority(text: string): PriorityFlagResult {
    const textLower = text.toLowerCase();
    const triggerWords: string[] = [];
    let highestPriority: MessagePriority = MessagePriority.NORMAL;

    const priorityOrder: Record<MessagePriority, number> = {
      [MessagePriority.NORMAL]: 0,
      [MessagePriority.HIGH]: 1,
      [MessagePriority.URGENT]: 2,
    };

    for (const [word, priority] of Object.entries(URGENCY_WORDS)) {
      if (textLower.includes(word)) {
        triggerWords.push(word);
        if (priorityOrder[priority] > priorityOrder[highestPriority]) {
          highestPriority = priority;
        }
      }
    }

    // Check for multiple exclamation marks or ALL CAPS as additional urgency signals
    const exclamationCount = (text.match(/!/g) ?? []).length;
    const capsWordCount = (text.match(/\b[A-Z]{3,}\b/g) ?? []).length;

    if (exclamationCount >= 3 && highestPriority === MessagePriority.NORMAL) {
      highestPriority = MessagePriority.HIGH;
      triggerWords.push('multiple exclamation marks');
    }
    if (capsWordCount >= 3 && highestPriority === MessagePriority.NORMAL) {
      highestPriority = MessagePriority.HIGH;
      triggerWords.push('emphatic capitalization');
    }

    let reason: string;
    if (highestPriority === MessagePriority.URGENT) {
      reason = `Urgent attention required. Detected emergency indicators: ${triggerWords.join(', ')}.`;
    } else if (highestPriority === MessagePriority.HIGH) {
      reason = `Elevated priority. Concerning symptoms detected: ${triggerWords.join(', ')}.`;
    } else {
      reason = 'No urgency indicators detected.';
    }

    return {
      priority: highestPriority,
      triggerWords,
      reason,
      requiresImmediateAttention: highestPriority === MessagePriority.URGENT,
    };
  }

  // --------------------------------------------------------------------------
  // Smart Features: Language Detection
  // --------------------------------------------------------------------------

  /**
   * Detects the language of a message using heuristic pattern matching.
   * This is a placeholder approach -- real implementation would use a
   * proper NLP library or API.
   */
  detectLanguage(text: string): LanguageDetectionResult {
    if (!text || text.trim().length === 0) {
      return {
        detectedLanguage: DetectedLanguage.UNKNOWN,
        confidence: 0,
        originalText: text,
        suggestTranslation: false,
      };
    }

    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 1);

    // Check script-based languages first (highest confidence)
    for (const lang of LANGUAGE_PATTERNS) {
      for (const pattern of lang.patterns) {
        if (pattern.test(text)) {
          // For script-based detection (CJK, Arabic, etc.), high confidence
          if (lang.commonWords.length === 0) {
            return {
              detectedLanguage: lang.language,
              confidence: 0.95,
              originalText: text,
              suggestTranslation: true,
            };
          }
        }
      }
    }

    // Check word-frequency-based detection for Latin-script languages
    let bestMatch: DetectedLanguage = DetectedLanguage.ENGLISH;
    let bestScore = 0;

    for (const lang of LANGUAGE_PATTERNS) {
      if (lang.commonWords.length === 0) continue;

      let matchCount = 0;
      for (const word of words) {
        if (lang.commonWords.includes(word)) {
          matchCount++;
        }
      }

      // Also check for special characters
      let charBonus = 0;
      for (const pattern of lang.patterns) {
        if (pattern.test(text)) {
          charBonus = 0.15;
          break;
        }
      }

      const score = (words.length > 0 ? matchCount / words.length : 0) + charBonus;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = lang.language;
      }
    }

    // Threshold for non-English detection
    if (bestScore >= 0.15) {
      return {
        detectedLanguage: bestMatch,
        confidence: clamp(bestScore, 0, 1),
        originalText: text,
        suggestTranslation: true,
      };
    }

    // Default to English
    return {
      detectedLanguage: DetectedLanguage.ENGLISH,
      confidence: 0.7,
      originalText: text,
      suggestTranslation: false,
    };
  }

  // --------------------------------------------------------------------------
  // Smart Features: Quick Reply Suggestions
  // --------------------------------------------------------------------------

  /**
   * Generates context-aware quick reply suggestions based on the most recent
   * messages in a conversation.
   */
  suggestQuickReplies(conversationId: string, userId: string): QuickReplyOption[] {
    const messages = this.getMessages(conversationId);
    if (messages.length === 0) return QUICK_REPLY_SETS['general_status'];

    // Analyze the last few messages to determine context
    const recentMessages = messages.slice(-5);
    const lastMessage = recentMessages[recentMessages.length - 1];

    // If the last message was from the same user, no suggestion needed
    if (lastMessage.senderId === userId) return [];

    const combinedText = recentMessages.map(m => m.content).join(' ').toLowerCase();

    // Determine context from keywords
    if (this.textContainsAny(combinedText, ['pain', 'hurt', 'ache', 'sore', 'discomfort'])) {
      return QUICK_REPLY_SETS['pain_report'];
    }
    if (this.textContainsAny(combinedText, ['medication', 'medicine', 'pill', 'dose', 'prescription', 'drug'])) {
      return QUICK_REPLY_SETS['medication'];
    }
    if (this.textContainsAny(combinedText, ['wound', 'incision', 'dressing', 'bandage', 'stitches', 'staples'])) {
      return QUICK_REPLY_SETS['wound_check'];
    }
    if (this.textContainsAny(combinedText, ['appointment', 'visit', 'schedule', 'come in'])) {
      return QUICK_REPLY_SETS['appointment'];
    }
    if (this.textContainsAny(combinedText, ['exercise', 'therapy', 'stretch', 'walk', 'movement', 'physical'])) {
      return QUICK_REPLY_SETS['exercise'];
    }
    if (this.textContainsAny(combinedText, ['please', 'instructions', 'follow', 'recommend', 'should'])) {
      return QUICK_REPLY_SETS['acknowledgment'];
    }

    return QUICK_REPLY_SETS['general_status'];
  }

  private textContainsAny(text: string, keywords: string[]): boolean {
    return keywords.some(kw => text.includes(kw));
  }

  // --------------------------------------------------------------------------
  // Message Templates
  // --------------------------------------------------------------------------

  /**
   * Returns all available doctor message templates.
   */
  getTemplates(): MessageTemplate[] {
    return [...DOCTOR_MESSAGE_TEMPLATES];
  }

  /**
   * Returns templates filtered by category.
   */
  getTemplatesByCategory(category: TemplateCategory): MessageTemplate[] {
    return DOCTOR_MESSAGE_TEMPLATES.filter(t => t.category === category);
  }

  /**
   * Searches templates by keyword in title, content, or tags.
   */
  searchTemplates(query: string): MessageTemplate[] {
    const queryLower = query.toLowerCase();
    return DOCTOR_MESSAGE_TEMPLATES.filter(t => {
      const searchable = `${t.title} ${t.content} ${t.tags.join(' ')}`.toLowerCase();
      return searchable.includes(queryLower);
    });
  }

  /**
   * Returns a template by ID.
   */
  getTemplateById(templateId: string): MessageTemplate | null {
    return DOCTOR_MESSAGE_TEMPLATES.find(t => t.id === templateId) ?? null;
  }

  /**
   * Fills template variables with provided values and returns the rendered content.
   */
  renderTemplate(templateId: string, variables: Record<string, string>): string | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    let rendered = template.content;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return rendered;
  }

  /**
   * Sends a message using a template with variable substitution.
   */
  sendTemplateMessage(params: {
    conversationId: string;
    senderId: string;
    senderRole: ParticipantRole;
    senderName: string;
    templateId: string;
    variables: Record<string, string>;
    threadId?: string;
  }): ChatMessage | null {
    const rendered = this.renderTemplate(params.templateId, params.variables);
    if (!rendered) return null;

    return this.sendMessage({
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      senderName: params.senderName,
      type: MessageType.TEXT,
      content: rendered,
      threadId: params.threadId,
      metadata: {
        templateId: params.templateId,
        templateVariables: params.variables,
      },
    });
  }

  // --------------------------------------------------------------------------
  // Care Update Messages
  // --------------------------------------------------------------------------

  /**
   * Sends an automated care plan update notification.
   */
  sendCareUpdate(
    conversationId: string,
    payload: CareUpdatePayload
  ): ChatMessage {
    const content = payload.actionRequired
      ? `Care Plan Update: ${payload.title} - ${payload.description} (Action required${payload.dueDate ? ` by ${payload.dueDate}` : ''})`
      : `Care Plan Update: ${payload.title} - ${payload.description}`;

    return this.sendMessage({
      conversationId,
      senderId: 'system',
      senderRole: ParticipantRole.SYSTEM,
      senderName: 'Care Plan System',
      type: MessageType.CARE_UPDATE,
      content,
      careUpdatePayload: payload,
    });
  }

  // --------------------------------------------------------------------------
  // Conversation Analytics
  // --------------------------------------------------------------------------

  /**
   * Computes comprehensive analytics for a conversation.
   */
  getConversationAnalytics(conversationId: string): ConversationAnalytics | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return null;

    const messages = this.getMessages(conversationId);
    if (messages.length === 0) {
      return {
        conversationId,
        totalMessages: 0,
        messagesByType: {},
        messagesByParticipant: {},
        responseTimeStats: { averageMs: 0, medianMs: 0, minMs: 0, maxMs: 0, p90Ms: 0, sampleSize: 0 },
        volumeTrends: [],
        unreadCounts: conversation.unreadCounts,
        engagementScores: [],
        averageMessagesPerDay: 0,
        peakHour: 0,
        conversationDurationDays: 0,
      };
    }

    // Messages by type
    const messagesByType: Record<string, number> = {};
    for (const msg of messages) {
      messagesByType[msg.type] = (messagesByType[msg.type] ?? 0) + 1;
    }

    // Messages by participant
    const messagesByParticipant: Record<string, number> = {};
    for (const msg of messages) {
      messagesByParticipant[msg.senderId] = (messagesByParticipant[msg.senderId] ?? 0) + 1;
    }

    // Response time calculation
    const responseTimeStats = this.calculateResponseTimes(messages);

    // Volume trends (messages per day)
    const volumeTrends = this.calculateVolumeTrends(messages);

    // Engagement scores for patient participants
    const engagementScores: PatientEngagementScore[] = [];
    for (const participant of conversation.participants) {
      if (participant.role === ParticipantRole.PATIENT) {
        engagementScores.push(
          this.calculateEngagementScore(participant.userId, conversationId, messages)
        );
      }
    }

    // Average messages per day
    const firstMsgDate = new Date(messages[0].timestamp);
    const lastMsgDate = new Date(messages[messages.length - 1].timestamp);
    const durationDays = Math.max(
      1,
      Math.ceil((lastMsgDate.getTime() - firstMsgDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const avgPerDay = Math.round((messages.length / durationDays) * 100) / 100;

    // Peak hour
    const hourCounts = new Array(24).fill(0);
    for (const msg of messages) {
      const hour = new Date(msg.timestamp).getHours();
      hourCounts[hour]++;
    }
    let peakHour = 0;
    let peakCount = 0;
    for (let h = 0; h < 24; h++) {
      if (hourCounts[h] > peakCount) {
        peakCount = hourCounts[h];
        peakHour = h;
      }
    }

    return {
      conversationId,
      totalMessages: messages.length,
      messagesByType,
      messagesByParticipant,
      responseTimeStats,
      volumeTrends,
      unreadCounts: conversation.unreadCounts,
      engagementScores,
      averageMessagesPerDay: avgPerDay,
      peakHour,
      conversationDurationDays: durationDays,
    };
  }

  /**
   * Computes response time statistics from alternating messages between
   * different senders.
   */
  private calculateResponseTimes(messages: ChatMessage[]): ResponseTimeStats {
    const responseTimes: number[] = [];

    // Sort chronologically
    const sorted = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 1; i < sorted.length; i++) {
      // Only count response times between different senders
      if (sorted[i].senderId !== sorted[i - 1].senderId) {
        // Skip system messages
        if (sorted[i].senderRole === ParticipantRole.SYSTEM) continue;
        if (sorted[i - 1].senderRole === ParticipantRole.SYSTEM) continue;

        const responseTime =
          new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime();

        // Only count reasonable response times (under 7 days)
        if (responseTime > 0 && responseTime < 7 * 24 * 60 * 60 * 1000) {
          responseTimes.push(responseTime);
        }
      }
    }

    if (responseTimes.length === 0) {
      return { averageMs: 0, medianMs: 0, minMs: 0, maxMs: 0, p90Ms: 0, sampleSize: 0 };
    }

    return {
      averageMs: Math.round(mean(responseTimes)),
      medianMs: Math.round(median(responseTimes)),
      minMs: Math.min(...responseTimes),
      maxMs: Math.max(...responseTimes),
      p90Ms: Math.round(percentile(responseTimes, 90)),
      sampleSize: responseTimes.length,
    };
  }

  /**
   * Computes daily message volume trends.
   */
  private calculateVolumeTrends(messages: ChatMessage[]): MessageVolumeTrend[] {
    const byDate = new Map<string, { sent: Set<string>; received: Set<string>; total: number }>();

    for (const msg of messages) {
      const date = msg.timestamp.slice(0, 10);
      if (!byDate.has(date)) {
        byDate.set(date, { sent: new Set(), received: new Set(), total: 0 });
      }
      const dayData = byDate.get(date)!;
      dayData.total++;

      // Track by role: patient messages = sent, doctor/system = received
      if (msg.senderRole === ParticipantRole.PATIENT) {
        dayData.sent.add(msg.id);
      } else {
        dayData.received.add(msg.id);
      }
    }

    const sortedDates = [...byDate.keys()].sort();
    return sortedDates.map(date => {
      const data = byDate.get(date)!;
      return {
        date,
        sent: data.sent.size,
        received: data.received.size,
        total: data.total,
      };
    });
  }

  /**
   * Calculates an engagement score for a patient based on their messaging behavior.
   *
   * Scoring factors:
   *  - Response rate (do they reply to doctor messages?)
   *  - Response speed (how quickly do they respond?)
   *  - Consistency (how many of the recent days have they been active?)
   *  - Volume (are they proactively reporting?)
   */
  private calculateEngagementScore(
    patientId: string,
    _conversationId: string,
    messages: ChatMessage[]
  ): PatientEngagementScore {
    const patientMessages = messages.filter(m => m.senderId === patientId);

    if (patientMessages.length === 0) {
      return {
        patientId,
        overallScore: 0,
        responseRate: 0,
        averageResponseTimeMs: 0,
        messagesPerDay: 0,
        activeDays: 0,
        totalDays: 0,
        lastActiveAt: '',
        engagementLevel: 'low',
      };
    }

    // Sort all messages chronologically
    const sorted = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Response rate: count doctor messages followed by patient replies
    let doctorMessagesCount = 0;
    let patientRepliesCount = 0;
    const responseTimes: number[] = [];

    for (let i = 0; i < sorted.length; i++) {
      if (
        sorted[i].senderId !== patientId &&
        sorted[i].senderRole !== ParticipantRole.SYSTEM
      ) {
        doctorMessagesCount++;
        // Look for patient reply
        for (let j = i + 1; j < sorted.length; j++) {
          if (sorted[j].senderId === patientId) {
            patientRepliesCount++;
            const rt = new Date(sorted[j].timestamp).getTime() - new Date(sorted[i].timestamp).getTime();
            if (rt > 0 && rt < 7 * 24 * 60 * 60 * 1000) {
              responseTimes.push(rt);
            }
            break;
          }
          if (sorted[j].senderId !== patientId && sorted[j].senderRole !== ParticipantRole.SYSTEM) {
            break; // Another doctor message before patient reply
          }
        }
      }
    }

    const responseRate = doctorMessagesCount > 0
      ? patientRepliesCount / doctorMessagesCount
      : (patientMessages.length > 0 ? 1 : 0);

    const averageResponseTimeMs = responseTimes.length > 0 ? mean(responseTimes) : 0;

    // Active days
    const activeDays = new Set(patientMessages.map(m => m.timestamp.slice(0, 10))).size;

    // Total days span
    const firstDate = new Date(sorted[0].timestamp);
    const lastDate = new Date(sorted[sorted.length - 1].timestamp);
    const totalDays = Math.max(
      1,
      Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const messagesPerDay = Math.round((patientMessages.length / totalDays) * 100) / 100;

    // Calculate composite score (0-100)
    const responseRateScore = responseRate * 30; // max 30 points
    const responseSpeedScore = averageResponseTimeMs > 0
      ? Math.max(0, 25 - (averageResponseTimeMs / (4 * 60 * 60 * 1000)) * 25) // 0 if > 4h, 25 if instant
      : 0;
    const consistencyScore = (activeDays / totalDays) * 25; // max 25 points
    const volumeScore = Math.min(20, messagesPerDay * 10); // max 20 points

    const overallScore = Math.round(
      clamp(responseRateScore + responseSpeedScore + consistencyScore + volumeScore, 0, 100)
    );

    let engagementLevel: 'low' | 'medium' | 'high' | 'very_high';
    if (overallScore >= 80) engagementLevel = 'very_high';
    else if (overallScore >= 60) engagementLevel = 'high';
    else if (overallScore >= 35) engagementLevel = 'medium';
    else engagementLevel = 'low';

    const lastActive = patientMessages[patientMessages.length - 1]?.timestamp ?? '';

    return {
      patientId,
      overallScore,
      responseRate: Math.round(responseRate * 100) / 100,
      averageResponseTimeMs: Math.round(averageResponseTimeMs),
      messagesPerDay,
      activeDays,
      totalDays,
      lastActiveAt: lastActive,
      engagementLevel,
    };
  }

  /**
   * Gets unread message count for a user across all conversations.
   */
  getTotalUnreadCount(userId: string): number {
    const conversations = this.getConversationsForUser(userId);
    return conversations.reduce((total, conv) => {
      return total + (conv.unreadCounts[userId] ?? 0);
    }, 0);
  }

  /**
   * Gets unread message count per conversation for a user.
   */
  getUnreadCountsByConversation(userId: string): Record<string, number> {
    const conversations = this.getConversationsForUser(userId);
    const counts: Record<string, number> = {};
    for (const conv of conversations) {
      const unread = conv.unreadCounts[userId] ?? 0;
      if (unread > 0) {
        counts[conv.id] = unread;
      }
    }
    return counts;
  }

  // --------------------------------------------------------------------------
  // Data Management
  // --------------------------------------------------------------------------

  /**
   * Clears all chat data from localStorage.
   */
  clearAllData(): void {
    const conversations = this.getConversations();
    for (const conv of conversations) {
      localStorage.removeItem(this.getMessagesKey(conv.id));
    }
    localStorage.removeItem(CHAT_STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(CHAT_STORAGE_KEYS.TYPING_INDICATORS);
    localStorage.removeItem(CHAT_STORAGE_KEYS.ANALYTICS_CACHE);
  }

  /**
   * Exports all chat data for a patient (for data portability).
   */
  exportPatientData(patientId: string): {
    conversations: Conversation[];
    messages: Record<string, ChatMessage[]>;
  } {
    const conversations = this.getConversationsForPatient(patientId);
    const messagesMap: Record<string, ChatMessage[]> = {};

    for (const conv of conversations) {
      messagesMap[conv.id] = this.getMessages(conv.id);
    }

    return { conversations, messages: messagesMap };
  }

  /**
   * Returns storage usage statistics.
   */
  getStorageStats(): {
    totalConversations: number;
    totalMessages: number;
    approximateSizeBytes: number;
  } {
    const conversations = this.getConversations();
    let totalMessages = 0;
    let approxSize = 0;

    const convData = localStorage.getItem(CHAT_STORAGE_KEYS.CONVERSATIONS) ?? '';
    approxSize += convData.length * 2; // UTF-16

    for (const conv of conversations) {
      const msgData = localStorage.getItem(this.getMessagesKey(conv.id)) ?? '';
      const messages = this.getMessages(conv.id);
      totalMessages += messages.length;
      approxSize += msgData.length * 2;
    }

    return {
      totalConversations: conversations.length,
      totalMessages,
      approximateSizeBytes: approxSize,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Singleton instance of the chat service. */
export const chatService = new ChatServiceImpl();

/** Export class for testing. */
export { ChatServiceImpl };
