import { PrismaClient } from "@prisma/client"
import { PERMISSIONS } from "./00-permissions"

export const prisma = new PrismaClient()

export const DEFAULT_ROLES = [
  {
    name: "admin",
    permissions: PERMISSIONS, // admin has ALL permissions
  },
  {
    name: "finance_manager",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("invoices.") ||
      p.startsWith("payroll.") ||
      p.startsWith("banks.") ||
      p.startsWith("contracts.view")
    ),
  },
  {
    name: "hr_manager",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("contractors.") ||
      p.startsWith("agencies.") ||
      p.startsWith("onboarding.")
    ),
  },
  {
    name: "recruiter",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("contractors.") ||
      p.startsWith("leads.")
    ),
  },
  {
    name: "viewer",
    permissions: PERMISSIONS.filter(p =>
      p.endsWith(".view")
    ),
  },
  {
    name: "agency_owner",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("agencies.") ||
      p.startsWith("contractors.") ||
      p.startsWith("contracts.") ||
      p.endsWith(".view")
    ),
  },
]

export async function seedDefaultRoles(tenantId: string) {
  console.log("👉 Seeding default roles...")

  for (const role of DEFAULT_ROLES) {
    const createdRole = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: role.name,
        },
      },
      update: {},
      create: {
        tenantId,
        name: role.name,
      },
    })

    // assign permissions
    for (const key of role.permissions) {
      const permission = await prisma.permission.findUnique({ where: { key } })
      if (!permission) continue

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: createdRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: createdRole.id,
          permissionId: permission.id,
        },
      })
    }
  }

  console.log("✅ Default roles created.")
}
