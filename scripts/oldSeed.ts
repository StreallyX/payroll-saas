
/**
 * ====================================================================
 * SEED RBAC - Données Initiales pour le Système RBAC
 * ====================================================================
 * 
 * Ce fichier initialise:
 * 1. Toutes les permissions de la plateforme
 * 2. Les rôles par défaut (SUPER_ADMIN, ADMIN, CONTRACTOR, etc.)
 * 3. L'attribution des permissions aux rôles
 * 4. Des exemples de données de test
 * 
 * Usage:
 * ```bash
 * npx prisma db seed
 * ```
 * ou
 * ```typescript
 * import { seedRBAC } from './seed-rbac';
 * await seedRBAC(prisma);
 * ```
 * ====================================================================
 */

import { PrismaClient } from "@prisma/client";
import {
  ALL_PERMISSIONS,
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../server/rbac/permissions-v2";

// ====================================================================
// DÉFINITION DES RÔLES PAR DÉFAUT
// ====================================================================

/**
 * Rôles système de la plateforme
 */
export const DEFAULT_ROLES = [
  {
    name: "SUPER_ADMIN",
    displayName: "Super Administrateur",
    description:
      "Accès complet à toutes les fonctionnalités de la plateforme",
    level: 100,
    homePath: "/admin/dashboard",
    color: "#dc2626",
    icon: "shield",
    isSystem: true,
  },
  {
    name: "ADMIN",
    displayName: "Administrateur",
    description: "Gestion complète du tenant et des utilisateurs",
    level: 90,
    homePath: "/admin/dashboard",
    color: "#ea580c",
    icon: "user-cog",
    isSystem: true,
  },
  {
    name: "ACCOUNTANT",
    displayName: "Comptable",
    description: "Gestion financière complète (factures, paiements, dépenses)",
    level: 80,
    homePath: "/finance/dashboard",
    color: "#16a34a",
    icon: "calculator",
    isSystem: true,
  },
  {
    name: "HR_MANAGER",
    displayName: "Responsable RH",
    description: "Gestion des contractors, contrats et onboarding",
    level: 70,
    homePath: "/hr/dashboard",
    color: "#7c3aed",
    icon: "users",
    isSystem: true,
  },
  {
    name: "AGENCY_OWNER",
    displayName: "Propriétaire d'Agence",
    description: "Gestion de son agence et de ses contractors",
    level: 60,
    homePath: "/agency/dashboard",
    color: "#2563eb",
    icon: "building",
    isSystem: true,
  },
  {
    name: "AGENCY_MANAGER",
    displayName: "Manager d'Agence",
    description: "Gestion des contractors de l'agence",
    level: 50,
    homePath: "/agency/contractors",
    color: "#0891b2",
    icon: "briefcase",
    isSystem: true,
  },
  {
    name: "CLIENT",
    displayName: "Client",
    description: "Accès aux contrats et factures de son entreprise",
    level: 40,
    homePath: "/client/dashboard",
    color: "#4f46e5",
    icon: "building-columns",
    isSystem: true,
  },
  {
    name: "CONTRACTOR",
    displayName: "Freelance/Contractor",
    description: "Accès à ses contrats, factures, timesheets et dépenses",
    level: 30,
    homePath: "/contractor/dashboard",
    color: "#059669",
    icon: "user",
    isSystem: true,
  },
  {
    name: "PAYROLL_MANAGER",
    displayName: "Gestionnaire de Paie",
    description: "Gestion de la paie et des virements",
    level: 75,
    homePath: "/payroll/dashboard",
    color: "#d97706",
    icon: "money-check",
    isSystem: true,
  },
  {
    name: "VIEWER",
    displayName: "Observateur",
    description: "Accès en lecture seule",
    level: 10,
    homePath: "/dashboard",
    color: "#64748b",
    icon: "eye",
    isSystem: true,
  },
] as const;

// ====================================================================
// ATTRIBUTION DES PERMISSIONS AUX RÔLES
// ====================================================================

/**
 * Map des permissions par rôle
 * Clé: nom du rôle
 * Valeur: array de clés de permissions
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  /**
   * SUPER_ADMIN - Toutes les permissions
   */
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.key),

  /**
   * ADMIN - Toutes les permissions sauf certaines super admin
   */
  ADMIN: ALL_PERMISSIONS.filter(
    (p) =>
      // Exclure les permissions d'impersonation
      p.action !== Action.IMPERSONATE &&
      // Garder tout le reste
      true
  ).map((p) => p.key),

  /**
   * ACCOUNTANT - Finance et comptabilité
   */
  ACCOUNTANT: [
    // Dashboard
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.GLOBAL),

    // Profil personnel
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // Invoices - Complet
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.SEND, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.APPROVE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.PAY, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.EXPORT, PermissionScope.GLOBAL),

    // Payments - Complet
    buildPermissionKey(Resource.PAYMENT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.PROCESS, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.REFUND, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.EXPORT, PermissionScope.GLOBAL),

    // Expenses - Approbation
    buildPermissionKey(Resource.EXPENSE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.APPROVE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.REJECT, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.PAY, PermissionScope.GLOBAL),

    // Payslips
    buildPermissionKey(Resource.PAYSLIP, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYSLIP, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYSLIP, Action.SEND, PermissionScope.GLOBAL),

    // Remittances
    buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.REMITTANCE, Action.PROCESS, PermissionScope.GLOBAL),

    // Contracts - Lecture seule
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.GLOBAL),

    // Contractors - Lecture seule
    buildPermissionKey(Resource.CONTRACTOR, Action.LIST, PermissionScope.GLOBAL),

    // Banks
    buildPermissionKey(Resource.BANK, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.BANK, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.BANK, Action.UPDATE, PermissionScope.GLOBAL),

    // Reports
    buildPermissionKey(Resource.REPORT, Action.READ, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.REPORT, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.REPORT, Action.EXPORT, PermissionScope.GLOBAL),

    // Comments
    buildPermissionKey(Resource.COMMENT, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.DELETE, PermissionScope.OWN),
  ],

  /**
   * HR_MANAGER - Gestion RH
   */
  HR_MANAGER: [
    // Dashboard
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.GLOBAL),

    // Profil
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // Users - Gestion
    buildPermissionKey(Resource.USER, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.ACTIVATE, PermissionScope.GLOBAL),

    // Contractors - Complet
    buildPermissionKey(Resource.CONTRACTOR, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACTOR, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACTOR, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACTOR, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACTOR, Action.ASSIGN, PermissionScope.GLOBAL),

    // Companies
    buildPermissionKey(Resource.COMPANY, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.COMPANY, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.COMPANY, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.COMPANY, Action.DELETE, PermissionScope.GLOBAL),

    // Agencies
    buildPermissionKey(Resource.AGENCY, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.AGENCY, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.AGENCY, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.AGENCY, Action.DELETE, PermissionScope.GLOBAL),

    // Payroll Partners
    buildPermissionKey(Resource.PAYROLL_PARTNER, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYROLL_PARTNER, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYROLL_PARTNER, Action.UPDATE, PermissionScope.GLOBAL),

    // Contracts - Complet
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.SEND, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.APPROVE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.CANCEL, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.EXPORT, PermissionScope.GLOBAL),

    // Contract Documents
    buildPermissionKey(Resource.CONTRACT_DOCUMENT, Action.READ, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT_DOCUMENT, Action.UPLOAD, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT_DOCUMENT, Action.DELETE, PermissionScope.GLOBAL),

    // Onboarding - Complet
    buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.ONBOARDING_TEMPLATE, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.REVIEW, PermissionScope.GLOBAL),

    // Documents
    buildPermissionKey(Resource.DOCUMENT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.DOCUMENT, Action.UPLOAD, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.DOCUMENT, Action.DELETE, PermissionScope.GLOBAL),

    // Tasks
    buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.TASK, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.TASK, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.TASK, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.TASK, Action.ASSIGN, PermissionScope.GLOBAL),

    // Leads
    buildPermissionKey(Resource.LEAD, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.LEAD, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.LEAD, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.LEAD, Action.ASSIGN, PermissionScope.GLOBAL),

    // Reports
    buildPermissionKey(Resource.REPORT, Action.READ, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.REPORT, Action.EXPORT, PermissionScope.GLOBAL),

    // Comments
    buildPermissionKey(Resource.COMMENT, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.DELETE, PermissionScope.OWN),
  ],

  /**
   * AGENCY_OWNER - Gestion de son agence
   */
  AGENCY_OWNER: [
    // Dashboard
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),

    // Profil
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // Son agence
    buildPermissionKey(Resource.AGENCY, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.AGENCY, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.AGENCY, Action.INVITE, PermissionScope.OWN),
    buildPermissionKey(Resource.AGENCY, Action.REMOVE, PermissionScope.OWN),

    // Contractors de son équipe
    buildPermissionKey(Resource.CONTRACTOR, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.CONTRACTOR, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACTOR, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACTOR, Action.ASSIGN, PermissionScope.GLOBAL),

    // Contracts de son équipe
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.CONTRACT, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.SEND, PermissionScope.GLOBAL),

    // Invoices de son équipe
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.GLOBAL),

    // Timesheets de son équipe
    buildPermissionKey(Resource.TIMESHEET, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.TIMESHEET, Action.APPROVE, PermissionScope.TEAM),
    buildPermissionKey(Resource.TIMESHEET, Action.REJECT, PermissionScope.GLOBAL),

    // Expenses de son équipe
    buildPermissionKey(Resource.EXPENSE, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.EXPENSE, Action.APPROVE, PermissionScope.TEAM),
    buildPermissionKey(Resource.EXPENSE, Action.REJECT, PermissionScope.GLOBAL),

    // Tasks
    buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.TASK, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.TASK, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.TASK, Action.ASSIGN, PermissionScope.GLOBAL),

    // Comments
    buildPermissionKey(Resource.COMMENT, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.DELETE, PermissionScope.OWN),

    // Reports
    buildPermissionKey(Resource.REPORT, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.REPORT, Action.EXPORT, PermissionScope.GLOBAL),
  ],

  /**
   * AGENCY_MANAGER - Manager d'agence (moins de permissions)
   */
  AGENCY_MANAGER: [
    // Dashboard
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),

    // Profil
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // Son agence (lecture seule)
    buildPermissionKey(Resource.AGENCY, Action.READ, PermissionScope.OWN),

    // Contractors de son équipe
    buildPermissionKey(Resource.CONTRACTOR, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.CONTRACTOR, Action.UPDATE, PermissionScope.GLOBAL),

    // Contracts de son équipe
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.CONTRACT, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.UPDATE, PermissionScope.GLOBAL),

    // Invoices de son équipe
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.GLOBAL),

    // Timesheets de son équipe
    buildPermissionKey(Resource.TIMESHEET, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.TIMESHEET, Action.APPROVE, PermissionScope.TEAM),

    // Expenses de son équipe
    buildPermissionKey(Resource.EXPENSE, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.EXPENSE, Action.APPROVE, PermissionScope.TEAM),

    // Tasks
    buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.TASK, Action.UPDATE, PermissionScope.OWN),

    // Comments
    buildPermissionKey(Resource.COMMENT, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.UPDATE, PermissionScope.OWN),
  ],

  /**
   * CLIENT - Accès aux données de son entreprise
   */
  CLIENT: [
    // Dashboard
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),

    // Profil
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // Son entreprise
    buildPermissionKey(Resource.COMPANY, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.COMPANY, Action.UPDATE, PermissionScope.OWN),

    // Contracts de son entreprise
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.SIGN, PermissionScope.OWN),

    // Contract Documents
    buildPermissionKey(Resource.CONTRACT_DOCUMENT, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACT_DOCUMENT, Action.UPLOAD, PermissionScope.OWN),

    // Invoices de son entreprise
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.TEAM),
    buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.GLOBAL),

    // Payments de son entreprise
    buildPermissionKey(Resource.PAYMENT, Action.LIST, PermissionScope.TEAM),

    // Documents
    buildPermissionKey(Resource.DOCUMENT, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.DOCUMENT, Action.UPLOAD, PermissionScope.OWN),

    // Comments
    buildPermissionKey(Resource.COMMENT, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.UPDATE, PermissionScope.OWN),
  ],

  /**
   * CONTRACTOR - Freelance complet
   */
  CONTRACTOR: [
    // Dashboard
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),

    // Profil
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // Son profil contractor
    buildPermissionKey(Resource.CONTRACTOR, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACTOR, Action.UPDATE, PermissionScope.OWN),

    // Ses contrats
    buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACT, Action.SIGN, PermissionScope.OWN),

    // Contract Documents
    buildPermissionKey(Resource.CONTRACT_DOCUMENT, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACT_DOCUMENT, Action.UPLOAD, PermissionScope.OWN),

    // Ses factures
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.OWN),

    // Ses timesheets
    buildPermissionKey(Resource.TIMESHEET, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.DELETE, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.SUBMIT, PermissionScope.OWN),

    // Ses dépenses
    buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.DELETE, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.SUBMIT, PermissionScope.OWN),

    // Ses bulletins de paie
    buildPermissionKey(Resource.PAYSLIP, Action.READ, PermissionScope.OWN),

    // Ses virements
    buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.REMITTANCE, Action.CREATE, PermissionScope.OWN),

    // Ses parrainages
    buildPermissionKey(Resource.REFERRAL, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.REFERRAL, Action.CREATE, PermissionScope.OWN),

    // Ses tâches
    buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.TASK, Action.UPDATE, PermissionScope.OWN),

    // Ses documents
    buildPermissionKey(Resource.DOCUMENT, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.DOCUMENT, Action.UPLOAD, PermissionScope.OWN),
    buildPermissionKey(Resource.DOCUMENT, Action.DELETE, PermissionScope.OWN),

    // Onboarding
    buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.ONBOARDING_RESPONSE, Action.SUBMIT, PermissionScope.OWN),

    // Comments
    buildPermissionKey(Resource.COMMENT, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMMENT, Action.DELETE, PermissionScope.OWN),

    // Reports personnels
    buildPermissionKey(Resource.REPORT, Action.READ, PermissionScope.OWN),
  ],

  /**
   * PAYROLL_MANAGER - Gestion de la paie
   */
  PAYROLL_MANAGER: [
    // Dashboard
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.GLOBAL),

    // Profil
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // Contractors (lecture)
    buildPermissionKey(Resource.CONTRACTOR, Action.LIST, PermissionScope.GLOBAL),

    // Contracts (lecture)
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.GLOBAL),

    // Payslips - Complet
    buildPermissionKey(Resource.PAYSLIP, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYSLIP, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYSLIP, Action.SEND, PermissionScope.GLOBAL),

    // Payments
    buildPermissionKey(Resource.PAYMENT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.PROCESS, PermissionScope.GLOBAL),

    // Remittances
    buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.REMITTANCE, Action.PROCESS, PermissionScope.GLOBAL),

    // Timesheets (lecture et approbation)
    buildPermissionKey(Resource.TIMESHEET, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.TIMESHEET, Action.APPROVE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.TIMESHEET, Action.REJECT, PermissionScope.GLOBAL),

    // Expenses (pour calcul de paie)
    buildPermissionKey(Resource.EXPENSE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.PAY, PermissionScope.GLOBAL),

    // Banks
    buildPermissionKey(Resource.BANK, Action.LIST, PermissionScope.GLOBAL),

    // Reports
    buildPermissionKey(Resource.REPORT, Action.READ, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.REPORT, Action.EXPORT, PermissionScope.GLOBAL),
  ],

  /**
   * VIEWER - Lecture seule
   */
  VIEWER: [
    // Dashboard
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),

    // Profil
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // Lecture seule sur tout
    buildPermissionKey(Resource.CONTRACTOR, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.COMPANY, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.AGENCY, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.TIMESHEET, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.REPORT, Action.READ, PermissionScope.GLOBAL),
  ],
};

// ====================================================================
// FONCTION PRINCIPALE DE SEED
// ====================================================================

export async function seedRBAC(prisma: PrismaClient, tenantId: string) {
  console.log("🌱 Début du seed RBAC...");

  // ================================================================
  // 1. CRÉER TOUTES LES PERMISSIONS
  // ================================================================
  console.log("\n📝 Création des permissions...");

  const createdPermissions = [];
  for (const perm of ALL_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
      },
      create: {
        resource: perm.resource,
        action: perm.action,
        key: perm.key,
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
        scope: perm.scope,
        isSystem: true, // Les permissions par défaut sont système
      },
    });
    createdPermissions.push(permission);
  }

  console.log(`✅ ${createdPermissions.length} permissions créées/mises à jour`);

  // ================================================================
  // 2. CRÉER LES RÔLES PAR DÉFAUT
  // ================================================================
  console.log("\n👥 Création des rôles...");

  const createdRoles = [];
  for (const roleData of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: roleData.name,
        },
      },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
        level: roleData.level,
        homePath: roleData.homePath,
        color: roleData.color,
        icon: roleData.icon,
      },
      create: {
        tenantId,
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        level: roleData.level,
        homePath: roleData.homePath,
        color: roleData.color,
        icon: roleData.icon,
        isSystem: roleData.isSystem,
      },
    });
    createdRoles.push(role);
  }

  console.log(`✅ ${createdRoles.length} rôles créés/mis à jour`);

  // ================================================================
  // 3. ATTRIBUER LES PERMISSIONS AUX RÔLES
  // ================================================================
  console.log("\n🔗 Attribution des permissions aux rôles...");

  for (const role of createdRoles) {
    const permissionKeys = ROLE_PERMISSIONS[role.name];

    if (!permissionKeys) {
      console.log(`⚠️  Pas de permissions définies pour le rôle ${role.name}`);
      continue;
    }

    // Supprimer les anciennes permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Ajouter les nouvelles permissions
    const permissions = await prisma.permission.findMany({
      where: {
        key: {
          in: permissionKeys,
        },
      },
    });

    const rolePermissions = permissions.map((perm) => ({
      roleId: role.id,
      permissionId: perm.id,
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissions,
      skipDuplicates: true,
    });

    console.log(
      `✅ ${rolePermissions.length} permissions attribuées au rôle ${role.displayName}`
    );
  }

  console.log("\n✨ Seed RBAC terminé avec succès!");

  return {
    permissions: createdPermissions,
    roles: createdRoles,
  };
}

// ====================================================================
// EXEMPLES DE DONNÉES DE TEST (OPTIONNEL)
// ====================================================================

/**
 * Crée des utilisateurs de test avec différents rôles
 */
export async function seedTestUsers(prisma: PrismaClient, tenantId: string) {
  console.log("\n👤 Création des 5 comptes officiels...");

  const bcrypt = require("bcryptjs");
  const roles = await prisma.role.findMany({ where: { tenantId } });

  const USERS = [
    {
      email: "superadmin@platform.com",
      name: "Super Admin",
      roleName: "SUPER_ADMIN",
      password: "SuperAdmin123!",
    },
    {
      email: "admin@demo.com",
      name: "Admin",
      roleName: "ADMIN",
      password: "password123",
    },
    {
      email: "agency@demo.com",
      name: "Agency Owner",
      roleName: "AGENCY_OWNER",
      password: "password123",
    },
    {
      email: "payroll@demo.com",
      name: "Payroll Manager",
      roleName: "PAYROLL_MANAGER",
      password: "password123",
    },
    {
      email: "contractor@demo.com",
      name: "Contractor",
      roleName: "CONTRACTOR",
      password: "password123",
    },
  ];

  for (const u of USERS) {
    const role = roles.find((r) => r.name === u.roleName);
    if (!role) continue;

    const passwordHash = await bcrypt.hash(u.password, 10);

    await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: u.email } },
      update: {},
      create: {
        tenantId,
        email: u.email,
        name: u.name,
        passwordHash,
        roleId: role.id,
        mustChangePassword: false,
        emailVerified: true,
      },
    });

    console.log(`✅ ${u.email} créé`);
  }

  console.log("✨ 5 comptes créés !");
}


// ====================================================================
// SCRIPT D'EXÉCUTION (Si lancé directement)
// ====================================================================

if (require.main === module) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  async function main() {
    // Récupérer ou créer un tenant de test
    let tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      console.log("📦 Création d'un tenant de test...");
      tenant = await prisma.tenant.create({
        data: {
          name: "Test Tenant",
          subdomain: "test",
        },
      });
      console.log(`✅ Tenant créé: ${tenant.name}`);
    }

    // Seed RBAC
    await seedRBAC(prisma, tenant.id);

    // Seed users de test (optionnel)
    // await seedTestUsers(prisma, tenant.id);
  }

  main()
    .catch((e) => {
      console.error("❌ Erreur lors du seed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

// ====================================================================
// EXPORTS
// ====================================================================

export default {
  seedRBAC,
  seedTestUsers,
  DEFAULT_ROLES,
  ROLE_PERMISSIONS,
};
