/**
 * ============================================================
 * COMPREHENSIVE PERMISSION SYSTEM - Version 2
 * Dynamic RBAC for Payroll SaaS Platform
 * ============================================================
 * 
 * This file defines all permissions available in the system.
 * Permissions are organized by category for easy management.
 * 
 * Permission Naming Convention:
 * - Format: <resource>.<action>
 * - Example: users.create, contracts.approve, invoices.mark_paid
 * 
 * Permission Categories:
 * - user_management: User and profile operations
 * - role_management: Role and permission operations
 * - organization_management: Organization operations
 * - team_management: Team and hierarchy operations
 * - contract_management: Contract lifecycle operations
 * - invoice_management: Invoice operations
 * - timesheet_management: Timesheet operations
 * - payment_management: Payment operations
 * - financial_management: Banking and financial operations
 * - task_management: Task operations
 * - lead_management: Lead and CRM operations
 * - onboarding_management: Onboarding operations
 * - document_management: Document operations
 * - system_settings: System configuration
 * - audit_compliance: Audit and compliance
 * - tenant_admin: Tenant administration
 * - super_admin: Platform administration
 */

export const PERMISSION_TREE = {
  // ==========================================================
  // USER MANAGEMENT
  // ==========================================================
  users: {
    view: "users.view",
    viewAll: "users.view_all",
    viewOwn: "users.view_own",
    create: "users.create",
    invite: "users.invite",
    update: "users.update",
    updateOwn: "users.update_own",
    delete: "users.delete",
    activate: "users.activate",
    deactivate: "users.deactivate",
    resetPassword: "users.reset_password",
    changePassword: "users.change_password",
    
    profile: {
      view: "users.profile.view",
      viewAll: "users.profile.view_all",
      viewOwn: "users.profile.view_own",
      update: "users.profile.update",
      updateOwn: "users.profile.update_own",
      uploadPhoto: "users.profile.upload_photo",
    },
    
    roles: {
      view: "users.roles.view",
      assign: "users.roles.assign",
      revoke: "users.roles.revoke",
    },
  },

  // ==========================================================
  // ROLE & PERMISSION MANAGEMENT
  // ==========================================================
  roles: {
    view: "roles.view",
    create: "roles.create",
    update: "roles.update",
    delete: "roles.delete",
    
    permissions: {
      view: "roles.permissions.view",
      grant: "roles.permissions.grant",
      revoke: "roles.permissions.revoke",
    },
  },

  permissions: {
    view: "permissions.view",
    viewAll: "permissions.view_all",
    
    audit: {
      view: "permissions.audit.view",
      export: "permissions.audit.export",
    },
  },

  // ==========================================================
  // ORGANIZATION MANAGEMENT
  // ==========================================================
  organizations: {
    view: "organizations.view",
    viewAll: "organizations.view_all",
    viewOwn: "organizations.view_own",
    create: "organizations.create",
    update: "organizations.update",
    delete: "organizations.delete",
    activate: "organizations.activate",
    deactivate: "organizations.deactivate",
    
    members: {
      view: "organizations.members.view",
      add: "organizations.members.add",
      remove: "organizations.members.remove",
      updateRole: "organizations.members.update_role",
    },
    
    settings: {
      view: "organizations.settings.view",
      update: "organizations.settings.update",
    },
  },

  // ==========================================================
  // TEAM MANAGEMENT
  // ==========================================================
  teams: {
    view: "teams.view",
    viewAll: "teams.view_all",
    viewOwn: "teams.view_own",
    create: "teams.create",
    update: "teams.update",
    delete: "teams.delete",
    
    members: {
      view: "teams.members.view",
      add: "teams.members.add",
      remove: "teams.members.remove",
      updateRole: "teams.members.update_role",
    },
    
    hierarchy: {
      view: "teams.hierarchy.view",
      manage: "teams.hierarchy.manage",
    },
  },

  // ==========================================================
  // CONTRACT MANAGEMENT
  // ==========================================================
  contracts: {
    view: "contracts.view",
    viewAll: "contracts.view_all",
    viewOwn: "contracts.view_own",
    viewTeam: "contracts.view_team",
    create: "contracts.create",
    update: "contracts.update",
    delete: "contracts.delete",
    
    workflow: {
      submit: "contracts.workflow.submit",
      approve: "contracts.workflow.approve",
      reject: "contracts.workflow.reject",
      requestChanges: "contracts.workflow.request_changes",
      activate: "contracts.workflow.activate",
      pause: "contracts.workflow.pause",
      resume: "contracts.workflow.resume",
      terminate: "contracts.workflow.terminate",
      renew: "contracts.workflow.renew",
    },
    
    signatures: {
      view: "contracts.signatures.view",
      request: "contracts.signatures.request",
      sign: "contracts.signatures.sign",
      signOwn: "contracts.signatures.sign_own",
    },
    
    documents: {
      view: "contracts.documents.view",
      upload: "contracts.documents.upload",
      download: "contracts.documents.download",
      delete: "contracts.documents.delete",
    },
    
    financial: {
      viewTerms: "contracts.financial.view_terms",
      editTerms: "contracts.financial.edit_terms",
      viewMargins: "contracts.financial.view_margins",
      editMargins: "contracts.financial.edit_margins",
    },
    
    history: {
      view: "contracts.history.view",
    },
    
    notifications: {
      send: "contracts.notifications.send",
    },
    
    export: "contracts.export",
    generateReference: "contracts.generate_reference",
  },

  // ==========================================================
  // INVOICE MANAGEMENT
  // ==========================================================
  invoices: {
    view: "invoices.view",
    viewAll: "invoices.view_all",
    viewOwn: "invoices.view_own",
    create: "invoices.create",
    update: "invoices.update",
    delete: "invoices.delete",
    
    workflow: {
      submit: "invoices.workflow.submit",
      send: "invoices.workflow.send",
      approve: "invoices.workflow.approve",
      reject: "invoices.workflow.reject",
      cancel: "invoices.workflow.cancel",
    },
    
    payment: {
      viewStatus: "invoices.payment.view_status",
      markPaid: "invoices.payment.mark_paid",
      markOverdue: "invoices.payment.mark_overdue",
      recordPayment: "invoices.payment.record_payment",
    },
    
    lineItems: {
      add: "invoices.line_items.add",
      update: "invoices.line_items.update",
      delete: "invoices.line_items.delete",
    },
    
    export: "invoices.export",
    generatePDF: "invoices.generate_pdf",
    duplicate: "invoices.duplicate",
  },

  // ==========================================================
  // TIMESHEET MANAGEMENT
  // ==========================================================
  timesheets: {
    view: "timesheets.view",
    viewAll: "timesheets.view_all",
    viewOwn: "timesheets.view_own",
    viewTeam: "timesheets.view_team",
    create: "timesheets.create",
    createOwn: "timesheets.create_own",
    update: "timesheets.update",
    updateOwn: "timesheets.update_own",
    delete: "timesheets.delete",
    deleteOwn: "timesheets.delete_own",
    
    workflow: {
      submit: "timesheets.workflow.submit",
      submitOwn: "timesheets.workflow.submit_own",
      approve: "timesheets.workflow.approve",
      reject: "timesheets.workflow.reject",
      requestChanges: "timesheets.workflow.request_changes",
    },
    
    entries: {
      add: "timesheets.entries.add",
      update: "timesheets.entries.update",
      delete: "timesheets.entries.delete",
    },
    
    export: "timesheets.export",
    generateReport: "timesheets.generate_report",
  },

  // ==========================================================
  // PAYMENT MANAGEMENT
  // ==========================================================
  payments: {
    view: "payments.view",
    viewAll: "payments.view_all",
    viewOwn: "payments.view_own",
    create: "payments.create",
    update: "payments.update",
    delete: "payments.delete",
    
    process: {
      initiate: "payments.process.initiate",
      approve: "payments.process.approve",
      execute: "payments.process.execute",
      cancel: "payments.process.cancel",
      retry: "payments.process.retry",
    },
    
    schedule: {
      create: "payments.schedule.create",
      update: "payments.schedule.update",
      cancel: "payments.schedule.cancel",
    },
    
    batch: {
      create: "payments.batch.create",
      process: "payments.batch.process",
      approve: "payments.batch.approve",
    },
    
    export: "payments.export",
    reconcile: "payments.reconcile",
  },

  // ==========================================================
  // FINANCIAL MANAGEMENT
  // ==========================================================
  banks: {
    view: "banks.view",
    create: "banks.create",
    update: "banks.update",
    delete: "banks.delete",
    setDefault: "banks.set_default",
    
    accounts: {
      viewDetails: "banks.accounts.view_details",
      verify: "banks.accounts.verify",
    },
  },

  currencies: {
    view: "currencies.view",
    manage: "currencies.manage",
  },

  financial: {
    reports: {
      view: "financial.reports.view",
      generate: "financial.reports.generate",
      export: "financial.reports.export",
    },
    
    analytics: {
      view: "financial.analytics.view",
      viewRevenue: "financial.analytics.view_revenue",
      viewExpenses: "financial.analytics.view_expenses",
      viewProfit: "financial.analytics.view_profit",
    },
  },

  // ==========================================================
  // TASK MANAGEMENT
  // ==========================================================
  tasks: {
    view: "tasks.view",
    viewAll: "tasks.view_all",
    viewOwn: "tasks.view_own",
    viewAssigned: "tasks.view_assigned",
    create: "tasks.create",
    update: "tasks.update",
    updateOwn: "tasks.update_own",
    delete: "tasks.delete",
    deleteOwn: "tasks.delete_own",
    
    assign: {
      toAny: "tasks.assign.to_any",
      toTeam: "tasks.assign.to_team",
    },
    
    workflow: {
      complete: "tasks.workflow.complete",
      reopen: "tasks.workflow.reopen",
      cancel: "tasks.workflow.cancel",
    },
    
    priority: {
      set: "tasks.priority.set",
      escalate: "tasks.priority.escalate",
    },
  },

  // ==========================================================
  // LEAD MANAGEMENT (CRM)
  // ==========================================================
  leads: {
    view: "leads.view",
    viewAll: "leads.view_all",
    viewOwn: "leads.view_own",
    create: "leads.create",
    update: "leads.update",
    updateOwn: "leads.update_own",
    delete: "leads.delete",
    
    workflow: {
      qualify: "leads.workflow.qualify",
      convert: "leads.workflow.convert",
      markLost: "leads.workflow.mark_lost",
      reassign: "leads.workflow.reassign",
    },
    
    notes: {
      add: "leads.notes.add",
      view: "leads.notes.view",
      update: "leads.notes.update",
      delete: "leads.notes.delete",
    },
    
    activities: {
      log: "leads.activities.log",
      view: "leads.activities.view",
    },
    
    export: "leads.export",
  },

  // ==========================================================
  // ONBOARDING MANAGEMENT
  // ==========================================================
  onboarding: {
    templates: {
      view: "onboarding.templates.view",
      create: "onboarding.templates.create",
      update: "onboarding.templates.update",
      delete: "onboarding.templates.delete",
      activate: "onboarding.templates.activate",
      deactivate: "onboarding.templates.deactivate",
    },
    
    questions: {
      add: "onboarding.questions.add",
      update: "onboarding.questions.update",
      delete: "onboarding.questions.delete",
      reorder: "onboarding.questions.reorder",
    },
    
    responses: {
      view: "onboarding.responses.view",
      viewAll: "onboarding.responses.view_all",
      viewOwn: "onboarding.responses.view_own",
      submit: "onboarding.responses.submit",
      submitOwn: "onboarding.responses.submit_own",
      review: "onboarding.responses.review",
      approve: "onboarding.responses.approve",
      reject: "onboarding.responses.reject",
      requestChanges: "onboarding.responses.request_changes",
    },
    
    progress: {
      view: "onboarding.progress.view",
      track: "onboarding.progress.track",
    },
  },

  // ==========================================================
  // DOCUMENT MANAGEMENT
  // ==========================================================
  documents: {
    view: "documents.view",
    viewAll: "documents.view_all",
    viewOwn: "documents.view_own",
    upload: "documents.upload",
    download: "documents.download",
    delete: "documents.delete",
    
    types: {
      view: "documents.types.view",
      create: "documents.types.create",
      update: "documents.types.update",
      delete: "documents.types.delete",
    },
    
    sharing: {
      share: "documents.sharing.share",
      unshare: "documents.sharing.unshare",
      setPermissions: "documents.sharing.set_permissions",
    },
  },

  // ==========================================================
  // REPORTING & ANALYTICS
  // ==========================================================
  reports: {
    view: "reports.view",
    generate: "reports.generate",
    schedule: "reports.schedule",
    export: "reports.export",
    
    types: {
      payroll: "reports.types.payroll",
      contracts: "reports.types.contracts",
      invoices: "reports.types.invoices",
      timesheets: "reports.types.timesheets",
      payments: "reports.types.payments",
      compliance: "reports.types.compliance",
      custom: "reports.types.custom",
    },
  },

  analytics: {
    view: "analytics.view",
    viewDashboard: "analytics.view_dashboard",
    
    workforce: {
      view: "analytics.workforce.view",
      export: "analytics.workforce.export",
    },
    
    financial: {
      view: "analytics.financial.view",
      export: "analytics.financial.export",
    },
    
    operations: {
      view: "analytics.operations.view",
      export: "analytics.operations.export",
    },
  },

  // ==========================================================
  // NOTIFICATIONS & COMMUNICATION
  // ==========================================================
  notifications: {
    view: "notifications.view",
    viewOwn: "notifications.view_own",
    send: "notifications.send",
    markRead: "notifications.mark_read",
    
    preferences: {
      view: "notifications.preferences.view",
      viewOwn: "notifications.preferences.view_own",
      update: "notifications.preferences.update",
      updateOwn: "notifications.preferences.update_own",
    },
    
    templates: {
      view: "notifications.templates.view",
      create: "notifications.templates.create",
      update: "notifications.templates.update",
      delete: "notifications.templates.delete",
    },
  },

  // ==========================================================
  // WEBHOOKS
  // ==========================================================
  webhooks: {
    view: "webhooks.view",
    create: "webhooks.create",
    update: "webhooks.update",
    delete: "webhooks.delete",
    test: "webhooks.test",
    
    logs: {
      view: "webhooks.logs.view",
      retry: "webhooks.logs.retry",
    },
  },

  // ==========================================================
  // SYSTEM SETTINGS
  // ==========================================================
  settings: {
    view: "settings.view",
    update: "settings.update",
    
    general: {
      view: "settings.general.view",
      update: "settings.general.update",
    },
    
    security: {
      view: "settings.security.view",
      update: "settings.security.update",
    },
    
    integrations: {
      view: "settings.integrations.view",
      configure: "settings.integrations.configure",
      enable: "settings.integrations.enable",
      disable: "settings.integrations.disable",
    },
    
    apiKeys: {
      view: "settings.api_keys.view",
      create: "settings.api_keys.create",
      revoke: "settings.api_keys.revoke",
    },
  },

  // ==========================================================
  // AUDIT & COMPLIANCE
  // ==========================================================
  audit: {
    logs: {
      view: "audit.logs.view",
      viewAll: "audit.logs.view_all",
      viewOwn: "audit.logs.view_own",
      export: "audit.logs.export",
    },
    
    compliance: {
      view: "audit.compliance.view",
      generateReports: "audit.compliance.generate_reports",
      export: "audit.compliance.export",
    },
  },

  // ==========================================================
  // TENANT ADMINISTRATION
  // ==========================================================
  tenant: {
    view: "tenant.view",
    update: "tenant.update",
    
    branding: {
      view: "tenant.branding.view",
      update: "tenant.branding.update",
    },
    
    billing: {
      view: "tenant.billing.view",
      update: "tenant.billing.update",
      viewInvoices: "tenant.billing.view_invoices",
      manageSubscription: "tenant.billing.manage_subscription",
    },
    
    users: {
      invite: "tenant.users.invite",
      manage: "tenant.users.manage",
    },
    
    settings: {
      view: "tenant.settings.view",
      update: "tenant.settings.update",
    },
  },

  // ==========================================================
  // SUPER ADMIN (Platform Level)
  // ==========================================================
  superadmin: {
    dashboard: {
      view: "superadmin.dashboard.view",
    },
    
    tenants: {
      view: "superadmin.tenants.view",
      create: "superadmin.tenants.create",
      update: "superadmin.tenants.update",
      suspend: "superadmin.tenants.suspend",
      activate: "superadmin.tenants.activate",
      delete: "superadmin.tenants.delete",
    },
    
    users: {
      view: "superadmin.users.view",
      create: "superadmin.users.create",
      update: "superadmin.users.update",
      delete: "superadmin.users.delete",
      impersonate: "superadmin.users.impersonate",
    },
    
    system: {
      viewLogs: "superadmin.system.view_logs",
      manageConfig: "superadmin.system.manage_config",
      runMaintenance: "superadmin.system.run_maintenance",
    },
    
    analytics: {
      viewPlatform: "superadmin.analytics.view_platform",
      viewUsage: "superadmin.analytics.view_usage",
      viewRevenue: "superadmin.analytics.view_revenue",
    },
  },
} as const;

// ==========================================================
// PERMISSION EXTRACTION UTILITIES
// ==========================================================

/**
 * Extract all permission keys from the permission tree
 */
export function extractAllPermissions(tree: any, prefix = ""): string[] {
  const result: string[] = [];

  if (typeof tree === "string") {
    result.push(tree);
    return result;
  }

  if (typeof tree === "object") {
    for (const key in tree) {
      result.push(...extractAllPermissions(tree[key], prefix ? `${prefix}.${key}` : key));
    }
  }

  return result;
}

/**
 * Get all permissions in the system
 */
export const ALL_PERMISSIONS = extractAllPermissions(PERMISSION_TREE);

/**
 * Extract permissions by category
 */
export function extractPermissionsByCategory(category: keyof typeof PERMISSION_TREE): string[] {
  return extractAllPermissions(PERMISSION_TREE[category]);
}

// ==========================================================
// PREDEFINED PERMISSION SETS
// ==========================================================

/**
 * Super Admin - Full platform access
 */
export const SUPERADMIN_PERMISSIONS = extractAllPermissions(PERMISSION_TREE.superadmin);

/**
 * Tenant Admin - Full tenant access
 */
export const TENANT_ADMIN_PERMISSIONS = ALL_PERMISSIONS.filter(
  p => !p.startsWith("superadmin.")
);

/**
 * Finance Manager - Financial operations
 */
export const FINANCE_MANAGER_PERMISSIONS = [
  ...extractPermissionsByCategory("invoices"),
  ...extractPermissionsByCategory("payments"),
  ...extractPermissionsByCategory("banks"),
  ...extractPermissionsByCategory("financial"),
  "contracts.view",
  "contracts.viewAll",
  "contracts.financial.viewTerms",
  "contracts.financial.viewMargins",
  "reports.view",
  "reports.generate",
  "reports.types.invoices",
  "reports.types.payments",
  "reports.types.payroll",
  "analytics.financial.view",
  "analytics.financial.export",
];

/**
 * HR Manager - People operations
 */
export const HR_MANAGER_PERMISSIONS = [
  ...extractPermissionsByCategory("users"),
  ...extractPermissionsByCategory("organizations"),
  ...extractPermissionsByCategory("teams"),
  ...extractPermissionsByCategory("onboarding"),
  "contracts.view",
  "contracts.viewAll",
  "contracts.create",
  "contracts.update",
  "tasks.view",
  "tasks.viewAll",
  "tasks.create",
  "tasks.assign.toAny",
  "reports.view",
  "reports.types.contracts",
  "analytics.workforce.view",
];

/**
 * Operations Manager - Daily operations
 */
export const OPERATIONS_MANAGER_PERMISSIONS = [
  ...extractPermissionsByCategory("contracts"),
  ...extractPermissionsByCategory("timesheets"),
  ...extractPermissionsByCategory("tasks"),
  "users.view",
  "users.viewAll",
  "organizations.view",
  "organizations.viewAll",
  "invoices.view",
  "invoices.viewAll",
  "payments.view",
  "payments.viewAll",
  "reports.view",
  "reports.generate",
  "analytics.operations.view",
];

/**
 * Contractor/Worker - Limited self-service
 */
export const CONTRACTOR_PERMISSIONS = [
  "users.viewOwn",
  "users.updateOwn",
  "users.profile.viewOwn",
  "users.profile.updateOwn",
  "contracts.viewOwn",
  "contracts.documents.view",
  "contracts.documents.download",
  "contracts.signatures.signOwn",
  "invoices.viewOwn",
  "timesheets.viewOwn",
  "timesheets.createOwn",
  "timesheets.updateOwn",
  "timesheets.workflow.submitOwn",
  "payments.viewOwn",
  "tasks.viewOwn",
  "tasks.viewAssigned",
  "tasks.updateOwn",
  "tasks.workflow.complete",
  "onboarding.responses.viewOwn",
  "onboarding.responses.submitOwn",
  "documents.viewOwn",
  "documents.upload",
  "documents.download",
  "notifications.viewOwn",
  "notifications.preferences.viewOwn",
  "notifications.preferences.updateOwn",
];

/**
 * Accountant - Financial operations with limited access
 */
export const ACCOUNTANT_PERMISSIONS = [
  "invoices.view",
  "invoices.viewAll",
  "invoices.create",
  "invoices.update",
  "invoices.workflow.send",
  "invoices.payment.viewStatus",
  "invoices.payment.recordPayment",
  "invoices.export",
  "payments.view",
  "payments.viewAll",
  "payments.reconcile",
  "payments.export",
  "contracts.view",
  "contracts.viewAll",
  "contracts.financial.viewTerms",
  "banks.view",
  "financial.reports.view",
  "financial.reports.generate",
  "reports.view",
  "reports.types.invoices",
  "reports.types.payments",
];

/**
 * Team Lead - Team management
 */
export const TEAM_LEAD_PERMISSIONS = [
  "users.view",
  "users.profile.view",
  "teams.viewOwn",
  "teams.members.view",
  "contracts.viewTeam",
  "timesheets.viewTeam",
  "timesheets.workflow.approve",
  "timesheets.workflow.reject",
  "tasks.viewAll",
  "tasks.create",
  "tasks.assign.toTeam",
  "tasks.priority.set",
  "reports.view",
  "analytics.view",
];

/**
 * Viewer/Read-Only - View-only access
 */
export const VIEWER_PERMISSIONS = ALL_PERMISSIONS.filter(
  p => p.includes(".view") || p.includes(".viewAll") || p.includes(".viewOwn")
);

// ==========================================================
// PERMISSION CATEGORIES
// ==========================================================

export const PERMISSION_CATEGORIES = {
  user_management: "User Management",
  role_management: "Role & Permission Management",
  organization_management: "Organization Management",
  team_management: "Team Management",
  contract_management: "Contract Management",
  invoice_management: "Invoice Management",
  timesheet_management: "Timesheet Management",
  payment_management: "Payment Management",
  financial_management: "Financial Management",
  task_management: "Task Management",
  lead_management: "Lead Management",
  onboarding_management: "Onboarding Management",
  document_management: "Document Management",
  reporting_analytics: "Reporting & Analytics",
  notifications: "Notifications & Communication",
  webhooks: "Webhooks",
  system_settings: "System Settings",
  audit_compliance: "Audit & Compliance",
  tenant_admin: "Tenant Administration",
  super_admin: "Super Admin",
} as const;

/**
 * Get category for a permission
 */
export function getPermissionCategory(permission: string): string {
  const parts = permission.split(".");
  const topLevel = parts[0];

  // Map to category
  const categoryMap: Record<string, keyof typeof PERMISSION_CATEGORIES> = {
    users: "user_management",
    roles: "role_management",
    permissions: "role_management",
    organizations: "organization_management",
    teams: "team_management",
    contracts: "contract_management",
    invoices: "invoice_management",
    timesheets: "timesheet_management",
    payments: "payment_management",
    banks: "financial_management",
    currencies: "financial_management",
    financial: "financial_management",
    tasks: "task_management",
    leads: "lead_management",
    onboarding: "onboarding_management",
    documents: "document_management",
    reports: "reporting_analytics",
    analytics: "reporting_analytics",
    notifications: "notifications",
    webhooks: "webhooks",
    settings: "system_settings",
    audit: "audit_compliance",
    tenant: "tenant_admin",
    superadmin: "super_admin",
  };

  return PERMISSION_CATEGORIES[categoryMap[topLevel] || "system_settings"];
}

/**
 * Get all permissions grouped by category
 */
export function getAllPermissionsGroupedByCategory(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const permission of ALL_PERMISSIONS) {
    const category = getPermissionCategory(permission);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  }

  return grouped;
}

// ==========================================================
// PERMISSION HELPERS
// ==========================================================

/**
 * Check if a permission exists
 */
export function permissionExists(permission: string): boolean {
  return ALL_PERMISSIONS.includes(permission);
}

/**
 * Get display name for permission
 */
export function getPermissionDisplayName(permission: string): string {
  return permission
    .split(".")
    .map(part => part.replace(/_/g, " "))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" - ");
}

/**
 * Get permission description
 */
export function getPermissionDescription(permission: string): string {
  const parts = permission.split(".");
  const action = parts[parts.length - 1];
  const resource = parts.slice(0, -1).join(" ");

  return `${action.replace(/_/g, " ").charAt(0).toUpperCase() + action.slice(1)} ${resource}`;
}
