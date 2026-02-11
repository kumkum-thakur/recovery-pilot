# 🔍 Debug Login Issues

## Run This Diagnostic Script

Copy and paste this into your browser console (F12):

```javascript
// LOGIN DIAGNOSTIC SCRIPT
(function() {
  console.log('🔍 RUNNING LOGIN DIAGNOSTICS...');
  console.log('');
  
  // Check 1: localStorage
  console.log('📦 Step 1: Checking localStorage...');
  const usersJson = localStorage.getItem('recovery_pilot_users');
  if (!usersJson) {
    console.error('❌ No users found in localStorage!');
    console.log('💡 Solution: Run the force reset script from FORCE_RESET_NOW.md');
    return;
  }
  console.log('✅ Users data exists in localStorage');
  
  // Check 2: Parse users
  console.log('');
  console.log('📦 Step 2: Parsing users...');
  let users;
  try {
    users = JSON.parse(usersJson);
    console.log('✅ Successfully parsed users');
    console.log(`   Found ${users.length} users`);
  } catch (e) {
    console.error('❌ Failed to parse users JSON:', e);
    return;
  }
  
  // Check 3: Find admin
  console.log('');
  console.log('👤 Step 3: Looking for admin user...');
  const admin = users.find(u => u.username === 'admin');
  if (!admin) {
    console.error('❌ Admin user not found!');
    console.log('💡 Solution: Run the force reset script');
    return;
  }
  console.log('✅ Admin user found');
  console.log('   Username:', admin.username);
  console.log('   Password Hash:', admin.passwordHash);
  console.log('   Role:', admin.role);
  
  // Check 4: Test password hashing
  console.log('');
  console.log('🔐 Step 4: Testing password hash...');
  const testPassword = 'admin';
  const expectedHash = 'simple_hash_admin';
  const actualHash = `simple_hash_${testPassword}`;
  
  console.log('   Test password:', testPassword);
  console.log('   Expected hash:', expectedHash);
  console.log('   Actual hash:', actualHash);
  console.log('   Stored hash:', admin.passwordHash);
  
  if (admin.passwordHash === expectedHash) {
    console.log('✅ Password hash matches!');
  } else {
    console.error('❌ Password hash DOES NOT match!');
    console.log('💡 This is the problem - password hash is wrong');
    console.log('💡 Run the force reset script to fix');
    return;
  }
  
  // Check 5: Test login logic
  console.log('');
  console.log('🔐 Step 5: Simulating login...');
  const inputPassword = 'admin';
  const hashedInput = `simple_hash_${inputPassword}`;
  
  if (hashedInput === admin.passwordHash) {
    console.log('✅ LOGIN SHOULD WORK!');
    console.log('');
    console.log('📋 Try logging in with:');
    console.log('   Username: admin');
    console.log('   Password: admin');
  } else {
    console.error('❌ LOGIN WILL FAIL');
    console.log('   Input hash:', hashedInput);
    console.log('   Stored hash:', admin.passwordHash);
  }
  
  // Summary
  console.log('');
  console.log('📊 DIAGNOSTIC SUMMARY:');
  console.log('   Users in DB:', users.length);
  console.log('   Admin exists:', !!admin);
  console.log('   Password hash correct:', admin.passwordHash === expectedHash);
  console.log('');
  
  // List all users
  console.log('👥 ALL USERS IN DATABASE:');
  users.forEach(u => {
    console.log(`   ${u.role.toUpperCase()}: ${u.username} (hash: ${u.passwordHash})`);
  });
  
})();
```

## What This Does:

1. Checks if users exist in localStorage
2. Verifies admin user exists
3. Checks if password hash is correct
4. Simulates the login process
5. Shows you exactly what's wrong

## After Running:

- If you see ✅ LOGIN SHOULD WORK - try logging in again
- If you see ❌ errors - run the force reset script from FORCE_RESET_NOW.md

## Quick Fix:

If diagnostics show the hash is wrong, run this:

```javascript
// QUICK FIX - Reset admin password
const users = JSON.parse(localStorage.getItem('recovery_pilot_users'));
const adminIndex = users.findIndex(u => u.username === 'admin');
if (adminIndex !== -1) {
  users[adminIndex].passwordHash = 'simple_hash_admin';
  localStorage.setItem('recovery_pilot_users', JSON.stringify(users));
  console.log('✅ Admin password fixed! Try logging in with admin/admin');
}
```
