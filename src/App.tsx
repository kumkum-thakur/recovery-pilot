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

import { useEffect, useMemo } from 'react';
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
import {
  DrugInteractionPage, ReadmissionRiskPage, WoundHealingPage, MedicationAdherencePage,
  ClinicalNLPPage, ComplicationNetworkPage, PatientClusteringPage, TreatmentResponsePage,
  SepsisWarningPage, DVTRiskPage, FallRiskPage, PainProtocolPage,
  NutritionalScreeningPage, SSIPredictorPage, BloodGlucosePage, AntibioticStewardshipPage,
  MedicalTranslationPage, PatientEducationPage, CaregiverAccessPage, AppointmentSchedulingPage,
  RecoveryMilestonePage, PatientSatisfactionPage, SymptomPatternPage, RehabilitationPage,
  ClinicalPathwayPage, HandoffCommunicationPage, LabResultPage, VitalForecastPage,
  AlertFatiguePage, QualityMetricsPage, BedManagementPage, StaffWorkloadPage,
  FHIRResourcePage, ClinicalDocumentPage, PharmacyFormularyPage, SDOHScreenerPage,
  ClinicalTrialPage, PopulationHealthPage, PredictiveStaffingPage, ConsentManagementPage,
} from './pages/ClinicalFeaturePages';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionMonitor } from './components/SessionMonitor';
import { DebugMenu } from './components/DebugMenu';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { useUserStore } from './stores/userStore';
import { useConfigStore } from './stores/configStore';
import { errorLogger } from './services/errorLogger';
import { UserRole } from './types';
import type { UserModel } from './types';

function App() {
  const { isAuthenticated, currentUser } = useUserStore();
  const { loadConfig } = useConfigStore();
  const debugInfo = useMemo(() => ({
    mounted: true,
    isAuthenticated,
    currentUser: currentUser as UserModel | null,
    location: window.location.pathname,
  }), [isAuthenticated, currentUser]);

  console.log('🎯 App component rendering');
  console.log('🔐 isAuthenticated:', isAuthenticated);
  console.log('👤 currentUser:', currentUser);

  // Initialize config store on app mount
  useEffect(() => {
    console.log('⚙️ Loading config...');
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

          {/* Clinical Feature Routes - ML/AI Models */}
          <Route path="/patient/drug-interactions" element={<RouteErrorBoundary routeName="Drug Interactions"><ProtectedRoute requiredRole={UserRole.PATIENT}><DrugInteractionPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/readmission-risk" element={<RouteErrorBoundary routeName="Readmission Risk"><ProtectedRoute requiredRole={UserRole.PATIENT}><ReadmissionRiskPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/wound-healing" element={<RouteErrorBoundary routeName="Wound Healing"><ProtectedRoute requiredRole={UserRole.PATIENT}><WoundHealingPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/medication-adherence" element={<RouteErrorBoundary routeName="Medication Adherence"><ProtectedRoute requiredRole={UserRole.PATIENT}><MedicationAdherencePage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/clinical-nlp" element={<RouteErrorBoundary routeName="Clinical NLP"><ProtectedRoute requiredRole={UserRole.PATIENT}><ClinicalNLPPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/complication-network" element={<RouteErrorBoundary routeName="Complication Network"><ProtectedRoute requiredRole={UserRole.PATIENT}><ComplicationNetworkPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/patient-clustering" element={<RouteErrorBoundary routeName="Patient Clustering"><ProtectedRoute requiredRole={UserRole.PATIENT}><PatientClusteringPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/treatment-response" element={<RouteErrorBoundary routeName="Treatment Response"><ProtectedRoute requiredRole={UserRole.PATIENT}><TreatmentResponsePage /></ProtectedRoute></RouteErrorBoundary>} />

          {/* Clinical Feature Routes - Decision Support */}
          <Route path="/patient/sepsis-warning" element={<RouteErrorBoundary routeName="Sepsis Warning"><ProtectedRoute requiredRole={UserRole.PATIENT}><SepsisWarningPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/dvt-risk" element={<RouteErrorBoundary routeName="DVT Risk"><ProtectedRoute requiredRole={UserRole.PATIENT}><DVTRiskPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/fall-risk" element={<RouteErrorBoundary routeName="Fall Risk"><ProtectedRoute requiredRole={UserRole.PATIENT}><FallRiskPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/pain-protocol" element={<RouteErrorBoundary routeName="Pain Protocol"><ProtectedRoute requiredRole={UserRole.PATIENT}><PainProtocolPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/nutritional-screening" element={<RouteErrorBoundary routeName="Nutritional Screening"><ProtectedRoute requiredRole={UserRole.PATIENT}><NutritionalScreeningPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/ssi-predictor" element={<RouteErrorBoundary routeName="SSI Predictor"><ProtectedRoute requiredRole={UserRole.PATIENT}><SSIPredictorPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/blood-glucose" element={<RouteErrorBoundary routeName="Blood Glucose"><ProtectedRoute requiredRole={UserRole.PATIENT}><BloodGlucosePage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/antibiotic-stewardship" element={<RouteErrorBoundary routeName="Antibiotic Stewardship"><ProtectedRoute requiredRole={UserRole.PATIENT}><AntibioticStewardshipPage /></ProtectedRoute></RouteErrorBoundary>} />

          {/* Clinical Feature Routes - Patient Engagement */}
          <Route path="/patient/medical-translation" element={<RouteErrorBoundary routeName="Medical Translation"><ProtectedRoute requiredRole={UserRole.PATIENT}><MedicalTranslationPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/patient-education" element={<RouteErrorBoundary routeName="Patient Education"><ProtectedRoute requiredRole={UserRole.PATIENT}><PatientEducationPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/caregiver-access" element={<RouteErrorBoundary routeName="Caregiver Access"><ProtectedRoute requiredRole={UserRole.PATIENT}><CaregiverAccessPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/appointment-scheduling" element={<RouteErrorBoundary routeName="Appointments"><ProtectedRoute requiredRole={UserRole.PATIENT}><AppointmentSchedulingPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/recovery-milestones" element={<RouteErrorBoundary routeName="Recovery Milestones"><ProtectedRoute requiredRole={UserRole.PATIENT}><RecoveryMilestonePage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/patient-satisfaction" element={<RouteErrorBoundary routeName="Patient Satisfaction"><ProtectedRoute requiredRole={UserRole.PATIENT}><PatientSatisfactionPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/symptom-patterns" element={<RouteErrorBoundary routeName="Symptom Patterns"><ProtectedRoute requiredRole={UserRole.PATIENT}><SymptomPatternPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/rehabilitation" element={<RouteErrorBoundary routeName="Rehabilitation"><ProtectedRoute requiredRole={UserRole.PATIENT}><RehabilitationPage /></ProtectedRoute></RouteErrorBoundary>} />

          {/* Clinical Feature Routes - Operations */}
          <Route path="/patient/clinical-pathway" element={<RouteErrorBoundary routeName="Clinical Pathway"><ProtectedRoute requiredRole={UserRole.PATIENT}><ClinicalPathwayPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/handoff-communication" element={<RouteErrorBoundary routeName="Handoff Communication"><ProtectedRoute requiredRole={UserRole.PATIENT}><HandoffCommunicationPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/lab-results" element={<RouteErrorBoundary routeName="Lab Results"><ProtectedRoute requiredRole={UserRole.PATIENT}><LabResultPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/vital-forecast" element={<RouteErrorBoundary routeName="Vital Forecast"><ProtectedRoute requiredRole={UserRole.PATIENT}><VitalForecastPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/alert-fatigue" element={<RouteErrorBoundary routeName="Alert Fatigue"><ProtectedRoute requiredRole={UserRole.PATIENT}><AlertFatiguePage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/quality-metrics" element={<RouteErrorBoundary routeName="Quality Metrics"><ProtectedRoute requiredRole={UserRole.PATIENT}><QualityMetricsPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/bed-management" element={<RouteErrorBoundary routeName="Bed Management"><ProtectedRoute requiredRole={UserRole.PATIENT}><BedManagementPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/staff-workload" element={<RouteErrorBoundary routeName="Staff Workload"><ProtectedRoute requiredRole={UserRole.PATIENT}><StaffWorkloadPage /></ProtectedRoute></RouteErrorBoundary>} />

          {/* Clinical Feature Routes - Data & Integration */}
          <Route path="/patient/fhir-resources" element={<RouteErrorBoundary routeName="FHIR Resources"><ProtectedRoute requiredRole={UserRole.PATIENT}><FHIRResourcePage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/clinical-documents" element={<RouteErrorBoundary routeName="Clinical Documents"><ProtectedRoute requiredRole={UserRole.PATIENT}><ClinicalDocumentPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/pharmacy-formulary" element={<RouteErrorBoundary routeName="Pharmacy Formulary"><ProtectedRoute requiredRole={UserRole.PATIENT}><PharmacyFormularyPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/sdoh-screening" element={<RouteErrorBoundary routeName="SDOH Screening"><ProtectedRoute requiredRole={UserRole.PATIENT}><SDOHScreenerPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/clinical-trials" element={<RouteErrorBoundary routeName="Clinical Trials"><ProtectedRoute requiredRole={UserRole.PATIENT}><ClinicalTrialPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/population-health" element={<RouteErrorBoundary routeName="Population Health"><ProtectedRoute requiredRole={UserRole.PATIENT}><PopulationHealthPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/predictive-staffing" element={<RouteErrorBoundary routeName="Predictive Staffing"><ProtectedRoute requiredRole={UserRole.PATIENT}><PredictiveStaffingPage /></ProtectedRoute></RouteErrorBoundary>} />
          <Route path="/patient/consent-management" element={<RouteErrorBoundary routeName="Consent Management"><ProtectedRoute requiredRole={UserRole.PATIENT}><ConsentManagementPage /></ProtectedRoute></RouteErrorBoundary>} />

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
