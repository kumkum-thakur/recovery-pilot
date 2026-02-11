/**
 * Test Setup and Custom Generators for Medical Image Review System
 * 
 * This file contains fast-check custom generators for domain objects
 * and test utilities for property-based testing.
 */

import fc from 'fast-check';
import {
  RiskLevel,
  AccuracyRating,
  PreliminaryReport,
  ImageMetadata,
  StoredImage,
  AIAccuracyGrade,
  FinalReview,
} from './types';

// ============================================================================
// Custom Arbitraries (Generators)
// ============================================================================

/**
 * Generator for valid confidence scores (0.0 to 1.0)
 */
export const confidenceScoreArb = fc.double({ min: 0, max: 1, noNaN: true });

/**
 * Generator for risk levels
 */
export const riskLevelArb = fc.constantFrom<RiskLevel>(
  'low',
  'medium',
  'high',
  'critical'
);

/**
 * Generator for accuracy ratings
 */
export const accuracyRatingArb = fc.constantFrom<AccuracyRating>(
  'correct',
  'partially_correct',
  'incorrect',
  'not_graded'
);

/**
 * Generator for image metadata
 */
export const imageMetadataArb = fc.record({
  width: fc.integer({ min: 100, max: 4000 }),
  height: fc.integer({ min: 100, max: 4000 }),
  format: fc.constantFrom('jpeg', 'png', 'webp'),
  fileSize: fc.integer({ min: 1000, max: 10000000 }),
  deviceInfo: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
}) as fc.Arbitrary<ImageMetadata>;

/**
 * Generator for stored images
 */
export const storedImageArb = fc.record({
  imageId: fc.uuid(),
  patientId: fc.uuid(),
  missionId: fc.uuid(),
  imageUrl: fc.webUrl(),
  uploadTimestamp: fc.date(),
  metadata: imageMetadataArb,
}) as fc.Arbitrary<StoredImage>;

/**
 * Generator for preliminary reports
 */
export const preliminaryReportArb = fc.record({
  reportId: fc.uuid(),
  imageId: fc.uuid(),
  confidenceScore: confidenceScoreArb,
  riskAssessment: riskLevelArb,
  findings: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
  generatedAt: fc.date(),
  modelVersion: fc.constantFrom('v1.0', 'v1.1', 'v2.0', 'v2.1'),
}) as fc.Arbitrary<PreliminaryReport>;

/**
 * Generator for final reviews
 */
export const finalReviewArb = fc.record({
  reviewId: fc.uuid(),
  imageId: fc.uuid(),
  doctorId: fc.uuid(),
  medicalAssessment: fc.string({ minLength: 50, maxLength: 500 }),
  reviewedAt: fc.date(),
  status: fc.constantFrom('pending', 'completed'),
}) as fc.Arbitrary<FinalReview>;

/**
 * Generator for AI accuracy grades
 */
export const aiAccuracyGradeArb = fc.record({
  gradeId: fc.uuid(),
  imageId: fc.uuid(),
  preliminaryReportId: fc.uuid(),
  finalReviewId: fc.uuid(),
  doctorId: fc.uuid(),
  rating: accuracyRatingArb,
  feedbackText: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
  gradedAt: fc.date(),
}) as fc.Arbitrary<AIAccuracyGrade>;

/**
 * Generator for image data (Buffer)
 */
export const imageDataArb = fc.uint8Array({ minLength: 100, maxLength: 1000 }).map(
  (arr) => Buffer.from(arr)
);

/**
 * Generator for medical assessment text
 */
export const medicalAssessmentArb = fc.string({ minLength: 50, maxLength: 1000 });

/**
 * Generator for feedback text (conditional on rating)
 */
export const feedbackTextArb = (rating: AccuracyRating) => {
  if (rating === 'partially_correct' || rating === 'incorrect') {
    return fc.string({ minLength: 10, maxLength: 200 });
  }
  return fc.constant(undefined);
};

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Default property test configuration
 */
export const propertyTestConfig = {
  numRuns: 100,
  verbose: false,
};

/**
 * Helper to create a test tag for property tests
 */
export function propertyTestTag(propertyNumber: number, propertyName: string): string {
  return `Feature: medical-image-review-system, Property ${propertyNumber}: ${propertyName}`;
}

/**
 * Helper to generate a unique UUID (for tests that need real UUIDs)
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Helper to create a date range for testing
 */
export const dateRangeArb = fc.tuple(fc.date(), fc.date()).map(([d1, d2]) => {
  const startDate = d1 < d2 ? d1 : d2;
  const endDate = d1 < d2 ? d2 : d1;
  return { startDate, endDate };
});
