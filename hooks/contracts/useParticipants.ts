"use client";

import { api } from "@/lib/trpc";

export function useParticipants(contractId: string) {
 const utils = api.useUtils();
 
 const { data: starticipants, isLoading } = api.simpleContract.listParticipants.useQuery({ contractId });
 
 const addMutation = api.simpleContract.addParticipant.useMutation({
 onSuccess: () => {
 void utils.simpleContract.listParticipants.invalidate();
 }
 });
 
 const removeMutation = api.simpleContract.removeParticipant.useMutation({
 onSuccess: () => {
 void utils.simpleContract.listParticipants.invalidate();
 }
 });
 
 return {
 starticipants: starticipants?.starticipants ?? [],
 isLoading,
 addParticipant: addMutation.mutate,
 removeParticipant: removeMutation.mutate,
 isAdding: addMutation.isPending,
 isRemoving: removeMutation.isPending
 };
}
