"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Hook for managing simplified contract workflow
 * 
 * Actions disponibles:
 * - submitForReview: Submit a draft contract for admin review
 * - approveContract: Approve a contract in pending_admin_review
 * - rejectContract: Reject a contract and return it to draft
 * - activateContract: Activate a completed contract
 * - deleteDraftContract: Delete a draft contract
 */
export function useSimpleContractWorkflow() {
  const utils = api.useUtils();

  // Submit for review
  const submitForReview = api.simpleContract.submitForReview.useMutation({
    onSuccess: (data) => {
      toast.success("Contract submitted for validation");
      // Invalidate queries to refresh data
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Submission failed");
    },
  });

  // Admin approve
  const approveContract = api.simpleContract.adminApprove.useMutation({
    onSuccess: (data) => {
      toast.success("Contract approved successfully");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Approval failed");
    },
  });

  // Admin reject
  const rejectContract = api.simpleContract.adminReject.useMutation({
    onSuccess: (data) => {
      toast.success("Contract rejected");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Rejection failed");
    },
  });

  // Activate contract
  const activateContract = api.simpleContract.activateContract.useMutation({
    onSuccess: (data) => {
      toast.success("Contract activated successfully");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Activation failed");
    },
  });

  // Delete draft contract
  const deleteDraftContract = api.simpleContract.deleteDraftContract.useMutation({
    onSuccess: () => {
      toast.success("Contract deleted");
      utils.simpleContract.listSimpleContracts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Deletion failed");
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
    isSubmitting: submitForReview.isPending,
    isApproving: approveContract.isPending,
    isRejecting: rejectContract.isPending,
    isActivating: activateContract.isPending,
    isDeleting: deleteDraftContract.isPending,
    
    // Any action in progress
    isProcessing: 
      submitForReview.isPending ||
      approveContract.isPending ||
      rejectContract.isPending ||
      activateContract.isPending ||
      deleteDraftContract.isPending,
  };
}
