"use client";

import { useState, useMemo } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  Plus,
  FileDown,
  Pencil,
  Trash2,
  FileText,
  Eye,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Landmark,
} from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { api } from "@/lib/trpc";
import { StatsCard } from "@/components/shared/stats-card";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";

import { ContractViewModal } from "@/components/contracts/ContractView";
import { ContractCreateModal } from "@/components/contracts/ContractCreateModal";
import { ContractEdit } from "@/components/contracts/ContractEdit";
import { CreateContractSelectorModal } from "@/components/contracts/CreateContractSelectorModal";
import { MSACreateModal } from "@/components/contracts/MSACreateModal";
import { SOWCreateModal } from "@/components/contracts/SOWCreateModal";

import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function ManageContractsPage() {

  // ------------------------------------
  // Local State
  // ------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [editContract, setEditContract] = useState<any | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingContractId, setViewingContractId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("active");

  // NEW — selector modal for creating contract
  const [createSelectorOpen, setCreateSelectorOpen] = useState(false);
  const [createMSAOpen, setCreateMSAOpen] = useState(false);
  const [createSOWOpen, setCreateSOWOpen] = useState(false);
  const [createClassicOpen, setCreateClassicOpen] = useState(false);

  // ------------------------------------
  // Permissions
  // ------------------------------------
  const { data: session } = useSession();
  const permissions = session?.user?.permissions || [];

  const canListAll = permissions.includes("contract.list.global");
  const canReadOwn = permissions.includes("contract.read.own");
  const canCreate = permissions.includes("contract.create.global");
  const canUpdate = permissions.includes("contract.update.global");
  const canDelete = permissions.includes("contract.delete.global");
  const canExport = permissions.includes("contract.export.global");

  const canSeeMSA =
    permissions.includes("contract_msa.list.global") ||
    permissions.includes("contract_msa.read.own");

  const canSeeSOW =
    permissions.includes("contract_sow.list.global") ||
    permissions.includes("contract_sow.read.own");

  // ------------------------------------
  // Queries
  // ------------------------------------
  const emptyQuery = { data: [], isLoading: false, refetch: async () => {} };

  const baseQuery = canListAll
    ? api.contract.getAll.useQuery()
    : canReadOwn
    ? api.contract.getMyContracts.useQuery()
    : emptyQuery;

  const { data: rawContracts = [], isLoading, refetch } = baseQuery;

  // Filter classic contracts
  //const contracts = rawContracts.filter((c) => c.type === "contract");

  const { data: stats } = canListAll
    ? api.contract.getStats.useQuery()
    : { data: { total: rawContracts.length } };

  // ------------------------------------
  // Delete
  // ------------------------------------
  const deleteMutation = api.contract.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrat supprimé");
      refetch();
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = () => {
    if (deleteId) deleteMutation.mutate({ id: deleteId });
  };

  // ------------------------------------
  // Categorisation
  // ------------------------------------
  const categorizedContracts = useMemo(() => {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const active: any[] = [];
    const expired: any[] = [];
    const expiringSoon: any[] = [];

    rawContracts.forEach((c) => {
      const end = c.endDate ? new Date(c.endDate) : null;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.title?.toLowerCase().includes(q) ||
          c.participants.some((p) => p.user?.name?.toLowerCase().includes(q));
        if (!matches) return;
      }

      if (!end) active.push(c);
      else if (end < now) expired.push(c);
      else if (end <= soon) expiringSoon.push(c);
      else active.push(c);
    });

    return { active, expired, expiringSoon };
  }, [rawContracts, searchQuery]);

  if (isLoading) return <LoadingState message="Chargement des contrats..." />;

  // ------------------------------------
  // Table
  // ------------------------------------
  const ContractTable = ({ contracts, emptyMessage }: any) => {
    if (!contracts.length) {
      return (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={FileText}
              title="Aucun contrat"
              description={emptyMessage}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Jours Restants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {contracts.map((c: any) => {
                  const end = c.endDate ? new Date(c.endDate) : null;
                  const days = end
                    ? Math.ceil((end.getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <TableRow key={c.id}>
                      <TableCell>{c.title || "Sans titre"}</TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {c.participants.map((p: any) => (
                            <div key={p.id}>
                              <span className="font-medium">{p.user.name}</span>
                              <span className="text-xs text-gray-500">
                                {" "}
                                ({p.role})
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        {c.rate ? `${c.rate}/${c.rateType}` : "-"}
                      </TableCell>

                      <TableCell>
                        {c.startDate
                          ? new Date(c.startDate).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>

                      <TableCell>
                        {end ? end.toLocaleDateString("fr-FR") : "-"}
                      </TableCell>

                      <TableCell>
                        {days === null ? (
                          <span className="text-gray-500">∞</span>
                        ) : (
                          <Badge
                            variant={
                              days < 0
                                ? "destructive"
                                : days <= 30
                                ? "default"
                                : "secondary"
                            }
                          >
                            {days < 0 ? "Expiré" : `${days}j`}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingContractId(c.id);
                              setViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditContract(c)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(c.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ------------------------------------
  // PAGE
  // ------------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Contrats"
        description="Contrats multi-participants (contractor, client, approvers...)"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Actifs" value={categorizedContracts.active.length} icon={TrendingUp} iconColor="text-green-600" />
        <StatsCard title="Bientôt expirés" value={categorizedContracts.expiringSoon.length} icon={AlertTriangle} iconColor="text-yellow-600" />
        <StatsCard title="Expirés" value={categorizedContracts.expired.length} icon={Calendar} iconColor="text-red-600" />
        <StatsCard title="Total" value={stats?.total || 0} icon={FileText} iconColor="text-blue-600" />
      </div>

      {/* Action bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">

            {/* Search */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher un contrat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {canExport && (
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              )}

              {canCreate && (
                <Button onClick={() => setCreateSelectorOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Contrat
                </Button>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Actifs <Badge className="ml-2">{categorizedContracts.active.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="expiring">
            Expirant <Badge className="ml-2">{categorizedContracts.expiringSoon.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expirés <Badge className="ml-2">{categorizedContracts.expired.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ContractTable contracts={categorizedContracts.active} emptyMessage="Aucun contrat actif." />
        </TabsContent>

        <TabsContent value="expiring">
          <ContractTable contracts={categorizedContracts.expiringSoon} emptyMessage="Aucun contrat expire bientôt." />
        </TabsContent>

        <TabsContent value="expired">
          <ContractTable contracts={categorizedContracts.expired} emptyMessage="Aucun contrat expiré." />
        </TabsContent>
      </Tabs>

      {/* Delete */}
      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le contrat"
        description="Cette action est irréversible."
        isLoading={deleteMutation.isPending}
      />

      {/* NEW — CONTRACT CREATION SELECTOR */}
      <CreateContractSelectorModal
        open={createSelectorOpen}
        onOpenChange={setCreateSelectorOpen}
        canCreateMSA={permissions.includes("contract_msa.create.global")}
        canCreateSOW={permissions.includes("contract_sow.create.global")}
        canCreateContract={permissions.includes("contract.create.global")}
        onSelect={(type) => {
          if (type === "msa") setCreateMSAOpen(true);
          if (type === "sow") setCreateSOWOpen(true);
          if (type === "contract") setCreateClassicOpen(true);
        }}
      />

      {/* MSA modal — REAL MSA MODAL */}
      <MSACreateModal
        open={createMSAOpen}
        onOpenChange={setCreateMSAOpen}
        onSuccess={() => {
          toast.success("MSA créé");
          setCreateMSAOpen(false);
          refetch();
        }}
      />

      {/* SOW modal */}
      <SOWCreateModal
        open={createSOWOpen}
        onOpenChange={setCreateSOWOpen}
        onSuccess={() => {
          toast.success("SOW créé");
          setCreateSOWOpen(false);
          refetch();
        }}
      />

      {/* Classic Contract modal */}
      <ContractCreateModal
        open={createClassicOpen}
        onOpenChange={setCreateClassicOpen}
        onSuccess={() => {
          toast.success("Contrat créé");
          setCreateClassicOpen(false);
          refetch();
        }}
      />

      {/* Edit */}
      <ContractEdit
        open={!!editContract}
        onOpenChange={(o) => {
          if (!o) setEditContract(null);
        }}
        contractId={editContract?.id || null}
      />


      {/* View */}
      <ContractViewModal
        open={viewModalOpen}
        onOpenChange={(o) => {
          setViewModalOpen(o);
          if (!o) setViewingContractId(null);
        }}
        contractId={viewingContractId}
      />

    </div>
  );
}
