// /seed/11-sample-payslips.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSamplePayslips(tenantId: string, contracts: any[]) {
  console.log("👉 Seeding payslips...")

  const created = []

  for (const c of contracts) {
    const payslip = await prisma.payslip.create({
      data: {
        tenantId,
        contractorId: c.contractorId,
        contractId: c.id,
        month: 10,
        year: 2025,
        grossPay: 3500,
        netPay: 2800,
        deductions: 200,
        tax: 500,
        status: "paid",
      },
    })
    created.push(payslip)
  }

  console.log(`✅ Payslips created: ${created.length}`)
  return created
}
