# Medical Image Review and AI Feedback System

This module implements a two-tier review workflow for patient-uploaded wound images, ensuring patient safety through mandatory doctor oversight while building a feedback loop to improve AI accuracy over time.

## Architecture

The system is organized into the following layers:

### Data Layer
- **storage/** - Image storage with metadata and associations
- **audit/** - Immutable audit logging for medical accountability

### Analysis Layer
- **analysis/** - AI preliminary analysis
- **workflow/** - Review workflow orchestration

### Feedback Layer
- **feedback/** - AI accuracy grading and performance tracking

### Presentation Layer
- **api/** - REST API endpoints for doctor review interface
- **ui/** - React components for doctor dashboard and review interface

## Key Features

1. **Two-Tier Review Process**
   - AI provides preliminary analysis (non-authoritative)
   - Doctors provide final authoritative medical assessment

2. **AI Feedback Loop**
   - Doctors grade AI accuracy (Correct, Partially Correct, Incorrect)
   - System tracks performance metrics over time
   - Feedback informs AI model improvements

3. **Medical Accountability**
   - Doctors remain legally accountable for all decisions
   - Complete audit trail for compliance
   - Clear disclaimers on AI preliminary reports

4. **Access Control**
   - Doctors only access images from assigned patients
   - Patients only see doctor's final review (not AI preliminary)

## Testing Strategy

This system uses **dual testing approach**:

### Unit Tests
- Specific examples and edge cases
- Error handling scenarios
- UI component behavior

### Property-Based Tests
- 26 correctness properties from design document
- Minimum 100 iterations per property
- Uses fast-check library for random data generation

## Getting Started

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/medical-review/storage/ImageStorageSystem.test.ts
```

### Directory Structure

```
src/medical-review/
├── types.ts              # Shared type definitions
├── interfaces.ts         # Component interfaces
├── test-setup.ts         # Test utilities and generators
├── storage/              # Image storage system
├── analysis/             # AI preliminary analyzer
├── feedback/             # AI feedback collector
├── audit/                # Audit log system
├── workflow/             # Review workflow manager
├── api/                  # API endpoints
└── ui/                   # React components
```

## Implementation Progress

See `.kiro/specs/medical-image-review-system/tasks.md` for detailed implementation tasks and progress tracking.

## Requirements

- TypeScript 5.9+
- React 19+
- Vitest for testing
- fast-check for property-based testing
