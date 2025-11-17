
"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RouteGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  redirectTo?: string;
  showForbidden?: boolean;
}

/**
 * RouteGuard - Composant de garde pour les routes
 * 
 * Protège une page entière en vérifiant les permissions.
 * Si l'utilisateur n'a pas les permissions, il est redirigé ou voit une page 403.
 * 
 * @example
 * // Dans une page
 * export default function ContractorsPage() {
 *   return (
 *     <RouteGuard permission="contractors.manage.view_all">
 *       <ContractorsContent />
 *     </RouteGuard>
 *   );
 * }
 * 
 * @example
 * // Plusieurs permissions (OR logic)
 * <RouteGuard permissions={["invoices.view_own", "invoices.manage.view_all"]}>
 *   <InvoicesPage />
 * </RouteGuard>
 */
export function RouteGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  redirectTo = "/unauthorized",
  showForbidden = true,
}: RouteGuardProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  // Déterminer si l'utilisateur a accès
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // Aucune permission spécifiée = accès autorisé par défaut
    hasAccess = true;
  }

  useEffect(() => {
    // Si l'utilisateur n'a pas accès et que le chargement est terminé
    if (!isLoading && !hasAccess && !showForbidden) {
      router.push(redirectTo);
    }
  }, [hasAccess, isLoading, showForbidden, redirectTo, router]);

  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Pas authentifié
  if (!session) {
    router.push("/auth/login");
    return null;
  }

  // Pas d'accès
  if (!hasAccess) {
    if (showForbidden) {
      return <ForbiddenPage />;
    }
    return null; // Redirection en cours
  }

  // L'utilisateur a accès
  return <>{children}</>;
}

/**
 * Page 403 - Accès Interdit
 */
function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Accès Interdit</CardTitle>
          <CardDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur
            pour obtenir les permissions appropriées.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="mr-2 h-4 w-4" />
              Tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
