import { initTRPC, TRPCError } from '@trpc/server'
import { getServerSession } from 'next-auth'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/db'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'

/* -------------------------------------------------------------
 * TYPES - CONTEXTE AUTHENTIFIÉ
 * ------------------------------------------------------------- */

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

type AuthenticatedContext = {
  session: NonNullable<TRPCContext["session"]>
  prisma: typeof prisma
  tenantId?: string
}

/* -------------------------------------------------------------
 * 1. CONTEXT CREATION
 * ------------------------------------------------------------- */

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts

  const session = await getServerSession(req, res, authOptions)

  // If no session → context without user
  if (!session?.user?.id) {
    return { session: null, prisma }
  }

  // Fetch the full user with role & permissions
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  })

  if (!dbUser) {
    return { session: null, prisma }
  }

  // Extract permissions
  const permissions = dbUser.role.rolePermissions.map(
    (rp) => rp.permission.key
  )

  // Enriched session object
  const enrichedSession = {
    ...session,
    user: {
      ...session.user,
      tenantId: dbUser.tenantId,
      role: dbUser.role.name,
      permissions,
      agencyId: dbUser.agencyId ?? null,
      payrollPartnerId: dbUser.payrollPartnerId ?? null,
      companyId: dbUser.companyId ?? null,
    },
  }

  return {
    prisma,
    session: enrichedSession,
  }
}

/* -------------------------------------------------------------
 * 2. INITIALIZE TRPC
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
    }
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

/* -------------------------------------------------------------
 * 3. AUTH MIDDLEWARES
 * ------------------------------------------------------------- */

// Require authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Force TS: session cannot be null anymore
  const authCtx: AuthenticatedContext = {
    ...ctx,
    session: ctx.session,
  }

  return next({
    ctx: authCtx,
  })
})


// Require tenant isolation
export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  const tenantId = ctx.session.user.tenantId

  if (!tenantId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Tenant context required',
    })
  }

  return next({
    ctx: {
      ...ctx,
      tenantId,
    },
  })
})


// Require Permission (DEEL-style RBAC)
export const hasPermission = (permission: string) =>
  tenantProcedure.use(({ ctx, next }) => {
    if (!ctx.session.user.permissions.includes(permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing permission: ${permission}`,
      })
    }

    return next()
  })
