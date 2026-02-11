/**
 * AIPreliminaryAnalyzer - AI-powered preliminary wound image analysis
 * 
 * Provides preliminary analysis of wound images using AI:
 * - Generate preliminary reports with confidence scores and risk assessments
 * - Store and retrieve preliminary reports
 * - Validate confidence scores and risk assessments
 * 
 * MVP VERSION: Uses MOCK AI for realistic random analysis
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AIPreliminaryAnalyzer as IAIPreliminaryAnalyzer,
  PreliminaryReport,
  RiskLevel,
} from '../interfaces';

/**
 * Storage key for preliminary reports in LocalStorage
 */
const STORAGE_KEY = 'medical_review_preliminary_reports';

/**
 * Error class for AI analysis-related errors
 */
export class AIAnalysisError extends Error {
  cause?: unknown;
  
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AIAnalysisError';
    this.cause = cause;
  }
}

/**
 * Mock AI findings templates for realistic wound analysis
 */
const MOCK_FINDINGS_TEMPLATES = [
  'Wound edges appear clean with minimal inflammation',
  'Moderate granulation tissue present, indicating healing progress',
  'Slight erythema observed around wound perimeter',
  'Wound bed shows healthy pink tissue with good vascularization',
  'Minor exudate present, consistent with normal healing',
  'Epithelialization progressing from wound margins',
  'No signs of infection or necrotic tissue detected',
  'Wound size approximately {size} cm, showing reduction from previous assessment',
  'Surrounding skin appears intact with no maceration',
  'Mild edema noted in surrounding tissue',
  'Wound depth appears superficial to moderate',
  'Good tissue perfusion indicated by color and temperature',
];

/**
 * Implementation of AIPreliminaryAnalyzer using LocalStorage
 * 
 * MVP VERSION: Uses mock AI to generate realistic random analysis
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export class AIPreliminaryAnalyzer implements IAIPreliminaryAnalyzer {
  /**
   * Analyze an image and generate preliminary report
   * 
   * MVP VERSION: Generates realistic random analysis instead of calling real AI
   * 
   * @param imageId - ID of the image to analyze
   * @param imageData - Raw image data as Buffer (not used in mock version)
   * @returns Preliminary report with confidence score, risk assessment, and findings
   * @throws AIAnalysisError if analysis fails
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async analyzeImage(imageId: string, imageData: Buffer): Promise<PreliminaryReport> {
    try {
      // Validate inputs
      if (!imageId) {
        throw new AIAnalysisError('Image ID is required');
      }
      
      if (!imageData || imageData.length === 0) {
        throw new AIAnalysisError('Image data cannot be empty');
      }
      
      // Check if report already exists
      const existingReport = await this.getReport(imageId);
      if (existingReport) {
        throw new AIAnalysisError(`Preliminary report already exists for image "${imageId}"`);
      }
      
      // Generate mock AI analysis
      const confidenceScore = this.generateMockConfidenceScore();
      const riskAssessment = this.generateMockRiskAssessment(confidenceScore);
      const findings = this.generateMockFindings();
      
      // Validate generated data
      this.validateConfidenceScore(confidenceScore);
      this.validateRiskAssessment(riskAssessment);
      
      // Create preliminary report
      const report: PreliminaryReport = {
        reportId: uuidv4(),
        imageId,
        confidenceScore,
        riskAssessment,
        findings,
        generatedAt: new Date(),
        modelVersion: 'mock-v1.0',
      };
      
      // Store report
      this.storeReport(report);
      
      return report;
    } catch (error) {
      if (error instanceof AIAnalysisError) {
        throw error;
      }
      
      throw new AIAnalysisError(
        'Failed to analyze image',
        error
      );
    }
  }
  
  /**
   * Retrieve existing preliminary report
   * 
   * @param imageId - Image ID
   * @returns Preliminary report or null if not found
   * @throws AIAnalysisError if retrieval fails
   * 
   * Requirements: 3.5
   */
  async getReport(imageId: string): Promise<PreliminaryReport | null> {
    try {
      const reports = this.getAllReports();
      const report = reports.find(r => r.imageId === imageId);
      
      if (!report) {
        return null;
      }
      
      // Ensure generatedAt is a Date object (may be string after JSON parse)
      return this.deserializeReport(report);
    } catch (error) {
      throw new AIAnalysisError(
        `Failed to retrieve report for image "${imageId}"`,
        error
      );
    }
  }
  
  // ============================================================================
  // Mock AI Generation Methods
  // ============================================================================
  
  /**
   * Generate realistic mock confidence score (0.6-0.95)
   * 
   * @returns Confidence score between 0.6 and 0.95
   */
  private generateMockConfidenceScore(): number {
    // Generate random confidence between 0.6 and 0.95
    const min = 0.6;
    const max = 0.95;
    const score = Math.random() * (max - min) + min;
    
    // Round to 2 decimal places
    return Math.round(score * 100) / 100;
  }
  
  /**
   * Generate realistic mock risk assessment based on confidence
   * 
   * Higher confidence generally correlates with lower risk, but not always
   * 
   * @param confidenceScore - Confidence score from analysis
   * @returns Risk level
   */
  private generateMockRiskAssessment(confidenceScore: number): RiskLevel {
    // Use confidence to influence risk, but add randomness
    const random = Math.random();
    
    if (confidenceScore >= 0.85) {
      // High confidence: mostly low/medium risk
      if (random < 0.6) return 'low';
      if (random < 0.9) return 'medium';
      return 'high';
    } else if (confidenceScore >= 0.75) {
      // Medium-high confidence: mostly medium risk
      if (random < 0.3) return 'low';
      if (random < 0.8) return 'medium';
      return 'high';
    } else {
      // Lower confidence: more varied risk
      if (random < 0.2) return 'low';
      if (random < 0.6) return 'medium';
      if (random < 0.9) return 'high';
      return 'critical';
    }
  }
  
  /**
   * Generate realistic mock findings (2-4 findings)
   * 
   * @returns Array of wound findings
   */
  private generateMockFindings(): string[] {
    // Generate 2-4 findings
    const numFindings = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    
    // Shuffle templates and take first N
    const shuffled = [...MOCK_FINDINGS_TEMPLATES].sort(() => Math.random() - 0.5);
    const selectedFindings = shuffled.slice(0, numFindings);
    
    // Replace placeholders with random values
    return selectedFindings.map(finding => {
      if (finding.includes('{size}')) {
        const size = (Math.random() * 5 + 1).toFixed(1); // 1.0 to 6.0 cm
        return finding.replace('{size}', size);
      }
      return finding;
    });
  }
  
  // ============================================================================
  // Validation Methods
  // ============================================================================
  
  /**
   * Validate confidence score is in valid range (0-1)
   * 
   * @param score - Confidence score to validate
   * @throws AIAnalysisError if validation fails
   * 
   * Requirements: 3.2
   */
  private validateConfidenceScore(score: number): void {
    if (typeof score !== 'number' || isNaN(score)) {
      throw new AIAnalysisError('Confidence score must be a valid number');
    }
    
    if (score < 0 || score > 1) {
      throw new AIAnalysisError('Confidence score must be between 0 and 1');
    }
  }
  
  /**
   * Validate risk assessment is a valid enum value
   * 
   * @param risk - Risk assessment to validate
   * @throws AIAnalysisError if validation fails
   * 
   * Requirements: 3.3
   */
  private validateRiskAssessment(risk: RiskLevel): void {
    const validRiskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
    
    if (!validRiskLevels.includes(risk)) {
      throw new AIAnalysisError(
        `Invalid risk assessment: "${risk}". Must be one of: ${validRiskLevels.join(', ')}`
      );
    }
  }
  
  // ============================================================================
  // Storage Helper Methods
  // ============================================================================
  
  /**
   * Get all reports from LocalStorage
   * 
   * @returns Array of all stored reports
   * @throws AIAnalysisError if retrieval fails
   */
  private getAllReports(): PreliminaryReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      
      if (!data) {
        return [];
      }
      
      const reports = JSON.parse(data) as PreliminaryReport[];
      return reports;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AIAnalysisError(
          'Failed to parse stored reports: Invalid JSON format',
          error
        );
      }
      
      throw new AIAnalysisError(
        'Failed to retrieve reports from storage',
        error
      );
    }
  }
  
  /**
   * Store a report in LocalStorage
   * 
   * @param report - Report to store
   * @throws AIAnalysisError if storage fails
   */
  private storeReport(report: PreliminaryReport): void {
    try {
      const reports = this.getAllReports();
      reports.push(report);
      
      const serialized = JSON.stringify(reports);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new AIAnalysisError(
          'Storage quota exceeded. Please clear some data or contact support.',
          error
        );
      }
      
      throw new AIAnalysisError(
        'Failed to save report to storage',
        error
      );
    }
  }
  
  /**
   * Deserialize report (convert string dates to Date objects)
   * 
   * @param report - Report with potentially serialized dates
   * @returns Report with Date objects
   */
  private deserializeReport(report: PreliminaryReport): PreliminaryReport {
    return {
      ...report,
      generatedAt: new Date(report.generatedAt),
    };
  }
  
  /**
   * Clear all reports (for testing purposes)
   * 
   * WARNING: This will delete all stored reports!
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      throw new AIAnalysisError(
        'Failed to clear all reports',
        error
      );
    }
  }
}

// Export singleton instance
export const aiPreliminaryAnalyzer = new AIPreliminaryAnalyzer();
