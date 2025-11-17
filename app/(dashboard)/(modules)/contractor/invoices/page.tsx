"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Search, Download, Eye, DollarSign, Plus, AlertCircle, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { StatsCard } from "@/components/contractor/stats-card";
import { StatusBadge } from "@/components/contractor/status-badge";
import { DataTable, Column } from "@/components/contractor/data-table";
import { EmptyState } from "@/components/contractor/empty-state";
import { StatsCardSkeleton, TableSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Contractor Invoices Page
 * 
 * Displays invoices and allows contractors to create new ones.
 * Integrated with tRPC for real-time data.
 */

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function ContractorInvoicesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    contractId: "",
    notes: "",
    lineItems: [{ description: "", quantity: 1, unitPrice: 0 }] as LineItem[],
  });

  // Fetch contractor data
  const { data: contractor } = api.contractor.getByUserId.useQuery(
    { userId: session?.user?.id || "" },
    { enabled: !!session?.user?.id }
  );

  // Fetch invoices
  const { data: invoices, isLoading, error, refetch } = api.invoice.getMyInvoices.useQuery();

  // Fetch invoice summary
  const { data: summary } = api.invoice.getMyInvoiceSummary.useQuery();

  // Create invoice mutation
  const createInvoice = api.invoice.createContractorInvoice.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully.",
      });
      setIsCreateDialogOpen(false);
      setInvoiceForm({
        contractId: "",
        notes: "",
        lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice.",
        variant: "destructive",
      });
    },
  });

  // Add line item
  const addLineItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      lineItems: [...invoiceForm.lineItems, { description: "", quantity: 1, unitPrice: 0 }],
    });
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    const newItems = invoiceForm.lineItems.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, lineItems: newItems });
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...invoiceForm.lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, lineItems: newItems });
  };

  // Calculate total
  const calculateTotal = () => {
    return invoiceForm.lineItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );
  };

  const handleCreateInvoice = () => {
    if (!invoiceForm.contractId) {
      toast({
        title: "Validation Error",
        description: "Please select a contract.",
        variant: "destructive",
      });
      return;
    }

    if (invoiceForm.lineItems.length === 0 || invoiceForm.lineItems.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please add at least one valid line item.",
        variant: "destructive",
      });
      return;
    }

    createInvoice.mutate({
      contractId: invoiceForm.contractId,
      lineItems: invoiceForm.lineItems,
      notes: invoiceForm.notes || undefined,
    });
  };

  // Invoice columns
  const columns: Column<any>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
      render: (invoice) => <span className="font-medium">{invoice.invoiceNumber}</span>,
    },
    {
      key: "issueDate",
      label: "Issue Date",
      sortable: true,
      render: (invoice) => new Date(invoice.issueDate).toLocaleDateString(),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (invoice) => invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-",
    },
    {
      key: "totalAmount",
      label: "Amount",
      sortable: true,
      render: (invoice) => <span className="font-semibold">${parseFloat(invoice.totalAmount).toFixed(2)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      key: "contract",
      label: "Contract",
      render: (invoice) => invoice.contract?.contractReference || "N/A",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Invoices"
        description="View and manage your invoices and payments"
      />

      {/* Stats Cards */}
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
              title="Total Earnings"
              value={`$${summary.totalEarnings?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
            />
            <StatsCard
              title="Pending Payment"
              value={`$${summary.pendingPayment?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
              description={`${summary.pendingCount || 0} invoices`}
            />
            <StatsCard
              title="Paid This Month"
              value={`$${summary.paidThisMonth?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
            />
            <StatsCard
              title="Total Invoices"
              value={summary.totalInvoices || 0}
              icon={DollarSign}
            />
          </>
        )}
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Invoices</CardTitle>
              <CardDescription>
                A list of all invoices for your contract work
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                  <DialogDescription>
                    Create a new invoice for your work
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contract">Contract *</Label>
                    <Select value={invoiceForm.contractId} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, contractId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractor?.contracts?.map((contract: any) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.contractReference || "Contract"} - {contract.agency?.name || "Direct"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Line Items *</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add Item
                      </Button>
                    </div>

                    {invoiceForm.lineItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                        <div className="col-span-5 space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="Development hours"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs">Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2 flex items-end justify-between">
                          <div className="text-sm font-semibold">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                          {invoiceForm.lineItems.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeLineItem(index)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2 border-t">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Amount</div>
                        <div className="text-2xl font-bold">${calculateTotal().toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes for this invoice..."
                      rows={3}
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createInvoice.isPending}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateInvoice} disabled={createInvoice.isPending}>
                      {createInvoice.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Invoice"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
          ) : !invoices || invoices.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No invoices yet"
              description="Create your first invoice to get started with billing."
              action={{
                label: "Create Invoice",
                onClick: () => setIsCreateDialogOpen(true),
              }}
            />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              <DataTable
                data={invoices.filter((inv: any) =>
                  searchTerm
                    ? inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      inv.contract?.contractReference?.toLowerCase().includes(searchTerm.toLowerCase())
                    : true
                )}
                columns={columns}
                actions={(invoice) => (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" title="View Invoice">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Download PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              />
            </>
          )}

          {/* Payment Info */}
          {invoices && invoices.length > 0 && summary && summary.pendingPayment && summary.pendingPayment > 0 && (
            <div className="mt-6 rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Payment Information</h4>
                  <p className="text-sm text-muted-foreground">
                    You have ${summary.pendingPayment.toFixed(2)} in pending payments. 
                    Payments are typically processed within 5-7 business days after invoice approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
