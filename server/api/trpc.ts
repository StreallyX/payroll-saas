// src/server/api/trpc.ts

import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers, cookies } from "next/headers";
import { SUPERADMIN_PERMISSIONS } from "@/server/rbac/permissions";

/* -------------------------------------------------------------
 * 1) CONTEXT TYPE
 * ------------------------------------------------------------- */

export type TRPCContext = {
  prisma: typeof prisma;
  session: any | null;
  tenantId?: string | null;
};

/* -------------------------------------------------------------
 * 2) NEW CONTEXT CREATION — FIX SUPERADMIN + SESSION
 * ------------------------------------------------------------- */

export async function createTRPCContext(opts: { req: Request }): Promise<TRPCContext> {
  // ⭐ NECESSARY FIX FOR NEXTAUTH + APP ROUTER
  const session = await getServerSession({
    ...authOptions,
    req: {
      headers: Object.fromEntries(headers()),
      cookies: Object.fromEntries(
        cookies()
          .getAll()
          .map(c => [c.name, c.value])
      ),
    },
  });

  // No session → public access
  if (!session?.user?.id) {
    return { prisma, session: null, tenantId: null };
  }

  // ⭐ SUPERADMIN FIX → does not exist in prisma.user
  if (session.user.isSuperAdmin) {
    return {
      prisma,
      session: {
        ...session,
        user: {
          ...session.user,
          permissions: SUPERADMIN_PERMISSIONS,
          tenantId: null,
          roleName: "superadmin",
          roleId: null,
          agencyId: null,
          payrollPartnerId: null,
          companyId: null,
        },
      },
      tenantId: null,
    };
  }

  // Regular tenant user → load from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!dbUser) {
    return { prisma, session: null, tenantId: null };
  }

  const permissions = dbUser.role.rolePermissions.map(p => p.permission.key);

  return {
    prisma,
    session: {
      ...session,
      user: {
        ...session.user,
        tenantId: dbUser.tenantId,
        roleId: dbUser.roleId,
        roleName: dbUser.role.name,
        permissions,
        agencyId: dbUser.agencyId,
        payrollPartnerId: dbUser.payrollPartnerId,
        companyId: dbUser.companyId,
      },
    },
    tenantId: dbUser.tenantId,
  };
}

/* -------------------------------------------------------------
 * 3) TRPC INIT
 * ------------------------------------------------------------- */

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/* -------------------------------------------------------------
 * 4) MIDDLEWARES
 * ------------------------------------------------------------- */

// Require login
const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next();
});

// Require tenant
const requireTenant = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tenant required",
    });
  }

  return next({
    ctx: { ...ctx, tenantId: ctx.session.user.tenantId },
  });
});

// Permission check
export const requirePermission = (permission: string) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session!.user.permissions.includes(permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing permission ${permission}`,
      });
    }

    return next();
  });

// Check if user has ANY of the specified permissions (DEEL pattern)
export const requireAnyPermission = (permissions: string[]) =>
  t.middleware(({ ctx, next }) => {
    const userPermissions = ctx.session!.user.permissions || [];
    const hasAny = permissions.some(p => userPermissions.includes(p));
    
    if (!hasAny && !ctx.session!.user.isSuperAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required permissions: ${permissions.join(" or ")}`,
      });
    }

    return next();
  });

export const protectedProcedure = t.procedure.use(requireAuth);
export const tenantProcedure = protectedProcedure.use(requireTenant);
export const hasPermission = (permission: string) => requirePermission(permission);
export const hasAnyPermission = (permissions: string[]) => requireAnyPermission(permissions);
