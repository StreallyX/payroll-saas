/**
 * Scopes de permissions pour le contexte
 */
export enum PermissionScope {
  GLOBAL = "global",   // Accès à toutes les ressources du tenant
  OWN = "own",        // Accès uniquement à ses propres ressources
  TENANT = "tenant",  // Accès au niveau tenant (équivalent à global pour certaines ressources)
  PAGE = "page",
}

/**
 * Ressources disponibles dans la plateforme
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
  
  // Liste et recherche
  LIST = "list",
  SEARCH = "search",
  
  // Actions spécifiques
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
 * Type pour une permission complète
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
 * Catégories de permissions pour l'UI
 */
export enum PermissionCategory {
  CORE = "Gestion de base",
  BUSINESS = "Gestion métier",
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
 * Construit une clé de permission
 */
export function buildPermissionKey(
  resource: Resource,
  action: Action,
  scope: PermissionScope = PermissionScope.GLOBAL
): string {
  return `${resource}.${action}.${scope}`;
}

/**
 * Parse une clé de permission
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
 * Crée un objet Permission
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
// PERMISSIONS COMPLÈTES VOOR PLATEFORME DEEL-LIKE
// ====================================================================

export const ALL_PERMISSIONS: Permission[] = [

  // ================================================================
  // SUPERADMIN
  // ================================================================
  createPermission(
    Resource.SUPER_ADMIN,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir son dashboard",
    "Accéder à son tableau de bord personnel",
    PermissionCategory.CORE
  ),
  // ================================================================
  // DASHBOARD
  // ================================================================
  createPermission(
    Resource.DASHBOARD,
    Action.READ,
    PermissionScope.OWN,
    "Voir son dashboard",
    "Accéder à son tableau de bord personnel",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.DASHBOARD,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir tous les dashboards",
    "Accéder aux statistiques globales du tenant",
    PermissionCategory.REPORTING
  ),

  // ================================================================
  // USERS
  // ================================================================
  createPermission(
    Resource.USER,
    Action.READ,
    PermissionScope.OWN,
    "Voir son profil",
    "Consulter et gérer son propre profil utilisateur",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.USER,
    Action.UPDATE,
    PermissionScope.OWN,
    "Modifier son profil",
    "Mettre à jour ses informations personnelles",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.USER,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir tous les utilisateurs",
    "Lister et rechercher tous les utilisateurs du tenant",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des utilisateurs",
    "Ajouter de nouveaux utilisateurs",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les utilisateurs",
    "Mettre à jour les informations des utilisateurs",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des utilisateurs",
    "Supprimer des comptes utilisateurs",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.ACTIVATE,
    PermissionScope.GLOBAL,
    "Activer des utilisateurs",
    "Activer ou désactiver des comptes",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.USER,
    Action.IMPERSONATE,
    PermissionScope.GLOBAL,
    "Se connecter en tant qu'utilisateur",
    "Impersonner un autre utilisateur",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // ROLES
  // ================================================================
  createPermission(
    Resource.ROLE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les rôles",
    "Lister tous les rôles",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des rôles",
    "Créer de nouveaux rôles personnalisés",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier des rôles",
    "Modifier les rôles existants",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des rôles",
    "Supprimer des rôles (sauf système)",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses propres rôles",
    "Lire uniquement les rôles que l'utilisateur a créés",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.CREATE,
    PermissionScope.OWN,
    "Créer ses propres rôles",
    "Créer un rôle qui sera marqué comme appartenant à l’utilisateur",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.UPDATE,
    PermissionScope.OWN,
    "Modifier ses propres rôles",
    "Modifier uniquement les rôles que l'utilisateur a créés",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ROLE,
    Action.DELETE,
    PermissionScope.OWN,
    "Supprimer ses propres rôles",
    "Supprimer uniquement les rôles créés par l'utilisateur (hors rôles système)",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // PERMISSIONS
  // ================================================================
  createPermission(
    Resource.PERMISSION,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les permissions",
    "Lister toutes les permissions disponibles",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.PERMISSION,
    Action.ASSIGN,
    PermissionScope.GLOBAL,
    "Assigner des permissions",
    "Attribuer des permissions aux rôles",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.PERMISSION,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des permissions",
    "Créer de nouvelles permissions personnalisées",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // COMPANIES (Clients)
  // ================================================================
  createPermission(
    Resource.COMPANY,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les entreprises",
    "Lister toutes les entreprises clientes",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.COMPANY,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des entreprises",
    "Ajouter de nouvelles entreprises",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.COMPANY,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les entreprises",
    "Mettre à jour les informations des entreprises",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.COMPANY,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des entreprises",
    "Supprimer des entreprises",
    PermissionCategory.BUSINESS
  ),

  // ================================================================
  // CONTRACTS
  // ================================================================
  createPermission(
    Resource.CONTRACT,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses contrats",
    "Consulter ses propres contrats",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir tous les contrats",
    "Lister et rechercher tous les contrats",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des contrats",
    "Créer de nouveaux contrats",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.UPDATE,
    PermissionScope.OWN,
    "Modifier ses contrats",
    "Mettre à jour ses propres contrats (draft uniquement)",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier tous les contrats",
    "Mettre à jour n'importe quel contrat",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des contrats",
    "Supprimer des contrats (draft uniquement)",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Envoyer des contrats",
    "Envoyer des contrats pour signature",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.SIGN,
    PermissionScope.OWN,
    "Signer ses contrats",
    "Signer électroniquement ses contrats",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approuver des contrats",
    "Approuver et activer des contrats",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.CANCEL,
    PermissionScope.GLOBAL,
    "Annuler des contrats",
    "Annuler ou résilier des contrats",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Exporter des contrats",
    "Exporter les données de contrats",
    PermissionCategory.BUSINESS
  ),

  // ================================================================
  // CONTRACT DOCUMENTS
  // ================================================================
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses documents de contrat",
    "Consulter les documents de ses contrats",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir tous les documents de contrat",
    "Consulter tous les documents",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.UPLOAD,
    PermissionScope.OWN,
    "Uploader des documents",
    "Ajouter des documents à ses contrats",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.UPLOAD,
    PermissionScope.GLOBAL,
    "Uploader tous documents",
    "Ajouter des documents à n'importe quel contrat",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.CONTRACT_DOCUMENT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des documents",
    "Supprimer des documents de contrat",
    PermissionCategory.DOCUMENTS
  ),

  // ================================================================
  // INVOICES
  // ================================================================
  createPermission(
    Resource.INVOICE,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses factures",
    "Consulter ses propres factures",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.CREATE,
    PermissionScope.OWN,
    "Créer ses factures",
    "Créer ses propres factures (contractors)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir toutes les factures",
    "Lister et rechercher toutes les factures",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des factures",
    "Créer des factures pour n'importe quel contrat",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.UPDATE,
    PermissionScope.OWN,
    "Modifier ses factures",
    "Mettre à jour ses factures (draft uniquement)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier toutes les factures",
    "Mettre à jour n'importe quelle facture",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des factures",
    "Supprimer des factures (draft uniquement)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Envoyer des factures",
    "Envoyer des factures aux clients",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approuver des factures",
    "Valider des factures avant envoi",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.PAY,
    PermissionScope.OWN,
    "Payer ses factures",
    "Marquer ses propres factures comme payées (pour les agences)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.PAY,
    PermissionScope.GLOBAL,
    "Marquer comme payée",
    "Marquer des factures comme payées",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.INVOICE,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Exporter des factures",
    "Exporter les données de factures",
    PermissionCategory.FINANCIAL
  ),

  // ================================================================
  // PAYMENTS
  // ================================================================
  createPermission(
    Resource.PAYMENT,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses paiements",
    "Consulter ses propres paiements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir tous les paiements",
    "Lister tous les paiements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.CREATE,
    PermissionScope.TENANT,
    "Créer des paiements",
    "Créer de nouveaux paiements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.UPDATE,
    PermissionScope.TENANT,
    "Modifier les paiements",
    "Mettre à jour des paiements (y compris confirmation)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.DELETE,
    PermissionScope.TENANT,
    "Supprimer des paiements",
    "Supprimer des paiements non complétés",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.READ,
    PermissionScope.TENANT,
    "Voir les paiements",
    "Consulter les paiements du tenant",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.PROCESS,
    PermissionScope.GLOBAL,
    "Traiter des paiements",
    "Traiter et finaliser des paiements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.REFUND,
    PermissionScope.GLOBAL,
    "Rembourser des paiements",
    "Émettre des remboursements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.PAYMENT,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Exporter des paiements",
    "Exporter les données de paiements",
    PermissionCategory.FINANCIAL
  ),

  // ================================================================
  // EXPENSES
  // ================================================================
  createPermission(
    Resource.EXPENSE,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses dépenses",
    "Consulter ses propres dépenses",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.CREATE,
    PermissionScope.OWN,
    "Créer des dépenses",
    "Soumettre des notes de frais",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.UPDATE,
    PermissionScope.OWN,
    "Modifier ses dépenses",
    "Mettre à jour ses dépenses (draft/rejected)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.DELETE,
    PermissionScope.OWN,
    "Supprimer ses dépenses",
    "Supprimer ses dépenses (draft uniquement)",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.SUBMIT,
    PermissionScope.OWN,
    "Soumettre ses dépenses",
    "Soumettre des dépenses pour approbation",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir toutes les dépenses",
    "Lister toutes les dépenses",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approuver toutes les dépenses",
    "Approuver n'importe quelle dépense",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.REJECT,
    PermissionScope.GLOBAL,
    "Rejeter des dépenses",
    "Rejeter des demandes de dépenses",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.EXPENSE,
    Action.PAY,
    PermissionScope.GLOBAL,
    "Marquer comme payée",
    "Marquer des dépenses comme remboursées",
    PermissionCategory.FINANCIAL
  ),

  // ================================================================
  // TIMESHEETS
  // ================================================================
  createPermission(
    Resource.TIMESHEET,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses feuilles de temps",
    "Consulter ses propres timesheets",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.CREATE,
    PermissionScope.OWN,
    "Créer des feuilles de temps",
    "Créer de nouvelles timesheets",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.UPDATE,
    PermissionScope.OWN,
    "Modifier ses feuilles de temps",
    "Mettre à jour ses timesheets (draft uniquement)",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.DELETE,
    PermissionScope.OWN,
    "Supprimer ses feuilles de temps",
    "Supprimer ses timesheets (draft uniquement)",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.SUBMIT,
    PermissionScope.OWN,
    "Soumettre ses feuilles de temps",
    "Soumettre des timesheets pour approbation",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir toutes les feuilles de temps",
    "Lister toutes les timesheets",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approuver toutes les feuilles de temps",
    "Approuver n'importe quelle timesheet",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TIMESHEET,
    Action.REJECT,
    PermissionScope.GLOBAL,
    "Rejeter des feuilles de temps",
    "Rejeter des timesheets",
    PermissionCategory.TIME_TRACKING
  ),

  // =============================
  // PAYSLIP PERMISSIONS
  // =============================
  createPermission(
    Resource.PAYSLIP,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses bulletins de paie",
    "Consulter uniquement ses propres bulletins",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir tous les bulletins de paie",
    "Consulter les bulletins de tous les utilisateurs",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Lister les bulletins de paie",
    "Accéder à la liste complète des bulletins",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Générer des bulletins de paie",
    "Créer de nouveaux bulletins de paie pour un utilisateur",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les bulletins de paie",
    "Mettre à jour les bulletins existants",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer les bulletins de paie",
    "Supprimer les bulletins de paie existants",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.SEND,
    PermissionScope.GLOBAL,
    "Envoyer des bulletins de paie",
    "Envoyer les bulletins par email aux utilisateurs",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.PAYSLIP,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Exporter les bulletins de paie",
    "Télécharger ou exporter un bulletin de paie en PDF/CSV",
    PermissionCategory.FINANCIAL
  ),
  // ================================================================
  // REMITTANCES
  // ================================================================
  createPermission(
    Resource.REMITTANCE,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses virements",
    "Consulter ses propres virements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.REMITTANCE,
    Action.CREATE,
    PermissionScope.OWN,
    "Demander des virements",
    "Créer des demandes de virement",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.REMITTANCE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir tous les virements",
    "Lister tous les virements",
    PermissionCategory.FINANCIAL
  ),
  createPermission(
    Resource.REMITTANCE,
    Action.PROCESS,
    PermissionScope.GLOBAL,
    "Traiter des virements",
    "Traiter et finaliser des virements",
    PermissionCategory.FINANCIAL
  ),

  // ⭐️ AJOUTÉS → nouvelles permissions admin
  createPermission(
    Resource.REMITTANCE,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir tous les détails des virements",
    "Consulter les informations détaillées de toutes les remittances du tenant",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.REMITTANCE,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Mettre à jour un virement",
    "Modifier une remittance : notes, statut, dates, etc.",
    PermissionCategory.FINANCIAL
  ),

  createPermission(
    Resource.REMITTANCE,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer un virement",
    "Supprimer une remittance existante",
    PermissionCategory.FINANCIAL
  ),


  // ================================================================
  // REFERRALS
  // ================================================================
  createPermission(
    Resource.REFERRAL,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses parrainages",
    "Consulter ses propres parrainages",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.REFERRAL,
    Action.CREATE,
    PermissionScope.OWN,
    "Créer des parrainages",
    "Parrainer de nouveaux contractors",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.REFERRAL,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir tous les parrainages",
    "Lister tous les parrainages",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.REFERRAL,
    Action.APPROVE,
    PermissionScope.GLOBAL,
    "Approuver des parrainages",
    "Valider des parrainages",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.REFERRAL,
    Action.PAY,
    PermissionScope.GLOBAL,
    "Payer les récompenses",
    "Payer les récompenses de parrainage",
    PermissionCategory.BUSINESS
  ),

  // ================================================================
  // TASKS
  // ================================================================
  createPermission(
    Resource.TASK,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses tâches",
    "Consulter ses propres tâches",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir toutes les tâches",
    "Consulter toutes les tâches du tenant",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des tâches",
    "Créer de nouvelles tâches",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.UPDATE,
    PermissionScope.OWN,
    "Modifier ses tâches",
    "Mettre à jour ses tâches",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier toutes les tâches",
    "Mettre à jour n'importe quelle tâche",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des tâches",
    "Supprimer des tâches",
    PermissionCategory.TIME_TRACKING
  ),
  createPermission(
    Resource.TASK,
    Action.ASSIGN,
    PermissionScope.GLOBAL,
    "Assigner des tâches",
    "Assigner des tâches à des utilisateurs",
    PermissionCategory.TIME_TRACKING
  ),

  // ================================================================
  // LEADS
  // ================================================================
  createPermission(
    Resource.LEAD,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les prospects",
    "Lister tous les prospects",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.LEAD,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des prospects",
    "Ajouter de nouveaux prospects",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.LEAD,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les prospects",
    "Mettre à jour les prospects",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.LEAD,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des prospects",
    "Supprimer des prospects",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.LEAD,
    Action.ASSIGN,
    PermissionScope.GLOBAL,
    "Assigner des prospects",
    "Assigner des prospects à des commerciaux",
    PermissionCategory.BUSINESS
  ),

  // ================================================================
  // DOCUMENTS
  // ================================================================
  createPermission(
    Resource.DOCUMENT,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses documents",
    "Consulter ses propres documents",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir tous les documents",
    "Consulter les documents de toutes les entités du tenant",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.UPLOAD,
    PermissionScope.OWN,
    "Uploader ses documents",
    "Ajouter de nouveaux documents pour ses propres entités",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.UPLOAD,
    PermissionScope.GLOBAL,
    "Uploader tous documents",
    "Ajouter des documents pour n'importe quelle entité",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Mettre à jour tous documents",
    "Mettre à jour (nouvelle version) n'importe quel document du tenant",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.DELETE,
    PermissionScope.OWN,
    "Supprimer ses documents",
    "Supprimer ses propres documents",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer tous documents",
    "Supprimer n'importe quel document",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.UPDATE,
    PermissionScope.OWN,
    "Mettre à jour ses documents",
    "Mettre à jour (nouvelle version) ses propres documents",
    PermissionCategory.DOCUMENTS
  ),
  createPermission(
    Resource.DOCUMENT,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Lister tous les documents",
    "Permet de voir la liste de tous les documents du tenant",
    PermissionCategory.DOCUMENTS
  ),

  // ================================================================
  // ONBOARDING
  // ================================================================
  createPermission(
    Resource.ONBOARDING_TEMPLATE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les templates d'onboarding",
    "Lister les templates",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_TEMPLATE,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des templates d'onboarding",
    "Créer de nouveaux templates",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_TEMPLATE,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les templates d'onboarding",
    "Mettre à jour les templates",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_TEMPLATE,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des templates d'onboarding",
    "Supprimer des templates",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_RESPONSE,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses réponses d'onboarding",
    "Consulter ses réponses",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.ONBOARDING_RESPONSE,
    Action.SUBMIT,
    PermissionScope.OWN,
    "Soumettre ses réponses",
    "Soumettre les réponses d'onboarding",
    PermissionCategory.CORE
  ),
  createPermission(
    Resource.ONBOARDING_RESPONSE,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir toutes les réponses d'onboarding",
    "Lister toutes les réponses",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.ONBOARDING_RESPONSE,
    Action.REVIEW,
    PermissionScope.GLOBAL,
    "Reviewer les réponses",
    "Reviewer et approuver les réponses",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // COMMENTS
  // ================================================================
  createPermission(
    Resource.COMMENT,
    Action.CREATE,
    PermissionScope.OWN,
    "Ajouter des commentaires",
    "Commenter sur les ressources accessibles",
    PermissionCategory.COMMUNICATION
  ),
  createPermission(
    Resource.COMMENT,
    Action.UPDATE,
    PermissionScope.OWN,
    "Modifier ses commentaires",
    "Modifier ses propres commentaires",
    PermissionCategory.COMMUNICATION
  ),
  createPermission(
    Resource.COMMENT,
    Action.DELETE,
    PermissionScope.OWN,
    "Supprimer ses commentaires",
    "Supprimer ses propres commentaires",
    PermissionCategory.COMMUNICATION
  ),
  createPermission(
    Resource.COMMENT,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer tous commentaires",
    "Supprimer n'importe quel commentaire",
    PermissionCategory.COMMUNICATION
  ),

  // ================================================================
  // APPROVAL WORKFLOWS
  // ================================================================
  createPermission(
    Resource.APPROVAL_WORKFLOW,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les workflows d'approbation",
    "Lister les workflows",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.APPROVAL_WORKFLOW,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des workflows",
    "Créer des workflows d'approbation",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.APPROVAL_WORKFLOW,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les workflows",
    "Mettre à jour les workflows",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // BANKS
  // ================================================================
  createPermission(
    Resource.BANK,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les banques",
    "Lister toutes les banques",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.BANK,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des banques",
    "Ajouter de nouvelles banques",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.BANK,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les banques",
    "Mettre à jour les informations bancaires",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.BANK,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des banques",
    "Supprimer des banques",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // WEBHOOKS
  // ================================================================
  createPermission(
    Resource.WEBHOOK,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les webhooks",
    "Lister tous les webhooks",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.WEBHOOK,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des webhooks",
    "Configurer de nouveaux webhooks",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.WEBHOOK,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les webhooks",
    "Mettre à jour les webhooks",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.WEBHOOK,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des webhooks",
    "Supprimer des webhooks",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // API KEYS
  // ================================================================
  createPermission(
    Resource.API_KEY,
    Action.LIST,
    PermissionScope.OWN,
    "Voir ses clés API",
    "Lister ses propres clés API",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.API_KEY,
    Action.CREATE,
    PermissionScope.OWN,
    "Créer des clés API",
    "Générer de nouvelles clés API",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.API_KEY,
    Action.DELETE,
    PermissionScope.OWN,
    "Supprimer ses clés API",
    "Révoquer ses clés API",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.API_KEY,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir toutes les clés API",
    "Lister toutes les clés API du tenant",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // TENANT
  // ================================================================
  createPermission(
    Resource.TENANT,
    Action.READ,
    PermissionScope.TENANT,
    "Voir les informations du tenant",
    "Consulter les informations de l'organisation",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TENANT,
    Action.UPDATE,
    PermissionScope.TENANT,
    "Modifier le tenant",
    "Mettre à jour les paramètres de l'organisation",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TENANT,
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
    Resource.SETTINGS,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir les paramètres",
    "Consulter les paramètres système",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.SETTINGS,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les paramètres",
    "Mettre à jour les paramètres système",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // CUSTOM FIELDS
  // ================================================================
  createPermission(
    Resource.CUSTOM_FIELD,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les champs personnalisés",
    "Lister les champs personnalisés",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.CUSTOM_FIELD,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des champs personnalisés",
    "Ajouter de nouveaux champs",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.CUSTOM_FIELD,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les champs personnalisés",
    "Mettre à jour les champs",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.CUSTOM_FIELD,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des champs personnalisés",
    "Supprimer des champs",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // TAGS
  // ================================================================
  createPermission(
    Resource.TAG,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les tags",
    "Lister tous les tags",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TAG,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des tags",
    "Créer de nouveaux tags",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TAG,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les tags",
    "Mettre à jour les tags",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.TAG,
    Action.DELETE,
    PermissionScope.GLOBAL,
    "Supprimer des tags",
    "Supprimer des tags",
    PermissionCategory.ADMINISTRATION
  ),

  // ================================================================
  // REPORTS
  // ================================================================
  createPermission(
    Resource.REPORT,
    Action.READ,
    PermissionScope.OWN,
    "Voir ses rapports",
    "Consulter ses propres rapports",
    PermissionCategory.REPORTING
  ),
  createPermission(
    Resource.REPORT,
    Action.READ,
    PermissionScope.GLOBAL,
    "Voir tous les rapports",
    "Accéder à tous les rapports",
    PermissionCategory.REPORTING
  ),
  createPermission(
    Resource.REPORT,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Créer des rapports",
    "Générer de nouveaux rapports",
    PermissionCategory.REPORTING
  ),
  createPermission(
    Resource.REPORT,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Exporter des rapports",
    "Exporter les rapports en PDF/Excel",
    PermissionCategory.REPORTING
  ),

  // ================================================================
  // CONTRACT PARTICIPANTS (contractors / agency / payroll / client)
  // ================================================================
  createPermission(
    Resource.CONTRACT_PARTICIPANT,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les participants de contrat",
    "Lister tous les participants des contrats",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_PARTICIPANT,
    Action.CREATE,
    PermissionScope.GLOBAL,
    "Ajouter un participant",
    "Associer un utilisateur à un contrat",
    PermissionCategory.BUSINESS
  ),
  createPermission(
    Resource.CONTRACT_PARTICIPANT,
    Action.UPDATE,
    PermissionScope.GLOBAL,
    "Modifier les participants",
    "Mettre à jour le rôle ou les informations d’un participant",
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
    "Voir sa participation aux contrats",
    "Voir sa propre relation avec les contrats",
    PermissionCategory.BUSINESS
  ),


  // ================================================================
  // AUDIT LOGS
  // ================================================================
  createPermission(
    Resource.AUDIT_LOG,
    Action.LIST,
    PermissionScope.GLOBAL,
    "Voir les logs d'audit",
    "Consulter l'historique des actions",
    PermissionCategory.ADMINISTRATION
  ),
  createPermission(
    Resource.AUDIT_LOG,
    Action.EXPORT,
    PermissionScope.GLOBAL,
    "Exporter les logs",
    "Exporter les logs d'audit",
    PermissionCategory.ADMINISTRATION
  ),

  createPermission(Resource.DASHBOARD, Action.ACCESS, PermissionScope.PAGE, "Accéder à Agency Invoices"),
  createPermission(Resource.AGENCY_INVOICE, Action.ACCESS, PermissionScope.PAGE, "Accéder à Agency Invoices"),
  createPermission(Resource.CONSTRUCTION, Action.ACCESS, PermissionScope.PAGE, "Accéder à Construction"),
  createPermission(Resource.CONTRACT, Action.ACCESS, PermissionScope.PAGE, "Accéder à Contracts"),
  createPermission(Resource.EXPENSE, Action.ACCESS, PermissionScope.PAGE, "Accéder à Expenses"),
  createPermission(Resource.INVOICE, Action.ACCESS, PermissionScope.PAGE, "Accéder à Invoices"),
  createPermission(Resource.LEAD, Action.ACCESS, PermissionScope.PAGE, "Accéder à Leads"),
  createPermission(Resource.ONBOARDING, Action.ACCESS, PermissionScope.PAGE, "Accéder à Onboarding"),
  createPermission(Resource.PAYMENT, Action.ACCESS, PermissionScope.PAGE, "Accéder à Payments"),
  createPermission(Resource.PAYSLIP, Action.ACCESS, PermissionScope.PAGE, "Accéder à Payslips"),
  createPermission(Resource.PROFILE, Action.ACCESS, PermissionScope.PAGE, "Accéder à Profile"),
  createPermission(Resource.REFERRAL, Action.ACCESS, PermissionScope.PAGE, "Accéder à Referrals"),
  createPermission(Resource.REPORT, Action.ACCESS, PermissionScope.PAGE, "Accéder à Reports"),
  createPermission(Resource.SETTINGS, Action.ACCESS, PermissionScope.PAGE, "Accéder à Settings"),
  createPermission(Resource.SUPERADMIN, Action.ACCESS, PermissionScope.PAGE, "Accéder à Superadmin"),
  createPermission(Resource.TASK, Action.ACCESS, PermissionScope.PAGE, "Accéder à Tasks"),
  createPermission(Resource.TIMESHEET, Action.ACCESS, PermissionScope.PAGE, "Accéder à Timesheets"),
  createPermission(Resource.USER, Action.ACCESS, PermissionScope.PAGE, "Accéder à Users"),
  createPermission(Resource.ONBOARDING_TEMPLATE, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Templates"),
  createPermission(Resource.PAYSLIP, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Payslips de Payments"),
  createPermission(Resource.REMITTANCE, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Remittances"),
  createPermission(Resource.ACTIVITY_LOG, Action.ACCESS, PermissionScope.PAGE, "Accéder à Activity Logs"),
  createPermission(Resource.EMAIL_LOG, Action.ACCESS, PermissionScope.PAGE, "Accéder à Email Logs"),
  createPermission(Resource.SMS_LOG, Action.ACCESS, PermissionScope.PAGE, "Accéder à SMS Logs"),
  createPermission(Resource.USER_ACTIVITY, Action.ACCESS, PermissionScope.PAGE, "Accéder à User Activity"),
  createPermission(Resource.BANK, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Banks"),
  createPermission(Resource.BRANDING, Action.ACCESS, PermissionScope.PAGE, "Accéder à Branding"),
  createPermission(Resource.LOGIN, Action.ACCESS, PermissionScope.PAGE, "Accéder à Branding Login"),
  createPermission(Resource.COMPANY, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Companies"),
  createPermission(Resource.COUNTRY, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Countries"),
  createPermission(Resource.CURRENCY, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Currencies"),
  createPermission(Resource.LEGAL, Action.ACCESS, PermissionScope.PAGE, "Accéder au Legal"),
  createPermission(Resource.PERMISSION, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Permissions"),
  createPermission(Resource.ROLE, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Roles"),
  createPermission(Resource.TENANT, Action.ACCESS, PermissionScope.PAGE, "Accéder au Tenant"),
  createPermission(Resource.WEBHOOK, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Webhooks"),
  createPermission(Resource.ANALYTIC, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Analytics"),
  createPermission(Resource.IMPERSONATION, Action.ACCESS, PermissionScope.PAGE, "Accéder à Impersonations"),
  createPermission(Resource.FEATURE, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Features"),
  createPermission(Resource.SUBSCRIPTION, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Subscriptions"),
  createPermission(Resource.TENANT, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Tenants"),
  createPermission(Resource.TENANT_DETAIL, Action.ACCESS, PermissionScope.PAGE, "Accéder au Tenant Details"),
  createPermission(Resource.SUPERADMIN_USER, Action.ACCESS, PermissionScope.PAGE, "Accéder aux Superadmin Users"),

];

// ====================================================================
// PERMISSION MAPS (Pour recherche rapide)
// ====================================================================

/**
 * Map des permissions par clé
 */
export const PERMISSION_MAP = new Map<string, Permission>(
  ALL_PERMISSIONS.map((p) => [p.key, p])
);

/**
 * Map des permissions par ressource
 */
export const PERMISSIONS_BY_RESOURCE = ALL_PERMISSIONS.reduce((acc, perm) => {
  if (!acc[perm.resource]) {
    acc[perm.resource] = [];
  }
  acc[perm.resource].push(perm);
  return acc;
}, {} as Record<Resource, Permission[]>);

/**
 * Map des permissions par catégorie
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
// HELPER FUNCTIONS POUR VÉRIFICATION DES PERMISSIONS
// ====================================================================

/**
 * Type pour le contexte utilisateur
 */
export interface UserContext {
  userId: string;
  roleId: string;
  permissions: string[]; // Liste des clés de permissions
  tenantId: string;
  agencyId?: string;
  companyId?: string;
}

/**
 * Type pour le contexte de la ressource
 */
export interface ResourceContext {
  resourceType: Resource;
  resourceId: string;
  ownerId?: string; // userId qui possède la ressource
  createdBy?: string; // userId qui a créé la ressource
  assignedTo?: string; // userId assigné à la ressource
  agencyId?: string; // Si la ressource appartient à une agence
  teamId?: string; // Si la ressource appartient à une équipe
}

/**
 * Vérifie si un utilisateur a une permission
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
 * Vérifie si un utilisateur a une permission avec contexte (ownership)
 */
export function hasPermissionWithContext(
  user: UserContext,
  resource: Resource,
  action: Action,
  resourceContext?: ResourceContext
): boolean {
  // Vérifier permission globale
  if (hasPermission(user, resource, action, PermissionScope.GLOBAL)) {
    return true;
  }

  // Si pas de contexte de ressource, vérifier juste la permission
  if (!resourceContext) {
    return hasPermission(user, resource, action, PermissionScope.OWN);
  }

  // Vérifier permission "own"
  if (hasPermission(user, resource, action, PermissionScope.OWN)) {
    // Vérifier ownership
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
 * Vérifie si un utilisateur peut effectuer une action sur une ressource spécifique
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
      reason: `Permission refusée: ${resource}.${action}`,
    };
  }

  return { allowed: true };
}

/**
 * Filtre les ressources auxquelles un utilisateur a accès
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

  // Si permission "own", filtrer par ownership
  if (hasPermission(user, resource, action, PermissionScope.OWN)) {
    return resources.filter(
      (r) => r.ownerId === user.userId || r.createdBy === user.userId
    );
  }

  return [];
}

/**
 * Obtient toutes les permissions d'un rôle
 */
export function getPermissionsForRole(rolePermissions: string[]): Permission[] {
  return rolePermissions
    .map((key) => PERMISSION_MAP.get(key))
    .filter((p): p is Permission => p !== undefined);
}

/**
 * Vérifie si une permission existe
 */
export function isValidPermission(key: string): boolean {
  return PERMISSION_MAP.has(key);
}

/**
 * Obtient une permission par sa clé
 */
export function getPermissionByKey(key: string): Permission | undefined {
  return PERMISSION_MAP.get(key);
}

/**
 * Obtient toutes les permissions pour une ressource
 */
export function getPermissionsForResource(resource: Resource): Permission[] {
  return PERMISSIONS_BY_RESOURCE[resource] || [];
}

/**
 * Obtient toutes les clés de permissions
 */
export function getAllPermissionKeys(): string[] {
  return ALL_PERMISSIONS.map((p) => p.key);
}

/**
 * Obtient toutes les ressources disponibles
 */
export function getAllResources(): Resource[] {
  return Object.values(Resource);
}

/**
 * Obtient toutes les actions disponibles
 */
export function getAllActions(): Action[] {
  return Object.values(Action);
}

/**
 * Obtient tous les scopes disponibles
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
