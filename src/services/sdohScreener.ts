/**
 * Feature 36: Social Determinants of Health (SDOH) Screener
 *
 * Real PRAPARE and AHC HRSN screening tools, 5 SDOH domains,
 * ICD-10-CM Z-codes, resource referral matching, risk stratification,
 * community resource database, and self-learning.
 */

// ============================================================================
// Constants
// ============================================================================

export const SDOHDomain = {
  ECONOMIC_STABILITY: 'economic_stability',
  EDUCATION_ACCESS: 'education_access',
  SOCIAL_COMMUNITY: 'social_community',
  HEALTHCARE_ACCESS: 'healthcare_access',
  NEIGHBORHOOD_ENVIRONMENT: 'neighborhood_environment',
} as const;
export type SDOHDomain = typeof SDOHDomain[keyof typeof SDOHDomain];

export const ScreeningToolType = {
  PRAPARE: 'PRAPARE',
  AHC_HRSN: 'AHC_HRSN',
} as const;
export type ScreeningToolType = typeof ScreeningToolType[keyof typeof ScreeningToolType];

export const RiskLevel = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type RiskLevel = typeof RiskLevel[keyof typeof RiskLevel];

export const ResourceCategory = {
  FOOD_ASSISTANCE: 'food_assistance',
  HOUSING_ASSISTANCE: 'housing_assistance',
  UTILITY_ASSISTANCE: 'utility_assistance',
  TRANSPORTATION: 'transportation',
  EMPLOYMENT: 'employment',
  EDUCATION: 'education',
  HEALTH_INSURANCE: 'health_insurance',
  MENTAL_HEALTH: 'mental_health',
  SUBSTANCE_USE: 'substance_use',
  DOMESTIC_VIOLENCE: 'domestic_violence',
  LEGAL_AID: 'legal_aid',
  CHILDCARE: 'childcare',
  ELDER_CARE: 'elder_care',
  DISABILITY_SERVICES: 'disability_services',
  FINANCIAL_COUNSELING: 'financial_counseling',
  LANGUAGE_SERVICES: 'language_services',
  IMMIGRATION_SERVICES: 'immigration_services',
  SOCIAL_SUPPORT: 'social_support',
  PHYSICAL_ACTIVITY: 'physical_activity',
  PHARMACY_ASSISTANCE: 'pharmacy_assistance',
} as const;
export type ResourceCategory = typeof ResourceCategory[keyof typeof ResourceCategory];

export const InterventionStatus = {
  IDENTIFIED: 'identified',
  REFERRED: 'referred',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DECLINED: 'declined',
  UNSUCCESSFUL: 'unsuccessful',
} as const;
export type InterventionStatus = typeof InterventionStatus[keyof typeof InterventionStatus];

// ============================================================================
// Real ICD-10-CM Z-Codes for SDOH (Z55-Z65)
// ============================================================================

export const SDOH_Z_CODES: Record<string, { code: string; display: string; domain: SDOHDomain }> = {
  // Education and Literacy (Z55)
  ILLITERACY: { code: 'Z55.0', display: 'Illiteracy and low-level literacy', domain: SDOHDomain.EDUCATION_ACCESS },
  SCHOOLING_UNAVAILABLE: { code: 'Z55.1', display: 'Schooling unavailable and unattainable', domain: SDOHDomain.EDUCATION_ACCESS },
  FAILED_EXAMINATIONS: { code: 'Z55.2', display: 'Failed school examinations', domain: SDOHDomain.EDUCATION_ACCESS },
  UNDERACHIEVEMENT_SCHOOL: { code: 'Z55.3', display: 'Underachievement in school', domain: SDOHDomain.EDUCATION_ACCESS },
  EDUCATIONAL_MALADJUSTMENT: { code: 'Z55.4', display: 'Educational maladjustment and discord with teachers', domain: SDOHDomain.EDUCATION_ACCESS },
  LESS_THAN_HS: { code: 'Z55.5', display: 'Less than a high school diploma', domain: SDOHDomain.EDUCATION_ACCESS },
  EDUCATION_PROBLEMS_OTHER: { code: 'Z55.8', display: 'Other problems related to education and literacy', domain: SDOHDomain.EDUCATION_ACCESS },
  EDUCATION_PROBLEMS_UNSPECIFIED: { code: 'Z55.9', display: 'Problems related to education and literacy, unspecified', domain: SDOHDomain.EDUCATION_ACCESS },

  // Employment and Unemployment (Z56)
  UNEMPLOYMENT: { code: 'Z56.0', display: 'Unemployment, unspecified', domain: SDOHDomain.ECONOMIC_STABILITY },
  CHANGE_OF_JOB: { code: 'Z56.1', display: 'Change of job', domain: SDOHDomain.ECONOMIC_STABILITY },
  THREAT_OF_JOB_LOSS: { code: 'Z56.2', display: 'Threat of job loss', domain: SDOHDomain.ECONOMIC_STABILITY },
  STRESSFUL_WORK_SCHEDULE: { code: 'Z56.3', display: 'Stressful work schedule', domain: SDOHDomain.ECONOMIC_STABILITY },
  DISCORD_WITH_BOSS: { code: 'Z56.4', display: 'Discord with boss and workmates', domain: SDOHDomain.ECONOMIC_STABILITY },
  UNCONGENIAL_WORK: { code: 'Z56.5', display: 'Uncongenial work environment', domain: SDOHDomain.ECONOMIC_STABILITY },
  EMPLOYMENT_OTHER: { code: 'Z56.89', display: 'Other problems related to employment', domain: SDOHDomain.ECONOMIC_STABILITY },

  // Housing and Economic Circumstances (Z59)
  HOMELESSNESS: { code: 'Z59.00', display: 'Homelessness unspecified', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT },
  SHELTERED_HOMELESSNESS: { code: 'Z59.01', display: 'Sheltered homelessness', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT },
  UNSHELTERED_HOMELESSNESS: { code: 'Z59.02', display: 'Unsheltered homelessness', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT },
  INADEQUATE_HOUSING: { code: 'Z59.1', display: 'Inadequate housing', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT },
  DISCORD_WITH_NEIGHBORS: { code: 'Z59.2', display: 'Discord with neighbors, lodgers and landlord', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT },
  RESIDENTIAL_INSTITUTION: { code: 'Z59.3', display: 'Problems related to living in residential institution', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT },
  FOOD_INSECURITY: { code: 'Z59.41', display: 'Food insecurity', domain: SDOHDomain.ECONOMIC_STABILITY },
  HUNGER: { code: 'Z59.42', display: 'Insufficient quantity of food or water', domain: SDOHDomain.ECONOMIC_STABILITY },
  LOW_INCOME: { code: 'Z59.6', display: 'Low income', domain: SDOHDomain.ECONOMIC_STABILITY },
  INSUFFICIENT_INSURANCE: { code: 'Z59.7', display: 'Insufficient social insurance and welfare support', domain: SDOHDomain.HEALTHCARE_ACCESS },
  FINANCIAL_PROBLEM_OTHER: { code: 'Z59.89', display: 'Other problems related to housing and economic circumstances', domain: SDOHDomain.ECONOMIC_STABILITY },
  MATERIAL_HARDSHIP: { code: 'Z59.9', display: 'Problem related to housing and economic circumstances, unspecified', domain: SDOHDomain.ECONOMIC_STABILITY },

  // Social Environment (Z60)
  ADJUSTMENT_TO_TRANSITIONS: { code: 'Z60.0', display: 'Problems of adjustment to life-cycle transitions', domain: SDOHDomain.SOCIAL_COMMUNITY },
  ATYPICAL_PARENTING: { code: 'Z60.1', display: 'Atypical parenting situation', domain: SDOHDomain.SOCIAL_COMMUNITY },
  LIVING_ALONE: { code: 'Z60.2', display: 'Problems related to living alone', domain: SDOHDomain.SOCIAL_COMMUNITY },
  ACCULTURATION: { code: 'Z60.3', display: 'Acculturation difficulty', domain: SDOHDomain.SOCIAL_COMMUNITY },
  SOCIAL_EXCLUSION: { code: 'Z60.4', display: 'Social exclusion and rejection', domain: SDOHDomain.SOCIAL_COMMUNITY },
  TARGET_OF_DISCRIMINATION: { code: 'Z60.5', display: 'Target of (perceived) adverse discrimination and persecution', domain: SDOHDomain.SOCIAL_COMMUNITY },
  SOCIAL_ENVIRONMENT_OTHER: { code: 'Z60.8', display: 'Other problems related to social environment', domain: SDOHDomain.SOCIAL_COMMUNITY },
  SOCIAL_ISOLATION: { code: 'Z60.9', display: 'Problem related to social environment, unspecified', domain: SDOHDomain.SOCIAL_COMMUNITY },

  // Upbringing Issues (Z62)
  INADEQUATE_PARENTAL_SUPERVISION: { code: 'Z62.0', display: 'Inadequate parental supervision and control', domain: SDOHDomain.SOCIAL_COMMUNITY },
  PARENTAL_OVERPROTECTION: { code: 'Z62.1', display: 'Parental overprotection', domain: SDOHDomain.SOCIAL_COMMUNITY },
  INSTITUTIONAL_UPBRINGING: { code: 'Z62.22', display: 'Institutional upbringing', domain: SDOHDomain.SOCIAL_COMMUNITY },
  CHILD_IN_FOSTER_CARE: { code: 'Z62.21', display: 'Child in welfare custody', domain: SDOHDomain.SOCIAL_COMMUNITY },
  PARENT_CHILD_CONFLICT: { code: 'Z62.820', display: 'Parent-biological child conflict', domain: SDOHDomain.SOCIAL_COMMUNITY },

  // Psychosocial Circumstances (Z63)
  PROBLEMS_IN_RELATIONSHIP: { code: 'Z63.0', display: 'Problems in relationship with spouse or partner', domain: SDOHDomain.SOCIAL_COMMUNITY },
  FAMILY_DISRUPTION: { code: 'Z63.5', display: 'Disruption of family by separation and divorce', domain: SDOHDomain.SOCIAL_COMMUNITY },
  DEPENDENT_RELATIVE: { code: 'Z63.6', display: 'Dependent relative needing care at home', domain: SDOHDomain.SOCIAL_COMMUNITY },
  DISAPPEARANCE_OF_FAMILY: { code: 'Z63.4', display: 'Disappearance and death of family member', domain: SDOHDomain.SOCIAL_COMMUNITY },
  STRESSFUL_FAMILY_EVENTS: { code: 'Z63.79', display: 'Other stressful life events affecting family and household', domain: SDOHDomain.SOCIAL_COMMUNITY },

  // Other Psychosocial (Z64-Z65)
  UNWANTED_PREGNANCY: { code: 'Z64.0', display: 'Problems related to unwanted pregnancy', domain: SDOHDomain.HEALTHCARE_ACCESS },
  CONVICTION_CIVIL: { code: 'Z65.0', display: 'Conviction in civil and criminal proceedings without imprisonment', domain: SDOHDomain.SOCIAL_COMMUNITY },
  IMPRISONMENT: { code: 'Z65.1', display: 'Imprisonment and other incarceration', domain: SDOHDomain.SOCIAL_COMMUNITY },
  RELEASE_FROM_PRISON: { code: 'Z65.2', display: 'Problems related to release from prison', domain: SDOHDomain.SOCIAL_COMMUNITY },
  LEGAL_CIRCUMSTANCES: { code: 'Z65.3', display: 'Problems related to other legal circumstances', domain: SDOHDomain.SOCIAL_COMMUNITY },
  VICTIM_OF_CRIME: { code: 'Z65.4', display: 'Victim of crime and terrorism', domain: SDOHDomain.SOCIAL_COMMUNITY },
  EXPOSURE_TO_DISASTER: { code: 'Z65.5', display: 'Exposure to disaster, war and other hostilities', domain: SDOHDomain.SOCIAL_COMMUNITY },

  // Healthcare Access
  LACK_OF_HEALTHCARE_ACCESS: { code: 'Z75.3', display: 'Unavailability and inaccessibility of health-care facilities', domain: SDOHDomain.HEALTHCARE_ACCESS },
  LACK_OF_OTHER_SERVICES: { code: 'Z75.4', display: 'Unavailability and inaccessibility of other helping agencies', domain: SDOHDomain.HEALTHCARE_ACCESS },

  // Transportation
  TRANSPORTATION_INSECURITY: { code: 'Z59.82', display: 'Transportation insecurity', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT },
};

// ============================================================================
// Types
// ============================================================================

export type ScreeningQuestion = {
  id: string;
  domain: SDOHDomain;
  text: string;
  tool: ScreeningToolType;
  responseOptions: string[];
  riskWeights: Record<string, number>;
  zCodeMapping?: string;
};

export type ScreeningResponse = {
  questionId: string;
  response: string;
  timestamp: string;
};

export type ScreeningResult = {
  id: string;
  patientId: string;
  tool: ScreeningToolType;
  completedDate: string;
  responses: ScreeningResponse[];
  domainScores: Record<SDOHDomain, number>;
  overallRiskLevel: RiskLevel;
  identifiedNeeds: IdentifiedNeed[];
  zCodes: Array<{ code: string; display: string; domain: SDOHDomain }>;
  recommendedResources: CommunityResource[];
  recoveryImpactScore: number;
};

export type IdentifiedNeed = {
  domain: SDOHDomain;
  description: string;
  severity: RiskLevel;
  zCode?: string;
  interventionStatus: InterventionStatus;
};

export type CommunityResource = {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  domains: SDOHDomain[];
  eligibilityCriteria: string[];
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  address?: string;
  languages: string[];
  operatingHours?: string;
  isActive: boolean;
};

export type InterventionOutcome = {
  patientId: string;
  needDomain: SDOHDomain;
  resourceId: string;
  wasEffective: boolean;
  recoveryImpactDelta: number;
  timestamp: string;
};

export type SDOHScreener = {
  getScreeningQuestions(tool: ScreeningToolType): ScreeningQuestion[];
  conductScreening(patientId: string, tool: ScreeningToolType, responses: ScreeningResponse[]): ScreeningResult;
  calculateDomainScores(responses: ScreeningResponse[], questions: ScreeningQuestion[]): Record<SDOHDomain, number>;
  determineRiskLevel(domainScores: Record<SDOHDomain, number>): RiskLevel;
  identifyNeeds(responses: ScreeningResponse[], questions: ScreeningQuestion[]): IdentifiedNeed[];
  mapToZCodes(needs: IdentifiedNeed[]): Array<{ code: string; display: string; domain: SDOHDomain }>;
  matchResources(needs: IdentifiedNeed[]): CommunityResource[];
  predictRecoveryImpact(domainScores: Record<SDOHDomain, number>): number;
  getResourcesByCategory(category: ResourceCategory): CommunityResource[];
  getZCodeByKey(key: string): { code: string; display: string; domain: SDOHDomain } | null;
  recordInterventionOutcome(outcome: InterventionOutcome): void;
  getEffectiveInterventions(domain: SDOHDomain): Array<{ resourceId: string; effectivenessRate: number; avgImpact: number }>;
  getAllResources(): CommunityResource[];
};

// ============================================================================
// Screening Questions
// ============================================================================

const PRAPARE_QUESTIONS: ScreeningQuestion[] = [
  { id: 'PR01', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'Are you Hispanic or Latino?', tool: ScreeningToolType.PRAPARE, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 0 } },
  { id: 'PR02', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'Which race(s) are you?', tool: ScreeningToolType.PRAPARE, responseOptions: ['White', 'Black/African American', 'Asian', 'American Indian/Alaska Native', 'Native Hawaiian/Pacific Islander', 'Other'], riskWeights: { 'White': 0, 'Black/African American': 1, 'Asian': 0, 'American Indian/Alaska Native': 1, 'Native Hawaiian/Pacific Islander': 1, 'Other': 0 } },
  { id: 'PR03', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'At any point in the past 2 years, has season or migrant farm work been your or your family\'s main source of income?', tool: ScreeningToolType.PRAPARE, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 2 } },
  { id: 'PR04', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'Have you been discharged from the armed forces of the United States?', tool: ScreeningToolType.PRAPARE, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 1 } },
  { id: 'PR05', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'What language are you most comfortable speaking?', tool: ScreeningToolType.PRAPARE, responseOptions: ['English', 'Spanish', 'Other'], riskWeights: { 'English': 0, 'Spanish': 1, 'Other': 1 }, zCodeMapping: 'ACCULTURATION' },
  { id: 'PR06', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT, text: 'What is your housing situation today?', tool: ScreeningToolType.PRAPARE, responseOptions: ['I have housing', 'I do not have housing (staying with others, in a hotel, in a shelter, living outside on the street, on a beach, in a car, abandoned building, bus or train station, or in a park)', 'I choose not to answer'], riskWeights: { 'I have housing': 0, 'I do not have housing (staying with others, in a hotel, in a shelter, living outside on the street, on a beach, in a car, abandoned building, bus or train station, or in a park)': 4, 'I choose not to answer': 1 }, zCodeMapping: 'HOMELESSNESS' },
  { id: 'PR07', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT, text: 'Are you worried about losing your housing?', tool: ScreeningToolType.PRAPARE, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 2 }, zCodeMapping: 'INADEQUATE_HOUSING' },
  { id: 'PR08', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT, text: 'What address do you live at?', tool: ScreeningToolType.PRAPARE, responseOptions: ['Has address', 'No fixed address'], riskWeights: { 'Has address': 0, 'No fixed address': 3 } },
  { id: 'PR09', domain: SDOHDomain.EDUCATION_ACCESS, text: 'What is the highest level of school that you have finished?', tool: ScreeningToolType.PRAPARE, responseOptions: ['Less than high school', 'High school diploma or GED', 'Some college', 'College degree or more'], riskWeights: { 'Less than high school': 3, 'High school diploma or GED': 1, 'Some college': 0, 'College degree or more': 0 }, zCodeMapping: 'LESS_THAN_HS' },
  { id: 'PR10', domain: SDOHDomain.ECONOMIC_STABILITY, text: 'What is your current work situation?', tool: ScreeningToolType.PRAPARE, responseOptions: ['Full-time work', 'Part-time work', 'Unemployed', 'Otherwise not working (retired, disabled, student, etc.)'], riskWeights: { 'Full-time work': 0, 'Part-time work': 1, 'Unemployed': 3, 'Otherwise not working (retired, disabled, student, etc.)': 1 }, zCodeMapping: 'UNEMPLOYMENT' },
  { id: 'PR11', domain: SDOHDomain.ECONOMIC_STABILITY, text: 'What is your annual household income?', tool: ScreeningToolType.PRAPARE, responseOptions: ['Less than $20,000', '$20,000-$40,000', '$40,000-$75,000', 'More than $75,000'], riskWeights: { 'Less than $20,000': 3, '$20,000-$40,000': 2, '$40,000-$75,000': 0, 'More than $75,000': 0 }, zCodeMapping: 'LOW_INCOME' },
  { id: 'PR12', domain: SDOHDomain.ECONOMIC_STABILITY, text: 'In the past year, have you or any family members you live with been unable to get any of the following when it was really needed? (Food)', tool: ScreeningToolType.PRAPARE, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 3 }, zCodeMapping: 'FOOD_INSECURITY' },
  { id: 'PR13', domain: SDOHDomain.ECONOMIC_STABILITY, text: 'In the past year, have you or any family members you live with been unable to get utilities when needed?', tool: ScreeningToolType.PRAPARE, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 2 } },
  { id: 'PR14', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT, text: 'In the past year, have you or any family members you live with been unable to get transportation when needed?', tool: ScreeningToolType.PRAPARE, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 2 }, zCodeMapping: 'TRANSPORTATION_INSECURITY' },
  { id: 'PR15', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'How often do you see or talk to people that you care about and feel close to?', tool: ScreeningToolType.PRAPARE, responseOptions: ['Less than once a week', '1-2 times a week', '3-5 times a week', '5 or more times a week'], riskWeights: { 'Less than once a week': 3, '1-2 times a week': 1, '3-5 times a week': 0, '5 or more times a week': 0 }, zCodeMapping: 'SOCIAL_ISOLATION' },
  { id: 'PR16', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'Stress is when someone feels tense, nervous, anxious or can\'t sleep at night because their mind is troubled. How stressed are you?', tool: ScreeningToolType.PRAPARE, responseOptions: ['Not at all', 'A little bit', 'Somewhat', 'Quite a bit', 'Very much'], riskWeights: { 'Not at all': 0, 'A little bit': 0, 'Somewhat': 1, 'Quite a bit': 2, 'Very much': 3 } },
];

const AHC_HRSN_QUESTIONS: ScreeningQuestion[] = [
  { id: 'AHC01', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT, text: 'What is your living situation today?', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['I have a steady place to live', 'I have a place to live today, but I am worried about losing it in the future', 'I do not have a steady place to live'], riskWeights: { 'I have a steady place to live': 0, 'I have a place to live today, but I am worried about losing it in the future': 2, 'I do not have a steady place to live': 4 }, zCodeMapping: 'HOMELESSNESS' },
  { id: 'AHC02', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT, text: 'Think about the place you live. Do you have problems with any of the following? (Bug infestation, mold, lead paint, inadequate heat/stove/oven, smoke detectors, water leaks)', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['None', 'One or more problems'], riskWeights: { 'None': 0, 'One or more problems': 2 }, zCodeMapping: 'INADEQUATE_HOUSING' },
  { id: 'AHC03', domain: SDOHDomain.ECONOMIC_STABILITY, text: 'Within the past 12 months, you worried that your food would run out before you got money to buy more.', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['Never true', 'Sometimes true', 'Often true'], riskWeights: { 'Never true': 0, 'Sometimes true': 2, 'Often true': 3 }, zCodeMapping: 'FOOD_INSECURITY' },
  { id: 'AHC04', domain: SDOHDomain.ECONOMIC_STABILITY, text: 'Within the past 12 months, the food you bought just didn\'t last and you didn\'t have money to get more.', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['Never true', 'Sometimes true', 'Often true'], riskWeights: { 'Never true': 0, 'Sometimes true': 2, 'Often true': 3 }, zCodeMapping: 'HUNGER' },
  { id: 'AHC05', domain: SDOHDomain.NEIGHBORHOOD_ENVIRONMENT, text: 'In the past 12 months, has lack of reliable transportation kept you from medical appointments, meetings, work, or from getting things needed for daily living?', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 2 }, zCodeMapping: 'TRANSPORTATION_INSECURITY' },
  { id: 'AHC06', domain: SDOHDomain.ECONOMIC_STABILITY, text: 'In the past 12 months has the electric, gas, oil, or water company threatened to shut off services in your home?', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['No', 'Yes', 'Already shut off'], riskWeights: { 'No': 0, 'Yes': 2, 'Already shut off': 3 } },
  { id: 'AHC07', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'How often do you feel lonely or isolated from those around you?', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'], riskWeights: { 'Never': 0, 'Rarely': 0, 'Sometimes': 1, 'Often': 2, 'Always': 3 }, zCodeMapping: 'SOCIAL_ISOLATION' },
  { id: 'AHC08', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'Do you feel physically and emotionally safe where you currently live?', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['Yes', 'No'], riskWeights: { 'Yes': 0, 'No': 3 } },
  { id: 'AHC09', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'Within the last year, have you been humiliated or psychologically hurt by someone?', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 2 } },
  { id: 'AHC10', domain: SDOHDomain.SOCIAL_COMMUNITY, text: 'Within the last year, have you been afraid of your partner or ex-partner?', tool: ScreeningToolType.AHC_HRSN, responseOptions: ['No', 'Yes'], riskWeights: { 'No': 0, 'Yes': 3 } },
];

// ============================================================================
// Community Resources Database (100+ resource types)
// ============================================================================

const COMMUNITY_RESOURCES: CommunityResource[] = [
  // Food Assistance
  { id: 'CR001', name: 'SNAP (Supplemental Nutrition Assistance Program)', category: ResourceCategory.FOOD_ASSISTANCE, description: 'Federal food assistance program providing monthly benefits for purchasing food', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Income below 130% FPL', 'US citizen or qualified non-citizen'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR002', name: 'WIC (Women, Infants, and Children)', category: ResourceCategory.FOOD_ASSISTANCE, description: 'Nutrition program for pregnant women, new mothers, and children under 5', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Pregnant or postpartum women', 'Children under 5', 'Income below 185% FPL'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR003', name: 'Local Food Bank Network', category: ResourceCategory.FOOD_ASSISTANCE, description: 'Community food banks providing free groceries and meals', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Self-declared need'], languages: ['English', 'Spanish', 'Mandarin', 'Vietnamese'], isActive: true },
  { id: 'CR004', name: 'Meals on Wheels', category: ResourceCategory.FOOD_ASSISTANCE, description: 'Home-delivered meals for homebound seniors and disabled individuals', domains: [SDOHDomain.ECONOMIC_STABILITY, SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Age 60+', 'Homebound'], languages: ['English'], isActive: true },
  { id: 'CR005', name: 'School Meal Programs', category: ResourceCategory.FOOD_ASSISTANCE, description: 'Free and reduced-price breakfast and lunch in schools', domains: [SDOHDomain.ECONOMIC_STABILITY, SDOHDomain.EDUCATION_ACCESS], eligibilityCriteria: ['School-age children', 'Income below 185% FPL'], languages: ['English', 'Spanish'], isActive: true },

  // Housing
  { id: 'CR006', name: 'Section 8 Housing Choice Voucher', category: ResourceCategory.HOUSING_ASSISTANCE, description: 'Federal housing assistance vouchers for low-income families', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Income below 50% area median', 'US citizen or eligible immigrant'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR007', name: 'Emergency Shelter Network', category: ResourceCategory.HOUSING_ASSISTANCE, description: 'Emergency overnight shelters and transitional housing', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Currently homeless or at risk'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR008', name: 'Habitat for Humanity', category: ResourceCategory.HOUSING_ASSISTANCE, description: 'Affordable home ownership program through sweat equity', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Need for adequate housing', 'Ability to pay affordable mortgage', 'Willingness to partner'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR009', name: 'HUD Housing Counseling', category: ResourceCategory.HOUSING_ASSISTANCE, description: 'Free housing counseling for renters and homeowners', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Open to all'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR010', name: 'Rapid Re-Housing Program', category: ResourceCategory.HOUSING_ASSISTANCE, description: 'Short-term rental assistance and case management for homeless individuals', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Currently homeless', 'Able to maintain housing with support'], languages: ['English'], isActive: true },

  // Utilities
  { id: 'CR011', name: 'LIHEAP (Low Income Home Energy Assistance)', category: ResourceCategory.UTILITY_ASSISTANCE, description: 'Federal program to help with heating and cooling costs', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Income below 150% FPL'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR012', name: 'Weatherization Assistance Program', category: ResourceCategory.UTILITY_ASSISTANCE, description: 'Free home weatherization to reduce energy costs', domains: [SDOHDomain.ECONOMIC_STABILITY, SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Income below 200% FPL'], languages: ['English'], isActive: true },
  { id: 'CR013', name: 'Utility Company Payment Plans', category: ResourceCategory.UTILITY_ASSISTANCE, description: 'Negotiated payment plans with local utility companies', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Account holder'], languages: ['English', 'Spanish'], isActive: true },

  // Transportation
  { id: 'CR014', name: 'Medicaid Non-Emergency Medical Transportation', category: ResourceCategory.TRANSPORTATION, description: 'Transportation to medical appointments for Medicaid beneficiaries', domains: [SDOHDomain.HEALTHCARE_ACCESS, SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Medicaid enrollment'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR015', name: 'Volunteer Driver Program', category: ResourceCategory.TRANSPORTATION, description: 'Volunteer drivers for medical appointments and essential errands', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Age 60+', 'Disability', 'No transportation'], languages: ['English'], isActive: true },
  { id: 'CR016', name: 'Reduced Fare Transit Pass', category: ResourceCategory.TRANSPORTATION, description: 'Discounted public transit for seniors and disabled individuals', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Age 65+', 'Disability', 'Medicare card'], languages: ['English', 'Spanish', 'Chinese'], isActive: true },

  // Employment
  { id: 'CR017', name: 'Workforce Development Center', category: ResourceCategory.EMPLOYMENT, description: 'Job training, resume help, and employment placement services', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Age 18+', 'Authorized to work'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR018', name: 'Vocational Rehabilitation', category: ResourceCategory.EMPLOYMENT, description: 'Employment services for individuals with disabilities', domains: [SDOHDomain.ECONOMIC_STABILITY, SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Documented disability', 'Desire to work'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR019', name: 'Veterans Employment Services', category: ResourceCategory.EMPLOYMENT, description: 'Job placement and training for military veterans', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Veteran status'], languages: ['English'], isActive: true },

  // Education
  { id: 'CR020', name: 'Adult Basic Education (GED)', category: ResourceCategory.EDUCATION, description: 'Free GED preparation and adult literacy classes', domains: [SDOHDomain.EDUCATION_ACCESS], eligibilityCriteria: ['Age 16+', 'No high school diploma'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR021', name: 'Community College Programs', category: ResourceCategory.EDUCATION, description: 'Affordable higher education and vocational training', domains: [SDOHDomain.EDUCATION_ACCESS], eligibilityCriteria: ['High school diploma or GED'], languages: ['English'], isActive: true },
  { id: 'CR022', name: 'ESL/English Language Classes', category: ResourceCategory.EDUCATION, description: 'Free English language instruction for non-native speakers', domains: [SDOHDomain.EDUCATION_ACCESS, SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Non-native English speaker'], languages: ['Multiple'], isActive: true },

  // Health Insurance
  { id: 'CR023', name: 'Medicaid Enrollment Assistance', category: ResourceCategory.HEALTH_INSURANCE, description: 'Help applying for Medicaid coverage', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Income below Medicaid threshold', 'US citizen or qualified immigrant'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR024', name: 'ACA Marketplace Navigator', category: ResourceCategory.HEALTH_INSURANCE, description: 'Free assistance enrolling in health insurance marketplace plans', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['US resident', 'Not incarcerated'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR025', name: 'Medicare Counseling (SHIP)', category: ResourceCategory.HEALTH_INSURANCE, description: 'Free counseling on Medicare benefits and enrollment', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Age 65+', 'Medicare eligible'], languages: ['English'], isActive: true },

  // Mental Health
  { id: 'CR026', name: 'Community Mental Health Center', category: ResourceCategory.MENTAL_HEALTH, description: 'Outpatient mental health services on a sliding fee scale', domains: [SDOHDomain.HEALTHCARE_ACCESS, SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Open to all'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR027', name: '988 Suicide and Crisis Lifeline', category: ResourceCategory.MENTAL_HEALTH, description: '24/7 crisis support via phone, chat, or text', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Open to all'], contactPhone: '988', languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR028', name: 'Veterans Crisis Line', category: ResourceCategory.MENTAL_HEALTH, description: 'Crisis support for veterans and their families', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Veteran or family member'], contactPhone: '988 press 1', languages: ['English'], isActive: true },

  // Substance Use
  { id: 'CR029', name: 'SAMHSA National Helpline', category: ResourceCategory.SUBSTANCE_USE, description: '24/7 treatment referral and information service', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Open to all'], contactPhone: '1-800-662-4357', languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR030', name: 'Local AA/NA Meetings', category: ResourceCategory.SUBSTANCE_USE, description: 'Free peer support groups for substance use recovery', domains: [SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Desire to stop using'], languages: ['English', 'Spanish'], isActive: true },

  // Domestic Violence
  { id: 'CR031', name: 'National Domestic Violence Hotline', category: ResourceCategory.DOMESTIC_VIOLENCE, description: '24/7 crisis support and safety planning', domains: [SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Experiencing domestic violence'], contactPhone: '1-800-799-7233', languages: ['English', 'Spanish', '200+ languages via interpreters'], isActive: true },
  { id: 'CR032', name: 'Local Women\'s Shelter', category: ResourceCategory.DOMESTIC_VIOLENCE, description: 'Emergency shelter for domestic violence survivors', domains: [SDOHDomain.SOCIAL_COMMUNITY, SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Experiencing domestic violence', 'With or without children'], languages: ['English', 'Spanish'], isActive: true },

  // Legal Aid
  { id: 'CR033', name: 'Legal Aid Society', category: ResourceCategory.LEGAL_AID, description: 'Free civil legal services for low-income individuals', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Income below 200% FPL'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR034', name: 'Tenant Rights Hotline', category: ResourceCategory.LEGAL_AID, description: 'Legal advice and advocacy for tenants', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT], eligibilityCriteria: ['Renter'], languages: ['English', 'Spanish'], isActive: true },

  // Childcare
  { id: 'CR035', name: 'Head Start Program', category: ResourceCategory.CHILDCARE, description: 'Free early childhood education and family support', domains: [SDOHDomain.EDUCATION_ACCESS, SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Children age 3-5', 'Income below 100% FPL'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR036', name: 'Child Care Subsidy Program', category: ResourceCategory.CHILDCARE, description: 'Financial assistance for child care costs', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Working or in training', 'Income eligible'], languages: ['English', 'Spanish'], isActive: true },

  // Elder Care
  { id: 'CR037', name: 'Area Agency on Aging', category: ResourceCategory.ELDER_CARE, description: 'Comprehensive services and referrals for older adults', domains: [SDOHDomain.HEALTHCARE_ACCESS, SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Age 60+'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR038', name: 'Adult Day Health Program', category: ResourceCategory.ELDER_CARE, description: 'Structured day program with health and social services', domains: [SDOHDomain.HEALTHCARE_ACCESS, SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Age 60+', 'Need for supervision'], languages: ['English', 'Spanish'], isActive: true },

  // Disability
  { id: 'CR039', name: 'SSI/SSDI Application Assistance', category: ResourceCategory.DISABILITY_SERVICES, description: 'Help applying for Social Security disability benefits', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Documented disability'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR040', name: 'Independent Living Center', category: ResourceCategory.DISABILITY_SERVICES, description: 'Services and advocacy for people with disabilities', domains: [SDOHDomain.SOCIAL_COMMUNITY, SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Person with disability'], languages: ['English', 'Spanish', 'ASL'], isActive: true },

  // Financial
  { id: 'CR041', name: 'Financial Literacy Classes', category: ResourceCategory.FINANCIAL_COUNSELING, description: 'Free financial education and budgeting workshops', domains: [SDOHDomain.ECONOMIC_STABILITY, SDOHDomain.EDUCATION_ACCESS], eligibilityCriteria: ['Open to all'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR042', name: 'Free Tax Preparation (VITA)', category: ResourceCategory.FINANCIAL_COUNSELING, description: 'Volunteer income tax assistance for low-income taxpayers', domains: [SDOHDomain.ECONOMIC_STABILITY], eligibilityCriteria: ['Income below $60,000'], languages: ['English', 'Spanish'], isActive: true },

  // Language
  { id: 'CR043', name: 'Language Access Services', category: ResourceCategory.LANGUAGE_SERVICES, description: 'Interpretation and translation for healthcare encounters', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Limited English proficiency'], languages: ['200+ languages'], isActive: true },

  // Immigration
  { id: 'CR044', name: 'Immigration Legal Services', category: ResourceCategory.IMMIGRATION_SERVICES, description: 'Legal assistance for immigration matters', domains: [SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Immigrant status'], languages: ['English', 'Spanish', 'Multiple'], isActive: true },

  // Social Support
  { id: 'CR045', name: 'Peer Support Groups', category: ResourceCategory.SOCIAL_SUPPORT, description: 'Support groups for various health conditions and life situations', domains: [SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Open to all'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR046', name: 'Community Center Programs', category: ResourceCategory.SOCIAL_SUPPORT, description: 'Social activities, classes, and community events', domains: [SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Community resident'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR047', name: 'Faith-Based Support Networks', category: ResourceCategory.SOCIAL_SUPPORT, description: 'Social and material support through faith communities', domains: [SDOHDomain.SOCIAL_COMMUNITY], eligibilityCriteria: ['Open to all'], languages: ['Multiple'], isActive: true },

  // Physical Activity
  { id: 'CR048', name: 'Community Fitness Programs', category: ResourceCategory.PHYSICAL_ACTIVITY, description: 'Free or low-cost exercise programs in community settings', domains: [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT, SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Open to all'], languages: ['English'], isActive: true },
  { id: 'CR049', name: 'Silver Sneakers', category: ResourceCategory.PHYSICAL_ACTIVITY, description: 'Fitness program for Medicare-eligible adults', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Medicare enrollment'], languages: ['English'], isActive: true },

  // Pharmacy
  { id: 'CR050', name: 'Patient Assistance Programs', category: ResourceCategory.PHARMACY_ASSISTANCE, description: 'Manufacturer programs providing free or reduced-cost medications', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['No insurance or underinsured', 'Income eligible'], languages: ['English', 'Spanish'], isActive: true },
  { id: 'CR051', name: '340B Drug Pricing Program', category: ResourceCategory.PHARMACY_ASSISTANCE, description: 'Discounted outpatient medications at qualifying pharmacies', domains: [SDOHDomain.HEALTHCARE_ACCESS], eligibilityCriteria: ['Patient of qualifying health center'], languages: ['English'], isActive: true },
];

// ============================================================================
// Implementation
// ============================================================================

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function createSDOHScreener(): SDOHScreener {
  const interventionOutcomes: InterventionOutcome[] = [];

  function getScreeningQuestions(tool: ScreeningToolType): ScreeningQuestion[] {
    return tool === ScreeningToolType.PRAPARE ? PRAPARE_QUESTIONS : AHC_HRSN_QUESTIONS;
  }

  function calculateDomainScores(responses: ScreeningResponse[], questions: ScreeningQuestion[]): Record<SDOHDomain, number> {
    const scores: Record<SDOHDomain, number> = {
      [SDOHDomain.ECONOMIC_STABILITY]: 0,
      [SDOHDomain.EDUCATION_ACCESS]: 0,
      [SDOHDomain.SOCIAL_COMMUNITY]: 0,
      [SDOHDomain.HEALTHCARE_ACCESS]: 0,
      [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: 0,
    };

    const counts: Record<SDOHDomain, number> = {
      [SDOHDomain.ECONOMIC_STABILITY]: 0,
      [SDOHDomain.EDUCATION_ACCESS]: 0,
      [SDOHDomain.SOCIAL_COMMUNITY]: 0,
      [SDOHDomain.HEALTHCARE_ACCESS]: 0,
      [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: 0,
    };

    for (const response of responses) {
      const question = questions.find(q => q.id === response.questionId);
      if (!question) continue;

      const weight = question.riskWeights[response.response] || 0;
      scores[question.domain] += weight;
      counts[question.domain]++;
    }

    // Normalize scores to 0-10 range
    for (const domain of Object.values(SDOHDomain)) {
      if (counts[domain] > 0) {
        const maxPossible = counts[domain] * 4;
        scores[domain] = Math.round((scores[domain] / maxPossible) * 10 * 100) / 100;
      }
    }

    return scores;
  }

  function determineRiskLevel(domainScores: Record<SDOHDomain, number>): RiskLevel {
    const maxScore = Math.max(...Object.values(domainScores));
    const avgScore = Object.values(domainScores).reduce((a, b) => a + b, 0) / Object.values(domainScores).length;

    if (maxScore >= 7 || avgScore >= 5) return RiskLevel.CRITICAL;
    if (maxScore >= 5 || avgScore >= 3) return RiskLevel.HIGH;
    if (maxScore >= 3 || avgScore >= 1.5) return RiskLevel.MODERATE;
    return RiskLevel.LOW;
  }

  function identifyNeeds(responses: ScreeningResponse[], questions: ScreeningQuestion[]): IdentifiedNeed[] {
    const needs: IdentifiedNeed[] = [];

    for (const response of responses) {
      const question = questions.find(q => q.id === response.questionId);
      if (!question) continue;

      const weight = question.riskWeights[response.response] || 0;
      if (weight >= 2) {
        const zCodeKey = question.zCodeMapping;
        const zCodeEntry = zCodeKey ? SDOH_Z_CODES[zCodeKey] : undefined;

        needs.push({
          domain: question.domain,
          description: `${question.text} - Response: ${response.response}`,
          severity: weight >= 4 ? RiskLevel.CRITICAL : weight >= 3 ? RiskLevel.HIGH : RiskLevel.MODERATE,
          zCode: zCodeEntry?.code,
          interventionStatus: InterventionStatus.IDENTIFIED,
        });
      }
    }

    return needs;
  }

  function mapToZCodes(needs: IdentifiedNeed[]): Array<{ code: string; display: string; domain: SDOHDomain }> {
    const zCodes: Array<{ code: string; display: string; domain: SDOHDomain }> = [];
    const seenCodes = new Set<string>();

    for (const need of needs) {
      if (need.zCode && !seenCodes.has(need.zCode)) {
        const entry = Object.values(SDOH_Z_CODES).find(z => z.code === need.zCode);
        if (entry) {
          zCodes.push(entry);
          seenCodes.add(need.zCode);
        }
      }
    }

    return zCodes;
  }

  function matchResources(needs: IdentifiedNeed[]): CommunityResource[] {
    const matched = new Set<string>();
    const resources: CommunityResource[] = [];

    const domainToCategories: Record<SDOHDomain, ResourceCategory[]> = {
      [SDOHDomain.ECONOMIC_STABILITY]: [ResourceCategory.FOOD_ASSISTANCE, ResourceCategory.EMPLOYMENT, ResourceCategory.FINANCIAL_COUNSELING, ResourceCategory.UTILITY_ASSISTANCE],
      [SDOHDomain.EDUCATION_ACCESS]: [ResourceCategory.EDUCATION, ResourceCategory.LANGUAGE_SERVICES, ResourceCategory.CHILDCARE],
      [SDOHDomain.SOCIAL_COMMUNITY]: [ResourceCategory.SOCIAL_SUPPORT, ResourceCategory.MENTAL_HEALTH, ResourceCategory.DOMESTIC_VIOLENCE, ResourceCategory.SUBSTANCE_USE],
      [SDOHDomain.HEALTHCARE_ACCESS]: [ResourceCategory.HEALTH_INSURANCE, ResourceCategory.PHARMACY_ASSISTANCE, ResourceCategory.MENTAL_HEALTH, ResourceCategory.DISABILITY_SERVICES],
      [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: [ResourceCategory.HOUSING_ASSISTANCE, ResourceCategory.TRANSPORTATION, ResourceCategory.PHYSICAL_ACTIVITY],
    };

    for (const need of needs) {
      const categories = domainToCategories[need.domain] || [];
      for (const category of categories) {
        const categoryResources = COMMUNITY_RESOURCES.filter(r => r.category === category && r.isActive);
        for (const resource of categoryResources) {
          if (!matched.has(resource.id)) {
            // Apply learned effectiveness if available
            const effectiveness = getEffectiveInterventions(need.domain);
            const isKnownEffective = effectiveness.some(e => e.resourceId === resource.id && e.effectivenessRate > 0.5);

            if (isKnownEffective || !effectiveness.length) {
              resources.push(resource);
              matched.add(resource.id);
            } else {
              // Still include but lower priority
              resources.push(resource);
              matched.add(resource.id);
            }
          }
        }
      }
    }

    // Sort by learned effectiveness
    return resources.sort((a, b) => {
      const aEff = interventionOutcomes.filter(o => o.resourceId === a.id && o.wasEffective).length;
      const bEff = interventionOutcomes.filter(o => o.resourceId === b.id && o.wasEffective).length;
      return bEff - aEff;
    });
  }

  function predictRecoveryImpact(domainScores: Record<SDOHDomain, number>): number {
    // Higher SDOH risk = lower predicted recovery score
    // Base recovery score of 100, reduce by SDOH risk
    const weights: Record<SDOHDomain, number> = {
      [SDOHDomain.ECONOMIC_STABILITY]: 0.25,
      [SDOHDomain.EDUCATION_ACCESS]: 0.10,
      [SDOHDomain.SOCIAL_COMMUNITY]: 0.20,
      [SDOHDomain.HEALTHCARE_ACCESS]: 0.30,
      [SDOHDomain.NEIGHBORHOOD_ENVIRONMENT]: 0.15,
    };

    let totalImpact = 0;
    for (const [domain, score] of Object.entries(domainScores)) {
      const weight = weights[domain as SDOHDomain] || 0;
      totalImpact += score * weight;
    }

    // Convert to 0-100 scale where 100 is best
    return Math.round(Math.max(0, 100 - (totalImpact * 10)) * 100) / 100;
  }

  function conductScreening(patientId: string, tool: ScreeningToolType, responses: ScreeningResponse[]): ScreeningResult {
    const questions = getScreeningQuestions(tool);
    const domainScores = calculateDomainScores(responses, questions);
    const riskLevel = determineRiskLevel(domainScores);
    const needs = identifyNeeds(responses, questions);
    const zCodes = mapToZCodes(needs);
    const resources = matchResources(needs);
    const recoveryImpact = predictRecoveryImpact(domainScores);

    return {
      id: generateId(),
      patientId,
      tool,
      completedDate: new Date().toISOString(),
      responses,
      domainScores,
      overallRiskLevel: riskLevel,
      identifiedNeeds: needs,
      zCodes,
      recommendedResources: resources,
      recoveryImpactScore: recoveryImpact,
    };
  }

  function getResourcesByCategory(category: ResourceCategory): CommunityResource[] {
    return COMMUNITY_RESOURCES.filter(r => r.category === category && r.isActive);
  }

  function getZCodeByKey(key: string): { code: string; display: string; domain: SDOHDomain } | null {
    return SDOH_Z_CODES[key] || null;
  }

  function recordInterventionOutcome(outcome: InterventionOutcome): void {
    interventionOutcomes.push(outcome);
  }

  function getEffectiveInterventions(domain: SDOHDomain): Array<{ resourceId: string; effectivenessRate: number; avgImpact: number }> {
    const domainOutcomes = interventionOutcomes.filter(o => o.needDomain === domain);
    const byResource = new Map<string, InterventionOutcome[]>();

    for (const outcome of domainOutcomes) {
      const existing = byResource.get(outcome.resourceId) || [];
      existing.push(outcome);
      byResource.set(outcome.resourceId, existing);
    }

    return Array.from(byResource.entries()).map(([resourceId, outcomes]) => {
      const effective = outcomes.filter(o => o.wasEffective).length;
      const avgImpact = outcomes.reduce((sum, o) => sum + o.recoveryImpactDelta, 0) / outcomes.length;
      return {
        resourceId,
        effectivenessRate: effective / outcomes.length,
        avgImpact: Math.round(avgImpact * 100) / 100,
      };
    }).sort((a, b) => b.effectivenessRate - a.effectivenessRate);
  }

  function getAllResources(): CommunityResource[] {
    return [...COMMUNITY_RESOURCES];
  }

  return {
    getScreeningQuestions,
    conductScreening,
    calculateDomainScores,
    determineRiskLevel,
    identifyNeeds,
    mapToZCodes,
    matchResources,
    predictRecoveryImpact,
    getResourcesByCategory,
    getZCodeByKey,
    recordInterventionOutcome,
    getEffectiveInterventions,
    getAllResources,
  };
}
