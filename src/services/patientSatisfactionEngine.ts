// Patient Satisfaction Engine - HCAHPS, Press Ganey, and NPS scoring

export type SurveyDomain =
  | 'communication' | 'pain_management' | 'responsiveness'
  | 'environment' | 'discharge_info' | 'overall';

export type LikertResponse = 1 | 2 | 3 | 4; // Never, Sometimes, Usually, Always
export type NPSResponse = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface SurveyQuestion {
  id: string;
  domain: SurveyDomain;
  text: string;
  type: 'likert_4' | 'yes_no' | 'nps' | 'rating_10';
  hcahpsComposite: string;
}

export interface SurveyResponse {
  surveyId: string;
  patientId: string;
  responses: Record<string, number>;
  timestamp: number;
  dayPostOp: number;
}

export interface ScoreResult {
  overall: number; // 0-100
  domainScores: Record<SurveyDomain, number>;
  topBoxPercentages: Record<string, number>; // HCAHPS top-box scoring
  pressGaneyScore: number; // 0-100
  starRating: number; // 1-5
}

export interface NPSResult {
  score: number; // -100 to 100
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

export interface BenchmarkComparison {
  domain: SurveyDomain;
  score: number;
  nationalMean: number;
  nationalMedian: number;
  percentileRank: number;
  topDecileThreshold: number;
}

export interface TrendPoint {
  dayPostOp: number;
  timestamp: number;
  overallScore: number;
  domainScores: Record<SurveyDomain, number>;
}

export interface DriverAnalysis {
  domain: SurveyDomain;
  correlationWithOverall: number;
  improvementPotential: number; // gap * correlation
  priority: 'high' | 'medium' | 'low';
  topIssues: string[];
}

// Real HCAHPS-aligned survey questions
const HCAHPS_QUESTIONS: SurveyQuestion[] = [
  // Communication with Nurses (3 questions)
  { id: 'hc-1', domain: 'communication', text: 'During this hospital stay, how often did nurses treat you with courtesy and respect?', type: 'likert_4', hcahpsComposite: 'nurse_communication' },
  { id: 'hc-2', domain: 'communication', text: 'During this hospital stay, how often did nurses listen carefully to you?', type: 'likert_4', hcahpsComposite: 'nurse_communication' },
  { id: 'hc-3', domain: 'communication', text: 'During this hospital stay, how often did nurses explain things in a way you could understand?', type: 'likert_4', hcahpsComposite: 'nurse_communication' },

  // Communication with Doctors (3 questions)
  { id: 'hc-4', domain: 'communication', text: 'During this hospital stay, how often did doctors treat you with courtesy and respect?', type: 'likert_4', hcahpsComposite: 'doctor_communication' },
  { id: 'hc-5', domain: 'communication', text: 'During this hospital stay, how often did doctors listen carefully to you?', type: 'likert_4', hcahpsComposite: 'doctor_communication' },
  { id: 'hc-6', domain: 'communication', text: 'During this hospital stay, how often did doctors explain things in a way you could understand?', type: 'likert_4', hcahpsComposite: 'doctor_communication' },

  // Responsiveness of Hospital Staff (2 questions)
  { id: 'hc-7', domain: 'responsiveness', text: 'During this hospital stay, how often did you get help getting to the bathroom or using a bedpan as soon as you wanted?', type: 'likert_4', hcahpsComposite: 'responsiveness' },
  { id: 'hc-8', domain: 'responsiveness', text: 'After you pressed the call button, how often did you get help as soon as you wanted it?', type: 'likert_4', hcahpsComposite: 'responsiveness' },

  // Pain Management (2 questions)
  { id: 'hc-9', domain: 'pain_management', text: 'During this hospital stay, how often was your pain well controlled?', type: 'likert_4', hcahpsComposite: 'pain_management' },
  { id: 'hc-10', domain: 'pain_management', text: 'During this hospital stay, how often did the hospital staff do everything they could to help you with your pain?', type: 'likert_4', hcahpsComposite: 'pain_management' },

  // Communication about Medicines (2 questions)
  { id: 'hc-11', domain: 'discharge_info', text: 'Before giving you any new medicine, how often did hospital staff tell you what the medicine was for?', type: 'likert_4', hcahpsComposite: 'communication_medicines' },
  { id: 'hc-12', domain: 'discharge_info', text: 'Before giving you any new medicine, how often did hospital staff describe possible side effects in a way you could understand?', type: 'likert_4', hcahpsComposite: 'communication_medicines' },

  // Discharge Information (2 questions)
  { id: 'hc-13', domain: 'discharge_info', text: 'During this hospital stay, did doctors, nurses, or other hospital staff talk with you about whether you would have the help you needed when you left the hospital?', type: 'yes_no', hcahpsComposite: 'discharge_information' },
  { id: 'hc-14', domain: 'discharge_info', text: 'During this hospital stay, did you get information in writing about what symptoms or health problems to look out for after you left the hospital?', type: 'yes_no', hcahpsComposite: 'discharge_information' },

  // Care Transition (3 questions)
  { id: 'hc-15', domain: 'discharge_info', text: 'During this hospital stay, staff took my preferences and those of my family or caregiver into account in deciding what my health care needs would be when I left.', type: 'likert_4', hcahpsComposite: 'care_transition' },
  { id: 'hc-16', domain: 'discharge_info', text: 'When I left the hospital, I had a good understanding of the things I was responsible for in managing my health.', type: 'likert_4', hcahpsComposite: 'care_transition' },
  { id: 'hc-17', domain: 'discharge_info', text: 'When I left the hospital, I clearly understood the purpose for taking each of my medications.', type: 'likert_4', hcahpsComposite: 'care_transition' },

  // Hospital Environment (2 questions)
  { id: 'hc-18', domain: 'environment', text: 'During this hospital stay, how often were your room and bathroom kept clean?', type: 'likert_4', hcahpsComposite: 'cleanliness' },
  { id: 'hc-19', domain: 'environment', text: 'During this hospital stay, how often was the area around your room quiet at night?', type: 'likert_4', hcahpsComposite: 'quietness' },

  // Overall Rating
  { id: 'hc-20', domain: 'overall', text: 'Using any number from 0 to 10, where 0 is the worst hospital possible and 10 is the best hospital possible, what number would you use to rate this hospital during your stay?', type: 'rating_10', hcahpsComposite: 'overall_rating' },

  // Willingness to Recommend (NPS-compatible)
  { id: 'hc-21', domain: 'overall', text: 'Would you recommend this hospital to your friends and family?', type: 'nps', hcahpsComposite: 'recommend' },
];

// National benchmark data (based on published HCAHPS averages)
const NATIONAL_BENCHMARKS: Record<SurveyDomain, { mean: number; median: number; topDecile: number; stdDev: number }> = {
  communication: { mean: 79.2, median: 80.0, topDecile: 91.0, stdDev: 7.5 },
  pain_management: { mean: 71.4, median: 72.0, topDecile: 82.0, stdDev: 8.2 },
  responsiveness: { mean: 67.8, median: 68.0, topDecile: 81.0, stdDev: 9.1 },
  environment: { mean: 72.5, median: 73.0, topDecile: 85.0, stdDev: 8.0 },
  discharge_info: { mean: 74.6, median: 75.0, topDecile: 87.0, stdDev: 7.8 },
  overall: { mean: 73.1, median: 74.0, topDecile: 86.0, stdDev: 8.5 },
};

export class PatientSatisfactionEngine {
  private responses: SurveyResponse[] = [];
  private driverWeights: Map<SurveyDomain, number> = new Map();
  private surveyCounter = 0;

  createSurvey(
    patientId: string,
    domains?: SurveyDomain[]
  ): { surveyId: string; questions: SurveyQuestion[] } {
    this.surveyCounter++;
    const surveyId = `survey-${patientId}-${this.surveyCounter}`;
    const questions = domains
      ? HCAHPS_QUESTIONS.filter((q) => domains.includes(q.domain))
      : [...HCAHPS_QUESTIONS];
    return { surveyId, questions };
  }

  submitResponse(
    surveyId: string,
    patientId: string,
    responses: Record<string, number>,
    dayPostOp: number
  ): SurveyResponse {
    const entry: SurveyResponse = {
      surveyId,
      patientId,
      responses,
      timestamp: Date.now(),
      dayPostOp,
    };
    this.responses.push(entry);
    this.updateDriverWeights();
    return entry;
  }

  calculateScores(surveyId: string): ScoreResult {
    const response = this.responses.find((r) => r.surveyId === surveyId);
    if (!response) {
      return {
        overall: 0,
        domainScores: { communication: 0, pain_management: 0, responsiveness: 0, environment: 0, discharge_info: 0, overall: 0 },
        topBoxPercentages: {},
        pressGaneyScore: 0,
        starRating: 1,
      };
    }

    const domains: SurveyDomain[] = ['communication', 'pain_management', 'responsiveness', 'environment', 'discharge_info', 'overall'];
    const domainScores = {} as Record<SurveyDomain, number>;
    const topBoxPercentages: Record<string, number> = {};

    for (const domain of domains) {
      const domainQs = HCAHPS_QUESTIONS.filter((q) => q.domain === domain);
      if (domainQs.length === 0) { domainScores[domain] = 0; continue; }

      let totalNormalized = 0;
      let topBoxCount = 0;
      let answered = 0;

      for (const q of domainQs) {
        const val = response.responses[q.id];
        if (val === undefined) continue;
        answered++;

        if (q.type === 'likert_4') {
          totalNormalized += ((val - 1) / 3) * 100;
          if (val === 4) topBoxCount++;
        } else if (q.type === 'yes_no') {
          totalNormalized += val * 100;
          if (val === 1) topBoxCount++;
        } else if (q.type === 'rating_10') {
          totalNormalized += (val / 10) * 100;
          if (val >= 9) topBoxCount++;
        } else if (q.type === 'nps') {
          totalNormalized += (val / 10) * 100;
          if (val >= 9) topBoxCount++;
        }
      }

      domainScores[domain] = answered > 0 ? Math.round((totalNormalized / answered) * 10) / 10 : 0;
      topBoxPercentages[domain] = answered > 0 ? Math.round((topBoxCount / answered) * 100) : 0;

      // Per-composite top-box
      const composites = new Set(domainQs.map((q) => q.hcahpsComposite));
      for (const comp of composites) {
        const compQs = domainQs.filter((q) => q.hcahpsComposite === comp);
        let compTopBox = 0;
        let compAnswered = 0;
        for (const q of compQs) {
          const v = response.responses[q.id];
          if (v === undefined) continue;
          compAnswered++;
          if ((q.type === 'likert_4' && v === 4) || (q.type === 'yes_no' && v === 1) || ((q.type === 'rating_10' || q.type === 'nps') && v >= 9)) {
            compTopBox++;
          }
        }
        topBoxPercentages[comp] = compAnswered > 0 ? Math.round((compTopBox / compAnswered) * 100) : 0;
      }
    }

    // Press Ganey score: weighted average with emphasis on communication
    const pgWeights: Record<SurveyDomain, number> = {
      communication: 0.30, pain_management: 0.15, responsiveness: 0.20,
      environment: 0.10, discharge_info: 0.15, overall: 0.10,
    };
    let pressGaneyScore = 0;
    for (const d of domains) {
      pressGaneyScore += domainScores[d] * (pgWeights[d] || 0);
    }
    pressGaneyScore = Math.round(pressGaneyScore * 10) / 10;

    // Overall is weighted mean of all domain scores
    const overall = Math.round(
      domains.reduce((s, d) => s + domainScores[d], 0) / domains.length * 10
    ) / 10;

    // Star rating from overall score
    let starRating: number;
    if (overall >= 90) starRating = 5;
    else if (overall >= 80) starRating = 4;
    else if (overall >= 65) starRating = 3;
    else if (overall >= 50) starRating = 2;
    else starRating = 1;

    return { overall, domainScores, topBoxPercentages, pressGaneyScore, starRating };
  }

  getNPS(patientIds?: string[]): NPSResult {
    const relevantResponses = patientIds
      ? this.responses.filter((r) => patientIds.includes(r.patientId))
      : this.responses;

    // Use the NPS question (hc-21)
    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    let total = 0;

    for (const resp of relevantResponses) {
      const npsVal = resp.responses['hc-21'];
      if (npsVal === undefined) continue;
      total++;
      if (npsVal >= 9) promoters++;
      else if (npsVal >= 7) passives++;
      else detractors++;
    }

    const score = total > 0
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0;

    return { score, promoters, passives, detractors, totalResponses: total };
  }

  getBenchmarks(surveyId: string): BenchmarkComparison[] {
    const scores = this.calculateScores(surveyId);
    const domains: SurveyDomain[] = ['communication', 'pain_management', 'responsiveness', 'environment', 'discharge_info', 'overall'];

    return domains.map((domain) => {
      const bench = NATIONAL_BENCHMARKS[domain];
      const score = scores.domainScores[domain];
      // Percentile approximation using z-score and normal CDF
      const z = (score - bench.mean) / bench.stdDev;
      const percentileRank = Math.max(1, Math.min(99, Math.round(this.normalCDF(z) * 100)));

      return {
        domain,
        score,
        nationalMean: bench.mean,
        nationalMedian: bench.median,
        percentileRank,
        topDecileThreshold: bench.topDecile,
      };
    });
  }

  analyzeTrends(patientId: string): TrendPoint[] {
    const patientResponses = this.responses
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => a.dayPostOp - b.dayPostOp);

    return patientResponses.map((resp) => {
      const scores = this.calculateScores(resp.surveyId);
      return {
        dayPostOp: resp.dayPostOp,
        timestamp: resp.timestamp,
        overallScore: scores.overall,
        domainScores: scores.domainScores,
      };
    });
  }

  getDriverAnalysis(): DriverAnalysis[] {
    const domains: SurveyDomain[] = ['communication', 'pain_management', 'responsiveness', 'environment', 'discharge_info'];
    if (this.responses.length < 3) {
      return domains.map((d) => ({
        domain: d,
        correlationWithOverall: 0,
        improvementPotential: 0,
        priority: 'low' as const,
        topIssues: [],
      }));
    }

    // Calculate correlation of each domain with overall satisfaction
    const overallScores: number[] = [];
    const domainScoresArr: Record<SurveyDomain, number[]> = {
      communication: [], pain_management: [], responsiveness: [],
      environment: [], discharge_info: [], overall: [],
    };

    for (const resp of this.responses) {
      const scores = this.calculateScores(resp.surveyId);
      overallScores.push(scores.overall);
      for (const d of domains) {
        domainScoresArr[d].push(scores.domainScores[d]);
      }
    }

    return domains.map((domain) => {
      const corr = this.pearsonCorrelation(domainScoresArr[domain], overallScores);
      const bench = NATIONAL_BENCHMARKS[domain];
      const avgScore = domainScoresArr[domain].reduce((a, b) => a + b, 0) / domainScoresArr[domain].length;
      const gap = Math.max(0, bench.topDecile - avgScore);
      const improvementPotential = Math.round(gap * Math.abs(corr) * 10) / 10;

      let priority: 'high' | 'medium' | 'low';
      if (improvementPotential > 15) priority = 'high';
      else if (improvementPotential > 8) priority = 'medium';
      else priority = 'low';

      // Identify low-scoring questions in this domain
      const topIssues = this.identifyLowScoringQuestions(domain);

      return { domain, correlationWithOverall: Math.round(corr * 100) / 100, improvementPotential, priority, topIssues };
    });
  }

  // --- Private helpers ---

  private identifyLowScoringQuestions(domain: SurveyDomain): string[] {
    const domainQs = HCAHPS_QUESTIONS.filter((q) => q.domain === domain);
    const avgByQ: Array<{ text: string; avg: number }> = [];

    for (const q of domainQs) {
      let sum = 0;
      let count = 0;
      for (const resp of this.responses) {
        const val = resp.responses[q.id];
        if (val !== undefined) {
          const maxVal = q.type === 'likert_4' ? 4 : q.type === 'yes_no' ? 1 : 10;
          sum += val / maxVal;
          count++;
        }
      }
      if (count > 0) avgByQ.push({ text: q.text, avg: sum / count });
    }

    return avgByQ
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 2)
      .map((q) => q.text);
  }

  private updateDriverWeights(): void {
    if (this.responses.length < 5) return;
    const domains: SurveyDomain[] = ['communication', 'pain_management', 'responsiveness', 'environment', 'discharge_info'];
    const overallScores = this.responses.map((r) => this.calculateScores(r.surveyId).overall);

    for (const d of domains) {
      const dScores = this.responses.map((r) => this.calculateScores(r.surveyId).domainScores[d]);
      const corr = Math.abs(this.pearsonCorrelation(dScores, overallScores));
      this.driverWeights.set(d, corr);
    }
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n < 2) return 0;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
  }

  private normalCDF(z: number): number {
    // Abramowitz & Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = z < 0 ? -1 : 1;
    const absZ = Math.abs(z);
    const t = 1.0 / (1.0 + p * absZ);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2);
    return 0.5 * (1.0 + sign * y);
  }
}

export default PatientSatisfactionEngine;
