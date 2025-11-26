/**
 * =============================================================================
 * PAYROLL SAAS - RBAC SEED SCRIPT
 * =============================================================================
 * 
 * Purpose: Assign permissions to roles based on the business requirements
 * documented in "Everything starts in this order.docx"
 * 
 * This script:
 * 1. Creates/retrieves 8 essential roles
 * 2. Fetches all permissions from the database
 * 3. Assigns appropriate permissions to each role based on scope
 * 4. Handles multi-tenancy (creates roles for default tenant)
 * 
 * Usage: npm run seed
 * 
 * Date: 2024-11-26
 * =============================================================================
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// =============================================================================
// ROLE DEFINITIONS
// =============================================================================

interface RoleDefinition {
  name: string
  displayName: string
  description: string
  level: number
  homePath: string
  color: string
  icon: string
  permissionKeys: string[]
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. PLATFORM_ADMIN - Super Admin with all global permissions
  // ---------------------------------------------------------------------------
  {
    name: "PLATFORM_ADMIN",
    displayName: "Platform Administrator",
    description: "Full access to all platform features and all tenants. Can manage everything.",
    level: 100,
    homePath: "/dashboard",
    color: "#dc2626", // red-600
    icon: "shield-check",
    permissionKeys: [
      // User Management
      "user.create.global",
      "user.list.global",
      "user.update.global",
      "user.delete.global",
      "user.activate.global",
      "user.deactivate.global",

      // Company Management
      "company.create.global",
      "company.list.global",
      "company.update.global",
      "company.delete.global",
      "company.activate.global",
      "company.deactivate.global",

      // Bank Management
      "bank.create.global",
      "bank.list.global",
      "bank.update.global",
      "bank.delete.global",

      // Contract Management
      "contract.list.global",
      "contract.create.global",
      "contract.update.global",
      "contract.delete.global",
      "contract.approve.global",
      "contract_msa.list.global",
      "contract_msa.create.global",
      "contract_msa.update.global",

      // Invoice Management
      "invoice.list.global",
      "invoice.create.global",
      "invoice.update.global",
      "invoice.delete.global",
      "invoice.generate_from_timesheet.global",
      "invoice.release.global",
      "invoice.approve.global",
      "invoice.send.global",

      // Payment Management
      "payment.create.global",
      "payment.list.global",
      "payment.approve.global",
      "payment.execute.global",
      "payment.cancel.global",

      // Remittance Management
      "remittance.create.global",
      "remittance.list.global",
      "remittance.generate.global",
      "remittance.send.global",

      // Payslip Management
      "payslip.list.global",
      "payslip.create.global",
      "payslip.generate.global",
      "payslip.send.global",

      // Contractor Management (Global visibility)
      "contractor.list.global",
      "contractor.view.global",

      // Worker Management (Global visibility)
      "worker.list.global",
      "worker.view.global",

      // Timesheet Management
      "timesheet.list.global",
      "timesheet.approve.global",
      "timesheet.reject.global",

      // Document Management
      "document.list.global",
      "document.create.global",
      "document.update.global",
      "document.delete.global",

      // Reporting
      "report.view_margin.global",
      "report.view_live_contractors.global",
      "report.view_by_country.global",
      "report.view_by_client.global",
      "report.view_income.global",
      "report.export.global",

      // Onboarding Management
      "onboarding.view.global",
      "onboarding.update.global",

      // Lead Management
      "lead.list.global",
      "lead.create.global",
      "lead.update.global",
      "lead.delete.global",
      "lead.assign.global",
      "lead.export.global",
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. AGENCY_ADMIN - Agency/Client administrator
  // ---------------------------------------------------------------------------
  {
    name: "AGENCY_ADMIN",
    displayName: "Agency Administrator",
    description: "Agency or client administrator. Can manage their own company, users, and view their contractors.",
    level: 50,
    homePath: "/dashboard",
    color: "#2563eb", // blue-600
    icon: "building",
    permissionKeys: [
      // Company Management (own)
      "company.read.own",
      "company.update.own",

      // User Management (ownCompany)
      "user.create.ownCompany",
      "user.list.ownCompany",
      "user.update.ownCompany",
      "user.activate.ownCompany",
      "user.deactivate.ownCompany",

      // Contractor Visibility (ownCompany)
      "contractor.list.ownCompany",
      "contractor.view.ownCompany",
      "contractor.view_onboarding.ownCompany",
      "contractor.view_dates.ownCompany",
      "contractor.view_payments.ownCompany",

      // Invoice Visibility (ownCompany)
      "invoice.view.ownCompany",

      // Contract Management (own)
      "contract.create.own",
      "contract.update.own",
      "contract.read.own",
      "contract.sign.own",

      // Document Management
      "document.upload.own",
      "document.upload_selfbill.own",
      "document.upload_proof_of_payment.own",
      "document.upload_kyc.ownCompany",
      "document.view.ownCompany",
      "document.download.ownCompany",

      // Onboarding Visibility
      "onboarding.view.ownCompany",

      // Lead Management (own)
      "lead.create.own",
      "lead.update.own",
      "lead.read.own",

      // Remittance Visibility
      "remittance.view.ownCompany",
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. PAYROLL_PARTNER_ADMIN - Payroll partner administrator
  // ---------------------------------------------------------------------------
  {
    name: "PAYROLL_PARTNER_ADMIN",
    displayName: "Payroll Partner Administrator",
    description: "Payroll partner administrator. Can manage workers, upload payslips and invoices to the platform.",
    level: 50,
    homePath: "/dashboard",
    color: "#7c3aed", // violet-600
    icon: "calculator",
    permissionKeys: [
      // Company Management (own)
      "company.read.own",
      "company.update.own",

      // User Management (ownCompany)
      "user.create.ownCompany",
      "user.list.ownCompany",
      "user.update.ownCompany",

      // Worker Visibility (ownCompany)
      "worker.list.ownCompany",
      "worker.view.ownCompany",
      "worker.view_onboarding.ownCompany",
      "worker.view_dates.ownCompany",
      "worker.view_contract.ownCompany",

      // Payslip Management (ownCompany)
      "payslip.upload.ownCompany",
      "payslip.view.ownCompany",

      // Invoice Upload to Platform
      "invoice.upload_to_platform.ownCompany",

      // Document Management
      "document.upload.ownCompany",
      "document.view.ownCompany",
      "document.download.ownCompany",

      // Onboarding Visibility
      "onboarding.view.ownCompany",
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. FINANCE_MANAGER - Finance team manager
  // ---------------------------------------------------------------------------
  {
    name: "FINANCE_MANAGER",
    displayName: "Finance Manager",
    description: "Finance manager. Can approve and execute payments, generate remittances, and view financial reports.",
    level: 60,
    homePath: "/dashboard",
    color: "#059669", // emerald-600
    icon: "coins",
    permissionKeys: [
      // Payment Management
      "payment.create.global",
      "payment.list.global",
      "payment.approve.global",
      "payment.execute.global",
      "payment.cancel.global",

      // Remittance Management
      "remittance.create.global",
      "remittance.list.global",
      "remittance.generate.global",
      "remittance.send.global",

      // Invoice Management
      "invoice.list.global",
      "invoice.approve.global",
      "invoice.release.global",
      "invoice.send.global",

      // Payslip Management
      "payslip.list.global",
      "payslip.generate.global",

      // Reporting
      "report.view_margin.global",
      "report.view_income.global",
      "report.view_live_contractors.global",
      "report.view_by_country.global",
      "report.view_by_client.global",
      "report.export.global",

      // Contractor/Worker Visibility (for financial reconciliation)
      "contractor.list.global",
      "contractor.view.global",
      "worker.list.global",
      "worker.view.global",

      // Timesheet Visibility (for payment verification)
      "timesheet.list.global",
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. SALES_MANAGER - Sales team manager
  // ---------------------------------------------------------------------------
  {
    name: "SALES_MANAGER",
    displayName: "Sales Manager",
    description: "Sales manager. Can manage all leads, assign them to sales reps, and view pipeline analytics.",
    level: 55,
    homePath: "/dashboard",
    color: "#ea580c", // orange-600
    icon: "chart-line",
    permissionKeys: [
      // Lead Management
      "lead.list.global",
      "lead.create.global",
      "lead.update.global",
      "lead.assign.global",
      "lead.export.global",

      // Company Visibility (for sales context)
      "company.list.global",

      // Contractor Visibility (for sales context)
      "contractor.list.global",

      // User Management (to assign sales reps)
      "user.list.global",
      "user.create.global",
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. SALES_REP - Sales representative
  // ---------------------------------------------------------------------------
  {
    name: "SALES_REP",
    displayName: "Sales Representative",
    description: "Sales representative. Can create and manage their own leads.",
    level: 40,
    homePath: "/dashboard",
    color: "#f59e0b", // amber-500
    icon: "user-tie",
    permissionKeys: [
      // Lead Management (own + global list to avoid duplicates)
      "lead.list.global", // Can see all to avoid duplicates
      "lead.create.own",
      "lead.update.own",
      "lead.read.own",
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. CONTRACTOR - Independent contractor
  // ---------------------------------------------------------------------------
  {
    name: "CONTRACTOR",
    displayName: "Contractor",
    description: "Independent contractor. Can manage timesheets, view contracts, invoices, and payments.",
    level: 20,
    homePath: "/dashboard",
    color: "#8b5cf6", // violet-500
    icon: "user",
    permissionKeys: [
      // User Management (own)
      "user.read.own",
      "user.update.own",

      // Timesheet Management (own)
      "timesheet.read.own",
      "timesheet.create.own",
      "timesheet.update.own",
      "timesheet.submit.own",

      // Contract Visibility (own)
      "contract.read.own",
      "contract.sign.own",

      // Invoice Visibility (own)
      "invoice.read.own",

      // Payment & Remittance Visibility (own)
      "payment.view.own",
      "remittance.read.own",

      // Payslip Visibility (own)
      "payslip.read.own",

      // Document Visibility (own)
      "document.view.own",
      "document.download.own",

      // Onboarding (own)
      "onboarding.read.own",
      "onboarding.update.own",
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. WORKER - Employed worker via payroll partner
  // ---------------------------------------------------------------------------
  {
    name: "WORKER",
    displayName: "Worker",
    description: "Employed worker via payroll partner. Can view their employment contract, payslips, and remittances.",
    level: 20,
    homePath: "/dashboard",
    color: "#06b6d4", // cyan-500
    icon: "user-check",
    permissionKeys: [
      // User Management (own)
      "user.read.own",
      "user.update.own",

      // Contract Visibility (own)
      "contract.read.own",

      // Payslip Visibility (own)
      "payslip.read.own",

      // Remittance Visibility (own)
      "remittance.read.own",

      // Document Visibility (own)
      "document.view.own",
      "document.download.own",

      // Onboarding (own)
      "onboarding.read.own",
    ],
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get or create the default tenant
 */
async function getOrCreateDefaultTenant() {
  let tenant = await prisma.tenant.findFirst({
    where: { slug: "aspirock" },
  })

  if (!tenant) {
    console.log("📦 Creating default tenant: Aspirock")
    tenant = await prisma.tenant.create({
      data: {
        name: "Aspirock",
        slug: "aspirock",
        domain: "aspirock.com",
        isActive: true,
      },
    })
    console.log(`✅ Default tenant created: ${tenant.name} (${tenant.id})`)
  } else {
    console.log(`✅ Default tenant found: ${tenant.name} (${tenant.id})`)
  }

  return tenant
}

/**
 * Get or create a role
 */
async function getOrCreateRole(
  tenantId: string,
  roleDefinition: RoleDefinition
) {
  let role = await prisma.role.findFirst({
    where: {
      tenantId,
      name: roleDefinition.name,
    },
  })

  if (!role) {
    console.log(`🎭 Creating role: ${roleDefinition.displayName}`)
    role = await prisma.role.create({
      data: {
        tenantId,
        name: roleDefinition.name,
        displayName: roleDefinition.displayName,
        description: roleDefinition.description,
        level: roleDefinition.level,
        homePath: roleDefinition.homePath,
        color: roleDefinition.color,
        icon: roleDefinition.icon,
        isActive: true,
        isSystem: true,
      },
    })
    console.log(`  ✅ Role created: ${role.displayName} (${role.id})`)
  } else {
    console.log(`  ✅ Role found: ${role.displayName} (${role.id})`)
  }

  return role
}

/**
 * Fetch all permissions from database
 */
async function fetchAllPermissions() {
  const permissions = await prisma.permission.findMany({
    where: { isActive: true },
  })

  console.log(`\n📋 Fetched ${permissions.length} permissions from database`)

  // Create a map for quick lookup
  const permissionMap = new Map<string, string>()
  permissions.forEach((p) => {
    permissionMap.set(p.key, p.id)
  })

  return { permissions, permissionMap }
}

/**
 * Assign permissions to a role
 */
async function assignPermissionsToRole(
  roleId: string,
  roleName: string,
  permissionKeys: string[],
  permissionMap: Map<string, string>
) {
  console.log(`\n🔐 Assigning permissions to ${roleName}...`)

  let assigned = 0
  let skipped = 0
  let notFound = 0

  for (const permissionKey of permissionKeys) {
    const permissionId = permissionMap.get(permissionKey)

    if (!permissionId) {
      console.log(`  ⚠️  Permission not found: ${permissionKey}`)
      notFound++
      continue
    }

    // Check if already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    })

    if (existing) {
      skipped++
      continue
    }

    // Assign permission
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    })

    assigned++
  }

  console.log(
    `  ✅ Assigned: ${assigned} | Skipped (already exists): ${skipped} | Not found: ${notFound}`
  )

  return { assigned, skipped, notFound }
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function main() {
  console.log("=".repeat(80))
  console.log("🌱 PAYROLL SAAS - RBAC SEED")
  console.log("=".repeat(80))
  console.log()

  try {
    // 1. Get or create default tenant
    const tenant = await getOrCreateDefaultTenant()
    const tenantId = tenant.id

    // 2. Fetch all permissions
    const { permissions, permissionMap } = await fetchAllPermissions()

    if (permissions.length === 0) {
      console.log()
      console.log("❌ ERROR: No permissions found in database!")
      console.log("   Please run the permission seed SQL first:")
      console.log(
        "   psql -d your_database -f prisma/migrations/20251126093642_extended_rbac_permissions/seed-permissions.sql"
      )
      process.exit(1)
    }

    // 3. Process each role definition
    const results: {
      role: string
      assigned: number
      skipped: number
      notFound: number
    }[] = []

    for (const roleDefinition of ROLE_DEFINITIONS) {
      const role = await getOrCreateRole(tenantId, roleDefinition)

      const result = await assignPermissionsToRole(
        role.id,
        role.displayName,
        roleDefinition.permissionKeys,
        permissionMap
      )

      results.push({
        role: role.displayName,
        assigned: result.assigned,
        skipped: result.skipped,
        notFound: result.notFound,
      })
    }

    // 4. Print summary
    console.log()
    console.log("=".repeat(80))
    console.log("📊 SUMMARY")
    console.log("=".repeat(80))
    console.log()
    console.log(`Total Roles Processed: ${ROLE_DEFINITIONS.length}`)
    console.log(`Total Permissions in DB: ${permissions.length}`)
    console.log()
    console.log("Permissions Assigned by Role:")
    console.log()

    results.forEach((r) => {
      console.log(`  ${r.role}:`)
      console.log(`    ✅ Assigned: ${r.assigned}`)
      console.log(`    ⏭️  Skipped: ${r.skipped}`)
      if (r.notFound > 0) {
        console.log(`    ⚠️  Not Found: ${r.notFound}`)
      }
      console.log()
    })

    console.log("=".repeat(80))
    console.log("✅ SEED COMPLETED SUCCESSFULLY")
    console.log("=".repeat(80))
  } catch (error) {
    console.error()
    console.error("❌ ERROR during seed:")
    console.error(error)
    process.exit(1)
  }
}

// =============================================================================
// RUN SEED
// =============================================================================

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
