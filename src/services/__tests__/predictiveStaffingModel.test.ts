import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPredictiveStaffingModel,
  UnitType,
  StaffType,
  ShiftType,
  type PredictiveStaffingModel,
} from '../predictiveStaffingModel';

describe('PredictiveStaffingModel', () => {
  let model: PredictiveStaffingModel;

  beforeEach(() => {
    model = createPredictiveStaffingModel();
  });

  describe('Historical Census Data', () => {
    it('should have 365 days x 7 unit types of historical data', () => {
      const data = model.getHistoricalCensus();
      expect(data.length).toBe(365 * 7);
    });

    it('should contain all 7 unit types in the data', () => {
      const data = model.getHistoricalCensus();
      const unitTypes = new Set(data.map(d => d.unitType));
      expect(unitTypes.size).toBe(7);
      expect(unitTypes.has(UnitType.MED_SURG)).toBe(true);
      expect(unitTypes.has(UnitType.ORTHO)).toBe(true);
      expect(unitTypes.has(UnitType.ICU)).toBe(true);
      expect(unitTypes.has(UnitType.CARDIAC)).toBe(true);
      expect(unitTypes.has(UnitType.STEPDOWN)).toBe(true);
      expect(unitTypes.has(UnitType.PACU)).toBe(true);
      expect(unitTypes.has(UnitType.REHAB)).toBe(true);
    });

    it('should have valid census values', () => {
      const data = model.getHistoricalCensus();
      expect(data.every(d => d.census > 0)).toBe(true);
      expect(data.every(d => d.avgAcuity > 0)).toBe(true);
      expect(data.every(d => d.dayOfWeek >= 0 && d.dayOfWeek <= 6)).toBe(true);
      expect(data.every(d => d.month >= 1 && d.month <= 12)).toBe(true);
    });

    it('should mark holidays', () => {
      const data = model.getHistoricalCensus();
      const holidays = data.filter(d => d.isHoliday);
      expect(holidays.length).toBeGreaterThan(0);
    });
  });

  describe('Census Forecasting', () => {
    it('should forecast census for specified days and unit', () => {
      const forecasts = model.forecastCensus('2025-01-15', 7, UnitType.ORTHO);
      expect(forecasts.length).toBe(7);
      expect(forecasts[0].date).toBe('2025-01-15');
      expect(forecasts[0].predictedCensus).toBeGreaterThan(0);
      expect(forecasts[0].predictedAcuity).toBeGreaterThan(0);
    });

    it('should include confidence intervals', () => {
      const forecasts = model.forecastCensus('2025-02-01', 3, UnitType.MED_SURG);
      for (const f of forecasts) {
        expect(f.confidenceInterval.lower).toBeLessThan(f.predictedCensus);
        expect(f.confidenceInterval.upper).toBeGreaterThan(f.predictedCensus);
      }
    });

    it('should include explanatory factors', () => {
      // January should include flu season factor
      const forecasts = model.forecastCensus('2025-01-15', 1, UnitType.MED_SURG);
      expect(forecasts[0].factors.length).toBeGreaterThan(0);
    });

    it('should predict admissions and discharges', () => {
      const forecasts = model.forecastCensus('2025-03-01', 5, UnitType.CARDIAC);
      for (const f of forecasts) {
        expect(f.predictedAdmissions).toBeGreaterThanOrEqual(0);
        expect(f.predictedDischarges).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Staffing Requirements', () => {
    it('should calculate staffing needs for a forecast', () => {
      const forecasts = model.forecastCensus('2025-01-20', 1, UnitType.ORTHO);
      const staffing = model.calculateStaffingRequirements(forecasts[0], UnitType.ORTHO);
      expect(staffing.unitType).toBe(UnitType.ORTHO);
      expect(staffing.shift).toBe(ShiftType.DAY);
      expect(staffing.totalFTEs).toBeGreaterThan(0);
      expect(staffing.estimatedCost).toBeGreaterThan(0);
      expect(staffing.confidence).toBeGreaterThan(0);
    });

    it('should include all staff types in needs', () => {
      const forecasts = model.forecastCensus('2025-01-20', 1, UnitType.MED_SURG);
      const staffing = model.calculateStaffingRequirements(forecasts[0], UnitType.MED_SURG);
      expect(staffing.staffNeeds[StaffType.RN]).toBeGreaterThan(0);
      expect(staffing.staffNeeds[StaffType.CNA]).toBeGreaterThanOrEqual(0);
      expect(staffing.staffNeeds[StaffType.CHARGE_NURSE]).toBeGreaterThanOrEqual(0);
    });

    it('should require more RNs for ICU than med-surg at same census', () => {
      const forecast = {
        date: '2025-01-20',
        predictedCensus: 10,
        confidenceInterval: { lower: 8, upper: 12 },
        predictedAcuity: 3,
        predictedAdmissions: 3,
        predictedDischarges: 3,
        factors: [],
      };
      const icuStaffing = model.calculateStaffingRequirements(forecast, UnitType.ICU);
      const msStaffing = model.calculateStaffingRequirements(forecast, UnitType.MED_SURG);
      expect(icuStaffing.staffNeeds[StaffType.RN]).toBeGreaterThanOrEqual(msStaffing.staffNeeds[StaffType.RN]);
    });
  });

  describe('Staffing Plan Generation', () => {
    it('should generate a multi-day staffing plan', () => {
      const plan = model.generateStaffingPlan('2025-02-01', 7, UnitType.ORTHO);
      expect(plan.length).toBe(7);
      for (const req of plan) {
        expect(req.predictedCensus).toBeGreaterThan(0);
        expect(req.totalFTEs).toBeGreaterThan(0);
        expect(req.estimatedCost).toBeGreaterThan(0);
      }
    });
  });

  describe('Skill Mix Optimization', () => {
    it('should recommend skill mix for a unit', () => {
      const recommendation = model.optimizeSkillMix(UnitType.ORTHO, 20, 2.5);
      expect(recommendation.unitType).toBe(UnitType.ORTHO);
      expect(recommendation.recommendedMix[StaffType.RN]).toBeGreaterThan(0);
      expect(recommendation.recommendedMix[StaffType.PT]).toBeGreaterThan(0);
      expect(recommendation.rationale).toContain('census of 20');
      expect(recommendation.costImpact).toBeGreaterThan(0);
    });

    it('should have higher PT allocation in rehab than ICU', () => {
      const rehab = model.optimizeSkillMix(UnitType.REHAB, 15, 2);
      const icu = model.optimizeSkillMix(UnitType.ICU, 15, 2);
      expect(rehab.recommendedMix[StaffType.PT]).toBeGreaterThanOrEqual(icu.recommendedMix[StaffType.PT]);
    });
  });

  describe('Budget Impact', () => {
    it('should calculate budget impact for a staffing plan', () => {
      const plan = model.generateStaffingPlan('2025-03-01', 7, UnitType.MED_SURG);
      const budget = model.calculateBudgetImpact(plan);
      expect(budget.regularStaffCost).toBeGreaterThan(0);
      expect(budget.overtimeCost).toBeGreaterThan(0);
      expect(budget.totalCost).toBeGreaterThan(budget.regularStaffCost);
      expect(budget.costPerPatientDay).toBeGreaterThan(0);
      expect(budget.projectedSavings).toBeGreaterThanOrEqual(0);
      expect(budget.period).toContain('2025-03-01');
    });
  });

  describe('Seasonal and Day-of-Week Factors', () => {
    it('should have seasonal factors for all 12 months', () => {
      const factors = model.getSeasonalFactors();
      expect(Object.keys(factors).length).toBe(12);
      // Winter months should be higher than summer
      expect(factors[1]).toBeGreaterThan(factors[7]);
    });

    it('should have day-of-week factors for all 7 days', () => {
      const factors = model.getDayOfWeekFactors();
      expect(Object.keys(factors).length).toBe(7);
      // Weekdays should be higher than weekends
      expect(factors[1]).toBeGreaterThan(factors[0]); // Monday > Sunday
      expect(factors[1]).toBeGreaterThan(factors[6]); // Monday > Saturday
    });
  });

  describe('Agency Staff Prediction', () => {
    it('should predict agency needs by unit and month', () => {
      const needs = model.predictAgencyNeeds(UnitType.MED_SURG, 1);
      expect(needs).toBeGreaterThanOrEqual(0);
    });

    it('should predict higher agency needs in high-season months', () => {
      const winterNeeds = model.predictAgencyNeeds(UnitType.MED_SURG, 1);
      const summerNeeds = model.predictAgencyNeeds(UnitType.MED_SURG, 7);
      expect(winterNeeds).toBeGreaterThanOrEqual(summerNeeds);
    });
  });

  describe('Self-Learning (Forecast Accuracy)', () => {
    it('should start with default accuracy of 1.0', () => {
      expect(model.getForecastAccuracy()).toBe(1.0);
    });

    it('should update accuracy based on recorded outcomes', () => {
      model.recordStaffingOutcome({
        date: '2025-01-15',
        unitType: UnitType.ORTHO,
        predictedCensus: 20,
        actualCensus: 18,
        predictedStaff: 15,
        actualStaff: 14,
        timestamp: new Date().toISOString(),
      });
      model.recordStaffingOutcome({
        date: '2025-01-16',
        unitType: UnitType.ORTHO,
        predictedCensus: 22,
        actualCensus: 21,
        predictedStaff: 16,
        actualStaff: 15,
        timestamp: new Date().toISOString(),
      });

      const accuracy = model.getForecastAccuracy();
      expect(accuracy).toBeGreaterThan(0.5);
      expect(accuracy).toBeLessThanOrEqual(1.0);
    });
  });
});
