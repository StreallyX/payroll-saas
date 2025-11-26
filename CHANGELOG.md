# Changelog - Payroll SaaS

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2025-11-26

### 🔥 Major Architectural Refactor: Multi-Tenant Multi-Company with RBAC

This release introduces a complete architectural overhaul to support proper multi-tenant, multi-company operations with granular RBAC permissions.

---

## Added

### Database Schema Changes

#### Companies
- **NEW Field**: `companies.type` - Distinguishes between "tenant" (client companies) and "agency" (service provider companies)
- **NEW Index**: `companies_type_idx` for efficient filtering by company type

#### Users
- **NEW Field**: `users.companyId` - Direct relation to Company for inheriting bank accounts and organizational structure
- **NEW Index**: `users_companyId_idx` for efficient company-based queries
- **NEW Foreign Key**: `users_companyId_fkey` to maintain referential integrity

#### Migration
- Migration file: `20251126090649_add_company_type_and_user_company_relation/migration.sql`
- Permissions seed: `seed-permissions.sql` for new RBAC permissions

---

### Backend Helpers

#### Company Helpers (`server/helpers/company.ts`)
- `getTenantCompanies()` - Retrieves companies of type "tenant" (client companies)
- `getAgencyCompanies()` - Retrieves companies of type "agency" (service providers)
- `getUserCompany()` - Gets the company associated with a user
- `getVisibleTenantCompanies()` - Returns tenant companies visible to a user based on RBAC scope
- `canAccessCompany()` - Checks if a user can access a specific company

#### User Helpers (`server/helpers/user.ts`)
- `getUsersVisibleFor()` - **Replaces `getMineUsers()`** - Returns users visible based on RBAC scope:
  - `global`: All tenant users (Platform Admin)
  - `ownCompany`: Users in the same company (Agency Admin)
  - `parent`: Only child users created by the current user
- `getChildUsers()` - Gets users created by a parent user
- `getCompanyUsers()` - Gets all users belonging to a company
- `isUserInCompany()` - Checks if a user belongs to a company

#### Contract Helpers (`server/helpers/contract.ts`)
- `getParticipantDisplayName()` - Returns formatted participant display:
  - Company: "Company Name (represented by User Name)"
  - Individual: "User Name (Individual Contractor)"
- `formatParticipantDisplay()` - Formats participant display for UI
- `assignPlatformApprover()` - **Auto-assigns a Platform Admin as approver for MSA contracts**
- `getContractParticipantsWithDisplay()` - Gets contract participants with display info
- `areAllApproversApproved()` - Checks if all approvers have approved a contract
- `areAllSignaturesComplete()` - Checks if all required signatures are present

---

### Backend Routers

#### Company Router (`server/api/routers/company.ts`)

**New Endpoints**:
- `getTenantCompanies` - Gets tenant companies (with simplified view for Agency Admins)
- `getAgencyCompanies` - Gets agency companies (Platform Admin only)
- `getMyCompany` - Gets the current user's company (Agency Admin)
- `createMyCompany` - Creates an agency company for the current user
  - Automatically sets `type = "agency"`
  - Links user via `companyId` and `CompanyUser` table
- `updateMyCompany` - Updates the current user's company

**Modified Endpoints**:
- `create` - Now accepts `type` parameter ("tenant" | "agency")

#### Bank Router (`server/api/routers/bank.ts`)

**New Endpoints**:
- `getMyCompanyBank` - Gets the bank account for the current user's company
- `setMyCompanyBank` - Creates or updates the bank account for the user's company
  - Automatically links bank to company via `company.bankId`

#### User Router (`server/api/routers/user.ts`)

**Modified Endpoints**:
- `getAll` - Now uses `getUsersVisibleFor()` with RBAC scope detection
  - Platform Admin: `scope = "global"`
  - Agency Admin with company: `scope = "ownCompany"`
  - Others: `scope = "parent"`
- `create` - Now automatically inherits `companyId` from creator
  - Child users inherit parent's company for resource sharing

#### Contract Router (`server/api/routers/contract.ts`)

**Modified Endpoints**:
- `uploadMainDocument` - Now auto-assigns Platform Admin approver for MSA contracts
  - Checks if contract type is "msa"
  - Looks for existing approver
  - If none found, calls `assignPlatformApprover()`
  - Approver selection criteria: oldest Platform Admin with `contract.approve.global` permission

---

### RBAC Permissions

**New Permissions Added**:

#### Company Management
- `company.create.own` - Create own agency company
- `company.update.own` - Update own agency company
- `company.read.own` - View own agency company

#### Bank Account Management
- `bankAccount.create.own` - Create bank account for own company
- `bankAccount.update.own` - Update bank account for own company
- `bankAccount.read.own` - View bank account for own company

#### Contract Approvals
- `contract.approve.global` - Approve any contract (MSA/SOW) globally

#### User Visibility
- `user.list.ownCompany` - List all users in own company

---

### Documentation

- **NEW**: `docs/RBAC_PERMISSIONS.md` - Comprehensive RBAC permissions documentation
  - Permission structure and scopes
  - Permissions by role (Platform Admin, Agency Admin, Agency User, Contractor)
  - Workflow explanations (auto-approver assignment)
  - Inheritance rules (company, parent-child)
  - Visibility matrices
  - Testing scenarios
  - Security considerations
  - Migration guide

---

## Changed

### Database Relationships

- **Users** now have direct `companyId` relation for simplified company-based queries
- **Companies** now have `type` field to distinguish tenant vs agency companies
- **Inheritance**: Child users automatically inherit `companyId` from parent

### User Visibility Logic

- **Before**: `getMineUsers()` returned users based on `createdBy` hierarchy only
- **After**: `getUsersVisibleFor(scope)` returns users based on RBAC scope:
  - More flexible and respects company boundaries
  - Supports `global`, `ownCompany`, and `parent` scopes

### Contract Workflow (MSA)

- **Before**: Agency Admin had to manually select approver (but couldn't see Platform Admins)
- **After**: Platform Admin approver is automatically assigned when MSA is submitted
  - No manual selection needed
  - Approver assignment is transparent and automatic
  - Oldest Platform Admin with `contract.approve.global` is selected

---

## Fixed

### Critical Issues Resolved

1. **Bank Accounts belonged to Users instead of Companies**
   - Fixed: Bank accounts now linked to Companies via `company.bankId`
   - All company users can access shared bank accounts

2. **No distinction between Tenant Companies and Agency Companies**
   - Fixed: Added `companies.type` field
   - Platform Admins can see all; Agency Admins see simplified tenant companies

3. **Inconsistent user visibility (getMineUsers())**
   - Fixed: New `getUsersVisibleFor()` with proper RBAC scope handling
   - Respects company boundaries and parent-child hierarchy

4. **Agency Admin couldn't see Platform Admins for approvers**
   - Fixed: Auto-assignment eliminates the need for manual selection
   - Agency Admin doesn't need to see Platform Admins anymore

5. **No auto-assignment of approvers for MSA**
   - Fixed: `assignPlatformApprover()` automatically assigns on MSA submission
   - Selection is deterministic (oldest admin with permission)

---

## Technical Details

### Scope Definitions

- **`global`**: Access to all resources in the tenant (Platform Admin)
- **`ownCompany`**: Access to resources within the user's company (Agency Admin)
- **`own`**: Access to own resources only (Agency User, Contractor)
- **`parent`**: Access to resources created by the user (parent-child hierarchy)

### Company Type Definitions

- **`tenant`**: Client companies that receive services
  - Visible to Platform Admins (full details)
  - Visible to Agency Admins (simplified: name only)
  - Not visible to Agency Users

- **`agency`**: Service provider companies
  - Visible to Platform Admins (all agencies)
  - Each Agency Admin sees only their own agency
  - Agency Users see their own agency (read-only)

### Participant Display Logic

When displaying contract participants:
- If user has `companyId`: Display as "**Company Name** (represented by User Name)"
- If user has no `companyId`: Display as "**User Name** (Individual Contractor)"

This provides clear indication of whether a contractor is operating as an individual or representing a company.

---

## Migration Instructions

### For Existing Tenants

1. **Run Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed New Permissions**:
   ```bash
   psql $DATABASE_URL < prisma/migrations/20251126090649_add_company_type_and_user_company_relation/seed-permissions.sql
   ```

3. **Assign Permissions to Roles**:
   - Platform Admin: Assign `contract.approve.global`
   - Agency Admin: Assign `company.*.own`, `bankAccount.*.own`, `user.list.ownCompany`
   - Agency User: Assign `company.read.own`, `bankAccount.read.own`

4. **Update Existing Companies**:
   - Set `type = "tenant"` for client companies
   - Set `type = "agency"` for service provider companies

5. **Link Users to Companies**:
   - Update `users.companyId` for agency users
   - Ensure bank accounts are linked to companies, not users

---

## Breaking Changes

⚠️ **Important**: This release includes breaking changes:

1. **getMineUsers() Removed**: 
   - Replace all calls with `getUsersVisibleFor(user, scope)`
   - Update frontend components using this function

2. **Bank Account Structure Changed**:
   - Bank accounts now belong to companies, not users
   - Update queries to use `company.bankId` instead of `user.bankId`

3. **Company Selection in Forms**:
   - Forms must now distinguish between Tenant Company and Agency Company
   - Update contract creation modals accordingly

---

## Security Improvements

- ✅ **Agency Isolation**: Agencies cannot see other agencies' data
- ✅ **Sensitive Data Protection**: Tenant companies shown in simplified form to agencies
- ✅ **Auto-Assignment Safety**: Approvers only auto-assigned for MSA, not SOW
- ✅ **Read-Only Enforcement**: Agency Users have read-only access to company resources
- ✅ **Company-Based Access Control**: Bank accounts shared within company boundaries

---

## Performance Improvements

- New indexes on `companies.type` and `users.companyId` for faster queries
- Optimized user visibility queries using direct company relations
- Reduced N+1 queries in contract participant display

---

## Next Steps

### Recommended Frontend Updates

1. **Create Company Management Page** (`/company/manage`)
   - Form for Agency Admin to create/update company
   - Display company details
   - Link to bank account management

2. **Create Bank Account Management Page** (`/company/bank`)
   - Form for Agency Admin to set/update bank account
   - Display current bank account details
   - Show as read-only for Agency Users

3. **Update Contract Creation Modals**
   - Add company type selection (Tenant vs Agency)
   - Display company vs individual contractor clearly
   - Remove manual approver selection for MSA

4. **Add Company Display Components**
   - Show company information in user profiles
   - Display participant companies in contract views
   - Add company badge/indicator in lists

---

## Testing Checklist

- [ ] Agency Admin can create their own company
- [ ] Agency Admin can create/update bank account for their company
- [ ] Child users inherit parent's companyId
- [ ] Platform Admin auto-assigned as approver for MSA
- [ ] Agency Admin can see tenant companies (simplified)
- [ ] Agency Admin cannot see other agencies
- [ ] getUsersVisibleFor returns correct users for each scope
- [ ] Contract participants display correctly (company vs individual)
- [ ] Bank accounts shared within company

---

## Contributors

- Architecture redesign and implementation
- RBAC permission system enhancement
- Database schema optimization
- Helper functions and routers

---

## References

- See `docs/RBAC_PERMISSIONS.md` for detailed permission documentation
- See migration files in `prisma/migrations/20251126090649_add_company_type_and_user_company_relation/`
- See helper implementations in `server/helpers/`

---

**Version**: Unreleased
**Date**: 2025-11-26
**Branch**: `feature/contract-lifecycle-workflow`
