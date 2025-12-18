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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { InvoiceModal } from "@/components/modals/invoice-modal";

import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  DollarSign,
  Calendar,
  ExternalLink
} from "lucide-react";

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
  
  // Sorting state
  const [sortField, setSortField] = useState<string>("issueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // -------------------------------
  // TRPC UTILS
  // -------------------------------
  const utils = api.useUtils();

  // -------------------------------
  // API HOOKS (CONDITIONALLY ENABLED BASED ON PERMISSIONS)
  // -------------------------------
  const globalQuery = api.invoice.getAll.useQuery(
    { limit: 200 },
    { enabled: CAN_LIST_GLOBAL }
  );

  const ownQuery = api.invoice.getMyInvoices.useQuery(
    undefined,
    { enabled: CAN_READ_OWN && !CAN_LIST_GLOBAL }
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
  // SORTING HANDLER
  // -------------------------------
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // -------------------------------
  // SEARCH & FILTER & SORT
  // -------------------------------
  const s = searchQuery.toLowerCase();
  const filtered = useMemo(() => {
    // First filter
    const filteredData = rows.filter((inv: any) => {
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

    // Then sort
    return filteredData.sort((a: any, b: any) => {
      let aVal, bVal;
      
      switch (sortField) {
        case "invoiceNumber":
          aVal = a.invoiceNumber || "";
          bVal = b.invoiceNumber || "";
          break;
        case "contract":
          aVal = a.contract?.contractReference || "";
          bVal = b.contract?.contractReference || "";
          break;
        case "issueDate":
          aVal = new Date(a.issueDate).getTime();
          bVal = new Date(b.issueDate).getTime();
          break;
        case "dueDate":
          aVal = new Date(a.dueDate).getTime();
          bVal = new Date(b.dueDate).getTime();
          break;
        case "totalAmount":
          aVal = Number(a.totalAmount);
          bVal = Number(b.totalAmount);
          break;
        case "status":
          aVal = a.workflowState || a.status || "";
          bVal = b.workflowState || b.status || "";
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, searchQuery, statusFilter, workflowFilter, sortField, sortDirection]);

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
  // SORTABLE COLUMN HEADER
  // -------------------------------
  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => handleSort(field)}
      >
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    </TableHead>
  );

  // -------------------------------
  // ENHANCED STATUS BADGE
  // -------------------------------
  const getStatusConfig = (workflowState?: string, status?: string) => {
    const state = workflowState || status || "draft";
    
    const configs: Record<string, { label: string; variant: any; icon: any; className?: string }> = {
      draft: { 
        label: "Draft", 
        variant: "secondary", 
        icon: FileText,
        className: "bg-gray-100 text-gray-700 hover:bg-gray-100"
      },
      for_approval: { 
        label: "Pending Approval", 
        variant: "outline", 
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
      },
      under_review: { 
        label: "Under Review", 
        variant: "outline", 
        icon: AlertCircle,
        className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
      },
      approved: { 
        label: "Approved", 
        variant: "default", 
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700 hover:bg-green-100"
      },
      rejected: { 
        label: "Rejected", 
        variant: "destructive", 
        icon: AlertCircle,
        className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
      },
      SENT: { 
        label: "Sent", 
        variant: "outline", 
        icon: CheckCircle2,
        className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
      },
      MARKED_PAID_BY_AGENCY: { 
        label: "Paid by Agency", 
        variant: "default", 
        icon: DollarSign,
        className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
      },
      PAYMENT_RECEIVED: { 
        label: "Payment Received", 
        variant: "default", 
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700 hover:bg-green-100"
      },
      submitted: { 
        label: "Submitted", 
        variant: "outline", 
        icon: FileText,
        className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
      },
      sent: { 
        label: "Sent", 
        variant: "outline", 
        icon: CheckCircle2,
        className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
      },
      paid: { 
        label: "Paid", 
        variant: "default", 
        icon: CheckCircle2,
        className: "bg-green-100 text-green-700 hover:bg-green-100"
      },
      overdue: { 
        label: "Overdue", 
        variant: "destructive", 
        icon: AlertCircle,
        className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
      },
    };
    
    return configs[state] || configs.draft;
  };

  const StatusBadge = ({ status, workflowState }: { status: string; workflowState?: string }) => {
    const config = getStatusConfig(workflowState, status);
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
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
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <SortableHeader field="invoiceNumber">Invoice #</SortableHeader>
                        <SortableHeader field="contract">Contract</SortableHeader>
                        <SortableHeader field="issueDate">Period</SortableHeader>
                        <SortableHeader field="totalAmount">Amount</SortableHeader>
                        <SortableHeader field="status">Status</SortableHeader>
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
                        
                        // Get sender and receiver names for tooltip
                        const senderName = inv.sender?.name || "N/A";
                        const receiverName = inv.receiver?.name || "N/A";
                        
                        // Format dates
                        const issueDateFormatted = format(new Date(inv.issueDate), "MMM dd, yyyy");
                        const dueDateFormatted = format(new Date(inv.dueDate), "MMM dd, yyyy");
                        
                        // Check if overdue
                        const isOverdue = new Date(inv.dueDate) < new Date() && 
                                         inv.workflowState !== "PAYMENT_RECEIVED" && 
                                         inv.workflowState !== "MARKED_PAID_BY_AGENCY";

                        return (
                          <TableRow 
                            key={inv.id} 
                            className="hover:bg-muted/50 transition-colors"
                          >
                            {/* Invoice Number */}
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">
                                  {inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`}
                                </span>
                              </div>
                            </TableCell>

                            {/* Contract - Now with working link! */}
                            <TableCell>
                              {inv.contract?.id ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link 
                                      href={`/contracts/simple/${inv.contract.id}`}
                                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                                    >
                                      <span className="truncate max-w-[180px]">
                                        {inv.contract.contractReference}
                                      </span>
                                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">View contract details</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      From: {senderName} → {receiverName}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-sm text-muted-foreground">No contract</span>
                              )}
                            </TableCell>

                            {/* Period (Issue → Due Date) */}
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground text-xs">Issued:</span>
                                  <span className="font-medium">{issueDateFormatted}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <span className="ml-4 text-muted-foreground text-xs">Due:</span>
                                  <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                    {dueDateFormatted}
                                    {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Amount */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold text-base">
                                  {Number(inv.totalAmount).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </span>
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <StatusBadge status={inv.status} workflowState={inv.workflowState} />
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {canReviewInvoice && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        asChild
                                      >
                                        <Link href={`/invoices/${inv.id}`}>
                                          <Clock className="mr-1.5 h-3.5 w-3.5" />
                                          Review
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Review and approve invoice</TooltipContent>
                                  </Tooltip>
                                )}
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      asChild
                                    >
                                      <Link href={`/invoices/${inv.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View invoice details</TooltipContent>
                                </Tooltip>

                                {canEdit && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setEditingInvoice(inv)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit invoice</TooltipContent>
                                  </Tooltip>
                                )}

                                {CAN_DELETE && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setDeleteId(inv.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete invoice</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
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
