<<<<<<< HEAD

// =============================================================
// MASTER SEED SCRIPT
// =============================================================
import { PrismaClient } from "@prisma/client";
import { seedPermissions } from "./00-permissions";
import { seedCountries } from "./01-countries";
import { seedTenant } from "./02-tenant";
import { seedRoles } from "./03-roles";
import { seedSuperAdmin } from "./04-superadmin";
import { seedUsers } from "./05-users";
import { seedOrganizations } from "./06-organizations";
import { seedContracts } from "./07-contracts";
import { seedInvoices } from "./08-invoices";
import { seedTimesheets } from "./09-timesheets";
import { seedPayments } from "./10-payments";
import { seedBanks } from "./11-banks";
import { seedLeads } from "./12-leads";
import { seedTasks } from "./13-tasks";
=======
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
>>>>>>> 5f66330563348da8ade4b1939f77df8cc233d71a

const prisma = new PrismaClient();

async function main() {
<<<<<<< HEAD
  console.log("🚀 Starting database seeding...\n");

  try {
    // 1. Seed permissions (global)
    await seedPermissions();
    console.log();

    // 2. Seed countries (global)
    await seedCountries();
    console.log();

    // 3. Seed super admin (global)
    await seedSuperAdmin();
    console.log();

    // 4. Seed tenant
    const tenant = await seedTenant();
    console.log();

    // 5. Seed roles (tenant-specific)
    await seedRoles(tenant.id);
    console.log();

    // 6. Seed users (tenant-specific)
    await seedUsers(tenant.id);
    console.log();

    // 7. Seed organizations (tenant-specific)
    await seedOrganizations(tenant.id);
    console.log();

    // 8. Seed contracts (tenant-specific)
    await seedContracts(tenant.id);
    console.log();

    // 9. Seed invoices (tenant-specific)
    await seedInvoices(tenant.id);
    console.log();

    // 10. Seed timesheets (tenant-specific)
    await seedTimesheets(tenant.id);
    console.log();

    // 11. Seed payments (tenant-specific)
    await seedPayments(tenant.id);
    console.log();

    // 12. Seed banks (tenant-specific)
    await seedBanks(tenant.id);
    console.log();

    // 13. Seed leads (tenant-specific)
    await seedLeads(tenant.id);
    console.log();

    // 14. Seed tasks (tenant-specific)
    await seedTasks(tenant.id);
    console.log();

    console.log("✨ Database seeding completed successfully!\n");
    console.log("📝 Tenant: demo-tenant");
    console.log("🔑 Super Admin: superadmin@payroll-saas.com / SuperAdmin123!");
    console.log("🔑 Tenant Admin: admin@demo.com / Admin123!");
    console.log("🔑 Finance Manager: finance@demo.com / Finance123!");
    console.log("🔑 HR Manager: hr@demo.com / HR123!");
    console.log("🔑 Payroll Manager: payroll@demo.com / Payroll123!");
    console.log("🔑 Operations Manager: operations@demo.com / Operations123!");
    console.log("🔑 Accountant: accountant@demo.com / Accountant123!");
    console.log("🔑 Recruiter: recruiter@demo.com / Recruiter123!");
    console.log("🔑 Contractor: john.doe@contractor.com / Contractor123!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
=======
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
>>>>>>> 5f66330563348da8ade4b1939f77df8cc233d71a
  }
}

main()
  .catch((e) => {
<<<<<<< HEAD
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
=======
    console.error(e);
    process.exit(1);
>>>>>>> 5f66330563348da8ade4b1939f77df8cc233d71a
  });
