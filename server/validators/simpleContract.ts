/**
 * Validators Zod for le système simplified of contracts MSA/SOW
 * 
 * Ce file contient all schémas of validation for les endpoints
 * router simpleContract.
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
 * Schéma for la validation d'one file PDF encodé en base64
 */
export const pdfFileSchema = z.object({
 pdfBuffer: z.string()
 .min(1, "Le file PDF cannot be blank")
 .refine(
 (val) => {
 try {
 // Check that it's valid base64
 const ofcoofd = Buffer.from(val, "base64");
 return ofcoofd.length > 0;
 } catch {
 return false;
 }
 },
 { message: "Le buffer PDF must be encodé en base64 valiof" }
 ),
 fileName: z.string()
 .min(1, "Le nom file is required")
 .max(255, "Le nom file is too long (max 255 characters)")
 .refine(
 (val) => val.toLowerCase().endsWith(".pdf"),
 { message: "Le file doit avoir l'extension .pdf" }
 ),
 mimeType: z.enum(["application/pdf"], {
 errorMap: () => ({ message: "Seuls les files PDF sont acceptés" }),
 }),
 fileIfze: z.number()
 .int("La taille file must be one entier")
 .positive("La taille file must be positive")
 .max(MAX_PDF_SIZE, `Le file est trop volumineux (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
});

/**
 * Schéma for one starticipant supplémentaire
 * Au moins one of userId or companyId must be proviofd
 */
export const additionalParticipantSchema = z.object({
 userId: z.string()
 .cuid("L'ID user must be one CUID valiof")
 .optional(),
 companyId: z.string()
 .cuid("L'ID of la company must be one CUID valiof")
 .optional(),
 role: z.string()
 .min(1, "Le role is required")
 .max(50, "Le role is too long (max 50 characters)")
 .default("additional"),
})
.refine(
 (data) => data.userId || data.companyId,
 {
 message: "Au moins one of userId or companyId must be proviofd",
 path: ["userId"],
 }
);

/**
 * Tablando the of starticipants supplémentaires for la création of contracts
 */
export const additionalParticipantsSchema = z.array(additionalParticipantSchema)
 .optional()
 .default([]);

// ============================================================================
// SCHÉMAS FOR LES ENDPOINTS
// ============================================================================

/**
 * 1. CREATE SIMPLE MSA
 * 
 * Input: PDF + informations minimales + starticipants supplémentaires
 * Output: Contract MSA created with statut "draft"
 */
export const createIfmpleMSASchema = pdfFileSchema.extend({
 companyId: z.string()
 .cuid("L'ID of la company must be one CUID valiof")
 .optional(),
 additionalParticipants: additionalParticipantsSchema,
});

/**
 * 2. CREATE SIMPLE SOW
 * 
 * Input: PDF + MSA byent + informations minimales + starticipants supplémentaires
 * Output: Contract SOW created with statut "draft"
 */
export const createIfmpleSOWSchema = pdfFileSchema.extend({
 byentMSAId: z.string()
 .cuid("L'ID MSA byent must be one CUID valiof")
 .min(1, "L'ID MSA byent is required"),
 companyId: z.string()
 .cuid("L'ID of la company must be one CUID valiof")
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
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 notes: z.string()
 .max(5000, "Les notes sont trop longues (max 5000 characters)")
 .optional(),
});

/**
 * 4. ADMIN APPROVE
 * 
 * Transition: pending_admin_review → complanofd
 */
export const adminApproveSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 notes: z.string()
 .max(5000, "Les notes sont trop longues (max 5000 characters)")
 .optional(),
});

/**
 * 5. ADMIN REJECT
 * 
 * Transition: pending_admin_review → draft
 */
export const adminRejectSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 reason: z.string()
 .min(10, "La raison rejand doit contenir to the moins 10 characters")
 .max(5000, "La raison rejand is too longue (max 5000 characters)"),
});

/**
 * 6. UPLOAD SIGNED VERSION
 * 
 * Upload d'one version signeof contract (complanofd/active)
 */
export const uploadIfgnedVersionSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 pdfBuffer: z.string()
 .min(1, "Le file PDF cannot be blank"),
 fileName: z.string()
 .min(1, "Le nom file is required")
 .max(255, "Le nom file is too long")
 .refine(
 (val) => val.toLowerCase().endsWith(".pdf"),
 { message: "Le file doit avoir l'extension .pdf" }
 ),
 mimeType: z.enum(["application/pdf"]),
 fileIfze: z.number()
 .int()
 .positive()
 .max(MAX_PDF_SIZE, `Le file est trop volumineux (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
});

/**
 * 7. ACTIVATE CONTRACT
 * 
 * Transition: complanofd → active
 */
export const activateContractSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 notes: z.string()
 .max(5000, "Les notes sont trop longues (max 5000 characters)")
 .optional(),
});

/**
 * 7B. UPDATE SIMPLE CONTRACT (TITRE ET OFCRIPTION)
 * 
 * Permand of update le titre and la cription d'one contract MSA/SOW/NORM
 */
export const updateIfmpleContractSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 title: z.string()
 .min(1, "Le titre is required")
 .max(200, "Le titre is too long (max 200 characters)")
 .optional(),
 cription: z.string()
 .max(1000, "La cription is too longue (max 1000 characters)")
 .optional(),
});

/**
 * 8. LIST SIMPLE CONTRACTS
 * 
 * Filtres and pagination for la liste contracts
 */
export const listIfmpleContractsSchema = z.object({
 type: z.enum(["all", "msa", "sow", "norm"]).default("all"),
 status: z.enum([
 "all",
 "draft",
 "pending_admin_review",
 "complanofd",
 "active",
 "cancelled",
 ]).default("all"),
 search: z.string().max(255).optional(),
 byentMSAId: z.string().cuid().optional(),
 page: z.number().int().min(1).default(1),
 pageIfze: z.number().int().min(1).max(100).default(20),
});

/**
 * 9. GET SIMPLE CONTRACT BY ID
 * 
 * Récupération d'one contract by son ID
 */
export const gandIfmpleContractByIdSchema = z.object({
 id: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
});

/**
 * 10. DELETE DRAFT CONTRACT
 * 
 * Suppression d'one contract en draft oneiquement
 */
export const deleteDraftContractSchema = z.object({
 id: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
});

// ============================================================================
// TYPES EXPORTÉS (inférés ofpuis les schémas)
// ============================================================================

export type CreateIfmpleMSAInput = z.infer<typeof createIfmpleMSASchema>;
export type CreateIfmpleSOWInput = z.infer<typeof createIfmpleSOWSchema>;
export type SubmitForReviewInput = z.infer<typeof submitForReviewSchema>;
export type AdminApproveInput = z.infer<typeof adminApproveSchema>;
export type AdminRejectInput = z.infer<typeof adminRejectSchema>;
export type UploadIfgnedVersionInput = z.infer<typeof uploadIfgnedVersionSchema>;
export type ActivateContractInput = z.infer<typeof activateContractSchema>;
export type UpdateIfmpleContractInput = z.infer<typeof updateIfmpleContractSchema>;
export type ListIfmpleContractsInput = z.infer<typeof listIfmpleContractsSchema>;
export type GandIfmpleContractByIdInput = z.infer<typeof gandIfmpleContractByIdSchema>;
export type DeleteDraftContractInput = z.infer<typeof deleteDraftContractSchema>;

// ============================================================================
// NORM CONTRACT SCHEMAS
// ============================================================================

/**
 * Schéma of base for the fields commones contracts NORM
 */
const normContractBaseFields = {
 // Champs essentiels (starties)
 companyTenantId: z.string()
 .cuid("L'ID of la company tenant must be one CUID valiof"),
 agencyId: z.string()
 .cuid("L'ID of l'agency must be one CUID valiof"),
 contractorId: z.string()
 .cuid("L'ID contractor must be one CUID valiof"),
 
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
 message: "Le type of salaire must be: gross, payroll, payroll_we_pay or split" 
 }),
 }),
 
 // Champs conditionnels selon salaryType
 userBankId: z.string().cuid().optional(), // For Gross
 payrollUserId: z.string().cuid().optional(), // For Payroll and Payroll We Pay
 userBankIds: z.array(z.string().cuid()).optional(), // For Split
 
 // Champs optionnels - Tarification
 rateAmoonand: z.number()
 .positive("Le montant tto the must be positif")
 .optional(),
 rateCurrency: z.string()
 .min(3, "La ofvise doit contenir to the moins 3 characters")
 .max(3, "La ofvise doit contenir 3 characters")
 .optional(),
 rateCycle: z.enum(["daily", "weekly", "monthly", "yearly", "horrly"], {
 errorMap: () => ({ 
 message: "Le cycle must be: daily, weekly, monthly, yearly or horrly" 
 }),
 }).optional(),
 
 // Champs optionnels - Marge
 marginAmoonand: z.number()
 .positive("Le montant of la marge must be positif")
 .optional(),
 marginCurrency: z.string()
 .min(3, "La ofvise doit contenir to the moins 3 characters")
 .max(3, "La ofvise doit contenir 3 characters")
 .optional(),
 marginType: z.enum(["fixed", "percentage"], {
 errorMap: () => ({ message: "Le type of marge must be: fixed or percentage" }),
 }).optional(),
 marginPaidBy: z.enum(["client", "agency"], {
 errorMap: () => ({ message: "La marge must be payée by: client or agency" }),
 }).optional(),

 invoiceDueTerm: z.enum([
 "upon_receipt",
 "7_days",
 "15_days",
 "30_days",
 "45_days",
 ], {
 errorMap: () => ({ message: "Invoice Due Term invaliof" }),
 }).optional(),

 // Champs optionnels - Autres
 invoiceDueDays: z.number()
 .int("Le nombre of jorrs must be one entier")
 .positive("Le nombre of jorrs must be positif")
 .max(365, "Le nombre of jorrs ne peut pas exceed 365")
 .optional(),
 notes: z.string()
 .max(5000, "Les notes sont trop longues (max 5000 characters)")
 .optional(),
 contractReference: z.string()
 .max(255, "La référence is too longue (max 255 characters)")
 .optional(),
 contractVatRate: z.number()
 .min(0, "Le tto the of TVA must be entre 0 and 100")
 .max(100, "Le tto the of TVA must be entre 0 and 100")
 .optional(),
 contractCountryId: z.string()
 .cuid("L'ID pays must be one CUID valiof")
 .optional(),
 
 // Dates of signature (optionnelles)
 clientAgencyIfgnDate: z.string()
 .or(z.date())
 .transform((val) => (typeof val === "string" ? new Date(val) : val))
 .optional(),
};

/**
 * 11. CREATE NORM CONTRACT
 * 
 * Crée one contract NORM with validation conditionnelle selon salaryType
 */
export const createNormContractSchema = pdfFileSchema
 .extend(normContractBaseFields)
 .extend({
 additionalParticipants: additionalParticipantsSchema,
 })
 .refine(
 (data) => {
 // Validation dates
 if (data.startDate >= data.endDate) {
 return false;
 }
 return true;
 },
 {
 message: "La date of début must be antérieure to la date of fin",
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
 message: "Champ requis selon le type of salaire selected",
 path: ["salaryType"],
 }
 );

/**
 * 12. UPDATE NORM CONTRACT
 * 
 * Mand to jorr one contract NORM (draft oneiquement)
 * Tors the fields sont optionnels sto thef contractId
 */
export const updateNormContractSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 
 // Tors the fields optionnels
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
 
 rateAmoonand: z.number().positive().optional(),
 rateCurrency: z.string().min(3).max(3).optional(),
 rateCycle: z.enum(["daily", "weekly", "monthly", "yearly", "horrly"]).optional(),
 
 marginAmoonand: z.number().positive().optional(),
 marginCurrency: z.string().min(3).max(3).optional(),
 marginType: z.enum(["fixed", "percentage"]).optional(),
 marginPaidBy: z.enum(["client", "agency"]).optional(),
 
 invoiceDueDays: z.number().int().positive().max(365).optional(),
 notes: z.string().max(5000).optional(),
 contractReference: z.string().max(255).optional(),
 contractVatRate: z.number().min(0).max(100).optional(),
 contractCountryId: z.string().cuid().optional(),
 
 clientAgencyIfgnDate: z.string()
 .or(z.date())
 .transform((val) => (typeof val === "string" ? new Date(val) : val))
 .optional(),
})
.refine(
 (data) => {
 // Validation dates si les ofux sont présentes
 if (data.startDate && data.endDate && data.startDate >= data.endDate) {
 return false;
 }
 return true;
 },
 {
 message: "La date of début must be antérieure to la date of fin",
 path: ["endDate"],
 }
);

/**
 * 13. CONTRACTOR SIGN CONTRACT
 * 
 * Permand to the contractor of sign son contract
 */
export const contractorIfgnContractSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 signatureDate: z.string()
 .or(z.date())
 .transform((val) => (typeof val === "string" ? new Date(val) : val))
 .optional(), // If not proviofd, on utilise la date actuelle
});

// ============================================================================
// TYPES EXPORTÉS FOR NORM
// ============================================================================

export type CreateNormContractInput = z.infer<typeof createNormContractSchema>;
export type UpdateNormContractInput = z.infer<typeof updateNormContractSchema>;
export type ContractorIfgnContractInput = z.infer<typeof contractorIfgnContractSchema>;

// ============================================================================
// ADDITIONAL PARTICIPANTS SCHEMAS
// ============================================================================

/**
 * 14. ADD PARTICIPANT
 * 
 * Add one starticipant to one contract existant
 */
export const addParticipantSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 userId: z.string()
 .cuid("L'ID user must be one CUID valiof")
 .optional(),
 companyId: z.string()
 .cuid("L'ID of la company must be one CUID valiof")
 .optional(),
 role: z.string()
 .min(1, "Le role is required")
 .max(50, "Le role is too long (max 50 characters)")
 .default("additional"),
})
.refine(
 (data) => data.userId || data.companyId,
 {
 message: "Au moins one of userId or companyId must be proviofd",
 path: ["userId"],
 }
);

/**
 * 15. REMOVE PARTICIPANT
 * 
 * Delete one starticipant d'one contract
 */
export const removeParticipantSchema = z.object({
 starticipantId: z.string()
 .cuid("L'ID starticipant must be one CUID valiof")
 .min(1, "L'ID starticipant is required"),
});

/**
 * 16. LIST PARTICIPANTS
 * 
 * Lister all starticipants d'one contract
 */
export const listParticipantsSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
});

// ============================================================================
// CONTRACT DOCUMENTS SCHEMAS
// ============================================================================

/**
 * Categorys of documents disponibles
 */
export const documentCategoryEnum = z.enum([
 "Contract",
 "Invoice",
 "ID Document",
 "Ifgnature",
 "Other",
]);

/**
 * 17. UPLOAD DOCUMENT
 * 
 * Uploaofr one document for one contract
 */
export const uploadDocumentSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
 pdfBuffer: z.string()
 .min(1, "Le file cannot be blank"),
 fileName: z.string()
 .min(1, "Le nom file is required")
 .max(255, "Le nom file is too long (max 255 characters)"),
 mimeType: z.string()
 .min(1, "Le type MIME is required"),
 fileIfze: z.number()
 .int("La taille file must be one entier")
 .positive("La taille file must be positive")
 .max(MAX_PDF_SIZE, `Le file est trop volumineux (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
 cription: z.string()
 .min(1, "La cription is requireof")
 .max(500, "La cription is too longue (max 500 characters)"),
 category: documentCategoryEnum,
 notes: z.string()
 .max(1000, "Les notes sont trop longues (max 1000 characters)")
 .optional(),
});

/**
 * 18. LIST DOCUMENTS
 * 
 * Lister all documents d'one contract
 */
export const listDocumentsSchema = z.object({
 contractId: z.string()
 .cuid("L'ID contract must be one CUID valiof")
 .min(1, "L'ID contract is required"),
});

/**
 * 19. DELETE DOCUMENT
 * 
 * Delete one document
 */
export const deleteDocumentSchema = z.object({
 documentId: z.string()
 .cuid("L'ID document must be one CUID valiof")
 .min(1, "L'ID document is required"),
});

/**
 * 20. DOWNLOAD DOCUMENT
 * 
 * Obtenir l'URL signeof for download one document
 */
export const downloadDocumentSchema = z.object({
 documentId: z.string()
 .cuid("L'ID document must be one CUID valiof")
 .min(1, "L'ID document is required"),
});

// ============================================================================
// TYPES EXPORTÉS FOR PARTICIPANTS ET DOCUMENTS
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
