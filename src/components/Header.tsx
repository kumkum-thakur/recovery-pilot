/**
 * Header - Dashboard header with streak display and profile button
 * 
 * Requirements: 3.4, 10.3, 13.1, 13.2, 14.1
 */

import { StreakDisplay } from './StreakDisplay';
import { ProfileButton } from './ProfileButton';
import { NotificationBadge } from './NotificationBadge';

interface HeaderProps {
  userName: string;
  userRole?: 'patient' | 'doctor';
  streakCount?: number;
  notificationCount?: number;
  onLogout: () => void;
}

export function Header({ userName, userRole = 'patient', streakCount, notificationCount, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-medical-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-medical-text">
              RecoveryPilot
            </h1>
          </div>

          {/* Right side: Streak/Notifications + Profile */}
          <div className="flex items-center gap-3">
            {streakCount !== undefined && (
              <StreakDisplay streakCount={streakCount} />
            )}
            {notificationCount !== undefined && (
              <NotificationBadge count={notificationCount} />
            )}
            <ProfileButton userName={userName} userRole={userRole} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}
