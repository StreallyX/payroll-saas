/**
 * Permission scopes for context
 */
export enum PermissionScope {
  GLOBAL = "global",   // Access to all tenant resources
  OWN = "own",        // Access only to own resources
  TENANT = "tenant",  // Tenant-level access (equivalent to global for some resources)
  PAGE = "page",
}

/**
 * Resources available in the platform
 */
export enum Resource {
  // Core entities
  USER = "user",
  ROLE = "role",
  PERMISSION = "permission",
  SUPER_ADMIN = "superadmin",

  // Business entities
  CONTRACT = "contract",
  CONTRACT_PARTICIPANT = "contract_participant",
  COMPANY = "company",
  CONTRACT_MSA = "contract_msa",
  CONTRACT_SOW = "contract_sow",


  // Financial
  INVOICE = "invoice",
  PAYMENT = "payment",
  EXPENSE = "expense",
  PAYSLIP = "payslip",
  REMITTANCE = "remittance",

  // Time & Work
  TIMESHEET = "timesheet",
  TASK = "task",

  // Documents & Files
  DOCUMENT = "document",
  CONTRACT_DOCUMENT = "contract_document",

  // Onboarding
  ONBOARDING_TEMPLATE = "onboarding_template",
  ONBOARDING_QUESTION = "onboarding_question",
  ONBOARDING_RESPONSE = "onboarding_response",
  ONBOARDING = "onboarding",

  // Communication
  COMMENT = "comment",
  NOTIFICATION = "notification",
  EMAIL = "email",

  // Marketing & Sales
  LEAD = "lead",
  REFERRAL = "referral",

  // Administration
  TENANT = "tenant",
  BANK = "bank",
  WEBHOOK = "webhook",
  API_KEY = "api_key",

  // Workflow
  APPROVAL_WORKFLOW = "approval_workflow",

  // System
  AUDIT_LOG = "audit_log",
  REPORT = "report",
  DASHBOARD = "dashboard",
  SETTINGS = "settings",

  // Custom
  CUSTOM_FIELD = "custom_field",
  TAG = "tag",

  //////////////////////////////////
  // root pages
  AGENCY_INVOICE = "agency_invoice",
  CONSTRUCTION = "construction",
  ONBOARDIN = "onboarding",
  PROFILE = "profile",
  SUPERADMIN = "superadmin",

  // reports subpages
  ACTIVITY_LOG = "activity_log",
  EMAIL_LOG = "email_log",
  SMS_LOG = "sms_log",
  USER_ACTIVITY = "user_activity",

  // settings subpages
  BRANDING = "branding",
  LOGIN = "login",
  COUNTRY = "country",
  CURRENCY = "currency",
  LEGAL = "legal",

  // superadmin subpages
  ANALYTIC = "analytic",
  IMPERSONATION = "impersonation",
  FEATURE = "feature",
  SUBSCRIPTION = "subscription",
  TENANT_DETAIL = "tenant_detail",
  SUPERADMIN_USER = "superadmin_user",

  // Feature Request System
  FEATURE_REQUEST = "feature_request",
  PLATFORM = "platform",

  // Entity Type Pages (filtered user views)
  AGENCY = "agency",
  CONTRACTOR = "contractor",
  PAYROLL_PARTNER = "payroll_partner",
}


/**
 * Actions disponibles
 */
export enum Action {
  // CRUD de base
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  ACCESS = "access",
  LINK = "link",
  
  // List and search
  LIST = "list",
  SEARCH = "search",
  
  // Specific actions
  APPROVE = "approve",
  REJECT = "reject",
  SEND = "send",
  EXPORT = "export",
  IMPORT = "import",
  DOWNLOAD = "download",
  UPLOAD = "upload",
  
  // Workflow
  SUBMIT = "submit",
  REVIEW = "review",
  VALIDATE = "validate",
  CANCEL = "cancel",
  ARCHIVE = "archive",
  RESTORE = "restore",
  
  // Assignation
  ASSIGN = "assign",
  UNASSIGN = "unassign",
  
  // Team management
  INVITE = "invite",
  REMOVE = "remove",
  
  // Status
  ACTIVATE = "activate",
  DEACTIVATE = "deactivate",
  SUSPEND = "suspend",
  
  // Financial
  PAY = "pay",
  REFUND = "refund",
  PROCESS = "process",
  VIEW_MARGIN = "view_margin",
  CONFIRM_MARGIN = "confirmMargin",
  CONFIRM = "confirm",
  
  // Signature
  SIGN = "sign",
  
  // Communication
  COMMENT_ADD = "comment",
  NOTIFY = "notify",
  
  // Administration
  MANAGE = "manage",
  CONFIGURE = "configure",
  
  // Impersonation & Access
  IMPERSONATE = "impersonate",
  VIEW_ALL = "view_all",
}

/**
 * Type for a complete permission
 */
export interface Permission {
  resource: Resource;
  action: Action;
  scope: PermissionScope;
  key: string; // Format: "resource.action.scope"
  displayName: string;
  description?: string;
  category?: string;
}

/**
 * Permission categories for UI
 */
export enum PermissionCategory {
  CORE = "Gestion de base",
  BUSINESS = "Business management",
  FINANCIAL = "Finance",
  TIME_TRACKING = "Temps et travail",
  DOCUMENTS = "Documents",
  COMMUNICATION = "Communication",
  ADMINISTRATION = "Administration",
  REPORTING = "Rapports et analyses",
}

// ====================================================================
// PERMISSION BUILDER
// ====================================================================

/**
 * Builds a permission key
 */
export function buildPermissionKey(
  resource: Resource,
  action: Action,
  scope: PermissionScope = PermissionScope.GLOBAL
): string {
  return `${resource}.${action}.${scope}`;
}

/**
 * Parses a permission key
 */
export function parsePermissionKey(key: string): {
  resource: string;
  action: string;
  scope: string;
} | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  
  return {
    resource: parts[0],
    action: parts[1],
    scope: parts[2],
  };
}

/**
 * Creates a Permission object
 */
export function createPermission(
  resource: Resource,
  action: Action,
  scope: PermissionScope,
  displayName: string,
  description?: string,
  category?: string
): Permission {
  return {
    resource,
    action,
    scope,
    key: buildPermissionKey(resource, action, scope),
    displayName,
    description,
    category,
  };
}

// ====================================================================
// COMPLETE PERMISSIONS FOR DEEL-LIKE PLATFORM
// ====================================================================

export const ALL_PERMISSIONS: Permission[] = [

  // ================================================================
  // SUPERADMIN
  // ================================================================
  createPermission(
    Resource.SUPER_ADMIN,
    Action.READ,
    PermissionScope.GLOBAL,
    "View own dashboard",
    "Access personal dashboard",
    PermissionCategory.CORE
  ),
  // ================================================================
  // DASHBOARD
  // ================================================================
  createPermission(
    Resource.DASHBOARD,
    Action.READ,
    PermissionScope.OWN,
    "View own dashboard",
    "Access personal dashboard",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.DASHBOARD,
    Action.READ,
    PermissionScope.GLOBAL,
    "View all dashboards",
    "Access tenant global statistics",
    PermissionCategory.REPORTING
  ),

  // ================================================================
  // USERS
  // ================================================================
  createPermission(
    Resource.USER,
    Action.READ,
    PermissionScope.OWN,
    "View own profile",
    "View and manage own user profile",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.USER,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own profile",
    "Update personal information",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.USER,
    Action.READ,
    PermissionScope.GLOBAL,
    "View user details",
    "View profiles and detailed information of all users",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all users",
    "List and search all tenant users",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create users",
    "Add new users",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit users",
    "Update user information",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete users",
    "Delete user accounts",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.ACTIVATE,
    PermissionScope.GLOBAL,
    "Activate users",
    "Activate or deactivate accounts",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.IMPERSONATE,
    PermissionScope.GLOBAL,
    "Log in as user",
    "Impersonate another user",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // ROLES
  // ================================================================
  createPermission(
    Resource.ROLE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View roles",
    "List all roles",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create roles",
    "Create new custom roles",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit roles",
    "Edit existing roles",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete roles",
    "Delete roles (except system)",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.READ,
    PermissionScope.OWN,
    "View own roles",
    "Read only roles user has created",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.CREATE,
    PermissionScope.OWN,
    "Create own roles",
    "Create a role that will be marked as belonging to the user",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own roles",
    "Edit only roles user has created",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.DELETE,
    PermissionScope.OWN,
    "Delete own roles",
    "Delete only roles created by user (except system roles)",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // PERMISSIONS
  // ================================================================
  createPermission(
    Resource.PERMISSION,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View permissions",
    "List all available permissions",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.PERMISSION,
    Action.ASSIGN,
    PermissionScope.GLOBAL,
    "Assign permissions",
    "Assign permissions to roles",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.PERMISSION,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create permissions",
    "Create new custom permissions",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // COMPANIES (Clients)
  // ================================================================

  // -------- LIST --------
  createPermission(
    Resource.COMPANY,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all companies",
    "List all tenant companies",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.COMPANY,
    Action.LIST,
    PermissionScope.OWN,
    "View own companies",
    "List only companies belonging to user",
    PermissionCategory.BUSINESS
  ),

  // -------- CREATE --------
  createPermission(
    Resource.COMPANY,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create companies (global)",
    "Create companies belonging to tenant",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.COMPANY,
    Action.CREATE,
    PermissionScope.OWN,
    "Create own companies",
    "Create companies belonging to user",
    PermissionCategory.BUSINESS
  ),

  // -------- UPDATE --------
  createPermission(
    Resource.COMPANY,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit all companies",
    "Update any tenant company",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.COMPANY,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own companies",
    "Update only companies belonging to user",
    PermissionCategory.BUSINESS
  ),

  // -------- DELETE --------
  createPermission(
    Resource.COMPANY,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete companies (global)",
    "Delete any tenant company",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.COMPANY,
    Action.DELETE,
    PermissionScope.OWN,
    "Delete own companies",
    "Delete only companies belonging to user",
    PermissionCategory.BUSINESS
  ),


  // ================================================================
  // CONTRACTS
  // ================================================================
  createPermission(
    Resource.CONTRACT,
    Action.READ,
    PermissionScope.OWN,
    "View own contracts",
    "Consulter ses propres contrats",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.ASSIGN,
    PermissionScope.GLOBAL,
    "Assign participants to a contract",
    "Allows adding an admin, approver or any other person to a contract",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all contracts",
    "List and search all contracts",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create contracts",
    "Create new contracts",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own contracts",
    "Update own contracts (draft only)",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit all contracts",
    "Update any contract",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete contracts",
    "Delete contracts (draft only)",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Send contracts",
    "Send contracts for signature",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.SIGN,
    PermissionScope.OWN,
    "Signer ses contrats",
    "Electronically sign own contracts",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approve contracts",
    "Approve and activate contracts",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.CANCEL,
    PermissionScope.GLOBAL,
    "Cancel contracts",
    "Cancel or terminate contracts",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Export contracts",
    "Export contract data",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.LINK,
    PermissionScope.GLOBAL,
    "Link SOW to MSA",
    "Create or attach SOW to MSA contract",
    PermissionCategory.BUSINESS
  ),


  // ================================================================
  // CONTRACTS — MSA (Master Service Agreements)
  // ================================================================
  createPermission(
    Resource.CONTRACT_MSA,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all MSAs",
    "List all Master Service Agreements",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.READ,
    PermissionScope.GLOBAL,
    "View an MSA",
    "View Master Service Agreements",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create an MSA",
    "Create a Master Service Agreement",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit an MSA",
    "Update a Master Service Agreement",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete an MSA",
    "Delete a Master Service Agreement (unsigned)",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Send an MSA",
    "Send a Master Service Agreement for signature",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.SIGN,
    PermissionScope.GLOBAL, // pas OWN — signature par managers/clients
    "Signer un MSA",
    "Sign a Master Service Agreement",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approve an MSA",
    "Approve a Master Service Agreement",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.CANCEL,
    PermissionScope.GLOBAL,
    "Cancel an MSA",
    "Cancel or terminate a Master Service Agreement",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_MSA,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Export MSAs",
    "Export list of Master Service Agreements",
    PermissionCategory.BUSINESS
  ),
  // ================================================================
  // CONTRACTS — SOW (Statement of Work)
  // ================================================================
  createPermission(
    Resource.CONTRACT_SOW,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all SOWs",
    "List all Statements of Work",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.READ,
    PermissionScope.OWN,
    "View own SOWs",
    "View SOWs linked to my contracts",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_SOW,
    Action.READ,
    PermissionScope.GLOBAL,
    "View all SOWs",
    "Consulter n'importe quel Statement of Work",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create a SOW",
    "Create a Statement of Work attached to an MSA",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own SOWs",
    "Update own SOWs (draft only)",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_SOW,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit all SOWs",
    "Update any Statement of Work",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete a SOW",
    "Delete a Statement of Work (unsigned)",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Send a SOW",
    "Send a Statement of Work for signature",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.SIGN,
    PermissionScope.OWN,
    "Signer un SOW",
    "Signer un Statement of Work",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approve a SOW",
    "Approve a Statement of Work",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.CANCEL,
    PermissionScope.GLOBAL,
    "Cancel a SOW",
    "Cancel or terminate a Statement of Work",
    PermissionCategory.BUSINESS
  ),

  createPermission(
    Resource.CONTRACT_SOW,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Export SOWs",
    "Export list of Statements of Work",
    PermissionCategory.BUSINESS
  ),

  // ================================================================
  // CONTRACT DOCUMENTS
  // ================================================================
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.READ,
    PermissionScope.OWN,
    "View own contract documents",
    "View documents of own contracts",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.READ,
    PermissionScope.GLOBAL,
    "View all contract documents",
    "View all documents",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.UPLOAD,
    PermissionScope.OWN,
    "Uploader des documents",
    "Add documents to own contracts",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.UPLOAD,
    PermissionScope.GLOBAL,
    "Uploader tous documents",
    "Add documents to any contract",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete documents",
    "Delete contract documents",
    PermissionCategory.DOCUMENTS
  ),

  // ================================================================
  // INVOICES
  // ================================================================
  createPermission(
    Resource.INVOICE,
    Action.READ,
    PermissionScope.OWN,
    "View own invoices",
    "Consulter ses propres factures",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.CREATE,
    PermissionScope.OWN,
    "Create own invoices",
    "Create own invoices (contractors)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all invoices",
    "List and search all invoices",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create invoices",
    "Create invoices for any contract",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own invoices",
    "Update own invoices (draft only)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit all invoices",
    "Update any invoice",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete invoices",
    "Delete invoices (draft only)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Send invoices",
    "Send invoices to clients",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approve invoices",
    "Validate invoices before sending",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.PAY,
    PermissionScope.OWN,
    "Pay own invoices",
    "Mark own invoices as paid (for agencies)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.PAY,
    PermissionScope.GLOBAL,
    "Mark as paid",
    "Mark invoices as paid",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Export invoices",
    "Export invoice data",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.CONFIRM_MARGIN,
    PermissionScope.OWN,
    "Confirm margin on own invoices",
    "Confirm and validate margin on own invoices (agencies)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.REVIEW,
    PermissionScope.GLOBAL,
    "Review invoices",
    "Review and put invoices in review",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.REJECT,
    PermissionScope.GLOBAL,
    "Reject invoices",
    "Reject invoices with reason",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.VALIDATE,
    PermissionScope.GLOBAL,
    "Edit amounts and margins",
    "Edit invoice amounts and margins (admin)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.PAY,
    PermissionScope.OWN,
    "Mark own invoices as paid",
    "Mark as paid invoices where you are the recipient (agencies)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.CONFIRM,
    PermissionScope.GLOBAL,
    "Confirm payment receipt",
    "Confirm payment was received with exact amount (admin)",
    PermissionCategory.FINANCIAL
  ),

  // ================================================================
  // PAYMENTS
  // ================================================================
  createPermission(
    Resource.PAYMENT,
    Action.READ,
    PermissionScope.OWN,
    "View own payments",
    "Consulter ses propres paiements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all payments",
    "List all payments",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.CREATE,
    PermissionScope.TENANT,
    "Create payments",
    "Create new payments",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.UPDATE,
    PermissionScope.TENANT,
    "Edit payments",
    "Update payments (including confirmation)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.DELETE,
    PermissionScope.TENANT,
    "Delete payments",
    "Delete incomplete payments",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.READ,
    PermissionScope.TENANT,
    "View payments",
    "View tenant payments",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.PROCESS,
    PermissionScope.GLOBAL,
    "Process payments",
    "Process and finalize payments",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.REFUND,
    PermissionScope.GLOBAL,
    "Rembourser des paiements",
    "Issue refunds",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Export payments",
    "Export payment data",
    PermissionCategory.FINANCIAL
  ),

  // ================================================================
  // EXPENSES
  // ================================================================
  createPermission(
    Resource.EXPENSE,
    Action.READ,
    PermissionScope.OWN,
    "View own expenses",
    "View own expenses",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.CREATE,
    PermissionScope.OWN,
    "Create expenses",
    "Submit expense reports",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own expenses",
    "Update own expenses (draft/rejected)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.DELETE,
    PermissionScope.OWN,
    "Delete own expenses",
    "Delete own expenses (draft only)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.SUBMIT,
    PermissionScope.OWN,
    "Submit own expenses",
    "Submit expenses for approval",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all expenses",
    "List all expenses",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approve all expenses",
    "Approve any expense",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.REJECT,
    PermissionScope.GLOBAL,
    "Reject expenses",
    "Reject expense requests",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.PAY,
    PermissionScope.GLOBAL,
    "Mark as paid",
    "Mark expenses as reimbursed",
    PermissionCategory.FINANCIAL
  ),

  // ================================================================
  // TIMESHEETS
  // ================================================================
  createPermission(
    Resource.TIMESHEET,
    Action.READ,
    PermissionScope.OWN,
    "View own timesheets",
    "Consulter ses propres timesheets",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.CREATE,
    PermissionScope.OWN,
    "Create timesheets",
    "Create new timesheets",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own timesheets",
    "Update own timesheets (draft only)",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.DELETE,
    PermissionScope.OWN,
    "Delete own timesheets",
    "Delete own timesheets (draft only)",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.SUBMIT,
    PermissionScope.OWN,
    "Submit own timesheets",
    "Submit timesheets for approval",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all timesheets",
    "List all timesheets",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.REVIEW,
    PermissionScope.GLOBAL,
    "Review timesheets",
    "Mark timesheets as under review",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approve all timesheets",
    "Approve any timesheet",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.REJECT,
    PermissionScope.GLOBAL,
    "Reject timesheets",
    "Reject timesheets",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit all timesheets",
    "Edit any timesheet (including amounts)",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.VIEW_MARGIN,
    PermissionScope.GLOBAL,
    "View timesheet margins",
    "View margin details and complete amount breakdown in timesheets",
    PermissionCategory.FINANCIAL
  ),

  // =============================
  // PAYSLIP PERMISSIONS
  // =============================
  createPermission(
    Resource.PAYSLIP,
    Action.READ,
    PermissionScope.OWN,
    "View own payslips",
    "Consulter uniquement ses propres bulletins",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.READ,
    PermissionScope.GLOBAL,
    "View all payslips",
    "View payslips of all users",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.LIST,
    PermissionScope.GLOBAL,
    "List payslips",
    "Access complete payslip list",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Generate payslips",
    "Create new payslips for a user",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit payslips",
    "Update existing payslips",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete payslips",
    "Delete existing payslips",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Send payslips",
    "Send payslips by email to users",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Export payslips",
    "Download or export payslip as PDF/CSV",
    PermissionCategory.FINANCIAL
  ),
  // ================================================================
  // REMITTANCES
  // ================================================================
  createPermission(
    Resource.REMITTANCE,
    Action.READ,
    PermissionScope.OWN,
    "View own transfers",
    "Consulter ses propres virements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.REMITTANCE,
    Action.CREATE,
    PermissionScope.OWN,
    "Demander des virements",
    "Create transfer requests",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.REMITTANCE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all transfers",
    "List all transfers",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.REMITTANCE,
    Action.PROCESS,
    PermissionScope.GLOBAL,
    "Process transfers",
    "Process and finalize transfers",
    PermissionCategory.FINANCIAL
  ),

  // ⭐️ ADDED → new admin permissions
  createPermission(
    Resource.REMITTANCE,
    Action.READ,
    PermissionScope.GLOBAL,
    "View all transfer details",
    "View detailed information of all tenant remittances",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.REMITTANCE,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Update a transfer",
    "Edit a remittance: notes, status, dates, etc.",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.REMITTANCE,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete a transfer",
    "Delete an existing remittance",
    PermissionCategory.FINANCIAL
  ),


  // ================================================================
  // REFERRALS
  // ================================================================
  createPermission(
    Resource.REFERRAL,
    Action.READ,
    PermissionScope.OWN,
    "View own referrals",
    "Consulter ses propres parrainages",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.REFERRAL,
    Action.CREATE,
    PermissionScope.OWN,
    "Create referrals",
    "Parrainer de nouveaux contractors",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.REFERRAL,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all referrals",
    "List all referrals",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.REFERRAL,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approve referrals",
    "Validate referrals",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.REFERRAL,
    Action.PAY,
    PermissionScope.GLOBAL,
    "Pay rewards",
    "Pay referral rewards",
    PermissionCategory.BUSINESS
  ),

  // ================================================================
  // TASKS
  // ================================================================
  createPermission(
    Resource.TASK,
    Action.READ,
    PermissionScope.OWN,
    "View own tasks",
    "View own tasks",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.READ,
    PermissionScope.GLOBAL,
    "View all tasks",
    "View all tenant tasks",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create tasks",
    "Create new tasks",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own tasks",
    "Update own tasks",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit all tasks",
    "Update any task",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete tasks",
    "Delete tasks",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.ASSIGN,
    PermissionScope.GLOBAL,
    "Assign tasks",
    "Assign tasks to users",
    PermissionCategory.TIME_TRACKING
  ),

  // ================================================================
  // LEADS
  // ================================================================
  createPermission(
    Resource.LEAD,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View leads",
    "List all leads",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.LEAD,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create leads",
    "Add new leads",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.LEAD,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit leads",
    "Update leads",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.LEAD,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete leads",
    "Delete leads",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.LEAD,
    Action.ASSIGN,
    PermissionScope.GLOBAL,
    "Assign prospects",
    "Assign leads to sales reps",
    PermissionCategory.BUSINESS
  ),

  // ================================================================
  // DOCUMENTS
  // ================================================================
  createPermission(
    Resource.DOCUMENT,
    Action.READ,
    PermissionScope.OWN,
    "View own documents",
    "Consulter ses propres documents",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.READ,
    PermissionScope.GLOBAL,
    "View all documents",
    "View documents of all tenant entities",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.UPLOAD,
    PermissionScope.OWN,
    "Uploader ses documents",
    "Add new documents for own entities",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.UPLOAD,
    PermissionScope.GLOBAL,
    "Uploader tous documents",
    "Add documents for any entity",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Update all documents",
    "Update (new version) any tenant document",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.DELETE,
    PermissionScope.OWN,
    "Delete own documents",
    "Delete own documents",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete all documents",
    "Delete any document",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.UPDATE,
    PermissionScope.OWN,
    "Update own documents",
    "Update (new version) own documents",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.LIST,
    PermissionScope.GLOBAL,
    "List all documents",
    "Allows viewing list of all tenant documents",
    PermissionCategory.DOCUMENTS
  ),

  // ================================================================
  // ONBOARDING
  // ================================================================
  createPermission(
    Resource.ONBOARDING_TEMPLATE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View onboarding templates",
    "List templates",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_TEMPLATE,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create onboarding templates",
    "Create new templates",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_TEMPLATE,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit onboarding templates",
    "Update templates",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_TEMPLATE,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete onboarding templates",
    "Delete templates",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_RESPONSE,
    Action.READ,
    PermissionScope.OWN,
    "View own onboarding responses",
    "View own responses",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.ONBOARDING_RESPONSE,
    Action.SUBMIT,
    PermissionScope.OWN,
    "Submit own responses",
    "Submit onboarding responses",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.ONBOARDING_RESPONSE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all onboarding responses",
    "List all responses",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_RESPONSE,
    Action.REVIEW,
    PermissionScope.GLOBAL,
    "Review responses",
    "Review and approve responses",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // COMMENTS
  // ================================================================
  createPermission(
    Resource.COMMENT,
    Action.CREATE,
    PermissionScope.OWN,
    "Add comments",
    "Comment on accessible resources",
    PermissionCategory.COMMUNICATION
  ),
  createPermission(
    Resource.COMMENT,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit own comments",
    "Edit own comments",
    PermissionCategory.COMMUNICATION
  ),
  createPermission(
    Resource.COMMENT,
    Action.DELETE,
    PermissionScope.OWN,
    "Delete own comments",
    "Delete own comments",
    PermissionCategory.COMMUNICATION
  ),
  createPermission(
    Resource.COMMENT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete all comments",
    "Delete any comment",
    PermissionCategory.COMMUNICATION
  ),

  // ================================================================
  // APPROVAL WORKFLOWS
  // ================================================================
  createPermission(
    Resource.APPROVAL_WORKFLOW,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View approval workflows",
    "List workflows",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.APPROVAL_WORKFLOW,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create workflows",
    "Create approval workflows",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.APPROVAL_WORKFLOW,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit workflows",
    "Update workflows",
    PermissionCategory.ADMINISTRATION
  ),
  // ================================================================
  // BANKS (Global + Own)
  // ================================================================
  createPermission(
    Resource.BANK,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all banks",
    "List all tenant banks",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.BANK,
    Action.LIST,
    PermissionScope.OWN,
    "View my banks",
    "List only banks created by user",
    PermissionCategory.ADMINISTRATION
  ),

  createPermission(
    Resource.BANK,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create banks (global)",
    "Add banks visible to entire tenant",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.BANK,
    Action.CREATE,
    PermissionScope.OWN,
    "Create banks (own)",
    "Add personal banks",
    PermissionCategory.ADMINISTRATION
  ),

  createPermission(
    Resource.BANK,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit banks (global)",
    "Update all banks",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.BANK,
    Action.UPDATE,
    PermissionScope.OWN,
    "Edit my banks",
    "Update only banks created by user",
    PermissionCategory.ADMINISTRATION
  ),

  createPermission(
    Resource.BANK,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete banks (global)",
    "Delete any bank",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.BANK,
    Action.DELETE,
    PermissionScope.OWN,
    "Delete my banks",
    "Delete only banks created by user",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // WEBHOOKS
  // ================================================================
  createPermission(
    Resource.WEBHOOK,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View webhooks",
    "List all webhooks",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.WEBHOOK,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create webhooks",
    "Configurer de nouveaux webhooks",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.WEBHOOK,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit webhooks",
    "Update webhooks",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.WEBHOOK,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete webhooks",
    "Delete webhooks",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // API KEYS
  // ================================================================
  createPermission(
    Resource.API_KEY,
    Action.LIST,
    PermissionScope.OWN,
    "View own API keys",
    "List own API keys",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.API_KEY,
    Action.CREATE,
    PermissionScope.OWN,
    "Create API keys",
    "Generate new API keys",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.API_KEY,
    Action.DELETE,
    PermissionScope.OWN,
    "Delete own API keys",
    "Revoke own API keys",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.API_KEY,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all API keys",
    "List all tenant API keys",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // TENANT
  // ================================================================
  createPermission(
    Resource.TENANT,
    Action.READ,
    PermissionScope.TENANT,
    "View tenant information",
    "View organization information",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TENANT,
    Action.UPDATE,
    PermissionScope.TENANT,
    "Edit tenant",
    "Update organization settings",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TENANT,
    Action.CONFIGURE,
    PermissionScope.TENANT,
    "Configurer le tenant",
    "Manage advanced configurations",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // SETTINGS
  // ================================================================
  createPermission(
    Resource.SETTINGS,
    Action.READ,
    PermissionScope.GLOBAL,
    "View settings",
    "View system settings",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.SETTINGS,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit settings",
    "Update system settings",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // CUSTOM FIELDS
  // ================================================================
  createPermission(
    Resource.CUSTOM_FIELD,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View custom fields",
    "List custom fields",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.CUSTOM_FIELD,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create custom fields",
    "Add new fields",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.CUSTOM_FIELD,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit custom fields",
    "Update fields",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.CUSTOM_FIELD,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete custom fields",
    "Delete fields",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // TAGS
  // ================================================================
  createPermission(
    Resource.TAG,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View tags",
    "List all tags",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TAG,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create tags",
    "Create new tags",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TAG,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit tags",
    "Update tags",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TAG,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete tags",
    "Delete tags",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // REPORTS
  // ================================================================
  createPermission(
    Resource.REPORT,
    Action.READ,
    PermissionScope.OWN,
    "View own reports",
    "Consulter ses propres rapports",
    PermissionCategory.REPORTING
  ),
  createPermission(
    Resource.REPORT,
    Action.READ,
    PermissionScope.GLOBAL,
    "View all reports",
    "Access all reports",
    PermissionCategory.REPORTING
  ),
  createPermission(
    Resource.REPORT,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create reports",
    "Generate new reports",
    PermissionCategory.REPORTING
  ),
  createPermission(
    Resource.REPORT,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Export reports",
    "Export reports as PDF/Excel",
    PermissionCategory.REPORTING
  ),

  // ================================================================
  // CONTRACT PARTICIPANTS (contractors / agency / payroll / client)
  // ================================================================
  createPermission(
    Resource.CONTRACT_PARTICIPANT,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View contract participants",
    "List all contract participants",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_PARTICIPANT,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Add a participant",
    "Associate a user with a contract",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_PARTICIPANT,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit participants",
    "Update the role or information of a participant",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_PARTICIPANT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Retirer un participant",
    "Retirer un utilisateur d’un contrat",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_PARTICIPANT,
    Action.READ,
    PermissionScope.OWN,
    "View own contract participation",
    "View own relationship with contracts",
    PermissionCategory.BUSINESS
  ),


  // ================================================================
  // AUDIT LOGS
  // ================================================================
  createPermission(
    Resource.AUDIT_LOG,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View audit logs",
    "View action history",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.AUDIT_LOG,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Export logs",
    "Export audit logs",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // EMAIL
  // ================================================================
  createPermission(
    Resource.EMAIL,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Send emails",
    "Send emails to users",
    PermissionCategory.COMMUNICATION
  ),
  createPermission(
    Resource.EMAIL,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View email history",
    "Consulter les logs d'envoi d'emails",
    PermissionCategory.COMMUNICATION
  ),
  createPermission(
    Resource.EMAIL,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Create email templates",
    "Create and manage email templates",
    PermissionCategory.COMMUNICATION
  ),

  // ================================================================
  // PAGE ACCESS
  // ================================================================
  createPermission(Resource.DASHBOARD, Action.ACCESS, PermissionScope.PAGE, "Access Agency Invoices"),
  createPermission(Resource.AGENCY_INVOICE, Action.ACCESS, PermissionScope.PAGE, "Access Agency Invoices"),
  createPermission(Resource.CONSTRUCTION, Action.ACCESS, PermissionScope.PAGE, "Access Construction"),
  createPermission(Resource.CONTRACT, Action.ACCESS, PermissionScope.PAGE, "Access Contracts"),
  createPermission(Resource.EXPENSE, Action.ACCESS, PermissionScope.PAGE, "Access Expenses"),
  createPermission(Resource.INVOICE, Action.ACCESS, PermissionScope.PAGE, "Access Invoices"),
  createPermission(Resource.LEAD, Action.ACCESS, PermissionScope.PAGE, "Access Leads"),
  createPermission(Resource.ONBOARDING, Action.ACCESS, PermissionScope.PAGE, "Access Onboarding"),
  createPermission(Resource.PAYMENT, Action.ACCESS, PermissionScope.PAGE, "Access Payments"),
  createPermission(Resource.PAYSLIP, Action.ACCESS, PermissionScope.PAGE, "Access Payslips"),
  createPermission(Resource.PROFILE, Action.ACCESS, PermissionScope.PAGE, "Access Profile"),
  createPermission(Resource.REFERRAL, Action.ACCESS, PermissionScope.PAGE, "Access Referrals"),
  createPermission(Resource.REPORT, Action.ACCESS, PermissionScope.PAGE, "Access Reports"),
  createPermission(Resource.SETTINGS, Action.ACCESS, PermissionScope.PAGE, "Access Settings"),
  createPermission(Resource.SUPERADMIN, Action.ACCESS, PermissionScope.PAGE, "Access Superadmin"),
  createPermission(Resource.TASK, Action.ACCESS, PermissionScope.PAGE, "Access Tasks"),
  createPermission(Resource.TIMESHEET, Action.ACCESS, PermissionScope.PAGE, "Access Timesheets"),
  createPermission(Resource.USER, Action.ACCESS, PermissionScope.PAGE, "Access Users"),
  createPermission(Resource.ONBOARDING_TEMPLATE, Action.ACCESS, PermissionScope.PAGE, "Access Templates"),
  createPermission(Resource.PAYSLIP, Action.ACCESS, PermissionScope.PAGE, "Access Payments Payslips"),
  createPermission(Resource.REMITTANCE, Action.ACCESS, PermissionScope.PAGE, "Access Remittances"),
  createPermission(Resource.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE, "Access Activity Logs"),
  createPermission(Resource.EMAIL, Action.ACCESS, PermissionScope.PAGE, "Access email sending"),
  createPermission(Resource.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE, "Access Email Logs"),
  createPermission(Resource.SMS_LOG, Action.ACCESS, PermissionScope.PAGE, "Access SMS Logs"),
  createPermission(Resource.USER_ACTIVITY, Action.ACCESS, PermissionScope.PAGE, "Access User Activity"),
  createPermission(Resource.BANK, Action.ACCESS, PermissionScope.PAGE, "Access Banks"),
  createPermission(Resource.BRANDING, Action.ACCESS, PermissionScope.PAGE, "Access Branding"),
  createPermission(Resource.LOGIN, Action.ACCESS, PermissionScope.PAGE, "Access Branding Login"),
  createPermission(Resource.COMPANY, Action.ACCESS, PermissionScope.PAGE, "Access Companies"),
  createPermission(Resource.COUNTRY, Action.ACCESS, PermissionScope.PAGE, "Access Countries"),
  createPermission(Resource.COUNTRY, Action.CREATE, PermissionScope.GLOBAL, "Create Country"),
  createPermission(Resource.COUNTRY, Action.UPDATE, PermissionScope.GLOBAL, "Update Country"),
  createPermission(Resource.COUNTRY, Action.DELETE, PermissionScope.GLOBAL, "Delete Country"),
  createPermission(Resource.CURRENCY, Action.ACCESS, PermissionScope.PAGE, "Access Currencies"),
  createPermission(Resource.LEGAL, Action.ACCESS, PermissionScope.PAGE, "Access Legal"),
  createPermission(Resource.PERMISSION, Action.ACCESS, PermissionScope.PAGE, "Access Permissions"),
  createPermission(Resource.ROLE, Action.ACCESS, PermissionScope.PAGE, "Access Roles"),
  createPermission(Resource.TENANT, Action.ACCESS, PermissionScope.PAGE, "Access Tenant"),
  createPermission(Resource.WEBHOOK, Action.ACCESS, PermissionScope.PAGE, "Access Webhooks"),
  createPermission(Resource.ANALYTIC, Action.ACCESS, PermissionScope.PAGE, "Access Analytics"),
  createPermission(Resource.IMPERSONATION, Action.ACCESS, PermissionScope.PAGE, "Access Impersonations"),
  createPermission(Resource.FEATURE, Action.ACCESS, PermissionScope.PAGE, "Access Features"),
  createPermission(Resource.SUBSCRIPTION, Action.ACCESS, PermissionScope.PAGE, "Access Subscriptions"),
  createPermission(Resource.TENANT, Action.ACCESS, PermissionScope.PAGE, "Access Tenants"),
  createPermission(Resource.TENANT_DETAIL, Action.ACCESS, PermissionScope.PAGE, "Access Tenant Details"),
  createPermission(Resource.SUPERADMIN_USER, Action.ACCESS, PermissionScope.PAGE, "Access Superadmin Users"),

  // ================================================================
  // FEATURE REQUEST PERMISSIONS
  // ================================================================
  
  // Create feature requests (all authenticated users)
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.CREATE,
    PermissionScope.OWN,
    "Create a feature request",
    "Submit a new feature request or modification",
    PermissionCategory.CORE
  ),

  // View own feature requests
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.READ,
    PermissionScope.OWN,
    "View own requests",
    "View own feature requests",
    PermissionCategory.CORE
  ),

  // List own feature requests
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.LIST,
    PermissionScope.OWN,
    "List own requests",
    "View list of own feature requests",
    PermissionCategory.CORE
  ),

  // View all feature requests (admin)
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.LIST,
    PermissionScope.GLOBAL,
    "View all requests",
    "View all tenant feature requests",
    PermissionCategory.ADMINISTRATION
  ),

  // Manage platform features (superadmin/admin with special permission)
  createPermission(
    Resource.PLATFORM,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Manage platform",
    "Approve, reject and manage feature requests",
    PermissionCategory.ADMINISTRATION
  ),

  // Update feature request status
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Edit requests",
    "Edit and manage feature requests",
    PermissionCategory.ADMINISTRATION
  ),

  // Confirm feature requests
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.CONFIRM,
    PermissionScope.GLOBAL,
    "Confirm requests",
    "Confirm and validate feature requests",
    PermissionCategory.ADMINISTRATION
  ),

  // Reject feature requests
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.REJECT,
    PermissionScope.GLOBAL,
    "Reject requests",
    "Reject feature requests with reason",
    PermissionCategory.ADMINISTRATION
  ),

  // Delete feature requests
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Delete requests",
    "Delete feature requests",
    PermissionCategory.ADMINISTRATION
  ),

  // Page access permissions
  createPermission(
    Resource.FEATURE_REQUEST,
    Action.ACCESS,
    PermissionScope.PAGE,
    "Access Feature Requests",
    "Access feature requests page"
  ),

  // Entity Type Pages (filtered user views)
  createPermission(Resource.AGENCY, Action.ACCESS, PermissionScope.PAGE, "Access Agencies Page"),
  createPermission(Resource.AGENCY, Action.LIST, PermissionScope.GLOBAL, "List all agencies", "View all agency users", PermissionCategory.BUSINESS),
  createPermission(Resource.AGENCY, Action.CREATE, PermissionScope.GLOBAL, "Create agency users", "Create new agency users", PermissionCategory.BUSINESS),
  createPermission(Resource.AGENCY, Action.UPDATE, PermissionScope.GLOBAL, "Edit agency users", "Update agency users", PermissionCategory.BUSINESS),
  createPermission(Resource.AGENCY, Action.DELETE, PermissionScope.GLOBAL, "Delete agency users", "Delete agency users", PermissionCategory.BUSINESS),

  createPermission(Resource.CONTRACTOR, Action.ACCESS, PermissionScope.PAGE, "Access Contractors Page"),
  createPermission(Resource.CONTRACTOR, Action.LIST, PermissionScope.GLOBAL, "List all contractors", "View all contractor users", PermissionCategory.BUSINESS),
  createPermission(Resource.CONTRACTOR, Action.CREATE, PermissionScope.GLOBAL, "Create contractor users", "Create new contractor users", PermissionCategory.BUSINESS),
  createPermission(Resource.CONTRACTOR, Action.UPDATE, PermissionScope.GLOBAL, "Edit contractor users", "Update contractor users", PermissionCategory.BUSINESS),
  createPermission(Resource.CONTRACTOR, Action.DELETE, PermissionScope.GLOBAL, "Delete contractor users", "Delete contractor users", PermissionCategory.BUSINESS),

  createPermission(Resource.PAYROLL_PARTNER, Action.ACCESS, PermissionScope.PAGE, "Access Payroll Partners Page"),
  createPermission(Resource.PAYROLL_PARTNER, Action.LIST, PermissionScope.GLOBAL, "List all payroll partners", "View all payroll partner users", PermissionCategory.BUSINESS),
  createPermission(Resource.PAYROLL_PARTNER, Action.CREATE, PermissionScope.GLOBAL, "Create payroll partner users", "Create new payroll partner users", PermissionCategory.BUSINESS),
  createPermission(Resource.PAYROLL_PARTNER, Action.UPDATE, PermissionScope.GLOBAL, "Edit payroll partner users", "Update payroll partner users", PermissionCategory.BUSINESS),
  createPermission(Resource.PAYROLL_PARTNER, Action.DELETE, PermissionScope.GLOBAL, "Delete payroll partner users", "Delete payroll partner users", PermissionCategory.BUSINESS),

];

// ====================================================================
// PERMISSION MAPS (Pour recherche rapide)
// ====================================================================

/**
 * Permission map by key
 */
export const PERMISSION_MAP = new Map<string, Permission>(
  ALL_PERMISSIONS.map((p) => [p.key, p])
);

/**
 * Permission map by resource
 */
export const PERMISSIONS_BY_RESOURCE = ALL_PERMISSIONS.reduce((acc, perm) => {
  if (!acc[perm.resource]) {
    acc[perm.resource] = [];
  }
  acc[perm.resource].push(perm);
  return acc;
}, {} as Record<Resource, Permission[]>);

/**
 * Permission map by category
 */
export const PERMISSIONS_BY_CATEGORY = ALL_PERMISSIONS.reduce((acc, perm) => {
  const category = perm.category || "Autre";
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(perm);
  return acc;
}, {} as Record<string, Permission[]>);

// ====================================================================
// HELPER FUNCTIONS FOR PERMISSION VERIFICATION
// ====================================================================

/**
 * Type for user context
 */
export interface UserContext {
  userId: string;
  roleId: string;
  permissions: string[]; // List of permission keys
  tenantId: string;
  agencyId?: string;
  companyId?: string;
}

/**
 * Type for resource context
 */
export interface ResourceContext {
  resourceType: Resource;
  resourceId: string;
  ownerId?: string; // userId who owns the resource
  createdBy?: string; // userId who created the resource
  assignedTo?: string; // userId assigned to the resource
  agencyId?: string; // If resource belongs to an agency
  teamId?: string; // If resource belongs to a team
}

/**
 * Checks if a user has a permission
 */
export function hasPermission(
  user: UserContext,
  resource: Resource,
  action: Action,
  scope: PermissionScope = PermissionScope.GLOBAL
): boolean {
  const key = buildPermissionKey(resource, action, scope);
  return user.permissions.includes(key);
}

/**
 * Checks if a user has a permission with context (ownership)
 */
export function hasPermissionWithContext(
  user: UserContext,
  resource: Resource,
  action: Action,
  resourceContext?: ResourceContext
): boolean {
  // Check global permission
  if (hasPermission(user, resource, action, PermissionScope.GLOBAL)) {
    return true;
  }

  // If no resource context, just check permission
  if (!resourceContext) {
    return hasPermission(user, resource, action, PermissionScope.OWN);
  }

  // Check "own" permission
  if (hasPermission(user, resource, action, PermissionScope.OWN)) {
    // Check ownership
    if (
      resourceContext.ownerId === user.userId ||
      resourceContext.createdBy === user.userId ||
      resourceContext.assignedTo === user.userId
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a user can perform an action on a specific resource
 */
export function canPerformAction(
  user: UserContext,
  resource: Resource,
  action: Action,
  resourceContext?: ResourceContext
): {
  allowed: boolean;
  reason?: string;
} {
  const allowed = hasPermissionWithContext(user, resource, action, resourceContext);

  if (!allowed) {
    return {
      allowed: false,
      reason: `Permission denied: ${resource}.${action}`,
    };
  }

  return { allowed: true };
}

/**
 * Filters resources a user has access to
 */
export function filterResourcesByPermission<T extends { id: string; ownerId?: string; createdBy?: string }>(
  user: UserContext,
  resources: T[],
  resource: Resource,
  action: Action
): T[] {
  // Si permission globale, retourner tout
  if (hasPermission(user, resource, action, PermissionScope.GLOBAL)) {
    return resources;
  }

  // If "own" permission, filter by ownership
  if (hasPermission(user, resource, action, PermissionScope.OWN)) {
    return resources.filter(
      (r) => r.ownerId === user.userId || r.createdBy === user.userId
    );
  }

  return [];
}

/**
 * Gets all permissions of a role
 */
export function getPermissionsForRole(rolePermissions: string[]): Permission[] {
  return rolePermissions
    .map((key) => PERMISSION_MAP.get(key))
    .filter((p): p is Permission => p !== undefined);
}

/**
 * Checks if a permission exists
 */
export function isValidPermission(key: string): boolean {
  return PERMISSION_MAP.has(key);
}

/**
 * Gets a permission by its key
 */
export function getPermissionByKey(key: string): Permission | undefined {
  return PERMISSION_MAP.get(key);
}

/**
 * Gets all permissions for a resource
 */
export function getPermissionsForResource(resource: Resource): Permission[] {
  return PERMISSIONS_BY_RESOURCE[resource] || [];
}

/**
 * Gets all permission keys
 */
export function getAllPermissionKeys(): string[] {
  return ALL_PERMISSIONS.map((p) => p.key);
}

/**
 * Gets all available resources
 */
export function getAllResources(): Resource[] {
  return Object.values(Resource);
}

/**
 * Gets all available actions
 */
export function getAllActions(): Action[] {
  return Object.values(Action);
}

/**
 * Gets all available scopes
 */
export function getAllScopes(): PermissionScope[] {
  return Object.values(PermissionScope);
}

// ====================================================================
// EXPORTS
// ====================================================================

export default {
  ALL_PERMISSIONS,
  PERMISSION_MAP,
  PERMISSIONS_BY_RESOURCE,
  PERMISSIONS_BY_CATEGORY,
  Resource,
  Action,
  PermissionScope,
  PermissionCategory,
  buildPermissionKey,
  parsePermissionKey,
  createPermission,
  hasPermission,
  hasPermissionWithContext,
  canPerformAction,
  filterResourcesByPermission,
  getPermissionsForRole,
  isValidPermission,
  getPermissionByKey,
  getPermissionsForResource,
  getAllPermissionKeys,
  getAllResources,
  getAllActions,
  getAllScopes,
};
