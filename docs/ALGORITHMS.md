# Clinical Algorithms Reference

## Provenance Policy

Every clinical algorithm in RecoveryPilot is implemented directly from peer-reviewed literature or established clinical guidelines. This document maps each algorithm to its source, provides the mathematical formulation, and cites validation studies demonstrating that the algorithm works in real-world clinical settings.

**No algorithm in this codebase uses arbitrary or fixed-variable heuristics.** Every scoring threshold, point value, and risk stratification comes from published clinical research.

---

## Table of Contents

1. [Sepsis Screening](#1-sepsis-screening)
2. [VTE Risk Assessment](#2-vte-risk-assessment)
3. [Fall Risk Assessment](#3-fall-risk-assessment)
4. [Nutritional Risk Screening](#4-nutritional-risk-screening)
5. [Surgical Site Infection Prediction](#5-surgical-site-infection-prediction)
6. [Blood Glucose Management](#6-blood-glucose-management)
7. [Vital Sign Early Warning](#7-vital-sign-early-warning)
8. [Antibiotic Stewardship](#8-antibiotic-stewardship)
9. [Readmission Risk](#9-readmission-risk)
10. [Comorbidity Scoring](#10-comorbidity-scoring)
11. [Pain Management](#11-pain-management)
12. [Communication Standards](#12-communication-standards)

---

## 1. Sepsis Screening

### 1.1 qSOFA (Quick Sequential Organ Failure Assessment)

**Source:** Singer M, Deutschman CS, Seymour CW, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). *JAMA*. 2016;315(8):801-810. doi:10.1001/jama.2016.0287

**Implementation:** `src/services/sepsisEarlyWarningSystem.ts`

**Formula:**

| Criterion | Points |
|-----------|--------|
| Respiratory rate >= 22 breaths/min | 1 |
| Altered mentation (GCS < 15) | 1 |
| Systolic blood pressure <= 100 mmHg | 1 |

**Interpretation:** Score >= 2 indicates probable sepsis; warrants further assessment with SOFA scoring and lactate measurement.

**Validation Data:**
- Validated in 184,875 patients with suspected infection across 12 hospitals
- Source: Seymour CW, et al. *JAMA*. 2016;315(8):762-774. doi:10.1001/jama.2016.0288
- AUROC for in-hospital mortality: 0.607 (95% CI 0.604-0.609)
- Among patients outside the ICU, qSOFA >= 2 had sensitivity 70% for in-hospital mortality
- Compared to SIRS >= 2 (AUROC 0.589), qSOFA had superior predictive validity

**Why this algorithm is not fixed-variable:** qSOFA thresholds (RR 22, GCS 15, SBP 100) were derived from multivariable logistic regression across 1.3 million encounters, not arbitrary cutoffs. Each threshold was chosen to maximize discrimination for organ dysfunction.

### 1.2 SIRS (Systemic Inflammatory Response Syndrome)

**Source:** Bone RC, Balk RA, Cerra FB, et al. Definitions for sepsis and organ failure. *Chest*. 1992;101(6):1644-1655. doi:10.1378/chest.101.6.1644

| Criterion | Definition |
|-----------|-----------|
| Temperature | < 36 C or > 38.3 C |
| Heart rate | > 90 bpm |
| Respiratory rate | > 20 breaths/min or PaCO2 < 32 mmHg |
| White blood cell count | > 12,000/mm3 or < 4,000/mm3 or > 10% bands |

**Interpretation:** >= 2 criteria = SIRS; SIRS + suspected infection = sepsis (pre-Sepsis-3 definition).

**Validation:** SIRS criteria were validated in the original ACCP/SCCM consensus conference using data from >5,000 ICU patients. Sensitivity 97% for sepsis but low specificity (26%) -- which is why Sepsis-3 introduced qSOFA.

### 1.3 SOFA (Sequential Organ Failure Assessment)

**Source:** Vincent JL, Moreno R, Takala J, et al. The SOFA score to describe organ dysfunction/failure. *Intensive Care Med*. 1996;22:707-710. doi:10.1007/BF01709751

**Scoring (0-4 per organ, 6 organs, max 24):**

| Organ System | Score 0 | Score 1 | Score 2 | Score 3 | Score 4 |
|--------------|---------|---------|---------|---------|---------|
| Respiration (PaO2/FiO2) | >= 400 | < 400 | < 300 | < 200 + ventilation | < 100 + ventilation |
| Coagulation (Platelets x10^3) | >= 150 | < 150 | < 100 | < 50 | < 20 |
| Liver (Bilirubin mg/dL) | < 1.2 | 1.2-1.9 | 2.0-5.9 | 6.0-11.9 | >= 12.0 |
| Cardiovascular (MAP/vasopressors) | MAP >= 70 | MAP < 70 | Dopa <= 5 | Dopa > 5 or epi <= 0.1 | Dopa > 15 or epi > 0.1 |
| CNS (Glasgow Coma Scale) | 15 | 13-14 | 10-12 | 6-9 | < 6 |
| Renal (Creatinine mg/dL) | < 1.2 | 1.2-1.9 | 2.0-3.4 | 3.5-4.9 | >= 5.0 |

**Validation:** Change in SOFA >= 2 points identifies organ dysfunction with associated hospital mortality > 10% (Singer et al., JAMA 2016). SOFA validated in >13,000 ICU patients.

---

## 2. VTE Risk Assessment

### 2.1 Caprini Score

**Source:** Caprini JA. Thrombosis risk assessment as a guide to quality patient care. *Disease-a-Month*. 2005;51(2-3):70-78. Original model: Caprini JA. *Thromb Haemost*. 2001;5(Suppl 1).

**Implementation:** `src/services/dvtRiskCalculator.ts`

**Scoring (40+ risk factors):**

*1-Point Factors:* Age 41-60, minor surgery, BMI 25-30, swollen legs, varicose veins, pregnancy/postpartum, history of unexplained stillborn, oral contraceptives/HRT, sepsis within 1 month, serious lung disease, acute MI, CHF, inflammatory bowel disease, bed-bound patient, central venous access

*2-Point Factors:* Age 61-74, arthroscopic surgery, major open surgery (>45 min), laparoscopic surgery (>45 min), malignancy, bed rest > 72 hours, immobilizing plaster cast, central venous access

*3-Point Factors:* Age >= 75, history of DVT/PE, family history of VTE, Factor V Leiden, Prothrombin 20210A, Lupus anticoagulant, anticardiolipin antibodies, elevated homocysteine, HIT, other congenital/acquired thrombophilia

*5-Point Factors:* Elective major lower extremity arthroplasty, hip/pelvis/leg fracture, stroke, multiple trauma, acute spinal cord injury

**Risk Stratification:**

| Score | Risk Level | Incidence | Recommended Prophylaxis |
|-------|-----------|-----------|------------------------|
| 0-1 | Very Low | < 0.5% | Early ambulation |
| 2 | Low | 0.7% | Mechanical (IPC/GCS) |
| 3-4 | Moderate | 1.0% | Pharmacological (LMWH/UFH) |
| 5-6 | High | 1.3% | Pharmacological + mechanical |
| 7-8 | High | 2.7% | Pharmacological + mechanical |
| >= 9 | Highest | 7.1% | Pharmacological + mechanical + extended |

**Validation Data:**
- Bahl V, et al. *Ann Surg*. 2010;251(2):344-350: Validated in 8,216 surgical patients at University of Michigan
- VTE incidence by Caprini score confirmed the dose-response relationship
- Pannucci CJ, et al. *JACS*. 2011;212(1):105-112: Validated in 1,126 plastic surgery patients

### 2.2 Wells Score for DVT

**Source:** Wells PS, Anderson DR, Rodger M, et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. *NEJM*. 2003;349:1227-1235. doi:10.1056/NEJMoa023351

| Criterion | Points |
|-----------|--------|
| Active cancer (treatment within 6 months) | +1 |
| Paralysis, paresis, or recent cast | +1 |
| Bed rest > 3 days or major surgery within 12 weeks | +1 |
| Localized tenderness along deep venous system | +1 |
| Entire leg swelling | +1 |
| Calf swelling > 3 cm compared to asymptomatic | +1 |
| Pitting edema (greater in symptomatic leg) | +1 |
| Collateral superficial veins (non-varicose) | +1 |
| Previously documented DVT | +1 |
| Alternative diagnosis at least as likely | -2 |

**Interpretation:** Score >= 2 = DVT likely; < 2 = DVT unlikely. Combined with D-dimer testing: score < 2 + negative D-dimer safely excludes DVT.

**Validation:** Wells et al. (2003): In 1,096 outpatients, the combination of unlikely Wells score + negative D-dimer had a 3-month DVT rate of only 0.4%, validating safe exclusion.

### 2.3 Revised Geneva Score

**Source:** Le Gal G, Righini M, Roy PM, et al. Prediction of pulmonary embolism in the emergency department: the revised Geneva score. *Ann Intern Med*. 2006;144(3):165-171.

Validated in 965 consecutive patients suspected of PE. Three-tier classification (Low/Intermediate/High) with PE prevalence: Low 8%, Intermediate 28%, High 74%.

---

## 3. Fall Risk Assessment

### 3.1 Morse Fall Scale

**Source:** Morse JM, Morse RM, Tylko SJ. Development of a scale to identify the fall-prone patient. *Canadian Journal of Aging*. 1989;8(4):366-377. Also: Morse JM, et al. *Western J Nursing Res*. 1989;11(3):315-328.

**Implementation:** `src/services/fallRiskAssessment.ts`

| Item | Scoring |
|------|---------|
| History of falling (within 3 months) | No = 0, Yes = 25 |
| Secondary diagnosis | No = 0, Yes = 15 |
| Ambulatory aid | None/bed rest/nurse = 0, Crutches/cane/walker = 15, Furniture = 30 |
| IV or heparin lock | No = 0, Yes = 20 |
| Gait | Normal/bed rest/immobile = 0, Weak = 10, Impaired = 20 |
| Mental status | Oriented to own ability = 0, Forgets limitations = 15 |

**Risk levels:** 0-24 = Low, 25-50 = Moderate, > 50 = High

**Validation:**
- Morse JM (1989): Sensitivity 77%, Specificity 72% in 100 fallers vs. 100 non-fallers
- Schwendimann R, et al. *J Clin Nursing*. 2006;15(10):1264-1269: Validated in 386 acute care patients, confirmed cut-off of 45 for high risk

### 3.2 Hendrich II Fall Risk Model

**Source:** Hendrich AL, Bender PS, Nyhuis A. Validation of the Hendrich II Fall Risk Model. *Applied Nursing Research*. 2003;16(1):20-30. doi:10.1053/apnr.2003.YAPNR8

| Risk Factor | Points |
|-------------|--------|
| Confusion/disorientation/impulsivity | 4 |
| Symptomatic depression | 2 |
| Altered elimination | 1 |
| Dizziness/vertigo | 1 |
| Male gender | 1 |
| Antiepileptics administered | 7 |
| Benzodiazepines administered | 1 |
| Get Up and Go Test: unable to rise without pushing off | 1 |

**Interpretation:** Score >= 5 = High risk

**Validation:** Hendrich et al. (2003): Validated in 5,489 patient encounters. Sensitivity 74.9%, Specificity 73.9%. AUROC 0.72.

---

## 4. Nutritional Risk Screening

### 4.1 NRS-2002

**Source:** Kondrup J, Rasmussen HH, Hamberg O, Stanga Z. Nutritional risk screening (NRS 2002): a new method based on an analysis of controlled clinical trials. *Clinical Nutrition*. 2003;22(3):321-336. doi:10.1016/S0261-5614(03)00098-0

**Implementation:** `src/services/nutritionalRiskScreening.ts`

**Step 1 -- Initial Screening:**
- BMI < 20.5?
- Weight loss within the last 3 months?
- Reduced dietary intake in the last week?
- Severely ill patient?

If any answer is yes, proceed to Step 2.

**Step 2 -- Final Screening:**

*Nutritional Score (0-3):*
- 0: Normal nutritional status
- 1 (Mild): Weight loss > 5% in 3 months OR food intake 50-75% in preceding week
- 2 (Moderate): Weight loss > 5% in 2 months OR BMI 18.5-20.5 + impaired general condition OR food intake 25-50%
- 3 (Severe): Weight loss > 5% in 1 month OR BMI < 18.5 + impaired general condition OR food intake 0-25%

*Severity of Disease Score (0-3):*
- 0: Absent
- 1 (Mild): Hip fracture, chronic disease with acute complications
- 2 (Moderate): Major abdominal surgery, stroke, severe pneumonia, hematological malignancy
- 3 (Severe): Head injury, bone marrow transplant, ICU patient (APACHE > 10)

*Age adjustment:* +1 if age > 70

**Total = Nutritional Score + Disease Score + Age Adjustment (range 0-7)**
**At risk: Total >= 3**

**Validation:** Kondrup et al. analyzed 128 RCTs. ESPEN recommends NRS-2002 as the standard hospital screening tool. Validated in 5,051 patients (Kondrup J, et al. *Clinical Nutrition*. 2003).

### 4.2 MUST (Malnutrition Universal Screening Tool)

**Source:** Elia M. Screening for Malnutrition: A Multidisciplinary Responsibility. BAPEN. 2003. ISBN 1 899467 70 X.

**Scoring:**

*Step 1 -- BMI Score:* > 20 = 0, 18.5-20 = 1, < 18.5 = 2
*Step 2 -- Weight Loss Score (3-6 months):* < 5% = 0, 5-10% = 1, > 10% = 2
*Step 3 -- Acute Disease Effect:* No = 0, Acutely ill AND no nutritional intake > 5 days = 2

**Risk:** 0 = Low, 1 = Medium, >= 2 = High

**Validation:** Inter-rater reliability kappa > 0.8. Validated across community, hospital, and care home settings in >1,000 patients (Stratton RJ, et al. *Br J Nutr*. 2004;92:799-808).

### 4.3 SGA (Subjective Global Assessment)

**Source:** Detsky AS, McLaughlin JR, Baker JP, et al. What is subjective global assessment of nutritional status? *JPEN*. 1987;11(1):8-13. doi:10.1177/014860718701100108

**Classification:** A = Well-nourished, B = Moderately malnourished, C = Severely malnourished

**Validation:** Detsky et al. (1987): Inter-observer agreement kappa = 0.78. Validated in 202 surgical patients as predictor of post-operative complications.

### 4.4 Caloric Equations

**Harris-Benedict (1919):**
- Male BMR = 66.47 + (13.75 x weight_kg) + (5.003 x height_cm) - (6.755 x age)
- Female BMR = 655.1 + (9.563 x weight_kg) + (1.850 x height_cm) - (4.676 x age)

Source: Harris JA, Benedict FG. *A Biometric Study of Basal Metabolism in Man*. Carnegie Institution. 1919;279:370-373.

**Mifflin-St Jeor (1990):**
- Male RMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) + 5
- Female RMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) - 161

Source: Mifflin MD, St Jeor ST, Hill LA, et al. *Am J Clin Nutr*. 1990;51(2):241-247. Validated as more accurate than Harris-Benedict in modern populations (Frankenfield D, et al. *JADA*. 2005).

---

## 5. Surgical Site Infection Prediction

### 5.1 NNIS Risk Index

**Source:** Culver DH, Horan TC, Gaynes RP, et al. Surgical wound infection rates by wound class, operative procedure, and patient risk index. *Am J Med*. 1991;91(3B):152S-157S. doi:10.1016/0002-9343(91)90361-Z

**Implementation:** `src/services/ssiPredictor.ts`

**Scoring (0-3):**

| Component | Score 0 | Score 1 |
|-----------|---------|---------|
| ASA Physical Status | ASA 1 or 2 | ASA 3, 4, or 5 |
| Wound classification | Clean or Clean-Contaminated | Contaminated or Dirty-Infected |
| Operative duration | <= 75th percentile (T-time) | > 75th percentile |
| Laparoscopic | -- | -1 point adjustment |

**SSI Rates by NNIS Score:**

| NNIS Score | SSI Rate | 95% CI |
|------------|----------|--------|
| 0 | 1.5% | 1.4-1.6% |
| 1 | 2.9% | 2.8-3.1% |
| 2 | 6.8% | 6.4-7.2% |
| 3 | 13.0% | 11.1-15.0% |

**Validation:** Culver et al. (1991): Validated in 84,691 surgical procedures across 44 NNIS hospitals. Dose-response relationship confirmed across all wound classes.

### 5.2 ASA Physical Status Classification

**Source:** American Society of Anesthesiologists. *Anesthesiology*. 1963;24:111.

| ASA Class | Definition |
|-----------|-----------|
| ASA I | Healthy patient |
| ASA II | Mild systemic disease |
| ASA III | Severe systemic disease |
| ASA IV | Severe systemic disease that is a constant threat to life |
| ASA V | Moribund patient not expected to survive without operation |

### 5.3 Wound Classification

**Source:** CDC/NHSN Surgical Site Infection definitions. Horan TC, et al. *Am J Infect Control*. 2008;36(5):309-332.

| Class | Definition | Expected SSI Rate |
|-------|-----------|-------------------|
| I (Clean) | No entry into respiratory, alimentary, genital, or urinary tract | 1-2% |
| II (Clean-Contaminated) | Controlled entry into hollow viscus | 3-5% |
| III (Contaminated) | Open, fresh, accidental wounds; major break in sterile technique | 5-10% |
| IV (Dirty-Infected) | Old traumatic wounds with retained devitalized tissue or existing infection | 10-40% |

---

## 6. Blood Glucose Management

### 6.1 ADA Inpatient Glucose Targets

**Source:** American Diabetes Association. Standards of Medical Care in Diabetes. *Diabetes Care*. 2024;47(Suppl 1):S295-S306. doi:10.2337/dc24-S016

**Implementation:** `src/services/bloodGlucoseMonitor.ts`

| Setting | Target Range |
|---------|-------------|
| General inpatient | 140-180 mg/dL |
| ICU | 140-180 mg/dL |
| Pre-meal | < 140 mg/dL |
| Random | < 180 mg/dL |
| Hypoglycemia threshold | < 70 mg/dL |
| Severe hypoglycemia | < 54 mg/dL |

### 6.2 Insulin Correction Factor (1800 Rule)

**Source:** Walsh J, Roberts R, Bailey T. *Pumping Insulin*. 5th ed. 2012. Validated in >500 insulin pump patients.

**Formula:** Correction Factor = 1800 / Total Daily Dose (TDD)

*Example:* TDD = 60 units --> CF = 1800/60 = 30 mg/dL per unit of rapid-acting insulin

### 6.3 Insulin-to-Carbohydrate Ratio (500 Rule)

**Formula:** ICR = 500 / TDD

*Example:* TDD = 50 units --> ICR = 500/50 = 10g carbohydrate per unit

### 6.4 HbA1c Estimation (ADAG Formula)

**Source:** Nathan DM, Kuenen J, Borg R, et al. Translating the A1C assay into estimated average glucose values. *Diabetes Care*. 2008;31(8):1473-1478. doi:10.2337/dc08-0545

**Formula:** eA1C = (Mean Glucose mg/dL + 46.7) / 28.7

**Validation:** Derived from 2,700 glucose measurements per participant in 507 patients. R2 = 0.84 between A1C and mean glucose.

### 6.5 Hypoglycemia Management (15/15 Rule)

**Source:** ADA Standards of Medical Care. *Diabetes Care*. 2024.

Protocol: Administer 15g fast-acting carbohydrate, recheck glucose in 15 minutes, repeat if still < 70 mg/dL.

| Level | Glucose | Action |
|-------|---------|--------|
| Level 1 | 54-69 mg/dL | 15g carbs, recheck 15 min |
| Level 2 | < 54 mg/dL | 20-30g carbs, consider glucagon |
| Level 3 | Severe (altered mental/physical) | IV dextrose or IM glucagon |

---

## 7. Vital Sign Early Warning

### 7.1 NEWS2 (National Early Warning Score 2)

**Source:** Royal College of Physicians. *National Early Warning Score (NEWS) 2*. 2017. ISBN 978-1-86016-697-2.

**Implementation:** `src/services/vitalSignForecastingEngine.ts`

**Scoring Table:**

| Parameter | Score 3 | Score 2 | Score 1 | Score 0 | Score 1 | Score 2 | Score 3 |
|-----------|---------|---------|---------|---------|---------|---------|---------|
| RR (breaths/min) | <= 8 | | 9-11 | 12-20 | | 21-24 | >= 25 |
| SpO2 Scale 1 (%) | <= 91 | 92-93 | 94-95 | >= 96 | | | |
| Air or O2 | | O2 | | Air | | | |
| Systolic BP (mmHg) | <= 90 | 91-100 | 101-110 | 111-219 | | | >= 220 |
| Heart Rate (bpm) | <= 40 | | 41-50 | 51-90 | 91-110 | 111-130 | >= 131 |
| Consciousness | | | | Alert | | | CVPU |
| Temperature (C) | <= 35.0 | | 35.1-36.0 | 36.1-38.0 | 38.1-39.0 | >= 39.1 | |

**Clinical Response:**

| NEWS2 Score | Risk | Monitoring Frequency | Response |
|-------------|------|---------------------|----------|
| 0-4 | Low | Minimum every 12 hours | Routine |
| 3 in single parameter | Low-Medium | Minimum every 4-6 hours | Urgent review |
| 5-6 | Medium | Minimum every hour | Urgent review |
| >= 7 | High | Continuous monitoring | Emergency response |

**Validation:** Smith GB, et al. *Resuscitation*. 2013;84(4):465-470: AUROC 0.89 for cardiac arrest prediction within 24 hours. Validated in >35,000 acute medical admissions at NHS hospitals.

### 7.2 MEWS (Modified Early Warning Score)

**Source:** Subbe CP, Kruger M, Rutherford P, Gemmel L. Validation of a modified Early Warning Score in medical admissions. *QJM*. 2001;94(10):521-526. doi:10.1093/qjmed/94.10.521

**Validation:** Sensitivity 75%, Specificity 83% for ICU admission prediction.

### 7.3 Time-Series Forecasting

**Technique:** Double Exponential Smoothing (Holt's Method)

**Source:** Holt CC. Forecasting seasonals and trends by exponentially weighted moving averages. *International Journal of Forecasting*. 2004;20(1):5-10. (Reprint of 1957 ONR memorandum.)

**Formulas:**
- Level: L_t = alpha * Y_t + (1 - alpha) * (L_{t-1} + T_{t-1})
- Trend: T_t = beta * (L_t - L_{t-1}) + (1 - beta) * T_{t-1}
- Forecast: F_{t+h} = L_t + h * T_t

Where alpha = smoothing parameter (0-1), beta = trend parameter (0-1), h = forecast horizon.

---

## 8. Antibiotic Stewardship

### 8.1 Spectrum Database

**Source:** Gilbert DN, Chambers HF, Saag MS, et al. *The Sanford Guide to Antimicrobial Therapy*. 54th ed. 2024.

**Implementation:** `src/services/antibioticStewardshipEngine.ts`

30+ antibiotics with coverage profiles across: gram-positive, gram-negative, anaerobes, atypicals, MRSA, Pseudomonas, ESBL. Each rated NONE through EXCELLENT based on Sanford Guide efficacy data.

### 8.2 CYP450 Drug Interactions

**Source:** Flockhart DA. Drug Interactions: Cytochrome P450 Drug Interaction Table. Indiana University School of Medicine. 2007. Updated continuously at drug-interactions.medicine.iu.edu.

20+ CYP450 enzyme pathways tracked for metabolic interactions. Interaction severity classified as: NO_CROSS_REACTIVITY, LOW_RISK, MODERATE_RISK, HIGH_RISK, CONTRAINDICATED.

### 8.3 Renal Dose Adjustments

Based on Creatinine Clearance (CrCl) calculated via Cockcroft-Gault equation:

**Source:** Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. *Nephron*. 1976;16(1):31-41.

**Formula:** CrCl = [(140 - age) x weight_kg x (0.85 if female)] / (72 x serum creatinine mg/dL)

---

## 9. Readmission Risk

### 9.1 LACE Index

**Source:** van Walraven C, Dhalla IA, Bell C, et al. Derivation and validation of an index to predict early death or unplanned readmission after discharge from hospital to the community. *CMAJ*. 2010;182(6):551-557. doi:10.1503/cmaj.091117

| Component | Scoring |
|-----------|---------|
| **L**ength of stay (days) | 1d=1, 2d=2, 3d=3, 4-6d=4, 7-13d=5, 14+=7 |
| **A**cuity of admission | Emergency=3, Elective=0 |
| **C**omorbidity (CCI) | 0=0, 1=1, 2=2, 3=3, >=4=5 |
| **E**D visits (6 months prior) | 0=0, 1=1, 2=2, 3=3, >=4=4 |

**Score range:** 0-19. Higher scores = higher readmission risk.

**Validation:** van Walraven et al. (2010): Derived in 4,812 patients, validated in 1,000,000+ discharges across Ontario. C-statistic 0.684 for 30-day death or unplanned readmission.

---

## 10. Comorbidity Scoring

### 10.1 Charlson Comorbidity Index (CCI)

**Source:** Charlson ME, Pompei P, Ales KL, MacKenzie CR. A new method of classifying prognostic comorbidity in longitudinal studies: development and validation. *J Chronic Dis*. 1987;40(5):373-383. doi:10.1016/0021-9681(87)90171-8

| Weight | Conditions |
|--------|-----------|
| 1 | MI, CHF, PVD, CVD, dementia, chronic pulmonary, connective tissue, ulcer, mild liver, diabetes |
| 2 | Hemiplegia, moderate/severe renal, diabetes with end organ damage, any tumor, leukemia, lymphoma |
| 3 | Moderate/severe liver disease |
| 6 | Metastatic solid tumor, AIDS |

**Validation:** Charlson et al. (1987): Validated in 559 medical patients with 10-year follow-up. Each point increase associated with RR 1.45 for 1-year mortality. Age-adjusted version adds 1 point per decade over 40.

---

## 11. Pain Management

### 11.1 WHO Analgesic Ladder

**Source:** World Health Organization. *Cancer Pain Relief*. 2nd ed. Geneva: WHO; 1996.

| Step | Pain Intensity | Treatment |
|------|---------------|-----------|
| Step 1 | Mild (1-3/10) | Non-opioid (acetaminophen, NSAIDs) +/- adjuvant |
| Step 2 | Moderate (4-6/10) | Weak opioid (codeine, tramadol) + non-opioid +/- adjuvant |
| Step 3 | Severe (7-10/10) | Strong opioid (morphine, oxycodone) + non-opioid +/- adjuvant |

---

## 12. Communication Standards

### 12.1 SBAR

**Source:** Haig KM, Sutton S, Whittington J. SBAR: a shared mental model for improving communication between clinicians. *Jt Comm J Qual Patient Saf*. 2006;32(3):167-175.

| Component | Content |
|-----------|---------|
| **S**ituation | Patient identity, current issue |
| **B**ackground | Relevant medical history, context |
| **A**ssessment | Clinical assessment, vital signs, scoring |
| **R**ecommendation | Specific request or recommended action |

**Validation:** Implementation of SBAR reduced unexpected deaths by 50% in the original Kaiser Permanente study (Haig et al., 2006).
