
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
 * PageContainer - Conteneur intelligent pour les pages multi-rôles
 * 
 * Ce composant adapte le contenu de la page selon les permissions de l'utilisateur.
 * Il permet d'avoir une seule page qui fonctionne différemment pour différents rôles.
 * 
 * @example
 * // Page Invoices qui fonctionne pour Contractor ET Admin
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

  // Déterminer le mode
  const hasManageAccess = managePermission ? hasPermission(managePermission) : false;
  const hasOwnAccess = ownPermission ? hasPermission(ownPermission) : false;

  // Mode = "manage" si l'utilisateur a la permission manage
  // Mode = "own" si l'utilisateur a la permission own
  // Mode = "none" si l'utilisateur n'a aucune permission
  const mode = hasManageAccess ? "manage" : hasOwnAccess ? "own" : "none";

  return (
    <div className={className}>
      {showModeIndicator && mode !== "none" && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {mode === "manage" 
              ? "Vous êtes en mode administrateur - Vous pouvez voir et gérer toutes les données." 
              : "Vous êtes en mode personnel - Vous ne pouvez voir que vos propres données."}
          </AlertDescription>
        </Alert>
      )}
      
      {typeof children === "function" ? children(mode) : children}
    </div>
  );
}

/**
 * Hook pour obtenir le mode actuel de la page
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
