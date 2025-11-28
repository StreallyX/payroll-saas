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
  // Worker visibility (Payroll Partner Portal)
  LIST_WORKERS: "worker.list.ownCompany",
  VIEW_WORKER: "worker.view.ownCompany",
  VIEW_ONBOARDING: "worker.view_onboarding.ownCompany",
  VIEW_DATES: "worker.view_dates.ownCompany",
  VIEW_CONTRACT: "worker.view_contract.ownCompany",

  // Payslip management
  UPLOAD_PAYSLIP: "payslip.upload.ownCompany",
  VIEW_PAYSLIP: "payslip.view.ownCompany",

  // Invoice to platform
  UPLOAD_INVOICE: "invoice.upload_to_platform.ownCompany",

  // Global access (Platform Admin)
  LIST_GLOBAL: "worker.list.global",
  VIEW_GLOBAL: "worker.view.global",
}

// ============================================================================
// PAYROLL PARTNER ROUTER
// ============================================================================
export const payrollPartnerRouter = createTRPCRouter({

  // --------------------------------------------------------------------------
  // 1️⃣ LIST MY WORKERS (Payroll Partner Portal)
  // --------------------------------------------------------------------------
  listMyWorkers: tenantProcedure
    .use(hasAnyPermission([P.LIST_WORKERS, P.LIST_GLOBAL]))
    .input(
      z.object({
        status: z.enum(["active", "inactive", "onboarding", "all"]).optional().default("all"),
        countryId: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId
      const isGlobal = user.permissions.includes(P.LIST_GLOBAL)

      const params = input || { status: "all", limit: 50, offset: 0 }

      // Filter: Payroll Partner only sees workers managed by them
      // In this system, payroll partners are linked via company association
      // Workers with salaryType = "employed" or "split" have payroll partners
      const whereClause: any = {
        tenantId,
      }

      if (!isGlobal) {
        if (!user.companyId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "User must be associated with a payroll partner company",
          })
        }

        // Get workers that have contracts with salaryType indicating payroll partner involvement
        // AND where the payroll partner company matches the user's company
        whereClause.contractParticipants = {
          some: {
            contract: {
              salaryType: { in: ["employed", "split"] }, // Only employed/split use payroll partners
              // In a real implementation, you'd have a payrollPartnerId field on Contract
              // For now, we'll use a custom field or company relationship
            },
            role: "contractor", // They are contractors being managed
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
                status: "active",
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
                status: { in: ["draft", "pending_approval", "pending_signature"] },
              },
            },
          }
        }
      }

      // Country filter
      if (params.countryId) {
        whereClause.contractParticipants = {
          ...whereClause.contractParticipants,
          some: {
            ...whereClause.contractParticipants?.some,
            contract: {
              ...whereClause.contractParticipants?.some?.contract,
              contractCountryId: params.countryId,
            },
          },
        }
      }

      const [workers, totalCount] = await Promise.all([
        ctx.prisma.user.findMany({
          where: whereClause,
          include: {
            contractParticipants: {
              where: {
                role: "contractor",
                contract: {
                  salaryType: { in: ["employed", "split"] },
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
                    salaryType: true,
                    rate: true,
                    rateType: true,
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
              },
            },
            payslips: {
              select: {
                id: true,
                period: true,
                netPay: true,
              },
              orderBy: {
                period: "desc",
              },
              take: 1,
            },
          },
          skip: params.offset,
          take: params.limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.user.count({ where: whereClause }),
      ])

      // Transform data for frontend
      const workersWithDetails = workers.map(worker => {
        const activeContracts = worker.contractParticipants.filter(
          cp => cp.contract.status === "active"
        )
        const latestContract = worker.contractParticipants[0]?.contract

        return {
          id: worker.id,
          name: worker.name,
          email: worker.email,
          phone: worker.phone,
          profilePicture: worker.profilePicture,
          createdAt: worker.createdAt,
          
          // Contract details
          activeContractsCount: activeContracts.length,
          totalContractsCount: worker.contractParticipants.length,
          latestContract: latestContract ? {
            id: latestContract.id,
            reference: latestContract.contractReference,
            status: latestContract.status,
            workflowStatus: latestContract.workflowStatus,
            startDate: latestContract.startDate,
            endDate: latestContract.endDate,
            salaryType: latestContract.salaryType,
            rate: latestContract.rate,
            rateType: latestContract.rateType,
            company: latestContract.company,
            country: latestContract.country,
          } : null,

          // Onboarding status
          onboardingCompleted: worker.onboardingResponses.some(r => r.completedAt),
          
          // Latest payslip
          latestPayslip: worker.payslips[0] || null,
        }
      })

      return {
        workers: workersWithDetails,
        pagination: {
          total: totalCount,
          limit: params.limit,
          offset: params.offset,
          hasMore: params.offset + params.limit < totalCount,
        },
      }
    }),

  // --------------------------------------------------------------------------
  // 2️⃣ GET WORKER DETAILS
  // --------------------------------------------------------------------------
  getWorkerDetails: tenantProcedure
    .use(hasAnyPermission([P.VIEW_WORKER, P.VIEW_GLOBAL]))
    .input(z.object({ workerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const isGlobal = user.permissions.includes(P.VIEW_GLOBAL)

      const worker = await ctx.prisma.user.findFirst({
        where: {
          id: input.workerId,
          tenantId: ctx.tenantId,
          ...(isGlobal ? {} : {
            contractParticipants: {
              some: {
                contract: {
                  salaryType: { in: ["employed", "split"] },
                },
              },
            },
          }),
        },
        include: {
          company: true,
          contractParticipants: {
            where: {
              role: "contractor",
            },
            include: {
              contract: {
                include: {
                  company: true,
                  country: true,
                  currency: true,
                  bank: true,
                },
              },
            },
          },
          onboardingResponses: {
            include: {
              template: true,
            },
          },
          payslips: {
            orderBy: {
              period: "desc",
            },
            take: 12, // Last 12 months
          },
        },
      })

      if (!worker) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Worker not found or access denied",
        })
      }

      return worker
    }),

  // --------------------------------------------------------------------------
  // 3️⃣ GET WORKER ONBOARDING STATUS
  // --------------------------------------------------------------------------
  getWorkerOnboardingStatus: tenantProcedure
    .use(hasAnyPermission([P.VIEW_ONBOARDING, P.VIEW_GLOBAL]))
    .input(z.object({ workerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const isGlobal = user.permissions.includes(P.VIEW_GLOBAL)

      // Verify access
      const worker = await ctx.prisma.user.findFirst({
        where: {
          id: input.workerId,
          tenantId: ctx.tenantId,
          ...(isGlobal ? {} : {
            contractParticipants: {
              some: {
                contract: {
                  salaryType: { in: ["employed", "split"] },
                },
              },
            },
          }),
        },
      })

      if (!worker) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Worker not found or access denied",
        })
      }

      // Get onboarding data
      const onboardingResponses = await ctx.prisma.onboardingResponse.findMany({
        where: {
          userId: input.workerId,
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
  // 4️⃣ GET WORKER CONTRACT DATES & LOCAL EMPLOYMENT CONTRACT
  // --------------------------------------------------------------------------
  getWorkerContract: tenantProcedure
    .use(hasAnyPermission([P.VIEW_CONTRACT, P.VIEW_GLOBAL]))
    .input(z.object({ workerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const isGlobal = user.permissions.includes(P.VIEW_GLOBAL)

      const contracts = await ctx.prisma.contract.findMany({
        where: {
          tenantId: ctx.tenantId,
          participants: {
            some: {
              userId: input.workerId,
              role: "contractor",
            },
          },
          salaryType: { in: ["employed", "split"] }, // Only contracts with local employment
          ...(isGlobal ? {} : {}),
        },
        include: {
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
          documents: {
            where: {
              documentType: {
                name: { in: ["Local Employment Contract", "Employment Agreement"] },
              },
            },
            include: {
              documentType: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      })

      if (contracts.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No employment contracts found for this worker",
        })
      }

      return {
        contracts: contracts.map(c => ({
          id: c.id,
          reference: c.contractReference,
          type: c.type,
          status: c.status,
          salaryType: c.salaryType,
          startDate: c.startDate,
          endDate: c.endDate,
          companyName: c.company?.name,
          countryName: c.country?.name,
          countryCode: c.country?.code,
          documents: c.documents.map(d => ({
            id: d.id,
            name: d.name,
            type: d.documentType?.name,
            url: d.url,
            uploadedAt: d.uploadedAt,
          })),
        })),
      }
    }),

  // --------------------------------------------------------------------------
  // 5️⃣ UPLOAD WORKER PAYSLIP
  // --------------------------------------------------------------------------
  uploadWorkerPayslip: tenantProcedure
    .use(hasPermission(P.UPLOAD_PAYSLIP))
    .input(
      z.object({
        workerId: z.string(),
        contractId: z.string(),
        period: z.date(),
        grossPay: z.number(),
        netPay: z.number(),
        taxDeductions: z.number().optional(),
        otherDeductions: z.number().optional(),
        documentUrl: z.string(), // Pre-uploaded document URL
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user

      // Verify access to worker
      const worker = await ctx.prisma.user.findFirst({
        where: {
          id: input.workerId,
          tenantId: ctx.tenantId,
        },
      })

      if (!worker) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Worker not found",
        })
      }

      // Verify contract exists and is managed by this payroll partner
      const contract = await ctx.prisma.contract.findFirst({
        where: {
          id: input.contractId,
          tenantId: ctx.tenantId,
          participants: {
            some: {
              userId: input.workerId,
            },
          },
        },
      })

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        })
      }

      // Create payslip
      const payslip = await ctx.prisma.payslip.create({
        data: {
          tenantId: ctx.tenantId,
          userId: input.workerId,
          contractId: input.contractId,
          period: input.period,
          grossPay: input.grossPay,
          netPay: input.netPay,
          taxDeductions: input.taxDeductions || 0,
          otherDeductions: input.otherDeductions || 0,
          documentUrl: input.documentUrl,
          notes: input.notes,
          status: "generated",
          generatedAt: new Date(),
          uploadedBy: user.id,
        },
      })

      await createAuditLog({
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PAYSLIP,
        entityId: payslip.id,
        entityName: `Payslip for ${worker.name} - ${input.period}`,
        metadata: { workerId: input.workerId, contractId: input.contractId },
        tenantId: ctx.tenantId,
      })

      return payslip
    }),

  // --------------------------------------------------------------------------
  // 6️⃣ UPLOAD INVOICE TO ASPIROCK
  // --------------------------------------------------------------------------
  uploadInvoiceToAspiroch: tenantProcedure
    .use(hasPermission(P.UPLOAD_INVOICE))
    .input(
      z.object({
        invoiceNumber: z.string(),
        amount: z.number(),
        currencyId: z.string(),
        dueDate: z.date(),
        periodStart: z.date(),
        periodEnd: z.date(),
        workersIncluded: z.array(z.string()), // Array of worker IDs
        documentUrl: z.string(), // Pre-uploaded invoice document
        description: z.string().optional(),
        lineItems: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().optional(),
            unitPrice: z.number().optional(),
            amount: z.number(),
            type: z.enum(["salary", "fee", "employer_cost", "other"]),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user

      if (!user.companyId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User must be associated with a payroll partner company",
        })
      }

      // Create invoice from payroll partner to platform
      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceNumber: input.invoiceNumber,
          amount: input.amount,
          currencyId: input.currencyId,
          status: "pending",
          type: "payroll_partner_to_platform",
          dueDate: input.dueDate,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          description: input.description,
          documentUrl: input.documentUrl,
          issuedBy: user.companyId,
          issuedAt: new Date(),
          lineItems: input.lineItems ? {
            create: input.lineItems.map(item => ({
              tenantId: ctx.tenantId,
              description: item.description,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || item.amount,
              amount: item.amount,
              metadata: { type: item.type },
            })),
          } : undefined,
        },
        include: {
          lineItems: true,
        },
      })

      await createAuditLog({
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INVOICE,
        entityId: invoice.id,
        entityName: `Invoice ${input.invoiceNumber}`,
        metadata: { 
          workersIncluded: input.workersIncluded,
          amount: input.amount,
        },
        tenantId: ctx.tenantId,
      })

      return invoice
    }),

  // --------------------------------------------------------------------------
  // 7️⃣ GET WORKER STATISTICS (Dashboard Widget)
  // --------------------------------------------------------------------------
  getWorkerStatistics: tenantProcedure
    .use(hasAnyPermission([P.LIST_WORKERS, P.LIST_GLOBAL]))
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
              salaryType: { in: ["employed", "split"] },
            },
            role: "contractor",
          },
        }
      }

      const [
        totalWorkers,
        activeWorkers,
        onboardingWorkers,
        inactiveWorkers,
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
                  status: "active",
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
                  status: { in: ["draft", "pending_approval", "pending_signature"] },
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
        total: totalWorkers,
        active: activeWorkers,
        onboarding: onboardingWorkers,
        inactive: inactiveWorkers,
      }
    }),
})
