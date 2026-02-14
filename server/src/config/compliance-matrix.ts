/**
 * Comprehensive compliance matrix for India, US, and UK healthcare deployments.
 *
 * This file documents all applicable laws, regulations, and standards
 * that RecoveryPilot must comply with in each jurisdiction.
 *
 * Last reviewed: 2026-02-14
 */

export const COMPLIANCE_MATRIX = {
  // =============================================================
  // INDIA
  // =============================================================
  india: {
    laws: [
      {
        name: 'Digital Personal Data Protection Act, 2023 (DPDPA)',
        status: 'active',
        effectiveDate: '2023-08-11',
        requirements: [
          'Obtain free, specific, informed, unconditional, and unambiguous consent',
          'Process data only for lawful purposes specified in consent notice',
          'Maintain accuracy and completeness of personal data',
          'Implement reasonable security safeguards',
          'Delete personal data when purpose is fulfilled or consent is withdrawn',
          'Appoint Data Protection Officer for Significant Data Fiduciaries',
          'Report data breaches to Data Protection Board within 72 hours',
          'Provide Data Principals with right to access, correction, erasure',
          'Cross-border transfer only to notified countries',
          'Special provisions for children\'s data (below 18 years)',
          'No behavioral tracking/monitoring of children',
          'Consent Manager registration with Data Protection Board',
        ],
        implementation: {
          consent: 'server/src/middleware/compliance.ts - requireConsent()',
          erasure: 'server/src/middleware/compliance.ts - processErasureRequest()',
          breach: 'server/src/middleware/compliance.ts - reportBreach()',
          encryption: 'server/src/utils/encryption.ts - encryptPHI()',
          audit: 'server/src/middleware/audit.ts - writeAuditLog()',
          dataResidency: 'server/src/middleware/compliance.ts - enforceDataResidency()',
        },
      },
      {
        name: 'Information Technology Act, 2000 (IT Act)',
        status: 'active',
        requirements: [
          'Section 43A: Compensation for failure to protect sensitive personal data',
          'Section 72A: Punishment for disclosure of information in breach of lawful contract',
          'Reasonable security practices and procedures (IS/ISO/IEC 27001)',
          'Body corporate handling sensitive personal data must implement security policy',
        ],
      },
      {
        name: 'IT (Reasonable Security Practices) Rules, 2011',
        status: 'active',
        requirements: [
          'Implement comprehensive documented information security programme',
          'ISO 27001 certification or equivalent',
          'Written security policy published on website',
          'Sensitive Personal Data: password, financial information, health condition, medical records, biometric',
          'Prior consent required before collection of sensitive personal data',
          'Grievance officer to be appointed (contact details published)',
        ],
      },
      {
        name: 'ABDM Health Data Management Policy',
        status: 'active',
        requirements: [
          'ABHA ID (Ayushman Bharat Health Account) integration',
          'Health Information Exchange using FHIR R4',
          'Consent-based health data sharing via Health Information Exchange & Consent Manager (HIE-CM)',
          'Health records stored in Health Locker',
          'PHR (Personal Health Record) address support',
          'Interoperability with National Digital Health Mission (NDHM) building blocks',
          'Compliance with Electronic Health Record (EHR) Standards',
        ],
      },
      {
        name: 'Indian Medical Council (Professional Conduct) Regulations, 2002',
        status: 'active',
        requirements: [
          'Patient confidentiality obligations for registered medical practitioners',
          'Telemedicine Practice Guidelines 2020 for digital consultations',
          'Medical records maintenance requirements',
        ],
      },
    ],
    dataResidency: {
      region: 'ap-south-1',
      crossBorderRestriction: 'Government notification required for transfers outside India',
      localStorageRequired: true,
    },
  },

  // =============================================================
  // UNITED STATES
  // =============================================================
  us: {
    laws: [
      {
        name: 'Health Insurance Portability and Accountability Act (HIPAA)',
        status: 'active',
        effectiveDate: '1996-08-21',
        subRules: [
          {
            name: 'Privacy Rule (45 CFR Part 160 and Part 164, Subparts A and E)',
            requirements: [
              'Protected Health Information (PHI) safeguards',
              'Minimum Necessary Rule: limit PHI to minimum needed',
              'Notice of Privacy Practices (NPP)',
              'Patient right to access their PHI within 30 days',
              'Patient right to request amendment of PHI',
              'Patient right to accounting of PHI disclosures',
              'Business Associate Agreements (BAA) for all vendors',
              'De-identification standards (Safe Harbor method: remove 18 identifiers)',
              'Authorization required for marketing, sale of PHI, psychotherapy notes',
              'Breach notification within 60 days (500+ individuals: HHS + media)',
            ],
            implementation: {
              minimumNecessary: 'server/src/middleware/compliance.ts - minimumNecessaryRule()',
              deIdentification: 'server/src/utils/encryption.ts - generateAnonymousId()',
              accessControl: 'server/src/middleware/authentication.ts - requireDataAccess()',
            },
          },
          {
            name: 'Security Rule (45 CFR Part 160 and Part 164, Subparts A and C)',
            requirements: [
              'Administrative safeguards: security management process, risk analysis',
              'Physical safeguards: facility access controls, workstation security',
              'Technical safeguards:',
              '  - Access control: unique user identification, emergency access',
              '  - Audit controls: hardware, software, procedural mechanisms',
              '  - Integrity controls: PHI alteration/destruction protection',
              '  - Transmission security: encryption of ePHI in transit',
              '  - Authentication: verify person/entity identity',
              'Encryption: addressable specification (AES-256)',
              'Risk assessment: annual review required',
            ],
            implementation: {
              encryption: 'server/src/utils/encryption.ts - AES-256-GCM',
              auditControls: 'server/src/middleware/audit.ts',
              accessControl: 'server/src/middleware/authentication.ts',
              transmissionSecurity: 'infrastructure/kubernetes/base/ingress.yaml - TLS 1.3',
            },
          },
        ],
      },
      {
        name: 'HITECH Act (Health Information Technology for Economic and Clinical Health)',
        status: 'active',
        requirements: [
          'Breach notification requirements (strengthened from HIPAA)',
          'Increased penalties for non-compliance (up to $1.5M per violation category)',
          'Business associates directly liable for HIPAA compliance',
          'Meaningful Use requirements for EHR systems',
        ],
      },
      {
        name: '21st Century Cures Act',
        status: 'active',
        requirements: [
          'Information blocking prohibition',
          'Patient right to access EHI via APIs (FHIR R4)',
          'Interoperability requirements for health IT',
          'ONC Health IT Certification requirements',
        ],
        implementation: {
          fhirApi: 'src/services/fhirResourceEngine.ts',
        },
      },
      {
        name: '42 CFR Part 2 (Confidentiality of Substance Use Disorder Records)',
        status: 'active',
        requirements: [
          'Special protections for substance use disorder patient records',
          'Written patient consent required for any disclosure',
          'More restrictive than general HIPAA PHI protections',
          'Separate consent for each disclosure purpose',
        ],
      },
    ],
    dataResidency: {
      region: 'us-east-1',
      crossBorderRestriction: 'BAA required for international transfers',
      localStorageRequired: false,
    },
  },

  // =============================================================
  // UNITED KINGDOM
  // =============================================================
  uk: {
    laws: [
      {
        name: 'UK General Data Protection Regulation (UK GDPR)',
        status: 'active',
        effectiveDate: '2021-01-01',
        requirements: [
          'Lawful basis for processing (consent, vital interests, public interest, etc.)',
          'Explicit consent for special category data (health data)',
          'Data Protection Impact Assessment (DPIA) for high-risk processing',
          'Data Protection Officer (DPO) appointment mandatory',
          'Rights: access, rectification, erasure, restriction, portability, objection',
          'Automated decision-making: right to human intervention',
          'Data breach notification to ICO within 72 hours',
          'International data transfers: adequacy decision or appropriate safeguards',
          'Records of processing activities (ROPA)',
          'Privacy by design and by default',
          'Data minimisation principle',
          'Storage limitation: retain only as long as necessary',
        ],
        implementation: {
          consent: 'server/src/middleware/compliance.ts',
          erasure: 'server/src/middleware/compliance.ts - processErasureRequest()',
          portability: 'server/src/middleware/compliance.ts - processPortabilityRequest()',
          breach: 'server/src/middleware/compliance.ts - reportBreach()',
        },
      },
      {
        name: 'Data Protection Act 2018 (DPA 2018)',
        status: 'active',
        requirements: [
          'UK implementation of GDPR with additional provisions',
          'Schedule 1: Special category data conditions for health',
          'Part 3: Law enforcement processing provisions',
          'National security exemptions',
          'Health research exemptions (with appropriate safeguards)',
        ],
      },
      {
        name: 'Caldicott Principles (Revised 2013)',
        status: 'active',
        requirements: [
          'Principle 1: Justify the purpose of using confidential information',
          'Principle 2: Use confidential information only when absolutely necessary',
          'Principle 3: Use the minimum necessary confidential information',
          'Principle 4: Access should be on a strict need-to-know basis',
          'Principle 5: Everyone with access should be aware of their responsibilities',
          'Principle 6: Comply with the law (DPA, common law confidentiality)',
          'Principle 7: The duty to share information is as important as the duty to protect',
          'Principle 8: Inform patients and service users about how data is used',
          'Caldicott Guardian appointment required in NHS organisations',
        ],
        implementation: {
          minimumNecessary: 'server/src/middleware/compliance.ts - minimumNecessaryRule()',
          accessControl: 'server/src/middleware/authentication.ts - requireDataAccess()',
          auditTrail: 'server/src/middleware/audit.ts',
        },
      },
      {
        name: 'NHS Digital Standards',
        status: 'active',
        requirements: [
          'NHS Number as primary patient identifier',
          'Spine integration for PDS (Personal Demographics Service)',
          'SNOMED CT coding for clinical terms',
          'NHS Data Security and Protection Toolkit (DSPT) compliance',
          'DCB0129: Clinical Risk Management (manufacturer standard)',
          'DCB0160: Clinical Risk Management (deploying organisation)',
          'FHIR UK Core profiles for interoperability',
          'GP Connect integration requirements',
        ],
      },
      {
        name: 'Common Law Duty of Confidentiality',
        status: 'active',
        requirements: [
          'Information given in confidence must not be disclosed without consent',
          'Applies to all patient-identifiable information',
          'Exceptions: patient consent, statutory requirement, public interest, court order',
          'Overriding duty of confidence continues after patient death',
        ],
      },
    ],
    dataResidency: {
      region: 'eu-west-2',
      crossBorderRestriction: 'Adequacy decision or Standard Contractual Clauses required',
      localStorageRequired: true,
    },
  },
} as const;

/**
 * Technical controls checklist mapped to compliance requirements.
 */
export const TECHNICAL_CONTROLS = {
  authentication: {
    control: 'Multi-factor authentication',
    implementation: 'TOTP-based MFA (RFC 6238)',
    hipaa: '§164.312(d) - Person or entity authentication',
    dpdpa: 'Reasonable security safeguards',
    ukGdpr: 'Art. 32 - Security of processing',
    file: 'server/src/middleware/authentication.ts',
  },
  encryption_at_rest: {
    control: 'AES-256-GCM field-level encryption',
    implementation: 'Application-level PHI encryption with KMS key management',
    hipaa: '§164.312(a)(2)(iv) - Encryption and decryption',
    dpdpa: 'Reasonable security safeguards',
    ukGdpr: 'Art. 32(1)(a) - Encryption of personal data',
    file: 'server/src/utils/encryption.ts',
  },
  encryption_in_transit: {
    control: 'TLS 1.3 with strong cipher suites',
    implementation: 'Nginx + Kubernetes Ingress TLS termination',
    hipaa: '§164.312(e)(1) - Transmission security',
    dpdpa: 'Reasonable security safeguards',
    ukGdpr: 'Art. 32(1)(a) - Encryption of personal data',
    file: 'infrastructure/kubernetes/base/ingress.yaml',
  },
  audit_logging: {
    control: 'Immutable hash-chained audit trail',
    implementation: '7-year retention, tamper-evident, S3 Object Lock',
    hipaa: '§164.312(b) - Audit controls',
    dpdpa: 'Records of processing activities',
    ukGdpr: 'Art. 30 - Records of processing activities',
    file: 'server/src/middleware/audit.ts',
  },
  access_control: {
    control: 'RBAC + Row-Level Security',
    implementation: 'JWT + PostgreSQL RLS policies',
    hipaa: '§164.312(a)(1) - Access control',
    dpdpa: 'Purpose limitation',
    ukGdpr: 'Art. 25 - Data protection by design',
    file: 'server/src/middleware/authentication.ts',
  },
  data_residency: {
    control: 'Regional data isolation',
    implementation: 'Partitioned tables + regional K8s clusters',
    hipaa: 'BAA required for third-party access',
    dpdpa: 'Cross-border transfer restrictions',
    ukGdpr: 'Chapter V - International transfers',
    file: 'server/src/middleware/compliance.ts',
  },
  consent_management: {
    control: 'Granular consent tracking',
    implementation: 'Per-purpose, per-category consent with withdrawal tracking',
    hipaa: '§164.508 - Authorization',
    dpdpa: 'Section 6 - Consent',
    ukGdpr: 'Art. 7 - Conditions for consent',
    file: 'server/src/routes/compliance.ts',
  },
  breach_notification: {
    control: 'Automated breach detection and notification workflow',
    implementation: 'Real-time alerting with jurisdiction-specific deadlines',
    hipaa: '§164.408 - Notification to individuals (60 days)',
    dpdpa: 'Section 8 - Breach notification (72 hours)',
    ukGdpr: 'Art. 33 - Notification to ICO (72 hours)',
    file: 'server/src/middleware/compliance.ts',
  },
} as const;
