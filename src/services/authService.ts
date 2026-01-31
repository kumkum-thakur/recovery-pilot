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
 * Session storage key for current user
 */
const SESSION_STORAGE_KEY = 'recovery_pilot_current_user';

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
    } catch (error) {
      console.error('Error during logout:', error);
      // Don't throw - logout should always succeed
    }
  }

  /**
   * Gets the currently authenticated user from session
   * 
   * @returns Current user or null if not authenticated
   * 
   * Requirements: 1.1, 2.1
   */
  getCurrentUser(): User | null {
    try {
      const userJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!userJson) {
        return null;
      }

      const user = JSON.parse(userJson) as User;
      return user;
    } catch (error) {
      console.error('Error retrieving current user:', error);
      // Clear corrupted session data
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  /**
   * Sets the current user in session storage
   * 
   * @param user - User to store in session
   * @private
   */
  private setCurrentUser(user: User): void {
    try {
      const userJson = JSON.stringify(user);
      sessionStorage.setItem(SESSION_STORAGE_KEY, userJson);
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
   * and we need to refresh the session without re-authenticating
   * 
   * @param user - Updated user data
   * @throws AuthenticationError if no user is currently authenticated
   */
  updateCurrentUser(user: User): void {
    if (!this.isAuthenticated()) {
      throw new AuthenticationError('No user is currently authenticated');
    }

    this.setCurrentUser(user);
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl();

// Export class for testing
export { AuthServiceImpl };
