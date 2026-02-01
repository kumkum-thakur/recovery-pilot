/**
 * DoctorDashboard - Main dashboard for doctor users
 * 
 * Desktop-optimized layout with multi-column support for wide screens.
 * Implements keyboard navigation shortcuts for efficient triage review.
 * 
 * Requirements: 14.1, 14.2, 14.3
 */

import { useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { useActionItemStore } from '../stores/actionItemStore';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';

export function DoctorDashboard() {
  const { currentUser, logout } = useUserStore();
  const { actionItems, isLoading, fetchActionItems } = useActionItemStore();
  const navigate = useNavigate();

  // Fetch action items on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchActionItems(currentUser.id);
    }
  }, [currentUser?.id, fetchActionItems]);

  // Keyboard navigation shortcuts
  // Requirements: 14.3
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Keyboard shortcuts:
      // 'r' - Refresh action items
      // '?' - Show keyboard shortcuts help (future enhancement)
      switch (event.key.toLowerCase()) {
        case 'r':
          if (currentUser?.id) {
            fetchActionItems(currentUser.id);
          }
          break;
        // Additional shortcuts can be added here
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentUser?.id, fetchActionItems]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Safety check - should not happen due to ProtectedRoute
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-medical-bg flex flex-col">
      {/* Header with NotificationBadge and ProfileButton */}
      {/* Requirements: 14.1 */}
      <Header
        userName={currentUser.name}
        userRole="doctor"
        notificationCount={actionItems.length}
        onLogout={handleLogout}
      />

      {/* Main content area - desktop-optimized */}
      {/* Requirements: 14.1, 14.2 */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-medical-text">
            Triage Dashboard
          </h2>
          <p className="text-base text-gray-600 mt-1">
            Review and manage patient action items
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && actionItems.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-medical-text mb-2">
              All caught up!
            </h3>
            <p className="text-gray-600">
              No pending items to review.
            </p>
          </div>
        )}

        {/* Action items grid - multi-column layout for wide screens */}
        {/* Requirements: 14.2 */}
        {!isLoading && actionItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Placeholder for ActionItemCard component */}
                {/* Will be implemented in task 18.1 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-medical-text">
                      {item.patientName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.type === 'triage' ? 'Wound Triage' : 'Medication Refill'}
                    </p>
                  </div>
                  
                  {item.triageData && (
                    <div className="space-y-2">
                      <img
                        src={item.triageData.imageUrl}
                        alt="Wound photo"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className={`px-3 py-2 rounded-lg ${
                        item.triageData.analysis === 'red'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        <p className="text-sm font-medium">
                          {item.triageData.analysisText}
                        </p>
                        <p className="text-xs mt-1">
                          Confidence: {Math.round(item.triageData.confidenceScore * 100)}%
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {item.refillData && (
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Medication:</span>{' '}
                        {item.refillData.medicationName}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Insurance:</span>{' '}
                        <span className={
                          item.refillData.insuranceStatus === 'approved'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }>
                          {item.refillData.insuranceStatus}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Inventory:</span>{' '}
                        <span className={
                          item.refillData.inventoryStatus === 'in_stock'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }>
                          {item.refillData.inventoryStatus.replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      className="flex-1 px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      onClick={() => {
                        // Will be connected to approveItem in task 19.1
                        console.log('Approve:', item.id);
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="flex-1 px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      onClick={() => {
                        // Will be connected to rejectItem in task 19.2
                        console.log('Reject:', item.id);
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        {/* Requirements: 14.3 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Keyboard shortcuts: <kbd className="px-2 py-1 bg-gray-100 rounded">R</kbd> to refresh
          </p>
        </div>
      </main>
    </div>
  );
}
