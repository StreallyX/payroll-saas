/**
 * RBAC Helper Functions for DEEL-style Permission Pattern
 * 
 * This file provides reusable utility functions for implementing
 * the DEEL-style RBAC pattern across all TRPC routes.
 * 
 * DEEL Pattern:
 * - Use `view_own` for users viewing their own resources
 * - Use `view_all` for admins viewing all resources
 * - Check permissions and filter data accordingly
 */

import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

/**
 * Permission Scope - Determines what data a user can access
 */
export enum PermissionScope {
  NONE = "none",       // No access
  OWN = "own",         // Can only access own resources
  ALL = "all",         // Can access all resources
}

/**
 * User Context Interface
 */
export interface UserContext {
  userId: string;
  tenantId: string;
  permissions: string[];
  isSuperAdmin?: boolean;
  contractorId?: string | null;
  agencyId?: string | null;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: string[],
  permission: string,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true;
  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  permissions: string[],
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true;
  return permissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  permissions: string[],
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true;
  return permissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Get permission scope for a resource
 * 
 * Returns:
 * - ALL if user has view_all permission
 * - OWN if user has view_own permission
 * - NONE if user has neither
 */
export function getPermissionScope(
  userPermissions: string[],
  viewOwnPermission: string,
  viewAllPermission: string,
  isSuperAdmin?: boolean
): PermissionScope {
  if (isSuperAdmin || hasPermission(userPermissions, viewAllPermission)) {
    return PermissionScope.ALL;
  }
  if (hasPermission(userPermissions, viewOwnPermission)) {
    return PermissionScope.OWN;
  }
  return PermissionScope.NONE;
}

/**
 * Ensure user has at least one of the required permissions
 * Throws FORBIDDEN error if user doesn't have any of the permissions
 */
export function requireAnyPermission(
  userPermissions: string[],
  permissions: string[],
  isSuperAdmin?: boolean
): void {
  if (!hasAnyPermission(userPermissions, permissions, isSuperAdmin)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Required permissions: ${permissions.join(" or ")}`,
    });
  }
}

/**
 * Get contractor filter for queries based on permission scope
 * 
 * DEEL Pattern: If user has view_all, return empty filter (all data).
 * If user has view_own, return filter for contractorId.
 */
export function getContractorFilter(
  scope: PermissionScope,
  contractorId?: string | null
): { contractorId?: string } | undefined {
  if (scope === PermissionScope.ALL) {
    return undefined; // No filter - return all
  }
  if (scope === PermissionScope.OWN && contractorId) {
    return { contractorId };
  }
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You don't have permission to access this resource",
  });
}

/**
 * Get agency filter for queries based on permission scope
 */
export function getAgencyFilter(
  scope: PermissionScope,
  agencyId?: string | null
): { agencyId?: string } | undefined {
  if (scope === PermissionScope.ALL) {
    return undefined; // No filter - return all
  }
  if (scope === PermissionScope.OWN && agencyId) {
    return { agencyId };
  }
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You don't have permission to access this resource",
  });
}

/**
 * Get user filter for queries based on permission scope
 */
export function getUserFilter(
  scope: PermissionScope,
  userId?: string
): { userId?: string } | undefined {
  if (scope === PermissionScope.ALL) {
    return undefined; // No filter - return all
  }
  if (scope === PermissionScope.OWN && userId) {
    return { userId };
  }
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You don't have permission to access this resource",
  });
}

/**
 * Build a comprehensive where clause based on permission scope and additional filters
 * 
 * @example
 * ```ts
 * const whereClause = buildWhereClause(
 *   scope,
 *   { contractorId: user.contractorId },
 *   { status: "active", category: "engineering" }
 * );
 * // If scope is ALL: { tenantId: "...", status: "active", category: "engineering" }
 * // If scope is OWN: { tenantId: "...", contractorId: "...", status: "active", category: "engineering" }
 * ```
 */
export function buildWhereClause<T extends Record<string, any>>(
  scope: PermissionScope,
  scopeFilter: Record<string, any>,
  additionalFilters?: T
): T & Record<string, any> {
  let whereClause: Record<string, any> = { ...additionalFilters };

  if (scope === PermissionScope.OWN) {
    whereClause = { ...whereClause, ...scopeFilter };
  } else if (scope === PermissionScope.NONE) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission to access this resource",
    });
  }

  return whereClause as T & Record<string, any>;
}

/**
 * Check if user can update a specific resource
 * 
 * DEEL Pattern:
 * - If user has manage.update permission, they can update any resource
 * - If user has update_own permission, they can only update their own resources
 */
export function canUpdateResource(
  userPermissions: string[],
  manageUpdatePermission: string,
  updateOwnPermission: string,
  resourceOwnerId: string,
  currentUserId: string,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin || hasPermission(userPermissions, manageUpdatePermission)) {
    return true;
  }
  if (hasPermission(userPermissions, updateOwnPermission)) {
    return resourceOwnerId === currentUserId;
  }
  return false;
}

/**
 * Check if user can delete a specific resource
 * 
 * DEEL Pattern:
 * - If user has manage.delete permission, they can delete any resource
 * - If user has delete_own permission, they can only delete their own resources
 */
export function canDeleteResource(
  userPermissions: string[],
  manageDeletePermission: string,
  deleteOwnPermission: string,
  resourceOwnerId: string,
  currentUserId: string,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin || hasPermission(userPermissions, manageDeletePermission)) {
    return true;
  }
  if (hasPermission(userPermissions, deleteOwnPermission)) {
    return resourceOwnerId === currentUserId;
  }
  return false;
}

/**
 * Extract user context from session for RBAC checks
 */
export function getUserContextFromSession(session: {
  user: {
    id: string;
    permissions?: string[];
    isSuperAdmin?: boolean;
    contractorId?: string | null;
    agencyId?: string | null;
  };
}): UserContext {
  return {
    userId: session.user.id,
    tenantId: "", // Should be set by the caller
    permissions: session.user.permissions || [],
    isSuperAdmin: session.user.isSuperAdmin,
    contractorId: session.user.contractorId,
    agencyId: session.user.agencyId,
  };
}

/**
 * Create a permission checker function bound to a user context
 * 
 * @example
 * ```ts
 * const checkPermission = createPermissionChecker(ctx.session.user.permissions, ctx.session.user.isSuperAdmin);
 * if (checkPermission("invoices.view_own")) {
 *   // User can view their own invoices
 * }
 * ```
 */
export function createPermissionChecker(
  userPermissions: string[],
  isSuperAdmin?: boolean
) {
  return (permission: string) => hasPermission(userPermissions, permission, isSuperAdmin);
}

/**
 * Get ownership field name based on resource type
 * Common patterns in DEEL-style apps
 */
export function getOwnershipField(resourceType: string): string {
  const ownershipMap: Record<string, string> = {
    contractor: "contractorId",
    agency: "agencyId",
    user: "userId",
    invoice: "contractorId",
    expense: "contractorId",
    timesheet: "contractorId",
    contract: "contractorId",
    payslip: "contractorId",
    remittance: "contractorId",
  };
  
  return ownershipMap[resourceType] || "userId";
}

/**
 * Assert that user has permission scope for a resource
 * Throws FORBIDDEN error if scope is NONE
 */
export function assertPermissionScope(scope: PermissionScope, resourceName: string): void {
  if (scope === PermissionScope.NONE) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You don't have permission to access ${resourceName}`,
    });
  }
}

/**
 * Check if user can view a specific resource based on ownership
 * 
 * @param userContext - User context with permissions and ownership info
 * @param viewOwnPermission - Permission to view own resources
 * @param viewAllPermission - Permission to view all resources
 * @param resourceOwnerId - The owner ID of the resource being accessed
 * @param ownershipField - The field name that determines ownership (e.g., "contractorId", "userId")
 * @returns true if user can view the resource, false otherwise
 */
export function canViewResource(
  userContext: UserContext,
  viewOwnPermission: string,
  viewAllPermission: string,
  resourceOwnerId: string,
  ownershipField: "contractorId" | "agencyId" | "userId" = "userId"
): boolean {
  const scope = getPermissionScope(
    userContext.permissions,
    viewOwnPermission,
    viewAllPermission,
    userContext.isSuperAdmin
  );

  if (scope === PermissionScope.ALL) {
    return true;
  }

  if (scope === PermissionScope.OWN) {
    const userOwnerId = ownershipField === "contractorId" 
      ? userContext.contractorId 
      : ownershipField === "agencyId"
      ? userContext.agencyId
      : userContext.userId;

    return userOwnerId === resourceOwnerId;
  }

  return false;
}
