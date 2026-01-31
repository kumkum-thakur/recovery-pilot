/**
 * UserStore - Zustand store for user authentication and profile management
 * 
 * Manages:
 * - Current user state and authentication status
 * - Login/logout actions
 * - Streak count updates for patients
 * 
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 10.1, 10.2
 */

import { create } from 'zustand';
import type { User, UserStore as IUserStore } from '../types';
import { authService } from '../services/authService';
import { persistenceService } from '../services/persistenceService';

/**
 * UserStore implementation using Zustand
 * 
 * Provides state management for user authentication and profile data
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 10.1, 10.2
 */
export const useUserStore = create<IUserStore>((set, get) => ({
  // ============================================================================
  // State
  // ============================================================================
  
  /**
   * Current authenticated user
   * null if no user is logged in
   * 
   * Requirements: 1.3, 2.3
   */
  currentUser: authService.getCurrentUser(),
  
  /**
   * Authentication status
   * true if a user is currently logged in
   * 
   * Requirements: 1.1, 2.1
   */
  isAuthenticated: authService.isAuthenticated(),

  /**
   * Last date when missions were checked/completed
   * Used to detect missed days for streak reset
   * 
   * Requirements: 10.2
   */
  lastMissionCheckDate: null,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Authenticates a user with username and password
   * 
   * On success:
   * - Updates currentUser state
   * - Sets isAuthenticated to true
   * - Updates last login date in persistence
   * 
   * On failure:
   * - Throws AuthenticationError with user-friendly message
   * 
   * @param credentials - Username and password
   * @throws AuthenticationError if credentials are invalid
   * 
   * Requirements: 1.1, 1.2, 2.1, 2.2
   */
  login: async (credentials: { username: string; password: string }) => {
    try {
      // Authenticate via AuthService
      const user = await authService.login(credentials.username, credentials.password);
      
      // Update store state
      set({
        currentUser: user,
        isAuthenticated: true,
      });
    } catch (error) {
      // Re-throw authentication errors
      throw error;
    }
  },

  /**
   * Logs out the current user
   * 
   * Clears:
   * - currentUser state
   * - isAuthenticated flag
   * - Session storage
   * 
   * Requirements: 1.1, 2.1
   */
  logout: () => {
    // Clear session via AuthService
    authService.logout();
    
    // Update store state
    set({
      currentUser: null,
      isAuthenticated: false,
    });
  },

  /**
   * Updates the streak count for the current patient user
   * 
   * This method:
   * 1. Validates that a patient is logged in
   * 2. Updates the streak count in persistence
   * 3. Updates the current user state
   * 4. Updates the session
   * 
   * @param newCount - New streak count (must be >= 0)
   * @throws Error if no user is logged in or user is not a patient
   * @throws Error if newCount is negative
   * 
   * Requirements: 1.4, 10.1, 10.2, 10.4
   */
  updateStreak: (newCount: number) => {
    const { currentUser } = get();
    
    // Validate user is logged in
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }
    
    // Validate user is a patient
    if (currentUser.role !== 'patient') {
      throw new Error('Only patients can have streak counts');
    }
    
    // Validate streak count is non-negative
    if (newCount < 0) {
      throw new Error('Streak count cannot be negative');
    }
    
    try {
      // Get user model from persistence
      const userModel = persistenceService.getUser(currentUser.id);
      
      if (!userModel) {
        throw new Error('User not found in persistence');
      }
      
      // Update streak count in persistence
      const updatedUserModel = {
        ...userModel,
        streakCount: newCount,
      };
      persistenceService.saveUser(updatedUserModel);
      
      // Update current user state
      const updatedUser: User = {
        ...currentUser,
        streakCount: newCount,
      };
      
      // Update session
      authService.updateCurrentUser(updatedUser);
      
      // Update store state
      set({
        currentUser: updatedUser,
      });
    } catch (error) {
      // Log error and re-throw
      console.error('Failed to update streak count:', error);
      throw error;
    }
  },
}));
