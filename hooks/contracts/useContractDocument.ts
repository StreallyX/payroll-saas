"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

/**
 * Hook for managing contract documents
 * 
 * Features:
 * - uploadSignedVersion: Upload a signed version of the contract
 * - convertFileToBase64: Converts a file to base64
 * - validatePDF: Validates that a file is a PDF
 */
export function useContractDocument() {
  const utils = api.useUtils();
  const [isConverting, setIsConverting] = useState(false);

  // Upload signed version
  const uploadSignedVersion = api.simpleContract.uploadSignedVersion.useMutation({
    onSuccess: (data) => {
      toast.success("Signed version uploaded successfully");
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
      utils.simpleContract.listSimpleContracts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Upload failed");
    },
  });

  /**
   * Converts a file to base64
   */
  const convertFileToBase64 = async (file: File): Promise<string> => {
    setIsConverting(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return base64;
    } catch (error) {
      console.error("[convertFileToBase64] Error:", error);
      throw new Error("Error converting file");
    } finally {
      setIsConverting(false);
    }
  };

  /**
   * Validates that a file is a PDF
   */
  const validatePDF = (file: File): { valid: boolean; error?: string } => {
    // Check MIME type
    if (file.type !== "application/pdf") {
      return {
        valid: false,
        error: "File must be a PDF",
      };
    }

    // Check size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File must not exceed 10MB",
      };
    }

    // Check extension
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return {
        valid: false,
        error: "File must have .pdf extension",
      };
    }

    return { valid: true };
  };

  /**
   * Upload a signed version with validation
   */
  const uploadSignedWithValidation = async (contractId: string, file: File) => {
    // Validate file
    const validation = validatePDF(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      // Convertir en base64
      const base64 = await convertFileToBase64(file);

      // Upload
      await uploadSignedVersion.mutateAsync({
        contractId,
        pdfBuffer: base64,
        fileName: file.name,
        mimeType: "application/pdf",
        fileSize: file.size,
      });
    } catch (error) {
      console.error("[uploadSignedWithValidation] Error:", error);
      // Error is already handled by the mutation
    }
  };

  return {
    // Mutations
    uploadSignedVersion,
    uploadSignedWithValidation,
    
    // Utilities
    convertFileToBase64,
    validatePDF,
    
    // Loading states
    isUploading: uploadSignedVersion.isPending,
    isConverting,
    isProcessing: uploadSignedVersion.isPending || isConverting,
  };
}
