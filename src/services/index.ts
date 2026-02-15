/**
 * Service layer exports
 * 
 * Centralized export point for all services
 */

export { persistenceService, PersistenceServiceImpl, PersistenceError } from './persistenceService';
export { SEED_USERS, SEED_MISSIONS, initializeSeedData } from './seedData';
export { authService, AuthServiceImpl, AuthenticationError } from './authService';
export { agentService, createAgentService, simulateWorkflowSteps } from './agentService';
export { carePlanService } from './carePlanService';
export { missionGenerationService } from './missionGenerationService';
export { medicationMissionGenerator } from './medicationMissionGenerator';
export { carePlanValidation } from './carePlanValidation';
export { DEFAULT_TEMPLATES, getTemplateById } from './carePlanTemplates';
export { geminiService } from './geminiService';
export { painTrackingService, PainTrackingServiceImpl, generateSeedData as generatePainSeedData } from './painTrackingService';

// Analytics & Reporting
export { createAnalyticsService, getAnalyticsService } from './analyticsService';
export type { AnalyticsService, AggregationPipeline, PatientRecord, DailySnapshot, RecoveryProgressScore, PainTrend, PopulationOverview, WeeklySummary, MonthlyProgress, DischargeReadiness as AnalyticsDischargeReadiness, DoctorHandoff, TimeSeriesPoint, TrendLineResult, ForecastResult } from './analyticsService';

// Audit Logging
export { auditLogService } from './auditLogService';
export { AuditActionType, AuditOutcome, ActorRole, ResourceType, SuspiciousActivityType } from './auditLogService';
export type { AuditEntry, AuditQueryFilters, AccessReportEntry, PatientAccessReport, SuspiciousActivity, ComplianceReport } from './auditLogService';

// Care Team
export { assignTeamMember, getPatientTeam, generateHandoffNote, acknowledgeSBAR, getSBARNotes, formatSBARNote, delegateTask, updateTaskStatus, getPatientTasks, getTeamWorkload, getEscalationPath, findBestAvailableMember, getTeamMember, getTeamMembersByRole, updateAvailability, TEAM_MEMBER_PROFILES, AUTO_ASSIGNMENT_RULES, TEAM_ROLES } from './careTeamService';
export type { TeamMember, SBARNote, CareTask, PatientTeamAssignment, WorkloadEntry, WorkloadReport, AutoAssignmentRule, TeamRole, AvailabilityStatus, TaskStatus, TaskPriority, IssueType } from './careTeamService';

// Chat
export { chatService } from './chatService';
export { MessageType, MessageStatus, ConversationStatus, ParticipantRole, MessagePriority, TemplateCategory, DetectedLanguage } from './chatService';
export type { ChatMessage, Conversation, MessageTemplate, ConversationParticipant, ImageAttachment, VoiceNoteMetadata, QuickReplyOption, CareUpdatePayload, LanguageDetectionResult, DetectedSymptom, PriorityFlagResult, PaginatedResult, MessageSearchParams, MessageSearchResult, ResponseTimeStats, MessageVolumeTrend, PatientEngagementScore, ConversationAnalytics } from './chatService';

// Data Export
export { exportJSON, exportCSV, exportFHIR, generateReport, anonymizeData, batchExport, getAvailablePatientIds, getAvailableTemplates, getAvailableCategories, getAvailableFHIRResourceTypes } from './dataExportService';
export type { ExportFormat, FHIRResourceType, ReportTemplate, DataCategory, FHIRResource, FHIRBundle, Report, ReportSection, AnonymizedData, BatchExportResult } from './dataExportService';

// Discharge Readiness
export { dischargeReadinessService, assessReadiness, generateDischargeChecklist, generateDischargeSummary, createPostDischargeMonitoringPlan, getPatientProfiles, getPatientProfile, getDashboardSummary } from './dischargeReadinessService';
export { ReadinessLevel, ChecklistItemStatus, ChecklistCategory, MonitoringPriority, RiskLevel as DischargeRiskLevel, SurgeryType as DischargeSurgeryType, ActivityRestrictionLevel, ContactType, READINESS_CRITERIA } from './dischargeReadinessService';
export type { CriterionScore, ReadinessAssessment, ChecklistItem, MedicationEntry, ActivityRestriction, WarningSign, FollowUpAppointment, EmergencyContact as DischargeEmergencyContact, DischargeSummary, MonitoringCheckpoint, MonitoringPlan, PatientProfile as DischargePatientProfile } from './dischargeReadinessService';

// Emergency Protocol
export { emergencyProtocolService, EmergencyProtocolService, evaluateEmergency, getProtocol, notifyEmergencyContacts, generateIncidentReport, getEmergencyHistory, addEmergencyContact, removeEmergencyContact, getEmergencyContacts, getEscalationChain, recordEmergencyEvent, resolveEmergencyEvent, findNearestHospitals, getBestHospitalForEmergency, generateFollowUpProtocol, generateCarePlanAdjustments, completeFollowUpAction, getFollowUpActions, getCarePlanAdjustments, recordOutcome as recordEmergencyOutcome, getOutcomeRecords, getEmergencyStatistics, EMERGENCY_RULES, EMERGENCY_PROTOCOLS } from './emergencyProtocolService';
export type { EmergencyAssessment, EmergencyEvent, EmergencyContact, EmergencyRule, Protocol, ProtocolStep, VitalSigns as EmergencyVitalSigns, Symptom, PriorityLevel, EmergencyCategory, HospitalInfo, FollowUpAction, CarePlanAdjustment, OutcomeRecord as EmergencyOutcomeRecord } from './emergencyProtocolService';

// Gamification
export { gamificationEngine, BADGE_DEFINITIONS, LEVEL_DEFINITIONS, REWARD_STORE_ITEMS } from './gamificationEngine';
export { BadgeCategory, BadgeRarity, ChallengeType, ChallengeStatus, RewardCategory, LeaderboardType, XPEventType } from './gamificationEngine';
export type { BadgeDefinition, EarnedBadge, XPEvent, LevelDefinition, PlayerLevel, LeaderboardEntry, LeaderboardConfig, ChallengeDefinition, ActiveChallenge, RewardItem, PurchasedReward, PlayerStats, GamificationProfile } from './gamificationEngine';

// Insurance Claims
export { insuranceClaimsService } from './insuranceClaimsService';
export { InsurancePlanType, InsuranceTier, NetworkStatus, ClaimStatus, PreAuthStatus, PaymentStatus, PaymentMethod, VisitType, EOBLineItemStatus } from './insuranceClaimsService';
export type { InsuranceProfile, CoverageDetails, NetworkBenefits, CPTCode, ICD10Code, ClaimLineItem, InsuranceClaim, ExplanationOfBenefits, EOBLineItem, PreAuthorization, CostEstimate, MedicationCostComparison, BillingStatement, BillingLineItem, Payment, PaymentPlan, DeductibleProgress, PreAuthAlert, AppointmentForClaim } from './insuranceClaimsService';

// Notification
export { createNotificationService, getNotificationService, NotificationType, NotificationPriority, NotificationStatus } from './notificationService';
export type { Notification, NotificationTemplate, NotificationPreferences, ScheduleEntry, EscalationRule, NotificationStats, BatchGroup, NotificationService } from './notificationService';

// Nutrition
export { nutritionService, NutritionService } from './nutritionService';
export { FoodCategory, MealType, RecoveryPlanType, RecoveryPhase as NutritionRecoveryPhase, NutrientWarningLevel, DietPhase } from './nutritionService';
export type { FoodItem, MealLogEntry, FluidLogEntry, SupplementLogEntry, DailyNutrientTargets, DailyNutrientTotals, NutrientComparison, NutrientAnalysis, WeeklyTrend, FoodInteraction, MealPlanEntry, DayMealPlan, WeeklyMealPlan, FoodSuggestion, RecoveryNutritionPlan, PatientNutritionProfile, Micronutrients } from './nutritionService';

// Outcome Tracking
export { outcomeTrackingService, generateOutcomeSeedData } from './outcomeTrackingService';
export { InstrumentType, SeverityLevel, SurgeryType as OutcomeSurgeryType, AssessmentTrigger, AssessmentStatus, MilestoneType as OutcomeMilestoneType, GoalStatus, ComplicationType } from './outcomeTrackingService';
export type { Assessment, ScheduledAssessment, OutcomePatient, RecoveryMilestone, GoalAttainment, ChangeScore, TrajectoryPoint, PatientDashboard, AggregateOutcome, RiskAdjustedOutcome, QualityReport, QuestionResponse } from './outcomeTrackingService';

// Patient Journal
export { patientJournalService } from './patientJournalService';
export { JournalEntryType, MoodRating, ActivityLevel, MilestoneType as JournalMilestoneType, RecoveryPhase as JournalRecoveryPhase, FlagReason, SentimentCategory, MOOD_LABELS } from './patientJournalService';
export type { JournalEntry, DailyCheckIn, SymptomDetail, MilestoneDetail, PhotoDiaryDetail, DoctorAnnotation, DoctorFlag, SentimentResult as JournalSentimentResult, JournalTrendPoint, CorrelationResult, PeriodSummary, MilestoneTimelineEvent, JournalingStreak, ReflectionTemplate, AppointmentJournalSummary, JournalExport } from './patientJournalService';

// Sleep Tracking
export { sleepTrackingService, generateSleepSeedData, SEDATING_MEDICATIONS } from './sleepTrackingService';
export { SleepQualityRating, DisturbanceType, TrendDirection as SleepTrendDirection, SleepAlertType, SleepAlertSeverity, SurgeryType as SleepSurgeryType, DayOfWeek } from './sleepTrackingService';
export type { SleepLogEntry, NightlyMetrics, SleepDebt, CircadianRhythm, ConsistencyScore, DayOfWeekPattern, SleepCorrelation, SleepHygieneScore, SleepRecommendation, SleepAlert, SleepReport, SleepDisturbance, SleepEnvironment, NapEntry, SleepHygieneFactors } from './sleepTrackingService';

// Telehealth
export { telehealthService } from './telehealthService';
export { SessionType, SessionStatus, CancellationReason, VisitNoteCategory, ActionItemPriority, RecoveryPhase as TelehealthRecoveryPhase } from './telehealthService';
export type { TelehealthSession, PreVisitSummary, VitalSnapshot, PainTrendSummary, MedicationSummary, ComplianceMetrics, PostVisitSummary, PostVisitActionItem, MedicationChange, VisitNoteTemplate, VisitNoteSection, SessionAnalytics, ProviderMetric } from './telehealthService';

// Vital Signs Monitor
export { vitalSignsMonitor } from './vitalSignsMonitor';
export { VitalSignType, AlertLevel, TrendDirection as VitalTrendDirection, ClinicalRisk, TimeOfDay, Gender, AnomalyType as VitalAnomalyType } from './vitalSignsMonitor';
export type { VitalSignReading, BloodPressureReading, NormalRange, PatientProfile as VitalPatientProfile, PersonalizedBaseline, TrendAnalysis as VitalTrendAnalysis, VitalCorrelation, NEWS2Score, VitalAlert, PatientVitalsSummary } from './vitalSignsMonitor';

// Wearable Integration
export { wearableIntegrationService } from './wearableIntegrationService';
export { DeviceType, DeviceBrand, MetricType, DataQualityLevel, SyncStatus, ConnectionStatus, RecoveryPhase as WearableRecoveryPhase, SleepQualityRating as WearableSleepQualityRating, MilestoneStatus } from './wearableIntegrationService';
export type { WearableDevice, RawDeviceDataPoint, NormalizedDataPoint, DataQualityReport, SyncRecord, OfflineQueueEntry, SleepAnalysis, HRVAnalysis, DailyActivitySummary, RecoveryCurvePoint, StepMilestone, SleepRecoveryImpact, StressTrackingRecord, PatientWearableSummary } from './wearableIntegrationService';

// ML Models - Recovery Prediction
export { RecoveryPredictionModel, createTrainedModel, getOrTrainModel, getTrainingData, generatePatientData } from './mlModels/recoveryPredictionModel';
export { SurgeryType as PredictionSurgeryType, RecoveryOutcome } from './mlModels/recoveryPredictionModel';
export type { PatientRecord as PredictionPatientRecord, FeatureVector, PredictionResult, EvaluationMetrics, CrossValidationResult, LogisticRegressionParams, DecisionTreeNode, SerializedModelState, Comorbidities } from './mlModels/recoveryPredictionModel';

// ML Models - Risk Scoring
export { riskScoringEngine, RiskScoringEngine, createRiskScoringEngine } from './mlModels/riskScoringEngine';
export { RiskTier, AlertSeverity, TrendDirection as RiskTrendDirection, ASAClass, AnesthesiaType, SurgeryComplexity, WoundHealingPhase, MoodLevel, ComorbidityType, SURGERY_TYPES as RISK_SURGERY_TYPES } from './mlModels/riskScoringEngine';
export type { PatientDemographics, SurgicalFactors, ComplianceData, ClinicalIndicators, BehavioralSignals, PatientRiskInput, RiskCategoryScore, RiskContributor, RiskAssessment, RiskAlert, AlertThreshold, RiskTrendPoint, TrendAnalysis as RiskTrendAnalysis, PopulationComparison, BaselinePatientProfile } from './mlModels/riskScoringEngine';

// ML Models - Anomaly Detection
export { anomalyDetectionEngine, AnomalyDetectionEngine, createAnomalyDetectionEngine, buildBaseline, detectVitalSignAnomalies, detectBehavioralAnomalies, classifyAnomaly, generateTestData as generateAnomalyTestData, getVitalNormalRanges, getDefaultConfig as getAnomalyDefaultConfig, ACTIVITY_TYPES } from './mlModels/anomalyDetectionEngine';
export { AnomalySeverity, AnomalyType as AnomalyDetectionType, VitalType } from './mlModels/anomalyDetectionEngine';
export type { VitalReading, ActivityLog, Baseline, VitalBaseline, Anomaly, AnomalyClassification, DetectionConfig, TestDataParams, TestDataBundle } from './mlModels/anomalyDetectionEngine';

// ML Models - Sentiment Analysis
export { sentimentEngine, SentimentAnalysisEngine, TfIdfCorpus, createSentimentEngine, analyzeSentiment, trackSentimentTrend, analyzeBatch, buildTfIdfVectors, runSentimentTests, getMedicalLexicon, getLexiconSize, SENTIMENT_TEST_CASES } from './mlModels/sentimentAnalysisEngine';
export { SentimentLabel, TrendDirection as SentimentTrendDirection, AlertLevel as SentimentAlertLevel } from './mlModels/sentimentAnalysisEngine';
export type { SentimentResult, EmotionScores, SentimentTrendResult, JournalEntry as SentimentJournalEntry, SentimentTestCase } from './mlModels/sentimentAnalysisEngine';

// ML Models - Symptom Checker
export { detectRedFlags, getFollowUpQuestions, analyzeSymptoms, SYMPTOM_DATABASE, CONDITION_DATABASE, PROBABILITY_MATRIX } from './mlModels/symptomCheckerModel';
export { Severity, Urgency, BodySystem } from './mlModels/symptomCheckerModel';
export type { SymptomDefinition, ConditionDefinition, AnalysisContext, ConditionResult, AnalysisResult, RedFlagResult } from './mlModels/symptomCheckerModel';

// ML Models - Self Learning Engine
export { selfLearningEngine, SelfLearningEngine, SLE_STORAGE_KEYS, FeatureName, FEATURE_COUNT, FEATURE_LABELS, RiskLevel as SLERiskLevel } from './mlModels/selfLearningEngine';
export type { ModelWeights, PatientFeatures, PredictionRecord, PredictionResult as SLEPredictionResult, ThresholdState, RecoveryPattern, KnowledgeRule, CalibrationBucket, CalibrationState, ModelVariant, ABTestState, FeatureDistribution, DriftState, RetrainState, EngineMetadata, EngineStats, LearningUpdate } from './mlModels/selfLearningEngine';

// ============================================================================
// New ML Models (8 features)
// ============================================================================

// ML Models - Drug Interaction Checker
export { DrugInteractionChecker as drugInteractionChecker } from './mlModels/drugInteractionChecker';

// ML Models - Readmission Risk Predictor
export { ReadmissionRiskPredictor as readmissionRiskPredictor } from './mlModels/readmissionRiskPredictor';

// ML Models - Wound Healing Classifier
export { WoundHealingClassifier as woundHealingClassifier } from './mlModels/woundHealingClassifier';

// ML Models - Medication Adherence Predictor
export { MedicationAdherencePredictor as medicationAdherencePredictor } from './mlModels/medicationAdherencePredictor';

// ML Models - Clinical NLP Engine
export { ClinicalNLPEngine as clinicalNLPEngine } from './mlModels/clinicalNLPEngine';

// ML Models - Complication Bayesian Network
export { ComplicationBayesianNetwork as complicationBayesianNetwork } from './mlModels/complicationBayesianNetwork';

// ML Models - Patient Clustering Engine
export { PatientClusteringEngine as patientClusteringEngine } from './mlModels/patientClusteringEngine';

// ML Models - Treatment Response Predictor
export { TreatmentResponsePredictor as treatmentResponsePredictor } from './mlModels/treatmentResponsePredictor';

// ============================================================================
// Clinical Decision Support (8 features)
// ============================================================================

export { sepsisEarlyWarningSystem } from './sepsisEarlyWarningSystem';
export { dvtRiskCalculator } from './dvtRiskCalculator';
export { fallRiskAssessment } from './fallRiskAssessment';
export { painProtocolEngine } from './painProtocolEngine';
export { nutritionalRiskScreening } from './nutritionalRiskScreening';
export { ssiPredictor } from './ssiPredictor';
export { bloodGlucoseMonitor } from './bloodGlucoseMonitor';
export { antibioticStewardshipEngine } from './antibioticStewardshipEngine';

// ============================================================================
// Patient Engagement (8 features)
// ============================================================================

export { MedicalTranslationEngine as medicalTranslationEngine } from './medicalTranslationEngine';
export { PatientEducationEngine as patientEducationEngine } from './patientEducationEngine';
export { CaregiverAccessSystem as caregiverAccessSystem } from './caregiverAccessSystem';
export { AppointmentSchedulingEngine as appointmentSchedulingEngine } from './appointmentSchedulingEngine';
export { RecoveryMilestoneTracker as recoveryMilestoneTracker } from './recoveryMilestoneTracker';
export { PatientSatisfactionEngine as patientSatisfactionEngine } from './patientSatisfactionEngine';
export { SymptomPatternRecognition as symptomPatternRecognition } from './symptomPatternRecognition';
export { RehabilitationProtocolEngine as rehabilitationProtocolEngine } from './rehabilitationProtocolEngine';

// ============================================================================
// Clinical Operations (8 features)
// ============================================================================

export { clinicalPathwayEngine } from './clinicalPathwayEngine';
export { handoffCommunicationEngine } from './handoffCommunicationEngine';
export { labResultInterpreter } from './labResultInterpreter';
export { vitalSignForecastingEngine } from './vitalSignForecastingEngine';
export { alertFatigueManager } from './alertFatigueManager';
export { qualityMetricsEngine } from './qualityMetricsEngine';
export { bedManagementEngine } from './bedManagementEngine';
export { staffWorkloadBalancer } from './staffWorkloadBalancer';

// ============================================================================
// Data & Integration (8 features)
// ============================================================================

export { createFHIRResourceEngine as fhirResourceEngine } from './fhirResourceEngine';
export { createClinicalDocumentGenerator as clinicalDocumentGenerator } from './clinicalDocumentGenerator';
export { createPharmacyFormularyChecker as pharmacyFormularyChecker } from './pharmacyFormularyChecker';
export { createSDOHScreener as sdohScreener } from './sdohScreener';
export { createClinicalTrialMatcher as clinicalTrialMatcher } from './clinicalTrialMatcher';
export { createPopulationHealthAnalytics as populationHealthAnalytics } from './populationHealthAnalytics';
export { createPredictiveStaffingModel as predictiveStaffingModel } from './predictiveStaffingModel';
export { createConsentManagementEngine as consentManagementEngine } from './consentManagementEngine';
