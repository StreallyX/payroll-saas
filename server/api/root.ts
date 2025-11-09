
import { createTRPCRouter } from "./trpc"
import { userRouter } from "./routers/user"
import { agencyRouter } from "./routers/agency"
import { contractorRouter } from "./routers/contractor"
import { payrollRouter } from "./routers/payroll"
import { contractRouter } from "./routers/contract"
import { invoiceRouter } from "./routers/invoice"
import { tenantRouter } from "./routers/tenant"
import { auditLogRouter } from "./routers/auditLog"
import { leadRouter } from "./routers/lead"
import { companyRouter } from "./routers/company"
import { bankRouter } from "./routers/bank"
import { currencyRouter } from "./routers/currency"
import { countryRouter } from "./routers/country"
import { roleRouter } from "./routers/role"
import { documentTypeRouter } from "./routers/documentType"
import { taskRouter } from "./routers/task"
import { onboardingRouter } from "./routers/onboarding"
import { payslipRouter } from "./routers/payslip"

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  agency: agencyRouter,
  contractor: contractorRouter,
  payroll: payrollRouter,
  contract: contractRouter,
  invoice: invoiceRouter,
  tenant: tenantRouter,
  auditLog: auditLogRouter,
  lead: leadRouter,
  company: companyRouter,
  bank: bankRouter,
  currency: currencyRouter,
  country: countryRouter,
  role: roleRouter,
  documentType: documentTypeRouter,
  task: taskRouter,
  onboarding: onboardingRouter,
  payslip: payslipRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
