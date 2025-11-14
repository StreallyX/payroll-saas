import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

export const prisma = new PrismaClient()

export async function seedSampleData(tenantId: string) {
  console.log("👉 Seeding sample agencies, contractor-user and contract...")

  // 0️⃣ Get the contractor role (required)
  const contractorRole = await prisma.role.findUnique({
    where: {
      tenantId_name: {
        tenantId,
        name: "contractor",
      },
    },
  })

  if (!contractorRole) {
    throw new Error("❌ Contractor role not found. Did you seed roles first?")
  }

  // 1️⃣ Create an agency
  const agency = await prisma.agency.create({
    data: {
      name: "Tech Solutions Agency",
      contactEmail: "contact@tsa.com",
      tenantId,
    },
  })

  // 2️⃣ Create payroll partner (REQUIRED for contracts)
  const payrollPartner = await prisma.payrollPartner.create({
    data: {
      name: "Seeded Payroll Partner",
      contactEmail: "payroll@partner.com",
      tenantId,
    },
  })

  // 3️⃣ Create USER for contractor
  const passwordHash = await bcrypt.hash("contractor123", 10)

  const contractorUser = await prisma.user.create({
    data: {
      email: "contractor@demo.com",
      name: "Demo Contractor",
      passwordHash,
      tenantId,
      roleId: contractorRole.id,
    },
  })

  // 4️⃣ Create contractor PROFILE linked to user
  const contractorProfile = await prisma.contractor.create({
    data: {
      tenantId,
      userId: contractorUser.id,
      agencyId: agency.id,
      status: "active",
    },
  })

  // 5️⃣ Create a sample contract (FIXED)
  await prisma.contract.create({
    data: {
      tenantId,
      agencyId: agency.id,
      contractorId: contractorProfile.id,
      payrollPartnerId: payrollPartner.id,  // 👈 REQUIRED FIX
      title: "Frontend Developer Contract",
      status: "active",
    },
  })

  console.log("✅ Sample data inserted.")
}
