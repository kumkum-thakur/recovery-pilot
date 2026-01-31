# AuthService Implementation

## Overview

The AuthService provides authentication and session management for the RecoveryPilot application. It handles user login, logout, credential validation, and session persistence.

## Features Implemented

### 1. Simple Password Hashing (MVP)
- Uses a simple prefix-based hashing: `simple_hash_${password}`
- **Note**: In production, this should be replaced with bcrypt or similar
- Consistent hashing ensures reliable credential validation

### 2. Credential Validation
- Validates username and password against stored user data
- Returns boolean result without exposing sensitive information
- Handles edge cases: empty credentials, special characters, case sensitivity

### 3. Session Management
- Uses `sessionStorage` for current user session
- Persists user data across page reloads (within same tab)
- Provides methods to get, update, and clear current user
- Handles corrupted session data gracefully

### 4. Login/Logout Functionality
- **Login**: Authenticates user, updates last login date, creates session
- **Logout**: Clears session data
- **Security**: Error messages don't reveal whether username exists

## API Reference

### `login(username: string, password: string): Promise<User>`
Authenticates a user and creates a session.

**Parameters:**
- `username`: User's username
- `password`: User's password (plain text)

**Returns:** Promise resolving to authenticated User object

**Throws:** `AuthenticationError` if credentials are invalid

**Example:**
```typescript
try {
  const user = await authService.login('divya', 'divya');
  console.log(`Welcome, ${user.name}!`);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### `logout(): void`
Logs out the current user and clears the session.

**Example:**
```typescript
authService.logout();
```

### `getCurrentUser(): User | null`
Gets the currently authenticated user from session.

**Returns:** Current user or null if not authenticated

**Example:**
```typescript
const user = authService.getCurrentUser();
if (user) {
  console.log(`Current user: ${user.name}`);
}
```

### `validateCredentials(username: string, password: string): boolean`
Validates user credentials without creating a session.

**Parameters:**
- `username`: Username to validate
- `password`: Password to validate

**Returns:** true if credentials are valid, false otherwise

**Example:**
```typescript
if (authService.validateCredentials('divya', 'divya')) {
  console.log('Credentials are valid');
}
```

### `isAuthenticated(): boolean`
Checks if a user is currently authenticated.

**Returns:** true if user is authenticated, false otherwise

**Example:**
```typescript
if (authService.isAuthenticated()) {
  // Show authenticated content
}
```

### `updateCurrentUser(user: User): void`
Updates the current user's data in the session.

**Parameters:**
- `user`: Updated user data

**Throws:** `AuthenticationError` if no user is authenticated

**Example:**
```typescript
const user = authService.getCurrentUser();
if (user) {
  user.streakCount = 5;
  authService.updateCurrentUser(user);
}
```

## Usage Examples

### Patient Login Flow
```typescript
import { authService } from './services';

async function loginPatient() {
  try {
    const user = await authService.login('divya', 'divya');
    
    if (user.role === 'patient') {
      console.log(`Welcome back, ${user.name}!`);
      console.log(`Current streak: ${user.streakCount} days`);
      // Navigate to patient dashboard
    }
  } catch (error) {
    console.error('Login failed:', error.message);
    // Show error message to user
  }
}
```

### Doctor Login Flow
```typescript
async function loginDoctor() {
  try {
    const user = await authService.login('dr.smith', 'smith');
    
    if (user.role === 'doctor') {
      console.log(`Welcome, ${user.name}!`);
      // Navigate to doctor dashboard
    }
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}
```

### Protected Route Check
```typescript
function ProtectedRoute({ children }) {
  if (!authService.isAuthenticated()) {
    // Redirect to login
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

### Logout Flow
```typescript
function handleLogout() {
  authService.logout();
  // Navigate to login page
  navigate('/login');
}
```

## Security Considerations

### Current Implementation (MVP)
1. **Simple Password Hashing**: Uses prefix-based hashing for MVP
2. **Session Storage**: Uses sessionStorage (cleared on tab close)
3. **Error Messages**: Generic messages that don't reveal username existence

### Production Recommendations
1. **Password Hashing**: Replace with bcrypt, argon2, or similar
2. **Session Management**: Consider JWT tokens with refresh mechanism
3. **HTTPS Only**: Ensure all authentication happens over HTTPS
4. **Rate Limiting**: Add rate limiting to prevent brute force attacks
5. **Password Requirements**: Enforce strong password policies
6. **Two-Factor Authentication**: Consider adding 2FA for enhanced security

## Testing

### Unit Tests (33 tests)
- Credential validation (valid/invalid credentials)
- Login functionality (success/failure cases)
- Logout functionality
- Session management
- Security (error message consistency)
- Edge cases (special characters, case sensitivity)

### Integration Tests (12 tests)
- Full authentication flow with persistence
- Session persistence across service calls
- User data updates
- Multiple user sessions

**Run tests:**
```bash
npm test -- authService.test.ts
npm test -- authService.integration.test.ts
```

## Requirements Satisfied

- ✅ **Requirement 1.1**: Patient authentication with valid credentials
- ✅ **Requirement 1.2**: Patient authentication rejection with invalid credentials
- ✅ **Requirement 2.1**: Doctor authentication with valid credentials
- ✅ **Requirement 2.2**: Doctor authentication rejection with invalid credentials

## Files Created

1. `src/services/authService.ts` - Main implementation
2. `src/services/authService.test.ts` - Unit tests (33 tests)
3. `src/services/authService.integration.test.ts` - Integration tests (12 tests)
4. `src/services/README_AUTH.md` - This documentation

## Next Steps

The AuthService is now ready to be integrated with:
1. **UserStore** (Task 5.1) - Zustand store for user state management
2. **LoginPage** (Task 9.1) - UI component for user login
3. **Protected Routes** (Task 8) - Route guards for authenticated access

## Error Handling

### AuthenticationError
Custom error class for authentication failures.

**Common scenarios:**
- Invalid username or password
- Empty credentials
- No user authenticated (for updateCurrentUser)
- Session creation failure

**Example:**
```typescript
try {
  await authService.login('user', 'pass');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication error
    console.error('Auth error:', error.message);
  }
}
```

## Maintenance Notes

- Password hashing function is centralized and easy to replace
- Session storage key is configurable via constant
- All methods include comprehensive error handling
- Service is exported as singleton for consistent state
