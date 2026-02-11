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
    // Clear all localStorage
    localStorage.clear();
    
    // Clear session
    sessionStorage.clear();
    
    console.log('✅ All data cleared');
    console.log('🔄 Refresh the page to reinitialize with default users:');
    console.log('   Admin: username=admin, password=admin');
    console.log('   Patient: username=divya, password=divya');
    console.log('   Doctor: username=dr.smith, password=smith');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).resetAdminPassword = resetAdminPassword;
  (window as any).clearAllDataAndReinitialize = clearAllDataAndReinitialize;
  
  console.log('🔧 Dev utilities loaded:');
  console.log('   - resetAdminPassword()');
  console.log('   - clearAllDataAndReinitialize()');
}
