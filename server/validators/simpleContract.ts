/**
 * Validators Zod pour le système simplifié de contrats MSA/SOW
 * 
 * Ce fichier contient tous les schémas de validation pour les endpoints
 * du router simpleContract.
 */

import { z } from "zod";

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["application/pdf"];

// ============================================================================
// SCHÉMAS DE BASE
// ============================================================================

/**
 * Schéma pour la validation d'un fichier PDF encodé en base64
 */
export const pdfFileSchema = z.object({
  pdfBuffer: z.string()
    .min(1, "Le fichier PDF ne peut pas être vide")
    .refine(
      (val) => {
        try {
          // Vérifier que c'est du base64 valide
          const decoded = Buffer.from(val, "base64");
          return decoded.length > 0;
        } catch {
          return false;
        }
      },
      { message: "Le buffer PDF doit être encodé en base64 valide" }
    ),
  fileName: z.string()
    .min(1, "Le nom du fichier est requis")
    .max(255, "Le nom du fichier est trop long (max 255 caractères)")
    .refine(
      (val) => val.toLowerCase().endsWith(".pdf"),
      { message: "Le fichier doit avoir l'extension .pdf" }
    ),
  mimeType: z.enum(["application/pdf"], {
    errorMap: () => ({ message: "Seuls les fichiers PDF sont acceptés" }),
  }),
  fileSize: z.number()
    .int("La taille du fichier doit être un entier")
    .positive("La taille du fichier doit être positive")
    .max(MAX_PDF_SIZE, `Le fichier est trop volumineux (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
});

// ============================================================================
// SCHÉMAS POUR LES ENDPOINTS
// ============================================================================

/**
 * 1. CREATE SIMPLE MSA
 * 
 * Input: PDF + informations minimales
 * Output: Contrat MSA créé avec statut "draft"
 */
export const createSimpleMSASchema = pdfFileSchema.extend({
  companyId: z.string()
    .cuid("L'ID de la company doit être un CUID valide")
    .optional(),
});

/**
 * 2. CREATE SIMPLE SOW
 * 
 * Input: PDF + MSA parent + informations minimales
 * Output: Contrat SOW créé avec statut "draft"
 */
export const createSimpleSOWSchema = pdfFileSchema.extend({
  parentMSAId: z.string()
    .cuid("L'ID du MSA parent doit être un CUID valide")
    .min(1, "L'ID du MSA parent est requis"),
  companyId: z.string()
    .cuid("L'ID de la company doit être un CUID valide")
    .optional(),
});

/**
 * 3. SUBMIT FOR REVIEW
 * 
 * Transition: draft → pending_admin_review
 */
export const submitForReviewSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  notes: z.string()
    .max(5000, "Les notes sont trop longues (max 5000 caractères)")
    .optional(),
});

/**
 * 4. ADMIN APPROVE
 * 
 * Transition: pending_admin_review → completed
 */
export const adminApproveSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  notes: z.string()
    .max(5000, "Les notes sont trop longues (max 5000 caractères)")
    .optional(),
});

/**
 * 5. ADMIN REJECT
 * 
 * Transition: pending_admin_review → draft
 */
export const adminRejectSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  reason: z.string()
    .min(10, "La raison du rejet doit contenir au moins 10 caractères")
    .max(5000, "La raison du rejet est trop longue (max 5000 caractères)"),
});

/**
 * 6. UPLOAD SIGNED VERSION
 * 
 * Upload d'une version signée du contrat (completed/active)
 */
export const uploadSignedVersionSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  pdfBuffer: z.string()
    .min(1, "Le fichier PDF ne peut pas être vide"),
  fileName: z.string()
    .min(1, "Le nom du fichier est requis")
    .max(255, "Le nom du fichier est trop long")
    .refine(
      (val) => val.toLowerCase().endsWith(".pdf"),
      { message: "Le fichier doit avoir l'extension .pdf" }
    ),
  mimeType: z.enum(["application/pdf"]),
  fileSize: z.number()
    .int()
    .positive()
    .max(MAX_PDF_SIZE, `Le fichier est trop volumineux (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
});

/**
 * 7. ACTIVATE CONTRACT
 * 
 * Transition: completed → active
 */
export const activateContractSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  notes: z.string()
    .max(5000, "Les notes sont trop longues (max 5000 caractères)")
    .optional(),
});

/**
 * 8. LIST SIMPLE CONTRACTS
 * 
 * Filtres et pagination pour la liste des contrats
 */
export const listSimpleContractsSchema = z.object({
  type: z.enum(["all", "msa", "sow"]).default("all"),
  status: z.enum([
    "all",
    "draft",
    "pending_admin_review",
    "completed",
    "active",
    "cancelled",
  ]).default("all"),
  search: z.string().max(255).optional(),
  parentMSAId: z.string().cuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * 9. GET SIMPLE CONTRACT BY ID
 * 
 * Récupération d'un contrat par son ID
 */
export const getSimpleContractByIdSchema = z.object({
  id: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
});

/**
 * 10. DELETE DRAFT CONTRACT
 * 
 * Suppression d'un contrat en draft uniquement
 */
export const deleteDraftContractSchema = z.object({
  id: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
});

// ============================================================================
// TYPES EXPORTÉS (inférés depuis les schémas)
// ============================================================================

export type CreateSimpleMSAInput = z.infer<typeof createSimpleMSASchema>;
export type CreateSimpleSOWInput = z.infer<typeof createSimpleSOWSchema>;
export type SubmitForReviewInput = z.infer<typeof submitForReviewSchema>;
export type AdminApproveInput = z.infer<typeof adminApproveSchema>;
export type AdminRejectInput = z.infer<typeof adminRejectSchema>;
export type UploadSignedVersionInput = z.infer<typeof uploadSignedVersionSchema>;
export type ActivateContractInput = z.infer<typeof activateContractSchema>;
export type ListSimpleContractsInput = z.infer<typeof listSimpleContractsSchema>;
export type GetSimpleContractByIdInput = z.infer<typeof getSimpleContractByIdSchema>;
export type DeleteDraftContractInput = z.infer<typeof deleteDraftContractSchema>;
