import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2";

// -------------------------------------------------------
// PERMISSIONS V3
// -------------------------------------------------------
const VIEW_ALL     = buildPermissionKey(Resource.TIMESHEET, Action.READ, PermissionScope.GLOBAL);
const VIEW_OWN     = buildPermissionKey(Resource.TIMESHEET, Action.READ, PermissionScope.OWN);
const CREATE       = buildPermissionKey(Resource.TIMESHEET, Action.CREATE, PermissionScope.OWN);
const UPDATE_OWN   = buildPermissionKey(Resource.TIMESHEET, Action.UPDATE, PermissionScope.OWN);
const DELETE_OWN   = buildPermissionKey(Resource.TIMESHEET, Action.DELETE, PermissionScope.OWN);
const APPROVE      = buildPermissionKey(Resource.TIMESHEET, Action.APPROVE, PermissionScope.GLOBAL);
const SUBMIT       = buildPermissionKey(Resource.TIMESHEET, Action.SUBMIT, PermissionScope.OWN);

export const timesheetRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL TIMESHEETS (ADMIN/AGENCY)
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(VIEW_ALL))
    .query(async ({ ctx }) => {
      return ctx.prisma.timesheet.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          contractor: {
            include: { user: true },
          },
          contract: {
            select: {
              contractReference: true,
              agency: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // -------------------------------------------------------
  // APPROVE TIMESHEET
  // -------------------------------------------------------
  approve: tenantProcedure
    .use(hasPermission(APPROVE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.timesheet.update({
        where: { id: input.id },
        data: {
          status: "approved",
          approvedAt: new Date(),
        },
      });
    }),

  // -------------------------------------------------------
  // GET MY OWN TIMESHEETS (CONTRACTOR)
  // -------------------------------------------------------
  getMyTimesheets: tenantProcedure
    .use(hasPermission(VIEW_OWN))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (!user?.contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor profile not found",
        });
      }

      return ctx.prisma.timesheet.findMany({
        where: {
          tenantId: ctx.tenantId,
          contractorId: user.contractor.id,
        },
        include: {
          contract: {
            select: {
              id: true,
              contractReference: true,
              agency: { select: { name: true } },
            },
          },
          entries: {
            orderBy: { date: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // -------------------------------------------------------
  // CREATE TIMESHEET ENTRY (CONTRACTOR)
  // -------------------------------------------------------
  createEntry: tenantProcedure
    .use(hasPermission(CREATE))
    .input(
      z.object({
        contractId: z.string(),
        date: z.date(),
        hours: z.number().positive().max(24),
        description: z.string().min(1).max(500),
        projectName: z.string().optional(),
        taskName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (!user?.contractor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contractor profile not found",
        });
      }

      const contract = await ctx.prisma.contract.findFirst({
        where: {
          id: input.contractId,
          contractorId: user.contractor.id,
          tenantId: ctx.tenantId,
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Contract not found or not owned by you",
        });
      }

      // WEEK START / END
      const date = new Date(input.date);
      const dayOfWeek = date.getDay();

      const periodStart = new Date(date);
      periodStart.setDate(date.getDate() - dayOfWeek);
      periodStart.setHours(0, 0, 0, 0);

      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);

      let timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          contractId: input.contractId,
          contractorId: user.contractor.id,
          startDate: { lte: date },
          endDate: { gte: date },
        },
      });

      if (!timesheet) {
        timesheet = await ctx.prisma.timesheet.create({
          data: {
            tenantId: ctx.tenantId,
            contractId: input.contractId,
            contractorId: user.contractor.id,
            startDate: periodStart,
            endDate: periodEnd,
            status: "draft",
            totalHours: 0,
          },
        });
      }

      const entry = await ctx.prisma.timesheetEntry.create({
        data: {
          timesheetId: timesheet.id,
          date: input.date,
          hours: input.hours,
          description: input.description,
          projectName: input.projectName,
          taskName: input.taskName,
        },
      });

      await ctx.prisma.timesheet.update({
        where: { id: timesheet.id },
        data: {
          totalHours: { increment: input.hours },
        },
      });

      return entry;
    }),

  // -------------------------------------------------------
  // UPDATE ENTRY (CONTRACTOR)
  // -------------------------------------------------------
  updateEntry: tenantProcedure
    .use(hasPermission(UPDATE_OWN))
    .input(
      z.object({
        entryId: z.string(),
        date: z.date().optional(),
        hours: z.number().positive().max(24).optional(),
        description: z.string().min(1).max(500).optional(),
        projectName: z.string().optional(),
        taskName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { entryId, ...updates } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      if (!user?.contractor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contractor not found" });
      }

      const entry = await ctx.prisma.timesheetEntry.findFirst({
        where: {
          id: entryId,
          timesheet: {
            contractorId: user.contractor.id,
            tenantId: ctx.tenantId,
          },
        },
        include: { timesheet: true },
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }

      if (entry.timesheet.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update entry in submitted timesheet",
        });
      }

      const updated = await ctx.prisma.timesheetEntry.update({
        where: { id: entryId },
        data: updates,
      });

      if (updates.hours !== undefined) {
        const allEntries = await ctx.prisma.timesheetEntry.findMany({
          where: { timesheetId: entry.timesheetId },
        });

        const totalHours = allEntries.reduce((sum, e) => sum + Number(e.hours), 0);

        await ctx.prisma.timesheet.update({
          where: { id: entry.timesheetId },
          data: { totalHours },
        });
      }

      return updated;
    }),

  // -------------------------------------------------------
  // DELETE ENTRY (CONTRACTOR)
  // -------------------------------------------------------
  deleteEntry: tenantProcedure
    .use(hasPermission(DELETE_OWN))
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      const entry = await ctx.prisma.timesheetEntry.findFirst({
        where: {
          id: input.entryId,
          timesheet: {
            contractorId: user?.contractor?.id,
            tenantId: ctx.tenantId,
            status: "draft",
          },
        },
        include: { timesheet: true },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entry not found or cannot be deleted",
        });
      }

      await ctx.prisma.timesheetEntry.delete({
        where: { id: input.entryId },
      });

      const allEntries = await ctx.prisma.timesheetEntry.findMany({
        where: { timesheetId: entry.timesheetId },
      });

      const totalHours = allEntries.reduce((sum, e) => sum + Number(e.hours), 0);

      await ctx.prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours },
      });

      return { success: true };
    }),

  // -------------------------------------------------------
  // SUBMIT TIMESHEET (CONTRACTOR)
  // -------------------------------------------------------
  submitTimesheet: tenantProcedure
    .use(hasPermission(SUBMIT))
    .input(z.object({ timesheetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { contractor: true },
      });

      const timesheet = await ctx.prisma.timesheet.findFirst({
        where: {
          id: input.timesheetId,
          contractorId: user?.contractor?.id,
          tenantId: ctx.tenantId,
        },
        include: {
          entries: true,
          contract: {
            include: { agency: true },
          },
        },
      });

      if (!timesheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timesheet not found",
        });
      }

      if (timesheet.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Timesheet already submitted",
        });
      }

      if (timesheet.entries.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot submit empty timesheet",
        });
      }

      return ctx.prisma.timesheet.update({
        where: { id: input.timesheetId },
        data: {
          status: "submitted",
          submittedAt: new Date(),
        },
      });
    }),
});
