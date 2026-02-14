/**
 * DoctorDashboard - Main dashboard for doctor users
 *
 * Desktop-optimized layout with multi-column support for wide screens.
 * Implements keyboard navigation shortcuts for efficient triage review.
 * Includes tabbed navigation for Triage and Care Plan Management.
 *
 * Features:
 * - Patient Data Summary with stat cards
 * - Recovery Progress overview
 * - Triage Inbox table with filtering, search, approve/reject actions
 * - Rejection modal with reason prompt
 * - Detail modal for full action item review
 * - Keyboard shortcuts (R to refresh, 1/2 to switch tabs)
 *
 * Requirements: 14.1, 14.2, 14.3, Care Plan Management 1.1, 8.1
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import { useActionItemStore } from '../stores/actionItemStore';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CarePlanPanel } from '../components/CarePlanPanel';
import { persistenceService } from '../services/persistenceService';
import { userManagementService } from '../services/userManagementService';
import {
  Users,
  AlertTriangle,
  Activity,
  CheckCircle,
  X,
  Eye,
  Search,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { ActionItem, ActionItemModel } from '../types';
import { ActionItemStatus, ActionItemType } from '../types';

// ============================================================================
// Types
// ============================================================================

type DashboardTab = 'triage' | 'care-plans';
type FilterTab = 'all' | 'triage' | 'refills';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Returns a display-friendly confidence percentage string
 */
function formatConfidence(score?: number): string {
  if (score === undefined || score === null) return 'N/A';
  return `${Math.round(score * 100)}%`;
}

/**
 * Checks if an ISO date string is from today
 */
function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Gets patient initials from a name string
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Returns an avatar background color based on the name (deterministic)
 */
function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-medical-text">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Rejection Modal Component
// ============================================================================

interface RejectionModalProps {
  itemId: string;
  patientName: string;
  onConfirm: (itemId: string, reason: string) => void;
  onCancel: () => void;
}

function RejectionModal({
  itemId,
  patientName,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-medical-text">
            Reject Action Item
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Please provide a reason for rejecting the action item for{' '}
          <span className="font-medium text-medical-text">{patientName}</span>.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason (minimum 3 characters)..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-medical-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-none"
          autoFocus
        />

        {reason.length > 0 && reason.trim().length < 3 && (
          <p className="text-xs text-red-500 mt-1">
            Reason must be at least 3 characters long.
          </p>
        )}

        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(itemId, reason.trim())}
            disabled={!isValid}
            className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Detail Modal Component
// ============================================================================

interface DetailModalProps {
  item: ActionItem;
  onClose: () => void;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
}

function DetailModal({ item, onClose, onApprove, onReject }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                item.patientName
              )}`}
            >
              {getInitials(item.patientName)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-medical-text">
                {item.patientName}
              </h3>
              <p className="text-sm text-gray-500">
                {item.type === ActionItemType.TRIAGE
                  ? 'Wound Triage'
                  : 'Medication Refill'}{' '}
                &middot; {item.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-6">
          {/* Status & Confidence Row */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                item.type === ActionItemType.TRIAGE
                  ? item.triageData?.analysis === 'red'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {item.type === ActionItemType.TRIAGE
                ? item.triageData?.analysis === 'red'
                  ? 'Risk Detected'
                  : 'Healing Well'
                : 'Refill Request'}
            </span>
            {item.aiConfidenceScore !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Confidence: {formatConfidence(item.aiConfidenceScore)}
              </span>
            )}
          </div>

          {/* Triage-specific content */}
          {item.triageData && (
            <div className="space-y-4">
              {/* Wound image */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Wound Image
                </h4>
                <img
                  src={item.triageData.imageUrl}
                  alt="Wound photo for triage"
                  className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>

              {/* AI Analysis */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  AI Analysis
                </h4>
                <div
                  className={`p-4 rounded-lg ${
                    item.triageData.analysis === 'red'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      item.triageData.analysis === 'red'
                        ? 'text-red-700'
                        : 'text-green-700'
                    }`}
                  >
                    {item.triageData.analysisText}
                  </p>
                  <p className="text-xs mt-2 text-gray-600">
                    Confidence Score:{' '}
                    {Math.round(item.triageData.confidenceScore * 100)}%
                  </p>
                </div>
              </div>

              {/* Clinical Note */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Clinical Note
                </h4>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-medical-text">
                    {item.triageData.analysis === 'red'
                      ? 'This wound shows signs that require clinical attention. The AI system recommends further evaluation and possible intervention.'
                      : 'This wound appears to be healing normally. No immediate clinical concern detected. Continue current care plan.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Refill-specific content */}
          {item.refillData && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Medication Details
                </h4>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medication</span>
                    <span className="text-sm font-medium text-medical-text">
                      {item.refillData.medicationName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Insurance Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.refillData.insuranceStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : item.refillData.insuranceStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.refillData.insuranceStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Inventory Status
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.refillData.inventoryStatus === 'in_stock'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.refillData.inventoryStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal footer with actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onReject(item.id)}
            className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(item.id)}
            className="px-4 py-2 rounded-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Triage Table Row (Desktop)
// ============================================================================

interface TriageRowProps {
  item: ActionItem;
  onViewDetails: (item: ActionItem) => void;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
}

function TriageTableRow({
  item,
  onViewDetails,
  onApprove,
  onReject,
}: TriageRowProps) {
  const description =
    item.type === ActionItemType.TRIAGE
      ? item.triageData?.analysisText || 'Wound triage review'
      : item.refillData?.medicationName
      ? `Refill: ${item.refillData.medicationName}`
      : 'Medication refill request';

  const statusLabel =
    item.type === ActionItemType.TRIAGE
      ? item.triageData?.analysis === 'red'
        ? 'Risk Detected'
        : 'Healing Well'
      : item.refillData?.insuranceStatus === 'approved'
      ? 'Approved'
      : 'Pending';

  const statusClasses =
    item.type === ActionItemType.TRIAGE
      ? item.triageData?.analysis === 'red'
        ? 'bg-red-100 text-red-700'
        : 'bg-green-100 text-green-700'
      : item.refillData?.insuranceStatus === 'approved'
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      {/* Patient */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ${getAvatarColor(
              item.patientName
            )}`}
          >
            {getInitials(item.patientName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-medical-text truncate">
              {item.patientName}
            </p>
            <p className="text-xs text-gray-500">
              {item.type === ActionItemType.TRIAGE ? 'Triage' : 'Refill'}
            </p>
          </div>
        </div>
      </td>

      {/* Description */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <p className="text-sm text-gray-700 truncate max-w-xs">{description}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </td>

      {/* Confidence */}
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-medical-primary rounded-full h-1.5 transition-all"
              style={{
                width: `${Math.round(
                  (item.aiConfidenceScore ?? item.triageData?.confidenceScore ?? 0) * 100
                )}%`,
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 tabular-nums">
            {formatConfidence(
              item.aiConfidenceScore ?? item.triageData?.confidenceScore
            )}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(item)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-medical-primary hover:bg-medical-primary/10 transition-colors"
            title="View Details"
            aria-label={`View details for ${item.patientName}`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onApprove(item.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            title="Approve"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(item.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors"
            title="Reject"
          >
            Reject
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// Triage Card (Mobile)
// ============================================================================

function TriageMobileCard({
  item,
  onViewDetails,
  onApprove,
  onReject,
}: TriageRowProps) {
  const description =
    item.type === ActionItemType.TRIAGE
      ? item.triageData?.analysisText || 'Wound triage review'
      : item.refillData?.medicationName
      ? `Refill: ${item.refillData.medicationName}`
      : 'Medication refill request';

  const statusLabel =
    item.type === ActionItemType.TRIAGE
      ? item.triageData?.analysis === 'red'
        ? 'Risk Detected'
        : 'Healing Well'
      : item.refillData?.insuranceStatus === 'approved'
      ? 'Approved'
      : 'Pending';

  const statusClasses =
    item.type === ActionItemType.TRIAGE
      ? item.triageData?.analysis === 'red'
        ? 'bg-red-100 text-red-700'
        : 'bg-green-100 text-green-700'
      : item.refillData?.insuranceStatus === 'approved'
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ${getAvatarColor(
              item.patientName
            )}`}
          >
            {getInitials(item.patientName)}
          </div>
          <div>
            <p className="text-sm font-medium text-medical-text">
              {item.patientName}
            </p>
            <p className="text-xs text-gray-500">
              {item.type === ActionItemType.TRIAGE ? 'Triage' : 'Refill'}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700">{description}</p>

      {/* Confidence bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Confidence:</span>
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-medical-primary rounded-full h-1.5"
            style={{
              width: `${Math.round(
                (item.aiConfidenceScore ?? item.triageData?.confidenceScore ?? 0) * 100
              )}%`,
            }}
          />
        </div>
        <span className="text-xs font-medium text-gray-700 tabular-nums">
          {formatConfidence(
            item.aiConfidenceScore ?? item.triageData?.confidenceScore
          )}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onViewDetails(item)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-medical-primary border border-medical-primary hover:bg-medical-primary/5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Details
        </button>
        <button
          onClick={() => onApprove(item.id)}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => onReject(item.id)}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function DoctorDashboard() {
  const { currentUser, logout } = useUserStore();
  const { actionItems, isLoading, fetchActionItems, approveItem, rejectItem } =
    useActionItemStore();
  const navigate = useNavigate();

  // Tab & filter state
  const [activeTab, setActiveTab] = useState<DashboardTab>('triage');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [rejectionTarget, setRejectionTarget] = useState<ActionItem | null>(
    null
  );
  const [detailTarget, setDetailTarget] = useState<ActionItem | null>(null);

  // Stats data
  const [patientCount, setPatientCount] = useState(0);
  const [resolvedTodayCount, setResolvedTodayCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  // Fetch action items on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchActionItems(currentUser.id);
    }
  }, [currentUser?.id, fetchActionItems]);

  // Compute stats whenever action items or data changes
  useEffect(() => {
    try {
      // Count patients assigned to this doctor
      const patients = currentUser?.id
        ? userManagementService.getPatientsForDoctor(currentUser.id)
        : [];
      setPatientCount(patients.length);

      // Count resolved today and critical from all action items (not just pending)
      const allActionItems: ActionItemModel[] = currentUser?.id
        ? persistenceService.getActionItems(currentUser.id)
        : [];

      const resolvedToday = allActionItems.filter(
        (item) =>
          (item.status === ActionItemStatus.APPROVED ||
            item.status === ActionItemStatus.REJECTED) &&
          item.updatedAt &&
          isToday(item.updatedAt)
      );
      setResolvedTodayCount(resolvedToday.length);

      // Critical alerts: red triage items that are still pending
      const critical = allActionItems.filter(
        (item) =>
          item.status === ActionItemStatus.PENDING_DOCTOR &&
          item.type === ActionItemType.TRIAGE &&
          item.triageAnalysis === 'red'
      );
      setCriticalCount(critical.length);
    } catch (error) {
      console.error('Failed to compute stats:', error);
    }
  }, [actionItems, currentUser?.id]);

  // Active cases = pending action items (from the store which already filters for pending_doctor)
  const activeCasesCount = actionItems.length;

  // Filter action items based on filter tab and search
  const filteredItems = useMemo(() => {
    let items = actionItems;

    // Filter by type
    if (filterTab === 'triage') {
      items = items.filter((item) => item.type === ActionItemType.TRIAGE);
    } else if (filterTab === 'refills') {
      items = items.filter((item) => item.type === ActionItemType.REFILL);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) =>
        item.patientName.toLowerCase().includes(query)
      );
    }

    return items;
  }, [actionItems, filterTab, searchQuery]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Don't handle shortcuts if a modal is open
      if (rejectionTarget || detailTarget) {
        // Allow Escape to close modals
        if (event.key === 'Escape') {
          setRejectionTarget(null);
          setDetailTarget(null);
        }
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'r':
          if (currentUser?.id && activeTab === 'triage') {
            fetchActionItems(currentUser.id);
          }
          break;
        case '1':
          setActiveTab('triage');
          break;
        case '2':
          setActiveTab('care-plans');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    currentUser?.id,
    fetchActionItems,
    activeTab,
    rejectionTarget,
    detailTarget,
  ]);

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = useCallback(() => {
    if (currentUser?.id) {
      fetchActionItems(currentUser.id);
    }
  }, [currentUser?.id, fetchActionItems]);

  const handleApprove = useCallback(
    async (itemId: string) => {
      try {
        await approveItem(itemId);
        if (currentUser?.id) {
          await fetchActionItems(currentUser.id);
        }
        // Close detail modal if open
        if (detailTarget?.id === itemId) {
          setDetailTarget(null);
        }
      } catch (error) {
        console.error('Failed to approve item:', error);
      }
    },
    [approveItem, fetchActionItems, currentUser?.id, detailTarget]
  );

  const handleRejectClick = useCallback(
    (itemId: string) => {
      const item = actionItems.find((i) => i.id === itemId);
      if (item) {
        setRejectionTarget(item);
        // Close detail modal if open
        if (detailTarget?.id === itemId) {
          setDetailTarget(null);
        }
      }
    },
    [actionItems, detailTarget]
  );

  const handleRejectConfirm = useCallback(
    async (itemId: string, reason: string) => {
      try {
        await rejectItem(itemId, reason);
        if (currentUser?.id) {
          await fetchActionItems(currentUser.id);
        }
        setRejectionTarget(null);
      } catch (error) {
        console.error('Failed to reject item:', error);
      }
    },
    [rejectItem, fetchActionItems, currentUser?.id]
  );

  const handleViewDetails = useCallback((item: ActionItem) => {
    setDetailTarget(item);
  }, []);

  // Safety check
  if (!currentUser) {
    return null;
  }

  // Data ownership verification: Only doctors should see the doctor dashboard
  if (currentUser.role !== 'doctor') {
    return (
      <div className="min-h-screen bg-medical-bg flex items-center justify-center">
        <p className="text-red-600 font-semibold">Access denied: This dashboard is for authorized physicians only.</p>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-medical-bg flex flex-col">
      {/* Header */}
      <Header
        userName={currentUser.name}
        userRole="doctor"
        notificationCount={activeCasesCount}
        onLogout={handleLogout}
      />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <nav className="flex gap-0" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'triage'}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'triage'
                  ? 'border-medical-primary text-medical-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('triage')}
            >
              Triage Dashboard
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'care-plans'}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'care-plans'
                  ? 'border-medical-primary text-medical-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('care-plans')}
            >
              Care Plans
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* ================================================================ */}
        {/* Triage Tab                                                       */}
        {/* ================================================================ */}
        {activeTab === 'triage' && (
          <>
            {/* Page heading with refresh button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-medical-text">
                  Triage Dashboard
                </h2>
                <p className="text-base text-gray-600 mt-1">
                  Review and manage patient action items
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-medical-primary border border-medical-primary hover:bg-medical-primary/5 transition-colors disabled:opacity-50"
                title="Refresh (R)"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>

            {/* ============================================================ */}
            {/* 1. Stats Overview Row                                        */}
            {/* ============================================================ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Users className="w-6 h-6 text-blue-600" />}
                label="Total Patients"
                value={patientCount}
                color="bg-blue-100"
              />
              <StatCard
                icon={<Activity className="w-6 h-6 text-amber-600" />}
                label="Active Cases"
                value={activeCasesCount}
                color="bg-amber-100"
              />
              <StatCard
                icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
                label="Resolved Today"
                value={resolvedTodayCount}
                color="bg-emerald-100"
              />
              <StatCard
                icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
                label="Critical Alerts"
                value={criticalCount}
                color="bg-red-100"
              />
            </div>

            {/* ============================================================ */}
            {/* 2. Recovery Progress Section                                  */}
            {/* ============================================================ */}
            {actionItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-medical-primary" />
                  <h3 className="text-base font-semibold text-medical-text">
                    Recovery Progress
                  </h3>
                </div>
                <div className="space-y-3">
                  {/* Show unique patients with their action items as mini progress bars */}
                  {Array.from(
                    new Map(
                      actionItems.map((item) => [item.patientId, item])
                    ).values()
                  )
                    .slice(0, 5)
                    .map((item) => {
                      const patientItems = actionItems.filter(
                        (ai) => ai.patientId === item.patientId
                      );
                      const hasRisk = patientItems.some(
                        (ai) =>
                          ai.type === ActionItemType.TRIAGE &&
                          ai.triageData?.analysis === 'red'
                      );
                      // Compute a rough "progress" based on confidence scores
                      const avgConfidence =
                        patientItems.reduce(
                          (sum, ai) =>
                            sum +
                            (ai.aiConfidenceScore ??
                              ai.triageData?.confidenceScore ??
                              0),
                          0
                        ) / patientItems.length;

                      return (
                        <div
                          key={item.patientId}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ${getAvatarColor(
                              item.patientName
                            )}`}
                          >
                            {getInitials(item.patientName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-medical-text truncate">
                                {item.patientName}
                              </span>
                              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                {patientItems.length} item
                                {patientItems.length !== 1 ? 's' : ''} pending
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`rounded-full h-2 transition-all ${
                                  hasRisk ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.round(avgConfidence * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          {hasRisk && (
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* 3. Triage Inbox Section                                      */}
            {/* ============================================================ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Inbox Header */}
              <div className="px-5 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-medical-text">
                      Triage Inbox
                    </h3>
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold bg-medical-primary text-white">
                      {filteredItems.length}
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by patient name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-medical-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-primary/50 focus:border-medical-primary"
                    />
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 mt-3">
                  {(
                    [
                      { key: 'all', label: 'All' },
                      { key: 'triage', label: 'Triage' },
                      { key: 'refills', label: 'Refills' },
                    ] as { key: FilterTab; label: string }[]
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterTab(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterTab === key
                          ? 'bg-medical-primary text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-medical-primary" />
                </div>
              )}

              {/* Empty state */}
              {!isLoading && filteredItems.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-medical-text mb-1">
                    {searchQuery || filterTab !== 'all'
                      ? 'No matching items'
                      : 'All caught up!'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {searchQuery
                      ? 'Try adjusting your search or filter.'
                      : 'No pending items to review.'}
                  </p>
                </div>
              )}

              {/* Desktop table */}
              {!isLoading && filteredItems.length > 0 && (
                <>
                  {/* Table for md+ screens */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Confidence
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => (
                          <TriageTableRow
                            key={item.id}
                            item={item}
                            onViewDetails={handleViewDetails}
                            onApprove={handleApprove}
                            onReject={handleRejectClick}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards for <md screens */}
                  <div className="md:hidden p-4 space-y-3">
                    {filteredItems.map((item) => (
                      <TriageMobileCard
                        key={item.id}
                        item={item}
                        onViewDetails={handleViewDetails}
                        onApprove={handleApprove}
                        onReject={handleRejectClick}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Keyboard Shortcuts footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                Keyboard shortcuts:{' '}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                  R
                </kbd>{' '}
                to refresh{' '}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                  1
                </kbd>{' '}
                Triage{' '}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                  2
                </kbd>{' '}
                Care Plans
              </p>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* Care Plans Tab                                                   */}
        {/* ================================================================ */}
        {activeTab === 'care-plans' && (
          <CarePlanPanel doctorId={currentUser.id} />
        )}
      </main>

      {/* ================================================================== */}
      {/* Modals                                                             */}
      {/* ================================================================== */}

      {/* Rejection Modal */}
      {rejectionTarget && (
        <RejectionModal
          itemId={rejectionTarget.id}
          patientName={rejectionTarget.patientName}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectionTarget(null)}
        />
      )}

      {/* Detail Modal */}
      {detailTarget && (
        <DetailModal
          item={detailTarget}
          onClose={() => setDetailTarget(null)}
          onApprove={handleApprove}
          onReject={handleRejectClick}
        />
      )}
    </div>
  );
}
