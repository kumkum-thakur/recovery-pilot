# Admin Password Hard Reset

## Quick Reset via Browser Console

Open your browser's Developer Console (F12) and run this command:

```javascript
// Hard reset admin user password to "admin"
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

## Alternative: Clear All Data and Reinitialize

If the above doesn't work, clear all localStorage and refresh:

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

## Manual Reset via Application Code

If you need to add a reset button in the UI, add this to your debug menu or create a reset page.
