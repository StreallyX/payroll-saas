"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, DollarSign, Building2 } from "lucide-react";

interface InvoiceStatusDisplayProps {
  currentState: string;
  paymentReceivedAt?: Date | string | null;
  amountReceived?: number | null;
  agencyMarkedPaidAt?: Date | string | null;
  amountPaidByAgency?: number | null;
  formatCurrency: (amount: number) => string;
}

export function InvoiceStatusDisplay({
  currentState,
  paymentReceivedAt,
  amountReceived,
  agencyMarkedPaidAt,
  amountPaidByAgency,
  formatCurrency,
}: InvoiceStatusDisplayProps) {
  const shouldShow = [
    "approved",
    "sent",
    "marked_paid_by_agency",
    "payment_received",
  ].includes(currentState);

  if (!shouldShow) return null;

  return (
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
                    {paymentReceivedAt && 
                      `Received on ${new Date(paymentReceivedAt).toLocaleDateString()}`
                    }
                    {amountReceived && 
                      ` - ${formatCurrency(Number(amountReceived))}`
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
                    {agencyMarkedPaidAt && 
                      `Paid on ${new Date(agencyMarkedPaidAt).toLocaleDateString()}`
                    }
                    {amountPaidByAgency && 
                      ` - ${formatCurrency(Number(amountPaidByAgency))}`
                    }
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
