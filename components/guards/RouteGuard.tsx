"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { ForbiddenPageContent } from "./ForbiddenPageContent";

interface RouteGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  showForbidden?: boolean;
}

export function RouteGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  showForbidden = true,
}: RouteGuardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();

  // 1️⃣ Always wait for session loading first
  if (status === "loading" || isLoading) {
    return <div />; // preserve hook structure
  }

  // 2️⃣ Now check authenticated
  if (!session) {
    router.push("/auth/login");
    return <div />; // keep subtree stable
  }

  // 3️⃣ Compute access rights
  let allowed = false;
  if (permission) {
    allowed = hasPermission(permission);
  } else if (permissions.length > 0) {
    allowed = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    allowed = true;
  }

  // 4️⃣ Forbidden page (safe)
  if (!allowed) {
    return showForbidden ? <ForbiddenPageContent /> : <div />;
  }

  return <>{children}</>;
}
