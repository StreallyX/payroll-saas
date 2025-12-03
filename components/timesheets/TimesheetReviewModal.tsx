"use client";

import { api } from "@/lib/trpc";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";

// Helper: trouver le participant principal
function getMainParticipant(contract: any) {
  if (!contract) return null;

  return (
    contract.participants?.find((p: any) => p.isPrimary) ||
    contract.participants?.find((p: any) => p.role === "contractor") ||
    null
  );
}

export function TimesheetReviewModal({ timesheetId, onClose }: any) {
  const { data, isLoading } = api.timesheet.getById.useQuery(
    { id: timesheetId },
    { enabled: !!timesheetId }
  );

  const approveMutation = api.timesheet.approve.useMutation({
    onSuccess: () => onClose(),
  });

  const rejectMutation = api.timesheet.reject.useMutation({
    onSuccess: () => onClose(),
  });

  const [rejectReason, setRejectReason] = useState("");

  const main = useMemo(() => getMainParticipant((data as any)?.contract), [data]);

  if (isLoading || !data) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Timesheet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <p>
            <b>Worker:</b> {main?.user?.name ?? "Unknown"}
          </p>

          <p>
            <b>Period:</b>{" "}
            {new Date(data.startDate).toLocaleDateString()} →{" "}
            {new Date(data.endDate).toLocaleDateString()}
          </p>

          <p>
            <b>Total Hours:</b> {Number(data.totalHours)}h
          </p>

          <p>
            <b>Total Amount:</b>{" "}
            {data.totalAmount ? Number(data.totalAmount) : 0} EUR
          </p>

          <Textarea
            placeholder="Rejection reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={() => approveMutation.mutate({ id: timesheetId })}
          >
            Approve
          </Button>

          <Button
            variant="destructive"
            onClick={() =>
              rejectMutation.mutate({
                id: timesheetId,
                reason: rejectReason || undefined,
              })
            }
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
