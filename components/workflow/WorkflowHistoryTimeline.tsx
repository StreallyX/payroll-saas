"use client";

import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, AlertCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowEvent {
  id: string;
  action: string;
  fromState: string;
  toState: string;
  performedBy: string;
  performedByName?: string;
  performedAt: Date | string;
  reason?: string;
  metadata?: Record<string, any>;
}

interface WorkflowHistoryTimelineProps {
  events: WorkflowEvent[];
  className?: string;
}

/**
 * Get icon for workflow action
 */
const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes("approve")) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (actionLower.includes("reject")) return <XCircle className="h-5 w-5 text-red-600" />;
  if (actionLower.includes("submit")) return <Send className="h-5 w-5 text-blue-600" />;
  if (actionLower.includes("review")) return <Clock className="h-5 w-5 text-yellow-600" />;
  if (actionLower.includes("changes")) return <AlertCircle className="h-5 w-5 text-orange-600" />;
  
  return <Clock className="h-5 w-5 text-gray-600" />;
};

/**
 * Format action text
 */
const formatAction = (action: string): string => {
  return action
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function WorkflowHistoryTimeline({ events, className }: WorkflowHistoryTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No workflow history available
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline indicator */}
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0">
              {getActionIcon(event.action)}
            </div>
            {index !== events.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 my-2" />
            )}
          </div>

          {/* Event details */}
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">
                  {formatAction(event.action)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {event.performedByName || event.performedBy}
                  {" • "}
                  {format(
                    typeof event.performedAt === "string" 
                      ? new Date(event.performedAt) 
                      : event.performedAt,
                    "MMM dd, yyyy 'at' HH:mm"
                  )}
                </p>
                {event.reason && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    &quot;{event.reason}&quot;
                  </p>
                )}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="font-medium mb-1">Additional Details:</div>
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <div key={key} className="ml-2">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end text-xs text-muted-foreground">
                <span className="font-mono">{event.fromState}</span>
                <span className="text-gray-400">→</span>
                <span className="font-mono font-medium">{event.toState}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
