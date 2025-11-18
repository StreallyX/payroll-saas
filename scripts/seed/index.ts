
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

const prisma = new PrismaClient();

async function main() {
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
  }
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
