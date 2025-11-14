// /seed/14-sample-leads.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSampleLeads(tenantId: string) {
  console.log("👉 Seeding leads...")

  const LEADS = [
    {
      tenantId,
      name: "Acme Corporation",
      email: "sales@acmecorp.com",
      phone: "+1-555-908-1122",
      status: "warm",
      source: "LinkedIn",
      value: "5000",
    },
    {
      tenantId,
      name: "NextGen Robotics",
      email: "hello@nextgen.ai",
      phone: "+1-555-885-4422",
      status: "cold",
      source: "Website",
      value: "12000",
    },
    {
      tenantId,
      name: "Omega Industries",
      email: "info@omega.com",
      phone: "+44-20-9955-2211",
      status: "hot",
      source: "Referral",
      value: "25000",
    },
  ]

  for (const lead of LEADS) {
    await prisma.lead.create({ data: lead })
  }

  console.log("✅ Leads created.")
}
