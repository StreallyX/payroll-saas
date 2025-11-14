// /seed/06-sample-companies.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSampleCompanies(tenantId: string) {
  console.log("👉 Seeding sample companies...")

  const COMPANIES = [
    {
      name: "BlueWave Technologies",
      contactPerson: "Alex Turner",
      contactEmail: "contact@bluewave.com",
      contactPhone: "+1-555-210-8844",
      city: "Dubai",
      countryId: null,
      status: "active",
    },
    {
      name: "Apex Financial Services",
      contactPerson: "Sarah Johnson",
      contactEmail: "info@apexfs.com",
      contactPhone: "+44-20-5559-1122",
      city: "London",
      countryId: null,
      status: "active",
    },
    {
      name: "Horizon Logistics Group",
      contactPerson: "Miguel Alvarez",
      contactEmail: "support@horizonlg.com",
      contactPhone: "+34-91-884-4422",
      city: "Madrid",
      countryId: null,
      status: "active",
    },
  ]

  const created: any[] = []

  for (const company of COMPANIES) {
    // 🟦 Existe déjà ?
    let existing = await prisma.company.findFirst({
      where: {
        tenantId,
        name: company.name,
      },
    })

    // 🟩 Sinon je crée
    if (!existing) {
      existing = await prisma.company.create({
        data: {
          tenantId,
          ...company,
        },
      })
    }

    created.push(existing)
  }

  console.log(`✅ Companies created: ${created.length}`)

  // -------------------------------------------------------------
  // Attach the first company to hr@demo.com
  // -------------------------------------------------------------
  const hrUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: "hr@demo.com",
      },
    },
  })

  if (hrUser) {
    await prisma.user.update({
      where: { id: hrUser.id },
      data: { companyId: created[0].id },
    })
    console.log(`🏢 HR user linked to: ${created[0].name}`)
  } else {
    console.log("⚠️ hr@demo.com not found → cannot link company")
  }

  return created
}
