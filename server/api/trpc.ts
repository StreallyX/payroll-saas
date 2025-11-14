// src/server/api/trpc.ts

import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";

/* -------------------------------------------------------------
 * 1) CONTEXT TYPE
 * ------------------------------------------------------------- */

export type TRPCContext = {
  prisma: typeof prisma;
  session: {
    user: {
      id: string;
      tenantId: string;
      role: string;
      permissions: string[];
      agencyId: string | null;
      payrollPartnerId: string | null;
      companyId: string | null;
      name?: string | null;
      email?: string | null;
    };
    expires: string;
  } | null;
  tenantId?: string;
};

/* -------------------------------------------------------------
 * 2) CONTEXT CREATION
 * ------------------------------------------------------------- */

export const createTRPCContext = async (
  opts: CreateNextContextOptions
): Promise<TRPCContext> => {
  const { req, res } = opts;

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return { prisma, session: null };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
    },
  });

  if (!dbUser) {
    return { prisma, session: null };
  }

  const permissions = dbUser.role.rolePermissions.map(
    (rp) => rp.permission.key
  );

  return {
    prisma,
    session: {
      ...session,
      user: {
        ...session.user,
        tenantId: dbUser.tenantId,
        role: dbUser.role.name,
        permissions,
        agencyId: dbUser.agencyId,
        payrollPartnerId: dbUser.payrollPartnerId,
        companyId: dbUser.companyId,
      },
    },
  };
};

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
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/* -------------------------------------------------------------
 * 4) MIDDLEWARES (correct, sans erreur)
 * ------------------------------------------------------------- */

// 🔐 1) Required auth
const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session, // session non-null
    },
  });
});

// 🏢 2) Required tenant
const requireTenant = t.middleware(({ ctx, next }) => {
  const tenantId = ctx.session!.user.tenantId;

  if (!tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tenant context required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      tenantId,
    },
  });
});

// 🛂 3) Required permission
const requirePermission = (permission: string) =>
  t.middleware(({ ctx, next }) => {
    const perms = ctx.session!.user.permissions;

    if (!perms.includes(permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing permission: ${permission}`,
      });
    }

    return next();
  });

/* -------------------------------------------------------------
 * 5) FINAL PROCEDURES (SANS ERREURS)
 * ------------------------------------------------------------- */

export const protectedProcedure = t.procedure.use(requireAuth);

export const tenantProcedure = protectedProcedure.use(requireTenant);

export const hasPermission = (permission: string) =>
  tenantProcedure.use(requirePermission(permission));
