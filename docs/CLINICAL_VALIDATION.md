# Clinical Validation

## Validation Methodology

Every clinical algorithm in RecoveryPilot is validated against published clinical data. This document summarizes the evidence base for each algorithm and the validation approach used in our test suite.

## Validation Principles

1. **Published thresholds only** -- All scoring thresholds come from peer-reviewed publications, never from internal tuning
2. **Known-outcome testing** -- Test cases use scenarios with known correct outcomes from published validation studies
3. **Boundary testing** -- Algorithms are tested at scoring thresholds where risk levels change
4. **Property-based testing** -- fast-check verifies mathematical invariants (e.g., scores always within valid range)
5. **Deterministic seeds** -- 5 reproducible patient seeds (42, 137, 256, 389, 501) cover a spectrum of clinical scenarios

## Algorithm Validation Summary

### Sepsis Screening

| Algorithm | Source Validation Study | Sample Size | Performance Metric | Our Test Coverage |
|-----------|----------------------|-------------|-------------------|-------------------|
| qSOFA | Seymour et al., JAMA 2016 | 184,875 | AUROC 0.607 | Score 0-3 boundary tests, sepsis-likely threshold at 2 |
| SIRS | Bone et al., Chest 1992 | 5,000+ ICU | Sensitivity 97%, Specificity 26% | All 4 criteria combinations, threshold at 2 |
| SOFA | Vincent et al., ICM 1996 | 13,000+ ICU | Mortality: 12% at SOFA 2-6, 50% at SOFA 12+ | 6 organ system sub-scores, total range 0-24 |

**What we test:** Each criterion is tested independently and in combination. Boundary values (e.g., RR = 21 vs 22 for qSOFA) are explicitly tested to ensure correct threshold behavior.

### VTE Risk Assessment

| Algorithm | Source Validation Study | Sample Size | Performance Metric | Our Test Coverage |
|-----------|----------------------|-------------|-------------------|-------------------|
| Caprini | Bahl et al., Ann Surg 2010 | 8,216 | VTE rate 0.7% (score 0-2) to 7.1% (score 9+) | All 40+ risk factors, risk level transitions |
| Wells DVT | Wells et al., NEJM 2003 | 1,096 | DVT unlikely + neg D-dimer: 0.4% 3-mo rate | Score threshold at 2, all 10 criteria |
| Wells PE | Wells et al., Thromb Haemost 2000 | 930 | Three-tier classification | Low/Moderate/High transitions |
| Revised Geneva | Le Gal et al., Ann Int Med 2006 | 965 | PE prevalence: Low 8%, Int 28%, High 74% | All scoring criteria |

**What we test:** Caprini scoring tested with all risk factor combinations at 1-point, 2-point, 3-point, and 5-point levels. Prophylaxis recommendations tested at each risk tier boundary.

### Fall Risk

| Algorithm | Source Validation Study | Sample Size | Performance Metric | Our Test Coverage |
|-----------|----------------------|-------------|-------------------|-------------------|
| Morse | Morse, W J Nursing Res 1989 | 200 (100+100) | Sensitivity 77%, Specificity 72% | All 6 items, 3 risk levels, cut-offs at 25 and 50 |
| Hendrich II | Hendrich et al., ANR 2003 | 5,489 | Sensitivity 74.9%, Specificity 73.9%, AUROC 0.72 | All 8 items, high-risk threshold at 5 |

**What we test:** Each scoring item tested at all possible values. Composite scores verified against published examples. Risk level transitions tested at exact cut-off points.

### Nutritional Screening

| Algorithm | Source Validation Study | Sample Size | Performance Metric | Our Test Coverage |
|-----------|----------------------|-------------|-------------------|-------------------|
| NRS-2002 | Kondrup et al., Clin Nutr 2003 | 128 RCTs | ESPEN recommended standard | Total score range 0-7, threshold at 3 |
| MUST | Stratton et al., Br J Nutr 2004 | 1,000+ | Inter-rater kappa > 0.8 | BMI, weight loss, acute disease scoring |
| SGA | Detsky et al., JPEN 1987 | 202 | Inter-observer kappa 0.78 | A/B/C classification |
| Harris-Benedict | Harris & Benedict, 1919 | N/A | R2 > 0.9 vs. indirect calorimetry | Male/female BMR calculation |
| Mifflin-St Jeor | Frankenfield et al., JADA 2005 | N/A | More accurate than H-B in modern populations | Male/female RMR calculation |

**What we test:** NRS-2002 tested at all score combinations ensuring total never exceeds 7. Caloric equations verified against published reference values for standard body compositions.

### Surgical Site Infection

| Algorithm | Source Validation Study | Sample Size | Performance Metric | Our Test Coverage |
|-----------|----------------------|-------------|-------------------|-------------------|
| NNIS Index | Culver et al., Am J Med 1991 | 84,691 | SSI rate 1.5% (score 0) to 13.0% (score 3) | Score 0-3, ASA mapping, wound class mapping |
| ASA | ASA, 1963 | N/A (standard classification) | Universal adoption | ASA I-V classification |
| Wound Class | CDC/NHSN | N/A (standard definitions) | Universal adoption | Classes I-IV |

**What we test:** NNIS scoring tested with all component combinations. Laparoscopic adjustment (-1) verified. Predicted SSI rates matched against published rates from Culver et al.

### Blood Glucose

| Algorithm | Source Validation Study | Sample Size | Performance Metric | Our Test Coverage |
|-----------|----------------------|-------------|-------------------|-------------------|
| ADA Targets | ADA Standards 2024 | N/A (guideline) | Reduces infections 30-40% | All glucose status categories |
| 1800 Rule | Walsh et al., 2012 | 500+ | Standard clinical formula | Correction factor calculation |
| 500 Rule | Standard clinical | N/A | Standard clinical formula | ICR calculation |
| HbA1c (ADAG) | Nathan et al., Diabetes Care 2008 | 507 | R2 = 0.84 | Forward and reverse estimation |
| 15/15 Rule | ADA Standards 2024 | N/A (guideline) | Standard of care | Level 1, 2, 3 hypoglycemia |

**What we test:** Glucose classification across all 7 status categories. Sliding scale calculation at all intensity levels. HbA1c formula verified bidirectionally (glucose-to-A1c and A1c-to-glucose).

### Vital Sign Early Warning

| Algorithm | Source Validation Study | Sample Size | Performance Metric | Our Test Coverage |
|-----------|----------------------|-------------|-------------------|-------------------|
| NEWS2 | Smith et al., Resuscitation 2013 | 35,585 | AUROC 0.89 for cardiac arrest in 24h | All 7 parameters, all scoring tiers |
| MEWS | Subbe et al., QJM 2001 | 673 | Sensitivity 75%, Specificity 83% for ICU | Score calculation and risk levels |

**What we test:** NEWS2 scoring verified for each of the 7 parameters across all scoring tiers (0-3). Aggregate score tested at clinical response thresholds (0-4, 5-6, 7+).

## Test Infrastructure

### Deterministic Patient Seeds

| Seed | Patient Profile | Purpose |
|------|----------------|---------|
| 42 | 35F, healthy, day 3 post-appendectomy | Baseline normal, low risk across all scores |
| 137 | 62M, diabetes, HTN, day 5 post-hip replacement | Moderate risk, tests age adjustments |
| 256 | 78F, COPD, CHF, CKD, day 7 post-CABG | High risk, multi-comorbidity interactions |
| 389 | 45M, obese, smoker, day 2 post-colectomy | Modifiable risk factors, SSI risk |
| 501 | 28F, healthy, day 1 post-laparoscopic cholecystectomy | Edge case: young, low baseline risk |

### Test Categories

1. **Score calculation tests** -- Verify mathematical correctness of every score computation
2. **Risk stratification tests** -- Verify correct risk level assignment at all thresholds
3. **Boundary value tests** -- Test at exact scoring thresholds (score n vs. n+1)
4. **Property-based tests** -- fast-check verifies invariants (e.g., "SOFA score is always 0-24")
5. **Integration tests** -- Verify services work correctly when called from stores/components
6. **Regression tests** -- Known clinical scenarios with expected outputs

### Running Validation Tests

```bash
# All tests
npm run test

# Clinical validation specifically
npx vitest run src/test/realworld-clinical-services-validation.test.ts
npx vitest run src/test/realworld-ml-models-validation.test.ts

# Specific algorithm
npx vitest run --grep "qSOFA"
npx vitest run --grep "Caprini"
npx vitest run --grep "NEWS2"
```

## Disclaimer

RecoveryPilot implements clinical algorithms for educational and research purposes. While algorithms are faithfully reproduced from published sources, this software is **not** a certified medical device and should **not** be used for actual clinical decision-making without proper regulatory approval and validation in the target clinical setting. Always consult qualified healthcare professionals for medical decisions.
