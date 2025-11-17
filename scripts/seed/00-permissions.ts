// /seed/00-permissions.ts
import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

// 📌 MASTER LIST OF ALL PERMISSIONS
export const PERMISSIONS = [
  // --- TENANT ---
  "tenant.view",
  "tenant.update",
  "tenant.branding.update",
  "tenant.billing.view",
  "tenant.billing.update",
  "tenant.roles.view",
  "tenant.roles.create",
  "tenant.roles.update",
  "tenant.roles.delete",
  "tenant.users.invite",
  "tenant.users.view",
  "tenant.users.update",
  "tenant.users.disable",
  "tenant.users.delete",
  "tenant.users.create",

  // --- AGENCIES ---
  "agencies.view",
  "agencies.create",
  "agencies.update",
  "agencies.delete",
  "agencies.assign_contractor",
  "agencies.manage_team",
  "agencies.notes.add",
  "agencies.notes.view",

  // --- COMPANIES ---
  "companies.view",
  "companies.create",
  "companies.update",
  "companies.delete",

  // --- CONTRACTORS ---
  "contractors.view",
  "contractors.create",
  "contractors.update",
  "contractors.delete",
  "contractors.assign_to_agency",
  "contractors.change_status",

  "contractors.documents.upload",
  "contractors.documents.view",
  "contractors.documents.delete",

  "contractors.onboarding.start",
  "contractors.onboarding.update",
  "contractors.onboarding.review",
  "contractors.onboarding.validate",

  // --- CONTRACTS ---
  "contracts.view",
  "contracts.create",
  "contracts.update",
  "contracts.delete",

  "contracts.send",
  "contracts.approve",
  "contracts.reject",

  "contracts.upload_pdf",
  "contracts.download_pdf",
  "contracts.generate_reference",

  // --- INVOICES ---
  "invoices.view",
  "invoices.create",
  "invoices.update",
  "invoices.delete",
  "invoices.send",
  "invoices.mark_paid",
  "invoices.export",

  // --- PAYROLL ---
  "payroll.view",
  "payroll.create",
  "payroll.update",
  "payroll.delete",
  "payroll.generate",
  "payroll.send",
  "payroll.mark_paid",

  // --- PAYSLIP ---
  "payslip.view",
  "payslip.create",
  "payslip.update",
  "payslip.send",
  "payslip.mark_paid",
  "payslip.delete",
  "payslip.generate",

  // --- BANKS ---
  "banks.view",
  "banks.create",
  "banks.update",
  "banks.delete",

  // --- SETTINGS ---
  "settings.view",
  "settings.update",

  // --- ONBOARDING ---
  "onboarding.templates.view",
  "onboarding.templates.create",
  "onboarding.templates.update",
  "onboarding.templates.delete",

  "onboarding.questions.add",
  "onboarding.questions.update",
  "onboarding.questions.delete",

  "onboarding.responses.view",
  "onboarding.responses.view_own",
  "onboarding.responses.submit",
  "onboarding.responses.review",

  // --- TASKS ---
  "tasks.view",
  "tasks.create",
  "tasks.update",
  "tasks.delete",
  "tasks.assign",
  "tasks.complete",

  // --- LEADS ---
  "leads.view",
  "leads.create",
  "leads.update",
  "leads.delete",
  "leads.export",

  // --- AUDIT ---
  "audit_logs.view",
  "audit_logs.export",

  // --- TIMESHEETS ---
  "timesheet.view",
  "timesheet.create",
  "timesheet.update",
  "timesheet.delete",
  "timesheet.approve",
  "timesheet.submit",

  // --- EXPENSES ---
  "expense.view",
  "expense.create",
  "expense.update",
  "expense.delete",
  "expense.approve",
  "expense.submit",

  // --- REFERRALS ---
  "referrals.view",
  "referrals.create",
  "referrals.update",
  "referrals.delete",
  "referrals.track",

  // --- SUPERADMIN ---
  "superadmin.tenants.create",
  "superadmin.tenants.suspend",
  "superadmin.tenants.delete",
  "superadmin.users.create",
  "superadmin.users.update",
  "superadmin.users.delete",
]

export async function seedPermissions() {
  console.log("👉 Seeding permissions...")

  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: {
        key,
        description: key,
      },
    })
  }

  console.log(`✅ Permissions inserted: ${PERMISSIONS.length}`)
}
