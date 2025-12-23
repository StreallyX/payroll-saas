"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  amount: number;
  title: string;
  description?: string | null;
  category?: string | null;
  date?: Date | string;
}

interface MarginBreakdown {
  baseAmount: number;
  marginAmount: number;
  marginPercentage: number;
  marginType?: "fixed" | "percentage";
  totalWithMargin: number;
  currency: string;
  marginPaidBy: "client" | "agency" | "contractor";
  paymentMode: "gross" | "payroll" | "payroll-we-pay" | "split";
}

interface MarginCalculationDisplayProps {
  breakdown: MarginBreakdown;
  expenses?: Expense[];
  className?: string;
  showDetails?: boolean;
}

/**
 * Format currency value
 */
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

/**
 * Get payment mode description
 */
const getPaymentModeDescription = (mode: string): string => {
  switch (mode) {
    case "gross":
      return "Gross payment - Contractor receives full amount and handles their own taxes";
    case "payroll":
      return "Payroll - Agency handles payroll and taxes";
    case "payroll-we-pay":
      return "Payroll (We Pay) - We handle payroll processing and contractor receives net amount";
    case "split":
      return "Split payment - Payment distributed to multiple destinations";
    default:
      return mode;
  }
};

/**
 * Get margin paid by description
 */
const getMarginPaidByDescription = (paidBy: string): string => {
  switch (paidBy) {
    case "client":
      return "Margin is added to the invoice sent to the client";
    case "agency":
      return "Margin is covered by the agency";
    case "contractor":
      return "Margin is deducted from contractor's payment";
    default:
      return paidBy;
  }
};

export function MarginCalculationDisplay({
  breakdown,
  expenses = [],
  className,
  showDetails = true,
}: MarginCalculationDisplayProps) {
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  
  return (
    <Card className={cn("border-blue-200 bg-blue-50/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Margin Calculation
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>This shows how the margin is calculated and who pays for it.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Base Amount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Base Amount (Work/Hours)</span>
          <span className="font-medium">
            {formatCurrency(breakdown.baseAmount, breakdown.currency)}
          </span>
        </div>

        {/* Margin */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Margin{" "}
            {breakdown.marginType === "fixed" 
              ? `(Fixed: ${formatCurrency(breakdown.marginAmount, breakdown.currency)})`
              : `(${breakdown.marginPercentage}%)`
            }
          </span>
          <span className="font-medium text-blue-600">
            {breakdown.marginPaidBy === "contractor" ? "-" : "+"}
            {formatCurrency(breakdown.marginAmount, breakdown.currency)}
          </span>
        </div>
        
        {/* Show calculation details */}
        {breakdown.marginType === "fixed" && (
          <div className="text-xs text-muted-foreground italic">
            Fixed margin of {formatCurrency(breakdown.marginAmount, breakdown.currency)} 
            {" "}(≈{breakdown.marginPercentage.toFixed(2)}% of base)
          </div>
        )}

        {/* Expenses Section */}
        {expenses.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Expenses</span>
              </div>
              
              {expenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-start pl-4 py-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{expense.title}</p>
                    {expense.description && (
                      <p className="text-xs text-muted-foreground">{expense.description}</p>
                    )}
                    {expense.category && (
                      <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">
                        {expense.category}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-sm text-green-600">
                    +{formatCurrency(Number(expense.amount), breakdown.currency)}
                  </span>
                </div>
              ))}
              
              {/* Total Expenses */}
              <div className="flex justify-between items-center pl-4 pt-1 border-t">
                <span className="text-sm font-medium">Total Expenses</span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(totalExpenses, breakdown.currency)}
                </span>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Amount</span>
          <span className="text-lg font-bold">
            {formatCurrency(breakdown.totalWithMargin, breakdown.currency)}
          </span>
        </div>

        {/* Details */}
        {showDetails && (
          <>
            <Separator />
            
            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info className="h-3 w-3 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium">Margin Paid By</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {breakdown.marginPaidBy}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    {getMarginPaidByDescription(breakdown.marginPaidBy)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info className="h-3 w-3 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium">Payment Mode</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {breakdown.paymentMode.replace("-", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    {getPaymentModeDescription(breakdown.paymentMode)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
