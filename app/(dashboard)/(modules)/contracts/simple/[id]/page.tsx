"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MinimalContractView } from "@/components/contracts/simple/MinimalContractView";
import { api } from "@/lib/trpc";
import Link from "next/link";

/**
 * Page de détails d'un contrat simplifié
 * 
 * URL: /contracts/simple/[id]
 * 
 * Affiche:
 * - Toutes les informations du contrat
 * - Le document PDF
 * - Les participants
 * - La timeline du workflow
 * - Les contrats liés (parent ou enfants)
 * - Les actions disponibles selon le statut
 */
export default function SimpleContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  // Query du contrat
  const { data: contract, isLoading, error, refetch } = api.simpleContract.getSimpleContractById.useQuery(
    { id: contractId },
    {
      enabled: !!contractId,
      retry: false,
    }
  );

  // Vérification des permissions (à améliorer avec un système de permissions réel)
  // Pour l'instant, on suppose que l'utilisateur a les permissions
  const permissions = {
    canUpdate: true,
    canApprove: true,
    canDelete: true,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement du contrat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !contract) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <p>
              {error?.message || "Contrat introuvable"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/contracts/simple">
                  Retour à la liste
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <MinimalContractView
        contract={contract}
        permissions={permissions}
        onUpdate={() => refetch()}
      />
    </div>
  );
}
