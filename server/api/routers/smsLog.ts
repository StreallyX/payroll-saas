/**
 * SMS Log Router (Permission v3)
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2";

// ----------------------------------------------------
// BUILD PERMISSION KEYS
// ----------------------------------------------------
const VIEW_LIST = buildPermissionKey(Resource.AUDIT_LOG, Action.LIST, PermissionScope.GLOBAL);
const RESEND    = buildPermissionKey(Resource.SETTINGS, Action.UPDATE, PermissionScope.GLOBAL);

export const smsLogRouter = createTRPCRouter({

  // ----------------------------------------------------
  // LIST ALL SMS LOGS
  // ----------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(VIEW_LIST))
    .input(
      z.object({
        to: z.string().optional(),
        status: z.enum(["SENT", "FAILED", "PENDING", "QUEUED", "DELIVERED"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { to, status, startDate, endDate, page, pageSize } = input;

      const where: Prisma.SMSLogWhereInput = {
        tenantId: ctx.tenantId!,
      };

      if (to) {
        where.to = {
          contains: to,
          mode: "insensitive",
        };
      }

      if (status) where.status = status;

      if (startDate || endDate) {
        where.sentAt = {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        };
      }

      const [logs, total] = await Promise.all([
        ctx.prisma.sMSLog.findMany({
          where,
          orderBy: { sentAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.sMSLog.count({ where }),
      ]);

      return {
        success: true,
        data: {
          items: logs,
          pagination: {
            page,
            pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize),
            hasNext: page < Math.ceil(total / pageSize),
            hasPrevious: page > 1,
          },
        },
      };
    }),

  // ----------------------------------------------------
  // GET ONE SMS LOG
  // ----------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(VIEW_LIST))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const log = await ctx.prisma.sMSLog.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SMS log not found",
        });
      }

      return { success: true, data: log };
    }),

  // ----------------------------------------------------
  // GET SMS STATS
  // ----------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(VIEW_LIST))
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.SMSLogWhereInput = {
        tenantId: ctx.tenantId!,
      };

      if (input?.startDate || input?.endDate) {
        where.sentAt = {
          ...(input.startDate && { gte: input.startDate }),
          ...(input.endDate && { lte: input.endDate }),
        };
      }

      const [total, sent, failed, pending] = await Promise.all([
        ctx.prisma.sMSLog.count({ where }),
        ctx.prisma.sMSLog.count({ where: { ...where, status: "SENT" } }),
        ctx.prisma.sMSLog.count({ where: { ...where, status: "FAILED" } }),
        ctx.prisma.sMSLog.count({ where: { ...where, status: "PENDING" } }),
      ]);

      return {
        success: true,
        data: {
          total,
          sent,
          failed,
          pending,
          successRate: total > 0 ? (sent / total) * 100 : 0,
        },
      };
    }),

  // ----------------------------------------------------
  // RECENT SMS LOGS
  // ----------------------------------------------------
  getRecent: tenantProcedure
    .use(hasPermission(VIEW_LIST))
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const logs = await ctx.prisma.sMSLog.findMany({
        where: { tenantId: ctx.tenantId! },
        orderBy: { sentAt: "desc" },
        take: input?.limit ?? 10,
      });

      return { success: true, data: logs };
    }),

  // ----------------------------------------------------
  // RESEND SMS
  // ----------------------------------------------------
  resend: tenantProcedure
    .use(hasPermission(RESEND))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const log = await ctx.prisma.sMSLog.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SMS log not found",
        });
      }

      if (log.status === "SENT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "SMS was already sent successfully",
        });
      }

      await ctx.prisma.sMSLog.update({
        where: { id: log.id },
        data: {
          status: "PENDING",
          error: null,
        },
      });

      // TODO later: Trigger background SMS resend job

      return { success: true, message: "SMS queued for resending" };
    }),
});
