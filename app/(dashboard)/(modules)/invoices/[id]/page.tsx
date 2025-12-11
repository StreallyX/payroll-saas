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
import { useSession } from "next-auth/react";
import {
  WorkflowStatusBadge,
  WorkflowActionButtons,
  MarginCalculationDisplay,
} from "@/components/workflow";
import { MarginConfirmationCard } from "@/components/invoices/MarginConfirmationCard";
import { PaymentTrackingCard } from "@/components/invoices/PaymentTrackingCard";
import { TimesheetFileViewer } from "@/components/timesheets/TimesheetFileViewer";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { hasPermission } = usePermissions();
  const { data: session } = useSession();
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

  // New payment workflow mutations
  const confirmMarginMutation = api.invoice.confirmMargin.useMutation({
    onSuccess: () => {
      toast.success("Margin confirmed successfully!");
      utils.invoice.getById.invalidate({ id: invoiceId });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markAsPaidByAgencyMutation = api.invoice.markAsPaidByAgency.useMutation({
    onSuccess: () => {
      toast.success("Invoice marked as paid by agency");
      utils.invoice.getById.invalidate({ id: invoiceId });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const markPaymentReceivedMutation = api.invoice.markPaymentReceived.useMutation({
    onSuccess: () => {
      toast.success("Payment received confirmed!");
      utils.invoice.getById.invalidate({ id: invoiceId });
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
      currency: data.currencyRelation?.code || "USD",
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

  // New payment workflow handlers
  const handleConfirmMargin = async (overrideAmount?: number, notes?: string) => {
    const marginId = (data as any).margin?.id;
    await confirmMarginMutation.mutateAsync({
      invoiceId,
      marginId,
      overrideMarginAmount: overrideAmount,
      notes,
    });
  };

  const handleMarkAsPaidByAgency = async () => {
    await markAsPaidByAgencyMutation.mutateAsync({ 
      invoiceId,
      paymentMethod: "bank_transfer",
    });
  };

  const handleMarkPaymentReceived = async () => {
    await markPaymentReceivedMutation.mutateAsync({ invoiceId });
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

      {/* Margin Confirmation Section - Only show when state is PENDING_MARGIN_CONFIRMATION */}
      {currentState === "PENDING_MARGIN_CONFIRMATION" && (data as any).margin && (
        <MarginConfirmationCard
          marginDetails={{
            marginType: (data as any).margin.marginType,
            marginPercentage: Number((data as any).margin.marginPercentage || 0),
            marginAmount: Number((data as any).margin.marginAmount || 0),
            calculatedMargin: Number((data as any).margin.calculatedMargin || 0),
            isOverridden: (data as any).margin.isOverridden || false,
            overriddenBy: (data as any).margin.overriddenBy?.name,
            notes: (data as any).margin.notes,
            contractId: data.contractId || undefined,
          }}
          baseAmount={Number((data as any).baseAmount || data.amount || 0)}
          currency={data.currency || "USD"}
          onConfirmMargin={handleConfirmMargin}
          isLoading={confirmMarginMutation.isPending}
        />
      )}

      {/* Payment Tracking Section - Show when invoice has been sent */}
      {(currentState === "SENT" || currentState === "MARKED_PAID_BY_AGENCY" || currentState === "PAYMENT_RECEIVED") && (
        <PaymentTrackingCard
          paymentStatus={{
            state: currentState,
            agencyMarkedPaidAt: (data as any).agencyMarkedPaidAt,
            paymentReceivedAt: (data as any).paymentReceivedAt,
            paymentReceivedBy: (data as any).paymentReceivedBy,
            agencyMarkedPaidBy: (data as any).agencyMarkedPaidBy,
          }}
          paymentModel={(data as any).paymentModel || "GROSS"}
          userRole={session?.user?.roleName || ""}
          onMarkAsPaidByAgency={handleMarkAsPaidByAgency}
          onMarkPaymentReceived={handleMarkPaymentReceived}
          isLoading={markAsPaidByAgencyMutation.isPending || markPaymentReceivedMutation.isPending}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="line-items">Line Items</TabsTrigger>
          <TabsTrigger value="calculation">Calculation & Margin</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="space-y-4 mt-6">
          {/* Sender Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Sender
              </CardTitle>
              <CardDescription>
                Person or entity sending this invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{(data as any).sender?.name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{(data as any).sender?.email || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiver Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Receiver (Invoice Recipient)
              </CardTitle>
              <CardDescription>
                Person or entity receiving this invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{(data as any).receiver?.name || invoiceRecipient}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{(data as any).receiver?.email || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pay Invoice Section - Only visible to receiver */}
          {data.receiverId === session?.user?.id && currentState !== "paid" && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <DollarSign className="h-4 w-4" />
                  Payment Required
                </CardTitle>
                <CardDescription>
                  You are responsible for paying this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount to Pay</p>
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: data.currencyRelation?.code || "USD",
                      }).format(Number(data.totalAmount || 0))}
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // TODO: Implement payment workflow
                      toast.info("Payment workflow will be implemented here");
                    }}
                  >
                    Pay Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Information */}
          {(clientParticipant?.company || agencyParticipant?.company) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Business details for this contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {clientParticipant?.company && (
                  <div className="pb-3 border-b last:border-0">
                    <Label className="text-xs text-muted-foreground font-semibold">Client Company</Label>
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p className="font-medium">{clientParticipant.company.name}</p>
                      </div>
                      {clientParticipant.company.contactEmail && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Contact Email</Label>
                          <p className="text-sm">{clientParticipant.company.contactEmail}</p>
                        </div>
                      )}
                      {clientParticipant.company.contactPhone && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Contact Phone</Label>
                          <p className="text-sm">{clientParticipant.company.contactPhone}</p>
                        </div>
                      )}
                      {(clientParticipant.company.address1 || clientParticipant.company.city) && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Address</Label>
                          <p className="text-sm">
                            {[
                              clientParticipant.company.address1,
                              clientParticipant.company.address2,
                              clientParticipant.company.city,
                              clientParticipant.company.state,
                              clientParticipant.company.postCode,
                            ].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {agencyParticipant?.company && (
                  <div className="pt-3">
                    <Label className="text-xs text-muted-foreground font-semibold">Agency Company</Label>
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p className="font-medium">{agencyParticipant.company.name}</p>
                      </div>
                      {agencyParticipant.company.contactEmail && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Contact Email</Label>
                          <p className="text-sm">{agencyParticipant.company.contactEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bank Account Details */}
          {data.contract?.bank && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Bank account information for payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {data.contract.bank.name && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-xs text-muted-foreground">Bank Name</Label>
                        <p className="font-medium">{data.contract.bank.name}</p>
                      </div>
                    </div>
                  )}
                  {data.contract.bank.accountNumber && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Account Number</Label>
                        <p className="font-mono text-sm">{data.contract.bank.accountNumber}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const accountNumber = data.contract?.bank?.accountNumber;
                          if (accountNumber) {
                            navigator.clipboard.writeText(accountNumber);
                            toast.success("Account number copied to clipboard");
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  )}
                  {data.contract.bank.iban && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">IBAN</Label>
                        <p className="font-mono text-sm">{data.contract.bank.iban}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const iban = data.contract?.bank?.iban;
                          if (iban) {
                            navigator.clipboard.writeText(iban);
                            toast.success("IBAN copied to clipboard");
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  )}
                  {data.contract.bank.swiftCode && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">SWIFT/BIC Code</Label>
                        <p className="font-mono text-sm">{data.contract.bank.swiftCode}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const swiftCode = data.contract?.bank?.swiftCode;
                          if (swiftCode) {
                            navigator.clipboard.writeText(swiftCode);
                            toast.success("SWIFT code copied to clipboard");
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  )}
                  {data.contract.bank.address && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Bank Address</Label>
                      <p className="text-sm mt-1">{data.contract.bank.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                      currency: data.currencyRelation?.code || "USD",
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
                            currency: data.currencyRelation?.code || "USD",
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
                    currency: data.currencyRelation?.code || "USD",
                  }).format(Number(data.totalAmount || 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attached Documents</CardTitle>
              <CardDescription>
                Files and receipts attached to this invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Display documents from invoice */}
              {(data as any).documents && (data as any).documents.length > 0 ? (
                <div className="space-y-3">
                  {(data as any).documents.map((doc: any, index: number) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">
                            {doc.fileName || `Document ${index + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.fileType} • {(doc.fileSize / 1024).toFixed(1)} KB
                          </p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No documents attached</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    No documents have been uploaded for this invoice
                  </p>
                </div>
              )}
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
