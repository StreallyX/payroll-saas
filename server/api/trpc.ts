// src/server/api/trpc.ts

import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
/* -------------------------------------------------------------
 * 1) CONTEXT TYPE
 * ------------------------------------------------------------- */

export type TRPCContext = {
  prisma: typeof prisma;
  session: any | null;
  tenantId?: string | null;
};

/* -------------------------------------------------------------
 * 2) CONTEXT CREATION — SUPERADMIN FIX
 * ------------------------------------------------------------- */

export async function createTRPCContext(opts: { req: Request }): Promise<TRPCContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { prisma, session: null, tenantId: null };
  }

  // Load tenant user from DB
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

  const permissions = dbUser.role.rolePermissions.map((p) => p.permission.key);

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

// Require a SINGLE permission
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

/* -------------------------------------------------------------
 * NEW: REQUIRE ANY PERMISSION (for arrays)
 * ------------------------------------------------------------- */

export const requireAny = (permissions: string[]) =>
  t.middleware(({ ctx, next }) => {
    const userPermissions = ctx.session!.user.permissions || [];

    const allowed = permissions.some((p) => userPermissions.includes(p));

    if (!allowed && !ctx.session!.user.isSuperAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required permissions (${permissions.join(" OR ")})`,
      });
    }

    return next();
  });

/* -------------------------------------------------------------
 * EXPORTS FOR ROUTERS
 * ------------------------------------------------------------- */

export const protectedProcedure = t.procedure.use(requireAuth);
export const tenantProcedure = protectedProcedure.use(requireTenant);

// Aliases for convenience
export const hasPermission = (permission: string) =>
  requirePermission(permission);

export const hasAny = (permissions: string[]) =>
  requireAny(permissions);

export const hasAnyPermission = hasAny;
