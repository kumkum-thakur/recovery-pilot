# Database Reset & Admin Access Guide

## 🚀 Quick Reset (Recommended)

### Method 1: Using Debug Menu
1. Open the app: http://localhost:5173/
2. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
3. Click **"Clear All Data"** button
4. Confirm the dialog
5. Page will reload with fresh data

### Method 2: Browser Console
1. Press F12 to open Developer Console
2. Copy and paste the reinitialization script:

```javascript
// Copy the entire content from: scripts/reinitialize-db.js
// Or use the built-in function:
clearAllDataAndReinitialize();
```

3. Press Enter
4. Refresh the page

## 🔑 Default Credentials

After reinitialization, use these credentials:

| Role    | Username  | Password | Dashboard URL          |
|---------|-----------|----------|------------------------|
| Admin   | admin     | admin    | /admin                 |
| Patient | divya     | divya    | /patient               |
| Doctor  | dr.smith  | smith    | /doctor                |

## 🛠️ What Gets Reset

When you reinitialize the database:

✅ **Cleared:**
- All user data
- All missions
- All action items
- All relationships
- Session data
- Streak counts

✅ **Recreated:**
- 3 default users (admin, patient, doctor)
- 2 default missions for patient
- 1 doctor-patient relationship
- Fresh timestamps

## 🎯 Dev Mode Features

### Streak Testing (2-Minute Intervals)
- Streaks now reset after 2 minutes instead of 24 hours
- Complete missions and wait 2+ minutes to test reset
- Check console for timing logs

### Debug Menu (`Ctrl+Shift+D`)
- **Demo Scenario**: Switch between Happy Path and Risk Detected
- **Mission Reset**: Reset missions to pending state
- **Admin Password Reset**: Reset admin password only
- **Clear All Data**: Full database reset

## 🔧 Troubleshooting

### Admin Login Not Working?
1. Open Debug Menu (`Ctrl+Shift+D`)
2. Click "Reset Admin Password"
3. Try logging in with: `admin` / `admin`

### Still Not Working?
1. Open Debug Menu (`Ctrl+Shift+D`)
2. Click "Clear All Data"
3. Confirm and wait for page reload
4. Try logging in again

### Console Method:
```javascript
// Option 1: Reset password only
resetAdminPassword();

// Option 2: Full reset
clearAllDataAndReinitialize();
```

## 📝 Technical Details

### Password Hashing
- Format: `simple_hash_{password}`
- Example: Password "admin" → Hash "simple_hash_admin"
- This is for MVP only - production should use bcrypt

### Storage Keys
- `recovery_pilot_users` - User accounts
- `recovery_pilot_missions` - Patient missions
- `recovery_pilot_relationships` - Doctor-patient assignments
- `recovery_pilot_action_items` - Doctor action items
- `recovery_pilot_current_user` - Session data (sessionStorage)

### Files Modified
- `src/utils/resetAdminPassword.ts` - Reset utilities
- `src/components/DebugMenu.tsx` - UI controls
- `src/main.tsx` - Console function exports
- `scripts/reinitialize-db.js` - Standalone reset script

## 🎨 Testing Workflow

1. **Initial Setup**: Clear all data via Debug Menu
2. **Login as Patient**: Test mission completion
3. **Wait 2 Minutes**: Test streak reset
4. **Reset Missions**: Use Debug Menu to reset
5. **Login as Doctor**: Test action items
6. **Login as Admin**: Verify admin dashboard

## 📚 Additional Resources

- Property tests reduced to 20 iterations for faster execution
- Dev server running at: http://localhost:5173/
- All changes hot-reload automatically
