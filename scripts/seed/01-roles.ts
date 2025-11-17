// /seed/01-roles.ts
import { PrismaClient } from "@prisma/client"
import { PERMISSIONS } from "./00-permissions"

export const prisma = new PrismaClient()

// -------------------------------------------------------------
// MASTER DEFAULT ROLES (tenant roles)
// -------------------------------------------------------------
export const DEFAULT_ROLES = [
  {
    name: "admin",
    homePath: "/admin",
    permissions: PERMISSIONS, // full access
  },

  {
    name: "hr_manager",
    homePath: "/hr",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("contractors.") ||
      p.startsWith("agencies.") ||
      p.startsWith("onboarding.") ||
      p === "companies.view" ||
      p === "tasks.view" ||
      p === "tasks.create" ||
      p === "tasks.assign"
    ),
  },

  {
    name: "finance_manager",
    homePath: "/finance",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("invoices.") ||
      p.startsWith("banks.") ||
      p.startsWith("payroll.") ||
      p === "contracts.view"
    ),
  },

  {
    name: "agency_owner",
    homePath: "/agency",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("agencies.") ||
      p.startsWith("contractors.") ||
      p.startsWith("contracts.") ||
      p.endsWith(".view")
    ),
  },

  {
    name: "payroll_manager",
    homePath: "/payroll",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("payroll.") ||
      p.startsWith("contracts.view") ||
      p.startsWith("invoices.view") ||
      p.startsWith("payslip.")
    ),
  },

  {
    name: "recruiter",
    homePath: "/recruitment",
    permissions: PERMISSIONS.filter(p =>
      p.startsWith("contractors.") ||
      p.startsWith("leads.")
    ),
  },

  {
    name: "contractor",
    homePath: "/dashboard", // Updated in Phase 3: /contractor → /dashboard
    permissions: [
      // ✅ Existing permissions (keep these)
      "onboarding.responses.view_own",
      "onboarding.responses.submit",
      "contracts.view",
      "payslip.view",
      
      // 🆕 Personal Information
      "contractors.update",
      "contractors.documents.upload",
      "contractors.documents.view",
      
      // 🆕 Timesheets
      "timesheet.view",
      "timesheet.create",
      "timesheet.submit",
      
      // 🆕 Expenses
      "expense.view",
      "expense.create",
      "expense.submit",
      
      // 🆕 Invoices
      "invoices.view",
      "invoices.create",
      
      // 🆕 Remits/Payroll
      "payroll.view",
      
      // 🆕 Referrals
      "referrals.view",
      "referrals.create",
      "referrals.track",
    ].filter(Boolean),
  },

  {
    name: "viewer",
    homePath: "/home",
    permissions: PERMISSIONS.filter(p => p.endsWith(".view")),
  },
]

// -------------------------------------------------------------
// ROLE SEEDER FUNCTION
// -------------------------------------------------------------
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
      update: {
        homePath: role.homePath, // ensure homePath is always correct
      },
      create: {
        tenantId,
        name: role.name,
        homePath: role.homePath,
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

  console.log("✅ Default roles created & permissions assigned.")
}
