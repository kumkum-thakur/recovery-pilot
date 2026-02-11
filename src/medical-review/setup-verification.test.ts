/**
 * Setup Verification Test
 * 
 * Verifies that the medical review module is properly configured with:
 * - TypeScript types and interfaces
 * - fast-check library
 * - Custom generators
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  confidenceScoreArb,
  riskLevelArb,
  accuracyRatingArb,
  imageMetadataArb,
  storedImageArb,
  preliminaryReportArb,
  finalReviewArb,
  aiAccuracyGradeArb,
  propertyTestConfig,
  propertyTestTag,
} from './test-setup';

describe('Medical Review Module - Setup Verification', () => {
  describe('fast-check library', () => {
    it('should be properly installed and importable', () => {
      expect(fc).toBeDefined();
      expect(fc.assert).toBeDefined();
      expect(fc.property).toBeDefined();
    });

    it('should generate random values', () => {
      const sample = fc.sample(fc.integer(), 10);
      expect(sample).toHaveLength(10);
      expect(sample.every(n => typeof n === 'number')).toBe(true);
    });
  });

  describe('Custom Generators', () => {
    it('should generate valid confidence scores (0-1)', () => {
      const samples = fc.sample(confidenceScoreArb, 100);
      expect(samples.every(score => score >= 0 && score <= 1)).toBe(true);
    });

    it('should generate valid risk levels', () => {
      const samples = fc.sample(riskLevelArb, 100);
      const validLevels = ['low', 'medium', 'high', 'critical'];
      expect(samples.every(level => validLevels.includes(level))).toBe(true);
    });

    it('should generate valid accuracy ratings', () => {
      const samples = fc.sample(accuracyRatingArb, 100);
      const validRatings = ['correct', 'partially_correct', 'incorrect', 'not_graded'];
      expect(samples.every(rating => validRatings.includes(rating))).toBe(true);
    });

    it('should generate valid image metadata', () => {
      const samples = fc.sample(imageMetadataArb, 10);
      samples.forEach(metadata => {
        expect(metadata.width).toBeGreaterThanOrEqual(100);
        expect(metadata.height).toBeGreaterThanOrEqual(100);
        expect(['jpeg', 'png', 'webp']).toContain(metadata.format);
        expect(metadata.fileSize).toBeGreaterThan(0);
      });
    });

    it('should generate valid stored images', () => {
      const samples = fc.sample(storedImageArb, 10);
      samples.forEach(image => {
        expect(image.imageId).toBeTruthy();
        expect(image.patientId).toBeTruthy();
        expect(image.missionId).toBeTruthy();
        expect(image.imageUrl).toBeTruthy();
        expect(image.uploadTimestamp).toBeInstanceOf(Date);
        expect(image.metadata).toBeDefined();
      });
    });

    it('should generate valid preliminary reports', () => {
      const samples = fc.sample(preliminaryReportArb, 10);
      samples.forEach(report => {
        expect(report.reportId).toBeTruthy();
        expect(report.imageId).toBeTruthy();
        expect(report.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(report.confidenceScore).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high', 'critical']).toContain(report.riskAssessment);
        expect(report.findings.length).toBeGreaterThan(0);
        expect(report.generatedAt).toBeInstanceOf(Date);
        expect(report.modelVersion).toBeTruthy();
      });
    });

    it('should generate valid final reviews', () => {
      const samples = fc.sample(finalReviewArb, 10);
      samples.forEach(review => {
        expect(review.reviewId).toBeTruthy();
        expect(review.imageId).toBeTruthy();
        expect(review.doctorId).toBeTruthy();
        expect(review.medicalAssessment.length).toBeGreaterThan(0);
        expect(review.reviewedAt).toBeInstanceOf(Date);
        expect(['pending', 'completed']).toContain(review.status);
      });
    });

    it('should generate valid AI accuracy grades', () => {
      const samples = fc.sample(aiAccuracyGradeArb, 10);
      samples.forEach(grade => {
        expect(grade.gradeId).toBeTruthy();
        expect(grade.imageId).toBeTruthy();
        expect(grade.preliminaryReportId).toBeTruthy();
        expect(grade.finalReviewId).toBeTruthy();
        expect(grade.doctorId).toBeTruthy();
        expect(['correct', 'partially_correct', 'incorrect', 'not_graded']).toContain(grade.rating);
        expect(grade.gradedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Test Configuration', () => {
    it('should have proper property test configuration', () => {
      expect(propertyTestConfig.numRuns).toBe(20); // Reduced for faster execution
      expect(propertyTestConfig.verbose).toBe(false);
    });

    it('should generate proper property test tags', () => {
      const tag = propertyTestTag(1, 'Image storage with complete metadata');
      expect(tag).toBe('Feature: medical-image-review-system, Property 1: Image storage with complete metadata');
    });
  });

  describe('Property-Based Test Example', () => {
    it('should run a simple property test', () => {
      fc.assert(
        fc.property(confidenceScoreArb, (score) => {
          // Property: confidence score should always be between 0 and 1
          return score >= 0 && score <= 1;
        }),
        { numRuns: 20 } // Reduced for faster execution
      );
    });

    it('should run property test with multiple generators', () => {
      fc.assert(
        fc.property(
          riskLevelArb,
          confidenceScoreArb,
          (riskLevel, confidenceScore) => {
            // Property: risk level and confidence score should be valid
            const validRiskLevels = ['low', 'medium', 'high', 'critical'];
            return (
              validRiskLevels.includes(riskLevel) &&
              confidenceScore >= 0 &&
              confidenceScore <= 1
            );
          }
        ),
        { numRuns: 20 } // Reduced for faster execution
      );
    });
  });
});
