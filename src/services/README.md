# Services Layer

This directory contains the service layer for RecoveryPilot, including data persistence, authentication, and agent services.

## Seed Data

The `seedData.ts` file provides default users and missions for MVP testing and development.

### Default Users

#### Patient: Divya Patel
- **Username**: `divya`
- **Password**: `divya` (hashed as `simple_hash_divya`)
- **User ID**: `patient-1`
- **Initial Streak**: 3 days

#### Doctor: Dr. Sarah Smith
- **Username**: `dr.smith`
- **Password**: `smith` (hashed as `simple_hash_smith`)
- **User ID**: `doctor-1`

### Default Missions

Two initial missions are created for the patient:

1. **Mission 1: Scan Incision** (Photo Upload)
   - Take a photo of surgical incision for healing assessment
   - Status: Pending

2. **Mission 2: Medication Check** (Medication Check)
   - Confirm morning antibiotics were taken
   - Status: Pending

### Usage

To initialize the database with seed data on application startup:

```typescript
import { persistenceService, initializeSeedData } from './services';

// Call this in your main.tsx or App.tsx
initializeSeedData(persistenceService);
```

The `initializeSeedData` function will:
- Check if users exist in LocalStorage
- If no users exist, create the default patient and doctor
- Check if missions exist in LocalStorage
- If no missions exist, create the default missions
- Log initialization status to console

This ensures that the application always has test data available for development and demonstration purposes.

### Password Hashing

For the MVP, we use a simple password hashing scheme:
- Password hash format: `simple_hash_<password>`
- Example: password "divya" → hash "simple_hash_divya"

**Note**: This is for MVP/demo purposes only. Production systems should use proper password hashing (bcrypt, argon2, etc.).

## Persistence Service

The `persistenceService.ts` file provides a LocalStorage-based persistence layer with:

- Generic CRUD operations (get, set, update, delete)
- Domain-specific methods for users, missions, and action items
- Comprehensive error handling
- JSON serialization/deserialization

See the [design document](../../.kiro/specs/recovery-pilot/design.md) for detailed API documentation.

## Testing

Run tests for the services layer:

```bash
# Run all service tests
npm test -- services/

# Run specific test file
npm test -- seedData.test.ts
npm test -- persistenceService.test.ts
```
