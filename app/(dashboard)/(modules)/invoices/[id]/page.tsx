"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useMemo } from "react";
import { Loader2, FileText, DollarSign, AlertCircle, User, Building2, LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useSession } from "next-auth/react";
import { MarginCalculationDisplay } from "@/components/workflow";
import { MarginConfirmationCard } from "@/components/invoices/MarginConfirmationCard";
import { PaymentTrackingCard } from "@/components/invoices/PaymentTrackingCard";
import Link from "next/link";
import {
  InvoiceHeader,
  InvoiceStatusDisplay,
  InvoiceCalculation,
  InvoiceLineItems,
  InvoiceExpenses,
  InvoiceDocuments,
  InvoiceActions,
  InvoiceWorkflowActions,
  InvoiceMetadata,
} from "@/components/invoices/detail";
import { PaymentModel } from "@/lib/constants/payment-models";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { hasPermission } = usePermissions();
  const { data: session } = useSession();
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

  // Payment workflow mutations
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
    
    const workTotal = Number(data.baseAmount || data.amount || 0);
    
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

  // Payment workflow handlers
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

    if (contract.invoiceDueTerm) {
      const term = contract.invoiceDueTerm;
      
      if (term === "upon_receipt") {
        return "Upon receipt";
      }
      
      const match = term.match(/^(\d+)_days$/);
      if (match) {
        return `${match[1]} days`;
      }
      
      return term.replace(/_/g, " ");
    }

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

  const canViewContract = hasPermission("contract.read.own") || hasPermission("contract.read.global");
  const currentState = data.workflowState || data.status;

  // Determine available actions based on state and permissions
  const availableActions = [];

  if (currentState === "submitted" && hasPermission("invoice.review.global")) {
    availableActions.push({
      action: "review",
      label: "Mark as Under Review",
      variant: "outline" as const,
    });
  }

  if ((currentState === "submitted" || currentState === "under_review") && hasPermission("invoice.approve.global")) {
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

  if ((currentState === "submitted" || currentState === "under_review") && hasPermission("invoice.reject.global")) {
    availableActions.push({
      action: "reject",
      label: "Reject Invoice",
      variant: "destructive" as const,
      requiresReason: true,
    });
  }

  if (currentState === "approved" && hasPermission("invoice.send.global")) {
    availableActions.push({
      action: "send",
      label: "Send Invoice",
      variant: "default" as const,
    });
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <InvoiceHeader
        invoiceNumber={data.invoiceNumber}
        invoiceId={invoiceId}
        workflowState={currentState}
        showFullInvoice={showFullInvoice}
        onToggleView={() => setShowFullInvoice(!showFullInvoice)}
      />

      {/* Invoice Status Display */}
      <InvoiceStatusDisplay
        currentState={currentState}
        paymentReceivedAt={(data as any).paymentReceivedAt}
        amountReceived={(data as any).amountReceived}
        agencyMarkedPaidAt={(data as any).agencyMarkedPaidAt}
        amountPaidByAgency={(data as any).amountPaidByAgency}
        formatCurrency={formatCurrency}
      />

      {/* Margin Confirmation Section */}
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
          expenses={data?.timesheet?.expenses?.map((exp: any) => ({
            id: exp.id,
            title: exp.title,
            amount: Number(exp.amount || 0),
            category: exp.category,
            description: exp.description,
          })) || []} // 🔥 FIX: Include expenses in margin confirmation
          onConfirmMargin={handleConfirmMargin}
          isLoading={confirmMarginMutation.isPending}
        />
      )}

      {/* Payment Tracking Section */}
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
          paymentModel={data.contract?.salaryType || PaymentModel.gross}
          userRole={session?.user?.roleName || ""}
          invoiceAmount={Number(data.totalAmount || 0)}
          currency={data.currencyRelation?.code || "USD"}
          onMarkAsPaidByAgency={handleMarkAsPaidByAgency}
          onMarkPaymentReceived={handleMarkPaymentReceived}
          isLoading={markAsPaidByAgencyMutation.isPending || markPaymentReceivedMutation.isPending}
        />
      )}

      {/* Post-Payment Workflow Actions */}
      <InvoiceWorkflowActions
        currentState={currentState}
        salaryType={data.contract?.salaryType}
        invoiceId={invoiceId}
        totalAmount={Number(data.totalAmount || 0)}
        currency={data.currencyRelation?.code || "USD"}
        contractorName={contractorName}
        hasPermission={hasPermission("invoice.pay.global")}
        childInvoices={data.childInvoices}
        onSuccess={() => utils.invoice.getById.invalidate({ id: invoiceId })}
      />

      {/* PROFESSIONAL INVOICE LAYOUT */}
      {showFullInvoice ? (
        <Card className="border-2">
          <CardContent className="p-8 space-y-8">
            {/* Invoice Metadata - From/To/Payment Destination */}
            <InvoiceMetadata
              sender={data.sender}
              receiver={data.receiver}
              invoiceRecipient={invoiceRecipient}
              tenantCompany={tenantCompany}
              contractReference={data.contract?.contractReference}
              contractId={data.contractId}
              canViewContract={canViewContract}
              invoiceNumber={data.invoiceNumber}
              invoiceId={invoiceId}
              issueDate={data.issueDate}
              paymentTerms={formatPaymentTerms()}
              contractorCompany={contractorParticipant?.company}
              agencyCompany={agencyParticipant?.company}
              clientCompany={clientParticipant?.company}
              copyToClipboard={copyToClipboard}
            />

            {/* LINE ITEMS TABLE */}
            <InvoiceLineItems
              lineItems={data.lineItems || []}
              workTotal={lineItemsTotals.workTotal}
              formatCurrency={formatCurrency}
            />

            {/* EXPENSES SECTION */}
            <InvoiceExpenses
              expenses={data.timesheet?.expenses || []}
              totalExpenses={lineItemsTotals.expenses}
              formatCurrency={formatCurrency}
            />

            <Separator className="my-6" />

            {/* MARGINS & TOTALS */}
            <InvoiceCalculation
              baseAmount={Number(data.baseAmount || data.amount || 0)}
              marginBreakdown={marginBreakdown}
              totalAmount={Number(data.totalAmount || 0)}
              formatCurrency={formatCurrency}
            />

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
        /* TABS VIEW */
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
                    <p className="font-medium">{data.sender?.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{data.sender?.email || "N/A"}</p>
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
                    <p className="font-medium">{data.receiver?.name || invoiceRecipient}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{data.receiver?.email || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Reference */}
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
              <MarginCalculationDisplay 
                breakdown={marginBreakdown} 
                expenses={data?.timesheet?.expenses?.map((exp: any) => ({
                  ...exp,
                  amount: Number(exp.amount),
                })) || []}
                showDetails={true} 
              />
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
            <InvoiceDocuments
              documents={(data as any).documents || []}
              invoiceId={invoiceId}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* WORKFLOW ACTIONS */}
      <InvoiceActions
        actions={availableActions}
        onAction={handleWorkflowAction}
        isLoading={
          reviewMutation.isPending ||
          approveMutation.isPending ||
          rejectMutation.isPending ||
          requestChangesMutation.isPending ||
          sendMutation.isPending
        }
      />
    </div>
  );
}
