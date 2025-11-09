
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

export const contractorRouter = createTRPCRouter({
  // Get all contractors for tenant
  getAll: tenantProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.contractor.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          user: {
            select: { name: true, email: true, isActive: true },
          },
          agency: {
            select: { name: true, contactEmail: true },
          },
          country: true,
          onboardingTemplate: true,
          contracts: {
            include: {
              agency: { select: { name: true } },
              payrollPartner: { select: { name: true } },
            },
          },
          _count: {
            select: { contracts: true, onboardingResponses: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Get contractor by ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contractor.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
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

  // Get contractor by user ID (for contractor dashboard)
  getByUserId: tenantProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contractor.findFirst({
        where: { 
          userId: input.userId,
          tenantId: ctx.tenantId,
        },
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

  // Create contractor with new user
  create: tenantProcedure
    .input(z.object({
      // User credentials
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      
      // Contractor details
      phone: z.string().optional(),
      alternatePhone: z.string().optional(),
      dateOfBirth: z.string().optional(), // Will be converted to Date
      referredBy: z.string().optional(),
      skypeId: z.string().optional(),
      notes: z.string().optional(),
      
      // Address Details
      officeBuilding: z.string().optional(),
      address1: z.string().optional(),
      address2: z.string().optional(),
      city: z.string().optional(),
      countryId: z.string().optional(),
      state: z.string().optional(),
      postCode: z.string().optional(),
      
      // Relations
      agencyId: z.string().optional(),
      onboardingTemplateId: z.string().optional(),
      
      status: z.enum(["active", "inactive", "suspended"]).default("active"),
    }))
    .mutation(async ({ ctx, input }) => {
      const bcrypt = require("bcryptjs")
      
      // Check if email already exists
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          tenantId: ctx.tenantId,
        },
      })

      if (existingUser) {
        throw new Error("Un utilisateur avec cet email existe déjà")
      }

      // Get contractor role
      const contractorRole = await ctx.prisma.role.findFirst({
        where: {
          name: "contractor",
          tenantId: ctx.tenantId,
        },
      })

      if (!contractorRole) {
        throw new Error("Le rôle 'contractor' n'existe pas")
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10)

      // Create user and contractor in a transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Create user
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

        // Create contractor with all new fields
        const contractor = await tx.contractor.create({
          data: {
            userId: user.id,
            tenantId: ctx.tenantId,
            
            // General info
            name: input.name,
            phone: input.phone,
            alternatePhone: input.alternatePhone,
            email: input.email,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
            referredBy: input.referredBy,
            skypeId: input.skypeId,
            notes: input.notes,
            
            // Address
            officeBuilding: input.officeBuilding,
            address1: input.address1,
            address2: input.address2,
            city: input.city,
            countryId: input.countryId,
            state: input.state,
            postCode: input.postCode,
            
            // Relations
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

        // If onboarding template is selected, create initial responses
        if (input.onboardingTemplateId) {
          const questions = await tx.onboardingQuestion.findMany({
            where: { onboardingTemplateId: input.onboardingTemplateId },
          })

          await Promise.all(
            questions.map((question) =>
              tx.onboardingResponse.create({
                data: {
                  contractorId: contractor.id,
                  questionId: question.id,
                  status: "pending",
                },
              })
            )
          )
        }

        return contractor
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CONTRACTOR,
        entityId: result.id,
        entityName: result.user.name || result.user.email,
        metadata: {
          email: result.user.email,
          status: result.status,
        },
        tenantId: ctx.tenantId,
      })

      return result
    }),

  // Update contractor
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      
      // Contractor details
      name: z.string().optional(),
      phone: z.string().optional(),
      alternatePhone: z.string().optional(),
      email: z.string().optional(),
      dateOfBirth: z.string().optional(),
      referredBy: z.string().optional(),
      skypeId: z.string().optional(),
      notes: z.string().optional(),
      
      // Address Details
      officeBuilding: z.string().optional(),
      address1: z.string().optional(),
      address2: z.string().optional(),
      city: z.string().optional(),
      countryId: z.string().optional(),
      state: z.string().optional(),
      postCode: z.string().optional(),
      
      // Relations
      agencyId: z.string().optional(),
      onboardingTemplateId: z.string().optional(),
      
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, dateOfBirth, ...updateData } = input

      const result = await ctx.prisma.contractor.update({
        where: { 
          id,
          tenantId: ctx.tenantId,
        },
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

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACTOR,
        entityId: result.id,
        entityName: result.user.name || result.user.email,
        metadata: {
          updatedFields: updateData,
        },
        tenantId: ctx.tenantId,
      })

      return result
    }),

  // Delete contractor
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get contractor details before deleting
      const contractor = await ctx.prisma.contractor.findFirst({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
        include: {
          user: { select: { name: true, email: true } },
        },
      })

      if (!contractor) {
        throw new Error("Contractor not found")
      }

      const result = await ctx.prisma.contractor.delete({
        where: { 
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: ctx.session?.user?.id || "",
        userName: ctx.session?.user?.name || "System",
        userRole: ctx.session?.user?.roleName || "system",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.CONTRACTOR,
        entityId: input.id,
        entityName: contractor.user.name || contractor.user.email,
        metadata: {
          email: contractor.user.email,
        },
        tenantId: ctx.tenantId,
      })

      return result
    }),

  // Get contractor statistics
  getStats: tenantProcedure
    .query(async ({ ctx }) => {
      const totalContractors = await ctx.prisma.contractor.count({
        where: { tenantId: ctx.tenantId },
      })

      const activeContractors = await ctx.prisma.contractor.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "active",
        },
      })

      const inactiveContractors = await ctx.prisma.contractor.count({
        where: { 
          tenantId: ctx.tenantId,
          status: "inactive",
        },
      })

      return {
        total: totalContractors,
        active: activeContractors,
        inactive: inactiveContractors,
      }
    }),
})
