/**
 * Component Interfaces for Medical Image Review and AI Feedback System
 * 
 * This file contains all service interfaces from the design document.
 */

import type {
  StoredImage,
  ImageMetadata,
  PreliminaryReport,
  FinalReview,
  ReviewContext,
  ReviewStatus,
  AIAccuracyGrade,
  AccuracyRating,
  PerformanceMetrics,
  ErrorPattern,
  CalibrationData,
  PerformanceReport,
  AuditLogEntry,
  AuditEventType,
  ActorType,
  AuditQueryCriteria,
} from './types';

// ============================================================================
// Image Storage System Interface
// ============================================================================

export interface ImageStorageSystem {
  // Store a new image with metadata
  storeImage(
    patientId: string,
    missionId: string,
    imageData: Buffer,
    metadata: ImageMetadata
  ): Promise<StoredImage>;
  
  // Retrieve all images for a patient
  getPatientImages(patientId: string): Promise<StoredImage[]>;
  
  // Retrieve a specific image
  getImage(imageId: string): Promise<StoredImage | null>;
  
  // Get images by mission
  getImagesByMission(missionId: string): Promise<StoredImage[]>;
}

// ============================================================================
// AI Preliminary Analyzer Interface
// ============================================================================

export interface AIPreliminaryAnalyzer {
  // Analyze an image and generate preliminary report
  analyzeImage(imageId: string, imageData: Buffer): Promise<PreliminaryReport>;
  
  // Retrieve existing preliminary report
  getReport(imageId: string): Promise<PreliminaryReport | null>;
}

// ============================================================================
// Review Workflow Manager Interface
// ============================================================================

export interface ReviewWorkflowManager {
  // Create a new review workflow when image is uploaded
  initiateReview(imageId: string): Promise<void>;
  
  // Get review context for doctor interface
  getReviewContext(imageId: string, doctorId: string): Promise<ReviewContext>;
  
  // Submit final doctor review
  submitFinalReview(
    imageId: string,
    doctorId: string,
    medicalAssessment: string
  ): Promise<FinalReview>;
  
  // Get all pending reviews for a doctor
  getPendingReviews(doctorId: string): Promise<ReviewContext[]>;
  
  // Get review status for an image
  getReviewStatus(imageId: string): Promise<ReviewStatus>;
  
  // Notify doctors of new images
  notifyAssignedDoctors(imageId: string, patientId: string): Promise<void>;
}

// ============================================================================
// AI Feedback Collector Interface
// ============================================================================

export interface AIFeedbackCollector {
  // Submit AI accuracy grade
  submitGrade(
    imageId: string,
    doctorId: string,
    rating: AccuracyRating,
    feedbackText?: string
  ): Promise<AIAccuracyGrade>;
  
  // Get all feedback for analysis
  getAllFeedback(
    startDate?: Date,
    endDate?: Date
  ): Promise<AIAccuracyGrade[]>;
  
  // Get feedback for specific image
  getFeedback(imageId: string): Promise<AIAccuracyGrade | null>;
}

// ============================================================================
// Performance Metrics Tracker Interface
// ============================================================================

export interface PerformanceMetricsTracker {
  // Calculate metrics for a time period
  calculateMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics>;
  
  // Identify common error patterns
  identifyErrorPatterns(
    feedbackList: AIAccuracyGrade[]
  ): Promise<ErrorPattern[]>;
  
  // Analyze confidence calibration
  analyzeCalibration(
    startDate: Date,
    endDate: Date
  ): Promise<CalibrationData>;
  
  // Generate performance report
  generateReport(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport>;
}

// ============================================================================
// Audit Log System Interface
// ============================================================================

export interface AuditLogSystem {
  // Log an event (immutable)
  logEvent(
    eventType: AuditEventType,
    actorId: string,
    actorType: ActorType,
    resourceId: string,
    eventData: Record<string, unknown>
  ): Promise<AuditLogEntry>;
  
  // Retrieve audit trail for a resource
  getAuditTrail(resourceId: string): Promise<AuditLogEntry[]>;
  
  // Query audit logs by criteria
  queryLogs(
    criteria: AuditQueryCriteria
  ): Promise<AuditLogEntry[]>;
}
