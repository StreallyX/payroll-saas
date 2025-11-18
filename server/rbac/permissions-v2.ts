// =============================================================
// COMPREHENSIVE PERMISSIONS SYSTEM - DEEL-INSPIRED
// =============================================================
// This file defines ALL granular permissions for the dynamic
// RBAC system. Permissions are organized by resource/domain.
// =============================================================

export const PERMISSION_CATEGORIES = {
  TENANT: "tenant",
  USERS: "users",
  ROLES: "roles",
  ORGANIZATIONS: "organizations",
  CONTRACTS: "contracts",
  INVOICES: "invoices",
  TIMESHEETS: "timesheets",
  PAYMENTS: "payments",
  PAYSLIPS: "payslips",
  BANKS: "banks",
  LEADS: "leads",
  TASKS: "tasks",
  ONBOARDING: "onboarding",
  DOCUMENTS: "documents",
  AUDIT: "audit",
  SETTINGS: "settings",
  REPORTS: "reports",
  NOTIFICATIONS: "notifications",
  WEBHOOKS: "webhooks",
  SUPERADMIN: "superadmin",
} as const;

// =============================================================
// PERMISSION TREE - Hierarchical Structure
// =============================================================
export const PERMISSION_TREE = {
  // =========== TENANT MANAGEMENT ===========
  tenant: {
    view: "tenant.view",
    update: "tenant.update",
    delete: "tenant.delete",
    
    branding: {
      view: "tenant.branding.view",
      update: "tenant.branding.update",
    },
    
    billing: {
      view: "tenant.billing.view",
      update: "tenant.billing.update",
      viewInvoices: "tenant.billing.view_invoices",
      changePlan: "tenant.billing.change_plan",
    },
    
    settings: {
      view: "tenant.settings.view",
      update: "tenant.settings.update",
    },
  },

  // =========== USER MANAGEMENT ===========
  users: {
    view: "users.view",
    viewAll: "users.view_all",
    viewOwn: "users.view_own",
    create: "users.create",
    update: "users.update",
    updateOwn: "users.update_own",
    delete: "users.delete",
    invite: "users.invite",
    activate: "users.activate",
    deactivate: "users.deactivate",
    resetPassword: "users.reset_password",
    impersonate: "users.impersonate",
    
    profile: {
      view: "users.profile.view",
      viewOwn: "users.profile.view_own",
      update: "users.profile.update",
      updateOwn: "users.profile.update_own",
    },
    
    roles: {
      view: "users.roles.view",
      assign: "users.roles.assign",
      remove: "users.roles.remove",
    },
    
    permissions: {
      view: "users.permissions.view",
    },
  },

  // =========== ROLE & PERMISSION MANAGEMENT ===========
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

  // =========== ORGANIZATION MANAGEMENT ===========
  organizations: {
    view: "organizations.view",
    viewAll: "organizations.view_all",
    viewOwn: "organizations.view_own",
    create: "organizations.create",
    update: "organizations.update",
    delete: "organizations.delete",
    
    members: {
      view: "organizations.members.view",
      add: "organizations.members.add",
      remove: "organizations.members.remove",
      updateRelationship: "organizations.members.update_relationship",
    },
    
    types: {
      viewClients: "organizations.types.view_clients",
      viewAgencies: "organizations.types.view_agencies",
      viewPayrollPartners: "organizations.types.view_payroll_partners",
      viewInternal: "organizations.types.view_internal",
    },
  },

  // =========== CONTRACT MANAGEMENT ===========
  contracts: {
    view: "contracts.view",
    viewAll: "contracts.view_all",
    viewOwn: "contracts.view_own",
    viewAssigned: "contracts.view_assigned",
    create: "contracts.create",
    update: "contracts.update",
    updateOwn: "contracts.update_own",
    delete: "contracts.delete",
    
    status: {
      draft: "contracts.status.draft",
      activate: "contracts.status.activate",
      pause: "contracts.status.pause",
      complete: "contracts.status.complete",
      terminate: "contracts.status.terminate",
      cancel: "contracts.status.cancel",
    },
    
    documents: {
      view: "contracts.documents.view",
      upload: "contracts.documents.upload",
      download: "contracts.documents.download",
      delete: "contracts.documents.delete",
    },
    
    sign: "contracts.sign",
    approve: "contracts.approve",
    reject: "contracts.reject",
    
    financial: {
      viewRates: "contracts.financial.view_rates",
      updateRates: "contracts.financial.update_rates",
    },
    
    history: {
      view: "contracts.history.view",
    },
  },

  // =========== INVOICE MANAGEMENT ===========
  invoices: {
    view: "invoices.view",
    viewAll: "invoices.view_all",
    viewOwn: "invoices.view_own",
    create: "invoices.create",
    update: "invoices.update",
    delete: "invoices.delete",
    
    send: "invoices.send",
    resend: "invoices.resend",
    
    status: {
      markSent: "invoices.status.mark_sent",
      markPaid: "invoices.status.mark_paid",
      markOverdue: "invoices.status.mark_overdue",
      void: "invoices.status.void",
      cancel: "invoices.status.cancel",
    },
    
    lineItems: {
      add: "invoices.line_items.add",
      update: "invoices.line_items.update",
      delete: "invoices.line_items.delete",
    },
    
    export: "invoices.export",
    downloadPDF: "invoices.download_pdf",
    
    financial: {
      viewAmounts: "invoices.financial.view_amounts",
      applyDiscount: "invoices.financial.apply_discount",
      adjustTax: "invoices.financial.adjust_tax",
    },
  },

  // =========== TIMESHEET MANAGEMENT ===========
  timesheets: {
    view: "timesheets.view",
    viewAll: "timesheets.view_all",
    viewOwn: "timesheets.view_own",
    viewTeam: "timesheets.view_team",
    create: "timesheets.create",
    update: "timesheets.update",
    updateOwn: "timesheets.update_own",
    delete: "timesheets.delete",
    deleteOwn: "timesheets.delete_own",
    
    submit: "timesheets.submit",
    approve: "timesheets.approve",
    reject: "timesheets.reject",
    
    entries: {
      add: "timesheets.entries.add",
      update: "timesheets.entries.update",
      delete: "timesheets.entries.delete",
    },
    
    export: "timesheets.export",
    
    reports: {
      view: "timesheets.reports.view",
      generate: "timesheets.reports.generate",
    },
  },

  // =========== PAYMENT MANAGEMENT ===========
  payments: {
    view: "payments.view",
    viewAll: "payments.view_all",
    viewOwn: "payments.view_own",
    create: "payments.create",
    update: "payments.update",
    delete: "payments.delete",
    
    schedule: "payments.schedule",
    process: "payments.process",
    cancel: "payments.cancel",
    
    status: {
      markProcessing: "payments.status.mark_processing",
      markCompleted: "payments.status.mark_completed",
      markFailed: "payments.status.mark_failed",
    },
    
    methods: {
      view: "payments.methods.view",
      configure: "payments.methods.configure",
    },
    
    bulk: {
      create: "payments.bulk.create",
      process: "payments.bulk.process",
      approve: "payments.bulk.approve",
    },
    
    export: "payments.export",
    
    reports: {
      view: "payments.reports.view",
      generate: "payments.reports.generate",
    },
  },

  // =========== PAYSLIP MANAGEMENT ===========
  payslips: {
    view: "payslips.view",
    viewAll: "payslips.view_all",
    viewOwn: "payslips.view_own",
    create: "payslips.create",
    update: "payslips.update",
    delete: "payslips.delete",
    
    generate: "payslips.generate",
    send: "payslips.send",
    resend: "payslips.resend",
    download: "payslips.download",
    
    bulk: {
      generate: "payslips.bulk.generate",
      send: "payslips.bulk.send",
    },
    
    export: "payslips.export",
  },

  // =========== BANK MANAGEMENT ===========
  banks: {
    view: "banks.view",
    create: "banks.create",
    update: "banks.update",
    delete: "banks.delete",
    setDefault: "banks.set_default",
    
    details: {
      viewFull: "banks.details.view_full",
      viewMasked: "banks.details.view_masked",
    },
  },

  // =========== LEAD MANAGEMENT ===========
  leads: {
    view: "leads.view",
    viewAll: "leads.view_all",
    viewOwn: "leads.view_own",
    create: "leads.create",
    update: "leads.update",
    updateOwn: "leads.update_own",
    delete: "leads.delete",
    
    assign: "leads.assign",
    convert: "leads.convert",
    
    status: {
      update: "leads.status.update",
    },
    
    export: "leads.export",
    import: "leads.import",
    
    reports: {
      view: "leads.reports.view",
    },
  },

  // =========== TASK MANAGEMENT ===========
  tasks: {
    view: "tasks.view",
    viewAll: "tasks.view_all",
    viewOwn: "tasks.view_own",
    viewAssigned: "tasks.view_assigned",
    create: "tasks.create",
    update: "tasks.update",
    updateOwn: "tasks.update_own",
    delete: "tasks.delete",
    
    assign: "tasks.assign",
    reassign: "tasks.reassign",
    complete: "tasks.complete",
    
    priority: {
      update: "tasks.priority.update",
    },
    
    status: {
      update: "tasks.status.update",
    },
  },

  // =========== ONBOARDING MANAGEMENT ===========
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
      view: "onboarding.questions.view",
      create: "onboarding.questions.create",
      update: "onboarding.questions.update",
      delete: "onboarding.questions.delete",
      reorder: "onboarding.questions.reorder",
    },
    
    responses: {
      view: "onboarding.responses.view",
      viewAll: "onboarding.responses.view_all",
      viewOwn: "onboarding.responses.view_own",
      submit: "onboarding.responses.submit",
      update: "onboarding.responses.update",
      review: "onboarding.responses.review",
      approve: "onboarding.responses.approve",
      reject: "onboarding.responses.reject",
    },
    
    assign: "onboarding.assign",
    
    reports: {
      view: "onboarding.reports.view",
      export: "onboarding.reports.export",
    },
  },

  // =========== DOCUMENT MANAGEMENT ===========
  documents: {
    types: {
      view: "documents.types.view",
      create: "documents.types.create",
      update: "documents.types.update",
      delete: "documents.types.delete",
    },
    
    view: "documents.view",
    upload: "documents.upload",
    download: "documents.download",
    delete: "documents.delete",
    
    compliance: {
      viewStatus: "documents.compliance.view_status",
      markCompliant: "documents.compliance.mark_compliant",
      requestRevision: "documents.compliance.request_revision",
    },
  },

  // =========== AUDIT & COMPLIANCE ===========
  audit: {
    logs: {
      view: "audit.logs.view",
      viewAll: "audit.logs.view_all",
      viewOwn: "audit.logs.view_own",
      export: "audit.logs.export",
    },
    
    reports: {
      view: "audit.reports.view",
      generate: "audit.reports.generate",
      export: "audit.reports.export",
    },
    
    compliance: {
      view: "audit.compliance.view",
      runChecks: "audit.compliance.run_checks",
    },
  },

  // =========== REPORTS & ANALYTICS ===========
  reports: {
    dashboard: {
      view: "reports.dashboard.view",
      viewFinancial: "reports.dashboard.view_financial",
      viewOperational: "reports.dashboard.view_operational",
    },
    
    financial: {
      revenue: "reports.financial.revenue",
      expenses: "reports.financial.expenses",
      profitLoss: "reports.financial.profit_loss",
      cashFlow: "reports.financial.cash_flow",
      payroll: "reports.financial.payroll",
    },
    
    operational: {
      contractStatus: "reports.operational.contract_status",
      timesheetSummary: "reports.operational.timesheet_summary",
      userActivity: "reports.operational.user_activity",
      organizationMetrics: "reports.operational.organization_metrics",
    },
    
    custom: {
      create: "reports.custom.create",
      view: "reports.custom.view",
      update: "reports.custom.update",
      delete: "reports.custom.delete",
      schedule: "reports.custom.schedule",
    },
    
    export: "reports.export",
  },

  // =========== NOTIFICATION MANAGEMENT ===========
  notifications: {
    view: "notifications.view",
    viewOwn: "notifications.view_own",
    markRead: "notifications.mark_read",
    
    preferences: {
      view: "notifications.preferences.view",
      viewOwn: "notifications.preferences.view_own",
      update: "notifications.preferences.update",
      updateOwn: "notifications.preferences.update_own",
    },
    
    send: "notifications.send",
    sendBulk: "notifications.send_bulk",
    
    templates: {
      view: "notifications.templates.view",
      create: "notifications.templates.create",
      update: "notifications.templates.update",
      delete: "notifications.templates.delete",
    },
  },

  // =========== WEBHOOK MANAGEMENT ===========
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

  // =========== SYSTEM SETTINGS ===========
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
    
    integration: {
      view: "settings.integration.view",
      configure: "settings.integration.configure",
    },
    
    email: {
      view: "settings.email.view",
      configure: "settings.email.configure",
      testConnection: "settings.email.test_connection",
    },
    
    payment: {
      view: "settings.payment.view",
      configure: "settings.payment.configure",
    },
  },

  // =========== SUPER ADMIN ===========
  superadmin: {
    tenants: {
      view: "superadmin.tenants.view",
      create: "superadmin.tenants.create",
      update: "superadmin.tenants.update",
      delete: "superadmin.tenants.delete",
      suspend: "superadmin.tenants.suspend",
      activate: "superadmin.tenants.activate",
    },
    
    users: {
      viewAll: "superadmin.users.view_all",
      impersonate: "superadmin.users.impersonate",
      forcePasswordReset: "superadmin.users.force_password_reset",
    },
    
    system: {
      viewLogs: "superadmin.system.view_logs",
      viewMetrics: "superadmin.system.view_metrics",
      manageConfig: "superadmin.system.manage_config",
      runMigrations: "superadmin.system.run_migrations",
    },
    
    billing: {
      viewAll: "superadmin.billing.view_all",
      adjustPlan: "superadmin.billing.adjust_plan",
      applyCredits: "superadmin.billing.apply_credits",
    },
  },
} as const;

// =============================================================
// PERMISSION EXTRACTION UTILITIES
// =============================================================

/**
 * Recursively extracts all permission strings from the permission tree
 */
function extractPermissions(tree: any, accumulator: string[] = []): string[] {
  if (typeof tree === "string") {
    accumulator.push(tree);
    return accumulator;
  }

  if (typeof tree === "object" && tree !== null) {
    for (const key in tree) {
      extractPermissions(tree[key], accumulator);
    }
  }

  return accumulator;
}

/**
 * Extracts permissions for a specific category
 */
function extractCategoryPermissions(category: keyof typeof PERMISSION_TREE): string[] {
  return extractPermissions(PERMISSION_TREE[category]);
}

// =============================================================
// ALL PERMISSIONS (Flat List)
// =============================================================
export const ALL_PERMISSIONS = extractPermissions(PERMISSION_TREE);

// =============================================================
// CATEGORY-SPECIFIC PERMISSIONS
// =============================================================
export const TENANT_PERMISSIONS = extractCategoryPermissions("tenant");
export const USER_PERMISSIONS = extractCategoryPermissions("users");
export const ROLE_PERMISSIONS = extractCategoryPermissions("roles");
export const ORGANIZATION_PERMISSIONS = extractCategoryPermissions("organizations");
export const CONTRACT_PERMISSIONS = extractCategoryPermissions("contracts");
export const INVOICE_PERMISSIONS = extractCategoryPermissions("invoices");
export const TIMESHEET_PERMISSIONS = extractCategoryPermissions("timesheets");
export const PAYMENT_PERMISSIONS = extractCategoryPermissions("payments");
export const PAYSLIP_PERMISSIONS = extractCategoryPermissions("payslips");
export const BANK_PERMISSIONS = extractCategoryPermissions("banks");
export const LEAD_PERMISSIONS = extractCategoryPermissions("leads");
export const TASK_PERMISSIONS = extractCategoryPermissions("tasks");
export const ONBOARDING_PERMISSIONS = extractCategoryPermissions("onboarding");
export const DOCUMENT_PERMISSIONS = extractCategoryPermissions("documents");
export const AUDIT_PERMISSIONS = extractCategoryPermissions("audit");
export const REPORT_PERMISSIONS = extractCategoryPermissions("reports");
export const NOTIFICATION_PERMISSIONS = extractCategoryPermissions("notifications");
export const WEBHOOK_PERMISSIONS = extractCategoryPermissions("webhooks");
export const SETTINGS_PERMISSIONS = extractCategoryPermissions("settings");
export const SUPERADMIN_PERMISSIONS = extractCategoryPermissions("superadmin");

// =============================================================
// DEFAULT ROLE PERMISSION SETS
// =============================================================

/**
 * Super Admin - Full system access
 */
export const SUPERADMIN_ROLE_PERMISSIONS = [...ALL_PERMISSIONS];

/**
 * Tenant Admin - Full tenant access (excludes superadmin permissions)
 */
export const TENANT_ADMIN_PERMISSIONS = ALL_PERMISSIONS.filter(
  (p) => !p.startsWith("superadmin.")
);

/**
 * Finance Manager - Financial operations focus
 */
export const FINANCE_MANAGER_PERMISSIONS = [
  ...INVOICE_PERMISSIONS,
  ...PAYMENT_PERMISSIONS,
  ...PAYSLIP_PERMISSIONS,
  ...BANK_PERMISSIONS,
  ...REPORT_PERMISSIONS.filter((p) => p.includes("financial")),
  "contracts.view",
  "contracts.viewAll",
  "contracts.financial.viewRates",
  "organizations.view",
  "organizations.viewAll",
  "users.view",
  "audit.logs.view",
];

/**
 * HR Manager - People & onboarding focus
 */
export const HR_MANAGER_PERMISSIONS = [
  ...USER_PERMISSIONS.filter((p) => !p.includes("impersonate")),
  ...ONBOARDING_PERMISSIONS,
  ...TASK_PERMISSIONS,
  "contracts.view",
  "contracts.viewAll",
  "contracts.create",
  "contracts.update",
  "organizations.view",
  "organizations.viewAll",
  "organizations.create",
  "organizations.update",
  "organizations.members.view",
  "organizations.members.add",
  "leads.view",
  "leads.viewAll",
  "audit.logs.view",
];

/**
 * Payroll Manager - Payroll operations focus
 */
export const PAYROLL_MANAGER_PERMISSIONS = [
  ...PAYSLIP_PERMISSIONS,
  ...PAYMENT_PERMISSIONS,
  ...TIMESHEET_PERMISSIONS.filter((p) => !p.includes("Own")),
  "contracts.view",
  "contracts.viewAll",
  "contracts.financial.viewRates",
  "invoices.view",
  "invoices.viewAll",
  "users.view",
  "users.profile.view",
  "banks.view",
  "reports.financial.payroll",
  "reports.operational.timesheetSummary",
];

/**
 * Operations Manager - Business operations focus
 */
export const OPERATIONS_MANAGER_PERMISSIONS = [
  ...CONTRACT_PERMISSIONS.filter((p) => !p.includes("delete")),
  ...TIMESHEET_PERMISSIONS,
  ...TASK_PERMISSIONS,
  ...LEAD_PERMISSIONS,
  "users.view",
  "organizations.view",
  "organizations.viewAll",
  "organizations.members.view",
  "invoices.view",
  "invoices.viewAll",
  "payments.view",
  "payments.viewAll",
  "reports.operational.contractStatus",
  "reports.operational.timesheetSummary",
  "audit.logs.view",
];

/**
 * Client Admin - Client organization management
 */
export const CLIENT_ADMIN_PERMISSIONS = [
  "users.view",
  "users.viewOwn",
  "users.profile.viewOwn",
  "users.profile.updateOwn",
  "contracts.view",
  "contracts.viewOwn",
  "invoices.view",
  "invoices.viewOwn",
  "payments.view",
  "payments.viewOwn",
  "organizations.viewOwn",
  "tasks.view",
  "tasks.viewAssigned",
  "tasks.create",
  "tasks.updateOwn",
  "notifications.viewOwn",
  "notifications.preferences.viewOwn",
  "notifications.preferences.updateOwn",
];

/**
 * Contractor/Worker - Self-service access
 */
export const CONTRACTOR_PERMISSIONS = [
  "users.viewOwn",
  "users.profile.viewOwn",
  "users.profile.updateOwn",
  "users.updateOwn",
  "contracts.viewOwn",
  "contracts.documents.view",
  "contracts.sign",
  "invoices.viewOwn",
  "timesheets.viewOwn",
  "timesheets.create",
  "timesheets.updateOwn",
  "timesheets.deleteOwn",
  "timesheets.submit",
  "timesheets.entries.add",
  "timesheets.entries.update",
  "timesheets.entries.delete",
  "payments.viewOwn",
  "payslips.viewOwn",
  "payslips.download",
  "onboarding.responses.viewOwn",
  "onboarding.responses.submit",
  "onboarding.responses.update",
  "tasks.viewOwn",
  "tasks.viewAssigned",
  "tasks.complete",
  "notifications.viewOwn",
  "notifications.markRead",
  "notifications.preferences.viewOwn",
  "notifications.preferences.updateOwn",
];

/**
 * Accountant - Financial reporting and review
 */
export const ACCOUNTANT_PERMISSIONS = [
  "invoices.view",
  "invoices.viewAll",
  "invoices.export",
  "payments.view",
  "payments.viewAll",
  "payments.export",
  "payslips.view",
  "payslips.viewAll",
  "payslips.export",
  "banks.view",
  "banks.details.viewFull",
  "contracts.view",
  "contracts.viewAll",
  "contracts.financial.viewRates",
  "reports.financial.revenue",
  "reports.financial.expenses",
  "reports.financial.profitLoss",
  "reports.financial.cashFlow",
  "reports.financial.payroll",
  "reports.export",
  "audit.logs.view",
  "audit.reports.view",
];

/**
 * Recruiter - Lead and contractor management
 */
export const RECRUITER_PERMISSIONS = [
  ...LEAD_PERMISSIONS,
  "users.view",
  "users.create",
  "users.invite",
  "users.profile.view",
  "contracts.view",
  "contracts.create",
  "organizations.view",
  "organizations.viewAll",
  "onboarding.templates.view",
  "onboarding.assign",
  "onboarding.responses.view",
  "tasks.view",
  "tasks.create",
  "tasks.assign",
];

/**
 * Viewer - Read-only access
 */
export const VIEWER_PERMISSIONS = ALL_PERMISSIONS.filter(
  (p) =>
    p.includes(".view") &&
    !p.includes("viewOwn") &&
    !p.startsWith("superadmin.")
);

// =============================================================
// PERMISSION VALIDATION HELPERS
// =============================================================

/**
 * Check if a permission exists in the system
 */
export function isValidPermission(permission: string): boolean {
  return ALL_PERMISSIONS.includes(permission);
}

/**
 * Get permissions by category
 */
export function getPermissionsByCategory(
  category: string
): string[] {
  return ALL_PERMISSIONS.filter((p) => p.startsWith(`${category}.`));
}

/**
 * Check if a set of permissions includes any superadmin permissions
 */
export function hasSuperAdminPermissions(permissions: string[]): boolean {
  return permissions.some((p) => p.startsWith("superadmin."));
}

/**
 * Group permissions by category
 */
export function groupPermissionsByCategory(
  permissions: string[]
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const permission of permissions) {
    const category = permission.split(".")[0];
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  }

  return grouped;
}

/**
 * Get human-readable description for a permission
 */
export function getPermissionDescription(permission: string): string {
  const parts = permission.split(".");
  const category = parts[0];
  const action = parts[parts.length - 1];

  const categoryNames: Record<string, string> = {
    tenant: "Tenant",
    users: "Users",
    roles: "Roles",
    organizations: "Organizations",
    contracts: "Contracts",
    invoices: "Invoices",
    timesheets: "Timesheets",
    payments: "Payments",
    payslips: "Payslips",
    banks: "Banks",
    leads: "Leads",
    tasks: "Tasks",
    onboarding: "Onboarding",
    documents: "Documents",
    audit: "Audit",
    reports: "Reports",
    notifications: "Notifications",
    webhooks: "Webhooks",
    settings: "Settings",
    superadmin: "Super Admin",
  };

  const actionNames: Record<string, string> = {
    view: "View",
    viewAll: "View All",
    viewOwn: "View Own",
    create: "Create",
    update: "Update",
    updateOwn: "Update Own",
    delete: "Delete",
    export: "Export",
    import: "Import",
    approve: "Approve",
    reject: "Reject",
    send: "Send",
    download: "Download",
    upload: "Upload",
  };

  const categoryName = categoryNames[category] || category;
  const actionName = actionNames[action] || action;

  return `${categoryName}: ${actionName}`;
}

// =============================================================
// EXPORT PERMISSIONS BY METADATA
// =============================================================
export const PERMISSIONS_BY_CATEGORY = {
  [PERMISSION_CATEGORIES.TENANT]: TENANT_PERMISSIONS,
  [PERMISSION_CATEGORIES.USERS]: USER_PERMISSIONS,
  [PERMISSION_CATEGORIES.ROLES]: ROLE_PERMISSIONS,
  [PERMISSION_CATEGORIES.ORGANIZATIONS]: ORGANIZATION_PERMISSIONS,
  [PERMISSION_CATEGORIES.CONTRACTS]: CONTRACT_PERMISSIONS,
  [PERMISSION_CATEGORIES.INVOICES]: INVOICE_PERMISSIONS,
  [PERMISSION_CATEGORIES.TIMESHEETS]: TIMESHEET_PERMISSIONS,
  [PERMISSION_CATEGORIES.PAYMENTS]: PAYMENT_PERMISSIONS,
  [PERMISSION_CATEGORIES.PAYSLIPS]: PAYSLIP_PERMISSIONS,
  [PERMISSION_CATEGORIES.BANKS]: BANK_PERMISSIONS,
  [PERMISSION_CATEGORIES.LEADS]: LEAD_PERMISSIONS,
  [PERMISSION_CATEGORIES.TASKS]: TASK_PERMISSIONS,
  [PERMISSION_CATEGORIES.ONBOARDING]: ONBOARDING_PERMISSIONS,
  [PERMISSION_CATEGORIES.DOCUMENTS]: DOCUMENT_PERMISSIONS,
  [PERMISSION_CATEGORIES.AUDIT]: AUDIT_PERMISSIONS,
  [PERMISSION_CATEGORIES.REPORTS]: REPORT_PERMISSIONS,
  [PERMISSION_CATEGORIES.NOTIFICATIONS]: NOTIFICATION_PERMISSIONS,
  [PERMISSION_CATEGORIES.WEBHOOKS]: WEBHOOK_PERMISSIONS,
  [PERMISSION_CATEGORIES.SETTINGS]: SETTINGS_PERMISSIONS,
  [PERMISSION_CATEGORIES.SUPERADMIN]: SUPERADMIN_PERMISSIONS,
} as const;

export const DEFAULT_ROLE_PERMISSIONS = {
  superadmin: SUPERADMIN_ROLE_PERMISSIONS,
  tenant_admin: TENANT_ADMIN_PERMISSIONS,
  finance_manager: FINANCE_MANAGER_PERMISSIONS,
  hr_manager: HR_MANAGER_PERMISSIONS,
  payroll_manager: PAYROLL_MANAGER_PERMISSIONS,
  operations_manager: OPERATIONS_MANAGER_PERMISSIONS,
  client_admin: CLIENT_ADMIN_PERMISSIONS,
  contractor: CONTRACTOR_PERMISSIONS,
  accountant: ACCOUNTANT_PERMISSIONS,
  recruiter: RECRUITER_PERMISSIONS,
  viewer: VIEWER_PERMISSIONS,
} as const;
