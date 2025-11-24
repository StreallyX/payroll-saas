"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/trpc";

import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";

import { DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";

function AgencyInvoicesPageContent() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // -------------------------------
  // STATE
  // -------------------------------
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: "",
    referenceNumber: "",
    notes: "",
  });

  // -------------------------------
  // DATA
  // -------------------------------
  const { data: invoices, isLoading } = api.invoice.getMyAgencyInvoices.useQuery();

  // -------------------------------
  // MUTATIONS
  // -------------------------------
  const markAsPaidMutation = api.invoice.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("Invoice marked as paid successfully!");
      utils.invoice.getMyAgencyInvoices.invalidate();
      setPayingInvoiceId(null);
      setPaymentDetails({ transactionId: "", referenceNumber: "", notes: "" });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // -------------------------------
  // HANDLERS
  // -------------------------------
  const handleMarkAsPaid = () => {
    if (!payingInvoiceId) return;

    markAsPaidMutation.mutate({
      id: payingInvoiceId,
      paymentMethod: "bank_transfer",
      transactionId: paymentDetails.transactionId || undefined,
      referenceNumber: paymentDetails.referenceNumber || undefined,
      notes: paymentDetails.notes || undefined,
    });
  };

  // -------------------------------
  // STATUS BADGE
  // -------------------------------
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      draft: { variant: "secondary", icon: Clock, label: "Draft" },
      sent: { variant: "default", icon: AlertCircle, label: "Sent" },
      paid: { variant: "success", icon: CheckCircle, label: "Paid" },
      overdue: { variant: "destructive", icon: AlertCircle, label: "Overdue" },
      cancelled: { variant: "outline", icon: AlertCircle, label: "Cancelled" },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // -------------------------------
  // LOADING & EMPTY
  // -------------------------------
  if (isLoading) return <LoadingState message="Loading your invoices..." />;

  if (!invoices || invoices.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No invoices yet"
        description="There are no invoices assigned to your agency contracts."
      />
    );
  }

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Invoices"
        description="View and manage invoices for your agency contracts"
      />

      <Card>
        <CardHeader>
          <CardTitle>Invoices to Pay</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice: any) => {
                const contractor = invoice.contract?.participants?.find(
                  (p: any) => p.role === "CONTRACTOR"
                );

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {contractor?.user?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {invoice.totalAmount.toFixed(2)} {invoice.currency}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {invoice.status !== "paid" ? (
                        <Button
                          size="sm"
                          onClick={() => setPayingInvoiceId(invoice.id)}
                          variant="default"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Paid
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Paid on {invoice.paidDate ? format(new Date(invoice.paidDate), "MMM dd, yyyy") : "N/A"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PAYMENT CONFIRMATION DIALOG */}
      <AlertDialog open={!!payingInvoiceId} onOpenChange={(open) => !open && setPayingInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide payment details to mark this invoice as paid.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                placeholder="e.g., TXN-123456"
                value={paymentDetails.transactionId}
                onChange={(e) =>
                  setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
              <Input
                id="referenceNumber"
                placeholder="e.g., REF-789012"
                value={paymentDetails.referenceNumber}
                onChange={(e) =>
                  setPaymentDetails({ ...paymentDetails, referenceNumber: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add any additional notes..."
                value={paymentDetails.notes}
                onChange={(e) =>
                  setPaymentDetails({ ...paymentDetails, notes: e.target.value })
                }
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsPaid}
              disabled={markAsPaidMutation.isPending}
            >
              {markAsPaidMutation.isPending ? "Processing..." : "Confirm Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// -------------------------------
// PAGE WITH GUARD
// -------------------------------
export default function AgencyInvoicesPage() {
  return (
    <RouteGuard requiredPermission="invoice.read.own">
      <AgencyInvoicesPageContent />
    </RouteGuard>
  );
}
