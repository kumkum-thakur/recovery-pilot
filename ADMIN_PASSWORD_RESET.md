# Admin Password Hard Reset

## Method 1: Using Debug Menu (Easiest)

1. Open the application in your browser
2. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to open the Debug Menu
3. Scroll down to "Admin Password Reset" section
4. Click "Reset Admin Password" button
5. You'll see a confirmation message
6. Login with: **username: `admin`**, **password: `admin`**

## Method 2: Browser Console Command

Open your browser's Developer Console (F12) and run:

```javascript
// Option A: Use the built-in utility function
resetAdminPassword();
```

Or manually:

```javascript
// Option B: Manual reset
(function() {
  const users = JSON.parse(localStorage.getItem('recovery_pilot_users') || '[]');
  const adminIndex = users.findIndex(u => u.username === 'admin');
  
  if (adminIndex !== -1) {
    users[adminIndex].passwordHash = 'simple_hash_admin';
    localStorage.setItem('recovery_pilot_users', JSON.stringify(users));
    console.log('✅ Admin password reset to: admin');
    console.log('Username: admin');
    console.log('Password: admin');
  } else {
    console.log('❌ Admin user not found');
  }
})();
```

## Method 3: Clear All Data (Nuclear Option)

### Via Debug Menu:
1. Press `Ctrl+Shift+D` to open Debug Menu
2. Scroll to "Clear All Data" section
3. Click "Clear All Data" button
4. Confirm the dialog
5. Page will reload with fresh data

### Via Console:
```javascript
// Use the built-in utility
clearAllDataAndReinitialize();
```

Or manually:

```javascript
// Clear all app data
localStorage.clear();
sessionStorage.clear();
console.log('✅ All data cleared. Refresh the page to reinitialize with default users.');
```

Then refresh the page. The app will automatically create:
- **Admin**: username `admin`, password `admin`
- **Patient**: username `divya`, password `divya`
- **Doctor**: username `dr.smith`, password `smith`

## Available Console Utilities

The following functions are automatically available in the browser console:

- `resetAdminPassword()` - Resets admin password to "admin"
- `clearAllDataAndReinitialize()` - Clears all data and forces reinitialization

## Troubleshooting

If admin login still doesn't work after reset:

1. Open browser console (F12)
2. Check for any errors
3. Try the nuclear option (clear all data)
4. Make sure you're using the correct credentials:
   - Username: `admin` (lowercase)
   - Password: `admin` (lowercase)
5. Clear browser cache and cookies if needed
