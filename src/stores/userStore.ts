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
  get isAuthenticated() {
    return authService.isAuthenticated();
  },

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
    // Authenticate via AuthService
    const user = await authService.login(credentials.username, credentials.password);

    // Update store state
    set({
      currentUser: user,
      isAuthenticated: true,
    });
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

  /**
   * Increments the streak count by 1 for the current patient
   * 
   * This method should be called when all daily missions are completed.
   * It automatically increments the current streak count by 1.
   * 
   * @throws Error if no user is logged in or user is not a patient
   * 
   * Requirements: 10.1, 10.4
   */
  incrementStreak: () => {
    const { currentUser, updateStreak } = get();
    
    // Validate user is logged in
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }
    
    // Validate user is a patient
    if (currentUser.role !== 'patient') {
      throw new Error('Only patients can have streak counts');
    }
    
    // Get current streak count (default to 0 if undefined)
    const currentStreak = currentUser.streakCount ?? 0;
    
    // Increment by 1
    updateStreak(currentStreak + 1);
    
    console.log(`✅ Streak incremented to ${currentStreak + 1}`);
  },

  /**
   * Resets the streak count to 0 for the current patient
   * 
   * This method should be called when a patient misses a day of missions.
   * 
   * @throws Error if no user is logged in or user is not a patient
   * 
   * Requirements: 10.2, 10.4
   */
  resetStreak: () => {
    const { currentUser, updateStreak } = get();
    
    // Validate user is logged in
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }
    
    // Validate user is a patient
    if (currentUser.role !== 'patient') {
      throw new Error('Only patients can have streak counts');
    }
    
    // Reset to 0
    updateStreak(0);
    
    console.log('⚠️ Streak reset to 0 due to missed day');
  },

  /**
   * Checks if a day was missed and resets streak if necessary
   * 
   * This method:
   * 1. Compares the last mission check date with current date
   * 2. If more than 1 calendar day has passed (not including today or yesterday), resets the streak
   * 3. Should be called when the patient logs in or when missions are loaded
   * 
   * DEV MODE: For active development, streak resets every 2 minutes instead of 1 day
   * 
   * Requirements: 10.2
   */
  checkAndUpdateStreakForMissedDay: () => {
    const { currentUser, lastMissionCheckDate, resetStreak } = get();
    
    // Only check for patients
    if (!currentUser || currentUser.role !== 'patient') {
      return;
    }
    
    // If no last check date, this is the first time - don't reset
    if (!lastMissionCheckDate) {
      return;
    }
    
    // DEV MODE: Use 2 minutes instead of 1 day for testing
    const DEV_MODE = true; // Set to false for production
    const RESET_INTERVAL_MS = DEV_MODE ? 2 * 60 * 1000 : 24 * 60 * 60 * 1000; // 2 minutes vs 1 day
    
    const now = new Date();
    const lastCheck = new Date(lastMissionCheckDate);
    
    if (DEV_MODE) {
      // In dev mode, check time difference in minutes
      const timeDifference = now.getTime() - lastCheck.getTime();
      
      // If more than 2 minutes have passed, reset streak
      if (timeDifference > RESET_INTERVAL_MS) {
        const minutesPassed = Math.floor(timeDifference / (60 * 1000));
        resetStreak();
        console.log(`⚠️ DEV MODE: ${minutesPassed} minutes passed. Streak reset.`);
      }
    } else {
      // Production mode: use calendar days
      now.setHours(0, 0, 0, 0); // Normalize to start of day
      lastCheck.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Calculate difference in days
      const daysDifference = Math.floor((now.getTime() - lastCheck.getTime()) / (24 * 60 * 60 * 1000));
      
      // If more than 1 day has passed (> 1 means at least 2 days), reset streak
      // This allows "yesterday" (1 day ago) to be valid
      if (daysDifference > 1) {
        resetStreak();
        console.log(`⚠️ Missed ${daysDifference} days. Streak reset.`);
      }
    }
  },

  /**
   * Updates the last mission check date
   * 
   * This should be called when:
   * - All daily missions are completed
   * - Patient logs in (to track activity)
   * 
   * @param date - ISO date string
   * 
   * Requirements: 10.2
   */
  updateLastMissionCheckDate: (date: string) => {
    set({ lastMissionCheckDate: date });
  },
}));
