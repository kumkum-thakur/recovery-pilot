<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Express-5-black?logo=express" alt="Express 5" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-blue?logo=postgresql" alt="PostgreSQL 17" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D22-green?logo=node.js" alt="Node.js >= 22" />
  <img src="https://img.shields.io/badge/Clinical%20Algorithms-40%2B-orange" alt="Clinical Algorithms 40+" />
  <img src="https://img.shields.io/badge/ML%20Models-14-purple" alt="ML Models 14" />
  <img src="https://img.shields.io/badge/Tests-2700%2B%20passing-brightgreen" alt="Tests" />
</p>

# RecoveryPilot

**Autonomous Post-Operative Care Orchestrator**

Over 300 million surgical procedures are performed worldwide every year. For most patients, recovery means a printed instruction sheet and a follow-up appointment weeks away. RecoveryPilot replaces that gap with active, intelligent orchestration -- evidence-based algorithms that monitor, predict, and intervene throughout the recovery journey, while keeping the physician in command of every clinical decision.

RecoveryPilot is a full-stack healthcare platform spanning a React 19 frontend, an Express 5 API backend with PostgreSQL and Redis, multi-region Kubernetes infrastructure, and compliance enforcement for three regulatory regimes (DPDPA, HIPAA, UK GDPR) -- all in a single monorepo.

> **145,000+ lines of TypeScript** | **40+ peer-reviewed clinical algorithms** | **14 pure-TypeScript ML models** | **92 test files / 2,700+ test cases** | **Multi-region compliance (DPDPA, HIPAA, UK GDPR)** | **Zero external ML dependencies**

---

## Table of Contents

- [Key Differentiators](#key-differentiators)
- [Architecture Overview](#architecture-overview)
- [Clinical Algorithms and Evidence Base](#clinical-algorithms-and-evidence-base)
- [Machine Learning Models](#machine-learning-models)
- [Feature Set](#feature-set)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security and Compliance](#security-and-compliance)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Key Differentiators

| Aspect | Traditional Telehealth | RecoveryPilot |
|--------|----------------------|---------------|
| Patient interaction | Passive (patient initiates) | **Active orchestration** (system initiates tasks, missions, check-ins) |
| Clinical scoring | Manual lookup tables | **40+ automated scoring systems** with self-learning calibration |
| ML models | Cloud API dependencies | **14 pure-TypeScript models** with zero external ML libraries |
| Evidence base | Undocumented heuristics | **Every algorithm traced to peer-reviewed literature** |
| Patient engagement | Notifications | **Gamified mission system** with streaks, badges, XP, leaderboards |
| Doctor workflow | Manual review queues | **AI-triaged inbox** with confidence scores and one-click approve/reject |
| Compliance | Single-region | **DPDPA + HIPAA + UK GDPR** with automated enforcement and data residency |
| Infrastructure | Monolithic SaaS | **Full-stack monorepo** with Express 5, PostgreSQL 17, Redis, Kubernetes |

---

## Architecture Overview

```
+-------------------------------------------------------------------------+
|                          CLIENT APPLICATIONS                            |
|  +------------------+  +------------------+  +------------------+       |
|  |   Patient App    |  |   Doctor App     |  |   Admin App      |       |
|  |  (Mobile-First)  |  |  (Desktop-Opt)   |  |  (Management)    |       |
|  +--------+---------+  +--------+---------+  +--------+---------+       |
+-----------|---------------------|---------------------|------------------+
            |                     |                     |
+-----------|---------------------|---------------------|------------------+
|  +--------v---------------------v---------------------v---------+       |
|  |                 React 19 + Zustand State Layer                |       |
|  |               (7 Primary + 15 Feature Stores)                 |       |
|  +---------------------------------------------------------------+       |
|  |              Frontend Service Layer (80+ Modules)             |       |
|  |  Clinical Decision (8)  |  ML Models (14)  |  Agent Workflows |       |
|  +---------------------------------------------------------------+       |
|                             FRONTEND                                     |
+----------------------------------+---------------------------------------+
                                   | REST API
+----------------------------------v---------------------------------------+
|                              BACKEND                                     |
|  +---------------------------------------------------------------+       |
|  |          Express 5 API Server (Node.js 22, Cluster Mode)      |       |
|  +---------------------------------------------------------------+       |
|  | Auth Routes | Patient Routes | Clinical Routes | Admin Routes |       |
|  | Compliance Routes | Health Probes (/health, /ready, /startup) |       |
|  +---------------------------------------------------------------+       |
|  |                    Middleware Pipeline                         |       |
|  | Helmet | Passport.js | Audit Logger | Rate Limiter | Zod     |       |
|  +---------------------------------------------------------------+       |
|  |             BullMQ Job Queues (5 Async Queues)                |       |
|  | Image Analysis | Notifications | Data Export | Compliance     |       |
|  +---------------------------------------------------------------+       |
+----------------------------------+---------------------------------------+
                                   |
+----------------------------------v---------------------------------------+
|                            DATA LAYER                                    |
|  +--------------+  +-----------+  +----------+  +------------------+    |
|  | PostgreSQL   |  | Redis     |  | AWS S3   |  | AWS KMS /        |    |
|  | Primary +    |  | 4 DBs:    |  | Medical  |  | Secrets Manager  |    |
|  | Read Replica |  | Session,  |  | Images,  |  | Encryption Keys  |    |
|  |              |  | Cache,    |  | Audit,   |  |                  |    |
|  |              |  | RateLimit,|  | Backups  |  |                  |    |
|  |              |  | Queue     |  |          |  |                  |    |
|  +--------------+  +-----------+  +----------+  +------------------+    |
+----------------------------------+---------------------------------------+
                                   |
+----------------------------------v---------------------------------------+
|                          INFRASTRUCTURE                                  |
|  Kubernetes (3 Regional Overlays: India, US, UK)                        |
|  Terraform (AWS IaC) | Prometheus + Grafana | Nginx (TLS)               |
|  Docker Compose | Backup/DR (RTO 4h, RPO 1h)                           |
+--------------------------------------------------------------------------+
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architectural breakdown.

---

## Clinical Algorithms and Evidence Base

Every clinical algorithm in RecoveryPilot is implemented from peer-reviewed literature and validated clinical scoring systems. None are arbitrary heuristics -- each has a traceable provenance to published research.

### Sepsis Detection

| Algorithm | Source | Citation | Implementation |
|-----------|--------|----------|----------------|
| **qSOFA** (Quick SOFA) | Sepsis-3 Consensus | Singer M, et al. *JAMA*. 2016;315(8):801-810. [doi:10.1001/jama.2016.0287](https://doi.org/10.1001/jama.2016.0287) | `sepsisEarlyWarningSystem.ts` |
| **SIRS Criteria** | ACCP/SCCM Consensus | Bone RC, et al. *Chest*. 1992;101(6):1644-1655. [doi:10.1378/chest.101.6.1644](https://doi.org/10.1378/chest.101.6.1644) | `sepsisEarlyWarningSystem.ts` |
| **SOFA Score** | European Society of ICM | Vincent JL, et al. *Intensive Care Med*. 1996;22:707-710. [doi:10.1007/BF01709751](https://doi.org/10.1007/BF01709751) | `sepsisEarlyWarningSystem.ts` |

**How it works:** qSOFA screens for sepsis at the bedside using 3 criteria (GCS < 15, systolic BP <= 100, RR >= 22). Score >= 2 triggers escalation. SOFA provides granular organ-by-organ assessment (respiratory, coagulation, liver, cardiovascular, CNS, renal) scored 0-4 each. The system uses self-learning threshold adjustment based on confirmed sepsis cases to reduce false positives over time.

**Validation data:** qSOFA has been validated in >180,000 patients with suspected infection (Seymour CW, et al. *JAMA*. 2016;315(8):762-774), showing AUROC 0.607 for in-hospital mortality prediction. SOFA score >= 2 has sensitivity 67-90% for sepsis.

### Venous Thromboembolism (VTE) Risk

| Algorithm | Source | Citation | Implementation |
|-----------|--------|----------|----------------|
| **Caprini Score** | Caprini Risk Assessment | Caprini JA. *Thromb Haemost*. 2001;5(Suppl 1). [doi:10.1055/s-0037-1616091](https://doi.org/10.1055/s-0037-1616091) | `dvtRiskCalculator.ts` |
| **Wells Score (DVT)** | Wells Prediction Rule | Wells PS, et al. *NEJM*. 2003;349:1227-1235. [doi:10.1056/NEJMoa023351](https://doi.org/10.1056/NEJMoa023351) | `dvtRiskCalculator.ts` |
| **Wells Score (PE)** | Wells PE Criteria | Wells PS, et al. *Thromb Haemost*. 2000;83:416-420. | `dvtRiskCalculator.ts` |
| **Revised Geneva Score** | Geneva VTE Prediction | Le Gal G, et al. *Ann Intern Med*. 2006;144(3):165-171. | `dvtRiskCalculator.ts` |

**How it works:** The Caprini model uses 40+ weighted risk factors (1-point: age 41-60, minor surgery, BMI 25-30; 2-point: age 61-74, major surgery, malignancy, bed rest >72h; 3-point: age 75+, prior DVT/PE, Factor V Leiden, prothrombin mutation). Total score stratifies risk: 0-1 (low), 2 (moderate), 3-4 (high), 5+ (highest). Prophylaxis recommendations are generated automatically: mechanical only for low-moderate, pharmacological for high, combined for highest.

**Validation data:** The Caprini score has been validated in >8,000 surgical patients (Bahl V, et al. *Ann Surg*. 2010;251(2):344-350) with VTE rates: score 0-2 = 0.7%, score 3-4 = 1.0%, score 5-6 = 1.3%, score 7-8 = 2.7%, score 9+ = 7.1%.

### Fall Risk Assessment

| Algorithm | Source | Citation | Implementation |
|-----------|--------|----------|----------------|
| **Morse Fall Scale** | Morse Fall Scale | Morse JM, et al. *Western J Nursing Res*. 1989;11(3):315-328. [doi:10.1177/019394598901100307](https://doi.org/10.1177/019394598901100307) | `fallRiskAssessment.ts` |
| **Hendrich II Fall Risk** | Hendrich II Model | Hendrich AL, et al. *Applied Nursing Res*. 2003;16(1):20-30. [doi:10.1053/apnr.2003.YAPNR8](https://doi.org/10.1053/apnr.2003.YAPNR8) | `fallRiskAssessment.ts` |
| **Timed Up and Go** | TUG Test | Podsiadlo D, Richardson S. *J Am Geriatr Soc*. 1991;39(2):142-148. | `fallRiskAssessment.ts` |

**How it works:** Morse scores 6 items (history of falling: 25pts, secondary diagnosis: 15pts, ambulatory aid: 0/15/30pts, IV/heparin lock: 20pts, gait: 0/10/20pts, mental status: 0/15pts). Total score 0-24 = low, 25-50 = moderate, >50 = high risk. Hendrich II scores 8 items (confusion: 4pts, depression: 2pts, elimination: 1pt, dizziness: 1pt, male: 1pt, antiepileptics: 7pts, benzodiazepines: 1pt, Get-Up-and-Go: 1pt); score >= 5 = high risk.

**Validation data:** Morse Fall Scale has sensitivity 77%, specificity 72% for inpatient falls (Morse JM, 1989). Hendrich II achieves sensitivity 74.9%, specificity 73.9% (Hendrich AL, 2003). Both validated in >1,000 patient samples.

### Nutritional Risk

| Algorithm | Source | Citation | Implementation |
|-----------|--------|----------|----------------|
| **NRS-2002** | Nutritional Risk Screening | Kondrup J, et al. *Clinical Nutrition*. 2003;22(3):321-336. [doi:10.1016/S0261-5614(03)00098-0](https://doi.org/10.1016/S0261-5614(03)00098-0) | `nutritionalRiskScreening.ts` |
| **MUST** | Malnutrition Universal Screening | Elia M. BAPEN. 2003. ISBN 1 899467 70 X. | `nutritionalRiskScreening.ts` |
| **SGA** | Subjective Global Assessment | Detsky AS, et al. *JPEN*. 1987;11(1):8-13. [doi:10.1177/014860718701100108](https://doi.org/10.1177/014860718701100108) | `nutritionalRiskScreening.ts` |
| **Harris-Benedict** | Basal Metabolic Rate | Harris JA, Benedict FG. *Carnegie Inst*. 1919;279:370-373. | `nutritionalRiskScreening.ts` |
| **Mifflin-St Jeor** | Resting Metabolic Rate | Mifflin MD, et al. *Am J Clin Nutr*. 1990;51(2):241-247. | `nutritionalRiskScreening.ts` |

**How it works:** NRS-2002 computes nutritional score (0-3) + disease severity score (0-3) + age adjustment (+1 if >70). Total >= 3 indicates nutritional risk. MUST uses BMI score + unplanned weight loss score + acute disease effect. SGA classifies patients into A (well-nourished), B (moderate), or C (severe malnutrition) based on history and physical exam. Caloric needs are calculated using Harris-Benedict (BMR = 66.47 + 13.75W + 5.003H - 6.755A for males) and Mifflin-St Jeor (RMR = 10W + 6.25H - 5A + 5 for males) equations.

**Validation data:** NRS-2002 was validated in 128 randomized controlled trials (Kondrup et al., 2003) and is recommended by ESPEN as the standard screening tool. MUST has inter-rater reliability kappa >0.8 (Elia, 2003).

### Surgical Site Infection (SSI)

| Algorithm | Source | Citation | Implementation |
|-----------|--------|----------|----------------|
| **NNIS Risk Index** | CDC/NHSN System | Culver DH, et al. *Am J Med*. 1991;91(3B):152S-157S. [doi:10.1016/0002-9343(91)90361-Z](https://doi.org/10.1016/0002-9343(91)90361-Z) | `ssiPredictor.ts` |
| **CDC SSI Classification** | CDC Definitions | Horan TC, et al. *Am J Infect Control*. 2008;36(5):309-332. | `ssiPredictor.ts` |
| **ASA Physical Status** | ASA Classification | ASA. *Anesthesiology*. 1963;24:111. | `ssiPredictor.ts` |
| **ASEPSIS Score** | Wound Scoring | Wilson AP, et al. *Lancet*. 1986;1(8476):311-313. | `ssiPredictor.ts` |

**How it works:** NNIS Risk Index scores 0-3: ASA component (1 if ASA >= 3), wound class component (1 if contaminated/dirty-infected), duration component (1 if exceeds 75th percentile T-time), with -1 adjustment for laparoscopic procedures. CDC classifies SSI as superficial incisional, deep incisional, or organ/space. The system generates modifiable risk factor lists with specific interventions.

**Validation data:** NNIS Risk Index validated in 84,691 surgical procedures across 44 hospitals (Culver et al., 1991). SSI rates by NNIS score: 0 = 1.5%, 1 = 2.9%, 2 = 6.8%, 3 = 13.0%.

### Blood Glucose Management

| Algorithm | Source | Citation | Implementation |
|-----------|--------|----------|----------------|
| **ADA Inpatient Targets** | ADA Standards | ADA. *Diabetes Care*. 2024;47(Suppl 1):S295-S306. [doi:10.2337/dc24-S016](https://doi.org/10.2337/dc24-S016) | `bloodGlucoseMonitor.ts` |
| **Sliding Scale Insulin** | Insulin Protocols | Umpierrez GE, et al. *Diabetes Care*. 2012;35(12):2548-2553. | `bloodGlucoseMonitor.ts` |
| **HbA1c Estimation** | ADAG Study | Nathan DM, et al. *Diabetes Care*. 2008;31(8):1473-1478. [doi:10.2337/dc08-0545](https://doi.org/10.2337/dc08-0545) | `bloodGlucoseMonitor.ts` |
| **Hypoglycemia 15/15 Rule** | ADA Guidelines | ADA. *Diabetes Care*. 2024;47(Suppl 1). | `bloodGlucoseMonitor.ts` |

**How it works:** Target glucose 140-180 mg/dL for general inpatients (ADA recommendation). Insulin correction factor calculated as 1800/TDD (total daily dose) for rapid-acting insulin. Insulin-to-carbohydrate ratio = 500/TDD. HbA1c estimated from average glucose using the ADAG formula: eA1C = (meanGlucose + 46.7) / 28.7. Hypoglycemia treated with 15/15 rule (15g carbs, recheck in 15 minutes). Level 1: 54-69 mg/dL, Level 2: <54 mg/dL, Level 3: severe altered consciousness.

**Validation data:** 1800 rule validated in >500 patients on insulin pumps (Walsh J, et al., 2011). ADA inpatient targets reduce infection rates by 30-40% vs. uncontrolled hyperglycemia (Umpierrez, 2012).

### Vital Sign Monitoring

| Algorithm | Source | Citation | Implementation |
|-----------|--------|----------|----------------|
| **NEWS2** | Royal College of Physicians | Royal College of Physicians. *NEWS2*. 2017. ISBN 978-1-86016-697-2. | `vitalSignForecastingEngine.ts` |
| **MEWS** | Modified Early Warning | Subbe CP, et al. *QJM*. 2001;94(10):521-526. [doi:10.1093/qjmed/94.10.521](https://doi.org/10.1093/qjmed/94.10.521) | `vitalSignForecastingEngine.ts` |
| **Exponential Smoothing** | Holt's Method | Holt CC. *International Journal of Forecasting*. 2004;20(1):5-10. [doi:10.1016/j.ijforecast.2003.09.015](https://doi.org/10.1016/j.ijforecast.2003.09.015) | `vitalSignForecastingEngine.ts` |

**How it works:** NEWS2 scores 7 parameters (respiratory rate, SpO2, supplemental O2, systolic BP, heart rate, consciousness, temperature) on 0-3 scales. Total 0-4 = low, 5-6 = medium, 7+ = high clinical risk. The forecasting engine uses double exponential smoothing (Holt's method) with trend detection to predict vital sign trajectories 24+ hours ahead with confidence intervals. Trigger detection identifies threshold breaches, rapid changes, trend deterioration, and composite score escalation.

**Validation data:** NEWS2 has AUROC 0.89 for cardiac arrest prediction within 24h (Smith GB, et al. *Resuscitation*. 2013;84(4):465-470). MEWS has sensitivity 75% and specificity 83% for identifying patients requiring ICU admission (Subbe, 2001).

### Antibiotic Stewardship

| Algorithm | Source | Citation | Implementation |
|-----------|--------|----------|----------------|
| **IDSA Guidelines** | Infectious Diseases Society | Various IDSA practice guidelines. [idsociety.org](https://www.idsociety.org/practice-guideline/practice-guidelines/) | `antibioticStewardshipEngine.ts` |
| **CYP450 Interactions** | Drug Metabolism | Flockhart DA. *Drug Interactions: Cytochrome P450*. Indiana University. 2007. | `antibioticStewardshipEngine.ts` |
| **Sanford Guide** | Antimicrobial Therapy | Gilbert DN, et al. *The Sanford Guide to Antimicrobial Therapy*. 54th ed. 2024. | `antibioticStewardshipEngine.ts` |

**How it works:** The engine maintains a database of 30+ antibiotics with spectrum profiles (gram-positive, gram-negative, anaerobes, atypicals, MRSA, Pseudomonas, ESBL coverage rated NONE through EXCELLENT). Renal dose adjustments use creatinine clearance (CrCl) ranges. The system checks allergy cross-reactivity, recommends IV-to-oral conversion when eligible, and tracks local resistance patterns using self-learning algorithms.

### Additional Scoring Systems

| Algorithm | Source | Implementation |
|-----------|--------|----------------|
| **Charlson Comorbidity Index** | Charlson ME, et al. *J Chronic Dis*. 1987;40(5):373-383. | Risk assessment services |
| **LACE Index** (readmission) | van Walraven C, et al. *CMAJ*. 2010;182(6):551-557. | Readmission prediction |
| **Pain Protocol Engine** | WHO Analgesic Ladder. *Cancer Pain Relief*. 2nd ed. 1996. | `painProtocolEngine.ts` |
| **SBAR Handoff** | Haig KM, et al. *Jt Comm J Qual Patient Saf*. 2006;32(3):167-175. | `handoffCommunicationEngine.ts` |
| **HCAHPS** | CMS Hospital Compare. [hcahpsonline.org](https://hcahpsonline.org/) | `patientSatisfactionEngine.ts` |

For the full algorithm reference with mathematical formulas and implementation details, see [docs/ALGORITHMS.md](docs/ALGORITHMS.md).

---

## Machine Learning Models

All 14 ML models are implemented in **pure TypeScript** with zero external ML/AI library dependencies. Each model lives in `src/services/mlModels/` and uses well-established statistical and machine learning techniques.

| Model | Technique | Source Literature | Purpose |
|-------|-----------|-------------------|---------|
| **Recovery Prediction** | Logistic Regression + Decision Trees | Cox DR. *JRSS-B*. 1958;20(2):215-242; Breiman L. *Machine Learning*. 2001;45:5-32. | Predict recovery trajectory |
| **Risk Scoring Engine** | Multi-factor weighted scoring | LACE: van Walraven 2010; CCI: Charlson 1987; ASA: ASA 1963 | Composite patient risk |
| **Anomaly Detection** | Mahalanobis distance + Z-score + IQR | Mahalanobis PC. *Proc Natl Inst Sci India*. 1936;2:49-55; Tukey JW. *EDA*. 1977. | Detect abnormal vitals/labs |
| **Sentiment Analysis** | TF-IDF + Medical lexicon (300+ terms) | Salton G, Buckley C. *Info Processing & Mgmt*. 1988;24(5):513-523. | Analyze patient mood from journals |
| **Symptom Checker** | Bayesian probability matrix | Pearl J. *Probabilistic Reasoning*. Morgan Kaufmann. 1988. | Symptom-to-condition mapping |
| **Self-Learning Engine** | Online learning + calibration | Platt J. *Advances in Large Margin Classifiers*. 2000:61-74. | Continuous model improvement |
| **Drug Interaction** | Rule-based + CYP450 pathways | Flockhart DA. Indiana University Drug Interaction Table. 2007. | Check drug interactions |
| **Readmission Risk** | LACE Index + comorbidity weighting | van Walraven C, et al. *CMAJ*. 2010;182(6):551-557. | Predict 30-day readmission |
| **Wound Healing** | Multi-phase classification | Guo S, DiPietro LA. *J Dent Res*. 2010;89(3):219-229. | Classify wound healing phase |
| **Medication Adherence** | Regression + behavioral features | Osterberg L, Blaschke T. *NEJM*. 2005;353:487-497. | Predict adherence |
| **Clinical NLP** | Tokenization + UMLS mapping | Bodenreider O. *Nucleic Acids Res*. 2004;32(Database):D267-D270. | Parse clinical notes |
| **Bayesian Network** | Directed acyclic graph inference | Pearl J. *Causality*. Cambridge University Press. 2009. | Complication prediction |
| **Patient Clustering** | K-means + Euclidean distance | Lloyd S. *IEEE Trans Info Theory*. 1982;28(2):129-137. | Patient segmentation |
| **Treatment Response** | Regression + outcome tracking | Friedman JH. *Annals of Statistics*. 2001;29(5):1189-1232. | Predict treatment outcomes |

**Self-learning capability:** Models incorporate online learning that adjusts weights based on doctor overrides, confirmed outcomes, and calibration feedback. Concept drift detection ensures models stay accurate as patient populations change over time. See [docs/ML_MODELS.md](docs/ML_MODELS.md) for performance metrics.

---

## Feature Set

### For Patients
- **Daily Recovery Missions** -- AI-generated tasks (photo uploads, medication checks, exercise logs) with due dates
- **Wound Photo Analysis** -- Google Gemini Vision API analyzes surgical wound photos with confidence scores
- **Gamification** -- Streaks, XP points, 5 badge categories with rarity tiers, leaderboard, challenges
- **Pain Tracking** -- Log pain levels with body-map, trigger tracking, and trend analysis
- **Vital Signs** -- Track heart rate, BP, temperature, SpO2, respiratory rate with NEWS2 scoring
- **Symptom Checker** -- Multi-symptom assessment with Bayesian probability mapping
- **Nutrition Tracking** -- Meal logging with macronutrient analysis and surgical recovery goals
- **Sleep Tracking** -- Sleep quality scoring with circadian rhythm analysis
- **Journal** -- Mood logging with sentiment analysis and depression/anxiety screening
- **Wearable Integration** -- Sync with Fitbit, Apple Watch, Garmin devices
- **Educational Content** -- Plain-language medical explanations for procedures and medications

### For Doctors
- **AI-Triaged Inbox** -- Action items pre-analyzed with confidence scores and recommended actions
- **One-Click Approve/Reject** -- Rapid decision workflow with timestamped audit trail
- **Care Plan Management** -- Templates, custom mission scheduling, medication prescriptions
- **Clinical Decision Support** -- 40+ scoring systems accessible from the dashboard
- **SBAR Handoff Notes** -- Standardized communication format for team handoffs
- **Lab Result Interpretation** -- Automated lab value analysis with reference ranges
- **Workload Balancing** -- Algorithmic distribution of patients across care team
- **Population Analytics** -- Cohort analysis and outcome tracking

### For Administrators
- **User Management** -- Role-based access control (patient, doctor, admin)
- **Audit Logging** -- Immutable, hash-chained, timestamped log of all clinical actions
- **FHIR Compliance** -- HL7 FHIR R4 resource generation and export
- **Data Export** -- JSON, CSV, FHIR bundle export with patient anonymization
- **Consent Management** -- Digital consent workflows with version tracking and granular consent types
- **Quality Metrics** -- HCAHPS scores, readmission rates, outcome dashboards
- **Compliance Management** -- DPDPA, HIPAA, UK GDPR enforcement with erasure and portability APIs

---

## Technology Stack

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| UI Framework | React | 19.2.0 | Component-based UI with hooks |
| Language | TypeScript | 5.9.3 | Strict mode, type-safe codebase |
| State Management | Zustand | 5.0.10 | 7 primary + 15 feature stores |
| Routing | React Router | 7.13.0 | Client-side SPA routing |
| Styling | TailwindCSS | 4.1.18 | Utility-first responsive design |
| Animations | Framer Motion | 12.29.2 | Smooth UI transitions |
| Icons | Lucide React | 0.563.0 | Medical and UI iconography |
| Build Tool | Vite (Rolldown) | 7.2.5 | Rust-powered production bundling |
| Testing | Vitest | 4.0.18 | Unit, integration, E2E tests |
| Component Testing | React Testing Library | 16.3.2 | DOM testing utilities |
| Property Testing | fast-check | 4.5.3 | Property-based test generation |
| AI Integration | Google Gemini Vision API | -- | Wound image analysis |
| Linting | ESLint + TypeScript-ESLint | 9.39.1 | Code quality enforcement |

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| API Framework | Express | 5.1.0 | HTTP server with cluster mode |
| Runtime | Node.js | >= 22.0.0 | Server-side JavaScript runtime |
| Database | PostgreSQL | 17 | Primary data store with read replicas |
| Query Builder | Knex | 3.1.0 | SQL query builder and migrations |
| Cache / Sessions | Redis (ioredis) | 5.6.0 | 4-database architecture (session, cache, rate-limit, queue) |
| Job Queue | BullMQ | 5.30.1 | 5 async processing queues |
| Authentication | Passport.js + JWT | 0.7.0 | Strategy-based auth with token rotation |
| Password Hashing | Argon2 | 0.41.1 | Argon2id with bcrypt migration path |
| 2FA | otplib (TOTP) | 12.0.1 | RFC 6238 time-based one-time passwords |
| Validation | Zod | 3.24.4 | Runtime schema validation on all endpoints |
| Logging | Pino | 9.6.0 | Structured JSON logging with PHI redaction |
| Security Headers | Helmet | 8.1.0 | CSP, HSTS, X-Frame-Options, etc. |
| Rate Limiting | express-rate-limit | 7.5.0 | 3-tier DDoS and abuse protection |
| Encryption | Node.js crypto | -- | AES-256-GCM field-level encryption |
| Cloud Storage | AWS SDK v3 (S3, KMS, Secrets Manager) | 3.x | Medical images, audit logs, backups |

### Infrastructure

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Orchestration | Kubernetes | Multi-region deployment with 3 regional overlays |
| IaC | Terraform | AWS infrastructure provisioning |
| Reverse Proxy | Nginx | TLS termination, security headers, rate limiting |
| Containers | Docker Compose | Local production simulation |
| Monitoring | Prometheus + Grafana | Metrics collection, dashboards, 20+ alert rules |
| Backup/DR | Automated policies | RTO 4 hours, RPO 1 hour |

---

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0 (22.x recommended)
- **npm** >= 9.0.0
- **Git**

### Option 1: Automated Setup

```bash
# Linux/macOS
git clone https://github.com/kumkum-thakur/recovery-pilot.git
cd recovery-pilot
chmod +x autoconfig.sh
./autoconfig.sh

# Windows
git clone https://github.com/kumkum-thakur/recovery-pilot.git
cd recovery-pilot
autoconfig.bat
```

### Option 2: Manual Setup (Frontend)

```bash
git clone https://github.com/kumkum-thakur/recovery-pilot.git
cd recovery-pilot

# Install dependencies
npm install

# (Optional) Configure AI wound analysis
cp .env.example .env
# Edit .env and add your Google Gemini API key

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Option 3: Full-Stack Development

The backend requires PostgreSQL 17+ and Redis 7+, or use Docker Compose:

```bash
# Start infrastructure services
docker compose -f infrastructure/docker-compose.production.yaml up -d

# Install and start the backend
cd server
npm install
cp .env.example .env
# Edit .env with your database, Redis, and AWS credentials
npm run dev

# In a separate terminal, start the frontend
cd ..
npm run dev
```

### Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Patient | `divya` | `divya` |
| Doctor | `dr.smith` | `smith` |
| Admin | `admin` | `admin` |

---

## Deployment

### Production Build

```bash
npm run build          # TypeScript compile + Vite production build
npm run preview        # Preview production build locally
```

### Cloud Deployment (Ubuntu/Debian)

The included `autoconfig.sh` handles full server provisioning:

```bash
sudo bash autoconfig.sh
```

This idempotently:
1. Updates system packages and installs Node.js 22
2. Configures swap space for small instances
3. Clones/pulls latest code and builds
4. Configures Nginx as reverse proxy with security headers
5. Sets up UFW firewall
6. Creates auto-update cron job (5-minute intervals)

### Kubernetes Multi-Region

```bash
# One-click deployment
chmod +x autodeploy-k8s.sh
./autodeploy-k8s.sh

# Or manually with kubectl
kubectl apply -k infrastructure/kubernetes/base/

# Apply a regional compliance overlay
kubectl apply -k infrastructure/kubernetes/overlays/india/
```

Three regional overlays enforce data residency and compliance:

| Region | Overlay | Compliance Regime | AWS Region |
|--------|---------|-------------------|------------|
| India | `overlays/india/` | DPDPA | ap-south-1 |
| United States | `overlays/us/` | HIPAA | us-east-1 |
| United Kingdom | `overlays/uk/` | UK GDPR | eu-west-2 |

### Docker Compose (Production)

```bash
docker compose -f infrastructure/docker-compose.production.yaml up -d
```

Starts PostgreSQL 17, Redis 7, the API server, and monitoring services.

### Monitoring

Prometheus scrapes metrics every 15 seconds. 20+ alert rules cover critical conditions including API error rates, database connection exhaustion, Redis memory pressure, queue backlog growth, and authentication failures.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guides.

---

## Testing

```bash
npm run test              # Run all tests
npm run test:ui           # Interactive test UI
npm run test:coverage     # Coverage report
```

### Test Suite Overview

**92 test files** across **2,700+ test cases** covering every layer of the platform:

| Category | Files | What It Validates |
|----------|-------|-------------------|
| Clinical Validation | 1 | 18 clinical algorithms across 5 deterministic seed rounds (160+ cases) |
| ML Model Validation | 1 | 13 ML models with cross-model consistency and doctor-in-the-loop learning |
| ML Model Unit Tests | 11 | Individual ML model logic (recovery prediction, clustering, NLP, Bayesian networks, etc.) |
| Service Unit Tests | 35 | Individual service logic (sepsis, DVT, falls, nutrition, SSI, glucose, antibiotics, etc.) |
| Integration Tests | 3 | Store interactions, auth flows, data persistence, cross-service workflows |
| E2E Workflows | 1 | Full admin-doctor-patient lifecycle, multi-user isolation |
| Component Tests | 11 | React component rendering, user interaction, error boundaries |
| Store Tests | 10 | Zustand store logic, streaks, timeouts, feature stores |
| Page Tests | 2 | Doctor dashboard and login page rendering |
| Medical Review Tests | 4 | AI image analysis, storage systems, property-based testing |
| Infrastructure | 1 | Build system, persistence, auth system verification |
| Configuration | 1 | Tailwind, dependencies, project scripts |
| Property-Based | 2 | Randomized invariant verification (fast-check) |

Tests use deterministic seed data (seeds: 42, 137, 256, 389, 501) with 50 synthetic patient records per round for reproducible clinical scenarios.

See [docs/TESTING.md](docs/TESTING.md) for testing philosophy and guides.

---

## Security and Compliance

RecoveryPilot implements defense-in-depth security across every layer and is architected for three regulatory compliance regimes simultaneously.

### Authentication and Authorization

| Control | Implementation |
|---------|----------------|
| Password hashing | Argon2id (OWASP recommended) with automatic bcrypt migration |
| Token management | JWT access (15min) + refresh (7d) with rotation and blacklisting |
| Multi-factor auth | TOTP (RFC 6238) via otplib |
| Session control | Redis-backed, max 5 concurrent sessions, IP and user-agent binding |
| Account lockout | 5 failed attempts triggers lockout |
| Role-based access | 3 roles (patient, doctor, admin) with route-level enforcement via Passport.js |
| Data ownership | Patients see own data only; doctors see assigned patients only |

### Data Protection

| Control | Implementation |
|---------|----------------|
| Encryption at rest | AES-256-GCM with PBKDF2-SHA512 key derivation (100K iterations) |
| Field-level encryption | 30+ PHI fields auto-encrypted (name, email, DOB, SSN, Aadhaar, NHS number, etc.) |
| Encryption in transit | TLS 1.3 via Nginx termination with HSTS preload |
| Audit trail | Immutable hash-chained log (SHA-256), 7-year retention, S3 Object Lock |
| Input validation | SQL/NoSQL injection detection, XSS prevention, Zod schema validation |
| Log redaction | PHI and credentials automatically redacted from all log output via Pino |
| Anonymization | HMAC-SHA256 de-identification for Safe Harbor compliance |
| Rate limiting | 3-tier: API (100/min), auth (5/15min), patient data (200/min) per IP/user |

### Regulatory Compliance

| Regime | Jurisdiction | Key Controls |
|--------|-------------|--------------|
| **DPDPA** | India | Data residency enforcement (ap-south-1), granular consent (personal, sensitive, cross-border, automated decision), right to erasure, breach notification (72h), purpose limitation |
| **HIPAA** | United States | Minimum necessary rule, audit logging (7-year retention), access controls, PHI encryption, Safe Harbor de-identification, BAA support |
| **UK GDPR** | United Kingdom | Right to erasure, data portability (FHIR R4 export), explicit consent, breach notification (72h), DPA compliance, lawful basis tracking |

Compliance is enforced programmatically through dedicated API routes:

- `POST /compliance/erasure-request` -- Right to erasure (DPDPA / UK GDPR)
- `POST /compliance/portability-request` -- FHIR R4 data export
- `POST /compliance/consents/:type/grant` -- Granular consent management
- `GET /compliance/regime` -- Active compliance configuration

### Infrastructure Security

| Layer | Controls |
|-------|----------|
| Kubernetes | Network policies, pod security standards, namespace isolation, secrets encryption |
| Nginx | TLS termination, HSTS (1-year preload), CSP, X-Frame-Options, rate limiting |
| Monitoring | Prometheus alerting on auth failures, rate limit spikes, error rates |
| Backup/DR | Automated backups, RTO 4 hours, RPO 1 hour |
| Docker | Non-root containers, minimal base images |

See [SECURITY.md](SECURITY.md) for the full security policy and vulnerability reporting process.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, component hierarchy, data flow |
| [docs/ALGORITHMS.md](docs/ALGORITHMS.md) | All clinical algorithms with citations and formulas |
| [docs/ML_MODELS.md](docs/ML_MODELS.md) | ML model details, training data, performance metrics |
| [docs/CLINICAL_VALIDATION.md](docs/CLINICAL_VALIDATION.md) | Evidence base and clinical validation methodology |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Service layer API reference |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guides for all platforms |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Developer setup and contribution workflow |
| [docs/TESTING.md](docs/TESTING.md) | Testing strategy, running tests, writing tests |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Project Structure

```
recovery-pilot/
  src/
    components/          # 25 React UI components
    pages/               # Page-level components (Patient, Doctor, Admin dashboards)
    stores/              # Zustand state management (7 primary + 15 feature stores)
    hooks/               # Custom React hooks
    types/               # TypeScript type definitions (3,200+ lines)
    services/            # 70+ service modules
      # Clinical Decision Support (8 engines)
      sepsisEarlyWarningSystem.ts      # qSOFA, SIRS, SOFA
      dvtRiskCalculator.ts             # Caprini, Wells, Geneva
      fallRiskAssessment.ts            # Morse, Hendrich II, TUG
      nutritionalRiskScreening.ts      # NRS-2002, MUST, SGA
      ssiPredictor.ts                  # NNIS, CDC SSI, ASEPSIS
      bloodGlucoseMonitor.ts           # ADA targets, sliding scale
      antibioticStewardshipEngine.ts   # IDSA, CYP450, Sanford
      painProtocolEngine.ts            # WHO analgesic ladder
      # Agent and Workflow Services
      agentService.ts                  # AI triage orchestration
      geminiService.ts                 # Google Gemini Vision API
      missionGenerationService.ts      # Recovery mission creation
      refillEngine.ts                  # Medication refill automation
      gamificationEngine.ts            # Streaks, XP, badges, challenges
      # And 50+ more services...
      mlModels/            # 14 pure-TypeScript ML models
        recoveryPredictionModel.ts     # Logistic regression + decision trees
        riskScoringEngine.ts           # LACE, CCI, ASA composite
        anomalyDetectionEngine.ts      # Mahalanobis, Z-score, IQR
        sentimentAnalysisEngine.ts     # TF-IDF, medical lexicon
        symptomCheckerModel.ts         # Bayesian probability matrix
        selfLearningEngine.ts          # Online learning + calibration
        drugInteractionChecker.ts      # CYP450 pathways
        readmissionRiskPredictor.ts    # LACE + comorbidity
        woundHealingClassifier.ts      # Healing phase classification
        medicationAdherencePredictor.ts  # Behavioral regression
        clinicalNLPEngine.ts           # UMLS tokenization
        complicationBayesianNetwork.ts # DAG inference
        patientClusteringEngine.ts     # K-means segmentation
        treatmentResponsePredictor.ts  # Outcome regression
    medical-review/      # AI image analysis subsystem
    test/                # 6 comprehensive validation suites
    utils/               # Utility modules
  server/
    src/
      routes/            # API endpoints (auth, patients, clinical, admin, compliance, health)
      middleware/         # Security, authentication, audit logging, compliance
      config/            # Environment, database, Redis, compliance matrix
      utils/             # Encryption (AES-256-GCM), structured logging (Pino)
      jobs/              # BullMQ queues (image, notification, export, compliance, clinical)
      app.ts             # Express middleware pipeline
      index.ts           # Cluster mode entry point
  infrastructure/
    kubernetes/
      base/              # Deployments, services, ingress, network policies
      overlays/
        india/           # DPDPA compliance overlay (ap-south-1)
        us/              # HIPAA compliance overlay (us-east-1)
        uk/              # UK GDPR compliance overlay (eu-west-2)
    terraform/           # AWS infrastructure-as-code
    monitoring/          # Prometheus config, 20+ alerting rules
    nginx/               # Reverse proxy, TLS, security headers
    backup-dr/           # Backup policies, disaster recovery (RTO 4h, RPO 1h)
    docker-compose.production.yaml
  docs/                  # Comprehensive documentation
  autoconfig.sh          # Linux/macOS automated setup and deployment
  autodeploy-k8s.sh      # One-click Kubernetes multi-region deployment
  autoconfig.bat         # Windows development setup
```

---

## Contributing

We welcome contributions. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Code style and TypeScript conventions
- Test requirements (all new features must have tests)
- Clinical algorithm requirements (must cite peer-reviewed sources)
- Pull request process

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

### Clinical Standards Organizations
- **Sepsis-3 Task Force** -- qSOFA/SOFA definitions (Singer et al., JAMA 2016)
- **American Diabetes Association** -- Inpatient glycemic guidelines
- **Infectious Diseases Society of America** -- Antimicrobial stewardship guidelines
- **Royal College of Physicians** -- NEWS2 early warning system
- **Centers for Disease Control** -- SSI surveillance definitions
- **British Association for Parenteral and Enteral Nutrition** -- MUST screening tool
- **European Society for Clinical Nutrition and Metabolism** -- NRS-2002
- **American Society of Anesthesiologists** -- ASA Physical Status Classification
- **World Health Organization** -- Analgesic ladder, ICD coding systems

### Foundational Research
- Mahalanobis PC (1936) -- Multivariate distance measure for anomaly detection
- Harris JA, Benedict FG (1919) -- Basal metabolic rate equations
- Charlson ME et al. (1987) -- Comorbidity index for mortality prediction
- Pearl J (1988, 2009) -- Bayesian networks and causal inference
- Lloyd S (1982) -- K-means clustering algorithm
- Salton G, Buckley C (1988) -- TF-IDF term weighting for NLP
- Holt CC (2004) -- Exponential smoothing for time-series forecasting

### Technology
- **Google Gemini Vision API** -- Wound image analysis
- **React Team** -- UI framework
- **Vite/Rolldown Team** -- Rust-powered build tooling
- **Express.js** -- API framework
- **PostgreSQL** -- Primary data store
- **Redis** -- Caching, sessions, and job queue backbone

---

<p align="center">
  Built by <strong><a href="https://github.com/kumkum-thakur">Kumkum Thakur</a></strong> and <strong><a href="https://github.com/divyamohan1993">Divya Mohan</a></strong><br />
  <sub>Every algorithm traced to peer-reviewed literature. Every model running in pure TypeScript. Every patient action supervised by a physician.</sub>
</p>
