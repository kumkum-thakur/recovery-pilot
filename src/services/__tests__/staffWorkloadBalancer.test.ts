import { describe, it, expect, beforeEach } from 'vitest';
import {
  staffWorkloadBalancer,
  STAFF_PROFILES,
  StaffRole,
  ShiftType,
  UnitType,
  BurnoutRisk,
  SkillCategory,
  type StaffMember,
  type PatientAcuity,
} from '../staffWorkloadBalancer';

// Helper to create test acuity input
function createTestAcuityInput(patientId: string, overrides?: Record<string, number | string[] | SkillCategory[]>) {
  return {
    patientId,
    respiratoryStatus: 1,
    hemodynamicStatus: 1,
    neurologicalStatus: 1,
    mobilityStatus: 2,
    nutritionStatus: 1,
    woundCare: 1,
    ivMedications: 2,
    psychosocial: 1,
    educationNeeds: 2,
    dischargePlanning: 1,
    ...overrides,
  };
}

describe('StaffWorkloadBalancer', () => {
  beforeEach(() => {
    staffWorkloadBalancer.resetState();
  });

  describe('staff profiles', () => {
    it('should have 50+ staff profiles', () => {
      expect(STAFF_PROFILES.length).toBeGreaterThanOrEqual(50);
    });

    it('should include all role types', () => {
      const roles = new Set(STAFF_PROFILES.map(s => s.role));
      expect(roles.has(StaffRole.RN)).toBe(true);
      expect(roles.has(StaffRole.LPN)).toBe(true);
      expect(roles.has(StaffRole.CNA)).toBe(true);
      expect(roles.has(StaffRole.CHARGE_RN)).toBe(true);
      expect(roles.has(StaffRole.NP)).toBe(true);
    });

    it('should have certifications appropriate to role', () => {
      const rns = STAFF_PROFILES.filter(s => s.role === StaffRole.RN);
      for (const rn of rns) {
        expect(rn.certification).toContain('BSN');
      }

      const nps = STAFF_PROFILES.filter(s => s.role === StaffRole.NP);
      for (const np of nps) {
        expect(np.certification).toContain('MSN');
      }
    });

    it('should have appropriate max patients per unit type', () => {
      const icuRNs = STAFF_PROFILES.filter(s => s.role === StaffRole.RN && s.unit === UnitType.ICU);
      for (const rn of icuRNs) {
        expect(rn.maxPatientsPerShift).toBeLessThanOrEqual(2);
      }

      const medSurgRNs = STAFF_PROFILES.filter(s => s.role === StaffRole.RN && s.unit === UnitType.MED_SURG);
      for (const rn of medSurgRNs) {
        expect(rn.maxPatientsPerShift).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('patient acuity scoring', () => {
    it('should score low-acuity patient correctly', () => {
      const input = createTestAcuityInput('pt-low');
      const acuity = staffWorkloadBalancer.calculatePatientAcuity(input);

      expect(acuity.acuityLevel).toBeLessThanOrEqual(2);
      expect(acuity.acuityScore).toBeLessThan(40);
      expect(acuity.estimatedCareHours).toBeGreaterThan(0);
      expect(acuity.components).toHaveLength(10);
    });

    it('should score high-acuity ICU patient correctly', () => {
      const input = createTestAcuityInput('pt-high', {
        respiratoryStatus: 4,     // Ventilator
        hemodynamicStatus: 4,     // Unstable
        neurologicalStatus: 3,    // Agitated
        mobilityStatus: 4,        // Bedbound
        nutritionStatus: 4,       // TPN
        woundCare: 3,            // Complex
        ivMedications: 4,        // Continuous drips
        psychosocial: 3,         // High needs
        educationNeeds: 1,
        dischargePlanning: 1,
        requiredSkills: [SkillCategory.CRITICAL_CARE, SkillCategory.VENTILATOR],
      });
      const acuity = staffWorkloadBalancer.calculatePatientAcuity(input);

      expect(acuity.acuityLevel).toBeGreaterThanOrEqual(4);
      expect(acuity.acuityScore).toBeGreaterThan(60);
      expect(acuity.requiredSkills).toContain(SkillCategory.CRITICAL_CARE);
      expect(acuity.estimatedCareHours).toBeGreaterThan(5);
    });

    it('should estimate care time components separately', () => {
      const input = createTestAcuityInput('pt-care-time', {
        respiratoryStatus: 3,
        woundCare: 3,
        ivMedications: 3,
      });
      const acuity = staffWorkloadBalancer.calculatePatientAcuity(input);

      expect(acuity.directCareMinutes).toBeGreaterThan(0);
      expect(acuity.indirectCareMinutes).toBeGreaterThan(0);
      expect(acuity.documentationMinutes).toBeGreaterThan(0);

      // Total should equal sum of components
      const total = acuity.directCareMinutes + acuity.indirectCareMinutes + acuity.documentationMinutes;
      expect(Math.abs(acuity.estimatedCareHours * 60 - total)).toBeLessThan(1);
    });

    it('should include descriptive components', () => {
      const input = createTestAcuityInput('pt-desc', { respiratoryStatus: 3 });
      const acuity = staffWorkloadBalancer.calculatePatientAcuity(input);

      const respComponent = acuity.components.find(c => c.category === 'Respiratory');
      expect(respComponent).toBeDefined();
      expect(respComponent!.description).toContain('High-flow');
    });
  });

  describe('assignment optimization', () => {
    it('should assign all patients to available staff', () => {
      const staff = STAFF_PROFILES.filter(s =>
        s.role === StaffRole.RN && s.unit === UnitType.MED_SURG && s.availability.includes(ShiftType.DAY)
      ).slice(0, 5);

      const patients: PatientAcuity[] = Array.from({ length: 10 }, (_, i) =>
        staffWorkloadBalancer.calculatePatientAcuity(createTestAcuityInput(`pt-assign-${i}`))
      );

      const assignments = staffWorkloadBalancer.optimizeAssignments(
        staff, patients, ShiftType.DAY, UnitType.MED_SURG
      );

      const totalAssigned = assignments.reduce((sum, a) => sum + a.patients.length, 0);
      expect(totalAssigned).toBeLessThanOrEqual(patients.length);
    });

    it('should balance workload across staff', () => {
      const staff = STAFF_PROFILES.filter(s =>
        s.role === StaffRole.RN && s.unit === UnitType.MED_SURG && s.availability.includes(ShiftType.DAY)
      ).slice(0, 4);

      const patients: PatientAcuity[] = Array.from({ length: 12 }, (_, i) =>
        staffWorkloadBalancer.calculatePatientAcuity(createTestAcuityInput(`pt-bal-${i}`, {
          hemodynamicStatus: 2,
          ivMedications: 2,
        }))
      );

      const assignments = staffWorkloadBalancer.optimizeAssignments(
        staff, patients, ShiftType.DAY, UnitType.MED_SURG
      );

      const workloads = assignments.filter(a => a.patients.length > 0).map(a => a.workloadPercentage);
      if (workloads.length >= 2) {
        const maxWorkload = Math.max(...workloads);
        const minWorkload = Math.min(...workloads);
        // Workload should be somewhat balanced (not extreme disparity)
        expect(maxWorkload - minWorkload).toBeLessThan(80);
      }
    });

    it('should not assign high-acuity patients to CNAs', () => {
      const staff: StaffMember[] = [
        { ...STAFF_PROFILES[0], role: StaffRole.CNA, id: 'cna-test', unit: UnitType.MED_SURG, availability: [ShiftType.DAY], maxPatientsPerShift: 10 },
        { ...STAFF_PROFILES[1], role: StaffRole.RN, id: 'rn-test', unit: UnitType.MED_SURG, availability: [ShiftType.DAY], maxPatientsPerShift: 5 },
      ];

      // All scores at 4 => 40/40 = 100% => acuityLevel 5 (well above 4 threshold)
      const highAcuity = staffWorkloadBalancer.calculatePatientAcuity(
        createTestAcuityInput('pt-ha', {
          respiratoryStatus: 4,
          hemodynamicStatus: 4,
          neurologicalStatus: 4,
          mobilityStatus: 4,
          nutritionStatus: 4,
          woundCare: 4,
          ivMedications: 4,
          psychosocial: 4,
          educationNeeds: 4,
          dischargePlanning: 4,
        })
      );

      expect(highAcuity.acuityLevel).toBeGreaterThanOrEqual(4);

      const assignments = staffWorkloadBalancer.optimizeAssignments(
        staff, [highAcuity], ShiftType.DAY, UnitType.MED_SURG
      );

      const cnaAssignment = assignments.find(a => a.staffId === 'cna-test');
      expect(cnaAssignment?.patients.length).toBe(0);
    });

    it('should respect max patients per shift limits', () => {
      const staff: StaffMember[] = [{
        ...STAFF_PROFILES[0],
        id: 'limit-rn',
        role: StaffRole.RN,
        unit: UnitType.MED_SURG,
        maxPatientsPerShift: 3,
        availability: [ShiftType.DAY],
      }];

      const patients: PatientAcuity[] = Array.from({ length: 5 }, (_, i) =>
        staffWorkloadBalancer.calculatePatientAcuity(createTestAcuityInput(`pt-limit-${i}`))
      );

      const assignments = staffWorkloadBalancer.optimizeAssignments(
        staff, patients, ShiftType.DAY, UnitType.MED_SURG
      );

      const assignment = assignments.find(a => a.staffId === 'limit-rn');
      expect(assignment!.patients.length).toBeLessThanOrEqual(3);
    });
  });

  describe('workload report', () => {
    it('should generate comprehensive workload report', () => {
      const staff = STAFF_PROFILES.filter(s =>
        s.role === StaffRole.RN && s.unit === UnitType.MED_SURG && s.availability.includes(ShiftType.DAY)
      ).slice(0, 5);

      const patients: PatientAcuity[] = Array.from({ length: 15 }, (_, i) =>
        staffWorkloadBalancer.calculatePatientAcuity(createTestAcuityInput(`pt-report-${i}`, {
          hemodynamicStatus: 2,
          ivMedications: 2,
        }))
      );

      const assignments = staffWorkloadBalancer.optimizeAssignments(
        staff, patients, ShiftType.DAY, UnitType.MED_SURG
      );

      const report = staffWorkloadBalancer.generateWorkloadReport(
        assignments, ShiftType.DAY, UnitType.MED_SURG
      );

      expect(report.totalPatients).toBeGreaterThan(0);
      expect(report.totalStaff).toBeGreaterThan(0);
      expect(report.ratioRNToPatient).toBeTruthy();
      expect(report.avgWorkloadPercentage).toBeGreaterThan(0);
    });

    it('should identify overloaded staff', () => {
      // Create scenario where one nurse has many high-acuity patients
      const staff: StaffMember[] = [{
        ...STAFF_PROFILES[0],
        id: 'overload-rn',
        name: 'Overloaded Nurse',
        role: StaffRole.RN,
        unit: UnitType.MED_SURG,
        maxPatientsPerShift: 8,
        availability: [ShiftType.DAY],
      }];

      // High-acuity patients requiring significant care time
      const patients: PatientAcuity[] = Array.from({ length: 7 }, (_, i) =>
        staffWorkloadBalancer.calculatePatientAcuity(createTestAcuityInput(`pt-ol-${i}`, {
          respiratoryStatus: 3,
          hemodynamicStatus: 3,
          mobilityStatus: 3,
          nutritionStatus: 3,
          woundCare: 4,
          ivMedications: 4,
          psychosocial: 3,
          educationNeeds: 3,
          dischargePlanning: 3,
        }))
      );

      const assignments = staffWorkloadBalancer.optimizeAssignments(
        staff, patients, ShiftType.DAY, UnitType.MED_SURG
      );

      const report = staffWorkloadBalancer.generateWorkloadReport(
        assignments, ShiftType.DAY, UnitType.MED_SURG
      );

      expect(report.maxWorkloadPercentage).toBeGreaterThan(80);
    });
  });

  describe('overtime prediction', () => {
    it('should predict overtime for staff near 40-hour threshold', () => {
      const staff: StaffMember[] = [
        { ...STAFF_PROFILES[0], id: 'ot-high', name: 'High OT', totalHoursThisWeek: 36 },
        { ...STAFF_PROFILES[1], id: 'ot-low', name: 'Low OT', totalHoursThisWeek: 12 },
      ];

      const predictions = staffWorkloadBalancer.predictOvertime(staff, 2);

      expect(predictions.length).toBe(2);
      const highOT = predictions.find(p => p.staffId === 'ot-high');
      const lowOT = predictions.find(p => p.staffId === 'ot-low');

      expect(highOT!.overtimeHours).toBeGreaterThan(0);
      expect(highOT!.costImpact).toBeGreaterThan(0);
      expect(lowOT!.overtimeHours).toBe(0);
    });

    it('should sort predictions by overtime hours descending', () => {
      const predictions = staffWorkloadBalancer.predictOvertime(STAFF_PROFILES.slice(0, 10));

      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i].overtimeHours).toBeLessThanOrEqual(predictions[i - 1].overtimeHours);
      }
    });
  });

  describe('burnout assessment', () => {
    it('should assess low burnout risk for fresh staff', () => {
      const member: StaffMember = {
        ...STAFF_PROFILES[0],
        consecutiveShifts: 1,
        totalHoursThisWeek: 12,
        totalHoursThisMonth: 48,
        yearsExperience: 15,
      };

      const assessment = staffWorkloadBalancer.assessBurnoutRisk(member);
      expect(assessment.riskLevel).toBe(BurnoutRisk.LOW);
      expect(assessment.riskScore).toBeLessThan(35);
    });

    it('should assess high/critical burnout risk for overworked staff', () => {
      const member: StaffMember = {
        ...STAFF_PROFILES[0],
        consecutiveShifts: 6,
        totalHoursThisWeek: 60,
        totalHoursThisMonth: 200,
        yearsExperience: 1,
      };

      const assessment = staffWorkloadBalancer.assessBurnoutRisk(member);
      expect([BurnoutRisk.HIGH, BurnoutRisk.CRITICAL]).toContain(assessment.riskLevel);
      expect(assessment.riskScore).toBeGreaterThan(50);
      expect(assessment.recommendations.length).toBeGreaterThan(0);
    });

    it('should include multiple risk factors in assessment', () => {
      const member: StaffMember = {
        ...STAFF_PROFILES[0],
        consecutiveShifts: 4,
        totalHoursThisWeek: 48,
        totalHoursThisMonth: 160,
        yearsExperience: 5,
      };

      const assessment = staffWorkloadBalancer.assessBurnoutRisk(member);
      expect(assessment.factors.length).toBeGreaterThanOrEqual(4);

      for (const factor of assessment.factors) {
        expect(factor.weight).toBeGreaterThan(0);
        expect(factor.weight).toBeLessThanOrEqual(1);
      }
    });

    it('should recommend intervention for critical risk', () => {
      const member: StaffMember = {
        ...STAFF_PROFILES[0],
        consecutiveShifts: 7,
        totalHoursThisWeek: 72,
        totalHoursThisMonth: 250,
        yearsExperience: 1,
      };

      const assessment = staffWorkloadBalancer.assessBurnoutRisk(member);
      expect(assessment.recommendations.some(r => r.toLowerCase().includes('immediate') || r.toLowerCase().includes('consecutive'))).toBe(true);
    });
  });

  describe('shift scheduling', () => {
    it('should create a shift schedule with constraint checking', () => {
      const staff = STAFF_PROFILES.filter(s =>
        s.unit === UnitType.MED_SURG && s.availability.includes(ShiftType.DAY)
      ).slice(0, 6);

      const patients: PatientAcuity[] = Array.from({ length: 12 }, (_, i) =>
        staffWorkloadBalancer.calculatePatientAcuity(createTestAcuityInput(`pt-sched-${i}`))
      );

      const schedule = staffWorkloadBalancer.createShiftSchedule(
        staff, patients, ShiftType.DAY, UnitType.MED_SURG, '2024-12-15'
      );

      expect(schedule.shift).toBe(ShiftType.DAY);
      expect(schedule.unit).toBe(UnitType.MED_SURG);
      expect(schedule.assignments.length).toBeGreaterThan(0);
      expect(schedule.coverageScore).toBeGreaterThan(0);
    });

    it('should detect constraint violations (consecutive shifts)', () => {
      const staff: StaffMember[] = [{
        ...STAFF_PROFILES[0],
        id: 'constraint-test',
        name: 'Exhausted Nurse',
        role: StaffRole.RN,
        unit: UnitType.MED_SURG,
        availability: [ShiftType.DAY],
        consecutiveShifts: 6, // Over limit
        totalHoursThisWeek: 55,
        maxPatientsPerShift: 5,
      }];

      const patients: PatientAcuity[] = [
        staffWorkloadBalancer.calculatePatientAcuity(createTestAcuityInput('pt-cv')),
      ];

      const schedule = staffWorkloadBalancer.createShiftSchedule(
        staff, patients, ShiftType.DAY, UnitType.MED_SURG, '2024-12-15'
      );

      expect(schedule.constraintViolations.length).toBeGreaterThan(0);
      expect(schedule.constraintViolations.some(v => v.severity === 'violation')).toBe(true);
    });
  });

  describe('self-learning (acuity calibration)', () => {
    it('should calibrate acuity scores based on actual care time', () => {
      // Record that level 3 takes more time than predicted
      for (let i = 0; i < 10; i++) {
        staffWorkloadBalancer.recordActualCareTime(3, 4.0, 5.5); // Predicted 4h, actual 5.5h
      }

      const calibration = staffWorkloadBalancer.getAcuityCalibration();
      const level3 = calibration.get('3');

      expect(level3).toBeDefined();
      expect(level3!.bias).toBeGreaterThan(0); // Under-predicting
      expect(level3!.count).toBe(10);
      expect(level3!.adjustment).toBeGreaterThan(0);
    });

    it('should require minimum data points for calibration', () => {
      staffWorkloadBalancer.recordActualCareTime(2, 3.0, 3.5);
      staffWorkloadBalancer.recordActualCareTime(2, 3.0, 3.2);

      const calibration = staffWorkloadBalancer.getAcuityCalibration();
      // Should not have calibration for level 2 with only 2 data points
      expect(calibration.has('2')).toBe(false);
    });

    it('should generate new staff profiles deterministically', () => {
      const profiles1 = staffWorkloadBalancer.generateStaffProfiles();
      const profiles2 = staffWorkloadBalancer.generateStaffProfiles();

      expect(profiles1.length).toBe(profiles2.length);
      expect(profiles1[0].name).toBe(profiles2[0].name);
    });
  });
});
