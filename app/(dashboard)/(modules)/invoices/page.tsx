"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/trpc";

import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { InvoiceModal } from "@/components/modals/invoice-modal";

import { Eye, Edit, Trash2, Plus, Search } from "lucide-react";

function InvoicesPageContent() {
  const { data: session } = useSession();

  // -------------------------------
  // PERMISSIONS
  // -------------------------------
  const permissions = session?.user?.permissions ?? [];

  const CAN_LIST_GLOBAL = permissions.includes("invoice.list.global");
  const CAN_READ_OWN = permissions.includes("invoice.read.own");
  const CAN_CREATE = permissions.includes("invoice.create.global") || permissions.includes("invoice.create.own");
  const CAN_UPDATE_OWN = permissions.includes("invoice.update.own");
  const CAN_UPDATE_ALL = permissions.includes("invoice.update.global");
  const CAN_DELETE = permissions.includes("invoice.delete.global");

  // -------------------------------
  // UI STATE
  // -------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // -------------------------------
  // TRPC UTILS
  // -------------------------------
  const utils = api.useUtils();

  // -------------------------------
  // API HOOKS (NEVER CONDITIONAL)
  // -------------------------------
  const globalQuery = api.invoice.getAll.useQuery(
    { limit: 200 },
    { enabled: true }
  );

  const ownQuery = api.invoice.getMyInvoices.useQuery(
    undefined,
    { enabled: true }
  );

  const deleteMutation = api.invoice.deleteInvoice.useMutation({
    onSuccess: async () => {
      toast.success("Invoice deleted");
      await Promise.all([
        utils.invoice.getAll.invalidate(),
        utils.invoice.getMyInvoices.invalidate(),
      ]);
    },
    onError: () => toast.error("Failed to delete invoice"),
  });

  // -------------------------------
  // MERGE ROWS INDEPENDENT OF HOOK ORDER
  // -------------------------------
  const rows = useMemo(() => {
    if (CAN_LIST_GLOBAL) return globalQuery.data?.invoices ?? [];
    if (CAN_READ_OWN) return ownQuery.data ?? [];
    return [];
  }, [CAN_LIST_GLOBAL, CAN_READ_OWN, globalQuery.data, ownQuery.data]);

  // -------------------------------
  // SEARCH
  // -------------------------------
  const s = searchQuery.toLowerCase();
  const filtered = rows.filter((inv: any) => {
    const ref = inv.contract?.contractReference?.toLowerCase() || "";
    return (
      (inv.invoiceNumber ?? "").toLowerCase().includes(s) ||
      (inv.description ?? "").toLowerCase().includes(s) ||
      ref.includes(s) ||
      (inv.status ?? "").toLowerCase().includes(s)
    );
  });

  // -------------------------------
  // DELETE HANDLER
  // -------------------------------
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
    setDeleteId(null);
  };

  // -------------------------------
  // STATUS BADGE
  // -------------------------------
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, any> = {
      draft: "secondary",
      sent: "outline",
      paid: "default",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] ?? "outline"}>{status}</Badge>;
  };

  // -------------------------------
  // RENDER (NO EARLY RETURN)
  // -------------------------------
  const isLoading =
    (CAN_LIST_GLOBAL && globalQuery.isLoading) ||
    (CAN_READ_OWN && ownQuery.isLoading);

  return (
    <div className="space-y-6">

      {isLoading ? (
        <LoadingState message="Loading invoices..." />
      ) : (
        <>
          <PageHeader title="Invoices" description="Manage invoices">
            {CAN_CREATE && (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            )}
          </PageHeader>

          {/* SEARCH */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* TABLE */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="No invoices"
              description="Try another filter."
              actionLabel={CAN_CREATE ? "Create Invoice" : undefined}
              onAction={() => CAN_CREATE && setModalOpen(true)}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map((inv: any) => {
                      const canEdit =
                        CAN_UPDATE_ALL ||
                        (CAN_UPDATE_OWN && inv.createdBy === session?.user?.id);

                      return (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.contract?.contractReference || "-"}</TableCell>
                          <TableCell>{format(new Date(inv.issueDate), "MMM dd yyyy")}</TableCell>
                          <TableCell>{format(new Date(inv.dueDate), "MMM dd yyyy")}</TableCell>
                          <TableCell>{Number(inv.totalAmount).toFixed(2)}</TableCell>
                          <TableCell><StatusBadge status={inv.status} /></TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewInvoice(inv)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingInvoice(inv)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}

                              {CAN_DELETE && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(inv.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* CREATE / EDIT */}
      <InvoiceModal
        open={modalOpen || !!editingInvoice}
        onOpenChange={(o) => {
          if (!o) {
            setModalOpen(false);
            setEditingInvoice(null);
          }
        }}
        invoice={editingInvoice ?? undefined}
      />

      {/* VIEW ONLY */}
      <InvoiceModal
        open={!!viewInvoice}
        onOpenChange={(o) => !o && setViewInvoice(null)}
        invoice={viewInvoice ?? undefined}
        readOnly
      />

      {/* DELETE */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Invoice"
        description="This action cannot be undone."
      />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <RouteGuard permissions={["invoice.read.own", "invoice.list.global"]}>
      <InvoicesPageContent />
    </RouteGuard>
  );
}
