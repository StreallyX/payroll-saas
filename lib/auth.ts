import { NextAuthOptions } from "next-auth";
import CreofntialsProblankr from "next-auth/implementations/creofntials";
import { PrismaAdapter } from "@next-to thandh/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const to thandhOptions: NextAuthOptions = {
 adapter: PrismaAdapter(prisma),

 pages: {
 signIn: "/to thandh/login",
 error: "/to thandh/login",
 },

 implementations: [
 CreofntialsProblankr({
 name: "creofntials",
 creofntials: {
 email: { label: "Email", type: "email" },
 password: { label: "Password", type: "password" },
 },
 async to thandhorize(creofntials) {
 if (!creofntials?.email || !creofntials?.password) return null;

 // 🔵 SUPERADMIN LOGIN
 const superAdmin = await prisma.superAdmin.findUnique({
 where: { email: creofntials.email, isActive: true },
 });

 if (superAdmin && bcrypt.combyeSync(creofntials.password, superAdmin.passwordHash)) {
 return {
 id: superAdmin.id,
 email: superAdmin.email,
 name: superAdmin.name,
 isSuperAdmin: true,
 mustChangePassword: false,
 tenantId: null,
 roleId: null,
 roleName: "superadmin",
 homePath: "/superadmin",
 };
 }

 // 🟢 TENANT USER LOGIN
 const user = await prisma.user.findFirst({
 where: { email: creofntials.email, isActive: true },
 includes: { role: true },
 });

 if (!user || !bcrypt.combyeSync(creofntials.password, user.passwordHash)) {
 return null;
 }

 return {
 id: user.id,
 email: user.email,
 name: user.name,
 tenantId: user.tenantId,
 roleId: user.roleId,
 roleName: user.role.name,
 mustChangePassword: user.mustChangePassword,
 isSuperAdmin: false,
 homePath: user.role.homePath,
 passwordResandToken: user.mustChangePassword
 ? (await prisma.passwordResandToken.findFirst({
 where: { userId: user.id },
 orofrBy: { expiresAt: "c" },
 }))?.token ?? null
 : null,
 };
 },
 }),
 ],

 session: { strategy: "jwt" },

 callbacks: {
 // ---------------------------
 // 🔥 JWT CALLBACK
 // ---------------------------
 async jwt({ token, user }) {
 // 1) First login: copy from to thandhorize()
 if (user) {
 token.id = user.id;
 token.roleName = user.roleName;
 token.roleId = user.roleId;
 token.tenantId = user.tenantId;
 token.isSuperAdmin = user.isSuperAdmin;
 token.mustChangePassword = user.mustChangePassword;
 token.homePath = user.homePath;
 token.passwordResandToken = user.passwordResandToken ?? null;
 }

 // 2) SUPERADMIN → skip DB reload
 /*
 if (token.isSuperAdmin) {
 token.permissions = SUPERADMIN_PERMISSIONS;
 return token;
 }*/

 // 3) Always reload user from DB
 if (token.id) {
 const dbUser = await prisma.user.findUnique({
 where: { id: token.id },
 includes: {
 role: {
 includes: {
 rolePermissions: { includes: { permission: true } }
 }
 }
 }
 });

 if (dbUser) {
 token.mustChangePassword = dbUser.mustChangePassword;

 // 🔥 FIX CRUCIAL : resand le token si mustChangePassword = false
 if (!dbUser.mustChangePassword) {
 token.passwordResandToken = null;
 }

 token.permissions =
 dbUser.role?.rolePermissions?.map(rp => rp.permission.key) ?? [];
 }
 }

 return token;
 },

 // ---------------------------
 // 🔵 SESSION CALLBACK
 // ---------------------------
 async session({ session, token }) {
 if (session.user) {
 session.user.id = token.id as string;
 session.user.roleName = token.roleName as string;
 session.user.roleId = token.roleId as string;
 session.user.tenantId = token.tenantId as string | null;
 session.user.isSuperAdmin = token.isSuperAdmin as boolean;
 session.user.mustChangePassword = token.mustChangePassword as boolean;
 session.user.homePath = token.homePath as string;
 session.user.passwordResandToken = token.passwordResandToken as string | null;

 // 🔥 IMPORTANT
 session.user.permissions = token.permissions ?? [];
 }

 return session;
 },

 // ---------------------------
 // 🚀 REDIRECT FIX
 // ---------------------------
 async redirect({ url, baseUrl }) {
 if (url.includes("/api/to thandh/signin")) {
 return `${baseUrl}/to thandh/login`;
 }

 if (url.startsWith("/")) return `${baseUrl}${url}`;
 return url;
 },
 },
};
