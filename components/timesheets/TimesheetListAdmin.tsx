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
import { Loader2 } from "lucide-react";
import { WorkflowStatusBadge } from "@/components/workflow";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  const list = data ?? [];

  // Apply filters
  const filteredList = list.filter((t: any) => {
    const main = getMainParticipant(t.contract);
    const workerName = main?.user?.name?.toLowerCase() || "";
    const workerEmail = main?.user?.email?.toLowerCase() || "";
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      workerName.includes(search) ||
      workerEmail.includes(search);

    const matchesStatus =
      statusFilter === "all" || t.workflowState === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* FILTERS */}
      <div className="mb-4 flex gap-4 items-center">
        <Input
          placeholder="Search by worker name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="changes_requested">Changes Requested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium text-gray-700">Worker</TableHead>
              <TableHead className="font-medium text-gray-700">Contract</TableHead>
              <TableHead className="font-medium text-gray-700">Period</TableHead>
              <TableHead className="font-medium text-gray-700 text-right">Hours</TableHead>
              <TableHead className="font-medium text-gray-700 text-right">Amount</TableHead>
              <TableHead className="font-medium text-gray-700">Status</TableHead>
              <TableHead className="font-medium text-gray-700">Submitted</TableHead>
              <TableHead className="text-right font-medium text-gray-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No timesheets found
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((t: any) => {
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

                    {/* CONTRACT */}
                    <TableCell>
                      <p className="text-sm">
                        {t.contract?.title || t.contract?.contractReference || "N/A"}
                      </p>
                    </TableCell>

                    {/* PERIOD */}
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(t.startDate).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          to {new Date(t.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>

                    {/* HOURS */}
                    <TableCell className="text-right font-medium">
                      {Number(t.totalHours).toFixed(1)}h
                    </TableCell>

                    {/* AMOUNT */}
                    <TableCell className="text-right font-medium">
                      {t.totalAmount
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: t.contract?.currency?.code || "USD",
                          }).format(Number(t.totalAmount))
                        : "-"}
                    </TableCell>

                    {/* STATUS */}
                    <TableCell>
                      <WorkflowStatusBadge status={t.workflowState || t.status} />
                    </TableCell>

                    {/* SUBMITTED DATE */}
                    <TableCell>
                      <p className="text-sm">
                        {t.submittedAt
                          ? new Date(t.submittedAt).toLocaleDateString()
                          : "-"}
                      </p>
                    </TableCell>

                    {/* ACTION */}
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={
                          t.workflowState === "submitted" ||
                          t.workflowState === "under_review"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setReviewId(t.id)}
                      >
                        {t.workflowState === "approved"
                          ? "View"
                          : t.workflowState === "draft"
                          ? "View"
                          : "Review"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
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
