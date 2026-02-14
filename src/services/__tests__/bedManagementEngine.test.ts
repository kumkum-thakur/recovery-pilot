import { describe, it, expect, beforeEach } from 'vitest';
import {
  bedManagementEngine,
  BedType,
  BedStatus,
  ADTEventType,
  CapacityStatus,
  DischargeReadiness,
  type ADTEvent,
} from '../bedManagementEngine';

describe('BedManagementEngine', () => {
  beforeEach(() => {
    bedManagementEngine.resetState();
    bedManagementEngine.initializeBeds();
  });

  describe('bed initialization', () => {
    it('should initialize beds for all unit types', () => {
      const beds = bedManagementEngine.getBeds();
      expect(beds.length).toBeGreaterThan(100);

      const types = new Set(beds.map(b => b.type));
      expect(types.has(BedType.ICU)).toBe(true);
      expect(types.has(BedType.STEP_DOWN)).toBe(true);
      expect(types.has(BedType.MED_SURG)).toBe(true);
      expect(types.has(BedType.ISOLATION)).toBe(true);
      expect(types.has(BedType.REHAB)).toBe(true);
      expect(types.has(BedType.OBSERVATION)).toBe(true);
    });

    it('should have correct bed counts per type', () => {
      const beds = bedManagementEngine.getBeds();
      expect(beds.filter(b => b.type === BedType.ICU).length).toBe(20);
      expect(beds.filter(b => b.type === BedType.STEP_DOWN).length).toBe(15);
      expect(beds.filter(b => b.type === BedType.MED_SURG).length).toBe(60);
      expect(beds.filter(b => b.type === BedType.ISOLATION).length).toBe(8);
      expect(beds.filter(b => b.type === BedType.REHAB).length).toBe(12);
      expect(beds.filter(b => b.type === BedType.OBSERVATION).length).toBe(10);
    });

    it('should have isolation-capable beds in relevant units', () => {
      const beds = bedManagementEngine.getBeds();
      const isolationCapable = beds.filter(b => b.isolationCapable);
      expect(isolationCapable.length).toBeGreaterThan(8); // Dedicated + some in other units

      // All isolation unit beds should be isolation capable
      const isoUnitBeds = beds.filter(b => b.type === BedType.ISOLATION);
      for (const bed of isoUnitBeds) {
        expect(bed.isolationCapable).toBe(true);
      }
    });

    it('should start all beds as AVAILABLE', () => {
      const beds = bedManagementEngine.getBeds();
      for (const bed of beds) {
        expect(bed.status).toBe(BedStatus.AVAILABLE);
      }
    });
  });

  describe('ADT event processing - admissions', () => {
    it('should successfully admit a patient to an available bed', () => {
      const event: ADTEvent = {
        id: 'adt-001',
        type: ADTEventType.ADMISSION,
        patientId: 'pt-001',
        timestamp: new Date().toISOString(),
        bedType: BedType.MED_SURG,
        diagnosis: 'Appendectomy',
        expectedLOS: 2,
        acuityLevel: 2,
        priority: 'routine',
      };

      const result = bedManagementEngine.processADTEvent(event);
      expect(result.success).toBe(true);
      expect(result.bedId).toBeTruthy();
      expect(result.message).toContain('admitted');

      // Bed should now be occupied
      const beds = bedManagementEngine.getBeds();
      const assignedBed = beds.find(b => b.id === result.bedId);
      expect(assignedBed?.status).toBe(BedStatus.OCCUPIED);
      expect(assignedBed?.patientId).toBe('pt-001');
    });

    it('should fail when no beds available of requested type', () => {
      // Fill all ICU beds
      for (let i = 0; i < 20; i++) {
        bedManagementEngine.processADTEvent({
          id: `adt-fill-${i}`,
          type: ADTEventType.ADMISSION,
          patientId: `pt-fill-${i}`,
          timestamp: new Date().toISOString(),
          bedType: BedType.ICU,
          diagnosis: 'Critical care',
          expectedLOS: 5,
          acuityLevel: 5,
          priority: 'emergent',
        });
      }

      // Try one more ICU admission
      const result = bedManagementEngine.processADTEvent({
        id: 'adt-overflow',
        type: ADTEventType.ADMISSION,
        patientId: 'pt-overflow',
        timestamp: new Date().toISOString(),
        bedType: BedType.ICU,
        diagnosis: 'Critical care',
        expectedLOS: 3,
        acuityLevel: 5,
        priority: 'emergent',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('No available');
    });

    it('should admit to a specific bed when requested', () => {
      const result = bedManagementEngine.processADTEvent({
        id: 'adt-specific',
        type: ADTEventType.ADMISSION,
        patientId: 'pt-specific',
        timestamp: new Date().toISOString(),
        toBedId: 'ICU-01',
        bedType: BedType.ICU,
        diagnosis: 'Post-cardiac surgery',
        expectedLOS: 4,
        acuityLevel: 5,
        priority: 'urgent',
      });

      expect(result.success).toBe(true);
      expect(result.bedId).toBe('ICU-01');
    });
  });

  describe('ADT event processing - discharges', () => {
    it('should successfully discharge a patient', () => {
      // First admit
      bedManagementEngine.processADTEvent({
        id: 'adt-admit-d1',
        type: ADTEventType.ADMISSION,
        patientId: 'pt-discharge-001',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        bedType: BedType.MED_SURG,
        diagnosis: 'Surgery',
        expectedLOS: 2,
        acuityLevel: 3,
        priority: 'routine',
      });

      // Then discharge
      const result = bedManagementEngine.processADTEvent({
        id: 'adt-discharge-d1',
        type: ADTEventType.DISCHARGE,
        patientId: 'pt-discharge-001',
        timestamp: new Date().toISOString(),
        bedType: BedType.MED_SURG,
        diagnosis: 'Surgery',
        expectedLOS: 2,
        acuityLevel: 3,
        priority: 'routine',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('discharged');

      // Bed should be available
      const beds = bedManagementEngine.getBeds();
      const bed = beds.find(b => b.id === result.bedId);
      expect(bed?.status).toBe(BedStatus.AVAILABLE);
      expect(bed?.patientId).toBeUndefined();
    });
  });

  describe('ADT event processing - transfers', () => {
    it('should transfer a patient between bed types', () => {
      // Admit to ICU
      bedManagementEngine.processADTEvent({
        id: 'adt-transfer-admit',
        type: ADTEventType.ADMISSION,
        patientId: 'pt-transfer-001',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        bedType: BedType.ICU,
        diagnosis: 'Post-op monitoring',
        expectedLOS: 5,
        acuityLevel: 4,
        priority: 'urgent',
      });

      // Transfer to step-down
      const result = bedManagementEngine.processADTEvent({
        id: 'adt-transfer-001',
        type: ADTEventType.TRANSFER,
        patientId: 'pt-transfer-001',
        timestamp: new Date().toISOString(),
        bedType: BedType.STEP_DOWN,
        diagnosis: 'Post-op monitoring',
        expectedLOS: 5,
        acuityLevel: 3,
        priority: 'routine',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('transferred');

      // New bed should be in step-down
      const newBed = bedManagementEngine.getBeds().find(b => b.id === result.bedId);
      expect(newBed?.type).toBe(BedType.STEP_DOWN);
      expect(newBed?.patientId).toBe('pt-transfer-001');
    });
  });

  describe('occupancy tracking', () => {
    it('should calculate correct occupancy snapshot', () => {
      // Admit 10 patients
      for (let i = 0; i < 10; i++) {
        bedManagementEngine.processADTEvent({
          id: `adt-occ-${i}`,
          type: ADTEventType.ADMISSION,
          patientId: `pt-occ-${i}`,
          timestamp: new Date().toISOString(),
          bedType: BedType.MED_SURG,
          diagnosis: 'Medical',
          expectedLOS: 3,
          acuityLevel: 2,
          priority: 'routine',
        });
      }

      const snapshot = bedManagementEngine.getOccupancySnapshot();
      expect(snapshot.occupiedBeds).toBe(10);
      expect(snapshot.totalBeds).toBeGreaterThan(100);
      expect(snapshot.availableBeds).toBe(snapshot.totalBeds - 10);
      expect(snapshot.occupancyRate).toBeGreaterThan(0);
      expect(snapshot.capacityStatus).toBe(CapacityStatus.GREEN);

      // Check by-type breakdown
      expect(snapshot.byType[BedType.MED_SURG].occupied).toBe(10);
    });

    it('should report RED capacity status at high occupancy', () => {
      // Fill most beds
      const allBeds = bedManagementEngine.getBeds();
      const target = Math.ceil(allBeds.length * 0.96);

      for (let i = 0; i < target; i++) {
        const bed = allBeds[i];
        bedManagementEngine.processADTEvent({
          id: `adt-cap-${i}`,
          type: ADTEventType.ADMISSION,
          patientId: `pt-cap-${i}`,
          timestamp: new Date().toISOString(),
          toBedId: bed.id,
          bedType: bed.type,
          diagnosis: 'Capacity test',
          expectedLOS: 2,
          acuityLevel: 2,
          priority: 'routine',
        });
      }

      const snapshot = bedManagementEngine.getOccupancySnapshot();
      expect(snapshot.occupancyRate).toBeGreaterThanOrEqual(95);
      expect(snapshot.capacityStatus).toBe(CapacityStatus.RED);
    });
  });

  describe('LOS prediction', () => {
    it('should predict LOS based on diagnosis and patient factors', () => {
      const prediction = bedManagementEngine.predictLOS('Joint replacement', 3, 2, 70);

      expect(prediction.predictedLOS).toBeGreaterThan(0);
      expect(prediction.predictedDischargeDate).toBeTruthy();
      expect(prediction.factors.length).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    it('should predict longer LOS for higher acuity and comorbidities', () => {
      const simple = bedManagementEngine.predictLOS('General surgery', 2, 0, 40);
      const complex = bedManagementEngine.predictLOS('General surgery', 5, 4, 80);

      expect(complex.predictedLOS).toBeGreaterThan(simple.predictedLOS);
    });

    it('should predict longer LOS for elderly patients', () => {
      const young = bedManagementEngine.predictLOS('Hip fracture', 3, 1, 45);
      const elderly = bedManagementEngine.predictLOS('Hip fracture', 3, 1, 80);

      expect(elderly.predictedLOS).toBeGreaterThan(young.predictedLOS);
    });
  });

  describe('capacity forecasting', () => {
    it('should forecast capacity for 24, 48, and 72 hours ahead', () => {
      // Admit some patients first
      for (let i = 0; i < 20; i++) {
        bedManagementEngine.processADTEvent({
          id: `adt-fc-${i}`,
          type: ADTEventType.ADMISSION,
          patientId: `pt-fc-${i}`,
          timestamp: new Date().toISOString(),
          bedType: BedType.MED_SURG,
          diagnosis: 'Medical',
          expectedLOS: 3,
          acuityLevel: 2,
          priority: 'routine',
        });
      }

      const forecast24 = bedManagementEngine.forecastCapacity(24);
      const forecast48 = bedManagementEngine.forecastCapacity(48);
      const forecast72 = bedManagementEngine.forecastCapacity(72);

      expect(forecast24.hoursAhead).toBe(24);
      expect(forecast48.hoursAhead).toBe(48);
      expect(forecast72.hoursAhead).toBe(72);

      // Confidence should decrease with longer forecast horizon
      expect(forecast24.confidence).toBeGreaterThan(forecast72.confidence);

      // Should have by-type breakdown
      expect(Object.keys(forecast24.byType).length).toBeGreaterThan(0);
    });
  });

  describe('surge planning', () => {
    it('should provide RED-level surge plan with appropriate actions', () => {
      const plan = bedManagementEngine.getSurgePlan(CapacityStatus.RED);

      expect(plan.actions.length).toBeGreaterThanOrEqual(5);
      expect(plan.additionalCapacity).toBeGreaterThan(10);
      expect(plan.escalationContacts.length).toBeGreaterThan(0);
      expect(plan.actions.some(a => a.toLowerCase().includes('cancel'))).toBe(true);
      expect(plan.actions.some(a => a.toLowerCase().includes('surge'))).toBe(true);
    });

    it('should provide GREEN-level plan with minimal actions', () => {
      const plan = bedManagementEngine.getSurgePlan(CapacityStatus.GREEN);
      expect(plan.actions.length).toBeGreaterThan(0);
      expect(plan.additionalCapacity).toBe(0);
    });

    it('should escalate appropriately from YELLOW to ORANGE to RED', () => {
      const yellow = bedManagementEngine.getSurgePlan(CapacityStatus.YELLOW);
      const orange = bedManagementEngine.getSurgePlan(CapacityStatus.ORANGE);
      const red = bedManagementEngine.getSurgePlan(CapacityStatus.RED);

      expect(red.additionalCapacity).toBeGreaterThan(orange.additionalCapacity);
      expect(orange.additionalCapacity).toBeGreaterThan(yellow.additionalCapacity);
      expect(red.actions.length).toBeGreaterThan(yellow.actions.length);
    });
  });

  describe('discharge candidates', () => {
    it('should identify discharge candidates by readiness', () => {
      // Admit patients with different expected discharge dates
      const now = new Date();

      // Patient past expected discharge (READY_NOW)
      bedManagementEngine.processADTEvent({
        id: 'adt-dc-ready',
        type: ADTEventType.ADMISSION,
        patientId: 'pt-dc-ready',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        bedType: BedType.MED_SURG,
        diagnosis: 'Surgery',
        expectedLOS: 2,
        acuityLevel: 2,
        priority: 'routine',
      });

      const candidates = bedManagementEngine.getDischargeCandidates();
      expect(candidates.length).toBeGreaterThan(0);

      // Ready-now patients should appear first
      const readyNow = candidates.filter(c => c.readiness === DischargeReadiness.READY_NOW);
      if (readyNow.length > 0) {
        expect(candidates[0].readiness).toBe(DischargeReadiness.READY_NOW);
      }
    });
  });

  describe('bed finding', () => {
    it('should find available bed by type', () => {
      const bed = bedManagementEngine.findAvailableBed(BedType.ICU);
      expect(bed).not.toBeNull();
      expect(bed!.type).toBe(BedType.ICU);
      expect(bed!.status).toBe(BedStatus.AVAILABLE);
    });

    it('should find isolation-capable bed when required', () => {
      const bed = bedManagementEngine.findAvailableBed(BedType.ICU, true);
      expect(bed).not.toBeNull();
      expect(bed!.isolationCapable).toBe(true);
    });

    it('should find telemetry-capable bed when required', () => {
      const bed = bedManagementEngine.findAvailableBed(BedType.MED_SURG, false, true);
      expect(bed).not.toBeNull();
      expect(bed!.telemetryCapable).toBe(true);
    });
  });

  describe('synthetic ADT dataset', () => {
    it('should generate 100+ ADT events', () => {
      const events = bedManagementEngine.generateSyntheticADTEvents(100);
      expect(events.length).toBe(100);

      // Should have mix of event types
      const types = new Set(events.map(e => e.type));
      expect(types.has(ADTEventType.ADMISSION)).toBe(true);
      expect(types.has(ADTEventType.DISCHARGE)).toBe(true);
    });
  });

  describe('self-learning (LOS prediction improvement)', () => {
    it('should improve LOS prediction from historical discharge data', () => {
      // Process several admissions and discharges to build history
      for (let i = 0; i < 10; i++) {
        const admitTime = new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000);
        const actualLOS = 3; // Consistently 3 days
        const dischargeTime = new Date(admitTime.getTime() + actualLOS * 24 * 60 * 60 * 1000);

        bedManagementEngine.processADTEvent({
          id: `adt-learn-a-${i}`,
          type: ADTEventType.ADMISSION,
          patientId: `pt-learn-${i}`,
          timestamp: admitTime.toISOString(),
          bedType: BedType.MED_SURG,
          diagnosis: 'Pneumonia',
          expectedLOS: 5, // Initial prediction of 5
          acuityLevel: 3,
          priority: 'routine',
        });

        bedManagementEngine.processADTEvent({
          id: `adt-learn-d-${i}`,
          type: ADTEventType.DISCHARGE,
          patientId: `pt-learn-${i}`,
          timestamp: dischargeTime.toISOString(),
          bedType: BedType.MED_SURG,
          diagnosis: 'Pneumonia',
          expectedLOS: 5,
          acuityLevel: 3,
          priority: 'routine',
        });
      }

      // New prediction should be closer to actual (3 days) than initial estimate (5 days)
      const prediction = bedManagementEngine.predictLOS('Pneumonia', 3, 0, 60);
      expect(prediction.predictedLOS).toBeLessThan(5);
      expect(prediction.confidence).toBeGreaterThan(0.4);
    });
  });
});
