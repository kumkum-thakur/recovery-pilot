/**
 * SessionMonitor - Monitors user session and warns before expiration
 * 
 * Features:
 * - Checks session expiration periodically
 * - Shows warning toast 5 minutes before expiration
 * - Provides option to extend session
 * - Automatically logs out on expiration
 * - Refreshes session on user activity
 * 
 * Requirements: 1.2, 2.2
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { authService } from '../services/authService';

/**
 * Time before expiration to show warning (5 minutes)
 */
const WARNING_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Interval to check session status (30 seconds)
 */
const CHECK_INTERVAL_MS = 30 * 1000;

/**
 * SessionMonitor component
 * 
 * Monitors the user's session and provides warnings before expiration.
 * Should be rendered in the app when user is authenticated.
 * 
 * Requirements: 1.2, 2.2
 */
export function SessionMonitor() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useUserStore();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  /**
   * Handles session expiration
   */
  const handleSessionExpired = useCallback(() => {
    setShowWarning(false);
    logout();
    navigate('/login', { state: { sessionExpired: true }, replace: true });
  }, [logout, navigate]);

  /**
   * Checks session status and updates warning state
   */
  const checkSession = useCallback(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const remaining = authService.getSessionTimeRemaining();
    setTimeRemaining(remaining);

    // Show warning if within threshold
    if (remaining > 0 && remaining <= WARNING_THRESHOLD_MS) {
      setShowWarning(true);
    } else if (remaining === 0) {
      // Session expired
      handleSessionExpired();
    } else {
      setShowWarning(false);
    }
  }, [isAuthenticated, handleSessionExpired]);

  /**
   * Extends the session
   */
  const handleExtendSession = useCallback(() => {
    const success = authService.refreshSession();
    
    if (success) {
      setShowWarning(false);
      setTimeRemaining(authService.getSessionTimeRemaining());
    } else {
      // Failed to refresh, session likely expired
      handleSessionExpired();
    }
  }, [handleSessionExpired]);

  /**
   * Refreshes session on user activity
   */
  const handleUserActivity = useCallback(() => {
    if (isAuthenticated && !showWarning) {
      authService.refreshSession();
    }
  }, [isAuthenticated, showWarning]);

  // Set up periodic session checking
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Check immediately
    queueMicrotask(checkSession);

    // Set up interval
    const intervalId = setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, checkSession]);

  // Set up activity listeners to refresh session
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Activity events that should refresh the session
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    // Throttle activity handler to avoid excessive refreshes
    let lastRefresh = Date.now();
    const throttledHandler = () => {
      const now = Date.now();
      // Only refresh once per minute
      if (now - lastRefresh > 60 * 1000) {
        handleUserActivity();
        lastRefresh = now;
      }
    };

    events.forEach(event => {
      window.addEventListener(event, throttledHandler);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledHandler);
      });
    };
  }, [isAuthenticated, handleUserActivity]);

  // Don't render anything if not authenticated or no warning
  if (!isAuthenticated || !showWarning) {
    return null;
  }

  // Format time remaining
  const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              Your session will expire in {minutesRemaining} {minutesRemaining === 1 ? 'minute' : 'minutes'}. 
              Would you like to extend your session?
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleExtendSession}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
              >
                Extend Session
              </button>
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 bg-white text-amber-900 border border-amber-300 rounded-lg text-sm font-medium hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowWarning(false)}
            className="text-amber-600 hover:text-amber-800 focus:outline-none"
            aria-label="Close warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
