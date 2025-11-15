
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

const statusConfig: Record<string, { variant: StatusBadgeProps["variant"]; label: string }> = {
  // Contract statuses
  draft: { variant: "outline", label: "Draft" },
  pending: { variant: "secondary", label: "Pending" },
  active: { variant: "default", label: "Active" },
  completed: { variant: "secondary", label: "Completed" },
  cancelled: { variant: "destructive", label: "Cancelled" },
  terminated: { variant: "destructive", label: "Terminated" },
  
  // Invoice statuses
  unpaid: { variant: "destructive", label: "Unpaid" },
  paid: { variant: "default", label: "Paid" },
  overdue: { variant: "destructive", label: "Overdue" },
  partially_paid: { variant: "secondary", label: "Partially Paid" },
  
  // General statuses
  approved: { variant: "default", label: "Approved" },
  rejected: { variant: "destructive", label: "Rejected" },
  in_progress: { variant: "secondary", label: "In Progress" },
  on_hold: { variant: "outline", label: "On Hold" },
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const config = statusConfig[status?.toLowerCase()] || {
    variant: "outline",
    label: status || "Unknown",
  };

  return (
    <Badge
      variant={variant || config.variant}
      className={cn("capitalize", className)}
    >
      {config.label}
    </Badge>
  );
}
