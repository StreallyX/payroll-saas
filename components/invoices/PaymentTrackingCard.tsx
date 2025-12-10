"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface PaymentStatus {
  state: string; // SENT, MARKED_PAID_BY_AGENCY, PAYMENT_RECEIVED, etc.
  agencyMarkedPaidAt?: Date | string;
  paymentReceivedAt?: Date | string;
  paymentReceivedBy?: { name: string; email: string };
  agencyMarkedPaidBy?: { name: string; email: string };
}

interface PaymentTrackingCardProps {
  paymentStatus: PaymentStatus;
  paymentModel: string; // GROSS, PAYROLL, PAYROLL_WE_PAY, SPLIT
  userRole: string; // agency, admin, etc.
  onMarkAsPaidByAgency?: () => Promise<void>;
  onMarkPaymentReceived?: () => Promise<void>;
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
  onMarkAsPaidByAgency,
  onMarkPaymentReceived,
  isLoading = false,
}: PaymentTrackingCardProps) {
  const canMarkPaidByAgency = 
    userRole === "agency" && 
    paymentStatus.state === "SENT" && 
    onMarkAsPaidByAgency;

  const canMarkPaymentReceived = 
    userRole === "admin" && 
    paymentStatus.state === "MARKED_PAID_BY_AGENCY" && 
    onMarkPaymentReceived;

  const getPaymentModelDescription = (model: string) => {
    switch (model) {
      case "GROSS":
        return "Contractor receives full amount and handles their own taxes";
      case "PAYROLL":
        return "Agency handles payroll and taxes";
      case "PAYROLL_WE_PAY":
        return "We handle payroll processing";
      case "SPLIT":
        return "Payment distributed to multiple parties";
      default:
        return model;
    }
  };

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
            {getPaymentModelDescription(paymentModel)}
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
                <p className="text-sm font-medium">Payment Received</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(paymentStatus.paymentReceivedAt), "PPpp")}
                </p>
                {paymentStatus.paymentReceivedBy && (
                  <p className="text-xs text-muted-foreground">
                    By: {paymentStatus.paymentReceivedBy.name}
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
            <div className="space-y-2">
              {canMarkPaidByAgency && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={onMarkAsPaidByAgency}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Paid by Agency
                    </>
                  )}
                </Button>
              )}

              {canMarkPaymentReceived && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={onMarkPaymentReceived}
                  disabled={isLoading}
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
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
