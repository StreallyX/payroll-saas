"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ExternalLink, CheckCircle } from "lucide-react";
import { SelfInvoiceDialog } from "@/components/invoices/SelfInvoiceDialog";
import { PayrollWorkflowDialog } from "@/components/invoices/PayrollWorkflowDialog";
import { PayrollWePayDialog } from "@/components/invoices/PayrollWePayDialog";
import { SplitPaymentDialog } from "@/components/invoices/SplitPaymentDialog";
import { PaymentModel } from "@/lib/constants/payment-models";
import Link from "next/link";

interface ChildInvoice {
  id: string;
  invoiceNumber: string | null;
  status: string;
  workflowState: string;
  totalAmount: any;
  createdAt: Date;
}

interface InvoiceWorkflowActionsProps {
  currentState: string;
  salaryType?: string | null;
  invoiceId: string;
  totalAmount: number;
  currency: string;
  contractorName: string;
  hasPermission: boolean;
  childInvoices?: ChildInvoice[];
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
  childInvoices,
  onSuccess,
}: InvoiceWorkflowActionsProps) {
  if (currentState !== "payment_received" || !salaryType || !hasPermission) {
    return null;
  }

  // Check if a child invoice (generated invoice) exists
  const generatedInvoice = childInvoices && childInvoices.length > 0 ? childInvoices[0] : null;

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
        {/* Show success message and navigation button if invoice was generated */}
        {generatedInvoice && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">
                    {salaryType === PaymentModel.GROSS && "Self-Invoice Created"}
                    {salaryType === PaymentModel.PAYROLL && "Payroll Invoice Created"}
                    {salaryType === PaymentModel.PAYROLL_WE_PAY && "Payroll Processed"}
                    {salaryType === PaymentModel.SPLIT && "Split Payment Configured"}
                  </h4>
                  <p className="text-sm text-green-700">
                    Invoice {generatedInvoice.invoiceNumber || generatedInvoice.id.slice(0, 8)} has been created successfully.
                  </p>
                </div>
              </div>
              <Link href={`/invoices/${generatedInvoice.id}`}>
                <Button className="flex items-center gap-2">
                  View Generated Invoice
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Show workflow action buttons if no invoice generated yet */}
        {!generatedInvoice && (
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">
                  {salaryType === PaymentModel.GROSS && "Create Self-Invoice"}
                  {salaryType === PaymentModel.PAYROLL && "Process External Payroll"}
                  {salaryType === PaymentModel.PAYROLL_WE_PAY && "Process Internal Payroll"}
                  {salaryType === PaymentModel.SPLIT && "Configure Split Payment"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {salaryType === PaymentModel.GROSS && 
                    "Generate a self-invoice for payment processing. The contractor will handle their own taxes."}
                  {salaryType === PaymentModel.PAYROLL && 
                    "Create self-billing invoice and send to external payroll provider for processing."}
                  {salaryType === PaymentModel.PAYROLL_WE_PAY && 
                    "Process payment internally with tax withholdings and NET salary calculation."}
                  {salaryType === PaymentModel.SPLIT && 
                    "Allocate payment across multiple bank accounts with percentage or fixed amounts."}
                </p>
              </div>
              <div className="ml-4">
                {salaryType === PaymentModel.GROSS && (
                  <SelfInvoiceDialog 
                    invoiceId={invoiceId}
                    onSuccess={onSuccess}
                  />
                )}
                {salaryType === PaymentModel.PAYROLL && (
                  <PayrollWorkflowDialog 
                    invoiceId={invoiceId}
                    onSuccess={onSuccess}
                  />
                )}
                {salaryType === PaymentModel.PAYROLL_WE_PAY && (
                  <PayrollWePayDialog 
                    invoiceId={invoiceId}
                    invoiceAmount={totalAmount}
                    currency={currency}
                    contractorName={contractorName}
                    onSuccess={onSuccess}
                  />
                )}
                {salaryType === PaymentModel.SPLIT && (
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
        )}

        {/* Information based on salary type */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="font-semibold text-blue-900 text-sm mb-2">Next Steps:</h5>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            {salaryType === PaymentModel.GROSS && (
              <>
                <li>Review self-invoice preview with all details</li>
                <li>Create invoice as new Invoice record</li>
                <li>Process payment to contractor</li>
                <li>Contractor handles tax obligations</li>
              </>
            )}
            {salaryType === PaymentModel.PAYROLL && (
              <>
                <li>Self-billing invoice created automatically</li>
                <li>Payroll task assigned to payroll team</li>
                <li>Export to external payroll provider</li>
                <li>Track completion status</li>
              </>
            )}
            {salaryType === PaymentModel.PAYROLL_WE_PAY && (
              <>
                <li>Review contractor and bank details</li>
                <li>Optionally create fee invoice</li>
                <li>Task created for payroll team</li>
                <li>Process NET salary with tax withholdings</li>
              </>
            )}
            {salaryType === PaymentModel.SPLIT && (
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
