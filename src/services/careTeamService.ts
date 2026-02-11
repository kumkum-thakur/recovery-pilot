// =============================================================================
// Care Team Coordination Service
// Team management, SBAR handoffs, task delegation, and workload tracking
// =============================================================================

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export type TeamRole =
  | 'surgeon'
  | 'pcp'
  | 'nurse_coordinator'
  | 'physical_therapist'
  | 'occupational_therapist'
  | 'pain_specialist'
  | 'nutritionist'
  | 'counselor'
  | 'pharmacist'
  | 'social_worker'
  | 'case_manager';

export const TEAM_ROLES: TeamRole[] = [
  'surgeon',
  'pcp',
  'nurse_coordinator',
  'physical_therapist',
  'occupational_therapist',
  'pain_specialist',
  'nutritionist',
  'counselor',
  'pharmacist',
  'social_worker',
  'case_manager',
];

export type AvailabilityStatus = 'available' | 'busy' | 'off_duty' | 'on_call' | 'on_leave';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueType = 'clinical' | 'medication' | 'wound' | 'pain' | 'mobility' | 'nutrition' | 'psychosocial' | 'discharge' | 'insurance' | 'emergency';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  specialties: string[];
  email: string;
  phone: string;
  licenseNumber: string;
  availability: AvailabilityStatus;
  shiftStart?: string; // HH:mm
  shiftEnd?: string;   // HH:mm
  maxPatients: number;
  currentPatientCount: number;
  yearsExperience: number;
  certifications: string[];
  preferredContactMethod: 'email' | 'phone' | 'page' | 'secure_message';
  department: string;
  facilityLocation: string;
}

export interface SBARNote {
  id: string;
  patientId: string;
  fromMember: TeamMember;
  toMember: TeamMember;
  timestamp: Date;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  acknowledged: boolean;
  acknowledgedAt?: Date;
}

export interface CareTask {
  id: string;
  patientId: string;
  title: string;
  description: string;
  assignedTo?: string; // TeamMember id
  assignedBy: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  category: IssueType;
  notes: string[];
  requiredRole?: TeamRole;
}

export interface PatientTeamAssignment {
  patientId: string;
  memberId: string;
  role: TeamRole;
  assignedAt: Date;
  isPrimary: boolean;
}

export interface WorkloadEntry {
  memberId: string;
  memberName: string;
  role: TeamRole;
  currentPatientCount: number;
  maxPatients: number;
  utilizationPercent: number;
  pendingTasks: number;
  overdueTasks: number;
  availability: AvailabilityStatus;
}

export interface WorkloadReport {
  generatedAt: Date;
  totalMembers: number;
  availableMembers: number;
  averageUtilization: number;
  entries: WorkloadEntry[];
  overloadedMembers: WorkloadEntry[];
  availableForAssignment: WorkloadEntry[];
}

export interface AutoAssignmentRule {
  id: string;
  category: IssueType;
  requiredRole: TeamRole;
  priority: TaskPriority;
  description: string;
  fallbackRole?: TeamRole;
}

// -----------------------------------------------------------------------------
// TEAM_MEMBER_PROFILES — 55 team member profiles
// -----------------------------------------------------------------------------

export const TEAM_MEMBER_PROFILES: TeamMember[] = [
  // --- SURGEONS (1-5) ---
  {
    id: 'tm-001', name: 'Dr. Robert Chang', role: 'surgeon',
    specialties: ['Orthopedic Surgery', 'Joint Replacement', 'Sports Medicine'],
    email: 'r.chang@hospital.org', phone: '555-1001', licenseNumber: 'MD-29384',
    availability: 'available', shiftStart: '07:00', shiftEnd: '17:00',
    maxPatients: 15, currentPatientCount: 11, yearsExperience: 18,
    certifications: ['Board Certified Orthopedic Surgery', 'ATLS', 'Robotic Surgery Certified'],
    preferredContactMethod: 'page', department: 'Orthopedics', facilityLocation: 'Main Hospital - Floor 4',
  },
  {
    id: 'tm-002', name: 'Dr. Amira Patel', role: 'surgeon',
    specialties: ['General Surgery', 'Minimally Invasive Surgery', 'Bariatric Surgery'],
    email: 'a.patel@hospital.org', phone: '555-1002', licenseNumber: 'MD-30192',
    availability: 'busy', shiftStart: '06:00', shiftEnd: '18:00',
    maxPatients: 12, currentPatientCount: 12, yearsExperience: 14,
    certifications: ['Board Certified General Surgery', 'FACS', 'Advanced Laparoscopy'],
    preferredContactMethod: 'page', department: 'General Surgery', facilityLocation: 'Main Hospital - Floor 3',
  },
  {
    id: 'tm-003', name: 'Dr. James Williams', role: 'surgeon',
    specialties: ['Cardiothoracic Surgery', 'Valve Repair', 'CABG'],
    email: 'j.williams@hospital.org', phone: '555-1003', licenseNumber: 'MD-22847',
    availability: 'on_call', shiftStart: '07:00', shiftEnd: '19:00',
    maxPatients: 8, currentPatientCount: 6, yearsExperience: 22,
    certifications: ['Board Certified Cardiothoracic Surgery', 'ECMO Certified'],
    preferredContactMethod: 'phone', department: 'Cardiothoracic', facilityLocation: 'Heart Center - Floor 2',
  },
  {
    id: 'tm-004', name: 'Dr. Elena Rodriguez', role: 'surgeon',
    specialties: ['Neurosurgery', 'Spine Surgery', 'Brain Tumor Resection'],
    email: 'e.rodriguez@hospital.org', phone: '555-1004', licenseNumber: 'MD-31205',
    availability: 'available', shiftStart: '06:30', shiftEnd: '16:30',
    maxPatients: 10, currentPatientCount: 7, yearsExperience: 16,
    certifications: ['Board Certified Neurosurgery', 'Stereotactic Radiosurgery'],
    preferredContactMethod: 'page', department: 'Neurosurgery', facilityLocation: 'Main Hospital - Floor 6',
  },
  {
    id: 'tm-005', name: 'Dr. Michael Thompson', role: 'surgeon',
    specialties: ['Colorectal Surgery', 'Laparoscopic Surgery', 'Hernia Repair'],
    email: 'm.thompson@hospital.org', phone: '555-1005', licenseNumber: 'MD-27391',
    availability: 'available', shiftStart: '07:00', shiftEnd: '17:00',
    maxPatients: 14, currentPatientCount: 9, yearsExperience: 12,
    certifications: ['Board Certified Colon and Rectal Surgery', 'FACS'],
    preferredContactMethod: 'secure_message', department: 'General Surgery', facilityLocation: 'Main Hospital - Floor 3',
  },

  // --- PRIMARY CARE PHYSICIANS (6-10) ---
  {
    id: 'tm-006', name: 'Dr. Sarah Chen', role: 'pcp',
    specialties: ['Internal Medicine', 'Geriatrics', 'Preventive Medicine'],
    email: 's.chen@clinic.org', phone: '555-2001', licenseNumber: 'MD-33012',
    availability: 'available', shiftStart: '08:00', shiftEnd: '17:00',
    maxPatients: 25, currentPatientCount: 20, yearsExperience: 15,
    certifications: ['Board Certified Internal Medicine', 'Geriatric Medicine'],
    preferredContactMethod: 'secure_message', department: 'Internal Medicine', facilityLocation: 'Outpatient Clinic A',
  },
  {
    id: 'tm-007', name: 'Dr. David Kim', role: 'pcp',
    specialties: ['Family Medicine', 'Diabetes Management', 'Chronic Disease'],
    email: 'd.kim@clinic.org', phone: '555-2002', licenseNumber: 'MD-29048',
    availability: 'available', shiftStart: '08:30', shiftEnd: '17:30',
    maxPatients: 22, currentPatientCount: 18, yearsExperience: 10,
    certifications: ['Board Certified Family Medicine', 'CDE'],
    preferredContactMethod: 'email', department: 'Family Medicine', facilityLocation: 'Outpatient Clinic B',
  },
  {
    id: 'tm-008', name: 'Dr. Lisa Nguyen', role: 'pcp',
    specialties: ['Internal Medicine', 'Cardiology Referral Management', 'Hypertension'],
    email: 'l.nguyen@clinic.org', phone: '555-2003', licenseNumber: 'MD-34221',
    availability: 'busy', shiftStart: '09:00', shiftEnd: '18:00',
    maxPatients: 20, currentPatientCount: 20, yearsExperience: 8,
    certifications: ['Board Certified Internal Medicine'],
    preferredContactMethod: 'secure_message', department: 'Internal Medicine', facilityLocation: 'Outpatient Clinic A',
  },
  {
    id: 'tm-009', name: 'Dr. Anthony Brown', role: 'pcp',
    specialties: ['Family Medicine', 'Sports Medicine', 'Musculoskeletal'],
    email: 'a.brown@clinic.org', phone: '555-2004', licenseNumber: 'MD-28439',
    availability: 'on_leave', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 24, currentPatientCount: 0, yearsExperience: 20,
    certifications: ['Board Certified Family Medicine', 'CAQ Sports Medicine'],
    preferredContactMethod: 'phone', department: 'Family Medicine', facilityLocation: 'Outpatient Clinic C',
  },
  {
    id: 'tm-010', name: 'Dr. Jennifer Martinez', role: 'pcp',
    specialties: ['Internal Medicine', 'Womens Health', 'Post-surgical Recovery'],
    email: 'j.martinez@clinic.org', phone: '555-2005', licenseNumber: 'MD-35102',
    availability: 'available', shiftStart: '07:30', shiftEnd: '16:30',
    maxPatients: 22, currentPatientCount: 15, yearsExperience: 11,
    certifications: ['Board Certified Internal Medicine'],
    preferredContactMethod: 'secure_message', department: 'Internal Medicine', facilityLocation: 'Outpatient Clinic A',
  },

  // --- NURSE COORDINATORS (11-16) ---
  {
    id: 'tm-011', name: 'Rachel Adams, RN', role: 'nurse_coordinator',
    specialties: ['Surgical Recovery Coordination', 'Wound Care', 'Patient Education'],
    email: 'r.adams@hospital.org', phone: '555-3001', licenseNumber: 'RN-44102',
    availability: 'available', shiftStart: '07:00', shiftEnd: '19:00',
    maxPatients: 10, currentPatientCount: 8, yearsExperience: 12,
    certifications: ['RN-BSN', 'CMSRN', 'Wound Care Certified'],
    preferredContactMethod: 'phone', department: 'Surgical Nursing', facilityLocation: 'Main Hospital - Floor 3',
  },
  {
    id: 'tm-012', name: 'Marcus Johnson, RN', role: 'nurse_coordinator',
    specialties: ['Orthopedic Nursing', 'Fall Prevention', 'Discharge Planning'],
    email: 'm.johnson@hospital.org', phone: '555-3002', licenseNumber: 'RN-45890',
    availability: 'available', shiftStart: '07:00', shiftEnd: '19:00',
    maxPatients: 10, currentPatientCount: 7, yearsExperience: 9,
    certifications: ['RN-BSN', 'ONC', 'BLS'],
    preferredContactMethod: 'phone', department: 'Orthopedic Nursing', facilityLocation: 'Main Hospital - Floor 4',
  },
  {
    id: 'tm-013', name: 'Priya Sharma, RN', role: 'nurse_coordinator',
    specialties: ['Cardiac Recovery', 'Telemetry', 'Patient Advocacy'],
    email: 'p.sharma@hospital.org', phone: '555-3003', licenseNumber: 'RN-42310',
    availability: 'busy', shiftStart: '19:00', shiftEnd: '07:00',
    maxPatients: 8, currentPatientCount: 8, yearsExperience: 14,
    certifications: ['RN-BSN', 'CCRN', 'ACLS'],
    preferredContactMethod: 'phone', department: 'Cardiac Nursing', facilityLocation: 'Heart Center - Floor 2',
  },
  {
    id: 'tm-014', name: 'Emily Foster, RN', role: 'nurse_coordinator',
    specialties: ['Neuroscience Nursing', 'Stroke Recovery', 'Neuro Assessment'],
    email: 'e.foster@hospital.org', phone: '555-3004', licenseNumber: 'RN-46201',
    availability: 'available', shiftStart: '07:00', shiftEnd: '19:00',
    maxPatients: 8, currentPatientCount: 5, yearsExperience: 7,
    certifications: ['RN-BSN', 'CNRN', 'NIHSS Certified'],
    preferredContactMethod: 'phone', department: 'Neuroscience Nursing', facilityLocation: 'Main Hospital - Floor 6',
  },
  {
    id: 'tm-015', name: 'Carlos Rivera, RN', role: 'nurse_coordinator',
    specialties: ['ICU Step-down', 'Post-Anesthesia Care', 'Pain Assessment'],
    email: 'c.rivera@hospital.org', phone: '555-3005', licenseNumber: 'RN-41092',
    availability: 'on_call', shiftStart: '15:00', shiftEnd: '23:00',
    maxPatients: 6, currentPatientCount: 3, yearsExperience: 11,
    certifications: ['RN-BSN', 'CPAN', 'ACLS'],
    preferredContactMethod: 'phone', department: 'PACU', facilityLocation: 'Main Hospital - Floor 2',
  },
  {
    id: 'tm-016', name: "Hannah O'Brien, RN", role: 'nurse_coordinator',
    specialties: ['General Surgical Nursing', 'Ostomy Care', 'Medication Reconciliation'],
    email: 'h.obrien@hospital.org', phone: '555-3006', licenseNumber: 'RN-47821',
    availability: 'available', shiftStart: '07:00', shiftEnd: '19:00',
    maxPatients: 10, currentPatientCount: 6, yearsExperience: 5,
    certifications: ['RN-BSN', 'CWOCN'],
    preferredContactMethod: 'secure_message', department: 'Surgical Nursing', facilityLocation: 'Main Hospital - Floor 3',
  },

  // --- PHYSICAL THERAPISTS (17-22) ---
  {
    id: 'tm-017', name: 'Brian Mitchell, PT', role: 'physical_therapist',
    specialties: ['Post-Surgical Rehabilitation', 'Joint Replacement Recovery', 'Gait Training'],
    email: 'b.mitchell@rehab.org', phone: '555-4001', licenseNumber: 'PT-20391',
    availability: 'available', shiftStart: '08:00', shiftEnd: '17:00',
    maxPatients: 12, currentPatientCount: 10, yearsExperience: 15,
    certifications: ['DPT', 'OCS', 'Certified Joint Replacement Specialist'],
    preferredContactMethod: 'email', department: 'Physical Therapy', facilityLocation: 'Rehab Center - Ground Floor',
  },
  {
    id: 'tm-018', name: 'Ashley Park, PT', role: 'physical_therapist',
    specialties: ['Cardiac Rehabilitation', 'Pulmonary Rehab', 'Endurance Training'],
    email: 'a.park@rehab.org', phone: '555-4002', licenseNumber: 'PT-21045',
    availability: 'available', shiftStart: '08:30', shiftEnd: '17:30',
    maxPatients: 10, currentPatientCount: 8, yearsExperience: 9,
    certifications: ['DPT', 'CCS', 'ACSM-CEP'],
    preferredContactMethod: 'email', department: 'Cardiac Rehab', facilityLocation: 'Heart Center - Ground Floor',
  },
  {
    id: 'tm-019', name: 'Thomas Greene, PT', role: 'physical_therapist',
    specialties: ['Neurological Rehabilitation', 'Balance Training', 'Vestibular Therapy'],
    email: 't.greene@rehab.org', phone: '555-4003', licenseNumber: 'PT-19872',
    availability: 'available', shiftStart: '09:00', shiftEnd: '18:00',
    maxPatients: 10, currentPatientCount: 6, yearsExperience: 12,
    certifications: ['DPT', 'NCS', 'Vestibular Rehabilitation Certified'],
    preferredContactMethod: 'phone', department: 'Neuro Rehab', facilityLocation: 'Rehab Center - Floor 2',
  },
  {
    id: 'tm-020', name: 'Jessica Torres, PT', role: 'physical_therapist',
    specialties: ['Spine Rehabilitation', 'McKenzie Method', 'Manual Therapy'],
    email: 'j.torres@rehab.org', phone: '555-4004', licenseNumber: 'PT-22130',
    availability: 'busy', shiftStart: '07:00', shiftEnd: '15:00',
    maxPatients: 12, currentPatientCount: 12, yearsExperience: 7,
    certifications: ['DPT', 'MDT Diploma', 'Dry Needling Certified'],
    preferredContactMethod: 'email', department: 'Physical Therapy', facilityLocation: 'Rehab Center - Ground Floor',
  },
  {
    id: 'tm-021', name: 'Ryan Clark, PT', role: 'physical_therapist',
    specialties: ['Aquatic Therapy', 'Geriatric Rehab', 'Fall Prevention'],
    email: 'r.clark@rehab.org', phone: '555-4005', licenseNumber: 'PT-20198',
    availability: 'available', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 10, currentPatientCount: 5, yearsExperience: 10,
    certifications: ['DPT', 'GCS', 'Aquatic Therapy Certified'],
    preferredContactMethod: 'email', department: 'Geriatric Rehab', facilityLocation: 'Rehab Center - Pool Area',
  },
  {
    id: 'tm-022', name: 'Lauren Hayes, PT', role: 'physical_therapist',
    specialties: ['Wound Care PT', 'Lymphedema Management', 'Compression Therapy'],
    email: 'l.hayes@rehab.org', phone: '555-4006', licenseNumber: 'PT-23410',
    availability: 'on_call', shiftStart: '10:00', shiftEnd: '18:00',
    maxPatients: 8, currentPatientCount: 4, yearsExperience: 6,
    certifications: ['DPT', 'CLT', 'Wound Care Specialist'],
    preferredContactMethod: 'phone', department: 'Physical Therapy', facilityLocation: 'Rehab Center - Ground Floor',
  },

  // --- OCCUPATIONAL THERAPISTS (23-27) ---
  {
    id: 'tm-023', name: 'Nicole Davis, OT', role: 'occupational_therapist',
    specialties: ['Upper Extremity Rehab', 'Hand Therapy', 'Splinting'],
    email: 'n.davis@rehab.org', phone: '555-5001', licenseNumber: 'OT-30291',
    availability: 'available', shiftStart: '08:00', shiftEnd: '17:00',
    maxPatients: 12, currentPatientCount: 9, yearsExperience: 13,
    certifications: ['OTR/L', 'CHT', 'Hand Therapy Specialist'],
    preferredContactMethod: 'email', department: 'Occupational Therapy', facilityLocation: 'Rehab Center - Floor 1',
  },
  {
    id: 'tm-024', name: 'Kevin Wright, OT', role: 'occupational_therapist',
    specialties: ['ADL Training', 'Cognitive Rehabilitation', 'Home Modification'],
    email: 'k.wright@rehab.org', phone: '555-5002', licenseNumber: 'OT-31402',
    availability: 'available', shiftStart: '08:30', shiftEnd: '17:30',
    maxPatients: 10, currentPatientCount: 7, yearsExperience: 8,
    certifications: ['OTR/L', 'CAPS', 'Low Vision Certified'],
    preferredContactMethod: 'email', department: 'Occupational Therapy', facilityLocation: 'Rehab Center - Floor 1',
  },
  {
    id: 'tm-025', name: 'Samantha Lee, OT', role: 'occupational_therapist',
    specialties: ['Neuro OT', 'Stroke Recovery', 'Adaptive Equipment'],
    email: 's.lee@rehab.org', phone: '555-5003', licenseNumber: 'OT-29872',
    availability: 'busy', shiftStart: '07:00', shiftEnd: '15:00',
    maxPatients: 8, currentPatientCount: 8, yearsExperience: 11,
    certifications: ['OTR/L', 'BCPR', 'NDT Certified'],
    preferredContactMethod: 'phone', department: 'Neuro Rehab', facilityLocation: 'Rehab Center - Floor 2',
  },
  {
    id: 'tm-026', name: 'Daniel Moore, OT', role: 'occupational_therapist',
    specialties: ['Burn Recovery', 'Scar Management', 'Pressure Garment Fitting'],
    email: 'd.moore@rehab.org', phone: '555-5004', licenseNumber: 'OT-32190',
    availability: 'available', shiftStart: '09:00', shiftEnd: '17:00',
    maxPatients: 8, currentPatientCount: 3, yearsExperience: 6,
    certifications: ['OTR/L', 'Burn Rehabilitation Certified'],
    preferredContactMethod: 'secure_message', department: 'Burn Unit OT', facilityLocation: 'Burn Center - Floor 1',
  },
  {
    id: 'tm-027', name: 'Christina Hall, OT', role: 'occupational_therapist',
    specialties: ['Pediatric OT', 'Sensory Integration', 'Developmental Therapy'],
    email: 'c.hall@rehab.org', phone: '555-5005', licenseNumber: 'OT-33410',
    availability: 'on_leave', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 10, currentPatientCount: 0, yearsExperience: 9,
    certifications: ['OTR/L', 'SIS Certified', 'Pediatric Specialist'],
    preferredContactMethod: 'email', department: 'Pediatric Rehab', facilityLocation: "Children's Wing - Floor 1",
  },

  // --- PAIN SPECIALISTS (28-32) ---
  {
    id: 'tm-028', name: 'Dr. Andrew Scott', role: 'pain_specialist',
    specialties: ['Interventional Pain Management', 'Nerve Blocks', 'Spinal Injections'],
    email: 'a.scott@hospital.org', phone: '555-6001', licenseNumber: 'MD-36201',
    availability: 'available', shiftStart: '08:00', shiftEnd: '17:00',
    maxPatients: 15, currentPatientCount: 12, yearsExperience: 17,
    certifications: ['Board Certified Anesthesiology', 'Pain Medicine Subspecialty'],
    preferredContactMethod: 'page', department: 'Pain Management', facilityLocation: 'Pain Clinic - Floor 1',
  },
  {
    id: 'tm-029', name: 'Dr. Karen White', role: 'pain_specialist',
    specialties: ['Chronic Pain', 'Opioid Tapering', 'Multimodal Analgesia'],
    email: 'k.white@hospital.org', phone: '555-6002', licenseNumber: 'MD-34892',
    availability: 'available', shiftStart: '08:30', shiftEnd: '16:30',
    maxPatients: 18, currentPatientCount: 14, yearsExperience: 13,
    certifications: ['Board Certified Pain Medicine', 'Addiction Medicine'],
    preferredContactMethod: 'secure_message', department: 'Pain Management', facilityLocation: 'Pain Clinic - Floor 1',
  },
  {
    id: 'tm-030', name: 'Dr. Raj Gupta', role: 'pain_specialist',
    specialties: ['Acute Post-Surgical Pain', 'Regional Anesthesia', 'PCA Management'],
    email: 'r.gupta@hospital.org', phone: '555-6003', licenseNumber: 'MD-37102',
    availability: 'on_call', shiftStart: '07:00', shiftEnd: '19:00',
    maxPatients: 12, currentPatientCount: 8, yearsExperience: 10,
    certifications: ['Board Certified Anesthesiology', 'Regional Anesthesia Fellowship'],
    preferredContactMethod: 'phone', department: 'Acute Pain Service', facilityLocation: 'Main Hospital - Floor 2',
  },
  {
    id: 'tm-031', name: 'Dr. Michelle Taylor', role: 'pain_specialist',
    specialties: ['Neuromodulation', 'Spinal Cord Stimulation', 'Intrathecal Pumps'],
    email: 'm.taylor@hospital.org', phone: '555-6004', licenseNumber: 'MD-35421',
    availability: 'busy', shiftStart: '08:00', shiftEnd: '17:00',
    maxPatients: 10, currentPatientCount: 10, yearsExperience: 15,
    certifications: ['Board Certified Pain Medicine', 'Neuromodulation Certified'],
    preferredContactMethod: 'page', department: 'Pain Management', facilityLocation: 'Pain Clinic - Floor 2',
  },
  {
    id: 'tm-032', name: 'Dr. Patricia Lewis', role: 'pain_specialist',
    specialties: ['Palliative Care', 'Cancer Pain', 'Holistic Pain Management'],
    email: 'p.lewis@hospital.org', phone: '555-6005', licenseNumber: 'MD-33890',
    availability: 'available', shiftStart: '09:00', shiftEnd: '17:00',
    maxPatients: 14, currentPatientCount: 9, yearsExperience: 19,
    certifications: ['Board Certified Palliative Medicine', 'Hospice and Palliative Medicine'],
    preferredContactMethod: 'secure_message', department: 'Palliative Care', facilityLocation: 'Palliative Wing - Floor 5',
  },

  // --- NUTRITIONISTS (33-37) ---
  {
    id: 'tm-033', name: 'Amanda Foster, RD', role: 'nutritionist',
    specialties: ['Post-Surgical Nutrition', 'Wound Healing Nutrition', 'TPN Management'],
    email: 'a.foster@hospital.org', phone: '555-7001', licenseNumber: 'RD-10293',
    availability: 'available', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 20, currentPatientCount: 15, yearsExperience: 10,
    certifications: ['RDN', 'CNSC', 'CSO'],
    preferredContactMethod: 'email', department: 'Clinical Nutrition', facilityLocation: 'Main Hospital - Floor 1',
  },
  {
    id: 'tm-034', name: 'Christopher Yang, RD', role: 'nutritionist',
    specialties: ['Diabetes Nutrition', 'Renal Diet', 'Weight Management'],
    email: 'c.yang@hospital.org', phone: '555-7002', licenseNumber: 'RD-11042',
    availability: 'available', shiftStart: '08:30', shiftEnd: '16:30',
    maxPatients: 18, currentPatientCount: 12, yearsExperience: 7,
    certifications: ['RDN', 'CDE', 'CSR'],
    preferredContactMethod: 'email', department: 'Clinical Nutrition', facilityLocation: 'Outpatient Clinic A',
  },
  {
    id: 'tm-035', name: 'Diana Brooks, RD', role: 'nutritionist',
    specialties: ['Bariatric Nutrition', 'Pre/Post-Surgery Diet', 'Behavioral Nutrition'],
    email: 'd.brooks@hospital.org', phone: '555-7003', licenseNumber: 'RD-10891',
    availability: 'busy', shiftStart: '07:00', shiftEnd: '15:00',
    maxPatients: 15, currentPatientCount: 15, yearsExperience: 12,
    certifications: ['RDN', 'CSO', 'Bariatric Nutrition Specialist'],
    preferredContactMethod: 'secure_message', department: 'Bariatric Program', facilityLocation: 'Bariatric Center - Floor 2',
  },
  {
    id: 'tm-036', name: 'Eric Nelson, RD', role: 'nutritionist',
    specialties: ['Cardiac Nutrition', 'Heart-Healthy Diet', 'Lipid Management'],
    email: 'e.nelson@hospital.org', phone: '555-7004', licenseNumber: 'RD-12301',
    availability: 'available', shiftStart: '09:00', shiftEnd: '17:00',
    maxPatients: 16, currentPatientCount: 10, yearsExperience: 5,
    certifications: ['RDN', 'Cardiac Nutrition Certified'],
    preferredContactMethod: 'email', department: 'Cardiac Rehab Nutrition', facilityLocation: 'Heart Center - Floor 1',
  },
  {
    id: 'tm-037', name: 'Felicia Gomez, RD', role: 'nutritionist',
    specialties: ['Oncology Nutrition', 'Enteral Feeding', 'Malnutrition Screening'],
    email: 'f.gomez@hospital.org', phone: '555-7005', licenseNumber: 'RD-10492',
    availability: 'on_call', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 14, currentPatientCount: 7, yearsExperience: 8,
    certifications: ['RDN', 'CSO', 'CNSC'],
    preferredContactMethod: 'phone', department: 'Oncology Nutrition', facilityLocation: 'Cancer Center - Floor 3',
  },

  // --- COUNSELORS (38-42) ---
  {
    id: 'tm-038', name: 'Dr. Rebecca Stone', role: 'counselor',
    specialties: ['Health Psychology', 'Surgical Anxiety', 'CBT'],
    email: 'r.stone@hospital.org', phone: '555-8001', licenseNumber: 'PSY-50102',
    availability: 'available', shiftStart: '09:00', shiftEnd: '18:00',
    maxPatients: 8, currentPatientCount: 6, yearsExperience: 14,
    certifications: ['Licensed Clinical Psychologist', 'CBT Certified', 'Health Psychology'],
    preferredContactMethod: 'secure_message', department: 'Behavioral Health', facilityLocation: 'Behavioral Health Wing - Floor 2',
  },
  {
    id: 'tm-039', name: 'James Cooper, LCSW', role: 'counselor',
    specialties: ['Medical Social Work', 'Crisis Intervention', 'Caregiver Support'],
    email: 'j.cooper@hospital.org', phone: '555-8002', licenseNumber: 'LCSW-60230',
    availability: 'available', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 10, currentPatientCount: 7, yearsExperience: 11,
    certifications: ['LCSW', 'Crisis Intervention Certified'],
    preferredContactMethod: 'phone', department: 'Social Work', facilityLocation: 'Main Hospital - Floor 1',
  },
  {
    id: 'tm-040', name: 'Sandra Mitchell, LPC', role: 'counselor',
    specialties: ['Pain Psychology', 'Chronic Illness Adjustment', 'Mindfulness-Based Therapy'],
    email: 's.mitchell@hospital.org', phone: '555-8003', licenseNumber: 'LPC-70192',
    availability: 'busy', shiftStart: '10:00', shiftEnd: '19:00',
    maxPatients: 8, currentPatientCount: 8, yearsExperience: 9,
    certifications: ['LPC', 'MBSR Certified', 'Pain Psychology Specialist'],
    preferredContactMethod: 'secure_message', department: 'Pain Psychology', facilityLocation: 'Pain Clinic - Floor 1',
  },
  {
    id: 'tm-041', name: 'Dr. William Parks', role: 'counselor',
    specialties: ['Addiction Counseling', 'Substance Abuse Recovery', 'Motivational Interviewing'],
    email: 'w.parks@hospital.org', phone: '555-8004', licenseNumber: 'PSY-51290',
    availability: 'available', shiftStart: '08:00', shiftEnd: '17:00',
    maxPatients: 10, currentPatientCount: 5, yearsExperience: 16,
    certifications: ['Licensed Clinical Psychologist', 'CASAC', 'Motivational Interviewing Trainer'],
    preferredContactMethod: 'phone', department: 'Addiction Services', facilityLocation: 'Behavioral Health Wing - Floor 3',
  },
  {
    id: 'tm-042', name: 'Maria Gonzalez, LMFT', role: 'counselor',
    specialties: ['Family Therapy', 'Caregiver Burnout', 'Post-Surgical Adjustment'],
    email: 'm.gonzalez@hospital.org', phone: '555-8005', licenseNumber: 'LMFT-80432',
    availability: 'on_call', shiftStart: '09:00', shiftEnd: '17:00',
    maxPatients: 8, currentPatientCount: 4, yearsExperience: 7,
    certifications: ['LMFT', 'Gottman Certified', 'Trauma-Informed Care'],
    preferredContactMethod: 'secure_message', department: 'Family Counseling', facilityLocation: 'Outpatient Clinic B',
  },

  // --- PHARMACISTS (43-47) ---
  {
    id: 'tm-043', name: 'Dr. Jonathan Price, PharmD', role: 'pharmacist',
    specialties: ['Clinical Pharmacy', 'Anticoagulation Management', 'Drug Interactions'],
    email: 'j.price@hospital.org', phone: '555-9001', licenseNumber: 'RPH-20481',
    availability: 'available', shiftStart: '07:00', shiftEnd: '15:00',
    maxPatients: 30, currentPatientCount: 22, yearsExperience: 16,
    certifications: ['PharmD', 'BCPS', 'Anticoagulation Specialist'],
    preferredContactMethod: 'phone', department: 'Clinical Pharmacy', facilityLocation: 'Main Hospital Pharmacy',
  },
  {
    id: 'tm-044', name: 'Dr. Katherine Lee, PharmD', role: 'pharmacist',
    specialties: ['Pain Management Pharmacy', 'Opioid Stewardship', 'Medication Reconciliation'],
    email: 'k.lee@hospital.org', phone: '555-9002', licenseNumber: 'RPH-21302',
    availability: 'available', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 25, currentPatientCount: 18, yearsExperience: 10,
    certifications: ['PharmD', 'BCPS', 'Pain Management Certified'],
    preferredContactMethod: 'secure_message', department: 'Clinical Pharmacy', facilityLocation: 'Main Hospital Pharmacy',
  },
  {
    id: 'tm-045', name: 'Dr. Robert Fisher, PharmD', role: 'pharmacist',
    specialties: ['Infectious Disease Pharmacy', 'Antibiotic Stewardship', 'TPN Compounding'],
    email: 'r.fisher@hospital.org', phone: '555-9003', licenseNumber: 'RPH-19290',
    availability: 'on_call', shiftStart: '15:00', shiftEnd: '23:00',
    maxPatients: 28, currentPatientCount: 15, yearsExperience: 14,
    certifications: ['PharmD', 'BCIDP', 'Antibiotic Stewardship Leader'],
    preferredContactMethod: 'phone', department: 'ID Pharmacy', facilityLocation: 'Main Hospital Pharmacy',
  },
  {
    id: 'tm-046', name: 'Dr. Helen Tran, PharmD', role: 'pharmacist',
    specialties: ['Oncology Pharmacy', 'Chemotherapy Dosing', 'Supportive Care'],
    email: 'h.tran@hospital.org', phone: '555-9004', licenseNumber: 'RPH-22019',
    availability: 'busy', shiftStart: '07:00', shiftEnd: '15:00',
    maxPatients: 20, currentPatientCount: 20, yearsExperience: 12,
    certifications: ['PharmD', 'BCOP'],
    preferredContactMethod: 'email', department: 'Oncology Pharmacy', facilityLocation: 'Cancer Center Pharmacy',
  },
  {
    id: 'tm-047', name: 'Dr. Steven Campbell, PharmD', role: 'pharmacist',
    specialties: ['Ambulatory Care Pharmacy', 'Diabetes Management', 'MTM'],
    email: 's.campbell@hospital.org', phone: '555-9005', licenseNumber: 'RPH-20841',
    availability: 'available', shiftStart: '09:00', shiftEnd: '17:00',
    maxPatients: 22, currentPatientCount: 14, yearsExperience: 8,
    certifications: ['PharmD', 'BCACP', 'CDE'],
    preferredContactMethod: 'email', department: 'Ambulatory Pharmacy', facilityLocation: 'Outpatient Clinic A Pharmacy',
  },

  // --- SOCIAL WORKERS (48-51) ---
  {
    id: 'tm-048', name: 'Angela Washington, MSW', role: 'social_worker',
    specialties: ['Discharge Planning', 'Resource Coordination', 'Insurance Navigation'],
    email: 'a.washington@hospital.org', phone: '555-0401', licenseNumber: 'SW-40102',
    availability: 'available', shiftStart: '08:00', shiftEnd: '16:30',
    maxPatients: 15, currentPatientCount: 12, yearsExperience: 13,
    certifications: ['LMSW', 'ACM', 'Discharge Planning Specialist'],
    preferredContactMethod: 'phone', department: 'Social Services', facilityLocation: 'Main Hospital - Floor 1',
  },
  {
    id: 'tm-049', name: 'Peter Collins, MSW', role: 'social_worker',
    specialties: ['Veteran Services', 'Housing Assistance', 'Community Resources'],
    email: 'p.collins@hospital.org', phone: '555-0402', licenseNumber: 'SW-41293',
    availability: 'available', shiftStart: '08:30', shiftEnd: '17:00',
    maxPatients: 12, currentPatientCount: 9, yearsExperience: 8,
    certifications: ['LMSW', 'Veteran Services Certified'],
    preferredContactMethod: 'phone', department: 'Social Services', facilityLocation: 'VA Liaison Office',
  },
  {
    id: 'tm-050', name: 'Natalie Young, MSW', role: 'social_worker',
    specialties: ['Pediatric Social Work', 'Child Life', 'Family Support'],
    email: 'n.young@hospital.org', phone: '555-0403', licenseNumber: 'SW-42010',
    availability: 'busy', shiftStart: '07:30', shiftEnd: '16:00',
    maxPatients: 10, currentPatientCount: 10, yearsExperience: 11,
    certifications: ['LMSW', 'CCLS'],
    preferredContactMethod: 'secure_message', department: 'Pediatric Social Work', facilityLocation: "Children's Wing - Floor 1",
  },
  {
    id: 'tm-051', name: 'Gregory Adams, MSW', role: 'social_worker',
    specialties: ['Elder Care', 'Advance Directives', 'Long-Term Care Placement'],
    email: 'g.adams@hospital.org', phone: '555-0404', licenseNumber: 'SW-39821',
    availability: 'available', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 14, currentPatientCount: 8, yearsExperience: 18,
    certifications: ['LMSW', 'CSW-G', 'Elder Care Specialist'],
    preferredContactMethod: 'phone', department: 'Geriatric Social Work', facilityLocation: 'Main Hospital - Floor 1',
  },

  // --- CASE MANAGERS (52-55) ---
  {
    id: 'tm-052', name: 'Deborah Reynolds, RN-CM', role: 'case_manager',
    specialties: ['Utilization Review', 'Length of Stay Management', 'Payer Coordination'],
    email: 'd.reynolds@hospital.org', phone: '555-0501', licenseNumber: 'CM-50102',
    availability: 'available', shiftStart: '08:00', shiftEnd: '17:00',
    maxPatients: 20, currentPatientCount: 16, yearsExperience: 15,
    certifications: ['RN-BSN', 'CCM', 'ACM'],
    preferredContactMethod: 'email', department: 'Case Management', facilityLocation: 'Administration - Floor 2',
  },
  {
    id: 'tm-053', name: 'Frank Morrison, RN-CM', role: 'case_manager',
    specialties: ['Surgical Case Management', 'Prior Authorization', 'Appeal Management'],
    email: 'f.morrison@hospital.org', phone: '555-0502', licenseNumber: 'CM-51290',
    availability: 'available', shiftStart: '07:30', shiftEnd: '16:30',
    maxPatients: 18, currentPatientCount: 13, yearsExperience: 12,
    certifications: ['RN-BSN', 'CCM'],
    preferredContactMethod: 'email', department: 'Case Management', facilityLocation: 'Administration - Floor 2',
  },
  {
    id: 'tm-054', name: 'Teresa Hoffman, RN-CM', role: 'case_manager',
    specialties: ['Rehabilitation Case Management', 'Disability Assessment', 'Return to Work'],
    email: 't.hoffman@hospital.org', phone: '555-0503', licenseNumber: 'CM-49301',
    availability: 'busy', shiftStart: '08:00', shiftEnd: '16:00',
    maxPatients: 16, currentPatientCount: 16, yearsExperience: 20,
    certifications: ['RN-BSN', 'CCM', 'CDMS', 'CRC'],
    preferredContactMethod: 'phone', department: 'Rehab Case Management', facilityLocation: 'Rehab Center - Floor 1',
  },
  {
    id: 'tm-055', name: 'Larry Bennett, RN-CM', role: 'case_manager',
    specialties: ['Transplant Case Management', 'Complex Care Coordination', 'Transition Planning'],
    email: 'l.bennett@hospital.org', phone: '555-0504', licenseNumber: 'CM-52019',
    availability: 'on_call', shiftStart: '09:00', shiftEnd: '17:00',
    maxPatients: 12, currentPatientCount: 6, yearsExperience: 9,
    certifications: ['RN-BSN', 'CCM', 'Transplant Coordinator Certified'],
    preferredContactMethod: 'secure_message', department: 'Transplant Services', facilityLocation: 'Transplant Center - Floor 4',
  },
];

// -----------------------------------------------------------------------------
// Auto-Assignment Rules
// -----------------------------------------------------------------------------

export const AUTO_ASSIGNMENT_RULES: AutoAssignmentRule[] = [
  { id: 'aar-01', category: 'clinical', requiredRole: 'surgeon', priority: 'high', description: 'Clinical issues route to the assigned surgeon first' },
  { id: 'aar-02', category: 'clinical', requiredRole: 'pcp', priority: 'medium', description: 'General clinical questions route to PCP', fallbackRole: 'nurse_coordinator' },
  { id: 'aar-03', category: 'medication', requiredRole: 'pharmacist', priority: 'high', description: 'Medication issues route to pharmacist' },
  { id: 'aar-04', category: 'medication', requiredRole: 'pain_specialist', priority: 'high', description: 'Pain medication adjustments to pain specialist', fallbackRole: 'pharmacist' },
  { id: 'aar-05', category: 'wound', requiredRole: 'nurse_coordinator', priority: 'high', description: 'Wound concerns route to nurse coordinator' },
  { id: 'aar-06', category: 'wound', requiredRole: 'surgeon', priority: 'critical', description: 'Severe wound issues escalate to surgeon' },
  { id: 'aar-07', category: 'pain', requiredRole: 'pain_specialist', priority: 'high', description: 'Pain management issues to pain specialist' },
  { id: 'aar-08', category: 'pain', requiredRole: 'nurse_coordinator', priority: 'medium', description: 'Routine pain monitoring by nurse', fallbackRole: 'pcp' },
  { id: 'aar-09', category: 'mobility', requiredRole: 'physical_therapist', priority: 'medium', description: 'Mobility concerns to physical therapist' },
  { id: 'aar-10', category: 'mobility', requiredRole: 'occupational_therapist', priority: 'medium', description: 'ADL concerns to occupational therapist', fallbackRole: 'physical_therapist' },
  { id: 'aar-11', category: 'nutrition', requiredRole: 'nutritionist', priority: 'medium', description: 'Diet and nutrition issues to nutritionist' },
  { id: 'aar-12', category: 'psychosocial', requiredRole: 'counselor', priority: 'medium', description: 'Mental health and adjustment to counselor' },
  { id: 'aar-13', category: 'psychosocial', requiredRole: 'social_worker', priority: 'medium', description: 'Socioeconomic concerns to social worker', fallbackRole: 'counselor' },
  { id: 'aar-14', category: 'discharge', requiredRole: 'case_manager', priority: 'medium', description: 'Discharge planning to case manager' },
  { id: 'aar-15', category: 'discharge', requiredRole: 'social_worker', priority: 'medium', description: 'Home services and placement to social worker', fallbackRole: 'case_manager' },
  { id: 'aar-16', category: 'insurance', requiredRole: 'case_manager', priority: 'medium', description: 'Insurance and authorization to case manager' },
  { id: 'aar-17', category: 'insurance', requiredRole: 'social_worker', priority: 'low', description: 'Financial assistance to social worker', fallbackRole: 'case_manager' },
  { id: 'aar-18', category: 'emergency', requiredRole: 'surgeon', priority: 'critical', description: 'All emergencies escalate to surgeon immediately' },
  { id: 'aar-19', category: 'emergency', requiredRole: 'nurse_coordinator', priority: 'critical', description: 'Nurse coordinator first responder for emergencies' },
];

// -----------------------------------------------------------------------------
// Escalation Path Configuration
// -----------------------------------------------------------------------------

const ESCALATION_PATHS: Record<IssueType, TeamRole[]> = {
  clinical: ['nurse_coordinator', 'pcp', 'surgeon'],
  medication: ['pharmacist', 'nurse_coordinator', 'pain_specialist', 'pcp'],
  wound: ['nurse_coordinator', 'surgeon'],
  pain: ['nurse_coordinator', 'pain_specialist', 'surgeon'],
  mobility: ['physical_therapist', 'occupational_therapist', 'nurse_coordinator', 'surgeon'],
  nutrition: ['nutritionist', 'nurse_coordinator', 'pcp'],
  psychosocial: ['counselor', 'social_worker', 'case_manager', 'pcp'],
  discharge: ['case_manager', 'social_worker', 'nurse_coordinator'],
  insurance: ['case_manager', 'social_worker'],
  emergency: ['nurse_coordinator', 'surgeon', 'pcp'],
};

// -----------------------------------------------------------------------------
// In-memory data stores
// -----------------------------------------------------------------------------

const patientTeamAssignments: Map<string, PatientTeamAssignment[]> = new Map();
const careTasksStore: Map<string, CareTask[]> = new Map();
const sbarNotesStore: Map<string, SBARNote[]> = new Map();

// Pre-populate a sample patient assignment
patientTeamAssignments.set('patient-001', [
  { patientId: 'patient-001', memberId: 'tm-001', role: 'surgeon', assignedAt: new Date('2025-01-15'), isPrimary: true },
  { patientId: 'patient-001', memberId: 'tm-006', role: 'pcp', assignedAt: new Date('2025-01-15'), isPrimary: true },
  { patientId: 'patient-001', memberId: 'tm-011', role: 'nurse_coordinator', assignedAt: new Date('2025-01-15'), isPrimary: true },
  { patientId: 'patient-001', memberId: 'tm-017', role: 'physical_therapist', assignedAt: new Date('2025-01-16'), isPrimary: true },
  { patientId: 'patient-001', memberId: 'tm-023', role: 'occupational_therapist', assignedAt: new Date('2025-01-16'), isPrimary: false },
  { patientId: 'patient-001', memberId: 'tm-028', role: 'pain_specialist', assignedAt: new Date('2025-01-15'), isPrimary: true },
  { patientId: 'patient-001', memberId: 'tm-033', role: 'nutritionist', assignedAt: new Date('2025-01-17'), isPrimary: true },
  { patientId: 'patient-001', memberId: 'tm-043', role: 'pharmacist', assignedAt: new Date('2025-01-15'), isPrimary: true },
  { patientId: 'patient-001', memberId: 'tm-052', role: 'case_manager', assignedAt: new Date('2025-01-15'), isPrimary: true },
]);

// -----------------------------------------------------------------------------
// Core Functions
// -----------------------------------------------------------------------------

/**
 * Assign a team member to a patient for a specific role.
 */
export function assignTeamMember(
  patientId: string,
  role: TeamRole,
  memberId: string
): PatientTeamAssignment {
  const member = TEAM_MEMBER_PROFILES.find((m) => m.id === memberId);
  if (!member) {
    throw new Error(`Team member ${memberId} not found`);
  }
  if (member.role !== role) {
    throw new Error(
      `Team member ${member.name} has role ${member.role}, not ${role}`
    );
  }

  const assignments = patientTeamAssignments.get(patientId) ?? [];

  // Check if there is already a member of that role assigned
  const existingIdx = assignments.findIndex(
    (a) => a.role === role && a.isPrimary
  );
  if (existingIdx >= 0) {
    // Replace the primary for that role
    assignments[existingIdx].isPrimary = false;
  }

  const assignment: PatientTeamAssignment = {
    patientId,
    memberId,
    role,
    assignedAt: new Date(),
    isPrimary: true,
  };

  assignments.push(assignment);
  patientTeamAssignments.set(patientId, assignments);

  // Update member patient count
  member.currentPatientCount = Math.min(
    member.currentPatientCount + 1,
    member.maxPatients
  );

  return assignment;
}

/**
 * Get all team members assigned to a patient.
 */
export function getPatientTeam(patientId: string): TeamMember[] {
  const assignments = patientTeamAssignments.get(patientId) ?? [];
  const memberIds = [...new Set(assignments.filter((a) => a.isPrimary).map((a) => a.memberId))];
  return memberIds
    .map((id) => TEAM_MEMBER_PROFILES.find((m) => m.id === id))
    .filter((m): m is TeamMember => m !== undefined);
}

/**
 * Generate an SBAR handoff note when transferring care between team members.
 */
export function generateHandoffNote(
  patientId: string,
  fromMemberId: string,
  toMemberId: string,
  details: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
    urgency?: 'routine' | 'urgent' | 'emergent';
  }
): SBARNote {
  const fromMember = TEAM_MEMBER_PROFILES.find((m) => m.id === fromMemberId);
  const toMember = TEAM_MEMBER_PROFILES.find((m) => m.id === toMemberId);

  if (!fromMember) throw new Error(`From-member ${fromMemberId} not found`);
  if (!toMember) throw new Error(`To-member ${toMemberId} not found`);

  const note: SBARNote = {
    id: `sbar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    patientId,
    fromMember,
    toMember,
    timestamp: new Date(),
    situation: details.situation,
    background: details.background,
    assessment: details.assessment,
    recommendation: details.recommendation,
    urgency: details.urgency ?? 'routine',
    acknowledged: false,
  };

  const notes = sbarNotesStore.get(patientId) ?? [];
  notes.push(note);
  sbarNotesStore.set(patientId, notes);

  console.log(
    `[CareTeam] SBAR handoff from ${fromMember.name} to ${toMember.name} for patient ${patientId} (${note.urgency})`
  );

  return note;
}

/**
 * Acknowledge an SBAR handoff note.
 */
export function acknowledgeSBAR(patientId: string, noteId: string): boolean {
  const notes = sbarNotesStore.get(patientId) ?? [];
  const note = notes.find((n) => n.id === noteId);
  if (!note) return false;
  note.acknowledged = true;
  note.acknowledgedAt = new Date();
  return true;
}

/**
 * Get all SBAR notes for a patient.
 */
export function getSBARNotes(patientId: string): SBARNote[] {
  return sbarNotesStore.get(patientId) ?? [];
}

/**
 * Format an SBAR note as a readable string.
 */
export function formatSBARNote(note: SBARNote): string {
  return `
================================================================================
                         SBAR HANDOFF COMMUNICATION
================================================================================
Date/Time:     ${note.timestamp.toISOString()}
Urgency:       ${note.urgency.toUpperCase()}
From:          ${note.fromMember.name} (${note.fromMember.role})
To:            ${note.toMember.name} (${note.toMember.role})
Patient ID:    ${note.patientId}
Acknowledged:  ${note.acknowledged ? `Yes (${note.acknowledgedAt?.toISOString()})` : 'No'}

S - SITUATION:
  ${note.situation}

B - BACKGROUND:
  ${note.background}

A - ASSESSMENT:
  ${note.assessment}

R - RECOMMENDATION:
  ${note.recommendation}
================================================================================
`.trim();
}

/**
 * Delegate a task to a specific team member.
 * If no member is specified, auto-assign based on rules.
 */
export function delegateTask(
  task: Omit<CareTask, 'id' | 'createdAt' | 'status' | 'assignedTo'>,
  teamMemberId?: string
): CareTask {
  let assignedTo = teamMemberId;

  if (!assignedTo) {
    // Auto-assign based on rules
    assignedTo = autoAssignTask(task.category, task.priority, task.requiredRole);
  }

  const newTask: CareTask = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date(),
    status: assignedTo ? 'assigned' : 'pending',
    assignedTo,
  };

  const tasks = careTasksStore.get(task.patientId) ?? [];
  tasks.push(newTask);
  careTasksStore.set(task.patientId, tasks);

  if (assignedTo) {
    const member = TEAM_MEMBER_PROFILES.find((m) => m.id === assignedTo);
    console.log(
      `[CareTeam] Task "${newTask.title}" assigned to ${member?.name ?? assignedTo}`
    );
  }

  return newTask;
}

/**
 * Update a task's status.
 */
export function updateTaskStatus(
  patientId: string,
  taskId: string,
  status: TaskStatus,
  notes?: string
): boolean {
  const tasks = careTasksStore.get(patientId) ?? [];
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;

  task.status = status;
  if (status === 'completed') {
    task.completedAt = new Date();
  }
  if (notes) {
    task.notes.push(notes);
  }
  return true;
}

/**
 * Get all tasks for a patient.
 */
export function getPatientTasks(patientId: string): CareTask[] {
  return careTasksStore.get(patientId) ?? [];
}

/**
 * Generate a workload report across all team members.
 */
export function getTeamWorkload(): WorkloadReport {
  const entries: WorkloadEntry[] = TEAM_MEMBER_PROFILES.map((member) => {
    const allTasks = getAllTasksForMember(member.id);
    const pendingTasks = allTasks.filter(
      (t) => t.status === 'pending' || t.status === 'assigned'
    ).length;
    const overdueTasks = allTasks.filter((t) => t.status === 'overdue').length;

    const utilization =
      member.maxPatients > 0
        ? Math.round((member.currentPatientCount / member.maxPatients) * 100)
        : 0;

    return {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      currentPatientCount: member.currentPatientCount,
      maxPatients: member.maxPatients,
      utilizationPercent: utilization,
      pendingTasks,
      overdueTasks,
      availability: member.availability,
    };
  });

  const availableEntries = entries.filter(
    (e) =>
      (e.availability === 'available' || e.availability === 'on_call') &&
      e.utilizationPercent < 100
  );

  const overloaded = entries.filter((e) => e.utilizationPercent >= 90);

  const totalAvailable = entries.filter(
    (e) => e.availability === 'available' || e.availability === 'on_call'
  ).length;

  const avgUtilization =
    entries.length > 0
      ? Math.round(
          entries.reduce((sum, e) => sum + e.utilizationPercent, 0) /
            entries.length
        )
      : 0;

  return {
    generatedAt: new Date(),
    totalMembers: entries.length,
    availableMembers: totalAvailable,
    averageUtilization: avgUtilization,
    entries,
    overloadedMembers: overloaded,
    availableForAssignment: availableEntries,
  };
}

/**
 * Get the escalation path for a specific issue type.
 * Returns team members in escalation order.
 */
export function getEscalationPath(issueType: IssueType): TeamMember[] {
  const roles = ESCALATION_PATHS[issueType] ?? ESCALATION_PATHS.clinical;

  const result: TeamMember[] = [];
  for (const role of roles) {
    const availableMembers = TEAM_MEMBER_PROFILES.filter(
      (m) =>
        m.role === role &&
        (m.availability === 'available' || m.availability === 'on_call')
    ).sort((a, b) => {
      // Prefer available over on_call
      if (a.availability === 'available' && b.availability !== 'available') return -1;
      if (b.availability === 'available' && a.availability !== 'available') return 1;
      // Then by lower utilization
      const aUtil = a.maxPatients > 0 ? a.currentPatientCount / a.maxPatients : 1;
      const bUtil = b.maxPatients > 0 ? b.currentPatientCount / b.maxPatients : 1;
      return aUtil - bUtil;
    });

    if (availableMembers.length > 0) {
      result.push(availableMembers[0]);
    }
  }

  return result;
}

/**
 * Find the best available team member for a given role.
 */
export function findBestAvailableMember(role: TeamRole): TeamMember | undefined {
  return TEAM_MEMBER_PROFILES
    .filter(
      (m) =>
        m.role === role &&
        (m.availability === 'available' || m.availability === 'on_call') &&
        m.currentPatientCount < m.maxPatients
    )
    .sort((a, b) => {
      // Prefer available over on_call
      if (a.availability === 'available' && b.availability !== 'available') return -1;
      if (b.availability === 'available' && a.availability !== 'available') return 1;
      // Lower patient count preferred
      return a.currentPatientCount - b.currentPatientCount;
    })[0];
}

/**
 * Get a team member by ID.
 */
export function getTeamMember(memberId: string): TeamMember | undefined {
  return TEAM_MEMBER_PROFILES.find((m) => m.id === memberId);
}

/**
 * Get all team members with a specific role.
 */
export function getTeamMembersByRole(role: TeamRole): TeamMember[] {
  return TEAM_MEMBER_PROFILES.filter((m) => m.role === role);
}

/**
 * Update a team member's availability status.
 */
export function updateAvailability(
  memberId: string,
  status: AvailabilityStatus
): boolean {
  const member = TEAM_MEMBER_PROFILES.find((m) => m.id === memberId);
  if (!member) return false;
  member.availability = status;
  if (status === 'off_duty' || status === 'on_leave') {
    member.currentPatientCount = 0;
  }
  return true;
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function autoAssignTask(
  category: IssueType,
  _priority: TaskPriority,
  requiredRole?: TeamRole
): string | undefined {
  // If a specific role is required, find best available
  if (requiredRole) {
    const member = findBestAvailableMember(requiredRole);
    return member?.id;
  }

  // Use auto-assignment rules
  const matchingRules = AUTO_ASSIGNMENT_RULES.filter(
    (r) => r.category === category
  ).sort((a, b) => {
    const prioOrder: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    return prioOrder[b.priority] - prioOrder[a.priority];
  });

  for (const rule of matchingRules) {
    const member = findBestAvailableMember(rule.requiredRole);
    if (member) return member.id;

    // Try fallback role
    if (rule.fallbackRole) {
      const fallback = findBestAvailableMember(rule.fallbackRole);
      if (fallback) return fallback.id;
    }
  }

  return undefined;
}

function getAllTasksForMember(memberId: string): CareTask[] {
  const allTasks: CareTask[] = [];
  for (const tasks of careTasksStore.values()) {
    allTasks.push(...tasks.filter((t) => t.assignedTo === memberId));
  }
  return allTasks;
}
