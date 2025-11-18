/**
 * RBAC Permissions v2 - Système de Permissions Granulaires
 * 
 * Architecture refactorisée pour séparer clairement :
 * 1. Les permissions de propriété (view_own, update_own)
 * 2. Les permissions de gestion (manage.*)
 * 3. Les permissions d'action (create, update, delete, approve, etc.)
 * 
 * Convention de nommage :
 * - {module}.view_own : L'utilisateur voit ses propres ressources
 * - {module}.manage.view_all : Admin/Manager voit toutes les ressources
 * - {module}.create : Créer une nouvelle ressource
 * - {module}.manage.{action} : Actions administratives
 */

export const PERMISSION_TREE_V2 = {
  // =================================================================
  // PROFIL PERSONNEL (Tous les utilisateurs)
  // =================================================================
  profile: {
    view: "profile.view",                      // Voir son propre profil
    update: "profile.update",                  // Modifier son profil
    documents: {
      view: "profile.documents.view",          // Voir ses documents
      upload: "profile.documents.upload",      // Uploader des documents
      delete: "profile.documents.delete",      // Supprimer ses documents
    },
  },

  // =================================================================
  // DASHBOARD
  // =================================================================
  dashboard: {
    view: "dashboard.view",                    // Accès au dashboard
    view_stats: "dashboard.view_stats",        // Voir les statistiques
  },

  // =================================================================
  // CONTRACTORS
  // =================================================================
  contractors: {
    // Permissions personnelles (pour le contractor lui-même)
    view_own: "contractors.view_own",          // Voir son propre profil contractor
    update_own: "contractors.update_own",      // Mettre à jour son profil
    
    // Permissions de gestion (admin/hr)
    manage: {
      view_all: "contractors.manage.view_all", // Voir tous les contractors
      create: "contractors.manage.create",     // Créer un contractor
      update: "contractors.manage.update",     // Modifier un contractor
      delete: "contractors.manage.delete",     // Supprimer un contractor
      change_status: "contractors.manage.change_status", // Changer le statut
      assign_to_agency: "contractors.manage.assign_to_agency", // Assigner à une agence
    },
    
    // Documents
    documents: {
      view_own: "contractors.documents.view_own",
      upload_own: "contractors.documents.upload_own",
      delete_own: "contractors.documents.delete_own",
      view_all: "contractors.documents.view_all",      // Admin voit tous les documents
      delete_all: "contractors.documents.delete_all",  // Admin supprime des documents
    },

    // Onboarding
    onboarding: {
      view_own: "contractors.onboarding.view_own",     // Voir son onboarding
      submit: "contractors.onboarding.submit",         // Soumettre l'onboarding
      view_all: "contractors.onboarding.view_all",     // Admin voit tous
      review: "contractors.onboarding.review",         // Reviewer l'onboarding
      validate: "contractors.onboarding.validate",     // Valider l'onboarding
      start: "contractors.onboarding.start",           // Démarrer l'onboarding
      update: "contractors.onboarding.update",         // Mettre à jour l'onboarding
    },
  },

  // =================================================================
  // AGENCIES
  // =================================================================
  agencies: {
    // Permissions personnelles (pour l'agency owner)
    view_own: "agencies.view_own",             // Voir sa propre agence
    update_own: "agencies.update_own",         // Modifier son agence
    
    // Permissions de gestion (admin)
    manage: {
      view_all: "agencies.manage.view_all",    // Voir toutes les agences
      create: "agencies.manage.create",        // Créer une agence
      update: "agencies.manage.update",        // Modifier une agence
      delete: "agencies.manage.delete",        // Supprimer une agence
    },

    // Gestion d'équipe (agency owner)
    team: {
      view: "agencies.team.view",              // Voir son équipe
      invite: "agencies.team.invite",          // Inviter des membres
      remove: "agencies.team.remove",          // Retirer des membres
      assign_contractor: "agencies.team.assign_contractor", // Assigner des contractors
    },

    // Notes
    notes: {
      add: "agencies.notes.add",
      view: "agencies.notes.view",
    },
  },

  // =================================================================
  // CONTRACTS
  // =================================================================
  contracts: {
    // Permissions personnelles
    view_own: "contracts.view_own",            // Voir ses propres contrats
    view: "contracts.view",                    // Permission générique de vue (pour compatibilité)
    update: "contracts.update",                // Permission générique de mise à jour (pour compatibilité)
    
    // Permissions de gestion (admin)
    manage: {
      view_all: "contracts.manage.view_all",   // Voir tous les contrats
      create: "contracts.manage.create",       // Créer un contrat
      update: "contracts.manage.update",       // Modifier un contrat
      delete: "contracts.manage.delete",       // Supprimer un contrat
      send: "contracts.manage.send",           // Envoyer un contrat
      approve: "contracts.manage.approve",     // Approuver un contrat
      reject: "contracts.manage.reject",       // Rejeter un contrat
      upload_pdf: "contracts.manage.upload_pdf",
      download_pdf: "contracts.manage.download_pdf",
      generate_reference: "contracts.manage.generate_reference",
    },
  },

  // =================================================================
  // INVOICES (Factures)
  // =================================================================
  invoices: {
    // Permissions personnelles
    view_own: "invoices.view_own",             // Voir ses propres factures
    create_own: "invoices.create_own",         // Créer ses factures (contractor)
    view: "invoices.view",                     // Permission générique de vue (pour compatibilité)
    
    // Permissions de gestion (admin/finance)
    manage: {
      view_all: "invoices.manage.view_all",    // Voir toutes les factures
      create: "invoices.manage.create",        // Créer une facture
      update: "invoices.manage.update",        // Modifier une facture
      delete: "invoices.manage.delete",        // Supprimer une facture
      send: "invoices.manage.send",            // Envoyer une facture
      mark_paid: "invoices.manage.mark_paid",  // Marquer comme payée
      export: "invoices.manage.export",        // Exporter les factures
    },
  },

  // =================================================================
  // TIMESHEETS (Feuilles de temps)
  // =================================================================
  timesheets: {
    // Permissions personnelles
    view_own: "timesheets.view_own",           // Voir ses propres timesheets
    create: "timesheets.create",               // Créer une timesheet
    update_own: "timesheets.update_own",       // Modifier sa timesheet (draft only)
    delete_own: "timesheets.delete_own",       // Supprimer sa timesheet (draft only)
    submit: "timesheets.submit",               // Soumettre pour approbation
    
    // Permissions de gestion (admin/manager)
    manage: {
      view_all: "timesheets.manage.view_all",  // Voir toutes les timesheets
      update: "timesheets.manage.update",      // Modifier n'importe quelle timesheet
      delete: "timesheets.manage.delete",      // Supprimer n'importe quelle timesheet
      approve: "timesheets.manage.approve",    // Approuver une timesheet
      reject: "timesheets.manage.reject",      // Rejeter une timesheet
    },
  },

  // =================================================================
  // EXPENSES (Dépenses)
  // =================================================================
  expenses: {
    // Permissions personnelles
    view_own: "expenses.view_own",             // Voir ses propres dépenses
    create: "expenses.create",                 // Créer une dépense
    update_own: "expenses.update_own",         // Modifier sa dépense (draft/rejected)
    delete_own: "expenses.delete_own",         // Supprimer sa dépense (draft only)
    submit: "expenses.submit",                 // Soumettre pour approbation
    
    // Permissions de gestion (admin/finance)
    manage: {
      view_all: "expenses.manage.view_all",    // Voir toutes les dépenses
      update: "expenses.manage.update",        // Modifier n'importe quelle dépense
      delete: "expenses.manage.delete",        // Supprimer n'importe quelle dépense
      approve: "expenses.manage.approve",      // Approuver une dépense
      reject: "expenses.manage.reject",        // Rejeter une dépense
      mark_paid: "expenses.manage.mark_paid",  // Marquer comme payée
    },
  },

  // =================================================================
  // PAYMENTS (Paiements)
  // =================================================================
  payments: {
    // Payslips
    payslips: {
      view_own: "payments.payslips.view_own",          // Voir ses bulletins
      view_all: "payments.payslips.view_all",          // Voir tous les bulletins
      generate: "payments.payslips.generate",          // Générer des bulletins
      send: "payments.payslips.send",                  // Envoyer des bulletins
    },
    
    // Remits (virements)
    remits: {
      view_own: "payments.remits.view_own",            // Voir ses virements
      view_all: "payments.remits.view_all",            // Voir tous les virements
      create: "payments.remits.create",                // Créer un virement
      process: "payments.remits.process",              // Traiter un virement
    },

    // Payroll
    payroll: {
      view_own: "payments.payroll.view_own",           // Voir son payroll
      view_all: "payments.payroll.view_all",           // Voir tous les payrolls
      generate: "payments.payroll.generate",           // Générer un payroll
      update: "payments.payroll.update",               // Modifier un payroll
      mark_paid: "payments.payroll.mark_paid",         // Marquer comme payé
    },
  },

  // =================================================================
  // REFERRALS (Parrainages)
  // =================================================================
  referrals: {
    view: "referrals.view",                    // Voir ses parrainages
    create: "referrals.create",                // Créer un parrainage
    track: "referrals.track",                  // Suivre ses parrainages
    
    manage: {
      view_all: "referrals.manage.view_all",   // Admin voit tous les parrainages
      update: "referrals.manage.update",       // Modifier un parrainage
      delete: "referrals.manage.delete",       // Supprimer un parrainage
      approve: "referrals.manage.approve",     // Approuver un parrainage
      pay_reward: "referrals.manage.pay_reward", // Payer les récompenses
    },
  },

  // =================================================================
  // ONBOARDING
  // =================================================================
  onboarding: {
    // Templates
    templates: {
      view: "onboarding.templates.view",
      create: "onboarding.templates.create",
      update: "onboarding.templates.update",
      delete: "onboarding.templates.delete",
    },
    
    // Questions
    questions: {
      add: "onboarding.questions.add",
      update: "onboarding.questions.update",
      delete: "onboarding.questions.delete",
    },
    
    // Responses
    responses: {
      view_own: "onboarding.responses.view_own",       // Voir ses réponses
      view_all: "onboarding.responses.view_all",       // Admin voit toutes les réponses
      submit: "onboarding.responses.submit",           // Soumettre ses réponses
      review: "onboarding.responses.review",           // Reviewer des réponses
    },
  },

  // =================================================================
  // TEAM (Gestion d'équipe)
  // =================================================================
  team: {
    view: "team.view",                         // Voir son équipe
    manage: "team.manage",                     // Gérer son équipe
    invite: "team.invite",                     // Inviter des membres
    remove: "team.remove",                     // Retirer des membres
  },

  // =================================================================
  // TASKS
  // =================================================================
  tasks: {
    view_own: "tasks.view_own",                // Voir ses propres tâches
    view_assigned: "tasks.view_assigned",      // Voir les tâches assignées
    view_all: "tasks.view_all",                // Voir toutes les tâches
    create: "tasks.create",                    // Créer une tâche
    update_own: "tasks.update_own",            // Modifier sa tâche
    update_assigned: "tasks.update_assigned",  // Modifier une tâche assignée
    delete: "tasks.delete",                    // Supprimer une tâche
    assign: "tasks.assign",                    // Assigner une tâche
    complete: "tasks.complete",                // Marquer comme complétée
  },

  // =================================================================
  // LEADS
  // =================================================================
  leads: {
    view: "leads.view",
    create: "leads.create",
    update: "leads.update",
    delete: "leads.delete",
    export: "leads.export",
    assign: "leads.assign",
  },

  // =================================================================
  // REPORTS & ANALYTICS
  // =================================================================
  reports: {
    view: "reports.view",                      // Accès aux rapports
    activity_logs: "reports.activity_logs",    // Logs d'activité
    analytics: "reports.analytics",            // Analytics
    export: "reports.export",                  // Exporter des rapports
  },

  audit: {
    view: "audit.view",                        // Voir les audit logs
    export: "audit.export",                    // Exporter les logs
  },

  // =================================================================
  // TENANT MANAGEMENT
  // =================================================================
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
    },
    
    roles: {
      view: "tenant.roles.view",
      create: "tenant.roles.create",
      update: "tenant.roles.update",
      delete: "tenant.roles.delete",
    },
    
    users: {
      view: "tenant.users.view",
      invite: "tenant.users.invite",
      create: "tenant.users.create",
      update: "tenant.users.update",
      disable: "tenant.users.disable",
      delete: "tenant.users.delete",
    },

    subscription: {
      view: "tenant.subscription.view",
      manage: "tenant.subscription.manage",
      billing: "tenant.subscription.billing",
    },

    domain: {
      manage: "tenant.domain.manage",
      verify: "tenant.domain.verify",
    },

    features: {
      view: "tenant.features.view",
      manage: "tenant.features.manage",
    },

    localization: {
      view: "tenant.localization.view",
      manage: "tenant.localization.manage",
    },

    quotas: {
      view: "tenant.quotas.view",
      manage: "tenant.quotas.manage",
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

  // =================================================================
  // SETTINGS
  // =================================================================
  settings: {
    view: "settings.view",
    update: "settings.update",
  },

  // =================================================================
  // ORGANIZATIONS (NEW - Unified model for clients, agencies, payroll partners)
  // =================================================================
  organizations: {
    // Permissions personnelles (pour un member de l'organisation)
    view_own: "organizations.view_own",             // Voir sa propre organisation
    update_own: "organizations.update_own",         // Modifier son organisation
    
    // Permissions de gestion (admin)
    manage: {
      view_all: "organizations.manage.view_all",    // Voir toutes les organisations
      create: "organizations.manage.create",        // Créer une organisation
      update: "organizations.manage.update",        // Modifier une organisation
      delete: "organizations.manage.delete",        // Supprimer une organisation
    },

    // Gestion des membres (organization owner/admin)
    members: {
      view: "organizations.members.view",           // Voir les membres
      add: "organizations.members.add",             // Ajouter des membres
      remove: "organizations.members.remove",       // Retirer des membres
      update_roles: "organizations.members.update_roles", // Modifier les rôles des membres
    },
  },

  // =================================================================
  // USER MANAGEMENT (NEW - Managing users and their roles)
  // =================================================================
  users: {
    // Permissions personnelles
    view_own: "users.view_own",                     // Voir son propre profil utilisateur
    
    // Permissions de gestion (admin)
    manage: {
      view_all: "users.manage.view_all",            // Voir tous les utilisateurs
      create: "users.manage.create",                // Créer un utilisateur
      update: "users.manage.update",                // Modifier un utilisateur
      delete: "users.manage.delete",                // Supprimer un utilisateur
      activate: "users.manage.activate",            // Activer un utilisateur
      deactivate: "users.manage.deactivate",        // Désactiver un utilisateur
      reset_password: "users.manage.reset_password", // Réinitialiser mot de passe
    },

    // Gestion des rôles
    roles: {
      view: "users.roles.view",                     // Voir les rôles des utilisateurs
      assign: "users.roles.assign",                 // Assigner des rôles
      revoke: "users.roles.revoke",                 // Révoquer des rôles
    },

    // Gestion des organisations
    organizations: {
      view: "users.organizations.view",             // Voir les organisations d'un utilisateur
      assign: "users.organizations.assign",         // Assigner à une organisation
      remove: "users.organizations.remove",         // Retirer d'une organisation
    },
  },

  // Legacy permissions (kept for backward compatibility)
  companies: {
    view: "companies.view",
    create: "companies.create",
    update: "companies.update",
    delete: "companies.delete",
  },

  banks: {
    view: "banks.view",
    create: "banks.create",
    update: "banks.update",
    delete: "banks.delete",
  },

  // =================================================================
  // PAYROLL PARTNERS (Legacy - kept for backward compatibility)
  // =================================================================
  payrollPartners: {
    // Permissions personnelles
    view_own: "payroll_partners.view_own",
    update_own: "payroll_partners.update_own",
    
    // Permissions de gestion (admin)
    manage: {
      view_all: "payroll_partners.manage.view_all",
      create: "payroll_partners.manage.create",
      update: "payroll_partners.manage.update",
      delete: "payroll_partners.manage.delete",
    },
  },

  documentTypes: {
    view: "document_types.view",
    create: "document_types.create",
    update: "document_types.update",
    delete: "document_types.delete",
  },

  webhooks: {
    view: "webhooks.view",
    create: "webhooks.create",
    update: "webhooks.update",
    delete: "webhooks.delete",
    test: "webhooks.test",
  },

  // =================================================================
  // SUPERADMIN
  // =================================================================
  superadmin: {
    tenants: {
      view_all: "superadmin.tenants.view_all",
      create: "superadmin.tenants.create",
      suspend: "superadmin.tenants.suspend",
      delete: "superadmin.tenants.delete",
      switch: "superadmin.tenants.switch",
      impersonate: "superadmin.tenants.impersonate",
      manage_quotas: "superadmin.tenants.manage_quotas",
      manage_features: "superadmin.tenants.manage_features",
      manage_subscriptions: "superadmin.tenants.manage_subscriptions",
      view_analytics: "superadmin.tenants.view_analytics",
      export_data: "superadmin.tenants.export_data",
    },
    users: {
      view_all: "superadmin.users.view_all",
      create: "superadmin.users.create",
      update: "superadmin.users.update",
      delete: "superadmin.users.delete",
    },
    system: {
      view_logs: "superadmin.system.view_logs",
      manage_settings: "superadmin.system.manage_settings",
      view_metrics: "superadmin.system.view_metrics",
      manage_templates: "superadmin.system.manage_templates",
      manage_security: "superadmin.system.manage_security",
    },
  },
} as const;

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Extract all permission keys from the permission tree
 */
function extractPermissionKeys(tree: any, prefix: string = ""): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") {
      keys.push(value);
    } else if (typeof value === "object" && value !== null) {
      keys.push(...extractPermissionKeys(value, prefix));
    }
  }
  
  return keys;
}

/**
 * Get all permission keys as a flat array
 */
export const ALL_PERMISSION_KEYS_V2 = extractPermissionKeys(PERMISSION_TREE_V2);

/**
 * Extract SuperAdmin permissions
 */
export const SUPERADMIN_PERMISSIONS_V2 = extractPermissionKeys(PERMISSION_TREE_V2.superadmin);

/**
 * Check if a permission exists in the tree
 */
export function isValidPermission(permission: string): boolean {
  return ALL_PERMISSION_KEYS_V2.includes(permission);
}

/**
 * Get permission category (e.g., "contractors", "invoices")
 */
export function getPermissionCategory(permission: string): string {
  return permission.split(".")[0];
}

/**
 * Check if permission is an "own" permission (user-scoped)
 */
export function isOwnPermission(permission: string): boolean {
  return permission.includes("_own");
}

/**
 * Check if permission is a "manage" permission (admin-scoped)
 */
export function isManagePermission(permission: string): boolean {
  return permission.includes(".manage.");
}

// =================================================================
// PERMISSION GROUPS (Pour faciliter l'attribution de rôles)
// =================================================================

export const PERMISSION_GROUPS = {
  // Groupe de base pour tous les utilisateurs
  BASE_USER: [
    "dashboard.view",
    "profile.view",
    "profile.update",
    "profile.documents.view",
    "profile.documents.upload",
  ],

  // Contractor complet
  CONTRACTOR_FULL: [
    ...extractPermissionKeys(PERMISSION_TREE_V2.profile),
    "dashboard.view",
    "contractors.view_own",
    "contractors.update_own",
    "contractors.documents.view_own",
    "contractors.documents.upload_own",
    "contractors.documents.delete_own",
    "contractors.onboarding.view_own",
    "contractors.onboarding.submit",
    "contracts.view_own",
    "invoices.view_own",
    "invoices.create_own",
    "timesheets.view_own",
    "timesheets.create",
    "timesheets.submit",
    "timesheets.update_own",
    "timesheets.delete_own",
    "expenses.view_own",
    "expenses.create",
    "expenses.submit",
    "expenses.update_own",
    "expenses.delete_own",
    "payments.payslips.view_own",
    "payments.remits.view_own",
    "payments.payroll.view_own",
    "referrals.view",
    "referrals.create",
    "referrals.track",
    "tasks.view_own",
    "tasks.update_own",
  ],

  // Agency Owner (updated for new RBAC)
  AGENCY_OWNER: [
    ...extractPermissionKeys(PERMISSION_TREE_V2.profile),
    "agencies.view_own",
    "agencies.update_own",
    "agencies.team.view",
    "agencies.team.invite",
    "agencies.team.remove",
    "agencies.team.assign_contractor",
    "organizations.view_own",
    "organizations.update_own",
    "organizations.members.view",
    "organizations.members.add",
    "organizations.members.remove",
    "contractors.manage.view_all",
    "contracts.view_own",
    "contracts.manage.view_all",
    "invoices.view_own",
    "invoices.manage.view_all",
    "timesheets.manage.view_all",
    "timesheets.manage.approve",
    "expenses.manage.view_all",
    "expenses.manage.approve",
    "team.view",
    "team.manage",
  ],

  // Organization Admin (NEW)
  ORGANIZATION_ADMIN: [
    ...extractPermissionKeys(PERMISSION_TREE_V2.profile),
    "organizations.view_own",
    "organizations.update_own",
    "organizations.members.view",
    "organizations.members.add",
    "organizations.members.remove",
    "organizations.members.update_roles",
    "users.manage.view_all",
    "users.roles.view",
    "users.roles.assign",
    "contracts.manage.view_all",
    "invoices.manage.view_all",
    "timesheets.manage.view_all",
    "expenses.manage.view_all",
    "payments.manage.view_all",
    "team.view",
    "team.manage",
  ],

  // Admin complet
  ADMIN_FULL: ALL_PERMISSION_KEYS_V2.filter(
    (p) => !p.startsWith("superadmin.")
  ),
};

export default PERMISSION_TREE_V2;
