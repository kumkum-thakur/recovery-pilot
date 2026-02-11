# ✅ Admin Password Reset - Complete Solution

## What Was Done

Added multiple ways to reset the admin password to make testing easier.

## 🎯 Quick Solution (Recommended)

### Using the Debug Menu:
1. Open the app in your browser: http://localhost:5173/
2. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
3. Scroll down to **"Admin Password Reset"** section
4. Click **"Reset Admin Password"** button
5. You'll see: ✅ Admin password reset to: admin
6. Now login with:
   - **Username**: `admin`
   - **Password**: `admin`

## 🔧 Alternative Methods

### Method 2: Browser Console
1. Press F12 to open Developer Console
2. Type: `resetAdminPassword()`
3. Press Enter
4. You'll see confirmation message

### Method 3: Nuclear Option (Clear Everything)
1. Press `Ctrl+Shift+D` to open Debug Menu
2. Scroll to **"Clear All Data"** section
3. Click **"Clear All Data"** button
4. Confirm the dialog
5. Page reloads with fresh default users

## 📝 Default Credentials

After reset, these are the default users:

| Role    | Username  | Password |
|---------|-----------|----------|
| Admin   | admin     | admin    |
| Patient | divya     | divya    |
| Doctor  | dr.smith  | smith    |

## 🛠️ Technical Details

### Files Modified:
1. **src/utils/resetAdminPassword.ts** - New utility functions
2. **src/components/DebugMenu.tsx** - Added reset buttons
3. **src/main.tsx** - Imported utilities for console access

### Functions Available in Console:
- `resetAdminPassword()` - Resets admin password
- `clearAllDataAndReinitialize()` - Clears all data

### How It Works:
- Password is stored as `simple_hash_admin` in localStorage
- This corresponds to password: `admin`
- The reset function updates the passwordHash field
- Changes take effect immediately

## 🎨 UI Features Added

The Debug Menu now has three sections:

1. **Demo Scenario** - Switch between Happy Path and Risk Detected
2. **Mission Reset** - Reset missions to pending state
3. **Admin Password Reset** - Reset admin password (NEW)
4. **Clear All Data** - Nuclear option to reset everything (NEW)

## 🚀 Testing

To verify it works:

1. Try logging in with wrong password - should fail
2. Open Debug Menu (`Ctrl+Shift+D`)
3. Click "Reset Admin Password"
4. Try logging in with `admin`/`admin` - should succeed
5. You should see the Admin Dashboard

## 📚 Documentation

See `ADMIN_PASSWORD_RESET.md` for detailed instructions and troubleshooting.
