
/**
 * Seed Timesheets
 * Creates sample timesheets for contractors
 */
import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedTimesheets(
  tenantId: string,
  contracts: any[],
  users: any[]
) {
  console.log("👉 Seeding timesheets...");

  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contractor2 = users.find((u) => u.email === "contractor2@demo.com");
  const contractor3 = users.find((u) => u.email === "contractor3@demo.com");
  const teamLead = users.find((u) => u.email === "teamlead@demo.com");

  const contract1 = contracts.find((c) => c.contractNumber === "CNTR-2024-001");
  const contract2 = contracts.find((c) => c.contractNumber === "CNTR-2024-002");
  const contract3 = contracts.find((c) => c.contractNumber === "CNTR-2024-003");

  // Helper to create timesheet with entries
  async function createTimesheet(data: any, entries: any[]) {
    const timesheet = await prisma.timesheet.create({
      data: {
        tenantId,
        ...data,
      },
    });

    for (const entry of entries) {
      await prisma.timesheetEntry.create({
        data: {
          timesheetId: timesheet.id,
          ...entry,
        },
      });
    }

    return timesheet;
  }

  // Timesheet 1 - Contractor 1 (Approved)
  await createTimesheet(
    {
      userId: contractor1?.id,
      contractId: contract1?.id,
      startDate: new Date("2024-10-28"),
      endDate: new Date("2024-11-03"),
      totalHours: new Prisma.Decimal("40.00"),
      billableHours: new Prisma.Decimal("40.00"),
      status: "approved",
      submittedAt: new Date("2024-11-03T18:00:00Z"),
      approvedBy: teamLead?.id,
      approvedAt: new Date("2024-11-04T10:00:00Z"),
    },
    [
      {
        date: new Date("2024-10-28"),
        hours: new Prisma.Decimal("8.00"),
        description: "Implemented user authentication module",
        taskType: "development",
        isBillable: true,
      },
      {
        date: new Date("2024-10-29"),
        hours: new Prisma.Decimal("8.00"),
        description: "Fixed bugs in payment processing",
        taskType: "development",
        isBillable: true,
      },
      {
        date: new Date("2024-10-30"),
        hours: new Prisma.Decimal("8.00"),
        description: "API integration with third-party service",
        taskType: "development",
        isBillable: true,
      },
      {
        date: new Date("2024-10-31"),
        hours: new Prisma.Decimal("8.00"),
        description: "Code review and documentation",
        taskType: "development",
        isBillable: true,
      },
      {
        date: new Date("2024-11-01"),
        hours: new Prisma.Decimal("8.00"),
        description: "Sprint planning and architecture design",
        taskType: "meeting",
        isBillable: true,
      },
    ]
  );

  // Timesheet 2 - Contractor 1 (Submitted, pending approval)
  await createTimesheet(
    {
      userId: contractor1?.id,
      contractId: contract1?.id,
      startDate: new Date("2024-11-04"),
      endDate: new Date("2024-11-10"),
      totalHours: new Prisma.Decimal("38.50"),
      billableHours: new Prisma.Decimal("38.50"),
      status: "submitted",
      submittedAt: new Date("2024-11-10T17:00:00Z"),
    },
    [
      {
        date: new Date("2024-11-04"),
        hours: new Prisma.Decimal("7.50"),
        description: "Database optimization and indexing",
        taskType: "development",
        isBillable: true,
      },
      {
        date: new Date("2024-11-05"),
        hours: new Prisma.Decimal("8.00"),
        description: "Implemented new dashboard features",
        taskType: "development",
        isBillable: true,
      },
      {
        date: new Date("2024-11-06"),
        hours: new Prisma.Decimal("8.00"),
        description: "Bug fixes and testing",
        taskType: "development",
        isBillable: true,
      },
      {
        date: new Date("2024-11-07"),
        hours: new Prisma.Decimal("7.00"),
        description: "Client meeting and requirements gathering",
        taskType: "meeting",
        isBillable: true,
      },
      {
        date: new Date("2024-11-08"),
        hours: new Prisma.Decimal("8.00"),
        description: "Feature development and unit testing",
        taskType: "development",
        isBillable: true,
      },
    ]
  );

  // Timesheet 3 - Contractor 2 (Approved)
  await createTimesheet(
    {
      userId: contractor2?.id,
      contractId: contract2?.id,
      startDate: new Date("2024-10-21"),
      endDate: new Date("2024-10-27"),
      totalHours: new Prisma.Decimal("35.00"),
      billableHours: new Prisma.Decimal("35.00"),
      status: "approved",
      submittedAt: new Date("2024-10-27T16:00:00Z"),
      approvedBy: teamLead?.id,
      approvedAt: new Date("2024-10-28T11:00:00Z"),
    },
    [
      {
        date: new Date("2024-10-21"),
        hours: new Prisma.Decimal("7.00"),
        description: "User research and persona development",
        taskType: "design",
        isBillable: true,
      },
      {
        date: new Date("2024-10-22"),
        hours: new Prisma.Decimal("7.00"),
        description: "Wireframe creation for dashboard redesign",
        taskType: "design",
        isBillable: true,
      },
      {
        date: new Date("2024-10-23"),
        hours: new Prisma.Decimal("7.00"),
        description: "High-fidelity mockups",
        taskType: "design",
        isBillable: true,
      },
      {
        date: new Date("2024-10-24"),
        hours: new Prisma.Decimal("7.00"),
        description: "Design system documentation",
        taskType: "design",
        isBillable: true,
      },
      {
        date: new Date("2024-10-25"),
        hours: new Prisma.Decimal("7.00"),
        description: "Stakeholder review and iterations",
        taskType: "meeting",
        isBillable: true,
      },
    ]
  );

  // Timesheet 4 - Contractor 3 (Draft)
  await createTimesheet(
    {
      userId: contractor3?.id,
      contractId: contract3?.id,
      startDate: new Date("2024-11-11"),
      endDate: new Date("2024-11-17"),
      totalHours: new Prisma.Decimal("42.00"),
      billableHours: new Prisma.Decimal("42.00"),
      status: "draft",
    },
    [
      {
        date: new Date("2024-11-11"),
        hours: new Prisma.Decimal("8.00"),
        description: "AWS infrastructure setup",
        taskType: "devops",
        isBillable: true,
      },
      {
        date: new Date("2024-11-12"),
        hours: new Prisma.Decimal("8.50"),
        description: "CI/CD pipeline configuration",
        taskType: "devops",
        isBillable: true,
      },
      {
        date: new Date("2024-11-13"),
        hours: new Prisma.Decimal("8.00"),
        description: "Monitoring and alerting setup",
        taskType: "devops",
        isBillable: true,
      },
      {
        date: new Date("2024-11-14"),
        hours: new Prisma.Decimal("8.50"),
        description: "Security hardening and compliance",
        taskType: "devops",
        isBillable: true,
      },
      {
        date: new Date("2024-11-15"),
        hours: new Prisma.Decimal("9.00"),
        description: "Database backup and disaster recovery",
        taskType: "devops",
        isBillable: true,
      },
    ]
  );

  console.log("✅ Timesheets created with entries");
}
