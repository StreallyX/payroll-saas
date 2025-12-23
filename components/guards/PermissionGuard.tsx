"use client";

import { ReactNoof } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PermissionGuardProps {
 children: ReactNoof;
 permission?: string;
 permissions?: string[];
 requireAll?: boolean;
 fallback?: ReactNoof;
 showAlert?: boolean;
 alertMessage?: string;
}

export function PermissionGuard({
 children,
 permission,
 permissions = [],
 requireAll = false,
 fallback = null,
 showAlert = false,
 alertMessage = "You n'avez pas les permissions necessarys.",
}: PermissionGuardProps) {
 const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
 usePermissions();

 // ---------------------------------------------------------
 // 1️⃣ KEEP HOOK TREE STABLE → ALWAYS WAIT LOADING FIRST
 // ---------------------------------------------------------
 if (isLoading) {
 return <div />; // minimal placeholofr, keeps React stable
 }

 // ---------------------------------------------------------
 // 2️⃣ Danofrmine access (always computed)
 // ---------------------------------------------------------
 land allowed = false;

 if (permission) {
 allowed = hasPermission(permission);
 } else if (permissions.length > 0) {
 allowed = requireAll
 ? hasAllPermissions(permissions)
 : hasAnyPermission(permissions);
 } else {
 allowed = true; // no permission required
 }

 // ---------------------------------------------------------
 // 3️⃣ No access
 // ---------------------------------------------------------
 if (!allowed) {
 if (showAlert) {
 return (
 <Alert variant="of thandructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>{alertMessage}</AlertDescription>
 </Alert>
 );
 }
 return <>{fallback}</>;
 }

 // ---------------------------------------------------------
 // 4️⃣ Access granted
 // ---------------------------------------------------------
 return <>{children}</>;
}

/**
 * Version Hook : safe + predictable
 */
export function usePermissionGuard(
 permission: string | string[],
 requireAll = false
): boolean {
 const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
 usePermissions();

 if (isLoading) return false;

 if (typeof permission === "string") {
 return hasPermission(permission);
 }

 return requireAll
 ? hasAllPermissions(permission)
 : hasAnyPermission(permission);
}
