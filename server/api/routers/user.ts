// src/server/api/routers/user.ts
import { z } from "zod";
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateRandomPassword } from "@/lib/utils";
import { getUsersVisibleFor } from "@/server/helpers/user";

// -----------------------------
// Permissions (tes clés existantes)
// -----------------------------
const PERMS = {
  READ_OWN: "user.read.own",
  UPDATE_OWN: "user.update.own",
  LIST_GLOBAL: "user.list.global",
  CREATE_GLOBAL: "user.create.global",
  UPDATE_GLOBAL: "user.update.global",
  DELETE_GLOBAL: "user.delete.global",
  ACTIVATE_GLOBAL: "user.activate.global",
  IMPERSONATE_GLOBAL: "user.impersonate.global",
} as const;

// -------------------------------------------
// Ownership helper: récupère toute la subtree
// -------------------------------------------
async function getSubtreeUserIds(prisma: any, rootUserId: string): Promise<string[]> {
  const owned: string[] = [];
  let frontier: string[] = [rootUserId];

  // On ne veut PAS ré-inclure rootUserId dans owned, donc on part de ses enfants
  while (frontier.length > 0) {
    const children = await prisma.user.findMany({
      where: { createdBy: { in: frontier } },
      select: { id: true },
    });
    if (children.length === 0) break;

    const next = children.map((c: { id: string }) => c.id);
    owned.push(...next);
    frontier = next;
  }
  return owned;
}

export const userRouter = createTRPCRouter({
  // ---------------------------------------------------------
  // GET ALL USERS
  // - global -> tout voir (scope: global)
  // - ownCompany -> users de la même company (scope: ownCompany)
  // - own    -> self + subtree (scope: parent)
  // ---------------------------------------------------------
  getAll: tenantProcedure
    .use(hasAnyPermission([PERMS.LIST_GLOBAL, PERMS.READ_OWN]))
    .query(async ({ ctx }) => {
      const { prisma, session, tenantId } = ctx;
      const user = session.user;
      const perms = session.user.permissions || [];

      // Déterminer le scope en fonction des permissions
      let scope: "global" | "ownCompany" | "parent" = "parent";

      if (perms.includes(PERMS.LIST_GLOBAL)) {
        scope = "global";
      } else if (user.companyId) {
        // Si le user a une company, utiliser scope ownCompany
        scope = "ownCompany";
      }

      // 🔥 Utiliser le helper getUsersVisibleFor
      return getUsersVisibleFor(user as any, scope);
    }),

  // ---------------------------------------------------------
  // GET ONE USER
  // - global -> tout voir
  // - own    -> self + subtree
  // ---------------------------------------------------------
  getById: tenantProcedure
    .use(hasAnyPermission([PERMS.LIST_GLOBAL, PERMS.READ_OWN]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma, session, tenantId } = ctx;
      const userId = session.user.id;
      const perms = session.user.permissions || [];
      const hasGlobal = perms.includes(PERMS.LIST_GLOBAL);

      if (hasGlobal) {
        return prisma.user.findFirst({
          where: { id: input.id, tenantId },
          include: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
        });
      }

      const subtree = await getSubtreeUserIds(prisma, userId);
      if (![userId, ...subtree].includes(input.id)) {
        throw new Error("Not allowed to view this user.");
      }

      return prisma.user.findFirst({
        where: { id: input.id, tenantId },
        include: { role: true, createdByUser: { select: { id: true, name: true, email: true } } },
      });
    }),

  // ---------------------------------------------------------
  // CREATE USER
  // - global uniquement (remplit createdBy)
  // ---------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMS.CREATE_GLOBAL))
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6).optional(),
        roleId: z.string(),
        // tu peux ajouter d’autres champs optionnels si besoin
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordToUse = input.password || generateRandomPassword(12);
      const passwordHash = await bcrypt.hash(passwordToUse, 10);

      // 🔥 Récupérer la company du user créateur pour héritage automatique
      const creator = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { companyId: true },
      });

      const newUser = await ctx.prisma.user.create({
        data: {
          tenantId: ctx.tenantId!,
          roleId: input.roleId,
          name: input.name,
          email: input.email,
          passwordHash,
          mustChangePassword: true,
          createdBy: ctx.session.user.id, // 🔥 ownership (parent)
          companyId: creator?.companyId, // 🔥 Héritage de la company du parent
        },
      });

      // Si password non fourni → on crée un token d’activation
      if (!input.password) {
        const token = crypto.randomBytes(48).toString("hex");
        await ctx.prisma.passwordResetToken.create({
          data: {
            userId: newUser.id,
            token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
          },
        });
      }

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "USER_CREATED",
          entityType: "user",
          entityId: newUser.id,
          entityName: newUser.name,
          description: `Created user ${newUser.name} (${newUser.email})`,
          metadata: { createdBy: ctx.session.user.id },
        },
      });

      return { success: true, id: newUser.id };
    }),

  // ---------------------------------------------------------
  // UPDATE USER
  // - global → peut tout modifier
  // - own    → peut modifier self + subtree
  // ---------------------------------------------------------
  update: tenantProcedure
    .use(hasAnyPermission([PERMS.UPDATE_GLOBAL, PERMS.UPDATE_OWN]))
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2),
        email: z.string().email(),
        roleId: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session, tenantId } = ctx;
      const perms = session.user.permissions || [];
      const hasGlobal = perms.includes(PERMS.UPDATE_GLOBAL);

      const target = await prisma.user.findFirst({
        where: { id: input.id, tenantId },
        select: { id: true, createdBy: true },
      });
      if (!target) throw new Error("User not found.");

      if (!hasGlobal) {
        // Must have UPDATE_OWN and target ∈ (self + subtree)
        if (!perms.includes(PERMS.UPDATE_OWN)) throw new Error("Not allowed.");
        const selfId = session.user.id;
        const subtree = await getSubtreeUserIds(prisma, selfId);
        if (![selfId, ...subtree].includes(target.id)) {
          throw new Error("Not allowed to update this user.");
        }
      }

      const updated = await prisma.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
          roleId: input.roleId,
          isActive: input.isActive,
        },
      });

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.user.id,
          userName: session.user.name ?? "Unknown",
          userRole: session.user.roleName,
          action: "USER_UPDATED",
          entityType: "user",
          entityId: updated.id,
          entityName: updated.name,
          description: `Updated user ${updated.name}`,
        },
      });

      return updated;
    }),

  // ---------------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // - global only
  // ---------------------------------------------------------
  setActive: tenantProcedure
    .use(hasPermission(PERMS.ACTIVATE_GLOBAL))
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new Error("User not found.");

      const updated = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: input.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          entityType: "user",
          entityId: updated.id,
          entityName: updated.name,
          description: `${input.isActive ? "Activated" : "Deactivated"} user ${updated.name}`,
        },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // DELETE USER
  // - global only
  // ---------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMS.DELETE_GLOBAL))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new Error("User not found.");

      const removed = await ctx.prisma.user.delete({ where: { id: input.id } });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "USER_DELETED",
          entityType: "user",
          entityId: removed.id,
          entityName: removed.name,
          description: `Deleted user ${removed.name}`,
        },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------
  // IMPERSONATE (squelette)
  // - global only — à adapter selon ta stack auth
  // ---------------------------------------------------------
  impersonate: tenantProcedure
    .use(hasPermission(PERMS.IMPERSONATE_GLOBAL))
    .input(z.object({ targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.prisma.user.findFirst({
        where: { id: input.targetUserId, tenantId: ctx.tenantId },
        select: { id: true, email: true, name: true },
      });
      if (!target) throw new Error("Target user not found.");

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId!,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? "Unknown",
          userRole: ctx.session.user.roleName,
          action: "USER_IMPERSONATE_START",
          entityType: "user",
          entityId: target.id,
          entityName: target.name,
          description: `Impersonation started`,
          metadata: { targetEmail: target.email },
        },
      });

      // TODO: génère un token d'impersonation/établit la session selon ton provider
      return { success: true, targetUserId: target.id };
    }),
});