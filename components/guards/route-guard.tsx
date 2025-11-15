
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { LoadingPage } from "@/components/ui/loading-spinner";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallbackPath?: string;
}

export function RouteGuard({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = "/home",
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { hasPermission, hasAllPermissions, hasAnyPermission, isSuperAdmin } = usePermissions();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Super admin a toujours accès
    if (isSuperAdmin) {
      return;
    }

    // Vérification de permission unique
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(fallbackPath);
      return;
    }

    // Vérification de permissions multiples
    if (requiredPermissions.length > 0) {
      const hasAccess = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);

      if (!hasAccess) {
        router.push(fallbackPath);
        return;
      }
    }
  }, [status, session, pathname, requiredPermission, requiredPermissions]);

  if (status === "loading") {
    return <LoadingPage />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
