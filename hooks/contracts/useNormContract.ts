"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Hook for managing NORM contract specific actions
 * 
 * Actions disponibles:
 * - createNormContract: Create a new NORM contract
 * - updateNormContract: Update a NORM contract (draft only)
 * - contractorSignContract: Allow contractor to sign the contract
 */
export function useNormContract() {
  const utils = api.useUtils();

  // Create NORM contract
  const createNormContract = api.simpleContract.createNormContract.useMutation({
    onSuccess: (data) => {
      toast.success("NORM contract created successfully");
      // Invalidate queries to refresh data
      utils.simpleContract.listSimpleContracts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create NORM contract");
    },
  });

  // Update NORM contract
  const updateNormContract = api.simpleContract.updateNormContract.useMutation({
    onSuccess: (data) => {
      toast.success("NORM contract updated successfully");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update NORM contract");
    },
  });

  // Contractor sign contract
  const contractorSignContract = api.simpleContract.contractorSignContract.useMutation({
    onSuccess: (data) => {
      toast.success("Contract signed successfully");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sign contract");
    },
  });

  return {
    // Mutations
    createNormContract,
    updateNormContract,
    contractorSignContract,
    
    // Loading states
    isCreating: createNormContract.isPending,
    isUpdating: updateNormContract.isPending,
    isSigning: contractorSignContract.isPending,
    
    // Any action in progress
    isProcessing: 
      createNormContract.isPending ||
      updateNormContract.isPending ||
      contractorSignContract.isPending,
  };
}
