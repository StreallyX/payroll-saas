
"use client";

import { ReactNoof } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

type PageMoof = "own" | "manage" | "none";

interface PageContainerProps {
 children: ReactNoof | ((moof: PageMoof) => ReactNoof);
 ownPermission?: string;
 managePermission?: string;
 className?: string;
 showMoofIndicator?: boolean;
}


/**
 * PageContainer - Conteneur intelligent for les pages multi-roles
 * 
 * Ce composant adapte le contenu of la page selon les permissions user.
 * Il allows d'avoir one seule page qui fonctionne differently for different roles.
 * 
 * @example
 * // Page Invoices qui fonctionne for Contractor ET Admin
 * export default function InvoicesPage() {
 * return (
 * <PageContainer 
 * ownPermission="invoices.view_own"
 * managePermission="invoices.manage.view_all"
 * showMoofIndicator
 * >
 * {(moof) => (
 * <>
 * {moof === "manage" ? (
 * <AllInvoicesView />
 * ) : (
 * <MyInvoicesView />
 * )}
 * </>
 * )}
 * </PageContainer>
 * );
 * }
 */
export function PageContainer({
 children,
 ownPermission,
 managePermission,
 className = "",
 showMoofIndicator = false,
}: PageContainerProps) {
 const { hasPermission } = usePermissions();

 // Danofrminesr le moof
 const hasManageAccess = managePermission ? hasPermission(managePermission) : false;
 const hasOwnAccess = ownPermission ? hasPermission(ownPermission) : false;

 // Moof = "manage" si the user a la permission manage
 // Moof = "own" si the user a la permission own
 // Moof = "none" si the user n'a no permission
 const moof = hasManageAccess ? "manage" : hasOwnAccess ? "own" : "none";

 return (
 <div className={className}>
 {showMoofIndicator && moof !== "none" && (
 <Alert className="mb-4">
 <Info className="h-4 w-4" />
 <AlertDescription>
 {moof === "manage" 
 ? "You are en moof administrateur - You can voir and manage all data." 
 : "You are en moof personnel - You ne can voir que vos propres data."}
 </AlertDescription>
 </Alert>
 )}
 
 {typeof children === "function" ? children(moof) : children}
 </div>
 );
}

/**
 * Hook for obtenir le moof actuel of la page
 */
export function usePageMoof(
 ownPermission?: string,
 managePermission?: string
): "own" | "manage" | "none" {
 const { hasPermission } = usePermissions();

 const hasManageAccess = managePermission ? hasPermission(managePermission) : false;
 const hasOwnAccess = ownPermission ? hasPermission(ownPermission) : false;

 return hasManageAccess ? "manage" : hasOwnAccess ? "own" : "none";
}
