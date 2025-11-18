
/**
 * Seed Invoices
 * Creates sample invoices
 */
import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedInvoices(
  tenantId: string,
  contracts: any[],
  users: any[]
) {
  console.log("👉 Seeding invoices...");

  const financeUser = users.find((u) => u.email === "finance@demo.com");
  const contract1 = contracts.find((c) => c.contractNumber === "CNTR-2024-001");
  const contract2 = contracts.find((c) => c.contractNumber === "CNTR-2024-002");
  const contract3 = contracts.find((c) => c.contractNumber === "CNTR-2024-003");

  // Helper to create invoice with line items
  async function createInvoice(data: any, lineItems: any[]) {
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        ...data,
      },
    });

    for (const item of lineItems) {
      await prisma.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          ...item,
        },
      });
    }

    return invoice;
  }

  // Invoice 1 - Paid
  await createInvoice(
    {
      contractId: contract1?.id,
      invoiceNumber: "INV-2024-001",
      amount: new Prisma.Decimal("3400.00"),
      taxAmount: new Prisma.Decimal("272.00"),
      totalAmount: new Prisma.Decimal("3672.00"),
      currency: "USD",
      status: "paid",
      issueDate: new Date("2024-10-01"),
      dueDate: new Date("2024-10-16"),
      paidAt: new Date("2024-10-14"),
      sentAt: new Date("2024-10-01"),
      description: "Software development services for October 2024",
      createdById: financeUser?.id,
    },
    [
      {
        description: "Full Stack Development - Week 1",
        quantity: new Prisma.Decimal("40.00"),
        unitPrice: new Prisma.Decimal("85.00"),
        amount: new Prisma.Decimal("3400.00"),
        taxRate: new Prisma.Decimal("8.00"),
      },
    ]
  );

  // Invoice 2 - Sent (Pending Payment)
  await createInvoice(
    {
      contractId: contract1?.id,
      invoiceNumber: "INV-2024-002",
      amount: new Prisma.Decimal("3400.00"),
      taxAmount: new Prisma.Decimal("272.00"),
      totalAmount: new Prisma.Decimal("3672.00"),
      currency: "USD",
      status: "sent",
      issueDate: new Date("2024-11-01"),
      dueDate: new Date("2024-11-16"),
      sentAt: new Date("2024-11-01"),
      description: "Software development services for November 2024",
      createdById: financeUser?.id,
    },
    [
      {
        description: "Full Stack Development - Week 1-2",
        quantity: new Prisma.Decimal("40.00"),
        unitPrice: new Prisma.Decimal("85.00"),
        amount: new Prisma.Decimal("3400.00"),
        taxRate: new Prisma.Decimal("8.00"),
      },
    ]
  );

  // Invoice 3 - Draft
  await createInvoice(
    {
      contractId: contract2?.id,
      invoiceNumber: "INV-2024-003",
      amount: new Prisma.Decimal("2100.00"),
      taxAmount: new Prisma.Decimal("420.00"),
      totalAmount: new Prisma.Decimal("2520.00"),
      currency: "GBP",
      status: "draft",
      issueDate: new Date("2024-11-15"),
      dueDate: new Date("2024-12-15"),
      description: "UI/UX Design services",
      createdById: financeUser?.id,
    },
    [
      {
        description: "Product Redesign - Phase 1",
        quantity: new Prisma.Decimal("35.00"),
        unitPrice: new Prisma.Decimal("60.00"),
        amount: new Prisma.Decimal("2100.00"),
        taxRate: new Prisma.Decimal("20.00"),
      },
    ]
  );

  // Invoice 4 - Overdue
  await createInvoice(
    {
      contractId: contract3?.id,
      invoiceNumber: "INV-2024-004",
      amount: new Prisma.Decimal("3800.00"),
      taxAmount: new Prisma.Decimal("304.00"),
      totalAmount: new Prisma.Decimal("4104.00"),
      currency: "USD",
      status: "overdue",
      issueDate: new Date("2024-09-15"),
      dueDate: new Date("2024-09-30"),
      sentAt: new Date("2024-09-15"),
      description: "DevOps services for September 2024",
      createdById: financeUser?.id,
    },
    [
      {
        description: "Infrastructure Management - Week 1-2",
        quantity: new Prisma.Decimal("40.00"),
        unitPrice: new Prisma.Decimal("95.00"),
        amount: new Prisma.Decimal("3800.00"),
        taxRate: new Prisma.Decimal("8.00"),
      },
    ]
  );

  console.log("✅ Invoices created with line items");
}
