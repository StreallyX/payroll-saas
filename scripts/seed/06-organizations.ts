
import { PrismaClient } from "@prisma/client";

export async function seedOrganizations(prisma: PrismaClient, tenantId: string) {
  const organizations = [
    {
      type: "client",
      name: "Acme Corporation",
      contactEmail: "contact@acme.com",
      contactPhone: "+1234567890",
      status: "active",
    },
    {
      type: "client",
      name: "TechStart Inc",
      contactEmail: "hello@techstart.com",
      contactPhone: "+1234567891",
      status: "active",
    },
    {
      type: "agency",
      name: "Global Staffing Agency",
      contactEmail: "info@globalstaffing.com",
      contactPhone: "+1234567892",
      status: "active",
    },
    {
      type: "agency",
      name: "Elite Talent Solutions",
      contactEmail: "contact@elitetalent.com",
      contactPhone: "+1234567893",
      status: "active",
    },
    {
      type: "payroll_partner",
      name: "PayrollPro Services",
      contactEmail: "support@payrollpro.com",
      contactPhone: "+1234567894",
      status: "active",
    },
  ];

  const createdOrgs = [];

  for (const orgData of organizations) {
    const org = await prisma.organization.create({
      data: {
        tenantId,
        ...orgData,
      },
    });
    createdOrgs.push(org);
  }

  return createdOrgs;
}
