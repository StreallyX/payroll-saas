"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash2,
} from "lucide-react";

import { api } from "@/lib/trpc";
import { RouteGuard } from "@/components/guards/RouteGuard";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { InvoiceModal } from "@/components/modals/invoice-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { toast } from "sonner";
import { format } from "date-fns";

function InvoicesPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Queries ALWAYS run
  const globalQuery = api.invoice.getAll.useQuery(
    { limit: 200 },
    { enabled: true }
  );

  const ownQuery = api.invoice.getMyInvoices.useQuery(undefined, {
    enabled: true,
  });

  const deleteMutation = api.invoice.deleteInvoice.useMutation({
    onSuccess: () => toast.success("Invoice deleted"),
    onError: () => toast.error("Failed to delete invoice"),
  });

  // Loading
  if (globalQuery.isLoading || ownQuery.isLoading) {
    return <LoadingState message="Loading invoices..." />;
  }

  // Rows: we only show OWN invoices
  // (tu m'as dit "brut" donc je prends OWN, mais je peux changer)
  const rows = ownQuery.data ?? [];

  // Search filter
  const s = searchQuery.toLowerCase();
  const filtered = rows.filter((inv) => {
    const c = inv.contract?.contractReference?.toLowerCase() || "";
    return (
      inv.invoiceNumber?.toLowerCase().includes(s) ||
      inv.description?.toLowerCase().includes(s) ||
      c.includes(s) ||
      inv.status?.toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
    setDeleteId(null);
  };

  const getBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "outline" | "destructive"
    > = {
      draft: "secondary",
      sent: "outline",
      paid: "default",
      overdue: "destructive",
    };

    return <Badge variant={variants[status] ?? "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Your invoices">
        {/* ALWAYS show create button (no permissions) */}
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </PageHeader>

      {/* SEARCH INPUT */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoice, contract, description..."
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
          actionLabel="Create Invoice"
          onAction={() => setModalOpen(true)}
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
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.contract?.contractReference || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(inv.issueDate), "MMM dd yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(inv.dueDate), "MMM dd yyyy")}
                    </TableCell>
                    <TableCell>{Number(inv.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>{getBadge(inv.status)}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* ALWAYS show edit + delete (no permission logic) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingInvoice(inv)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(inv.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <InvoiceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        invoice={editingInvoice ?? undefined}
      />

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
