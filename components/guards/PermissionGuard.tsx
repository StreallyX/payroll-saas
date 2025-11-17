
"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showAlert?: boolean;
  alertMessage?: string;
}

/**
 * PermissionGuard - Composant de garde pour les permissions
 * 
 * Affiche le contenu uniquement si l'utilisateur a les permissions requises.
 * 
 * @example
 * // Permission unique
 * <PermissionGuard permission="invoices.create">
 *   <Button>Créer une facture</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Plusieurs permissions (OR logic)
 * <PermissionGuard permissions={["invoices.view_own", "invoices.manage.view_all"]}>
 *   <InvoiceList />
 * </PermissionGuard>
 * 
 * @example
 * // Plusieurs permissions (AND logic)
 * <PermissionGuard 
 *   permissions={["invoices.manage.update", "invoices.manage.delete"]} 
 *   requireAll
 * >
 *   <AdminActions />
 * </PermissionGuard>
 * 
 * @example
 * // Avec fallback personnalisé
 * <PermissionGuard 
 *   permission="contractors.manage.create"
 *   fallback={<p>Vous n'avez pas les droits pour créer des contractors.</p>}
 * >
 *   <CreateContractorButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  showAlert = false,
  alertMessage = "Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.",
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Déterminer si l'utilisateur a accès
  let hasAccess = false;

  if (permission) {
    // Permission unique
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      // L'utilisateur doit avoir TOUTES les permissions
      hasAccess = hasAllPermissions(permissions);
    } else {
      // L'utilisateur doit avoir AU MOINS UNE permission
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // Aucune permission spécifiée = accès autorisé par défaut
    hasAccess = true;
  }

  // Si pas d'accès
  if (!hasAccess) {
    if (showAlert) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // L'utilisateur a accès
  return <>{children}</>;
}

/**
 * Hook version du PermissionGuard pour une utilisation conditionnelle
 * 
 * @example
 * const canCreate = usePermissionGuard("invoices.create");
 * if (canCreate) {
 *   // Afficher le bouton
 * }
 */
export function usePermissionGuard(
  permission: string | string[],
  requireAll: boolean = false
): boolean {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (typeof permission === "string") {
    return hasPermission(permission);
  } else if (Array.isArray(permission)) {
    if (requireAll) {
      return hasAllPermissions(permission);
    } else {
      return hasAnyPermission(permission);
    }
  }

  return false;
}
