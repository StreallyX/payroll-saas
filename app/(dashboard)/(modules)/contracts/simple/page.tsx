"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateMSAModal } from "@/components/contracts/simple/CreateMSAModal";
import { CreateSOWModal } from "@/components/contracts/simple/CreateSOWModal";
import { CreateNormContractModal } from "@/components/contracts/simple/CreateNormContractModal";
import { MinimalContractCard } from "@/components/contracts/simple/MinimalContractCard";
import { api } from "@/lib/trpc";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "next-auth/react";

/**
 * Page de liste des contrats simplifiés (MSA/SOW/NORM)
 * 
 * Fonctionnalités:
 * - Liste paginée des contrats
 * - Filtres (type, statut, recherche)
 * - Création de MSA
 * - Création de SOW
 * - Création de NORM
 */
export default function SimpleContractsPage() {
  // États des filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "msa" | "sow" | "norm">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "pending_admin_review" | "completed" | "active">("all");
  const [page, setPage] = useState(1);

  // États des modals
  const [showCreateMSA, setShowCreateMSA] = useState(false);
  const [showCreateSOW, setShowCreateSOW] = useState(false);
  const [showCreateNorm, setShowCreateNorm] = useState(false);

  // Session & permissions
  const { data: session } = useSession();
  const user = session?.user;

  const userPermissions: string[] = user?.permissions || [];

  // Vérifier si user a droit de créer un MSA, un SOW, ou un NORM
  const canCreateMSA = userPermissions.includes("contract_msa.create.global");
  const canCreateSOW = userPermissions.includes("contract_sow.create.global");
  const canCreateNorm = userPermissions.includes("contract.create.global");


  // Debounce de la recherche
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Query des contrats
  const { data, isLoading, refetch } = api.simpleContract.listSimpleContracts.useQuery({
    type: typeFilter,
    status: statusFilter,
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
  });

  const contracts = data?.contracts || [];
  const pagination = data?.pagination;

  /**
   * Change la page
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contrats simplifiés</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos MSA, SOW et NORM de manière simplifiée
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateMSA && (
            <Button onClick={() => setShowCreateMSA(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un MSA
            </Button>
          )}

          {canCreateSOW && (
            <Button variant="outline" onClick={() => setShowCreateSOW(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un SOW
            </Button>
          )}

          {canCreateNorm && (
            <Button variant="outline" onClick={() => setShowCreateNorm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un NORM
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contrat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filtre par type */}
          <Select value={typeFilter} onValueChange={(value: any) => {
            setTypeFilter(value);
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="msa">MSA uniquement</SelectItem>
              <SelectItem value="sow">SOW uniquement</SelectItem>
              <SelectItem value="norm">NORM uniquement</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre par statut */}
          <Select value={statusFilter} onValueChange={(value: any) => {
            setStatusFilter(value);
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending_admin_review">En attente de validation</SelectItem>
              <SelectItem value="completed">Complété</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Liste des contrats */}
      {isLoading ? (
        // Skeleton loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        // Empty state
        <Card className="p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun contrat trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearch || typeFilter !== "all" || statusFilter !== "all"
                ? "Essayez de modifier vos filtres de recherche"
                : "Commencez par créer votre premier MSA, SOW ou NORM"}
            </p>
            {!debouncedSearch && typeFilter === "all" && statusFilter === "all" && (
              <div className="flex items-center justify-center gap-2">
                {canCreateMSA && (
                  <Button onClick={() => setShowCreateMSA(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un MSA
                  </Button>
                )}
                {canCreateSOW && (
                  <Button variant="outline" onClick={() => setShowCreateSOW(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un SOW
                  </Button>
                )}
                {canCreateNorm && (
                  <Button variant="outline" onClick={() => setShowCreateNorm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un NORM
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : (
        // Liste des contrats
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts.map((contract) => (
              <MinimalContractCard
                key={contract.id}
                contract={contract}
                onDelete={() => refetch()}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} sur {pagination.totalPages} • {pagination.total} contrat{pagination.total > 1 ? "s" : ""} au total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.hasMore}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateMSAModal
        open={showCreateMSA}
        onOpenChange={setShowCreateMSA}
        onSuccess={() => refetch()}
      />

      <CreateSOWModal
        open={showCreateSOW}
        onOpenChange={setShowCreateSOW}
        onSuccess={() => refetch()}
      />

      <CreateNormContractModal
        open={showCreateNorm}
        onOpenChange={setShowCreateNorm}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
