/**
 * Refill Engine Service
 * 
 * Manages automatic medication refill requests
 * Requirements: Enhancement - Auto-refill ordering
 */

import type { RefillRequest, RefillOutcome } from '../types';
import { RefillStatus, ENHANCEMENT_STORAGE_KEYS } from '../types';
import { persistenceService } from './persistenceService';
import { agentServiceWrapper } from './agentServiceWrapper';

console.log('🔄 [RefillEngine] Module loaded');

/**
 * Refill Engine Service
 */
class RefillEngine {
  /**
   * Request a medication refill
   */
  async requestRefill(patientId: string, medicationId: string, medicationName: string): Promise<RefillRequest> {
    console.log('🔄 [RefillEngine] Requesting refill:', {
      patientId,
      medicationId,
      medicationName,
    });

    // Check for duplicate requests
    if (this.hasActiveRefill(patientId, medicationId)) {
      console.error('❌ [RefillEngine] Active refill already exists');
      throw new Error('Refill request already in progress');
    }

    // Create refill request
    const request: RefillRequest = {
      id: `refill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      medicationId,
      medicationName,
      requestedAt: new Date().toISOString(),
      status: RefillStatus.PENDING,
    };

    // Save request
    const requests = this.getAllRequests();
    requests.push(request);
    this.saveRequests(requests);

    console.log('✅ [RefillEngine] Refill request created:', request.id);

    // Trigger agent workflow asynchronously
    this.processRefillWorkflow(request.id, medicationName).catch(error => {
      console.error('❌ [RefillEngine] Workflow error:', error);
    });

    return request;
  }

  /**
   * Process refill workflow using agent service
   */
  private async processRefillWorkflow(requestId: string, medicationName: string): Promise<void> {
    console.log('🔄 [RefillEngine] Processing workflow for request:', requestId);

    try {
      // Update status to insurance check
      this.updateRequestStatus(requestId, RefillStatus.INSURANCE_CHECK);

      // Call agent service for refill processing
      const result = await agentServiceWrapper.processRefillRequest(medicationName);

      console.log('✅ [RefillEngine] Workflow completed:', result);

      // Update request with outcome
      const outcome: RefillOutcome = {
        success: result.insuranceStatus === 'approved' && result.inventoryStatus === 'in_stock',
        message: result.insuranceStatus === 'approved' && result.inventoryStatus === 'in_stock'
          ? 'Refill approved and in stock'
          : 'Refill request needs review',
      };

      this.completeRefill(requestId, outcome);
    } catch (error) {
      console.error('❌ [RefillEngine] Workflow failed:', error);
      
      const outcome: RefillOutcome = {
        success: false,
        message: 'Refill request failed',
      };

      this.completeRefill(requestId, outcome);
    }
  }

  /**
   * Check if there's an active refill for a medication
   */
  hasActiveRefill(patientId: string, medicationId: string): boolean {
    const requests = this.getAllRequests();
    const activeRequest = requests.find(
      r => r.patientId === patientId &&
           r.medicationId === medicationId &&
           (r.status === RefillStatus.PENDING ||
            r.status === RefillStatus.INSURANCE_CHECK ||
            r.status === RefillStatus.PHARMACY_CHECK)
    );

    const hasActive = !!activeRequest;
    console.log('🔄 [RefillEngine] Active refill check:', hasActive);

    return hasActive;
  }

  /**
   * Complete a refill request
   */
  completeRefill(requestId: string, outcome: RefillOutcome): void {
    console.log('🔄 [RefillEngine] Completing refill:', {
      requestId,
      outcome,
    });

    const requests = this.getAllRequests();
    const request = requests.find(r => r.id === requestId);

    if (!request) {
      console.error('❌ [RefillEngine] Request not found');
      throw new Error('Refill request not found');
    }

    request.status = outcome.success ? RefillStatus.APPROVED : RefillStatus.REJECTED;
    request.completedAt = new Date().toISOString();
    request.outcome = outcome;

    this.saveRequests(requests);

    console.log('✅ [RefillEngine] Refill completed');
  }

  /**
   * Update request status
   */
  private updateRequestStatus(requestId: string, status: RefillStatus): void {
    const requests = this.getAllRequests();
    const request = requests.find(r => r.id === requestId);

    if (request) {
      request.status = status;
      this.saveRequests(requests);
      console.log('🔄 [RefillEngine] Status updated:', status);
    }
  }

  /**
   * Get all refill requests
   */
  private getAllRequests(): RefillRequest[] {
    const data = persistenceService.get<RefillRequest[]>(
      ENHANCEMENT_STORAGE_KEYS.REFILL_REQUESTS
    );
    return data || [];
  }

  /**
   * Save refill requests
   */
  private saveRequests(requests: RefillRequest[]): void {
    persistenceService.set(ENHANCEMENT_STORAGE_KEYS.REFILL_REQUESTS, requests);
  }

  /**
   * Get requests for a patient
   */
  getRequestsForPatient(patientId: string): RefillRequest[] {
    const requests = this.getAllRequests();
    return requests.filter(r => r.patientId === patientId);
  }
}

export const refillEngine = new RefillEngine();
console.log('✅ [RefillEngine] Service initialized');
