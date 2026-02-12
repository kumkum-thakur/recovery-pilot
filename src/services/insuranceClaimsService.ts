/**
 * Insurance Claims & Billing Management Service
 *
 * Comprehensive insurance profile management, claims processing, cost estimation,
 * billing dashboard, pre-authorization tracking, and CPT/ICD-10 code databases.
 *
 * Requirements: Enhancement - Insurance & billing management
 */

// ============================================================================
// Constants & Enums (using const objects for erasableSyntaxOnly compatibility)
// ============================================================================

export const InsurancePlanType = {
  HMO: 'hmo',
  PPO: 'ppo',
  EPO: 'epo',
  POS: 'pos',
  HDHP: 'hdhp',
  MEDICARE: 'medicare',
  MEDICAID: 'medicaid',
  TRICARE: 'tricare',
  WORKERS_COMP: 'workers_comp',
} as const;
export type InsurancePlanType = typeof InsurancePlanType[keyof typeof InsurancePlanType];

export const InsuranceTier = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
} as const;
export type InsuranceTier = typeof InsuranceTier[keyof typeof InsuranceTier];

export const NetworkStatus = {
  IN_NETWORK: 'in_network',
  OUT_OF_NETWORK: 'out_of_network',
  NOT_APPLICABLE: 'not_applicable',
} as const;
export type NetworkStatus = typeof NetworkStatus[keyof typeof NetworkStatus];

export const ClaimStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  PARTIALLY_APPROVED: 'partially_approved',
  DENIED: 'denied',
  APPEALED: 'appealed',
  APPEAL_APPROVED: 'appeal_approved',
  APPEAL_DENIED: 'appeal_denied',
  PAID: 'paid',
  CLOSED: 'closed',
} as const;
export type ClaimStatus = typeof ClaimStatus[keyof typeof ClaimStatus];

export const PreAuthStatus = {
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  DENIED: 'denied',
  EXPIRED: 'expired',
} as const;
export type PreAuthStatus = typeof PreAuthStatus[keyof typeof PreAuthStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check',
  HSA: 'hsa',
  FSA: 'fsa',
  CASH: 'cash',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const VisitType = {
  INITIAL_CONSULTATION: 'initial_consultation',
  FOLLOW_UP: 'follow_up',
  POST_OP_CHECK: 'post_op_check',
  PHYSICAL_THERAPY: 'physical_therapy',
  WOUND_CARE: 'wound_care',
  IMAGING: 'imaging',
  LAB_WORK: 'lab_work',
  EMERGENCY: 'emergency',
  TELEHEALTH: 'telehealth',
  SURGICAL_PROCEDURE: 'surgical_procedure',
  PRE_OP_ASSESSMENT: 'pre_op_assessment',
  CAST_REMOVAL: 'cast_removal',
  INJECTION: 'injection',
  DURABLE_MEDICAL_EQUIPMENT: 'durable_medical_equipment',
} as const;
export type VisitType = typeof VisitType[keyof typeof VisitType];

export const EOBLineItemStatus = {
  COVERED: 'covered',
  PARTIALLY_COVERED: 'partially_covered',
  NOT_COVERED: 'not_covered',
  APPLIED_TO_DEDUCTIBLE: 'applied_to_deductible',
} as const;
export type EOBLineItemStatus = typeof EOBLineItemStatus[keyof typeof EOBLineItemStatus];

// ============================================================================
// Interfaces
// ============================================================================

export interface CoverageDetails {
  annualDeductible: number;
  deductibleMet: number;
  copay: number;
  coinsurancePercent: number;
  outOfPocketMax: number;
  outOfPocketMet: number;
  coveragePercent: number;
}

export interface NetworkBenefits {
  inNetwork: CoverageDetails;
  outOfNetwork: CoverageDetails;
}

export interface InsuranceProfile {
  id: string;
  patientId: string;
  tier: InsuranceTier;
  provider: string;
  planType: InsurancePlanType;
  planName: string;
  policyNumber: string;
  groupNumber: string;
  subscriberId: string;
  subscriberName: string;
  relationship: string;
  effectiveDate: string;
  terminationDate: string | null;
  benefits: NetworkBenefits;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CPTCode {
  code: string;
  description: string;
  category: string;
  averageCost: number;
  requiresPreAuth: boolean;
}

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

export interface ClaimLineItem {
  id: string;
  cptCode: string;
  cptDescription: string;
  icd10Codes: string[];
  units: number;
  chargeAmount: number;
  allowedAmount: number;
  paidAmount: number;
  patientResponsibility: number;
  adjustmentAmount: number;
  adjustmentReason: string;
}

export interface InsuranceClaim {
  id: string;
  patientId: string;
  insuranceProfileId: string;
  appointmentId: string | null;
  claimNumber: string;
  dateOfService: string;
  dateSubmitted: string | null;
  dateProcessed: string | null;
  providerName: string;
  providerNPI: string;
  facilityName: string;
  visitType: VisitType;
  status: ClaimStatus;
  lineItems: ClaimLineItem[];
  totalCharged: number;
  totalAllowed: number;
  totalPaid: number;
  patientResponsibility: number;
  networkStatus: NetworkStatus;
  preAuthNumber: string | null;
  notes: string;
  denialReason: string | null;
  appealDeadline: string | null;
  eob: ExplanationOfBenefits | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExplanationOfBenefits {
  id: string;
  claimId: string;
  claimNumber: string;
  dateIssued: string;
  providerName: string;
  dateOfService: string;
  totalBilled: number;
  allowedAmount: number;
  planPaid: number;
  appliedToDeductible: number;
  copayAmount: number;
  coinsuranceAmount: number;
  patientResponsibility: number;
  lineItems: EOBLineItem[];
  remarks: string[];
}

export interface EOBLineItem {
  serviceDescription: string;
  cptCode: string;
  billed: number;
  allowed: number;
  planPaid: number;
  youOwe: number;
  status: EOBLineItemStatus;
  remark: string;
}

export interface PreAuthorization {
  id: string;
  patientId: string;
  insuranceProfileId: string;
  authorizationNumber: string | null;
  procedureCptCode: string;
  procedureDescription: string;
  icd10Codes: string[];
  requestedDate: string;
  approvedDate: string | null;
  expirationDate: string | null;
  status: PreAuthStatus;
  approvedUnits: number | null;
  usedUnits: number;
  providerName: string;
  facilityName: string;
  clinicalNotes: string;
  supportingDocuments: string[];
  denialReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CostEstimate {
  procedureCode: string;
  procedureDescription: string;
  estimatedTotalCost: number;
  insuranceCoverage: number;
  appliedToDeductible: number;
  copayAmount: number;
  coinsuranceAmount: number;
  estimatedPatientCost: number;
  remainingDeductible: number;
  remainingOutOfPocket: number;
  networkStatus: NetworkStatus;
  notes: string[];
  isPreAuthRequired: boolean;
}

export interface MedicationCostComparison {
  medicationName: string;
  brandName: string;
  brandCost: number;
  brandCopay: number;
  genericName: string;
  genericCost: number;
  genericCopay: number;
  savings: number;
  isCovered: boolean;
  tierLevel: number;
  requiresPriorAuth: boolean;
}

export interface BillingStatement {
  id: string;
  patientId: string;
  statementDate: string;
  dueDate: string;
  lineItems: BillingLineItem[];
  totalCharges: number;
  insurancePayments: number;
  adjustments: number;
  patientPayments: number;
  balanceDue: number;
  previousBalance: number;
  currentCharges: number;
}

export interface BillingLineItem {
  date: string;
  description: string;
  cptCode: string;
  charges: number;
  insurancePaid: number;
  adjustment: number;
  patientPaid: number;
  balance: number;
}

export interface Payment {
  id: string;
  patientId: string;
  claimId: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  date: string;
  description: string;
}

export interface PaymentPlan {
  id: string;
  patientId: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  numberOfPayments: number;
  paymentsCompleted: number;
  startDate: string;
  nextPaymentDate: string;
  endDate: string;
  isActive: boolean;
  payments: Payment[];
  createdAt: string;
}

export interface DeductibleProgress {
  planYear: string;
  inNetwork: {
    deductible: number;
    met: number;
    remaining: number;
    percentMet: number;
  };
  outOfNetwork: {
    deductible: number;
    met: number;
    remaining: number;
    percentMet: number;
  };
  outOfPocket: {
    max: number;
    met: number;
    remaining: number;
    percentMet: number;
  };
}

export interface PreAuthAlert {
  preAuthId: string;
  authorizationNumber: string | null;
  procedureDescription: string;
  expirationDate: string;
  daysUntilExpiration: number;
  remainingUnits: number;
  alertLevel: 'info' | 'warning' | 'critical';
  message: string;
}

export interface AppointmentForClaim {
  id: string;
  patientId: string;
  providerName: string;
  providerNPI: string;
  facilityName: string;
  visitType: VisitType;
  dateOfService: string;
  diagnosisCodes: string[];
  procedureCodes: string[];
  notes: string;
}

// ============================================================================
// CPT Code Database (100+ common post-operative codes)
// ============================================================================

const CPT_DATABASE: CPTCode[] = [
  // Evaluation & Management (E/M) Codes
  { code: '99201', description: 'Office visit, new patient, minimal complexity', category: 'E/M', averageCost: 75, requiresPreAuth: false },
  { code: '99202', description: 'Office visit, new patient, straightforward complexity', category: 'E/M', averageCost: 110, requiresPreAuth: false },
  { code: '99203', description: 'Office visit, new patient, low complexity', category: 'E/M', averageCost: 165, requiresPreAuth: false },
  { code: '99204', description: 'Office visit, new patient, moderate complexity', category: 'E/M', averageCost: 250, requiresPreAuth: false },
  { code: '99205', description: 'Office visit, new patient, high complexity', category: 'E/M', averageCost: 325, requiresPreAuth: false },
  { code: '99211', description: 'Office visit, established patient, minimal complexity', category: 'E/M', averageCost: 45, requiresPreAuth: false },
  { code: '99212', description: 'Office visit, established patient, straightforward', category: 'E/M', averageCost: 75, requiresPreAuth: false },
  { code: '99213', description: 'Office visit, established patient, low complexity', category: 'E/M', averageCost: 110, requiresPreAuth: false },
  { code: '99214', description: 'Office visit, established patient, moderate complexity', category: 'E/M', averageCost: 165, requiresPreAuth: false },
  { code: '99215', description: 'Office visit, established patient, high complexity', category: 'E/M', averageCost: 250, requiresPreAuth: false },

  // Telehealth
  { code: '99441', description: 'Telephone E/M, 5-10 minutes', category: 'Telehealth', averageCost: 50, requiresPreAuth: false },
  { code: '99442', description: 'Telephone E/M, 11-20 minutes', category: 'Telehealth', averageCost: 90, requiresPreAuth: false },
  { code: '99443', description: 'Telephone E/M, 21-30 minutes', category: 'Telehealth', averageCost: 130, requiresPreAuth: false },

  // Surgical - Musculoskeletal
  { code: '27447', description: 'Total knee replacement (arthroplasty)', category: 'Surgery-Ortho', averageCost: 35000, requiresPreAuth: true },
  { code: '27130', description: 'Total hip replacement (arthroplasty)', category: 'Surgery-Ortho', averageCost: 32000, requiresPreAuth: true },
  { code: '29881', description: 'Knee arthroscopy with meniscectomy', category: 'Surgery-Ortho', averageCost: 8500, requiresPreAuth: true },
  { code: '29882', description: 'Knee arthroscopy with meniscus repair', category: 'Surgery-Ortho', averageCost: 9500, requiresPreAuth: true },
  { code: '29880', description: 'Knee arthroscopy with meniscectomy, medial and lateral', category: 'Surgery-Ortho', averageCost: 10500, requiresPreAuth: true },
  { code: '23472', description: 'Total shoulder replacement (arthroplasty)', category: 'Surgery-Ortho', averageCost: 28000, requiresPreAuth: true },
  { code: '23430', description: 'Shoulder tenodesis (biceps tendon)', category: 'Surgery-Ortho', averageCost: 12000, requiresPreAuth: true },
  { code: '23412', description: 'Rotator cuff repair', category: 'Surgery-Ortho', averageCost: 15000, requiresPreAuth: true },
  { code: '27245', description: 'Open treatment, intertrochanteric fracture', category: 'Surgery-Ortho', averageCost: 18000, requiresPreAuth: true },
  { code: '27236', description: 'Open treatment, femoral neck fracture', category: 'Surgery-Ortho', averageCost: 20000, requiresPreAuth: true },
  { code: '22612', description: 'Lumbar spinal fusion, posterior', category: 'Surgery-Spine', averageCost: 45000, requiresPreAuth: true },
  { code: '22551', description: 'Cervical spinal fusion, anterior', category: 'Surgery-Spine', averageCost: 40000, requiresPreAuth: true },
  { code: '63030', description: 'Lumbar laminotomy/discectomy, single level', category: 'Surgery-Spine', averageCost: 22000, requiresPreAuth: true },
  { code: '63047', description: 'Lumbar laminectomy, single segment', category: 'Surgery-Spine', averageCost: 25000, requiresPreAuth: true },
  { code: '27570', description: 'Manipulation of knee joint under anesthesia', category: 'Surgery-Ortho', averageCost: 3500, requiresPreAuth: true },

  // Surgical - General
  { code: '49505', description: 'Inguinal hernia repair, initial', category: 'Surgery-General', averageCost: 8000, requiresPreAuth: true },
  { code: '47562', description: 'Laparoscopic cholecystectomy', category: 'Surgery-General', averageCost: 12000, requiresPreAuth: true },
  { code: '44970', description: 'Laparoscopic appendectomy', category: 'Surgery-General', averageCost: 15000, requiresPreAuth: true },
  { code: '58571', description: 'Laparoscopic hysterectomy, total', category: 'Surgery-General', averageCost: 18000, requiresPreAuth: true },
  { code: '19301', description: 'Partial mastectomy (lumpectomy)', category: 'Surgery-General', averageCost: 12000, requiresPreAuth: true },

  // Surgical - Cardiac
  { code: '33533', description: 'Coronary artery bypass graft (CABG), single', category: 'Surgery-Cardiac', averageCost: 75000, requiresPreAuth: true },
  { code: '33405', description: 'Aortic valve replacement', category: 'Surgery-Cardiac', averageCost: 80000, requiresPreAuth: true },
  { code: '33208', description: 'Pacemaker insertion, dual chamber', category: 'Surgery-Cardiac', averageCost: 35000, requiresPreAuth: true },

  // Wound Care
  { code: '12001', description: 'Simple wound repair, 2.5 cm or less', category: 'Wound Care', averageCost: 250, requiresPreAuth: false },
  { code: '12002', description: 'Simple wound repair, 2.6-7.5 cm', category: 'Wound Care', averageCost: 350, requiresPreAuth: false },
  { code: '12004', description: 'Simple wound repair, 7.6-12.5 cm', category: 'Wound Care', averageCost: 450, requiresPreAuth: false },
  { code: '12031', description: 'Intermediate wound repair, scalp/trunk, 2.5 cm or less', category: 'Wound Care', averageCost: 550, requiresPreAuth: false },
  { code: '12032', description: 'Intermediate wound repair, scalp/trunk, 2.6-7.5 cm', category: 'Wound Care', averageCost: 650, requiresPreAuth: false },
  { code: '97597', description: 'Debridement, open wound, first 20 sq cm', category: 'Wound Care', averageCost: 200, requiresPreAuth: false },
  { code: '97598', description: 'Debridement, open wound, each additional 20 sq cm', category: 'Wound Care', averageCost: 150, requiresPreAuth: false },
  { code: '97602', description: 'Non-selective wound debridement', category: 'Wound Care', averageCost: 120, requiresPreAuth: false },

  // Physical Therapy
  { code: '97110', description: 'Therapeutic exercises, each 15 minutes', category: 'Physical Therapy', averageCost: 55, requiresPreAuth: false },
  { code: '97112', description: 'Neuromuscular re-education, each 15 minutes', category: 'Physical Therapy', averageCost: 55, requiresPreAuth: false },
  { code: '97116', description: 'Gait training, each 15 minutes', category: 'Physical Therapy', averageCost: 55, requiresPreAuth: false },
  { code: '97140', description: 'Manual therapy techniques, each 15 minutes', category: 'Physical Therapy', averageCost: 60, requiresPreAuth: false },
  { code: '97161', description: 'Physical therapy evaluation, low complexity', category: 'Physical Therapy', averageCost: 120, requiresPreAuth: false },
  { code: '97162', description: 'Physical therapy evaluation, moderate complexity', category: 'Physical Therapy', averageCost: 150, requiresPreAuth: false },
  { code: '97163', description: 'Physical therapy evaluation, high complexity', category: 'Physical Therapy', averageCost: 180, requiresPreAuth: false },
  { code: '97530', description: 'Therapeutic activities, each 15 minutes', category: 'Physical Therapy', averageCost: 55, requiresPreAuth: false },
  { code: '97035', description: 'Ultrasound therapy, each 15 minutes', category: 'Physical Therapy', averageCost: 40, requiresPreAuth: false },
  { code: '97010', description: 'Hot/cold packs application', category: 'Physical Therapy', averageCost: 20, requiresPreAuth: false },
  { code: '97014', description: 'Electrical stimulation (unattended)', category: 'Physical Therapy', averageCost: 35, requiresPreAuth: false },
  { code: '97032', description: 'Electrical stimulation (attended), each 15 min', category: 'Physical Therapy', averageCost: 50, requiresPreAuth: false },
  { code: '97542', description: 'Wheelchair management training, each 15 min', category: 'Physical Therapy', averageCost: 55, requiresPreAuth: false },
  { code: '97760', description: 'Orthotic management and training, each 15 min', category: 'Physical Therapy', averageCost: 60, requiresPreAuth: false },

  // Imaging / Radiology
  { code: '73560', description: 'X-ray, knee, 1-2 views', category: 'Imaging', averageCost: 120, requiresPreAuth: false },
  { code: '73562', description: 'X-ray, knee, 3 views', category: 'Imaging', averageCost: 150, requiresPreAuth: false },
  { code: '73565', description: 'X-ray, knee, bilateral standing', category: 'Imaging', averageCost: 180, requiresPreAuth: false },
  { code: '73030', description: 'X-ray, shoulder, minimum 2 views', category: 'Imaging', averageCost: 120, requiresPreAuth: false },
  { code: '73502', description: 'X-ray, hip, 2-3 views', category: 'Imaging', averageCost: 140, requiresPreAuth: false },
  { code: '72100', description: 'X-ray, lumbar spine, 2-3 views', category: 'Imaging', averageCost: 160, requiresPreAuth: false },
  { code: '72110', description: 'X-ray, lumbar spine, minimum 4 views', category: 'Imaging', averageCost: 200, requiresPreAuth: false },
  { code: '73721', description: 'MRI, any joint of lower extremity, without contrast', category: 'Imaging', averageCost: 1200, requiresPreAuth: true },
  { code: '73723', description: 'MRI, any joint of lower extremity, with and without contrast', category: 'Imaging', averageCost: 1800, requiresPreAuth: true },
  { code: '73221', description: 'MRI, any joint of upper extremity, without contrast', category: 'Imaging', averageCost: 1200, requiresPreAuth: true },
  { code: '72148', description: 'MRI, lumbar spine, without contrast', category: 'Imaging', averageCost: 1500, requiresPreAuth: true },
  { code: '72141', description: 'MRI, cervical spine, without contrast', category: 'Imaging', averageCost: 1500, requiresPreAuth: true },
  { code: '74177', description: 'CT, abdomen and pelvis, with contrast', category: 'Imaging', averageCost: 1800, requiresPreAuth: true },
  { code: '71260', description: 'CT, chest, with contrast', category: 'Imaging', averageCost: 1500, requiresPreAuth: true },
  { code: '77080', description: 'DEXA bone density scan', category: 'Imaging', averageCost: 250, requiresPreAuth: false },

  // Laboratory
  { code: '85025', description: 'Complete blood count (CBC) with differential', category: 'Lab', averageCost: 35, requiresPreAuth: false },
  { code: '80048', description: 'Basic metabolic panel (BMP)', category: 'Lab', averageCost: 40, requiresPreAuth: false },
  { code: '80053', description: 'Comprehensive metabolic panel (CMP)', category: 'Lab', averageCost: 50, requiresPreAuth: false },
  { code: '85610', description: 'Prothrombin time (PT)', category: 'Lab', averageCost: 25, requiresPreAuth: false },
  { code: '85730', description: 'Partial thromboplastin time (PTT)', category: 'Lab', averageCost: 25, requiresPreAuth: false },
  { code: '86140', description: 'C-reactive protein (CRP)', category: 'Lab', averageCost: 30, requiresPreAuth: false },
  { code: '86200', description: 'Cyclic citrullinated peptide (CCP) antibody', category: 'Lab', averageCost: 55, requiresPreAuth: false },
  { code: '82550', description: 'Creatine kinase (CK)', category: 'Lab', averageCost: 30, requiresPreAuth: false },
  { code: '84443', description: 'Thyroid stimulating hormone (TSH)', category: 'Lab', averageCost: 40, requiresPreAuth: false },
  { code: '82746', description: 'Folic acid (folate) level', category: 'Lab', averageCost: 35, requiresPreAuth: false },
  { code: '82306', description: 'Vitamin D, 25-hydroxy', category: 'Lab', averageCost: 50, requiresPreAuth: false },
  { code: '82728', description: 'Ferritin level', category: 'Lab', averageCost: 35, requiresPreAuth: false },

  // Injections & Infusions
  { code: '20610', description: 'Arthrocentesis, major joint (aspiration/injection)', category: 'Injection', averageCost: 350, requiresPreAuth: false },
  { code: '20600', description: 'Arthrocentesis, small joint (aspiration/injection)', category: 'Injection', averageCost: 250, requiresPreAuth: false },
  { code: '20605', description: 'Arthrocentesis, intermediate joint (aspiration/injection)', category: 'Injection', averageCost: 300, requiresPreAuth: false },
  { code: '20550', description: 'Injection, tendon sheath or ligament', category: 'Injection', averageCost: 275, requiresPreAuth: false },
  { code: '62322', description: 'Epidural injection, lumbar/sacral, without imaging', category: 'Injection', averageCost: 800, requiresPreAuth: true },
  { code: '62323', description: 'Epidural injection, lumbar/sacral, with imaging', category: 'Injection', averageCost: 1200, requiresPreAuth: true },
  { code: '64483', description: 'Transforaminal epidural injection, lumbar, single level', category: 'Injection', averageCost: 1500, requiresPreAuth: true },
  { code: 'J7325', description: 'Hyaluronan injection (Synvisc/Euflexxa)', category: 'Injection', averageCost: 900, requiresPreAuth: true },

  // Durable Medical Equipment (DME)
  { code: 'L1832', description: 'Knee orthosis, adjustable joint, prefabricated', category: 'DME', averageCost: 350, requiresPreAuth: false },
  { code: 'E0110', description: 'Crutches, forearm, adjustable, pair', category: 'DME', averageCost: 120, requiresPreAuth: false },
  { code: 'E0143', description: 'Walker, folding, wheeled, adjustable', category: 'DME', averageCost: 200, requiresPreAuth: false },
  { code: 'E0601', description: 'Continuous passive motion (CPM) device', category: 'DME', averageCost: 1800, requiresPreAuth: true },
  { code: 'A4570', description: 'Surgical wound dressing supplies', category: 'DME', averageCost: 45, requiresPreAuth: false },
  { code: 'E0935', description: 'Continuous passive motion device, knee', category: 'DME', averageCost: 2000, requiresPreAuth: true },

  // Anesthesia
  { code: '01402', description: 'Anesthesia for knee arthroplasty', category: 'Anesthesia', averageCost: 3500, requiresPreAuth: false },
  { code: '01214', description: 'Anesthesia for hip arthroplasty', category: 'Anesthesia', averageCost: 3500, requiresPreAuth: false },
  { code: '00630', description: 'Anesthesia for lumbar spine procedures', category: 'Anesthesia', averageCost: 3000, requiresPreAuth: false },
  { code: '01630', description: 'Anesthesia for shoulder procedures', category: 'Anesthesia', averageCost: 2800, requiresPreAuth: false },

  // Cast / Splint Application & Removal
  { code: '29075', description: 'Application of forearm cast, elbow to finger', category: 'Cast/Splint', averageCost: 300, requiresPreAuth: false },
  { code: '29085', description: 'Application of hand/finger cast', category: 'Cast/Splint', averageCost: 250, requiresPreAuth: false },
  { code: '29345', description: 'Application of long leg cast', category: 'Cast/Splint', averageCost: 400, requiresPreAuth: false },
  { code: '29355', description: 'Application of long leg walker cast', category: 'Cast/Splint', averageCost: 350, requiresPreAuth: false },
  { code: '29700', description: 'Removal/bivalving of cast', category: 'Cast/Splint', averageCost: 100, requiresPreAuth: false },
  { code: '29705', description: 'Removal, full arm or full leg cast', category: 'Cast/Splint', averageCost: 120, requiresPreAuth: false },

  // Post-operative Care / Observation
  { code: '99024', description: 'Post-operative follow-up visit (included in global)', category: 'Post-Op', averageCost: 0, requiresPreAuth: false },
  { code: '99238', description: 'Hospital discharge day management, 30 min or less', category: 'Post-Op', averageCost: 175, requiresPreAuth: false },
  { code: '99239', description: 'Hospital discharge day management, more than 30 min', category: 'Post-Op', averageCost: 250, requiresPreAuth: false },
  { code: '99235', description: 'Observation or inpatient same-day admit/discharge', category: 'Post-Op', averageCost: 350, requiresPreAuth: false },
  { code: '99291', description: 'Critical care, first 30-74 minutes', category: 'Post-Op', averageCost: 600, requiresPreAuth: false },
];

// ============================================================================
// ICD-10 Code Database (80+ common post-operative diagnosis codes)
// ============================================================================

const ICD10_DATABASE: ICD10Code[] = [
  // Post-procedural complications
  { code: 'T81.4XXA', description: 'Infection following a procedure, initial encounter', category: 'Post-Op Complications' },
  { code: 'T81.4XXD', description: 'Infection following a procedure, subsequent encounter', category: 'Post-Op Complications' },
  { code: 'T81.31XA', description: 'Disruption of wound, surgical, initial encounter', category: 'Post-Op Complications' },
  { code: 'T81.89XA', description: 'Other complications of procedures, NEC, initial', category: 'Post-Op Complications' },
  { code: 'T81.10XA', description: 'Postprocedural hemorrhage, initial encounter', category: 'Post-Op Complications' },
  { code: 'T81.72XA', description: 'Complication of vein following procedure, initial', category: 'Post-Op Complications' },
  { code: 'T84.84XA', description: 'Pain due to internal orthopedic prosthetic device', category: 'Post-Op Complications' },
  { code: 'T84.01XA', description: 'Broken internal right hip prosthesis, initial', category: 'Post-Op Complications' },
  { code: 'T84.04XA', description: 'Periprosthetic fracture around internal prosthetic knee joint, initial', category: 'Post-Op Complications' },
  { code: 'T84.054A', description: 'Periprosthetic osteolysis of internal prosthetic right knee joint', category: 'Post-Op Complications' },

  // Knee conditions
  { code: 'M17.11', description: 'Primary osteoarthritis, right knee', category: 'Knee' },
  { code: 'M17.12', description: 'Primary osteoarthritis, left knee', category: 'Knee' },
  { code: 'M23.211', description: 'Derangement of anterior horn of medial meniscus, right knee', category: 'Knee' },
  { code: 'M23.311', description: 'Other meniscus derangement, medial meniscus, right knee', category: 'Knee' },
  { code: 'M25.561', description: 'Pain in right knee', category: 'Knee' },
  { code: 'M25.562', description: 'Pain in left knee', category: 'Knee' },
  { code: 'Z96.651', description: 'Presence of right artificial knee joint', category: 'Knee' },
  { code: 'Z96.652', description: 'Presence of left artificial knee joint', category: 'Knee' },
  { code: 'M24.261', description: 'Disorder of ligament, right knee', category: 'Knee' },
  { code: 'S83.511A', description: 'Sprain of anterior cruciate ligament, right knee, initial', category: 'Knee' },

  // Hip conditions
  { code: 'M16.11', description: 'Primary osteoarthritis, right hip', category: 'Hip' },
  { code: 'M16.12', description: 'Primary osteoarthritis, left hip', category: 'Hip' },
  { code: 'M87.051', description: 'Idiopathic aseptic necrosis, right femur', category: 'Hip' },
  { code: 'S72.001A', description: 'Fracture of unspecified part of neck of right femur, initial', category: 'Hip' },
  { code: 'M25.551', description: 'Pain in right hip', category: 'Hip' },
  { code: 'M25.552', description: 'Pain in left hip', category: 'Hip' },
  { code: 'Z96.641', description: 'Presence of right artificial hip joint', category: 'Hip' },
  { code: 'Z96.642', description: 'Presence of left artificial hip joint', category: 'Hip' },

  // Shoulder conditions
  { code: 'M75.111', description: 'Incomplete rotator cuff tear of right shoulder', category: 'Shoulder' },
  { code: 'M75.121', description: 'Complete rotator cuff tear of right shoulder', category: 'Shoulder' },
  { code: 'M75.112', description: 'Incomplete rotator cuff tear of left shoulder', category: 'Shoulder' },
  { code: 'M19.011', description: 'Primary osteoarthritis, right shoulder', category: 'Shoulder' },
  { code: 'M25.511', description: 'Pain in right shoulder', category: 'Shoulder' },
  { code: 'M25.512', description: 'Pain in left shoulder', category: 'Shoulder' },
  { code: 'S43.401A', description: 'Unspecified sprain of right shoulder joint, initial', category: 'Shoulder' },

  // Spine conditions
  { code: 'M54.5', description: 'Low back pain', category: 'Spine' },
  { code: 'M54.16', description: 'Radiculopathy, lumbar region', category: 'Spine' },
  { code: 'M54.17', description: 'Radiculopathy, lumbosacral region', category: 'Spine' },
  { code: 'M51.16', description: 'Intervertebral disc disorder with radiculopathy, lumbar', category: 'Spine' },
  { code: 'M51.17', description: 'Intervertebral disc disorder with radiculopathy, lumbosacral', category: 'Spine' },
  { code: 'M48.06', description: 'Spinal stenosis, lumbar region', category: 'Spine' },
  { code: 'M48.07', description: 'Spinal stenosis, lumbosacral region', category: 'Spine' },
  { code: 'M47.816', description: 'Spondylosis without myelopathy, lumbar region', category: 'Spine' },
  { code: 'M50.120', description: 'Cervical disc disorder with radiculopathy, mid-cervical', category: 'Spine' },
  { code: 'M54.12', description: 'Radiculopathy, cervical region', category: 'Spine' },

  // Pain management
  { code: 'G89.18', description: 'Other acute postprocedural pain', category: 'Pain' },
  { code: 'G89.28', description: 'Other chronic postprocedural pain', category: 'Pain' },
  { code: 'G89.29', description: 'Other chronic pain', category: 'Pain' },
  { code: 'G89.4', description: 'Chronic pain syndrome', category: 'Pain' },
  { code: 'M79.3', description: 'Panniculitis, unspecified', category: 'Pain' },
  { code: 'R52', description: 'Pain, unspecified', category: 'Pain' },

  // Wound / Skin
  { code: 'L97.119', description: 'Non-pressure chronic ulcer of right thigh, unspecified severity', category: 'Wound' },
  { code: 'L76.82', description: 'Postprocedural seroma of skin following other procedure', category: 'Wound' },
  { code: 'T81.31XA', description: 'Disruption of external operation wound, initial', category: 'Wound' },
  { code: 'L08.9', description: 'Local infection of the skin and subcutaneous tissue, unspecified', category: 'Wound' },

  // Fractures
  { code: 'S82.001A', description: 'Unspecified fracture of right patella, initial', category: 'Fracture' },
  { code: 'S82.101A', description: 'Unspecified fracture of upper end of right tibia, initial', category: 'Fracture' },
  { code: 'S42.201A', description: 'Unspecified fracture of upper end of right humerus, initial', category: 'Fracture' },
  { code: 'S52.501A', description: 'Unspecified fracture of lower end of right radius, initial', category: 'Fracture' },
  { code: 'S72.001D', description: 'Fracture of unspecified part of neck of right femur, subsequent', category: 'Fracture' },
  { code: 'M80.08XA', description: 'Age-related osteoporosis with pathological fracture, vertebrae, initial', category: 'Fracture' },

  // General surgical follow-up
  { code: 'Z48.812', description: 'Encounter for surgical aftercare following surgery on nervous system', category: 'Aftercare' },
  { code: 'Z48.813', description: 'Encounter for surgical aftercare following surgery on circulatory system', category: 'Aftercare' },
  { code: 'Z48.815', description: 'Encounter for surgical aftercare following surgery on digestive system', category: 'Aftercare' },
  { code: 'Z48.816', description: 'Encounter for surgical aftercare following surgery on genitourinary system', category: 'Aftercare' },
  { code: 'Z48.817', description: 'Encounter for surgical aftercare following surgery on musculoskeletal system', category: 'Aftercare' },
  { code: 'Z09', description: 'Encounter for follow-up examination after completed treatment', category: 'Aftercare' },
  { code: 'Z87.39', description: 'Personal history of other musculoskeletal disorders', category: 'Aftercare' },
  { code: 'Z96.1', description: 'Presence of intraocular lens', category: 'Aftercare' },

  // Cardiac post-op
  { code: 'Z95.1', description: 'Presence of aortocoronary bypass graft', category: 'Cardiac' },
  { code: 'Z95.0', description: 'Presence of cardiac pacemaker', category: 'Cardiac' },
  { code: 'Z95.2', description: 'Presence of prosthetic heart valve', category: 'Cardiac' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery', category: 'Cardiac' },
  { code: 'I25.810', description: 'Atherosclerosis of coronary artery bypass graft', category: 'Cardiac' },

  // DVT / PE (post-surgical risk)
  { code: 'I82.401', description: 'Acute embolism and thrombosis of right femoral vein', category: 'DVT/PE' },
  { code: 'I82.411', description: 'Acute embolism and thrombosis of right popliteal vein', category: 'DVT/PE' },
  { code: 'I82.4Y1', description: 'Acute embolism and thrombosis of unspecified deep veins of right lower extremity', category: 'DVT/PE' },
  { code: 'I26.99', description: 'Other pulmonary embolism without acute cor pulmonale', category: 'DVT/PE' },
  { code: 'Z86.718', description: 'Personal history of other venous thrombosis and embolism', category: 'DVT/PE' },

  // General symptoms
  { code: 'R50.9', description: 'Fever, unspecified', category: 'Symptoms' },
  { code: 'R60.0', description: 'Localized edema', category: 'Symptoms' },
  { code: 'R22.2', description: 'Localized swelling, mass and lump, trunk', category: 'Symptoms' },
  { code: 'R23.0', description: 'Cyanosis', category: 'Symptoms' },
  { code: 'M62.81', description: 'Muscle weakness (generalized)', category: 'Symptoms' },
  { code: 'R26.2', description: 'Difficulty in walking, not elsewhere classified', category: 'Symptoms' },
  { code: 'R53.1', description: 'Weakness', category: 'Symptoms' },
];

// ============================================================================
// Visit Type to CPT Code Mapping
// ============================================================================

const VISIT_TYPE_CPT_MAP: Record<VisitType, string[]> = {
  [VisitType.INITIAL_CONSULTATION]: ['99204', '99205'],
  [VisitType.FOLLOW_UP]: ['99213', '99214'],
  [VisitType.POST_OP_CHECK]: ['99213', '99214', '99024'],
  [VisitType.PHYSICAL_THERAPY]: ['97161', '97110', '97140'],
  [VisitType.WOUND_CARE]: ['97597', '97602', '99213'],
  [VisitType.IMAGING]: ['73560', '73721', '72148'],
  [VisitType.LAB_WORK]: ['85025', '80053', '86140'],
  [VisitType.EMERGENCY]: ['99291', '99215'],
  [VisitType.TELEHEALTH]: ['99441', '99442', '99443'],
  [VisitType.SURGICAL_PROCEDURE]: ['99214', '99239'],
  [VisitType.PRE_OP_ASSESSMENT]: ['99204', '85025', '80053'],
  [VisitType.CAST_REMOVAL]: ['29700', '29705', '99213'],
  [VisitType.INJECTION]: ['20610', '20550', '99213'],
  [VisitType.DURABLE_MEDICAL_EQUIPMENT]: ['99213'],
};

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  INSURANCE_PROFILES: 'rp_insurance_profiles',
  CLAIMS: 'rp_insurance_claims',
  PRE_AUTHORIZATIONS: 'rp_pre_authorizations',
  PAYMENTS: 'rp_payments',
  PAYMENT_PLANS: 'rp_payment_plans',
} as const;

// ============================================================================
// Utility: ID generation (no external dependencies)
// ============================================================================

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

function generateClaimNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `CLM-${year}-${seq}`;
}

function generateAuthNumber(): string {
  const seq = Math.floor(Math.random() * 9000000) + 1000000;
  return `AUTH-${seq}`;
}

function generateTransactionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TXN-';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================================
// Local Storage Helpers
// ============================================================================

function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    console.error(`[InsuranceClaims] Failed to load from storage key: ${key}`);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.error(`[InsuranceClaims] Failed to save to storage key: ${key}`);
  }
}

// ============================================================================
// Insurance Claims Service Implementation
// ============================================================================

class InsuranceClaimsServiceImpl {

  // ==========================================================================
  // Insurance Profile Management
  // ==========================================================================

  /**
   * Creates a new insurance profile for a patient.
   */
  createInsuranceProfile(
    patientId: string,
    data: Omit<InsuranceProfile, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>
  ): InsuranceProfile {
    const profiles = loadFromStorage<InsuranceProfile>(STORAGE_KEYS.INSURANCE_PROFILES);

    // Enforce uniqueness: only one profile per tier per patient
    const existingTier = profiles.find(
      p => p.patientId === patientId && p.tier === data.tier && p.isActive
    );
    if (existingTier) {
      throw new Error(
        `Patient already has an active ${data.tier} insurance profile. ` +
        `Deactivate the existing one before adding a new ${data.tier} plan.`
      );
    }

    const now = new Date().toISOString();
    const profile: InsuranceProfile = {
      id: generateId('ins'),
      patientId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    profiles.push(profile);
    saveToStorage(STORAGE_KEYS.INSURANCE_PROFILES, profiles);
    console.log(`[InsuranceClaims] Created insurance profile ${profile.id} for patient ${patientId}`);
    return profile;
  }

  /**
   * Retrieves all insurance profiles for a patient.
   */
  getInsuranceProfiles(patientId: string): InsuranceProfile[] {
    return loadFromStorage<InsuranceProfile>(STORAGE_KEYS.INSURANCE_PROFILES)
      .filter(p => p.patientId === patientId);
  }

  /**
   * Retrieves the active insurance profiles for a patient, ordered by tier.
   */
  getActiveInsuranceProfiles(patientId: string): InsuranceProfile[] {
    const tierOrder: Record<InsuranceTier, number> = {
      [InsuranceTier.PRIMARY]: 0,
      [InsuranceTier.SECONDARY]: 1,
      [InsuranceTier.TERTIARY]: 2,
    };

    return this.getInsuranceProfiles(patientId)
      .filter(p => p.isActive)
      .sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
  }

  /**
   * Retrieves a single insurance profile by ID.
   */
  getInsuranceProfileById(profileId: string): InsuranceProfile | null {
    return loadFromStorage<InsuranceProfile>(STORAGE_KEYS.INSURANCE_PROFILES)
      .find(p => p.id === profileId) ?? null;
  }

  /**
   * Updates an insurance profile.
   */
  updateInsuranceProfile(
    profileId: string,
    updates: Partial<Omit<InsuranceProfile, 'id' | 'patientId' | 'createdAt'>>
  ): InsuranceProfile {
    const profiles = loadFromStorage<InsuranceProfile>(STORAGE_KEYS.INSURANCE_PROFILES);
    const index = profiles.findIndex(p => p.id === profileId);
    if (index === -1) {
      throw new Error(`Insurance profile not found: ${profileId}`);
    }

    profiles[index] = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.INSURANCE_PROFILES, profiles);
    console.log(`[InsuranceClaims] Updated insurance profile ${profileId}`);
    return profiles[index];
  }

  /**
   * Deactivates an insurance profile (soft delete).
   */
  deactivateInsuranceProfile(profileId: string): void {
    this.updateInsuranceProfile(profileId, { isActive: false });
    console.log(`[InsuranceClaims] Deactivated insurance profile ${profileId}`);
  }

  /**
   * Gets the network benefits for a specific profile and network status.
   */
  getBenefitsByNetwork(profileId: string, network: NetworkStatus): CoverageDetails | null {
    const profile = this.getInsuranceProfileById(profileId);
    if (!profile) return null;

    if (network === NetworkStatus.IN_NETWORK) {
      return profile.benefits.inNetwork;
    }
    if (network === NetworkStatus.OUT_OF_NETWORK) {
      return profile.benefits.outOfNetwork;
    }
    return profile.benefits.inNetwork;
  }

  // ==========================================================================
  // CPT & ICD-10 Code Database
  // ==========================================================================

  /**
   * Looks up a CPT code by code string.
   */
  lookupCPTCode(code: string): CPTCode | null {
    return CPT_DATABASE.find(c => c.code === code) ?? null;
  }

  /**
   * Searches CPT codes by keyword in description.
   */
  searchCPTCodes(keyword: string): CPTCode[] {
    const lower = keyword.toLowerCase();
    return CPT_DATABASE.filter(
      c => c.description.toLowerCase().includes(lower) ||
           c.code.includes(keyword) ||
           c.category.toLowerCase().includes(lower)
    );
  }

  /**
   * Returns CPT codes by category.
   */
  getCPTCodesByCategory(category: string): CPTCode[] {
    return CPT_DATABASE.filter(c => c.category === category);
  }

  /**
   * Returns all CPT code categories.
   */
  getCPTCategories(): string[] {
    const categories = new Set(CPT_DATABASE.map(c => c.category));
    return Array.from(categories).sort();
  }

  /**
   * Returns the full CPT database.
   */
  getAllCPTCodes(): CPTCode[] {
    return [...CPT_DATABASE];
  }

  /**
   * Looks up an ICD-10 code by code string.
   */
  lookupICD10Code(code: string): ICD10Code | null {
    return ICD10_DATABASE.find(c => c.code === code) ?? null;
  }

  /**
   * Searches ICD-10 codes by keyword in description.
   */
  searchICD10Codes(keyword: string): ICD10Code[] {
    const lower = keyword.toLowerCase();
    return ICD10_DATABASE.filter(
      c => c.description.toLowerCase().includes(lower) ||
           c.code.toLowerCase().includes(lower) ||
           c.category.toLowerCase().includes(lower)
    );
  }

  /**
   * Returns ICD-10 codes by category.
   */
  getICD10CodesByCategory(category: string): ICD10Code[] {
    return ICD10_DATABASE.filter(c => c.category === category);
  }

  /**
   * Returns all ICD-10 code categories.
   */
  getICD10Categories(): string[] {
    const categories = new Set(ICD10_DATABASE.map(c => c.category));
    return Array.from(categories).sort();
  }

  /**
   * Returns the full ICD-10 database.
   */
  getAllICD10Codes(): ICD10Code[] {
    return [...ICD10_DATABASE];
  }

  /**
   * Suggests CPT codes based on a visit type.
   */
  suggestCPTCodesForVisitType(visitType: VisitType): CPTCode[] {
    const codes = VISIT_TYPE_CPT_MAP[visitType] ?? [];
    return codes
      .map(code => this.lookupCPTCode(code))
      .filter((c): c is CPTCode => c !== null);
  }

  // ==========================================================================
  // Claims Processing
  // ==========================================================================

  /**
   * Auto-generates a claim from a completed appointment.
   */
  generateClaimFromAppointment(appointment: AppointmentForClaim): InsuranceClaim {
    const profiles = this.getActiveInsuranceProfiles(appointment.patientId);
    if (profiles.length === 0) {
      throw new Error('No active insurance profile found for patient');
    }
    const primaryProfile = profiles[0];

    // Determine CPT codes from visit type and any specified procedure codes
    const suggestedCPTs = appointment.procedureCodes.length > 0
      ? appointment.procedureCodes
      : (VISIT_TYPE_CPT_MAP[appointment.visitType] ?? ['99213']);

    // Build line items
    const lineItems: ClaimLineItem[] = suggestedCPTs.map((cptCode, _index) => {
      const cptInfo = this.lookupCPTCode(cptCode);
      const chargeAmount = cptInfo?.averageCost ?? 100;

      return {
        id: generateId('li'),
        cptCode,
        cptDescription: cptInfo?.description ?? 'Unknown procedure',
        icd10Codes: appointment.diagnosisCodes.length > 0
          ? appointment.diagnosisCodes
          : ['Z09'],
        units: 1,
        chargeAmount,
        allowedAmount: 0,
        paidAmount: 0,
        patientResponsibility: 0,
        adjustmentAmount: 0,
        adjustmentReason: '',
      };
    });

    const totalCharged = lineItems.reduce((sum, li) => sum + li.chargeAmount * li.units, 0);

    const now = new Date().toISOString();
    const claim: InsuranceClaim = {
      id: generateId('clm'),
      patientId: appointment.patientId,
      insuranceProfileId: primaryProfile.id,
      appointmentId: appointment.id,
      claimNumber: generateClaimNumber(),
      dateOfService: appointment.dateOfService,
      dateSubmitted: null,
      dateProcessed: null,
      providerName: appointment.providerName,
      providerNPI: appointment.providerNPI,
      facilityName: appointment.facilityName,
      visitType: appointment.visitType,
      status: ClaimStatus.DRAFT,
      lineItems,
      totalCharged,
      totalAllowed: 0,
      totalPaid: 0,
      patientResponsibility: 0,
      networkStatus: NetworkStatus.IN_NETWORK,
      preAuthNumber: null,
      notes: appointment.notes,
      denialReason: null,
      appealDeadline: null,
      eob: null,
      createdAt: now,
      updatedAt: now,
    };

    const claims = loadFromStorage<InsuranceClaim>(STORAGE_KEYS.CLAIMS);
    claims.push(claim);
    saveToStorage(STORAGE_KEYS.CLAIMS, claims);

    console.log(`[InsuranceClaims] Generated claim ${claim.claimNumber} from appointment ${appointment.id}`);
    return claim;
  }

  /**
   * Submits a claim for processing.
   */
  submitClaim(claimId: string): InsuranceClaim {
    return this.updateClaimStatus(claimId, ClaimStatus.SUBMITTED, {
      dateSubmitted: new Date().toISOString(),
    });
  }

  /**
   * Simulates processing a claim (adjudication).
   * Calculates allowed amounts, insurance payments, and patient responsibility.
   */
  processClaim(claimId: string): InsuranceClaim {
    const claims = loadFromStorage<InsuranceClaim>(STORAGE_KEYS.CLAIMS);
    const index = claims.findIndex(c => c.id === claimId);
    if (index === -1) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    const claim = claims[index];
    const profile = this.getInsuranceProfileById(claim.insuranceProfileId);
    if (!profile) {
      throw new Error(`Insurance profile not found: ${claim.insuranceProfileId}`);
    }

    const benefits = claim.networkStatus === NetworkStatus.IN_NETWORK
      ? profile.benefits.inNetwork
      : profile.benefits.outOfNetwork;

    // Calculate allowed amounts and patient responsibility for each line item
    let totalAllowed = 0;
    let totalPaid = 0;
    let totalPatientResponsibility = 0;
    let remainingDeductible = benefits.annualDeductible - benefits.deductibleMet;
    let remainingOOP = benefits.outOfPocketMax - benefits.outOfPocketMet;

    const processedLineItems = claim.lineItems.map(li => {
      // Allowed amount is typically a percentage of charge (in-network discount)
      const allowedRate = claim.networkStatus === NetworkStatus.IN_NETWORK ? 0.80 : 0.60;
      const allowedAmount = Math.round(li.chargeAmount * allowedRate * 100) / 100;
      const adjustmentAmount = Math.round((li.chargeAmount - allowedAmount) * 100) / 100;

      let patientPortion = 0;
      let insurancePortion = 0;

      // Apply deductible first
      if (remainingDeductible > 0) {
        const deductibleApplied = Math.min(allowedAmount, remainingDeductible);
        remainingDeductible -= deductibleApplied;
        patientPortion += deductibleApplied;
        const afterDeductible = allowedAmount - deductibleApplied;

        // Apply coinsurance on remainder
        if (afterDeductible > 0) {
          const coinsurance = Math.round(afterDeductible * (benefits.coinsurancePercent / 100) * 100) / 100;
          patientPortion += coinsurance;
          insurancePortion = afterDeductible - coinsurance;
        }
      } else {
        // Apply copay or coinsurance
        if (benefits.copay > 0 && li === claim.lineItems[0]) {
          patientPortion = Math.min(benefits.copay, allowedAmount);
          insurancePortion = allowedAmount - patientPortion;
        } else {
          const coinsurance = Math.round(allowedAmount * (benefits.coinsurancePercent / 100) * 100) / 100;
          patientPortion = coinsurance;
          insurancePortion = allowedAmount - coinsurance;
        }
      }

      // Cap at out-of-pocket max
      if (patientPortion > remainingOOP) {
        insurancePortion += patientPortion - remainingOOP;
        patientPortion = remainingOOP;
      }
      remainingOOP -= patientPortion;

      patientPortion = Math.round(patientPortion * 100) / 100;
      insurancePortion = Math.round(insurancePortion * 100) / 100;

      totalAllowed += allowedAmount;
      totalPaid += insurancePortion;
      totalPatientResponsibility += patientPortion;

      return {
        ...li,
        allowedAmount,
        paidAmount: insurancePortion,
        patientResponsibility: patientPortion,
        adjustmentAmount,
        adjustmentReason: adjustmentAmount > 0 ? 'Contractual adjustment' : '',
      };
    });

    // Update deductible met and OOP met on the profile
    const newDeductibleMet = benefits.annualDeductible - remainingDeductible;
    const newOOPMet = benefits.outOfPocketMax - remainingOOP;

    if (claim.networkStatus === NetworkStatus.IN_NETWORK) {
      profile.benefits.inNetwork.deductibleMet = Math.round(newDeductibleMet * 100) / 100;
      profile.benefits.inNetwork.outOfPocketMet = Math.round(newOOPMet * 100) / 100;
    } else {
      profile.benefits.outOfNetwork.deductibleMet = Math.round(newDeductibleMet * 100) / 100;
      profile.benefits.outOfNetwork.outOfPocketMet = Math.round(newOOPMet * 100) / 100;
    }
    this.updateInsuranceProfile(profile.id, { benefits: profile.benefits });

    // Generate EOB
    const eob = this.generateEOB(claim, processedLineItems, totalAllowed, totalPaid, totalPatientResponsibility, benefits);

    const now = new Date().toISOString();
    claims[index] = {
      ...claim,
      status: ClaimStatus.APPROVED,
      lineItems: processedLineItems,
      totalAllowed: Math.round(totalAllowed * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      patientResponsibility: Math.round(totalPatientResponsibility * 100) / 100,
      dateProcessed: now,
      eob,
      updatedAt: now,
    };

    saveToStorage(STORAGE_KEYS.CLAIMS, claims);
    console.log(`[InsuranceClaims] Processed claim ${claim.claimNumber}: ` +
      `paid=$${totalPaid.toFixed(2)}, patient=$${totalPatientResponsibility.toFixed(2)}`);
    return claims[index];
  }

  /**
   * Denies a claim with a reason.
   */
  denyClaim(claimId: string, reason: string): InsuranceClaim {
    const appealDeadline = new Date();
    appealDeadline.setDate(appealDeadline.getDate() + 180);

    return this.updateClaimStatus(claimId, ClaimStatus.DENIED, {
      denialReason: reason,
      appealDeadline: appealDeadline.toISOString(),
      dateProcessed: new Date().toISOString(),
    });
  }

  /**
   * Files an appeal for a denied claim.
   */
  appealClaim(claimId: string, appealNotes: string): InsuranceClaim {
    const claims = loadFromStorage<InsuranceClaim>(STORAGE_KEYS.CLAIMS);
    const claim = claims.find(c => c.id === claimId);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }
    if (claim.status !== ClaimStatus.DENIED) {
      throw new Error(`Only denied claims can be appealed. Current status: ${claim.status}`);
    }
    if (claim.appealDeadline && new Date(claim.appealDeadline) < new Date()) {
      throw new Error('Appeal deadline has passed');
    }

    return this.updateClaimStatus(claimId, ClaimStatus.APPEALED, {
      notes: `${claim.notes}\n[APPEAL] ${appealNotes}`,
    });
  }

  /**
   * Retrieves all claims for a patient.
   */
  getClaims(patientId: string): InsuranceClaim[] {
    return loadFromStorage<InsuranceClaim>(STORAGE_KEYS.CLAIMS)
      .filter(c => c.patientId === patientId)
      .sort((a, b) => new Date(b.dateOfService).getTime() - new Date(a.dateOfService).getTime());
  }

  /**
   * Retrieves a claim by ID.
   */
  getClaimById(claimId: string): InsuranceClaim | null {
    return loadFromStorage<InsuranceClaim>(STORAGE_KEYS.CLAIMS)
      .find(c => c.id === claimId) ?? null;
  }

  /**
   * Retrieves claims by status.
   */
  getClaimsByStatus(patientId: string, status: ClaimStatus): InsuranceClaim[] {
    return this.getClaims(patientId).filter(c => c.status === status);
  }

  /**
   * Gets the EOB for a specific claim.
   */
  getEOB(claimId: string): ExplanationOfBenefits | null {
    const claim = this.getClaimById(claimId);
    return claim?.eob ?? null;
  }

  // ==========================================================================
  // Cost Estimation
  // ==========================================================================

  /**
   * Estimates out-of-pocket cost for an upcoming procedure.
   */
  estimateCost(
    patientId: string,
    procedureCode: string,
    networkStatus: NetworkStatus = NetworkStatus.IN_NETWORK
  ): CostEstimate {
    const profiles = this.getActiveInsuranceProfiles(patientId);
    if (profiles.length === 0) {
      throw new Error('No active insurance profile found for patient');
    }
    const profile = profiles[0];
    const cptInfo = this.lookupCPTCode(procedureCode);

    const estimatedTotalCost = cptInfo?.averageCost ?? 0;
    const benefits = networkStatus === NetworkStatus.IN_NETWORK
      ? profile.benefits.inNetwork
      : profile.benefits.outOfNetwork;

    const notes: string[] = [];

    // Calculate allowed amount (network discount)
    const allowedRate = networkStatus === NetworkStatus.IN_NETWORK ? 0.80 : 0.60;
    const allowedAmount = Math.round(estimatedTotalCost * allowedRate * 100) / 100;

    let remainingDeductible = Math.max(0, benefits.annualDeductible - benefits.deductibleMet);
    let remainingOOP = Math.max(0, benefits.outOfPocketMax - benefits.outOfPocketMet);
    let appliedToDeductible = 0;
    let copayAmount = 0;
    let coinsuranceAmount = 0;
    let patientCost = 0;
    let insuranceCoverage = 0;

    if (remainingOOP <= 0) {
      // Patient has met out-of-pocket max
      insuranceCoverage = allowedAmount;
      patientCost = 0;
      notes.push('Out-of-pocket maximum has been met. No additional patient cost.');
    } else if (remainingDeductible > 0) {
      // Apply to deductible first
      appliedToDeductible = Math.min(allowedAmount, remainingDeductible);
      const afterDeductible = allowedAmount - appliedToDeductible;

      if (afterDeductible > 0) {
        coinsuranceAmount = Math.round(afterDeductible * (benefits.coinsurancePercent / 100) * 100) / 100;
        insuranceCoverage = afterDeductible - coinsuranceAmount;
      }

      patientCost = appliedToDeductible + coinsuranceAmount;
      if (patientCost > remainingOOP) {
        patientCost = remainingOOP;
        insuranceCoverage = allowedAmount - patientCost;
        notes.push('Patient cost capped at remaining out-of-pocket maximum.');
      }

      notes.push(`$${remainingDeductible.toFixed(2)} remaining on deductible before this procedure.`);
    } else {
      // Deductible met, apply copay/coinsurance
      if (benefits.copay > 0) {
        copayAmount = Math.min(benefits.copay, allowedAmount);
        insuranceCoverage = allowedAmount - copayAmount;
        patientCost = copayAmount;
        notes.push('Deductible has been met. Copay applies.');
      } else {
        coinsuranceAmount = Math.round(allowedAmount * (benefits.coinsurancePercent / 100) * 100) / 100;
        insuranceCoverage = allowedAmount - coinsuranceAmount;
        patientCost = coinsuranceAmount;
        notes.push('Deductible has been met. Coinsurance applies.');
      }

      if (patientCost > remainingOOP) {
        patientCost = remainingOOP;
        insuranceCoverage = allowedAmount - patientCost;
        notes.push('Patient cost capped at remaining out-of-pocket maximum.');
      }
    }

    const isPreAuthRequired = cptInfo?.requiresPreAuth ?? false;
    if (isPreAuthRequired) {
      notes.push('Pre-authorization is required for this procedure.');
    }

    if (networkStatus === NetworkStatus.OUT_OF_NETWORK) {
      notes.push('Out-of-network rates applied. You may owe additional balance billing.');
    }

    return {
      procedureCode,
      procedureDescription: cptInfo?.description ?? 'Unknown procedure',
      estimatedTotalCost,
      insuranceCoverage: Math.round(insuranceCoverage * 100) / 100,
      appliedToDeductible: Math.round(appliedToDeductible * 100) / 100,
      copayAmount: Math.round(copayAmount * 100) / 100,
      coinsuranceAmount: Math.round(coinsuranceAmount * 100) / 100,
      estimatedPatientCost: Math.round(patientCost * 100) / 100,
      remainingDeductible: Math.round(Math.max(0, remainingDeductible - appliedToDeductible) * 100) / 100,
      remainingOutOfPocket: Math.round(Math.max(0, remainingOOP - patientCost) * 100) / 100,
      networkStatus,
      notes,
      isPreAuthRequired,
    };
  }

  /**
   * Gets deductible and out-of-pocket progress for a patient.
   */
  getDeductibleProgress(patientId: string): DeductibleProgress | null {
    const profiles = this.getActiveInsuranceProfiles(patientId);
    if (profiles.length === 0) return null;

    const profile = profiles[0];
    const planYear = new Date().getFullYear().toString();
    const inNet = profile.benefits.inNetwork;
    const outNet = profile.benefits.outOfNetwork;

    return {
      planYear,
      inNetwork: {
        deductible: inNet.annualDeductible,
        met: inNet.deductibleMet,
        remaining: Math.max(0, inNet.annualDeductible - inNet.deductibleMet),
        percentMet: inNet.annualDeductible > 0
          ? Math.round((inNet.deductibleMet / inNet.annualDeductible) * 10000) / 100
          : 100,
      },
      outOfNetwork: {
        deductible: outNet.annualDeductible,
        met: outNet.deductibleMet,
        remaining: Math.max(0, outNet.annualDeductible - outNet.deductibleMet),
        percentMet: outNet.annualDeductible > 0
          ? Math.round((outNet.deductibleMet / outNet.annualDeductible) * 10000) / 100
          : 100,
      },
      outOfPocket: {
        max: inNet.outOfPocketMax,
        met: inNet.outOfPocketMet,
        remaining: Math.max(0, inNet.outOfPocketMax - inNet.outOfPocketMet),
        percentMet: inNet.outOfPocketMax > 0
          ? Math.round((inNet.outOfPocketMet / inNet.outOfPocketMax) * 10000) / 100
          : 100,
      },
    };
  }

  /**
   * Calculates remaining benefits for a specific coverage type.
   */
  getRemainingBenefits(patientId: string, network: NetworkStatus = NetworkStatus.IN_NETWORK): {
    remainingDeductible: number;
    remainingOutOfPocket: number;
    deductiblePercentMet: number;
    oopPercentMet: number;
  } | null {
    const profiles = this.getActiveInsuranceProfiles(patientId);
    if (profiles.length === 0) return null;

    const profile = profiles[0];
    const benefits = network === NetworkStatus.IN_NETWORK
      ? profile.benefits.inNetwork
      : profile.benefits.outOfNetwork;

    const remainingDeductible = Math.max(0, benefits.annualDeductible - benefits.deductibleMet);
    const remainingOOP = Math.max(0, benefits.outOfPocketMax - benefits.outOfPocketMet);

    return {
      remainingDeductible,
      remainingOutOfPocket: remainingOOP,
      deductiblePercentMet: benefits.annualDeductible > 0
        ? Math.round((benefits.deductibleMet / benefits.annualDeductible) * 10000) / 100
        : 100,
      oopPercentMet: benefits.outOfPocketMax > 0
        ? Math.round((benefits.outOfPocketMet / benefits.outOfPocketMax) * 10000) / 100
        : 100,
    };
  }

  /**
   * Compares medication costs between generic and brand name.
   */
  compareMedicationCosts(
    patientId: string,
    medicationName: string,
    brandName: string,
    brandCost: number,
    genericName: string,
    genericCost: number,
    tierLevel: number = 2,
    requiresPriorAuth: boolean = false,
  ): MedicationCostComparison {
    const profiles = this.getActiveInsuranceProfiles(patientId);

    // Default copay tiers
    const tierCopays: Record<number, number> = {
      1: 10,  // generic preferred
      2: 25,  // generic
      3: 50,  // brand preferred
      4: 80,  // brand non-preferred
      5: 150, // specialty
    };

    const isCovered = profiles.length > 0;
    const brandCopay = isCovered ? (tierCopays[tierLevel + 1] ?? tierCopays[4]) : brandCost;
    const genericCopay = isCovered ? (tierCopays[tierLevel] ?? tierCopays[2]) : genericCost;

    return {
      medicationName,
      brandName,
      brandCost,
      brandCopay: Math.min(brandCopay, brandCost),
      genericName,
      genericCost,
      genericCopay: Math.min(genericCopay, genericCost),
      savings: Math.round((Math.min(brandCopay, brandCost) - Math.min(genericCopay, genericCost)) * 100) / 100,
      isCovered,
      tierLevel,
      requiresPriorAuth,
    };
  }

  // ==========================================================================
  // Billing Dashboard
  // ==========================================================================

  /**
   * Gets the outstanding balance for a patient across all claims.
   */
  getOutstandingBalance(patientId: string): {
    totalOutstanding: number;
    claimBreakdown: Array<{ claimId: string; claimNumber: string; amount: number; dateOfService: string }>;
  } {
    const claims = this.getClaims(patientId).filter(
      c => c.status === ClaimStatus.APPROVED ||
           c.status === ClaimStatus.PARTIALLY_APPROVED ||
           c.status === ClaimStatus.PAID
    );

    const payments = loadFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
      .filter(p => p.patientId === patientId && p.status === PaymentStatus.COMPLETED);

    const claimBreakdown = claims.map(claim => {
      const claimPayments = payments
        .filter(p => p.claimId === claim.id)
        .reduce((sum, p) => sum + p.amount, 0);

      const outstanding = Math.max(0, claim.patientResponsibility - claimPayments);
      return {
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        amount: Math.round(outstanding * 100) / 100,
        dateOfService: claim.dateOfService,
      };
    }).filter(item => item.amount > 0);

    const totalOutstanding = claimBreakdown.reduce((sum, item) => sum + item.amount, 0);

    return {
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      claimBreakdown,
    };
  }

  /**
   * Records a payment from a patient.
   */
  recordPayment(
    patientId: string,
    claimId: string | null,
    amount: number,
    method: PaymentMethod,
    description: string = ''
  ): Payment {
    const payment: Payment = {
      id: generateId('pay'),
      patientId,
      claimId,
      amount,
      method,
      status: PaymentStatus.COMPLETED,
      transactionId: generateTransactionId(),
      date: new Date().toISOString(),
      description,
    };

    const payments = loadFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    payments.push(payment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);

    console.log(`[InsuranceClaims] Recorded payment ${payment.id}: $${amount.toFixed(2)} via ${method}`);

    // Update claim status if fully paid
    if (claimId) {
      const claim = this.getClaimById(claimId);
      if (claim) {
        const totalPaid = this.getPaymentsForClaim(claimId)
          .reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid >= claim.patientResponsibility) {
          this.updateClaimStatus(claimId, ClaimStatus.PAID);
        }
      }
    }

    return payment;
  }

  /**
   * Gets payment history for a patient.
   */
  getPaymentHistory(patientId: string): Payment[] {
    return loadFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
      .filter(p => p.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Gets payments for a specific claim.
   */
  getPaymentsForClaim(claimId: string): Payment[] {
    return loadFromStorage<Payment>(STORAGE_KEYS.PAYMENTS)
      .filter(p => p.claimId === claimId && p.status === PaymentStatus.COMPLETED);
  }

  /**
   * Creates a payment plan for a patient.
   */
  createPaymentPlan(
    patientId: string,
    totalAmount: number,
    numberOfPayments: number
  ): PaymentPlan {
    if (numberOfPayments < 2 || numberOfPayments > 60) {
      throw new Error('Number of payments must be between 2 and 60');
    }
    if (totalAmount <= 0) {
      throw new Error('Total amount must be positive');
    }

    const monthlyPayment = Math.round((totalAmount / numberOfPayments) * 100) / 100;
    const startDate = new Date();
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + numberOfPayments);

    const plan: PaymentPlan = {
      id: generateId('pp'),
      patientId,
      totalAmount,
      remainingAmount: totalAmount,
      monthlyPayment,
      numberOfPayments,
      paymentsCompleted: 0,
      startDate: startDate.toISOString(),
      nextPaymentDate: nextPaymentDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
      payments: [],
      createdAt: new Date().toISOString(),
    };

    const plans = loadFromStorage<PaymentPlan>(STORAGE_KEYS.PAYMENT_PLANS);
    plans.push(plan);
    saveToStorage(STORAGE_KEYS.PAYMENT_PLANS, plans);

    console.log(
      `[InsuranceClaims] Created payment plan ${plan.id}: ` +
      `$${totalAmount.toFixed(2)} over ${numberOfPayments} payments ($${monthlyPayment.toFixed(2)}/mo)`
    );
    return plan;
  }

  /**
   * Makes a payment on a payment plan.
   */
  makePaymentPlanPayment(planId: string, method: PaymentMethod): Payment {
    const plans = loadFromStorage<PaymentPlan>(STORAGE_KEYS.PAYMENT_PLANS);
    const index = plans.findIndex(p => p.id === planId);
    if (index === -1) {
      throw new Error(`Payment plan not found: ${planId}`);
    }

    const plan = plans[index];
    if (!plan.isActive) {
      throw new Error('Payment plan is no longer active');
    }
    if (plan.paymentsCompleted >= plan.numberOfPayments) {
      throw new Error('All payments have already been completed');
    }

    // For the last payment, pay the exact remaining amount to avoid rounding issues
    const isLastPayment = plan.paymentsCompleted + 1 === plan.numberOfPayments;
    const paymentAmount = isLastPayment ? plan.remainingAmount : plan.monthlyPayment;

    const payment = this.recordPayment(
      plan.patientId,
      null,
      paymentAmount,
      method,
      `Payment plan installment ${plan.paymentsCompleted + 1}/${plan.numberOfPayments}`
    );

    plan.payments.push(payment);
    plan.paymentsCompleted += 1;
    plan.remainingAmount = Math.round((plan.remainingAmount - paymentAmount) * 100) / 100;

    if (plan.paymentsCompleted >= plan.numberOfPayments) {
      plan.isActive = false;
      plan.remainingAmount = 0;
    } else {
      const nextDate = new Date(plan.nextPaymentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      plan.nextPaymentDate = nextDate.toISOString();
    }

    plans[index] = plan;
    saveToStorage(STORAGE_KEYS.PAYMENT_PLANS, plans);

    console.log(
      `[InsuranceClaims] Payment plan ${planId}: installment ${plan.paymentsCompleted}/${plan.numberOfPayments} complete`
    );
    return payment;
  }

  /**
   * Gets all payment plans for a patient.
   */
  getPaymentPlans(patientId: string): PaymentPlan[] {
    return loadFromStorage<PaymentPlan>(STORAGE_KEYS.PAYMENT_PLANS)
      .filter(p => p.patientId === patientId);
  }

  /**
   * Gets active payment plans for a patient.
   */
  getActivePaymentPlans(patientId: string): PaymentPlan[] {
    return this.getPaymentPlans(patientId).filter(p => p.isActive);
  }

  /**
   * Generates an itemized billing statement for a patient.
   */
  generateBillingStatement(patientId: string): BillingStatement {
    const claims = this.getClaims(patientId).filter(
      c => c.status === ClaimStatus.APPROVED ||
           c.status === ClaimStatus.PARTIALLY_APPROVED ||
           c.status === ClaimStatus.PAID
    );
    const payments = this.getPaymentHistory(patientId);

    const lineItems: BillingLineItem[] = [];
    let totalCharges = 0;
    let insurancePayments = 0;
    let adjustments = 0;
    let patientPayments = 0;

    for (const claim of claims) {
      const claimPayments = payments
        .filter(p => p.claimId === claim.id)
        .reduce((sum, p) => sum + p.amount, 0);

      for (const li of claim.lineItems) {
        const lineItem: BillingLineItem = {
          date: claim.dateOfService,
          description: li.cptDescription,
          cptCode: li.cptCode,
          charges: li.chargeAmount * li.units,
          insurancePaid: li.paidAmount,
          adjustment: li.adjustmentAmount,
          patientPaid: 0,
          balance: li.patientResponsibility,
        };

        totalCharges += lineItem.charges;
        insurancePayments += lineItem.insurancePaid;
        adjustments += lineItem.adjustment;
        lineItems.push(lineItem);
      }

      patientPayments += claimPayments;
    }

    // Also include non-claim payments (payment plan installments, etc.)
    const nonClaimPayments = payments
      .filter(p => !p.claimId)
      .reduce((sum, p) => sum + p.amount, 0);
    patientPayments += nonClaimPayments;

    const balanceDue = Math.round(
      (totalCharges - insurancePayments - adjustments - patientPayments) * 100
    ) / 100;

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    return {
      id: generateId('stmt'),
      patientId,
      statementDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      lineItems,
      totalCharges: Math.round(totalCharges * 100) / 100,
      insurancePayments: Math.round(insurancePayments * 100) / 100,
      adjustments: Math.round(adjustments * 100) / 100,
      patientPayments: Math.round(patientPayments * 100) / 100,
      balanceDue: Math.max(0, balanceDue),
      previousBalance: 0,
      currentCharges: Math.round(totalCharges * 100) / 100,
    };
  }

  // ==========================================================================
  // Pre-Authorization Management
  // ==========================================================================

  /**
   * Checks if a procedure requires pre-authorization.
   */
  requiresPreAuthorization(procedureCode: string): boolean {
    const cpt = this.lookupCPTCode(procedureCode);
    return cpt?.requiresPreAuth ?? false;
  }

  /**
   * Auto-detects which procedures in a list require pre-authorization.
   */
  detectPreAuthRequirements(procedureCodes: string[]): Array<{
    code: string;
    description: string;
    requiresPreAuth: boolean;
  }> {
    return procedureCodes.map(code => {
      const cpt = this.lookupCPTCode(code);
      return {
        code,
        description: cpt?.description ?? 'Unknown procedure',
        requiresPreAuth: cpt?.requiresPreAuth ?? false,
      };
    });
  }

  /**
   * Creates a pre-authorization request.
   */
  createPreAuthorization(
    patientId: string,
    insuranceProfileId: string,
    data: {
      procedureCptCode: string;
      icd10Codes: string[];
      providerName: string;
      facilityName: string;
      clinicalNotes: string;
      supportingDocuments?: string[];
    }
  ): PreAuthorization {
    const cpt = this.lookupCPTCode(data.procedureCptCode);
    const now = new Date().toISOString();

    const preAuth: PreAuthorization = {
      id: generateId('pa'),
      patientId,
      insuranceProfileId,
      authorizationNumber: null,
      procedureCptCode: data.procedureCptCode,
      procedureDescription: cpt?.description ?? 'Unknown procedure',
      icd10Codes: data.icd10Codes,
      requestedDate: now,
      approvedDate: null,
      expirationDate: null,
      status: PreAuthStatus.PENDING,
      approvedUnits: null,
      usedUnits: 0,
      providerName: data.providerName,
      facilityName: data.facilityName,
      clinicalNotes: data.clinicalNotes,
      supportingDocuments: data.supportingDocuments ?? [],
      denialReason: null,
      createdAt: now,
      updatedAt: now,
    };

    const preAuths = loadFromStorage<PreAuthorization>(STORAGE_KEYS.PRE_AUTHORIZATIONS);
    preAuths.push(preAuth);
    saveToStorage(STORAGE_KEYS.PRE_AUTHORIZATIONS, preAuths);

    console.log(`[InsuranceClaims] Created pre-auth request ${preAuth.id} for ${data.procedureCptCode}`);
    return preAuth;
  }

  /**
   * Submits a pre-authorization request to the insurance company.
   */
  submitPreAuthorization(preAuthId: string): PreAuthorization {
    return this.updatePreAuthStatus(preAuthId, PreAuthStatus.SUBMITTED);
  }

  /**
   * Approves a pre-authorization with units and expiration.
   */
  approvePreAuthorization(
    preAuthId: string,
    approvedUnits: number,
    expirationDays: number = 90
  ): PreAuthorization {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    return this.updatePreAuthStatus(preAuthId, PreAuthStatus.APPROVED, {
      authorizationNumber: generateAuthNumber(),
      approvedUnits,
      approvedDate: new Date().toISOString(),
      expirationDate: expirationDate.toISOString(),
    });
  }

  /**
   * Denies a pre-authorization with a reason.
   */
  denyPreAuthorization(preAuthId: string, reason: string): PreAuthorization {
    return this.updatePreAuthStatus(preAuthId, PreAuthStatus.DENIED, {
      denialReason: reason,
    });
  }

  /**
   * Records usage against a pre-authorization.
   */
  recordPreAuthUsage(preAuthId: string, units: number = 1): PreAuthorization {
    const preAuths = loadFromStorage<PreAuthorization>(STORAGE_KEYS.PRE_AUTHORIZATIONS);
    const index = preAuths.findIndex(pa => pa.id === preAuthId);
    if (index === -1) {
      throw new Error(`Pre-authorization not found: ${preAuthId}`);
    }

    const preAuth = preAuths[index];
    if (preAuth.status !== PreAuthStatus.APPROVED) {
      throw new Error(`Pre-authorization is not approved. Status: ${preAuth.status}`);
    }
    if (preAuth.expirationDate && new Date(preAuth.expirationDate) < new Date()) {
      preAuths[index] = { ...preAuth, status: PreAuthStatus.EXPIRED, updatedAt: new Date().toISOString() };
      saveToStorage(STORAGE_KEYS.PRE_AUTHORIZATIONS, preAuths);
      throw new Error('Pre-authorization has expired');
    }
    if (preAuth.approvedUnits !== null && preAuth.usedUnits + units > preAuth.approvedUnits) {
      throw new Error(
        `Insufficient pre-auth units. Approved: ${preAuth.approvedUnits}, ` +
        `Used: ${preAuth.usedUnits}, Requested: ${units}`
      );
    }

    preAuths[index] = {
      ...preAuth,
      usedUnits: preAuth.usedUnits + units,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.PRE_AUTHORIZATIONS, preAuths);

    console.log(`[InsuranceClaims] Recorded ${units} unit(s) against pre-auth ${preAuthId}`);
    return preAuths[index];
  }

  /**
   * Gets all pre-authorizations for a patient.
   */
  getPreAuthorizations(patientId: string): PreAuthorization[] {
    return loadFromStorage<PreAuthorization>(STORAGE_KEYS.PRE_AUTHORIZATIONS)
      .filter(pa => pa.patientId === patientId)
      .sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
  }

  /**
   * Gets a pre-authorization by ID.
   */
  getPreAuthorizationById(preAuthId: string): PreAuthorization | null {
    return loadFromStorage<PreAuthorization>(STORAGE_KEYS.PRE_AUTHORIZATIONS)
      .find(pa => pa.id === preAuthId) ?? null;
  }

  /**
   * Gets active (approved, not expired) pre-authorizations.
   */
  getActivePreAuthorizations(patientId: string): PreAuthorization[] {
    const now = new Date();
    return this.getPreAuthorizations(patientId).filter(pa => {
      if (pa.status !== PreAuthStatus.APPROVED) return false;
      if (pa.expirationDate && new Date(pa.expirationDate) < now) return false;
      if (pa.approvedUnits !== null && pa.usedUnits >= pa.approvedUnits) return false;
      return true;
    });
  }

  /**
   * Gets alerts for pre-authorizations that are about to expire or have low remaining units.
   */
  getPreAuthAlerts(patientId: string): PreAuthAlert[] {
    const alerts: PreAuthAlert[] = [];
    const now = new Date();

    const preAuths = this.getPreAuthorizations(patientId).filter(
      pa => pa.status === PreAuthStatus.APPROVED
    );

    for (const pa of preAuths) {
      if (!pa.expirationDate) continue;

      const expDate = new Date(pa.expirationDate);
      const daysUntilExpiration = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const remainingUnits = pa.approvedUnits !== null
        ? pa.approvedUnits - pa.usedUnits
        : Infinity;

      // Already expired
      if (daysUntilExpiration <= 0) {
        alerts.push({
          preAuthId: pa.id,
          authorizationNumber: pa.authorizationNumber,
          procedureDescription: pa.procedureDescription,
          expirationDate: pa.expirationDate,
          daysUntilExpiration: 0,
          remainingUnits: remainingUnits === Infinity ? -1 : remainingUnits,
          alertLevel: 'critical',
          message: `Pre-authorization for "${pa.procedureDescription}" has expired. A new authorization is required.`,
        });
        continue;
      }

      // Expiring within 7 days
      if (daysUntilExpiration <= 7) {
        alerts.push({
          preAuthId: pa.id,
          authorizationNumber: pa.authorizationNumber,
          procedureDescription: pa.procedureDescription,
          expirationDate: pa.expirationDate,
          daysUntilExpiration,
          remainingUnits: remainingUnits === Infinity ? -1 : remainingUnits,
          alertLevel: 'critical',
          message: `Pre-authorization for "${pa.procedureDescription}" expires in ${daysUntilExpiration} day(s). Schedule procedure immediately or request extension.`,
        });
      }
      // Expiring within 30 days
      else if (daysUntilExpiration <= 30) {
        alerts.push({
          preAuthId: pa.id,
          authorizationNumber: pa.authorizationNumber,
          procedureDescription: pa.procedureDescription,
          expirationDate: pa.expirationDate,
          daysUntilExpiration,
          remainingUnits: remainingUnits === Infinity ? -1 : remainingUnits,
          alertLevel: 'warning',
          message: `Pre-authorization for "${pa.procedureDescription}" expires in ${daysUntilExpiration} days. Plan to schedule procedure soon.`,
        });
      }
      // Low remaining units
      else if (remainingUnits !== Infinity && remainingUnits <= 2) {
        alerts.push({
          preAuthId: pa.id,
          authorizationNumber: pa.authorizationNumber,
          procedureDescription: pa.procedureDescription,
          expirationDate: pa.expirationDate,
          daysUntilExpiration,
          remainingUnits,
          alertLevel: remainingUnits <= 1 ? 'warning' : 'info',
          message: `Pre-authorization for "${pa.procedureDescription}" has only ${remainingUnits} unit(s) remaining. Consider requesting additional units.`,
        });
      }
    }

    // Sort by severity: critical first, then warning, then info
    const levelOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => levelOrder[a.alertLevel] - levelOrder[b.alertLevel]);
  }

  /**
   * Prepares documentation needed for a pre-authorization request.
   */
  preparePreAuthDocumentation(
    patientId: string,
    procedureCode: string,
    diagnosisCodes: string[],
    clinicalJustification: string
  ): {
    procedureInfo: CPTCode | null;
    diagnoses: Array<{ code: string; description: string }>;
    requiredDocuments: string[];
    clinicalJustification: string;
    patientInsurance: InsuranceProfile | null;
    estimatedCost: CostEstimate | null;
  } {
    const profiles = this.getActiveInsuranceProfiles(patientId);
    const primaryProfile = profiles.length > 0 ? profiles[0] : null;
    const procedureInfo = this.lookupCPTCode(procedureCode);

    const diagnoses = diagnosisCodes.map(code => {
      const icd = this.lookupICD10Code(code);
      return {
        code,
        description: icd?.description ?? 'Unknown diagnosis',
      };
    });

    // Determine required documents based on procedure category
    const requiredDocuments: string[] = [
      'Patient demographics and insurance information',
      'Clinical notes supporting medical necessity',
      'Relevant imaging or lab results',
    ];

    if (procedureInfo) {
      if (procedureInfo.category.startsWith('Surgery')) {
        requiredDocuments.push(
          'Operative report or surgical plan',
          'Conservative treatment history (at least 6 weeks)',
          'Relevant imaging studies (X-ray, MRI, CT)',
          'Physical therapy records (if applicable)',
        );
      } else if (procedureInfo.category === 'Imaging') {
        requiredDocuments.push(
          'Clinical indication for advanced imaging',
          'Results of initial imaging (X-ray)',
          'Physical examination findings',
        );
      } else if (procedureInfo.category === 'Injection') {
        requiredDocuments.push(
          'History of conservative treatment failure',
          'Physical examination findings',
          'Prior injection history and outcomes',
        );
      } else if (procedureInfo.category === 'DME') {
        requiredDocuments.push(
          'Prescription with medical necessity documentation',
          'Functional limitation documentation',
          'Expected duration of use',
        );
      }
    }

    let estimatedCost: CostEstimate | null = null;
    try {
      estimatedCost = this.estimateCost(patientId, procedureCode);
    } catch {
      // If cost estimation fails (e.g., no insurance), leave as null
    }

    return {
      procedureInfo,
      diagnoses,
      requiredDocuments,
      clinicalJustification,
      patientInsurance: primaryProfile,
      estimatedCost,
    };
  }

  // ==========================================================================
  // Summary & Analytics
  // ==========================================================================

  /**
   * Returns a comprehensive billing summary for a patient.
   */
  getBillingSummary(patientId: string): {
    totalClaimed: number;
    totalApproved: number;
    totalDenied: number;
    totalPending: number;
    totalPatientResponsibility: number;
    totalPaidByPatient: number;
    outstandingBalance: number;
    claimCounts: Record<ClaimStatus, number>;
    activePreAuths: number;
    expiringPreAuths: number;
    hasPaymentPlan: boolean;
  } {
    const claims = this.getClaims(patientId);
    const payments = this.getPaymentHistory(patientId);
    const preAuthAlerts = this.getPreAuthAlerts(patientId);
    const activePlans = this.getActivePaymentPlans(patientId);

    const claimCounts = {} as Record<ClaimStatus, number>;
    for (const status of Object.values(ClaimStatus)) {
      claimCounts[status] = 0;
    }

    let totalClaimed = 0;
    let totalApproved = 0;
    let totalDenied = 0;
    let totalPending = 0;
    let totalPatientResponsibility = 0;

    for (const claim of claims) {
      claimCounts[claim.status] = (claimCounts[claim.status] || 0) + 1;
      totalClaimed += claim.totalCharged;

      switch (claim.status) {
        case ClaimStatus.APPROVED:
        case ClaimStatus.PARTIALLY_APPROVED:
        case ClaimStatus.PAID:
          totalApproved += claim.totalPaid;
          totalPatientResponsibility += claim.patientResponsibility;
          break;
        case ClaimStatus.DENIED:
        case ClaimStatus.APPEAL_DENIED:
          totalDenied += claim.totalCharged;
          break;
        case ClaimStatus.DRAFT:
        case ClaimStatus.SUBMITTED:
        case ClaimStatus.PROCESSING:
        case ClaimStatus.APPEALED:
          totalPending += claim.totalCharged;
          break;
      }
    }

    const totalPaidByPatient = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0);

    const outstandingBalance = Math.max(0, totalPatientResponsibility - totalPaidByPatient);
    const activePreAuths = this.getActivePreAuthorizations(patientId).length;
    const expiringPreAuths = preAuthAlerts.filter(
      a => a.alertLevel === 'critical' || a.alertLevel === 'warning'
    ).length;

    return {
      totalClaimed: Math.round(totalClaimed * 100) / 100,
      totalApproved: Math.round(totalApproved * 100) / 100,
      totalDenied: Math.round(totalDenied * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      totalPatientResponsibility: Math.round(totalPatientResponsibility * 100) / 100,
      totalPaidByPatient: Math.round(totalPaidByPatient * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      claimCounts,
      activePreAuths,
      expiringPreAuths,
      hasPaymentPlan: activePlans.length > 0,
    };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Generates an Explanation of Benefits for a processed claim.
   */
  private generateEOB(
    claim: InsuranceClaim,
    processedLineItems: ClaimLineItem[],
    totalAllowed: number,
    totalPaid: number,
    totalPatientResponsibility: number,
    benefits: CoverageDetails
  ): ExplanationOfBenefits {
    const eobLineItems: EOBLineItem[] = processedLineItems.map(li => {
      let status: EOBLineItemStatus;
      if (li.paidAmount >= li.allowedAmount) {
        status = EOBLineItemStatus.COVERED;
      } else if (li.paidAmount > 0) {
        status = EOBLineItemStatus.PARTIALLY_COVERED;
      } else if (li.patientResponsibility > 0 && li.paidAmount === 0) {
        status = EOBLineItemStatus.APPLIED_TO_DEDUCTIBLE;
      } else {
        status = EOBLineItemStatus.NOT_COVERED;
      }

      return {
        serviceDescription: li.cptDescription,
        cptCode: li.cptCode,
        billed: li.chargeAmount * li.units,
        allowed: li.allowedAmount,
        planPaid: li.paidAmount,
        youOwe: li.patientResponsibility,
        status,
        remark: li.adjustmentReason || '',
      };
    });

    const appliedToDeductible = processedLineItems.reduce((sum, li) => {
      if (li.paidAmount === 0 && li.patientResponsibility > 0) {
        return sum + li.patientResponsibility;
      }
      return sum;
    }, 0);

    const copayAmount = benefits.copay > 0
      ? Math.min(benefits.copay, totalAllowed)
      : 0;
    const coinsuranceAmount = Math.max(
      0,
      totalPatientResponsibility - appliedToDeductible - copayAmount
    );

    const remarks: string[] = [];
    if (appliedToDeductible > 0) {
      remarks.push(`$${appliedToDeductible.toFixed(2)} was applied to your annual deductible.`);
    }
    if (claim.networkStatus === NetworkStatus.OUT_OF_NETWORK) {
      remarks.push('Services were rendered by an out-of-network provider. Higher cost-sharing applies.');
    }
    remarks.push(
      'This is not a bill. You may receive a separate bill from your provider for any amount shown as "You Owe".'
    );

    return {
      id: generateId('eob'),
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      dateIssued: new Date().toISOString(),
      providerName: claim.providerName,
      dateOfService: claim.dateOfService,
      totalBilled: claim.totalCharged,
      allowedAmount: Math.round(totalAllowed * 100) / 100,
      planPaid: Math.round(totalPaid * 100) / 100,
      appliedToDeductible: Math.round(appliedToDeductible * 100) / 100,
      copayAmount: Math.round(copayAmount * 100) / 100,
      coinsuranceAmount: Math.round(coinsuranceAmount * 100) / 100,
      patientResponsibility: Math.round(totalPatientResponsibility * 100) / 100,
      lineItems: eobLineItems,
      remarks,
    };
  }

  /**
   * Updates claim status with optional additional fields.
   */
  private updateClaimStatus(
    claimId: string,
    status: ClaimStatus,
    additionalUpdates: Partial<InsuranceClaim> = {}
  ): InsuranceClaim {
    const claims = loadFromStorage<InsuranceClaim>(STORAGE_KEYS.CLAIMS);
    const index = claims.findIndex(c => c.id === claimId);
    if (index === -1) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    claims[index] = {
      ...claims[index],
      ...additionalUpdates,
      status,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.CLAIMS, claims);
    console.log(`[InsuranceClaims] Claim ${claims[index].claimNumber} status updated to ${status}`);
    return claims[index];
  }

  /**
   * Updates pre-authorization status with optional additional fields.
   */
  private updatePreAuthStatus(
    preAuthId: string,
    status: PreAuthStatus,
    additionalUpdates: Partial<PreAuthorization> = {}
  ): PreAuthorization {
    const preAuths = loadFromStorage<PreAuthorization>(STORAGE_KEYS.PRE_AUTHORIZATIONS);
    const index = preAuths.findIndex(pa => pa.id === preAuthId);
    if (index === -1) {
      throw new Error(`Pre-authorization not found: ${preAuthId}`);
    }

    preAuths[index] = {
      ...preAuths[index],
      ...additionalUpdates,
      status,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.PRE_AUTHORIZATIONS, preAuths);
    console.log(`[InsuranceClaims] Pre-auth ${preAuthId} status updated to ${status}`);
    return preAuths[index];
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const insuranceClaimsService = new InsuranceClaimsServiceImpl();
