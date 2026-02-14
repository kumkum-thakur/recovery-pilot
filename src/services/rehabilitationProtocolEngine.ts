// Rehabilitation Protocol Engine - Evidence-based rehab protocols with clinical scoring

export type ExerciseType = 'rom' | 'strengthening' | 'functional' | 'balance' | 'cardio' | 'flexibility';
export type MMTGrade = 0 | 1 | 2 | 3 | 4 | 5;
export type BorgRPE = 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
export type FIMLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SurgeryType =
  | 'knee_replacement' | 'hip_replacement' | 'cardiac_bypass' | 'appendectomy'
  | 'cesarean' | 'shoulder_arthroscopy' | 'spinal_fusion' | 'hernia_repair'
  | 'colectomy' | 'cholecystectomy';

export interface Exercise {
  id: string; name: string; type: ExerciseType; description: string;
  sets: number; reps: number; holdSeconds?: number; restSeconds: number;
  targetRPE: BorgRPE; progressionCriteria: string; contraindications: string[];
}

export interface RehabPhase {
  phaseNumber: number; name: string; dayRange: [number, number]; goals: string[];
  exercises: Exercise[]; precautions: string[]; advancementCriteria: string[];
}

export interface RehabProtocol {
  surgeryType: SurgeryType; totalPhases: number; expectedDurationWeeks: number; phases: RehabPhase[];
}

export interface FIMAssessment {
  patientId: string; timestamp: number; items: Record<string, FIMLevel>;
  motorScore: number; cognitiveScore: number; totalScore: number;
}

export interface MMTResult {
  patientId: string; timestamp: number; muscleGroup: string;
  side: 'left' | 'right' | 'bilateral'; grade: MMTGrade; painDuringTest: boolean; notes: string;
}

export interface ExertionAssessment {
  patientId: string; timestamp: number; exerciseId: string; borgRPE: BorgRPE;
  heartRate?: number; bloodPressure?: { systolic: number; diastolic: number };
  shouldProgress: boolean; shouldRegress: boolean;
}

export interface HomeExerciseProgram {
  patientId: string; surgeryType: SurgeryType; currentPhase: number; generatedDate: number;
  exercises: Array<Exercise & { frequency: string; duration: string; specialInstructions: string }>;
  warnings: string[]; followUpDate: number;
}

// FIM item definitions (18 items, 7-level scale)
const FIM_ITEMS = {
  eating: { domain: 'motor', label: 'Eating' }, grooming: { domain: 'motor', label: 'Grooming' },
  bathing: { domain: 'motor', label: 'Bathing' }, dressing_upper: { domain: 'motor', label: 'Dressing - Upper Body' },
  dressing_lower: { domain: 'motor', label: 'Dressing - Lower Body' }, toileting: { domain: 'motor', label: 'Toileting' },
  bladder_management: { domain: 'motor', label: 'Bladder Management' }, bowel_management: { domain: 'motor', label: 'Bowel Management' },
  transfer_bed: { domain: 'motor', label: 'Transfer: Bed/Chair/Wheelchair' }, transfer_toilet: { domain: 'motor', label: 'Transfer: Toilet' },
  transfer_tub: { domain: 'motor', label: 'Transfer: Tub/Shower' }, locomotion_walk: { domain: 'motor', label: 'Locomotion: Walk/Wheelchair' },
  locomotion_stairs: { domain: 'motor', label: 'Locomotion: Stairs' },
  comprehension: { domain: 'cognitive', label: 'Comprehension' }, expression: { domain: 'cognitive', label: 'Expression' },
  social_interaction: { domain: 'cognitive', label: 'Social Interaction' }, problem_solving: { domain: 'cognitive', label: 'Problem Solving' },
  memory: { domain: 'cognitive', label: 'Memory' },
} as const;

const FIM_LEVEL_LABELS: Record<FIMLevel, string> = {
  1: 'Total Assistance (< 25% effort)', 2: 'Maximal Assistance (25-49%)',
  3: 'Moderate Assistance (50-74%)', 4: 'Minimal Assistance (75%+)',
  5: 'Supervision/Setup', 6: 'Modified Independence', 7: 'Complete Independence',
};

const MMT_GRADE_LABELS: Record<MMTGrade, string> = {
  0: 'No contraction', 1: 'Trace contraction, no movement', 2: 'Full ROM gravity eliminated',
  3: 'Full ROM against gravity', 4: 'Full ROM against moderate resistance', 5: 'Full ROM against full resistance (normal)',
};

const BORG_LABELS: Record<number, string> = {
  6: 'No exertion', 7: 'Extremely light', 9: 'Very light', 11: 'Light',
  13: 'Somewhat hard', 15: 'Hard', 17: 'Very hard', 19: 'Extremely hard', 20: 'Maximal',
};

// Helper to create exercise objects concisely
function ex(id: string, name: string, type: ExerciseType, desc: string, sets: number, reps: number, rest: number, rpe: BorgRPE, prog: string, contra: string[] = [], hold?: number): Exercise {
  return { id, name, type, description: desc, sets, reps, holdSeconds: hold, restSeconds: rest, targetRPE: rpe, progressionCriteria: prog, contraindications: contra };
}

// Evidence-based rehab protocols for all 10 surgery types
const PROTOCOLS: Record<SurgeryType, RehabProtocol> = {
  knee_replacement: { surgeryType: 'knee_replacement', totalPhases: 4, expectedDurationWeeks: 12, phases: [
    { phaseNumber: 1, name: 'Acute Post-Op', dayRange: [0, 7], goals: ['Control pain/swelling', 'Achieve 0-90 deg flexion', 'Bed mobility'], precautions: ['No forced flexion', 'WBAT with walker'], advancementCriteria: ['Pain < 5/10 at rest', 'Flexion >= 70 deg'], exercises: [
      ex('kr-1-1', 'Ankle Pumps', 'rom', 'Pump ankles up and down for circulation', 3, 20, 30, 7, 'Complete without fatigue'),
      ex('kr-1-2', 'Quad Sets', 'strengthening', 'Tighten thigh, press knee into bed', 3, 10, 30, 9, 'Visible quad contraction', [], 5),
      ex('kr-1-3', 'Heel Slides', 'rom', 'Slide heel toward buttock, bending knee', 3, 10, 30, 11, 'Flexion > 70 deg', ['Acute effusion']),
      ex('kr-1-4', 'SLR', 'strengthening', 'Raise straight leg 12 inches, hold', 3, 10, 45, 11, 'No extensor lag', [], 3),
    ]},
    { phaseNumber: 2, name: 'Early Rehab', dayRange: [8, 28], goals: ['Flexion 110 deg', 'Walk 500 ft with cane', 'Stair negotiation'], precautions: ['No high-impact', 'Ice after exercise'], advancementCriteria: ['Flexion >= 100 deg', 'Walk 500 ft'], exercises: [
      ex('kr-2-1', 'Stationary Bike (no resistance)', 'rom', 'Pedal for ROM; seat high initially', 1, 1, 0, 11, 'Full revolution pain-free', ['Flexion < 90 deg']),
      ex('kr-2-2', 'Wall Slides', 'strengthening', 'Mini wall squats to 45 deg', 3, 10, 45, 13, 'Pain-free full range', [], 5),
      ex('kr-2-3', 'Step-Ups (4 inch)', 'functional', 'Step up onto low platform', 3, 10, 60, 13, 'No compensatory patterns', ['Poor balance']),
    ]},
    { phaseNumber: 3, name: 'Intermediate Rehab', dayRange: [29, 56], goals: ['Full flexion 120+ deg', 'Walk without device', 'Light ADLs'], precautions: ['No pivoting', 'Progress gradually'], advancementCriteria: ['Flexion >= 115 deg', 'MMT >= 4/5 quads'], exercises: [
      ex('kr-3-1', 'Leg Press', 'strengthening', 'Bilateral leg press, progress to single-leg', 3, 12, 60, 13, 'BW x 0.5 for 12 reps'),
      ex('kr-3-2', 'Single-Leg Balance', 'balance', 'Stand on surgical leg, progress to foam', 3, 1, 30, 11, 'Hold 30 sec on foam', ['Vertigo'], 30),
    ]},
    { phaseNumber: 4, name: 'Return to Activity', dayRange: [57, 84], goals: ['Full strength', 'Recreational activities'], precautions: ['No high-impact 3 months'], advancementCriteria: ['MMT 5/5', 'TUG < 12 sec'], exercises: [
      ex('kr-4-1', 'Lateral Step-Downs', 'functional', 'Step down from 8" step, control valgus', 3, 15, 45, 13, 'No knee valgus'),
      ex('kr-4-2', 'Full Squats', 'strengthening', 'Full squat to 90+ deg knee flexion', 3, 15, 60, 15, 'BW squat pain-free', ['Patellar maltracking']),
    ]},
  ]},
  hip_replacement: { surgeryType: 'hip_replacement', totalPhases: 3, expectedDurationWeeks: 10, phases: [
    { phaseNumber: 1, name: 'Protected Mobility', dayRange: [0, 14], goals: ['Safe ambulation with walker', 'Hip precautions', 'Independent transfers'], precautions: ['No flexion > 90 deg', 'No internal rotation', 'No adduction past midline'], advancementCriteria: ['Walk 200 ft with walker'], exercises: [
      ex('hr-1-1', 'Glute Sets', 'strengthening', 'Squeeze buttocks, hold', 3, 10, 30, 9, 'Strong contraction', [], 5),
      ex('hr-1-2', 'Supine Hip Abduction', 'rom', 'Slide leg out to the side lying down', 3, 10, 30, 9, '30 deg pain-free'),
    ]},
    { phaseNumber: 2, name: 'Progressive Strengthening', dayRange: [15, 42], goals: ['Walk with cane', 'Hip abductor 4/5', 'Normal gait'], precautions: ['Modified hip precautions', 'No running'], advancementCriteria: ['Trendelenburg negative', 'Cane-free 100 ft'], exercises: [
      ex('hr-2-1', 'Standing Hip Abduction', 'strengthening', 'Lift leg sideways against gravity', 3, 12, 45, 11, 'Add 2 lb ankle weight'),
      ex('hr-2-2', 'Bridging', 'strengthening', 'Lift pelvis off bed, hold', 3, 10, 45, 11, 'Single-leg bridge', [], 5),
    ]},
    { phaseNumber: 3, name: 'Return to Function', dayRange: [43, 70], goals: ['Full strength', 'Recreational activities'], precautions: ['No high-impact until 6 months'], advancementCriteria: ['MMT 5/5 all hip muscles'], exercises: [
      ex('hr-3-1', 'Single-Leg Deadlift', 'functional', 'Hinge at hip on surgical leg', 3, 10, 60, 13, 'Add handheld weight', ['Poor balance']),
    ]},
  ]},
  cardiac_bypass: { surgeryType: 'cardiac_bypass', totalPhases: 3, expectedDurationWeeks: 12, phases: [
    { phaseNumber: 1, name: 'Phase I Cardiac Rehab', dayRange: [0, 7], goals: ['Safe mobilization', 'Self-care', 'Sternal precautions education'], precautions: ['No lifting > 5 lbs', 'No pushing/pulling', 'Splint sternum coughing'], advancementCriteria: ['Walk 500 ft', 'Stable hemodynamics'], exercises: [
      ex('cb-1-1', 'Seated Marching', 'cardio', 'Alternate lifting knees while seated', 2, 20, 60, 9, 'No desaturation', ['Sternal instability']),
      ex('cb-1-2', 'Hallway Walking', 'cardio', 'Progressive distance on flat surface', 3, 1, 120, 11, 'Walk 500 ft without rest', ['Uncontrolled arrhythmia']),
    ]},
    { phaseNumber: 2, name: 'Phase II Cardiac Rehab', dayRange: [14, 56], goals: ['Improve aerobic capacity', 'Increase distance', 'Light household tasks'], precautions: ['Sternal precautions 8 weeks', 'Monitor HR/BP', 'RPE 11-13'], advancementCriteria: ['Walk 30 min continuously'], exercises: [
      ex('cb-2-1', 'Treadmill Walking', 'cardio', 'Progressive speed and incline', 1, 1, 0, 13, '30 min at 3.0 mph', ['Uncontrolled HTN']),
      ex('cb-2-2', 'Upper Body Ergometer', 'cardio', 'Arm cycling at low resistance', 1, 1, 0, 11, '10 min continuous', ['Sternal non-union']),
    ]},
    { phaseNumber: 3, name: 'Phase III Maintenance', dayRange: [57, 84], goals: ['Independent exercise', 'Risk factor modification', 'Return to work'], precautions: ['Avoid Valsalva', 'Know warning signs'], advancementCriteria: ['Functional capacity > 5 METs'], exercises: [
      ex('cb-3-1', 'Light Circuit Training', 'strengthening', 'Low-weight high-rep circuit of major muscle groups', 2, 15, 60, 13, 'Complete circuit without fatigue', ['EF < 30%']),
    ]},
  ]},
  appendectomy: { surgeryType: 'appendectomy', totalPhases: 2, expectedDurationWeeks: 3, phases: [
    { phaseNumber: 1, name: 'Early Recovery', dayRange: [0, 7], goals: ['Resume walking', 'Pain-free ADLs'], precautions: ['No lifting > 10 lbs', 'No straining'], advancementCriteria: ['Pain < 3/10', 'Normal ambulation'], exercises: [
      ex('ap-1-1', 'Walking Program', 'cardio', 'Start 5-10 min, increase gradually', 2, 1, 0, 9, '15 min walk'),
      ex('ap-1-2', 'Diaphragmatic Breathing', 'flexibility', 'Deep belly breathing', 3, 10, 30, 7, 'Full inspiration pain-free'),
    ]},
    { phaseNumber: 2, name: 'Return to Activity', dayRange: [8, 21], goals: ['Full activity', 'Return to work'], precautions: ['Gradual core exercises'], advancementCriteria: ['Full activity without pain'], exercises: [
      ex('ap-2-1', 'Core Activation', 'strengthening', 'Gentle abdominal bracing and pelvic tilts', 3, 10, 30, 11, 'Progress to planks', ['Incisional hernia'], 5),
    ]},
  ]},
  cesarean: { surgeryType: 'cesarean', totalPhases: 3, expectedDurationWeeks: 8, phases: [
    { phaseNumber: 1, name: 'Initial Recovery', dayRange: [0, 14], goals: ['Safe ambulation', 'Pelvic floor awareness', 'Infant care'], precautions: ['No lifting > baby weight', 'No driving on narcotics'], advancementCriteria: ['Walking 15 min', 'Independent infant care'], exercises: [
      ex('cs-1-1', 'Pelvic Floor Contractions', 'strengthening', 'Kegel: contract pelvic floor, hold, release', 3, 10, 30, 7, 'Isolate PF muscles', ['Catheter in place'], 5),
      ex('cs-1-2', 'Walking', 'cardio', 'Short walks around house, increase gradually', 3, 1, 0, 9, '10-15 min continuous'),
    ]},
    { phaseNumber: 2, name: 'Progressive Return', dayRange: [15, 42], goals: ['Core reconnection', 'Aerobic base'], precautions: ['No lifting > 15 lbs', 'Watch diastasis recti'], advancementCriteria: ['Walk 30 min', 'Core exercises without doming'], exercises: [
      ex('cs-2-1', 'Modified Dead Bug', 'strengthening', 'Supine core stabilization with alternating movements', 3, 10, 45, 11, 'No abdominal doming', ['Diastasis recti > 2 fingers']),
    ]},
    { phaseNumber: 3, name: 'Full Return', dayRange: [43, 56], goals: ['Pre-pregnancy fitness', 'Full core strength'], precautions: ['Gradual loading'], advancementCriteria: ['Full activity tolerance'], exercises: [
      ex('cs-3-1', 'Progressive Resistance', 'strengthening', 'Squat, deadlift, press with progressive load', 3, 12, 60, 13, 'Increase 5% weekly', ['Prolapse symptoms']),
    ]},
  ]},
  shoulder_arthroscopy: { surgeryType: 'shoulder_arthroscopy', totalPhases: 4, expectedDurationWeeks: 16, phases: [
    { phaseNumber: 1, name: 'Protection Phase', dayRange: [0, 21], goals: ['Protect repair', 'Reduce inflammation', 'Elbow/wrist ROM'], precautions: ['Sling except exercises', 'No active shoulder motion'], advancementCriteria: ['Pain < 4/10', 'Passive FF > 120 deg'], exercises: [
      ex('sa-1-1', 'Pendulum Exercises', 'rom', 'Lean forward, let arm dangle, small circles', 3, 10, 30, 7, 'Pain-free motion'),
      ex('sa-1-2', 'Grip Strengthening', 'strengthening', 'Squeeze therapy putty or ball', 3, 15, 30, 9, 'Full grip strength'),
    ]},
    { phaseNumber: 2, name: 'Active Motion', dayRange: [22, 56], goals: ['Full passive ROM', 'Active-assisted ROM', 'Rotator cuff activation'], precautions: ['No resisted motions week 8', 'No behind-back reaching'], advancementCriteria: ['Full passive ROM', 'Active elevation > 140 deg'], exercises: [
      ex('sa-2-1', 'Supine Active-Assisted Flexion', 'rom', 'Use wand to assist shoulder flexion lying down', 3, 15, 30, 9, 'Full active flexion supine'),
    ]},
    { phaseNumber: 3, name: 'Strengthening', dayRange: [57, 84], goals: ['Rotator cuff 4/5', 'Scapular stability', 'Overhead use'], precautions: ['Progress slowly', 'Avoid painful arc'], advancementCriteria: ['MMT 4/5 rotator cuff'], exercises: [
      ex('sa-3-1', 'ER with Band', 'strengthening', 'Elbow at side, rotate forearm out against band', 3, 15, 45, 13, 'Progress band resistance', ['Subscap repair < 12 wk']),
    ]},
    { phaseNumber: 4, name: 'Return to Activity', dayRange: [85, 112], goals: ['Full strength', 'Sport-specific training'], precautions: ['Gradual overhead return'], advancementCriteria: ['MMT 5/5', 'Y-Balance within 10%'], exercises: [
      ex('sa-4-1', 'Plyometric Throwing', 'functional', 'Progress from chest pass to overhead throws', 3, 10, 60, 15, 'Pain-free at 75% effort', ['Labral repair < 4 mo']),
    ]},
  ]},
  spinal_fusion: { surgeryType: 'spinal_fusion', totalPhases: 3, expectedDurationWeeks: 16, phases: [
    { phaseNumber: 1, name: 'Protection Phase', dayRange: [0, 42], goals: ['Safe mobility', 'Pain control', 'Wound healing'], precautions: ['No BLT (bend/lift/twist)', 'Brace as ordered', 'Log roll'], advancementCriteria: ['Walk 20 min', 'Pain < 5/10'], exercises: [
      ex('sf-1-1', 'Walking Program', 'cardio', 'Flat surface, increase 5 min/week', 2, 1, 0, 9, '20 min continuous'),
      ex('sf-1-2', 'Diaphragmatic Breathing', 'flexibility', 'Deep breathing with abdominal expansion', 3, 10, 30, 7, 'Full inspiration pain-free'),
    ]},
    { phaseNumber: 2, name: 'Early Strengthening', dayRange: [43, 84], goals: ['Core stabilization', 'Endurance', 'Wean brace'], precautions: ['No spinal flexion', 'No impact'], advancementCriteria: ['Plank > 30 sec', 'Walk 30 min'], exercises: [
      ex('sf-2-1', 'Bird Dog', 'strengthening', 'Quadruped opposite arm/leg with neutral spine', 3, 10, 45, 11, 'Hold 10 sec no shift', ['Brace required'], 5),
      ex('sf-2-2', 'Pool Walking', 'cardio', 'Laps in waist-deep water', 1, 1, 0, 11, '20 min continuous', ['Open wound']),
    ]},
    { phaseNumber: 3, name: 'Advanced Rehab', dayRange: [85, 112], goals: ['Full function', 'Return to work', 'Spine health habits'], precautions: ['Proper body mechanics', 'Avoid extremes'], advancementCriteria: ['FCE passed', 'Independent HEP'], exercises: [
      ex('sf-3-1', 'Light Deadlift', 'functional', 'Hip hinge with light load, neutral spine', 3, 10, 60, 13, 'Neutral spine under load', ['Non-union']),
    ]},
  ]},
  hernia_repair: { surgeryType: 'hernia_repair', totalPhases: 2, expectedDurationWeeks: 6, phases: [
    { phaseNumber: 1, name: 'Early Recovery', dayRange: [0, 14], goals: ['Pain control', 'Resume walking', 'Protect repair'], precautions: ['No lifting > 10 lbs', 'No straining'], advancementCriteria: ['Pain < 3/10', 'Walking 20 min'], exercises: [
      ex('he-1-1', 'Walking', 'cardio', 'Start 5-10 min, increase daily', 2, 1, 0, 9, '20 min walk'),
    ]},
    { phaseNumber: 2, name: 'Return to Strength', dayRange: [15, 42], goals: ['Core strength', 'Full activity', 'Return to work'], precautions: ['Progressive loading', 'No max lifts 3 months'], advancementCriteria: ['Lift 25 lbs pain-free'], exercises: [
      ex('he-2-1', 'Progressive Core', 'strengthening', 'Planks, pallof press, farmer carries', 3, 10, 45, 13, 'Plank 60 sec, carry 25 lbs', ['Recurrence'], 10),
    ]},
  ]},
  colectomy: { surgeryType: 'colectomy', totalPhases: 2, expectedDurationWeeks: 6, phases: [
    { phaseNumber: 1, name: 'Post-Op Recovery', dayRange: [0, 14], goals: ['Ambulation', 'Bowel function return', 'Tolerate diet'], precautions: ['No heavy lifting', 'ERAS protocol', 'Early ambulation'], advancementCriteria: ['Solid diet tolerated', 'Walk 15 min'], exercises: [
      ex('co-1-1', 'Hallway Walking', 'cardio', 'Walk 4x daily, increase distance', 4, 1, 0, 9, '200 ft per walk', ['Hemodynamic instability']),
      ex('co-1-2', 'Incentive Spirometry', 'flexibility', '10 breaths per hour while awake', 10, 10, 0, 7, 'Pre-op volumes'),
    ]},
    { phaseNumber: 2, name: 'Functional Recovery', dayRange: [15, 42], goals: ['Normal bowel habits', 'Full ADLs', 'Return to work'], precautions: ['Gradual diet advancement', 'No heavy lifting 6 weeks'], advancementCriteria: ['Full activity pain-free'], exercises: [
      ex('co-2-1', 'Progressive Walking', 'cardio', 'Walk 30 min daily, progress to light jog', 1, 1, 0, 11, 'Brisk walk 30 min'),
    ]},
  ]},
  cholecystectomy: { surgeryType: 'cholecystectomy', totalPhases: 2, expectedDurationWeeks: 2, phases: [
    { phaseNumber: 1, name: 'Immediate Recovery', dayRange: [0, 7], goals: ['Resume walking', 'Tolerate diet', 'Pain-free ADLs'], precautions: ['No lifting > 10 lbs', 'Low-fat diet initially'], advancementCriteria: ['Walking 15 min', 'Normal meals'], exercises: [
      ex('ch-1-1', 'Walking', 'cardio', 'Short walks multiple times daily', 3, 1, 0, 9, '15 min continuous'),
      ex('ch-1-2', 'Deep Breathing', 'flexibility', 'Diaphragmatic breathing to prevent atelectasis', 3, 10, 30, 7, 'Full breath pain-free'),
    ]},
    { phaseNumber: 2, name: 'Return to Full Activity', dayRange: [8, 14], goals: ['Full activity', 'Return to exercise/work'], precautions: ['Listen to body', 'Gradual increase'], advancementCriteria: ['No limitations'], exercises: [
      ex('ch-2-1', 'Normal Exercise', 'cardio', 'Resume pre-op exercise program gradually', 1, 1, 0, 13, 'Pre-op tolerance'),
    ]},
  ]},
};

interface OutcomeEntry {
  patientId: string; surgeryType: SurgeryType; phaseNumber: number;
  exerciseId: string; toleratedWell: boolean; rpeReported: BorgRPE; timestamp: number;
}

const FREQUENCY_MAP: Record<ExerciseType, string> = {
  rom: '3x daily', strengthening: '1x daily', functional: '1x daily',
  balance: '2x daily', cardio: '1x daily', flexibility: '3x daily',
};
const DURATION_MAP: Record<ExerciseType, string> = {
  rom: '10-15 min', strengthening: '15-20 min', functional: '15-20 min',
  balance: '5-10 min', cardio: '20-30 min', flexibility: '5-10 min',
};

export class RehabilitationProtocolEngine {
  private fimHistory: FIMAssessment[] = [];
  private mmtHistory: MMTResult[] = [];
  private exertionHistory: ExertionAssessment[] = [];
  private outcomeLog: OutcomeEntry[] = [];
  private progressionAdjustments: Map<string, number> = new Map();

  getProtocol(surgeryType: SurgeryType): RehabProtocol { return PROTOCOLS[surgeryType]; }

  assessFunction(patientId: string, items: Partial<Record<keyof typeof FIM_ITEMS, FIMLevel>>): FIMAssessment {
    const fullItems: Record<string, FIMLevel> = {};
    let motorScore = 0, cognitiveScore = 0;
    for (const [key, info] of Object.entries(FIM_ITEMS)) {
      const level = items[key as keyof typeof FIM_ITEMS] ?? 1;
      fullItems[key] = level;
      if (info.domain === 'motor') motorScore += level; else cognitiveScore += level;
    }
    const assessment: FIMAssessment = { patientId, timestamp: Date.now(), items: fullItems, motorScore, cognitiveScore, totalScore: motorScore + cognitiveScore };
    this.fimHistory.push(assessment);
    return assessment;
  }

  scoreMMT(patientId: string, muscleGroup: string, side: 'left' | 'right' | 'bilateral', grade: MMTGrade, painDuringTest = false, notes = ''): MMTResult & { gradeLabel: string } {
    const result: MMTResult = { patientId, timestamp: Date.now(), muscleGroup, side, grade, painDuringTest, notes };
    this.mmtHistory.push(result);
    return { ...result, gradeLabel: MMT_GRADE_LABELS[grade] };
  }

  scoreFIM(patientId: string): { latest: FIMAssessment | null; trend: Array<{ timestamp: number; totalScore: number; motorScore: number; cognitiveScore: number }>; itemLabels: Record<string, string>; levelLabels: Record<number, string> } {
    const hist = this.fimHistory.filter((a) => a.patientId === patientId).sort((a, b) => a.timestamp - b.timestamp);
    const itemLabels: Record<string, string> = {};
    for (const [key, info] of Object.entries(FIM_ITEMS)) itemLabels[key] = info.label;
    return {
      latest: hist.length > 0 ? hist[hist.length - 1] : null,
      trend: hist.map((a) => ({ timestamp: a.timestamp, totalScore: a.totalScore, motorScore: a.motorScore, cognitiveScore: a.cognitiveScore })),
      itemLabels, levelLabels: FIM_LEVEL_LABELS,
    };
  }

  generateHEP(patientId: string, surgeryType: SurgeryType, currentPhase: number): HomeExerciseProgram {
    const protocol = PROTOCOLS[surgeryType];
    const phase = protocol.phases.find((p) => p.phaseNumber === currentPhase);
    if (!phase) {
      return { patientId, surgeryType, currentPhase, generatedDate: Date.now(), exercises: [], warnings: ['Invalid phase'], followUpDate: Date.now() + 604800000 };
    }
    const exercises = phase.exercises.map((e) => {
      const adj = this.progressionAdjustments.get(`${patientId}_${e.id}`) ?? 0;
      return {
        ...e,
        sets: Math.max(1, e.sets + (adj > 0 ? 1 : adj < -1 ? -1 : 0)),
        reps: Math.max(5, Math.round(e.reps + adj * 2)),
        frequency: FREQUENCY_MAP[e.type],
        duration: DURATION_MAP[e.type],
        specialInstructions: e.contraindications.length > 0 ? `Avoid if: ${e.contraindications.join('; ')}` : 'Proceed as tolerated',
      };
    });
    return {
      patientId, surgeryType, currentPhase, generatedDate: Date.now(), exercises,
      warnings: ['Stop if pain increases > 2 points', 'Ice 15-20 min after exercise if swelling', ...phase.precautions],
      followUpDate: Date.now() + 604800000,
    };
  }

  progressExercise(patientId: string, surgeryType: SurgeryType, currentPhase: number, exerciseId: string): { shouldProgress: boolean; nextPhase: boolean; recommendation: string; updatedExercise: Exercise | null } {
    const protocol = PROTOCOLS[surgeryType];
    const phase = protocol.phases.find((p) => p.phaseNumber === currentPhase);
    const exercise = phase?.exercises.find((e) => e.id === exerciseId);
    if (!phase || !exercise) return { shouldProgress: false, nextPhase: false, recommendation: 'Exercise not found', updatedExercise: null };

    const recent = this.exertionHistory.filter((e) => e.patientId === patientId && e.exerciseId === exerciseId).sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
    if (recent.length === 0) return { shouldProgress: false, nextPhase: false, recommendation: 'Need at least 3 sessions before progression.', updatedExercise: exercise };

    const avgRPE = recent.reduce((s, e) => s + e.borgRPE, 0) / recent.length;
    const allTolerated = recent.every((e) => e.shouldProgress);
    let shouldProgress = false, recommendation: string;

    if (avgRPE <= exercise.targetRPE && allTolerated) {
      shouldProgress = true;
      recommendation = `Avg RPE ${avgRPE.toFixed(1)} at/below target ${exercise.targetRPE}. Progress reps, sets, or resistance.`;
    } else if (avgRPE > exercise.targetRPE + 2) {
      recommendation = `Avg RPE ${avgRPE.toFixed(1)} exceeds target by >2. Reduce intensity. ${BORG_LABELS[Math.round(avgRPE)] || ''}`;
    } else {
      recommendation = `Avg RPE ${avgRPE.toFixed(1)} near target ${exercise.targetRPE}. Maintain current level.`;
    }

    return {
      shouldProgress, nextPhase: shouldProgress && currentPhase < protocol.totalPhases, recommendation,
      updatedExercise: shouldProgress ? { ...exercise, sets: exercise.sets + 1, reps: Math.min(exercise.reps + 2, 25) } : exercise,
    };
  }

  assessExertion(patientId: string, exerciseId: string, borgRPE: BorgRPE, heartRate?: number, bloodPressure?: { systolic: number; diastolic: number }): ExertionAssessment {
    const assessment: ExertionAssessment = { patientId, timestamp: Date.now(), exerciseId, borgRPE, heartRate, bloodPressure, shouldProgress: borgRPE <= 13, shouldRegress: borgRPE >= 17 };
    this.exertionHistory.push(assessment);
    return assessment;
  }

  recordOutcome(patientId: string, surgeryType: SurgeryType, phaseNumber: number, exerciseId: string, toleratedWell: boolean, rpeReported: BorgRPE): void {
    this.outcomeLog.push({ patientId, surgeryType, phaseNumber, exerciseId, toleratedWell, rpeReported, timestamp: Date.now() });
    const key = `${patientId}_${exerciseId}`;
    const prev = this.progressionAdjustments.get(key) ?? 0;
    if (toleratedWell && rpeReported <= 13) this.progressionAdjustments.set(key, prev + 0.5);
    else if (!toleratedWell || rpeReported >= 17) this.progressionAdjustments.set(key, prev - 1);
  }

  static getBorgScaleReference(): Record<number, string> { return { ...BORG_LABELS }; }
  static getMMTReference(): Record<number, string> { return { ...MMT_GRADE_LABELS }; }
  static getFIMLevelReference(): Record<number, string> { return { ...FIM_LEVEL_LABELS }; }
}

export default RehabilitationProtocolEngine;
