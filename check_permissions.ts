import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkPermissions() {
  console.log("=".repeat(60))
  console.log("CHECKING PERMISSION SETUP")
  console.log("=".repeat(60))

  // 1. Check total permissions
  const totalPermissions = await prisma.permission.count()
  console.log(`\n✅ Total Permissions in DB: ${totalPermissions}`)

  // 2. Check roles
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: {
          permission: true
        }
      }
    }
  })

  console.log(`\n✅ Total Roles: ${roles.length}`)

  for (const role of roles) {
    console.log(`\n📌 Role: ${role.name}`)
    console.log(`   Tenant ID: ${role.tenantId}`)
    console.log(`   Permissions Count: ${role.rolePermissions.length}`)
    
    // Show first 10 permissions
    const perms = role.rolePermissions.map(rp => rp.permission.key).slice(0, 10)
    console.log(`   Sample Permissions:`)
    perms.forEach(p => console.log(`     - ${p}`))
    
    // Check for specific settings permissions
    const settingsPerms = role.rolePermissions
      .map(rp => rp.permission.key)
      .filter(key => 
        key.includes('settings') || 
        key.includes('tenant.users') || 
        key.includes('tenant.roles') ||
        key.includes('tenant.branding')
      )
    
    if (settingsPerms.length > 0) {
      console.log(`   Settings-related Permissions:`)
      settingsPerms.forEach(p => console.log(`     ✓ ${p}`))
    }
  }

  // 3. Check admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@demo.com' },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  })

  if (adminUser) {
    console.log(`\n📌 Admin User Check:`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Role: ${adminUser.role.name}`)
    console.log(`   Total Permissions: ${adminUser.role.rolePermissions.length}`)
    
    const userPerms = adminUser.role.rolePermissions.map(rp => rp.permission.key)
    
    // Check specific permissions needed for Settings menu
    const requiredPerms = [
      'tenant.users.view',
      'settings.view',
      'tenant.roles.view',
      'onboarding.templates.view',
      'companies.view',
      'banks.view',
      'tenant.branding.update'
    ]
    
    console.log(`\n   Checking Required Settings Permissions:`)
    requiredPerms.forEach(perm => {
      const has = userPerms.includes(perm)
      console.log(`     ${has ? '✅' : '❌'} ${perm}`)
    })
  }

  await prisma.$disconnect()
}

checkPermissions().catch(console.error)
