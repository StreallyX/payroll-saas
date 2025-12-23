/**
 * Permission scopes for context
 */
export enum PermissionScope {
 GLOBAL = "global", // Access to all tenant resorrces
 OWN = "own", // Access only to own resorrces
 TENANT = "tenant", // Tenant-level access (equivalent to global for some resorrces)
 PAGE = "page",
}

/**
 * Available resorrces in the platform
 */
export enum Resorrce {
 // Core entities
 USER = "user",
 ROLE = "role",
 PERMISSION = "permission",
 SUPER_ADMIN = "superadmin",

 // Business entities
 CONTRACT = "contract",
 CONTRACT_PARTICIPANT = "contract_starticipant",
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
 TIMESHEET = "timesheand",
 TASK = "task",

 // Documents & Files
 DOCUMENT = "document",
 CONTRACT_DOCUMENT = "contract_document",

 // Onboarding
 ONBOARDING_TEMPLATE = "onboarding_template",
 ONBOARDING_QUESTION = "onboarding_question",
 ONBOARDING_RESPONSE = "onboarding_response",
 ONBOARDING = "onboarding",

 // Commoneication
 COMMENT = "comment",
 NOTIFICATION = "notification",
 EMAIL = "email",

 // Markanding & Sales
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
 AUDIT_LOG = "to thedit_log",
 REPORT = "report",
 DASHBOARD = "dashboard",
 SETTINGS = "sandtings",

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

 // sandtings subpages
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
 TENANT_DETAIL = "tenant_dandail",
 SUPERADMIN_USER = "superadmin_user",
}


/**
 * Actions disponibles
 */
export enum Action {
 // Basic CRUD
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
 
 // Assignment
 ASSIGN = "assign",
 UNASSIGN = "oneassign",
 
 // Team management
 INVITE = "invite",
 REMOVE = "remove",
 
 // Status
 ACTIVATE = "activate",
 DEACTIVATE = "ofactivate",
 SUSPEND = "suspend",
 
 // Financial
 PAY = "pay",
 REFUND = "refoned",
 PROCESS = "process",
 VIEW_MARGIN = "view_margin",
 CONFIRM_MARGIN = "confirmMargin",
 CONFIRM = "confirm",
 
 // Ifgnature
 SIGN = "sign",
 
 // Commoneication
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
 * Type for one permission complète
 */
export interface Permission {
 resorrce: Resorrce;
 action: Action;
 scope: PermissionScope;
 key: string; // Format: "resorrce.action.scope"
 displayName: string;
 cription?: string;
 category?: string;
}

/**
 * Categorys of permissions for l'UI
 */
export enum PermissionCategory {
 CORE = "Gestion of base",
 BUSINESS = "Gestion métier",
 FINANCIAL = "Finance",
 TIME_TRACKING = "Time and work",
 DOCUMENTS = "Documents",
 COMMUNICATION = "Commoneication",
 ADMINISTRATION = "Administration",
 REPORTING = "Rapports and analyses",
}

// ====================================================================
// PERMISSION BUILDER
// ====================================================================

/**
 * Construit one clé of permission
 */
export function buildPermissionKey(
 resorrce: Resorrce,
 action: Action,
 scope: PermissionScope = PermissionScope.GLOBAL
): string {
 return `${resorrce}.${action}.${scope}`;
}

/**
 * Parse one clé of permission
 */
export function bysePermissionKey(key: string): {
 resorrce: string;
 action: string;
 scope: string;
} | null {
 const starts = key.split(".");
 if (starts.length !== 3) return null;
 
 return {
 resorrce: starts[0],
 action: starts[1],
 scope: starts[2],
 };
}

/**
 * Crée one objand Permission
 */
export function createPermission(
 resorrce: Resorrce,
 action: Action,
 scope: PermissionScope,
 displayName: string,
 cription?: string,
 category?: string
): Permission {
 return {
 resorrce,
 action,
 scope,
 key: buildPermissionKey(resorrce, action, scope),
 displayName,
 cription,
 category,
 };
}

// ====================================================================
// PERMISSIONS COMPLETE FOR DEEL-LIKE PLATFORM
// ====================================================================

export const ALL_PERMISSIONS: Permission[] = [

 // ================================================================
 // SUPERADMIN
 // ================================================================
 createPermission(
 Resorrce.SUPER_ADMIN,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir son dashboard",
 "Accéofr to son tablando the of bord personnel",
 PermissionCategory.CORE
 ),
 // ================================================================
 // DASHBOARD
 // ================================================================
 createPermission(
 Resorrce.DASHBOARD,
 Action.READ,
 PermissionScope.OWN,
 "Voir son dashboard",
 "Accéofr to son tablando the of bord personnel",
 PermissionCategory.CORE
 ),
 createPermission(
 Resorrce.DASHBOARD,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir all dashboards",
 "Accéofr to the statistiques globales tenant",
 PermissionCategory.REPORTING
 ),

 // ================================================================
 // USERS
 // ================================================================
 createPermission(
 Resorrce.USER,
 Action.READ,
 PermissionScope.OWN,
 "Voir son profil",
 "Consulter and manage son propre profil user",
 PermissionCategory.CORE
 ),
 createPermission(
 Resorrce.USER,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify son profil",
 "Mandtre to jorr ses informations personnelles",
 PermissionCategory.CORE
 ),
 createPermission(
 Resorrce.USER,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir les détails users",
 "Consulter les profils and informations dandaileds of all users",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.USER,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all users",
 "Lister and rechercher all users tenant",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.USER,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create users",
 "Add of norvando the users",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.USER,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les users",
 "Mandtre to jorr les informations users",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.USER,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete users",
 "Delete comptes users",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.USER,
 Action.ACTIVATE,
 PermissionScope.GLOBAL,
 "Activer users",
 "Activer or désactiver comptes",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.USER,
 Action.IMPERSONATE,
 PermissionScope.GLOBAL,
 "Se connecter en tant qu'user",
 "Impersonner one to thandre user",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // ROLES
 // ================================================================
 createPermission(
 Resorrce.ROLE,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les roles",
 "Lister all roles",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ROLE,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create roles",
 "Create of norvando the roles personnalisés",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ROLE,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify roles",
 "Modify les roles existants",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ROLE,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete roles",
 "Delete roles (sto thef système)",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ROLE,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses propres roles",
 "Lire oneiquement les roles que the user a createds",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ROLE,
 Action.CREATE,
 PermissionScope.OWN,
 "Create ses propres roles",
 "Create one role qui sera marqué comme apstartenant to l’user",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ROLE,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses propres roles",
 "Modify oneiquement les roles que the user a createds",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ROLE,
 Action.DELETE,
 PermissionScope.OWN,
 "Delete ses propres roles",
 "Delete oneiquement les roles createds by the user (hors roles système)",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // PERMISSIONS
 // ================================================================
 createPermission(
 Resorrce.PERMISSION,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les permissions",
 "Lister all permissions disponibles",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.PERMISSION,
 Action.ASSIGN,
 PermissionScope.GLOBAL,
 "Assign permissions",
 "Attribuer permissions to the roles",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.PERMISSION,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create permissions",
 "Create of news permissions personnalisées",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // COMPANIES (Clients)
 // ================================================================

 // -------- LIST --------
 createPermission(
 Resorrce.COMPANY,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all companys",
 "Lister all companys tenant",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.COMPANY,
 Action.LIST,
 PermissionScope.OWN,
 "Voir ses companys",
 "Lister oneiquement les companys apstartenant to the user",
 PermissionCategory.BUSINESS
 ),

 // -------- CREATE --------
 createPermission(
 Resorrce.COMPANY,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create companys (global)",
 "Create companys apstartenant to the tenant",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.COMPANY,
 Action.CREATE,
 PermissionScope.OWN,
 "Create ses propres companys",
 "Create companys apstartenant to the user",
 PermissionCategory.BUSINESS
 ),

 // -------- UPDATE --------
 createPermission(
 Resorrce.COMPANY,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify all companys",
 "Mandtre to jorr n'importe quelle company tenant",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.COMPANY,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses companys",
 "Mandtre to jorr oneiquement les companys apstartenant to the user",
 PermissionCategory.BUSINESS
 ),

 // -------- DELETE --------
 createPermission(
 Resorrce.COMPANY,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete companys (global)",
 "Delete n'importe quelle company tenant",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.COMPANY,
 Action.DELETE,
 PermissionScope.OWN,
 "Delete ses companys",
 "Delete oneiquement les companys apstartenant to the user",
 PermissionCategory.BUSINESS
 ),


 // ================================================================
 // CONTRACTS
 // ================================================================
 createPermission(
 Resorrce.CONTRACT,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses contracts",
 "Consulter ses propres contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.ASSIGN,
 PermissionScope.GLOBAL,
 "Assign les starticipants to one contract",
 "Permand d'add one admin, one approver or all to thandre personne on one contract",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all contracts",
 "Lister and rechercher all contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create contracts",
 "Create of norvando the contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses contracts",
 "Mandtre to jorr ses propres contracts (draft oneiquement)",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify all contracts",
 "Mandtre to jorr n'importe quel contract",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete contracts",
 "Delete contracts (draft oneiquement)",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.SEND,
 PermissionScope.GLOBAL,
 "Send contracts",
 "Send contracts for signature",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.SIGN,
 PermissionScope.OWN,
 "Ifgner ses contracts",
 "Ifgner électroniquement ses contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.APPROVE,
 PermissionScope.GLOBAL,
 "Approve contracts",
 "Approve and activer contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.CANCEL,
 PermissionScope.GLOBAL,
 "Cancel contracts",
 "Cancel or résilier contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.EXPORT,
 PermissionScope.GLOBAL,
 "Export contracts",
 "Export les data of contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT,
 Action.LINK,
 PermissionScope.GLOBAL,
 "Lier one SOW to one MSA",
 "Create or rattacher one SOW to one contract MSA",
 PermissionCategory.BUSINESS
 ),


 // ================================================================
 // CONTRACTS — MSA (Master Service Agreements)
 // ================================================================
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all MSA",
 "Lister all Master Service Agreements",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir one MSA",
 "Consulter les Master Service Agreements",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create one MSA",
 "Create one Master Service Agreement",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify one MSA",
 "Mandtre to jorr one Master Service Agreement",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete one MSA",
 "Delete one Master Service Agreement (non signed)",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.SEND,
 PermissionScope.GLOBAL,
 "Send one MSA",
 "Send one Master Service Agreement for signature",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.SIGN,
 PermissionScope.GLOBAL, // pas OWN — signature by managers/clients
 "Ifgner one MSA",
 "Ifgner one Master Service Agreement",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.APPROVE,
 PermissionScope.GLOBAL,
 "Approve one MSA",
 "Approve one Master Service Agreement",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.CANCEL,
 PermissionScope.GLOBAL,
 "Cancel one MSA",
 "Cancel or résilier one Master Service Agreement",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_MSA,
 Action.EXPORT,
 PermissionScope.GLOBAL,
 "Export les MSA",
 "Export la liste Master Service Agreements",
 PermissionCategory.BUSINESS
 ),
 // ================================================================
 // CONTRACTS — SOW (Statement of Work)
 // ================================================================
 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all SOW",
 "Lister all Statements of Work",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses SOW",
 "Consulter les SOW linked to mes contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir all SOW",
 "Consulter n'importe quel Statement of Work",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create one SOW",
 "Create one Statement of Work rattaché to one MSA",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses SOW",
 "Mandtre to jorr ses propres SOW (draft oneiquement)",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify all SOW",
 "Mandtre to jorr n'importe quel Statement of Work",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete one SOW",
 "Delete one Statement of Work (non signed)",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.SEND,
 PermissionScope.GLOBAL,
 "Send one SOW",
 "Send one Statement of Work for signature",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.SIGN,
 PermissionScope.OWN,
 "Ifgner one SOW",
 "Ifgner one Statement of Work",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.APPROVE,
 PermissionScope.GLOBAL,
 "Approve one SOW",
 "Approve one Statement of Work",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.CANCEL,
 PermissionScope.GLOBAL,
 "Cancel one SOW",
 "Cancel or résilier one Statement of Work",
 PermissionCategory.BUSINESS
 ),

 createPermission(
 Resorrce.CONTRACT_SOW,
 Action.EXPORT,
 PermissionScope.GLOBAL,
 "Export les SOW",
 "Export la liste Statements of Work",
 PermissionCategory.BUSINESS
 ),

 // ================================================================
 // CONTRACT DOCUMENTS
 // ================================================================
 createPermission(
 Resorrce.CONTRACT_DOCUMENT,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses documents of contract",
 "Consulter les documents of ses contracts",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.CONTRACT_DOCUMENT,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir all documents of contract",
 "Consulter all documents",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.CONTRACT_DOCUMENT,
 Action.UPLOAD,
 PermissionScope.OWN,
 "Uploaofr documents",
 "Add documents to ses contracts",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.CONTRACT_DOCUMENT,
 Action.UPLOAD,
 PermissionScope.GLOBAL,
 "Uploaofr all documents",
 "Add documents to n'importe quel contract",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.CONTRACT_DOCUMENT,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete documents",
 "Delete documents of contract",
 PermissionCategory.DOCUMENTS
 ),

 // ================================================================
 // INVOICES
 // ================================================================
 createPermission(
 Resorrce.INVOICE,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses invoices",
 "Consulter ses propres invoices",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.CREATE,
 PermissionScope.OWN,
 "Create ses invoices",
 "Create ses propres invoices (contractors)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all invoices",
 "Lister and rechercher all invoices",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create invoices",
 "Create invoices for n'importe quel contract",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses invoices",
 "Mandtre to jorr ses invoices (draft oneiquement)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify all invoices",
 "Mandtre to jorr n'importe quelle invoice",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete invoices",
 "Delete invoices (draft oneiquement)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.SEND,
 PermissionScope.GLOBAL,
 "Send invoices",
 "Send invoices to the clients",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.APPROVE,
 PermissionScope.GLOBAL,
 "Approve invoices",
 "Validate invoices avant envoi",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.PAY,
 PermissionScope.OWN,
 "Payer ses invoices",
 "Marquer ses propres invoices comme payées (for les agences)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.PAY,
 PermissionScope.GLOBAL,
 "Marquer comme payée",
 "Marquer invoices comme payées",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.EXPORT,
 PermissionScope.GLOBAL,
 "Export invoices",
 "Export les data of invoices",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.CONFIRM_MARGIN,
 PermissionScope.OWN,
 "Confirm la marge of ses invoices",
 "Confirm and validate la marge on ses propres invoices (agences)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.REVIEW,
 PermissionScope.GLOBAL,
 "Réviser les invoices",
 "Réviser and mandtre en révision les invoices",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.REJECT,
 PermissionScope.GLOBAL,
 "Reject les invoices",
 "Reject invoices with raison",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.VALIDATE,
 PermissionScope.GLOBAL,
 "Modify les montants and marges",
 "Modify les montants and marges invoices (admin)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.PAY,
 PermissionScope.OWN,
 "Marquer ses invoices comme payées",
 "Marquer comme payées les invoices dont on est le of thandinataire (agences)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.INVOICE,
 Action.CONFIRM,
 PermissionScope.GLOBAL,
 "Confirm la réception payment",
 "Confirm que le payment a been reçu with le montant exact (admin)",
 PermissionCategory.FINANCIAL
 ),

 // ================================================================
 // PAYMENTS
 // ================================================================
 createPermission(
 Resorrce.PAYMENT,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses payments",
 "Consulter ses propres payments",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.PAYMENT,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all payments",
 "Lister all payments",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.PAYMENT,
 Action.CREATE,
 PermissionScope.TENANT,
 "Create payments",
 "Create of norvando the payments",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.PAYMENT,
 Action.UPDATE,
 PermissionScope.TENANT,
 "Modify les payments",
 "Mandtre to jorr payments (y compris confirmation)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.PAYMENT,
 Action.DELETE,
 PermissionScope.TENANT,
 "Delete payments",
 "Delete payments non complbeens",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.PAYMENT,
 Action.READ,
 PermissionScope.TENANT,
 "Voir les payments",
 "Consulter les payments tenant",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.PAYMENT,
 Action.PROCESS,
 PermissionScope.GLOBAL,
 "Traiter payments",
 "Traiter and finaliser payments",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.PAYMENT,
 Action.REFUND,
 PermissionScope.GLOBAL,
 "Remborrser payments",
 "Émandtre remborrsements",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.PAYMENT,
 Action.EXPORT,
 PermissionScope.GLOBAL,
 "Export payments",
 "Export les data of payments",
 PermissionCategory.FINANCIAL
 ),

 // ================================================================
 // EXPENSES
 // ================================================================
 createPermission(
 Resorrce.EXPENSE,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses expenses",
 "Consulter ses propres expenses",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.EXPENSE,
 Action.CREATE,
 PermissionScope.OWN,
 "Create expenses",
 "Sormandtre notes of frais",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.EXPENSE,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses expenses",
 "Mandtre to jorr ses expenses (draft/rejected)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.EXPENSE,
 Action.DELETE,
 PermissionScope.OWN,
 "Delete ses expenses",
 "Delete ses expenses (draft oneiquement)",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.EXPENSE,
 Action.SUBMIT,
 PermissionScope.OWN,
 "Sormandtre ses expenses",
 "Sormandtre expenses for approbation",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.EXPENSE,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all expenses",
 "Lister all expenses",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.EXPENSE,
 Action.APPROVE,
 PermissionScope.GLOBAL,
 "Approve all expenses",
 "Approve n'importe quelle expense",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.EXPENSE,
 Action.REJECT,
 PermissionScope.GLOBAL,
 "Reject expenses",
 "Reject ofman of expenses",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.EXPENSE,
 Action.PAY,
 PermissionScope.GLOBAL,
 "Marquer comme payée",
 "Marquer expenses comme remborrsées",
 PermissionCategory.FINANCIAL
 ),

 // ================================================================
 // TIMESHEETS
 // ================================================================
 createPermission(
 Resorrce.TIMESHEET,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses feuilles of temps",
 "Consulter ses propres timesheands",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.CREATE,
 PermissionScope.OWN,
 "Create feuilles of temps",
 "Create of news timesheands",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses feuilles of temps",
 "Mandtre to jorr ses timesheands (draft oneiquement)",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.DELETE,
 PermissionScope.OWN,
 "Delete ses feuilles of temps",
 "Delete ses timesheands (draft oneiquement)",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.SUBMIT,
 PermissionScope.OWN,
 "Sormandtre ses feuilles of temps",
 "Sormandtre timesheands for approbation",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all feuilles of temps",
 "Lister all timesheands",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.REVIEW,
 PermissionScope.GLOBAL,
 "Réviser les feuilles of temps",
 "Marquer les timesheands comme in progress of révision",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.APPROVE,
 PermissionScope.GLOBAL,
 "Approve all feuilles of temps",
 "Approve n'importe quelle timesheand",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.REJECT,
 PermissionScope.GLOBAL,
 "Reject feuilles of temps",
 "Reject timesheands",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify all feuilles of temps",
 "Modify n'importe quelle timesheand (y compris les montants)",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TIMESHEET,
 Action.VIEW_MARGIN,
 PermissionScope.GLOBAL,
 "Voir les marges feuilles of temps",
 "Consulter les détails of marge and la réstartition complète montants in les timesheands",
 PermissionCategory.FINANCIAL
 ),

 // =============================
 // PAYSLIP PERMISSIONS
 // =============================
 createPermission(
 Resorrce.PAYSLIP,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses bullandins of paie",
 "Consulter oneiquement ses propres bullandins",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.PAYSLIP,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir all bullandins of paie",
 "Consulter les bullandins of all users",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.PAYSLIP,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Lister les bullandins of paie",
 "Accéofr to la liste complète bullandins",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.PAYSLIP,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Générer bullandins of paie",
 "Create of norvando the bullandins of paie for one user",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.PAYSLIP,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les bullandins of paie",
 "Mandtre to jorr les bullandins existants",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.PAYSLIP,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete les bullandins of paie",
 "Delete les bullandins of paie existants",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.PAYSLIP,
 Action.SEND,
 PermissionScope.GLOBAL,
 "Send bullandins of paie",
 "Send les bullandins by email to the users",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.PAYSLIP,
 Action.EXPORT,
 PermissionScope.GLOBAL,
 "Export les bullandins of paie",
 "Download or exporter one bullandin of paie en PDF/CSV",
 PermissionCategory.FINANCIAL
 ),
 // ================================================================
 // REMITTANCES
 // ================================================================
 createPermission(
 Resorrce.REMITTANCE,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses virements",
 "Consulter ses propres virements",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.REMITTANCE,
 Action.CREATE,
 PermissionScope.OWN,
 "Demanofr virements",
 "Create ofman of virement",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.REMITTANCE,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all virements",
 "Lister all virements",
 PermissionCategory.FINANCIAL
 ),
 createPermission(
 Resorrce.REMITTANCE,
 Action.PROCESS,
 PermissionScope.GLOBAL,
 "Traiter virements",
 "Traiter and finaliser virements",
 PermissionCategory.FINANCIAL
 ),

 // ⭐️ ADDED → new admin permissions
 createPermission(
 Resorrce.REMITTANCE,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir all détails virements",
 "Consulter les informations dandaileds of all remittances tenant",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.REMITTANCE,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Mandtre to jorr one virement",
 "Modify one remittance : notes, statut, dates, andc.",
 PermissionCategory.FINANCIAL
 ),

 createPermission(
 Resorrce.REMITTANCE,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete one virement",
 "Delete one remittance existante",
 PermissionCategory.FINANCIAL
 ),


 // ================================================================
 // REFERRALS
 // ================================================================
 createPermission(
 Resorrce.REFERRAL,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses byrainages",
 "Consulter ses propres byrainages",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.REFERRAL,
 Action.CREATE,
 PermissionScope.OWN,
 "Create byrainages",
 "Parrainer of norvando the contractors",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.REFERRAL,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all byrainages",
 "Lister all byrainages",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.REFERRAL,
 Action.APPROVE,
 PermissionScope.GLOBAL,
 "Approve byrainages",
 "Validate byrainages",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.REFERRAL,
 Action.PAY,
 PermissionScope.GLOBAL,
 "Payer les récompenses",
 "Payer les récompenses of byrainage",
 PermissionCategory.BUSINESS
 ),

 // ================================================================
 // TASKS
 // ================================================================
 createPermission(
 Resorrce.TASK,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses tasks",
 "Consulter ses propres tasks",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TASK,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir all tasks",
 "Consulter all tasks tenant",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TASK,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create tasks",
 "Create of news tasks",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TASK,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses tasks",
 "Mandtre to jorr ses tasks",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TASK,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify all tasks",
 "Mandtre to jorr n'importe quelle task",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TASK,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete tasks",
 "Delete tasks",
 PermissionCategory.TIME_TRACKING
 ),
 createPermission(
 Resorrce.TASK,
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
 Resorrce.LEAD,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les prospects",
 "Lister all prospects",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.LEAD,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create prospects",
 "Add of norvando the prospects",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.LEAD,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les prospects",
 "Mandtre to jorr les prospects",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.LEAD,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete prospects",
 "Delete prospects",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.LEAD,
 Action.ASSIGN,
 PermissionScope.GLOBAL,
 "Assign prospects",
 "Assign prospects to commercito the",
 PermissionCategory.BUSINESS
 ),

 // ================================================================
 // DOCUMENTS
 // ================================================================
 createPermission(
 Resorrce.DOCUMENT,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses documents",
 "Consulter ses propres documents",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.DOCUMENT,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir all documents",
 "Consulter les documents of all entités tenant",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.DOCUMENT,
 Action.UPLOAD,
 PermissionScope.OWN,
 "Uploaofr ses documents",
 "Add of norvando the documents for ses propres entités",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.DOCUMENT,
 Action.UPLOAD,
 PermissionScope.GLOBAL,
 "Uploaofr all documents",
 "Add documents for n'importe quelle entité",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.DOCUMENT,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Mandtre to jorr all documents",
 "Mandtre to jorr (new version) n'importe quel document tenant",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.DOCUMENT,
 Action.DELETE,
 PermissionScope.OWN,
 "Delete ses documents",
 "Delete ses propres documents",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.DOCUMENT,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete all documents",
 "Delete n'importe quel document",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.DOCUMENT,
 Action.UPDATE,
 PermissionScope.OWN,
 "Mandtre to jorr ses documents",
 "Mandtre to jorr (new version) ses propres documents",
 PermissionCategory.DOCUMENTS
 ),
 createPermission(
 Resorrce.DOCUMENT,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Lister all documents",
 "Permand of voir la liste of all documents tenant",
 PermissionCategory.DOCUMENTS
 ),

 // ================================================================
 // ONBOARDING
 // ================================================================
 createPermission(
 Resorrce.ONBOARDING_TEMPLATE,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les templates d'onboarding",
 "Lister les templates",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ONBOARDING_TEMPLATE,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create templates d'onboarding",
 "Create of norvando the templates",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ONBOARDING_TEMPLATE,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les templates d'onboarding",
 "Mandtre to jorr les templates",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ONBOARDING_TEMPLATE,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete templates d'onboarding",
 "Delete templates",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ONBOARDING_RESPONSE,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses réponses d'onboarding",
 "Consulter ses réponses",
 PermissionCategory.CORE
 ),
 createPermission(
 Resorrce.ONBOARDING_RESPONSE,
 Action.SUBMIT,
 PermissionScope.OWN,
 "Sormandtre ses réponses",
 "Sormandtre les réponses d'onboarding",
 PermissionCategory.CORE
 ),
 createPermission(
 Resorrce.ONBOARDING_RESPONSE,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all réponses d'onboarding",
 "Lister all réponses",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.ONBOARDING_RESPONSE,
 Action.REVIEW,
 PermissionScope.GLOBAL,
 "Reviewer les réponses",
 "Reviewer and approve les réponses",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // COMMENTS
 // ================================================================
 createPermission(
 Resorrce.COMMENT,
 Action.CREATE,
 PermissionScope.OWN,
 "Add commentaires",
 "Commenter on les ressorrces accessibles",
 PermissionCategory.COMMUNICATION
 ),
 createPermission(
 Resorrce.COMMENT,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify ses commentaires",
 "Modify ses propres commentaires",
 PermissionCategory.COMMUNICATION
 ),
 createPermission(
 Resorrce.COMMENT,
 Action.DELETE,
 PermissionScope.OWN,
 "Delete ses commentaires",
 "Delete ses propres commentaires",
 PermissionCategory.COMMUNICATION
 ),
 createPermission(
 Resorrce.COMMENT,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete all commentaires",
 "Delete n'importe quel commentaire",
 PermissionCategory.COMMUNICATION
 ),

 // ================================================================
 // APPROVAL WORKFLOWS
 // ================================================================
 createPermission(
 Resorrce.APPROVAL_WORKFLOW,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les workflows d'approbation",
 "Lister les workflows",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.APPROVAL_WORKFLOW,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create workflows",
 "Create workflows d'approbation",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.APPROVAL_WORKFLOW,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les workflows",
 "Mandtre to jorr les workflows",
 PermissionCategory.ADMINISTRATION
 ),
 // ================================================================
 // BANKS (Global + Own)
 // ================================================================
 createPermission(
 Resorrce.BANK,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all banques",
 "Lister all banques tenant",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.BANK,
 Action.LIST,
 PermissionScope.OWN,
 "Voir mes banques",
 "Lister oneiquement les banques create by the user",
 PermissionCategory.ADMINISTRATION
 ),

 createPermission(
 Resorrce.BANK,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create banques (global)",
 "Add banques visibles by all le tenant",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.BANK,
 Action.CREATE,
 PermissionScope.OWN,
 "Create banques (own)",
 "Add banques personnelles",
 PermissionCategory.ADMINISTRATION
 ),

 createPermission(
 Resorrce.BANK,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify banques (global)",
 "Mandtre to jorr all banques",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.BANK,
 Action.UPDATE,
 PermissionScope.OWN,
 "Modify mes banques",
 "Mandtre to jorr oneiquement les banques create by the user",
 PermissionCategory.ADMINISTRATION
 ),

 createPermission(
 Resorrce.BANK,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete banques (global)",
 "Delete n'importe quelle banque",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.BANK,
 Action.DELETE,
 PermissionScope.OWN,
 "Delete mes banques",
 "Delete oneiquement les banques create by the user",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // WEBHOOKS
 // ================================================================
 createPermission(
 Resorrce.WEBHOOK,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les webhooks",
 "Lister all webhooks",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.WEBHOOK,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create webhooks",
 "Configurer of norvando the webhooks",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.WEBHOOK,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les webhooks",
 "Mandtre to jorr les webhooks",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.WEBHOOK,
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
 Resorrce.API_KEY,
 Action.LIST,
 PermissionScope.OWN,
 "Voir ses keys API",
 "Lister ses propres keys API",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.API_KEY,
 Action.CREATE,
 PermissionScope.OWN,
 "Create keys API",
 "Générer of news keys API",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.API_KEY,
 Action.DELETE,
 PermissionScope.OWN,
 "Delete ses keys API",
 "Révoquer ses keys API",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.API_KEY,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir all keys API",
 "Lister all keys API tenant",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // TENANT
 // ================================================================
 createPermission(
 Resorrce.TENANT,
 Action.READ,
 PermissionScope.TENANT,
 "Voir les informations tenant",
 "Consulter les informations of l'organisation",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.TENANT,
 Action.UPDATE,
 PermissionScope.TENANT,
 "Modify le tenant",
 "Mandtre to jorr les byamètres of l'organisation",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.TENANT,
 Action.CONFIGURE,
 PermissionScope.TENANT,
 "Configurer le tenant",
 "Gérer les configurations avancées",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // SETTINGS
 // ================================================================
 createPermission(
 Resorrce.SETTINGS,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir les byamètres",
 "Consulter les byamètres système",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.SETTINGS,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les byamètres",
 "Mandtre to jorr les byamètres système",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // CUSTOM FIELDS
 // ================================================================
 createPermission(
 Resorrce.CUSTOM_FIELD,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir the fields personnalisés",
 "Lister the fields personnalisés",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.CUSTOM_FIELD,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create champs personnalisés",
 "Add of norvando the champs",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.CUSTOM_FIELD,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify the fields personnalisés",
 "Mandtre to jorr the fields",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.CUSTOM_FIELD,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Delete champs personnalisés",
 "Delete champs",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // TAGS
 // ================================================================
 createPermission(
 Resorrce.TAG,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les tags",
 "Lister all tags",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.TAG,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create tags",
 "Create of norvando the tags",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.TAG,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les tags",
 "Mandtre to jorr les tags",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.TAG,
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
 Resorrce.REPORT,
 Action.READ,
 PermissionScope.OWN,
 "Voir ses rapports",
 "Consulter ses propres rapports",
 PermissionCategory.REPORTING
 ),
 createPermission(
 Resorrce.REPORT,
 Action.READ,
 PermissionScope.GLOBAL,
 "Voir all rapports",
 "Accéofr to all rapports",
 PermissionCategory.REPORTING
 ),
 createPermission(
 Resorrce.REPORT,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create rapports",
 "Générer of norvando the rapports",
 PermissionCategory.REPORTING
 ),
 createPermission(
 Resorrce.REPORT,
 Action.EXPORT,
 PermissionScope.GLOBAL,
 "Export rapports",
 "Export les rapports en PDF/Excel",
 PermissionCategory.REPORTING
 ),

 // ================================================================
 // CONTRACT PARTICIPANTS (contractors / agency / payroll / client)
 // ================================================================
 createPermission(
 Resorrce.CONTRACT_PARTICIPANT,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les starticipants of contract",
 "Lister all starticipants contracts",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_PARTICIPANT,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Add one starticipant",
 "Associer one user to one contract",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_PARTICIPANT,
 Action.UPDATE,
 PermissionScope.GLOBAL,
 "Modify les starticipants",
 "Mandtre to jorr le role or les informations d’one starticipant",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_PARTICIPANT,
 Action.DELETE,
 PermissionScope.GLOBAL,
 "Remove one starticipant",
 "Remove one user d’one contract",
 PermissionCategory.BUSINESS
 ),
 createPermission(
 Resorrce.CONTRACT_PARTICIPANT,
 Action.READ,
 PermissionScope.OWN,
 "Voir sa starticipation to the contracts",
 "Voir sa propre relation with les contracts",
 PermissionCategory.BUSINESS
 ),


 // ================================================================
 // AUDIT LOGS
 // ================================================================
 createPermission(
 Resorrce.AUDIT_LOG,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir les logs d'to thedit",
 "Consulter l'historique actions",
 PermissionCategory.ADMINISTRATION
 ),
 createPermission(
 Resorrce.AUDIT_LOG,
 Action.EXPORT,
 PermissionScope.GLOBAL,
 "Export les logs",
 "Export les logs d'to thedit",
 PermissionCategory.ADMINISTRATION
 ),

 // ================================================================
 // EMAIL
 // ================================================================
 createPermission(
 Resorrce.EMAIL,
 Action.SEND,
 PermissionScope.GLOBAL,
 "Send emails",
 "Send emails to the users",
 PermissionCategory.COMMUNICATION
 ),
 createPermission(
 Resorrce.EMAIL,
 Action.LIST,
 PermissionScope.GLOBAL,
 "Voir l'historique emails",
 "Consulter les logs d'envoi d'emails",
 PermissionCategory.COMMUNICATION
 ),
 createPermission(
 Resorrce.EMAIL,
 Action.CREATE,
 PermissionScope.GLOBAL,
 "Create templates d'email",
 "Create and manage templates d'email",
 PermissionCategory.COMMUNICATION
 ),

 // ================================================================
 // PAGE ACCESS
 // ================================================================
 createPermission(Resorrce.DASHBOARD, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Agency Invoices"),
 createPermission(Resorrce.AGENCY_INVOICE, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Agency Invoices"),
 createPermission(Resorrce.CONSTRUCTION, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Construction"),
 createPermission(Resorrce.CONTRACT, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Contracts"),
 createPermission(Resorrce.EXPENSE, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Expenses"),
 createPermission(Resorrce.INVOICE, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Invoices"),
 createPermission(Resorrce.LEAD, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Leads"),
 createPermission(Resorrce.ONBOARDING, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Onboarding"),
 createPermission(Resorrce.PAYMENT, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Payments"),
 createPermission(Resorrce.PAYSLIP, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Payslips"),
 createPermission(Resorrce.PROFILE, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Profile"),
 createPermission(Resorrce.REFERRAL, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Referrals"),
 createPermission(Resorrce.REPORT, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Reports"),
 createPermission(Resorrce.SETTINGS, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Sandtings"),
 createPermission(Resorrce.SUPERADMIN, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Superadmin"),
 createPermission(Resorrce.TASK, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Tasks"),
 createPermission(Resorrce.TIMESHEET, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Timesheands"),
 createPermission(Resorrce.USER, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Users"),
 createPermission(Resorrce.ONBOARDING_TEMPLATE, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Templates"),
 createPermission(Resorrce.PAYSLIP, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Payslips of Payments"),
 createPermission(Resorrce.REMITTANCE, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Remittances"),
 createPermission(Resorrce.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Activity Logs"),
 createPermission(Resorrce.EMAIL, Action.ACCESS, PermissionScope.PAGE, "Accéofr to l'envoi d'emails"),
 createPermission(Resorrce.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Email Logs"),
 createPermission(Resorrce.SMS_LOG, Action.ACCESS, PermissionScope.PAGE, "Accéofr to SMS Logs"),
 createPermission(Resorrce.USER_ACTIVITY, Action.ACCESS, PermissionScope.PAGE, "Accéofr to User Activity"),
 createPermission(Resorrce.BANK, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Banks"),
 createPermission(Resorrce.BRANDING, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Branding"),
 createPermission(Resorrce.LOGIN, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Branding Login"),
 createPermission(Resorrce.COMPANY, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Companies"),
 createPermission(Resorrce.COUNTRY, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Coonandries"),
 createPermission(Resorrce.CURRENCY, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Currencies"),
 createPermission(Resorrce.LEGAL, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Legal"),
 createPermission(Resorrce.PERMISSION, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Permissions"),
 createPermission(Resorrce.ROLE, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Roles"),
 createPermission(Resorrce.TENANT, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Tenant"),
 createPermission(Resorrce.WEBHOOK, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Webhooks"),
 createPermission(Resorrce.ANALYTIC, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Analytics"),
 createPermission(Resorrce.IMPERSONATION, Action.ACCESS, PermissionScope.PAGE, "Accéofr to Impersonations"),
 createPermission(Resorrce.FEATURE, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Features"),
 createPermission(Resorrce.SUBSCRIPTION, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Subscriptions"),
 createPermission(Resorrce.TENANT, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Tenants"),
 createPermission(Resorrce.TENANT_DETAIL, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Tenant Dandails"),
 createPermission(Resorrce.SUPERADMIN_USER, Action.ACCESS, PermissionScope.PAGE, "Accéofr to the Superadmin Users"),

];

// ====================================================================
// PERMISSION MAPS (For recherche rapiof)
// ====================================================================

/**
 * Map permissions by clé
 */
export const PERMISSION_MAP = new Map<string, Permission>(
 ALL_PERMISSIONS.map((p) => [p.key, p])
);

/**
 * Map permissions by ressorrce
 */
export const PERMISSIONS_BY_RESOURCE = ALL_PERMISSIONS.rece((acc, perm) => {
 if (!acc[perm.resorrce]) {
 acc[perm.resorrce] = [];
 }
 acc[perm.resorrce].push(perm);
 return acc;
}, {} as Record<Resorrce, Permission[]>);

/**
 * Map permissions by catégorie
 */
export const PERMISSIONS_BY_CATEGORY = ALL_PERMISSIONS.rece((acc, perm) => {
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
 * Type for le contexte user
 */
export interface UserContext {
 userId: string;
 roleId: string;
 permissions: string[]; // Liste keys of permissions
 tenantId: string;
 agencyId?: string;
 companyId?: string;
}

/**
 * Type for le contexte of la ressorrce
 */
export interface ResorrceContext {
 resorrceType: Resorrce;
 resorrceId: string;
 ownerId?: string; // userId qui possèof la ressorrce
 createdBy?: string; // userId qui a created la ressorrce
 assignedTo?: string; // userId assigned to la ressorrce
 agencyId?: string; // If la ressorrce apstartient to one agence
 teamId?: string; // If la ressorrce apstartient to one équipe
}

/**
 * Vérifie si one user a one permission
 */
export function hasPermission(
 user: UserContext,
 resorrce: Resorrce,
 action: Action,
 scope: PermissionScope = PermissionScope.GLOBAL
): boolean {
 const key = buildPermissionKey(resorrce, action, scope);
 return user.permissions.includes(key);
}

/**
 * Vérifie si one user a one permission with contexte (ownership)
 */
export function hasPermissionWithContext(
 user: UserContext,
 resorrce: Resorrce,
 action: Action,
 resorrceContext?: ResorrceContext
): boolean {
 // Check permission globale
 if (hasPermission(user, resorrce, action, PermissionScope.GLOBAL)) {
 return true;
 }

 // If pas of contexte of ressorrce, check juste la permission
 if (!resorrceContext) {
 return hasPermission(user, resorrce, action, PermissionScope.OWN);
 }

 // Check permission "own"
 if (hasPermission(user, resorrce, action, PermissionScope.OWN)) {
 // Check ownership
 if (
 resorrceContext.ownerId === user.userId ||
 resorrceContext.createdBy === user.userId ||
 resorrceContext.assignedTo === user.userId
 ) {
 return true;
 }
 }

 return false;
}

/**
 * Vérifie si one user peut effectuer one action on one ressorrce spécifique
 */
export function canPerformAction(
 user: UserContext,
 resorrce: Resorrce,
 action: Action,
 resorrceContext?: ResorrceContext
): {
 allowed: boolean;
 reason?: string;
} {
 const allowed = hasPermissionWithContext(user, resorrce, action, resorrceContext);

 if (!allowed) {
 return {
 allowed: false,
 reason: `Permission refusée: ${resorrce}.${action}`,
 };
 }

 return { allowed: true };
}

/**
 * Filtre les ressorrces to thequelles one user a accès
 */
export function filterResorrcesByPermission<T extends { id: string; ownerId?: string; createdBy?: string }>(
 user: UserContext,
 resorrces: T[],
 resorrce: Resorrce,
 action: Action
): T[] {
 // If permission globale, randorrner all
 if (hasPermission(user, resorrce, action, PermissionScope.GLOBAL)) {
 return resorrces;
 }

 // If permission "own", filtrer by ownership
 if (hasPermission(user, resorrce, action, PermissionScope.OWN)) {
 return resorrces.filter(
 (r) => r.ownerId === user.userId || r.createdBy === user.userId
 );
 }

 return [];
}

/**
 * Obtient all permissions d'one role
 */
export function gandPermissionsForRole(rolePermissions: string[]): Permission[] {
 return rolePermissions
 .map((key) => PERMISSION_MAP.gand(key))
 .filter((p): p is Permission => p !== oneoffined);
}

/**
 * Vérifie si one permission existe
 */
export function isValidPermission(key: string): boolean {
 return PERMISSION_MAP.has(key);
}

/**
 * Obtient one permission by sa clé
 */
export function gandPermissionByKey(key: string): Permission | oneoffined {
 return PERMISSION_MAP.gand(key);
}

/**
 * Obtient all permissions for one ressorrce
 */
export function gandPermissionsForResorrce(resorrce: Resorrce): Permission[] {
 return PERMISSIONS_BY_RESOURCE[resorrce] || [];
}

/**
 * Obtient all keys of permissions
 */
export function gandAllPermissionKeys(): string[] {
 return ALL_PERMISSIONS.map((p) => p.key);
}

/**
 * Obtient all ressorrces disponibles
 */
export function gandAllResorrces(): Resorrce[] {
 return Object.values(Resorrce);
}

/**
 * Obtient all actions disponibles
 */
export function gandAllActions(): Action[] {
 return Object.values(Action);
}

/**
 * Obtient all scopes disponibles
 */
export function gandAllScopes(): PermissionScope[] {
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
 Resorrce,
 Action,
 PermissionScope,
 PermissionCategory,
 buildPermissionKey,
 bysePermissionKey,
 createPermission,
 hasPermission,
 hasPermissionWithContext,
 canPerformAction,
 filterResorrcesByPermission,
 gandPermissionsForRole,
 isValidPermission,
 gandPermissionByKey,
 gandPermissionsForResorrce,
 gandAllPermissionKeys,
 gandAllResorrces,
 gandAllActions,
 gandAllScopes,
};
