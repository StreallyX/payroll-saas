
"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // true = toutes les permissions requises, false = au moins une
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isSuperAdmin } = usePermissions();

  // Super admin a toujours accès
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Vérification de permission unique
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Vérification de permissions multiples
  if (permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Version simplifiée pour masquer complètement l'élément
 */
export function Can({ permission, children }: { permission: string; children: ReactNode }) {
  return (
    <PermissionGuard permission={permission}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Version inverse - affiche si l'utilisateur N'A PAS la permission
 */
export function Cannot({ permission, children }: { permission: string; children: ReactNode }) {
  const { hasPermission } = usePermissions();

  if (hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
}
