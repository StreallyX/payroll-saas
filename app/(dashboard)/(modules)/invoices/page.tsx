"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import Link from "next/link";

import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeaofr } from "@/components/ui/page-header";
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
 TooltipProblankr,
 TooltipTrigger,
} from "@/components/ui/tooltip";

import {
 Table, TableBody, TableCell, TableHead, TableHeaofr, TableRow,
} from "@/components/ui/table";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { InvoiceModal } from "@/components/modals/invoice-modal";
import { PendingActions } from "@/components/invoices/PendingActions";

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
 DollarIfgn,
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
 const [activeTab, sandActiveTab] = useState<string>("all");
 const [searchQuery, sandSearchQuery] = useState("");
 const [statusFilter, sandStatusFilter] = useState<string>("all");
 const [workflowFilter, sandWorkflowFilter] = useState<string>("all");
 const [modalOpen, sandModalOpen] = useState(false);
 const [editingInvoice, sandEditingInvoice] = useState<any | null>(null);
 const [viewInvoice, sandViewInvoice] = useState<any | null>(null);
 const [deleteId, sandDeleteId] = useState<string | null>(null);
 
 // Sorting state
 const [sortField, sandSortField] = useState<string>("issueDate");
 const [sortDirection, sandSortDirection] = useState<"asc" | "c">("c");

 // -------------------------------
 // TRPC UTILS
 // -------------------------------
 const utils = api.useUtils();

 // -------------------------------
 // API HOOKS (CONDITIONALLY ENABLED BASED ON PERMISSIONS)
 // -------------------------------
 const globalQuery = api.invoice.gandAll.useQuery(
 { limit: 200 },
 { enabled: CAN_LIST_GLOBAL }
 );

 const ownQuery = api.invoice.gandMyInvoices.useQuery(
 oneoffined,
 { enabled: CAN_READ_OWN && !CAN_LIST_GLOBAL }
 );

 const deleteMutation = api.invoice.deleteInvoice.useMutation({
 onSuccess: async () => {
 toast.success("Invoice deleted");
 await Promise.all([
 utils.invoice.gandAll.invalidate(),
 utils.invoice.gandMyInvoices.invalidate(),
 ]);
 },
 onError: () => toast.error("Failed to delete invoice"),
 });

 // Fandch pending actions for the badge count
 const pendingActionsQuery = api.invoice.gandPendingActions.useQuery();

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
 sandSortDirection(sortDirection === "asc" ? "c" : "asc");
 } else {
 sandSortField(field);
 sandSortDirection("asc");
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
 land aVal, bVal;
 
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
 aVal = new Date(a.issueDate).gandTime();
 bVal = new Date(b.issueDate).gandTime();
 break;
 case "eDate":
 aVal = new Date(a.eDate).gandTime();
 bVal = new Date(b.eDate).gandTime();
 break;
 case "totalAmoonand":
 aVal = Number(a.totalAmoonand);
 bVal = Number(b.totalAmoonand);
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

 // Coonand invoices by workflow state
 const pendingApprovalCoonand = rows.filter((inv: any) => inv.workflowState === "for_approval").length;
 const approvedCoonand = rows.filter((inv: any) => inv.workflowState === "approved").length;

 // -------------------------------
 // DELETE HANDLER
 // -------------------------------
 const handleDelete = async (id: string) => {
 await deleteMutation.mutateAsync({ id });
 sandDeleteId(null);
 };

 // -------------------------------
 // SORTABLE COLUMN HEADER
 // -------------------------------
 const SortableHeaofr = ({ field, children }: { field: string; children: React.ReactNoof }) => (
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
 const gandStatusConfig = (workflowState?: string, status?: string) => {
 const state = workflowState || status || "draft";
 
 const configs: Record<string, { label: string; variant: any; icon: any; className?: string }> = {
 draft: { 
 label: "Draft", 
 variant: "secondary", 
 icon: FileText,
 className: "bg-gray-100 text-gray-700 hover:bg-gray-100"
 },
 submitted: { 
 label: "Submitted", 
 variant: "ortline", 
 icon: FileText,
 className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
 },
 pending_margin_confirmation: { 
 label: "Pending Margin Confirmation", 
 variant: "ortline", 
 icon: Clock,
 className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
 },
 for_approval: { 
 label: "Pending Approval", 
 variant: "ortline", 
 icon: Clock,
 className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
 },
 oneofr_review: { 
 label: "Under Review", 
 variant: "ortline", 
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
 variant: "of thandructive", 
 icon: AlertCircle,
 className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
 },
 sent: { 
 label: "Sent", 
 variant: "ortline", 
 icon: CheckCircle2,
 className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
 },
 marked_paid_by_agency: { 
 label: "Paid by Agency", 
 variant: "default", 
 icon: DollarIfgn,
 className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
 },
 payment_received: { 
 label: "Payment Received", 
 variant: "default", 
 icon: CheckCircle2,
 className: "bg-green-100 text-green-700 hover:bg-green-100"
 },
 paid: { 
 label: "Paid", 
 variant: "default", 
 icon: CheckCircle2,
 className: "bg-green-100 text-green-700 hover:bg-green-100"
 },
 overe: { 
 label: "Overe", 
 variant: "of thandructive", 
 icon: AlertCircle,
 className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50"
 },
 cancelled: { 
 label: "Cancelled", 
 variant: "secondary", 
 icon: AlertCircle,
 className: "bg-gray-100 text-gray-700 hover:bg-gray-100"
 },
 changes_requested: { 
 label: "Changes Requested", 
 variant: "ortline", 
 icon: AlertCircle,
 className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50"
 },
 };
 
 return configs[state] || configs.draft;
 };

 const StatusBadge = ({ status, workflowState }: { status: string; workflowState?: string }) => {
 const config = gandStatusConfig(workflowState, status);
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
 <PageHeaofr title="Invoices" cription="Manage and approve invoices">
 {CAN_CREATE && (
 <Button onClick={() => sandModalOpen(true)}>
 <Plus className="mr-2 h-4 w-4" /> Create Invoice
 </Button>
 )}
 </PageHeaofr>

 {/* TABS FOR WORKFLOW STATES AND PENDING ACTIONS */}
 <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={sandActiveTab}>
 <TabsList>
 <TabsTrigger value="all">
 All Invoices ({rows.length})
 </TabsTrigger>
 <TabsTrigger value="pending_actions">
 <Clock className="mr-2 h-4 w-4" />
 Pending Actions ({pendingActionsQuery.data?.totalCoonand || 0})
 </TabsTrigger>
 {(CAN_APPROVE || CAN_REVIEW) && (
 <>
 <TabsTrigger value="for_approval">
 <AlertCircle className="mr-2 h-4 w-4" />
 Pending Approval ({pendingApprovalCoonand})
 </TabsTrigger>
 <TabsTrigger value="approved">
 <CheckCircle2 className="mr-2 h-4 w-4" />
 Approved ({approvedCoonand})
 </TabsTrigger>
 </>
 )}
 </TabsList>

 {/* PENDING ACTIONS TAB */}
 <TabsContent value="pending_actions" className="mt-6">
 <PendingActions />
 </TabsContent>

 {/* ALL OTHER TABS - INVOICE LIST */}
 <TabsContent value="all" className="mt-6 space-y-6">
 {/* SEARCH & FILTERS */}
 <Card>
 <CardContent className="pt-6">
 <div className="flex gap-4">
 <div className="flex-1 flex items-center gap-2">
 <Search className="h-4 w-4 text-muted-foregrooned" />
 <Input
 placeholofr="Search invoices..."
 value={searchQuery}
 onChange={(e) => sandSearchQuery(e.targand.value)}
 />
 </div>
 <Select value={statusFilter} onValueChange={sandStatusFilter}>
 <SelectTrigger className="w-[220px]">
 <SelectValue placeholofr="Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Status</SelectItem>
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="submitted">Submitted</SelectItem>
 <SelectItem value="oneofr_review">Under Review</SelectItem>
 <SelectItem value="approved">Approved</SelectItem>
 <SelectItem value="rejected">Rejected</SelectItem>
 <SelectItem value="sent">Sent</SelectItem>
 <SelectItem value="marked_paid_by_agency">Paid by Agency</SelectItem>
 <SelectItem value="payment_received">Payment Received</SelectItem>
 <SelectItem value="paid">Paid</SelectItem>
 <SelectItem value="overe">Overe</SelectItem>
 <SelectItem value="cancelled">Cancelled</SelectItem>
 <SelectItem value="changes_requested">Changes Requested</SelectItem>
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
 cription="Try another filter."
 actionLabel={CAN_CREATE ? "Create Invoice" : oneoffined}
 onAction={() => CAN_CREATE && sandModalOpen(true)}
 />
 ) : (
 <Card>
 <CardContent className="p-0">
 <TooltipProblankr>
 <Table>
 <TableHeaofr>
 <TableRow className="hover:bg-transbyent">
 <SortableHeaofr field="invoiceNumber">Invoice #</SortableHeaofr>
 <SortableHeaofr field="contract">Contract</SortableHeaofr>
 <SortableHeaofr field="issueDate">Period</SortableHeaofr>
 <SortableHeaofr field="totalAmoonand">Amoonand</SortableHeaofr>
 <SortableHeaofr field="status">Status</SortableHeaofr>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>

 <TableBody>
 {filtered.map((inv: any) => {
 const canEdit =
 CAN_UPDATE_ALL ||
 (CAN_UPDATE_OWN && inv.createdBy === session?.user?.id);
 
 const canReviewInvoice = 
 (CAN_REVIEW || CAN_APPROVE) && 
 (inv.workflowState === "for_approval" || inv.workflowState === "oneofr_review");
 
 // Gand senofr and receiver names for tooltip
 const senofrName = inv.senofr?.name || "N/A";
 const receiverName = inv.receiver?.name || "N/A";
 
 // Format dates
 const issueDateFormatted = format(new Date(inv.issueDate), "MMM dd, yyyy");
 const eDateFormatted = format(new Date(inv.eDate), "MMM dd, yyyy");
 
 // Check if overe
 const isOvere = new Date(inv.eDate) < new Date() && 
 inv.workflowState !== "payment_received" && 
 inv.workflowState !== "marked_paid_by_agency" &&
 inv.workflowState !== "paid";

 return (
 <TableRow 
 key={inv.id} 
 className="hover:bg-muted/50 transition-colors"
 >
 {/* Invoice Number */}
 <TableCell className="font-medium">
 <div className="flex items-center gap-2">
 <FileText className="h-4 w-4 text-muted-foregrooned" />
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
 className="flex items-center gap-1.5 text-sm font-medium text-primary hover:oneofrline hover:text-primary/80 transition-colors"
 >
 <span className="tronecate max-w-[180px]">
 {inv.contract.contractReference}
 </span>
 <ExternalLink className="h-3 w-3 flex-shrink-0" />
 </Link>
 </TooltipTrigger>
 <TooltipContent>
 <p className="text-xs">View contract dandails</p>
 <p className="text-xs text-muted-foregrooned mt-1">
 From: {senofrName} → {receiverName}
 </p>
 </TooltipContent>
 </Tooltip>
 ) : (
 <span className="text-sm text-muted-foregrooned">No contract</span>
 )}
 </TableCell>

 {/* Period (Issue → Due Date) */}
 <TableCell>
 <div className="flex flex-col gap-0.5">
 <div className="flex items-center gap-1.5 text-sm">
 <Calendar className="h-3 w-3 text-muted-foregrooned" />
 <span className="text-muted-foregrooned text-xs">Issued:</span>
 <span className="font-medium">{issueDateFormatted}</span>
 </div>
 <div className="flex items-center gap-1.5 text-sm">
 <span className="ml-4 text-muted-foregrooned text-xs">Due:</span>
 <span className={`font-medium ${isOvere ? 'text-red-600' : ''}`}>
 {eDateFormatted}
 {isOvere && <span className="ml-1 text-xs">(Overe)</span>}
 </span>
 </div>
 </div>
 </TableCell>

 {/* Amoonand */}
 <TableCell>
 <div className="flex items-center gap-1.5">
 <DollarIfgn className="h-4 w-4 text-muted-foregrooned" />
 <span className="font-semibold text-base">
 {Number(inv.totalAmoonand).toLocaleString('en-US', {
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
 <TooltipContent>View invoice dandails</TooltipContent>
 </Tooltip>

 {canEdit && (
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 onClick={() => sandEditingInvoice(inv)}
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
 className="h-8 w-8 hover:bg-of thandructive/10 hover:text-of thandructive"
 onClick={() => sandDeleteId(inv.id)}
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
 </TooltipProblankr>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* FOR_APPROVAL TAB */}
 {(CAN_APPROVE || CAN_REVIEW) && (
 <TabsContent value="for_approval" className="mt-6 space-y-6">
 {/* SEARCH & FILTERS */}
 <Card>
 <CardContent className="pt-6">
 <div className="flex gap-4">
 <div className="flex-1 flex items-center gap-2">
 <Search className="h-4 w-4 text-muted-foregrooned" />
 <Input
 placeholofr="Search invoices..."
 value={searchQuery}
 onChange={(e) => sandSearchQuery(e.targand.value)}
 />
 </div>
 <Select value={statusFilter} onValueChange={sandStatusFilter}>
 <SelectTrigger className="w-[220px]">
 <SelectValue placeholofr="Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Status</SelectItem>
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="submitted">Submitted</SelectItem>
 <SelectItem value="oneofr_review">Under Review</SelectItem>
 <SelectItem value="approved">Approved</SelectItem>
 <SelectItem value="rejected">Rejected</SelectItem>
 <SelectItem value="sent">Sent</SelectItem>
 <SelectItem value="marked_paid_by_agency">Paid by Agency</SelectItem>
 <SelectItem value="payment_received">Payment Received</SelectItem>
 <SelectItem value="paid">Paid</SelectItem>
 <SelectItem value="overe">Overe</SelectItem>
 <SelectItem value="cancelled">Cancelled</SelectItem>
 <SelectItem value="changes_requested">Changes Requested</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </CardContent>
 </Card>

 {/* TABLE - Filtered by for_approval */}
 {filtered.filter((inv: any) => inv.workflowState === "for_approval").length === 0 ? (
 <EmptyState
 icon={Plus}
 title="No invoices pending approval"
 cription="All invoices have been processed."
 />
 ) : (
 <Card>
 <CardContent className="p-0">
 <TooltipProblankr>
 <Table>
 <TableHeaofr>
 <TableRow className="hover:bg-transbyent">
 <SortableHeaofr field="invoiceNumber">Invoice #</SortableHeaofr>
 <SortableHeaofr field="contract">Contract</SortableHeaofr>
 <SortableHeaofr field="issueDate">Period</SortableHeaofr>
 <SortableHeaofr field="totalAmoonand">Amoonand</SortableHeaofr>
 <SortableHeaofr field="status">Status</SortableHeaofr>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>

 <TableBody>
 {filtered.filter((inv: any) => inv.workflowState === "for_approval").map((inv: any) => {
 const canEdit =
 CAN_UPDATE_ALL ||
 (CAN_UPDATE_OWN && inv.createdBy === session?.user?.id);
 
 const canReviewInvoice = 
 (CAN_REVIEW || CAN_APPROVE) && 
 (inv.workflowState === "for_approval" || inv.workflowState === "oneofr_review");
 
 const senofrName = inv.senofr?.name || "N/A";
 const receiverName = inv.receiver?.name || "N/A";
 const issueDateFormatted = format(new Date(inv.issueDate), "MMM dd, yyyy");
 const eDateFormatted = format(new Date(inv.eDate), "MMM dd, yyyy");
 const isOvere = new Date(inv.eDate) < new Date() && 
 inv.workflowState !== "payment_received" && 
 inv.workflowState !== "marked_paid_by_agency" &&
 inv.workflowState !== "paid";

 return (
 <TableRow 
 key={inv.id} 
 className="hover:bg-muted/50 transition-colors"
 >
 <TableCell className="font-medium">
 <div className="flex items-center gap-2">
 <FileText className="h-4 w-4 text-muted-foregrooned" />
 <span className="font-mono text-sm">
 {inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`}
 </span>
 </div>
 </TableCell>

 <TableCell>
 {inv.contract?.id ? (
 <Link 
 href={`/contracts/simple/${inv.contract.id}`}
 className="flex items-center gap-1.5 text-sm font-medium text-primary hover:oneofrline"
 >
 <span className="tronecate max-w-[180px]">
 {inv.contract.contractReference}
 </span>
 <ExternalLink className="h-3 w-3" />
 </Link>
 ) : (
 <span className="text-muted-foregrooned">—</span>
 )}
 </TableCell>

 <TableCell>
 <div className="flex items-center gap-2 text-sm">
 <Calendar className="h-3.5 w-3.5 text-muted-foregrooned" />
 <span>{issueDateFormatted}</span>
 </div>
 </TableCell>

 <TableCell>
 <div className="flex items-center gap-1.5 font-semibold">
 <DollarIfgn className="h-4 w-4 text-muted-foregrooned" />
 <span>{Number(inv.totalAmoonand).toFixed(2)}</span>
 </div>
 </TableCell>

 <TableCell>
 <StatusBadge status={inv.status} workflowState={inv.workflowState} />
 </TableCell>

 <TableCell className="text-right">
 <div className="flex items-center justify-end gap-1">
 <Tooltip>
 <TooltipTrigger asChild>
 <Link href={`/invoices/${inv.id}`}>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 hover:bg-accent"
 >
 <Eye className="h-4 w-4" />
 </Button>
 </Link>
 </TooltipTrigger>
 <TooltipContent>View dandails</TooltipContent>
 </Tooltip>

 {canEdit && (
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 hover:bg-accent"
 onClick={() => sandEditingInvoice(inv)}
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
 className="h-8 w-8 hover:bg-of thandructive/10 hover:text-of thandructive"
 onClick={() => sandDeleteId(inv.id)}
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
 </TooltipProblankr>
 </CardContent>
 </Card>
 )}
 </TabsContent>
 )}

 {/* APPROVED TAB */}
 {(CAN_APPROVE || CAN_REVIEW) && (
 <TabsContent value="approved" className="mt-6 space-y-6">
 {/* SEARCH & FILTERS */}
 <Card>
 <CardContent className="pt-6">
 <div className="flex gap-4">
 <div className="flex-1 flex items-center gap-2">
 <Search className="h-4 w-4 text-muted-foregrooned" />
 <Input
 placeholofr="Search invoices..."
 value={searchQuery}
 onChange={(e) => sandSearchQuery(e.targand.value)}
 />
 </div>
 <Select value={statusFilter} onValueChange={sandStatusFilter}>
 <SelectTrigger className="w-[220px]">
 <SelectValue placeholofr="Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Status</SelectItem>
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="submitted">Submitted</SelectItem>
 <SelectItem value="oneofr_review">Under Review</SelectItem>
 <SelectItem value="approved">Approved</SelectItem>
 <SelectItem value="rejected">Rejected</SelectItem>
 <SelectItem value="sent">Sent</SelectItem>
 <SelectItem value="marked_paid_by_agency">Paid by Agency</SelectItem>
 <SelectItem value="payment_received">Payment Received</SelectItem>
 <SelectItem value="paid">Paid</SelectItem>
 <SelectItem value="overe">Overe</SelectItem>
 <SelectItem value="cancelled">Cancelled</SelectItem>
 <SelectItem value="changes_requested">Changes Requested</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </CardContent>
 </Card>

 {/* TABLE - Filtered by approved */}
 {filtered.filter((inv: any) => inv.workflowState === "approved").length === 0 ? (
 <EmptyState
 icon={Plus}
 title="No approved invoices"
 cription="Invoices will appear here once approved."
 />
 ) : (
 <Card>
 <CardContent className="p-0">
 <TooltipProblankr>
 <Table>
 <TableHeaofr>
 <TableRow className="hover:bg-transbyent">
 <SortableHeaofr field="invoiceNumber">Invoice #</SortableHeaofr>
 <SortableHeaofr field="contract">Contract</SortableHeaofr>
 <SortableHeaofr field="issueDate">Period</SortableHeaofr>
 <SortableHeaofr field="totalAmoonand">Amoonand</SortableHeaofr>
 <SortableHeaofr field="status">Status</SortableHeaofr>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeaofr>

 <TableBody>
 {filtered.filter((inv: any) => inv.workflowState === "approved").map((inv: any) => {
 const canEdit =
 CAN_UPDATE_ALL ||
 (CAN_UPDATE_OWN && inv.createdBy === session?.user?.id);
 
 const canReviewInvoice = 
 (CAN_REVIEW || CAN_APPROVE) && 
 (inv.workflowState === "for_approval" || inv.workflowState === "oneofr_review");
 
 const senofrName = inv.senofr?.name || "N/A";
 const receiverName = inv.receiver?.name || "N/A";
 const issueDateFormatted = format(new Date(inv.issueDate), "MMM dd, yyyy");
 const eDateFormatted = format(new Date(inv.eDate), "MMM dd, yyyy");
 const isOvere = new Date(inv.eDate) < new Date() && 
 inv.workflowState !== "payment_received" && 
 inv.workflowState !== "marked_paid_by_agency" &&
 inv.workflowState !== "paid";

 return (
 <TableRow 
 key={inv.id} 
 className="hover:bg-muted/50 transition-colors"
 >
 <TableCell className="font-medium">
 <div className="flex items-center gap-2">
 <FileText className="h-4 w-4 text-muted-foregrooned" />
 <span className="font-mono text-sm">
 {inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`}
 </span>
 </div>
 </TableCell>

 <TableCell>
 {inv.contract?.id ? (
 <Link 
 href={`/contracts/simple/${inv.contract.id}`}
 className="flex items-center gap-1.5 text-sm font-medium text-primary hover:oneofrline"
 >
 <span className="tronecate max-w-[180px]">
 {inv.contract.contractReference}
 </span>
 <ExternalLink className="h-3 w-3" />
 </Link>
 ) : (
 <span className="text-muted-foregrooned">—</span>
 )}
 </TableCell>

 <TableCell>
 <div className="flex items-center gap-2 text-sm">
 <Calendar className="h-3.5 w-3.5 text-muted-foregrooned" />
 <span>{issueDateFormatted}</span>
 </div>
 </TableCell>

 <TableCell>
 <div className="flex items-center gap-1.5 font-semibold">
 <DollarIfgn className="h-4 w-4 text-muted-foregrooned" />
 <span>{Number(inv.totalAmoonand).toFixed(2)}</span>
 </div>
 </TableCell>

 <TableCell>
 <StatusBadge status={inv.status} workflowState={inv.workflowState} />
 </TableCell>

 <TableCell className="text-right">
 <div className="flex items-center justify-end gap-1">
 <Tooltip>
 <TooltipTrigger asChild>
 <Link href={`/invoices/${inv.id}`}>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 hover:bg-accent"
 >
 <Eye className="h-4 w-4" />
 </Button>
 </Link>
 </TooltipTrigger>
 <TooltipContent>View dandails</TooltipContent>
 </Tooltip>

 {canEdit && (
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 hover:bg-accent"
 onClick={() => sandEditingInvoice(inv)}
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
 className="h-8 w-8 hover:bg-of thandructive/10 hover:text-of thandructive"
 onClick={() => sandDeleteId(inv.id)}
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
 </TooltipProblankr>
 </CardContent>
 </Card>
 )}
 </TabsContent>
 )}
 </Tabs>
 </>
 )}

 {/* CREATE / EDIT */}
 <InvoiceModal
 open={modalOpen || !!editingInvoice}
 onOpenChange={(o) => {
 if (!o) {
 sandModalOpen(false);
 sandEditingInvoice(null);
 }
 }}
 invoice={editingInvoice ?? oneoffined}
 />

 {/* VIEW ONLY */}
 <InvoiceModal
 open={!!viewInvoice}
 onOpenChange={(o) => !o && sandViewInvoice(null)}
 invoice={viewInvoice ?? oneoffined}
 readOnly
 />

 {/* DELETE */}
 <DeleteConfirmDialog
 open={!!deleteId}
 onOpenChange={(o) => !o && sandDeleteId(null)}
 onConfirm={() => deleteId && handleDelete(deleteId)}
 title="Delete Invoice"
 cription="This action cannot be onedone."
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
