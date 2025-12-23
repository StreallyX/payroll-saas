"use client";

import { Check, Circle, User, Send, Eye, CheckCircle, XCircle, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineEvent {
  id: string;
  event: string;
  description: string;
  date: Date | string;
  user?: {
    name: string | null;
    email: string;
  } | null;
  icon?: React.ReactNode;
  color?: string;
}

interface TimesheetDetailedTimelineProps {
  timesheet: {
    createdAt: Date | string;
    submittedAt?: Date | string | null;
    approvedAt?: Date | string | null;
    sentAt?: Date | string | null;
    invoiceId?: string | null;
    submitter?: {
      name: string | null;
      email: string;
    } | null;
    workflowState?: string;
    status?: string;
  };
  statusHistory?: Array<{
    fromStatus: string;
    toStatus: string;
    createdAt: Date | string;
    reason?: string | null;
    changedByUser?: {
      name: string | null;
      email: string;
    } | null;
  }>;
  className?: string;
}

/**
 * Detailed timeline component showing all key timesheet events
 * Including who performed each action and when
 */
export function TimesheetDetailedTimeline({
  timesheet,
  statusHistory = [],
  className,
}: TimesheetDetailedTimelineProps) {
  
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Build timeline events from timesheet data and history
  const events: TimelineEvent[] = [];

  // Created event
  events.push({
    id: "created",
    event: "Created",
    description: "Timesheet created",
    date: timesheet.createdAt,
    user: timesheet.submitter,
    icon: <FileText className="h-4 w-4" />,
    color: "text-gray-600",
  });

  // Submitted event
  if (timesheet.submittedAt) {
    const submitHistory = statusHistory.find(h => h.toStatus === "submitted");
    events.push({
      id: "submitted",
      event: "Submitted",
      description: "Submitted for review",
      date: timesheet.submittedAt,
      user: submitHistory?.changedByUser || timesheet.submitter,
      icon: <Send className="h-4 w-4" />,
      color: "text-blue-600",
    });
  }

  // Under review event
  const reviewHistory = statusHistory.find(h => h.toStatus === "under_review");
  if (reviewHistory) {
    events.push({
      id: "under_review",
      event: "Under Review",
      description: "Marked for review",
      date: reviewHistory.createdAt,
      user: reviewHistory.changedByUser,
      icon: <Eye className="h-4 w-4" />,
      color: "text-yellow-600",
    });
  }

  // Approved event
  if (timesheet.approvedAt) {
    const approveHistory = statusHistory.find(h => h.toStatus === "approved");
    events.push({
      id: "approved",
      event: "Approved",
      description: "Timesheet approved",
      date: timesheet.approvedAt,
      user: approveHistory?.changedByUser,
      icon: <CheckCircle className="h-4 w-4" />,
      color: "text-green-600",
    });
  }

  // Sent/Invoice created event
  if (timesheet.sentAt || timesheet.invoiceId) {
    const sentHistory = statusHistory.find(h => h.toStatus === "sent");
    events.push({
      id: "sent",
      event: "Invoice Created",
      description: "Invoice generated and sent to agency",
      date: timesheet.sentAt || sentHistory?.createdAt || new Date(),
      user: sentHistory?.changedByUser,
      icon: <FileText className="h-4 w-4" />,
      color: "text-purple-600",
    });
  }

  // Rejected event
  const rejectedHistory = statusHistory.find(h => h.toStatus === "rejected");
  if (rejectedHistory) {
    events.push({
      id: "rejected",
      event: "Rejected",
      description: rejectedHistory.reason || "Timesheet rejected",
      date: rejectedHistory.createdAt,
      user: rejectedHistory.changedByUser,
      icon: <XCircle className="h-4 w-4" />,
      color: "text-red-600",
    });
  }

  // Changes requested event
  const changesHistory = statusHistory.find(h => h.toStatus === "changes_requested");
  if (changesHistory) {
    events.push({
      id: "changes_requested",
      event: "Changes Requested",
      description: changesHistory.reason || "Changes requested",
      date: changesHistory.createdAt,
      user: changesHistory.changedByUser,
      icon: <Clock className="h-4 w-4" />,
      color: "text-orange-600",
    });
  }

  // Sort events by date (newest first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          Complete history of timesheet events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-4 top-8 h-full w-0.5 -translate-x-1/2 bg-muted" />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-border bg-background",
                    event.color
                  )}
                >
                  {event.icon || <Circle className="h-4 w-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.event}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      {event.user && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{event.user.name || event.user.email}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDate(event.date)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No timeline events yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
