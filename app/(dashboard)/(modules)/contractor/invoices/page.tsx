
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
import { Search, Download, Eye, DollarSign } from "lucide-react";

/**
 * Contractor Invoices Page
 * 
 * This page displays invoices related to the contractor's work.
 * 
 * TODO:
 * - Implement tRPC query to fetch invoices from database
 * - Add invoice detail view
 * - Implement PDF download functionality
 * - Add filters (date range, status, amount)
 * - Show invoice history with timeline
 * - Implement payment tracking
 * - Add invoice summary reports
 * - Show payment method details
 */

// Mock data - TODO: Replace with real data from tRPC
const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    period: "Jan 1-15, 2024",
    hours: "80",
    rate: "$85/hr",
    amount: "$6,800",
    issueDate: "2024-01-16",
    dueDate: "2024-01-31",
    status: "paid",
    paidDate: "2024-01-28",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    period: "Jan 16-31, 2024",
    hours: "76",
    rate: "$85/hr",
    amount: "$6,460",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "pending",
    paidDate: null,
  },
  {
    id: "3",
    invoiceNumber: "INV-2023-048",
    period: "Dec 16-31, 2023",
    hours: "72",
    rate: "$85/hr",
    amount: "$6,120",
    issueDate: "2024-01-02",
    dueDate: "2024-01-17",
    status: "paid",
    paidDate: "2024-01-15",
  },
];

export default function ContractorInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const totalEarnings = "$19,380";
  const pendingAmount = "$6,460";
  const paidThisMonth = "$13,260";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Invoices"
        description="View and track your invoices and payments"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Earnings</CardDescription>
            <CardTitle className="text-3xl">{totalEarnings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Payment</CardDescription>
            <CardTitle className="text-3xl">{pendingAmount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Paid This Month</CardDescription>
            <CardTitle className="text-3xl">{paidThisMonth}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Invoices</CardDescription>
            <CardTitle className="text-3xl">48</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Invoices</CardTitle>
              <CardDescription>
                A list of all invoices for your contract work
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
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.period}</TableCell>
                    <TableCell>{invoice.hours}</TableCell>
                    <TableCell>{invoice.rate}</TableCell>
                    <TableCell className="font-semibold">{invoice.amount}</TableCell>
                    <TableCell>{invoice.issueDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="View Invoice">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Payment Info */}
          <div className="mt-6 rounded-lg bg-muted p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">Payment Information</h4>
                <p className="text-sm text-muted-foreground">
                  Payments are processed bi-weekly via direct deposit. Your next payment
                  of {pendingAmount} is scheduled for February 15, 2024.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
