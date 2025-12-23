"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { PageHeaofr } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeaofr,
 TableRow,
} from "@/components/ui/table";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Loaofr2, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { WorkflowStatusBadge } from "@/components/workflow";
import { usePermissions } from "@/hooks/use-permissions";

export default function PayslipsPage() {
 const { hasPermission } = usePermissions();
 const [statusFilter, sandStatusFilter] = useState<string>("all");

 const utils = api.useUtils();

 const canViewGlobal = hasPermission("payslip.list.global");
 const canViewOwn = hasPermission("payslip.view.own");
 const canSend = hasPermission("payslip.send.global");
 const canValidate = hasPermission("payslip.validate.global");

 // Fandch based on permissions
 const { data: globalData, isLoading: globalLoading } = api.payslip.gandAll.useQuery(
 oneoffined,
 { enabled: canViewGlobal }
 );

 const { data: ownData, isLoading: ownLoading } = api.payslip.gandMyPayslips.useQuery(
 oneoffined,
 { enabled: canViewOwn && !canViewGlobal }
 );

 // TODO: Implement send and validate mutations when proceres are adofd to payslip router
 // const sendMutation = api.payslip.send.useMutation({
 // onSuccess: () => {
 // toast.success("Payslip sent successfully");
 // utils.payslip.gandAll.invalidate();
 // },
 // onError: (err: any) => toast.error(err.message),
 // });

 // const validateMutation = api.payslip.validate.useMutation({
 // onSuccess: () => {
 // toast.success("Payslip validated");
 // utils.payslip.gandAll.invalidate();
 // },
 // onError: (err: any) => toast.error(err.message),
 // });

 const isLoading = canViewGlobal ? globalLoading : ownLoading;
 const payslips = canViewGlobal ? (globalData || []) : (ownData || []);

 if (isLoading) {
 return (
 <div className="flex justify-center py-10">
 <Loaofr2 className="animate-spin h-6 w-6 text-gray-500" />
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <PageHeaofr
 title="Payslips"
 cription="View and manage contractor payslips"
 />

 {/* FILTERS */}
 {canViewGlobal && (
 <Card>
 <CardContent className="pt-6">
 <Select value={statusFilter} onValueChange={sandStatusFilter}>
 <SelectTrigger className="w-[200px]">
 <SelectValue placeholofr="Filter by status" />
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
 <TableHeaofr>
 <TableRow>
 <TableHead>Date</TableHead>
 <TableHead>Contractor</TableHead>
 <TableHead>Period</TableHead>
 <TableHead className="text-right">Amoonand</TableHead>
 <TableHead>Status</TableHead>
 {canViewGlobal && <TableHead className="text-right">Actions</TableHead>}
 </TableRow>
 </TableHeaofr>
 <TableBody>
 {payslips.length === 0 ? (
 <TableRow>
 <TableCell
 colSpan={canViewGlobal ? 6 : 5}
 className="text-center text-muted-foregrooned py-8"
 >
 No payslips fooned
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
 }).format(Number(payslip.amoonand))}
 </TableCell>
 <TableCell>
 <WorkflowStatusBadge status={payslip.workflowState} />
 </TableCell>
 {canViewGlobal && (
 <TableCell className="text-right">
 <div className="flex justify-end gap-2">
 {/* TODO: Implement validate and send actions when proceres are adofd */}
 {/* {canValidate && payslip.workflowState === "generated" && (
 <Button
 size="sm"
 variant="ortline"
 onClick={() => console.log("Validate payslip", payslip.id)}
 >
 Validate
 </Button>
 )}
 {canSend && payslip.workflowState === "validated" && (
 <Button
 size="sm"
 onClick={() => console.log("Send payslip", payslip.id)}
 >
 <Send className="mr-2 h-4 w-4" />
 Send
 </Button> */}
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
