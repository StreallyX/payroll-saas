"use client";

import { api } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "@/lib/react";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import {
  WorkflowStatusBadge,
  WorkflowActionButtons,
  WorkflowActionPresets,
  MarginCalculationDisplay,
} from "@/components/workflow";

interface InvoiceDetailModalProps {
  invoiceId: string;
  onClose: () => void;
}

export function InvoiceDetailModal({
  invoiceId,
  onClose,
}: InvoiceDetailModalProps) {
  const { hasPermission } = usePermissions();
  const utils = api.useUtils();

  const { data, isLoading } = api.invoice.getById.useQuery(
    { id: invoiceId },
    { enabled: !!invoiceId }
  );

  // Workflow mutations
  const reviewMutation = api.invoice.review.useMutation({
    onSuccess: () => {
      toast.success("Invoice moved to review");
      utils.invoice.getAll.invalidate();
      utils.invoice.getById.invalidate({ id: invoiceId });
    },
    onError: (err) => toast.error(err.message),
  });

  const approveMutation = api.invoice.approve.useMutation({
    onSuccess: () => {
      toast.success("Invoice approved");
      utils.invoice.getAll.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendMutation = api.invoice.send.useMutation({
    onSuccess: () => {
      toast.success("Invoice sent");
      utils.invoice.getAll.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = api.invoice.reject.useMutation({
    onSuccess: () => {
      toast.success("Invoice rejected");
      utils.invoice.getAll.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
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
        await rejectMutation.mutateAsync({ id: invoiceId, reason });
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
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
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
    availableActions.push(WorkflowActionPresets.invoiceActions[0]); // Review
  }

  if ((currentState === "draft" || currentState === "reviewing") && canApprove) {
    availableActions.push(WorkflowActionPresets.invoiceActions[1]); // Approve
  }

  if (currentState === "approved" && canSend) {
    availableActions.push(WorkflowActionPresets.invoiceActions[2]); // Send
  }

  if ((currentState === "draft" || currentState === "reviewing") && canReject) {
    availableActions.push(WorkflowActionPresets.invoiceActions[3]); // Reject
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice #{data.invoiceNumber}</DialogTitle>
            <WorkflowStatusBadge status={currentState} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                    <p className="font-medium">{data.invoiceNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Issue Date</Label>
                    <p className="font-medium">
                      {new Date(data.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <p className="font-medium">
                      {new Date(data.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Amount</Label>
                    <p className="font-medium text-lg">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: data.currency || "USD",
                      }).format(Number(data.totalAmount))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            {data.lineItems && data.lineItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.lineItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {item.unitPrice}
                          </p>
                        </div>
                        <p className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: data.currency || "USD",
                          }).format(Number(item.amount))}
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
            <Separator />
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onClose}>
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
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
