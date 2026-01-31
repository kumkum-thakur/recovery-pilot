/**
 * ProtectedRoute - Route guard for authenticated routes
 * 
 * Protects routes that require authentication by:
 * - Checking if user is authenticated
 * - Checking for session expiration
 * - Optionally checking if user has required role
 * - Redirecting to login if not authenticated or session expired
 * - Redirecting to appropriate dashboard if wrong role
 * 
 * Requirements: 1.1, 2.1, 1.2, 2.2
 */

import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { authService } from '../services/authService';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

/**
 * ProtectedRoute component
 * 
 * Wraps routes that require authentication and/or specific roles.
 * Also handles session expiration detection.
 * 
 * @param children - The component to render if authorized
 * @param requiredRole - Optional role requirement (patient or doctor)
 * 
 * Requirements: 1.1, 2.1, 1.2, 2.2
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser, logout } = useUserStore();
  const location = useLocation();

  // Check for session expiration on mount and route changes
  useEffect(() => {
    if (isAuthenticated) {
      // Verify session is still valid
      const user = authService.getCurrentUser();
      
      if (!user) {
        // Session has expired
        logout();
      }
    }
  }, [isAuthenticated, logout, location.pathname]);

  // Redirect to login if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location, sessionExpired: true }} replace />;
  }

  // Check role requirement if specified
  if (requiredRole && currentUser.role !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    if (currentUser.role === UserRole.PATIENT) {
      return <Navigate to="/patient" replace />;
    } else if (currentUser.role === UserRole.DOCTOR) {
      return <Navigate to="/doctor" replace />;
    }
  }

  // User is authenticated and has correct role
  return <>{children}</>;
}
