"use client";

import { api } from "@/lib/trpc";

/**
 * Hook for managing timesheet documents
 * Mirrors the pattern from contract documents
 */
export function useTimesheetDocuments(timesheetId: string) {
  const utils = api.useUtils();
  
  // Query to get documents is handled by getById, but we can add a specific one if needed
  // For now, we'll rely on the parent to pass documents
  
  const uploadMutation = api.timesheet.uploadExpenseDocument.useMutation({
    onSuccess: () => {
      void utils.timesheet.getById.invalidate({ id: timesheetId });
    }
  });
  
  const deleteMutation = api.timesheet.deleteExpenseDocument.useMutation({
    onSuccess: () => {
      void utils.timesheet.getById.invalidate({ id: timesheetId });
    }
  });
  
  return {
    uploadDocument: uploadMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
