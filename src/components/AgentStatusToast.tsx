/**
 * AgentStatusToast - Displays agent workflow progress in a toast notification
 * 
 * This component shows the AI agent "working" on behalf of the user by displaying
 * each step of the workflow with visual indicators for the current status.
 * 
 * Requirements:
 * - 7.3: Display workflow steps visually in a status toast/card
 * - Shows step status: pending, in_progress, completed, failed
 * - Animates step transitions
 * - Auto-dismisses on workflow completion
 * - Displays retry options on workflow failure
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle, XCircle, RefreshCw } from 'lucide-react';
import type { AgentStep, AgentStepStatus } from '../types';

export interface AgentStatusToastProps {
  steps: AgentStep[];
  isVisible: boolean;
  onComplete: () => void;
  onRetry?: () => void; // Optional retry callback
}

/**
 * Get the appropriate icon and styling for a step status
 */
function getStepIcon(status: AgentStepStatus) {
  switch (status) {
    case 'completed':
      return {
        Icon: CheckCircle2,
        className: 'text-gamification-success',
        animate: false,
      };
    case 'in_progress':
      return {
        Icon: Loader2,
        className: 'text-gamification-agent',
        animate: true,
      };
    case 'failed':
      return {
        Icon: XCircle,
        className: 'text-red-500',
        animate: false,
      };
    case 'pending':
    default:
      return {
        Icon: Circle,
        className: 'text-gray-300',
        animate: false,
      };
  }
}

/**
 * AgentStatusToast component displays the agent's workflow progress
 * in a toast notification that appears at the bottom of the screen
 */
export function AgentStatusToast({ steps, isVisible, onComplete, onRetry }: AgentStatusToastProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Check if all steps are completed
  const allStepsCompleted = steps.length > 0 && steps.every(step => step.status === 'completed');
  
  // Check if any step failed
  const hasFailedStep = steps.some(step => step.status === 'failed');
  
  // Check if workflow is partially completed (some steps completed, some failed)
  const isPartiallyCompleted = steps.some(step => step.status === 'completed') && hasFailedStep;

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      queueMicrotask(() => {
        setShouldRender(true);
        setIsAnimatingOut(false);
      });
    } else if (shouldRender) {
      // Start exit animation (no queueMicrotask needed — element is already in DOM)
      setIsAnimatingOut(true);
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isVisible, shouldRender]);

  // Auto-dismiss after all steps complete (with a delay to show final state)
  useEffect(() => {
    if (allStepsCompleted && isVisible && !hasFailedStep) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500); // Show completed state for 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [allStepsCompleted, isVisible, hasFailedStep, onComplete]);

  // Don't render if not visible and animation is complete
  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 transition-all duration-300 ${
        isAnimatingOut ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-gamification-agent animate-pulse" />
          <h3 className="text-sm font-semibold text-medical-text">
            {hasFailedStep ? 'Workflow Failed' : allStepsCompleted ? 'Workflow Complete' : 'Agent Working...'}
          </h3>
        </div>

        {/* Steps list */}
        <div className="space-y-2">
          {steps.map((step) => {
            const { Icon, className, animate } = getStepIcon(step.status);
            
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  step.status === 'in_progress' ? 'scale-105' : 'scale-100'
                }`}
              >
                {/* Step icon */}
                <div className="flex-shrink-0">
                  <Icon
                    className={`w-5 h-5 ${className} ${animate ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                </div>

                {/* Step label */}
                <p
                  className={`text-sm transition-colors duration-200 ${
                    step.status === 'completed'
                      ? 'text-medical-text font-medium'
                      : step.status === 'in_progress'
                      ? 'text-medical-text font-semibold'
                      : step.status === 'failed'
                      ? 'text-red-600 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Success message when all complete */}
        {allStepsCompleted && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gamification-success font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              All done! ✨
            </p>
          </div>
        )}

        {/* Error message if any step failed */}
        {hasFailedStep && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <p className="text-sm text-red-600 font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {isPartiallyCompleted 
                ? 'Workflow partially completed. Some steps failed.'
                : 'Something went wrong. Please try again.'}
            </p>
            
            {/* Retry button */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 min-h-[44px]"
                aria-label="Retry workflow"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Workflow
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
