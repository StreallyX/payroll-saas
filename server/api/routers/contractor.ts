import { z } from "zod"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission
} from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const contractorRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL CONTRACTORS (GLOBAL ONLY)
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission("contractor.list.global"))
    .query(async ({ ctx }) => {
      return ctx.prisma.contractor.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          user: { select: { name: true, email: true, isActive: true } },
          agency: { select: { name: true, contactEmail: true } },
          country: true,
          onboardingTemplate: true,
          contracts: {
            include: {
              agency: { select: { name: true } },
              payrollPartner: { select: { name: true } },
            },
          },
          _count: { select: { contracts: true, onboardingResponses: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // -------------------------------------------------------
  // GET CONTRACTOR BY ID (GLOBAL ONLY)
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission("contractor.list.global"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contractor.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          user: true,
          agency: true,
          contracts: {
            include: {
              agency: { select: { name: true } },
              payrollPartner: { select: { name: true } },
              invoices: true,
            },
          },
        },
      })
    }),

  // -------------------------------------------------------
  // GET MY OWN CONTRACTOR PROFILE
  // -------------------------------------------------------
  getByUserId: tenantProcedure
    .use(hasPermission("contractor.read.own"))
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {

      const isOwner = input.userId === ctx.session.user.id
      const hasGlobal = ctx.session.user.permissions?.includes("contractor.list.global")

      if (!isOwner && !hasGlobal && !ctx.session.user.isSuperAdmin) {
        throw new Error("You can only view your own contractor profile")
      }

      return ctx.prisma.contractor.findFirst({
        where: { userId: input.userId, tenantId: ctx.tenantId },
        include: {
          user: true,
          agency: true,
          contracts: {
            include: {
              agency: { select: { name: true } },
              payrollPartner: { select: { name: true } },
              invoices: true
            },
          },
        },
      })
    }),

  // -------------------------------------------------------
  // CREATE CONTRACTOR (GLOBAL ONLY)
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission("contractor.create.global"))
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),

        phone: z.string().optional(),
        alternatePhone: z.string().optional(),
        dateOfBirth: z.string().optional(),
        referredBy: z.string().optional(),
        skypeId: z.string().optional(),
        notes: z.string().optional(),

        officeBuilding: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),

        agencyId: z.string().optional(),
        onboardingTemplateId: z.string().optional(),

        status: z.enum(["active", "inactive", "suspended"]).default("active"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bcrypt = require("bcryptjs")

      const existingUser = await ctx.prisma.user.findFirst({
        where: { email: input.email, tenantId: ctx.tenantId },
      })

      if (existingUser) throw new Error("Un utilisateur avec cet email existe déjà")

      const contractorRole = await ctx.prisma.role.findFirst({
        where: { name: "contractor", tenantId: ctx.tenantId },
      })

      if (!contractorRole) throw new Error("Le rôle 'contractor' n'existe pas")

      const passwordHash = await bcrypt.hash(input.password, 10)

      const contractor = await ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
            roleId: contractorRole.id,
            tenantId: ctx.tenantId,
            isActive: true,
          },
        })

        const contractor = await tx.contractor.create({
          data: {
            userId: user.id,
            tenantId: ctx.tenantId,

            name: input.name,
            phone: input.phone,
            alternatePhone: input.alternatePhone,
            email: input.email,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
            referredBy: input.referredBy,
            skypeId: input.skypeId,
            notes: input.notes,

            officeBuilding: input.officeBuilding,
            address1: input.address1,
            address2: input.address2,
            city: input.city,
            countryId: input.countryId,
            state: input.state,
            postCode: input.postCode,

            agencyId: input.agencyId,
            onboardingTemplateId: input.onboardingTemplateId,
            status: input.status,
          },
          include: {
            user: { select: { name: true, email: true } },
            agency: { select: { name: true } },
            country: true,
            onboardingTemplate: true,
          },
        })

        // Auto-create onboarding responses
        if (input.onboardingTemplateId) {
          const questions = await tx.onboardingQuestion.findMany({
            where: { onboardingTemplateId: input.onboardingTemplateId },
          })

          await Promise.all(
            questions.map((q) =>
              tx.onboardingResponse.create({
                data: {
                  contractorId: contractor.id,
                  questionId: q.id,
                  status: "pending",
                },
              })
            )
          )
        }

        return contractor
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CONTRACTOR,
        entityId: contractor.id,
        entityName: contractor.user?.name ?? contractor.user?.email,
        metadata: { email: contractor.user?.email, status: contractor.status },
        tenantId: ctx.tenantId,
      })

      return contractor
    }),

  // -------------------------------------------------------
  // UPDATE CONTRACTOR (GLOBAL or OWN)
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission("contractor.update.global"))
    .input(
      z.object({
        id: z.string(),

        name: z.string().optional(),
        phone: z.string().optional(),
        alternatePhone: z.string().optional(),
        email: z.string().optional(),
        dateOfBirth: z.string().optional(),
        referredBy: z.string().optional(),
        skypeId: z.string().optional(),
        notes: z.string().optional(),

        officeBuilding: z.string().optional(),
        address1: z.string().optional(),
        address2: z.string().optional(),
        city: z.string().optional(),
        countryId: z.string().optional(),
        state: z.string().optional(),
        postCode: z.string().optional(),

        agencyId: z.string().optional(),
        onboardingTemplateId: z.string().optional(),

        status: z.enum(["active", "inactive", "suspended"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dateOfBirth, ...updateData } = input

      const existing = await ctx.prisma.contractor.findFirst({
        where: { id, tenantId: ctx.tenantId },
      })

      if (!existing) throw new Error("Contractor not found")

      const isOwner = existing.userId === ctx.session.user.id
      const hasGlobal = ctx.session.user.permissions?.includes("contractor.update.global")

      if (!isOwner && !hasGlobal && !ctx.session.user.isSuperAdmin) {
        throw new Error("You can only update your own contractor profile")
      }

      const contractor = await ctx.prisma.contractor.update({
        where: { id, tenantId: ctx.tenantId },
        data: {
          ...updateData,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        },
        include: {
          user: { select: { name: true, email: true } },
          agency: { select: { name: true } },
          country: true,
          onboardingTemplate: true,
        },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACTOR,
        entityId: contractor.id,
        entityName: contractor.user.name ?? contractor.user.email,
        metadata: { updatedFields: updateData },
        tenantId: ctx.tenantId,
      })

      return contractor
    }),

  // -------------------------------------------------------
  // DELETE CONTRACTOR
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission("contractor.delete.global"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const contractor = await ctx.prisma.contractor.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { user: { select: { name: true, email: true } } },
      })

      if (!contractor) throw new Error("Contractor not found")

      await ctx.prisma.contractor.delete({
        where: { id: input.id, tenantId: ctx.tenantId },
      })

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "System",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.CONTRACTOR,
        entityId: input.id,
        entityName: contractor.user.name ?? contractor.user.email,
        metadata: { email: contractor.user.email },
        tenantId: ctx.tenantId,
      })

      return { success: true }
    }),

  // -------------------------------------------------------
  // STATS
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission("contractor.list.global"))
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.contractor.count({
        where: { tenantId: ctx.tenantId },
      })

      const active = await ctx.prisma.contractor.count({
        where: { tenantId: ctx.tenantId, status: "active" },
      })

      const inactive = await ctx.prisma.contractor.count({
        where: { tenantId: ctx.tenantId, status: "inactive" },
      })

      return { total, active, inactive }
    }),
})
