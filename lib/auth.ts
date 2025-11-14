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

        // SUPERADMIN LOGIN
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
          };
        }

        // TENANT USER LOGIN
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roleName = user.roleName;
        token.roleId = user.roleId;
        token.tenantId = user.tenantId;
        token.isSuperAdmin = user.isSuperAdmin;
        token.mustChangePassword = user.mustChangePassword;
        token.homePath = user.homePath;
        token.passwordResetToken = user.passwordResetToken ?? null;

        if (user.isSuperAdmin) {
          const allPermissions = await prisma.permission.findMany({
            select: { key: true },
          });

          token.permissions = allPermissions.map((p) => p.key);
          return token;
        }

        if (user.roleId) {
          const dbUser = await prisma.user.findFirst({
            where: { id: user.id },
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          });

          token.permissions =
            dbUser?.role?.rolePermissions?.map((rp) => rp.permission.key) ?? [];
        }
      }

      return token;
    },

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
        session.user.permissions = token.permissions ?? [];
      }

      return session;
    },

    // 🚀 FIX REDIRECTION NEXTAUTH
    async redirect({ url, baseUrl }) {
      if (url.includes("/api/auth/signin")) {
        return `${baseUrl}/auth/login`;
      }

      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return url;
    },
  },
};
