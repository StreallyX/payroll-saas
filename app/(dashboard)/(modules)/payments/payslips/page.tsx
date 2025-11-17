
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { RouteGuard } from "@/components/guards/RouteGuard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Search, Download, Eye, FileText } from "lucide-react";

/**
 * Contractor Payslips Page
 * 
 * This page displays payslips for the contractor.
 * 
 * TODO:
 * - Implement tRPC query to fetch payslips from database
 * - Add payslip detail view with full breakdown
 * - Implement PDF download functionality
 * - Add filters (date range, period)
 * - Show earnings summary and tax information
 * - Implement search functionality
 * - Add year-end tax summary (W-2, 1099)
 * - Show payment breakdown (regular hours, overtime, bonuses)
 */

// Mock data - TODO: Replace with real data from tRPC
const mockPayslips = [
  {
    id: "1",
    payslipNumber: "PS-2024-001",
    period: "Jan 1-15, 2024",
    issueDate: "2024-01-20",
    grossPay: "$6,800",
    taxes: "$1,020",
    deductions: "$340",
    netPay: "$5,440",
  },
  {
    id: "2",
    payslipNumber: "PS-2024-002",
    period: "Jan 16-31, 2024",
    issueDate: "2024-02-05",
    grossPay: "$6,460",
    taxes: "$969",
    deductions: "$323",
    netPay: "$5,168",
  },
  {
    id: "3",
    payslipNumber: "PS-2023-024",
    period: "Dec 16-31, 2023",
    issueDate: "2024-01-05",
    grossPay: "$6,120",
    taxes: "$918",
    deductions: "$306",
    netPay: "$4,896",
  },
];

export default function ContractorPayslipsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const ytdGross = "$138,720";
  const ytdTaxes = "$20,808";
  const ytdNet = "$110,448";

  return (
    <RouteGuard permission="payments.payslips.view_own">
      <div className="space-y-6">
      <PageHeader
        title="Payslips"
        description="View and download your payment statements"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>YTD Gross Pay</CardDescription>
            <CardTitle className="text-3xl">{ytdGross}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>YTD Taxes</CardDescription>
            <CardTitle className="text-3xl">{ytdTaxes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>YTD Net Pay</CardDescription>
            <CardTitle className="text-3xl">{ytdNet}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Payslips</CardDescription>
            <CardTitle className="text-3xl">24</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Payslips</CardTitle>
              <CardDescription>
                Access all your payment statements and tax documents
              </CardDescription>
            </div>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Tax Summary
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
              Download All
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payslip #</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Taxes</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.payslipNumber}
                    </TableCell>
                    <TableCell>{payslip.period}</TableCell>
                    <TableCell>{payslip.issueDate}</TableCell>
                    <TableCell>{payslip.grossPay}</TableCell>
                    <TableCell className="text-red-600">{payslip.taxes}</TableCell>
                    <TableCell className="text-red-600">{payslip.deductions}</TableCell>
                    <TableCell className="font-semibold">{payslip.netPay}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="View Payslip">
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

          {/* Tax Information */}
          <div className="mt-6 rounded-lg bg-muted p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">Tax Information</h4>
                <p className="text-sm text-muted-foreground">
                  Your W-2 and 1099 forms will be available by January 31st for the
                  previous tax year. You can download them from this page.
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 mt-2">
                  View Tax Documents
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
