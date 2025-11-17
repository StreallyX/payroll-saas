import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { PERMISSION_TREE_V2 } from "../../rbac/permissions-v2";
import { TRPCError } from "@trpc/server";

export const approvalWorkflowRouter = createTRPCRouter({
  getAll: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.view))
    .input(z.object({
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId };
      if (input?.entityType) where.entityType = input.entityType;
      if (input?.entityId) where.entityId = input.entityId;
      if (input?.status) where.status = input.status;

      return ctx.prisma.approvalWorkflow.findMany({
        where,
        include: { steps: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.view))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.prisma.approvalWorkflow.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: { steps: true },
      });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
      return workflow;
    }),

  getByEntity: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.view))
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.approvalWorkflow.findFirst({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
          tenantId: ctx.tenantId,
        },
        include: { steps: true },
      });
    }),

  getPendingApprovals: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.view))
    .query(async ({ ctx }) => {
      return ctx.prisma.approvalWorkflow.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ["pending", "in_progress"] },
        },
        include: { steps: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.update))
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
      workflowType: z.string(),
      steps: z.array(z.object({
        stepOrder: z.number(),
        stepName: z.string(),
        approverId: z.string(),
        approverType: z.string(),
        isRequired: z.boolean().default(true),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { steps, ...workflowData } = input;
      
      const workflow = await ctx.prisma.approvalWorkflow.create({
        data: {
          ...workflowData,
          tenantId: ctx.tenantId,
          status: "pending",
          createdById: ctx.session.user.id,
          steps: steps ? {
            create: steps.map(step => ({
              ...step,
              status: "pending",
            })),
          } : undefined,
        },
        include: { steps: true },
      });

      return workflow;
    }),

  cancel: tenantProcedure
    .use(hasPermission(PERMISSION_TREE_V2.contracts.update))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await ctx.prisma.approvalWorkflow.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.approvalWorkflow.update({
        where: { id: input.id },
        data: {
          status: "cancelled",
          completedAt: new Date(),
        },
      });
    }),
});
