/**
 * TriageResultCard - Displays AI triage analysis results
 * 
 * This component shows the results of wound photo analysis with:
 * - Green results: Positive feedback and care instructions
 * - Red results: Action item notification for doctor review
 * - Confidence score display
 * - Appropriate color styling (green for good, red for risk)
 * 
 * Requirements:
 * - 6.3: Display Green results with positive feedback
 * - 6.4: Display Red results with action item notification
 * - 6.5: Show confidence score
 */

import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import type { TriageAnalysis } from '../types';

export interface TriageResultCardProps {
  analysis: TriageAnalysis;
  analysisText: string;
  confidenceScore: number;
  actionItemId?: string;
}

/**
 * TriageResultCard component displays the AI triage analysis results
 * with appropriate styling and messaging based on the analysis outcome
 */
export function TriageResultCard({
  analysis,
  analysisText,
  confidenceScore,
  actionItemId,
}: TriageResultCardProps) {
  const isGreen = analysis === 'green';
  
  // Determine styling based on analysis result
  const cardStyles = isGreen
    ? {
        bgColor: 'bg-emerald-50',
        borderColor: 'border-gamification-success',
        iconBgColor: 'bg-gamification-success',
        textColor: 'text-emerald-900',
        Icon: CheckCircle2,
      }
    : {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        iconBgColor: 'bg-red-500',
        textColor: 'text-red-900',
        Icon: AlertCircle,
      };

  const { bgColor, borderColor, iconBgColor, textColor, Icon } = cardStyles;

  // Format confidence score as percentage
  const confidencePercentage = Math.round(confidenceScore * 100);

  return (
    <div
      className={`${bgColor} rounded-lg border-2 ${borderColor} p-6 shadow-sm`}
      role="alert"
      aria-live="polite"
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-4 mb-4">
        {/* Icon */}
        <div className={`${iconBgColor} rounded-full p-3 flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" aria-hidden="true" />
        </div>

        {/* Title and subtitle */}
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${textColor} mb-1`}>
            {isGreen ? 'Looking Good! ✨' : 'Attention Needed'}
          </h3>
          <p className={`text-sm ${textColor} opacity-80`}>
            {isGreen
              ? 'Your incision is healing well'
              : 'Potential issue detected'}
          </p>
        </div>

        {/* Confidence score badge */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            <span>Confidence</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${textColor}`}>
            {confidencePercentage}%
          </div>
        </div>
      </div>

      {/* Analysis text */}
      <div className={`${textColor} mb-4`}>
        <p className="text-base leading-relaxed">{analysisText}</p>
      </div>

      {/* Green result: Care instructions */}
      {isGreen && (
        <div className="bg-white/50 rounded-lg p-4 border border-emerald-200">
          <h4 className="font-semibold text-emerald-900 mb-2 text-sm">
            Keep up the great work! 💪
          </h4>
          <ul className="text-sm text-emerald-800 space-y-1">
            <li>• Continue following your care instructions</li>
            <li>• Keep the area clean and dry</li>
            <li>• Take your medications as prescribed</li>
          </ul>
        </div>
      )}

      {/* Red result: Action item notification */}
      {!isGreen && actionItemId && (
        <div className="bg-white/50 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-red-900 mb-2 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            Doctor Review Requested
          </h4>
          <p className="text-sm text-red-800 mb-3">
            I've automatically created a review request for Dr. Smith. They'll
            take a look and get back to you soon.
          </p>
          <div className="text-xs text-red-700 font-medium">
            Action Item ID: {actionItemId.slice(0, 8)}...
          </div>
        </div>
      )}

      {/* Red result without action item (shouldn't happen, but handle gracefully) */}
      {!isGreen && !actionItemId && (
        <div className="bg-white/50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-800">
            Please contact your doctor to discuss this result.
          </p>
        </div>
      )}
    </div>
  );
}
