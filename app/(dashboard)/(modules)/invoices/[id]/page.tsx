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
import { Loader2, FileText, Download, AlertCircle, User, Building2, DollarSign, ArrowLeft, Link as LinkIcon, Copy, CheckCircle } from "lucide-react";
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
  const [showFullInvoice, setShowFullInvoice] = useState(true);

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
      utils.invoice.getById.invalidate({ id: invoiceId });
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
      toast.success("Margin confirmed successfully! Invoice status updated.");
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
      marginType: "percentage" as const,
      totalWithMargin,
      currency: data.currencyRelation?.code || "USD",
      marginPaidBy: (data.marginPaidBy || "client") as "client" | "agency" | "contractor",
      paymentMode: "gross" as const,
    };
  }, [data]);

  // Get contract participants
  const contractorParticipant = data?.contract?.participants?.find((p: any) => p.role === "contractor");
  const clientParticipant = data?.contract?.participants?.find((p: any) => p.role === "client");
  const agencyParticipant = data?.contract?.participants?.find((p: any) => p.role === "agency");
  const tenantParticipant = data?.contract?.participants?.find((p: any) => p.role === "tenant");

  const contractorName = contractorParticipant?.user?.name || contractorParticipant?.company?.name || "N/A";
  const clientName = clientParticipant?.user?.name || clientParticipant?.company?.name || "N/A";
  const agencyName = agencyParticipant?.user?.name || agencyParticipant?.company?.name || "N/A";
  const tenantCompany = tenantParticipant?.company;

  // Determine invoice recipient based on margin paid by
  const invoiceRecipient = data?.marginPaidBy === "contractor" 
    ? contractorName 
    : (data?.marginPaidBy === "agency" ? agencyName : clientName);

  // Calculate totals from line items and expenses
  const lineItemsTotals = useMemo(() => {
    if (!data) return { subtotal: 0, expenses: 0, workTotal: 0 };
    
    // 🔥 FIX: Use baseAmount for work total (already calculated on backend)
    const workTotal = Number(data.baseAmount || data.amount || 0);
    
    // 🔥 FIX: Get expenses from timesheet.expenses (Expense model)
    let expenses = 0;
    if (data.timesheet?.expenses) {
      expenses = data.timesheet.expenses.reduce((sum: number, expense: any) => {
        return sum + Number(expense.amount || 0);
      }, 0);
    }
    
    return {
      subtotal: workTotal + expenses,
      expenses,
      workTotal,
    };
  }, [data]);

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

  const handleMarkAsPaidByAgency = async (amountPaid: number) => {
    await markAsPaidByAgencyMutation.mutateAsync({ 
      invoiceId,
      amountPaid,
      paymentMethod: "bank_transfer",
    });
  };

  const handleMarkPaymentReceived = async (amountReceived: number) => {
    await markPaymentReceivedMutation.mutateAsync({ 
      invoiceId,
      amountReceived,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data?.currencyRelation?.code || "USD",
    }).format(amount);
  };

  // Format payment terms based on contract.invoiceDueTerm and contract.invoiceDueDays
  const formatPaymentTerms = () => {
    const contract = data?.contract;
    
    if (!contract) return "Not specified";

    // Priority 1: Check invoiceDueTerm (new field)
    if (contract.invoiceDueTerm) {
      const term = contract.invoiceDueTerm;
      
      if (term === "upon_receipt") {
        return "Upon receipt";
      }
      
      // Extract number from terms like "7_days", "30_days", etc.
      const match = term.match(/^(\d+)_days$/);
      if (match) {
        return `${match[1]} days`;
      }
      
      // Fallback: display the term as-is
      return term.replace(/_/g, " ");
    }

    // Priority 2: Fallback to invoiceDueDays (legacy field)
    if (contract.invoiceDueDays !== null && contract.invoiceDueDays !== undefined) {
      return `${contract.invoiceDueDays} days`;
    }

    return "Not specified";
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
  const canViewContract = hasPermission("contract.read.own") || hasPermission("contract.read.global");

  // Determine available actions based on state and permissions
  const availableActions = [];
  const currentState = data.workflowState || data.status;

  if (currentState === "submitted" && canReview) {
    availableActions.push({
      action: "review",
      label: "Mark as Under Review",
      variant: "outline" as const,
    });
  }

  if ((currentState === "submitted" || currentState === "under_review") && canApprove) {
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

  if ((currentState === "submitted" || currentState === "under_review") && canReject) {
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
              Invoice {data.invoiceNumber || `#${data.id.slice(0, 8)}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Professional invoice with complete details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WorkflowStatusBadge status={currentState} />
          <Button variant="outline" size="sm" onClick={() => setShowFullInvoice(!showFullInvoice)}>
            {showFullInvoice ? "Show Tabs View" : "Show Invoice View"}
          </Button>
        </div>
      </div>

      {/* Invoice Status Display - Show validation and payment status */}
      {(currentState === "approved" || currentState === "sent" || currentState === "marked_paid_by_agency" || currentState === "payment_received") && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              {/* Validation Status */}
              <div className="flex items-center gap-3 flex-1">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Invoice Validated</h3>
                  <p className="text-sm text-green-700">
                    Approved and ready for payment
                  </p>
                </div>
              </div>

              {/* Payment Status */}
              {currentState === "payment_received" && (
                <>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Payment Received</h3>
                      <p className="text-sm text-green-700">
                        {(data as any).paymentReceivedAt && 
                          `Received on ${new Date((data as any).paymentReceivedAt).toLocaleDateString()}`
                        }
                        {(data as any).amountReceived && 
                          ` - ${formatCurrency(Number((data as any).amountReceived))}`
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Agency Payment Status */}
              {(currentState === "marked_paid_by_agency" || currentState === "payment_received") && currentState !== "payment_received" && (
                <>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Paid by Agency</h3>
                      <p className="text-sm text-green-700">
                        {(data as any).agencyMarkedPaidAt && 
                          `Paid on ${new Date((data as any).agencyMarkedPaidAt).toLocaleDateString()}`
                        }
                        {(data as any).amountPaidByAgency && 
                          ` - ${formatCurrency(Number((data as any).amountPaidByAgency))}`
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Margin Confirmation Section - Only show when state is PENDING_MARGIN_CONFIRMATION */}
      {currentState === "pending_margin_confirmation" && (data as any).margin && (
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
          currency={data.contract?.currency?.code || "USD"}
          onConfirmMargin={handleConfirmMargin}
          isLoading={confirmMarginMutation.isPending}
        />
      )}

      {/* Payment Tracking Section - Show when invoice has been sent */}
      {(currentState === "sent" || currentState === "overdue" || currentState === "marked_paid_by_agency" || currentState === "payment_received") && (
        <PaymentTrackingCard
          paymentStatus={{
            state: currentState,
            agencyMarkedPaidAt: (data as any).agencyMarkedPaidAt,
            paymentReceivedAt: (data as any).paymentReceivedAt,
            paymentReceivedBy: (data as any).paymentReceivedByUser,
            agencyMarkedPaidBy: (data as any).agencyMarkedPaidByUser,
            amountPaidByAgency: (data as any).amountPaidByAgency,
            amountReceived: (data as any).amountReceived,
          }}
          paymentModel={(data as any).paymentModel || "GROSS"}
          userRole={session?.user?.roleName || ""}
          invoiceAmount={Number(data.totalAmount || 0)}
          currency={data.currencyRelation?.code || "USD"}
          onMarkAsPaidByAgency={handleMarkAsPaidByAgency}
          onMarkPaymentReceived={handleMarkPaymentReceived}
          isLoading={markAsPaidByAgencyMutation.isPending || markPaymentReceivedMutation.isPending}
        />
      )}

      {/* PROFESSIONAL INVOICE LAYOUT */}
      {showFullInvoice ? (
        <Card className="border-2">
          <CardContent className="p-8 space-y-8">
            {/* Invoice Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-bold mb-2">INVOICE</h2>
                <p className="text-lg text-muted-foreground">
                  {data.invoiceNumber || `INV-${data.id.slice(0, 8)}`}
                </p>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Issue Date</Label>
                  <p className="font-medium">{new Date(data.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Terms</Label>
                  <p className="font-medium text-blue-600">{formatPaymentTerms()}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* From / To Section */}
            <div className="grid grid-cols-2 gap-8">
              {/* From (Sender) */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">FROM</h3>
                <div className="space-y-1">
                  <p className="font-bold text-lg">{data.sender?.name || "N/A"}</p>
                  {data.sender?.email && <p className="text-sm">{data.sender.email}</p>}
                  {data.sender?.phone && <p className="text-sm">{data.sender.phone}</p>}
                  {contractorParticipant?.company && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>{contractorParticipant.company.name}</p>
                      {contractorParticipant.company.address1 && (
                        <p>{contractorParticipant.company.address1}</p>
                      )}
                      {contractorParticipant.company.city && (
                        <p>
                          {[
                            contractorParticipant.company.city,
                            contractorParticipant.company.state,
                            contractorParticipant.company.postCode,
                          ].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* To (Receiver - Payment Destination) */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">BILL TO</h3>
                <div className="space-y-1">
                  <p className="font-bold text-lg">{data.receiver?.name || invoiceRecipient}</p>
                  {data.receiver?.email && <p className="text-sm">{data.receiver.email}</p>}
                  {data.receiver?.phone && <p className="text-sm">{data.receiver.phone}</p>}
                  {(data.receiver as any)?.role && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Role: {((data.receiver as any).role.displayName || (data.receiver as any).role.name)}
                    </p>
                  )}
                  
                  {/* Receiver's Company Information */}
                  {(data.receiver as any)?.companies && (data.receiver as any).companyUsers.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Company Information</p>
                      {(data.receiver as any).companyUsers.map((userCompany: any) => (
                        <div key={userCompany.company.id} className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{userCompany.company.name}</p>
                          {userCompany.company.contactEmail && (
                            <p className="text-xs">{userCompany.company.contactEmail}</p>
                          )}
                          {userCompany.company.contactPhone && (
                            <p className="text-xs">{userCompany.company.contactPhone}</p>
                          )}
                          {userCompany.company.address1 && (
                            <p className="text-xs mt-1">
                              {[
                                userCompany.company.address1,
                                userCompany.company.address2,
                                userCompany.company.city,
                                userCompany.company.state,
                                userCompany.company.postCode,
                                userCompany.company.country?.name,
                              ].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Fallback to contract participant company info if receiver has no direct company */}
                  {(!(data.receiver as any)?.companies || (data.receiver as any).companyUsers.length === 0) && 
                   (agencyParticipant?.company || clientParticipant?.company) && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {agencyParticipant?.company && (
                        <>
                          <p>{agencyParticipant.company.name}</p>
                          {agencyParticipant.company.contactEmail && (
                            <p>{agencyParticipant.company.contactEmail}</p>
                          )}
                        </>
                      )}
                      {!agencyParticipant?.company && clientParticipant?.company && (
                        <>
                          <p>{clientParticipant.company.name}</p>
                          {clientParticipant.company.address1 && (
                            <p>{clientParticipant.company.address1}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Destination - Tenant Company Information */}
            {tenantCompany && (
              <>
                <Separator className="my-6" />
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-700" />
                    <h3 className="text-lg font-bold text-green-900">PAYMENT DESTINATION</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground font-semibold">Company Name</Label>
                      <p className="font-bold text-lg">{tenantCompany.name}</p>
                    </div>
                    
                    {tenantCompany.contactEmail && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Email</Label>
                          <p className="text-sm">{tenantCompany.contactEmail}</p>
                        </div>
                        {tenantCompany.contactPhone && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Phone</Label>
                            <p className="text-sm">{tenantCompany.contactPhone}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {tenantCompany.address1 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <p className="text-sm">
                          {[
                            tenantCompany.address1,
                            tenantCompany.address2,
                            tenantCompany.city,
                            tenantCompany.state,
                            tenantCompany.postCode,
                            tenantCompany.country?.name,
                          ].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bank Account Details */}
                  <div className="mt-4 pt-4 border-t-2 border-green-300">
                    <h4 className="font-semibold text-sm text-green-900 mb-3">BANK ACCOUNT DETAILS</h4>
                    {tenantCompany?.bank ? (
                      <div className="grid grid-cols-1 gap-3">
                        {tenantCompany.bank.name && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                            <div>
                              <Label className="text-xs text-muted-foreground">Bank Name</Label>
                              <p className="font-medium">{tenantCompany.bank.name}</p>
                            </div>
                          </div>
                        )}
                        {tenantCompany.bank.accountNumber && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Account Number</Label>
                              <p className="font-mono text-sm font-bold">{tenantCompany.bank.accountNumber}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(tenantCompany!.bank!.accountNumber!, "Account number")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {tenantCompany.bank.iban && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">IBAN</Label>
                              <p className="font-mono text-sm font-bold">{tenantCompany.bank.iban}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(tenantCompany!.bank!.iban!, "IBAN")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {tenantCompany.bank.swiftCode && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">SWIFT/BIC Code</Label>
                              <p className="font-mono text-sm font-bold">{tenantCompany.bank.swiftCode}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(tenantCompany!.bank!.swiftCode!, "SWIFT code")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {tenantCompany.bank.address && (
                          <div className="p-3 bg-white rounded-lg border border-green-200">
                            <Label className="text-xs text-muted-foreground">Bank Address</Label>
                            <p className="text-sm mt-1">{tenantCompany.bank.address}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-yellow-800 font-medium">No bank account linked</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator className="my-6" />

            {/* Contract Reference */}
            {data.contract && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Related Contract</Label>
                  <p className="font-medium">{data.contract.contractReference || `Contract #${data.contractId?.slice(0, 8)}`}</p>
                </div>
                {canViewContract && data.contractId && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/contracts/${data.contractId}`}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      View Contract
                    </Link>
                  </Button>
                )}
              </div>
            )}

            <Separator className="my-6" />

            {/* LINE ITEMS TABLE */}
            <div>
              <h3 className="text-lg font-semibold mb-4">SERVICES / LINE ITEMS</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-semibold text-sm">Description</th>
                      <th className="text-right p-3 font-semibold text-sm w-24">Qty</th>
                      <th className="text-right p-3 font-semibold text-sm w-32">Unit Price</th>
                      <th className="text-right p-3 font-semibold text-sm w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.lineItems && data.lineItems.length > 0 ? (
                      data.lineItems.map((item: any, index: number) => (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="p-3 text-sm">{item.description}</td>
                          <td className="p-3 text-sm text-right">{Number(item.quantity)}</td>
                          <td className="p-3 text-sm text-right">{formatCurrency(Number(item.unitPrice))}</td>
                          <td className="p-3 text-sm text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          No line items available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Work Subtotal */}
              {data.lineItems && data.lineItems.length > 0 && (
                <div className="flex justify-end mt-3">
                  <div className="w-64 flex justify-between items-center px-4 py-2 bg-muted/30 rounded">
                    <span className="text-sm font-medium">Work Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(lineItemsTotals.workTotal)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* EXPENSES SECTION */}
            {lineItemsTotals.expenses > 0 && data.timesheet?.expenses && data.timesheet.expenses.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-semibold mb-4">EXPENSES</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-semibold text-sm">Description</th>
                          <th className="text-left p-3 font-semibold text-sm">Category</th>
                          <th className="text-left p-3 font-semibold text-sm">Date</th>
                          <th className="text-right p-3 font-semibold text-sm w-32">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.timesheet.expenses.map((expense: any) => (
                          <tr key={expense.id} className="hover:bg-muted/20">
                            <td className="p-3 text-sm">
                              <div className="font-medium">{expense.title}</div>
                              {expense.description && (
                                <div className="text-xs text-muted-foreground">{expense.description}</div>
                              )}
                            </td>
                            <td className="p-3 text-sm capitalize">{expense.category}</td>
                            <td className="p-3 text-sm">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                            <td className="p-3 text-sm text-right font-medium">{formatCurrency(Number(expense.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Expenses Total */}
                  <div className="flex justify-end mt-3">
                    <div className="w-64 flex justify-between items-center px-4 py-2 bg-muted/30 rounded">
                      <span className="text-sm font-medium">Total Expenses:</span>
                      <span className="font-semibold">{formatCurrency(lineItemsTotals.expenses)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator className="my-6" />

            {/* MARGINS & TOTALS */}
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="w-96 space-y-3">
                  {/* Base Amount (Subtotal) */}
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm">Subtotal (Base Amount):</span>
                    <span className="font-medium">{formatCurrency(Number(data.baseAmount || data.amount || 0))}</span>
                  </div>
                  
                  {/* Margin Calculation */}
                  {marginBreakdown && marginBreakdown.marginAmount > 0 && (
                    <>
                      <Separator />
                      <div className="px-4 py-3 bg-blue-50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">Margin Calculation</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Margin ({marginBreakdown.marginPercentage}%):
                          </span>
                          <span className="font-medium text-blue-700">
                            {formatCurrency(marginBreakdown.marginAmount)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Paid by: {marginBreakdown.marginPaidBy}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                  
                  {/* Total Amount */}
                  <div className="flex justify-between items-center px-4 py-4 bg-green-600 text-white rounded-lg">
                    <span className="text-lg font-bold">TOTAL AMOUNT DUE:</span>
                    <span className="text-2xl font-bold">{formatCurrency(Number(data.totalAmount || 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Notes */}
            {(data.description || data.notes) && (
              <>
                <Separator className="my-6" />
                <div className="space-y-3">
                  {data.description && (
                    <div>
                      <Label className="text-sm font-semibold">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                    </div>
                  )}
                  {data.notes && (
                    <div>
                      <Label className="text-sm font-semibold">Notes</Label>
                      <p className="text-sm text-muted-foreground italic mt-1">{data.notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Payment Instructions */}
            <div className="mt-8 p-4 border-t-2 border-muted">
              <p className="text-sm text-muted-foreground text-center">
                Please make payment to the account details shown above. 
                Payment terms: {formatPaymentTerms()}.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* TABS VIEW (Original) */
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="font-medium">{(data as any).receiver?.name || invoiceRecipient}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{(data as any).receiver?.email || "N/A"}</p>
                  </div>
                  {(data.receiver as any)?.phone && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="font-medium">{(data.receiver as any).phone}</p>
                    </div>
                  )}
                  {(data.receiver as any)?.role && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Role</Label>
                      <p className="font-medium">{((data.receiver as any).role.displayName || (data.receiver as any).role.name)}</p>
                    </div>
                  )}
                </div>

                {/* Receiver's Company Information */}
                {(data.receiver as any)?.companies && (data.receiver as any).companyUsers.length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <Label className="text-sm font-semibold">Company Information</Label>
                    {(data.receiver as any).companyUsers.map((userCompany: any) => (
                      <div key={userCompany.company.id} className="bg-muted/30 p-4 rounded-lg space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Company Name</Label>
                          <p className="font-medium">{userCompany.company.name}</p>
                        </div>
                        {userCompany.company.contactEmail && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Company Email</Label>
                            <p className="text-sm">{userCompany.company.contactEmail}</p>
                          </div>
                        )}
                        {userCompany.company.contactPhone && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Company Phone</Label>
                            <p className="text-sm">{userCompany.company.contactPhone}</p>
                          </div>
                        )}
                        {userCompany.company.address1 && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Address</Label>
                            <p className="text-sm">
                              {[
                                userCompany.company.address1,
                                userCompany.company.address2,
                                userCompany.company.city,
                                userCompany.company.state,
                                userCompany.company.postCode,
                                userCompany.company.country?.name,
                              ].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Reference with Link */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Contract Reference</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {data.contract?.contractReference || "N/A"}
                      </p>
                      {canViewContract && data.contractId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/contracts/${data.contractId}`}>
                            <LinkIcon className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Client</Label>
                    <p className="font-medium">{clientName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Information */}
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
                    <Label className="text-xs text-muted-foreground">Payment Terms</Label>
                    <p className="font-medium text-blue-600">
                      {formatPaymentTerms()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Amount</Label>
                    <p className="font-medium text-lg text-green-600">
                      {formatCurrency(Number(data.totalAmount || 0))}
                    </p>
                  </div>
                </div>

                {data.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm">{data.description}</p>
                  </div>
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
                            {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice))}
                          </p>
                        </div>
                        <p className="font-medium text-lg">
                          {formatCurrency(Number(item.amount))}
                        </p>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(Number(data.amount || 0))}
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
                    {formatCurrency(Number(data.totalAmount || 0))}
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
                {(data as any).documents && (data as any).documents.length > 0 ? (
                  <div className="space-y-3">
                    {(data as any).documents.map((doc: any, index: number) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">
                              {doc.fileName || `Document ${index + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.mimeType || 'Unknown type'} • {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {doc.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href={`/invoices/${invoiceId}/documents/${doc.id}`}>
                                View
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.fileUrl, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No documents attached</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

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
