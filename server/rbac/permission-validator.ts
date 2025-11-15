
import { TRPCError } from "@trpc/server";

/**
 * Valide qu'un utilisateur a une permission spécifique
 */
export function requirePermission(
  userPermissions: string[],
  requiredPermission: string
): void {
  if (!userPermissions.includes(requiredPermission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Missing permission: ${requiredPermission}`,
    });
  }
}

/**
 * Valide qu'un utilisateur a toutes les permissions requises
 */
export function requireAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): void {
  const missing = requiredPermissions.filter(p => !userPermissions.includes(p));
  if (missing.length > 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Missing permissions: ${missing.join(", ")}`,
    });
  }
}

/**
 * Valide qu'un utilisateur a au moins une des permissions requises
 */
export function requireAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): void {
  const hasAny = requiredPermissions.some(p => userPermissions.includes(p));
  if (!hasAny) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Requires one of: ${requiredPermissions.join(", ")}`,
    });
  }
}

/**
 * Vérifie si un utilisateur a une permission (retourne boolean)
 */
export function hasPermission(
  userPermissions: string[],
  permission: string
): boolean {
  return userPermissions.includes(permission);
}

/**
 * Vérifie si un utilisateur a toutes les permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.every(p => userPermissions.includes(p));
}

/**
 * Vérifie si un utilisateur a au moins une permission
 */
export function hasAnyPermission(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Filtre les permissions par préfixe (ex: "contracts.")
 */
export function getPermissionsByPrefix(
  userPermissions: string[],
  prefix: string
): string[] {
  return userPermissions.filter(p => p.startsWith(prefix));
}

/**
 * Vérifie si un utilisateur peut effectuer une action sur une ressource
 * en tenant compte de la hiérarchie des permissions
 */
export function canPerformAction(
  userPermissions: string[],
  resource: string,
  action: string
): boolean {
  // Vérifier la permission exacte
  const exactPermission = `${resource}.${action}`;
  if (userPermissions.includes(exactPermission)) {
    return true;
  }

  // Vérifier la permission wildcard
  const wildcardPermission = `${resource}.*`;
  if (userPermissions.includes(wildcardPermission)) {
    return true;
  }

  // Vérifier la permission super admin
  if (userPermissions.includes("*") || userPermissions.includes("superadmin.*")) {
    return true;
  }

  return false;
}
