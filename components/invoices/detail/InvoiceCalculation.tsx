"use client";

import { Separator } from "@/components/ui/separator";
import { DollarSign } from "lucide-react";

interface MarginBreakdown {
  baseAmount: number;
  marginAmount: number;
  marginPercentage: number;
  marginPaidBy: string;
  totalWithMargin: number;
}

interface InvoiceCalculationProps {
  baseAmount: number;
  marginBreakdown?: MarginBreakdown | null;
  totalAmount: number;
  formatCurrency: (amount: number) => string;
}

export function InvoiceCalculation({
  baseAmount,
  marginBreakdown,
  totalAmount,
  formatCurrency,
}: InvoiceCalculationProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="w-96 space-y-3">
          {/* Base Amount (Subtotal) */}
          <div className="flex justify-between items-center px-4 py-2">
            <span className="text-sm">Subtotal (Base Amount):</span>
            <span className="font-medium">{formatCurrency(baseAmount)}</span>
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
            <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
