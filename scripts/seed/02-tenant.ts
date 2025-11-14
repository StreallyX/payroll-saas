import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function seedTenant() {
  console.log("👉 Seeding tenant and users...")

  let tenant = await prisma.tenant.findFirst({
    where: { name: "Demo Company" },
  })

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Demo Company",
        primaryColor: "#3b82f6",
      },
    })
  }

  console.log("✅ Tenant ready:", tenant.id)

  // admin role
  const adminRole = await prisma.role.findFirst({
    where: { name: "admin", tenantId: tenant.id },
  })

  const users = [
    {
      name: "Demo Admin",
      email: "admin@demo.com",
      roleId: adminRole?.id!,
      password: "password123",
      tenantId: tenant.id,
    },
    {
      name: "HR Manager",
      email: "hr@demo.com",
      roleId: (await prisma.role.findFirst({ where: { name: "hr_manager", tenantId: tenant.id }}))!.id,
      password: "password123",
      tenantId: tenant.id,
    },
    {
      name: "Recruiter",
      email: "recruiter@demo.com",
      roleId: (await prisma.role.findFirst({ where: { name: "recruiter", tenantId: tenant.id }}))!.id,
      password: "password123",
      tenantId: tenant.id,
    },
  ]

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10)
    await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: user.tenantId,
          email: user.email,
        },
      },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        roleId: user.roleId,
        passwordHash: hash,
      },
    })
  }

  console.log("✅ Users created.")
  return tenant.id
}
