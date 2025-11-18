
/**
 * Seed Roles
 * Creates default roles with appropriate permissions
 */
import { PrismaClient } from "@prisma/client";
import {
  TENANT_ADMIN_PERMISSIONS,
  FINANCE_MANAGER_PERMISSIONS,
  HR_MANAGER_PERMISSIONS,
  OPERATIONS_MANAGER_PERMISSIONS,
  CONTRACTOR_PERMISSIONS,
  ACCOUNTANT_PERMISSIONS,
  TEAM_LEAD_PERMISSIONS,
  VIEWER_PERMISSIONS,
} from "../../server/rbac/permissions-v2";

export const prisma = new PrismaClient();

// Default roles to create
export const DEFAULT_ROLES = [
  {
    name: "tenant_admin",
    displayName: "Tenant Administrator",
    description: "Full access to all tenant features and settings",
    homePath: "/admin/dashboard",
    permissions: TENANT_ADMIN_PERMISSIONS,
    isSystem: true,
  },
  {
    name: "finance_manager",
    displayName: "Finance Manager",
    description: "Manage invoices, payments, and financial operations",
    homePath: "/finance/dashboard",
    permissions: FINANCE_MANAGER_PERMISSIONS,
    isSystem: true,
  },
  {
    name: "hr_manager",
    displayName: "HR Manager",
    description: "Manage users, contracts, and HR operations",
    homePath: "/hr/dashboard",
    permissions: HR_MANAGER_PERMISSIONS,
    isSystem: true,
  },
  {
    name: "operations_manager",
    displayName: "Operations Manager",
    description: "Manage daily operations, contracts, and timesheets",
    homePath: "/operations/dashboard",
    permissions: OPERATIONS_MANAGER_PERMISSIONS,
    isSystem: true,
  },
  {
    name: "accountant",
    displayName: "Accountant",
    description: "Handle invoicing, payments, and financial records",
    homePath: "/accounting/dashboard",
    permissions: ACCOUNTANT_PERMISSIONS,
    isSystem: false,
  },
  {
    name: "team_lead",
    displayName: "Team Lead",
    description: "Manage team members and approve timesheets",
    homePath: "/team/dashboard",
    permissions: TEAM_LEAD_PERMISSIONS,
    isSystem: false,
  },
  {
    name: "contractor",
    displayName: "Contractor",
    description: "Self-service access for contractors/workers",
    homePath: "/contractor/dashboard",
    permissions: CONTRACTOR_PERMISSIONS,
    isSystem: true,
  },
  {
    name: "viewer",
    displayName: "Viewer",
    description: "Read-only access to system",
    homePath: "/dashboard",
    permissions: VIEWER_PERMISSIONS,
    isSystem: false,
  },
];

export async function seedDefaultRoles(tenantId: string) {
  console.log("👉 Seeding default roles...");

  for (const roleData of DEFAULT_ROLES) {
    // Create or update role
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: roleData.name,
        },
      },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
        homePath: roleData.homePath,
        isSystem: roleData.isSystem,
      },
      create: {
        tenantId,
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        homePath: roleData.homePath,
        isSystem: roleData.isSystem,
        isActive: true,
      },
    });

    // Assign permissions to role
    for (const permissionKey of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { key: permissionKey },
      });

      if (!permission) {
        console.warn(`⚠️  Permission not found: ${permissionKey}`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`   ✓ Created role: ${roleData.displayName} (${roleData.permissions.length} permissions)`);
  }

  console.log("✅ Default roles created & permissions assigned.");
}
