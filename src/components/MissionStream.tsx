/**
 * MissionStream - Displays the list of patient missions
 * 
 * Placeholder component - will be fully implemented in task 11.2
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { MissionCard } from './MissionCard';
import { Mission, MissionType, MissionStatus } from '../types';

export function MissionStream() {
  // Example missions to preview the MissionCard component
  // This will be replaced with real data from MissionStore in task 11.2
  const exampleMissions: Mission[] = [
    {
      id: 'mission-1',
      type: MissionType.PHOTO_UPLOAD,
      title: 'Mission 1: Scan Incision',
      description: 'Take a photo of your surgical incision for healing assessment',
      status: MissionStatus.PENDING,
      dueDate: new Date(),
      actionButtonText: 'Scan Incision',
    },
    {
      id: 'mission-2',
      type: MissionType.MEDICATION_CHECK,
      title: 'Mission 2: Medication Check',
      description: 'Confirm you took your morning antibiotics',
      status: MissionStatus.PENDING,
      dueDate: new Date(),
      actionButtonText: 'Mark Complete',
    },
  ];

  const handleAction = (missionId: string) => {
    console.log('Mission action triggered:', missionId);
    // This will be connected to MissionStore in task 11.2
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-medical-text">Your Missions</h2>
      
      {/* Preview of MissionCard component (Task 11.1 complete) */}
      <div className="space-y-4">
        {exampleMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onAction={handleAction}
          />
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-medical-text">
          ℹ️ <strong>Preview Mode:</strong> MissionCard component (Task 11.1) is complete! 
          Full integration with MissionStore will be implemented in task 11.2.
        </p>
      </div>
    </div>
  );
}
