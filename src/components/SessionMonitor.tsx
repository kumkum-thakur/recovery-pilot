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
   * Checks session status and updates warning state
   */
  const checkSession = useCallback(() => {
    if (!isAuthenticated) {
      s