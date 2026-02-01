/**
 * NotificationBadge - Displays notification count badge
 * 
 * Shows the number of pending action items for doctors.
 * Used in the doctor dashboard header.
 * 
 * Requirements: 8.1, 14.1
 */

import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  return (
    <div className="relative">
      <button
        className="flex items-center justify-center w-11 h-11 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label={`${count} pending notifications`}
      >
        <Bell className="w-5 h-5 text-medical-primary" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </div>
  );
}
