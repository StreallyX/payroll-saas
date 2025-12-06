"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { WorkflowStatusBadge } from "@/components/workflow";
import { usePermissions } from "@/hooks/use-permissions";

export default function PayslipsPage() {
  const { hasPermission } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const utils = api.useUtils();

  const canViewGlobal = hasPermission("payslip.list.global");
  const canViewOwn = hasPermission("payslip.view.own");
  const canSend = hasPermission("payslip.send.global");
  const canValidate = hasPermission("payslip.validate.global");

  // Fetch based on permissions
  const { data: globalData, isLoading: globalLoading } = api.payslip.getAll.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { enabled: canViewGlobal }
  );

  const { data: ownData, isLoading: ownLoading } = api.payslip.getMy.useQuery(
    undefined,
    { enabled: canViewOwn && !canViewGlobal }
  );

  const sendMutation = api.payslip.send.useMutation({
    onSuccess: () => {
      toast.success("Payslip sent successfully");
      utils.payslip.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const validateMutation = api.payslip.validate.useMutation({
    onSuccess: () => {
      toast.success("Payslip validated");
      utils.payslip.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const isLoading = canViewGlobal ? globalLoading : ownLoading;
  const payslips = canViewGlobal ? (globalData?.payslips || []) : (ownData || []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslips"
        description="View and manage contractor payslips"
      />

      {/* FILTERS */}
      {canViewGlobal && (
        <Card>
          <CardContent className="pt-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* PAYSLIPS TABLE */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                {canViewGlobal && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canViewGlobal ? 6 : 5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No payslips found
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((payslip: any) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      {new Date(payslip.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{payslip.contractor?.name || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(payslip.periodStart).toLocaleDateString()} -{" "}
                      {new Date(payslip.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(payslip.amount))}
                    </TableCell>
                    <TableCell>
                      <WorkflowStatusBadge status={payslip.workflowState} />
                    </TableCell>
                    {canViewGlobal && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canValidate && payslip.workflowState === "generated" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => validateMutation.mutate({ id: payslip.id })}
                              disabled={validateMutation.isPending}
                            >
                              Validate
                            </Button>
                          )}
                          {canSend && payslip.workflowState === "validated" && (
                            <Button
                              size="sm"
                              onClick={() => sendMutation.mutate({ id: payslip.id })}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
