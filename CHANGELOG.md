# Changelog

All notable changes to RecoveryPilot are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-01

### Added

#### Core Platform
- Patient dashboard with mobile-first responsive design
- Doctor dashboard with desktop-optimized triage inbox
- Admin dashboard with user management and system controls
- Role-based authentication (patient, doctor, admin)
- Session management with automatic timeout and expiration warnings

#### Clinical Decision Support (40+ Algorithms)
- **Sepsis screening**: qSOFA (Singer et al., JAMA 2016), SIRS (Bone et al., Chest 1992), SOFA (Vincent et al., ICM 1996)
- **VTE risk assessment**: Caprini Score (Caprini, 2001), Wells Score for DVT (Wells et al., NEJM 2003), Wells Score for PE, Revised Geneva Score
- **Fall risk**: Morse Fall Scale (Morse, 1989), Hendrich II Fall Risk Model (Hendrich, 2003), Timed Up and Go test
- **Nutritional risk**: NRS-2002 (Kondrup et al., 2003), MUST (BAPEN, 2003), SGA (Detsky et al., 1987), Harris-Benedict and Mifflin-St Jeor equations
- **Surgical site infection**: NNIS Risk Index (Culver et al., 1991), CDC SSI Classification, ASA Physical Status, ASEPSIS scoring
- **Blood glucose**: ADA inpatient targets, sliding scale insulin protocols, HbA1c estimation (ADAG formula), hypoglycemia management (15/15 rule)
- **Vital sign monitoring**: NEWS2 (RCP, 2017), MEWS (Subbe et al., 2001), exponential smoothing forecasting (Holt's method)
- **Antibiotic stewardship**: IDSA guidelines, CYP450 drug interactions (30+ antibiotics), spectrum profiling, renal dose adjustments
- **Pain management**: WHO analgesic ladder protocols
- **Additional**: Charlson Comorbidity Index, LACE readmission index, SBAR handoff format, HCAHPS satisfaction

#### Machine Learning Models (14 Pure TypeScript)
- Recovery trajectory prediction (logistic regression + decision trees)
- Composite risk scoring (LACE + CCI + ASA)
- Vital sign anomaly detection (Mahalanobis distance, Z-score, IQR)
- Patient journal sentiment analysis (TF-IDF + 300-word medical lexicon)
- Symptom-to-condition mapping (Bayesian probability matrix)
- Self-learning engine with online calibration and concept drift detection
- Drug interaction checker (CYP450 enzyme pathways, 50+ drugs)
- 30-day readmission risk prediction (LACE + comorbidity weighting)
- Wound healing phase classification
- Medication adherence prediction (behavioral regression)
- Clinical NLP engine (tokenization + UMLS-based mapping)
- Complication prediction (Bayesian network with DAG inference)
- Patient segmentation (K-means clustering)
- Treatment response prediction (outcome regression)

#### Patient Engagement
- Daily recovery missions (photo upload, medication check, exercise log)
- Gamification system (streaks, XP, badges with 5 categories, leaderboard, challenges)
- Celebration overlays with confetti animations
- Pain tracking with trend analysis and trigger identification
- Vital signs monitoring with NEWS2 scoring
- Symptom checker with Bayesian probability mapping
- Nutrition tracking with macronutrient analysis
- Sleep quality tracking with circadian rhythm analysis
- Journal with mood logging and sentiment analysis
- Wearable device integration (Fitbit, Apple Watch, Garmin)
- Plain-language medical education content

#### Doctor Workflows
- AI-triaged inbox with confidence scores
- One-click approve/reject with timestamped audit trail
- Care plan management with templates and custom missions
- Medication prescription tracking
- Refill automation with insurance verification
- SBAR handoff note generation
- Lab result interpretation
- Workload balancing across care team

#### AI Integration
- Google Gemini Vision API for wound photo analysis
- Agent workflow simulation with step-by-step progress
- Triage analysis with GREEN/RED risk classification
- Confidence scoring for AI recommendations

#### Backend Server
- Express 5 API server scaled for 2M patients/day
- PostgreSQL database with Knex query builder and migrations
- Redis caching and session management via ioredis
- BullMQ job queues for async processing
- JWT authentication with Passport.js (access + refresh tokens)
- Argon2id password hashing with bcrypt fallback
- TOTP-based 2FA support via otplib
- Zod schema validation on all endpoints
- Pino structured logging with pino-http request tracing
- Helmet.js security headers
- Rate limiting (express-rate-limit + rate-limiter-flexible)
- AWS S3 file storage, KMS encryption, Secrets Manager integration

#### Infrastructure
- Kubernetes manifests with network policies and pod security
- Terraform infrastructure-as-code modules
- Docker Compose production configuration
- Nginx reverse proxy with TLS and security headers
- Prometheus + Grafana monitoring stack
- Backup and disaster recovery automation

#### Data and Compliance
- Immutable audit logging for all clinical actions
- HL7 FHIR R4 resource generation
- Data export (JSON, CSV, FHIR bundles)
- Patient data anonymization
- Consent management workflows
- Insurance claims integration
- Security controls aligned with HIPAA, DPDPA, and UK GDPR

#### Frontend Infrastructure
- React 19 + TypeScript 5.9 (strict mode)
- Zustand state management (7 primary + 15 feature stores)
- Vite/Rolldown build system
- TailwindCSS with medical/gamification theme
- 259 test files with 2,727 test cases
- Property-based testing with fast-check
- Deterministic seed data (5 seeds) for reproducible testing
- Automated deployment scripts (autoconfig.sh, autoconfig.bat, autodeploy-k8s.sh)

### Security
- Password hashing with Argon2id and constant-time comparison
- JWT token rotation with configurable expiry
- Role-based access control with route-level enforcement
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Rate limiting and DDoS protection
- Input validation via Zod schemas
- No real patient data -- all synthetic/demo data
