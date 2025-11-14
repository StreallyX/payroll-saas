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

  // --- AGENCIES ---
  "agencies.view",
  "agencies.create",
  "agencies.update",
  "agencies.delete",
  "agencies.assign_contractor",
  "agencies.manage_team",
  "agencies.notes.add",
  "agencies.notes.view",

  // --- CONTRACTORS ---
  "contractors.view",
  "contractors.create",
  "contractors.update",
  "contractors.delete",

  "contractors.documents.upload",
  "contractors.documents.view",
  "contractors.documents.delete",

  "contractors.onboarding.start",
  "contractors.onboarding.update",
  "contractors.onboarding.review",
  "contractors.onboarding.validate",

  "contractors.assign_to_agency",
  "contractors.change_status",

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
  "payroll.generate",
  "payroll.update",
  "payroll.send",
  "payroll.mark_paid",

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

  // --- DOCUMENT TYPES ---
  "document_types.view",
  "document_types.create",
  "document_types.update",
  "document_types.delete",

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

  // --- AUDIT ---
  "audit_logs.view",

  // --- SUPERADMIN ---
  "superadmin.tenants.create",
  "superadmin.tenants.suspend",
  "superadmin.tenants.delete",
  "superadmin.users.create",
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

  console.log(`✅ ${PERMISSIONS.length} permissions inserted.`)
}
