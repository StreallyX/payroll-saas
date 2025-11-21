"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/contractor/status-badge";

import { X, Trash2, CheckCircle2, Save, Pencil } from "lucide-react";

type Props = {
  remit: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;

  mode: "view" | "edit";

  canUpdate?: boolean;
  canDelete?: boolean;
  canMarkPaid?: boolean;

  onDelete?: () => void;
  onMarkPaid?: () => void;
  onUpdate?: (data: {
    status: "pending" | "processing" | "completed" | "failed";
    description?: string;
    notes?: string;
  }) => void;
};

export function RemittanceModal({
  remit,
  open,
  onOpenChange,
  mode,
  canUpdate = false,
  canDelete = false,
  canMarkPaid = false,
  onDelete,
  onMarkPaid,
  onUpdate,
}: Props) {
  const [status, setStatus] =
    useState<"pending" | "processing" | "completed" | "failed">("pending");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const isView = mode === "view";
  const isEdit = mode === "edit";

  useEffect(() => {
    if (remit) {
      setStatus(remit.status);
      setDescription(remit.description || "");
      setNotes(remit.notes || "");
    }
  }, [remit]);

  if (!remit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-xl 
          w-full 
          p-0 
          overflow-hidden 
          flex 
          flex-col
          rounded-xl
        "
      >

        {/* HEADER */}
        <div className="border-b p-4 flex items-center justify-between bg-background sticky top-0 z-20">
          <div>
            <DialogTitle className="text-lg font-semibold">
              {isEdit ? "Edit Remittance" : "Remittance Details"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Payment reference #{remit.id.slice(0, 8)}
            </DialogDescription>
          </div>

          {/* CLOSE BUTTON */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* BODY */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto space-y-6">

          {/* GRID */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-bold text-lg">${remit.amount.toFixed(2)}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Status</p>

              {isView ? (
                <StatusBadge status={status} />
              ) : (
                <select
                  className="border rounded p-2 text-sm w-full"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Created At</p>
              <p>{new Date(remit.createdAt).toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Paid On</p>
              <p>
                {remit.completedAt
                  ? new Date(remit.completedAt).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>

          {/* USER */}
          {remit.user && (
            <div className="border rounded-lg p-3 bg-muted/40">
              <p className="font-semibold">User</p>
              <p className="text-sm">{remit.user.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{remit.user.email}</p>
            </div>
          )}

          {/* CONTRACT */}
          {remit.contract && (
            <div className="border rounded-lg p-3 bg-muted/40">
              <p className="font-semibold">Contract</p>
              <p className="text-sm">{remit.contract.title}</p>
              <p className="text-xs text-muted-foreground">
                Ref: {remit.contract.contractReference}
              </p>
            </div>
          )}

          {/* DESCRIPTION */}
          <div>
            <p className="text-sm font-semibold mb-1">Description</p>
            {isView ? (
              <p className="text-sm">{description || "—"}</p>
            ) : (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </div>

          {/* NOTES */}
          <div>
            <p className="text-sm font-semibold mb-1">Notes</p>
            {isView ? (
              <p className="text-sm text-muted-foreground">{notes || "—"}</p>
            ) : (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 bg-background flex justify-between">

          {/* VIEW MODE → EDIT */}
          {isView && canUpdate && (
            <Button
              variant="default"
              onClick={() =>
                onUpdate?.({ status })
              }
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}

          {/* EDIT MODE → SAVE */}
          {isEdit && canUpdate && (
            <Button
              variant="default"
              onClick={() =>
                onUpdate?.({ status, description, notes })
              }
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}

          <div className="flex gap-2">
            {canMarkPaid && (
              <Button variant="secondary" onClick={onMarkPaid}>
                <CheckCircle2 className="h-4 w-4" />
                Mark Paid
              </Button>
            )}

            {canDelete && (
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
