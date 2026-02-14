// Symptom Pattern Recognition Engine - Time-series analysis for post-op complications

export interface SymptomDataPoint {
  patientId: string;
  symptomType: string;
  severity: number; // 0-10
  timestamp: number;
  dayPostOp: number;
  metadata?: Record<string, number | string>;
}

export interface ChangePoint {
  index: number;
  timestamp: number;
  dayPostOp: number;
  direction: 'increase' | 'decrease';
  magnitude: number;
  cumulativeSum: number;
  significance: 'low' | 'moderate' | 'high';
}

export interface AutocorrelationResult {
  symptomType: string;
  lags: number[];
  coefficients: number[];
  significantPeriods: number[]; // hours
  hasDiurnalPattern: boolean;
  peakLag: number;
  peakCoefficient: number;
}

export interface SymptomCluster {
  id: string;
  symptoms: string[];
  cooccurrenceScore: number; // 0-1
  meanOnsetDay: number;
  possibleDiagnosis: string;
  confidence: number; // 0-1
}

export interface ProdromalPattern {
  complication: string;
  warningSymptoms: Array<{
    symptom: string;
    typicalOnsetHoursBefore: number;
    severityThreshold: number;
  }>;
  matchScore: number; // 0-1
  estimatedOnset: number; // hours from now
  urgency: 'watch' | 'alert' | 'urgent';
}

export interface PatternTemplate {
  id: string;
  complication: string;
  surgeryTypes: string[];
  phases: Array<{
    symptom: string;
    dayRange: [number, number];
    severityRange: [number, number];
    required: boolean;
  }>;
  confirmationCount: number;
  lastUpdated: number;
}

// Helper: phase entry shorthand [symptom, dayMin, dayMax, sevMin, sevMax, required]
type PhaseSpec = [string, number, number, number, number, boolean];
function buildPhases(specs: PhaseSpec[]) {
  return specs.map(([symptom, d0, d1, s0, s1, required]) => ({ symptom, dayRange: [d0, d1] as [number, number], severityRange: [s0, s1] as [number, number], required }));
}
function tpl(id: string, complication: string, surgeryTypes: string[], specs: PhaseSpec[]): PatternTemplate {
  return { id, complication, surgeryTypes, phases: buildPhases(specs), confirmationCount: 0, lastUpdated: Date.now() };
}

const COMPLICATION_TEMPLATES: PatternTemplate[] = [
  tpl('tpl-ssi', 'Surgical Site Infection', ['knee_replacement','hip_replacement','spinal_fusion','colectomy','cesarean'], [
    ['wound_redness',3,14,3,8,true],['wound_warmth',3,14,2,7,false],['fever',3,14,4,9,true],['wound_drainage',4,14,3,8,false],['wound_pain_increasing',3,12,4,9,true]]),
  tpl('tpl-dvt', 'Deep Vein Thrombosis', ['knee_replacement','hip_replacement','spinal_fusion','colectomy'], [
    ['calf_pain',2,21,4,9,true],['leg_swelling',2,21,3,8,true],['leg_warmth',2,21,2,7,false],['leg_redness',3,21,2,6,false]]),
  tpl('tpl-pe', 'Pulmonary Embolism', ['knee_replacement','hip_replacement','cardiac_bypass','spinal_fusion'], [
    ['dyspnea',3,28,5,10,true],['chest_pain',3,28,4,10,true],['tachycardia',3,28,4,9,false],['cough',3,28,2,7,false],['hemoptysis',3,28,3,8,false]]),
  tpl('tpl-ileus', 'Paralytic Ileus', ['colectomy','appendectomy','hernia_repair','cesarean'], [
    ['abdominal_distension',1,7,3,8,true],['nausea',1,7,3,8,true],['vomiting',1,7,4,9,false],['absent_bowel_sounds',1,5,5,10,true],['no_flatus',2,7,4,8,false]]),
  tpl('tpl-pneumonia', 'Post-operative Pneumonia', ['cardiac_bypass','spinal_fusion','colectomy','hip_replacement'], [
    ['fever',2,10,4,9,true],['productive_cough',2,10,3,8,true],['dyspnea',2,10,3,8,false],['tachypnea',2,10,3,7,false],['decreased_spo2',2,10,4,9,true]]),
  tpl('tpl-urinary', 'Urinary Tract Infection', ['hip_replacement','knee_replacement','spinal_fusion','cesarean'], [
    ['dysuria',2,14,3,7,true],['urinary_frequency',2,14,3,7,true],['fever',3,14,3,7,false],['suprapubic_pain',2,14,2,6,false]]),
  tpl('tpl-af', 'Atrial Fibrillation (New-onset)', ['cardiac_bypass'], [
    ['palpitations',1,5,4,9,true],['tachycardia',1,5,4,9,true],['dyspnea',1,5,3,7,false],['dizziness',1,5,3,7,false]]),
  tpl('tpl-anastomotic', 'Anastomotic Leak', ['colectomy'], [
    ['fever',3,10,5,10,true],['abdominal_pain_increasing',3,10,5,10,true],['tachycardia',3,10,4,8,false],['peritoneal_signs',4,10,6,10,true]]),
];

// Generate 100+ synthetic symptom time-series data points
function generateSyntheticData(): SymptomDataPoint[] {
  const data: SymptomDataPoint[] = [];
  const patients = ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008', 'P009', 'P010'];
  const symptoms = [
    'pain', 'fever', 'wound_redness', 'swelling', 'nausea', 'fatigue',
    'dyspnea', 'calf_pain', 'wound_drainage', 'dizziness',
  ];
  const baseTime = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const pid of patients) {
    for (const sym of symptoms) {
      // Normal recovery curve: starts high, decreases
      const baseSeverity = sym === 'pain' ? 7 : sym === 'fatigue' ? 6 : 3;
      for (let day = 0; day <= 14; day++) {
        const decay = Math.exp(-0.15 * day);
        const noise = (Math.sin(day * 2.1 + pid.charCodeAt(3)) * 0.5 + 0.5) * 1.5;
        const severity = Math.max(0, Math.min(10,
          Math.round((baseSeverity * decay + noise) * 10) / 10
        ));
        data.push({
          patientId: pid,
          symptomType: sym,
          severity,
          timestamp: baseTime + day * 24 * 60 * 60 * 1000,
          dayPostOp: day,
        });
      }
    }
  }

  // Inject anomalous patterns for P003 (SSI) and P007 (DVT)
  for (let day = 5; day <= 10; day++) {
    data.push({
      patientId: 'P003', symptomType: 'wound_redness',
      severity: 3 + (day - 5) * 1.2,
      timestamp: baseTime + day * 24 * 60 * 60 * 1000, dayPostOp: day,
    });
    data.push({
      patientId: 'P003', symptomType: 'fever',
      severity: 2 + (day - 5) * 0.8,
      timestamp: baseTime + day * 24 * 60 * 60 * 1000, dayPostOp: day,
    });
  }
  for (let day = 7; day <= 12; day++) {
    data.push({
      patientId: 'P007', symptomType: 'calf_pain',
      severity: 2 + (day - 7) * 1.5,
      timestamp: baseTime + day * 24 * 60 * 60 * 1000, dayPostOp: day,
    });
    data.push({
      patientId: 'P007', symptomType: 'leg_swelling',
      severity: 1 + (day - 7) * 1.3,
      timestamp: baseTime + day * 24 * 60 * 60 * 1000, dayPostOp: day,
    });
  }

  return data;
}

export class SymptomPatternRecognition {
  private dataPoints: SymptomDataPoint[] = generateSyntheticData();
  private templates: PatternTemplate[] = [...COMPLICATION_TEMPLATES];
  private confirmedDiagnoses: Array<{ patientId: string; complication: string; dayDiagnosed: number }> = [];

  addDataPoint(point: SymptomDataPoint): void {
    this.dataPoints.push(point);
  }

  detectChangePoints(
    patientId: string,
    symptomType: string,
    threshold: number = 2.0
  ): ChangePoint[] {
    const series = this.dataPoints
      .filter((d) => d.patientId === patientId && d.symptomType === symptomType)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (series.length < 4) return [];

    // CUSUM (Cumulative Sum) change-point detection
    const mean = series.reduce((s, d) => s + d.severity, 0) / series.length;
    const stdDev = Math.sqrt(
      series.reduce((s, d) => s + (d.severity - mean) ** 2, 0) / series.length
    );
    if (stdDev === 0) return [];

    const changePoints: ChangePoint[] = [];
    let cusumPos = 0;
    let cusumNeg = 0;
    const k = stdDev * 0.5; // Allowance parameter (half sigma)
    const h = threshold * stdDev; // Decision threshold

    for (let i = 1; i < series.length; i++) {
      const diff = series[i].severity - mean;
      cusumPos = Math.max(0, cusumPos + diff - k);
      cusumNeg = Math.max(0, cusumNeg - diff - k);

      if (cusumPos > h) {
        const magnitude = cusumPos / stdDev;
        changePoints.push({
          index: i,
          timestamp: series[i].timestamp,
          dayPostOp: series[i].dayPostOp,
          direction: 'increase',
          magnitude: Math.round(magnitude * 100) / 100,
          cumulativeSum: Math.round(cusumPos * 100) / 100,
          significance: magnitude > 4 ? 'high' : magnitude > 2.5 ? 'moderate' : 'low',
        });
        cusumPos = 0; // Reset after detection
      }

      if (cusumNeg > h) {
        const magnitude = cusumNeg / stdDev;
        changePoints.push({
          index: i,
          timestamp: series[i].timestamp,
          dayPostOp: series[i].dayPostOp,
          direction: 'decrease',
          magnitude: Math.round(magnitude * 100) / 100,
          cumulativeSum: Math.round(cusumNeg * 100) / 100,
          significance: magnitude > 4 ? 'high' : magnitude > 2.5 ? 'moderate' : 'low',
        });
        cusumNeg = 0;
      }
    }

    return changePoints;
  }

  analyzeAutocorrelation(
    patientId: string,
    symptomType: string,
    maxLag: number = 12
  ): AutocorrelationResult {
    const series = this.dataPoints
      .filter((d) => d.patientId === patientId && d.symptomType === symptomType)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((d) => d.severity);

    const n = series.length;
    const mean = series.reduce((s, v) => s + v, 0) / n;
    const variance = series.reduce((s, v) => s + (v - mean) ** 2, 0) / n;

    const lags: number[] = [];
    const coefficients: number[] = [];
    const significantPeriods: number[] = [];
    const significanceThreshold = 1.96 / Math.sqrt(n); // 95% confidence

    let peakLag = 0;
    let peakCoefficient = 0;

    for (let lag = 1; lag <= Math.min(maxLag, Math.floor(n / 3)); lag++) {
      let autocovariance = 0;
      for (let i = 0; i < n - lag; i++) {
        autocovariance += (series[i] - mean) * (series[i + lag] - mean);
      }
      autocovariance /= n;
      const r = variance > 0 ? autocovariance / variance : 0;

      lags.push(lag);
      coefficients.push(Math.round(r * 1000) / 1000);

      if (Math.abs(r) > significanceThreshold) {
        // Assuming data points are daily, lag in hours = lag * 24
        significantPeriods.push(lag * 24);
      }

      if (Math.abs(r) > Math.abs(peakCoefficient)) {
        peakLag = lag;
        peakCoefficient = r;
      }
    }

    // Check for diurnal pattern (lag of ~1 day)
    const hasDiurnalPattern = coefficients.length >= 1 && Math.abs(coefficients[0]) > significanceThreshold;

    return {
      symptomType,
      lags,
      coefficients,
      significantPeriods,
      hasDiurnalPattern,
      peakLag,
      peakCoefficient: Math.round(peakCoefficient * 1000) / 1000,
    };
  }

  identifyClusters(
    patientId: string,
    windowDays: number = 3
  ): SymptomCluster[] {
    const patientData = this.dataPoints.filter((d) => d.patientId === patientId);
    const symptoms = [...new Set(patientData.map((d) => d.symptomType))];
    const clusters: SymptomCluster[] = [];

    // Calculate co-occurrence matrix
    const cooccurrence: Record<string, Record<string, number>> = {};
    const occurrenceCounts: Record<string, number> = {};

    for (const s1 of symptoms) {
      cooccurrence[s1] = {};
      const s1Days = new Set(
        patientData.filter((d) => d.symptomType === s1 && d.severity >= 3).map((d) => d.dayPostOp)
      );
      occurrenceCounts[s1] = s1Days.size;

      for (const s2 of symptoms) {
        if (s1 === s2) continue;
        const s2Days = new Set(
          patientData.filter((d) => d.symptomType === s2 && d.severity >= 3).map((d) => d.dayPostOp)
        );
        // Count days where both appear within window
        let coCount = 0;
        for (const day of s1Days) {
          for (const d2 of s2Days) {
            if (Math.abs(day - d2) <= windowDays) { coCount++; break; }
          }
        }
        const maxCount = Math.max(s1Days.size, s2Days.size, 1);
        cooccurrence[s1][s2] = coCount / maxCount;
      }
    }

    // Greedy clustering: group symptoms with high co-occurrence
    const visited = new Set<string>();
    for (const s1 of symptoms) {
      if (visited.has(s1)) continue;
      const cluster = [s1];
      visited.add(s1);

      for (const s2 of symptoms) {
        if (visited.has(s2)) continue;
        if ((cooccurrence[s1]?.[s2] ?? 0) > 0.5) {
          cluster.push(s2);
          visited.add(s2);
        }
      }

      if (cluster.length >= 2) {
        const avgCooccurrence = cluster.length > 1
          ? cluster.reduce((sum, sa) =>
              sum + cluster.reduce((s2sum, sb) =>
                sa === sb ? s2sum : s2sum + (cooccurrence[sa]?.[sb] ?? 0), 0
              ), 0) / (cluster.length * (cluster.length - 1))
          : 0;

        const clusterDays = patientData
          .filter((d) => cluster.includes(d.symptomType) && d.severity >= 3)
          .map((d) => d.dayPostOp);
        const meanOnsetDay = clusterDays.length > 0
          ? Math.round(Math.min(...clusterDays) * 10) / 10
          : 0;

        const match = this.matchClusterToTemplate(cluster, meanOnsetDay);

        clusters.push({
          id: `cluster-${clusters.length + 1}`,
          symptoms: cluster,
          cooccurrenceScore: Math.round(avgCooccurrence * 100) / 100,
          meanOnsetDay,
          possibleDiagnosis: match.diagnosis,
          confidence: match.confidence,
        });
      }
    }

    return clusters.sort((a, b) => b.confidence - a.confidence);
  }

  detectProdromalPatterns(
    patientId: string,
    surgeryType: string,
    currentDayPostOp: number
  ): ProdromalPattern[] {
    const patientData = this.dataPoints
      .filter((d) => d.patientId === patientId)
      .sort((a, b) => a.timestamp - b.timestamp);

    const relevantTemplates = this.templates.filter(
      (t) => t.surgeryTypes.includes(surgeryType)
    );

    const patterns: ProdromalPattern[] = [];

    for (const template of relevantTemplates) {
      let matchedPhases = 0;
      let requiredMatched = 0;
      let requiredTotal = 0;
      const warningSymptoms: ProdromalPattern['warningSymptoms'] = [];

      for (const phase of template.phases) {
        if (phase.required) requiredTotal++;

        const recentData = patientData.filter(
          (d) =>
            d.symptomType === phase.symptom &&
            d.dayPostOp >= phase.dayRange[0] &&
            d.dayPostOp <= currentDayPostOp &&
            d.severity >= phase.severityRange[0]
        );

        if (recentData.length > 0) {
          matchedPhases++;
          if (phase.required) requiredMatched++;

          const latest = recentData[recentData.length - 1];
          // Check for escalating trend
          const trend = recentData.length >= 2
            ? recentData[recentData.length - 1].severity - recentData[0].severity
            : 0;

          if (trend > 0 || latest.severity >= phase.severityRange[0]) {
            warningSymptoms.push({
              symptom: phase.symptom,
              typicalOnsetHoursBefore: (phase.dayRange[1] - currentDayPostOp) * 24,
              severityThreshold: phase.severityRange[0],
            });
          }
        }
      }

      if (matchedPhases === 0) continue;

      const matchScore = requiredTotal > 0
        ? (requiredMatched / requiredTotal) * 0.7 + (matchedPhases / template.phases.length) * 0.3
        : matchedPhases / template.phases.length;

      // Determine urgency
      let urgency: ProdromalPattern['urgency'];
      if (matchScore >= 0.7) urgency = 'urgent';
      else if (matchScore >= 0.4) urgency = 'alert';
      else urgency = 'watch';

      const estimatedOnset = Math.max(0,
        (template.phases[0].dayRange[1] - currentDayPostOp) * 24
      );

      if (matchScore > 0.2) {
        patterns.push({
          complication: template.complication,
          warningSymptoms,
          matchScore: Math.round(matchScore * 100) / 100,
          estimatedOnset: Math.round(estimatedOnset),
          urgency,
        });
      }
    }

    return patterns.sort((a, b) => b.matchScore - a.matchScore);
  }

  getPatternHistory(patientId?: string): {
    totalDataPoints: number;
    templateCount: number;
    confirmedDiagnoses: number;
    patientsTracked: number;
    recentChangePoints: ChangePoint[];
  } {
    const relevantData = patientId
      ? this.dataPoints.filter((d) => d.patientId === patientId)
      : this.dataPoints;

    const patients = new Set(relevantData.map((d) => d.patientId));

    // Run change-point detection on all patients/symptoms for recent alerts
    const recentChangePoints: ChangePoint[] = [];
    if (patientId) {
      const symptoms = [...new Set(relevantData.map((d) => d.symptomType))];
      for (const sym of symptoms) {
        const cps = this.detectChangePoints(patientId, sym);
        recentChangePoints.push(...cps.filter((cp) => cp.significance !== 'low'));
      }
    }

    return {
      totalDataPoints: relevantData.length,
      templateCount: this.templates.length,
      confirmedDiagnoses: this.confirmedDiagnoses.length,
      patientsTracked: patients.size,
      recentChangePoints: recentChangePoints
        .sort((a, b) => b.magnitude - a.magnitude)
        .slice(0, 10),
    };
  }

  // Self-learning: record confirmed diagnosis and update templates
  recordConfirmedDiagnosis(
    patientId: string,
    complication: string,
    dayDiagnosed: number
  ): void {
    this.confirmedDiagnoses.push({ patientId, complication, dayDiagnosed });

    // Update template confirmation counts and refine severity ranges
    const template = this.templates.find((t) => t.complication === complication);
    if (!template) return;

    template.confirmationCount++;
    template.lastUpdated = Date.now();

    // Refine phase ranges based on actual patient data
    const patientData = this.dataPoints.filter((d) => d.patientId === patientId);
    for (const phase of template.phases) {
      const matching = patientData.filter(
        (d) => d.symptomType === phase.symptom && d.dayPostOp <= dayDiagnosed
      );
      if (matching.length > 0) {
        const actualMinDay = Math.min(...matching.map((d) => d.dayPostOp));
        const actualMaxSeverity = Math.max(...matching.map((d) => d.severity));
        // Exponential moving average update
        const alpha = 0.2;
        phase.dayRange[0] = Math.round(phase.dayRange[0] * (1 - alpha) + actualMinDay * alpha);
        phase.severityRange[0] = Math.round(
          (phase.severityRange[0] * (1 - alpha) + Math.max(1, actualMaxSeverity - 2) * alpha) * 10
        ) / 10;
      }
    }
  }

  // --- Private helpers ---

  private matchClusterToTemplate(
    symptoms: string[],
    onsetDay: number
  ): { diagnosis: string; confidence: number } {
    let bestDiagnosis = 'Unknown cluster';
    let bestConfidence = 0;

    for (const template of this.templates) {
      const templateSymptoms = template.phases.map((p) => p.symptom);
      const overlap = symptoms.filter((s) => templateSymptoms.includes(s));
      if (overlap.length === 0) continue;

      const symScore = overlap.length / templateSymptoms.length;
      const requiredSymptoms = template.phases.filter((p) => p.required).map((p) => p.symptom);
      const requiredMatched = requiredSymptoms.filter((s) => symptoms.includes(s));
      const reqScore = requiredSymptoms.length > 0
        ? requiredMatched.length / requiredSymptoms.length
        : 0.5;

      // Check timing alignment
      const dayInRange = template.phases.some(
        (p) => onsetDay >= p.dayRange[0] && onsetDay <= p.dayRange[1]
      );
      const timingBonus = dayInRange ? 0.15 : 0;

      const confidence = Math.min(1, symScore * 0.4 + reqScore * 0.45 + timingBonus);

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestDiagnosis = template.complication;
      }
    }

    return {
      diagnosis: bestDiagnosis,
      confidence: Math.round(bestConfidence * 100) / 100,
    };
  }
}

export default SymptomPatternRecognition;
