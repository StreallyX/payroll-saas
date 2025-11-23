"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Search, Plus, Edit, Trash2 } from "lucide-react";

import { api } from "@/lib/trpc";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { PayslipModal } from "@/components/modals/payslip-modal";

import { toast } from "sonner";

const MONTHS = [
  "",
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export default function PayslipsPage() {
  // ---------------------------------------------------------
  // PERMISSIONS
  // ---------------------------------------------------------
  const { data: session } = useSession();
  const permissions = session?.user?.permissions || [];

  const canListAll = permissions.includes("payslip.list.global");
  const canReadOwn = permissions.includes("payslip.read.own");
  const canCreate = permissions.includes("payslip.create.global");
  const canUpdate = permissions.includes("payslip.update.global");
  const canDelete = permissions.includes("payslip.delete.global");

  // ---------------------------------------------------------
  // API CALLS
  // ---------------------------------------------------------
  const emptyQuery = {
    data: [],
    isLoading: false,
    refetch: async () => {},
  };

  const payslipQuery = canListAll
    ? api.payslip.getAll.useQuery()
    : canReadOwn
    ? api.payslip.getAll.useQuery() // TRPC auto-scope → OWN seulement
    : emptyQuery;

  const { data: payslips = [], isLoading, refetch } = payslipQuery;
  const { data: stats } = api.payslip.getStats.useQuery();

  // ---------------------------------------------------------
  // UI STATES
  // ---------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState<any>(null);

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------
  const deleteMutation = api.payslip.delete.useMutation({
    onSuccess: () => {
      toast.success("Payslip supprimé");
      refetch();
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = () => {
    if (deleteId) deleteMutation.mutate({ id: deleteId });
  };

  // ---------------------------------------------------------
  // FILTERS
  // ---------------------------------------------------------
  const filteredPayslips = useMemo(() => {
    if (!searchQuery) return payslips;

    const q = searchQuery.toLowerCase();

    return payslips.filter((p: any) => {
      const name = p.user?.name?.toLowerCase() || "";
      const email = p.user?.email?.toLowerCase() || "";
      const monthLabel = MONTHS[p.month].toLowerCase();
      const year = p.year.toString();

      return (
        name.includes(q) ||
        email.includes(q) ||
        monthLabel.includes(q) ||
        year.includes(q)
      );
    });
  }, [payslips, searchQuery]);

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------
  if (isLoading) return <LoadingState />;

  // ---------------------------------------------------------
  // COMPONENT : Payslip Card
  // ---------------------------------------------------------
  const PayslipCard = ({ p }: { p: any }) => {
    const employee = p.user?.name || p.user?.email;

    return (
      <Card className="hover:shadow-md transition-shadow border border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-base">{employee}</p>
              <p className="text-xs text-gray-500">
                {MONTHS[p.month]} {p.year}
              </p>
            </div>

            <Badge
              variant="secondary"
              className={
                p.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : p.status === "sent"
                  ? "bg-blue-100 text-blue-700"
                  : p.status === "generated"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {p.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Brut</p>
              <p className="font-semibold">${p.grossPay}</p>
            </div>
            <div>
              <p className="text-gray-500">Net</p>
              <p className="font-semibold text-emerald-600">${p.netPay}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setEditingPayslip(p);
                  setModalOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteId(p.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulletins de Paie"
        description="Visualisez et gérez les bulletins de paie."
      >
        {canCreate && (
          <Button
            onClick={() => {
              setEditingPayslip(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Bulletin
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Ce mois</p>
            <p className="text-2xl font-bold">{stats?.thisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Générés</p>
            <p className="text-2xl font-bold">{stats?.generated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Envoyés</p>
            <p className="text-2xl font-bold">{stats?.sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">En attente</p>
            <p className="text-2xl font-bold">{stats?.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filteredPayslips.length === 0 ? (
        <EmptyState
          title="Aucun bulletin"
          description="Créez un bulletin pour commencer."
          actionLabel={canCreate ? "Créer un bulletin" : undefined}
          onAction={() => {
            setEditingPayslip(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPayslips.map((p: any) => (
            <PayslipCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* MODAL EDIT/CREATE */}
      <PayslipModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditingPayslip(null);
        }}
        payslip={editingPayslip}
        onSuccess={() => refetch()}
      />

      {/* DELETE DIALOG */}
      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le bulletin"
        description="Cette action est définitive."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
