import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

import {
  buildPermissionKey,
  Resource,
  Action,
  PermissionScope,
} from "../../rbac/permissions-v2";

export const emailLogRouter = createTRPCRouter({
  /**
   * LIST EMAIL LOGS (paginated + filters)
   */
  getAll: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.AUDIT_LOG, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(
      z.object({
        recipient: z.string().optional(),
        status: z.enum(["SENT", "FAILED", "PENDING", "QUEUED"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { recipient, status, startDate, endDate, page, pageSize } = input;

      const where: Prisma.EmailLogWhereInput = {
        tenantId: ctx.tenantId!,
      };

      if (recipient) {
        where.to = { contains: recipient, mode: "insensitive" };
      }

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.sentAt = {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        };
      }

      const [logs, total] = await Promise.all([
        ctx.prisma.emailLog.findMany({
          where,
          orderBy: { sentAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.prisma.emailLog.count({ where }),
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

  /**
   * GET EMAIL LOG BY ID
   */
  getById: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.AUDIT_LOG, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const log = await ctx.prisma.emailLog.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email log not found",
        });
      }

      return { success: true, data: log };
    }),

  /**
   * GET EMAIL STATS
   */
  getStats: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.AUDIT_LOG, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.EmailLogWhereInput = {
        tenantId: ctx.tenantId!,
      };

      if (input?.startDate || input?.endDate) {
        where.sentAt = {
          ...(input?.startDate && { gte: input.startDate }),
          ...(input?.endDate && { lte: input.endDate }),
        };
      }

      const [total, sent, failed, pending] = await Promise.all([
        ctx.prisma.emailLog.count({ where }),
        ctx.prisma.emailLog.count({ where: { ...where, status: "SENT" } }),
        ctx.prisma.emailLog.count({ where: { ...where, status: "FAILED" } }),
        ctx.prisma.emailLog.count({ where: { ...where, status: "PENDING" } }),
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

  /**
   * GET RECENT
   */
  getRecent: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.AUDIT_LOG, Action.READ, PermissionScope.TENANT)
      )
    )
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const logs = await ctx.prisma.emailLog.findMany({
        where: { tenantId: ctx.tenantId! },
        orderBy: { sentAt: "desc" },
        take: input?.limit ?? 10,
      });

      return { success: true, data: logs };
    }),

  /**
   * RESEND A FAILED EMAIL
   */
  resend: tenantProcedure
    .use(
      hasPermission(
        buildPermissionKey(Resource.SETTINGS, Action.UPDATE, PermissionScope.TENANT)
      )
    )
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const log = await ctx.prisma.emailLog.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId! },
      });

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email log not found",
        });
      }

      if (log.status === "SENT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email was already sent successfully",
        });
      }

      await ctx.prisma.emailLog.update({
        where: { id: input.id },
        data: {
          status: "PENDING",
          error: null,
        },
      });

      // TODO: Trigger emailService.send(log)

      return { success: true, message: "Email queued for resending" };
    }),
});
