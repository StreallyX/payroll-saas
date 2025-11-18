
// =============================================================
// SEED: BANKS
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BANKS = [
  {
    name: "Chase Bank",
    accountName: "Demo Payroll Business Account",
    accountNumber: "****1234",
    swiftCode: "CHASUS33",
    country: "US",
    isDefault: true,
  },
  {
    name: "HSBC UK",
    accountName: "Demo Payroll UK Account",
    accountNumber: "****5678",
    swiftCode: "HBUKGB4B",
    iban: "GB29NWBK60161331926819",
    country: "GB",
    isDefault: false,
  },
  {
    name: "Deutsche Bank",
    accountName: "Demo Payroll EU Account",
    accountNumber: "****9012",
    swiftCode: "DEUTDEFF",
    iban: "DE89370400440532013000",
    country: "DE",
    isDefault: false,
  },
];

export async function seedBanks(tenantId: string) {
  console.log("🏦 Seeding banks...");

  for (const bankData of BANKS) {
    const bank = await prisma.bank.create({
      data: {
        tenantId,
        name: bankData.name,
        accountName: bankData.accountName,
        accountNumber: bankData.accountNumber,
        swiftCode: bankData.swiftCode,
        iban: bankData.iban,
        country: bankData.country,
        currency: bankData.country === "GB" ? "GBP" : bankData.country === "DE" ? "EUR" : "USD",
        status: "active",
        isDefault: bankData.isDefault,
      },
    });

    console.log(`   ✓ ${bank.name} (${bank.country})`);
  }

  console.log(`✅ Banks seeded: ${BANKS.length}`);
}

// Run if executed directly
if (require.main === module) {
  seedBanks(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding banks:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
