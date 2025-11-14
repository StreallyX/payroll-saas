// /seed/02-superadmin.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

export const prisma = new PrismaClient()

export async function seedSuperAdmin() {
  console.log("👉 Seeding SuperAdmin account...")

  const email = "superadmin@platform.com"
  const password = "SuperAdmin123!"

  const existing = await prisma.superAdmin.findUnique({
    where: { email },
  })

  if (!existing) {
    const hash = await bcrypt.hash(password, 10)

    await prisma.superAdmin.create({
      data: {
        email,
        name: "Platform SuperAdmin",
        passwordHash: hash,
        isActive: true,
      },
    })

    console.log("✅ SuperAdmin created!")
  } else {
    console.log("ℹ️ SuperAdmin already exists, skipping.")
  }
}
