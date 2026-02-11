// dataExportService.ts
// Data export and interoperability: JSON, CSV, FHIR R4, report templates, anonymization, batch export.
// No external dependencies.

// ─── Types ───────────────────────────────────────────────────────────────────

export type ExportFormat = 'json' | 'csv' | 'fhir';

export type FHIRResourceType =
  | 'Patient'
  | 'Condition'
  | 'MedicationRequest'
  | 'Observation'
  | 'CarePlan'
  | 'Encounter';

export type ReportTemplate =
  | 'patient_summary'
  | 'discharge_summary'
  | 'referral_letter'
  | 'progress_note'
  | 'medication_reconciliation'
  | 'pt_progress'
  | 'insurance_preauth'
  | 'quality_metrics';

export type DataCategory =
  | 'demographics'
  | 'diagnoses'
  | 'medications'
  | 'vitals'
  | 'procedures'
  | 'encounters'
  | 'care_plan'
  | 'outcomes'
  | 'notes';

export interface FHIRResource {
  resourceType: string;
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
    profile?: string[];
  };
  [key: string]: unknown;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection' | 'searchset' | 'document';
  total: number;
  entry: Array<{ fullUrl: string; resource: FHIRResource }>;
}

export interface Report {
  id: string;
  patientId: string;
  templateType: ReportTemplate;
  title: string;
  generatedAt: string;
  content: string;
  sections: ReportSection[];
  metadata: Record<string, string>;
}

export interface ReportSection {
  heading: string;
  body: string;
}

export interface AnonymizedData {
  originalRecordCount: number;
  anonymizationMethod: string;
  dateShiftDays: number;
  data: Record<string, unknown>[];
  removedFields: string[];
  hashSalt: string;
}

export interface BatchExportResult {
  batchId: string;
  format: ExportFormat;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  startedAt: string;
  completedAt: string;
  results: Array<{
    patientId: string;
    status: 'success' | 'error';
    data?: string;
    error?: string;
  }>;
  progressPercent: number;
}

// ─── Seed Data (simulated patient records) ───────────────────────────────────

interface PatientRecord {
  id: string;
  name: { given: string; family: string };
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  address: { line: string; city: string; state: string; postalCode: string; country: string };
  phone: string;
  email: string;
  mrn: string;
  ssn: string;
  insuranceId: string;
  diagnoses: Array<{
    code: string;
    system: string;
    display: string;
    onset: string;
    status: 'active' | 'resolved' | 'inactive';
  }>;
  medications: Array<{
    code: string;
    display: string;
    dosage: string;
    frequency: string;
    route: string;
    status: 'active' | 'completed' | 'stopped';
    prescribedDate: string;
  }>;
  vitals: Array<{
    type: string;
    value: number;
    unit: string;
    date: string;
    code: string;
  }>;
  procedures: Array<{
    code: string;
    display: string;
    date: string;
    status: 'completed' | 'in-progress';
  }>;
  encounters: Array<{
    id: string;
    type: string;
    date: string;
    duration: number;
    provider: string;
    reason: string;
    status: 'finished' | 'in-progress' | 'planned';
  }>;
  carePlan: {
    status: 'active' | 'completed' | 'draft';
    goals: Array<{ description: string; status: string; targetDate: string }>;
    activities: Array<{ description: string; frequency: string; status: string }>;
  };
  notes: Array<{ date: string; author: string; text: string; type: string }>;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generatePatientRecords(): Map<string, PatientRecord> {
  const rng = seededRandom(7777);
  const records = new Map<string, PatientRecord>();

  const firstNames = [
    'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
    'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
    'Christopher', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
    'Donald', 'Ashley', 'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna',
    'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah',
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  ];
  const cities = ['Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Jacksonville', 'San Jose'];
  const states = ['IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'TX', 'FL', 'CA'];

  const diagnosisSets: PatientRecord['diagnoses'][] = [
    [
      { code: 'M17.11', system: 'ICD-10', display: 'Primary osteoarthritis, right knee', onset: '2023-03-15', status: 'active' },
      { code: 'E11.9', system: 'ICD-10', display: 'Type 2 diabetes mellitus', onset: '2020-06-01', status: 'active' },
      { code: 'I10', system: 'ICD-10', display: 'Essential hypertension', onset: '2019-01-10', status: 'active' },
    ],
    [
      { code: 'M16.11', system: 'ICD-10', display: 'Primary osteoarthritis, right hip', onset: '2022-11-20', status: 'active' },
      { code: 'J45.20', system: 'ICD-10', display: 'Mild intermittent asthma', onset: '2015-04-10', status: 'active' },
    ],
    [
      { code: 'M75.110', system: 'ICD-10', display: 'Incomplete rotator cuff tear, right shoulder', onset: '2024-01-05', status: 'active' },
      { code: 'M54.5', system: 'ICD-10', display: 'Low back pain', onset: '2021-08-15', status: 'inactive' },
    ],
    [
      { code: 'S83.511A', system: 'ICD-10', display: 'Sprain of anterior cruciate ligament, right knee', onset: '2024-06-10', status: 'active' },
      { code: 'F32.0', system: 'ICD-10', display: 'Major depressive disorder, single episode, mild', onset: '2023-09-01', status: 'active' },
    ],
    [
      { code: 'M43.16', system: 'ICD-10', display: 'Spondylolisthesis, lumbar region', onset: '2023-05-20', status: 'active' },
      { code: 'G89.29', system: 'ICD-10', display: 'Other chronic pain', onset: '2022-01-01', status: 'active' },
      { code: 'I10', system: 'ICD-10', display: 'Essential hypertension', onset: '2018-07-15', status: 'active' },
    ],
  ];

  const medicationSets: PatientRecord['medications'][] = [
    [
      { code: '197696', display: 'Acetaminophen 500mg', dosage: '500mg', frequency: 'Every 6 hours as needed', route: 'oral', status: 'active', prescribedDate: '2024-08-01' },
      { code: '861467', display: 'Oxycodone 5mg', dosage: '5mg', frequency: 'Every 4-6 hours as needed', route: 'oral', status: 'active', prescribedDate: '2024-08-15' },
      { code: '310965', display: 'Metformin 500mg', dosage: '500mg', frequency: 'Twice daily', route: 'oral', status: 'active', prescribedDate: '2020-06-15' },
      { code: '197884', display: 'Lisinopril 10mg', dosage: '10mg', frequency: 'Once daily', route: 'oral', status: 'active', prescribedDate: '2019-02-01' },
      { code: '855318', display: 'Enoxaparin 40mg', dosage: '40mg', frequency: 'Once daily', route: 'subcutaneous', status: 'active', prescribedDate: '2024-08-15' },
    ],
    [
      { code: '197696', display: 'Acetaminophen 500mg', dosage: '500mg', frequency: 'Every 6 hours as needed', route: 'oral', status: 'active', prescribedDate: '2024-07-01' },
      { code: '1049221', display: 'Celecoxib 200mg', dosage: '200mg', frequency: 'Once daily', route: 'oral', status: 'active', prescribedDate: '2024-07-01' },
      { code: '896188', display: 'Albuterol inhaler', dosage: '2 puffs', frequency: 'As needed', route: 'inhalation', status: 'active', prescribedDate: '2015-05-01' },
    ],
    [
      { code: '197696', display: 'Acetaminophen 500mg', dosage: '500mg', frequency: 'Every 6 hours as needed', route: 'oral', status: 'active', prescribedDate: '2024-09-01' },
      { code: '1049221', display: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'Three times daily with food', route: 'oral', status: 'active', prescribedDate: '2024-09-01' },
    ],
    [
      { code: '197696', display: 'Acetaminophen 500mg', dosage: '500mg', frequency: 'Every 6 hours as needed', route: 'oral', status: 'active', prescribedDate: '2024-07-15' },
      { code: '861467', display: 'Tramadol 50mg', dosage: '50mg', frequency: 'Every 6 hours as needed', route: 'oral', status: 'completed', prescribedDate: '2024-07-15' },
      { code: '312938', display: 'Sertraline 50mg', dosage: '50mg', frequency: 'Once daily', route: 'oral', status: 'active', prescribedDate: '2023-09-15' },
    ],
    [
      { code: '197696', display: 'Acetaminophen 500mg', dosage: '500mg', frequency: 'Every 6 hours as needed', route: 'oral', status: 'active', prescribedDate: '2024-06-01' },
      { code: '1049584', display: 'Gabapentin 300mg', dosage: '300mg', frequency: 'Three times daily', route: 'oral', status: 'active', prescribedDate: '2024-06-01' },
      { code: '197884', display: 'Lisinopril 10mg', dosage: '10mg', frequency: 'Once daily', route: 'oral', status: 'active', prescribedDate: '2018-08-01' },
      { code: '855318', display: 'Enoxaparin 40mg', dosage: '40mg', frequency: 'Once daily', route: 'subcutaneous', status: 'active', prescribedDate: '2024-06-15' },
    ],
  ];

  for (let i = 0; i < 50; i++) {
    const id = `PAT-${String(i + 1).padStart(4, '0')}`;
    const gender: ('male' | 'female') = i % 2 === 0 ? 'male' : 'female';
    const birthYear = randomInt(rng, 1946, 1998);
    const birthMonth = randomInt(rng, 1, 12);
    const birthDay = randomInt(rng, 1, 28);
    const cityIdx = i % cities.length;
    const diagIdx = i % diagnosisSets.length;
    const medIdx = i % medicationSets.length;

    const vitalDates = ['2024-08-01', '2024-08-15', '2024-09-01', '2024-09-15', '2024-10-01'];
    const vitals: PatientRecord['vitals'] = [];
    for (const vd of vitalDates) {
      vitals.push(
        { type: 'Blood Pressure Systolic', value: randomInt(rng, 110, 145), unit: 'mmHg', date: vd, code: '8480-6' },
        { type: 'Blood Pressure Diastolic', value: randomInt(rng, 65, 90), unit: 'mmHg', date: vd, code: '8462-4' },
        { type: 'Heart Rate', value: randomInt(rng, 60, 95), unit: 'bpm', date: vd, code: '8867-4' },
        { type: 'Temperature', value: parseFloat((randomInt(rng, 972, 992) / 10).toFixed(1)), unit: 'degF', date: vd, code: '8310-5' },
        { type: 'SpO2', value: randomInt(rng, 94, 100), unit: '%', date: vd, code: '2708-6' },
        { type: 'Weight', value: randomInt(rng, 130, 240), unit: 'lbs', date: vd, code: '29463-7' },
        { type: 'Pain Score', value: randomInt(rng, 0, 8), unit: '/10', date: vd, code: '72514-3' },
      );
    }

    const procedureSets = [
      [{ code: '27447', display: 'Total knee arthroplasty', date: '2024-08-15', status: 'completed' as const }],
      [{ code: '27130', display: 'Total hip arthroplasty', date: '2024-07-20', status: 'completed' as const }],
      [{ code: '23412', display: 'Rotator cuff repair', date: '2024-09-05', status: 'completed' as const }],
      [{ code: '29888', display: 'ACL reconstruction', date: '2024-07-10', status: 'completed' as const }],
      [{ code: '22612', display: 'Lumbar spinal fusion', date: '2024-06-25', status: 'completed' as const }],
    ];

    const encounters: PatientRecord['encounters'] = [
      { id: `ENC-${id}-001`, type: 'Pre-operative evaluation', date: '2024-07-01', duration: 60, provider: 'Dr. Chen', reason: 'Surgical clearance', status: 'finished' },
      { id: `ENC-${id}-002`, type: 'Surgical admission', date: procedureSets[diagIdx][0].date, duration: 180, provider: 'Dr. Patel', reason: procedureSets[diagIdx][0].display, status: 'finished' },
      { id: `ENC-${id}-003`, type: 'Post-op follow-up', date: '2024-09-01', duration: 30, provider: 'Dr. Chen', reason: '2-week follow-up', status: 'finished' },
      { id: `ENC-${id}-004`, type: 'Physical therapy', date: '2024-09-15', duration: 45, provider: 'PT Sarah Kim', reason: 'Rehabilitation session', status: 'finished' },
      { id: `ENC-${id}-005`, type: 'Follow-up visit', date: '2024-10-15', duration: 30, provider: 'Dr. Chen', reason: '6-week follow-up', status: 'planned' },
    ];

    const carePlan: PatientRecord['carePlan'] = {
      status: 'active',
      goals: [
        { description: 'Reduce pain to 3/10 or less', status: 'in-progress', targetDate: '2024-11-15' },
        { description: 'Achieve full range of motion', status: 'in-progress', targetDate: '2025-02-15' },
        { description: 'Return to normal daily activities', status: 'not-started', targetDate: '2025-03-15' },
        { description: 'Complete physical therapy program', status: 'in-progress', targetDate: '2025-01-15' },
      ],
      activities: [
        { description: 'Physical therapy 3x/week', frequency: '3 times per week', status: 'active' },
        { description: 'Home exercise program daily', frequency: 'Daily', status: 'active' },
        { description: 'Ice therapy 20 min, 3x daily', frequency: '3 times per day', status: 'active' },
        { description: 'Wound care and dressing changes', frequency: 'As needed', status: 'active' },
      ],
    };

    const notes: PatientRecord['notes'] = [
      { date: '2024-07-01', author: 'Dr. Chen', text: 'Patient cleared for surgery. Pre-op labs within normal limits. Discussed risks and benefits.', type: 'pre-op' },
      { date: procedureSets[diagIdx][0].date, author: 'Dr. Patel', text: `${procedureSets[diagIdx][0].display} completed without complications. Estimated blood loss 250ml. Patient tolerated procedure well.`, type: 'operative' },
      { date: '2024-09-01', author: 'Dr. Chen', text: 'Healing well. Incision clean and dry. ROM improving. Continue PT and current medication regimen.', type: 'progress' },
      { date: '2024-09-15', author: 'PT Sarah Kim', text: 'Patient demonstrates good compliance with exercise program. ROM 0-95 degrees. Gait improving. Continue current PT plan.', type: 'therapy' },
    ];

    records.set(id, {
      id,
      name: { given: firstNames[i], family: lastNames[i] },
      birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
      gender,
      address: {
        line: `${randomInt(rng, 100, 9999)} ${['Oak', 'Maple', 'Pine', 'Cedar', 'Elm'][i % 5]} ${['St', 'Ave', 'Blvd', 'Dr', 'Ln'][i % 5]}`,
        city: cities[cityIdx],
        state: states[cityIdx],
        postalCode: String(randomInt(rng, 10000, 99999)),
        country: 'US',
      },
      phone: `(${randomInt(rng, 200, 999)}) ${randomInt(rng, 200, 999)}-${String(randomInt(rng, 1000, 9999))}`,
      email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@example.com`,
      mrn: `MRN-${String(randomInt(rng, 100000, 999999))}`,
      ssn: `${randomInt(rng, 100, 999)}-${randomInt(rng, 10, 99)}-${randomInt(rng, 1000, 9999)}`,
      insuranceId: `INS-${String(randomInt(rng, 10000000, 99999999))}`,
      diagnoses: diagnosisSets[diagIdx],
      medications: medicationSets[medIdx],
      vitals,
      procedures: procedureSets[diagIdx],
      encounters,
      carePlan,
      notes,
    });
  }

  return records;
}

const patientRecords: Map<string, PatientRecord> = generatePatientRecords();

// ─── Helper Functions ────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

function simpleHash(input: string, salt: string): string {
  let hash = 0;
  const str = salt + input;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function getPatientRecord(patientId: string): PatientRecord | null {
  return patientRecords.get(patientId) || null;
}

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── JSON Export ─────────────────────────────────────────────────────────────

export function exportJSON(patientId: string, categories: DataCategory[]): string {
  const record = getPatientRecord(patientId);
  if (!record) {
    return JSON.stringify({ error: `Patient ${patientId} not found` });
  }

  const result: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    patientId: record.id,
    format: 'JSON',
  };

  for (const category of categories) {
    switch (category) {
      case 'demographics':
        result.demographics = {
          name: `${record.name.given} ${record.name.family}`,
          birthDate: record.birthDate,
          gender: record.gender,
          address: record.address,
          phone: record.phone,
          email: record.email,
          mrn: record.mrn,
        };
        break;
      case 'diagnoses':
        result.diagnoses = record.diagnoses;
        break;
      case 'medications':
        result.medications = record.medications;
        break;
      case 'vitals':
        result.vitals = record.vitals;
        break;
      case 'procedures':
        result.procedures = record.procedures;
        break;
      case 'encounters':
        result.encounters = record.encounters;
        break;
      case 'care_plan':
        result.carePlan = record.carePlan;
        break;
      case 'notes':
        result.notes = record.notes;
        break;
      case 'outcomes':
        result.outcomes = { note: 'See outcomeTrackingService for detailed outcome data' };
        break;
    }
  }

  return JSON.stringify(result, null, 2);
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

export function exportCSV(patientId: string, category: DataCategory): string {
  const record = getPatientRecord(patientId);
  if (!record) {
    return `Error: Patient ${patientId} not found`;
  }

  const lines: string[] = [];

  switch (category) {
    case 'demographics': {
      lines.push('Field,Value');
      lines.push(`Patient ID,${escapeCSV(record.id)}`);
      lines.push(`Name,${escapeCSV(`${record.name.given} ${record.name.family}`)}`);
      lines.push(`Birth Date,${escapeCSV(record.birthDate)}`);
      lines.push(`Gender,${escapeCSV(record.gender)}`);
      lines.push(`Address,${escapeCSV(`${record.address.line}, ${record.address.city}, ${record.address.state} ${record.address.postalCode}`)}`);
      lines.push(`Phone,${escapeCSV(record.phone)}`);
      lines.push(`Email,${escapeCSV(record.email)}`);
      lines.push(`MRN,${escapeCSV(record.mrn)}`);
      break;
    }
    case 'diagnoses': {
      lines.push('Code,System,Display,Onset,Status');
      for (const dx of record.diagnoses) {
        lines.push(`${escapeCSV(dx.code)},${escapeCSV(dx.system)},${escapeCSV(dx.display)},${escapeCSV(dx.onset)},${escapeCSV(dx.status)}`);
      }
      break;
    }
    case 'medications': {
      lines.push('Code,Medication,Dosage,Frequency,Route,Status,Prescribed Date');
      for (const med of record.medications) {
        lines.push(`${escapeCSV(med.code)},${escapeCSV(med.display)},${escapeCSV(med.dosage)},${escapeCSV(med.frequency)},${escapeCSV(med.route)},${escapeCSV(med.status)},${escapeCSV(med.prescribedDate)}`);
      }
      break;
    }
    case 'vitals': {
      lines.push('Date,Type,Value,Unit,LOINC Code');
      for (const vital of record.vitals) {
        lines.push(`${escapeCSV(vital.date)},${escapeCSV(vital.type)},${escapeCSV(vital.value)},${escapeCSV(vital.unit)},${escapeCSV(vital.code)}`);
      }
      break;
    }
    case 'procedures': {
      lines.push('Code,Description,Date,Status');
      for (const proc of record.procedures) {
        lines.push(`${escapeCSV(proc.code)},${escapeCSV(proc.display)},${escapeCSV(proc.date)},${escapeCSV(proc.status)}`);
      }
      break;
    }
    case 'encounters': {
      lines.push('ID,Type,Date,Duration (min),Provider,Reason,Status');
      for (const enc of record.encounters) {
        lines.push(`${escapeCSV(enc.id)},${escapeCSV(enc.type)},${escapeCSV(enc.date)},${escapeCSV(enc.duration)},${escapeCSV(enc.provider)},${escapeCSV(enc.reason)},${escapeCSV(enc.status)}`);
      }
      break;
    }
    case 'care_plan': {
      lines.push('Type,Description,Details,Status');
      for (const goal of record.carePlan.goals) {
        lines.push(`Goal,${escapeCSV(goal.description)},Target: ${escapeCSV(goal.targetDate)},${escapeCSV(goal.status)}`);
      }
      for (const act of record.carePlan.activities) {
        lines.push(`Activity,${escapeCSV(act.description)},${escapeCSV(act.frequency)},${escapeCSV(act.status)}`);
      }
      break;
    }
    case 'notes': {
      lines.push('Date,Author,Type,Text');
      for (const note of record.notes) {
        lines.push(`${escapeCSV(note.date)},${escapeCSV(note.author)},${escapeCSV(note.type)},${escapeCSV(note.text)}`);
      }
      break;
    }
    case 'outcomes': {
      lines.push('Note');
      lines.push('See outcomeTrackingService for detailed outcome data in CSV format');
      break;
    }
  }

  return lines.join('\n');
}

// ─── FHIR R4 Export ──────────────────────────────────────────────────────────

export function exportFHIR(patientId: string, resourceType: FHIRResourceType): FHIRResource {
  const record = getPatientRecord(patientId);
  const now = new Date().toISOString();

  if (!record) {
    return {
      resourceType: 'OperationOutcome',
      id: generateId('oo'),
      meta: { versionId: '1', lastUpdated: now },
      issue: [{
        severity: 'error',
        code: 'not-found',
        diagnostics: `Patient ${patientId} not found`,
      }],
    };
  }

  switch (resourceType) {
    case 'Patient':
      return {
        resourceType: 'Patient',
        id: record.id,
        meta: {
          versionId: '1',
          lastUpdated: now,
          profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'],
        },
        identifier: [
          { system: 'http://hospital.example.org/mrn', value: record.mrn },
          { system: 'http://hl7.org/fhir/sid/us-ssn', value: record.ssn },
        ],
        active: true,
        name: [{
          use: 'official',
          family: record.name.family,
          given: [record.name.given],
        }],
        telecom: [
          { system: 'phone', value: record.phone, use: 'home' },
          { system: 'email', value: record.email },
        ],
        gender: record.gender,
        birthDate: record.birthDate,
        address: [{
          use: 'home',
          type: 'physical',
          line: [record.address.line],
          city: record.address.city,
          state: record.address.state,
          postalCode: record.address.postalCode,
          country: record.address.country,
        }],
      };

    case 'Condition':
      return {
        resourceType: 'Bundle',
        id: generateId('bundle'),
        type: 'collection',
        meta: { versionId: '1', lastUpdated: now },
        total: record.diagnoses.length,
        entry: record.diagnoses.map((dx, idx) => ({
          fullUrl: `urn:uuid:condition-${record.id}-${idx}`,
          resource: {
            resourceType: 'Condition',
            id: `condition-${record.id}-${idx}`,
            meta: {
              versionId: '1',
              lastUpdated: now,
              profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition'],
            },
            clinicalStatus: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: dx.status }],
            },
            verificationStatus: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }],
            },
            code: {
              coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: dx.code, display: dx.display }],
              text: dx.display,
            },
            subject: { reference: `Patient/${record.id}` },
            onsetDateTime: dx.onset,
          },
        })),
      } as unknown as FHIRResource;

    case 'MedicationRequest':
      return {
        resourceType: 'Bundle',
        id: generateId('bundle'),
        type: 'collection',
        meta: { versionId: '1', lastUpdated: now },
        total: record.medications.length,
        entry: record.medications.map((med, idx) => ({
          fullUrl: `urn:uuid:medrequest-${record.id}-${idx}`,
          resource: {
            resourceType: 'MedicationRequest',
            id: `medrequest-${record.id}-${idx}`,
            meta: {
              versionId: '1',
              lastUpdated: now,
              profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest'],
            },
            status: med.status === 'active' ? 'active' : med.status === 'completed' ? 'completed' : 'stopped',
            intent: 'order',
            medicationCodeableConcept: {
              coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: med.code, display: med.display }],
              text: med.display,
            },
            subject: { reference: `Patient/${record.id}` },
            authoredOn: med.prescribedDate,
            dosageInstruction: [{
              text: `${med.dosage} ${med.frequency}`,
              route: {
                coding: [{ system: 'http://snomed.info/sct', display: med.route }],
              },
            }],
          },
        })),
      } as unknown as FHIRResource;

    case 'Observation':
      return {
        resourceType: 'Bundle',
        id: generateId('bundle'),
        type: 'collection',
        meta: { versionId: '1', lastUpdated: now },
        total: record.vitals.length,
        entry: record.vitals.map((vital, idx) => ({
          fullUrl: `urn:uuid:obs-${record.id}-${idx}`,
          resource: {
            resourceType: 'Observation',
            id: `obs-${record.id}-${idx}`,
            meta: {
              versionId: '1',
              lastUpdated: now,
              profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-vital-signs'],
            },
            status: 'final',
            category: [{
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }],
            }],
            code: {
              coding: [{ system: 'http://loinc.org', code: vital.code, display: vital.type }],
              text: vital.type,
            },
            subject: { reference: `Patient/${record.id}` },
            effectiveDateTime: vital.date,
            valueQuantity: {
              value: vital.value,
              unit: vital.unit,
              system: 'http://unitsofmeasure.org',
            },
          },
        })),
      } as unknown as FHIRResource;

    case 'CarePlan':
      return {
        resourceType: 'CarePlan',
        id: `careplan-${record.id}`,
        meta: {
          versionId: '1',
          lastUpdated: now,
          profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-careplan'],
        },
        status: record.carePlan.status,
        intent: 'plan',
        title: `Post-surgical care plan for ${record.name.given} ${record.name.family}`,
        subject: { reference: `Patient/${record.id}` },
        period: { start: record.procedures[0]?.date || now },
        goal: record.carePlan.goals.map((g, idx) => ({
          reference: `Goal/${record.id}-goal-${idx}`,
          display: g.description,
        })),
        activity: record.carePlan.activities.map(act => ({
          detail: {
            status: act.status === 'active' ? 'in-progress' : 'not-started',
            description: act.description,
            scheduledString: act.frequency,
          },
        })),
      };

    case 'Encounter':
      return {
        resourceType: 'Bundle',
        id: generateId('bundle'),
        type: 'collection',
        meta: { versionId: '1', lastUpdated: now },
        total: record.encounters.length,
        entry: record.encounters.map(enc => ({
          fullUrl: `urn:uuid:${enc.id}`,
          resource: {
            resourceType: 'Encounter',
            id: enc.id,
            meta: {
              versionId: '1',
              lastUpdated: now,
              profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter'],
            },
            status: enc.status === 'finished' ? 'finished' : enc.status === 'in-progress' ? 'in-progress' : 'planned',
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: enc.type.includes('admission') ? 'IMP' : 'AMB',
              display: enc.type.includes('admission') ? 'inpatient' : 'ambulatory',
            },
            type: [{
              coding: [{ display: enc.type }],
              text: enc.type,
            }],
            subject: { reference: `Patient/${record.id}` },
            participant: [{
              individual: { display: enc.provider },
            }],
            period: { start: enc.date },
            reasonCode: [{ text: enc.reason }],
          },
        })),
      } as unknown as FHIRResource;
  }
}

// ─── Report Generation ───────────────────────────────────────────────────────

export function generateReport(patientId: string, templateType: ReportTemplate): Report {
  const record = getPatientRecord(patientId);
  const now = new Date().toISOString();

  if (!record) {
    return {
      id: generateId('rpt'),
      patientId,
      templateType,
      title: 'Error',
      generatedAt: now,
      content: `Patient ${patientId} not found.`,
      sections: [],
      metadata: {},
    };
  }

  const fullName = `${record.name.given} ${record.name.family}`;
  const activeDx = record.diagnoses.filter(d => d.status === 'active').map(d => d.display).join('; ');
  const activeMeds = record.medications
    .filter(m => m.status === 'active')
    .map(m => `${m.display} ${m.dosage} ${m.frequency}`)
    .join('; ');
  const latestVitals = record.vitals.slice(-7);
  const vitalsSummary = latestVitals.map(v => `${v.type}: ${v.value} ${v.unit}`).join('; ');
  const procedure = record.procedures[0];

  let title = '';
  let sections: ReportSection[] = [];

  switch (templateType) {
    case 'patient_summary':
      title = `Patient Summary - ${fullName}`;
      sections = [
        {
          heading: 'Demographics',
          body: `Name: ${fullName}\nDOB: ${record.birthDate}\nGender: ${record.gender}\nMRN: ${record.mrn}\nPhone: ${record.phone}\nEmail: ${record.email}\nAddress: ${record.address.line}, ${record.address.city}, ${record.address.state} ${record.address.postalCode}`,
        },
        { heading: 'Active Diagnoses', body: activeDx || 'No active diagnoses' },
        { heading: 'Current Medications', body: activeMeds || 'No active medications' },
        { heading: 'Recent Vitals', body: vitalsSummary || 'No recent vitals' },
        {
          heading: 'Care Plan',
          body: `Status: ${record.carePlan.status}\nGoals:\n${record.carePlan.goals.map(g => `  - ${g.description} (${g.status}, target: ${g.targetDate})`).join('\n')}\nActivities:\n${record.carePlan.activities.map(a => `  - ${a.description} (${a.frequency})`).join('\n')}`,
        },
        {
          heading: 'Recent Notes',
          body: record.notes.map(n => `[${n.date}] ${n.author}: ${n.text}`).join('\n\n'),
        },
      ];
      break;

    case 'discharge_summary':
      title = `Discharge Summary - ${fullName}`;
      sections = [
        {
          heading: 'Patient Information',
          body: `Name: ${fullName}\nDOB: ${record.birthDate}\nMRN: ${record.mrn}\nAdmission Date: ${procedure?.date || 'N/A'}\nDischarge Date: ${procedure ? addDays(procedure.date, 2) : 'N/A'}`,
        },
        { heading: 'Admission Diagnosis', body: activeDx },
        {
          heading: 'Procedure Performed',
          body: procedure ? `${procedure.display} (CPT: ${procedure.code}) on ${procedure.date}` : 'N/A',
        },
        {
          heading: 'Hospital Course',
          body: `Patient underwent ${procedure?.display || 'surgery'} without immediate complications. Post-operative course was unremarkable. Patient tolerated oral medications and was ambulating with assistance by post-op day 1.`,
        },
        { heading: 'Discharge Medications', body: activeMeds },
        {
          heading: 'Follow-Up Instructions',
          body: '1. Follow up with surgeon in 2 weeks\n2. Continue physical therapy as directed\n3. Take medications as prescribed\n4. Call if fever >101.5F, increasing pain, redness, or drainage from incision\n5. Keep incision clean and dry',
        },
        {
          heading: 'Activity Restrictions',
          body: 'No driving while on narcotic pain medication.\nNo lifting >10 lbs for 6 weeks.\nUse assistive device for ambulation as instructed.\nAttend all scheduled PT appointments.',
        },
      ];
      break;

    case 'referral_letter':
      title = `Referral Letter - ${fullName}`;
      sections = [
        {
          heading: 'Referral Information',
          body: `Date: ${now.split('T')[0]}\nPatient: ${fullName}\nDOB: ${record.birthDate}\nMRN: ${record.mrn}\nReferring Provider: Dr. Chen\nReferred To: Physical Therapy / Rehabilitation`,
        },
        {
          heading: 'Reason for Referral',
          body: `Post-surgical rehabilitation following ${procedure?.display || 'orthopedic surgery'}. Patient requires structured physical therapy program to optimize recovery and functional outcomes.`,
        },
        {
          heading: 'Relevant History',
          body: `Diagnoses: ${activeDx}\nProcedure: ${procedure?.display || 'N/A'} performed on ${procedure?.date || 'N/A'}\nCurrent Medications: ${activeMeds}`,
        },
        {
          heading: 'Goals of Referral',
          body: record.carePlan.goals.map(g => `- ${g.description}`).join('\n'),
        },
        {
          heading: 'Precautions',
          body: 'Please observe post-surgical precautions as indicated. Patient is currently on anticoagulation therapy. Weight-bearing status per surgical protocol.',
        },
      ];
      break;

    case 'progress_note':
      title = `Progress Note - ${fullName}`;
      sections = [
        {
          heading: 'Visit Information',
          body: `Date: ${now.split('T')[0]}\nPatient: ${fullName} (MRN: ${record.mrn})\nProvider: Dr. Chen\nVisit Type: Follow-up`,
        },
        {
          heading: 'Subjective',
          body: `Patient reports gradual improvement in pain and function since last visit. Currently rates pain at ${latestVitals.find(v => v.type === 'Pain Score')?.value || 'N/A'}/10. Compliant with medication and PT regimen. Sleeping well. No new concerns.`,
        },
        {
          heading: 'Objective',
          body: `Vitals: ${vitalsSummary}\nExam: Incision healing well, no signs of infection. ROM improving. Strength 4/5 in affected extremity.`,
        },
        {
          heading: 'Assessment',
          body: `${activeDx}\nRecovery progressing as expected. Patient meeting anticipated milestones.`,
        },
        {
          heading: 'Plan',
          body: '1. Continue current medication regimen\n2. Continue PT 3x/week\n3. Begin progressive weight bearing as tolerated\n4. Follow up in 4 weeks\n5. Repeat imaging if clinically indicated',
        },
      ];
      break;

    case 'medication_reconciliation':
      title = `Medication Reconciliation - ${fullName}`;
      sections = [
        {
          heading: 'Patient Information',
          body: `Name: ${fullName}\nDOB: ${record.birthDate}\nMRN: ${record.mrn}\nDate: ${now.split('T')[0]}\nAllergies: NKDA (No Known Drug Allergies)`,
        },
        {
          heading: 'Current Medications',
          body: record.medications
            .filter(m => m.status === 'active')
            .map((m, i) => `${i + 1}. ${m.display}\n   Dosage: ${m.dosage}\n   Frequency: ${m.frequency}\n   Route: ${m.route}\n   Prescribed: ${m.prescribedDate}`)
            .join('\n\n'),
        },
        {
          heading: 'Discontinued Medications',
          body: record.medications.filter(m => m.status !== 'active').map(m => `- ${m.display} (${m.status})`).join('\n') || 'None',
        },
        {
          heading: 'Reconciliation Notes',
          body: `All medications reviewed and verified with patient on ${now.split('T')[0]}. No discrepancies identified. Patient counseled on proper medication use and potential interactions.`,
        },
      ];
      break;

    case 'pt_progress':
      title = `Physical Therapy Progress Report - ${fullName}`;
      sections = [
        {
          heading: 'Patient Information',
          body: `Name: ${fullName}\nDOB: ${record.birthDate}\nMRN: ${record.mrn}\nDiagnosis: ${activeDx}\nSurgery Date: ${procedure?.date || 'N/A'}\nTherapist: PT Sarah Kim`,
        },
        {
          heading: 'Treatment Summary',
          body: 'Sessions completed: 12 of planned 36\nFrequency: 3x/week\nDuration: 45 minutes per session\nCompliance: Good',
        },
        {
          heading: 'Functional Progress',
          body: 'Range of Motion:\n  - Flexion: Baseline 45 deg -> Current 95 deg\n  - Extension: Baseline -10 deg -> Current 0 deg\nStrength: 3+/5 -> 4/5\nGait: Using single-point cane, improving stance phase symmetry\nBalance: Berg Balance Score improved from 38/56 to 48/56',
        },
        {
          heading: 'Goals Progress',
          body: record.carePlan.goals.map(g => `- ${g.description}: ${g.status}`).join('\n'),
        },
        {
          heading: 'Plan',
          body: 'Continue current PT program. Progress to:\n- Closed-chain strengthening exercises\n- Balance and proprioception training\n- Functional activity training\n- Gradual return to community ambulation',
        },
      ];
      break;

    case 'insurance_preauth':
      title = `Insurance Pre-Authorization Request - ${fullName}`;
      sections = [
        {
          heading: 'Patient Information',
          body: `Name: ${fullName}\nDOB: ${record.birthDate}\nMRN: ${record.mrn}\nInsurance ID: ${record.insuranceId}`,
        },
        {
          heading: 'Requesting Provider',
          body: 'Dr. Arun Patel, MD\nOrthopedic Surgery\nNPI: 1234567890\nFacility: Recovery Pilot Medical Center',
        },
        {
          heading: 'Requested Service',
          body: `Procedure: ${procedure?.display || 'Orthopedic surgery'} (CPT: ${procedure?.code || 'N/A'})\nDiagnosis: ${record.diagnoses[0]?.display || 'N/A'} (${record.diagnoses[0]?.code || 'N/A'})\nEstimated Date of Service: ${procedure?.date || 'TBD'}\nEstimated Length of Stay: 2-3 days`,
        },
        {
          heading: 'Medical Necessity',
          body: 'Patient has failed conservative management including:\n- 6 months of physical therapy\n- NSAIDs and analgesics\n- Corticosteroid injections (2 series)\n- Activity modification\n\nCurrent functional status severely limited. Unable to perform ADLs without significant pain. Imaging confirms advanced pathology requiring surgical intervention.',
        },
        {
          heading: 'Supporting Documentation',
          body: `- MRI report dated ${addDays(procedure?.date || '2024-06-01', -60)}\n- Physical therapy discharge summary\n- Office visit notes (3 most recent)\n- Imaging reports`,
        },
      ];
      break;

    case 'quality_metrics':
      title = `Quality Metrics Report - ${fullName}`;
      sections = [
        {
          heading: 'Patient Overview',
          body: `Name: ${fullName}\nMRN: ${record.mrn}\nSurgery: ${procedure?.display || 'N/A'}\nDate: ${procedure?.date || 'N/A'}`,
        },
        {
          heading: 'Core Quality Measures',
          body: 'Surgical Site Infection: No\nVTE Prophylaxis Administered: Yes\nAntibiotic Prophylaxis Timing: Within 60 min of incision\n30-Day Readmission: No\nUnplanned Return to OR: No\nBlood Transfusion Required: No',
        },
        {
          heading: 'Patient-Reported Outcomes',
          body: 'PHQ-9 (Depression): Baseline -> Current (see PROM data)\nGAD-7 (Anxiety): Baseline -> Current (see PROM data)\nVAS Pain: Baseline -> Current (see PROM data)\nPatient Satisfaction: See satisfaction survey data',
        },
        {
          heading: 'Process Measures',
          body: 'Pre-op Education Completed: Yes\nInformed Consent Documented: Yes\nDischarge Instructions Provided: Yes\nFollow-up Appointment Scheduled: Yes\nPT Referral Made: Yes\nMedication Reconciliation at Discharge: Yes',
        },
        {
          heading: 'Timeliness',
          body: 'Time to First Ambulation: 18 hours post-op\nLength of Stay: 2.5 days\nTime to First PT Session: 24 hours post-op\nFollow-up Within 14 Days: Yes',
        },
      ];
      break;
  }

  const content = sections.map(s => `=== ${s.heading} ===\n${s.body}`).join('\n\n');

  return {
    id: generateId('rpt'),
    patientId,
    templateType,
    title,
    generatedAt: now,
    content,
    sections,
    metadata: {
      patientName: fullName,
      mrn: record.mrn,
      generatedBy: 'Recovery Pilot Export Service',
      version: '1.0.0',
    },
  };
}

// ─── Data Anonymization ──────────────────────────────────────────────────────

export function anonymizeData(
  data: Record<string, unknown> | Record<string, unknown>[]
): AnonymizedData {
  const salt = `anon-${Date.now().toString(36)}`;
  const dateShiftDays = 14 + Math.floor(Math.random() * 60); // shift dates by 14-73 days

  const piiFields = [
    'name', 'given', 'family', 'phone', 'email', 'ssn', 'address',
    'line', 'city', 'postalCode', 'telecom', 'identifier',
  ];
  const dateFields = [
    'birthDate', 'onset', 'date', 'prescribedDate', 'scheduledDate',
    'completedDate', 'createdAt', 'generatedAt', 'authoredOn', 'start', 'end',
  ];
  const idFields = ['id', 'patientId', 'mrn', 'insuranceId'];

  const removedFields: string[] = [];

  function anonymizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = anonymizeValue(key, value);
    }
    return result;
  }

  function anonymizeValue(key: string, value: unknown): unknown {
    if (value === null || value === undefined) return value;

    // Remove PII fields
    if (piiFields.includes(key)) {
      if (!removedFields.includes(key)) removedFields.push(key);
      return '[REDACTED]';
    }

    // Hash ID fields
    if (idFields.includes(key) && typeof value === 'string') {
      return `ANON-${simpleHash(value, salt)}`;
    }

    // Shift date fields
    if (dateFields.includes(key) && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return addDays(value.split('T')[0], dateShiftDays);
    }

    // Recurse into objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      return anonymizeObject(value as Record<string, unknown>);
    }

    // Recurse into arrays
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return anonymizeObject(item as Record<string, unknown>);
        }
        return item;
      });
    }

    return value;
  }

  const inputArray = Array.isArray(data) ? data : [data];
  const anonymized = inputArray.map(item => anonymizeObject(item));

  return {
    originalRecordCount: inputArray.length,
    anonymizationMethod: 'PII removal, date shifting, ID hashing',
    dateShiftDays,
    data: anonymized,
    removedFields,
    hashSalt: salt,
  };
}

// ─── Batch Export ────────────────────────────────────────────────────────────

export function batchExport(
  patientIds: string[],
  format: ExportFormat,
  categories: DataCategory[] = ['demographics', 'diagnoses', 'medications', 'vitals']
): BatchExportResult {
  const batchId = generateId('batch');
  const startedAt = new Date().toISOString();
  const results: BatchExportResult['results'] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const patientId of patientIds) {
    const record = getPatientRecord(patientId);

    if (!record) {
      results.push({
        patientId,
        status: 'error',
        error: `Patient ${patientId} not found`,
      });
      failureCount++;
      continue;
    }

    try {
      let exportedData: string;

      switch (format) {
        case 'json':
          exportedData = exportJSON(patientId, categories);
          break;
        case 'csv':
          exportedData = categories
            .map(cat => `--- ${cat.toUpperCase()} ---\n${exportCSV(patientId, cat)}`)
            .join('\n\n');
          break;
        case 'fhir': {
          const resourceMap: Record<DataCategory, FHIRResourceType | null> = {
            demographics: 'Patient',
            diagnoses: 'Condition',
            medications: 'MedicationRequest',
            vitals: 'Observation',
            procedures: null,
            encounters: 'Encounter',
            care_plan: 'CarePlan',
            outcomes: null,
            notes: null,
          };
          const fhirResources = categories
            .map(cat => resourceMap[cat])
            .filter((rt): rt is FHIRResourceType => rt !== null)
            .map(rt => exportFHIR(patientId, rt));
          exportedData = JSON.stringify(
            {
              resourceType: 'Bundle',
              type: 'collection',
              total: fhirResources.length,
              entry: fhirResources.map(r => ({ resource: r })),
            },
            null,
            2
          );
          break;
        }
      }

      results.push({
        patientId,
        status: 'success',
        data: exportedData,
      });
      successCount++;
    } catch (err) {
      results.push({
        patientId,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error during export',
      });
      failureCount++;
    }
  }

  return {
    batchId,
    format,
    totalRecords: patientIds.length,
    successCount,
    failureCount,
    startedAt,
    completedAt: new Date().toISOString(),
    results,
    progressPercent: 100,
  };
}

// ─── Convenience Exports ─────────────────────────────────────────────────────

export function getAvailablePatientIds(): string[] {
  return Array.from(patientRecords.keys());
}

export function getAvailableTemplates(): ReportTemplate[] {
  return [
    'patient_summary',
    'discharge_summary',
    'referral_letter',
    'progress_note',
    'medication_reconciliation',
    'pt_progress',
    'insurance_preauth',
    'quality_metrics',
  ];
}

export function getAvailableCategories(): DataCategory[] {
  return [
    'demographics', 'diagnoses', 'medications', 'vitals',
    'procedures', 'encounters', 'care_plan', 'outcomes', 'notes',
  ];
}

export function getAvailableFHIRResourceTypes(): FHIRResourceType[] {
  return ['Patient', 'Condition', 'MedicationRequest', 'Observation', 'CarePlan', 'Encounter'];
}

export default {
  exportJSON,
  exportCSV,
  exportFHIR,
  generateReport,
  anonymizeData,
  batchExport,
  getAvailablePatientIds,
  getAvailableTemplates,
  getAvailableCategories,
  getAvailableFHIRResourceTypes,
};
