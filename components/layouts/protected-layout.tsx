
"use client";

import { ReactNode } from "react";
import { RouteGuard } from "@/components/guards/route-guard";
import { PageHeader } from "@/components/ui/page-header";

interface ProtectedLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  backHref?: string;
  headerActions?: ReactNode;
}

export function ProtectedLayout({
  children,
  title,
  description,
  requiredPermission,
  requiredPermissions,
  requireAll,
  backHref,
  headerActions,
}: ProtectedLayoutProps) {
  return (
    <RouteGuard
      requiredPermission={requiredPermission}
      requiredPermissions={requiredPermissions}
      requireAll={requireAll}
    >
      <div className="container mx-auto p-6 space-y-6">
        {(title || description || headerActions) && (
          <PageHeader
            title={title || ""}
            description={description}
            backHref={backHref}
          >
            {headerActions}
          </PageHeader>
        )}
        {children}
      </div>
    </RouteGuard>
  );
}
