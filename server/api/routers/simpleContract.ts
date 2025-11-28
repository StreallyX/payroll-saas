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
import { createTRPCRouter, tenantProcedure, hasPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import { uploadFile, deleteFile } from "@/lib/s3";
import { PERMISSION_TREE } from "@/server/rbac/permissions";

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
  // Permissions contrats standards
  LIST: PERMISSION_TREE.contracts.view,
  CREATE: PERMISSION_TREE.contracts.create,
  UPDATE: PERMISSION_TREE.contracts.update,
  DELETE: PERMISSION_TREE.contracts.delete,
  APPROVE: PERMISSION_TREE.contracts.approve,
};

// ============================================================================
// HELPER: Multiple Permissions (OR logic)
// ============================================================================

/**
 * Vérifie si l'utilisateur a au moins une des permissions spécifiées
 */
function hasAnyPermission(permissions: string[]) {
  return tenantProcedure.use(async ({ ctx, next }) => {
    const userPermissions = ctx.session?.user?.permissions || [];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Permission requise (au moins une de: ${permissions.join(", ")})`,
      });
    }

    return next();
  });
}

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
    .use(hasPermission(P.CREATE))
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

        // 7. Retourner le contrat complet
        const fullContract = await ctx.prisma.contract.findUnique({
          where: { id: contract.id },
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                company: { select: { id: true, name: true } },
              },
            },
            documents: { where: { isLatestVersion: true } },
          },
        });

        return {
          success: true,
          contract: fullContract,
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
    .use(hasPermission(P.CREATE))
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
            
            // Hériter des champs du MSA parent
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

        // 6. Créer participant company (optionnel, sinon hériter du parent)
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

        // 8. Retourner le contrat complet
        const fullContract = await ctx.prisma.contract.findUnique({
          where: { id: contract.id },
          include: {
            parent: { select: { id: true, title: true, type: true } },
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                company: { select: { id: true, name: true } },
              },
            },
            documents: { where: { isLatestVersion: true } },
          },
        });

        return {
          success: true,
          contract: fullContract,
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

  /**
   * Soumet un contrat draft pour validation admin
   * 
   * Transition: draft → pending_admin_review
   * 
   * @permission contracts.update
   */
  submitForReview: tenantProcedure
    .use(hasPermission(P.UPDATE))
    .input(submitForReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, notes } = input;

      try {
        // 1. Récupérer le contrat
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
          include: { documents: { where: { isLatestVersion: true } } },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contrat introuvable",
          });
        }

        // 2. Valider que le contrat est en draft
        if (!isDraft(contract)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seuls les contrats en draft peuvent être soumis pour review",
          });
        }

        // 3. Valider qu'un document principal existe
        const hasMainDocument = contract.documents.some(
          (d) => d.category === "main_contract"
        );

        if (!hasMainDocument) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Un document principal doit être uploadé avant soumission",
          });
        }

        // 4. Mettre à jour le statut
        const updated = await ctx.prisma.contract.update({
          where: { id: contractId },
          data: {
            status: "pending_admin_review",
            workflowStatus: "pending_admin_review",
            notes: notes ? `${contract.notes || ""}\n\n[SOUMISSION] ${notes}`.trim() : contract.notes,
          },
          include: {
            documents: { where: { isLatestVersion: true } },
            participants: true,
            parent: { select: { id: true, title: true } },
          },
        });

        // 5. Créer notifications pour les admins
        const admins = await ctx.prisma.user.findMany({
          where: {
            tenantId: ctx.tenantId!,
            isActive: true,
            role: {
              name: { in: ["SUPER_ADMIN", "ADMIN"] },
            },
          },
          select: { id: true },
        });

        if (admins.length > 0) {
          await ctx.prisma.contractNotification.createMany({
            data: admins.map((admin) => ({
              contractId: contract.id,
              userId: admin.id,
              type: "pending_review",
              message: `Nouveau contrat "${contract.title}" en attente de review`,
              isRead: false,
            })),
          });
        }

        // 6. Enregistrer dans l'historique
        await ctx.prisma.contractStatusHistory.create({
          data: {
            contractId: contract.id,
            fromStatus: "draft",
            toStatus: "pending_admin_review",
            changedBy: ctx.session!.user.id,
            reason: "Soumis pour review admin",
            notes: notes || undefined,
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
            action: "submit_for_review",
            previousStatus: "draft",
            newStatus: "pending_admin_review",
            system: "simple",
          },
        });

        return {
          success: true,
          contract: updated,
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
    .use(hasPermission(P.APPROVE))
    .input(adminApproveSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, notes } = input;

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

        // 2. Valider que le contrat est en pending_admin_review
        if (contract.status !== "pending_admin_review") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seuls les contrats en review peuvent être approuvés",
          });
        }

        // 3. Mettre à jour le statut → completed
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
            documents: { where: { isLatestVersion: true } },
            participants: true,
            parent: { select: { id: true, title: true } },
          },
        });

        // 4. Notifier le créateur
        if (contract.createdBy) {
          await ctx.prisma.contractNotification.create({
            data: {
              contractId: contract.id,
              userId: contract.createdBy,
              type: "approved",
              message: `Votre contrat "${contract.title}" a été approuvé par l'admin`,
              isRead: false,
            },
          });
        }

        // 5. Enregistrer dans l'historique
        await ctx.prisma.contractStatusHistory.create({
          data: {
            contractId: contract.id,
            fromStatus: "pending_admin_review",
            toStatus: "completed",
            changedBy: ctx.session!.user.id,
            reason: "Approuvé par admin",
            notes: notes || undefined,
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
            notes,
          },
        });

        return {
          success: true,
          contract: updated,
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
    .use(hasPermission(P.APPROVE))
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

        // 2. Valider que le contrat est en pending_admin_review
        if (contract.status !== "pending_admin_review") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seuls les contrats en review peuvent être rejetés",
          });
        }

        // 3. Remettre en draft avec raison de rejet
        const updated = await ctx.prisma.contract.update({
          where: { id: contractId },
          data: {
            status: "draft",
            workflowStatus: "draft",
            notes: `${contract.notes || ""}\n\n[ADMIN REJECTION] ${reason}`.trim(),
          },
          include: {
            documents: { where: { isLatestVersion: true } },
            participants: true,
            parent: { select: { id: true, title: true } },
          },
        });

        // 4. Notifier le créateur
        if (contract.createdBy) {
          await ctx.prisma.contractNotification.create({
            data: {
              contractId: contract.id,
              userId: contract.createdBy,
              type: "rejected",
              message: `Votre contrat "${contract.title}" a été rejeté: ${reason}`,
              isRead: false,
            },
          });
        }

        // 5. Enregistrer dans l'historique
        await ctx.prisma.contractStatusHistory.create({
          data: {
            contractId: contract.id,
            fromStatus: "pending_admin_review",
            toStatus: "draft",
            changedBy: ctx.session!.user.id,
            reason: "Rejeté par admin",
            notes: reason,
          },
        });

        // 6. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.REJECT,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: contract.title || "Untitled",
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

  /**
   * Upload une version signée du contrat (pour contrats completed/active)
   * 
   * Crée une nouvelle version du document principal avec flag "isSigned"
   * 
   * @permission contracts.update
   */
  uploadSignedVersion: tenantProcedure
    .use(hasPermission(P.UPDATE))
    .input(uploadSignedVersionSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, pdfBuffer, fileName, mimeType, fileSize } = input;

      try {
        // 1. Récupérer le contrat
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
          include: { documents: { where: { category: "main_contract" } } },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contrat introuvable",
          });
        }

        // 2. Valider que le contrat est completed ou active
        if (!["completed", "active"].includes(contract.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seuls les contrats completed/active peuvent recevoir une version signée",
          });
        }

        // 3. Trouver la dernière version du document principal
        const mainDoc = contract.documents.find((d) => d.isLatestVersion);
        const newVersion = mainDoc ? mainDoc.version + 1 : 1;

        // 4. Upload du PDF signé
        const buffer = Buffer.from(pdfBuffer, "base64");
        const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v${newVersion}/${fileName}`;
        const s3Key = await uploadFile(buffer, s3FileName);

        // 5. Marquer l'ancienne version comme non-latest
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
            parentDocumentId: mainDoc?.id,
          },
        });

        // 7. Mettre à jour le contrat
        const updated = await ctx.prisma.contract.update({
          where: { id: contractId },
          data: {
            signedAt: new Date(),
          },
          include: {
            documents: { where: { isLatestVersion: true } },
            participants: true,
            parent: { select: { id: true, title: true } },
          },
        });

        // 8. Audit log
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
    .use(hasPermission(P.APPROVE))
    .input(activateContractSchema)
    .mutation(async ({ ctx, input }) => {
      const { contractId, notes } = input;

      try {
        // 1. Récupérer le contrat
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: contractId, tenantId: ctx.tenantId! },
          include: {
            documents: { where: { isLatestVersion: true } },
            participants: { where: { isActive: true } },
          },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contrat introuvable",
          });
        }

        // 2. Valider que le contrat est completed
        if (contract.status !== "completed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seuls les contrats completed peuvent être activés",
          });
        }

        // 3. Vérifier qu'une version signée existe (avertissement seulement)
        const hasSignedVersion = contract.documents.some((d) => d.isSigned);
        if (!hasSignedVersion) {
          console.warn(
            `[activateContract] Warning: Activating contract ${contractId} without signed version`
          );
        }

        // 4. Activer le contrat
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
            documents: { where: { isLatestVersion: true } },
            participants: true,
            parent: { select: { id: true, title: true } },
          },
        });

        // 5. Notifier les participants
        const notificationRecipients = [
          contract.createdBy,
          ...contract.participants.map((p) => p.userId).filter(Boolean),
        ].filter((id, index, self) => id && self.indexOf(id) === index) as string[];

        if (notificationRecipients.length > 0) {
          await ctx.prisma.contractNotification.createMany({
            data: notificationRecipients.map((userId) => ({
              contractId: contract.id,
              userId,
              type: "activated",
              message: `Le contrat "${contract.title}" est maintenant actif`,
              isRead: false,
            })),
          });
        }

        // 6. Enregistrer dans l'historique
        await ctx.prisma.contractStatusHistory.create({
          data: {
            contractId: contract.id,
            fromStatus: "completed",
            toStatus: "active",
            changedBy: ctx.session!.user.id,
            reason: "Activé par admin",
            notes: notes || undefined,
          },
        });

        // 7. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
          action: AuditAction.ACTIVATE,
          entityType: AuditEntityType.CONTRACT,
          entityId: contract.id,
          entityName: contract.title || "Untitled",
          tenantId: ctx.tenantId!,
          metadata: {
            action: "activate_contract",
            previousStatus: "completed",
            newStatus: "active",
            hasSignedVersion,
            system: "simple",
            notes,
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

  /**
   * Liste les contrats avec filtres et pagination optimisée
   * 
   * Filtres disponibles:
   * - type (all, msa, sow)
   * - status (all, draft, pending_admin_review, completed, active)
   * - search (titre, description, référence)
   * - parentMSAId (filtrer les SOW d'un MSA)
   * 
   * @permission contracts.view
   */
  listSimpleContracts: tenantProcedure
    .use(hasPermission(P.LIST))
    .input(listSimpleContractsSchema)
    .query(async ({ ctx, input }) => {
      const { type, status, search, parentMSAId, page, pageSize } = input;

      try {
        // Construction du where
        const where: any = {
          tenantId: ctx.tenantId!,
        };

        // Filtre par type
        if (type !== "all") {
          where.type = type;
        }

        // Filtre par statut
        if (status !== "all") {
          where.status = status;
        }

        // Filtre par recherche
        if (search) {
          where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { contractReference: { contains: search, mode: "insensitive" } },
          ];
        }

        // Filtre par MSA parent
        if (parentMSAId) {
          where.parentId = parentMSAId;
        }

        // Pagination
        const skip = (page - 1) * pageSize;

        // Requête avec count
        const [contracts, total] = await Promise.all([
          ctx.prisma.contract.findMany({
            where,
            include: {
              parent: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                },
              },
              participants: {
                where: { isActive: true },
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
              },
              documents: {
                where: { isLatestVersion: true, category: "main_contract" },
                orderBy: { version: "desc" },
                take: 1,
              },
              _count: {
                select: {
                  children: true, // Nombre de SOWs pour les MSA
                },
              },
            },
            orderBy: [{ createdAt: "desc" }],
            skip,
            take: pageSize,
          }),
          ctx.prisma.contract.count({ where }),
        ]);

        return {
          contracts,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            hasMore: page * pageSize < total,
          },
        };
      } catch (error) {
        console.error("[listSimpleContracts] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Échec de la récupération des contrats",
          cause: error,
        });
      }
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
    .use(hasPermission(P.LIST))
    .input(getSimpleContractByIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        const contract = await ctx.prisma.contract.findUnique({
          where: {
            id: input.id,
            tenantId: ctx.tenantId!,
          },
          include: {
            parent: {
              select: {
                id: true,
                title: true,
                type: true,
                status: true,
              },
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
                    contactEmail: true,
                  },
                },
              },
            },
            documents: {
              orderBy: { version: "desc" },
              include: {
                parentDocument: {
                  select: {
                    id: true,
                    version: true,
                  },
                },
              },
            },
            statusHistory: {
              orderBy: { createdAt: "desc" },
              include: {
                changedByUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contrat introuvable",
          });
        }

        return contract;
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
    .use(hasPermission(P.DELETE))
    .input(deleteDraftContractSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Récupérer le contrat avec relations
        const contract = await ctx.prisma.contract.findUnique({
          where: { id: input.id, tenantId: ctx.tenantId! },
          include: {
            documents: true,
            children: true,
          },
        });

        if (!contract) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contrat introuvable",
          });
        }

        // 2. Valider que le contrat est en draft
        if (!isDraft(contract)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seuls les contrats en draft peuvent être supprimés",
          });
        }

        // 3. Vérifier qu'il n'a pas d'enfants (pour MSA)
        if (contract.type === "msa" && contract.children.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Impossible de supprimer un MSA qui a des SOWs liés",
          });
        }

        // 4. Supprimer les documents S3
        for (const doc of contract.documents) {
          try {
            await deleteFile(doc.s3Key);
          } catch (err) {
            console.error(
              `[deleteDraftContract] Failed to delete S3 file ${doc.s3Key}:`,
              err
            );
            // Continue même si erreur S3
          }
        }

        // 5. Supprimer le contrat (cascade delete sur participants, documents, etc.)
        await ctx.prisma.contract.delete({
          where: { id: input.id },
        });

        // 6. Audit log
        await createAuditLog({
          userId: ctx.session!.user.id,
          userName: ctx.session!.user.name || ctx.session!.user.email,
          userRole: ctx.session!.user.roleName || "USER",
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
