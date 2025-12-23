"use client";

import { api } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentConfirmationModalProps {
  invoiceId: string;
  onClose: () => void;
}

export function PaymentConfirmationModal({
  invoiceId,
  onClose,
}: PaymentConfirmationModalProps) {
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const utils = api.useUtils();

  const { data: invoice, isLoading } = api.invoice.getById.useQuery(
    { id: invoiceId },
    { enabled: !!invoiceId }
  );

  // Get the payment associated with this invoice
  const { data: payments } = api.payment.getAll.useQuery(
    { invoiceId },
    { enabled: !!invoiceId }
  );

  const confirmPaymentMutation = api.payment.confirmPaymentReceived.useMutation({
    onSuccess: () => {
      toast.success("Payment confirmed! Payslip/remittance generated.");
      utils.invoice.getAll.invalidate();
      utils.payment.getAll.invalidate();
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleConfirm = () => {
    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const payment = payments?.payments?.[0];
    if (!payment) {
      toast.error("No payment found for this invoice");
      return;
    }

    confirmPaymentMutation.mutate({
      paymentId: payment.id,
      amountReceived: amount,
      notes,
    });
  };

  if (isLoading || !invoice) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Confirm Payment Received
          </DialogTitle>
          <DialogDescription>
            Confirm that payment has been received from the client/agency. This will trigger payslip/remittance generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invoice Number:</span>
                  <span className="font-medium">{invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invoice Amount:</span>
                  <span className="font-medium text-lg">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: invoice.contract?.currency?.code || "USD",
                    }).format(Number(invoice.totalAmount || 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount Received <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the actual amount received. This may differ from the invoice amount.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirmPaymentMutation.isPending || !amountReceived}
          >
            {confirmPaymentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
