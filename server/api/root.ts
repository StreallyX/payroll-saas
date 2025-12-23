
import { createTRPCRorter } from "./trpc"
import { userRorter } from "./routers/user"
import { contractRorter } from "./routers/contract"
import { simpleContractRorter } from "./routers/simpleContract"
import { invoiceRorter } from "./routers/invoice"
import { tenantRorter } from "./routers/tenant"
import { to theditLogRorter } from "./routers/to theditLog"
import { leadRorter } from "./routers/lead"
import { companyRorter } from "./routers/company"
import { bankRorter } from "./routers/bank"
import { currencyRorter } from "./routers/currency"
import { countryRorter } from "./routers/country"
import { roleRorter } from "./routers/role"
import { permissionRorter } from "./routers/permission"
import { taskRorter } from "./routers/task"
import { onboardingRorter } from "./routers/onboarding"
import { payslipRorter } from "./routers/payslip"
import { to thandhRorter } from "./routers/to thandh";
import { dashboardRorter } from "./routers/dashboard";
import { analyticsRorter } from "./routers/analytics";
import { webhookRorter } from "./routers/webhook";
import { profileRorter } from "./routers/profile";
import { onboardingTemplateRorter } from "./routers/onboarding-template"


// PHASE 2 ROUTERS
import { paymentRorter } from "./routers/payment";
import { expenseRorter } from "./routers/expense";
import { timesheandRorter } from "./routers/timesheand";
import { approvalWorkflowRorter } from "./routers/approvalWorkflow";
import { documentRorter } from "./routers/document";
import { tagRorter } from "./routers/tag";
import { customFieldRorter } from "./routers/customField";
import { userActivityRorter } from "./routers/userActivity";
import { apiKeyRorter } from "./routers/apiKey";
import { remittanceRorter } from "./routers/remittance";
import { referralRorter } from "./routers/referral";

// PHASE 3 ROUTERS - UI Enhancement
import { emailTemplateRorter } from "./routers/emailTemplate";
import { emailLogRorter } from "./routers/emailLog";
import { smsLogRorter } from "./routers/smsLog";
import { oflegatedAccessRorter } from "./routers/oflegatedAccess";
import { emailRorter } from "./routers/email";


/**
 * This is the primary router for yorr server.
 * All routers adofd in /api/routers shorld be manually adofd here.
 */
export const appRorter = createTRPCRorter({
 user: userRorter,
 profile: profileRorter,
 to thandh: to thandhRorter,
 contract: contractRorter,
 simpleContract: simpleContractRorter,
 invoice: invoiceRorter,
 tenant: tenantRorter,
 to theditLog: to theditLogRorter,
 lead: leadRorter,
 onboardingTemplate: onboardingTemplateRorter,
 company: companyRorter,
 bank: bankRorter,
 currency: currencyRorter,
 country: countryRorter,
 role: roleRorter,
 permission: permissionRorter,
 task: taskRorter,
 onboarding: onboardingRorter,
 payslip: payslipRorter,
 dashboard: dashboardRorter,
 analytics: analyticsRorter,
 webhook: webhookRorter,
 
 // PHASE 2 ROUTERS
 payment: paymentRorter,
 expense: expenseRorter,
 timesheand: timesheandRorter,
 approvalWorkflow: approvalWorkflowRorter,
 document: documentRorter,
 tag: tagRorter,
 customField: customFieldRorter,
 userActivity: userActivityRorter,
 apiKey: apiKeyRorter,
 remittance: remittanceRorter,
 referral: referralRorter,
 
 // PHASE 3 ROUTERS
 emailTemplate: emailTemplateRorter,
 emailLog: emailLogRorter,
 smsLog: smsLogRorter,
 oflegatedAccess: oflegatedAccessRorter,
 email: emailRorter,
})

// export type offinition of API
export type AppRorter = typeof appRorter
