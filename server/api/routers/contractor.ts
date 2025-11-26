import { z } from "zod"
import { TRPCError } from "@trpc/server"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"

import { createAuditLog } from "@/lib/audit"
import { AuditAction, AuditEntityType } from "@/lib/types"

// ============================================================================
// PERMISSIONS MAP
// ============================================================================
const P = {
  // Contractor visibility (Agency Portal)
  LIST_OWN_COMPANY: "contractor.list.ownCompany",
  VIEW_OWN_COMPANY: "contractor.view.ownCompany",
  VIEW_ONBOARDING: "contractor.view_onboarding.ownCompany",
  VIEW_DATES: "contractor.view_dates.ownCompany",
  VIEW_PAYMENTS: "contractor.view_payments.ownCompany",

  // Global access (Platform Admin)
  LIST_GLOBAL: "contractor.list.global",
  VIEW_GLOBAL: "contractor.view.global",
}

// ============================================================================
// CONTRACTOR ROUTER (AGENCY PORTAL)
// ============================================================================
export const contractorRouter = createTRPCRouter({

  // --------------------------------------------------------------------------
  // 1️⃣ LIST MY CONTRACTORS (Agency Portal)
  // --------------------------------------------------------------------------
  listMyContractors: tenantProcedure
    .use(hasAnyPermission([P.LIST_OWN_COMPANY, P.LIST_GLOBAL]))
    .input(
      z.object({
        status: z.enum(["active", "inactive", "onboarding", "all"]).optional().default("all"),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId
      const isGlobal = user.permissions.includes(P.LIST_GLOBAL)

      const params = input || { status: "all", limit: 50, offset: 0 }

      // Filter: Agency only sees contractors linked to their company via contracts
      const whereClause: any = {
        tenantId,
      }

      // If not global admin, filter by company
      if (!isGlobal) {
        if (!user.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "User must be associated with a company to view contractors",
          })
        }

        // Get contractors that have contracts with this agency
        whereClause.contractParticipants = {
          some: {
            contract: {
              companyId: user.companyId, // Contracts associated with agency
            },
            role: "contractor", // Must be contractor participant
          },
        }
      }

      // Status filter
      if (params.status !== "all") {
        if (params.status === "active") {
          whereClause.contractParticipants = {
            ...whereClause.contractParticipants,
            some: {
              ...whereClause.contractParticipants?.some,
              contract: {
                ...whereClause.contractParticipants?.some?.contract,
                status: { in: ["active", "pending_signature"] },
              },
            },
          }
        } else if (params.status === "inactive") {
          whereClause.contractParticipants = {
            ...whereClause.contractParticipants,
            some: {
              ...whereClause.contractParticipants?.some,
              contract: {
                ...whereClause.contractParticipants?.some?.contract,
                status: { in: ["completed", "cancelled", "terminated"] },
              },
            },
          }
        } else if (params.status === "onboarding") {
          whereClause.contractParticipants = {
            ...whereClause.contractParticipants,
            some: {
              ...whereClause.contractParticipants?.some,
              contract: {
                ...whereClause.contractParticipants?.some?.contract,
                status: { in: ["draft", "pending_approval"] },
              },
            },
          }
        }
      }

      const [contractors, totalCount] = await Promise.all([
        ctx.prisma.user.findMany({
          where: whereClause,
          include: {
            contractParticipants: {
              where: isGlobal ? {} : {
                contract: {
                  companyId: user.companyId,
                },
              },
              include: {
                contract: {
                  select: {
                    id: true,
                    contractReference: true,
                    status: true,
                    workflowStatus: true,
                    startDate: true,
                    endDate: true,
                    rate: true,
                    rateType: true,
                    salaryType: true,
                    company: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    country: {
                      select: {
                        name: true,
                        code: true,
                      },
                    },
                  },
                },
              },
            },
            onboardingResponses: {
              select: {
                id: true,
                completedAt: true,
                template: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          skip: params.offset,
          take: params.limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.user.count({ where: whereClause }),
      ])

      // Transform data for frontend
      const contractorsWithDetails = contractors.map(contractor => {
        const activeContracts = contractor.contractParticipants.filter(
          cp => ["active", "pending_signature"].includes(cp.contract.status)
        )
        const latestContract = contractor.contractParticipants[0]?.contract

        return {
          id: contractor.id,
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          profilePicture: contractor.profilePicture,
          createdAt: contractor.createdAt,
          
          // Contract details
          activeContractsCount: activeContracts.length,
          totalContractsCount: contractor.contractParticipants.length,
          latestContract: latestContract ? {
            id: latestContract.id,
            reference: latestContract.contractReference,
            status: latestContract.status,
            workflowStatus: latestContract.workflowStatus,
            startDate: latestContract.startDate,
            endDate: latestContract.endDate,
            rate: latestContract.rate,
            rateType: latestContract.rateType,
            salaryType: latestContract.salaryType,
            company: latestContract.company,
            country: latestContract.country,
          } : null,

          // Onboarding status
          onboardingStatus: contractor.onboardingResponses.length > 0
            ? contractor.onboardingResponses.some(r => r.completedAt)
              ? "completed"
              : "in_progress"
            : "not_started",
          onboardingCompletedAt: contractor.onboardingResponses.find(r => r.completedAt)?.completedAt,
        }
      })

      return {
        contractors: contractorsWithDetails,
        pagination: {
          total: totalCount,
          limit: params.limit,
          offset: params.offset,
          hasMore: params.offset + params.limit < totalCount,
        },
      }
    }),

  // --------------------------------------------------------------------------
  // 2️⃣ GET CONTRACTOR DETAILS
  // --------------------------------------------------------------------------
  getContractorDetails: tenantProcedure
    .use(hasAnyPermission([P.VIEW_OWN_COMPANY, P.VIEW_GLOBAL]))
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const isGlobal = user.permissions.includes(P.VIEW_GLOBAL)

      const contractor = await ctx.prisma.user.findFirst({
        where: {
          id: input.contractorId,
          tenantId: ctx.tenantId,
          ...(isGlobal ? {} : {
            contractParticipants: {
              some: {
                contract: {
                  companyId: user.companyId,
                },
              },
            },
          }),
        },
        include: {
          company: true,
          contractParticipants: {
            include: {
              contract: {
                include: {
                  company: true,
                  country: true,
                  currency: true,
                },
              },
            },
          },
          onboardingResponses: {
            include: {
              template: true,
            },
          },
        },
      })

      if (!contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor not found or access denied",
        })
      }

      return contractor
    }),

  // --------------------------------------------------------------------------
  // 3️⃣ GET CONTRACTOR ONBOARDING STATUS
  // --------------------------------------------------------------------------
  getContractorOnboardingStatus: tenantProcedure
    .use(hasAnyPermission([P.VIEW_ONBOARDING, P.VIEW_GLOBAL]))
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const isGlobal = user.permissions.includes(P.VIEW_GLOBAL)

      // Verify access
      const contractor = await ctx.prisma.user.findFirst({
        where: {
          id: input.contractorId,
          tenantId: ctx.tenantId,
          ...(isGlobal ? {} : {
            contractParticipants: {
              some: {
                contract: {
                  companyId: user.companyId,
                },
              },
            },
          }),
        },
      })

      if (!contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor not found or access denied",
        })
      }

      // Get onboarding data
      const onboardingResponses = await ctx.prisma.onboardingResponse.findMany({
        where: {
          userId: input.contractorId,
        },
        include: {
          template: {
            include: {
              questions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      if (onboardingResponses.length === 0) {
        return {
          status: "not_started",
          progress: 0,
          completedAt: null,
          responses: [],
        }
      }

      const latestResponse = onboardingResponses[0]
      const totalQuestions = latestResponse.template?.questions.length || 0
      const answeredQuestions = Object.keys(latestResponse.responses || {}).length
      const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

      return {
        status: latestResponse.completedAt ? "completed" : "in_progress",
        progress: Math.round(progress),
        completedAt: latestResponse.completedAt,
        templateName: latestResponse.template?.name,
        responses: onboardingResponses.map(r => ({
          id: r.id,
          templateName: r.template?.name,
          completedAt: r.completedAt,
          createdAt: r.createdAt,
        })),
      }
    }),

  // --------------------------------------------------------------------------
  // 4️⃣ GET CONTRACTOR CONTRACT DATES
  // --------------------------------------------------------------------------
  getContractorDates: tenantProcedure
    .use(hasAnyPermission([P.VIEW_DATES, P.VIEW_GLOBAL]))
    .input(z.object({ contractorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const isGlobal = user.permissions.includes(P.VIEW_GLOBAL)

      const contracts = await ctx.prisma.contract.findMany({
        where: {
          tenantId: ctx.tenantId,
          participants: {
            some: {
              userId: input.contractorId,
              role: "contractor",
            },
          },
          ...(isGlobal ? {} : {
            companyId: user.companyId,
          }),
        },
        select: {
          id: true,
          contractReference: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              name: true,
            },
          },
          country: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      })

      if (contracts.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No contracts found for this contractor",
        })
      }

      return {
        contracts: contracts.map(c => ({
          id: c.id,
          reference: c.contractReference,
          type: c.type,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          companyName: c.company?.name,
          countryName: c.country?.name,
          countryCode: c.country?.code,
          createdAt: c.createdAt,
        })),
      }
    }),

  // --------------------------------------------------------------------------
  // 5️⃣ GET CONTRACTOR PAYMENT HISTORY
  // --------------------------------------------------------------------------
  getContractorPaymentHistory: tenantProcedure
    .use(hasAnyPermission([P.VIEW_PAYMENTS, P.VIEW_GLOBAL]))
    .input(
      z.object({
        contractorId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const isGlobal = user.permissions.includes(P.VIEW_GLOBAL)

      // Verify access
      const contractor = await ctx.prisma.user.findFirst({
        where: {
          id: input.contractorId,
          tenantId: ctx.tenantId,
          ...(isGlobal ? {} : {
            contractParticipants: {
              some: {
                contract: {
                  companyId: user.companyId,
                },
              },
            },
          }),
        },
      })

      if (!contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor not found or access denied",
        })
      }

      // Get payment records
      const [payments, totalCount] = await Promise.all([
        ctx.prisma.payment.findMany({
          where: {
            tenantId: ctx.tenantId,
            recipientId: input.contractorId,
          },
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
                amount: true,
                currency: {
                  select: {
                    code: true,
                    symbol: true,
                  },
                },
              },
            },
            remittance: {
              select: {
                id: true,
                referenceNumber: true,
              },
            },
          },
          orderBy: { paymentDate: "desc" },
          skip: input.offset,
          take: input.limit,
        }),
        ctx.prisma.payment.count({
          where: {
            tenantId: ctx.tenantId,
            recipientId: input.contractorId,
          },
        }),
      ])

      return {
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.invoice?.currency?.code || "USD",
          currencySymbol: p.invoice?.currency?.symbol || "$",
          paymentDate: p.paymentDate,
          status: p.status,
          method: p.method,
          invoiceNumber: p.invoice?.invoiceNumber,
          remittanceId: p.remittance?.id,
          remittanceReference: p.remittance?.referenceNumber,
          notes: p.notes,
        })),
        pagination: {
          total: totalCount,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < totalCount,
        },
      }
    }),

  // --------------------------------------------------------------------------
  // 6️⃣ GET CONTRACTOR STATISTICS (Dashboard Widget)
  // --------------------------------------------------------------------------
  getContractorStatistics: tenantProcedure
    .use(hasAnyPermission([P.LIST_OWN_COMPANY, P.LIST_GLOBAL]))
    .query(async ({ ctx }) => {
      const user = ctx.session.user
      const isGlobal = user.permissions.includes(P.LIST_GLOBAL)

      const whereClause: any = {
        tenantId: ctx.tenantId,
      }

      if (!isGlobal) {
        if (!user.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "User must be associated with a company",
          })
        }

        whereClause.contractParticipants = {
          some: {
            contract: {
              companyId: user.companyId,
            },
            role: "contractor",
          },
        }
      }

      const [
        totalContractors,
        activeContractors,
        onboardingContractors,
        inactiveContractors,
      ] = await Promise.all([
        ctx.prisma.user.count({ where: whereClause }),
        ctx.prisma.user.count({
          where: {
            ...whereClause,
            contractParticipants: {
              some: {
                ...whereClause.contractParticipants?.some,
                contract: {
                  ...whereClause.contractParticipants?.some?.contract,
                  status: { in: ["active", "pending_signature"] },
                },
              },
            },
          },
        }),
        ctx.prisma.user.count({
          where: {
            ...whereClause,
            contractParticipants: {
              some: {
                ...whereClause.contractParticipants?.some,
                contract: {
                  ...whereClause.contractParticipants?.some?.contract,
                  status: { in: ["draft", "pending_approval"] },
                },
              },
            },
          },
        }),
        ctx.prisma.user.count({
          where: {
            ...whereClause,
            contractParticipants: {
              some: {
                ...whereClause.contractParticipants?.some,
                contract: {
                  ...whereClause.contractParticipants?.some?.contract,
                  status: { in: ["completed", "cancelled", "terminated"] },
                },
              },
            },
          },
        }),
      ])

      return {
        total: totalContractors,
        active: activeContractors,
        onboarding: onboardingContractors,
        inactive: inactiveContractors,
      }
    }),
})
