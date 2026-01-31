/**
 * ProfileButton - User profile button with dropdown menu
 * 
 * Requirements: 3.4, 13.2
 */

import { User, LogOut } from 'lucide-react';
import { useState } from 'react';

interface ProfileButtonProps {
  userName: string;
  onLogout: () => void;
}

export function ProfileButton({ userName, onLogout }: ProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px]"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <User className="w-5 h-5 text-medical-primary" />
        <span className="text-sm font-medium text-medical-text hidden sm:inline">
          {userName}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-100">
              <p className="text-sm font-medium text-medical-text">{userName}</p>
              <p className="text-xs text-gray-500">Patient</p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
