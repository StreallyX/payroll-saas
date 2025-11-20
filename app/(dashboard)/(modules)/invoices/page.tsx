"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Send, CheckCircle, DollarSign } from "lucide-react";

import { api } from "@/lib/trpc";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { PermissionGuard, useHasPermission } from "@/components/guards/PermissionGuard";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceModal } from "@/components/modals/invoice-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { toast } from "sonner";
import { format } from "date-fns";

// -----------------------------------------------------------
// PERMISSIONS V3
// -----------------------------------------------------------
const P = {
  READ_OWN: "invoice.read.own",
  CREATE_OWN: "invoice.create.own",
  UPDATE_OWN: "invoice.update.own",
  
  LIST_GLOBAL: "invoice.list.global",
  CREATE_GLOBAL: "invoice.create.global",
  UPDATE_GLOBAL: "invoice.update.global",
  DELETE_GLOBAL: "invoice.delete.global",
  SEND_GLOBAL: "invoice.send.global",
  APPROVE_GLOBAL: "invoice.approve.global",
  PAY_GLOBAL: "invoice.pay.global",
  EXPORT_GLOBAL: "invoice.export.global",
};

function InvoicesPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ---------------------------
  // PERMISSION CHECKS
  // ---------------------------
  const canListAll = useHasPermission(P.LIST_GLOBAL);
  const canCreateGlobal = useHasPermission(P.CREATE_GLOBAL);
  const canCreateOwn = useHasPermission(P.CREATE_OWN);

  // ---------------------------
  // LOAD INVOICES
  // ---------------------------

  const {
    data: globalInvoices,
    isLoading: loadingGlobal
  } = api.invoice.getAll.useQuery(
    { limit: 200 },
    { enabled: canListAll }
  );

  const {
    data: ownInvoices,
    isLoading: loadingOwn
  } = api.invoice.getMyInvoices.useQuery(undefined, {
    enabled: !canListAll
  });

  const rows = useMemo(() => {
    if (canListAll) return globalInvoices?.invoices ?? [];
    return ownInvoices ?? [];
  }, [canListAll, globalInvoices, ownInvoices]);

  if (loadingGlobal || loadingOwn) {
    return <LoadingState message="Loading invoices..." />;
  }

  // ---------------------------
  // SEARCH FILTER
  // ---------------------------
  const s = searchQuery.toLowerCase();
  const filtered = rows.filter((inv) => {
    return (
      inv.invoiceNumber?.toLowerCase().includes(s) ||
      inv.contract?.contractor?.user?.name?.toLowerCase().includes(s) ||
      inv.status?.toLowerCase().includes(s)
    );
  });

  // ---------------------------
  // ACTIONS
  // ---------------------------
  const handleEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.invoice.delete.mutateAsync({ id });
      toast.success("Invoice deleted");
    } catch {
      toast.error("Failed to delete invoice");
    }
    setDeleteId(null);
  };

  // ---------------------------
  // BADGE
  // ---------------------------
  const badge = (status: string) => {
    const variants: any = {
      draft: "secondary",
      pending: "outline",
      approved: "default",
      paid: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Invoices"
        description={canListAll ? "Manage all invoices" : "Your invoices only"}
      >
        <PermissionGuard permissions={[P.CREATE_GLOBAL, P.CREATE_OWN]}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </PermissionGuard>
      </PageHeader>

      {/* SEARCH */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoice, contractor, status..."
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
          description="No invoices match your filters"
          actionLabel={
            canCreateGlobal || canCreateOwn ? "Create Invoice" : undefined
          }
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.contract?.contractor?.user?.name}</TableCell>
                    <TableCell>
                      {inv.createdAt ? format(new Date(inv.createdAt), "MMM dd yyyy") : "-"}
                    </TableCell>
                    <TableCell>{Number(inv.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>{badge(inv.status)}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* EDIT (OWN OR GLOBAL) */}
                        <PermissionGuard
                          permissions={[P.UPDATE_GLOBAL, P.UPDATE_OWN]}
                        >
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(inv)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>

                        {/* SEND */}
                        <PermissionGuard permission={P.SEND_GLOBAL}>
                          <Button variant="ghost" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>

                        {/* APPROVE */}
                        <PermissionGuard permission={P.APPROVE_GLOBAL}>
                          <Button variant="ghost" size="icon">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>

                        {/* PAY */}
                        <PermissionGuard permission={P.PAY_GLOBAL}>
                          <Button variant="ghost" size="icon">
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>

                        {/* DELETE */}
                        <PermissionGuard permission={P.DELETE_GLOBAL}>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(inv.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* MODALS */}
      <InvoiceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        invoice={editingInvoice}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Invoice"
        description="This action is irreversible"
      />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <RouteGuard
      permissions={[P.READ_OWN, P.LIST_GLOBAL]}
      requireAll={false}
    >
      <InvoicesPageContent />
    </RouteGuard>
  );
}
