
// =============================================================
// SEED: ROLES
// =============================================================
import { PrismaClient } from "@prisma/client";
import { DEFAULT_ROLE_PERMISSIONS } from "../../server/rbac/permissions-v2";

const prisma = new PrismaClient();

const ROLES = [
  {
    name: "tenant_admin",
    description: "Full access to tenant resources and settings",
    homePath: "/admin",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.tenant_admin,
  },
  {
    name: "finance_manager",
    description: "Manage invoices, payments, and financial reports",
    homePath: "/finance",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.finance_manager,
  },
  {
    name: "hr_manager",
    description: "Manage users, onboarding, and HR operations",
    homePath: "/hr",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.hr_manager,
  },
  {
    name: "payroll_manager",
    description: "Manage payroll, payslips, and timesheets",
    homePath: "/payroll",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.payroll_manager,
  },
  {
    name: "operations_manager",
    description: "Manage contracts, tasks, and operations",
    homePath: "/operations",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.operations_manager,
  },
  {
    name: "accountant",
    description: "View and report on financial data",
    homePath: "/accounting",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.accountant,
  },
  {
    name: "recruiter",
    description: "Manage leads and recruitment",
    homePath: "/recruitment",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.recruiter,
  },
  {
    name: "client_admin",
    description: "Manage client organization",
    homePath: "/client",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.client_admin,
  },
  {
    name: "contractor",
    description: "Self-service access for contractors/workers",
    homePath: "/portal",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.contractor,
  },
  {
    name: "viewer",
    description: "Read-only access to most resources",
    homePath: "/home",
    isSystem: true,
    permissions: DEFAULT_ROLE_PERMISSIONS.viewer,
  },
];

export async function seedRoles(tenantId: string) {
  console.log("👥 Seeding roles...");

  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: roleData.name,
        },
      },
      update: {
        description: roleData.description,
        homePath: roleData.homePath,
        isSystem: roleData.isSystem,
      },
      create: {
        tenantId,
        name: roleData.name,
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

      if (permission) {
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
    }

    console.log(`   ✓ ${role.name} (${roleData.permissions.length} permissions)`);
  }

  console.log(`✅ Roles seeded: ${ROLES.length}`);
}

// Run if executed directly
if (require.main === module) {
  seedRoles(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding roles:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
