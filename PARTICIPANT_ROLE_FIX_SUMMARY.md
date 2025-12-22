# Participant Role Mismatch Fix

## Problem Summary

The `createSelfInvoice` endpoint was failing with a 400 error: **"Contractor participant not found for this invoice"**

### Root Cause

The invoice code was searching for participants with **UPPERCASE** role names:
- `"CONTRACTOR"`
- `"CLIENT"`

However, the actual contract participants in the database have **lowercase** role names:
- `"contractor"`
- `"client"`

This mismatch caused the participant lookup to fail, resulting in `null` values for both contractor and tenant participants.

## Investigation

1. **Prisma Schema Analysis**: The `ContractParticipant` model uses a `String` field for `role`, not an enum.

2. **Contract Creation Logic**: Examined `createMinimalParticipant.ts` which clearly shows roles are created as lowercase:
   - `"client"` - The tenant company issuing the invoice
   - `"contractor"` - The worker/freelancer being paid
   - `"approver"` - Admin users who approve contracts

3. **Invoice Code**: Found multiple locations in `invoice.ts` using uppercase role names.

## Solution

Fixed all participant role queries in `server/api/routers/invoice.ts` to use **lowercase** role names:

### Changes Made

| Line(s) | Before | After |
|---------|--------|-------|
| 203 | `where: { role: "CONTRACTOR" }` | `where: { role: "contractor" }` |
| 1787 | `p.role === "CONTRACTOR"` | `p.role === "contractor"` |
| 1788 | `p.role === "CLIENT"` | `p.role === "client"` |
| 1980-1981 | `p.role === "CONTRACTOR"` / `"CLIENT"` | `p.role === "contractor"` / `"client"` |
| 2327-2328 | `p.role === "CONTRACTOR"` / `"CLIENT"` | `p.role === "contractor"` / `"client"` |
| 2503 | `p.role === "CONTRACTOR"` | `p.role === "contractor"` |
| 2626 | `p.role === "CONTRACTOR"` | `p.role === "contractor"` |
| 2822 | `p.role === "CLIENT"` | `p.role === "client"` |

### Affected Endpoints

1. `getInvoices` - Invoice listing with contractor filter
2. `getById` - Invoice details with participant lookup
3. `createSelfInvoice` - Self-invoice creation (PRIMARY FIX)
4. `getSelfInvoiceData` - Self-invoice preview
5. `createPayrollSelfInvoice` - Payroll self-invoice creation
6. `getPayrollSelfInvoiceData` - Payroll self-invoice preview
7. `createFeeInvoiceFromParent` - Fee invoice creation

### Documentation Added

Added comprehensive inline documentation in the `createSelfInvoice` function:

```typescript
// 📋 ROLE MAPPING DOCUMENTATION:
// Contract participants use LOWERCASE role names (as defined in createMinimalParticipant.ts):
// - "contractor" = The worker/freelancer being paid (can be User or Company)
// - "client" = The tenant company issuing the invoice (usually a Company)
// - "approver" = Admin users who approve contracts
// - "tenant" = Alternative tenant representation
```

## Verification

- ✅ TypeScript compilation successful
- ✅ All role names consistently lowercase
- ✅ Changes committed and pushed to `fix/enum-casing-mismatch` branch

## Next Steps

The fix is now deployed to the `fix/enum-casing-mismatch` branch. The `createSelfInvoice` endpoint should now correctly identify participants and proceed with invoice creation.

## Commit Details

**Commit**: `8fec5c7`
**Branch**: `fix/enum-casing-mismatch`
**Message**: "fix: correct participant role names from UPPERCASE to lowercase"
