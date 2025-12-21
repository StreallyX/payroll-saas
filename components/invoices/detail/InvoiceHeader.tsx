"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { WorkflowStatusBadge } from "@/components/workflow";

interface InvoiceHeaderProps {
  invoiceNumber?: string | null;
  invoiceId: string;
  workflowState: string;
  showFullInvoice: boolean;
  onToggleView: () => void;
}

export function InvoiceHeader({
  invoiceNumber,
  invoiceId,
  workflowState,
  showFullInvoice,
  onToggleView,
}: InvoiceHeaderProps) {
  return (
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
            Invoice {invoiceNumber || `#${invoiceId.slice(0, 8)}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Professional invoice with complete details
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <WorkflowStatusBadge status={workflowState} />
        <Button variant="outline" size="sm" onClick={onToggleView}>
          {showFullInvoice ? "Show Tabs View" : "Show Invoice View"}
        </Button>
      </div>
    </div>
  );
}
