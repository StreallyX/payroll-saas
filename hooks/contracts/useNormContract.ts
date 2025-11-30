"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Hook pour gérer les actions spécifiques aux contrats NORM
 * 
 * Actions disponibles:
 * - createNormContract: Créer un nouveau contrat NORM
 * - updateNormContract: Mettre à jour un contrat NORM (draft uniquement)
 * - contractorSignContract: Permettre au contractor de signer le contrat
 */
export function useNormContract() {
  const utils = api.useUtils();

  // Create NORM contract
  const createNormContract = api.simpleContract.createNormContract.useMutation({
    onSuccess: (data) => {
      toast.success("Contrat NORM créé avec succès");
      // Invalider les queries pour rafraîchir les données
      utils.simpleContract.listSimpleContracts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la création du contrat NORM");
    },
  });

  // Update NORM contract
  const updateNormContract = api.simpleContract.updateNormContract.useMutation({
    onSuccess: (data) => {
      toast.success("Contrat NORM mis à jour avec succès");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la mise à jour du contrat NORM");
    },
  });

  // Contractor sign contract
  const contractorSignContract = api.simpleContract.contractorSignContract.useMutation({
    onSuccess: (data) => {
      toast.success("Contrat signé avec succès");
      utils.simpleContract.listSimpleContracts.invalidate();
      utils.simpleContract.getSimpleContractById.invalidate({ id: data.contract.id });
    },
    onError: (error) => {
      toast.error(error.message || "Échec de la signature du contrat");
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
