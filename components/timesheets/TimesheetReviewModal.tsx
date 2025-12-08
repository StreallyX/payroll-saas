"use client";

import { api } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useMemo } from "react";
import { Loader2, CheckCircle, FileText, Clock, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import {
  WorkflowStatusBadge,
  WorkflowActionButtons,
  WorkflowActionPresets,
  MarginCalculationDisplay,
} from "@/components/workflow";

// Helper: find main participant
function getMainParticipant(contract: any) {
  if (!contract) return null;

  return (
    contract.participants?.find((p: any) => p.isPrimary) ||
    contract.participants?.find((p: any) => p.role === "contractor") ||
    null
  );
}

interface TimesheetReviewModalProps {
  timesheetId: string;
  onClose: () => void;
}

export function TimesheetReviewModal({
  timesheetId,
  onClose,
}: TimesheetReviewModalProps) {
  const { hasPermission } = usePermissions();
  const [adminModifiedAmount, setAdminModifiedAmount] = useState<string>("");
  const [isModifyingAmount, setIsModifyingAmount] = useState(false);

  const utils = api.useUtils();

  const { data, isLoading } = api.timesheet.getById.useQuery(
    { id: timesheetId },
    { enabled: !!timesheetId }
  );

  // Workflow action mutations
  const reviewMutation = api.timesheet.reviewTimesheet.useMutation({
    onSuccess: () => {
      toast.success("Timesheet moved to review");
      utils.timesheet.getAll.invalidate();
      utils.timesheet.getById.invalidate({ id: timesheetId });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // TODO: Implement approve mutation when procedure is added to timesheet router
  // const approveMutation = api.timesheet.approve.useMutation({
  //   onSuccess: () => {
  //     toast.success("Timesheet approved! Invoice will be generated.");
  //     utils.timesheet.getAll.invalidate();
  //     onClose();
  //   },
  //   onError: (err: any) => toast.error(err.message),
  // });

  const rejectMutation = api.timesheet.reject.useMutation({
    onSuccess: () => {
      toast.success("Timesheet rejected");
      utils.timesheet.getAll.invalidate();
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const requestChangesMutation = api.timesheet.requestChanges.useMutation({
    onSuccess: () => {
      toast.success("Changes requested");
      utils.timesheet.getAll.invalidate();
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const modifyAmountMutation = api.timesheet.modifyAmounts.useMutation({
    onSuccess: () => {
      toast.success("Amount updated");
      utils.timesheet.getById.invalidate({ id: timesheetId });
      setIsModifyingAmount(false);
      setAdminModifiedAmount("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const main = useMemo(() => getMainParticipant((data as any)?.contract), [data]);

  // Calculate margin breakdown
  const marginBreakdown = useMemo(() => {
    if (!data) return null;

    const contract = data.contract;
    const baseAmount = Number(data.totalAmount || 0);
    const marginValue = Number(contract?.margin || 0);
    const marginType = contract?.marginType?.toLowerCase() || "percentage";
    const marginPaidBy = contract?.marginPaidBy || "client";
    
    // Calculate margin based on type
    let marginAmount = 0;
    let marginPercent = 0;
    
    if (marginType === "fixed") {
      // Fixed amount margin
      marginAmount = marginValue;
      marginPercent = baseAmount > 0 ? (marginValue / baseAmount) * 100 : 0;
    } else {
      // Percentage margin
      marginPercent = marginValue;
      marginAmount = (baseAmount * marginValue) / 100;
    }

    let totalWithMargin = baseAmount;
    if (marginPaidBy === "client") {
      totalWithMargin = baseAmount + marginAmount;
    } else if (marginPaidBy === "contractor") {
      totalWithMargin = baseAmount - marginAmount;
    }

    return {
      baseAmount,
      marginAmount,
      marginPercentage: marginPercent,
      marginType: marginType as "fixed" | "percentage",
      totalWithMargin,
      currency: "USD", // TODO: Get from contract.currency relation
      marginPaidBy: marginPaidBy as "client" | "agency" | "contractor",
      paymentMode: "gross" as const, // TODO: Get from contract if field exists
    };
  }, [data]);

  // Handle workflow actions
  const handleWorkflowAction = async (action: string, reason?: string) => {
    switch (action) {
      case "review":
        await reviewMutation.mutateAsync({ id: timesheetId });
        break;
      case "approve":
        // TODO: Implement approve action when procedure is added
        toast.error("Approve action not yet implemented");
        break;
      case "reject":
        await rejectMutation.mutateAsync({ id: timesheetId, reason: reason || "" });
        break;
      case "request_changes":
        await requestChangesMutation.mutateAsync({ id: timesheetId, changesRequested: reason || "" });
        break;
      default:
        toast.error("Unknown action");
    }
  };

  const handleModifyAmount = () => {
    const amount = parseFloat(adminModifiedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    modifyAmountMutation.mutate({
      id: timesheetId,
      totalAmount: amount,
      adminModificationNote: "Amount modified by admin",
    });
  };

  if (isLoading || !data) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canModify = hasPermission("timesheet.modify.global");
  const canReview = hasPermission("timesheet.review.global");
  const canApprove = hasPermission("timesheet.approve.global");
  const canReject = hasPermission("timesheet.reject.global");

  // Determine available actions based on state and permissions
  const availableActions = [];
  const currentState = data.workflowState || data.status;

  if (currentState === "submitted" && canReview) {
    availableActions.push(WorkflowActionPresets.timesheetReview[0]); // Review
  }

  if (
    (currentState === "submitted" || currentState === "under_review") &&
    canApprove
  ) {
    availableActions.push(WorkflowActionPresets.timesheetReview[1]); // Approve
    availableActions.push(WorkflowActionPresets.timesheetReview[2]); // Request Changes
  }

  if (
    (currentState === "submitted" || currentState === "under_review") &&
    canReject
  ) {
    availableActions.push(WorkflowActionPresets.timesheetReview[3]); // Reject
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Timesheet Review</DialogTitle>
            <WorkflowStatusBadge status={currentState} />
          </div>
          <p className="text-sm text-muted-foreground">
            Review timesheet details, calculations, and approve or request changes
          </p>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="entries">Entries</TabsTrigger>
            <TabsTrigger value="calculation">Calculation</TabsTrigger>
            <TabsTrigger value="preview">Invoice Preview</TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[calc(90vh-200px)] mt-4">
            {/* DETAILS TAB */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Worker Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="font-medium">{main?.user?.name ?? "Unknown"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium">{main?.user?.email ?? "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Contract</Label>
                      <p className="font-medium">
                        {data.contract?.title ||
                          data.contract?.contractReference ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rate Type</Label>
                      <p className="font-medium capitalize">
                        {data.contract?.rateType || "daily"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rate Amount</Label>
                      <p className="font-medium">
                        ${data.contract?.rate?.toString() || "0"} /{" "}
                        {data.contract?.rateType || "day"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Margin Type</Label>
                      <p className="font-medium capitalize">
                        {data.contract?.marginType || "percentage"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Margin Amount</Label>
                      <p className="font-medium">
                        {data.contract?.marginType?.toLowerCase() === "fixed"
                          ? `$${data.contract?.margin?.toString() || "0"}`
                          : `${data.contract?.margin?.toString() || "0"}%`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Margin Paid By</Label>
                      <p className="font-medium capitalize">
                        {data.contract?.marginPaidBy || "client"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                      <p className="font-medium capitalize">
                        gross
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timesheet Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Period</Label>
                      <p className="font-medium">
                        {new Date(data.startDate).toLocaleDateString()} →{" "}
                        {new Date(data.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Hours</Label>
                      <p className="font-medium">{Number(data.totalHours).toFixed(1)}h</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submitted</Label>
                      <p className="font-medium">
                        {data.submittedAt
                          ? new Date(data.submittedAt).toLocaleDateString()
                          : "Not submitted"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isModifyingAmount ? "Original Amount" : "Amount"}
                      </Label>
                      <p className="font-medium text-lg">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(data.totalAmount || 0))}
                      </p>
                    </div>
                  </div>

                  {data.notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm text-muted-foreground italic">{data.notes}</p>
                    </div>
                  )}

                  {/* Admin Modify Amount */}
                  {canModify && (currentState === "submitted" || currentState === "under_review") && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Admin Adjustment</Label>
                          {!isModifyingAmount && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsModifyingAmount(true);
                                setAdminModifiedAmount(data.totalAmount?.toString() || "");
                              }}
                            >
                              Modify Amount
                            </Button>
                          )}
                        </div>

                        {isModifyingAmount && (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={adminModifiedAmount}
                              onChange={(e) => setAdminModifiedAmount(e.target.value)}
                              placeholder="Enter new amount"
                            />
                            <Button
                              onClick={handleModifyAmount}
                              disabled={modifyAmountMutation.isPending}
                            >
                              {modifyAmountMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsModifyingAmount(false);
                                setAdminModifiedAmount("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}

                        {data.adminModifiedAmount && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Amount was adjusted by admin to{" "}
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(Number(data.adminModifiedAmount))}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ENTRIES TAB */}
            <TabsContent value="entries" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Time Entries</CardTitle>
                  <CardDescription>Daily breakdown of hours worked</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.entries && data.entries.length > 0 ? (
                    <div className="space-y-2">
                      {data.entries.map((entry: any) => (
                        <div
                          key={entry.id}
                          className="flex justify-between items-center py-2 border-b last:border-0"
                        >
                          <div>
                            <p className="font-medium">
                              {new Date(entry.date).toLocaleDateString()}
                            </p>
                            {entry.description && (
                              <p className="text-sm text-muted-foreground">
                                {entry.description}
                              </p>
                            )}
                          </div>
                          <p className="font-medium">{Number(entry.hours)}h</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No detailed entries available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CALCULATION TAB */}
            <TabsContent value="calculation" className="space-y-4">
              {marginBreakdown && (
                <MarginCalculationDisplay breakdown={marginBreakdown} showDetails={true} />
              )}

              {/* TODO: Expenses functionality not yet implemented in timesheet model */}
              {/* {data.expenses && data.expenses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.expenses.map((expense: any) => (
                        <div
                          key={expense.id}
                          className="flex justify-between items-center py-2 border-b last:border-0"
                        >
                          <div>
                            <p className="font-medium capitalize">{expense.category}</p>
                            <p className="text-sm text-muted-foreground">
                              {expense.description}
                            </p>
                          </div>
                          <p className="font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(Number(expense.amount))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )} */}
            </TabsContent>

            {/* INVOICE PREVIEW TAB */}
            <TabsContent value="preview" className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  {currentState === "approved"
                    ? "Invoice has been generated for this timesheet."
                    : "Upon approval, an invoice will be automatically generated."}
                </AlertDescription>
              </Alert>

              {marginBreakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Invoice Summary</CardTitle>
                    <CardDescription>
                      Invoice will be sent to: {marginBreakdown.marginPaidBy === "client" ? "Client" : "Agency"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Amount:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: marginBreakdown.currency,
                        }).format(marginBreakdown.baseAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Margin{" "}
                        {marginBreakdown.marginType === "fixed"
                          ? "(Fixed)"
                          : `(${marginBreakdown.marginPercentage.toFixed(2)}%)`}
                        :
                      </span>
                      <span className="font-medium text-blue-600">
                        +{" "}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: marginBreakdown.currency,
                        }).format(marginBreakdown.marginAmount)}
                      </span>
                    </div>
                    {marginBreakdown.marginType === "fixed" && (
                      <div className="text-xs text-muted-foreground italic">
                        Fixed margin ≈ {marginBreakdown.marginPercentage.toFixed(2)}% of base amount
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Invoice Total:</span>
                      <span className="font-bold text-green-600">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: marginBreakdown.currency,
                        }).format(marginBreakdown.totalWithMargin)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* WORKFLOW ACTIONS */}
        <DialogFooter className="flex justify-between items-center pt-4 mt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {availableActions.length > 0 && (
            <WorkflowActionButtons
              actions={availableActions}
              onAction={handleWorkflowAction}
              isLoading={
                reviewMutation.isPending ||
                rejectMutation.isPending ||
                requestChangesMutation.isPending
              }
              className="flex gap-2"
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
