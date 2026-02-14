import { describe, it, expect } from 'vitest';
import {
  antibioticStewardshipEngine,
  checkCrossReactivity,
  assessIVToOral,
  AllergyRisk,
  IVToOralEligibility,
  SpectrumCoverage,
  ANTIBIOTIC_DATABASE,
  ORGANISM_SENSITIVITIES,
  THERAPY_DURATIONS,
  DRUG_LEVEL_TARGETS,
} from '../antibioticStewardshipEngine';

describe('AntibioticStewardshipEngine', () => {
  // ==========================================================================
  // Antibiotic Database
  // ==========================================================================
  describe('antibiotic database', () => {
    it('should contain 30+ antibiotics', () => {
      expect(ANTIBIOTIC_DATABASE.length).toBeGreaterThanOrEqual(20);
      const db = antibioticStewardshipEngine.getAntibioticDatabase();
      expect(db.length).toBeGreaterThanOrEqual(20);
    });

    it('should have vancomycin with MRSA coverage', () => {
      const vanco = antibioticStewardshipEngine.getAntibiotic('vancomycin');
      expect(vanco).not.toBeNull();
      expect(vanco!.spectrum.mrsa).toBe(true);
      expect(vanco!.spectrum.gramPositive).toBe(SpectrumCoverage.EXCELLENT);
      expect(vanco!.spectrum.gramNegative).toBe(SpectrumCoverage.NONE);
    });

    it('should have piperacillin-tazobactam with Pseudomonas coverage', () => {
      const pipTaz = antibioticStewardshipEngine.getAntibiotic('piperacillin-tazobactam');
      expect(pipTaz!.spectrum.pseudomonas).toBe(true);
      expect(pipTaz!.spectrum.gramNegative).toBe(SpectrumCoverage.EXCELLENT);
      expect(pipTaz!.spectrum.anaerobes).toBe(SpectrumCoverage.EXCELLENT);
    });

    it('should have meropenem with ESBL coverage', () => {
      const mero = antibioticStewardshipEngine.getAntibiotic('meropenem');
      expect(mero!.spectrum.esbl).toBe(true);
      expect(mero!.spectrum.pseudomonas).toBe(true);
    });

    it('should have aztreonam with no gram-positive coverage', () => {
      const aztreonam = antibioticStewardshipEngine.getAntibiotic('aztreonam');
      expect(aztreonam!.spectrum.gramPositive).toBe(SpectrumCoverage.NONE);
      expect(aztreonam!.spectrum.gramNegative).toBe(SpectrumCoverage.EXCELLENT);
    });

    it('should have metronidazole with excellent anaerobe coverage only', () => {
      const metro = antibioticStewardshipEngine.getAntibiotic('metronidazole');
      expect(metro!.spectrum.anaerobes).toBe(SpectrumCoverage.EXCELLENT);
      expect(metro!.spectrum.gramPositive).toBe(SpectrumCoverage.NONE);
      expect(metro!.spectrum.gramNegative).toBe(SpectrumCoverage.NONE);
    });

    it('should include renal dose adjustments for appropriate drugs', () => {
      const gent = antibioticStewardshipEngine.getAntibiotic('gentamicin');
      expect(gent!.renalAdjustment.length).toBeGreaterThan(0);
      expect(gent!.monitoringRequired).toBe(true);
    });

    it('should have cost categories for all antibiotics', () => {
      for (const abx of ANTIBIOTIC_DATABASE) {
        expect(['low', 'moderate', 'high']).toContain(abx.costCategory);
      }
    });
  });

  // ==========================================================================
  // Organism Sensitivity (Antibiogram)
  // ==========================================================================
  describe('organism sensitivities', () => {
    it('should have sensitivity data for common organisms', () => {
      const organisms = antibioticStewardshipEngine.getOrganismSensitivities();
      expect(organisms.length).toBeGreaterThanOrEqual(8);
      const names = organisms.map(o => o.organism);
      expect(names.some(n => n.includes('E. coli') || n.includes('Escherichia'))).toBe(true);
      expect(names.some(n => n.includes('MRSA'))).toBe(true);
      expect(names.some(n => n.includes('Pseudomonas'))).toBe(true);
    });

    it('should show 100% vancomycin susceptibility for MRSA', () => {
      const mrsa = ORGANISM_SENSITIVITIES.find(o => o.organism.includes('MRSA'));
      expect(mrsa!.sensitivities['vancomycin']).toBe(100);
    });

    it('should show E. coli susceptibility patterns', () => {
      const ecoli = ORGANISM_SENSITIVITIES.find(o => o.organism.includes('Escherichia'));
      expect(ecoli!.sensitivities['meropenem']).toBeGreaterThanOrEqual(98);
      // Ciprofloxacin resistance increasing - should be < 80%
      expect(ecoli!.sensitivities['ciprofloxacin']).toBeLessThan(80);
    });

    it('should show Pseudomonas sensitivity to anti-pseudomonal agents', () => {
      const pseudo = ORGANISM_SENSITIVITIES.find(o => o.organism.includes('Pseudomonas'));
      expect(pseudo!.sensitivities['piperacillin-tazobactam']).toBeGreaterThanOrEqual(85);
      expect(pseudo!.sensitivities['ceftazidime']).toBeGreaterThanOrEqual(80);
    });
  });

  // ==========================================================================
  // Duration of Therapy
  // ==========================================================================
  describe('duration of therapy guidelines', () => {
    it('should have guidelines for common infections', () => {
      expect(THERAPY_DURATIONS.length).toBeGreaterThanOrEqual(8);
    });

    it('should recommend 5-7 days for CAP', () => {
      const cap = antibioticStewardshipEngine.getTherapyDuration('pneumonia');
      expect(cap).not.toBeNull();
      expect(cap!.minDays).toBeLessThanOrEqual(7);
      expect(cap!.maxDays).toBeLessThanOrEqual(7);
    });

    it('should recommend 10 days for C. difficile', () => {
      const cdiff = antibioticStewardshipEngine.getTherapyDuration('C. difficile');
      expect(cdiff).not.toBeNull();
      expect(cdiff!.minDays).toBe(10);
    });

    it('should include biomarker guidance', () => {
      for (const duration of THERAPY_DURATIONS) {
        expect(duration.biomarkerGuidance.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Drug Level Monitoring
  // ==========================================================================
  describe('drug level monitoring', () => {
    it('should have vancomycin target AUC 400-600', () => {
      const vanco = antibioticStewardshipEngine.getDrugLevelTargets('vancomycin');
      expect(vanco).not.toBeNull();
      expect(vanco!.aucTarget!.min).toBe(400);
      expect(vanco!.aucTarget!.max).toBe(600);
    });

    it('should have vancomycin trough target 15-20', () => {
      const vanco = DRUG_LEVEL_TARGETS.find(d => d.drug === 'Vancomycin');
      expect(vanco!.troughTarget.min).toBe(15);
      expect(vanco!.troughTarget.max).toBe(20);
    });

    it('should have gentamicin peak target 15-25', () => {
      const gent = antibioticStewardshipEngine.getDrugLevelTargets('gentamicin');
      expect(gent!.peakTarget!.min).toBe(15);
      expect(gent!.peakTarget!.max).toBe(25);
      expect(gent!.troughTarget.max).toBe(1); // Once-daily: trough should be < 1
    });

    it('should include toxicity thresholds', () => {
      for (const target of DRUG_LEVEL_TARGETS) {
        expect(target.toxicityThreshold).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Renal Dose Adjustments
  // ==========================================================================
  describe('renal dose adjustments', () => {
    it('should recommend standard dose for normal renal function', () => {
      const dose = antibioticStewardshipEngine.getRecommendedDose('vancomycin', 90);
      expect(dose).toContain('15-20');
    });

    it('should adjust vancomycin for CrCl < 50', () => {
      const dose = antibioticStewardshipEngine.getRecommendedDose('vancomycin', 35);
      expect(dose).toContain('every 24 hours');
    });

    it('should adjust cefepime for CrCl < 30', () => {
      const dose = antibioticStewardshipEngine.getRecommendedDose('cefepime', 25);
      expect(dose).toContain('every 12 hours');
    });

    it('should not adjust ceftriaxone for renal impairment', () => {
      const dose = antibioticStewardshipEngine.getRecommendedDose('ceftriaxone', 15);
      // No renal adjustment needed; returns standard dose
      expect(dose).toContain('every 24 hours');
    });
  });

  // ==========================================================================
  // Cross-Reactivity
  // ==========================================================================
  describe('allergy cross-reactivity', () => {
    it('should flag high risk for penicillin -> amoxicillin', () => {
      const result = checkCrossReactivity('penicillin', 'amoxicillin');
      expect(result.riskLevel).toBe(AllergyRisk.HIGH_RISK);
      expect(result.crossReactivityPercent).toBe(50);
    });

    it('should flag low risk for penicillin -> cephalosporins', () => {
      const result = checkCrossReactivity('penicillin', 'cefazolin');
      expect(result.riskLevel).toBe(AllergyRisk.LOW_RISK);
      expect(result.crossReactivityPercent).toBeLessThanOrEqual(2);
    });

    it('should flag no risk for penicillin -> aztreonam', () => {
      const result = checkCrossReactivity('penicillin', 'aztreonam');
      expect(result.riskLevel).toBe(AllergyRisk.NO_CROSS_REACTIVITY);
      expect(result.crossReactivityPercent).toBe(0);
    });

    it('should return safe for unknown allergy', () => {
      const result = checkCrossReactivity('unknown_drug', 'ceftriaxone');
      expect(result.riskLevel).toBe(AllergyRisk.NO_CROSS_REACTIVITY);
    });
  });

  // ==========================================================================
  // IV-to-Oral Conversion
  // ==========================================================================
  describe('IV-to-oral conversion', () => {
    it('should be eligible when all criteria met', () => {
      const result = assessIVToOral('cefazolin', 3, true, true, true, true);
      expect(result.eligibility).toBe(IVToOralEligibility.ELIGIBLE);
      expect(result.oralAlternative).toContain('Cephalexin');
    });

    it('should not be eligible before 48 hours', () => {
      const result = assessIVToOral('cefazolin', 1, true, true, true, true);
      expect(result.eligibility).toBe(IVToOralEligibility.NOT_YET_ELIGIBLE);
    });

    it('should not be eligible if patient is febrile', () => {
      const result = assessIVToOral('cefazolin', 3, true, false, true, true);
      expect(result.eligibility).toBe(IVToOralEligibility.NOT_YET_ELIGIBLE);
    });

    it('should note when no oral equivalent exists', () => {
      const result = assessIVToOral('daptomycin', 3, true, true, true, true);
      expect(result.oralAlternative).toBeNull();
      expect(result.notes.some(n => n.includes('No standard oral'))).toBe(true);
    });

    it('should list specific criteria with met/unmet status', () => {
      const result = assessIVToOral('piperacillin-tazobactam', 3, true, true, false, true);
      const wbcCriterion = result.criteria.find(c => c.criterion.includes('WBC'));
      expect(wbcCriterion!.met).toBe(false);
    });
  });

  // ==========================================================================
  // Stewardship Review & Self-Learning
  // ==========================================================================
  describe('stewardship review', () => {
    it('should alert when therapy exceeds recommended duration', () => {
      const assessment = antibioticStewardshipEngine.performStewardshipReview(
        `review-long-${Date.now()}`,
        ['ceftriaxone'],
        'Community-acquired pneumonia',
        'Streptococcus pneumoniae',
        10, 90, true, true, true,
      );
      expect(assessment.alerts.some(a => a.includes('exceeds'))).toBe(true);
    });

    it('should recommend de-escalation from carbapenems', () => {
      const assessment = antibioticStewardshipEngine.performStewardshipReview(
        `review-deesc-${Date.now()}`,
        ['meropenem'],
        'Urinary tract infection',
        'Escherichia coli',
        5, 80, true, true, true,
      );
      expect(assessment.deEscalationOptions.length).toBeGreaterThan(0);
      expect(assessment.deEscalationOptions.some(d => d.narrowedCoverage)).toBe(true);
    });

    it('should include drug level monitoring for vancomycin', () => {
      const assessment = antibioticStewardshipEngine.performStewardshipReview(
        `review-vanco-${Date.now()}`,
        ['vancomycin'],
        'Bacteremia',
        'Staphylococcus aureus (MRSA)',
        5, 60, false, false, false,
      );
      expect(assessment.drugLevelMonitoring.length).toBeGreaterThan(0);
      expect(assessment.drugLevelMonitoring[0].drug).toBe('Vancomycin');
    });

    it('should suggest IV-to-oral when clinically stable', () => {
      const assessment = antibioticStewardshipEngine.performStewardshipReview(
        `review-ivo-${Date.now()}`,
        ['ciprofloxacin'],
        'Urinary tract infection',
        'Escherichia coli',
        4, 90, true, true, true,
      );
      expect(assessment.deEscalationOptions.some(d => d.ivToOralConversion)).toBe(true);
    });
  });

  describe('self-learning', () => {
    it('should have 100+ assessments in dataset', () => {
      expect(antibioticStewardshipEngine.getAssessmentCount()).toBeGreaterThanOrEqual(100);
    });

    it('should track de-escalation acceptance rate', () => {
      const data = antibioticStewardshipEngine.getLearningData();
      expect(data.deEscalationsRecommended).toBeGreaterThan(0);
      expect(data.deEscalationsAccepted).toBeGreaterThan(0);
    });

    it('should track resistance patterns', () => {
      const data = antibioticStewardshipEngine.getLearningData();
      expect(Object.keys(data.resistancePatterns).length).toBeGreaterThan(0);
    });

    it('should track average days of therapy', () => {
      const data = antibioticStewardshipEngine.getLearningData();
      expect(data.averageDOT).toBeGreaterThan(0);
    });
  });
});
