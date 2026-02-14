/**
 * MissionCard - Displays individual mission with context-aware action button
 * 
 * Requirements:
 * - 3.2: Display mission title, description, status
 * - 3.3: Show mission status (pending, completed, overdue)
 * - 4.1: Display action button as "Scan Incision" for photo upload
 * - 4.2: Display action button as "Mark Complete" for confirmation
 * - 4.3: Display action button with appropriate text for external actions
 * - 4.4: Execute corresponding mission action on button click
 */

import { Camera, CheckCircle, Activity, Clock, CheckCircle2, Pill } from 'lucide-react';
import type { Mission } from '../types';
import { MissionType, MissionStatus } from '../types';
import { medicationTracker } from '../services/medicationTracker';
import { useState, useEffect } from 'react';

interface MissionCardProps {
  mission: Mission;
  onAction: (missionId: string) => void;
}

/**
 * Renders the appropriate icon for a mission type
 */
function MissionIcon({ type, className }: { type: MissionType; className?: string }) {
  switch (type) {
    case MissionType.PHOTO_UPLOAD:
      return <Camera className={className} />;
    case MissionType.MEDICATION_CHECK:
      return <CheckCircle className={className} />;
    case MissionType.EXERCISE_LOG:
      return <Activity className={className} />;
    default:
      return <Activity className={className} />;
  }
}

/**
 * Get the status badge styling and text
 */
function getStatusBadge(status: MissionStatus) {
  switch (status) {
    case MissionStatus.COMPLETED:
      return {
        className: 'bg-gamification-success/10 text-gamification-success border-gamification-success/20',
        text: 'Completed',
        icon: CheckCircle2,
      };
    case MissionStatus.OVERDUE:
      return {
        className: 'bg-red-50 text-red-600 border-red-200',
        text: 'Overdue',
        icon: Clock,
      };
    case MissionStatus.PENDING:
    default:
      return {
        className: 'bg-blue-50 text-medical-primary border-blue-200',
        text: 'Pending',
        icon: Clock,
      };
  }
}

/**
 * MissionCard component displays a single mission with all relevant information
 * and a context-aware action button
 */
export function MissionCard({ mission, onAction }: MissionCardProps) {
  const statusBadge = getStatusBadge(mission.status);
  const StatusIcon = statusBadge.icon;

  // State for medication count
  const [tabletCount, setTabletCount] = useState<number | null>(null);

  // Determine if the mission is actionable (not completed)
  const isActionable = mission.status !== MissionStatus.COMPLETED;

  // Load tablet count for medication missions
  useEffect(() => {
    if (mission.type === MissionType.MEDICATION_CHECK) {
      try {
        const count = medicationTracker.getTabletCount('patient-1', 'med-1');
        queueMicrotask(() => {
          setTabletCount(count);
        });
        console.log('💊 [MissionCard] Tablet count loaded:', count);
      } catch (error) {
        console.error('❌ [MissionCard] Error loading tablet count:', error);
      }
    }
  }, [mission.type, mission.status]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header with icon and status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Mission icon with gamification styling */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-medical-primary to-gamification-accent flex items-center justify-center flex-shrink-0">
            <MissionIcon type={mission.type} className="w-6 h-6 text-white" />
          </div>
          
          {/* Mission title */}
          <div>
            <h3 className="text-lg font-semibold text-medical-text">
              {mission.title}
            </h3>
          </div>
        </div>
        
        {/* Status badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${statusBadge.className}`}>
          <StatusIcon className="w-4 h-4" />
          <span>{statusBadge.text}</span>
        </div>
      </div>
      
      {/* Mission description */}
      <p className="text-medical-text/70 mb-6 leading-relaxed">
        {mission.description}
      </p>
      
      {/* Medication tablet count */}
      {mission.type === MissionType.MEDICATION_CHECK && tabletCount !== null && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {tabletCount} tablets remaining
          </span>
          {tabletCount <= 3 && (
            <span className="ml-auto text-xs text-amber-600 font-medium">
              ⚠️ Low supply - Refill requested
            </span>
          )}
        </div>
      )}
      
      {/* Smart Action Button - context-aware text based on mission type */}
      {isActionable && (
        <button
          onClick={() => onAction(mission.id)}
          className="w-full bg-medical-primary hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 min-h-[44px]"
          aria-label={`${mission.actionButtonText} for ${mission.title}`}
        >
          <MissionIcon type={mission.type} className="w-5 h-5" />
          <span>{mission.actionButtonText}</span>
        </button>
      )}
      
      {/* Completed state - show completion message */}
      {!isActionable && (
        <div className="w-full bg-gamification-success/10 text-gamification-success font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Mission Complete! 🎉</span>
        </div>
      )}
    </div>
  );
}
