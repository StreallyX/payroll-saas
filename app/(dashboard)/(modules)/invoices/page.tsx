"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import Link from "next/link";

import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { InvoiceModal } from "@/components/modals/invoice-modal";

import { Eye, Edit, Trash2, Plus, Search, AlertCircle, CheckCircle2, Clock } from "lucide-react";

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
  const CAN_APPROVE = permissions.includes("invoice.approve.global");
  const CAN_REVIEW = permissions.includes("invoice.review.global");

  // -------------------------------
  // UI STATE
  // -------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");
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
  // SEARCH & FILTER
  // -------------------------------
  const s = searchQuery.toLowerCase();
  const filtered = rows.filter((inv: any) => {
    // Search filter
    const ref = inv.contract?.contractReference?.toLowerCase() || "";
    const matchesSearch = 
      (inv.invoiceNumber ?? "").toLowerCase().includes(s) ||
      (inv.description ?? "").toLowerCase().includes(s) ||
      ref.includes(s) ||
      (inv.status ?? "").toLowerCase().includes(s);
    
    // Status filter
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    
    // Workflow filter
    const matchesWorkflow = workflowFilter === "all" || inv.workflowState === workflowFilter;
    
    return matchesSearch && matchesStatus && matchesWorkflow;
  });

  // Count invoices by workflow state
  const pendingApprovalCount = rows.filter((inv: any) => inv.workflowState === "for_approval").length;
  const approvedCount = rows.filter((inv: any) => inv.workflowState === "approved").length;

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
  const StatusBadge = ({ status, workflowState }: { status: string; workflowState?: string }) => {
    const variants: Record<string, any> = {
      draft: "secondary",
      submitted: "outline",
      sent: "outline",
      paid: "default",
      overdue: "destructive",
      for_approval: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    
    // Show workflow state if available, otherwise show status
    const displayValue = workflowState || status;
    const displayText = displayValue.replace(/_/g, " ");
    
    return <Badge variant={variants[displayValue] ?? "outline"}>{displayText}</Badge>;
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
          <PageHeader title="Invoices" description="Manage and approve invoices">
            {CAN_CREATE && (
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            )}
          </PageHeader>

          {/* TABS FOR WORKFLOW STATES */}
          {(CAN_APPROVE || CAN_REVIEW) && (
            <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setWorkflowFilter(v === "all" ? "all" : v)}>
              <TabsList>
                <TabsTrigger value="all">
                  All Invoices ({rows.length})
                </TabsTrigger>
                <TabsTrigger value="for_approval">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Pending Approval ({pendingApprovalCount})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approved ({approvedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* SEARCH & FILTERS */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
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
                      <TableHead>Sender</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map((inv: any) => {
                      const canEdit =
                        CAN_UPDATE_ALL ||
                        (CAN_UPDATE_OWN && inv.createdBy === session?.user?.id);
                      
                      const canReviewInvoice = 
                        (CAN_REVIEW || CAN_APPROVE) && 
                        (inv.workflowState === "for_approval" || inv.workflowState === "under_review");
                      
                      // Get sender and receiver names
                      const senderName = inv.sender?.name || "N/A";
                      const receiverName = inv.receiver?.name || "N/A";
                      
                      // Get payment status badge
                      const getPaymentBadge = () => {
                        if (inv.workflowState === "PAYMENT_RECEIVED" || inv.paymentReceivedAt) {
                          return <Badge className="bg-green-100 text-green-800">Received</Badge>;
                        }
                        if (inv.workflowState === "MARKED_PAID_BY_AGENCY" || inv.agencyMarkedPaidAt) {
                          return <Badge className="bg-blue-100 text-blue-800">Paid by Agency</Badge>;
                        }
                        if (inv.workflowState === "SENT") {
                          return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
                        }
                        return <Badge variant="outline">-</Badge>;
                      };

                      return (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`}</TableCell>
                          <TableCell>{inv.contract?.contractReference || "-"}</TableCell>
                          <TableCell className="text-sm">{senderName}</TableCell>
                          <TableCell className="text-sm">{receiverName}</TableCell>
                          <TableCell>{format(new Date(inv.issueDate), "MMM dd yyyy")}</TableCell>
                          <TableCell>{format(new Date(inv.dueDate), "MMM dd yyyy")}</TableCell>
                          <TableCell className="font-medium">${Number(inv.totalAmount).toFixed(2)}</TableCell>
                          <TableCell><StatusBadge status={inv.status} workflowState={inv.workflowState} /></TableCell>
                          <TableCell>{getPaymentBadge()}</TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {canReviewInvoice && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/invoices/${inv.id}`}>
                                    <Clock className="mr-1 h-3 w-3" />
                                    Review
                                  </Link>
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/invoices/${inv.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
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
