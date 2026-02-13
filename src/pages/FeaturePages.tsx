/**
 * FeaturePages - Individual page wrapper components for all patient features
 *
 * For features with existing components (PainTracker, SymptomChecker,
 * JournalEntry, NutritionTracker), this file wraps them in a page layout
 * with a Header and back button.
 *
 * For features without existing components, lightweight page wrappers are
 * provided that consume the relevant Zustand store and display key data.
 *
 * Each page wrapper:
 * - Imports Header from components/Header
 * - Has a back button to /patient (or /patient/features)
 * - Uses the relevant store
 * - Shows key data from the store
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import {
  usePainStore,
  useVitalSignsStore,
  useNutritionStore,
  useSleepStore,
  useJournalStore,
  useExerciseStore,
  useChatStore,
  useTelehealthStore,
  useGamificationStore,
  useAnalyticsStore,
  useEmergencyStore,
} from '../stores/featureStores';
import { useMissionStore } from '../stores/missionStore';
import { Header } from '../components/Header';
import { PainTracker } from '../components/PainTracker';
import { SymptomChecker } from '../components/SymptomChecker';
import { JournalEntry } from '../components/JournalEntry';
import { NutritionTracker } from '../components/NutritionTracker';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  HeartPulse,
  UtensilsCrossed,
  Moon,
  BookOpen,
  Pill,
  Dumbbell,
  MessageCircle,
  Video,
  Trophy,
  ShieldAlert,
  Download,
  Watch,
  Heart,
  Thermometer,
  Wind,
  Clock,
  Star,
  Phone,
  AlertTriangle,
  FileDown,
  Bluetooth,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared page layout wrapper
// ---------------------------------------------------------------------------

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function PageLayout({ children, title }: PageLayoutProps) {
  const { currentUser, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-medical-bg flex flex-col">
      <Header
        userName={currentUser.name}
        streakCount={currentUser.streakCount ?? 0}
        onLogout={handleLogout}
      />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="flex items-center gap-2 text-sm text-medical-primary font-medium hover:text-blue-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          {title && (
            <h2 className="text-2xl font-bold text-medical-text">{title}</h2>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared stat card sub-component
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-medical-text">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state sub-component
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ===========================================================================
// 1. Pain Tracker Page
// ===========================================================================

export function PainTrackerPage() {
  const { loadEntries } = usePainStore();

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return (
    <PageLayout>
      <PainTracker />
    </PageLayout>
  );
}

// ===========================================================================
// 2. Vital Signs Page
// ===========================================================================

export function VitalSignsPage() {
  const { readings, alerts, news2Score, loadReadings, getLatestReading, getUnacknowledgedAlerts } =
    useVitalSignsStore();

  useEffect(() => {
    loadReadings();
  }, [loadReadings]);

  const latest = getLatestReading();
  const unacknowledged = getUnacknowledgedAlerts();

  return (
    <PageLayout title="Vital Signs">
      <div className="space-y-6">
        {/* NEWS2 Score */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <HeartPulse className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              NEWS2 Score
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-medical-text">{news2Score}</span>
            <span className="text-sm text-gray-500 mb-1">
              {news2Score <= 4 ? 'Low risk' : news2Score <= 6 ? 'Medium risk' : 'High risk'}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {unacknowledged.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">
                {unacknowledged.length} unacknowledged alert{unacknowledged.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {unacknowledged.slice(0, 3).map((alert) => (
                <div key={alert.id} className="text-xs text-red-600">
                  {alert.parameter}: {alert.value} (threshold: {alert.threshold}) - {alert.severity}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Reading */}
        {latest ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              label="Heart Rate"
              value={`${latest.heartRate} bpm`}
              icon={Heart}
              iconBg="bg-rose-100"
              iconColor="text-rose-600"
            />
            <StatCard
              label="Blood Pressure"
              value={`${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic}`}
              icon={Activity}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Temperature"
              value={`${latest.temperature}°C`}
              icon={Thermometer}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
            <StatCard
              label="O2 Saturation"
              value={`${latest.oxygenSaturation}%`}
              icon={Wind}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
            />
            <StatCard
              label="Resp Rate"
              value={`${latest.respiratoryRate}/min`}
              icon={Wind}
              iconBg="bg-teal-100"
              iconColor="text-teal-600"
            />
          </div>
        ) : (
          <EmptyState message="No vital readings recorded yet. Your care team will log your vitals during check-ins." />
        )}

        {/* Readings count */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Total readings: <span className="font-semibold text-medical-text">{readings.length}</span>
            {' | '}
            Alerts: <span className="font-semibold text-medical-text">{alerts.length}</span>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 3. Symptom Checker Page
// ===========================================================================

export function SymptomCheckerPage() {
  return (
    <PageLayout>
      <SymptomChecker />
    </PageLayout>
  );
}

// ===========================================================================
// 4. Nutrition Page
// ===========================================================================

export function NutritionPage() {
  const { loadMealLog } = useNutritionStore();

  useEffect(() => {
    loadMealLog();
  }, [loadMealLog]);

  return (
    <PageLayout>
      <NutritionTracker />
    </PageLayout>
  );
}

// ===========================================================================
// 5. Sleep Tracking Page
// ===========================================================================

export function SleepTrackingPage() {
  const { entries, loadEntries, getMetrics, getRecentEntries } = useSleepStore();

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const metrics = getMetrics(7);
  const recentEntries = getRecentEntries(5);

  return (
    <PageLayout title="Sleep Tracking">
      <div className="space-y-6">
        {/* Sleep metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Avg Duration"
            value={metrics.averageDurationHours > 0 ? `${metrics.averageDurationHours}h` : '--'}
            icon={Moon}
            iconBg="bg-indigo-100"
            iconColor="text-indigo-600"
          />
          <StatCard
            label="Avg Quality"
            value={metrics.averageQuality > 0 ? `${metrics.averageQuality}/5` : '--'}
            icon={Star}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            label="Consistency"
            value={`${metrics.consistency}%`}
            icon={CheckCircle2}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
        </div>

        {/* Recent sleep entries */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Recent Sleep Entries
          </h3>
          {recentEntries.length > 0 ? (
            <div className="space-y-3">
              {recentEntries.map((entry) => {
                const bed = new Date(entry.bedtime);
                const wake = new Date(entry.wakeTime);
                const durationHours = ((wake.getTime() - bed.getTime()) / 3600000).toFixed(1);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div>
                      <p className="text-sm font-semibold text-medical-text">{entry.date}</p>
                      <p className="text-xs text-gray-500">
                        {durationHours}h | Quality: {entry.quality}/5 | Interruptions: {entry.interruptions}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < entry.quality ? 'bg-indigo-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No sleep entries yet. Start logging your sleep to see patterns.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Total entries: <span className="font-semibold text-medical-text">{entries.length}</span>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 6. Journal Page
// ===========================================================================

export function JournalPage() {
  const { loadEntries } = useJournalStore();

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return (
    <PageLayout>
      <JournalEntry />
    </PageLayout>
  );
}

// ===========================================================================
// 7. Medications Page
// ===========================================================================

export function MedicationsPage() {
  const { missions } = useMissionStore();

  // Filter medication-related missions
  const medMissions = missions.filter((m) => m.type === 'medication_check');

  return (
    <PageLayout title="Medications">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Medication Missions
            </h3>
          </div>
          {medMissions.length > 0 ? (
            <div className="space-y-3">
              {medMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-medical-text">{mission.title}</p>
                    <p className="text-xs text-gray-500">{mission.description}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      mission.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : (mission.status as string) === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {mission.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No medication missions assigned. Your care team will add medications to your plan.
            </p>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <Pill className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Medication Reminders</p>
            <p className="text-xs text-emerald-700 mt-1">
              Your medication schedule is managed through your daily missions. Complete them on time
              to maintain your streak and stay on track with your recovery.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 8. Exercise Page
// ===========================================================================

export function ExercisePage() {
  const { program, dailyRoutine, performanceLog, loadPerformanceLog, getDailyProgress, getCompletedToday } =
    useExerciseStore();

  useEffect(() => {
    loadPerformanceLog();
  }, [loadPerformanceLog]);

  const dailyProgress = getDailyProgress();
  const completedToday = getCompletedToday();

  return (
    <PageLayout title="Exercise Programs">
      <div className="space-y-6">
        {/* Daily progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-cyan-500" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Today's Progress
            </h3>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold text-medical-text">{Math.round(dailyProgress)}%</span>
            <span className="text-sm text-gray-500 mb-1">completed</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' as const }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Program Exercises"
            value={program.length}
            icon={Dumbbell}
            iconBg="bg-cyan-100"
            iconColor="text-cyan-600"
          />
          <StatCard
            label="Daily Routine"
            value={dailyRoutine.length}
            icon={Clock}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Done Today"
            value={completedToday.length}
            icon={CheckCircle2}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
        </div>

        {/* Performance log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Performance Log
          </h3>
          <p className="text-sm text-gray-500">
            Total sessions logged: <span className="font-semibold text-medical-text">{performanceLog.length}</span>
          </p>
          {performanceLog.length === 0 && (
            <p className="text-sm text-gray-400 mt-2">
              Start your exercise routine to begin tracking your performance.
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 9. Chat Page
// ===========================================================================

export function ChatPage() {
  const { conversations, loadConversations, getTotalUnreadCount } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const unreadCount = getTotalUnreadCount();

  return (
    <PageLayout title="Messages">
      <div className="space-y-6">
        {/* Unread badge */}
        {unreadCount > 0 && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-sky-600" />
            <p className="text-sm font-medium text-sky-800">
              You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Conversations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-sky-500" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Conversations
            </h3>
          </div>
          {conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-sky-200 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-medical-text truncate">
                      {conv.participantNames.join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 text-xs font-bold text-white bg-sky-500 rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No conversations yet. Your care team will reach out when they have updates.
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 10. Telehealth Page
// ===========================================================================

export function TelehealthPage() {
  const { sessions, loadSessions, getUpcomingSessions, getSessionHistory, currentSession, isConnecting } =
    useTelehealthStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const upcoming = getUpcomingSessions();
  const history = getSessionHistory();

  return (
    <PageLayout title="Telehealth">
      <div className="space-y-6">
        {/* Current session indicator */}
        {currentSession && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <p className="text-sm font-medium text-green-800">
              Session in progress with {currentSession.doctorName}
            </p>
          </div>
        )}
        {isConnecting && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-blue-800">Connecting...</p>
          </div>
        )}

        {/* Upcoming sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-teal-500" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Upcoming Sessions
            </h3>
          </div>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-medical-text">{session.doctorName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-teal-100 text-teal-700">
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming telehealth sessions scheduled.</p>
          )}
        </div>

        {/* Past sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Session History
          </h3>
          <p className="text-sm text-gray-500">
            Total sessions: <span className="font-semibold text-medical-text">{sessions.length}</span>
            {' | '}
            Completed: <span className="font-semibold text-medical-text">{history.length}</span>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 11. Gamification Page
// ===========================================================================

export function GamificationPage() {
  const {
    xp,
    level,
    badges,
    loadProgress,
    getLevelProgress,
    getXPForNextLevel,
    getUnlockedBadges,
    getActiveChallenges,
  } = useGamificationStore();

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const levelProgress = getLevelProgress();
  const xpForNext = getXPForNextLevel();
  const unlockedBadges = getUnlockedBadges();
  const activeChallenges = getActiveChallenges();

  return (
    <PageLayout title="Achievements & Rewards">
      <div className="space-y-6">
        {/* XP and level */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Your Level
            </h3>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-gamification-accent">{level}</span>
            <span className="text-sm text-gray-500 mb-1">
              {xp} / {xpForNext} XP
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, levelProgress)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' as const }}
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Badges Earned"
            value={unlockedBadges.length}
            icon={Star}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            label="Active Challenges"
            value={activeChallenges.length}
            icon={Trophy}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Badges ({unlockedBadges.length}/{badges.length})
          </h3>
          {badges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`text-center p-3 rounded-xl border ${
                    badge.unlockedAt
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gray-50 border-gray-100 opacity-50'
                  }`}
                >
                  <div className="text-2xl mb-1">{badge.unlockedAt ? '🏆' : '🔒'}</div>
                  <p className="text-xs font-medium text-medical-text truncate">{badge.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Complete missions and challenges to earn badges.
            </p>
          )}
        </div>

        {/* Active challenges */}
        {activeChallenges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Active Challenges
            </h3>
            <div className="space-y-3">
              {activeChallenges.map((challenge) => {
                const progress = (challenge.currentValue / challenge.targetValue) * 100;
                return (
                  <div key={challenge.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-medical-text">{challenge.title}</p>
                      <span className="text-xs text-gamification-accent font-medium">
                        +{challenge.xpReward} XP
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gamification-accent"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {challenge.currentValue}/{challenge.targetValue}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 12. Analytics Page
// ===========================================================================

export function AnalyticsPage() {
  const { dashboardData, lastRefreshed, isLoading, refreshDashboard, isGeneratingReport, reportProgress } =
    useAnalyticsStore();

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  return (
    <PageLayout title="Health Analytics">
      <div className="space-y-6">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Loader2 className="w-8 h-8 text-medical-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading analytics...</p>
          </div>
        ) : dashboardData ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Active Missions"
                value={dashboardData.activeMissions}
                icon={Activity}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatCard
                label="Completion Rate"
                value={`${dashboardData.completionRate}%`}
                icon={CheckCircle2}
                iconBg="bg-green-100"
                iconColor="text-green-600"
              />
              <StatCard
                label="Avg Pain Level"
                value={dashboardData.averagePainLevel.toFixed(1)}
                icon={Activity}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
              />
              <StatCard
                label="Alerts"
                value={dashboardData.alertsCount}
                icon={AlertTriangle}
                iconBg="bg-red-100"
                iconColor="text-red-600"
              />
              <StatCard
                label="Appointments Today"
                value={dashboardData.appointmentsToday}
                icon={Clock}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
              />
              <StatCard
                label="Total Patients"
                value={dashboardData.totalPatients}
                icon={HeartPulse}
                iconBg="bg-rose-100"
                iconColor="text-rose-600"
              />
            </div>

            {isGeneratingReport && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm font-medium text-medical-text mb-2">Generating Report...</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-medical-primary transition-all"
                    style={{ width: `${reportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState message="No analytics data available. Data will populate as you use the app." />
        )}

        {lastRefreshed && (
          <p className="text-xs text-gray-400 text-center">
            Last refreshed: {new Date(lastRefreshed).toLocaleString()}
          </p>
        )}
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 13. Emergency Page
// ===========================================================================

export function EmergencyPage() {
  const {
    contacts,
    emergencyHistory,
    loadContacts,
    getPrimaryContact,
    getActiveEmergencyCount,
  } = useEmergencyStore();

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const primaryContact = getPrimaryContact();
  const activeCount = getActiveEmergencyCount();

  return (
    <PageLayout title="Emergency">
      <div className="space-y-6">
        {/* Active emergencies alert */}
        {activeCount > 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-red-900">
                {activeCount} Active Emergency{activeCount !== 1 ? ' Events' : ''}
              </p>
              <p className="text-sm text-red-700 mt-1">
                Emergency contacts have been notified. Follow your emergency protocol.
              </p>
            </div>
          </div>
        )}

        {/* Emergency action button */}
        <div className="bg-red-600 rounded-2xl p-6 text-center">
          <ShieldAlert className="w-10 h-10 text-white mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Emergency Assistance</h3>
          <p className="text-sm text-red-100 mb-4">
            If you are experiencing a medical emergency, call 911 immediately.
          </p>
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 bg-white text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call 911
          </a>
        </div>

        {/* Primary contact */}
        {primaryContact && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Primary Emergency Contact
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-medical-text">{primaryContact.name}</p>
                <p className="text-xs text-gray-500">{primaryContact.relationship}</p>
                <p className="text-xs text-gray-500">{primaryContact.phone}</p>
              </div>
              <a
                href={`tel:${primaryContact.phone}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-medical-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            </div>
          </div>
        )}

        {/* All contacts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Emergency Contacts ({contacts.length})
          </h3>
          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-medical-text">
                      {contact.name}
                      {contact.isPrimary && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{contact.relationship} - {contact.phone}</p>
                  </div>
                  {contact.notifyAutomatically && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Auto-notify
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No emergency contacts configured. Add contacts to enable automatic notifications.
            </p>
          )}
        </div>

        {/* Emergency history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Emergency history: <span className="font-semibold text-medical-text">{emergencyHistory.length}</span> resolved events
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 14. Data Export Page
// ===========================================================================

export function DataExportPage() {
  const painEntries = usePainStore((s) => s.entries);
  const vitalReadings = useVitalSignsStore((s) => s.readings);
  const sleepEntries = useSleepStore((s) => s.entries);
  const journalEntries = useJournalStore((s) => s.entries);
  const mealLog = useNutritionStore((s) => s.mealLog);
  const exerciseLog = useExerciseStore((s) => s.performanceLog);

  const dataSources = [
    { label: 'Pain Entries', count: painEntries.length, icon: Activity },
    { label: 'Vital Readings', count: vitalReadings.length, icon: HeartPulse },
    { label: 'Sleep Entries', count: sleepEntries.length, icon: Moon },
    { label: 'Journal Entries', count: journalEntries.length, icon: BookOpen },
    { label: 'Meal Log', count: mealLog.length, icon: UtensilsCrossed },
    { label: 'Exercise Log', count: exerciseLog.length, icon: Dumbbell },
  ];

  const totalRecords = dataSources.reduce((sum, d) => sum + d.count, 0);

  const handleExportJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      painEntries,
      vitalReadings,
      sleepEntries,
      journalEntries,
      mealLog,
      exerciseLog,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-pilot-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout title="Export Health Data">
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Data Summary
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            You have <span className="font-bold text-medical-text">{totalRecords}</span> records available for export.
          </p>
          <div className="space-y-2">
            {dataSources.map((source) => {
              const Icon = source.icon;
              return (
                <div
                  key={source.label}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-medical-text">{source.label}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-medical-text">
                    {source.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export button */}
        <button
          type="button"
          onClick={handleExportJSON}
          disabled={totalRecords === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-medical-primary text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-5 h-5" />
          Export as JSON
        </button>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
          <Download className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-medical-text">Your data, your control</p>
            <p className="text-xs text-gray-500 mt-1">
              Export includes all locally stored health data. The exported JSON file can be shared
              with your healthcare provider or used for personal record-keeping.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// ===========================================================================
// 15. Wearables Page
// ===========================================================================

export function WearablesPage() {
  const vitalReadings = useVitalSignsStore((s) => s.readings);
  const sleepEntries = useSleepStore((s) => s.entries);
  const exerciseLog = useExerciseStore((s) => s.performanceLog);

  return (
    <PageLayout title="Wearable Devices">
      <div className="space-y-6">
        {/* Connection status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Watch className="w-5 h-5 text-fuchsia-500" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Device Status
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                  <Bluetooth className="w-5 h-5 text-fuchsia-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-medical-text">Bluetooth Devices</p>
                  <p className="text-xs text-gray-500">Not connected</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                Offline
              </span>
            </div>
          </div>
        </div>

        {/* Synced data summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Data Integration
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            When connected, your wearable data will sync automatically.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Vitals"
              value={vitalReadings.length}
              icon={HeartPulse}
              iconBg="bg-rose-100"
              iconColor="text-rose-600"
            />
            <StatCard
              label="Sleep"
              value={sleepEntries.length}
              icon={Moon}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
            />
            <StatCard
              label="Exercise"
              value={exerciseLog.length}
              icon={Dumbbell}
              iconBg="bg-cyan-100"
              iconColor="text-cyan-600"
            />
          </div>
        </div>

        {/* Supported devices */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Supported Devices
          </h3>
          <div className="space-y-2">
            {['Apple Watch', 'Fitbit', 'Garmin', 'Samsung Galaxy Watch', 'Oura Ring'].map(
              (device) => (
                <div
                  key={device}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <Watch className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-medical-text">{device}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-2xl p-4 flex items-start gap-3">
          <Watch className="w-5 h-5 text-fuchsia-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-fuchsia-800">Device Integration</p>
            <p className="text-xs text-fuchsia-700 mt-1">
              Connect your wearable device to automatically sync heart rate, sleep data, and
              activity levels with your recovery dashboard.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
