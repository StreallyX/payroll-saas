"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

import {
  Search,
  Eye,
  DollarSign,
  AlertCircle,
  Trash2,
  Edit
} from "lucide-react";

import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

import { StatsCard } from "@/components/contractor/stats-card";
import { StatusBadge } from "@/components/contractor/status-badge";
import { DataTable, Column } from "@/components/contractor/data-table";
import { EmptyState } from "@/components/contractor/empty-state";

import {
  StatsCardSkeleton,
  TableSkeleton
} from "@/components/contractor/loading-skeleton";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { RouteGuard } from "@/components/guards/RouteGuard";

import { useSession } from "next-auth/react";

import { RemittanceModal } from "@/components/remittance/RemittanceDetailsModal";
import { AddRemittanceModal } from "@/components/remittance/AddRemittanceModal";
import { Plus } from "lucide-react";

export default function RemittancePage() {
  const { toast } = useToast();
  const { data: session } = useSession();

  // Permissions ADMIN
  const isAdmin =
    session?.user?.permissions?.includes("remittance.update.global") ||
    session?.user?.permissions?.includes("remittance.delete.global");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRemit, setSelectedRemit] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // NEW : view | edit
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  // Add remittance modal
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Load remittances
  const {
    data: remittances,
    isLoading,
    error,
    refetch
  } = api.remittance.getMyRemittances.useQuery();

  const { data: summary } =
    api.remittance.getMyRemittanceSummary.useQuery();

  const deleteMutation = api.remittance.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Remittance removed successfully"
      });
      refetch();
      setModalOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  const updateMutation = api.remittance.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Updated",
        description: "Remittance updated successfully"
      });
      refetch();
      setModalOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleMarkPaid = (id: string) => {
    updateMutation.mutate({
      id,
      status: "completed"
    });
  };

  // Strong type Remittance
  type Remittance = {
    id: string;
    amount: number;
    status: "pending" | "completed" | "failed";
    completedAt: string | null;
    user?: {
      name?: string | null;
      email?: string | null;
    };
  };

  // ===== COLUMNS =====
  const columns: Column<Remittance>[] = [
    {
      key: "id",
      label: "Remit #",
      sortable: true,
      render: (r: Remittance) => <span className="font-medium">{r.id.slice(0, 8)}</span>
    },

    ...(isAdmin
      ? [
          {
            key: "user",
            label: "User",
            render: (r: Remittance) =>
              r.user?.name || r.user?.email || "—"
          }
        ]
      : []),

    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (r: Remittance) => (
        <span className="font-semibold">${r.amount.toFixed(2)}</span>
      )
    },

    {
      key: "completedAt",
      label: "Paid On",
      sortable: true,
      render: (r: Remittance) =>
        r.completedAt
          ? new Date(r.completedAt).toLocaleDateString()
          : "—"
    },

    {
      key: "status",
      label: "Status",
      render: (r: Remittance) => <StatusBadge status={r.status} />
    }
  ];

  return (
    <RouteGuard
      permissions={[
        "remittance.read.own",
        "remittance.read.global",
        "remittance.list.global"
      ]}
      requireAll={false}
    >
      <div className="space-y-6">

        {/* HEADER */}
        <PageHeader
          title={isAdmin ? "All Remittances" : "My Remittances"}
          description={
            isAdmin ? "Manage contractor payouts" : "Your payout confirmations"
          }
        >
          {isAdmin && (
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Remittance
            </Button>
          )}
        </PageHeader>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-4">
          {!summary ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Received"
                value={`$${summary.totalReceived?.toFixed(2)}`}
                icon={DollarSign}
              />

              <StatsCard
                title="Processing"
                value={`$${summary.processing?.toFixed(2)}`}
                icon={DollarSign}
              />

              <StatsCard
                title="This Month"
                value={`$${summary.thisMonth?.toFixed(2)}`}
                icon={DollarSign}
              />

              <StatsCard
                title="Avg Payment"
                value={`$${summary.averagePerPeriod?.toFixed(2)}`}
                icon={DollarSign}
              />
            </>
          )}
        </div>

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>{isAdmin ? "Remittances" : "Payment History"}</CardTitle>
            <CardDescription>
              {isAdmin
                ? "All payouts across tenant"
                : "Your inbound remittances"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <TableSkeleton />
            ) : !remittances?.length ? (
              <EmptyState
                icon={DollarSign}
                title="No remittances yet"
                description="Your remittance history will appear here once payments are created."
              />
            ) : (
              <>
                {/* Search */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search remittances..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <DataTable
                  data={remittances.filter((r: Remittance) =>
                    searchTerm
                      ? r.id.toLowerCase().includes(searchTerm.toLowerCase())
                      : true
                  )}
                  columns={columns}
                  actions={(remit: Remittance) => (
                    <div className="flex gap-2">

                      {/* VIEW BUTTON */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRemit(remit);
                          setModalMode("view");
                          setModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* EDIT BUTTON (Admin only) */}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRemit(remit);
                            setModalMode("edit");
                            setModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {/* DELETE */}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(remit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* MODAL */}
        <RemittanceModal
          remit={selectedRemit}
          open={modalOpen}
          onOpenChange={setModalOpen}
          mode={modalMode}
          onModeChange={setModalMode}

          // permissions PRO
          canUpdate={session?.user?.permissions?.includes("remittance.update.global")}
          canDelete={session?.user?.permissions?.includes("remittance.delete.global")}
          canMarkPaid={session?.user?.permissions?.includes("remittance.update.global")}

          onDelete={() => handleDelete(selectedRemit.id)}
          onMarkPaid={() => handleMarkPaid(selectedRemit.id)}
          onUpdate={({ status, description, notes }) =>
            updateMutation.mutate({
              id: selectedRemit.id,
              status: status as "pending" | "completed" | "failed",
              description,
              notes
            })
          }
        />

        {/* ADD REMITTANCE MODAL */}
        <AddRemittanceModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onSuccess={() => refetch()}
        />
      </div>
    </RouteGuard>
  );
}
