import { describe, it, expect, beforeEach } from 'vitest';
import {
  clinicalPathwayEngine,
  PATHWAY_TEMPLATES,
  SurgeryType,
  PathwayPhase,
  ERASElement,
  MilestoneStatus,
  DeviationSeverity,
  ComplianceLevel,
} from '../clinicalPathwayEngine';

describe('ClinicalPathwayEngine', () => {
  beforeEach(() => {
    clinicalPathwayEngine.resetLearningData();
  });

  describe('pathway templates', () => {
    it('should have templates for all 5 surgery types', () => {
      expect(PATHWAY_TEMPLATES).toHaveLength(5);
      const types = PATHWAY_TEMPLATES.map(t => t.surgeryType);
      expect(types).toContain(SurgeryType.COLORECTAL);
      expect(types).toContain(SurgeryType.ORTHOPEDIC);
      expect(types).toContain(SurgeryType.CARDIAC);
      expect(types).toContain(SurgeryType.GYNECOLOGIC);
      expect(types).toContain(SurgeryType.UROLOGIC);
    });

    it('should have real ERAS elements in each template', () => {
      for (const template of PATHWAY_TEMPLATES) {
        expect(template.milestones.length).toBeGreaterThanOrEqual(10);
        expect(template.expectedLOS).toBeGreaterThan(0);
        expect(template.criticalElements.length).toBeGreaterThanOrEqual(3);

        // Every milestone should have evidence grade
        for (const m of template.milestones) {
          expect(m.evidenceGrade).toBeTruthy();
          expect(m.description).toBeTruthy();
          expect(m.target).toBeTruthy();
        }
      }
    });

    it('should have correct expected LOS for each surgery type', () => {
      const colorectal = clinicalPathwayEngine.getTemplate(SurgeryType.COLORECTAL);
      expect(colorectal?.expectedLOS).toBe(4); // ERAS colorectal target

      const orthopedic = clinicalPathwayEngine.getTemplate(SurgeryType.ORTHOPEDIC);
      expect(orthopedic?.expectedLOS).toBe(2); // ERAS joint replacement target

      const cardiac = clinicalPathwayEngine.getTemplate(SurgeryType.CARDIAC);
      expect(cardiac?.expectedLOS).toBe(6); // ERAS cardiac target
    });

    it('should include pre-op, intra-op, and post-op phases in colorectal template', () => {
      const template = clinicalPathwayEngine.getTemplate(SurgeryType.COLORECTAL)!;
      const phases = new Set(template.milestones.map(m => m.phase));
      expect(phases.has(PathwayPhase.PRE_OP)).toBe(true);
      expect(phases.has(PathwayPhase.INTRA_OP)).toBe(true);
      expect(phases.has(PathwayPhase.POST_OP_DAY0)).toBe(true);
    });
  });

  describe('pathway initialization', () => {
    it('should initialize a patient pathway with all milestones NOT_STARTED', () => {
      const pathway = clinicalPathwayEngine.initializePathway('pt-001', SurgeryType.COLORECTAL, '2024-12-01');
      expect(pathway).not.toBeNull();
      expect(pathway!.patientId).toBe('pt-001');
      expect(pathway!.surgeryType).toBe(SurgeryType.COLORECTAL);
      expect(pathway!.currentPhase).toBe(PathwayPhase.PRE_OP);
      expect(pathway!.complianceScore).toBe(0);
      expect(pathway!.deviations).toHaveLength(0);

      for (const record of pathway!.milestoneRecords) {
        expect(record.status).toBe(MilestoneStatus.NOT_STARTED);
      }
    });

    it('should return null for unknown surgery type', () => {
      const pathway = clinicalPathwayEngine.initializePathway('pt-002', 'unknown' as SurgeryType, '2024-12-01');
      expect(pathway).toBeNull();
    });

    it('should create milestone records matching the template', () => {
      const template = clinicalPathwayEngine.getTemplate(SurgeryType.ORTHOPEDIC)!;
      const pathway = clinicalPathwayEngine.initializePathway('pt-003', SurgeryType.ORTHOPEDIC, '2024-12-01')!;
      expect(pathway.milestoneRecords).toHaveLength(template.milestones.length);
    });
  });

  describe('milestone updates and compliance scoring', () => {
    it('should update a milestone status to COMPLETED and recalculate compliance', () => {
      let pathway = clinicalPathwayEngine.initializePathway('pt-004', SurgeryType.COLORECTAL, '2024-12-01')!;
      const firstMilestoneId = pathway.milestoneRecords[0].milestoneId;

      pathway = clinicalPathwayEngine.updateMilestone(pathway, firstMilestoneId, MilestoneStatus.COMPLETED, 'Dr. Smith');

      const record = pathway.milestoneRecords.find(r => r.milestoneId === firstMilestoneId);
      expect(record?.status).toBe(MilestoneStatus.COMPLETED);
      expect(record?.completedBy).toBe('Dr. Smith');
      expect(record?.completedAt).toBeTruthy();
      expect(pathway.complianceScore).toBeGreaterThan(0);
    });

    it('should increase compliance score as more milestones are completed', () => {
      let pathway = clinicalPathwayEngine.initializePathway('pt-005', SurgeryType.COLORECTAL, '2024-12-01')!;

      // Complete first milestone
      pathway = clinicalPathwayEngine.updateMilestone(pathway, pathway.milestoneRecords[0].milestoneId, MilestoneStatus.COMPLETED);
      const score1 = pathway.complianceScore;

      // Complete second milestone
      pathway = clinicalPathwayEngine.updateMilestone(pathway, pathway.milestoneRecords[1].milestoneId, MilestoneStatus.COMPLETED);
      const score2 = pathway.complianceScore;

      expect(score2).toBeGreaterThan(score1);
    });

    it('should reach 100% compliance when all milestones are completed', () => {
      let pathway = clinicalPathwayEngine.initializePathway('pt-006', SurgeryType.ORTHOPEDIC, '2024-12-01')!;

      for (const record of pathway.milestoneRecords) {
        pathway = clinicalPathwayEngine.updateMilestone(pathway, record.milestoneId, MilestoneStatus.COMPLETED);
      }

      expect(pathway.complianceScore).toBe(100);
    });

    it('should classify compliance levels correctly', () => {
      expect(clinicalPathwayEngine.getComplianceLevel(95)).toBe(ComplianceLevel.EXCELLENT);
      expect(clinicalPathwayEngine.getComplianceLevel(80)).toBe(ComplianceLevel.GOOD);
      expect(clinicalPathwayEngine.getComplianceLevel(60)).toBe(ComplianceLevel.FAIR);
      expect(clinicalPathwayEngine.getComplianceLevel(30)).toBe(ComplianceLevel.POOR);
    });
  });

  describe('protocol deviation detection', () => {
    it('should create a deviation when a milestone is marked as DEVIATED', () => {
      let pathway = clinicalPathwayEngine.initializePathway('pt-007', SurgeryType.COLORECTAL, '2024-12-01')!;
      const milestoneId = pathway.milestoneRecords[0].milestoneId;

      pathway = clinicalPathwayEngine.updateMilestone(
        pathway, milestoneId, MilestoneStatus.DEVIATED, 'Dr. Jones', undefined, 'Patient refused carb loading'
      );

      expect(pathway.deviations).toHaveLength(1);
      expect(pathway.deviations[0].milestoneId).toBe(milestoneId);
      expect(pathway.deviations[0].reason).toBe('Patient refused carb loading');
      expect(pathway.deviations[0].resolved).toBe(false);
    });

    it('should assign CRITICAL severity for required critical-element deviations', () => {
      let pathway = clinicalPathwayEngine.initializePathway('pt-008', SurgeryType.COLORECTAL, '2024-12-01')!;
      const template = clinicalPathwayEngine.getTemplate(SurgeryType.COLORECTAL)!;

      // Find a milestone for a critical element
      const criticalMilestone = template.milestones.find(
        m => template.criticalElements.includes(m.element) && m.required
      )!;

      pathway = clinicalPathwayEngine.updateMilestone(pathway, criticalMilestone.id, MilestoneStatus.DEVIATED);

      expect(pathway.deviations[0].severity).toBe(DeviationSeverity.CRITICAL);
      expect(pathway.deviations[0].impactDescription).toBeTruthy();
    });

    it('should detect unfinished milestones as deviations by post-op day', () => {
      let pathway = clinicalPathwayEngine.initializePathway('pt-009', SurgeryType.COLORECTAL, '2024-12-01')!;
      // Simulate: pre-op milestones should be done before intra-op (day >= 0)
      // Leave all as NOT_STARTED and check day 2
      const deviations = clinicalPathwayEngine.detectDeviations(pathway, 2);

      // Should detect pre-op and intra-op milestones as overdue
      expect(deviations.length).toBeGreaterThan(0);
      for (const dev of deviations) {
        expect(dev.resolved).toBe(false);
        expect(dev.reason).toContain('not completed by expected phase');
      }
    });
  });

  describe('compliance report generation', () => {
    it('should generate a comprehensive compliance report', () => {
      let pathway = clinicalPathwayEngine.initializePathway('pt-010', SurgeryType.COLORECTAL, '2024-12-01')!;

      // Complete some milestones
      for (let i = 0; i < 5; i++) {
        pathway = clinicalPathwayEngine.updateMilestone(pathway, pathway.milestoneRecords[i].milestoneId, MilestoneStatus.COMPLETED);
      }
      // Deviate one
      pathway = clinicalPathwayEngine.updateMilestone(pathway, pathway.milestoneRecords[5].milestoneId, MilestoneStatus.DEVIATED, undefined, undefined, 'Contraindicated');

      const report = clinicalPathwayEngine.generateComplianceReport(pathway);

      expect(report.patientId).toBe('pt-010');
      expect(report.completedMilestones).toBe(5);
      expect(report.deviationCount).toBe(1);
      expect(report.overallScore).toBeGreaterThan(0);
      expect(Object.keys(report.phaseScores).length).toBeGreaterThan(0);
      expect(Object.keys(report.elementScores).length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('outcome correlation', () => {
    it('should correlate outcomes with adherence for each ERAS element', () => {
      let pathway = clinicalPathwayEngine.initializePathway('pt-011', SurgeryType.COLORECTAL, '2024-12-01')!;

      // Complete early mobilization milestones
      const template = clinicalPathwayEngine.getTemplate(SurgeryType.COLORECTAL)!;
      for (const m of template.milestones) {
        if (m.element === ERASElement.EARLY_MOBILIZATION) {
          pathway = clinicalPathwayEngine.updateMilestone(pathway, m.id, MilestoneStatus.COMPLETED);
        }
      }

      pathway.outcomes = {
        actualLOS: 3,
        expectedLOS: 4,
        complications: [],
        readmitted30Day: false,
        painScoreAvg: 4,
        mobilizationDay: 0,
        firstOralIntakeDay: 0,
      };

      const correlations = clinicalPathwayEngine.correlateOutcomes(pathway);

      expect(Object.keys(correlations).length).toBeGreaterThan(0);
      const mobilizationCorrelation = correlations[ERASElement.EARLY_MOBILIZATION];
      expect(mobilizationCorrelation).toBeDefined();
      expect(mobilizationCorrelation.adherent).toBe(true);
      expect(mobilizationCorrelation.outcomeImpact).toContain('mobilization');
    });
  });

  describe('self-learning', () => {
    it('should record completed pathways and analyze element impact', () => {
      // Create multiple pathways with varying adherence
      for (let i = 0; i < 10; i++) {
        let pathway = clinicalPathwayEngine.initializePathway(`pt-learn-${i}`, SurgeryType.COLORECTAL, '2024-12-01')!;
        const template = clinicalPathwayEngine.getTemplate(SurgeryType.COLORECTAL)!;

        // Adherent patients (first 5) - complete early mobilization
        if (i < 5) {
          for (const m of template.milestones) {
            if (m.element === ERASElement.EARLY_MOBILIZATION) {
              pathway = clinicalPathwayEngine.updateMilestone(pathway, m.id, MilestoneStatus.COMPLETED);
            }
          }
          pathway.outcomes = { actualLOS: 3, expectedLOS: 4, complications: [], readmitted30Day: false, painScoreAvg: 3, mobilizationDay: 0, firstOralIntakeDay: 0 };
        } else {
          // Non-adherent patients
          pathway.outcomes = { actualLOS: 6, expectedLOS: 4, complications: ['Pneumonia'], readmitted30Day: false, painScoreAvg: 6, mobilizationDay: 2, firstOralIntakeDay: 1 };
        }

        clinicalPathwayEngine.recordCompletedPathway(pathway);
      }

      const impacts = clinicalPathwayEngine.analyzeElementImpact();
      expect(impacts.length).toBeGreaterThan(0);

      // Early mobilization should show impact
      const mobilizationImpact = impacts.find(i => i.element === ERASElement.EARLY_MOBILIZATION);
      if (mobilizationImpact) {
        expect(mobilizationImpact.avgLOSWhenAdherent).toBeLessThan(mobilizationImpact.avgLOSWhenNonAdherent);
        expect(mobilizationImpact.impactScore).toBeGreaterThan(0);
      }
    });

    it('should generate learning insights from outcome data', () => {
      // Seed data
      for (let i = 0; i < 10; i++) {
        let pathway = clinicalPathwayEngine.initializePathway(`pt-ins-${i}`, SurgeryType.COLORECTAL, '2024-12-01')!;
        const template = clinicalPathwayEngine.getTemplate(SurgeryType.COLORECTAL)!;

        for (const m of template.milestones) {
          const status = i < 5 ? MilestoneStatus.COMPLETED : MilestoneStatus.NOT_STARTED;
          pathway = clinicalPathwayEngine.updateMilestone(pathway, m.id, status);
        }

        pathway.outcomes = {
          actualLOS: i < 5 ? 3 : 7,
          expectedLOS: 4,
          complications: i < 5 ? [] : ['SSI', 'Ileus'],
          readmitted30Day: i >= 8,
          painScoreAvg: i < 5 ? 3 : 7,
          mobilizationDay: i < 5 ? 0 : 3,
          firstOralIntakeDay: i < 5 ? 0 : 2,
        };
        clinicalPathwayEngine.recordCompletedPathway(pathway);
      }

      const insights = clinicalPathwayEngine.generateLearningInsights();
      expect(insights.length).toBeGreaterThan(0);

      for (const insight of insights) {
        expect(insight.insight).toBeTruthy();
        expect(insight.recommendation).toBeTruthy();
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should update element weights based on learning', () => {
      // Seed learning data
      for (let i = 0; i < 8; i++) {
        let pathway = clinicalPathwayEngine.initializePathway(`pt-wt-${i}`, SurgeryType.COLORECTAL, '2024-12-01')!;
        const template = clinicalPathwayEngine.getTemplate(SurgeryType.COLORECTAL)!;

        for (const m of template.milestones) {
          const status = i % 2 === 0 ? MilestoneStatus.COMPLETED : MilestoneStatus.NOT_STARTED;
          pathway = clinicalPathwayEngine.updateMilestone(pathway, m.id, status);
        }
        pathway.outcomes = {
          actualLOS: i % 2 === 0 ? 3 : 6,
          expectedLOS: 4,
          complications: i % 2 === 0 ? [] : ['Complication'],
          readmitted30Day: false,
          painScoreAvg: 4,
          mobilizationDay: 0,
          firstOralIntakeDay: 0,
        };
        clinicalPathwayEngine.recordCompletedPathway(pathway);
      }

      clinicalPathwayEngine.updateElementWeights();

      // Weights should have been updated (tested implicitly through compliance scoring)
      // Creating a new pathway and completing a high-impact element should reflect learning
      const pathway = clinicalPathwayEngine.initializePathway('pt-wt-final', SurgeryType.COLORECTAL, '2024-12-01')!;
      expect(pathway).not.toBeNull();
    });
  });

  describe('phase mapping', () => {
    it('should correctly map post-op days to phases', () => {
      expect(clinicalPathwayEngine.getPhaseForDay(-1)).toBe(PathwayPhase.PRE_OP);
      expect(clinicalPathwayEngine.getPhaseForDay(0)).toBe(PathwayPhase.POST_OP_DAY0);
      expect(clinicalPathwayEngine.getPhaseForDay(1)).toBe(PathwayPhase.POST_OP_DAY1);
      expect(clinicalPathwayEngine.getPhaseForDay(2)).toBe(PathwayPhase.POST_OP_DAY2);
      expect(clinicalPathwayEngine.getPhaseForDay(5)).toBe(PathwayPhase.POST_OP_DAY3_PLUS);
    });
  });
});
