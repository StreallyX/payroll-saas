import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"
import { sanitizeData } from "@/lib/utils"
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2"

export const agencyRouter = createTRPCRouter({

  // ------------------------------------------------------
  // GET ALL
  // ------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.agencies.manage.view_all))
    .query(async ({ ctx }) => {
      return ctx.prisma.agency.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          country: true,
          contractors: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          contracts: true,
          _count: {
            select: {
              contractors: true,
              contracts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ------------------------------------------------------
  // GET BY ID
  // ------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.agencies.manage.view_all))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.agency.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          contractors: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          contracts: {
            include: {
              contractor: {
                include: { user: { select: { name: true, email: true } } },
              },
              payrollPartner: { select: { name: true } },
            },
          },
        },
      })
    }),

  // ------------------------------------------------------
  // CREATE
  // ------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.agencies.manage.create))
    .input(
      z.object({
        name: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      
      const agency = await ctx.prisma.agency.create({
        data: {
          tenantId: ctx.tenantId!,
          name: input.name,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone ?? null,
          city: input.city ?? null,
          countryId: input.countryId ?? null,
        },
      })

      await createAuditLog({
        tenantId: ctx.tenantId!,
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.AGENCY,
        entityId: agency.id,
        entityName: agency.name,
        description: `Created agency ${agency.name}`,
      })

      return agency
    }),

  // ------------------------------------------------------
  // UPDATE
  // ------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.agencies.manage.update))
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        contactPhone: z.string().optional(),
        alternateContactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        primaryContactName: z.string().optional(),
        primaryContactJobTitle: z.string().optional(),
        fax: z.string().optional(),
        notes: z.string().optional(),
        officeBuilding: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),
        invoicingContactName: z.string().optional(),
        invoicingContactPhone: z.string().optional(),
        invoicingContactEmail: z.string().optional(),
        alternateInvoicingEmail: z.string().optional(),
        vatNumber: z.string().optional(),
        website: z.string().optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...raw } = input
      const clean = sanitizeData(raw)

      const agency = await ctx.prisma.agency.update({
        where: { id, tenantId: ctx.tenantId },
        data: clean,
      })

      await createAuditLog({
        tenantId: ctx.tenantId!,
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.AGENCY,
        entityId: agency.id,
        entityName: agency.name,
      })

      return agency
    }),

  // ------------------------------------------------------
  // DELETE
  // ------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.agencies.manage.delete))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const agency = await ctx.prisma.agency.findUnique({
        where: { id: input.id },
      })

      await ctx.prisma.agency.delete({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      await createAuditLog({
        tenantId: ctx.tenantId!,
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.AGENCY,
        entityId: input.id,
        entityName: agency?.name ?? "Unknown",
      })

      return { success: true }
    }),

  // ------------------------------------------------------
  // STATS
  // ------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.agencies.manage.view_all))
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.agency.count({
        where: { tenantId: ctx.tenantId },
      })

      const active = await ctx.prisma.agency.count({
        where: { tenantId: ctx.tenantId, status: "active" },
      })

      const inactive = await ctx.prisma.agency.count({
        where: { tenantId: ctx.tenantId, status: "inactive" },
      })

      return { total, active, inactive }
    }),
})
