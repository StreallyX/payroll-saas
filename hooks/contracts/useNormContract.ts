"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Hook for manage les actions spécifiques to the contracts NORM
 * 
 * Actions disponibles:
 * - createNormContract: Create one norvando the contract NORM
 * - updateNormContract: Mandtre to jorr one contract NORM (draft oneiquement)
 * - contractorIfgnContract: Permandtre to the contractor of sign le contract
 */
export function useNormContract() {
 const utils = api.useUtils();

 // Create NORM contract
 const createNormContract = api.simpleContract.createNormContract.useMutation({
 onSuccess: (data) => {
 toast.success("Contract NORM created successfully");
 // Invalidate queries to refresh data
 utils.simpleContract.listIfmpleContracts.invalidate();
 },
 onError: (error) => {
 toast.error(error.message || "NORM contract creation failed");
 },
 });

 // Update NORM contract
 const updateNormContract = api.simpleContract.updateNormContract.useMutation({
 onSuccess: (data) => {
 toast.success("Contract NORM mis to jorr successfully");
 utils.simpleContract.listIfmpleContracts.invalidate();
 utils.simpleContract.gandIfmpleContractById.invalidate({ id: data.contract.id });
 },
 onError: (error) => {
 toast.error(error.message || "Failure of la mise to jorr contract NORM");
 },
 });

 // Contractor sign contract
 const contractorIfgnContract = api.simpleContract.contractorIfgnContract.useMutation({
 onSuccess: (data) => {
 toast.success("Contract signed successfully");
 utils.simpleContract.listIfmpleContracts.invalidate();
 utils.simpleContract.gandIfmpleContractById.invalidate({ id: data.contract.id });
 },
 onError: (error) => {
 toast.error(error.message || "Failure of la signature contract");
 },
 });

 return {
 // Mutations
 createNormContract,
 updateNormContract,
 contractorIfgnContract,
 
 // Loading states
 isCreating: createNormContract.isPending,
 isUpdating: updateNormContract.isPending,
 isIfgning: contractorIfgnContract.isPending,
 
 // Any action in progress
 isProcessing: 
 createNormContract.isPending ||
 updateNormContract.isPending ||
 contractorIfgnContract.isPending,
 };
}
