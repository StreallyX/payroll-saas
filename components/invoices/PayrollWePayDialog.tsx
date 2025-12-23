"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, CheckCircle, AlertCircle, DollarSign, User } from "lucide-react";
import { toast } from "sonner";

interface PayrollWePayDialogProps {
  invoiceId: string;
  invoiceAmount: number;
  currency: string;
  contractorName?: string;
  onSuccess?: () => void;
}

export function PayrollWePayDialog({
  invoiceId,
  invoiceAmount,
  currency,
  contractorName,
  onSuccess,
}: PayrollWePayDialogProps) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sendFeeInvoice, setSendFeeInvoice] = useState(false);
  const [feeAmount, setFeeAmount] = useState<string>("");

  const utils = api.useUtils();

  // Get invoice details
  const { data: invoiceData } = api.invoice.getById.useQuery(
    { id: invoiceId },
    { enabled: open }
  );

  // Create payroll task mutation
  const createTaskMutation = api.invoice.createPayrollTask.useMutation();

  // Create fee invoice mutation
  const createFeeInvoiceMutation = api.invoice.createPayrollFeeInvoice.useMutation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const handleProcess = async () => {
    if (sendFeeInvoice) {
      const fee = parseFloat(feeAmount);
      if (isNaN(fee) || fee <= 0) {
        toast.error("Please enter a valid fee amount");
        return;
      }
    }

    setProcessing(true);
    try {
      // Step 1: Create payroll task
      await createTaskMutation.mutateAsync({
        invoiceId,
        feeAmount: sendFeeInvoice ? parseFloat(feeAmount) : undefined,
        notes: sendFeeInvoice ? `Payroll fee invoice will be sent: ${formatCurrency(parseFloat(feeAmount))}` : undefined,
      });

      // Step 2: Create fee invoice if requested
      if (sendFeeInvoice && feeAmount) {
        await createFeeInvoiceMutation.mutateAsync({
          invoiceId,
          feeAmount: parseFloat(feeAmount),
          feeDescription: `Payroll processing fee for ${contractorName || "contractor"}`,
        });
      }

      toast.success("Payroll workflow initiated successfully!");
      setOpen(false);
      utils.invoice.getById.invalidate({ id: invoiceId });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to process payroll workflow");
    } finally {
      setProcessing(false);
    }
  };

  const contractor = invoiceData?.contract?.participants?.find((p: any) => p.role === "contractor");
  const contractorUser = contractor?.user as any;
  const contractorBankInfo = contractorUser?.profileData as any;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant="default">
          <Send className="h-4 w-4" />
          Send to Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Internal Payroll Processing
          </DialogTitle>
          <DialogDescription>
            Process payment with internal payroll team - PAYROLL_WE_PAY model
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contractor Details */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              <h4 className="font-semibold">Contractor Details</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">{contractorName || contractorUser?.name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm">{contractorUser?.email || "N/A"}</p>
              </div>
              {contractorUser?.phone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm">{contractorUser.phone}</p>
                </div>
              )}
              {contractorUser?.country && (
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <p className="text-sm">{(contractorUser.country as any)?.name || "N/A"}</p>
                </div>
              )}
            </div>

            {/* Bank Details */}
            {contractorBankInfo && (
              <>
                <Separator className="my-3" />
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Bank Details</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    {contractorBankInfo.bankName && (
                      <p>
                        <span className="text-muted-foreground">Bank:</span> {contractorBankInfo.bankName}
                      </p>
                    )}
                    {contractorBankInfo.accountNumber && (
                      <p>
                        <span className="text-muted-foreground">Account:</span> {contractorBankInfo.accountNumber}
                      </p>
                    )}
                    {contractorBankInfo.iban && (
                      <p>
                        <span className="text-muted-foreground">IBAN:</span> {contractorBankInfo.iban}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Payment Confirmation */}
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-green-700" />
              <h4 className="font-semibold text-green-900">Payment Confirmation</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Invoice Amount:</span>
                <span className="font-semibold text-lg">{formatCurrency(invoiceAmount)}</span>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This amount will be processed through internal payroll. Tax withholdings and NET salary
                  calculation will be handled by the payroll team.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Payroll Fee Invoice Option */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="sendFeeInvoice"
                checked={sendFeeInvoice}
                onCheckedChange={(checked) => setSendFeeInvoice(checked as boolean)}
              />
              <label
                htmlFor="sendFeeInvoice"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send Payroll Fee Invoice
              </label>
            </div>

            {sendFeeInvoice && (
              <div className="space-y-2">
                <Label htmlFor="feeAmount" className="text-sm">
                  Fee Amount ({currency})
                </Label>
                <Input
                  id="feeAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter fee amount"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A separate fee invoice will be created and sent to the client for payroll processing services.
                </p>
              </div>
            )}
          </div>

          {/* Workflow Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Payroll Workflow Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Calculate tax withholdings based on contractor's country and tax status</li>
              <li>Process NET salary payment to contractor's bank account</li>
              <li>Remit taxes to appropriate authorities</li>
              <li>File required tax forms and maintain payroll records</li>
              <li>Mark the payroll task as complete once processed</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Send to Payroll Team
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
