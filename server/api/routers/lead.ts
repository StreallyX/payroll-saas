import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2"

// ---------------------------------------
// PERMISSIONS (V3 GLOBAL)
// ---------------------------------------
const CAN_LIST    = buildPermissionKey(Resource.LEAD, Action.LIST, PermissionScope.GLOBAL)
const CAN_CREATE  = buildPermissionKey(Resource.LEAD, Action.CREATE, PermissionScope.GLOBAL)
const CAN_UPDATE  = buildPermissionKey(Resource.LEAD, Action.UPDATE, PermissionScope.GLOBAL)
const CAN_DELETE  = buildPermissionKey(Resource.LEAD, Action.DELETE, PermissionScope.GLOBAL)
const CAN_ASSIGN  = buildPermissionKey(Resource.LEAD, Action.ASSIGN, PermissionScope.GLOBAL)
const CAN_EXPORT  = buildPermissionKey(Resource.LEAD, Action.EXPORT, PermissionScope.GLOBAL)

export const leadRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL (GLOBAL)
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(CAN_LIST))
    .query(async ({ ctx }) => {
      return ctx.prisma.lead.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
      })
    }),

  // -------------------------------------------------------
  // GET BY ID (GLOBAL)
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(CAN_LIST))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.lead.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
    }),

  // -------------------------------------------------------
  // STATS
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(CAN_LIST))
    .query(async ({ ctx }) => {
      const tenantId = ctx.tenantId

      const [total, hot, warm, cold] = await Promise.all([
        ctx.prisma.lead.count({ where: { tenantId } }),
        ctx.prisma.lead.count({ where: { tenantId, status: "hot" } }),
        ctx.prisma.lead.count({ where: { tenantId, status: "warm" } }),
        ctx.prisma.lead.count({ where: { tenantId, status: "cold" } }),
      ])

      return { total, hot, warm, cold }
    }),

  // -------------------------------------------------------
  // CREATE LEAD (GLOBAL)
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(CAN_CREATE))
    .input(
      z.object({
        name: z.string().min(1),
        contact: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        status: z.enum(["hot", "warm", "cold"]).default("warm"),
        source: z.string().optional(),
        value: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.prisma.lead.create({
        data: {
          tenantId: ctx.tenantId,
          ...input,
          lastContact: new Date(),
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.LEAD,
        entityId: lead.id,
        entityName: input.name,
        metadata: { leadData: input },
        tenantId: ctx.tenantId,
      })

      return lead
    }),

  // -------------------------------------------------------
  // UPDATE LEAD (GLOBAL)
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(CAN_UPDATE))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        contact: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        status: z.enum(["hot", "warm", "cold"]).optional(),
        source: z.string().optional(),
        value: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const lead = await ctx.prisma.lead.update({
        where: { id, tenantId: ctx.tenantId },
        data: {
          ...data,
          lastContact: new Date(),
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.LEAD,
        entityId: id,
        entityName: data.name ?? lead.name,
        metadata: { updates: data },
        tenantId: ctx.tenantId,
      })

      return lead
    }),

  // -------------------------------------------------------
  // DELETE LEAD (GLOBAL)
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(CAN_DELETE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const lead = await ctx.prisma.lead.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      if (!lead) throw new Error("Lead not found")

      await ctx.prisma.lead.delete({
        where: { id: input.id },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.LEAD,
        entityId: input.id,
        entityName: lead.name,
        tenantId: ctx.tenantId,
      })

      return { success: true }
    }),

  // -------------------------------------------------------
  // EXPORT LEADS (GLOBAL)
  // -------------------------------------------------------
  export: tenantProcedure
    .use(hasPermission(CAN_EXPORT))
    .mutation(async ({ ctx }) => {

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.EXPORT,
        entityType: AuditEntityType.LEAD,
        metadata: { format: "CSV" },
        tenantId: ctx.tenantId,
      })

      return { success: true, message: "Leads exported successfully" }
    }),

})
