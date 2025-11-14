// src/server/rbac/permissions.ts

/**
 * Permissions structurées par ressource
 * Style "DEEL", simple à maintenir
 */

export const PERMISSIONS = {
  USERS_CREATE: "users.create",
  USERS_VIEW: "users.view",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  AGENCIES_CREATE: "agencies.create",
  AGENCIES_VIEW: "agencies.view",
  AGENCIES_UPDATE: "agencies.update",
  AGENCIES_DELETE: "agencies.delete",

  CONTRACTORS_CREATE: "contractors.create",
  CONTRACTORS_VIEW: "contractors.view",
  CONTRACTORS_UPDATE: "contractors.update",
  CONTRACTORS_DELETE: "contractors.delete",

  PAYROLL_CREATE: "payroll_partners.create",
  PAYROLL_VIEW: "payroll_partners.view",
  PAYROLL_UPDATE: "payroll_partners.update",
  PAYROLL_DELETE: "payroll_partners.delete",

  CONTRACTS_CREATE: "contracts.create",
  CONTRACTS_VIEW: "contracts.view",
  CONTRACTS_UPDATE: "contracts.update",
  CONTRACTS_DELETE: "contracts.delete",

  INVOICES_CREATE: "invoices.create",
  INVOICES_VIEW: "invoices.view",
  INVOICES_UPDATE: "invoices.update",
  INVOICES_DELETE: "invoices.delete",

  SYSTEM_SETTINGS: "system.settings",
  TENANT_SETTINGS: "tenant.settings",
} as const

// 🔐 Type automatique basé sur l'objet ci-dessus
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
