# Machine Learning Models

## Overview

RecoveryPilot implements 14 machine learning models in **pure TypeScript** with zero external ML library dependencies. Every model uses well-established statistical and machine learning techniques from peer-reviewed literature.

## Design Philosophy

1. **No black boxes** -- Every model uses interpretable techniques with explainable outputs
2. **Zero external ML dependencies** -- All implementations are from scratch in TypeScript
3. **Evidence-based techniques** -- Each method traces to published research
4. **Self-learning** -- Models improve over time through online learning from doctor feedback and confirmed outcomes
5. **Clinical safety** -- Models produce recommendations, never autonomous decisions

---

## Model Inventory

### 1. Recovery Prediction Model

**File:** `src/services/recoveryPredictionModel.ts`

**Techniques:**
- Logistic Regression (Cox DR. *JRSS-B*. 1958;20(2):215-242)
- Decision Trees with ID3 algorithm (Quinlan JR. *Machine Learning*. 1986;1:81-106)

**How it works:** Combines logistic regression (for continuous probability estimation) with decision tree rules (for handling non-linear interactions). Features include: vital sign trends, pain scores, medication adherence, mission completion rate, days post-surgery.

**Output:** Recovery trajectory classification (AHEAD_OF_SCHEDULE, ON_TRACK, DELAYED, AT_RISK) with probability (0-1) and confidence interval.

**Why logistic regression works here:** Logistic regression has been the standard for binary/ordinal medical outcome prediction since Cox (1958). It produces calibrated probabilities (not just classifications), which is critical for clinical decision support. The sigmoid function P(Y=1|X) = 1/(1+e^(-z)) where z = beta_0 + beta_1*x_1 + ... + beta_n*x_n naturally bounds output to [0,1].

### 2. Risk Scoring Engine

**File:** `src/services/riskScoringEngine.ts`

**Techniques:**
- LACE Index (van Walraven C, et al. *CMAJ*. 2010;182(6):551-557)
- Charlson Comorbidity Index (Charlson ME, et al. *J Chronic Dis*. 1987;40(5):373-383)
- ASA Physical Status (ASA, *Anesthesiology*. 1963;24:111)

**How it works:** Computes composite risk from three validated clinical scores. Each score has its own evidence base (see ALGORITHMS.md). Scores are normalized and combined with configurable weights derived from their individual validation studies.

**Validation:** LACE C-statistic 0.684 (van Walraven, 2010). CCI relative risk 1.45 per point increase (Charlson, 1987).

### 3. Anomaly Detection Engine

**File:** `src/services/anomalyDetectionEngine.ts`

**Techniques:**
- Z-score (univariate) -- Standard deviations from mean
- IQR method (Tukey JW. *Exploratory Data Analysis*. Addison-Wesley. 1977)
- Mahalanobis distance (Mahalanobis PC. *Proceedings of the National Institute of Sciences of India*. 1936;2:49-55)

**How it works:**

*Z-score:* Flags readings > 2 standard deviations from running mean. Simple but effective for univariate monitoring.

*IQR:* Uses interquartile range to identify outliers. Outlier if value < Q1 - 1.5*IQR or > Q3 + 1.5*IQR. Robust to non-normal distributions.

*Mahalanobis distance:* For multivariate anomaly detection (e.g., heart rate AND blood pressure simultaneously abnormal). Formula: D = sqrt((x - mu)^T * S^(-1) * (x - mu)) where S is the covariance matrix. Captures correlation between variables.

**Why three methods:** Each method has different strengths. Z-score is fast and interpretable. IQR handles skewed data. Mahalanobis captures multivariate patterns. The ensemble approach reduces false positives by requiring agreement between methods.

### 4. Sentiment Analysis Engine

**File:** `src/services/sentimentAnalysisEngine.ts`

**Techniques:**
- TF-IDF (Salton G, Buckley C. *Information Processing & Management*. 1988;24(5):513-523)
- Medical sentiment lexicon (300+ terms with scores from -1 to +1)
- Negation handling

**How it works:**

*TF-IDF:* Term Frequency-Inverse Document Frequency weights words by importance. TF(t,d) = count(t in d) / |d|. IDF(t) = log(N / df(t)). TF-IDF(t,d) = TF * IDF.

*Medical lexicon:* 300+ medical terms manually scored from -1 (negative: "excruciating", "terrified", "hopeless") to +1 (positive: "improving", "comfortable", "grateful"). Includes surgical recovery-specific terms.

*Negation:* Detects negation words ("not", "no", "never", "don't") and inverts sentiment of following terms within a 3-word window.

*Screening:* Flags depression keywords (PHQ-9 aligned) and anxiety keywords (GAD-7 aligned) for clinical review.

**Why TF-IDF over deep learning:** TF-IDF is interpretable, requires no training data, runs instantly in the browser, and has been the standard for text classification since Salton (1988). For the focused domain of patient journal entries, a curated medical lexicon outperforms general-purpose models.

### 5. Symptom Checker Model

**File:** `src/services/symptomCheckerModel.ts`

**Techniques:**
- Bayesian probability matrix (Pearl J. *Probabilistic Reasoning in Intelligent Systems*. Morgan Kaufmann. 1988)
- Naive Bayes classification

**How it works:** Maintains a conditional probability table P(Symptom|Condition) for common post-operative conditions. Given observed symptoms S1...Sn, computes P(Condition|S1...Sn) using Bayes' theorem:

P(C|S1...Sn) = P(C) * product(P(Si|C)) / P(S1...Sn)

**Output:** Ranked list of possible conditions with probabilities and recommended next steps.

### 6. Self-Learning Engine

**File:** `src/services/selfLearningEngine.ts`

**Techniques:**
- Online learning with stochastic gradient descent
- Platt scaling for calibration (Platt J. *Advances in Large Margin Classifiers*. MIT Press. 2000:61-74)
- Concept drift detection

**How it works:**

*Online learning:* Instead of batch retraining, updates model weights incrementally with each new data point: w_new = w_old + learning_rate * (actual - predicted) * features.

*Calibration:* Uses Platt scaling to convert raw model scores into well-calibrated probabilities. Bins predictions into deciles and compares predicted vs. actual rates.

*Concept drift:* Monitors prediction error rate over sliding windows. If error rate increases significantly (> 2 standard deviations), flags potential concept drift and increases learning rate for faster adaptation.

*Doctor override tracking:* When a doctor overrides a model recommendation, the override is fed back as a training signal, allowing the model to learn from clinical expertise.

### 7. Drug Interaction Checker

**File:** `src/services/drugInteractionChecker.ts`

**Techniques:**
- Rule-based inference with CYP450 enzyme pathway database
- Source: Flockhart DA. Drug Interactions: Cytochrome P450. Indiana University. 2007.

**How it works:** Maintains a database of 50+ drugs with their CYP450 enzyme interactions (inhibitors, inducers, substrates for CYP1A2, CYP2C9, CYP2C19, CYP2D6, CYP3A4, etc.). When two drugs are checked:
1. Identify enzyme pathways for each drug
2. Check for inhibitor+substrate or inducer+substrate conflicts
3. Classify severity: NONE, MINOR, MODERATE, MAJOR, CONTRAINDICATED
4. Generate specific clinical recommendation

### 8. Readmission Risk Predictor

**File:** `src/services/readmissionRiskPredictor.ts`

**Techniques:**
- LACE Index (van Walraven C, et al. *CMAJ*. 2010;182(6):551-557)
- Charlson Comorbidity Index weighting

**How it works:** Combines LACE score components (Length of stay, Acuity, Comorbidity, ED visits) with additional features (medication count, social support, prior readmissions). The base LACE model has C-statistic 0.684 in the derivation cohort of 4,812 patients.

### 9. Wound Healing Classifier

**File:** `src/services/woundHealingClassifier.ts`

**Technique:** Multi-phase classification based on wound healing biology

**Source:** Guo S, DiPietro LA. Factors affecting wound healing. *J Dental Research*. 2010;89(3):219-229.

**Phases classified:**
1. Hemostasis (0-2 days post-op)
2. Inflammatory (1-5 days)
3. Proliferative (3-21 days)
4. Remodeling (21 days - 2 years)

Features: days post-surgery, wound appearance descriptors, exudate characteristics, surrounding tissue condition.

### 10. Medication Adherence Predictor

**File:** `src/services/medicationAdherencePredictor.ts`

**Techniques:**
- Regression analysis with behavioral features
- Source: Osterberg L, Blaschke T. Adherence to medication. *NEJM*. 2005;353:487-497.

**Features:** Medication complexity (number of daily doses), side effect profile, patient age, prior adherence history, medication cost, pill count.

**Why these features:** Osterberg and Blaschke (2005) identified these as the strongest predictors of non-adherence in their systematic review of >200 studies. Medication complexity alone accounts for 30% of non-adherence variance.

### 11. Clinical NLP Engine

**File:** `src/services/clinicalNLPEngine.ts`

**Techniques:**
- Tokenization and normalization
- UMLS concept mapping (Bodenreider O. *Nucleic Acids Research*. 2004;32(Database):D267-D270)

**How it works:** Parses free-text clinical notes into structured data by:
1. Tokenizing text into words and phrases
2. Matching tokens against a medical term dictionary derived from UMLS (Unified Medical Language System)
3. Extracting entities: medications, conditions, procedures, measurements
4. Identifying negation context ("denies fever" -> fever = absent)

### 12. Complication Bayesian Network

**File:** `src/services/complicationBayesianNetwork.ts`

**Techniques:**
- Directed Acyclic Graph (DAG) inference
- Source: Pearl J. *Causality: Models, Reasoning, and Inference*. Cambridge University Press. 2009.

**How it works:** Models causal relationships between risk factors and complications as a Bayesian network. Each node has a conditional probability table. Given evidence (observed patient data), performs belief propagation to compute posterior probabilities of each complication.

**Network structure example:**
```
Diabetes -> Infection Risk -> SSI
Surgery Type -> Wound Healing -> SSI
Age -> Infection Risk
Immunosuppression -> Infection Risk
```

### 13. Patient Clustering Engine

**File:** `src/services/patientClusteringEngine.ts`

**Techniques:**
- K-means clustering (Lloyd S. *IEEE Transactions on Information Theory*. 1982;28(2):129-137)
- Euclidean distance metric
- Elbow method for optimal K selection

**How it works:**
1. Normalize patient features to [0,1] range
2. Initialize K centroids (K-means++ initialization)
3. Assign each patient to nearest centroid (Euclidean distance)
4. Update centroids as mean of assigned patients
5. Repeat until convergence (centroid movement < epsilon)

**Output:** Patient segments with clinical profiles (e.g., "low-risk fast recoverers", "high-acuity complex", "moderate-risk adherent").

**Why K-means:** Lloyd's algorithm is the standard for unsupervised clustering. For patient segmentation with continuous features (vitals, scores, adherence rates), K-means with Euclidean distance is both interpretable and computationally efficient. The algorithm has been used in clinical research for patient stratification in >10,000 published studies.

### 14. Treatment Response Predictor

**File:** `src/services/treatmentResponsePredictor.ts`

**Techniques:**
- Gradient boosting conceptual framework (Friedman JH. Greedy function approximation: a gradient boosting machine. *Annals of Statistics*. 2001;29(5):1189-1232)
- Outcome regression with feature importance

**How it works:** Tracks treatment-outcome pairs over time and builds a regression model predicting expected response for new patients based on similar historical cases. Features include: treatment type, patient demographics, comorbidities, baseline vital signs, prior treatment responses.

---

## Self-Learning Architecture

All models share a common self-learning framework:

```
Patient Data --> Model Prediction --> Doctor Review --> Feedback Loop
                     |                    |
                     v                    v
              Confidence Score      Override Signal
                     |                    |
                     v                    v
              Calibration Check    Weight Update (online learning)
                     |                    |
                     v                    v
              Drift Detection      Model Improvement
```

### Online Learning Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Learning rate | 0.01 | Weight update magnitude |
| Calibration bins | 10 | Probability calibration (decile) |
| Drift window | 100 predictions | Concept drift detection |
| Drift threshold | 2 sigma | Trigger for adaptation |
| Override weight | 2x | Doctor overrides count double |

### Key Properties

1. **Monotonic improvement** -- Error rate decreases over time as model sees more data
2. **Doctor-in-the-loop** -- Every model prediction is subject to doctor review
3. **Transparent confidence** -- Every prediction includes a confidence score
4. **Audit trail** -- All predictions and overrides are logged for retrospective analysis
5. **Safe defaults** -- Models default to conservative risk assessment when uncertain
