
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
import { Search, Download, Eye, Send, DollarSign } from "lucide-react";

/**
 * Payroll Partner Remits Page
 * 
 * This page displays and manages remittance payments to contractors.
 * 
 * TODO:
 * - Implement tRPC query to fetch remittance data from database
 * - Add bulk remittance processing
 * - Implement payment file generation (ACH, Wire)
 * - Add payment confirmation tracking
 * - Implement filters (date range, status, agency)
 * - Export remittance reports
 * - Add bank account validation
 * - Show remittance history and trends
 * - Implement reconciliation with invoices
 */

// Mock data - TODO: Replace with real data from tRPC
const mockRemits = [
  {
    id: "1",
    remitNumber: "REM-2024-001",
    contractor: "John Doe",
    agency: "Demo Agency Corp",
    amount: "$6,800",
    period: "Jan 1-15, 2024",
    dueDate: "2024-01-20",
    status: "paid",
  },
  {
    id: "2",
    remitNumber: "REM-2024-002",
    contractor: "Jane Smith",
    agency: "Tech Staffing LLC",
    amount: "$7,600",
    period: "Jan 1-15, 2024",
    dueDate: "2024-01-20",
    status: "pending",
  },
  {
    id: "3",
    remitNumber: "REM-2024-003",
    contractor: "Mike Johnson",
    agency: "Demo Agency Corp",
    amount: "$7,200",
    period: "Jan 1-15, 2024",
    dueDate: "2024-01-20",
    status: "processing",
  },
];

export default function PayrollRemitsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default",
      pending: "secondary",
      processing: "secondary",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Remits"
        description="Manage contractor remittance payments"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Remitted</CardDescription>
            <CardTitle className="text-3xl">$1.8M</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl">$124,600</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl">$89,200</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Period</CardDescription>
            <CardTitle className="text-3xl">$156,400</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Remits Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Remittance Payments</CardTitle>
              <CardDescription>
                Contractor payments scheduled and processed
              </CardDescription>
            </div>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Process Batch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search remits..."
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
                  <TableHead>Contractor</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
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
                    <TableCell>{remit.contractor}</TableCell>
                    <TableCell>{remit.agency}</TableCell>
                    <TableCell>{remit.period}</TableCell>
                    <TableCell className="font-semibold">{remit.amount}</TableCell>
                    <TableCell>{remit.dueDate}</TableCell>
                    <TableCell>{getStatusBadge(remit.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        {remit.status === "pending" && (
                          <Button variant="ghost" size="sm" title="Process Payment">
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
