"use client";

import { ReactNode } from "react";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";

interface ProtectedLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;

  // ❗ Correction : on utilise les bons noms
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;

  backHref?: string;
  headerActions?: ReactNode;
}

export function ProtectedLayout({
  children,
  title,
  description,

  permission,
  permissions,
  requireAll,

  backHref,
  headerActions,
}: ProtectedLayoutProps) {
  return (
    <RouteGuard
      permission={permission}
      permissions={permissions}
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
