export const PERMISSION_TREE = {
  tenant: {
    view: "tenant.view",
    update: "tenant.update",
    branding: {
      update: "tenant.branding.update",
    },
    billing: {
      view: "tenant.billing.view",
      update: "tenant.billing.update",
    },
    roles: {
      view: "tenant.roles.view",
      create: "tenant.roles.create",
      update: "tenant.roles.update",
      delete: "tenant.roles.delete",
    },
    users: {
      invite: "tenant.users.invite",
      create: "tenant.users.create",
      view: "tenant.users.view",
      update: "tenant.users.update",
      disable: "tenant.users.disable",
      delete: "tenant.users.delete",
    },
    // PHASE 3: Multi-tenancy & White-label Permissions
    subscription: {
      view: "tenant.subscription.view",
      manage: "tenant.subscription.manage",
      billing: "tenant.subscription.billing",
    },
    quotas: {
      view: "tenant.quotas.view",
      manage: "tenant.quotas.manage",
    },
    features: {
      view: "tenant.features.view",
      manage: "tenant.features.manage",
    },
    localization: {
      view: "tenant.localization.view",
      manage: "tenant.localization.manage",
    },
    domain: {
      view: "tenant.domain.view",
      manage: "tenant.domain.manage",
      verify: "tenant.domain.verify",
    },
    templates: {
      email: {
        view: "tenant.templates.email.view",
        create: "tenant.templates.email.create",
        update: "tenant.templates.email.update",
        delete: "tenant.templates.email.delete",
      },
      pdf: {
        view: "tenant.templates.pdf.view",
        create: "tenant.templates.pdf.create",
        update: "tenant.templates.pdf.update",
        delete: "tenant.templates.pdf.delete",
      },
    },
    security: {
      view: "tenant.security.view",
      manage: "tenant.security.manage",
    },
    data: {
      export: "tenant.data.export",
      delete: "tenant.data.delete",
    },
    onboarding: {
      view: "tenant.onboarding.view",
      manage: "tenant.onboarding.manage",
    },
  },

  companies: {
    view: "companies.view",
    create: "companies.create",
    update: "companies.update",
    delete: "companies.delete",
  },

  agencies: {
    view: "agencies.view",
    create: "agencies.create",
    update: "agencies.update",
    delete: "agencies.delete",
    assignContractor: "agencies.assign_contractor",
    manageTeam: "agencies.manage_team",
    notes: {
      add: "agencies.notes.add",
      view: "agencies.notes.view",
    },
  },

  contractors: {
    view: "contractors.view",
    create: "contractors.create",
    update: "contractors.update",
    delete: "contractors.delete",

    documents: {
      upload: "contractors.documents.upload",
      view: "contractors.documents.view",
      delete: "contractors.documents.delete",
    },

    onboarding: {
      start: "contractors.onboarding.start",
      update: "contractors.onboarding.update",
      review: "contractors.onboarding.review",
      validate: "contractors.onboarding.validate",
    },

    assignToAgency: "contractors.assign_to_agency",
    changeStatus: "contractors.change_status",
  },

  contracts: {
    view: "contracts.view",
    create: "contracts.create",
    update: "contracts.update",
    delete: "contracts.delete",
    send: "contracts.send",
    approve: "contracts.approve",
    reject: "contracts.reject",
    uploadPDF: "contracts.upload_pdf",
    downloadPDF: "contracts.download_pdf",
    generateReference: "contracts.generate_reference",
  },

  invoices: {
    view: "invoices.view",
    create: "invoices.create",
    update: "invoices.update",
    delete: "invoices.delete",
    send: "invoices.send",
    markPaid: "invoices.mark_paid",
    export: "invoices.export",
  },

  payroll: {
    view: "payroll.view",
    generate: "payroll.generate",
    update: "payroll.update",
    send: "payroll.send",
    markPaid: "payroll.mark_paid",
    create: "payroll.create",
    delete: "payroll.delete",
  },

  payslip: {
    view: "payslip.view",
    generate: "payslip.generate",
    update: "payslip.update",
    send: "payslip.send",
    markPaid: "payslip.mark_paid",
    create: "payslip.create",
    delete: "payslip.delete",
  },

  banks: {
    view: "banks.view",
    create: "banks.create",
    update: "banks.update",
    delete: "banks.delete",
  },

  settings: {
    view: "settings.view",
    update: "settings.update",
  },

  onboarding: {
    templates: {
      view: "onboarding.templates.view",
      create: "onboarding.templates.create",
      update: "onboarding.templates.update",
      delete: "onboarding.templates.delete",
    },
    questions: {
      add: "onboarding.questions.add",
      update: "onboarding.questions.update",
      delete: "onboarding.questions.delete",
    },
    responses: {
      view: "onboarding.responses.view",
      viewOwn: "onboarding.responses.view_own",
      submit: "onboarding.responses.submit",
      review: "onboarding.responses.review",
    },
  },

  documentTypes: {
    view: "document_types.view",
    create: "document_types.create",
    update: "document_types.update",
    delete: "document_types.delete",
  },

  tasks: {
    view: "tasks.view",
    create: "tasks.create",
    update: "tasks.update",
    delete: "tasks.delete",
    assign: "tasks.assign",
    complete: "tasks.complete",
  },

  leads: {
    view: "leads.view",
    create: "leads.create",
    update: "leads.update",
    delete: "leads.delete",
    export: "leads.export"
  },

  audit: {
    view: "audit_logs.view",
    export: "audit_logs.export",
  },

  timesheet: {
    view: "timesheet.view",
    create: "timesheet.create",
    update: "timesheet.update",
    delete: "timesheet.delete",
    approve: "timesheet.approve",
    submit: "timesheet.submit",
  },

  expense: {
    view: "expense.view",
    create: "expense.create",
    update: "expense.update",
    delete: "expense.delete",
    approve: "expense.approve",
    submit: "expense.submit",
    listAll: "expense.list_all",
    reject: "expense.reject",
    pay: "expense.pay"
  },

  referrals: {
    view: "referrals.view",
    create: "referrals.create",
    update: "referrals.update",
    delete: "referrals.delete",
    track: "referrals.track",
  },

  webhooks: {
    view: "webhooks.view",
    create: "webhooks.create",
    update: "webhooks.update",
    delete: "webhooks.delete",
    test: "webhooks.test",
  },

  superadmin: {
    tenants: {
      create: "superadmin.tenants.create",
      suspend: "superadmin.tenants.suspend",
      delete: "superadmin.tenants.delete",
      // PHASE 3: Enhanced super admin capabilities
      view_all: "superadmin.tenants.view_all",
      switch: "superadmin.tenants.switch",
      impersonate: "superadmin.tenants.impersonate",
      manage_quotas: "superadmin.tenants.manage_quotas",
      manage_features: "superadmin.tenants.manage_features",
      manage_subscriptions: "superadmin.tenants.manage_subscriptions",
      view_analytics: "superadmin.tenants.view_analytics",
      export_data: "superadmin.tenants.export_data",
    },
    users: {
      create: "superadmin.users.create",
      update: "superadmin.users.update",
      delete: "superadmin.users.delete",
      view_all: "superadmin.users.view_all",
    },
    system: {
      // PHASE 3: System-wide management
      view_logs: "superadmin.system.view_logs",
      manage_settings: "superadmin.system.manage_settings",
      view_metrics: "superadmin.system.view_metrics",
      manage_templates: "superadmin.system.manage_templates",
      manage_security: "superadmin.system.manage_security",
    },
  },
} as const;


// ---------------------------------------------------------------
// 🔥 Extract SuperAdmin permissions dynamically
// ---------------------------------------------------------------
function extractSuperAdminPermissions(tree: any): string[] {
  const result: string[] = []

  if (typeof tree === "string") {
    result.push(tree)
    return result
  }

  if (typeof tree === "object") {
    for (const key in tree) {
      result.push(...extractSuperAdminPermissions(tree[key]))
    }
  }

  return result
}



// 🔥 Doit absolument être exporté
export const SUPERADMIN_PERMISSIONS = extractSuperAdminPermissions(PERMISSION_TREE.superadmin)

// ---------------------------------------------------------------
// 📌 Default permissions for Tenant Admin
// ---------------------------------------------------------------

export const TENANT_ADMIN_DEFAULT_PERMISSIONS: string[] = [
  // 🔷 Tenant Management
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
  "tenant.users.create",
  "tenant.users.view",
  "tenant.users.update",
  "tenant.users.disable",
  "tenant.users.delete",

  // 🏢 Companies
  "companies.view",
  "companies.create",
  "companies.update",
  "companies.delete",

  // 🏬 Agencies
  "agencies.view",
  "agencies.create",
  "agencies.update",
  "agencies.delete",
  "agencies.assign_contractor",
  "agencies.manage_team",
  "agencies.notes.add",
  "agencies.notes.view",

  // 👷 Contractors
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

  // 📄 Contracts
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

  // 🧾 Invoices
  "invoices.view",
  "invoices.create",
  "invoices.update",
  "invoices.delete",
  "invoices.send",
  "invoices.mark_paid",
  "invoices.export",

  // 💰 Payroll
  "payroll.view",
  "payroll.generate",
  "payroll.update",
  "payroll.send",
  "payroll.mark_paid",
  "payroll.create",
  "payroll.delete",

  // 📑 Payslips
  "payslip.view",
  "payslip.generate",
  "payslip.update",
  "payslip.send",
  "payslip.mark_paid",
  "payslip.create",
  "payslip.delete",

  // 🏦 Banks
  "banks.view",
  "banks.create",
  "banks.update",
  "banks.delete",

  // ⚙️ Settings
  "settings.view",
  "settings.update",

  // 🧩 Onboarding Templates and Responses
  "onboarding.templates.view",
  "onboarding.templates.create",
  "onboarding.templates.update",
  "onboarding.templates.delete",
  "onboarding.questions.add",
  "onboarding.questions.update",
  "onboarding.questions.delete",
  "onboarding.responses.view",
  "onboarding.responses.submit",
  "onboarding.responses.review",

  // 📄 Document Types
  "document_types.view",
  "document_types.create",
  "document_types.update",
  "document_types.delete",

  // 📋 Tasks
  "tasks.view",
  "tasks.create",
  "tasks.update",
  "tasks.delete",
  "tasks.assign",
  "tasks.complete",

  // 📈 Leads
  "leads.view",
  "leads.create",
  "leads.update",
  "leads.delete",
  "leads.export",

  // 📜 Audit Logs
  "audit_logs.view",

  // ⏰ Timesheets
  "timesheet.view",
  "timesheet.create",
  "timesheet.update",
  "timesheet.delete",
  "timesheet.approve",
  "timesheet.submit",
  

  // 💸 Expenses
  "expense.view",
  "expense.create",
  "expense.update",
  "expense.delete",
  "expense.approve",
  "expense.submit",

  // 🔗 Webhooks
  "webhooks.view",
  "webhooks.create",
  "webhooks.update",
  "webhooks.delete",
  "webhooks.test",

  // 📧 Email Templates
  "tenant.templates.email.view",
  "tenant.templates.email.create",
  "tenant.templates.email.update",
  "tenant.templates.email.delete",

  // 📄 PDF Templates
  "tenant.templates.pdf.view",
  "tenant.templates.pdf.create",
  "tenant.templates.pdf.update",
  "tenant.templates.pdf.delete",

  // 💳 Subscription
  "tenant.subscription.view",
  "tenant.subscription.manage",
  "tenant.subscription.billing",
]

