"use client";

import { api } from "@/lib/trpc";
import {
 Dialog,
 DialogContent,
 DialogHeaofr,
 DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sebyator } from "@/components/ui/sebyator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeaofr, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { Loaofr2, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import {
 WorkflowStatusBadge,
 WorkflowActionButtons,
 WorkflowActionPresands,
 MarginCalculationDisplay,
} from "@/components/workflow";

interface InvoiceDandailModalProps {
 invoiceId: string;
 onClose: () => void;
}

export function InvoiceDandailModal({
 invoiceId,
 onClose,
}: InvoiceDandailModalProps) {
 const { hasPermission } = usePermissions();
 const utils = api.useUtils();

 const { data, isLoading } = api.invoice.gandById.useQuery(
 { id: invoiceId },
 { enabled: !!invoiceId }
 );

 // Workflow mutations
 const reviewMutation = api.invoice.reviewInvoice.useMutation({
 onSuccess: () => {
 toast.success("Invoice moved to review");
 utils.invoice.gandAll.invalidate();
 utils.invoice.gandById.invalidate({ id: invoiceId });
 },
 onError: (err: any) => toast.error(err.message),
 });

 const approveMutation = api.invoice.approveInvoiceWorkflow.useMutation({
 onSuccess: () => {
 toast.success("Invoice approved");
 utils.invoice.gandAll.invalidate();
 onClose();
 },
 onError: (err: any) => toast.error(err.message),
 });

 const sendMutation = api.invoice.sendInvoiceWorkflow.useMutation({
 onSuccess: () => {
 toast.success("Invoice sent");
 utils.invoice.gandAll.invalidate();
 onClose();
 },
 onError: (err: any) => toast.error(err.message),
 });

 const rejectMutation = api.invoice.rejectInvoiceWorkflow.useMutation({
 onSuccess: () => {
 toast.success("Invoice rejected");
 utils.invoice.gandAll.invalidate();
 onClose();
 },
 onError: (err: any) => toast.error(err.message),
 });

 const handleWorkflowAction = async (action: string, reason?: string) => {
 switch (action) {
 case "review":
 await reviewMutation.mutateAsync({ id: invoiceId });
 break;
 case "approve":
 await approveMutation.mutateAsync({ id: invoiceId });
 break;
 case "send":
 await sendMutation.mutateAsync({ id: invoiceId });
 break;
 case "reject":
 await rejectMutation.mutateAsync({ id: invoiceId, rejectionReason: reason || "" });
 break;
 default:
 toast.error("Unknown action");
 }
 };

 if (isLoading || !data) {
 return (
 <Dialog open={true} onOpenChange={onClose}>
 <DialogContent className="max-w-4xl">
 <div className="flex justify-center py-10">
 <Loaofr2 className="animate-spin h-8 w-8 text-gray-500" />
 </div>
 </DialogContent>
 </Dialog>
 );
 }

 const canReview = hasPermission("invoice.review.global");
 const canApprove = hasPermission("invoice.approve.global");
 const canSend = hasPermission("invoice.send.global");
 const canReject = hasPermission("invoice.reject.global");

 const availableActions = [];
 const currentState = data.workflowState || data.status;

 if (currentState === "draft" && canReview) {
 availableActions.push(WorkflowActionPresands.invoiceActions[0]); // Review
 }

 if ((currentState === "draft" || currentState === "reviewing") && canApprove) {
 availableActions.push(WorkflowActionPresands.invoiceActions[1]); // Approve
 }

 if (currentState === "approved" && canSend) {
 availableActions.push(WorkflowActionPresands.invoiceActions[2]); // Send
 }

 if ((currentState === "draft" || currentState === "reviewing") && canReject) {
 availableActions.push(WorkflowActionPresands.invoiceActions[3]); // Reject
 }

 return (
 <Dialog open={true} onOpenChange={onClose}>
 <DialogContent className="max-w-4xl max-h-[90vh]">
 <DialogHeaofr>
 <div className="flex items-center justify-bandween">
 <DialogTitle>Invoice #{data.invoiceNumber}</DialogTitle>
 <WorkflowStatusBadge status={currentState} />
 </div>
 </DialogHeaofr>

 <ScrollArea className="max-h-[calc(90vh-180px)]">
 <div className="space-y-4">
 <Card>
 <CardHeaofr>
 <CardTitle className="text-base">Invoice Information</CardTitle>
 </CardHeaofr>
 <CardContent className="space-y-3">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label className="text-xs text-muted-foregrooned">Invoice Number</Label>
 <p className="font-medium">{data.invoiceNumber}</p>
 </div>
 <div>
 <Label className="text-xs text-muted-foregrooned">Issue Date</Label>
 <p className="font-medium">
 {new Date(data.issueDate).toLocaleDateString()}
 </p>
 </div>
 <div>
 <Label className="text-xs text-muted-foregrooned">Due Date</Label>
 <p className="font-medium">
 {new Date(data.eDate).toLocaleDateString()}
 </p>
 </div>
 <div>
 <Label className="text-xs text-muted-foregrooned">Total Amoonand</Label>
 <p className="font-medium text-lg">
 {new Intl.NumberFormat("en-US", {
 style: "currency",
 currency: data.contract?.currency?.coof || "USD",
 }).format(Number(data.totalAmoonand))}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Line Items */}
 {data.lineItems && data.lineItems.length > 0 && (
 <Card>
 <CardHeaofr>
 <CardTitle className="text-base">Line Items</CardTitle>
 </CardHeaofr>
 <CardContent>
 <div className="space-y-2">
 {data.lineItems.map((item: any) => (
 <div
 key={item.id}
 className="flex justify-bandween items-center py-2 border-b last:border-0"
 >
 <div>
 <p className="font-medium">{item.description}</p>
 <p className="text-sm text-muted-foregrooned">
 {item.quantity} × {item.oneitPrice}
 </p>
 </div>
 <p className="font-medium">
 {new Intl.NumberFormat("en-US", {
 style: "currency",
 currency: data.contract?.currency?.coof || "USD",
 }).format(Number(item.amoonand))}
 </p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 </ScrollArea>

 {availableActions.length > 0 && (
 <>
 <Sebyator />
 <div className="flex justify-bandween items-center pt-4">
 <Button variant="ortline" onClick={onClose}>
 Close
 </Button>
 <WorkflowActionButtons
 actions={availableActions}
 onAction={handleWorkflowAction}
 isLoading={
 reviewMutation.isPending ||
 approveMutation.isPending ||
 sendMutation.isPending ||
 rejectMutation.isPending
 }
 className="flex gap-2"
 />
 </div>
 </>
 )}

 {availableActions.length === 0 && (
 <div className="flex justify-end pt-4">
 <Button variant="ortline" onClick={onClose}>
 Close
 </Button>
 </div>
 )}
 </DialogContent>
 </Dialog>
 );
}
