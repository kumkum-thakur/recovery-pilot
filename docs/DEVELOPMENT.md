# Development Guide

## Prerequisites

- **Node.js** >= 18.0.0 (22.x recommended)
- **npm** >= 9.0.0
- **Git** >= 2.30

## Quick Setup

```bash
git clone https://github.com/kumkum-thakur/recovery-pilot.git
cd recovery-pilot
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Patient | `divya` | `divya` |
| Doctor | `dr.smith` | `smith` |
| Admin | `admin` | `admin` |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR (port 5173) |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint on all TypeScript files |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:ui` | Open Vitest interactive UI |
| `npm run test:coverage` | Generate test coverage report |

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_KEY` | No | Google Gemini API key for wound analysis |
| `VITE_GEMINI_KEY` | No | Same key, exposed to Vite client bundle |

Without the Gemini key, wound analysis uses a simulated fallback mode.

## Project Structure

```
src/
├── main.tsx            # App entry point
├── App.tsx             # Root component with router (40+ routes)
├── index.css           # Global styles (TailwindCSS)
├── types/index.ts      # All TypeScript type definitions (3,200+ lines)
├── components/         # 37 reusable React components
├── pages/              # Page-level components
├── stores/             # Zustand state stores
├── services/           # 80+ service modules (business logic, algorithms, ML)
├── hooks/              # Custom React hooks
├── medical-review/     # AI image analysis subsystem
└── test/               # Test setup and shared test data
```

## Adding a New Feature

### 1. Define Types

Add interfaces to `src/types/index.ts`:

```typescript
export interface MyFeatureData {
  id: string;
  patientId: string;
  value: number;
  timestamp: string;
}
```

### 2. Create Service

Create `src/services/myFeatureService.ts`:

```typescript
import type { MyFeatureData } from '../types';

export function calculateScore(data: MyFeatureData): number {
  // Implementation with clinical citation in comments
  return score;
}
```

### 3. Create Store (if needed)

Add to `src/stores/featureStores.ts` or create a new store:

```typescript
import { create } from 'zustand';

interface MyFeatureStore {
  data: MyFeatureData[];
  addEntry: (entry: MyFeatureData) => void;
}

export const useMyFeatureStore = create<MyFeatureStore>((set) => ({
  data: [],
  addEntry: (entry) => set((s) => ({ data: [...s.data, entry] })),
}));
```

### 4. Create Component

Create `src/components/MyFeature.tsx` with co-located test file.

### 5. Add Route

Add to `src/App.tsx` inside the appropriate role's routes.

### 6. Write Tests

Create `src/services/myFeatureService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateScore } from './myFeatureService';

describe('myFeatureService', () => {
  it('calculates score correctly', () => {
    const data = { /* test data */ };
    expect(calculateScore(data)).toBe(expectedValue);
  });
});
```

## Adding a Clinical Algorithm

Clinical algorithms have additional requirements:

1. **Cite the source** -- Add a JSDoc comment with the paper reference
2. **Match published scoring** -- Point values and thresholds must exactly match the source
3. **Test against known outcomes** -- Use published validation data as test cases
4. **Update docs** -- Add entry to `docs/ALGORITHMS.md`

## Code Style

- **TypeScript strict mode** is enforced
- **ESLint** with React hooks and React Refresh rules
- **TailwindCSS** for styling (no CSS modules or styled-components)
- **Functional components** only (no class components)
- **Named exports** preferred over default exports

## Debugging

### Debug Menu

Press `Ctrl+Shift+D` to toggle the debug menu, which allows:
- Switching demo scenarios (Happy Path vs. Risk Detected)
- Resetting application state
- Viewing store contents

### Database Reset

If the app enters a bad state, clear localStorage:

```javascript
// In browser console
localStorage.clear();
location.reload();
```

Or use the reset page at `/reset-database.html`.

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. The build:
1. Runs TypeScript type checking (`tsc -b`)
2. Bundles with Vite/Rolldown (tree-shaking, minification, code splitting)
3. Generates static HTML, CSS, and JS files ready for any static hosting
