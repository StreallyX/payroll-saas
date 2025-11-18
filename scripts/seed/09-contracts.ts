
import { PrismaClient } from "@prisma/client";

export async function seedContracts(
  prisma: PrismaClient,
  tenantId: string,
  users: any[],
  organizations: any[]
) {
  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contractor2 = users.find((u) => u.email === "contractor2@demo.com");
  const clientOrg = organizations.find((o) => o.type === "client");
  const agencyOrg = organizations.find((o) => o.type === "agency");
  const payrollOrg = organizations.find((o) => o.type === "payroll_partner");

  if (contractor1 && clientOrg && agencyOrg && payrollOrg) {
    await prisma.contract.create({
      data: {
        tenantId,
        contractorUserId: contractor1.id,
        clientOrganizationId: clientOrg.id,
        agencyOrganizationId: agencyOrg.id,
        payrollOrganizationId: payrollOrg.id,
        title: "Software Development Contract",
        status: "active",
        workflowStatus: "active",
        rate: 75.00,
        rateType: "hourly",
        rateCycle: "weekly",
        startDate: new Date("2024-01-01"),
      },
    });
  }

  if (contractor2 && clientOrg && agencyOrg && payrollOrg) {
    await prisma.contract.create({
      data: {
        tenantId,
        contractorUserId: contractor2.id,
        clientOrganizationId: clientOrg.id,
        agencyOrganizationId: agencyOrg.id,
        payrollOrganizationId: payrollOrg.id,
        title: "UI/UX Design Contract",
        status: "active",
        workflowStatus: "active",
        rate: 65.00,
        rateType: "hourly",
        rateCycle: "weekly",
        startDate: new Date("2024-01-01"),
      },
    });
  }
}
