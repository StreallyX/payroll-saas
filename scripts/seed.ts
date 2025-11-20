/**
 * ====================================================================
 * SEED RBAC V3 - Compatible avec la base actuelle et ALL_PERMISSIONS
 * ====================================================================
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ⚠️ On garde EXACTEMENT les mêmes données V2
import {
  ALL_PERMISSIONS,
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../server/rbac/permissions-v2";

// ====================================================================
// ROLES
// ====================================================================
export const DEFAULT_ROLES = [
  { name: "SUPER_ADMIN", displayName: "Super Administrateur", description: "Accès complet à toutes les fonctionnalités", level: 100, homePath: "/admin/dashboard", color: "#dc2626", icon: "shield", isSystem: true },
  { name: "ADMIN", displayName: "Administrateur", description: "Gestion complète du tenant", level: 90, homePath: "/admin/dashboard", color: "#ea580c", icon: "user-cog", isSystem: true },
  { name: "ACCOUNTANT", displayName: "Comptable", description: "Gestion financière complète", level: 80, homePath: "/finance/dashboard", color: "#16a34a", icon: "calculator", isSystem: true },
  { name: "HR_MANAGER", displayName: "Responsable RH", description: "Gestion des ressources humaines", level: 70, homePath: "/hr/dashboard", color: "#7c3aed", icon: "users", isSystem: true },
  { name: "AGENCY_OWNER", displayName: "Propriétaire d'Agence", description: "Gestion de son agence", level: 60, homePath: "/agency/dashboard", color: "#2563eb", icon: "building", isSystem: true },
  { name: "AGENCY_MANAGER", displayName: "Manager d'Agence", description: "Gestion des contractors", level: 50, homePath: "/agency/contractors", color: "#0891b2", icon: "briefcase", isSystem: true },
  { name: "CLIENT", displayName: "Client", description: "Accès à son entreprise", level: 40, homePath: "/client/dashboard", color: "#4f46e5", icon: "building-columns", isSystem: true },
  { name: "CONTRACTOR", displayName: "Freelance/Contractor", description: "Accès à ses missions", level: 30, homePath: "/contractor/dashboard", color: "#059669", icon: "user", isSystem: true },
  { name: "PAYROLL_MANAGER", displayName: "Gestionnaire de Paie", description: "Gestion de la paie", level: 75, homePath: "/payroll/dashboard", color: "#d97706", icon: "money-check", isSystem: true },
  { name: "VIEWER", displayName: "Observateur", description: "Accès en lecture seule", level: 10, homePath: "/dashboard", color: "#64748b", icon: "eye", isSystem: true },
] as const;

// ====================================================================
// ROLE → PERMISSIONS MAPPING (on garde EXACTEMENT le tien)
// ====================================================================
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.key),

  ADMIN: ALL_PERMISSIONS.filter(
    (p) => p.action !== Action.IMPERSONATE
  ).map((p) => p.key),

  ACCOUNTANT: [
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.SEND, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.APPROVE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.PAY, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.INVOICE, Action.EXPORT, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.PROCESS, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.REFUND, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.EXPORT, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.APPROVE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.REJECT, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.EXPENSE, Action.PAY, PermissionScope.GLOBAL),
  ],

  HR_MANAGER: [
    buildPermissionKey(Resource.USER, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.GLOBAL),
  ],

  AGENCY_OWNER: [
    buildPermissionKey(Resource.AGENCY, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACTOR, Action.LIST, PermissionScope.TEAM),
  ],

  AGENCY_MANAGER: [
    buildPermissionKey(Resource.CONTRACTOR, Action.LIST, PermissionScope.TEAM),
  ],

  CLIENT: [
    buildPermissionKey(Resource.COMPANY, Action.READ, PermissionScope.OWN),
  ],

  CONTRACTOR: [
    buildPermissionKey(Resource.CONTRACT, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.LIST, PermissionScope.OWN),
  ],

  PAYROLL_MANAGER: [
    buildPermissionKey(Resource.PAYSLIP, Action.LIST, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYMENT, Action.LIST, PermissionScope.GLOBAL),
  ],

  VIEWER: ALL_PERMISSIONS.filter((p) => p.action === Action.LIST || p.action === Action.READ).map((p) => p.key),
};

// ====================================================================
// FONCTION DE SEED PRINCIPALE
// ====================================================================
export async function seedRBAC(prisma: PrismaClient, tenantId: string) {
  console.log("🌱 SEED RBAC V3…");

  // 1️⃣ Permissions
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


  // 2️⃣ Rôles
  const createdRoles = [];
  for (const role of DEFAULT_ROLES) {
    const r = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: role.name } },
      update: {
        displayName: role.displayName,
        description: role.description,
        level: role.level,
        homePath: role.homePath,
        color: role.color,
        icon: role.icon,
      },
      create: { tenantId, ...role },
    });
    createdRoles.push(r);
  }

  // 3️⃣ Assignation des permissions
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

  console.log("✅ RBAC V3 seed complet !");
}

// ====================================================================
// USERS DE TEST (IDENTIQUES MAIS VRAIS COMPTES)
// ====================================================================
export async function seedTestUsers(prisma: PrismaClient, tenantId: string) {
  console.log("👤 Création des comptes…");

  const USERS = [
    { email: "superadmin@platform.com", name: "Super Admin", role: "SUPER_ADMIN", pass: "SuperAdmin123!" },
    { email: "admin@demo.com", name: "Admin", role: "ADMIN", pass: "password123" },
    { email: "agency@demo.com", name: "Agency Owner", role: "AGENCY_OWNER", pass: "password123" },
    { email: "payroll@demo.com", name: "Payroll Manager", role: "PAYROLL_MANAGER", pass: "password123" },
    { email: "contractor@demo.com", name: "Contractor", role: "CONTRACTOR", pass: "password123" },
  ];

  for (const u of USERS) {
    const role = await prisma.role.findFirst({
      where: { tenantId, name: u.role },
    });

    if (!role) continue;

    await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: u.email } },
      update: {},
      create: {
        tenantId,
        email: u.email,
        name: u.name,
        passwordHash: await bcrypt.hash(u.pass, 10),
        roleId: role.id,
        emailVerified: true,
        mustChangePassword: false,
      },
    });
  }

  console.log("✨ Comptes créés !");
}

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

  console.log("➡️ Tenant utilisé :", tenant.id);

  await seedRBAC(prisma, tenant.id);
  await seedTestUsers(prisma, tenant.id);

  console.log("✨ Seed terminé !");
}

main()
  .catch((err) => console.error("❌ ERREUR :", err))
  .finally(() => prisma.$disconnect());

