/**
 * Router tRPC pour le système simplifié de contrats MSA/SOW
 * 
 * Ce router implémente un workflow simplifié de création et gestion de contrats :
 * - Création MSA/SOW avec upload PDF en une seule étape
 * - Workflow: draft → pending_admin_review → completed → active
 * - Gestion minimale des participants (auto-création)
 * - Upload de versions signées
 * - Listing avec filtres optimisés
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
  listSimpleContractsSchema,
  getSimpleContractByIdSchema,
  deleteDraftContractSchema,
} from "@/server/validators/simpleContract";

// Helpers
import { generateContractTitle } from "@/server/helpers/contracts/generateContractTitle";
import { createMinimalParticipant } from "@/server/helpers/contracts/createMinimalParticipant";
import { validateParentMSA } from "@/server/helpers/contracts/validateParentMSA";
import { isDraft } from "@/server/helpers/contracts/simpleWorkflowTransitions";

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
   * Crée un MSA avec upload PDF en une seule étape
   * 
   * Workflow:
   * - Upload PDF vers S3
   * - Génération automatique du titre depuis le nom du fichier
   * - Création du contrat avec statut "draft"
   * - Création du document lié
   * - Création optionnelle d'un participant company
   * 
   * @permission contracts.create
   */
  createSimpleMSA: tenantProcedure
    .use(hasPermission(P.MSA.CREATE_GLOBAL))
    .input(createSimpleMSASchema)
    .mutation(async ({ ctx, input }) => {
      const { pdfBuffer, fileName, mimeType, fileSize, companyId } = input;

      try {
        // 1. Générer titre depuis filename
        const title = generateContractTitle(fileName);

        // 2. Créer le contrat MSA (draft)
        const contract = await ctx.prisma.contract.create({
          data: {
            tenantId: ctx.tenantId!,
            type: "msa",
            title,
            status: "draft",
            workflowStatus: "draft",
            createdBy: ctx.session!.user.id,
            assignedTo: ctx.session!.user.id,
            description: `MSA créé automatiquement depuis ${fileName}`,
            startDate: new Date(),
          },
        });

        // 3. Upload PDF vers S3
        const buffer = Buffer.from(pdfBuffer, "base64");
        const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v1/${fileName}`;
        const s3Key = await uploadFile(buffer, s3FileName);

        // 4. Créer le document lié
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

        // 5. Créer participant company (optionnel)
        if (companyId) {
          await createMinimalParticipant(ctx.prisma, {
            contractId: contract.id,
            companyId,
            role: "client",
            isPrimary: true,
          });
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

        // 7. Récupérer le contrat avec participants
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

        // 8. Récupérer les documents liés (relation manuelle)
        const documents = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contract.id,
            isLatestVersion: true,
          },
        });

        // 9. Fusionner et retourner le contrat complet
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
          message: "Échec de la création du MSA",
          cause: error,
        });
      }
    }),


  // ==========================================================================
  // 2. CREATE SIMPLE SOW
  // ==========================================================================

  /**
   * Crée un SOW lié à un MSA parent avec upload PDF
   * 
   * Workflow:
   * - Validation du MSA parent
   * - Upload PDF vers S3
   * - Génération automatique du titre
   * - Création du contrat SOW avec statut "draft"
   * - Héritage des champs du MSA parent (currency, country, etc.)
   * - Création du document lié
   * 
   * @permission contracts.create
   */
  createSimpleSOW: tenantProcedure
  .use(hasPermission(P.CONTRACT.CREATE_GLOBAL)) // ← permission correcte
  .input(createSimpleSOWSchema)
  .mutation(async ({ ctx, input }) => {
    const { pdfBuffer, fileName, mimeType, fileSize, parentMSAId, companyId } = input;

    try {
      // 1. Valider le MSA parent
      const parentMSA = await validateParentMSA(
        ctx.prisma,
        parentMSAId,
        ctx.tenantId!
      );

      // 2. Générer titre depuis filename
      const title = generateContractTitle(fileName);

      // 3. Créer le contrat SOW (hériter du parent)
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

          // Hériter du parent
          currencyId: parentMSA.currencyId,
          contractCountryId: parentMSA.contractCountryId,

          description: `SOW créé automatiquement depuis ${fileName}, lié au MSA "${parentMSA.title}"`,
          startDate: new Date(),
        },
      });

      // 4. Upload PDF vers S3
      const buffer = Buffer.from(pdfBuffer, "base64");
      const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v1/${fileName}`;
      const s3Key = await uploadFile(buffer, s3FileName);

      // 5. Créer le document lié
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

      // 6. Créer participant company (optionnel)
      const targetCompanyId =
        companyId ||
        parentMSA.participants.find((p) => p.role === "client")?.companyId;

      if (targetCompanyId) {
        await createMinimalParticipant(ctx.prisma, {
          contractId: contract.id,
          companyId: targetCompanyId,
          role: "client",
          isPrimary: true,
        });
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

      // 8. Charger les infos du contrat (sans documents)
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

      // 9. Charger les documents (relation manuelle)
      const documents = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contract.id,
          isLatestVersion: true,
        },
      });

      // 10. Retourner le contrat complet fusionné
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
        message: "Échec de la création du SOW",
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

      // 1️⃣ Charger le contrat
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: contractId, tenantId: ctx.tenantId! },
        include: {
          participants: true,
          parent: { select: { id: true, title: true } },
        },
      });

      if (!contract) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Contrat introuvable",
      });

      // 2️⃣ Vérification OWN
      if (!hasGlobal) {
        const isCreator = contract.createdBy === userId;
        const isParticipant = contract.participants.some(
          (p) => p.userId === userId && p.isActive
        );

        if (!isCreator && !isParticipant) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous n'avez pas accès à ce contrat",
          });
        }
      }

      // 3️⃣ Charger les documents
      const documents = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contractId,
          isLatestVersion: true,
        },
      });

      // 4️⃣ Vérifier statut
      if (!isDraft(contract)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seuls les contrats en draft peuvent être soumis pour review",
        });
      }

      // 5️⃣ Vérifier main document
      const hasMainDocument = documents.some(
        (d) => d.category === "main_contract"
      );

      if (!hasMainDocument) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Un document principal doit être uploadé avant soumission",
        });
      }

      // 6️⃣ Update du statut
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

      // 7️⃣ Recharger les documents
      const updatedDocuments = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contractId,
          isLatestVersion: true,
        },
      });

      // 8️⃣ Créer historique
      await ctx.prisma.contractStatusHistory.create({
        data: {
          contractId: contract.id,
          fromStatus: "draft",
          toStatus: "pending_admin_review",
          changedBy: userId,
          reason: notes || "Soumis pour review admin",
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
        message: "Échec de la soumission pour review",
        cause: error,
      });
    }
  }),


  // ==========================================================================
  // 4. ADMIN APPROVE
  // ==========================================================================

  /**
   * Approuve un contrat en attente de review
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
        // 1. Charger le contrat (sans documents)
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
            message: "Contrat introuvable",
          });
        }

        if (contract.status !== "pending_admin_review") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seuls les contrats en review peuvent être approuvés",
          });
        }

        // 2. Mettre à jour → completed
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

        // 3. Charger les documents séparément
        const documents = await ctx.prisma.document.findMany({
          where: {
            tenantId: ctx.tenantId!,
            entityType: "contract",
            entityId: contractId,
            isLatestVersion: true,
          }
        });

        // 4. Notifier le créateur
        if (contract.createdBy) {
          await ctx.prisma.contractNotification.create({
            data: {
              contractId: contract.id,
              recipientId: contract.createdBy,                     // ✔ correct
              type: "approved",                                    // ✔ correct
              title: "Contrat approuvé",                           // ✔ correct
              message: `Votre contrat "${contract.title}" a été approuvé par l'admin`,
              // sentAt est automatique
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
            reason: notes || "Approuvé par admin",
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
          message: "Échec de l'approbation",
          cause: error,
        });
      }
    }),


  // ==========================================================================
  // 5. ADMIN REJECT
  // ==========================================================================

  /**
   * Rejette un contrat en attente de review et le remet en draft
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
      // 1. Récupérer le contrat
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: contractId, tenantId: ctx.tenantId! },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contrat introuvable",
        });
      }

      // 2. Validation statut
      if (contract.status !== "pending_admin_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seuls les contrats en review peuvent être rejetés",
        });
      }

      // 3. Update → retour en draft
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

      // 4. Notification au créateur
      if (contract.createdBy) {
        await ctx.prisma.contractNotification.create({
          data: {
            contractId: contract.id,
            recipientId: contract.createdBy,
            type: "rejected",
            title: "Contrat rejeté",
            message: `Votre contrat "${contract.title}" a été rejeté: ${reason}`,
          },
        });
      }

      // 5. Historique statut (notes supprimé car n'existe pas)
      await ctx.prisma.contractStatusHistory.create({
        data: {
          contractId: contract.id,
          fromStatus: "pending_admin_review",
          toStatus: "draft",
          changedBy: ctx.session!.user.id,
          reason: "Rejeté par admin",
          // ❌ notes supprimé (n'existe pas dans ton modèle)
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
        message: "Échec du rejet",
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
        // 1. Charger le contrat (sans include.documents, car la relation n'existe pas)
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contrat introuvable",
          });
        }

        // 2. Valider le statut
        if (!["completed", "active"].includes(contract.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seuls les contrats completed/active peuvent recevoir une version signée",
          });
        }

        // 3. Récupérer le document principal via findMany
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

        // 4. Upload du PDF
        const buffer = Buffer.from(pdfBuffer, "base64");
        const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v${newVersion}/${fileName}`;
        const s3Key = await uploadFile(buffer, s3FileName);

        // 5. Ancienne version -> non latest
        if (mainDoc) {
          await ctx.prisma.document.update({
            where: { id: mainDoc.id },
            data: { isLatestVersion: false },
          });
        }

        // 6. Créer la nouvelle version signée
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

        // 7. Mettre à jour le contrat
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
          message: "Échec de l'upload de la version signée",
          cause: error,
        });
      }
    }),


  // ==========================================================================
  // 7. ACTIVATE CONTRACT
  // ==========================================================================

  /**
   * Active un contrat completed
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
      // 1. Charger le contrat (sans include.documents)
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: contractId, tenantId: ctx.tenantId! },
        include: {
          participants: { where: { isActive: true } },
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contrat introuvable",
        });
      }

      // 2. Statut must be completed
      if (contract.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seuls les contrats completed peuvent être activés",
        });
      }

      // 3. Récupérer le(s) documents via findMany()
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
          `[activateContract] Warning: Activation du contrat ${contractId} sans version signée`
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
            title: "Contrat activé",
            message: `Le contrat "${contract.title}" est maintenant actif`,
          })),
        });
      }

      // 6. Historique (notes supprimé car n’existe pas)
      await ctx.prisma.contractStatusHistory.create({
        data: {
          contractId: contract.id,
          fromStatus: "completed",
          toStatus: "active",
          changedBy: ctx.session!.user.id,
          reason: "Activé par admin",
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
        message: "Échec de l'activation",
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

    // 🧩 SI PAS LIST_GLOBAL → On limite aux contrats où l'user participe
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
   * Récupère un contrat par son ID avec toutes ses relations
   * 
   * Inclut:
   * - Parent MSA (si SOW)
   * - Children SOWs (si MSA)
   * - Participants avec users/companies
   * - Documents (toutes versions)
   * - Historique des statuts
   * 
   * @permission contracts.view
   */
  getSimpleContractById: tenantProcedure
    .use(hasPermission(P.CONTRACT.READ_OWN))
    .input(getSimpleContractByIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        // 1️⃣ Charger le contrat SANS documents
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
          },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contrat introuvable",
          });
        }

        // 2️⃣ Charger documents (toutes versions)
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

        // 3️⃣ Enrichir le statusHistory pour matcher le front
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
              notes: null,                // ⬅️ champ requis par le front
              changedByUser: user ?? null // ⬅️ ajout calculé
            };
          })
        );

        // 4️⃣ Fusionner + retourner
        return {
          ...contract,
          statusHistory: enrichedStatusHistory,
          documents,
        };

      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[getSimpleContractById] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Échec de la récupération du contrat",
          cause: error,
        });
      }
    }),

  // ==========================================================================
  // 10. DELETE DRAFT CONTRACT
  // ==========================================================================

  /**
   * Supprime un contrat en draft uniquement
   * 
   * Sécurités:
   * - Seuls les contrats draft peuvent être supprimés
   * - Les MSA avec SOWs liés ne peuvent pas être supprimés
   * - Les documents S3 sont supprimés en cascade
   * 
   * @permission contracts.delete
   */
  deleteDraftContract: tenantProcedure
  .use(hasPermission(P.CONTRACT.DELETE_GLOBAL))
  .input(deleteDraftContractSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      // 1️⃣ Charger le contrat (sans include.documents)
      const contract = await ctx.prisma.contract.findUnique({
        where: { id: input.id, tenantId: ctx.tenantId! },
        include: { children: true },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contrat introuvable",
        });
      }

      // 2️⃣ Vérifier statut
      if (!isDraft(contract)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seuls les contrats en draft peuvent être supprimés",
        });
      }

      // 3️⃣ Vérifier enfants SOW
      if (contract.type === "msa" && contract.children.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Impossible de supprimer un MSA qui a des SOWs liés",
        });
      }

      // 4️⃣ Charger les documents associés
      const documents = await ctx.prisma.document.findMany({
        where: {
          tenantId: ctx.tenantId!,
          entityType: "contract",
          entityId: contract.id,
        },
      });

      // 5️⃣ Supprimer les fichiers S3 associés
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

      // 6️⃣ Supprimer les documents de la DB
      await ctx.prisma.document.deleteMany({
        where: { entityId: contract.id, entityType: "contract" },
      });

      // 7️⃣ Supprimer le contrat
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
        message: "Contrat supprimé avec succès",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[deleteDraftContract] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Échec de la suppression",
        cause: error,
      });
    }
  }),

});
