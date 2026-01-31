/**
 * PatientDashboard - Main dashboard for patient users
 * 
 * Mobile-first responsive layout with header and mission stream.
 * Implements accessibility requirements with minimum tap targets and text sizes.
 * Integrates AgentStatusToast to display AI workflow progress.
 * 
 * Requirements: 3.4, 7.1, 7.2, 7.3, 10.3, 13.1, 13.2, 13.3, 13.4
 */

import { useUserStore } from '../stores/userStore';
import { useAgentStore } from '../stores/agentStore';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { MissionStream } from '../components/MissionStream';
import { AgentStatusToast } from '../components/AgentStatusToast';

export function PatientDashboard() {
  const { currentUser, logout } = useUserStore();
  const { currentWorkflow, clearWorkflow } = useAgentStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Handle workflow completion
   * Called when the AgentStatusToast auto-dismisses after all steps complete
   * 
   * Requirements: 7.3
   */
  const handleWorkflowComplete = () => {
    clearWorkflow();
  };

  // Safety check - should not happen due to ProtectedRoute
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-medical-bg flex flex-col">
      {/* Header with StreakDisplay and ProfileButton */}
      <Header
        userName={currentUser.name}
        streakCount={currentUser.streakCount}
        onLogout={handleLogout}
      />

      {/* Main content area - mobile-first responsive */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Welcome message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-medical-text">
            Welcome back, {currentUser.name}! 👋
          </h2>
          <p className="text-base text-gray-600 mt-1">
            Let's keep up with your recovery journey
          </p>
        </div>

        {/* Mission Stream - will be populated in task 11 */}
        <MissionStream />
      </main>

      {/* Agent Status Toast - displays workflow progress */}
      {/* Requirements: 7.1, 7.2, 7.3 */}
      <AgentStatusToast
        steps={currentWorkflow || []}
        isVisible={currentWorkflow !== null && currentWorkflow.length > 0}
        onComplete={handleWorkflowComplete}
      />
    </div>
  );
}
