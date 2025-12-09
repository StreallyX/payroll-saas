"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, FileText } from "lucide-react";
import { toast } from "sonner";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate?: Date | string | null;
  status: string;
  amount: number;
  baseAmount?: number;
  marginAmount?: number;
  marginPercentage?: number;
  totalAmount: number;
  currency: string;
  marginPaidBy?: string;
  contract?: {
    title?: string | null;
    contractReference?: string | null;
    participants?: Array<{
      role: string;
      user?: {
        name: string | null;
        email: string;
      } | null;
      company?: {
        name: string;
        address?: string | null;
      } | null;
    }>;
  };
  timesheet?: {
    startDate: Date | string;
    endDate: Date | string;
    totalHours: number;
    totalExpenses?: number;
    entries?: Array<{
      date: Date | string;
      hours: number;
      description?: string | null;
    }>;
  };
}

interface InvoicePDFPreviewProps {
  invoice: InvoiceData;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function InvoicePDFPreview({ invoice, onDownload, onPrint }: InvoicePDFPreviewProps) {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(amount);
  };

  // Get participants
  const contractor = invoice.contract?.participants?.find((p) => p.role === "contractor");
  const client = invoice.contract?.participants?.find((p) => p.role === "client");
  const agency = invoice.contract?.participants?.find((p) => p.role === "agency");

  const contractorName = contractor?.user?.name || contractor?.company?.name || "N/A";
  const clientName = client?.user?.name || client?.company?.name || "N/A";
  const agencyName = agency?.user?.name || agency?.company?.name || "N/A";

  // Determine who receives the invoice
  const billTo = invoice.marginPaidBy === "contractor" 
    ? { name: contractorName, email: contractor?.user?.email }
    : invoice.marginPaidBy === "agency"
    ? { name: agencyName, email: agency?.user?.email }
    : { name: clientName, email: client?.user?.email };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      toast.info("Download functionality not implemented");
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-sm text-muted-foreground">#{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Header Information */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">FROM</h3>
            <div className="space-y-1">
              <p className="font-semibold">{agencyName}</p>
              {agency?.company?.address && (
                <p className="text-sm text-muted-foreground">{agency.company.address}</p>
              )}
              {agency?.user?.email && (
                <p className="text-sm text-muted-foreground">{agency.user.email}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">BILL TO</h3>
            <div className="space-y-1">
              <p className="font-semibold">{billTo.name}</p>
              {billTo.email && (
                <p className="text-sm text-muted-foreground">{billTo.email}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Invoice Details */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Date</p>
            <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">{formatDate(invoice.dueDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{invoice.status.replace(/_/g, " ")}</p>
          </div>
        </div>

        {/* Contract & Period Information */}
        {invoice.contract && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Contract</p>
                <p className="font-medium">
                  {invoice.contract.title || invoice.contract.contractReference || "N/A"}
                </p>
              </div>
              {invoice.timesheet && (
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-medium">
                    {formatDate(invoice.timesheet.startDate)} - {formatDate(invoice.timesheet.endDate)}
                  </p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contractor</p>
              <p className="font-medium">{contractorName}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Line Items */}
        {invoice.timesheet?.entries && invoice.timesheet.entries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Work Performed</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Date</th>
                    <th className="text-left p-3 text-sm font-semibold">Description</th>
                    <th className="text-right p-3 text-sm font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.timesheet.entries.map((entry, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 text-sm">{formatDate(entry.date)}</td>
                      <td className="p-3 text-sm">{entry.description || "Work performed"}</td>
                      <td className="p-3 text-sm text-right">{entry.hours}h</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/30">
                    <td className="p-3 text-sm font-semibold" colSpan={2}>
                      Total Hours
                    </td>
                    <td className="p-3 text-sm font-semibold text-right">
                      {invoice.timesheet.totalHours}h
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Separator />

        {/* Amount Breakdown */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Amount Breakdown</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Amount:</span>
              <span className="font-medium">{formatCurrency(invoice.baseAmount || invoice.amount)}</span>
            </div>

            {invoice.marginAmount && invoice.marginAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Margin {invoice.marginPercentage ? `(${invoice.marginPercentage.toFixed(2)}%)` : ""}:
                </span>
                <span className={`font-medium ${
                  invoice.marginPaidBy === "client" ? "text-blue-600" : "text-gray-600"
                }`}>
                  {invoice.marginPaidBy === "client" ? "+" : "-"} {formatCurrency(invoice.marginAmount)}
                </span>
              </div>
            )}

            {invoice.timesheet?.totalExpenses && invoice.timesheet.totalExpenses > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses:</span>
                <span className="font-medium text-blue-600">
                  + {formatCurrency(invoice.timesheet.totalExpenses)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
            <span className="text-xl font-bold">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(invoice.totalAmount)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-2">
            For any questions regarding this invoice, please contact us.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
