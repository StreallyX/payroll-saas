"use client";

import { api } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export function TimesheetListContractor() {
  const { data, isLoading } = api.timesheet.getMyTimesheets.useQuery();

  if (isLoading)
    return <Loader2 className="animate-spin h-6 w-6 mx-auto" />;

  if (!data || data.length === 0)
    return <p className="text-center text-gray-500">No timesheets yet.</p>;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {data.map((t: any) => (
          <div
            key={t.id}
            className="border p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-medium">
                {format(new Date(t.startDate), "dd MMM")} →{" "}
                {format(new Date(t.endDate), "dd MMM yyyy")}
              </p>

              <p className="text-sm text-gray-500">
                {t.totalHours} hours – {t.totalAmount ?? 0} EUR
              </p>
            </div>

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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
