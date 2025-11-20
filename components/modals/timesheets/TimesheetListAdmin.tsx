"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TimesheetReviewModal } from "./TimesheetReviewModal";
import { Badge } from "@/components/ui/badge";

// Helper : participant principal
function getMainParticipant(contract: any) {
  if (!contract) return null;

  return (
    contract.participants?.find((p: any) => p.isPrimary) ||
    contract.participants?.find((p: any) => p.role === "contractor") ||
    null
  );
}

export function TimesheetListAdmin() {
  const { data, isLoading } = api.timesheet.getAll.useQuery();
  const [reviewId, setReviewId] = useState<string | null>(null);

  if (isLoading) return <div>Loading…</div>;

  // Toujours une liste valide
  const list = data ?? [];

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {list.map((t: any) => {
            const main = getMainParticipant(t.contract);

            return (
              <TableRow key={t.id}>
                {/* CONTRACTOR */}
                <TableCell>
                  <p className="font-medium">
                    {main?.user?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {main?.user?.email}
                  </p>
                </TableCell>

                {/* PERIOD */}
                <TableCell>
                  {t.startDate ? new Date(t.startDate).toLocaleDateString() : "-"} →{" "}
                  {t.endDate ? new Date(t.endDate).toLocaleDateString() : "-"}
                </TableCell>

                {/* HOURS */}
                <TableCell>
                  {Number(t.totalHours)}h
                </TableCell>

                {/* STATUS */}
                <TableCell>
                  <Badge
                    variant={
                      t.status === "approved"
                        ? "default"
                        : t.status === "rejected"
                        ? "destructive"
                        : t.status === "submitted"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {t.status.toUpperCase()}
                  </Badge>
                </TableCell>

                {/* ACTION */}
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => setReviewId(t.id)}>
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* MODAL */}
      {reviewId && (
        <TimesheetReviewModal
          timesheetId={reviewId}
          onClose={() => setReviewId(null)}
        />
      )}
    </>
  );
}
