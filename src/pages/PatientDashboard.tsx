/**
 * PatientDashboard - Main dashboard for patient users
 * 
 * Placeholder component for patient dashboard.
 * Will be implemented in task 10.1
 * 
 * Requirements: 3.4, 10.3, 13.1, 13.2, 13.3, 13.4
 */

import { useUserStore } from '../stores/userStore';
import { useNavigate } from 'react-router-dom';

export function PatientDashboard() {
  const { currentUser, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-medical-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-medical-primary">
              Patient Dashboard
            </h1>
            <p className="text-medical-text mt-2">
              Welcome back, {currentUser?.name}!
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-medical-text">
            Patient dashboard content will be implemented in task 10.1
          </p>
          {currentUser?.streakCount !== undefined && (
            <p className="mt-4 text-gamification-accent font-bold">
              Current Streak: {currentUser.streakCount} days 🔥
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
