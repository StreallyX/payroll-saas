
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
import { Search, Download, Eye, Send, FileText } from "lucide-react";

/**
 * Payroll Partner Payslips Page
 * 
 * This page manages payslip generation and distribution to contractors.
 * 
 * TODO:
 * - Implement tRPC query to fetch payslip data from database
 * - Add bulk payslip generation
 * - Implement payslip PDF generation with templates
 * - Add email distribution functionality
 * - Implement filters (date range, contractor, agency)
 * - Export payslip data to CSV
 * - Add payslip templates customization
 * - Show generation history
 * - Implement tax calculation breakdown display
 */

// Mock data - TODO: Replace with real data from tRPC
const mockPayslips = [
  {
    id: "1",
    payslipNumber: "PS-2024-001",
    contractor: "John Doe",
    agency: "Demo Agency Corp",
    period: "Jan 1-15, 2024",
    grossPay: "$8,000",
    netPay: "$6,800",
    issueDate: "2024-01-20",
    status: "sent",
  },
  {
    id: "2",
    payslipNumber: "PS-2024-002",
    contractor: "Jane Smith",
    agency: "Tech Staffing LLC",
    period: "Jan 1-15, 2024",
    grossPay: "$9,500",
    netPay: "$7,600",
    issueDate: "2024-01-20",
    status: "generated",
  },
  {
    id: "3",
    payslipNumber: "PS-2024-003",
    contractor: "Mike Johnson",
    agency: "Demo Agency Corp",
    period: "Jan 1-15, 2024",
    grossPay: "$9,000",
    netPay: "$7,200",
    issueDate: "2024-01-20",
    status: "sent",
  },
];

export default function PayrollPayslipsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary"> = {
      sent: "default",
      generated: "secondary",
      draft: "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslips"
        description="Generate and manage contractor payslips"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Payslips</CardDescription>
            <CardTitle className="text-3xl">3,248</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">284</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sent</CardDescription>
            <CardTitle className="text-3xl">268</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl">16</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payslip Management</CardTitle>
              <CardDescription>
                Generate and distribute contractor payslips
              </CardDescription>
            </div>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Batch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payslips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payslip #</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.payslipNumber}
                    </TableCell>
                    <TableCell>{payslip.contractor}</TableCell>
                    <TableCell>{payslip.agency}</TableCell>
                    <TableCell>{payslip.period}</TableCell>
                    <TableCell>{payslip.grossPay}</TableCell>
                    <TableCell className="font-semibold">{payslip.netPay}</TableCell>
                    <TableCell>{payslip.issueDate}</TableCell>
                    <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="View Payslip">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        {payslip.status === "generated" && (
                          <Button variant="ghost" size="sm" title="Send to Contractor">
                            <Send className="h-4 w-4" />
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
