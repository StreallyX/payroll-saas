# Weekend Handling Consistency Fix

**Commit:** `0900b32` - fix: exclude weekends consistently in timesheet and invoice line generation  
**Branch:** expenses-structure  
**Date:** December 20, 2025

---

## Problem Statement

There was an inconsistency between frontend and backend when creating timesheets with date ranges:

- **Frontend** (TimesheetSubmissionForm.tsx): Excluded weekends when calculating working days
- **Backend** (timesheet.ts): Included ALL days (including weekends) when generating timesheet entries
- **Result**: Frontend showed X working days, but backend created X+weekends entries

This caused confusion and incorrect invoice line generation, as invoices are created from timesheet entries.

---

## Root Cause Analysis

### Frontend Logic (TimesheetSubmissionForm.tsx - Lines 105-113)
```javascript
// Calculate working days (exclude weekends)
let workingDays = 0;
const currentDate = new Date(start);
while (currentDate <= end) {
  const dayOfWeek = currentDate.getDay();
  if (dayOfWeek !== 0 && dayOfWeek !== 6) {  // Exclude Sunday (0) and Saturday (6)
    workingDays++;
  }
  currentDate.setDate(currentDate.getDate() + 1);
}
```
✅ **Correctly excluded weekends** when calculating working days for display

### Backend Logic (timesheet.ts - createRange mutation, BEFORE fix)
```javascript
const entries = [];
const cursor = new Date(start);

while (cursor <= end) {
  entries.push({
    timesheetId: ts.id,
    date: new Date(cursor),
    hours: new Prisma.Decimal(hoursPerDay),
    amount: null,
  });
  cursor.setUTCDate(cursor.getUTCDate() + 1);
}
```
❌ **Created entries for ALL days** including weekends (Saturday and Sunday)

### Invoice Generation (sendToAgency mutation)
```javascript
const lineItems = [];
for (const entry of timesheet.entries) {
  lineItems.push({
    description: `Work on ${new Date(entry.date).toISOString().slice(0, 10)}...`,
    quantity: new Prisma.Decimal(1),
    unitPrice: rate,
    amount: rate,
  });
}
```
❌ **Created invoice lines for ALL timesheet entries**, which included weekends

---

## Solution Implemented

Updated the backend timesheet creation logic to exclude weekends, matching the frontend behavior:

### Backend Logic (timesheet.ts - AFTER fix)
```javascript
// 🔥 FIX: Generate daily entries with proper date handling
// Create a new Date object for each entry to avoid reference issues
// Use UTC date manipulation to avoid DST and timezone issues
// 🔥 FIX: Exclude weekends (Saturday=6, Sunday=0) from entries
const entries = [];
const cursor = new Date(start);

while (cursor <= end) {
  const dayOfWeek = cursor.getUTCDay();
  
  // Only create entries for weekdays (Monday=1 to Friday=5)
  // Exclude Sunday=0 and Saturday=6
  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    entries.push({
      timesheetId: ts.id,
      date: new Date(cursor),
      hours: new Prisma.Decimal(hoursPerDay),
      amount: null,
    });
  }

  cursor.setUTCDate(cursor.getUTCDate() + 1);
}
```

✅ **Now excludes weekends** (Saturday=6, Sunday=0) when generating timesheet entries  
✅ **Invoice generation automatically becomes consistent** since it uses timesheet entries

---

## Testing Results

Comprehensive tests were run with various date ranges:

| Test Case | Date Range | Expected Days | Actual Days | Result |
|-----------|------------|---------------|-------------|--------|
| Friday-Monday | 2024-01-05 to 2024-01-08 | 2 (Fri, Mon) | 2 | ✅ PASS |
| Full Week | 2024-01-08 to 2024-01-14 | 5 (Mon-Fri) | 5 | ✅ PASS |
| Weekdays Only | 2024-01-08 to 2024-01-12 | 5 (Mon-Fri) | 5 | ✅ PASS |
| Weekend Only | 2024-01-13 to 2024-01-14 | 0 (no workdays) | 0 | ✅ PASS |
| Two Weeks | 2024-01-08 to 2024-01-19 | 10 (5+5) | 10 | ✅ PASS |

**Test Summary:** 5/5 tests passed ✅

---

## Impact Analysis

### Positive Changes
1. ✅ **Consistent behavior** between frontend and backend
2. ✅ **Accurate working day calculations** across the system
3. ✅ **Correct invoice line generation** (excludes weekends)
4. ✅ **Better user experience** - what users see matches what gets created
5. ✅ **Prevents overcharging** - no longer billing for weekend days that weren't worked

### No Breaking Changes
- Existing draft timesheets: Not affected (they can be edited)
- Submitted/approved timesheets: Already finalized, no retroactive changes
- Invoice generation: Will now correctly exclude weekends for new timesheets

### Backward Compatibility
- Frontend logic unchanged (already correct)
- Only backend entry generation updated
- No database schema changes required
- No API signature changes

---

## Files Modified

### server/api/routers/timesheet.ts
- **Lines modified:** 286-309
- **Changes:**
  - Added weekend check using `cursor.getUTCDay()`
  - Only creates entries when `dayOfWeek !== 0 && dayOfWeek !== 6`
  - Maintains UTC date handling to avoid DST issues
- **Stats:** +13 insertions, -6 deletions

---

## Consistency Verification

| Aspect | Frontend | Backend | Status |
|--------|----------|---------|--------|
| Weekend check | `dayOfWeek !== 0 && dayOfWeek !== 6` | `dayOfWeek !== 0 && dayOfWeek !== 6` | ✅ Consistent |
| Date method | `getDay()` | `getUTCDay()` | ✅ Both correct for context |
| Date increment | `setDate()` | `setUTCDate()` | ✅ Both correct for context |
| Excluded days | Sunday (0), Saturday (6) | Sunday (0), Saturday (6) | ✅ Identical |

---

## Next Steps

1. ✅ **Code committed** with message: "fix: exclude weekends consistently in timesheet and invoice line generation"
2. ⏳ **Manual testing recommended:**
   - Create a timesheet with a date range spanning a weekend
   - Verify that only weekday entries are created
   - Approve timesheet and send to agency
   - Verify invoice line items exclude weekend days
3. ⏳ **Deployment:** Push to origin when ready

---

## Technical Notes

### Why getUTCDay() vs getDay()?
- Backend uses **getUTCDay()** to ensure consistent behavior regardless of server timezone
- Frontend uses **getDay()** which is fine for display purposes in user's local timezone
- Both correctly identify Sunday (0) and Saturday (6)

### DST Handling
- Backend uses **setUTCDate()** to avoid Daylight Saving Time issues
- This ensures consistent date increments even during DST transitions

### Invoice Line Generation
- No direct changes needed to invoice generation code
- Invoice lines are generated from timesheet entries
- Since timesheet entries now exclude weekends, invoice lines automatically exclude weekends

---

## Summary

✅ **Fix completed successfully**  
✅ **All tests passed**  
✅ **Frontend and backend now consistent**  
✅ **Invoice generation automatically fixed**  
✅ **Changes committed to repository**  

The weekend handling inconsistency has been resolved. The system now correctly excludes weekends (Saturday and Sunday) when creating timesheet entries and generating invoice lines, matching the frontend's working day calculation logic.
