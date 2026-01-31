/**
 * RouteErrorBoundary - Specialized error boundary for route-level errors
 * 
 * A lighter-weight error boundary specifically for wrapping routes.
 * Provides route-specific error handling with navigation options.
 * 
 * Features:
 * - Catches errors at the route level
 * - Provides navigation back to safe routes
 * - Logs errors with route context
 * 
 * Usage:
 * <RouteErrorBoundary routeName="Patient Dashboard">
 *   <PatientDashboard />
 * </RouteErrorBoundary>
 * 
 * Requirements: Task 21.1
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const routeName = this.props.routeName || 'Unknown Route';
    console.error(`RouteErrorBoundary caught an error in ${routeName}:`, error);
    console.error('Error info:', errorInfo);

    // In production, log to error tracking service with route context
    // Example: logError({ error, route: routeName, componentStack: errorInfo.componentStack });
  }

  handleGoBack = (): void => {
    // Reset error state and navigate back
    this.setState({ hasError: false, error: null });
    window.history.back();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const routeName = this.props.routeName || 'this page';

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8 space-y-4">
            {/* Error Icon */}
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h2 className="text-xl font-semibold">
                Error loading {routeName}
              </h2>
            </div>

            {/* Error Message */}
            <p className="text-slate-600">
              We encountered a problem while loading {routeName}. 
              Please try going back or contact support if the problem persists.
            </p>

            {/* Error Details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <strong className="text-red-800">Error:</strong>
                <pre className="mt-1 text-red-700 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={this.handleGoBack}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mt-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
