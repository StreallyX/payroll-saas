/**
 * Seed des Rôles v2 - Système Granulaire
 * 
 * Définit les rôles par défaut avec les nouvelles permissions granulaires
 */

import { PrismaClient } from "@prisma/client";
import { PERMISSION_GROUPS, ALL_PERMISSION_KEYS_V2 } from "../../server/rbac/permissions-v2";

const prisma = new PrismaClient();

// =================================================================
// DÉFINITION DES RÔLES
// =================================================================

export const DEFAULT_ROLES_V2 = [
  // -----------------------------------------------------------------
  // 1. CONTRACTOR - Utilisateur final (travailleur indépendant)
  // -----------------------------------------------------------------
  {
    name: "contractor",
    displayName: "Contractor",
    description: "Travailleur indépendant avec accès à son espace personnel",
    homePath: "/profile",
    permissions: PERMISSION_GROUPS.CONTRACTOR_FULL,
  },

  // -----------------------------------------------------------------
  // 2. AGENCY OWNER - Propriétaire d'agence
  // -----------------------------------------------------------------
  {
    name: "agency_owner",
    displayName: "Agency Owner",
    description: "Propriétaire d'agence gérant son équipe et ses contractors",
    homePath: "/team/contractors",
    permissions: PERMISSION_GROUPS.AGENCY_OWNER,
  },

  // -----------------------------------------------------------------
  // 3. ADMIN - Administrateur Tenant
  // -----------------------------------------------------------------
  {
    name: "admin",
    displayName: "Admin",
    description: "Administrateur avec accès complet au tenant",
    homePath: "/dashboard",
    permissions: PERMISSION_GROUPS.ADMIN_FULL,
  },

  // -----------------------------------------------------------------
  // 4. HR MANAGER - Responsable RH
  // -----------------------------------------------------------------
  {
    name: "hr_manager",
    displayName: "HR Manager",
    description: "Gestionnaire des ressources humaines",
    homePath: "/team/contractors",
    permissions: [
      // Base
      ...PERMISSION_GROUPS.BASE_USER,
      
      // Contractors - Gestion complète
      "contractors.manage.view_all",
      "contractors.manage.create",
      "contractors.manage.update",
      "contractors.manage.delete",
      "contractors.manage.change_status",
      "contractors.manage.assign_to_agency",
      "contractors.documents.view_all",
      "contractors.onboarding.view_all",
      "contractors.onboarding.review",
      "contractors.onboarding.validate",
      "contractors.onboarding.start",

      // Agencies
      "agencies.manage.view_all",
      "agencies.manage.create",
      "agencies.manage.update",

      // Contracts
      "contracts.manage.view_all",
      "contracts.manage.create",
      "contracts.manage.update",

      // Onboarding
      "onboarding.templates.view",
      "onboarding.templates.create",
      "onboarding.templates.update",
      "onboarding.questions.add",
      "onboarding.questions.update",
      "onboarding.responses.view_all",
      "onboarding.responses.review",

      // Tasks
      "tasks.view_all",
      "tasks.create",
      "tasks.assign",
      "tasks.delete",

      // Team
      "team.view",
      "team.manage",
      "team.invite",

      // Companies
      "companies.view",

      // Reports
      "reports.view",
      "reports.activity_logs",
    ],
  },

  // -----------------------------------------------------------------
  // 5. FINANCE MANAGER - Responsable Financier
  // -----------------------------------------------------------------
  {
    name: "finance_manager",
    displayName: "Finance Manager",
    description: "Gestionnaire financier et comptable",
    homePath: "/invoices",
    permissions: [
      // Base
      ...PERMISSION_GROUPS.BASE_USER,

      // Invoices - Gestion complète
      "invoices.manage.view_all",
      "invoices.manage.create",
      "invoices.manage.update",
      "invoices.manage.delete",
      "invoices.manage.send",
      "invoices.manage.mark_paid",
      "invoices.manage.export",

      // Expenses - Gestion complète
      "expenses.manage.view_all",
      "expenses.manage.approve",
      "expenses.manage.reject",
      "expenses.manage.mark_paid",

      // Payments - Gestion complète
      "payments.payslips.view_all",
      "payments.payslips.generate",
      "payments.payslips.send",
      "payments.remits.view_all",
      "payments.remits.create",
      "payments.remits.process",
      "payments.payroll.view_all",
      "payments.payroll.generate",
      "payments.payroll.update",
      "payments.payroll.mark_paid",

      // Contracts - Vue seulement
      "contracts.manage.view_all",

      // Banks
      "banks.view",
      "banks.create",
      "banks.update",

      // Companies
      "companies.view",

      // Reports
      "reports.view",
      "reports.analytics",
      "reports.export",
      "audit.view",
      "audit.export",
    ],
  },

  // -----------------------------------------------------------------
  // 6. PAYROLL MANAGER - Gestionnaire de Paie
  // -----------------------------------------------------------------
  {
    name: "payroll_manager",
    displayName: "Payroll Manager",
    description: "Gestionnaire de la paie et des bulletins",
    homePath: "/payments/payslips",
    permissions: [
      // Base
      ...PERMISSION_GROUPS.BASE_USER,

      // Payroll - Gestion complète
      "payments.payroll.view_all",
      "payments.payroll.generate",
      "payments.payroll.update",
      "payments.payroll.mark_paid",

      // Payslips - Gestion complète
      "payments.payslips.view_all",
      "payments.payslips.generate",
      "payments.payslips.send",

      // Remits
      "payments.remits.view_all",
      "payments.remits.process",

      // Timesheets - Approbation
      "timesheets.manage.view_all",
      "timesheets.manage.approve",
      "timesheets.manage.reject",

      // Contracts - Vue seulement
      "contracts.manage.view_all",

      // Contractors - Vue seulement
      "contractors.manage.view_all",

      // Invoices - Vue seulement
      "invoices.manage.view_all",

      // Reports
      "reports.view",
      "reports.analytics",
    ],
  },

  // -----------------------------------------------------------------
  // 7. RECRUITER - Recruteur
  // -----------------------------------------------------------------
  {
    name: "recruiter",
    displayName: "Recruiter",
    description: "Recruteur gérant les prospects et contractors",
    homePath: "/leads",
    permissions: [
      // Base
      ...PERMISSION_GROUPS.BASE_USER,

      // Leads - Gestion complète
      "leads.view",
      "leads.create",
      "leads.update",
      "leads.delete",
      "leads.export",
      "leads.assign",

      // Contractors - Gestion limitée
      "contractors.manage.view_all",
      "contractors.manage.create",
      "contractors.manage.update",
      "contractors.onboarding.view_all",
      "contractors.onboarding.start",

      // Onboarding
      "onboarding.templates.view",
      "onboarding.responses.view_all",

      // Tasks
      "tasks.view_own",
      "tasks.view_assigned",
      "tasks.update_own",
      "tasks.complete",

      // Companies
      "companies.view",
    ],
  },

  // -----------------------------------------------------------------
  // 8. VIEWER - Visualiseur (Lecture seule)
  // -----------------------------------------------------------------
  {
    name: "viewer",
    displayName: "Viewer",
    description: "Accès en lecture seule à toutes les données",
    homePath: "/dashboard",
    permissions: [
      // Base
      ...PERMISSION_GROUPS.BASE_USER,

      // Toutes les permissions "view" et "view_all"
      ...ALL_PERMISSION_KEYS_V2.filter(
        (p) =>
          (p.includes(".view") || 
           p.includes("view_all") || 
           p.includes("view_own")) &&
          !p.startsWith("superadmin.")
      ),
    ],
  },

  // -----------------------------------------------------------------
  // 9. TEAM MEMBER - Membre d'équipe basique
  // -----------------------------------------------------------------
  {
    name: "team_member",
    displayName: "Team Member",
    description: "Membre d'équipe avec accès limité",
    homePath: "/dashboard",
    permissions: [
      // Base
      ...PERMISSION_GROUPS.BASE_USER,

      // Tasks
      "tasks.view_own",
      "tasks.view_assigned",
      "tasks.update_own",
      "tasks.complete",

      // Team
      "team.view",

      // Quelques vues en lecture seule
      "contractors.manage.view_all",
      "contracts.manage.view_all",
      "companies.view",
    ],
  },

  // -----------------------------------------------------------------
  // 10. ACCOUNTANT - Comptable
  // -----------------------------------------------------------------
  {
    name: "accountant",
    displayName: "Accountant",
    description: "Comptable avec accès aux finances",
    homePath: "/invoices",
    permissions: [
      // Base
      ...PERMISSION_GROUPS.BASE_USER,

      // Invoices - Vue et export
      "invoices.manage.view_all",
      "invoices.manage.export",

      // Expenses - Vue et approbation
      "expenses.manage.view_all",
      "expenses.manage.approve",
      "expenses.manage.reject",

      // Payments - Vue uniquement
      "payments.payslips.view_all",
      "payments.remits.view_all",
      "payments.payroll.view_all",

      // Banks
      "banks.view",

      // Reports
      "reports.view",
      "reports.analytics",
      "reports.export",
      "audit.view",
      "audit.export",

      // Companies
      "companies.view",

      // Contracts - Vue
      "contracts.manage.view_all",
    ],
  },
];

// =================================================================
// SEED FUNCTION
// =================================================================

export async function seedRolesV2(tenantId: string) {
  console.log("👥 Seeding Roles v2...");

  let createdCount = 0;
  let updatedCount = 0;

  for (const roleData of DEFAULT_ROLES_V2) {
    // Check if role exists before upserting
    const existingRole = await prisma.role.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: roleData.name,
        },
      },
    });

    const isNew = !existingRole;

    // Upsert le rôle
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: roleData.name,
        },
      },
      update: {
        homePath: roleData.homePath,
      },
      create: {
        tenantId,
        name: roleData.name,
        homePath: roleData.homePath,
      },
    });

    if (isNew) {
      createdCount++;
    } else {
      updatedCount++;
    }

    // Supprimer les anciennes permissions du rôle
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Deduplicate permissions array to prevent unique constraint errors
    const uniquePermissions = Array.from(new Set(roleData.permissions));

    // Assigner les nouvelles permissions
    const permissionsToCreate = [];
    for (const permissionKey of uniquePermissions) {
      const permission = await prisma.permission.findUnique({
        where: { key: permissionKey },
      });

      if (!permission) {
        console.warn(
          `⚠️  Permission not found: ${permissionKey} for role ${roleData.name}`
        );
        continue;
      }

      permissionsToCreate.push({
        roleId: role.id,
        permissionId: permission.id,
      });
    }

    // Create all permissions at once with skipDuplicates for extra safety
    if (permissionsToCreate.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionsToCreate,
        skipDuplicates: true,
      });
    }

    console.log(
      `   ✓ ${roleData.displayName} (${roleData.name}): ${permissionsToCreate.length} permissions (${roleData.permissions.length - uniquePermissions.length} duplicates removed)`
    );
  }

  console.log(`✅ Roles v2 seeded successfully!`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - Total: ${DEFAULT_ROLES_V2.length}`);

  return {
    created: createdCount,
    updated: updatedCount,
    total: DEFAULT_ROLES_V2.length,
  };
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Obtenir les permissions d'un rôle
 */
export async function getRolePermissions(roleName: string, tenantId: string) {
  const role = await prisma.role.findUnique({
    where: {
      tenantId_name: {
        tenantId,
        name: roleName,
      },
    },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!role) {
    return [];
  }

  return role.rolePermissions.map((rp) => rp.permission.key);
}

/**
 * Afficher un résumé des rôles et leurs permissions
 */
export async function displayRolesSummary(tenantId: string) {
  console.log("\n📊 ROLES SUMMARY");
  console.log("=" .repeat(60));

  for (const roleData of DEFAULT_ROLES_V2) {
    const permissions = await getRolePermissions(roleData.name, tenantId);
    
    console.log(`\n${roleData.displayName.toUpperCase()}`);
    console.log(`Name: ${roleData.name}`);
    console.log(`Description: ${roleData.description}`);
    console.log(`Home Path: ${roleData.homePath}`);
    console.log(`Permissions: ${permissions.length}`);
    
    // Grouper les permissions par catégorie
    const categories = new Map<string, number>();
    permissions.forEach((perm) => {
      const category = perm.split(".")[0];
      categories.set(category, (categories.get(category) || 0) + 1);
    });

    console.log("Categories:");
    categories.forEach((count, category) => {
      console.log(`  - ${category}: ${count}`);
    });
  }

  console.log("\n" + "=".repeat(60));
}

// Export pour utilisation dans d'autres seeds
export { DEFAULT_ROLES_V2 as ROLES_V2 };
