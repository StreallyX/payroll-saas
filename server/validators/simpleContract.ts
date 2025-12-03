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

/**
 * Schéma pour un participant supplémentaire
 * Au moins un de userId ou companyId doit être fourni
 */
export const additionalParticipantSchema = z.object({
  userId: z.string()
    .cuid("L'ID du user doit être un CUID valide")
    .optional(),
  companyId: z.string()
    .cuid("L'ID de la company doit être un CUID valide")
    .optional(),
  role: z.string()
    .min(1, "Le rôle est requis")
    .max(50, "Le rôle est trop long (max 50 caractères)")
    .default("additional"),
})
.refine(
  (data) => data.userId || data.companyId,
  {
    message: "Au moins un de userId ou companyId doit être fourni",
    path: ["userId"],
  }
);

/**
 * Tableau de participants supplémentaires pour la création de contrats
 */
export const additionalParticipantsSchema = z.array(additionalParticipantSchema)
  .optional()
  .default([]);

// ============================================================================
// SCHÉMAS POUR LES ENDPOINTS
// ============================================================================

/**
 * 1. CREATE SIMPLE MSA
 * 
 * Input: PDF + informations minimales + participants supplémentaires
 * Output: Contrat MSA créé avec statut "draft"
 */
export const createSimpleMSASchema = pdfFileSchema.extend({
  companyId: z.string()
    .cuid("L'ID de la company doit être un CUID valide")
    .optional(),
  additionalParticipants: additionalParticipantsSchema,
});

/**
 * 2. CREATE SIMPLE SOW
 * 
 * Input: PDF + MSA parent + informations minimales + participants supplémentaires
 * Output: Contrat SOW créé avec statut "draft"
 */
export const createSimpleSOWSchema = pdfFileSchema.extend({
  parentMSAId: z.string()
    .cuid("L'ID du MSA parent doit être un CUID valide")
    .min(1, "L'ID du MSA parent est requis"),
  companyId: z.string()
    .cuid("L'ID de la company doit être un CUID valide")
    .optional(),
  additionalParticipants: additionalParticipantsSchema,
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
 * 7B. UPDATE SIMPLE CONTRACT (TITRE ET DESCRIPTION)
 * 
 * Permet de mettre à jour le titre et la description d'un contrat MSA/SOW/NORM
 */
export const updateSimpleContractSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  title: z.string()
    .min(1, "Le titre est requis")
    .max(200, "Le titre est trop long (max 200 caractères)")
    .optional(),
  description: z.string()
    .max(1000, "La description est trop longue (max 1000 caractères)")
    .optional(),
});

/**
 * 8. LIST SIMPLE CONTRACTS
 * 
 * Filtres et pagination pour la liste des contrats
 */
export const listSimpleContractsSchema = z.object({
  type: z.enum(["all", "msa", "sow", "norm"]).default("all"),
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
export type UpdateSimpleContractInput = z.infer<typeof updateSimpleContractSchema>;
export type ListSimpleContractsInput = z.infer<typeof listSimpleContractsSchema>;
export type GetSimpleContractByIdInput = z.infer<typeof getSimpleContractByIdSchema>;
export type DeleteDraftContractInput = z.infer<typeof deleteDraftContractSchema>;

// ============================================================================
// NORM CONTRACT SCHEMAS
// ============================================================================

/**
 * Schéma de base pour les champs communs des contrats NORM
 */
const normContractBaseFields = {
  // Champs essentiels (parties)
  companyTenantId: z.string()
    .cuid("L'ID de la company tenant doit être un CUID valide"),
  agencyId: z.string()
    .cuid("L'ID de l'agency doit être un CUID valide"),
  contractorId: z.string()
    .cuid("L'ID du contractor doit être un CUID valide"),
  
  // Dates (essentielles)
  startDate: z.string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  endDate: z.string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  
  // Salary Type (essentiel)
  salaryType: z.enum(["gross", "payroll", "payroll_we_pay", "split"], {
    errorMap: () => ({ 
      message: "Le type de salaire doit être: gross, payroll, payroll_we_pay ou split" 
    }),
  }),
  
  // Champs conditionnels selon salaryType
  userBankId: z.string().cuid().optional(), // Pour Gross
  payrollUserId: z.string().cuid().optional(), // Pour Payroll et Payroll We Pay
  userBankIds: z.array(z.string().cuid()).optional(), // Pour Split
  
  // Champs optionnels - Tarification
  rateAmount: z.number()
    .positive("Le montant du taux doit être positif")
    .optional(),
  rateCurrency: z.string()
    .min(3, "La devise doit contenir au moins 3 caractères")
    .max(3, "La devise doit contenir 3 caractères")
    .optional(),
  rateCycle: z.enum(["daily", "weekly", "monthly", "yearly", "hourly"], {
    errorMap: () => ({ 
      message: "Le cycle doit être: daily, weekly, monthly, yearly ou hourly" 
    }),
  }).optional(),
  
  // Champs optionnels - Marge
  marginAmount: z.number()
    .positive("Le montant de la marge doit être positif")
    .optional(),
  marginCurrency: z.string()
    .min(3, "La devise doit contenir au moins 3 caractères")
    .max(3, "La devise doit contenir 3 caractères")
    .optional(),
  marginType: z.enum(["fixed", "percentage"], {
    errorMap: () => ({ message: "Le type de marge doit être: fixed ou percentage" }),
  }).optional(),
  marginPaidBy: z.enum(["client", "agency"], {
    errorMap: () => ({ message: "La marge doit être payée par: client ou agency" }),
  }).optional(),

  invoiceDueTerm: z.enum([
    "upon_receipt",
    "7_days",
    "15_days",
    "30_days",
    "45_days",
  ], {
    errorMap: () => ({ message: "Invoice Due Term invalide" }),
  }).optional(),

  // Champs optionnels - Autres
  invoiceDueDays: z.number()
    .int("Le nombre de jours doit être un entier")
    .positive("Le nombre de jours doit être positif")
    .max(365, "Le nombre de jours ne peut pas dépasser 365")
    .optional(),
  notes: z.string()
    .max(5000, "Les notes sont trop longues (max 5000 caractères)")
    .optional(),
  contractReference: z.string()
    .max(255, "La référence est trop longue (max 255 caractères)")
    .optional(),
  contractVatRate: z.number()
    .min(0, "Le taux de TVA doit être entre 0 et 100")
    .max(100, "Le taux de TVA doit être entre 0 et 100")
    .optional(),
  contractCountryId: z.string()
    .cuid("L'ID du pays doit être un CUID valide")
    .optional(),
  
  // Dates de signature (optionnelles)
  clientAgencySignDate: z.string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(),
};

/**
 * 11. CREATE NORM CONTRACT
 * 
 * Crée un contrat NORM avec validation conditionnelle selon salaryType
 */
export const createNormContractSchema = pdfFileSchema
  .extend(normContractBaseFields)
  .extend({
    additionalParticipants: additionalParticipantsSchema,
  })
  .refine(
    (data) => {
      // Validation des dates
      if (data.startDate >= data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "La date de début doit être antérieure à la date de fin",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // Validation conditionnelle selon salaryType
      if (data.salaryType === "gross") {
        return true;
      }
      if (data.salaryType === "payroll" || data.salaryType === "payroll_we_pay") {
        return !!data.payrollUserId;
      }
      if (data.salaryType === "split") {
        return true;
      }
      return true;
    },
    {
      message: "Champ requis selon le type de salaire sélectionné",
      path: ["salaryType"],
    }
  );

/**
 * 12. UPDATE NORM CONTRACT
 * 
 * Met à jour un contrat NORM (draft uniquement)
 * Tous les champs sont optionnels sauf contractId
 */
export const updateNormContractSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  
  // Tous les champs optionnels
  companyTenantId: z.string().cuid().optional(),
  agencyId: z.string().cuid().optional(),
  contractorId: z.string().cuid().optional(),
  
  startDate: z.string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(),
  endDate: z.string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(),
  
  salaryType: z.enum(["gross", "payroll", "payroll_we_pay", "split"]).optional(),
  userBankId: z.string().optional(),
  payrollUserId: z.string().cuid().optional(),
  userBankIds: z.array(z.string().cuid()).optional(),
  
  rateAmount: z.number().positive().optional(),
  rateCurrency: z.string().min(3).max(3).optional(),
  rateCycle: z.enum(["daily", "weekly", "monthly", "yearly", "hourly"]).optional(),
  
  marginAmount: z.number().positive().optional(),
  marginCurrency: z.string().min(3).max(3).optional(),
  marginType: z.enum(["fixed", "percentage"]).optional(),
  marginPaidBy: z.enum(["client", "agency"]).optional(),
  
  invoiceDueDays: z.number().int().positive().max(365).optional(),
  notes: z.string().max(5000).optional(),
  contractReference: z.string().max(255).optional(),
  contractVatRate: z.number().min(0).max(100).optional(),
  contractCountryId: z.string().cuid().optional(),
  
  clientAgencySignDate: z.string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(),
})
.refine(
  (data) => {
    // Validation des dates si les deux sont présentes
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      return false;
    }
    return true;
  },
  {
    message: "La date de début doit être antérieure à la date de fin",
    path: ["endDate"],
  }
);

/**
 * 13. CONTRACTOR SIGN CONTRACT
 * 
 * Permet au contractor de signer son contrat
 */
export const contractorSignContractSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  signatureDate: z.string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(), // Si non fourni, on utilise la date actuelle
});

// ============================================================================
// TYPES EXPORTÉS POUR NORM
// ============================================================================

export type CreateNormContractInput = z.infer<typeof createNormContractSchema>;
export type UpdateNormContractInput = z.infer<typeof updateNormContractSchema>;
export type ContractorSignContractInput = z.infer<typeof contractorSignContractSchema>;

// ============================================================================
// ADDITIONAL PARTICIPANTS SCHEMAS
// ============================================================================

/**
 * 14. ADD PARTICIPANT
 * 
 * Ajouter un participant à un contrat existant
 */
export const addParticipantSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  userId: z.string()
    .cuid("L'ID du user doit être un CUID valide")
    .optional(),
  companyId: z.string()
    .cuid("L'ID de la company doit être un CUID valide")
    .optional(),
  role: z.string()
    .min(1, "Le rôle est requis")
    .max(50, "Le rôle est trop long (max 50 caractères)")
    .default("additional"),
})
.refine(
  (data) => data.userId || data.companyId,
  {
    message: "Au moins un de userId ou companyId doit être fourni",
    path: ["userId"],
  }
);

/**
 * 15. REMOVE PARTICIPANT
 * 
 * Supprimer un participant d'un contrat
 */
export const removeParticipantSchema = z.object({
  participantId: z.string()
    .cuid("L'ID du participant doit être un CUID valide")
    .min(1, "L'ID du participant est requis"),
});

/**
 * 16. LIST PARTICIPANTS
 * 
 * Lister tous les participants d'un contrat
 */
export const listParticipantsSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
});

// ============================================================================
// CONTRACT DOCUMENTS SCHEMAS
// ============================================================================

/**
 * Catégories de documents disponibles
 */
export const documentCategoryEnum = z.enum([
  "Contract",
  "Invoice",
  "ID Document",
  "Signature",
  "Other",
]);

/**
 * 17. UPLOAD DOCUMENT
 * 
 * Uploader un document pour un contrat
 */
export const uploadDocumentSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
  pdfBuffer: z.string()
    .min(1, "Le fichier ne peut pas être vide"),
  fileName: z.string()
    .min(1, "Le nom du fichier est requis")
    .max(255, "Le nom du fichier est trop long (max 255 caractères)"),
  mimeType: z.string()
    .min(1, "Le type MIME est requis"),
  fileSize: z.number()
    .int("La taille du fichier doit être un entier")
    .positive("La taille du fichier doit être positive")
    .max(MAX_PDF_SIZE, `Le fichier est trop volumineux (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
  description: z.string()
    .min(1, "La description est requise")
    .max(500, "La description est trop longue (max 500 caractères)"),
  category: documentCategoryEnum,
  notes: z.string()
    .max(1000, "Les notes sont trop longues (max 1000 caractères)")
    .optional(),
});

/**
 * 18. LIST DOCUMENTS
 * 
 * Lister tous les documents d'un contrat
 */
export const listDocumentsSchema = z.object({
  contractId: z.string()
    .cuid("L'ID du contrat doit être un CUID valide")
    .min(1, "L'ID du contrat est requis"),
});

/**
 * 19. DELETE DOCUMENT
 * 
 * Supprimer un document
 */
export const deleteDocumentSchema = z.object({
  documentId: z.string()
    .cuid("L'ID du document doit être un CUID valide")
    .min(1, "L'ID du document est requis"),
});

/**
 * 20. DOWNLOAD DOCUMENT
 * 
 * Obtenir l'URL signée pour télécharger un document
 */
export const downloadDocumentSchema = z.object({
  documentId: z.string()
    .cuid("L'ID du document doit être un CUID valide")
    .min(1, "L'ID du document est requis"),
});

// ============================================================================
// TYPES EXPORTÉS POUR PARTICIPANTS ET DOCUMENTS
// ============================================================================

export type AdditionalParticipantInput = z.infer<typeof additionalParticipantSchema>;
export type AdditionalParticipantsInput = z.infer<typeof additionalParticipantsSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type RemoveParticipantInput = z.infer<typeof removeParticipantSchema>;
export type ListParticipantsInput = z.infer<typeof listParticipantsSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
export type DownloadDocumentInput = z.infer<typeof downloadDocumentSchema>;
