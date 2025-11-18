
<<<<<<< HEAD
// =============================================================
// SEED: ORGANIZATIONS
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ORGANIZATIONS = [
  {
    type: "client",
    name: "TechCorp Inc.",
    legalName: "TechCorp Incorporated",
    contactEmail: "contact@techcorp.com",
    contactPhone: "+1-555-1000",
    city: "San Francisco",
    countryCode: "US",
  },
  {
    type: "client",
    name: "Global Solutions Ltd",
    legalName: "Global Solutions Limited",
    contactEmail: "hello@globalsolutions.com",
    contactPhone: "+44-20-9000-1000",
    city: "London",
    countryCode: "GB",
  },
  {
    type: "client",
    name: "Innovation Labs",
    legalName: "Innovation Labs GmbH",
    contactEmail: "info@innovationlabs.de",
    contactPhone: "+49-30-5000-6000",
    city: "Berlin",
    countryCode: "DE",
  },
  {
    type: "agency",
    name: "Elite Staffing Agency",
    legalName: "Elite Staffing Services LLC",
    contactEmail: "hr@elitestaffing.com",
    contactPhone: "+1-555-2000",
    city: "New York",
    countryCode: "US",
  },
  {
    type: "agency",
    name: "Global Talent Partners",
    legalName: "Global Talent Partners Ltd",
    contactEmail: "partners@globaltalent.com",
    contactPhone: "+44-20-8000-9000",
    city: "Manchester",
    countryCode: "GB",
  },
  {
    type: "payroll_partner",
    name: "Payroll Pro Services",
    legalName: "Payroll Pro Services Inc.",
    contactEmail: "support@payrollpro.com",
    contactPhone: "+1-555-3000",
    city: "Chicago",
    countryCode: "US",
  },
  {
    type: "payroll_partner",
    name: "Euro Payroll Solutions",
    legalName: "Euro Payroll Solutions SA",
    contactEmail: "contact@europayroll.com",
    contactPhone: "+33-1-5000-6000",
    city: "Paris",
    countryCode: "FR",
  },
];

export async function seedOrganizations(tenantId: string) {
  console.log("🏢 Seeding organizations...");

  const createdOrgs: any[] = [];

  for (const orgData of ORGANIZATIONS) {
    const country = await prisma.country.findUnique({
      where: { code: orgData.countryCode },
    });

    const org = await prisma.organization.create({
      data: {
        tenantId,
        type: orgData.type,
        name: orgData.name,
        legalName: orgData.legalName,
        contactEmail: orgData.contactEmail,
        contactPhone: orgData.contactPhone,
        city: orgData.city,
        countryId: country?.id,
        status: "active",
      },
    });

    createdOrgs.push(org);
    console.log(`   ✓ ${org.name} (${org.type})`);
  }

  console.log(`✅ Organizations seeded: ${ORGANIZATIONS.length}`);
  return createdOrgs;
}

// Run if executed directly
if (require.main === module) {
  seedOrganizations(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding organizations:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
=======
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
>>>>>>> 5f66330563348da8ade4b1939f77df8cc233d71a
