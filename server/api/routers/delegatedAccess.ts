// server/api/routers/delegatedAccess.ts
import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";

const PERMS = {
  MANAGE_DELEGATED_ACCESS: "user.update.global", // Reuse existing permission
} as const;

export const delegatedAccessRouter = createTRPCRouter({
  // ---------------------------------------------------------
  // LIST DELEGATED ACCESSES (for a specific user)
  // ---------------------------------------------------------
  list: tenantProcedure
    .use(hasPermission(PERMS.MANAGE_DELEGATED_ACCESS))
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        tenantId: ctx.tenantId,
      };

      if (input.userId) {
        where.grantedToUserId = input.userId;
      }

      return ctx.prisma.delegatedAccess.findMany({
        where,
        include: {
          grantedToUser: { select: { id: true, name: true, email: true } },
          grantedForUser: { select: { id: true, name: true, email: true } },
          grantedByUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ---------------------------------------------------------
  // GRANT DELEGATED ACCESS
  // ---------------------------------------------------------
  grant: tenantProcedure
    .use(hasPermission(PERMS.MANAGE_DELEGATED_ACCESS))
    .input(
      z.object({
        grantedToUserId: z.string(),
        grantedForUserId: z.string(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if grant already exists
      const existing = await ctx.prisma.delegatedAccess.findUnique({
        where: {
          grantedToUserId_grantedForUserId: {
            grantedToUserId: input.grantedToUserId,
            grantedForUserId: input.grantedForUserId,
          },
        },
      });

      if (existing) {
        throw new Error("Delegated access already granted.");
      }

      const grant = await ctx.prisma.delegatedAccess.create({
        data: {
          tenantId: ctx.tenantId!,
          grantedToUserId: input.grantedToUserId,
          grantedForUserId: input.grantedForUserId,
          grantedBy: ctx.session.user.id,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "DELEGATED_ACCESS_GRANTED",
          entityType: "delegated_access",
          entityId: grant.id,
          description: `Granted delegated access`,
          metadata: {
            grantedToUserId: input.grantedToUserId,
            grantedForUserId: input.grantedForUserId,
          },
        },
      });

      return { success: true, grant };
    }),

  // ---------------------------------------------------------
  // REVOKE DELEGATED ACCESS
  // ---------------------------------------------------------
  revoke: tenantProcedure
    .use(hasPermission(PERMS.MANAGE_DELEGATED_ACCESS))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const grant = await ctx.prisma.delegatedAccess.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!grant) {
        throw new Error("Delegated access not found.");
      }

      await ctx.prisma.delegatedAccess.delete({
        where: { id: input.id },
      });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "DELEGATED_ACCESS_REVOKED",
          entityType: "delegated_access",
          entityId: input.id,
          description: `Revoked delegated access`,
          metadata: {
            grantedToUserId: grant.grantedToUserId,
            grantedForUserId: grant.grantedForUserId,
          },
        },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // GET DELEGATED USERS (users that the current user has access to)
  // ---------------------------------------------------------
  getDelegatedUsers: tenantProcedure
    .query(async ({ ctx }) => {
      const grants = await ctx.prisma.delegatedAccess.findMany({
        where: {
          tenantId: ctx.tenantId,
          grantedToUserId: ctx.session.user.id,
        },
        include: {
          grantedForUser: {
            include: {
              role: true,
            },
          },
        },
      });

      return grants.map((grant) => grant.grantedForUser);
    }),
});
