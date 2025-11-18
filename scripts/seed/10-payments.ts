
// =============================================================
// SEED: PAYMENTS
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPayments(tenantId: string) {
  console.log("💰 Seeding payments...");

  const contractors = await prisma.user.findMany({
    where: {
      tenantId,
      userRoles: {
        some: {
          role: {
            name: "contractor",
          },
        },
      },
    },
    take: 3,
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: "paid",
    },
    take: 2,
  });

  if (contractors.length === 0) {
    console.log("   ⚠️  Missing required data, skipping payments");
    return [];
  }

  const payments = [];

  for (let i = 0; i < contractors.length; i++) {
    const contractor = contractors[i];
    const invoice = invoices[i % invoices.length];

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() - (i + 1) * 7);

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        recipientId: contractor.id,
        invoiceId: invoice?.id,
        amount: 3000 + i * 500,
        currency: "USD",
        paymentMethod: i % 2 === 0 ? "bank_transfer" : "paypal",
        status: i === 0 ? "completed" : i === 1 ? "processing" : "pending",
        referenceNumber: `PAY-${Date.now()}-${i}`,
        scheduledDate,
        processedDate: i <= 1 ? new Date() : null,
        completedDate: i === 0 ? new Date() : null,
        description: `Payment for services rendered`,
      },
    });

    payments.push(payment);
    console.log(`   ✓ Payment to ${contractor.name} - $${payment.amount} (${payment.status})`);
  }

  console.log(`✅ Payments seeded: ${payments.length}`);
  return payments;
}

// Run if executed directly
if (require.main === module) {
  seedPayments(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding payments:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
