// /seed/10-sample-invoices.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export async function seedSampleInvoices(tenantId: string, contracts: any[]) {
  console.log("👉 Seeding invoices...")

  const created = []

  for (const c of contracts) {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        contractId: c.id,
        amount: 1500,
        status: "sent",
        invoiceRef: `INV-${c.id.slice(0, 5)}`,
        dueDate: new Date(),
      },
    })
    created.push(invoice)
  }

  console.log(`✅ Invoices created: ${created.length}`)
  return created
}
