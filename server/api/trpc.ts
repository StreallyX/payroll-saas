
import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type Session } from 'next-auth'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/db'

/**
 * 1. CONTEXT
 * This section defines the "contexts" that are available in the backend API.
 */

type CreateContextOptions = {
  session: Session | null
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  }
}

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts

  // Get the session from the server using the getServerSession wrapper function
  const session = await getServerSession(req, res, authOptions)

  return createInnerTRPCContext({
    session,
  })
}

// Create context for fetch adapter (App Router)
export const createTRPCContextFetch = async (opts: { req: Request }) => {
  return createInnerTRPCContext({
    session: null, // TODO: Extract session from request headers if needed
  })
}

/**
 * 2. INITIALIZATION
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
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

/**
 * 3. ROUTER & PROCEDURE HELPERS
 */

export const createTRPCRouter = t.router

// Base procedure
export const publicProcedure = t.procedure

// Protected procedure with authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

// Tenant-scoped procedure (ensures all operations are tenant-aware)
export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  const tenantId = ctx.session.user.tenantId
  if (!tenantId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Tenant context required' })
  }
  
  return next({
    ctx: {
      ...ctx,
      tenantId,
    },
  })
})

// Admin procedure (ensures only admins can perform certain operations)
export const adminProcedure = tenantProcedure.use(async ({ ctx, next }) => {
  const userRole = ctx.session.user.roleName?.toLowerCase()
  
  if (!userRole || userRole !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Seuls les administrateurs peuvent effectuer cette action' 
    })
  }
  
  return next({
    ctx: {
      ...ctx,
    },
  })
})
