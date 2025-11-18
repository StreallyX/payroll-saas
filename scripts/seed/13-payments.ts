
/**
 * Seed Payments
 * Creates sample payment records
 */
import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedPayments(
  tenantId: string,
  contracts: any[],
  users: any[]
) {
  console.log("👉 Seeding payments...");

  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contractor2 = users.find((u) => u.email === "contractor2@demo.com");
  const contractor3 = users.find((u) => u.email === "contractor3@demo.com");

  const contract1 = contracts.find((c) => c.contractNumber === "CNTR-2024-001");
  const contract2 = contracts.find((c) => c.contractNumber === "CNTR-2024-002");
  const contract3 = contracts.find((c) => c.contractNumber === "CNTR-2024-003");

  // Get invoices
  const invoice1 = await prisma.invoice.findUnique({
    where: { invoiceNumber: "INV-2024-001" },
  });
  const invoice2 = await prisma.invoice.findUnique({
    where: { invoiceNumber: "INV-2024-002" },
  });

  const PAYMENTS = [
    {
      userId: contractor1?.id,
      contractId: contract1?.id,
      invoiceId: invoice1?.id,
      amount: new Prisma.Decimal("3672.00"),
      currency: "USD",
      paymentMethod: "bank_transfer",
      status: "completed",
      scheduledDate: new Date("2024-10-14"),
      processedAt: new Date("2024-10-14T09:00:00Z"),
      completedAt: new Date("2024-10-14T10:30:00Z"),
      referenceNumber: "PAY-20241014-001",
      description: "Payment for INV-2024-001",
    },
    {
      userId: contractor1?.id,
      contractId: contract1?.id,
      invoiceId: invoice2?.id,
      amount: new Prisma.Decimal("3672.00"),
      currency: "USD",
      paymentMethod: "bank_transfer",
      status: "processing",
      scheduledDate: new Date("2024-11-16"),
      processedAt: new Date("2024-11-16T09:00:00Z"),
      referenceNumber: "PAY-20241116-001",
      description: "Payment for INV-2024-002",
    },
    {
      userId: contractor2?.id,
      contractId: contract2?.id,
      amount: new Prisma.Decimal("2520.00"),
      currency: "GBP",
      paymentMethod: "paypal",
      status: "pending",
      scheduledDate: new Date("2024-12-15"),
      description: "Scheduled payment for design services",
    },
    {
      userId: contractor3?.id,
      contractId: contract3?.id,
      amount: new Prisma.Decimal("4104.00"),
      currency: "USD",
      paymentMethod: "bank_transfer",
      status: "failed",
      scheduledDate: new Date("2024-09-30"),
      processedAt: new Date("2024-09-30T09:00:00Z"),
      failedAt: new Date("2024-09-30T09:15:00Z"),
      failureReason: "Insufficient funds in account",
      description: "Failed payment for DevOps services",
    },
  ];

  for (const paymentData of PAYMENTS) {
    if (!paymentData.userId) continue;

    await prisma.payment.create({
      data: {
        tenantId,
        ...paymentData,
      },
    });
  }

  console.log(`✅ ${PAYMENTS.length} payments created`);
}
