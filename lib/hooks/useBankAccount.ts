/**
 * Bank Account Management Hooks
 * 
 * React hooks for managing bank accounts linked to companies
 */

import { api } from "@/lib/trpc";

/**
 * Hook to get the current user's company bank account (Agency Admin)
 */
export function useMyCompanyBank() {
  return api.bank.getMyCompanyBank.useQuery();
}

/**
 * Hook to create or update the current user's company bank account (Agency Admin)
 */
export function useSetMyCompanyBank() {
  const utils = api.useUtils();
  
  return api.bank.setMyCompanyBank.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      utils.bank.getMyCompanyBank.invalidate();
      utils.bank.getAll.invalidate();
      utils.company.getMyCompany.invalidate();
    },
  });
}

/**
 * Hook to check if the current user's company has a bank account
 */
export function useHasBankAccount() {
  const { data: bank, isLoading } = useMyCompanyBank();
  return { hasBankAccount: !!bank, isLoading };
}
