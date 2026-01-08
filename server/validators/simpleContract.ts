/**
 * Zod validators for simplified MSA/SOW contract system
 * 
 * This file contains all validation schemas for endpoints
 * du router simpleContract.
 */

import { z } from "zod";

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["application/pdf"];

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for validating a base64 encoded PDF file
 */
export const pdfFileSchema = z.object({
  pdfBuffer: z.string()
    .min(1, "PDF file cannot be empty")
    .refine(
      (val) => {
        try {
          // Verify it's valid base64
          const decoded = Buffer.from(val, "base64");
          return decoded.length > 0;
        } catch {
          return false;
        }
      },
      { message: "PDF buffer must be valid base64 encoded" }
    ),
  fileName: z.string()
    .min(1, "Filename is required")
    .max(255, "Filename is too long (max 255 characters)")
    .refine(
      (val) => val.toLowerCase().endsWith(".pdf"),
      { message: "File must have .pdf extension" }
    ),
  mimeType: z.enum(["application/pdf"], {
    errorMap: () => ({ message: "Only PDF files are accepted" }),
  }),
  fileSize: z.number()
    .int("File size must be an integer")
    .positive("File size must be positive")
    .max(MAX_PDF_SIZE, `File is too large (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
});

/**
 * Schema for an additional participant
 * At least one of userId or companyId must be provided
 */
export const additionalParticipantSchema = z.object({
  userId: z.string()
    .cuid("User ID must be a valid CUID")
    .optional(),
  companyId: z.string()
    .cuid("Company ID must be a valid CUID")
    .optional(),
  role: z.string()
    .min(1, "Role is required")
    .max(50, "Role is too long (max 50 characters)")
    .default("additional"),
})
.refine(
  (data) => data.userId || data.companyId,
  {
    message: "At least one of userId or companyId must be provided",
    path: ["userId"],
  }
);

/**
 * Array of additional participants for contract creation
 */
export const additionalParticipantsSchema = z.array(additionalParticipantSchema)
  .optional()
  .default([]);

// ============================================================================
// SCHEMAS FOR ENDPOINTS
// ============================================================================

/**
 * 1. CREATE SIMPLE MSA
 * 
 * Input: PDF + minimal information + additional participants
 * Output: MSA contract created with status "draft"
 */
export const createSimpleMSASchema = pdfFileSchema.extend({
  companyId: z.string()
    .cuid("Company ID must be a valid CUID")
    .optional(),
  additionalParticipants: additionalParticipantsSchema,
});

/**
 * 2. CREATE SIMPLE SOW
 * 
 * Input: PDF + parent MSA + minimal information + additional participants
 * Output: SOW contract created with status "draft"
 */
export const createSimpleSOWSchema = pdfFileSchema.extend({
  parentMSAId: z.string()
    .cuid("Parent MSA ID must be a valid CUID")
    .min(1, "Parent MSA ID is required"),
  companyId: z.string()
    .cuid("Company ID must be a valid CUID")
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
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  notes: z.string()
    .max(5000, "Notes are too long (max 5000 characters)")
    .optional(),
});

/**
 * 4. ADMIN APPROVE
 * 
 * Transition: pending_admin_review → completed
 */
export const adminApproveSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  notes: z.string()
    .max(5000, "Notes are too long (max 5000 characters)")
    .optional(),
});

/**
 * 5. ADMIN REJECT
 * 
 * Transition: pending_admin_review → draft
 */
export const adminRejectSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  reason: z.string()
    .min(10, "Rejection reason must contain at least 10 characters")
    .max(5000, "Rejection reason is too long (max 5000 characters)"),
});

/**
 * 6. UPLOAD SIGNED VERSION
 * 
 * Upload of a signed version of the contract (completed/active)
 */
export const uploadSignedVersionSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  pdfBuffer: z.string()
    .min(1, "PDF file cannot be empty"),
  fileName: z.string()
    .min(1, "Filename is required")
    .max(255, "Filename is too long")
    .refine(
      (val) => val.toLowerCase().endsWith(".pdf"),
      { message: "File must have .pdf extension" }
    ),
  mimeType: z.enum(["application/pdf"]),
  fileSize: z.number()
    .int()
    .positive()
    .max(MAX_PDF_SIZE, `File is too large (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
});

/**
 * 7. ACTIVATE CONTRACT
 * 
 * Transition: completed → active
 */
export const activateContractSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  notes: z.string()
    .max(5000, "Notes are too long (max 5000 characters)")
    .optional(),
});

/**
 * 7B. UPDATE SIMPLE CONTRACT (TITLE AND DESCRIPTION)
 * 
 * Allows updating the title and description of an MSA/SOW/NORM contract
 */
export const updateSimpleContractSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title is too long (max 200 characters)")
    .optional(),
  description: z.string()
    .max(1000, "Description is too long (max 1000 characters)")
    .optional(),
});

/**
 * 8. LIST SIMPLE CONTRACTS
 * 
 * Filters and pagination for contract list
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
 * Retrieval of a contract by its ID
 */
export const getSimpleContractByIdSchema = z.object({
  id: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
});

/**
 * 10. DELETE DRAFT CONTRACT
 * 
 * Deletion of a draft contract only
 */
export const deleteDraftContractSchema = z.object({
  id: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
});

// ============================================================================
// EXPORTED TYPES (inferred from schemas)
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
 * Base schema for common NORM contract fields
 */
const normContractBaseFields = {
  // Champs essentiels (parties)
  companyTenantId: z.string()
    .cuid("Tenant company ID must be a valid CUID"),
  agencyId: z.string()
    .cuid("Agency ID must be a valid CUID"),
  contractorId: z.string()
    .cuid("Contractor ID must be a valid CUID"),
  
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
      message: "Salary type must be: gross, payroll, payroll_we_pay or split" 
    }),
  }),
  
  // Champs conditionnels selon salaryType
  userBankId: z.string().cuid().optional(), // Pour Gross
  payrollUserId: z.string().cuid().optional(), // For Payroll and Payroll We Pay
  userBankIds: z.array(z.string().cuid()).optional(), // Pour Split
  
  // Champs optionnels - Tarification
  rateAmount: z.number()
    .positive("Rate amount must be positive")
    .optional(),
  rateCurrency: z.string()
    .min(3, "Currency must contain at least 3 characters")
    .max(3, "Currency must contain 3 characters")
    .optional(),
  rateCycle: z.enum(["daily", "weekly", "monthly", "yearly", "hourly"], {
    errorMap: () => ({ 
      message: "Cycle must be: daily, weekly, monthly, yearly or hourly" 
    }),
  }).optional(),
  
  // Champs optionnels - Marge
  marginAmount: z.number()
    .positive("Margin amount must be positive")
    .optional(),
  marginCurrency: z.string()
    .min(3, "Currency must contain at least 3 characters")
    .max(3, "Currency must contain 3 characters")
    .optional(),
  marginType: z.enum(["fixed", "percentage"], {
    errorMap: () => ({ message: "Margin type must be: fixed or percentage" }),
  }).optional(),
  marginPaidBy: z.enum(["client", "agency"], {
    errorMap: () => ({ message: "Margin must be paid by: client or agency" }),
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
    .int("Number of days must be an integer")
    .positive("Number of days must be positive")
    .max(365, "Number of days cannot exceed 365")
    .optional(),
  notes: z.string()
    .max(5000, "Notes are too long (max 5000 characters)")
    .optional(),
  contractReference: z.string()
    .max(255, "Reference is too long (max 255 characters)")
    .optional(),
  contractVatRate: z.number()
    .min(0, "VAT rate must be between 0 and 100")
    .max(100, "VAT rate must be between 0 and 100")
    .optional(),
  contractCountryId: z.string()
    .cuid("Country ID must be a valid CUID")
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
 * Creates a NORM contract with conditional validation based on salaryType
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
      message: "Start date must be before end date",
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
      message: "Field required based on selected salary type",
      path: ["salaryType"],
    }
  );

/**
 * 12. UPDATE NORM CONTRACT
 * 
 * Updates a NORM contract (draft only)
 * All fields are optional except contractId
 */
export const updateNormContractSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  
  // All fields optional
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
    // Date validation if both are present
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      return false;
    }
    return true;
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
);

/**
 * 13. CONTRACTOR SIGN CONTRACT
 * 
 * Allows contractor to sign their contract
 */
export const contractorSignContractSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  signatureDate: z.string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(), // If not provided, current date is used
});

// ============================================================================
// EXPORTED TYPES FOR NORM
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
 * Add a participant to an existing contract
 */
export const addParticipantSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  userId: z.string()
    .cuid("User ID must be a valid CUID")
    .optional(),
  companyId: z.string()
    .cuid("Company ID must be a valid CUID")
    .optional(),
  role: z.string()
    .min(1, "Role is required")
    .max(50, "Role is too long (max 50 characters)")
    .default("additional"),
})
.refine(
  (data) => data.userId || data.companyId,
  {
    message: "At least one of userId or companyId must be provided",
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
    .cuid("Participant ID must be a valid CUID")
    .min(1, "Participant ID is required"),
});

/**
 * 16. LIST PARTICIPANTS
 * 
 * List all participants of a contract
 */
export const listParticipantsSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
});

// ============================================================================
// CONTRACT DOCUMENTS SCHEMAS
// ============================================================================

/**
 * Available document categories
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
 * Upload a document for a contract
 */
export const uploadDocumentSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
  pdfBuffer: z.string()
    .min(1, "File cannot be empty"),
  fileName: z.string()
    .min(1, "Filename is required")
    .max(255, "Filename is too long (max 255 characters)"),
  mimeType: z.string()
    .min(1, "MIME type is required"),
  fileSize: z.number()
    .int("File size must be an integer")
    .positive("File size must be positive")
    .max(MAX_PDF_SIZE, `File is too large (max ${MAX_PDF_SIZE / 1024 / 1024} MB)`),
  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description is too long (max 500 characters)"),
  category: documentCategoryEnum,
  notes: z.string()
    .max(1000, "Notes are too long (max 1000 characters)")
    .optional(),
});

/**
 * 18. LIST DOCUMENTS
 * 
 * List all documents of a contract
 */
export const listDocumentsSchema = z.object({
  contractId: z.string()
    .cuid("Contract ID must be a valid CUID")
    .min(1, "Contract ID is required"),
});

/**
 * 19. DELETE DOCUMENT
 * 
 * Delete a document
 */
export const deleteDocumentSchema = z.object({
  documentId: z.string()
    .cuid("Document ID must be a valid CUID")
    .min(1, "Document ID is required"),
});

/**
 * 20. DOWNLOAD DOCUMENT
 * 
 * Get signed URL to download a document
 */
export const downloadDocumentSchema = z.object({
  documentId: z.string()
    .cuid("Document ID must be a valid CUID")
    .min(1, "Document ID is required"),
});

// ============================================================================
// EXPORTED TYPES FOR PARTICIPANTS AND DOCUMENTS
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
