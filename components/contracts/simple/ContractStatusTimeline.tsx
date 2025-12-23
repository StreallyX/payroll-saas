"use client";

import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContractStatus } from "./ContractStatusBadge";

interface TimelineStep {
  status: ContractStatus;
  label: string;
  description: string;
}

interface ContractStatusTimelineProps {
  currentStatus: ContractStatus;
  statusHistory?: Array<{
    fromStatus: string;
    toStatus: string;
    createdAt: Date | string;
    reason?: string | null;
  }>;
  className?: string;
}

/**
 * Vertical timeline for the simplified contract workflow
 *
 * Steps:
 * 1. draft
 * 2. pending_admin_review
 * 3. completed
 * 4. active
 */
export function ContractStatusTimeline({
  currentStatus,
  statusHistory = [],
  className,
}: ContractStatusTimelineProps) {
  const steps: TimelineStep[] = [
    {
      status: "draft",
      label: "Draft",
      description: "Contract created and being prepared",
    },
    {
      status: "pending_admin_review",
      label: "Pending admin review",
      description: "Submitted for administrator validation",
    },
    {
      status: "completed",
      label: "Completed",
      description: "Validated and ready for activation",
    },
    {
      status: "active",
      label: "Active",
      description: "Contract is active and being executed",
    },
  ];

  /**
   * Determine the state of a step relative to the current status
   */
  const getStepState = (
    step: TimelineStep
  ): "completed" | "current" | "upcoming" => {
    const statusOrder = [
      "draft",
      "pending_admin_review",
      "completed",
      "active",
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(step.status);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  /**
   * Find the date of a status transition
   */
  const getStepDate = (status: ContractStatus): string | null => {
    const historyItem = statusHistory.find(
      (h) => h.toStatus === status
    );
    if (!historyItem) return null;

    const date =
      typeof historyItem.createdAt === "string"
        ? new Date(historyItem.createdAt)
        : historyItem.createdAt;

    return date.toLocaleDateString("en-GB", {
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
        <CardTitle>Contract progress</CardTitle>
        <CardDescription>
          Tracking the steps of the simplified workflow
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="relative space-y-6">
          {steps.map((step, index) => {
            const state = getStepState(step);
            const stepDate = getStepDate(step.status);
            const isLast = index === steps.length - 1;

            return (
              <div
                key={step.status}
                className="relative flex gap-4"
              >
                {/* Vertical line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-4 top-8 h-full w-0.5 -translate-x-1/2",
                      state === "completed"
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2",
                    state === "completed" &&
                      "border-primary bg-primary text-primary-foreground",
                    state === "current" &&
                      "border-primary bg-background text-primary",
                    state === "upcoming" &&
                      "border-muted bg-background text-muted-foreground"
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
                        state === "upcoming" &&
                          "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </h4>

                    {stepDate && (
                      <span className="text-xs text-muted-foreground">
                        {stepDate}
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      "text-sm mt-1 text-muted-foreground"
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
        {["cancelled", "paused", "terminated"].includes(
          currentStatus
        ) && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <X className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {currentStatus === "cancelled" &&
                    "Contract cancelled"}
                  {currentStatus === "paused" &&
                    "Contract paused"}
                  {currentStatus === "terminated" &&
                    "Contract terminated"}
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
