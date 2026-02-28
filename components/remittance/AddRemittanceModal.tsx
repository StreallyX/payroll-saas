"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  FileText,
  Calculator,
  Building2,
  CreditCard,
  ArrowRight,
  DollarSign,
  Receipt,
  Minus,
  Equal,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddRemittanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddRemittanceModal({
  open,
  onOpenChange,
  onSuccess,
}: AddRemittanceModalProps) {
  const [activeTab, setActiveTab] = useState<"contract" | "manual">("contract");

  // Common fields
  const [contractorId, setContractorId] = useState("");
  const [contractId, setContractId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Manual mode fields
  const [manualAmount, setManualAmount] = useState("");

  // Contract mode - calculated fields (editable)
  const [amountInvoiced, setAmountInvoiced] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);

  const utils = api.useUtils();

  // Fetch contractors (users with contractor role)
  const { data: contractors = [], isLoading: loadingContractors } =
    api.user.getAll.useQuery();

  // Filter to get only contractors
  const contractorUsers = contractors.filter(
    (u: any) => u.role?.name?.toLowerCase() === "contractor"
  );

  // Fetch contracts for selected contractor
  const { data: contracts = [], isLoading: loadingContracts } =
    api.contract.getAll.useQuery(undefined, {
      enabled: !!contractorId,
    });

  // Filter contracts where selected contractor is a participant
  const contractorContracts = contracts.filter((c: any) =>
    c.participants?.some((p: any) => p.userId === contractorId)
  );

  // Fetch contract financial summary when contract is selected
  const { data: financialSummary, isLoading: loadingFinancials } =
    api.remittance.getContractFinancialSummary.useQuery(
      { contractId },
      { enabled: !!contractId && activeTab === "contract" }
    );

  // Update calculated fields when financial summary loads
  useEffect(() => {
    if (financialSummary) {
      setAmountInvoiced(financialSummary.financials.totalInvoiced);
      setAmountReceived(financialSummary.financials.totalReceived);
      setFeeAmount(financialSummary.financials.totalMargin);
      setNetAmount(financialSummary.financials.suggestedAmount);
      setCurrency(financialSummary.contract.currency || "USD");

      // Auto-select contractor from contract if not set
      if (!contractorId && financialSummary.contractor) {
        setContractorId(financialSummary.contractor.id);
      }
    }
  }, [financialSummary, contractorId]);

  // Recalculate net amount when inputs change
  useEffect(() => {
    const calculated = amountReceived - feeAmount;
    setNetAmount(Math.max(0, calculated));
  }, [amountReceived, feeAmount]);

  // Create remittance mutation
  const createMutation = api.remittance.createRemittance.useMutation({
    onSuccess: async (data) => {
      // Upload document if file is provided
      if (file && data.id) {
        try {
          await uploadDocument(data.id);
        } catch (error) {
          console.error("Failed to upload document:", error);
          toast.warning("Remittance created but document upload failed.");
        }
      }

      toast.success("Remittance created successfully!");
      utils.remittance.getMyRemittances.invalidate();
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create remittance");
    },
  });

  // Document upload mutation
  const uploadDocMutation = api.document.upload.useMutation();

  const uploadDocument = async (remittanceId: string) => {
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    await uploadDocMutation.mutateAsync({
      entityType: "remittance",
      entityId: remittanceId,
      fileName: file.name,
      buffer: base64,
      mimeType: file.type,
      fileSize: file.size,
      category: "remittance",
      description: "Remittance document",
    });
  };

  const handleSubmit = () => {
    const userId = contractorId || financialSummary?.contractor?.id;

    if (!userId) {
      toast.error("Please select a contractor");
      return;
    }

    if (activeTab === "manual") {
      if (!manualAmount || parseFloat(manualAmount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      createMutation.mutate({
        userId,
        contractId: contractId || undefined,
        amount: parseFloat(manualAmount),
        currency,
        description: description || undefined,
        notes: notes || undefined,
      });
    } else {
      // Contract-based mode
      if (!contractId) {
        toast.error("Please select a contract");
        return;
      }

      if (netAmount <= 0) {
        toast.error("Net payment amount must be greater than zero");
        return;
      }

      createMutation.mutate({
        userId,
        contractId,
        amount: netAmount,
        currency,
        description: description || undefined,
        notes: notes || undefined,
        amountInvoiced,
        amountReceived,
        feeAmount,
        netAmount,
      });
    }
  };

  const handleClose = () => {
    setContractorId("");
    setContractId("");
    setManualAmount("");
    setCurrency("USD");
    setDescription("");
    setNotes("");
    setFile(null);
    setAmountInvoiced(0);
    setAmountReceived(0);
    setFeeAmount(0);
    setNetAmount(0);
    setActiveTab("contract");
    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || uploadDocMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Remittance</DialogTitle>
          <DialogDescription>
            Create a new remittance payment for a contractor
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "contract" | "manual")}
          className="flex-1"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contract" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              From Contract
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 max-h-[55vh] pr-4 mt-4">
            {/* CONTRACT-BASED MODE */}
            <TabsContent value="contract" className="space-y-4 mt-0">
              {/* Contract Selection */}
              <div className="space-y-2">
                <Label>Select Contract *</Label>
                <Select value={contractId} onValueChange={setContractId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a contract..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingContracts ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : contracts.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No contracts found
                      </SelectItem>
                    ) : (
                      contracts.map((contract: any) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.title ||
                            contract.contractReference ||
                            `Contract ${contract.id.slice(0, 8)}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Loading state */}
              {loadingFinancials && contractId && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Loading contract data...
                  </span>
                </div>
              )}

              {/* Financial Summary */}
              {financialSummary && !loadingFinancials && (
                <>
                  {/* Contractor Info */}
                  {financialSummary.contractor && (
                    <Card className="bg-muted/40">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {financialSummary.contractor.name ||
                                financialSummary.contractor.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Contractor
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Bank Account Info */}
                  {financialSummary.bankAccount && (
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">
                              Payment to:{" "}
                              {financialSummary.bankAccount.bankName || "Bank Account"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {financialSummary.bankAccount.accountHolderName}
                              {financialSummary.bankAccount.accountNumber &&
                                ` - Account ${financialSummary.bankAccount.accountNumber}`}
                              {financialSummary.bankAccount.iban &&
                                ` - IBAN ${financialSummary.bankAccount.iban}`}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Separator />

                  {/* Payment Breakdown */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Payment Breakdown
                    </Label>

                    {/* Amount Invoiced */}
                    <div className="grid grid-cols-[1fr,auto,120px] gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Amount Invoiced to Client</span>
                      </div>
                      <span className="text-muted-foreground">=</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountInvoiced}
                        onChange={(e) =>
                          setAmountInvoiced(parseFloat(e.target.value) || 0)
                        }
                        className="text-right"
                      />
                    </div>

                    {/* Amount Received */}
                    <div className="grid grid-cols-[1fr,auto,120px] gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Amount Received</span>
                      </div>
                      <span className="text-muted-foreground">=</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountReceived}
                        onChange={(e) =>
                          setAmountReceived(parseFloat(e.target.value) || 0)
                        }
                        className="text-right"
                      />
                    </div>

                    {/* Fee */}
                    <div className="grid grid-cols-[1fr,auto,120px] gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Our Fee / Margin</span>
                      </div>
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={feeAmount}
                        onChange={(e) =>
                          setFeeAmount(parseFloat(e.target.value) || 0)
                        }
                        className="text-right"
                      />
                    </div>

                    <Separator />

                    {/* Net Payment */}
                    <div className="grid grid-cols-[1fr,auto,120px] gap-2 items-center bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Equal className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                          Net Payment to Contractor
                        </span>
                      </div>
                      <span className="text-green-600 font-bold">=</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">
                          ${netAmount.toFixed(2)}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {currency}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Already Remitted Warning */}
                  {financialSummary.financials.totalRemitted > 0 && (
                    <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                      <CardContent className="p-3">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Note: ${financialSummary.financials.totalRemitted.toFixed(2)}{" "}
                          has already been remitted for this contract.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Remittance Document (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* MANUAL MODE */}
            <TabsContent value="manual" className="space-y-4 mt-0">
              {/* Contractor Selection */}
              <div className="space-y-2">
                <Label>Contractor *</Label>
                <Select value={contractorId} onValueChange={setContractorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contractor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingContractors ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : contractorUsers.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No contractors found
                      </SelectItem>
                    ) : (
                      contractorUsers.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Contract Selection (Optional) */}
              {contractorId && (
                <div className="space-y-2">
                  <Label>Contract (Optional)</Label>
                  <Select
                    value={contractId || "none"}
                    onValueChange={(v) => setContractId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contract..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No contract</SelectItem>
                      {loadingContracts ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : contractorContracts.length === 0 ? (
                        <SelectItem value="no-contracts" disabled>
                          No contracts for this contractor
                        </SelectItem>
                      ) : (
                        contractorContracts.map((contract: any) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.title ||
                              contract.contractReference ||
                              `Contract ${contract.id.slice(0, 8)}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Amount and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Remittance Document</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Remittance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
