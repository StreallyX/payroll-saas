"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useMemo } from "react";
import { Loader2, FileText, AlertCircle, User, Building2, DollarSign, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import {
  WorkflowStatusBadge,
  WorkflowActionButtons,
  MarginCalculationDisplay,
} from "@/components/workflow";
import { InvoicePDFPreview } from "@/components/invoices/InvoicePDFPreview";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { hasPermission } = usePermissions();
  const [adminModifiedAmount, setAdminModifiedAmount] = useState<string>("");
  const [isModifyingAmount, setIsModifyingAmount] = useState(false);

  const utils = api.useUtils();

  const { data, isLoading, error } = api.invoice.getById.useQuery(
    { id: invoiceId },
    { enabled: !!invoiceId }
  );

  // Workflow action mutations
  const reviewMutation = api.invoice.reviewInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice moved to review");
      utils.invoice.getAll.invalidate();
      utils.invoice.getById.invalidate({ id: invoiceId });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approveMutation = api.invoice.approveInvoiceWorkflow.useMutation({
    onSuccess: () => {
      toast.success("Invoice approved! Ready to be sent.");
      utils.invoice.getAll.invalidate();
      utils.invoice.getById.invalidate({ id: invoiceId });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = api.invoice.rejectInvoiceWorkflow.useMutation({
    onSuccess: () => {
      toast.success("Invoice rejected");
      utils.invoice.getAll.invalidate();
      router.push("/invoices");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const requestChangesMutation = api.invoice.requestInvoiceChanges.useMutation({
    onSuccess: () => {
      toast.success("Changes requested");
      utils.invoice.getAll.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendMutation = api.invoice.sendInvoiceWorkflow.useMutation({
    onSuccess: () => {
      toast.success("Invoice sent successfully!");
      utils.invoice.getAll.invalidate();
      utils.invoice.getById.invalidate({ id: invoiceId });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const modifyAmountMutation = api.invoice.modifyInvoiceAmounts.useMutation({
    onSuccess: () => {
      toast.success("Amount updated");
      utils.invoice.getById.invalidate({ id: invoiceId });
      setIsModifyingAmount(false);
      setAdminModifiedAmount("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Calculate margin breakdown
  const marginBreakdown = useMemo(() => {
    if (!data) return null;

    const baseAmount = Number(data.baseAmount || data.amount || 0);
    const marginValue = Number(data.marginAmount || 0);
    const marginPercent = Number(data.marginPercentage || 0);
    const totalWithMargin = Number(data.totalAmount || 0);
    
    return {
      baseAmount,
      marginAmount: marginValue,
      marginPercentage: marginPercent,
      marginType: "percentage" as const, // TODO: Get from contract
      totalWithMargin,
      currency: data.currency || "USD",
      marginPaidBy: (data.marginPaidBy || "client") as "client" | "agency" | "contractor",
      paymentMode: "gross" as const, // TODO: Get from contract if field exists
    };
  }, [data]);

  // Get contractor and client info
  const contractorParticipant = data?.contract?.participants?.find((p: any) => p.role === "contractor");
  const clientParticipant = data?.contract?.participants?.find((p: any) => p.role === "client");
  const agencyParticipant = data?.contract?.participants?.find((p: any) => p.role === "agency");

  const contractorName = contractorParticipant?.user?.name || contractorParticipant?.company?.name || "N/A";
  const clientName = clientParticipant?.user?.name || clientParticipant?.company?.name || "N/A";
  const agencyName = agencyParticipant?.user?.name || agencyParticipant?.company?.name || "N/A";

  // Determine invoice recipient based on margin paid by
  const invoiceRecipient = data?.marginPaidBy === "contractor" 
    ? contractorName 
    : (data?.marginPaidBy === "agency" ? agencyName : clientName);

  // Handle workflow actions
  const handleWorkflowAction = async (action: string, reason?: string) => {
    switch (action) {
      case "review":
        await reviewMutation.mutateAsync({ id: invoiceId, notes: reason });
        break;
      case "approve":
        await approveMutation.mutateAsync({ id: invoiceId, notes: reason });
        break;
      case "reject":
        await rejectMutation.mutateAsync({ id: invoiceId, rejectionReason: reason || "" });
        break;
      case "request_changes":
        await requestChangesMutation.mutateAsync({ id: invoiceId, changesRequested: reason || "" });
        break;
      case "send":
        await sendMutation.mutateAsync({ id: invoiceId, notes: reason });
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
      id: invoiceId,
      amount: amount,
      adminModificationNote: "Amount modified by admin",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading invoice...</p>
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
            <p>{error?.message || "Invoice not found"}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/invoices">Back to list</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canModify = hasPermission("invoice.modify.global");
  const canReview = hasPermission("invoice.review.global");
  const canApprove = hasPermission("invoice.approve.global");
  const canReject = hasPermission("invoice.reject.global");
  const canSend = hasPermission("invoice.send.global");

  // Determine available actions based on state and permissions
  const availableActions = [];
  const currentState = data.workflowState || data.status;

  if (currentState === "for_approval" && canReview) {
    availableActions.push({
      action: "review",
      label: "Mark as Under Review",
      variant: "outline" as const,
    });
  }

  if ((currentState === "for_approval" || currentState === "under_review") && canApprove) {
    availableActions.push({
      action: "approve",
      label: "Approve Invoice",
      variant: "default" as const,
    });
    availableActions.push({
      action: "request_changes",
      label: "Request Changes",
      variant: "outline" as const,
      requiresReason: true,
    });
  }

  if ((currentState === "for_approval" || currentState === "under_review") && canReject) {
    availableActions.push({
      action: "reject",
      label: "Reject Invoice",
      variant: "destructive" as const,
      requiresReason: true,
    });
  }

  if (currentState === "approved" && canSend) {
    availableActions.push({
      action: "send",
      label: "Send Invoice",
      variant: "default" as const,
    });
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Invoice Review
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review invoice details, calculations, and approve or request changes
            </p>
          </div>
        </div>
        <WorkflowStatusBadge status={currentState} />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="line-items">Line Items</TabsTrigger>
          <TabsTrigger value="calculation">Calculation & Margin</TabsTrigger>
        </TabsList>

        {/* PREVIEW TAB - NEW */}
        <TabsContent value="preview" className="space-y-4 mt-6">
          <InvoicePDFPreview
            invoice={{
              id: data.id,
              invoiceNumber: data.invoiceNumber,
              invoiceDate: data.invoiceDate,
              dueDate: data.dueDate,
              status: currentState,
              amount: Number(data.amount || 0),
              baseAmount: Number(data.baseAmount || data.amount || 0),
              marginAmount: Number(data.marginAmount || 0),
              marginPercentage: Number(data.marginPercentage || 0),
              totalAmount: Number(data.totalAmount || 0),
              currency: data.currency || "USD",
              marginPaidBy: data.marginPaidBy,
              contract: data.contract,
              timesheet: data.timesheet as any,
            }}
            onDownload={() => {
              toast.info("Download functionality coming soon");
            }}
            onPrint={() => {
              window.print();
            }}
          />
        </TabsContent>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                From (Contractor)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{contractorName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{contractorParticipant?.user?.email || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                To (Invoice Recipient)
              </CardTitle>
              <CardDescription>
                Invoice will be sent to: {data.marginPaidBy === "contractor" ? "Contractor" : (data.marginPaidBy === "agency" ? "Agency" : "Client")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Recipient Name</Label>
                  <p className="font-medium">{invoiceRecipient}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="font-medium capitalize">{data.marginPaidBy || "client"}</p>
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
                  <Label className="text-xs text-muted-foreground">Contract Reference</Label>
                  <p className="font-medium">
                    {data.contract?.contractReference || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Client</Label>
                  <p className="font-medium">{clientName}</p>
                </div>
                {agencyName !== "N/A" && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Agency</Label>
                    <p className="font-medium">{agencyName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                  <p className="font-medium">{data.invoiceNumber || `INV-${data.id.slice(0, 8)}`}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Issue Date</Label>
                  <p className="font-medium">
                    {new Date(data.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p className="font-medium">
                    {new Date(data.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isModifyingAmount ? "Original Amount" : "Total Amount"}
                  </Label>
                  <p className="font-medium text-lg text-green-600">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: data.currency,
                    }).format(Number(data.totalAmount || 0))}
                  </p>
                </div>
              </div>

              {data.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm">{data.description}</p>
                </div>
              )}

              {data.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <p className="text-sm text-muted-foreground italic">{data.notes}</p>
                </div>
              )}

              {/* Admin Modify Amount */}
              {canModify && (currentState === "for_approval" || currentState === "under_review") && (
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
                            currency: data.currency,
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

        {/* LINE ITEMS TAB */}
        <TabsContent value="line-items" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Line Items</CardTitle>
              <CardDescription>Detailed breakdown of services and charges</CardDescription>
            </CardHeader>
            <CardContent>
              {data.lineItems && data.lineItems.length > 0 ? (
                <div className="space-y-2">
                  {data.lineItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start py-3 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {Number(item.quantity)} × ${Number(item.unitPrice).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-lg">
                        ${Number(item.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-semibold text-lg">
                      ${Number(data.amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No line items available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CALCULATION TAB */}
        <TabsContent value="calculation" className="space-y-4 mt-6">
          {marginBreakdown && (
            <MarginCalculationDisplay breakdown={marginBreakdown} showDetails={true} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Final Amount
              </CardTitle>
              <CardDescription>
                This is the total amount that will be invoiced to {invoiceRecipient}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: data.currency,
                  }).format(Number(data.totalAmount || 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WORKFLOW ACTIONS */}
      {availableActions.length > 0 && (
        <Card>
          <CardContent className="flex justify-between items-center py-4">
            <Button variant="outline" asChild>
              <Link href="/invoices">Close</Link>
            </Button>
            <WorkflowActionButtons
              actions={availableActions}
              onAction={handleWorkflowAction}
              isLoading={
                reviewMutation.isPending ||
                approveMutation.isPending ||
                rejectMutation.isPending ||
                requestChangesMutation.isPending ||
                sendMutation.isPending
              }
              className="flex gap-2"
            />
          </CardContent>
        </Card>
      )}

      {availableActions.length === 0 && (
        <Card>
          <CardContent className="flex justify-end py-4">
            <Button variant="outline" asChild>
              <Link href="/invoices">Close</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
