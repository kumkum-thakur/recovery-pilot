# Testing Guide

## Overview

RecoveryPilot has a comprehensive test suite: **259 test files** containing **2,727 test cases** covering unit tests, integration tests, end-to-end workflows, property-based tests, and clinical algorithm validation.

## Running Tests

```bash
# Run all tests in watch mode
npm run test

# Run tests once (CI mode)
npx vitest run

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage

# Run specific test file
npx vitest run src/services/sepsisEarlyWarningSystem.test.ts

# Run tests matching a pattern
npx vitest run --grep "qSOFA"
```

## Test Architecture

### Framework

- **Vitest 4.0** -- Test runner (Jest-compatible API)
- **jsdom** -- Browser environment simulation
- **React Testing Library** -- Component rendering and DOM queries
- **fast-check** -- Property-based testing with random input generation

### Setup

Tests are configured in `vite.config.ts`:

```typescript
test: {
  globals: true,           // describe, it, expect available globally
  environment: 'jsdom',    // Simulated browser DOM
  setupFiles: './src/test/setup.ts',
  css: true,               // Process CSS imports
}
```

The setup file (`src/test/setup.ts`) configures:
- Testing Library matchers (toBeInTheDocument, etc.)
- LocalStorage mock
- Global test utilities

## Test Categories

### Unit Tests (~180 files, ~2,000 tests)

Test individual functions and components in isolation.

**Service tests** (`*.test.ts`):
```typescript
describe('bloodGlucoseMonitor', () => {
  it('classifies glucose 150 as IN_TARGET', () => {
    const result = classifyGlucose(150);
    expect(result.status).toBe('IN_TARGET');
  });

  it('calculates correction factor using 1800 rule', () => {
    const factor = calculateCorrectionFactor(60); // TDD = 60 units
    expect(factor).toBe(30); // 1800/60 = 30 mg/dL per unit
  });
});
```

**Component tests** (`*.test.tsx`):
```typescript
describe('MissionCard', () => {
  it('renders mission title and status', () => {
    render(<MissionCard mission={mockMission} />);
    expect(screen.getByText('Scan Incision')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
});
```

### Integration Tests (~40 files, ~400 tests)

Test cross-service interactions and data flow.

Key integration test suites:
- `realworld-integration-validation.test.ts` -- Service interaction chains
- `realworld-clinical-services-validation.test.ts` -- All 18 clinical services working together

### E2E Workflow Tests (~10 files, ~100 tests)

Test complete user workflows end-to-end.

- `e2e-user-workflow-validation.test.ts` -- Full patient login → mission → photo upload → triage flow
- Patient dashboard rendering and interaction flows
- Doctor triage inbox → approve/reject workflows

### Property-Based Tests (~15 files, ~200 tests)

Use `fast-check` to generate random inputs and verify invariants hold.

```typescript
import * as fc from 'fast-check';

it('NRS-2002 total score is always 0-7', () => {
  fc.assert(fc.property(
    fc.boolean(), fc.boolean(), fc.boolean(),
    fc.integer({ min: 0, max: 100 }),
    fc.constantFrom('absent', 'mild', 'moderate', 'severe'),
    fc.boolean(),
    (bmi, wl, reduced, intake, severity, age) => {
      const result = calculateNRS2002({
        bmiLessThan20_5: bmi,
        weightLossGreaterThan5Percent3Months: wl,
        reducedIntakePastWeek: reduced,
        foodIntakePercent: intake,
        severityOfDisease: severity,
        ageOver70: age,
      });
      return result.totalScore >= 0 && result.totalScore <= 7;
    }
  ));
});
```

### Clinical Validation Tests (5 files, ~100 tests)

Verify clinical algorithms produce correct outputs for known clinical scenarios.

- `realworld-ml-models-validation.test.ts` -- ML model accuracy against expected outcomes
- Algorithm-specific tests verify scoring matches published validation data

## Test Data

### Deterministic Seeds

Tests use 5 deterministic seeds for reproducible clinical scenarios:

| Seed | Purpose |
|------|---------|
| 42 | Standard healthy patient |
| 137 | Patient with moderate risk factors |
| 256 | Complex multi-comorbidity patient |
| 389 | Post-surgical recovery patient |
| 501 | Edge-case/boundary patient |

### Test Data Location

- `src/test/realWorldTestData.ts` -- Shared realistic patient data
- `src/test/setup.ts` -- Global test configuration

## Writing New Tests

### Naming Convention

- Service tests: `serviceName.test.ts`
- Component tests: `ComponentName.test.tsx`
- Integration tests: `featureName.integration.test.ts`
- Property tests: `serviceName.property.test.ts`

### Clinical Algorithm Tests

For clinical algorithms, always include tests that verify:

1. **Known score calculations** -- Use published examples from the source paper
2. **Boundary values** -- Test at scoring thresholds (e.g., qSOFA score 1 vs. 2)
3. **Risk stratification** -- Verify correct risk level assignment
4. **Edge cases** -- Missing data, extreme values, zero inputs

### Guidelines

- Each test should test one thing
- Use descriptive test names: `it('classifies qSOFA score >= 2 as sepsis likely')`
- Avoid testing implementation details -- test behavior
- Mock external dependencies (LocalStorage, API calls)
- Keep tests independent -- no shared mutable state between tests
