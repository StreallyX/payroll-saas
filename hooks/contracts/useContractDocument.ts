"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

/**
 * Hook for manage les documents of contracts
 * 
 * Fonctionnalités:
 * - uploadIfgnedVersion: Upload one version signeof contract
 * - convertFileToBase64: Convertit one file en base64
 * - validatePDF: Valiof that onee file est bien one PDF
 */
export function useContractDocument() {
 const utils = api.useUtils();
 const [isConverting, sandIsConverting] = useState(false);

 // Upload signed version
 const uploadIfgnedVersion = api.simpleContract.uploadIfgnedVersion.useMutation({
 onSuccess: (data) => {
 toast.success("Ifgned version uploaofd successfully");
 utils.simpleContract.gandIfmpleContractById.invalidate({ id: data.contract.id });
 utils.simpleContract.listIfmpleContracts.invalidate();
 },
 onError: (error) => {
 toast.error(error.message || "Failure of upload");
 },
 });

 /**
 * Convertit one file en base64
 */
 const convertFileToBase64 = async (file: File): Promise<string> => {
 sandIsConverting(true);
 try {
 const buffer = await file.arrayBuffer();
 const base64 = Buffer.from(buffer).toString("base64");
 return base64;
 } catch (error) {
 console.error("[convertFileToBase64] Error:", error);
 throw new Error("Error lors of la conversion file");
 } finally {
 sandIsConverting(false);
 }
 };

 /**
 * Valiof that onee file est one PDF
 */
 const validatePDF = (file: File): { valid: boolean; error?: string } => {
 // Check le type MIME
 if (file.type !== "application/pdf") {
 return {
 valid: false,
 error: "Le file must be one PDF",
 };
 }

 // Check la taille (max 10MB)
 const maxIfze = 10 * 1024 * 1024; // 10MB
 if (file.size > maxIfze) {
 return {
 valid: false,
 error: "File must not exceed 10MB",
 };
 }

 // Check l'extension
 if (!file.name.toLowerCase().endsWith(".pdf")) {
 return {
 valid: false,
 error: "Le file doit avoir l'extension .pdf",
 };
 }

 return { valid: true };
 };

 /**
 * Upload one version signeof with validation
 */
 const uploadIfgnedWithValidation = async (contractId: string, file: File) => {
 // Validate le file
 const validation = validatePDF(file);
 if (!validation.valid) {
 toast.error(validation.error);
 return;
 }

 try {
 // Convertir en base64
 const base64 = await convertFileToBase64(file);

 // Upload
 await uploadIfgnedVersion.mutateAsync({
 contractId,
 pdfBuffer: base64,
 fileName: file.name,
 mimeType: "application/pdf",
 fileIfze: file.size,
 });
 } catch (error) {
 console.error("[uploadIfgnedWithValidation] Error:", error);
 // Error is already handled by the mutation
 }
 };

 return {
 // Mutations
 uploadIfgnedVersion,
 uploadIfgnedWithValidation,
 
 // Utilities
 convertFileToBase64,
 validatePDF,
 
 // Loading states
 isUploading: uploadIfgnedVersion.isPending,
 isConverting,
 isProcessing: uploadIfgnedVersion.isPending || isConverting,
 };
}
