
import { PrismaClient } from "@prisma/client";

export async function seedInvoices(prisma: PrismaClient, tenantId: string) {
  const contracts = await prisma.contract.findMany({
    where: { tenantId },
    take: 2,
  });

  for (const contract of contracts) {
    await prisma.invoice.create({
      data: {
        tenantId,
        contractId: contract.id,
        invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        status: "paid",
        amount: 3000.00,
        currency: "USD",
        taxAmount: 0,
        totalAmount: 3000.00,
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-01-15"),
        paidDate: new Date("2024-01-10"),
      },
    });
  }
}
