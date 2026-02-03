/**
 * Medication Tracker Service
 * 
 * Tracks medication inventory and triggers refill requests
 * Requirements: Enhancement - Medication tracking, auto-refill
 */

import type { MedicationInventory } from '../types';
import { ENHANCEMENT_STORAGE_KEYS } from '../types';
import { persistenceService } from './persistenceService';

console.log('💊 [MedicationTracker] Module loaded');

/**
 * Default medication for testing
 */
const DEFAULT_MEDICATION: MedicationInventory = {
  id: 'med-1',
  patientId: 'patient-1',
  medicationName: 'Amoxicillin 500mg',
  dosage: '1 tablet twice daily',
  tabletsRemaining: 10,
  refillThreshold: 3,
  lastUpdated: new Date().toISOString(),
};

/**
 * Medication Tracker Service
 */
class MedicationTracker {
  /**
   * Initialize medication inventory for a patient
   */
  initializeMedication(patientId: string): void {
    console.log('💊 [MedicationTracker] Initializing medication for patient:', patientId);
    
    const inventory = this.getAllMedications();
    const existing = inventory.find(m => m.patientId === patientId);
    
    if (!existing) {
      const newMed: MedicationInventory = {
        ...DEFAULT_MEDICATION,
        patientId,
      };
      inventory.push(newMed);
      this.saveMedications(inventory);
      console.log('✅ [MedicationTracker] Medication initialized');
    } else {
      console.log('ℹ️ [MedicationTracker] Medication already exists');
    }
  }

  /**
   * Record medication taken - decrements tablet count
   */
  recordMedicationTaken(patientId: string, medicationId: string): number {
    console.log('💊 [MedicationTracker] Recording medication taken:', {
      patientId,
      medicationId,
    });

    const inventory = this.getAllMedications();
    const medication = inventory.find(
      m => m.id === medicationId && m.patientId === patientId
    );

    if (!medication) {
      console.error('❌ [MedicationTracker] Medication not found');
      throw new Error('Medication not found');
    }

    if (medication.tabletsRemaining <= 0) {
      console.error('❌ [MedicationTracker] No tablets remaining');
      throw new Error('No tablets remaining');
    }

    // Decrement count
    medication.tabletsRemaining -= 1;
    medication.lastTaken = new Date().toISOString();
    medication.lastUpdated = new Date().toISOString();

    this.saveMedications(inventory);

    console.log('✅ [MedicationTracker] Medication recorded. Remaining:', medication.tabletsRemaining);

    // Check if refill needed
    if (this.checkRefillNeeded(patientId, medicationId)) {
      console.log('⚠️ [MedicationTracker] Refill threshold reached!');
    }

    return medication.tabletsRemaining;
  }

  /**
   * Get tablet count for a medication
   */
  getTabletCount(patientId: string, medicationId: string): number {
    console.log('💊 [MedicationTracker] Getting tablet count:', {
      patientId,
      medicationId,
    });

    const medication = this.getMedicationDetails(patientId, medicationId);
    return medication.tabletsRemaining;
  }

  /**
   * Check if refill is needed
   */
  checkRefillNeeded(patientId: string, medicationId: string): boolean {
    const medication = this.getMedicationDetails(patientId, medicationId);
    const needed = medication.tabletsRemaining <= medication.refillThreshold;
    
    console.log('💊 [MedicationTracker] Refill needed check:', {
      remaining: medication.tabletsRemaining,
      threshold: medication.refillThreshold,
      needed,
    });

    return needed;
  }

  /**
   * Get medication details
   */
  getMedicationDetails(patientId: string, medicationId: string): MedicationInventory {
    const inventory = this.getAllMedications();
    const medication = inventory.find(
      m => m.id === medicationId && m.patientId === patientId
    );

    if (!medication) {
      console.error('❌ [MedicationTracker] Medication not found');
      throw new Error('Medication not found');
    }

    return medication;
  }

  /**
   * Get all medications for a patient
   */
  getMedicationsForPatient(patientId: string): MedicationInventory[] {
    const inventory = this.getAllMedications();
    return inventory.filter(m => m.patientId === patientId);
  }

  /**
   * Get all medications
   */
  private getAllMedications(): MedicationInventory[] {
    const data = persistenceService.get<MedicationInventory[]>(
      ENHANCEMENT_STORAGE_KEYS.MEDICATION_INVENTORY
    );
    return data || [];
  }

  /**
   * Save medications
   */
  private saveMedications(medications: MedicationInventory[]): void {
    persistenceService.set(ENHANCEMENT_STORAGE_KEYS.MEDICATION_INVENTORY, medications);
  }
}

export const medicationTracker = new MedicationTracker();
console.log('✅ [MedicationTracker] Service initialized');

// Initialize medication for default patient
medicationTracker.initializeMedication('patient-1');
