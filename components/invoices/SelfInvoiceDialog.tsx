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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, CheckCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

interface SelfInvoiceDialogProps {
  invoiceId: string;
  onSuccess?: () => void;
}

export function SelfInvoiceDialog({ invoiceId, onSuccess }: SelfInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const utils = api.useUtils();

  // Get preview data
  const { data: preview, isLoading: loadingPreview } = api.invoice.generateSelfInvoicePreview.useQuery(
    { invoiceId },
    { enabled: open && showPreview }
  );

  // Create self-invoice mutation
  const createMutation = api.invoice.createSelfInvoice.useMutation({
    onSuccess: () => {
      toast.success("Self-invoice created successfully!");
      setOpen(false);
      setShowPreview(false);
      utils.invoice.getById.invalidate({ id: invoiceId });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create self-invoice");
    },
  });

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleCreate = () => {
    createMutation.mutate({ invoiceId });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Create Self-Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Self-Invoice - GROSS Payment Model
          </DialogTitle>
          <DialogDescription>
            Generate a self-invoice for this payment. This invoice will be created from your organization to the contractor.
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What is a Self-Invoice?</h4>
              <p className="text-sm text-blue-800">
                A self-invoice is an invoice that you (the organization) create on behalf of the contractor.
                This is used in GROSS payment models where the contractor handles their own taxes.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Preview the self-invoice details</li>
                <li>Review the amounts, line items, and parties</li>
                <li>Create the self-invoice as a new invoice record</li>
                <li>Process payment to the contractor</li>
              </ol>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePreview}>
                Preview Self-Invoice
              </Button>
            </div>
          </div>
        ) : loadingPreview ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : preview ? (
          <div className="space-y-6 py-4">
            {/* Invoice Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">SELF-INVOICE</h3>
                <p className="text-muted-foreground">{preview.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <Label className="text-xs text-muted-foreground">Issue Date</Label>
                <p className="font-medium">{new Date(preview.issueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <Separator />

            {/* From / To Section */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">FROM</Label>
                <div className="mt-2 space-y-1">
                  <p className="font-bold">{preview.from.name}</p>
                  {preview.from.email && <p className="text-sm">{preview.from.email}</p>}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">TO</Label>
                <div className="mt-2 space-y-1">
                  <p className="font-bold">{preview.to.name}</p>
                  {preview.to.email && <p className="text-sm">{preview.to.email}</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Line Items</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">Description</th>
                      <th className="text-right p-3 text-sm font-semibold">Qty</th>
                      <th className="text-right p-3 text-sm font-semibold">Unit Price</th>
                      <th className="text-right p-3 text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.lineItems.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="p-3 text-sm">{item.description}</td>
                        <td className="p-3 text-sm text-right">{Number(item.quantity)}</td>
                        <td className="p-3 text-sm text-right">
                          {formatCurrency(Number(item.unitPrice), preview.currency)}
                        </td>
                        <td className="p-3 text-sm text-right font-medium">
                          {formatCurrency(Number(item.amount), preview.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(Number(preview.subtotal), preview.currency)}
                    </span>
                  </div>

                  {Number(preview.marginAmount) > 0 && (
                    <>
                      <Separator />
                      <div className="px-4 py-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">
                            Margin ({Number(preview.marginPercentage)}%):
                          </span>
                          <span className="font-medium text-blue-700">
                            {formatCurrency(Number(preview.marginAmount), preview.currency)}
                          </span>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between items-center px-4 py-4 bg-green-600 text-white rounded-lg">
                    <span className="font-bold">TOTAL:</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(Number(preview.totalAmount), preview.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {preview.notes && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-semibold">Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{preview.notes}</p>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={createMutation.isPending}>
                Back
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Invoice
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
