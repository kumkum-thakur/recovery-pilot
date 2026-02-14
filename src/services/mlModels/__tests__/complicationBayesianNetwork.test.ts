import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  ComplicationBayesianNetwork,
  createComplicationBayesianNetwork,
  Complication,
  RiskFactor,
  type Evidence,
} from '../complicationBayesianNetwork';

describe('ComplicationBayesianNetwork', () => {
  let network: ComplicationBayesianNetwork;

  beforeEach(() => {
    localStorage.clear();
    network = createComplicationBayesianNetwork();
  });

  // ---- Network Structure Tests ----

  it('should have all 9 complication nodes', () => {
    const complications = network.getComplications();
    expect(complications.length).toBe(9);
  });

  it('should have all 16 risk factor nodes', () => {
    const riskFactors = network.getRiskFactors();
    expect(riskFactors.length).toBe(16);
  });

  it('should have correct parent-child relationships', () => {
    const dvtNode = network.getNode(Complication.DVT);
    expect(dvtNode).toBeDefined();
    expect(dvtNode!.parents).toContain(RiskFactor.IMMOBILITY);
    expect(dvtNode!.parents).toContain(RiskFactor.PRIOR_DVT);

    // DVT is parent of PE
    expect(dvtNode!.children).toContain(Complication.PE);
  });

  it('should have SSI as parent of dehiscence', () => {
    const dehiscenceNode = network.getNode(Complication.DEHISCENCE);
    expect(dehiscenceNode).toBeDefined();
    expect(dehiscenceNode!.parents).toContain(Complication.SSI);
  });

  it('should provide network structure for visualization', () => {
    const structure = network.getNetworkStructure();
    expect(structure.length).toBeGreaterThan(0);
    expect(structure.some(n => n.id === Complication.SSI)).toBe(true);
    expect(structure.some(n => n.id === RiskFactor.DIABETES)).toBe(true);
  });

  // ---- Prior Probability Tests ----

  it('should return reasonable prior probabilities for complications', () => {
    const ssi = network.getNode(Complication.SSI);
    expect(ssi!.priorProbability).toBeGreaterThan(0.01);
    expect(ssi!.priorProbability).toBeLessThan(0.10);

    const dvt = network.getNode(Complication.DVT);
    expect(dvt!.priorProbability).toBeGreaterThan(0.005);
    expect(dvt!.priorProbability).toBeLessThan(0.05);
  });

  // ---- Inference Tests ----

  it('should query SSI probability with no evidence', () => {
    const result = network.queryComplication(Complication.SSI, []);
    expect(result.probabilityTrue).toBeGreaterThan(0);
    expect(result.probabilityTrue).toBeLessThan(0.5);
    expect(result.probabilityTrue + result.probabilityFalse).toBeCloseTo(1, 1);
  });

  it('should increase SSI probability with diabetes and obesity evidence', () => {
    const noEvidence = network.queryComplication(Complication.SSI, []);
    const withRiskFactors = network.queryComplication(Complication.SSI, [
      { variable: RiskFactor.DIABETES, value: true },
      { variable: RiskFactor.OBESITY, value: true },
    ]);
    expect(withRiskFactors.probabilityTrue).toBeGreaterThan(noEvidence.probabilityTrue);
    expect(withRiskFactors.riskMultiplier).toBeGreaterThan(1);
  });

  it('should significantly increase PE probability when DVT is observed', () => {
    const withoutDVT = network.queryComplication(Complication.PE, [
      { variable: Complication.DVT, value: false },
    ]);
    const withDVT = network.queryComplication(Complication.PE, [
      { variable: Complication.DVT, value: true },
    ]);
    expect(withDVT.probabilityTrue).toBeGreaterThan(withoutDVT.probabilityTrue * 5);
  });

  it('should increase pneumonia risk with COPD and smoking', () => {
    const baseline = network.queryComplication(Complication.PNEUMONIA, []);
    const withRisk = network.queryComplication(Complication.PNEUMONIA, [
      { variable: RiskFactor.COPD, value: true },
      { variable: RiskFactor.SMOKING, value: true },
      { variable: RiskFactor.GENERAL_ANESTHESIA, value: true },
    ]);
    expect(withRisk.probabilityTrue).toBeGreaterThan(baseline.probabilityTrue);
  });

  it('should increase AKI risk with renal disease and heart failure', () => {
    const baseline = network.queryComplication(Complication.AKI, []);
    const withRisk = network.queryComplication(Complication.AKI, [
      { variable: RiskFactor.RENAL_DISEASE, value: true },
      { variable: RiskFactor.HEART_FAILURE, value: true },
      { variable: RiskFactor.AGE_OVER_75, value: true },
    ]);
    expect(withRisk.probabilityTrue).toBeGreaterThan(baseline.probabilityTrue);
    expect(withRisk.riskMultiplier).toBeGreaterThan(1.5);
  });

  // ---- Full Query Tests ----

  it('should query all complications at once', () => {
    const evidence: Evidence[] = [
      { variable: RiskFactor.AGE_OVER_65, value: true },
      { variable: RiskFactor.DIABETES, value: true },
      { variable: RiskFactor.MAJOR_SURGERY, value: true },
    ];
    const result = network.queryAllComplications(evidence);

    expect(result.complications.length).toBe(9);
    expect(result.highestRiskComplication).toBeDefined();
    expect(result.overallRiskScore).toBeGreaterThan(0);
    expect(['low', 'moderate', 'high', 'critical']).toContain(result.riskLevel);
  });

  it('should sort complications by probability in full query', () => {
    const result = network.queryAllComplications([
      { variable: RiskFactor.IMMOBILITY, value: true },
      { variable: RiskFactor.MAJOR_SURGERY, value: true },
    ]);

    for (let i = 1; i < result.complications.length; i++) {
      expect(result.complications[i - 1].probabilityTrue)
        .toBeGreaterThanOrEqual(result.complications[i].probabilityTrue);
    }
  });

  it('should have higher overall risk with multiple risk factors', () => {
    const low = network.queryAllComplications([]);
    const high = network.queryAllComplications([
      { variable: RiskFactor.AGE_OVER_75, value: true },
      { variable: RiskFactor.DIABETES, value: true },
      { variable: RiskFactor.OBESITY, value: true },
      { variable: RiskFactor.SMOKING, value: true },
      { variable: RiskFactor.MAJOR_SURGERY, value: true },
      { variable: RiskFactor.IMMOBILITY, value: true },
    ]);
    expect(high.overallRiskScore).toBeGreaterThan(low.overallRiskScore);
  });

  // ---- Variable Elimination Tests ----

  it('should perform variable elimination for simple query', () => {
    const result = network.variableElimination(RiskFactor.DIABETES, []);
    expect(result.probabilityTrue).toBeGreaterThan(0);
    expect(result.probabilityTrue + result.probabilityFalse).toBeCloseTo(1, 1);
  });

  it('should perform variable elimination for risk factor with evidence', () => {
    const result = network.variableElimination(RiskFactor.DIABETES, [
      { variable: RiskFactor.DIABETES, value: true },
    ]);
    // With direct evidence, should be 1.0
    expect(result.probabilityTrue).toBeCloseTo(1.0, 0);
  });

  // ---- Self-Learning Tests ----

  it('should record complication observations', () => {
    network.recordObservation(
      [{ variable: RiskFactor.DIABETES, value: true }],
      Complication.SSI,
      true
    );
    const stats = network.getObservationStats();
    expect(stats.totalObservations).toBe(1);
  });

  it('should update CPTs based on observed rates', () => {
    const initialResult = network.queryComplication(Complication.SSI, [
      { variable: RiskFactor.DIABETES, value: true },
    ]);

    // Record many observations where SSI occurs more than predicted
    for (let i = 0; i < 15; i++) {
      network.recordObservation(
        [{ variable: RiskFactor.DIABETES, value: true }],
        Complication.SSI,
        true // always occurred
      );
    }

    const updatedResult = network.queryComplication(Complication.SSI, [
      { variable: RiskFactor.DIABETES, value: true },
    ]);

    // After many positive observations, probability should increase
    expect(updatedResult.probabilityTrue).toBeGreaterThanOrEqual(initialResult.probabilityTrue);
  });

  it('should persist observations to localStorage', () => {
    network.recordObservation([], Complication.DVT, false);
    const network2 = createComplicationBayesianNetwork();
    expect(network2.getObservations().length).toBe(1);
  });

  it('should compute complication rates from observations', () => {
    network.recordObservation([], Complication.SSI, true);
    network.recordObservation([], Complication.SSI, false);
    network.recordObservation([], Complication.SSI, true);

    const stats = network.getObservationStats();
    expect(stats.complicationRates[Complication.SSI].total).toBe(3);
    expect(stats.complicationRates[Complication.SSI].rate).toBeCloseTo(2 / 3, 2);
  });

  it('should reset learning state', () => {
    network.recordObservation([], Complication.SSI, true);
    network.resetLearning();
    expect(network.getObservations().length).toBe(0);
  });

  // ---- Property-Based Tests ----

  it('should always produce probabilities between 0 and 1', () => {
    const allComplications = Object.values(Complication);
    const allRiskFactors = Object.values(RiskFactor);

    fc.assert(
      fc.property(
        fc.constantFrom(...allComplications),
        fc.subarray(allRiskFactors, { minLength: 0, maxLength: 5 }),
        (complication, riskFactors) => {
          const evidence: Evidence[] = riskFactors.map(rf => ({ variable: rf, value: true }));
          const result = network.queryComplication(complication, evidence);
          return result.probabilityTrue >= 0 && result.probabilityTrue <= 1;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should have probabilities that sum to approximately 1', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(Complication)),
        fc.subarray(Object.values(RiskFactor), { minLength: 0, maxLength: 3 }),
        (complication, riskFactors) => {
          const evidence: Evidence[] = riskFactors.map(rf => ({ variable: rf, value: true }));
          const result = network.queryComplication(complication, evidence);
          const sum = result.probabilityTrue + result.probabilityFalse;
          return Math.abs(sum - 1.0) < 0.01;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should always have non-negative risk multiplier', () => {
    const allComplications = Object.values(Complication);
    for (const comp of allComplications) {
      const result = network.queryComplication(comp, [
        { variable: RiskFactor.AGE_OVER_65, value: true },
      ]);
      expect(result.riskMultiplier).toBeGreaterThanOrEqual(0);
    }
  });

  // ---- Medical Literature Validation ----

  it('should have DVT prior between 0.5% and 5% (consistent with literature)', () => {
    const dvt = network.getNode(Complication.DVT);
    expect(dvt!.priorProbability).toBeGreaterThanOrEqual(0.005);
    expect(dvt!.priorProbability).toBeLessThanOrEqual(0.05);
  });

  it('should have pneumonia prior between 1% and 5%', () => {
    const pneumonia = network.getNode(Complication.PNEUMONIA);
    expect(pneumonia!.priorProbability).toBeGreaterThanOrEqual(0.01);
    expect(pneumonia!.priorProbability).toBeLessThanOrEqual(0.05);
  });

  it('should show prior_DVT is a strong predictor of DVT', () => {
    const withoutHistory = network.queryComplication(Complication.DVT, []);
    const withHistory = network.queryComplication(Complication.DVT, [
      { variable: RiskFactor.PRIOR_DVT, value: true },
    ]);
    // Prior DVT should substantially increase risk
    expect(withHistory.probabilityTrue).toBeGreaterThan(withoutHistory.probabilityTrue * 2);
  });
});
