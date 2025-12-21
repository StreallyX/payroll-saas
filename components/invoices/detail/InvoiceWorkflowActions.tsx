"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { SelfInvoiceDialog } from "@/components/invoices/SelfInvoiceDialog";
import { PayrollWorkflowDialog } from "@/components/invoices/PayrollWorkflowDialog";
import { PayrollWePayDialog } from "@/components/invoices/PayrollWePayDialog";
import { SplitPaymentDialog } from "@/components/invoices/SplitPaymentDialog";

interface InvoiceWorkflowActionsProps {
  currentState: string;
  salaryType?: string | null;
  invoiceId: string;
  totalAmount: number;
  currency: string;
  contractorName: string;
  hasPermission: boolean;
  onSuccess: () => void;
}

export function InvoiceWorkflowActions({
  currentState,
  salaryType,
  invoiceId,
  totalAmount,
  currency,
  contractorName,
  hasPermission,
  onSuccess,
}: InvoiceWorkflowActionsProps) {
  if (currentState !== "payment_received" || !salaryType || !hasPermission) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <DollarSign className="h-5 w-5" />
          Post-Payment Workflow Actions
        </CardTitle>
        <CardDescription>
          Process payment based on the salary type: {salaryType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold mb-1">
                {salaryType === "gross" && "Create Self-Invoice"}
                {salaryType === "payroll" && "Process External Payroll"}
                {salaryType === "payroll_we_pay" && "Process Internal Payroll"}
                {salaryType === "split" && "Configure Split Payment"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {salaryType === "gross" && 
                  "Generate a self-invoice for payment processing. The contractor will handle their own taxes."}
                {salaryType === "payroll" && 
                  "Create self-billing invoice and send to external payroll provider for processing."}
                {salaryType === "payroll_we_pay" && 
                  "Process payment internally with tax withholdings and NET salary calculation."}
                {salaryType === "split" && 
                  "Allocate payment across multiple bank accounts with percentage or fixed amounts."}
              </p>
            </div>
            <div className="ml-4">
              {salaryType === "gross" && (
                <SelfInvoiceDialog 
                  invoiceId={invoiceId}
                  onSuccess={onSuccess}
                />
              )}
              {salaryType === "payroll" && (
                <PayrollWorkflowDialog 
                  invoiceId={invoiceId}
                  onSuccess={onSuccess}
                />
              )}
              {salaryType === "payroll_we_pay" && (
                <PayrollWePayDialog 
                  invoiceId={invoiceId}
                  invoiceAmount={totalAmount}
                  currency={currency}
                  contractorName={contractorName}
                  onSuccess={onSuccess}
                />
              )}
              {salaryType === "split" && (
                <SplitPaymentDialog 
                  invoiceId={invoiceId}
                  invoiceAmount={totalAmount}
                  currency={currency}
                  onSuccess={onSuccess}
                />
              )}
            </div>
          </div>
        </div>

        {/* Information based on salary type */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="font-semibold text-blue-900 text-sm mb-2">Next Steps:</h5>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            {salaryType === "gross" && (
              <>
                <li>Review self-invoice preview with all details</li>
                <li>Create invoice as new Invoice record</li>
                <li>Process payment to contractor</li>
                <li>Contractor handles tax obligations</li>
              </>
            )}
            {salaryType === "payroll" && (
              <>
                <li>Self-billing invoice created automatically</li>
                <li>Payroll task assigned to payroll team</li>
                <li>Export to external payroll provider</li>
                <li>Track completion status</li>
              </>
            )}
            {salaryType === "payroll_we_pay" && (
              <>
                <li>Review contractor and bank details</li>
                <li>Optionally create fee invoice</li>
                <li>Task created for payroll team</li>
                <li>Process NET salary with tax withholdings</li>
              </>
            )}
            {salaryType === "split" && (
              <>
                <li>Select contractor's bank accounts</li>
                <li>Allocate amounts or percentages</li>
                <li>Validate total equals invoice amount</li>
                <li>Process split payments</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
