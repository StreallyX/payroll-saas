
import { z } from "zod"
import { createTRPCRouter, tenantProcedure } from "../trpc"
import { hasPermission } from "../trpc"
import { PERMISSION_TREE } from "../../rbac/permissions"
import { TRPCError } from "@trpc/server"

export const timesheetRouter = createTRPCRouter({
  
  getAll: tenantProcedure
  .use(hasPermission(PERMISSION_TREE.timesheet.view))
  .query(async ({ ctx }) => {
    return ctx.prisma.timesheet.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        contractor: {
          include: { user: true }
        },
        contract: {
          select: {
            contractReference: true,
            agency: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  }),

  approve: tenantProcedure
  .use(hasPermission(PERMISSION_TREE.timesheet.approve))
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.timesheet.update({
      where: { id: input.id },
      data: {
        status: "approved",
        approvedAt: new Date()
      }
    })
  }),


  // Get contractor's own timesheets
  getMyTimesheets: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.timesheet.view))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Contractor profile not found" 
        })
      }
      
      return ctx.prisma.timesheet.findMany({
        where: {
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id
        },
        include: {
          contract: {
            select: {
              id: true,
              contractReference: true,
              agency: { select: { name: true } }
            }
          },
          entries: {
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }),
  
  // Create timesheet entry
  createEntry: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.timesheet.create))
    .input(z.object({
      contractId: z.string(),
      date: z.date(),
      hours: z.number().positive().max(24),
      description: z.string().min(1).max(500),
      projectName: z.string().optional(),
      taskName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify contractor owns contract
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Contractor profile not found" 
        })
      }
      
      const contract = await ctx.prisma.contract.findFirst({
        where: {
          id: input.contractId,
          contractorId: user.contractor.id,
          tenantId: ctx.tenantId
        }
      })
      
      if (!contract) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Contract not found or not owned by you" 
        })
      }
      
      // Get or create timesheet for this period (weekly)
      const date = new Date(input.date)
      const dayOfWeek = date.getDay()
      const periodStart = new Date(date)
      periodStart.setDate(date.getDate() - dayOfWeek) // Start of week
      periodStart.setHours(0, 0, 0, 0)
      
      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodStart.getDate() + 6) // End of week
      periodEnd.setHours(23, 59, 59, 999)
      
      let timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          contractId: input.contractId,
          contractorId: user.contractor.id,
          startDate: { lte: date },
          endDate: { gte: date }
        }
      })
      
      if (!timesheet) {
        timesheet = await ctx.prisma.timesheet.create({
          data: {
            tenantId: ctx.tenantId,
            contractId: input.contractId,
            contractorId: user.contractor.id,
            startDate: periodStart,
            endDate: periodEnd,
            status: 'draft',
            totalHours: 0
          }
        })
      }
      
      // Create entry
      const entry = await ctx.prisma.timesheetEntry.create({
        data: {
          timesheetId: timesheet.id,
          date: input.date,
          hours: input.hours,
          description: input.description,
          projectName: input.projectName,
          taskName: input.taskName
        }
      })
      
      // Update total hours
      await ctx.prisma.timesheet.update({
        where: { id: timesheet.id },
        data: {
          totalHours: {
            increment: input.hours
          }
        }
      })
      
      return entry
    }),
  
  // Update timesheet entry
  updateEntry: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.timesheet.update))
    .input(z.object({
      entryId: z.string(),
      date: z.date().optional(),
      hours: z.number().positive().max(24).optional(),
      description: z.string().min(1).max(500).optional(),
      projectName: z.string().optional(),
      taskName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { entryId, ...updates } = input
      
      // Verify ownership through timesheet
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      if (!user?.contractor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contractor not found" })
      }
      
      const entry = await ctx.prisma.timesheetEntry.findFirst({
        where: {
          id: entryId,
          timesheet: {
            contractorId: user.contractor.id,
            tenantId: ctx.tenantId
          }
        },
        include: { timesheet: true }
      })
      
      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" })
      }
      
      if (entry.timesheet.status !== 'draft') {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Cannot update entry in submitted timesheet" 
        })
      }
      
      // Update entry
      const updated = await ctx.prisma.timesheetEntry.update({
        where: { id: entryId },
        data: updates
      })
      
      // Recalculate total hours if hours changed
      if (updates.hours !== undefined) {
        const allEntries = await ctx.prisma.timesheetEntry.findMany({
          where: { timesheetId: entry.timesheetId }
        })
        
        const totalHours = allEntries.reduce((sum, e) => sum + Number(e.hours), 0)
        
        await ctx.prisma.timesheet.update({
          where: { id: entry.timesheetId },
          data: { totalHours }
        })
      }
      
      return updated
    }),
  
  // Delete timesheet entry
  deleteEntry: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.timesheet.delete))
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      const entry = await ctx.prisma.timesheetEntry.findFirst({
        where: {
          id: input.entryId,
          timesheet: {
            contractorId: user?.contractor?.id,
            tenantId: ctx.tenantId,
            status: 'draft' // Can only delete from draft timesheets
          }
        },
        include: { timesheet: true }
      })
      
      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found or cannot be deleted" })
      }
      
      // Delete entry
      await ctx.prisma.timesheetEntry.delete({
        where: { id: input.entryId }
      })
      
      // Recalculate total hours
      const allEntries = await ctx.prisma.timesheetEntry.findMany({
        where: { timesheetId: entry.timesheetId }
      })
      
      const totalHours = allEntries.reduce((sum, e) => sum + Number(e.hours), 0)
      
      await ctx.prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours }
      })
      
      return { success: true }
    }),
  
  // Submit timesheet for approval
  submitTimesheet: tenantProcedure
    .use(hasPermission(PERMISSION_TREE.timesheet.submit))
    .input(z.object({ timesheetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true }
      })
      
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.timesheetId,
          contractorId: user?.contractor?.id,
          tenantId: ctx.tenantId
        },
        include: {
          entries: true,
          contract: {
            include: {
              agency: true
            }
          }
        }
      })
      
      if (!timesheet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Timesheet not found" })
      }
      
      if (timesheet.status !== 'draft') {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Timesheet already submitted" 
        })
      }
      
      if (timesheet.entries.length === 0) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Cannot submit empty timesheet" 
        })
      }
      
      // Update status
      const updated = await ctx.prisma.timesheet.update({
        where: { id: input.timesheetId },
        data: {
          status: 'submitted',
          submittedAt: new Date()
        }
      })
      
      // TODO: Send notification to approver (agency or admin)
      // await sendTimesheetNotification(timesheet, user.contractor)
      
      return updated
    }),
})
