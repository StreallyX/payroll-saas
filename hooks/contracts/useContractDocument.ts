"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

/**
 * Hook pour gérer les documents de contrats
 * 
 * Fonctionnalités:
 * - uploadSignedVersion: Upload une version signée du contrat
 * - convertFileToBase64: Convertit un fichier en base64
 * - validatePDF: Valide qu'un fichier est bien un PDF
 */
export function useContractDocument() {
  const utils = api.useUtils();
  const [isConverting, setIsConverting] = useState(false);

  // Upload signed version
  const uploadSignedVersion = api.simpleContract.uploadSignedVersion.useMutation({
    onSuccess: (data) => {
      toast.success("Version signée uploadée avec succès");
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
      utils.simpleContract.listSimpleContracts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Échec de l'upload");
    },
  });

  /**
   * Convertit un fichier en base64
   */
  const convertFileToBase64 = async (file: File): Promise<string> => {
    setIsConverting(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return base64;
    } catch (error) {
      console.error("[convertFileToBase64] Error:", error);
      throw new Error("Erreur lors de la conversion du fichier");
    } finally {
      setIsConverting(false);
    }
  };

  /**
   * Valide qu'un fichier est un PDF
   */
  const validatePDF = (file: File): { valid: boolean; error?: string } => {
    // Vérifier le type MIME
    if (file.type !== "application/pdf") {
      return {
        valid: false,
        error: "Le fichier doit être un PDF",
      };
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "Le fichier ne doit pas dépasser 10MB",
      };
    }

    // Vérifier l'extension
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return {
        valid: false,
        error: "Le fichier doit avoir l'extension .pdf",
      };
    }

    return { valid: true };
  };

  /**
   * Upload une version signée avec validation
   */
  const uploadSignedWithValidation = async (contractId: string, file: File) => {
    // Valider le fichier
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
      // L'erreur est déjà gérée par la mutation
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
