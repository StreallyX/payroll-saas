"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

import { TimesheetReviewModal } from "./TimesheetReviewModal";

// Helper: participant principal
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  const list = data ?? [];

  return (
    <>
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium text-gray-700">Worker</TableHead>
              <TableHead className="font-medium text-gray-700">Period</TableHead>
              <TableHead className="font-medium text-gray-700">Hours</TableHead>
              <TableHead className="font-medium text-gray-700">Status</TableHead>
              <TableHead className="text-right font-medium text-gray-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {list.map((t: any) => {
              const main = getMainParticipant(t.contract);

              return (
                <TableRow key={t.id} className="hover:bg-gray-50 transition">
                  {/* CONTRACTOR */}
                  <TableCell>
                    <div>
                      <p className="font-medium">{main?.user?.name ?? "Unknown"}</p>
                      <p className="text-xs text-gray-500">{main?.user?.email}</p>
                    </div>
                  </TableCell>

                  {/* PERIOD */}
                  <TableCell>
                    {new Date(t.startDate).toLocaleDateString()} →{" "}
                    {new Date(t.endDate).toLocaleDateString()}
                  </TableCell>

                  {/* HOURS */}
                  <TableCell>{Number(t.totalHours)}h</TableCell>

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
                      className="uppercase"
                    >
                      {t.status}
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
      </div>

      {/* REVIEW MODAL */}
      {reviewId && (
        <TimesheetReviewModal
          timesheetId={reviewId}
          onClose={() => setReviewId(null)}
        />
      )}
    </>
  );
}
