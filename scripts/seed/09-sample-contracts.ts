// /seed/09-sample-contracts.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSampleContracts(
  tenantId: string,
  agencies: any[],
  companies: any[],
  contractors: any[],
  payrollPartners: any[]
) {
  console.log("👉 Seeding sample contracts...")

  const created = []

  for (let i = 0; i < contractors.length; i++) {
    const contract = await prisma.contract.create({
      data: {
        tenantId,

        agencyId: agencies[0].id,               // always valid
        payrollPartnerId: payrollPartners[0].id, 
        companyId: companies[0].id,             // FIX HERE

        contractorId: contractors[i].id,

        title: `Sample Contract ${i + 1}`,
        status: "active",

        // optional fields
        rate: 50,
        rateType: "hourly",
        rateCycle: "monthly",
        margin: 10,
        marginType: "fixed",
        marginPaidBy: "client",
        invoiceDueDays: 30,
      },
    })

    created.push(contract)
  }

  console.log(`✅ Contracts created: ${created.length}`)
  return created
}
