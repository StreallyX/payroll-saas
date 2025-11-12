import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 🧠 Étape 1 : Vérifie si c’est un SuperAdmin
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email: credentials.email, isActive: true },
        });

        if (superAdmin && bcrypt.compareSync(credentials.password, superAdmin.passwordHash)) {
          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            tenantId: null,
            roleId: null,
            roleName: "superadmin",
            tenant: null,
            isSuperAdmin: true,
          };
        }

        // 🧠 Étape 2 : Sinon, utilisateur classique (lié à un tenant)
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            isActive: true,
          },
          include: {
            tenant: true,
            role: true,
          },
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
          tenant: user.tenant,
          isSuperAdmin: false,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId;
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.tenant = user.tenant;
        token.isSuperAdmin = user.isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.tenantId = token.tenantId as string | null;
        session.user.roleId = token.roleId as string | null;
        session.user.roleName = token.roleName as string;
        session.user.tenant = token.tenant as any;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
