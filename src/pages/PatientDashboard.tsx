/**
 * PatientDashboard - Enhanced main dashboard for patient users
 *
 * Mobile-first responsive layout featuring:
 * - Welcome banner with streak display
 * - Recovery progress card with animated progress bar
 * - Current mission highlight card
 * - Daily vitals / medication tracking card
 * - Full mission stream
 * - AgentStatusToast for AI workflow progress
 *
 * Requirements: 3.4, 7.1, 7.2, 7.3, 10.3, 13.1, 13.2, 13.3, 13.4
 */

import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { useAgentStore } from '../stores/agentStore';
import { useMissionStore } from '../stores/missionStore';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { MissionStream } from '../components/MissionStream';
import { AgentStatusToast } from '../components/AgentStatusToast';
import { medicationTracker } from '../services/medicationTracker';
import { Activity, Pill, TrendingUp, Heart, Calendar, Award, Camera, Dumbbell, Flame, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MissionType, MissionStatus } from '../types';
import type { MedicationInventory, Mission } from '../types';

/**
 * Returns an encouraging subtitle based on the current streak count.
 */
function getStreakMessage(streak: number): string {
  if (streak === 0) return "Let's start building your streak today!";
  if (streak === 1) return 'Great start! Keep the momentum going.';
  if (streak <= 3) return 'You are building a healthy habit!';
  if (streak <= 7) return 'Incredible consistency! Your recovery is on track.';
  if (streak <= 14) return 'Two-week warrior! Your dedication is paying off.';
  return 'Amazing discipline! You are a recovery champion!';
}

/**
 * Returns the appropriate lucide-react icon for a mission type.
 */
function getMissionIcon(type: string) {
  switch (type) {
    case MissionType.PHOTO_UPLOAD:
      return Camera;
    case MissionType.MEDICATION_CHECK:
      return Pill;
    case MissionType.EXERCISE_LOG:
      return Dumbbell;
    default:
      return Activity;
  }
}

/**
 * Returns a background color class for a mission type icon container.
 */
function getMissionIconBg(type: string): string {
  switch (type) {
    case MissionType.PHOTO_UPLOAD:
      return 'bg-blue-100 text-blue-600';
    case MissionType.MEDICATION_CHECK:
      return 'bg-emerald-100 text-emerald-600';
    case MissionType.EXERCISE_LOG:
      return 'bg-violet-100 text-violet-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Formats a Date for display relative to now (e.g. "2 hours ago", "Just now").
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function PatientDashboard() {
  const { currentUser, logout } = useUserStore();
  const { currentWorkflow, clearWorkflow } = useAgentStore();
  const { missions, isLoading } = useMissionStore();
  const navigate = useNavigate();

  // Medication state
  const [medications, setMedications] = useState<MedicationInventory[]>([]);
  const [medicationsLoaded, setMedicationsLoaded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Handle workflow completion
   * Called when the AgentStatusToast auto-dismisses after all steps complete
   */
  const handleWorkflowComplete = () => {
    clearWorkflow();
  };

  // Fetch medication data
  useEffect(() => {
    if (currentUser?.id) {
      try {
        const meds = medicationTracker.getMedicationsForPatient(currentUser.id);
        setMedications(meds);
      } catch (error) {
        console.warn('Could not load medications:', error);
        setMedications([]);
      } finally {
        setMedicationsLoaded(true);
      }
    }
  }, [currentUser?.id, missions]); // Re-fetch when missions change (medication might be taken)

  // Safety check - should not happen due to ProtectedRoute
  if (!currentUser) {
    return null;
  }

  // Calculate recovery progress
  const totalMissions = missions.length;
  const completedMissions = missions.filter(m => m.status === MissionStatus.COMPLETED).length;
  const progressPercent = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  // Find first pending mission for highlight
  const currentMission: Mission | undefined = missions.find(m => m.status === MissionStatus.PENDING);

  const streakCount = currentUser.streakCount ?? 0;

  return (
    <div className="min-h-screen bg-medical-bg flex flex-col">
      {/* Header with StreakDisplay and ProfileButton */}
      <Header
        userName={currentUser.name}
        streakCount={streakCount}
        onLogout={handleLogout}
      />

      {/* Main content area - mobile-first responsive */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-lg">

        {/* ============================================================ */}
        {/* 1. Welcome & Streak Banner */}
        {/* ============================================================ */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-medical-text">
            Welcome back, {currentUser.name}!
          </h2>
          <p className="text-base text-gray-600 mt-1">
            {getStreakMessage(streakCount)}
          </p>

          {streakCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold shadow-md"
            >
              <Flame className="w-5 h-5" />
              <span>{streakCount} Day Streak</span>
              <Award className="w-4 h-4 opacity-80" />
            </motion.div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 2. Recovery Progress Card */}
        {/* ============================================================ */}
        <section className="mb-5">
          <div
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${
              isLoading ? '' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-medical-primary" />
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Recovery Progress
              </h3>
            </div>

            {isLoading ? (
              /* Skeleton / shimmer state */
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded-full w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-2">
                  <motion.span
                    key={progressPercent}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-medical-text"
                  >
                    {progressPercent}%
                  </motion.span>
                  <span className="text-sm text-gray-500">
                    {completedMissions} of {totalMissions} missions
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      progressPercent > 50
                        ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                        : 'bg-gradient-to-r from-blue-400 to-medical-primary'
                    }`}
                  />
                </div>

                {progressPercent === 100 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 text-sm text-emerald-600 font-medium flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    All missions complete! Outstanding work!
                  </motion.p>
                )}
              </>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. Current Mission Highlight */}
        {/* ============================================================ */}
        {!isLoading && currentMission && (
          <section className="mb-5">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-5">
              <span className="text-xs font-semibold text-medical-primary uppercase tracking-wide">
                Current Mission
              </span>

              <div className="flex items-start gap-4 mt-3">
                {/* Mission type icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getMissionIconBg(
                    currentMission.type
                  )}`}
                >
                  {(() => {
                    const Icon = getMissionIcon(currentMission.type);
                    return <Icon className="w-7 h-7" />;
                  })()}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-medical-text leading-tight">
                    {currentMission.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {currentMission.description}
                  </p>
                </div>
              </div>

              {/* The actual action happens in MissionStream below,
                  so this is a visual indicator pointing users down */}
              <div className="mt-4 flex items-center gap-2 text-sm text-medical-primary font-medium">
                <Heart className="w-4 h-4" />
                <span>Your Recovery Buddy says: You've got this!</span>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 4. Daily Vitals Card (Medication Tracking) */}
        {/* ============================================================ */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Daily Vitals
              </h3>
            </div>

            {!medicationsLoaded ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-500">Loading medications...</span>
              </div>
            ) : medications.length > 0 ? (
              <div className="space-y-4">
                {medications.map((med) => {
                  const maxTablets = med.tabletsRemaining + (med.refillThreshold * 2); // Approximate starting amount
                  const tabletPercent = Math.min(
                    100,
                    Math.round((med.tabletsRemaining / Math.max(maxTablets, 1)) * 100)
                  );
                  const isLow = med.tabletsRemaining <= med.refillThreshold;

                  return (
                    <div key={med.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-medical-text">
                            {med.medicationName}
                          </p>
                          <p className="text-xs text-gray-500">{med.dosage}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${
                              isLow ? 'text-orange-500' : 'text-medical-text'
                            }`}
                          >
                            {med.tabletsRemaining} tablets left
                          </p>
                          {med.lastTaken && (
                            <p className="text-xs text-gray-400">
                              Last taken: {formatRelativeTime(med.lastTaken)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tablet remaining progress bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${tabletPercent}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            isLow
                              ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                              : 'bg-gradient-to-r from-emerald-400 to-green-500'
                          }`}
                        />
                      </div>

                      {isLow && (
                        <p className="text-xs text-orange-500 font-medium">
                          Refill may be needed soon
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-medical-text">
                    No active medications
                  </p>
                  <p className="text-xs text-gray-500">
                    Your care plan has no medications to track right now.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. Mission Stream (All Missions) */}
        {/* ============================================================ */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gamification-accent" />
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              All Missions
            </h3>
          </div>
          <MissionStream />
        </section>
      </main>

      {/* ============================================================ */}
      {/* 6. Agent Status Toast - displays workflow progress */}
      {/* Requirements: 7.1, 7.2, 7.3 */}
      {/* ============================================================ */}
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null && currentWorkflow.length > 0}
        onComplete={handleWorkflowComplete}
      />
    </div>
  );
}
