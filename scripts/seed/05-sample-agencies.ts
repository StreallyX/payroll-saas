// /seed/05-sample-agencies.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSampleAgencies(tenantId: string) {
  console.log("👉 Seeding sample agencies...")

  const AGENCIES = [
    {
      name: "Tech Solutions Agency",
      contactEmail: "contact@techsolutions.com",
      contactPhone: "+1-202-100-2000",
      city: "Dubai",
    },
    {
      name: "Global Talent Group",
      contactEmail: "info@globaltalentgroup.com",
      contactPhone: "+41-22-555-9876",
      city: "Geneva",
    },
    {
      name: "Swiss Recruiters Hub",
      contactEmail: "hello@srh.ch",
      contactPhone: "+41-44-551-2200",
      city: "Zürich",
    },
  ]

  const created = []

  for (const agency of AGENCIES) {
    // 🟦 Cherche si existe déjà
    let existing = await prisma.agency.findFirst({
      where: {
        tenantId,
        name: agency.name,
      },
    })

    // 🟩 Sinon crée
    if (!existing) {
      existing = await prisma.agency.create({
        data: {
          tenantId,
          ...agency,
        },
      })
    }

    created.push(existing)
  }

  console.log(`✅ Agencies created: ${created.length}`)

  // -------------------------------------------------------------
  // Attach agency user
  // -------------------------------------------------------------
  const agencyUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: "agency@demo.com",
      },
    },
  })

  if (agencyUser) {
    await prisma.user.update({
      where: { id: agencyUser.id },
      data: { agencyId: created[0].id },
    })
    console.log(`🏢 Agency user linked: ${created[0].name}`)
  } else {
    console.log("⚠️ agency@demo.com not found")
  }

  return created
}
