
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
import { Plus, Search, Download, Eye, DollarSign } from "lucide-react";

/**
 * Payroll Partner Invoices Page
 * 
 * This page displays and manages invoices for payroll services rendered.
 * 
 * TODO:
 * - Implement tRPC query to fetch invoices from database
 * - Add invoice generation functionality
 * - Implement invoice PDF generation
 * - Add payment tracking and reconciliation
 * - Implement filters (date range, status, agency)
 * - Export invoices to CSV
 * - Add invoice templates
 * - Show payment history per agency
 */

// Mock data - TODO: Replace with real data from tRPC
const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "PINV-2024-001",
    agency: "Demo Agency Corp",
    amount: "$5,200",
    serviceMonth: "January 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "paid",
  },
  {
    id: "2",
    invoiceNumber: "PINV-2024-002",
    agency: "Tech Staffing LLC",
    amount: "$3,800",
    serviceMonth: "January 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "pending",
  },
  {
    id: "3",
    invoiceNumber: "PINV-2023-156",
    agency: "Demo Agency Corp",
    amount: "$4,900",
    serviceMonth: "December 2023",
    issueDate: "2024-01-01",
    dueDate: "2024-01-15",
    status: "overdue",
  },
];

export default function PayrollInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Invoices"
        description="Track and manage payroll service invoices"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">$624,000</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Payment</CardDescription>
            <CardTitle className="text-3xl">$28,600</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-3xl text-destructive">$4,900</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">$52,400</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Invoices</CardTitle>
              <CardDescription>
                Invoices for payroll processing services
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
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
                  <TableHead>Agency</TableHead>
                  <TableHead>Service Period</TableHead>
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
                    <TableCell>{invoice.agency}</TableCell>
                    <TableCell>{invoice.serviceMonth}</TableCell>
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
                        {invoice.status === "pending" && (
                          <Button variant="ghost" size="sm" title="Mark as Paid">
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
