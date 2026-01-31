/**
 * App - Main application component with routing
 * 
 * Sets up routing for:
 * - Login page (/)
 * - Patient dashboard (/patient)
 * - Doctor dashboard (/doctor)
 * 
 * Also includes:
 * - DebugMenu for demo scenario configuration (Ctrl+Shift+D to toggle)
 * 
 * Requirements: 1.1, 2.1, 15.1, 15.2
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DebugMenu } from './components/DebugMenu';
import { useUserStore } from './stores/userStore';
import { useConfigStore } from './stores/configStore';
import { UserRole } from './types';

function App() {
  const { isAuthenticated, currentUser } = useUserStore();
  const { loadConfig } = useConfigStore();

  // Initialize config store on app mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              // Redirect to appropriate dashboard if already logged in
              currentUser?.role === UserRole.PATIENT ? (
                <Navigate to="/patient" replace />
              ) : (
                <Navigate to="/doctor" replace />
              )
            ) : (
              <LoginPage />
            )
          } 
        />

        {/* Patient Dashboard Route */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute requiredRole={UserRole.PATIENT}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Doctor Dashboard Route */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute requiredRole={UserRole.DOCTOR}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root Route - Redirect to login or appropriate dashboard */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              currentUser?.role === UserRole.PATIENT ? (
                <Navigate to="/patient" replace />
              ) : (
                <Navigate to="/doctor" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all Route - Redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
