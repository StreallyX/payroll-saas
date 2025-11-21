import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Prisma } from "@prisma/client"
import {
  createTRPCRouter,
  tenantProcedure,
  hasPermission,
  hasAnyPermission,
} from "../trpc"

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
  APPROVE: "timesheet.approve.global",
  REJECT: "timesheet.reject.global",
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
              company: { select: { name: true } },
              participants: {
                include: { user: true },
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
              company: true,
              participants: { include: { user: true } },
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
              company: true,
              participants: { include: { user: true } },
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

  // ------------------------------------------------------
  // 8️⃣ APPROVE TIMESHEET + AUTO-INVOICE + AUTO-PAYSLIP
  // ------------------------------------------------------
  approve: tenantProcedure
    .use(hasPermission(P.APPROVE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {

      // 1. Approve the timesheet
      const ts = await ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: ctx.session.user.id,
        },
        include: {
          contract: true, // ✔ ton include d'origine
        },
      });

      // ===========================================
      // 2. AUTO-GENERATE INVOICE (comme avant)
      // ===========================================
      if (ts.contractId && ts.totalAmount) {
        await ctx.prisma.invoice.create({
          data: {
            tenantId: ctx.tenantId,
            contractId: ts.contractId,
            createdBy: ctx.session.user.id,
            amount: ts.totalAmount,                  // Decimal OK
            currency: ts.contract?.currencyId ?? "EUR",
            status: "draft",
            issueDate: new Date(),
            dueDate: new Date(),
            description: `Timesheet ${ts.startDate.toISOString().slice(0, 10)} → ${ts.endDate.toISOString().slice(0, 10)}`,
            timesheets: {
              connect: { id: ts.id },
            },
          },
        });
      }

      // ===========================================
      // 3. AUTO-GENERATE PAYSLIP (NOUVEAU)
      // ===========================================

      // 🔥 Un timesheet appartient à un contractor → contractor = user
      const userId = ts.submittedBy; 
      // ou ts.contract?.contractorId selon ton modèle exact

      if (userId && ts.totalAmount) {
        await ctx.prisma.payslip.create({
          data: {
            tenantId: ctx.tenantId,
            userId: userId,
            contractId: ts.contractId,

            month: ts.startDate.getMonth() + 1,
            year: ts.startDate.getFullYear(),

            grossPay: Number(ts.totalAmount),    // ✔ convert Decimal → number
            netPay: Number(ts.totalAmount),

            deductions: 0,
            tax: 0,

            status: "generated",
            generatedBy: ctx.session.user.id,

            notes: `Payslip auto-généré depuis timesheet ${ts.startDate.toISOString().slice(0, 10)} → ${ts.endDate.toISOString().slice(0, 10)}`,
          },
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


})
