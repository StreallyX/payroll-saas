"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, X, FileUp, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarginCalculationDisplay } from "@/components/workflow";

// Expense interface
interface Expense {
  id: string;
  category: string;
  description: string;
  amount: string;
  receipt: File | null;
}

// Fake upload
async function uploadFile(file: File | null): Promise<string | null> {
  if (!file) return null;
  return new Promise((res) => setTimeout(() => res("https://fake-url.com/" + file.name), 500));
}

export function TimesheetSubmissionFormModal({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [contractId, setContractId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("8");
  const [notes, setNotes] = useState("");
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const utils = api.useUtils();
  const { data: contracts = [] } = api.contract.getMyContracts.useQuery();

  // Get selected contract details
  const selectedContract = useMemo(() => {
    return contracts.find((c: any) => c.id === contractId);
  }, [contractId, contracts]);

  // Calculate working days and totals
  const calculatedValues = useMemo(() => {
    if (!startDate || !endDate || !selectedContract) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Calculate working days (exclude weekends)
    let workingDays = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const hoursNum = parseFloat(hoursPerDay) || 8;
    const totalHours = workingDays * hoursNum;

    // Calculate base amount based on rate type
    let baseAmount = 0;
    const rate = parseFloat(selectedContract.rate?.toString() || "0");
    const rateType = selectedContract.rateType;

    if (rateType === "daily") {
      baseAmount = rate * workingDays;
    } else if (rateType === "hourly") {
      baseAmount = rate * totalHours;
    } else if (rateType === "monthly") {
      // Approximate monthly calculation
      baseAmount = rate * (workingDays / 20);
    } else {
      baseAmount = rate;
    }

    // Calculate margin
    const marginPercent = parseFloat(selectedContract.margin?.toString() || "0");
    const marginAmount = (baseAmount * marginPercent) / 100;
    const marginPaidBy = selectedContract.marginPaidBy || "client";

    let totalWithMargin = baseAmount;
    if (marginPaidBy === "client") {
      totalWithMargin = baseAmount + marginAmount;
    } else if (marginPaidBy === "contractor") {
      totalWithMargin = baseAmount - marginAmount;
    }

    // Calculate expenses
    const expensesTotal = expenses.reduce((sum, exp) => {
      return sum + (parseFloat(exp.amount) || 0);
    }, 0);

    return {
      workingDays,
      totalHours,
      baseAmount,
      marginAmount,
      marginPercent,
      totalWithMargin,
      expensesTotal,
      grandTotal: totalWithMargin + expensesTotal,
      currency: "USD", // TODO: Get from selectedContract.currency relation
      marginPaidBy: marginPaidBy as "client" | "agency" | "contractor",
      paymentMode: "gross" as const, // TODO: Get from contract if field exists
    };
  }, [startDate, endDate, hoursPerDay, selectedContract, expenses]);

  const reset = () => {
    setContractId("");
    setStartDate("");
    setEndDate("");
    setHoursPerDay("8");
    setNotes("");
    setTimesheetFile(null);
    setExpenses([]);
  };

  const create = api.timesheet.createRange.useMutation({
    onSuccess: () => {
      toast.success("Timesheet submitted");
      utils.timesheet.getMyTimesheets.invalidate();
      reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!contractId) return toast.error("Select a contract");
    if (!startDate || !endDate) return toast.error("Select a period");

    const timesheetUrl = await uploadFile(timesheetFile);

    // Upload expense receipts
    const expensesWithUrls = await Promise.all(
      expenses.map(async (exp) => ({
        category: exp.category,
        description: exp.description,
        amount: parseFloat(exp.amount),
        receiptUrl: await uploadFile(exp.receipt),
      }))
    );

    create.mutate({
      contractId,
      startDate,
      endDate,
      hoursPerDay,
      notes: notes || undefined,
      timesheetFileUrl: timesheetUrl || undefined,
      // TODO: Backend needs to support these fields
      // expenses: expensesWithUrls,
      // status: asDraft ? "draft" : "submitted",
    });
  };

  // Add expense
  const addExpense = () => {
    setExpenses([
      ...expenses,
      {
        id: Math.random().toString(36).substr(2, 9),
        category: "",
        description: "",
        amount: "0",
        receipt: null,
      },
    ]);
  };

  // Remove expense
  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
  };

  // Update expense
  const updateExpense = (id: string, field: keyof Expense, value: any) => {
    setExpenses(
      expenses.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Timesheet</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6 py-2">
            {/* CONTRACT SELECTION */}
            <div className="space-y-2">
              <Label>Contract *</Label>
              <Select value={contractId} onValueChange={setContractId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title || c.contractReference || "Contract"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CONTRACT DETAILS */}
            {selectedContract && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium">
                      ${selectedContract.rate?.toString() || "0"} /{" "}
                      {selectedContract.rateType || "day"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin:</span>
                    <span className="font-medium">
                      {selectedContract.margin?.toString() || "0"}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin Paid By:</span>
                    <span className="font-medium capitalize">
                      {selectedContract.marginPaidBy || "client"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Mode:</span>
                    <span className="font-medium capitalize">
                      gross
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PERIOD */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* HOURS */}
            <div className="space-y-2">
              <Label>Hours Per Day *</Label>
              <Input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
              />
              {calculatedValues && (
                <p className="text-xs text-muted-foreground">
                  {calculatedValues.workingDays} working days × {hoursPerDay} hours ={" "}
                  {calculatedValues.totalHours} total hours
                </p>
              )}
            </div>

            {/* TIMESHEET FILE */}
            <div className="space-y-2">
              <Label>Timesheet Document (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setTimesheetFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {timesheetFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setTimesheetFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* EXPENSES SECTION */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Expenses</h3>
                  <p className="text-xs text-muted-foreground">
                    Add any expenses related to this timesheet period
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addExpense}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </div>

              {expenses.length > 0 && (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <Card key={expense.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Category</Label>
                              <Select
                                value={expense.category}
                                onValueChange={(value) =>
                                  updateExpense(expense.id, "category", value)
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="travel">Travel</SelectItem>
                                  <SelectItem value="accommodation">Accommodation</SelectItem>
                                  <SelectItem value="meals">Meals</SelectItem>
                                  <SelectItem value="equipment">Equipment</SelectItem>
                                  <SelectItem value="software">Software</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Amount</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                value={expense.amount}
                                onChange={(e) =>
                                  updateExpense(expense.id, "amount", e.target.value)
                                }
                                className="h-9"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              placeholder="Brief description"
                              value={expense.description}
                              onChange={(e) =>
                                updateExpense(expense.id, "description", e.target.value)
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Receipt</Label>
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) =>
                                  updateExpense(expense.id, "receipt", e.target.files?.[0] || null)
                                }
                                className="h-9"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExpense(expense.id)}
                              className="mt-5"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            {/* CALCULATION PREVIEW */}
            {calculatedValues && (
              <>
                <Separator />
                <MarginCalculationDisplay
                  breakdown={{
                    baseAmount: calculatedValues.baseAmount,
                    marginAmount: calculatedValues.marginAmount,
                    marginPercentage: calculatedValues.marginPercent,
                    totalWithMargin: calculatedValues.totalWithMargin,
                    currency: calculatedValues.currency,
                    marginPaidBy: calculatedValues.marginPaidBy,
                    paymentMode: calculatedValues.paymentMode as any,
                  }}
                />

                {/* Grand Total with Expenses */}
                {calculatedValues.expensesTotal > 0 && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Timesheet Total:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: calculatedValues.currency,
                            }).format(calculatedValues.totalWithMargin)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expenses:</span>
                          <span className="font-medium">
                            +{" "}
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: calculatedValues.currency,
                            }).format(calculatedValues.expensesTotal)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base">
                          <span className="font-semibold">Grand Total:</span>
                          <span className="font-bold text-green-600">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: calculatedValues.currency,
                            }).format(calculatedValues.grandTotal)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* PAYMENT MODE INFO */}
            {selectedContract && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Payment Mode: </strong>
                  You will receive the gross amount and handle your own taxes.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={create.isPending}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
