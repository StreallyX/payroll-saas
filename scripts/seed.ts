// seed.ts
import { seedPermissions } from "./seed/00-permissions"
import { seedDefaultRoles } from "./seed/01-roles"
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
  console.log("🌱 STARTING FULL DATABASE SEED\n")

  // ---------------------------
  // 1. SYSTEM-LEVEL SEED
  // ---------------------------
  await seedPermissions()
  await seedSuperAdmin()

  // ---------------------------
  // 2. TENANT
  // ---------------------------
  const tenantId = await seedTenant()

  // ---------------------------
  // 3. ROLES (Dynamic RBAC)
  // ---------------------------
  await seedDefaultRoles(tenantId)

  // ---------------------------
  // 4. USERS
  // ---------------------------
  await seedUsers(tenantId)

  // ---------------------------
  // 5. AGENCIES
  // ---------------------------
  const agencies = await seedSampleAgencies(tenantId)

  // ---------------------------
  // 6. COMPANIES
  // ---------------------------
  const companies = await seedSampleCompanies(tenantId)

  // ---------------------------
  // 7. PAYROLL PARTNERS
  // ---------------------------
  const payrollPartners = await seedSamplePayrollPartners(tenantId)

  // ---------------------------
  // 8. CONTRACTORS
  // ---------------------------
  const contractors = await seedSampleContractors(
    tenantId,
    agencies,
  )

  // ---------------------------
  // 9. CONTRACTS
  // ---------------------------
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
  await seedSampleInvoices(tenantId, contracts)

  // ---------------------------
  // 11. PAYSLIPS
  // ---------------------------
  await seedSamplePayslips(tenantId, contracts)

  // ---------------------------
  // 12. ONBOARDING
  // ---------------------------
  await seedSampleOnboarding(tenantId)

  // ---------------------------
  // 13. TASKS
  // ---------------------------
  await seedSampleTasks(tenantId)

  // ---------------------------
  // 14. LEADS
  // ---------------------------
  await seedSampleLeads(tenantId)

  console.log("\n🎉 SEED COMPLETE! Everything is ready to use.")
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
