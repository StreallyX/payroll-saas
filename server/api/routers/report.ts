import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"
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
  VIEW_MARGIN: "report.view_margin.global",
  VIEW_LIVE_CONTRACTORS: "report.view_live_contractors.global",
  VIEW_BY_COUNTRY: "report.view_by_country.global",
  VIEW_BY_CLIENT: "report.view_by_client.global",
  VIEW_INCOME: "report.view_income.global",
  EXPORT: "report.export.global",
  VIEW_OWN_COMPANY: "report.view.ownCompany",
}

// ============================================================================
// REPORT ROUTER
// ============================================================================
export const reportRouter = createTRPCRouter({

  // --------------------------------------------------------------------------
  // 1️⃣ MARGIN REPORT
  // Gross margin (fees) per period, counted only when worker is paid
  // --------------------------------------------------------------------------
  getMarginReport: tenantProcedure
    .use(hasPermission(P.VIEW_MARGIN))
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        groupBy: z.enum(["month", "quarter", "year"]).optional().default("month"),
        currencyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId

      // Get all payments made to workers in the period
      const payments = await ctx.prisma.payment.findMany({
        where: {
          tenantId,
          paymentDate: {
            gte: input.startDate,
            lte: input.endDate,
          },
          status: "completed", // Only count completed payments
        },
        include: {
          invoice: {
            include: {
              currency: true,
              contract: {
                select: {
                  margin: true,
                  marginType: true,
                  rate: true,
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
              },
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // Calculate margin for each payment
      const marginData = payments.map(payment => {
        const invoice = payment.invoice
        const contract = invoice?.contract

        let marginAmount = 0
        if (contract?.margin) {
          if (contract.marginType === "percentage") {
            marginAmount = (invoice?.amount || 0) * (contract.margin / 100)
          } else if (contract.marginType === "fixed") {
            marginAmount = contract.margin
          }
        }

        return {
          paymentId: payment.id,
          paymentDate: payment.paymentDate,
          invoiceAmount: invoice?.amount || 0,
          margin: marginAmount,
          marginType: contract?.marginType,
          marginPercentage: contract?.marginType === "percentage" ? contract.margin : null,
          currency: invoice?.currency?.code || "USD",
          companyName: contract?.company?.name,
          countryName: contract?.country?.name,
          workerName: payment.recipient?.name,
        }
      })

      // Group by time period
      const groupedData: Record<string, any> = {}
      marginData.forEach(item => {
        const date = new Date(item.paymentDate)
        let key: string

        if (input.groupBy === "month") {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        } else if (input.groupBy === "quarter") {
          const quarter = Math.floor(date.getMonth() / 3) + 1
          key = `${date.getFullYear()}-Q${quarter}`
        } else {
          key = `${date.getFullYear()}`
        }

        if (!groupedData[key]) {
          groupedData[key] = {
            period: key,
            totalMargin: 0,
            totalRevenue: 0,
            paymentCount: 0,
            details: [],
          }
        }

        groupedData[key].totalMargin += item.margin
        groupedData[key].totalRevenue += item.invoiceAmount
        groupedData[key].paymentCount += 1
        groupedData[key].details.push(item)
      })

      // Convert to array and sort
      const reportData = Object.values(groupedData).sort((a: any, b: any) => 
        a.period.localeCompare(b.period)
      )

      // Calculate totals
      const totals = {
        totalMargin: marginData.reduce((sum, item) => sum + item.margin, 0),
        totalRevenue: marginData.reduce((sum, item) => sum + item.invoiceAmount, 0),
        totalPayments: payments.length,
        averageMargin: marginData.length > 0 
          ? marginData.reduce((sum, item) => sum + item.margin, 0) / marginData.length 
          : 0,
      }

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.VIEW,
        entityType: AuditEntityType.REPORT,
        metadata: { 
          reportType: "margin",
          startDate: input.startDate,
          endDate: input.endDate,
        },
        tenantId,
      })

      return {
        data: reportData,
        totals,
        period: {
          startDate: input.startDate,
          endDate: input.endDate,
          groupBy: input.groupBy,
        },
      }
    }),

  // --------------------------------------------------------------------------
  // 2️⃣ LIVE CONTRACTORS REPORT
  // Count of active contractors
  // --------------------------------------------------------------------------
  getLiveContractors: tenantProcedure
    .use(hasPermission(P.VIEW_LIVE_CONTRACTORS))
    .query(async ({ ctx }) => {
      const tenantId = ctx.tenantId

      // Get contractors with active contracts
      const activeContractors = await ctx.prisma.user.findMany({
        where: {
          tenantId,
          contractParticipants: {
            some: {
              role: "contractor",
              contract: {
                status: "active",
              },
            },
          },
        },
        include: {
          contractParticipants: {
            where: {
              role: "contractor",
              contract: {
                status: "active",
              },
            },
            include: {
              contract: {
                select: {
                  id: true,
                  contractReference: true,
                  startDate: true,
                  endDate: true,
                  rate: true,
                  rateType: true,
                  salaryType: true,
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
              },
            },
          },
        },
      })

      // Calculate statistics
      const stats = {
        total: activeContractors.length,
        byType: {
          gross: 0,
          employed: 0,
          split: 0,
        },
        byCountry: {} as Record<string, number>,
        byClient: {} as Record<string, number>,
      }

      activeContractors.forEach(contractor => {
        contractor.contractParticipants.forEach(cp => {
          const contract = cp.contract

          // Count by type
          if (contract.salaryType === "gross") stats.byType.gross++
          else if (contract.salaryType === "employed") stats.byType.employed++
          else if (contract.salaryType === "split") stats.byType.split++

          // Count by country
          const country = contract.country?.name || "Unknown"
          stats.byCountry[country] = (stats.byCountry[country] || 0) + 1

          // Count by client
          const client = contract.company?.name || "Unknown"
          stats.byClient[client] = (stats.byClient[client] || 0) + 1
        })
      })

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.VIEW,
        entityType: AuditEntityType.REPORT,
        metadata: { reportType: "live_contractors" },
        tenantId,
      })

      return {
        contractors: activeContractors.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          activeContracts: c.contractParticipants.map(cp => ({
            contractId: cp.contract.id,
            reference: cp.contract.contractReference,
            startDate: cp.contract.startDate,
            endDate: cp.contract.endDate,
            rate: cp.contract.rate,
            rateType: cp.contract.rateType,
            salaryType: cp.contract.salaryType,
            company: cp.contract.company?.name,
            country: cp.contract.country?.name,
          })),
        })),
        stats,
      }
    }),

  // --------------------------------------------------------------------------
  // 3️⃣ CONTRACTS BY COUNTRY REPORT
  // --------------------------------------------------------------------------
  getContractsByCountry: tenantProcedure
    .use(hasPermission(P.VIEW_BY_COUNTRY))
    .input(
      z.object({
        status: z.enum(["active", "all"]).optional().default("active"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId
      const params = input || { status: "active" }

      const whereClause: any = {
        tenantId,
      }

      if (params.status === "active") {
        whereClause.status = "active"
      }

      const contracts = await ctx.prisma.contract.findMany({
        where: whereClause,
        include: {
          country: true,
          company: {
            select: {
              name: true,
            },
          },
          participants: {
            where: {
              role: "contractor",
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      // Group by country
      const byCountry: Record<string, any> = {}

      contracts.forEach(contract => {
        const countryName = contract.country?.name || "Unknown"
        const countryCode = contract.country?.code || "XX"

        if (!byCountry[countryName]) {
          byCountry[countryName] = {
            countryName,
            countryCode,
            contractCount: 0,
            contractorCount: 0,
            contracts: [],
          }
        }

        byCountry[countryName].contractCount++
        byCountry[countryName].contractorCount += contract.participants.length
        byCountry[countryName].contracts.push({
          id: contract.id,
          reference: contract.contractReference,
          status: contract.status,
          startDate: contract.startDate,
          endDate: contract.endDate,
          company: contract.company?.name,
          contractors: contract.participants.map(p => p.user.name),
        })
      })

      const data = Object.values(byCountry).sort((a: any, b: any) => 
        b.contractCount - a.contractCount
      )

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.VIEW,
        entityType: AuditEntityType.REPORT,
        metadata: { reportType: "contracts_by_country" },
        tenantId,
      })

      return {
        data,
        summary: {
          totalCountries: data.length,
          totalContracts: contracts.length,
          totalContractors: contracts.reduce((sum, c) => sum + c.participants.length, 0),
        },
      }
    }),

  // --------------------------------------------------------------------------
  // 4️⃣ CONTRACTORS BY CLIENT REPORT
  // --------------------------------------------------------------------------
  getContractorsByClient: tenantProcedure
    .use(hasPermission(P.VIEW_BY_CLIENT))
    .input(
      z.object({
        status: z.enum(["active", "all"]).optional().default("active"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId
      const params = input || { status: "active" }

      const whereClause: any = {
        tenantId,
        type: "agency", // Only count agency clients
      }

      const companies = await ctx.prisma.company.findMany({
        where: whereClause,
        include: {
          contracts: {
            where: params.status === "active" ? { status: "active" } : {},
            include: {
              participants: {
                where: {
                  role: "contractor",
                },
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
              country: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      })

      const data = companies.map(company => {
        const uniqueContractors = new Set(
          company.contracts.flatMap(c => c.participants.map(p => p.userId))
        )

        return {
          companyId: company.id,
          companyName: company.name,
          contractCount: company.contracts.length,
          contractorCount: uniqueContractors.size,
          contracts: company.contracts.map(c => ({
            id: c.id,
            reference: c.contractReference,
            status: c.status,
            startDate: c.startDate,
            endDate: c.endDate,
            country: c.country?.name,
            contractors: c.participants.map(p => ({
              id: p.user.id,
              name: p.user.name,
              email: p.user.email,
            })),
          })),
        }
      }).sort((a, b) => b.contractorCount - a.contractorCount)

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.VIEW,
        entityType: AuditEntityType.REPORT,
        metadata: { reportType: "contractors_by_client" },
        tenantId,
      })

      return {
        data,
        summary: {
          totalClients: data.length,
          totalContracts: data.reduce((sum, c) => sum + c.contractCount, 0),
          totalContractors: data.reduce((sum, c) => sum + c.contractorCount, 0),
        },
      }
    }),

  // --------------------------------------------------------------------------
  // 5️⃣ INCOME BY COUNTRY REPORT
  // --------------------------------------------------------------------------
  getIncomeByCountry: tenantProcedure
    .use(hasPermission(P.VIEW_INCOME))
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        currencyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId

      // Get invoices in the period
      const invoices = await ctx.prisma.invoice.findMany({
        where: {
          tenantId,
          issuedAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
          status: { in: ["paid", "partially_paid"] }, // Only count paid invoices
        },
        include: {
          currency: true,
          contract: {
            select: {
              country: {
                select: {
                  name: true,
                  code: true,
                },
              },
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      // Group by country
      const byCountry: Record<string, any> = {}

      invoices.forEach(invoice => {
        const countryName = invoice.contract?.country?.name || "Unknown"
        const countryCode = invoice.contract?.country?.code || "XX"

        if (!byCountry[countryName]) {
          byCountry[countryName] = {
            countryName,
            countryCode,
            totalIncome: 0,
            invoiceCount: 0,
            currency: invoice.currency?.code || "USD",
            invoices: [],
          }
        }

        byCountry[countryName].totalIncome += invoice.amount
        byCountry[countryName].invoiceCount++
        byCountry[countryName].invoices.push({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          issuedAt: invoice.issuedAt,
          paidAt: invoice.paidAt,
          company: invoice.contract?.company?.name,
        })
      })

      const data = Object.values(byCountry).sort((a: any, b: any) => 
        b.totalIncome - a.totalIncome
      )

      await createAuditLog({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name ?? "Unknown",
        userRole: ctx.session.user.roleName,
        action: AuditAction.VIEW,
        entityType: AuditEntityType.REPORT,
        metadata: { 
          reportType: "income_by_country",
          startDate: input.startDate,
          endDate: input.endDate,
        },
        tenantId,
      })

      return {
        data,
        summary: {
          totalCountries: data.length,
          totalIncome: invoices.reduce((sum, inv) => sum + inv.amount, 0),
          totalInvoices: invoices.length,
        },
        period: {
          startDate: input.startDate,
          endDate: input.endDate,
        },
      }
    }),

  // --------------------------------------------------------------------------
  // 6️⃣ EXPORT REPORT
  // --------------------------------------------------------------------------
  exportReport: tenantProcedure
    .use(hasPermission(P.EXPORT))
    .input(
      z.object({
        reportType: z.enum([
          "margin",
          "live_contractors",
          "contracts_by_country",
          "contractors_by_client",
          "income_by_country",
        ]),
        format: z.enum(["csv", "pdf", "xlsx"]).default("csv"),
        filters: z.any().optional(), // Dynamic filters based on report type
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tenantId = ctx.tenantId

      // Create data export job
      const dataExport = await ctx.prisma.dataExport.create({
        data: {
          tenantId,
          requestedBy: user.id,
          type: "report",
          format: input.format,
          status: "pending",
          metadata: {
            reportType: input.reportType,
            filters: input.filters,
          },
          requestedAt: new Date(),
        },
      })

      await createAuditLog({
        userId: user.id,
        userName: user.name ?? "Unknown",
        userRole: user.roleName,
        action: AuditAction.EXPORT,
        entityType: AuditEntityType.REPORT,
        metadata: { 
          reportType: input.reportType,
          format: input.format,
        },
        tenantId,
      })

      // In a real implementation, this would trigger a background job
      // to generate the export file and send it to the user

      return {
        exportId: dataExport.id,
        status: "pending",
        message: "Export job created. You will receive a notification when it's ready.",
      }
    }),

  // --------------------------------------------------------------------------
  // 7️⃣ DASHBOARD SUMMARY (All key metrics)
  // --------------------------------------------------------------------------
  getDashboardSummary: tenantProcedure
    .use(hasAnyPermission([
      P.VIEW_MARGIN,
      P.VIEW_LIVE_CONTRACTORS,
      P.VIEW_INCOME,
    ]))
    .input(
      z.object({
        period: z.enum(["today", "week", "month", "quarter", "year"]).default("month"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId
      const params = input || { period: "month" }

      // Calculate date range
      const now = new Date()
      let startDate: Date

      switch (params.period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      const [
        activeContractors,
        totalContracts,
        pendingInvoices,
        paidInvoices,
        totalMargin,
      ] = await Promise.all([
        // Active contractors
        ctx.prisma.user.count({
          where: {
            tenantId,
            contractParticipants: {
              some: {
                role: "contractor",
                contract: {
                  status: "active",
                },
              },
            },
          },
        }),
        // Total contracts
        ctx.prisma.contract.count({
          where: {
            tenantId,
            status: "active",
          },
        }),
        // Pending invoices
        ctx.prisma.invoice.aggregate({
          where: {
            tenantId,
            status: { in: ["pending", "sent"] },
          },
          _sum: {
            amount: true,
          },
          _count: true,
        }),
        // Paid invoices in period
        ctx.prisma.invoice.aggregate({
          where: {
            tenantId,
            status: { in: ["paid", "partially_paid"] },
            paidAt: {
              gte: startDate,
              lte: now,
            },
          },
          _sum: {
            amount: true,
          },
          _count: true,
        }),
        // Margin in period (from completed payments)
        ctx.prisma.payment.findMany({
          where: {
            tenantId,
            status: "completed",
            paymentDate: {
              gte: startDate,
              lte: now,
            },
          },
          include: {
            invoice: {
              include: {
                contract: {
                  select: {
                    margin: true,
                    marginType: true,
                  },
                },
              },
            },
          },
        }),
      ])

      // Calculate total margin
      const calculatedMargin = totalMargin.reduce((sum, payment) => {
        const contract = payment.invoice?.contract
        if (!contract?.margin) return sum

        if (contract.marginType === "percentage") {
          return sum + (payment.invoice?.amount || 0) * (contract.margin / 100)
        } else {
          return sum + contract.margin
        }
      }, 0)

      return {
        period: params.period,
        dateRange: {
          startDate,
          endDate: now,
        },
        metrics: {
          activeContractors,
          totalContracts,
          pendingInvoices: {
            count: pendingInvoices._count,
            amount: pendingInvoices._sum.amount || 0,
          },
          paidInvoices: {
            count: paidInvoices._count,
            amount: paidInvoices._sum.amount || 0,
          },
          totalMargin: calculatedMargin,
        },
      }
    }),
})
