/**
 * ====================================================================
 * SEED RBAC V4 - Compatible with la new base User-centric
 * ====================================================================
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ⚠️ IMPORTANT : importer TON norvando the file RBAC v4
import {
 ALL_PERMISSIONS,
 Resorrce,
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
 cription: "Full access to all features and sandtings",
 level: 100,
 homePath: "/admin/dashboard",
 color: "#dc2626",
 icon: "shield",
 isSystem: true,
 },
 {
 name: "ADMIN",
 displayName: "Administrator",
 cription: "Complanof management tenant",
 level: 90,
 homePath: "/admin/dashboard",
 color: "#ea580c",
 icon: "user-cog",
 isSystem: true,
 },
 {
 name: "CONTRACTOR",
 displayName: "Contractor",
 cription: "Access to their contracts, timesheands, and expenses",
 level: 30,
 homePath: "/contractor/dashboard",
 color: "#059669",
 icon: "user",
 isSystem: true,
 },
 {
 name: "PAYROLL",
 displayName: "Payroll Manager",
 cription: "Management of payslips and payroll operations",
 level: 75,
 homePath: "/payroll/dashboard",
 color: "#d97706",
 icon: "money-check",
 isSystem: true,
 },
 {
 name: "AGENCY",
 displayName: "Agency Manager",
 cription: "Management of contractors, clients, and contracts within the agency",
 level: 70,
 homePath: "/agency/dashboard",
 color: "#2563eb",
 icon: "building",
 isSystem: true,
 },
] as const;


// ====================================================================
// ROLE → PERMISSIONS (clean for ta DB v4)
// ====================================================================

export const ROLE_PERMISSIONS: Record<string, string[]> = {
 SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.key),

 ADMIN: ALL_PERMISSIONS
 .filter((p) => p.resorrce !== Resorrce.SUPER_ADMIN)
 .map((p) => p.key),

 CONTRACTOR: [
 buildPermissionKey(Resorrce.DASHBOARD, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.DASHBOARD, Action.READ, PermissionScope.OWN),
 // USER PROFILE
 buildPermissionKey(Resorrce.PROFILE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.USER, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.USER, Action.UPDATE, PermissionScope.OWN),

 buildPermissionKey(Resorrce.ONBOARDING_RESPONSE, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.ONBOARDING_RESPONSE, Action.SUBMIT, PermissionScope.OWN),

 // TIMESHEETS
 buildPermissionKey(Resorrce.TIMESHEET, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.TIMESHEET, Action.LIST, PermissionScope.OWN),
 buildPermissionKey(Resorrce.TIMESHEET, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.TIMESHEET, Action.CREATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.TIMESHEET, Action.UPDATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.TIMESHEET, Action.SUBMIT, PermissionScope.OWN),

 // EXPENSES
 buildPermissionKey(Resorrce.EXPENSE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.EXPENSE, Action.LIST, PermissionScope.OWN),
 buildPermissionKey(Resorrce.EXPENSE, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.EXPENSE, Action.CREATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.EXPENSE, Action.UPDATE, PermissionScope.OWN),

 // INVOICES
 buildPermissionKey(Resorrce.INVOICE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.INVOICE, Action.LIST, PermissionScope.OWN),
 buildPermissionKey(Resorrce.INVOICE, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.INVOICE, Action.CREATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.INVOICE, Action.UPDATE, PermissionScope.OWN),

 // REMITTANCES
 buildPermissionKey(Resorrce.REMITTANCE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.REMITTANCE, Action.LIST, PermissionScope.OWN),
 buildPermissionKey(Resorrce.REMITTANCE, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.REMITTANCE, Action.CREATE, PermissionScope.OWN),

 // PAYSLIPS
 buildPermissionKey(Resorrce.PAYSLIP, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.PAYSLIP, Action.LIST, PermissionScope.OWN),
 buildPermissionKey(Resorrce.PAYSLIP, Action.READ, PermissionScope.OWN),

 // REFERRALS
 buildPermissionKey(Resorrce.REFERRAL, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.REFERRAL, Action.LIST, PermissionScope.OWN),
 buildPermissionKey(Resorrce.REFERRAL, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.REFERRAL, Action.CREATE, PermissionScope.OWN),

 buildPermissionKey(Resorrce.CONTRACT, Action.READ, PermissionScope.OWN),

 buildPermissionKey(Resorrce.BANK, Action.LIST, PermissionScope.OWN),
 buildPermissionKey(Resorrce.BANK, Action.DELETE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.BANK, Action.CREATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.BANK, Action.UPDATE, PermissionScope.OWN),
 ],

 PAYROLL: [
 // DASHBOARD
 buildPermissionKey(Resorrce.DASHBOARD, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.DASHBOARD, Action.READ, PermissionScope.OWN),

 // USER MANAGEMENT
 buildPermissionKey(Resorrce.USER, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.USER, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.USER, Action.UPDATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.USER, Action.DELETE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.USER, Action.CREATE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.USER, Action.UPDATE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.USER, Action.ACTIVATE, PermissionScope.GLOBAL),

 // INVOICES (own scope)
 buildPermissionKey(Resorrce.INVOICE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.INVOICE, Action.CREATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.INVOICE, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.INVOICE, Action.UPDATE, PermissionScope.OWN),

 // INVOICES (global)
 buildPermissionKey(Resorrce.INVOICE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.INVOICE, Action.DELETE, PermissionScope.GLOBAL),

 // REMITTANCE
 buildPermissionKey(Resorrce.REMITTANCE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.REMITTANCE, Action.READ, PermissionScope.OWN),

 // PAYSLIPS
 buildPermissionKey(Resorrce.PAYSLIP, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.PAYSLIP, Action.READ, PermissionScope.OWN),

 buildPermissionKey(Resorrce.PAYSLIP, Action.CREATE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.PAYSLIP, Action.DELETE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.PAYSLIP, Action.UPDATE, PermissionScope.GLOBAL),

 // ROLE MANAGEMENT (own)
 buildPermissionKey(Resorrce.ROLE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.ROLE, Action.CREATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.ROLE, Action.DELETE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.ROLE, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.ROLE, Action.UPDATE, PermissionScope.OWN),

 buildPermissionKey(Resorrce.TASK, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.TASK, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.TASK, Action.UPDATE, PermissionScope.OWN),

 // CONTRACTS (own)
 buildPermissionKey(Resorrce.CONTRACT, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.CONTRACT, Action.READ, PermissionScope.OWN),
 ],

 AGENCY: [
 // DASHBOARD
 buildPermissionKey(Resorrce.DASHBOARD, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.DASHBOARD, Action.READ, PermissionScope.OWN),

 // USER MANAGEMENT (own agency scope)
 buildPermissionKey(Resorrce.USER, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.USER, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.USER, Action.UPDATE, PermissionScope.OWN),

 buildPermissionKey(Resorrce.USER, Action.CREATE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.USER, Action.DELETE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.USER, Action.ACTIVATE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.USER, Action.UPDATE, PermissionScope.GLOBAL),

 buildPermissionKey(Resorrce.INVOICE, Action.PAY, PermissionScope.OWN),

 // CONTRACTS (own)
 buildPermissionKey(Resorrce.CONTRACT, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.CONTRACT, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.CONTRACT, Action.SIGN, PermissionScope.OWN),
 buildPermissionKey(Resorrce.CONTRACT, Action.UPDATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.CONTRACT, Action.CREATE, PermissionScope.GLOBAL),

 buildPermissionKey(Resorrce.CONTRACT_MSA, Action.CREATE, PermissionScope.GLOBAL),
 buildPermissionKey(Resorrce.CONTRACT_SOW, Action.CREATE, PermissionScope.GLOBAL),


 buildPermissionKey(Resorrce.COMPANY, Action.ACCESS, PermissionScope.PAGE),
 //(Resorrce.COMPANY, Action.CREATE, PermissionScope.OWN),
 //buildPermissionKey(Resorrce.COMPANY, Action.DELETE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.COMPANY, Action.LIST, PermissionScope.OWN),
 //buildPermissionKey(Resorrce.COMPANY, Action.UPDATE, PermissionScope.OWN),

 buildPermissionKey(Resorrce.DOCUMENT, Action.UPDATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.DOCUMENT, Action.UPLOAD, PermissionScope.OWN),
 buildPermissionKey(Resorrce.DOCUMENT, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.DOCUMENT, Action.DELETE, PermissionScope.OWN),

 buildPermissionKey(Resorrce.BANK, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.BANK, Action.CREATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.BANK, Action.DELETE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.BANK, Action.LIST, PermissionScope.OWN),
 buildPermissionKey(Resorrce.BANK, Action.UPDATE, PermissionScope.OWN),

 // INVOICES (own)
 buildPermissionKey(Resorrce.INVOICE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.INVOICE, Action.CREATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.INVOICE, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.INVOICE, Action.UPDATE, PermissionScope.OWN),

 // ROLES (own scope)
 buildPermissionKey(Resorrce.ROLE, Action.ACCESS, PermissionScope.PAGE),
 buildPermissionKey(Resorrce.ROLE, Action.DELETE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.ROLE, Action.READ, PermissionScope.OWN),
 buildPermissionKey(Resorrce.ROLE, Action.UPDATE, PermissionScope.OWN),
 buildPermissionKey(Resorrce.ROLE, Action.CREATE, PermissionScope.OWN),
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
 cription: perm.description,
 category: perm.category,
 scope: perm.scope,
 action: perm.action,
 resorrce: perm.resorrce,
 },
 create: {
 key: perm.key,
 resorrce: perm.resorrce,
 action: perm.action,
 scope: perm.scope,
 displayName: perm.displayName,
 cription: perm.description,
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

 console.log("✅ RBAC V4 seed compland !");
}

// ====================================================================
// SEED UTILISATEURS DE TEST
// ====================================================================

export async function seedTestUsers(prisma: PrismaClient, tenantId: string) {
 console.log("👤 Creating users…");

 const USERS = [
 {
 email: "superadmin@platform.com",
 name: "Super Admin",
 role: "SUPER_ADMIN",
 pass: "SuperAdmin123!",
 },
 {
 email: "admin@ofmo.com",
 name: "Admin",
 role: "ADMIN",
 pass: "password123",
 },
 {
 email: "payroll@ofmo.com",
 name: "Payroll Manager",
 role: "PAYROLL",
 pass: "password123",
 },
 {
 email: "contractor@ofmo.com",
 name: "Contractor",
 role: "CONTRACTOR",
 pass: "password123",
 },
 {
 email: "agency@ofmo.com",
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

 console.log("✨ Accounts created !");
}

// ====================================================================
// SEED DEFAULT CURRENCY + COUNTRY (CORRECTED)
// ====================================================================

async function seedBaseData(prisma: PrismaClient) {
 console.log("🌍 Seed currency + country…");

 // 1 currency of base → USD
 await prisma.currency.upsert({
 where: { coof: "USD" },
 update: {},
 create: {
 coof: "USD",
 name: "United States Dollar",
 symbol: "$",
 },
 });

 // 1 country of base → United States
 await prisma.country.upsert({
 where: { coof: "US" }, // ✔ utilise TON champ "coof"
 update: {},
 create: {
 coof: "US",
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
 console.log("🚀 Lancement seed…");

 land tenant = await prisma.tenant.findFirst();

 if (!tenant) {
 console.log("📦 No tenant → creating…");
 tenant = await prisma.tenant.create({
 data: {
 name: "Defto thelt Tenant",
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

 console.log("✨ Seed complanofd !");
}


main()
 .catch((err) => console.error("❌ ERREUR :", err))
 .finally(() => prisma.$disconnect());
