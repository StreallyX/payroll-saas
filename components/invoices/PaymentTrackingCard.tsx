"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { PaymentModel, getPaymentModelLabel, getPaymentModelDescription } from "@/lib/constants/payment-models";

interface PaymentStatus {
  state: string; // SENT, MARKED_PAID_BY_AGENCY, PAYMENT_RECEIVED, etc.
  agencyMarkedPaidAt?: Date | string;
  paymentReceivedAt?: Date | string;
  paymentReceivedBy?: { name: string; email: string };
  agencyMarkedPaidBy?: { name: string; email: string };
  amountPaidByAgency?: number | string;
  amountReceived?: number | string;
}

interface PaymentTrackingCardProps {
  paymentStatus: PaymentStatus;
  paymentModel: string | PaymentModel; // Payment model enum value
  userRole: string; // agency, admin, etc.
  invoiceAmount?: number; // Total invoice amount for validation
  currency?: string; // Currency code (e.g., USD, EUR)
  onMarkAsPaidByAgency?: (amountPaid: number) => Promise<void>;
  onMarkPaymentReceived?: (amountReceived: number) => Promise<void>;
  isLoading?: boolean;
}

/**
 * PaymentTrackingCard
 * 
 * Displays payment workflow status and provides buttons for payment actions
 * based on the current state and user role.
 */
export function PaymentTrackingCard({
  paymentStatus,
  paymentModel,
  userRole,
  invoiceAmount = 0,
  currency = "USD",
  onMarkAsPaidByAgency,
  onMarkPaymentReceived,
  isLoading = false,
}: PaymentTrackingCardProps) {
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");
  const [amountReceived, setAmountReceived] = useState<string>(
    paymentStatus.amountPaidByAgency ? paymentStatus.amountPaidByAgency.toString() : ""
  );
  const [amountReceivedError, setAmountReceivedError] = useState<string>("");

  const canMarkPaidByAgency = 
    userRole === "AGENCY" && 
    (paymentStatus.state === "sent" || paymentStatus.state === "overdue") && 
    onMarkAsPaidByAgency;

  const canMarkPaymentReceived = 
    userRole === "ADMIN" && 
    paymentStatus.state === "marked_paid_by_agency" && 
    onMarkPaymentReceived;

  const handleMarkAsPaid = async () => {
    // Validate amount
    const amount = parseFloat(amountPaid);
    
    if (!amountPaid || isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a valid amount greater than 0");
      return;
    }

    if (invoiceAmount > 0 && amount > invoiceAmount * 1.1) {
      setAmountError(`Amount cannot exceed ${formatCurrency(invoiceAmount * 1.1)}`);
      return;
    }

    setAmountError("");
    
    if (onMarkAsPaidByAgency) {
      await onMarkAsPaidByAgency(amount);
      setAmountPaid(""); // Reset after successful submission
    }
  };

  const handleConfirmPaymentReceived = async () => {
    // Validate amount
    const amount = parseFloat(amountReceived);
    
    if (!amountReceived || isNaN(amount) || amount <= 0) {
      setAmountReceivedError("Please enter a valid amount greater than 0");
      return;
    }

    if (invoiceAmount > 0 && amount > invoiceAmount * 1.2) {
      setAmountReceivedError(`Amount seems too high. Invoice total: ${formatCurrency(invoiceAmount)}`);
      return;
    }

    setAmountReceivedError("");
    
    if (onMarkPaymentReceived) {
      await onMarkPaymentReceived(amount);
      setAmountReceived(""); // Reset after successful submission
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  // Use the centralized utility function for payment model descriptions
  const paymentModelDesc = getPaymentModelDescription(paymentModel as PaymentModel);

  const getStateColor = (state: string) => {
    switch (state) {
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "MARKED_PAID_BY_AGENCY":
        return "bg-yellow-100 text-yellow-800";
      case "PAYMENT_RECEIVED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-purple-600" />
          Payment Tracking
        </CardTitle>
        <CardDescription>
          Track the payment status through the complete workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment Status</span>
            <Badge className={getStateColor(paymentStatus.state)}>
              {paymentStatus.state.replace(/_/g, " ")}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment Model</span>
            <Badge variant="outline" className="uppercase">
              {paymentModel}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground italic">
            {paymentModelDesc}
          </p>
        </div>

        <Separator />

        {/* Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Payment Timeline</h4>

          {/* Agency Marked Paid */}
          {paymentStatus.agencyMarkedPaidAt && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white border">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Marked as Paid by Agency</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(paymentStatus.agencyMarkedPaidAt), "PPpp")}
                </p>
                {paymentStatus.amountPaidByAgency && (
                  <p className="text-xs font-semibold text-green-700">
                    Amount Paid: {formatCurrency(Number(paymentStatus.amountPaidByAgency))}
                  </p>
                )}
                {paymentStatus.agencyMarkedPaidBy && (
                  <p className="text-xs text-muted-foreground">
                    By: {paymentStatus.agencyMarkedPaidBy.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Received */}
          {paymentStatus.paymentReceivedAt && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white border">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Payment Received & Confirmed</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(paymentStatus.paymentReceivedAt), "PPpp")}
                </p>
                {paymentStatus.amountReceived && (
                  <p className="text-xs font-semibold text-green-700">
                    Amount Received: {formatCurrency(Number(paymentStatus.amountReceived))}
                  </p>
                )}
                {paymentStatus.amountPaidByAgency && paymentStatus.amountReceived && 
                 Number(paymentStatus.amountPaidByAgency) !== Number(paymentStatus.amountReceived) && (
                  <p className="text-xs text-orange-600">
                    Difference from amount paid: {formatCurrency(
                      Number(paymentStatus.amountReceived) - Number(paymentStatus.amountPaidByAgency)
                    )}
                  </p>
                )}
                {paymentStatus.paymentReceivedBy && (
                  <p className="text-xs text-muted-foreground">
                    Confirmed by: {paymentStatus.paymentReceivedBy.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending Action */}
          {!paymentStatus.agencyMarkedPaidAt && paymentStatus.state === "SENT" && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex-shrink-0 mt-0.5">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Awaiting Agency Payment</p>
                <p className="text-xs text-muted-foreground">
                  Waiting for agency to mark invoice as paid
                </p>
              </div>
            </div>
          )}

          {!paymentStatus.paymentReceivedAt && paymentStatus.state === "MARKED_PAID_BY_AGENCY" && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex-shrink-0 mt-0.5">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Awaiting Payment Confirmation</p>
                <p className="text-xs text-muted-foreground">
                  Waiting for admin to confirm payment receipt
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(canMarkPaidByAgency || canMarkPaymentReceived) && (
          <>
            <Separator />
            <div className="space-y-3">
              {canMarkPaidByAgency && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-2">
                    <Label htmlFor="amount-paid" className="text-sm font-medium">
                      Amount Paid {currency && `(${currency})`}
                    </Label>
                    <Input
                      id="amount-paid"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={invoiceAmount ? `Enter amount (Invoice: ${formatCurrency(invoiceAmount)})` : "Enter amount paid"}
                      value={amountPaid}
                      onChange={(e) => {
                        setAmountPaid(e.target.value);
                        setAmountError("");
                      }}
                      disabled={isLoading}
                      className={amountError ? "border-red-500" : ""}
                    />
                    {amountError && (
                      <p className="text-xs text-red-600">{amountError}</p>
                    )}
                    {invoiceAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Invoice Total: {formatCurrency(invoiceAmount)}
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleMarkAsPaid}
                    disabled={isLoading || !amountPaid}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </>
                    )}
                  </Button>
                </div>
              )}

              {canMarkPaymentReceived && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800">
                    Confirm Payment Receipt
                  </h4>
                  
                  {paymentStatus.amountPaidByAgency && (
                    <div className="text-xs space-y-1 p-2 bg-white rounded border">
                      <p className="text-muted-foreground">
                        Amount Paid by Agency: <span className="font-semibold text-foreground">
                          {formatCurrency(Number(paymentStatus.amountPaidByAgency))}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs italic">
                        Confirm the actual amount received below
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount-received" className="text-sm font-medium">
                      Amount Received {currency && `(${currency})`}
                    </Label>
                    <Input
                      id="amount-received"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter actual amount received"
                      value={amountReceived}
                      onChange={(e) => {
                        setAmountReceived(e.target.value);
                        setAmountReceivedError("");
                      }}
                      disabled={isLoading}
                      className={amountReceivedError ? "border-red-500" : ""}
                    />
                    {amountReceivedError && (
                      <p className="text-xs text-red-600">{amountReceivedError}</p>
                    )}
                    {invoiceAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Invoice Total: {formatCurrency(invoiceAmount)}
                      </p>
                    )}
                    {paymentStatus.amountPaidByAgency && amountReceived && 
                     Number(amountReceived) !== Number(paymentStatus.amountPaidByAgency) && (
                      <p className="text-xs text-orange-600 font-medium">
                        ⚠️ Amount differs from agency payment: {formatCurrency(
                          Number(amountReceived) - Number(paymentStatus.amountPaidByAgency)
                        )}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmPaymentReceived}
                    disabled={isLoading || !amountReceived}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm Payment Received
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
