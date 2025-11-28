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
import { ALL_PERMISSIONS } from "../server/rbac/permissions"; // adapte le path
import bcrypt from "bcryptjs";


const prisma = new PrismaClient()


async function insertPermissions() {
  console.log("📥 Inserting permissions...")

  const permissionData = ALL_PERMISSIONS.map((p) => ({
    key: p.key,
    resource: p.resource,
    action: p.action,
    scope: p.scope,
    displayName: p.displayName,
    description: p.description || null,
    category: p.category || null,
    isActive: true,
  }))

  await prisma.permission.createMany({
    data: permissionData,
    skipDuplicates: true,
  })

  const count = await prisma.permission.count()
  console.log(`✅ Permissions synced: ${count} total`)
}


async function createInitialUsers(tenantId: string) {
  console.log("👤 Creating initial demo users...")

  const usersToCreate = [
    {
      email: "superadmin@platform.com",
      passwordHash: await bcrypt.hash("SuperAdmin123!", 12),
      name: "Super Admin",
      roleName: "SUPERADMIN",
    },
    {
      email: "admin@demo.com",
      passwordHash: await bcrypt.hash("password123", 12),
      name: "Demo Admin",
      roleName: "ADMIN",
    },
    {
      email: "agency@demo.com",
      passwordHash: await bcrypt.hash("password123", 12),
      name: "Demo Agency",
      roleName: "AGENCY",
    },
    {
      email: "payroll@demo.com",
      passwordHash: await bcrypt.hash("password123", 12),
      name: "Demo Payroll",
      roleName: "PAYROLL",
    },
    {
      email: "contractor@demo.com",
      passwordHash: await bcrypt.hash("password123", 12),
      name: "Demo Contractor",
      roleName: "CONTRACTOR",
    },
  ];


  for (const u of usersToCreate) {

    // 1. Fetch roleId
    const role = await prisma.role.findFirst({
      where: {
        tenantId,
        name: u.roleName,
      },
    })

    if (!role) {
      console.log(`❌ Role not found: ${u.roleName}`)
      continue
    }

    // 2. Create or update user
    const user = await prisma.user.upsert({
      where: {
        tenantId_email: { tenantId, email: u.email },
      },
      update: {},
      create: {
        tenantId,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        roleId: role.id, // 🔥 required
        isActive: true,
      },
    })

    console.log(`   ✅ User created: ${user.email}`)
    console.log(`     🎭 Role assigned via roleId: ${u.roleName}`)
  }

  console.log("👥 Initial users created successfully.")
}


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
  // -------------------------------------------------
  // SUPERADMIN — Toutes les permissions automatiques
  // -------------------------------------------------
  {
    name: "SUPERADMIN",
    displayName: "Super Administrator",
    description: "Full unrestricted access to the entire platform and all tenants.",
    level: 100,
    homePath: "/dashboard",
    color: "#dc2626",
    icon: "shield-check",
    permissionKeys: ALL_PERMISSIONS.map(p => p.key), // 🔥 FULL ACCESS
  },

  // -------------------------------------------------
  // ADMIN — Toutes les permissions (pour le moment)
  // -------------------------------------------------
  {
    name: "ADMIN",
    displayName: "Administrator",
    description: "Platform administrator with full permissions.",
    level: 90,
    homePath: "/dashboard",
    color: "#2563eb",
    icon: "shield",
    permissionKeys: ALL_PERMISSIONS.map(p => p.key), // 🔥 FULL ACCESS
  },

  // -------------------------------------------------
  // AGENCY — Aucune permission au départ
  // -------------------------------------------------
  {
    name: "AGENCY",
    displayName: "Agency",
    description: "Agency user (permissions to be assigned later).",
    level: 40,
    homePath: "/dashboard",
    color: "#7c3aed",
    icon: "building",
    permissionKeys: [
      /*EXEMPLE*/"user.create.global",
    ],
  },

  // -------------------------------------------------
  // PAYROLL — Aucune permission au départ
  // -------------------------------------------------
  {
    name: "PAYROLL",
    displayName: "Payroll Partner",
    description: "Payroll partner user (permissions to be assigned later).",
    level: 40,
    homePath: "/dashboard",
    color: "#059669",
    icon: "calculator",
    permissionKeys: [],
  },

  // -------------------------------------------------
  // CONTRACTOR — Aucune permission au départ
  // -------------------------------------------------
  {
    name: "CONTRACTOR",
    displayName: "Contractor",
    description: "Independent contractor (permissions to be assigned later).",
    level: 20,
    homePath: "/dashboard",
    color: "#8b5cf6",
    icon: "user",
    permissionKeys: [],
  },
];


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
    // 0. Insert permissions FIRST (global, not per tenant)
    await insertPermissions()

    // 1. Create tenant
    const tenant = await getOrCreateDefaultTenant()
    const tenantId = tenant.id

    

    // 2. Fetch all permissions
    const { permissions, permissionMap } = await fetchAllPermissions()

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
    await createInitialUsers(tenantId)

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
