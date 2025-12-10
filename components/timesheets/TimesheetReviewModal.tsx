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
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { 
  Loader2, 
  CheckCircle, 
  FileText, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  XCircle,
  Download,
  Eye,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import {
  WorkflowStatusBadge,
  // MARGIN HIDDEN: MarginCalculationDisplay import commented out per requirements
  // MarginCalculationDisplay,
} from "@/components/workflow";
import { TimesheetStatusTimeline } from "./TimesheetStatusTimeline";
import { TimesheetFileViewer } from "./TimesheetFileViewer";

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
  
  // 2-step confirmation states
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const utils = api.useUtils();

  const { data, isLoading } = api.timesheet.getById.useQuery(
    { id: timesheetId },
    { enabled: !!timesheetId }
  );

  // Workflow action mutations
  const submitMutation = api.timesheet.submitTimesheet.useMutation({
    onSuccess: () => {
      toast.success("Timesheet submitted successfully!");
      utils.timesheet.getAll.invalidate();
      utils.timesheet.getById.invalidate({ id: timesheetId });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const reviewMutation = api.timesheet.reviewTimesheet.useMutation({
    onSuccess: () => {
      toast.success("Timesheet moved to review");
      utils.timesheet.getAll.invalidate();
      utils.timesheet.getById.invalidate({ id: timesheetId });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approveMutation = api.timesheet.approve.useMutation({
    onSuccess: () => {
      toast.success("Timesheet approved! Ready to send to agency.");
      utils.timesheet.getAll.invalidate();
      utils.timesheet.getById.invalidate({ id: timesheetId });
      setAction(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = api.timesheet.reject.useMutation({
    onSuccess: () => {
      toast.success("Timesheet rejected");
      utils.timesheet.getAll.invalidate();
      utils.timesheet.getById.invalidate({ id: timesheetId });
      setAction(null);
      setRejectionReason("");
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendToAgencyMutation = api.timesheet.sendToAgency.useMutation({
    onSuccess: () => {
      toast.success("Invoice created and sent to agency!");
      utils.timesheet.getAll.invalidate();
      utils.timesheet.getById.invalidate({ id: timesheetId });
      utils.invoice.getAll.invalidate();
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

  // MARGIN HIDDEN: Margin breakdown calculation commented out per requirements
  // const marginBreakdown = useMemo(() => {
  //   if (!data) return null;

  //   const contract = data.contract;
  //   const baseAmount = Number(data.totalAmount || 0);
  //   const marginValue = Number(contract?.margin || 0);
  //   const marginType = contract?.marginType?.toLowerCase() || "percentage";
  //   const marginPaidBy = contract?.marginPaidBy || "client";
    
  //   // Calculate margin based on type
  //   let marginAmount = 0;
  //   let marginPercent = 0;
    
  //   if (marginType === "fixed") {
  //     // Fixed amount margin
  //     marginAmount = marginValue;
  //     marginPercent = baseAmount > 0 ? (marginValue / baseAmount) * 100 : 0;
  //   } else {
  //     // Percentage margin
  //     marginPercent = marginValue;
  //     marginAmount = (baseAmount * marginValue) / 100;
  //   }

  //   let totalWithMargin = baseAmount;
  //   if (marginPaidBy === "client") {
  //     totalWithMargin = baseAmount + marginAmount;
  //   } else if (marginPaidBy === "contractor") {
  //     totalWithMargin = baseAmount - marginAmount;
  //   }

  //   return {
  //     baseAmount,
  //     marginAmount,
  //     marginPercentage: marginPercent,
  //     marginType: marginType as "fixed" | "percentage",
  //     totalWithMargin,
  //     currency: "USD", // TODO: Get from contract.currency relation
  //     marginPaidBy: marginPaidBy as "client" | "agency" | "contractor",
  //     paymentMode: "gross" as const, // TODO: Get from contract if field exists
  //   };
  // }, [data]);

  // Handle workflow actions
  const handleSubmit = async () => {
    await submitMutation.mutateAsync({ id: timesheetId });
  };

  const handleReview = async () => {
    await reviewMutation.mutateAsync({ id: timesheetId });
  };

  const handleApprove = async () => {
    await approveMutation.mutateAsync({ id: timesheetId });
  };

  const handleReject = async () => {
    const trimmedReason = rejectionReason.trim();
    
    // Validation: minimum 10 characters required
    if (!trimmedReason || trimmedReason.length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }

    await rejectMutation.mutateAsync({ 
      id: timesheetId, 
      reason: trimmedReason 
    });
  };

  const handleSendToAgency = async () => {
    await sendToAgencyMutation.mutateAsync({ id: timesheetId });
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

  const handleClose = () => {
    if (!isProcessing) {
      setAction(null);
      setRejectionReason("");
      onClose();
    }
  };

  const isProcessing = 
    submitMutation.isPending ||
    reviewMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    sendToAgencyMutation.isPending ||
    requestChangesMutation.isPending;

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

  const currentState = data.workflowState || data.status;

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Timesheet Review
            </DialogTitle>
            <WorkflowStatusBadge status={currentState} />
          </div>
          <p className="text-sm text-muted-foreground">
            Review timesheet details, files, and approve or reject
          </p>
        </DialogHeader>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="calculation">Calculation</TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[calc(90vh-250px)] mt-4">
            {/* TIMELINE TAB */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Workflow Timeline</CardTitle>
                  <CardDescription>Complete history of timesheet status changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <TimesheetStatusTimeline
                    currentStatus={currentState as any}
                    statusHistory={[]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* FILES TAB */}
            <TabsContent value="files" className="space-y-4">
              <div className="space-y-4">
                {/* Timesheet File Viewer */}
                <TimesheetFileViewer
                  fileUrl={data.timesheetFileUrl}
                  fileName="timesheet.pdf"
                  fileType="timesheet"
                />

                {/* Expense File Viewer */}
                {data.expenseFileUrl && (
                  <TimesheetFileViewer
                    fileUrl={data.expenseFileUrl}
                    fileName="expense-receipts.pdf"
                    fileType="expense"
                  />
                )}

                {/* Show message if no files at all */}
                {!data.timesheetFileUrl && !data.expenseFileUrl && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No files attached</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        No timesheet or expense files have been uploaded
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>


            {/* DETAILS TAB */}

            {/* CONFIRMATION UI FOR ACTIONS */}
            {action && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {action === "approve" ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Confirm Approval
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          Confirm Rejection
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {action === "approve" ? (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-900">
                          You are about to approve this timesheet. It will be ready to send to the agency.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-3">
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            You are about to reject this timesheet. Please provide a reason.
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="reject-reason" className="required">
                              Rejection Reason *
                            </Label>
                            <span className={`text-xs ${
                              rejectionReason.trim().length < 10 
                                ? "text-red-500 font-medium" 
                                : "text-muted-foreground"
                            }`}>
                              {rejectionReason.trim().length} / 10 characters minimum
                            </span>
                          </div>
                          <Textarea
                            id="reject-reason"
                            placeholder="Explain why you are rejecting this timesheet (minimum 10 characters)..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            disabled={isProcessing}
                            rows={4}
                            className={rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 ? "border-red-300" : ""}
                          />
                          {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
                            <p className="text-xs text-red-500 font-medium">
                              ⚠️ The reason must contain at least 10 characters
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setAction(null)}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    {action === "approve" ? (
                      <Button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm Approval
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={!rejectionReason.trim() || rejectionReason.trim().length < 10 || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Confirm Rejection
                          </>
                        )}
                      </Button>
                    )}
                  </DialogFooter>
                </Card>
              </div>
            )}

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
                    {/* MARGIN HIDDEN: Margin Type field commented out per requirements */}
                    {/* <div>
                      <Label className="text-xs text-muted-foreground">Margin Type</Label>
                      <p className="font-medium capitalize">
                        {data.contract?.marginType || "percentage"}
                      </p>
                    </div> */}
                    {/* MARGIN HIDDEN: Margin Amount field commented out per requirements */}
                    {/* <div>
                      <Label className="text-xs text-muted-foreground">Margin Amount</Label>
                      <p className="font-medium">
                        {data.contract?.marginType?.toLowerCase() === "fixed"
                          ? `$${data.contract?.margin?.toString() || "0"}`
                          : `${data.contract?.margin?.toString() || "0"}%`}
                      </p>
                    </div> */}
                    {/* MARGIN HIDDEN: Margin Paid By field commented out per requirements */}
                    {/* <div>
                      <Label className="text-xs text-muted-foreground">Margin Paid By</Label>
                      <p className="font-medium capitalize">
                        {data.contract?.marginPaidBy || "client"}
                      </p>
                    </div> */}
                    {/* MARGIN HIDDEN: Payment Mode field commented out per requirements */}
                    {/* <div>
                      <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                      <p className="font-medium capitalize">
                        gross
                      </p>
                    </div> */}
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

            {/* CALCULATION TAB - Full Invoice Preview */}
            <TabsContent value="calculation" className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  {currentState === "approved" || currentState === "sent"
                    ? "Invoice preview for this timesheet."
                    : "Upon approval, an invoice will be generated with these details."}
                </AlertDescription>
              </Alert>

              {/* Invoice Line Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invoice Line Items</CardTitle>
                  <CardDescription>
                    Breakdown of work performed during the period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.entries && data.entries.length > 0 ? (
                    <div className="space-y-2">
                      {data.entries.map((entry: any) => (
                        <div
                          key={entry.id}
                          className="flex justify-between items-center py-2 border-b last:border-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            {entry.description && (
                              <p className="text-sm text-muted-foreground">{entry.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {Number(entry.hours)} {Number(entry.hours) === 1 ? "hour" : "hours"}
                            </p>
                            {data.contract?.rate && (
                              <p className="text-sm text-muted-foreground">
                                @ {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD", // MARGIN HIDDEN: Removed marginBreakdown reference
                                }).format(Number(data.contract.rate))}
                                {data.contract.rateType === "hourly" ? "/hr" : "/day"}
                              </p>
                            )}
                          </div>
                          <div className="w-24 text-right">
                            <p className="font-medium">
                              {data.contract?.rate
                                ? new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "USD", // MARGIN HIDDEN: Removed marginBreakdown reference
                                  }).format(
                                    data.contract.rateType === "hourly"
                                      ? Number(entry.hours) * Number(data.contract.rate)
                                      : Number(data.contract.rate)
                                  )
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No entries found</p>
                  )}
                </CardContent>
              </Card>

              {/* MARGIN HIDDEN: Margin Calculation Display commented out per requirements */}
              {/* {marginBreakdown && (
                <MarginCalculationDisplay breakdown={marginBreakdown} showDetails={true} />
              )} */}

              {/* Final Invoice Total */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Invoice Summary
                  </CardTitle>
                  {/* MARGIN HIDDEN: Invoice recipient description commented out per requirements */}
                  {/* <CardDescription>
                    Invoice will be sent to: {marginBreakdown?.marginPaidBy === "client" ? "Client" : "Agency"}
                  </CardDescription> */}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(data.totalAmount || 0))}
                    </span>
                  </div>
                  {/* MARGIN HIDDEN: All margin-related calculations commented out per requirements */}
                  {/* {marginBreakdown && marginBreakdown.marginAmount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Margin{" "}
                          {marginBreakdown.marginType === "fixed"
                            ? "(Fixed)"
                            : `(${marginBreakdown.marginPercentage.toFixed(2)}%)`}
                          :
                        </span>
                        <span className={`font-medium ${
                          marginBreakdown.marginPaidBy === "client" ? "text-blue-600" : "text-gray-600"
                        }`}>
                          {marginBreakdown.marginPaidBy === "client" ? "+" : "-"}{" "}
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
                    </>
                  )} */}
                  <Separator />
                  <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                    <span className="text-lg font-semibold">Invoice Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(data.totalAmount || 0))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        {/* WORKFLOW ACTIONS */}
        <DialogFooter className="flex justify-between items-center pt-4 mt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          
          <div className="flex gap-2">
            {/* Submit button for draft timesheets */}
            {currentState === "draft" && (
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Timesheet
                  </>
                )}
              </Button>
            )}

            {/* Review button */}
            {currentState === "submitted" && canReview && !action && (
              <Button
                onClick={handleReview}
                disabled={isProcessing}
                variant="secondary"
              >
                {reviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reviewing...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Mark Under Review
                  </>
                )}
              </Button>
            )}

            {/* Approve button - triggers confirmation */}
            {(currentState === "submitted" || currentState === "under_review") && canApprove && !action && (
              <Button
                onClick={() => setAction("approve")}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            )}

            {/* Reject button - triggers confirmation */}
            {(currentState === "submitted" || currentState === "under_review") && canReject && !action && (
              <Button
                onClick={() => setAction("reject")}
                disabled={isProcessing}
                variant="destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}

            {/* Send to Agency button - only for approved timesheets */}
            {currentState === "approved" && canApprove && !data.invoiceId && (
              <Button
                onClick={handleSendToAgency}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendToAgencyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to Agency
                  </>
                )}
              </Button>
            )}

            {/* Show invoice link if already sent */}
            {currentState === "sent" && data.invoiceId && (
              <Alert className="max-w-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Invoice created successfully
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}