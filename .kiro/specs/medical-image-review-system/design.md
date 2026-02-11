# Design Document: Medical Image Review and AI Feedback System

## Overview

The Medical Image Review and AI Feedback System implements a two-tier review workflow for patient-uploaded wound images. The system ensures patient safety through mandatory doctor oversight while simultaneously building a feedback loop to improve AI accuracy over time.

The architecture separates concerns into distinct layers:
- **Storage Layer**: Permanent image storage with metadata and associations
- **Analysis Layer**: AI preliminary analysis and doctor final review
- **Feedback Layer**: AI accuracy grading and performance tracking
- **Audit Layer**: Immutable logging for medical accountability
- **Presentation Layer**: Doctor-facing review interface

This design integrates with existing systems including the wound analysis AI, patient-doctor care relationships, role-based access control, and notification system.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          Doctor Review Interface (React/UI)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Review Workflow  │  │  AI Feedback     │  │  Performance  │ │
│  │    Manager       │  │   Collector      │  │   Metrics     │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Image Storage    │  │  AI Preliminary  │  │  Audit Log    │ │
│  │    System        │  │    Analyzer      │  │    System     │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Image Upload Flow**:
   - Patient uploads wound image → Image_Storage_System stores with metadata
   - AI_Preliminary_Analyzer generates preliminary report
   - Review_Workflow_Manager creates doctor notification
   - Audit_Log_System records all events

2. **Doctor Review Flow**:
   - Doctor accesses Doctor_Review_Interface
   - Interface fetches image + preliminary report + patient context
   - Doctor submits final review + AI accuracy grade
   - Review_Workflow_Manager stores final review
   - AI_Feedback_Collector stores accuracy feedback
   - Audit_Log_System records review events

3. **Performance Tracking Flow**:
   - AI_Feedback_Collector aggregates doctor feedback
   - Performance_Metrics_Tracker calculates accuracy metrics
   - System identifies patterns in AI errors
   - Metrics inform AI model improvements

### Integration Points

- **Existing Wound Analysis AI**: Called by AI_Preliminary_Analyzer to generate preliminary reports
- **Care Relationship System**: Used to determine which doctors are assigned to which patients
- **Role-Based Access Control**: Enforces doctor-only access to review interface
- **Notification System**: Delivers alerts to doctors when new images require review
- **Patient Records System**: Links images and reviews to patient medical records

## Components and Interfaces

### Image Storage System

**Responsibility**: Permanently store wound images with complete metadata and associations.

**Data Model**:
```typescript
interface StoredImage {
  imageId: string;              // Unique identifier (UUID)
  patientId: string;            // Patient who uploaded the image
  missionId: string;            // Associated mission/upload event
  imageUrl: string;             // Storage location (S3, etc.)
  uploadTimestamp: Date;        // When image was uploaded
  metadata: ImageMetadata;      // Additional metadata (dimensions, format, etc.)
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;               // 'jpeg', 'png', etc.
  fileSize: number;             // Bytes
  deviceInfo?: string;          // Optional device information
}
```

**Interface**:
```typescript
interface ImageStorageSystem {
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
```

### AI Preliminary Analyzer

**Responsibility**: Generate preliminary wound analysis reports using the existing AI model.

**Data Model**:
```typescript
interface PreliminaryReport {
  reportId: string;             // Unique identifier
  imageId: string;              // Associated image
  confidenceScore: number;      // 0.0 to 1.0
  riskAssessment: RiskLevel;    // 'low', 'medium', 'high', 'critical'
  findings: string[];           // Specific observations
  generatedAt: Date;            // When report was created
  modelVersion: string;         // AI model version used
}

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
```

**Interface**:
```typescript
interface AIPreliminaryAnalyzer {
  // Analyze an image and generate preliminary report
  analyzeImage(imageId: string, imageData: Buffer): Promise<PreliminaryReport>;
  
  // Retrieve existing preliminary report
  getReport(imageId: string): Promise<PreliminaryReport | null>;
}
```

### Review Workflow Manager

**Responsibility**: Orchestrate the two-tier review process and manage review state.

**Data Model**:
```typescript
interface FinalReview {
  reviewId: string;             // Unique identifier
  imageId: string;              // Associated image
  doctorId: string;             // Doctor who performed review
  medicalAssessment: string;    // Doctor's authoritative assessment
  reviewedAt: Date;             // When review was completed
  status: ReviewStatus;         // Current status
}

type ReviewStatus = 'pending' | 'completed';

interface ReviewContext {
  image: StoredImage;
  preliminaryReport: PreliminaryReport | null;
  finalReview: FinalReview | null;
  patient: PatientInfo;
}

interface PatientInfo {
  patientId: string;
  name: string;
  assignedDoctors: string[];
}
```

**Interface**:
```typescript
interface ReviewWorkflowManager {
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
```

### AI Feedback Collector

**Responsibility**: Collect and store doctor feedback on AI accuracy for model improvement.

**Data Model**:
```typescript
interface AIAccuracyGrade {
  gradeId: string;              // Unique identifier
  imageId: string;              // Associated image
  preliminaryReportId: string;  // AI report being graded
  finalReviewId: string;        // Doctor's review
  doctorId: string;             // Doctor who provided grade
  rating: AccuracyRating;       // Correct, Partially Correct, Incorrect
  feedbackText?: string;        // Optional specific feedback
  gradedAt: Date;               // When grade was submitted
}

type AccuracyRating = 'correct' | 'partially_correct' | 'incorrect' | 'not_graded';
```

**Interface**:
```typescript
interface AIFeedbackCollector {
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
```

### Performance Metrics Tracker

**Responsibility**: Analyze AI performance over time and identify improvement opportunities.

**Data Model**:
```typescript
interface PerformanceMetrics {
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

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ErrorPattern {
  pattern: string;              // Common theme in feedback
  frequency: number;            // How often this error occurs
  examples: string[];           // Example feedback texts
}

interface CalibrationData {
  // Maps confidence score ranges to actual accuracy
  ranges: Array<{
    confidenceRange: [number, number];
    actualAccuracy: number;
    sampleSize: number;
  }>;
}
```

**Interface**:
```typescript
interface PerformanceMetricsTracker {
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

interface PerformanceReport {
  metrics: PerformanceMetrics;
  trends: TrendData;
  recommendations: string[];
}

interface TrendData {
  accuracyTrend: Array<{ date: Date; accuracy: number }>;
  volumeTrend: Array<{ date: Date; reviewCount: number }>;
}
```

### Audit Log System

**Responsibility**: Maintain immutable audit trail for medical accountability and compliance.

**Data Model**:
```typescript
interface AuditLogEntry {
  logId: string;                // Unique identifier
  timestamp: Date;              // When event occurred
  eventType: AuditEventType;    // Type of event
  actorId: string;              // Who performed the action
  actorType: ActorType;         // 'patient', 'doctor', 'system'
  resourceId: string;           // What was affected (imageId, reviewId, etc.)
  eventData: Record<string, any>; // Event-specific data
  immutable: true;              // Flag indicating immutability
}

type AuditEventType = 
  | 'image_uploaded'
  | 'preliminary_report_generated'
  | 'final_review_submitted'
  | 'ai_accuracy_graded'
  | 'review_accessed';

type ActorType = 'patient' | 'doctor' | 'system' | 'admin';
```

**Interface**:
```typescript
interface AuditLogSystem {
  // Log an event (immutable)
  logEvent(
    eventType: AuditEventType,
    actorId: string,
    actorType: ActorType,
    resourceId: string,
    eventData: Record<string, any>
  ): Promise<AuditLogEntry>;
  
  // Retrieve audit trail for a resource
  getAuditTrail(resourceId: string): Promise<AuditLogEntry[]>;
  
  // Query audit logs by criteria
  queryLogs(
    criteria: AuditQueryCriteria
  ): Promise<AuditLogEntry[]>;
}

interface AuditQueryCriteria {
  startDate?: Date;
  endDate?: Date;
  eventType?: AuditEventType;
  actorId?: string;
  resourceId?: string;
}
```

### Doctor Review Interface

**Responsibility**: Provide doctors with an efficient interface to review images and submit assessments.

**UI Components**:

1. **Review Dashboard**:
   - List of pending reviews with patient names and upload times
   - Count of pending reviews
   - Filter by review status (pending, completed)
   - Sort by upload time, patient name, risk level

2. **Image Review View**:
   - Large image display with zoom capability
   - AI preliminary report panel showing:
     - Confidence score (visual indicator)
     - Risk assessment (color-coded)
     - Specific findings (bulleted list)
     - Disclaimer: "Preliminary AI analysis - not authoritative"
   - Doctor review form:
     - Medical assessment text area
     - Submit button with acknowledgment checkbox
   - AI accuracy grading section:
     - Rating buttons (Correct, Partially Correct, Incorrect, Skip)
     - Conditional feedback text area (shown for Partially Correct/Incorrect)

3. **Patient History View**:
   - Timeline of all images for a patient
   - Each image shows thumbnail, date, and review status
   - Click to view full review details

**Interface (API endpoints)**:
```typescript
interface DoctorReviewAPI {
  // Get pending reviews for logged-in doctor
  GET /api/doctor/reviews/pending
  Response: ReviewContext[]
  
  // Get review context for specific image
  GET /api/doctor/reviews/:imageId
  Response: ReviewContext
  
  // Submit final review
  POST /api/doctor/reviews/:imageId/submit
  Body: { medicalAssessment: string }
  Response: FinalReview
  
  // Submit AI accuracy grade
  POST /api/doctor/reviews/:imageId/grade
  Body: { rating: AccuracyRating, feedbackText?: string }
  Response: AIAccuracyGrade
  
  // Get patient image history
  GET /api/doctor/patients/:patientId/images
  Response: ReviewContext[]
}
```

## Data Models

### Database Schema

**images table**:
```sql
CREATE TABLE images (
  image_id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(patient_id),
  mission_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  upload_timestamp TIMESTAMP NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  format VARCHAR(10) NOT NULL,
  file_size INTEGER NOT NULL,
  device_info TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_patient_id (patient_id),
  INDEX idx_mission_id (mission_id),
  INDEX idx_upload_timestamp (upload_timestamp)
);
```

**preliminary_reports table**:
```sql
CREATE TABLE preliminary_reports (
  report_id UUID PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES images(image_id),
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  risk_assessment VARCHAR(20) NOT NULL CHECK (risk_assessment IN ('low', 'medium', 'high', 'critical')),
  findings JSONB NOT NULL,
  generated_at TIMESTAMP NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_image_id (image_id),
  INDEX idx_generated_at (generated_at)
);
```

**final_reviews table**:
```sql
CREATE TABLE final_reviews (
  review_id UUID PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES images(image_id),
  doctor_id UUID NOT NULL REFERENCES users(user_id),
  medical_assessment TEXT NOT NULL,
  reviewed_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (image_id),
  INDEX idx_image_id (image_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_reviewed_at (reviewed_at)
);
```

**ai_accuracy_grades table**:
```sql
CREATE TABLE ai_accuracy_grades (
  grade_id UUID PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES images(image_id),
  preliminary_report_id UUID NOT NULL REFERENCES preliminary_reports(report_id),
  final_review_id UUID NOT NULL REFERENCES final_reviews(review_id),
  doctor_id UUID NOT NULL REFERENCES users(user_id),
  rating VARCHAR(20) NOT NULL CHECK (rating IN ('correct', 'partially_correct', 'incorrect', 'not_graded')),
  feedback_text TEXT,
  graded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (image_id),
  INDEX idx_image_id (image_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_rating (rating),
  INDEX idx_graded_at (graded_at)
);
```

**audit_logs table**:
```sql
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL,
  actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('patient', 'doctor', 'system', 'admin')),
  resource_id UUID NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_timestamp (timestamp),
  INDEX idx_event_type (event_type),
  INDEX idx_actor_id (actor_id),
  INDEX idx_resource_id (resource_id)
);
```

### State Transitions

**Image Review Lifecycle**:
```
[Image Uploaded] 
    ↓
[AI Analysis Pending]
    ↓
[AI Analysis Complete] → [Doctor Review Pending]
    ↓
[Doctor Review Submitted] → [AI Grading Pending]
    ↓
[AI Graded] → [Review Complete]
```

**Review Status States**:
- `pending`: Image uploaded, awaiting doctor review
- `completed`: Doctor has submitted final review

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated:

**Storage and Association Properties (1.1-1.5, 5.5, 7.3)**:
- Multiple properties test that various entities are "stored with associations" (images with patients, reviews with images, feedback with reports)
- These can be consolidated into properties about referential integrity and association preservation

**Timestamp Recording Properties (1.3, 5.3, 7.1)**:
- Multiple properties test that timestamps are recorded for different events
- These are all testing the same pattern: "when X happens, record timestamp"
- Can be consolidated into a single property about timestamp recording for all events

**UI Rendering Properties (2.2, 2.3, 4.2-4.6)**:
- Multiple properties test that UI displays contain specific elements
- These can be consolidated into properties about complete data rendering

**Audit Logging Properties (9.1-9.4)**:
- All test the same pattern: "when event X happens, create audit log"
- Can be consolidated into a single property about audit log creation for all events

**Metric Calculation Properties (8.1-8.3)**:
- All three test percentage calculations for different rating types
- Can be consolidated into a single property about accurate metric calculation

**Doctor ID Recording Properties (5.2, 7.4, 12.3)**:
- Multiple properties test that doctor IDs are recorded in different contexts
- These are redundant - if doctor ID is recorded in one place, it's the same mechanism

After reflection, I'll focus on unique, high-value properties that provide comprehensive coverage without redundancy.

### Correctness Properties

Property 1: Image storage with complete metadata
*For any* uploaded wound image, storing it should result in a record with a unique ID, patient association, mission association, and upload timestamp, and retrieving it should return all this metadata intact.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

Property 2: Patient image retrieval completeness and ordering
*For any* patient with multiple uploaded images, retrieving their images should return all images associated with that patient, ordered by timestamp with most recent first.
**Validates: Requirements 1.5, 2.4**

Property 3: Doctor access control
*For any* doctor and any set of patient images, the doctor should only be able to access images from patients assigned to them, and should not be able to access images from unassigned patients.
**Validates: Requirements 2.1**

Property 4: AI preliminary report generation
*For any* uploaded wound image, the AI analysis should generate a preliminary report containing a confidence score between 0 and 1, a valid risk assessment level, and non-empty findings.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 5: Preliminary report storage and association
*For any* generated preliminary report, it should be stored and associated with the correct image, and retrieving the image context should include the preliminary report.
**Validates: Requirements 3.5**

Property 6: Review interface data completeness
*For any* image with a preliminary report, the doctor review interface rendering should include the image, the preliminary report (with confidence score, risk assessment, and findings), and appropriate disclaimers.
**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**

Property 7: Final review submission and association
*For any* doctor submitting a final review for an image, the review should be stored with the doctor's ID, a timestamp, the medical assessment text, and associations to the image and preliminary report.
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

Property 8: Review status transition
*For any* image, after a doctor submits a final review, the image's review status should transition from pending to completed.
**Validates: Requirements 5.4**

Property 9: Final review retrieval
*For any* image with a completed final review, retrieving the review context should include the final review, and the doctor interface should display it.
**Validates: Requirements 5.6**

Property 10: AI accuracy grading with conditional feedback
*For any* final review submission, the system should accept an AI accuracy grade (correct, partially_correct, incorrect, or not_graded), and when the grade is partially_correct or incorrect, it should accept and store optional feedback text.
**Validates: Requirements 6.3, 6.4, 6.5**

Property 11: Feedback storage with complete associations
*For any* submitted AI accuracy grade, it should be stored with a timestamp, doctor ID, and associations to the image, preliminary report, and final review.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

Property 12: Feedback immutability
*For any* stored AI accuracy grade, attempts to modify or delete it should fail, ensuring immutability.
**Validates: Requirements 7.5**

Property 13: Accuracy metric calculation
*For any* set of AI accuracy grades over a time period, calculating metrics should produce correct percentages for each rating type (correct, partially_correct, incorrect) that sum to 100% (excluding not_graded).
**Validates: Requirements 8.1, 8.2, 8.3**

Property 14: Confidence calibration tracking
*For any* set of preliminary reports with corresponding accuracy grades, the system should correctly track confidence scores alongside accuracy ratings for calibration analysis.
**Validates: Requirements 8.5**

Property 15: Performance report generation
*For any* time period with feedback data, generating a performance report should include metrics, trends, and be based on the actual feedback data for that period.
**Validates: Requirements 8.6**

Property 16: Audit log creation for all events
*For any* system event (image upload, report generation, review submission, grade submission), an immutable audit log entry should be created with the event type, actor ID, actor type, resource ID, timestamp, and event data.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

Property 17: Audit log retrieval and ordering
*For any* image, retrieving its audit trail should return all log entries associated with that image in chronological order.
**Validates: Requirements 9.5**

Property 18: Audit log immutability
*For any* audit log entry, attempts to modify or delete it should fail, ensuring the audit trail cannot be tampered with.
**Validates: Requirements 9.6**

Property 19: Doctor notification creation
*For any* uploaded image, the system should identify all doctors assigned to that patient and create a notification for each doctor containing the patient ID and upload timestamp.
**Validates: Requirements 10.1, 10.2, 10.3**

Property 20: Notification resolution on review completion
*For any* image with an associated notification, when a doctor completes a final review, the notification should be marked as resolved.
**Validates: Requirements 10.5**

Property 21: Review status display accuracy
*For any* set of images with mixed review statuses, the doctor interface should correctly indicate which images have final reviews and which are pending.
**Validates: Requirements 11.1, 11.2, 11.5**

Property 22: Review status filtering
*For any* doctor with images in various review states, filtering by review status should return only images matching the filter criteria.
**Validates: Requirements 11.3**

Property 23: Pending review count accuracy
*For any* doctor, the dashboard should display a count of pending reviews that matches the actual number of images assigned to that doctor without final reviews.
**Validates: Requirements 11.4**

Property 24: AI report disclaimer presence
*For any* preliminary report displayed to doctors, it should include clear labeling as non-authoritative and preliminary.
**Validates: Requirements 12.1, 12.4**

Property 25: Doctor accountability recording
*For any* final review submission, the system should record the doctor's ID as the medically accountable party.
**Validates: Requirements 12.3**

Property 26: Patient view shows only final reviews
*For any* patient viewing their results, the system should display only the doctor's final review and not the AI preliminary report.
**Validates: Requirements 12.5**

## Error Handling

### AI Analysis Failures

**Scenario**: AI preliminary analyzer fails to process an image

**Handling**:
1. Review_Workflow_Manager catches the failure
2. Image is flagged with `ai_analysis_failed: true`
3. Doctor notification is created with high priority
4. Doctor interface shows "AI analysis unavailable" message
5. Doctor can still submit final review without AI input
6. Audit log records the failure event

**Implementation**:
```typescript
async function handleImageUpload(imageData: Buffer, patientId: string, missionId: string) {
  try {
    const storedImage = await imageStorage.storeImage(patientId, missionId, imageData, metadata);
    
    try {
      const preliminaryReport = await aiAnalyzer.analyzeImage(storedImage.imageId, imageData);
      await reviewWorkflow.storePreliminaryReport(preliminaryReport);
    } catch (aiError) {
      // AI analysis failed - flag for immediate doctor review
      await reviewWorkflow.flagForImmediateReview(storedImage.imageId, 'ai_analysis_failed');
      await auditLog.logEvent('ai_analysis_failed', 'system', 'system', storedImage.imageId, {
        error: aiError.message
      });
    }
    
    await reviewWorkflow.notifyAssignedDoctors(storedImage.imageId, patientId);
  } catch (storageError) {
    // Critical failure - escalate
    throw new ImageUploadError('Failed to store image', storageError);
  }
}
```

### Missing Doctor Assignments

**Scenario**: Patient uploads image but has no assigned doctors

**Handling**:
1. Image is stored successfully
2. AI analysis proceeds normally
3. System creates admin notification for unassigned patient
4. Image is flagged as requiring doctor assignment
5. Once doctor is assigned, notification is created

### Invalid Review Submissions

**Scenario**: Doctor attempts to submit review with missing required fields

**Handling**:
1. Validate medical assessment is non-empty
2. Return validation error with specific field requirements
3. Do not create partial review record
4. Audit log records validation failure

**Validation Rules**:
```typescript
interface ReviewValidation {
  medicalAssessment: {
    required: true,
    minLength: 10,
    maxLength: 10000
  },
  doctorId: {
    required: true,
    mustBeAssignedToPatient: true
  },
  imageId: {
    required: true,
    mustExist: true,
    mustNotHaveExistingReview: true
  }
}
```

### Database Failures

**Scenario**: Database connection fails during critical operation

**Handling**:
1. Use database transactions for multi-step operations
2. Rollback on failure to maintain consistency
3. Retry with exponential backoff for transient failures
4. Log failure to audit system
5. Return user-friendly error message
6. Alert system administrators for persistent failures

### Concurrent Review Submissions

**Scenario**: Two doctors attempt to review the same image simultaneously

**Handling**:
1. Use database unique constraint on `final_reviews.image_id`
2. First submission succeeds
3. Second submission fails with conflict error
4. Second doctor sees message: "This image has already been reviewed by Dr. [Name]"
5. Second doctor can view the existing review

## Testing Strategy

### Dual Testing Approach

This system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and error conditions
- Empty state handling (no images, no assigned patients)
- AI analysis failure scenarios
- Missing doctor assignments
- Invalid input validation
- Concurrent access scenarios
- Database transaction rollbacks

**Property-Based Tests**: Verify universal properties across all inputs
- All correctness properties listed above
- Minimum 100 iterations per property test
- Use random data generation for images, reports, reviews, and feedback
- Each test tagged with: **Feature: medical-image-review-system, Property {number}: {property_text}**

### Property-Based Testing Library

**For TypeScript/JavaScript**: Use `fast-check` library
- Excellent TypeScript support
- Rich set of built-in generators
- Shrinking support for minimal failing examples

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: medical-image-review-system, Property 1: Image storage with complete metadata
test('Property 1: Image storage preserves all metadata', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(), // patientId
      fc.uuid(), // missionId
      fc.uint8Array({ minLength: 100, maxLength: 1000 }), // imageData
      async (patientId, missionId, imageData) => {
        const metadata = { width: 800, height: 600, format: 'jpeg', fileSize: imageData.length };
        
        const stored = await imageStorage.storeImage(patientId, missionId, Buffer.from(imageData), metadata);
        const retrieved = await imageStorage.getImage(stored.imageId);
        
        expect(retrieved).not.toBeNull();
        expect(retrieved!.patientId).toBe(patientId);
        expect(retrieved!.missionId).toBe(missionId);
        expect(retrieved!.uploadTimestamp).toBeInstanceOf(Date);
        expect(retrieved!.imageId).toBeTruthy();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Data Generators

**Custom Generators for Domain Objects**:
```typescript
// Generator for valid confidence scores
const confidenceScoreArb = fc.double({ min: 0, max: 1, noNaN: true });

// Generator for risk levels
const riskLevelArb = fc.constantFrom('low', 'medium', 'high', 'critical');

// Generator for accuracy ratings
const accuracyRatingArb = fc.constantFrom('correct', 'partially_correct', 'incorrect', 'not_graded');

// Generator for preliminary reports
const preliminaryReportArb = fc.record({
  reportId: fc.uuid(),
  imageId: fc.uuid(),
  confidenceScore: confidenceScoreArb,
  riskAssessment: riskLevelArb,
  findings: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
  generatedAt: fc.date(),
  modelVersion: fc.constantFrom('v1.0', 'v1.1', 'v2.0')
});
```

### Integration Testing

**Test Scenarios**:
1. **End-to-End Review Workflow**:
   - Upload image → AI analysis → Doctor notification → Doctor review → AI grading → Audit trail verification

2. **Multi-Doctor Scenarios**:
   - Patient with multiple assigned doctors
   - Verify all doctors receive notifications
   - Verify only one doctor can submit final review

3. **Performance Metrics Pipeline**:
   - Generate multiple reviews with grades
   - Calculate metrics
   - Verify accuracy of calculations
   - Test trend analysis

4. **Access Control**:
   - Verify doctors can only access their patients' images
   - Verify patients can only see their own results
   - Verify admins can access all data

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 26 correctness properties implemented
- **Integration Test Coverage**: All major workflows covered
- **Edge Case Coverage**: All error handling paths tested

### Continuous Testing

- Run unit tests on every commit
- Run property tests (with reduced iterations) on every commit
- Run full property test suite (100+ iterations) nightly
- Run integration tests before deployment
- Monitor property test failures for AI model degradation
