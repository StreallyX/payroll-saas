/**
 * Company Management Hooks
 * 
 * React hooks for managing companies (tenant and agency)
 */

import { api  } from "@/lib/trpc";

/**
 * Hook to get the current user's company (for Agency Admin)
 */
export function useMyCompany() {
  return api.company.getMyCompany.useQuery();
}

/**
 * Hook to get all tenant companies (client companies)
 * - Platform Admin: Full details
 * - Agency Admin: Simplified view
 */
export function useTenantCompanies() {
  return api.company.getTenantCompanies.useQuery();
}

/**
 * Hook to get all agency companies (service providers)
 * Platform Admin only
 */
export function useAgencyCompanies() {
  return api.company.getAgencyCompanies.useQuery();
}

/**
 * Hook to create the current user's company (Agency Admin)
 */
export function useCreateMyCompany() {
  const utils = api.useUtils();
  
  return api.company.createMyCompany.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      utils.company.getMyCompany.invalidate();
      utils.company.getAll.invalidate();
    },
  });
}

/**
 * Hook to update the current user's company (Agency Admin)
 */
export function useUpdateMyCompany() {
  const utils = api.useUtils();
  
  return api.company.updateMyCompany.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      utils.company.getMyCompany.invalidate();
      utils.company.getAll.invalidate();
    },
  });
}

/**
 * Hook to check if the current user has a company
 */
export function useHasCompany() {
  const { data: company, isLoading } = useMyCompany();
  return { hasCompany: !!company, isLoading };
}
