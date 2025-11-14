import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { PERMISSION_TREE } from "../../rbac/permissions"

export const leadRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL LEADS
  // Requires: leads.view
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.leads.view))
    .query(async ({ ctx }) => {
      return ctx.prisma.lead.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
      })
    }),

  // -------------------------------------------------------
  // GET BY ID
  // Requires: leads.view
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.leads.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.lead.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
    }),

  // -------------------------------------------------------
  // STATS
  // Requires: leads.view
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.leads.view))
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
  // CREATE LEAD
  // Requires: leads.create
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.leads.create))
    .input(z.object({
      name: z.string().min(1),
      contact: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      status: z.enum(["hot", "warm", "cold"]).default("warm"),
      source: z.string().optional(),
      value: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {

      const lead = await ctx.prisma.lead.create({
        data: {
          ...input,
          lastContact: new Date(),
          tenantId: ctx.tenantId,
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
  // UPDATE LEAD
  // Requires: leads.update
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.leads.update))
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      contact: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      status: z.enum(["hot", "warm", "cold"]).optional(),
      source: z.string().optional(),
      value: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {

      const { id, ...data } = input

      const lead = await ctx.prisma.lead.update({
        where: { id, tenantId: ctx.tenantId },
        data: { ...data, lastContact: new Date() },
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
  // DELETE LEAD
  // Requires: leads.delete
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.leads.delete))
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
  // EXPORT LEADS
  // Requires: leads.export
  // -------------------------------------------------------
  export: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.leads.export))
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
