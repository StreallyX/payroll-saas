// /seed/04-users.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

export const prisma = new PrismaClient()

export async function seedUsers(tenantId: string) {
  console.log("👉 Seeding demo users...")

  // Retrieve roles by name
  const roles = await prisma.role.findMany({
    where: { tenantId },
  })

  function roleId(name: string) {
    const r = roles.find(r => r.name === name)
    if (!r) throw new Error(`❌ Role not found: ${name}`)
    return r.id
  }

  // Demo Users to Create
  const DEMO_USERS = [
    {
      name: "Admin User",
      email: "admin@demo.com",
      password: "password123",
      role: "admin",
    },
    {
      name: "Agency Manager",
      email: "agency@demo.com",
      password: "password123",
      role: "agency_owner",
    },
    {
      name: "Payroll Manager",
      email: "payroll@demo.com",
      password: "password123",
      role: "payroll_manager",
    },
    {
      name: "HR Manager",
      email: "hr@demo.com",
      password: "password123",
      role: "hr_manager",
    },
    {
      name: "Demo Contractor",
      email: "contractor@demo.com",
      password: "password123",
      role: "contractor",
    },
  ]

  for (const u of DEMO_USERS) {
    const hash = await bcrypt.hash(u.password, 10)

    await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: u.email,
        },
      },
      update: {},
      create: {
        tenantId,
        name: u.name,
        email: u.email,
        passwordHash: hash,
        isActive: true,
        mustChangePassword: false,
        roleId: roleId(u.role),
      },
    })
  }

  console.log("✅ Demo users created.")
}
