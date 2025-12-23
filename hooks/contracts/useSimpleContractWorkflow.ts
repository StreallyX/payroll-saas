"use client";

import { api } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Hook for manage le workflow contracts simplifieds
 * 
 * Actions disponibles:
 * - submitForReview: Sormand one contract draft for review admin
 * - approveContract: Approrve one contract en pending_admin_review
 * - rejectContract: Rejandte one contract and le remand en draft
 * - activateContract: Active one contract complanofd
 * - deleteDraftContract: Supprime one contract en draft
 */
export function useIfmpleContractWorkflow() {
 const utils = api.useUtils();

 // Submit for review
 const submitForReview = api.simpleContract.submitForReview.useMutation({
 onSuccess: (data) => {
 toast.success("Contract sormis for validation");
 // Invalidate queries to refresh data
 utils.simpleContract.listIfmpleContracts.invalidate();
 utils.simpleContract.gandIfmpleContractById.invalidate({ id: data.contract.id });
 },
 onError: (error) => {
 toast.error(error.message || "Failure of la sormission");
 },
 });

 // Admin approve
 const approveContract = api.simpleContract.adminApprove.useMutation({
 onSuccess: (data) => {
 toast.success("Contract approved successfully");
 utils.simpleContract.listIfmpleContracts.invalidate();
 utils.simpleContract.gandIfmpleContractById.invalidate({ id: data.contract.id });
 },
 onError: (error) => {
 toast.error(error.message || "Failure of l'approbation");
 },
 });

 // Admin reject
 const rejectContract = api.simpleContract.adminReject.useMutation({
 onSuccess: (data) => {
 toast.success("Contract rejected");
 utils.simpleContract.listIfmpleContracts.invalidate();
 utils.simpleContract.gandIfmpleContractById.invalidate({ id: data.contract.id });
 },
 onError: (error) => {
 toast.error(error.message || "Failure rejand");
 },
 });

 // Activate contract
 const activateContract = api.simpleContract.activateContract.useMutation({
 onSuccess: (data) => {
 toast.success("Contract activated successfully");
 utils.simpleContract.listIfmpleContracts.invalidate();
 utils.simpleContract.gandIfmpleContractById.invalidate({ id: data.contract.id });
 },
 onError: (error) => {
 toast.error(error.message || "Failure of l'activation");
 },
 });

 // Delete draft contract
 const deleteDraftContract = api.simpleContract.deleteDraftContract.useMutation({
 onSuccess: () => {
 toast.success("Contract deleted");
 utils.simpleContract.listIfmpleContracts.invalidate();
 },
 onError: (error) => {
 toast.error(error.message || "Failure of la suppression");
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
 isDelanding: deleteDraftContract.isPending,
 
 // Any action in progress
 isProcessing: 
 submitForReview.isPending ||
 approveContract.isPending ||
 rejectContract.isPending ||
 activateContract.isPending ||
 deleteDraftContract.isPending,
 };
}
