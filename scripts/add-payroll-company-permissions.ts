/**
 * Script to add company permissions to PAYROLL role
 * Run with: npx tsx scripts/add-payroll-company-permissions.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PERMISSIONS_TO_ADD = [
  "company.access.page",
  "company.list.own",
  "company.read.own",
  "company.update.own",
]

async function main() {
  console.log("Adding company permissions to PAYROLL role...")

  // Find the PAYROLL role
  const payrollRole = await prisma.role.findFirst({
    where: { name: "PAYROLL" },
    include: {
      rolePermissions: {
        include: { permission: true }
      }
    },
  })

  if (!payrollRole) {
    console.error("PAYROLL role not found!")
    return
  }

  console.log(`Found PAYROLL role: ${payrollRole.id}`)

  // Get existing permission keys
  const existingKeys = payrollRole.rolePermissions.map((rp) => rp.permission.key)
  console.log(`Existing permissions: ${existingKeys.length}`)

  // Find permissions to add
  for (const key of PERMISSIONS_TO_ADD) {
    if (existingKeys.includes(key)) {
      console.log(`  - ${key} already exists, skipping`)
      continue
    }

    // Find or create the permission
    let permission = await prisma.permission.findFirst({
      where: { key },
    })

    if (!permission) {
      // Parse the key to get resource, action, scope
      const parts = key.split(".")
      const resource = parts[0] || "unknown"
      const action = parts[1] || "unknown"
      const scope = parts[2] || "global"

      // Create the permission
      permission = await prisma.permission.create({
        data: {
          key,
          resource,
          action,
          scope,
          displayName: key,
          description: `Permission: ${key}`,
        },
      })
      console.log(`  - Created permission: ${key}`)
    }

    // Link permission to role
    await prisma.rolePermission.create({
      data: {
        roleId: payrollRole.id,
        permissionId: permission.id,
      },
    })
    console.log(`  - Added ${key} to PAYROLL role`)
  }

  console.log("Done!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
