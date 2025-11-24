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

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";

import { Wallet, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";

function PaymentsPageContent() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // -------------------------------
  // STATE
  // -------------------------------
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);

  // -------------------------------
  // DATA
  // -------------------------------
  const { data: result, isLoading } = api.payment.getAll.useQuery({
    status: undefined,
    limit: 100,
    offset: 0,
  });

  // -------------------------------
  // MUTATIONS
  // -------------------------------
  const confirmPaymentMutation = api.payment.update.useMutation({
    onSuccess: (data) => {
      toast.success("Payment confirmed! Task created for payroll provider.");
      utils.payment.getAll.invalidate();
      setConfirmingPaymentId(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // -------------------------------
  // HANDLERS
  // -------------------------------
  const handleConfirmPayment = () => {
    if (!confirmingPaymentId) return;

    confirmPaymentMutation.mutate({
      id: confirmingPaymentId,
      status: "completed",
      completedDate: new Date(),
    });
  };

  // -------------------------------
  // STATUS BADGE
  // -------------------------------
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      processing: { variant: "default", icon: RefreshCw, label: "Processing" },
      completed: { variant: "success", icon: CheckCircle, label: "Completed" },
      failed: { variant: "destructive", icon: XCircle, label: "Failed" },
      refunded: { variant: "outline", icon: AlertCircle, label: "Refunded" },
    };

    const config = variants[status] || variants.pending;
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
  if (isLoading) return <LoadingState message="Loading payments..." />;

  const payments = result?.payments || [];

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No payments yet"
        description="There are no payments in the system."
      />
    );
  }

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments Management"
        description="View and confirm payments from agencies"
      />

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => {
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {payment.invoice?.invoiceNumber || payment.invoiceId?.slice(0, 8) || "N/A"}
                    </TableCell>
                    <TableCell>
                      {payment.amount.toFixed(2)} {payment.currency}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.paymentMethod.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.transactionId || payment.referenceNumber || "—"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {payment.status === "pending" ? (
                        <Button
                          size="sm"
                          onClick={() => setConfirmingPaymentId(payment.id)}
                          variant="default"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm
                        </Button>
                      ) : payment.status === "completed" ? (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CONFIRMATION DIALOG */}
      <AlertDialog open={!!confirmingPaymentId} onOpenChange={(open) => !open && setConfirmingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this payment? This will automatically create a task for the payroll provider to process the contractor payment.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending ? "Confirming..." : "Confirm Payment"}
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
export default function PaymentsPage() {
  return (
    <PaymentsPageContent />
  );
}
