# 🚨 FORCE DATABASE RESET - Run This Now

## Copy and Paste This Into Browser Console (F12)

```javascript
// FORCE DATABASE RESET - Copy entire block and paste into console
(function() {
  console.log('🔄 FORCE RESETTING DATABASE...');
  
  // Step 1: Clear everything
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Step 1: Cleared all storage');
  
  // Step 2: Create users with CORRECT password hashes
  const users = [
    {
      id: 'admin-1',
      username: 'admin',
      passwordHash: 'simple_hash_admin',
      name: 'System Administrator',
      role: 'admin',
      streakCount: 0,
      lastLoginDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'patient-1',
      username: 'divya',
      passwordHash: 'simple_hash_divya',
      name: 'Divya Patel',
      role: 'patient',
      streakCount: 0,
      lastLoginDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'doctor-1',
      username: 'dr.smith',
      passwordHash: 'simple_hash_smith',
      name: 'Dr. Sarah Smith',
      role: 'doctor',
      streakCount: 0,
      lastLoginDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];
  
  // Step 3: Create missions
  const missions = [
    {
      id: 'mission-1',
      patientId: 'patient-1',
      type: 'photo_upload',
      title: 'Mission 1: Scan Incision',
      description: 'Take a photo of your surgical incision',
      status: 'pending',
      dueDate: new Date().toISOString()
    },
    {
      id: 'mission-2',
      patientId: 'patient-1',
      type: 'medication_check',
      title: 'Mission 2: Medication Check',
      description: 'Confirm you took your antibiotics',
      status: 'pending',
      dueDate: new Date().toISOString()
    }
  ];
  
  // Step 4: Create relationships
  const relationships = [
    {
      id: 'rel-1',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      assignedAt: new Date().toISOString(),
      assignedBy: 'admin-1',
      active: true
    }
  ];
  
  // Step 5: Save to localStorage
  localStorage.setItem('recovery_pilot_users', JSON.stringify(users));
  localStorage.setItem('recovery_pilot_missions', JSON.stringify(missions));
  localStorage.setItem('recovery_pilot_relationships', JSON.stringify(relationships));
  localStorage.setItem('recovery_pilot_action_items', JSON.stringify([]));
  
  console.log('✅ Step 2: Created users');
  console.log('✅ Step 3: Created missions');
  console.log('✅ Step 4: Created relationships');
  console.log('✅ Step 5: Saved to localStorage');
  
  // Step 6: Verify
  const savedUsers = JSON.parse(localStorage.getItem('recovery_pilot_users'));
  console.log('');
  console.log('🔍 VERIFICATION:');
  console.log('Users in database:', savedUsers.length);
  savedUsers.forEach(u => {
    console.log(`  - ${u.username}: ${u.passwordHash}`);
  });
  
  console.log('');
  console.log('✅ DATABASE RESET COMPLETE!');
  console.log('');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: admin');
  console.log('');
  console.log('Patient:');
  console.log('  Username: divya');
  console.log('  Password: divya');
  console.log('');
  console.log('Doctor:');
  console.log('  Username: dr.smith');
  console.log('  Password: smith');
  console.log('');
  console.log('🔄 NOW REFRESH THE PAGE (F5) AND TRY LOGGING IN');
})();
```

## Steps:

1. **Open your browser** (where the app is running)
2. **Press F12** to open Developer Console
3. **Click on "Console" tab**
4. **Copy the ENTIRE code block above** (from `(function()` to the last `});`)
5. **Paste into console**
6. **Press Enter**
7. **You should see**: ✅ DATABASE RESET COMPLETE!
8. **Press F5** to refresh the page
9. **Try logging in** with: `admin` / `admin`

## If Still Not Working:

Try this simpler version:

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then after page reloads, the app should auto-initialize with default users.

## Troubleshooting:

If you see any errors in the console, copy them and let me know.
