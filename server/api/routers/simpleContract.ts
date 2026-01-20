/**
 * tRPC Router for simplified MSA/SOW contract system
 * 
 * This router implements a simplified contract creation and management workflow:
 * - MSA/SOW creation with PDF upload in a single step
 * - Workflow: draft → pending_admin_review → completed → active
 * - Minimal participant management (auto-creation)
 * - Signed version upload
 * - Optimized listing with filters
 * 
 * @author Payroll SaaS Team
 * @date 2024-11-28
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure, hasPermission, hasAnyPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import { uploadFile, deleteFile } from "@/lib/s3";

// Validators
import {
  createSimpleMSASchema,
  createSimpleSOWSchema,
  submitForReviewSchema,
  adminApproveSchema,
  adminRejectSchema,
  uploadSignedVersionSchema,
  activateContractSchema,
  updateSimpleContractSchema,
  listSimpleContractsSchema,
  getSimpleContractByIdSchema,
  deleteDraftContractSchema,
  createNormContractSchema,
  updateNormContractSchema,
  contractorSignContractSchema,
  addParticipantSchema,
  removeParticipantSchema,
  listParticipantsSchema,
  uploadDocumentSchema,
  listDocumentsSchema,
  deleteDocumentSchema,
  downloadDocumentSchema,
} from "@/server/validators/simpleContract";

// Helpers
import { generateContractTitle } from "@/server/helpers/contracts/generateContractTitle";
import { createMinimalParticipant } from "@/server/helpers/contracts/createMinimalParticipant";
import { validateParentMSA } from "@/server/helpers/contracts/validateParentMSA";
import { isDraft } from "@/server/helpers/contracts/simpleWorkflowTransitions";
import {
  canModifyContract,
  canUploadDocument,
  canDeleteDocument,
  canViewContract,
  isContractParticipant,
} from "@/server/helpers/contracts/contractPermissions";
import {
  validateParticipantAddition,
  canRemoveParticipant,
  createAdditionalParticipants,
} from "@/server/helpers/contracts/participantHelpers";

// ============================================================================
// PERMISSIONS
// ============================================================================

const P = {
  CONTRACT: {
    LIST_GLOBAL:   "contract.list.global",
    READ_OWN:      "contract.read.own",
    CREATE_GLOBAL: "contract.create.global",
    UPDATE_OWN:    "contract.update.own",
    UPDATE_GLOBAL: "contract.update.global",
    DELETE_GLOBAL: "contract.delete.global",
    SEND_GLOBAL:   "contract.send.global",
    SIGN_OWN:      "contract.sign.own",
    APPROVE_GLOBAL:"contract.approve.global",
    CANCEL_GLOBAL: "contract.cancel.global",
    EXPORT_GLOBAL: "contract.export.global",
    PARTICIPANT_GLOBAL: "contract_participant.manage.global",
  },
  MSA: {
    LIST_GLOBAL:   "contract_msa.list.global",
    CREATE_GLOBAL: "contract_msa.create.global",
    UPDATE_GLOBAL: "contract_msa.update.global",
    DELETE_GLOBAL: "contract_msa.delete.global",
  },
  SOW: {
    LIST_GLOBAL:   "contract_sow.list.global",
    CREATE_GLOBAL: "contract_sow.create.global",
    UPDATE_GLOBAL: "contract_sow.update.global",
    DELETE_GLOBAL: "contract_sow.delete.global",
  },
};

// ============================================================================
// ROUTER
// ============================================================================

export const simpleContractRouter = createTRPCRouter({
  
  // ==========================================================================
  // 1. CREATE SIMPLE MSA
  // ==========================================================================
  
  /**
   * Creates an MSA with PDF upload in one step
   * 
   * Workflow:
   * - Upload PDF to S3
   * - Automatic title generation from filename
   * - Contract creation with status "draft"
   * - Creation of linked document
   * - Optional creation of company participant
   * 
   * @permission contracts.create
   */
  createSimpleMSA: tenantProcedure
    .use(hasPermission(P.MSA.CREATE_GLOBAL))
    .input(createSimpleMSASchema)
    .mutation(async ({ ctx, input }) => {
      const { pdfBuffer, fileName, mimeType, fileSize, companyId, additionalParticipants } = input;

      try {
        // 1. Generate title from filename
        const title = generateContractTitle(fileName);

        // 2. Create MSA contract (draft)
        const contract = await ctx.prisma.contract.create({
          data: {
            tenantId: ctx.tenantId!,
            type: "msa",
            title,
            status: "draft",
            workflowStatus: "draft",
            createdBy: ctx.session!.user.id,
            assignedTo: ctx.session!.user.id,
            description: `MSA automatically created from ${fileName}`,
            startDate: new Date(),
          },
        });

        // 3. Upload PDF to S3
        const buffer = Buffer.from(pdfBuffer, "base64");
        const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v1/${fileName}`;
        const s3Key = await uploadFile(buffer, s3FileName);

        // 4. Create the linked document
        const document = await ctx.prisma.document.create({
          data: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contract.id,
            s3Key,
            fileName,
            mimeType,
            fileSize,
            uploadedBy: ctx.session!.user.id,
            category: "main_contract",
            version: 1,
            isLatestVersion: true,
            visibility: "private",
          },
        });

        // 4. Find user's company (if exists)
        const userCompany = await ctx.prisma.company.findFirst({
          where: {
            tenantId: ctx.tenantId!,
            companyUsers: {
              some: { userId: ctx.session!.user.id }
            }
          },
          select: { id: true }
        });

        // 5. Create a single participant to represent "the creating party"
        // - userId = the connected user
        // - companyId = provided or null
        // - role = creator
        // - isPrimary = always true
        await createMinimalParticipant(ctx.prisma, {
          contractId: contract.id,
          userId: ctx.session!.user.id,
          companyId: userCompany?.id ?? undefined,
          role: "creator",
          isPrimary: true,
        });

        // 5b. Create additional participants (if provided)
        if (additionalParticipants && additionalParticipants.length > 0) {
          await createAdditionalParticipants(ctx.prisma, contract.id, additionalParticipants);
        }

        // 6. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.CREATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: title,
          tenantId: ctx.tenantId!,
          metadata: {
            type: "msa",
            fileName,
            system: "simple",
            documentId: document.id,
          },
        });

        // 7. Retrieve contract with participants
        const contractData = await ctx.prisma.contract.findUnique({
          where: { id: contract.id },
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                company: { select: { id: true, name: true } },
              },
            },
          },
        });

        // 8. Retrieve linked documents (manual relation)
        const documents = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contract.id,
            isLatestVersion: true,
          },
        });

        // 9. Merge and return complete contract
        return {
          success: true,
          contract: {
            ...contractData,
            documents,
          },
        };
      } catch (error) {
        console.error("[createSimpleMSA] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create MSA",
          cause: error,
        });
      }
    }),


  // ==========================================================================
  // 2. CREATE SIMPLE SOW
  // ==========================================================================

  /**
   * Creates a SOW linked to a parent MSA with PDF upload
   * 
   * Workflow:
   * - Parent MSA validation
   * - Upload PDF to S3
   * - Automatic title generation
   * - Creation of SOW contract with "draft" status
   * - Inheritance of parent MSA fields (currency, country, etc.)
   * - Creation of linked document
   * 
   * @permission contracts.create
   */
  createSimpleSOW: tenantProcedure
  .use(hasPermission(P.CONTRACT.CREATE_GLOBAL)) // ← permission correcte
  .input(createSimpleSOWSchema)
  .mutation(async ({ ctx, input }) => {
    const { pdfBuffer, fileName, mimeType, fileSize, parentMSAId, companyId, additionalParticipants } = input;

    try {
      // 1. Validate parent MSA
      const parentMSA = await validateParentMSA(
        ctx.prisma,
        parentMSAId,
        ctx.tenantId!
      );

      // 2. Generate title from filename
      const title = generateContractTitle(fileName);

      // 3. Create SOW contract (inherit from parent)
      const contract = await ctx.prisma.contract.create({
        data: {
          tenantId: ctx.tenantId!,
          type: "sow",
          parentId: parentMSAId,
          title,
          status: "draft",
          workflowStatus: "draft",
          createdBy: ctx.session!.user.id,
          assignedTo: ctx.session!.user.id,

          // Inherit from parent
          currencyId: parentMSA.currencyId,
          contractCountryId: parentMSA.contractCountryId,

          description: `SOW automatically created from ${fileName}, linked to MSA "${parentMSA.title}"`,
          startDate: new Date(),
        },
      });

      // 4. Upload PDF to S3
      const buffer = Buffer.from(pdfBuffer, "base64");
      const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v1/${fileName}`;
      const s3Key = await uploadFile(buffer, s3FileName);

      // 5. Create the linked document
      const document = await ctx.prisma.document.create({
        data: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contract.id,
          s3Key,
          fileName,
          mimeType,
          fileSize,
          uploadedBy: ctx.session!.user.id,
          category: "main_contract",
          version: 1,
          isLatestVersion: true,
          visibility: "private",
        },
      });

      // 6. Create company participant (optional)
      const targetCompanyId =
        companyId ||
        parentMSA.participants.find((p) => p.role === "client")?.companyId;

      if (targetCompanyId) {
        await createMinimalParticipant(ctx.prisma, {
          contractId: contract.id,
          companyId: targetCompanyId ?? undefined,
          role: "client",
          isPrimary: true,
        });
      }

      // 6b. Create additional participants (if provided)
      if (additionalParticipants && additionalParticipants.length > 0) {
        await createAdditionalParticipants(ctx.prisma, contract.id, additionalParticipants);
      }

      // 7. Audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session!.user.name || ctx.session!.user.email,
        userRole: ctx.session!.user.roleName || "USER",
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: title,
        tenantId: ctx.tenantId!,
        metadata: {
          type: "sow",
          parentMSAId,
          parentMSATitle: parentMSA.title,
          fileName,
          system: "simple",
          documentId: document.id,
        },
      });

      // 8. Load contract info (without documents)
      const contractData = await ctx.prisma.contract.findUnique({
        where: { id: contract.id },
        include: {
          parent: { select: { id: true, title: true, type: true } },
          participants: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              company: { select: { id: true, name: true } },
            },
          },
        },
      });

      // 9. Load documents (manual relation)
      const documents = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contract.id,
          isLatestVersion: true,
        },
      });

      // 10. Return merged complete contract
      return {
        success: true,
        contract: {
          ...contractData,
          documents,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[createSimpleSOW] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create SOW",
        cause: error,
      });
    }
  }),


  // ==========================================================================
  // 3. SUBMIT FOR REVIEW
  // ==========================================================================

  submitForReview: tenantProcedure
  .use(
    hasAnyPermission([
      P.CONTRACT.UPDATE_GLOBAL,
      P.CONTRACT.UPDATE_OWN
    ])
  )
  .input(submitForReviewSchema)
  .mutation(async ({ ctx, input }) => {
    const { contractId, notes } = input;

    try {
      const userId = ctx.session!.user.id;
      const userPermissions = ctx.session!.user.permissions;

      const hasGlobal = userPermissions.includes(P.CONTRACT.UPDATE_GLOBAL);

      // 1️⃣ Load contract
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: contractId, tenantId: ctx.tenantId! },
        include: {
          participants: true,
          parent: { select: { id: true, title: true } },
        },
      });

      if (!contract) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Contract not found",
      });

      // 2️⃣ OWN verification
      if (!hasGlobal) {
        const isCreator = contract.createdBy === userId;
        const isParticipant = contract.participants.some(
          (p) => p.userId === userId && p.isActive
        );

        if (!isCreator && !isParticipant) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this contract",
          });
        }
      }

      // 3️⃣ Load documents
      const documents = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contractId,
          isLatestVersion: true,
        },
      });

      // 4️⃣ Check status
      if (!isDraft(contract)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft contracts can be submitted for review",
        });
      }

      // 5️⃣ Check main document
      const hasMainDocument = documents.some(
        (d) => d.category === "main_contract"
      );

      if (!hasMainDocument) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A main document must be uploaded before submission",
        });
      }

      // 6️⃣ Status update
      const updated = await ctx.prisma.contract.update({
        where: { id: contractId },
        data: {
          status: "pending_admin_review",
          workflowStatus: "pending_admin_review",
          notes: notes
            ? `${contract.notes || ""}\n\n[SOUMISSION] ${notes}`.trim()
            : contract.notes,
        },
        include: {
          participants: true,
          parent: { select: { id: true, title: true } },
        },
      });

      // 7️⃣ Reload documents
      const updatedDocuments = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contractId,
          isLatestVersion: true,
        },
      });

      // 8️⃣ Create history
      await ctx.prisma.contractStatusHistory.create({
        data: {
          contractId: contract.id,
          fromStatus: "draft",
          toStatus: "pending_admin_review",
          changedBy: userId,
          reason: notes || "Submitted for admin review",
        },
      });

      // 9️⃣ Audit log
      await createAuditLog({
        userId,
        userName: ctx.session!.user.name || ctx.session!.user.email,
        userRole: ctx.session!.user.roleName || "USER",
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title || "Untitled",
        tenantId: ctx.tenantId!,
        metadata: {
          action: "submit_for_review",
          previousStatus: "draft",
          newStatus: "pending_admin_review",
          system: "simple",
        },
      });

      return {
        success: true,
        contract: {
          ...updated,
          documents: updatedDocuments,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[submitForReview] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit for review",
        cause: error,
      });
    }
  }),


  // ==========================================================================
  // 4. ADMIN APPROVE
  // ==========================================================================

  /**
   * Approves a contract awaiting review
   * 
   * Transition: pending_admin_review → completed
   * 
   * @permission contracts.approve
   */
  adminApprove: tenantProcedure
    .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
    .input(adminApproveSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, notes } = input;

      try {
        // 1. Load contract (without documents)
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
          include: {
            participants: true,
            parent: { select: { id: true, title: true } },
          }
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contract not found",
          });
        }

        if (contract.status !== "pending_admin_review") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only contracts under review can be approved",
          });
        }

        // 2. Update → completed
        const updated = await ctx.prisma.contract.update({
          where: { id: contractId },
          data: {
            status: "completed",
            workflowStatus: "completed",
            notes: notes
              ? `${contract.notes || ""}\n\n[ADMIN APPROVAL] ${notes}`.trim()
              : contract.notes,
          },
          include: {
            participants: true,
            parent: { select: { id: true, title: true } },
          }
        });

        // 3. Load documents separately
        const documents = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contractId,
            isLatestVersion: true,
          }
        });

        // 4. Notify creator
        if (contract.createdBy) {
          await ctx.prisma.contractNotification.create({
            data: {
              contractId: contract.id,
              recipientId: contract.createdBy,                     // ✔ correct
              type: "approved",                                    // ✔ correct
              title: "Contract approved",                           // ✔ correct
              message: `Your contract "${contract.title}" has been approved by the admin`,
              // sentAt is automatic
            },
          });
        }

        // 5. Historique
        await ctx.prisma.contractStatusHistory.create({
          data: {
            contractId: contract.id,
            fromStatus: "pending_admin_review",
            toStatus: "completed",
            changedBy: ctx.session!.user.id,
            reason: notes || "Approved by admin",
          },
        });

        // 6. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.APPROVE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: contract.title || "Untitled",
          tenantId: ctx.tenantId!,
          metadata: {
            action: "admin_approve",
            previousStatus: "pending_admin_review",
            newStatus: "completed",
            system: "simple",
          },
        });

        return {
          success: true,
          contract: {
            ...updated,
            documents,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[adminApprove] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Approval failed",
          cause: error,
        });
      }
    }),


  // ==========================================================================
  // 5. ADMIN REJECT
  // ==========================================================================

  /**
   * Rejects a contract awaiting review and returns it to draft
   * 
   * Transition: pending_admin_review → draft
   * 
   * @permission contracts.approve
   */
  adminReject: tenantProcedure
  .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
  .input(adminRejectSchema)
  .mutation(async ({ ctx, input }) => {
    const { contractId, reason } = input;

    try {
      // 1. Retrieve contract
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: contractId, tenantId: ctx.tenantId! },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      // 2. Validation statut
      if (contract.status !== "pending_admin_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only contracts under review can be rejected",
        });
      }

      // 3. Update → return to draft
      const updated = await ctx.prisma.contract.update({
        where: { id: contractId },
        data: {
          status: "draft",
          workflowStatus: "draft",
          notes: `${contract.notes || ""}\n\n[ADMIN REJECTION] ${reason}`.trim(),
        },
        include: {
          participants: true,
          parent: { select: { id: true, title: true } },
        },
      });

      // 4. Notification to creator
      if (contract.createdBy) {
        await ctx.prisma.contractNotification.create({
          data: {
            contractId: contract.id,
            recipientId: contract.createdBy,
            type: "rejected",
            title: "Contract rejected",
            message: `Your contract "${contract.title}" has been rejected: ${reason}`,
          },
        });
      }

      // 5. Status history (notes removed as it doesn't exist)
      await ctx.prisma.contractStatusHistory.create({
        data: {
          contractId: contract.id,
          fromStatus: "pending_admin_review",
          toStatus: "draft",
          changedBy: ctx.session!.user.id,
          reason: "Rejected by admin",
          // ❌ notes removed (doesn't exist in your model)
        },
      });

      // 6. Audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session.user.name ?? ctx.session.user.email,
        userRole: ctx.session.user.roleName,
        action: AuditAction.REJECT,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title ?? "Untitled",
        tenantId: ctx.tenantId!,
        metadata: {
          action: "admin_reject",
          previousStatus: "pending_admin_review",
          newStatus: "draft",
          reason,
          system: "simple",
        },
      });

      return {
        success: true,
        contract: updated,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[adminReject] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Rejection failed",
        cause: error,
      });
    }
  }),

  // ==========================================================================
  // 6. UPLOAD SIGNED VERSION
  // ==========================================================================
  uploadSignedVersion: tenantProcedure
    .use(hasPermission(P.CONTRACT.SIGN_OWN))
    .input(uploadSignedVersionSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, pdfBuffer, fileName, mimeType, fileSize } = input;

      try {
        // 1. Load contract (without include.documents, as the relation doesn't exist)
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contract not found",
          });
        }

        // 2. Validate status
        if (!["completed", "active"].includes(contract.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only completed/active contracts can receive a signed version",
          });
        }

        // 3. Retrieve main document via findMany
        const docs = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contract.id,
            category: "main_contract",
          },
        });

        const mainDoc = docs.find((d) => d.isLatestVersion);
        const newVersion = mainDoc ? mainDoc.version + 1 : 1;

        // 4. Upload the PDF
        const buffer = Buffer.from(pdfBuffer, "base64");
        const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v${newVersion}/${fileName}`;
        const s3Key = await uploadFile(buffer, s3FileName);

        // 5. Old version -> not latest
        if (mainDoc) {
          await ctx.prisma.document.update({
            where: { id: mainDoc.id },
            data: { isLatestVersion: false },
          });
        }

        // 6. Create new signed version
        const signedDocument = await ctx.prisma.document.create({
          data: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contract.id,
            s3Key,
            fileName,
            mimeType,
            fileSize,
            uploadedBy: ctx.session!.user.id,
            category: "main_contract",
            version: newVersion,
            isLatestVersion: true,
            visibility: "private",

            isSigned: true,
            signedAt: new Date(),
            signedBy: ctx.session!.user.id,
            parentDocumentId: mainDoc?.id || null,
          },
        });

        // 7. Update contract
        const updated = await ctx.prisma.contract.update({
          where: { id: contractId },
          data: { signedAt: new Date() },
        });

        // 8. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session.user.name ?? ctx.session.user.email,
          userRole: ctx.session.user.roleName ?? "USER",
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: contract.title ?? "Untitled",
          tenantId: ctx.tenantId!,
          metadata: {
            action: "upload_signed_version",
            documentId: signedDocument.id,
            version: newVersion,
            fileName,
            system: "simple",
          },
        });

        return {
          success: true,
          contract: updated,
          signedDocument,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[uploadSignedVersion] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Upload failed for the signed version",
          cause: error,
        });
      }
    }),


  // ==========================================================================
  // 7. ACTIVATE CONTRACT
  // ==========================================================================

  /**
   * Activates a completed contract
   * 
   * Transition: completed → active
   * 
   * @permission contracts.approve
   */
  activateContract: tenantProcedure
  .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
  .input(activateContractSchema)
  .mutation(async ({ ctx, input }) => {
    const { contractId, notes } = input;

    try {
      // 1. Load contract (without include.documents)
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: contractId, tenantId: ctx.tenantId! },
        include: {
          participants: { where: { isActive: true } },
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      // 2. Statut must be completed
      if (contract.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only completed contracts can be activated",
        });
      }

      // 3. Retrieve document(s) via findMany()
      const documents = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contract.id,
        },
      });

      const hasSignedVersion = documents.some((d) => d.isSigned);

      if (!hasSignedVersion) {
        console.warn(
          `[activateContract] Warning: Contract activation ${contractId} without signed version`
        );
      }

      // 4. Update → active
      const updated = await ctx.prisma.contract.update({
        where: { id: contractId },
        data: {
          status: "active",
          workflowStatus: "active",
          notes: notes
            ? `${contract.notes || ""}\n\n[ACTIVATION] ${notes}`.trim()
            : contract.notes,
        },
        include: {
          participants: true,
          parent: { select: { id: true, title: true } },
        },
      });

      // 5. Notifications (correction : utiliser recipientId + title)
      const recipients = [
        contract.createdBy,
        ...contract.participants.map((p) => p.userId).filter(Boolean),
      ].filter((id, i, arr) => id && arr.indexOf(id) === i) as string[];

      if (recipients.length > 0) {
        await ctx.prisma.contractNotification.createMany({
          data: recipients.map((recipientId) => ({
            contractId: contract.id,
            recipientId,
            type: "activated",
            title: "Contract activated",
            message: `The contract "${contract.title}" is now active`,
          })),
        });
      }

      // 6. History (notes removed as it does not exist)
      await ctx.prisma.contractStatusHistory.create({
        data: {
          contractId: contract.id,
          fromStatus: "completed",
          toStatus: "active",
          changedBy: ctx.session!.user.id,
          reason: "Activated by admin",
        },
      });

      // 7. Audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session.user.name ?? ctx.session.user.email,
        userRole: ctx.session.user.roleName ?? "USER",
        action: AuditAction.ACTIVATE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title ?? "Untitled",
        tenantId: ctx.tenantId!,
        metadata: {
          action: "activate_contract",
          previousStatus: "completed",
          newStatus: "active",
          hasSignedVersion,
          system: "simple",
        },
      });

      return {
        success: true,
        contract: updated,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[activateContract] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Activation failed",
        cause: error,
      });
    }
  }),

  /**
   * 7B. UPDATE SIMPLE CONTRACT
   * 
   * Allows updating the title and description of an MSA/SOW/NORM contract
   * Required: contract.update.global permission
   */
  updateSimpleContract: tenantProcedure
    .use(hasPermission(P.CONTRACT.UPDATE_GLOBAL))
    .input(updateSimpleContractSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, title, description } = input;

      try {
        // 1. Load contract
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contract not found",
          });
        }

        // 2. Build update data
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;

        // If nothing to update
        if (Object.keys(updateData).length === 0) {
          return {
            success: true,
            contract,
          };
        }

        // 3. Update contract
        const updated = await ctx.prisma.contract.update({
          where: { id: contractId },
          data: updateData,
        });

        // 4. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session.user.name ?? ctx.session.user.email,
          userRole: ctx.session.user.roleName ?? "USER",
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: contract.title ?? "Untitled",
          tenantId: ctx.tenantId!,
          metadata: {
            action: "update_simple_contract",
            fields: Object.keys(updateData),
            system: "simple",
          },
        });

        return {
          success: true,
          contract: updated,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[updateSimpleContract] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update contract",
          cause: error,
        });
      }
    }),


  // ==========================================================================
  // 8. LIST SIMPLE CONTRACTS
  // ==========================================================================

  listSimpleContracts: tenantProcedure
  .use(
    hasAnyPermission([
      P.CONTRACT.LIST_GLOBAL,
      P.CONTRACT.READ_OWN,
    ])
  )
  .input(listSimpleContractsSchema)
  .query(async ({ ctx, input }) => {
    const { type, status, search, parentMSAId, page, pageSize } = input;

    const userId = ctx.session!.user.id;
    const userPermissions = ctx.session!.user.permissions;

    const hasGlobal = userPermissions.includes(P.CONTRACT.LIST_GLOBAL);

    // Base where
    const where: any = {
      tenantId: ctx.tenantId!,
    };

    // 🧩 IF NOT LIST_GLOBAL → We limit to contracts where user participates
    if (!hasGlobal) {
      where.participants = {
        some: {
          userId,
          isActive: true
        }
      };
    }

    // Filtres
    if (type !== "all") where.type = type;
    if (status !== "all") where.status = status;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { contractReference: { contains: search, mode: "insensitive" } },
      ];
    }

    if (parentMSAId) where.parentId = parentMSAId;

    // Pagination
    const skip = (page - 1) * pageSize;

    // Query
    const [contracts, total] = await Promise.all([
      ctx.prisma.contract.findMany({
        where,
        include: {
          parent: { select: { id: true, title: true, type: true } },
          participants: {
            where: { isActive: true },
            include: {
              user: { select: { id: true, name: true, email: true } },
              company: { select: { id: true, name: true } },
            },
          },
          _count: { select: { children: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
      }),

      ctx.prisma.contract.count({ where }),
    ]);

    // Documents
    const ids = contracts.map(c => c.id);
    const docs = await ctx.prisma.document.findMany({
      where: {
        tenantId: ctx.tenantId!,
        entityType: "contract",
        entityId: { in: ids },
        category: "main_contract",
        isLatestVersion: true,
      },
      orderBy: { version: "desc" },
    });

    const contractsWithDocs = contracts.map((c) => ({
      ...c,
      documents: docs.filter((d) => d.entityId === c.id),
    }));

    return {
      contracts: contractsWithDocs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    };
  }),


  // ==========================================================================
  // 9. GET SIMPLE CONTRACT BY ID
  // ==========================================================================

  /**
   * Retrieves a contract by its ID with all its relations
   * 
   * Includes:
   * - Parent MSA (if SOW)
   * - Children SOWs (if MSA)
   * - Participants with users/companies
   * - Documents (all versions)
   * - Status history
   * 
   * @permission contracts.view
   */
  getSimpleContractById: tenantProcedure
    .use(hasPermission(P.CONTRACT.READ_OWN))
    .input(getSimpleContractByIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        // 1️⃣ Load contract WITHOUT documents
        const contract = await ctx.prisma.contract.findUnique({
          where: {
            id: input.id,
            tenantId: ctx.tenantId!,
          },
          include: {
            parent: {
              select: { id: true, title: true, type: true, status: true },
            },
            children: {
              where: { status: { notIn: ["cancelled"] } },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                title: true,
                type: true,
                status: true,
                createdAt: true,
              },
            },
            participants: {
              where: { isActive: true },
              include: {
                user: { select: { id: true, name: true, email: true } },
                company: { select: { id: true, name: true, contactEmail: true } },
              },
            },
            statusHistory: {
              orderBy: { changedAt: "desc" },
            },
            currency: {
              select: { id: true, code: true, name: true, symbol: true },
            },
            contractCountry: {
              select: { id: true, code: true, name: true },
            },
            bank: {
              select: { id: true, name: true, accountNumber: true },
            },
          },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contract not found",
          });
        }

        // 2️⃣ Load documents (all versions)
        const documents = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contract.id,
          },
          orderBy: { version: "desc" },
          include: {
            parentDocument: {
              select: { id: true, version: true },
            },
          },
        });

        // 2b. Load shared documents (ContractDocuments)
        const sharedDocuments = await ctx.prisma.contractDocument.findMany({
          where: {
            contractId: contract.id,
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            document: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                s3Key: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // 3️⃣ Enrich statusHistory to match frontend
        const enrichedStatusHistory = await Promise.all(
          contract.statusHistory.map(async (h) => {
            const user = await ctx.prisma.user.findUnique({
              where: { id: h.changedBy },
              select: { id: true, name: true, email: true },
            });

            return {
              id: h.id,
              fromStatus: h.fromStatus ?? "",
              toStatus: h.toStatus,
              createdAt: h.changedAt,     // ⬅️ FRONT REQUIERT createdAt
              reason: h.reason,
              notes: null,                // ⬅️ field required by frontend
              changedByUser: user ?? null // ⬅️ calculated addition
            };
          })
        );

        // 4️⃣ Merge + return
        return {
          ...contract,
          statusHistory: enrichedStatusHistory,
          documents,
          sharedDocuments,
        };

      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[getSimpleContractById] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve contract",
          cause: error,
        });
      }
    }),

  // ==========================================================================
  // 10. DELETE DRAFT CONTRACT
  // ==========================================================================

  /**
   * Deletes a draft contract only
   * 
   * Security:
   * - Only draft contracts can be deleted
   * - MSAs with linked SOWs cannot be deleted
   * - S3 documents are deleted in cascade
   * 
   * @permission contracts.delete
   */
  deleteDraftContract: tenantProcedure
  .use(hasPermission(P.CONTRACT.DELETE_GLOBAL))
  .input(deleteDraftContractSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      // 1️⃣ Load contract (without include.documents)
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: input.id, tenantId: ctx.tenantId! },
        include: { children: true },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      // 2️⃣ Check status
      if (!isDraft(contract)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft contracts can be deleted",
        });
      }

      // 3️⃣ Check SOW children
      if (contract.type === "msa" && contract.children.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete an MSA that has linked SOWs",
        });
      }

      // 4️⃣ Load associated documents
      const documents = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contract.id,
        },
      });

      // 5️⃣ Delete associated S3 files
      for (const doc of documents) {
        try {
          await deleteFile(doc.s3Key);
        } catch (err) {
          console.error(
            `[deleteDraftContract] Failed to delete S3 file ${doc.s3Key}:`,
            err
          );
        }
      }

      // 6️⃣ Delete documents from DB
      await ctx.prisma.document.deleteMany({
        where: { entityId: contract.id, entityType: "contract" },
      });

      // 7️⃣ Delete contract
      await ctx.prisma.contract.delete({
        where: { id: input.id },
      });

      // 8️⃣ Audit log
      await createAuditLog({
        userId: ctx.session!.user.id,
        userName: ctx.session.user.name || ctx.session.user.email,
        userRole: ctx.session.user.roleName || "USER",
        action: AuditAction.DELETE,
        entityType: AuditEntityType.CONTRACT,
        entityId: contract.id,
        entityName: contract.title || "Untitled",
        tenantId: ctx.tenantId!,
        metadata: {
          type: contract.type,
          system: "simple",
        },
      });

      return {
        success: true,
        message: "Contract deleted successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[deleteDraftContract] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Deletion failed",
        cause: error,
      });
    }
  }),

  // ==========================================================================
  // 11. CREATE NORM CONTRACT
  // ==========================================================================

  /**
   * Creates a NORM contract (Normal Contract) with PDF upload
   *
   * Workflow:
   * - Upload PDF to S3
   * - Create contract with "draft" status
   * - Create participants: companyTenant, agency, contractor (+ payroll)
   * - Handle salaryType logic (gross, payroll, split)
   * - Link main contract document
   *
   * @permission contract_norm.create
   */
  createNormContract: tenantProcedure
    .use(hasPermission(P.CONTRACT.CREATE_GLOBAL))
    .input(createNormContractSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        pdfBuffer,
        fileName,
        mimeType,
        fileSize,

        companyTenantId,
        agencyId,
        contractorId,

        startDate,
        endDate,

        salaryType,
        userBankId,
        payrollUserId,
        userBankIds,

        rateAmount,
        rateCurrency,
        rateCycle,

        marginAmount,
        marginCurrency,
        marginType,
        marginPaidBy,
        invoiceDueTerm,

        notes,
        contractReference,
        contractVatRate,
        contractCountryId,
        clientAgencySignDate,

        additionalParticipants,
      } = input;

      try {
        // -------------------------------
        // 1. Generate title from filename
        // -------------------------------
        const title = generateContractTitle(fileName);

        // -------------------------------
        // 2. Convert currency code → ID
        // -------------------------------
        let currencyId: string | null = null;

        if (rateCurrency) {
          const currency = await ctx.prisma.currency.findFirst({
            where: { code: rateCurrency },
            select: { id: true },
          });

          currencyId = currency?.id ?? null;
        }

        // -------------------------------
        // 3. Create the contract
        // -------------------------------
        const contract = await ctx.prisma.contract.create({
          data: {
            tenantId: ctx.tenantId!,
            type: "norm",
            title,
            status: "draft",
            workflowStatus: "draft",
            createdBy: ctx.session!.user.id,
            assignedTo: ctx.session!.user.id,
            description: `NORM contract automatically created from ${fileName}`,

            // Dates
            startDate,
            endDate,

            // Salary type logic
            salaryType,
            payrollUserId,
            userBankIds: userBankIds || [],
            bankId: userBankId || null,

            // Rate
            rate: rateAmount,
            rateCycle,
            currencyId,

            // Margin
            margin: marginAmount,
            marginType,
            marginPaidBy,

            // 🔥 NEW: Invoice Due Term
            invoiceDueTerm,

            // Other fields
            notes,
            contractReference,
            contractVatRate,
            contractCountryId,
            signedAt: clientAgencySignDate,
          },
        });

        // -------------------------------
        // 4. Upload PDF to S3
        // -------------------------------
        const buffer = Buffer.from(pdfBuffer, "base64");
        const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v1/${fileName}`;
        const s3Key = await uploadFile(buffer, s3FileName);

        // -------------------------------
        // 5. Create linked document
        // -------------------------------
        const document = await ctx.prisma.document.create({
          data: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contract.id,
            s3Key,
            fileName,
            mimeType,
            fileSize,
            uploadedBy: ctx.session!.user.id,
            category: "main_contract",
            version: 1,
            isLatestVersion: true,
            visibility: "private",
          },
        });

        // -------------------------------
        // 6. Create Participants
        // -------------------------------

        // Company Tenant
        await createMinimalParticipant(ctx.prisma, {
          contractId: contract.id,
          companyId: companyTenantId,
          role: "tenant",
          isPrimary: true,
        });

        // Agency
        await createMinimalParticipant(ctx.prisma, {
          contractId: contract.id,
          userId: agencyId,
          role: "agency",
          isPrimary: false,
        });

        // Contractor
        await createMinimalParticipant(ctx.prisma, {
          contractId: contract.id,
          userId: contractorId,
          role: "contractor",
          isPrimary: false,
        });

        // Payroll User (optional)
        if ((salaryType === "payroll" || salaryType === "payroll_we_pay") && payrollUserId) {
          await createMinimalParticipant(ctx.prisma, {
            contractId: contract.id,
            userId: payrollUserId,
            role: "payroll",
            isPrimary: false,
          });
        }

        // Additional participants (optional)
        if (additionalParticipants?.length > 0) {
          await createAdditionalParticipants(ctx.prisma, contract.id, additionalParticipants);
        }

        // -------------------------------
        // 7. Audit Log
        // -------------------------------
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.CREATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: title,
          tenantId: ctx.tenantId!,
          metadata: {
            type: "norm",
            fileName,
            salaryType,
            system: "simple",
            documentId: document.id,
          },
        });

        // -------------------------------
        // 8. Fetch contract full data
        // -------------------------------
        const contractData = await ctx.prisma.contract.findUnique({
          where: { id: contract.id },
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                company: { select: { id: true, name: true } },
              },
            },
          },
        });

        const documents = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contract.id,
            isLatestVersion: true,
          },
        });

        return {
          success: true,
          contract: { ...contractData, documents },
        };
      } catch (error) {
        console.error("[createNormContract] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create NORM contract",
          cause: error,
        });
      }
    }),

  // ==========================================================================
  // 12. UPDATE NORM CONTRACT
  // ==========================================================================

  /**
   * Updates a NORM contract in draft
   * 
   * Only draft contracts can be modified
   * 
   * @permission contract_norm.update
   */
  updateNormContract: tenantProcedure
    .use(hasPermission(P.CONTRACT.UPDATE_GLOBAL))
    .input(updateNormContractSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, ...updateData } = input;

      try {
        // 1. Load contract
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contract not found",
          });
        }

        // 2. Verify contract is in draft
        if (!isDraft(contract)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only draft contracts can be modified",
          });
        }

        // 3. Verify it's a NORM contract
        if (contract.type !== "norm") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only NORM contracts can be updated via this endpoint",
          });
        }

        // 4. Prepare update data
        const dataToUpdate: any = {};

        // Dates
        if (updateData.startDate) dataToUpdate.startDate = updateData.startDate;
        if (updateData.endDate) dataToUpdate.endDate = updateData.endDate;

        // Salary type and payment
        if (updateData.salaryType) dataToUpdate.salaryType = updateData.salaryType;
        if (updateData.payrollUserId !== undefined) dataToUpdate.payrollUserId = updateData.payrollUserId;
        if (updateData.userBankIds !== undefined) dataToUpdate.userBankIds = updateData.userBankIds;
        if (updateData.userBankId !== undefined) dataToUpdate.bankId = updateData.userBankId;

        // Tarification
        if (updateData.rateAmount !== undefined) dataToUpdate.rate = updateData.rateAmount;
        if (updateData.rateCurrency !== undefined) dataToUpdate.currencyId = updateData.rateCurrency;
        if (updateData.rateCycle !== undefined) dataToUpdate.rateCycle = updateData.rateCycle;

        // Marge
        if (updateData.marginAmount !== undefined) dataToUpdate.margin = updateData.marginAmount;
        if (updateData.marginType !== undefined) dataToUpdate.marginType = updateData.marginType;
        if (updateData.marginPaidBy !== undefined) dataToUpdate.marginPaidBy = updateData.marginPaidBy;

        // Others
        if (updateData.invoiceDueDays !== undefined) dataToUpdate.invoiceDueDays = updateData.invoiceDueDays;
        if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;
        if (updateData.contractReference !== undefined) dataToUpdate.contractReference = updateData.contractReference;
        if (updateData.contractVatRate !== undefined) dataToUpdate.contractVatRate = updateData.contractVatRate;
        if (updateData.contractCountryId !== undefined) dataToUpdate.contractCountryId = updateData.contractCountryId;
        if (updateData.clientAgencySignDate !== undefined) dataToUpdate.signedAt = updateData.clientAgencySignDate;

        // 5. Update contract
        const updated = await ctx.prisma.contract.update({
          where: { id: contractId },
          data: dataToUpdate,
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                company: { select: { id: true, name: true } },
              },
            },
          },
        });

        // 5b. Handle payroll participant update if necessary
        if (updateData.payrollUserId !== undefined) {
          // Delete old payroll participant
          await ctx.prisma.contractParticipant.deleteMany({
            where: {
              contractId,
              role: "payroll",
            },
          });

          // Create new payroll participant if payrollUserId is provided
          if (updateData.payrollUserId && (updated.salaryType === "payroll" || updated.salaryType === "payroll_we_pay")) {
            await createMinimalParticipant(ctx.prisma, {
              contractId,
              userId: updateData.payrollUserId,
              role: "payroll",
              isPrimary: false,
            });
          }
        }

        // 6. Load documents
        const documents = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contractId,
            isLatestVersion: true,
          },
        });

        // 7. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: contract.title || "Untitled",
          tenantId: ctx.tenantId!,
          metadata: {
            action: "update_norm_contract",
            type: "norm",
            system: "simple",
          },
        });

        return {
          success: true,
          contract: {
            ...updated,
            documents,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[updateNormContract] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update NORM contract",
          cause: error,
        });
      }
    }),

  // ==========================================================================
  // 13. CONTRACTOR SIGN CONTRACT
  // ==========================================================================

  /**
   * Allows contractor to sign their NORM contract
   * 
   * Updates the contractorSignedAt field
   * 
   * @permission contract.sign.own
   */
  contractorSignContract: tenantProcedure
    .use(hasPermission(P.CONTRACT.SIGN_OWN))
    .input(contractorSignContractSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, signatureDate } = input;

      try {
        // 1. Load contract
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
          include: {
            participants: {
              where: { role: "contractor", isActive: true },
            },
          },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contract not found",
          });
        }

        // 2. Verify it's a NORM contract
        if (contract.type !== "norm") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only NORM contracts can be signed via this endpoint",
          });
        }

        // 3. Verify user is the contractor
        const contractorParticipant = contract.participants.find(
          (p) => p.userId === ctx.session!.user.id
        );

        if (!contractorParticipant) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to sign this contract",
          });
        }

        // 4. Verify contract is not already signed
        if (contract.contractorSignedAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This contract has already been signed by the contractor",
          });
        }

        // 5. Update signature date
        const updated = await ctx.prisma.contract.update({
          where: { id: contractId },
          data: {
            contractorSignedAt: signatureDate || new Date(),
          },
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                company: { select: { id: true, name: true } },
              },
            },
          },
        });

        // 6. Load documents
        const documents = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contractId,
            isLatestVersion: true,
          },
        });

        // 7. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: contract.title || "Untitled",
          tenantId: ctx.tenantId!,
          metadata: {
            action: "contractor_sign_contract",
            type: "norm",
            system: "simple",
          },
        });

        return {
          success: true,
          contract: {
            ...updated,
            documents,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[contractorSignContract] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sign contract",
          cause: error,
        });
      }
    }),

  // ============================================================================
  // PARTICIPANT MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * ADD PARTICIPANT
   * 
   * Add an additional participant to an existing contract.
   * 
   * Permissions:
   * - contract.update.global: can add to any contract
   * - contract.update.own: can add to own contracts
   * 
   * Validation:
   * - Contract must be in draft or pending
   * - At least userId or companyId must be provided
   * - User/company must exist
   */
  addParticipant: tenantProcedure
    .input(addParticipantSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { contractId, userId, companyId, role } = input;
        const userPermissions = ctx.session!.user.permissions || [];

        // 1. Check permissions
        const canModify = await canModifyContract(
          ctx.prisma,
          contractId,
          ctx.session!.user.id,
          userPermissions
        );

        if (!canModify) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to modify this contract",
          });
        }

        // 2. Validate participant addition
        await validateParticipantAddition(ctx.prisma, contractId, userId, companyId);

        // 3. Check if participant already exists
        const existingParticipant = await ctx.prisma.contractParticipant.findFirst({
          where: {
            contractId,
            ...(userId && { userId }),
            ...(companyId && { companyId }),
            role,
          },
        });

        if (existingParticipant) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This participant already exists for this contract",
          });
        }

        // 4. Create participant
        const participant = await ctx.prisma.contractParticipant.create({
          data: {
            contractId,
            userId: userId || null,
            companyId: companyId || null,
            role,
            isPrimary: false,
            requiresSignature: false,
            approved: false,
            isActive: true,
            joinedAt: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // 5. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.CREATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contractId,
          entityName: "Contract Participant",
          tenantId: ctx.tenantId!,
          metadata: {
            action: "add_participant",
            participantId: participant.id,
            userId,
            companyId,
            role,
          },
        });

        return {
          success: true,
          participant,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[addParticipant] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add participant",
          cause: error,
        });
      }
    }),

  /**
   * REMOVE PARTICIPANT
   * 
   * Remove a participant from a contract.
   * 
   * Permissions:
   * - contract.update.global: can remove from any contract
   * - contract.update.own: can remove from own contracts
   * 
   * Restrictions:
   * - Main participants (company_tenant, agency, contractor) cannot be removed
   * - Contract must be in draft or pending
   */
  removeParticipant: tenantProcedure
    .input(removeParticipantSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { participantId } = input;
        const userPermissions = ctx.session!.user.permissions || [];

        // 1. Retrieve participant
        const participant = await ctx.prisma.contractParticipant.findUnique({
          where: { id: participantId },
          include: {
            contract: {
              select: {
                id: true,
                workflowStatus: true,
              },
            },
          },
        });

        if (!participant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Participant not found",
          });
        }

        // 2. Check permissions
        const canModify = await canModifyContract(
          ctx.prisma,
          participant.contractId,
          ctx.session!.user.id,
          userPermissions
        );

        if (!canModify) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to modify this contract",
          });
        }

        // 3. Verify contract is not completed/active
        if (
          participant.contract.workflowStatus === "completed" ||
          participant.contract.workflowStatus === "active"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove participants from a completed or active contract",
          });
        }

        // 4. Verify it's not a main participant
        if (!canRemoveParticipant(participant.role)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove a main participant (company_tenant, agency, contractor)",
          });
        }

        // 5. Remove participant
        await ctx.prisma.contractParticipant.delete({
          where: { id: participantId },
        });

        // 6. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.DELETE,
          entityType: AuditEntityType.CONTRACT,
          entityId: participant.contractId,
          entityName: "Contract Participant",
          tenantId: ctx.tenantId!,
          metadata: {
            action: "remove_participant",
            participantId,
            role: participant.role,
          },
        });

        return {
          success: true,
          message: "Participant removed successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[removeParticipant] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove participant",
          cause: error,
        });
      }
    }),

  /**
   * LIST PARTICIPANTS
   * 
   * List all participants of a contract.
   * 
   * Permissions:
   * - contract.read.global: can list participants of all contracts
   * - contract.read.own: can list participants of own contracts
   */
  listParticipants: tenantProcedure
    .input(listParticipantsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const { contractId } = input;
        const userPermissions = ctx.session!.user.permissions || [];

        // 1. Verify user can view this contract
        const canView = await canViewContract(
          ctx.prisma,
          contractId,
          ctx.session!.user.id,
          userPermissions
        );

        if (!canView) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view this contract",
          });
        }

        // 2. Retrieve all participants
        const participants = await ctx.prisma.contractParticipant.findMany({
          where: {
            contractId,
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                contactPhone: true,
              },
            },
          },
          orderBy: [
            { isPrimary: "desc" },
            { createdAt: "asc" },
          ],
        });

        return {
          success: true,
          participants,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[listParticipants] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve participants",
          cause: error,
        });
      }
    }),

  // ============================================================================
  // DOCUMENT MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * UPLOAD DOCUMENT
   * 
   * Upload a shared document for a contract.
   * All participants can upload documents.
   * 
   * Permissions:
   * - Be a participant of the contract
   * - Contract must not be "completed" or "active"
   * - Exception: contract.update.global can always upload
   */
  uploadDocument: tenantProcedure
    .input(uploadDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { contractId, pdfBuffer, fileName, mimeType, fileSize, description, category, notes } = input;
        const userPermissions = ctx.session!.user.permissions || [];

        // 1. Verify user can upload
        const canUpload = await canUploadDocument(
          ctx.prisma,
          contractId,
          ctx.session!.user.id,
          userPermissions
        );

        if (!canUpload) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to upload documents for this contract",
          });
        }

        // 2. Verify contract exists
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId },
          select: {
            id: true,
            title: true,
            workflowStatus: true,
          },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contract not found",
          });
        }

        // 3. Upload file to S3
        const buffer = Buffer.from(pdfBuffer, "base64");
        const s3FileName = `contracts/${contractId}/documents/${Date.now()}-${fileName}`;
        
        const s3Key = await uploadFile(buffer, s3FileName, mimeType);

        // 4. Create Document entry
        const document = await ctx.prisma.document.create({
          data: {
            tenantId: ctx.tenantId!,
            entityType: "contract_document",
            entityId: contractId,
            s3Key,
            fileName,
            mimeType,
            fileSize,
            description,
            category,
            uploadedBy: ctx.session!.user.id,
            uploadedAt: new Date(),
          },
        });

        // 5. Create ContractDocument entry
        const contractDocument = await ctx.prisma.contractDocument.create({
          data: {
            contractId,
            uploadedByUserId: ctx.session!.user.id,
            documentId: document.id,
            description,
            category,
            notes: notes || null,
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            document: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                createdAt: true,
              },
            },
          },
        });

        // 6. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.CREATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contractId,
          entityName: `Contract Document - ${fileName}`,
          tenantId: ctx.tenantId!,
          metadata: {
            action: "upload_document",
            documentId: document.id,
            contractDocumentId: contractDocument.id,
            fileName,
            category,
          },
        });

        return {
          success: true,
          document: contractDocument,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[uploadDocument] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload document",
          cause: error,
        });
      }
    }),

  /**
   * LIST DOCUMENTS
   * 
   * List all shared documents of a contract.
   * All participants can view documents.
   * 
   * Permissions:
   * - Be a participant of the contract OR have contract.read.global
   */
  listDocuments: tenantProcedure
    .input(listDocumentsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const { contractId } = input;
        const userPermissions = ctx.session!.user.permissions || [];

        // 1. Verify user can view this contract
        const canView = await canViewContract(
          ctx.prisma,
          contractId,
          ctx.session!.user.id,
          userPermissions
        );

        if (!canView) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view this contract",
          });
        }

        // 2. Retrieve all documents
        const documents = await ctx.prisma.contractDocument.findMany({
          where: {
            contractId,
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            document: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                s3Key: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          success: true,
          documents,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[listDocuments] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve documents",
          cause: error,
        });
      }
    }),

  /**
   * DELETE DOCUMENT
   * 
   * Delete a shared document.
   * Only the uploader or an admin (contract.update.global) can delete.
   * 
   * Permissions:
   * - Be the document uploader OR have contract.update.global
   * - Contract must not be "completed" or "active"
   */
  deleteDocument: tenantProcedure
    .input(deleteDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { documentId } = input;
        const userPermissions = ctx.session!.user.permissions || [];

        // 1. Retrieve document
        const contractDocument = await ctx.prisma.contractDocument.findUnique({
          where: { id: documentId },
          include: {
            document: {
              select: {
                id: true,
                s3Key: true,
                fileName: true,
              },
            },
            contract: {
              select: {
                id: true,
                workflowStatus: true,
              },
            },
          },
        });

        if (!contractDocument) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        // 2. Check permissions
        const canDelete = await canDeleteDocument(
          ctx.prisma,
          documentId,
          ctx.session!.user.id,
          userPermissions
        );

        if (!canDelete) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this document",
          });
        }

        // 3. Delete file from S3
        try {
          await deleteFile(contractDocument.document.s3Key);
        } catch (s3Error) {
          console.error("[deleteDocument] S3 deletion error:", s3Error);
        }

        // 4. Delete Document entry first
        await ctx.prisma.document.deleteMany({
          where: { id: contractDocument.documentId },
        });

        // 5. Delete ContractDocument entry next
        await ctx.prisma.contractDocument.deleteMany({
          where: { id: documentId },
        });


        // 6. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.DELETE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contractDocument.contractId,
          entityName: `Contract Document - ${contractDocument.document.fileName}`,
          tenantId: ctx.tenantId!,
          metadata: {
            action: "delete_document",
            documentId: contractDocument.documentId,
            contractDocumentId: documentId,
            fileName: contractDocument.document.fileName,
          },
        });

        return {
          success: true,
          message: "Document deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[deleteDocument] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete document",
          cause: error,
        });
      }
    }),

  /**
   * DOWNLOAD DOCUMENT
   * 
   * Get signed URL to download a document.
   * All participants can download documents.
   * 
   * Permissions:
   * - Be a participant of the contract OR have contract.read.global
   */
  downloadDocument: tenantProcedure
    .input(downloadDocumentSchema)
    .query(async ({ ctx, input }) => {
      try {
        const { documentId } = input;
        const userPermissions = ctx.session!.user.permissions || [];

        // 1. Retrieve document
        const contractDocument = await ctx.prisma.contractDocument.findUnique({
          where: { id: documentId },
          include: {
            document: {
              select: {
                id: true,
                s3Key: true,
                fileName: true,
                mimeType: true,
              },
            },
          },
        });

        if (!contractDocument) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        // 2. Verify user can view this contract
        const canView = await canViewContract(
          ctx.prisma,
          contractDocument.contractId,
          ctx.session!.user.id,
          userPermissions
        );

        if (!canView) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to download this document",
          });
        }

        // 3. Generate signed URL (use existing function or generate manually)
        // For now, we just return document info
        // Frontend will use document.getSignedUrl with document ID

        return {
          success: true,
          document: {
            id: contractDocument.document.id,
            fileName: contractDocument.document.fileName,
            mimeType: contractDocument.document.mimeType,
            s3Key: contractDocument.document.s3Key,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[downloadDocument] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve document",
          cause: error,
        });
      }
    }),

  // ============================================================================
  // UTILITY ENDPOINTS
  // ============================================================================

  /**
   * GET USER COMPANY
   * 
   * Retrieves the company associated with a user.
   * Useful for "link user's company" feature.
   * 
   * Permissions:
   * - Accessible to all authenticated users
   */
  getUserCompany: tenantProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { userId } = input;

        // Find an active CompanyUser for this user
        const companyUser = await ctx.prisma.companyUser.findFirst({
          where: {
            userId,
            isActive: true,
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                contactPhone: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc", // Take the most recent if multiple
          },
        });

        return {
          success: true,
          company: companyUser?.company || null,
        };
      } catch (error) {
        console.error("[getUserCompany] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve company",
          cause: error,
        });
      }
    }),

});
