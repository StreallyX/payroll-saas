"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle, Send, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WorkflowAction {
  action: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  requiresReason?: boolean;
}

interface WorkflowActionButtonsProps {
  actions: WorkflowAction[];
  onAction: (action: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function WorkflowActionButtons({
  actions,
  onAction,
  isLoading,
  className,
}: WorkflowActionButtonsProps) {
  const [selectedAction, setSelectedAction] = useState<WorkflowAction | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: WorkflowAction) => {
    if (action.requiresReason) {
      setSelectedAction(action);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAction(action.action);
      toast.success(`${action.label} completed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action.label.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogSubmit = async () => {
    if (!selectedAction) return;
    
    if (selectedAction.requiresReason && !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAction(selectedAction.action, reason.trim() || undefined);
      toast.success(`${selectedAction.label} completed successfully`);
      setSelectedAction(null);
      setReason("");
    } catch (error) {
      toast.error(`Failed to ${selectedAction.label.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={className}>
        {actions.map((action) => (
          <Button
            key={action.action}
            variant={action.variant || "default"}
            onClick={() => handleAction(action)}
            disabled={isLoading || isSubmitting}
            className="gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>

      {/* Reason dialog */}
      <Dialog 
        open={!!selectedAction} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAction(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAction?.label}</DialogTitle>
            <DialogDescription>
              Please provide a reason for this action.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter your reason here..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAction(null);
                setReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Pre-configured action sets for common workflows
 */
export const WorkflowActionPresets = {
  timesheetReview: [
    {
      action: "review",
      label: "Review",
      icon: <Eye className="h-4 w-4" />,
      variant: "secondary" as const,
    },
    {
      action: "approve",
      label: "Approve",
      icon: <CheckCircle className="h-4 w-4" />,
      variant: "default" as const,
    },
    {
      action: "request_changes",
      label: "Request Changes",
      icon: <AlertCircle className="h-4 w-4" />,
      variant: "outline" as const,
      requiresReason: true,
    },
    {
      action: "reject",
      label: "Reject",
      icon: <XCircle className="h-4 w-4" />,
      variant: "destructive" as const,
      requiresReason: true,
    },
  ],
  invoiceActions: [
    {
      action: "review",
      label: "Review",
      icon: <Eye className="h-4 w-4" />,
      variant: "secondary" as const,
    },
    {
      action: "approve",
      label: "Approve",
      icon: <CheckCircle className="h-4 w-4" />,
      variant: "default" as const,
    },
    {
      action: "send",
      label: "Send",
      icon: <Send className="h-4 w-4" />,
      variant: "default" as const,
    },
    {
      action: "reject",
      label: "Reject",
      icon: <XCircle className="h-4 w-4" />,
      variant: "destructive" as const,
      requiresReason: true,
    },
  ],
};
