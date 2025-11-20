/**
 * ====================================================================
 * SEED RBAC V4 - Compatible avec la nouvelle base User-centric
 * ====================================================================
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ⚠️ IMPORTANT : importer TON nouveau fichier RBAC v4
import {
  ALL_PERMISSIONS,
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "@/server/rbac/permissions-v2";

// ====================================================================
// DEFAUT ROLES
// ====================================================================

export const DEFAULT_ROLES = [
  {
    name: "SUPER_ADMIN",
    displayName: "Super Administrateur",
    description: "Accès complet à toutes les fonctionnalités",
    level: 100,
    homePath: "/admin/dashboard",
    color: "#dc2626",
    icon: "shield",
    isSystem: true,
  },
  {
    name: "ADMIN",
    displayName: "Administrateur",
    description: "Gestion complète du tenant",
    level: 90,
    homePath: "/admin/dashboard",
    color: "#ea580c",
    icon: "user-cog",
    isSystem: true,
  },
  {
    name: "ACCOUNTANT",
    displayName: "Comptable",
    description: "Gestion financière complète",
    level: 80,
    homePath: "/finance/dashboard",
    color: "#16a34a",
    icon: "calculator",
    isSystem: true,
  },
  {
    name: "HR_MANAGER",
    displayName: "Responsable RH",
    description: "Gestion des ressources humaines",
    level: 70,
    homePath: "/hr/dashboard",
    color: "#7c3aed",
    icon: "users",
    isSystem: true,
  },
  {
    name: "CLIENT",
    displayName: "Client",
    description: "Accès à son entreprise",
    level: 40,
    homePath: "/client/dashboard",
    color: "#4f46e5",
    icon: "building-columns",
    isSystem: true,
  },
  {
    name: "CONTRACTOR",
    displayName: "Freelance",
    description: "Accès à ses contrats, timesheets et dépenses",
    level: 30,
    homePath: "/contractor/dashboard",
    color: "#059669",
    icon: "user",
    isSystem: true,
  },
  {
    name: "PAYROLL_MANAGER",
    displayName: "Gestionnaire de paie",
    description: "Gestion des fiches de paie",
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
// ROLE → PERMISSIONS   (clean pour ta DB v4)
// ====================================================================

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.key),

  ADMIN: ALL_PERMISSIONS.filter(
    (p) => p.action !== Action.IMPERSONATE
  ).map((p) => p.key),

  ACCOUNTANT: [
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.PROCESS, PermissionScope.GLOBAL),
  ],

  HR_MANAGER: [
    buildPermissionKey(Resource.USER, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.GLOBAL),
  ],

  CLIENT: [
    buildPermissionKey(Resource.COMPANY, Action.READ, PermissionScope.OWN),
  ],

  CONTRACTOR: [
  // USER PROFILE
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // TIMESHEETS
    buildPermissionKey(Resource.TIMESHEET, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.SUBMIT, PermissionScope.OWN),

    // EXPENSES
    buildPermissionKey(Resource.EXPENSE, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.OWN),

    // INVOICES
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.OWN),

    // REMITTANCES
    buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.REMITTANCE, Action.CREATE, PermissionScope.OWN),

    // PAYSLIPS
    buildPermissionKey(Resource.PAYSLIP, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.PAYSLIP, Action.READ, PermissionScope.OWN),

    // REFERRALS
    buildPermissionKey(Resource.REFERRAL, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.REFERRAL, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.REFERRAL, Action.CREATE, PermissionScope.OWN),
  ],

  PAYROLL_MANAGER: [
    buildPermissionKey(Resource.PAYSLIP, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.LIST, PermissionScope.GLOBAL),
  ],

  VIEWER: ALL_PERMISSIONS.filter(
    (p) => p.action === Action.LIST || p.action === Action.READ
  ).map((p) => p.key),
};

// ====================================================================
// SEED PRINCIPAL
// ====================================================================

export async function seedRBAC(prisma: PrismaClient, tenantId: string) {
  console.log("🌱 SEED RBAC V4…");

  // Permissions
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
        scope: perm.scope,
        action: perm.action,
        resource: perm.resource,
      },
      create: {
        key: perm.key,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
        displayName: perm.displayName,
        description: perm.description,
        category: perm.category,
        isSystem: true,
      },
    });
  }

  // Roles
  const createdRoles = [];
  for (const role of DEFAULT_ROLES) {
    const r = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: role.name } },
      update: role,
      create: { ...role, tenantId },
    });
    createdRoles.push(r);
  }

  // Assign permissions
  for (const role of createdRoles) {
    const keys = ROLE_PERMISSIONS[role.name] || [];
    const permissions = await prisma.permission.findMany({
      where: { key: { in: keys } },
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        roleId: role.id,
        permissionId: p.id,
      })),
    });
  }

  console.log("✅ RBAC V4 seed complet !");
}

// ====================================================================
// SEED UTILISATEURS DE TEST
// ====================================================================

export async function seedTestUsers(prisma: PrismaClient, tenantId: string) {
  console.log("👤 Création des utilisateurs…");

  const USERS = [
    {
      email: "superadmin@platform.com",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      pass: "SuperAdmin123!",
    },
    {
      email: "admin@demo.com",
      name: "Admin",
      role: "ADMIN",
      pass: "password123",
    },
    {
      email: "payroll@demo.com",
      name: "Payroll Manager",
      role: "PAYROLL_MANAGER",
      pass: "password123",
    },
    {
      email: "contractor@demo.com",
      name: "Contractor",
      role: "CONTRACTOR",
      pass: "password123",
    },
  ];

  for (const u of USERS) {
    const role = await prisma.role.findFirst({
      where: { tenantId, name: u.role },
    });

    await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: u.email } },
      update: {},
      create: {
        tenantId,
        email: u.email,
        name: u.name,
        passwordHash: await bcrypt.hash(u.pass, 10),
        roleId: role!.id,
        mustChangePassword: false,
        emailVerified: true,
      },
    });
  }

  console.log("✨ Comptes créés !");
}

// ====================================================================
// MAIN
// ====================================================================

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Lancement du seed…");

  let tenant = await prisma.tenant.findFirst();

  if (!tenant) {
    console.log("📦 Aucun tenant → création…");
    tenant = await prisma.tenant.create({
      data: {
        name: "Default Tenant",
        subdomain: "default",
      },
    });
  }

  await seedRBAC(prisma, tenant.id);
  await seedTestUsers(prisma, tenant.id);

  console.log("✨ Seed terminé !");
}

main()
  .catch((err) => console.error("❌ ERREUR :", err))
  .finally(() => prisma.$disconnect());
