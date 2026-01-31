/**
 * ProtectedRoute - Route guard for authenticated routes
 * 
 * Protects routes that require authentication by:
 * - Checking if user is authenticated
 * - Optionally checking if user has required role
 * - Redirecting to login if not authenticated
 * - Redirecting to appropriate dashboard if wrong role
 * 
 * Requirements: 1.1, 2.1
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

/**
 * ProtectedRoute component
 * 
 * Wraps routes that require authentication and/or specific roles.
 * 
 * @param children - The component to render if authorized
 * @param requiredRole - Optional role requirement (patient or doctor)
 * 
 * Requirements: 1.1, 2.1
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useUserStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
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
