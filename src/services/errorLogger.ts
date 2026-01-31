/**
 * Error Logger Service
 * 
 * Centralized error logging service for the application.
 * Logs errors to console in development and can be extended
 * to send errors to external services in production.
 * 
 * Features:
 * - Console logging with context
 * - Structured error information
 * - Ready for integration with error tracking services (Sentry, LogRocket, etc.)
 * 
 * Requirements: Task 21.1
 */

import { type ErrorInfo } from 'react';

export interface ErrorLogContext {
  componentStack?: string;
  route?: string;
  userId?: string;
  userRole?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ErrorLog {
  error: Error;
  context?: ErrorLogContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorLoggerService {
  /**
   * Log an error with optional context
   */
  logError(error: Error, context?: ErrorLogContext, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const timestamp = new Date().toISOString();
    const errorLog: ErrorLog = {
      error,
      context: {
        ...context,
        timestamp,
      },
      severity,
    };

    // Console logging (always enabled)
    this.logToConsole(errorLog);

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      this.sendToErrorTrackingService(errorLog);
    }
  }

  /**
   * Log a React error boundary error
   */
  logBoundaryError(error: Error, errorInfo: ErrorInfo, context?: Omit<ErrorLogContext, 'componentStack'>): void {
    this.logError(
      error,
      {
        ...context,
        componentStack: errorInfo.componentStack ?? undefined,
      },
      'high'
    );
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(errorLog: ErrorLog): void {
    const { error, context, severity } = errorLog;

    // Color-code by severity
    const severityColors = {
      low: 'color: #3b82f6',      // blue
      medium: 'color: #f59e0b',   // amber
      high: 'color: #ef4444',     // red
      critical: 'color: #dc2626; font-weight: bold', // dark red, bold
    };

    console.group(`%c[${severity.toUpperCase()}] Error Logged`, severityColors[severity]);
    console.error('Error:', error);
    
    if (context) {
      console.log('Context:', context);
    }
    
    if (error.stack) {
      console.log('Stack Trace:', error.stack);
    }
    
    console.groupEnd();
  }

  /**
   * Send error to external tracking service
   * This is a placeholder for future integration
   */
  private sendToErrorTrackingService(errorLog: ErrorLog): void {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    // Example for Sentry:
    // Sentry.captureException(errorLog.error, {
    //   level: errorLog.severity,
    //   contexts: {
    //     custom: errorLog.context,
    //   },
    // });

    // For now, just log that we would send it
    console.log('[ErrorLogger] Would send to tracking service in production:', errorLog);
  }

  /**
   * Log a warning (non-error issue)
   */
  logWarning(message: string, context?: ErrorLogContext): void {
    const timestamp = new Date().toISOString();
    
    console.warn('[WARNING]', message, {
      ...context,
      timestamp,
    });

    // In production, you might want to track warnings too
    if (import.meta.env.PROD) {
      // Send to tracking service if needed
    }
  }

  /**
   * Log an info message (for debugging)
   */
  logInfo(message: string, context?: ErrorLogContext): void {
    if (import.meta.env.DEV) {
      const timestamp = new Date().toISOString();
      console.log('[INFO]', message, {
        ...context,
        timestamp,
      });
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggerService();
