# 🌱 Payroll SaaS - Seed Scripts

## Overview

This directory contains seed scripts for initializing the Payroll SaaS database with essential data, particularly RBAC (Role-Based Access Control) configurations.

## Scripts

### `seed.ts` - RBAC Seed Script

This script initializes the RBAC system by:
1. Creating/retrieving the default tenant (Aspirock)
2. Creating 8 essential roles
3. Assigning appropriate permissions to each role based on business requirements

## Prerequisites

Before running the seed script, ensure that:

1. **Database is running** and connection string is configured in `.env`
2. **Prisma migrations are applied**: `npm run prisma:migrate`
3. **Permissions are seeded** in the database:
   ```bash
   # Run the SQL seed files
   psql -d your_database -f prisma/migrations/20251126093642_extended_rbac_permissions/seed-permissions.sql
   psql -d your_database -f prisma/migrations/20251126093642_extended_rbac_permissions/seed-permissions-own-scope.sql
   ```

## Usage

### Run the seed script

```bash
npm run seed
```

This will:
- ✅ Create or find the default tenant
- ✅ Create 8 system roles
- ✅ Assign 90+ permissions to roles based on their responsibilities
- ✅ Skip already existing role-permission assignments
- ✅ Report any permissions that are referenced but not found in DB

### Expected Output

```
================================================================================
🌱 PAYROLL SAAS - RBAC SEED
================================================================================

📦 Creating default tenant: Aspirock
✅ Default tenant created: Aspirock (cuid_here)

📋 Fetched 90 permissions from database

🎭 Creating role: Platform Administrator
  ✅ Role created: Platform Administrator (cuid_here)

🔐 Assigning permissions to Platform Administrator...
  ✅ Assigned: 60 | Skipped (already exists): 0 | Not found: 0

[... continues for all 8 roles ...]

================================================================================
📊 SUMMARY
================================================================================

Total Roles Processed: 8
Total Permissions in DB: 90

Permissions Assigned by Role:

  Platform Administrator:
    ✅ Assigned: 60
    ⏭️  Skipped: 0

  Agency Administrator:
    ✅ Assigned: 25
    ⏭️  Skipped: 0

  [... etc ...]

================================================================================
✅ SEED COMPLETED SUCCESSFULLY
================================================================================
```

## Roles Created

### 1. PLATFORM_ADMIN (Level 100)
- **Color**: Red (#dc2626)
- **Icon**: shield-check
- **Permissions**: ~60 global permissions
- **Purpose**: Super admin with full platform access

### 2. AGENCY_ADMIN (Level 50)
- **Color**: Blue (#2563eb)
- **Icon**: building
- **Permissions**: ~25 permissions (ownCompany + own)
- **Purpose**: Manage agency, users, and view contractors

### 3. PAYROLL_PARTNER_ADMIN (Level 50)
- **Color**: Violet (#7c3aed)
- **Icon**: calculator
- **Permissions**: ~15 permissions (ownCompany)
- **Purpose**: Manage workers, upload payslips and invoices

### 4. FINANCE_MANAGER (Level 60)
- **Color**: Emerald (#059669)
- **Icon**: coins
- **Permissions**: ~25 global permissions
- **Purpose**: Manage payments, remittances, and financial reports

### 5. SALES_MANAGER (Level 55)
- **Color**: Orange (#ea580c)
- **Icon**: chart-line
- **Permissions**: ~8 global permissions
- **Purpose**: Manage leads, assign to sales reps, view pipeline

### 6. SALES_REP (Level 40)
- **Color**: Amber (#f59e0b)
- **Icon**: user-tie
- **Permissions**: ~5 permissions (own)
- **Purpose**: Create and manage own leads

### 7. CONTRACTOR (Level 20)
- **Color**: Violet (#8b5cf6)
- **Icon**: user
- **Permissions**: ~15 permissions (own)
- **Purpose**: Manage timesheets, view contracts and payments

### 8. WORKER (Level 20)
- **Color**: Cyan (#06b6d4)
- **Icon**: user-check
- **Permissions**: ~8 permissions (own)
- **Purpose**: View employment contract, payslips, remittances

## Troubleshooting

### Error: "No permissions found in database"

This means the permission seed SQL files haven't been run. Execute:

```bash
psql -d your_database -f prisma/migrations/20251126093642_extended_rbac_permissions/seed-permissions.sql
psql -d your_database -f prisma/migrations/20251126093642_extended_rbac_permissions/seed-permissions-own-scope.sql
```

### Error: "Permission not found: xxx.yyy.zzz"

If you see warnings about permissions not found, it means:
1. The permission key in `seed.ts` doesn't match the database
2. The permission SQL seed file is missing that permission

Check the permission key spelling and ensure all SQL seed files are applied.

### Re-running the seed

The seed script is **idempotent**, meaning you can run it multiple times safely. It will:
- Skip creating roles that already exist
- Skip assigning permissions that are already assigned
- Only create new role-permission relationships

## Permission Scope Explanation

### `global`
- Access to all resources across all companies/tenants
- Assigned to: PLATFORM_ADMIN, FINANCE_MANAGER, SALES_MANAGER

### `ownCompany`
- Access to resources within the user's company only
- Assigned to: AGENCY_ADMIN, PAYROLL_PARTNER_ADMIN

### `own`
- Access to user's own resources only
- Assigned to: CONTRACTOR, WORKER, SALES_REP

## Next Steps After Seeding

1. **Create admin user** and assign PLATFORM_ADMIN role
2. **Test each role** by logging in and verifying permissions
3. **Create test users** for each role type
4. **Verify security** - ensure users can't access unauthorized resources

## Related Documentation

- **Full analysis**: `/home/ubuntu/task_verification_report.md`
- **RBAC Permissions**: `docs/RBAC_PERMISSIONS.md`
- **Implementation Report**: `/home/ubuntu/implementation_report.md`

---

**Last Updated**: 2024-11-26  
**Author**: DeepAgent (Abacus.AI)
