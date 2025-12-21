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
} from "@/server/rbac/permissions";

// ====================================================================
// DEFAUT ROLES
// ====================================================================

export const DEFAULT_ROLES = [
  {
    name: "SUPER_ADMIN",
    displayName: "Super Administrator",
    description: "Full access to all features and settings",
    level: 100,
    homePath: "/admin/dashboard",
    color: "#dc2626",
    icon: "shield",
    isSystem: true,
  },
  {
    name: "ADMIN",
    displayName: "Administrator",
    description: "Complete management of the tenant",
    level: 90,
    homePath: "/admin/dashboard",
    color: "#ea580c",
    icon: "user-cog",
    isSystem: true,
  },
  {
    name: "CONTRACTOR",
    displayName: "Contractor",
    description: "Access to their contracts, timesheets, and expenses",
    level: 30,
    homePath: "/contractor/dashboard",
    color: "#059669",
    icon: "user",
    isSystem: true,
  },
  {
    name: "PAYROLL",
    displayName: "Payroll Manager",
    description: "Management of payslips and payroll operations",
    level: 75,
    homePath: "/payroll/dashboard",
    color: "#d97706",
    icon: "money-check",
    isSystem: true,
  },
  {
    name: "AGENCY",
    displayName: "Agency Manager",
    description: "Management of contractors, clients, and contracts within the agency",
    level: 70,
    homePath: "/agency/dashboard",
    color: "#2563eb",
    icon: "building",
    isSystem: true,
  },
] as const;


// ====================================================================
// ROLE → PERMISSIONS   (clean pour ta DB v4)
// ====================================================================

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.key),

  ADMIN: ALL_PERMISSIONS.map((p) => p.key),

  CONTRACTOR: [
    buildPermissionKey(Resource.DASHBOARD, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),
    // USER PROFILE
    buildPermissionKey(Resource.PROFILE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    // TIMESHEETS
    buildPermissionKey(Resource.TIMESHEET, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.TIMESHEET, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.TIMESHEET, Action.SUBMIT, PermissionScope.OWN),

    // EXPENSES
    buildPermissionKey(Resource.EXPENSE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.EXPENSE, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.EXPENSE, Action.UPDATE, PermissionScope.OWN),

    // INVOICES
    buildPermissionKey(Resource.INVOICE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.INVOICE, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.OWN),

    // REMITTANCES
    buildPermissionKey(Resource.REMITTANCE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.REMITTANCE, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.REMITTANCE, Action.CREATE, PermissionScope.OWN),

    // PAYSLIPS
    buildPermissionKey(Resource.PAYSLIP, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.PAYSLIP, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.PAYSLIP, Action.READ, PermissionScope.OWN),

    // REFERRALS
    buildPermissionKey(Resource.REFERRAL, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.REFERRAL, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.REFERRAL, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.REFERRAL, Action.CREATE, PermissionScope.OWN),

    buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.OWN),

    buildPermissionKey(Resource.BANK, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.BANK, Action.DELETE, PermissionScope.OWN),
    buildPermissionKey(Resource.BANK, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.BANK, Action.UPDATE, PermissionScope.OWN),
  ],

  PAYROLL: [
    // DASHBOARD
    buildPermissionKey(Resource.DASHBOARD, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),

    // USER MANAGEMENT
    buildPermissionKey(Resource.USER, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.ACTIVATE, PermissionScope.GLOBAL),

    // INVOICES (own scope)
    buildPermissionKey(Resource.INVOICE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.OWN),

    // INVOICES (global)
    buildPermissionKey(Resource.INVOICE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.INVOICE, Action.DELETE, PermissionScope.GLOBAL),

    // REMITTANCE
    buildPermissionKey(Resource.REMITTANCE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.REMITTANCE, Action.READ, PermissionScope.OWN),

    // PAYSLIPS
    buildPermissionKey(Resource.PAYSLIP, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.PAYSLIP, Action.READ, PermissionScope.OWN),

    buildPermissionKey(Resource.PAYSLIP, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYSLIP, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.PAYSLIP, Action.UPDATE, PermissionScope.GLOBAL),

    // ROLE MANAGEMENT (own)
    buildPermissionKey(Resource.ROLE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.ROLE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.ROLE, Action.DELETE, PermissionScope.OWN),
    buildPermissionKey(Resource.ROLE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.ROLE, Action.UPDATE, PermissionScope.OWN),

    buildPermissionKey(Resource.TASK, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.TASK, Action.UPDATE, PermissionScope.OWN),

    // CONTRACTS (own)
    buildPermissionKey(Resource.CONTRACT, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.OWN),
  ],

  AGENCY: [
    // DASHBOARD
    buildPermissionKey(Resource.DASHBOARD, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.DASHBOARD, Action.READ, PermissionScope.OWN),

    // USER MANAGEMENT (own agency scope)
    buildPermissionKey(Resource.USER, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.USER, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.OWN),

    buildPermissionKey(Resource.USER, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.DELETE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.ACTIVATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.USER, Action.UPDATE, PermissionScope.GLOBAL),

    buildPermissionKey(Resource.INVOICE, Action.PAY, PermissionScope.OWN),

    // CONTRACTS (own)
    buildPermissionKey(Resource.CONTRACT, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.CONTRACT, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACT, Action.SIGN, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACT, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.CONTRACT, Action.CREATE, PermissionScope.GLOBAL),

    buildPermissionKey(Resource.CONTRACT_MSA, Action.CREATE, PermissionScope.GLOBAL),
    buildPermissionKey(Resource.CONTRACT_SOW, Action.CREATE, PermissionScope.GLOBAL),


    buildPermissionKey(Resource.COMPANY, Action.ACCESS, PermissionScope.PAGE),
    //(Resource.COMPANY, Action.CREATE, PermissionScope.OWN),
    //buildPermissionKey(Resource.COMPANY, Action.DELETE, PermissionScope.OWN),
    buildPermissionKey(Resource.COMPANY, Action.LIST, PermissionScope.OWN),
    //buildPermissionKey(Resource.COMPANY, Action.UPDATE, PermissionScope.OWN),

    buildPermissionKey(Resource.DOCUMENT, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.DOCUMENT, Action.UPLOAD, PermissionScope.OWN),
    buildPermissionKey(Resource.DOCUMENT, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.DOCUMENT, Action.DELETE, PermissionScope.OWN),

    buildPermissionKey(Resource.BANK, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.BANK, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.BANK, Action.DELETE, PermissionScope.OWN),
    buildPermissionKey(Resource.BANK, Action.LIST, PermissionScope.OWN),
    buildPermissionKey(Resource.BANK, Action.UPDATE, PermissionScope.OWN),

    // INVOICES (own)
    buildPermissionKey(Resource.INVOICE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.INVOICE, Action.CREATE, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.INVOICE, Action.UPDATE, PermissionScope.OWN),

    // ROLES (own scope)
    buildPermissionKey(Resource.ROLE, Action.ACCESS, PermissionScope.PAGE),
    buildPermissionKey(Resource.ROLE, Action.DELETE, PermissionScope.OWN),
    buildPermissionKey(Resource.ROLE, Action.READ, PermissionScope.OWN),
    buildPermissionKey(Resource.ROLE, Action.UPDATE, PermissionScope.OWN),
    buildPermissionKey(Resource.ROLE, Action.CREATE, PermissionScope.OWN),
  ],
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
      role: "PAYROLL",
      pass: "password123",
    },
    {
      email: "contractor@demo.com",
      name: "Contractor",
      role: "CONTRACTOR",
      pass: "password123",
    },
    {
      email: "agency@demo.com",
      name: "Agency",
      role: "AGENCY",
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
// SEED DEFAULT CURRENCY + COUNTRY (CORRIGÉ)
// ====================================================================

async function seedBaseData(prisma: PrismaClient) {
  console.log("🌍 Seed currency + country…");

  // 1 currency de base → USD
  await prisma.currency.upsert({
    where: { code: "USD" },
    update: {},
    create: {
      code: "USD",
      name: "United States Dollar",
      symbol: "$",
    },
  });

  // 1 country de base → United States
  await prisma.country.upsert({
    where: { code: "US" },        // ✔ utilise TON champ "code"
    update: {},
    create: {
      code: "US",
      name: "United States",
    },
  });

  console.log("✅ Base data OK !");
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

  // Base data (CURRENCY + COUNTRY)
  await seedBaseData(prisma);

  // RBAC
  await seedRBAC(prisma, tenant.id);

  // Test Users
  await seedTestUsers(prisma, tenant.id);

  console.log("✨ Seed terminé !");
}


main()
  .catch((err) => console.error("❌ ERREUR :", err))
  .finally(() => prisma.$disconnect());
