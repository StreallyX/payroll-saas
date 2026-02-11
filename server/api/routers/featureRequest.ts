import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission, hasAny } from "../trpc";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import {
  Resource,
  Action,
  PermissionScope,
  buildPermissionKey,
} from "../../rbac/permissions";
import { TRPCError } from "@trpc/server";
import { notifyAdminsOfNewRequest, notifyRequesterOfStatusChange } from "@/lib/feature-request-notifications";

// --------------------------------------
// PERMISSION KEYS
// --------------------------------------
const CREATE_REQUEST = buildPermissionKey(Resource.FEATURE_REQUEST, Action.CREATE, PermissionScope.OWN);
const VIEW_ALL = buildPermissionKey(Resource.FEATURE_REQUEST, Action.LIST, PermissionScope.GLOBAL);
const VIEW_OWN = buildPermissionKey(Resource.FEATURE_REQUEST, Action.LIST, PermissionScope.OWN);
const READ_OWN = buildPermissionKey(Resource.FEATURE_REQUEST, Action.READ, PermissionScope.OWN);
const UPDATE_REQUEST = buildPermissionKey(Resource.FEATURE_REQUEST, Action.UPDATE, PermissionScope.GLOBAL);
const CONFIRM_REQUEST = buildPermissionKey(Resource.FEATURE_REQUEST, Action.CONFIRM, PermissionScope.GLOBAL);
const REJECT_REQUEST = buildPermissionKey(Resource.FEATURE_REQUEST, Action.REJECT, PermissionScope.GLOBAL);
const DELETE_REQUEST = buildPermissionKey(Resource.FEATURE_REQUEST, Action.DELETE, PermissionScope.GLOBAL);
const MANAGE_PLATFORM = buildPermissionKey(Resource.PLATFORM, Action.UPDATE, PermissionScope.GLOBAL);

export const featureRequestRouter = createTRPCRouter({
  // -------------------------------------------------------
  // GET ALL FEATURE REQUESTS (Admin)
  // -------------------------------------------------------
  getAll: tenantProcedure
    .use(hasPermission(VIEW_ALL))
    .input(
      z
        .object({
          status: z.string().optional(),
          priority: z.string().optional(),
          actionType: z.string().optional(),
          userId: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = { tenantId: ctx.tenantId };

      // Apply filters
      if (input?.status) {
        where.status = input.status;
      }
      if (input?.priority) {
        where.priority = input.priority;
      }
      if (input?.actionType) {
        where.actionType = input.actionType;
      }
      if (input?.userId) {
        where.userId = input.userId;
      }
      if (input?.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      return ctx.prisma.featureRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          confirmedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rejectedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          validatedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // -------------------------------------------------------
  // GET MY FEATURE REQUESTS
  // -------------------------------------------------------
  getMyRequests: tenantProcedure
    .use(hasPermission(VIEW_OWN))
    .query(async ({ ctx }) => {
      return ctx.prisma.featureRequest.findMany({
        where: {
          tenantId: ctx.tenantId,
          userId: ctx.session!.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          confirmedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rejectedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          validatedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------
  getById: tenantProcedure
    .use(hasAny([VIEW_ALL, READ_OWN]))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const featureRequest = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          confirmedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rejectedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          validatedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
      });

      if (!featureRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature request not found",
        });
      }

      // Check if user has permission to view this request
      const hasGlobalPermission = ctx.session!.user.permissions.includes(VIEW_ALL);
      const isOwner = featureRequest.userId === ctx.session!.user.id;

      if (!hasGlobalPermission && !isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this request",
        });
      }

      return featureRequest;
    }),

  // -------------------------------------------------------
  // CREATE FEATURE REQUEST
  // -------------------------------------------------------
  create: tenantProcedure
    .use(hasPermission(CREATE_REQUEST))
    .input(
      z.object({
        pageUrl: z.string().min(1, "Page URL is required"),
        pageName: z.string().min(1, "Page name is required"),
        actionType: z.enum(["ADD", "DELETE", "MODIFY"], {
          required_error: "Action type is required",
        }),
        title: z.string().min(1, "Title is required").max(200),
        description: z.string().min(10, "Description must be at least 10 characters"),
        conditions: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
        attachments: z
          .array(
            z.object({
              fileUrl: z.string(),
              fileName: z.string(),
              fileSize: z.number(),
              fileType: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { attachments, ...requestData } = input;

      // Get user role name
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session!.user.id },
        include: {
          role: {
            select: {
              displayName: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Create feature request with attachments
      const featureRequest = await ctx.prisma.featureRequest.create({
        data: {
          ...requestData,
          tenantId: ctx.tenantId,
          userId: ctx.session!.user.id,
          userRole: user.role.displayName,
          attachments: attachments
            ? {
                create: attachments.map((attachment) => ({
                  fileUrl: attachment.fileUrl,
                  fileName: attachment.fileName,
                  fileSize: attachment.fileSize,
                  fileType: attachment.fileType,
                })),
              }
            : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.FEATURE_REQUEST,
        entityId: featureRequest.id,
        entityName: featureRequest.title,
        metadata: {
          actionType: featureRequest.actionType,
          priority: featureRequest.priority,
          pageName: featureRequest.pageName,
        },
        tenantId: ctx.tenantId,
      });

      // Send notification to admins
      await notifyAdminsOfNewRequest({
        featureRequestId: featureRequest.id,
        requestTitle: featureRequest.title,
        requesterName: ctx.session!.user.name ?? ctx.session!.user.email,
        tenantId: ctx.tenantId,
      });

      return featureRequest;
    }),

  // -------------------------------------------------------
  // UPDATE STATUS (Confirm, Reject, etc.) - For developers/admins
  // -------------------------------------------------------
  updateStatus: tenantProcedure
    .use(hasAny([MANAGE_PLATFORM, UPDATE_REQUEST]))
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "SUBMITTED",
          "PENDING",
          "WAITING_FOR_CONFIRMATION",
          "DEV_COMPLETED",
          "NEEDS_REVISION",
          "VALIDATED",
          "COMPLETED",
          "REJECTED",
        ]),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, rejectionReason } = input;

      // Get existing request
      const existingRequest = await ctx.prisma.featureRequest.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!existingRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature request not found",
        });
      }

      // Validate status transitions
      if (status === "REJECTED" && !rejectionReason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Rejection reason is required when rejecting a request",
        });
      }

      // Prepare update data
      const updateData: any = {
        status,
      };

      if (status === "DEV_COMPLETED") {
        // Developer marks work as done
        updateData.confirmedBy = ctx.session!.user.id;
        updateData.confirmedAt = new Date();
      } else if (status === "REJECTED") {
        updateData.rejectedBy = ctx.session!.user.id;
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = rejectionReason;
      }

      // Update the request
      const updatedRequest = await ctx.prisma.featureRequest.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          confirmedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rejectedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          validatedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.FEATURE_REQUEST,
        entityId: updatedRequest.id,
        entityName: updatedRequest.title,
        metadata: {
          oldStatus: existingRequest.status,
          newStatus: status,
          rejectionReason,
        },
        tenantId: ctx.tenantId,
      });

      // Send notification to requester (only if userId exists)
      if (updatedRequest.userId) {
        await notifyRequesterOfStatusChange({
          featureRequestId: updatedRequest.id,
          requestTitle: updatedRequest.title,
          status,
          rejectionReason,
          userId: updatedRequest.userId,
          tenantId: ctx.tenantId,
        });
      }

      return updatedRequest;
    }),

  // -------------------------------------------------------
  // UPDATE FEATURE REQUEST
  // -------------------------------------------------------
  update: tenantProcedure
    .use(hasPermission(UPDATE_REQUEST))
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        conditions: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const updatedRequest = await ctx.prisma.featureRequest.update({
        where: { id, tenantId: ctx.tenantId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.FEATURE_REQUEST,
        entityId: updatedRequest.id,
        entityName: updatedRequest.title,
        metadata: { updates: updateData },
        tenantId: ctx.tenantId,
      });

      return updatedRequest;
    }),

  // -------------------------------------------------------
  // DELETE FEATURE REQUEST
  // -------------------------------------------------------
  delete: tenantProcedure
    .use(hasPermission(DELETE_REQUEST))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const featureRequest = await ctx.prisma.featureRequest.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });

      if (!featureRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature request not found",
        });
      }

      await ctx.prisma.featureRequest.delete({
        where: { id: input.id },
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.DELETE,
        entityType: AuditEntityType.FEATURE_REQUEST,
        entityId: input.id,
        entityName: featureRequest.title,
        tenantId: ctx.tenantId,
      });

      return { success: true };
    }),

  // -------------------------------------------------------
  // VALIDATE REQUEST (For requesters to validate completed work)
  // -------------------------------------------------------
  validateRequest: tenantProcedure
    .use(hasPermission(VIEW_OWN))
    .input(
      z.object({
        id: z.string(),
        action: z.enum(["VALIDATE", "REQUEST_REVISION"]),
        revisionFeedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, action, revisionFeedback } = input;

      // Get existing request
      const existingRequest = await ctx.prisma.featureRequest.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!existingRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature request not found",
        });
      }

      // Only the original requester can validate
      if (existingRequest.userId !== ctx.session!.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the original requester can validate this request",
        });
      }

      // Can only validate when status is DEV_COMPLETED
      if (existingRequest.status !== "DEV_COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only validate requests that are marked as completed by developer",
        });
      }

      // Validate revision feedback
      if (action === "REQUEST_REVISION" && !revisionFeedback?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide feedback when requesting revision",
        });
      }

      // Prepare update data
      const updateData: any = {};

      if (action === "VALIDATE") {
        updateData.status = "VALIDATED";
        updateData.validatedBy = ctx.session!.user.id;
        updateData.validatedAt = new Date();
      } else {
        // REQUEST_REVISION
        updateData.status = "NEEDS_REVISION";
        updateData.revisionFeedback = revisionFeedback;
        // Reset confirmation since it needs rework
        updateData.confirmedBy = null;
        updateData.confirmedAt = null;
      }

      // Update the request
      const updatedRequest = await ctx.prisma.featureRequest.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          confirmedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rejectedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          validatedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name ?? "Unknown",
        userRole: ctx.session!.user.roleName,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.FEATURE_REQUEST,
        entityId: updatedRequest.id,
        entityName: updatedRequest.title,
        metadata: {
          oldStatus: existingRequest.status,
          newStatus: updateData.status,
          action,
          revisionFeedback,
        },
        tenantId: ctx.tenantId,
      });

      // Send notification to requester about status change (only if userId exists)
      if (updatedRequest.userId) {
        await notifyRequesterOfStatusChange({
          featureRequestId: updatedRequest.id,
          requestTitle: updatedRequest.title,
          status: updateData.status,
          rejectionReason: undefined,
          userId: updatedRequest.userId,
          tenantId: ctx.tenantId,
        });
      }

      return updatedRequest;
    }),
});
