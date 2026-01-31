# Streak Tracking Implementation

## Overview

This document describes the implementation of streak tracking logic for Task 16.2 in the RecoveryPilot application.

## Requirements

The implementation satisfies the following requirements:

- **Requirement 10.1**: Increment streak on all missions completed
- **Requirement 10.2**: Reset streak on missed day
- **Requirement 10.4**: Persist streak across sessions

## Implementation Details

### 1. UserStore Enhancements

Added the following methods to `src/stores/userStore.ts`:

#### `incrementStreak()`
- Increments the patient's streak count by 1
- Validates that a patient is logged in
- Persists the updated streak to storage
- Updates the session

#### `resetStreak()`
- Resets the patient's streak count to 0
- Used when a day is missed
- Persists the reset to storage
- Updates the session

#### `checkAndUpdateStreakForMissedDay()`
- Compares the last mission check date with today
- If more than 1 day has passed, resets the streak
- Should be called when the patient logs in or when missions are loaded
- Handles the "missed day" detection logic

#### `updateLastMissionCheckDate(date: string)`
- Updates the last date when missions were checked/completed
- Used to track daily activity for streak reset logic

#### State Addition
- Added `lastMissionCheckDate: string | null` to track when missions were last completed

### 2. MissionStore Enhancements

Added the following method to `src/stores/missionStore.ts`:

#### `areAllDailyMissionsCompleted()`
- Filters missions to only include today's missions
- Checks if all of them have status `COMPLETED`
- Returns `false` if no missions exist for today
- Returns `true` only if all today's missions are completed

### 3. MissionStream Component Integration

Updated `src/components/MissionStream.tsx` to integrate streak tracking:

#### Added useEffect Hook
```typescript
useEffect(() => {
  if (currentUser?.role === 'patient' && missions.length > 0) {
    checkAndUpdateStreakForMissedDay();
  }
}, [currentUser?.role, missions.length, checkAndUpdateStreakForMissedDay]);
```
- Checks for missed days when missions are loaded
- Only runs for patients

#### Added `checkAndUpdateStreak()` Helper
```typescript
const checkAndUpdateStreak = () => {
  if (currentUser?.role !== 'patient') {
    return;
  }

  if (areAllDailyMissionsCompleted()) {
    incrementStreak();
    updateLastMissionCheckDate(new Date().toISOString());
    console.log('🎉 All daily missions completed! Streak incremented.');
  }
};
```
- Called after any mission is completed
- Checks if all daily missions are done
- If yes, increments streak and updates last check date

#### Updated Mission Completion Handlers
- `handleAction()`: Calls `checkAndUpdateStreak()` after completing non-photo missions
- `handlePhotoSubmit()`: Calls `checkAndUpdateStreak()` after photo upload missions

## Workflow

### Daily Mission Completion Flow

1. Patient completes a mission (photo upload or other type)
2. Mission status is updated to `COMPLETED` in persistence
3. `checkAndUpdateStreak()` is called
4. `areAllDailyMissionsCompleted()` checks if all today's missions are done
5. If yes:
   - `incrementStreak()` increases streak by 1
   - `updateLastMissionCheckDate()` records today's date
   - Streak is persisted to storage

### Missed Day Detection Flow

1. Patient logs in or missions are loaded
2. `checkAndUpdateStreakForMissedDay()` is called
3. Compares `lastMissionCheckDate` with today
4. If more than 1 day has passed:
   - `resetStreak()` sets streak to 0
   - Streak is persisted to storage
   - Console logs the missed days

### Persistence

All streak data is persisted through:
- `persistenceService.saveUser()` - Updates the user's `streakCount` in LocalStorage
- `authService.updateCurrentUser()` - Updates the session
- Zustand store state - Updates the UI immediately

## Testing

### Unit Tests

Created comprehensive unit tests in:
- `src/stores/userStore.streak.test.ts` (17 tests)
- `src/stores/missionStore.streak.test.ts` (7 tests)

#### UserStore Tests Cover:
- ✅ Incrementing streak count
- ✅ Persisting incremented streak
- ✅ Resetting streak to 0
- ✅ Persisting reset streak
- ✅ Checking for missed days
- ✅ Not resetting if checked today or yesterday
- ✅ Resetting if more than 1 day passed
- ✅ Error handling (no user, doctor user)
- ✅ Full integration workflow

#### MissionStore Tests Cover:
- ✅ Returning false when no missions exist
- ✅ Returning false when no missions due today
- ✅ Returning false when some missions pending
- ✅ Returning true when all today missions completed
- ✅ Only checking today's missions (not past/future)
- ✅ Handling missions with different times on same day
- ✅ Handling overdue missions

### Test Results

All 24 tests pass successfully:
```
✓ src/stores/userStore.streak.test.ts (17 tests)
✓ src/stores/missionStore.streak.test.ts (7 tests)
```

## Edge Cases Handled

1. **No missions for today**: Returns false, doesn't increment streak
2. **First time user**: No last check date, doesn't reset streak
3. **Checked today**: Doesn't reset streak
4. **Checked yesterday**: Doesn't reset streak (allows 1 day gap)
5. **Missed 2+ days**: Resets streak to 0
6. **Doctor users**: Streak methods throw appropriate errors
7. **No user logged in**: Streak methods throw appropriate errors
8. **Negative streak counts**: Rejected with error
9. **Missions at different times same day**: All counted as "today"
10. **Overdue missions**: Not counted as completed

## Files Modified

1. `src/types/index.ts`
   - Added `lastMissionCheckDate` to `UserStore` interface
   - Added new methods to `UserStore` interface
   - Added `areAllDailyMissionsCompleted` to `MissionStore` interface

2. `src/stores/userStore.ts`
   - Added `lastMissionCheckDate` state
   - Implemented `incrementStreak()`
   - Implemented `resetStreak()`
   - Implemented `checkAndUpdateStreakForMissedDay()`
   - Implemented `updateLastMissionCheckDate()`

3. `src/stores/missionStore.ts`
   - Implemented `areAllDailyMissionsCompleted()`

4. `src/components/MissionStream.tsx`
   - Added useEffect for missed day detection
   - Added `checkAndUpdateStreak()` helper
   - Updated `handleAction()` to check streak
   - Updated `handlePhotoSubmit()` to check streak

## Files Created

1. `src/stores/userStore.streak.test.ts` - Unit tests for UserStore streak logic
2. `src/stores/missionStore.streak.test.ts` - Unit tests for MissionStore streak logic
3. `STREAK_TRACKING_IMPLEMENTATION.md` - This documentation

## Future Enhancements

Potential improvements for future iterations:

1. **Streak Milestones**: Trigger special celebrations at 7, 30, 100 days
2. **Streak Recovery**: Allow one "grace day" to recover a broken streak
3. **Streak History**: Track historical streak data for analytics
4. **Notifications**: Remind users before streak is about to break
5. **Timezone Handling**: Better handling of different timezones
6. **Partial Credit**: Award partial streaks for completing some missions

## Conclusion

The streak tracking logic has been successfully implemented with:
- ✅ Automatic increment when all daily missions are completed
- ✅ Automatic reset when a day is missed
- ✅ Persistence across sessions
- ✅ Comprehensive error handling
- ✅ Full test coverage
- ✅ Integration with existing mission completion flow

The implementation is production-ready and meets all requirements specified in Task 16.2.
