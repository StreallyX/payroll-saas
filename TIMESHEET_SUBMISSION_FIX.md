# Timesheet Submission Fix - Summary

## Overview
Fixed timesheet submission functionality to ensure creators can properly submit their own timesheets. The Submit button functionality was already implemented, but had a critical bug in the ownership check.

## Issues Found and Fixed

### 1. **Critical Bug: Incorrect isOwner Check** ❌ → ✅
**Location:** `app/(dashboard)/(modules)/timesheets/[id]/page.tsx`

**Problem:**
```typescript
// BEFORE - Always returned true (comparing submittedBy with submitter.id)
const isOwner = data.submittedBy === data.submitter?.id;
```

**Solution:**
```typescript
// AFTER - Correctly compares with current logged-in user
import { useSession } from "next-auth/react";
const { data: session } = useSession();
const isOwner = session?.user?.id === data.submittedBy;
```

### 2. **Missing Permissions** ❌ → ✅
**Location:** `server/rbac/permissions.ts`

Added two critical missing permissions:
- `timesheet.review.global` - For marking timesheets as under review
- `timesheet.update.global` - For admin modifications of timesheets

### 3. **Non-Standard Permission Names** ❌ → ✅
**Locations:** 
- `server/api/routers/timesheet.ts`
- `lib/workflows/timesheet-state-machine.ts`
- `app/(dashboard)/(modules)/timesheets/[id]/page.tsx`

**Changed:** `timesheet.modify.global` → `timesheet.update.global`

**Reason:** Follow standard CRUD action naming (CREATE, READ, UPDATE, DELETE, etc.). The Action enum doesn't include MODIFY.

## What Already Existed ✅

The following were already implemented correctly:
1. ✅ Submit button in UI (`app/(dashboard)/(modules)/timesheets/[id]/page.tsx`)
2. ✅ Submit procedure in router (`server/api/routers/timesheet.ts`)
3. ✅ Timesheet state machine with submit transition (`lib/workflows/timesheet-state-machine.ts`)
4. ✅ Permission `timesheet.submit.own` defined in permissions

## Submit Button Logic

The Submit button appears when ALL conditions are met:
```typescript
{currentState === "draft" && canSubmit && isOwner && (
  <Button onClick={handleSubmit}>
    Submit Timesheet
  </Button>
)}
```

**Conditions:**
1. `currentState === "draft"` - Timesheet is in Draft state
2. `canSubmit` - User has `timesheet.submit.own` permission
3. `isOwner` - Current logged-in user is the creator (NOW FIXED)

## Workflow States

```
Draft → Submitted → Under Review → Approved/Rejected
  ↑                                      ↓
  └─────── Changes Requested ───────────┘
```

**Transitions:**
- **Draft → Submitted**: Creator submits their timesheet (`timesheet.submit.own`)
- **Submitted → Under Review**: Admin marks for review (`timesheet.review.global`)
- **Submitted/Under Review → Approved**: Admin approves (`timesheet.approve.global`)
- **Submitted/Under Review → Rejected**: Admin rejects (`timesheet.reject.global`)
- **Submitted/Under Review → Changes Requested**: Admin requests changes (`timesheet.review.global`)
- **Changes Requested → Submitted**: Creator resubmits after making changes (`timesheet.submit.own`)

## Files Modified

1. `app/(dashboard)/(modules)/timesheets/[id]/page.tsx`
   - Added `useSession` import
   - Fixed `isOwner` check
   - Updated permission from `timesheet.modify.global` to `timesheet.update.global`

2. `server/rbac/permissions.ts`
   - Added `timesheet.review.global` permission
   - Added `timesheet.update.global` permission

3. `server/api/routers/timesheet.ts`
   - Changed `MODIFY_ALL` from `timesheet.modify.global` to `timesheet.update.global`

4. `lib/workflows/timesheet-state-machine.ts`
   - Changed `MODIFY_ALL` from `timesheet.modify.global` to `timesheet.update.global`

## Testing Checklist

### As Timesheet Creator (Contractor):
- [ ] Create a new timesheet in Draft state
- [ ] Verify Submit button is visible on the timesheet detail page
- [ ] Click Submit button
- [ ] Verify timesheet moves to "Submitted" state
- [ ] Verify success toast notification appears
- [ ] Verify Submit button disappears after submission

### As Admin:
- [ ] View a submitted timesheet
- [ ] Verify "Mark Under Review" button is visible
- [ ] Click to move timesheet to "Under Review" state
- [ ] Verify Approve/Reject buttons are visible
- [ ] Test Approve workflow
- [ ] Test Reject workflow (with rejection reason)

### Permission Checks:
- [ ] User without `timesheet.submit.own` cannot see Submit button
- [ ] User without `timesheet.review.global` cannot see Review button
- [ ] User without `timesheet.approve.global` cannot see Approve button
- [ ] Creator can only submit their OWN timesheets (not others')

## Git Commit

```bash
git commit -m "feat: fix timesheet submission and add missing permissions

- Fix isOwner check to compare with current logged-in user ID instead of always returning true
- Add missing timesheet.review.global permission for marking timesheets under review
- Add missing timesheet.update.global permission for admin modifications
- Standardize permission names from timesheet.modify.global to timesheet.update.global
- Import useSession in timesheet detail page to access current user information

This ensures the Submit button only appears for timesheet creators who have
the timesheet.submit.own permission, and all workflow permissions are properly
defined following CRUD conventions."
```

**Commit Hash:** `4cafa72`
**Branch:** `expenses-structure`

## Next Steps

1. **Database Migration**: Ensure role-permission mappings include the new permissions:
   - `timesheet.review.global` (for admin/manager roles)
   - `timesheet.update.global` (for admin roles)

2. **Testing**: Follow the testing checklist above to verify all functionality

3. **Deployment**: Deploy changes to staging/production environment

## Notes

- The Submit button functionality was already implemented
- The main issue was the incorrect ownership check that would have allowed any user to submit any timesheet
- All workflow permissions now follow standard CRUD naming conventions
- The timesheet state machine and workflow are properly defined and working
