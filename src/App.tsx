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
 * - ErrorBoundary for catching and handling React errors gracefully
 * 
 * Requirements: 1.1, 2.1, 15.1, 15.2, Task 21.1
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionMonitor } from './components/SessionMonitor';
import { DebugMenu } from './components/DebugMenu';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { useUserStore } from './stores/userStore';
import { useConfigStore } from './stores/configStore';
import { errorLogger } from './services/errorLogger';
import { UserRole } from './types';

function App() {
  const { isAuthenticated, currentUser } = useUserStore();
  const { loadConfig } = useConfigStore();

  // Initialize config store on app mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Global error handler for the entire app
  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    errorLogger.logBoundaryError(error, errorInfo, {
      route: window.location.pathname,
      userId: currentUser?.id,
      userRole: currentUser?.role,
    });
  };

  return (
    <ErrorBoundary onError={handleAppError}>
      <BrowserRouter>
        <Routes>
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              <RouteErrorBoundary routeName="Login">
                {isAuthenticated ? (
                  // Redirect to appropriate dashboard if already logged in
                  currentUser?.role === UserRole.PATIENT ? (
                    <Navigate to="/patient" replace />
                  ) : (
                    <Navigate to="/doctor" replace />
                  )
                ) : (
                  <LoginPage />
                )}
              </RouteErrorBoundary>
            } 
          />

          {/* Patient Dashboard Route */}
          <Route
            path="/patient"
            element={
              <RouteErrorBoundary routeName="Patient Dashboard">
                <ProtectedRoute requiredRole={UserRole.PATIENT}>
                  <PatientDashboard />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />

          {/* Doctor Dashboard Route */}
          <Route
            path="/doctor"
            element={
              <RouteErrorBoundary routeName="Doctor Dashboard">
                <ProtectedRoute requiredRole={UserRole.DOCTOR}>
                  <DoctorDashboard />
                </ProtectedRoute>
              </RouteErrorBoundary>
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
        
        {/* Session Monitor - Active when authenticated */}
        {isAuthenticated && <SessionMonitor />}
        
        {/* Debug Menu - Toggle with Ctrl+Shift+D */}
        <DebugMenu />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
