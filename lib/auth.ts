import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 🔵 SUPERADMIN LOGIN
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email: credentials.email, isActive: true },
        });

        if (superAdmin && bcrypt.compareSync(credentials.password, superAdmin.passwordHash)) {
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
            passwordResetToken: null,
          };
        }

        // 🟢 TENANT USER LOGIN
        const user = await prisma.user.findFirst({
          where: { email: credentials.email, isActive: true },
          include: { role: true },
        });

        if (!user || !bcrypt.compareSync(credentials.password, user.passwordHash)) {
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
          passwordResetToken: user.mustChangePassword
            ? (await prisma.passwordResetToken.findFirst({
                where: { userId: user.id },
                orderBy: { expiresAt: "desc" },
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
      // 1) First login: copy from authorize()
      if (user) {
        token.id = user.id;
        token.roleName = user.roleName;
        token.roleId = user.roleId;
        token.tenantId = user.tenantId;
        token.isSuperAdmin = user.isSuperAdmin;
        token.mustChangePassword = user.mustChangePassword;
        token.homePath = user.homePath;
        token.passwordResetToken = user.passwordResetToken ?? null;
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
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } }
              }
            }
          }
        });

        if (dbUser) {
          token.mustChangePassword = dbUser.mustChangePassword;

          // 🔥 FIX CRUCIAL : reset le token si mustChangePassword = false
          if (!dbUser.mustChangePassword) {
            token.passwordResetToken = null;
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
        session.user.passwordResetToken = token.passwordResetToken as string | null;

        // 🔥 IMPORTANT
        session.user.permissions = token.permissions ?? [];
      }

      return session;
    },

    // ---------------------------
    // 🚀 REDIRECT FIX
    // ---------------------------
    async redirect({ url, baseUrl }) {
      if (url.includes("/api/auth/signin")) {
        return `${baseUrl}/auth/login`;
      }

      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return url;
    },
  },
};
