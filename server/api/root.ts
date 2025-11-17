
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
import { permissionRouter } from "./routers/permission"
import { documentTypeRouter } from "./routers/documentType"
import { taskRouter } from "./routers/task"
import { onboardingRouter } from "./routers/onboarding"
import { payslipRouter } from "./routers/payslip"
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";
import { analyticsRouter } from "./routers/analytics";
import { webhookRouter } from "./routers/webhook";
import { permissionAuditRouter } from "./routers/admin/permissionAudit";

// PHASE 2 ROUTERS
import { paymentRouter } from "./routers/payment";
import { paymentMethodRouter } from "./routers/paymentMethod";
import { expenseRouter } from "./routers/expense";
import { timesheetRouter } from "./routers/timesheet";
import { approvalWorkflowRouter } from "./routers/approvalWorkflow";
import { documentRouter } from "./routers/document";
import { commentRouter } from "./routers/comment";
import { tagRouter } from "./routers/tag";
import { customFieldRouter } from "./routers/customField";
import { userActivityRouter } from "./routers/userActivity";
import { apiKeyRouter } from "./routers/apiKey";
import { remittanceRouter } from "./routers/remittance";
import { referralRouter } from "./routers/referral";

// PHASE 3 ROUTERS - UI Enhancement
import { emailTemplateRouter } from "./routers/emailTemplate";
import { pdfTemplateRouter } from "./routers/pdfTemplate";
import { emailLogRouter } from "./routers/emailLog";
import { smsLogRouter } from "./routers/smsLog";


/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  agency: agencyRouter,
  auth: authRouter,
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
  permission: permissionRouter,
  documentType: documentTypeRouter,
  task: taskRouter,
  onboarding: onboardingRouter,
  payslip: payslipRouter,
  dashboard: dashboardRouter,
  analytics: analyticsRouter,
  webhook: webhookRouter,
  permissionAudit: permissionAuditRouter,
  
  // PHASE 2 ROUTERS
  payment: paymentRouter,
  paymentMethod: paymentMethodRouter,
  expense: expenseRouter,
  timesheet: timesheetRouter,
  approvalWorkflow: approvalWorkflowRouter,
  document: documentRouter,
  comment: commentRouter,
  tag: tagRouter,
  customField: customFieldRouter,
  userActivity: userActivityRouter,
  apiKey: apiKeyRouter,
  remittance: remittanceRouter,
  referral: referralRouter,
  
  // PHASE 3 ROUTERS
  emailTemplate: emailTemplateRouter,
  pdfTemplate: pdfTemplateRouter,
  emailLog: emailLogRouter,
  smsLog: smsLogRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
