/**
 * App - Main application component with routing
 * 
 * Sets up routing for:
 * - Login page (/)
 * - Patient dashboard (/patient)
 * - Doctor dashboard (/doctor)
 * 
 * Also includes:
 * - SessionMonitor for tracking and warning about session expiration
 * - DebugMenu for demo scenario configuration (Ctrl+Shift+D to toggle)
 * - ErrorBoundary for catching and handling React errors gracefully
 * 
 * Requirements: 1.1, 2.1, 1.2, 2.2, 15.1, 15.2, Task 21.1, Task 21.2
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { FeatureHub } from './pages/FeatureHub';
import {
  PainTrackerPage,
  VitalSignsPage,
  SymptomCheckerPage,
  NutritionPage,
  SleepTrackingPage,
  JournalPage,
  MedicationsPage,
  ExercisePage,
  ChatPage,
  TelehealthPage,
  GamificationPage,
  AnalyticsPage,
  EmergencyPage,
  DataExportPage,
  WearablesPage,
} from './pages/FeaturePages';
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
  const [debugInfo, setDebugInfo] = useState({
    mounted: false,
    isAuthenticated: false,
    currentUser: null as any,
    location: '',
  });

  console.log('🎯 App component rendering');
  console.log('🔐 isAuthenticated:', isAuthenticated);
  console.log('👤 currentUser:', currentUser);

  // Initialize config store on app mount
  useEffect(() => {
    console.log('⚙️ Loading config...');
    loadConfig();
    setDebugInfo({
      mounted: true,
      isAuthenticated,
      currentUser,
      location: window.location.pathname,
    });
  }, [loadConfig]);

  // Update debug info when auth state changes
  useEffect(() => {
    setDebugInfo({
      mounted: true,
      isAuthenticated,
      currentUser,
      location: window.location.pathname,
    });
  }, [isAuthenticated, currentUser]);

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
      {/* Debug Overlay - Press Ctrl+Shift+I to toggle */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          background: 'rgba(0,0,0,0.9)',
          color: 'lime',
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          maxWidth: '300px',
          borderBottomLeftRadius: '8px',
        }}
      >
        <div>🐛 DEBUG INFO</div>
        <div>Mounted: {debugInfo.mounted ? '✅' : '❌'}</div>
        <div>Auth: {debugInfo.isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {debugInfo.currentUser?.name || 'none'}</div>
        <div>Role: {debugInfo.currentUser?.role || 'none'}</div>
        <div>Path: {debugInfo.location}</div>
      </div>
      
      <BrowserRouter>
        <Routes>
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              <RouteErrorBoundary routeName="Login">
                {isAuthenticated ? (
                  // Redirect to appropriate dashboard if already logged in
                  currentUser?.role === UserRole.ADMIN ? (
                    <Navigate to="/admin" replace />
                  ) : currentUser?.role === UserRole.PATIENT ? (
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

          {/* Admin Dashboard Route */}
          <Route
            path="/admin"
            element={
              <RouteErrorBoundary routeName="Admin Dashboard">
                <ProtectedRoute requiredRole={UserRole.ADMIN}>
                  <AdminDashboard />
                </ProtectedRoute>
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

          {/* Patient Feature Routes */}
          <Route path="/patient/features" element={<RouteErrorBoundary routeName="Feature Hub"><ProtectedRoute requiredRole={UserRole.PATIENT}><FeatureHub /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/pain" element={<RouteErrorBoundary routeName="Pain Tracker"><ProtectedRoute requiredRole={UserRole.PATIENT}><PainTrackerPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/vitals" element={<RouteErrorBoundary routeName="Vital Signs"><ProtectedRoute requiredRole={UserRole.PATIENT}><VitalSignsPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/symptoms" element={<RouteErrorBoundary routeName="Symptom Checker"><ProtectedRoute requiredRole={UserRole.PATIENT}><SymptomCheckerPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/nutrition" element={<RouteErrorBoundary routeName="Nutrition"><ProtectedRoute requiredRole={UserRole.PATIENT}><NutritionPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/sleep" element={<RouteErrorBoundary routeName="Sleep Tracking"><ProtectedRoute requiredRole={UserRole.PATIENT}><SleepTrackingPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/journal" element={<RouteErrorBoundary routeName="Journal"><ProtectedRoute requiredRole={UserRole.PATIENT}><JournalPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/medications" element={<RouteErrorBoundary routeName="Medications"><ProtectedRoute requiredRole={UserRole.PATIENT}><MedicationsPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/exercise" element={<RouteErrorBoundary routeName="Exercise"><ProtectedRoute requiredRole={UserRole.PATIENT}><ExercisePage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/chat" element={<RouteErrorBoundary routeName="Chat"><ProtectedRoute requiredRole={UserRole.PATIENT}><ChatPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/telehealth" element={<RouteErrorBoundary routeName="Telehealth"><ProtectedRoute requiredRole={UserRole.PATIENT}><TelehealthPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/achievements" element={<RouteErrorBoundary routeName="Achievements"><ProtectedRoute requiredRole={UserRole.PATIENT}><GamificationPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/analytics" element={<RouteErrorBoundary routeName="Analytics"><ProtectedRoute requiredRole={UserRole.PATIENT}><AnalyticsPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/emergency" element={<RouteErrorBoundary routeName="Emergency"><ProtectedRoute requiredRole={UserRole.PATIENT}><EmergencyPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/export" element={<RouteErrorBoundary routeName="Data Export"><ProtectedRoute requiredRole={UserRole.PATIENT}><DataExportPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/wearables" element={<RouteErrorBoundary routeName="Wearables"><ProtectedRoute requiredRole={UserRole.PATIENT}><WearablesPage /></ProtectedRoute></RouteErrorBoundary>} />

          {/* Root Route - Redirect to login or appropriate dashboard */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                currentUser?.role === UserRole.ADMIN ? (
                  <Navigate to="/admin" replace />
                ) : currentUser?.role === UserRole.PATIENT ? (
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
