/**
 * Unit Tests for AIPreliminaryAnalyzer
 *
 * Tests the AI preliminary analysis functionality including:
 * - Mock AI analysis generation
 * - Report storage and retrieval
 * - Validation of confidence scores and risk assessments
 * - Edge cases and error handling
 */

/// <reference types="node" />

import { describe, it, expect, beforeEach } from 'vitest';
import { AIPreliminaryAnalyzer, AIAnalysisError } from './AIPreliminaryAnalyzer';
import type { RiskLevel } from '../types';

describe('AIPreliminaryAnalyzer', () => {
  let analyzer: AIPreliminaryAnalyzer;
  
  beforeEach(() => {
    // Create fresh instance and clear storage before each test
    analyzer = new AIPreliminaryAnalyzer();
    analyzer.clearAll();
  });
  
  describe('analyzeImage', () => {
    it('should generate a preliminary report with all required fields', async () => {
      const imageId = 'test-image-123';
      const imageData = Buffer.from('fake-image-data');
      
      const report = await analyzer.analyzeImage(imageId, imageData);
      
      expect(report).toBeDefined();
      expect(report.reportId).toBeTruthy();
      expect(report.imageId).toBe(imageId);
      expect(report.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(report.confidenceScore).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(report.riskAssessment);
      expect(report.findings).toBeInstanceOf(Array);
      expect(report.findings.length).toBeGreaterThanOrEqual(2);
      expect(report.findings.length).toBeLessThanOrEqual(4);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.modelVersion).toBe('mock-v1.0');
    });
    
    it('should generate confidence scores in the range 0.6-0.95', async () => {
      const imageId = 'test-image-confidence';
      const imageData = Buffer.from('fake-image-data');
      
      // Run multiple times to test the range
      const scores: number[] = [];
      for (let i = 0; i < 20; i++) {
        analyzer.clearAll();
        const report = await analyzer.analyzeImage(`${imageId}-${i}`, imageData);
        scores.push(report.confidenceScore);
      }
      
      // All scores should be in range
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0.6);
        expect(score).toBeLessThanOrEqual(0.95);
      });
      
      // Should have some variation
      const uniqueScores = new Set(scores);
      expect(uniqueScores.size).toBeGreaterThan(1);
    });
    
    it('should generate 2-4 findings', async () => {
      const imageId = 'test-image-findings';
      const imageData = Buffer.from('fake-image-data');
      
      // Run multiple times to test the range
      const findingCounts: number[] = [];
      for (let i = 0; i < 20; i++) {
        analyzer.clearAll();
        const report = await analyzer.analyzeImage(`${imageId}-${i}`, imageData);
        findingCounts.push(report.findings.length);
      }
      
      // All counts should be in range
      findingCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(2);
        expect(count).toBeLessThanOrEqual(4);
      });
    });
    
    it('should generate realistic wound findings', async () => {
      const imageId = 'test-image-realistic';
      const imageData = Buffer.from('fake-image-data');
      
      const report = await analyzer.analyzeImage(imageId, imageData);
      
      // Each finding should be a non-empty string
      report.findings.forEach((finding: string) => {
        expect(typeof finding).toBe('string');
        expect(finding.length).toBeGreaterThan(0);
      });
    });
    
    it('should throw error if imageId is missing', async () => {
      const imageData = Buffer.from('fake-image-data');
      
      await expect(
        analyzer.analyzeImage('', imageData)
      ).rejects.toThrow(AIAnalysisError);
      
      await expect(
        analyzer.analyzeImage('', imageData)
      ).rejects.toThrow('Image ID is required');
    });
    
    it('should throw error if imageData is empty', async () => {
      const imageId = 'test-image-empty';
      
      await expect(
        analyzer.analyzeImage(imageId, Buffer.from([]))
      ).rejects.toThrow(AIAnalysisError);
      
      await expect(
        analyzer.analyzeImage(imageId, Buffer.from([]))
      ).rejects.toThrow('Image data cannot be empty');
    });
    
    it('should throw error if report already exists for image', async () => {
      const imageId = 'test-image-duplicate';
      const imageData = Buffer.from('fake-image-data');
      
      // First analysis should succeed
      await analyzer.analyzeImage(imageId, imageData);
      
      // Second analysis should fail
      await expect(
        analyzer.analyzeImage(imageId, imageData)
      ).rejects.toThrow(AIAnalysisError);
      
      await expect(
        analyzer.analyzeImage(imageId, imageData)
      ).rejects.toThrow('Preliminary report already exists');
    });
    
    it('should store the report for later retrieval', async () => {
      const imageId = 'test-image-storage';
      const imageData = Buffer.from('fake-image-data');
      
      const report = await analyzer.analyzeImage(imageId, imageData);
      const retrieved = await analyzer.getReport(imageId);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved!.reportId).toBe(report.reportId);
      expect(retrieved!.imageId).toBe(report.imageId);
      expect(retrieved!.confidenceScore).toBe(report.confidenceScore);
      expect(retrieved!.riskAssessment).toBe(report.riskAssessment);
      expect(retrieved!.findings).toEqual(report.findings);
      expect(retrieved!.modelVersion).toBe(report.modelVersion);
    });
  });
  
  describe('getReport', () => {
    it('should return null for non-existent image', async () => {
      const report = await analyzer.getReport('non-existent-image');
      
      expect(report).toBeNull();
    });
    
    it('should retrieve existing report', async () => {
      const imageId = 'test-image-retrieve';
      const imageData = Buffer.from('fake-image-data');
      
      const original = await analyzer.analyzeImage(imageId, imageData);
      const retrieved = await analyzer.getReport(imageId);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved!.reportId).toBe(original.reportId);
      expect(retrieved!.imageId).toBe(original.imageId);
    });
    
    it('should deserialize dates correctly', async () => {
      const imageId = 'test-image-dates';
      const imageData = Buffer.from('fake-image-data');
      
      await analyzer.analyzeImage(imageId, imageData);
      const retrieved = await analyzer.getReport(imageId);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved!.generatedAt).toBeInstanceOf(Date);
    });
  });
  
  describe('validation', () => {
    it('should validate confidence score range', async () => {
      const imageId = 'test-image-validation';
      const imageData = Buffer.from('fake-image-data');
      
      const report = await analyzer.analyzeImage(imageId, imageData);
      
      // Confidence should be in valid range
      expect(report.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(report.confidenceScore).toBeLessThanOrEqual(1);
    });
    
    it('should validate risk assessment enum', async () => {
      const imageId = 'test-image-risk';
      const imageData = Buffer.from('fake-image-data');
      
      const report = await analyzer.analyzeImage(imageId, imageData);
      
      const validRiskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
      expect(validRiskLevels).toContain(report.riskAssessment);
    });
  });
  
  describe('clearAll', () => {
    it('should clear all stored reports', async () => {
      const imageId1 = 'test-image-clear-1';
      const imageId2 = 'test-image-clear-2';
      const imageData = Buffer.from('fake-image-data');
      
      // Create two reports
      await analyzer.analyzeImage(imageId1, imageData);
      await analyzer.analyzeImage(imageId2, imageData);
      
      // Verify they exist
      expect(await analyzer.getReport(imageId1)).not.toBeNull();
      expect(await analyzer.getReport(imageId2)).not.toBeNull();
      
      // Clear all
      analyzer.clearAll();
      
      // Verify they're gone
      expect(await analyzer.getReport(imageId1)).toBeNull();
      expect(await analyzer.getReport(imageId2)).toBeNull();
    });
  });
  
  describe('mock AI behavior', () => {
    it('should generate varied risk assessments', async () => {
      const imageData = Buffer.from('fake-image-data');
      const riskLevels = new Set<RiskLevel>();
      
      // Generate multiple reports
      for (let i = 0; i < 30; i++) {
        analyzer.clearAll();
        const report = await analyzer.analyzeImage(`test-image-${i}`, imageData);
        riskLevels.add(report.riskAssessment);
      }
      
      // Should have some variety (at least 2 different risk levels)
      expect(riskLevels.size).toBeGreaterThanOrEqual(2);
    });
    
    it('should generate varied findings', async () => {
      const imageData = Buffer.from('fake-image-data');
      const allFindings = new Set<string>();
      
      // Generate multiple reports
      for (let i = 0; i < 10; i++) {
        analyzer.clearAll();
        const report = await analyzer.analyzeImage(`test-image-${i}`, imageData);
        report.findings.forEach((f: string) => allFindings.add(f));
      }
      
      // Should have variety in findings (more than just 4 unique findings)
      expect(allFindings.size).toBeGreaterThan(4);
    });
  });
});
