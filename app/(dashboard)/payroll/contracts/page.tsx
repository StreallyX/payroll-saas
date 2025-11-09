
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
import { Search, Eye, FileText, CheckCircle } from "lucide-react";

/**
 * Payroll Partner Contracts Page
 * 
 * This page displays all contracts assigned to the payroll partner for processing.
 * 
 * TODO:
 * - Implement tRPC query to fetch contracts from database
 * - Add contract detail view with full information
 * - Implement contract approval workflow
 * - Add contract document download/viewing
 * - Implement search and filter functionality
 * - Add pagination for large contract lists
 * - Show contract history and timeline
 * - Add notes/comments functionality per contract
 */

// Mock data - TODO: Replace with real data from tRPC
const mockContracts = [
  {
    id: "1",
    contractNumber: "CTR-2024-001",
    agency: "Demo Agency Corp",
    contractor: "John Doe",
    role: "Software Engineer",
    startDate: "2024-01-15",
    endDate: "2024-12-31",
    status: "active",
    payRate: "$85/hr",
  },
  {
    id: "2",
    contractNumber: "CTR-2024-002",
    agency: "Tech Staffing LLC",
    contractor: "Jane Smith",
    role: "Product Manager",
    startDate: "2024-02-01",
    endDate: "2024-11-30",
    status: "active",
    payRate: "$95/hr",
  },
  {
    id: "3",
    contractNumber: "CTR-2024-003",
    agency: "Demo Agency Corp",
    contractor: "Mike Johnson",
    role: "DevOps Engineer",
    startDate: "2024-01-20",
    endDate: "2024-12-20",
    status: "pending_approval",
    payRate: "$90/hr",
  },
];

export default function PayrollContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      pending_approval: "secondary",
      completed: "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="View and process contractor agreements"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Contracts</CardDescription>
            <CardTitle className="text-3xl">156</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Contracts</CardDescription>
            <CardTitle className="text-3xl">142</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="text-3xl">8</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">14</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract Management</CardTitle>
              <CardDescription>
                All contracts assigned for payroll processing
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
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Pay Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.contractNumber}
                    </TableCell>
                    <TableCell>{contract.agency}</TableCell>
                    <TableCell>{contract.contractor}</TableCell>
                    <TableCell>{contract.role}</TableCell>
                    <TableCell>{contract.startDate}</TableCell>
                    <TableCell>{contract.endDate}</TableCell>
                    <TableCell className="font-semibold">{contract.payRate}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="View Document">
                          <FileText className="h-4 w-4" />
                        </Button>
                        {contract.status === "pending_approval" && (
                          <Button variant="ghost" size="sm" title="Approve">
                            <CheckCircle className="h-4 w-4 text-green-600" />
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
