
import { PrismaClient } from "@prisma/client";

export async function seedTimesheets(
  prisma: PrismaClient,
  tenantId: string,
  users: any[]
) {
  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contract = await prisma.contract.findFirst({
    where: {
      tenantId,
      contractorUserId: contractor1?.id,
    },
  });

  if (contractor1 && contract) {
    const timesheet = await prisma.timesheet.create({
      data: {
        tenantId,
        userId: contractor1.id,
        contractId: contract.id,
        weekStartDate: new Date("2024-01-01"),
        weekEndDate: new Date("2024-01-07"),
        totalHours: 40,
        status: "approved",
        submittedAt: new Date("2024-01-08"),
        approvedAt: new Date("2024-01-09"),
      },
    });

    // Add timesheet entries
    const days = [1, 2, 3, 4, 5]; // Monday to Friday
    for (const day of days) {
      await prisma.timesheetEntry.create({
        data: {
          timesheetId: timesheet.id,
          date: new Date(`2024-01-0${day}`),
          hours: 8,
          description: "Software development work",
          taskType: "development",
        },
      });
    }
  }
}
