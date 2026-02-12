import { describe, it, expect, beforeEach } from 'vitest';
import {
  RiskScoringEngine,
  createRiskScoringEngine,
  RiskTier,
  ASAClass,
  AnesthesiaType,
  SurgeryComplexity,
  WoundHealingPhase,
  MoodLevel,
  type PatientRiskInput,
} from '../riskScoringEngine';

function createTestPatientInput(overrides?: Partial<PatientRiskInput>): PatientRiskInput {
  return {
    demographics: {
      patientId: 'test-patient-001',
      age: 55,
      bmi: 26,
      isSmoker: false,
      comorbidities: [],
      asaClass: ASAClass.ASA_II,
      gender: 'male',
      livesAlone: false,
      hasCaregiver: true,
      primaryLanguageEnglish: true,
    },
    surgical: {
      surgeryType: 'knee_replacement',
      surgeryDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      durationMinutes: 90,
      complexity: SurgeryComplexity.MODERATE,
      anesthesiaType: AnesthesiaType.GENERAL,
      isEmergency: false,
      isReoperation: false,
      surgicalSite: 'right_knee',
    },
    compliance: {
      medicationAdherenceRate: 0.9,
      missionCompletionRate: 0.85,
      appointmentAttendanceRate: 1.0,
      daysWithMissedMedications: 1,
      consecutiveMissedDays: 0,
      totalScheduledAppointments: 3,
      appointmentsAttended: 3,
      appointmentsCancelled: 0,
      appointmentsNoShow: 0,
    },
    clinical: {
      woundHealingPhase: WoundHealingPhase.PROLIFERATIVE,
      woundHealingOnTrack: true,
      painLevel: 4,
      painTrend: 'decreasing',
      temperature: 37.0,
      heartRate: 75,
      bloodPressureSystolic: 125,
      bloodPressureDiastolic: 80,
      oxygenSaturation: 98,
      hasInfectionSigns: false,
      hasDrainageAbnormality: false,
      hasSwelling: false,
      hasRedness: false,
    },
    behavioral: {
      appEngagementScore: 0.8,
      avgDailySessionMinutes: 10,
      daysActiveLastWeek: 6,
      symptomReportsLast7Days: 2,
      symptomReportsLast30Days: 8,
      moodScores: [MoodLevel.GOOD, MoodLevel.GOOD, MoodLevel.NEUTRAL],
    },
    ...overrides,
  };
}

describe('RiskScoringEngine', () => {
  let engine: RiskScoringEngine;

  beforeEach(() => {
    engine = new RiskScoringEngine();
  });

  describe('risk assessment', () => {
    it('should produce a complete risk assessment for a healthy patient', () => {
      const input = createTestPatientInput();
      const assessment = engine.assessRisk(input);

      expect(assessment.patientId).toBe('test-patient-001');
      expect(assessment.assessmentId).toBeTruthy();
      expect(assessment.timestamp).toBeTruthy();

      // Check all risk categories are present
      expect(assessment.overallRisk).toBeDefined();
      expect(assessment.infectionRisk).toBeDefined();
      expect(assessment.readmissionRisk).toBeDefined();
      expect(assessment.fallRisk).toBeDefined();
      expect(assessment.mentalHealthRisk).toBeDefined();
      expect(assessment.medicationNonAdherenceRisk).toBeDefined();

      // Scores should be in valid range (0-100)
      expect(assessment.overallRisk.score).toBeGreaterThanOrEqual(0);
      expect(assessment.overallRisk.score).toBeLessThanOrEqual(100);
      expect(assessment.infectionRisk.score).toBeGreaterThanOrEqual(0);
      expect(assessment.infectionRisk.score).toBeLessThanOrEqual(100);

      // Tier should be valid
      expect(Object.values(RiskTier)).toContain(assessment.overallRisk.tier);
    });

    it('should assign higher risk to patients with many comorbidities', () => {
      const healthyInput = createTestPatientInput();
      const healthyAssessment = engine.assessRisk(healthyInput);

      const sickInput = createTestPatientInput({
        demographics: {
          ...healthyInput.demographics,
          patientId: 'test-patient-002',
          age: 75,
          bmi: 38,
          isSmoker: true,
          comorbidities: ['diabetes', 'hypertension', 'copd', 'chf'],
          asaClass: ASAClass.ASA_IV,
        },
        clinical: {
          ...healthyInput.clinical,
          painLevel: 8,
          painTrend: 'increasing',
          temperature: 38.5,
          hasInfectionSigns: true,
          hasSwelling: true,
          hasRedness: true,
        },
      });
      const sickAssessment = engine.assessRisk(sickInput);

      expect(sickAssessment.overallRisk.score).toBeGreaterThan(healthyAssessment.overallRisk.score);
    });

    it('should compute valid LACE and Charlson index scores', () => {
      const input = createTestPatientInput({
        lengthOfStayDays: 5,
        edVisitsLast6Months: 2,
      });
      const assessment = engine.assessRisk(input);

      expect(assessment.laceIndexScore).toBeGreaterThanOrEqual(0);
      expect(assessment.laceIndexScore).toBeLessThanOrEqual(19);
      expect(assessment.charlsonComorbidityIndex).toBeGreaterThanOrEqual(0);
    });

    it('should generate alerts for critical indicators', () => {
      const input = createTestPatientInput({
        clinical: {
          woundHealingPhase: WoundHealingPhase.COMPLICATED,
          woundHealingOnTrack: false,
          painLevel: 9,
          painTrend: 'increasing',
          temperature: 39.5,
          heartRate: 120,
          bloodPressureSystolic: 160,
          bloodPressureDiastolic: 95,
          oxygenSaturation: 91,
          hasInfectionSigns: true,
          hasDrainageAbnormality: true,
          hasSwelling: true,
          hasRedness: true,
        },
      });
      const assessment = engine.assessRisk(input);

      // Should have alerts for the critical clinical state
      expect(assessment.alerts.length).toBeGreaterThan(0);
      const alertMessages = assessment.alerts.map((a) => a.message);
      expect(alertMessages.length).toBeGreaterThan(0);
    });
  });

  describe('factory function', () => {
    it('createRiskScoringEngine should return a working engine', () => {
      const customEngine = createRiskScoringEngine();
      const input = createTestPatientInput();
      const assessment = customEngine.assessRisk(input);
      expect(assessment.overallRisk).toBeDefined();
      expect(assessment.overallRisk.score).toBeGreaterThanOrEqual(0);
    });
  });
});
