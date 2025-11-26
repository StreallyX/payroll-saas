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

  // ===================================================================
  // 🟢 USER LOGIN (ALL ROLES, INCLUDING PLATFORM_ADMIN)
  // ===================================================================

  const user = await prisma.user.findFirst({
    where: {
      email: credentials.email,
      isActive: true,
    },
    include: { role: true },
  });

  // Debug logs — IMPORTANT
  console.log("🔍 AUTH DEBUG INPUT:", credentials);
  console.log("🔍 AUTH DEBUG USER:", user);

  if (!user) {
    console.log("❌ USER NOT FOUND");
    return null;
  }

  const valid = await bcrypt.compare(credentials.password, user.passwordHash);

  console.log("🔍 AUTH DEBUG VALID PASSWORD:", valid);

  if (!valid) {
    console.log("❌ WRONG PASSWORD");
    return null;
  }

  // SUCCESS
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    roleId: user.roleId,
    roleName: user.role.name,
    isSuperAdmin: user.role.name === "PLATFORM_ADMIN",
    mustChangePassword: user.mustChangePassword,
    homePath: user.role.homePath,
  };
}
,
    }),
  ],

  session: { strategy: "jwt" },

  // ===================================================================
  // 🔥 JWT CALLBACK
  // ===================================================================
  callbacks: {
    async jwt({ token, user }) {
      // First login
      if (user) {
        token.id = user.id;
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.tenantId = user.tenantId;
        token.isSuperAdmin = user.isSuperAdmin;
        token.mustChangePassword = user.mustChangePassword;
        token.homePath = user.homePath;
      }

      // Reload permissions except for superadmin
      if (token.id && !token.isSuperAdmin) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        });

        if (dbUser) {
          token.permissions = dbUser.role?.rolePermissions.map(rp => rp.permission.key) ?? [];
          token.mustChangePassword = dbUser.mustChangePassword;
        }
      }

      // SuperAdmin = full permissions
      if (token.isSuperAdmin) {
        token.permissions = ["*"];
      }

      return token;
    },

    // ===================================================================
    // 🔵 SESSION CALLBACK
    // ===================================================================
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roleId = token.roleId as string;
        session.user.roleName = token.roleName as string;
        session.user.tenantId = token.tenantId as string | null;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.homePath = token.homePath as string;
        session.user.permissions = token.permissions ?? [];
      }

      return session;
    },

    // ===================================================================
    // 🚀 REDIRECT HANDLER
    // ===================================================================
    async redirect({ url, baseUrl }) {
      if (url.includes("/api/auth/signin")) {
        return `${baseUrl}/auth/login`;
      }

      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return url;
    },
  },
};
