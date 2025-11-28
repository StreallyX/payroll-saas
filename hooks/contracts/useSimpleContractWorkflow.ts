"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Hook pour gérer le workflow des contrats simplifiés
 * 
 * Actions disponibles:
 * - submitForReview: Soumet un contrat draft pour review admin
 * - approveContract: Approuve un contrat en pending_admin_review
 * - rejectContract: Rejette un contrat et le remet en draft
 * - activateContract: Active un contrat completed
 * - deleteDraftContract: Supprime un contrat en draft
 */
export function useSimpleContractWorkflow() {
  const utils = api.useUtils();

  // Submit for review
  const submitForReview = api.simpleContract.submitForReview.useMutation({
    onSuccess: (data) => {
      toast.success("Contrat soumis pour validation");
      // Invalider les queries pour rafraîchir les données
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la soumission");
    },
  });

  // Admin approve
  const approveContract = api.simpleContract.adminApprove.useMutation({
    onSuccess: (data) => {
      toast.success("Contrat approuvé avec succès");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Échec de l'approbation");
    },
  });

  // Admin reject
  const rejectContract = api.simpleContract.adminReject.useMutation({
    onSuccess: (data) => {
      toast.success("Contrat rejeté");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Échec du rejet");
    },
  });

  // Activate contract
  const activateContract = api.simpleContract.activateContract.useMutation({
    onSuccess: (data) => {
      toast.success("Contrat activé avec succès");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Échec de l'activation");
    },
  });

  // Delete draft contract
  const deleteDraftContract = api.simpleContract.deleteDraftContract.useMutation({
    onSuccess: () => {
      toast.success("Contrat supprimé");
      utils.simpleContract.listSimpleContracts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la suppression");
    },
  });

  return {
    // Mutations
    submitForReview,
    approveContract,
    rejectContract,
    activateContract,
    deleteDraftContract,
    
    // Loading states
    isSubmitting: submitForReview.isLoading,
    isApproving: approveContract.isLoading,
    isRejecting: rejectContract.isLoading,
    isActivating: activateContract.isLoading,
    isDeleting: deleteDraftContract.isLoading,
    
    // Any action in progress
    isProcessing: 
      submitForReview.isLoading ||
      approveContract.isLoading ||
      rejectContract.isLoading ||
      activateContract.isLoading ||
      deleteDraftContract.isLoading,
  };
}
