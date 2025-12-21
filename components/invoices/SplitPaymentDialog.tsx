"use client";

import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wallet, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SplitPaymentDialogProps {
  invoiceId: string;
  invoiceAmount: number;
  currency: string;
  onSuccess?: () => void;
}

interface Split {
  id: string;
  bankAccountId: string;
  allocationType: "percentage" | "amount";
  percentage?: number;
  amount?: number;
}

export function SplitPaymentDialog({
  invoiceId,
  invoiceAmount,
  currency,
  onSuccess,
}: SplitPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [splits, setSplits] = useState<Split[]>([
    {
      id: "1",
      bankAccountId: "",
      allocationType: "percentage",
      percentage: 100,
    },
  ]);

  const utils = api.useUtils();

  // Get contractor bank accounts
  const { data: bankAccountsData, isLoading: loadingAccounts } =
    api.invoice.getContractorBankAccounts.useQuery({ invoiceId }, { enabled: open });

  // Process split payment mutation
  const processMutation = api.invoice.processSplitPayment.useMutation({
    onSuccess: () => {
      toast.success("Split payment processed successfully!");
      setOpen(false);
      utils.invoice.getById.invalidate({ id: invoiceId });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to process split payment");
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const addSplit = () => {
    setSplits([
      ...splits,
      {
        id: Date.now().toString(),
        bankAccountId: "",
        allocationType: "percentage",
        percentage: 0,
      },
    ]);
  };

  const removeSplit = (id: string) => {
    if (splits.length > 1) {
      setSplits(splits.filter((s) => s.id !== id));
    }
  };

  const updateSplit = (id: string, updates: Partial<Split>) => {
    setSplits(splits.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Calculate totals
  const totalAllocated = splits.reduce((sum, split) => {
    if (split.allocationType === "percentage") {
      return sum + ((split.percentage || 0) * invoiceAmount) / 100;
    } else {
      return sum + (split.amount || 0);
    }
  }, 0);

  const totalPercentage = splits.reduce((sum, split) => {
    if (split.allocationType === "percentage") {
      return sum + (split.percentage || 0);
    }
    return sum;
  }, 0);

  const isValid =
    splits.every((s) => s.bankAccountId) &&
    Math.abs(totalAllocated - invoiceAmount) < 0.01;

  const handleProcess = () => {
    if (!isValid) {
      toast.error("Please ensure all splits are configured correctly and total equals invoice amount");
      return;
    }

    processMutation.mutate({
      invoiceId,
      splits: splits.map((split) => ({
        bankAccountId: split.bankAccountId,
        amount: split.allocationType === "amount" ? split.amount : undefined,
        percentage: split.allocationType === "percentage" ? split.percentage : undefined,
      })),
    });
  };

  const bankAccounts = bankAccountsData?.bankAccounts || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant="default">
          <Wallet className="h-4 w-4" />
          Configure Split Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Split Payment Configuration
          </DialogTitle>
          <DialogDescription>
            Allocate payment across multiple bank accounts - {bankAccountsData?.contractorName || "Contractor"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Amount Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-900 font-medium">Total Invoice Amount:</span>
              <span className="text-2xl font-bold text-blue-900">{formatCurrency(invoiceAmount)}</span>
            </div>
          </div>

          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bankAccounts.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No bank accounts found for this contractor. Please add bank accounts before configuring split payments.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Split Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Split Allocations</Label>
                  <Button size="sm" variant="outline" onClick={addSplit}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Split
                  </Button>
                </div>

                {splits.map((split, index) => (
                  <div key={split.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Split {index + 1}</Label>
                      {splits.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSplit(split.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    {/* Bank Account Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`bank-${split.id}`}>Bank Account</Label>
                      <Select
                        value={split.bankAccountId}
                        onValueChange={(value) => updateSplit(split.id, { bankAccountId: value })}
                      >
                        <SelectTrigger id={`bank-${split.id}`}>
                          <SelectValue placeholder="Select bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.bankName} - {account.accountNumber || "N/A"}
                              {account.isPrimary && " (Primary)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Allocation Type */}
                    <div className="space-y-2">
                      <Label>Allocation Type</Label>
                      <RadioGroup
                        value={split.allocationType}
                        onValueChange={(value: "percentage" | "amount") =>
                          updateSplit(split.id, { allocationType: value })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="percentage" id={`percentage-${split.id}`} />
                          <label htmlFor={`percentage-${split.id}`} className="text-sm">
                            Percentage
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="amount" id={`amount-${split.id}`} />
                          <label htmlFor={`amount-${split.id}`} className="text-sm">
                            Fixed Amount
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Allocation Value */}
                    <div className="space-y-2">
                      {split.allocationType === "percentage" ? (
                        <>
                          <Label htmlFor={`value-${split.id}`}>Percentage (%)</Label>
                          <Input
                            id={`value-${split.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={split.percentage || ""}
                            onChange={(e) =>
                              updateSplit(split.id, { percentage: parseFloat(e.target.value) || 0 })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Amount: {formatCurrency(((split.percentage || 0) * invoiceAmount) / 100)}
                          </p>
                        </>
                      ) : (
                        <>
                          <Label htmlFor={`value-${split.id}`}>Amount ({currency})</Label>
                          <Input
                            id={`value-${split.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max={invoiceAmount}
                            value={split.amount || ""}
                            onChange={(e) =>
                              updateSplit(split.id, { amount: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals Summary */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Total Allocated:</span>
                  <span className={`font-bold ${isValid ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>

                {!isValid && Math.abs(totalAllocated - invoiceAmount) >= 0.01 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Total allocated ({formatCurrency(totalAllocated)}) must equal invoice amount (
                      {formatCurrency(invoiceAmount)}). 
                      Difference: {formatCurrency(Math.abs(invoiceAmount - totalAllocated))}
                    </AlertDescription>
                  </Alert>
                )}

                {isValid && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Split configuration is valid! Total allocation matches invoice amount.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={processMutation.isPending}>
                  Cancel
                </Button>
                <Button onClick={handleProcess} disabled={!isValid || processMutation.isPending}>
                  {processMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Process Split Payment
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
