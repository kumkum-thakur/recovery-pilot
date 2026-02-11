/**
 * CarePlanOverviewDashboard - Summary grid of patients with active care plans
 *
 * Displays a dashboard view for doctors showing all their patients with care plans.
 * Each patient card shows:
 * - Patient name
 * - Number of active care plans
 * - Completion percentage (completed missions / total missions)
 * - Number of overdue missions
 * - Click to navigate to patient's care plans
 *
 * Requirements: 1.3, 14.1, 14.2
 */

import { useEffect, useMemo } from 'react';
import { User, Activity, Clock, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import { useCarePlanStore } from '../stores/carePlanStore';
import { persistenceService } from '../services/persistenceService';
import type { UserModel, CarePlan } from '../types';
import { UserRole, CarePlanStatus, CarePlanMissionStatus } from '../types';

interface CarePlanOverviewDashboardProps {
  doctorId: string;
  onPatientSelect: (patientId: string) => void;
}

/**
 * Represents aggregated care plan statistics for a single patient
 */
interface PatientCarePlanSummary {
  patient: UserModel;
  activeCarePlanCount: number;
  totalMissions: number;
  completedMissions: number;
  overdueMissions: number;
  completionPercentage: number;
}

/**
 * Calculates the number of overdue missions across a set of care plans.
 * A mission is overdue if its schedule start date is in the past and status is active.
 */
function countOverdueMissions(carePlans: CarePlan[]): number {
  const now = new Date();
  let overdueCount = 0;

  for (const plan of carePlans) {
    if (plan.status !== CarePlanStatus.ACTIVE) continue;

    for (const mission of plan.missions) {
      if (
        mission.status === CarePlanMissionStatus.ACTIVE &&
        mission.schedule.startDate < now
      ) {
        overdueCount++;
      }
    }
  }

  return overdueCount;
}

/**
 * Calculates mission completion statistics across a set of care plans.
 * Returns total and completed mission counts.
 */
function calculateMissionStats(carePlans: CarePlan[]): {
  total: number;
  completed: number;
} {
  let total = 0;
  let completed = 0;

  for (const plan of carePlans) {
    for (const mission of plan.missions) {
      total++;
      if (mission.status === CarePlanMissionStatus.CANCELLED) {
        // Cancelled missions count as completed for percentage calculation
        completed++;
      }
    }
  }

  return { total, completed };
}

/**
 * CarePlanOverviewDashboard component displays a grid of patient cards
 * summarizing care plan status for each patient under a doctor's care.
 */
export function CarePlanOverviewDashboard({
  doctorId,
  onPatientSelect,
}: CarePlanOverviewDashboardProps) {
  const { carePlans, isLoading, fetchCarePlansForDoctor } = useCarePlanStore();

  // Fetch care plans for this doctor on mount
  useEffect(() => {
    fetchCarePlansForDoctor(doctorId);
  }, [doctorId, fetchCarePlansForDoctor]);

  // Get all patients from persistence service
  const patients = useMemo<UserModel[]>(() => {
    const allUsers = persistenceService.getAllUsers();
    return allUsers.filter((user) => user.role === UserRole.PATIENT);
  }, []);

  // Build per-patient summaries from care plans
  const patientSummaries = useMemo<PatientCarePlanSummary[]>(() => {
    const summaries: PatientCarePlanSummary[] = [];

    for (const patient of patients) {
      const patientCarePlans = carePlans.filter(
        (cp) => cp.patientId === patient.id
      );

      if (patientCarePlans.length === 0) continue;

      const activeCarePlanCount = patientCarePlans.filter(
        (cp) => cp.status === CarePlanStatus.ACTIVE
      ).length;

      const { total, completed } = calculateMissionStats(patientCarePlans);
      const overdueMissions = countOverdueMissions(patientCarePlans);
      const completionPercentage =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      summaries.push({
        patient,
        activeCarePlanCount,
        totalMissions: total,
        completedMissions: completed,
        overdueMissions,
        completionPercentage,
      });
    }

    return summaries;
  }, [patients, carePlans]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-medical-text">
          Care Plan Overview
        </h2>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-8 h-8 border-4 border-medical-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading care plans...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (patientSummaries.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-medical-text">
          Care Plan Overview
        </h2>
        <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-medical-text">
              No care plans yet
            </h3>
            <p className="text-gray-600 max-w-md">
              No care plans yet. Create one to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-medical-text">
          Care Plan Overview
        </h2>
        <span className="text-sm text-gray-600">
          {patientSummaries.length} patient{patientSummaries.length !== 1 ? 's' : ''} with care plans
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patientSummaries.map((summary) => (
          <button
            key={summary.patient.id}
            onClick={() => onPatientSelect(summary.patient.id)}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-medical-primary/30 transition-all text-left w-full"
          >
            {/* Patient header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-medical-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-medical-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-medical-text truncate">
                  {summary.patient.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {summary.activeCarePlanCount} active plan{summary.activeCarePlanCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Completion progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Completion</span>
                <span className="text-sm font-medium text-medical-text">
                  {summary.completionPercentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gamification-success rounded-full transition-all duration-300"
                  style={{ width: `${summary.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Activity className="w-4 h-4" />
                <span>
                  {summary.totalMissions} mission{summary.totalMissions !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-gamification-success" />
                <span>{summary.completedMissions} done</span>
              </div>
            </div>

            {/* Overdue warning */}
            {summary.overdueMissions > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-sm text-red-600 bg-red-50 rounded-md px-3 py-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {summary.overdueMissions} overdue mission{summary.overdueMissions !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Overdue indicator (no overdue) */}
            {summary.overdueMissions === 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-sm text-gamification-success bg-gamification-success/10 rounded-md px-3 py-1.5">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>All on track</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
