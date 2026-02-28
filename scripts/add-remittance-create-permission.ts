/**
 * Script to add remittance.create.global permission
 * Run with: npx tsx scripts/add-remittance-create-permission.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Adding remittance.create.global permission...")

  // Check if permission exists
  let permission = await prisma.permission.findFirst({
    where: { key: "remittance.create.global" },
  })

  if (!permission) {
    // Create the permission
    permission = await prisma.permission.create({
      data: {
        key: "remittance.create.global",
        resource: "remittance",
        action: "create",
        scope: "global",
        displayName: "Create a transfer for any user",
        description: "Create remittance payments for contractors",
        category: "Financial",
      },
    })
    console.log("Created permission: remittance.create.global")
  } else {
    console.log("Permission already exists: remittance.create.global")
  }

  // Find ADMIN and SUPER_ADMIN roles
  const adminRoles = await prisma.role.findMany({
    where: { name: { in: ["ADMIN", "SUPER_ADMIN"] } },
  })

  for (const role of adminRoles) {
    // Check if already linked
    const existing = await prisma.rolePermission.findFirst({
      where: { roleId: role.id, permissionId: permission.id },
    })

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      })
      console.log(`Added permission to ${role.name} role`)
    } else {
      console.log(`Permission already linked to ${role.name} role`)
    }
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
