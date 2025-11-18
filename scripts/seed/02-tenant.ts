
// =============================================================
// SEED: TENANT
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTenant() {
  console.log("🏢 Seeding tenant...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-tenant" },
    update: {},
    create: {
      name: "Demo Payroll SaaS",
      slug: "demo-tenant",
      logoUrl: "https://i.ytimg.com/vi/lnNFtaxl79k/maxresdefault.jpg",
      primaryColor: "#3b82f6",
      accentColor: "#10b981",
      plan: "professional",
      billingEmail: "billing@demo-payroll.com",
      subscriptionStatus: "active",
      isActive: true,
    },
  });

  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);
  return tenant;
}

// Run if executed directly
if (require.main === module) {
  seedTenant()
    .catch((e) => {
      console.error("❌ Error seeding tenant:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
