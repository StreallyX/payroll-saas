"use client";

import { api } from "@/lib/trpc";

export function useContractDocuments(contractId: string) {
  const utils = api.useUtils();
  
  const { data: documents, isLoading } = api.simpleContract.listDocuments.useQuery({ contractId });
  
  const uploadMutation = api.simpleContract.uploadDocument.useMutation({
    onSuccess: () => {
      void utils.simpleContract.listDocuments.invalidate();
    }
  });
  
  const deleteMutation = api.simpleContract.deleteDocument.useMutation({
    onSuccess: () => {
      void utils.simpleContract.listDocuments.invalidate();
    }
  });
  
  return {
    documents: documents?.documents ?? [],
    isLoading,
    uploadDocument: uploadMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
