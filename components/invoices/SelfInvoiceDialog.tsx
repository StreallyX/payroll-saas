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
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, FileText, CheckCircle, Building2, User, CreditCard, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SelfInvoiceDialogProps {
  invoiceId: string;
  onSuccess?: () => void;
}

export function SelfInvoiceDialog({ invoiceId, onSuccess }: SelfInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);

  const utils = api.useUtils();

  // Get preview data
  const { data: preview, isLoading: loadingPreview } = api.invoice.generateSelfInvoicePreview.useQuery(
    { invoiceId },
    { 
      enabled: open && showPreview,
    }
  );

  // Auto-select primary bank account when preview loads
  if (preview?.selectedBankAccount && !selectedBankAccountId) {
    setSelectedBankAccountId(preview.selectedBankAccount.id);
  }

  // Create self-invoice mutation
  const createMutation = api.invoice.createSelfInvoice.useMutation({
    onSuccess: () => {
      toast.success("Self-invoice created and confirmed successfully!");
      setOpen(false);
      setShowPreview(false);
      setShowBankAccounts(false);
      setSelectedBankAccountId(null);
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
    createMutation.mutate({ 
      invoiceId,
      selectedBankAccountId: selectedBankAccountId || undefined,
    });
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
                <Badge variant="outline" className="mt-2">Auto-Confirmed</Badge>
              </div>
              <div className="text-right">
                <Label className="text-xs text-muted-foreground">Issue Date</Label>
                <p className="font-medium">{new Date(preview.issueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <Separator />

            {/* Contractor Information (Prominent) */}
            {preview.contractor && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Contractor Details</h4>
                  </div>
                  <Link 
                    href={`/users/${preview.contractor.id}`} 
                    target="_blank"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">{preview.contractor.name}</p>
                      <p className="text-sm text-blue-700">{preview.contractor.email}</p>
                    </div>
                    <Badge 
                      variant={preview.contractor.onboardingStatus === 'completed' ? 'default' : 'secondary'}
                    >
                      {preview.contractor.onboardingStatus || 'pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Account Selection */}
            {preview.selectedBankAccount && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">Payment Destination</h4>
                  </div>
                  {preview.bankAccounts && preview.bankAccounts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBankAccounts(!showBankAccounts)}
                    >
                      {showBankAccounts ? (
                        <>
                          Hide Accounts <ChevronUp className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          See All Accounts ({preview.bankAccounts.length}) <ChevronDown className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {!showBankAccounts ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-green-900">
                          {preview.selectedBankAccount.accountName || preview.selectedBankAccount.bankName}
                        </p>
                        <p className="text-sm text-green-700">
                          {preview.selectedBankAccount.bankName} - {preview.selectedBankAccount.accountNumber}
                        </p>
                        <p className="text-xs text-green-600">
                          {preview.selectedBankAccount.currency}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {preview.selectedBankAccount.isPrimary && (
                          <Badge variant="default" className="bg-green-600">Primary</Badge>
                        )}
                        {preview.selectedBankAccount.usage && (
                          <Badge variant="outline" className="text-xs">
                            {preview.selectedBankAccount.usage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <RadioGroup 
                    value={selectedBankAccountId || preview.selectedBankAccount.id} 
                    onValueChange={setSelectedBankAccountId}
                    className="space-y-2"
                  >
                    {preview.bankAccounts.map((bank: any) => (
                      <div
                        key={bank.id}
                        className={`border rounded-lg p-3 cursor-pointer hover:bg-muted/50 ${
                          selectedBankAccountId === bank.id || (!selectedBankAccountId && preview.selectedBankAccount && bank.id === preview.selectedBankAccount.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedBankAccountId(bank.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={bank.id} id={bank.id} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {bank.accountName || bank.bankName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {bank.bankName} - {bank.accountNumber}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {bank.currency}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {bank.isPrimary && (
                                  <Badge variant="default" className="text-xs">Primary</Badge>
                                )}
                                {bank.usage && (
                                  <Badge variant="outline" className="text-xs">
                                    {bank.usage}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {preview.bankAccounts && preview.bankAccounts.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ⚠️ No bank accounts found for this contractor. Payment may need to be processed manually.
                  </div>
                )}
              </div>
            )}

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

            {/* Expenses (if any) */}
            {preview.expenses && preview.expenses.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Expenses</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold">Title</th>
                          <th className="text-left p-3 text-sm font-semibold">Category</th>
                          <th className="text-right p-3 text-sm font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.expenses.map((expense: any) => (
                          <tr key={expense.id}>
                            <td className="p-3 text-sm">{expense.title}</td>
                            <td className="p-3 text-sm">
                              <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                            </td>
                            <td className="p-3 text-sm text-right font-medium text-green-600">
                              {formatCurrency(Number(expense.amount), preview.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm">Base Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(Number(preview.subtotal), preview.currency)}
                    </span>
                  </div>

                  {preview.expensesTotal && Number(preview.expensesTotal) > 0 && (
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm">Expenses:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(Number(preview.expensesTotal), preview.currency)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center px-4 py-4 bg-green-600 text-white rounded-lg">
                    <div>
                      <span className="font-bold block">TOTAL TO PAY:</span>
                      <span className="text-xs opacity-90">(without margin)</span>
                    </div>
                    <span className="text-xl font-bold">
                      {formatCurrency(Number(preview.totalAmount), preview.currency)}
                    </span>
                  </div>

                  <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    💡 This amount excludes margin and represents the contractor's payment.
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
