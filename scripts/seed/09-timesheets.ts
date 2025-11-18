
// =============================================================
// SEED: TIMESHEETS
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTimesheets(tenantId: string) {
  console.log("⏱️  Seeding timesheets...");

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

  const contracts = await prisma.contract.findMany({
    where: {
      tenantId,
      status: "active",
    },
    take: 3,
  });

  if (contractors.length === 0 || contracts.length === 0) {
    console.log("   ⚠️  Missing required data, skipping timesheets");
    return [];
  }

  const timesheets = [];

  for (let i = 0; i < contractors.length; i++) {
    const contractor = contractors[i];
    const contract = contracts[i % contracts.length];

    // Create timesheet for last week
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 14 - i * 7);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);

    const timesheet = await prisma.timesheet.create({
      data: {
        tenantId,
        userId: contractor.id,
        contractId: contract.id,
        periodStart,
        periodEnd,
        totalHours: 40,
        regularHours: 40,
        overtimeHours: 0,
        status: i === 0 ? "approved" : i === 1 ? "submitted" : "draft",
        submittedAt: i <= 1 ? new Date() : null,
        approvedAt: i === 0 ? new Date() : null,
        hourlyRate: parseFloat(contract.rate.toString()),
        totalAmount: 40 * parseFloat(contract.rate.toString()),
      },
    });

    // Add entries for each day
    for (let day = 0; day < 5; day++) {
      const entryDate = new Date(periodStart);
      entryDate.setDate(entryDate.getDate() + day);

      await prisma.timesheetEntry.create({
        data: {
          timesheetId: timesheet.id,
          date: entryDate,
          hours: 8,
          description: `Regular work day ${day + 1}`,
          taskType: "regular",
        },
      });
    }

    timesheets.push(timesheet);
    console.log(`   ✓ Timesheet for ${contractor.name} - ${timesheet.totalHours}h (${timesheet.status})`);
  }

  console.log(`✅ Timesheets seeded: ${timesheets.length}`);
  return timesheets;
}

// Run if executed directly
if (require.main === module) {
  seedTimesheets(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding timesheets:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
