// seed.ts - UPDATED WITH V2 PERMISSIONS FOR RBAC REFACTORING
import { seedPermissionsV2, verifyPermissions } from "./seed/00-permissions-v2"
import { seedRolesV2, displayRolesSummary } from "./seed/01-roles-v2"
import { seedSuperAdmin } from "./seed/02-superadmin"
import { seedTenant } from "./seed/03-tenant"
import { seedUsers } from "./seed/04-users"
import { seedSampleAgencies } from "./seed/05-sample-agencies"
import { seedSampleCompanies } from "./seed/06-sample-companies"
import { seedSamplePayrollPartners } from "./seed/07-sample-payroll"
import { seedSampleContractors } from "./seed/08-sample-contractors"
import { seedSampleContracts } from "./seed/09-sample-contracts"
import { seedSampleInvoices } from "./seed/10-sample-invoices"
import { seedSamplePayslips } from "./seed/11-sample-payslips"
import { seedSampleOnboarding } from "./seed/12-sample-onboarding"
import { seedSampleTasks } from "./seed/13-sample-tasks"
import { seedSampleLeads } from "./seed/14-sample-leads"

async function main() {
  console.log("🌱 STARTING FULL DATABASE SEED (WITH V2 PERMISSIONS)\n")

  // ---------------------------
  // 1. SYSTEM-LEVEL SEED (V2)
  // ---------------------------
  console.log("📦 Phase 1: Seeding Permissions v2...")
  await seedPermissionsV2()
  await verifyPermissions()
  
  console.log("\n👑 Phase 2: Seeding SuperAdmin...")
  await seedSuperAdmin()

  // ---------------------------
  // 2. TENANT
  // ---------------------------
  console.log("\n🏢 Phase 3: Seeding Tenant...")
  const tenantId = await seedTenant()

  // ---------------------------
  // 3. ROLES (Dynamic RBAC V2)
  // ---------------------------
  console.log("\n👥 Phase 4: Seeding Roles v2...")
  await seedRolesV2(tenantId)
  await displayRolesSummary(tenantId)

  // ---------------------------
  // 4. USERS
  // ---------------------------
  console.log("\n👤 Phase 5: Seeding Users...")
  await seedUsers(tenantId)

  // ---------------------------
  // 5. AGENCIES
  // ---------------------------
  console.log("\n🏢 Phase 6: Seeding Sample Agencies...")
  const agencies = await seedSampleAgencies(tenantId)

  // ---------------------------
  // 6. COMPANIES
  // ---------------------------
  console.log("\n🏭 Phase 7: Seeding Sample Companies...")
  const companies = await seedSampleCompanies(tenantId)

  // ---------------------------
  // 7. PAYROLL PARTNERS
  // ---------------------------
  console.log("\n💼 Phase 8: Seeding Sample Payroll Partners...")
  const payrollPartners = await seedSamplePayrollPartners(tenantId)

  // ---------------------------
  // 8. CONTRACTORS
  // ---------------------------
  console.log("\n👷 Phase 9: Seeding Sample Contractors...")
  const contractors = await seedSampleContractors(
    tenantId,
    agencies,
  )

  // ---------------------------
  // 9. CONTRACTS
  // ---------------------------
  console.log("\n📄 Phase 10: Seeding Sample Contracts...")
  const contracts = await seedSampleContracts(
    tenantId,
    agencies,
    companies,
    contractors,
    payrollPartners,
  )

  // ---------------------------
  // 10. INVOICES
  // ---------------------------
  console.log("\n🧾 Phase 11: Seeding Sample Invoices...")
  await seedSampleInvoices(tenantId, contracts)

  // ---------------------------
  // 11. PAYSLIPS
  // ---------------------------
  console.log("\n💰 Phase 12: Seeding Sample Payslips...")
  await seedSamplePayslips(tenantId, contracts)

  // ---------------------------
  // 12. ONBOARDING
  // ---------------------------
  console.log("\n📋 Phase 13: Seeding Sample Onboarding...")
  await seedSampleOnboarding(tenantId)

  // ---------------------------
  // 13. TASKS
  // ---------------------------
  console.log("\n✅ Phase 14: Seeding Sample Tasks...")
  await seedSampleTasks(tenantId)

  // ---------------------------
  // 14. LEADS
  // ---------------------------
  console.log("\n🎯 Phase 15: Seeding Sample Leads...")
  await seedSampleLeads(tenantId)

  console.log("\n" + "=".repeat(60))
  console.log("🎉 SEED COMPLETE! Everything is ready to use.")
  console.log("=".repeat(60))
  console.log("\n✅ Database has been seeded with:")
  console.log("   - ✅ All v2 permissions (150+ granular permissions)")
  console.log("   - ✅ All roles with correct v2 permissions")
  console.log("   - ✅ SuperAdmin with full access")
  console.log("   - ✅ Admin users can now access all pages")
  console.log("   - ✅ Sample data for testing")
  console.log("\n🔐 You can now login and test the RBAC system!")
  console.log("=".repeat(60) + "\n")
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
