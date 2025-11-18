
/**
 * Seed Contracts
 * Creates sample contracts between users and organizations
 */
import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedContracts(
  tenantId: string,
  organizations: any[],
  users: any[]
) {
  console.log("👉 Seeding contracts...");

  // Find relevant entities
  const techCorp = organizations.find((o) => o.name === "TechCorp Solutions Inc.");
  const eliteStaffing = organizations.find((o) => o.name === "Elite Staffing Agency");
  const adminUser = users.find((u) => u.email === "admin@demo.com");
  const contractor1 = users.find((u) => u.email === "contractor1@demo.com");
  const contractor2 = users.find((u) => u.email === "contractor2@demo.com");
  const contractor3 = users.find((u) => u.email === "contractor3@demo.com");

  const usdCurrency = await prisma.currency.findUnique({ where: { code: "USD" } });
  const gbpCurrency = await prisma.currency.findUnique({ where: { code: "GBP" } });
  const defaultBank = await prisma.bank.findFirst({ where: { tenantId, isDefault: true } });

  const CONTRACTS = [
    {
      ownerId: contractor1?.id,
      clientOrgId: techCorp?.id,
      vendorOrgId: eliteStaffing?.id,
      title: "Software Engineer - Full Stack Development",
      description: "Development of core platform features and API integrations",
      contractNumber: "CNTR-2024-001",
      type: "contractor",
      status: "active",
      workflowStatus: "active",
      rate: new Prisma.Decimal("85.00"),
      rateType: "hourly",
      rateCycle: "weekly",
      currencyId: usdCurrency?.id,
      margin: new Prisma.Decimal("15.00"),
      marginType: "percentage",
      paymentTerms: "Net 15",
      invoiceDueDays: 15,
      bankId: defaultBank?.id,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-12-31"),
      signedAt: new Date("2024-01-10"),
      createdById: adminUser?.id,
    },
    {
      ownerId: contractor2?.id,
      clientOrgId: techCorp?.id,
      vendorOrgId: null,
      title: "UI/UX Designer - Product Redesign",
      description: "Complete redesign of the platform's user interface",
      contractNumber: "CNTR-2024-002",
      type: "freelance",
      status: "active",
      workflowStatus: "active",
      rate: new Prisma.Decimal("60.00"),
      rateType: "hourly",
      rateCycle: "monthly",
      currencyId: gbpCurrency?.id,
      paymentTerms: "Net 30",
      invoiceDueDays: 30,
      bankId: defaultBank?.id,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-08-31"),
      signedAt: new Date("2024-01-28"),
      createdById: adminUser?.id,
    },
    {
      ownerId: contractor3?.id,
      clientOrgId: techCorp?.id,
      vendorOrgId: eliteStaffing?.id,
      title: "DevOps Engineer - Infrastructure Management",
      description: "Cloud infrastructure setup and maintenance",
      contractNumber: "CNTR-2024-003",
      type: "contractor",
      status: "active",
      workflowStatus: "active",
      rate: new Prisma.Decimal("95.00"),
      rateType: "hourly",
      rateCycle: "biweekly",
      currencyId: usdCurrency?.id,
      margin: new Prisma.Decimal("12.50"),
      marginType: "percentage",
      paymentTerms: "Net 15",
      invoiceDueDays: 15,
      bankId: defaultBank?.id,
      startDate: new Date("2024-03-01"),
      signedAt: new Date("2024-02-25"),
      createdById: adminUser?.id,
    },
  ];

  const createdContracts: any[] = [];

  for (const contractData of CONTRACTS) {
    if (!contractData.ownerId || !contractData.createdById) continue;

    const contract = await prisma.contract.create({
      data: {
        tenantId,
        ...contractData,
      },
    });

    createdContracts.push(contract);
    console.log(`   ✓ Created contract: ${contract.title} (${contract.contractNumber})`);
  }

  console.log(`✅ ${createdContracts.length} contracts created`);
  return createdContracts;
}
