
// =============================================================
// SEED: CONTRACTS
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedContracts(tenantId: string) {
  console.log("📄 Seeding contracts...");

  // Get necessary data
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
    take: 5,
  });

  const operations = await prisma.user.findFirst({
    where: {
      tenantId,
      userRoles: {
        some: {
          role: {
            name: "operations_manager",
          },
        },
      },
    },
  });

  const clients = await prisma.organization.findMany({
    where: {
      tenantId,
      type: "client",
    },
    take: 3,
  });

  const agencies = await prisma.organization.findMany({
    where: {
      tenantId,
      type: "agency",
    },
    take: 2,
  });

  if (!operations || contractors.length === 0 || clients.length === 0) {
    console.log("   ⚠️  Missing required data, skipping contracts");
    return [];
  }

  const contracts = [];

  // Create contracts for each contractor
  for (let i = 0; i < contractors.length; i++) {
    const contractor = contractors[i];
    const client = clients[i % clients.length];
    const agency = agencies[i % agencies.length];

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (i + 1));

    const contract = await prisma.contract.create({
      data: {
        tenantId,
        contractNumber: `CTR-2024-${String(i + 1).padStart(4, "0")}`,
        createdById: operations.id,
        assignedToId: contractor.id,
        clientOrgId: client.id,
        providerOrgId: agency?.id,
        title: `${contractor.name} - Service Agreement`,
        description: `Service agreement for ${contractor.name} providing professional services`,
        type: "service",
        status: i < 3 ? "active" : "draft",
        rate: 75 + i * 15, // Varied rates
        rateType: i % 2 === 0 ? "hourly" : "daily",
        currency: "USD",
        paymentSchedule: "monthly",
        startDate,
        signedDate: i < 3 ? startDate : null,
      },
    });

    contracts.push(contract);
    console.log(`   ✓ ${contract.contractNumber} - ${contractor.name}`);
  }

  console.log(`✅ Contracts seeded: ${contracts.length}`);
  return contracts;
}

// Run if executed directly
if (require.main === module) {
  seedContracts(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding contracts:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
