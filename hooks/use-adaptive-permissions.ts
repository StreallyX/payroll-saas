"use client";

import { usePermissions } from "./use-permissions";
import { useMemo } from "react";

export type AccessMode = "own" | "manage" | "both" | "none";

interface UseAdaptivePermissionsOptions {
  ownPermission?: string;
  ownPermissions?: string[];
  managePermission?: string;
  managePermissions?: string[];
  requireAll?: boolean;
}

/**
 * Hook pour gérer les permissions adaptatives dans les pages multi-rôles
 * 
 * Ce hook détermine automatiquement le mode d'accès de l'utilisateur
 * et fournit des helpers pour adapter le contenu.
 * 
 * @example
 * // Dans une page Invoices
 * const { mode, canViewOwn, canManage, canCreate, canUpdate } = useAdaptivePermissions({
 *   ownPermission: "invoices.view_own",
 *   managePermission: "invoices.manage.view_all"
 * });
 * 
 * if (mode === "manage") {
 *   // Afficher la vue admin
 * } else if (mode === "own") {
 *   // Afficher la vue personnelle
 * }
 */
export function useAdaptivePermissions(options: UseAdaptivePermissionsOptions) {
  const {
    ownPermission,
    ownPermissions = [],
    managePermission,
    managePermissions = [],
    requireAll = false,
  } = options;

  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = usePermissions();

  // Déterminer l'accès "own"
  const canViewOwn = useMemo(() => {
    if (isSuperAdmin) return true;
    
    if (ownPermission) {
      return hasPermission(ownPermission);
    }
    
    if (ownPermissions.length > 0) {
      return requireAll 
        ? hasAllPermissions(ownPermissions)
        : hasAnyPermission(ownPermissions);
    }
    
    return false;
  }, [ownPermission, ownPermissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin]);

  // Déterminer l'accès "manage"
  const canManage = useMemo(() => {
    if (isSuperAdmin) return true;
    
    if (managePermission) {
      return hasPermission(managePermission);
    }
    
    if (managePermissions.length > 0) {
      return requireAll
        ? hasAllPermissions(managePermissions)
        : hasAnyPermission(managePermissions);
    }
    
    return false;
  }, [managePermission, managePermissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin]);

  // Déterminer le mode d'accès
  const mode: AccessMode = useMemo(() => {
    if (canManage && canViewOwn) return "both";
    if (canManage) return "manage";
    if (canViewOwn) return "own";
    return "none";
  }, [canManage, canViewOwn]);

  // Permissions d'action courantes
  const canCreate = useMemo(() => {
    const createPermissions = [
      ownPermission?.replace(".view_own", ".create_own"),
      managePermission?.replace(".view_all", ".create"),
    ].filter(Boolean) as string[];
    
    return hasAnyPermission(createPermissions);
  }, [ownPermission, managePermission, hasAnyPermission]);

  const canUpdate = useMemo(() => {
    const updatePermissions = [
      ownPermission?.replace(".view_own", ".update_own"),
      managePermission?.replace(".view_all", ".update"),
    ].filter(Boolean) as string[];
    
    return hasAnyPermission(updatePermissions);
  }, [ownPermission, managePermission, hasAnyPermission]);

  const canDelete = useMemo(() => {
    const deletePermissions = [
      ownPermission?.replace(".view_own", ".delete_own"),
      managePermission?.replace(".view_all", ".delete"),
    ].filter(Boolean) as string[];
    
    return hasAnyPermission(deletePermissions);
  }, [ownPermission, managePermission, hasAnyPermission]);

  return {
    mode,
    canViewOwn,
    canManage,
    canCreate,
    canUpdate,
    canDelete,
    isSuperAdmin,
    // Helper functions
    isOwnMode: mode === "own",
    isManageMode: mode === "manage",
    isBothMode: mode === "both",
    hasNoAccess: mode === "none",
  };
}

/**
 * Hook pour obtenir des permissions spécifiques d'un module
 * 
 * @example
 * const invoicePermissions = useModulePermissions("invoices");
 * // Retourne: { canViewOwn, canViewAll, canCreate, canUpdate, canDelete, ... }
 */
export function useModulePermissions(module: string) {
  const { hasPermission } = usePermissions();

  return useMemo(() => {
    return {
      // View permissions
      canViewOwn: hasPermission(`${module}.view_own`),
      canViewAll: hasPermission(`${module}.manage.view_all`),
      
      // Create permissions
      canCreateOwn: hasPermission(`${module}.create_own`),
      canCreate: hasPermission(`${module}.manage.create`),
      
      // Update permissions
      canUpdateOwn: hasPermission(`${module}.update_own`),
      canUpdate: hasPermission(`${module}.manage.update`),
      
      // Delete permissions
      canDeleteOwn: hasPermission(`${module}.delete_own`),
      canDelete: hasPermission(`${module}.manage.delete`),
      
      // Common actions
      canSubmit: hasPermission(`${module}.submit`),
      canApprove: hasPermission(`${module}.manage.approve`),
      canReject: hasPermission(`${module}.manage.reject`),
      canExport: hasPermission(`${module}.manage.export`),
      
      // Meta
      hasAnyAccess: 
        hasPermission(`${module}.view_own`) || 
        hasPermission(`${module}.manage.view_all`),
      isAdmin: hasPermission(`${module}.manage.view_all`),
    };
  }, [module, hasPermission]);
}

/**
 * Hook pour les permissions de documents
 */
export function useDocumentPermissions(scope: "own" | "all" = "own") {
  const { hasPermission } = usePermissions();
  
  const prefix = scope === "own" ? "profile.documents" : "contractors.documents";
  
  return useMemo(() => ({
    canView: hasPermission(`${prefix}.view${scope === "all" ? "_all" : ""}`),
    canUpload: hasPermission(`${prefix}.upload${scope === "all" ? "" : "_own"}`),
    canDelete: hasPermission(`${prefix}.delete${scope === "all" ? "_all" : "_own"}`),
  }), [prefix, scope, hasPermission]);
}

/**
 * Hook pour les permissions de paiements
 */
export function usePaymentPermissions() {
  const { hasPermission } = usePermissions();
  
  return useMemo(() => ({
    // Payslips
    canViewOwnPayslips: hasPermission("payments.payslips.view_own"),
    canViewAllPayslips: hasPermission("payments.payslips.view_all"),
    canGeneratePayslips: hasPermission("payments.payslips.generate"),
    canSendPayslips: hasPermission("payments.payslips.send"),
    
    // Remits
    canViewOwnRemits: hasPermission("payments.remits.view_own"),
    canViewAllRemits: hasPermission("payments.remits.view_all"),
    canCreateRemits: hasPermission("payments.remits.create"),
    canProcessRemits: hasPermission("payments.remits.process"),
    
    // Payroll
    canViewOwnPayroll: hasPermission("payments.payroll.view_own"),
    canViewAllPayroll: hasPermission("payments.payroll.view_all"),
    canGeneratePayroll: hasPermission("payments.payroll.generate"),
    canUpdatePayroll: hasPermission("payments.payroll.update"),
    canMarkPaid: hasPermission("payments.payroll.mark_paid"),
  }), [hasPermission]);
}

/**
 * Hook pour les permissions de team
 */
export function useTeamPermissions() {
  const { hasPermission } = usePermissions();
  
  return useMemo(() => ({
    // Contractors
    canViewContractors: hasPermission("contractors.manage.view_all"),
    canCreateContractors: hasPermission("contractors.manage.create"),
    canUpdateContractors: hasPermission("contractors.manage.update"),
    canDeleteContractors: hasPermission("contractors.manage.delete"),
    
    // Agencies
    canViewAgencies: hasPermission("agencies.manage.view_all"),
    canCreateAgencies: hasPermission("agencies.manage.create"),
    canUpdateAgencies: hasPermission("agencies.manage.update"),
    canDeleteAgencies: hasPermission("agencies.manage.delete"),
    
    // Team management
    canViewTeam: hasPermission("team.view"),
    canManageTeam: hasPermission("team.manage"),
    canInviteMembers: hasPermission("team.invite"),
    canRemoveMembers: hasPermission("team.remove"),
  }), [hasPermission]);
}
