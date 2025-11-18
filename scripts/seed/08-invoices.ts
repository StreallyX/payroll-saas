
// =============================================================
// SEED: INVOICES
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedInvoices(tenantId: string) {
  console.log("🧾 Seeding invoices...");

  const financeManager = await prisma.user.findFirst({
    where: {
      tenantId,
      userRoles: {
        some: {
          role: {
            name: "finance_manager",
          },
        },
      },
    },
  });

  const contracts = await prisma.contract.findMany({
    where: {
      tenantId,
      status: "active",
    },
    take: 3,
  });

  if (!financeManager || contracts.length === 0) {
    console.log("   ⚠️  Missing required data, skipping invoices");
    return [];
  }

  const invoices = [];

  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i];
    const issueDate = new Date();
    issueDate.setMonth(issueDate.getMonth() - i);

    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const subtotal = 5000 + i * 1000;
    const taxRate = 10;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        contractId: contract.id,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(5, "0")}`,
        createdById: financeManager.id,
        status: i === 0 ? "paid" : i === 1 ? "sent" : "draft",
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        currency: "USD",
        issueDate,
        dueDate,
        paidDate: i === 0 ? new Date() : null,
        sentDate: i <= 1 ? issueDate : null,
        description: `Monthly service invoice for ${contract.title}`,
      },
    });

    // Add line items
    await prisma.invoiceLineItem.create({
      data: {
        invoiceId: invoice.id,
        description: "Professional Services - Monthly Fee",
        quantity: 1,
        unitPrice: subtotal,
        amount: subtotal,
        taxRate,
      },
    });

    invoices.push(invoice);
    console.log(`   ✓ ${invoice.invoiceNumber} - $${totalAmount.toFixed(2)}`);
  }

  console.log(`✅ Invoices seeded: ${invoices.length}`);
  return invoices;
}

// Run if executed directly
if (require.main === module) {
  seedInvoices(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding invoices:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
