/**
 * Seed des Permissions v2 - Système Granulaire
 * 
 * Ce fichier seed toutes les permissions du nouveau système RBAC
 */

import { PrismaClient } from "@prisma/client";
import { ALL_PERMISSION_KEYS_V2 } from "../../server/rbac/permissions-v2";

const prisma = new PrismaClient();

/**
 * Descriptions des permissions pour faciliter la compréhension
 */
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // Profile
  "profile.view": "Voir son propre profil",
  "profile.update": "Modifier son profil",
  "profile.documents.view": "Voir ses documents personnels",
  "profile.documents.upload": "Uploader des documents personnels",
  "profile.documents.delete": "Supprimer ses documents",

  // Dashboard
  "dashboard.view": "Accès au tableau de bord",
  "dashboard.view_stats": "Voir les statistiques du dashboard",

  // Contractors - Own
  "contractors.view_own": "Voir son propre profil de contractor",
  "contractors.update_own": "Modifier son profil de contractor",
  "contractors.documents.view_own": "Voir ses documents de contractor",
  "contractors.documents.upload_own": "Uploader des documents",
  "contractors.documents.delete_own": "Supprimer ses documents",

  // Contractors - Manage
  "contractors.manage.view_all": "Voir tous les contractors",
  "contractors.manage.create": "Créer un contractor",
  "contractors.manage.update": "Modifier n'importe quel contractor",
  "contractors.manage.delete": "Supprimer un contractor",
  "contractors.manage.change_status": "Changer le statut d'un contractor",
  "contractors.manage.assign_to_agency": "Assigner un contractor à une agence",
  "contractors.documents.view_all": "Voir tous les documents des contractors",
  "contractors.documents.delete_all": "Supprimer les documents des contractors",

  // Contractors - Onboarding
  "contractors.onboarding.view_own": "Voir son processus d'onboarding",
  "contractors.onboarding.submit": "Soumettre son onboarding",
  "contractors.onboarding.view_all": "Voir tous les onboardings",
  "contractors.onboarding.review": "Reviewer un onboarding",
  "contractors.onboarding.validate": "Valider un onboarding",
  "contractors.onboarding.start": "Démarrer un onboarding",
  "contractors.onboarding.update": "Mettre à jour un onboarding",

  // Agencies - Own
  "agencies.view_own": "Voir sa propre agence",
  "agencies.update_own": "Modifier son agence",

  // Agencies - Manage
  "agencies.manage.view_all": "Voir toutes les agences",
  "agencies.manage.create": "Créer une agence",
  "agencies.manage.update": "Modifier une agence",
  "agencies.manage.delete": "Supprimer une agence",

  // Agencies - Team
  "agencies.team.view": "Voir l'équipe de son agence",
  "agencies.team.invite": "Inviter des membres",
  "agencies.team.remove": "Retirer des membres",
  "agencies.team.assign_contractor": "Assigner des contractors",
  "agencies.notes.add": "Ajouter des notes",
  "agencies.notes.view": "Voir les notes",

  // Contracts
  "contracts.view_own": "Voir ses propres contrats",
  "contracts.manage.view_all": "Voir tous les contrats",
  "contracts.manage.create": "Créer un contrat",
  "contracts.manage.update": "Modifier un contrat",
  "contracts.manage.delete": "Supprimer un contrat",
  "contracts.manage.send": "Envoyer un contrat",
  "contracts.manage.approve": "Approuver un contrat",
  "contracts.manage.reject": "Rejeter un contrat",
  "contracts.manage.upload_pdf": "Uploader un PDF de contrat",
  "contracts.manage.download_pdf": "Télécharger un PDF de contrat",
  "contracts.manage.generate_reference": "Générer une référence de contrat",

  // Invoices
  "invoices.view_own": "Voir ses propres factures",
  "invoices.create_own": "Créer ses factures",
  "invoices.manage.view_all": "Voir toutes les factures",
  "invoices.manage.create": "Créer une facture",
  "invoices.manage.update": "Modifier une facture",
  "invoices.manage.delete": "Supprimer une facture",
  "invoices.manage.send": "Envoyer une facture",
  "invoices.manage.mark_paid": "Marquer une facture comme payée",
  "invoices.manage.export": "Exporter les factures",

  // Timesheets
  "timesheets.view_own": "Voir ses feuilles de temps",
  "timesheets.create": "Créer une feuille de temps",
  "timesheets.update_own": "Modifier sa feuille de temps",
  "timesheets.delete_own": "Supprimer sa feuille de temps",
  "timesheets.submit": "Soumettre pour approbation",
  "timesheets.manage.view_all": "Voir toutes les feuilles de temps",
  "timesheets.manage.update": "Modifier n'importe quelle feuille",
  "timesheets.manage.delete": "Supprimer n'importe quelle feuille",
  "timesheets.manage.approve": "Approuver une feuille de temps",
  "timesheets.manage.reject": "Rejeter une feuille de temps",

  // Expenses
  "expenses.view_own": "Voir ses dépenses",
  "expenses.create": "Créer une dépense",
  "expenses.update_own": "Modifier sa dépense",
  "expenses.delete_own": "Supprimer sa dépense",
  "expenses.submit": "Soumettre pour remboursement",
  "expenses.manage.view_all": "Voir toutes les dépenses",
  "expenses.manage.update": "Modifier n'importe quelle dépense",
  "expenses.manage.delete": "Supprimer n'importe quelle dépense",
  "expenses.manage.approve": "Approuver une dépense",
  "expenses.manage.reject": "Rejeter une dépense",
  "expenses.manage.mark_paid": "Marquer comme payée",

  // Payments - Payslips
  "payments.payslips.view_own": "Voir ses bulletins de paie",
  "payments.payslips.view_all": "Voir tous les bulletins de paie",
  "payments.payslips.generate": "Générer des bulletins de paie",
  "payments.payslips.send": "Envoyer des bulletins de paie",

  // Payments - Remits
  "payments.remits.view_own": "Voir ses virements",
  "payments.remits.view_all": "Voir tous les virements",
  "payments.remits.create": "Créer un virement",
  "payments.remits.process": "Traiter un virement",

  // Payments - Payroll
  "payments.payroll.view_own": "Voir son payroll",
  "payments.payroll.view_all": "Voir tous les payrolls",
  "payments.payroll.generate": "Générer un payroll",
  "payments.payroll.update": "Modifier un payroll",
  "payments.payroll.mark_paid": "Marquer comme payé",

  // Referrals
  "referrals.view": "Voir ses parrainages",
  "referrals.create": "Créer un parrainage",
  "referrals.track": "Suivre ses parrainages",
  "referrals.manage.view_all": "Voir tous les parrainages",
  "referrals.manage.update": "Modifier un parrainage",
  "referrals.manage.delete": "Supprimer un parrainage",
  "referrals.manage.approve": "Approuver un parrainage",
  "referrals.manage.pay_reward": "Payer les récompenses",

  // Onboarding
  "onboarding.templates.view": "Voir les templates d'onboarding",
  "onboarding.templates.create": "Créer un template",
  "onboarding.templates.update": "Modifier un template",
  "onboarding.templates.delete": "Supprimer un template",
  "onboarding.questions.add": "Ajouter des questions",
  "onboarding.questions.update": "Modifier des questions",
  "onboarding.questions.delete": "Supprimer des questions",
  "onboarding.responses.view_own": "Voir ses réponses",
  "onboarding.responses.view_all": "Voir toutes les réponses",
  "onboarding.responses.submit": "Soumettre ses réponses",
  "onboarding.responses.review": "Reviewer des réponses",

  // Team
  "team.view": "Voir son équipe",
  "team.manage": "Gérer son équipe",
  "team.invite": "Inviter des membres",
  "team.remove": "Retirer des membres",

  // Tasks
  "tasks.view_own": "Voir ses tâches",
  "tasks.view_assigned": "Voir les tâches assignées",
  "tasks.view_all": "Voir toutes les tâches",
  "tasks.create": "Créer une tâche",
  "tasks.update_own": "Modifier sa tâche",
  "tasks.update_assigned": "Modifier une tâche assignée",
  "tasks.delete": "Supprimer une tâche",
  "tasks.assign": "Assigner une tâche",
  "tasks.complete": "Marquer comme complétée",

  // Leads
  "leads.view": "Voir les prospects",
  "leads.create": "Créer un prospect",
  "leads.update": "Modifier un prospect",
  "leads.delete": "Supprimer un prospect",
  "leads.export": "Exporter les prospects",
  "leads.assign": "Assigner un prospect",

  // Reports & Analytics
  "reports.view": "Accès aux rapports",
  "reports.activity_logs": "Voir les logs d'activité",
  "reports.analytics": "Voir les analytics",
  "reports.export": "Exporter des rapports",
  "audit.view": "Voir les audit logs",
  "audit.export": "Exporter les audit logs",

  // Tenant
  "tenant.view": "Voir les infos du tenant",
  "tenant.update": "Modifier le tenant",
  "tenant.branding.view": "Voir le branding",
  "tenant.branding.update": "Modifier le branding",
  "tenant.billing.view": "Voir la facturation",
  "tenant.billing.update": "Modifier la facturation",
  
  // Tenant - Roles
  "tenant.roles.view": "Voir les rôles",
  "tenant.roles.create": "Créer un rôle",
  "tenant.roles.update": "Modifier un rôle",
  "tenant.roles.delete": "Supprimer un rôle",
  
  // Tenant - Users
  "tenant.users.view": "Voir les utilisateurs",
  "tenant.users.invite": "Inviter des utilisateurs",
  "tenant.users.create": "Créer un utilisateur",
  "tenant.users.update": "Modifier un utilisateur",
  "tenant.users.disable": "Désactiver un utilisateur",
  "tenant.users.delete": "Supprimer un utilisateur",

  // Tenant - Subscription
  "tenant.subscription.view": "Voir l'abonnement",
  "tenant.subscription.manage": "Gérer l'abonnement",
  "tenant.subscription.billing": "Gérer la facturation",

  // Tenant - Templates
  "tenant.templates.email.view": "Voir les templates email",
  "tenant.templates.email.create": "Créer un template email",
  "tenant.templates.email.update": "Modifier un template email",
  "tenant.templates.email.delete": "Supprimer un template email",
  "tenant.templates.pdf.view": "Voir les templates PDF",
  "tenant.templates.pdf.create": "Créer un template PDF",
  "tenant.templates.pdf.update": "Modifier un template PDF",
  "tenant.templates.pdf.delete": "Supprimer un template PDF",

  // Tenant - Security & Data
  "tenant.security.view": "Voir la sécurité",
  "tenant.security.manage": "Gérer la sécurité",
  "tenant.data.export": "Exporter les données",
  "tenant.data.delete": "Supprimer les données",
  "tenant.onboarding.view": "Voir l'onboarding tenant",
  "tenant.onboarding.manage": "Gérer l'onboarding tenant",

  // Settings
  "settings.view": "Voir les paramètres",
  "settings.update": "Modifier les paramètres",

  // Companies
  "companies.view": "Voir les entreprises",
  "companies.create": "Créer une entreprise",
  "companies.update": "Modifier une entreprise",
  "companies.delete": "Supprimer une entreprise",

  // Banks
  "banks.view": "Voir les banques",
  "banks.create": "Créer une banque",
  "banks.update": "Modifier une banque",
  "banks.delete": "Supprimer une banque",

  // Document Types
  "document_types.view": "Voir les types de documents",
  "document_types.create": "Créer un type de document",
  "document_types.update": "Modifier un type de document",
  "document_types.delete": "Supprimer un type de document",

  // Webhooks
  "webhooks.view": "Voir les webhooks",
  "webhooks.create": "Créer un webhook",
  "webhooks.update": "Modifier un webhook",
  "webhooks.delete": "Supprimer un webhook",
  "webhooks.test": "Tester un webhook",

  // SuperAdmin - Tenants
  "superadmin.tenants.view_all": "Voir tous les tenants",
  "superadmin.tenants.create": "Créer un tenant",
  "superadmin.tenants.suspend": "Suspendre un tenant",
  "superadmin.tenants.delete": "Supprimer un tenant",
  "superadmin.tenants.switch": "Changer de tenant",
  "superadmin.tenants.impersonate": "Se faire passer pour un utilisateur",
  "superadmin.tenants.manage_quotas": "Gérer les quotas",
  "superadmin.tenants.manage_features": "Gérer les fonctionnalités",
  "superadmin.tenants.manage_subscriptions": "Gérer les abonnements",
  "superadmin.tenants.view_analytics": "Voir les analytics",
  "superadmin.tenants.export_data": "Exporter les données",

  // SuperAdmin - Users
  "superadmin.users.view_all": "Voir tous les utilisateurs",
  "superadmin.users.create": "Créer un utilisateur",
  "superadmin.users.update": "Modifier un utilisateur",
  "superadmin.users.delete": "Supprimer un utilisateur",

  // SuperAdmin - System
  "superadmin.system.view_logs": "Voir les logs système",
  "superadmin.system.manage_settings": "Gérer les paramètres système",
  "superadmin.system.view_metrics": "Voir les métriques système",
  "superadmin.system.manage_templates": "Gérer les templates système",
  "superadmin.system.manage_security": "Gérer la sécurité système",
};

/**
 * Seed les permissions dans la base de données
 */
export async function seedPermissionsV2() {
  console.log("🔐 Seeding Permissions v2...");

  let createdCount = 0;
  let updatedCount = 0;

  for (const key of ALL_PERMISSION_KEYS_V2) {
    const description = PERMISSION_DESCRIPTIONS[key] || `Permission: ${key}`;

    const permission = await prisma.permission.upsert({
      where: { key },
      update: {
        description,
      },
      create: {
        key,
        description,
      },
    });

    if (permission) {
      const exists = await prisma.permission.findUnique({
        where: { key },
      });

      if (exists) {
        updatedCount++;
      } else {
        createdCount++;
      }
    }
  }

  console.log(`✅ Permissions v2 seeded successfully!`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - Total: ${ALL_PERMISSION_KEYS_V2.length}`);

  return {
    created: createdCount,
    updated: updatedCount,
    total: ALL_PERMISSION_KEYS_V2.length,
  };
}

/**
 * Vérifier si les permissions sont bien seedées
 */
export async function verifyPermissions() {
  console.log("🔍 Verifying permissions...");

  const permissionCount = await prisma.permission.count();
  const expectedCount = ALL_PERMISSION_KEYS_V2.length;

  if (permissionCount === expectedCount) {
    console.log(`✅ All ${permissionCount} permissions are seeded correctly!`);
    return true;
  } else {
    console.warn(
      `⚠️  Permission count mismatch: Expected ${expectedCount}, Found ${permissionCount}`
    );
    return false;
  }
}

// Export pour utilisation dans d'autres seeds
export const PERMISSIONS_V2 = ALL_PERMISSION_KEYS_V2;
