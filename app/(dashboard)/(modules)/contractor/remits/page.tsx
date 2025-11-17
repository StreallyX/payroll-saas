"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Search, Download, Eye, TrendingUp, DollarSign, AlertCircle, FileText } from "lucide-react";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/contractor/stats-card";
import { StatusBadge } from "@/components/contractor/status-badge";
import { DataTable, Column } from "@/components/contractor/data-table";
import { EmptyState } from "@/components/contractor/empty-state";
import { StatsCardSkeleton, TableSkeleton } from "@/components/contractor/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Contractor Remits Page
 * 
 * Displays payment remittances received by the contractor.
 * Shows payment history, status tracking, and detailed breakdowns.
 */

export default function ContractorRemitsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRemit, setSelectedRemit] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch remittances
  const { data: remittances, isLoading, error } = api.remittance.getMyRemittances.useQuery();

  // Fetch remittance summary
  const { data: summary } = api.remittance.getMyRemittanceSummary.useQuery();

  // Remittance columns
  const columns: Column<any>[] = [
    {
      key: "remitNumber",
      label: "Remit #",
      sortable: true,
      render: (remit) => <span className="font-medium">{remit.remitNumber}</span>,
    },
    {
      key: "periodStart",
      label: "Pay Period",
      sortable: true,
      render: (remit) => {
        const start = new Date(remit.periodStart).toLocaleDateString();
        const end = new Date(remit.periodEnd).toLocaleDateString();
        return `${start} - ${end}`;
      },
    },
    {
      key: "grossPay",
      label: "Gross Pay",
      sortable: true,
      render: (remit) => `$${parseFloat(remit.grossPay).toFixed(2)}`,
    },
    {
      key: "deductions",
      label: "Deductions",
      sortable: true,
      render: (remit) => <span className="text-red-600">-${parseFloat(remit.deductions).toFixed(2)}</span>,
    },
    {
      key: "netPay",
      label: "Net Pay",
      sortable: true,
      render: (remit) => <span className="font-semibold">${parseFloat(remit.netPay).toFixed(2)}</span>,
    },
    {
      key: "paymentDate",
      label: "Payment Date",
      sortable: true,
      render: (remit) => new Date(remit.paymentDate).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (remit) => <StatusBadge status={remit.status} />,
    },
  ];

  const handleViewDetails = (remit: any) => {
    setSelectedRemit(remit);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Remits"
        description="View your payment history and remittances"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {!summary ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Received"
              value={`$${summary.totalReceived?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
            />
            <StatsCard
              title="Processing"
              value={`$${summary.processingAmount?.toFixed(2) || '0.00'}`}
              icon={TrendingUp}
              description={`${summary.processingCount || 0} payments`}
            />
            <StatsCard
              title="This Month"
              value={`$${summary.monthlyAverage?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
            />
            <StatsCard
              title="Avg Per Period"
              value={`$${summary.monthlyAverage?.toFixed(2) || '0.00'}`}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* Remits Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All remittance payments received from your employer
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <TableSkeleton />
          ) : !remittances || remittances.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No payments yet"
              description="Your payment history will appear here once you receive your first remittance."
            />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>

              <DataTable
                data={remittances.filter((remit: any) =>
                  searchTerm
                    ? remit.remitNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                    : true
                )}
                columns={columns}
                actions={(remit) => (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="View Details"
                      onClick={() => handleViewDetails(remit)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Download Statement">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              />
            </>
          )}

          {/* Payment Method Info */}
          {remittances && remittances.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="mb-2 font-medium">Payment Method</h4>
                    <p className="text-sm text-muted-foreground">
                      Direct Deposit to Bank Account
                    </p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-2">
                      Update Payment Method
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-2">Payment Schedule</h4>
                    <p className="text-sm text-muted-foreground">
                      Payments are processed bi-weekly, typically 5 business days after
                      period end.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remittance Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Remittance Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown of payment #{selectedRemit?.remitNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedRemit && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-muted-foreground">Remit Number</p>
                  <p className="font-semibold">{selectedRemit.remitNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedRemit.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pay Period</p>
                  <p className="font-semibold">
                    {new Date(selectedRemit.periodStart).toLocaleDateString()} - {new Date(selectedRemit.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p className="font-semibold">{new Date(selectedRemit.paymentDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold">Payment Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Gross Pay</span>
                    <span className="font-semibold">${parseFloat(selectedRemit.grossPay).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="font-semibold text-red-600">-${parseFloat(selectedRemit.deductions).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-primary/20">
                    <span className="font-semibold text-lg">Net Pay</span>
                    <span className="font-bold text-lg text-primary">${parseFloat(selectedRemit.netPay).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="font-medium">{selectedRemit.currency || "USD"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{selectedRemit.paymentMethod || "Direct Deposit"}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download Statement
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
