
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
