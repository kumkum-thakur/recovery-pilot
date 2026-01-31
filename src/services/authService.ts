/**
 * AuthService - Authentication and session management
 * 
 * Provides authentication functionality including:
 * - User login with credential validation
 * - User logout
 * - Session management
 * - Simple password hashing for MVP
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import type { User, UserModel, AuthService as IAuthService } from '../types';
import { persistenceService } from './persistenceService';

/**
 * Error class for authentication-related errors
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Session storage keys
 */
const SESSION_STORAGE_KEY = 'recovery_pilot_current_user';
const SESSION_EXPIRY_KEY = 'recovery_pilot_session_expiry';

/**
 * Session timeout duration in milliseconds (30 minutes)
 * Requirements: 1.2, 2.2
 */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Simple password hashing for MVP
 * 
 * In production, this should use a proper hashing algorithm like bcrypt.
 * For MVP, we use a simple prefix-based approach: "simple_hash_" + password
 * 
 * @param password - Plain text password
 * @returns Hashed password
 */
function hashPassword(password: string): string {
  // Simple hash for MVP - in production, use bcrypt or similar
  return `simple_hash_${password}`;
}

/**
 * Converts UserModel to User (removes sensitive data)
 * 
 * @param userModel - User model from database
 * @returns User object for application use
 */
function userModelToUser(userModel: UserModel): User {
  return {
    id: userModel.id,
    name: userModel.name,
    role: userModel.role,
    streakCount: userModel.streakCount,
  };
}

/**
 * Implementation of AuthService
 * 
 * Handles authentication, session management, and credential validation
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */
class AuthServiceImpl implements IAuthService {
  /**
   * Validates user credentials
   * 
   * @param username - Username to validate
   * @param password - Password to validate
   * @returns true if credentials are valid, false otherwise
   * 
   * Requirements: 1.2, 2.2
   */
  validateCredentials(username: string, password: string): boolean {
    try {
      // Get user from persistence
      const userModel = persistenceService.getUserByUsername(username);
      
      if (!userModel) {
        return false;
      }
      
      // Hash the provided password and compare
      const hashedPassword = hashPassword(password);
      return userModel.passwordHash === hashedPassword;
    } catch (error) {
      console.error('Error validating credentials:', error);
      return false;
    }
  }

  /**
   * Authenticates a user and creates a session
   * 
   * @param username - Username
   * @param password - Password
   * @returns Promise resolving to authenticated User
   * @throws AuthenticationError if credentials are invalid
   * 
   * Requirements: 1.1, 2.1
   */
  async login(username: string, password: string): Promise<User> {
    // Validate input
    if (!username || !password) {
      throw new AuthenticationError('Username and password are required');
    }

    // Get user from persistence
    const userModel = persistenceService.getUserByUsername(username);
    
    if (!userModel) {
      // Don't reveal whether username exists (security best practice)
      throw new AuthenticationError('Invalid username or password');
    }

    // Validate password
    const hashedPassword = hashPassword(password);
    if (userModel.passwordHash !== hashedPassword) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Update last login date
    const updatedUserModel: UserModel = {
      ...userModel,
      lastLoginDate: new Date().toISOString(),
    };
    persistenceService.saveUser(updatedUserModel);

    // Convert to User object (remove sensitive data)
    const user = userModelToUser(updatedUserModel);

    // Store in session
    this.setCurrentUser(user);

    return user;
  }

  /**
   * Logs out the current user and clears the session
   * 
   * Requirements: 1.1, 2.1
   */
  logout(): void {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
      // Don't throw - logout should always succeed
    }
  }

  /**
   * Gets the currently authenticated user from session
   * 
   * Checks session expiration and returns null if session has expired.
   * 
   * @returns Current user or null if not authenticated or session expired
   * 
   * Requirements: 1.1, 2.1, 1.2, 2.2
   */
  getCurrentUser(): User | null {
    try {
      const userJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!userJson) {
        return null;
      }

      // Check if session has expired
      if (this.isSessionExpired()) {
        // Clear expired session
        this.logout();
        return null;
      }

      const user = JSON.parse(userJson) as User;
      return user;
    } catch (error) {
      console.error('Error retrieving current user:', error);
      // Clear corrupted session data
      this.logout();
      return null;
    }
  }

  /**
   * Sets the current user in session storage
   * 
   * Also sets the session expiry time.
   * 
   * @param user - User to store in session
   * @private
   * 
   * Requirements: 1.2, 2.2
   */
  private setCurrentUser(user: User): void {
    try {
      const userJson = JSON.stringify(user);
      sessionStorage.setItem(SESSION_STORAGE_KEY, userJson);
      
      // Set session expiry time
      const expiryTime = Date.now() + SESSION_TIMEOUT_MS;
      sessionStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Error storing current user:', error);
      throw new AuthenticationError('Failed to create session');
    }
  }

  /**
   * Checks if a user is currently authenticated
   * 
   * @returns true if user is authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Updates the current user's data in the session
   * 
   * This is useful when user data changes (e.g., streak count update)
   * and we need to refresh the session without re-authenticating.
   * Also refreshes the session expiry time.
   * 
   * @param user - Updated user data
   * @throws AuthenticationError if no user is currently authenticated
   * 
   * Requirements: 1.2, 2.2
   */
  updateCurrentUser(user: User): void {
    if (!this.isAuthenticated()) {
      throw new AuthenticationError('No user is currently authenticated');
    }

    this.setCurrentUser(user);
  }

  /**
   * Checks if the current session has expired
   * 
   * @returns true if session has expired, false otherwise
   * @private
   * 
   * Requirements: 1.2, 2.2
   */
  private isSessionExpired(): boolean {
    try {
      const expiryTimeStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (!expiryTimeStr) {
        // No expiry time set, consider expired
        return true;
      }

      const expiryTime = parseInt(expiryTimeStr, 10);
      
      if (isNaN(expiryTime)) {
        // Invalid expiry time, consider expired
        return true;
      }

      return Date.now() > expiryTime;
    } catch (error) {
      console.error('Error checking session expiry:', error);
      // On error, consider expired for safety
      return true;
    }
  }

  /**
   * Refreshes the current session by extending the expiry time
   * 
   * This should be called on user activity to keep the session alive.
   * 
   * @returns true if session was refreshed, false if no active session
   * 
   * Requirements: 1.2, 2.2
   */
  refreshSession(): boolean {
    try {
      const user = this.getCurrentUser();
      
      if (!user) {
        return false;
      }

      // Update expiry time
      const expiryTime = Date.now() + SESSION_TIMEOUT_MS;
      sessionStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
      
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }

  /**
   * Gets the remaining time until session expires
   * 
   * @returns Remaining time in milliseconds, or 0 if no active session
   * 
   * Requirements: 1.2, 2.2
   */
  getSessionTimeRemaining(): number {
    try {
      const expiryTimeStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (!expiryTimeStr) {
        return 0;
      }

      const expiryTime = parseInt(expiryTimeStr, 10);
      
      if (isNaN(expiryTime)) {
        return 0;
      }

      const remaining = expiryTime - Date.now();
      return Math.max(0, remaining);
    } catch (error) {
      console.error('Error getting session time remaining:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl();

// Export class for testing
export { AuthServiceImpl };
