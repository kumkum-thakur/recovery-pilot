# Error Boundary Implementation

## Overview

This document describes the error boundary implementation for RecoveryPilot, which catches and handles React component errors gracefully instead of crashing the entire application.

## Components

### 1. ErrorBoundary (`ErrorBoundary.tsx`)

The main error boundary component that wraps the entire application.

**Features:**
- Catches JavaScript errors anywhere in the child component tree
- Logs errors to console with detailed information
- Displays user-friendly fallback UI
- Provides recovery options (Try Again, Go Home)
- Shows detailed error information in development mode
- Supports custom error handlers via `onError` prop
- Supports custom fallback UI via `fallback` prop

**Usage:**
```tsx
<ErrorBoundary onError={handleError}>
  <App />
</ErrorBoundary>
```

**Props:**
- `children`: ReactNode - The components to wrap
- `fallback?`: ReactNode - Custom fallback UI (optional)
- `onError?`: (error: Error, errorInfo: ErrorInfo) => void - Custom error handler (optional)

### 2. RouteErrorBoundary (`RouteErrorBoundary.tsx`)

A specialized error boundary for route-level errors.

**Features:**
- Lighter-weight than the main ErrorBoundary
- Provides route-specific error context
- Includes "Go Back" navigation option
- Logs errors with route information

**Usage:**
```tsx
<RouteErrorBoundary routeName="Patient Dashboard">
  <PatientDashboard />
</RouteErrorBoundary>
```

**Props:**
- `children`: ReactNode - The route component to wrap
- `routeName?`: string - Name of the route for error context (optional)

### 3. Error Logger Service (`errorLogger.ts`)

Centralized error logging service for the application.

**Features:**
- Structured error logging with context
- Severity levels (low, medium, high, critical)
- Console logging with color-coding
- Ready for integration with external error tracking services (Sentry, LogRocket, etc.)
- Supports warnings and info messages

**Usage:**
```tsx
import { errorLogger } from '../services/errorLogger';

// Log a regular error
errorLogger.logError(error, { route: '/patient', userId: '123' }, 'high');

// Log a React error boundary error
errorLogger.logBoundaryError(error, errorInfo, { userId: '123' });

// Log a warning
errorLogger.logWarning('Something unusual happened', { context: 'data' });

// Log info (development only)
errorLogger.logInfo('Debug information', { data: someData });
```

## Implementation in App.tsx

The error boundaries are integrated into the App component at two levels:

1. **Application Level**: The entire app is wrapped in an `ErrorBoundary` that catches any unhandled errors
2. **Route Level**: Each route is wrapped in a `RouteErrorBoundary` for route-specific error handling

```tsx
<ErrorBoundary onError={handleAppError}>
  <BrowserRouter>
    <Routes>
      <Route 
        path="/login" 
        element={
          <RouteErrorBoundary routeName="Login">
            <LoginPage />
          </RouteErrorBoundary>
        } 
      />
      {/* Other routes... */}
    </Routes>
  </BrowserRouter>
</ErrorBoundary>
```

## Error Logging

All errors caught by error boundaries are logged with:
- Error message and stack trace
- Component stack (React component tree)
- Route information
- User context (ID and role)
- Timestamp

In development mode:
- Errors are logged to console with color-coding
- Detailed error information is displayed in the UI

In production mode:
- Errors are logged to console
- Ready to send to external error tracking service
- Minimal error information shown to users

## User Experience

When an error occurs:

1. **Application-level error**: Shows a full-screen error page with:
   - Friendly error message
   - "Try Again" button (resets error state)
   - "Go Home" button (navigates to home)
   - Error details (development only)

2. **Route-level error**: Shows a centered error card with:
   - Route-specific error message
   - "Go Back" button (navigates to previous page)
   - Error details (development only)

## Future Enhancements

The error logging service is designed to be easily extended with:

1. **External Error Tracking**: Uncomment and configure Sentry, LogRocket, or similar services in `errorLogger.ts`
2. **User Feedback**: Add a feedback form to the error UI
3. **Error Recovery Strategies**: Implement automatic retry logic for specific error types
4. **Error Analytics**: Track error patterns and frequencies
5. **Custom Error Pages**: Create specific error pages for different error types

## Testing Error Boundaries

To test error boundaries in development:

1. **Throw an error in a component**:
```tsx
function TestComponent() {
  throw new Error('Test error');
  return <div>This won't render</div>;
}
```

2. **Trigger an error in an event handler**:
```tsx
function TestComponent() {
  const handleClick = () => {
    throw new Error('Test error');
  };
  return <button onClick={handleClick}>Trigger Error</button>;
}
```

3. **Simulate an async error**:
```tsx
function TestComponent() {
  useEffect(() => {
    throw new Error('Test async error');
  }, []);
  return <div>Component</div>;
}
```

## Requirements

This implementation satisfies:
- **Task 21.1**: Add error boundaries for React components
  - ✅ Catch and display component errors gracefully
  - ✅ Log errors for debugging

## Related Files

- `src/components/ErrorBoundary.tsx` - Main error boundary component
- `src/components/RouteErrorBoundary.tsx` - Route-level error boundary
- `src/services/errorLogger.ts` - Error logging service
- `src/App.tsx` - Error boundary integration
