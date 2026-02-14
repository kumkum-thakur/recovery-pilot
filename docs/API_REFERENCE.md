# API Reference

## Overview

RecoveryPilot's service layer consists of 80+ TypeScript modules organized by clinical domain. Each service exports pure functions with typed inputs and outputs. There is no REST API -- all services run client-side in the browser.

## Clinical Decision Support Services

### sepsisEarlyWarningSystem

Implements Sepsis-3 consensus definitions for bedside screening.

```typescript
// qSOFA (Quick Sequential Organ Failure Assessment)
// Source: Singer M, et al. JAMA. 2016;315(8):801-810.
calculateQSOFA(vitals: VitalSigns): QSOFAResult
// Input: GCS score, systolic BP, respiratory rate
// Output: score (0-3), sepsisLikely (boolean, true if >= 2)

// SIRS (Systemic Inflammatory Response Syndrome)
// Source: Bone RC, et al. Chest. 1992;101(6):1644-1655.
calculateSIRS(vitals: VitalSigns, labs: LabValues): SIRSResult
// Input: Temperature, heart rate, respiratory rate, WBC
// Output: criteriaCount (0-4), individual criteria flags

// SOFA (Sequential Organ Failure Assessment)
// Source: Vincent JL, et al. Intensive Care Med. 1996;22:707-710.
calculateSOFA(vitals: VitalSigns, labs: LabValues, vasopressors: VasopressorInfo): SOFAResult
// Input: PaO2/FiO2, platelets, bilirubin, MAP/vasopressors, GCS, creatinine/urine output
// Output: totalScore (0-24), 6 organ system sub-scores (0-4 each)
```

### dvtRiskCalculator

Venous thromboembolism risk assessment using validated scoring models.

```typescript
// Caprini DVT Risk Assessment
// Source: Caprini JA. Thromb Haemost. 2001.
calculateCapriniScore(factors: CapriniRiskFactors): CapriniResult
// Input: 40+ boolean risk factors (age, surgery, comorbidities, thrombophilia)
// Output: totalScore, riskLevel (VERY_LOW/LOW/MODERATE/HIGH/HIGHEST), prophylaxis recommendation

// Wells Score for DVT
// Source: Wells PS, et al. NEJM. 2003;349:1227-1235.
calculateWellsDVT(factors: WellsDVTFactors): WellsDVTResult
// Output: score, probability (UNLIKELY/LIKELY)

// Wells Score for PE
calculateWellsPE(factors: WellsPEFactors): WellsPEResult
// Output: score, probability (LOW/MODERATE/HIGH)

// Revised Geneva Score
// Source: Le Gal G, et al. Ann Intern Med. 2006;144(3):165-171.
calculateRevisedGeneva(factors: GenevaFactors): GenevaResult
// Output: score, probability (LOW/INTERMEDIATE/HIGH)
```

### fallRiskAssessment

Fall risk screening using two validated scales.

```typescript
// Morse Fall Scale
// Source: Morse JM, et al. Western J Nursing Res. 1989;11(3):315-328.
calculateMorseFallScale(input: MorseFallScaleInput): MorseFallScaleResult
// Input: 6 items (history of falling, secondary diagnosis, ambulatory aid,
//        IV/heparin lock, gait, mental status)
// Output: totalScore (0-125), riskLevel (NO_RISK/LOW/MODERATE/HIGH),
//         componentScores, interpretation

// Hendrich II Fall Risk Model
// Source: Hendrich AL, et al. Applied Nursing Res. 2003;16(1):20-30.
calculateHendrichII(input: HendrichIIInput): HendrichIIResult
// Input: 8 items (confusion, depression, elimination, dizziness,
//        male gender, antiepileptics, benzodiazepines, get-up-and-go)
// Output: totalScore, highRisk (boolean, >= 5), componentScores
```

### nutritionalRiskScreening

Nutritional risk assessment using three internationally validated tools.

```typescript
// NRS-2002 (Nutritional Risk Screening)
// Source: Kondrup J, et al. Clinical Nutrition. 2003;22(3):321-336.
calculateNRS2002(input: NRS2002Input): NRS2002Result
// Output: totalScore (0-7), atNutritionalRisk (boolean, >= 3),
//         nutritionalScore (0-3), severityScore (0-3), ageAdjustment (0/1)

// MUST (Malnutrition Universal Screening Tool)
// Source: Elia M. BAPEN. 2003.
calculateMUST(input: MUSTInput): MUSTResult
// Input: BMI, unplanned weight loss %, acutely ill boolean
// Output: totalScore, riskLevel (LOW/MODERATE/HIGH)

// SGA (Subjective Global Assessment)
// Source: Detsky AS, et al. JPEN. 1987;11(1):8-13.
calculateSGA(input: SGAInput): SGAResult
// Output: classification (A/B/C), interpretation

// Caloric Needs
calculateHarrisBenedict(anthropometrics: PatientAnthropometrics): number
calculateMifflinStJeor(anthropometrics: PatientAnthropometrics): number
```

### ssiPredictor

Surgical site infection risk prediction.

```typescript
// NNIS Risk Index
// Source: Culver DH, et al. Am J Med. 1991;91(3B):152S-157S.
calculateNNISRiskIndex(procedure: SurgicalProcedure, patient: PatientSSIProfile): NNISRiskIndex
// Input: ASA score, wound class, operative duration, laparoscopic status
// Output: score (0-3), predictedSSIRate (%), riskLevel

// CDC SSI Classification
classifySSI(findings: SSIFindings): CDCSSIClassification
// Output: SUPERFICIAL_INCISIONAL, DEEP_INCISIONAL, or ORGAN_SPACE
```

### bloodGlucoseMonitor

Blood glucose monitoring and insulin management.

```typescript
// Glucose Classification (ADA targets: 140-180 mg/dL)
classifyGlucose(value: number): GlucoseStatus

// Sliding Scale Insulin
calculateSlidingScale(glucose: number, intensity: SlidingScaleIntensity): number
// Output: Insulin units to administer

// Correction Factor (1800 Rule)
calculateCorrectionFactor(totalDailyDose: number): CorrectionFactor
// Output: correctionFactor = 1800/TDD, insulinCarbRatio = 500/TDD

// HbA1c Estimation (ADAG Formula)
// Source: Nathan DM, et al. Diabetes Care. 2008;31(8):1473-1478.
estimateHbA1c(averageGlucose: number): number
// Formula: eA1C = (meanGlucose + 46.7) / 28.7
```

### vitalSignForecastingEngine

Time-series forecasting for vital signs with early warning scoring.

```typescript
// NEWS2 (National Early Warning Score 2)
// Source: Royal College of Physicians. 2017.
calculateNEWS2(vitals: VitalSigns): NEWS2Score
// Output: totalScore (0-20), riskLevel, componentScores (7 parameters),
//         clinicalResponse, monitoringFrequency

// MEWS (Modified Early Warning Score)
// Source: Subbe CP, et al. QJM. 2001;94(10):521-526.
calculateMEWS(vitals: VitalSigns): MEWSScore

// Vital Sign Forecasting (Holt's double exponential smoothing)
forecastVitalSigns(readings: VitalReading[], hoursAhead: number): VitalForecast
// Output: forecastedValues with confidence intervals (upperBound, lowerBound)
```

### antibioticStewardshipEngine

Antibiotic selection, dosing, and interaction checking.

```typescript
// Antibiotic Recommendation
recommendAntibiotic(infection: InfectionProfile, patient: PatientProfile): AntibioticRecommendation
// Output: Drug selection, dose, route, duration, spectrum coverage

// Renal Dose Adjustment (CrCl-based)
adjustForRenalFunction(drug: AntibioticProfile, crCl: number): DoseAdjustment

// Allergy Cross-Reactivity Check
checkAllergyCrossReactivity(drug: string, allergies: string[]): AllergyRisk

// IV-to-Oral Conversion Eligibility
assessIVToOralConversion(patient: PatientProfile): IVToOralEligibility
```

## ML Model Services

### recoveryPredictionModel

```typescript
// Logistic regression + decision tree ensemble
predictRecoveryTrajectory(patient: PatientProfile, vitals: VitalHistory): RecoveryPrediction
// Output: probability (0-1), trajectory (AHEAD/ON_TRACK/DELAYED/AT_RISK), confidence
```

### anomalyDetectionEngine

```typescript
// Multi-method anomaly detection
// Methods: Z-score, IQR, Mahalanobis distance
detectAnomalies(readings: VitalReading[]): AnomalyResult[]
// Output: Array of anomalies with severity, method used, and affected vital
```

### sentimentAnalysisEngine

```typescript
// TF-IDF + Medical lexicon (300+ terms)
analyzeSentiment(text: string): SentimentResult
// Output: score (-1 to +1), label (POSITIVE/NEUTRAL/NEGATIVE),
//         depressionScreenFlag, anxietyScreenFlag
```

### patientClusteringEngine

```typescript
// K-means clustering
clusterPatients(patients: PatientFeatureVector[]): ClusterResult
// Output: cluster assignments, centroids, silhouette scores
```

## Data Services

### persistenceService

```typescript
// CRUD operations for LocalStorage
getUsers(): UserModel[]
saveUser(user: UserModel): void
getMissions(patientId: string): MissionModel[]
saveMission(mission: MissionModel): void
getActionItems(): ActionItem[]
saveActionItem(item: ActionItem): void
```

### auditLogService

```typescript
// Immutable audit trail
logAction(action: AuditAction): void
getAuditLog(filters?: AuditFilters): AuditEntry[]
// Every clinical action (approve, reject, prescribe, modify) is logged
// with timestamp, userId, action type, and before/after state
```

### fhirResourceEngine

```typescript
// HL7 FHIR R4 resource generation
generatePatientResource(patient: UserModel): FHIRPatient
generateObservationResource(vital: VitalReading): FHIRObservation
generateBundleResource(resources: FHIRResource[]): FHIRBundle
exportFHIRBundle(patientId: string): string  // JSON string
```

### dataExportService

```typescript
// Multi-format export
exportJSON(patientId: string): string
exportCSV(patientId: string): string
exportFHIR(patientId: string): string
anonymizePatientData(data: PatientData): AnonymizedData
```

## Store API

### useUserStore

```typescript
interface UserStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  login(username: string, password: string): Promise<boolean>;
  logout(): void;
}
```

### useMissionStore

```typescript
interface MissionStore {
  missions: Mission[];
  loadMissions(patientId: string): void;
  completeMission(missionId: string): void;
  getStreak(): number;
}
```

### useAgentStore

```typescript
interface AgentStore {
  steps: AgentStep[];
  currentStep: number;
  isRunning: boolean;
  error: string | null;
  startTriageWorkflow(imageData: string): Promise<void>;
  startRefillWorkflow(medicationId: string): Promise<void>;
}
```

### useActionItemStore

```typescript
interface ActionItemStore {
  items: ActionItem[];
  loadItems(): void;
  approve(itemId: string): void;
  reject(itemId: string, reason: string): void;
  filterByStatus(status: ActionItemStatus): ActionItem[];
}
```

### useCarePlanStore

```typescript
interface CarePlanStore {
  plans: CarePlan[];
  createPlan(plan: CarePlan): void;
  updatePlan(planId: string, updates: Partial<CarePlan>): void;
  deletePlan(planId: string): void;
  applyTemplate(templateId: string, patientId: string): CarePlan;
}
```
