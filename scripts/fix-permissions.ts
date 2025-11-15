// scripts/fix-permissions.ts
// Script to fix permission issues for tenant admin users

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function fixPermissions() {
  console.log("🔧 FIXING PERMISSION ISSUES\n")
  console.log("=".repeat(60))

  try {
    // 1. Get all permissions
    const allPermissions = await prisma.permission.findMany()
    console.log(`\n✅ Found ${allPermissions.length} permissions in database`)

    // 2. Get all tenants
    const tenants = await prisma.tenant.findMany()
    console.log(`✅ Found ${tenants.length} tenant(s)`)

    for (const tenant of tenants) {
      console.log(`\n📌 Processing Tenant: ${tenant.name} (${tenant.id})`)

      // 3. Get or create admin role for this tenant
      let adminRole = await prisma.role.findUnique({
        where: {
          tenantId_name: {
            tenantId: tenant.id,
            name: "admin",
          },
        },
        include: {
          rolePermissions: true,
        },
      })

      if (!adminRole) {
        console.log("   ⚠️  Admin role not found, creating...")
        adminRole = await prisma.role.create({
          data: {
            tenantId: tenant.id,
            name: "admin",
            homePath: "/admin",
          },
          include: {
            rolePermissions: true,
          },
        })
      }

      console.log(`   ✓ Admin Role ID: ${adminRole.id}`)
      console.log(`   ✓ Current Permissions: ${adminRole.rolePermissions.length}`)

      // 4. Assign ALL permissions to admin role
      let assigned = 0
      let skipped = 0

      for (const permission of allPermissions) {
        // Check if already assigned
        const existing = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          },
        })

        if (!existing) {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          })
          assigned++
        } else {
          skipped++
        }
      }

      console.log(`   ✓ Assigned ${assigned} new permissions`)
      console.log(`   ✓ Skipped ${skipped} existing permissions`)

      // 5. Verify critical permissions for Settings menu
      const criticalPermissions = [
        'tenant.users.view',
        'settings.view',
        'tenant.roles.view',
        'onboarding.templates.view',
        'companies.view',
        'banks.view',
        'tenant.branding.update',
      ]

      const rolePermsAfter = await prisma.rolePermission.findMany({
        where: { roleId: adminRole.id },
        include: { permission: true },
      })

      const hasAllCritical = criticalPermissions.every(perm =>
        rolePermsAfter.some(rp => rp.permission.key === perm)
      )

      console.log(`\n   📋 Critical Settings Permissions Check:`)
      criticalPermissions.forEach(perm => {
        const has = rolePermsAfter.some(rp => rp.permission.key === perm)
        console.log(`      ${has ? '✅' : '❌'} ${perm}`)
      })

      if (hasAllCritical) {
        console.log(`\n   ✅ All critical permissions assigned!`)
      } else {
        console.log(`\n   ❌ Some critical permissions missing!`)
      }

      // 6. Check admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          tenantId: tenant.id,
          roleId: adminRole.id,
        },
      })

      console.log(`\n   👤 Admin Users: ${adminUsers.length}`)
      adminUsers.forEach(user => {
        console.log(`      - ${user.email} (${user.name})`)
      })
    }

    console.log("\n" + "=".repeat(60))
    console.log("✅ PERMISSION FIX COMPLETE!")
    console.log("\n💡 Next Steps:")
    console.log("   1. Logout from the application")
    console.log("   2. Login again as admin@demo.com")
    console.log("   3. Check if Settings menu items are now visible")
    console.log("   4. If still not visible, check browser console for errors")

  } catch (error) {
    console.error("❌ Error fixing permissions:", error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPermissions()
