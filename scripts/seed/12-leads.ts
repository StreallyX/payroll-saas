
// =============================================================
// SEED: LEADS
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEADS = [
  {
    name: "Acme Corporation",
    company: "Acme Corp",
    email: "contact@acmecorp.com",
    phone: "+1-555-4000",
    status: "qualified",
    source: "website",
    estimatedValue: 50000,
  },
  {
    name: "StartupXYZ",
    company: "StartupXYZ Inc",
    email: "hello@startupxyz.com",
    phone: "+1-555-5000",
    status: "contacted",
    source: "referral",
    estimatedValue: 30000,
  },
  {
    name: "Enterprise Solutions",
    company: "Enterprise Solutions Ltd",
    email: "info@enterprisesolutions.com",
    phone: "+44-20-7000-8000",
    status: "new",
    source: "linkedin",
    estimatedValue: 75000,
  },
  {
    name: "Digital Ventures",
    company: "Digital Ventures GmbH",
    email: "contact@digitalventures.de",
    phone: "+49-30-6000-7000",
    status: "negotiating",
    source: "event",
    estimatedValue: 60000,
  },
];

export async function seedLeads(tenantId: string) {
  console.log("📊 Seeding leads...");

  for (const leadData of LEADS) {
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name: leadData.name,
        company: leadData.company,
        email: leadData.email,
        phone: leadData.phone,
        status: leadData.status,
        source: leadData.source,
        estimatedValue: leadData.estimatedValue,
        currency: "USD",
        lastContact: new Date(),
        notes: `Lead from ${leadData.source}`,
      },
    });

    console.log(`   ✓ ${lead.name} - ${lead.status} ($${lead.estimatedValue})`);
  }

  console.log(`✅ Leads seeded: ${LEADS.length}`);
}

// Run if executed directly
if (require.main === module) {
  seedLeads(process.argv[2] || "")
    .catch((e) => {
      console.error("❌ Error seeding leads:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
