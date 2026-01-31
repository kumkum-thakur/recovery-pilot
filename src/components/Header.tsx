/**
 * Header - Dashboard header with streak display and profile button
 * 
 * Requirements: 3.4, 10.3, 13.1, 13.2
 */

import { StreakDisplay } from './StreakDisplay';
import { ProfileButton } from './ProfileButton';

interface HeaderProps {
  userName: string;
  streakCount?: number;
  onLogout: () => void;
}

export function Header({ userName, streakCount, onLogout }: HeaderProps) {
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

          {/* Right side: Streak + Profile */}
          <div className="flex items-center gap-3">
            {streakCount !== undefined && (
              <StreakDisplay streakCount={streakCount} />
            )}
            <ProfileButton userName={userName} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  );
}
