# 🚨 LOGIN FIX - Step by Step Guide

## Problem: Cannot login with admin/admin

## ✅ Solution 1: Use Reset Tool Page (EASIEST)

1. Open this URL in your browser:
   ```
   http://localhost:5173/reset-database.html
   ```

2. Click **"Reset Database"** button

3. You'll see: ✅ DATABASE RESET COMPLETE!

4. Go back to: http://localhost:5173/

5. Login with:
   - Username: `admin`
   - Password: `admin`

---

## ✅ Solution 2: Browser Console (Quick)

1. Open the app: http://localhost:5173/
2. Press **F12** to open console
3. Copy and paste this:

```javascript
localStorage.clear();
sessionStorage.clear();
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
const missions = [
  {
    id: 'mission-1',
    patientId: 'patient-1',
    type: 'photo_upload',
    title: 'Mission 1: Scan Incision',
    description: 'Take a photo',
    status: 'pending',
    dueDate: new Date().toISOString()
  },
  {
    id: 'mission-2',
    patientId: 'patient-1',
    type: 'medication_check',
    title: 'Mission 2: Medication Check',
    description: 'Confirm medication',
    status: 'pending',
    dueDate: new Date().toISOString()
  }
];
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
localStorage.setItem('recovery_pilot_users', JSON.stringify(users));
localStorage.setItem('recovery_pilot_missions', JSON.stringify(missions));
localStorage.setItem('recovery_pilot_relationships', JSON.stringify(relationships));
localStorage.setItem('recovery_pilot_action_items', JSON.stringify([]));
console.log('✅ Database reset! Refresh page and login with admin/admin');
```

4. Press **Enter**
5. Press **F5** to refresh
6. Try logging in

---

## ✅ Solution 3: Debug Menu

1. Open app: http://localhost:5173/
2. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
3. Click **"Clear All Data"**
4. Confirm
5. Page reloads
6. Try logging in

---

## 🔍 Diagnostic Tool

If you want to see what's wrong, run this in console:

```javascript
const users = JSON.parse(localStorage.getItem('recovery_pilot_users') || '[]');
const admin = users.find(u => u.username === 'admin');
console.log('Admin user:', admin);
console.log('Password hash:', admin?.passwordHash);
console.log('Expected hash:', 'simple_hash_admin');
console.log('Match:', admin?.passwordHash === 'simple_hash_admin');
```

---

## 📋 Correct Credentials

After reset, these should work:

| Role    | Username  | Password |
|---------|-----------|----------|
| Admin   | admin     | admin    |
| Patient | divya     | divya    |
| Doctor  | dr.smith  | smith    |

---

## 🎯 Quick Test

After resetting, test each login:

1. **Admin**: http://localhost:5173/ → login with admin/admin → should see Admin Dashboard
2. **Patient**: logout → login with divya/divya → should see Patient Dashboard
3. **Doctor**: logout → login with dr.smith/smith → should see Doctor Dashboard

---

## ❓ Still Not Working?

1. Check browser console (F12) for errors
2. Make sure you're using lowercase: `admin` not `Admin`
3. Try clearing browser cache: Ctrl+Shift+Delete
4. Try incognito/private window
5. Make sure localStorage is enabled in browser settings

---

## 📞 Need Help?

Share the output from this diagnostic:

```javascript
console.log('Users:', localStorage.getItem('recovery_pilot_users'));
console.log('Session:', sessionStorage.getItem('recovery_pilot_current_user'));
```
