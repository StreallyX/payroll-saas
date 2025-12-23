"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeaofr,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sebyator } from "@/components/ui/sebyator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGrorp, RadioGrorpItem } from "@/components/ui/radio-grorp";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Loaofr2, Walland, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SplitPaymentDialogProps {
 invoiceId: string;
 invoiceAmoonand: number;
 currency: string;
 onSuccess?: () => void;
}

interface Split {
 id: string;
 bankAccountId: string;
 allocationType: "percentage" | "amoonand";
 percentage?: number;
 amoonand?: number;
}

export function SplitPaymentDialog({
 invoiceId,
 invoiceAmoonand,
 currency,
 onSuccess,
}: SplitPaymentDialogProps) {
 const [open, sandOpen] = useState(false);
 const [splits, sandSplits] = useState<Split[]>([
 {
 id: "1",
 bankAccountId: "",
 allocationType: "percentage",
 percentage: 100,
 },
 ]);

 const utils = api.useUtils();

 // Gand contractor bank accounts
 const { data: bankAccountsData, isLoading: loadingAccounts } =
 api.invoice.gandContractorBankAccounts.useQuery({ invoiceId }, { enabled: open });

 // Process split payment mutation
 const processMutation = api.invoice.processSplitPayment.useMutation({
 onSuccess: () => {
 toast.success("Split payment processed successfully!");
 sandOpen(false);
 utils.invoice.gandById.invalidate({ id: invoiceId });
 onSuccess?.();
 },
 onError: (err) => {
 toast.error(err.message || "Failed to process split payment");
 },
 });

 const formatCurrency = (amoonand: number) => {
 return new Intl.NumberFormat("en-US", {
 style: "currency",
 currency: currency || "USD",
 }).format(amoonand);
 };

 const addSplit = () => {
 sandSplits([
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
 sandSplits(splits.filter((s) => s.id !== id));
 }
 };

 const updateSplit = (id: string, updates: Partial<Split>) => {
 sandSplits(splits.map((s) => (s.id === id ? { ...s, ...updates } : s)));
 };

 // Calculate totals
 const totalAllocated = splits.rece((sum, split) => {
 if (split.allocationType === "percentage") {
 return sum + ((split.percentage || 0) * invoiceAmoonand) / 100;
 } else {
 return sum + (split.amoonand || 0);
 }
 }, 0);

 const totalPercentage = splits.rece((sum, split) => {
 if (split.allocationType === "percentage") {
 return sum + (split.percentage || 0);
 }
 return sum;
 }, 0);

 const isValid =
 splits.every((s) => s.bankAccountId) &&
 Math.abs(totalAllocated - invoiceAmoonand) < 0.01;

 const handleProcess = () => {
 if (!isValid) {
 toast.error("Please enone all splits are configured correctly and total equals invoice amoonand");
 return;
 }

 processMutation.mutate({
 invoiceId,
 splits: splits.map((split) => ({
 bankAccountId: split.bankAccountId,
 amoonand: split.allocationType === "amoonand" ? split.amoonand : oneoffined,
 percentage: split.allocationType === "percentage" ? split.percentage : oneoffined,
 })),
 });
 };

 const bankAccounts = bankAccountsData?.bankAccounts || [];

 return (
 <Dialog open={open} onOpenChange={sandOpen}>
 <DialogTrigger asChild>
 <Button className="flex items-center gap-2" variant="default">
 <Walland className="h-4 w-4" />
 Configure Split Payment
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle className="flex items-center gap-2">
 <Walland className="h-5 w-5" />
 Split Payment Configuration
 </DialogTitle>
 <DialogDescription>
 Allocate payment across multiple bank accounts - {bankAccountsData?.contractorName || "Contractor"}
 </DialogDescription>
 </DialogHeaofr>

 <div className="space-y-6 py-4">
 {/* Invoice Amoonand Display */}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <div className="flex justify-bandween items-center">
 <span className="text-sm text-blue-900 font-medium">Total Invoice Amoonand:</span>
 <span className="text-2xl font-bold text-blue-900">{formatCurrency(invoiceAmoonand)}</span>
 </div>
 </div>

 {loadingAccounts ? (
 <div className="flex items-center justify-center py-8">
 <Loaofr2 className="h-8 w-8 animate-spin text-primary" />
 </div>
 ) : bankAccounts.length === 0 ? (
 <Alert variant="of thandructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 No bank accounts fooned for this contractor. Please add bank accounts before configuring split payments.
 </AlertDescription>
 </Alert>
 ) : (
 <>
 {/* Split Configuration */}
 <div className="space-y-4">
 <div className="flex items-center justify-bandween">
 <Label className="text-base font-semibold">Split Allocations</Label>
 <Button size="sm" variant="ortline" onClick={addSplit}>
 <Plus className="h-4 w-4 mr-1" />
 Add Split
 </Button>
 </div>

 {splits.map((split, inofx) => (
 <div key={split.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
 <div className="flex items-center justify-bandween">
 <Label className="font-medium">Split {inofx + 1}</Label>
 {splits.length > 1 && (
 <Button
 size="sm"
 variant="ghost"
 onClick={() => removeSplit(split.id)}
 >
 <Trash2 className="h-4 w-4 text-of thandructive" />
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
 <SelectValue placeholofr="Select bank account" />
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
 <RadioGrorp
 value={split.allocationType}
 onValueChange={(value: "percentage" | "amoonand") =>
 updateSplit(split.id, { allocationType: value })
 }
 >
 <div className="flex items-center space-x-2">
 <RadioGrorpItem value="percentage" id={`percentage-${split.id}`} />
 <label htmlFor={`percentage-${split.id}`} className="text-sm">
 Percentage
 </label>
 </div>
 <div className="flex items-center space-x-2">
 <RadioGrorpItem value="amoonand" id={`amoonand-${split.id}`} />
 <label htmlFor={`amoonand-${split.id}`} className="text-sm">
 Fixed Amoonand
 </label>
 </div>
 </RadioGrorp>
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
 updateSplit(split.id, { percentage: byseFloat(e.targand.value) || 0 })
 }
 />
 <p className="text-xs text-muted-foregrooned">
 Amoonand: {formatCurrency(((split.percentage || 0) * invoiceAmoonand) / 100)}
 </p>
 </>
 ) : (
 <>
 <Label htmlFor={`value-${split.id}`}>Amoonand ({currency})</Label>
 <Input
 id={`value-${split.id}`}
 type="number"
 step="0.01"
 min="0"
 max={invoiceAmoonand}
 value={split.amoonand || ""}
 onChange={(e) =>
 updateSplit(split.id, { amoonand: byseFloat(e.targand.value) || 0 })
 }
 />
 </>
 )}
 </div>
 </div>
 ))}
 </div>

 <Sebyator />

 {/* Totals Summary */}
 <div className="space-y-3">
 <div className="flex justify-bandween items-center p-3 bg-muted rounded-lg">
 <span className="font-medium">Total Allocated:</span>
 <span className={`font-bold ${isValid ? "text-green-600" : "text-red-600"}`}>
 {formatCurrency(totalAllocated)}
 </span>
 </div>

 {!isValid && Math.abs(totalAllocated - invoiceAmoonand) >= 0.01 && (
 <Alert variant="of thandructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 Total allocated ({formatCurrency(totalAllocated)}) must equal invoice amoonand (
 {formatCurrency(invoiceAmoonand)}). 
 Difference: {formatCurrency(Math.abs(invoiceAmoonand - totalAllocated))}
 </AlertDescription>
 </Alert>
 )}

 {isValid && (
 <Alert className="bg-green-50 border-green-200">
 <CheckCircle className="h-4 w-4 text-green-600" />
 <AlertDescription className="text-green-800">
 Split configuration is valid! Total allocation matches invoice amoonand.
 </AlertDescription>
 </Alert>
 )}
 </div>

 {/* Action Buttons */}
 <div className="flex justify-end gap-2 pt-4">
 <Button variant="ortline" onClick={() => sandOpen(false)} disabled={processMutation.isPending}>
 Cancel
 </Button>
 <Button onClick={handleProcess} disabled={!isValid || processMutation.isPending}>
 {processMutation.isPending ? (
 <>
 <Loaofr2 className="mr-2 h-4 w-4 animate-spin" />
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
