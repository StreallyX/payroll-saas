"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { WorkflowStatusBadge } from "@/components/workflow";
import { usePermissions } from "@/hooks/use-permissions";

export default function PaymentsPage() {
  const { hasPermission } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [recordPaymentModal, setRecordPaymentModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");

  const utils = api.useUtils();

  const { data, isLoading } = api.payment.getAll.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const recordPaymentMutation = api.payment.recordPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      utils.payment.getAll.invalidate();
      setRecordPaymentModal(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setSelectedInvoiceId("");
    setPaymentAmount("");
    setPaymentType("full");
  };

  const handleRecordPayment = () => {
    if (!selectedInvoiceId) {
      toast.error("Please select an invoice");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    recordPaymentMutation.mutate({
      invoiceId: selectedInvoiceId,
      amount: amount.toString(),
      paymentType,
    });
  };

  const canRecordPayment = hasPermission("payment.mark_received.global");

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  const payments = data?.payments || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track and manage payment transactions"
      >
        {canRecordPayment && (
          <Button onClick={() => setRecordPaymentModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        )}
      </PageHeader>

      {/* FILTERS */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PAYMENTS TABLE */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {payment.invoice?.invoiceNumber || "N/A"}
                    </TableCell>
                    <TableCell className="capitalize">{payment.type}</TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(payment.amount))}
                    </TableCell>
                    <TableCell>
                      <WorkflowStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethodRel?.type || "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* RECORD PAYMENT MODAL */}
      <Dialog open={recordPaymentModal} onOpenChange={setRecordPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <Select
                value={paymentType}
                onValueChange={(value: "full" | "partial") => setPaymentType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={recordPaymentMutation.isPending}
            >
              {recordPaymentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
