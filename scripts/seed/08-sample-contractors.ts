// /seed/08-sample-contractors.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

export const prisma = new PrismaClient()

export async function seedSampleContractors(tenantId: string, agencies: any[]) {
  console.log("👉 Seeding contractors...")

  const contractorRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId, name: "contractor" } },
  })

  if (!contractorRole) throw new Error("❌ Contractor role missing.")

  const CONTRACTORS = [
    { name: "John Developer", email: "john.dev@demo.com" },
    { name: "Emily QA", email: "emily.qa@demo.com" },
    { name: "Carlos Designer", email: "carlos.design@demo.com" },
  ]

  const createdProfiles = []

  for (const c of CONTRACTORS) {
    const pwd = await bcrypt.hash("password123", 10)

    // Create linked user
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: c.name,
        email: c.email,
        passwordHash: pwd,
        roleId: contractorRole.id,
        mustChangePassword: false,
      },
    })

    // Create contractor profile
    const profile = await prisma.contractor.create({
      data: {
        tenantId,
        userId: user.id,
        agencyId: agencies[0].id, // attach to the first agency
        status: "active",
      },
    })

    createdProfiles.push(profile)
  }

  console.log(`✅ Contractors created: ${createdProfiles.length}`)
  return createdProfiles
}
