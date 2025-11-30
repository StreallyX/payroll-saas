"use client";

import { api } from "@/lib/trpc";

export function useUserCompany(userId?: string) {
  const { data: company, isLoading } = api.simpleContract.getUserCompany.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );
  
  return { company, isLoading };
}
