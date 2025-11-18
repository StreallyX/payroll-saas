
import { PrismaClient } from "@prisma/client";
import { PERMISSION_GROUPS } from "../../server/rbac/permissions-v2";

export async function seedRoles(prisma: PrismaClient, tenantId: string) {
  // Define roles with their permission groups
  const roles = [
    {
      name: "Super Admin",
      homePath: "/admin/dashboard",
      permissions: ["*"], // All permissions
    },
    {
      name: "Tenant Admin",
      homePath: "/admin/dashboard",
      permissions: PERMISSION_GROUPS.ADMIN_FULL,
    },
    {
      name: "Organization Admin",
      homePath: "/dashboard",
      permissions: PERMISSION_GROUPS.ORGANIZATION_ADMIN || [],
    },
    {
      name: "HR Manager",
      homePath: "/dashboard",
      permissions: [
        ...PERMISSION_GROUPS.BASE_USER,
        "users.manage.view_all",
        "users.manage.create",
        "users.manage.update",
        "users.roles.view",
        "users.roles.assign",
        "organizations.view_own",
        "organizations.manage.view_all",
        "contracts.manage.view_all",
        "contracts.manage.create",
        "contracts.manage.update",
        "invoices.manage.view_all",
      ],
    },
    {
      name: "Contractor",
      homePath: "/contractor/dashboard",
      permissions: PERMISSION_GROUPS.CONTRACTOR_FULL,
    },
    {
      name: "Agency Owner",
      homePath: "/agency/dashboard",
      permissions: PERMISSION_GROUPS.AGENCY_OWNER,
    },
    {
      name: "Finance Manager",
      homePath: "/finance/dashboard",
      permissions: [
        ...PERMISSION_GROUPS.BASE_USER,
        "invoices.manage.view_all",
        "invoices.manage.create",
        "invoices.manage.update",
        "invoices.manage.send",
        "invoices.manage.mark_paid",
        "payments.manage.view_all",
        "payments.manage.create",
        "payments.manage.approve",
        "expenses.manage.view_all",
        "expenses.manage.approve",
      ],
    },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: roleData.name } },
      update: { homePath: roleData.homePath },
      create: {
        tenantId,
        name: roleData.name,
        homePath: roleData.homePath,
      },
    });

    // Assign permissions
    if (roleData.permissions[0] === "*") {
      // Super Admin gets all permissions
      const allPermissions = await prisma.permission.findMany();
      for (const permission of allPermissions) {
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
    } else {
      // Assign specific permissions
      for (const permKey of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { key: permKey },
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
    }
  }
}
