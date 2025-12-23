"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useSimpleContractWorkflow } from "@/hooks/contracts/useSimpleContractWorkflow";
import { ContractStatusBadge } from "./ContractStatusBadge";

interface Contract {
  id: string;
  title: string | null;
  type: string;
  status: string;
  description?: string | null;
  createdAt: Date | string;
}

interface AdminReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  onSuccess?: () => void;
}

/**
 * Admin approval / rejection modal
 *
 * Actions:
 * - Approve: moves the contract from `pending_admin_review` to `completed`
 * - Reject: sends the contract back to `draft` with a rejection reason
 */
export function AdminReviewModal({
  open,
  onOpenChange,
  contract,
  onSuccess,
}: AdminReviewModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const {
    approveContract,
    rejectContract,
    isApproving,
    isRejecting,
  } = useSimpleContractWorkflow();

  const isProcessing = isApproving || isRejecting;

  /**
   * Approve the contract
   */
  const handleApprove = async () => {
    setAction("approve");
    await approveContract.mutateAsync({
      contractId: contract.id,
      notes: notes || undefined,
    });

    setAction(null);
    setNotes("");
    onSuccess?.();
    onOpenChange(false);
  };

  /**
   * Reject the contract
   */
  const handleReject = async () => {
    const trimmedReason = reason.trim();

    // Validation: minimum 10 characters required
    if (!trimmedReason || trimmedReason.length < 10) {
      return;
    }

    setAction("reject");
    await rejectContract.mutateAsync({
      contractId: contract.id,
      reason: trimmedReason,
    });

    setAction(null);
    setReason("");
    onSuccess?.();
    onOpenChange(false);
  };

  /**
   * Close modal
   */
  const handleClose = () => {
    if (!isProcessing) {
      setAction(null);
      setNotes("");
      setReason("");
      onOpenChange(false);
    }
  };

  /**
   * Format date
   */
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const isMSA = contract.type === "msa";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract validation
          </DialogTitle>
          <DialogDescription>
            Approve or reject this contract pending validation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contract information */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-lg">
                  {contract.title || "Untitled contract"}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Type:{" "}
                  <span className="font-medium">
                    {isMSA ? "MSA" : "SOW"}
                  </span>{" "}
                  • Created on {formatDate(contract.createdAt)}
                </p>
              </div>
              <ContractStatusBadge status={contract.status as any} />
            </div>

            {contract.description && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {contract.description}
                </p>
              </div>
            )}
          </div>

          {/* Action selector */}
          {!action && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Choose an action below to approve or reject this contract.
              </AlertDescription>
            </Alert>
          )}

          {/* Approval form */}
          {action === "approve" && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  You are about to approve this contract. Its status will be
                  set to <strong>Completed</strong>.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="approve-notes">
                  Notes (optional)
                </Label>
                <Textarea
                  id="approve-notes"
                  placeholder="Add optional notes for this approval..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isProcessing}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Rejection form */}
          {action === "reject" && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You are about to reject this contract. It will be sent
                  back to draft.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reject-reason" className="required">
                    Rejection reason *
                  </Label>
                  <span
                    className={`text-xs ${
                      reason.trim().length < 10
                        ? "text-red-500 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {reason.trim().length} / 10 characters minimum
                  </span>
                </div>

                <Textarea
                  id="reject-reason"
                  placeholder="Explain why you are rejecting this contract (minimum 10 characters)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isProcessing}
                  rows={4}
                  className={
                    reason.trim().length > 0 &&
                    reason.trim().length < 10
                      ? "border-red-300"
                      : ""
                  }
                />

                <p className="text-xs text-muted-foreground">
                  This reason will be visible to the contract creator.
                </p>

                {reason.trim().length > 0 &&
                  reason.trim().length < 10 && (
                    <p className="text-xs text-red-500 font-medium">
                      ⚠️ The reason must contain at least 10 characters.
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!action ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="sm:order-1"
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={() => setAction("reject")}
                className="sm:order-2"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>

              <Button
                onClick={() => setAction("approve")}
                className="sm:order-3 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          ) : action === "approve" ? (
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={isProcessing}
              >
                Back
              </Button>

              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm approval
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                disabled={isProcessing}
              >
                Back
              </Button>

              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={
                  !reason.trim() ||
                  reason.trim().length < 10 ||
                  isProcessing
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Confirm rejection
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
