/**
 * DoctorDashboard - Main dashboard for doctor users
 * 
 * Placeholder component for doctor dashboard.
 * Will be implemented in task 17.1
 * 
 * Requirements: 14.1, 14.2, 14.3
 */

import { useUserStore } from '../stores/userStore';
import { useNavigate } from 'react-router-dom';

export function DoctorDashboard() {
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
              Doctor Dashboard
            </h1>
            <p className="text-medical-text mt-2">
              Welcome, {currentUser?.name}
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
            Doctor dashboard content will be implemented in task 17.1
          </p>
        </div>
      </div>
    </div>
  );
}
