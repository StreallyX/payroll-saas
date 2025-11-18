import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc";
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2";

export const profileRouter = createTRPCRouter({

  // ---------------------------------------------------------
  // GET OWN PROFILE
  // ---------------------------------------------------------
  getOwn: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.profile.view))
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user.id;

      const user = await ctx.prisma.user.findFirst({
        where: { id: userId, tenantId: ctx.tenantId },
        include: {
          role: true,
          agency: true,
          payrollPartner: true,
          company: true,
        },
      });

      if (!user) throw new Error("User not found.");

      return user;
    }),

  // ---------------------------------------------------------
  // UPDATE OWN PROFILE
  // ---------------------------------------------------------
  updateOwn: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.profile.update))
    .input(
      z.object({
        name: z.string().min(2),
        phone: z.string().nullable().optional(),
        timezone: z.string().nullable().optional(),
        language: z.string().nullable().optional(),
        profilePictureUrl: z.string().nullable().optional(),
        preferences: z.any().optional(), // JSON
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      const tenantId = ctx.tenantId!;

      const updated = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          phone: input.phone ?? null,
          timezone: input.timezone ?? undefined,
          language: input.language ?? undefined,
          profilePictureUrl: input.profilePictureUrl ?? undefined,
          preferences: input.preferences ?? undefined,
          lastActivityAt: new Date(),
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
            tenantId,
            userId,
            userName: ctx.session!.user.name ?? "Unknown",
            userRole: ctx.session!.user.roleName,
            action: "PROFILE_UPDATE",
            entityType: "profile",
            entityId: userId,
            entityName: updated.name || "User",
            description: "User updated own profile",
        },
        });

      return updated;
    }),
});
