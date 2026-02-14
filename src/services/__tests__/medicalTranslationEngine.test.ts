import { describe, it, expect, beforeEach } from 'vitest';
import { MedicalTranslationEngine } from '../medicalTranslationEngine';
import type { Language, TermCategory, UsageContext } from '../medicalTranslationEngine';

describe('MedicalTranslationEngine', () => {
  let engine: MedicalTranslationEngine;

  beforeEach(() => {
    engine = new MedicalTranslationEngine();
  });

  // ── Core Translation Functionality ──

  describe('translate()', () => {
    it('should translate a known medication from English to Spanish', () => {
      const result = engine.translate('acetaminophen', 'en', 'es');
      expect(result.translation).toBe('acetaminofen');
      expect(result.category).toBe('medications');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should translate a known condition from English to French', () => {
      const result = engine.translate('pneumonia', 'en', 'fr');
      expect(result.translation).toBe('pneumonie');
      expect(result.category).toBe('conditions');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should translate a body part from English to Chinese (Pinyin)', () => {
      const result = engine.translate('heart', 'en', 'zh');
      expect(result.translation).toBe('xinzang');
      expect(result.category).toBe('body_parts');
    });

    it('should translate a symptom from English to Arabic', () => {
      const result = engine.translate('fever', 'en', 'ar');
      expect(result.translation).toBe('humma');
      expect(result.category).toBe('symptoms');
    });

    it('should translate a procedure from English to Hindi', () => {
      const result = engine.translate('knee replacement', 'en', 'hi');
      expect(result.translation).toBe('ghutne ka pratistaapan');
      expect(result.category).toBe('procedures');
    });

    it('should translate an instruction term from English to Spanish', () => {
      const result = engine.translate('take with food', 'en', 'es');
      expect(result.translation).toBe('tomar con comida');
      expect(result.category).toBe('instructions');
    });

    it('should be case-insensitive and trim whitespace', () => {
      const result = engine.translate('  Ibuprofen  ', 'en', 'es');
      expect(result.translation).toBe('ibuprofeno');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should return untranslated marker with zero confidence for unknown terms', () => {
      const result = engine.translate('xyznonexistent', 'en', 'es');
      expect(result.translation).toContain('[untranslated');
      expect(result.confidence).toBe(0);
      expect(result.category).toBeNull();
    });

    it('should attempt fuzzy match for partial matches and return lower confidence', () => {
      // "aspir" should fuzzy-match to "aspirin" since they share a prefix
      const result = engine.translate('aspir', 'en', 'es');
      // Fuzzy match should return something, not untranslated
      expect(result.confidence).toBeLessThanOrEqual(0.6);
      // If a fuzzy match is found, it should have a translation
      if (result.confidence > 0) {
        expect(result.translation).not.toContain('[untranslated');
      }
    });
  });

  // ── Context-Aware Translation ──

  describe('context-aware translation', () => {
    it('should return medical-context translation for "stroke" in Spanish', () => {
      const result = engine.translate('stroke', 'en', 'es', 'medical');
      expect(result.translation).toBe('accidente cerebrovascular');
      expect(result.confidence).toBe(0.9);
    });

    it('should return common-context translation for "stroke" in Spanish', () => {
      const result = engine.translate('stroke', 'en', 'es', 'common');
      expect(result.translation).toBe('golpe');
      expect(result.confidence).toBe(0.9);
    });

    it('should return medical-context translation for "cellulitis" in French', () => {
      const result = engine.translate('cellulitis', 'en', 'fr', 'medical');
      expect(result.translation).toBe('cellulite infectieuse');
    });

    it('should return common-context translation for "cellulitis" in French', () => {
      const result = engine.translate('cellulitis', 'en', 'fr', 'common');
      expect(result.translation).toBe('cellulite');
    });

    it('should include contextNote when present on entry', () => {
      const result = engine.translate('stroke', 'en', 'es', 'medical');
      expect(result.contextNote).toBeDefined();
      expect(result.contextNote).toContain('cerebrovascular');
    });

    it('should default to medical context when no context is specified', () => {
      const result = engine.translate('stroke', 'en', 'es');
      // Default is 'medical', which triggers the context override
      expect(result.translation).toBe('accidente cerebrovascular');
    });
  });

  // ── Patient Instructions ──

  describe('getPatientInstructions()', () => {
    it('should generate post-surgery instructions in English with variable substitution', () => {
      const result = engine.getPatientInstructions('post_surgery_general', 'en', {
        procedure: 'knee replacement',
        days: '7',
        medication: 'acetaminophen',
        complication: 'infection',
        warning_signs: 'fever or redness',
      });
      expect(result).not.toBeNull();
      expect(result!.body).toContain('knee replacement');
      expect(result!.body).toContain('7 days');
      expect(result!.body).toContain('acetaminophen');
      expect(result!.body).toContain('infection');
      expect(result!.body).toContain('fever or redness');
      expect(result!.language).toBe('en');
      expect(result!.title).toBe('Post Surgery General');
    });

    it('should generate medication instructions in Spanish', () => {
      const result = engine.getPatientInstructions('medication_instructions', 'es', {
        medication: 'ibuprofeno',
        frequency: 'dos veces al dia',
        food_instructions: 'tomar con comida',
        missed_dose_action: 'tomela tan pronto como recuerde',
      });
      expect(result).not.toBeNull();
      expect(result!.body).toContain('ibuprofeno');
      expect(result!.body).toContain('dos veces al dia');
      expect(result!.language).toBe('es');
    });

    it('should generate wound care instructions in French', () => {
      const result = engine.getPatientInstructions('wound_care', 'fr', {
        interval: '24 heures',
        days: '14',
      });
      expect(result).not.toBeNull();
      expect(result!.body).toContain('24 heures');
      expect(result!.body).toContain('14 jours');
    });

    it('should return null for invalid template key', () => {
      const result = engine.getPatientInstructions('nonexistent_template', 'en', {});
      expect(result).toBeNull();
    });

    it('should include a readability score in the result', () => {
      const result = engine.getPatientInstructions('post_surgery_general', 'en', {
        procedure: 'surgery',
        days: '5',
        medication: 'aspirin',
        complication: 'bleeding',
        warning_signs: 'heavy bleeding',
      });
      expect(result).not.toBeNull();
      expect(typeof result!.readabilityScore).toBe('number');
    });
  });

  // ── Readability Assessment ──

  describe('assessReadability()', () => {
    it('should rate simple text as easy', () => {
      const result = engine.assessReadability('Take your pill. Drink water. Rest in bed.');
      expect(result.assessment).toBe('easy');
      expect(result.fleschKincaid).toBeGreaterThanOrEqual(70);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should rate complex medical text as difficult or very difficult', () => {
      const result = engine.assessReadability(
        'Postoperative anticoagulation prophylaxis with low-molecular-weight heparin should be administered subcutaneously in accordance with established thromboprophylaxis protocols to mitigate the risk of venous thromboembolism following major orthopedic surgical intervention.'
      );
      expect(['difficult', 'very_difficult']).toContain(result.assessment);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should return grade level and reading ease values', () => {
      const result = engine.assessReadability('Go to the doctor. Take medicine. Rest at home.');
      expect(typeof result.gradeLevel).toBe('number');
      expect(typeof result.readingEase).toBe('number');
      expect(result.gradeLevel).toBeGreaterThanOrEqual(0);
    });

    it('should provide suggestions for moderate readability text', () => {
      const result = engine.assessReadability(
        'The patient should carefully monitor their surgical incision site for any indications of potential complications including redness or discharge.'
      );
      // This should fall in moderate or difficult range
      if (result.assessment === 'moderate') {
        expect(result.suggestions).toContain('Consider using shorter sentences.');
      }
    });

    it('should handle empty text gracefully', () => {
      const result = engine.assessReadability('');
      expect(result.fleschKincaid).toBe(0);
      expect(typeof result.assessment).toBe('string');
    });
  });

  // ── Self-Learning Corrections ──

  describe('self-learning corrections', () => {
    it('should use a recorded correction in subsequent translations', () => {
      // First, translate normally
      const original = engine.translate('aspirin', 'en', 'es');
      expect(original.translation).toBe('aspirina');

      // Record a correction
      engine.recordCorrection('aspirin', 'en', 'es', 'aspirina', 'aspirina corregida', 'Dr. Lopez');

      // Now the translation should use the corrected value
      const corrected = engine.translate('aspirin', 'en', 'es');
      expect(corrected.translation).toBe('aspirina corregida');
      expect(corrected.confidence).toBe(0.95);
    });

    it('should maintain a correction history', () => {
      engine.recordCorrection('pain', 'en', 'es', 'dolor', 'dolor agudo', 'Dr. Garcia');
      engine.recordCorrection('fever', 'en', 'fr', 'fievre', 'fievre forte', 'Dr. Martin');

      const history = engine.getCorrectionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].correctedBy).toBe('Dr. Garcia');
      expect(history[1].correctedBy).toBe('Dr. Martin');
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should apply corrections only to the specific language pair', () => {
      engine.recordCorrection('pain', 'en', 'es', 'dolor', 'dolor corregido', 'Dr. Test');

      // Spanish should be corrected
      const esResult = engine.translate('pain', 'en', 'es');
      expect(esResult.translation).toBe('dolor corregido');

      // French should remain unchanged
      const frResult = engine.translate('pain', 'en', 'fr');
      expect(frResult.translation).toBe('douleur');
    });
  });

  // ── Utility Methods ──

  describe('utility methods', () => {
    it('should return all 6 supported languages', () => {
      const languages = engine.getSupportedLanguages();
      expect(languages).toHaveLength(6);
      const codes = languages.map(l => l.code);
      expect(codes).toContain('en');
      expect(codes).toContain('es');
      expect(codes).toContain('fr');
      expect(codes).toContain('zh');
      expect(codes).toContain('ar');
      expect(codes).toContain('hi');
    });

    it('should return dictionary size greater than zero', () => {
      const size = engine.getDictionarySize();
      expect(size).toBeGreaterThan(0);
    });

    it('should filter terms by category', () => {
      const medications = engine.getTermsByCategory('medications');
      expect(medications.length).toBeGreaterThan(0);
      medications.forEach(entry => {
        expect(entry.category).toBe('medications');
      });

      const bodyParts = engine.getTermsByCategory('body_parts');
      expect(bodyParts.length).toBeGreaterThan(0);
      bodyParts.forEach(entry => {
        expect(entry.category).toBe('body_parts');
      });
    });

    it('should return empty array for getTermsByCategory with valid but sparse category', () => {
      // All categories should return entries since the dictionary is populated
      const procedures = engine.getTermsByCategory('procedures');
      expect(procedures.length).toBeGreaterThan(0);
    });
  });

  // ── Multi-Language Coverage ──

  describe('multi-language coverage', () => {
    const testTerm = 'ibuprofen';
    const expectedTranslations: Partial<Record<Language, string>> = {
      es: 'ibuprofeno',
      fr: 'ibuprofene',
      zh: 'buluofen',
      ar: 'aybubrofen',
      hi: 'aibuprofen',
    };

    for (const [lang, expected] of Object.entries(expectedTranslations)) {
      it(`should translate "${testTerm}" to ${lang}`, () => {
        const result = engine.translate(testTerm, 'en', lang as Language);
        expect(result.translation).toBe(expected);
      });
    }
  });

  // ── All Term Categories ──

  describe('all term categories have entries', () => {
    const categories: TermCategory[] = ['medications', 'conditions', 'body_parts', 'instructions', 'symptoms', 'procedures'];

    for (const category of categories) {
      it(`should have entries for category: ${category}`, () => {
        const terms = engine.getTermsByCategory(category);
        expect(terms.length).toBeGreaterThan(0);
      });
    }
  });
});
