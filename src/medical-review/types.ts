/**
 * Shared Type Definitions for Medical Image Review and AI Feedback System
 * 
 * This file contains all TypeScript interfaces and types from the design document.
 */

// ============================================================================
// Image Storage System Types
// ============================================================================

export interface StoredImage {
  imageId: string;              // Unique identifier (UUID)
  patientId: string;            // Patient who uploaded the image
  missionId: string;            // Associated mission/upload event
  imageUrl: string;             // Storage location (S3, etc.)
  uploadTimestamp: Date;        // When image was uploaded
  metadata: ImageMetadata;      // Additional metadata (dimensions, format, etc.)
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;               // 'jpeg', 'png', etc.
  fileSize: number;             // Bytes
  deviceInfo?: string;          // Optional device information
}

// ============================================================================
// AI Preliminary Analyzer Types
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PreliminaryReport {
  reportId: string;             // Unique identifier
  imageId: string;              // Associated image
  confidenceScore: number;      // 0.0 to 1.0
  riskAssessment: RiskLevel;    // 'low', 'medium', 'high', 'critical'
  findings: string[];           // Specific observations
  generatedAt: Date;            // When report was created
  modelVersion: string;         // AI model version used
}

// ============================================================================
// Review Workflow Manager Types
// ============================================================================

export type ReviewStatus = 'pending' | 'completed';

export interface FinalReview {
  reviewId: string;             // Unique identifier
  imageId: string;              // Associated image
  doctorId: string;             // Doctor who performed review
  medicalAssessment: string;    // Doctor's authoritative assessment
  reviewedAt: Date;             // When review was completed
  status: ReviewStatus;         // Current status
}

export interface ReviewContext {
  image: StoredImage;
  preliminaryReport: PreliminaryReport | null;
  finalReview: FinalReview | null;
  patient: PatientInfo;
}

export interface PatientInfo {
  patientId: string;
  name: string;
  assignedDoctors: string[];
}

// ============================================================================
// AI Feedback Collector Types
// ============================================================================

export type AccuracyRating = 'correct' | 'partially_correct' | 'incorrect' | 'not_graded';

export interface AIAccuracyGrade {
  gradeId: string;              // Unique identifier
  imageId: string;              // Associated image
  preliminaryReportId: string;  // AI report being graded
  finalReviewId: string;        // Doctor's review
  doctorId: string;             // Doctor who provided grade
  rating: AccuracyRating;       // Correct, Partially Correct, Incorrect
  feedbackText?: string;        // Optional specific feedback
  gradedAt: Date;               // When grade was submitted
}

// ============================================================================
// Performance Metrics Tracker Types
// ============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ErrorPattern {
  pattern: string;              // Common theme in feedback
  frequency: number;            // How often this error occurs
  examples: string[];           // Example feedback texts
}

export interface CalibrationData {
  // Maps confidence score ranges to actual accuracy
  ranges: Array<{
    confidenceRange: [number, number];
    actualAccuracy: number;
    sampleSize: number;
  }>;
}

export interface PerformanceMetrics {
  timeRange: DateRange;
  totalReviews: number;
  correctCount: number;
  partiallyCorrectCount: number;
  incorrectCount: number;
  notGradedCount: number;
  accuracyPercentage: number;   // (correct + 0.5 * partially_correct) / total
  commonErrors: ErrorPattern[];
  confidenceCalibration: CalibrationData;
}

export interface TrendData {
  accuracyTrend: Array<{ date: Date; accuracy: number }>;
  volumeTrend: Array<{ date: Date; reviewCount: number }>;
}

export interface PerformanceReport {
  metrics: PerformanceMetrics;
  trends: TrendData;
  recommendations: string[];
}

// ============================================================================
// Audit Log System Types
// ============================================================================

export type AuditEventType = 
  | 'image_uploaded'
  | 'preliminary_report_generated'
  | 'final_review_submitted'
  | 'ai_accuracy_graded'
  | 'review_accessed';

export type ActorType = 'patient' | 'doctor' | 'system' | 'admin';

export interface AuditLogEntry {
  logId: string;                // Unique identifier
  timestamp: Date;              // When event occurred
  eventType: AuditEventType;    // Type of event
  actorId: string;              // Who performed the action
  actorType: ActorType;         // 'patient', 'doctor', 'system'
  resourceId: string;           // What was affected (imageId, reviewId, etc.)
  eventData: Record<string, any>; // Event-specific data
  immutable: true;              // Flag indicating immutability
}

export interface AuditQueryCriteria {
  startDate?: Date;
  endDate?: Date;
  eventType?: AuditEventType;
  actorId?: string;
  resourceId?: string;
}
