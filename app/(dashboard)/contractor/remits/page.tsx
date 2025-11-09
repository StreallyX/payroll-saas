
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Search, Download, Eye, TrendingUp } from "lucide-react";

/**
 * Contractor Remits Page
 * 
 * This page displays payment remittances received by the contractor.
 * 
 * TODO:
 * - Implement tRPC query to fetch remittance data from database
 * - Add remittance detail view with breakdown
 * - Implement payment history tracking
 * - Add filters (date range, status, amount)
 * - Show payment trends and analytics
 * - Implement download of payment statements
 * - Add bank account information
 * - Show tax withholding details
 */

// Mock data - TODO: Replace with real data from tRPC
const mockRemits = [
  {
    id: "1",
    remitNumber: "REM-2024-001",
    period: "Jan 1-15, 2024",
    grossPay: "$6,800",
    deductions: "$1,360",
    netPay: "$5,440",
    paymentDate: "2024-01-20",
    status: "paid",
  },
  {
    id: "2",
    remitNumber: "REM-2024-002",
    period: "Jan 16-31, 2024",
    grossPay: "$6,460",
    deductions: "$1,292",
    netPay: "$5,168",
    paymentDate: "2024-02-05",
    status: "processing",
  },
  {
    id: "3",
    remitNumber: "REM-2023-024",
    period: "Dec 16-31, 2023",
    grossPay: "$6,120",
    deductions: "$1,224",
    netPay: "$4,896",
    paymentDate: "2024-01-05",
    status: "paid",
  },
];

export default function ContractorRemitsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default",
      processing: "secondary",
      pending: "secondary",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const totalReceived = "$15,504";
  const pendingPayment = "$5,168";
  const thisMonthTotal = "$10,608";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Remits"
        description="View your payment history and remittances"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Received</CardDescription>
            <CardTitle className="text-3xl">{totalReceived}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl">{pendingPayment}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">{thisMonthTotal}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Per Period</CardDescription>
            <CardTitle className="text-3xl">$5,168</CardTitle>
          </CardHeader>
        </Card>
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
          {/* Search */}
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

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Remit #</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRemits.map((remit) => (
                  <TableRow key={remit.id}>
                    <TableCell className="font-medium">
                      {remit.remitNumber}
                    </TableCell>
                    <TableCell>{remit.period}</TableCell>
                    <TableCell>{remit.grossPay}</TableCell>
                    <TableCell className="text-red-600">{remit.deductions}</TableCell>
                    <TableCell className="font-semibold">{remit.netPay}</TableCell>
                    <TableCell>{remit.paymentDate}</TableCell>
                    <TableCell>{getStatusBadge(remit.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Download Statement">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Payment Method Info */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium">Payment Method</h4>
              <p className="text-sm text-muted-foreground">
                Direct Deposit to Bank Account ending in •••• 5678
              </p>
              <Button variant="link" size="sm" className="h-auto p-0 mt-2">
                Update Payment Method
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Payment Schedule</h4>
                  <p className="text-sm text-muted-foreground">
                    Payments are processed bi-weekly, typically 5 business days after
                    period end.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
