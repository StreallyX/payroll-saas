"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TimesheetListContractor() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.timesheet.getMyTimesheetsPaginated.useInfiniteQuery(
      {
        search,
        status: statusFilter !== "all" ? statusFilter : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchInterval: 30000, // Auto-refresh every 30 seconds
      }
    );

  if (isLoading) {
    return <Loader2 className="animate-spin h-6 w-6 mx-auto" />;
  }

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Card className="w-full">
      <CardContent className="p-0">

        {/* FILTER BAR */}
        <div className="p-4 border-b flex gap-4 items-center">
          <Input
            placeholder="Search timesheets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-left">
              <tr>
                <th className="p-3 font-medium text-gray-600">Period</th>
                <th className="p-3 font-medium text-gray-600">Hours</th>
                <th className="p-3 font-medium text-gray-600">Amount</th>
                <th className="p-3 font-medium text-gray-600">Status</th>
                <th className="p-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((t: any) => (
                <tr key={t.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">
                    {format(new Date(t.startDate), "dd MMM")} →{" "}
                    {format(new Date(t.endDate), "dd MMM yyyy")}
                  </td>

                  <td className="p-3">{t.totalHours}h</td>

                  <td className="p-3">
                    {t.totalAmount ?? 0} {t.currency}
                  </td>

                  <td className="p-3">
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
                  </td>

                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/timesheets/${t.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {hasNextPage && (
          <div className="flex justify-center p-4">
            <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Load more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
