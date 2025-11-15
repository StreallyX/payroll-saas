// /seed/07-sample-payroll.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSamplePayrollPartners(tenantId: string) {
  console.log("👉 Seeding payroll partners...")

  const PARTNERS = [
    {
      name: "PayPro Services",
      contactEmail: "paypro@partners.com",
      contactPhone: "+1-555-112-8899",
      address: "Financial District, Dubai",
    },
    {
      name: "GlobalPay Network",
      contactEmail: "support@globalpay.com",
      contactPhone: "+44-20-8855-1122",
      address: "London Center, UK",
    },
    {
      name: "SwissPayroll Sàrl",
      contactEmail: "admin@swisspayroll.ch",
      contactPhone: "+41-22-884-5522",
      address: "Geneva, Switzerland",
    },
  ]

  const created: any[] = []

  for (const partner of PARTNERS) {
    // 🟦 existe déjà ?
    let existing = await prisma.payrollPartner.findFirst({
      where: {
        tenantId,
        name: partner.name,
      },
    })

    // 🟩 sinon créer
    if (!existing) {
      existing = await prisma.payrollPartner.create({
        data: {
          tenantId,
          ...partner,
        },
      })
    }

    created.push(existing)
  }

  console.log(`✅ Payroll partners created: ${created.length}`)

  // -------------------------------------------------------------
  // Link payroll manager → first payroll partner
  // -------------------------------------------------------------
  const payrollUser = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: "payroll@demo.com",
      },
    },
  })

  if (payrollUser) {
    await prisma.user.update({
      where: { id: payrollUser.id },
      data: { payrollPartnerId: created[0].id },
    })
    console.log(`🏢 Payroll user linked to: ${created[0].name}`)
  } else {
    console.log("⚠️ payroll@demo.com not found → cannot link payroll partner")
  }

  return created
}
