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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

interface PayrollWorkflowDialogProps {
  invoiceId: string;
  onSuccess?: () => void;
}

export function PayrollWorkflowDialog({ invoiceId, onSuccess }: PayrollWorkflowDialogProps) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const utils = api.useUtils();

  // Create self-billing invoice mutation
  const createInvoiceMutation = api.invoice.createSelfBillingInvoice.useMutation();

  // Create payroll task mutation
  const createTaskMutation = api.invoice.createPayrollTask.useMutation();

  const handleProcess = async () => {
    setProcessing(true);
    try {
      // Step 1: Create self-billing invoice
      const selfBillingInvoice = await createInvoiceMutation.mutateAsync({ invoiceId });
      
      // Step 2: Create payroll task
      await createTaskMutation.mutateAsync({ 
        invoiceId,
        notes: `Self-billing invoice created: ${selfBillingInvoice.invoiceNumber}`,
      });

      toast.success("Payroll processing initiated successfully!");
      setOpen(false);
      utils.invoice.getById.invalidate({ id: invoiceId });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to process payroll workflow");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant="default">
          <Send className="h-4 w-4" />
          Process Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Payroll Processing - External Provider
          </DialogTitle>
          <DialogDescription>
            Automatically create self-billing invoice and payroll task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This workflow will automatically:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create a self-billing invoice on behalf of the contractor</li>
                <li>Create a payroll task with all necessary details</li>
                <li>Include contractor information and bank details in the task</li>
                <li>Assign the task to the payroll team for processing</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
            <p className="text-sm text-blue-800 mb-3">
              The payroll team will receive a task to complete legal/payroll processing and transfer
              the NET salary to the contractor's bank account.
            </p>
            <p className="text-sm text-blue-800">
              The self-billing invoice will be automatically approved and ready for payroll processing.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <h4 className="font-semibold text-blue-900">Payment Destination</h4>
            </div>
            <p className="text-sm text-blue-800 pl-6">
              The self-billing invoice will include the <strong>payroll user's bank account</strong> as the payment destination. 
              After processing, payment should be made to this account.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>The contractor is responsible for providing accurate bank details</li>
              <li>All tax withholdings and legal requirements must be handled by your payroll provider</li>
              <li>Track the task status in the Tasks section</li>
            </ul>
          </div>

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
                  Start Payroll Processing
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
