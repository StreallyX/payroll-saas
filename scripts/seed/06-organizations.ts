
/**
 * Seed Organizations
 * Creates demo organizations (companies, agencies, etc.)
 */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function seedOrganizations(tenantId: string, users: any[]) {
  console.log("👉 Seeding organizations...");

  // Get admin user as creator
  const adminUser = users.find((u) => u.email === "admin@demo.com");
  if (!adminUser) throw new Error("Admin user not found");

  const usCountry = await prisma.country.findUnique({ where: { code: "US" } });
  const ukCountry = await prisma.country.findUnique({ where: { code: "GB" } });

  const ORGANIZATIONS = [
    {
      type: "company",
      name: "TechCorp Solutions Inc.",
      legalName: "TechCorp Solutions Incorporated",
      taxId: "12-3456789",
      contactPerson: "Robert Johnson",
      contactEmail: "contact@techcorp.com",
      contactPhone: "+1-555-1001",
      website: "https://techcorp.com",
      address1: "123 Tech Street",
      city: "San Francisco",
      state: "CA",
      postCode: "94102",
      countryId: usCountry?.id,
      invoicingContactName: "Accounting Department",
      invoicingContactEmail: "accounting@techcorp.com",
      vatNumber: "US123456789",
      status: "active",
    },
    {
      type: "company",
      name: "Global Innovations Ltd",
      legalName: "Global Innovations Limited",
      taxId: "GB987654321",
      contactPerson: "Elizabeth Windsor",
      contactEmail: "info@globalinnovations.co.uk",
      contactPhone: "+44-20-7946-0958",
      website: "https://globalinnovations.co.uk",
      address1: "456 Innovation Way",
      city: "London",
      state: "England",
      postCode: "SW1A 1AA",
      countryId: ukCountry?.id,
      invoicingContactName: "Finance Team",
      invoicingContactEmail: "finance@globalinnovations.co.uk",
      vatNumber: "GB987654321",
      status: "active",
    },
    {
      type: "agency",
      name: "Elite Staffing Agency",
      legalName: "Elite Staffing Agency LLC",
      taxId: "45-6789012",
      contactPerson: "Maria Garcia",
      contactEmail: "info@elitestaffing.com",
      contactPhone: "+1-555-2001",
      website: "https://elitestaffing.com",
      address1: "789 Recruitment Blvd",
      city: "New York",
      state: "NY",
      postCode: "10001",
      countryId: usCountry?.id,
      invoicingContactName: "Billing Department",
      invoicingContactEmail: "billing@elitestaffing.com",
      vatNumber: "US456789012",
      status: "active",
      notes: "Premier staffing agency specializing in tech talent",
    },
    {
      type: "agency",
      name: "ProConnect Recruitment",
      legalName: "ProConnect Recruitment Services",
      taxId: "78-9012345",
      contactPerson: "Thomas Anderson",
      contactEmail: "contact@proconnect.com",
      contactPhone: "+1-555-2002",
      website: "https://proconnect.com",
      address1: "321 Talent Avenue",
      city: "Austin",
      state: "TX",
      postCode: "78701",
      countryId: usCountry?.id,
      invoicingContactName: "Accounts Receivable",
      invoicingContactEmail: "ar@proconnect.com",
      status: "active",
    },
    {
      type: "payroll_partner",
      name: "Premier Payroll Services",
      legalName: "Premier Payroll Services Corporation",
      taxId: "90-1234567",
      contactPerson: "Jennifer Lee",
      contactEmail: "support@premierpayroll.com",
      contactPhone: "+1-555-3001",
      website: "https://premierpayroll.com",
      address1: "555 Finance Plaza",
      city: "Chicago",
      state: "IL",
      postCode: "60601",
      countryId: usCountry?.id,
      invoicingContactEmail: "invoicing@premierpayroll.com",
      status: "active",
      notes: "Full-service payroll processing company",
    },
    {
      type: "client",
      name: "Startup Ventures Inc",
      legalName: "Startup Ventures Incorporated",
      taxId: "11-2233445",
      contactPerson: "Emily Chen",
      contactEmail: "emily@startupventures.com",
      contactPhone: "+1-555-4001",
      website: "https://startupventures.com",
      address1: "999 Innovation Drive",
      city: "Seattle",
      state: "WA",
      postCode: "98101",
      countryId: usCountry?.id,
      status: "active",
    },
  ];

  const createdOrgs: any[] = [];

  for (const orgData of ORGANIZATIONS) {
    const org = await prisma.organization.create({
      data: {
        tenantId,
        createdById: adminUser.id,
        ...orgData,
      },
    });

    createdOrgs.push(org);
    console.log(`   ✓ Created ${org.type}: ${org.name}`);
  }

  console.log(`✅ ${ORGANIZATIONS.length} organizations created`);
  return createdOrgs;
}
