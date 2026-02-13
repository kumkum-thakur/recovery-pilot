import { describe, it, expect, beforeEach } from 'vitest';
import {
  RecoveryPredictionModel,
  createTrainedModel,
  getTrainingData,
  generatePatientData,
  SurgeryType,
  RecoveryOutcome,
  sigmoid,
  softmax,
} from '../recoveryPredictionModel';

describe('RecoveryPredictionModel', () => {
  describe('model initialization', () => {
    it('should create an untrained model with default hyperparameters', () => {
      const model = new RecoveryPredictionModel();
      expect(model.isTrained()).toBe(false);
      expect(model.getTrainedAt()).toBeNull();
      expect(model.getTrainingMetrics()).toBeNull();

      const params = model.getHyperparams();
      expect(params.learningRate).toBe(0.01);
      expect(params.epochs).toBe(500);
      expect(params.regularizationStrength).toBe(0.001);
    });

    it('should accept custom hyperparameters', () => {
      const model = new RecoveryPredictionModel({
        learningRate: 0.05,
        epochs: 100,
      });
      const params = model.getHyperparams();
      expect(params.learningRate).toBe(0.05);
      expect(params.epochs).toBe(100);
      // Defaults should still be there for unspecified params
      expect(params.regularizationStrength).toBe(0.001);
    });

    it('should expose feature names and baseline recovery days', () => {
      const model = new RecoveryPredictionModel();
      const featureNames = model.getFeatureNames();
      expect(featureNames.length).toBeGreaterThan(0);
      expect(featureNames).toContain('age_normalized');
      expect(featureNames).toContain('compliance_rate');

      const baselines = model.getBaselineRecoveryDays();
      expect(baselines[SurgeryType.KNEE_REPLACEMENT]).toBe(90);
      expect(baselines[SurgeryType.APPENDECTOMY]).toBe(21);
    });
  });

  describe('training', () => {
    it('should train successfully on embedded synthetic data', () => {
      const model = new RecoveryPredictionModel({ epochs: 50 });
      const { metrics, lossHistory } = model.train();

      expect(model.isTrained()).toBe(true);
      expect(model.getTrainedAt()).toBeTruthy();
      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(metrics.sampleSize).toBe(120);
      expect(lossHistory.length).toBeGreaterThan(0);
      // Loss should generally decrease
      expect(lossHistory[lossHistory.length - 1]).toBeLessThanOrEqual(lossHistory[0]);
    });

    it('should throw when training with insufficient data', () => {
      const model = new RecoveryPredictionModel();
      const tinyData = generatePatientData(5, 99);
      expect(() => model.train(tinyData)).toThrow('Insufficient training data');
    });

    it('should train on custom data', () => {
      const model = new RecoveryPredictionModel({ epochs: 30 });
      const customData = generatePatientData(50, 123);
      const { metrics } = model.train(customData);

      expect(model.isTrained()).toBe(true);
      expect(metrics.sampleSize).toBe(50);
      expect(metrics.accuracy).toBeGreaterThan(0);
    });
  });

  describe('prediction', () => {
    let model: RecoveryPredictionModel;

    beforeEach(() => {
      model = new RecoveryPredictionModel({ epochs: 50 });
      model.train();
    });

    it('should throw when predicting with an untrained model', () => {
      const untrainedModel = new RecoveryPredictionModel();
      expect(() =>
        untrainedModel.predict({
          age: 55,
          bmi: 25,
          surgeryType: SurgeryType.KNEE_REPLACEMENT,
          comorbidities: {
            diabetes: false,
            hypertension: false,
            obesity: false,
            smoking: false,
            heartDisease: false,
            osteoporosis: false,
            immunocompromised: false,
          },
          complianceRate: 0.8,
          woundHealingScore: 7,
          daysSinceSurgery: 14,
          painLevel: 4,
          physicalTherapySessions: 4,
          sleepQualityScore: 7,
        }),
      ).toThrow('Model must be trained');
    });

    it('should generate a prediction with all expected fields', () => {
      const result = model.predict({
        age: 55,
        bmi: 25,
        surgeryType: SurgeryType.KNEE_REPLACEMENT,
        comorbidities: {
          diabetes: false,
          hypertension: false,
          obesity: false,
          smoking: false,
          heartDisease: false,
          osteoporosis: false,
          immunocompromised: false,
        },
        complianceRate: 0.85,
        woundHealingScore: 7,
        daysSinceSurgery: 14,
        painLevel: 3,
        physicalTherapySessions: 4,
        sleepQualityScore: 8,
      });

      expect(result.outcome).toBeDefined();
      expect(Object.values(RecoveryOutcome)).toContain(result.outcome);
      expect(result.estimatedRecoveryDays).toBeGreaterThan(0);
      expect(result.confidenceInterval.lower).toBeLessThanOrEqual(result.estimatedRecoveryDays);
      expect(result.confidenceInterval.upper).toBeGreaterThanOrEqual(result.estimatedRecoveryDays);
      expect(result.confidenceInterval.confidenceLevel).toBe(0.95);

      // Probabilities should sum to approximately 1
      const probSum = Object.values(result.probabilities).reduce((a, b) => a + b, 0);
      expect(probSum).toBeCloseTo(1.0, 1);

      expect(result.featureImportance).toBeDefined();
      expect(Object.keys(result.featureImportance).length).toBeGreaterThan(0);
    });

    it('should identify risk factors for high-risk patients', () => {
      const result = model.predict({
        age: 72,
        bmi: 36,
        surgeryType: SurgeryType.CARDIAC_BYPASS,
        comorbidities: {
          diabetes: true,
          hypertension: true,
          obesity: true,
          smoking: true,
          heartDisease: true,
          osteoporosis: false,
          immunocompromised: false,
        },
        complianceRate: 0.3,
        woundHealingScore: 3,
        daysSinceSurgery: 7,
        painLevel: 8,
        physicalTherapySessions: 1,
        sleepQualityScore: 3,
      });

      expect(result.riskFactors.length).toBeGreaterThan(0);
      // Should flag multiple risk factors for this high-risk patient
      const riskTexts = result.riskFactors.join(' ');
      expect(riskTexts).toContain('Diabetes');
      expect(riskTexts).toContain('Smoking');
    });
  });

  describe('convenience functions', () => {
    it('createTrainedModel should return a trained model with metrics', () => {
      const { model, metrics, lossHistory } = createTrainedModel({ epochs: 30 });
      expect(model.isTrained()).toBe(true);
      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(lossHistory.length).toBeGreaterThan(0);
    });

    it('getTrainingData should return the embedded 120-record dataset', () => {
      const data = getTrainingData();
      expect(data.length).toBe(120);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('surgeryType');
      expect(data[0]).toHaveProperty('outcome');
    });

    it('generatePatientData should produce deterministic data with a seed', () => {
      const data1 = generatePatientData(20, 42);
      const data2 = generatePatientData(20, 42);
      expect(data1).toEqual(data2);

      const data3 = generatePatientData(20, 99);
      expect(data3[0].age).not.toEqual(data1[0].age);
    });

    it('sigmoid should return values between 0 and 1', () => {
      expect(sigmoid(0)).toBeCloseTo(0.5);
      expect(sigmoid(100)).toBeCloseTo(1.0, 3);
      expect(sigmoid(-100)).toBeCloseTo(0.0, 3);
    });

    it('softmax should produce a valid probability distribution', () => {
      const probs = softmax([1, 2, 3]);
      const sum = probs.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
      // Values should be in ascending order since inputs are ascending
      expect(probs[2]).toBeGreaterThan(probs[1]);
      expect(probs[1]).toBeGreaterThan(probs[0]);
    });
  });
});
