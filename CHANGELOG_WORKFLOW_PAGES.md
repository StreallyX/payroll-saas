# Workflow System Enhancement - Dedicated Detail Pages

## Summary
Replaced modal-based review workflows with dedicated full-page layouts for timesheets and invoices, improving UX and fixing contractor permission issues.

## Changes Made

### 1. Created Dedicated Detail Pages

#### Timesheet Detail Page
- **Location**: `app/(dashboard)/(modules)/timesheets/[id]/page.tsx`
- **Features**:
  - Full-page layout instead of modal
  - 4 tabs: Timeline, Details, Files, Calculation
  - Breadcrumb navigation (back to list)
  - Status badge in header
  - All workflow actions (submit, review, approve, reject, send to agency)
  - Proper permission checks for contractors vs admins

#### Invoice Detail Page
- **Location**: `app/(dashboard)/(modules)/invoices/[id]/page.tsx`
- **Features**:
  - Full-page layout instead of modal
  - 3 tabs: Details, Line Items, Calculation & Margin
  - Breadcrumb navigation (back to list)
  - Status badge in header
  - Workflow actions based on permissions
  - Enhanced margin calculation display

### 2. Updated List Components

#### TimesheetListAdmin
- **Location**: `components/timesheets/TimesheetListAdmin.tsx`
- **Changes**:
  - Removed modal state management
  - Replaced modal trigger with `Link` to detail page
  - Removed `TimesheetReviewModal` import
  - Buttons now use `asChild` prop with `Link` component

#### Invoice List Page
- **Location**: `app/(dashboard)/(modules)/invoices/page.tsx`
- **Changes**:
  - Removed review modal state
  - Replaced modal trigger buttons with `Link` components
  - Removed `InvoiceReviewModal` import
  - Review and View buttons now navigate to detail page

### 3. Fixed Contractor Permissions

#### Backend Verification
- **submitTimesheet** endpoint properly secured with `timesheet.submit.own`
- Ownership verification: only submitter can submit
- State verification: only drafts can be submitted

#### Frontend Permission Checks
- **Submit button** only visible when:
  1. User has `timesheet.submit.own` permission
  2. User is the owner (`submittedBy === user.id`)
  3. Timesheet is in `draft` state
- **Admin actions** hidden from contractors:
  - Approve/Reject buttons require `timesheet.approve.global`
  - Review button requires `timesheet.review.global`
  - Modify amounts requires `timesheet.modify.global`
  - Send to agency requires `timesheet.approve.global`

### 4. Verified submitTimesheet Endpoint

#### Endpoint Details
- **Location**: `server/api/routers/timesheet.ts` (line 357-394)
- **Permission**: `hasPermission(P.SUBMIT_OWN)` → `"timesheet.submit.own"`
- **Status**: ✅ Endpoint exists and is properly exported
- **Validations**:
  - Verifies timesheet ownership
  - Verifies draft status
  - Verifies timesheet has entries
  - Updates both `status` and `workflowState` fields

## Navigation Flow

### Before (Modal-based)
```
Timesheet List → Click "Review" → Modal opens → Close modal → Back to list
```

### After (Page-based)
```
Timesheet List → Click "Review" → Navigate to /timesheets/[id] → Click "Back" → Return to list
```

## Benefits

1. **Better UX**: Full-page layout provides more space and better navigation
2. **Cleaner URLs**: Shareable links to specific timesheets/invoices
3. **Consistent Pattern**: Matches the contract detail page structure
4. **Proper Permissions**: Contractors can only submit their own drafts
5. **No 404 Errors**: Proper endpoint verification and navigation

## Testing Checklist

- [x] Contractor can create draft timesheet
- [x] Contractor can view their own draft
- [x] Contractor can submit their own draft
- [x] Contractor cannot see admin actions
- [x] Admin can see all actions
- [x] Navigation works (back button, breadcrumbs)
- [x] All tabs render correctly
- [x] Status badges display correctly
- [x] Workflow actions work as expected

## Files Modified

### Created
- `app/(dashboard)/(modules)/timesheets/[id]/page.tsx`
- `app/(dashboard)/(modules)/invoices/[id]/page.tsx`

### Modified
- `components/timesheets/TimesheetListAdmin.tsx`
- `app/(dashboard)/(modules)/invoices/page.tsx`

### Unchanged (for reference)
- `components/timesheets/TimesheetReviewModal.tsx` (kept for backward compatibility if needed)
- `components/invoices/InvoiceReviewModal.tsx` (kept for backward compatibility if needed)
- `server/api/routers/timesheet.ts` (verified, no changes needed)

## Migration Notes

The old modal components are still in the codebase but are no longer used. They can be safely removed in a future cleanup if desired.

## Permissions Reference

### Contractor Permissions (Own Resources)
- `timesheet.read.own` - View own timesheets
- `timesheet.create.own` - Create timesheets
- `timesheet.update.own` - Edit own draft timesheets
- `timesheet.submit.own` - Submit own draft timesheets

### Admin Permissions (Global)
- `timesheet.list.global` - View all timesheets
- `timesheet.review.global` - Mark timesheets as under review
- `timesheet.approve.global` - Approve timesheets & send to agency
- `timesheet.reject.global` - Reject timesheets
- `timesheet.modify.global` - Modify timesheet amounts

## API Endpoints

### Used Endpoints
- `timesheet.getById` - Fetch single timesheet with full details
- `timesheet.submitTimesheet` - Submit draft timesheet (contractor action)
- `timesheet.reviewTimesheet` - Mark as under review (admin action)
- `timesheet.approve` - Approve timesheet (admin action)
- `timesheet.reject` - Reject timesheet (admin action)
- `timesheet.sendToAgency` - Create invoice and send (admin action)
- `timesheet.modifyAmounts` - Modify amounts (admin action)

### Invoice Endpoints
- `invoice.getById` - Fetch single invoice with full details
- `invoice.reviewInvoice` - Mark as under review
- `invoice.approveInvoiceWorkflow` - Approve invoice
- `invoice.rejectInvoiceWorkflow` - Reject invoice
- `invoice.sendInvoiceWorkflow` - Send invoice
- `invoice.modifyInvoiceAmounts` - Modify amounts

---

**Date**: December 8, 2025
**Branch**: `feature/comprehensive-workflow-system`
