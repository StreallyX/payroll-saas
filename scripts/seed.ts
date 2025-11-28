/**
 * ============================================================
 * MAIN SEED SCRIPT
 * Dynamic RBAC Payroll SaaS Database Seeder
 * ============================================================
 * 
 * This script populates the database with comprehensive test data
 * for the new RBAC system including:
 * - Permissions and Roles
 * - Users with different permission sets
 * - Organizations (companies, agencies, payroll partners)
 * - Teams and organizational hierarchy
 * - Contracts linking users and organizations
 * - Timesheets, Invoices, Payments
 * - Tasks, Leads, Onboarding data
 * 
 * Run: npm run seed
 */

import { PrismaClient } from "@prisma/client";
import { seedPermissions } from "./seed/00-permissions";
import { seedDefaultRoles } from "./seed/01-roles";
import { seedSuperAdmin } from "./seed/02-superadmin";
import { seedTenant } from "./seed/03-tenant";
import { seedReferenceData } from "./seed/04-reference-data";
import { seedUsers } from "./seed/05-users";
import { seedOrganizations } from "./seed/06-organizations";
import { seedOrganizationMembers } from "./seed/07-org-members";
import { seedTeams } from "./seed/08-teams";
import { seedBanks } from "./seed/09-banks";
import { seedContracts } from "./seed/10-contracts";
import { seedTimesheets } from "./seed/11-timesheets";
import { seedInvoices } from "./seed/12-invoices";
import { seedPayments } from "./seed/13-payments";
import { seedTasks } from "./seed/14-tasks";
import { seedLeads } from "./seed/15-leads";
import { seedOnboarding } from "./seed/16-onboarding";

const prisma = new PrismaClient();

async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║   🌱 PAYROLL SAAS - DYNAMIC RBAC DATABASE SEEDER          ║");
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  try {
    // ----------------------------------------------------------
    // PHASE 1: SYSTEM-LEVEL DATA
    // ----------------------------------------------------------
    console.log("📦 PHASE 1: System-Level Data");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedPermissions();
    await seedSuperAdmin();
    await seedReferenceData();

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 2: TENANT SETUP
    // ----------------------------------------------------------
    console.log("🏢 PHASE 2: Tenant Setup");
    console.log("─────────────────────────────────────────────────────────────");
    
    const tenantId = await seedTenant();

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 3: RBAC SETUP
    // ----------------------------------------------------------
    console.log("🔐 PHASE 3: RBAC Setup (Roles & Permissions)");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedDefaultRoles(tenantId);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 4: USERS & PROFILES
    // ----------------------------------------------------------
    console.log("👥 PHASE 4: Users & Profiles");
    console.log("─────────────────────────────────────────────────────────────");
    
    const users = await seedUsers(tenantId);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 5: ORGANIZATIONS
    // ----------------------------------------------------------
    console.log("🏢 PHASE 5: Organizations");
    console.log("─────────────────────────────────────────────────────────────");
    
    const organizations = await seedOrganizations(tenantId, users);
    await seedOrganizationMembers(organizations, users);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 6: TEAMS
    // ----------------------------------------------------------
    console.log("👨‍👩‍👧‍👦 PHASE 6: Teams");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedTeams(tenantId, organizations, users);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 7: BANKING
    // ----------------------------------------------------------
    console.log("🏦 PHASE 7: Banking");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedBanks(tenantId);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 8: CONTRACTS
    // ----------------------------------------------------------
    console.log("📄 PHASE 8: Contracts");
    console.log("─────────────────────────────────────────────────────────────");
    
    const contracts = await seedContracts(tenantId, organizations, users);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 9: TIMESHEETS
    // ----------------------------------------------------------
    console.log("⏰ PHASE 9: Timesheets");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedTimesheets(tenantId, contracts, users);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 10: INVOICES
    // ----------------------------------------------------------
    console.log("🧾 PHASE 10: Invoices");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedInvoices(tenantId, contracts, users);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 11: PAYMENTS
    // ----------------------------------------------------------
    console.log("💰 PHASE 11: Payments");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedPayments(tenantId, contracts, users);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 12: TASKS
    // ----------------------------------------------------------
    console.log("✅ PHASE 12: Tasks");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedTasks(tenantId, users);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 13: LEADS (CRM)
    // ----------------------------------------------------------
    console.log("📈 PHASE 13: Leads");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedLeads(tenantId);

    console.log("\n");

    // ----------------------------------------------------------
    // PHASE 14: ONBOARDING
    // ----------------------------------------------------------
    console.log("🎯 PHASE 14: Onboarding");
    console.log("─────────────────────────────────────────────────────────────");
    
    await seedOnboarding(tenantId, users);

    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                                                            ║");
    console.log("║   ✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!             ║");
    console.log("║                                                            ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("\n");

    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------
    console.log("📊 SEED SUMMARY");
    console.log("─────────────────────────────────────────────────────────────");
    
    const counts = await Promise.all([
      prisma.permission.count(),
      prisma.role.count(),
      prisma.user.count(),
      prisma.organization.count(),
      prisma.team.count(),
      prisma.contract.count(),
      prisma.invoice.count(),
      prisma.timesheet.count(),
      prisma.payment.count(),
      prisma.task.count(),
      prisma.lead.count(),
      prisma.onboardingTemplate.count(),
    ]);

    console.log(`   Permissions:       ${counts[0]}`);
    console.log(`   Roles:             ${counts[1]}`);
    console.log(`   Users:             ${counts[2]}`);
    console.log(`   Organizations:     ${counts[3]}`);
    console.log(`   Teams:             ${counts[4]}`);
    console.log(`   Contracts:         ${counts[5]}`);
    console.log(`   Invoices:          ${counts[6]}`);
    console.log(`   Timesheets:        ${counts[7]}`);
    console.log(`   Payments:          ${counts[8]}`);
    console.log(`   Tasks:             ${counts[9]}`);
    console.log(`   Leads:             ${counts[10]}`);
    console.log(`   Onboarding Templates: ${counts[11]}`);

    console.log("\n");
    console.log("🔑 TEST CREDENTIALS");
    console.log("─────────────────────────────────────────────────────────────");
    console.log("   Super Admin:       superadmin@payrollsaas.com");
    console.log("   Password:          SuperAdmin@2024!");
    console.log("\n");
    console.log("   Tenant Admin:      admin@demo.com");
    console.log("   Finance Manager:   finance@demo.com");
    console.log("   HR Manager:        hr@demo.com");
    console.log("   Operations Mgr:    operations@demo.com");
    console.log("   Accountant:        accountant@demo.com");
    console.log("   Team Lead:         teamlead@demo.com");
    console.log("   Contractor 1:      contractor1@demo.com");
    console.log("   Contractor 2:      contractor2@demo.com");
    console.log("   Contractor 3:      contractor3@demo.com");
    console.log("   Viewer:            viewer@demo.com");
    console.log("\n");
    console.log("   All tenant passwords: Password@123");
    console.log("\n");

  } catch (error) {
    console.error("\n❌ ERROR DURING SEEDING:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
