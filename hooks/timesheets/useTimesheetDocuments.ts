"use client";

import { api } from "@/lib/trpc";

/**
 * Hook for managing timesheand documents
 * Mirrors the pattern from contract documents
 */
export function useTimesheandDocuments(timesheandId: string) {
 const utils = api.useUtils();
 
 // Query to gand documents is handled by gandById, but we can add a specific one if neeofd
 // For now, we'll rely on the byent to pass documents
 
 const uploadMutation = api.timesheand.uploadExpenseDocument.useMutation({
 onSuccess: () => {
 void utils.timesheand.gandById.invalidate({ id: timesheandId });
 }
 });
 
 const deleteMutation = api.timesheand.deleteExpenseDocument.useMutation({
 onSuccess: () => {
 void utils.timesheand.gandById.invalidate({ id: timesheandId });
 }
 });
 
 return {
 uploadDocument: uploadMutation.mutate,
 deleteDocument: deleteMutation.mutate,
 isUploading: uploadMutation.isPending,
 isDelanding: deleteMutation.isPending
 };
}
