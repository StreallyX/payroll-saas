"use client";

import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineStep {
  status: TimesheetStatus;
  label: string;
  description: string;
}

export type TimesheetStatus = 
  | "draft" 
  | "submitted" 
  | "under_review" 
  | "approved" 
  | "sent"
  | "rejected"
  | "changes_requested";

interface TimesheetStatusTimelineProps {
  currentStatus: TimesheetStatus;
  statusHistory?: Array<{
    fromStatus: string;
    toStatus: string;
    createdAt: Date | string;
    reason?: string | null;
  }>;
  className?: string;
}

/**
 * Timeline component for timesheet workflow
 * 
 * Steps:
 * 1. draft (Draft)
 * 2. submitted (Submitted)
 * 3. under_review (Under Review)
 * 4. approved (Approved)
 * 5. sent (Sent to Agency)
 */
export function TimesheetStatusTimeline({
  currentStatus,
  statusHistory = [],
  className,
}: TimesheetStatusTimelineProps) {
  const steps: TimelineStep[] = [
    {
      status: "draft",
      label: "Draft",
      description: "Timesheet created and in preparation",
    },
    {
      status: "submitted",
      label: "Submitted",
      description: "Submitted for admin review",
    },
    {
      status: "under_review",
      label: "Under Review",
      description: "Being reviewed by administrator",
    },
    {
      status: "approved",
      label: "Approved",
      description: "Approved and ready to send to agency",
    },
    {
      status: "sent",
      label: "Sent to Agency",
      description: "Invoice created and sent to agency",
    },
  ];

  /**
   * Determines the state of a step relative to current status
   */
  const getStepState = (step: TimelineStep): "completed" | "current" | "upcoming" => {
    const statusOrder = ["draft", "submitted", "under_review", "approved", "sent"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(step.status);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  /**
   * Finds the date of a status transition
   */
  const getStepDate = (status: TimesheetStatus): string | null => {
    const historyItem = statusHistory.find((h) => h.toStatus === status);
    if (!historyItem) return null;

    const date = typeof historyItem.createdAt === "string" 
      ? new Date(historyItem.createdAt) 
      : historyItem.createdAt;

    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Timesheet Progress</CardTitle>
        <CardDescription>
          Track the stages of the timesheet workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {steps.map((step, index) => {
            const state = getStepState(step);
            const stepDate = getStepDate(step.status);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.status} className="relative flex gap-4">
                {/* Vertical line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-4 top-8 h-full w-0.5 -translate-x-1/2",
                      state === "completed" ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2",
                    state === "completed" && "border-primary bg-primary text-primary-foreground",
                    state === "current" && "border-primary bg-background text-primary",
                    state === "upcoming" && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {state === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : state === "current" ? (
                    <Circle className="h-4 w-4 fill-current" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={cn(
                        "font-medium",
                        state === "upcoming" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </h4>
                    {stepDate && (
                      <span className="text-xs text-muted-foreground">{stepDate}</span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      state === "upcoming" ? "text-muted-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Special statuses */}
        {["rejected", "changes_requested"].includes(currentStatus) && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <X className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {currentStatus === "rejected" && "Timesheet rejected"}
                  {currentStatus === "changes_requested" && "Changes requested"}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  The normal workflow has been interrupted
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
