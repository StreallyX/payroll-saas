
import { z } from "zod"
import { protectedProcedure, createTRPCRouter } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const payslipRouter = createTRPCRouter({
  // Get all payslips for the tenant
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.session?.user?.tenantId
    if (!tenantId) {
      throw new Error("No tenant ID found")
    }

    return await ctx.prisma.payslip.findMany({
      where: { tenantId },
      include: {
        contractor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        contract: {
          select: {
            id: true,
            title: true,
            contractReference: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })
  }),

  // Get payslip by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId
      if (!tenantId) {
        throw new Error("No tenant ID found")
      }

      return await ctx.prisma.payslip.findFirst({
        where: {
          id: input.id,
          tenantId,
        },
        include: {
          contractor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          contract: {
            select: {
              id: true,
              title: true,
              contractReference: true,
            },
          },
        },
      })
    }),

  // Get payslips by contractor ID
  getByContractorId: protectedProcedure
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId
      if (!tenantId) {
        throw new Error("No tenant ID found")
      }

      return await ctx.prisma.payslip.findMany({
        where: {
          contractorId: input.contractorId,
          tenantId,
        },
        include: {
          contract: {
            select: {
              id: true,
              title: true,
              contractReference: true,
            },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      })
    }),

  // Create new payslip
  create: protectedProcedure
    .input(
      z.object({
        contractorId: z.string(),
        contractId: z.string().optional(),
        month: z.number().min(1).max(12),
        year: z.number().min(2020).max(2100),
        grossPay: z.number().min(0),
        netPay: z.number().min(0),
        deductions: z.number().min(0).default(0),
        tax: z.number().min(0).default(0),
        status: z.enum(["pending", "generated", "sent", "paid"]),
        sentDate: z.string().optional(),
        paidDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId
      if (!tenantId) {
        throw new Error("No tenant ID found")
      }

      const payslip = await ctx.prisma.payslip.create({
        data: {
          tenantId,
          contractorId: input.contractorId,
          contractId: input.contractId,
          month: input.month,
          year: input.year,
          grossPay: input.grossPay,
          netPay: input.netPay,
          deductions: input.deductions,
          tax: input.tax,
          status: input.status,
          sentDate: input.sentDate ? new Date(input.sentDate) : null,
          paidDate: input.paidDate ? new Date(input.paidDate) : null,
          notes: input.notes,
        },
        include: {
          contractor: {
            include: {
              user: true,
            },
          },
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip for ${payslip.contractor.user.name} - ${input.month}/${input.year}`,
        description: `Created payslip for ${payslip.contractor.user.name} - ${input.month}/${input.year}`,
        tenantId,
      })

      return payslip
    }),

  // Update payslip
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        contractorId: z.string().optional(),
        contractId: z.string().optional(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().min(2020).max(2100).optional(),
        grossPay: z.number().min(0).optional(),
        netPay: z.number().min(0).optional(),
        deductions: z.number().min(0).optional(),
        tax: z.number().min(0).optional(),
        status: z.enum(["pending", "generated", "sent", "paid"]).optional(),
        sentDate: z.string().optional(),
        paidDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId
      if (!tenantId) {
        throw new Error("No tenant ID found")
      }

      const { id, ...updateData } = input

      const payslip = await ctx.prisma.payslip.update({
        where: { id },
        data: {
          ...updateData,
          sentDate: updateData.sentDate ? new Date(updateData.sentDate) : undefined,
          paidDate: updateData.paidDate ? new Date(updateData.paidDate) : undefined,
        },
        include: {
          contractor: {
            include: {
              user: true,
            },
          },
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip for ${payslip.contractor.user.name} - ${payslip.month}/${payslip.year}`,
        description: `Updated payslip for ${payslip.contractor.user.name} - ${payslip.month}/${payslip.year}`,
        tenantId,
      })

      return payslip
    }),

  // Delete payslip
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session?.user?.tenantId
      if (!tenantId) {
        throw new Error("No tenant ID found")
      }

      const payslip = await ctx.prisma.payslip.findFirst({
        where: { id: input.id, tenantId },
        include: {
          contractor: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!payslip) {
        throw new Error("Payslip not found")
      }

      await ctx.prisma.payslip.delete({
        where: { id: input.id },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name || "Unknown",
        userRole: ctx.session.user.roleName || "Unknown",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip for ${payslip.contractor.user.name} - ${payslip.month}/${payslip.year}`,
        description: `Deleted payslip for ${payslip.contractor.user.name} - ${payslip.month}/${payslip.year}`,
        tenantId,
      })

      return { success: true }
    }),

  // Get payslip statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.session?.user?.tenantId
    if (!tenantId) {
      throw new Error("No tenant ID found")
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const thisMonth = await ctx.prisma.payslip.count({
      where: { tenantId, month: currentMonth, year: currentYear },
    })

    const generated = await ctx.prisma.payslip.count({
      where: { tenantId, status: "generated" },
    })

    const sent = await ctx.prisma.payslip.count({
      where: { tenantId, status: "sent" },
    })

    const pending = await ctx.prisma.payslip.count({
      where: { tenantId, status: "pending" },
    })

    return {
      thisMonth,
      generated,
      sent,
      pending,
    }
  }),
})
