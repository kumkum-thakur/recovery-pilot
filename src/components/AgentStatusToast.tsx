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
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle, XCircle } from 'lucide-react';
import type { AgentStep, AgentStepStatus } from '../types';

export interface AgentStatusToastProps {
  steps: AgentStep[];
  isVisible: boolean;
  onComplete: () => void;
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
export function AgentStatusToast({ steps, isVisible, onComplete }: AgentStatusToastProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimatingOut, set