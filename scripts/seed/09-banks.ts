
/**
 * Seed Banks
 * Creates bank accounts
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedBanks(tenantId: string) {
  console.log("👉 Seeding banks...");

  const BANKS = [
    {
      name: "Chase Business Account",
      accountNumber: "****1234",
      routingNumber: "021000021",
      accountType: "business",
      isDefault: true,
      status: "active",
    },
    {
      name: "Wells Fargo Checking",
      accountNumber: "****5678",
      routingNumber: "121000248",
      accountType: "checking",
      isDefault: false,
      status: "active",
    },
    {
      name: "Bank of America Savings",
      accountNumber: "****9012",
      routingNumber: "026009593",
      accountType: "savings",
      isDefault: false,
      status: "active",
    },
  ];

  for (const bankData of BANKS) {
    await prisma.bank.create({
      data: {
        tenantId,
        ...bankData,
      },
    });
  }

  console.log(`✅ ${BANKS.length} banks created`);
}
