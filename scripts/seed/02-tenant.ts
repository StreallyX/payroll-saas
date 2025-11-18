
<<<<<<< HEAD
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
=======
import { PrismaClient } from "@prisma/client";

export async function seedTenant(prisma: PrismaClient) {
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    update: {},
    create: {
      id: "demo-tenant",
      name: "Demo Payroll Platform",
      logoUrl: "https://i.ytimg.com/vi/9UvA84Ynw1k/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBde3Hd0HbhnLUdbgvuE36fsQIMAw",
      primaryColor: "#3b82f6",
      accentColor: "#10b981",
      backgroundColor: "#f8fafc",
      isActive: true,

      // PHASE 3: Multi-tenancy Enhancements
      customFont: "Inter",
      customEmailDomain: "demo.payroll.com",
      emailDomainVerified: true,

      // Subscription Management
      subscriptionPlan: "professional",
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),

      // Localization
      timezone: "America/New_York",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",

      // Domain Management
      subdomain: "demo",
      customDomain: "demo.payroll.com",
      customDomainVerified: true,

      // White-label Configuration
      loginPageConfig: {
        backgroundImage: "https://t3.ftcdn.net/jpg/03/33/21/38/360_F_333213864_45C3bVVIXXLRqWuXCeuy5E5Dn4eWc1bW.jpg",
        welcomeMessage: "Welcome to Demo Payroll Platform",
        customCss: "",
      },
      navigationConfig: {
        menuItems: ["dashboard", "contracts", "invoices", "timesheets", "payments"],
      },

      // Onboarding
      onboardingCompleted: true,
      onboardingStep: 5,
    },
  });

  return tenant;
}
>>>>>>> 5f66330563348da8ade4b1939f77df8cc233d71a
