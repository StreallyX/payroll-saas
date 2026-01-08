
"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

type PageMode = "own" | "manage" | "none";

interface PageContainerProps {
  children: ReactNode | ((mode: PageMode) => ReactNode);
  ownPermission?: string;
  managePermission?: string;
  className?: string;
  showModeIndicator?: boolean;
}


/**
 * PageContainer - Smart container for multi-role pages
 * 
 * This component adapts page content based on user permissions.
 * It allows having a single page that works differently for different roles.
 * 
 * @example
 * // Invoices page that works for Contractor AND Admin
 * export default function InvoicesPage() {
 *   return (
 *     <PageContainer 
 *       ownPermission="invoices.view_own"
 *       managePermission="invoices.manage.view_all"
 *       showModeIndicator
 *     >
 *       {(mode) => (
 *         <>
 *           {mode === "manage" ? (
 *             <AllInvoicesView />
 *           ) : (
 *             <MyInvoicesView />
 *           )}
 *         </>
 *       )}
 *     </PageContainer>
 *   );
 * }
 */
export function PageContainer({
  children,
  ownPermission,
  managePermission,
  className = "",
  showModeIndicator = false,
}: PageContainerProps) {
  const { hasPermission } = usePermissions();

  // Determine mode
  const hasManageAccess = managePermission ? hasPermission(managePermission) : false;
  const hasOwnAccess = ownPermission ? hasPermission(ownPermission) : false;

  // Mode = "manage" if user has manage permission
  // Mode = "own" if user has own permission
  // Mode = "none" if user has no permission
  const mode = hasManageAccess ? "manage" : hasOwnAccess ? "own" : "none";

  return (
    <div className={className}>
      {showModeIndicator && mode !== "none" && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {mode === "manage" 
              ? "You are in administrator mode - You can view and manage all data." 
              : "You are in personal mode - You can only view your own data."}
          </AlertDescription>
        </Alert>
      )}
      
      {typeof children === "function" ? children(mode) : children}
    </div>
  );
}

/**
 * Hook to get the current page mode
 */
export function usePageMode(
  ownPermission?: string,
  managePermission?: string
): "own" | "manage" | "none" {
  const { hasPermission } = usePermissions();

  const hasManageAccess = managePermission ? hasPermission(managePermission) : false;
  const hasOwnAccess = ownPermission ? hasPermission(ownPermission) : false;

  return hasManageAccess ? "manage" : hasOwnAccess ? "own" : "none";
}
