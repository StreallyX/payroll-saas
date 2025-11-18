import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions-v2";
import { TRPCError } from "@trpc/server";

// --------------------------------------
// PERMISSION KEYS (V3 FORMAT)
// --------------------------------------
const VIEW_ALL   = buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.GLOBAL);
const VIEW_OWN   = buildPermissionKey(Resource.TASK, Action.READ, PermissionScope.OWN);
const CREATE     = buildPermissionKey(Resource.TASK, Action.CREATE, PermissionScope.GLOBAL);
const UPDATE_OWN = buildPermissionKey(Resource.TASK, Action.UPDATE, PermissionScope.OWN);
const DELETE     = buildPermissionKey(Resource.TASK, Action.DELETE, PermissionScope.GLOBAL);
const COMPLETE   = buildPermissionKey(Resource.TASK, Action.UPDATE, PermissionScope.OWN);

export const taskRouter = createTRPCRouter({

  // -------------------------------------------------------
  // GET ALL TASKS
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(VIEW_ALL))
    .query(async ({ ctx }) => {
      return ctx.prisma.task.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          assignerUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasPermission(VIEW_ALL))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.task.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          assignerUser: { select: { id: true, name: true, email: true } },
        },
      });
    }),

  // -------------------------------------------------------
  // GET MY TASKS
  // -------------------------------------------------------
  getMyTasks: tenantProcedure
    .use(hasPermission(VIEW_OWN))
    .query(async ({ ctx }) => {
      return ctx.prisma.task.findMany({
        where: {
          tenantId: ctx.tenantId,
          assignedTo: ctx.session!.user.id,
        },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          assignerUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // -------------------------------------------------------
  // CREATE TASK
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(CREATE))
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        assignedTo: z.string(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.create({
        data: {
          ...input,
          assignedBy: ctx.session!.user.id,
          tenantId: ctx.tenantId,
        },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          assignerUser: { select: { id: true, name: true, email: true } },
        },
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.TASK,
        entityId: task.id,
        entityName: task.title,
        metadata: {
          priority: task.priority,
          assignedTo: task.assignedTo,
        },
        tenantId: ctx.tenantId,
      });

      return task;
    }),

  // -------------------------------------------------------
  // UPDATE TASK (OWN)
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(UPDATE_OWN))
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z.enum(["pending", "completed"]).optional(),
        dueDate: z.date().optional(),
        isCompleted: z.boolean().optional(),
        completedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const task = await ctx.prisma.task.update({
        where: { id, tenantId: ctx.tenantId },
        data: updateData,
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          assignerUser: { select: { id: true, name: true, email: true } },
        },
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TASK,
        entityId: task.id,
        entityName: task.title,
        metadata: { updates: updateData },
        tenantId: ctx.tenantId,
      });

      return task;
    }),

  // -------------------------------------------------------
  // DELETE TASK
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(DELETE))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

      const result = await ctx.prisma.task.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.TASK,
        entityId: input.id,
        entityName: task.title,
        metadata: { priority: task.priority },
        tenantId: ctx.tenantId,
      });

      return result;
    }),

  // -------------------------------------------------------
  // TOGGLE COMPLETE
  // -------------------------------------------------------
  toggleComplete: tenantProcedure
    .use(hasPermission(COMPLETE))
    .input(
      z.object({
        id: z.string(),
        isCompleted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.update({
        where: { id: input.id, tenantId: ctx.tenantId },
        data: {
          isCompleted: input.isCompleted,
          status: input.isCompleted ? "completed" : "pending",
          completedAt: input.isCompleted ? new Date() : null,
        },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          assignerUser: { select: { id: true, name: true, email: true } },
        },
      });

      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.TASK,
        entityId: task.id,
        entityName: task.title,
        metadata: {
          action: input.isCompleted ? "completed" : "reopened",
        },
        tenantId: ctx.tenantId,
      });

      return task;
    }),

  // -------------------------------------------------------
  // STATS
  // -------------------------------------------------------
  getStats: tenantProcedure
    .use(hasPermission(VIEW_ALL))
    .query(async ({ ctx }) => {
      const total = await ctx.prisma.task.count({
        where: { tenantId: ctx.tenantId },
      });

      const pending = await ctx.prisma.task.count({
        where: { tenantId: ctx.tenantId, status: "pending" },
      });

      const completed = await ctx.prisma.task.count({
        where: { tenantId: ctx.tenantId, status: "completed" },
      });

      const overdue = await ctx.prisma.task.count({
        where: {
          tenantId: ctx.tenantId,
          status: "pending",
          dueDate: { lt: new Date() },
        },
      });

      return { total, pending, completed, overdue };
    }),
});
