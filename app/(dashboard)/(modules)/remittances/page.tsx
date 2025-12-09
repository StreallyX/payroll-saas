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
import { Loader2, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { WorkflowStatusBadge } from "@/components/workflow";
import { usePermissions } from "@/hooks/use-permissions";

export default function RemittancesPage() {
  const { hasPermission } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const utils = api.useUtils();

  const canViewGlobal = hasPermission("remittance.list.global");
  const canSend = hasPermission("remittance.send.global");
  const canProcess = hasPermission("remittance.process.global");
  const canValidate = hasPermission("remittance.validate.global");

  const { data, isLoading } = api.remittance.getMyRemittances.useQuery(
    undefined,
    { enabled: canViewGlobal }
  );

  // TODO: Implement send, validate, and process mutations when procedures are added to remittance router
  // const sendMutation = api.remittance.send.useMutation({
  //   onSuccess: () => {
  //     toast.success("Remittance sent");
  //     utils.remittance.getMyRemittances.invalidate();
  //   },
  //   onError: (err: any) => toast.error(err.message),
  // });

  // const validateMutation = api.remittance.validate.useMutation({
  //   onSuccess: () => {
  //     toast.success("Remittance validated");
  //     utils.remittance.getMyRemittances.invalidate();
  //   },
  //   onError: (err: any) => toast.error(err.message),
  // });

  // const processMutation = api.remittance.process.useMutation({
  //   onSuccess: () => {
  //     toast.success("Remittance processing initiated");
  //     utils.remittance.getMyRemittances.invalidate();
  //   },
  //   onError: (err: any) => toast.error(err.message),
  // });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  const remittances = data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remittances"
        description="Manage remittance payments to agencies and payroll partners"
      />

      {/* FILTERS */}
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
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* REMITTANCES TABLE */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remittances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No remittances found
                  </TableCell>
                </TableRow>
              ) : (
                remittances.map((remittance: any) => (
                  <TableRow key={remittance.id}>
                    <TableCell>
                      {new Date(remittance.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{remittance.recipient?.name || "N/A"}</TableCell>
                    <TableCell className="capitalize">{remittance.type}</TableCell>
                    <TableCell>
                      {new Date(remittance.periodStart).toLocaleDateString()} -{" "}
                      {new Date(remittance.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(remittance.amount))}
                    </TableCell>
                    <TableCell>
                      <WorkflowStatusBadge status={remittance.workflowState} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* TODO: Implement validate, send, and process actions when procedures are added */}
                        {/* {canValidate && remittance.workflowState === "generated" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log("Validate remittance", remittance.id)}
                          >
                            Validate
                          </Button>
                        )}
                        {canSend && remittance.workflowState === "validated" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log("Send remittance", remittance.id)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </Button>
                        )}
                        {canProcess && remittance.workflowState === "sent" && (
                          <Button
                            size="sm"
                            onClick={() => console.log("Process remittance", remittance.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Process
                          </Button>
                        )} */}
                      </div>
                    </TableCell>
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
