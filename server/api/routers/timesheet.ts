import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"
import { StateTransitionService } from "@/lib/services/StateTransitionService"
import { WorkflowEntityType, WorkflowAction } from "@/lib/workflows"

// ------------------------------------------------------
// PERMISSIONS
// ------------------------------------------------------
const P = {
  READ_OWN: "timesheet.read.own",
  CREATE_OWN: "timesheet.create.own",
  UPDATE_OWN: "timesheet.update.own",
  DELETE_OWN: "timesheet.delete.own",
  SUBMIT_OWN: "timesheet.submit.own",

  LIST_ALL: "timesheet.list.global",
  REVIEW_ALL: "timesheet.review.global",
  APPROVE: "timesheet.approve.global",
  REJECT: "timesheet.reject.global",
  MODIFY_ALL: "timesheet.modify.global",
}

// ------------------------------------------------------
// ROUTER
// ------------------------------------------------------
export const timesheetRouter = createTRPCRouter({

  // ------------------------------------------------------
  // 1️⃣ GET ALL TIMESHEETS — ADMIN / AGENCY
  // ------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(P.LIST_ALL))
    .query(async ({ ctx }) => {
      return ctx.prisma.timesheet.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          submitter: true,
          contract: {
            select: {
              contractReference: true,
              participants: {
                include: { 
                  user: true,
                  company: { select: { name: true } },
                },
              },
            },
          },
          entries: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ------------------------------------------------------
  // 2️⃣ GET BY ID (OWN OR GLOBAL)
  // ------------------------------------------------------
  getById: tenantProcedure
    .use(hasAnyPermission([P.READ_OWN, P.LIST_ALL]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ts = await ctx.prisma.timesheet.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          submitter: true,
          contract: {
            include: {
              participants: { 
                include: { 
                  user: true,
                  company: true,
                } 
              },
            },
          },
          entries: true,
        },
      })

      if (!ts) throw new TRPCError({ code: "NOT_FOUND" })

      const isAdmin = ctx.session.user.permissions.includes(P.LIST_ALL)

      if (!isAdmin && ts.submittedBy !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN" })

      return ts
    }),

  // ------------------------------------------------------
  // 3️⃣ GET MY TIMESHEETS
  // ------------------------------------------------------
  getMyTimesheets: tenantProcedure
    .use(hasPermission(P.READ_OWN))
    .query(async ({ ctx }) => {
      return ctx.prisma.timesheet.findMany({
        where: {
          tenantId: ctx.tenantId,
          submittedBy: ctx.session.user.id,
        },
        include: {
          contract: {
            include: {
              participants: { 
                include: { 
                  user: true,
                  company: true,
                } 
              },
            },
          },
          entries: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ------------------------------------------------------
// 10️⃣ CREATE TIMESHEET WITH DATE RANGE (DEEL STYLE)
// ------------------------------------------------------
createRange: tenantProcedure
  .use(hasPermission(P.CREATE_OWN))
  .input(
    z.object({
      contractId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      hoursPerDay: z.string(), // validated later
      notes: z.string().optional(),

      // 🔥 optional files
      timesheetFileUrl: z.string().optional().nullable(),
      expenseFileUrl: z.string().optional().nullable(),
    })
  )
  .mutation(async ({ ctx, input }) => {

    const userId = ctx.session.user.id;

    // 1️⃣ Validate contract participation
    const participant = await ctx.prisma.contractParticipant.findFirst({
      where: {
        contractId: input.contractId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not assigned to this contract.",
      });
    }

    // Convert dates
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    if (start > end) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date.",
      });
    }

    // Validate hours
    const hours = Number(input.hoursPerDay);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Hours per day must be a valid number between 1 and 24.",
      });
    }

    // 🔥 Construct dynamic file fields
    const fileData: any = {};
    if (input.timesheetFileUrl) fileData.timesheetFileUrl = input.timesheetFileUrl;
    if (input.expenseFileUrl) fileData.expenseFileUrl = input.expenseFileUrl;

    // 2️⃣ Create main timesheet
    const ts = await ctx.prisma.timesheet.create({
      data: {
        tenantId: ctx.tenantId,
        contractId: input.contractId,
        submittedBy: userId,
        startDate: start,
        endDate: end,
        status: "submitted",
        totalHours: new Prisma.Decimal(0),
        notes: input.notes || null,
        ...fileData, // 🔥 only added if provided
      },
    });

    // 3️⃣ Generate entries for every day of the range
    const entries = [];
    let cursor = new Date(start);

    while (cursor <= end) {
      entries.push({
        timesheetId: ts.id,
        date: cursor,
        hours: new Prisma.Decimal(hours),
        amount: null,
      });

      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }

    await ctx.prisma.timesheetEntry.createMany({ data: entries });

    // 4️⃣ Recalculate total hours
    const totalHours = new Prisma.Decimal(hours * entries.length);

    await ctx.prisma.timesheet.update({
      where: { id: ts.id },
      data: { totalHours },
    });

    // 5️⃣ Compute totalAmount from contract rate
    const contract = await ctx.prisma.contract.findFirst({
      where: { id: input.contractId },
      select: { rate: true, rateType: true },
    });

    let totalAmount = null;

    if (contract?.rate) {
      if (contract.rateType === "hourly") {
        totalAmount = new Prisma.Decimal(totalHours).mul(contract.rate);
      } else if (contract.rateType === "daily") {
        totalAmount = contract.rate.mul(entries.length);
      }
    }

    // Update timesheet again with amount
    await ctx.prisma.timesheet.update({
      where: { id: ts.id },
      data: { totalAmount },
    });

    return { success: true, timesheetId: ts.id };
  }),


  // ------------------------------------------------------
  // 5️⃣ UPDATE ENTRY
  // ------------------------------------------------------
  updateEntry: tenantProcedure
    .use(hasPermission(P.UPDATE_OWN))
    .input(
      z.object({
        entryId: z.string(),
        date: z.date().optional(),
        hours: z.number().positive().max(24).optional(),
        description: z.string().optional(),
        projectName: z.string().optional(),
        taskName: z.string().optional(),
        breakHours: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.timesheetEntry.findFirst({
        where: {
          id: input.entryId,
          timesheet: {
            submittedBy: ctx.session.user.id,
            tenantId: ctx.tenantId,
            status: "draft",
          },
        },
      })

      if (!entry)
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" })

      const updated = await ctx.prisma.timesheetEntry.update({
        where: { id: input.entryId },
        data: {
          ...input,
          hours: input.hours
            ? new Prisma.Decimal(input.hours)
            : undefined,
          breakHours: input.breakHours
            ? new Prisma.Decimal(input.breakHours)
            : undefined,
        },
      })

      // Recalculate hours
      const all = await ctx.prisma.timesheetEntry.findMany({
        where: { timesheetId: entry.timesheetId },
      })

      const total = all.reduce((sum, e) => sum + Number(e.hours), 0)

      await ctx.prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours: new Prisma.Decimal(total) },
      })

      return updated
    }),

  // ------------------------------------------------------
  // 6️⃣ DELETE ENTRY
  // ------------------------------------------------------
  deleteEntry: tenantProcedure
    .use(hasPermission(P.DELETE_OWN))
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.prisma.timesheetEntry.findFirst({
        where: {
          id: input.entryId,
          timesheet: {
            submittedBy: ctx.session.user.id,
            tenantId: ctx.tenantId,
            status: "draft",
          },
        },
      })

      if (!entry)
        throw new TRPCError({ code: "NOT_FOUND" })

      await ctx.prisma.timesheetEntry.delete({
        where: { id: input.entryId },
      })

      // Recalculate
      const all = await ctx.prisma.timesheetEntry.findMany({
        where: { timesheetId: entry.timesheetId },
      })

      const total = all.reduce((sum, e) => sum + Number(e.hours), 0)

      await ctx.prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours: new Prisma.Decimal(total) },
      })

      return { success: true }
    }),

  // ------------------------------------------------------
  // 7️⃣ SUBMIT TIMESHEET (OWN)
  // ------------------------------------------------------
  submitTimesheet: tenantProcedure
    .use(hasPermission(P.SUBMIT_OWN))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const ts = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
          submittedBy: ctx.session.user.id,
        },
        include: { entries: true },
      })

      if (!ts)
        throw new TRPCError({ code: "NOT_FOUND" })

      if (ts.entries.length === 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot submit empty timesheet",
        })

      if (ts.status !== "draft")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Timesheet already submitted",
        })

      return ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          status: "submitted",
          submittedAt: new Date(),
        },
      })
    }),

 approve: tenantProcedure
   .use(hasPermission(P.APPROVE))
   .input(z.object({ id: z.string() }))
   .mutation(async ({ ctx, input }) => {

     // 1️⃣ RELOAD timesheet with contract details
     const ts = await ctx.prisma.timesheet.findFirst({
       where: { id: input.id, tenantId: ctx.tenantId },
       include: {
         contract: {
           include: {
             currency: true,
             participants: {
               include: {
                 user: true,
                 company: true,
               },
             },
           },
         },
         entries: true,
       },
     });

     if (!ts) throw new TRPCError({ code: "NOT_FOUND" });

     // 2️⃣ UPDATE → APPROVE
     await ctx.prisma.timesheet.update({
       where: { id: input.id },
       data: {
         status: "approved",
         workflowState: "approved",
         approvedAt: new Date(),
         approvedBy: ctx.session.user.id,
       },
     });

     const userId = ts.submittedBy;
     const currency = ts.contract?.currency?.name ?? "USD";
     const contractorName = ts.contract?.participants.find(p => p.userId === userId)?.user?.name ?? "Contractor";

     // Calculate amounts with margin
     let baseAmount = ts.adminModifiedAmount ?? ts.totalAmount ?? new Prisma.Decimal(0);
     let marginAmount = new Prisma.Decimal(0);
     let marginPercentage = new Prisma.Decimal(0);
     let totalWithMargin = baseAmount;
     
     if (ts.contract?.margin) {
       if (ts.contract.marginType?.toLowerCase() === "fixed") {
         marginAmount = ts.contract.margin;
         marginPercentage = baseAmount.gt(0) 
           ? ts.contract.margin.div(baseAmount).mul(100) 
           : new Prisma.Decimal(0);
       } else {
         marginPercentage = ts.contract.margin;
         marginAmount = baseAmount.mul(ts.contract.margin).div(100);
       }

       // Add margin if paid by client, subtract if paid by contractor
       if (ts.contract.marginPaidBy === "client") {
         totalWithMargin = baseAmount.add(marginAmount);
       } else if (ts.contract.marginPaidBy === "contractor") {
         totalWithMargin = baseAmount.sub(marginAmount);
       }
     }

     // ------------------------------------------
     // 3️⃣ AUTO-INVOICE with proper workflow state
     // ------------------------------------------
     if (ts.contractId && ts.totalAmount) {
       const invoice = await ctx.prisma.invoice.create({
         data: {
           tenantId: ctx.tenantId,
           contractId: ts.contractId,
           createdBy: userId,

           // Amounts with margin calculation
           baseAmount: baseAmount,
           marginAmount: marginAmount,
           marginPercentage: marginPercentage,
           marginPaidBy: ts.contract?.marginPaidBy,
           amount: baseAmount,
           totalAmount: totalWithMargin,
           currency,

           // Workflow state - set to submitted/pending approval
           status: "submitted",
           workflowState: "for_approval",

           issueDate: new Date(),
           dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now

           description: `Invoice for ${contractorName} - Period: ${ts.startDate.toISOString().slice(0,10)} to ${ts.endDate.toISOString().slice(0,10)}`,
           notes: `Auto-generated from approved timesheet. Total hours: ${ts.totalHours}`,
           
           timesheets: {
             connect: { id: ts.id },
           },

           // Create line items from timesheet entries
           lineItems: {
             create: ts.entries.map((entry) => ({
               description: `Work on ${new Date(entry.date).toISOString().slice(0,10)}${entry.description ? ': ' + entry.description : ''}`,
               quantity: entry.hours,
               unitPrice: ts.contract?.rate ?? new Prisma.Decimal(0),
               amount: entry.hours.mul(ts.contract?.rate ?? new Prisma.Decimal(0)),
             })),
           },
         },
       });

       // Link invoice back to timesheet
       await ctx.prisma.timesheet.update({
         where: { id: ts.id },
         data: { invoiceId: invoice.id },
       });
     }

     return { success: true };
   }),

  // ------------------------------------------------------
  // 9️⃣ REJECT TIMESHEET
  // ------------------------------------------------------
  reject: tenantProcedure
    .use(hasPermission(P.REJECT))
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          status: "rejected",
          rejectionReason: input.reason,
        },
      });
    }),

    // ------------------------------------------------------
  // 3️⃣ BIS — GET MY TIMESHEETS (PAGINATED)
  // ------------------------------------------------------
  getMyTimesheetsPaginated: tenantProcedure
    .use(hasPermission(P.READ_OWN))
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(5).max(50).default(20),
        search: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, search, status } = input;

      const where: any = {
        tenantId: ctx.tenantId,
        submittedBy: ctx.session.user.id,
      };

      // 🔍 Filter: Status
      if (status) where.status = status;

      // 🔎 Filter: Search (title, notes)
      if (search) {
        where.OR = [
          { notes: { contains: search, mode: "insensitive" } },
          { contract: { participants: { some: { company: { name: { contains: search, mode: "insensitive" } } } } } },
        ];
      }

      // Fetch page
      const items = await ctx.prisma.timesheet.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          contract: {
            include: {
              participants: {
                include: {
                  user: true,
                  company: true,
                }
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: string | null = null;

      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  // ========================================================
  // 🔥 NEW WORKFLOW METHODS
  // ========================================================

  /**
   * Mark timesheet as under review
   */
  reviewTimesheet: tenantProcedure
    .use(hasPermission(P.REVIEW_ALL))
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.TIMESHEET,
        entityId: input.id,
        action: WorkflowAction.REVIEW,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.notes,
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Request changes to timesheet
   */
  requestChanges: tenantProcedure
    .use(hasPermission(P.REVIEW_ALL))
    .input(z.object({
      id: z.string(),
      changesRequested: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await StateTransitionService.executeTransition({
        entityType: WorkflowEntityType.TIMESHEET,
        entityId: input.id,
        action: WorkflowAction.REQUEST_CHANGES,
        userId: ctx.session.user.id,
        tenantId: ctx.tenantId,
        reason: input.changesRequested,
        metadata: {
          changesRequested: input.changesRequested,
        },
      })

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join(', '),
        })
      }

      return result.entity
    }),

  /**
   * Modify timesheet amounts (admin only, before approval)
   */
  modifyAmounts: tenantProcedure
    .use(hasPermission(P.MODIFY_ALL))
    .input(z.object({
      id: z.string(),
      totalAmount: z.number().positive(),
      adminModificationNote: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!timesheet) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      // Only allow modification in submitted or under_review states
      if (!['submitted', 'under_review'].includes(timesheet.workflowState)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only modify amounts in submitted or under_review state",
        })
      }

      return ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          adminModifiedAmount: new Prisma.Decimal(input.totalAmount),
          adminModificationNote: input.adminModificationNote,
          modifiedBy: ctx.session.user.id,
          updatedAt: new Date(),
        },
      })
    }),

  /**
   * Get available workflow actions for a timesheet
   */
  getAvailableActions: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!timesheet) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      // Check ownership for OWN permissions
      const isOwner = timesheet.submittedBy === ctx.session.user.id

      const result = await StateTransitionService.getAvailableActions(
        WorkflowEntityType.TIMESHEET,
        input.id,
        ctx.session.user.id,
        ctx.tenantId
      )

      return {
        ...result,
        isOwner,
      }
    }),

  /**
   * Get workflow state history for a timesheet
   */
  getStateHistory: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenantId,
        },
      })

      if (!timesheet) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return StateTransitionService.getStateHistory(
        WorkflowEntityType.TIMESHEET,
        input.id,
        ctx.tenantId
      )
    }),

})