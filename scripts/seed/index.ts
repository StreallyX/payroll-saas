import { PrismaClient } from "@prisma/client";
import { seedCountries } from "./01-countries";
import { seedTenant } from "./02-tenant";
import { seedPermissions } from "./03-permissions";
import { seedRoles } from "./04-roles";
import { seedUsers } from "./05-users";
import { seedOrganizations } from "./06-organizations";
import { seedUserOrganizations } from "./07-user-organizations";
import { seedUserRoles } from "./08-user-roles";
import { seedContracts } from "./09-contracts";
import { seedInvoices } from "./10-invoices";
import { seedTimesheets } from "./11-timesheets";
import { seedPhase3Features } from "./12-phase3-features";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting RBAC Phase 2 Seeding (with PHASE 3 Enhancements)...\n");

  try {
    // 1. Reference Data
    console.log("📍 Seeding countries...");
    await seedCountries(prisma);
    console.log("✅ Countries seeded\n");

    // 2. Tenant (with PHASE 3 enhancements)
    console.log("🏢 Seeding tenant (with PHASE 3 enhancements)...");
    const tenant = await seedTenant(prisma);
    console.log("✅ Tenant seeded\n");

    // 3. Permissions
    console.log("🔐 Seeding permissions...");
    await seedPermissions(prisma);
    console.log("✅ Permissions seeded\n");

    // 4. Roles
    console.log("👥 Seeding roles...");
    await seedRoles(prisma, tenant.id);
    console.log("✅ Roles seeded\n");

    // 5. Users
    console.log("👤 Seeding users...");
    const users = await seedUsers(prisma, tenant.id);
    console.log("✅ Users seeded\n");

    // 6. Organizations (replaces companies, agencies, contractors, payroll partners)
    console.log("🏢 Seeding organizations...");
    const organizations = await seedOrganizations(prisma, tenant.id);
    console.log("✅ Organizations seeded\n");

    // 7. User-Organization relationships
    console.log("🔗 Seeding user-organization relationships...");
    await seedUserOrganizations(prisma, users, organizations);
    console.log("✅ User-organization relationships seeded\n");

    // 8. User-Role assignments
    console.log("👔 Seeding user-role assignments...");
    await seedUserRoles(prisma, tenant.id, users);
    console.log("✅ User-role assignments seeded\n");

    // 9. Contracts (with new RBAC structure)
    console.log("📄 Seeding contracts...");
    await seedContracts(prisma, tenant.id, users, organizations);
    console.log("✅ Contracts seeded\n");

    // 10. Invoices
    console.log("💰 Seeding invoices...");
    await seedInvoices(prisma, tenant.id);
    console.log("✅ Invoices seeded\n");

    // 11. Timesheets
    console.log("⏰ Seeding timesheets...");
    await seedTimesheets(prisma, tenant.id, users);
    console.log("✅ Timesheets seeded\n");

    // 12. PHASE 3 Features (quotas, feature flags, templates, security)
    console.log("🎨 Seeding PHASE 3 features...");
    await seedPhase3Features(prisma, tenant.id, users);
    console.log("✅ PHASE 3 features seeded\n");

    console.log("✨ Seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Tenant: ${tenant.name}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Organizations: ${organizations.length}`);
    console.log(`   - PHASE 3 features: Quotas, Feature Flags, Templates, Security Settings`);
    console.log("\n🎉 Database ready for RBAC Phase 2 with PHASE 3 enhancements!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
