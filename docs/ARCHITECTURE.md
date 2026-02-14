# Architecture

## System Overview

RecoveryPilot is a single-page application (SPA) built with React 19 and TypeScript 5.9. The architecture follows a layered pattern: UI components at the top, Zustand stores for state management, and a service layer for business logic, clinical algorithms, and ML models.

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                     │
│  Pages (LoginPage, PatientDashboard, DoctorDashboard,   │
│         AdminDashboard, FeatureHub, FeaturePages)        │
│  Components (37 reusable UI components)                  │
├─────────────────────────────────────────────────────────┤
│                    State Layer (Zustand)                  │
│  Primary: userStore, missionStore, agentStore,           │
│           actionItemStore, configStore, carePlanStore     │
│  Feature: painStore, vitalsStore, chatStore,             │
│           journalStore, sleepStore, nutritionStore, ...   │
├─────────────────────────────────────────────────────────┤
│                    Service Layer (80+)                    │
│  Clinical Decision Support (8 services)                  │
│  ML Models (14 pure-TypeScript models)                   │
│  Agent & Workflow (3 services)                           │
│  Care Planning (5 services)                              │
│  Tracking & Monitoring (15 services)                     │
│  Communication (4 services)                              │
│  Data & Compliance (8 services)                          │
│  + 20 more services                                      │
├─────────────────────────────────────────────────────────┤
│                    Data Layer                             │
│  LocalStorage (persistence) | Gemini API (external AI)   │
│  Seed Data (initialization) | FHIR (export format)       │
└─────────────────────────────────────────────────────────┘
```

## Presentation Layer

### Pages

| Page | Role | Layout | File |
|------|------|--------|------|
| `LoginPage` | Authentication | Centered form | `pages/LoginPage.tsx` |
| `PatientDashboard` | Patient hub | Mobile-first, card-based | `pages/PatientDashboard.tsx` |
| `DoctorDashboard` | Doctor triage | Desktop-optimized, inbox-style | `pages/DoctorDashboard.tsx` |
| `AdminDashboard` | System management | Admin panels | `pages/AdminDashboard.tsx` |
| `FeatureHub` | Feature discovery | Grid navigation | `pages/FeatureHub.tsx` |
| `FeaturePages` | 18 patient features | Individual feature UIs | `pages/FeaturePages.tsx` |
| `ClinicalFeaturePages` | 32 clinical features | Advanced clinical UIs | `pages/ClinicalFeaturePages.tsx` |

### Component Categories

**Core UI**: Header, ProtectedRoute, ErrorBoundary, RouteErrorBoundary, SessionMonitor
**Patient**: MissionCard, MissionStream, PhotoCaptureModal, StreakDisplay, CelebrationOverlay, PainTracker, SymptomChecker, NutritionTracker, JournalEntry
**Doctor**: TriageResultCard, AgentStatusToast, CarePlanPanel, CarePlanForm, TemplateSelector, MedicationForm, MissionScheduleEditor, CarePlanOverviewDashboard
**Shared**: NotificationBadge, ProfileButton

### Routing

React Router 7.13 handles 40+ routes with:
- `ProtectedRoute` wrapping all authenticated pages
- Role-based route guards (patient, doctor, admin)
- `RouteErrorBoundary` for per-route error isolation
- Lazy loading for code splitting

## State Management

### Zustand Store Architecture

Zustand was chosen over Redux for its minimal boilerplate and direct mutation API. Each store is an independent module with no cross-store dependencies.

**7 Primary Stores:**

| Store | Purpose | Key State |
|-------|---------|-----------|
| `useUserStore` | Authentication, current user | `currentUser`, `isAuthenticated`, `login()`, `logout()` |
| `useMissionStore` | Patient recovery missions | `missions[]`, `completeMission()`, `resetStreak()` |
| `useAgentStore` | AI workflow execution | `steps[]`, `currentStep`, `isRunning`, `startWorkflow()` |
| `useActionItemStore` | Doctor triage inbox | `items[]`, `approve()`, `reject()`, `filter()` |
| `useConfigStore` | Demo scenario config | `scenario`, `setScenario()` |
| `useCarePlanStore` | Care plan management | `plans[]`, `createPlan()`, `applyTemplate()` |
| Feature stores (15) | Domain-specific state | Pain, vitals, chat, journal, sleep, nutrition, etc. |

### Data Flow

```
User Action → Component → Store Action → Service Call → Store Update → Re-render
                                              ↓
                                    LocalStorage Persist
```

## Service Layer

### Organization

Services are organized by clinical domain. Each service is a standalone module exporting functions -- no classes, no singletons, no framework coupling.

```
src/services/
├── Clinical Decision Support/
│   ├── sepsisEarlyWarningSystem.ts     # qSOFA, SIRS, SOFA
│   ├── dvtRiskCalculator.ts            # Caprini, Wells, Geneva
│   ├── fallRiskAssessment.ts           # Morse, Hendrich II
│   ├── nutritionalRiskScreening.ts     # NRS-2002, MUST, SGA
│   ├── ssiPredictor.ts                 # NNIS, CDC SSI
│   ├── bloodGlucoseMonitor.ts          # ADA targets, sliding scale
│   ├── antibioticStewardshipEngine.ts  # IDSA, CYP450
│   └── painProtocolEngine.ts           # WHO analgesic ladder
├── ML Models/
│   ├── recoveryPredictionModel.ts      # Logistic regression
│   ├── anomalyDetectionEngine.ts       # Mahalanobis, Z-score
│   ├── sentimentAnalysisEngine.ts      # TF-IDF + medical lexicon
│   ├── patientClusteringEngine.ts      # K-means
│   └── ... (14 total)
├── Agent & Workflow/
│   ├── agentService.ts                 # Triage automation
│   ├── geminiService.ts                # Google Gemini Vision API
│   └── missionGenerationService.ts     # Mission creation
└── ... (80+ total)
```

### Service Design Principles

1. **Pure functions** -- No side effects except persistence calls
2. **Type-safe** -- All inputs/outputs typed with TypeScript interfaces
3. **Self-contained** -- Each service works independently
4. **Evidence-based** -- Clinical services cite their source literature
5. **Testable** -- No hidden dependencies, easy to mock

## Data Layer

### Persistence Strategy

**Current (MVP):** Browser LocalStorage with JSON serialization

| Key | Data | Size |
|-----|------|------|
| `recovery_pilot_users` | User profiles and credentials | ~1KB |
| `recovery_pilot_missions` | Patient missions | ~2KB |
| `recovery_pilot_action_items` | Doctor triage items | ~3KB |
| `recovery_pilot_care_plans` | Care plans | ~5KB |
| `recovery_pilot_config` | App configuration | <1KB |
| Feature-specific keys | Pain, vitals, chat, etc. | Variable |

**Error handling:**
- JSON parse failure → automatic reinitialization from seed data
- Quota exceeded → storage error handler with user notification
- Corruption detection → full reset with seed data restoration

### Seed Data

On first launch (or after corruption), the app initializes with:
- 3 default users (patient, doctor, admin)
- 2 starter missions for the patient
- 1 patient-doctor relationship
- Empty action items and care plans

### External Integrations

**Google Gemini Vision API** (optional):
- Used for real wound image analysis
- Falls back to simulation mode if API key is not configured
- Request/response flow: image → base64 encode → Gemini multimodal → parse response → confidence score + classification

## Type System

The core type definitions (`src/types/index.ts`, 3,200+ lines) serve as the single source of truth for all data shapes:

- **User domain**: `User`, `UserModel`, `UserRole`
- **Mission domain**: `Mission`, `MissionModel`, `MissionType`, `MissionStatus`
- **Clinical domain**: `ActionItem`, `TriageData`, `TriageAnalysis`, `InsuranceStatus`
- **Care planning**: `CarePlan`, `CarePlanMission`, `MedicationPrescription`, `CarePlanTemplate`
- **Agent workflow**: `AgentStep`, `AgentStepStatus`
- **Medical review**: `StoredImage`, `PreliminaryReport`, `FinalReview`, `AIAccuracyGrade`

## Build and Tooling

### Build Pipeline

```
Source (.tsx/.ts) → TypeScript Compiler (type check) → Vite/Rolldown (bundle) → dist/
```

- **Dev**: Vite HMR with React Fast Refresh (~50ms updates)
- **Production**: Rolldown bundler with tree-shaking, code splitting, minification
- **Type checking**: `tsc -b` with project references (`tsconfig.app.json` + `tsconfig.node.json`)

### Testing Architecture

```
Vitest Runner
├── jsdom environment (browser simulation)
├── React Testing Library (component rendering)
├── fast-check (property-based generation)
└── Setup file (src/test/setup.ts)
```

## Security Architecture

- **Authentication**: Password hashing with constant-time comparison
- **Session management**: Automatic timeout with `SessionMonitor` component
- **Role-based access**: `ProtectedRoute` enforces role requirements per route
- **Audit trail**: `auditLogService.ts` logs all clinical actions immutably
- **Data export**: Anonymization pipeline for research datasets
- **Input sanitization**: All user inputs validated before processing

## Performance Considerations

- **Code splitting**: Route-based lazy loading via React Router
- **Zustand subscriptions**: Components subscribe to specific store slices, not entire stores
- **Memoization**: Expensive computations cached with `useMemo`/`useCallback`
- **Static assets**: Aggressive caching (1 year) via Nginx config
- **Gzip compression**: Enabled in production Nginx config
- **Tree-shaking**: Unused code eliminated by Rolldown bundler
