"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { 
  Loader2, 
  CheckCircle, 
  FileText, 
  DollarSign, 
  AlertCircle, 
  XCircle,
  Send,
  Eye,
  ArrowLeft,
  Calendar,
  Clock,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { WorkflowStatusBadge } from "@/components/workflow";
import { TimesheetDetailedTimeline } from "@/components/timesheets/TimesheetDetailedTimeline";
import { TimesheetDocumentList } from "@/components/timesheets/TimesheetDocumentList";
import { TimesheetDocumentUploader } from "@/components/timesheets/TimesheetDocumentUploader";
import Link from "next/link";

// Helper: find main participant
function getMainParticipant(contract: any) {
  if (!contract) return null;

  return (
    contract.participants?.find((p: any) => p.role === "contractor") ||
    null
  );
}

export default function TimesheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const timesheetId = params.id as string;

  const { hasPermission } = usePermissions();
  
  // 2-step confirmation states
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const utils = api.useUtils();

  const { data, isLoading, error } = api.timesheet.getById.useQuery(
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
      router.push("/timesheets");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendToAgencyMutation = api.timesheet.sendToAgency.useMutation({
    onSuccess: () => {
      toast.success("Invoice created and sent to agency!");
      utils.timesheet.getAll.invalidate();
      utils.timesheet.getById.invalidate({ id: timesheetId });
      utils.invoice.getAll.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const main = useMemo(() => getMainParticipant((data as any)?.contract), [data]);

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

  const isProcessing = 
    submitMutation.isPending ||
    reviewMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    sendToAgencyMutation.isPending;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading timesheet...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <p>{error?.message || "Timesheet not found"}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/timesheets">Back to list</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canReview = hasPermission("timesheet.review.global");
  const canApprove = hasPermission("timesheet.approve.global");
  const canReject = hasPermission("timesheet.reject.global");
  const canSubmit = hasPermission("timesheet.submit.own");
  const canModify = hasPermission("timesheet.modify.global");
  const canViewMargin = hasPermission("timesheet.view_margin.global");

  const currentState = data.workflowState || data.status;
  const isOwner = data.submittedBy === data.submitter?.id;
  const isDraft = currentState === "draft";
  const canUploadFiles = isDraft && (isOwner || canModify);

  // 🔥 FIX: Use correct amount fields from timesheet
  // - baseAmount = work amount (hours × rate)
  // - marginAmount = calculated margin (hidden from contractors)
  // - totalExpenses = sum of expenses
  // - totalAmount = final total (baseAmount + marginAmount + totalExpenses)
  const hoursTotal = Number(data.totalHours || 0);
  const workAmount = Number(data.baseAmount || 0); // Work amount (hours × rate)
  const marginAmount = Number(data.marginAmount || 0); // Margin (hidden from contractors)
  const expensesAmount = Number(data.totalExpenses || 0); // Total expenses from timesheet
  const totalAmount = Number(data.totalAmount || 0); // Final total (already includes everything)

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/timesheets" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Timesheets
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <FileText className="h-8 w-8 mt-1 flex-shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">Timesheet Details</h1>
              <div className="flex items-center gap-2 mt-2">
                <WorkflowStatusBadge status={currentState} />
                <span className="text-sm text-muted-foreground">
                  {new Date(data.startDate).toLocaleDateString()} → {new Date(data.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Period
                  </p>
                  <p className="font-medium mt-1">
                    {new Date(data.startDate).toLocaleDateString()} → {new Date(data.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Total Hours
                  </p>
                  <p className="font-medium mt-1">{hoursTotal.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contractor</p>
                  <p className="font-medium mt-1">{main?.user?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{main?.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract</p>
                  {data.contract?.id ? (
                    <Link 
                      href={`/contracts/${data.contract.id}`}
                      className="font-medium mt-1 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer block"
                    >
                      {data.contract?.title || data.contract?.contractReference || "Contract"}
                    </Link>
                  ) : (
                    <p className="font-medium mt-1">
                      {data.contract?.title || data.contract?.contractReference || "N/A"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    ${data.contract?.rate?.toString() || "0"} / {data.contract?.rateType || "day"}
                  </p>
                </div>
              </div>

              {data.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{data.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Worked Days / Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Worked Days</CardTitle>
              <CardDescription>
                Daily breakdown of hours worked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.entries && data.entries.length > 0 ? (
                <div className="space-y-2">
                  {data.entries.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex justify-between items-center py-3 border-b last:border-0"
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
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(
                              data.contract.rateType === "hourly"
                                ? Number(entry.hours) * Number(data.contract.rate)
                                : Number(data.contract.rate)
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t font-semibold">
                    <span>Total Hours:</span>
                    <span>{hoursTotal.toFixed(1)}h</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No entries found</p>
              )}
            </CardContent>
          </Card>

          {/* Expenses */}
          {data.expenses && data.expenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Expenses
                </CardTitle>
                <CardDescription>
                  Additional expenses claimed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.expenses.map((expense: any) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center py-3 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{expense.description || "Expense"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(expense.expenseDate).toLocaleDateString()}</span>
                          {expense.category && (
                            <Badge variant="secondary" className="text-xs">
                              {expense.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(Number(expense.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t font-semibold">
                    <span>Total Expenses:</span>
                    <span>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(expensesAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files Section */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Supporting documents and expense receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document List */}
              <TimesheetDocumentList
                timesheetId={timesheetId}
                documents={(data as any).documents || []}
                canDelete={canUploadFiles}
              />

              {/* Document Uploader (only for draft timesheets) */}
              {canUploadFiles && (
                <TimesheetDocumentUploader
                  timesheetId={timesheetId}
                  onSuccess={() => utils.timesheet.getById.invalidate({ id: timesheetId })}
                  disabled={!canUploadFiles}
                />
              )}

              {!canUploadFiles && ((data as any).documents?.length === 0 || !(data as any).documents) && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No documents attached</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Invoice Preview
              </CardTitle>
              <CardDescription>
                {currentState === "approved" || currentState === "sent"
                  ? "Invoice breakdown for this timesheet"
                  : "Estimated invoice upon approval"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {canViewMargin ? (
                // Full breakdown for users with margin permission
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Work Amount ({hoursTotal.toFixed(1)}h):</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(workAmount)}
                      </span>
                    </div>
                    {marginAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margin:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(marginAmount)}
                        </span>
                      </div>
                    )}
                    {expensesAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expenses:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(expensesAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(totalAmount)}
                    </span>
                  </div>
                </>
              ) : (
                // Simplified view for users without margin permission
                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(totalAmount)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* Timeline */}
          <TimesheetDetailedTimeline
            timesheet={data}
            statusHistory={(data as any).statusHistory || []}
          />

          {/* Workflow Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Submit button for draft timesheets */}
              {currentState === "draft" && canSubmit && isOwner && (
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
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

              {/* Review button - only admins */}
              {currentState === "submitted" && canReview && !action && (
                <Button
                  onClick={handleReview}
                  disabled={isProcessing}
                  variant="secondary"
                  className="w-full"
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

              {/* Approve button */}
              {(currentState === "submitted" || currentState === "under_review") && canApprove && !action && (
                <Button
                  onClick={() => setAction("approve")}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              )}

              {/* Reject button */}
              {(currentState === "submitted" || currentState === "under_review") && canReject && !action && (
                <Button
                  onClick={() => setAction("reject")}
                  disabled={isProcessing}
                  variant="destructive"
                  className="w-full"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              )}

              {/* Send to Agency button */}
              {currentState === "approved" && canApprove && !data.invoiceId && (
                <Button
                  onClick={handleSendToAgency}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
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

              {/* Invoice created message */}
              {currentState === "sent" && data.invoiceId && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    Invoice created successfully
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <Button variant="outline" className="w-full" asChild>
                <Link href="/timesheets">Close</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR ACTIONS */}
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
                  </div>
                </div>
              )}
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
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
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
