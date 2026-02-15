/**
 * Utility to hard reset admin password
 * 
 * This is a dev utility to reset the admin password to "admin"
 * Can be called from browser console or added to a debug button
 */

import { persistenceService } from '../services/persistenceService';
import type { UserModel } from '../types';

/**
 * Hard resets the admin user password to "admin"
 * 
 * @returns true if successful, false if admin user not found
 */
export function resetAdminPassword(): boolean {
  try {
    // Get all users
    const users = persistenceService.getAllUsers();
    
    // Find admin user
    const adminUser = users.find(u => u.username === 'admin');
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return false;
    }
    
    // Update password hash
    const updatedAdmin: UserModel = {
      ...adminUser,
      passwordHash: 'simple_hash_admin', // Password: "admin"
    };
    
    // Save updated user
    persistenceService.saveUser(updatedAdmin);
    
    console.log('✅ Admin password reset successfully');
    console.log('Username: admin');
    console.log('Password: admin');
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    return false;
  }
}

/**
 * Clears all application data and forces reinitialization
 * This will recreate all seed users with default passwords
 */
export function clearAllDataAndReinitialize(): void {
  try {
    console.log('🔄 Starting database reinitialization...');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Clear session
    sessionStorage.clear();
    
    console.log('✅ Cleared all existing data');
    
    // Define correct seed users
    const SEED_USERS = [
      {
        id: 'admin-1',
        username: 'admin',
        passwordHash: 'simple_hash_admin', // Password: admin
        name: 'System Administrator',
        role: 'admin',
        streakCount: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'patient-1',
        username: 'divya',
        passwordHash: 'simple_hash_divya', // Password: divya
        name: 'Divya Patel',
        role: 'patient',
        streakCount: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'doctor-1',
        username: 'dr.smith',
        passwordHash: 'simple_hash_smith', // Password: smith
        name: 'Dr. Sarah Smith',
        role: 'doctor',
        streakCount: 0,
        lastLoginDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    
    // Define seed missions
    const SEED_MISSIONS = [
      {
        id: 'mission-1',
        patientId: 'patient-1',
        type: 'photo_upload',
        title: 'Mission 1: Scan Incision',
        description: 'Take a photo of your surgical incision for healing assessment',
        status: 'pending',
        dueDate: new Date().toISOString(),
      },
      {
        id: 'mission-2',
        patientId: 'patient-1',
        type: 'medication_check',
        title: 'Mission 2: Medication Check',
        description: 'Confirm you took your morning antibiotics',
        status: 'pending',
        dueDate: new Date().toISOString(),
      },
    ];
    
    // Define relationships
    const SEED_RELATIONSHIPS = [
      {
        id: 'rel-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        assignedAt: new Date().toISOString(),
        assignedBy: 'admin-1',
        active: true,
      },
    ];
    
    // Initialize localStorage with seed data
    localStorage.setItem('recovery_pilot_users', JSON.stringify(SEED_USERS));
    localStorage.setItem('recovery_pilot_missions', JSON.stringify(SEED_MISSIONS));
    localStorage.setItem('recovery_pilot_relationships', JSON.stringify(SEED_RELATIONSHIPS));
    localStorage.setItem('recovery_pilot_action_items', JSON.stringify([]));
    
    console.log('✅ Database reinitialized with seed data');
    console.log('');
    console.log('📋 Default Credentials:');
    console.log('');
    console.log('👤 Admin:');
    console.log('   Username: admin');
    console.log('   Password: admin');
    console.log('');
    console.log('👤 Patient:');
    console.log('   Username: divya');
    console.log('   Password: divya');
    console.log('');
    console.log('👤 Doctor:');
    console.log('   Username: dr.smith');
    console.log('   Password: smith');
    console.log('');
    console.log('🔄 Refresh the page to apply changes');
  } catch (error) {
    console.error('❌ Error reinitializing database:', error);
  }
}

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).resetAdminPassword = resetAdminPassword;
  (window as unknown as Record<string, unknown>).clearAllDataAndReinitialize = clearAllDataAndReinitialize;
  
  console.log('🔧 Dev utilities loaded:');
  console.log('   - resetAdminPassword()');
  console.log('   - clearAllDataAndReinitialize()');
}
