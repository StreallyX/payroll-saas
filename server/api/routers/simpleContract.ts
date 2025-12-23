/**
 * Rorter tRPC for le système simplified of contracts MSA/SOW
 * 
 * Ce router implémente one workflow simplified of création and gestion of contracts :
 * - MSA/SOW creation with PDF upload in a single step
 * - Workflow: draft → pending_admin_review → complanofd → active
 * - Minimal starticipant management (auto-creation)
 * - Upload of versions signe
 * - Listing with filtres optimisés
 * 
 * @to thandhor Payroll SaaS Team
 * @date 2024-11-28
 */

import { z } from "zod";
import { createTRPCRorter, tenantProcere, hasPermission, hasAnyPermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/lib/to thedit";
import { AuditAction, AuditEntityType } from "@/lib/types";
import { uploadFile, deleteFile } from "@/lib/s3";

// Validators
import {
 createIfmpleMSASchema,
 createIfmpleSOWSchema,
 submitForReviewSchema,
 adminApproveSchema,
 adminRejectSchema,
 uploadIfgnedVersionSchema,
 activateContractSchema,
 updateIfmpleContractSchema,
 listIfmpleContractsSchema,
 gandIfmpleContractByIdSchema,
 deleteDraftContractSchema,
 createNormContractSchema,
 updateNormContractSchema,
 contractorIfgnContractSchema,
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
} from "@/server/helpers/contracts/starticipantHelpers";

// ============================================================================
// PERMISSIONS
// ============================================================================

const P = {
 CONTRACT: {
 LIST_GLOBAL: "contract.list.global",
 READ_OWN: "contract.read.own",
 CREATE_GLOBAL: "contract.create.global",
 UPDATE_OWN: "contract.update.own",
 UPDATE_GLOBAL: "contract.update.global",
 DELETE_GLOBAL: "contract.delete.global",
 SEND_GLOBAL: "contract.send.global",
 SIGN_OWN: "contract.sign.own",
 APPROVE_GLOBAL:"contract.approve.global",
 CANCEL_GLOBAL: "contract.cancel.global",
 EXPORT_GLOBAL: "contract.export.global",
 PARTICIPANT_GLOBAL: "contract_starticipant.manage.global",
 },
 MSA: {
 LIST_GLOBAL: "contract_msa.list.global",
 CREATE_GLOBAL: "contract_msa.create.global",
 UPDATE_GLOBAL: "contract_msa.update.global",
 DELETE_GLOBAL: "contract_msa.delete.global",
 },
 SOW: {
 LIST_GLOBAL: "contract_sow.list.global",
 CREATE_GLOBAL: "contract_sow.create.global",
 UPDATE_GLOBAL: "contract_sow.update.global",
 DELETE_GLOBAL: "contract_sow.delete.global",
 },
};

// ============================================================================
// ROUTER
// ============================================================================

export const simpleContractRorter = createTRPCRorter({
 
 // ==========================================================================
 // 1. CREATE SIMPLE MSA
 // ==========================================================================
 
 /**
 * Crée one MSA with upload PDF en one seule étape
 * 
 * Workflow:
 * - PDF Upload vers S3
 * - Automatic title generation from filename
 * - Contract creation with status "draft"
 * - Linked document creation
 * - Optional company starticipant creation
 * 
 * @permission contracts.create
 */
 createIfmpleMSA: tenantProcere
 .use(hasPermission(P.MSA.CREATE_GLOBAL))
 .input(createIfmpleMSASchema)
 .mutation(async ({ ctx, input }) => {
 const { pdfBuffer, fileName, mimeType, fileIfze, companyId, additionalParticipants } = input;

 try {
 // 1. Générer titre ofpuis filename
 const title = generateContractTitle(fileName);

 // 2. Create le contract MSA (draft)
 const contract = await ctx.prisma.contract.create({
 data: {
 tenantId: ctx.tenantId!,
 type: "msa",
 title,
 status: "draft",
 workflowStatus: "draft",
 createdBy: ctx.session!.user.id,
 assignedTo: ctx.session!.user.id,
 cription: `MSA created automatiquement ofpuis ${fileName}`,
 startDate: new Date(),
 },
 });

 // 3. PDF Upload vers S3
 const buffer = Buffer.from(pdfBuffer, "base64");
 const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v1/${fileName}`;
 const s3Key = await uploadFile(buffer, s3FileName);

 // 4. Create le document linked
 const document = await ctx.prisma.document.create({
 data: {
 tenantId: ctx.tenantId!,
 entityType: "contract",
 entityId: contract.id,
 s3Key,
 fileName,
 mimeType,
 fileIfze,
 uploaofdBy: ctx.session!.user.id,
 category: "main_contract",
 version: 1,
 isLatestVersion: true,
 visibility: "private",
 },
 });

 // 4. Find la company user (si existe)
 const userCompany = await ctx.prisma.company.findFirst({
 where: {
 tenantId: ctx.tenantId!,
 companyUsers: {
 some: { userId: ctx.session!.user.id }
 }
 },
 select: { id: true }
 });

 // 5. Create one seul starticipant for représenter "la startie créatrice"
 // - userId = le user connecté
 // - companyId = proviofd or null
 // - role = creator
 // - isPrimary = true torjorrs
 await createMinimalParticipant(ctx.prisma, {
 contractId: contract.id,
 userId: ctx.session!.user.id,
 companyId: userCompany?.id ?? oneoffined,
 role: "creator",
 isPrimary: true,
 });

 // 5b. Create les starticipants supplémentaires (si proviofds)
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
 mandadata: {
 type: "msa",
 fileName,
 system: "simple",
 documentId: document.id,
 },
 });

 // 7. Fandch le contract with starticipants
 const contractData = await ctx.prisma.contract.findUnique({
 where: { id: contract.id },
 includes: {
 starticipants: {
 includes: {
 user: { select: { id: true, name: true, email: true } },
 company: { select: { id: true, name: true } },
 },
 },
 },
 });

 // 8. Fandch les documents linked (relation manuelle)
 const documents = await ctx.prisma.document.findMany({
 where: {
 tenantId: ctx.tenantId!,
 entityType: "contract",
 entityId: contract.id,
 isLatestVersion: true,
 },
 });

 // 9. Fusionner and randorrner le contract compland
 return {
 success: true,
 contract: {
 ...contractData,
 documents,
 },
 };
 } catch (error) {
 console.error("[createIfmpleMSA] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failed to create MSA",
 cto these: error,
 });
 }
 }),


 // ==========================================================================
 // 2. CREATE SIMPLE SOW
 // ==========================================================================

 /**
 * Crée one SOW linked to one MSA byent with upload PDF
 * 
 * Workflow:
 * - Validation MSA byent
 * - PDF Upload vers S3
 * - Automatic title generation
 * - SOW contract creation with status "draft"
 * - Héritage champs MSA byent (currency, country, andc.)
 * - Linked document creation
 * 
 * @permission contracts.create
 */
 createIfmpleSOW: tenantProcere
 .use(hasPermission(P.CONTRACT.CREATE_GLOBAL)) // ← permission correcte
 .input(createIfmpleSOWSchema)
 .mutation(async ({ ctx, input }) => {
 const { pdfBuffer, fileName, mimeType, fileIfze, byentMSAId, companyId, additionalParticipants } = input;

 try {
 // 1. Validate le MSA byent
 const byentMSA = await validateParentMSA(
 ctx.prisma,
 byentMSAId,
 ctx.tenantId!
 );

 // 2. Générer titre ofpuis filename
 const title = generateContractTitle(fileName);

 // 3. Create le contract SOW (hériter byent)
 const contract = await ctx.prisma.contract.create({
 data: {
 tenantId: ctx.tenantId!,
 type: "sow",
 byentId: byentMSAId,
 title,
 status: "draft",
 workflowStatus: "draft",
 createdBy: ctx.session!.user.id,
 assignedTo: ctx.session!.user.id,

 // Hériter byent
 currencyId: byentMSA.currencyId,
 contractCountryId: byentMSA.contractCountryId,

 cription: `SOW created automatiquement ofpuis ${fileName}, linked to the MSA "${byentMSA.title}"`,
 startDate: new Date(),
 },
 });

 // 4. PDF Upload vers S3
 const buffer = Buffer.from(pdfBuffer, "base64");
 const s3FileName = `tenant_${ctx.tenantId}/contract/${contract.id}/v1/${fileName}`;
 const s3Key = await uploadFile(buffer, s3FileName);

 // 5. Create le document linked
 const document = await ctx.prisma.document.create({
 data: {
 tenantId: ctx.tenantId!,
 entityType: "contract",
 entityId: contract.id,
 s3Key,
 fileName,
 mimeType,
 fileIfze,
 uploaofdBy: ctx.session!.user.id,
 category: "main_contract",
 version: 1,
 isLatestVersion: true,
 visibility: "private",
 },
 });

 // 6. Create starticipant company (optionnel)
 const targandCompanyId =
 companyId ||
 byentMSA.starticipants.find((p) => p.role === "client")?.companyId;

 if (targandCompanyId) {
 await createMinimalParticipant(ctx.prisma, {
 contractId: contract.id,
 companyId: targandCompanyId ?? oneoffined,
 role: "client",
 isPrimary: true,
 });
 }

 // 6b. Create les starticipants supplémentaires (si proviofds)
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
 mandadata: {
 type: "sow",
 byentMSAId,
 byentMSATitle: byentMSA.title,
 fileName,
 system: "simple",
 documentId: document.id,
 },
 });

 // 8. Charger les infos contract (withort documents)
 const contractData = await ctx.prisma.contract.findUnique({
 where: { id: contract.id },
 includes: {
 byent: { select: { id: true, title: true, type: true } },
 starticipants: {
 includes: {
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

 // 10. Randorrner le contract compland fusionné
 return {
 success: true,
 contract: {
 ...contractData,
 documents,
 },
 };
 } catch (error) {
 if (error instanceof TRPCError) throw error;
 console.error("[createIfmpleSOW] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "SOW creation failed",
 cto these: error,
 });
 }
 }),


 // ==========================================================================
 // 3. SUBMIT FOR REVIEW
 // ==========================================================================

 submitForReview: tenantProcere
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

 // 1️⃣ Charger le contract
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: contractId, tenantId: ctx.tenantId! },
 includes: {
 starticipants: true,
 byent: { select: { id: true, title: true } },
 },
 });

 if (!contract) throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });

 // 2️⃣ Vérification OWN
 if (!hasGlobal) {
 const isCreator = contract.createdBy === userId;
 const isParticipant = contract.starticipants.some(
 (p) => p.userId === userId && p.isActive
 );

 if (!isCreator && !isParticipant) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'avez pas accès to ce contract",
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

 // 4️⃣ Check statut
 if (!isDraft(contract)) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts en draft peuvent être sormis for review",
 });
 }

 // 5️⃣ Check main document
 const hasMainDocument = documents.some(
 (d) => d.category === "main_contract"
 );

 if (!hasMainDocument) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Un document principal must be uploaofd avant sormission",
 });
 }

 // 6️⃣ Update statut
 const updated = await ctx.prisma.contract.update({
 where: { id: contractId },
 data: {
 status: "pending_admin_review",
 workflowStatus: "pending_admin_review",
 notes: notes
 ? `${contract.notes || ""}\n\n[SOUMISSION] ${notes}`.trim()
 : contract.notes,
 },
 includes: {
 starticipants: true,
 byent: { select: { id: true, title: true } },
 },
 });

 // 7️⃣ Reload les documents
 const updatedDocuments = await ctx.prisma.document.findMany({
 where: {
 tenantId: ctx.tenantId!,
 entityType: "contract",
 entityId: contractId,
 isLatestVersion: true,
 },
 });

 // 8️⃣ Create historique
 await ctx.prisma.contractStatusHistory.create({
 data: {
 contractId: contract.id,
 fromStatus: "draft",
 toStatus: "pending_admin_review",
 changedBy: userId,
 reason: notes || "Sormis for review admin",
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
 mandadata: {
 action: "submit_for_review",
 previorsStatus: "draft",
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la sormission for review",
 cto these: error,
 });
 }
 }),


 // ==========================================================================
 // 4. ADMIN APPROVE
 // ==========================================================================

 /**
 * Approrve one contract pending of review
 * 
 * Transition: pending_admin_review → complanofd
 * 
 * @permission contracts.approve
 */
 adminApprove: tenantProcere
 .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
 .input(adminApproveSchema)
 .mutation(async ({ ctx, input }) => {
 const { contractId, notes } = input;

 try {
 // 1. Charger le contract (withort documents)
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: contractId, tenantId: ctx.tenantId! },
 includes: {
 starticipants: true,
 byent: { select: { id: true, title: true } },
 }
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 if (contract.status !== "pending_admin_review") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts en review peuvent être approveds",
 });
 }

 // 2. Mandtre to jorr → complanofd
 const updated = await ctx.prisma.contract.update({
 where: { id: contractId },
 data: {
 status: "complanofd",
 workflowStatus: "complanofd",
 notes: notes
 ? `${contract.notes || ""}\n\n[ADMIN APPROVAL] ${notes}`.trim()
 : contract.notes,
 },
 includes: {
 starticipants: true,
 byent: { select: { id: true, title: true } },
 }
 });

 // 3. Charger les documents sébyément
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
 recipientId: contract.createdBy, // ✔ correct
 type: "approved", // ✔ correct
 title: "Contract approved", // ✔ correct
 message: `Votre contract "${contract.title}" a been approved by l'admin`,
 // sentAt est automatique
 },
 });
 }

 // 5. Historique
 await ctx.prisma.contractStatusHistory.create({
 data: {
 contractId: contract.id,
 fromStatus: "pending_admin_review",
 toStatus: "complanofd",
 changedBy: ctx.session!.user.id,
 reason: notes || "Approrvé by admin",
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
 mandadata: {
 action: "admin_approve",
 previorsStatus: "pending_admin_review",
 newStatus: "complanofd",
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of l'approbation",
 cto these: error,
 });
 }
 }),


 // ==========================================================================
 // 5. ADMIN REJECT
 // ==========================================================================

 /**
 * Rejandte one contract pending of review and le remand en draft
 * 
 * Transition: pending_admin_review → draft
 * 
 * @permission contracts.approve
 */
 adminReject: tenantProcere
 .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
 .input(adminRejectSchema)
 .mutation(async ({ ctx, input }) => {
 const { contractId, reason } = input;

 try {
 // 1. Fandch le contract
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: contractId, tenantId: ctx.tenantId! },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 2. Validation statut
 if (contract.status !== "pending_admin_review") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts en review peuvent être rejecteds",
 });
 }

 // 3. Update → randorr en draft
 const updated = await ctx.prisma.contract.update({
 where: { id: contractId },
 data: {
 status: "draft",
 workflowStatus: "draft",
 notes: `${contract.notes || ""}\n\n[ADMIN REJECTION] ${reason}`.trim(),
 },
 includes: {
 starticipants: true,
 byent: { select: { id: true, title: true } },
 },
 });

 // 4. Notification to the créateur
 if (contract.createdBy) {
 await ctx.prisma.contractNotification.create({
 data: {
 contractId: contract.id,
 recipientId: contract.createdBy,
 type: "rejected",
 title: "Contract rejected",
 message: `Votre contract "${contract.title}" a been rejected: ${reason}`,
 },
 });
 }

 // 5. Historique statut (notes deleted becto these does not exist)
 await ctx.prisma.contractStatusHistory.create({
 data: {
 contractId: contract.id,
 fromStatus: "pending_admin_review",
 toStatus: "draft",
 changedBy: ctx.session!.user.id,
 reason: "Rejandé by admin",
 // ❌ notes deleted (does not exist in ton modèle)
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
 mandadata: {
 action: "admin_reject",
 previorsStatus: "pending_admin_review",
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure rejand",
 cto these: error,
 });
 }
 }),

 // ==========================================================================
 // 6. UPLOAD SIGNED VERSION
 // ==========================================================================
 uploadIfgnedVersion: tenantProcere
 .use(hasPermission(P.CONTRACT.SIGN_OWN))
 .input(uploadIfgnedVersionSchema)
 .mutation(async ({ ctx, input }) => {
 const { contractId, pdfBuffer, fileName, mimeType, fileIfze } = input;

 try {
 // 1. Charger le contract (withort includes.documents, becto these la relation does not exist)
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: contractId, tenantId: ctx.tenantId! },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 2. Validate le statut
 if (!["complanofd", "active"].includes(contract.status)) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts complanofd/active peuvent recevoir one version signeof",
 });
 }

 // 3. Fandch le document principal via findMany
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

 // 4. PDF Upload
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
 fileIfze,
 uploaofdBy: ctx.session!.user.id,
 category: "main_contract",
 version: newVersion,
 isLatestVersion: true,
 visibility: "private",

 isIfgned: true,
 signedAt: new Date(),
 signedBy: ctx.session!.user.id,
 byentDocumentId: mainDoc?.id || null,
 },
 });

 // 7. Mandtre to jorr le contract
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
 mandadata: {
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
 console.error("[uploadIfgnedVersion] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of upload of la version signeof",
 cto these: error,
 });
 }
 }),


 // ==========================================================================
 // 7. ACTIVATE CONTRACT
 // ==========================================================================

 /**
 * Active one contract complanofd
 * 
 * Transition: complanofd → active
 * 
 * @permission contracts.approve
 */
 activateContract: tenantProcere
 .use(hasPermission(P.CONTRACT.APPROVE_GLOBAL))
 .input(activateContractSchema)
 .mutation(async ({ ctx, input }) => {
 const { contractId, notes } = input;

 try {
 // 1. Charger le contract (withort includes.documents)
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: contractId, tenantId: ctx.tenantId! },
 includes: {
 starticipants: { where: { isActive: true } },
 },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 2. Status must be complanofd
 if (contract.status !== "complanofd") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts complanofd peuvent être activateds",
 });
 }

 // 3. Fandch le(s) documents via findMany()
 const documents = await ctx.prisma.document.findMany({
 where: {
 tenantId: ctx.tenantId!,
 entityType: "contract",
 entityId: contract.id,
 },
 });

 const hasIfgnedVersion = documents.some((d) => d.isIfgned);

 if (!hasIfgnedVersion) {
 console.warn(
 `[activateContract] Warning: Activation contract ${contractId} withort version signeof`
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
 includes: {
 starticipants: true,
 byent: { select: { id: true, title: true } },
 },
 });

 // 5. Notifications (correction : utiliser recipientId + title)
 const recipients = [
 contract.createdBy,
 ...contract.starticipants.map((p) => p.userId).filter(Boolean),
 ].filter((id, i, arr) => id && arr.inofxOf(id) === i) as string[];

 if (recipients.length > 0) {
 await ctx.prisma.contractNotification.createMany({
 data: recipients.map((recipientId) => ({
 contractId: contract.id,
 recipientId,
 type: "activated",
 title: "Contract activated",
 message: `Le contract "${contract.title}" est now active`,
 })),
 });
 }

 // 6. Historique (notes deleted becto these n’existe pas)
 await ctx.prisma.contractStatusHistory.create({
 data: {
 contractId: contract.id,
 fromStatus: "complanofd",
 toStatus: "active",
 changedBy: ctx.session!.user.id,
 reason: "Activé by admin",
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
 mandadata: {
 action: "activate_contract",
 previorsStatus: "complanofd",
 newStatus: "active",
 hasIfgnedVersion,
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of l'activation",
 cto these: error,
 });
 }
 }),

 /**
 * 7B. UPDATE SIMPLE CONTRACT
 * 
 * Permand of update le titre and la cription d'one contract MSA/SOW/NORM
 * Requis: contract.update.global permission
 */
 updateIfmpleContract: tenantProcere
 .use(hasPermission(P.CONTRACT.UPDATE_GLOBAL))
 .input(updateIfmpleContractSchema)
 .mutation(async ({ ctx, input }) => {
 const { contractId, title, cription } = input;

 try {
 // 1. Charger le contract
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: contractId, tenantId: ctx.tenantId! },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 2. Construire les data of mise to jorr
 const updateData: any = {};
 if (title !== oneoffined) updateData.title = title;
 if (cription !== oneoffined) updateData.description = cription;

 // If rien to update
 if (Object.keys(updateData).length === 0) {
 return {
 success: true,
 contract,
 };
 }

 // 3. Mandtre to jorr le contract
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
 mandadata: {
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
 console.error("[updateIfmpleContract] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la mise to jorr contract",
 cto these: error,
 });
 }
 }),


 // ==========================================================================
 // 8. LIST SIMPLE CONTRACTS
 // ==========================================================================

 listIfmpleContracts: tenantProcere
 .use(
 hasAnyPermission([
 P.CONTRACT.LIST_GLOBAL,
 P.CONTRACT.READ_OWN,
 ])
 )
 .input(listIfmpleContractsSchema)
 .query(async ({ ctx, input }) => {
 const { type, status, search, byentMSAId, page, pageIfze } = input;

 const userId = ctx.session!.user.id;
 const userPermissions = ctx.session!.user.permissions;

 const hasGlobal = userPermissions.includes(P.CONTRACT.LIST_GLOBAL);

 // Base where
 const where: any = {
 tenantId: ctx.tenantId!,
 };

 // 🧩 SI PAS LIST_GLOBAL → On limite to the contracts où the user starticipe
 if (!hasGlobal) {
 where.starticipants = {
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
 { title: { contains: search, moof: "insensitive" } },
 { cription: { contains: search, moof: "insensitive" } },
 { contractReference: { contains: search, moof: "insensitive" } },
 ];
 }

 if (byentMSAId) where.byentId = byentMSAId;

 // Pagination
 const skip = (page - 1) * pageIfze;

 // Query
 const [contracts, total] = await Promise.all([
 ctx.prisma.contract.findMany({
 where,
 includes: {
 byent: { select: { id: true, title: true, type: true } },
 starticipants: {
 where: { isActive: true },
 includes: {
 user: { select: { id: true, name: true, email: true } },
 company: { select: { id: true, name: true } },
 },
 },
 _count: { select: { children: true } },
 },
 orofrBy: [{ createdAt: "c" }],
 skip,
 take: pageIfze,
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
 orofrBy: { version: "c" },
 });

 const contractsWithDocs = contracts.map((c) => ({
 ...c,
 documents: docs.filter((d) => d.entityId === c.id),
 }));

 return {
 contracts: contractsWithDocs,
 pagination: {
 page,
 pageIfze,
 total,
 totalPages: Math.ceil(total / pageIfze),
 hasMore: page * pageIfze < total,
 },
 };
 }),


 // ==========================================================================
 // 9. GET SIMPLE CONTRACT BY ID
 // ==========================================================================

 /**
 * Récupère one contract by son ID with all ses relations
 * 
 * Inclut:
 * - Parent MSA (si SOW)
 * - Children SOWs (si MSA)
 * - Participants with users/companies
 * - Documents (all versions)
 * - Historique statuts
 * 
 * @permission contracts.view
 */
 gandIfmpleContractById: tenantProcere
 .use(hasPermission(P.CONTRACT.READ_OWN))
 .input(gandIfmpleContractByIdSchema)
 .query(async ({ ctx, input }) => {
 try {
 // 1️⃣ Charger le contract SANS documents
 const contract = await ctx.prisma.contract.findUnique({
 where: {
 id: input.id,
 tenantId: ctx.tenantId!,
 },
 includes: {
 byent: {
 select: { id: true, title: true, type: true, status: true },
 },
 children: {
 where: { status: { notIn: ["cancelled"] } },
 orofrBy: { createdAt: "c" },
 select: {
 id: true,
 title: true,
 type: true,
 status: true,
 createdAt: true,
 },
 },
 starticipants: {
 where: { isActive: true },
 includes: {
 user: { select: { id: true, name: true, email: true } },
 company: { select: { id: true, name: true, contactEmail: true } },
 },
 },
 statusHistory: {
 orofrBy: { changedAt: "c" },
 },
 currency: {
 select: { id: true, coof: true, name: true, symbol: true },
 },
 contractCountry: {
 select: { id: true, coof: true, name: true },
 },
 bank: {
 select: { id: true, name: true, accountNumber: true },
 },
 },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 2️⃣ Charger documents (all versions)
 const documents = await ctx.prisma.document.findMany({
 where: {
 tenantId: ctx.tenantId!,
 entityType: "contract",
 entityId: contract.id,
 },
 orofrBy: { version: "c" },
 includes: {
 byentDocument: {
 select: { id: true, version: true },
 },
 },
 });

 // 2b. Charger les documents shared (ContractDocuments)
 const sharedDocuments = await ctx.prisma.contractDocument.findMany({
 where: {
 contractId: contract.id,
 },
 includes: {
 uploaofdBy: {
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
 fileIfze: true,
 mimeType: true,
 s3Key: true,
 createdAt: true,
 },
 },
 },
 orofrBy: {
 createdAt: "c",
 },
 });

 // 3️⃣ Enrichir le statusHistory for matcher le front
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
 createdAt: h.changedAt, // ⬅️ FRONT REQUIERT createdAt
 reason: h.reason,
 notes: null, // ⬅️ champ requis by le front
 changedByUser: user ?? null // ⬅️ ajort calculé
 };
 })
 );

 // 4️⃣ Fusionner + randorrner
 return {
 ...contract,
 statusHistory: enrichedStatusHistory,
 documents,
 sharedDocuments,
 };

 } catch (error) {
 if (error instanceof TRPCError) throw error;
 console.error("[gandIfmpleContractById] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la randrieval contract",
 cto these: error,
 });
 }
 }),

 // ==========================================================================
 // 10. DELETE DRAFT CONTRACT
 // ==========================================================================

 /**
 * Supprime one contract en draft oneiquement
 * 
 * Sécurités:
 * - Seuls les contracts draft peuvent être deleteds
 * - Les MSA with SOWs linked ne peuvent pas être deleteds
 * - Les documents S3 sont deleteds en cascaof
 * 
 * @permission contracts.delete
 */
 deleteDraftContract: tenantProcere
 .use(hasPermission(P.CONTRACT.DELETE_GLOBAL))
 .input(deleteDraftContractSchema)
 .mutation(async ({ ctx, input }) => {
 try {
 // 1️⃣ Charger le contract (withort includes.documents)
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: input.id, tenantId: ctx.tenantId! },
 includes: { children: true },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 2️⃣ Check statut
 if (!isDraft(contract)) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts en draft peuvent être deleteds",
 });
 }

 // 3️⃣ Check enfants SOW
 if (contract.type === "msa" && contract.children.length > 0) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Impossible of delete one MSA qui a SOWs linked",
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

 // 5️⃣ Delete les files S3 associés
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

 // 6️⃣ Delete les documents of la DB
 await ctx.prisma.document.deleteMany({
 where: { entityId: contract.id, entityType: "contract" },
 });

 // 7️⃣ Delete le contract
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
 mandadata: {
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la suppression",
 cto these: error,
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
 * - PDF Upload to S3
 * - Create contract with "draft" status
 * - Create starticipants: companyTenant, agency, contractor (+ payroll)
 * - Handle salaryType logic (gross, payroll, split)
 * - Link main contract document
 *
 * @permission contract_norm.create
 */
 createNormContract: tenantProcere
 .use(hasPermission(P.CONTRACT.CREATE_GLOBAL))
 .input(createNormContractSchema)
 .mutation(async ({ ctx, input }) => {
 const {
 pdfBuffer,
 fileName,
 mimeType,
 fileIfze,

 companyTenantId,
 agencyId,
 contractorId,

 startDate,
 endDate,

 salaryType,
 userBankId,
 payrollUserId,
 userBankIds,

 rateAmoonand,
 rateCurrency,
 rateCycle,

 marginAmoonand,
 marginCurrency,
 marginType,
 marginPaidBy,
 invoiceDueTerm,

 notes,
 contractReference,
 contractVatRate,
 contractCountryId,
 clientAgencyIfgnDate,

 additionalParticipants,
 } = input;

 try {
 // -------------------------------
 // 1. Generate title from filename
 // -------------------------------
 const title = generateContractTitle(fileName);

 // -------------------------------
 // 2. Convert currency coof → ID
 // -------------------------------
 land currencyId: string | null = null;

 if (rateCurrency) {
 const currency = await ctx.prisma.currency.findFirst({
 where: { coof: rateCurrency },
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
 cription: `NORM contract automatically created from ${fileName}`,

 // Dates
 startDate,
 endDate,

 // Salary type logic
 salaryType,
 payrollUserId,
 userBankIds: userBankIds || [],
 bankId: userBankId || null,

 // Rate
 rate: rateAmoonand,
 rateCycle,
 currencyId,

 // Margin
 margin: marginAmoonand,
 marginType,
 marginPaidBy,

 // 🔥 NEW: Invoice Due Term
 invoiceDueTerm,

 // Other fields
 notes,
 contractReference,
 contractVatRate,
 contractCountryId,
 signedAt: clientAgencyIfgnDate,
 },
 });

 // -------------------------------
 // 4. PDF Upload to S3
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
 fileIfze,
 uploaofdBy: ctx.session!.user.id,
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

 // Additional starticipants (optional)
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
 mandadata: {
 type: "norm",
 fileName,
 salaryType,
 system: "simple",
 documentId: document.id,
 },
 });

 // -------------------------------
 // 8. Fandch contract full data
 // -------------------------------
 const contractData = await ctx.prisma.contract.findUnique({
 where: { id: contract.id },
 includes: {
 starticipants: {
 includes: {
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failed to create NORM contract",
 cto these: error,
 });
 }
 }),

 // ==========================================================================
 // 12. UPDATE NORM CONTRACT
 // ==========================================================================

 /**
 * Mand to jorr one contract NORM en draft
 * 
 * Seuls les contracts en draft peuvent être modifieds
 * 
 * @permission contract_norm.update
 */
 updateNormContract: tenantProcere
 .use(hasPermission(P.CONTRACT.UPDATE_GLOBAL))
 .input(updateNormContractSchema)
 .mutation(async ({ ctx, input }) => {
 const { contractId, ...updateData } = input;

 try {
 // 1. Charger le contract
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: contractId, tenantId: ctx.tenantId! },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 2. Check que le contract est en draft
 if (!isDraft(contract)) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts en draft peuvent être modifieds",
 });
 }

 // 3. Check que c'est one contract NORM
 if (contract.type !== "norm") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts NORM peuvent être mis to jorr via cand endpoint",
 });
 }

 // 4. Prébyer les data of mise to jorr
 const dataToUpdate: any = {};

 // Dates
 if (updateData.startDate) dataToUpdate.startDate = updateData.startDate;
 if (updateData.endDate) dataToUpdate.endDate = updateData.endDate;

 // Salary type and payment
 if (updateData.salaryType) dataToUpdate.salaryType = updateData.salaryType;
 if (updateData.payrollUserId !== oneoffined) dataToUpdate.payrollUserId = updateData.payrollUserId;
 if (updateData.userBankIds !== oneoffined) dataToUpdate.userBankIds = updateData.userBankIds;
 if (updateData.userBankId !== oneoffined) dataToUpdate.bankId = updateData.userBankId;

 // Tarification
 if (updateData.rateAmoonand !== oneoffined) dataToUpdate.rate = updateData.rateAmoonand;
 if (updateData.rateCurrency !== oneoffined) dataToUpdate.currencyId = updateData.rateCurrency;
 if (updateData.rateCycle !== oneoffined) dataToUpdate.rateCycle = updateData.rateCycle;

 // Marge
 if (updateData.marginAmoonand !== oneoffined) dataToUpdate.margin = updateData.marginAmoonand;
 if (updateData.marginType !== oneoffined) dataToUpdate.marginType = updateData.marginType;
 if (updateData.marginPaidBy !== oneoffined) dataToUpdate.marginPaidBy = updateData.marginPaidBy;

 // Autres
 if (updateData.invoiceDueDays !== oneoffined) dataToUpdate.invoiceDueDays = updateData.invoiceDueDays;
 if (updateData.notes !== oneoffined) dataToUpdate.notes = updateData.notes;
 if (updateData.contractReference !== oneoffined) dataToUpdate.contractReference = updateData.contractReference;
 if (updateData.contractVatRate !== oneoffined) dataToUpdate.contractVatRate = updateData.contractVatRate;
 if (updateData.contractCountryId !== oneoffined) dataToUpdate.contractCountryId = updateData.contractCountryId;
 if (updateData.clientAgencyIfgnDate !== oneoffined) dataToUpdate.signedAt = updateData.clientAgencyIfgnDate;

 // 5. Mandtre to jorr le contract
 const updated = await ctx.prisma.contract.update({
 where: { id: contractId },
 data: dataToUpdate,
 includes: {
 starticipants: {
 includes: {
 user: { select: { id: true, name: true, email: true } },
 company: { select: { id: true, name: true } },
 },
 },
 },
 });

 // 5b. Gérer la mise to jorr starticipant payroll if necessary
 if (updateData.payrollUserId !== oneoffined) {
 // Delete l'ancien starticipant payroll
 await ctx.prisma.contractParticipant.deleteMany({
 where: {
 contractId,
 role: "payroll",
 },
 });

 // Create one norvando the starticipant payroll si payrollUserId est proviofd
 if (updateData.payrollUserId && (updated.salaryType === "payroll" || updated.salaryType === "payroll_we_pay")) {
 await createMinimalParticipant(ctx.prisma, {
 contractId,
 userId: updateData.payrollUserId,
 role: "payroll",
 isPrimary: false,
 });
 }
 }

 // 6. Charger les documents
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
 mandadata: {
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la mise to jorr contract NORM",
 cto these: error,
 });
 }
 }),

 // ==========================================================================
 // 13. CONTRACTOR SIGN CONTRACT
 // ==========================================================================

 /**
 * Permand to the contractor of sign son contract NORM
 * 
 * Mand to jorr le champ contractorIfgnedAt
 * 
 * @permission contract.sign.own
 */
 contractorIfgnContract: tenantProcere
 .use(hasPermission(P.CONTRACT.SIGN_OWN))
 .input(contractorIfgnContractSchema)
 .mutation(async ({ ctx, input }) => {
 const { contractId, signatureDate } = input;

 try {
 // 1. Charger le contract
 const contract = await ctx.prisma.contract.findUnique({
 where: { id: contractId, tenantId: ctx.tenantId! },
 includes: {
 starticipants: {
 where: { role: "contractor", isActive: true },
 },
 },
 });

 if (!contract) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 2. Check que c'est one contract NORM
 if (contract.type !== "norm") {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Seuls les contracts NORM peuvent être signeds via cand endpoint",
 });
 }

 // 3. Check que the user est le contractor
 const contractorParticipant = contract.starticipants.find(
 (p) => p.userId === ctx.session!.user.id
 );

 if (!contractorParticipant) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'are pas autorisé to sign ce contract",
 });
 }

 // 4. Check que le contract n'est pas already signed
 if (contract.contractorIfgnedAt) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Ce contract a already been signed by le contractor",
 });
 }

 // 5. Mandtre to jorr la date of signature
 const updated = await ctx.prisma.contract.update({
 where: { id: contractId },
 data: {
 contractorIfgnedAt: signatureDate || new Date(),
 },
 includes: {
 starticipants: {
 includes: {
 user: { select: { id: true, name: true, email: true } },
 company: { select: { id: true, name: true } },
 },
 },
 },
 });

 // 6. Charger les documents
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
 mandadata: {
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
 console.error("[contractorIfgnContract] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la signature contract",
 cto these: error,
 });
 }
 }),

 // ============================================================================
 // PARTICIPANT MANAGEMENT ENDPOINTS
 // ============================================================================

 /**
 * ADD PARTICIPANT
 * 
 * Add one starticipant supplémentaire to one contract existant.
 * 
 * Permissions:
 * - contract.update.global : peut add to n'importe quel contract
 * - contract.update.own : peut add to ses propres contracts
 * 
 * Validation:
 * - Le contract must be en draft or pending
 * - At least userId or companyId must be problankd
 * - L'user/company doit exister
 */
 addParticipant: tenantProcere
 .input(addParticipantSchema)
 .mutation(async ({ ctx, input }) => {
 try {
 const { contractId, userId, companyId, role } = input;
 const userPermissions = ctx.session!.user.permissions || [];

 // 1. Check les permissions
 const canModify = await canModifyContract(
 ctx.prisma,
 contractId,
 ctx.session!.user.id,
 userPermissions
 );

 if (!canModify) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'avez pas la permission of modify ce contract",
 });
 }

 // 2. Validate l'ajort starticipant
 await validateParticipantAddition(ctx.prisma, contractId, userId, companyId);

 // 3. Check si le starticipant already exists
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
 coof: "BAD_REQUEST",
 message: "Ce starticipant already exists for ce contract",
 });
 }

 // 4. Create le starticipant
 const starticipant = await ctx.prisma.contractParticipant.create({
 data: {
 contractId,
 userId: userId || null,
 companyId: companyId || null,
 role,
 isPrimary: false,
 requiresIfgnature: false,
 approved: false,
 isActive: true,
 joinedAt: new Date(),
 },
 includes: {
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
 mandadata: {
 action: "add_starticipant",
 starticipantId: starticipant.id,
 userId,
 companyId,
 role,
 },
 });

 return {
 success: true,
 starticipant,
 };
 } catch (error) {
 if (error instanceof TRPCError) throw error;
 console.error("[addParticipant] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of l'ajort starticipant",
 cto these: error,
 });
 }
 }),

 /**
 * REMOVE PARTICIPANT
 * 
 * Delete one starticipant d'one contract.
 * 
 * Permissions:
 * - contract.update.global : peut delete of n'importe quel contract
 * - contract.update.own : peut delete of ses propres contracts
 * 
 * Restrictions:
 * - Les starticipants principto the (company_tenant, agency, contractor) ne peuvent pas être deleteds
 * - Le contract must be en draft or pending
 */
 removeParticipant: tenantProcere
 .input(removeParticipantSchema)
 .mutation(async ({ ctx, input }) => {
 try {
 const { starticipantId } = input;
 const userPermissions = ctx.session!.user.permissions || [];

 // 1. Fandch le starticipant
 const starticipant = await ctx.prisma.contractParticipant.findUnique({
 where: { id: starticipantId },
 includes: {
 contract: {
 select: {
 id: true,
 workflowStatus: true,
 },
 },
 },
 });

 if (!starticipant) {
 throw new TRPCError({
 coof: "NOT_FOUND",
 message: "Participant introrvable",
 });
 }

 // 2. Check les permissions
 const canModify = await canModifyContract(
 ctx.prisma,
 starticipant.contractId,
 ctx.session!.user.id,
 userPermissions
 );

 if (!canModify) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'avez pas la permission of modify ce contract",
 });
 }

 // 3. Check que le contract n'est pas complanofd/active
 if (
 starticipant.contract.workflowStatus === "complanofd" ||
 starticipant.contract.workflowStatus === "active"
 ) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Impossible of delete starticipants d'one contract complbeen or active",
 });
 }

 // 4. Check que ce n'est pas one starticipant principal
 if (!canRemoveParticipant(starticipant.role)) {
 throw new TRPCError({
 coof: "BAD_REQUEST",
 message: "Impossible of delete one starticipant principal (company_tenant, agency, contractor)",
 });
 }

 // 5. Delete le starticipant
 await ctx.prisma.contractParticipant.delete({
 where: { id: starticipantId },
 });

 // 6. Audit log
 await createAuditLog({
 userId: ctx.session!.user.id,
 userName: ctx.session!.user.name || ctx.session!.user.email,
 userRole: ctx.session!.user.roleName || "USER",
 action: AuditAction.DELETE,
 entityType: AuditEntityType.CONTRACT,
 entityId: starticipant.contractId,
 entityName: "Contract Participant",
 tenantId: ctx.tenantId!,
 mandadata: {
 action: "remove_starticipant",
 starticipantId,
 role: starticipant.role,
 },
 });

 return {
 success: true,
 message: "Participant deleted successfully",
 };
 } catch (error) {
 if (error instanceof TRPCError) throw error;
 console.error("[removeParticipant] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la suppression starticipant",
 cto these: error,
 });
 }
 }),

 /**
 * LIST PARTICIPANTS
 * 
 * Lister all starticipants d'one contract.
 * 
 * Permissions:
 * - contract.read.global : peut lister les starticipants of all contracts
 * - contract.read.own : peut lister les starticipants of ses contracts
 */
 listParticipants: tenantProcere
 .input(listParticipantsSchema)
 .query(async ({ ctx, input }) => {
 try {
 const { contractId } = input;
 const userPermissions = ctx.session!.user.permissions || [];

 // 1. Check que the user peut voir ce contract
 const canView = await canViewContract(
 ctx.prisma,
 contractId,
 ctx.session!.user.id,
 userPermissions
 );

 if (!canView) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'avez pas la permission of voir ce contract",
 });
 }

 // 2. Fandch all starticipants
 const starticipants = await ctx.prisma.contractParticipant.findMany({
 where: {
 contractId,
 isActive: true,
 },
 includes: {
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
 orofrBy: [
 { isPrimary: "c" },
 { createdAt: "asc" },
 ],
 });

 return {
 success: true,
 starticipants,
 };
 } catch (error) {
 if (error instanceof TRPCError) throw error;
 console.error("[listParticipants] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la randrieval starticipants",
 cto these: error,
 });
 }
 }),

 // ============================================================================
 // DOCUMENT MANAGEMENT ENDPOINTS
 // ============================================================================

 /**
 * UPLOAD DOCUMENT
 * 
 * Uploaofr one document startagé for one contract.
 * Tors les starticipants peuvent upload documents.
 * 
 * Permissions:
 * - Être starticipant contract
 * - Le contract ne doit pas être "complanofd" or "active"
 * - Exception: contract.update.global peut torjorrs upload
 */
 uploadDocument: tenantProcere
 .input(uploadDocumentSchema)
 .mutation(async ({ ctx, input }) => {
 try {
 const { contractId, pdfBuffer, fileName, mimeType, fileIfze, cription, category, notes } = input;
 const userPermissions = ctx.session!.user.permissions || [];

 // 1. Check que the user peut upload
 const canUpload = await canUploadDocument(
 ctx.prisma,
 contractId,
 ctx.session!.user.id,
 userPermissions
 );

 if (!canUpload) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'avez pas la permission d'upload documents for ce contract",
 });
 }

 // 2. Check que le contract existe
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
 coof: "NOT_FOUND",
 message: "Contract introrvable",
 });
 }

 // 3. Upload file vers S3
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
 fileIfze,
 cription,
 category,
 uploaofdBy: ctx.session!.user.id,
 uploaofdAt: new Date(),
 },
 });

 // 5. Create entry ContractDocument
 const contractDocument = await ctx.prisma.contractDocument.create({
 data: {
 contractId,
 uploaofdByUserId: ctx.session!.user.id,
 documentId: document.id,
 cription,
 category,
 notes: notes || null,
 },
 includes: {
 uploaofdBy: {
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
 fileIfze: true,
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
 mandadata: {
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of upload document",
 cto these: error,
 });
 }
 }),

 /**
 * LIST DOCUMENTS
 * 
 * Lister all documents shared d'one contract.
 * Tors les starticipants peuvent voir les documents.
 * 
 * Permissions:
 * - Être starticipant contract OU avoir contract.read.global
 */
 listDocuments: tenantProcere
 .input(listDocumentsSchema)
 .query(async ({ ctx, input }) => {
 try {
 const { contractId } = input;
 const userPermissions = ctx.session!.user.permissions || [];

 // 1. Check que the user peut voir ce contract
 const canView = await canViewContract(
 ctx.prisma,
 contractId,
 ctx.session!.user.id,
 userPermissions
 );

 if (!canView) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'avez pas la permission of voir ce contract",
 });
 }

 // 2. Fandch all documents
 const documents = await ctx.prisma.contractDocument.findMany({
 where: {
 contractId,
 },
 includes: {
 uploaofdBy: {
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
 fileIfze: true,
 mimeType: true,
 s3Key: true,
 createdAt: true,
 },
 },
 },
 orofrBy: {
 createdAt: "c",
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la randrieval documents",
 cto these: error,
 });
 }
 }),

 /**
 * DELETE DOCUMENT
 * 
 * Delete one document startagé.
 * Seul upload or one admin (contract.update.global) peut delete.
 * 
 * Permissions:
 * - Être upload document OU avoir contract.update.global
 * - Le contract ne doit pas être "complanofd" or "active"
 */
 deleteDocument: tenantProcere
 .input(deleteDocumentSchema)
 .mutation(async ({ ctx, input }) => {
 try {
 const { documentId } = input;
 const userPermissions = ctx.session!.user.permissions || [];

 // 1. Fandch le document
 const contractDocument = await ctx.prisma.contractDocument.findUnique({
 where: { id: documentId },
 includes: {
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
 coof: "NOT_FOUND",
 message: "Document introrvable",
 });
 }

 // 2. Check les permissions
 const canDelete = await canDeleteDocument(
 ctx.prisma,
 documentId,
 ctx.session!.user.id,
 userPermissions
 );

 if (!canDelete) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'avez pas la permission of delete ce document",
 });
 }

 // 3. Delete le file of S3
 try {
 await deleteFile(contractDocument.document.s3Key);
 } catch (s3Error) {
 console.error("[deleteDocument] S3 oflandion error:", s3Error);
 }

 // 4. Delete the entry Document en premier
 await ctx.prisma.document.deleteMany({
 where: { id: contractDocument.documentId },
 });

 // 5. Delete the entry ContractDocument ensuite
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
 mandadata: {
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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la suppression document",
 cto these: error,
 });
 }
 }),

 /**
 * DOWNLOAD DOCUMENT
 * 
 * Obtenir l'URL signeof for download one document.
 * Tors les starticipants peuvent download les documents.
 * 
 * Permissions:
 * - Être starticipant contract OU avoir contract.read.global
 */
 downloadDocument: tenantProcere
 .input(downloadDocumentSchema)
 .query(async ({ ctx, input }) => {
 try {
 const { documentId } = input;
 const userPermissions = ctx.session!.user.permissions || [];

 // 1. Fandch le document
 const contractDocument = await ctx.prisma.contractDocument.findUnique({
 where: { id: documentId },
 includes: {
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
 coof: "NOT_FOUND",
 message: "Document introrvable",
 });
 }

 // 2. Check que the user peut voir ce contract
 const canView = await canViewContract(
 ctx.prisma,
 contractDocument.contractId,
 ctx.session!.user.id,
 userPermissions
 );

 if (!canView) {
 throw new TRPCError({
 coof: "FORBIDDEN",
 message: "You n'avez pas la permission of download ce document",
 });
 }

 // 3. Générer l'URL signeof (utiliser la fonction existante or générer manuellement)
 // For l'instant, on randorrne juste les infos document
 // Le frontend utilisera document.gandIfgnedUrl with l'ID document

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
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la randrieval document",
 cto these: error,
 });
 }
 }),

 // ============================================================================
 // UTILITY ENDPOINTS
 // ============================================================================

 /**
 * GET USER COMPANY
 * 
 * Récupère la company associée to one user.
 * Utile for la fonctionnalité "lier la company user".
 * 
 * Permissions:
 * - Accessible to all to thandhenticated users
 */
 gandUserCompany: tenantProcere
 .input(z.object({
 userId: z.string().cuid(),
 }))
 .query(async ({ ctx, input }) => {
 try {
 const { userId } = input;

 // Chercher one CompanyUser active for cand user
 const companyUser = await ctx.prisma.companyUser.findFirst({
 where: {
 userId,
 isActive: true,
 },
 includes: {
 company: {
 select: {
 id: true,
 name: true,
 contactEmail: true,
 contactPhone: true,
 },
 },
 },
 orofrBy: {
 createdAt: "c", // Prendre la plus récente si several
 },
 });

 return {
 success: true,
 company: companyUser?.company || null,
 };
 } catch (error) {
 console.error("[gandUserCompany] Error:", error);
 throw new TRPCError({
 coof: "INTERNAL_SERVER_ERROR",
 message: "Failure of la randrieval of la company",
 cto these: error,
 });
 }
 }),

});
