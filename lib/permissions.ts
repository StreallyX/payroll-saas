
import { prisma } from "./db"

// Permission keys used throughout the application
export const PERMISSIONS = {
  // Users
  USERS_CREATE: "users.create",
  USERS_VIEW: "users.view",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // Agencies
  AGENCIES_CREATE: "agencies.create",
  AGENCIES_VIEW: "agencies.view",
  AGENCIES_UPDATE: "agencies.update",
  AGENCIES_DELETE: "agencies.delete",

  // Contractors
  CONTRACTORS_CREATE: "contractors.create",
  CONTRACTORS_VIEW: "contractors.view",
  CONTRACTORS_UPDATE: "contractors.update",
  CONTRACTORS_DELETE: "contractors.delete",

  // Payroll Partners
  PAYROLL_PARTNERS_CREATE: "payroll_partners.create",
  PAYROLL_PARTNERS_VIEW: "payroll_partners.view",
  PAYROLL_PARTNERS_UPDATE: "payroll_partners.update",
  PAYROLL_PARTNERS_DELETE: "payroll_partners.delete",

  // Contracts
  CONTRACTS_CREATE: "contracts.create",
  CONTRACTS_VIEW: "contracts.view",
  CONTRACTS_UPDATE: "contracts.update",
  CONTRACTS_DELETE: "contracts.delete",
  CONTRACTS_ASSIGN: "contracts.assign", // 🔥 NEW — Assign admin/approver to contracts

  // Invoices
  INVOICES_CREATE: "invoices.create",
  INVOICES_VIEW: "invoices.view",
  INVOICES_UPDATE: "invoices.update",
  INVOICES_DELETE: "invoices.delete",

  // Companies
  COMPANIES_CREATE: "companies.create",
  COMPANIES_VIEW: "companies.view",
  COMPANIES_UPDATE: "companies.update",
  COMPANIES_DELETE: "companies.delete",
  COMPANIES_MANAGE_TENANT: "companies.manage_tenant", // 🔥 NEW — Manage tenant companies

  // 🔥 NEW — Timesheet Workflow Permissions
  TIMESHEET_CREATE_OWN: "timesheet.create.own",
  TIMESHEET_READ_OWN: "timesheet.read.own",
  TIMESHEET_UPDATE_OWN: "timesheet.update.own",
  TIMESHEET_DELETE_OWN: "timesheet.delete.own",
  TIMESHEET_SUBMIT_OWN: "timesheet.submit.own",
  TIMESHEET_LIST_GLOBAL: "timesheet.list.global",
  TIMESHEET_VIEW_GLOBAL: "timesheet.view.global",
  TIMESHEET_REVIEW_GLOBAL: "timesheet.review.global",
  TIMESHEET_APPROVE_GLOBAL: "timesheet.approve.global",
  TIMESHEET_REJECT_GLOBAL: "timesheet.reject.global",
  TIMESHEET_MODIFY_GLOBAL: "timesheet.modify.global",

  // 🔥 NEW — Invoice Workflow Permissions
  INVOICE_CREATE_OWN: "invoice.create.own",
  INVOICE_READ_OWN: "invoice.read.own",
  INVOICE_UPDATE_OWN: "invoice.update.own",
  INVOICE_DELETE_OWN: "invoice.delete.own",
  INVOICE_SUBMIT_OWN: "invoice.submit.own",
  INVOICE_LIST_GLOBAL: "invoice.list.global",
  INVOICE_VIEW_GLOBAL: "invoice.view.global",
  INVOICE_REVIEW_GLOBAL: "invoice.review.global",
  INVOICE_APPROVE_GLOBAL: "invoice.approve.global",
  INVOICE_REJECT_GLOBAL: "invoice.reject.global",
  INVOICE_SEND_GLOBAL: "invoice.send.global",
  INVOICE_MARK_PAID_GLOBAL: "invoice.mark_paid.global",
  INVOICE_MODIFY_GLOBAL: "invoice.modify.global",

  // 🔥 NEW — Payment Workflow Permissions
  PAYMENT_CREATE_OWN: "payment.create.own",
  PAYMENT_VIEW_OWN: "payment.view.own",
  PAYMENT_LIST_GLOBAL: "payment.list.global",
  PAYMENT_VIEW_GLOBAL: "payment.view.global",
  PAYMENT_MARK_RECEIVED_GLOBAL: "payment.mark_received.global",
  PAYMENT_CONFIRM_GLOBAL: "payment.confirm.global",
  PAYMENT_PROCESS_GLOBAL: "payment.process.global",

  // 🔥 NEW — Payslip Workflow Permissions
  PAYSLIP_VIEW_OWN: "payslip.view.own",
  PAYSLIP_LIST_GLOBAL: "payslip.list.global",
  PAYSLIP_VIEW_GLOBAL: "payslip.view.global",
  PAYSLIP_GENERATE_GLOBAL: "payslip.generate.global",
  PAYSLIP_VALIDATE_GLOBAL: "payslip.validate.global",
  PAYSLIP_SEND_GLOBAL: "payslip.send.global",
  PAYSLIP_MARK_PAID_GLOBAL: "payslip.mark_paid.global",

  // 🔥 NEW — Remittance Workflow Permissions
  REMITTANCE_VIEW_OWN: "remittance.view.own",
  REMITTANCE_LIST_GLOBAL: "remittance.list.global",
  REMITTANCE_VIEW_GLOBAL: "remittance.view.global",
  REMITTANCE_GENERATE_GLOBAL: "remittance.generate.global",
  REMITTANCE_VALIDATE_GLOBAL: "remittance.validate.global",
  REMITTANCE_SEND_GLOBAL: "remittance.send.global",
  REMITTANCE_PROCESS_GLOBAL: "remittance.process.global",

  // System
  SYSTEM_SETTINGS: "system.settings",
  TENANT_SETTINGS: "tenant.settings",
}

// Check if user has specific permission
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!user) return false

    return user.role.rolePermissions.some(
      rp => rp.permission.key === permission
    )
  } catch (error) {
    console.error("Permission check error:", error)
    return false
  }
}

// Get all permissions for a user
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!user) return []

    return user.role.rolePermissions.map(rp => rp.permission.key)
  } catch (error) {
    console.error("Get permissions error:", error)
    return []
  }
}

// Multi-tenant helper to ensure tenantId filtering
export function withTenant<T>(tenantId: string, query: T): T & { tenantId: string } {
  return { ...query, tenantId }
}
